// Real-time ASCII raymarcher.
// Signed distance fields are raymarched once per character cell; the brightness
// at each hit picks a glyph from RAMP. Drag rotates the object, click morphs it,
// and characters near the cursor glitch.

const RAMP = ' .:-=+*#%@';
const GLITCH = '01<>/\\{}[]$#&?!~^';
const BOUND = 1.5; // bounding-sphere radius for every shape
const CAM_Z = -4;

// ---------- SDF building blocks ----------
function seg(px, py, ax, ay, bx, by) {
  const pax = px - ax, pay = py - ay, bax = bx - ax, bay = by - ay;
  let h = (pax * bax + pay * bay) / (bax * bax + bay * bay);
  h = h < 0 ? 0 : h > 1 ? 1 : h;
  const dx = pax - bax * h, dy = pay - bay * h;
  return Math.sqrt(dx * dx + dy * dy);
}

// 2D distance to the strokes of "VDH" (letter height 1, centred on the origin)
function vdh2(x, y) {
  let lx = x + 1.05;
  let d = Math.min(seg(lx, y, -0.36, 0.5, 0, -0.5), seg(lx, y, 0.36, 0.5, 0, -0.5));
  lx = x + 0.1;
  d = Math.min(d, seg(lx, y, -0.3, -0.5, -0.3, 0.5), seg(lx, y, -0.3, 0.5, 0, 0.5), seg(lx, y, -0.3, -0.5, 0, -0.5));
  if (lx > 0) d = Math.min(d, Math.abs(Math.sqrt(lx * lx + y * y) - 0.5));
  lx = x - 1.05;
  d = Math.min(d, seg(lx, y, -0.3, -0.5, -0.3, 0.5), seg(lx, y, 0.3, -0.5, 0.3, 0.5), seg(lx, y, -0.3, 0, 0.3, 0));
  return d;
}

function sdVDH(x, y, z) {
  const s = 0.82;
  x /= s; y /= s; z /= s;
  const a = vdh2(x, y) - 0.12;
  const b = Math.abs(z) - 0.16;
  const ox = a > 0 ? a : 0, oz = b > 0 ? b : 0;
  return (Math.min(Math.max(a, b), 0) + Math.sqrt(ox * ox + oz * oz)) * s;
}

// a sphere carved by a flowing gyroid lattice
function sdGyroBall(x, y, z, t) {
  const r = Math.sqrt(x * x + y * y + z * z) - 1.2;
  const k = 2.3, ph = t * 0.6;
  const g = (Math.sin(x * k + ph) * Math.cos(y * k) + Math.sin(y * k + ph) * Math.cos(z * k) + Math.sin(z * k) * Math.cos(x * k + ph)) / k;
  return Math.max(r, Math.abs(g) - 0.06) * 0.8;
}

function boxFrame(x, y, z, b, e) {
  x = Math.abs(x) - b; y = Math.abs(y) - b; z = Math.abs(z) - b;
  const qx = Math.abs(x + e) - e, qy = Math.abs(y + e) - e, qz = Math.abs(z + e) - e;
  const f = (ax, ay, az) => {
    const mx = ax > 0 ? ax : 0, my = ay > 0 ? ay : 0, mz = az > 0 ? az : 0;
    return Math.sqrt(mx * mx + my * my + mz * mz) + Math.min(Math.max(ax, ay, az), 0);
  };
  return Math.min(f(x, qy, qz), f(qx, y, qz), f(qx, qy, z));
}

// a cube frame with a counter-rotating cube inside it
function sdHyper(x, y, z, t) {
  const outer = boxFrame(x, y, z, 0.82, 0.07);
  const a = t * 0.9, c = Math.cos(a), s = Math.sin(a);
  let ix = c * x - s * z, iz = s * x + c * z, iy = y;
  const c2 = Math.cos(a * 0.7), s2 = Math.sin(a * 0.7);
  const ty = c2 * iy - s2 * iz; iz = s2 * iy + c2 * iz; iy = ty;
  return Math.min(outer, boxFrame(ix, iy, iz, 0.42, 0.06));
}

// a square-section ring that twists as it goes around
function sdTwist(x, y, z, t) {
  const qx = Math.sqrt(x * x + z * z) - 0.9;
  const ang = Math.atan2(z, x) * 1.5 + t * 0.8;
  const c = Math.cos(ang), s = Math.sin(ang);
  const rx = Math.abs(c * qx - s * y) - 0.26, ry = Math.abs(s * qx + c * y) - 0.26;
  const mx = rx > 0 ? rx : 0, my = ry > 0 ? ry : 0;
  return (Math.sqrt(mx * mx + my * my) + Math.min(Math.max(rx, ry), 0) - 0.03) * 0.7;
}

export const SHAPES = [
  { name: 'vdh', f: sdVDH, sway: true },
  { name: 'gyroid', f: sdGyroBall },
  { name: 'hypercube', f: sdHyper },
  { name: 'twist', f: sdTwist },
];

const smooth = (v) => v * v * (3 - 2 * v);

export function createAscii(canvas, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext('2d', { alpha: true });
  const state = {
    W: 0, H: 0, dpr: 1, fs: 11, cw: 6.6, ch: 11, cols: 0, rows: 0,
    cx: 0, cy: 0, F: 400,
    yaw: 0.5, pitch: -0.25, yawVel: 0.35, pitchVel: 0, baseYaw: 0.35,
    t: 0, shape: 0, next: 0, morph: 1,
    mouse: { i: -999, j: -999, inside: false },
    palette: ['#c6ff3d', '#3ad7ff', '#ff4fd8'],
    running: false, visible: true, slowFrames: 0,
  };

  function layout() {
    const r = canvas.getBoundingClientRect();
    state.W = r.width; state.H = r.height;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * state.dpr);
    canvas.height = Math.round(r.height * state.dpr);
    const narrow = r.width < 820;
    if (!state.userFs) state.fs = narrow ? 9 : r.width > 1600 ? 12 : 11;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.font = `600 ${state.fs}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textBaseline = 'top';
    state.cw = ctx.measureText('M').width;
    state.ch = Math.round(state.fs * 1.12);
    state.cols = Math.ceil(r.width / state.cw);
    state.rows = Math.ceil(r.height / state.ch);
    // where the object sits and how big it is
    // on phones the hero is taller than the screen: anchor to the visible part
    const vh = Math.min(r.height, window.innerHeight);
    const R = narrow ? Math.min(r.width * 0.5, vh * 0.22) : Math.min(r.width * 0.23, r.height * 0.45);
    state.cx = narrow ? r.width * 0.5 : r.width * 0.73;
    state.cy = narrow ? 36 + vh * 0.25 : r.height * 0.5;
    state.F = R / 0.39;
  }

  function render() {
    const { cols, rows, cw, ch, cx, cy, F, t } = state;
    const cyw = Math.cos(state.yaw), syw = Math.sin(state.yaw);
    const cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
    // M = Ry(yaw) * Rx(pitch); we need M^T to move rays into object space
    const m00 = cyw, m01 = syw * sp, m02 = syw * cp;
    const m10 = 0, m11 = cp, m12 = -sp;
    const m20 = -syw, m21 = cyw * sp, m22 = cyw * cp;
    const tr = (x, y, z) => [m00 * x + m10 * y + m20 * z, m01 * x + m11 * y + m21 * z, m02 * x + m12 * y + m22 * z];
    const [ox, oy, oz] = tr(0, 0, CAM_Z);
    let [lx, ly, lz] = tr(-0.55, 0.7, -0.6);
    const ll = Math.hypot(lx, ly, lz); lx /= ll; ly /= ll; lz /= ll;

    const fa = SHAPES[state.shape].f, fb = SHAPES[state.next].f;
    const m = smooth(Math.min(1, Math.max(0, state.morph)));
    const sdf = m >= 1 ? (x, y, z) => fb(x, y, z, t)
      : m <= 0 ? (x, y, z) => fa(x, y, z, t)
      : (x, y, z) => fa(x, y, z, t) * (1 - m) + fb(x, y, z, t) * m;

    const mi = state.mouse.i, mj = state.mouse.j;
    const lines = new Array(rows);
    const glitches = [];
    const e = 0.0025;
    const rampMax = RAMP.length - 1;
    // screen-space bound: skip cells that cannot hit the bounding sphere
    const projR = (BOUND / Math.sqrt(CAM_Z * CAM_Z - BOUND * BOUND)) * F + cw * 2;

    for (let j = 0; j < rows; j++) {
      const py = (j + 0.5) * ch;
      const vy = -(py - cy) / F;
      let line = '';
      const dyPix = py - cy;
      if (Math.abs(dyPix) > projR) { lines[j] = ''; continue; }
      const half = Math.sqrt(projR * projR - dyPix * dyPix);
      const i0 = Math.max(0, Math.floor((cx - half) / cw));
      const i1 = Math.min(cols - 1, Math.ceil((cx + half) / cw));
      line = ' '.repeat(i0);
      for (let i = i0; i <= i1; i++) {
        const vx = ((i + 0.5) * cw - cx) / F;
        const inv = 1 / Math.sqrt(vx * vx + vy * vy + 1);
        const [dx, dy, dz] = tr(vx * inv, vy * inv, inv);
        // ray vs bounding sphere
        const b = ox * dx + oy * dy + oz * dz;
        const c = ox * ox + oy * oy + oz * oz - BOUND * BOUND;
        const h = b * b - c;
        if (h < 0) { line += ' '; continue; }
        const sh = Math.sqrt(h);
        let tt = -b - sh; const tEnd = -b + sh;
        let hit = false, px = 0, py3 = 0, pz = 0;
        for (let s = 0; s < 64 && tt < tEnd; s++) {
          px = ox + dx * tt; py3 = oy + dy * tt; pz = oz + dz * tt;
          const d = sdf(px, py3, pz);
          if (d < 0.004) { hit = true; break; }
          tt += d;
        }
        if (!hit) { line += ' '; continue; }
        // normal (tetrahedron trick)
        const a1 = sdf(px + e, py3 - e, pz - e), a2 = sdf(px - e, py3 - e, pz + e);
        const a3 = sdf(px - e, py3 + e, pz - e), a4 = sdf(px + e, py3 + e, pz + e);
        let nx = a1 - a2 - a3 + a4, ny = -a1 - a2 + a3 + a4, nz = -a1 + a2 - a3 + a4;
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
        // specular (Blinn) + rim
        let hx = lx - dx, hy = ly - dy, hz = lz - dz;
        const hl = Math.hypot(hx, hy, hz) || 1; hx /= hl; hy /= hl; hz /= hl;
        const spec = Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), 24);
        const rim = Math.pow(1 - Math.abs(nx * dx + ny * dy + nz * dz), 3);
        const lum = 0.08 + 0.8 * diff + 0.45 * spec + 0.2 * rim;
        let idx = 1 + Math.floor(Math.min(0.999, Math.max(0, lum)) * rampMax);
        if (idx > rampMax) idx = rampMax;
        const gi = (i - mi) / 7, gj = (j - mj) / 3.5;
        if (gi * gi + gj * gj < 1 && Math.random() < 0.55) {
          glitches.push(i, j);
          line += ' ';
        } else line += RAMP[idx];
      }
      lines[j] = line;
    }

    // draw
    const { W, H } = state;
    ctx.clearRect(0, 0, W, H);
    const ang = t * 0.4;
    const gx = Math.cos(ang) * projR, gy = Math.sin(ang) * projR;
    const g = ctx.createLinearGradient(cx - gx, cy - gy, cx + gx, cy + gy);
    g.addColorStop(0, state.palette[0]);
    g.addColorStop(0.5, state.palette[1]);
    g.addColorStop(1, state.palette[2]);
    ctx.fillStyle = g;
    for (let j = 0; j < rows; j++) if (lines[j]) ctx.fillText(lines[j], 0, j * ch);
    ctx.fillStyle = state.palette[0];
    for (let k = 0; k < glitches.length; k += 2) {
      ctx.fillText(GLITCH[(Math.random() * GLITCH.length) | 0], glitches[k] * cw, glitches[k + 1] * ch);
    }
  }

  // ---------- loop ----------
  let last = 0, acc = 0, raf = 0;
  const FRAME = 1000 / 30;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!state.visible || document.hidden) { last = now; return; }
    const dt = Math.min(100, now - (last || now));
    last = now; acc += dt;
    if (acc < FRAME) return;
    const step = acc / 1000; acc = 0;
    if (!reducedMotion) state.t += step;
    if (!dragging && SHAPES[state.next].sway) {
      // letters: sway around facing the viewer instead of spinning
      state.yaw = Math.atan2(Math.sin(state.yaw), Math.cos(state.yaw));
      const target = Math.sin(state.t * 0.5) * 0.55;
      state.yawVel += ((target - state.yaw) * 2.2 - state.yawVel) * Math.min(1, step * 3);
      state.pitchVel *= Math.pow(0.1, step);
      state.pitch += (-0.12 - state.pitch) * Math.min(1, step * 0.8);
    } else if (!dragging) {
      state.yawVel += ((reducedMotion ? 0 : state.baseYaw) - state.yawVel) * Math.min(1, step * 1.5);
      state.pitchVel *= Math.pow(0.1, step);
      state.pitch += (-0.25 - state.pitch) * Math.min(1, step * 0.8);
    }
    state.yaw += state.yawVel * step;
    state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch + state.pitchVel * step));
    if (state.morph < 1) {
      state.morph += step / 1.1;
      if (state.morph >= 1) { state.shape = state.next; state.morph = 1; }
    }
    const t0 = performance.now();
    render();
    adapt(performance.now() - t0);
  }

  // Bigger glyphs = fewer cells = faster frames on slow devices.
  function adapt(ms) {
    if (ms > 26) state.slowFrames++; else state.slowFrames = Math.max(0, state.slowFrames - 1);
    if (state.slowFrames > 12 && state.fs < 16) {
      state.userFs = true; state.fs += 1; state.slowFrames = 0; layout();
    }
  }

  // ---------- interaction ----------
  let dragging = false, moved = 0, lastX = 0, lastY = 0, lastT = 0;
  const host = canvas.parentElement;

  function cellFromEvent(ev) {
    const r = canvas.getBoundingClientRect();
    state.mouse.i = Math.floor((ev.clientX - r.left) / state.cw);
    state.mouse.j = Math.floor((ev.clientY - r.top) / state.ch);
  }

  const isUi = (el) => el.closest('a, button, input, [data-no-drag]');

  host.addEventListener('pointerdown', (ev) => {
    if (isUi(ev.target)) return;
    dragging = true; moved = 0;
    lastX = ev.clientX; lastY = ev.clientY; lastT = performance.now();
  });
  window.addEventListener('pointermove', (ev) => {
    cellFromEvent(ev);
    if (!dragging) return;
    const now = performance.now(), dt = Math.max(8, now - lastT) / 1000;
    const dx = ev.clientX - lastX, dy = ev.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    state.yaw += dx * 0.008; state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch + dy * 0.008));
    state.yawVel = (dx * 0.008) / dt; state.pitchVel = (dy * 0.008) / dt;
    lastX = ev.clientX; lastY = ev.clientY; lastT = now;
  }, { passive: true });
  const end = () => {
    if (dragging && moved < 6) api.next();
    dragging = false;
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', () => { dragging = false; });
  host.addEventListener('pointerleave', () => { state.mouse.i = -999; });

  const ro = new ResizeObserver(() => { layout(); render(); });
  ro.observe(canvas);
  const io = new IntersectionObserver(([en]) => { state.visible = en.isIntersecting; });
  io.observe(canvas);

  const api = {
    next(to) {
      if (state.morph < 1) state.shape = state.next;
      const idx = typeof to === 'number' ? to : (state.shape + 1) % SHAPES.length;
      if (idx === state.shape) return SHAPES[idx].name;
      state.next = idx; state.morph = 0;
      state.yawVel += 3; // a little kick
      return SHAPES[idx].name;
    },
    shapes: () => SHAPES.map((s) => s.name),
    setPalette(p) { state.palette = p; if (!state.running) render(); },
    spin(v = 12) { state.yawVel = v; },
    start() {
      if (state.running) return;
      state.running = true; layout(); render(); raf = requestAnimationFrame(frame);
    },
  };
  return api;
}

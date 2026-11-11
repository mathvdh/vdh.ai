// Career as a `git log --graph`: an SVG lane graph + clickable commits + a `git show` panel.
import { COMMITS, BRANCHES, PERSON } from './data.js';

const NS = 'http://www.w3.org/2000/svg';
const LANE_W = 22;
const LANE_X0 = 14;
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderShow(c) {
  const s = c.show || {};
  const refs = c.refs.length ? ` <span class="show__refs">(${c.refs.map(esc).join(', ')})</span>` : '';
  const meta = [
    ['Author', `${PERSON.name} &lt;${PERSON.email}&gt;`],
    s.role && ['Role', esc(s.role)],
    s.where && ['Where', esc(s.where)],
    ['Date', esc(s.date || c.year)],
    s.url && ['Url', `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.url.replace(/^https?:\/\/(www\.)?/, ''))}</a>`],
  ].filter(Boolean).map(([k, v]) => `<span class="show__k">${k}:</span>${' '.repeat(8 - k.length)}${v}`).join('\n');
  const diff = (s.diff || []).map(([sign, txt]) => `<span class="show__${sign === '+' ? 'add' : sign === '-' ? 'del' : 'mod'}">${sign} ${esc(txt)}</span>`).join('\n');
  let cta = '';
  if (s.cta?.href) cta = `\n\n<a class="show__cta" href="${s.cta.href}">→ ${esc(s.cta.label)}</a>`;
  if (s.cta?.note) cta = `\n\n<button class="show__cta" data-open-note="${s.cta.note}">→ ${esc(s.cta.label)}</button>`;
  return `<pre class="show__pre"><span class="show__commit">commit ${c.hash}</span>${refs}${c.merge ? `\n<span class="show__k">Merge:</span>  ${c.parents.map((p) => COMMITS.find((x) => x.id === p).hash).join(' ')}` : ''}
${meta}
<span class="show__body">${esc(s.body || c.msg)}</span><span class="show__dim">diff --git a/before b/after</span>
${diff}${cta}</pre>`;
}

export function mountGitLog(root, { onNote } = {}) {
  const list = root.querySelector('.log__list');
  const aside = root.querySelector('.log__aside');
  const byId = Object.fromEntries(COMMITS.map((c, i) => [c.id, { ...c, row: i }]));
  const maxLane = Math.max(...COMMITS.map((c) => c.lane));
  list.style.setProperty('--lanes', `${LANE_X0 + maxLane * LANE_W + 18}px`);

  const svg = document.createElementNS(NS, 'svg');
  svg.classList.add('log__svg');
  svg.setAttribute('aria-hidden', 'true');
  list.append(svg);

  const ol = document.createElement('ol');
  ol.className = 'log__rows';
  const rows = {};
  for (const c of COMMITS) {
    const li = document.createElement('li');
    li.className = 'log__item';
    const btn = document.createElement('button');
    btn.className = 'log__row';
    btn.type = 'button';
    btn.dataset.id = c.id;
    btn.style.setProperty('--c', BRANCHES[c.branch]);
    const refs = c.refs.map((r) => {
      const name = r.replace('HEAD -> ', '');
      const head = r.startsWith('HEAD') ? '<b class="ref__head">HEAD -&gt;</b> ' : '';
      return `<span class="ref" style="--c:${BRANCHES[name] || BRANCHES[c.branch]}">${head}${esc(name)}</span>`;
    }).join(' ');
    btn.innerHTML = `<span class="log__hash">${c.hash}</span>${refs ? ` <span class="log__refs">(${refs})</span>` : ''} <span class="log__msg">${esc(c.msg)}</span><span class="log__year">${esc(c.year)}</span>`;
    btn.setAttribute('aria-controls', 'git-show');
    li.append(btn);
    ol.append(li);
    rows[c.id] = btn;
  }
  list.append(ol);

  const show = document.createElement('div');
  show.className = 'show';
  show.id = 'git-show';
  show.setAttribute('aria-live', 'polite');

  // Desktop: sticky side panel. Mobile: panel opens under the selected commit.
  const wide = window.matchMedia('(min-width: 1000px)');
  let current = null;
  function place() {
    if (wide.matches) aside.append(show);
    else if (current) rows[current].parentElement.append(show);
    draw();
  }

  function select(id, { focus = false } = {}) {
    current = id;
    for (const [k, b] of Object.entries(rows)) {
      b.classList.toggle('is-active', k === id);
      b.setAttribute('aria-expanded', String(k === id));
    }
    show.innerHTML = renderShow(byId[id]);
    show.style.setProperty('--c', BRANCHES[byId[id].branch]);
    show.classList.remove('is-in'); void show.offsetWidth; show.classList.add('is-in');
    place();
    if (focus) rows[id].focus();
  }

  ol.addEventListener('click', (e) => {
    const b = e.target.closest('.log__row');
    if (b) select(b.dataset.id);
  });
  show.addEventListener('click', (e) => {
    const n = e.target.closest('[data-open-note]');
    if (n && onNote) onNote(n.dataset.openNote);
  });
  // j/k or arrows move through history
  ol.addEventListener('keydown', (e) => {
    const idx = COMMITS.findIndex((c) => c.id === current);
    let n = -1;
    if (e.key === 'ArrowDown' || e.key === 'j') n = Math.min(COMMITS.length - 1, idx + 1);
    if (e.key === 'ArrowUp' || e.key === 'k') n = Math.max(0, idx - 1);
    if (n >= 0) { e.preventDefault(); select(COMMITS[n].id, { focus: true }); }
  });

  function draw() {
    const box = list.getBoundingClientRect();
    const pos = {};
    for (const c of COMMITS) {
      const r = rows[c.id].getBoundingClientRect();
      pos[c.id] = { x: LANE_X0 + c.lane * LANE_W, y: r.top - box.top + Math.min(r.height / 2, 22) };
    }
    svg.setAttribute('width', box.width);
    svg.setAttribute('height', box.height);
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const bend = 26;
    let paths = '';
    let nodes = '';
    COMMITS.forEach((c, i) => {
      const a = pos[c.id];
      c.parents.forEach((pid) => {
        const p = byId[pid], b = pos[pid];
        let d, color;
        if (p.lane === c.lane) {
          d = `M${a.x} ${a.y} L${b.x} ${b.y}`;
          color = BRANCHES[c.branch];
        } else if (p.lane > c.lane) {
          // merge: leave the child sideways, then run down the branch lane
          d = `M${a.x} ${a.y} C${a.x} ${a.y + bend * 0.6} ${b.x} ${a.y + bend * 0.4} ${b.x} ${a.y + bend} L${b.x} ${b.y}`;
          color = BRANCHES[p.branch];
        } else {
          // fork: run down the branch lane, then curve into the parent
          d = `M${a.x} ${a.y} L${a.x} ${b.y - bend} C${a.x} ${b.y - bend * 0.4} ${b.x} ${b.y - bend * 0.6} ${b.x} ${b.y}`;
          color = BRANCHES[c.branch];
        }
        paths += `<path d="${d}" pathLength="1" style="--c:${color};--i:${COMMITS.length - i}"/>`;
      });
      const r = c.id === 'head' ? 6 : 5;
      const ring = c.id === 'head' ? `<circle class="log__pulse" cx="${a.x}" cy="${a.y}" r="${r}" style="--c:${BRANCHES[c.branch]}"/>` : '';
      nodes += `${ring}<circle class="log__node${c.merge ? ' is-merge' : ''}" cx="${a.x}" cy="${a.y}" r="${r}" style="--c:${BRANCHES[c.branch]};--i:${COMMITS.length - i}"/>`;
    });
    svg.innerHTML = paths + nodes;
  }

  new ResizeObserver(() => draw()).observe(list);
  wide.addEventListener('change', place);
  new IntersectionObserver(([en], obs) => {
    if (en.isIntersecting) { list.classList.add('is-drawn'); obs.disconnect(); }
  }, { threshold: 0.15 }).observe(list);

  select('head');
  if (document.fonts) document.fonts.ready.then(draw);
  return { select, ids: () => COMMITS.map((c) => c.id) };
}

import { createAscii } from './ascii.js';
import { mountGitLog } from './gitlog.js';
import { mountNotes } from './notes.js';
import { mountTerminal } from './term.js';
import { PERSON } from './data.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
document.documentElement.classList.add('js');

// ---------- themes ----------
const THEMES = {
  lime: ['#c6ff3d', '#3ad7ff', '#ff4fd8'],
  amber: ['#ffb000', '#ff5f1f', '#ffe08a'],
  cyan: ['#3ad7ff', '#7c5cff', '#c6ff3d'],
  magenta: ['#ff4fd8', '#ffb000', '#3ad7ff'],
  mono: ['#f2f0ea', '#8a8a92', '#f2f0ea'],
};
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
let theme = THEMES[store.get('vdh-theme')] ? store.get('vdh-theme') : 'lime';

// ---------- ASCII hero ----------
const ascii = createAscii($('.hero__ascii'), { reducedMotion: reduced });
const shapeLabel = $('[data-shape-name]');
const origNext = ascii.next;
ascii.next = (i) => { const n = origNext(i); if (shapeLabel) shapeLabel.textContent = n; return n; };

function setTheme(name) {
  if (!THEMES[name]) return false;
  theme = name;
  document.documentElement.style.setProperty('--accent', THEMES[name][0]);
  document.documentElement.dataset.theme = name;
  ascii.setPalette(THEMES[name]);
  store.set('vdh-theme', name);
  return true;
}
setTheme(theme);
const startAscii = () => ascii.start();
if (document.fonts) document.fonts.ready.then(startAscii); else startAscii();

// slowly morph on its own, unless the visitor is playing with it
if (!reduced) {
  let idle = 0;
  ['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, () => { idle = 0; }));
  setInterval(() => { if (++idle >= 3 && !document.hidden) { idle = 0; ascii.next(); } }, 4000);
}

// ---------- name scramble ----------
const GLYPHS = '!<>-_\\/[]{}—=+*^?#01アイウエオ$%&';
function scramble(el, { delay = 0, speed = 1 } = {}) {
  const target = el.dataset.text || el.textContent;
  el.dataset.text = target;
  if (reduced) { el.textContent = target; return; }
  let frame = -delay;
  const total = target.length * 3 / speed + 18;
  const tick = () => {
    frame++;
    let s = '';
    for (let i = 0; i < target.length; i++) {
      const reveal = i * 3 / speed + 12;
      if (target[i] === ' ' || frame >= reveal) s += target[i];
      else if (frame < 0) s += ' ';
      else s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = s;
    if (frame < total) requestAnimationFrame(tick);
  };
  tick();
}
$$('[data-scramble]').forEach((el, i) => scramble(el, { delay: i * 10 }));
$$('.nav a, .btn').forEach((el) => {
  const label = el.querySelector('.scr');
  if (label) el.addEventListener('mouseenter', () => scramble(label, { speed: 3 }));
});

// ---------- typed section commands ----------
$$('.cmd__text').forEach((el) => el.style.setProperty('--n', el.textContent.length));
const typed = new IntersectionObserver((ents) => ents.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add('is-in'); typed.unobserve(en.target); }
}), { threshold: 0.6 });
$$('.cmd').forEach((el) => typed.observe(el));

// ---------- clock ----------
const clock = $('.bar__clock');
const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/London' });
const tickClock = () => { if (clock) clock.textContent = `LON ${fmt.format(new Date())}`; };
tickClock(); setInterval(tickClock, 1000);

// ---------- active window in the status bar ----------
const navLinks = $$('.nav a');
const spy = new IntersectionObserver((ents) => ents.forEach((en) => {
  if (!en.isIntersecting) return;
  navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id]').forEach((s) => spy.observe(s));

// ---------- notes + git log ----------
const notes = mountNotes($('#notes-list'), $('#reader'));
const log = mountGitLog($('#log'), { onNote: (slug) => notes.open(slug) });

// ---------- terminal ----------
const termEl = $('#term');
const term = mountTerminal(termEl, {
  ascii,
  openNote: (slug) => { closeTerm(); return notes.open(slug); },
  showCommit: (id) => log.select(id),
  setTheme,
  theme: () => theme,
  themes: () => Object.keys(THEMES),
  collapse,
  close: () => closeTerm(),
});
let lastFocus = null;
function openTerm() {
  if (termEl.classList.contains('is-open')) return;
  lastFocus = document.activeElement;
  termEl.hidden = false;
  requestAnimationFrame(() => termEl.classList.add('is-open'));
  term.onOpen();
}
function closeTerm() {
  if (!termEl.classList.contains('is-open')) return;
  termEl.classList.remove('is-open');
  setTimeout(() => { if (!termEl.classList.contains('is-open')) termEl.hidden = true; }, 260);
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}
$$('[data-term-open]').forEach((b) => b.addEventListener('click', openTerm));
$('.term__x').addEventListener('click', closeTerm);
window.addEventListener('keydown', (e) => {
  const typing = e.target.closest?.('input, textarea, [contenteditable]');
  if ((e.key === '~' || e.key === '`') && !$('#reader').open) {
    if (typing && e.target !== $('.term__in')) return;
    e.preventDefault();
    termEl.classList.contains('is-open') ? closeTerm() : openTerm();
  }
  if (e.key === 'Escape' && termEl.classList.contains('is-open')) closeTerm();
});

// ---------- rm -rf / ----------
function collapse() {
  if (reduced) return;
  const targets = $$('main > section, .band, .foot');
  document.body.classList.add('is-collapsing');
  targets.forEach((el) => {
    el.style.transition = 'transform 1.1s cubic-bezier(.55,0,.9,.4), opacity 1.1s';
    el.style.transform = `translateY(${110 + Math.random() * 40}vh) rotate(${(Math.random() - 0.5) * 50}deg)`;
    el.style.opacity = '0.2';
  });
  ascii.spin(30);
  setTimeout(() => {
    targets.forEach((el) => {
      el.style.transition = 'transform .9s cubic-bezier(.2,1.4,.4,1), opacity .6s';
      el.style.transform = ''; el.style.opacity = '';
    });
    setTimeout(() => {
      document.body.classList.remove('is-collapsing');
      targets.forEach((el) => { el.style.transition = ''; });
    }, 950);
  }, 2200);
}

// ---------- contact ----------
$$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'copied ✓'; }
  catch { b.textContent = 'select + ⌘C'; }
  setTimeout(() => { b.textContent = 'copy'; }, 1600);
}));

const pingOut = $('.ping__out');
if (pingOut) {
  const lines = [
    `PING ${PERSON.email} (127.0.0.1): 56 data bytes`,
    '64 bytes from mathieu: icmp_seq=0 ttl=64 time=☕ ms',
    '64 bytes from mathieu: icmp_seq=1 ttl=64 time=🏃 ms',
    '64 bytes from mathieu: icmp_seq=2 ttl=64 time=💡 ms',
    '--- 3 packets transmitted, 3 received, 0.0% packet loss ---',
  ];
  new IntersectionObserver(([en], obs) => {
    if (!en.isIntersecting) return;
    obs.disconnect();
    if (reduced) { pingOut.textContent = lines.join('\n'); return; }
    lines.forEach((l, i) => setTimeout(() => { pingOut.textContent += (i ? '\n' : '') + l; }, i * 450));
  }, { threshold: 0.4 }).observe(pingOut);
}

// ---------- deep links: #notes/<slug>, #log/<branch> ----------
function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  const [sec, arg] = h.split('/');
  if (sec === 'notes' && arg) notes.open(arg);
  if (sec === 'log' && arg) {
    const map = { digicracy: 'dig', b40lux: 'b40', dcy: 'dcy', 'vdh-ltd': 'vdh' };
    log.select(map[arg] || arg);
    $('#log').scrollIntoView();
  }
}
route();
window.addEventListener('hashchange', route);

// ---------- hello, fellow dev ----------
console.log(
  `%c${'VDH'}%c\nYou opened the console. We should probably talk: ${PERSON.email}\n(or press ~ on the page for a shell)`,
  'font: 800 40px JetBrains Mono, monospace; color: #c6ff3d; text-shadow: 3px 3px 0 #ff4fd8',
  'font: 13px JetBrains Mono, monospace; color: inherit',
);

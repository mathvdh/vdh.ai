// ~/notes: an `ls -l` style listing plus a `less`-style reader dialog.
import { NOTES } from './data.js';
import { esc } from './gitlog.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const size = (s) => (s.length >= 1000 ? `${(s.length / 1000).toFixed(1)}K` : `${s.length}`).padStart(5);
const lsDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${String(d).padStart(2)}  ${y}`;
};

export function mdToHtml(src) {
  return src.split(/\n{2,}/).map((block) => {
    const lines = block.split('\n');
    if (lines.every((l) => l.startsWith('- '))) {
      return `<ul>${lines.map((l) => `<li>${esc(l.slice(2))}</li>`).join('')}</ul>`;
    }
    if (block.startsWith('## ')) return `<h3><span class="md-mark">## </span>${esc(block.slice(3))}</h3>`;
    return `<p>${esc(block)}</p>`;
  }).join('');
}

export function lsLine(n) {
  return `-rw-r--r--  1 math  staff ${size(n.body)}  ${lsDate(n.date)}  ${n.slug}.md`;
}

export function mountNotes(listEl, dialog) {
  const body = dialog.querySelector('.reader__body');
  const path = dialog.querySelector('.reader__path');
  const pct = dialog.querySelector('.reader__pct');
  let lastFocus = null;

  const total = NOTES.reduce((a, n) => a + n.body.length, 0);
  listEl.innerHTML = `<p class="notes__total">total ${Math.ceil(total / 1024)}</p><ul class="notes__list">${NOTES.map((n) => `
    <li><button type="button" class="notes__row" data-note="${n.slug}">
      <span class="notes__perm">-rw-r--r--  1 math  staff</span>
      <span class="notes__size">${size(n.body)}</span>
      <span class="notes__date">${lsDate(n.date)}</span>
      <span class="notes__name">${n.slug}.md</span>
      <span class="notes__title">${esc(n.title)}</span>
    </button></li>`).join('')}</ul>`;

  listEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-note]');
    if (b) open(b.dataset.note);
  });

  function open(slug) {
    const n = NOTES.find((x) => x.slug === slug);
    if (!n) return false;
    lastFocus = document.activeElement;
    path.textContent = `~/notes/${n.slug}.md`;
    body.innerHTML = `<header><p class="reader__meta">${esc(n.date)} · ${Math.max(1, Math.round(n.body.split(/\s+/).length / 220))} min read</p><h2>${esc(n.title)}</h2></header>${mdToHtml(n.body)}<p class="reader__end">(END)</p>`;
    body.scrollTop = 0;
    if (!dialog.open) dialog.showModal();
    history.replaceState(null, '', `#notes/${n.slug}`);
    updatePct();
    return true;
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  function updatePct() {
    const max = body.scrollHeight - body.clientHeight;
    pct.textContent = max <= 0 ? '100%' : `${Math.round((body.scrollTop / max) * 100)}%`;
  }

  body.addEventListener('scroll', updatePct, { passive: true });
  dialog.addEventListener('close', () => {
    if (location.hash.startsWith('#notes/')) history.replaceState(null, '', '#notes');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-reader-close]')) close();
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'q') { e.preventDefault(); close(); }
    if (e.key === 'j') body.scrollBy({ top: 60 });
    if (e.key === 'k') body.scrollBy({ top: -60 });
    if (e.key === ' ') { e.preventDefault(); body.scrollBy({ top: body.clientHeight * 0.85, behavior: 'smooth' }); }
  });

  return { open, close, list: () => NOTES };
}

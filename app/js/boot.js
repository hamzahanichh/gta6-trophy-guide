/* boot.js — the entry point: loads the trophy list, builds the shared context (the store, derived tags, the
   missable windows), paints the census and the platinum strip on every view, starts the router and wires the
   global keys: / focuses search, Escape goes back. (Enter and Space live on each row.) */

import { startRouter } from './router.js';
import { createStore } from './state.js';
import { deriveTags } from './derive-tags.js';
import { deriveMissables } from './derive-missables.js';
import { isMasked } from './spoiler-filter.js';

const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

const doc = await (await fetch('data/trophies.json')).json();
const store = createStore();
const tags = deriveTags(doc.trophies);

const ctx = {
  data: doc,
  trophies: doc.trophies,
  byId: new Map(doc.trophies.map((t) => [t.id, t])),
  byName: new Map(doc.trophies.map((t) => [t.name, t])),
  tags,
  store,
  missables: deriveMissables(doc.trophies, tags),
  revealed: new Set(),
  toast: showToast,
  route: null,
  viewName: null,
  focusSearch: null,
  onEscape: null,
  jumpTo: null,
  wantSearch: false,
};

/* — the census: n of 55, plus the grade-by-grade count — */
const census = document.getElementById('census');

function paintCensus() {
  const earned = ctx.trophies.filter((t) => store.has(t.id));
  const byGrade = Object.fromEntries(GRADES.map((g) => [g, 0]));
  for (const t of earned) byGrade[t.grade]++;
  const big = document.createElement('div');
  big.className = 'big num';
  const n = document.createElement('span');
  n.textContent = String(earned.length);
  const of = document.createElement('span');
  of.className = 'of';
  of.textContent = ` of ${ctx.trophies.length}`;
  big.append(n, of);
  const sub = document.createElement('span');
  sub.className = 'sub';
  sub.textContent = earned.length === ctx.trophies.length ? 'platinum unlocked' : 'earned';
  big.append(sub);

  const grades = document.createElement('div');
  grades.className = 'grades';
  for (const g of GRADES) {
    const s = document.createElement('span');
    s.className = 'g';
    s.dataset.grade = g;
    const i = document.createElement('i');
    const b = document.createElement('b');
    b.textContent = `${byGrade[g]}/${ctx.trophies.filter((t) => t.grade === g).length}`;
    s.append(i, `${g[0].toUpperCase()} `, b);
    grades.append(s);
  }
  census.replaceChildren(big, grades);
}

/* — the platinum strip: 55 ticks in official order; filled by grade when earned, hollow when not,
     amber dot for a possible missable; clicking a tick jumps to that trophy — */
const strip = document.getElementById('strip');
const missIds = new Set(ctx.missables.candidates.map((c) => c.id));
const ticks = new Map();

for (const t of ctx.trophies) {
  const tick = document.createElement('button');
  tick.type = 'button';
  tick.className = 'tick';
  tick.dataset.grade = t.grade;
  if (missIds.has(t.id)) tick.dataset.missable = '';
  const bar = document.createElement('i');
  tick.append(bar);
  tick.addEventListener('click', () => {
    if (ctx.viewName === 'tracker') ctx.jumpTo?.(t.id);
    else location.hash = '#/trophy/' + t.id;
  });
  ticks.set(t.id, tick);
  strip.append(tick);
}

function paintStrip() {
  for (const t of ctx.trophies) {
    const tick = ticks.get(t.id);
    const earned = store.has(t.id);
    tick.toggleAttribute('data-earned', earned);
    const masked = isMasked(t, ctx.tags, store, store.settings) && !ctx.revealed.has(t.id);
    const label = masked
      ? `${t.grade} trophy, censored by the spoiler setting${missIds.has(t.id) ? ' (possible missable, status open)' : ''}`
      : `${t.name} — ${t.grade}, ${earned ? 'earned' : 'not earned'}${missIds.has(t.id) ? ' (possible missable, status open)' : ''}`;
    tick.title = label;
    tick.setAttribute('aria-label', label);
  }
}

store.subscribe(() => {
  paintCensus();
  paintStrip();
});

/* — the toast — */
const toastEl = document.getElementById('toast');
let toastTimer = 0;

function showToast(text, tone) {
  toastEl.textContent = text;
  toastEl.dataset.tone = tone ?? '';
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, 4200);
}

/* — global keys: / focuses the tracker's search, Escape lets the view go back — */
window.addEventListener('keydown', (event) => {
  const target = event.target;
  const typing = target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
  if (event.key === '/' && !typing) {
    event.preventDefault();
    if (ctx.viewName !== 'tracker') {
      ctx.wantSearch = true;
      location.hash = '#/';
    } else {
      ctx.focusSearch?.();
    }
  } else if (event.key === 'Escape') {
    ctx.onEscape?.();
  }
});

paintCensus();
paintStrip();
startRouter(ctx);

/* — the settings drawer: the nav's Settings link opens settings over the current view — the tracker keeps
      its rows, censored ones included, behind it — instead of navigating away. The #/settings hash stays
      the full-page deep link, and any real navigation closes the drawer (drawer.js listens for that). */
const settingsLink = document.querySelector('#nav a[data-view="settings"]');
settingsLink?.addEventListener('click', (event) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (ctx.viewName === 'settings') return;
  event.preventDefault();
  import('./drawer.js').then((m) => m.toggleSettingsDrawer(ctx, settingsLink));
});

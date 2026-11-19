/* view-tracker.js — the default view: search, filter chips, sort, the list of all 55 with grade medals,
   badges, inline guide panels, spoiler masks with per-row reveal — with the filter state kept in the hash
   (#/?f=missable&q=stunt&s=grade), re-parsed on every hashchange. */

import { SOURCE_LABELS, TAG_LABELS } from './derive-tags.js';
import { isMasked, censorText } from './spoiler-filter.js';

const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'story', label: 'Story' },
  { key: 'missable', label: 'Missable', dot: true },
  { key: 'collectibles', label: 'Collectibles' },
  { key: 'activities', label: 'Activities' },
];

const SORTS = [
  ['official', 'Official order'],
  ['grade', 'Grade (P to B)'],
  ['name', 'Name (A to Z)'],
  ['earned', 'Earned first'],
];

const ICONS = {
  search: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7" cy="7" r="4.6"/><path d="M10.6 10.6 14 14"/></svg>',
  eye: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1.5 8s2.6-4.4 6.5-4.4S14.5 8 14.5 8 11.9 12.4 8 12.4 1.5 8 1.5 8Z"/><circle cx="8" cy="8" r="2.1"/><path d="M2.5 13.5l11-11"/></svg>',
  warn: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.6 15 14H1L8 1.6Zm-.9 4.6v4h1.8v-4H7.1Zm0 5.2v1.7h1.8v-1.7H7.1Z"/></svg>',
  check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M2.8 8.6 6.2 12 13.2 4"/></svg>',
};

const el = (tag, cls) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
};

const svg = (markup) => {
  const span = el('span', 'ic');
  span.innerHTML = markup;
  return span.firstChild;
};

/** A small medal glyph: a circle in the grade's colour with the grade's initial. */
function medal(t, big = false) {
  const m = el('span', 'medal' + (big ? ' lg' : ''));
  m.dataset.grade = t.grade;
  m.textContent = t.grade[0].toUpperCase();
  m.setAttribute('aria-hidden', 'true');
  return m;
}

export function renderTracker(ctx, route) {
  const root = el('section', 'tracker');
  const missIds = new Set(ctx.missables.candidates.map((c) => c.id));

  /* — controls — */
  const controls = el('div', 'controls');
  const search = el('label', 'search');
  search.append(svg(ICONS.search));
  const input = el('input');
  input.type = 'search';
  input.setAttribute('aria-label', 'Search trophies by name, description or guide');
  input.placeholder = 'Search trophies — press /';
  input.value = route.params.q ?? '';
  input.addEventListener('input', () => ctx.setParams({ q: input.value }));
  search.append(input);

  const chips = el('div', 'chips');
  const counts = { all: ctx.trophies.length };
  for (const t of ctx.trophies) {
    for (const tag of ctx.tags.get(t.id).tags) counts[tag] = (counts[tag] ?? 0) + 1;
  }
  counts.missable = missIds.size;
  const chipButtons = new Map();
  for (const f of FILTERS) {
    const b = el('button', 'chip-f');
    b.type = 'button';
    b.append(f.label);
    if (f.dot) b.append(el('span', 'dot'));
    const n = el('span', 'n');
    b.append(n);
    b.addEventListener('click', () => ctx.setParams({ f: f.key }));
    chipButtons.set(f.key, b);
    chips.append(b);
  }

  const sort = el('label', 'sort');
  const sortLabel = el('span', null);
  sortLabel.textContent = 'Sort';
  const select = el('select');
  select.setAttribute('aria-label', 'Sort trophies');
  for (const [value, label] of SORTS) {
    const o = el('option');
    o.value = value;
    o.textContent = label;
    select.append(o);
  }
  select.value = route.params.s ?? 'official';
  select.addEventListener('change', () => ctx.setParams({ s: select.value }));
  sort.append(sortLabel, select);

  controls.append(search, chips, sort);
  const countLine = el('p', 'count-line');
  const list = el('div', 'rows');
  root.append(controls, countLine, list);

  /* — one row — */
  function badges(t) {
    const wrap = el('span', 'row-badges');
    if (t.psnHidden) {
      const b = el('span', 'badge');
      b.title = "Sony hides this trophy's details on the PSN list until you earn it";
      b.append(svg(ICONS.eye), 'Hidden on PS5');
      wrap.append(b);
    }
    if (missIds.has(t.id)) {
      const b = el('span', 'badge miss');
      b.title = 'A one-off moment in the description; the missable question is open';
      b.append(svg(ICONS.warn), 'Missable?');
      wrap.append(b);
    }
    return wrap;
  }

  function evidenceChip(t) {
    const c = t.citation;
    if (c.basis === 'external') {
      const chip = el('span', 'ev-chip ext');
      const b = el('b');
      b.textContent = SOURCE_LABELS[c.sourceId] ?? c.sourceId;
      chip.append('Evidence: ', b, ` — ${c.fact}`);
      return chip;
    }
    const chip = el('span', 'ev-chip');
    chip.textContent = 'Evidence: official description only';
    return chip;
  }

  function guidePanel(t, masked) {
    const panel = el('div', 'panel');
    const lab = el('p', 'lab');
    lab.textContent = 'Guide';
    const guide = el('p', 'guide');
    if (masked) {
      guide.classList.add('censored');
      guide.textContent = censorText(t.guide.length);
      const reveal = el('button', 'reveal');
      reveal.type = 'button';
      reveal.textContent = 'Reveal spoiler';
      reveal.addEventListener('click', () => {
        ctx.revealed.add(t.id);
        renderRows();
        openPanel(t.id, true);
      });
      panel.append(lab, guide, reveal);
    } else {
      guide.textContent = t.guide;
      const ev = el('div', 'ev');
      ev.append(evidenceChip(t));
      for (const tag of ctx.tags.get(t.id).tags) {
        const chip = el('span', 'tag-chip' + (tag === 'story' ? ' story' : tag === 'missable' ? ' miss' : ''));
        chip.textContent = TAG_LABELS[tag] ?? tag;
        ev.append(chip);
      }
      if (t.unconfirmed) {
        const note = el('p', 'note');
        note.innerHTML = '<b>Unconfirmed guide.</b> The source marks its own reading as a guess — do not chase it as settled fact.';
        ev.append(note);
      }
      const more = el('p', 'more');
      const link = el('a');
      link.href = '#/trophy/' + t.id;
      link.textContent = 'Open the trophy page \u2192';
      more.append(link);
      panel.append(lab, guide, ev, more);
    }
    return panel;
  }

  let openId = null;
  function openPanel(id, rerender = false) {
    const row = list.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (!row) return;
    list.querySelectorAll('.panel').forEach((p) => p.remove());
    list.querySelectorAll('.row[aria-expanded]').forEach((r) => r.removeAttribute('aria-expanded'));
    if (!rerender && openId === id) {
      openId = null;
      return;
    }
    const t = ctx.byId.get(id);
    const masked = isMasked(t, ctx.tags, ctx.store, ctx.store.settings) && !ctx.revealed.has(id);
    row.setAttribute('aria-expanded', 'true');
    row.after(guidePanel(t, masked));
    openId = id;
  }

  function row(t) {
    const masked = isMasked(t, ctx.tags, ctx.store, ctx.store.settings) && !ctx.revealed.has(t.id);
    const r = el('article', 'row' + (ctx.store.has(t.id) ? ' earned' : ''));
    r.dataset.id = t.id;
    r.tabIndex = 0;
    r.setAttribute('role', 'button');
    r.setAttribute('aria-expanded', 'false');

    const main = el('div', 'row-main');
    const nameBox = el('div', 'row-name');
    const h3 = el('h3');
    h3.textContent = masked ? censorText(t.name.length) : t.name;
    nameBox.append(h3);
    const desc = el('span', 'desc');
    desc.textContent = masked ? censorText(t.description.length) : t.description;
    main.append(nameBox, desc);

    const check = el('button', 'check');
    check.type = 'button';
    check.setAttribute('aria-label', masked
      ? 'Toggle earned (name hidden by the spoiler setting)'
      : `Mark ${t.name} earned or unearned`);
    check.setAttribute('aria-pressed', String(ctx.store.has(t.id)));
    check.append(svg(ICONS.check));
    check.addEventListener('click', (e) => {
      e.stopPropagation();
      ctx.store.toggle(t.id);
    });

    r.append(medal(t), main, badges(t), check);

    r.addEventListener('click', () => openPanel(t.id));
    r.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        location.hash = '#/trophy/' + t.id;
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        ctx.store.toggle(t.id);
      }
    });
    return r;
  }

  /* — filtering and sorting, all from the hash's params — */
  function renderRows() {
    const { f = 'all', q = '', s = 'official' } = route.params;
    const needle = q.trim().toLowerCase();
    const shown = ctx.trophies.filter((t) => {
      if (f === 'missable' ? !missIds.has(t.id) : f !== 'all' && !ctx.tags.get(t.id).tags.includes(f)) return false;
      if (needle) {
        const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    if (s === 'grade') shown.sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade]);
    else if (s === 'name') shown.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    else if (s === 'earned') shown.sort((a, b) => Number(ctx.store.has(b.id)) - Number(ctx.store.has(a.id)));

    list.replaceChildren();
    for (const t of shown) list.append(row(t));
    openId = null;
    countLine.textContent = shown.length === ctx.trophies.length
      ? `All ${shown.length} trophies, official order.`
      : `${shown.length} of ${ctx.trophies.length} trophies shown.`;
    if (shown.length === 0) {
      const empty = el('p', 'empty');
      empty.textContent = 'Nothing matches — clear the search or pick another filter.';
      list.append(empty);
    }
  }

  function reflectControls() {
    const { f = 'all', q = '', s = 'official' } = route.params;
    if (input.value !== q) input.value = q;
    for (const [key, b] of chipButtons) {
      b.setAttribute('aria-pressed', String(key === f));
      b.querySelector('.n').textContent = String(counts[key] ?? 0);
    }
    if (select.value !== s) select.value = s;
  }

  /* — hooks the strip and the global keys use — */
  ctx.focusSearch = () => {
    input.focus();
    input.select();
  };
  ctx.onEscape = () => {
    if (document.activeElement === input) input.blur();
    else if (openId !== null) openPanel(openId);
    else if (input.value) ctx.setParams({ q: '' });
  };
  ctx.jumpTo = (id) => {
    const { f = 'all', q = '' } = route.params;
    if (f !== 'all' || q) ctx.setParams({ f: 'all', q: '' });
    const target = list.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (target) {
      target.scrollIntoView({ block: 'center' });
      target.classList.remove('flash');
      void target.offsetWidth;
      target.classList.add('flash');
      target.focus({ preventScroll: true });
    }
  };

  reflectControls();
  renderRows();

  /* the store changed elsewhere — a toggle, an import, the spoiler setting — keep the rows honest */
  const unsubscribe = ctx.store.subscribe(() => {
    const keepOpen = openId;
    renderRows();
    if (keepOpen !== null) openPanel(keepOpen, true);
  });

  return {
    el: root,
    update(next) {
      route = next;
      reflectControls();
      renderRows();
    },
    dispose() {
      unsubscribe();
      ctx.focusSearch = null;
      ctx.onEscape = null;
      ctx.jumpTo = null;
    },
  };
}

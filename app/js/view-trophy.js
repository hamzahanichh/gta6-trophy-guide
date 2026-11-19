/* view-trophy.js — one trophy's page: the official name and description, the guide with its evidence chip,
   derived tags, the missable and unconfirmed notes, the earned toggle with its timestamp, neighbours in
   official order, and the citation legend. Reached by import() from the router. */

import { SOURCE_LABELS, TAG_LABELS } from './derive-tags.js';
import { isMasked, censorText } from './spoiler-filter.js';

const el = (tag, cls) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
};

const ICONS = {
  eye: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1.5 8s2.6-4.4 6.5-4.4S14.5 8 14.5 8 11.9 12.4 8 12.4 1.5 8 1.5 8Z"/><circle cx="8" cy="8" r="2.1"/><path d="M2.5 13.5l11-11"/></svg>',
};

const svg = (markup) => {
  const span = el('span');
  span.innerHTML = markup;
  return span.firstChild;
};

/** A neighbour's button label, censored too when that neighbour is masked. */
function neighbourLabel(ctx, t) {
  if (isMasked(t, ctx.tags, ctx.store, ctx.store.settings) && !ctx.revealed.has(t.id)) {
    return censorText(t.name.length);
  }
  return t.name;
}

/** The citation legend: what the two bases mean and who the four named sources are. */
function legend(t) {
  const box = el('div', 'legend');
  const h3 = el('h3');
  h3.textContent = 'How this page cites its evidence';
  const p = el('p');
  p.textContent = 'Every guide line carries one of two bases:';
  const ul = el('ul');
  const li1 = el('li');
  li1.append('basis ');
  const c1 = el('code');
  c1.textContent = 'description';
  li1.append(c1, ' — the guide adds only what the official description already implies.');
  const li2 = el('li');
  li2.append('basis ');
  const c2 = el('code');
  c2.textContent = 'external';
  li2.append(c2, ' — the guide adds a count, location, order or trigger beyond the description, so it names the site that publishes it: ');
  const c3 = el('code');
  c3.textContent = 'psnprofiles';
  li2.append(c3, ' for tracker denominators, ');
  const c4 = el('code');
  c4.textContent = 'gtabase';
  li2.append(c4, ' for the story structure and strand documentation, ');
  const c5 = el('code');
  c5.textContent = 'powerpyx';
  li2.append(c5, ' for missable status and the guesses it marks unconfirmed, ');
  const c6 = el('code');
  c6.textContent = 'exophase';
  li2.append(c6, ' for the official split.');
  ul.append(li1, li2);
  box.append(h3, p, ul);
  return box;
}

export function renderTrophy(ctx, t) {
  const root = el('section', 'detail');
  const index = ctx.trophies.indexOf(t);
  const masked = isMasked(t, ctx.tags, ctx.store, ctx.store.settings) && !ctx.revealed.has(t.id);
  const miss = ctx.missables.candidates.find((c) => c.id === t.id);

  const back = el('p');
  const backLink = el('a');
  backLink.href = '#/';
  backLink.textContent = '\u2190 All trophies';
  back.append(backLink);

  const head = el('div', 'detail-head');
  const medal = el('span', 'medal lg');
  medal.dataset.grade = t.grade;
  medal.textContent = t.grade[0].toUpperCase();
  const h2 = el('h2');
  h2.textContent = masked ? censorText(t.name.length) : t.name;
  head.append(medal, h2);

  const badgeRow = el('div', 'row-badges');
  const gradeBadge = el('span', 'badge');
  gradeBadge.textContent = t.grade[0].toUpperCase() + t.grade.slice(1);
  badgeRow.append(gradeBadge);
  if (t.psnHidden) {
    const b = el('span', 'badge');
    b.append(svg(ICONS.eye), 'Hidden on PS5');
    badgeRow.append(b);
  }
  if (miss) {
    const b = el('span', 'badge miss');
    b.textContent = 'Possible missable';
    badgeRow.append(b);
  }
  if (t.unconfirmed) {
    const b = el('span', 'badge miss');
    b.textContent = 'Unconfirmed guide';
    badgeRow.append(b);
  }
  head.append(badgeRow);

  const descBlock = el('blockquote', 'desc-block');
  const dl = el('span', 'lab');
  dl.textContent = 'Official description';
  const dp = el('p');
  dp.textContent = masked ? censorText(t.description.length) : t.description;
  descBlock.append(dl, dp);

  const guideCard = el('div', 'card');
  const gl = el('p', 'lab');
  gl.textContent = 'Guide';
  const gp = el('p');
  gp.textContent = masked ? censorText(t.guide.length) : t.guide;
  guideCard.append(gl, gp);

  if (masked) {
    const reveal = el('button', 'reveal');
    reveal.type = 'button';
    reveal.textContent = 'Reveal spoiler';
    reveal.addEventListener('click', () => {
      ctx.revealed.add(t.id);
      ctx.show();
    });
    guideCard.append(reveal);
  } else {
    const ev = el('div', 'ev');
    const chip = t.citation.basis === 'external'
      ? el('span', 'ev-chip ext')
      : el('span', 'ev-chip');
    if (t.citation.basis === 'external') {
      const b = el('b');
      b.textContent = SOURCE_LABELS[t.citation.sourceId] ?? t.citation.sourceId;
      chip.append('Evidence: ', b, ` — ${t.citation.fact}`);
    } else {
      chip.textContent = 'Evidence: official description only';
    }
    ev.append(chip);
    for (const tag of ctx.tags.get(t.id).tags) {
      const tc = el('span', 'tag-chip' + (tag === 'story' ? ' story' : ''));
      tc.textContent = TAG_LABELS[tag] ?? tag;
      ev.append(tc);
    }
    const evidence = ctx.tags.get(t.id).evidence;
    if (evidence.source) {
      const q = el('span', 'ev-chip');
      q.textContent = `Quoted fact: \u201C${evidence.source}\u201D`;
      ev.append(q);
    }
    guideCard.append(ev);

    if (miss) {
      const note = el('p', 'note');
      note.innerHTML = '<b>Possible missable window.</b> The official description describes a one-off moment. ' +
        'GTA 6 missable status is open — PowerPyx calls it \u201Cpotentially 1\u201D and still unclear, Push Square reports none known — ' +
        'so this is a candidate to watch, not a confirmed missable.';
      guideCard.append(note);
    }
    if (t.unconfirmed) {
      const note = el('p', 'note');
      note.innerHTML = '<b>Unconfirmed.</b> The source that wrote this guide marks its own reading as a guess. ' +
        'Do not chase the trigger as settled fact.';
      guideCard.append(note);
    }
  }

  const earnedLine = el('div', 'earned-line');
  const stamp = el('span', 'stamp');
  if (ctx.store.has(t.id)) {
    stamp.textContent = `Earned ${new Date(ctx.store.at(t.id)).toLocaleString()}`;
  } else {
    stamp.textContent = 'Not earned yet';
  }
  const btn = el('button', 'btn primary');
  btn.type = 'button';
  btn.textContent = ctx.store.has(t.id) ? 'Mark unearned' : 'Mark earned';
  btn.addEventListener('click', () => {
    ctx.store.toggle(t.id);
    ctx.show();
  });
  earnedLine.append(stamp, btn);

  const pn = el('div', 'pn');
  const prev = ctx.trophies[(index - 1 + ctx.trophies.length) % ctx.trophies.length];
  const next = ctx.trophies[(index + 1) % ctx.trophies.length];
  for (const target of [prev, next]) {
    const b = el('button', 'btn');
    b.type = 'button';
    b.textContent = (target === prev ? '\u2190 ' : '') + neighbourLabel(ctx, target) + (target === next ? ' \u2192' : '');
    b.addEventListener('click', () => {
      location.hash = '#/trophy/' + target.id;
    });
    pn.append(b);
  }

  root.append(back, head, descBlock, guideCard, earnedLine, pn, legend(t));

  ctx.onEscape = () => {
    location.hash = '#/';
  };

  return {
    el: root,
    update() {},
    dispose() {
      ctx.onEscape = null;
    },
  };
}

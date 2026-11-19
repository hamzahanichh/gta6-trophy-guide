/* view-roadmap.js — the phases view: the platinum plan from derive-roadmap.js, the open-questions card up top
   (missable status, unconfirmed guides, unsettled facts), and every phase's "cannot infer" labels on show.
   Reached by import() from the router on first navigation. */

import { deriveRoadmap } from './derive-roadmap.js';

const el = (tag, cls) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
};

function medal(t) {
  const m = el('span', 'medal');
  m.dataset.grade = t.grade;
  m.textContent = t.grade[0].toUpperCase();
  m.setAttribute('aria-hidden', 'true');
  return m;
}

function mini(ctx, t, warn) {
  const row = el('button', 'mini' + (ctx.store.has(t.id) ? ' earned' : '') + (warn ? ' warn' : ''));
  row.type = 'button';
  row.title = 'Open the trophy page';
  row.addEventListener('click', () => {
    location.hash = '#/trophy/' + t.id;
  });
  const nm = el('span', 'nm');
  nm.textContent = t.name;
  const ds = el('span', 'ds');
  ds.textContent = t.description;
  row.append(medal(t), nm, ds);
  return row;
}

function noteChip(source, line) {
  const chip = el('span', 'ev-chip ext');
  const b = el('b');
  b.textContent = source;
  chip.append(b, ` — ${line}`);
  return chip;
}

export function renderRoadmap(ctx) {
  const plan = deriveRoadmap(ctx);
  const root = el('section', 'roadmap');

  const head = el('div', 'view-head');
  const h2 = el('h2');
  h2.textContent = 'Roadmap to Vice Got a Price!';
  const lede = el('p', 'lede');
  lede.textContent = `The official list is ${plan.split.line} (${plan.split.source} confirming the split). ` +
    'The plan below is assembled from the trophy list itself: every item is a real trophy, every count is sourced, and anything the list cannot settle is labelled as such.';
  head.append(h2, lede);

  /* — open questions: the missable status is not settled, and the app says so — */
  const open = el('div', 'open-q');
  const oh = el('h3');
  const pulse = el('span', 'pulse');
  oh.append(pulse, 'Open questions');
  const ul = el('ul');
  const missLi = el('li');
  missLi.textContent = 'Missables are unsettled: ' +
    plan.open.missables.reads.map((r) => `${r.source} says \u201C${r.line}\u201D`).join('; ') +
    '. The app therefore marks possible windows, never a confirmed missable list.';
  ul.append(missLi);
  if (plan.open.unconfirmed.length > 0) {
    const li = el('li');
    li.textContent = `Unconfirmed guides: ${plan.open.unconfirmed.map((t) => t.name).join(' and ')} — ` +
      'the source marks its own reading as a guess, so their steps are not stated as fact.';
    ul.append(li);
  }
  for (const line of plan.open.unsettled) {
    const li = el('li');
    li.textContent = line;
    ul.append(li);
  }
  open.append(oh, ul);

  root.append(head, open);

  /* — the phases — */
  for (const phase of plan.phases) {
    const card = el('article', 'phase');
    const ph = el('div', 'phase-head');
    const step = el('span', 'step');
    step.textContent = String(phase.step);
    const h3 = el('h3');
    h3.textContent = phase.title;
    const count = el('span', 'count num');
    const done = phase.items.filter((t) => ctx.store.has(t.id)).length;
    count.textContent = `${done} of ${phase.items.length} earned`;
    ph.append(step, h3, count);

    const body = el('div', 'phase-body');
    const blurb = el('p', 'blurb');
    blurb.textContent = phase.blurb;
    body.append(blurb);

    for (const t of phase.items) body.append(mini(ctx, t, false));
    if (phase.watch?.length) {
      const label = el('p', 'blurb');
      label.textContent = 'Watch for these one-off scene trophies as the story runs — each is a possible missable window:';
      body.append(label);
      for (const t of phase.watch) body.append(mini(ctx, t, true));
    }
    if (phase.notes.length) {
      const src = el('div', 'ev src');
      for (const n of phase.notes) src.append(noteChip(n.source, n.line));
      body.append(src);
    }
    for (const line of phase.cannot) {
      const c = el('p', 'cannot');
      const b = el('b');
      b.textContent = 'Cannot infer: ';
      c.append(b, line);
      body.append(c);
    }
    card.append(ph, body);
    root.append(card);
  }

  return {
    el: root,
    update() {},
    dispose() {
      ctx.onEscape = null;
    },
  };
}

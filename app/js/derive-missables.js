/* derive-missables.js — possible missable windows, derived from official descriptions. The missable question
   is OPEN: PowerPyx calls the count "potentially 1" and says it is still unclear; Push Square reports none
   known. Nothing here is a settled list — every window is a candidate, and the app labels it so. */

import { STRAND_FINALE } from './derive-tags.js';

/** The state of the missable question, as the sources leave it. */
export const MISSABLE_STATUS = {
  state: 'open',
  reads: [
    { source: 'PowerPyx', line: 'potentially 1 missable — and it says that is still unclear' },
    { source: 'Push Square', line: 'no missables known at launch' },
  ],
};

/**
 * A possible missable window: a story trophy whose official description describes a one-off moment rather
 * than a cumulative task — excluding strand finales, which are a strand's last job rather than a passing
 * moment. A candidate derived from the description — never a confirmed missable.
 */
export function deriveMissables(trophies, tags) {
  const candidates = [];
  for (const t of trophies) {
    const info = tags.get(t.id);
    if (!info?.tags.includes('story')) continue;
    if (/^Complete /.test(t.description)) continue;
    if (STRAND_FINALE.test(t.description)) continue;
    candidates.push({ id: t.id, name: t.name, window: t.description });
  }
  return { ...MISSABLE_STATUS, candidates };
}

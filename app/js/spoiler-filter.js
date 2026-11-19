/* spoiler-filter.js — the spoiler mask. With spoilers hidden (the default), an unearned story trophy has its
   name, description and guide censored; an earned trophy is always visible, and a per-row reveal lifts one
   mask for the session. */

export function censorActive(settings) {
  return settings.spoilers !== 'show';
}

/** True when this trophy must be shown masked right now (ignoring the per-row reveal). */
export function isMasked(trophy, tags, store, settings) {
  if (store.has(trophy.id)) return false;
  if (!censorActive(settings)) return false;
  return tags.get(trophy.id)?.tags.includes('story') ?? false;
}

/** A censor bar of roughly `chars` block glyphs. */
export function censorText(chars) {
  return '\u2593'.repeat(Math.max(3, Math.min(Math.round(chars), 14)));
}

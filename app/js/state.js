/* state.js — the localStorage store: one key, a version, earned timestamps and the spoiler setting.
   A stored blob of an unknown version (or unreadable JSON) is discarded, never merged. */

const KEY = 'gta6.progress';
const VERSION = 1;

/** An empty store: nothing earned, spoilers hidden by default. */
const freshStore = () => ({ version: VERSION, earned: {}, settings: { spoilers: 'hide' } });

/** Parse a stored blob: a store of the known version, a fresh one when nothing is stored, or null when the
    blob is unreadable or of an unknown version — discarded, never merged. */
function parseStored(raw) {
  if (raw === null) return freshStore();
  try {
    const value = JSON.parse(raw);
    if (
      value && typeof value === 'object' && !Array.isArray(value) &&
      value.version === VERSION &&
      typeof value.earned === 'object' && value.earned !== null && !Array.isArray(value.earned)
    ) {
      return {
        version: VERSION,
        earned: value.earned,
        settings: { spoilers: value.settings?.spoilers === 'show' ? 'show' : 'hide' },
      };
    }
  } catch {
    /* unreadable JSON: discard */
  }
  return null;
}

export function createStore() {
  const parsed = parseStored(localStorage.getItem(KEY));
  let data = parsed ?? freshStore();
  const listeners = new Set();

  const save = () => localStorage.setItem(KEY, JSON.stringify(data));
  if (parsed === null) save();
  const emit = () => {
    for (const fn of listeners) fn();
  };

  return {
    get settings() { return data.settings; },
    has(id) { return Object.hasOwn(data.earned, id); },
    at(id) { return data.earned[id] ?? null; },

    /** Toggle a trophy: earning stamps the moment, untoggling forgets it. */
    toggle(id) {
      if (this.has(id)) delete data.earned[id];
      else data.earned[id] = new Date().toISOString();
      save();
      emit();
    },

    /** Union in {id: ISO}: new ids are added, and an earlier incoming timestamp wins. */
    mergeEarned(byId) {
      let added = 0;
      let earlier = 0;
      let unchanged = 0;
      for (const [id, at] of Object.entries(byId)) {
        const have = data.earned[id];
        if (have === undefined) {
          data.earned[id] = at;
          added++;
        } else if (at < have) {
          data.earned[id] = at;
          earlier++;
        } else {
          unchanged++;
        }
      }
      if (added + earlier > 0) {
        save();
        emit();
      }
      return { added, earlier, unchanged };
    },

    setSpoilers(mode) {
      const next = mode === 'show' ? 'show' : 'hide';
      if (data.settings.spoilers === next) return;
      data.settings.spoilers = next;
      save();
      emit();
    },

    reset() {
      data = freshStore();
      save();
      emit();
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

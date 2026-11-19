/* export-import.js — the progress file. Export writes a JSON blob download named gta6-progress-YYYYMMDD-HHMM.json;
   import reads a file input's choice and merges by official trophy name — union, with the earlier timestamp winning,
   and reports the counts for a toast. Loaded by import() only when export or import is first used. */

const pad = (n) => String(n).padStart(2, '0');

/** The file-name stamp: gta6-progress-YYYYMMDD-HHMM.json, local time. */
function stamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** Download the earned set as the portable progress file. Returns how many trophies were in it. */
export function exportProgress(ctx) {
  const earned = ctx.trophies
    .filter((t) => ctx.store.has(t.id))
    .map((t) => ({ name: t.name, at: ctx.store.at(t.id) }));
  const file = {
    app: 'gta6-trophy-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned,
  };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `gta6-progress-${stamp()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  return earned.length;
}

/** Read a progress file and merge it in by official name. Throws on an unreadable or foreign file. */
export async function importProgress(ctx, file) {
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('the file is not valid JSON');
  }
  if (!parsed || typeof parsed !== 'object' || parsed.app !== 'gta6-trophy-tracker' || parsed.version !== 1) {
    throw new Error('not a gta6-trophy-tracker progress file of version 1');
  }
  if (!Array.isArray(parsed.earned)) throw new Error('the file has no earned list');

  const byId = {};
  let unknown = 0;
  for (const entry of parsed.earned) {
    const trophy = ctx.byName.get(entry?.name);
    if (!trophy || typeof entry.at !== 'string') {
      unknown++;
      continue;
    }
    byId[trophy.id] = entry.at;
  }
  const counts = ctx.store.mergeEarned(byId);
  return { ...counts, unknown };
}

/* view-settings.js — spoilers, the data sources this app cites, export and import of progress (loaded from
   export-import.js by relative import() when first used), reset, and the about note.
   Reached by import() from the router. */

const el = (tag, cls) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
};

const SOURCES = [
  ['PSNProfiles', 'publishes per-trophy progress trackers; the counts cited as \u201C0 of N\u201D come from them'],
  ['GTAbase', 'its mission database gives the story structure: prologue + five chapters, 122 numbered missions, the finale\u2019s name — and which stranger strands are documented'],
  ['PowerPyx', 'wrote the missable reading (\u201Cpotentially 1\u201D, still unclear) and the two guides it marks unconfirmed'],
  ['Exophase', 'confirms the official split: 1 platinum, 2 gold, 6 silver, 46 bronze — 28 hidden, 0 online'],
];

export function renderSettings(ctx) {
  const root = el('section', 'settings');

  const head = el('div', 'view-head');
  const h2 = el('h2');
  h2.textContent = 'Settings';
  const lede = el('p', 'lede');
  lede.textContent = 'Everything here lives in this browser only, under the localStorage key gta6.progress.';
  head.append(h2, lede);

  /* — spoilers — */
  const spoil = el('div', 'set');
  const sh = el('h3');
  sh.textContent = 'Spoilers';
  const srow = el('div', 'row-set');
  const slabel = el('div');
  const sp = el('p');
  sp.textContent = 'Hide unearned story trophies';
  const hintSpoilers = el('p', 'hint');
  hintSpoilers.textContent = 'Default: hide. Story trophies you have not earned show censored names, descriptions and guides, each with its own reveal. Earned trophies are always visible.';
  slabel.append(sp, hintSpoilers);
  const select = el('select');
  select.setAttribute('aria-label', 'Spoiler setting');
  for (const [value, label] of [['hide', 'Hide (default)'], ['show', 'Show everything']]) {
    const o = el('option');
    o.value = value;
    o.textContent = label;
    select.append(o);
  }
  select.value = ctx.store.settings.spoilers;
  select.addEventListener('change', () => {
    ctx.store.setSpoilers(select.value);
    ctx.toast(select.value === 'hide' ? 'Spoilers hidden — unearned story trophies are censored.' : 'Spoilers shown — everything is visible.', 'good');
  });
  srow.append(slabel, select);
  spoil.append(sh, srow);

  /* — data: export and import, loaded on first use — */
  const data = el('div', 'set');
  const dh = el('h3');
  dh.textContent = 'Your data';
  const dhint = el('p', 'hint');
  dhint.textContent = 'Export writes a JSON file (gta6-progress-YYYYMMDD-HHMM.json) you can keep or move; import merges one back by official trophy name — union, with the earlier timestamp winning.';
  const drow = el('div', 'row-set');
  const exportBtn = el('button', 'btn primary');
  exportBtn.type = 'button';
  exportBtn.textContent = 'Export progress';
  exportBtn.addEventListener('click', async () => {
    const { exportProgress } = await import('./export-import.js');
    const count = exportProgress(ctx);
    ctx.toast(`Exported ${count} earned trophies to a JSON file.`, 'good');
  });
  const fileLabel = el('label', 'file-label');
  fileLabel.textContent = 'Import progress\u2026';
  const fileInput = el('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json,.json';
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const { importProgress } = await import('./export-import.js');
      const counts = await importProgress(ctx, file);
      ctx.toast(
        `Imported: ${counts.added} added, ${counts.earlier} earlier timestamps kept, ${counts.unchanged} unchanged, ${counts.unknown} unknown names.`,
        'good',
      );
    } catch (err) {
      ctx.toast(`Import failed: ${err.message}`, 'warn');
    }
    fileInput.value = '';
  });
  fileLabel.append(fileInput);
  drow.append(exportBtn, fileLabel);

  const resetRow = el('div', 'row-set');
  const resetLabel = el('div');
  const rp = el('p');
  rp.textContent = 'Reset';
  const rhint = el('p', 'hint');
  rhint.textContent = 'Clears the store on this device. The trophies and guides are untouched.';
  resetLabel.append(rp, rhint);
  const resetBtn = el('button', 'btn danger');
  resetBtn.type = 'button';
  resetBtn.textContent = 'Clear progress';
  resetBtn.addEventListener('click', () => {
    if (window.confirm('Clear all earned progress on this device?')) {
      ctx.store.reset();
      ctx.toast('Progress cleared.', 'good');
    }
  });
  resetRow.append(resetLabel, resetBtn);
  data.append(dh, dhint, drow, resetRow);

  /* — sources — */
  const src = el('div', 'set');
  const sch = el('h3');
  sch.textContent = 'Where the facts come from';
  const schint = el('p', 'hint');
  schint.textContent = 'Guides written for this app carry an evidence chip: either the official description alone, or one of these sites when the guide adds a count, location, order or trigger beyond it.';
  const list = el('div', 'src-list');
  for (const [name, what] of SOURCES) {
    const item = el('div', 'src-item');
    const b = el('b');
    b.textContent = name;
    const d = el('span', 'd');
    d.textContent = ' — ' + what;
    item.append(b, d);
    list.append(item);
  }
  const cred = el('p', 'hint');
  cred.textContent = 'Missable status is presented as open, not settled. Push Square reports no missables known; PowerPyx calls it potentially one and still unclear.';
  src.append(sch, schint, list, cred);

  /* — about — */
  const about = el('div', 'set');
  const ah = el('h3');
  ah.textContent = 'About';
  const ap = el('p', 'hint');
  ap.textContent = 'A static, offline tracker for the 55 official Grand Theft Auto VI trophies: no frameworks, no fonts, no images, no network. The list ships in data/trophies.json (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PSN). Progress is stored as {version:1, earned:{id:ISO}, settings:{spoilers:"hide"}} and a stored blob of an unknown version is discarded. Measured first load: 10 files, 53,205 bytes raw, 17,411 bytes gzip-9, plus the trophy list itself fetched at boot (19,075 bytes raw, 3,621 bytes gzip-9).';
  about.append(ah, ap);

  root.append(head, spoil, data, src, about);

  return {
    el: root,
    update() {},
    dispose() {
      ctx.onEscape = null;
    },
  };
}

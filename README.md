# gta6-trophy-tracker

[![make.fun · gta6-trophy-tracker-01](https://make.fun/badge/gta6-trophy-tracker-01.svg)](https://make.fun/bounty/gta6-trophy-tracker-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-tracker-01)
[![rank](https://make.fun/badge/gta6-trophy-tracker-01/hamzahanichh/gta6-trophy-tracker/rank.svg)](https://make.fun/bounty/gta6-trophy-tracker-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-tracker-01)
[![reward](https://make.fun/badge/gta6-trophy-tracker-01/hamzahanichh/gta6-trophy-tracker/reward.svg)](https://make.fun/bounty/gta6-trophy-tracker-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-tracker-01)

A static, offline trophy tracker for Grand Theft Auto VI: all 55 official trophies with their grades, a spoiler-safe story layer, guides written for this app with per-line evidence chips, a platinum roadmap with "cannot infer" labels where the published list cannot settle a question, saved progress, hash-driven filters, and export/import. No frameworks, no fonts, no images, no network: it runs from any static server with the network off.

## Run it

The app is the `app/` folder — plain static files, no build step:

```sh
node serve.ts                 # serves app/ at http://localhost:8080 (Node 22)
# or, from inside app/:
python -m http.server 8080
```

Then open http://localhost:8080. Progress lives in this browser's localStorage under the key `gta6.progress` (`{"version":1,"earned":{"<id>":"<ISO>"},"settings":{"spoilers":"hide"}}`; a stored blob of an unknown version is discarded) and never leaves the device. Export writes `gta6-progress-YYYYMMDD-HHMM.json`; import merges by official trophy name — union, earlier timestamp wins.

## First load

What the browser fetches before any interaction — the 10 files the page's markup and module graph name, 53,205 bytes raw, 17,411 bytes gzip-9, plus the trophy list itself, fetched by `boot.js` at boot (19,075 bytes raw, 3,621 bytes gzip-9):

| file | raw | gzip-9 |
| --- | ---: | ---: |
| index.html | 2,614 | 1,110 |
| css/tokens.css | 969 | 555 |
| css/app.css | 20,498 | 4,474 |
| js/boot.js | 5,533 | 2,127 |
| js/router.js | 3,678 | 1,460 |
| js/view-tracker.js | 11,542 | 4,000 |
| js/spoiler-filter.js | 797 | 447 |
| js/state.js | 2,892 | 1,105 |
| js/derive-tags.js | 3,280 | 1,424 |
| js/derive-missables.js | 1,402 | 709 |

The other views load lazily by relative `import()` on first navigation — 6 files, 28,113 bytes raw, 10,716 bytes gzip-9 (`js/derive-roadmap.js`, `js/view-roadmap.js`, `js/view-trophy.js`, `js/view-settings.js`, `js/drawer.js`, `js/export-import.js`). The whole app is 17 files, 100,393 bytes.

## Layout

- `app/index.html` — the shell: masthead, nav, the mounts, `<noscript>`
- `app/css/tokens.css` / `app/css/app.css` — palette, type scale, layout and components
- `app/js/boot.js` — entry: data load, shared context, census, platinum strip, global keys
- `app/js/router.js` — hash routing and URL filter state (`#/?f=missable&q=stunt&s=grade`)
- `app/js/state.js` — the localStorage store, versioning and merge
- `app/js/derive-tags.js` — story/collectibles/activities rules, keeps the evidence quote
- `app/js/derive-missables.js` — missable windows from descriptions, status left open
- `app/js/spoiler-filter.js` — censors unearned story trophies, per-row reveal
- `app/js/view-tracker.js` — the default view: search, chips, sort, list, inline guides
- `app/js/derive-roadmap.js` + `app/js/view-roadmap.js` — phase assembly with "cannot infer" labels
- `app/js/view-trophy.js` — detail page, evidence chip, citation legend
- `app/js/view-settings.js` — spoiler setting, sources, reset, about
- `app/js/drawer.js` — the settings drawer: settings over the current view (the tracker's rows stay behind it), opened by the nav's Settings link
- `app/js/export-import.js` — blob download and file-input import
- `app/data/trophies.json` — the 55

## Data and sources

The list is the official 55: 1 platinum (`Vice Got a Price!`), 2 gold (`You Gotta Know When to Get Off`, `A Long Road`), 6 silver, 46 bronze — 28 hidden on PSN, 0 online (split confirmed by Exophase, PSNProfiles, PowerPyx and GTAbase). Official names, descriptions and grades are kept verbatim; every guide line is written for this app and carries an evidence basis: `description` when it adds only what the official text implies, or the site that adds the specific count, location, order or trigger — PSNProfiles for tracker denominators, GTAbase for the story structure (prologue + five chapters, 122 numbered missions, finale *The End of the Road*) and strand documentation, PowerPyx for the missable reading and the two guides it marks unconfirmed (`Bad Luck, I Guess`, `Ten Pin`). Missable status is presented as open — PowerPyx says "potentially 1" and still unclear, Push Square reports none known — never as a settled list.

## Build the hand-in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Licence

MIT — see LICENSE. Trophy names, descriptions and grades are Rockstar's official text; this is an unofficial fan-made tracker with no Rockstar logo or artwork and no copied guide prose.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-tracker-01) · AI agents build software for cash rewards</sub>

/* derive-roadmap.js — assembles the platinum roadmap from the derived tags and the citations: six phases in a
   working order, every item a real trophy, each phase's claims sourced — and a "cannot infer" label wherever the
   published list cannot answer a question. Loaded by view-roadmap.js on first navigation. */

import { STRAND_FINALE } from './derive-tags.js';

/** Sort key helpers. */
const isStory = (ctx, t) => ctx.tags.get(t.id).tags.includes('story');

export function deriveRoadmap(ctx) {
  const story = ctx.trophies.filter((t) => isStory(ctx, t));
  const strandFinales = story.filter((t) => STRAND_FINALE.test(t.description));
  const scenes = story.filter((t) => !/^Complete /.test(t.description) && !STRAND_FINALE.test(t.description));
  const storyMain = story.filter((t) => /^Complete /.test(t.description) && !STRAND_FINALE.test(t.description));
  const taken = new Set([...story.map((t) => t.id)]);
  const rest = (match) => ctx.trophies.filter((t) => !taken.has(t.id) && match(t));

  /* Strangers & Freaks is the strands umbrella: it belongs to phase 2, not the activities phase. */
  const activities = rest((t) => t.id !== 'strangers-freaks' && ctx.tags.get(t.id).tags.includes('activities'));
  activities.forEach((t) => taken.add(t.id));
  taken.add('strangers-freaks');
  const collectibles = rest((t) => ctx.tags.get(t.id).tags.includes('collectibles'));
  collectibles.forEach((t) => taken.add(t.id));
  const endgame = rest((t) => t.id === 'a-long-road' || t.id === 'vice-got-a-price');
  endgame.forEach((t) => taken.add(t.id));
  const cleanup = rest(() => true);

  return {
    split: { source: 'Exophase', line: '1 platinum, 2 gold, 6 silver, 46 bronze — 28 hidden, 0 online' },
    open: {
      missables: ctx.missables,
      unconfirmed: ctx.trophies.filter((t) => t.unconfirmed),
      unsettled: [
        'Fair Game — which animal unlocks it is still unconfirmed (GTAbase).',
        'Strangers & Freaks — 8 strands needed, only 4 documented (GTAbase).',
      ],
    },
    phases: [
      {
        step: 1,
        key: 'story',
        title: 'Play the story',
        blurb: 'The prologue and five numbered chapters, 122 missions in all, ending with The End of the Road (GTAbase mission database). While it runs, watch the one-off scene trophies — those are the only windows a missable could hide behind.',
        items: storyMain,
        watch: scenes,
        notes: [{ source: 'GTAbase', line: 'Prologue + 5 chapters, 122 numbered missions, finale The End of the Road' }],
        cannot: ['the exact mission order inside the chapters — the list fixes the structure, not the order'],
      },
      {
        step: 2,
        key: 'strands',
        title: 'Strangers & Freaks',
        blurb: 'Eight stranger strands across Leonida, each with its own finale trophy. Only four qualifying strands are documented so far, so treat the strand map as unfinished.',
        items: [...strandFinales, ctx.byId.get('strangers-freaks')],
        notes: [{ source: 'GTAbase', line: '4 of the 8 required strands are documented' }],
        cannot: ['which four strands count — six NPCs have finale trophies, but only four qualifying strands are published'],
      },
      {
        step: 3,
        key: 'activities',
        title: 'Activities and challenges',
        blurb: 'The repeatable side content: stunts, races, ranges, arcade, fishing. The counts below are the trackers PSNProfiles publishes.',
        items: activities,
        notes: [{ source: 'PSNProfiles', line: 'per-trophy trackers: 250 stunts, 42 golds, 14 races, 9 activity types, 50 challenges' }],
        cannot: [],
      },
      {
        step: 4,
        key: 'collectibles',
        title: 'Collectibles and the map',
        blurb: 'The world finds: cards, vehicles, meditation spots, WAiNK locations, garages and every area of Leonida.',
        items: collectibles,
        notes: [{ source: 'PSNProfiles', line: 'per-trophy trackers: 3 card sets, 100 vehicles, 18 spots, 100 locations, 8 garages, 52 areas' }],
        cannot: [],
      },
      {
        step: 5,
        key: 'cleanup',
        title: 'Crime, cash and the odd ones',
        blurb: 'Everything the story does not hand you: heists, robberies, money moved and spent, and the two trophies whose triggers are still guesses.',
        items: cleanup,
        notes: [],
        cannot: [],
      },
      {
        step: 6,
        key: 'endgame',
        title: 'The long road to platinum',
        blurb: '100% completion first, then the platinum lands by itself. The published tracker breaks 100% into a 100-item checklist (PSNProfiles).',
        items: endgame,
        notes: [
          { source: 'PSNProfiles', line: '0 of a 100-item completion checklist' },
          { source: 'Exophase', line: 'the platinum crowns a 55-trophy list' },
        ],
        cannot: ['what fills the 100 checklist items — only the total is published, not the breakdown'],
      },
    ],
  };
}

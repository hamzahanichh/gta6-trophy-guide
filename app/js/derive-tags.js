/* derive-tags.js — rule-based tags and the evidence behind them. Story covers mission and chapter completions
   plus a fixed set of one-off scene trophies; collectibles and activities match their official descriptions.
   Every rule keeps its evidence quote: the description text that matched, or the citation fact a source adds. */

/** Completing a named mission, chapter, or a strand's final mission — the spoiler-bearing story set. */
const STORY_MISSION = /^Complete (?:Chapter \d|the final mission(?: for [A-Z])?|[A-Z])/;

/** A strand finale: the description names the NPC it is done for, scene-styled or not. */
export const STRAND_FINALE = /for [A-Z][a-z]+\.$/;

/** Story moments told as scenes rather than tasks; descriptions quote them, so they spoiler-tag too. */
const STORY_SCENES = new Set([
  'hot-together',
  'catch-me-if-you-can',
  'challenging-tank',
  'in-the-beginning',
  'capital-offense',
  'let-s-go-bowling',
  'personal-best',
  'actions-speak-louder',
  'bad-luck-i-guess',
  'the-truth-is-out-there',
  'fair-game',
]);

/** A collectible set or a countable world find, by description pattern and its evidence label. */
const COLLECTIBLES = [
  [/Collectible Card sets/i, 'collectible card sets'],
  [/Discover \d+ vehicles/i, 'vehicle discoveries'],
  [/Meditate at every spot/i, 'meditation spots'],
  [/WAiNK It at \d+ locations/i, 'WAiNK locations'],
  [/Explore all of Leonida/i, 'map exploration'],
  [/Purchase all garage properties/i, 'garage properties'],
];

/** A repeatable activity or challenge type, by description pattern and its evidence label. */
const ACTIVITIES = [
  [/Stunts/i, 'stunts'],
  [/type of activity/i, 'activity types'],
  [/Shooting Range/i, 'shooting range'],
  [/Drone Race/i, 'drone races'],
  [/different races/i, 'races'],
  [/fishing challenge/i, 'fishing'],
  [/arcade game/i, 'arcade games'],
  [/Challenges/i, 'challenges'],
  [/mission strands/i, 'stranger strands'],
];

/** The sites a citation can name, as the chips spell them. */
export const SOURCE_LABELS = {
  psnprofiles: 'PSNProfiles',
  powerpyx: 'PowerPyx',
  gtabase: 'GTAbase',
  exophase: 'Exophase',
};

export const TAG_LABELS = {
  story: 'Story',
  collectibles: 'Collectibles',
  activities: 'Activities',
};

/**
 * Map every trophy id to its tags and the evidence that justified them:
 *   tags      the derived tag keys in rule order
 *   evidence  { [tag]: quote or label }, plus .source for an external citation's fact
 */
export function deriveTags(trophies) {
  const out = new Map();
  for (const t of trophies) {
    const tags = [];
    const evidence = {};
    if (STORY_MISSION.test(t.description) || STORY_SCENES.has(t.id)) {
      tags.push('story');
      evidence.story = t.description;
    }
    for (const [pattern, label] of COLLECTIBLES) {
      if (pattern.test(t.description)) {
        tags.push('collectibles');
        evidence.collectibles = label;
        break;
      }
    }
    for (const [pattern, label] of ACTIVITIES) {
      if (pattern.test(t.description)) {
        tags.push('activities');
        evidence.activities = label;
        break;
      }
    }
    if (t.citation?.basis === 'external') evidence.source = t.citation.fact;
    out.set(t.id, { tags, evidence });
  }
  return out;
}

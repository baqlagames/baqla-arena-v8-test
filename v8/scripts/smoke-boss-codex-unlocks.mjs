#!/usr/bin/env node

import assert from 'node:assert/strict';
import { BOSS_CODEX_ENTRIES, bossCodexEntryForId } from '../src/data/boss-codex.js';
import { normalizeProgress, saveProgress } from '../src/systems/progress.js';

assert(bossCodexEntryForId(1), 'Hornet Sovereign should have a boss codex entry');
assert(bossCodexEntryForId(10), 'Veiled Stalker should have a boss codex entry');
assert(bossCodexEntryForId(4), 'Sultan of Embers should have a boss codex entry');
assert(bossCodexEntryForId(6), 'Pharaoh Ka should have a boss codex entry');
assert(BOSS_CODEX_ENTRIES.every(entry => entry.mechanics.length >= 3), 'boss codex entries should expose three readable mechanics');

const byStars = normalizeProgress({
  stageStars: { 5: 2 },
}, { maxStage: 1 });
assert(byStars.defeatedBosses.includes(1), 'stage stars should unlock the defeated stage boss');

const byProgress = normalizeProgress({
  maxStage: 11,
  stageStars: {},
});
for (const id of [0, 1, 10, 4]) {
  assert(byProgress.defeatedBosses.includes(id), `maxStage should infer defeated boss ${id}`);
}

const rawList = normalizeProgress({
  defeatedBosses: [6, '10', 6],
});
assert.deepEqual(rawList.defeatedBosses, [6, 10], 'raw defeated boss ids should normalize and dedupe');

const writes = [];
const storage = {
  setItem(key, value) { writes.push({ key, value: JSON.parse(value) }); },
};
const saved = saveProgress({
  maxStage: 16,
  stageStars: { 15: 1 },
  selectedDeck: [0, 1, 2, 3, 4, 5],
  selectedSpells: [0],
  beans: 0,
  unlockedPerks: [],
  selectedPerks: [],
  defeatedBosses: [1],
}, storage);
assert(saved.defeatedBosses.includes(6), 'save should persist newly inferred Pharaoh clear');
assert(writes[0].value.defeatedBosses.includes(6), 'storage payload should include defeated bosses');

console.log('smoke-boss-codex-unlocks: ok');

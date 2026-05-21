#!/usr/bin/env node

import assert from 'node:assert/strict';
import { BOSS_CODEX_ENTRIES, bossCodexEntryForId } from '../src/data/boss-codex.js';
import { normalizeProgress, saveProgress } from '../src/systems/progress.js';
import { createStageFlowRuntime } from '../src/systems/stage-flow-runtime.js';

assert(bossCodexEntryForId(1), 'Hornet Sovereign should have a boss codex entry');
assert(bossCodexEntryForId(10), 'Astral Lantern Warden should have a boss codex entry');
assert(bossCodexEntryForId(4), 'Sultan of Embers should have a boss codex entry');
assert(bossCodexEntryForId(6), 'Pharaoh Ka should have a boss codex entry');
assert(BOSS_CODEX_ENTRIES.every(entry => entry.mechanics.length >= 3), 'boss codex entries should expose three readable mechanics');

const byStars = normalizeProgress({
  stageStars: { 5: 2 },
}, { maxStage: 1 });
assert(byStars.foughtBosses.includes(1), 'stage stars should migrate old cleared bosses into fought boss unlocks');

const byProgress = normalizeProgress({
  maxStage: 11,
  stageStars: {},
});
for (const id of [0, 1, 10, 4]) {
  assert(byProgress.foughtBosses.includes(id), `maxStage should infer previously fought boss ${id}`);
}

const rawList = normalizeProgress({
  foughtBosses: [6, '10', 6],
});
assert.deepEqual(rawList.foughtBosses, [6, 10], 'raw fought boss ids should normalize and dedupe');

const legacyList = normalizeProgress({
  defeatedBosses: [1, '4', 4],
});
assert(legacyList.foughtBosses.includes(1), 'legacy defeated boss ids should migrate into fought bosses');
assert(legacyList.foughtBosses.includes(4), 'legacy defeated boss ids should dedupe during migration');

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
  foughtBosses: [1],
}, storage);
assert(saved.foughtBosses.includes(6), 'save should persist newly inferred Pharaoh fight');
assert(writes[0].value.foughtBosses.includes(6), 'storage payload should include fought bosses');
assert(!Object.hasOwn(writes[0].value, 'defeatedBosses'), 'new saves should not write the legacy defeatedBosses key');

const unlockedOnSpawn = [];
let bossSpawned = false;
const spawnedBosses = [];
const flow = createStageFlowRuntime({
  view: () => ({
    state: 'battle',
    arena: { phase: 'wave' },
    frame: 120,
    width: 500,
    arenaTop: 90,
    arenaBottom: 900,
    spawnY: 120,
    spawnLeft: 32,
    spawnRight: 468,
    enemies: spawnedBosses,
  }),
  spawnBossByIdFromData: ({ bossId }) => {
    const boss = { bossId, hp: 1, maxHp: 1, isBoss: true };
    spawnedBosses.push(boss);
    return boss;
  },
  setBossRef: boss => assert.equal(boss.bossId, 10, 'spawned boss should become the active boss reference'),
  setBossSpawned: value => { bossSpawned = value; },
  unlockBossCodex: bossId => { unlockedOnSpawn.push(bossId); return true; },
});
flow.spawnBossById(10);
assert.equal(bossSpawned, true, 'boss spawn should mark the boss round as active');
assert.deepEqual(unlockedOnSpawn, [10], 'boss codex should unlock when the boss is fought, before win/loss resolution');

console.log('smoke-boss-codex-unlocks: ok');

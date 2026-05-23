#!/usr/bin/env node

import assert from 'node:assert/strict';
import { buildWaveThreats } from '../src/systems/wave-threats.js';
import { threatPanelHeight } from '../src/ui/threat-panel.js';
import { STAGES } from '../src/data/stages.js';

function tagKeys(threat) {
  return (threat.tags || []).map(tag => tag.key);
}

const mixedThreat = buildWaveThreats({
  round: 5,
  total: 6,
  isBoss: false,
  stage: STAGES[7],
  queue: [43, 33, 38, 26, 5],
  theme: 'AERIAL_RAID',
});

for (const expected of ['FLYERS', 'ARMOR', 'BURST', 'CASTER', 'BACKLINE THREAT']) {
  assert(tagKeys(mixedThreat).includes(expected), `mixed wave should expose ${expected}`);
}
assert(threatPanelHeight(mixedThreat) > 96, 'tagged wave panel should reserve room for tactical chips');

const hornetThreat = buildWaveThreats({
  round: 6,
  total: 6,
  isBoss: true,
  stage: STAGES[4],
});
assert.equal(hornetThreat.bossName, 'Hornet Sovereign', 'stage 5 boss preview should name Hornet Sovereign');
for (const expected of ['BOSS SHIELD', 'POISON', 'ARMOR']) {
  assert(tagKeys(hornetThreat).includes(expected), `Hornet boss preview should expose ${expected}`);
}

const dragonThreat = buildWaveThreats({
  round: 6,
  total: 6,
  isBoss: true,
  stage: STAGES[9],
});
assert.equal(STAGES[9].name, 'Winterglass Palace', 'stage 10 should use the Winterglass Palace presentation');
assert.equal(STAGES[9].weather, 'blizzard', 'stage 10 should use blizzard weather');
assert.equal(dragonThreat.bossName, 'Winterglass Dragon', 'stage 10 final preview should name Winterglass Dragon');
for (const expected of ['FROST', 'BURST', 'BACKLINE THREAT', 'SOFT CONTROL', 'MIXED DAMAGE', 'FLYERS']) {
  assert(tagKeys(dragonThreat).includes(expected), `Winterglass Dragon preview should expose ${expected}`);
}

const vizierThreat = buildWaveThreats({
  round: 4,
  total: 6,
  isBoss: false,
  stage: STAGES[9],
  queue: [33, 38, 26],
  theme: 'WINTERGLASS_COURT',
  miniBossId: 13,
});
assert.equal(vizierThreat.enemies[0].name, 'Winterglass Magistrate', 'stage 10 round 4 preview should name Winterglass Magistrate');
for (const expected of ['FROST', 'CASTER', 'BURST', 'BACKLINE THREAT', 'ARMOR', 'BOSS SHIELD']) {
  assert(tagKeys(vizierThreat).includes(expected), `Winterglass Magistrate preview should expose ${expected}`);
}
assert(!tagKeys(vizierThreat).includes('FLYERS'), 'Winterglass Magistrate preview should not advertise flyers after motes were removed');

console.log('smoke-wave-threat-tags: ok');

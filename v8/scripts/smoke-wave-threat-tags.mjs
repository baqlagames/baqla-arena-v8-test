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

const sultanThreat = buildWaveThreats({
  round: 6,
  total: 6,
  isBoss: true,
  stage: STAGES[9],
});
for (const expected of ['BURST', 'CASTER', 'POISON']) {
  assert(tagKeys(sultanThreat).includes(expected), `Sultan boss preview should expose ${expected}`);
}

console.log('smoke-wave-threat-tags: ok');

#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createCombatHelperRuntime } from '../src/systems/combat-helper-runtime.js';

const state = {
  frame: 120,
  particles: [],
  damageNumbers: [],
  healingNumbers: [],
  currentStage: { n: 10 },
  arena: { round: 4 },
};

const runtime = createCombatHelperRuntime({
  tickHz: 60,
  view: () => state,
  randomRange: (min, max) => (min + max) / 2,
  perkEffects: () => ({}),
});

const healer = {
  name: 'Naana Holy',
  isPlayer: true,
  arch: 'healer',
  hp: 900,
  maxHp: 900,
  x: 220,
  y: 620,
  size: 18,
  _stormSilenceTimer: 90,
};
const target = {
  name: 'Tank',
  isPlayer: true,
  arch: 'tank',
  hp: 500,
  maxHp: 1000,
  x: 250,
  y: 470,
  size: 22,
};

const blocked = runtime.trackedHeal(target, 120, healer, false);
assert.equal(blocked, 0, 'silenced healer should output zero tracked healing');
assert.equal(target.hp, 500, 'silenced healer should not change target HP');
assert.equal(healer._noHealFeedbackFrame, 120, 'silenced healer should mark NO HEAL feedback timing');
assert(state.damageNumbers.some(item => item && item.val === 'NO HEAL'), 'silenced healer should emit NO HEAL feedback');

healer._stormSilenceTimer = 0;
state.frame = 150;
const healed = runtime.trackedHeal(target, 120, healer, false);
assert.equal(healed, 120, 'unsilenced healer should restore tracked healing output');
assert.equal(target.hp, 620, 'unsilenced healer should heal target again');

console.log('smoke-healer-silence-output: ok');

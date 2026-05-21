#!/usr/bin/env node

import assert from 'node:assert/strict';
import { drawWeatherOverlay } from '../src/render/weather.js';

const calls = [];
const ctx = {
  save() { calls.push('save'); },
  restore() { calls.push('restore'); },
  fillRect(...args) { calls.push(['fillRect', ...args]); },
  beginPath() { calls.push('beginPath'); },
  moveTo(...args) { calls.push(['moveTo', ...args]); },
  lineTo(...args) { calls.push(['lineTo', ...args]); },
  stroke() { calls.push('stroke'); },
  set fillStyle(value) { calls.push(['fillStyle', value]); },
  set strokeStyle(value) { calls.push(['strokeStyle', value]); },
  set lineWidth(value) { calls.push(['lineWidth', value]); },
};

const particles = { raindrops: [], snowflakes: [], fogParticles: [], sandParticles: [] };
let stormDamageCalls = 0;
const storm = {
  active: true,
  bossId: 10,
  startedFrame: 0,
  nextThunderFrame: 100,
  flashTimer: 0,
  flashMax: 0,
  forks: [],
};

drawWeatherOverlay(ctx, {
  weather: 'night',
  width: 500,
  height: 900,
  arenaTop: 80,
  arenaBot: 820,
  particles,
  astralStorm: storm,
  bossRef: { id: 10, hp: 100 },
  frame: 100,
  dealDamage() { stormDamageCalls++; },
});

assert(particles.raindrops.some(drop => drop.astral), 'astral storm should seed cosmetic rain');
assert.equal(storm.flashMax, 10, 'astral storm should schedule a thunder flash');
assert(storm.nextThunderFrame > 100, 'astral storm should schedule the next thunder in the future');
assert(calls.some(call => Array.isArray(call) && call[0] === 'fillRect'), 'astral storm should draw atmospheric overlays');
assert.equal(stormDamageCalls, 0, 'astral storm should not deal hidden weather damage');

drawWeatherOverlay(ctx, {
  weather: 'night',
  width: 500,
  height: 900,
  arenaTop: 80,
  arenaBot: 820,
  particles,
  astralStorm: storm,
  bossRef: { id: 10, hp: 0 },
  frame: 120,
  dealDamage() { stormDamageCalls++; },
});

assert.equal(storm.active, false, 'astral storm should deactivate when the Warden is gone');

console.log('smoke-astral-storm-weather: ok');

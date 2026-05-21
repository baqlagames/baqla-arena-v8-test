#!/usr/bin/env node

import assert from 'node:assert/strict';
import { drawWeatherForegroundOverlay, drawWeatherOverlay } from '../src/render/weather.js';

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
  arrivalTimer: 120,
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

assert(particles.raindrops.filter(drop => drop && drop.astral).length >= 70, 'astral storm should seed brighter cosmetic rain');
assert.equal(storm.flashMax, 14, 'astral storm should schedule a stronger thunder flash');
assert(storm.nextThunderFrame >= 460 && storm.nextThunderFrame <= 580, 'astral storm should schedule the next thunder 6-8s later');
assert(storm.arrivalTimer < 120, 'astral storm should play a visible arrival cue');
assert(calls.some(call => Array.isArray(call) && call[0] === 'fillRect'), 'astral storm should draw atmospheric overlays');
assert.equal(stormDamageCalls, 0, 'astral storm should not deal hidden weather damage');

drawWeatherForegroundOverlay(ctx, {
  weather: 'night',
  width: 500,
  height: 900,
  arenaTop: 80,
  arenaBot: 820,
  particles,
  astralStorm: storm,
  bossRef: { id: 10, hp: 100 },
  frame: 101,
  dealDamage() { stormDamageCalls++; },
});

assert(calls.some(call => call === 'stroke'), 'astral storm foreground should draw rain/lightning strokes');
assert(storm.flashTimer < 14, 'astral storm foreground should advance thunder flickers');
assert.equal(stormDamageCalls, 0, 'astral storm foreground should not deal hidden weather damage');

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

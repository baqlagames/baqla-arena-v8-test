#!/usr/bin/env node

import assert from 'node:assert/strict';
import { bossCarapaceHudState, bossEnrageHudState } from '../src/ui/encounter-bars.js';

const tickHz = 60;

const calm = bossEnrageHudState({ spawnFrame: 100, timeEnrageAt: 1800 }, 220, tickHz);
assert.equal(calm.seconds, 28, 'enrage HUD should count down from the boss spawn frame');
assert.equal(calm.warning, false, 'enrage HUD should not warn outside the final 10s');

const warning = bossEnrageHudState({ spawnFrame: 100, timeEnrageAt: 1800 }, 1300, tickHz);
assert.equal(warning.seconds, 10, 'enrage HUD should expose the 10s warning point');
assert.equal(warning.warning, true, 'enrage HUD should mark the final 10s as warning state');

const enraged = bossEnrageHudState({ spawnFrame: 100, timeEnrageAt: 1800, timeEnraged: true }, 2000, tickHz);
assert.equal(enraged.enraged, true, 'enrage HUD should expose active enraged state');
assert.equal(enraged.pct, 1, 'enraged HUD progress should be full');

const hidden = bossEnrageHudState({ spawnFrame: 0, timeEnrageAt: tickHz * 60 * 30 }, 100, tickHz);
assert.equal(hidden, null, 'very long-lived helper bosses should not claim enrage HUD space');

const carapace = bossCarapaceHudState({
  royalCarapaceTimer: 121,
  royalCarapaceMax: 720,
  hiveShield: { hp: 1550.4, maxHp: 2000 },
}, tickHz);
assert.equal(carapace.seconds, 3, 'carapace HUD should expose failure seconds');
assert.equal(carapace.shieldHp, 1551, 'carapace HUD should expose shield HP');
assert.equal(carapace.shieldMax, 2000, 'carapace HUD should expose shield max HP');
assert.ok(carapace.shieldPct > 0.77 && carapace.shieldPct < 0.78, 'carapace HUD should expose shield percentage');
assert.equal(carapace.danger, false, 'carapace HUD should enter danger below 2s');

const danger = bossCarapaceHudState({
  royalCarapaceTimer: 120,
  royalCarapaceMax: 720,
  hiveShield: { hp: 500, maxHp: 2000 },
}, tickHz);
assert.equal(danger.danger, true, 'carapace HUD should mark the final 2s as danger state');

console.log('smoke-encounter-bars: ok');

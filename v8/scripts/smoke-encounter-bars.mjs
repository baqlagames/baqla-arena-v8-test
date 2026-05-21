#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  bossCarapaceHudState,
  bossEnrageHudState,
  bossReadableSkillHint,
  bossReadableSkillLabel,
  bossReadableSkillPills,
  bossUrgentSkillHudState,
} from '../src/ui/encounter-bars.js';
import { collectStatusIcons } from '../src/render/status-icons.js';

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

const sultan = { id: 4, name: 'Sultan of Embers', aoeCD: 480, meteorCD: 720, debuffCD: 600, spawnCD: 900, mechCD: { aoe: 150, meteor: 90, debuff: 240, spawn: 500 } };
assert.equal(bossReadableSkillLabel(sultan, 'aoe'), 'INFERNO', 'Sultan AoE should be readable as Inferno');
assert.equal(bossReadableSkillLabel(sultan, 'debuff'), 'BURN', 'Sultan debuff should be readable as Burn');
assert.equal(bossReadableSkillHint(sultan, 'meteor'), 'DODGE RING', 'Sultan meteor should expose a player-facing hint');
assert.deepEqual(bossReadableSkillPills(sultan).map(skill => skill.name), ['INFERNO', 'BURN', 'IMP', 'METEOR'], 'Sultan skill pills should use boss-specific labels');

const urgent = bossUrgentSkillHudState(sultan, tickHz);
assert.equal(urgent.label, 'METEOR', 'urgent mechanic HUD should pick the nearest imminent mechanic');
assert.equal(urgent.hint, 'DODGE RING', 'urgent mechanic HUD should expose the mechanic hint');
assert.equal(urgent.seconds, 2, 'urgent mechanic HUD should expose seconds remaining');
assert.equal(urgent.danger, false, 'urgent mechanic HUD should distinguish final-second danger');
assert.equal(urgent.soonWindow, tickHz * 4, 'Act 2/3 bosses should use a wider readability warning window');

const veiled = { id: 10, name: 'Veiled Stalker', vanishCD: 480, debuffCD: 540, mechCD: { vanish: 45, debuff: 200 } };
const ambush = bossUrgentSkillHudState(veiled, tickHz);
assert.equal(ambush.label, 'AMBUSH', 'Veiled Stalker vanish should read as Ambush');
assert.equal(ambush.danger, true, 'imminent ambush should be danger state inside 1s');

const bossIcons = collectStatusIcons({ isBoss: true, stealth: true, vanishCD: 480, stealthHits: 0, mechCD: { meteor: 80 }, meteorCD: 720 }, tickHz);
assert.ok(bossIcons.some(icon => icon.title === 'Ambush Ready'), 'boss status icons should expose primed ambush');
assert.ok(bossIcons.some(icon => icon.title === 'Meteor Soon'), 'boss status icons should expose imminent meteor');

const earlyBossIcons = collectStatusIcons({ isBoss: true, mechCD: { magicBolt: 220 }, magicBoltCD: 540 }, tickHz);
assert.ok(earlyBossIcons.some(icon => icon.title === 'Bolt Soon'), 'boss status icons should expose 4s mechanic warnings');

console.log('smoke-encounter-bars: ok');

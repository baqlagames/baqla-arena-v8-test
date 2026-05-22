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

const warden = {
  id: 10,
  name: 'Astral Lantern Warden',
  starfallCD: 420,
  eclipseBeamCD: 540,
  gravityTollCD: 720,
  lanternOrbitCD: 900,
  mechCD: { starfall: 140, eclipseBeam: 45, gravityToll: 210, lanternOrbit: 300 },
};
assert.equal(bossReadableSkillLabel(warden, 'starfall'), 'STARFALL', 'Warden Starfall should use readable label');
assert.equal(bossReadableSkillHint(warden, 'eclipseBeam'), 'LINE BEAM', 'Warden Eclipse should expose line-beam hint');
const eclipse = bossUrgentSkillHudState(warden, tickHz);
assert.equal(eclipse.label, 'ECLIPSE', 'Warden urgent mechanic should pick imminent Eclipse');
assert.equal(eclipse.danger, true, 'imminent Eclipse should be danger state inside 1s');

const bossIcons = collectStatusIcons({ isBoss: true, stealth: true, vanishCD: 480, stealthHits: 0, mechCD: { meteor: 80 }, meteorCD: 720 }, tickHz);
assert.ok(bossIcons.some(icon => icon.title === 'Ambush Ready'), 'boss status icons should expose primed ambush');
assert.ok(bossIcons.some(icon => icon.title === 'Meteor Soon'), 'boss status icons should expose imminent meteor');

const earlyBossIcons = collectStatusIcons({ isBoss: true, mechCD: { magicBolt: 220 }, magicBoltCD: 540 }, tickHz);
assert.ok(earlyBossIcons.some(icon => icon.title === 'Bolt Soon'), 'boss status icons should expose 4s mechanic warnings');

const wardenIcons = collectStatusIcons({ isBoss: true, mechCD: { starfall: 80 }, starfallCD: 420 }, tickHz);
assert.ok(wardenIcons.some(icon => icon.title === 'Starfall Soon'), 'boss status icons should expose Warden mechanic warnings');

const vizier = {
  id: 13,
  name: 'Winterglass Magistrate',
  twinWardsCD: 1200,
  chainDecreeCD: 500,
  groundingPulseCD: 360,
  courtPulseCD: 420,
  silencingDecreeCD: 840,
  tankCurseCD: 720,
  mechCD: { twinWards: 9999, chainDecree: 260, groundingPulse: 220, courtPulse: 90, silencingDecree: 520, tankCurse: 640 },
};
assert.equal(bossReadableSkillLabel(vizier, 'courtPulse'), 'WHITEOUT', 'Winterglass Magistrate Whiteout Pulse should use readable label');
assert.equal(bossReadableSkillHint(vizier, 'courtPulse'), 'RAID WHITEOUT', 'Winterglass Magistrate Whiteout Pulse should expose raid-whiteout hint');
assert.ok(bossReadableSkillPills(vizier).some(skill => skill.key === 'courtPulse' && skill.name === 'WHITEOUT'), 'Winterglass Magistrate skill pills should include Whiteout Pulse');
const vizierUrgent = bossUrgentSkillHudState(vizier, tickHz);
assert.equal(vizierUrgent.label, 'WHITEOUT', 'Winterglass Magistrate urgent mechanic should pick imminent Whiteout Pulse');
const vizierIcons = collectStatusIcons({ isBoss: true, mechCD: { courtPulse: 80 }, courtPulseCD: 420 }, tickHz);
assert.ok(vizierIcons.some(icon => icon.title === 'Whiteout Soon'), 'boss status icons should expose Winterglass Whiteout warnings');

const wardIcons = collectStatusIcons({ isBoss: true, hiveShield: { hp: 1200, maxHp: 2000, astralWard: true, color: '#8bdfff' } }, tickHz);
assert.ok(wardIcons.some(icon => icon.title === 'Lantern Ward'), 'boss status icons should expose Lantern Ward shields');

const stormShieldIcons = collectStatusIcons({ isBoss: true, _stormShieldActive: true }, tickHz);
assert.ok(stormShieldIcons.some(icon => icon.title === 'Winterglass Barrier'), 'boss status icons should expose Winterglass Barrier');

const overchargeIcons = collectStatusIcons({ stormWard: true, _stormWardOverchargeStage: 2, color: '#ffd166' }, tickHz);
assert.ok(overchargeIcons.some(icon => icon.title === 'Deep Freeze'), 'ward status icons should expose Vizier overcharge state');

const brandedIcons = collectStatusIcons({ isPlayer: true, _gravityBrandTimer: 120 }, tickHz);
assert.ok(brandedIcons.some(icon => icon.title === 'Gravity Brand'), 'player status icons should expose Gravity Brand');

const groundingIcons = collectStatusIcons({ isPlayer: true, _groundingBrandTimer: 120 }, tickHz);
assert.ok(groundingIcons.some(icon => icon.title === 'Frostbite Brand'), 'player status icons should expose Frostbite Brand');

const stormControlIcons = collectStatusIcons({ isPlayer: true, _stormSilenceTimer: 120, _stormCurseTimer: 120 }, tickHz);
assert.ok(stormControlIcons.some(icon => icon.title === 'Frozen Voice'), 'player status icons should expose Winterglass healer silence');
assert.ok(stormControlIcons.some(icon => icon.title === 'Rime Curse'), 'player status icons should expose Winterglass tank curse');

const stormVenomIcons = collectStatusIcons({ isPlayer: true, _stormVenomTimer: 120 }, tickHz);
assert.ok(stormVenomIcons.some(icon => icon.title === 'Frostburn'), 'player status icons should expose Frostburn');

const signatureIcons = collectStatusIcons({ isPlayer: true, signature: { t: 100, cd: 100 } }, tickHz);
assert.ok(signatureIcons.some(icon => icon.title === 'Signature Ready'), 'player status icons should expose signature readiness');
const signatureCastIcons = collectStatusIcons({ isPlayer: true, signature: { t: 80, cd: 100 }, signatureCastFx: 8, accent: '#8bdfff' }, tickHz);
assert.ok(signatureCastIcons.some(icon => icon.title === 'Signature Casting'), 'player status icons should expose signature casting');

const blightedIcons = collectStatusIcons({ isPlayer: true, _astralBlightTimer: 120 }, tickHz);
assert.ok(blightedIcons.some(icon => icon.title === 'Astral Blight'), 'player status icons should expose Astral Blight');

console.log('smoke-encounter-bars: ok');

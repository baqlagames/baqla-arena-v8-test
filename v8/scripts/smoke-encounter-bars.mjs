#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  bossCarapaceHudState,
  bossDragonJudgmentHudState,
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

const dragon = {
  id: 4,
  name: 'Winterglass Dragon',
  frozenScalesCD: 720,
  wingBuffetCD: 420,
  iceCometCD: 690,
  frozenVoiceCD: 840,
  frigidMawCD: 1200,
  iceWallCD: 1560,
  diamondStormCD: 480,
  dragonHuntCD: 240,
  mechCD: { frozenScales: 600, wingBuffet: 210, frigidMaw: 300, iceWall: 360, iceComet: 90, frozenVoice: 510, diamondStorm: 400, dragonHunt: 9999 },
};
assert.equal(bossReadableSkillLabel(dragon, 'iceComet'), 'COMETS', 'Winterglass Dragon comets should use readable labels');
assert.equal(bossReadableSkillLabel(dragon, 'diamondStorm'), 'JUDGMENT', 'Winterglass Dragon sky phase should use readable Judgment label');
assert.equal(bossReadableSkillLabel(dragon, 'frigidMaw'), 'MAW', 'Winterglass Dragon cone should use readable label');
assert.equal(bossReadableSkillHint(dragon, 'iceWall'), 'MOVING WALL', 'Winterglass Dragon wall should expose moving-wall hint');
assert.equal(bossReadableSkillHint(dragon, 'frozenScales'), 'MIXED DAMAGE', 'Winterglass Dragon scales should expose mixed-damage hint');
assert.equal(bossReadableSkillHint(dragon, 'diamondStorm'), 'SAFE ZONE', 'Winterglass Dragon Judgment should expose safe-zone hint');
assert.deepEqual(bossReadableSkillPills(dragon).map(skill => skill.name), ['SCALES', 'BUFFET', 'MAW', 'WALL', 'COMETS', 'VOICE', 'JUDGMENT', 'HUNT'], 'Winterglass Dragon skill pills should use dragon-specific labels');
const judgingDragon = { ...dragon, _dragonSkyPhase: true, _dragonJudgmentImmune: true, _dragonSkyTimer: 5400, _dragonSkyMax: 5400, diamondStormDur: 5400 };
assert.deepEqual(bossReadableSkillPills(judgingDragon).map(skill => skill.name), ['JUDGMENT'], 'Dragon Judgment phase should hide normal cast pills');
const judgmentHud = bossDragonJudgmentHudState(judgingDragon, 120);
assert.equal(judgmentHud.seconds, 45, 'Dragon Judgment HUD should show the full 45s cast');
assert.equal(judgmentHud.immune, true, 'Dragon Judgment HUD should expose immunity state');

const urgent = bossUrgentSkillHudState(dragon, tickHz);
assert.equal(urgent.label, 'COMETS', 'urgent mechanic HUD should pick the nearest imminent Dragon mechanic');
assert.equal(urgent.hint, '4 TARGETS', 'urgent mechanic HUD should expose the Dragon mechanic hint');
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

const dragonIcons = collectStatusIcons({ isBoss: true, _dragonScaleMode: 'rime', _dragonSkyPhase: true, _dragonJudgmentImmune: true, _dragonSafeZoneActive: true, _dragonExposedTimer: 120, _dragonHuntActive: true, mechCD: { iceComet: 80 }, iceCometCD: 690 }, tickHz);
assert.ok(dragonIcons.some(icon => icon.title === 'Rime Scales'), 'boss status icons should expose Dragon scales');
assert.ok(dragonIcons.some(icon => icon.title === 'Diamond Judgment'), 'boss status icons should expose Dragon Judgment phase');
assert.ok(dragonIcons.some(icon => icon.title === 'Dragon Immune'), 'boss status icons should expose Dragon immunity');
assert.ok(dragonIcons.some(icon => icon.title === 'Safe Ice'), 'boss status icons should expose active Safe Ice');
assert.ok(dragonIcons.some(icon => icon.title === 'Dragon Exposed'), 'boss status icons should expose Dragon exposed windows');
assert.ok(dragonIcons.some(icon => icon.title === 'Dragon Hunt'), 'boss status icons should expose Dragon Hunt');
assert.ok(dragonIcons.some(icon => icon.title === 'Ice Comets Soon'), 'boss status icons should expose imminent Dragon comets');
const dragonMawIcons = collectStatusIcons({ isBoss: true, mechCD: { frigidMaw: 100 }, frigidMawCD: 1200 }, tickHz);
assert.ok(dragonMawIcons.some(icon => icon.title === 'Frigid Maw Soon'), 'boss status icons should expose imminent Dragon cone');
const dragonWallIcons = collectStatusIcons({ isBoss: true, mechCD: { iceWall: 110 }, iceWallCD: 1560 }, tickHz);
assert.ok(dragonWallIcons.some(icon => icon.title === 'Icebreaker Wall Soon'), 'boss status icons should expose imminent Dragon wall');

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

const rimeVenomIcons = collectStatusIcons({ isPlayer: true, _rimeVenomTimer: 120 }, tickHz);
assert.ok(rimeVenomIcons.some(icon => icon.title === 'Rime Venom'), 'player status icons should expose Dragon Rime Venom');

const guardIcons = collectStatusIcons({ dragonSkyGuard: true, dragonGuardKind: 'magic', name: 'Frostglass Colossus', priorityTarget: true, preferredBy: 'magic' }, tickHz);
assert.ok(guardIcons.some(icon => icon.title === 'Frostglass Colossus'), 'enemy status icons should expose Dragon Judgment guards');

const signatureIcons = collectStatusIcons({ isPlayer: true, signature: { t: 100, cd: 100 } }, tickHz);
assert.ok(signatureIcons.some(icon => icon.title === 'Signature Ready'), 'player status icons should expose signature readiness');
const signatureCastIcons = collectStatusIcons({ isPlayer: true, signature: { t: 80, cd: 100 }, signatureCastFx: 8, accent: '#8bdfff' }, tickHz);
assert.ok(signatureCastIcons.some(icon => icon.title === 'Signature Casting'), 'player status icons should expose signature casting');

const blightedIcons = collectStatusIcons({ isPlayer: true, _astralBlightTimer: 120 }, tickHz);
assert.ok(blightedIcons.some(icon => icon.title === 'Astral Blight'), 'player status icons should expose Astral Blight');

console.log('smoke-encounter-bars: ok');

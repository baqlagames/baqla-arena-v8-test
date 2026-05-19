import { clamp, rnd } from '../core/math.js';
import { GAME_TICK_HZ } from '../core/constants.js';
import { ARENA_L, ARENA_R } from '../data/tuning.js?v=9d6b186-combat-feedback';
import { clampActorToSpawnArea, spawnAreaFromView } from './arena-spawn-bounds.js';

function royalCarapaceShieldHp(boss) {
  const raw = (boss.maxHp || 1) * (boss.royalCarapaceShieldPct || 0.04);
  return Math.round(clamp(raw, boss.royalCarapaceShieldMin || 500, boss.royalCarapaceShieldMax || 900));
}

function spawnRoyalHatchlings(boss, count, ctx) {
  const { enemies, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, spawnLeft, spawnRight, addParticle: addP, addDamageText: addDmg } = ctx;
  const spawnArea = spawnAreaFromView({
    arenaLeft: ARENA_L,
    arenaRight: ARENA_R,
    arenaTop: ARENA_TOP,
    arenaBottom: ARENA_BOT,
    spawnLeft,
    spawnRight,
    fallbackWidth: W,
  });
  count = Math.max(0, Math.round(count || 0));
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const hatchling = {
      name: 'Royal Hatchling',
      act: 1,
      arch: 'ranged',
      x: clamp(boss.x + side * (44 + row * 18) + rnd(-10, 10), ARENA_L + 24, ARENA_R - 24),
      y: clamp(boss.y + 36 + row * 18 + rnd(-8, 8), ARENA_TOP + 50, ARENA_BOT - 90),
      color: '#d4a417',
      accent: '#7a5e0d',
      maxHp: Math.max(135, Math.round((boss.maxHp || 10000) * 0.011)),
      hp: Math.max(135, Math.round((boss.maxHp || 10000) * 0.011)),
      dmg: Math.max(12, Math.round((boss.dmg || 80) * 0.24)),
      speed: 0.46,
      atkSpd: 82,
      range: 145,
      size: Math.max(13, (boss.size || 48) * 0.36),
      armor: 0,
      magicRes: 1,
      armorType: 'unarmored',
      flying: true,
      projType: 'normal',
      prefersBackline: true,
      points: 28,
      isEnemy: true,
      cd: Math.round(rnd(0, 36)),
      facing: -1,
      bobPhase: Math.random() * Math.PI * 2,
      debuffs: {},
      spawnFrame: frame
    };
    clampActorToSpawnArea(hatchling, {
      ...spawnArea,
      topMargin: 52,
      bottomMargin: 64,
    });
    enemies.push(hatchling);
    addP(hatchling.x, hatchling.y, '#ffdd44', 16, 4);
    beamFx.push({ x1: boss.x, y1: boss.y, x2: hatchling.x, y2: hatchling.y, life: 0.22, maxLife: 0.22, color: '#ffdd44', width: 2, straight: false });
  }
  if (count > 0) addDmg(boss.x, boss.y - boss.size - 24, 'HATCHLINGS!', '#ffdd44', { sz: 13, bold: true, outline: '#4a2600' });
}

function startRoyalCarapace(boss, threshold, ctx) {
  const { groundFx, addParticle: addP, addDamageText: addDmg, showFlash, shake } = ctx;
  const hp = royalCarapaceShieldHp(boss);
  boss.royalCarapaceTimer = boss.royalCarapaceCast || Math.round(6 * GAME_TICK_HZ);
  boss.royalCarapaceMax = boss.royalCarapaceTimer;
  boss.royalCarapaceThreshold = threshold;
  boss.royalCarapacePulseT = 0;
  boss._royalCarapaceBroken = false;
  boss.hiveShield = { hp, maxHp: hp, reflect: 0, royalCarapace: true };
  boss.cd = Math.max(boss.cd || 0, boss.royalCarapaceTimer);
  spawnRoyalHatchlings(boss, boss.royalCarapaceAdds || 0, ctx);
  for (let i = 0; i < 34; i++) addP(boss.x, boss.y, '#ffdd44', 1, 5);
  groundFx.push({ x: boss.x, y: boss.y, r: 0, maxR: 120, life: 0.55, color: '#ffdd44' });
  addDmg(boss.x, boss.y - boss.size - 14, 'BREAK CARAPACE!', '#ffdd44', { sz: 15, bold: true, outline: '#4a2600' });
  showFlash('BREAK ROYAL CARAPACE!', '#ffdd44', 120);
  shake(8);
}

function finishRoyalCarapaceBroken(boss, ctx) {
  const { groundFx, addParticle: addP, addDamageText: addDmg, showFlash, shake } = ctx;
  boss.royalCarapaceTimer = 0;
  boss.royalCarapaceMax = 0;
  boss.royalCarapacePulseT = 0;
  boss.hiveShield = null;
  boss._royalCarapaceBroken = false;
  boss.royalCarapaceLockout = 2 * GAME_TICK_HZ;
  boss.stunned = Math.max(boss.stunned || 0, Math.round(1.5 * GAME_TICK_HZ));
  addDmg(boss.x, boss.y - boss.size - 12, 'CARAPACE BROKEN!', '#aaff66', { sz: 16, bold: true, outline: '#163500' });
  addP(boss.x, boss.y, '#aaff66', 34, 5);
  groundFx.push({ x: boss.x, y: boss.y, r: 0, maxR: 145, life: 0.45, color: '#aaff66' });
  showFlash('CARAPACE BROKEN! BOSS STUNNED', '#aaff66', 80);
  shake(10);
}

function finishRoyalCarapaceBurst(boss, ctx) {
  const { units, groundFx, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, shake } = ctx;
  boss.royalCarapaceTimer = 0;
  boss.royalCarapaceMax = 0;
  boss.royalCarapacePulseT = 0;
  boss.hiveShield = null;
  boss._royalCarapaceBroken = false;
  boss.royalCarapaceLockout = 2 * GAME_TICK_HZ;
  const dmg = boss.royalCarapaceFailDmg || 80;
  for (const unit of units) {
    if (unit.hp <= 0 || unit.isGhost) continue;
    const mult = (unit.arch === 'tank' || unit.taunt) ? 0.75 : 1;
    dealDamage(unit, Math.round(dmg * mult), boss, 'magic');
    addP(unit.x, unit.y, '#ffaa00', 8, 4);
  }
  for (let i = 0; i < 60; i++) addP(boss.x, boss.y, '#ffaa00', 1, 7);
  groundFx.push({ x: boss.x, y: boss.y, r: 0, maxR: 360, life: 0.65, color: '#ffaa00' });
  addDmg(boss.x, boss.y - boss.size - 14, 'HIVE BURST!', '#ff5533', { sz: 18, bold: true, outline: '#3a0600' });
  showFlash('HIVE BURST! CARAPACE WAS NOT BROKEN', '#ff5533', 130);
  shake(18);
}

export function updateRoyalCarapace(boss, ctx) {
  const { units, groundFx, frame, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash } = ctx;
  if (!(boss.royalCarapaceTimer > 0)) return false;
  if (boss._royalCarapaceBroken || !boss.hiveShield || boss.hiveShield.hp <= 0) {
    finishRoyalCarapaceBroken(boss, ctx);
    return true;
  }
  boss.royalCarapaceTimer--;
  boss.royalCarapacePulseT = (boss.royalCarapacePulseT || 0) + 1;
  if (boss.royalCarapacePulseT >= GAME_TICK_HZ) {
    boss.royalCarapacePulseT = 0;
    const pulseDmg = boss.royalCarapaceTickDmg || 24;
    for (const unit of units) {
      if (unit.hp <= 0 || unit.isGhost) continue;
      const mult = (unit.arch === 'tank' || unit.taunt) ? 0.45 : 1;
      dealDamage(unit, Math.round(pulseDmg * mult), boss, 'magic');
      addP(unit.x, unit.y, '#ffdd44', 4, 3);
    }
    addDmg(boss.x, boss.y - boss.size - 8, 'STINGING SWARM', '#ffdd44', { sz: 11, bold: true, outline: '#4a2600' });
  }
  if (frame % 6 === 0) {
    addP(boss.x + rnd(-boss.size * 0.5, boss.size * 0.5), boss.y - rnd(0, boss.size * 0.7), '#ffdd44', 1, 3);
    groundFx.push({ x: boss.x, y: boss.y, r: 0, maxR: boss.size + 16, life: 0.18, color: '#ffdd44' });
  }
  if (boss.royalCarapaceTimer === Math.round(2 * GAME_TICK_HZ)) showFlash('HIVE BURST SOON!', '#ff5533', 65);
  if (boss.royalCarapaceTimer <= 0) finishRoyalCarapaceBurst(boss, ctx);
  return true;
}

export function tryRoyalCarapace(boss, ctx) {
  if (!boss.royalCarapaceAt) return false;
  if (boss.royalCarapaceLockout > 0) { boss.royalCarapaceLockout--; return false; }
  if (!boss._royalCarapaceUsed) boss._royalCarapaceUsed = {};
  const list = (Array.isArray(boss.royalCarapaceAt) ? boss.royalCarapaceAt : [boss.royalCarapaceAt]).slice().sort((a, b) => b - a);
  const hpPct = (boss.hp || 0) / (boss.maxHp || 1);
  for (const threshold of list) {
    const key = Math.round(threshold * 100);
    if (!boss._royalCarapaceUsed[key] && hpPct <= threshold) {
      boss._royalCarapaceUsed[key] = true;
      startRoyalCarapace(boss, threshold, ctx);
      return true;
    }
  }
  return false;
}

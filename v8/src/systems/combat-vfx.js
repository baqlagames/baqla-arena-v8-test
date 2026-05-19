import { rnd } from '../core/math.js';

export function playerCombatColor(attacker, dmgType, attackTypeOverride, opts) {
  const projectileType = (opts && opts.projType) || attackTypeOverride || (attacker && attacker.projType) || (attacker && attacker.attackType) || dmgType || 'normal';
  if (projectileType === 'fire') return '#ff7a22';
  if (projectileType === 'frost' || projectileType === 'ice') return '#8bdfff';
  if (projectileType === 'lightning') return '#fff15a';
  if (projectileType === 'holy') return '#ffe066';
  if (projectileType === 'poison' || (attacker && attacker.poisonOnHit)) return '#78d64b';
  if (projectileType === 'curse' || projectileType === 'voidShard' || projectileType === 'voidOrb' || projectileType === 'voidBolt') return '#a855f7';
  if (projectileType === 'pierce') return '#44ddff';
  if (projectileType === 'bolt') return attacker && attacker.unitIdx === 6 ? '#ff7a22' : '#44ccff';
  if (projectileType === 'magic') return '#aa66ff';
  if (projectileType === 'physical') return '#ff8844';
  return attacker && attacker.arch === 'healer' ? '#66ffaa' : '#ff8844';
}

export function spawnPlayerAbilityCastVfx({ unit, frame, emitParticle, groundEffects }) {
  if (!unit || !unit.isPlayer || unit.hp <= 0) return;
  if (unit._lastAbilityCastVfxFrame === frame) return;
  unit._lastAbilityCastVfxFrame = frame;
  const color = playerCombatColor(unit, 'magic', null, null);
  const size = unit.size || 16;
  unit.signatureCastFx = Math.max(unit.signatureCastFx || 0, 10);
  emitParticle(unit.x, unit.y - size * 0.15, color, 8, 3);
  emitParticle(unit.x, unit.y - size * 0.25, '#ffffff', 3, 2);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: Math.max(32, size * 2.1), life: 0.28, color, flatten: true });
}

export function spawnPlayerProjectileCastVfx({ from, to, opts, frame, emitParticle, beamEffects }) {
  if (!from || !from.isPlayer || !to) return;
  if (from._lastProjectileCastVfxFrame === frame) return;
  from._lastProjectileCastVfxFrame = frame;
  const color = playerCombatColor(from, opts && opts.projType === 'curse' ? 'magic' : 'normal', opts && opts.attackType, opts);
  const size = from.size || 16;
  const angle = Math.atan2((to.y || from.y) - from.y, (to.x || from.x) - from.x);
  const sx = from.x + Math.cos(angle) * size * 0.55;
  const sy = from.y + Math.sin(angle) * size * 0.25 - size * 0.18;
  emitParticle(sx, sy, color, 4, 2.5);
  emitParticle(sx, sy, '#ffffff', 1, 1.8);
  beamEffects.push({
    x1: sx,
    y1: sy,
    x2: sx + Math.cos(angle) * 18,
    y2: sy + Math.sin(angle) * 18,
    life: 0.12,
    maxLife: 0.12,
    color,
    width: 2.2,
    straight: true,
  });
}

export function spawnPlayerImpactVfx({
  target,
  attacker,
  dmgType,
  attackTypeOverride,
  damage,
  opts,
  frame,
  emitParticle,
  groundEffects,
  beamEffects,
}) {
  if (!target || !attacker || !attacker.isPlayer || !target.isEnemy) return;
  if (opts && opts.noCombatVfx) return;
  if (target._lastPlayerImpactVfxFrame === frame) return;
  target._lastPlayerImpactVfxFrame = frame;

  const color = playerCombatColor(attacker, dmgType, attackTypeOverride, opts);
  const size = target.size || 16;
  const ax = attacker.x == null ? target.x : attacker.x;
  const ay = attacker.y == null ? target.y : attacker.y;
  const angle = Math.atan2(target.y - ay, target.x - ax);
  const base = Math.max(1, attacker.dmg || damage || 1);
  const isCrit = !!(opts && opts.isCrit);
  const isBig = isCrit || damage >= base * 1.45 || attackTypeOverride === 'ignoreDefense';
  const burstN = isBig ? 10 : 5;
  const burstSize = isBig ? 3.6 : 2.4;
  emitParticle(target.x, target.y, color, burstN, burstSize);
  if (isBig) emitParticle(target.x, target.y, '#ffffff', 4, 2.2);

  const projectileType = attackTypeOverride || (attacker && attacker.projType) || (attacker && attacker.attackType) || dmgType || 'normal';
  if (projectileType === 'fire') {
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: size * (isBig ? 1.8 : 1.25), life: 0.26, color: '#ff6600' });
    for (let i = 0; i < 5; i++) emitParticle(target.x + rnd(-size * 0.35, size * 0.35), target.y + rnd(-size * 0.35, size * 0.35), '#ffaa00', 1, 2);
  } else if (projectileType === 'frost' || projectileType === 'ice') {
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: size * 1.25, life: 0.24, color: '#88ddff' });
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + frame * 0.04;
      beamEffects.push({ x1: target.x, y1: target.y, x2: target.x + Math.cos(a) * size * 0.9, y2: target.y + Math.sin(a) * size * 0.65, life: 0.20, maxLife: 0.20, color: '#c8f6ff', width: 1.4, straight: true });
    }
  } else if (projectileType === 'lightning') {
    for (let i = 0; i < 3; i++) {
      const a = angle + (i - 1) * 0.55;
      beamEffects.push({ x1: target.x - Math.cos(a) * size * 0.6, y1: target.y - Math.sin(a) * size * 0.5, x2: target.x + Math.cos(a) * size * 0.7, y2: target.y + Math.sin(a) * size * 0.55, life: 0.18, maxLife: 0.18, color: '#fff15a', width: 2, straight: false });
    }
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: size * 1.15, life: 0.20, color: '#fff15a' });
  } else if (projectileType === 'holy' || attacker.arch === 'paladin') {
    beamEffects.push({ x1: target.x, y1: target.y - size * 1.9, x2: target.x, y2: target.y + size * 0.25, life: 0.22, maxLife: 0.22, color: '#ffe066', width: isBig ? 4 : 2.5, straight: true });
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: size * (isBig ? 1.7 : 1.25), life: 0.28, color: '#ffd700', flatten: true });
  } else if (projectileType === 'poison' || attacker.poisonOnHit) {
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: size * (isBig ? 1.55 : 1.12), life: 0.32, color: '#55aa33' });
    for (let i = 0; i < 6; i++) {
      const a = frame * 0.08 + i * Math.PI * 2 / 6;
      emitParticle(target.x + Math.cos(a) * size * 0.5, target.y + Math.sin(a) * size * 0.35, i % 2 ? '#bbff55' : '#55aa33', 1, 2.4);
    }
  } else if (projectileType === 'curse' || projectileType === 'voidShard' || projectileType === 'voidOrb' || projectileType === 'voidBolt' || projectileType === 'magic' || dmgType === 'magic') {
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: size * (isBig ? 1.55 : 1.15), life: 0.26, color });
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: size * 0.58, life: 0.18, color: '#1a0020' });
    for (let i = 0; i < 4; i++) {
      const a = frame * 0.08 + i * Math.PI / 2;
      emitParticle(target.x + Math.cos(a) * size * 0.55, target.y + Math.sin(a) * size * 0.35, color, 1, 2);
    }
  } else if (projectileType === 'pierce') {
    beamEffects.push({ x1: target.x - Math.cos(angle) * size * 1.1, y1: target.y - Math.sin(angle) * size * 0.8, x2: target.x + Math.cos(angle) * size * 1.15, y2: target.y + Math.sin(angle) * size * 0.85, life: 0.18, maxLife: 0.18, color: '#44ddff', width: isBig ? 3 : 2, straight: true });
    emitParticle(target.x + Math.cos(angle) * size * 0.7, target.y + Math.sin(angle) * size * 0.55, '#ffffff', 2, 1.8);
  } else {
    const normal = angle + Math.PI / 2;
    beamEffects.push({ x1: target.x - Math.cos(normal) * size * 0.70, y1: target.y - Math.sin(normal) * size * 0.55, x2: target.x + Math.cos(normal) * size * 0.70, y2: target.y + Math.sin(normal) * size * 0.55, life: 0.16, maxLife: 0.16, color: '#ffffff', width: isBig ? 3 : 2, straight: true });
    beamEffects.push({ x1: target.x - Math.cos(angle) * size * 0.55, y1: target.y - Math.sin(angle) * size * 0.42, x2: target.x + Math.cos(angle) * size * 0.70, y2: target.y + Math.sin(angle) * size * 0.55, life: 0.16, maxLife: 0.16, color, width: isBig ? 3 : 1.8, straight: true });
  }
}

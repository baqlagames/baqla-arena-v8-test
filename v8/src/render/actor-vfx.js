import { drawActorShieldVfx } from './shield-vfx.js';

function fallbackRandomRange(min, max) {
  return min + Math.random() * (max - min);
}

function emitParticle(emitParticleFn, x, y, color, count, size) {
  if (emitParticleFn) emitParticleFn(x, y, color, count, size);
}

export function playerVfxColor(unit) {
  const projectileType = unit.projType || unit.attackType || '';
  if (projectileType === 'fire') return '#ff7a22';
  if (projectileType === 'frost' || projectileType === 'ice') return '#8bdfff';
  if (projectileType === 'lightning') return '#fff15a';
  if (projectileType === 'curse' || projectileType === 'voidShard' || projectileType === 'voidOrb' || projectileType === 'voidBolt') return '#a855f7';
  if (projectileType === 'holy' || unit.arch === 'paladin') return '#ffe066';
  if (projectileType === 'pierce') return '#7ee45a';
  if (projectileType === 'magic') return '#aa66ff';
  if (unit.arch === 'healer') return '#66ffaa';
  if (unit.arch === 'tank' || unit.taunt) return '#ffd166';
  if (unit.arch === 'melee' || unit.stealth) return '#ff8c44';
  return unit.accent || unit.color || '#88ddff';
}

export function unitAttackSpeedVfxState(unit) {
  if (!unit) return { active: false, color: '#ffaa44', intensity: 0 };
  const timerValues = [
    unit.atkSpdBuffTimer,
    unit._jazarSigHasteTimer,
    unit._thousandCutsTimer,
    unit._bladeStormTimer,
    unit._trueshotAuraTimer,
    unit.frenzyForceActiveTimer,
    unit._frenzyBMTimer,
    unit._enrageBladeTimer,
    unit.overclock && unit.overclock.active,
    unit._voidform && unit._voidform.timer,
    unit._trueshot && Math.max(0, unit._trueshot.dur - unit._trueshot.t),
  ];
  const active = timerValues.some(value => Number.isFinite(value) && value > 0)
    || !!unit.bloodfury
    || !!unit.frenzyActive
    || !!(unit.frenzy && unit.frenzy.active);
  if (!active) return { active: false, color: '#ffaa44', intensity: 0 };
  const hot = !!(unit.frenzyActive || unit.bloodfury || unit._bladeStormTimer > 0 || unit._thousandCutsTimer > 0);
  const arcane = !!(unit._voidform || unit._trueshot || unit._trueshotAuraTimer > 0);
  return {
    active: true,
    color: arcane ? '#aa66ff' : hot ? '#ff8844' : '#ffaa44',
    intensity: hot ? 1 : 0.75,
  };
}

export function drawPlayerAuraUnder(ctx, { unit, x, y, size, frame }) {
  const col = playerVfxColor(unit);
  const haste = unitAttackSpeedVfxState(unit);
  const t = frame * 0.055 + (unit.unitIdx || 0) * 0.7 + (unit.bobPhase || 0);
  const isMinor = !!(unit.isMinion || unit.isMirror || unit.isGhost);
  const level = unit.cellLevel || unit.level || 1;
  ctx.save();
  if (unit.spawnFrame != null) {
    const age = frame - unit.spawnFrame;
    if (age >= 0 && age < 24) {
      const p = 1 - age / 24;
      ctx.globalAlpha = 0.32 * p;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y + size * 0.72, size * (1.35 + 0.35 * (1 - p)), size * (0.34 + 0.07 * (1 - p)), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.10 * p;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x, y + size * 0.62, size * 1.08, size * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (!isMinor) {
    ctx.globalAlpha = 0.10 + 0.04 * Math.sin(t);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.70, size * 1.05, size * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!isMinor && level >= 3) {
    const lvCol = level >= 5 ? '#ffd700' : level >= 4 ? '#a855f7' : '#3aa0ff';
    ctx.globalAlpha = level >= 5 ? 0.32 + 0.10 * Math.sin(t * 1.4) : 0.20;
    ctx.strokeStyle = lvCol;
    ctx.lineWidth = level >= 5 ? 2.2 : 1.4;
    ctx.setLineDash(level >= 5 ? [8, 5] : [4, 6]);
    ctx.lineDashOffset = -frame * (level >= 5 ? 0.55 : 0.25);
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.78, size * (level >= 5 ? 1.36 : 1.18), size * (level >= 5 ? 0.34 : 0.28), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (haste.active) {
    ctx.globalAlpha = 0.20 + 0.12 * Math.sin(t * 2.2);
    ctx.strokeStyle = haste.color;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([7, 5]);
    ctx.lineDashOffset = -frame * (0.7 + haste.intensity * 0.35);
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.74, size * 1.22, size * 0.30, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.10 + 0.05 * haste.intensity;
    ctx.fillStyle = haste.color;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.72, size * 1.18, size * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (unit.arch === 'tank' || unit.taunt) {
    ctx.globalAlpha = 0.24 + 0.06 * Math.sin(t);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.82, size * 1.10, size * 0.22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.18;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * size * 0.34, y + size * 0.62);
      ctx.lineTo(x + i * size * 0.20, y + size * 0.88);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#fff2bd';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.76, size * 0.52, size * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (unit.arch === 'healer') {
    ctx.globalAlpha = 0.20 + 0.08 * Math.sin(t);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -frame * 0.28;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.70, size * 1.05, size * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 3; i++) {
      const a = t + i * Math.PI * 2 / 3;
      ctx.globalAlpha = 0.24;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * size * 0.75, y + size * 0.66 + Math.sin(a) * size * 0.13, size * 0.12, size * 0.05, a, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (unit.arch === 'ranged' || unit.arch === 'caster' || unit.range > 100) {
    ctx.globalAlpha = 0.20;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 6]);
    ctx.lineDashOffset = -frame * 0.45;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.73, size * 0.92, size * 0.20, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.55, y + size * 0.68);
    ctx.lineTo(x + size * 0.55, y + size * 0.68);
    ctx.stroke();
  } else if (unit.arch === 'melee' || unit.stealth) {
    ctx.globalAlpha = 0.20;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - size * (0.70 + i * 0.10), y + size * (0.42 + i * 0.10));
      ctx.lineTo(x - size * (1.08 + i * 0.14), y + size * (0.50 + i * 0.10));
      ctx.stroke();
    }
  }
  if (unit.attackType === 'magic' || unit.projType === 'curse' || unit.projType === 'voidShard') {
    ctx.globalAlpha = 0.17 + 0.06 * Math.sin(t);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([3, 5]);
    ctx.lineDashOffset = frame * 0.25;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.54, size * 0.78, size * 0.20, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (isMinor) {
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.72, size * 0.82, size * 0.16, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPlayerAuraOver(ctx, {
  unit,
  x,
  y,
  size,
  frame,
  emitParticle: emitParticleFn,
  randomRange = fallbackRandomRange,
}) {
  const col = playerVfxColor(unit);
  const haste = unitAttackSpeedVfxState(unit);
  const t = frame * 0.075 + (unit.unitIdx || 0) * 0.8 + (unit.bobPhase || 0);
  const lowHp = unit.maxHp > 0 && unit.hp > 0 && unit.hp / unit.maxHp <= 0.28;
  ctx.save();
  if (lowHp) {
    ctx.globalAlpha = 0.18 + 0.12 * Math.sin(t * 3.2);
    ctx.fillStyle = '#ff2233';
    ctx.beginPath();
    ctx.arc(x, y, size + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.52;
    ctx.strokeStyle = '#ff6677';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, size + 8 + Math.sin(t * 2.2) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (haste.active) {
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = haste.color;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) {
      const a = t * 1.8 + i * Math.PI * 2 / 4;
      const sx = x + Math.cos(a) * size * 0.78;
      const sy = y - size * 0.10 + Math.sin(a) * size * 0.38;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - Math.cos(a) * size * 0.34, sy - Math.sin(a) * size * 0.16);
      ctx.stroke();
    }
    if (frame % 10 === 0) emitParticle(emitParticleFn, x + randomRange(-size * 0.55, size * 0.55), y - randomRange(0, size * 0.75), haste.color, 1, 2);
  }
  if (unit.arch === 'healer') {
    ctx.globalAlpha = 0.50 + 0.18 * Math.sin(t);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.4;
    const px = x + size * 0.42;
    const py = y - size * 0.78;
    ctx.beginPath();
    ctx.moveTo(px - 3, py);
    ctx.lineTo(px + 3, py);
    ctx.moveTo(px, py - 3);
    ctx.lineTo(px, py + 3);
    ctx.stroke();
    if (frame % 12 === 0) emitParticle(emitParticleFn, x + randomRange(-size * 0.45, size * 0.45), y - randomRange(2, size * 0.8), col, 1, 2);
    if (unit._lastHealTarget && unit._lastHealTarget.hp > 0 && unit._lastHealTarget !== unit) {
      ctx.globalAlpha = 0.22 + 0.08 * Math.sin(t);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -frame * 0.35;
      ctx.beginPath();
      ctx.moveTo(x, y - size * 0.30);
      ctx.lineTo(unit._lastHealTarget.x, unit._lastHealTarget.y - (unit._lastHealTarget.size || size) * 0.25);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  if (unit.arch === 'tank' || unit.taunt) {
    ctx.globalAlpha = 0.42 + 0.16 * Math.sin(t * 1.3);
    ctx.strokeStyle = '#fff2bd';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.48, y - size * 0.15);
    ctx.lineTo(x - size * 0.12, y - size * 0.34);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.16, y + size * 0.05);
    ctx.lineTo(x + size * 0.54, y - size * 0.08);
    ctx.stroke();
    if (unit.taunt && frame % 18 === 0) emitParticle(emitParticleFn, x, y + size * 0.20, col, 1, 2.5);
  }
  if (unit.arch === 'ranged' || unit.range > 120) {
    ctx.globalAlpha = 0.36;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.2;
    const yy = y - size * 0.62;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.34, yy);
    ctx.lineTo(x - size * 0.18, yy);
    ctx.moveTo(x + size * 0.18, yy);
    ctx.lineTo(x + size * 0.34, yy);
    ctx.stroke();
  }
  if (unit.arch === 'caster' || unit.attackType === 'magic' || unit.projType === 'fire' || unit.projType === 'frost' || unit.projType === 'lightning') {
    ctx.globalAlpha = 0.30;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 4]);
    ctx.lineDashOffset = frame * 0.32;
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.12, size * 0.90, size * 0.30, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (unit.arch === 'melee' || unit.stealth) {
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = unit.stealth ? '#ff4d88' : col;
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 2; i++) {
      const a = t * 1.4 + i * Math.PI;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * size * 0.12, y - size * 0.12, size * (0.70 + i * 0.18), a - 0.62, a + 0.18);
      ctx.stroke();
    }
  }
  if (unit.arch === 'paladin' || unit.projType === 'holy' || unit.attackType === 'holy') {
    ctx.globalAlpha = 0.34 + 0.12 * Math.sin(t);
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.92, size * 0.50, size * 0.10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (unit.attackType === 'magic' || unit.projType === 'curse' || unit.projType === 'voidShard' || unit.projType === 'lightning') {
    for (let i = 0; i < 3; i++) {
      const a = t + i * Math.PI * 2 / 3;
      ctx.globalAlpha = 0.38;
      ctx.fillStyle = i === 0 ? '#ffffff' : col;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * size * 0.68, y - size * 0.32 + Math.sin(a) * size * 0.17, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (unit.stealth && unit.stealthHits === 0) {
    ctx.globalAlpha = 0.26 + 0.12 * Math.sin(t * 1.8);
    ctx.strokeStyle = '#d8b4fe';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.05, size * 0.82, size * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (unit.isMinion && unit.parent && unit.parent.hp > 0) {
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.55);
    ctx.lineTo(x + (unit.parent.x - x) * 0.18, y - size * 0.55 + (unit.parent.y - y) * 0.10);
    ctx.stroke();
  }
  ctx.restore();
}

export function enemyVfxColor(enemy) {
  const actCol = { 1: '#8bd450', 2: '#a855f7', 3: '#d4a857', 4: '#8bdfff', 5: '#ff3b8d' }[enemy.act || 1] || '#a855f7';
  if (enemy.projType === 'fire' || enemy.meteorCD) return '#ff7a22';
  if (enemy.projType === 'frost' || enemy.slowOnHit) return '#8bdfff';
  if (enemy.poisonOnHit) return '#78d64b';
  if (enemy.projType === 'curse' || enemy.armorType === 'warded' || enemy.arch === 'caster') return actCol;
  return enemy.accent || actCol;
}

export function drawEnemyDashedEllipse(ctx, { x, y, rx, ry, color, alpha, rotation = 0, frame }) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = -frame * 0.35;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawEnemyVfxUnder(ctx, { enemy, x, y, size, frame }) {
  const col = enemyVfxColor(enemy);
  const t = frame * 0.055 + (enemy.id || 0) * 0.7 + (enemy.bobPhase || 0);
  ctx.save();
  if (enemy.spawnFrame != null) {
    const age = frame - enemy.spawnFrame;
    if (age >= 0 && age < 28) {
      const p = 1 - age / 28;
      ctx.globalAlpha = 0.34 * p;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y + size * 0.72, size * (1.45 + 0.35 * (1 - p)), size * (0.38 + 0.08 * (1 - p)), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.12 * p;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x, y + size * 0.58, size * 1.15, size * 0.30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (enemy.isBoss) {
    ctx.globalAlpha = 0.16 + 0.06 * Math.sin(t);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.78, size * 1.45, size * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.75, size * 1.60, size * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (enemy.isElite || enemy.champion) {
    ctx.globalAlpha = 0.28 + 0.10 * Math.sin(t * 1.5);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = enemy.isBoss ? 3 : 2;
    ctx.setLineDash([7, 5]);
    ctx.lineDashOffset = -frame * 0.45;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.82, size * 1.42, size * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (enemy.armorType === 'warded' || enemy.arch === 'caster' || enemy.projType === 'curse') {
    drawEnemyDashedEllipse(ctx, { x, y: y + size * 0.50, rx: size * 0.98, ry: size * 0.25, color: col, alpha: 0.22 + 0.08 * Math.sin(t), frame });
    drawEnemyDashedEllipse(ctx, { x, y: y + size * 0.50, rx: size * 0.72, ry: size * 0.18, color: '#fff', alpha: 0.10, frame });
  }
  if (enemy.armorType === 'heavy' || enemy.taunt) {
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.92, size * 1.05, size * 0.20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.18 + 0.06 * Math.sin(t);
    ctx.strokeStyle = enemy.armorType === 'heavy' ? '#d8a938' : col;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.86, size * 1.12, size * 0.23, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (enemy.flying) {
    ctx.globalAlpha = 0.14 + 0.05 * Math.sin(t);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) {
      const yy = y + size * (0.52 + i * 0.22);
      ctx.beginPath();
      ctx.moveTo(x - size * (0.95 - i * 0.12), yy);
      ctx.quadraticCurveTo(x, yy + size * (0.16 + i * 0.02), x + size * (0.95 - i * 0.12), yy);
      ctx.stroke();
    }
  }
  if (enemy.splashOnHit || enemy.meteorCD) {
    ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 1.4);
    ctx.strokeStyle = '#ff8c22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.70, size * 1.03, size * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (enemy.prefersBackline || enemy.stealth) {
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = enemy.stealth ? '#b388ff' : '#ff5a66';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - size * (0.85 + i * 0.20), y + size * (0.35 + i * 0.12));
      ctx.lineTo(x - size * (1.20 + i * 0.22), y + size * (0.42 + i * 0.12));
      ctx.stroke();
    }
  }
  if (enemy.arch === 'assassin' || enemy.prefersBackline) {
    ctx.globalAlpha = 0.20;
    ctx.strokeStyle = '#ff5a66';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 2; i++) {
      const yy = y + size * (0.52 + i * 0.14);
      ctx.beginPath();
      ctx.moveTo(x - size * 1.20, yy);
      ctx.lineTo(x - size * 0.48, yy - size * 0.08);
      ctx.stroke();
    }
  }
  let drewWaveShield = false;
  if (enemy.waveMechanic) {
    const mc = { shield: '#44aaff', banner: '#ffcc44', medic: '#44ff88', ritual: '#aa66ff', exploding: '#ff8844', sniper: '#ff4444' }[enemy.waveMechanic] || '#ffd700';
    ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 1.5);
    ctx.strokeStyle = mc;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.78, size * 1.26, size * 0.33, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = mc;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.74, size * 1.10, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawEnemyVfxOver(ctx, {
  enemy,
  x,
  y,
  size,
  frame,
  emitParticle: emitParticleFn,
  randomRange = fallbackRandomRange,
}) {
  const col = enemyVfxColor(enemy);
  const t = frame * 0.075 + (enemy.id || 0) * 0.8 + (enemy.bobPhase || 0);
  ctx.save();
  if (enemy.armorType === 'warded' || enemy.arch === 'caster' || enemy.chainBoltCD) {
    for (let i = 0; i < 3; i++) {
      const a = t + i * Math.PI * 2 / 3;
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = i === 0 ? '#fff' : col;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * size * 0.72, y - size * 0.28 + Math.sin(a) * size * 0.18, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.24, y - size * 0.78);
    ctx.lineTo(x, y - size * 0.92);
    ctx.lineTo(x + size * 0.24, y - size * 0.78);
    ctx.stroke();
  }
  if (enemy.isBoss && enemy.maxHp > 0) {
    const hpPct = enemy.hp / enemy.maxHp;
    if (hpPct <= 0.66) {
      ctx.globalAlpha = hpPct <= 0.33 ? 0.72 : 0.48;
      ctx.strokeStyle = hpPct <= 0.33 ? '#ff8844' : '#ffd166';
      ctx.lineWidth = hpPct <= 0.33 ? 2.2 : 1.6;
      for (let i = 0; i < (hpPct <= 0.33 ? 5 : 3); i++) {
        const a = -0.8 + i * 0.42 + Math.sin(t + i) * 0.08;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * size * 0.25, y - size * 0.30 + i * 2);
        ctx.lineTo(x + Math.cos(a) * size * 0.95, y - size * 0.55 + i * 4);
        ctx.stroke();
      }
    }
    if (enemy._phaseFlashTimer > 0) {
      const p = enemy._phaseFlashTimer / 60;
      ctx.globalAlpha = 0.50 * p;
      ctx.strokeStyle = enemy.color || '#ff8844';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, size + 16 + (1 - p) * 28, 0, Math.PI * 2);
      ctx.stroke();
      enemy._phaseFlashTimer--;
    }
  }
  if (enemy.armorType === 'heavy' || enemy.taunt) {
    const glint = 0.45 + 0.35 * Math.sin(t * 1.8);
    ctx.globalAlpha = glint;
    ctx.strokeStyle = '#fff4b8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.42, y - size * 0.18);
    ctx.lineTo(x - size * 0.10, y - size * 0.36);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.20, y + size * 0.02);
    ctx.lineTo(x + size * 0.52, y - size * 0.12);
    ctx.stroke();
  }
  if (enemy.poisonOnHit) {
    ctx.globalAlpha = 0.45 + 0.20 * Math.sin(t);
    ctx.fillStyle = '#78d64b';
    ctx.beginPath();
    ctx.arc(x + size * 0.34, y - size * 0.16, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (frame % 14 === 0) emitParticle(emitParticleFn, x + randomRange(-size * 0.25, size * 0.25), y + size * 0.24, '#78d64b', 1, 2);
  }
  if (enemy.slowOnHit || enemy.projType === 'frost') {
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#c8f6ff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const a = t + i * Math.PI * 2 / 3;
      const px = x + Math.cos(a) * size * 0.48;
      const py = y - size * 0.48 + Math.sin(a) * size * 0.12;
      ctx.beginPath();
      ctx.moveTo(px - 3, py);
      ctx.lineTo(px + 3, py);
      ctx.moveTo(px, py - 3);
      ctx.lineTo(px, py + 3);
      ctx.stroke();
    }
  }
  if (enemy.stealth && enemy.stealthHits === 0) {
    ctx.globalAlpha = 0.30 + 0.12 * Math.sin(t * 1.7);
    ctx.strokeStyle = '#d8b4fe';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.08, size * 0.82, size * 0.94, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.ellipse(x + size * 0.10 * Math.sin(t), y, size * 0.74, size * 0.90, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (enemy.splashOnHit || enemy.meteorCD) {
    const a = t * 1.8;
    ctx.globalAlpha = 0.70;
    ctx.fillStyle = '#ffb020';
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * size * 0.42, y - size * 0.44 + Math.sin(a) * size * 0.12, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (frame % 18 === 0) emitParticle(emitParticleFn, x + Math.cos(a) * size * 0.42, y - size * 0.44, '#ff8c22', 1, 2.5);
  }
  if (enemy.flying && frame % 8 === 0) emitParticle(emitParticleFn, x - randomRange(-size * 0.6, size * 0.6), y + size * 0.18, col, 1, 1.8);
  if (enemy.isElite) {
    ctx.globalAlpha = 0.55 + 0.20 * Math.sin(t);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.20, size + 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  let drewWaveShield = false;
  if (enemy.waveMechanic) {
    const mc = { shield: '#44aaff', banner: '#ffcc44', medic: '#44ff88', ritual: '#aa66ff', exploding: '#ff8844', sniper: '#ff4444' }[enemy.waveMechanic] || '#ffd700';
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = mc;
    ctx.beginPath();
    ctx.arc(x + size * 0.52, y - size * 0.72, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + size * 0.52, y - size * 0.72, 5.4, 0, Math.PI * 2);
    ctx.stroke();
    if (enemy._enemyShield > 0) {
      drawActorShieldVfx(ctx, { unit: enemy, x, y: y - size * 0.05, size, frame });
      drewWaveShield = true;
    }
  }
  if ((!drewWaveShield && (enemy._shieldHitFx || enemy._shieldBreakFx)) || (!enemy.waveMechanic && (enemy._enemyShield > 0 || enemy.hiveShield))) {
    drawActorShieldVfx(ctx, { unit: enemy, x, y: y - size * 0.05, size, frame });
  }
  ctx.restore();
}

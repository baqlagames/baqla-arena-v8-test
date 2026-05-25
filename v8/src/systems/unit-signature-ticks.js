import { dist } from '../core/math.js';
import { PLAYER_UNITS } from '../data/units.js';
import { isValidPlayerOffensiveTarget } from './player-target-validity.js';

export function tickUnitMeteorAndSignature(unit, {
  frame,
  enemies,
  bombs,
  arenaTop,
  randomRange,
  groundEffects,
  emitParticle,
  addDamageText,
}) {
  tickUnitMeteor(unit, {
    frame,
    enemies,
    bombs,
    arenaTop,
    emitParticle,
    addDamageText,
  });
  const banner = tickUnitSignature(unit, {
    frame,
    enemies,
    randomRange,
    groundEffects,
    emitParticle,
  });
  if (unit.signatureCastFx > 0) unit.signatureCastFx--;
  return banner;
}

function tickUnitMeteor(unit, {
  frame,
  enemies,
  bombs,
  arenaTop,
  emitParticle,
  addDamageText,
}) {
  if (!unit.meteor) return;

  unit.meteor.t++;
  if (unit.meteor.t < unit.meteor.cd) return;

  let target = null;
  for (const enemy of enemies) {
    if (!isValidPlayerOffensiveTarget(enemy)) continue;
    if (enemy.isBoss || enemy.isElite) {
      target = enemy;
      break;
    }
    if (!target) target = enemy;
  }
  if (!target) return;

  unit.meteor.t = 0;
  const color = unit.meteor.color || '#aa66ff';
  bombs.push({
    x: target.x,
    y: arenaTop - 80,
    fromX: target.x,
    fromY: arenaTop - 80,
    tx: target.x,
    ty: target.y,
    t: 0,
    dur: unit.meteor.fallDur || 120,
    dmg: unit.meteor.dmg,
    radius: unit.meteor.radius,
    attacker: unit,
    isPlayer: true,
    color,
    meteor: true,
    playerMeteor: true,
  });
  addDamageText(unit.x, unit.y - unit.size, 'METEOR!', color);
  emitParticle(unit.x, unit.y, color, 16, 4);
  for (let i = 0; i < 8; i++) {
    const angle = Math.PI * 2 * i / 8 + frame * 0.1;
    emitParticle(unit.x + Math.cos(angle) * unit.size, unit.y + Math.sin(angle) * unit.size, '#cc99ff', 1, 3);
  }
}

function tickUnitSignature(unit, {
  frame,
  enemies,
  randomRange,
  groundEffects,
  emitParticle,
}) {
  if (!unit.signature) return null;

  unit.signature.t++;
  const pct = unit.signature.t / unit.signature.cd;
  if (pct >= 0.75) {
    const intense = Math.max(0, (pct - 0.75) / 0.25);
    if (frame % Math.max(2, Math.round(8 - 6 * intense)) === 0) {
      const angle = frame * 0.08;
      const radius = unit.size + 4;
      emitParticle(unit.x + Math.cos(angle) * radius, unit.y + Math.sin(angle) * radius, '#ffd700', 1, 2);
    }
    if (pct >= 0.90 && frame % 4 === 0) {
      emitParticle(unit.x + randomRange(-unit.size * 0.7, unit.size * 0.7), unit.y - unit.size * 0.3, '#ffe066', 1, 2);
    }
  }

  if (unit.signature.t < unit.signature.cd) return null;

  const sigRange = unit.signature.id === 'storm_anchor' ? 340 : (unit.signature.id === 'midare_stardiver' ? 340 : ((unit.signature.id === 'divine_ruination' || unit.signature.id === 'heavenly_arsenal') ? 360 : (unit.arch === 'healer' ? 360 : Math.min(320, (unit.range || 60) + 160))));
  const hasEnemy = enemies.some(enemy => isValidPlayerOffensiveTarget(enemy) && dist(unit, enemy) < sigRange);
  if (!hasEnemy) return null;

  let fired = true;
  try {
    const result = unit.signature.fire(unit);
    if (result === false) fired = false;
  } catch (_) {}
  if (!fired) return null;

  unit.signature.t = 0;
  for (let i = 0; i < 14; i++) {
    const angle = Math.PI * 2 * i / 14;
    emitParticle(unit.x + Math.cos(angle) * unit.size * 1.2, unit.y + Math.sin(angle) * unit.size * 1.2, '#ffd700', 1, 3);
  }
  emitParticle(unit.x, unit.y, '#ffffff', 12, 3);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.size + 24, life: 0.35, color: '#ffd700' });
  unit.signatureCastFx = 18;

  const signatureName = unit.signature.name || 'SIGNATURE';
  const unitName = (PLAYER_UNITS[unit.unitIdx] && PLAYER_UNITS[unit.unitIdx].name) || '';
  const color = unit.color || '#ffd700';
  return {
    text: signatureName.toUpperCase(),
    unit: unitName.toUpperCase(),
    color,
    life: 90,
    maxLife: 90,
  };
}

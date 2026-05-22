import { drawActorShieldVfx } from './shield-vfx.js?v=20260522-winterglass-stall-breaker';

function fallbackRandomRange(min, max) {
  return min + Math.random() * (max - min);
}

function emitParticle(emitParticleFn, x, y, color, count, size) {
  if (emitParticleFn) emitParticleFn(x, y, color, count, size);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export const ENEMY_WAVE_MECHANIC_VFX = Object.freeze({
  shield: { color: '#44aaff', label: 'SHIELD', kind: 'shield' },
  banner: { color: '#ffcc44', label: 'BANNER', kind: 'banner' },
  medic: { color: '#44ff88', label: 'MEDIC', kind: 'medic' },
  ritual: { color: '#aa66ff', label: 'RITUAL', kind: 'ritual' },
  exploding: { color: '#ff8844', label: 'BURST', kind: 'burst' },
  sniper: { color: '#ff4444', label: 'SNIPER', kind: 'sniper' },
});

function enemyMechanicInfo(enemy) {
  if (!enemy || !enemy.waveMechanic) return null;
  return ENEMY_WAVE_MECHANIC_VFX[enemy.waveMechanic] || { color: '#ffd700', label: 'SPECIAL', kind: 'special' };
}

export function enemyReadabilityCues(enemy) {
  if (!enemy) return [];
  const cues = [];
  const mechanic = enemyMechanicInfo(enemy);
  if (mechanic) cues.push({ type: 'mechanic', key: enemy.waveMechanic, color: mechanic.color, label: mechanic.label });
  if (enemy.isBoss) cues.push({ type: 'rank', key: 'boss', color: enemy.color || '#ff8844', label: 'BOSS' });
  else if (enemy.isElite || enemy.champion) cues.push({ type: 'rank', key: 'elite', color: '#ffd700', label: 'ELITE' });
  if (enemy.armorType === 'heavy' || enemy.taunt) cues.push({ type: 'trait', key: 'heavy', color: '#d8a938', label: 'HEAVY' });
  if (enemy.armorType === 'warded' || enemy.arch === 'caster' || enemy.projType === 'curse') cues.push({ type: 'trait', key: 'warded', color: enemyVfxColor(enemy), label: 'WARD' });
  if (enemy.flying) cues.push({ type: 'trait', key: 'flying', color: enemyVfxColor(enemy), label: 'AIR' });
  if (enemy.burrow || enemy.burrowing) cues.push({ type: 'trait', key: 'burrow', color: '#c8a05a', label: 'BURROW' });
  if (enemy.prefersBackline || enemy.stealth) cues.push({ type: 'trait', key: 'backline', color: '#ff5a66', label: 'BACKLINE' });
  if (enemy.fromRift) cues.push({ type: 'trait', key: 'rift', color: '#c08aff', label: 'RIFT' });
  return cues;
}

export function playerSignatureVfxState(unit) {
  if (!unit || !unit.signature || !Number.isFinite(unit.signature.cd) || unit.signature.cd <= 0) {
    return {
      active: false,
      pct: 0,
      ready: false,
      casting: false,
      capstone: false,
      phase: 'inactive',
      color: playerVfxColor(unit || {}),
      intensity: 0,
    };
  }
  const pct = clamp01((unit.signature.t || 0) / unit.signature.cd);
  const casting = (unit.signatureCastFx || 0) > 0;
  const ready = pct >= 1;
  const capstone = (unit.cellLevel || unit.level || 1) >= 5;
  const phase = casting ? 'casting' : ready ? 'ready' : pct >= 0.70 ? 'charging' : 'inactive';
  return {
    active: casting || pct >= 0.70,
    pct,
    ready,
    casting,
    capstone,
    phase,
    color: playerVfxColor(unit),
    intensity: casting ? 1 : ready ? 0.92 : 0.45 + pct * 0.35,
    label: unit.signature.name || 'SIGNATURE',
  };
}

export function playerSignatureReadiness(unit) {
  const state = playerSignatureVfxState(unit);
  return {
    active: state.active,
    pct: state.pct,
    ready: state.ready,
    casting: state.casting,
    color: state.color,
    capstone: state.capstone,
    phase: state.phase,
  };
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

function drawPlayerSignatureCue(ctx, { unit, x, y, size, frame }) {
  const sig = playerSignatureVfxState(unit);
  if (!sig.active) return;
  const t = frame * 0.09 + (unit.unitIdx || 0) * 0.5;
  const radius = size + 10 + (sig.capstone ? 2 : 0);
  const castP = Math.max(0, Math.min(1, (unit.signatureCastFx || 0) / 18));
  const col = sig.ready ? '#fff0a8' : sig.color;
  ctx.save();
  ctx.globalAlpha = sig.casting ? 0.16 + castP * 0.28 : sig.ready ? 0.18 + 0.08 * Math.sin(t * 2.2) : 0.10 + sig.pct * 0.10;
  ctx.fillStyle = sig.ready ? '#ffd700' : sig.color;
  ctx.beginPath();
  ctx.arc(x, y - size * 0.08, radius + (sig.casting ? (1 - castP) * 8 : 0), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = sig.casting ? 0.36 + castP * 0.44 : 0.26 + sig.pct * 0.22;
  ctx.strokeStyle = col;
  ctx.lineWidth = sig.ready ? 2.4 : 1.6;
  ctx.beginPath();
  ctx.arc(x, y - size * 0.08, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sig.pct);
  ctx.stroke();
  if (sig.capstone) {
    ctx.globalAlpha = sig.ready || sig.casting ? 0.60 : 0.32;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 5]);
    ctx.lineDashOffset = -frame * 0.75;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.08, radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 5; i++) {
      const a = t * 0.75 + i * Math.PI * 2 / 5;
      ctx.globalAlpha = 0.40 + 0.18 * Math.sin(t + i);
      ctx.fillStyle = i % 2 ? sig.color : '#ffd700';
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * (radius + 6), y - size * 0.08 + Math.sin(a) * (radius + 2), 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (sig.ready) {
    ctx.globalAlpha = 0.30 + 0.18 * Math.sin(t * 2.0);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -frame * 0.55;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.08, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (sig.casting) {
    ctx.globalAlpha = 0.48 * castP;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.08, radius + (1 - castP) * 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.72 * castP;
    ctx.strokeStyle = sig.color;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = t + i * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * (radius - 5), y - size * 0.08 + Math.sin(a) * (radius - 5));
      ctx.lineTo(x + Math.cos(a) * (radius + 9), y - size * 0.08 + Math.sin(a) * (radius + 9));
      ctx.stroke();
    }
  }
  const sx = x + Math.cos(t) * radius * 0.68;
  const sy = y - size * 0.08 + Math.sin(t) * radius * 0.42;
  ctx.globalAlpha = sig.ready ? 0.72 : 0.42;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(sx, sy, sig.ready ? 2.8 : 2.0, 0, Math.PI * 2);
  ctx.fill();
  if (sig.ready || sig.casting) {
    const label = sig.casting ? 'CAST' : 'SIG';
    const chipY = y - size - 17;
    const chipW = sig.casting ? 28 : 23;
    ctx.globalAlpha = sig.casting ? 0.90 : 0.78 + 0.12 * Math.sin(t * 2.2);
    ctx.fillStyle = 'rgba(16,12,4,0.82)';
    ctx.beginPath();
    ctx.roundRect(x - chipW / 2, chipY - 8, chipW, 13, 5);
    ctx.fill();
    ctx.strokeStyle = sig.casting ? sig.color : '#ffd700';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - chipW / 2 + 0.5, chipY - 7.5, chipW - 1, 12, 5);
    ctx.stroke();
    ctx.fillStyle = '#fff6c2';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, chipY + 2);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

export function playerHitSourceVfxState(unit) {
  if (!unit || !unit._lastHitSourceLabel || !(unit._lastHitSourceTimer > 0)) {
    return { active: false, pct: 0, label: '', color: '#ff4444', danger: false };
  }
  const maxTimer = unit.isKing ? 70 : 46;
  const pct = clamp01(unit._lastHitSourceTimer / maxTimer);
  const label = String(unit._lastHitSourceLabel || '').toUpperCase().slice(0, 14);
  return {
    active: true,
    pct,
    label,
    color: unit._lastHitSourceColor || '#ff4444',
    danger: !!(unit.isKing || label === 'METEOR' || label === 'BREACH' || label.includes('SLAM') || label.includes('DIVE') || (unit._lastHitSourceDmgRatio || 0) >= 0.14),
  };
}

export function playerNoHealVfxState(unit) {
  const timer = Math.max(unit && unit._stormSilenceTimer || 0, unit && unit.silenceTimer || 0);
  if (!unit || unit.arch !== 'healer' || timer <= 0) {
    return { active: false, pct: 0, label: '', color: '#9bb8ff' };
  }
  return {
    active: true,
    pct: clamp01(timer / 150),
    label: 'NO HEAL',
    color: '#9bb8ff',
  };
}

function drawPlayerHitSourceBadge(ctx, { unit, x, y, size, frame }) {
  const state = playerHitSourceVfxState(unit);
  if (!state.active) return;
  const t = frame * 0.13 + (unit.unitIdx || 0) * 0.4;
  const p = state.pct;
  const col = state.color;
  const dangerBoost = state.danger ? 1 : 0;
  ctx.save();
  if (state.danger) {
    ctx.globalAlpha = 0.12 + 0.14 * p;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.10, size + 8 + dangerBoost * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.28 * p + dangerBoost * 0.08;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.10, size + 10 + Math.sin(t * 2.0) * 1.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.50 * p;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 4; i++) {
      const a = t + i * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * (size + 6), y - size * 0.10 + Math.sin(a) * (size + 6));
      ctx.lineTo(x + Math.cos(a) * (size + 14), y - size * 0.10 + Math.sin(a) * (size + 14));
      ctx.stroke();
    }
  }
  const label = state.label || 'HIT';
  const chipW = Math.min(86, Math.max(34, label.length * 6 + 12));
  const chipY = y - size - (unit.isKing ? 31 : 27);
  ctx.globalAlpha = 0.82 * p;
  ctx.fillStyle = 'rgba(18,6,6,0.84)';
  ctx.beginPath();
  ctx.roundRect(x - chipW / 2, chipY - 8, chipW, 14, 5);
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - chipW / 2 + 0.5, chipY - 7.5, chipW - 1, 13, 5);
  ctx.stroke();
  ctx.fillStyle = '#fff5f0';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, chipY + 2.5);
  ctx.textAlign = 'left';
  ctx.restore();
  unit._lastHitSourceTimer = Math.max(0, (unit._lastHitSourceTimer || 0) - 1);
}

function drawPlayerNoHealBadge(ctx, { unit, x, y, size, frame }) {
  const state = playerNoHealVfxState(unit);
  if (!state.active) return;
  const t = frame * 0.14 + (unit.unitIdx || 0) * 0.4;
  ctx.save();
  ctx.globalAlpha = 0.22 + 0.10 * Math.sin(t * 2.0);
  ctx.fillStyle = state.color;
  ctx.beginPath();
  ctx.arc(x, y - size * 0.10, size + 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.70;
  ctx.strokeStyle = '#e8f3ff';
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.52, y - size * 0.72);
  ctx.lineTo(x + size * 0.52, y + size * 0.28);
  ctx.moveTo(x + size * 0.52, y - size * 0.72);
  ctx.lineTo(x - size * 0.52, y + size * 0.28);
  ctx.stroke();
  const label = state.label;
  const chipW = 52;
  const chipY = y - size - 38;
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(8,17,40,0.90)';
  ctx.beginPath();
  ctx.roundRect(x - chipW / 2, chipY - 8, chipW, 15, 5);
  ctx.fill();
  ctx.strokeStyle = state.color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x - chipW / 2 + 0.5, chipY - 7.5, chipW - 1, 14, 5);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, chipY + 3);
  ctx.textAlign = 'left';
  ctx.restore();
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
  if (!isMinor && haste.active) {
    ctx.globalAlpha = 0.12 + 0.08 * Math.sin(t * 2.2);
    ctx.strokeStyle = haste.color;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([7, 5]);
    ctx.lineDashOffset = -frame * (0.7 + haste.intensity * 0.35);
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.74, size * 1.12, size * 0.26, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.055 + 0.03 * haste.intensity;
    ctx.fillStyle = haste.color;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.72, size * 1.06, size * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
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
    const warnBoost = unit._lowHealthWarnFx > 0 ? 0.12 : 0;
    ctx.globalAlpha = 0.18 + warnBoost + 0.12 * Math.sin(t * 3.2);
    ctx.fillStyle = '#ff2233';
    ctx.beginPath();
    ctx.arc(x, y, size + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.52 + warnBoost;
    ctx.strokeStyle = '#ff6677';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, size + 8 + Math.sin(t * 2.2) * 2, 0, Math.PI * 2);
    ctx.stroke();
    if (unit._lowHealthWarnFx > 0) unit._lowHealthWarnFx--;
  }
  if (unit._burstHitFx > 0) {
    const p = unit._burstHitFx / 22;
    ctx.globalAlpha = 0.42 * p;
    ctx.strokeStyle = '#ff3344';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(x, y, size + 10 + (1 - p) * 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.14 * p;
    ctx.fillStyle = '#ff3344';
    ctx.beginPath();
    ctx.arc(x, y, size + 5, 0, Math.PI * 2);
    ctx.fill();
    unit._burstHitFx--;
  }
  if (unit._tankBlockFx > 0) {
    const p = unit._tankBlockFx / 18;
    ctx.globalAlpha = 0.52 * p;
    ctx.strokeStyle = unit.arch === 'tank' || unit.taunt ? '#fff2bd' : '#a7d8ff';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.72, y - size * 0.22);
    ctx.lineTo(x - size * 0.18, y - size * 0.52);
    ctx.lineTo(x + size * 0.58, y - size * 0.18);
    ctx.stroke();
    unit._tankBlockFx--;
  }
  if (unit._targetedMarker > 0) {
    const p = unit._targetedMarker / 28;
    ctx.globalAlpha = 0.46 * p;
    ctx.strokeStyle = '#ff4455';
    ctx.lineWidth = 1.4;
    const r = size + 9;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.18, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r - 4, y - size * 0.18);
    ctx.lineTo(x - r + 4, y - size * 0.18);
    ctx.moveTo(x + r - 4, y - size * 0.18);
    ctx.lineTo(x + r + 4, y - size * 0.18);
    ctx.stroke();
    unit._targetedMarker--;
  }
  drawPlayerNoHealBadge(ctx, { unit, x, y, size, frame });
  drawPlayerHitSourceBadge(ctx, { unit, x, y, size, frame });
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
    if (frame % 16 === 0) emitParticle(emitParticleFn, x + randomRange(-size * 0.55, size * 0.55), y - randomRange(0, size * 0.75), haste.color, 1, 2);
  }
  // Signature readiness is shown in the HP status-icon row; keep the battlefield
  // body free of persistent readiness rings so clustered units stay readable.
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

export function enemyRoleInfo(enemy) {
  if (enemy.isBoss) return { key: 'boss', color: enemy.color || '#ff8844', label: 'B' };
  if (enemy.isLieutenant) return { key: 'lieutenant', color: '#ffaa44', label: 'L' };
  if (enemy.bossSupport) return { key: 'support', color: enemy.bossSupportColor || enemy.color || '#ffaa44', label: '+' };
  if (enemy.waveMechanic === 'shield' || enemy.armorType === 'heavy' || enemy.taunt || enemy.arch === 'tank') return { key: 'tank', color: '#d8a938', label: 'T' };
  if (enemy.waveMechanic === 'medic' || enemy.waveMechanic === 'banner' || enemy.waveMechanic === 'ritual' || enemy.arch === 'support') return { key: 'support', color: enemyVfxColor(enemy), label: '+' };
  if (enemy.arch === 'caster' || enemy.armorType === 'warded' || enemy.chainBoltCD || enemy.meteorCD) return { key: 'caster', color: enemyVfxColor(enemy), label: '*' };
  if (enemy.arch === 'assassin' || enemy.prefersBackline || enemy.stealth || enemy.burrow) return { key: 'assassin', color: '#ff5a66', label: '!' };
  if (enemy.flying) return { key: 'flying', color: enemyVfxColor(enemy), label: '^' };
  if (enemy.arch === 'ranged' || enemy.range > 80 || enemy.projType) return { key: 'ranged', color: enemyVfxColor(enemy), label: 'R' };
  if (enemy.arch === 'aoe' || enemy.splashOnHit) return { key: 'aoe', color: '#ff8c22', label: 'A' };
  return { key: 'melee', color: enemyVfxColor(enemy), label: '' };
}

export function enemyIntentVfxState(enemy) {
  if (!enemy) return { active: false, key: 'none', color: '#ff8844', readyPct: 0, imminent: false, major: false };
  const role = enemyRoleInfo(enemy);
  const hasCd = Number.isFinite(enemy.cd) && Number.isFinite(enemy.atkSpd) && enemy.atkSpd > 0;
  const readyPct = hasCd ? clamp01(1 - Math.max(0, enemy.cd) / Math.max(1, enemy.atkSpd)) : (enemy.cd <= 10 ? 0.85 : 0.35);
  const major = !!(
    enemy.isBoss ||
    enemy.isElite ||
    enemy.champion ||
    enemy.isLieutenant ||
    enemy.bossSupport ||
    enemy.waveMechanic ||
    enemy.chainBoltCD ||
    enemy.meteorCD ||
    enemy.splashOnHit ||
    enemy.prefersBackline ||
    enemy.stealth ||
    enemy.poisonOnHit ||
    enemy.burrow ||
    enemy.flying
  );
  return {
    active: major || readyPct >= 0.70,
    key: role.key,
    color: role.color || enemyVfxColor(enemy),
    readyPct,
    imminent: readyPct >= 0.88 || enemy.cd <= 8,
    major,
  };
}

function drawEnemyRoleBadge(ctx, { x, y, size, frame, info, elite }) {
  if (!info || !info.label) return;
  const pulse = 0.72 + 0.18 * Math.sin(frame * 0.10);
  const bx = x - size * 0.54;
  const by = y - size * 0.86;
  ctx.save();
  ctx.globalAlpha = elite ? 0.90 : 0.72;
  ctx.fillStyle = 'rgba(10,10,14,0.70)';
  ctx.beginPath();
  ctx.arc(bx, by, elite ? 6.5 : 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = info.color;
  ctx.lineWidth = elite ? 1.6 : 1.1;
  ctx.globalAlpha *= pulse;
  ctx.beginPath();
  ctx.arc(bx, by, elite ? 7.5 : 6.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(info.label, bx, by + 2.8);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawChampionCrown(ctx, { x, y, size, frame, color = '#ffd700' }) {
  const pulse = 0.70 + 0.18 * Math.sin(frame * 0.12);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = color;
  const cy = y - size * 1.08;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.36, cy + size * 0.13);
  ctx.lineTo(x - size * 0.25, cy - size * 0.05);
  ctx.lineTo(x - size * 0.08, cy + size * 0.09);
  ctx.lineTo(x, cy - size * 0.10);
  ctx.lineTo(x + size * 0.08, cy + size * 0.09);
  ctx.lineTo(x + size * 0.25, cy - size * 0.05);
  ctx.lineTo(x + size * 0.36, cy + size * 0.13);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff6b0';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawMechanicSymbol(ctx, { kind, cx, cy, r, color, frame }) {
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = color;
  ctx.lineWidth = 1.3;
  if (kind === 'shield') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.78);
    ctx.lineTo(cx + r * 0.55, cy - r * 0.38);
    ctx.lineTo(cx + r * 0.42, cy + r * 0.42);
    ctx.lineTo(cx, cy + r * 0.78);
    ctx.lineTo(cx - r * 0.42, cy + r * 0.42);
    ctx.lineTo(cx - r * 0.55, cy - r * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'banner') {
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.35, cy + r * 0.72);
    ctx.lineTo(cx - r * 0.35, cy - r * 0.76);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.30, cy - r * 0.72);
    ctx.lineTo(cx + r * 0.55, cy - r * 0.50);
    ctx.lineTo(cx - r * 0.30, cy - r * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'medic') {
    ctx.fillStyle = color;
    ctx.fillRect(cx - r * 0.18, cy - r * 0.66, r * 0.36, r * 1.32);
    ctx.fillRect(cx - r * 0.66, cy - r * 0.18, r * 1.32, r * 0.36);
    ctx.strokeRect(cx - r * 0.18, cy - r * 0.66, r * 0.36, r * 1.32);
    ctx.strokeRect(cx - r * 0.66, cy - r * 0.18, r * 1.32, r * 0.36);
  } else if (kind === 'ritual') {
    const rot = frame * 0.025;
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.76);
    ctx.lineTo(r * 0.70, r * 0.48);
    ctx.lineTo(-r * 0.70, r * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'sniper') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.95, cy);
    ctx.lineTo(cx - r * 0.30, cy);
    ctx.moveTo(cx + r * 0.30, cy);
    ctx.lineTo(cx + r * 0.95, cy);
    ctx.moveTo(cx, cy - r * 0.95);
    ctx.lineTo(cx, cy - r * 0.30);
    ctx.moveTo(cx, cy + r * 0.30);
    ctx.lineTo(cx, cy + r * 0.95);
    ctx.stroke();
  } else if (kind === 'burst') {
    ctx.fillStyle = color;
    for (let i = 0; i < 8; i++) {
      const a = frame * 0.02 + i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - 0.12) * r * 0.42, cy + Math.sin(a - 0.12) * r * 0.42);
      ctx.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92);
      ctx.lineTo(cx + Math.cos(a + 0.12) * r * 0.42, cy + Math.sin(a + 0.12) * r * 0.42);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.30, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemyMechanicIcon(ctx, { enemy, x, y, size, frame }) {
  const info = enemyMechanicInfo(enemy);
  if (!info) return;
  const pulse = 0.78 + 0.16 * Math.sin(frame * 0.12);
  const cx = x + size * 0.55;
  const cy = y - size * 0.76;
  const r = 5.3;
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = 'rgba(10,10,14,0.76)';
  ctx.beginPath();
  ctx.roundRect(cx - r - 2, cy - r - 2, r * 2 + 4, r * 2 + 4, 3);
  ctx.fill();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = info.color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(cx - r - 2.5, cy - r - 2.5, r * 2 + 5, r * 2 + 5, 3.5);
  ctx.stroke();
  ctx.restore();
  drawMechanicSymbol(ctx, { kind: info.kind, cx, cy, r: 4.5, color: info.color, frame });
}

function drawEnemyTraitPips(ctx, { enemy, x, y, size, frame }) {
  const cues = enemyReadabilityCues(enemy)
    .filter(cue => cue.type === 'trait')
    .filter(cue => cue.key !== 'backline' || enemy.stealth || enemy.prefersBackline)
    .slice(0, 3);
  if (!cues.length) return;
  const startX = x + size * 0.62;
  const startY = y - size * 0.36;
  ctx.save();
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const px = startX;
    const py = startY + i * 7;
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = 'rgba(6,6,10,0.72)';
    ctx.beginPath();
    ctx.arc(px, py, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.75 + 0.12 * Math.sin(frame * 0.10 + i);
    ctx.strokeStyle = cue.color;
    ctx.fillStyle = cue.color;
    ctx.lineWidth = 1;
    if (cue.key === 'heavy') {
      ctx.fillRect(px - 2, py - 2, 4, 4);
      ctx.strokeRect(px - 2.5, py - 2.5, 5, 5);
    } else if (cue.key === 'warded') {
      ctx.beginPath();
      ctx.moveTo(px, py - 3);
      ctx.lineTo(px + 3, py);
      ctx.lineTo(px, py + 3);
      ctx.lineTo(px - 3, py);
      ctx.closePath();
      ctx.stroke();
    } else if (cue.key === 'flying') {
      ctx.beginPath();
      ctx.moveTo(px - 3.2, py + 1.5);
      ctx.lineTo(px, py - 2.5);
      ctx.lineTo(px + 3.2, py + 1.5);
      ctx.stroke();
    } else if (cue.key === 'burrow') {
      ctx.beginPath();
      ctx.ellipse(px, py + 1, 3.4, 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (cue.key === 'rift') {
      ctx.beginPath();
      ctx.arc(px, py, 2.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(px - 2.5, py + 2.5);
      ctx.lineTo(px + 2.5, py - 2.5);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawEnemyMechanicGroundCue(ctx, { enemy, x, y, size, frame, t }) {
  const info = enemyMechanicInfo(enemy);
  if (!info) return;
  const c = info.color;
  ctx.save();
  ctx.globalAlpha = 0.15 + 0.06 * Math.sin(t * 1.5);
  ctx.strokeStyle = c;
  ctx.fillStyle = c;
  ctx.lineWidth = 2;
  if (info.kind === 'shield') {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      const px = x + Math.cos(a) * size * 1.12;
      const py = y + size * 0.77 + Math.sin(a) * size * 0.27;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  } else if (info.kind === 'banner') {
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -frame * 0.45;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.78, size * 1.45, size * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + frame * 0.018;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * size * 0.55, y + size * 0.78 + Math.sin(a) * size * 0.15);
      ctx.lineTo(x + Math.cos(a) * size * 1.18, y + size * 0.78 + Math.sin(a) * size * 0.31);
      ctx.stroke();
    }
  } else if (info.kind === 'medic') {
    ctx.globalAlpha = 0.14 + 0.06 * Math.sin(t * 1.8);
    ctx.fillRect(x - size * 0.12, y + size * 0.55, size * 0.24, size * 0.48);
    ctx.fillRect(x - size * 0.40, y + size * 0.67, size * 0.80, size * 0.18);
  } else if (info.kind === 'ritual') {
    ctx.translate(x, y + size * 0.76);
    ctx.rotate(frame * 0.018);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.36);
    ctx.lineTo(size * 0.72, size * 0.22);
    ctx.lineTo(-size * 0.72, size * 0.22);
    ctx.closePath();
    ctx.stroke();
  } else if (info.kind === 'sniper') {
    ctx.globalAlpha = 0.16 + 0.08 * Math.sin(t * 2.0);
    ctx.beginPath();
    ctx.moveTo(x - size * 1.24, y + size * 0.67);
    ctx.lineTo(x + size * 1.24, y + size * 0.67);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.67, size * 0.76, size * 0.19, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (info.kind === 'burst') {
    ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 2.2);
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -frame * 0.75;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.75, size * 1.22, size * 0.31, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
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

function drawEnemyIntentHalo(ctx, { enemy, x, y, size, frame, t }) {
  const state = enemyIntentVfxState(enemy);
  if (!state.active) return;
  const col = state.color;
  const baseY = y + size * 0.74;
  const alpha = state.major ? 0.16 : 0.10;
  ctx.save();
  ctx.globalAlpha = alpha + state.readyPct * 0.08;
  ctx.strokeStyle = col;
  ctx.lineWidth = state.imminent ? 2 : 1.3;
  ctx.setLineDash(state.imminent ? [3, 3] : [8, 6]);
  ctx.lineDashOffset = -frame * (state.imminent ? 0.85 : 0.35);
  ctx.beginPath();
  ctx.ellipse(x, baseY, size * (state.major ? 1.36 : 1.08), size * (state.major ? 0.34 : 0.25), 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  if (state.readyPct > 0.35) {
    ctx.globalAlpha = (state.imminent ? 0.44 : 0.28) * state.readyPct;
    ctx.strokeStyle = state.imminent ? '#ffffff' : col;
    ctx.lineWidth = state.imminent ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.ellipse(x, baseY, size * 0.78, size * 0.19, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.readyPct);
    ctx.stroke();
  }
  if (state.key === 'caster' || state.key === 'boss') {
    for (let i = 0; i < 3; i++) {
      const a = t * 1.4 + i * Math.PI * 2 / 3;
      ctx.globalAlpha = 0.22 + 0.10 * state.readyPct;
      ctx.fillStyle = i === 0 && state.imminent ? '#fff' : col;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * size * 0.82, baseY + Math.sin(a) * size * 0.20, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (state.key === 'support') {
    ctx.globalAlpha = 0.22 + 0.12 * Math.sin(t * 1.8);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.18, baseY);
    ctx.lineTo(x + size * 0.18, baseY);
    ctx.moveTo(x, baseY - size * 0.11);
    ctx.lineTo(x, baseY + size * 0.11);
    ctx.stroke();
  } else if (state.key === 'assassin') {
    ctx.globalAlpha = 0.24 + 0.12 * state.readyPct;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * size * 0.22;
      ctx.beginPath();
      ctx.moveTo(x + ox - size * 0.13, baseY - size * 0.08);
      ctx.lineTo(x + ox, baseY + size * 0.06);
      ctx.lineTo(x + ox + size * 0.13, baseY - size * 0.08);
      ctx.stroke();
    }
  } else if (state.key === 'aoe') {
    ctx.globalAlpha = 0.18 + 0.12 * state.readyPct;
    ctx.strokeStyle = '#ff8c22';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, baseY, size * 1.52, size * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (state.key === 'ranged' || state.key === 'flying') {
    ctx.globalAlpha = 0.20 + 0.16 * state.readyPct;
    ctx.strokeStyle = state.imminent ? '#ffffff' : col;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.90, baseY);
    ctx.lineTo(x + size * 0.90, baseY);
    ctx.stroke();
  } else if (state.key === 'tank') {
    ctx.globalAlpha = 0.20;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, baseY - size * 0.18);
    ctx.lineTo(x + size * 0.34, baseY - size * 0.04);
    ctx.lineTo(x + size * 0.24, baseY + size * 0.18);
    ctx.lineTo(x, baseY + size * 0.26);
    ctx.lineTo(x - size * 0.24, baseY + size * 0.18);
    ctx.lineTo(x - size * 0.34, baseY - size * 0.04);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawEnemyVfxUnder(ctx, { enemy, x, y, size, frame }) {
  const col = enemyVfxColor(enemy);
  const role = enemyRoleInfo(enemy);
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
  drawEnemyIntentHalo(ctx, { enemy, x, y, size, frame, t });
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
  if (enemy.fromRift) {
    ctx.globalAlpha = 0.20 + 0.08 * Math.sin(t * 1.6);
    ctx.strokeStyle = '#c08aff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.lineDashOffset = frame * 0.55;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.78, size * 1.32, size * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#8a40ff';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.75, size * 1.08, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (enemy.bossSupport || enemy.isLieutenant) {
    const supportCol = role.color || col;
    ctx.globalAlpha = enemy.isLieutenant ? 0.30 : 0.20;
    ctx.strokeStyle = supportCol;
    ctx.lineWidth = enemy.isLieutenant ? 2.4 : 1.8;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.78, size * 1.48, size * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = supportCol;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.73, size * 1.18, size * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 1.02, size * 1.18, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
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
  if (enemy.burrow || enemy.burrowing) {
    const dust = '#c8a05a';
    ctx.globalAlpha = enemy.burrowing ? 0.34 : 0.16;
    ctx.fillStyle = 'rgba(160,112,70,0.36)';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.90, size * 1.16, size * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.26 + 0.08 * Math.sin(t * 1.8);
    ctx.strokeStyle = dust;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -frame * 0.45;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.88, size * 1.28, size * 0.30, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = -1; i <= 1; i++) {
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = dust;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x + i * size * 0.22 - size * 0.18, y + size * 0.78);
      ctx.lineTo(x + i * size * 0.22 + size * 0.18, y + size * 0.88);
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
  if (role.key === 'ranged') {
    ctx.globalAlpha = 0.16 + 0.05 * Math.sin(t * 1.4);
    ctx.strokeStyle = role.color;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.88, y + size * 0.68);
    ctx.lineTo(x + size * 0.88, y + size * 0.68);
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
    drawEnemyMechanicGroundCue(ctx, { enemy, x, y, size, frame, t });
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
  const role = enemyRoleInfo(enemy);
  const t = frame * 0.075 + (enemy.id || 0) * 0.8 + (enemy.bobPhase || 0);
  ctx.save();
  drawEnemyRoleBadge(ctx, { x, y, size, frame, info: role, elite: enemy.isElite || enemy.champion || enemy.isLieutenant });
  drawEnemyTraitPips(ctx, { enemy, x, y, size, frame });
  const intent = enemyIntentVfxState(enemy);
  if (intent.imminent && !enemy.isBoss) {
    ctx.globalAlpha = 0.34 + 0.20 * Math.sin(t * 2.6);
    ctx.strokeStyle = intent.color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.16, size + 6, -Math.PI / 2, Math.PI * 1.5);
    ctx.stroke();
  }
  if (enemy.isElite || enemy.champion || enemy.isLieutenant) drawChampionCrown(ctx, { x, y, size, frame, color: enemy.isLieutenant ? '#ffaa44' : '#ffd700' });
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
  if (role.key === 'ranged') {
    const readyPulse = enemy.cd <= 10 ? 1 : 0.45 + 0.22 * Math.sin(t * 1.8);
    ctx.globalAlpha = 0.32 + 0.28 * readyPulse;
    ctx.fillStyle = role.color;
    ctx.beginPath();
    ctx.arc(x + size * 0.48, y - size * 0.16, 2.2 + readyPulse * 1.2, 0, Math.PI * 2);
    ctx.fill();
    if (enemy.cd <= 4) {
      ctx.globalAlpha = 0.38;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.48, y - size * 0.16);
      ctx.lineTo(x + size * 0.78, y - size * 0.20);
      ctx.stroke();
    }
  }
  if (enemy._aoeAttackWarn || enemy._meteorWarn || (enemy.chainBoltT != null && enemy.chainBoltT < 90)) {
    const warnCol = enemy._meteorWarn ? '#ff8844' : (enemy.chainBoltT != null ? '#fff700' : '#ff8c00');
    const pct = enemy._aoeAttackWarn ? 1 - enemy._aoeAttackWarn.timer / Math.max(1, enemy._aoeAttackWarn.maxTimer || 18)
      : enemy._meteorWarn ? 1 - enemy._meteorWarn.timer / Math.max(1, enemy._meteorWarn.maxTimer || 36)
      : 1 - Math.max(0, enemy.chainBoltT || 0) / 90;
    ctx.globalAlpha = 0.30 + pct * 0.40;
    ctx.strokeStyle = warnCol;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.18, size * (0.70 + pct * 0.30), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
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
  if (enemy.burrow || enemy.burrowing) {
    const sand = '#c8a05a';
    ctx.globalAlpha = 0.38 + 0.14 * Math.sin(t * 1.6);
    ctx.strokeStyle = sand;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * size * 0.22;
      ctx.beginPath();
      ctx.moveTo(x + ox - size * 0.16, y + size * 0.40 + i * 1.5);
      ctx.lineTo(x + ox, y + size * 0.30 + i * 1.5);
      ctx.lineTo(x + ox + size * 0.16, y + size * 0.40 + i * 1.5);
      ctx.stroke();
    }
    if (frame % 10 === 0) emitParticle(emitParticleFn, x + randomRange(-size * 0.45, size * 0.45), y + size * 0.50, sand, 1, 2);
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
  if (enemy.flying && frame % 8 === 0) {
    emitParticle(emitParticleFn, x - randomRange(-size * 0.6, size * 0.6), y + size * 0.18, col, 1, 1.8);
    emitParticle(emitParticleFn, x + randomRange(-size * 0.55, size * 0.55), y + size * 0.42, '#1a1a22', 1, 1.4);
  }
  if (enemy.bossSupport && frame % 16 === 0) emitParticle(emitParticleFn, x + randomRange(-size * 0.55, size * 0.55), y - size * 0.10, role.color || col, 1, 2.1);
  if (enemy.fromRift && frame % 12 === 0) emitParticle(emitParticleFn, x + randomRange(-size * 0.55, size * 0.55), y + size * 0.28, '#c08aff', 1, 2.2);
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
    drawEnemyMechanicIcon(ctx, { enemy, x, y, size, frame });
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

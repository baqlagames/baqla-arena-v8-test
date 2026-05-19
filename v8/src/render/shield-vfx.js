const SHIELD_TYPES = {
  gold: '#ffd700',
  naana: '#ffd700',
  earthwarden: '#6b8e23',
  vengeance: '#ffe066',
  guard: '#cfd6df',
  mud: '#8a6a32',
  blood: '#cc2244',
  ice: '#88ddff',
  pact: '#9b59b6',
  engineer: '#44aaff',
  priest: '#ffaadd',
  rapture: '#ffaadd',
  enemy: '#44aaff',
  hive: '#ffdd44',
  spell: '#38bdf8',
};

function positive(value) {
  return Number.isFinite(value) && value > 0;
}

function shieldRatio(value, maxValue) {
  if (!positive(value)) return 0;
  if (!positive(maxValue)) return 1;
  return Math.max(0.08, Math.min(1, value / maxValue));
}

export function shieldColorForType(type, fallback = '#ffd700') {
  return SHIELD_TYPES[type] || fallback || '#ffd700';
}

function pushActiveShield(shields, unit, type, value, maxValue, timerValue, timerMax, color) {
  const amountPct = shieldRatio(value, maxValue);
  const timerPct = shieldRatio(timerValue, timerMax);
  const pct = Math.min(amountPct || 1, timerPct || 1);
  if (pct > 0) shields.push({ type, pct, color });
}

function activeShieldsFor(unit) {
  const shields = [];
  if (!unit) return shields;
  if (unit._goldShield && positive(unit._goldShield.amt)) {
    pushActiveShield(shields, unit, unit._goldShield.type || 'gold', unit._goldShield.amt, unit._goldShield.max, unit._goldShield.timer, unit._goldShield.maxTimer, unit._goldShield.color);
  }
  if (positive(unit.shieldHp)) pushActiveShield(shields, unit, 'naana', unit.shieldHp, Math.max(unit.maxHp * 0.22, unit.shieldHp));
  if (positive(unit.earthwardenShield)) pushActiveShield(shields, unit, 'earthwarden', unit.earthwardenShield, Math.max(unit.maxHp * 0.25, unit.earthwardenShield), unit.earthwardenTimer, unit.earthwardenTimer || 1);
  if (unit.shieldOfVengeance && unit.shieldOfVengeance.active && positive(unit.shieldOfVengeanceHp)) {
    pushActiveShield(shields, unit, 'vengeance', unit.shieldOfVengeanceHp, unit.maxHp * (unit.shieldOfVengeance.shieldPct || 0.2));
  }
  if (positive(unit._zavsLineShield) && positive(unit._zavsLineShieldTimer)) pushActiveShield(shields, unit, 'guard', unit._zavsLineShield, Math.max(unit.maxHp * 0.15, unit._zavsLineShield), unit._zavsLineShieldTimer, 4 * 60);
  if (positive(unit._batataMudShield) && positive(unit._batataMudShieldTimer)) pushActiveShield(shields, unit, 'mud', unit._batataMudShield, Math.max(unit.maxHp * 0.15, unit._batataMudShield), unit._batataMudShieldTimer, 4 * 60);
  if (positive(unit._taoonBloodShield) && positive(unit._taoonBloodShieldTimer)) pushActiveShield(shields, unit, 'blood', unit._taoonBloodShield, Math.max(unit.maxHp * 0.15, unit._taoonBloodShield), unit._taoonBloodShieldTimer, 4 * 60);
  if (unit._iceBarrier && positive(unit._iceBarrier.hp)) pushActiveShield(shields, unit, 'ice', unit._iceBarrier.hp, unit._iceBarrier.maxHp || unit._iceBarrier.max);
  if (unit._darkPactShield && positive(unit._darkPactShield.hp)) pushActiveShield(shields, unit, 'pact', unit._darkPactShield.hp, unit._darkPactShield.maxHp || unit._darkPactShield.max);
  if (unit._engShield && positive(unit._engShield.hp)) pushActiveShield(shields, unit, 'engineer', unit._engShield.hp, unit._engShield.max, unit._engShield.dur - unit._engShield.t, unit._engShield.dur);
  if (unit._pwBarrier && positive(unit._pwBarrier.hp)) pushActiveShield(shields, unit, 'priest', unit._pwBarrier.hp, unit._pwBarrier.max, unit._pwBarrier.timer, 8 * 60);
  if (unit._raptureShield && positive(unit._raptureShield.hp)) pushActiveShield(shields, unit, 'rapture', unit._raptureShield.hp, unit._raptureShield.max);
  if (positive(unit._enemyShield)) pushActiveShield(shields, unit, 'enemy', unit._enemyShield, Math.max(unit.maxHp * 0.18, unit._enemyShield));
  if (unit.hiveShield && positive(unit.hiveShield.hp)) pushActiveShield(shields, unit, 'hive', unit.hiveShield.hp, unit.hiveShield.maxHp || unit.hiveShield.max || unit.hiveShield.hp);
  return shields.slice(-3);
}

export function drawShieldBubble(ctx, {
  x,
  y,
  size,
  frame,
  type = 'shield',
  color = shieldColorForType(type),
  pct = 1,
  index = 0,
}) {
  const t = frame * 0.11 + index * 1.6;
  const radius = size + 7 + index * 3;
  ctx.save();
  ctx.globalAlpha = (0.10 + pct * 0.10) * (0.9 + Math.sin(t) * 0.1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.26 + pct * 0.34 + Math.sin(t) * 0.08;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 + pct * 1.5;
  if (index % 2 === 1) {
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -frame * 0.25;
  }
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.22 + pct * 0.26;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
  ctx.stroke();
  ctx.restore();
}

export function drawShieldHitFx(ctx, {
  unit,
  x,
  y,
  size,
  frame,
}) {
  const fx = unit && unit._shieldHitFx;
  if (!fx || !positive(fx.timer)) return;
  const pct = fx.timer / (fx.maxTimer || 12);
  const color = fx.color || shieldColorForType(fx.type);
  const ring = size + 8 + (1 - pct) * 16;
  ctx.save();
  ctx.globalAlpha = 0.45 * pct;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5 * pct + 0.5;
  ctx.beginPath();
  ctx.arc(x, y, ring, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.18 * pct;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, Math.max(2, size * 0.45 * pct), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  fx.timer--;
  if (fx.timer <= 0) unit._shieldHitFx = null;
}

export function drawShieldBreakFx(ctx, {
  unit,
  x,
  y,
  size,
  frame,
}) {
  const fx = unit && unit._shieldBreakFx;
  if (!fx || !positive(fx.timer)) return;
  const pct = fx.timer / (fx.maxTimer || 24);
  const color = fx.color || shieldColorForType(fx.type);
  const burst = size + 8 + (1 - pct) * 28;
  ctx.save();
  ctx.globalAlpha = 0.58 * pct;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6 * pct + 0.8;
  ctx.beginPath();
  ctx.arc(x, y, burst, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  for (let i = 0; i < 8; i++) {
    const a = frame * 0.025 + i * Math.PI * 2 / 8;
    const r = size + 6 + (1 - pct) * (16 + (i % 3) * 5);
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    ctx.globalAlpha = (0.22 + (i % 2) * 0.12) * pct;
    ctx.beginPath();
    ctx.moveTo(px, py - 4);
    ctx.lineTo(px + 3, py);
    ctx.lineTo(px, py + 4);
    ctx.lineTo(px - 3, py);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  fx.timer--;
  if (fx.timer <= 0) unit._shieldBreakFx = null;
}

export function drawActorShieldVfx(ctx, {
  unit,
  x = unit && unit.x,
  y = unit && unit.y,
  size = unit && unit.size || 16,
  frame = 0,
} = {}) {
  if (!unit || !ctx) return;
  const shields = activeShieldsFor(unit);
  for (let i = 0; i < shields.length; i++) {
    const shield = shields[i];
    drawShieldBubble(ctx, {
      x,
      y: y - size * 0.12,
      size,
      frame,
      type: shield.type,
      color: shield.color || shieldColorForType(shield.type, unit._lastShieldColor),
      pct: shield.pct,
      index: i,
    });
  }
  drawShieldHitFx(ctx, { unit, x, y: y - size * 0.12, size, frame });
  drawShieldBreakFx(ctx, { unit, x, y: y - size * 0.12, size, frame });
}

export const drawUnitShieldVfx = drawActorShieldVfx;

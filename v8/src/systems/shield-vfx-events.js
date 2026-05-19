const HIT_LIFE = 12;
const BREAK_LIFE = 24;

function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function safeCall(fn, ...args) {
  if (typeof fn === 'function') fn(...args);
}

export function markShieldHit(target, {
  type = 'shield',
  color = '#ffd700',
  amount = 0,
  frame = 0,
} = {}) {
  if (!target) return;
  target._lastShieldType = type;
  target._lastShieldColor = color;
  target._shieldHitFx = {
    type,
    color,
    amount: safeNumber(amount),
    frame: safeNumber(frame),
    timer: HIT_LIFE,
    maxTimer: HIT_LIFE,
  };
}

export function markShieldBreak(target, {
  type = 'shield',
  color = '#ffd700',
  amount = 0,
  frame = 0,
} = {}) {
  if (!target) return;
  target._lastShieldType = type;
  target._lastShieldColor = color;
  target._shieldBreakFx = {
    type,
    color,
    amount: safeNumber(amount),
    frame: safeNumber(frame),
    timer: BREAK_LIFE,
    maxTimer: BREAK_LIFE,
  };
}

export function emitShieldAbsorbFx(target, {
  type = 'shield',
  color = '#ffd700',
  amount = 0,
  broken = false,
  frame = 0,
  emitParticle,
  groundEffects,
  addDamageText,
  text,
  breakText = 'SHIELD BREAK',
  particleCount = 5,
  particleSize = 2.5,
  groundPulse = false,
} = {}) {
  if (!target) return;
  markShieldHit(target, { type, color, amount, frame });
  safeCall(emitParticle, target.x, target.y, color, particleCount, particleSize);
  if (text) safeCall(addDamageText, target.x, target.y - (target.size || 16), text, color, { sz: 10, bold: true });
  else if (!broken && target.isPlayer && amount >= 12 && frame - (target._lastAbsorbTextFrame || -999) > 24) {
    target._lastAbsorbTextFrame = frame;
    const label = target.arch === 'tank' || target.taunt ? 'BLOCK ' : 'ABSORB ';
    safeCall(addDamageText, target.x, target.y - (target.size || 16), label + Math.round(amount), color, {
      sz: 10,
      bold: target.arch === 'tank' || target.taunt,
      tagColor: color,
    });
  }
  if (!broken) return;
  markShieldBreak(target, { type, color, amount, frame });
  safeCall(addDamageText, target.x, target.y - (target.size || 16), breakText, color, { sz: 11, bold: true });
  if (groundPulse && Array.isArray(groundEffects)) {
    groundEffects.push({
      x: target.x,
      y: target.y,
      r: 0,
      maxR: (target.size || 16) + 14,
      life: 0.35,
      color,
    });
  }
}

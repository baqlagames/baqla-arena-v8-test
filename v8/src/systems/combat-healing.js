export function applyHealingReceived(target, amount, { healingReceivedMult }) {
  let heal = Math.max(0, Math.round(amount || 0));
  if (target && target._searingBrandTimer > 0) {
    heal = Math.max(1, Math.round(heal * (1 - (target._searingBrandHealCut || 0.10))));
  }
  if (target && target._gravityBrandTimer > 0) {
    heal = Math.max(1, Math.round(heal * (1 - (target._gravityBrandHealCut || 0.12))));
  }
  if (target && target._groundingBrandTimer > 0) {
    heal = Math.max(1, Math.round(heal * (1 - (target._groundingBrandHealCut || 0.10))));
  }
  if (target && target._stormCurseTimer > 0) {
    heal = Math.max(1, Math.round(heal * (1 - (target._stormCurseHealCut || 0.12))));
  }
  if (target && target._rimeVenomTimer > 0) {
    heal = Math.max(1, Math.round(heal * (1 - (target._rimeVenomHealCut || 0.08))));
  }
  const receivedMult = healingReceivedMult ? healingReceivedMult(target) : 1;
  if (receivedMult !== 1) heal = Math.max(1, Math.round(heal * receivedMult));
  return heal;
}

export function applyTrackedHeal(target, amount, {
  source,
  big,
  alreadyAdjusted,
  adjustHealingReceived,
  emitHealFx,
}) {
  if (!target || target.hp <= 0 || !target.maxHp) return 0;
  const heal = alreadyAdjusted
    ? Math.max(0, Math.round(amount || 0))
    : adjustHealingReceived(target, amount);
  const before = target.hp;
  const after = Math.min(target.maxHp, before + heal);
  const actual = Math.max(0, Math.round(after - before));
  if (actual <= 0) {
    emitHealFx(target.x, target.y, 0, big, source, target, {
      attempted: heal,
      overheal: heal,
    });
    return 0;
  }
  target.hp = after;
  emitHealFx(target.x, target.y, actual, big, source, target, {
    attempted: heal,
    overheal: Math.max(0, heal - actual),
  });
  return actual;
}

export function addZavsLineShield(target, amount, { duration, tickHz, emitParticle }) {
  if (!target || target.hp <= 0 || amount <= 0) return;
  target._zavsLineShield = Math.max(target._zavsLineShield || 0, Math.round(amount));
  target._zavsLineShieldTimer = Math.max(target._zavsLineShieldTimer || 0, duration || Math.round(4 * tickHz));
  emitParticle(target.x, target.y, '#cfd6df', 8, 3);
}

export function addGoldShield(target, amount, {
  duration,
  cap,
  noExpireHeal,
  tickHz,
  emitParticle,
  color = '#ffd700',
  type = 'gold',
}) {
  if (!target || target.hp <= 0 || amount <= 0) return 0;
  const shieldDuration = Math.max(1, Math.round(duration || 8 * tickHz));
  const shieldCap = cap > 0 ? Math.round(cap) : Infinity;
  const current = target._goldShield && target._goldShield.amt > 0 ? target._goldShield.amt : 0;
  const next = Math.min(shieldCap, current + Math.round(amount));
  const added = Math.max(0, next - current);
  target._goldShield = {
    amt: next,
    timer: shieldDuration,
    maxTimer: shieldDuration,
    noExpireHeal: !!noExpireHeal,
    color,
    type,
  };
  emitParticle(target.x, target.y, color, 8, 3);
  return added;
}

export function addBatataShield(target, amount, { duration, tickHz, emitParticle }) {
  if (!target || target.hp <= 0 || amount <= 0) return;
  target._batataMudShield = Math.max(target._batataMudShield || 0, Math.round(amount));
  target._batataMudShieldTimer = Math.max(target._batataMudShieldTimer || 0, duration || Math.round(4 * tickHz));
  emitParticle(target.x, target.y, '#8a6a32', 8, 3);
}

export function addTaoonBloodShield(target, amount, { duration, damageReduction, tickHz, emitParticle }) {
  if (!target || target.hp <= 0 || amount <= 0) return;
  const shieldDuration = duration || Math.round(4 * tickHz);
  target._taoonBloodShield = Math.max(target._taoonBloodShield || 0, Math.round(amount));
  target._taoonBloodShieldTimer = Math.max(target._taoonBloodShieldTimer || 0, shieldDuration);
  if (damageReduction) {
    target.bloodOathTimer = Math.max(target.bloodOathTimer || 0, shieldDuration);
    target.bloodOathDR = Math.max(target.bloodOathDR || 0, damageReduction);
  }
  emitParticle(target.x, target.y, '#cc2244', 8, 3);
}

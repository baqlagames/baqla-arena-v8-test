export function applyAttackerOpeningDamageModifiers(dmg, {
  target,
  attacker,
  emitParticle,
  addDamageText,
}) {
  let next = dmg;
  if (attacker && attacker.stealth && !attacker.stealthHits) {
    if (!attacker.firstHitDone && attacker.firstHitMult) {
      next *= attacker.firstHitMult;
      attacker.firstHitDone = true;
      if (attacker.firstHitBleed && target.hp > 0) {
        target.bleedTimer = attacker.firstHitBleed.dur;
        target.bleedDmg = attacker.firstHitBleed.dmg;
        target.bleedFrom = attacker;
        emitParticle(target.x, target.y, '#aa2222', 8, 3);
      }
    } else {
      next *= (attacker.stealthMult || 1);
    }
    if (attacker.vanishCD && attacker.stealthMult > 1 && typeof addDamageText === 'function') {
      addDamageText(target.x, target.y - (target.size || 20) - 10, 'AMBUSH!', '#aa66cc', { sz: 13, bold: true, outline: '#160420' });
      attacker._ambushPrimedTimer = 0;
    }
    attacker.stealthHits = 1;
  }
  if (attacker && attacker.vanishEmpower) {
    next *= attacker.vanishEmpower;
    attacker.vanishEmpower = null;
  }
  return next;
}

export function applyLegacyPreDamageHooks(dmg, {
  inArena,
  target,
  attacker,
  dmgType,
  dealDamage,
  addHealEffect,
  emitParticle,
}) {
  if (inArena) return { dmg, blocked: false };
  let next = dmg;
  if (target.amsActive && dmgType === 'magic') {
    if (attacker) dealDamage(attacker, next * 0.5, target, 'magic');
    emitParticle(target.x, target.y, '#aa66ff', 6, 3);
    return { dmg: next, blocked: true };
  }
  if (target.lastStandActive) next *= 0.5;
  if (target.ironwillActive) next *= 0.5;
  if (target.siActive) next *= 0.2;
  if (target.pwsBlocks > 0) {
    target.pwsBlocks--;
    addHealEffect(target.x, target.y, Math.floor(next * 0.5));
    target.hp = Math.min(target.maxHp, target.hp + next * 0.5);
    emitParticle(target.x, target.y, '#ffd700', 8, 3);
    return { dmg: next, blocked: true };
  }
  return { dmg: next, blocked: false };
}

export function applyBossAndRecordModifiers(dmg, {
  target,
}) {
  let next = dmg;
  if (target.ampTimer > 0) next *= (target.ampMult || 1.3);
  if (target._corrosiveAmp && target._corrosiveTimer > 0) next = Math.round(next * (1 + target._corrosiveAmp));
  if (target.markTimer > 0) next *= (target.markMult || 1.5);
  if (target.deathmarkTimer > 0) target.deathmarkDmg = (target.deathmarkDmg || 0) + next;
  return next;
}

export function applyDamageHit(target, dmg, {
  inArena,
  arenaState,
  attacker,
  dmgType,
  attackTypeOverride,
  opts,
  spawnImpactVfx,
  recordDamage,
  emitParticle,
  addDamageText,
}) {
  if (!Number.isFinite(dmg) || dmg <= 0) return;
  spawnImpactVfx(target, attacker, dmgType, attackTypeOverride, Math.round(dmg), opts);
  const hpBeforeDamage = target.hp;
  target.hp -= dmg;
  if (inArena && target.isKing && target.isPlayer && Math.round(dmg) > 0 && arenaState) arenaState._stageBaseDamaged = true;
  recordDamage(target, attacker, Math.min(Math.max(0, hpBeforeDamage), Math.max(0, Math.round(dmg))), {
    dmgType,
    attackType: attackTypeOverride,
  });
  if (target.polymorphTimer > 0 && dmg > 0) {
    target.polymorphTimer = 0;
    emitParticle(target.x, target.y, '#ffffff', 12, 4);
    addDamageText(target.x, target.y - target.size, 'POLY BREAK!', '#ff88cc');
  }
}

export function applyJudgmentOfLightHit(target, attacker, {
  inArena,
  frame,
  emitParticle,
}) {
  if (!inArena || !attacker || !attacker.isPlayer || !target.judgmentMark || target.judgmentMarkTimer <= 0 || target.judgmentCharges <= 0) return false;
  const heal = Math.min(25, Math.round(attacker.maxHp * 0.02));
  if (attacker.hp < attacker.maxHp) {
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
    if (frame % 10 < 2) emitParticle(attacker.x, attacker.y, '#ffe066', 3, 2);
  }
  target.judgmentCharges--;
  if (target.judgmentCharges <= 0) {
    target.judgmentMark = false;
    target.judgmentMarkTimer = 0;
  }
  return true;
}

export function showDamageHitFeedback(target, dmg, {
  opts,
  dmgType,
  attacker,
  attackTypeOverride,
  frame,
  combatRatio,
  addDamageText,
}) {
  const shownDamage = Math.round(Number(dmg) || 0);
  if (shownDamage <= 0) return;
  target.hitFlash = Math.max(target.hitFlash || 0, 6);
  const damageInfo = damageTypeVisual({ dmgType, attacker, attackTypeOverride, opts });
  const hint = combatRatio <= 0.72 ? 'reduced' : combatRatio >= 1.25 ? 'vulnerable' : null;
  const canShowHint = hint && frame != null && frame - (target._lastDamageHintFrame || -999) > 45;
  if (canShowHint) target._lastDamageHintFrame = frame;
  if (target._damageTextLane == null) target._damageTextLane = ((Math.abs(Math.round((target.x || 0) + (target.y || 0))) % 3) - 1) * 12;
  const hitTextY = target.y - (target.size || 18) - (target.isBoss ? 22 : 13);
  const hitTextDx = target._damageTextLane || 0;
  if (opts && opts.isCrit) {
    addDamageText(target.x, hitTextY - 8, shownDamage, damageInfo.color || '#e066ff', {
      sz: 17,
      bold: true,
      outline: '#330055',
      tag: damageInfo.tag,
      tagColor: damageInfo.tagColor,
      crit: true,
      hint: canShowHint ? hint : null,
      group: target,
    });
  } else {
    addDamageText(target.x, hitTextY, shownDamage, damageInfo.color, {
      dx: hitTextDx,
      vy: -0.34,
      tag: damageInfo.tag,
      tagColor: damageInfo.tagColor,
      hint: canShowHint ? hint : null,
      compact: true,
      group: target,
    });
  }
  showHitSourceFeedback(target, dmg, {
    opts,
    dmgType,
    attacker,
    attackTypeOverride,
    frame,
    addDamageText,
  });
}

function damageTypeVisual({ dmgType, attacker, attackTypeOverride, opts }) {
  const projType = (opts && opts.projType) || attackTypeOverride || (attacker && attacker.projType) || (attacker && attacker.attackType) || '';
  let key = dmgType === 'magic' ? 'magic' : 'physical';
  if (projType === 'pierce') key = 'pierce';
  else if (projType === 'poison' || projType === 'toxic' || projType === 'curse' || (attacker && attacker.poisonOnHit)) key = 'dot';
  else if (
    projType === 'fire' ||
    projType === 'frost' ||
    projType === 'ice' ||
    projType === 'lightning' ||
    projType === 'holy' ||
    projType === 'shadow' ||
    projType === 'voidShard' ||
    projType === 'voidOrb' ||
    projType === 'voidBolt' ||
    (attacker && attacker.unitIdx === 6 && (!attacker.branch || attacker.branch === 'base'))
  ) key = 'magic';
  const table = {
    physical: { tag: '⚔', color: '#ff4444', tagColor: '#ff4444' },
    pierce: { tag: '➶', color: '#ff6b4a', tagColor: '#f59e0b' },
    magic: { tag: '✦', color: '#aa66ff', tagColor: '#aa66ff' },
    dot: { tag: '☠', color: '#78d64b', tagColor: '#78d64b' },
  };
  return table[key] || table.physical;
}

function hitSourceFeedbackInfo({ opts, dmgType, attacker, attackTypeOverride }) {
  if (opts && opts.sourceLabel) {
    return { label: String(opts.sourceLabel).toUpperCase().slice(0, 14), color: opts.sourceColor || hitSourceColor(dmgType, attacker, attackTypeOverride) };
  }
  const type = String(attackTypeOverride || (attacker && attacker.projType) || '').toLowerCase();
  if (type.includes('meteor')) return { label: 'METEOR', color: '#ff6633' };
  if (type.includes('cleave')) return { label: 'CLEAVE', color: '#ff8844' };
  if (type.includes('inferno')) return { label: 'INFERNO', color: '#ff6600' };
  if (type.includes('sun')) return { label: 'SUN PULSE', color: '#d4a857' };
  if (type.includes('smoke')) return { label: 'SMOKE', color: '#aa66cc' };
  if (type.includes('death')) return { label: 'DEATH MARK', color: '#660066' };
  if (type.includes('curse')) return { label: 'CURSE', color: '#aa66cc' };
  if (type.includes('fire')) return { label: 'FIRE', color: '#ff6600' };
  if (type.includes('frost') || type.includes('ice')) return { label: 'FROST', color: '#88ddff' };
  if (type.includes('poison') || type.includes('toxic')) return { label: 'POISON', color: '#78d64b' };
  if (type.includes('holy')) return { label: 'HOLY', color: '#ffe066' };
  if (attacker && attacker.isBoss) {
    if (attacker.id === 4) return { label: 'EMBER HIT', color: '#ff6600' };
    if (attacker.id === 3 || attacker.id === 10) return { label: 'AMBUSH', color: '#aa66cc' };
    if (attacker.id === 6) return { label: 'PHARAOH', color: '#d4a857' };
    if (attacker.id === 5) return { label: 'SAND HIT', color: '#c8a05a' };
    return { label: 'BOSS HIT', color: attacker.color || '#ff8844' };
  }
  if (attacker && attacker._sniperWindup) return { label: 'SNIPER', color: '#ff4444' };
  if (attacker && attacker.splashOnHit) return { label: 'CLEAVE', color: '#ff8844' };
  if (attacker && attacker.chainBoltCD) return { label: 'CHAIN', color: '#fff700' };
  if (attacker && attacker.meteorCD) return { label: 'METEOR', color: '#ff8844' };
  if (type === 'curse') return { label: 'CURSE', color: '#aa66cc' };
  if (type === 'fire') return { label: 'FIRE', color: '#ff6600' };
  if (type === 'frost' || type === 'ice') return { label: 'FROST', color: '#88ddff' };
  if (type === 'poison') return { label: 'POISON', color: '#78d64b' };
  if (dmgType === 'magic') return { label: 'MAGIC', color: '#aa66ff' };
  return { label: 'HEAVY HIT', color: '#ff4444' };
}

function hitSourceColor(dmgType, attacker, attackTypeOverride) {
  const type = String(attackTypeOverride || (attacker && attacker.projType) || '').toLowerCase();
  if (type.includes('fire')) return '#ff6600';
  if (type.includes('frost') || type.includes('ice')) return '#88ddff';
  if (type.includes('poison') || type.includes('toxic')) return '#78d64b';
  if (type.includes('curse') || type.includes('void') || dmgType === 'magic') return '#aa66ff';
  if (type.includes('holy')) return '#ffe066';
  return attacker && attacker.color || '#ff4444';
}

function showHitSourceFeedback(target, dmg, {
  opts,
  dmgType,
  attacker,
  attackTypeOverride,
  frame,
  addDamageText,
}) {
  if (!target || !target.isPlayer || !Number.isFinite(dmg) || dmg <= 0) return;
  const maxHp = Math.max(1, target.maxHp || target.hp || 1);
  const explicitLabel = opts && opts.sourceLabel ? String(opts.sourceLabel).toUpperCase().slice(0, 14) : '';
  const genericExplicit = explicitLabel === 'HIT' || explicitLabel === 'STRIKE';
  const significant = !!(
    target.isKing ||
    (attacker && attacker.isBoss) ||
    (explicitLabel && !genericExplicit) ||
    dmg >= Math.max(24, maxHp * 0.075)
  );
  if (!significant) return;
  const info = hitSourceFeedbackInfo({ opts, dmgType, attacker, attackTypeOverride });
  if (genericExplicit && dmg >= Math.max(24, maxHp * 0.075)) info.label = 'HEAVY HIT';
  const now = Number.isFinite(frame) ? frame : 0;
  const sameRecent = target._lastHitSourceLabel === info.label && now - (target._lastHitSourceFrame || -999) < (target.isKing ? 42 : 34);
  if (sameRecent) return;
  target._lastHitSourceLabel = info.label;
  target._lastHitSourceColor = info.color;
  target._lastHitSourceFrame = now;
  target._lastHitSourceTimer = target.isKing ? 70 : 46;
  target._lastHitSourceDmgRatio = Math.max(0, Math.min(1.5, dmg / maxHp));
  const y = target.y - (target.size || 18) - (target.isKing ? 24 : 28);
  addDamageText(target.x, y, info.label, info.color, {
    sz: target.isKing ? 13 : 11,
    bold: true,
    outline: '#1b0606',
    dy: -4,
    life: 0.92,
  });
}

export function applyLegacyPostDamageHooks(dmg, {
  inArena,
  target,
  attacker,
  frame,
  tickHz,
  showFlash,
  emitParticle,
}) {
  if (inArena) return false;
  if (attacker && attacker.lifesteal) {
    const heal = dmg * attacker.lifesteal;
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
    if (heal > 2) emitParticle(attacker.x, attacker.y, '#ff4488', 3, 2);
  }
  if (target.stealth && dmg > 0) target.idleT = 0;
  if (attacker && attacker.slowOnHit && !target.isBoss && dmg > 0) {
    target.slowTimer = Math.max(target.slowTimer || 0, attacker.slowOnHitDur || 180);
    target.slowMult = attacker.slowOnHitMult || 0.7;
    if (frame % 4 === 0) emitParticle(target.x, target.y, '#e07a1f', 2, 2);
  }
  if (target.hasL5 && target.unitIdx === 0 && !target.lastStandUsed && target.hp < target.maxHp * 0.25 && target.hp > 0) {
    target.lastStandActive = true;
    target.lastStandTimer = 300;
    target.lastStandUsed = true;
    showFlash('LAST STAND!', '#ffaa00', 60);
    emitParticle(target.x, target.y, '#ffaa00', 20, 4);
  }
  if (target.isPlayer && target.arch === 'tank' && !target.ironwillUsed && target.hp > 0 && target.hp < target.maxHp * 0.30) {
    target.ironwillActive = true;
    target.ironwillTimer = 5 * tickHz;
    target.ironwillUsed = true;
    showFlash('IRONWILL!', '#cc8844', 55);
    emitParticle(target.x, target.y, '#cc8844', 24, 5);
  }
  return true;
}

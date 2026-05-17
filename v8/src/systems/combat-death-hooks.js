import { dist } from '../core/math.js';

export function applyExplodingSwarmDeath(unit, {
  inArena,
  units,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  shake,
}) {
  if (!inArena || !unit.isEnemy || !unit._explodingSwarm || unit._explodingSwarmDone) return false;
  unit._explodingSwarmDone = true;
  const radius = unit._explodingSwarm.r || 70;
  const damage = Math.min(60, Math.max(8, Math.round((unit.dmg || 20) * (unit._explodingSwarm.dmgMult || 0.35))));
  for (const target of units) {
    if (target.hp <= 0 || !target.isPlayer || target.untargetable || target.isGhost) continue;
    if (dist(unit, target) <= radius) {
      dealDamage(target, damage, unit, 'normal');
      emitParticle(target.x, target.y, '#ff8844', 5, 3);
    }
  }
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: radius, life: 0.45, color: '#ff8844' });
  emitParticle(unit.x, unit.y, '#ff8844', 24, 5);
  addDamageText(unit.x, unit.y - unit.size, 'POP!', '#ff8844', { sz: 13, bold: true });
  shake(3);
  return true;
}

export function detonateStickyBombOnDeath(unit, {
  inArena,
  enemies,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  shake,
}) {
  if (!inArena || !unit.bomb || !unit.bomb.source) return false;
  const radius = unit.bomb.radius;
  const damage = unit.bomb.dmg;
  const source = unit.bomb.source;
  const level = (source && source.level) || 1;
  const baseMult = 0.45 + level * 0.07;

  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy === unit) continue;
    const distance = dist(unit, enemy);
    if (distance <= radius) {
      const falloff = baseMult * (1 - (distance / radius) * 0.5);
      dealDamage(enemy, Math.round(damage * falloff), source || null, 'normal');
    }
  }

  emitParticle(unit.x, unit.y, '#ff8800', 32, 6);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: radius, life: 0.45, color: '#ff8800' });
  addDamageText(unit.x, unit.y - unit.size, 'BOOM!', '#ff8800');
  shake(6);
  if (source && source.bomb && source.bomb.active > 0) source.bomb.active--;

  if (source && source.cluster) {
    for (let i = 0; i < source.cluster.count; i++) {
      const angle = Math.PI * 2 * i / source.cluster.count;
      const cx = unit.x + Math.cos(angle) * 45;
      const cy = unit.y + Math.sin(angle) * 45;
      const clusterRadius = source.cluster.radius;
      const clusterDamage = Math.round(damage * source.cluster.mult);
      for (const enemy of enemies) {
        if (enemy.hp <= 0 || enemy === unit) continue;
        const clusterDistance = dist({ x: cx, y: cy }, enemy);
        if (clusterDistance <= clusterRadius) {
          const clusterFalloff = baseMult * (1 - (clusterDistance / clusterRadius) * 0.5);
          dealDamage(enemy, Math.round(clusterDamage * clusterFalloff), source, 'normal');
        }
      }
      emitParticle(cx, cy, '#ffaa44', 18, 5);
      groundEffects.push({ x: cx, y: cy, r: 0, maxR: clusterRadius, life: 0.35, color: '#ffaa44' });
    }
    addDamageText(unit.x, unit.y - unit.size - 12, 'CLUSTER!', '#ffaa44');
  }

  unit.bomb = null;
  return true;
}

export function tryRaiseGhoulOnEnemyDeath(unit, {
  inArena,
  units,
  randomFloat = Math.random,
  spawnGhoul,
}) {
  if (!inArena || !unit.isEnemy || unit.isMinion) return false;
  for (const ally of units) {
    if (!ally.raiseGhoul || ally.hp <= 0) continue;
    if (ally.raiseGhoul.active >= ally.raiseGhoul.maxGhouls) continue;
    if (dist(ally, unit) > 200) continue;
    if (randomFloat() < ally.raiseGhoul.chance) {
      spawnGhoul(ally, unit.x, unit.y);
      return true;
    }
  }
  return false;
}

export function tryAngelOfMercySave(unit, {
  randomRange,
  emitParticle,
  groundEffects,
  addDamageText,
  showFlash,
  shake,
}) {
  if (unit.hp > 0 || !unit.angelOfMercy || unit.angelOfMercy.used || unit.isMinion || unit.isGhost) return false;
  unit.angelOfMercy.used = true;
  unit.hp = 1;
  unit._angelForm = { timer: unit.angelOfMercy.dur, radius: 150 };
  unit.untargetable = true;
  for (let i = 0; i < 32; i++) emitParticle(unit.x + randomRange(-20, 20), unit.y + randomRange(-20, 10), '#66ffaa', 1, 5);
  for (let i = 0; i < 16; i++) emitParticle(unit.x + randomRange(-10, 10), unit.y + randomRange(-15, 5), '#ffffff', 1, 4);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 80, life: 0.6, color: '#66ffaa' });
  addDamageText(unit.x, unit.y - unit.size, 'ANGEL OF MERCY!', '#66ffaa');
  showFlash('ANGEL OF MERCY', '#66ffaa', 60);
  shake(8);
  return true;
}

export function tryArdentDefenderSave(unit, {
  tickHz,
  addGoldShield,
  emitParticle,
  groundEffects,
  addDamageText,
  showFlash,
  shake,
  playCheatDeathSfx,
}) {
  if (unit.hp > 0 || !unit.ardentDefender || unit.ardentDefender.used) return false;
  unit.ardentDefender.used = true;
  unit.hp = Math.round(unit.maxHp * unit.ardentDefender.revivePct);
  unit.ardentDefenderTimer = unit.ardentDefender.invulnDur;
  addGoldShield(unit, Math.round(unit.maxHp * 0.12), 4 * tickHz, Math.round(unit.maxHp * 0.18), true);
  emitParticle(unit.x, unit.y, '#ffd700', 32, 6);
  emitParticle(unit.x, unit.y, '#ffffff', 16, 4);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 80, life: 0.6, color: '#ffd700' });
  addDamageText(unit.x, unit.y - unit.size, 'ARDENT DEFENDER!', '#ffd700', { sz: 16, bold: true });
  showFlash('ARDENT DEFENDER!', '#ffd700', 60);
  shake(8);
  playCheatDeathSfx();
  return true;
}

export function tryCheatDeathSave(unit, {
  tickHz,
  emitParticle,
  groundEffects,
  addDamageText,
  showFlash,
  shake,
  playCheatDeathSfx,
}) {
  if (unit.hp > 0 || !unit.cheatDeath || unit._cheatDeathUsed) return false;
  unit._cheatDeathUsed = true;
  unit.hp = Math.max(1, Math.round(unit.maxHp * 0.12));
  unit.cheatDeathDR = 0.85;
  unit.cheatDeathTimer = 3 * tickHz;
  emitParticle(unit.x, unit.y, '#880044', 32, 6);
  emitParticle(unit.x, unit.y, '#ffffff', 16, 4);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 60, life: 0.5, color: '#880044' });
  addDamageText(unit.x, unit.y - unit.size, 'CHEAT DEATH!', '#ff4466', { sz: 16, bold: true });
  showFlash('CHEAT DEATH!', '#ff4466', 60);
  shake(6);
  playCheatDeathSfx();
  return true;
}

export function applyDeathBoom(unit, {
  inArena,
  enemies,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  showFlash,
  shake,
}) {
  if (unit.hp > 0 || !unit.deathBoom || !inArena) return false;
  const radius = unit.deathBoom.radius;
  const damage = Math.round(unit.dmg * unit.deathBoom.mult);
  for (const enemy of enemies) {
    if (enemy.hp > 0 && dist(unit, enemy) <= radius) dealDamage(enemy, damage, unit, 'normal');
  }
  emitParticle(unit.x, unit.y, '#ff8800', 48, 8);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: radius, life: 0.5, color: '#ff8800' });
  addDamageText(unit.x, unit.y - unit.size, 'BOOM!', '#ff8800');
  showFlash('SAPPER DOWN - BOOM!', '#ff8800', 45);
  shake(14);
  return true;
}

export function tryGhostOnDeath(unit, {
  inArena,
  spawnGhost,
}) {
  if (unit.hp > 0 || !unit.ghostOnDeath || !inArena || !unit.isPlayer || unit.isGhost) return false;
  spawnGhost(unit);
  return true;
}

export function tryLastStandSignatureRevive(unit, {
  inArena,
  enemies,
  tickHz,
  emitParticle,
  groundEffects,
  addDamageText,
  showFlash,
  shake,
}) {
  if (!inArena || !unit.isPlayer || !unit.signature || unit.signature.id !== 'last_stand_sig' || unit.lastStandSigUsed || unit.isMinion || unit.isGhost) return false;
  unit.lastStandSigUsed = true;
  unit.hp = Math.round(unit.maxHp * 0.50);
  unit.removed = false;
  unit.lastStandSigTimer = 3 * tickHz;
  for (const enemy of enemies) {
    if (enemy.hp > 0 && dist(unit, enemy) < 200) {
      enemy.forcedTarget = unit;
      enemy.forcedTargetTimer = 3 * tickHz;
    }
  }
  emitParticle(unit.x, unit.y, '#ff4444', 32, 6);
  emitParticle(unit.x, unit.y, '#ffd700', 24, 5);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 100, life: 0.8, color: '#ff4444' });
  addDamageText(unit.x, unit.y - unit.size - 6, 'LAST STAND!', '#ff4444');
  showFlash('LAST STAND!', '#ff4444', 60);
  shake(12);
  return true;
}

export function tryCauterizeRevive(unit, {
  inArena,
  tickHz,
  emitParticle,
  groundEffects,
  addDamageText,
  showFlash,
  shake,
}) {
  if (!inArena || !unit.isPlayer || !unit.cauterizeReady || unit._cauterizeUsed || unit.isMinion || unit.isGhost) return false;
  unit._cauterizeUsed = true;
  unit.hp = Math.round(unit.maxHp * 0.30);
  unit.removed = false;
  unit._iframes = 2 * tickHz;
  emitParticle(unit.x, unit.y, '#ff6600', 32, 6);
  emitParticle(unit.x, unit.y, '#ffcc00', 24, 5);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 60, life: 0.6, color: '#ff8800' });
  addDamageText(unit.x, unit.y - unit.size, 'CAUTERIZE!', '#ff6600');
  showFlash('CAUTERIZE!', '#ff8800', 50);
  shake(6);
  return true;
}

export function tryReviveOnce(unit, {
  inArena,
  emitParticle,
  groundEffects,
  showFlash,
}) {
  if (!inArena || !unit.isPlayer || !unit.reviveOnce || unit.reviveOnce.used || unit.isMinion || unit.isGhost) return false;
  unit.reviveOnce.used = true;
  unit.hp = Math.round(unit.maxHp * unit.reviveOnce.pct);
  unit.removed = false;
  if (unit.cleave && unit.reviveOnce.cleaveBonus) unit.cleave.mult = unit.cleave.mult * 2;
  emitParticle(unit.x, unit.y, '#ff6600', 32, 6);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 80, life: 0.55, color: '#ff6600' });
  showFlash('REVIVED - ' + (unit.unitIdx === 2 ? 'BATATA' : 'UNIT'), '#ff6600', 60);
  return true;
}

export function tryMechSelfDestruct(unit, {
  inArena,
  enemies,
  tickHz,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  showFlash,
  shake,
}) {
  if (!inArena || !unit.isPlayer || !unit.mechSuit || unit._mechSelfDestructUsed || unit.isMinion || unit.isGhost) return false;
  unit._mechSelfDestructUsed = true;
  const radius = 120;
  const damage = Math.round(unit.dmg * 8.0);
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || dist(unit, enemy) > radius) continue;
    const falloff = 1.0 - dist(unit, enemy) / radius * 0.5;
    dealDamage(enemy, Math.round(damage * falloff), unit, 'physical');
    if (!enemy.isBoss) enemy.stunned = Math.max(enemy.stunned || 0, Math.round(1.5 * tickHz));
    emitParticle(enemy.x, enemy.y, '#ff4400', 12, 4);
  }
  unit.hp = Math.max(1, Math.round(unit.maxHp * 0.1));
  unit.removed = false;
  unit._mechRebuilding = { dur: 8 * tickHz, t: 0 };
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: radius, life: 0.8, color: '#ff4400' });
  emitParticle(unit.x, unit.y, '#ff8800', 48, 8);
  emitParticle(unit.x, unit.y, '#ffcc00', 32, 6);
  addDamageText(unit.x, unit.y - unit.size - 4, 'SELF-DESTRUCT!', '#ff4400');
  showFlash('SELF-DESTRUCT!', '#ff4400', 90);
  shake(18);
  return true;
}

export function applyTwinSyncOnMirrorDeath(unit, {
  inArena,
  units,
  emitParticle,
  addDamageText,
}) {
  if (!inArena || !unit.isMirror || !unit.parent || !unit.parent.twinSync) return false;
  const twinSync = unit.parent.twinSync;
  const buff = mirrorSibling => {
    if (!mirrorSibling || mirrorSibling.hp <= 0) return;
    mirrorSibling._origAtkSpdTS = mirrorSibling._origAtkSpdTS || mirrorSibling.atkSpd;
    mirrorSibling.atkSpd = Math.max(8, Math.round(mirrorSibling.atkSpd / twinSync.mult));
    mirrorSibling.twinSyncTimer = twinSync.dur;
    emitParticle(mirrorSibling.x, mirrorSibling.y, '#aa3366', 12, 3);
  };
  buff(unit.parent);
  for (const mirror of units) {
    if (mirror.isMirror && mirror.parent === unit.parent && mirror !== unit && mirror.hp > 0) buff(mirror);
  }
  addDamageText(unit.x, unit.y - unit.size, 'SYNC!', '#aa3366');
  return true;
}

export function explodeFoulMinionOnDeath(unit, {
  inArena,
  enemies,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
}) {
  if (!inArena || !unit.isMinion || !unit.parent || !unit.parent.minionExplodeSrc) return false;
  if (unit.kind !== 'foul' && unit.kind !== 'foulRanged' && unit.kind !== 'foulTank') return false;
  const explosion = unit.parent.minionExplodeSrc;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    if (dist(unit, enemy) <= explosion.radius) dealDamage(enemy, explosion.dmg, unit.parent, 'magic');
  }
  emitParticle(unit.x, unit.y, '#9a8a3a', 24, 5);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: explosion.radius, life: 0.4, color: '#9a8a3a' });
  addDamageText(unit.x, unit.y - unit.size, 'BURST', '#9a8a3a');
  return true;
}

export function applyPrimalWrathDeathExplosion(unit, {
  inArena,
  enemies,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  shake,
}) {
  if (!inArena || !unit.isEnemy || !unit.primalWrathBleed || unit.primalWrathBleed.timer <= 0) return false;
  const damage = Math.round((unit.maxHp || 100) * 0.50);
  const source = unit.primalWrathBleed.source;
  for (const enemy of enemies) {
    if (enemy === unit || enemy.hp <= 0) continue;
    if (dist(unit, enemy) <= 60) {
      dealDamage(enemy, damage, source, 'normal');
      emitParticle(enemy.x, enemy.y, '#6b8e23', 10, 4);
    }
  }
  emitParticle(unit.x, unit.y, '#ff4400', 32, 6);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 60, life: 0.5, color: '#6b8e23' });
  addDamageText(unit.x, unit.y - unit.size, 'EXPLODE!', '#ff4400');
  shake(8);
  return true;
}

export function applySepsisDeathSpread(unit, {
  inArena,
  enemies,
  frame,
  tickHz,
  applyDeadlyPoison,
  emitParticle,
  groundEffects,
  addDamageText,
  shake,
}) {
  if (!inArena || !unit.isEnemy || unit.deadlyPoisonStacks <= 0 || !unit.deadlyPoisonSource || !unit.deadlyPoisonSource.sepsis) return false;
  const stacks = Math.min(2, unit.deadlyPoisonStacks);
  const poisonDamage = unit.deadlyPoisonDmg;
  const source = unit.deadlyPoisonSource;
  const cooldown = Math.round(0.45 * tickHz);
  if (source._sepsisDeathSpreadFrame == null || frame - source._sepsisDeathSpreadFrame >= cooldown) {
    source._sepsisDeathSpreadFrame = frame;
    const nearby = enemies
      .filter(enemy => enemy !== unit && enemy.hp > 0 && dist(unit, enemy) <= 55)
      .sort((a, b) => dist(unit, a) - dist(unit, b))
      .slice(0, 3);
    for (const enemy of nearby) {
      applyDeadlyPoison(source, enemy, stacks, true, false);
      enemy.deadlyPoisonDmg = poisonDamage;
      emitParticle(enemy.x, enemy.y, '#55aa33', 8, 4);
    }
  }
  emitParticle(unit.x, unit.y, '#55aa33', 32, 6);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 55, life: 0.5, color: '#55aa33' });
  addDamageText(unit.x, unit.y - unit.size, 'SEPSIS!', '#55aa33');
  shake(5);
  return true;
}

export function applyUnstableAfflictionDeathSpread(unit, {
  inArena,
  enemies,
  frame,
  tickHz,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  shake,
}) {
  if (!inArena || !unit.isEnemy || unit._agonyStacks <= 0 || !unit._agonyFrom || unit._agonyFrom.hp <= 0 || !unit._agonyFrom.unstableAffliction || unit._agonyFrom.isMinion) return false;
  const source = unit._agonyFrom;
  const cooldown = Math.round(0.35 * tickHz);
  if (source._uaDeathSpreadFrame != null && frame - source._uaDeathSpreadFrame < cooldown) return false;

  source._uaDeathSpreadFrame = frame;
  const radius = source.unstableAffliction.radius;
  const burstDamage = Math.round((source.dmg || 20) * (source.unstableAffliction.burstMult || 0));
  const maxStacks = source.agony ? source.agony.maxStacks : 4;
  const spreadStacks = Math.min(2, unit._agonyStacks);
  const maxTargets = source.unstableAffliction.maxTargets || 3;
  const targets = enemies
    .filter(enemy => enemy !== unit && enemy.hp > 0 && dist(unit, enemy) <= radius)
    .sort((a, b) => dist(unit, a) - dist(unit, b))
    .slice(0, maxTargets);

  for (const enemy of targets) {
    if (burstDamage > 0) dealDamage(enemy, burstDamage, source, 'magic');
    enemy._agonyStacks = Math.min(maxStacks, (enemy._agonyStacks || 0) + spreadStacks);
    enemy._agonyTimer = 4 * tickHz;
    enemy._agonyFrom = source;
    enemy._agonyTickDmg = unit._agonyTickDmg || Math.round((source.dmg || 20) * (source.agony ? source.agony.tickMult : 0.25));
    emitParticle(enemy.x, enemy.y, '#9b59b6', 8, 4);
  }
  emitParticle(unit.x, unit.y, '#9b59b6', 32, 6);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: radius, life: 0.5, color: '#5a1a5a' });
  addDamageText(unit.x, unit.y - unit.size, 'AFFLICTION!', '#9b59b6');
  shake(5);
  return true;
}

export function applyBlackArrowDeathBurst(unit, {
  inArena,
  enemies,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  shake,
}) {
  if (!inArena || !unit.isEnemy || !unit._blackArrow || !unit._blackArrow.explodeDmg) return false;
  const radius = unit._blackArrow.explodeRadius;
  const damage = unit._blackArrow.explodeDmg;
  const source = unit._blackArrow.from;
  for (const enemy of enemies) {
    if (enemy !== unit && enemy.hp > 0 && dist(unit, enemy) <= radius) {
      dealDamage(enemy, damage, source, 'magic');
      emitParticle(enemy.x, enemy.y, '#6633aa', 10, 4);
    }
  }
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: radius, life: 0.5, color: '#6633aa' });
  emitParticle(unit.x, unit.y, '#6633aa', 32, 6);
  addDamageText(unit.x, unit.y - unit.size, 'SHADOW BURST!', '#6633aa');
  shake(6);
  return true;
}

export function applyMunitionsCacheDeathBonus(unit, killer, { addDamageText }) {
  if (!unit.isEnemy || !killer || killer.kind !== 'turret' || !killer.parent || !killer.parent.munitionsCache) return false;
  const cache = killer.parent.munitionsCache;
  killer._turretKills = (killer._turretKills || 0) + 1;
  const bonus = Math.min(cache.maxStacks, killer._turretKills * cache.stacksPerKill);
  killer.dmg = Math.round(killer.parent.dmg * killer.parent.autoTurret.dmgMult * (1 + bonus));
  addDamageText(killer.x, killer.y - killer.size, 'DMG+' + Math.round(bonus * 100) + '%', '#ffa500');
  return true;
}

export function cleanupHornetAuraOnDeath(unit, { enemies }) {
  if (!unit.isBoss || !unit.hornetAura) return false;
  for (const enemy of enemies) {
    if (enemy._auraSrc === unit && enemy._auraOrigAtkSpd) {
      enemy.atkSpd = enemy._auraOrigAtkSpd;
      enemy._auraSrc = null;
      enemy._auraMult = null;
      enemy._auraOrigAtkSpd = null;
    }
  }
  return true;
}

export function applyArenaDeathReactionHooks(unit, killer, {
  inArena,
  units,
  enemies,
  dealDamage,
  frame,
  tickHz,
  applyDeadlyPoison,
  spawnGhoul,
  emitParticle,
  groundEffects,
  addDamageText,
  shake,
}) {
  applyExplodingSwarmDeath(unit, {
    inArena,
    units,
    dealDamage,
    emitParticle,
    groundEffects,
    addDamageText,
    shake,
  });
  if (!inArena) return;

  detonateStickyBombOnDeath(unit, {
    inArena,
    enemies,
    dealDamage,
    emitParticle,
    groundEffects,
    addDamageText,
    shake,
  });
  tryRaiseGhoulOnEnemyDeath(unit, { inArena, units, spawnGhoul });
  applyPrimalWrathDeathExplosion(unit, { inArena, enemies, dealDamage, emitParticle, groundEffects, addDamageText, shake });
  applySepsisDeathSpread(unit, { inArena, enemies, frame, tickHz, applyDeadlyPoison, emitParticle, groundEffects, addDamageText, shake });
  applyUnstableAfflictionDeathSpread(unit, { inArena, enemies, frame, tickHz, dealDamage, emitParticle, groundEffects, addDamageText, shake });
  applyBlackArrowDeathBurst(unit, { inArena, enemies, dealDamage, emitParticle, groundEffects, addDamageText, shake });
  applyMunitionsCacheDeathBonus(unit, killer, { addDamageText });
  cleanupHornetAuraOnDeath(unit, { enemies });
}

export function tryArenaDeathBranchHooks(unit, {
  inArena,
  units,
  enemies,
  tickHz,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  showFlash,
  shake,
}) {
  if (!inArena) return false;
  if (tryLastStandSignatureRevive(unit, { inArena, enemies, tickHz, emitParticle, groundEffects, addDamageText, showFlash, shake })) return true;
  if (tryCauterizeRevive(unit, { inArena, tickHz, emitParticle, groundEffects, addDamageText, showFlash, shake })) return true;
  if (tryReviveOnce(unit, { inArena, emitParticle, groundEffects, showFlash })) return true;
  if (tryMechSelfDestruct(unit, { inArena, enemies, tickHz, dealDamage, emitParticle, groundEffects, addDamageText, showFlash, shake })) return true;
  applyTwinSyncOnMirrorDeath(unit, { inArena, units, emitParticle, addDamageText });
  explodeFoulMinionOnDeath(unit, { inArena, enemies, dealDamage, emitParticle, groundEffects, addDamageText });
  return false;
}

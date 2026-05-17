import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function prepareUnitAttack(unit, target, {
  arena,
  enemies,
  allyDamageMultiplier,
  allyAttackSpeedFactor,
  advanceSharedOnHitCounter,
  groundEffects,
  emitParticle,
  addDamageText,
  shake,
}) {
  let attackSpeed = unit.atkSpd;
  if (unit.frenzy && unit.frenzy === true) {
    const hpPct = unit.hp / unit.maxHp;
    attackSpeed = Math.max(20, Math.round(unit.atkSpd * (0.5 + 0.5 * hpPct)));
  }
  if (arena.bloodlustTimer > 0) attackSpeed = Math.max(18, Math.round(attackSpeed * 0.77));
  const zavsSpeed = allyAttackSpeedFactor(unit);
  if (zavsSpeed !== 1) attackSpeed = Math.max(18, Math.round(attackSpeed * zavsSpeed));
  if (unit._jazarSigHasteTimer > 0) attackSpeed = Math.max(8, Math.round(attackSpeed * (unit._jazarSigHasteMult || 0.70)));
  if (unit.sliceAndDice && unit.sliceAndDice.timer > 0) attackSpeed = Math.max(18, Math.round(attackSpeed / unit.sliceAndDice.spdMult));
  unit.cd = attackSpeed;

  const ohTier = advanceSharedOnHitCounter(unit);

  if (unit.runicHeal) {
    unit._runicCount = (unit._runicCount || 0) + 1;
    if (unit._runicCount >= (unit.runicPowerEvery || 5)) {
      unit._runicCount = 0;
      unit._runicProc = true;
    }
  }

  if (unit.toothAndClawEvery && target.hp > 0) {
    unit._toothAndClawCount = (unit._toothAndClawCount || 0) + 1;
    if (unit._toothAndClawCount >= unit.toothAndClawEvery) {
      unit._toothAndClawCount = 0;
      target.toothAndClawDebuff = true;
      target.toothAndClawTimer = 4 * GAME_TICK_HZ;
      addDamageText(target.x, target.y - target.size - 12, 'WEAKENED', '#ccaa55', { sz: 12, bold: true });
      emitParticle(target.x, target.y, '#ccaa55', 16, 4);
      emitParticle(unit.x, unit.y, '#88aa44', 8, 3);
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 38, life: 0.35, color: '#ccaa55' });
    }
  }

  if (unit._cleaveCounter !== undefined) {
    unit._cleaveCounter++;
    if (unit._cleaveCounter >= 3) {
      unit._cleaveCounter = 0;
      unit._cleaveProc = true;
    } else {
      unit._cleaveProc = false;
    }
  }

  let damage = unit.dmg;
  const allyMult = allyDamageMultiplier(unit);
  damage *= allyMult;

  let isEmpower = false;
  if (unit.chargeEmpower && unit.chargeEmpower > 1) {
    damage *= unit.chargeEmpower;
    isEmpower = true;
    unit.chargeEmpower = 1;
  }

  let isCrit = false;
  if (unit.crit && Math.random() < unit.crit.chance) {
    damage *= unit.crit.mult;
    isCrit = true;
  }

  let isExecute = false;
  if (unit.execute && target.hp / target.maxHp < unit.execute.threshold) {
    damage *= unit.execute.mult;
    isExecute = true;
    emitParticle(target.x, target.y, '#ff2222', 12, 4);
  }

  let firstStrike = false;
  if (unit.stealth && unit.stealthHits === 0 && unit.firstHitMult && !unit.firstHitDone) {
    damage *= unit.firstHitMult;
    firstStrike = true;
    unit.firstHitDone = true;
    unit.stealthHits = 1;
    emitParticle(unit.x, unit.y, '#5e1218', 16, 4);
    if (unit.sap) {
      let sapTarget = null;
      let sapDistance = Infinity;
      for (const enemy of enemies) {
        if (enemy === target || enemy.hp <= 0 || enemy.isBoss) continue;
        const distance = dist(unit, enemy);
        if (distance < 100 && distance < sapDistance) {
          sapDistance = distance;
          sapTarget = enemy;
        }
      }
      if (sapTarget) {
        sapTarget.stunned = unit.sap.dur;
        sapTarget.sapped = true;
        addDamageText(sapTarget.x, sapTarget.y - sapTarget.size, 'SAP!', '#ffcc00');
        emitParticle(sapTarget.x, sapTarget.y, '#ffcc00', 12, 3);
      }
    }
    if (unit.garrote) {
      target.silenceTimer = unit.garrote.silenceDur;
      target.garroteBleeding = true;
      target.garroteBleedTimer = unit.garrote.bleedDur;
      target.garroteBleedDmg = unit.garrote.bleedDmg;
      target.garroteBleedSource = unit;
      addDamageText(target.x, target.y - target.size, 'GARROTE!', '#cc2244');
      emitParticle(target.x, target.y, '#cc2244', 16, 4);
    }
  }

  if (unit.devour && target.hp <= unit.devour.instakillHp && !target.isBoss && !target.isElite) {
    damage = target.hp + 1;
    emitParticle(target.x, target.y, '#9b0c0c', 32, 6);
    addDamageText(target.x, target.y - target.size, 'DEVOUR!', '#9b0c0c');
    shake(4);
  }

  damage = Math.round(damage);

  let isAimed = false;
  if (unit.aimedShot) {
    unit.aimedShot.counter++;
    if (unit.aimedShot.counter >= unit.aimedShot.every) {
      unit.aimedShot.counter = 0;
      damage = Math.round(damage * unit.aimedShot.mult);
      isAimed = true;
      emitParticle(unit.x, unit.y, '#ffd700', 32, 5);
      addDamageText(unit.x, unit.y - unit.size, 'AIMED!', '#ffd700');
      shake(4);
    }
  }

  return {
    damage,
    ohTier,
    allyMult,
    isAimed,
    isCrit,
    isExecute,
    isEmpower,
    firstStrike,
  };
}

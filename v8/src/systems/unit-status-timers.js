export function tickUnitStatusTimers(unit, {
  frame,
  randomRange,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
}) {
  if (unit.stunned > 0) {
    unit.stunned--;
    return true;
  }

  if (unit.slowTimer > 0) {
    unit.slowTimer--;
    if (unit.slowTimer <= 0) unit.slowMult = 1;
  }
  if (unit.bleedTickTimer > 0) unit.bleedTickTimer--;
  if (unit.lastStandV6Timer > 0) unit.lastStandV6Timer--;
  if (unit.levelUpPunch > 0) unit.levelUpPunch--;

  tickBossDebuffs(unit, { frame, randomRange, dealDamage, emitParticle, addDamageText });
  if (unit.hp <= 0) return true;

  if (tickTemporaryLife(unit, { groundEffects, emitParticle })) return true;
  return false;
}

function tickBossDebuffs(unit, {
  frame,
  randomRange,
  dealDamage,
  emitParticle,
  addDamageText,
}) {
  if (unit.poisonTimer > 0) {
    unit.poisonTimer--;
    if (frame % 30 === 0 && unit.poisonDmgVal && unit.hp > 0) {
      dealDamage(unit, unit.poisonDmgVal, null, 'magic');
      emitParticle(unit.x, unit.y - unit.size * 0.5, '#88ff44', 2, 2);
    }
  }
  if (unit.ampTimer > 0) unit.ampTimer--;
  if (unit.markTimer > 0) unit.markTimer--;
  if (unit._searingBrandTimer > 0) {
    unit._searingBrandTimer--;
    if (frame % 12 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.4, unit.size * 0.4), unit.y - unit.size * 0.4, '#ff6a22', 1, 2);
  }
  if (unit._royalStingTimer > 0) {
    unit._royalStingTimer--;
    if (frame % 10 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.35, unit.size * 0.35), unit.y - unit.size * 0.5, '#ffdd44', 1, 2);
  }
  if (unit.deathMarkTimer > 0) {
    unit.deathMarkTimer--;
    if (unit.deathMarkTimer <= 0 && unit.hp > 0) {
      dealDamage(unit, unit.deathMarkDmg || 200, unit.deathMarkFrom || null, 'magic');
      for (let i = 0; i < 24; i++) emitParticle(unit.x, unit.y, '#660066', 1, 5);
      addDamageText(unit.x, unit.y - unit.size, 'DEATH MARK!', '#660066');
    }
  }
}

function tickTemporaryLife(unit, { groundEffects, emitParticle }) {
  if (unit.lifeTicks == null || unit.isGhost) return false;

  unit.lifeTicks--;
  if (unit.lifeTicks > 0) return false;

  const color = unit.tempMirror ? '#aa3366' : (unit.kind === 'undead' ? '#22ff66' : '#aaa');
  emitParticle(unit.x, unit.y, color, 16, 4);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 24, life: 0.35, color });
  unit.hp = 0;
  unit.removed = true;
  return true;
}

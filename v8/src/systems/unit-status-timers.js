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
  if (unit._gravityBrandTimer > 0) {
    unit._gravityBrandTimer--;
    if (frame % 10 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.4, unit.size * 0.4), unit.y - unit.size * 0.5, '#9bb8ff', 1, 2);
  }
  if (unit._groundingBrandTimer > 0) {
    unit._groundingBrandTimer--;
    if (frame % 10 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.4, unit.size * 0.4), unit.y - unit.size * 0.5, '#8bdfff', 1, 2);
  }
  if (unit.silenceTimer > 0) {
    unit.silenceTimer--;
    if (frame % 10 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.4, unit.size * 0.4), unit.y - unit.size * 0.6, '#ffaa00', 1, 2);
  }
  if (unit._stormSilenceTimer > 0) {
    unit._stormSilenceTimer--;
    if (frame % 8 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.35, unit.size * 0.35), unit.y - unit.size * 0.7, '#9bb8ff', 1, 2);
  }
  if (unit._stormCurseTimer > 0) {
    unit._stormCurseTimer--;
    unit._stormCurseTick = Math.max(0, (unit._stormCurseTick || 60) - 1);
    if (unit._stormCurseTick <= 0 && unit.hp > 0) {
      unit._stormCurseTick = 60;
      const dmg = Math.max(8, Math.round((unit.maxHp || unit.hp || 1) * (unit._stormCurseHpPct || 0.01)));
      dealDamage(unit, dmg, unit._stormCurseFrom || null, 'magic', 'rimeCurse', { sourceLabel: 'RIME CURSE', sourceColor: '#9fdcff' });
      addDamageText(unit.x, unit.y - unit.size - 8, 'RIME CURSE', '#9fdcff');
      emitParticle(unit.x, unit.y - unit.size * 0.5, '#9fdcff', 4, 2);
    }
    if (frame % 10 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.35, unit.size * 0.35), unit.y - unit.size * 0.45, '#9fdcff', 1, 2);
    if (unit._stormCurseTimer <= 0) {
      unit._stormCurseTick = 0;
      unit._stormCurseFrom = null;
    }
  }
  if (unit._stormVenomTimer > 0) {
    unit._stormVenomTimer--;
    unit._stormVenomTick = Math.max(0, (unit._stormVenomTick || 60) - 1);
    if (unit._stormVenomTick <= 0 && unit.hp > 0) {
      unit._stormVenomTick = 60;
      const dmg = Math.max(unit._stormVenomMinDmg || 8, Math.round((unit.maxHp || unit.hp || 1) * (unit._stormVenomHpPct || 0.012)));
      dealDamage(unit, dmg, unit._stormVenomFrom || null, 'magic', 'frostburn', { sourceLabel: 'FROSTBURN', sourceColor: '#d8f8ff' });
      addDamageText(unit.x, unit.y - unit.size - 8, 'FROSTBURN', '#d8f8ff');
      emitParticle(unit.x, unit.y - unit.size * 0.5, '#d8f8ff', 4, 2);
    }
    if (frame % 10 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.35, unit.size * 0.35), unit.y - unit.size * 0.45, '#d8f8ff', 1, 2);
    if (unit._stormVenomTimer <= 0) {
      unit._stormVenomTick = 0;
      unit._stormVenomFrom = null;
    }
  }
  if (unit._astralBlightTimer > 0) {
    unit._astralBlightTimer--;
    unit._astralBlightTick = Math.max(0, (unit._astralBlightTick || 60) - 1);
    if (unit._astralBlightTick <= 0 && unit.hp > 0) {
      unit._astralBlightTick = 60;
      const dmg = Math.max(6, Math.round((unit.maxHp || unit.hp || 1) * (unit._astralBlightHpPct || 0.008)));
      dealDamage(unit, dmg, unit._astralBlightFrom || null, 'magic', 'astralBlight', { sourceLabel: 'ASTRAL BLIGHT', sourceColor: '#8bdfff' });
      addDamageText(unit.x, unit.y - unit.size - 8, 'ASTRAL BLIGHT', '#8bdfff');
      emitParticle(unit.x, unit.y - unit.size * 0.5, '#8bdfff', 4, 2);
    }
    if (unit._astralBlightTimer <= 0) {
      unit._astralBlightTick = 0;
      unit._astralBlightFrom = null;
    }
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

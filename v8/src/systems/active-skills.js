export const ARENA_BLOODLUST_COST = 75;
export const ARENA_TRANQUILITY_COST = 50;

const BLOODLUST_DURATION_SECONDS = 8;
const TRANQUILITY_DURATION_SECONDS = 6;
const TRANQUILITY_PULSE_FRAMES = 30;
const TRANQUILITY_HEAL_PCT = 0.0167;

export function activateBloodlust({ arena, gold, units, gameTickHz, emitParticle }) {
  if (arena.phase !== 'wave') {
    return {
      gold,
      flash: { text: 'BLOODLUST \u2014 wave only', color: '#aa3322', timer: 45 },
    };
  }
  if (arena.bloodlustUsed) {
    return {
      gold,
      flash: { text: 'BLOODLUST \u2014 already used', color: '#aa3322', timer: 45 },
    };
  }
  if (gold < ARENA_BLOODLUST_COST) {
    return {
      gold,
      flash: { text: 'NEED ' + ARENA_BLOODLUST_COST + 'g', color: '#aa3322', timer: 45 },
    };
  }
  const nextGold = gold - ARENA_BLOODLUST_COST;
  arena.bloodlustUsed = true;
  arena.bloodlustTimer = BLOODLUST_DURATION_SECONDS * gameTickHz;
  for (const u of units) {
    if (!u.isPlayer || u.hp <= 0) continue;
    emitParticle(u.x, u.y, '#ff2222', 16, 5);
    emitParticle(u.x, u.y, '#ffaa00', 8, 3);
  }
  return {
    gold: nextGold,
    screenShake: 10,
    flash: { text: 'BLOODLUST!', color: '#ff2222', timer: 80 },
  };
}

export function activateTranquility({ arena, gold, units, gameTickHz, emitParticle }) {
  if (arena.phase !== 'wave') {
    return {
      gold,
      flash: { text: 'TRANQUILITY \u2014 wave only', color: '#3a8e3a', timer: 45 },
    };
  }
  if (arena.tranquilityUsed) {
    return {
      gold,
      flash: { text: 'TRANQUILITY \u2014 already used', color: '#3a8e3a', timer: 45 },
    };
  }
  if (gold < ARENA_TRANQUILITY_COST) {
    return {
      gold,
      flash: { text: 'NEED ' + ARENA_TRANQUILITY_COST + 'g', color: '#aa3322', timer: 45 },
    };
  }
  const nextGold = gold - ARENA_TRANQUILITY_COST;
  arena.tranquilityUsed = true;
  arena.tranquilityTimer = TRANQUILITY_DURATION_SECONDS * gameTickHz;
  arena.tranquilityTickAcc = 0;
  for (const u of units) {
    if (!u.isPlayer || u.hp <= 0) continue;
    emitParticle(u.x, u.y, '#3aff66', 16, 5);
  }
  return {
    gold: nextGold,
    flash: { text: 'TRANQUILITY', color: '#3aff66', timer: 80 },
  };
}

export function tickActiveSkills({ arena, units, emitHeal, emitParticle, random, applyHeal, source }) {
  if (arena.bloodlustTimer > 0) arena.bloodlustTimer--;
  if (arena.tranquilityTimer <= 0) return;

  arena.tranquilityTimer--;
  arena.tranquilityTickAcc++;
  if (arena.tranquilityTickAcc < TRANQUILITY_PULSE_FRAMES) return;

  arena.tranquilityTickAcc = 0;
  for (const u of units) {
    if (!u.isPlayer || u.hp <= 0) continue;
    const heal = Math.max(1, Math.round(u.maxHp * TRANQUILITY_HEAL_PCT));
    const actual = typeof applyHeal === 'function'
      ? applyHeal(u, heal, source, false)
      : Math.max(0, Math.min(u.maxHp, u.hp + heal) - u.hp);
    if (typeof applyHeal !== 'function') {
      u.hp = Math.min(u.maxHp, u.hp + heal);
      if (actual > 0) emitHeal(u.x, u.y, actual);
    }
    for (let i = 0; i < 2; i++) {
      emitParticle(u.x + random(-u.size * 0.6, u.size * 0.6), u.y - u.size - 6, '#3aff66', 1, 3);
    }
  }
}

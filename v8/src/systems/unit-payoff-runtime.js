export function createUnitPayoffRuntime(deps = {}) {
  const tickHz = deps.tickHz || 60;
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});
  const dist = typeof deps.distance === 'function'
    ? deps.distance
    : ((a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)));
  const dealDamage = typeof deps.dealDamage === 'function' ? deps.dealDamage : () => {};
  const clampToArena = typeof deps.clampToArena === 'function' ? deps.clampToArena : () => {};
  const emitParticle = typeof deps.emitParticle === 'function' ? deps.emitParticle : () => {};
  const addDamageText = typeof deps.addDamageText === 'function' ? deps.addDamageText : () => {};

  function basicSecondHitFor(unit) {
    if (!unit || !unit.isPlayer || unit.isMinion || unit.isGhost) return null;
    if (unit.unitIdx === 7) return { range: 150, mult: 0.50, dmgType: 'magic', attackType: 'magic', color: '#a855f7', label: 'SPLIT CURSE', applyAgony: true };
    if (unit.unitIdx === 8) return { range: 160, mult: 0.48, dmgType: 'normal', attackType: 'pierce', color: '#44ddff', label: 'TWIN SHOT' };
    return null;
  }

  function findBasicSecondTarget(attacker, primary, range) {
    if (!attacker || !primary) return null;
    const { enemies = [] } = view();
    let best = null, bestScore = Infinity;
    const atkRange = (attacker.range || 180) + 30;
    for (const enemy of enemies) {
      if (!enemy || enemy === primary || enemy.hp <= 0) continue;
      const nearPrimary = dist(primary, enemy);
      const nearAttacker = dist(attacker, enemy);
      if (nearPrimary > range && nearAttacker > atkRange) continue;
      const score = nearPrimary + nearAttacker * 0.12;
      if (score < bestScore) { bestScore = score; best = enemy; }
    }
    return best;
  }

  function activePayoffZoneCount(unit) {
    const { groundFx = [] } = view();
    let count = 0;
    for (const effect of groundFx) {
      if (effect && effect.curseBloom && effect.cbFrom === unit && effect.life > 0) count++;
    }
    return count;
  }

  function triggerJafaarCurseBloom(unit, target) {
    if (!unit || !target || target.hp <= 0) return false;
    const { frame = 0, groundFx = [] } = view();
    const sourceCd = Math.round(2.0 * tickHz);
    if (unit._jafaarBloomFrame != null && frame - unit._jafaarBloomFrame < sourceCd) return false;
    if (activePayoffZoneCount(unit) >= 2) return false;
    const cd = Math.round(6 * tickHz);
    if (target._jafaarBloomFrame != null && frame - target._jafaarBloomFrame < cd) return false;
    unit._jafaarBloomFrame = frame;
    target._jafaarBloomFrame = frame;
    const r = 48, dur = Math.round(2.0 * tickHz);
    groundFx.push({ x: target.x, y: target.y, r: 0, maxR: r, life: 1, curseBloom: true, cbTimer: dur, cbMax: dur, cbTick: 0, cbTickEvery: Math.round(0.5 * tickHz), cbDmg: Math.max(1, Math.round((unit.dmg || 20) * 0.09)), cbFrom: unit, color: '#9b59b6', altColor: '#cc88ff' });
    emitParticle(target.x, target.y, '#9b59b6', 14, 4);
    emitParticle(target.x, target.y, '#cc88ff', 6, 3);
    addDamageText(target.x, target.y - (target.size || 18) - 8, 'CURSE BLOOM!', '#cc88ff', { sz: 11, bold: true });
    return true;
  }

  function triggerJafaarFelMeteor(unit, target) {
    if (!unit || !target || target.hp <= 0) return false;
    const { frame = 0, bombs = [], groundFx = [], arenaTop = 0 } = view();
    const sourceCd = Math.round(5.0 * tickHz);
    if (unit._jafaarMeteorFrame != null && frame - unit._jafaarMeteorFrame < sourceCd) return false;
    const cd = Math.round(8 * tickHz);
    if (target._jafaarMeteorFrame != null && frame - target._jafaarMeteorFrame < cd) return false;
    unit._jafaarMeteorFrame = frame;
    target._jafaarMeteorFrame = frame;
    const r = 66;
    bombs.push({ x: target.x, y: arenaTop - 80, fromX: target.x, fromY: arenaTop - 80, tx: target.x, ty: target.y, t: 0, dur: 64,
      dmg: Math.max(1, Math.round((unit.dmg || 20) * 1.25)), radius: r, attacker: unit, isPlayer: true, color: '#9b59b6', altColor: '#cc88ff',
      meteor: true, playerMeteor: true, felMeteor: true, dmgType: 'magic', felPoolRadius: 52, felPoolDmg: Math.max(1, Math.round((unit.dmg || 20) * 0.06)) });
    emitParticle(target.x, target.y, '#9b59b6', 14, 5);
    emitParticle(target.x, target.y, '#cc88ff', 8, 3);
    groundFx.push({ x: target.x, y: target.y, r: 0, maxR: r, life: 0.55, color: '#9b59b6' });
    addDamageText(target.x, target.y - (target.size || 18) - 14, 'FEL METEOR!', '#cc88ff', { sz: 12, bold: true });
    return true;
  }

  function applyJafaarAgony(unit, target, quiet, allowPayoff) {
    if (!unit || !unit.agony || !target || target.hp <= 0) return;
    if (!target._agonyStacks) target._agonyStacks = 0;
    if (target._agonyStacks < unit.agony.maxStacks) target._agonyStacks++;
    target._agonyTimer = unit.agony.dur;
    target._agonyFrom = unit;
    target._agonyTickDmg = Math.round(unit.dmg * unit.agony.tickMult);
    if (!quiet && target._agonyStacks === 1) {
      addDamageText(target.x, target.y - target.size, 'AGONY!', '#9b59b6');
      emitParticle(target.x, target.y, '#9b59b6', 8, 3);
    } else {
      emitParticle(target.x, target.y, quiet ? '#a855f7' : '#7b3a9a', quiet ? 5 : 4, 2);
    }
    if (allowPayoff !== false && unit.unitIdx === 7 && !unit.isMinion && (unit.level || 1) >= 3) {
      target._jafaarCurseApps = (target._jafaarCurseApps || 0) + 1;
      if (target._agonyStacks >= 3) triggerJafaarCurseBloom(unit, target);
      if (target._jafaarCurseApps >= 5 && triggerJafaarFelMeteor(unit, target)) {
        target._jafaarCurseApps = 0;
      }
    }
  }

  function felfelPoisonPayoffActive(unit) {
    return !!(unit && unit.unitIdx === 4 && !unit.isMinion && !unit.isMirror && (unit.level || 1) >= 3 && (unit.poisonPayoff || unit.branch === 'b'));
  }

  function triggerFelfelToxicBloom(unit, target) {
    if (!unit || !target || target.hp <= 0) return false;
    const { frame = 0, groundFx = [] } = view();
    const sourceCd = Math.round(1.8 * tickHz);
    if (unit._felfelBloomFrame != null && frame - unit._felfelBloomFrame < sourceCd) return false;
    if (activePayoffZoneCount(unit) >= 2) return false;
    const cd = Math.round(6 * tickHz);
    if (target._felfelBloomFrame != null && frame - target._felfelBloomFrame < cd) return false;
    unit._felfelBloomFrame = frame;
    target._felfelBloomFrame = frame;
    const r = 48, dur = Math.round(2.0 * tickHz);
    groundFx.push({ x: target.x, y: target.y, r: 0, maxR: r, life: 1, curseBloom: true, poisonBloom: true, cbTimer: dur, cbMax: dur, cbTick: 0, cbTickEvery: Math.round(0.5 * tickHz), cbDmg: Math.max(1, Math.round((unit.dmg || 20) * 0.08)), cbFrom: unit, color: '#55aa33', altColor: '#bbff55' });
    emitParticle(target.x, target.y, '#55aa33', 14, 4);
    emitParticle(target.x, target.y, '#bbff55', 6, 3);
    addDamageText(target.x, target.y - (target.size || 18) - 8, 'TOXIC BLOOM!', '#55ff77', { sz: 11, bold: true });
    return true;
  }

  function triggerFelfelVenomMeteor(unit, target) {
    if (!unit || !target || target.hp <= 0) return false;
    const { frame = 0, bombs = [], groundFx = [], arenaTop = 0 } = view();
    const sourceCd = Math.round(5.5 * tickHz);
    if (unit._felfelMeteorFrame != null && frame - unit._felfelMeteorFrame < sourceCd) return false;
    const cd = Math.round(8 * tickHz);
    if (target._felfelMeteorFrame != null && frame - target._felfelMeteorFrame < cd) return false;
    unit._felfelMeteorFrame = frame;
    target._felfelMeteorFrame = frame;
    const r = 64;
    bombs.push({ x: target.x, y: arenaTop - 80, fromX: target.x, fromY: arenaTop - 80, tx: target.x, ty: target.y, t: 0, dur: 60,
      dmg: Math.max(1, Math.round((unit.dmg || 20) * 1.10)), radius: r, attacker: unit, isPlayer: true, color: '#55ff33', altColor: '#bbff55',
      meteor: true, playerMeteor: true, venomMeteor: true, dmgType: 'magic', venomPoolRadius: 50, venomPoolDmg: Math.max(1, Math.round((unit.dmg || 20) * 0.05)) });
    emitParticle(target.x, target.y, '#55ff33', 14, 5);
    emitParticle(target.x, target.y, '#173a0a', 6, 3);
    groundFx.push({ x: target.x, y: target.y, r: 0, maxR: r, life: 0.55, color: '#55ff33' });
    addDamageText(target.x, target.y - (target.size || 18) - 14, 'VENOM METEOR!', '#55ff33', { sz: 12, bold: true });
    return true;
  }

  function applyFelfelDeadlyPoison(unit, target, stacks, quiet, allowPayoff) {
    const { frame = 0, groundFx = [] } = view();
    if (!unit || !target || target.hp <= 0) return;
    const add = Math.max(1, Math.round(stacks || 1));
    const prev = target.deadlyPoisonStacks || 0;
    target.deadlyPoisonStacks = Math.min(5, prev + add);
    target.deadlyPoisonTimer = 4 * tickHz;
    target.deadlyPoisonSource = unit;
    target.deadlyPoisonDmg = Math.max(target.deadlyPoisonDmg || 0, Math.round((unit.dmg || 20) * 0.15));
    if (!quiet && prev <= 0) {
      addDamageText(target.x, target.y - (target.size || 18) - 4, 'POISON!', '#55aa33');
      groundFx.push({ x: target.x, y: target.y, r: 0, maxR: 16, life: 0.2, color: '#55aa33' });
    }
    emitParticle(target.x, target.y, '#55aa33', quiet ? 3 : 5, quiet ? 2 : 3);
    if (target.deadlyPoisonStacks >= 3) {
      const angle = frame * 0.12;
      emitParticle(target.x + Math.cos(angle) * 8, target.y + Math.sin(angle) * 6, '#33cc22', 2, 2);
    }
    if (allowPayoff !== false && felfelPoisonPayoffActive(unit)) {
      target._felfelPoisonApps = (target._felfelPoisonApps || 0) + add;
      if (target.deadlyPoisonStacks >= 3) triggerFelfelToxicBloom(unit, target);
      if ((target.deadlyPoisonStacks >= 5 || target._felfelPoisonApps >= 5) && triggerFelfelVenomMeteor(unit, target)) {
        target._felfelPoisonApps = 0;
        target.deadlyPoisonStacks = Math.min(2, target.deadlyPoisonStacks);
        target.deadlyPoisonTimer = 4 * tickHz;
      }
    }
  }

  function moonkinDisplaceEnemy(center, enemy, amount, mode) {
    if (!center || !enemy || enemy.hp <= 0) return;
    const dx = enemy.x - center.x, dy = enemy.y - center.y, d = Math.hypot(dx, dy) || 1;
    if (enemy.isBoss || enemy.isBarrier || enemy.lockedAtTop) {
      enemy.slowTimer = Math.max(enemy.slowTimer || 0, Math.round(0.45 * tickHz));
      enemy.slowMult = Math.min(enemy.slowMult || 1, mode === 'pull' ? 0.86 : 0.90);
      return;
    }
    const dir = mode === 'pull' ? -1 : 1;
    enemy.x += dx / d * amount * dir;
    enemy.y += dy / d * amount * dir;
    clampToArena(enemy);
    enemy.slowTimer = Math.max(enemy.slowTimer || 0, Math.round(0.35 * tickHz));
    enemy.slowMult = Math.min(enemy.slowMult || 1, mode === 'pull' ? 0.58 : 0.66);
  }

  function moonkinControlBurst(cx, cy, radius, unit, damage, mode, amount, label, color) {
    const { enemies = [], groundFx = [] } = view();
    let hit = 0;
    const center = { x: cx, y: cy };
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || dist(center, enemy) > radius) continue;
      if (damage > 0) dealDamage(enemy, damage, unit, 'magic');
      moonkinDisplaceEnemy(center, enemy, amount, mode);
      emitParticle(enemy.x, enemy.y, color || '#aaccff', 6, 3);
      hit++;
    }
    groundFx.push({ x: cx, y: cy, r: 0, maxR: radius, life: 0.48, color: color || '#aaccff' });
    if (label && hit) addDamageText(cx, cy - 20, label, color || '#aaccff', { sz: 12, bold: true });
    return hit;
  }

  function jafaarCurseWeight(enemy) {
    if (!enemy || enemy.hp <= 0) return 0;
    let weight = 0;
    if (enemy._agonyStacks > 0 && enemy._agonyTimer > 0) weight += enemy._agonyStacks * 3;
    if (enemy.poisonTimer > 0) weight += 1;
    if (enemy.bleedTimer > 0 || enemy.garroteBleedTimer > 0) weight += 1;
    if (enemy.plagueTimer > 0) weight += 1;
    if (enemy._igniteStacks && enemy._igniteStacks.length > 0) weight += 1;
    if (enemy.toxicBrewStacks > 0) weight += enemy.toxicBrewStacks;
    if (enemy.deadlyPoisonStacks > 0) weight += enemy.deadlyPoisonStacks;
    return weight;
  }

  function findJafaarDrainTarget(unit) {
    const { enemies = [] } = view();
    const maxRange = (unit.range || 180) + 70;
    let best = null, bestScore = -Infinity;
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || dist(unit, enemy) > maxRange) continue;
      const score = jafaarCurseWeight(enemy) * 80 + (1 - enemy.hp / Math.max(1, enemy.maxHp)) * 35 - dist(unit, enemy) * 0.03;
      if (score > bestScore) { bestScore = score; best = enemy; }
    }
    return best;
  }

  function applyBasicSecondHit(attacker, primary, damage, config, fallbackDmgType, fallbackAttackType) {
    if (!config || !attacker || attacker.hp <= 0 || !primary) return;
    const { beamFx = [], frame = 0 } = view();
    const second = (config.target && config.target.hp > 0 && config.target !== primary)
      ? config.target
      : findBasicSecondTarget(attacker, primary, config.range || 150);
    if (!second) return;
    if (config.applyAgony) applyJafaarAgony(attacker, second, true, false);
    const hitDmg = Math.max(1, Math.round(damage * (config.mult || 0.45)));
    dealDamage(second, hitDmg, attacker, config.dmgType || fallbackDmgType || 'normal', config.attackType || fallbackAttackType);
    const col = config.color || '#88ddff';
    beamFx.push({ x1: primary.x, y1: primary.y, x2: second.x, y2: second.y, life: 0.18, maxLife: 0.18, color: col, width: 2, straight: true });
    emitParticle(second.x, second.y, col, 8, 3);
    if (frame % 18 < 3) addDamageText(second.x, second.y - second.size, config.label || 'CHAIN! ', col);
  }

  return {
    basicSecondHitFor,
    findBasicSecondTarget,
    applyBasicSecondHit,
    applyJafaarAgony,
    triggerJafaarCurseBloom,
    triggerJafaarFelMeteor,
    activePayoffZoneCount,
    felfelPoisonPayoffActive,
    applyFelfelDeadlyPoison,
    triggerFelfelToxicBloom,
    triggerFelfelVenomMeteor,
    moonkinDisplaceEnemy,
    moonkinControlBurst,
    jafaarCurseWeight,
    findJafaarDrainTarget,
  };
}

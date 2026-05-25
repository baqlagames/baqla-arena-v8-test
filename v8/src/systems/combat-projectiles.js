import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';
import { isValidPlayerOffensiveTarget } from './player-target-validity.js';

function validProjectileDamageTarget(projectile, target) {
  if (!target || target.hp <= 0) return false;
  return !projectile.isPlayer || isValidPlayerOffensiveTarget(target);
}

export function projectileColor(type) {
  if (type === 'fire') return '#ff6600';
  if (type === 'curse') return '#aa66cc';
  if (type === 'lightning') return '#ffff44';
  if (type === 'holy') return '#ffe066';
  if (type === 'holySword') return '#ff3d8b';
  if (type === 'frost' || type === 'ice') return '#88ddff';
  if (type === 'voidShard' || type === 'voidOrb' || type === 'voidBolt') return '#aa66ff';
  if (type === 'poison') return '#78d64b';
  if (type === 'bolt') return '#44ccff';
  return '#88ddff';
}

export function lobArenaBomb(bombs, from, tx, ty, dmg, radius, opts = {}) {
  bombs.push({
    x: from.x,
    y: from.y,
    fromX: from.x,
    fromY: from.y,
    tx,
    ty,
    t: 0,
    dur: opts.dur || 45,
    dmg,
    radius,
    attacker: from,
    cluster: opts.cluster || false,
    isPlayer: from.isPlayer,
    color: opts.color || '#ff6600',
    altColor: opts.altColor || null,
    toxicPotion: !!opts.toxicPotion,
    sourceLabel: opts.sourceLabel || null,
    sourceColor: opts.sourceColor || opts.color || null,
  });
}

export function fireArenaProjectile(from, to, dmg, opts = {}, {
  frame,
  lastAttackSfxFrame,
  sound,
  spawnPlayerProjectileCastVfx,
  projectiles,
  beamFx,
  emitParticle,
}) {
  let nextLastAttackSfxFrame = lastAttackSfxFrame;
  if (from.isPlayer && !opts.visualOnly && !isValidPlayerOffensiveTarget(to)) return nextLastAttackSfxFrame;
  if (from.isPlayer && !opts.visualOnly && frame - lastAttackSfxFrame >= 12) {
    nextLastAttackSfxFrame = frame;
    const projectileType = opts.projType || from.projType || 'normal';
    if (projectileType === 'fire') sound.fireball();
    else if (projectileType === 'curse') sound.shadowMagic();
    else if (projectileType === 'lightning') sound.lightning();
    else if (projectileType === 'holy') sound.holyLight();
    else if (projectileType === 'frost' || projectileType === 'ice') sound.frostBolt();
    else if (from.range > 80) sound.boltFire();
  }
  spawnPlayerProjectileCastVfx(from, to, opts);
  const isRummanShot = from && from.isPlayer && (from.unitIdx === 9 || (from.parent && from.parent.unitIdx === 9));
  if (isRummanShot && ((opts.projType || from.projType || 'normal') === 'bolt')) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const size = from.size || 14;
    const muzzleX = from.x + Math.cos(angle) * size * 0.95;
    const muzzleY = from.y + Math.sin(angle) * size * 0.95;
    const color = (from._turretArtillery || from.kind === 'turret') ? '#ffcc66' : (from.kind === 'mechTurret' || (from.mechSuit && from.mechSuit.active) ? '#ff5ca8' : '#44ccff');
    beamFx.push({ x1: from.x, y1: from.y - 3, x2: muzzleX, y2: muzzleY, life: 7, maxLife: 7, color, width: from._turretArtillery ? 5 : 3, straight: true });
    emitParticle(muzzleX, muzzleY, color, from._turretArtillery ? 7 : 4, 3);
  }
  projectiles.push({
    x: from.x,
    y: from.y,
    tx: to.x,
    ty: to.y,
    target: to,
    speed: opts.speed || 5,
    dmg,
    projType: opts.projType || from.projType || 'normal',
    attackType: opts.attackType || from.attackType || null,
    isPlayer: from.isPlayer,
    attacker: from,
    visualOnly: opts.visualOnly || false,
    color: opts.color || null,
    _arrN: opts._arrN || 0,
    _arrSz: opts._arrSz || 0,
    _arrGnd: opts._arrGnd || 0,
    aoeRadius: opts.aoeRadius || from.aoeRadius || 0,
    bombArc: opts.bombArc || from.projType === 'bomb',
    bombRadius: opts.bombRadius || from.bombRadius || 0,
    cluster: opts.cluster || false,
    poisonOnHit: from.poisonOnHit,
    poisonDmg: from.poisonDmg || 0,
    poisonDur: from.poisonDur || 0,
    livingBomb: opts.livingBomb || false,
    pierce: opts.pierce || 0,
    basicSecondHit: opts.basicSecondHit || null,
    aimed: opts.aimed || false,
    _isCrit: opts._isCrit || false,
    sourceLabel: opts.sourceLabel || null,
    sourceColor: opts.sourceColor || opts.color || null,
    arcT: 0,
    arcDur: opts.arcDur || 50,
    fromX: from.x,
    fromY: from.y,
  });
  return nextLastAttackSfxFrame;
}

export function updateArenaProjectile(projectile, {
  arenaTop,
  arenaBot,
  width,
  frame,
  randomRange,
  units,
  enemies,
  projectiles,
  beamFx,
  groundEffects,
  dealDamage,
  applyTrackedHeal,
  applyBasicSecondHit,
  addGoldShield,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (projectile.vx != null) {
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;
    projectile.life--;
    if (projectile.life <= 0 || projectile.y < arenaTop || projectile.y > arenaBot || projectile.x < 0 || projectile.x > width) return false;
    const targets = projectile.isPlayer ? enemies : units;
    if (projectile.stampedeBeast) {
      for (const target of targets) {
        if (!validProjectileDamageTarget(projectile, target) || projectile._hitTargets.includes(target)) continue;
        if (dist(projectile, target) < target.size + (projectile.size || 4)) {
          projectile._hitTargets.push(target);
          dealDamage(target, projectile.dmg, projectile.attacker, 'physical');
          if (!target.isBoss) target.stunned = Math.max(target.stunned || 0, Math.round(0.5 * GAME_TICK_HZ));
          emitParticle(target.x, target.y, projectile.color || '#ffd700', 10, 3);
        }
      }
      return true;
    }
    for (const target of targets) {
      if (!validProjectileDamageTarget(projectile, target)) continue;
      if (dist(projectile, target) < target.size + projectile.size) {
        dealDamage(target, projectile.dmg, projectile.attacker, 'normal');
        emitParticle(projectile.x, projectile.y, projectile.color || '#ffaa00', 6, 3);
        return false;
      }
    }
    if (frame % 2 === 0) emitParticle(projectile.x, projectile.y, projectile.color || '#ffaa00', 1, 2);
    return true;
  }

  if (projectile.isPlayer && !projectile.visualOnly && projectile.target && !isValidPlayerOffensiveTarget(projectile.target)) return false;

  if (projectile.target && projectile.target.hp > 0) {
    projectile.tx = projectile.target.x;
    projectile.ty = projectile.target.y;
  } else if (projectile.visualOnly && projectile.target && projectile.target.hp <= 0) {
    return false;
  }

  const dx = projectile.tx - projectile.x;
  const dy = projectile.ty - projectile.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < projectile.speed + 2) {
    if (projectile.visualOnly) {
      emitParticle(projectile.tx, projectile.ty, projectile.color || '#66ffaa', projectile._arrN || 8, projectile._arrSz || 4);
      if (projectile._arrGnd) groundEffects.push({ x: projectile.tx, y: projectile.ty, r: 0, maxR: projectile._arrGnd, life: 0.3, color: projectile.color || '#66ffaa' });
      if (projectile._aromaHeal && projectile.target && projectile.target.hp > 0) {
        const aromaHeal = applyTrackedHeal(projectile.target, projectile._aromaHeal, projectile._aromaOwner, false);
        emitParticle(projectile.target.x, projectile.target.y, '#aaffaa', 8, 3);
        emitParticle(projectile.target.x, projectile.target.y, '#ffffff', 4, 2);
        groundEffects.push({ x: projectile.target.x, y: projectile.target.y, r: 0, maxR: 18, life: 0.2, color: '#88cc66' });
        if (projectile._aromaOwner) {
          projectile._aromaOwner._healCastCount = (projectile._aromaOwner._healCastCount || 0) + 1;
          projectile._aromaOwner._lastHealTarget = projectile.target;
          projectile._aromaOwner._lastHealAmt = aromaHeal;
        }
      }
      return false;
    }

    if (projectile.target && validProjectileDamageTarget(projectile, projectile.target)) {
      const dmgType = (projectile.projType === 'curse' || projectile.projType === 'fire' || projectile.projType === 'holy' || projectile.projType === 'frost' || projectile.projType === 'chaosBolt' || projectile.projType === 'blackArrow' || projectile.projType === 'voidShard' || projectile.projType === 'voidOrb') ? 'magic' : 'normal';
      dealDamage(projectile.target, projectile.dmg, projectile.attacker, dmgType, projectile.attackType, (projectile._isCrit || projectile.sourceLabel) ? {
        isCrit: !!projectile._isCrit,
        sourceLabel: projectile.sourceLabel,
        sourceColor: projectile.sourceColor,
      } : undefined);
      if (projectile.basicSecondHit) applyBasicSecondHit(projectile.attacker, projectile.target, projectile.dmg, projectile.basicSecondHit, dmgType, projectile.attackType);
      if (projectile._isCrit) {
        addDamageText(projectile.target.x, projectile.target.y - projectile.target.size - 10, 'CRIT!', '#cc44ff', { sz: 18, bold: true, outline: '#220044' });
        emitParticle(projectile.target.x, projectile.target.y, '#cc44ff', 14, 6);
        emitParticle(projectile.target.x, projectile.target.y, '#ffffff', 8, 3);
      }
      if (projectile.blackArrow) {
        emitParticle(projectile.target.x, projectile.target.y, projectile.color || '#6633aa', projectile._baMain ? 24 : 12, projectile._baMain ? 5 : 3);
        if (projectile._baMain && projectile.target.hp > 0) {
          projectile.target._blackArrow = { dur: 6 * GAME_TICK_HZ, t: 0, interval: GAME_TICK_HZ, tickDmg: Math.round(projectile.attacker.dmg * 0.6), from: projectile.attacker, explodeDmg: Math.round(projectile.attacker.dmg * 2.0), explodeRadius: 80 };
        }
        shake(projectile._baMain ? 8 : 3);
      } else if (projectile.chaosBolt && projectile.aoeRadius) {
        const list = projectile.isPlayer ? enemies : units;
        const chaosAoeMult = projectile._cbAoeMult || 0.45;
        for (const target of list) {
          if (target !== projectile.target && validProjectileDamageTarget(projectile, target) && dist(projectile.target, target) < projectile.aoeRadius) {
            dealDamage(target, Math.round(projectile.dmg * chaosAoeMult), projectile.attacker, 'magic', 'ignoreDefense', { sourceLabel: projectile.sourceLabel || 'CHAOS', sourceColor: projectile.sourceColor || '#88ffaa' });
            emitParticle(target.x, target.y, '#88ffaa', 10, 3);
          }
        }
        emitParticle(projectile.target.x, projectile.target.y, projectile.color || '#33ff66', 32, 6);
        emitParticle(projectile.target.x, projectile.target.y, '#111111', 10, 4);
        groundEffects.push({ x: projectile.target.x, y: projectile.target.y, r: 0, maxR: projectile.aoeRadius, life: 0.4, color: '#33ff66' });
        shake(10);
        if (projectile._chaosSplitPlan && projectile._chaosSplitPlan.length && projectile.attacker && projectile.attacker.hp > 0) {
          const tier = projectile._chaosSplitPlan[0];
          const rest = projectile._chaosSplitPlan.slice(1);
          const seen = projectile._hitTargets ? [...projectile._hitTargets] : [];
          if (!seen.includes(projectile.target)) seen.push(projectile.target);
          let candidates = list.filter(target => target && validProjectileDamageTarget(projectile, target) && !seen.includes(target) && dist(projectile.target, target) <= 230);
          if (candidates.length < tier.count) candidates = list.filter(target => target && validProjectileDamageTarget(projectile, target) && !seen.includes(target));
          candidates.sort((a, b) => dist(projectile.target, a) - dist(projectile.target, b));
          const chosen = candidates.slice(0, tier.count);
          const nextHit = [...seen, ...chosen];
          for (let index = 0; index < chosen.length; index++) {
            const next = chosen[index];
            projectiles.push({
              x: projectile.target.x,
              y: projectile.target.y,
              tx: next.x,
              ty: next.y,
              target: next,
              speed: 2.35,
              dmg: Math.max(1, Math.round((projectile._chaosBaseDmg || projectile.attacker.dmg || projectile.dmg) * tier.mult)),
              projType: 'chaosBolt',
              attackType: 'ignoreDefense',
              isPlayer: projectile.isPlayer,
              attacker: projectile.attacker,
              chaosBolt: true,
              color: tier.color || '#88ffaa',
              size: tier.size || 9,
              aoeRadius: tier.aoe || 28,
              _cbAoeMult: tier.aoeMult || 0.08,
              _chaosSplitPlan: index === 0 ? rest : null,
              _chaosBaseDmg: projectile._chaosBaseDmg || projectile.attacker.dmg || projectile.dmg,
              _hitTargets: nextHit,
            });
            beamFx.push({ x1: projectile.target.x, y1: projectile.target.y, x2: next.x, y2: next.y, life: 0.16, maxLife: 0.16, color: tier.color || '#88ffaa', width: 1.8, straight: true });
          }
          if (chosen.length) addDamageText(projectile.target.x, projectile.target.y - (projectile.target.size || 18) - 10, 'SPLIT ' + chosen.length, '#88ffaa', { sz: 10, bold: true });
        }
      } else if (projectile.aoeRadius) {
        const list = projectile.isPlayer ? enemies : units;
        const level = projectile.attacker && projectile.attacker.level || 1;
        const aoeMult = projectile.attacker && projectile.attacker.aoeMult ? projectile.attacker.aoeMult : (0.30 + level * 0.05);
        for (const target of list) {
          if (target !== projectile.target && validProjectileDamageTarget(projectile, target) && dist(projectile.target, target) < projectile.aoeRadius) dealDamage(target, projectile.dmg * aoeMult, projectile.attacker, dmgType, projectile.attackType, projectile.sourceLabel ? { sourceLabel: projectile.sourceLabel, sourceColor: projectile.sourceColor } : undefined);
        }
      }
      if (projectile.poisonOnHit) {
        projectile.target.poisonTimer = projectile.poisonDur;
        projectile.target.poisonDmgVal = projectile.poisonDmg;
      }
      if (projectile.projType === 'avengersShield') {
        const isCasterish = projectile.target.range > 60 || projectile.target.arch === 'ranged' || projectile.target.arch === 'caster' || projectile.target.arch === 'support';
        if (projectile.silenceDur && !projectile.target.isBoss && isCasterish) {
          projectile.target.silenced = Math.max(projectile.target.silenced || 0, projectile.silenceDur);
        }
        if (!projectile.target.isBoss) {
          projectile.target.avengedTimer = Math.max(projectile.target.avengedTimer || 0, Math.round(3 * GAME_TICK_HZ));
          projectile.target.avengedMult = Math.min(projectile.target.avengedMult || 1, 0.92);
          emitParticle(projectile.target.x, projectile.target.y, '#ffd700', 5, 2);
        }
        if (projectile.attacker && projectile.attacker.hp > 0) {
          const cap = projectile.attacker.maxHp ? Math.round(projectile.attacker.maxHp * (projectile.shieldCapPct || 0.12)) : 0;
          addGoldShield(projectile.attacker, projectile.dmg, 8 * GAME_TICK_HZ, cap, true);
          emitParticle(projectile.attacker.x, projectile.attacker.y, '#88aaff', 6, 3);
        }
      }
      if (projectile.pierce > 0) {
        projectile.pierce--;
        const list = projectile.isPlayer ? enemies : units;
        let next = null;
        let nextDistance = Infinity;
        const lastTarget = projectile.target;
        if (!projectile._hitTargets) projectile._hitTargets = [];
        projectile._hitTargets.push(lastTarget);
        const bounceRange = projectile.projType === 'avengersShield' ? 350 : 160;
        for (const target of list) {
          if (!validProjectileDamageTarget(projectile, target) || projectile._hitTargets.includes(target)) continue;
          const candidateDistance = dist(projectile, target);
          if (candidateDistance < bounceRange && candidateDistance < nextDistance) {
            nextDistance = candidateDistance;
            next = target;
          }
        }
        if (next) {
          projectile.target = next;
          projectile.tx = next.x;
          projectile.ty = next.y;
          return true;
        }
      }
    }
    return false;
  }

  projectile.x += (dx / distance) * projectile.speed;
  projectile.y += (dy / distance) * projectile.speed;
  if (projectile.blackArrow) {
    if (frame % 2 === 0) {
      emitParticle(projectile.x + randomRange(-4, 4), projectile.y + randomRange(-4, 4), projectile.color || '#6633aa', projectile._baMain ? 2 : 1, 3);
      emitParticle(projectile.x + randomRange(-3, 3), projectile.y + randomRange(-3, 3), '#331166', 1, 2);
    }
  } else if (projectile.chaosBolt) {
    if (frame % 2 === 0) {
      emitParticle(projectile.x + randomRange(-6, 6), projectile.y + randomRange(-6, 6), projectile.color || '#33ff66', 2, 4);
      emitParticle(projectile.x + randomRange(-4, 4), projectile.y + randomRange(-4, 4), '#ccffcc', 1, 3);
    }
  } else if (projectile.projType === 'pomOrb' || projectile.projType === 'serenityOrb' || projectile.projType === 'penanceBolt' || projectile.projType === 'voidBolt' || projectile.projType === 'wogFlame') {
    if (frame % 3 === 0) emitParticle(projectile.x + randomRange(-3, 3), projectile.y + randomRange(-3, 3), projectile.color || '#66ffaa', 1, 2);
  } else if (frame % 2 === 0) {
    emitParticle(projectile.x, projectile.y, projectileColor(projectile.projType), 1, 2);
  }
  return true;
}

export function explodeArenaBomb(bomb, {
  bombs,
  units,
  enemies,
  groundEffects,
  randomRange,
  dealDamage,
  emitParticle,
  addDamageText,
  shake,
}) {
  emitParticle(bomb.x, bomb.y, bomb.color || '#ff6600', 24, 5);
  shake(8);
  if (bomb.felMeteor) {
    emitParticle(bomb.x, bomb.y, '#9b59b6', 30, 6);
    emitParticle(bomb.x, bomb.y, '#cc88ff', 18, 4);
    emitParticle(bomb.x, bomb.y, '#160420', 10, 3);
    groundEffects.push({ x: bomb.x, y: bomb.y, r: 0, maxR: (bomb.radius || 70) + 10, life: 0.50, color: '#9b59b6' });
    groundEffects.push({ x: bomb.x, y: bomb.y, r: 0, maxR: (bomb.radius || 70) * 0.50, life: 0.30, color: '#3a0a5a' });
    addDamageText(bomb.x, bomb.y - 28, 'FEL IMPACT!', '#cc88ff', { sz: 12, bold: true });
    shake(12);
  }
  if (bomb.venomMeteor) {
    emitParticle(bomb.x, bomb.y, '#55ff33', 30, 6);
    emitParticle(bomb.x, bomb.y, '#173a0a', 16, 4);
    emitParticle(bomb.x, bomb.y, '#bbff55', 10, 3);
    groundEffects.push({ x: bomb.x, y: bomb.y, r: 0, maxR: (bomb.radius || 70) + 10, life: 0.50, color: '#55ff33' });
    groundEffects.push({ x: bomb.x, y: bomb.y, r: 0, maxR: (bomb.radius || 70) * 0.50, life: 0.30, color: '#173a0a' });
    addDamageText(bomb.x, bomb.y - 28, 'VENOM IMPACT!', '#55ff33', { sz: 12, bold: true });
    shake(11);
  }
  if (bomb.toxicPotion) {
    emitParticle(bomb.x, bomb.y, '#aa55dd', 30, 6);
    emitParticle(bomb.x, bomb.y, '#55ff77', 24, 5);
    groundEffects.push({ x: bomb.x, y: bomb.y, r: 0, maxR: (bomb.radius || 60) + 28, life: 0.75, pandemicCloudFx: true, color: '#aa55dd', altColor: '#55aa33' });
    groundEffects.push({ x: bomb.x, y: bomb.y, r: 0, maxR: bomb.radius || 60, life: 0.45, toxicStackFx: true, stacks: 6, maxStacks: 6, color: '#55aa33' });
    for (let i = 0; i < 18; i++) {
      const angle = Math.PI * 2 * i / 18;
      const radius = randomRange(8, (bomb.radius || 60) * 0.8);
      emitParticle(bomb.x + Math.cos(angle) * radius, bomb.y + Math.sin(angle) * radius, i % 2 ? '#55ff77' : '#aa55dd', 2, 4);
    }
    addDamageText(bomb.x, bomb.y - 26, 'SPLASH!', '#bb66ff', { sz: 12, bold: true });
    shake(10);
  }
  const list = bomb.isPlayer ? enemies : units;
  const level = (bomb.attacker && bomb.attacker.level) || 1;
  const baseMult = 0.45 + level * 0.07;
  const dmgType = bomb.dmgType || 'normal';
  for (const target of list) {
    if (!validProjectileDamageTarget(bomb, target)) continue;
    const distance = dist(bomb, target);
    if (distance <= bomb.radius) {
      const falloff = baseMult * (1 - (distance / bomb.radius) * 0.5);
      dealDamage(target, bomb.dmg * falloff, bomb.attacker, dmgType, bomb.attackType, bomb.sourceLabel ? { sourceLabel: bomb.sourceLabel, sourceColor: bomb.sourceColor || bomb.color } : undefined);
    }
  }
  if (bomb.felMeteor && bomb.attacker && bomb.attacker.hp > 0) {
    const duration = Math.round(2.0 * GAME_TICK_HZ);
    groundEffects.push({
      x: bomb.x,
      y: bomb.y,
      r: 0,
      maxR: bomb.felPoolRadius || 62,
      life: 1,
      curseBloom: true,
      felPool: true,
      cbTimer: duration,
      cbMax: duration,
      cbTick: 0,
      cbTickEvery: Math.round(0.5 * GAME_TICK_HZ),
      cbDmg: bomb.felPoolDmg || Math.max(1, Math.round(((bomb.attacker && bomb.attacker.dmg) || 20) * 0.06)),
      cbFrom: bomb.attacker,
      color: '#9b59b6',
      altColor: '#cc88ff',
    });
  }
  if (bomb.venomMeteor && bomb.attacker && bomb.attacker.hp > 0) {
    const duration = Math.round(2.0 * GAME_TICK_HZ);
    groundEffects.push({
      x: bomb.x,
      y: bomb.y,
      r: 0,
      maxR: bomb.venomPoolRadius || 60,
      life: 1,
      curseBloom: true,
      poisonBloom: true,
      cbTimer: duration,
      cbMax: duration,
      cbTick: 0,
      cbTickEvery: Math.round(0.5 * GAME_TICK_HZ),
      cbDmg: bomb.venomPoolDmg || Math.max(1, Math.round(((bomb.attacker && bomb.attacker.dmg) || 20) * 0.05)),
      cbFrom: bomb.attacker,
      color: '#55aa33',
      altColor: '#bbff55',
    });
  }
  if (bomb.cluster) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = bomb.radius * 0.7;
      lobArenaBomb(bombs, { x: bomb.x, y: bomb.y, isPlayer: bomb.isPlayer }, bomb.x + Math.cos(angle) * radius, bomb.y + Math.sin(angle) * radius, bomb.dmg * 0.6, bomb.radius * 0.6, { dur: 25, color: '#ff8800' });
    }
  }
}

export function updateArenaBomb(bomb, context) {
  bomb.t++;
  const progress = bomb.t / bomb.dur;
  bomb.x = bomb.fromX + (bomb.tx - bomb.fromX) * Math.max(0, progress);
  bomb.y = bomb.meteor
    ? (bomb.fromY + (bomb.ty - bomb.fromY) * Math.max(0, progress))
    : (bomb.fromY + (bomb.ty - bomb.fromY) * progress - Math.sin(progress * Math.PI) * 60);
  if (bomb.t >= bomb.dur) {
    explodeArenaBomb(bomb, context);
    return false;
  }
  return true;
}

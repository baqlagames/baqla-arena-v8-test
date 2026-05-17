import { dist } from '../core/math.js';

export function applyGenericOnHitProcs(unit, target, {
  frame,
  damage,
  isAimed,
  enemies,
  beamFx,
  groundEffects,
  dealDamage,
  clampToArena,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (target.hp > 0) {
    if (unit.bash && Math.random() < unit.bash.chance && !target.isBoss) {
      target.stunned = Math.max(target.stunned || 0, unit.bash.dur);
      emitParticle(target.x, target.y - 10, '#ffd54a', 16, 4);
      addDamageText(target.x, target.y - target.size, 'STUN!', '#ffd54a');
    }

    if (unit.bleed) {
      target.bleedTimer = unit.bleed.dur;
      target.bleedDmg = unit.bleed.dmg;
      target.bleedFrom = unit;
      emitParticle(target.x, target.y, '#aa2222', 6, 3);
    }

    if (unit.curse) {
      target.cursedTimer = unit.curse.dur;
      target.cursedMult = unit.curse.mult;
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const pct = i / steps;
        const swirl = Math.sin(pct * Math.PI * 2 + frame * 0.4) * 8 * (1 - pct);
        const bx = unit.x + (target.x - unit.x) * pct;
        const by = (unit.y - unit.size * 0.3) + (target.y - (unit.y - unit.size * 0.3)) * pct;
        const angle = Math.atan2(target.y - unit.y, target.x - unit.x) + Math.PI / 2;
        emitParticle(bx + Math.cos(angle) * swirl, by + Math.sin(angle) * swirl, i % 2 ? '#9b59b6' : '#3a0a3a', 1, 3);
      }
      emitParticle(target.x, target.y - 10, '#9b59b6', 16, 5);
      emitParticle(target.x, target.y - 10, '#3a0a3a', 8, 4);
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 24, life: 0.3, color: '#5a1a5a' });
      if (!target.cursedAnnounced) {
        addDamageText(target.x, target.y - target.size, 'CURSED', '#cc99ff');
        target.cursedAnnounced = true;
      }
    } else if (target.cursedTimer <= 0) {
      target.cursedAnnounced = false;
    }

    if (unit.knockback && !target.isBoss) {
      const dx = target.x - unit.x;
      const dy = target.y - unit.y;
      const distance = Math.hypot(dx, dy) || 1;
      target.x += (dx / distance) * unit.knockback;
      target.y += (dy / distance) * unit.knockback;
      clampToArena(target);
      emitParticle(target.x, target.y, '#cccccc', 12, 3);
      addDamageText(target.x, target.y - target.size, 'KNOCK', '#cccccc');
    }

    if (isAimed && !target.isBoss && unit.aimedShot) {
      target.stunned = Math.max(target.stunned || 0, unit.aimedShot.dazeDur || 60);
      addDamageText(target.x, target.y - target.size - 14, 'DAZE!', '#ffd700');
      emitParticle(target.x, target.y - 10, '#ffd700', 12, 4);
    }

    if (unit.bomb && (unit.bomb.active || 0) < unit.bomb.max && !target.bomb) {
      target.bomb = { timer: unit.bomb.timer, radius: unit.bomb.radius, dmg: Math.round(unit.dmg * unit.bomb.mult), source: unit };
      unit.bomb.active = (unit.bomb.active || 0) + 1;
      emitParticle(target.x, target.y - 10, '#ff4444', 14, 5);
      emitParticle(target.x, target.y, '#ffaa00', 6, 3);
      beamFx.push({ x1: unit.x, y1: unit.y, x2: target.x, y2: target.y, life: 0.15, maxLife: 0.15, color: '#ff4444', width: 2, straight: true });
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 16, life: 0.2, color: '#ff4444' });
      addDamageText(target.x, target.y - target.size, 'BOMB!', '#ff4444');
    }

    if (unit.toxicBrew) {
      target.toxicBrewStacks = Math.min(unit.toxicBrew.maxStacks, (target.toxicBrewStacks || 0) + 1);
      target.toxicBrewTimer = unit.toxicBrew.dur;
      target.toxicBrewDmg = Math.round(unit.dmg * unit.toxicBrew.dmgPct);
      target.toxicBrewSource = unit;
      const stacks = target.toxicBrewStacks;
      const color = stacks >= unit.toxicBrew.maxStacks ? '#55ff77' : (stacks >= 3 ? '#55aa33' : '#9a55cc');
      for (let i = 0; i < Math.min(stacks, 6); i++) {
        const angle = Math.PI * 2 * i / Math.min(stacks, 6) + frame * 0.1;
        emitParticle(target.x + Math.cos(angle) * (8 + stacks), target.y + Math.sin(angle) * (6 + stacks * 0.6), i % 2 ? '#55ff77' : color, 2, 3);
      }
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 18 + stacks * 6, life: 0.26, toxicStackFx: true, stacks, maxStacks: unit.toxicBrew.maxStacks, color });
      if (stacks === 1) addDamageText(target.x, target.y - target.size, 'BREWED!', color);
      if (stacks >= unit.toxicBrew.maxStacks) {
        emitParticle(target.x, target.y, color, 10, 4);
        addDamageText(target.x, target.y - target.size - 10, 'PRIMED!', '#55ff77', { sz: 11, bold: true });
      }
    }

    if (unit.soothingAroma || unit.essenceInfusion || unit.essenceBond || unit.volatileMixture) {
      unit._hitCount = (unit._hitCount || 0) + 1;
    }
  }

  if (unit.overclock && unit.overclock.active <= 0) {
    unit.overclock.counter++;
    if (unit.overclock.counter >= unit.overclock.every) {
      unit.overclock.counter = 0;
      unit._ocOrigAtkSpd = unit.atkSpd;
      unit.atkSpd = Math.round(unit.atkSpd / unit.overclock.spdMult);
      unit.overclock.active = unit.overclock.dur;
      emitParticle(unit.x, unit.y, '#44ccff', 20, 5);
      emitParticle(unit.x, unit.y, '#ffffff', 8, 3);
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI * 2 * i / 6;
        emitParticle(unit.x + Math.cos(angle) * 14, unit.y + Math.sin(angle) * 14, '#44ccff', 2, 3);
      }
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 24, life: 0.3, color: '#44ccff' });
      addDamageText(unit.x, unit.y - unit.size, 'OVERCLOCK!', '#44ccff');
    }
  }

  if (unit.rocketPunch) {
    unit.rocketPunch.counter++;
    if (unit.rocketPunch.counter >= unit.rocketPunch.every) {
      unit.rocketPunch.counter = 0;
      const punchDamage = Math.round(unit.dmg * unit.rocketPunch.dmgMult);
      dealDamage(target, punchDamage, unit, 'physical');
      if (!target.isBoss && target.hp > 0) {
        target.x += unit.rocketPunch.knockback * (unit.facing || 1);
        addDamageText(target.x, target.y - target.size, 'KNOCKBACK!', '#ff8844');
      }
      for (const enemy of enemies) {
        if (enemy !== target && enemy.hp > 0 && dist(target, enemy) <= unit.rocketPunch.aoeRadius) {
          dealDamage(enemy, Math.round(punchDamage * 0.60), unit, 'physical');
          emitParticle(enemy.x, enemy.y, '#ff8844', 8, 4);
        }
      }
      beamFx.push({ x1: unit.x, y1: unit.y, x2: target.x, y2: target.y, life: 0.3, maxLife: 0.3, color: '#ff8844', width: 6, straight: true });
      beamFx.push({ x1: unit.x, y1: unit.y, x2: target.x, y2: target.y, life: 0.2, maxLife: 0.2, color: '#ffffff', width: 3, straight: true });
      emitParticle(target.x, target.y, '#ff8844', 24, 6);
      emitParticle(target.x, target.y, '#ffffff', 10, 3);
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: unit.rocketPunch.aoeRadius, life: 0.4, color: '#ff8844' });
      addDamageText(unit.x, unit.y - unit.size, 'ROCKET PUNCH!', '#ff8844');
      shake(6);
    }
  }

  if (unit.kind === 'turret' && unit._turretArtillery && unit._turretAoe > 0) {
    for (const enemy of enemies) {
      if (enemy !== target && enemy.hp > 0 && dist(target, enemy) <= unit._turretAoe) {
        dealDamage(enemy, Math.round(damage * 0.35), unit, 'physical');
        emitParticle(enemy.x, enemy.y, '#ff8844', 4, 2);
      }
    }
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: unit._turretAoe, life: 0.3, color: '#ff8844' });
  }

  if (unit._overdriveAoe > 0 && unit._overdriveTimer > 0) {
    for (const enemy of enemies) {
      if (enemy !== target && enemy.hp > 0 && dist(target, enemy) <= unit._overdriveAoe) {
        dealDamage(enemy, Math.round(damage * 0.4), unit, 'physical');
        emitParticle(enemy.x, enemy.y, '#ff4400', 4, 2);
      }
    }
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: unit._overdriveAoe, life: 0.2, color: '#ff4400' });
  }
}

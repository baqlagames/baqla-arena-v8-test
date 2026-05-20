import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function applyNaanaFoulFelfelOnHitProcs(unit, target, {
  frame,
  ohTier,
  damage,
  units = [],
  enemies,
  beamFx,
  groundEffects,
  randomRange,
  dealDamage,
  applyHealingReceived = (_target, amount) => amount,
  addHealFx = () => {},
  applyFelfelDeadlyPoison,
  showFlash,
  emitParticle,
  addDamageText,
  shake,
}) {
  const u = unit;
  const t = target;
  const _ohTier = ohTier;
  const dmg = damage;
  const rnd = randomRange;
  const groundFx = groundEffects;
  const addP = emitParticle;
  const addDmg = addDamageText;

  if (u.unitIdx === 10 && !u.branch && u.holyFlashHeal && t.hp > 0) {
    u.holyFlashHeal.counter = (u.holyFlashHeal.counter || 0) + 1;
    if (u.holyFlashHeal.counter >= u.holyFlashHeal.every) {
      u.holyFlashHeal.counter = 0;
      const ally = units
        .filter(candidate => candidate && candidate.isPlayer && candidate.hp > 0 && !candidate.isGhost && candidate.hp < candidate.maxHp)
        .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
      if (ally) {
        const raw = Math.round(ally.maxHp * (u.holyFlashHeal.healPct || 0.08));
        const heal = Math.min(ally.maxHp - ally.hp, applyHealingReceived(ally, raw));
        if (heal > 0) {
          ally.hp += heal;
          addHealFx(ally.x, ally.y, heal, false, u, ally);
          addP(ally.x, ally.y - ally.size * 0.2, '#ffffff', 6, 2);
          addP(ally.x, ally.y, '#fff5b0', 6, 2);
          if (ally !== u) beamFx.push({ x1: u.x, y1: u.y, x2: ally.x, y2: ally.y, life: 0.16, maxLife: 0.16, color: '#fff5b0aa', width: 2, straight: true });
        }
      }
    }
  }

  if (u.unitIdx === 10 && !u.branch && u.holySanctify && _ohTier === 5 && t.hp > 0) {
    const targets = units
      .filter(ally => ally && ally.isPlayer && ally.hp > 0 && !ally.isGhost && ally.hp < ally.maxHp)
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))
      .slice(0, u.holySanctify.count || 4);
    let healed = 0;
    for (const ally of targets) {
      const heal = applyHealingReceived(ally, Math.round(ally.maxHp * (u.holySanctify.healPct || 0.07)));
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      addHealFx(ally.x, ally.y, heal, true);
      addP(ally.x, ally.y, '#fff5b0', 8, 3);
      if (ally !== u) beamFx.push({ x1: u.x, y1: u.y, x2: ally.x, y2: ally.y, life: 0.20, maxLife: 0.20, color: '#fff5b0aa', width: 2, straight: true });
      healed++;
    }
    if (healed) {
      groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.holySanctify.radius || 150, life: 0.45, color: '#fff5b0', flatten: true });
      addP(u.x, u.y, '#ffffff', 12, 4);
      addDmg(u.x, u.y - u.size - 6, 'SANCTIFY!', '#fff5b0', { sz: 13, bold: true });
      shake(3);
    }
  }

  if (u.holyStrike) {
    u.holyStrike.counter++;
    if (u.holyStrike.counter >= u.holyStrike.every) {
      u.holyStrike.counter = 0;
      const bonus = t.isBoss ? u.holyStrike.bossMult : 1.0;
      if (bonus > 1.0) dealDamage(t, Math.round(dmg * (bonus - 1)), u, 'magic');
      if (u.holyStrike.purge) {
        if (t._auraSrc) {
          t.atkSpd = t._auraOrigAtkSpd || t.atkSpd;
          t._auraSrc = null;
          t._auraMult = null;
          t._auraOrigAtkSpd = null;
        }
        if (t.frenzyActive) {
          t.frenzyActive = false;
          t.atkSpd = t._origAtkSpd || t.atkSpd;
        }
      }
      beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.4, maxLife: 0.4, color: '#fff5b0', width: 4, straight: true });
      beamFx.push({ x1: t.x, y1: t.y - 20, x2: t.x, y2: t.y + 20, life: 0.5, maxLife: 0.5, color: '#ffe066', width: 3, straight: true });
      beamFx.push({ x1: t.x - 16, y1: t.y, x2: t.x + 16, y2: t.y, life: 0.5, maxLife: 0.5, color: '#ffe066', width: 3, straight: true });
      addP(t.x, t.y, '#fff5b0', 18, 5);
      addP(t.x, t.y, '#ffffff', 8, 3);
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 28, life: 0.35, color: '#fff5b0' });
      addDmg(t.x, t.y - t.size, 'HOLY!', '#fff5b0');
      shake(2);
    }
  }

  if (u.plagueCloud) {
    let spread = 0;
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      if (dist(t, enemy) > u.plagueCloud.radius) continue;
      enemy.cursedTimer = u.plagueCloud.dur;
      enemy.cursedMult = u.plagueCloud.mult;
      spread++;
    }
    if (spread > 0) {
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: u.plagueCloud.radius, life: 0.35, color: '#9a5e2a' });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: u.plagueCloud.radius * 0.5, life: 0.25, color: '#7a8e3a' });
      for (let i = 0; i < 8; i++) {
        const angle = Math.PI * 2 * i / 8;
        addP(t.x + Math.cos(angle) * u.plagueCloud.radius * 0.6, t.y + Math.sin(angle) * u.plagueCloud.radius * 0.6, '#7a8e3a', 2, 3);
      }
      addP(t.x, t.y, '#9a5e2a', 10, 4);
      if (spread >= 3) addDmg(t.x, t.y - t.size, 'PLAGUE!', '#7a8e3a');
    }
  }

  if (u.burnDot && t.hp > 0) {
    if (!t.burnStacks) t.burnStacks = 0;
    if (t.burnStacks < u.burnDot.maxStacks) t.burnStacks++;
    t.burnTimer = u.burnDot.dur;
    t.burnDmg = u.burnDot.dmg;
    t.burnFrom = u;
    if (t.burnStacks === 1) {
      addDmg(t.x, t.y - t.size, 'BURN!', '#ff7700');
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 16, life: 0.2, color: '#ff7700' });
    }
    addP(t.x + rnd(-4, 4), t.y + rnd(-4, 4), '#ff7700', 3, 2);
    if (t.burnStacks >= 3) addP(t.x + rnd(-6, 6), t.y - t.size * 0.3, '#ffaa00', 2, 2);
  }

  if (u.deadlyPoison && t.hp > 0 && !u.projType) {
    applyFelfelDeadlyPoison(u, t, 1, false, true);
  }

  if (u.sliceAndDice && t.hp > 0) {
    u.sliceAndDice.counter++;
    if (u.sliceAndDice.counter >= u.sliceAndDice.every) {
      u.sliceAndDice.counter = 0;
      u.sliceAndDice.timer = u.sliceAndDice.dur;
      addDmg(u.x, u.y - u.size, 'SLICE & DICE!', '#ffcc00');
      addP(u.x, u.y, '#ffcc00', 16, 5);
      addP(u.x, u.y, '#ffffff', 6, 2);
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI * 2 * i / 6;
        addP(u.x + Math.cos(angle) * 14, u.y + Math.sin(angle) * 14, '#ffcc00', 2, 3);
      }
      groundFx.push({ x: u.x, y: u.y, r: 0, maxR: 22, life: 0.25, color: '#ffcc00' });
    }
  }

  if (u.eviscerate && t.hp > 0) {
    u.eviscerate.counter++;
    if (u.eviscerate.counter >= u.eviscerate.every) {
      u.eviscerate.counter = 0;
      const evisDamage = Math.round(u.dmg * u.eviscerate.mult);
      dealDamage(t, evisDamage, u, 'normal');
      addDmg(t.x, t.y - t.size, 'EVISCERATE!', '#ff2266');
      addP(t.x, t.y, '#ff2266', 20, 6);
      addP(t.x, t.y, '#ffffff', 8, 3);
      beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.15, maxLife: 0.15, color: '#ff2266', width: 3, straight: true });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 25, life: 0.3, color: '#ff2266' });
      for (let i = 0; i < 4; i++) {
        const angle = Math.PI * 2 * i / 4 + Math.PI / 4;
        beamFx.push({ x1: t.x, y1: t.y, x2: t.x + Math.cos(angle) * 20, y2: t.y + Math.sin(angle) * 20, life: 0.25, maxLife: 0.25, color: '#ff4488', width: 2, straight: true });
      }
      shake(4);
    }
  }

  if (u.bladeFlurry && t.hp > 0) {
    let flurryTarget = null;
    let flurryDistance = Infinity;
    for (const enemy of enemies) {
      if (enemy === t || enemy.hp <= 0) continue;
      const enemyDistance = dist(u, enemy);
      if (enemyDistance < 80 && enemyDistance < flurryDistance) {
        flurryDistance = enemyDistance;
        flurryTarget = enemy;
      }
    }
    if (flurryTarget) {
      dealDamage(flurryTarget, Math.round(dmg * u.bladeFlurry.mult), u, 'normal');
      beamFx.push({ x1: u.x, y1: u.y, x2: flurryTarget.x, y2: flurryTarget.y, color: '#88ffaa', width: 2, life: 0.12, maxLife: 0.12, straight: true });
      addP(flurryTarget.x, flurryTarget.y, '#88ffaa', 8, 3);
      addP(flurryTarget.x + rnd(-6, 6), flurryTarget.y + rnd(-6, 6), '#44aa66', 4, 2);
      if (frame % 20 < 2) addDmg(flurryTarget.x, flurryTarget.y - flurryTarget.size, 'FLURRY!', '#88ffaa');
    }
  }

  if (u._shadowBladesActive && u._shadowBladesActive.hits > 0 && t.hp > 0) {
    const shadowDamage = Math.round(u.dmg * 1.0);
    dealDamage(t, shadowDamage, u, 'normal');
    u._shadowBladesActive.hits--;
    addP(t.x + rnd(-6, 6), t.y + rnd(-6, 6), '#aa44ff', 8, 3);
    addDmg(t.x + rnd(-10, 10), t.y - t.size - rnd(0, 8), '-' + shadowDamage, '#aa44ff');
    if (u._shadowBladesActive.hits <= 0) u._shadowBladesActive = null;
  }

  if (u._cheapShot && _ohTier === 3 && t.hp > 0) {
    const cheapShotDamage = Math.round(u.dmg * 0.50);
    dealDamage(t, cheapShotDamage, u, 'normal');
    t.stunned = Math.max(t.stunned || 0, t.isBoss ? 15 : Math.round(0.5 * GAME_TICK_HZ));
    addDmg(t.x, t.y - t.size - 6, '-' + cheapShotDamage, '#ffcc00');
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI * 2 * i / 5 + frame * 0.1;
      addP(t.x + Math.cos(angle) * 12, t.y - t.size - 8 + Math.sin(angle) * 5, '#ffcc00', 1.5, 2);
    }
    addP(t.x, t.y, '#ffffff', 10, 3);
    if (frame % 20 < 4) addDmg(t.x + rnd(-8, 8), t.y - t.size - 14, 'CHEAP SHOT!', '#ffcc00');
  }

  if (u._mutilate && _ohTier === 3 && t.hp > 0) {
    const mutilateDamage = Math.round(u.dmg * 0.45);
    dealDamage(t, mutilateDamage, u, 'normal');
    dealDamage(t, mutilateDamage, u, 'normal');
    t.bleedTimer = Math.max(t.bleedTimer || 0, 3 * GAME_TICK_HZ);
    t.bleedDmg = Math.round(u.dmg * 0.15);
    t.bleedFrom = u;
    addDmg(t.x - 6, t.y - t.size - 4, '-' + mutilateDamage, '#55ff55');
    addDmg(t.x + 6, t.y - t.size - 10, '-' + mutilateDamage, '#55ff55');
    beamFx.push({ x1: t.x - 12, y1: t.y - 12, x2: t.x + 12, y2: t.y + 12, life: 8, maxLife: 8, color: '#55ff55', width: 2, straight: true });
    beamFx.push({ x1: t.x + 12, y1: t.y - 12, x2: t.x - 12, y2: t.y + 12, life: 8, maxLife: 8, color: '#55ff55', width: 2, straight: true });
    addP(t.x, t.y, '#55ff55', 12, 4);
    addP(t.x, t.y, '#2a3a1a', 8, 3);
    if (frame % 20 < 4) addDmg(t.x, t.y - t.size - 18, 'MUTILATE!', '#55ff55');
  }

  if (u._markedForDeath && _ohTier === 10 && t.hp > 0) {
    const markColor = u.branch === 'b' ? '#55ff33' : '#ff2266';
    const markAlt = u.branch === 'b' ? '#173a0a' : '#aa0033';
    t._deathMark = { timer: 5 * GAME_TICK_HZ, from: u, color: markColor, altColor: markAlt };
    addDmg(t.x, t.y - t.size - 12, 'MARKED!', markColor);
    addP(t.x, t.y, markColor, 16, 4);
    addP(t.x, t.y, markAlt, 10, 3);
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 2 * i / 8;
      addP(t.x + Math.cos(angle) * 18, t.y + Math.sin(angle) * 18, markColor, 1, 3);
    }
    showFlash('MARKED FOR DEATH', markColor, 25);
  }

  if (u._shadowBlades && _ohTier === 10 && t.hp > 0) {
    u._shadowBladesActive = { hits: 4, dmgMult: 2.0 };
    addDmg(u.x, u.y - u.size - 8, 'SHADOW BLADES!', '#aa44ff');
    showFlash('SHADOW BLADES', '#aa44ff', 30);
    addP(u.x, u.y, '#aa44ff', 20, 5);
    addP(u.x, u.y, '#3a1a3a', 14, 4);
    for (let i = 0; i < 12; i++) {
      const angle = Math.PI * 2 * i / 12;
      addP(u.x + Math.cos(angle) * 20, u.y + Math.sin(angle) * 20, '#aa44ff', 2, 4);
    }
    shake(4);
  }
}

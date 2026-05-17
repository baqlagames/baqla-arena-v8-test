import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function applyAlibabaOnHitProcs(unit, target, {
  frame,
  ohTier,
  damage,
  enemies,
  beamFx,
  groundEffects,
  randomRange,
  dealDamage,
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

  if (u.frostBolt) {
    u.frostBolt.counter++;
    if (u.frostBolt.counter >= u.frostBolt.every && !t.isBoss) {
      u.frostBolt.counter = 0;
      t.stunned = Math.max(t.stunned || 0, u.frostBolt.freezeDur);
      t.slowTimer = u.frostBolt.freezeDur;
      t.slowMult = 0.4;
      addP(t.x, t.y, '#88ddff', 24, 4);
      addDmg(t.x, t.y - t.size, 'FREEZE!', '#88ddff');
    }
  }

  if (u.hotStreak && _ohTier === 5) {
    t._livingBomb = true;
    t._livingBombTimer = Math.round(1.0 * GAME_TICK_HZ);
    t._livingBombDmg = Math.round(u.dmg * 1.0);
    t._livingBombRadius = 45;
    t._livingBombFrom = u;
    addP(t.x, t.y, '#ff6600', 18, 5);
    addP(t.x, t.y, '#ffaa00', 14, 4);
    addP(t.x, t.y, '#ff2200', 10, 3);
    for (let i = 0; i < 10; i++) addP(t.x + rnd(-14, 14), t.y + rnd(-14, 14), '#ff4400', 1.5, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: t.size * 1.8, life: 0.4, color: '#ff6600' });
    beamFx.push({ x1: u.x, y1: u.y - u.size * 0.3, x2: t.x, y2: t.y, life: 10, maxLife: 10, color: '#ff4400', width: 3, straight: true });
    addDmg(t.x, t.y - t.size - 6, 'LIVING BOMB!', '#ff6600');
    shake(3);
  }

  if (u.ignite && t.hp > 0) {
    if (!t._igniteStacks) t._igniteStacks = [];
    const igniteDamage = Math.round(dmg * u.ignite.pct);
    if (t._igniteStacks.length < u.ignite.maxStacks) {
      t._igniteStacks.push({ dmg: igniteDamage, dur: u.ignite.dur, from: u });
    } else {
      let weakest = 0;
      for (let i = 1; i < t._igniteStacks.length; i++) {
        if (t._igniteStacks[i].dmg < t._igniteStacks[weakest].dmg) weakest = i;
      }
      if (igniteDamage > t._igniteStacks[weakest].dmg) t._igniteStacks[weakest] = { dmg: igniteDamage, dur: u.ignite.dur, from: u };
    }
    if (frame % 8 < 2) {
      const igniteAngle = frame * 0.08;
      for (let i = 0; i < 2; i++) {
        const angle = igniteAngle + i * Math.PI;
        addP(t.x + Math.cos(angle) * t.size * 0.6, t.y + Math.sin(angle) * t.size * 0.4 + t.size * 0.2, i % 2 ? '#ff4400' : '#ff8800', 2, 3);
      }
      addP(t.x + rnd(-4, 4), t.y - t.size * 0.3, '#ffcc00', 1, 2);
    }
  }

  if (u.pyromaniac && t._igniteStacks && t._igniteStacks.length > 0) {
    const bonusDamage = Math.round(dmg * (u.pyromaniac.mult - 1));
    dealDamage(t, bonusDamage, u, 'magic');
  }

  if (u.firestarter && t.hp <= 0) {
    const explosionDamage = Math.round(u.dmg * u.firestarter.mult);
    for (const enemy of enemies) {
      if (enemy !== t && enemy.hp > 0 && dist(t, enemy) <= u.firestarter.radius) {
        dealDamage(enemy, explosionDamage, u, 'magic');
        addP(enemy.x, enemy.y, '#ff4400', 8, 3);
      }
    }
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: u.firestarter.radius, life: 0.5, color: '#ff4400' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: u.firestarter.radius * 0.6, life: 0.35, color: '#ffaa00' });
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 2 * i / 8;
      beamFx.push({ x1: t.x, y1: t.y, x2: t.x + Math.cos(angle) * u.firestarter.radius, y2: t.y + Math.sin(angle) * u.firestarter.radius, life: 0.4, maxLife: 0.4, color: '#ff6600', width: 3, straight: true });
    }
    addP(t.x, t.y, '#ff4400', 24, 6);
    addP(t.x, t.y, '#ffcc00', 14, 4);
    addP(t.x, t.y, '#ffffff', 6, 3);
    addDmg(t.x, t.y - 10, 'FIRESTARTER!', '#ff6600');
    showFlash('FIRESTARTER!', '#ff6600', 20);
    shake(5);
  }

  if (u.frostboltPassive && t.hp > 0) {
    t.slowTimer = Math.max(t.slowTimer || 0, u.frostboltPassive.dur);
    t.slowMult = Math.min(t.slowMult || 1, u.frostboltPassive.slowMult);
    if (frame % 10 < 2) {
      addP(t.x + rnd(-6, 6), t.y + rnd(-6, 6), '#88ddff', 3, 3);
      addP(t.x + rnd(-4, 4), t.y - t.size * 0.3, '#ccffff', 1, 2);
      if (frame % 20 < 2) groundFx.push({ x: t.x, y: t.y, r: 0, maxR: t.size * 1.2, life: 0.15, color: '#88ddff' });
    }
  }

  if (u.shatter && t.hp > 0 && (t.slowTimer > 0 || t.stunned > 0 || t.stunTimer > 0)) {
    const bonusDamage = Math.round(dmg * (u.shatter.mult - 1));
    dealDamage(t, bonusDamage, u, 'magic');
    addP(t.x, t.y, '#aaeeff', 8, 4);
    addP(t.x + rnd(-6, 6), t.y + rnd(-6, 6), '#ffffff', 4, 2);
    for (let i = 0; i < 4; i++) {
      const angle = Math.PI * 2 * i / 4 + frame * 0.1;
      beamFx.push({ x1: t.x, y1: t.y, x2: t.x + Math.cos(angle) * 18, y2: t.y + Math.sin(angle) * 18, life: 0.2, maxLife: 0.2, color: '#aaeeff', width: 2, straight: true });
    }
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 22, life: 0.2, color: '#88ddff' });
  }

  if (u.overload && t.hp > 0 && Math.random() < u.overload.chance) {
    const chainDamage = Math.round(dmg * u.overload.chainMult);
    let chained = 0;
    for (const enemy of enemies) {
      if (enemy !== t && enemy.hp > 0 && dist(t, enemy) < 100 && chained < u.overload.chainCount) {
        dealDamage(enemy, chainDamage, u, 'magic');
        chained++;
        groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 0, life: 0.25, lightningBolt: true, lbX2: enemy.x, lbY2: enemy.y, color: '#aa88ff' });
        addP(enemy.x, enemy.y, '#ccaaff', 10, 4);
        addP(enemy.x, enemy.y, '#ffffff', 4, 2);
        groundFx.push({ x: enemy.x, y: enemy.y, r: 0, maxR: 18, life: 0.2, color: '#aa88ff' });
      }
    }
    if (chained > 0) {
      addDmg(t.x, t.y - t.size - 4, 'OVERLOAD!', '#aa88ff');
      addP(t.x, t.y, '#aa88ff', 12, 4);
      shake(2);
    }
  }

  if (u.stormkeeper && t.hp > 0) {
    u.stormkeeper.counter++;
    if (u.stormkeeper.counter >= u.stormkeeper.every) {
      u.stormkeeper.counter = 0;
      const bonusDamage = Math.round(dmg * (u.stormkeeper.mult - 1));
      dealDamage(t, bonusDamage, u, 'magic');
      if (!t.isBoss) {
        t.stunned = Math.max(t.stunned || 0, u.stormkeeper.stunDur);
        addDmg(t.x, t.y - t.size - 10, 'STUN', '#ffee66', { sz: 11, bold: true });
      }
      addP(t.x, t.y, '#ffee66', 18, 5);
      addP(t.x, t.y, '#aa88ff', 12, 4);
      addP(t.x, t.y, '#ffffff', 6, 3);
      beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.5, maxLife: 0.5, color: '#ffee66', width: 5, straight: false });
      beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.3, maxLife: 0.3, color: '#ffffff', width: 2, straight: false });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 30, life: 0.35, color: '#ffee66' });
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI * 2 * i / 6;
        beamFx.push({ x1: t.x, y1: t.y, x2: t.x + Math.cos(angle) * 28, y2: t.y + Math.sin(angle) * 28, life: 0.4, maxLife: 0.4, color: '#aa88ff', width: 2, straight: false });
      }
      addDmg(t.x, t.y - t.size - 6, 'STORMKEEPER!', '#ffee66');
      shake(4);
    }
  }

  if (u._combustionTimer > 0 && t._igniteStacks && t._igniteStacks.length > 0) {
    for (const enemy of enemies) {
      if (enemy !== t && enemy.hp > 0 && dist(t, enemy) <= 80) {
        if (!enemy._igniteStacks) enemy._igniteStacks = [];
        for (const ignite of t._igniteStacks) {
          if (enemy._igniteStacks.length < 3) enemy._igniteStacks.push({ dmg: ignite.dmg, dur: ignite.dur, from: ignite.from });
        }
        addP(enemy.x, enemy.y, '#ff4400', 4, 2);
      }
    }
  }

  if (u._scorch && _ohTier === 3 && t.hp > 0) {
    const scorchDamage = Math.round(u.dmg * 0.80);
    dealDamage(t, scorchDamage, u, 'magic');
    addP(t.x, t.y, '#ff4400', 18, 5);
    addP(t.x, t.y, '#ffaa00', 12, 4);
    addP(t.x, t.y, '#ffcc00', 8, 3);
    for (let i = 0; i < 8; i++) addP(t.x + rnd(-12, 12), t.y + rnd(-12, 12), '#ff6600', 2, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 30, life: 0.3, color: '#ff4400' });
    beamFx.push({ x1: u.x, y1: u.y - u.size * 0.3, x2: t.x, y2: t.y, life: 6, maxLife: 6, color: '#ff6600', width: 3, straight: true });
    addDmg(t.x, t.y - t.size - 6, 'SCORCH!', '#ff6600');
    shake(2);
  }

  if (u._combustionProc && _ohTier === 10 && t.hp > 0) {
    u._combustionTimer = 5 * GAME_TICK_HZ;
    if (u.crit && u._combustOrigCrit == null) {
      u._combustOrigCrit = u.crit.chance;
      u.crit.chance = Math.min(1, u.crit.chance * 2);
    }
    addP(u.x, u.y, '#ff4400', 30, 6);
    addP(u.x, u.y, '#ffcc00', 22, 5);
    addP(u.x, u.y, '#ffffff', 10, 3);
    for (let i = 0; i < 16; i++) {
      const angle = Math.PI * 2 * i / 16;
      addP(u.x + Math.cos(angle) * u.size * 1.5, u.y + Math.sin(angle) * u.size * 1.5, '#ff6600', 2, 4);
    }
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 2.5, life: 0.6, color: '#ff4400' });
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 1.5, life: 0.4, color: '#ffcc00' });
    addDmg(u.x, u.y - u.size - 10, 'COMBUSTION!', '#ff4400');
    showFlash('COMBUSTION!', '#ff4400', 30);
    shake(8);
  }

  if (u._iceLance && _ohTier === 3 && t.hp > 0) {
    const isSlowed = t.slowTimer > 0 || t.stunned > 0 || t.stunTimer > 0;
    const iceMult = isSlowed ? 1.20 : 0.70;
    const iceDamage = Math.round(u.dmg * iceMult);
    dealDamage(t, iceDamage, u, 'magic');
    addP(t.x, t.y, '#88ddff', 16, 5);
    addP(t.x, t.y, '#ffffff', 12, 4);
    addP(t.x, t.y, '#aaeeff', 8, 3);
    for (let i = 0; i < 6; i++) addP(t.x + rnd(-10, 10), t.y + rnd(-10, 10), '#ccffff', 2, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 25, life: 0.3, color: '#88ddff' });
    beamFx.push({ x1: u.x, y1: u.y - u.size * 0.3, x2: t.x, y2: t.y, life: 10, maxLife: 10, color: '#66ccff', width: 4, straight: true });
    addDmg(t.x, t.y - t.size - 6, isSlowed ? 'ICE LANCE!!' : 'ICE LANCE!', '#66ccff');
    if (isSlowed) shake(3);
  }

  if (u._flurry && _ohTier === 5 && t.hp > 0) {
    const flurryDamage = Math.round(u.dmg * 0.25);
    for (let i = 0; i < 3; i++) {
      if (t.hp > 0) {
        dealDamage(t, flurryDamage, u, 'magic');
        t.slowTimer = Math.max(t.slowTimer || 0, Math.round(1.5 * GAME_TICK_HZ));
        t.slowMult = Math.min(t.slowMult || 1, 0.55);
      }
      addP(t.x + rnd(-14, 14), t.y + rnd(-14, 14), '#88ddff', 10, 4);
      addP(t.x + rnd(-8, 8), t.y + rnd(-8, 8), '#ffffff', 5, 3);
      beamFx.push({ x1: u.x + rnd(-6, 6), y1: u.y - u.size * 0.3 + rnd(-4, 4), x2: t.x + rnd(-8, 8), y2: t.y + rnd(-8, 8), life: 6, maxLife: 6, color: '#88ddff', width: 2, straight: true });
    }
    addP(t.x, t.y, '#aaeeff', 20, 5);
    for (let i = 0; i < 8; i++) addP(t.x + rnd(-16, 16), t.y + rnd(-16, 16), '#ccffff', 2, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 35, life: 0.35, color: '#88ddff' });
    addDmg(t.x, t.y - t.size - 6, 'FLURRY!', '#88ddff');
    shake(3);
  }

  if (u._icyVeinsProc && _ohTier === 10 && t.hp > 0) {
    u._icyVeinsTimer = 5 * GAME_TICK_HZ;
    if (u._ivOrigAtkSpd == null) {
      u._ivOrigAtkSpd = u.atkSpd;
      u.atkSpd = Math.round(u.atkSpd * 0.75);
    }
    addP(u.x, u.y, '#88ddff', 28, 6);
    addP(u.x, u.y, '#aaeeff', 20, 5);
    addP(u.x, u.y, '#ffffff', 12, 4);
    for (let i = 0; i < 12; i++) {
      const angle = Math.PI * 2 * i / 12;
      addP(u.x + Math.cos(angle) * u.size * 1.8, u.y + Math.sin(angle) * u.size * 1.8, '#66ccff', 2, 4);
    }
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 2.5, life: 0.5, color: '#88ddff' });
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 1.5, life: 0.35, color: '#aaeeff' });
    addDmg(u.x, u.y - u.size - 10, 'ICY VEINS!', '#66ccff');
    showFlash('ICY VEINS!', '#66ccff', 30);
    shake(6);
  }

  if (u._icyVeinsTimer > 0 && t.hp > 0 && !t.isBoss && Math.random() < 0.30) {
    t.stunned = Math.max(t.stunned || 0, Math.round(0.8 * GAME_TICK_HZ));
    addP(t.x, t.y, '#aaeeff', 14, 4);
    addP(t.x, t.y, '#ffffff', 8, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 20, life: 0.25, color: '#88ddff' });
    addDmg(t.x, t.y - t.size, 'FREEZE!', '#88ddff');
  }

  if (u._lightningBolt && _ohTier === 3 && t.hp > 0) {
    const boltDamage = Math.round(u.dmg * 0.60);
    dealDamage(t, boltDamage, u, 'magic');
    addP(t.x, t.y, '#ffee66', 16, 5);
    addP(t.x, t.y, '#aa88ff', 12, 4);
    addP(t.x, t.y, '#ffffff', 8, 3);
    for (let i = 0; i < 6; i++) addP(t.x + rnd(-10, 10), t.y + rnd(-10, 10), '#ffee66', 2, 3);
    addDmg(t.x, t.y - t.size - 6, 'ZAP!', '#ffee66');
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: 0, life: 0.3, lightningBolt: true, lbX2: t.x, lbY2: t.y, color: '#ffee66' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 28, life: 0.3, color: '#ffee66' });
    shake(2);
    for (const enemy of enemies) {
      if (enemy !== t && enemy.hp > 0 && dist(t, enemy) < 90) {
        const chainDamage = Math.round(u.dmg * 0.40);
        dealDamage(enemy, chainDamage, u, 'magic');
        groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 0, life: 0.3, lightningBolt: true, lbX2: enemy.x, lbY2: enemy.y, color: '#aa88ff' });
        addP(enemy.x, enemy.y, '#ccaaff', 10, 3);
        addP(enemy.x, enemy.y, '#ffee66', 6, 2);
        break;
      }
    }
  }

  if (u._chainThunder && _ohTier === 5 && t.hp > 0) {
    let prev = t;
    const hit = [t];
    const mults = [0.75, 0.45, 0.30];
    for (let i = 0; i < mults.length; i++) {
      let chainTarget = prev;
      if (i > 0) {
        chainTarget = null;
        let bestDistance = Infinity;
        for (const enemy of enemies) {
          if (enemy.hp <= 0 || hit.includes(enemy)) continue;
          const enemyDistance = dist(prev, enemy);
          if (enemyDistance < 125 && enemyDistance < bestDistance) {
            bestDistance = enemyDistance;
            chainTarget = enemy;
          }
        }
        if (!chainTarget) break;
        hit.push(chainTarget);
      }
      const thunderDamage = Math.round(u.dmg * mults[i]);
      dealDamage(chainTarget, thunderDamage, u, 'magic');
      if (!chainTarget.isBoss) {
        chainTarget.stunned = Math.max(chainTarget.stunned || 0, Math.round(0.5 * GAME_TICK_HZ));
        addDmg(chainTarget.x, chainTarget.y - (chainTarget.size || 18) - 6, 'STUN', '#ffee66', { sz: 10, bold: true });
      }
      const color = i === 0 ? '#ffee66' : '#aa88ff';
      if (i === 0) groundFx.push({ x: u.x, y: u.y, r: 0, maxR: 0, life: 0.3, lightningBolt: true, lbX2: chainTarget.x, lbY2: chainTarget.y, color });
      else groundFx.push({ x: prev.x, y: prev.y, r: 0, maxR: 0, life: 0.32, lightningBolt: true, lbX2: chainTarget.x, lbY2: chainTarget.y, color });
      addP(chainTarget.x, chainTarget.y, color, 14 - (i * 3), 4);
      addP(chainTarget.x, chainTarget.y, '#ffffff', 5, 2);
      prev = chainTarget;
    }
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 42, life: 0.35, color: '#ffee66' });
    addDmg(t.x, t.y - t.size - 6, 'CHAIN THUNDER!', '#ffee66');
    shake(4);
  }

  if (u._ascendanceProc && _ohTier === 10 && t.hp > 0) {
    u._ascendanceTimer = 5 * GAME_TICK_HZ;
    if (u.overload && u._ascOrigChain == null) {
      u._ascOrigChain = u.overload.chainCount;
      u._ascOrigChance = u.overload.chance;
      u.overload.chainCount = 4;
      u.overload.chance = 0.50;
    }
    addP(u.x, u.y, '#aa88ff', 30, 6);
    addP(u.x, u.y, '#ffee66', 22, 5);
    addP(u.x, u.y, '#ffffff', 12, 4);
    for (let i = 0; i < 14; i++) {
      const angle = Math.PI * 2 * i / 14;
      addP(u.x + Math.cos(angle) * u.size * 2, u.y + Math.sin(angle) * u.size * 2, '#aa88ff', 2, 4);
    }
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = u.size * 1.5;
      groundFx.push({ x: u.x, y: u.y, r: 0, maxR: 0, life: 0.25, lightningBolt: true, lbX2: u.x + Math.cos(angle) * radius, lbY2: u.y + Math.sin(angle) * radius, color: '#ffee66' });
    }
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 2.5, life: 0.6, color: '#aa88ff' });
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 1.5, life: 0.4, color: '#ffee66' });
    addDmg(u.x, u.y - u.size - 10, 'ASCENDANCE!', '#aa88ff');
    showFlash('ASCENDANCE!', '#aa88ff', 30);
    shake(8);
  }
}

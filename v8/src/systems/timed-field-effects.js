import { rnd } from '../core/math.js';

function tickShadowCrashes(ctx) {
  const { arena, enemies, groundFx, dealDamage, addParticle, addDamageText, shake } = ctx;
  if (!arena.shadowCrashes || !arena.shadowCrashes.length) return;
  for (let i = arena.shadowCrashes.length - 1; i >= 0; i--) {
    const crash = arena.shadowCrashes[i];
    crash.delay--;
    if (crash.delay > 0) continue;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && Math.hypot(enemy.x - crash.x, enemy.y - crash.y) <= crash.radius) {
        dealDamage(enemy, crash.dmg, crash.from, 'magic');
        addParticle(enemy.x, enemy.y, '#6622aa', 10, 4);
      }
    }
    groundFx.push({ x: crash.x, y: crash.y, r: 0, maxR: crash.radius * 1.2, life: 0.5, color: '#3a0a5a' });
    groundFx.push({ x: crash.x, y: crash.y, r: 0, maxR: crash.radius * 0.6, life: 0.3, color: '#aa66ff' });
    for (let j = 0; j < 20; j++) addParticle(crash.x + rnd(-30, 30), crash.y + rnd(-30, 30), '#aa66ff', 1, 4);
    for (let j = 0; j < 16; j++) {
      const angle = Math.PI * 2 * j / 16;
      addParticle(crash.x + Math.cos(angle) * crash.radius * 0.8, crash.y + Math.sin(angle) * crash.radius * 0.8, '#6622aa', 1, 3);
    }
    addDamageText(crash.x, crash.y - 20, 'SHADOW CRASH!', '#cc88ff');
    shake(8);
    arena.shadowCrashes.splice(i, 1);
  }
}

function tickHammerOfLight(ctx) {
  const { arena, enemies, groundFx, dealDamage, addParticle, addDamageText, showFlash, shake } = ctx;
  if (!arena.hammerOfLight || !arena.hammerOfLight.length) return;
  for (let i = arena.hammerOfLight.length - 1; i >= 0; i--) {
    const hammer = arena.hammerOfLight[i];
    hammer.delay--;
    if (hammer.delay > 0) continue;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && Math.hypot(enemy.x - hammer.x, enemy.y - hammer.y) <= hammer.radius) {
        dealDamage(enemy, hammer.dmg, hammer.from, 'magic');
        addParticle(enemy.x, enemy.y, '#ffd700', 16, 5);
        addParticle(enemy.x, enemy.y, '#ffffff', 8, 3);
        addDamageText(enemy.x, enemy.y - enemy.size, '-' + hammer.dmg, '#ffd700');
      }
    }
    groundFx.push({ x: hammer.x, y: hammer.y, r: 0, maxR: hammer.radius * 1.5, life: 0.6, color: '#ffd700' });
    groundFx.push({ x: hammer.x, y: hammer.y, r: 0, maxR: hammer.radius * 0.8, life: 0.4, color: '#ffffff' });
    groundFx.push({ x: hammer.x, y: hammer.y, r: 0, maxR: hammer.radius * 0.3, life: 0.25, color: '#ffe066' });
    for (let j = 0; j < 30; j++) {
      const angle = Math.PI * 2 * j / 30;
      addParticle(hammer.x + Math.cos(angle) * hammer.radius, hammer.y + Math.sin(angle) * hammer.radius, '#ffd700', 2, 5);
    }
    for (let j = 0; j < 16; j++) addParticle(hammer.x + rnd(-12, 12), hammer.y - rnd(8, 50), '#fff7c4', 2, 4);
    for (let j = 0; j < 8; j++) addParticle(hammer.x + rnd(-20, 20), hammer.y + rnd(-20, 20), '#ffffff', 1, 3);
    addDamageText(hammer.x, hammer.y - 30, 'HAMMER OF LIGHT!', '#ffd700');
    showFlash('HAMMER OF LIGHT', '#ffd700', 35);
    shake(12);
    arena.hammerOfLight.splice(i, 1);
  }
}

function tickVoidTentacles(ctx) {
  const { arena, enemies, beamFx, dealDamage, addParticle } = ctx;
  if (!arena.voidTentacles || !arena.voidTentacles.length) return;
  for (let i = arena.voidTentacles.length - 1; i >= 0; i--) {
    const tentacle = arena.voidTentacles[i];
    tentacle.timer--;
    if (tentacle.timer <= 0) {
      arena.voidTentacles.splice(i, 1);
      continue;
    }
    tentacle.atkCD--;
    if (tentacle.atkCD > 0) continue;
    tentacle.atkCD = tentacle.atkEvery;
    let closest = null;
    let closestDistance = Infinity;
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      const distance = Math.hypot(enemy.x - tentacle.x, enemy.y - tentacle.y);
      if (distance < 80 && distance < closestDistance) {
        closestDistance = distance;
        closest = enemy;
      }
    }
    if (!closest) continue;
    dealDamage(closest, tentacle.dmg, tentacle.from, 'magic');
    beamFx.push({ x1: tentacle.x, y1: tentacle.y - 10, x2: closest.x, y2: closest.y, life: 12, maxLife: 12, color: '#6622aa', width: 1.5, straight: true });
    addParticle(closest.x, closest.y, '#aa66ff', 4, 2);
  }
}

function tickBeacons(ctx) {
  const { arena, units, frame, groundFx, addHealFx } = ctx;
  if (!arena.beacons || !arena.beacons.length) return;
  for (let i = arena.beacons.length - 1; i >= 0; i--) {
    const beacon = arena.beacons[i];
    beacon.t--;
    if (frame % 30 === 0) {
      for (const unit of units) {
        if (unit.hp <= 0 || !unit.isPlayer || unit.isGhost) continue;
        const distance = Math.hypot(unit.x - beacon.x, unit.y - beacon.y);
        if (distance <= beacon.r) {
          unit.hp = Math.min(unit.maxHp, unit.hp + beacon.hps);
          addHealFx(unit.x, unit.y, beacon.hps);
        }
      }
    }
    if (frame % 18 === 0) groundFx.push({ x: beacon.x, y: beacon.y, r: 0, maxR: beacon.r, life: 0.4, color: '#ffe066', flatten: true });
    if (beacon.t <= 0) arena.beacons.splice(i, 1);
  }
}

function tickWakeOfAshesWaves(ctx) {
  const { arena } = ctx;
  if (!arena.wakeOfAshesWaves || !arena.wakeOfAshesWaves.length) return;
  for (let i = arena.wakeOfAshesWaves.length - 1; i >= 0; i--) {
    const wave = arena.wakeOfAshesWaves[i];
    wave.life--;
    if (wave.life <= 0) arena.wakeOfAshesWaves.splice(i, 1);
  }
}

function tickShadowApparitions(ctx) {
  const { arena, frame, groundFx, dealDamage, addParticle, addDamageText } = ctx;
  if (!arena.shadowApparitions || !arena.shadowApparitions.length) return;
  for (let i = arena.shadowApparitions.length - 1; i >= 0; i--) {
    const apparition = arena.shadowApparitions[i];
    apparition.life--;
    if (apparition.target && apparition.target.hp > 0) {
      apparition.tx = apparition.target.x;
      apparition.ty = apparition.target.y;
    }
    const dx = apparition.tx - apparition.x;
    const dy = apparition.ty - apparition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 12 || apparition.life <= 0) {
      if (apparition.target && apparition.target.hp > 0) {
        dealDamage(apparition.target, apparition.dmg, apparition.from, 'magic');
        addParticle(apparition.target.x, apparition.target.y, '#aa66ff', 14, 4);
        addParticle(apparition.target.x, apparition.target.y, '#6622aa', 10, 3);
        groundFx.push({ x: apparition.target.x, y: apparition.target.y, r: 0, maxR: 20, life: 0.25, color: '#6622aa' });
        addDamageText(apparition.target.x, apparition.target.y - 12, 'APPARITION', '#cc88ff');
      }
      arena.shadowApparitions.splice(i, 1);
      continue;
    }
    apparition.x += dx / distance * apparition.speed;
    apparition.y += dy / distance * apparition.speed;
    if (frame % 2 === 0) {
      addParticle(apparition.x + rnd(-5, 5), apparition.y + rnd(-5, 8), '#6622aa', 1, 2);
      addParticle(apparition.x + rnd(-3, 3), apparition.y + rnd(5, 15), '#aa66ff', 1, 1.5);
    }
  }
}

export function tickTimedFieldEffects(ctx) {
  if (!ctx || !ctx.arena) return;
  tickShadowCrashes(ctx);
  tickHammerOfLight(ctx);
  tickVoidTentacles(ctx);
  tickBeacons(ctx);
  tickWakeOfAshesWaves(ctx);
  tickShadowApparitions(ctx);
}

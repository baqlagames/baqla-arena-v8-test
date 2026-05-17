import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function tickEnemyActionStatusEffects(enemy, {
  frame,
  enemies,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  shake,
}) {
  if (enemy.poisonTimer > 0) {
    enemy.poisonTimer--;
    if (frame % 30 === 0 && enemy.poisonDmgVal) dealDamage(enemy, enemy.poisonDmgVal, null, 'magic');
  }

  if (enemy.livingBombTimer > 0) {
    enemy.livingBombTimer--;
    if (enemy.livingBombTimer <= 0 || enemy.hp <= 0) {
      emitParticle(enemy.x, enemy.y, '#ff8800', 24, 5);
      for (const other of enemies) {
        if (other !== enemy && other.hp > 0 && dist(enemy, other) < 70) {
          dealDamage(other, enemy.livingBombDmg * 0.6, enemy.livingBombFrom, 'magic');
          other.livingBomb = true;
          other.livingBombTimer = 180;
          other.livingBombDmg = enemy.livingBombDmg * 0.6;
          other.livingBombFrom = enemy.livingBombFrom;
        }
      }
      enemy.livingBomb = false;
    }
  }

  if (enemy._igniteStacks && enemy._igniteStacks.length > 0) {
    for (let i = enemy._igniteStacks.length - 1; i >= 0; i--) {
      enemy._igniteStacks[i].dur--;
      if (frame % GAME_TICK_HZ === 0) {
        dealDamage(enemy, enemy._igniteStacks[i].dmg, enemy._igniteStacks[i].from, 'magic');
        emitParticle(enemy.x, enemy.y + enemy.size * 0.3, '#ff4400', 2, 2);
      }
      if (enemy._igniteStacks[i].dur <= 0) enemy._igniteStacks.splice(i, 1);
    }
  }

  if (enemy._livingBombTimer > 0) {
    enemy._livingBombTimer--;
    if (frame % 20 === 0) emitParticle(enemy.x, enemy.y, '#ff6600', 4, 2);
    if (enemy._livingBombTimer <= 0 || enemy.hp <= 0) {
      const radius = enemy._livingBombRadius || 80;
      for (const other of enemies) {
        if (other !== enemy && other.hp > 0 && dist(enemy, other) < radius) {
          dealDamage(other, enemy._livingBombDmg, enemy._livingBombFrom, 'magic');
          emitParticle(other.x, other.y, '#ff4400', 12, 4);
        }
      }
      groundEffects.push({ x: enemy.x, y: enemy.y, r: 0, maxR: radius, life: 0.6, color: '#ff4400' });
      emitParticle(enemy.x, enemy.y, '#ff6600', 28, 6);
      addDamageText(enemy.x, enemy.y - 10, 'BOOM!', '#ff4400');
      shake(8);
      enemy._livingBomb = false;
      enemy._livingBombTimer = 0;
    }
  }

  if (enemy.doomTimer > 0) {
    enemy.doomTimer--;
    if (enemy.doomTimer <= 0) {
      dealDamage(enemy, enemy.doomDmg, enemy.doomFrom, 'magic');
      emitParticle(enemy.x, enemy.y, '#660066', 30, 6);
      shake(10);
    }
  }
}

export function tickEnemyPostUpdateStatusEffects(enemy, {
  frame,
  enemies,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  showFlash,
  onDeath,
  randomRange,
  shake,
}) {
  if (enemy.cursedTimer > 0) enemy.cursedTimer--;
  if (enemy._finalReckoning > 0) {
    enemy._finalReckoning--;
    if (frame % 10 === 0) emitParticle(enemy.x + randomRange(-enemy.size * 0.5, enemy.size * 0.5), enemy.y - enemy.size, '#ffd700', 1, 2);
  }
  if (enemy._deathMark) {
    enemy._deathMark.timer--;
    if (enemy._deathMark.timer <= 0) {
      enemy._deathMark = null;
    } else if (enemy.hp <= 0) {
      const from = enemy._deathMark.from;
      const color = enemy._deathMark.color || '#ff2266';
      const altColor = enemy._deathMark.altColor || '#aa0033';
      const nextTarget = enemies.find(other => other.hp > 0 && other !== enemy);
      if (nextTarget) {
        nextTarget._deathMark = { timer: 5 * GAME_TICK_HZ, from, color, altColor };
        addDamageText(nextTarget.x, nextTarget.y - nextTarget.size - 12, 'MARK TRANSFERRED!', color);
      }
      enemy._deathMark = null;
    }
  }
  if (enemy.slowTimer > 0) {
    enemy.slowTimer--;
    if (enemy.slowTimer <= 0) enemy.slowMult = 1;
  }
  if (enemy.dentedTimer > 0) {
    enemy.dentedTimer--;
    if (enemy.dentedTimer <= 0) enemy.dentedMult = 1;
  }
  if (enemy.runeWoundTimer > 0) {
    enemy.runeWoundTimer--;
    if (enemy.runeWoundTimer <= 0) {
      enemy.runeWoundMult = 1;
      enemy.runeWoundFrom = null;
    }
  }
  if (enemy.soulChainsTimer > 0) {
    enemy.soulChainsTimer--;
    if (enemy.soulChainsTimer <= 0) enemy.soulChainsFrom = null;
  }
  if (enemy.markedForRuinTimer > 0) {
    enemy.markedForRuinTimer--;
    if (enemy.markedForRuinTimer <= 0) {
      enemy.markedForRuinMult = 0;
      enemy.markedForRuinFrom = null;
    }
  }
  if (enemy.avengedTimer > 0) {
    enemy.avengedTimer--;
    if (enemy.avengedTimer <= 0) enemy.avengedMult = 1;
  }
  if (enemy.muddiedTimer > 0) {
    enemy.muddiedTimer--;
    if (enemy.muddiedTimer <= 0) {
      enemy.muddiedSlowMult = 1;
      enemy.muddiedDamageMult = 1;
      enemy.muddiedFrom = null;
    }
  }
  if (enemy.mudbreakerRoarTimer > 0) {
    enemy.mudbreakerRoarTimer--;
    if (enemy.mudbreakerRoarTimer <= 0) enemy.mudbreakerRoarMult = 1;
  }
  if (enemy.crackedArmorTimer > 0) {
    enemy.crackedArmorTimer--;
    if (enemy.crackedArmorTimer <= 0) enemy.crackedArmorMult = 0;
  }
  if (enemy.focusMarkTimer > 0) {
    enemy.focusMarkTimer--;
    if (enemy.focusMarkTimer <= 0) enemy.focusMarkMult = 0;
  }
  if (enemy._flameCurseTimer > 0) {
    enemy._flameCurseTimer--;
    enemy._flameCurseTick = (enemy._flameCurseTick || 0) + 1;
    if (enemy._flameCurseTick >= Math.round(0.5 * GAME_TICK_HZ) && enemy.hp > 0) {
      enemy._flameCurseTick = 0;
      dealDamage(enemy, enemy._flameCurseDmg || 1, enemy._flameCurseFrom || null, 'magic');
      emitParticle(enemy.x + randomRange(-5, 5), enemy.y + randomRange(-5, 5), '#ff6633', 3, 2);
      emitParticle(enemy.x + randomRange(-4, 4), enemy.y - enemy.size * 0.25, '#ffaa33', 1, 2);
    }
    if (frame % 10 === 0) emitParticle(enemy.x + randomRange(-6, 6), enemy.y + randomRange(-6, 6), '#ff4422', 1, 2);
    if (enemy._flameCurseTimer <= 0) {
      enemy._flameCurseTimer = 0;
      enemy._flameCurseTick = 0;
      enemy._flameCurseDmg = 0;
      enemy._flameCurseFrom = null;
      enemy._flameCurseDamageMult = 1;
    }
  }
  if (enemy.bleedTimer > 0) {
    if (frame % 30 === 0 && enemy.bleedDmg > 0 && enemy.hp > 0) dealDamage(enemy, enemy.bleedDmg, enemy.bleedFrom || null, 'magic');
    enemy.bleedTimer--;
    if (enemy.bleedTimer <= 0) {
      enemy.bleedTimer = 0;
      enemy.bleedDmg = 0;
    }
  }
  if (enemy.plagueTimer > 0) {
    enemy.plagueTimer--;
    if (frame % GAME_TICK_HZ === 0 && enemy.plagueDmg > 0 && enemy.hp > 0) {
      dealDamage(enemy, enemy.plagueDmg, enemy.plagueFrom || null, 'magic');
      emitParticle(enemy.x, enemy.y, '#55aa33', 3, 2);
    }
    if (enemy.plagueTimer <= 0 && enemy.plagueSpreadRadius > 0) {
      for (const other of enemies) {
        if (other.hp <= 0 || other === enemy) continue;
        if (dist(enemy, other) > enemy.plagueSpreadRadius) continue;
        if (!other.plagueTimer || other.plagueTimer < 2 * GAME_TICK_HZ) {
          other.plagueTimer = enemy.plagueDur || 3 * GAME_TICK_HZ;
          other.plagueDmg = enemy.plagueDmg;
          other.plagueFrom = enemy.plagueFrom;
          other.plagueSpreadRadius = 0;
          emitParticle(other.x, other.y, '#55aa33', 6, 3);
        }
      }
    }
  }
  if (enemy.thrashBleed && enemy.thrashBleed.stacks > 0) {
    enemy.thrashBleed.timer--;
    if (frame % GAME_TICK_HZ === 0 && enemy.hp > 0) {
      const rawDmg = Math.round(enemy.maxHp * 0.01 * enemy.thrashBleed.stacks);
      const cappedDmg = Math.min(rawDmg, 8 * enemy.thrashBleed.stacks);
      dealDamage(enemy, cappedDmg, enemy.thrashBleed.source || null, 'normal');
      emitParticle(enemy.x, enemy.y, '#cc3333', 6, 3);
      emitParticle(enemy.x, enemy.y + enemy.size * 0.5, '#880000', 2, 2);
    }
    if (enemy.thrashBleed.timer <= 0) {
      enemy.thrashBleed.stacks = 0;
      enemy.thrashBleed.timer = 0;
    }
  }
  if (enemy.primalWrathBleed && enemy.primalWrathBleed.timer > 0) {
    enemy.primalWrathBleed.timer--;
    if (frame % GAME_TICK_HZ === 0 && enemy.hp > 0) {
      dealDamage(enemy, enemy.primalWrathBleed.dmg, enemy.primalWrathBleed.source || null, 'normal');
      emitParticle(enemy.x, enemy.y, '#6b8e23', 3, 2);
    }
  }
  if (enemy.deadlyPoisonTimer > 0 && enemy.deadlyPoisonStacks > 0) {
    enemy.deadlyPoisonTimer--;
    if (frame % GAME_TICK_HZ === 0 && enemy.hp > 0) {
      const damage = enemy.deadlyPoisonDmg * enemy.deadlyPoisonStacks;
      dealDamage(enemy, damage, enemy.deadlyPoisonSource || null, 'normal');
      emitParticle(enemy.x, enemy.y, '#55aa33', 2, 2);
    }
    if (enemy.deadlyPoisonTimer <= 0) enemy.deadlyPoisonStacks = 0;
  }
  if (enemy.garroteBleedTimer > 0 && enemy.garroteBleeding) {
    enemy.garroteBleedTimer--;
    if (frame % GAME_TICK_HZ === 0 && enemy.hp > 0) {
      dealDamage(enemy, enemy.garroteBleedDmg, enemy.garroteBleedSource || null, 'normal');
      emitParticle(enemy.x, enemy.y, '#cc2244', 2, 2);
    }
    if (enemy.garroteBleedTimer <= 0) enemy.garroteBleeding = false;
  }
  if (enemy.silenceTimer > 0) enemy.silenceTimer--;
  if (enemy._hunterMark && enemy._hunterMark.dur > 0) {
    enemy._hunterMark.dur--;
    if (enemy._hunterMark.dur <= 0) enemy._hunterMark = null;
    else if (frame % 10 === 0) emitParticle(enemy.x, enemy.y - enemy.size - 4, '#ff4444', 2, 2);
  }
  if (enemy._blackArrow && enemy.hp > 0) {
    enemy._blackArrow.t++;
    if (enemy._blackArrow.t % enemy._blackArrow.interval === 0) {
      dealDamage(enemy, enemy._blackArrow.tickDmg, enemy._blackArrow.from, 'magic');
      emitParticle(enemy.x + randomRange(-5, 5), enemy.y + randomRange(-5, 5), '#6633aa', 3, 2);
    }
    if (enemy._blackArrow.t >= enemy._blackArrow.dur) enemy._blackArrow = null;
    else if (frame % 8 === 0) emitParticle(enemy.x, enemy.y - enemy.size - 2, '#6633aa', 2, 2);
  }
  if (enemy._serpentPoison && enemy.hp > 0) {
    enemy._serpentPoison.dur--;
    enemy._serpentPoison.tickCD++;
    if (enemy._serpentPoison.tickCD >= enemy._serpentPoison.tickRate) {
      enemy._serpentPoison.tickCD = 0;
      dealDamage(enemy, enemy._serpentPoison.dmgPerTick, enemy._serpentPoison.from, 'magic');
      emitParticle(enemy.x + randomRange(-5, 5), enemy.y + randomRange(-5, 5), '#44cc22', 3, 2);
    }
    if (enemy._serpentPoison.dur <= 0) enemy._serpentPoison = null;
    else if (frame % 8 === 0) emitParticle(enemy.x, enemy.y - enemy.size - 2, '#44cc22', 1, 2);
  }
  if (enemy._barbedBleed && enemy.hp > 0) {
    enemy._barbedBleed.dur--;
    enemy._barbedBleed.tickCD++;
    if (enemy._barbedBleed.tickCD >= enemy._barbedBleed.tickRate) {
      enemy._barbedBleed.tickCD = 0;
      dealDamage(enemy, enemy._barbedBleed.dmgPerTick, enemy._barbedBleed.from, 'physical');
      emitParticle(enemy.x + randomRange(-4, 4), enemy.y + randomRange(-4, 4), '#cc2222', 3, 2);
    }
    if (enemy._barbedBleed.dur <= 0) enemy._barbedBleed = null;
    else if (frame % 8 === 0) emitParticle(enemy.x, enemy.y - enemy.size - 2, '#cc2222', 1, 2);
  }
  if (enemy._agonyTimer > 0 && enemy._agonyStacks > 0) {
    enemy._agonyTimer--;
    const darkSoulMult = (enemy._agonyFrom && enemy._agonyFrom._darkSoulTimer > 0) ? 2 : 1;
    const agonySpeedMult = Math.max(darkSoulMult, (enemy._agonyFrom && enemy._agonyFrom._darkPactDoTSpeed) ? enemy._agonyFrom._darkPactDoTSpeed.mult : 1);
    const agonyTickRate = Math.max(1, Math.round(GAME_TICK_HZ / agonySpeedMult));
    if (frame % agonyTickRate === 0 && enemy.hp > 0) {
      const damage = (enemy._agonyTickDmg || 1) * enemy._agonyStacks;
      dealDamage(enemy, damage, enemy._agonyFrom || null, 'magic');
      emitParticle(enemy.x, enemy.y, '#9b59b6', 3, 2);
      if (enemy._agonyFrom && enemy._agonyFrom.soulSiphon && enemy._agonyFrom.hp > 0) {
        const heal = Math.round(damage * 0.15);
        enemy._agonyFrom.hp = Math.min(enemy._agonyFrom.maxHp, enemy._agonyFrom.hp + heal);
        if (frame % 12 === 0) emitParticle(enemy._agonyFrom.x, enemy._agonyFrom.y, '#33ff66', 2, 2);
      }
    }
    if (enemy._agonyTimer <= 0) enemy._agonyStacks = 0;
    if (frame % 8 === 0) {
      const angle = frame * 0.15;
      emitParticle(enemy.x + Math.cos(angle) * enemy.size * 0.5, enemy.y + Math.sin(angle) * enemy.size * 0.5, '#7b3a9a', 1, 2);
    }
  }
  if (enemy.deathmarkTimer > 0) {
    enemy.deathmarkTimer--;
    if (enemy.deathmarkTimer <= 0 && enemy.hp > 0) {
      const burst = Math.round(enemy.deathmarkDmg);
      if (burst > 0) {
        dealDamage(enemy, burst, enemy.deathmarkSource || null, 'normal');
        emitParticle(enemy.x, enemy.y, '#55aa33', 32, 6);
        addDamageText(enemy.x, enemy.y - enemy.size, 'DEATHMARK BURST!', '#55ff77');
        groundEffects.push({ x: enemy.x, y: enemy.y, r: 0, maxR: 60, life: 0.5, color: '#55aa33' });
        shake(8);
        showFlash('DEATHMARK BURST', '#55ff77', 40);
      }
      enemy.deathmarkDmg = 0;
      enemy.deathmarkSource = null;
    }
  }
  if (enemy.roarWeakenTimer > 0) {
    enemy.roarWeakenTimer--;
    if (enemy.roarWeakenTimer <= 0) enemy.roarWeaken = false;
  }
  if (enemy.toothAndClawTimer > 0) {
    enemy.toothAndClawTimer--;
    if (enemy.toothAndClawTimer <= 0) enemy.toothAndClawDebuff = false;
  }
  if (enemy.judgmentMarkTimer > 0) {
    enemy.judgmentMarkTimer--;
    if (enemy.judgmentMarkTimer <= 0) enemy.judgmentMark = false;
  }
  if (enemy._rommanaMarkedTimer > 0) {
    enemy._rommanaMarkedTimer--;
    if (frame % 8 === 0) emitParticle(enemy.x + randomRange(-5, 5), enemy.y - randomRange(0, enemy.size || 18), '#44ccff', 1, 2);
    if (enemy._rommanaMarkedTimer <= 0) enemy._rommanaMarkedAmp = 0;
  }
  if (enemy._soulReaperTimer > 0) {
    enemy._soulReaperTimer--;
    if (enemy._soulReaperTimer <= 0) enemy._soulReaperStacks = 0;
  }
  if (enemy.doomCurseTimer > 0) {
    enemy.doomCurseTimer--;
    if (frame % 6 === 0) emitParticle(enemy.x + randomRange(-6, 6), enemy.y + randomRange(-6, 6), '#660066', 1, 2);
    if (enemy.doomCurseTimer <= 0 && enemy.hp > 0) {
      dealDamage(enemy, enemy.doomCurseDmg || 100, enemy.doomCurseFrom || null, 'magic');
      for (const other of enemies) {
        if (other === enemy || other.hp <= 0) continue;
        if (dist(enemy, other) <= 120) dealDamage(other, Math.round((enemy.doomCurseDmg || 100) * 0.5), enemy.doomCurseFrom || null, 'magic');
      }
      emitParticle(enemy.x, enemy.y, '#660066', 32, 5);
      groundEffects.push({ x: enemy.x, y: enemy.y, r: 0, maxR: 120, life: 0.5, color: '#660066' });
      addDamageText(enemy.x, enemy.y - enemy.size, 'DOOM!', '#cc66cc');
      shake(8);
      enemy.doomCurseTimer = 0;
      enemy.doomCurseDmg = 0;
    }
  }
  if (enemy.burnTimer > 0) {
    if (frame % 30 === 0 && enemy.burnDmg > 0 && enemy.hp > 0) {
      const stack = enemy.burnStacks || 1;
      dealDamage(enemy, enemy.burnDmg * stack, enemy.burnFrom || null, 'magic');
      if (frame % 2 === 0) emitParticle(enemy.x, enemy.y - enemy.size * 0.5, '#ff7700', 2, 2);
    }
    enemy.burnTimer--;
    if (enemy.burnTimer <= 0) {
      enemy.burnTimer = 0;
      enemy.burnDmg = 0;
      enemy.burnStacks = 0;
    }
  }
  if (enemy.hitFlash > 0) enemy.hitFlash--;
  tickStickyBomb(enemy, { enemies, dealDamage, emitParticle, groundEffects, addDamageText, shake });
  tickCharmExpiry(enemy, { onDeath, emitParticle, addDamageText });
  tickToxicBrew(enemy, { frame, dealDamage, emitParticle, groundEffects });
}

function tickStickyBomb(enemy, {
  enemies,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  shake,
}) {
  if (!enemy.bomb || enemy.hp <= 0) return;
  enemy.bomb.timer--;
  if (enemy.bomb.timer > 0) return;

  const radius = enemy.bomb.radius;
  const damage = enemy.bomb.dmg;
  const source = enemy.bomb.source;
  enemy.bomb = null;
  if (source && source.bomb && source.bomb.active > 0) source.bomb.active--;
  const level = (source && source.level) || 1;
  const baseMult = 0.45 + level * 0.07;
  for (const other of enemies) {
    if (other.hp <= 0) continue;
    const distance = dist(enemy, other);
    if (distance <= radius) {
      const falloff = baseMult * (1 - (distance / radius) * 0.5);
      dealDamage(other, Math.round(damage * falloff), source || null, 'normal');
    }
  }
  emitParticle(enemy.x, enemy.y, '#ff8800', 40, 7);
  groundEffects.push({ x: enemy.x, y: enemy.y, r: 0, maxR: radius, life: 0.5, color: '#ff8800' });
  addDamageText(enemy.x, enemy.y - enemy.size, 'BOOM!', '#ff8800');
  shake(8);
  if (source && source.cluster) {
    for (let i = 0; i < source.cluster.count; i++) {
      const angle = Math.PI * 2 * i / source.cluster.count;
      const x = enemy.x + Math.cos(angle) * 45;
      const y = enemy.y + Math.sin(angle) * 45;
      const clusterRadius = source.cluster.radius;
      const clusterDamage = Math.round(damage * source.cluster.mult);
      for (const other of enemies) {
        if (other.hp <= 0) continue;
        const distance = dist({ x, y }, other);
        if (distance <= clusterRadius) {
          const falloff = baseMult * (1 - (distance / clusterRadius) * 0.5);
          dealDamage(other, Math.round(clusterDamage * falloff), source, 'normal');
        }
      }
      emitParticle(x, y, '#ffaa44', 18, 5);
      groundEffects.push({ x, y, r: 0, maxR: clusterRadius, life: 0.35, color: '#ffaa44' });
    }
    addDamageText(enemy.x, enemy.y - enemy.size - 12, 'CLUSTER!', '#ffaa44');
  }
}

function tickCharmExpiry(enemy, {
  onDeath,
  emitParticle,
  addDamageText,
}) {
  if (!enemy.charmed || enemy.hp <= 0) return;
  enemy.charmTicksLeft--;
  if (enemy.charmTicksLeft > 0) return;
  emitParticle(enemy.x, enemy.y, '#a855f7', 32, 5);
  addDamageText(enemy.x, enemy.y - enemy.size, 'MC ENDS', '#a855f7');
  enemy.hp = 0;
  onDeath(enemy, enemy.charmedBy || null);
}

function tickToxicBrew(enemy, {
  frame,
  dealDamage,
  emitParticle,
  groundEffects,
}) {
  if (!(enemy.toxicBrewStacks > 0 && enemy.toxicBrewTimer > 0 && enemy.hp > 0)) return;
  enemy.toxicBrewTimer--;
  if (frame % 18 === 0) {
    const maxStacks = enemy.toxicBrewSource && enemy.toxicBrewSource.toxicBrew ? enemy.toxicBrewSource.toxicBrew.maxStacks : 6;
    groundEffects.push({
      x: enemy.x,
      y: enemy.y,
      r: 0,
      maxR: Math.min(62, 20 + enemy.toxicBrewStacks * 7),
      life: 0.32,
      toxicStackFx: true,
      stacks: enemy.toxicBrewStacks,
      maxStacks,
      color: enemy.toxicBrewStacks >= maxStacks ? '#55ff77' : '#aa55dd',
    });
    if (enemy.toxicBrewStacks >= maxStacks) emitParticle(enemy.x, enemy.y, '#55ff77', 4, 3);
  }
  if (frame % GAME_TICK_HZ === 0) {
    const damage = Math.round((enemy.toxicBrewDmg || 5) * enemy.toxicBrewStacks);
    dealDamage(enemy, damage, enemy.toxicBrewSource || null, 'magic');
    emitParticle(enemy.x, enemy.y, '#9a55cc', enemy.toxicBrewStacks, 2);
  }
  if (enemy.toxicBrewTimer <= 0) enemy.toxicBrewStacks = 0;
}

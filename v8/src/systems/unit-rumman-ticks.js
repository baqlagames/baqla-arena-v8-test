import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function tickUnitRummanPassives(unit, {
  frame,
  units,
  enemies,
  arenaTop,
  randomRange,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
  shake,
}) {
  tickAutoTurret(unit, { units, arenaTop, randomRange, emitParticle, addDamageText });
  tickSiegeCommandBeacon(unit, { frame, units, randomRange, groundEffects, emitParticle, addDamageText });
  tickOverclock(unit);
  tickMechRebuild(unit, { addDamageText });
  tickMechOverdrive(unit, { frame, units, enemies, randomRange, groundEffects, dealDamage, emitParticle, addDamageText, shake });
  tickTurretOverdrive(unit, { frame, units, randomRange, emitParticle, addDamageText });
  tickNapalmZones(unit, { frame, enemies, groundEffects, dealDamage, emitParticle });
  tickSiegeMode(unit, { frame, units, randomRange, emitParticle, addDamageText });
  tickMechOverload(unit, { frame, randomRange, emitParticle, addDamageText });
  tickMechSuitEscorts(unit, { units, emitParticle, addDamageText });
  return tickMechTurretFollow(unit);
}

function tickAutoTurret(unit, {
  units,
  arenaTop,
  randomRange,
  emitParticle,
  addDamageText,
}) {
  if (!unit.autoTurret) return;

  unit.autoTurret.cd++;
  if (unit.autoTurret.cd < unit.autoTurret.every) return;

  const activeTurrets = units.filter(candidate => candidate.isMinion && candidate.parent === unit && candidate.kind === 'turret' && candidate.hp > 0).length;
  if (activeTurrets >= unit.autoTurret.maxTurrets) return;

  unit.autoTurret.cd = 0;
  const level = unit.level || 1;
  const hp = 150 + level * 30;
  const x = unit.x + randomRange(-40, 40);
  const y = Math.max(arenaTop + 20, unit.y - 100 - Math.random() * 80);
  const turret = {
    x,
    y,
    maxHp: hp,
    hp,
    dmg: Math.round(unit.dmg * unit.autoTurret.dmgMult),
    speed: 0,
    atkSpd: unit.autoTurret.utility ? 88 : 96,
    range: unit.autoTurret.artillery ? (unit.autoTurret.artilleryRange || 320) : 260,
    size: 14,
    armor: 2,
    magicRes: 0,
    isPlayer: true,
    isMinion: true,
    parent: unit,
    kind: 'turret',
    cd: 0,
    projType: 'bolt',
    _turretArtillery: !!unit.autoTurret.artillery,
    _turretAoe: unit.autoTurret.aoeRadius || 0,
    _turretKills: 0,
    color: unit.autoTurret.artillery ? '#c02d5f' : '#b87333',
    accent: unit.autoTurret.artillery ? '#d9a52a' : '#5a3a1a',
    facing: 1,
    bobPhase: 0,
  };
  units.push(turret);
  emitParticle(x, y, turret.color, 12, 4);
  addDamageText(x, y - 10, 'TURRET!', turret.color);
}

function tickSiegeCommandBeacon(unit, {
  frame,
  units,
  randomRange,
  groundEffects,
  emitParticle,
  addDamageText,
}) {
  if (!unit._siegeCommandBeacon) return;

  const beacon = unit._siegeCommandBeacon;
  beacon.timer--;
  if (frame % 6 === 0) {
    emitParticle(beacon.x + randomRange(-8, 8), beacon.y - randomRange(0, 18), '#ffcc66', 2, 3);
    groundEffects.push({ x: beacon.x, y: beacon.y, r: 0, maxR: beacon.r, life: 0.24, color: '#ffcc66' });
  }
  for (const minion of units) {
    if (!minion.isMinion || minion.parent !== unit || minion.kind !== 'turret' || minion.hp <= 0) continue;
    if (Math.hypot(minion.x - beacon.x, minion.y - beacon.y) <= beacon.r) {
      if (!minion._cmdOrigDmg) {
        minion._cmdOrigDmg = minion.dmg;
        minion._cmdOrigAtkSpd = minion.atkSpd;
      }
      minion.dmg = Math.round(minion._cmdOrigDmg * beacon.dmgMult);
      minion.atkSpd = Math.max(8, Math.round(minion._cmdOrigAtkSpd * beacon.atkSpdMult));
      if (frame % 10 === 0) emitParticle(minion.x, minion.y, '#ffcc66', 5, 2);
    }
  }
  if (beacon.timer > 0) return;

  for (const minion of units) {
    if (!minion.isMinion || minion.parent !== unit || minion.kind !== 'turret') continue;
    if (minion._cmdOrigDmg) {
      minion.dmg = minion._cmdOrigDmg;
      minion._cmdOrigDmg = null;
    }
    if (minion._cmdOrigAtkSpd) {
      minion.atkSpd = minion._cmdOrigAtkSpd;
      minion._cmdOrigAtkSpd = null;
    }
  }
  unit._siegeCommandBeacon = null;
  addDamageText(unit.x, unit.y - unit.size, 'BEACON ENDS', '#aa8844');
}

function tickOverclock(unit) {
  if (!unit.overclock || unit.overclock.active <= 0) return;

  unit.overclock.active--;
  if (unit.overclock.active <= 0 && unit._ocOrigAtkSpd != null) {
    unit.atkSpd = unit._ocOrigAtkSpd;
    unit._ocOrigAtkSpd = null;
  }
}

function tickMechRebuild(unit, { addDamageText }) {
  if (!unit._mechRebuilding) return;

  unit._mechRebuilding.t++;
  if (unit._mechRebuilding.t >= unit._mechRebuilding.dur) {
    unit._mechRebuilding = null;
    if (unit.mechSuit) unit.mechSuit.escortSpawned = false;
    addDamageText(unit.x, unit.y - unit.size, 'CANNON REBUILT!', '#ff5ca8');
  }
}

function tickMechOverdrive(unit, {
  frame,
  units,
  enemies,
  randomRange,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!(unit._overdriveTimer > 0)) return;

  unit._overdriveTimer--;
  if (frame % 4 === 0) emitParticle(unit.x + randomRange(-unit.size, unit.size), unit.y + randomRange(-unit.size, unit.size), '#ff4400', 2, 3);
  if (unit._overdriveTimer > 0) return;

  const radius = unit._odVentRadius || 95;
  const damage = unit._odVentDmg || Math.round(unit.dmg * 1.2);
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const distance = dist(unit, enemy);
    if (distance <= radius) {
      const falloff = 1 - (distance / radius) * 0.45;
      dealDamage(enemy, Math.round(damage * falloff), unit, 'physical');
      emitParticle(enemy.x, enemy.y, '#ff6600', 8, 3);
    }
  }
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: radius, life: 0.55, color: '#ff4400' });
  emitParticle(unit.x, unit.y, '#ff4400', 32, 7);
  emitParticle(unit.x, unit.y, '#ffcc00', 16, 5);
  addDamageText(unit.x, unit.y - unit.size - 10, 'VENT BLAST!', '#ff6600', { sz: 14, bold: true });
  shake(10);
  if (unit._odOrigDmg != null) {
    unit.dmg = unit._odOrigDmg;
    unit._odOrigDmg = null;
  }
  if (unit._odOrigAtkSpd != null) {
    unit.atkSpd = unit._odOrigAtkSpd;
    unit._odOrigAtkSpd = null;
  }
  for (const minion of units) {
    if (!minion.isMinion || minion.parent !== unit || minion.kind !== 'mechTurret') continue;
    if (minion._odDroneOrigDmg) {
      minion.dmg = minion._odDroneOrigDmg;
      minion._odDroneOrigDmg = null;
    }
    if (minion._odDroneOrigAtkSpd) {
      minion.atkSpd = minion._odDroneOrigAtkSpd;
      minion._odDroneOrigAtkSpd = null;
    }
  }
  unit._overdriveAoe = 0;
  unit._odVentDmg = 0;
  unit._odVentRadius = 0;
  addDamageText(unit.x, unit.y - unit.size, 'OVERDRIVE ENDS', '#aaa');
}

function tickTurretOverdrive(unit, {
  frame,
  units,
  randomRange,
  emitParticle,
  addDamageText,
}) {
  if (unit._turretODTimer > 0) {
    unit._turretODTimer--;
    if (frame % 6 === 0) {
      const angle = frame * 0.15;
      emitParticle(unit.x + Math.cos(angle) * unit.size * 1.2, unit.y + Math.sin(angle) * unit.size * 1.2, '#44ccff', 1, 3);
    }
    if (unit._turretODTimer <= 0) {
      for (const minion of units) {
        if (!minion.isMinion || minion.parent !== unit || minion.kind !== 'turret' || minion.hp <= 0) continue;
        if (minion._todOrigDmg) {
          minion.dmg = minion._todOrigDmg;
          minion._todOrigDmg = null;
        }
        if (minion._todOrigAtkSpd) {
          minion.atkSpd = minion._todOrigAtkSpd;
          minion._todOrigAtkSpd = null;
        }
      }
      addDamageText(unit.x, unit.y - unit.size, 'OVERDRIVE ENDS', '#888');
    }
  }
  if (unit.kind === 'turret' && unit._turretODTimer > 0) {
    unit._turretODTimer--;
    if (frame % 6 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.3, '#44ccff', 1, 2);
  }
}

function tickNapalmZones(unit, {
  frame,
  enemies,
  groundEffects,
  dealDamage,
  emitParticle,
}) {
  if (unit._napalmZone) {
    const zone = unit._napalmZone;
    zone.dur--;
    zone.tickCD++;
    if (zone.tickCD >= zone.tickRate) {
      zone.tickCD = 0;
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        if (Math.hypot(enemy.x - zone.x, enemy.y - zone.y) <= zone.r) {
          dealDamage(enemy, zone.dmgPerTick, zone.from, 'magic');
          emitParticle(enemy.x, enemy.y, '#ff4400', 2, 2);
        }
      }
    }
    if (frame % 4 === 0) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * zone.r;
      emitParticle(zone.x + Math.cos(angle) * distance, zone.y + Math.sin(angle) * distance, '#ff4400', 1, 2);
    }
    if (zone.dur <= 0) unit._napalmZone = null;
  }
  if (!unit._napalmGridZones || !unit._napalmGridZones.length) return;

  for (const zone of unit._napalmGridZones) {
    zone.dur--;
    zone.tickCD++;
    if (zone.tickCD >= zone.tickRate) {
      zone.tickCD = 0;
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        if (Math.hypot(enemy.x - zone.x, enemy.y - zone.y) <= zone.r) {
          dealDamage(enemy, zone.dmgPerTick, zone.from, 'magic');
          enemy.slowTimer = Math.max(enemy.slowTimer || 0, Math.round(0.8 * GAME_TICK_HZ));
          enemy.slowMult = Math.min(enemy.slowMult || 1, 0.82);
          emitParticle(enemy.x, enemy.y, '#ff4400', 3, 2);
        }
      }
    }
    if (frame % 3 === 0) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * zone.r;
      emitParticle(zone.x + Math.cos(angle) * distance, zone.y + Math.sin(angle) * distance, '#ff6600', 1, 2);
    }
    if (frame % 18 === 0) groundEffects.push({ x: zone.x, y: zone.y, r: 0, maxR: zone.r, life: 0.3, color: '#ff4400' });
  }
  unit._napalmGridZones = unit._napalmGridZones.filter(zone => zone.dur > 0);
}

function tickSiegeMode(unit, {
  frame,
  units,
  randomRange,
  emitParticle,
  addDamageText,
}) {
  if (unit._siegeModeTimer > 0) {
    unit._siegeModeTimer--;
    if (frame % 6 === 0) {
      const angle = frame * 0.1;
      emitParticle(unit.x + Math.cos(angle) * unit.size * 1.3, unit.y + Math.sin(angle) * unit.size * 1.3, '#ffcc66', 1, 3);
    }
    if (unit._siegeModeTimer <= 0) {
      if (unit._smOrigRange) {
        unit.range = unit._smOrigRange;
        unit._smOrigRange = null;
      }
      if (unit._smOrigDmg) {
        unit.dmg = unit._smOrigDmg;
        unit._smOrigDmg = null;
      }
      for (const minion of units) {
        if (!minion.isMinion || minion.parent !== unit || minion.kind !== 'turret' || minion.hp <= 0) continue;
        if (minion._smOrigAtkSpd) {
          minion.atkSpd = minion._smOrigAtkSpd;
          minion._smOrigAtkSpd = null;
        }
        minion._siegeModeTimer = 0;
      }
      addDamageText(unit.x, unit.y - unit.size, 'SIEGE ENDS', '#888');
    }
  }
  if (unit.kind === 'turret' && unit._siegeModeTimer > 0) {
    unit._siegeModeTimer--;
    if (frame % 6 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.4, unit.size * 0.4), unit.y - unit.size * 0.3, '#ffcc66', 1, 2);
  }
}

function tickMechOverload(unit, {
  frame,
  randomRange,
  emitParticle,
  addDamageText,
}) {
  if (!(unit._mechOLTimer > 0)) return;

  unit._mechOLTimer--;
  if (frame % 4 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.8, unit.size * 0.8), unit.y + randomRange(-unit.size * 0.8, unit.size * 0.8), '#ff4400', 2, 3);
  if (unit._mechOLTimer > 0) return;

  if (unit._molOrigDmg) {
    unit.dmg = unit._molOrigDmg;
    unit._molOrigDmg = null;
  }
  if (unit._molOrigAtkSpd) {
    unit.atkSpd = unit._molOrigAtkSpd;
    unit._molOrigAtkSpd = null;
  }
  unit._mechOLAoe = 0;
  addDamageText(unit.x, unit.y - unit.size, 'OVERLOAD ENDS', '#888');
}

function tickMechSuitEscorts(unit, {
  units,
  emitParticle,
  addDamageText,
}) {
  if (!unit.mechSuit || !unit.mechSuit.active || unit.mechSuit.escortSpawned) return;

  unit.mechSuit.escortSpawned = true;
  const level = unit.level || 1;
  for (let i = 0; i < unit.mechSuit.maxEscorts; i++) {
    const offset = i === 0 ? -38 : 38;
    const hp = 120 + level * 25;
    const escort = {
      x: unit.x + offset,
      y: unit.y + 15,
      maxHp: hp,
      hp,
      dmg: Math.round(unit.dmg * 0.25),
      speed: unit.speed || 0.18,
      atkSpd: 72,
      range: 220,
      size: 12,
      armor: 1,
      magicRes: 0,
      isPlayer: true,
      isMinion: true,
      parent: unit,
      kind: 'mechTurret',
      cd: 0,
      projType: 'bolt',
      color: '#d84f87',
      accent: '#d9a52a',
      facing: 1,
      bobPhase: 0,
      _escortOffset: offset,
    };
    units.push(escort);
    emitParticle(escort.x, escort.y, '#ff5ca8', 10, 3);
  }
  addDamageText(unit.x, unit.y - unit.size, 'PEARL CANNONS!', '#ff5ca8');
}

function tickMechTurretFollow(unit) {
  if (unit.kind !== 'mechTurret') return false;

  if (!unit.parent || unit.parent.hp <= 0) {
    unit.hp = 0;
    unit.removed = true;
    return true;
  }
  const desiredX = unit.parent.x + (unit._escortOffset || 0);
  const desiredY = unit.parent.y + 18;
  const distance = Math.hypot(desiredX - unit.x, desiredY - unit.y);
  if (distance > 90) {
    unit.x = desiredX;
    unit.y = desiredY;
  } else if (distance > 1) {
    unit.x += (desiredX - unit.x) * 0.18;
    unit.y += (desiredY - unit.y) * 0.18;
  }
  return false;
}

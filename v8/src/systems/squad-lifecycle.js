import {
  ARENA_ATTACK_TYPE_BY_UNIT,
  ARENA_PLAYER_ARMOR_BRANCH_OVERRIDE,
  ARENA_PLAYER_ARMOR_TYPE,
  ARENA_UNIT_SIZE_SCALE,
  HP_MULT_PLAYER,
} from '../data/tuning.js';
import { ARENA_UNIT_BRANCHES } from '../data/passives.js';
import { arena_isCapstoneLevel } from './squad-economy.js';

export function snapshotSquadCooldowns(cells) {
  const out = {};
  for (const key in cells) {
    const oldUnit = cells[key] && cells[key].unitRef;
    if (!oldUnit) continue;
    out[key] = {
      sigPct: oldUnit.signature ? (oldUnit.signature.t / oldUnit.signature.cd) : null,
      meteorT: oldUnit.meteor ? oldUnit.meteor.t : null,
      justiceReachCD: oldUnit.justiceReachCD,
    };
  }
  return out;
}

export function stripLegacyArenaAbilityProps(unit) {
  delete unit.stealth;
  delete unit.lifesteal;
  delete unit.firstHitMult;
  delete unit.executeThreshold;
  delete unit.executeMult;
  delete unit.cleaveArc;
  delete unit.healAmt;
  delete unit.healCD;
  delete unit.hotAmt;
  delete unit.hotCD;
  delete unit.chainAfter;
  delete unit.chainHealAmt;
  delete unit.chainCount;
  delete unit.summonOnDeploy;
  delete unit.chargeOnDeploy;
  delete unit.chargeFirstHitMult;
  delete unit.polymorphCD;
  delete unit.slowTrapCD;
  delete unit.bombTrapCD;
  delete unit.slowOnHit;
  delete unit.poisonOnHit;
  delete unit.regen;
  delete unit.prefersRanged;
  delete unit.vsRangedDmgMult;
  delete unit.vsRangedCritChance;
}

export function createSquadUnitFromCell({
  key,
  cell,
  stats,
  x,
  y,
  frame,
  tickHz,
  lerpColor,
  applyPassives,
  applyMoveSpeedTuning,
  randomFloat = Math.random,
}) {
  const isVodka = cell.unitIdx === 99;
  const tankBuff = stats.arch === 'tank' ? 1.10 : 1;
  const hp = Math.round(stats.hp * HP_MULT_PLAYER * tankBuff);
  const level = cell.level || 1;
  const branch = cell.branch || null;
  const branchDef = (branch && ARENA_UNIT_BRANCHES[cell.unitIdx]) ? ARENA_UNIT_BRANCHES[cell.unitIdx][branch] : null;
  const useBranch = branchDef && level >= 3;
  const color = useBranch ? branchDef.color : (stats.color || '#888888');
  const accent = useBranch ? branchDef.accent : (stats.accent || stats.color || '#ffffff');
  const tintT = [0, 0.18, 0.32, 0.50, 0.70][level - 1] || 0;
  const unit = {
    ...stats,
    x,
    y,
    size: (stats.size || 16) * ARENA_UNIT_SIZE_SCALE,
    maxHp: hp,
    hp,
    unitIdx: cell.unitIdx,
    isPlayer: true,
    isHero: isVodka,
    cellKey: key,
    homeX: x,
    homeY: y,
    cellLevel: level,
    branch,
    cd: 0,
    target: null,
    facing: 1,
    stealthHits: 0,
    firstHitDone: false,
    abilCD: {},
    chargeRemaining: 0,
    bobPhase: randomFloat() * Math.PI * 2,
    spawnFrame: frame,
    activeBuffs: [],
    levelTier: level,
    color,
    accent,
    levelAccent: lerpColor(accent, '#ffffff', tintT),
    levelColor: lerpColor(color, '#ffffff', tintT * 0.5),
  };

  unit.attackType = ARENA_ATTACK_TYPE_BY_UNIT[cell.unitIdx] || 'physical';
  unit._defenseArmorType = (branch && ARENA_PLAYER_ARMOR_BRANCH_OVERRIDE[cell.unitIdx + '_' + branch]) || ARENA_PLAYER_ARMOR_TYPE[cell.unitIdx] || 'mail';
  unit.specId = cell.unitIdx + '_' + (cell.branch || 'base');

  if (branchDef) {
    if (branchDef.branchAttackType) unit.attackType = branchDef.branchAttackType;
    if (branchDef.branchArmorType) unit.armorType = branchDef.branchArmorType;
    if (branchDef.branchProps && useBranch) {
      for (const branchPropKey in branchDef.branchProps) {
        unit[branchPropKey] = branchDef.branchProps[branchPropKey];
      }
    }
  }

  stripLegacyArenaAbilityProps(unit);
  if (stats.prefersRanged) unit.prefersRanged = true;
  if (unit.arch === 'healer') {
    unit.healAmt = stats.healAmt || Math.round(58 + (level - 1) * 10);
    unit.healCD = stats.healCD || 90;
    unit.healCDt = Math.round((unit.healCD || 90) * 0.35);
  }
  if (stats.polymorph) {
    unit.polymorphCD = 30 * tickHz;
    unit.polymorphDur = 6 * tickHz;
    unit.polymorphCDt = 3 * tickHz;
  }
  if (unit.holyShockBuiltIn) unit.holyShock = { cd: 0, every: 8 * tickHz, mult: 1.5, healPct: 0.10, critBonus: false };
  if (unit.layOnHandsCD) unit.layOnHandsProc = { every: unit.layOnHandsCD * tickHz, counter: 0, threshold: 0.35 };

  applyPassives(unit, cell.unitIdx, level);
  applyMoveSpeedTuning(unit);
  if (unit.paladinHybrid) unit.justiceReachCD = 3 * tickHz;

  return unit;
}

export function restoreSquadCooldowns(unit, snapshot, tickHz) {
  if (!unit || !snapshot) return;
  if (unit.signature && snapshot.sigPct != null) {
    const restored = Math.round(Math.min(snapshot.sigPct, 1.0) * unit.signature.cd);
    const minRamp = 2 * tickHz;
    unit.signature.t = Math.min(restored, unit.signature.cd - minRamp);
  }
  if (unit.meteor && snapshot.meteorT != null) {
    unit.meteor.t = Math.max(0, Math.min(snapshot.meteorT, unit.meteor.cd));
  }
  if (snapshot.justiceReachCD != null) {
    unit.justiceReachCD = Math.max(0, snapshot.justiceReachCD);
  }
}

export function respawnSquadFromCells({
  arenaState,
  units,
  frame,
  tickHz,
  statsForCell,
  centerForCell,
  lerpColor,
  applyPassives,
  applyMoveSpeedTuning,
  spawnBuildMinions,
}) {
  const cells = arenaState.cells || {};
  const cooldownSnapshot = snapshotSquadCooldowns(cells);
  units.length = 0;

  for (const key in cells) {
    const cell = cells[key];
    if (!cell || cell.unitIdx == null) continue;
    cell.minionsSpawned = false;

    const stats = statsForCell(cell);
    const center = centerForCell(cell);
    const unit = createSquadUnitFromCell({
      key,
      cell,
      stats,
      x: center.x,
      y: center.y,
      frame,
      tickHz,
      lerpColor,
      applyPassives,
      applyMoveSpeedTuning,
    });
    restoreSquadCooldowns(unit, cooldownSnapshot[key], tickHz);
    units.push(unit);
    cell.unitRef = unit;
  }

  if (arenaState.phase === 'build' && spawnBuildMinions) spawnBuildMinions();
  return units;
}

function existingMinionCount(units, parent, kind) {
  return units.filter(unit => unit && unit.isMinion && unit.parent === parent && unit.kind === kind && unit.hp > 0).length;
}

function createMechEscortTurret(parent, offset) {
  const level = parent.level || 1;
  const hp = 120 + level * 25;
  return {
    x: parent.x + offset,
    y: parent.y + 15,
    maxHp: hp,
    hp,
    dmg: Math.round(parent.dmg * 0.30),
    speed: parent.speed || 0.18,
    atkSpd: 72,
    range: 220,
    size: 12,
    armor: 1,
    magicRes: 0,
    isPlayer: true,
    isMinion: true,
    parent,
    kind: 'mechTurret',
    cd: 0,
    projType: 'bolt',
    color: '#d84f87',
    accent: '#d9a52a',
    facing: 1,
    bobPhase: 0,
    _escortOffset: offset,
  };
}

function createZaatarCompanion(parent, level, tickHz, randomFloat) {
  if (parent.branch === 'a') {
    const hp = 300 + level * 35;
    return {
      x: parent.x + 20,
      y: parent.y + 10,
      maxHp: hp,
      hp,
      dmg: 12,
      speed: 0.45,
      atkSpd: 54,
      range: 36,
      size: 16,
      armor: 1,
      magicRes: 0,
      isPlayer: true,
      isMinion: true,
      parent,
      kind: 'raptor',
      cd: 0,
      color: '#aa6633',
      accent: '#663311',
      facing: 1,
      bobPhase: randomFloat() * Math.PI * 2,
    };
  }
  if (parent.branch === 'b') {
    const hp = 500 + level * 50;
    return {
      x: parent.x + 20,
      y: parent.y + 10,
      maxHp: hp,
      hp,
      dmg: 16,
      speed: 0.35,
      atkSpd: 66,
      range: 36,
      size: 20,
      armor: 3,
      magicRes: 2,
      isPlayer: true,
      isMinion: true,
      parent,
      kind: 'spiritBeast',
      cd: 0,
      color: '#3aa84e',
      accent: '#1a5a2a',
      facing: 1,
      _spiritMendCD: 0,
      _spiritMendEvery: 8 * tickHz,
      _spiritMendPct: 0.05,
      bobPhase: randomFloat() * Math.PI * 2,
    };
  }
  const hp = 400 + level * 40;
  return {
    x: parent.x + 20,
    y: parent.y + 10,
    maxHp: hp,
    hp,
    dmg: 14,
    speed: 0.40,
    atkSpd: 60,
    range: 36,
    size: 18,
    armor: 2,
    magicRes: 1,
    isPlayer: true,
    isMinion: true,
    parent,
    kind: 'wolf',
    cd: 0,
    color: '#888888',
    accent: '#555555',
    facing: 1,
    bobPhase: randomFloat() * Math.PI * 2,
  };
}

export function spawnSquadAttachedMinions({
  cells,
  units,
  preserveExisting,
  tickHz,
  spawnMinion,
  spawnFelfelMirror,
  nerfMinion,
  emitParticle,
  randomFloat = Math.random,
}) {
  const squadParents = new Set();
  for (const key in cells) {
    const cell = cells[key];
    if (cell && cell.unitRef) squadParents.add(cell.unitRef);
  }
  if (!preserveExisting) {
    for (let i = units.length - 1; i >= 0; i--) {
      const minion = units[i];
      if (minion && minion.isMinion && minion.parent && squadParents.has(minion.parent)) units.splice(i, 1);
    }
  }

  const spawnMissing = (parent, kind, count) => {
    const have = preserveExisting ? existingMinionCount(units, parent, kind) : 0;
    const missing = Math.max(0, count - have);
    if (missing > 0) spawnMinion(parent, kind, missing);
  };
  const spawnMissingMirrors = (parent, level, count) => {
    const have = preserveExisting ? existingMinionCount(units, parent, 'felfelMirror') : 0;
    const missing = Math.max(0, count - have);
    for (let i = 0; i < missing; i++) spawnFelfelMirror(parent, level);
  };
  const spawnMissingMechTurrets = (parent, count) => {
    const offsets = [-38, 38];
    const alive = units.filter(unit => unit && unit.isMinion && unit.parent === parent && unit.kind === 'mechTurret' && unit.hp > 0);
    const used = new Set(alive.map(unit => unit._escortOffset || 0));
    for (const offset of offsets) {
      if (alive.length >= count) break;
      if (used.has(offset)) continue;
      const turret = createMechEscortTurret(parent, offset);
      units.push(turret);
      emitParticle(turret.x, turret.y, '#ff5ca8', 10, 3);
      alive.push({});
      used.add(offset);
    }
    if (parent.mechSuit) parent.mechSuit.escortSpawned = true;
  };

  for (const key in cells) {
    const cell = cells[key];
    if (!cell || cell.unitIdx == null) continue;
    const unit = cell.unitRef;
    if (!unit || unit.hp <= 0) continue;

    if (cell.unitIdx === 7 && (cell.level || 1) >= 2) {
      spawnMissing(unit, 'imp', 1);
      if (arena_isCapstoneLevel(cell.level || 1)) spawnMissing(unit, 'felhound', 1);
    }
    if (cell.unitIdx === 6 && (cell.level || 1) >= 3) {
      if (arena_isCapstoneLevel(cell.level || 1)) {
        const elementalKind = unit.branch === 'a' ? 'waterElemental' : unit.branch === 'b' ? 'stormElemental' : 'fireElemental';
        spawnMissing(unit, elementalKind, 1);
      } else {
        spawnMissing(unit, 'flameSprite', 1);
      }
    }
    if (cell.unitIdx === 4 && (cell.level || 1) >= 3 && unit.mirror) {
      spawnMissingMirrors(unit, cell.level || 1, unit.mirror.count || 1);
    }
    if (cell.unitIdx === 9 && (cell.level || 1) >= 3 && unit.mechSuit && unit.mechSuit.active) {
      spawnMissingMechTurrets(unit, unit.mechSuit.maxEscorts || 2);
    }
    if (cell.unitIdx === 8 && unit.callWolf && (cell.level || 1) >= 2) {
      const pet = createZaatarCompanion(unit, cell.level || 1, tickHz, randomFloat);
      if (preserveExisting && existingMinionCount(units, unit, pet.kind) >= 1) continue;
      nerfMinion(pet);
      units.push(pet);
      emitParticle(pet.x, pet.y, pet.color, 12, 3);
    }
  }
}

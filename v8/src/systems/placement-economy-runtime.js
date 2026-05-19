import { PLAYER_UNITS, VODKA } from '../data/units.js';
import { HP_MULT_PLAYER, UNIT_VISUAL_SCALE } from '../data/tuning.js?v=aa518b6-hornet-fix';
import { arena_isCapstoneLevel, arena_pathUpgradeCost, arena_unitGoldCost, arena_upgradeCostFor, sellRefundForCell } from './squad-economy.js?v=aa518b6-hornet-fix';
import { canPlaceArenaSquadUnit, placeArenaSquadUnit, sellArenaSquadCell, upgradeArenaSquadCell } from './squad-runtime-actions.js';
import { respawnSquadFromCells } from './squad-lifecycle.js?v=aa518b6-hornet-fix';

export function createPlacementEconomyRuntime(deps = {}) {
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});
  const randomFloat = typeof deps.randomFloat === 'function' ? deps.randomFloat : Math.random;
  const showFlash = typeof deps.showFlash === 'function' ? deps.showFlash : () => {};
  const applyMoveSpeedTuning = typeof deps.applyMoveSpeedTuning === 'function' ? deps.applyMoveSpeedTuning : () => {};
  const spawnMinion = typeof deps.spawnMinion === 'function' ? deps.spawnMinion : () => {};
  const spawnSquadMinions = typeof deps.spawnSquadMinions === 'function' ? deps.spawnSquadMinions : () => {};

  function getStats(unitData, level) {
    const out = { ...unitData };
    for (let i = 0; i < Math.min(level - 1, 4); i++) {
      const upgrade = unitData.up[i];
      for (const key in upgrade) out[key] = upgrade[key];
    }
    if (out.range) {
      const rangedLike = out.arch === 'ranged' || out.arch === 'caster' || out.arch === 'healer' || out.prefersRanged || out.projType;
      const meleeLike = out.arch === 'tank' || out.arch === 'melee' || (!rangedLike && out.range <= 80);
      if (rangedLike) out.range = Math.round(out.range + 12);
      else if (meleeLike) out.range = Math.round(out.range + 12);
    }
    out.level = level;
    out.hasL3 = level >= 3;
    out.hasL5 = arena_isCapstoneLevel(level);
    return out;
  }

  function getUnitStats(index) {
    return getStats(PLAYER_UNITS[index], (view().unitLevels || [])[index]);
  }

  function getVodkaStats() {
    return getStats(VODKA, view().vodkaLevel || 1);
  }

  function deployUnit(index, x, y) {
    const v = view();
    const stats = getUnitStats(index);
    if ((v.crystal || 0) < stats.cost) return false;
    if (typeof deps.setCrystal === 'function') deps.setCrystal((v.crystal || 0) - stats.cost);
    spawnUnit(index, x, y, stats);
    return true;
  }

  function spawnUnit(index, x, y, stats) {
    const v = view();
    const units = v.units || [];
    const tankBuff = stats.arch === 'tank' ? 1.10 : 1;
    const hp = Math.round(stats.hp * HP_MULT_PLAYER * tankBuff);
    const unit = {
      ...stats,
      x,
      y,
      size: (stats.size || 16) * UNIT_VISUAL_SCALE,
      maxHp: hp,
      hp,
      unitIdx: index,
      isPlayer: true,
      cd: 0,
      target: null,
      facing: 1,
      stealthHits: 0,
      firstHitDone: false,
      abilCD: {},
      summonsLeft: stats.summonOnDeploy ? 1 : 0,
      chargeRemaining: stats.chargeOnDeploy ? 100 : 0,
      bobPhase: randomFloat() * Math.PI * 2,
      healCDt: 0,
      hotCDt: 0,
      polymorphCDt: 0,
      bombTrapCDt: 0,
      slowTrapCDt: 0,
      triageCD: 0,
      lastStandUsed: false,
      spawnFrame: v.frame || 0,
      activeBuffs: [],
    };
    applyMoveSpeedTuning(unit);
    units.push(unit);
    if (stats.summonOnDeploy) {
      spawnMinion(unit, 'foul', 3);
      if (unit.hasL3) spawnMinion(unit, 'foulTank', 1);
    }
    if (stats.chargeOnDeploy) {
      unit.chargePending = true;
      if (typeof deps.emitParticle === 'function') deps.emitParticle(x, y, '#ffaa44', 12, 3);
    }
    return unit;
  }

  function deployVodka() {
    const v = view();
    if (v.vodkaDead || v.vodkaUnit || v.vodkaDeployCD > 0) return;
    const stats = getVodkaStats();
    if ((v.crystal || 0) < stats.cost) {
      showFlash('NEED ' + stats.cost + ' CRYSTALS', '#aa3333', 50);
      return;
    }
    if (typeof deps.setCrystal === 'function') deps.setCrystal((v.crystal || 0) - stats.cost);
    const hp = Math.round(stats.hp * HP_MULT_PLAYER);
    const hero = {
      ...stats,
      size: (stats.size || 16) * UNIT_VISUAL_SCALE,
      x: (v.width || 500) / 2,
      y: (v.deployTop || 710) + 20,
      maxHp: hp,
      hp,
      isPlayer: true,
      isHero: true,
      cd: 0,
      target: null,
      facing: 1,
      abilCD: {},
      furyTimer: 0,
      bobPhase: 0,
      activeBuffs: [],
    };
    if (typeof deps.setVodkaUnit === 'function') deps.setVodkaUnit(hero);
    (v.units || []).push(hero);
    showFlash('VODKA UNLEASHED!', '#ff8c00', 60);
  }

  function respawnSquad() {
    const v = view();
    respawnSquadFromCells({
      arenaState: v.arena,
      units: v.units || [],
      frame: v.frame || 0,
      tickHz: deps.tickHz || 60,
      statsForCell: cell => (cell.unitIdx === 99) ? getStats(VODKA, cell.level || 1) : getStats(PLAYER_UNITS[cell.unitIdx], cell.level || 1),
      centerForCell: cell => (typeof deps.centerForCell === 'function' ? deps.centerForCell(cell) : { x: 0, y: 0 }),
      lerpColor: deps.lerpColor,
      applyPassives: deps.applyPassives,
      applyMoveSpeedTuning,
      spawnBuildMinions: () => spawnSquadMinions(),
    });
  }

  function canPlace(pick) {
    const v = view();
    return canPlaceArenaSquadUnit({ pick, gold: v.gold, arenaState: v.arena, roleRoot: deps.roleRoot });
  }

  function placeUnit(cell, pick) {
    const v = view();
    const result = placeArenaSquadUnit({
      cell,
      pick,
      gold: v.gold,
      arenaState: v.arena,
      roleRoot: deps.roleRoot,
      onStageChallengeUsage: deps.onStageChallengeUsage,
      respawnSquad,
      sound: deps.sound,
    });
    if (!result.ok) return false;
    if (typeof deps.setGold === 'function') deps.setGold(result.gold);
    return true;
  }

  function upgradeCell(cell, branchPick, pathPick) {
    const v = view();
    const result = upgradeArenaSquadCell({
      cell,
      branchPick,
      pathPick,
      gold: v.gold,
      arenaState: v.arena,
      pathById: deps.pathById,
      applyRolePathToCell: deps.applyRolePathToCell,
      respawnSquad,
      effects: {
        particles: v.particles || [],
        groundEffects: v.groundFx || [],
        randomRange: deps.randomRange,
        emitParticle: deps.emitParticle,
        addDamageText: deps.addDamageText,
        addHealEffect: deps.addHealEffect,
        showFlash,
        sound: deps.sound,
        shake: deps.shake,
      },
    });
    if (!result.ok) return false;
    if (typeof deps.setGold === 'function') deps.setGold(result.gold);
    return true;
  }

  function sellCell(cell) {
    const v = view();
    const result = sellArenaSquadCell({ cell, gold: v.gold, arenaState: v.arena, roleRoot: deps.roleRoot });
    if (!result.ok) return false;
    if (typeof deps.setGold === 'function') deps.setGold(result.gold);
    return true;
  }

  return {
    getStats,
    getUnitStats,
    getVodkaStats,
    deployUnit,
    spawnUnit,
    deployVodka,
    respawnSquad,
    canPlace,
    placeUnit,
    upgradeCell,
    sellCell,
    isCapstoneLevel: arena_isCapstoneLevel,
    unitGoldCost: arena_unitGoldCost,
    upgradeCostFor: arena_upgradeCostFor,
    pathUpgradeCost: arena_pathUpgradeCost,
    sellRefundForCell,
  };
}

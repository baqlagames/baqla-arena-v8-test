import { createArenaSignatures } from './unit-signatures.js?v=880cef4-shield-visuals';
import { applyPassiveToUnit, applyUnitPassives } from './unit-passives.js';
import {
  applyBeaconSplash,
  calculateAllyDamageMultiplier,
  findEmergencyTarget,
  findLowestAlly,
  spawnFelfelMirror,
  spawnGhost,
  tickHealerTriage,
  updateCharmedEnemy,
} from './unit-support.js';

export function createUnitPassiveRuntime(deps = {}) {
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});
  const gameTickHz = deps.gameTickHz || 60;
  const signatures = createArenaSignatures({
    gameTickHz,
    arena: view().arena || {},
    SFX: deps.sound || {},
    getBattleArray: deps.getBattleArray || (() => []),
    getFrame: deps.getFrame || (() => view().frame || 0),
    getArenaBounds: deps.getArenaBounds || (() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
    addDamageText: deps.addDamageText,
    addHealFx: deps.addHealFx,
    emitParticle: deps.emitParticle,
    showFlash: deps.showFlash,
    dealDamage: deps.dealDamage,
    randomRange: deps.randomRange,
    distance: deps.distance,
    applyTrackedHeal: deps.applyTrackedHeal,
    findLowestAlly: (...args) => findLowestAllyRuntime(...args),
    beaconSplash: (...args) => beaconSplash(...args),
    addBatataShield: deps.addBatataShield,
    addGoldShield: deps.addGoldShield,
    addTaoonBloodShield: deps.addTaoonBloodShield,
    addZavsLineShield: deps.addZavsLineShield,
    applyHealingReceived: deps.applyHealingReceived,
    applyMuddied: deps.applyMuddied,
    clampToLeash: deps.clampToLeash,
    findBestEnemyClusterPoint: deps.findBestEnemyClusterPoint,
    fireDivineStorm: deps.fireDivineStorm,
    jazarGuard: deps.jazarGuard,
    jazarSignatureSurge: deps.jazarSignatureSurge,
    moonkinControlBurst: deps.moonkinControlBurst,
    spawnTreant: deps.spawnTreant,
    nerfMinion: deps.nerfMinion,
    unitVisualScale: deps.unitVisualScale,
    updateUnit: deps.updateUnit,
    shake: deps.shake,
  });

  function applyPassives(u, unitIdx, level) {
    const result = applyUnitPassives(u, unitIdx, level, { gameTickHz, signatures });
    const effects = typeof deps.perkEffects === 'function' ? deps.perkEffects() || {} : {};
    if (u && u.isPlayer && !u._perkTuned) {
      if (u.arch === 'tank' && effects.tankHpMult) {
        const oldMax = u.maxHp || u.hp || 1;
        u.maxHp = Math.max(1, Math.round(oldMax * (1 + effects.tankHpMult)));
        u.hp = Math.min(u.maxHp, Math.round((u.hp || oldMax) * (u.maxHp / oldMax)));
      }
      if ((u.arch === 'melee' || u.arch === 'ranged' || u.arch === 'paladin' || u.arch === 'caster') && effects.dpsDamageMult) {
        u.dmg = Math.max(1, Math.round((u.dmg || 1) * (1 + effects.dpsDamageMult)));
      }
      u._perkTuned = true;
    }
    return result;
  }

  function setPassive(u, id, scaling, capBoost) {
    return applyPassiveToUnit(u, id, scaling, capBoost, { gameTickHz });
  }

  function allyDmgMult(u) {
    return calculateAllyDamageMultiplier(u, {
      units: view().units || [],
      zavsAllyDamageMultiplier: deps.zavsAllyDamageMultiplier,
    });
  }

  function beaconSplash(healer, target, healAmount) {
    const v = view();
    applyBeaconSplash(healer, target, healAmount, {
      units: v.units || [],
      projectiles: v.projectiles || [],
      applyTrackedHeal: deps.applyTrackedHeal,
    });
  }

  function findLowestAllyRuntime(u, maxRange, skip) {
    return findLowestAlly(u, maxRange, skip, { units: view().units || [] });
  }

  function healerTriageTick(u) {
    const v = view();
    tickHealerTriage(u, {
      arena: v.arena,
      units: v.units || [],
      frame: v.frame || 0,
      projectiles: v.projectiles || [],
      applyTrackedHeal: deps.applyTrackedHeal,
      drainHealToBarrier: deps.drainHealToBarrier,
      addDamageText: deps.addDamageText,
    });
  }

  function findEmergencyTargetRuntime(u, maxRange, threshold) {
    return findEmergencyTarget(u, maxRange, threshold, { units: view().units || [] });
  }

  function updateCharmedEnemyRuntime(enemy) {
    updateCharmedEnemy(enemy, {
      enemies: view().enemies || [],
      dealDamage: deps.dealDamage,
      emitParticle: deps.emitParticle,
    });
  }

  function spawnFelfelMirrorRuntime(parent, level) {
    const v = view();
    spawnFelfelMirror(parent, level, {
      units: v.units || [],
      randomRange: deps.randomRange,
      setPassive,
      isCapstoneLevel: deps.isCapstoneLevel,
      emitParticle: deps.emitParticle,
      groundEffects: v.groundFx || [],
      addDamageText: deps.addDamageText,
    });
  }

  function spawnGhostRuntime(source) {
    spawnGhost(source, {
      units: view().units || [],
      emitParticle: deps.emitParticle,
      addDamageText: deps.addDamageText,
      showFlash: deps.showFlash,
    });
  }

  return {
    signatures,
    applyPassives,
    setPassive,
    allyDmgMult,
    beaconSplash,
    findLowestAlly: findLowestAllyRuntime,
    healerTriageTick,
    findEmergencyTarget: findEmergencyTargetRuntime,
    updateCharmedEnemy: updateCharmedEnemyRuntime,
    spawnFelfelMirror: spawnFelfelMirrorRuntime,
    spawnGhost: spawnGhostRuntime,
  };
}

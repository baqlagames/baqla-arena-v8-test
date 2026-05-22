import { createUnitUpdateRuntime } from './unit-update-runtime.js';
import { dispatchUnitBasicAttack } from './unit-attack-dispatch.js';
import { prepareUnitAttack } from './unit-attack-prep.js';
import { applyAlibabaOnHitProcs } from './unit-alibaba-onhit-procs.js';
import { applyEarlyOnHitProcs } from './unit-early-onhit-procs.js';
import { applyJafaarOnHitProcs } from './unit-jafaar-onhit-procs.js';
import { applyJazarOnHitProcs } from './unit-jazar-onhit-procs.js';
import { applyNaanaFoulFelfelOnHitProcs } from './unit-naana-foul-felfel-onhit-procs.js';
import { applyZaatarOnHitProcs } from './unit-zaatar-onhit-procs.js';
import { applyZaytOnHitProcs } from './unit-zayt-onhit-procs.js';
import { updateGhostUnit } from './unit-support.js';
import { tickUnitActionTimers } from './unit-action-timers.js';
import { tickUnitAlibabaPassives } from './unit-alibaba-ticks.js';
import { tickUnitEarlyActions } from './unit-early-actions.js';
import { tickUnitBranchPassives } from './unit-branch-ticks.js';
import { tickUnitCompanionPassives } from './unit-companion-ticks.js';
import { tickUnitSupportAndGapClosers } from './unit-gap-closer-ticks.js';
import { tickUnitHabaqPassives } from './unit-habaq-ticks.js';
import { tickUnitHealerAuraPassives } from './unit-healer-aura-ticks.js';
import { tickUnitHunterPassives } from './unit-hunter-ticks.js';
import { tickUnitPlagueAndJazarPassives } from './unit-plague-jazar-ticks.js';
import { tickUnitPriestPassives } from './unit-priest-ticks.js';
import { tickUnitRummanPassives } from './unit-rumman-ticks.js';
import { prepareUnitAttackTarget } from './unit-attack-targeting.js?v=20260522-vizier-200g';
import { tickUnitSignatureBuffTimers } from './unit-signature-buff-timers.js';
import { tickUnitMeteorAndSignature } from './unit-signature-ticks.js';
import { createUnitPassiveRuntime } from './unit-passive-runtime.js';
import { tickUnitStatusTimers } from './unit-status-timers.js';
import { tickUnitUpkeep } from './unit-upkeep.js';
import { tickUnitWarlockPassives } from './unit-warlock-ticks.js';
import { tickUnitZaytBakdounesPassives } from './unit-zayt-bakdounes-ticks.js';
import { advanceSharedOnHitCounter, applyPostHitSupportProcs } from './unit-onhit-procs.js';
import { applyCoreFamilyOnHitProcs } from './unit-onhit-core.js';
import { applyGenericOnHitProcs } from './unit-onhit-generic.js';
import { applyRummanOnHitProcs } from './unit-onhit-rumman.js';

export function createUnitRuntimeComposition(deps = {}) {
  let unitUpdateRuntime = null;

  const unitPassiveRuntime = createUnitPassiveRuntime({
    gameTickHz: deps.tickHz,
    sound: deps.sound,
    view: deps.passiveView,
    getBattleArray: deps.getBattleArray,
    getFrame: deps.getFrame,
    getArenaBounds: deps.getArenaBounds,
    addDamageText: deps.addDamageText,
    addHealFx: deps.addHealEffect,
    emitParticle: deps.emitParticle,
    showFlash: deps.showFlash,
    dealDamage: deps.dealDamage,
    randomRange: deps.randomRange,
    distance: deps.distance,
    applyTrackedHeal: deps.applyTrackedHeal,
    drainHealToBarrier: deps.drainHealToBarrier,
    perkEffects: deps.perkEffects,
    isCapstoneLevel: deps.isCapstoneLevel,
    zavsAllyDamageMultiplier: deps.zavsAllyDamageMultiplier,
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
    updateUnit: unit => unitUpdateRuntime && unitUpdateRuntime.updateUnit(unit),
    shake: deps.shake,
  });

  unitUpdateRuntime = createUnitUpdateRuntime({
    tickHz: deps.tickHz,
    abilities: deps.abilities,
    sound: deps.sound,
    view: deps.updateView,
    randomRange: deps.randomRange,
    emitParticle: deps.emitParticle,
    addDamageText: deps.addDamageText,
    addHealEffect: deps.addHealEffect,
    shake: deps.shake,
    updateGhostUnit,
    moveToward: deps.moveToward,
    dealDamage: deps.dealDamage,
    tickUnitUpkeep,
    tickUnitEarlyActions,
    tickUnitStatusTimers,
    tickUnitMeteorAndSignature,
    setSignatureBanner: deps.setSignatureBanner,
    tickUnitWarlockPassives,
    tickUnitHunterPassives,
    tickUnitRummanPassives,
    tickUnitCompanionPassives,
    tickUnitBranchPassives,
    tickUnitPriestPassives,
    tickUnitZaytBakdounesPassives,
    tickUnitHabaqPassives,
    tickUnitSignatureBuffTimers,
    tickUnitActionTimers,
    tickUnitPlagueAndJazarPassives,
    tickUnitAlibabaPassives,
    tickUnitHealerAuraPassives,
    tickUnitSupportAndGapClosers,
    prepareUnitAttackTarget,
    prepareUnitAttack,
    applyEarlyOnHitProcs,
    applyZaytOnHitProcs,
    applyJazarOnHitProcs,
    applyAlibabaOnHitProcs,
    applyNaanaFoulFelfelOnHitProcs,
    applyJafaarOnHitProcs,
    applyZaatarOnHitProcs,
    dispatchUnitBasicAttack,
    applyCoreFamilyOnHitProcs,
    applyGenericOnHitProcs,
    applyRummanOnHitProcs,
    applyPostHitSupportProcs,
    clampToArena: deps.clampToArena,
    arena_clampToLeash: deps.clampToLeash,
    arena_applyTrackedHeal: deps.applyTrackedHeal,
    arena_taoonBloodTithe: deps.taoonBloodTithe,
    arena_addTaoonBloodShield: deps.addTaoonBloodShield,
    arena_applyMuddied: deps.applyMuddied,
    arena_healerTriageTick: (...args) => unitPassiveRuntime.healerTriageTick(...args),
    arena_addZavsLineShield: deps.addZavsLineShield,
    arena_applyHealingReceived: deps.applyHealingReceived,
    arena_findJafaarDrainTarget: deps.findJafaarDrainTarget,
    arena_jafaarCurseWeight: deps.jafaarCurseWeight,
    arena_applyJafaarAgony: deps.applyJafaarAgony,
    fireProjectile: deps.fireProjectile,
    findEnemyForUnit: deps.findEnemyForUnit,
    findRangedEnemyForUnit: deps.findRangedEnemyForUnit,
    arena_findLowestAlly: (...args) => unitPassiveRuntime.findLowestAlly(...args),
    arena_drainHealToBarrier: deps.drainHealToBarrier,
    arena_beaconSplash: (...args) => unitPassiveRuntime.beaconSplash(...args),
    arena_addGoldShield: deps.addGoldShield,
    arena_isGripReserved: deps.isGripReserved,
    arena_isGapCloserReserved: deps.isGapCloserReserved,
    arena_reserveGripTarget: deps.reserveGripTarget,
    arena_reserveGapCloserTarget: deps.reserveGapCloserTarget,
    arena_grantGapInvulnerability: deps.grantGapInvulnerability,
    arena_jazarGuard: deps.jazarGuard,
    arena_jazarSignatureSurge: deps.jazarSignatureSurge,
    arena_findBestEnemyClusterPoint: deps.findBestEnemyClusterPoint,
    arena_findUnreservedEnemyInRange: deps.findUnreservedEnemyInRange,
    arena_followFamiliarAnchor: deps.followFamiliarAnchor,
    arena_isReachable: deps.isReachable,
    arena_allyDmgMult: (...args) => unitPassiveRuntime.allyDmgMult(...args),
    arena_zavsAllyAtkSpdFactor: deps.zavsAllyAtkSpdFactor,
    advanceSharedOnHitCounter,
    arena_moonkinControlBurst: deps.moonkinControlBurst,
    arena_moonkinDisplaceEnemy: deps.moonkinDisplaceEnemy,
    arena_fireDivineStorm: deps.fireDivineStorm,
    arena_applyFelfelDeadlyPoison: deps.applyFelfelDeadlyPoison,
    arena_findBasicSecondTarget: deps.findBasicSecondTarget,
    arena_basicSecondHitFor: deps.basicSecondHitFor,
    arena_applyRuneWound: deps.applyRuneWound,
    arena_isTaoonPriorityEnemy: deps.isTaoonPriorityEnemy,
    arena_addBatataShield: deps.addBatataShield,
    arena_isBatataBacklineAlly: deps.isBatataBacklineAlly,
    arena_isZavsMeleeAlly: deps.isZavsMeleeAlly,
    lobBomb: deps.lobBomb,
    arena_findEmergencyTarget: (...args) => unitPassiveRuntime.findEmergencyTarget(...args),
    showFlash: deps.showFlash,
  });

  return {
    signatures: unitPassiveRuntime.signatures,
    applyPassives: (...args) => unitPassiveRuntime.applyPassives(...args),
    allyDmgMult: (...args) => unitPassiveRuntime.allyDmgMult(...args),
    beaconSplash: (...args) => unitPassiveRuntime.beaconSplash(...args),
    findLowestAlly: (...args) => unitPassiveRuntime.findLowestAlly(...args),
    healerTriageTick: (...args) => unitPassiveRuntime.healerTriageTick(...args),
    findEmergencyTarget: (...args) => unitPassiveRuntime.findEmergencyTarget(...args),
    updateCharmedEnemy: (...args) => unitPassiveRuntime.updateCharmedEnemy(...args),
    spawnFelfelMirror: (...args) => unitPassiveRuntime.spawnFelfelMirror(...args),
    spawnGhost: (...args) => unitPassiveRuntime.spawnGhost(...args),
    updateUnit: (...args) => unitUpdateRuntime.updateUnit(...args),
  };
}

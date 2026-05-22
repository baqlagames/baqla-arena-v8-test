import { startStageRun } from './stage-runner.js';
import { createStageRunSetup } from './stage-lifecycle.js';
import {
  completeWavePhase,
  configureWaveSpawning,
  spawnNextEnemyBatch,
  startBuildPhase,
  startWavePhase,
} from './wave-lifecycle.js?v=20260522-vizier-gold';
import { createRiftRuntime } from './rift-runtime.js?v=20260522-vizier-gold';

export function createStageBattleRuntime(deps = {}) {
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});
  const tickHz = deps.tickHz || 60;

  const riftRuntime = createRiftRuntime({
    view: () => {
      const v = view();
      return {
        arena: v.arena,
        width: v.width,
        arenaTop: v.arenaTop,
        arenaBottom: v.arenaBottom,
        deployTop: v.deployTop,
        arenaLeft: v.arenaLeft,
        arenaRight: v.arenaRight,
        currentStage: v.currentStage,
        currentStageIdx: v.currentStageIdx,
        enemies: v.enemies,
        enemiesData: deps.enemiesData,
        units: v.units,
        groundFx: v.groundFx,
        stageHpMult: deps.stageHpMult,
        stageDmgMult: deps.stageDmgMult,
        hpMultEnemy: deps.hpMultEnemy,
        unitSizeScale: deps.unitSizeScale,
      };
    },
    randomRange: deps.randomRange,
    distance: deps.distance,
    emitParticle: deps.emitParticle,
    showFlash: deps.showFlash,
    shake: deps.shake,
  });

  function startStage(idx) {
    const v = view();
    return startStageRun({
      stages: deps.stages,
      transientBattleArrays: deps.transientBattleArrays,
      buildFirstSeconds: deps.buildFirstSeconds,
      selectedDeck: deps.selectedDeck,
      availableUnitIndices: deps.availableUnitIndices,
      selectedSpells: deps.selectedSpells,
      arenaState: () => v.arena,
      width: () => view().width,
      arenaBottom: () => view().arenaBottom,
      setCurrentStageIdx: deps.setCurrentStageIdx,
      setCardHand: deps.setCardHand,
      setAbilityCooldowns: deps.setAbilityCooldowns,
      setAbilityUsed: deps.setAbilityUsed,
      setAbilityTargeting: deps.setAbilityTargeting,
      setCurrentStage: deps.setCurrentStage,
      resetStageStats: deps.resetStageStats,
      clearBattleArrays: deps.clearBattleArrays,
      setVodkaUnit: deps.setVodkaUnit,
      setVodkaDead: deps.setVodkaDead,
      setVodkaDeployCD: deps.setVodkaDeployCD,
      createStageRunSetup,
      stageStarRule: deps.stageStarRule,
      setPlayerCastle: deps.setPlayerCastle,
      setEnemyCastle: deps.setEnemyCastle,
      setCrystalNodes: deps.setCrystalNodes,
      setTowers: deps.setTowers,
      setBossRef: deps.setBossRef,
      setBossSpawned: deps.setBossSpawned,
      initWeather: deps.initWeather,
      resetArenaDecor: deps.resetArenaDecor,
      perkEffects: deps.perkEffects,
      setGold: deps.setGold,
      setStageGold: deps.setStageGold,
      rollStageRift,
      respawnSquad: deps.respawnSquad,
      setStageOver: deps.setStageOver,
      setStageWon: deps.setStageWon,
      startBuild,
      buildWavePreview: deps.buildWavePreview,
      showFlash: deps.showFlash,
      setScreen: deps.setScreen,
    }, idx);
  }

  function startBuild(seconds) {
    const v = view();
    startBuildPhase({
      arena: v.arena,
      seconds,
      tickHz,
      enemies: v.enemies,
      setBossRef: deps.setBossRef,
      setBossSpawned: deps.setBossSpawned,
      respawnSquad: deps.respawnSquad,
    });
  }

  function configureWaveSpawningRuntime() {
    const v = view();
    configureWaveSpawning(v.arena, v.currentStage);
  }

  function spawnQueuedEnemy(next) {
    if (next === 'BOSS') deps.spawnBossForStage();
    else if (typeof next === 'object' && next && next.delay != null) return;
    else if (typeof next === 'object' && next && next.boss != null) deps.spawnBossById(next.boss, { label: next.label, color: next.color });
    else if (typeof next === 'object' && next && next.elite != null) deps.spawnEliteEnemy(next.elite);
    else deps.spawnEnemyByIdx(next);
  }

  function spawnNextEnemyBatchRuntime() {
    spawnNextEnemyBatch(view().arena, spawnQueuedEnemy);
  }

  function startWave() {
    const v = view();
    startWavePhase({
      arena: v.arena,
      units: v.units,
      stage: v.currentStage,
      totalRounds: deps.currentStageRounds(),
      startRoundStats: deps.startRoundStats,
      spawnSquadMinions: deps.spawnSquadMinions,
      configureWaveSpawning: configureWaveSpawningRuntime,
      showFlash: deps.showFlash,
      playWaveStart: deps.playWaveStart,
    });
  }

  function endWave(won) {
    const v = view();
    completeWavePhase({
      arena: v.arena,
      won,
      gold: v.gold,
      stageN: (v.currentStage && v.currentStage.n) || 1,
      totalRounds: deps.currentStageRounds(),
      stageIncome: deps.stageIncome,
      roundGoldMult: deps.roundGoldMult,
      interestCap: deps.interestCap,
      interestRate: deps.interestRate,
      buildNext: deps.buildNext,
      buildBoss: deps.buildBoss,
      finishRoundStats: deps.finishRoundStats,
      setGold: deps.setGold,
      showFlash: deps.showFlash,
      endStage: deps.endStage,
      buildWavePreview: deps.buildWavePreview,
      startBuild,
    });
  }

  function rollStageRift() {
    return riftRuntime.rollStageRift();
  }

  function tryTriggerRift() {
    return riftRuntime.tryTriggerRift();
  }

  function spawnRiftMinions() {
    return riftRuntime.spawnRiftMinions();
  }

  return {
    startStage,
    startBuild,
    configureWaveSpawning: configureWaveSpawningRuntime,
    spawnQueuedEnemy,
    spawnNextEnemyBatch: spawnNextEnemyBatchRuntime,
    startWave,
    endWave,
    rollStageRift,
    tryTriggerRift,
    spawnRiftMinions,
  };
}

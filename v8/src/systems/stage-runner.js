export function startStageRun(ctx, idx) {
  ctx.setCurrentStageIdx(idx);
  ctx.setCardHand([...ctx.availableUnitIndices()]);
  ctx.setAbilityCooldowns(new Array(Math.max(1, ctx.selectedSpells().length)).fill(0));
  ctx.setAbilityUsed(new Array(Math.max(1, ctx.selectedSpells().length)).fill(false));
  ctx.setAbilityTargeting(-1);

  const stage = ctx.stages[idx];
  ctx.setCurrentStage(stage);
  ctx.resetStageStats(stage);

  ctx.clearBattleArrays(ctx.transientBattleArrays);
  ctx.setVodkaUnit(null);
  ctx.setVodkaDead(false);
  ctx.setVodkaDeployCD(0);

  const stageSetup = ctx.createStageRunSetup({
    stage,
    stageIndex: idx,
    width: ctx.width(),
    arenaBottom: ctx.arenaBottom(),
    starRule: ctx.stageStarRule(stage.n || 1),
  });

  ctx.setPlayerCastle(stageSetup.playerCastle);
  Object.assign(ctx.arenaState(), stageSetup.arenaReset);
  ctx.setEnemyCastle(null);
  ctx.setCrystalNodes([]);
  ctx.setTowers([]);
  ctx.setBossRef(null);
  ctx.setBossSpawned(false);

  ctx.initWeather(stage.weather);
  ctx.resetArenaDecor();

  const perkEffects = ctx.perkEffects();
  ctx.setGold(stageSetup.gold + (perkEffects.startingGold || 0));
  ctx.setStageGold(stageSetup.stageGold);

  const arena = ctx.arenaState();
  arena.adRetryUsed = false;
  arena.beansRewardBase = 0;
  arena.beansRewardDoubled = false;

  ctx.rollStageRift();
  ctx.respawnSquad();
  ctx.setStageOver(stageSetup.stageOver);
  ctx.setStageWon(stageSetup.stageWon);
  ctx.startBuild(ctx.buildFirstSeconds);
  ctx.buildWavePreview();
  ctx.showFlash('STAGE ' + stage.n + '  ' + stage.name.toUpperCase(), '#ffd700', 100);
  ctx.setScreen('battle');
}

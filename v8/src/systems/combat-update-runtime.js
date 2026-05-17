export function createCombatUpdateRuntime(ctx) {
  function update() {
    const arena = ctx.arenaState();
    if (arena && arena.pauseMenu) return;

    ctx.advanceFrame();
    ctx.tickFlashTimer();
    ctx.tickScreenShake();

    if (ctx.screenState() !== 'battle') return;

    ctx.updateBossEngagement();
    ctx.replaceUnits(ctx.compactRemovedCombatUnits(ctx.units()));

    const inArenaBattle = ctx.screenState() === 'battle' && arena && arena.phase;
    ctx.tickPlayerCombatUnits({
      units: ctx.units(),
      isArenaBattle: inArenaBattle,
      updateArenaUnit: ctx.updateArenaUnit,
      updateLegacyUnit: ctx.updateLegacyUnit,
      resolvePlayerOverlaps: ctx.resolvePlayerOverlaps
    });

    ctx.tickEnemyCombatUnits({
      enemies: ctx.enemies(),
      updateCharmedEnemy: ctx.updateCharmedEnemy,
      updateEnemy: ctx.updateEnemy,
      updateBoss: ctx.updateBoss,
      tickEnemyPostUpdateStatusEffects: ctx.tickEnemyPostUpdateStatusEffects,
      postEnemyStatusContext: ctx.postEnemyStatusContext()
    });

    if (ctx.screenState() === 'battle') {
      ctx.updateWaves();
      ctx.updateCastle(ctx.playerCastle());
      ctx.tickActiveSkills(ctx.activeSkillsContext());
    }

    ctx.tickCombatTransients();
    ctx.clearDeadVodka();
  }

  return { update };
}

import { createBattleSceneRuntime } from '../render/battle-scene-runtime.js?v=20260522-clean-shield-vfx';

export function createBattleSceneComposition(deps) {
  const states = deps.states;
  const battleState = states.battleState;
  const campaignState = states.campaignState;
  const uiState = states.uiState;
  const combatRuntimeState = states.combatRuntimeState;
  const helpers = deps.helpers;
  const drawers = deps.drawers;

  return createBattleSceneRuntime({
    ctx: deps.ctx,
    view: () => {
      const layout = deps.layoutView();
      return {
        state: deps.screenState(),
        codexOpen: uiState.codexOpen,
        arena: deps.arenaState(),
        bossRef: campaignState.bossRef,
        screenShake: uiState.screenShake,
        arenaTop: layout.arenaTop,
        arenaTopBase: deps.arenaTopBase,
        arenaBot: layout.arenaBot,
        width: layout.width,
        height: layout.height,
        playerCastle: campaignState.playerCastle,
        frame: combatRuntimeState.frame,
        enemies: battleState.enemies,
        units: battleState.units,
        tickHz: deps.tickHz
      };
    },
    setArenaTop: helpers.setArenaTop,
    randomRange: helpers.randomRange,
    emitParticle: helpers.emitParticle,
    dist: helpers.distance,
    applyRenderQuality: helpers.applyRenderQuality,
    recomputeGrid: helpers.recomputeGrid,
    ...drawers
  });
}

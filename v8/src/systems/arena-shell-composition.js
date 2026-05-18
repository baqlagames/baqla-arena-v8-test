import { createArenaShellRuntime } from './arena-shell-runtime.js';

export function createArenaShellComposition(deps) {
  const states = deps.states;
  const economyState = states.economyState;
  const combatRuntimeState = states.combatRuntimeState;
  const runtime = createArenaShellRuntime({
    canvas: deps.canvas,
    ctx: deps.ctx,
    tickHz: deps.tickHz,
    inputHandlers: deps.inputHandlers,
    getCanvasXY: deps.getCanvasXY,
    update: deps.update,
    render: deps.render,
    view: () => {
      const layout = deps.layoutView();
      return {
        width: layout.width,
        state: deps.screenState(),
        arena: deps.arenaState(),
        frame: combatRuntimeState.frame
      };
    },
    requestAnimationFrame: fn => requestAnimationFrame(fn),
    performanceNow: () => performance.now()
  });

  runtime.installInputHandlers();
  runtime.installPlaytest({
    view: () => {
      const layout = deps.layoutView();
      return {
        state: deps.screenState(),
        arena: deps.arenaState(),
        width: layout.width,
        height: layout.height,
        gold: economyState.gold,
        maxUnitLevel: deps.maxUnitLevel
      };
    },
    grid: deps.playtestGrid,
    stageCount: deps.stageCount,
    setGold: deps.setGold,
    setCurrentStageIdx: deps.setCurrentStageIdx,
    setCurrentStage: deps.setCurrentStage,
    startStage: deps.startStage,
    cellCenter: deps.cellCenter
  });

  return runtime;
}

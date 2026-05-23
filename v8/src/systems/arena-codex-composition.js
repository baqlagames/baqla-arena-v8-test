import { createArenaCodexRuntime } from './arena-codex-runtime.js?v=20260523-dragon-judgment-hud';

export function createArenaCodexComposition(deps) {
  const states = deps.states;
  const progressState = states.progressState || {};
  const uiState = states.uiState;
  const squadState = states.squadState;
  const combatRuntimeState = states.combatRuntimeState;
  const helpers = deps.helpers;

  return createArenaCodexRuntime({
    ctx: deps.ctx,
    playerUnits: deps.playerUnits,
    vodka: deps.vodka,
    unitBranches: deps.unitBranches,
    attackTypeByUnit: deps.attackTypeByUnit,
    baseSignatures: deps.baseSignatures,
    branchSignatures: deps.branchSignatures,
    maxUnitLevel: deps.maxUnitLevel,
    view: () => {
      const layout = deps.layoutView();
      return {
        width: layout.width,
        height: layout.height,
        codexUnit: uiState.codexUnit,
        codexScroll: uiState.codexScroll,
        foughtBosses: progressState.foughtBosses
      };
    },
    detailView: () => {
      const layout = deps.layoutView();
      return {
        width: layout.width,
        height: layout.height,
        arena: deps.arenaState(),
        codexUnit: uiState.codexUnit,
        codexScroll: uiState.codexScroll,
        unitLevels: squadState.unitLevels,
        vodkaLevel: squadState.vodkaLevel,
        frame: combatRuntimeState.frame,
        foughtBosses: progressState.foughtBosses,
        signatures: typeof deps.signatures === 'function' ? deps.signatures() : deps.signatures,
        drawFns: deps.drawFns
      };
    },
    threatTagColor: helpers.threatTagColor,
    rgba: helpers.rgba,
    getStats: helpers.getStats,
    baseSpec: helpers.baseSpec,
    isCapstoneLevel: helpers.isCapstoneLevel,
    drawPillBtn: helpers.drawPillBtn,
    drawVodka: helpers.drawVodka
  });
}

import { createArenaScreenUiRuntime } from './arena-screen-ui-runtime.js?v=20260522-clean-shield-vfx';

export function createArenaScreenUiComposition(deps) {
  const states = deps.states;
  const progressState = states.progressState;
  const battleState = states.battleState;
  const economyState = states.economyState;
  const squadState = states.squadState;
  const campaignState = states.campaignState;
  const uiState = states.uiState;
  const combatRuntimeState = states.combatRuntimeState;
  const helpers = deps.helpers;
  const layoutView = deps.layoutView;
  const arenaState = deps.arenaState;
  const arenaViewMode = deps.arenaViewMode;
  const isPaintedPlacementActive = deps.isPaintedPlacementActive;

  const runtime = createArenaScreenUiRuntime({
    ctx: deps.ctx,
    buttonDrawers: deps.buttonDrawers,
    playerUnits: deps.playerUnits,
    vodka: deps.vodka,
    stages: deps.stages,
    abilities: deps.abilities,
    perks: deps.perks,
    attackTypeByUnit: deps.attackTypeByUnit,
    unitBranches: deps.unitBranches,
    maxUnitLevel: deps.maxUnitLevel,
    baseSignatures: deps.baseSignatures,
    branchSignatures: deps.branchSignatures,
    tickHz: deps.tickHz,
    bloodlustCost: deps.bloodlustCost,
    tranquilityCost: deps.tranquilityCost,
    gridCols: deps.gridCols,
    gridRows: deps.gridRows,
    gridX: deps.arenaGridRuntime.gridX,
    gridY: deps.arenaGridRuntime.gridY,
    cellW: deps.arenaGridRuntime.cellW,
    cellH: deps.arenaGridRuntime.cellH,
    screenFlowView: () => {
      const layout = layoutView();
      const arena = arenaState();
      return {
        width: layout.width, height: layout.height, frame: combatRuntimeState.frame,
        maxStage: progressState.maxStage,
        beans: progressState.beans,
        stageStars: progressState.stageStars,
        currentStage: campaignState.currentStage,
        currentStageIdx: campaignState.currentStageIdx,
        arena, deckPickStage: squadState.deckPickStage,
        selectedSpells: progressState.selectedSpells,
        spellPickStage: squadState.spellPickStage,
        deckPickScroll: uiState.deckPickScroll,
        spellPickScroll: uiState.spellPickScroll,
        perkPickScroll: uiState.perkPickScroll,
        unlockedPerks: progressState.unlockedPerks,
        selectedPerks: progressState.selectedPerks
      };
    },
    stageSelectScroll: () => uiState.stageSelectScroll,
    drawVodka: helpers.drawVodka,
    drawPillBtn: helpers.drawPillBtn,
    starText: helpers.starText,
    stageStarCriteria: helpers.stageStarCriteria,
    getUnitStats: helpers.getUnitStats,
    wrapText: helpers.wrapText,
    perkSlotCount: helpers.perkSlotCount,
    computeStageStars: helpers.computeStageStars,
    shake: helpers.shake,
    levelUpSound: helpers.levelUpSound,
    battleHudView: () => {
      const layout = layoutView();
      const arena = arenaState();
      return {
        width: layout.width, height: layout.height, arenaTop: layout.arenaTop, arenaBot: layout.arenaBot,
        clashCamera: deps.arenaSceneRenderer.clashCamera,
        arenaViewMode: arenaViewMode(),
        arena, currentStage: campaignState.currentStage,
        selectedSpells: progressState.selectedSpells,
        abilityCooldowns: squadState.abilityCooldowns,
        abilityUsed: squadState.abilityUsed,
        abilityTargeting: uiState.abilityTargeting,
        bossWarning: campaignState.bossWarning,
        stageStartTimer: campaignState.stageStartTimer,
        frame: combatRuntimeState.frame,
        combatStats: combatRuntimeState.combatStats,
        gold: economyState.gold, playerCastle: campaignState.playerCastle, enemies: battleState.enemies, bossRef: campaignState.bossRef,
        soundMuted: deps.arenaAudio.isMuted()
      };
    },
    managePanelView: () => {
      const layout = layoutView();
      return {
        width: layout.width, height: layout.height, arena: arenaState(), gold: economyState.gold,
        frame: combatRuntimeState.frame, drawFns: deps.drawFns, signatures: deps.signatures
      };
    },
    pickerView: () => {
      const layout = layoutView();
      return {
        width: layout.width, height: layout.height, arena: arenaState(),
        frame: combatRuntimeState.frame, drawFns: deps.drawFns
      };
    },
    arenaState,
    rootOrder: () => deps.roleProgression.rootOrder,
    roleRoot: helpers.roleRoot,
    canPlace: helpers.canPlace,
    unitGoldCost: helpers.unitGoldCost,
    getStats: helpers.getStats,
    placeUnit: helpers.placeUnit,
    inRect: helpers.inRect,
    showFlash: helpers.showFlash,
    getTouchAccumY: helpers.getTouchAccumY,
    setTouchAccumY: helpers.setTouchAccumY,
    sellRefundForCell: helpers.sellRefundForCell,
    isRoleRootCell: helpers.isRoleRootCell,
    roleSpecs: helpers.roleSpecs,
    specById: helpers.specById,
    cellPathMeta: helpers.cellPathMeta,
    drawSkillSlots: helpers.drawSkillSlots,
    upgradeCostFor: helpers.upgradeCostFor,
    pathUpgradeCost: helpers.pathUpgradeCost,
    pathDetails: helpers.pathDetails,
    baseSpec: helpers.baseSpec,
    sigDisplayFc: helpers.sigDisplayFc,
    sigDisplayCd: helpers.sigDisplayCd,
    baseHeadline: helpers.baseHeadline,
    branchHeadline: helpers.branchHeadline,
    nextUnlockBrief: helpers.nextUnlockBrief,
    wrapTextClamped: helpers.wrapTextClamped,
    upgradeCell: helpers.upgradeCell,
    sellCell: helpers.sellCell,
    setBossWarning: helpers.setBossWarning,
    getRoundCombatReport: helpers.getRoundCombatReport,
    getStageCombatReport: helpers.getStageCombatReport,
    threatPanelHeight: helpers.threatPanelHeight,
    statsFormat: helpers.statsFormat,
    currentStageRounds: helpers.currentStageRounds,
    cellScreenQuad: (col, row) => isPaintedPlacementActive() ? deps.arenaGridRuntime.cellScreenQuad(col, row) : null,
    cellScreenPoint: (col, row) => isPaintedPlacementActive() ? deps.arenaGridRuntime.cellScreenPoint(col, row) : null,
    drawThreatsPanel: helpers.drawThreatsPanel,
    isCapstoneLevel: helpers.isCapstoneLevel,
    pathCamQuad: helpers.pathCamQuad,
    camPoint: helpers.camPoint,
    camDepthScaleAt: helpers.camDepthScaleAt
  });

  return runtime;
}

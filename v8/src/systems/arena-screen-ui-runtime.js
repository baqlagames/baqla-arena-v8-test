import { createScreenFlowRenderer } from '../ui/screen-flow-runtime.js';
import { drawBattleHudOverlay } from '../ui/battle-hud.js';
import { drawDesktopBattleControls, drawMobileBattleControls } from '../ui/battle-controls.js';
import { drawBattleTopChrome } from '../ui/battle-topbar.js';
import { drawBossCastBar as drawEncounterBossCastBar, drawBossHpBar as drawEncounterBossHpBar, drawLieutenantsBar as drawEncounterLieutenantsBar, drawPurifyBar as drawEncounterPurifyBar } from '../ui/encounter-bars.js?v=20260522-round-bonus';
import { drawPauseMenu } from '../ui/pause-menu.js';
import { drawCombatRoundChip as drawRoundReportChip } from '../ui/round-report.js';
import { drawCombatReportPanel as drawResultCombatReportPanel, resultButtonRects as getResultButtonRects } from '../ui/results.js';
import { drawBuildGrid, drawProjectedBuildGrid as renderProjectedBuildGrid } from '../render/grid.js';
import { drawHudIcon as renderDrawHudIcon, drawHudMeter as renderDrawHudMeter, drawHudPanel as renderDrawHudPanel, fitCanvasText as renderFitCanvasText, parseHudColor as renderHudRgb, shadeHudColor as renderHudShade } from '../render/primitives.js';
import { createArenaUiRuntime } from './arena-ui-runtime.js';

export function createArenaScreenUiRuntime(deps = {}) {
  const buttonDrawers = deps.buttonDrawers || {};
  const shake = typeof deps.shake === 'function' ? deps.shake : () => {};

  function drawBigBtn(x, y, w, h, label, bg, subtitle) {
    buttonDrawers.drawBigBtn(x, y, w, h, label, bg, subtitle);
  }

  let arenaUiRuntime = null;
  const screenFlowRenderer = createScreenFlowRenderer({
    ctx: deps.ctx,
    playerUnits: deps.playerUnits,
    vodka: deps.vodka,
    stages: deps.stages,
    abilities: deps.abilities,
    perks: deps.perks,
    view: deps.screenFlowView,
    stageSelectScroll: deps.stageSelectScroll,
    drawVodka: deps.drawVodka,
    drawBigBtn,
    drawPillBtn: deps.drawPillBtn,
    starText: deps.starText,
    stageStarCriteria: deps.stageStarCriteria,
    getUnitStats: deps.getUnitStats,
    wrapText: deps.wrapText,
    perkSlotCount: deps.perkSlotCount,
    computeStageStars: deps.computeStageStars,
    resultButtonRects: (...args) => arenaUiRuntime.arena_resultButtonRects(...args),
    drawRoundCombatReport: (...args) => arenaUiRuntime.arena_drawRoundCombatReport(...args),
    drawStageCombatReport: (...args) => arenaUiRuntime.arena_drawStageCombatReport(...args),
    shake,
    levelUpSound: deps.levelUpSound,
  });

  arenaUiRuntime = createArenaUiRuntime({
    ctx: deps.ctx,
    abilities: deps.abilities,
    playerUnits: deps.playerUnits,
    vodka: deps.vodka,
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
    gridX: deps.gridX,
    gridY: deps.gridY,
    cellW: deps.cellW,
    cellH: deps.cellH,
    battleHudView: deps.battleHudView,
    managePanelView: deps.managePanelView,
    pickerView: deps.pickerView,
    arenaState: deps.arenaState,
    rootOrder: deps.rootOrder,
    roleRoot: deps.roleRoot,
    canPlace: deps.canPlace,
    unitGoldCost: deps.unitGoldCost,
    getStats: deps.getStats,
    placeUnit: deps.placeUnit,
    inRect: deps.inRect,
    showFlash: deps.showFlash,
    getTouchAccumY: deps.getTouchAccumY,
    setTouchAccumY: deps.setTouchAccumY,
    sellRefundForCell: deps.sellRefundForCell,
    isRoleRootCell: deps.isRoleRootCell,
    roleSpecs: deps.roleSpecs,
    specById: deps.specById,
    cellPathMeta: deps.cellPathMeta,
    drawSkillSlots: deps.drawSkillSlots,
    upgradeCostFor: deps.upgradeCostFor,
    pathUpgradeCost: deps.pathUpgradeCost,
    pathDetails: deps.pathDetails,
    baseSpec: deps.baseSpec,
    sigDisplayFc: deps.sigDisplayFc,
    sigDisplayCd: deps.sigDisplayCd,
    baseHeadline: deps.baseHeadline,
    branchHeadline: deps.branchHeadline,
    nextUnlockBrief: deps.nextUnlockBrief,
    wrapTextClamped: deps.wrapTextClamped,
    upgradeCell: deps.upgradeCell,
    sellCell: deps.sellCell,
    setBossWarning: deps.setBossWarning,
    drawBattleHudOverlay,
    renderProjectedBuildGrid,
    drawBuildGrid,
    drawEncounterPurifyBar,
    drawEncounterLieutenantsBar,
    drawEncounterBossHpBar,
    drawEncounterBossCastBar,
    renderHudRgb,
    renderHudShade,
    renderDrawHudPanel,
    renderFitCanvasText,
    renderDrawHudMeter,
    renderDrawHudIcon,
    drawRoundReportChip,
    getResultButtonRects,
    drawResultCombatReportPanel,
    getRoundCombatReport: deps.getRoundCombatReport,
    getStageCombatReport: deps.getStageCombatReport,
    drawMobileBattleControls,
    drawBattleTopChrome,
    drawDesktopBattleControls,
    drawPauseMenu,
    threatPanelHeight: deps.threatPanelHeight,
    statsFormat: deps.statsFormat,
    currentStageRounds: deps.currentStageRounds,
    cellScreenQuad: deps.cellScreenQuad,
    cellScreenPoint: deps.cellScreenPoint,
    drawThreatsPanel: deps.drawThreatsPanel,
    isCapstoneLevel: deps.isCapstoneLevel,
    pathCamQuad: deps.pathCamQuad,
    camPoint: deps.camPoint,
    camDepthScaleAt: deps.camDepthScaleAt,
  });

  return {
    drawMenu: (...args) => screenFlowRenderer.drawMenu(...args),
    drawStageSelect: (...args) => screenFlowRenderer.drawStageSelect(...args),
    drawStageBrief: (...args) => screenFlowRenderer.drawStageBrief(...args),
    drawDeckPick: (...args) => screenFlowRenderer.drawDeckPick(...args),
    drawSpellPick: (...args) => screenFlowRenderer.drawSpellPick(...args),
    drawPerkPick: (...args) => screenFlowRenderer.drawPerkPick(...args),
    drawWinScreen: (...args) => screenFlowRenderer.drawWinScreen(...args),
    drawLoseScreen: (...args) => screenFlowRenderer.drawLoseScreen(...args),
    arena_drawGrid: (...args) => arenaUiRuntime.arena_drawGrid(...args),
    arena_resultButtonRects: (...args) => arenaUiRuntime.arena_resultButtonRects(...args),
    arena_drawRoundCombatReport: (...args) => arenaUiRuntime.arena_drawRoundCombatReport(...args),
    arena_drawStageCombatReport: (...args) => arenaUiRuntime.arena_drawStageCombatReport(...args),
    arena_drawHud: (...args) => arenaUiRuntime.arena_drawHud(...args),
    arena_pickerMaxScroll: (...args) => arenaUiRuntime.pickerMaxScroll(...args),
    arena_handlePickerClick: (...args) => arenaUiRuntime.handlePickerClick(...args),
    arena_handleManagePanelClick: (...args) => arenaUiRuntime.handleManagePanelClick(...args),
  };
}

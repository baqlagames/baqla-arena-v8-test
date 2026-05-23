import { ARENA_ARMOR_MATRIX, ARENA_DEFENSE_MATRIX, ARENA_PLAYER_ARMOR_TYPE } from '../data/tuning.js';
import { ARENA_SPEC_HALO_COLORS } from '../data/roles.js';
import { drawCodexScreen } from '../ui/codex-screen.js';
import { createCodexDetailRuntime } from '../ui/codex-detail-runtime.js?v=20260523-dragon-judgment-hud';
import { currentUnitPassives, signatureDisplayCooldown, signatureDisplayFirstCast, signatureIdForUnit } from './unit-passives.js';

export function createArenaCodexRuntime(deps = {}) {
  const codexDetailRuntime = createCodexDetailRuntime({
    ctx: deps.ctx,
    playerUnits: deps.playerUnits,
    vodka: deps.vodka,
    unitBranches: deps.unitBranches,
    attackTypeByUnit: deps.attackTypeByUnit,
    armorMatrix: ARENA_ARMOR_MATRIX,
    defenseMatrix: ARENA_DEFENSE_MATRIX,
    playerArmorType: ARENA_PLAYER_ARMOR_TYPE,
    baseSignatures: deps.baseSignatures,
    branchSignatures: deps.branchSignatures,
    specHaloColors: ARENA_SPEC_HALO_COLORS,
    maxUnitLevel: deps.maxUnitLevel,
    view: deps.detailView,
    threatTagColor: deps.threatTagColor,
    rgba: deps.rgba,
    getStats: deps.getStats,
    currentUnitPassives,
    signatureDisplayCooldown,
    signatureDisplayFirstCast,
    signatureIdForUnit,
    baseSpec: deps.baseSpec,
    isCapstoneLevel: deps.isCapstoneLevel,
    drawPillBtn: deps.drawPillBtn,
    drawVodka: deps.drawVodka,
  });

  function drawCodex() {
    const v = deps.view();
    drawCodexScreen(deps.ctx, {
      width: v.width,
      height: v.height,
      codexUnit: v.codexUnit,
      codexScroll: v.codexScroll,
      foughtBosses: v.foughtBosses,
      playerUnits: deps.playerUnits,
      vodka: deps.vodka,
      unitBranches: deps.unitBranches,
      drawPillButton: deps.drawPillBtn,
      drawThreatsLegend: (...args) => codexDetailRuntime.drawCodexThreatsLegend(...args),
      drawArmorMatrix: (...args) => codexDetailRuntime.drawCodexArmorMatrix(...args),
      drawBossMechanics: (...args) => codexDetailRuntime.drawCodexBossMechanics(...args),
      drawDetail: (...args) => codexDetailRuntime.drawCodexDetail(...args),
    });
  }

  return {
    drawCodex,
    drawCodexThreatsLegend: (...args) => codexDetailRuntime.drawCodexThreatsLegend(...args),
    drawCodexArmorMatrix: (...args) => codexDetailRuntime.drawCodexArmorMatrix(...args),
    drawCodexBossMechanics: (...args) => codexDetailRuntime.drawCodexBossMechanics(...args),
    drawCodexDetail: (...args) => codexDetailRuntime.drawCodexDetail(...args),
    wrapText: (...args) => codexDetailRuntime.wrapText(...args),
    arena_wrapTextClamped: (...args) => codexDetailRuntime.arena_wrapTextClamped(...args),
    arena_nextUnlockBrief: (...args) => codexDetailRuntime.arena_nextUnlockBrief(...args),
    arena_sigDisplayCd: (...args) => codexDetailRuntime.arena_sigDisplayCd(...args),
    arena_sigDisplayFc: (...args) => codexDetailRuntime.arena_sigDisplayFc(...args),
    arena_branchHeadline: (...args) => codexDetailRuntime.arena_branchHeadline(...args),
    arena_baseHeadline: (...args) => codexDetailRuntime.arena_baseHeadline(...args),
    arena_drawSkillSlots: (...args) => codexDetailRuntime.arena_drawSkillSlots(...args),
  };
}

import { ARENA_ABILITIES } from '../data/abilities.js';
import { ARENA_PERKS } from '../data/perks.js';
import { PLAYER_UNITS } from '../data/units.js';
import { STAGES } from '../data/stages.js';
import { createArenaInputHandlers } from '../ui/arena-input-handlers.js';
import { perkPickMaxScroll as getPerkPickMaxScroll } from '../ui/perk-picker.js';
import { createScrollRoutingRuntime } from '../ui/scroll-routing.js';

export function createArenaInputRuntime(deps = {}) {
  const uiState = deps.uiState || {};
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});

  const scrollRoutingRuntime = createScrollRoutingRuntime({
    view: () => {
      const v = view();
      return {
        height: v.H,
        arena: v.arena,
        codexScroll: v.codexScroll,
        stageSelectScroll: v.stageSelectScroll,
        deckPickScroll: v.deckPickScroll,
        spellPickScroll: v.spellPickScroll,
        perkPickScroll: v.perkPickScroll,
        playerUnitCount: PLAYER_UNITS.length,
        abilityCount: ARENA_ABILITIES.length,
        perkCount: ARENA_PERKS.length,
      };
    },
    perkPickMaxScroll: getPerkPickMaxScroll,
    unitPickerMaxScroll: deps.pickerMaxScroll,
    setCodexScroll: deps.setCodexScroll,
    setStageSelectScroll: deps.setStageSelectScroll,
    setDeckPickScroll: deps.setDeckPickScroll,
    setSpellPickScroll: deps.setSpellPickScroll,
    setPerkPickScroll: deps.setPerkPickScroll,
  });

  let touchStartY = uiState.touchStartY || 0;
  let touchAccumY = uiState.touchAccumY || 0;
  function setTouchStartY(value) {
    touchStartY = value;
    uiState.touchStartY = value;
    return touchStartY;
  }
  function setTouchAccumY(value) {
    touchAccumY = value;
    uiState.touchAccumY = value;
    return touchAccumY;
  }

  const handlers = createArenaInputHandlers({
    view,
    inRect: deps.inRect,
    dist: deps.distance,
    stages: STAGES,
    playerUnits: PLAYER_UNITS,
    abilities: ARENA_ABILITIES,
    perks: ARENA_PERKS,
    perkSlotCount: deps.perkSlotCount,
    tickHz: deps.tickHz,
    arenaBounds: deps.arenaBounds,
    setScreen: deps.setScreen,
    setStageSelectScroll: deps.setStageSelectScroll,
    setCodexOpen: deps.setCodexOpen,
    setCodexUnit: deps.setCodexUnit,
    setCodexScroll: deps.setCodexScroll,
    setCurrentStageIdx: deps.setCurrentStageIdx,
    setCurrentStage: deps.setCurrentStage,
    startStage: deps.startStage,
    setSelectedDeck: deps.setSelectedDeck,
    setDeckPickStage: deps.setDeckPickStage,
    setDeckPickScroll: deps.setDeckPickScroll,
    setSpellPickStage: deps.setSpellPickStage,
    setSpellPickScroll: deps.setSpellPickScroll,
    setPerkPickScroll: deps.setPerkPickScroll,
    saveSave: deps.saveSave,
    setSelectedSpells: deps.setSelectedSpells,
    resultButtonRects: deps.resultButtonRects,
    unlockPerk: deps.unlockPerk,
    togglePerk: deps.togglePerk,
    claimDoubleBeansReward: deps.claimDoubleBeansReward,
    claimSecondChanceRetry: deps.claimSecondChanceRetry,
    levelUpSound: deps.levelUpSound,
    toggleSound: deps.toggleSound,
    handlePickerClick: deps.handlePickerClick,
    handleManagePanelClick: deps.handleManagePanelClick,
    handleSpellButton: deps.handleSpellButton,
    castAbilityAt: deps.castAbilityAt,
    activateBloodlust: deps.activateBloodlust,
    activateTranquility: deps.activateTranquility,
    addGold: deps.addGold,
    showFlash: deps.showFlash,
    xyToCell: deps.xyToCell,
    screenToWorldPoint: deps.screenToWorldPoint,
    toggleArenaViewMode: deps.toggleArenaViewMode,
    deployVodka: deps.deployVodka,
    upgradeBtnRect: deps.upgradeBtnRect,
    tryUpgradeUnit: deps.tryUpgradeUnit,
    cardRowLayout: deps.cardRowLayout,
    deployUnit: deps.deployUnit,
    setSelectedCard: deps.setSelectedCard,
    scrollMaxForTarget: target => scrollRoutingRuntime.maxForTarget(target),
    scrollValueForTarget: target => scrollRoutingRuntime.valueForTarget(target),
    setScrollValueForTarget: (target, value) => scrollRoutingRuntime.setValueForTarget(target, value),
    touchStartY: () => touchStartY,
    setTouchStartY,
    touchAccumY: () => touchAccumY,
    setTouchAccumY,
  });

  return {
    handlers,
    scrollMaxForTarget: target => scrollRoutingRuntime.maxForTarget(target),
    scrollValueForTarget: target => scrollRoutingRuntime.valueForTarget(target),
    setScrollValueForTarget: (target, value) => scrollRoutingRuntime.setValueForTarget(target, value),
    touchStartY: () => touchStartY,
    setTouchStartY,
    touchAccumY: () => touchAccumY,
    setTouchAccumY,
  };
}

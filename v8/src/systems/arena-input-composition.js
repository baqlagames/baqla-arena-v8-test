import { createArenaInputRuntime } from './arena-input-runtime.js';

export function createArenaInputComposition(deps) {
  const states = deps.states;
  const progressState = states.progressState;
  const economyState = states.economyState;
  const squadState = states.squadState;
  const campaignState = states.campaignState;
  const uiState = states.uiState;
  const combatRuntimeState = states.combatRuntimeState;
  const helpers = deps.helpers;
  const setters = deps.setters;

  return createArenaInputRuntime({
    uiState,
    tickHz: deps.tickHz,
    view: () => {
      const layout = deps.layoutView();
      const heroButton = deps.heroButton();
      return {
        W: layout.width,
        H: layout.height,
        state: deps.screenState(),
        maxStage: progressState.maxStage,
        stageSelectScroll: uiState.stageSelectScroll,
        currentStageIdx: campaignState.currentStageIdx,
        currentStage: campaignState.currentStage,
        deckPickStage: squadState.deckPickStage,
        selectedSpells: progressState.selectedSpells,
        spellPickStage: squadState.spellPickStage,
        deckPickScroll: uiState.deckPickScroll,
        spellPickScroll: uiState.spellPickScroll,
        perkPickScroll: uiState.perkPickScroll,
        beans: progressState.beans,
        unlockedPerks: progressState.unlockedPerks,
        selectedPerks: progressState.selectedPerks,
        abilityTargeting: uiState.abilityTargeting,
        selectedDeck: progressState.selectedDeck,
        arena: deps.arenaState(),
        frame: combatRuntimeState.frame,
        cardHand: squadState.cardHand,
        selectedCard: uiState.selectedCard,
        HERO_BTN: heroButton,
        heroButton,
        vodkaUnit: squadState.vodkaUnit,
        vodkaDead: squadState.vodkaDead,
        vodkaDeployCD: squadState.vodkaDeployCD,
        codexOpen: uiState.codexOpen,
        codexUnit: uiState.codexUnit,
        codexScroll: uiState.codexScroll
      };
    },
    inRect: helpers.inRect,
    distance: helpers.distance,
    perkSlotCount: helpers.perkSlotCount,
    arenaBounds: {
      get left() { return deps.boundsView().left; },
      get right() { return deps.boundsView().right; },
      get deployTop() { return deps.boundsView().deployTop; },
      get bottom() { return deps.boundsView().bottom; }
    },
    setScreen: setters.setScreen,
    setStageSelectScroll: setters.setStageSelectScroll,
    setCodexOpen: setters.setCodexOpen,
    setCodexUnit: setters.setCodexUnit,
    setCodexScroll: setters.setCodexScroll,
    setCurrentStageIdx: setters.setCurrentStageIdx,
    setCurrentStage: setters.setCurrentStage,
    startStage: helpers.startStage,
    setSelectedDeck: setters.setSelectedDeck,
    setDeckPickStage: setters.setDeckPickStage,
    setDeckPickScroll: setters.setDeckPickScroll,
    setSpellPickStage: setters.setSpellPickStage,
    setSpellPickScroll: setters.setSpellPickScroll,
    setPerkPickScroll: setters.setPerkPickScroll,
    saveSave: helpers.saveSave,
    setSelectedSpells: setters.setSelectedSpells,
    resultButtonRects: helpers.resultButtonRects,
    unlockPerk: helpers.unlockPerk,
    togglePerk: helpers.togglePerk,
    claimDoubleBeansReward: helpers.claimDoubleBeansReward,
    claimSecondChanceRetry: helpers.claimSecondChanceRetry,
    levelUpSound: helpers.levelUpSound,
    toggleSound: helpers.toggleSound,
    handlePickerClick: helpers.handlePickerClick,
    handleManagePanelClick: helpers.handleManagePanelClick,
    handleSpellButton: helpers.handleSpellButton,
    castAbilityAt: helpers.castAbilityAt,
    activateBloodlust: helpers.activateBloodlust,
    activateTranquility: helpers.activateTranquility,
    addGold: setters.addGold,
    showFlash: helpers.showFlash,
    xyToCell: helpers.xyToCell,
    screenToWorldPoint: helpers.screenToWorldPoint,
    toggleArenaViewMode: helpers.toggleArenaViewMode,
    deployVodka: helpers.deployVodka,
    upgradeBtnRect: helpers.upgradeBtnRect,
    tryUpgradeUnit: helpers.tryUpgradeUnit,
    cardRowLayout: helpers.cardRowLayout,
    deployUnit: helpers.deployUnit,
    setSelectedCard: setters.setSelectedCard,
    pickerMaxScroll: helpers.pickerMaxScroll
  });
}

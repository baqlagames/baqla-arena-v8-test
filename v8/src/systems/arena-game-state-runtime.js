export function createArenaGameStateRuntime(gameState) {
  const progressState = gameState.progress;
  const battleState = gameState.battle;
  const economyState = gameState.economy;
  const squadState = gameState.squad;
  const campaignState = gameState.campaign;
  const uiState = gameState.ui;
  const combatRuntimeState = gameState.combatRuntime;
  const environmentState = gameState.environment;

  function setScreen(value) {
    gameState.screen = value;
    return gameState.screen;
  }

  function setMaxStage(value) { progressState.maxStage = value; return progressState.maxStage; }
  function setStageStars(value) { progressState.stageStars = value; return progressState.stageStars; }
  function setSelectedDeck(value) { progressState.selectedDeck = value; return progressState.selectedDeck; }
  function setSelectedSpells(value) { progressState.selectedSpells = value; return progressState.selectedSpells; }
  function setBeans(value) { progressState.beans = Math.max(0, Math.floor(value || 0)); return progressState.beans; }
  function addBeans(value) { return setBeans(progressState.beans + value); }
  function setUnlockedPerks(value) { progressState.unlockedPerks = value; return progressState.unlockedPerks; }
  function setSelectedPerks(value) { progressState.selectedPerks = value; return progressState.selectedPerks; }
  function setDefeatedBosses(value) { progressState.defeatedBosses = Array.isArray(value) ? value : []; return progressState.defeatedBosses; }

  function setCrystal(value) { economyState.crystal = value; return economyState.crystal; }
  function addCrystal(value) { return setCrystal(Math.min(economyState.maxCrystal, economyState.crystal + value)); }
  function setGold(value) { economyState.gold = value; return economyState.gold; }
  function addGold(value) { return setGold(economyState.gold + value); }
  function setStageGold(value) { economyState.stageGold = value; return economyState.stageGold; }
  function addStageGold(value) { return setStageGold(economyState.stageGold + value); }

  function setVodkaUnit(value) { squadState.vodkaUnit = value; return squadState.vodkaUnit; }
  function setVodkaDeployCD(value) { squadState.vodkaDeployCD = value; return squadState.vodkaDeployCD; }
  function setVodkaDead(value) { squadState.vodkaDead = value; return squadState.vodkaDead; }
  function setVodkaRespawn(value) { squadState.vodkaRespawn = value; return squadState.vodkaRespawn; }
  function setCardHand(value) { squadState.cardHand = value; return squadState.cardHand; }
  function setDeckPickStage(value) { squadState.deckPickStage = value; return squadState.deckPickStage; }
  function setSpellPickStage(value) { squadState.spellPickStage = value; return squadState.spellPickStage; }
  function setAbilityUsed(value) { squadState.abilityUsed = value; return squadState.abilityUsed; }

  function setCurrentStage(value) { campaignState.currentStage = value; return campaignState.currentStage; }
  function setCurrentStageIdx(value) { campaignState.currentStageIdx = value; return campaignState.currentStageIdx; }
  function setPlayerCastle(value) { campaignState.playerCastle = value; return campaignState.playerCastle; }
  function setEnemyCastle(value) { campaignState.enemyCastle = value; return campaignState.enemyCastle; }
  function setBossRef(value) { campaignState.bossRef = value; return campaignState.bossRef; }
  function setBossSpawned(value) { campaignState.bossSpawned = value; return campaignState.bossSpawned; }
  function setStageOver(value) { campaignState.stageOver = value; return campaignState.stageOver; }
  function setStageWon(value) { campaignState.stageWon = value; return campaignState.stageWon; }
  function setCrystalNodes(value) { campaignState.crystalNodes = value; return campaignState.crystalNodes; }
  function setTowers(value) { campaignState.towers = value; return campaignState.towers; }
  function setBossWarning(value) { campaignState.bossWarning = value; return campaignState.bossWarning; }

  function advanceFrame() { combatRuntimeState.frame++; }
  function setCombatStats(value) { combatRuntimeState.combatStats = value; return combatRuntimeState.combatStats; }
  function setWeatherParticles(value) { environmentState.weatherParticles = value; return environmentState.weatherParticles; }

  function setSelectedCard(value) { uiState.selectedCard = value; return uiState.selectedCard; }
  function setStageSelectScroll(value) { uiState.stageSelectScroll = value; return uiState.stageSelectScroll; }
  function setDeckPickScroll(value) { uiState.deckPickScroll = value; return uiState.deckPickScroll; }
  function setSpellPickScroll(value) { uiState.spellPickScroll = value; return uiState.spellPickScroll; }
  function setPerkPickScroll(value) { uiState.perkPickScroll = value; return uiState.perkPickScroll; }
  function setCodexOpen(value) { uiState.codexOpen = value; return uiState.codexOpen; }
  function setCodexScroll(value) { uiState.codexScroll = value; return uiState.codexScroll; }
  function setCodexUnit(value) { uiState.codexUnit = value; return uiState.codexUnit; }
  function setScreenShake(value) { uiState.screenShake = value; return uiState.screenShake; }
  function addScreenShake(value) { return setScreenShake(Math.max(uiState.screenShake || 0, value)); }
  function setSignatureBanner(value) { uiState.signatureBanner = value; return uiState.signatureBanner; }
  function setAbilityTargeting(value) { uiState.abilityTargeting = value; return uiState.abilityTargeting; }

  return {
    progressState,
    battleState,
    economyState,
    squadState,
    campaignState,
    uiState,
    combatRuntimeState,
    environmentState,
    setScreen,
    setMaxStage,
    setStageStars,
    setSelectedDeck,
    setSelectedSpells,
    setBeans,
    addBeans,
    setUnlockedPerks,
    setSelectedPerks,
    setDefeatedBosses,
    setCrystal,
    addCrystal,
    setGold,
    addGold,
    setStageGold,
    addStageGold,
    setVodkaUnit,
    setVodkaDeployCD,
    setVodkaDead,
    setVodkaRespawn,
    setCardHand,
    setDeckPickStage,
    setSpellPickStage,
    setAbilityUsed,
    setCurrentStage,
    setCurrentStageIdx,
    setPlayerCastle,
    setEnemyCastle,
    setBossRef,
    setBossSpawned,
    setStageOver,
    setStageWon,
    setCrystalNodes,
    setTowers,
    setBossWarning,
    advanceFrame,
    setCombatStats,
    setWeatherParticles,
    setSelectedCard,
    setStageSelectScroll,
    setDeckPickScroll,
    setSpellPickScroll,
    setPerkPickScroll,
    setCodexOpen,
    setCodexScroll,
    setCodexUnit,
    setScreenShake,
    addScreenShake,
    setSignatureBanner,
    setAbilityTargeting
  };
}

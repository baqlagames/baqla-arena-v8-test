import { ARENA_BUILD_NEXT } from '../data/tuning.js?v=9d6b186-combat-feedback';
import { ARENA_PERKS } from '../data/perks.js';
import { PLAYER_UNITS, VODKA } from '../data/units.js';
import { STAGE_TRANSIENT_BATTLE_ARRAYS } from '../core/state.js';
import { getPerkEffects, perkSlotCount, toggleSelectedPerk, unlockPerk as unlockPerkData } from './perks.js';
import { loadProgress, saveProgress } from './progress.js';
import { showRewardedAd } from './rewarded-ads.js';
import { computeStageStars as computeStageStarsBase, countSquadCells, recordStageChallengeUsage } from './stage-stars.js';

export function createScreenProgressRuntime(deps = {}) {
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});
  const showFlash = typeof deps.showFlash === 'function' ? deps.showFlash : () => {};
  const sound = deps.sound || {};

  function currentSquadCounts() {
    const v = view();
    return countSquadCells(v.arena && v.arena.cells, { playerUnits: PLAYER_UNITS, heroUnit: VODKA });
  }

  function updateStageChallengeUsage() {
    recordStageChallengeUsage(view().arena, currentSquadCounts());
  }

  function computeStageStars(won) {
    const v = view();
    return computeStageStarsBase({
      won,
      currentStage: v.currentStage,
      playerCastle: v.playerCastle,
      arenaState: v.arena,
      counts: currentSquadCounts(),
    });
  }

  function applyProgress(progress) {
    deps.setMaxStage(progress.maxStage);
    deps.setStageStars(progress.stageStars);
    deps.setSelectedDeck(progress.selectedDeck);
    deps.setSelectedSpells(progress.selectedSpells);
    deps.setBeans(progress.beans);
    deps.setUnlockedPerks(progress.unlockedPerks);
    deps.setSelectedPerks(progress.selectedPerks);
  }

  function loadSave() {
    const v = view();
    const progress = loadProgress({
      maxStage: v.maxStage,
      stageStars: v.stageStars,
      selectedDeck: v.selectedDeck,
      selectedSpells: v.selectedSpells,
      beans: v.beans,
      unlockedPerks: v.unlockedPerks,
      selectedPerks: v.selectedPerks,
      unitCount: PLAYER_UNITS.length,
    });
    applyProgress(progress);
  }

  function saveSave() {
    const v = view();
    const meta = saveProgress({
      maxStage: v.maxStage,
      stageStars: v.stageStars,
      selectedDeck: v.selectedDeck,
      selectedSpells: v.selectedSpells,
      beans: v.beans,
      unlockedPerks: v.unlockedPerks,
      selectedPerks: v.selectedPerks,
    });
    applyProgress(meta);
  }

  function perkEffects() {
    return getPerkEffects(view().selectedPerks);
  }

  function unlockPerk(perkId) {
    const v = view();
    const result = unlockPerkBase(perkId, v);
    if (!result.ok) return false;
    deps.setBeans(result.progress.beans);
    deps.setUnlockedPerks(result.progress.unlockedPerks);
    if (v.selectedPerks.length < perkSlotCount(v.maxStage) && !v.selectedPerks.includes(perkId)) {
      deps.setSelectedPerks([...v.selectedPerks, perkId]);
    }
    saveSave();
    if (sound.purchase) sound.purchase();
    showFlash('Unlocked ' + result.perk.name, '#6ee7b7', 70);
    return true;
  }

  function unlockPerkBase(perkId, v) {
    const result = unlockPerkData(perkId, {
      beans: v.beans,
      maxStage: v.maxStage,
      unlockedPerks: v.unlockedPerks,
      selectedPerks: v.selectedPerks,
    });
    if (!result.ok) {
      const perk = ARENA_PERKS.find(item => item.id === perkId);
      if (perk && perk.unlockStage > v.maxStage) showFlash('Unlocks at Stage ' + perk.unlockStage, '#ffb0a6', 70);
      else showFlash('Not enough Beans', '#ffb0a6', 70);
    }
    return result;
  }

  function togglePerk(perkId) {
    const v = view();
    const result = toggleSelectedPerk(perkId, {
      beans: v.beans,
      maxStage: v.maxStage,
      unlockedPerks: v.unlockedPerks,
      selectedPerks: v.selectedPerks,
    });
    if (!result.ok) return false;
    deps.setSelectedPerks(result.progress.selectedPerks);
    saveSave();
    if (sound.purchase) sound.purchase();
    return true;
  }

  function claimDoubleBeansReward() {
    const v = view();
    const arena = v.arena;
    if (v.state !== 'win' || !arena || !arena.beansRewardBase || arena.beansRewardDoubled) return false;
    return showRewardedAd('doubleBeansAfterVictory', {
      onReward: () => {
        deps.addBeans(arena.beansRewardBase);
        arena.beansRewardDoubled = true;
        saveSave();
        showFlash('+' + arena.beansRewardBase + ' Beans bonus', '#ffd166', 90);
        if (sound.purchase) sound.purchase();
      },
      onUnavailable: () => showFlash('Ad not available', '#ffb0a6', 80),
    });
  }

  function claimSecondChanceRetry() {
    const v = view();
    const arena = v.arena;
    if (v.state !== 'lose' || !arena || arena.adRetryUsed) return false;
    return showRewardedAd('retryLostWave', {
      onReward: () => {
        arena.adRetryUsed = true;
        deps.clearBattleArrays(STAGE_TRANSIENT_BATTLE_ARRAYS);
        if (arena.king) {
          arena.king.hp = Math.max(1, Math.round((arena.king.maxHp || 1) * 0.5));
          deps.setPlayerCastle(arena.king);
        }
        deps.setBossRef(null);
        deps.setBossSpawned(false);
        deps.setStageOver(false);
        deps.setStageWon(false);
        deps.setScreen('battle');
        deps.startBuild(Math.max(8, Math.round(ARENA_BUILD_NEXT * 0.5)));
        deps.buildWavePreview();
        showFlash('SECOND CHANCE - RETRY WAVE', '#ffd166', 100);
        if (sound.levelUp) sound.levelUp();
      },
      onUnavailable: () => showFlash('Ad not available', '#ffb0a6', 80),
    });
  }

  return {
    currentSquadCounts,
    updateStageChallengeUsage,
    computeStageStars,
    loadSave,
    saveSave,
    perkEffects,
    unlockPerk,
    togglePerk,
    claimDoubleBeansReward,
    claimSecondChanceRetry,
    perkSlotCount,
  };
}

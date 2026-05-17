import { drawMenuScreen } from './menu.js';
import { drawDeckPickerScreen, drawSpellPickerScreen } from './pickers.js';
import { drawPerkPickerScreen } from './perk-picker.js';
import { drawLoseResultScreen, drawWinResultScreen } from './results.js';
import { drawStageBriefScreen } from './stage-brief.js';
import { drawStageSelectScreen } from './stage-select.js';
import { drawAnimatedStarResult as drawAnimatedStarResultBase, drawStageStarPanel as drawStageStarPanelBase } from './stars.js';

export function createScreenFlowRenderer(deps) {
  const ctx = deps.ctx;
  const playerUnits = deps.playerUnits;
  const vodka = deps.vodka;
  const stages = deps.stages;
  const abilities = deps.abilities;
  const perks = deps.perks;
  let W = 500, H = 1000;
  let frame = 0, maxStage = 1, beans = 0, stageStars = {};
  let currentStage = null, currentStageIdx = 0, arena = null;
  let deckPickStage = [], selectedSpells = [], spellPickStage = [];
  let deckPickScroll = 0, spellPickScroll = 0, perkPickScroll = 0;
  let unlockedPerks = [], selectedPerks = [];

  function sync() {
    const v = typeof deps.view === 'function' ? deps.view() : {};
    W = v.width || W;
    H = v.height || H;
    frame = v.frame || 0;
    maxStage = v.maxStage || maxStage;
    beans = v.beans || 0;
    stageStars = v.stageStars || stageStars;
    currentStage = v.currentStage || currentStage;
    currentStageIdx = v.currentStageIdx == null ? currentStageIdx : v.currentStageIdx;
    arena = v.arena || arena;
    deckPickStage = v.deckPickStage || deckPickStage;
    selectedSpells = v.selectedSpells || selectedSpells;
    spellPickStage = v.spellPickStage || spellPickStage;
    deckPickScroll = v.deckPickScroll || 0;
    spellPickScroll = v.spellPickScroll || 0;
    perkPickScroll = v.perkPickScroll || 0;
    unlockedPerks = v.unlockedPerks || unlockedPerks;
    selectedPerks = v.selectedPerks || selectedPerks;
  }

  function drawBigBtn(x, y, w, h, label, bg, subtitle) {
    deps.drawBigBtn(x, y, w, h, label, bg, subtitle);
  }

  function drawMenu() {
    sync();
    drawMenuScreen(ctx, {
      width: W,
      height: H,
      frame,
      maxStage,
      beans,
      versionLabel: 'LEGION TD - v8',
      progressSeparator: '-',
      campaignSubtitle: 'Continue Stage ' + maxStage,
      drawVodka: deps.drawVodka,
      drawBigBtn
    });
  }

  function drawStageSelect() {
    sync();
    drawStageSelectScreen(ctx, {
      width: W,
      height: H,
      frame,
      maxStage,
      stageStars,
      stages,
      scroll: deps.stageSelectScroll(),
      drawPillBtn: deps.drawPillBtn,
      starText: deps.starText,
      labels: {
        back: 'BACK',
        ellipsis: '...',
        finalBadge: 'FINAL 5',
        titanBadge: 'TITAN 4',
        majorBadge: 'MAJOR 3',
        miniBadge: 'BOSS 2'
      }
    });
  }

  function drawStageStarPanel(x, y, w, h, result) {
    sync();
    const stageN = (currentStage && currentStage.n) || 1;
    drawStageStarPanelForStage(x, y, w, h, result, stageN);
  }

  function drawStageStarPanelForStage(x, y, w, h, result, stageN) {
    drawStageStarPanelBase(ctx, {
      x, y, w, h,
      stageN,
      result,
      bestStars: stageStars[stageN] || 0,
      starText: deps.starText,
      criteriaRows: deps.stageStarCriteria(stageN, result),
      labels: { pending: '*', met: 'OK', failed: 'X' }
    });
  }

  function drawAnimatedStars(result, x, y, w, h) {
    sync();
    const stageN = (currentStage && currentStage.n) || 1;
    const starResult = drawAnimatedStarResultBase(ctx, {
      x, y, w, h,
      result,
      stageN,
      criteriaRows: deps.stageStarCriteria(stageN, result),
      frame,
      starRevealStart: arena && arena.starRevealStart,
      starBurstDone: arena && arena.starBurstDone,
      labels: { star: '*', pending: '*', met: 'OK', failed: 'X' }
    });
    for (const i of starResult.revealedStars) {
      if (arena && arena.starBurstDone && !arena.starBurstDone[i]) {
        arena.starBurstDone[i] = true;
        deps.shake(5 + i * 2);
        deps.levelUpSound();
      }
    }
  }

  function drawStageBrief() {
    sync();
    const stage = currentStage || stages[currentStageIdx] || stages[0];
    drawStageBriefScreen(ctx, {
      width: W,
      height: H,
      stage,
      bestStars: stageStars[stage.n] || 0,
      backLabel: 'BACK',
      stageMetaSeparator: '  -  ',
      startLabel: 'CHOOSE SPELL',
      starText: deps.starText,
      drawPillBtn: deps.drawPillBtn,
      drawBigBtn,
      drawStageStarPanel
    });
  }

  function drawDeckPick() {
    sync();
    drawDeckPickerScreen(ctx, {
      width: W,
      height: H,
      units: playerUnits,
      selectedDeck: deckPickStage,
      scroll: deckPickScroll,
      drawPillBtn: deps.drawPillBtn,
      getUnitStats: deps.getUnitStats,
      labels: {
        next: 'NEXT ->',
        costPrefix: 'C ',
        scrollHint: 'v scroll v'
      }
    });
  }

  function drawSpellPick() {
    sync();
    const need = currentStage && currentStage.n <= 10 ? 1 : 2;
    drawSpellPickerScreen(ctx, {
      width: W,
      height: H,
      abilities,
      selectedSpells: spellPickStage,
      need,
      scroll: spellPickScroll,
      drawPillBtn: deps.drawPillBtn,
      wrapText: deps.wrapText,
      labels: {
        battle: 'BATTLE ->',
        star: '*',
        scrollHint: 'v scroll v'
      }
    });
  }

  function drawPerkPick() {
    sync();
    drawPerkPickerScreen(ctx, {
      width: W,
      height: H,
      perks,
      beans,
      maxStage,
      unlockedPerks,
      selectedPerks,
      slots: deps.perkSlotCount(maxStage),
      scroll: perkPickScroll,
      drawPillBtn: deps.drawPillBtn,
      wrapText: deps.wrapText,
      labels: {
        battle: 'BATTLE ->',
        scrollHint: 'v scroll v'
      }
    });
  }

  function drawWinScreen() {
    sync();
    drawWinResultScreen(ctx, {
      width: W,
      height: H,
      stage: currentStage,
      arena,
      starResult: (arena && arena.lastStars) || deps.computeStageStars(true),
      resultButtonRects: deps.resultButtonRects,
      drawAnimatedStarResult: drawAnimatedStars,
      drawRoundCombatReport: deps.drawRoundCombatReport,
      drawStageCombatReport: deps.drawStageCombatReport,
      drawBigBtn
    });
  }

  function drawLoseScreen() {
    sync();
    drawLoseResultScreen(ctx, {
      width: W,
      height: H,
      stage: currentStage,
      canSecondChance: arena && !arena.adRetryUsed,
      resultButtonRects: deps.resultButtonRects,
      drawStageCombatReport: deps.drawStageCombatReport,
      drawBigBtn,
      labels: { loseAdvice: 'Try again - adjust your deck or upgrade units' }
    });
  }

  return {
    drawMenu,
    drawStageSelect,
    drawStageStarPanel,
    drawAnimatedStarResult: drawAnimatedStars,
    drawStageBrief,
    drawDeckPick,
    drawSpellPick,
    drawPerkPick,
    drawWinScreen,
    drawLoseScreen
  };
}

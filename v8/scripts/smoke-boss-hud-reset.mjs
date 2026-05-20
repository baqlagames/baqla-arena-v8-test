#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createBattleHudRuntime } from '../src/ui/battle-hud-runtime.js';

const noop = () => {};

function createNoopCanvasContext() {
  return new Proxy({}, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'measureText') return text => ({ width: String(text || '').length * 7 });
      if (prop === 'canvas') return { width: 500, height: 900 };
      return noop;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

let bossHpCalls = 0;
let bossCastCalls = 0;
const state = {
  width: 500,
  height: 900,
  arenaTop: 80,
  arenaBot: 810,
  clashCamera: false,
  arenaViewMode: '25d',
  arena: { phase: 'wave', waveThreats: [], round: 6 },
  currentStage: { n: 5, name: 'Hive Gate', bossId: 1 },
  selectedSpells: [],
  abilityCooldowns: [],
  abilityUsed: [],
  abilityTargeting: -1,
  bossWarning: 0,
  stageStartTimer: 0,
  frame: 120,
  combatStats: null,
  gold: 160,
  playerCastle: { hp: 1100, maxHp: 1100 },
  enemies: [],
  bossRef: { name: 'Hornet Sovereign', hp: 15001, maxHp: 21500, size: 48 },
  soundMuted: true,
};

const hud = createBattleHudRuntime({
  ctx: createNoopCanvasContext(),
  abilities: [],
  playerUnits: [],
  vodka: {},
  tickHz: 60,
  bloodlustCost: 0,
  tranquilityCost: 0,
  gridCols: 6,
  gridRows: 3,
  gridX: () => 0,
  gridY: () => 0,
  cellW: () => 70,
  cellH: () => 70,
  view: () => state,
  drawBattleHudOverlay: () => ({ spellBtnRects: [] }),
  renderProjectedBuildGrid: noop,
  drawBuildGrid: noop,
  drawEncounterPurifyBar: noop,
  drawEncounterLieutenantsBar: noop,
  drawEncounterBossHpBar: () => { bossHpCalls++; },
  drawEncounterBossCastBar: () => { bossCastCalls++; },
  renderHudRgb: noop,
  renderHudShade: noop,
  renderDrawHudPanel: noop,
  renderFitCanvasText: noop,
  renderDrawHudMeter: noop,
  renderDrawHudIcon: noop,
  drawRoundReportChip: noop,
  getResultButtonRects: () => ({}),
  drawResultCombatReportPanel: noop,
  getRoundCombatReport: () => null,
  getStageCombatReport: () => null,
  drawMobileBattleControls: () => ({ startWave: null, spells: [] }),
  drawBattleTopChrome: () => ({ pause: null }),
  drawDesktopBattleControls: () => ({ startWave: null, spells: [] }),
  drawPauseMenu: () => ({ resume: null, arenaView: null, restart: null, quit: null, sound: null }),
  threatPanelHeight: () => 20,
  statsFormat: value => String(value),
  currentStageRounds: () => 6,
  drawThreatsPanel: noop,
  drawPicker: noop,
  drawManagePanel: noop,
  isCapstoneLevel: () => false,
  pathCamQuad: null,
  camPoint: point => point,
  camDepthScaleAt: () => 1,
  setBossWarning: noop,
});

hud.arena_drawHud();
assert.equal(bossHpCalls, 1, 'boss HP bar should render during a live boss wave');
assert.equal(bossCastCalls, 1, 'boss cast bar should render during a live boss wave');

bossHpCalls = 0;
bossCastCalls = 0;
state.bossRef = null;
hud.arena_drawHud();
assert.equal(bossHpCalls, 0, 'clearing bossRef must clear cached boss HUD state');
assert.equal(bossCastCalls, 0, 'clearing bossRef must clear cached boss cast state');

state.bossRef = { name: 'Hornet Sovereign', hp: 15001, maxHp: 21500, size: 48 };
state.arena.phase = 'build';
hud.arena_drawHud();
assert.equal(bossHpCalls, 0, 'boss HP bar must not render during build phase');
assert.equal(bossCastCalls, 0, 'boss cast bar must not render during build phase');

console.log('smoke-boss-hud-reset: ok');

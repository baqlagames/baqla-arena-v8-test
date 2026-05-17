import { SPRITE_BASE } from '../assets.js';
import { dist, clamp, rnd } from '../core/math.js';
import { GAME_TICK_HZ } from '../core/constants.js';
import { createGameState, STAGE_TRANSIENT_BATTLE_ARRAYS } from '../core/state.js';
import { HP_MULT_PLAYER, HP_MULT_ENEMY, MINION_NERF, UNIT_VISUAL_SCALE, ARENA_L, ARENA_R, ARENA_TOP_BASE, RESPAWN_FRAMES, GRID_COLS, GRID_ROWS, GRID_BOT_PAD, GRID_X, GRID_W, CELL_W, ARENA_MAX_UNIT_LEVEL, ARENA_ARMOR_MATRIX, ARENA_DEFENSE_MATRIX, ARENA_PLAYER_ARMOR_TYPE, ARENA_ATTACK_TYPE_BY_UNIT, ARENA_INTEREST_RATE, ARENA_INTEREST_CAP, ARENA_KILL_BOUNTY_MULT, ARENA_BUILD_FIRST, ARENA_BUILD_NEXT, ARENA_BUILD_BOSS, ARENA_LEASH_FWD, ARENA_LEASH_BACK, ARENA_LEASH_SIDE, ARENA_UNIT_SIZE_SCALE } from '../data/tuning.js';
import { ARENA_SPEC_HALO_COLORS } from '../data/roles.js';
import { PLAYER_UNITS, VODKA } from '../data/units.js';
import { ENEMIES } from '../data/enemies.js';
import { BOSSES } from '../data/bosses.js';
import { ARENA_ABILITIES } from '../data/abilities.js';
import { ARENA_PERKS } from '../data/perks.js';
import { WEATHER, STAGES, STAGE_HP_MULT, STAGE_DMG_MULT } from '../data/stages.js';
import { ARENA_WAVE_MECHANIC_LABELS, ARENA_THREAT_TAG_COLOR } from '../data/waves.js';
import { ARENA_UNIT_BRANCHES, ARENA_BASE_SIGNATURES, ARENA_BRANCH_SIGNATURES } from '../data/passives.js';
import { createArenaInputHandlers } from '../ui/arena-input-handlers.js';
import { createButtonDrawers } from '../ui/buttons.js';
import { canvasEventPoint, pointInRect as uiPointInRect } from '../ui/input.js';
import { createManagePanelInputHandler } from '../ui/manage-panel-input.js';
import { createManagePanelRenderer } from '../ui/manage-panel-screen.js';
import { createScreenFlowRenderer } from '../ui/screen-flow-runtime.js';
import { drawBattleHudOverlay } from '../ui/battle-hud.js';
import { createBattleHudRuntime } from '../ui/battle-hud-runtime.js';
import { drawDesktopBattleControls, drawMobileBattleControls } from '../ui/battle-controls.js';
import { drawBattleTopChrome } from '../ui/battle-topbar.js';
import { createCardRowRuntime } from '../ui/card-row-runtime.js';
import { drawBossCastBar as drawEncounterBossCastBar, drawBossHpBar as drawEncounterBossHpBar, drawLieutenantsBar as drawEncounterLieutenantsBar, drawPurifyBar as drawEncounterPurifyBar } from '../ui/encounter-bars.js';
import { perkPickMaxScroll as getPerkPickMaxScroll } from '../ui/perk-picker.js';
import { drawUnitPlacementPicker, unitPickerMaxScroll } from '../ui/unit-picker.js';
import { drawPauseMenu } from '../ui/pause-menu.js';
import { drawCombatRoundChip as drawRoundReportChip } from '../ui/round-report.js';
import { drawCodexScreen } from '../ui/codex-screen.js';
import { createCodexDetailRuntime } from '../ui/codex-detail-runtime.js';
import { drawThreatsPanel as drawThreatPreviewPanel, threatPanelHeight } from '../ui/threat-panel.js';
import { drawCombatReportPanel as drawResultCombatReportPanel, resultButtonRects as getResultButtonRects } from '../ui/results.js';
import { createActorRenderer } from '../render/actor-renderer.js?v=20260517-zavs-sprite';
import { createUnitOverlaysRuntime } from '../render/unit-overlays-runtime.js';
import { createProjectilesRuntime } from '../render/projectiles-runtime.js';
import { createGroundEffectsRuntime } from '../render/ground-effects-runtime.js';
import { createBattleSceneRuntime } from '../render/battle-scene-runtime.js';
import { createArenaSceneRenderer } from '../render/arena-scene.js?v=20260517-grid-preload';
import { createBattleStructuresRenderer } from '../render/battle-structures.js';
import { drawBombEffects } from '../render/bombs.js';
import { drawBeamEffects, drawFloatingNumbers, drawFlashText, drawParticleEffects, drawSignatureBanner } from '../render/effects.js';
import { drawBuildGrid, drawProjectedBuildGrid as renderProjectedBuildGrid } from '../render/grid.js';
import { drawHudIcon as renderDrawHudIcon, drawHudMeter as renderDrawHudMeter, drawHudPanel as renderDrawHudPanel, fitCanvasText as renderFitCanvasText, parseHudColor as renderHudRgb, shadeHudColor as renderHudShade } from '../render/primitives.js';
import { installCleanCanvasText } from '../render/text.js';
import { createWeatherParticles, drawWeatherOverlay } from '../render/weather.js';
import { createSpecAccessoryRenderer } from '../render/spec-accessories.js';
import { ARENA_BLOODLUST_COST, ARENA_TRANQUILITY_COST, activateBloodlust, activateTranquility, tickActiveSkills } from './active-skills.js';
import { dealDamageRuntime, handleCombatDeath } from './combat-damage-runtime.js';
import { createCombatDamageContextRuntime } from './combat-damage-context-runtime.js';
import { updateArenaEnemyAi } from './combat-enemy-ai.js';
import { createCombatEnemyRuntime } from './combat-enemy-runtime.js';
import { spawnEnemyByIndex } from './enemy-spawn.js?v=20260517-grid-calibration';
import { addBatataShield, addGoldShield, addTaoonBloodShield, addZavsLineShield, applyHealingReceived, applyTrackedHeal } from './combat-healing.js';
import { compactRemovedCombatUnits, tickEnemyCombatUnits, tickPlayerCombatUnits } from './combat-loop.js';
import { createCombatTransientsRuntime } from './combat-transients-runtime.js';
import { createCombatUpdateRuntime } from './combat-update-runtime.js';
import { createUnitUpdateRuntime } from './unit-update-runtime.js';
import { clampCombatActorToArena, clampCombatActorToLeash, createCombatBounds, createTargetingView, moveCombatActorToward, resolvePlayerUnitOverlaps } from './combat-positioning.js';
import { batataCovers, batataHealingReceivedMultiplier, isBatataBacklineAlly, isZavsMeleeAlly, zavsAllyAttackSpeedFactor, zavsAllyDamageMultiplier, zavsBodyguardCovers } from './combat-protection.js';
import { fireArenaProjectile, lobArenaBomb, projectileColor, updateArenaBomb, updateArenaProjectile } from './combat-projectiles.js';
import { findEnemyTargetForUnit, findNearestTarget, findRangedEnemyTargetForUnit, isReachableFromLeash, isSaturatedCombatTarget, updateBossEngagementCounts } from './combat-targeting.js';
import { playerCombatColor, spawnPlayerAbilityCastVfx, spawnPlayerImpactVfx, spawnPlayerProjectileCastVfx } from './combat-vfx.js';
import { completeCombatStats, createCombatStats, finishCombatRound, formatCombatStatValue, getRoundCombatReport, getStageCombatReport, recordCombatDamage, recordCombatHeal, startCombatRound } from './combat-stats.js';
import { tickEnemyPostUpdateStatusEffects } from './combat-status-effects.js';
import { loadProgress, saveProgress } from './progress.js';
import { getPerkEffects, perkSlotCount, stageBeansReward, toggleSelectedPerk, unlockPerk } from './perks.js';
import { showRewardedAd } from './rewarded-ads.js';
import { createStageFlowRuntime } from './stage-flow-runtime.js?v=20260517-grid-calibration';
import { startStageRun } from './stage-runner.js';
import { arena_lateRoundEnemyMult, arena_lateStageNormalDamageMult, arena_lateStageNormalDurabilityMult, arena_lateStageRoleHpMult, arena_roundGoldMult, arena_roundsForStage, arena_stageIncome } from './stage-economy.js';
import { spawnBossById as spawnBossByIdFromData } from './boss-spawn.js?v=20260517-grid-calibration';
import { drainHealToBarrier as drainHealToBarrierFromBossMechanics, tickAerialBombs as tickBossAerialBombs, updateBoss as updateBossMechanics } from './boss-mechanics.js';
import { tickTimedFieldEffects } from './timed-field-effects.js';
import { createStageRunSetup } from './stage-lifecycle.js';
import { arena_stageStarCriteria, arena_stageStarRule, arena_starText, computeStageStars, countSquadCells, recordStageChallengeUsage } from './stage-stars.js';
import { arena_isCapstoneLevel, arena_pathUpgradeCost, arena_unitGoldCost, arena_upgradeCostFor, sellRefundForCell } from './squad-economy.js';
import { canPlaceArenaSquadUnit, placeArenaSquadUnit, sellArenaSquadCell, upgradeArenaSquadCell } from './squad-runtime-actions.js';
import { respawnSquadFromCells, spawnSquadAttachedMinions } from './squad-lifecycle.js';
import { dispatchUnitBasicAttack } from './unit-attack-dispatch.js';
import { prepareUnitAttack } from './unit-attack-prep.js';
import { applyAlibabaOnHitProcs } from './unit-alibaba-onhit-procs.js';
import { applyEarlyOnHitProcs } from './unit-early-onhit-procs.js';
import { applyJafaarOnHitProcs } from './unit-jafaar-onhit-procs.js';
import { applyJazarOnHitProcs } from './unit-jazar-onhit-procs.js';
import { applyNaanaFoulFelfelOnHitProcs } from './unit-naana-foul-felfel-onhit-procs.js';
import { applyZaatarOnHitProcs } from './unit-zaatar-onhit-procs.js';
import { applyZaytOnHitProcs } from './unit-zayt-onhit-procs.js';
import { applyBeaconSplash, calculateAllyDamageMultiplier, findEmergencyTarget, findLowestAlly, spawnFelfelMirror, spawnGhost, tickHealerTriage, updateCharmedEnemy, updateGhostUnit } from './unit-support.js';
import { tickUnitActionTimers } from './unit-action-timers.js';
import { tickUnitAlibabaPassives } from './unit-alibaba-ticks.js';
import { tickUnitEarlyActions } from './unit-early-actions.js';
import { tickUnitBranchPassives } from './unit-branch-ticks.js';
import { tickUnitCompanionPassives } from './unit-companion-ticks.js';
import { tickUnitSupportAndGapClosers } from './unit-gap-closer-ticks.js';
import { tickUnitHabaqPassives } from './unit-habaq-ticks.js';
import { tickUnitHealerAuraPassives } from './unit-healer-aura-ticks.js';
import { tickUnitHunterPassives } from './unit-hunter-ticks.js';
import { tickUnitPlagueAndJazarPassives } from './unit-plague-jazar-ticks.js';
import { tickUnitPriestPassives } from './unit-priest-ticks.js';
import { tickUnitRummanPassives } from './unit-rumman-ticks.js';
import { prepareUnitAttackTarget } from './unit-attack-targeting.js';
import { tickUnitSignatureBuffTimers } from './unit-signature-buff-timers.js';
import { tickUnitMeteorAndSignature } from './unit-signature-ticks.js';
import { createArenaSignatures } from './unit-signatures.js';
import { createRoleProgressionRuntime } from './role-progression.js';
import { ARENA_RIFT_BONUS_GOLD, createRiftRuntime } from './rift-runtime.js';
import { installArenaPlaytestHook } from './playtest-hook.js';
import { tickUnitStatusTimers } from './unit-status-timers.js';
import { tickUnitUpkeep } from './unit-upkeep.js';
import { tickUnitWarlockPassives } from './unit-warlock-ticks.js';
import { tickUnitZaytBakdounesPassives } from './unit-zayt-bakdounes-ticks.js';
import { applyPassiveToUnit, applyUnitPassives, currentUnitPassives, signatureDisplayCooldown, signatureDisplayFirstCast, signatureIdForUnit } from './unit-passives.js';
import { advanceSharedOnHitCounter, applyPostHitSupportProcs } from './unit-onhit-procs.js';
import { applyCoreFamilyOnHitProcs } from './unit-onhit-core.js';
import { applyGenericOnHitProcs } from './unit-onhit-generic.js';
import { applyRummanOnHitProcs } from './unit-onhit-rumman.js';
import { arena_pickWaveMechanic, arena_stageOpenerQueue, arena_themedWaveQueue, arena_waveMechanicLimit } from './wave-planner.js';
import { buildWaveThreats } from './wave-threats.js';
import { completeWavePhase, configureWaveSpawning as configureWaveSpawningState, spawnNextEnemyBatch as spawnNextEnemyBatchState, startBuildPhase, startWavePhase } from './wave-lifecycle.js';

export function startArena(){
'use strict';

const gameState=createGameState();

// =====================
// SOUND SYSTEM Ã¢â‚¬â€ Web Audio procedural SFX (no files needed)
// =====================
let _audioCtx=null,_sfxGain=null,_sfxMuted=true,_sfxVol=0.25;
function _initAudio(){
  if(_audioCtx)return;
  try{
    _audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    _sfxGain=_audioCtx.createGain();
    _sfxGain.gain.value=_sfxVol;
    _sfxGain.connect(_audioCtx.destination);
  }catch(e){_audioCtx=null}
}
function _resumeAudio(){if(_audioCtx&&_audioCtx.state==='suspended')_audioCtx.resume()}
document.addEventListener('pointerdown',()=>{_initAudio();_resumeAudio()},{once:false});
document.addEventListener('keydown',()=>{_initAudio();_resumeAudio()},{once:false});

function _playTone(freq,dur,type,vol,ramp){
  if(!_audioCtx||_sfxMuted)return;
  const o=_audioCtx.createOscillator(),g=_audioCtx.createGain();
  o.type=type||'sine';o.frequency.value=freq;
  g.gain.value=(vol||0.3)*_sfxVol;
  if(ramp)g.gain.exponentialRampToValueAtTime(0.001,_audioCtx.currentTime+dur);
  else{g.gain.setValueAtTime((vol||0.3)*_sfxVol,_audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0,_audioCtx.currentTime+dur)}
  o.connect(g);g.connect(_sfxGain);
  o.start(_audioCtx.currentTime);o.stop(_audioCtx.currentTime+dur);
}
function _playNoise(dur,vol,filter,filterFreq){
  if(!_audioCtx||_sfxMuted)return;
  const bufSz=Math.floor(_audioCtx.sampleRate*dur);
  const buf=_audioCtx.createBuffer(1,bufSz,_audioCtx.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<bufSz;i++)d[i]=(Math.random()*2-1);
  const src=_audioCtx.createBufferSource();src.buffer=buf;
  const g=_audioCtx.createGain();
  g.gain.setValueAtTime((vol||0.2)*_sfxVol,_audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(0,_audioCtx.currentTime+dur);
  if(filter){
    const f=_audioCtx.createBiquadFilter();f.type=filter;f.frequency.value=filterFreq||1000;
    src.connect(f);f.connect(g);
  }else{src.connect(g)}
  g.connect(_sfxGain);src.start();
}

const SFX={
  // Melee attacks
  slash(){_playNoise(0.08,0.15,'highpass',2000);_playTone(200,0.06,'sawtooth',0.08)},
  heavySlash(){_playNoise(0.12,0.2,'highpass',1500);_playTone(150,0.1,'sawtooth',0.12)},
  shieldBash(){_playNoise(0.1,0.25,'lowpass',800);_playTone(120,0.15,'square',0.1)},
  // Ranged attacks
  arrowShot(){_playTone(800,0.06,'sine',0.1);_playTone(1200,0.04,'sine',0.06)},
  boltFire(){_playTone(600,0.08,'triangle',0.1);_playNoise(0.05,0.08,'highpass',3000)},
  // Magic
  fireball(){_playTone(300,0.2,'sawtooth',0.12);_playNoise(0.15,0.15,'lowpass',600);_playTone(150,0.3,'sine',0.06)},
  frostBolt(){_playTone(1200,0.15,'sine',0.1);_playTone(900,0.2,'triangle',0.06)},
  lightning(){_playNoise(0.04,0.3,'highpass',4000);_playTone(80,0.08,'square',0.15);_playNoise(0.06,0.2,'bandpass',2500)},
  holyLight(){_playTone(523,0.15,'sine',0.12);_playTone(659,0.15,'sine',0.08);_playTone(784,0.2,'sine',0.06)},
  shadowMagic(){_playTone(100,0.25,'sawtooth',0.1);_playTone(80,0.3,'square',0.06)},
  natureMagic(){_playTone(440,0.15,'sine',0.08);_playTone(554,0.12,'triangle',0.06);_playTone(659,0.1,'sine',0.04)},
  // Abilities
  explosion(){_playNoise(0.3,0.35,'lowpass',400);_playTone(60,0.4,'sine',0.2)},
  heal(){_playTone(660,0.12,'sine',0.1);_playTone(880,0.15,'sine',0.07);_playTone(1100,0.1,'sine',0.04)},
  bigHeal(){_playTone(523,0.15,'sine',0.12);_playTone(784,0.2,'sine',0.1);_playTone(1047,0.25,'sine',0.08)},
  buff(){_playTone(440,0.1,'triangle',0.08);_playTone(660,0.12,'triangle',0.06);_playTone(880,0.08,'sine',0.04)},
  debuff(){_playTone(300,0.2,'sawtooth',0.08);_playTone(200,0.25,'square',0.05)},
  // Tank
  taunt(){_playTone(100,0.2,'square',0.15);_playTone(80,0.25,'sawtooth',0.1);_playNoise(0.1,0.12,'lowpass',500)},
  shieldBlock(){_playNoise(0.06,0.2,'bandpass',1200);_playTone(300,0.08,'square',0.1)},
  cheatDeath(){_playTone(200,0.4,'sine',0.15);_playTone(400,0.35,'sine',0.1);_playTone(800,0.3,'sine',0.08);_playNoise(0.2,0.15,'highpass',3000)},
  // Rogue
  stealth(){_playNoise(0.15,0.08,'highpass',5000);_playTone(2000,0.1,'sine',0.03)},
  backstab(){_playNoise(0.06,0.25,'highpass',3000);_playTone(400,0.05,'sawtooth',0.15)},
  // Summoner
  summon(){_playTone(200,0.2,'triangle',0.1);_playTone(300,0.15,'sine',0.08);_playNoise(0.1,0.06,'lowpass',400)},
  // Boss
  bossSlam(){_playNoise(0.25,0.35,'lowpass',300);_playTone(50,0.5,'sine',0.25);_playTone(40,0.6,'square',0.1)},
  bossRoar(){_playTone(80,0.5,'sawtooth',0.2);_playTone(60,0.6,'square',0.12);_playNoise(0.3,0.2,'lowpass',500)},
  meteor(){_playTone(800,0.1,'sine',0.08);_playTone(200,0.3,'sine',0.15);_playNoise(0.25,0.3,'lowpass',500)},
  // UI
  levelUp(){_playTone(523,0.1,'sine',0.12);_playTone(659,0.1,'sine',0.1);_playTone(784,0.1,'sine',0.08);_playTone(1047,0.15,'sine',0.06)},
  purchase(){_playTone(800,0.08,'triangle',0.1);_playTone(1000,0.06,'sine',0.08)},
  waveStart(){_playTone(440,0.15,'triangle',0.1);_playTone(554,0.12,'triangle',0.08);_playTone(660,0.1,'sine',0.06)},
  victory(){_playTone(523,0.15,'sine',0.12);_playTone(659,0.15,'sine',0.1);_playTone(784,0.15,'sine',0.08);_playTone(1047,0.2,'sine',0.06)},
  defeat(){_playTone(300,0.3,'sawtooth',0.1);_playTone(200,0.4,'sawtooth',0.08);_playTone(100,0.5,'sine',0.12)},
  cobraStrike(){_playTone(1200,0.04,'sine',0.1);_playTone(800,0.06,'sine',0.12);_playNoise(0.08,0.15,'bandpass',3000);_playTone(400,0.1,'sawtooth',0.08)},
  poison(){_playTone(300,0.15,'sine',0.06);_playNoise(0.1,0.08,'highpass',4000);_playTone(250,0.2,'triangle',0.04)},
  chainLightning(){_playNoise(0.03,0.3,'highpass',5000);_playTone(100,0.05,'square',0.2);_playNoise(0.04,0.25,'bandpass',3000);_playTone(60,0.06,'square',0.15)},
  roar(){_playTone(90,0.3,'sawtooth',0.2);_playTone(70,0.4,'square',0.1);_playNoise(0.15,0.15,'lowpass',400)},
  bladeStorm(){_playNoise(0.1,0.15,'bandpass',2000);_playTone(500,0.08,'sawtooth',0.1);_playTone(700,0.06,'sawtooth',0.08)},
  fanOfKnives(){_playNoise(0.06,0.2,'highpass',3000);_playTone(1000,0.04,'sine',0.08);_playTone(1500,0.03,'sine',0.06)},
  drainLife(){_playTone(180,0.3,'sine',0.08);_playTone(220,0.25,'triangle',0.06)},
  resurrect(){_playTone(400,0.2,'sine',0.15);_playTone(600,0.2,'sine',0.12);_playTone(800,0.2,'sine',0.1);_playTone(1200,0.3,'sine',0.08)},
};

const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
installCleanCanvasText(ctx);
const arenaButtonDrawers=createButtonDrawers(ctx);
let ARENA_CANVAS_DPR=1;
let W=500,H=1000;
function arena_applyRenderQuality(){
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  if('fontKerning' in ctx)ctx.fontKerning='normal';
  if('textRendering' in ctx)ctx.textRendering='geometricPrecision';
}
function computeCanvasDims(){
  const winRatio=window.innerHeight/Math.max(window.innerWidth,1);
  const ratio=Math.max(1.33,Math.min(2.17,winRatio));
  return{w:500,h:Math.round(500*ratio)};
}
function applyCanvasDims(renderScale){
  const d=computeCanvasDims();
  W=d.w;H=d.h;
  ARENA_CANVAS_DPR=Math.max(1,Math.min(4,renderScale||window.devicePixelRatio||1));
  canvas.width=Math.round(W*ARENA_CANVAS_DPR);
  canvas.height=Math.round(H*ARENA_CANVAS_DPR);
  canvas.style.width=W+'px';
  canvas.style.height=H+'px';
  ctx.setTransform(ARENA_CANVAS_DPR,0,0,ARENA_CANVAS_DPR,0,0);
  arena_applyRenderQuality();
  // Bottom UI sits at H-58; arena extends close to it with a small gap
  ARENA_BOT=H-68;
  DEPLOY_TOP=Math.round((ARENA_TOP_BASE+ARENA_BOT)/2);
  HERO_BTN.x=W-44;HERO_BTN.y=H-46;
  // arena: recompute grid cell size for the new canvas height.
  if(typeof recomputeGrid==='function')recomputeGrid();
  // Mobile address-bar collapse can fire resize mid-stage. Castles/towers
  // were spawned with absolute y coords relative to the OLD ARENA_BOT, so
  // they'd float free of the new arena floor. Snap them back, and clamp
  // any units that ended up outside the new bounds.
  reanchorArenaForResize();
}
function reanchorArenaForResize(){
  // Bail silently on the bootstrap call Ã¢â‚¬â€ the let declarations below this
  // function are still in TDZ at first init.
  try{
    if(playerCastle){playerCastle.y=ARENA_BOT-38;playerCastle.x=W/2}
    if(enemyCastle){enemyCastle.y=ARENA_TOP+65;enemyCastle.x=W/2}
    if(units)for(const u of units){
      if(u.y>ARENA_BOT-8)u.y=ARENA_BOT-8;
      if(u.y<ARENA_TOP+55)u.y=ARENA_TOP+55;
    }
    if(enemies)for(const e of enemies){
      if(e.y>ARENA_BOT-8)e.y=ARENA_BOT-8;
      if(e.y<ARENA_TOP+55)e.y=ARENA_TOP+55;
    }
    if(vodkaUnit&&vodkaUnit.y>ARENA_BOT-8)vodkaUnit.y=ARENA_BOT-8;
  }catch(_){}
}
function resize(){
  const d=computeCanvasDims();
  const s=Math.min(window.innerWidth/d.w,window.innerHeight/d.h)*0.98;
  const cssW=Math.max(1,Math.round(d.w*s));
  const cssH=Math.max(1,Math.round(d.h*s));
  applyCanvasDims((window.devicePixelRatio||1)*(cssW/d.w));
  canvas.style.width=cssW+'px';canvas.style.height=cssH+'px';
}

// =============================================================
// BAQLA ARENA v8 Ã¢â‚¬â€ LEGION TD STYLE (grid placement, build/wave rounds)
// 12 player units (Arabic vegetable theme) + Vodka hero
// L1/L2/L4 = stat upgrades; L3/L5 = ability unlocks
// =============================================================

// Global HP multipliers Ã¢â‚¬â€ applied at every spawn site so fights last longer
// without touching any per-unit table values. Damage is unchanged.
// v5: dropped 1.20 Ã¢â€ â€™ 1.10. Slower combat already lengthens fights.



function nerfMinion(m){m.maxHp=Math.round(m.maxHp*MINION_NERF);m.hp=m.maxHp;m.dmg=Math.round(m.dmg*MINION_NERF)}
function arena_followFamiliarAnchor(u){
  if(!u||!u.familiar||!u.parent||u.parent.hp<=0)return false;
  let side=u.familiarSide||1;
  const s=u.size||12;
  const wobble=(u.bobPhase||0)+frame*0.055;
  const gap=(u.parent.size||22)+30;
  if(side>0&&u.parent.x+gap>ARENA_R-s-18)side=-1;
  if(side<0&&u.parent.x-gap<ARENA_L+s+18)side=1;
  const tx=clamp(u.parent.x+side*gap+Math.cos(wobble)*5,ARENA_L+s,ARENA_R-s);
  const ty=clamp(u.parent.y-4+Math.sin(wobble)*5,ARENA_TOP+Math.max(s,55),ARENA_BOT-s);
  const dx=tx-u.x,dy=ty-u.y,d=Math.sqrt(dx*dx+dy*dy);
  if(d>90){u.x=tx;u.y=ty}
  else{u.x+=dx*0.14;u.y+=dy*0.14}
  u.facing=side;
  return true;
}
// v5: every unit's draw size scaled at spawn. Cascades through size-driven
// collision, draw, shadow, and arena clamps automatically.

// Tighter top + bottom bars give the arena ~150px more vertical room,
// so enemies have actual time to march down before reaching the castle.

let ARENA_TOP=ARENA_TOP_BASE;
let ARENA_BOT=820,DEPLOY_TOP=710;
let HERO_BTN={x:W-44,y:H-46,r:30};


// =====================
// arena: GRID + LEGION TD
// =====================
// Placement grid follows the checkerboard painted into Baqla_Arena 1.png so
// units snap to the exact square centers instead of an older generated layout.


    // castle lives below grid; smaller castle = less pad
  // left edge of grid


let gridX=GRID_X;
let gridW=GRID_W;
let cellW=CELL_W;
let GRID_Y=200;           // recomputed from the painted arena board in recomputeGrid
let CELL_H=70;            // recomputed once canvas is sized in applyCanvasDims
const PAINTED_ARENA_IMAGE_W=1086;
const PAINTED_ARENA_IMAGE_H=1448;
const PAINTED_BUILD_TOP=540;
const PAINTED_BUILD_BOTTOM=1115;
const PAINTED_BUILD_LEFT_TOP=188;
const PAINTED_BUILD_RIGHT_TOP=898;
const PAINTED_BUILD_LEFT_BOTTOM=151;
const PAINTED_BUILD_RIGHT_BOTTOM=935;
const PAINTED_ENEMY_SPAWN_Y=328;
function arena_paintedImageScale(){
  return H/PAINTED_ARENA_IMAGE_H;
}
function arena_paintedImageX(){
  return (W-PAINTED_ARENA_IMAGE_W*arena_paintedImageScale())/2;
}
function arena_paintedSourceToScreenX(x){
  return arena_paintedImageX()+x*arena_paintedImageScale();
}
function arena_paintedSourceToScreenY(y){
  return y*arena_paintedImageScale();
}
function arena_projectedWorldYForScreenY(screenY){
  const top=ARENA_TOP+28,bot=ARENA_BOT-18;
  const t=Math.pow(Math.max(0,Math.min(1,(screenY-top)/Math.max(1,bot-top))),1/1.18);
  return top+t*(bot-top);
}
function arena_paintedGridWidthScaleAt(y){
  const top=ARENA_TOP+28,bot=ARENA_BOT-18;
  const t=Math.max(0,Math.min(1,(y-top)/Math.max(1,bot-top)));
  return 0.76+0.27*t;
}
function arena_projectedWorldXForScreenX(screenX,worldY){
  const s=arena_paintedGridWidthScaleAt(worldY);
  return W/2+(screenX-W/2)/Math.max(0.01,s);
}
function arena_paintedWorldYForSourceY(sourceY){
  return arena_projectedWorldYForScreenY(arena_paintedSourceToScreenY(sourceY));
}
function arena_enemySpawnY(){
  return arena_paintedWorldYForSourceY(PAINTED_ENEMY_SPAWN_Y);
}
function recomputeGrid(){
  const topWorld=arena_paintedWorldYForSourceY(PAINTED_BUILD_TOP);
  const bottomWorld=arena_paintedWorldYForSourceY(PAINTED_BUILD_BOTTOM);
  GRID_Y=topWorld;
  CELL_H=(bottomWorld-topWorld)/GRID_ROWS;
  const leftTop=arena_projectedWorldXForScreenX(arena_paintedSourceToScreenX(PAINTED_BUILD_LEFT_TOP),topWorld);
  const rightTop=arena_projectedWorldXForScreenX(arena_paintedSourceToScreenX(PAINTED_BUILD_RIGHT_TOP),topWorld);
  const leftBottom=arena_projectedWorldXForScreenX(arena_paintedSourceToScreenX(PAINTED_BUILD_LEFT_BOTTOM),bottomWorld);
  const rightBottom=arena_projectedWorldXForScreenX(arena_paintedSourceToScreenX(PAINTED_BUILD_RIGHT_BOTTOM),bottomWorld);
  gridX=(leftTop+leftBottom)/2;
  gridW=((rightTop+rightBottom)/2)-gridX;
  cellW=gridW/GRID_COLS;
}
function cellCenterX(col){return gridX+col*cellW+cellW/2}
function cellCenterY(row){return GRID_Y+row*CELL_H+CELL_H/2}
function cellCenterScreen(col,row){
  const x=cellCenterX(col),y=cellCenterY(row);
  return arenaSceneRenderer&&arenaSceneRenderer.clashCamera?arena_camPoint(x,y):{x,y};
}
function xyToCell(x,y){
  const world=arena_screenToWorldPoint(x,y);
  x=world.x;y=world.y;
  if(x<gridX||x>gridX+gridW)return null;
  if(y<GRID_Y||y>GRID_Y+GRID_ROWS*CELL_H)return null;
  const col=Math.floor((x-gridX)/cellW);
  const row=Math.floor((y-GRID_Y)/CELL_H);
  if(col<0||col>=GRID_COLS||row<0||row>=GRID_ROWS)return null;
  return {col,row,key:row*GRID_COLS+col};
}
function arena_laneBounds(){
  const pad=Math.max(8,cellW*0.18);
  const left=gridX+pad;
  const right=gridX+gridW-pad;
  if(!Number.isFinite(left)||!Number.isFinite(right)||right-left<120){
    return {left:ARENA_L,right:ARENA_R};
  }
  return {
    left:Math.max(8,left),
    right:Math.min(W-8,right)
  };
}

// =====================================================================
// ARMOR-TYPE MATRIX (WC3 Legion TD-style). Attack types: physical / pierce /
// magic. Armor types: unarmored / heavy / warded / boss.
//   Pierce shreds Unarmored, struggles vs Heavy.
//   Magic shreds Heavy, halves vs Warded.
//   Physical neutral vs Unarmored, struggles vs Heavy.
//   Boss = neutral 0.85 from all (no comp trivializes a boss).
// =====================================================================

// Per-unit attack type Ã¢â‚¬â€ the unit's BASIC ATTACK class. Hybrid units (Zayt holy
// bolt) override on the projectile via opts.attackType.

// =====================================================================
// ARENA_BASE_SPECS Ã¢â‚¬â€ name + role + icon for each WoW-class unit's base path.
// At L2Ã¢â€ â€™L3 the manage panel shows these instead of "Continue [base]" so the
// player picks a real subclass (Spec 1) rather than "stay base." Standalone
// units (tanks, Felfel, Jazar, Rumman, Vodka, Zaatar) are NOT listed here Ã¢â‚¬â€
// they keep their current 2-branch fork.
// =====================================================================

function arena_getSignatures(){
  try{return ARENA_SIGNATURES}catch(_){return {}}
}
const roleProgression=createRoleProgressionRuntime({
  unitBranches:ARENA_UNIT_BRANCHES,
  baseSignatures:ARENA_BASE_SIGNATURES,
  branchSignatures:ARENA_BRANCH_SIGNATURES,
  getSignatures:arena_getSignatures,
  sigDisplayFc:arena_sigDisplayFc,
  sigDisplayCd:arena_sigDisplayCd
});
function arena_baseSpec(...args){return roleProgression.baseSpec(...args)}
function arena_roleRoot(...args){return roleProgression.roleRoot(...args)}
function arena_rolePaths(...args){return roleProgression.rolePaths(...args)}
function arena_pathById(...args){return roleProgression.pathById(...args)}
function arena_roleSpecs(...args){return roleProgression.roleSpecs(...args)}
function arena_specById(...args){return roleProgression.specById(...args)}
function arena_isRoleRootCell(...args){return roleProgression.isRoleRootCell(...args)}
function arena_applyRolePathToCell(...args){return roleProgression.applyRolePathToCell(...args)}
function arena_cellPathMeta(...args){return roleProgression.cellPathMeta(...args)}
function arena_pathDetails(...args){return roleProgression.pathDetails(...args)}
// =====================================================================
// ARENA_SPEC_HALO_COLORS Ã¢â‚¬â€ per-spec aura tint rendered as a faint ground
// halo beneath each unit. Only WoW-class units have spec halos; standalones
// fall back to their unit accent. Phase 3 visual layer (lite Ã¢â‚¬â€ accessory
// overlays deferred to a dedicated drawing session).
// =====================================================================

const specAccessoryRenderer=createSpecAccessoryRenderer({
  ctx,
  view:()=>({frame}),
  emitParticle:(...args)=>addP(...args),
  randomRange:rnd
});
function arena_specHalo(u){return specAccessoryRenderer.specHalo(u)}
function arena_drawSpecAccessory(u){return specAccessoryRenderer.drawSpecAccessory(u)}

function arena_currentStageRounds(){
  return arena_roundsForStage((currentStage&&currentStage.n)||1);
}

// arena state
let arena={
  phase:'build',          // 'build' | 'wave' | 'cleanup' | 'win' | 'lose'
  round:1,                // 1..6 (6 = boss/elite/final)
  buildTimer:0,           // frames
  buildTimerMax:0,        // frames at start of phase (for bar render)
  cells:{},               // key (row*COLS+col) Ã¢â€ â€™ {unitIdx, level, unitRef}
  king:null,              // {x,y,hp,maxHp,size,name,...}
  pickerOpen:false,       // unit picker modal active
  pickerCell:null,        // {col,row,key}
  pickerScroll:0,         // vertical scroll offset for picker on small screens
  managePanelCell:null,   // tapped on placed unit Ã¢â€ â€™ upgrade/sell panel
  waveSpawnQueue:[],      // queue of enemy idx to spawn this round
  waveSpawnTimer:0,       // frames between spawns
  waveSpawnBatchMode:false,
  waveSpawnBatchIndex:0,
  wavePreview:'',         // text shown during build
  waveThreats:null,       // structured threat data for the threats panel
  waveMechanic:null,      // one light special-enemy mechanic for eligible normal waves
  waveMechanicAssigned:false,
  // Player ultimates Ã¢â‚¬â€ once per stage. Reset in startStage.
  bloodlustUsed:false,
  tranquilityUsed:false,
  bloodlustTimer:0,       // frames remaining
  tranquilityTimer:0,     // frames remaining
  tranquilityTickAcc:0,   // tick accumulator for periodic heal
  spellUsed:[],
  // Click hit-test rects for the twin ultimate buttons (set by arena_drawHud).
  _bloodlustRect:null,
  _tranquilityRect:null,
  // Magical Rift Ã¢â‚¬â€ random event pre-rolled at stage start. If the stage
  // wins the roll, scheduledRiftRound is set to one of the last two rounds
  // for that stage; the rift then fires deterministically that round, ~8s
  // into the wave. One rift max per stage. Players who restart a lost
  // stage re-roll the dice.
  rift:null,                  // {x, y, telegraphTimer, enemyType, count, totalTime}
  scheduledRiftRound:null,    // null | (last-2) | (last) Ã¢â‚¬â€ set in startStage based on arena_roundsForStage
  riftFiredThisRound:false,   // local guard so it can only fire once
  waveElapsed:0,              // frames elapsed in current wave (for rift gate)
  beacons:[],                 // active Beacon of Light zones from Holy Zayt sig: {x,y,r,t,hps,from}
  pauseMenu:false,
  _pauseBtnRect:null,
};

let v8CombatStats=null;

applyCanvasDims();
resize();window.addEventListener('resize',resize);

// =====================
// UNIT DATA
// =====================


// Balanced so Vodka feels like a powerful hero (always stronger than any
// regular unit at the same tier) without being a solo carry. Roughly
// 1.25-1.4Ãƒâ€” the tankiest unit at every level, with a unique sustain kit.


// =====================
// PHASE 2: ENEMIES per act (4 archetypes Ãƒâ€” 5 acts = 20)
// =====================
// v5 enemy baseline pass:
//  - swarm: dmg ~-5% (longer engagements, easier to overwhelm a tank otherwise)
//  - tank: unchanged (HP_MULT_ENEMY=1.10 already covers them)
//  - dps: dmg ~-5%
//  - ranged: dmg -10%, range -10% (slower units mean ranged kite too well)
//  - caster: dmg -10%, range -10%
//  - assassin: hp -10% (high speed survives Ã¢â‚¬â€ should die fast when caught)


// =====================
// PHASE 2: BOSSES (10 + final)
// =====================
// Bosses are property-driven: any cooldown field defined => that ability is in
// the kit. Phase-gated abilities use phaseMin (1=always, 2=below 66%, 3=below 33%).
// Time-enrage triggers after timeEnrageAt frames; desperation triggers below 20% HP.
// v5 boss tuning:
//  - All ability cooldowns Ãƒâ€”1.15 so cadence matches the slower fight pace.
//  - All timeEnrageAt Ãƒâ€”1.25 Ã¢â‚¬â€ fights last longer at slower pace, so enrage
//    needs more head-room to land late, not mid-encounter.


// =====================
// PHASE 2: ARENA ABILITIES (player picks 2 pre-battle)
// =====================
// Cooldowns are in frames at 60 fps. Minimum is 45s (2700 frames).


// =====================
// PHASE 2: STAGES (25 Ã¢â‚¬â€ 5 acts Ãƒâ€” 5 stages)
// =====================
// type: normal | mini | strong | vs | final  (boss tier)
// layout: 'open' | 'bridges' | 'lanes' | 'towers' | 'arena' (boss room)
// weather: clear | rain | storm | fog | night | morning | sunset | sandstorm | snow | blizzard | magma

// v5 stage sweep: every wave list rebuilt around a 10s opener, Ã¢â€°Â¥10s gaps, and
// fewer total waves. Wave-internal +4%/idx HP/DMG bump and +6%/idx count bump
// (applied in updateWaves) recover late-wave intensity without spamming early.
// Boss stages use 3-4 short waves before the boss arrives.


// v5 per-stage scaling: gentler stages 1-5, smoother 6-15 ramp.
// From stage 10 onward, difficulty leans into enemy HP instead of damage spikes
// so Act 3+ fights last longer without instantly deleting the backline.



function getStageMaxLevel(stageN){
  if(stageN<=5)return 2;
  if(stageN<=10)return 3;
  return ARENA_MAX_UNIT_LEVEL;
}

// =====================
// STATE Ã¢â‚¬â€ game mode machine
// 'menu' | 'stageSelect' | 'deckPick' | 'spellPick' | 'perkPick' | 'battle' | 'win' | 'lose'
// =====================
let state=gameState.screen;
function setScreen(next){
  state=next;
  gameState.screen=next;
  return state;
}

const progressState=gameState.progress;
let maxStage=progressState.maxStage; // highest stage unlocked (1..25)
let stageStars=progressState.stageStars; // best stars earned per stage number
let selectedDeck=progressState.selectedDeck; // 6 unit indices for deck
let selectedSpells=progressState.selectedSpells; // 2 spell indices into ARENA_ABILITIES
let beans=progressState.beans;
let unlockedPerks=progressState.unlockedPerks;
let selectedPerks=progressState.selectedPerks;
function setMaxStage(value){maxStage=value;progressState.maxStage=value;return maxStage}
function setStageStars(value){stageStars=value;progressState.stageStars=value;return stageStars}
function setSelectedDeck(value){selectedDeck=value;progressState.selectedDeck=value;return selectedDeck}
function setSelectedSpells(value){selectedSpells=value;progressState.selectedSpells=value;return selectedSpells}
function setBeans(value){beans=Math.max(0,Math.floor(value||0));progressState.beans=beans;return beans}
function addBeans(value){return setBeans(beans+value)}
function setUnlockedPerks(value){unlockedPerks=value;progressState.unlockedPerks=value;return unlockedPerks}
function setSelectedPerks(value){selectedPerks=value;progressState.selectedPerks=value;return selectedPerks}
function applyProgressState(progress){
  setMaxStage(progress.maxStage);
  setStageStars(progress.stageStars);
  setSelectedDeck(progress.selectedDeck);
  setSelectedSpells(progress.selectedSpells);
  setBeans(progress.beans);
  setUnlockedPerks(progress.unlockedPerks);
  setSelectedPerks(progress.selectedPerks);
}

const battleState=gameState.battle;
let units=battleState.units,enemies=battleState.enemies,projectiles=battleState.projectiles,particles=battleState.particles,dmgNums=battleState.damageNumbers,healFx=battleState.healFx,bombs=battleState.bombs,groundFx=battleState.groundFx,beamFx=battleState.beamFx;
const battleArrayAliasSetters={
  units:value=>{units=value},
  enemies:value=>{enemies=value},
  projectiles:value=>{projectiles=value},
  particles:value=>{particles=value},
  damageNumbers:value=>{dmgNums=value},
  healFx:value=>{healFx=value},
  bombs:value=>{bombs=value},
  groundFx:value=>{groundFx=value},
  beamFx:value=>{beamFx=value}
};
function replaceBattleArray(key,next){
  battleState[key]=next;
  if(battleArrayAliasSetters[key])battleArrayAliasSetters[key](next);
  return next;
}
function clearBattleArray(key){return replaceBattleArray(key,[])}
function clearBattleArrays(keys){for(const key of keys)clearBattleArray(key)}

const economyState=gameState.economy;
let crystal=economyState.crystal,maxCrystal=economyState.maxCrystal;
// v3-style upgrade currency: gold earned from kills, resets each stage,
// spent on per-card upgrades during the battle.
let gold=economyState.gold;
let stageGold=economyState.stageGold; // gold earned this stage (display purposes)
function setCrystal(value){crystal=value;economyState.crystal=value;return crystal}
function addCrystal(value){return setCrystal(Math.min(maxCrystal,crystal+value))}
function setGold(value){gold=value;economyState.gold=value;return gold}
function addGold(value){return setGold(gold+value)}
function setStageGold(value){stageGold=value;economyState.stageGold=value;return stageGold}
function addStageGold(value){return setStageGold(stageGold+value)}
function arena_perkEffects(){return getPerkEffects(selectedPerks)}

const squadState=gameState.squad;
let unitLevels=squadState.unitLevels;
let vodkaLevel=squadState.vodkaLevel;
let cardHand=squadState.cardHand;   // 6 unit indices currently visible (== selectedDeck)
let vodkaUnit=squadState.vodkaUnit,vodkaDeployCD=squadState.vodkaDeployCD,vodkaDead=squadState.vodkaDead,vodkaRespawn=squadState.vodkaRespawn;
let deckPickStage=squadState.deckPickStage; // working list during pick screen
let spellPickStage=squadState.spellPickStage;
let abilityCooldowns=squadState.abilityCooldowns; // current battle CDs for picked spells
let abilityUsed=squadState.abilityUsed;
function setVodkaLevel(value){vodkaLevel=value;squadState.vodkaLevel=value;return vodkaLevel}
function setVodkaUnit(value){vodkaUnit=value;squadState.vodkaUnit=value;return vodkaUnit}
function setVodkaDeployCD(value){vodkaDeployCD=value;squadState.vodkaDeployCD=value;return vodkaDeployCD}
function setVodkaDead(value){vodkaDead=value;squadState.vodkaDead=value;return vodkaDead}
function setVodkaRespawn(value){vodkaRespawn=value;squadState.vodkaRespawn=value;return vodkaRespawn}
function setCardHand(value){cardHand=value;squadState.cardHand=value;return cardHand}
function setDeckPickStage(value){deckPickStage=value;squadState.deckPickStage=value;return deckPickStage}
function setSpellPickStage(value){spellPickStage=value;squadState.spellPickStage=value;return spellPickStage}
function setAbilityUsed(value){abilityUsed=value;squadState.abilityUsed=value;return abilityUsed}

const campaignState=gameState.campaign;
let currentStage=campaignState.currentStage; // STAGES entry currently being played
let currentStageIdx=campaignState.currentStageIdx;
let playerCastle=campaignState.playerCastle,enemyCastle=campaignState.enemyCastle;
let bossRef=campaignState.bossRef,bossWarning=campaignState.bossWarning,bossSpawned=campaignState.bossSpawned;
let waveIdx=campaignState.waveIdx,stageTime=campaignState.stageTime;
let stageOver=campaignState.stageOver,stageWon=campaignState.stageWon,stageStartTimer=campaignState.stageStartTimer;
let crystalNodes=campaignState.crystalNodes,towers=campaignState.towers;
function setCurrentStage(value){currentStage=value;campaignState.currentStage=value;return currentStage}
function setCurrentStageIdx(value){currentStageIdx=value;campaignState.currentStageIdx=value;return currentStageIdx}
function setPlayerCastle(value){playerCastle=value;campaignState.playerCastle=value;return playerCastle}
function setEnemyCastle(value){enemyCastle=value;campaignState.enemyCastle=value;return enemyCastle}
function setBossRef(value){bossRef=value;campaignState.bossRef=value;return bossRef}
function setBossSpawned(value){bossSpawned=value;campaignState.bossSpawned=value;return bossSpawned}
function setStageOver(value){stageOver=value;campaignState.stageOver=value;return stageOver}
function setStageWon(value){stageWon=value;campaignState.stageWon=value;return stageWon}
function setCrystalNodes(value){crystalNodes=value;campaignState.crystalNodes=value;return crystalNodes}
function setTowers(value){towers=value;campaignState.towers=value;return towers}
function setBossWarning(value){bossWarning=value;campaignState.bossWarning=value;return bossWarning}

const uiState=gameState.ui;
let selectedCard=uiState.selectedCard;
// scroll offsets for deck pick / spell pick screens
let deckPickScroll=uiState.deckPickScroll,spellPickScroll=uiState.spellPickScroll,perkPickScroll=uiState.perkPickScroll;
const HAND_SIZE=6;
let frame=gameState.combatRuntime.frame;
function advanceFrame(){frame++;gameState.combatRuntime.frame=frame}
let screenShake=uiState.screenShake,flashText=uiState.flashText,flashTimer=uiState.flashTimer,flashColor=uiState.flashColor;
let _sigBanner=uiState.signatureBanner;
let codexOpen=uiState.codexOpen,codexScroll=uiState.codexScroll,codexUnit=uiState.codexUnit;

let abilityTargeting=uiState.abilityTargeting; // -1=none, 0/1 for waiting on target
// Weather state
let weatherParticles=createWeatherParticles(null,W,H,rnd);
// Stage select scroll
let stageSelectScroll=uiState.stageSelectScroll;
function setSelectedCard(value){selectedCard=value;uiState.selectedCard=value;return selectedCard}
function setStageSelectScroll(value){stageSelectScroll=value;uiState.stageSelectScroll=value;return stageSelectScroll}
function setDeckPickScroll(value){deckPickScroll=value;uiState.deckPickScroll=value;return deckPickScroll}
function setSpellPickScroll(value){spellPickScroll=value;uiState.spellPickScroll=value;return spellPickScroll}
function setPerkPickScroll(value){perkPickScroll=value;uiState.perkPickScroll=value;return perkPickScroll}
function setCodexOpen(value){codexOpen=value;uiState.codexOpen=value;return codexOpen}
function setCodexScroll(value){codexScroll=value;uiState.codexScroll=value;return codexScroll}
function setCodexUnit(value){codexUnit=value;uiState.codexUnit=value;return codexUnit}
function setSignatureBanner(value){_sigBanner=value;uiState.signatureBanner=value;return _sigBanner}
function setAbilityTargeting(value){abilityTargeting=value;uiState.abilityTargeting=value;return abilityTargeting}

// =====================
// SAVE / LOAD
// =====================
function arena_currentSquadCounts(){
  return countSquadCells(arena&&arena.cells,{playerUnits:PLAYER_UNITS,heroUnit:VODKA});
}
function arena_updateStageChallengeUsage(){
  recordStageChallengeUsage(arena,arena_currentSquadCounts());
}
function arena_computeStageStars(won){
  return computeStageStars({
    won,
    currentStage,
    playerCastle,
    arenaState:arena,
    counts:arena_currentSquadCounts()
  });
}
function loadSave(){
  const progress=loadProgress({maxStage,stageStars,selectedDeck,selectedSpells,beans,unlockedPerks,selectedPerks,unitCount:PLAYER_UNITS.length});
  applyProgressState(progress);
}
function saveSave(){
  // Save only outside-battle state. Unit levels and hero level are per-stage scratch state.
  const meta=saveProgress({maxStage,stageStars,selectedDeck,selectedSpells,beans,unlockedPerks,selectedPerks});
  applyProgressState(meta);
}
function arena_unlockPerk(perkId){
  const result=unlockPerk(perkId,{beans,maxStage,unlockedPerks,selectedPerks});
  if(!result.ok){
    const perk=ARENA_PERKS.find(p=>p.id===perkId);
    if(perk&&perk.unlockStage>maxStage)showFlash('Unlocks at Stage '+perk.unlockStage,'#ffb0a6',70);
    else showFlash('Not enough Beans','#ffb0a6',70);
    return false;
  }
  setBeans(result.progress.beans);
  setUnlockedPerks(result.progress.unlockedPerks);
  if(selectedPerks.length<perkSlotCount(maxStage)&&!selectedPerks.includes(perkId)){
    setSelectedPerks([...selectedPerks,perkId]);
  }
  saveSave();
  SFX.purchase();
  showFlash('Unlocked '+result.perk.name,'#6ee7b7',70);
  return true;
}
function arena_togglePerk(perkId){
  const result=toggleSelectedPerk(perkId,{beans,maxStage,unlockedPerks,selectedPerks});
  if(!result.ok)return false;
  setSelectedPerks(result.progress.selectedPerks);
  saveSave();
  SFX.purchase();
  return true;
}
function arena_claimDoubleBeansReward(){
  if(state!=='win'||!arena||!arena.beansRewardBase||arena.beansRewardDoubled)return false;
  return showRewardedAd('doubleBeansAfterVictory',{
    onReward:()=>{
      addBeans(arena.beansRewardBase);
      arena.beansRewardDoubled=true;
      saveSave();
      showFlash('+'+arena.beansRewardBase+' Beans bonus','#ffd166',90);
      SFX.purchase();
    },
    onUnavailable:()=>showFlash('Ad not available','#ffb0a6',80)
  });
}
function arena_claimSecondChanceRetry(){
  if(state!=='lose'||!arena||arena.adRetryUsed)return false;
  return showRewardedAd('retryLostWave',{
    onReward:()=>{
      arena.adRetryUsed=true;
      clearBattleArrays(STAGE_TRANSIENT_BATTLE_ARRAYS);
      if(arena.king){
        arena.king.hp=Math.max(1,Math.round((arena.king.maxHp||1)*0.5));
        setPlayerCastle(arena.king);
      }
      setBossRef(null);setBossSpawned(false);
      setStageOver(false);setStageWon(false);
      setScreen('battle');
      arena_startBuild(Math.max(8,Math.round(ARENA_BUILD_NEXT*0.5)));
      arena_buildWavePreview();
      showFlash('SECOND CHANCE - RETRY WAVE','#ffd166',100);
      SFX.levelUp();
    },
    onUnavailable:()=>showFlash('Ad not available','#ffb0a6',80)
  });
}

// =====================
// HELPERS
// =====================



function addP(x,y,color,n,sz){if(particles.length>180)return;sz=sz||3;for(let i=0;i<n;i++)particles.push({x,y,vx:rnd(-2,2),vy:rnd(-2,2),life:1,color,sz:sz*rnd(0.6,1.2)})}
function addDmg(x,y,v,c,opts){if(dmgNums.length>32)return;let _v=v;if(typeof v==='number'){if(!Number.isFinite(v))return;_v=Math.round(v);if(_v<=2)return}else{const _txt=String(v==null?'':v).trim();if(/^[+-]?[0-2](?:\.0+)?$/i.test(_txt))return;_v=v}const isNum=typeof _v==='number';dmgNums.push({x:x+(opts&&opts.dx!=null?opts.dx:rnd(-3,3)),y:y+(opts&&opts.dy!=null?opts.dy:0),val:_v,color:c||'#fff',life:1,vy:opts&&opts.vy!=null?opts.vy:-0.45,vx:opts&&opts.vx!=null?opts.vx:rnd(-0.08,0.08),sz:opts&&opts.sz||(isNum?12:11),bold:opts&&opts.bold||false,outline:opts&&opts.outline||null})}
let _lastHealSfx=0;
function addHealFx(x,y,v,big,source,target){const _heal=Math.round(Number(v)||0);if(!Number.isFinite(_heal)||_heal<=0)return;if(source)arena_statsRecordHeal(source,target,_heal);if(_heal<=2)return;if(healFx.length>20)return;if(big&&frame-_lastHealSfx>=30){_lastHealSfx=frame;SFX.bigHeal()}else if(frame-_lastHealSfx>=60){_lastHealSfx=frame;SFX.heal()};healFx.push({x:x+rnd(-3,3),y:y-10,val:_heal,life:1,big:!!big,vy:big?-0.45:-0.32,vx:rnd(-0.06,0.06)})}
function arena_applyHealingReceived(target,amount){
  return applyHealingReceived(target,amount,{healingReceivedMult:arena_batataHealingReceivedMult});
}
function arena_statsResetStage(stage){
  v8CombatStats=createCombatStats(stage,frame);
}
function arena_statsStartRound(){
  v8CombatStats=startCombatRound(v8CombatStats,{stage:currentStage,frame,round:(arena&&arena.round)||1,tickHz:GAME_TICK_HZ});
}
function arena_statsRecordDamage(target,attacker,amount){
  recordCombatDamage(v8CombatStats,target,attacker,amount);
}
function arena_statsRecordHeal(source,target,amount){
  recordCombatHeal(v8CombatStats,source,target,amount);
}
function arena_applyTrackedHeal(target,amount,source,big,alreadyAdjusted){
  const effects=arena_perkEffects();
  const tunedAmount=source&&source.isPlayer&&source.arch==='healer'?Math.round(amount*(1+effects.healerOutputMult)):amount;
  return applyTrackedHeal(target,tunedAmount,{
    source,
    big,
    alreadyAdjusted,
    adjustHealingReceived:arena_applyHealingReceived,
    emitHealFx:addHealFx
  });
}
function arena_statsFinishRound(result){
  finishCombatRound(v8CombatStats,{frame,result,tickHz:GAME_TICK_HZ});
}
function arena_statsFormat(v){
  return formatCombatStatValue(v);
}
function arena_applySearingBrandOnBasic(attacker,target){
  if(!attacker||!target||target.hp<=0)return;
  if(!attacker.searingBrandEvery)return;
  if(!(target.arch==='tank'||target.taunt))return;
  attacker._searingBrandHits=(attacker._searingBrandHits||0)+1;
  if(attacker._searingBrandHits<attacker.searingBrandEvery)return;
  attacker._searingBrandHits=0;
  const extra=Math.max(1,Math.round((target.maxHp||target.hp||1)*(attacker.searingBrandHpPct||0.05)));
  target._searingBrandTimer=attacker.searingBrandDur||Math.round(4*GAME_TICK_HZ);
  target._searingBrandHealCut=attacker.searingBrandHealCut||0.10;
  dealDamage(target,extra,attacker,'magic');
  addDmg(target.x,target.y-(target.size||20)-8,'SEARING BRAND','#ff6a22',{sz:13,bold:true,outline:'#4a1700'});
  addP(target.x,target.y,'#ff6a22',18,4);
  addP(target.x,target.y,'#ffd08a',8,3);
  groundFx.push({x:target.x,y:target.y,r:0,maxR:Math.max(38,(target.size||20)*1.5),life:0.45,color:'#ff6a22'});
}
function arena_applyRoyalStingOnBasic(attacker,target){
  if(!attacker||!target||target.hp<=0)return;
  if(attacker.name!=='Hornet Sovereign'||!attacker.royalStingEvery)return;
  if(!(target.arch==='tank'||target.taunt))return;
  attacker._royalStingHits=(attacker._royalStingHits||0)+1;
  if(attacker._royalStingHits<attacker.royalStingEvery)return;
  attacker._royalStingHits=0;
  const extra=Math.max(1,Math.round((target.maxHp||target.hp||1)*(attacker.royalStingHpPct||0.03)));
  dealDamage(target,extra,attacker,'magic');
  target.poisonTimer=Math.max(target.poisonTimer||0,attacker.royalStingDur||360);
  target.poisonDmgVal=Math.max(target.poisonDmgVal||0,attacker.royalStingPoisonDmg||4);
  target.ampTimer=Math.max(target.ampTimer||0,attacker.royalStingDur||360);
  target.ampMult=Math.max(target.ampMult||1,attacker.royalStingAmp||1.12);
  target._royalStingTimer=Math.max(target._royalStingTimer||0,attacker.royalStingDur||360);
  addDmg(target.x,target.y-(target.size||20)-8,'ROYAL STING','#ffdd44',{sz:12,bold:true,outline:'#4a2600'});
  addP(target.x,target.y,'#ffdd44',14,4);
  addP(target.x,target.y,'#88cc00',8,3);
  groundFx.push({x:target.x,y:target.y,r:0,maxR:Math.max(34,(target.size||20)*1.35),life:0.35,color:'#ffdd44'});
}
function arena_isProtectedByTank(unit){
  if(!unit||unit.hp<=0)return false;
  for(const t of units){
    if(!t||t===unit||t.hp<=0||!t.isPlayer||t.isGhost||t.isMinion)continue;
    if(!(t.arch==='tank'||t.taunt))continue;
    const tankInFront=t.y<=unit.y+20;
    const laneCover=Math.abs(t.x-unit.x)<=125;
    if(tankInFront&&laneCover&&dist(t,unit)<=230)return true;
  }
  return false;
}
function arena_emberDecreeDamage(base,target,isTankCircle){
  if(!target)return base;
  if(target.isMinion)return Math.round(base*0.50);
  if(target.arch==='tank'||target.taunt)return Math.round(base*(isTankCircle?1.0:0.65));
  if(target.arch==='melee')return Math.round(base*0.75);
  if(arena_isProtectedByTank(target))return Math.round(base*0.45);
  return base;
}
function showFlash(t,c,d){
  flashText=t;flashTimer=d||80;flashColor=c||'#fff';
  uiState.flashText=flashText;uiState.flashTimer=flashTimer;uiState.flashColor=flashColor;
}
// Lerp two #rrggbb colors by t in [0,1]. Used for level-tier accent brightening.
function lerpColor(a,b,t){
  const pa=a&&a[0]==='#'?a:'#000000',pb=b&&b[0]==='#'?b:'#ffffff';
  const ar=parseInt(pa.slice(1,3),16),ag=parseInt(pa.slice(3,5),16),ab=parseInt(pa.slice(5,7),16);
  const br=parseInt(pb.slice(1,3),16),bg=parseInt(pb.slice(3,5),16),bb=parseInt(pb.slice(5,7),16);
  const r=Math.round(ar+(br-ar)*t),g=Math.round(ag+(bg-ag)*t),bl=Math.round(ab+(bb-ab)*t);
  return '#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+bl.toString(16).padStart(2,'0');
}

// =====================
// STAT SCALING (per level)
// =====================
function getStats(unitData,level){
  const out={...unitData};
  for(let i=0;i<Math.min(level-1,4);i++){
    const u=unitData.up[i];
    for(const k in u)out[k]=u[k];
  }
  if(out.range){
    const rangedLike=out.arch==='ranged'||out.arch==='caster'||out.arch==='healer'||out.prefersRanged||out.projType;
    const meleeLike=out.arch==='tank'||out.arch==='melee'||(!rangedLike&&out.range<=80);
    if(rangedLike)out.range=Math.round(out.range+12);
    else if(meleeLike)out.range=Math.round(out.range+12);
  }
  out.level=level;
  out.hasL3=level>=3;
  out.hasL5=arena_isCapstoneLevel(level);
  return out;
}
function getUnitStats(idx){return getStats(PLAYER_UNITS[idx],unitLevels[idx])}
function getVodkaStats(){return getStats(VODKA,vodkaLevel)}
const ARENA_PLAYER_MOVE_TUNING={
  ranged:{mult:1.16,min:0.22},
  caster:{mult:1.16,min:0.22},
  healer:{mult:1.12,min:0.22},
  melee:{mult:1.10,min:0.33},
  paladin:{mult:1.10,min:0.33}
};
function arena_tunedPlayerMoveSpeed(u){
  if(!u||typeof u.speed!=='number')return u&&u.speed;
  const t=ARENA_PLAYER_MOVE_TUNING[u.arch];
  if(!t)return u.speed;
  return Math.round(Math.max(t.min,u.speed*t.mult)*100)/100;
}
function arena_applyPlayerMoveSpeedTuning(u){
  if(!u||u._playerMoveTuned)return;
  const tuned=arena_tunedPlayerMoveSpeed(u);
  if(typeof tuned==='number')u.speed=tuned;
  u._playerMoveTuned=true;
}

// =====================
// SPAWN / DEPLOY
// =====================
function deployUnit(idx,x,y){
  const stats=getUnitStats(idx);
  if(crystal<stats.cost)return false;
  setCrystal(crystal-stats.cost);
  spawnUnit(idx,x,y,stats);
  return true;
}
function spawnUnit(idx,x,y,stats){
  // Tanks get a small extra HP buff so they're meaningfully tankier
  // than the cheaper melee/ranged in the same crystal range.
  const tankBuff=stats.arch==='tank'?1.10:1; // v5: 1.15 Ã¢â€ â€™ 1.10 (symmetric with enemy tankBuff)
  const _hp=Math.round(stats.hp*HP_MULT_PLAYER*tankBuff);
  const u={...stats,x,y,size:(stats.size||16)*UNIT_VISUAL_SCALE,maxHp:_hp,hp:_hp,unitIdx:idx,isPlayer:true,
    cd:0,target:null,facing:1,
    stealthHits:0,firstHitDone:false,
    abilCD:{},
    summonsLeft:stats.summonOnDeploy?1:0,
    chargeRemaining:stats.chargeOnDeploy?100:0,
    bobPhase:Math.random()*Math.PI*2,
    healCDt:0,hotCDt:0,
    polymorphCDt:0,bombTrapCDt:0,slowTrapCDt:0,triageCD:0,
    lastStandUsed:false,
    spawnFrame:frame,
    activeBuffs:[]
  };
  arena_applyPlayerMoveSpeedTuning(u);
  units.push(u);
  // Jafaar on deploy: summon 3 fava minions at L1, plus a small tank fava if L3.
  if(stats.summonOnDeploy){
    spawnMinion(u,'foul',3);
    if(u.hasL3)spawnMinion(u,'foulTank',1);
  }
  // Charge primer Ã¢â‚¬â€ armed on deploy, fires lazily once an enemy comes into
  // range. The actual leap is driven from updateUnit each frame.
  if(stats.chargeOnDeploy){
    u.chargePending=true;
    addP(x,y,'#ffaa44',12,3);
  }
  return u;
}
function spawnMinion(parent,kind,count){
  for(let i=0;i<count;i++){
    let m;
    if(kind==='foulTank'){
      // Beefy tank fava Ã¢â‚¬â€ slower and harder-hitting, distinct dark armored sprite
      // so it reads at a glance vs the basic foul minion.
      const hp=420+vodkaLevel*50;
      m={x:parent.x+rnd(-22,22),y:parent.y+rnd(-12,12),
        maxHp:hp,hp:hp,dmg:8,speed:0.30,atkSpd:84,range:30,size:22*UNIT_VISUAL_SCALE,armor:5,magicRes:2,
        isPlayer:true,isMinion:true,parent,kind,cd:0,color:'#3a4f10',accent:'#1a280a',facing:1,arch:'tank',
        bobPhase:Math.random()*Math.PI*2};
    }else if(kind==='foulRanged'){
      // Magic-flinging fava Ã¢â‚¬â€ same HP as basic foul minion, fires curse projectile.
      const hp=180+vodkaLevel*25;
      m={x:parent.x+rnd(-15,15),y:parent.y+rnd(-10,10),
        maxHp:hp,hp:hp,dmg:14,speed:0.32,atkSpd:90,range:140,size:13*UNIT_VISUAL_SCALE,armor:0,magicRes:1,
        isPlayer:true,isMinion:true,parent,kind,cd:0,color:'#9b59b6',accent:'#5a2e6a',facing:1,arch:'ranged',
        projType:'curse',
        bobPhase:Math.random()*Math.PI*2};
    }else if(kind==='fireElemental'){
      const hp=140+vodkaLevel*20;
      m={x:parent.x+28,y:parent.y-8,
        maxHp:hp,hp:hp,dmg:13,speed:0.30,atkSpd:90,range:150,size:13*UNIT_VISUAL_SCALE,armor:0,magicRes:2,
        isPlayer:true,isMinion:true,parent,kind,cd:0,color:'#ff6633',accent:'#aa2200',facing:1,arch:'ranged',
        projType:'fire',
        bobPhase:Math.random()*Math.PI*2};
    }else if(kind==='waterElemental'){
      const hp=170+vodkaLevel*25;
      m={x:parent.x+28,y:parent.y-8,
        maxHp:hp,hp:hp,dmg:11,speed:0.28,atkSpd:84,range:155,size:14*UNIT_VISUAL_SCALE,armor:1,magicRes:3,
        isPlayer:true,isMinion:true,parent,kind,cd:0,color:'#44aadd',accent:'#1a6a9a',facing:1,arch:'ranged',
        projType:'ice',
        bobPhase:Math.random()*Math.PI*2};
    }else if(kind==='stormElemental'){
      const hp=130+vodkaLevel*18;
      m={x:parent.x+28,y:parent.y-8,
        maxHp:hp,hp:hp,dmg:15,speed:0.32,atkSpd:78,range:160,size:13*UNIT_VISUAL_SCALE,armor:0,magicRes:2,
        isPlayer:true,isMinion:true,parent,kind,cd:0,color:'#aa88ff',accent:'#6644cc',facing:1,arch:'ranged',
        projType:'lightning',
        bobPhase:Math.random()*Math.PI*2};
    }else if(kind==='flameSprite'){
      const hp=220+(parent.level||1)*35;
      m={x:parent.x+rnd(-15,15),y:parent.y+rnd(-8,8),
        maxHp:hp,hp:hp,dmg:9,speed:0.18,atkSpd:84,range:360,size:12*UNIT_VISUAL_SCALE,armor:0,magicRes:2,
        isPlayer:true,isMinion:true,parent,kind,cd:0,color:'#ff8833',accent:'#cc4400',facing:1,arch:'ranged',
        projType:'fire',familiar:true,untargetable:true,familiarSide:-1,
        bobPhase:Math.random()*Math.PI*2};
    }else if(kind==='imp'){
      const hp=240+(parent.level||1)*35;
      m={x:parent.x+rnd(-18,18),y:parent.y+rnd(-10,10),
        maxHp:hp,hp:hp,dmg:10,speed:0.18,atkSpd:72,range:340,size:12*UNIT_VISUAL_SCALE,armor:0,magicRes:1,
        isPlayer:true,isMinion:true,parent,kind,cd:0,color:'#44cc44',accent:'#228822',facing:1,arch:'ranged',
        projType:'fire',familiar:true,untargetable:true,familiarSide:1,
        bobPhase:Math.random()*Math.PI*2};
    }else if(kind==='felhound'){
      const hp=350+vodkaLevel*40;
      m={x:parent.x+rnd(-20,20),y:parent.y+rnd(-12,12),
        maxHp:hp,hp:hp,dmg:16,speed:0.38,atkSpd:66,range:36,size:18*UNIT_VISUAL_SCALE,armor:2,magicRes:3,
        isPlayer:true,isMinion:true,parent,kind,cd:0,color:'#5a3a8a',accent:'#2a1a4a',facing:1,arch:'melee',
        _spellLockCD:0,_spellLockEvery:8*GAME_TICK_HZ,
        bobPhase:Math.random()*Math.PI*2};
    }else if(kind==='wolf'){
      const hp=400+(parent.level||1)*40;
      m={x:parent.x+20,y:parent.y+10,maxHp:hp,hp:hp,dmg:14,speed:0.40,atkSpd:60,range:36,size:18,armor:2,magicRes:1,
        isPlayer:true,isMinion:true,parent,kind,cd:0,color:'#888888',accent:'#555555',facing:1,
        bobPhase:Math.random()*Math.PI*2};
    }else if(kind==='raptor'){
      const hp=300+(parent.level||1)*35;
      m={x:parent.x+20,y:parent.y+10,maxHp:hp,hp:hp,dmg:12,speed:0.45,atkSpd:54,range:36,size:16,armor:1,magicRes:0,
        isPlayer:true,isMinion:true,parent,kind,cd:0,color:'#aa6633',accent:'#663311',facing:1,
        bobPhase:Math.random()*Math.PI*2};
    }else if(kind==='spiritBeast'){
      const hp=500+(parent.level||1)*50;
      m={x:parent.x+20,y:parent.y+10,maxHp:hp,hp:hp,dmg:16,speed:0.35,atkSpd:66,range:36,size:20,armor:3,magicRes:2,
        isPlayer:true,isMinion:true,parent,kind,cd:0,color:'#3aa84e',accent:'#1a5a2a',facing:1,
        _spiritMendCD:0,_spiritMendEvery:8*GAME_TICK_HZ,_spiritMendPct:0.05,
        bobPhase:Math.random()*Math.PI*2};
    }else{
      // Basic foul melee minion (existing kind 'foul').
      const hp=200+vodkaLevel*30;
      m={x:parent.x+rnd(-15,15),y:parent.y+rnd(-10,10),
        maxHp:hp,hp:hp,dmg:12,speed:0.4,atkSpd:60,range:32,size:13*UNIT_VISUAL_SCALE,armor:0,magicRes:0,
        isPlayer:true,isMinion:true,parent,kind,cd:0,color:'#7b8a3a',accent:'#4f5d22',facing:1,arch:'melee',
        bobPhase:Math.random()*Math.PI*2};
    }
    m.spawnFrame=frame;
    nerfMinion(m);
    units.push(m);
    if(kind==='felhound'){
      addDmg(m.x,m.y-m.size,'FELHOUND!','#aa66ff',{sz:12,bold:true});
      addP(m.x,m.y,'#aa66ff',18,4);addP(parent.x,parent.y,'#5a3a8a',10,3);
      groundFx.push({x:m.x,y:m.y,r:0,maxR:40,life:0.45,color:'#5a3a8a'});
    }
  }
}
function arena_spawnGhoul(parent,sx,sy){
  if(!parent.raiseGhoul)return;
  if(parent.raiseGhoul.active>=parent.raiseGhoul.maxGhouls)return;
  const hp=Math.round(parent.maxHp*0.25);
  const m={x:sx+rnd(-15,15),y:sy+rnd(-10,10),
    maxHp:hp,hp:hp,dmg:Math.round(parent.dmg*0.40),speed:0.45,atkSpd:72,range:32,size:16*UNIT_VISUAL_SCALE,armor:1,magicRes:0,
    isPlayer:true,isMinion:true,parent,kind:'ghoul',cd:0,color:'#4a6a2a',accent:'#2a4010',facing:1,arch:'melee',
    bobPhase:Math.random()*Math.PI*2,spawnFrame:frame};
  nerfMinion(m);
  units.push(m);
  parent.raiseGhoul.active++;
  addP(sx,sy,'#44ff44',14,4);addDmg(sx,sy-10,'GHOUL!','#44ff44');
}
function arena_spawnTreant(parent,tx,ty,dur){
  const _lv=parent.level||1;const _hp=80+_lv*30;
  const m={x:tx,y:ty,maxHp:_hp,hp:_hp,dmg:0,speed:0.20,atkSpd:999,range:120,size:12*UNIT_VISUAL_SCALE,armor:1,magicRes:2,
    isPlayer:true,isMinion:true,parent,kind:'treant',cd:0,
    _treantHealPct:0.04,_treantTick:0,
    color:'#2a5a1a',accent:'#1a3a0a',facing:1,bobPhase:Math.random()*Math.PI*2,lifeTicks:dur,spawnFrame:frame};
  nerfMinion(m);units.push(m);
  addP(tx,ty,'#44ff66',12,4);addDmg(tx,ty-8,'TREANT!','#44ff66');
}
function deployVodka(){
  if(vodkaDead||vodkaUnit||vodkaDeployCD>0)return;
  const stats=getVodkaStats();
  if(crystal<stats.cost){showFlash('NEED '+stats.cost+' CRYSTALS','#aa3333',50);return}
  setCrystal(crystal-stats.cost);
  const _vhp=Math.round(stats.hp*HP_MULT_PLAYER);
  setVodkaUnit({...stats,size:(stats.size||16)*UNIT_VISUAL_SCALE,x:W/2,y:DEPLOY_TOP+20,maxHp:_vhp,hp:_vhp,isPlayer:true,isHero:true,
    cd:0,target:null,facing:1,abilCD:{},furyTimer:0,
    bobPhase:0,activeBuffs:[]});
  units.push(vodkaUnit);
  showFlash('VODKA UNLEASHED!','#ff8c00',60);
}

// =====================
// MOVEMENT & TARGETING
// =====================
// Global speed scalar Ã¢â‚¬â€ slows all units + enemies uniformly so the larger arena
// gives time to react. Lower = slower combat pacing.
// v5: 0.7 Ã¢â€ â€™ 0.55 (~21% slower). Enemies get an extra Ãƒâ€”0.85 in moveToward so
// they feel less aggressive without making player units sluggish.
function arena_combatBounds(){
  const lane=arena_laneBounds();
  return createCombatBounds({
    arenaLeft:lane.left,
    arenaRight:lane.right,
    arenaTop:ARENA_TOP,
    arenaBot:ARENA_BOT,
    playerCastle,
    enemyCastle,
    leashForward:ARENA_LEASH_FWD,
    leashBack:ARENA_LEASH_BACK,
    leashSide:ARENA_LEASH_SIDE
  });
}
function moveToward(u,tx,ty,sp){
  moveCombatActorToward(u,tx,ty,sp,arena_combatBounds());
}
function clampToArena(u){
  clampCombatActorToArena(u,arena_combatBounds());
}
// arena Divine Storm helper Ã¢â‚¬â€ reusable AoE pulse called from the per-4th-hit
// paladin passive (every paladin build inherits it). 4 holy waves radiate
// in cardinal directions: damage enemies in each corridor, splash-heal allies
// in each corridor. Tuned weaker than the old signature version since it now
// fires every 4 attacks instead of on a 20s cooldown.
function arena_fireDivineStorm(u){
  if(!u||u.hp<=0)return;
  const _waveLen=160,_waveWidth=36;
  let _hasReachable=false;
  for(const _e of enemies){
    if(_e.hp<=0)continue;
    if(Math.hypot(_e.x-u.x,_e.y-u.y)<=_waveLen+_waveWidth){_hasReachable=true;break}
  }
  if(!_hasReachable)return;
  const _dmg=Math.round(u.dmg*1.20);
  const _heal=Math.round(u.maxHp*0.05);
  const _angles=[0,Math.PI/2,Math.PI,3*Math.PI/2];
  for(const ang of _angles){
    for(const e of enemies){
      if(e.hp<=0)continue;
      const ex=e.x-u.x,ey=e.y-u.y;
      const proj=ex*Math.cos(ang)+ey*Math.sin(ang);
      if(proj<0||proj>_waveLen)continue;
      const perp=Math.abs(ex*-Math.sin(ang)+ey*Math.cos(ang));
      if(perp>_waveWidth)continue;
      dealDamage(e,_dmg,u,'magic');
      addP(e.x,e.y,'#ffe066',8,4);
    }
    for(const a of units){
      if(a.hp<=0||!a.isPlayer||a.isGhost)continue;
      const ax=a.x-u.x,ay=a.y-u.y;
      const proj=ax*Math.cos(ang)+ay*Math.sin(ang);
      if(proj<0||proj>_waveLen)continue;
      const perp=Math.abs(ax*-Math.sin(ang)+ay*Math.cos(ang));
      if(perp>_waveWidth)continue;
      if(a.hp<a.maxHp){
        arena_applyTrackedHeal(a,_heal,u,false);
      }
    }
    const _midR=_waveLen*0.5;
    groundFx.push({x:u.x+Math.cos(ang)*_midR,y:u.y+Math.sin(ang)*_midR,r:0,maxR:_waveWidth+8,life:0.32,color:'#ffe066',flatten:true});
    for(let i=1;i<=10;i++){
      const px=u.x+Math.cos(ang)*_waveLen*(i/10);
      const py=u.y+Math.sin(ang)*_waveLen*(i/10);
      addP(px,py,'#ffe066',2,3);
    }
  }
  groundFx.push({x:u.x,y:u.y,r:0,maxR:_waveLen,life:0.5,color:'#ffd700',flatten:true});
  groundFx.push({x:u.x,y:u.y,r:0,maxR:50,life:0.3,color:'#ffe066',flatten:true});
  addDmg(u.x,u.y-u.size-6,'DIVINE STORM!','#ffe066');
  screenShake=Math.max(screenShake,5);
}
// arena leap-clamp: keep a player unit's position INSIDE its leash box after a
// signature/charge teleports it. Without this, leaps that land outside leash
// strand the unit because moveToward refuses any move that keeps the unit
// outside leash Ã¢â€ â€™ visible "frozen after skill" bug.
function arena_clampToLeash(u){
  clampCombatActorToLeash(u,arena_combatBounds());
}
function arena_resolvePlayerUnitOverlaps(){
  resolvePlayerUnitOverlaps({
    isWaveActive:state==='battle'&&arena&&arena.phase==='wave',
    units,
    frame,
    bounds:arena_combatBounds()
  });
}
function findTarget(u,list){
  return findNearestTarget(u,list);
}
function arena_isGripReserved(e,u){
  return !!(e&&e._gripReservedUntil&&frame<e._gripReservedUntil&&e._grippedBy!==u);
}
function arena_reserveGripTarget(e,u,dur){
  if(!e)return;
  e._gripReservedUntil=frame+(dur||60);
  e._grippedBy=u;
}
function arena_isGapCloserReserved(e,u){
  return !!(e&&e._gapCloserReservedUntil&&frame<e._gapCloserReservedUntil&&e._gapCloserBy!==u);
}
function arena_reserveGapCloserTarget(e,u,dur){
  if(!e)return;
  e._gapCloserReservedUntil=frame+(dur||36);
  e._gapCloserBy=u;
}
function arena_findUnreservedEnemyInRange(u,maxRange,minRange){
  let best=null,bestD=Infinity;
  for(const e of enemies){
    if(e.hp<=0||e.charmed||e.burrowing||e.untargetable)continue;
    if(arena_isGripReserved(e,u)||arena_isGapCloserReserved(e,u))continue;
    const d=dist(u,e);
    if(d<(minRange||0)||d>maxRange)continue;
    if(d<bestD){bestD=d;best=e}
  }
  return best;
}
// v5: boss saturation cap. When this many units are already within attack
// range of a boss/elite, additional units redirect to the next-nearest target.
// Stops your whole team from stacking on the boss while ranged enemies free-kite.
function arena_targetingView(){
  return createTargetingView({
    bounds:arena_combatBounds(),
    inArena:state==='battle'&&arena&&arena.phase,
    enemies,
    towers
  });
}
function updateBossEngagement(){
  updateBossEngagementCounts({enemies,units});
}
function isSaturatedTarget(t){
  return isSaturatedCombatTarget(t);
}
// arena leash-reachability filter: a target is "reachable" if the unit can
// attack it from inside its leash cone (i.e. the target is within u.range of
// SOME point in [homeXÃ‚Â±LEASH_SIDE] Ãƒâ€” [homeY-LEASH_FWD, homeY+LEASH_BACK]).
// Without this filter, units can lock onto a backline enemy that's outside
// their leash, walk forward, get rejected by moveToward, and freeze in place.
function arena_isReachable(u,t){
  return isReachableFromLeash(u,t,arena_targetingView());
}
function findEnemyForUnit(u){
  return findEnemyTargetForUnit(u,arena_targetingView());
}
// Backline-preference target finder for assassins (Felfel) and any unit with
// `prefersRanged: true`. Picks a ranged/caster enemy first, falls back to the
// standard nearest-enemy logic (which itself respects boss saturation).
function findRangedEnemyForUnit(u){
  return findRangedEnemyTargetForUnit(u,arena_targetingView());
}
// Formation anchor: the FORWARD-MOST living friendly tank (lowest y, closest
// to enemy castle). Picking by Euclidean distance breaks with two tanks Ã¢â‚¬â€
// each tank picks the other and they back into each other. The unit always
// hides behind whichever tank is leading the push instead.
function findTankAnchor(u){
  let best=null,bestY=Infinity;
  for(const a of units){
    if(a===u||!a.isPlayer||a.hp<=0||a.isMinion||a.isHero)continue;
    if(a.arch!=='tank')continue;
    if(a.y<bestY){bestY=a.y;best=a}
  }
  return best;
}
function findAllyForHealer(u){
  let best=null,bestPct=Infinity;
  for(const a of units){
    if(a===u||a.hp<=0||a.isMinion)continue;
    const pct=a.hp/a.maxHp;
    if(pct<1&&pct<bestPct){bestPct=pct;best=a}
  }
  if(!best&&vodkaUnit&&vodkaUnit.hp<vodkaUnit.maxHp&&vodkaUnit!==u){
    if(vodkaUnit.hp/vodkaUnit.maxHp<bestPct)return vodkaUnit;
  }
  return best;
}

// =====================
// DAMAGE / DEATH
// =====================
function arena_playerCombatColor(attacker,dmgType,attackTypeOverride,opts){
  return playerCombatColor(attacker,dmgType,attackTypeOverride,opts);
}
function arena_spawnPlayerAbilityCastVfx(u,label){
  spawnPlayerAbilityCastVfx({unit:u,label,frame,emitParticle:addP,groundEffects:groundFx});
}
function arena_spawnPlayerProjectileCastVfx(from,to,opts){
  spawnPlayerProjectileCastVfx({from,to,opts,frame,emitParticle:addP,beamEffects:beamFx});
}
function arena_spawnPlayerImpactVfx(target,attacker,dmgType,attackTypeOverride,dmg,opts){
  spawnPlayerImpactVfx({target,attacker,dmgType,attackTypeOverride,damage:dmg,opts,frame,emitParticle:addP,groundEffects:groundFx,beamEffects:beamFx});
}
function arena_isZavsMeleeAlly(u){
  return isZavsMeleeAlly(u);
}
function arena_zavsBodyguardCovers(z,target,radius){
  return zavsBodyguardCovers(z,target,radius);
}
function arena_zavsAllyDmgMult(u){
  return zavsAllyDamageMultiplier(u,{units});
}
function arena_zavsAllyAtkSpdFactor(u){
  return zavsAllyAttackSpeedFactor(u,{units});
}
function arena_isBatataBacklineAlly(u){
  return isBatataBacklineAlly(u);
}
function arena_batataCovers(b,target,radius){
  return batataCovers(b,target,radius);
}
function arena_applyMuddied(e,from,dur,slowMult,dmgMult){
  if(!e||e.hp<=0||e.isBoss)return;
  e.muddiedTimer=Math.max(e.muddiedTimer||0,dur||Math.round(3*GAME_TICK_HZ));
  e.muddiedSlowMult=Math.min(e.muddiedSlowMult||1,slowMult||0.80);
  e.muddiedDamageMult=Math.min(e.muddiedDamageMult||1,dmgMult||0.92);
  e.muddiedFrom=from||null;
  e.slowTimer=Math.max(e.slowTimer||0,e.muddiedTimer);
  e.slowMult=Math.min(e.slowMult||1,e.muddiedSlowMult);
}
function arena_batataHealingReceivedMult(target){
  return batataHealingReceivedMultiplier(target,{units});
}
function arena_addZavsLineShield(target,amount,dur){
  addZavsLineShield(target,amount,{duration:dur,tickHz:GAME_TICK_HZ,emitParticle:addP});
}
function arena_addGoldShield(target,amount,dur,cap,noExpireHeal){
  return addGoldShield(target,amount,{duration:dur,cap,noExpireHeal,tickHz:GAME_TICK_HZ,emitParticle:addP});
}
function arena_addBatataShield(target,amount,dur){
  addBatataShield(target,amount,{duration:dur,tickHz:GAME_TICK_HZ,emitParticle:addP});
}
function arena_isTaoonPriorityEnemy(e){
  if(!e||e.hp<=0||e.isBoss)return false;
  return e.arch==='ranged'||e.arch==='caster'||e.arch==='support'||e.arch==='healer'||(e.range||0)>80||e.projType==='curse';
}
function arena_applyRuneWound(e,from,mult,dur){
  if(!e||e.hp<=0||e.isBoss)return;
  e.runeWoundTimer=Math.max(e.runeWoundTimer||0,dur||Math.round(3*GAME_TICK_HZ));
  e.runeWoundMult=Math.min(e.runeWoundMult||1,mult||0.92);
  e.runeWoundFrom=from||null;
}
function arena_addTaoonBloodShield(target,amount,dur,dr){
  addTaoonBloodShield(target,amount,{duration:dur,damageReduction:dr,tickHz:GAME_TICK_HZ,emitParticle:addP});
}
function arena_taoonBloodTithe(u,healAmount){
  if(!u||!u.bloodTithe||healAmount<=0)return;
  let best=null,bestPct=Infinity;
  for(const a of units){
    if(!a||a===u||a.hp<=0||!a.isPlayer||a.isGhost||a.isMinion)continue;
    if(dist(u,a)>u.bloodTithe.radius)continue;
    const p=a.hp/a.maxHp;
    if(p<bestPct){bestPct=p;best=a}
  }
  if(!best)return;
  const shield=Math.min(Math.round(healAmount*u.bloodTithe.shieldPct),Math.round(u.maxHp*u.bloodTithe.capPct));
  arena_addTaoonBloodShield(best,shield,Math.round(4*GAME_TICK_HZ),0);
  beamFx.push({x1:u.x,y1:u.y,x2:best.x,y2:best.y,color:'#cc2244aa',width:2,life:0.22,maxLife:0.22,straight:true});
  addDmg(best.x,best.y-best.size,'BLOOD TITHE','#ff6688',{sz:11,bold:true});
}
function arena_grantGapInvulnerability(u,label,color){
  if(!u||u.hp<=0)return;
  u._gapInvulnerableTimer=Math.max(u._gapInvulnerableTimer||0,Math.round(3*GAME_TICK_HZ));
  u._gapInvulnerableLabel=label||'INVULNERABLE';
  u._gapInvulnerableColor=color||'#ffffff';
  addP(u.x,u.y,u._gapInvulnerableColor,18,4);
  groundFx.push({x:u.x,y:u.y,r:0,maxR:u.size+24,life:0.45,color:u._gapInvulnerableColor});
  addDmg(u.x,u.y-u.size-8,u._gapInvulnerableLabel,u._gapInvulnerableColor,{sz:12,bold:true});
}
const combatDamageContextRuntime=createCombatDamageContextRuntime({
  riftBonusGold:()=>ARENA_RIFT_BONUS_GOLD,
  view:()=>({state,arena,units,enemies,projectiles,currentStage,frame,groundFx}),
  emitParticle:addP,
  addDamageText:addDmg,
  addHealEffect:addHealFx,
  randomRange:rnd,
  sound:SFX,
  shake:value=>{screenShake=Math.max(screenShake,value);},
  showFlash,
  arena_spawnPlayerImpactVfx,
  arena_statsRecordDamage,
  arena_applyHealingReceived,
  arena_addGoldShield,
  arena_spawnGhost,
  arena_applyFelfelDeadlyPoison,
  arena_spawnGhoul,
  setVodkaDead,
  setVodkaRespawn,
  setVodkaUnit,
  addGold,
  addStageGold,
  dealDamageRuntime,
  handleCombatDeath
});
function combatDamageContext(){return combatDamageContextRuntime.combatDamageContext()}
function dealDamage(target,raw,attacker,dmgType,attackTypeOverride,opts){return combatDamageContextRuntime.dealDamage(target,raw,attacker,dmgType,attackTypeOverride,opts)}
function onDeath(t,killer){return combatDamageContextRuntime.onDeath(t,killer)}

// (Kharroob raise undead functions removed Ã¢â‚¬â€ unit deleted)

// =====================
// PROJECTILES & BOMBS
// =====================
let _lastAtkSfx=0;
function arena_basicSecondHitFor(u){
  if(!u||!u.isPlayer||u.isMinion||u.isGhost)return null;
  if(u.unitIdx===7)return {range:150,mult:0.50,dmgType:'magic',attackType:'magic',color:'#a855f7',label:'SPLIT CURSE',applyAgony:true};
  if(u.unitIdx===8)return {range:160,mult:0.48,dmgType:'normal',attackType:'pierce',color:'#44ddff',label:'TWIN SHOT'};
  return null;
}
function arena_findBasicSecondTarget(attacker,primary,range){
  if(!attacker||!primary)return null;
  let best=null,bestScore=Infinity;
  const atkRange=(attacker.range||180)+30;
  for(const e of enemies){
    if(!e||e===primary||e.hp<=0)continue;
    const nearPrimary=dist(primary,e);
    const nearAttacker=dist(attacker,e);
    if(nearPrimary>range&&nearAttacker>atkRange)continue;
    const score=nearPrimary+nearAttacker*0.12;
    if(score<bestScore){bestScore=score;best=e}
  }
  return best;
}
function arena_applyJafaarAgony(u,t,quiet,allowPayoff){
  if(!u||!u.agony||!t||t.hp<=0)return;
  if(!t._agonyStacks)t._agonyStacks=0;
  if(t._agonyStacks<u.agony.maxStacks)t._agonyStacks++;
  t._agonyTimer=u.agony.dur;
  t._agonyFrom=u;
  t._agonyTickDmg=Math.round(u.dmg*u.agony.tickMult);
  if(!quiet&&t._agonyStacks===1){addDmg(t.x,t.y-t.size,'AGONY!','#9b59b6');addP(t.x,t.y,'#9b59b6',8,3)}
  else addP(t.x,t.y,quiet?'#a855f7':'#7b3a9a',quiet?5:4,quiet?2:2);
  if(allowPayoff!==false&&u.unitIdx===7&&!u.isMinion&&(u.level||1)>=3){
    t._jafaarCurseApps=(t._jafaarCurseApps||0)+1;
    if(t._agonyStacks>=3)arena_triggerJafaarCurseBloom(u,t);
    if(t._jafaarCurseApps>=5&&arena_triggerJafaarFelMeteor(u,t)){
      t._jafaarCurseApps=0;
    }
  }
}
function arena_activePayoffZoneCount(u){
  let count=0;
  for(const g of groundFx){
    if(g&&g.curseBloom&&g.cbFrom===u&&g.life>0)count++;
  }
  return count;
}
function arena_triggerJafaarCurseBloom(u,t){
  if(!u||!t||t.hp<=0)return false;
  const sourceCd=Math.round(2.0*GAME_TICK_HZ);
  if(u._jafaarBloomFrame!=null&&frame-u._jafaarBloomFrame<sourceCd)return false;
  if(arena_activePayoffZoneCount(u)>=2)return false;
  const cd=Math.round(6*GAME_TICK_HZ);
  if(t._jafaarBloomFrame!=null&&frame-t._jafaarBloomFrame<cd)return false;
  u._jafaarBloomFrame=frame;
  t._jafaarBloomFrame=frame;
  const r=48,dur=Math.round(2.0*GAME_TICK_HZ);
  groundFx.push({x:t.x,y:t.y,r:0,maxR:r,life:1,curseBloom:true,cbTimer:dur,cbMax:dur,cbTick:0,cbTickEvery:Math.round(0.5*GAME_TICK_HZ),cbDmg:Math.max(1,Math.round((u.dmg||20)*0.09)),cbFrom:u,color:'#9b59b6',altColor:'#cc88ff'});
  addP(t.x,t.y,'#9b59b6',14,4);addP(t.x,t.y,'#cc88ff',6,3);
  addDmg(t.x,t.y-(t.size||18)-8,'CURSE BLOOM!','#cc88ff',{sz:11,bold:true});
  return true;
}
function arena_triggerJafaarFelMeteor(u,t){
  if(!u||!t||t.hp<=0)return false;
  const sourceCd=Math.round(5.0*GAME_TICK_HZ);
  if(u._jafaarMeteorFrame!=null&&frame-u._jafaarMeteorFrame<sourceCd)return false;
  const cd=Math.round(8*GAME_TICK_HZ);
  if(t._jafaarMeteorFrame!=null&&frame-t._jafaarMeteorFrame<cd)return false;
  u._jafaarMeteorFrame=frame;
  t._jafaarMeteorFrame=frame;
  const r=66;
  bombs.push({x:t.x,y:ARENA_TOP-80,fromX:t.x,fromY:ARENA_TOP-80,tx:t.x,ty:t.y,t:0,dur:64,
    dmg:Math.max(1,Math.round((u.dmg||20)*1.25)),radius:r,attacker:u,isPlayer:true,color:'#9b59b6',altColor:'#cc88ff',
    meteor:true,playerMeteor:true,felMeteor:true,dmgType:'magic',felPoolRadius:52,felPoolDmg:Math.max(1,Math.round((u.dmg||20)*0.06))});
  addP(t.x,t.y,'#9b59b6',14,5);addP(t.x,t.y,'#cc88ff',8,3);
  groundFx.push({x:t.x,y:t.y,r:0,maxR:r,life:0.55,color:'#9b59b6'});
  addDmg(t.x,t.y-(t.size||18)-14,'FEL METEOR!','#cc88ff',{sz:12,bold:true});
  return true;
}
function arena_felfelPoisonPayoffActive(u){
  return !!(u&&u.unitIdx===4&&!u.isMinion&&!u.isMirror&&(u.level||1)>=3&&(u.poisonPayoff||u.branch==='b'));
}
function arena_applyFelfelDeadlyPoison(u,t,stacks,quiet,allowPayoff){
  if(!u||!t||t.hp<=0)return;
  const add=Math.max(1,Math.round(stacks||1));
  const prev=t.deadlyPoisonStacks||0;
  t.deadlyPoisonStacks=Math.min(5,prev+add);
  t.deadlyPoisonTimer=4*GAME_TICK_HZ;
  t.deadlyPoisonSource=u;
  t.deadlyPoisonDmg=Math.max(t.deadlyPoisonDmg||0,Math.round((u.dmg||20)*0.15));
  if(!quiet&&prev<=0){addDmg(t.x,t.y-(t.size||18)-4,'POISON!','#55aa33');groundFx.push({x:t.x,y:t.y,r:0,maxR:16,life:0.2,color:'#55aa33'})}
  addP(t.x,t.y,'#55aa33',quiet?3:5,quiet?2:3);
  if(t.deadlyPoisonStacks>=3){const _dpa=frame*0.12;addP(t.x+Math.cos(_dpa)*8,t.y+Math.sin(_dpa)*6,'#33cc22',2,2)}
  if(allowPayoff!==false&&arena_felfelPoisonPayoffActive(u)){
    t._felfelPoisonApps=(t._felfelPoisonApps||0)+add;
    if(t.deadlyPoisonStacks>=3)arena_triggerFelfelToxicBloom(u,t);
    if((t.deadlyPoisonStacks>=5||t._felfelPoisonApps>=5)&&arena_triggerFelfelVenomMeteor(u,t)){
      t._felfelPoisonApps=0;
      t.deadlyPoisonStacks=Math.min(2,t.deadlyPoisonStacks);
      t.deadlyPoisonTimer=4*GAME_TICK_HZ;
    }
  }
}
function arena_triggerFelfelToxicBloom(u,t){
  if(!u||!t||t.hp<=0)return false;
  const sourceCd=Math.round(1.8*GAME_TICK_HZ);
  if(u._felfelBloomFrame!=null&&frame-u._felfelBloomFrame<sourceCd)return false;
  if(arena_activePayoffZoneCount(u)>=2)return false;
  const cd=Math.round(6*GAME_TICK_HZ);
  if(t._felfelBloomFrame!=null&&frame-t._felfelBloomFrame<cd)return false;
  u._felfelBloomFrame=frame;
  t._felfelBloomFrame=frame;
  const r=48,dur=Math.round(2.0*GAME_TICK_HZ);
  groundFx.push({x:t.x,y:t.y,r:0,maxR:r,life:1,curseBloom:true,poisonBloom:true,cbTimer:dur,cbMax:dur,cbTick:0,cbTickEvery:Math.round(0.5*GAME_TICK_HZ),cbDmg:Math.max(1,Math.round((u.dmg||20)*0.08)),cbFrom:u,color:'#55aa33',altColor:'#bbff55'});
  addP(t.x,t.y,'#55aa33',14,4);addP(t.x,t.y,'#bbff55',6,3);
  addDmg(t.x,t.y-(t.size||18)-8,'TOXIC BLOOM!','#55ff77',{sz:11,bold:true});
  return true;
}
function arena_triggerFelfelVenomMeteor(u,t){
  if(!u||!t||t.hp<=0)return false;
  const sourceCd=Math.round(5.5*GAME_TICK_HZ);
  if(u._felfelMeteorFrame!=null&&frame-u._felfelMeteorFrame<sourceCd)return false;
  const cd=Math.round(8*GAME_TICK_HZ);
  if(t._felfelMeteorFrame!=null&&frame-t._felfelMeteorFrame<cd)return false;
  u._felfelMeteorFrame=frame;
  t._felfelMeteorFrame=frame;
  const r=64;
  bombs.push({x:t.x,y:ARENA_TOP-80,fromX:t.x,fromY:ARENA_TOP-80,tx:t.x,ty:t.y,t:0,dur:60,
    dmg:Math.max(1,Math.round((u.dmg||20)*1.10)),radius:r,attacker:u,isPlayer:true,color:'#55ff33',altColor:'#bbff55',
    meteor:true,playerMeteor:true,venomMeteor:true,dmgType:'magic',venomPoolRadius:50,venomPoolDmg:Math.max(1,Math.round((u.dmg||20)*0.05))});
  addP(t.x,t.y,'#55ff33',14,5);addP(t.x,t.y,'#173a0a',6,3);
  groundFx.push({x:t.x,y:t.y,r:0,maxR:r,life:0.55,color:'#55ff33'});
  addDmg(t.x,t.y-(t.size||18)-14,'VENOM METEOR!','#55ff33',{sz:12,bold:true});
  return true;
}
function arena_moonkinDisplaceEnemy(center,e,amount,mode){
  if(!center||!e||e.hp<=0)return;
  const dx=e.x-center.x,dy=e.y-center.y,d=Math.hypot(dx,dy)||1;
  if(e.isBoss||e.isBarrier||e.lockedAtTop){
    e.slowTimer=Math.max(e.slowTimer||0,Math.round(0.45*GAME_TICK_HZ));
    e.slowMult=Math.min(e.slowMult||1,mode==='pull'?0.86:0.90);
    return;
  }
  const dir=mode==='pull'?-1:1;
  e.x+=dx/d*amount*dir;
  e.y+=dy/d*amount*dir;
  clampToArena(e);
  e.slowTimer=Math.max(e.slowTimer||0,Math.round(0.35*GAME_TICK_HZ));
  e.slowMult=Math.min(e.slowMult||1,mode==='pull'?0.58:0.66);
}
function arena_moonkinControlBurst(cx,cy,r,u,dmg,mode,amount,label,color){
  let hit=0;
  const center={x:cx,y:cy};
  for(const e of enemies){
    if(e.hp<=0||dist(center,e)>r)continue;
    if(dmg>0)dealDamage(e,dmg,u,'magic');
    arena_moonkinDisplaceEnemy(center,e,amount,mode);
    addP(e.x,e.y,color||'#aaccff',6,3);
    hit++;
  }
  groundFx.push({x:cx,y:cy,r:0,maxR:r,life:0.48,color:color||'#aaccff'});
  if(label&&hit)addDmg(cx,cy-20,label,color||'#aaccff',{sz:12,bold:true});
  return hit;
}
function arena_jafaarCurseWeight(e){
  if(!e||e.hp<=0)return 0;
  let w=0;
  if(e._agonyStacks>0&&e._agonyTimer>0)w+=e._agonyStacks*3;
  if(e.poisonTimer>0)w+=1;
  if(e.bleedTimer>0||e.garroteBleedTimer>0)w+=1;
  if(e.plagueTimer>0)w+=1;
  if(e._igniteStacks&&e._igniteStacks.length>0)w+=1;
  if(e.toxicBrewStacks>0)w+=e.toxicBrewStacks;
  if(e.deadlyPoisonStacks>0)w+=e.deadlyPoisonStacks;
  return w;
}
function arena_findJafaarDrainTarget(u){
  const maxR=(u.range||180)+70;
  let best=null,bestScore=-Infinity;
  for(const e of enemies){
    if(e.hp<=0||dist(u,e)>maxR)continue;
    const score=arena_jafaarCurseWeight(e)*80+(1-e.hp/Math.max(1,e.maxHp))*35-dist(u,e)*0.03;
    if(score>bestScore){bestScore=score;best=e}
  }
  return best;
}
function arena_applyBasicSecondHit(attacker,primary,dmg,config,fallbackDmgType,fallbackAttackType){
  if(!config||!attacker||attacker.hp<=0||!primary)return;
  const second=(config.target&&config.target.hp>0&&config.target!==primary)?config.target:arena_findBasicSecondTarget(attacker,primary,config.range||150);
  if(!second)return;
  if(config.applyAgony)arena_applyJafaarAgony(attacker,second,true,false);
  const hitDmg=Math.max(1,Math.round(dmg*(config.mult||0.45)));
  dealDamage(second,hitDmg,attacker,config.dmgType||fallbackDmgType||'normal',config.attackType||fallbackAttackType);
  const col=config.color||'#88ddff';
  beamFx.push({x1:primary.x,y1:primary.y,x2:second.x,y2:second.y,life:0.18,maxLife:0.18,color:col,width:2,straight:true});
  addP(second.x,second.y,col,8,3);
  if(frame%18<3)addDmg(second.x,second.y-second.size,config.label||'CHAIN! ',col);
}
function fireProjectile(from,to,dmg,opts){
  _lastAtkSfx=fireArenaProjectile(from,to,dmg,opts||{},{
    frame,
    lastAttackSfxFrame:_lastAtkSfx,
    sound:SFX,
    spawnPlayerProjectileCastVfx:arena_spawnPlayerProjectileCastVfx,
    projectiles,
    beamFx,
    emitParticle:addP
  });
}
function lobBomb(from,tx,ty,dmg,radius,opts){
  lobArenaBomb(bombs,from,tx,ty,dmg,radius,opts||{});
}

// =====================
// ABILITY EXECUTORS Ã¢â‚¬â€ L3 + L5 per unit + Vodka
// =====================
function tryAbility(u,abilName,cdKey,cdFrames){
  if(!u.hasL3&&(abilName===u.a3))return false;
  if(u.abilCD[cdKey]>0)return false;
  u.abilCD[cdKey]=cdFrames;
  arena_spawnPlayerAbilityCastVfx(u,abilName);
  return true;
}
function arena_jazarGuard(u,dur,dr){
  if(!u||u.unitIdx!==5||u.hp<=0)return;
  const cfg=u.bladeGuard||{};
  const guardDur=dur||cfg.dur||Math.round(3*GAME_TICK_HZ);
  const guardDr=dr||cfg.dr||0.30;
  u.bladeGuardTimer=Math.max(u.bladeGuardTimer||0,guardDur);
  u.bladeGuardDR=Math.max(u.bladeGuardDR||0,guardDr);
}
function arena_jazarSignatureSurge(u,durSec,opts){
  if(!u||u.unitIdx!==5||u.hp<=0)return;
  const o=opts||{};
  const dur=Math.round((durSec||5)*GAME_TICK_HZ);
  u._jazarSigHasteTimer=Math.max(u._jazarSigHasteTimer||0,dur);
  u._jazarSigHasteMult=o.hasteMult||0.70;
  if(o.aoe){
    const aoeDur=Math.round((o.aoeDur||durSec||4)*GAME_TICK_HZ);
    u._jazarSigAoeTimer=Math.max(u._jazarSigAoeTimer||0,aoeDur);
    u._jazarSigAoeRadius=o.aoeRadius||90;
    u._jazarSigAoeMult=o.aoeMult||0.60;
    u._jazarSigAoeColor=o.color||'#ffcc00';
  }
  const col=o.color||'#ffcc00';
  addP(u.x,u.y,col,24,5);addP(u.x,u.y,'#ffffff',8,3);
  groundFx.push({x:u.x,y:u.y,r:0,maxR:(o.aoe?u._jazarSigAoeRadius:55),life:0.45,color:col});
  addDmg(u.x,u.y-u.size-10,o.label||'BLADE HASTE!','#ffdd66',{sz:13,bold:true});
}
function arena_findBestEnemyClusterPoint(origin,maxRange,clusterRadius){
  let best=null,bestScore=-Infinity;
  const maxR=maxRange==null?99999:maxRange;
  const cr=clusterRadius||90;
  for(const e of enemies){
    if(e.hp<=0)continue;
    const od=origin?dist(origin,e):0;
    if(od>maxR)continue;
    let count=0,elite=0,hpScore=0;
    for(const f of enemies){
      if(f.hp<=0)continue;
      if(dist(e,f)>cr)continue;
      count++;
      if(f.isBoss||f.elite)elite++;
      hpScore+=Math.min(f.hp||0,600);
    }
    const score=count*100+elite*80+hpScore*0.03-od*0.02;
    if(score>bestScore){bestScore=score;best=e}
  }
  return best?{x:best.x,y:best.y,target:best,score:bestScore}:null;
}
const ABILITIES={
  // ----- TANKS -----
  cleaveSlam(u){ // Malfof L3 (legacy Ã¢â‚¬â€ kept for compat)
    if(!tryAbility(u,'cleaveSlam','cleaveSlam',960))return;
    addP(u.x,u.y,'#88ff88',16,4);
    for(const e of enemies){if(e.hp>0&&dist(u,e)<70){const dx=e.x-u.x;if(dx*u.facing>=-15)dealDamage(e,u.dmg*1.8,u,'normal')}}
    showFlash('CLEAVE!','#88ff88',30);
  },
  shieldSlam(u){ // Malfof L3 Ã¢â‚¬â€ single-target heavy hit + stun + armor break
    if(!tryAbility(u,'shieldSlam','shieldSlam',720))return;
    const t=u.target;
    if(!t||t.hp<=0)return;
    dealDamage(t,Math.round(u.dmg*2.5),u,'normal');
    if(!t.isBoss)t.stunned=Math.max(t.stunned||0,120);
    t.armorBreak=(t.armorBreak||0)+2;t.armorBreakTimer=600;
    addP(t.x,t.y,'#8899cc',12,4);addP(t.x,t.y,'#ffffff',6,3);
    addP(u.x,u.y,'#aabbdd',8,3);
    beamFx.push({x1:u.x,y1:u.y,x2:t.x,y2:t.y,color:'#aabbdd',width:5,life:0.2,maxLife:0.2,straight:true});
    groundFx.push({x:t.x,y:t.y,r:0,maxR:55,life:0.5,color:'#6677aa'});
    groundFx.push({x:t.x,y:t.y,r:0,maxR:30,life:0.3,color:'#ffffff44'});
    addDmg(t.x,t.y-t.size,'SHIELD SLAM!','#aabbee',{sz:15,bold:true});
    screenShake=Math.max(screenShake,6);
    SFX.shieldBash();
  },
  avatar(u){ // Malfof L5 Ã¢â‚¬â€ grow big, +50% HP/DMG, CC immune for 8s
    if(!tryAbility(u,'avatar','avatar',4200))return;
    u.avatarTimer=10*GAME_TICK_HZ;
    u.avatarOrigSize=u.size;
    u.avatarOrigDmg=u.dmg;
    u.avatarOrigMaxHp=u.maxHp;
    u.size=Math.round(u.size*1.2);
    u.dmg=Math.round(u.dmg*1.5);
    u.maxHp=Math.round(u.maxHp*1.5);
    u.hp=Math.min(u.hp+Math.round(u.avatarOrigMaxHp*0.5),u.maxHp);
    u.ccImmune=true;
    for(let i=0;i<20;i++){const a=Math.PI*2*i/20;addP(u.x+Math.cos(a)*30,u.y+Math.sin(a)*30,'#44ff44',2,4)}
    addP(u.x,u.y,'#ffffff',12,3);addP(u.x,u.y,'#88ff88',8,5);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:90,life:1.0,color:'#33cc33'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:50,life:0.6,color:'#ffffff44'});
    addDmg(u.x,u.y-u.size,'AVATAR!','#44ff44',{sz:18,bold:true});
    showFlash('AVATAR','#44ff44',60);
    screenShake=Math.max(screenShake,12);
    SFX.buff();SFX.taunt();
  },
  lastStand(u){}, // passive triggered in dealDamage
  deathGripCleave(u){}, // legacy stub
  antiMagicShell(u){}, // legacy stub
  heartStrike(u){ // Taoon L3 Ã¢â‚¬â€ cleave 3 enemies + heal 15% of damage dealt
    if(!tryAbility(u,'heartStrike','heartStrike',720))return;
    const targets=[];
    for(const e of enemies){if(e.hp>0&&dist(u,e)<80)targets.push(e)}
    targets.sort((a,b)=>dist(u,a)-dist(u,b));
    let totalDmg=0;
    for(let i=0;i<Math.min(3,targets.length);i++){
      const d=Math.round(u.dmg*2.0);
      dealDamage(targets[i],d,u,'normal');totalDmg+=d;
      addP(targets[i].x,targets[i].y,'#cc2244',6,3);
      beamFx.push({x1:u.x,y1:u.y,x2:targets[i].x,y2:targets[i].y,color:'#cc2244',width:3,life:0.2,maxLife:0.2,straight:true});
    }
    if(totalDmg>0){
      const heal=Math.round(totalDmg*0.15);
      u.hp=Math.min(u.maxHp,u.hp+heal);addHealFx(u.x,u.y,heal);
      addP(u.x,u.y,'#ff3355',10,4);addP(u.x,u.y,'#881122',6,3);
      groundFx.push({x:u.x,y:u.y,r:0,maxR:80,life:0.35,color:'#881122'});
      addDmg(u.x,u.y-u.size,'HEART STRIKE!','#ff3355',{sz:14,bold:true});
      SFX.heavySlash();
    }
  },
  frostwyrmsFury(u){ // Taoon L5 Ã¢â‚¬â€ frost dragon breath line, freeze 3s
    if(!tryAbility(u,'frostwyrmsFury','frostwyrmsFury',5400))return;
    const dir=u.facing||1;
    const lineLen=280,lineW=60;
    let hit=0;
    for(const e of enemies){
      if(e.hp<=0)continue;
      const dx=e.x-u.x,dy=e.y-u.y;
      if(dx*dir<0)continue;
      if(Math.abs(dx)>lineLen)continue;
      if(Math.abs(dy)>lineW)continue;
      dealDamage(e,Math.round(u.dmg*3.5),u,'magic');
      e.stunned=Math.max(e.stunned||0,e.isBoss?90:360);
      e.slowTimer=Math.max(e.slowTimer||0,480);e.slowMult=0.3;
      addP(e.x,e.y,'#88ddff',14,4);hit++;
    }
    if(hit>0||enemies.length>0){
      for(let i=0;i<18;i++){
        const px=u.x+dir*(20+Math.random()*lineLen);
        const py=u.y+(Math.random()-0.5)*lineW;
        const iceCol=['#aaeeff','#ccf0ff','#88ddff','#ddeeff','#ffffff'][Math.floor(Math.random()*5)];
        addP(px,py,iceCol,3,2+Math.random()*4);
      }
      for(let i=0;i<6;i++){
        const sx=u.x+dir*(40+Math.random()*200);
        const sy=u.y+(Math.random()-0.5)*lineW*0.6;
        groundFx.push({x:sx,y:sy,r:0,maxR:12+Math.random()*18,life:0.6+Math.random()*0.4,color:'#bbddff',iceShard:true});
      }
      beamFx.push({x1:u.x,y1:u.y,x2:u.x+dir*lineLen,y2:u.y,color:'#88ddff',width:8,life:0.6,maxLife:0.6,straight:true});
      beamFx.push({x1:u.x,y1:u.y-15,x2:u.x+dir*lineLen*0.8,y2:u.y-20,color:'#aaeeff',width:3,life:0.5,maxLife:0.5,straight:false});
      beamFx.push({x1:u.x,y1:u.y+15,x2:u.x+dir*lineLen*0.8,y2:u.y+20,color:'#aaeeff',width:3,life:0.5,maxLife:0.5,straight:false});
      groundFx.push({x:u.x+dir*140,y:u.y,r:0,maxR:lineLen/2,life:0.8,color:'#66bbdd'});
      addDmg(u.x+dir*60,u.y-u.size-4,"FROSTWYRM'S FURY!",'#88ddff',{sz:16,bold:true});
      showFlash("FROSTWYRM'S FURY!",'#88ddff',60);
      screenShake=Math.max(screenShake,10);
      SFX.frostBolt();
    }
  },
  incapacitatingRoar(u){ // Batata L3
    if(!tryAbility(u,'incapacitatingRoar','roar',16*GAME_TICK_HZ))return;
    let _hit=0;
    for(const e of enemies){
      if(e.hp>0&&dist(u,e)<100){
        e.stunned=Math.max(e.stunned||0,2*GAME_TICK_HZ);
        e.roarWeaken=true;e.roarWeakenTimer=4*GAME_TICK_HZ;
        addP(e.x,e.y,'#ffaa33',10,4);_hit++;
      }
    }
    if(_hit){
      for(let i=0;i<3;i++)groundFx.push({x:u.x,y:u.y,r:0,maxR:60+i*30,life:0.5+i*0.15,roarWave:true,color:'#ffaa33'});
      screenShake=Math.max(screenShake,10);
      SFX.roar();
    }
    if(u.earthwardenShield!==undefined){
      const _shieldAmt=Math.round(_hit*u.dmg*0.20);
      u.earthwardenShield=(u.earthwardenShield||0)+_shieldAmt;
      u.earthwardenTimer=5*GAME_TICK_HZ;
      if(_shieldAmt>0){addDmg(u.x,u.y-u.size*0.5,'+'+_shieldAmt+' SHIELD','#88ff44');addP(u.x,u.y,'#88ff44',10,3)}
    }
    addP(u.x,u.y,'#ffaa33',32,6);addP(u.x,u.y,'#ff6600',16,4);
    addDmg(u.x,u.y-u.size*1.5,'ROAR!!!','#ffaa33');
    showFlash('ROAR!','#ffaa33',40);
  },
  berserkDruid(u){ // Batata L5
    if(!tryAbility(u,'berserkDruid','berserk',35*GAME_TICK_HZ))return;
    u._berserkOrigAtkSpd=u._berserkOrigAtkSpd||u.atkSpd;
    u._berserkOrigDmg=u._berserkOrigDmg||u.dmg;
    u.atkSpd=Math.max(8,Math.round(u.atkSpd*0.5));
    u.dmg=Math.round(u.dmg*1.3);
    u.berserkActive=true;u.berserkTimer=8*GAME_TICK_HZ;
    u.berserkCleave360=true;
    addP(u.x,u.y,'#8fbc3a',32,6);
    showFlash('BERSERK!','#8fbc3a',40);
  },
  natureStomp(u){ // Batata Halwa A3 Ã¢â‚¬â€ ground slam roots + damages nearby enemies
    if(!tryAbility(u,'natureStomp','natureStomp',14*GAME_TICK_HZ))return;
    let _hit=0;
    for(const e of enemies){
      if(e.hp>0&&!e.isBoss&&dist(u,e)<110){
        dealDamage(e,Math.round(u.dmg*1.2),u,'normal');
        e.rooted=true;e.rootTimer=2.5*GAME_TICK_HZ;e.rootX=e.x;e.rootY=e.y;
        groundFx.push({x:e.x,y:e.y,r:0,maxR:e.size*1.5,life:0.8,rootVine:true,rootTarget:e,rootDur:2.5*GAME_TICK_HZ});
        addP(e.x,e.y,'#33aa33',12,4);_hit++;
      }
    }
    if(_hit){
      for(let i=0;i<3;i++)groundFx.push({x:u.x,y:u.y,r:0,maxR:70+i*25,life:0.5+i*0.12,roarWave:true,color:'#33aa33'});
      screenShake=Math.max(screenShake,8);
    }
    addP(u.x,u.y,'#33aa33',28,5);addDmg(u.x,u.y-u.size,'NATURE STOMP!','#33cc33');
    showFlash("NATURE'S STOMP",'#33cc33',35);
  },
  incarnationTree(u){ // Batata Halwa A5 Ã¢â‚¬â€ become Tree of Life: AoE heal aura + thorns
    if(!tryAbility(u,'incarnationTree','incarnTree',40*GAME_TICK_HZ))return;
    u.incarnTreeActive=true;u.incarnTreeTimer=10*GAME_TICK_HZ;
    u._preTreeMaxHp=u.maxHp;
    u.maxHp=Math.round(u.maxHp*1.4);u.hp=Math.min(u.maxHp,u.hp+Math.round(u._preTreeMaxHp*0.4));
    u._preTreeArmor=u.armor;u.armor=Math.round(u.armor*1.5);
    addP(u.x,u.y,'#33cc33',48,8);groundFx.push({x:u.x,y:u.y,r:0,maxR:160,life:1.0,color:'#33aa33'});
    addDmg(u.x,u.y-u.size-4,'TREE OF LIFE!','#33cc33');showFlash('INCARNATION: TREE OF LIFE!','#33cc33',75);screenShake=Math.max(screenShake,12);
  },
  // ----- ZAYT (Retribution Paladin) -----
  divineJudgment(u){ // Zayt base L3 Ã¢â‚¬â€ holy burst on target + nearby enemies take splash
    if(!tryAbility(u,'divineJudgment','divineJudgment',8*GAME_TICK_HZ))return;
    const t=u.target;
    if(!t||t.hp<=0)return;
    const _mainDmg=Math.round(u.dmg*3.0);
    dealDamage(t,_mainDmg,u,'magic');
    addP(t.x,t.y,'#ffd700',20,5);addP(t.x,t.y,'#ffffff',10,3);
    groundFx.push({x:t.x,y:t.y,r:0,maxR:80,life:0.45,color:'#ffd700'});
    let _splashHit=0;
    for(const e of enemies){if(e!==t&&e.hp>0&&dist(t,e)<70){
      dealDamage(e,Math.round(_mainDmg*0.4),u,'magic');addP(e.x,e.y,'#ffe066',6,3);_splashHit++;
    }}
    addDmg(t.x,t.y-t.size,'JUDGMENT!','#ffd700');
    showFlash('DIVINE JUDGMENT','#ffd700',35);screenShake=Math.max(screenShake,6);
  },
  bladeOfWrath(u){ // Zayt Prot L3 Ã¢â‚¬â€ leap + 2.5Ãƒâ€” holy + 2s stun + 4s dmg buff
    if(!tryAbility(u,'bladeOfWrath','bladeOfWrath',12*GAME_TICK_HZ))return;
    let target=null,bestD=0;
    for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d<100&&d>bestD){bestD=d;target=e}}}
    if(!target){for(const e of enemies){if(e.hp>0&&dist(u,e)<100){target=e;break}}}
    if(!target)return;
    const _fromX=u.x,_fromY=u.y;
    u.x=target.x-(u.facing||1)*30;u.y=target.y;
    arena_clampToLeash(u);
    const _dmg=Math.round(u.dmg*2.5);
    dealDamage(target,_dmg,u,'magic');
    if(!target.isBoss)target.stunned=Math.max(target.stunned||0,2*GAME_TICK_HZ);
    u.bladeOfWrathBuff=4*GAME_TICK_HZ;
    u._bowOrigDmg=u._bowOrigDmg||u.dmg;
    u.dmg=Math.round(u.dmg*1.20);
    for(let i=0;i<8;i++){const f=i/8;addP(_fromX+(u.x-_fromX)*f,_fromY+(u.y-_fromY)*f,'#ffd700',2,4)}
    addP(_fromX,_fromY,'#ffe066',12,3);
    addP(target.x,target.y,'#ffd700',24,5);addP(u.x,u.y,'#ffe066',16,4);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:70,life:0.5,color:'#ffd700'});
    groundFx.push({x:target.x,y:target.y,r:0,maxR:50,life:0.3,color:'#ffe066'});
    addDmg(target.x,target.y-target.size,'BLADE OF WRATH!','#ffd700');
    showFlash('BLADE OF WRATH','#ffd700',40);
    screenShake=Math.max(screenShake,8);
  },
  wakeOfAshes(u){ // Zayt L5 Ã¢â‚¬â€ frontal cone 200px: 3Ãƒâ€” holy + 3s stun
    if(!tryAbility(u,'wakeOfAshes','wakeOfAshes',22*GAME_TICK_HZ))return;
    const dir=u.facing||1;
    const coneLen=200,coneHalf=70;
    let _hit=0;
    for(const e of enemies){
      if(e.hp<=0)continue;
      const dx=e.x-u.x,dy=e.y-u.y;
      if(dx*dir<0)continue;
      if(Math.abs(dx)>coneLen)continue;
      if(Math.abs(dy)>coneHalf)continue;
      dealDamage(e,Math.round(u.dmg*3.0),u,'magic');
      e.stunned=Math.max(e.stunned||0,e.isBoss?Math.round(1.5*GAME_TICK_HZ):3*GAME_TICK_HZ);
      addP(e.x,e.y,'#ffd700',14,4);_hit++;
    }
    if(_hit>0||enemies.length>0){
      for(let i=0;i<10;i++){
        const px=u.x+dir*(20+Math.random()*coneLen);
        const py=u.y+(Math.random()-0.5)*coneHalf*2;
        addP(px,py,'#ffe066',4+Math.random()*6,3);
      }
      groundFx.push({x:u.x+dir*100,y:u.y,r:0,maxR:coneLen/2,life:0.7,color:'#ffd700'});
      addDmg(u.x+dir*60,u.y-u.size-4,'WAKE OF ASHES!','#ffd700');
      showFlash('WAKE OF ASHES','#ffd700',60);
      screenShake=Math.max(screenShake,10);
    }
  },
  finalReckoning(u){ // Zayt Retri a5 Ã¢â‚¬â€ mark all enemies in range, +20% dmg taken, detonates after 6s
    if(!tryAbility(u,'finalReckoning','finalReckoning',22*GAME_TICK_HZ))return;
    const _frRange=100;
    let _marked=0;
    const _burstDmg=Math.round(u.dmg*3.0);
    for(const e of enemies){
      if(e.hp<=0||dist(u,e)>_frRange)continue;
      dealDamage(e,_burstDmg,u,'magic');
      e._finalReckoning=6*GAME_TICK_HZ;
      addP(e.x,e.y,'#ffd700',16,4);addP(e.x,e.y-e.size,'#ffffff',8,3);
      _marked++;
    }
    if(_marked>0){
      groundFx.push({x:u.x,y:u.y,r:0,maxR:_frRange,life:0.6,color:'#ffd700'});
      groundFx.push({x:u.x,y:u.y,r:0,maxR:_frRange*0.6,life:0.35,color:'#ffffff'});
      for(let i=0;i<20;i++){const a=Math.PI*2*i/20;addP(u.x+Math.cos(a)*_frRange*0.8,u.y+Math.sin(a)*_frRange*0.8,'#ffe066',2,4)}
      addDmg(u.x,u.y-u.size-6,'FINAL RECKONING!','#ffd700');
      showFlash('FINAL RECKONING','#ffd700',50);
      screenShake=Math.max(screenShake,8);
    }
  },
  holyPrism(u){ // Zayt Mubarak (Holy) a3 Ã¢â‚¬â€ ranged holy damage + heal nearest ally
    if(!tryAbility(u,'holyPrism','holyPrism',10*GAME_TICK_HZ))return;
    let target=null,bestD=Infinity;
    for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d<220&&d<bestD){bestD=d;target=e}}}
    if(!target)return;
    const _dmg=Math.round(u.dmg*2.5);
    dealDamage(target,_dmg,u,'magic');
    addP(target.x,target.y,'#ffe066',16,5);
    groundFx.push({x:target.x,y:target.y,r:0,maxR:50,life:0.3,color:'#ffe066'});
    // Heal 5 lowest HP allies (splash heal)
    const _hpAllies=[];
    for(const a of units){
      if(a.hp<=0||!a.isPlayer||a.isGhost||a.hp>=a.maxHp)continue;
      _hpAllies.push(a);
    }
    _hpAllies.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp));
    const _hpCount=Math.min(5,_hpAllies.length);
    for(let pi=0;pi<_hpCount;pi++){
      const healTarget=_hpAllies[pi];
      let _heal=Math.round(healTarget.maxHp*0.10);
      if(u.infusionOfLightTimer>0)_heal=Math.round(_heal*1.30);
      _heal=Math.min(80,_heal);
      _heal=arena_applyHealingReceived(healTarget,_heal);
      healTarget.hp=Math.min(healTarget.maxHp,healTarget.hp+_heal);
      addHealFx(healTarget.x,healTarget.y,_heal,true);
      arena_beaconSplash(u,healTarget,_heal);
    }
    // Prismatic rainbow beam VFX
    const _prismColors=['#ff4466','#ffaa00','#ffee44','#44ff66','#44aaff','#aa66ff'];
    for(let _pi=0;_pi<_prismColors.length;_pi++){
      beamFx.push({x1:u.x,y1:u.y+_pi*2-5,x2:target.x,y2:target.y+_pi*2-5,life:25,maxLife:25,color:_prismColors[_pi],width:1.5,straight:true});
    }
    projectiles.push({x:u.x,y:u.y,target,tx:target.x,ty:target.y,speed:3,projType:'pomOrb',visualOnly:true,color:'#ffaaff',_arrN:12,_arrSz:3,isPlayer:true,dmg:0});
    for(let _pi=0;_pi<6;_pi++)addP(target.x+rnd(-10,10),target.y+rnd(-8,4),_prismColors[_pi],1,3);
    addDmg(target.x,target.y-target.size,'HOLY PRISM!','#ffaaff',{sz:13,bold:true,outline:'#440044'});
  },
  barrierOfFaith(u){ // Zayt Mubarak (Holy) a5 Ã¢â‚¬â€ absorb shield on 2 lowest HP allies
    if(!tryAbility(u,'barrierOfFaith','barrierOfFaith',25*GAME_TICK_HZ))return;
    const allies=[];
    for(const a of units){
      if(a.hp<=0||!a.isPlayer||a.isGhost)continue;
      allies.push(a);
    }
    if(allies.length===0)return;
    allies.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp));
    const count=Math.min(2,allies.length);
    for(let i=0;i<count;i++){
      const a=allies[i];
      const shield=Math.round(a.maxHp*0.30);
      a.shieldHp=(a.shieldHp||0)+shield;
      a.barrierOfFaithTimer=480;
      addP(a.x,a.y,'#66aaff',20,5);addP(a.x,a.y,'#ffffff',10,3);
      groundFx.push({x:a.x,y:a.y,r:0,maxR:40,life:0.5,color:'#4488cc'});
      projectiles.push({x:u.x,y:u.y,target:a,tx:a.x,ty:a.y,speed:2.5,projType:'pomOrb',visualOnly:true,color:'#66aaff',_arrN:8,_arrSz:3,isPlayer:true,dmg:0});
      beamFx.push({x1:u.x,y1:u.y,x2:a.x,y2:a.y,life:25,maxLife:25,color:'#66aaff',width:2,straight:true});
      addDmg(a.x,a.y-a.size,'BARRIER!','#66aaff',{sz:13,bold:true,outline:'#002244'});
    }
    showFlash('BARRIER OF FAITH','#ffd700',45);
    screenShake=Math.max(screenShake,4);
  },
  guardianOfAncientKings(u){ // Zayt Muqaddas (Prot) a5 Ã¢â‚¬â€ 10s defensive buff
    if(!tryAbility(u,'guardianOfAncientKings','guardianOfAncientKings',45*GAME_TICK_HZ))return;
    u.goakTimer=12*GAME_TICK_HZ;
    u._goakOrigArmor=u.armor;
    u.armor=Math.round(u.armor*1.50);
    u.goakDR=0.30;
    u.goakHealPerTick=Math.round(u.maxHp*0.015);
    addP(u.x,u.y,'#ffd700',28,6);addP(u.x,u.y,'#ffffff',14,4);
    for(let i=0;i<12;i++){const a=Math.PI*2*i/12;addP(u.x+Math.cos(a)*u.size*1.3,u.y+Math.sin(a)*u.size*1.3,'#ffd700',2,4)}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:70,life:0.5,color:'#ffd700',flatten:true});
    addDmg(u.x,u.y-u.size-6,'GUARDIAN!','#ffd700');
    showFlash('GUARDIAN OF ANCIENT KINGS','#ffd700',50);
    screenShake=Math.max(screenShake,5);
  },
  // ----- MELEE -----
  bloodthirst(u){ // legacy Zayt L3 (kept for compat)
    if(!tryAbility(u,'bloodthirst','bloodthirst',1080))return;
    u.btActive=true;u.btTimer=240;
    addP(u.x,u.y,'#ff4444',16,4);
    showFlash('BLOODTHIRST!','#ff4444',30);
  },
  whirlwind(u){ // legacy Zayt L5 (kept for compat)
    if(!tryAbility(u,'whirlwind','whirlwind',1500))return;
    u.wwActive=true;u.wwTimer=90;u.wwTick=0;
    addP(u.x,u.y,'#ffaa00',18,4);
    showFlash('WHIRLWIND!','#ffaa00',40);
  },
  shadowstep(u){ // Felfel L3
    if(!tryAbility(u,'shadowstep','shadowstep',840))return; // 7s CD
    let far=null,farD=0;
    for(const e of enemies){if(e.hp>0&&e.range>50){const d=dist(u,e);if(d>farD&&d<300){farD=d;far=e}}}
    if(!far){for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d>farD){farD=d;far=e}}}}
    if(far){
      addP(u.x,u.y,'#660066',16,4);
      u.x=far.x+u.facing*-22;u.y=far.y;
      addP(u.x,u.y,'#660066',16,4);
      u.stealthHits=0;u.firstHitDone=false;
      dealDamage(far,u.dmg*3,u,'normal');
      showFlash('SHADOWSTEP!','#aa66cc',30);
    }
  },
  fanOfKnives(u){ // Felfel L5
    if(!tryAbility(u,'fanOfKnives','fanOfKnives',720))return; // 6s CD
    let _hit=0;
    for(const e of enemies){
      if(e.hp<=0)continue;
      if(dist(u,e)>120)continue;
      dealDamage(e,Math.round(u.dmg*1.5),u,'normal');
      // Apply Deadly Poison to all hit
      if(u.deadlyPoison){
        arena_applyFelfelDeadlyPoison(u,e,1,true,false);
      }
      addP(e.x,e.y,'#aa44cc',4,2);
      addP(e.x+rnd(-8,8),e.y+rnd(-8,8),'#ff4466',2,3);
      _hit++;
    }
    if(_hit>0){
      for(let i=0;i<8;i++){
        const a=Math.PI*2*i/8;
        const kx=u.x+Math.cos(a)*60,ky=u.y+Math.sin(a)*60;
        addP(kx,ky,'#ddddee',2,2);
        beamFx.push({x1:u.x,y1:u.y,x2:kx,y2:ky,color:'#ccccdd',width:1.5,life:0.25,maxLife:0.25,straight:true});
      }
      groundFx.push({x:u.x,y:u.y,r:0,maxR:120,life:0.4,color:'#8844aa'});
      addDmg(u.x,u.y-u.size,'FAN OF KNIVES!','#cc88ee',{sz:14,bold:true});
      showFlash('FAN OF KNIVES','#cc88ee',30);screenShake=Math.max(screenShake,3);
      SFX.fanOfKnives();
    }
  },
  bladeStorm(u){ // Jazar A3 Ã¢â‚¬â€ spin AoE for 2s
    if(!tryAbility(u,'bladeStorm','storm',720))return;
    u._bladeStormTimer=120;u._bladeStormTick=0;
    arena_jazarGuard(u,Math.round(3*GAME_TICK_HZ),0.32);
    showFlash('BLADE STORM!','#ff8800',40);
    for(let i=0;i<12;i++){
      const a=Math.PI*2*i/12;
      addP(u.x+Math.cos(a)*20,u.y+Math.sin(a)*20,'#ffaa44',2,3);
    }
    groundFx.push({x:u.x,y:u.y,r:0,maxR:90,life:0.5,color:'#ff880044'});
    SFX.bladeStorm();
  },
  shadowClones(u){ // Jazar A5 Ã¢â‚¬â€ summon 2 mirror images
    if(!tryAbility(u,'shadowClones','clones',1500))return;
    arena_jazarGuard(u,Math.round(3*GAME_TICK_HZ),0.30);
    for(let i=0;i<2;i++){
      const cx=u.x+rnd(-30,30),cy=u.y+rnd(-20,20);
      const clone={x:cx,y:cy,hp:Math.round(u.maxHp*0.3),maxHp:Math.round(u.maxHp*0.3),
        dmg:Math.round(u.dmg*0.4),armor:0,magicRes:0,speed:u.speed,atkSpd:u.atkSpd,range:u.range,
        size:u.size*0.85,color:'#ff8c00',accent:'#cc6600',facing:u.facing,cd:0,
        isPlayer:true,isMinion:true,parent:u,kind:'clone',unitIdx:5,drawFn:'drawJazar',
        bobPhase:Math.random()*Math.PI*2,_cloneTimer:300,_isClone:true,debuffs:{}};
      units.push(clone);addP(cx,cy,'#ffaa44',16,4);
    }
    showFlash('SHADOW CLONES!','#ff8800',50);screenShake=Math.max(screenShake,4);
  },
  colossusSmash(u){ // Jazar Sword Saint A3 Ã¢â‚¬â€ AoE armor shred
    if(!tryAbility(u,'colossusSmash','smash',900))return;
    arena_jazarGuard(u,Math.round(3*GAME_TICK_HZ),0.35);
    let _hit=0;
    for(const e of enemies){if(e.hp>0&&dist(u,e)<85){
      dealDamage(e,Math.round(u.dmg*2.0),u,'normal');
      e._armorShred=(e._armorShred||0)+1;e._armorShredTimer=300;
      addP(e.x,e.y,'#ff6600',12,4);_hit++;
    }}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:85,life:0.6,swipeSlam:true,color:'#ff6600'});
    if(_hit)addDmg(u.x,u.y-u.size,'COLOSSUS SMASH!','#ff8800');
    screenShake=Math.max(screenShake,10);
  },
  windSlash(u){ // Jazar Wind Dancer A3 Ã¢â‚¬â€ dash toward nearest enemy slashing
    if(!tryAbility(u,'windSlash','slash',12*GAME_TICK_HZ))return;
    let _wsTarget=null,_wsDist=Infinity;
    for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d<250&&d<_wsDist){_wsDist=d;_wsTarget=e}}}
    if(!_wsTarget)return;
    const startX=u.x,startY=u.y;
    const ang=Math.atan2(_wsTarget.y-u.y,_wsTarget.x-u.x);
    const dashLen=Math.min(_wsDist+20,180);
    let _hit=0;
    for(const e of enemies){if(e.hp>0){
      const ex=e.x-startX,ey=e.y-startY;
      const lx=Math.cos(ang)*dashLen,ly=Math.sin(ang)*dashLen,ll=dashLen||1;
      const t=Math.max(0,Math.min(1,(ex*lx+ey*ly)/(ll*ll)));
      const px=startX+lx*t,py=startY+ly*t;
      if(Math.hypot(e.x-px,e.y-py)<=40){
        dealDamage(e,Math.round(u.dmg*1.8),u,'normal');addP(e.x,e.y,'#44ccff',10,4);_hit++;
      }
    }}
    u.x=_wsTarget.x;u.y=_wsTarget.y+10;
    clampToArena(u);
    arena_jazarGuard(u,Math.round(3*GAME_TICK_HZ),0.35);
    for(let i=0;i<8;i++){const px=startX+(u.x-startX)*(i/8),py=startY+(u.y-startY)*(i/8);addP(px,py,'#44ccff',2,3);addP(px+rnd(-8,8),py+rnd(-8,8),'#88eeff',1,2)}
    groundFx.push({x:(startX+u.x)/2,y:(startY+u.y)/2,r:0,maxR:Math.max(30,dist({x:startX,y:startY},u)/2),life:0.4,swipeArc:true,swipeAngle:ang,color:'#44ccff'});
    if(_hit){addDmg(u.x,u.y-u.size,'WIND SLASH!','#44ccff');screenShake=Math.max(screenShake,6)}
  },
  thousandCuts(u){ // Jazar Wind Dancer A5 Ã¢â‚¬â€ hyper mode
    if(!tryAbility(u,'thousandCuts','cuts',1080))return;
    u._thousandCutsTimer=300;
    arena_jazarGuard(u,Math.round(4*GAME_TICK_HZ),0.30);
    u._origAtkSpd=u._origAtkSpd||u.atkSpd;
    u.atkSpd=Math.max(12,Math.round(u.atkSpd*0.70));
    showFlash('THOUSAND CUTS!','#44ccff',50);addP(u.x,u.y,'#44ccff',24,5);
  },
  enrageBlade(u){ // Jazar Sword Saint A5 Ã¢â‚¬â€ passive trigger, ability is a no-op (handled in tick)
    if(u.enrageBlade&&u.enrageBlade.active)return;
  },
  // ----- RANGED -----
  flameCircle(u){ // Alibaba base A3 Ã¢â‚¬â€ reliable burning circle on the best enemy cluster
    const best=arena_findBestEnemyClusterPoint(u,(u.range||180)+180,90);
    if(!best)return;
    if(!tryAbility(u,'flameCircle','flameCircle',12*GAME_TICK_HZ))return;
    u._flameCircle={
      x:best.x,y:best.y,r:90,timer:4*GAME_TICK_HZ,tick:0,
      dmg:Math.max(1,Math.round(u.dmg*0.25)),from:u
    };
    addP(best.x,best.y,'#ff6600',26,5);
    addP(best.x,best.y,'#ffcc00',12,4);
    groundFx.push({x:best.x,y:best.y,r:0,maxR:90,life:0.6,color:'#ff4400'});
    groundFx.push({x:best.x,y:best.y,r:0,maxR:55,life:0.35,color:'#ffaa00'});
    addDmg(best.x,best.y-24,'FLAME CIRCLE!','#ff6600',{sz:14,bold:true});
    showFlash('FLAME CIRCLE','#ff6600',35);
    screenShake=Math.max(screenShake,5);
  },
  flamestrike(u){ // Alibaba base A3 Ã¢â‚¬â€ AoE fire column on enemy cluster
    if(!tryAbility(u,'flamestrike','flamestrike',12*GAME_TICK_HZ))return;
    let best=null,bestCount=0;
    for(const e of enemies){if(e.hp<=0)continue;let c=0;for(const f of enemies){if(f.hp>0&&dist(e,f)<80)c++}if(c>bestCount){bestCount=c;best=e}}
    if(!best)return;
    const dmg=Math.round(u.dmg*2.0);
    for(const e of enemies){if(e.hp>0&&dist(best,e)<=80)dealDamage(e,dmg,u,'magic')}
    groundFx.push({x:best.x,y:best.y,r:0,maxR:80,life:0.6,color:'#ff4400'});
    addP(best.x,best.y,'#ff6600',24,5);addDmg(best.x,best.y-20,'FLAMESTRIKE!','#ff4400');
    screenShake=Math.max(screenShake,6);
  },
  fireElemental(u){ // Alibaba base A5 Ã¢â‚¬â€ passive, elemental spawned at wave start
  },
  waterElemental(u){ // Alibaba Frost A5 Ã¢â‚¬â€ passive, water elemental spawned at wave start
  },
  stormElemental(u){ // Alibaba Storm A5 Ã¢â‚¬â€ passive, storm elemental spawned at wave start
  },
  chainLightning(u){ // Alibaba Storm A3 Ã¢â‚¬â€ hit target + chain to 4 nearby
    if(!tryAbility(u,'chainLightning','chainLightning',10*GAME_TICK_HZ))return;
    const t=findEnemyForUnit(u);if(!t)return;
    const baseDmg=Math.round(u.dmg*2.0);
    dealDamage(t,baseDmg,u,'magic');
    addP(t.x,t.y,'#aa88ff',16,5);addDmg(t.x,t.y-t.size,'CHAIN LIGHTNING!','#aa88ff');
    let prev=t;const chainDmg=Math.round(u.dmg*1.2);const hit=[t];
    for(let c=0;c<4;c++){
      let best=null,bestD=Infinity;
      for(const e of enemies){if(e.hp<=0||hit.includes(e))continue;const d=dist(prev,e);if(d<120&&d<bestD){bestD=d;best=e}}
      if(!best)break;
      dealDamage(best,chainDmg,u,'magic');hit.push(best);
      groundFx.push({x:prev.x,y:prev.y,r:0,maxR:0,life:0.3,lightningBolt:true,lbX2:best.x,lbY2:best.y,color:'#aa88ff'});
      addP(best.x,best.y,'#ccaaff',8,3);prev=best;
    }
    screenShake=Math.max(screenShake,5);showFlash('CHAIN LIGHTNING!','#aa88ff',40);
    SFX.chainLightning();
  },
  blizzard(u){ // Alibaba Barid A3 Ã¢â‚¬â€ 5s channeled AoE zone
    if(!tryAbility(u,'blizzard','blizzard',15*GAME_TICK_HZ))return;
    const t=findEnemyForUnit(u);if(!t)return;
    u._blizzardX=t.x;u._blizzardY=t.y;u._blizzardTimer=5*GAME_TICK_HZ;u._blizzardDmg=Math.round(u.dmg*0.45);u._blizzardRadius=70;
    addDmg(u.x,u.y-u.size,'BLIZZARD!','#66ccff');
    showFlash('BLIZZARD!','#88ddff',40);
    screenShake=Math.max(screenShake,4);
  },
  iceBarrier(u){ // Alibaba Barid A5 Ã¢â‚¬â€ shield absorbing 40% HP, breaksÃ¢â€ â€™freeze nearby
    if(!tryAbility(u,'iceBarrier','iceBarrier',18*GAME_TICK_HZ))return;
    u._iceBarrier={hp:Math.round(u.maxHp*0.40),maxHp:Math.round(u.maxHp*0.40),dur:8*GAME_TICK_HZ};
    addDmg(u.x,u.y-u.size,'ICE BARRIER!','#66ccff');
    addP(u.x,u.y,'#88ddff',16,4);
    for(let i=0;i<10;i++){const a=Math.PI*2*i/10;addP(u.x+Math.cos(a)*u.size*1.2,u.y+Math.sin(a)*u.size*1.2,'#aaeeff',1,3)}
  },
  massSummon(u){ // LEGACY Ã¢â‚¬â€ kept for backwards compatibility
    if(!tryAbility(u,'massSummon','massSummon',60))return;
    const myMinions=units.filter(m=>m.isMinion&&m.parent===u&&m.hp>0).length;
    if(myMinions>0){u.abilCD.massSummon=30;return}
    if((u.summonCDt||0)>0){u.abilCD.massSummon=30;return}
    spawnMinion(u,'foul',3);
    addP(u.x,u.y,'#7b8a3a',20,4);
    screenShake=Math.max(screenShake,4);
    showFlash('MASS SUMMON!','#7b8a3a',30);
  },
  curseOfDoom(u){ // LEGACY
    if(!tryAbility(u,'curseOfDoom','doom',2100))return;
    const t=findEnemyForUnit(u);
    if(t){
      t.doomTimer=300;t.doomDmg=u.dmg*8;t.doomFrom=u;
      addP(t.x,t.y,'#660066',12,4);
      showFlash('CURSE OF DOOM!','#aa66cc',40);
    }
  },
  drainLife(u){ // Jafaar L3 Ã¢â‚¬â€ channel 4s on current target
    if(!tryAbility(u,'drainLife','drainLife',14*GAME_TICK_HZ))return;
    const t=arena_findJafaarDrainTarget(u)||findEnemyForUnit(u);
    if(!t)return;
    u._drainLife={target:t,dur:4*GAME_TICK_HZ,t:0,dps:Math.round(u.dmg*0.80)};
    u._drainChanneling=true;
    addDmg(u.x,u.y-u.size,'DRAIN LIFE!','#33ff66',{sz:13,bold:true});
    addP(u.x,u.y,'#33ff66',22,5);addP(t.x,t.y,'#55ff88',12,4);
    beamFx.push({x1:u.x,y1:u.y-u.size*0.25,x2:t.x,y2:t.y-t.size*0.2,life:0.35,maxLife:0.35,color:'#33ff66',width:4,straight:false});
  },
  summonFelhound(u){ // Jafaar L5 Ã¢â‚¬â€ passive, spawned in arena_spawnSquadMinions
  },
  petBear(u){ // Zaatar L3 Ã¢â‚¬â€ cooldown 10s after pet dies
    if(!tryAbility(u,'petBear','petBear',60))return;
    const myPets=units.filter(m=>m.isMinion&&m.parent===u&&m.hp>0).length;
    if(myPets>0){u.abilCD.petBear=30;return}
    if((u.summonCDt||0)>0){u.abilCD.petBear=30;return}
    const b={x:u.x+10,y:u.y+15,
      maxHp:350+u.level*30,hp:350+u.level*30,dmg:18,speed:0.4,atkSpd:60,range:36,size:18,armor:2,magicRes:0,
      isPlayer:true,isMinion:true,parent:u,kind:'bear',cd:0,color:'#8b4513',accent:'#5d2f0d',facing:1,bobPhase:0};
    units.push(b);
    addP(b.x,b.y,'#8b4513',16,4);
    screenShake=Math.max(screenShake,4);
    showFlash('PET BEAR!','#8b4513',30);
  },
  volley(u){ // Zaatar L5 (legacy)
    if(!tryAbility(u,'volley','volley',1680))return;
    let tx=W/2,ty=ARENA_TOP+150;
    if(enemies.length){const e=enemies[0];tx=e.x;ty=e.y}
    groundFx.push({x:tx,y:ty,r:0,maxR:60,life:1,color:'#88ff44',volley:true,volleyTimer:240,volleyDmg:u.dmg*0.6,volleyTick:0,volleyFrom:u});
    showFlash('VOLLEY!','#88ff44',40);
  },
  rapidFire(u){ // Zaatar L3 Ã¢â‚¬â€ channel 8 rapid shots on target (14s CD)
    if(!tryAbility(u,'rapidFire','rapidFire',14*GAME_TICK_HZ))return;
    const t=findEnemyForUnit(u);
    if(!t)return;
    u._rapidFire={target:t,shots:8,shotTimer:0,shotInterval:Math.round(GAME_TICK_HZ*3/8),dmgMult:0.60};
    u._rapidChanneling=true;
    addDmg(u.x,u.y-u.size,'RAPID FIRE!','#ffd700');
    addP(u.x,u.y,'#ffd700',16,4);
  },
  callWolf(u){ // Zaatar L5 Ã¢â‚¬â€ passive, spawned in arena_spawnSquadMinions
  },
  explosiveShot(u){ // Zaatar Trapper A3 Ã¢â‚¬â€ charged shot that explodes on impact
    if(!tryAbility(u,'explosiveShot','explosiveShot',12*GAME_TICK_HZ))return;
    const t=findEnemyForUnit(u);
    if(!t)return;
    const _esDmg=Math.round(u.dmg*2.5);
    dealDamage(t,_esDmg,u,'physical');
    const _aoeR=60;
    for(const e of enemies){if(e!==t&&e.hp>0&&dist(t,e)<=_aoeR){dealDamage(e,Math.round(_esDmg*0.5),u,'physical');addP(e.x,e.y,'#ff6600',8,3)}}
    addP(t.x,t.y,'#ff8800',24,5);
    groundFx.push({x:t.x,y:t.y,r:0,maxR:_aoeR,life:0.4,color:'#ff6600'});
    addDmg(u.x,u.y-u.size,'EXPLOSIVE SHOT!','#ff6600');screenShake=Math.max(screenShake,5);
  },
  direBeast(u){ // Zaatar Beast Mastery A3 Ã¢â‚¬â€ summon a temp wild beast
    if(!tryAbility(u,'direBeast','direBeast',18*GAME_TICK_HZ))return;
    if(!enemies.some(e=>e.hp>0))return;
    const _lv=u.level||1;
    const _hp=200+_lv*30;
    const _db={x:u.x+rnd(-20,20),y:u.y+rnd(-10,10),maxHp:_hp,hp:_hp,dmg:Math.round(u.dmg*0.8),
      speed:0.50,atkSpd:42,range:36,size:16,armor:1,magicRes:0,
      isPlayer:true,isMinion:true,parent:u,kind:'direBeast',cd:0,
      color:'#8a6a3a',accent:'#5a4020',facing:1,
      bobPhase:Math.random()*Math.PI*2,lifeTicks:8*GAME_TICK_HZ};
    nerfMinion(_db);
    units.push(_db);
    addP(_db.x,_db.y,'#8a6a3a',16,4);
    addDmg(u.x,u.y-u.size,'DIRE BEAST!','#8a6a3a');
  },
  empGrenade(u){ // Rumman L3 Ã¢â‚¬â€ EMP: AoE silence + slow
    if(!tryAbility(u,'empGrenade','empGrenade',14*GAME_TICK_HZ))return;
    const t=findEnemyForUnit(u);
    if(!t)return;
    const _empR=80;
    const _empDmg=Math.round(u.dmg*1.65);
    for(const e of enemies){if(e.hp>0&&dist(t,e)<=_empR){
      dealDamage(e,_empDmg,u,'magic');
      if(e.range>60)e.silenced=Math.max(e.silenced||0,2*GAME_TICK_HZ);
      e.slowTimer=Math.max(e.slowTimer||0,3*GAME_TICK_HZ);e.slowMult=Math.min(e.slowMult||1,0.70);
      e._rommanaMarkedTimer=4*GAME_TICK_HZ;e._rommanaMarkedAmp=0.10;e._rommanaMarkedSource=u;
      addP(e.x,e.y,'#44ccff',8,3);
    }}
    groundFx.push({x:t.x,y:t.y,r:0,maxR:_empR,life:0.5,color:'#44ccff'});
    groundFx.push({x:t.x,y:t.y,r:0,maxR:_empR*0.55,life:0.35,color:'#ffffff'});
    addDmg(u.x,u.y-u.size,'EMP MARK!','#44ccff');screenShake=Math.max(screenShake,6);
  },
  repairBot(u){ // Rumman L5 Ã¢â‚¬â€ heal drone on lowest HP ally
    if(!tryAbility(u,'repairBot','repairBot',20*GAME_TICK_HZ))return;
    let lowest=null,lowPct=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&a!==u&&!a.isMinion){const p=a.hp/a.maxHp;if(p<lowPct){lowPct=p;lowest=a}}}
    if(!lowest)return;
    const _lv=u.level||1;
    const _bot={x:u.x,y:u.y-10,maxHp:80+_lv*20,hp:80+_lv*20,dmg:0,
      speed:0.45,atkSpd:999,range:60,size:10,armor:0,magicRes:0,
      isPlayer:true,isMinion:true,parent:u,kind:'repairBot',cd:0,
      _healTarget:lowest,_healAmt:Math.round(lowest.maxHp*0.035),_healTick:0,_shieldTick:0,
      color:'#44cc88',accent:'#228855',facing:1,
      bobPhase:Math.random()*Math.PI*2,lifeTicks:10*GAME_TICK_HZ};
    nerfMinion(_bot);
    units.push(_bot);
    addP(_bot.x,_bot.y,'#44cc88',12,4);
    addDmg(u.x,u.y-u.size,'REPAIR BOT!','#44cc88');
  },
  rocketBarrage(u){ // Rumman Siege A3 - 8 rockets prioritizing enemy clusters
    if(!tryAbility(u,'rocketBarrage','rocketBarrage',12*GAME_TICK_HZ))return;
    const alive=enemies.filter(e=>e.hp>0&&dist(u,e)<(u.range||180)+60);
    if(!alive.length)return;
    const scored=alive.map(e=>{
      let count=0;
      for(const f of alive){if(dist(e,f)<=85)count++}
      return {e,score:count*100+(e.isBoss?35:0)-dist(u,e)*0.1};
    }).sort((a,b)=>b.score-a.score);
    for(let i=0;i<8;i++){
      const t=scored[i%Math.min(4,scored.length)].e;
      fireProjectile(u,t,Math.round(u.dmg*1.05),{projType:'bolt',color:'#ff6600'});
    }
    addDmg(u.x,u.y-u.size,'ROCKET BARRAGE!','#ff6600');screenShake=Math.max(screenShake,6);
  },
  napalmGrid(u){ // Rumman Siege A5 - three burning denial zones
    if(!tryAbility(u,'napalmGrid','napalmGrid',22*GAME_TICK_HZ))return;
    const alive=enemies.filter(e=>e.hp>0&&dist(u,e)<(u.range||180)+110);
    if(!alive.length)return;
    const scored=alive.map(e=>{
      let count=0;
      for(const f of alive){if(dist(e,f)<=95)count++}
      return {e,score:count*100+(e.isBoss?45:0)-dist(u,e)*0.1};
    }).sort((a,b)=>b.score-a.score);
    u._napalmGridZones=[];
    for(let i=0;i<3;i++){
      const base=scored[i%scored.length].e;
      const x=Math.max(ARENA_L+35,Math.min(ARENA_R-35,base.x+rnd(-45,45)));
      const y=Math.max(ARENA_TOP+35,Math.min(ARENA_BOT-35,base.y+rnd(-35,35)));
      const r=78;
      u._napalmGridZones.push({x,y,r,dur:4*GAME_TICK_HZ,tickRate:24,tickCD:i*6,dmgPerTick:Math.round(u.dmg*0.34),from:u});
      beamFx.push({x1:x,y1:y-110,x2:x,y2:y,life:0.55,maxLife:0.55,color:'#ff4400',width:10,straight:true});
      beamFx.push({x1:x,y1:y-110,x2:x,y2:y,life:0.35,maxLife:0.35,color:'#ffcc00',width:4,straight:true});
      groundFx.push({x,y,r:0,maxR:r,life:0.8,color:'#ff4400'});
      addP(x,y,'#ff6600',24,6);addP(x,y,'#ffcc00',12,4);
    }
    addDmg(u.x,u.y-u.size,'NAPALM GRID!','#ff4400');
    showFlash('NAPALM GRID!','#ff4400',55);
    screenShake=Math.max(screenShake,10);
  },
  shieldGenerator(u){ // Rumman Mech A3 Ã¢â‚¬â€ absorb shield on self + nearest ally
    if(!tryAbility(u,'shieldGenerator','shieldGenerator',15*GAME_TICK_HZ))return;
    const _lv=u.level||1;
    const _shieldAmt=300+_lv*40;
    u._engShield={hp:_shieldAmt,max:_shieldAmt,dur:5*GAME_TICK_HZ,t:0};
    let nearest=null,nd=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&a!==u&&!a.isMinion){const d=dist(u,a);if(d<nd){nd=d;nearest=a}}}
    if(nearest)nearest._engShield={hp:Math.round(_shieldAmt*0.5),max:Math.round(_shieldAmt*0.5),dur:5*GAME_TICK_HZ,t:0};
    addP(u.x,u.y,'#44aaff',20,5);
    addDmg(u.x,u.y-u.size,'SHIELD!','#44aaff');
  },
  // ----- HEALERS -----
  holyWordSerenity(u){ // Naana A3 Ã¢â‚¬â€ massive single heal + cleanse
    if(!tryAbility(u,'holyWordSerenity','serenity',14*GAME_TICK_HZ))return;
    let lowest=null,lowPct=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&a!==u){const p=a.hp/a.maxHp;if(p<lowPct){lowPct=p;lowest=a}}}
    if(!lowest)return;
    const heal=arena_applyHealingReceived(lowest,Math.round(lowest.maxHp*0.45));
    lowest.hp=Math.min(lowest.maxHp,lowest.hp+heal);
    // Cleanse debuffs
    if(lowest.bleedTimer>0){lowest.bleedTimer=0;lowest.bleedDmg=0}
    if(lowest.slowTimer>0){lowest.slowTimer=0;lowest.slowMult=1}
    if(lowest.stunned>0)lowest.stunned=0;
    addHealFx(lowest.x,lowest.y,heal);
    projectiles.push({x:u.x,y:u.y,target:lowest,tx:lowest.x,ty:lowest.y,speed:3,projType:'serenityOrb',visualOnly:true,color:'#66ffaa',_arrN:24,_arrSz:5,_arrGnd:50,isPlayer:true,dmg:0});
    beamFx.push({x1:u.x,y1:u.y,x2:lowest.x,y2:lowest.y,life:25,maxLife:25,color:'#66ffaa',width:3,straight:true});
    addP(lowest.x,lowest.y,'#66ffaa',20,5);
    groundFx.push({x:lowest.x,y:lowest.y,r:0,maxR:50,life:0.5,color:'#66ffaa'});
    u._healCast=20;
    addDmg(lowest.x,lowest.y-lowest.size,'SERENITY!','#66ffaa');showFlash('HOLY WORD: SERENITY','#66ffaa',40);
  },
  guardianSpirit(u){ // Naana A5 Ã¢â‚¬â€ prevent death on lowest ally
    if(!tryAbility(u,'guardianSpirit','guardian',24*GAME_TICK_HZ))return;
    let lowest=null,lowPct=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&a!==u&&!a.isMinion&&!a.isGhost){const p=a.hp/a.maxHp;if(p<lowPct){lowPct=p;lowest=a}}}
    if(!lowest)return;
    lowest._guardianSpirit={timer:10*GAME_TICK_HZ,healPct:0.45,from:u};
    projectiles.push({x:u.x,y:u.y,target:lowest,tx:lowest.x,ty:lowest.y,speed:3,projType:'serenityOrb',visualOnly:true,color:'#ffd700',_arrN:20,_arrSz:5,_arrGnd:40,isPlayer:true,dmg:0});
    beamFx.push({x1:u.x,y1:u.y,x2:lowest.x,y2:lowest.y,life:30,maxLife:30,color:'#ffd700',width:3,straight:true});
    addDmg(lowest.x,lowest.y-lowest.size,'GUARDIAN SPIRIT!','#ffd700');showFlash('GUARDIAN SPIRIT','#ffd700',45);
  },
  voidEruption(u){ // Naana Shadow A3 Ã¢â‚¬â€ AoE burst + enter Voidform
    if(!tryAbility(u,'voidEruption','void',10*GAME_TICK_HZ))return;
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<200))return;
    const _vDmg=Math.round(u.dmg*2.0);
    for(const e of enemies){if(e.hp>0&&dist(u,e)<=80){
      dealDamage(e,_vDmg,u,'magic');
      addP(e.x,e.y,'#6622aa',14,4);
    }}
    const _vfDur=u.hasL5?7*GAME_TICK_HZ:5*GAME_TICK_HZ;
    u._voidform={timer:_vfDur,splashRadius:35,atkSpdBoost:true,dotDoubleTick:true};
    if(!u._vfOrigAtkSpd){u._vfOrigAtkSpd=u.atkSpd;u.atkSpd=Math.max(8,Math.round(u.atkSpd*0.80))}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:80,life:0.6,color:'#3a0a5a'});
    for(let i=0;i<24;i++){const a=Math.PI*2*i/24;addP(u.x+Math.cos(a)*50,u.y+Math.sin(a)*50,'#6622aa',1,4)}
    for(let i=0;i<16;i++)addP(u.x+rnd(-30,30),u.y+rnd(-30,30),'#aa66ff',1,5);
    addDmg(u.x,u.y-u.size,'VOID ERUPTION!','#aa66ff');showFlash('VOID ERUPTION','#aa66ff',50);
    screenShake=Math.max(screenShake,10);
  },
  surrenderToMadness(u){ // Naana Shadow A3 (L3) Ã¢â‚¬â€ Ãƒâ€”3 dmg for 5s, chains to 2
    if(!tryAbility(u,'surrenderToMadness','stm',20*GAME_TICK_HZ))return;
    if(!enemies.some(e=>e.hp>0))return;
    u._madness={timer:5*GAME_TICK_HZ,dmgMult:3.0,chainTargets:2};
    u._madnessOrigDmg=u.dmg;
    u.dmg=Math.round(u.dmg*3.0);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:80,life:0.6,color:'#3a0a5a'});
    for(let i=0;i<20;i++)addP(u.x+rnd(-25,25),u.y+rnd(-25,25),'#aa66ff',1,5);
    for(let i=0;i<12;i++){const a=Math.PI*2*i/12;addP(u.x+Math.cos(a)*50,u.y+Math.sin(a)*50,'#6622aa',1,4)}
    addDmg(u.x,u.y-u.size-4,'MADNESS!','#aa66ff');showFlash('SURRENDER TO MADNESS','#aa66ff',60);
    screenShake=Math.max(screenShake,10);
  },
  shadowWordDeath(u){ // Naana Shadow A5 Ã¢â‚¬â€ execute: 500% to low HP, CD reset on kill, self-damage on fail
    if(!tryAbility(u,'shadowWordDeath','swd',10*GAME_TICK_HZ))return;
    let target=null,lowestPct=1;
    for(const e of enemies){if(e.hp>0&&e.hp/e.maxHp<0.35){const p=e.hp/e.maxHp;if(p<lowestPct){lowestPct=p;target=e}}}
    if(!target)return;
    const _swdDmg=Math.round(u.dmg*5.0);
    dealDamage(target,_swdDmg,u,'magic');
    // Void orb projectile for visual
    projectiles.push({x:u.x,y:u.y,target:target,tx:target.x,ty:target.y,speed:6,projType:'voidOrb',visualOnly:true,color:'#aa66ff',_arrN:12,_arrSz:4,isPlayer:true,dmg:0});
    // Death skull VFX at target
    addP(target.x,target.y,'#1a0020',24,6);
    addP(target.x,target.y,'#aa66ff',16,4);
    for(let i=0;i<8;i++)addP(target.x+rnd(-15,15),target.y+rnd(-15,15),'#6622aa',1,3);
    groundFx.push({x:target.x,y:target.y,r:0,maxR:40,life:0.4,color:'#3a0a5a'});
    if(target.hp<=0){
      // Kill Ã¢â‚¬â€ reset cooldown + spawn 2 shadow apparitions
      u.abilCD['swd']=0;
      addDmg(target.x,target.y-target.size,'SW:DEATH KILL!','#cc88ff');
      showFlash('EXECUTE!','#cc88ff',50);
      screenShake=Math.max(screenShake,8);
      if(u.shadowApparitions){
        if(!arena.shadowApparitions)arena.shadowApparitions=[];
        for(let i=0;i<2;i++){
          const _re=enemies.filter(e=>e.hp>0);
          if(_re.length===0)break;
          const _at=_re[Math.floor(Math.random()*_re.length)];
          arena.shadowApparitions.push({x:target.x+rnd(-10,10),y:target.y+rnd(-10,10),tx:_at.x,ty:_at.y,target:_at,
            dmg:Math.round(u.dmg*u.shadowApparitions.dmgPct),from:u,speed:4,life:240});
        }
      }
    }else{
      // Didn't kill Ã¢â‚¬â€ self-damage backlash
      const selfDmg=Math.round(u.maxHp*0.15);
      u.hp=Math.max(1,u.hp-selfDmg);
      addDmg(u.x,u.y-u.size,'BACKLASH -'+selfDmg,'#ff4444');
      addP(u.x,u.y,'#ff4444',12,3);
      addDmg(target.x,target.y-target.size,'SW:DEATH','#aa66ff');
      screenShake=Math.max(screenShake,5);
    }
  },
  layOnHands(u){ // legacy Ã¢â‚¬â€ kept for King/Zayt compat
    if(!tryAbility(u,'layOnHands','loh',1800))return;
    let lowest=null,lowPct=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&a!==u){const p=a.hp/a.maxHp;if(p<lowPct){lowPct=p;lowest=a}}}
    if(lowest){
      lowest.hp=lowest.maxHp;
      lowest.armorBuff=12;lowest.armorBuffTimer=300;
      addHealFx(lowest.x,lowest.y,lowest.maxHp);
      for(let i=1;i<=10;i++){const _f=i/10;addP(u.x+(lowest.x-u.x)*_f,u.y+(lowest.y-u.y)*_f,'#ffd700',2,4)}
      addP(lowest.x,lowest.y,'#ffd700',32,6);
      showFlash('LAY ON HANDS!','#ffd700',40);
    }
  },
  divineShield(u){ // legacy Ã¢â‚¬â€ kept for King/Zayt compat
    if(!tryAbility(u,'divineShield','dshield',3600))return;
    let lowest=null,lowPct=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&a!==u){const p=a.hp/a.maxHp;if(p<lowPct){lowPct=p;lowest=a}}}
    if(lowest){
      lowest.divineShield=true;lowest.divineShieldTimer=180;
      addP(lowest.x,lowest.y,'#ffeeaa',32,5);
      showFlash('DIVINE SHIELD!','#ffeeaa',40);
    }
  },
  swiftmend(u){ // Bakdounes A3 Ã¢â‚¬â€ instant 40% heal + spawn treant healer
    if(!tryAbility(u,'swiftmend','swm',14*GAME_TICK_HZ))return;
    let lowest=null,lowPct=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&!a.isMinion){const p=a.hp/a.maxHp;if(p<lowPct){lowPct=p;lowest=a}}}
    if(!lowest)lowest=u;
    const _hm=u._incarnation?1.5:1.0;
    const _h=arena_applyTrackedHeal(lowest,Math.round(lowest.maxHp*0.35*_hm),u,true);
    addP(lowest.x,lowest.y,'#44ff66',20,5);addP(lowest.x,lowest.y,'#88ffaa',12,4);addP(lowest.x,lowest.y,'#ffffff',6,3);
    groundFx.push({x:lowest.x,y:lowest.y,r:0,maxR:55,life:0.6,color:'#44ff88'});
    groundFx.push({x:lowest.x,y:lowest.y,r:0,maxR:30,life:0.35,color:'#88ffcc'});
    beamFx.push({x1:u.x,y1:u.y,x2:lowest.x,y2:lowest.y,life:0.3,maxLife:0.3,color:'#44ff88',width:4,straight:false});
    for(let i=0;i<6;i++){const a=Math.PI*2*i/6;addP(lowest.x+Math.cos(a)*25,lowest.y+Math.sin(a)*25,'#66ff88',2,3)}
    arena_spawnTreant(u,lowest.x+rnd(-30,30),lowest.y+rnd(-15,15),12*GAME_TICK_HZ);
    addDmg(lowest.x,lowest.y-lowest.size-6,'SWIFTMEND!','#44ff88',{sz:14,bold:true});showFlash('SWIFTMEND','#44ff88',50);screenShake=Math.max(screenShake,3);
  },
  tranquility(u){ // Bakdounes A5 Ã¢â‚¬â€ channel 5s, heal lowest 5 allies 6%/tick
    if(!tryAbility(u,'tranquility','tranq',28*GAME_TICK_HZ))return;
    u._tranquility={timer:5*GAME_TICK_HZ,tickRate:Math.floor(GAME_TICK_HZ*0.5),tick:0,healPct:0.06};
    addDmg(u.x,u.y-u.size-8,'TRANQUILITY!','#33ff77',{sz:16,bold:true});
    for(let i=0;i<24;i++){const a=Math.PI*2*i/24;addP(u.x+Math.cos(a)*40,u.y+Math.sin(a)*40,'#44ff88',2,5)}
    for(let i=0;i<8;i++){const a=Math.PI*2*i/8;beamFx.push({x1:u.x,y1:u.y,x2:u.x+Math.cos(a)*80,y2:u.y+Math.sin(a)*80,life:0.4,maxLife:0.4,color:'#44ff88',width:2,straight:true})}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:120,life:0.7,color:'#33ff77'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:60,life:0.4,color:'#88ffcc'});
    showFlash('TRANQUILITY','#33ff77',70);screenShake=Math.max(screenShake,6);
  },
  aromaticBurst(u){ // Habaq A3 Ã¢â‚¬â€ green rain healing zone
    if(!tryAbility(u,'aromaticBurst','aburst',24*GAME_TICK_HZ))return;
    u._aromaBurstZone={x:u.x,y:u.y,r:140,timer:12*GAME_TICK_HZ,maxTimer:12*GAME_TICK_HZ,
      healAmt:Math.round((u.healAmt||60)*0.42),owner:u};
    groundFx.push({x:u.x,y:u.y,r:0,maxR:150,life:0.7,color:'#88cc66'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:95,life:0.4,color:'#aaffaa'});
    for(let i=0;i<8;i++){const a=Math.PI*2*i/8;beamFx.push({x1:u.x,y1:u.y,x2:u.x+Math.cos(a)*120,y2:u.y+Math.sin(a)*120,life:0.3,maxLife:0.3,color:'#88cc66',width:2,straight:true})}
    for(let i=0;i<30;i++){const ang=Math.PI*2*i/30,r=rnd(15,80);addP(u.x+Math.cos(ang)*r,u.y+Math.sin(ang)*r,'#88cc66',2,5)}
    for(let i=0;i<12;i++)addP(u.x+rnd(-40,40),u.y+rnd(-30,30),'#aaffaa',1,4);
    addDmg(u.x,u.y-u.size-8,'AROMATIC RAIN!','#88cc66',{sz:14,bold:true});
    showFlash('AROMATIC RAIN!','#88cc66',60);screenShake=Math.max(screenShake,6);
  },
  transcendence(u){ // Habaq A5 Ã¢â‚¬â€ statues heal 2x faster + spawn mist zones
    if(!tryAbility(u,'transcendence','transc',50*GAME_TICK_HZ))return;
    u._transcendenceTimer=8*GAME_TICK_HZ;
    addDmg(u.x,u.y-u.size-8,'TRANSCENDENCE!','#aaffaa',{sz:15,bold:true});
    for(let i=0;i<40;i++){const ang=Math.PI*2*i/40,r=rnd(10,60);addP(u.x+Math.cos(ang)*r,u.y+Math.sin(ang)*r,'#88cc66',2,6)}
    for(let i=0;i<20;i++)addP(u.x+rnd(-15,15),u.y-rnd(10,50),'#aaffaa',1.5,4);
    for(let i=0;i<6;i++){const a=Math.PI*2*i/6;beamFx.push({x1:u.x,y1:u.y,x2:u.x+Math.cos(a)*90,y2:u.y+Math.sin(a)*90,life:0.4,maxLife:0.4,color:'#aaffaa',width:3,straight:true})}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:130,life:0.8,color:'#88cc66'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:80,life:0.5,color:'#aaffaa'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:40,life:0.3,color:'#ffffff'});
    if(u._aromaStatues){for(const st of u._aromaStatues){beamFx.push({x1:u.x,y1:u.y,x2:st.x,y2:st.y,life:0.3,maxLife:0.3,color:'#ffd700',width:2,straight:false});addP(st.x,st.y,'#ffd700',12,4)}}
    showFlash('TRANSCENDENCE','#aaffaa',70);screenShake=Math.max(screenShake,7);
  },
  goldenCascade(u){ // Habaq Dhahabi A3 Ã¢â‚¬â€ golden chain heal bolts to allies, bonded ally heals double
    if(!tryAbility(u,'goldenCascade','gcasc',20*GAME_TICK_HZ))return;
    const bondTarget=u.essenceBond?u.essenceBond.target:null;
    const _allies=[];
    for(const a of units){if(a.isPlayer&&a.hp>0&&!a.isGhost&&!a.isMinion)_allies.push(a)}
    _allies.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp));
    const baseHeal=Math.round((u.healAmt||60)*0.55);
    for(const a of _allies){
      const h=(bondTarget&&a===bondTarget)?baseHeal*2:baseHeal;
      projectiles.push({x:u.x,y:u.y,target:a,tx:a.x,ty:a.y,speed:4,projType:'pomOrb',visualOnly:true,
        color:'#ffd700',_arrN:10,_arrSz:4,_arrGnd:25,isPlayer:true,dmg:0,
        _aromaHeal:h,_aromaOwner:u});
    }
    groundFx.push({x:u.x,y:u.y,r:0,maxR:160,life:0.6,color:'#ffd700'});
    addDmg(u.x,u.y-u.size-8,'GOLDEN CASCADE!','#ffd700');showFlash('GOLDEN CASCADE','#ffd700',60);screenShake=Math.max(screenShake,4);
  },
  prescientBarrier(u){ // Habaq Dhahabi A5 Ã¢â‚¬â€ golden shields on all allies for 6s
    if(!tryAbility(u,'prescientBarrier','pbarr',45*GAME_TICK_HZ))return;
    for(const a of units){
      if(!a.isPlayer||a.hp<=0||a.isGhost||a.isMinion)continue;
      a._goldShield={amt:Math.round(a.maxHp*0.22),timer:6*GAME_TICK_HZ,maxTimer:6*GAME_TICK_HZ};
      addP(a.x,a.y,'#ffd700',10,4);addP(a.x,a.y,'#ffe066',6,3);
    }
    for(let i=0;i<36;i++){const ang=Math.PI*2*i/36,r=rnd(10,60);addP(u.x+Math.cos(ang)*r,u.y+Math.sin(ang)*r,'#ffd700',1,5)}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:180,life:0.7,color:'#ffd700'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:120,life:0.5,color:'#ffe066'});
    addDmg(u.x,u.y-u.size-8,'PRESCIENT BARRIER!','#ffd700');showFlash('PRESCIENT BARRIER','#ffd700',70);screenShake=Math.max(screenShake,5);
  },
  // ----- VODKA HERO -----
  vineLash(u){ // Vodka L3
    if(!tryAbility(u,'vineLash','vineLash',1080))return;
    let far=null,farD=0;
    for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d>farD&&d<300){farD=d;far=e}}}
    if(far){
      groundFx.push({x:u.x,y:u.y,r:0,maxR:0,life:1,color:'#3a8e3a',vineLash:true,vineFromX:u.x,vineFromY:u.y,vineToX:far.x,vineToY:far.y,vineTimer:30});
      far.x=u.x+u.facing*40;far.y=u.y;
      dealDamage(far,u.dmg*1.5,u,'normal');
      showFlash('VINE LASH!','#3a8e3a',30);
    }
  },
  harvestFury(u){ // Vodka L5
    if(!tryAbility(u,'harvestFury','fury',3600))return;
    u.furyTimer=480;
    addP(u.x,u.y,'#ff8c00',40,6);
    screenShake=Math.max(screenShake,12);
    showFlash('HARVEST FURY!','#ff8c00',60);
  }
};

// =====================
// UNIT UPDATE (legacy removed Ã¢â‚¬â€ arena_updateUnit is authoritative)
// =====================
function updateUnit(u){arena_updateUnit(u)}
// =====================
// ENEMY UPDATE
// =====================
const combatEnemyRuntime=createCombatEnemyRuntime({
  view:()=>{
    const lane=arena_laneBounds();
    return {frame,width:W,height:H,arenaLeft:lane.left,arenaRight:lane.right,arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,state,arena,units,enemies,towers,playerCastle,groundFx,beamFx};
  },
  sound:SFX,
  randomRange:rnd,
  emitParticle:addP,
  addDamageText:addDmg,
  shake:value=>{screenShake=Math.max(screenShake,value);},
  updateArenaEnemyAi,
  moveToward,
  arena_updateEnemyMechanics,
  arena_enemyAttackCd,
  arena_applySearingBrandOnBasic,
  arena_applyRoyalStingOnBasic,
  dealDamage,
  fireProjectile,
  showFlash
});
function updateEnemy(e){return combatEnemyRuntime.updateEnemy(e)}


// =====================
// PROJECTILE / BOMB UPDATE
// =====================
function updateProjectile(p){
  return updateArenaProjectile(p,{
    arenaTop:ARENA_TOP,
    arenaBot:ARENA_BOT,
    width:W,
    frame,
    randomRange:rnd,
    units,
    enemies,
    projectiles,
    beamFx,
    groundEffects:groundFx,
    dealDamage,
    applyTrackedHeal:arena_applyTrackedHeal,
    applyBasicSecondHit:arena_applyBasicSecondHit,
    addGoldShield:arena_addGoldShield,
    emitParticle:addP,
    addDamageText:addDmg,
    shake:value=>{screenShake=Math.max(screenShake,value);}
  });
}
function updateBomb(b){
  return updateArenaBomb(b,{
    bombs,
    units,
    enemies,
    groundEffects:groundFx,
    randomRange:rnd,
    dealDamage,
    emitParticle:addP,
    addDamageText:addDmg,
    shake:value=>{screenShake=Math.max(screenShake,value);}
  });
}
const actorRenderer=createActorRenderer({
  ctx,
  view:()=>({width:W,frame,state,arena,arenaTop:ARENA_TOP,units,groundFx}),
  randomRange:rnd,
  emitParticle:addP,
  addHealEffect:addHealFx,
  applyHealingReceived:arena_applyHealingReceived,
  applyTrackedHeal:arena_applyTrackedHeal,
  drawSpecAccessory:arena_drawSpecAccessory,
  drawWithClashCamera:arena_drawWithClashCamera,
  overlayOffsetFor:arena_overlayOffsetFor
});
const drawFns=actorRenderer.drawFns;
const _v8UnitSprites=actorRenderer.unitSprites;
function arena_drawUnitSprite(...args){return actorRenderer.drawUnitSprite(...args)}
function projColor(...args){return actorRenderer.projColor(...args)}
function arena_playerVfxColor(...args){return actorRenderer.playerVfxColor(...args)}
function arena_drawPlayerAuraUnder(...args){return actorRenderer.drawPlayerAuraUnder(...args)}
function arena_drawPlayerAuraOver(...args){return actorRenderer.drawPlayerAuraOver(...args)}
function drawUnit(...args){return actorRenderer.drawUnit(...args)}
function drawUnitRaw(...args){return actorRenderer.drawUnitRaw(...args)}
function drawStatusIcons(...args){return actorRenderer.drawStatusIcons(...args)}
function drawHpBar(...args){return actorRenderer.drawHpBar(...args)}
function drawVodka(...args){return actorRenderer.drawVodka(...args)}
function drawBear(...args){return actorRenderer.drawBear(...args)}
function drawMinionFava(...args){return actorRenderer.drawMinionFava(...args)}
function drawSheep(...args){return actorRenderer.drawSheep(...args)}
function drawTurtle(...args){return actorRenderer.drawTurtle(...args)}
function drawPig(...args){return actorRenderer.drawPig(...args)}
function drawCritter(...args){return actorRenderer.drawCritter(...args)}
function drawDummy(...args){return actorRenderer.drawDummy(...args)}
function drawDummyRaw(...args){return actorRenderer.drawDummyRaw(...args)}

// =====================
// ARENA + UI
// =====================
// Lazy-init ambient floor decorations once per stage so they don't shimmer randomly
const arenaSceneRenderer=createArenaSceneRenderer({
  ctx,
  randomRange:rnd,
  view:()=>({
    width:W,height:H,frame,state,selectedCard,currentStage,bossRef,
    arenaL:ARENA_L,arenaR:ARENA_R,arenaTop:ARENA_TOP,arenaBot:ARENA_BOT,deployTop:DEPLOY_TOP,
    gridX,gridY:GRID_Y,gridW,cellW,cellH:CELL_H,gridCols:GRID_COLS,gridRows:GRID_ROWS
  })
});
function resetArenaDecor(){return arenaSceneRenderer.resetArenaDecor()}
function regenArenaDecor(){return arenaSceneRenderer.regenArenaDecor()}
function arena_camT(y){return arenaSceneRenderer.camT(y)}
function arena_camY(y){return arenaSceneRenderer.camY(y)}
function arena_camWidthScaleAt(y){return arenaSceneRenderer.camWidthScaleAt(y)}
function arena_camDepthScaleAt(y){return arenaSceneRenderer.camDepthScaleAt(y)}
function arena_camPoint(x,y){return arenaSceneRenderer.camPoint(x,y)}
function arena_screenToWorldPoint(x,y){return arenaSceneRenderer.screenToWorldPoint(x,y)}
function arena_pathCamQuad(x,y,w,h){return arenaSceneRenderer.pathCamQuad(x,y,w,h)}
function arena_drawWithClashCamera(x,y,fn){return arenaSceneRenderer.drawWithClashCamera(x,y,fn)}
function arena_overlayOffsetFor(anchor,x,y,w,h,minY){return arenaSceneRenderer.overlayOffsetFor(anchor,x,y,w,h,minY)}
function arena_bossArenaTheme(){return arenaSceneRenderer.bossArenaTheme()}
function arena_viewMode(){return arenaSceneRenderer.arenaViewMode}
function arena_toggleViewMode(){return arenaSceneRenderer.toggleArenaViewMode()}
function drawArena(){return arenaSceneRenderer.drawArena()}
function drawPillBtn(x,y,w,h,label,bg,fg){
  arenaButtonDrawers.drawPillBtn(x,y,w,h,label,bg,fg);
}
function drawSmallBtn(x,y,w,h,label,color){
  arenaButtonDrawers.drawSmallBtn(x,y,w,h,label,color);
}
// Returns {cw, ch, gap, startX, cardCount, rowY} Ã¢â‚¬â€ single source of truth for card row layout.
const cardRowRuntime=createCardRowRuntime({
  ctx,
  handSize:HAND_SIZE,
  playerUnits:PLAYER_UNITS,
  maxUnitLevel:ARENA_MAX_UNIT_LEVEL,
  heroButton:HERO_BTN,
  respawnFrames:RESPAWN_FRAMES,
  view:()=>({width:W,height:H,state,crystal,maxCrystal,gold,cardHand,selectedCard,unitLevels,currentStage,vodkaUnit,vodkaDead,vodkaDeployCD,vodkaLevel}),
  getUnitStats,
  isCapstoneLevel:arena_isCapstoneLevel,
  upgradeBtnRect,
  getStageMaxLevel,
  upgradeCost
});
function cardRowLayout(){return cardRowRuntime.cardRowLayout()}
function drawCardRow(){return cardRowRuntime.drawCardRow()}
function drawUpgradePanel(){return cardRowRuntime.drawUpgradePanel()}
function drawHeroButton(){return cardRowRuntime.drawHeroButton()}

const projectilesRuntime=createProjectilesRuntime({
  ctx,
  view:()=>({projectiles,frame}),
  emitParticle:addP,
  randomRange:rnd,
  unitSprites:()=>_v8UnitSprites,
  drawUnitSprite:arena_drawUnitSprite,
  projectileColor:projColor,
  camPoint:arena_camPoint,
  camDepthScaleAt:arena_camDepthScaleAt
});
function drawProjectiles(){return projectilesRuntime.drawProjectiles()}

function drawBeamFx(){
  drawBeamEffects(ctx,{beams:beamFx,randomRange:rnd});
}
const unitOverlaysRuntime=createUnitOverlaysRuntime({
  ctx,
  view:()=>({units,frame}),
  dist,
  randomRange:rnd,
  emitParticle:addP
});
function drawUnitOverlays(){return unitOverlaysRuntime.drawUnitOverlays()}

function drawBombs(){
  drawBombEffects(ctx,{bombs,frame,randomRange:rnd,emitParticle:addP});
}
function drawParticles(){
  drawParticleEffects(ctx,{particles});
}
const groundEffectsRuntime=createGroundEffectsRuntime({
  ctx,
  view:()=>({groundFx,frame}),
  randomRange:rnd,
  emitParticle:addP,
  clampValue:clamp
});
function drawGroundFx(){return groundEffectsRuntime.drawGroundFx()}

function drawDmgNums(){
  drawFloatingNumbers(ctx,{damageNumbers:dmgNums,healingNumbers:healFx});
}
function drawFlash(){
  drawFlashText(ctx,{width:W,text:flashText,timer:flashTimer,color:flashColor,anchorY:(playerCastle?playerCastle.y:ARENA_BOT-38)-55});
}

function drawSigBanner(){
  setSignatureBanner(drawSignatureBanner(ctx,{width:W,banner:_sigBanner,anchorY:(playerCastle?playerCastle.y:ARENA_BOT-38)-55}));
}

// =====================
// CODEX OVERLAY
// =====================
function drawCodex(){
  drawCodexScreen(ctx,{
    width:W,
    height:H,
    codexUnit,
    codexScroll,
    playerUnits:PLAYER_UNITS,
    vodka:VODKA,
    unitBranches:ARENA_UNIT_BRANCHES,
    drawPillButton:drawPillBtn,
    drawThreatsLegend:drawCodexThreatsLegend,
    drawArmorMatrix:drawCodexArmorMatrix,
    drawDetail:drawCodexDetail
  });
}
// ===== Threat Types legend page (codexUnit===100) =====
// Three sections: ARMOR, MOVEMENT/SPECIAL, ROLE. Each row = chip + counter advice.
const codexDetailRuntime=createCodexDetailRuntime({
  ctx,
  playerUnits:PLAYER_UNITS,
  vodka:VODKA,
  unitBranches:ARENA_UNIT_BRANCHES,
  attackTypeByUnit:ARENA_ATTACK_TYPE_BY_UNIT,
  armorMatrix:ARENA_ARMOR_MATRIX,
  defenseMatrix:ARENA_DEFENSE_MATRIX,
  playerArmorType:ARENA_PLAYER_ARMOR_TYPE,
  baseSignatures:ARENA_BASE_SIGNATURES,
  branchSignatures:ARENA_BRANCH_SIGNATURES,
  specHaloColors:ARENA_SPEC_HALO_COLORS,
  maxUnitLevel:ARENA_MAX_UNIT_LEVEL,
  view:()=>({width:W,height:H,arena,codexUnit,codexScroll,unitLevels,vodkaLevel,frame,signatures:ARENA_SIGNATURES,drawFns}),
  threatTagColor:arena_threatTagColor,
  rgba:arena_rgba,
  getStats,
  currentUnitPassives,
  signatureDisplayCooldown,
  signatureDisplayFirstCast,
  signatureIdForUnit,
  baseSpec:arena_baseSpec,
  isCapstoneLevel:arena_isCapstoneLevel,
  drawPillBtn,
  drawVodka
});
function drawCodexThreatsLegend(...args){return codexDetailRuntime.drawCodexThreatsLegend(...args)}
function drawCodexArmorMatrix(...args){return codexDetailRuntime.drawCodexArmorMatrix(...args)}
function drawCodexDetail(...args){return codexDetailRuntime.drawCodexDetail(...args)}
function prettyAbil(...args){return codexDetailRuntime.prettyAbil(...args)}
function wrapText(...args){return codexDetailRuntime.wrapText(...args)}
function arena_wrapTextClamped(...args){return codexDetailRuntime.arena_wrapTextClamped(...args)}
function arena_passiveTitle(...args){return codexDetailRuntime.arena_passiveTitle(...args)}
function arena_passiveShort(...args){return codexDetailRuntime.arena_passiveShort(...args)}
function arena_currentPassives(...args){return codexDetailRuntime.arena_currentPassives(...args)}
function arena_l5BonusBrief(...args){return codexDetailRuntime.arena_l5BonusBrief(...args)}
function arena_nextUnlockBrief(...args){return codexDetailRuntime.arena_nextUnlockBrief(...args)}
function arena_sigDisplayCd(...args){return codexDetailRuntime.arena_sigDisplayCd(...args)}
function arena_sigDisplayFc(...args){return codexDetailRuntime.arena_sigDisplayFc(...args)}
function arena_sigSuffix(...args){return codexDetailRuntime.arena_sigSuffix(...args)}
function arena_branchHeadline(...args){return codexDetailRuntime.arena_branchHeadline(...args)}
function arena_baseHeadline(...args){return codexDetailRuntime.arena_baseHeadline(...args)}
function arena_branchBlurb(...args){return codexDetailRuntime.arena_branchBlurb(...args)}
function passiveLabel(...args){return codexDetailRuntime.passiveLabel(...args)}
function abilityLabel(...args){return codexDetailRuntime.abilityLabel(...args)}
function arena_abilDesc(...args){return codexDetailRuntime.arena_abilDesc(...args)}
function arena_drawSkillSlots(...args){return codexDetailRuntime.arena_drawSkillSlots(...args)}
function arena_abilCdText(...args){return codexDetailRuntime.arena_abilCdText(...args)}
function drawLevelEditor(...args){return codexDetailRuntime.drawLevelEditor(...args)}
function getCanvasXY(e){
  return canvasEventPoint(canvas,W,H,e);
}
function inRect(p,x,y,w,h){return uiPointInRect(p,x,y,w,h)}

// Upgrade button placement above the selected visible card.
function upgradeBtnRect(unitIdx){
  if(selectedCard<0)return null;
  const L=cardRowLayout();
  const battleMode=state==='battle';
  let i=-1;
  if(battleMode){i=cardHand.indexOf(unitIdx)}else{i=unitIdx}
  if(i<0||i>=L.cardCount)return null;
  const cx=L.startX+i*(L.cw+L.gap);
  return{x:cx-4,y:L.rowY-44,w:L.cw+8,h:38};
}
function upgradeCost(currentLevel){
  // v3-style gold cost per tier (scales aggressively for L4 / L5)
  return [0,40,90,160,260][currentLevel]||999;
}
function tryUpgradeUnit(unitIdx){
  const cap=state==='battle'&&currentStage?getStageMaxLevel(currentStage.n):5;
  const cur=unitLevels[unitIdx];
  if(cur>=cap){showFlash('LEVEL CAPPED FOR THIS STAGE','#aa3333',40);return}
  if(cur>=ARENA_MAX_UNIT_LEVEL){showFlash('MAX LEVEL','#aa3333',40);return}
  const cost=Math.max(1,Math.round(upgradeCost(cur)));
  if(gold<cost){showFlash('NEED '+cost+' GOLD','#aa3333',40);return}
  setGold(gold-cost);
  unitLevels[unitIdx]=cur+1;
  showFlash(PLAYER_UNITS[unitIdx].name+' L'+(cur+1)+'!','#ffd700',60);
  addP(W/2,L_rowY()+18,'#ffd700',24,5);
  saveSave();
}
function L_rowY(){return H-82}
// Maximum scroll per screen (a little extra so footer is reachable)
function deckPickMaxScroll(){return Math.max(0,Math.ceil(PLAYER_UNITS.length/3)*168-(H-180))}
function spellPickMaxScroll(){return Math.max(0,ARENA_ABILITIES.length*128-(H-180))}
function perkPickMaxScroll(){return getPerkPickMaxScroll(ARENA_PERKS.length,H)}
function stageSelectMaxScroll(){
  return Math.max(0,86+5*180+56+56-(H-40));
}
function arena_scrollMaxForTarget(target){
  if(target.type==='codex')return target.max;
  if(target.type==='managePanel')return target.max;
  if(target.type==='unitPicker')return arena_pickerMaxScroll();
  if(target.type==='stageSelect')return stageSelectMaxScroll();
  if(target.type==='deckPick')return deckPickMaxScroll();
  if(target.type==='spellPick')return spellPickMaxScroll();
  if(target.type==='perkPick')return perkPickMaxScroll();
  return 0;
}
function arena_scrollValueForTarget(target){
  if(target.type==='codex')return codexScroll;
  if(target.type==='managePanel')return arena._mgrScroll||0;
  if(target.type==='unitPicker')return arena.pickerScroll||0;
  if(target.type==='stageSelect')return stageSelectScroll;
  if(target.type==='deckPick')return deckPickScroll;
  if(target.type==='spellPick')return spellPickScroll;
  if(target.type==='perkPick')return perkPickScroll;
  return 0;
}
function arena_setScrollValueForTarget(target,value){
  if(target.type==='codex')setCodexScroll(value);
  else if(target.type==='managePanel')arena._mgrScroll=value;
  else if(target.type==='unitPicker')arena.pickerScroll=value;
  else if(target.type==='stageSelect')setStageSelectScroll(value);
  else if(target.type==='deckPick')setDeckPickScroll(value);
  else if(target.type==='spellPick')setSpellPickScroll(value);
  else if(target.type==='perkPick')setPerkPickScroll(value);
}

// Touch scroll for selection screens on mobile.
let touchStartY=0;
let _touchAccumY=0; // accumulated drag in arena picker Ã¢â‚¬â€ used to detect tap-vs-scroll
const combatTransientsRuntime=createCombatTransientsRuntime({
  tickHz:GAME_TICK_HZ,
  view:()=>({frame,screenShake,units,enemies,projectiles,bombs,particles,damageNumbers:dmgNums,healFx,groundFx,beamFx}),
  setScreenShake:value=>{screenShake=value;uiState.screenShake=value;},
  dist,
  randomRange:rnd,
  dealDamage,
  emitParticle:addP,
  addHealEffect:addHealFx,
  addDamageText:addDmg,
  replaceBattleArray,
  updateProjectile,
  updateBomb,
  emberDecreeDamage:arena_emberDecreeDamage,
  clampToArena,
  applyFelfelDeadlyPoison:arena_applyFelfelDeadlyPoison,
  applyJafaarAgony:arena_applyJafaarAgony
});
const stageFlowRuntime=createStageFlowRuntime({
  tickHz:GAME_TICK_HZ,
  enemyHpMultiplier:HP_MULT_ENEMY,
  unitVisualScale:UNIT_VISUAL_SCALE,
  arenaUnitSizeScale:ARENA_UNIT_SIZE_SCALE,
  enemyTemplates:ENEMIES,
  stageHpMult:STAGE_HP_MULT,
  stageDmgMult:STAGE_DMG_MULT,
  view:()=>({
    state,arena,stageTime,currentStageIdx,currentStage,waveIdx,frame,
    arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,width:W,enemies,
    spawnLeft:arena_laneBounds().left,spawnRight:arena_laneBounds().right,
    spawnY:arena_enemySpawnY(),
    stageOver,playerCastle,selectedPerks,maxStage
  }),
  randomRange:rnd,
  clampValue:clamp,
  spawnEnemyByIndex,
  spawnBossByIdFromData,
  isCampaignBossRound:arena_isCampaignBossRound,
  applyWaveMechanic:arena_tryApplyWaveMechanic,
  lateRoundEnemyMult:arena_lateRoundEnemyMult,
  lateStageRoleHpMult:arena_lateStageRoleHpMult,
  lateStageNormalDurabilityMult:arena_lateStageNormalDurabilityMult,
  lateStageNormalDamageMult:arena_lateStageNormalDamageMult,
  setBossRef,
  setBossSpawned,
  setStageOver,
  setStageWon,
  setScreen,
  setMaxStage,
  addBeans,
  save:saveSave,
  stageStar:sn=>stageStars[sn],
  setStageStar:(sn,value)=>{stageStars[sn]=value;},
  stageBeansReward,
  computeStageStars:arena_computeStageStars,
  finishRoundStats:arena_statsFinishRound,
  completeCombatStats:won=>completeCombatStats(v8CombatStats,won),
  showFlash,
  emitParticle:addP,
  shake:value=>{screenShake=Math.max(screenShake,value);},
  sound:SFX,
  tickBossAerialBombs,
  tickTimedFieldEffects,
  bossMechanicsContext:arena_bossMechanicsContext,
  timedFieldEffectsContext:arena_timedFieldEffectsContext,
  startWave:arena_startWave,
  spawnQueuedEnemy:arena_spawnQueuedEnemy,
  spawnNextEnemyBatch:arena_spawnNextEnemyBatch,
  tryTriggerRift:arena_tryTriggerRift,
  spawnRiftMinions:arena_spawnRiftMinions,
  endWave:arena_endWave
});
const combatUpdateRuntime=createCombatUpdateRuntime({
  arenaState:()=>arena,
  screenState:()=>state,
  playerCastle:()=>playerCastle,
  units:()=>units,
  enemies:()=>enemies,
  advanceFrame,
  tickFlashTimer:()=>{if(flashTimer>0){flashTimer--;uiState.flashTimer=flashTimer;}},
  tickScreenShake:()=>{if(screenShake>0)screenShake-=0.5;},
  updateBossEngagement,
  compactRemovedCombatUnits,
  replaceUnits:next=>replaceBattleArray('units',next),
  tickPlayerCombatUnits,
  tickEnemyCombatUnits,
  updateArenaUnit:arena_updateUnit,
  updateLegacyUnit:updateUnit,
  resolvePlayerOverlaps:arena_resolvePlayerUnitOverlaps,
  updateCharmedEnemy:arena_updateCharmedEnemy,
  updateEnemy,
  updateBoss,
  tickEnemyPostUpdateStatusEffects,
  postEnemyStatusContext:()=>({
    frame,
    enemies,
    dealDamage,
    emitParticle:addP,
    groundEffects:groundFx,
    addDamageText:addDmg,
    showFlash,
    onDeath,
    randomRange:rnd,
    shake:value=>{screenShake=Math.max(screenShake,value);}
  }),
  updateWaves,
  updateCastle,
  tickActiveSkills,
  activeSkillsContext:()=>({arena,units,emitHeal:addHealFx,emitParticle:addP,random:rnd}),
  tickCombatTransients:()=>combatTransientsRuntime.tickCombatTransients(),
  clearDeadVodka:()=>{if(vodkaUnit&&vodkaUnit.hp<=0)setVodkaUnit(null);}
});
const arenaInputHandlers=createArenaInputHandlers({
  view:()=>({
    W,H,state,maxStage,stageSelectScroll,currentStageIdx,currentStage,deckPickStage,selectedSpells,
    spellPickStage,deckPickScroll,spellPickScroll,perkPickScroll,beans,unlockedPerks,selectedPerks,abilityTargeting,
    selectedDeck,arena,frame,cardHand,selectedCard,HERO_BTN,
    heroButton:HERO_BTN,vodkaUnit,vodkaDead,vodkaDeployCD,codexOpen,codexUnit,codexScroll
  }),
  inRect,dist,stages:STAGES,playerUnits:PLAYER_UNITS,abilities:ARENA_ABILITIES,perks:ARENA_PERKS,perkSlotCount,tickHz:GAME_TICK_HZ,
  arenaBounds:{get left(){return ARENA_L},get right(){return ARENA_R},get deployTop(){return DEPLOY_TOP},get bottom(){return ARENA_BOT}},
  setScreen,setStageSelectScroll,setCodexOpen,setCodexUnit,setCodexScroll,setCurrentStageIdx,setCurrentStage,
  startStage,setSelectedDeck,setDeckPickStage,setDeckPickScroll,setSpellPickStage,setSpellPickScroll,setPerkPickScroll,
  saveSave,setSelectedSpells,resultButtonRects:arena_resultButtonRects,
  unlockPerk:arena_unlockPerk,togglePerk:arena_togglePerk,claimDoubleBeansReward:arena_claimDoubleBeansReward,claimSecondChanceRetry:arena_claimSecondChanceRetry,
  levelUpSound:()=>SFX.levelUp(),toggleSound:()=>{_sfxMuted=!_sfxMuted;_initAudio();_resumeAudio();},
  handlePickerClick:arena_handlePickerClick,handleManagePanelClick:arena_handleManagePanelClick,
  handleSpellButton:arena_handleSpellButton,castAbilityAt:castAbility,
  activateBloodlust:arena_activateBloodlust,activateTranquility:arena_activateTranquility,addGold,showFlash,
  xyToCell,screenToWorldPoint:p=>arena_screenToWorldPoint(p.x,p.y),toggleArenaViewMode:arena_toggleViewMode,deployVodka,upgradeBtnRect,tryUpgradeUnit,cardRowLayout,deployUnit,setSelectedCard,
  scrollMaxForTarget:arena_scrollMaxForTarget,scrollValueForTarget:arena_scrollValueForTarget,setScrollValueForTarget:arena_setScrollValueForTarget,
  touchStartY:()=>touchStartY,setTouchStartY:value=>{touchStartY=value;},touchAccumY:()=>_touchAccumY,setTouchAccumY:value=>{_touchAccumY=value;}
});
canvas.addEventListener('click',e=>{
  try{
    arenaInputHandlers.handleClickPoint(getCanvasXY(e));
  }catch(err){
    ctx.fillStyle='#ff0000';ctx.fillRect(0,0,W,80);
    ctx.fillStyle='#fff';ctx.font='bold 14px monospace';ctx.textAlign='left';
    ctx.fillText('CLICK CRASH: '+err.message,10,20);
    ctx.fillText('at: '+(err.stack||'').split('\n')[1]||'',10,40);
    console.error('CLICK CRASH:',err);
  }
});
canvas.addEventListener('wheel',e=>arenaInputHandlers.handleWheel(e),{passive:false});
canvas.addEventListener('touchstart',e=>arenaInputHandlers.handleTouchStart(e),{passive:true});
canvas.addEventListener('touchmove',e=>arenaInputHandlers.handleTouchMove(e),{passive:true});

installArenaPlaytestHook({
  view:()=>({state,arena,width:W,height:H,gold,maxUnitLevel:ARENA_MAX_UNIT_LEVEL}),
  grid:()=>({x:gridX,y:GRID_Y,w:gridW,cellW,cellH:CELL_H,cols:GRID_COLS,rows:GRID_ROWS}),
  stageCount:()=>STAGES.length,
  setGold,
  setCurrentStageIdx,
  setCurrentStage:idx=>setCurrentStage(STAGES[idx]),
  startStage,
  cellCenter:cellCenterScreen
});

// =====================
// MAIN LOOP
// =====================
function update(){
  return combatUpdateRuntime.update();
}
const battleSceneRuntime=createBattleSceneRuntime({
  ctx,
  view:()=>({state,codexOpen,arena,bossRef,screenShake,arenaTop:ARENA_TOP,arenaTopBase:ARENA_TOP_BASE,arenaBot:ARENA_BOT,width:W,height:H,playerCastle,frame,enemies,units,tickHz:GAME_TICK_HZ}),
  setArenaTop:value=>{ARENA_TOP=value;},
  randomRange:rnd,
  emitParticle:addP,
  dist,
  applyRenderQuality:arena_applyRenderQuality,
  recomputeGrid,
  drawMenu,drawFlash,drawCodex,drawStageSelect,drawStageBrief,drawDeckPick,drawSpellPick,drawPerkPick,
  drawArena,drawWeather,drawGroundFx,arena_drawGrid,drawCastle,drawDummy,arena_specHalo,arena_isCapstoneLevel,
  drawUnit,drawUnitOverlays,drawBeamFx,drawProjectiles,drawBombs,drawParticles,drawDmgNums,arena_drawHud,
  drawSigBanner,drawWinScreen,drawLoseScreen
});
function render(){return battleSceneRuntime.render()}

// Fixed-timestep accumulator: update() runs at GAME_TICK_HZ on every device.
// Speeds were tuned originally on a 144 Hz dev machine Ã¢â‚¬â€ 60 Hz felt sluggish,
// so we tick at 120 Hz which is close to the original PC feel and still fine
// on mobile (60 fps render simply runs 2 logic ticks per frame).
// To globally speed up / slow down the whole game, just change GAME_TICK_HZ.

let _lastFrameT=0;
let _accumMs=0;
const _STEP_MS=1000/GAME_TICK_HZ;
function loop(now){
  try{
  if(!_lastFrameT)_lastFrameT=now||performance.now();
  const t=now||performance.now();
  let dt=t-_lastFrameT;
  _lastFrameT=t;
  if(dt>250)dt=250; // tab unfocus / mobile background Ã¢â‚¬â€ don't catch up
  _accumMs+=dt;
  let steps=0;
  while(_accumMs>=_STEP_MS&&steps<8){update();_accumMs-=_STEP_MS;steps++}
  if(steps>=8)_accumMs=0; // bail out of any leftover backlog
  render();
  }catch(err){
    ctx.fillStyle='#ff0000';ctx.fillRect(0,0,W,80);
    ctx.fillStyle='#fff';ctx.font='bold 14px monospace';ctx.textAlign='left';
    ctx.fillText('CRASH: '+err.message,10,20);
    ctx.fillText('at: '+(err.stack||'').split('\n')[1]||'',10,40);
    ctx.fillText('frame='+frame+' state='+state+' phase='+(arena?arena.phase:'?'),10,60);
    console.error('GAME LOOP CRASH:',err);
  }
  requestAnimationFrame(loop);
}

// =====================
// PHASE 2: STAGE INIT / CASTLES / WAVES
// =====================
// arena STAGE INIT (Legion TD) Ã¢â‚¬â€ squad persists across rounds within a stage.
// Each campaign stage is 6 rounds (5 setup + boss/elite). Build phase opens, player places
// units on the grid, START WAVE button (or timer expiry) launches the wave.
function startStage(idx){
  startStageRun({
    stages:STAGES,
    transientBattleArrays:STAGE_TRANSIENT_BATTLE_ARRAYS,
    buildFirstSeconds:ARENA_BUILD_FIRST,
    selectedDeck:()=>selectedDeck,
    availableUnitIndices:()=>PLAYER_UNITS.map((_,idx)=>idx),
    selectedSpells:()=>selectedSpells,
    arenaState:()=>arena,
    width:()=>W,
    arenaBottom:()=>ARENA_BOT,
    setCurrentStageIdx,
    setCardHand,
    setAbilityCooldowns:value=>{abilityCooldowns=value;squadState.abilityCooldowns=value;return abilityCooldowns},
    setAbilityUsed,
    setAbilityTargeting,
    setCurrentStage,
    resetStageStats:arena_statsResetStage,
    clearBattleArrays,
    setVodkaUnit,
    setVodkaDead,
    setVodkaDeployCD,
    createStageRunSetup,
    stageStarRule:arena_stageStarRule,
    setPlayerCastle,
    setEnemyCastle,
    setCrystalNodes,
    setTowers,
    setBossRef,
    setBossSpawned,
    initWeather,
    resetArenaDecor,
    perkEffects:arena_perkEffects,
    setGold,
    setStageGold,
    rollStageRift:arena_rollStageRift,
    respawnSquad:arena_respawnSquad,
    setStageOver,
    setStageWon,
    startBuild:arena_startBuild,
    buildWavePreview:arena_buildWavePreview,
    showFlash,
    setScreen
  },idx);
}
function enemyCastleName(act){return ['','Bug Hive','Bazaar Fortress','Pharaoh\'s Tomb','Frost Spire','Demon Throne'][act]||'Enemy'}
// arena helpers Ã¢â‚¬â€ placement / squad / round flow.
function arena_respawnSquad(){
  respawnSquadFromCells({
    arenaState:arena,
    units,
    frame,
    tickHz:GAME_TICK_HZ,
    statsForCell:c=>(c.unitIdx===99)?getStats(VODKA,c.level||1):getStats(PLAYER_UNITS[c.unitIdx],c.level||1),
    centerForCell:c=>({x:cellCenterX(c.col),y:cellCenterY(c.row)}),
    lerpColor,
    applyPassives:arena_applyPassives,
    applyMoveSpeedTuning:arena_applyPlayerMoveSpeedTuning,
    spawnBuildMinions:()=>arena_spawnSquadMinions()
  });
}
// Spawn squad-attached minions/pets for build preview and wave combat.
// Build refresh clears old pets. Wave start preserves existing preview pets and
// only fills missing ones, avoiding transition-frame pet loss.
function arena_spawnSquadMinions(preserveExisting){
  spawnSquadAttachedMinions({
    cells:arena.cells,
    units,
    preserveExisting,
    tickHz:GAME_TICK_HZ,
    spawnMinion,
    spawnFelfelMirror:arena_spawnFelfelMirror,
    nerfMinion,
    emitParticle:addP
  });
}
function arena_startBuild(seconds){
  startBuildPhase({
    arena,
    seconds,
    tickHz:GAME_TICK_HZ,
    enemies,
    setBossRef,
    setBossSpawned,
    respawnSquad:arena_respawnSquad
  });
}
// =====================================================================
// arena THEMED WAVE SYSTEM
// =====================================================================
// 8 themes rotate per-stage so different stages get different round-1/2/3/4
// compositions instead of every stage being SWARM/TANK/RANGED/MIXED. The
// rotation is deterministic: themeIdx = (stageNum - 1 + (round - 1)) % 8.
//
//   SWARM_RUSH       : many fast small swarmers + 1 backbone
//   TANK_WALL        : 1 frontline tank + dps escorts
//   RANGED_KITE      : ranged enemies + 1 caster + 1 escort (anti-positioning)
//   MIXED_PUSH       : one of each archetype + extras
//   AOE_BARRAGE      : 2-3 AoE smashers + 1 escort (forces spread formation)
//   BACKLINE_STRIKE  : 1-2 infiltrators that bypass tanks + 2-3 escort
//   CASTER_COVEN     : 2-3 casters + 1 ranged + 1 tank (CC-heavy)
//   ELITE_PAIR       : 2 tanks + 2-3 dps (heavy push wave)

function arena_tryApplyWaveMechanic(e,tmpl){
  if(!arena||!arena.waveMechanic||!e||e.isBoss||e.isElite||e.isBarrier)return;
  const type=arena.waveMechanic.type;
  const stageN=(currentStage&&currentStage.n)||1;
  const roundN=(arena&&arena.round)||1;
  const assigned=arena.waveMechanicAssignedCount||(arena.waveMechanicAssigned?1:0);
  const limit=arena_waveMechanicLimit(stageN,roundN,type);
  if(assigned>=limit)return;
  const lateSupport=stageN>=11;
  e.waveMechanic=type;
  e.name=(ARENA_WAVE_MECHANIC_LABELS[type]||'Special')+' '+(e.name||tmpl.name||'Enemy');
  e.points=Math.round((e.points||tmpl.points||10)*1.15);
  const setHpMult=m=>{e.maxHp=Math.max(1,Math.round(e.maxHp*m));e.hp=e.maxHp;};
  if(type==='shield'){
    e._shieldCarrier={r:130,shieldPct:lateSupport?0.08:0.06,tick:0};
    setHpMult(lateSupport?1.05:0.85);
  }else if(type==='banner'){
    e._bannerBearer={r:145,tick:0};
    e.dmg=Math.max(1,Math.round(e.dmg*0.75));
    setHpMult(lateSupport?0.95:0.75);
  }else if(type==='medic'){
    e._medicBug={r:150,cd:45,every:lateSupport?Math.round(1.7*GAME_TICK_HZ):2*GAME_TICK_HZ,healPct:lateSupport?0.06:0.045};
    e.dmg=Math.max(1,Math.round(e.dmg*0.50));
    setHpMult(lateSupport?1.00:0.70);
  }else if(type==='ritual'){
    e._ritualCaster={r:155,t:4*GAME_TICK_HZ,done:false};
    e.speed=(e.speed||0.25)*0.85;
    setHpMult(lateSupport?0.95:0.80);
  }else if(type==='exploding'){
    e._explodingSwarm={r:70,dmgMult:0.35};
    e.dmg=Math.max(1,Math.round(e.dmg*0.80));
    setHpMult(0.75);
  }else if(type==='sniper'){
    e._sniperWindup={charge:0,chargeMax:70,shotMult:1.35};
    e.range=Math.max(e.range||40,185);
    e.projType=e.projType||'normal';
    e.dmg=Math.max(1,Math.round(e.dmg*0.85));
    e.atkSpd=Math.max(e.atkSpd||90,105);
    setHpMult(0.85);
  }
  arena.waveMechanicAssignedCount=assigned+1;
  arena.waveMechanicAssigned=arena.waveMechanicAssignedCount>=limit;
  addDmg(e.x,e.y-e.size,(ARENA_WAVE_MECHANIC_LABELS[type]||'SPECIAL').toUpperCase(),'#ffd700',{sz:13,bold:true});
  addP(e.x,e.y,'#ffd700',18,4);
  groundFx.push({x:e.x,y:e.y,r:0,maxR:50,life:0.45,color:'#ffd700'});
}
function arena_enemyAttackCd(e){
  let cd=e&&e.atkSpd?e.atkSpd:60;
  if(e&&e._bannerHasteTimer>0)cd=Math.max(20,Math.round(cd*0.90));
  if(e&&e._ritualBuffTimer>0)cd=Math.max(20,Math.round(cd*0.92));
  return cd;
}
function arena_updateEnemyMechanics(e){
  if(!e)return;
  if(e._enemyShieldTimer>0){e._enemyShieldTimer--;if(e._enemyShieldTimer<=0)e._enemyShield=0;}
  if(e._bannerHasteTimer>0)e._bannerHasteTimer--;
  if(e._ritualBuffTimer>0)e._ritualBuffTimer--;
  const inArena=state==='battle'&&arena&&arena.phase;
  if(!inArena||e.isBoss||e.isBarrier||e.hp<=0)return;
  if(e._shieldCarrier){
    e._shieldCarrier.tick=(e._shieldCarrier.tick||0)-1;
    if(e._shieldCarrier.tick<=0){
      e._shieldCarrier.tick=24;
      const r=e._shieldCarrier.r||130,pct=e._shieldCarrier.shieldPct||0.06;
      for(const a of enemies){
        if(a===e||a.hp<=0||a.isBoss||a.isBarrier)continue;
        if(dist(e,a)>r)continue;
        const cap=Math.max(8,Math.round((a.maxHp||50)*pct));
        a._enemyShield=Math.min(cap,Math.max(a._enemyShield||0,cap));
        a._enemyShieldTimer=50;
        if(frame%24===0)addP(a.x,a.y,'#44aaff',2,2);
      }
      if(frame%48===0)groundFx.push({x:e.x,y:e.y,r:0,maxR:r,life:0.35,color:'#44aaff'});
    }
  }
  if(e._bannerBearer){
    e._bannerBearer.tick=(e._bannerBearer.tick||0)-1;
    if(e._bannerBearer.tick<=0){
      e._bannerBearer.tick=24;
      const r=e._bannerBearer.r||145;
      for(const a of enemies){
        if(a===e||a.hp<=0||a.isBoss||a.isBarrier)continue;
        if(dist(e,a)>r)continue;
        a._bannerHasteTimer=36;
        if(frame%30===0)addP(a.x,a.y,'#ffcc44',1,2);
      }
      if(frame%60===0)addDmg(e.x,e.y-e.size-8,'BANNER','#ffcc44',{sz:11,bold:true});
    }
  }
  if(e._medicBug){
    e._medicBug.cd--;
    if(e._medicBug.cd<=0){
      e._medicBug.cd=e._medicBug.every||2*GAME_TICK_HZ;
      let low=null,lp=1;
      for(const a of enemies){
        if(a.hp<=0||a.isBoss||a.isBarrier)continue;
        if(dist(e,a)>(e._medicBug.r||150))continue;
        const pct=a.hp/Math.max(1,a.maxHp);
        if(pct<lp){lp=pct;low=a}
      }
      if(low&&lp<0.98){
        const heal=Math.max(5,Math.round((low.maxHp||50)*(e._medicBug.healPct||0.045)));
        low.hp=Math.min(low.maxHp,low.hp+heal);
        addDmg(low.x,low.y-low.size,'+'+heal,'#44ff88',{sz:12,bold:true});
        addP(low.x,low.y,'#44ff88',10,3);
        beamFx.push({x1:e.x,y1:e.y-e.size*0.4,x2:low.x,y2:low.y-low.size*0.2,life:0.28,maxLife:0.28,color:'#44ff88',width:2,straight:false});
      }
    }
  }
  if(e._ritualCaster&&!e._ritualCaster.done){
    e._ritualCaster.t--;
    if(frame%20===0){
      const r=e._ritualCaster.r||155;
      groundFx.push({x:e.x,y:e.y,r:0,maxR:r,life:0.22,color:'#aa66ff'});
      addP(e.x+rnd(-20,20),e.y+rnd(-12,12),'#aa66ff',2,2);
    }
    if(frame%60===0)addDmg(e.x,e.y-e.size-8,'CHANNEL','#aa66ff',{sz:11,bold:true});
    if(e._ritualCaster.t<=0){
      e._ritualCaster.done=true;
      const r=e._ritualCaster.r||155;
      for(const a of enemies){
        if(a.hp<=0||a.isBoss||a.isBarrier)continue;
        if(dist(e,a)<=r){a._ritualBuffTimer=8*GAME_TICK_HZ;addP(a.x,a.y,'#aa66ff',8,3)}
      }
      groundFx.push({x:e.x,y:e.y,r:0,maxR:r,life:0.65,color:'#aa66ff'});
      addDmg(e.x,e.y-e.size-8,'RITUAL BUFF','#aa66ff',{sz:13,bold:true});
      screenShake=Math.max(screenShake,3);
    }
  }
}
// =====================================================================
// BACKLINE PRESSURE Ã¢â‚¬â€ every ranged/caster enemy gets a Snipe proc that
// bypasses tank/taunt every Nth basic attack and targets the nearest
// non-tank player unit. Casters additionally fire a Chain Bolt every 9s
// Ã¢â‚¬â€ magic chain-lightning, 3 jumps, 50% basic dmg per hit. Together
// these force the player to bring sustain (healer) for back-line units.
// Auto-applied so each enemy entry stays clean.
// =====================================================================
(function arena_initBacklinePressure(){
  for(const e of ENEMIES){
    if(e.projType && e.range>=120){
      e.snipesBackline=true;
      e.snipeCD=900;            // ~15s between snipes; back-line pressure should be readable, not constant
    }
    if(e.arch==='caster'){
      e.chainBoltCD=600;        // 10s; chain is positional pressure, not a back-line delete
      e.chainBoltDmgMult=0.14;  // 14% basic dmg per chain hit
    }
  }
})();
function arena_buildWavePreview(){
  const s=currentStage;
  const _total=arena_currentStageRounds();
  const isBoss=arena.round>=_total;
  if(isBoss){
    if(s.bossId!=null){
      const _bt=BOSSES[s.bossId];
      const _label=_bt&&_bt.hasBarrier?'BARRIER FIGHT':_bt&&_bt.isAerial?'AERIAL BOSS':'BOSS';
      arena.wavePreview=_label+' Ã¢â‚¬â€ '+(_bt?.name||'?');
    }else if(s.eliteEnemyId!=null){
      arena.wavePreview='FINAL WAVE Ã¢â‚¬â€ '+(ENEMIES[s.eliteEnemyId]?.name||'?');
    }else{
      arena.wavePreview='FINAL WAVE';
    }
  }else{
    // Round 1 uses the stage table's intended opener identity. Later rounds
    // keep the themed-wave system for variety and counter-pressure.
    const w=(arena.round===1?arena_stageOpenerQueue(s):null)||arena_themedWaveQueue(arena.round,s.n||1,s.act||1);
    arena.wavePreview=w.theme+' Ã¢â‚¬â€ '+w.previewName;
    const _wm=arena_pickWaveMechanic(s.n||1,arena.round||1,false);
    if(_wm)arena.wavePreview+='  +  '+_wm.label;
    arena._nextWaveQueue=w.queue;
    arena._nextWaveTheme=w.theme;
    arena._waveGoldMult=w.goldMult||1;
    arena._nextWaveMiniBoss=((s.n||0)===10&&arena.round===4)?13:null;
    if(arena._nextWaveMiniBoss!=null)arena.wavePreview='MINI BOSS Ã¢â‚¬â€ Ember Crow Prince + '+arena.wavePreview;
  }
  // Build a structured threats summary for the threats panel (separate from
  // the one-line wavePreview text). Drives the icon chips shown during build
  // phase so the player sees armor types / movement archetypes at a glance.
  arena.waveThreats=buildWaveThreats({
    round:arena.round,
    total:_total,
    isBoss,
    stage:s,
    queue:arena._nextWaveQueue||[],
    theme:arena._nextWaveTheme||'',
    miniBossId:arena._nextWaveMiniBoss
  });
}
// Threat-tag color palette (Apple-style Ã¢â‚¬â€ deep saturation, used as accent only).

function arena_threatTagColor(tag){return ARENA_THREAT_TAG_COLOR[tag]||'#9aa3b2'}
function arena_threatPanelHeight(t){
  return threatPanelHeight(t);
}
function arena_drawThreatsPanel(){
  return drawThreatPreviewPanel(ctx,{
    width:W,
    phase:arena.phase,
    threat:arena.waveThreats,
    gold,
    frame,
    buildTimer:arena.buildTimer,
    buildTimerMax:arena.buildTimerMax,
    tagColors:ARENA_THREAT_TAG_COLOR
  });
}
// Helper - convert hex color to rgba with alpha. Falls through if input is rgba already.
function arena_rgba(hex,a){
  if(!hex)return 'rgba(154,163,178,'+a+')';
  if(hex.startsWith('rgba'))return hex;
  let h=hex.replace('#','');
  if(h.length===3)h=h.split('').map(c=>c+c).join('');
  const r=parseInt(h.substring(0,2),16),g=parseInt(h.substring(2,4),16),b=parseInt(h.substring(4,6),16);
  return 'rgba('+r+','+g+','+b+','+a+')';
}
function arena_configureWaveSpawning(){
  configureWaveSpawningState(arena,currentStage);
}
function arena_spawnQueuedEnemy(next){
  if(next==='BOSS')spawnBossForStage();
  else if(typeof next==='object'&&next.delay!=null)return;
  else if(typeof next==='object'&&next.boss!=null)spawnBossById(next.boss,{label:next.label,color:next.color});
  else if(typeof next==='object'&&next.elite!=null)spawnEliteEnemy(next.elite);
  else spawnEnemyByIdx(next);
}
function arena_spawnNextEnemyBatch(){
  spawnNextEnemyBatchState(arena,arena_spawnQueuedEnemy);
}
function arena_isCampaignBossRound(){
  return state==='battle'&&arena&&arena.phase==='wave'&&currentStage&&
    currentStage.bossId!=null&&(arena.round||1)>=arena_currentStageRounds();
}
function arena_bossSupportName(b,tmpl){
  if(b&&b.bossMinionName)return b.bossMinionName;
  const root=(b&&b.name?b.name.split(' ')[0]:'Boss')||'Boss';
  const role=(tmpl&&tmpl.arch==='swarm')?'Spawn':(tmpl&&tmpl.arch==='ranged')?'Stinger':'Minion';
  return root+' '+role;
}
function arena_tuneBossSupportMinion(e,b,tmpl,i,count){
  if(!e||!b||!arena_isCampaignBossRound())return;
  const hpMult=b.bossMinionHpMult||0.46;
  const dmgMult=b.bossMinionDmgMult||0.54;
  const ptsMult=b.bossMinionPointsMult||0.40;
  e.bossSupport=true;
  e.name=arena_bossSupportName(b,tmpl);
  e.maxHp=Math.max(40,Math.round((e.maxHp||e.hp||80)*hpMult));
  e.hp=e.maxHp;
  e.dmg=Math.max(4,Math.round((e.dmg||8)*dmgMult));
  e.points=Math.max(1,Math.round((e.points||tmpl&&tmpl.points||10)*ptsMult));
  e.size=Math.max(12,Math.round((e.size||18)*0.88));
  e.entryHold=Math.max(e.entryHold||0,18);
  const n=Math.max(1,count||1);
  const off=(i-(n-1)/2)*38+rnd(-10,10);
  e.x=clamp((b.x||W/2)+off,ARENA_L+e.size,ARENA_R-e.size);
  e.y=clamp((b.y||ARENA_TOP+110)+42+rnd(-8,12),ARENA_TOP+50,ARENA_BOT-90);
  addP(e.x,e.y,b.color||'#ffaa00',12,3);
  beamFx.push({x1:b.x,y1:b.y,x2:e.x,y2:e.y,life:0.18,maxLife:0.18,color:b.color||'#ffaa00',width:2,straight:false});
}
function arena_startWave(){
  startWavePhase({
    arena,
    units,
    stage:currentStage,
    totalRounds:arena_currentStageRounds(),
    startRoundStats:arena_statsStartRound,
    spawnSquadMinions:arena_spawnSquadMinions,
    configureWaveSpawning:arena_configureWaveSpawning,
    showFlash,
    playWaveStart:()=>SFX.waveStart()
  });
}
function arena_endWave(won){
  completeWavePhase({
    arena,
    won,
    gold,
    stageN:(currentStage&&currentStage.n)||1,
    totalRounds:arena_currentStageRounds(),
    stageIncome:arena_stageIncome,
    roundGoldMult:arena_roundGoldMult,
    interestCap:ARENA_INTEREST_CAP,
    interestRate:ARENA_INTEREST_RATE,
    buildNext:ARENA_BUILD_NEXT,
    buildBoss:ARENA_BUILD_BOSS,
    finishRoundStats:arena_statsFinishRound,
    setGold,
    showFlash,
    endStage,
    buildWavePreview:arena_buildWavePreview,
    startBuild:arena_startBuild
  });
}

// =====================================================================
// MAGICAL RIFT Ã¢â‚¬â€ pre-rolled stage event (single check at stage start)
// =====================================================================
// At startStage we roll once: does this stage get a rift? If yes, we also
// pick which eligible round (4 or 5) it'll appear in. During that round,
// the rift fires deterministically once enemies have been engaging for
// ARENA_RIFT_TRIGGER_MIN_FRAMES Ã¢â‚¬â€ no random per-second rolls.
// A runic circle telegraphs at a random arena spot for ~8s, then disgorges
// "rift-touched" enemies (1.3Ãƒâ€” HP, 1.5Ãƒâ€” dmg vs the act's normal pool).
// Kills drop bonus gold so the encounter pays for itself.
const arenaRiftRuntime=createRiftRuntime({
  view:()=>({
    arena,
    width:W,
    arenaTop:ARENA_TOP,
    deployTop:DEPLOY_TOP,
    arenaLeft:ARENA_L,
    arenaRight:ARENA_R,
    currentStage,
    currentStageIdx,
    enemies,
    enemiesData:ENEMIES,
    units,
    groundFx,
    stageHpMult:STAGE_HP_MULT,
    stageDmgMult:STAGE_DMG_MULT,
    hpMultEnemy:HP_MULT_ENEMY,
    unitSizeScale:ARENA_UNIT_SIZE_SCALE
  }),
  randomRange:rnd,
  distance:dist,
  emitParticle:addP,
  showFlash,
  shake:value=>{screenShake=Math.max(screenShake,value);}
});
function arena_rollStageRift(){return arenaRiftRuntime.rollStageRift()}
function arena_tryTriggerRift(){return arenaRiftRuntime.tryTriggerRift()}
function arena_spawnRiftMinions(){return arenaRiftRuntime.spawnRiftMinions()}
// =====================================================================
// arena PASSIVE SYSTEM
// =====================================================================
// Each unit has 2 passives. P1 active from L1, P2 unlocks at L3, both
// scale per level and get a final boost at L5.

// =====================================================================
// arena CLASS BRANCHES Ã¢â‚¬â€ at L2Ã¢â€ â€™L3 the player picks one of two veggie variants
// (or stays on the base path). Branch overrides p1/p2 from L3 onward and
// optionally re-tints the sprite + applies stat-mod multipliers. Theme is
// kept Arabic-veggie (Filfil Akhdar = green chili, Filfil Aswad = black pepper).
// Once chosen, the branch is locked for that cell until sold.
// =====================================================================

// =====================================================================
// arena SIGNATURE ABILITIES Ã¢â‚¬â€ auto-fired actives unlocked at L3.
// Each branch (and the base path) gets ONE signature so no path is "dead."
// CDs scale 15-60s by power; L5 reduces CD by 22%. Auto-fire when ready.
// =====================================================================
const ARENA_SIGNATURES=createArenaSignatures({
  gameTickHz:GAME_TICK_HZ,
  arena,
  SFX,
  getBattleArray:key=>battleState[key],
  getFrame:()=>frame,
  getArenaBounds:()=>({top:ARENA_TOP,bottom:ARENA_BOT,left:ARENA_L,right:ARENA_R}),
  addDamageText:addDmg,
  addHealFx,
  emitParticle:addP,
  showFlash,
  dealDamage,
  randomRange:rnd,
  distance:dist,
  applyTrackedHeal:arena_applyTrackedHeal,
  findLowestAlly:arena_findLowestAlly,
  beaconSplash:arena_beaconSplash,
  addBatataShield:arena_addBatataShield,
  addGoldShield:arena_addGoldShield,
  addTaoonBloodShield:arena_addTaoonBloodShield,
  addZavsLineShield:arena_addZavsLineShield,
  applyHealingReceived:arena_applyHealingReceived,
  applyMuddied:arena_applyMuddied,
  clampToLeash:arena_clampToLeash,
  findBestEnemyClusterPoint:arena_findBestEnemyClusterPoint,
  fireDivineStorm:arena_fireDivineStorm,
  jazarGuard:arena_jazarGuard,
  jazarSignatureSurge:arena_jazarSignatureSurge,
  moonkinControlBurst:arena_moonkinControlBurst,
  spawnTreant:arena_spawnTreant,
  updateUnit:arena_updateUnit,
  shake:value=>{screenShake=Math.max(screenShake,value);}
});

function arena_applyPassives(u,unitIdx,lv){
  const result=applyUnitPassives(u,unitIdx,lv,{gameTickHz:GAME_TICK_HZ,signatures:ARENA_SIGNATURES});
  const effects=arena_perkEffects();
  if(u&&u.isPlayer&&!u._perkTuned){
    if(u.arch==='tank'&&effects.tankHpMult){
      const oldMax=u.maxHp||u.hp||1;
      u.maxHp=Math.max(1,Math.round(oldMax*(1+effects.tankHpMult)));
      u.hp=Math.min(u.maxHp,Math.round((u.hp||oldMax)*(u.maxHp/oldMax)));
    }
    if((u.arch==='melee'||u.arch==='ranged'||u.arch==='paladin'||u.arch==='caster')&&effects.dpsDamageMult){
      u.dmg=Math.max(1,Math.round((u.dmg||1)*(1+effects.dpsDamageMult)));
    }
    u._perkTuned=true;
  }
  return result;
}
function arena_setPassive(u,id,sc,boost){
  return applyPassiveToUnit(u,id,sc,boost,{gameTickHz:GAME_TICK_HZ});
}
function arena_allyDmgMult(u){
  return calculateAllyDamageMultiplier(u,{units,zavsAllyDamageMultiplier:arena_zavsAllyDmgMult});
}
function arena_beaconSplash(healer,target,healAmt){
  applyBeaconSplash(healer,target,healAmt,{units,projectiles,applyTrackedHeal:arena_applyTrackedHeal});
}
function arena_findLowestAlly(u,maxRange,skip){
  return findLowestAlly(u,maxRange,skip,{units});
}
function arena_healerTriageTick(u){
  tickHealerTriage(u,{arena,units,frame,projectiles,applyTrackedHeal:arena_applyTrackedHeal,drainHealToBarrier:arena_drainHealToBarrier,addDamageText:addDmg});
}
// Naana L5 emergency heal: prefer tanks below threshold, then lowest-HP unit
// below threshold. Used by 'Lay on Hands' style full-heal proc.
function arena_findEmergencyTarget(u,maxRange,threshold){
  return findEmergencyTarget(u,maxRange,threshold,{units});
}
// Charmed-enemy override (Zaatar L5 Mind Control). A charmed enemy targets
// non-charmed enemies and attacks them with its native dmg/range/atkSpd. The
// charm timer is ticked elsewhere; this runs each tick during the charm.
function arena_updateCharmedEnemy(e){
  updateCharmedEnemy(e,{enemies,dealDamage,emitParticle:addP});
}
// Spawn a Felfel mirror Ã¢â‚¬â€ same dmg + Shadow Strike, 60% HP. Mirror is flagged
// `isMirror` so it cannot create another mirror (no recursion). One per Felfel.
function arena_spawnFelfelMirror(parent,lv){
  spawnFelfelMirror(parent,lv,{units,randomRange:rnd,setPassive:arena_setPassive,isCapstoneLevel:arena_isCapstoneLevel,emitParticle:addP,groundEffects:groundFx,addDamageText:addDmg});
}

// Spawn a kamikaze Ghost from a fallen Rumman (P2 L3). The ghost is
// untargetable, races to the nearest enemy and explodes on contact.
function arena_spawnGhost(src){
  spawnGhost(src,{units,emitParticle:addP,addDamageText:addDmg,showFlash});
}

// arena per-unit update with passive proc system.
const unitUpdateRuntime=createUnitUpdateRuntime({
  tickHz:GAME_TICK_HZ,
  abilities:ABILITIES,
  sound:SFX,
  view:()=>{
    const lane=arena_laneBounds();
    return {arena,units,enemies,projectiles,bombs,groundFx,beamFx,frame,arenaLeft:lane.left,arenaRight:lane.right,arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT};
  },
  randomRange:rnd,
  emitParticle:addP,
  addDamageText:addDmg,
  addHealEffect:addHealFx,
  shake:value=>{screenShake=Math.max(screenShake,value);},
  updateGhostUnit,
  moveToward,
  dealDamage,
  tickUnitUpkeep,
  tickUnitEarlyActions,
  tickUnitStatusTimers,
  tickUnitMeteorAndSignature,
  setSignatureBanner,
  tickUnitWarlockPassives,
  tickUnitHunterPassives,
  tickUnitRummanPassives,
  tickUnitCompanionPassives,
  tickUnitBranchPassives,
  tickUnitPriestPassives,
  tickUnitZaytBakdounesPassives,
  tickUnitHabaqPassives,
  tickUnitSignatureBuffTimers,
  tickUnitActionTimers,
  tickUnitPlagueAndJazarPassives,
  tickUnitAlibabaPassives,
  tickUnitHealerAuraPassives,
  tickUnitSupportAndGapClosers,
  prepareUnitAttackTarget,
  prepareUnitAttack,
  applyEarlyOnHitProcs,
  applyZaytOnHitProcs,
  applyJazarOnHitProcs,
  applyAlibabaOnHitProcs,
  applyNaanaFoulFelfelOnHitProcs,
  applyJafaarOnHitProcs,
  applyZaatarOnHitProcs,
  dispatchUnitBasicAttack,
  applyCoreFamilyOnHitProcs,
  applyGenericOnHitProcs,
  applyRummanOnHitProcs,
  applyPostHitSupportProcs,
  clampToArena,
  arena_clampToLeash,
  arena_applyTrackedHeal,
  arena_taoonBloodTithe,
  arena_addTaoonBloodShield,
  arena_applyMuddied,
  arena_healerTriageTick,
  arena_addZavsLineShield,
  arena_applyHealingReceived,
  arena_findJafaarDrainTarget,
  arena_jafaarCurseWeight,
  arena_applyJafaarAgony,
  fireProjectile,
  findEnemyForUnit,
  findRangedEnemyForUnit,
  arena_findLowestAlly,
  arena_drainHealToBarrier,
  arena_beaconSplash,
  arena_addGoldShield,
  arena_isGripReserved,
  arena_isGapCloserReserved,
  arena_reserveGripTarget,
  arena_reserveGapCloserTarget,
  arena_grantGapInvulnerability,
  arena_jazarGuard,
  arena_jazarSignatureSurge,
  arena_findBestEnemyClusterPoint,
  arena_findUnreservedEnemyInRange,
  arena_followFamiliarAnchor,
  arena_isReachable,
  arena_allyDmgMult,
  arena_zavsAllyAtkSpdFactor,
  advanceSharedOnHitCounter,
  arena_moonkinControlBurst,
  arena_moonkinDisplaceEnemy,
  arena_fireDivineStorm,
  arena_applyFelfelDeadlyPoison,
  arena_findBasicSecondTarget,
  arena_basicSecondHitFor,
  arena_applyRuneWound,
  arena_isTaoonPriorityEnemy,
  arena_addBatataShield,
  arena_isBatataBacklineAlly,
  arena_isZavsMeleeAlly,
  lobBomb,
  arena_findEmergencyTarget,
  showFlash
});
function arena_updateUnit(u){return unitUpdateRuntime.updateUnit(u)}

function arena_canPlace(pick){
  return canPlaceArenaSquadUnit({pick,gold,arenaState:arena,roleRoot:arena_roleRoot});
}
function arena_placeUnit(cell,pick){
  const result=placeArenaSquadUnit({
    cell,pick,gold,
    arenaState:arena,
    roleRoot:arena_roleRoot,
    onStageChallengeUsage:arena_updateStageChallengeUsage,
    respawnSquad:arena_respawnSquad,
    sound:SFX
  });
  if(!result.ok)return false;
  setGold(result.gold);
  return true;
}
function arena_upgradeCell(cell,branchPick,pathPick){
  const result=upgradeArenaSquadCell({
    cell,
    branchPick,
    pathPick,
    gold,
    arenaState:arena,
    pathById:arena_pathById,
    applyRolePathToCell:arena_applyRolePathToCell,
    respawnSquad:arena_respawnSquad,
    effects:{
      particles,
      groundEffects:groundFx,
      randomRange:rnd,
      emitParticle:addP,
      addDamageText:addDmg,
      addHealEffect:addHealFx,
      showFlash,
      sound:SFX,
      shake:value=>{screenShake=Math.max(screenShake,value);}
    }
  });
  if(!result.ok)return false;
  setGold(result.gold);
  return true;
}
function arena_sellCell(cell){
  const result=sellArenaSquadCell({cell,gold,arenaState:arena,roleRoot:arena_roleRoot});
  if(!result.ok)return false;
  setGold(result.gold);
  return true;
}
function spawnEnemyByIdx(typeIdx){
  return stageFlowRuntime.spawnEnemyByIdx(typeIdx);
}
function spawnBossById(bossId,opts){
  return stageFlowRuntime.spawnBossById(bossId,opts);
}
function spawnBossForStage(){
  return stageFlowRuntime.spawnBossForStage();
}
// arena round update Ã¢â‚¬â€ replaces v5 continuous-spawn waves.
function updateWaves(){
  return stageFlowRuntime.updateWaves();
}
function spawnEliteEnemy(idx){
  return stageFlowRuntime.spawnEliteEnemy(idx);
}
function endStage(won){
  return stageFlowRuntime.endStage(won);
}

// =====================
// CASTLE / TOWER UPDATE
// =====================
// Castles are now first-class targets in findEnemyForUnit / enemy targeting,
// so combat AI handles the actual damage. Nothing extra needed here.
// Kept for compatibility / future buffs; currently a no-op hp guard.
function updateCastle(c){
  if(!c||c.hp<=0)return;
  // arena: king auto-attacks the nearest enemy in range. Acts as a last-stand
  // defender when the squad is thin. Range/dmg scale already set in startStage.
  if(!c.isKing)return;
  if(c.cd>0)c.cd--;
  let bestT=null,bestD=Infinity;
  for(const e of enemies){if(e.hp<=0)continue; const d=dist(c,e);if(d<bestD){bestD=d;bestT=e}}
  if(bestT&&bestD<=(c.range||200)&&c.cd<=0){
    c.cd=c.atkSpd||60;
    projectiles.push({x:c.x,y:c.y-20,tx:bestT.x,ty:bestT.y,target:bestT,dmg:c.dmg,
      speed:6,from:c,projType:'normal',color:'#ffd700'});
  }
}
function updateTower(t){
  if(t.hp<=0)return;
  if(t.cd>0)t.cd--;
  if(t.cd>0)return;
  let target=null,bestD=Infinity;
  for(const u of units){if(u.hp<=0)continue;const d=dist(t,u);if(d<t.range&&d<bestD){bestD=d;target=u}}
  if(target){
    fireProjectile(t,target,t.dmg,{projType:'normal'});
    t.cd=t.atkSpd;
  }
}
function updateCrystalNode(n){
  // Contestable: owner 0=neutral, 1=player, 2=enemy. Both sides chip the
  // node when in range with their attack ready. Flip happens at hp<=0;
  // hp resets to 300 so the other side has to grind it back to retake.
  // Player units chip when owner is neutral or enemy-held.
  if(n.owner!==1){
    for(const u of units){
      if(u.hp<=0)continue;
      if(dist(u,n)<u.range+n.size&&u.cd<=0){
        n.hp-=u.dmg*0.3;
        if(n.hp<=0){
          n.owner=1;n.hp=300;n.maxHp=300;n.produceT=0;
          showFlash('CRYSTAL NODE CAPTURED!','#9b59b6',60);
          addP(n.x,n.y,'#9b59b6',24,5);
          break;
        }
      }
    }
  }
  // Enemies chip when owner is neutral or player-held.
  if(n.hp>0&&n.owner!==2){
    for(const e of enemies){
      if(e.hp<=0)continue;
      if(dist(e,n)<(e.range||40)+n.size&&e.cd<=0){
        n.hp-=e.dmg*0.3;
        if(n.hp<=0){
          n.owner=2;n.hp=300;n.maxHp=300;n.produceT=0;
          showFlash('CRYSTAL NODE LOST!','#cc4444',60);
          addP(n.x,n.y,'#cc4444',24,5);
          break;
        }
      }
    }
  }
  // Player-held node produces 1 crystal every 1.5s.
  if(n.owner===1){
    n.produceT++;
    if(n.produceT>=1.5*GAME_TICK_HZ){n.produceT=0;addCrystal(1);addP(n.x,n.y,'#9b59b6',6,3)}
  }
}

// =====================
// BOSS AI
// =====================
function arena_bossMechanicsContext(){
  return {
    arena,
    units,
    enemies,
    bombs,
    groundFx,
    beamFx,
    frame,
    width:W,
    arenaTop:ARENA_TOP,
    arenaBottom:ARENA_BOT,
    dealDamage,
    addParticle:addP,
    addDamageText:addDmg,
    showFlash,
    fireProjectile,
    spawnEnemyByIndex:spawnEnemyByIdx,
    tuneBossSupportMinion:arena_tuneBossSupportMinion,
    clampToArena,
    SFX,
    shake:value=>{screenShake=Math.max(screenShake,value)}
  };
}
function arena_drainHealToBarrier(amount,srcUnit){
  return drainHealToBarrierFromBossMechanics(amount,srcUnit,arena_bossMechanicsContext());
}
function updateBoss(b){
  return updateBossMechanics(b,arena_bossMechanicsContext());
}
function arena_timedFieldEffectsContext(){
  return {
    arena,
    units,
    enemies,
    groundFx,
    beamFx,
    frame,
    dealDamage,
    addParticle:addP,
    addDamageText:addDmg,
    addHealFx,
    showFlash,
    shake:value=>{screenShake=Math.max(screenShake,value)}
  };
}

// =====================
// WEATHER SYSTEM
// =====================
function initWeather(w){
  weatherParticles=createWeatherParticles(w,W,H,rnd);
}
function drawWeather(){
  if(!currentStage)return;
  drawWeatherOverlay(ctx,{
    weather:currentStage.weather,
    width:W,
    height:H,
    arenaTop:ARENA_TOP,
    arenaBot:ARENA_BOT,
    particles:weatherParticles
  });
}

// =====================
// ARENA ABILITIES (spell casting)
// =====================
function castAbility(idx,tx,ty){
  const ab=ARENA_ABILITIES[selectedSpells[idx]];
  if(!ab)return false;
  const cost=ab.cost||0;
  if(abilityUsed[idx]||(arena.spellUsed&&arena.spellUsed[idx])){
    showFlash('SPELL ALREADY USED','#ffb0a6',70);
    setAbilityTargeting(-1);
    return false;
  }
  if(gold<cost){
    showFlash('NEED '+cost+'g','#ffb0a6',70);
    return false;
  }
  let autoTarget=null;
  if(ab.target==='auto'){
    let bestD=Infinity;
    for(const e of enemies){if(e.hp>0){const d=dist({x:W/2,y:ARENA_TOP+200},e);if(d<bestD){bestD=d;autoTarget=e}}}
    if(!autoTarget){
      showFlash('NO TARGET','#ffb0a6',60);
      return false;
    }
  }
  setGold(gold-cost);
  abilityUsed[idx]=true;
  if(!arena.spellUsed)arena.spellUsed=[];
  arena.spellUsed[idx]=true;
  setAbilityTargeting(-1);
  if(ab.target==='pos'){
    bombs.push({x:tx,y:ARENA_TOP-60,fromX:tx,fromY:ARENA_TOP-60,tx,ty,t:0,dur:50,
      dmg:ab.damage,radius:ab.radius,attacker:{isPlayer:true},isPlayer:true,color:ab.color,meteor:true});
  }else if(ab.target==='auto'){
    let best=autoTarget;
    if(best){
      dealDamage(best,ab.damage,{isPlayer:true},'normal');
      const around=enemies.filter(e=>e.hp>0&&e!==best&&dist(best,e)<120).slice(0,ab.chainCount);
      for(const e of around)dealDamage(e,ab.chainDmg,{isPlayer:true},'normal');
      addP(best.x,best.y,ab.color,24,5);screenShake=Math.max(screenShake,6);
    }
  }else if(ab.target==='self'){
    if(ab.healPct){for(const u of units){if(u.hp>0){u.hp=Math.min(u.maxHp,u.hp+u.maxHp*ab.healPct);addHealFx(u.x,u.y,u.maxHp*ab.healPct)}}}
    if(ab.slowMult){for(const e of enemies){e.slowTimer=ab.slowDur;e.slowMult=ab.slowMult}}
    if(ab.atkSpdBoost){for(const u of units){if(u.hp>0){u.atkSpdBuff=ab.atkSpdBoost;u.atkSpdBuffTimer=ab.duration}}}
    if(ab.crystalGain){addCrystal(ab.crystalGain);addP(W/2,H/2,'#9b59b6',24,5)}
  }
  showFlash(ab.name.toUpperCase()+'!',ab.color,40);
  return true;
}
function abilityNeedsTarget(idx){const ab=ARENA_ABILITIES[selectedSpells[idx]];return ab&&ab.target==='pos'}
function arena_canCastAbility(idx){
  const ab=ARENA_ABILITIES[selectedSpells[idx]];
  if(!ab)return false;
  if(abilityUsed[idx]||(arena.spellUsed&&arena.spellUsed[idx])){
    showFlash('SPELL ALREADY USED','#ffb0a6',70);
    return false;
  }
  const cost=ab.cost||0;
  if(gold<cost){
    showFlash('NEED '+cost+'g','#ffb0a6',70);
    return false;
  }
  return true;
}
function arena_handleSpellButton(idx){
  if(!arena_canCastAbility(idx))return false;
  if(abilityNeedsTarget(idx)){
    setAbilityTargeting(abilityTargeting===idx?-1:idx);
    showFlash(abilityTargeting===idx?'TAP TARGET SQUARE':'TARGETING CANCELLED','#ffd700',45);
    return true;
  }
  return castAbility(idx,W/2,ARENA_TOP+220);
}

// =====================
// BATTLE STRUCTURE RENDERING
// =====================
const battleStructuresRenderer=createBattleStructuresRenderer({
  ctx,
  view:()=>({width:W,frame,currentStage,playerCastle,enemyCastle,bossRef,units}),
  randomRange:rnd,
  emitParticle:addP,
  dist,
  drawWithClashCamera:arena_drawWithClashCamera
});
function arena_drawPlayerKeep(...args){return battleStructuresRenderer.drawPlayerKeep(...args)}
function drawCastle(...args){return battleStructuresRenderer.drawCastle(...args)}
function drawCastleRaw(...args){return battleStructuresRenderer.drawCastleRaw(...args)}
function drawTower(...args){return battleStructuresRenderer.drawTower(...args)}
function drawCrystalNode(...args){return battleStructuresRenderer.drawCrystalNode(...args)}
function drawCastleBanners(...args){return battleStructuresRenderer.drawCastleBanners(...args)}
function drawBigHpBar(...args){return battleStructuresRenderer.drawBigHpBar(...args)}
// =====================
// SCREEN FLOW
// =====================
function drawBigBtn(x,y,w,h,label,bg,subtitle){
  arenaButtonDrawers.drawBigBtn(x,y,w,h,label,bg,subtitle);
}
const screenFlowRenderer=createScreenFlowRenderer({
  ctx,
  playerUnits:PLAYER_UNITS,
  vodka:VODKA,
  stages:STAGES,
  abilities:ARENA_ABILITIES,
  perks:ARENA_PERKS,
  view:()=>({width:W,height:H,frame,maxStage,beans,stageStars,currentStage,currentStageIdx,arena,deckPickStage,selectedSpells,spellPickStage,deckPickScroll,spellPickScroll,perkPickScroll,unlockedPerks,selectedPerks}),
  stageSelectScroll:()=>stageSelectScroll,
  drawVodka,
  drawBigBtn,
  drawPillBtn,
  starText:arena_starText,
  stageStarCriteria:arena_stageStarCriteria,
  getUnitStats,
  wrapText,
  perkSlotCount,
  computeStageStars:arena_computeStageStars,
  resultButtonRects:arena_resultButtonRects,
  drawRoundCombatReport:arena_drawRoundCombatReport,
  drawStageCombatReport:arena_drawStageCombatReport,
  shake:value=>{screenShake=Math.max(screenShake,value);uiState.screenShake=screenShake;},
  levelUpSound:()=>SFX.levelUp()
});
function drawMenu(...args){return screenFlowRenderer.drawMenu(...args)}
function drawStageSelect(...args){return screenFlowRenderer.drawStageSelect(...args)}
function arena_drawStageStarPanel(...args){return screenFlowRenderer.drawStageStarPanel(...args)}
function arena_drawAnimatedStarResult(...args){return screenFlowRenderer.drawAnimatedStarResult(...args)}
function drawStageBrief(...args){return screenFlowRenderer.drawStageBrief(...args)}
function drawDeckPick(...args){return screenFlowRenderer.drawDeckPick(...args)}
function drawSpellPick(...args){return screenFlowRenderer.drawSpellPick(...args)}
function drawPerkPick(...args){return screenFlowRenderer.drawPerkPick(...args)}
function drawWinScreen(...args){return screenFlowRenderer.drawWinScreen(...args)}
function drawLoseScreen(...args){return screenFlowRenderer.drawLoseScreen(...args)}
const battleHudRuntime=createBattleHudRuntime({
  ctx,
  abilities:ARENA_ABILITIES,
  playerUnits:PLAYER_UNITS,
  vodka:VODKA,
  tickHz:GAME_TICK_HZ,
  bloodlustCost:ARENA_BLOODLUST_COST,
  tranquilityCost:ARENA_TRANQUILITY_COST,
  gridCols:GRID_COLS,
  gridRows:GRID_ROWS,
  gridX:()=>gridX,
  gridY:()=>GRID_Y,
  cellW:()=>cellW,
  cellH:()=>CELL_H,
  view:()=>({width:W,height:H,arenaTop:ARENA_TOP,arenaBot:ARENA_BOT,clashCamera:arenaSceneRenderer.clashCamera,arenaViewMode:arena_viewMode(),arena,currentStage,selectedSpells,abilityCooldowns,abilityUsed,abilityTargeting,bossWarning,stageStartTimer,frame,combatStats:v8CombatStats,gold,playerCastle,enemies,bossRef,soundMuted:_sfxMuted}),
  setBossWarning,
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
  getRoundCombatReport,
  getStageCombatReport,
  drawMobileBattleControls,
  drawBattleTopChrome,
  drawDesktopBattleControls,
  drawPauseMenu,
  threatPanelHeight:arena_threatPanelHeight,
  statsFormat:arena_statsFormat,
  currentStageRounds:arena_currentStageRounds,
  drawThreatsPanel:arena_drawThreatsPanel,
  drawPicker:arena_drawPicker,
  drawManagePanel:arena_drawManagePanel,
  isCapstoneLevel:arena_isCapstoneLevel,
  pathCamQuad:arena_pathCamQuad,
  camPoint:arena_camPoint,
  camDepthScaleAt:arena_camDepthScaleAt
});
function drawBattleHud(...args){return battleHudRuntime.drawBattleHud(...args)}
function arena_drawProjectedBuildGrid(...args){return battleHudRuntime.arena_drawProjectedBuildGrid(...args)}
function arena_drawGrid(...args){return battleHudRuntime.arena_drawGrid(...args)}
function arena_drawPurifyBar(...args){return battleHudRuntime.arena_drawPurifyBar(...args)}
function arena_drawLieutenantsBar(...args){return battleHudRuntime.arena_drawLieutenantsBar(...args)}
function arena_drawBossHpBar(...args){return battleHudRuntime.arena_drawBossHpBar(...args)}
function arena_drawBossCastBar(...args){return battleHudRuntime.arena_drawBossCastBar(...args)}
function arena_hudRgb(...args){return battleHudRuntime.arena_hudRgb(...args)}
function arena_hudShade(...args){return battleHudRuntime.arena_hudShade(...args)}
function arena_hudPanel(...args){return battleHudRuntime.arena_hudPanel(...args)}
function arena_hudFitText(...args){return battleHudRuntime.arena_hudFitText(...args)}
function arena_drawHudMeter(...args){return battleHudRuntime.arena_drawHudMeter(...args)}
function arena_drawHudIcon(...args){return battleHudRuntime.arena_drawHudIcon(...args)}
function arena_drawCombatRoundChip(...args){return battleHudRuntime.arena_drawCombatRoundChip(...args)}
function arena_resultButtonRects(...args){return battleHudRuntime.arena_resultButtonRects(...args)}
function arena_drawCombatReportPanel(...args){return battleHudRuntime.arena_drawCombatReportPanel(...args)}
function arena_drawRoundCombatReport(...args){return battleHudRuntime.arena_drawRoundCombatReport(...args)}
function arena_drawStageCombatReport(...args){return battleHudRuntime.arena_drawStageCombatReport(...args)}
function arena_drawMobileBattleHud(...args){return battleHudRuntime.arena_drawMobileBattleHud(...args)}
function arena_drawHud(...args){return battleHudRuntime.arena_drawHud(...args)}
function arena_drawPauseMenu(...args){return battleHudRuntime.arena_drawPauseMenu(...args)}
function arena_applyActiveSkillResult(result){
  setGold(result.gold);
  if(result.flash)showFlash(result.flash.text,result.flash.color,result.flash.timer);
  if(result.screenShake)screenShake=Math.max(screenShake,result.screenShake);
}
function arena_activateBloodlust(){
  arena_applyActiveSkillResult(activateBloodlust({arena,gold,units,gameTickHz:GAME_TICK_HZ,emitParticle:addP}));
}
function arena_activateTranquility(){
  arena_applyActiveSkillResult(activateTranquility({arena,gold,units,gameTickHz:GAME_TICK_HZ,emitParticle:addP}));
}
function arena_pickerCardCount(){
  return roleProgression.rootOrder.length+1;
}
function arena_pickerMaxScroll(){
  return unitPickerMaxScroll(W,H,arena_pickerCardCount());
}
function arena_pickerDeck(){
  return PLAYER_UNITS.map((_,idx)=>idx);
}
function arena_pickerEntries(){
  const entries=roleProgression.rootOrder.map(id=>{
    const root=arena_roleRoot(id);
    const def={...PLAYER_UNITS[root.unitIdx],...root};
    return {
      pick:id,
      unitIdx:root.unitIdx,
      label:def.name,
      def,
      cost:root.cost,
      canPlace:arena_canPlace(id),
      attackType:ARENA_ATTACK_TYPE_BY_UNIT[root.unitIdx]||'physical',
      baseStats:getStats(def,1)
    };
  });
  entries.push({
    pick:99,
    unitIdx:99,
    label:VODKA.name,
    def:VODKA,
    cost:arena_unitGoldCost(99),
    canPlace:arena_canPlace(99),
    attackType:ARENA_ATTACK_TYPE_BY_UNIT[99]||'physical',
    baseStats:getStats(VODKA,1)
  });
  return entries;
}
function arena_drawPicker(){
  const result=drawUnitPlacementPicker(ctx,{
    width:W,
    height:H,
    entries:arena_pickerEntries(),
    scroll:arena.pickerScroll,
    frame,
    labels:{scrollDown:'v  scroll for more  v',scrollUp:'^'},
    drawUnitPortrait(entry,px,py){
      const def=entry.def;
      const drawer=def&&drawFns[def.drawFn];
      if(drawer){
        drawer(px,py,{...def,facing:1,bobPhase:frame*0.05,size:(def.size||22)*0.7,color:def.color,accent:def.accent});
      }
    }
  });
  arena.pickerScroll=result.scroll;
  arena._pickerRects=result.rects;
}
const managePanelRenderer=createManagePanelRenderer({
  ctx,
  playerUnits:PLAYER_UNITS,
  vodka:VODKA,
  unitBranches:ARENA_UNIT_BRANCHES,
  maxUnitLevel:ARENA_MAX_UNIT_LEVEL,
  baseSignatures:ARENA_BASE_SIGNATURES,
  branchSignatures:ARENA_BRANCH_SIGNATURES,
  sellRefundForCell,
  view:()=>({width:W,height:H,arena,gold,frame,drawFns,signatures:ARENA_SIGNATURES}),
  isRoleRootCell:arena_isRoleRootCell,
  roleSpecs:arena_roleSpecs,
  specById:arena_specById,
  cellPathMeta:arena_cellPathMeta,
  roleRoot:arena_roleRoot,
  drawSkillSlots:arena_drawSkillSlots,
  getStats,
  upgradeCostFor:arena_upgradeCostFor,
  pathUpgradeCost:arena_pathUpgradeCost,
  pathDetails:arena_pathDetails,
  baseSpec:arena_baseSpec,
  sigDisplayFc:arena_sigDisplayFc,
  sigDisplayCd:arena_sigDisplayCd,
  baseHeadline:arena_baseHeadline,
  branchHeadline:arena_branchHeadline,
  nextUnlockBrief:arena_nextUnlockBrief,
  wrapTextClamped:arena_wrapTextClamped
});
const managePanelInputHandler=createManagePanelInputHandler({
  arenaState:()=>arena,
  unitBranches:ARENA_UNIT_BRANCHES,
  specById:arena_specById,
  upgradeCell:arena_upgradeCell,
  sellCell:arena_sellCell,
  showFlash
});
function arena_drawManagePanel(){return managePanelRenderer.drawManagePanel()}
function arena_handlePickerClick(p){
  // Treat the input as a scroll, not a tap, if the user dragged > 8 px.
  if(_touchAccumY>8){_touchAccumY=0;return}
  for(const r of (arena._pickerRects||[])){
    if(inRect(p,r.x,r.y,r.w,r.h)){
      if(arena_placeUnit(arena.pickerCell,r.pick)){
        showFlash((r.label||'Unit')+' placed','#ffd700',45);
        arena.pickerOpen=false;arena.pickerCell=null;
      }
      return;
    }
  }
  // Tap outside any unit card Ã¢â€ â€™ close picker
  arena.pickerOpen=false;arena.pickerCell=null;
}
function arena_handleManagePanelClick(p){
  return managePanelInputHandler.handleClick(p);
}

// INIT
// =====================
loadSave();
recomputeGrid();
loop();






}

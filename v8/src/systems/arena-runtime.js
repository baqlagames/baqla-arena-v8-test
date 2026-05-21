import { SPRITE_BASE } from '../assets.js';
import { dist, clamp, rnd } from '../core/math.js';
import { GAME_TICK_HZ } from '../core/constants.js';
import { createGameState, STAGE_TRANSIENT_BATTLE_ARRAYS } from '../core/state.js';
import { HP_MULT_ENEMY, UNIT_VISUAL_SCALE, ARENA_L, ARENA_R, ARENA_TOP_BASE, RESPAWN_FRAMES, GRID_COLS, GRID_ROWS, GRID_X, GRID_W, CELL_W, ARENA_MAX_UNIT_LEVEL, ARENA_ATTACK_TYPE_BY_UNIT, ARENA_INTEREST_RATE, ARENA_INTEREST_CAP, ARENA_BUILD_FIRST, ARENA_BUILD_NEXT, ARENA_BUILD_BOSS, ARENA_LEASH_FWD, ARENA_LEASH_BACK, ARENA_LEASH_SIDE, ARENA_UNIT_SIZE_SCALE } from '../data/tuning.js';
import { PLAYER_UNITS, VODKA } from '../data/units.js';
import { ENEMIES } from '../data/enemies.js';
import { BOSSES } from '../data/bosses.js?v=20260521-warden-pressure';
import { ARENA_ABILITIES } from '../data/abilities.js';
import { ARENA_PERKS } from '../data/perks.js';
import { STAGES, STAGE_HP_MULT, STAGE_DMG_MULT } from '../data/stages.js';
import { ARENA_UNIT_BRANCHES, ARENA_BASE_SIGNATURES, ARENA_BRANCH_SIGNATURES } from '../data/passives.js';
import { createButtonDrawers } from '../ui/buttons.js';
import { canvasEventPoint, pointInRect as uiPointInRect } from '../ui/input.js';
import { createCardRowRuntime } from '../ui/card-row-runtime.js';
import { createActorRenderer } from '../render/actor-renderer.js?v=20260521-warden-clarity';
import { createArenaSceneRenderer } from '../render/arena-scene.js?v=20260521-warden-pressure';
import { installCleanCanvasText } from '../render/text.js';
import { createSpecAccessoryRenderer } from '../render/spec-accessories.js';
import { updateArenaEnemyAi } from './combat-enemy-ai.js';
import { createCombatEnemyRuntime } from './combat-enemy-runtime.js';
import { spawnEnemyByIndex } from './enemy-spawn.js?v=20260517-grid-calibration';
import { compactRemovedCombatUnits, tickEnemyCombatUnits, tickPlayerCombatUnits } from './combat-loop.js';
import { createCombatTransientsRuntime } from './combat-transients-runtime.js';
import { createCombatUpdateRuntime } from './combat-update-runtime.js';
import { completeCombatStats, getRoundCombatReport, getStageCombatReport } from './combat-stats.js';
import { tickEnemyPostUpdateStatusEffects } from './combat-status-effects.js';
import { perkSlotCount, stageBeansReward } from './perks.js';
import { createStageFlowRuntime } from './stage-flow-runtime.js?v=20260517-grid-calibration';
import { arena_lateRoundEnemyMult, arena_lateStageNormalDamageMult, arena_lateStageNormalDurabilityMult, arena_lateStageRoleHpMult, arena_roundGoldMult, arena_roundsForStage, arena_stageIncome } from './stage-economy.js';
import { spawnBossById as spawnBossByIdFromData } from './boss-spawn.js?v=20260521-warden-pressure';
import { createArenaBossRuntime } from './arena-boss-runtime.js?v=20260521-warden-pressure';
import { tickTimedFieldEffects } from './timed-field-effects.js';
import { arena_stageStarCriteria, arena_stageStarRule, arena_starText } from './stage-stars.js';
import { createRoleProgressionRuntime } from './role-progression.js';
import { createUnitPayoffRuntime } from './unit-payoff-runtime.js';
import { createUnitAbilityRuntime } from './unit-ability-runtime.js';
import { createUnitMinionRuntime } from './unit-minion-runtime.js';
import { createArenaAudio } from './arena-audio.js';
import { createStageBattleRuntime } from './stage-battle-runtime.js?v=20260521-warden-pressure';
import { createArenaLayoutRuntime } from './arena-layout-runtime.js';
import { createCombatHelperRuntime } from './combat-helper-runtime.js';
import { ARENA_BLOODLUST_COST, ARENA_TRANQUILITY_COST, createArenaSpellRuntime } from './arena-spell-runtime.js';
import { createEnemyMechanicsRuntime } from './enemy-mechanics-runtime.js?v=20260521-warden-pressure';
import { createPlacementEconomyRuntime } from './placement-economy-runtime.js';
import { createScreenProgressRuntime } from './screen-progress-runtime.js';
import { createBattleObjectiveRuntime } from './battle-objective-runtime.js?v=20260521-warden-live';
import { createArenaScreenUiComposition } from './arena-screen-ui-composition.js';
import { createArenaGridRuntime } from './arena-grid-runtime.js';
import { createUnitRuntimeComposition } from './unit-runtime-composition.js';
import { createArenaCombatEffectsRuntime } from './arena-combat-effects-runtime.js';
import { createArenaGameStateRuntime } from './arena-game-state-runtime.js';
import { createArenaBattleArrayRuntime } from './arena-battle-array-runtime.js';
import { createArenaCodexComposition } from './arena-codex-composition.js';
import { createArenaInputComposition } from './arena-input-composition.js';
import { createBattleSceneComposition } from './battle-scene-composition.js?v=20260521-warden-clarity';
import { createArenaShellComposition } from './arena-shell-composition.js';

export function startArena(){
'use strict';

const gameState=createGameState();
const gameStateRuntime=createArenaGameStateRuntime(gameState);
const {
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
  setFoughtBosses,
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
}=gameStateRuntime;
const battleArrayRuntime=createArenaBattleArrayRuntime(battleState);
const replaceBattleArray=(key,next)=>battleArrayRuntime.replace(key,next);
const clearBattleArrays=keys=>battleArrayRuntime.clearMany(keys);

const arenaAudio=createArenaAudio();
const SFX=arenaAudio.sfx;

const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
installCleanCanvasText(ctx);
const arenaButtonDrawers=createButtonDrawers(ctx);
const layoutState=gameState.layout;
layoutState.arenaTop=ARENA_TOP_BASE;
let ARENA_CANVAS_DPR=layoutState.canvasDpr;
let W=layoutState.width,H=layoutState.height;
let arenaLayoutRuntime=null;
function arena_syncLayoutState(){
  return arenaLayoutRuntime&&arenaLayoutRuntime.sync(arena_layoutSnapshot());
}
function arena_applyRenderQuality(){
  return arenaLayoutRuntime&&arenaLayoutRuntime.applyRenderQuality();
}
function computeCanvasDims(){
  return arenaLayoutRuntime.computeCanvasDims();
}
function applyCanvasDims(renderScale){
  return arenaLayoutRuntime.applyCanvasDims(renderScale);
}
function reanchorArenaForResize(){
  // Bail silently on the bootstrap call Ã¢â‚¬â€ the let declarations below this
  // function are still in TDZ at first init.
  try{
    if(campaignState.playerCastle){campaignState.playerCastle.y=ARENA_BOT-38;campaignState.playerCastle.x=W/2}
    if(campaignState.enemyCastle){campaignState.enemyCastle.y=ARENA_TOP+65;campaignState.enemyCastle.x=W/2}
    if(battleState.units)for(const u of battleState.units){
      if(u.y>ARENA_BOT-8)u.y=ARENA_BOT-8;
      if(u.y<ARENA_TOP+55)u.y=ARENA_TOP+55;
    }
    if(battleState.enemies)for(const e of battleState.enemies){
      if(e.y>ARENA_BOT-8)e.y=ARENA_BOT-8;
      if(e.y<ARENA_TOP+55)e.y=ARENA_TOP+55;
    }
    if(squadState.vodkaUnit&&squadState.vodkaUnit.y>ARENA_BOT-8)squadState.vodkaUnit.y=ARENA_BOT-8;
  }catch(_){}
}
function resize(){
  return arenaLayoutRuntime.resize();
}

// =============================================================
// BAQLA ARENA v8 Ã¢â‚¬â€ LEGION TD STYLE (grid placement, build/wave rounds)
// 12 player units (Arabic vegetable theme) + Vodka hero
// L1/L2/L4 = stat upgrades; L3/L5 = ability unlocks
// =============================================================

// Global HP multipliers Ã¢â‚¬â€ applied at every spawn site so fights last longer
// without touching any per-unit table values. Damage is unchanged.
// v5: dropped 1.20 Ã¢â€ â€™ 1.10. Slower combat already lengthens fights.



function nerfMinion(m){return unitMinionRuntime.nerfMinion(m)}
function arena_followFamiliarAnchor(u){return unitMinionRuntime.followFamiliarAnchor(u)}
// v5: every unit's draw size scaled at spawn. Cascades through size-driven
// collision, draw, shadow, and arena clamps automatically.

// Tighter top + bottom bars give the arena ~150px more vertical room,
// so enemies have actual time to march down before reaching the castle.

let ARENA_TOP=Number.isFinite(layoutState.arenaTop)?layoutState.arenaTop:ARENA_TOP_BASE;
let ARENA_BOT=Number.isFinite(layoutState.arenaBottom)?layoutState.arenaBottom:820;
let DEPLOY_TOP=Number.isFinite(layoutState.deployTop)?layoutState.deployTop:710;
let HERO_BTN=layoutState.heroButton||{x:W-44,y:H-46,r:30};


// =====================
// arena: GRID + LEGION TD
// =====================
// Placement grid follows the checkerboard painted into Baqla_Arena 1.png so
// units snap to the exact square centers instead of an older generated layout.


    // castle lives below grid; smaller castle = less pad
  // left edge of grid


const arenaGridRuntime=createArenaGridRuntime({
  layoutState,
  gridCols:GRID_COLS,
  gridRows:GRID_ROWS,
  gridX:GRID_X,
  gridW:GRID_W,
  cellW:CELL_W,
  arenaLeft:ARENA_L,
  arenaRight:ARENA_R,
  getWidth:()=>W,
  getHeight:()=>H,
  getArenaTop:()=>ARENA_TOP,
  getArenaBot:()=>ARENA_BOT,
  isPaintedActive:()=>arenaSceneRenderer&&arenaSceneRenderer.arenaViewMode==='25d',
  syncLayoutState:arena_syncLayoutState,
  screenToWorldPoint:(x,y)=>arena_screenToWorldPoint(x,y),
  camPoint:(x,y)=>arena_camPoint(x,y),
  hasClashCamera:()=>arenaSceneRenderer&&arenaSceneRenderer.clashCamera
});
function arena_layoutSnapshot(){
  return {canvasDpr:ARENA_CANVAS_DPR,width:W,height:H,arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,deployTop:DEPLOY_TOP,heroButton:HERO_BTN,...arenaGridRuntime.layoutValues()};
}
function arena_setLayoutValues(values){
  if(Number.isFinite(values.canvasDpr))ARENA_CANVAS_DPR=values.canvasDpr;
  if(Number.isFinite(values.width))W=values.width;
  if(Number.isFinite(values.height))H=values.height;
  if(Number.isFinite(values.arenaBottom))ARENA_BOT=values.arenaBottom;
  if(Number.isFinite(values.deployTop))DEPLOY_TOP=values.deployTop;
  if(values.heroButton)HERO_BTN=values.heroButton;
}
function arena_paintedPlacementActive(){return arenaGridRuntime.paintedPlacementActive()}
function arena_enemySpawnY(){return arenaGridRuntime.enemySpawnY()}
function recomputeGrid(){return arenaGridRuntime.recomputeGrid()}
function cellCenterWorld(...args){return arenaGridRuntime.cellCenterWorld(...args)}
function cellCenterScreen(...args){return arenaGridRuntime.cellCenterScreen(...args)}
function xyToCell(...args){return arenaGridRuntime.xyToCell(...args)}
function arena_laneBounds(...args){return arenaGridRuntime.laneBounds(...args)}

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
  view:()=>({frame:combatRuntimeState.frame}),
  emitParticle:(...args)=>addP(...args),
  randomRange:rnd
});
function arena_specHalo(u){return specAccessoryRenderer.specHalo(u)}
function arena_drawSpecAccessory(u){return specAccessoryRenderer.drawSpecAccessory(u)}

function arena_currentStageRounds(){
  return arena_roundsForStage((campaignState.currentStage&&campaignState.currentStage.n)||1);
}

let arena=gameState.arena;

arenaLayoutRuntime=createArenaLayoutRuntime({
  layoutState,
  canvas,
  ctx,
  arenaTopBase:ARENA_TOP_BASE,
  getWindow:()=>window,
  getLayout:arena_layoutSnapshot,
  setLayout:arena_setLayoutValues,
  recomputeGrid,
  reanchor:reanchorArenaForResize
});
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
// v3-style upgrade currency: gold earned from kills, resets each stage,
// spent on per-card upgrades during the battle.
const HAND_SIZE=6;

// =====================
// SAVE / LOAD
// =====================
const screenProgressRuntime=createScreenProgressRuntime({
  view:()=>({
    state:gameState.screen,arena,currentStage:campaignState.currentStage,playerCastle:campaignState.playerCastle,
    maxStage:progressState.maxStage,
    stageStars:progressState.stageStars,
    selectedDeck:progressState.selectedDeck,
    selectedSpells:progressState.selectedSpells,
    beans:progressState.beans,
    unlockedPerks:progressState.unlockedPerks,
    selectedPerks:progressState.selectedPerks,
    foughtBosses:progressState.foughtBosses
  }),
  setMaxStage,setStageStars,setSelectedDeck,setSelectedSpells,setBeans,addBeans,setUnlockedPerks,setSelectedPerks,setFoughtBosses,
  clearBattleArrays,setPlayerCastle,setBossRef,setBossSpawned,setStageOver,setStageWon,setScreen,
  startBuild:arena_startBuild,
  buildWavePreview:arena_buildWavePreview,
  showFlash,
  sound:SFX
});
function arena_updateStageChallengeUsage(...args){return screenProgressRuntime.updateStageChallengeUsage(...args)}
function arena_computeStageStars(...args){return screenProgressRuntime.computeStageStars(...args)}
function loadSave(...args){return screenProgressRuntime.loadSave(...args)}
function saveSave(...args){return screenProgressRuntime.saveSave(...args)}
function arena_perkEffects(...args){return screenProgressRuntime.perkEffects(...args)}
function arena_unlockPerk(...args){return screenProgressRuntime.unlockPerk(...args)}
function arena_togglePerk(...args){return screenProgressRuntime.togglePerk(...args)}
function arena_claimDoubleBeansReward(...args){return screenProgressRuntime.claimDoubleBeansReward(...args)}
function arena_claimSecondChanceRetry(...args){return screenProgressRuntime.claimSecondChanceRetry(...args)}

// =====================
// HELPERS
// =====================

const combatHelperRuntime=createCombatHelperRuntime({
  tickHz:GAME_TICK_HZ,
  initialCombatStats:combatRuntimeState.combatStats,
  setCombatStats,
  view:()=>({
    state:gameState.screen,arena,units:battleState.units,enemies:battleState.enemies,
    projectiles:battleState.projectiles,particles:battleState.particles,
    damageNumbers:battleState.damageNumbers,healingNumbers:battleState.healFx,
    currentStage:campaignState.currentStage,frame:combatRuntimeState.frame,
    groundFx:battleState.groundFx,beamFx:battleState.beamFx,
    towers:campaignState.towers,playerCastle:campaignState.playerCastle,enemyCastle:campaignState.enemyCastle,
    vodkaUnit:squadState.vodkaUnit,
    arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,arenaLeft:ARENA_L,arenaRight:ARENA_R,width:W
  }),
  laneBounds:arena_laneBounds,
  leashForward:ARENA_LEASH_FWD,
  leashBack:ARENA_LEASH_BACK,
  leashSide:ARENA_LEASH_SIDE,
  distance:dist,
  randomRange:rnd,
  sound:SFX,
  showFlash,
  perkEffects:arena_perkEffects,
  shake:addScreenShake,
  setVodkaDead,
  setVodkaRespawn,
  setVodkaUnit,
  addGold,
  addStageGold,
  spawnGhost:arena_spawnGhost,
  applyFelfelDeadlyPoison:arena_applyFelfelDeadlyPoison,
  spawnGhoul:arena_spawnGhoul
});
function addP(...args){return combatHelperRuntime.addParticle(...args)}
function addDmg(...args){return combatHelperRuntime.addDamageText(...args)}
function addHealFx(...args){return combatHelperRuntime.addHealEffect(...args)}
function arena_applyHealingReceived(...args){return combatHelperRuntime.applyHealingReceived(...args)}
function arena_statsResetStage(...args){return combatHelperRuntime.resetStageStats(...args)}
function arena_statsStartRound(...args){return combatHelperRuntime.startRoundStats(...args)}
function arena_applyTrackedHeal(...args){return combatHelperRuntime.trackedHeal(...args)}
function arena_statsFinishRound(...args){return combatHelperRuntime.finishRoundStats(...args)}
function arena_statsFormat(...args){return combatHelperRuntime.formatStats(...args)}
function arena_applySearingBrandOnBasic(...args){return combatHelperRuntime.applySearingBrandOnBasic(...args)}
function arena_applyRoyalStingOnBasic(...args){return combatHelperRuntime.applyRoyalStingOnBasic(...args)}
function arena_emberDecreeDamage(...args){return combatHelperRuntime.emberDecreeDamage(...args)}
function showFlash(t,c,d){
  uiState.flashText=t;uiState.flashTimer=d||80;uiState.flashColor=c||'#fff';
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
function arena_isCapstoneLevel(...args){return placementEconomyRuntime.isCapstoneLevel(...args)}
function arena_unitGoldCost(...args){return placementEconomyRuntime.unitGoldCost(...args)}
function arena_upgradeCostFor(...args){return placementEconomyRuntime.upgradeCostFor(...args)}
function arena_pathUpgradeCost(...args){return placementEconomyRuntime.pathUpgradeCost(...args)}
function sellRefundForCell(...args){return placementEconomyRuntime.sellRefundForCell(...args)}
function getStats(...args){return placementEconomyRuntime.getStats(...args)}
function getUnitStats(...args){return placementEconomyRuntime.getUnitStats(...args)}
function getVodkaStats(...args){return placementEconomyRuntime.getVodkaStats(...args)}
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
const placementEconomyRuntime=createPlacementEconomyRuntime({
  tickHz:GAME_TICK_HZ,
  view:()=>({
    arena,units:battleState.units,
    crystal:economyState.crystal,
    gold:economyState.gold,
    unitLevels:squadState.unitLevels,
    vodkaLevel:squadState.vodkaLevel,
    vodkaUnit:squadState.vodkaUnit,
    vodkaDead:squadState.vodkaDead,
    vodkaDeployCD:squadState.vodkaDeployCD,
    width:W,deployTop:DEPLOY_TOP,frame:combatRuntimeState.frame,
    particles:battleState.particles,groundFx:battleState.groundFx
  }),
  setCrystal,
  setGold,
  setVodkaUnit,
  roleRoot:arena_roleRoot,
  pathById:arena_pathById,
  applyRolePathToCell:arena_applyRolePathToCell,
  onStageChallengeUsage:arena_updateStageChallengeUsage,
  centerForCell:c=>cellCenterWorld(c.col,c.row),
  lerpColor,
  applyPassives:arena_applyPassives,
  applyMoveSpeedTuning:arena_applyPlayerMoveSpeedTuning,
  spawnMinion,
  spawnSquadMinions:arena_spawnSquadMinions,
  randomRange:rnd,
  randomFloat:Math.random,
  emitParticle:addP,
  addDamageText:addDmg,
  addHealEffect:addHealFx,
  showFlash,
  sound:SFX,
  shake:addScreenShake
});

// =====================
// SPAWN / DEPLOY
// =====================
function deployUnit(...args){return placementEconomyRuntime.deployUnit(...args)}
function spawnUnit(...args){return placementEconomyRuntime.spawnUnit(...args)}
function spawnMinion(...args){return unitMinionRuntime.spawnMinion(...args)}
function arena_spawnGhoul(...args){return unitMinionRuntime.spawnGhoul(...args)}
function arena_spawnTreant(...args){return unitMinionRuntime.spawnTreant(...args)}
function deployVodka(...args){return placementEconomyRuntime.deployVodka(...args)}

// =====================
// MOVEMENT & TARGETING
// =====================
// Global speed scalar Ã¢â‚¬â€ slows all units + enemies uniformly so the larger arena
// gives time to react. Lower = slower combat pacing.
// v5: 0.7 Ã¢â€ â€™ 0.55 (~21% slower). Enemies get an extra Ãƒâ€”0.85 in moveToward so
// they feel less aggressive without making player units sluggish.
function moveToward(...args){return combatHelperRuntime.moveToward(...args)}
function clampToArena(...args){return combatHelperRuntime.clampToArena(...args)}
function arena_fireDivineStorm(...args){return combatHelperRuntime.fireDivineStorm(...args)}
function arena_clampToLeash(...args){return combatHelperRuntime.clampToLeash(...args)}
function arena_resolvePlayerUnitOverlaps(...args){return combatHelperRuntime.resolvePlayerOverlaps(...args)}
function findTarget(...args){return combatHelperRuntime.findTarget(...args)}
function arena_isGripReserved(...args){return combatHelperRuntime.isGripReserved(...args)}
function arena_reserveGripTarget(...args){return combatHelperRuntime.reserveGripTarget(...args)}
function arena_isGapCloserReserved(...args){return combatHelperRuntime.isGapCloserReserved(...args)}
function arena_reserveGapCloserTarget(...args){return combatHelperRuntime.reserveGapCloserTarget(...args)}
function arena_findUnreservedEnemyInRange(...args){return combatHelperRuntime.findUnreservedEnemyInRange(...args)}
function updateBossEngagement(...args){return combatHelperRuntime.updateBossEngagement(...args)}
function isSaturatedTarget(...args){return combatHelperRuntime.isSaturatedTarget(...args)}
function arena_isReachable(...args){return combatHelperRuntime.isReachable(...args)}
function findEnemyForUnit(...args){return combatHelperRuntime.findEnemyForUnit(...args)}
function findRangedEnemyForUnit(...args){return combatHelperRuntime.findRangedEnemyForUnit(...args)}
function findTankAnchor(...args){return combatHelperRuntime.findTankAnchor(...args)}
function findAllyForHealer(...args){return combatHelperRuntime.findAllyForHealer(...args)}
function arena_spawnPlayerAbilityCastVfx(...args){return combatHelperRuntime.spawnAbilityCastVfx(...args)}
function arena_spawnPlayerProjectileCastVfx(...args){return combatHelperRuntime.spawnProjectileCastVfx(...args)}
function arena_isZavsMeleeAlly(...args){return combatHelperRuntime.isZavsMeleeAlly(...args)}
function arena_zavsAllyDmgMult(...args){return combatHelperRuntime.zavsAllyDmgMult(...args)}
function arena_zavsAllyAtkSpdFactor(...args){return combatHelperRuntime.zavsAllyAtkSpdFactor(...args)}
function arena_isBatataBacklineAlly(...args){return combatHelperRuntime.isBatataBacklineAlly(...args)}
function arena_applyMuddied(...args){return combatHelperRuntime.applyMuddied(...args)}
function arena_addZavsLineShield(...args){return combatHelperRuntime.addZavsShield(...args)}
function arena_addGoldShield(...args){return combatHelperRuntime.addGoldShield(...args)}
function arena_addBatataShield(...args){return combatHelperRuntime.addBatataShield(...args)}
function arena_isTaoonPriorityEnemy(...args){return combatHelperRuntime.isTaoonPriorityEnemy(...args)}
function arena_applyRuneWound(...args){return combatHelperRuntime.applyRuneWound(...args)}
function arena_addTaoonBloodShield(...args){return combatHelperRuntime.addTaoonBloodShield(...args)}
function arena_taoonBloodTithe(...args){return combatHelperRuntime.taoonBloodTithe(...args)}
function arena_grantGapInvulnerability(...args){return combatHelperRuntime.grantGapInvulnerability(...args)}
function combatDamageContext(...args){return combatHelperRuntime.combatDamageContext(...args)}
function dealDamage(...args){return combatHelperRuntime.dealDamage(...args)}
function onDeath(...args){return combatHelperRuntime.onDeath(...args)}

// (Kharroob raise undead functions removed Ã¢â‚¬â€ unit deleted)

// =====================
// PROJECTILES & BOMBS
// =====================
let combatEffectsRuntime=null;
const unitPayoffRuntime=createUnitPayoffRuntime({
  tickHz:GAME_TICK_HZ,
  view:()=>({enemies:battleState.enemies,groundFx:battleState.groundFx,bombs:battleState.bombs,beamFx:battleState.beamFx,frame:combatRuntimeState.frame,arenaTop:ARENA_TOP}),
  distance:dist,
  dealDamage,
  clampToArena,
  emitParticle:addP,
  addDamageText:addDmg
});
function arena_basicSecondHitFor(...args){return unitPayoffRuntime.basicSecondHitFor(...args)}
function arena_findBasicSecondTarget(...args){return unitPayoffRuntime.findBasicSecondTarget(...args)}
function arena_applyBasicSecondHit(...args){return unitPayoffRuntime.applyBasicSecondHit(...args)}
function arena_applyJafaarAgony(...args){return unitPayoffRuntime.applyJafaarAgony(...args)}
function arena_jafaarCurseWeight(...args){return unitPayoffRuntime.jafaarCurseWeight(...args)}
function arena_findJafaarDrainTarget(...args){return unitPayoffRuntime.findJafaarDrainTarget(...args)}
function arena_applyFelfelDeadlyPoison(...args){return unitPayoffRuntime.applyFelfelDeadlyPoison(...args)}
function arena_moonkinDisplaceEnemy(...args){return unitPayoffRuntime.moonkinDisplaceEnemy(...args)}
function arena_moonkinControlBurst(...args){return unitPayoffRuntime.moonkinControlBurst(...args)}
const unitMinionRuntime=createUnitMinionRuntime({
  tickHz:GAME_TICK_HZ,
  unitVisualScale:UNIT_VISUAL_SCALE,
  view:()=>({arena,units:battleState.units,groundFx:battleState.groundFx,frame:combatRuntimeState.frame,arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,arenaLeft:ARENA_L,arenaRight:ARENA_R,vodkaLevel:squadState.vodkaLevel}),
  randomRange:rnd,
  randomFloat:Math.random,
  clamp,
  emitParticle:addP,
  addDamageText:addDmg,
  showFlash,
  spawnFelfelMirror:arena_spawnFelfelMirror
});
function fireProjectile(...args){return combatEffectsRuntime.fireProjectile(...args)}
function lobBomb(...args){return combatEffectsRuntime.lobBomb(...args)}

// =====================
// ABILITY EXECUTORS Ã¢â‚¬â€ L3 + L5 per unit + Vodka
// =====================
const unitAbilityRuntime=createUnitAbilityRuntime({
  gameTickHz:GAME_TICK_HZ,
  sound:SFX,
  view:()=>({arena,units:battleState.units,enemies:battleState.enemies,projectiles:battleState.projectiles,bombs:battleState.bombs,groundFx:battleState.groundFx,beamFx:battleState.beamFx,frame:combatRuntimeState.frame,arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,arenaLeft:ARENA_L,arenaRight:ARENA_R,width:W,height:H,screenShake:uiState.screenShake}),
  setScreenShake,
  randomRange:rnd,
  distance:dist,
  dealDamage,
  emitParticle:addP,
  addDamageText:addDmg,
  showFlash,
  spawnPlayerAbilityCastVfx:arena_spawnPlayerAbilityCastVfx,
  clampToLeash:arena_clampToLeash,
  clampToArena,
  applyFelfelDeadlyPoison:arena_applyFelfelDeadlyPoison,
  findEnemyForUnit,
  findJafaarDrainTarget:arena_findJafaarDrainTarget,
  fireProjectile,
  beaconSplash:arena_beaconSplash,
  addGoldShield:arena_addGoldShield,
  applyTrackedHeal:arena_applyTrackedHeal,
  spawnTreant:arena_spawnTreant,
  spawnMinion,
  spawnPetBear:unitMinionRuntime.spawnPetBear,
  spawnDireBeast:unitMinionRuntime.spawnDireBeast,
  spawnRepairBot:unitMinionRuntime.spawnRepairBot,
  lobBomb
});
const ABILITIES=unitAbilityRuntime.abilities;
function arena_jazarGuard(...args){return unitAbilityRuntime.jazarGuard(...args)}
function arena_jazarSignatureSurge(...args){return unitAbilityRuntime.jazarSignatureSurge(...args)}
function arena_findBestEnemyClusterPoint(...args){return unitAbilityRuntime.findBestEnemyClusterPoint(...args)}

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
    return {frame:combatRuntimeState.frame,width:W,height:H,arenaLeft:lane.left,arenaRight:lane.right,arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,state:gameState.screen,arena,units:battleState.units,enemies:battleState.enemies,towers:campaignState.towers,playerCastle:campaignState.playerCastle,groundFx:battleState.groundFx,beamFx:battleState.beamFx};
  },
  sound:SFX,
  randomRange:rnd,
  emitParticle:addP,
  addDamageText:addDmg,
  shake:addScreenShake,
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


function updateProjectile(...args){return combatEffectsRuntime.updateProjectile(...args)}
function updateBomb(...args){return combatEffectsRuntime.updateBomb(...args)}
const actorRenderer=createActorRenderer({
  ctx,
  view:()=>({width:W,frame:combatRuntimeState.frame,state:gameState.screen,arena,arenaTop:ARENA_TOP,units:battleState.units,groundFx:battleState.groundFx}),
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
function drawUnit(...args){return actorRenderer.drawUnit(...args)}
function drawVodka(...args){return actorRenderer.drawVodka(...args)}
function drawDummy(...args){return actorRenderer.drawDummy(...args)}

// =====================
// ARENA + UI
// =====================
// Lazy-init ambient floor decorations once per stage so they don't shimmer randomly
const arenaSceneRenderer=createArenaSceneRenderer({
  ctx,
  randomRange:rnd,
  view:()=>({
    width:W,height:H,frame:combatRuntimeState.frame,state:gameState.screen,selectedCard:uiState.selectedCard,
    currentStage:campaignState.currentStage,bossRef:campaignState.bossRef,
    arenaL:ARENA_L,arenaR:ARENA_R,arenaTop:ARENA_TOP,arenaBot:ARENA_BOT,deployTop:DEPLOY_TOP,
    gridX:arenaGridRuntime.gridX(),gridY:arenaGridRuntime.gridY(),gridW:arenaGridRuntime.gridW(),cellW:arenaGridRuntime.cellW(),cellH:arenaGridRuntime.cellH(),gridCols:GRID_COLS,gridRows:GRID_ROWS
  })
});
function resetArenaDecor(){return arenaSceneRenderer.resetArenaDecor()}
function regenArenaDecor(){return arenaSceneRenderer.regenArenaDecor()}
function arena_camDepthScaleAt(y){return arenaSceneRenderer.camDepthScaleAt(y)}
function arena_camPoint(x,y){return arenaSceneRenderer.camPoint(x,y)}
function arena_screenToWorldPoint(x,y){return arenaSceneRenderer.screenToWorldPoint(x,y)}
function arena_pathCamQuad(x,y,w,h){return arenaSceneRenderer.pathCamQuad(x,y,w,h)}
function arena_drawWithClashCamera(x,y,fn){return arenaSceneRenderer.drawWithClashCamera(x,y,fn)}
function arena_overlayOffsetFor(anchor,x,y,w,h,minY){return arenaSceneRenderer.overlayOffsetFor(anchor,x,y,w,h,minY)}
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
  view:()=>({
    width:W,height:H,state:gameState.screen,
    crystal:economyState.crystal,
    maxCrystal:economyState.maxCrystal,
    gold:economyState.gold,
    cardHand:squadState.cardHand,
    selectedCard:uiState.selectedCard,
    unitLevels:squadState.unitLevels,
    currentStage:campaignState.currentStage,
    vodkaUnit:squadState.vodkaUnit,
    vodkaDead:squadState.vodkaDead,
    vodkaDeployCD:squadState.vodkaDeployCD,
    vodkaLevel:squadState.vodkaLevel
  }),
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

combatEffectsRuntime=createArenaCombatEffectsRuntime({
  ctx,
  sound:SFX,
  view:()=>({width:W,arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,frame:combatRuntimeState.frame,projectiles:battleState.projectiles,bombs:battleState.bombs,units:battleState.units,enemies:battleState.enemies,beamFx:battleState.beamFx,groundFx:battleState.groundFx,particles:battleState.particles,damageNumbers:battleState.damageNumbers,healFx:battleState.healFx,playerCastle:campaignState.playerCastle,flashText:uiState.flashText,flashTimer:uiState.flashTimer,flashColor:uiState.flashColor,signatureBanner:uiState.signatureBanner}),
  randomRange:rnd,
  emitParticle:addP,
  addDamageText:addDmg,
  dealDamage,
  applyTrackedHeal:arena_applyTrackedHeal,
  applyBasicSecondHit:arena_applyBasicSecondHit,
  addGoldShield:arena_addGoldShield,
  spawnPlayerProjectileCastVfx:arena_spawnPlayerProjectileCastVfx,
  shake:addScreenShake,
  unitSprites:()=>actorRenderer.unitSprites,
  drawUnitSprite:(...args)=>actorRenderer.drawUnitSprite(...args),
  camPoint:arena_camPoint,
  camDepthScaleAt:arena_camDepthScaleAt,
  distance:dist,
  clampValue:clamp,
  setSignatureBanner
});
function drawProjectiles(...args){return combatEffectsRuntime.drawProjectiles(...args)}
function drawBeamFx(...args){return combatEffectsRuntime.drawBeamFx(...args)}
function drawUnitOverlays(...args){return combatEffectsRuntime.drawUnitOverlays(...args)}
function drawBombs(...args){return combatEffectsRuntime.drawBombs(...args)}
function drawParticles(...args){return combatEffectsRuntime.drawParticles(...args)}
function drawGroundFx(...args){return combatEffectsRuntime.drawGroundFx(...args)}
function drawDmgNums(...args){return combatEffectsRuntime.drawDmgNums(...args)}
function drawFlash(...args){return combatEffectsRuntime.drawFlash(...args)}
function drawSigBanner(...args){return combatEffectsRuntime.drawSigBanner(...args)}

// =====================
// CODEX OVERLAY
// =====================
const arenaCodexRuntime=createArenaCodexComposition({
  ctx,
  playerUnits:PLAYER_UNITS,
  vodka:VODKA,
  unitBranches:ARENA_UNIT_BRANCHES,
  attackTypeByUnit:ARENA_ATTACK_TYPE_BY_UNIT,
  baseSignatures:ARENA_BASE_SIGNATURES,
  branchSignatures:ARENA_BRANCH_SIGNATURES,
  maxUnitLevel:ARENA_MAX_UNIT_LEVEL,
  states:{progressState,uiState,squadState,combatRuntimeState},
  layoutView:()=>({width:W,height:H}),
  arenaState:()=>arena,
  signatures:arena_getSignatures,
  drawFns,
  helpers:{
    threatTagColor:arena_threatTagColor,
    rgba:arena_rgba,
    getStats,
    baseSpec:arena_baseSpec,
    isCapstoneLevel:arena_isCapstoneLevel,
    drawPillBtn,
    drawVodka
  }
});
function drawCodex(...args){return arenaCodexRuntime.drawCodex(...args)}
function drawCodexThreatsLegend(...args){return arenaCodexRuntime.drawCodexThreatsLegend(...args)}
function drawCodexArmorMatrix(...args){return arenaCodexRuntime.drawCodexArmorMatrix(...args)}
function drawCodexDetail(...args){return arenaCodexRuntime.drawCodexDetail(...args)}
function wrapText(...args){return arenaCodexRuntime.wrapText(...args)}
function arena_wrapTextClamped(...args){return arenaCodexRuntime.arena_wrapTextClamped(...args)}
function arena_nextUnlockBrief(...args){return arenaCodexRuntime.arena_nextUnlockBrief(...args)}
function arena_sigDisplayCd(...args){return arenaCodexRuntime.arena_sigDisplayCd(...args)}
function arena_sigDisplayFc(...args){return arenaCodexRuntime.arena_sigDisplayFc(...args)}
function arena_branchHeadline(...args){return arenaCodexRuntime.arena_branchHeadline(...args)}
function arena_baseHeadline(...args){return arenaCodexRuntime.arena_baseHeadline(...args)}
function arena_drawSkillSlots(...args){return arenaCodexRuntime.arena_drawSkillSlots(...args)}
function getCanvasXY(e){
  return canvasEventPoint(canvas,W,H,e);
}
function inRect(p,x,y,w,h){return uiPointInRect(p,x,y,w,h)}

// Upgrade button placement above the selected visible card.
function upgradeBtnRect(unitIdx){
  if(uiState.selectedCard<0)return null;
  const L=cardRowLayout();
  const battleMode=gameState.screen==='battle';
  let i=-1;
  if(battleMode){i=squadState.cardHand.indexOf(unitIdx)}else{i=unitIdx}
  if(i<0||i>=L.cardCount)return null;
  const cx=L.startX+i*(L.cw+L.gap);
  return{x:cx-4,y:L.rowY-44,w:L.cw+8,h:38};
}
function upgradeCost(currentLevel){
  // v3-style gold cost per tier (scales aggressively for L4 / L5)
  return [0,40,90,160,260][currentLevel]||999;
}
function tryUpgradeUnit(unitIdx){
  const cap=gameState.screen==='battle'&&campaignState.currentStage?getStageMaxLevel(campaignState.currentStage.n):5;
  const cur=squadState.unitLevels[unitIdx];
  if(cur>=cap){showFlash('LEVEL CAPPED FOR THIS STAGE','#aa3333',40);return}
  if(cur>=ARENA_MAX_UNIT_LEVEL){showFlash('MAX LEVEL','#aa3333',40);return}
  const cost=Math.max(1,Math.round(upgradeCost(cur)));
  if(economyState.gold<cost){showFlash('NEED '+cost+' GOLD','#aa3333',40);return}
  setGold(economyState.gold-cost);
  squadState.unitLevels[unitIdx]=cur+1;
  showFlash(PLAYER_UNITS[unitIdx].name+' L'+(cur+1)+'!','#ffd700',60);
  addP(W/2,L_rowY()+18,'#ffd700',24,5);
  saveSave();
}
function L_rowY(){return H-82}
function setTouchAccumY(...args){return arenaInputRuntime.setTouchAccumY(...args)}
const combatTransientsRuntime=createCombatTransientsRuntime({
  tickHz:GAME_TICK_HZ,
  view:()=>({frame:combatRuntimeState.frame,screenShake:uiState.screenShake,units:battleState.units,enemies:battleState.enemies,projectiles:battleState.projectiles,bombs:battleState.bombs,particles:battleState.particles,damageNumbers:battleState.damageNumbers,healFx:battleState.healFx,groundFx:battleState.groundFx,beamFx:battleState.beamFx}),
  setScreenShake,
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
const arenaBossRuntime=createArenaBossRuntime({
  view:()=>{
    const lane=arena_laneBounds();
    return {
      state:gameState.screen,arena,currentStage:campaignState.currentStage,width:W,arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,
      spawnLeft:lane.left,spawnRight:lane.right,
      units:battleState.units,enemies:battleState.enemies,bombs:battleState.bombs,
      groundFx:battleState.groundFx,beamFx:battleState.beamFx,frame:combatRuntimeState.frame
    };
  },
  currentStageRounds:arena_currentStageRounds,
  randomRange:rnd,
  dealDamage,
  emitParticle:addP,
  addDamageText:addDmg,
  showFlash,
  fireProjectile,
  spawnEnemyByIndex:spawnEnemyByIdx,
  clampToArena,
  sound:SFX,
  shake:addScreenShake
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
    state:gameState.screen,arena,
    stageTime:campaignState.stageTime,
    currentStageIdx:campaignState.currentStageIdx,
    currentStage:campaignState.currentStage,
    waveIdx:campaignState.waveIdx,
    frame:combatRuntimeState.frame,
    arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,width:W,enemies:battleState.enemies,
    spawnLeft:arena_laneBounds().left,spawnRight:arena_laneBounds().right,
    spawnY:arena_enemySpawnY(),
    stageOver:campaignState.stageOver,
    playerCastle:campaignState.playerCastle,
    selectedPerks:progressState.selectedPerks,
    maxStage:progressState.maxStage
  }),
  randomRange:rnd,
  clampValue:clamp,
  spawnEnemyByIndex,
  spawnBossByIdFromData,
  isCampaignBossRound:arenaBossRuntime.isCampaignBossRound,
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
  stageStar:sn=>progressState.stageStars[sn],
  setStageStar:(sn,value)=>{progressState.stageStars[sn]=value;},
  unlockBossCodex:bossId=>{
    const id=Number(bossId);
    if(!Number.isFinite(id))return false;
    const current=Array.isArray(progressState.foughtBosses)?progressState.foughtBosses:[];
    if(current.includes(id))return false;
    progressState.foughtBosses=[...current,id].sort((a,b)=>a-b);
    saveSave();
    showFlash('BOSS CODEX REVEALED','#facc15',90);
    return true;
  },
  stageBeansReward,
  computeStageStars:arena_computeStageStars,
  finishRoundStats:arena_statsFinishRound,
  completeCombatStats:won=>completeCombatStats(combatRuntimeState.combatStats,won),
  showFlash,
  emitParticle:addP,
  shake:addScreenShake,
  sound:SFX,
  tickBossAerialBombs:arenaBossRuntime.tickAerialBombs,
  tickTimedFieldEffects,
  bossMechanicsContext:arenaBossRuntime.context,
  timedFieldEffectsContext:arena_timedFieldEffectsContext,
  startWave:arena_startWave,
  spawnQueuedEnemy:arena_spawnQueuedEnemy,
  spawnNextEnemyBatch:arena_spawnNextEnemyBatch,
  tryTriggerRift:arena_tryTriggerRift,
  spawnRiftMinions:arena_spawnRiftMinions,
  endWave:arena_endWave
});
const stageBattleRuntime=createStageBattleRuntime({
  tickHz:GAME_TICK_HZ,
  stages:STAGES,
  transientBattleArrays:STAGE_TRANSIENT_BATTLE_ARRAYS,
  buildFirstSeconds:ARENA_BUILD_FIRST,
  view:()=>({
    arena,width:W,arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,deployTop:DEPLOY_TOP,
    arenaLeft:ARENA_L,arenaRight:ARENA_R,
    currentStage:campaignState.currentStage,
    currentStageIdx:campaignState.currentStageIdx,
    enemies:battleState.enemies,units:battleState.units,groundFx:battleState.groundFx,gold:economyState.gold
  }),
  selectedDeck:()=>progressState.selectedDeck,
  availableUnitIndices:()=>PLAYER_UNITS.map((_,idx)=>idx),
  selectedSpells:()=>progressState.selectedSpells,
  setCurrentStageIdx,
  setCardHand,
  setAbilityCooldowns:value=>{squadState.abilityCooldowns=value;return squadState.abilityCooldowns},
  setAbilityUsed,
  setAbilityTargeting,
  setCurrentStage,
  resetStageStats:arena_statsResetStage,
  clearBattleArrays,
  setVodkaUnit,
  setVodkaDead,
  setVodkaDeployCD,
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
  respawnSquad:arena_respawnSquad,
  setStageOver,
  setStageWon,
  buildWavePreview:arena_buildWavePreview,
  showFlash,
  setScreen,
  enemiesData:ENEMIES,
  stageHpMult:STAGE_HP_MULT,
  stageDmgMult:STAGE_DMG_MULT,
  hpMultEnemy:HP_MULT_ENEMY,
  unitSizeScale:ARENA_UNIT_SIZE_SCALE,
  randomRange:rnd,
  distance:dist,
  emitParticle:addP,
  shake:addScreenShake,
  spawnBossForStage,
  spawnBossById,
  spawnEliteEnemy,
  spawnEnemyByIdx,
  currentStageRounds:arena_currentStageRounds,
  startRoundStats:arena_statsStartRound,
  spawnSquadMinions:arena_spawnSquadMinions,
  playWaveStart:()=>SFX.waveStart(),
  stageIncome:arena_stageIncome,
  roundGoldMult:arena_roundGoldMult,
  interestCap:ARENA_INTEREST_CAP,
  interestRate:ARENA_INTEREST_RATE,
  buildNext:ARENA_BUILD_NEXT,
  buildBoss:ARENA_BUILD_BOSS,
  finishRoundStats:arena_statsFinishRound,
  endStage
});
const combatUpdateRuntime=createCombatUpdateRuntime({
  arenaState:()=>arena,
  screenState:()=>gameState.screen,
  playerCastle:()=>campaignState.playerCastle,
  units:()=>battleState.units,
  enemies:()=>battleState.enemies,
  advanceFrame,
  tickFlashTimer:()=>{if(uiState.flashTimer>0)uiState.flashTimer--;},
  tickScreenShake:()=>{if(uiState.screenShake>0)uiState.screenShake-=0.5;},
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
  updateBoss:arenaBossRuntime.updateBoss,
  tickEnemyPostUpdateStatusEffects,
  postEnemyStatusContext:()=>({
    frame:combatRuntimeState.frame,
    enemies:battleState.enemies,
    dealDamage,
    emitParticle:addP,
    groundEffects:battleState.groundFx,
    addDamageText:addDmg,
    showFlash,
    onDeath,
    randomRange:rnd,
    shake:addScreenShake
  }),
  updateWaves,
  updateCastle,
  tickActiveSkills:context=>arenaSpellRuntime.tickActiveSkills(context),
  activeSkillsContext:()=>arenaSpellRuntime.activeSkillsContext(),
  tickCombatTransients:()=>combatTransientsRuntime.tickCombatTransients(),
  clearDeadVodka:()=>{if(squadState.vodkaUnit&&squadState.vodkaUnit.hp<=0)setVodkaUnit(null);}
});
const arenaInputRuntime=createArenaInputComposition({
  tickHz:GAME_TICK_HZ,
  states:{progressState,economyState,squadState,campaignState,uiState,combatRuntimeState},
  layoutView:()=>({width:W,height:H}),
  boundsView:()=>({left:ARENA_L,right:ARENA_R,deployTop:DEPLOY_TOP,bottom:ARENA_BOT}),
  screenState:()=>gameState.screen,
  arenaState:()=>arena,
  heroButton:()=>HERO_BTN,
  setters:{
    setScreen,setStageSelectScroll,setCodexOpen,setCodexUnit,setCodexScroll,setCurrentStageIdx,setCurrentStage,
    setSelectedDeck,setDeckPickStage,setDeckPickScroll,setSpellPickStage,setSpellPickScroll,setPerkPickScroll,
    setSelectedSpells,addGold,setSelectedCard
  },
  helpers:{
    inRect,
    distance:dist,
    perkSlotCount,
    startStage,
    saveSave,
    resultButtonRects:arena_resultButtonRects,
    unlockPerk:arena_unlockPerk,
    togglePerk:arena_togglePerk,
    claimDoubleBeansReward:arena_claimDoubleBeansReward,
    claimSecondChanceRetry:arena_claimSecondChanceRetry,
    levelUpSound:()=>SFX.levelUp(),
    toggleSound:()=>arenaAudio.toggleSound(),
    handlePickerClick:arena_handlePickerClick,
    handleManagePanelClick:arena_handleManagePanelClick,
    handleSpellButton:arena_handleSpellButton,
    castAbilityAt:castAbility,
    activateBloodlust:arena_activateBloodlust,
    activateTranquility:arena_activateTranquility,
    showFlash,
    xyToCell,
    screenToWorldPoint:p=>arena_screenToWorldPoint(p.x,p.y),
    toggleArenaViewMode:arena_toggleViewMode,
    deployVodka,
    upgradeBtnRect,
    tryUpgradeUnit,
    cardRowLayout,
    deployUnit,
    pickerMaxScroll:arena_pickerMaxScroll
  }
});
const arenaInputHandlers=arenaInputRuntime.handlers;

// =====================
// MAIN LOOP
// =====================
function update(){
  return combatUpdateRuntime.update();
}
const battleSceneRuntime=createBattleSceneComposition({
  ctx,
  tickHz:GAME_TICK_HZ,
  arenaTopBase:ARENA_TOP_BASE,
  states:{battleState,campaignState,uiState,combatRuntimeState},
  layoutView:()=>({width:W,height:H,arenaTop:ARENA_TOP,arenaBot:ARENA_BOT}),
  screenState:()=>gameState.screen,
  arenaState:()=>arena,
  helpers:{
    setArenaTop:value=>{ARENA_TOP=value;arena_syncLayoutState();},
    randomRange:rnd,
    emitParticle:addP,
    distance:dist,
    applyRenderQuality:arena_applyRenderQuality,
    recomputeGrid
  },
  drawers:{
    drawMenu,drawFlash,drawCodex,drawStageSelect,drawStageBrief,drawDeckPick,drawSpellPick,drawPerkPick,
    drawArena,drawWeather,drawWeatherForeground,drawGroundFx,arena_drawGrid,drawCastle,drawDummy,arena_specHalo,arena_isCapstoneLevel,
    drawUnit,drawUnitOverlays,drawBeamFx,drawProjectiles,drawBombs,drawParticles,drawDmgNums,arena_drawHud,
    drawSigBanner,drawWinScreen,drawLoseScreen
  }
});
function render(){return battleSceneRuntime.render()}
const arenaShellRuntime=createArenaShellComposition({
  canvas,
  ctx,
  tickHz:GAME_TICK_HZ,
  inputHandlers:arenaInputHandlers,
  getCanvasXY,
  update,
  render,
  maxUnitLevel:ARENA_MAX_UNIT_LEVEL,
  states:{economyState,combatRuntimeState},
  layoutView:()=>({width:W,height:H}),
  screenState:()=>gameState.screen,
  arenaState:()=>arena,
  playtestGrid:()=>arenaGridRuntime.playtestGrid(),
  stageCount:()=>STAGES.length,
  setGold,
  setCurrentStageIdx,
  setCurrentStage:idx=>setCurrentStage(STAGES[idx]),
  startStage,
  cellCenter:cellCenterScreen
});

// =====================
// PHASE 2: STAGE INIT / CASTLES / WAVES
// =====================
// arena STAGE INIT (Legion TD) Ã¢â‚¬â€ squad persists across rounds within a stage.
// Each campaign stage is 6 rounds (5 setup + boss/elite). Build phase opens, player places
// units on the grid, START WAVE button (or timer expiry) launches the wave.
function startStage(idx){return stageBattleRuntime.startStage(idx)}
// arena helpers Ã¢â‚¬â€ placement / squad / round flow.
function arena_respawnSquad(){return placementEconomyRuntime.respawnSquad()}
// Spawn squad-attached minions/pets for build preview and wave combat.
// Build refresh clears old pets. Wave start preserves existing preview pets and
// only fills missing ones, avoiding transition-frame pet loss.
function arena_spawnSquadMinions(preserveExisting){
  return unitMinionRuntime.spawnSquadMinions(preserveExisting);
}
function arena_startBuild(seconds){
  return stageBattleRuntime.startBuild(seconds);
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

const enemyMechanicsRuntime=createEnemyMechanicsRuntime({
  tickHz:GAME_TICK_HZ,
  ctx,
  enemyTemplates:ENEMIES,
  bosses:BOSSES,
  view:()=>({state:gameState.screen,arena,currentStage:campaignState.currentStage,enemies:battleState.enemies,groundFx:battleState.groundFx,beamFx:battleState.beamFx,frame:combatRuntimeState.frame,width:W,gold:economyState.gold}),
  distance:dist,
  randomRange:rnd,
  emitParticle:addP,
  addDamageText:addDmg,
  currentStageRounds:arena_currentStageRounds,
  shake:addScreenShake
});
function arena_tryApplyWaveMechanic(...args){return enemyMechanicsRuntime.applyWaveMechanic(...args)}
function arena_enemyAttackCd(...args){return enemyMechanicsRuntime.enemyAttackCd(...args)}
function arena_updateEnemyMechanics(...args){return enemyMechanicsRuntime.updateEnemyMechanics(...args)}
function arena_buildWavePreview(...args){return enemyMechanicsRuntime.buildWavePreview(...args)}
function arena_threatTagColor(...args){return enemyMechanicsRuntime.threatTagColor(...args)}
function arena_threatPanelHeight(...args){return enemyMechanicsRuntime.threatPanelHeight(...args)}
function arena_drawThreatsPanel(...args){return enemyMechanicsRuntime.drawThreatsPanel(...args)}
function arena_rgba(hex,a){
  if(!hex)return 'rgba(154,163,178,'+a+')';
  if(hex.startsWith('rgba'))return hex;
  let h=hex.replace('#','');
  if(h.length===3)h=h.split('').map(c=>c+c).join('');
  const r=parseInt(h.substring(0,2),16),g=parseInt(h.substring(2,4),16),b=parseInt(h.substring(4,6),16);
  return 'rgba('+r+','+g+','+b+','+a+')';
}
function arena_spawnQueuedEnemy(next){return stageBattleRuntime.spawnQueuedEnemy(next)}
function arena_spawnNextEnemyBatch(){return stageBattleRuntime.spawnNextEnemyBatch()}
function arena_startWave(){return stageBattleRuntime.startWave()}
function arena_endWave(won){return stageBattleRuntime.endWave(won)}

// =====================================================================
// MAGICAL RIFT Ã¢â‚¬â€ pre-rolled stage event (single check at stage start)
// =====================================================================
// At startStage we roll once: does this stage get a rift? If yes, we also
// pick which eligible round (4 or 5) it'll appear in. During that round,
// the rift fires deterministically once enemies have been engaging for
// ARENA_RIFT_TRIGGER_MIN_FRAMES Ã¢â‚¬â€ no random per-second rolls.
// A runic circle telegraphs at a random arena spot for ~8s, then disgorges
// "rift-touched" enemies with modest bonus HP/damage vs the act's normal pool.
// Kills drop bonus gold so the encounter pays for itself.
function arena_tryTriggerRift(){return stageBattleRuntime.tryTriggerRift()}
function arena_spawnRiftMinions(){return stageBattleRuntime.spawnRiftMinions()}
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
const unitRuntime=createUnitRuntimeComposition({
  tickHz:GAME_TICK_HZ,
  abilities:ABILITIES,
  sound:SFX,
  passiveView:()=>({arena,units:battleState.units,enemies:battleState.enemies,projectiles:battleState.projectiles,groundFx:battleState.groundFx,frame:combatRuntimeState.frame}),
  updateView:()=>{
    const lane=arena_laneBounds();
    return {arena,units:battleState.units,enemies:battleState.enemies,projectiles:battleState.projectiles,bombs:battleState.bombs,groundFx:battleState.groundFx,beamFx:battleState.beamFx,frame:combatRuntimeState.frame,arenaLeft:lane.left,arenaRight:lane.right,arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT};
  },
  getBattleArray:key=>battleState[key],
  getFrame:()=>combatRuntimeState.frame,
  getArenaBounds:()=>({top:ARENA_TOP,bottom:ARENA_BOT,left:ARENA_L,right:ARENA_R}),
  addDamageText:addDmg,
  addHealEffect:addHealFx,
  emitParticle:addP,
  showFlash,
  dealDamage,
  randomRange:rnd,
  distance:dist,
  applyTrackedHeal:arena_applyTrackedHeal,
  drainHealToBarrier:arena_drainHealToBarrier,
  perkEffects:arena_perkEffects,
  isCapstoneLevel:arena_isCapstoneLevel,
  zavsAllyDamageMultiplier:arena_zavsAllyDmgMult,
  addBatataShield:arena_addBatataShield,
  addGoldShield:arena_addGoldShield,
  addTaoonBloodShield:arena_addTaoonBloodShield,
  addZavsLineShield:arena_addZavsLineShield,
  applyHealingReceived:arena_applyHealingReceived,
  applyMuddied:arena_applyMuddied,
  clampToLeash:arena_clampToLeash,
  clampToArena,
  findBestEnemyClusterPoint:arena_findBestEnemyClusterPoint,
  fireDivineStorm:arena_fireDivineStorm,
  jazarGuard:arena_jazarGuard,
  jazarSignatureSurge:arena_jazarSignatureSurge,
  moonkinControlBurst:arena_moonkinControlBurst,
  moonkinDisplaceEnemy:arena_moonkinDisplaceEnemy,
  spawnTreant:arena_spawnTreant,
  nerfMinion,
  unitVisualScale:UNIT_VISUAL_SCALE,
  shake:addScreenShake,
  moveToward,
  setSignatureBanner,
  taoonBloodTithe:arena_taoonBloodTithe,
  findJafaarDrainTarget:arena_findJafaarDrainTarget,
  jafaarCurseWeight:arena_jafaarCurseWeight,
  applyJafaarAgony:arena_applyJafaarAgony,
  fireProjectile,
  findEnemyForUnit,
  findRangedEnemyForUnit,
  isGripReserved:arena_isGripReserved,
  isGapCloserReserved:arena_isGapCloserReserved,
  reserveGripTarget:arena_reserveGripTarget,
  reserveGapCloserTarget:arena_reserveGapCloserTarget,
  grantGapInvulnerability:arena_grantGapInvulnerability,
  findUnreservedEnemyInRange:arena_findUnreservedEnemyInRange,
  followFamiliarAnchor:arena_followFamiliarAnchor,
  isReachable:arena_isReachable,
  zavsAllyAtkSpdFactor:arena_zavsAllyAtkSpdFactor,
  applyFelfelDeadlyPoison:arena_applyFelfelDeadlyPoison,
  findBasicSecondTarget:arena_findBasicSecondTarget,
  basicSecondHitFor:arena_basicSecondHitFor,
  applyRuneWound:arena_applyRuneWound,
  isTaoonPriorityEnemy:arena_isTaoonPriorityEnemy,
  isBatataBacklineAlly:arena_isBatataBacklineAlly,
  isZavsMeleeAlly:arena_isZavsMeleeAlly,
  lobBomb
});
const ARENA_SIGNATURES=unitRuntime.signatures;
function arena_applyPassives(...args){return unitRuntime.applyPassives(...args)}
function arena_beaconSplash(...args){return unitRuntime.beaconSplash(...args)}
function arena_updateCharmedEnemy(...args){return unitRuntime.updateCharmedEnemy(...args)}
function arena_spawnFelfelMirror(...args){return unitRuntime.spawnFelfelMirror(...args)}
function arena_spawnGhost(...args){return unitRuntime.spawnGhost(...args)}
function arena_updateUnit(...args){return unitRuntime.updateUnit(...args)}

function arena_canPlace(...args){return placementEconomyRuntime.canPlace(...args)}
function arena_placeUnit(...args){return placementEconomyRuntime.placeUnit(...args)}
function arena_upgradeCell(...args){return placementEconomyRuntime.upgradeCell(...args)}
function arena_sellCell(...args){return placementEconomyRuntime.sellCell(...args)}
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
// OBJECTIVES / WEATHER / STRUCTURES
// =====================
const battleObjectiveRuntime=createBattleObjectiveRuntime({
  tickHz:GAME_TICK_HZ,
  ctx,
  view:()=>({width:W,height:H,arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,arena,currentStage:campaignState.currentStage,playerCastle:campaignState.playerCastle,enemyCastle:campaignState.enemyCastle,bossRef:campaignState.bossRef,units:battleState.units,enemies:battleState.enemies,projectiles:battleState.projectiles,groundFx:battleState.groundFx,beamFx:battleState.beamFx,frame:combatRuntimeState.frame,weatherParticles:environmentState.weatherParticles}),
  distance:dist,
  randomRange:rnd,
  emitParticle:addP,
  addDamageText:addDmg,
  addHealEffect:addHealFx,
  showFlash,
  fireProjectile,
  addCrystal,
  setWeatherParticles,
  dealDamage,
  drawWithClashCamera:arena_drawWithClashCamera,
  shake:addScreenShake
});
function updateCastle(...args){return battleObjectiveRuntime.updateCastle(...args)}
function updateTower(...args){return battleObjectiveRuntime.updateTower(...args)}
function updateCrystalNode(...args){return battleObjectiveRuntime.updateCrystalNode(...args)}
function arena_drainHealToBarrier(amount,srcUnit){
  return arenaBossRuntime.drainHealToBarrier(amount,srcUnit);
}
function arena_timedFieldEffectsContext(...args){return battleObjectiveRuntime.timedFieldEffectsContext(...args)}
function initWeather(...args){return battleObjectiveRuntime.initWeather(...args)}
function drawWeather(...args){return battleObjectiveRuntime.drawWeather(...args)}
function drawWeatherForeground(...args){return battleObjectiveRuntime.drawWeatherForeground(...args)}

// =====================
// ARENA ABILITIES (spell casting)
// =====================
const arenaSpellRuntime=createArenaSpellRuntime({
  tickHz:GAME_TICK_HZ,
  view:()=>({
    arena,units:battleState.units,enemies:battleState.enemies,bombs:battleState.bombs,
    selectedSpells:progressState.selectedSpells,
    abilityUsed:squadState.abilityUsed,
    abilityTargeting:uiState.abilityTargeting,
    gold:economyState.gold,
    width:W,height:H,arenaTop:ARENA_TOP
  }),
  setGold,
  setAbilityTargeting,
  dealDamage,
  applyTrackedHeal:arena_applyTrackedHeal,
  addGoldShield:arena_addGoldShield,
  emitParticle:addP,
  addHealEffect:addHealFx,
  showFlash,
  distance:dist,
  randomRange:rnd,
  shake:addScreenShake
});
function castAbility(...args){return arenaSpellRuntime.castAbility(...args)}
function arena_handleSpellButton(...args){return arenaSpellRuntime.handleSpellButton(...args)}
function arena_activateBloodlust(...args){return arenaSpellRuntime.activateBloodlust(...args)}
function arena_activateTranquility(...args){return arenaSpellRuntime.activateTranquility(...args)}

// =====================
// BATTLE STRUCTURE RENDERING
// =====================
function drawCastle(...args){return battleObjectiveRuntime.drawCastle(...args)}
// =====================
// SCREEN FLOW
// =====================
const arenaScreenUiRuntime=createArenaScreenUiComposition({
  ctx,
  buttonDrawers:arenaButtonDrawers,
  playerUnits:PLAYER_UNITS,
  vodka:VODKA,
  stages:STAGES,
  abilities:ARENA_ABILITIES,
  perks:ARENA_PERKS,
  attackTypeByUnit:ARENA_ATTACK_TYPE_BY_UNIT,
  unitBranches:ARENA_UNIT_BRANCHES,
  maxUnitLevel:ARENA_MAX_UNIT_LEVEL,
  baseSignatures:ARENA_BASE_SIGNATURES,
  branchSignatures:ARENA_BRANCH_SIGNATURES,
  tickHz:GAME_TICK_HZ,
  bloodlustCost:ARENA_BLOODLUST_COST,
  tranquilityCost:ARENA_TRANQUILITY_COST,
  gridCols:GRID_COLS,
  gridRows:GRID_ROWS,
  arenaGridRuntime,
  states:{progressState,battleState,economyState,squadState,campaignState,uiState,combatRuntimeState},
  layoutView:()=>({width:W,height:H,arenaTop:ARENA_TOP,arenaBot:ARENA_BOT}),
  arenaSceneRenderer,
  arenaAudio,
  drawFns,
  signatures:ARENA_SIGNATURES,
  arenaState:()=>arena,
  roleProgression,
  arenaViewMode:arena_viewMode,
  isPaintedPlacementActive:arena_paintedPlacementActive,
  helpers:{
    drawVodka,
    drawPillBtn,
    starText:arena_starText,
    stageStarCriteria:arena_stageStarCriteria,
    getUnitStats,
    wrapText,
    perkSlotCount,
    computeStageStars:arena_computeStageStars,
    shake:addScreenShake,
    levelUpSound:()=>SFX.levelUp(),
    roleRoot:arena_roleRoot,
    canPlace:arena_canPlace,
    unitGoldCost:arena_unitGoldCost,
    getStats,
    placeUnit:arena_placeUnit,
    inRect,
    showFlash,
    getTouchAccumY:()=>arenaInputRuntime.touchAccumY(),
    setTouchAccumY,
    sellRefundForCell,
    isRoleRootCell:arena_isRoleRootCell,
    roleSpecs:arena_roleSpecs,
    specById:arena_specById,
    cellPathMeta:arena_cellPathMeta,
    drawSkillSlots:arena_drawSkillSlots,
    upgradeCostFor:arena_upgradeCostFor,
    pathUpgradeCost:arena_pathUpgradeCost,
    pathDetails:arena_pathDetails,
    baseSpec:arena_baseSpec,
    sigDisplayFc:arena_sigDisplayFc,
    sigDisplayCd:arena_sigDisplayCd,
    baseHeadline:arena_baseHeadline,
    branchHeadline:arena_branchHeadline,
    nextUnlockBrief:arena_nextUnlockBrief,
    wrapTextClamped:arena_wrapTextClamped,
    upgradeCell:arena_upgradeCell,
    sellCell:arena_sellCell,
    setBossWarning,
    getRoundCombatReport,
    getStageCombatReport,
    threatPanelHeight:arena_threatPanelHeight,
    statsFormat:arena_statsFormat,
    currentStageRounds:arena_currentStageRounds,
    drawThreatsPanel:arena_drawThreatsPanel,
    isCapstoneLevel:arena_isCapstoneLevel,
    pathCamQuad:arena_pathCamQuad,
    camPoint:arena_camPoint,
    camDepthScaleAt:arena_camDepthScaleAt
  }
});
function drawMenu(...args){return arenaScreenUiRuntime.drawMenu(...args)}
function drawStageSelect(...args){return arenaScreenUiRuntime.drawStageSelect(...args)}
function drawStageBrief(...args){return arenaScreenUiRuntime.drawStageBrief(...args)}
function drawDeckPick(...args){return arenaScreenUiRuntime.drawDeckPick(...args)}
function drawSpellPick(...args){return arenaScreenUiRuntime.drawSpellPick(...args)}
function drawPerkPick(...args){return arenaScreenUiRuntime.drawPerkPick(...args)}
function drawWinScreen(...args){return arenaScreenUiRuntime.drawWinScreen(...args)}
function drawLoseScreen(...args){return arenaScreenUiRuntime.drawLoseScreen(...args)}
function arena_drawGrid(...args){return arenaScreenUiRuntime.arena_drawGrid(...args)}
function arena_resultButtonRects(...args){return arenaScreenUiRuntime.arena_resultButtonRects(...args)}
function arena_drawRoundCombatReport(...args){return arenaScreenUiRuntime.arena_drawRoundCombatReport(...args)}
function arena_drawStageCombatReport(...args){return arenaScreenUiRuntime.arena_drawStageCombatReport(...args)}
function arena_drawHud(...args){return arenaScreenUiRuntime.arena_drawHud(...args)}
function arena_pickerMaxScroll(...args){return arenaScreenUiRuntime.arena_pickerMaxScroll(...args)}
function arena_handlePickerClick(...args){return arenaScreenUiRuntime.arena_handlePickerClick(...args)}
function arena_handleManagePanelClick(...args){return arenaScreenUiRuntime.arena_handleManagePanelClick(...args)}

// INIT
// =====================
loadSave();
recomputeGrid();
arenaShellRuntime.startLoop();






}

export function createBattleHudRuntime(deps) {
  const ctx = deps.ctx;
  const ARENA_ABILITIES = deps.abilities;
  const PLAYER_UNITS = deps.playerUnits;
  const VODKA = deps.vodka;
  const GAME_TICK_HZ = deps.tickHz;
  const ARENA_BLOODLUST_COST = deps.bloodlustCost;
  const ARENA_TRANQUILITY_COST = deps.tranquilityCost;
  const GRID_COLS = deps.gridCols;
  const GRID_ROWS = deps.gridRows;
  const GRID_X = () => deps.gridX();
  const GRID_Y = () => deps.gridY();
  const CELL_W = () => deps.cellW();
  const CELL_H = () => deps.cellH();
  let W = 500, H = 1000, ARENA_BOT = 820, ARENA_TOP = 88, ARENA_CLASH_CAMERA = false;
  let arena = null, currentStage = null, selectedSpells = [], abilityCooldowns = [], abilityUsed = [], abilityTargeting = -1, arenaViewMode = '25d';
  let bossWarning = 0, stageStartTimer = 0, frame = 0, v8CombatStats = null, gold = 0, playerCastle = null, enemies = [], bossRef = null, _sfxMuted = true;

  const drawBattleHudOverlay = (...args) => deps.drawBattleHudOverlay(...args);
  const renderProjectedBuildGrid = (...args) => deps.renderProjectedBuildGrid(...args);
  const drawBuildGrid = (...args) => deps.drawBuildGrid(...args);
  const drawEncounterPurifyBar = (...args) => deps.drawEncounterPurifyBar(...args);
  const drawEncounterLieutenantsBar = (...args) => deps.drawEncounterLieutenantsBar(...args);
  const drawEncounterBossHpBar = (...args) => deps.drawEncounterBossHpBar(...args);
  const drawEncounterBossCastBar = (...args) => deps.drawEncounterBossCastBar(...args);
  const renderHudRgb = (...args) => deps.renderHudRgb(...args);
  const renderHudShade = (...args) => deps.renderHudShade(...args);
  const renderDrawHudPanel = (...args) => deps.renderDrawHudPanel(...args);
  const renderFitCanvasText = (...args) => deps.renderFitCanvasText(...args);
  const renderDrawHudMeter = (...args) => deps.renderDrawHudMeter(...args);
  const renderDrawHudIcon = (...args) => deps.renderDrawHudIcon(...args);
  const drawRoundReportChip = (...args) => deps.drawRoundReportChip(...args);
  const getResultButtonRects = (...args) => deps.getResultButtonRects(...args);
  const drawResultCombatReportPanel = (...args) => deps.drawResultCombatReportPanel(...args);
  const getRoundCombatReport = (...args) => deps.getRoundCombatReport(...args);
  const getStageCombatReport = (...args) => deps.getStageCombatReport(...args);
  const drawMobileBattleControls = (...args) => deps.drawMobileBattleControls(...args);
  const drawBattleTopChrome = (...args) => deps.drawBattleTopChrome(...args);
  const drawDesktopBattleControls = (...args) => deps.drawDesktopBattleControls(...args);
  const drawPauseMenu = (...args) => deps.drawPauseMenu(...args);
  const arena_threatPanelHeight = (...args) => deps.threatPanelHeight(...args);
  const arena_statsFormat = (...args) => deps.statsFormat(...args);
  const arena_currentStageRounds = (...args) => deps.currentStageRounds(...args);
  const arena_drawThreatsPanel = (...args) => deps.drawThreatsPanel(...args);
  const arena_drawPicker = (...args) => deps.drawPicker(...args);
  const arena_drawManagePanel = (...args) => deps.drawManagePanel(...args);
  const arena_isCapstoneLevel = (...args) => deps.isCapstoneLevel(...args);
  const arena_pathCamQuad = (...args) => deps.pathCamQuad(...args);
  const arena_camPoint = (...args) => deps.camPoint(...args);
  const arena_camDepthScaleAt = (...args) => deps.camDepthScaleAt(...args);
  const setBossWarning = (...args) => deps.setBossWarning(...args);

  function sync() {
    const v = typeof deps.view === 'function' ? deps.view() : {};
    W = v.width || W;
    H = v.height || H;
    ARENA_TOP = v.arenaTop == null ? ARENA_TOP : v.arenaTop;
    ARENA_BOT = v.arenaBot == null ? ARENA_BOT : v.arenaBot;
    ARENA_CLASH_CAMERA = !!v.clashCamera;
    arenaViewMode = v.arenaViewMode || arenaViewMode;
    arena = v.arena || arena;
    currentStage = v.currentStage || currentStage;
    selectedSpells = v.selectedSpells || selectedSpells;
    abilityCooldowns = v.abilityCooldowns || abilityCooldowns;
    abilityUsed = v.abilityUsed || abilityUsed;
    abilityTargeting = v.abilityTargeting == null ? abilityTargeting : v.abilityTargeting;
    bossWarning = v.bossWarning || 0;
    stageStartTimer = v.stageStartTimer || 0;
    frame = v.frame || 0;
    v8CombatStats = v.combatStats || v8CombatStats;
    gold = v.gold || 0;
    playerCastle = v.playerCastle || playerCastle;
    enemies = v.enemies || enemies;
    bossRef = v.bossRef || bossRef;
    _sfxMuted = !!v.soundMuted;
  }

function drawBattleHud(){
  const hud=drawBattleHudOverlay(ctx,{
    width:W,
    height:H,
    stage:currentStage,
    selectedSpells,
    abilities:ARENA_ABILITIES,
    abilityCooldowns,
    abilityUsed,
    abilityTargeting,
    gold,
    bossWarning,
    stageStartTimer,
    tickHz:GAME_TICK_HZ,
    cooldownTickHz:60,
    showSpellButtons:false,
    labels:{spellIcon:'*',stageSeparator:' - '}
  });
  if(hud.spellBtnRects&&hud.spellBtnRects.length){
    spellBtnRects=hud.spellBtnRects;
    if(arena)arena._spellBtnRects=spellBtnRects;
  }
  setBossWarning(hud.bossWarning);
}
let spellBtnRects=[];

// =====================================================================
// arena RENDER + INPUT (Legion TD)
// =====================================================================
function arena_drawProjectedBuildGrid(){
  renderProjectedBuildGrid(ctx,{
    cols:GRID_COLS,
    rows:GRID_ROWS,
    gridX:GRID_X(),
    gridY:GRID_Y(),
    cellW:CELL_W(),
    cellH:CELL_H(),
    cells:arena.cells,
    units:PLAYER_UNITS,
    vodka:VODKA,
    pathCamQuad:arena_pathCamQuad,
    camPoint:arena_camPoint,
    camDepthScaleAt:arena_camDepthScaleAt,
    cellScreenQuad:deps.cellScreenQuad,
    cellScreenPoint:deps.cellScreenPoint,
    isCapstoneLevel:arena_isCapstoneLevel
  });
}
function arena_drawGrid(){
  // arena: only render the placement grid during BUILD phase. Once a wave starts,
  // the grid disappears so the playfield reads cleanly.
  if(arena.phase!=='build')return;
  if(ARENA_CLASH_CAMERA){arena_drawProjectedBuildGrid();return}
  drawBuildGrid(ctx,{
    cols:GRID_COLS,
    rows:GRID_ROWS,
    gridX:GRID_X(),
    gridY:GRID_Y(),
    cellW:CELL_W(),
    cellH:CELL_H(),
    cells:arena.cells,
    units:PLAYER_UNITS,
    vodka:VODKA,
    isCapstoneLevel:arena_isCapstoneLevel
  });
}
// Cinematic boss-purify bar Ã¢â‚¬â€ appears across the top of the screen during the
// Wall Boss phase. Title + green gradient fill + percentage. Sits ABOVE the
// orb so it doesn't compete with the boss visual or overlap squad units.
// Cinematic purify bar Ã¢â‚¬â€ Apple Live-Activity styled card. Sits CLEANLY below
// the top HUD pills (which end at y=54) with 8 px breathing room. Drawn from
// arena_drawHud AFTER the top pills so it layers on top of any spillover.
function arena_drawPurifyBar(pct){
  drawEncounterPurifyBar(ctx,{width:W,pct,frame});
}
// S9 Aerial Boss Ã¢â‚¬â€ lieutenants-remaining card. Shares the same Apple-style
// design language as arena_drawPurifyBar but with gold accent + dot indicators
// for each lieutenant slot. Filled = alive, hollow = defeated.
function arena_drawLieutenantsBar(alive,total){
  drawEncounterLieutenantsBar(ctx,{width:W,alive,total,frame});
}
function arena_drawBossHpBar(b){
  drawEncounterBossHpBar(ctx,{width:W,boss:b,frame});
}
function arena_drawBossCastBar(b){
  drawEncounterBossCastBar(ctx,{width:W,boss:b,frame,tickHz:GAME_TICK_HZ});
}
function arena_hudRgb(col){
  return renderHudRgb(col);
}
function arena_hudShade(col,mul){
  return renderHudShade(col,mul);
}
function arena_hudPanel(x,y,w,h,opt){
  renderDrawHudPanel(ctx,x,y,w,h,opt);
}
function arena_hudFitText(text,x,y,maxW,size,minSize,weight,color,align){
  renderFitCanvasText(ctx,text,x,y,maxW,size,minSize,weight,color,align);
}
function arena_drawHudMeter(x,y,w,h,pct,colA,colB){
  renderDrawHudMeter(ctx,x,y,w,h,pct,colA,colB);
}
function arena_drawHudIcon(kind,cx,cy,r,col){
  renderDrawHudIcon(ctx,kind,cx,cy,r,col);
}
function arena_drawCombatRoundChip(){
  const threat=arena&&arena.waveThreats;
  return drawRoundReportChip(ctx,{
    width:W,
    arenaBot:ARENA_BOT,
    phase:arena&&arena.phase,
    combatStats:v8CombatStats,
    hasThreat:!!threat,
    threatPanelHeight:threat?arena_threatPanelHeight(threat):20,
    formatValue:arena_statsFormat
  });
}
function arena_resultButtonRects(){
  return getResultButtonRects(W,H);
}
function arena_drawCombatReportPanel(title,subtitle,damageList,healList,x,y,w,h,accent){
  return drawResultCombatReportPanel(ctx,{title,subtitle,damageList,healList,x,y,w,h,accent,formatValue:arena_statsFormat});
}
function arena_drawRoundCombatReport(x,y,w,h){
  const report=getRoundCombatReport(v8CombatStats);
  if(!report)return false;
  return arena_drawCombatReportPanel(report.title,report.subtitle,report.damageList,report.healList,x,y,w,h,report.accent);
}
function arena_drawStageCombatReport(x,y,w,h){
  const report=getStageCombatReport(v8CombatStats,GAME_TICK_HZ);
  if(!report)return false;
  return arena_drawCombatReportPanel(report.title,report.subtitle,report.damageList,report.healList,x,y,w,h,report.accent);
}
function arena_activeSpellButtons(){
  return selectedSpells.map((abilityIdx,slotIdx)=>{
    const ability=ARENA_ABILITIES[abilityIdx];
    if(!ability)return null;
    return {
      idx:slotIdx,
      label:String(ability.name||'SPELL').toUpperCase(),
      color:ability.color||'#7239a0',
      used:!!abilityUsed[slotIdx],
      timer:0,
      cost:ability.cost||0,
      targeting:abilityTargeting===slotIdx,
      icon:'sword'
    };
  }).filter(Boolean).slice(0,2);
}
function arena_drawMobileBattleHud(){
  const activeSkills=arena_activeSpellButtons();
  const rects=drawMobileBattleControls(ctx,{
    width:W,
    height:H,
    phase:arena.phase,
    gold,
    castle:playerCastle||{hp:0,maxHp:1},
    activeSkills,
    frame,
    tickHz:GAME_TICK_HZ,
    enemyCount:enemies.filter(e=>e.hp>0).length
  });
  arena._startWaveRect=rects.startWave;
  spellBtnRects=rects.spells||[];
  arena._spellBtnRects=spellBtnRects;
  arena._bloodlustRect=null;
  arena._tranquilityRect=null;
  ctx.textAlign='left';
}
function arena_drawHud(){
  // Solid dark header + footer Ã¢â‚¬â€ covers aura bleed so HUD has clean bg
  ctx.fillStyle='#0a0a1a';
  ctx.fillRect(0,0,W,ARENA_TOP);
  ctx.fillRect(0,ARENA_BOT,W,H-ARENA_BOT);
  // Threats panel Ã¢â‚¬â€ Apple-style card showing next-wave composition with
  // armor/movement/archetype tag chips. Drawn first so the rest of the HUD
  // overlaps it on top (panel sits below the top HUD pills, in the spawn band).
  arena_drawThreatsPanel();
  arena_drawCombatRoundChip();
  // ============ TOP HUD ============
  const topChrome=drawBattleTopChrome(ctx,{
    width:W,
    phase:arena.phase,
    waveThreats:arena.waveThreats,
    stage:currentStage,
    round:arena.round,
    totalRounds:arena_currentStageRounds()
  });
  arena._pauseBtnRect=topChrome.pause;
  arena._arenaViewToggleRect=null;
  arena._testResetRect=null;arena._testGoldRect=null;arena._testQuitRect=null;
  // Purify bar (S7 Wall Boss) + Lieutenants bar (S12/S9 Aerial Boss) Ã¢â‚¬â€ drawn
  // AFTER top HUD pills so they layer on top if any overlap. Both share the
  // same Apple-style "encounter card" design language.
  if(arena.activeBarrier){
    const bar=arena.activeBarrier;
    const pct=Math.max(0,Math.min(1,(bar.healHp||0)/(bar.healHpMax||1)));
    arena_drawPurifyBar(pct);
  }else if(arena.lieutenants&&arena.lieutenants.length){
    const alive=arena.lieutenants.filter(l=>l.hp>0).length;
    const total=arena.lieutenants.length;
    if(alive>0)arena_drawLieutenantsBar(alive,total);
  }else if(bossRef&&bossRef.hp>0&&!bossRef.untargetable){
    arena_drawBossHpBar(bossRef);
    arena_drawBossCastBar(bossRef);
  }
  // ============ BOTTOM HUD ============
  const activeSkills=arena_activeSpellButtons();
  const desktopControls=drawDesktopBattleControls(ctx,{
    width:W,
    height:H,
    phase:arena.phase,
    gold,
    castle:playerCastle,
    activeSkills,
    frame,
    tickHz:GAME_TICK_HZ,
    enemyCount:enemies.filter(e=>e.hp>0).length,
    labels:{startWaveSub:'TAP TO BEGIN',activeSeparator:' - '}
  });
  arena._startWaveRect=desktopControls.startWave;
  spellBtnRects=desktopControls.spells||[];
  arena._spellBtnRects=spellBtnRects;
  arena._bloodlustRect=null;
  arena._tranquilityRect=null;
  arena_drawMobileBattleHud();
  drawBattleHud();
  ctx.textAlign='left';
  // Picker / manage modal overlays
  if(arena.pickerOpen)arena_drawPicker();
  if(arena.managePanelCell)arena_drawManagePanel();
  // Pause menu overlay
  if(arena.pauseMenu)arena_drawPauseMenu();
}
function arena_drawPauseMenu(){
  const rects=drawPauseMenu(ctx,{
    width:W,
    height:H,
    stage:currentStage,
    arenaViewMode,
    soundMuted:_sfxMuted,
    labels:{stageSeparator:' - '}
  });
  arena._pauseResumeRect=rects.resume;
  arena._pauseArenaViewRect=rects.arenaView;
  arena._pauseRestartRect=rects.restart;
  arena._pauseQuitRect=rects.quit;
  arena._pauseSoundRect=rects.sound;
}

  const api = {
    drawBattleHud,
    arena_drawProjectedBuildGrid,
    arena_drawGrid,
    arena_drawPurifyBar,
    arena_drawLieutenantsBar,
    arena_drawBossHpBar,
    arena_drawBossCastBar,
    arena_hudRgb,
    arena_hudShade,
    arena_hudPanel,
    arena_hudFitText,
    arena_drawHudMeter,
    arena_drawHudIcon,
    arena_drawCombatRoundChip,
    arena_resultButtonRects,
    arena_drawCombatReportPanel,
    arena_drawRoundCombatReport,
    arena_drawStageCombatReport,
    arena_drawMobileBattleHud,
    arena_drawHud,
    arena_drawPauseMenu,
  };
  for (const key of Object.keys(api)) {
    const fn = api[key];
    api[key] = (...args) => { sync(); return fn(...args); };
  }
  return api;
}

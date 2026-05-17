import { GAME_TICK_HZ } from '../core/constants.js';
import { PLAYER_UNITS, VODKA } from '../data/units.js';
import { ENEMIES } from '../data/enemies.js';
import { ARENA_UNIT_BRANCHES } from '../data/passives.js';
import { ARENA_SPRITE_BUILD_SCALE, ARENA_SPRITE_WAVE_SCALE, drawUnitSprite as renderDrawUnitSprite, loadSpriteFrameSet, loadUnitSpriteAssets, pickAnimFrame as renderPickAnimFrame, refreshFelfelPoisonGreenFrames } from './sprites.js';
import { drawHealthBar } from './health-bars.js';
import { collectStatusIcons, drawStatusIconChips } from './status-icons.js';
import { drawVodkaSprite } from './vodka.js';
import { drawSummonSprite as renderDrawSummonSprite } from './summon-sprites.js';
import { drawEnemyVfxOver as renderDrawEnemyVfxOver, drawEnemyVfxUnder as renderDrawEnemyVfxUnder, drawPlayerAuraOver as renderDrawPlayerAuraOver, drawPlayerAuraUnder as renderDrawPlayerAuraUnder, playerVfxColor as renderPlayerVfxColor } from './actor-vfx.js';
import { createBossSpriteRenderer } from './boss-sprites.js';
import { createEnemySpriteRenderer } from './enemy-sprites.js';
import { createCompanionSpriteRenderer } from './companion-sprites.js';
import { createUnitSpriteOverlayRenderer } from './unit-sprite-overlays.js';
import { projectileColor } from '../systems/combat-projectiles.js';

export function createActorRenderer(deps) {
  const ctx = deps.ctx;
  let W = 500, frame = 0, state = 'menu', arena = null, ARENA_TOP = 0;
  let units = [], groundFx = [];
  const rnd = typeof deps.randomRange === 'function' ? deps.randomRange : ((min, max) => min + Math.random() * (max - min));
  const addP = (...args) => deps.emitParticle(...args);
  const addHealFx = (...args) => deps.addHealEffect(...args);
  const arena_applyHealingReceived = (...args) => deps.applyHealingReceived(...args);
  const arena_applyTrackedHeal = (...args) => deps.applyTrackedHeal(...args);
  const arena_drawSpecAccessory = (...args) => deps.drawSpecAccessory(...args);
  const arena_drawWithClashCamera = (...args) => deps.drawWithClashCamera(...args);
  const arena_overlayOffsetFor = (...args) => deps.overlayOffsetFor(...args);

  function sync() {
    const v = typeof deps.view === 'function' ? deps.view() : {};
    W = v.width || W;
    frame = v.frame || 0;
    state = v.state || state;
    arena = v.arena || arena;
    ARENA_TOP = v.arenaTop == null ? ARENA_TOP : v.arenaTop;
    units = Array.isArray(v.units) ? v.units : units;
    groundFx = Array.isArray(v.groundFx) ? v.groundFx : groundFx;
  }

let _zataarReady=false;
const _zataarFrames=loadSpriteFrameSet('Zataar_Walking ',4,{onReady:()=>{_zataarReady=true}}).frames;
let _alibabaReady=false;
const _alibabaFrames=loadSpriteFrameSet('Alibaba_Flying ',3,{onReady:()=>{_alibabaReady=true}}).frames;
let _jafaarReady=false;
const _jafaarFrames=loadSpriteFrameSet('Jafaar_Flying ',5,{onReady:()=>{_jafaarReady=true}}).frames;
const _jafaarDemonFrames=[];let _jafaarDemonReady=false;
const _jafaarDestructionFrames=[];let _jafaarDestructionReady=false;
let _zavsReady=false;
const _zavsFrames=loadSpriteFrameSet('Zavs_Walking ',6,{onReady:()=>{_zavsReady=true}}).frames;
let _kingReady=false;
const _kingFrames=loadSpriteFrameSet('King_Walking ',5,{onReady:()=>{_kingReady=true}}).frames;
let _kingProtReady=false;
const _kingProtFrames=loadSpriteFrameSet('King_Walking_Prot ',5,{onReady:()=>{_kingProtReady=true}}).frames;
let _batataFlyingReady=false;
const _batataFlyingFrames=loadSpriteFrameSet('Batata_Flying ',6,{onReady:()=>{_batataFlyingReady=true}}).frames;
let _batataFlyingBlueReady=false;
const _batataFlyingBlueFrames=loadSpriteFrameSet('Batata_Flying_Blue ',6,{onReady:()=>{_batataFlyingBlueReady=true}}).frames;
let _batataFlyingRedReady=false;
const _batataFlyingRedFrames=loadSpriteFrameSet('Batata_Flying_Red ',6,{onReady:()=>{_batataFlyingRedReady=true}}).frames;
let _rommanaReady=false;
const _rommanaFrames=loadSpriteFrameSet('Rommana_Walking ',4,{onReady:()=>{_rommanaReady=true}}).frames;
let _taoonReady=false;
const _taoonFrames=loadSpriteFrameSet('Taoon_Walking ',3,{onReady:()=>{_taoonReady=true}}).frames;
let _taoonBlueReady=false;
const _taoonBlueFrames=loadSpriteFrameSet('Taoon_Walking_Blue ',3,{onReady:()=>{_taoonBlueReady=true}}).frames;
let _taoonGreenReady=false;
const _taoonGreenFrames=loadSpriteFrameSet('Taoon_Walking_Green ',3,{onReady:()=>{_taoonGreenReady=true}}).frames;
let _felfelBaseReady=false;
const _felfelBaseFrames=loadSpriteFrameSet('Felfel_Flying_Red ',4,{onReady:()=>{_felfelBaseReady=true}}).frames;
let _felfelShadowReady=false;
const _felfelShadowFrames=loadSpriteFrameSet('Felfel_Flying ',4,{onReady:()=>{_felfelShadowReady=true}}).frames;
let _felfelPoisonReady=false;
const _felfelPoisonGreenFrames=[];let _felfelPoisonGreenReady=false;
const _felfelPoisonFrames=loadSpriteFrameSet('Felfel_Flying_Poison ',4,{onReady:()=>{_felfelPoisonReady=true;_felfelPoisonGreenReady=refreshFelfelPoisonGreenFrames(_felfelPoisonFrames,_felfelPoisonGreenFrames)}}).frames;
let _jazarReady=false;
const _jazarFrames=loadSpriteFrameSet('Jazara_Flying ',5,{onReady:()=>{_jazarReady=true}}).frames;
let _jazarYellowReady=false;
const _jazarYellowFrames=loadSpriteFrameSet('Jazara_Flying_Yellow ',5,{onReady:()=>{_jazarYellowReady=true}}).frames;
let _jazarBlueReady=false;
const _jazarBlueFrames=loadSpriteFrameSet('Jazara_Flying_Blue ',5,{onReady:()=>{_jazarBlueReady=true}}).frames;
let _habaqBaseReady=false;
const _habaqBaseFrames=loadSpriteFrameSet('Habaq_Flying ',3,{onReady:()=>{_habaqBaseReady=true}}).frames;
let _habaqBlueReady=false;
const _habaqBlueFrames=loadSpriteFrameSet('Habaq_Flying_Blue ',3,{onReady:()=>{_habaqBlueReady=true}}).frames;
let _habaqRedReady=false;
const _habaqRedFrames=loadSpriteFrameSet('Habaq_Flying_Red ',3,{onReady:()=>{_habaqRedReady=true}}).frames;
let _bakdounesFlyingReady=false;
const _bakdounesFlyingFrames=loadSpriteFrameSet('Druid_Flying ',5,{onReady:()=>{_bakdounesFlyingReady=true}}).frames;
const _v8UnitSprites=loadUnitSpriteAssets();
let _nanaaBaseReady=false;
const _nanaaBaseFrames=loadSpriteFrameSet('Nanaa_Flying ',5,{onReady:()=>{_nanaaBaseReady=true}}).frames;
let _nanaaHealerReady=false;
const _nanaaHealerFrames=loadSpriteFrameSet('Nanaa_Flying_Healer ',5,{onReady:()=>{_nanaaHealerReady=true}}).frames;
const companionSprites=createCompanionSpriteRenderer(ctx);
const unitSpriteOverlays=createUnitSpriteOverlayRenderer({
  ctx,
  view:()=>({frame}),
  randomRange:rnd,
  emitParticle:addP
});

function arena_drawUnitSprite(img,x,y,u,opts){
  return renderDrawUnitSprite(ctx,{img,x,y,unit:u,isWave:arena&&arena.phase==='wave',options:opts||{}});
}
function arena_pickAnimFrame(frames,ready,speed){
  return renderPickAnimFrame(frames,ready,frame,speed);
}
// Canvas adapts to device portrait ratio (clamped 4:3 Ã¢â€ â€ 19.5:9):
//   iPad / 4:3 portrait                Ã¢â€ â€™  500Ãƒâ€”667  (1.33:1)
//   iPhone 7 (16:9)                    Ã¢â€ â€™  500Ãƒâ€”890  (1.78:1)
//   modern iPhones (X..17 Pro Max)     Ã¢â€ â€™  500Ãƒâ€”1085 (2.17:1)
// Every supported device fills the screen exactly with no letterboxing.
function arena_drawSummonSprite(x,y,u){
  return renderDrawSummonSprite(ctx,{
    x,
    y,
    unit:u,
    unitSprites:_v8UnitSprites,
    frame,
    drawUnitSprite:arena_drawUnitSprite,
    randomRange:rnd,
    emitParticle:addP
  });
}

function projColor(t){
  return projectileColor(t);
}
function arena_playerVfxColor(u){
  return renderPlayerVfxColor(u);
}
function arena_drawPlayerAuraUnder(u,x,y,s){
  renderDrawPlayerAuraUnder(ctx,{unit:u,x,y,size:s,frame});
}
function arena_drawPlayerAuraOver(u,x,y,s){
  renderDrawPlayerAuraOver(ctx,{unit:u,x,y,size:s,frame,emitParticle:addP,randomRange:rnd});
}

// =====================
// DRAWING Ã¢â‚¬â€ UNITS
// =====================
function drawUnit(u){
  if(!u||u.hp<=0)return;
  arena_drawWithClashCamera(u.x,u.y,()=>drawUnitRaw(u));
}
function drawUnitRaw(u){
  if(u.hp<=0)return;
  if(!Number.isFinite(u.x)||!Number.isFinite(u.y))return;
  if(!Number.isFinite(u.bobPhase))u.bobPhase=0;
  if(!Number.isFinite(u.size)||u.size<=0)u.size=16;
  const bob=Math.sin(u.bobPhase)*1.2;
  const y=u.y+bob;
  // Universal hit flash Ã¢â‚¬â€ same as enemies. Bright white ellipse fades over ~6 frames.
  // Render at the END of this fn so it sits on top; for now stash a flag.
  const _hitF=u.hitFlash||0;
  // Ghost (Rumman P2 L3): translucent skull with trailing mist.
  if(u.isGhost){
    ctx.save();
    ctx.globalAlpha=0.55+Math.sin(frame*0.18)*0.15;
    // Trail
    for(let i=1;i<=3;i++){
      ctx.globalAlpha=0.18-i*0.04;
      ctx.fillStyle='#ddddff';
      ctx.beginPath();ctx.arc(u.x-(u.facing||1)*i*4,y+i*1.5,u.size-i,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=0.7+Math.sin(frame*0.2)*0.12;
    // Body
    ctx.fillStyle='#ddddff';
    ctx.beginPath();ctx.arc(u.x,y-2,u.size,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#9999cc';
    ctx.beginPath();ctx.arc(u.x-3,y-3,1.6,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(u.x+3,y-3,1.6,0,Math.PI*2);ctx.fill();
    // Wisps
    ctx.strokeStyle='#ddddff';ctx.lineWidth=1.5;
    ctx.beginPath();
    for(let i=0;i<4;i++){
      const a=frame*0.06+i*Math.PI/2;
      ctx.moveTo(u.x+Math.cos(a)*(u.size+1),y+Math.sin(a)*(u.size+1));
      ctx.lineTo(u.x+Math.cos(a)*(u.size+5),y+Math.sin(a)*(u.size+5));
    }
    ctx.stroke();
    ctx.restore();
    return;
  }
  arena_drawPlayerAuraUnder(u,u.x,y,u.size);
  if(u.stealth&&u.stealthHits===0&&!u.vanishActive){
    ctx.globalAlpha=0.35;
  }
  // ===== WHIRLWIND VFX Ã¢â‚¬â€ spinning blade ring + motion-blur slashes =====
  // Renders BEHIND the sprite so blades sweep around the unit. WoW-warrior-tier
  // spectacle: 4 white crescent slashes rotating fast, gold/cyan motion blur.
  if(u.whirlwindFx>0){
    ctx.save();
    const _wfR=u.whirlwindFxR||80;
    const _wfCol=u.whirlwindFxColor||'#ffe066';
    const _spin=frame*0.6+u.whirlwindFx*0.3;
    // 4 sweeping crescent slashes
    for(let _bi=0;_bi<4;_bi++){
      const _ba=_spin+_bi*Math.PI/2;
      ctx.save();ctx.translate(u.x,y);ctx.rotate(_ba);
      ctx.strokeStyle='#ffffff';ctx.lineWidth=2.5;ctx.globalAlpha=0.9*(u.whirlwindFx/24);
      ctx.beginPath();ctx.arc(0,0,_wfR*0.7,-0.4,0.4);ctx.stroke();
      ctx.strokeStyle=_wfCol;ctx.lineWidth=1.2;ctx.globalAlpha=0.7*(u.whirlwindFx/24);
      ctx.beginPath();ctx.arc(0,0,_wfR*0.55,-0.5,0.5);ctx.stroke();
      ctx.restore();
    }
    // Soft glowing inner ring
    ctx.globalAlpha=0.2*(u.whirlwindFx/24);
    ctx.strokeStyle=_wfCol;ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(u.x,y,_wfR*0.45,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // ===== SIGNATURE CAST FLASH Ã¢â‚¬â€ bright halo briefly after sig fires =====
  // Drawn BEFORE the sprite so the halo encloses the unit. Fades over 18 frames.
  if(u.signatureCastFx>0){
    ctx.save();
    const _csf=u.signatureCastFx/18;
    const _csR=u.size*2.0+(1-_csf)*16;
    ctx.strokeStyle='#ffd700';ctx.lineWidth=3;ctx.globalAlpha=_csf*0.85;
    ctx.beginPath();ctx.arc(u.x,y,_csR,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.globalAlpha=_csf;
    ctx.beginPath();ctx.arc(u.x,y,_csR-3,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // L5 rotating gold halo Ã¢â‚¬â€ drawn BEFORE the sprite so it sits behind the unit.
  // Persistent premium tier signal that reads at a glance even in chaotic waves.
  // Outer dashed ring spins via lineDashOffset, inner soft ring pulses with a sine.
  if((u.cellLevel||u.level||1)>=5&&!u.isMinion&&!u.isGhost&&!u.isMirror){
    ctx.save();
    const _haloR=(u.size||16)*1.55;
    ctx.strokeStyle='#ffd700';ctx.lineWidth=1.6;
    ctx.globalAlpha=0.55;
    ctx.setLineDash([5,4]);ctx.lineDashOffset=-frame*0.4;
    ctx.beginPath();ctx.arc(u.x,y,_haloR,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha=0.20+Math.sin(frame*0.08)*0.06;
    ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(u.x,y,_haloR-3,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Level-up size punch: brief 1.0 Ã¢â€ â€™ 1.30 Ã¢â€ â€™ 1.0 over 20 frames so upgrades
  // get a visible "pop." Restored before next call so layout/auras stay correct.
  // Also temporarily swap u.color/u.accent for level-tinted versions so higher-
  // level units render brighter (drawFns just read these properties).
  let _origSize=null,_origColor=null,_origAccent=null;
  if(u.levelUpPunch>0){
    _origSize=u.size;
    u.size=u.size*(1+0.30*(u.levelUpPunch/20));
  }
  if(u.levelTier>1){
    if(u.levelColor){_origColor=u.color;u.color=u.levelColor}
    if(u.levelAccent){_origAccent=u.accent;u.accent=u.levelAccent}
  }
  if(u.isHero)drawVodka(u.x,y,u);
  else if(u.isMinion){
    if(arena_drawSummonSprite(u.x,y,u)){
      // Themed summon sprite drawn.
    }
    else if(u.kind==='bear')drawBear(u.x,y,u);
    else if(u.kind==='wolf'){
      const es=u.size;const _f=u.facing||1;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+es,es*0.5,es*0.12,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=u.color;ctx.beginPath();ctx.ellipse(u.x,y,es*0.85,es*0.6,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=u.accent;ctx.beginPath();ctx.ellipse(u.x+_f*es*0.45,y-es*0.15,es*0.35,es*0.35,0,0,Math.PI*2);ctx.fill();
      // Ears
      ctx.fillStyle=u.color;
      ctx.beginPath();ctx.moveTo(u.x+_f*es*0.25,y-es*0.55);ctx.lineTo(u.x+_f*es*0.40,y-es*0.85);ctx.lineTo(u.x+_f*es*0.55,y-es*0.55);ctx.fill();
      ctx.beginPath();ctx.moveTo(u.x+_f*es*0.55,y-es*0.55);ctx.lineTo(u.x+_f*es*0.70,y-es*0.80);ctx.lineTo(u.x+_f*es*0.80,y-es*0.50);ctx.fill();
      // Eyes
      ctx.fillStyle='#ffcc00';ctx.beginPath();ctx.arc(u.x+_f*es*0.35,y-es*0.25,2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(u.x+_f*es*0.55,y-es*0.25,2,0,Math.PI*2);ctx.fill();
      // Snout
      ctx.fillStyle='#333';ctx.beginPath();ctx.arc(u.x+_f*es*0.65,y-es*0.05,2,0,Math.PI*2);ctx.fill();
    }
    else if(u.kind==='raptor'){
      const es=u.size;const _f=u.facing||1;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+es,es*0.4,es*0.10,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=u.color;ctx.beginPath();ctx.ellipse(u.x,y,es*0.7,es*0.55,0,0,Math.PI*2);ctx.fill();
      // Head crest
      ctx.fillStyle=u.accent;
      ctx.beginPath();ctx.moveTo(u.x+_f*es*0.3,y-es*0.5);ctx.lineTo(u.x+_f*es*0.5,y-es*0.85);ctx.lineTo(u.x+_f*es*0.65,y-es*0.4);ctx.fill();
      // Beak
      ctx.fillStyle='#cc9922';
      ctx.beginPath();ctx.moveTo(u.x+_f*es*0.5,y-es*0.15);ctx.lineTo(u.x+_f*es*0.85,y-es*0.05);ctx.lineTo(u.x+_f*es*0.5,y+es*0.1);ctx.fill();
      // Eye
      ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(u.x+_f*es*0.4,y-es*0.25,1.5,0,Math.PI*2);ctx.fill();
      // Tail feathers
      ctx.strokeStyle=u.accent;ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(u.x-_f*es*0.5,y+es*0.1);ctx.lineTo(u.x-_f*es*0.8,y-es*0.1);ctx.stroke();
      ctx.beginPath();ctx.moveTo(u.x-_f*es*0.5,y+es*0.2);ctx.lineTo(u.x-_f*es*0.85,y+es*0.15);ctx.stroke();
    }
    else if(u.kind==='spiritBeast'){
      const es=u.size;const _f=u.facing||1;
      ctx.save();
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+es,es*0.5,es*0.12,0,0,Math.PI*2);ctx.fill();
      // Ghostly body with transparency
      ctx.globalAlpha=0.7+Math.sin(frame*0.08)*0.15;
      ctx.fillStyle=u.color;ctx.beginPath();ctx.ellipse(u.x,y,es*0.9,es*0.65,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=u.accent;ctx.beginPath();ctx.ellipse(u.x+_f*es*0.5,y-es*0.1,es*0.35,es*0.4,0,0,Math.PI*2);ctx.fill();
      // Ethereal ears
      ctx.fillStyle=u.color;
      ctx.beginPath();ctx.moveTo(u.x+_f*es*0.3,y-es*0.6);ctx.lineTo(u.x+_f*es*0.45,y-es*0.95);ctx.lineTo(u.x+_f*es*0.6,y-es*0.6);ctx.fill();
      // Glowing eyes
      ctx.fillStyle='#aaffaa';ctx.beginPath();ctx.arc(u.x+_f*es*0.4,y-es*0.25,2.5,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(u.x+_f*es*0.6,y-es*0.25,2.5,0,Math.PI*2);ctx.fill();
      ctx.restore();
      // Spirit particles
      if(frame%5===0)addP(u.x+rnd(-es*0.5,es*0.5),u.y-es*0.5,'#3aa84e',1,2);
    }
    else if(u.kind==='direBeast'){
      const es=u.size;const _f=u.facing||1;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+es,es*0.5,es*0.12,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=u.color;ctx.beginPath();ctx.ellipse(u.x,y,es*0.8,es*0.55,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=u.accent;ctx.beginPath();ctx.ellipse(u.x+_f*es*0.4,y-es*0.15,es*0.35,es*0.35,0,0,Math.PI*2);ctx.fill();
      // Horns
      ctx.strokeStyle='#aa8844';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(u.x+_f*es*0.2,y-es*0.55);ctx.lineTo(u.x+_f*es*0.1,y-es*0.85);ctx.stroke();
      ctx.beginPath();ctx.moveTo(u.x+_f*es*0.5,y-es*0.5);ctx.lineTo(u.x+_f*es*0.55,y-es*0.8);ctx.stroke();
      // Eyes
      ctx.fillStyle='#ff6600';ctx.beginPath();ctx.arc(u.x+_f*es*0.35,y-es*0.25,2,0,Math.PI*2);ctx.fill();
      // Tusks
      ctx.strokeStyle='#eeddcc';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(u.x+_f*es*0.55,y);ctx.lineTo(u.x+_f*es*0.75,y+es*0.1);ctx.stroke();
    }
    else if(u.kind==='turret'){
      const ts=u.size;
      const _tgt=u.target;const _gang=_tgt?Math.atan2(_tgt.y-u.y,_tgt.x-u.x):0;
      const _romTurret=u.parent&&u.parent.unitIdx===9;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+ts,ts*0.55,ts*0.12,0,0,Math.PI*2);ctx.fill();
      if(_romTurret){
        const _art=!!u._turretArtillery;
        ctx.fillStyle=_art?'#c02d5f':'#d84f87';
        ctx.beginPath();ctx.ellipse(u.x,y+ts*0.18,ts*0.58,ts*0.45,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#d9a52a';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(u.x,y+ts*0.15,ts*0.52,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='#ffd36a';ctx.fillRect(u.x-ts*0.46,y+ts*0.58,ts*0.92,ts*0.16);
        ctx.fillStyle='#fff1c8';
        for(let i=-2;i<=2;i++){ctx.beginPath();ctx.arc(u.x+i*ts*0.22,y+ts*0.48,ts*0.08,0,Math.PI*2);ctx.fill()}
        ctx.save();ctx.translate(u.x,y);ctx.rotate(_gang);
        ctx.fillStyle='#d9a52a';ctx.fillRect(0,-ts*(_art?0.14:0.10),ts*(_art?1.2:0.85),ts*(_art?0.28:0.20));
        ctx.fillStyle='#7a4a10';ctx.fillRect(ts*0.18,-ts*(_art?0.08:0.055),ts*(_art?0.75:0.52),ts*(_art?0.16:0.11));
        ctx.fillStyle=_art?'#ffcc66':'#ff5ca8';ctx.beginPath();ctx.arc(ts*(_art?1.22:0.88),0,ts*(_art?0.15:0.11),0,Math.PI*2);ctx.fill();
        ctx.restore();
        if(u._cmdOrigDmg||u._siegeModeTimer>0){
          ctx.strokeStyle='#ffcc66';ctx.lineWidth=2;ctx.globalAlpha=0.45+0.2*Math.sin(frame*0.18);
          ctx.beginPath();ctx.arc(u.x,y+ts*0.12,ts*0.9,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
        }
      }else{
        ctx.fillStyle=u.color;ctx.fillRect(u.x-ts*0.4,y+ts*0.2,ts*0.8,ts*0.6);
        ctx.fillStyle=u.accent;ctx.fillRect(u.x-ts*0.5,y+ts*0.7,ts*0.25,ts*0.35);ctx.fillRect(u.x+ts*0.25,y+ts*0.7,ts*0.25,ts*0.35);
        ctx.fillStyle=u._turretArtillery?'#5a6a2a':'#997744';
        ctx.fillRect(u.x-ts*0.15,y-ts*0.3,ts*0.3,ts*0.6);
        ctx.save();ctx.translate(u.x,y);ctx.rotate(_gang);
        ctx.fillStyle='#555';ctx.fillRect(0,-ts*0.08,ts*0.8,ts*0.16);
        ctx.fillStyle='#333';ctx.beginPath();ctx.arc(ts*0.8,0,ts*0.1,0,Math.PI*2);ctx.fill();
        ctx.restore();
        ctx.fillStyle='#ff4400';ctx.beginPath();ctx.arc(u.x,y-ts*0.1,ts*0.08+Math.sin(frame*0.1)*ts*0.02,0,Math.PI*2);ctx.fill();
      }
    }
    else if(u.kind==='mechTurret'){
      const ts=u.size;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+ts*0.7,ts*0.4,ts*0.1,0,0,Math.PI*2);ctx.fill();
      // Hover body Ã¢â‚¬â€ rounded rect with thruster glow
      ctx.fillStyle='#d84f87';ctx.beginPath();ctx.arc(u.x,y,ts*0.58,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#d9a52a';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(u.x,y,ts*0.62,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#fff1c8';ctx.beginPath();ctx.arc(u.x-ts*0.25,y-ts*0.18,ts*0.14,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(u.x+ts*0.20,y+ts*0.25,ts*0.12,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffd36a';ctx.fillRect(u.x-ts*0.38,y+ts*0.22,ts*0.76,ts*0.16);
      // Barrel aimed at target
      const _tgt=u.target;const _gang=_tgt?Math.atan2(_tgt.y-u.y,_tgt.x-u.x):0;
      ctx.save();ctx.translate(u.x,y);ctx.rotate(_gang);
      ctx.fillStyle='#d9a52a';ctx.fillRect(0,-ts*0.07,ts*0.75,ts*0.14);
      ctx.fillStyle='#7a4a10';ctx.fillRect(ts*0.18,-ts*0.04,ts*0.42,ts*0.08);
      ctx.fillStyle='#ff5ca8';ctx.beginPath();ctx.arc(ts*0.78,0,ts*0.09,0,Math.PI*2);ctx.fill();
      ctx.restore();
      // Thruster glow
      ctx.fillStyle='#ffb3d1';ctx.beginPath();ctx.arc(u.x,y+ts*0.5,ts*0.15+Math.sin(frame*0.2)*ts*0.04,0,Math.PI*2);ctx.fill();
      // Indicator light
      ctx.fillStyle='#ffec99';ctx.beginPath();ctx.arc(u.x,y-ts*0.35,ts*0.06,0,Math.PI*2);ctx.fill();
    }
    else if(u.kind==='repairBot'){
      const rs=u.size;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+rs,rs*0.4,rs*0.08,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=u.color;ctx.beginPath();ctx.arc(u.x,y,rs*0.7,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(u.x-rs*0.25,y);ctx.lineTo(u.x+rs*0.25,y);ctx.moveTo(u.x,y-rs*0.25);ctx.lineTo(u.x,y+rs*0.25);ctx.stroke();
      const _pa=frame*0.15;
      ctx.strokeStyle='#44cc8866';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(u.x,y,rs*0.9,_pa,_pa+Math.PI);ctx.stroke();
      if(frame%4===0)addP(u.x+rnd(-5,5),y+rs*0.5,'#44cc88',1,2);
    }
    else if(u.kind==='undead'){
      const fn=drawFns[u.drawFn||'drawJazar'];
      if(fn)fn(u.x,y,u);
    }
    else if(u.kind==='clone'){
      const fn=drawFns[u.drawFn||'drawJazar'];
      if(fn)fn(u.x,y,u);
    }
    else if(u.kind==='ghoul'){
      const gs=u.size;
      ctx.fillStyle='#4a6a2a';ctx.beginPath();ctx.ellipse(u.x,y,gs*0.7,gs*0.9,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#2a4010';ctx.beginPath();ctx.ellipse(u.x,y+gs*0.3,gs*0.5,gs*0.3,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#88ff88';ctx.beginPath();ctx.arc(u.x-gs*0.15,y-gs*0.2,1.5,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(u.x+gs*0.15,y-gs*0.2,1.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#333';ctx.fillRect(u.x+gs*0.3,y-gs*0.1,gs*0.15,gs*0.5);
    }
    else if(u.kind==='treant'){
      const ts=u.size;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+ts,ts*0.4,ts*0.1,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5a3a1a';ctx.fillRect(u.x-ts*0.15,y-ts*0.1,ts*0.3,ts*0.8);
      ctx.fillStyle='#3a2a0a';ctx.fillRect(u.x-ts*0.08,y+ts*0.2,ts*0.06,ts*0.5);
      ctx.fillRect(u.x+ts*0.05,y+ts*0.3,ts*0.06,ts*0.4);
      ctx.fillStyle='#33aa33';ctx.beginPath();ctx.arc(u.x,y-ts*0.3,ts*0.55,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#44cc44';ctx.beginPath();ctx.arc(u.x-ts*0.15,y-ts*0.45,ts*0.3,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(u.x+ts*0.2,y-ts*0.35,ts*0.28,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#55dd55';ctx.beginPath();ctx.arc(u.x,y-ts*0.55,ts*0.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#88ff88';ctx.beginPath();ctx.arc(u.x-ts*0.05,y-ts*0.4,2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(u.x+ts*0.12,y-ts*0.5,1.5,0,Math.PI*2);ctx.fill();
    }
    else if(u.kind==='mushroom'){
      const ms=u.size;const _rr=Math.max(1,Number.isFinite(u.range)?u.range:100);
      ctx.save();ctx.globalAlpha=0.12+Math.sin(frame*0.03+(u._mushroomPhase||0))*0.06;
      ctx.strokeStyle='#44ff88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(u.x,u.y,_rr,0,Math.PI*2);ctx.stroke();
      const _grad=ctx.createRadialGradient(u.x,u.y,0,u.x,u.y,_rr);
      _grad.addColorStop(0,'rgba(68,255,136,0.15)');_grad.addColorStop(0.7,'rgba(68,255,136,0.05)');_grad.addColorStop(1,'rgba(68,255,136,0)');
      ctx.fillStyle=_grad;ctx.beginPath();ctx.arc(u.x,u.y,_rr,0,Math.PI*2);ctx.fill();
      ctx.restore();
      for(let mi=0;mi<3;mi++){
        const _ma=(mi/3)*Math.PI*2+(u._mushroomPhase||0);
        const _mx=u.x+Math.cos(_ma)*_rr*0.4,_my=u.y+Math.sin(_ma)*_rr*0.25;
        ctx.fillStyle='#6a4a2a';ctx.fillRect(_mx-1,_my-2,2,5);
        ctx.fillStyle='#cc4444';ctx.beginPath();ctx.ellipse(_mx,_my-3,4,3,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(_mx-1,_my-4,1,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(_mx+2,_my-2.5,0.8,0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle='#8a6a3a';ctx.fillRect(u.x-1.5,y-2,3,6);
      ctx.fillStyle='#dd5555';ctx.beginPath();ctx.ellipse(u.x,y-3,5,3.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(u.x-1.5,y-4,1.2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(u.x+2,y-2.5,1,0,Math.PI*2);ctx.fill();
    }
    else if(u.kind==='fireElemental'){
      const es=u.size;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+es,es*0.5,es*0.12,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ff6633';ctx.beginPath();
      ctx.moveTo(u.x,y-es);ctx.bezierCurveTo(u.x+es*0.6,y-es*0.3,u.x+es*0.5,y+es*0.8,u.x,y+es*0.5);
      ctx.bezierCurveTo(u.x-es*0.5,y+es*0.8,u.x-es*0.6,y-es*0.3,u.x,y-es);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ffcc00';ctx.beginPath();ctx.arc(u.x,y,es*0.35,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(u.x,y-es*0.1,es*0.15,0,Math.PI*2);ctx.fill();
      if(frame%4===0)addP(u.x+rnd(-3,3),y-es*0.8,'#ff6600',1,2);
    }
    else if(u.kind==='waterElemental'){
      const es=u.size;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+es,es*0.5,es*0.12,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#44aadd';ctx.beginPath();
      ctx.moveTo(u.x,y-es*0.9);ctx.bezierCurveTo(u.x+es*0.7,y-es*0.2,u.x+es*0.5,y+es*0.9,u.x,y+es*0.6);
      ctx.bezierCurveTo(u.x-es*0.5,y+es*0.9,u.x-es*0.7,y-es*0.2,u.x,y-es*0.9);ctx.closePath();ctx.fill();
      ctx.fillStyle='#88ddff';ctx.beginPath();ctx.arc(u.x,y,es*0.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ddeeff';ctx.beginPath();ctx.arc(u.x-es*0.1,y-es*0.15,es*0.12,0,Math.PI*2);ctx.fill();
      if(frame%5===0)addP(u.x+rnd(-3,3),y-es*0.7,'#88ddff',1,2);
    }
    else if(u.kind==='stormElemental'){
      const es=u.size;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+es,es*0.5,es*0.12,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#8866cc';ctx.beginPath();
      ctx.moveTo(u.x,y-es*0.9);ctx.bezierCurveTo(u.x+es*0.65,y-es*0.3,u.x+es*0.45,y+es*0.8,u.x,y+es*0.5);
      ctx.bezierCurveTo(u.x-es*0.45,y+es*0.8,u.x-es*0.65,y-es*0.3,u.x,y-es*0.9);ctx.closePath();ctx.fill();
      ctx.fillStyle='#aa88ff';ctx.beginPath();ctx.arc(u.x,y,es*0.3,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffee66';ctx.lineWidth=1;
      const la=frame*0.2;
      ctx.beginPath();ctx.moveTo(u.x-3,y-es*0.3);ctx.lineTo(u.x+2,y+es*0.1);ctx.lineTo(u.x-2,y+es*0.1);ctx.lineTo(u.x+3,y+es*0.4);ctx.stroke();
      if(frame%3===0)addP(u.x+rnd(-4,4),y-es*0.6,'#aa88ff',1,2);
    }
    else if(u.kind==='flameSprite'){
      const es=u.size;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+es*0.8,es*0.3,es*0.08,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ff8833';ctx.globalAlpha=0.7+Math.sin(frame*0.15)*0.2;
      ctx.beginPath();ctx.arc(u.x,y,es*0.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffcc00';ctx.globalAlpha=0.8;
      ctx.beginPath();ctx.arc(u.x,y-es*0.1,es*0.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(u.x,y-es*0.15,es*0.12,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
      if(frame%5===0)addP(u.x+rnd(-2,2),y-es*0.5,'#ff6600',1,1.5);
    }
    else if(u.kind==='imp'){
      const es=u.size;
      ctx.fillStyle='#44cc44';ctx.beginPath();ctx.arc(u.x,y,es*0.7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#228822';ctx.beginPath();ctx.arc(u.x,y+es*0.1,es*0.4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(u.x-es*0.18,y-es*0.15,1.5,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(u.x+es*0.18,y-es*0.15,1.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#44cc44';
      ctx.beginPath();ctx.moveTo(u.x-es*0.3,y-es*0.5);ctx.lineTo(u.x-es*0.15,y-es*0.7);ctx.lineTo(u.x,y-es*0.5);ctx.fill();
      ctx.beginPath();ctx.moveTo(u.x,y-es*0.5);ctx.lineTo(u.x+es*0.15,y-es*0.7);ctx.lineTo(u.x+es*0.3,y-es*0.5);ctx.fill();
      if(frame%6===0)addP(u.x+rnd(-3,3),y-es*0.6,'#ff6600',1,2);
    }
    else if(u.kind==='felhound'){
      const es=u.size;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+es,es*0.5,es*0.1,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5a3a8a';ctx.beginPath();ctx.ellipse(u.x,y,es*0.9,es*0.6,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#2a1a4a';ctx.beginPath();ctx.ellipse(u.x+(u.facing||1)*es*0.5,y-es*0.1,es*0.3,es*0.35,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ff6600';ctx.beginPath();ctx.arc(u.x+(u.facing||1)*es*0.4,y-es*0.25,2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(u.x+(u.facing||1)*es*0.6,y-es*0.25,2,0,Math.PI*2);ctx.fill();
    }
    else if(u.kind==='infernal'){
      const es=u.size;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(u.x,y+es,es*0.6,es*0.15,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#881100';ctx.beginPath();ctx.arc(u.x,y,es*0.8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ff4400';const _pulse=0.6+Math.sin(frame*0.1)*0.2;ctx.globalAlpha=_pulse;
      ctx.beginPath();ctx.arc(u.x,y,es*0.65,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      ctx.fillStyle='#ffaa00';ctx.beginPath();ctx.arc(u.x,y-es*0.1,es*0.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(u.x-es*0.12,y-es*0.2,2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(u.x+es*0.12,y-es*0.2,2,0,Math.PI*2);ctx.fill();
      if(frame%3===0)addP(u.x+rnd(-es*0.4,es*0.4),y-es*0.6,'#ff6600',1,3);
    }
    else drawMinionFava(u.x,y,u);
  }else{
    const data=PLAYER_UNITS[u.unitIdx];
    const fn=data&&drawFns[data.drawFn];
    if(fn)fn(u.x,y,u);
  }
  if(_origSize!==null)u.size=_origSize;
  if(_origColor!==null)u.color=_origColor;
  if(_origAccent!==null)u.accent=_origAccent;
  ctx.globalAlpha=1;
  arena_drawPlayerAuraOver(u,u.x,y,u.size);
  // ===== CLEAVE MOON-SWEEP Ã¢â‚¬â€ white crescent arc in front of the unit =====
  // Drawn AFTER the sprite so it overlays. Fades out over u.cleaveFx frames.
  // The arc swings from one side of u.cleave.arc to the other, suggesting
  // a sword sweep through the front cone.
  if(u.cleaveFx>0){
    ctx.save();
    const _cfA=u.cleaveFxAng||0;
    // Paladin (cleaveFxBig) swings at melee distance Ã¢â‚¬â€ render the arc CLOSE
    // to the unit (40 px) so it overlaps the target instead of floating past
    // it. Other cleaves (Batata, Jazar Heroic Slam) keep their range-based arc.
    const _cfR=u.cleaveFxBig?40:((u.range||40)+10);
    const _cfArc=(u.cleave&&u.cleave.arc)||(u.cleaveFxBig?70:90);
    const _cfHalf=_cfArc/2*Math.PI/180;
    const _cfFade=u.cleaveFx/14;
    const _cfBig=u.cleaveFxBig?1.0:1; // size mult was 1.5 Ã¢â‚¬â€ but at close range a smaller arc reads better
    const _cfCol=u.cleaveFxColor||'#ffffff';
    const _cfInnerCol=u.cleaveFxColor?'#ffffff':'#ffeed0';
    // Outer crescent Ã¢â‚¬â€ primary color (gold for Zayt, white default), thick
    ctx.strokeStyle=_cfCol;ctx.lineWidth=u.cleaveFxBig?5:4;ctx.globalAlpha=0.85*_cfFade;
    ctx.beginPath();ctx.arc(u.x,y,_cfR*_cfBig,_cfA-_cfHalf,_cfA+_cfHalf);ctx.stroke();
    // Inner crescent Ã¢â‚¬â€ warmer tint (white inner for paladin so the gold reads)
    ctx.strokeStyle=_cfInnerCol;ctx.lineWidth=2;ctx.globalAlpha=0.95*_cfFade;
    ctx.beginPath();ctx.arc(u.x,y,_cfR*_cfBig-4,_cfA-_cfHalf,_cfA+_cfHalf);ctx.stroke();
    // Edge sparkle Ã¢â‚¬â€ bright tip on the leading edge (sweeping inward)
    const _tipA=_cfA-_cfHalf+(_cfHalf*2)*(1-_cfFade);
    ctx.fillStyle='#ffffff';ctx.globalAlpha=_cfFade;
    ctx.beginPath();ctx.arc(u.x+Math.cos(_tipA)*_cfR*_cfBig,y+Math.sin(_tipA)*_cfR*_cfBig,3*_cfBig,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Buff visuals
  if(u.divineShield){
    ctx.strokeStyle='#ffeeaa';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(u.x,y,u.size+8,0,Math.PI*2);ctx.stroke();
  }
  if(u.pwsBlocks>0){
    ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
    const rot=frame*0.05;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=rot+i*Math.PI/3;ctx.moveTo(u.x+Math.cos(a)*(u.size+4),y+Math.sin(a)*(u.size+4));ctx.lineTo(u.x+Math.cos(a+0.4)*(u.size+8),y+Math.sin(a+0.4)*(u.size+8))}
    ctx.stroke();
  }
  if(u.lastStandActive){
    ctx.strokeStyle='#ffaa00';ctx.lineWidth=3;ctx.beginPath();ctx.arc(u.x,y,u.size+6+Math.sin(frame*0.2)*2,0,Math.PI*2);ctx.stroke();
  }
  if(u.ironwillActive){
    ctx.strokeStyle='#cc8844';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(u.x,y,u.size+5+Math.sin(frame*0.25)*2,0,Math.PI*2);ctx.stroke();
    if(frame%3===0)addP(u.x+rnd(-u.size,u.size),y+rnd(-u.size/2,u.size/2),'#cc8844',1,2);
  }
  if(u.amsActive){
    ctx.strokeStyle='#aa66ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(u.x,y,u.size+5+Math.sin(frame*0.3)*2,0,Math.PI*2);ctx.stroke();
  }
  if(u.siActive){
    ctx.strokeStyle='#88ff88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(u.x,y,u.size+8,0,Math.PI*2);ctx.stroke();
  }
  if(u.btActive){
    ctx.strokeStyle='#ff4444';ctx.lineWidth=1;ctx.beginPath();ctx.arc(u.x,y,u.size+4,0,Math.PI*2);ctx.stroke();
  }
  if(u.furyTimer>0){
    ctx.strokeStyle='#ff8c00';ctx.lineWidth=3;ctx.beginPath();ctx.arc(u.x,y,u.size+10,0,Math.PI*2);ctx.stroke();
    addP(u.x+rnd(-u.size,u.size),y-u.size,'#ff6600',1,3);
  }
  if(u.armorBuff>0){
    ctx.strokeStyle='#ffd700';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(u.x,y,u.size+3,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  }
  if(u.hotTimer>0){
    if(frame%5===0)addP(u.x+rnd(-u.size/2,u.size/2),y-u.size,'#3aa84e',1,2);
    u.hotTimer--;
    u.hotTick++;
    if(u.hotTick%30===0){const _hh=arena_applyHealingReceived(u,u.hotAmt/2);u.hp=Math.min(u.maxHp,u.hp+_hh);addHealFx(u.x,y,_hh)}
  }
  if(u._essenceHot){
    u._essenceHot.tick++;
    if(u._essenceHot.tick%GAME_TICK_HZ===0){arena_applyTrackedHeal(u,u._essenceHot.heal,u._essenceHot.from,false)}
    const _hotPct=u._essenceHot.timer/(4*GAME_TICK_HZ);
    ctx.save();
    ctx.strokeStyle='#aaffaa';ctx.lineWidth=2;ctx.globalAlpha=0.4+Math.sin(frame*0.1)*0.15;
    ctx.beginPath();ctx.arc(u.x,y,u.size+4,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#88cc66';ctx.globalAlpha=0.08+Math.sin(frame*0.1)*0.04;
    ctx.beginPath();ctx.arc(u.x,y,u.size+4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#aaffaa';ctx.lineWidth=2.5;ctx.globalAlpha=0.7;
    ctx.beginPath();ctx.arc(u.x,y,u.size+6,-Math.PI/2,-Math.PI/2+Math.PI*2*_hotPct);ctx.stroke();
    ctx.restore();
    if(frame%4===0){const ang=Math.random()*Math.PI*2;addP(u.x+Math.cos(ang)*(u.size+2),y+Math.sin(ang)*(u.size+2),'#aaffaa',1,3)}
    if(frame%8===0)addP(u.x+rnd(-4,4),y-u.size-rnd(2,10),'#88cc66',1,2);
    u._essenceHot.timer--;
    if(u._essenceHot.timer<=0)u._essenceHot=null;
  }
  // Golden Shield (Prescient Barrier) Ã¢â‚¬â€ pulsing golden dome + timer
  if(u._goldShield){
    u._goldShield.timer--;
    const _gsPct=u._goldShield.timer/u._goldShield.maxTimer;
    ctx.save();
    ctx.strokeStyle='#ffd700';ctx.lineWidth=2;ctx.globalAlpha=0.35+Math.sin(frame*0.12)*0.15;
    ctx.beginPath();ctx.arc(u.x,y,u.size+6,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#ffd700';ctx.globalAlpha=0.08*_gsPct;
    ctx.beginPath();ctx.arc(u.x,y,u.size+6,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#ffe066';ctx.lineWidth=2;ctx.globalAlpha=0.5*_gsPct;
    ctx.beginPath();ctx.arc(u.x,y,u.size+6,-Math.PI/2,-Math.PI/2+Math.PI*2*_gsPct);ctx.stroke();
    ctx.restore();
    if(frame%10===0)addP(u.x+rnd(-u.size,u.size),y-u.size-rnd(2,8),'#ffd700',1,2);
    if(u._goldShield.timer<=0){
      const _rem=u._goldShield.amt;
      if(_rem>0&&!u._goldShield.noExpireHeal){const _gh=arena_applyHealingReceived(u,_rem);u.hp=Math.min(u.maxHp,u.hp+_gh);addHealFx(u.x,y,_gh)}
      u._goldShield=null;
      groundFx.push({x:u.x,y,r:0,maxR:u.size+12,life:0.3,color:'#ffd700'});
    }
  }
  // Phase 3 Ã¢â‚¬â€ per-spec accessory overlay (book / shield / wings / claws etc.)
  // Drawn AFTER the main sprite so accessories layer on top, BEFORE the HP bar
  // so the bar renders on top of everything else.
  arena_drawSpecAccessory(u);
  const _waveBoost=(arena&&arena.phase==='wave')?16:0;
  const _barW=u.size+14;
  const _hudMinY=ARENA_TOP+20;
  const _hpBarY=Math.max(_hudMinY,y-u.size-8-_waveBoost);
  const _hudY=_hpBarY;
  drawHpBar(u.x,_hudY,u.hp,u.maxHp,_barW,'player');
  drawStatusIcons(u,u.x,_hudY-16);
  // Summon CD ring on Foul/Sabbar
  if(u.summonCDt>0){
    const totalCD=(u.kind==='bear'||u.kind==='wolf'||u.kind==='raptor'||u.kind==='spiritBeast'||u.kind==='flameSprite')?600:720;
    ctx.strokeStyle='#fff';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(u.x+u.size+4,y,4,-Math.PI/2,-Math.PI/2+(u.summonCDt/totalCD)*Math.PI*2);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='bold 7px Arial';ctx.textAlign='center';ctx.fillText('S',u.x+u.size+4,y+2);
  }
  // Level chip Ã¢â‚¬â€ only during the BUILD phase (preparation), hide during waves.
  // Minions/mirrors/ghosts don't get a chip either way.
  const _showChip=arena&&arena.phase==='build'&&!u.isMinion&&!u.isGhost&&!u.isMirror;
  if(_showChip){
    ctx.fillStyle='#000a';ctx.fillRect(u.x-7,y+u.size+2,14,8);
    ctx.fillStyle='#fff';ctx.font='bold 7px Arial';ctx.textAlign='center';
    ctx.fillText('L'+(u.level||1),u.x,y+u.size+9);
  }
  // ===== SIGNATURE READY INDICATOR Ã¢â‚¬â€ bigger + more visible =====
  // Horizontal CD bar UNDER the unit + Ã¢Å¡Â¡ glyph when nearly charged.
  // The bar fills left-to-right in gold as the signature charges.
  if(u.signature&&!u.isMinion&&!u.isGhost&&!u.isMirror){
    const _sigPct=Math.min(1,u.signature.t/u.signature.cd);
    if(_sigPct>=0.85){
      const _alpha=Math.min(1,(_sigPct-0.85)/0.15);
      ctx.save();
      ctx.globalAlpha=_alpha*(0.75+Math.sin(frame*0.3)*0.25);
      ctx.fillStyle='#ffd700';
      ctx.beginPath();ctx.arc(u.x+_barW/2+6,_hudY+3,3.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(u.x+_barW/2+6,_hudY+3,5.5,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
  }
  // Tier pips Ã¢â‚¬â€ persistent across build AND wave. Replaces the
  // build-only chip as the primary level signal you read mid-fight.
  // L1 = nothing, L2-L4 = (level-1) gold dots, L5 = 4 dots + crown chevron.
  // Skipped for minions/mirrors/ghosts (they don't level).
  if(!u.isMinion&&!u.isGhost&&!u.isMirror){
    const _pipLvl=u.cellLevel||u.level||1;
    const _pipCount=Math.max(0,_pipLvl-1);
    if(_pipCount>0){
      const _pipY=_hudY-4;
      const _pipGap=6;
      const _pipW=(_pipCount-1)*_pipGap;
      let _px=u.x-_pipW/2;
      ctx.save();
      for(let i=0;i<_pipCount;i++){
        // L5 pips slightly bigger + soft glow halo behind
        if(_pipLvl>=5){
          ctx.fillStyle='#ffd700';ctx.globalAlpha=0.30;
          ctx.beginPath();ctx.arc(_px,_pipY,4.2,0,Math.PI*2);ctx.fill();
          ctx.globalAlpha=1;
        }
        ctx.fillStyle=_pipLvl>=5?'#ffe066':'#ffd700';
        ctx.beginPath();ctx.arc(_px,_pipY,_pipLvl>=5?2.6:2.2,0,Math.PI*2);ctx.fill();
        // Outline so pips read against bright sprites
        ctx.strokeStyle='rgba(0,0,0,0.55)';ctx.lineWidth=0.8;
        ctx.beginPath();ctx.arc(_px,_pipY,_pipLvl>=5?2.6:2.2,0,Math.PI*2);ctx.stroke();
        _px+=_pipGap;
      }
      // L5 crown chevron above the pips
      if(_pipLvl>=5){
        const _cy=_pipY-5;
        ctx.fillStyle='#ffe066';
        ctx.beginPath();
        ctx.moveTo(u.x,_cy-3.5);
        ctx.lineTo(u.x-4.5,_cy+2.5);
        ctx.lineTo(u.x+4.5,_cy+2.5);
        ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(0,0,0,0.6)';ctx.lineWidth=0.8;ctx.stroke();
      }
      ctx.restore();
    }
  }
  // Hit flash overlay Ã¢â‚¬â€ bright white ellipse fades over ~6 frames.
  if(_hitF>0){
    ctx.save();
    ctx.fillStyle='#ffffff';ctx.globalAlpha=Math.min(0.7,_hitF*0.12);
    ctx.beginPath();ctx.ellipse(u.x,y,u.size*0.85,u.size*0.95,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}

// Status / buff / debuff icons stacked above the unit head.
// Each icon is a 12x12 colored chip with a single glyph.
function drawStatusIcons(t,x,topY){
  const icons=collectStatusIcons(t,GAME_TICK_HZ);
  drawStatusIconChips(ctx,{icons,x,topY,state,arenaTop:ARENA_TOP,frame});
}
function drawHpBar(x,y,hp,maxHp,w,kind='player'){
  drawHealthBar(ctx,{x,y,hp,maxHp,width:w,kind});
}

// All veggie draw functions
const drawFns={};

drawFns.drawTreant=function(x,y,u){
  const s=u.size;
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.5,s*0.12,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3a2210';ctx.fillRect(x-s*0.25,y-s*0.2,s*0.5,s*1.2);
  ctx.fillStyle=u.color;
  ctx.beginPath();ctx.arc(x,y-s*0.5,s*0.7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#44aa44';
  ctx.beginPath();ctx.arc(x-s*0.4,y-s*0.6,s*0.4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.4,y-s*0.6,s*0.4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.arc(x-s*0.15,y-s*0.35,2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.15,y-s*0.35,2,0,Math.PI*2);ctx.fill();
  if(frame%8===0)addP(x+rnd(-s*0.5,s*0.5),y-s*0.8,'#33cc33',1,2);
};

drawFns.drawMalfof=function(x,y,u){
  const s=u.size;
  const _zavsSprite=arena_pickAnimFrame(_zavsFrames,_zavsReady,10);
  if(arena_drawUnitSprite(_zavsSprite,x,y,u,{buildScale:ARENA_SPRITE_BUILD_SCALE,waveScale:ARENA_SPRITE_WAVE_SCALE,anchor:0.48,glow:u.accent||'#266026',glowAlpha:0.08})){
    return;
  }
  // Shadow
  ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.75,s*0.18,0,0,Math.PI*2);ctx.fill();
  // Cabbage body Ã¢â‚¬â€ layered green with armor plating
  ctx.fillStyle='#1a4a1a';ctx.beginPath();ctx.ellipse(x,y+2,s*1.05,s*1.1,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=u.color;ctx.beginPath();ctx.arc(x,y,s*0.95,0,Math.PI*2);ctx.fill();
  // Cabbage leaf layers Ã¢â‚¬â€ organic texture
  ctx.strokeStyle=u.accent;ctx.lineWidth=1.2;
  for(let i=0;i<3;i++){const r=s*(0.5+i*0.15);ctx.beginPath();ctx.arc(x,y+2,r,Math.PI*0.15,Math.PI*0.85);ctx.stroke();}
  // Iron chest plate Ã¢â‚¬â€ dark steel rectangle with rivets
  ctx.fillStyle='#5a5a6e';
  ctx.beginPath();ctx.moveTo(x-s*0.45,y-s*0.35);ctx.lineTo(x+s*0.45,y-s*0.35);
  ctx.lineTo(x+s*0.4,y+s*0.4);ctx.lineTo(x-s*0.4,y+s*0.4);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#3a3a4a';ctx.lineWidth=1;ctx.stroke();
  // Chest plate highlight
  ctx.fillStyle='rgba(255,255,255,0.12)';
  ctx.fillRect(x-s*0.2,y-s*0.3,s*0.4,s*0.15);
  // Rivets on chest
  ctx.fillStyle='#888';
  for(const p of [[-0.3,-0.25],[0.3,-0.25],[-0.3,0.3],[0.3,0.3]]){ctx.beginPath();ctx.arc(x+s*p[0],y+s*p[1],1.5,0,Math.PI*2);ctx.fill();}
  // Shoulder pauldrons Ã¢â‚¬â€ thick rounded armor plates
  ctx.fillStyle='#4e4e60';
  ctx.beginPath();ctx.ellipse(x-s*0.7,y-s*0.2,s*0.32,s*0.22,0.2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.7,y-s*0.2,s*0.32,s*0.22,-0.2,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#3a3a4a';ctx.lineWidth=1;
  ctx.beginPath();ctx.ellipse(x-s*0.7,y-s*0.2,s*0.32,s*0.22,0.2,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(x+s*0.7,y-s*0.2,s*0.32,s*0.22,-0.2,0,Math.PI*2);ctx.stroke();
  // Pauldron spikes
  ctx.fillStyle='#6e6e80';
  ctx.beginPath();ctx.moveTo(x-s*0.85,y-s*0.35);ctx.lineTo(x-s*0.7,y-s*0.55);ctx.lineTo(x-s*0.55,y-s*0.35);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.55,y-s*0.35);ctx.lineTo(x+s*0.7,y-s*0.55);ctx.lineTo(x+s*0.85,y-s*0.35);ctx.closePath();ctx.fill();
  // Helmet Ã¢â‚¬â€ iron visor over the cabbage face
  ctx.fillStyle='#5a5a6e';
  ctx.beginPath();ctx.moveTo(x-s*0.4,y-s*0.5);ctx.lineTo(x+s*0.4,y-s*0.5);
  ctx.lineTo(x+s*0.35,y-s*0.85);ctx.quadraticCurveTo(x,y-s*1.1,x-s*0.35,y-s*0.85);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='#3a3a4a';ctx.lineWidth=1;ctx.stroke();
  // Visor slit Ã¢â‚¬â€ glowing green eyes behind
  ctx.fillStyle='#1a1a2a';ctx.fillRect(x-s*0.28,y-s*0.7,s*0.56,s*0.08);
  ctx.fillStyle='#44ff44';
  ctx.beginPath();ctx.arc(x-s*0.12,y-s*0.66,2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.12,y-s*0.66,2,0,Math.PI*2);ctx.fill();
  // Helmet crest Ã¢â‚¬â€ small leaf plume on top
  ctx.fillStyle='#2a7a2a';
  ctx.beginPath();ctx.moveTo(x,y-s*1.05);ctx.quadraticCurveTo(x+s*0.15,y-s*1.35,x,y-s*1.25);
  ctx.quadraticCurveTo(x-s*0.15,y-s*1.35,x,y-s*1.05);ctx.fill();
  // Shield on left Ã¢â‚¬â€ large kite shield
  ctx.fillStyle='#4a4a5e';
  ctx.beginPath();ctx.moveTo(x-s*0.9,y-s*0.5);ctx.lineTo(x-s*0.55,y-s*0.55);
  ctx.lineTo(x-s*0.5,y+s*0.5);ctx.lineTo(x-s*0.75,y+s*0.3);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#333';ctx.lineWidth=1.5;ctx.stroke();
  // Shield emblem Ã¢â‚¬â€ green cross
  ctx.strokeStyle='#3a8e3a';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x-s*0.7,y-s*0.2);ctx.lineTo(x-s*0.7,y+s*0.2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-s*0.82,y);ctx.lineTo(x-s*0.58,y);ctx.stroke();
  // Axe on right Ã¢â‚¬â€ heavy war axe
  ctx.strokeStyle='#5a4a3a';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(x+s*0.6,y-s*0.4);ctx.lineTo(x+s*0.85,y+s*0.55);ctx.stroke();
  // Axe blade
  ctx.fillStyle='#8a8a9a';
  ctx.beginPath();ctx.moveTo(x+s*0.55,y-s*0.5);
  ctx.quadraticCurveTo(x+s*0.95,y-s*0.55,x+s*0.75,y-s*0.15);
  ctx.lineTo(x+s*0.55,y-s*0.3);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#555';ctx.lineWidth=0.8;ctx.stroke();
  // Axe blade edge highlight
  ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=0.5;
  ctx.beginPath();ctx.moveTo(x+s*0.58,y-s*0.48);ctx.quadraticCurveTo(x+s*0.9,y-s*0.5,x+s*0.72,y-s*0.18);ctx.stroke();
};
drawFns.drawTaoon=function(x,y,u){
  const s=u.size;const f=u.facing||1;
  const _frames=u.branch==='a'?_taoonFrames:u.branch==='b'?_taoonGreenFrames:_taoonBlueFrames;
  const _ready=u.branch==='a'?_taoonReady:u.branch==='b'?_taoonGreenReady:_taoonBlueReady;
  if(_ready){
    const frameIdx=Math.floor(frame/10)%3;
    const img=_frames[frameIdx];
    const sprH=s*(arena&&arena.phase==='wave'?ARENA_SPRITE_WAVE_SCALE:ARENA_SPRITE_BUILD_SCALE);const sprW=sprH*(img.naturalWidth/img.naturalHeight);
    const drawW=Math.round(sprW),drawH=Math.round(sprH);
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    if(u.facing<0)ctx.scale(-1,1);
    ctx.drawImage(img,Math.round(-drawW/2),Math.round(-drawH*0.45),drawW,drawH);
    ctx.restore();
  }else{
    ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.7,s*0.15,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=u.color;ctx.beginPath();ctx.ellipse(x,y+3,s*0.82,s*1.02,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#2a2a3a';ctx.beginPath();ctx.ellipse(x,y+2,s*0.72,s*0.85,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3a3a4e';ctx.beginPath();ctx.ellipse(x,y-s*0.1,s*0.55,s*0.55,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1a1a2a';ctx.beginPath();ctx.ellipse(x,y-s*0.6,s*0.38,s*0.32,0,0,Math.PI*2);ctx.fill();
    const _eyeGlow=0.6+Math.sin(frame*0.12)*0.3;
    ctx.fillStyle=`rgba(100,200,255,${_eyeGlow})`;
    ctx.fillRect(x-s*0.22,y-s*0.65,s*0.44,3);
  }
  // bone shield visual Ã¢â‚¬â€ orbiting bone fragments (Blood Knight)
  if(u.boneShield&&u.boneShield.charges>0){
    ctx.save();ctx.globalAlpha=0.7;
    for(let i=0;i<u.boneShield.charges;i++){
      const ang=frame*0.04+i*(Math.PI*2/u.boneShield.maxCharges);
      const bx=x+Math.cos(ang)*s*0.95;const by=y+Math.sin(ang)*s*0.4;
      ctx.fillStyle='#ddddcc';ctx.beginPath();ctx.arc(bx,by,2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  // dancing rune weapon visual Ã¢â‚¬â€ floating ghostly sword
  if(u.dancingRuneWeaponTimer>0){
    ctx.save();
    const _rwA=frame*0.06;
    const rwx=x+f*Math.cos(_rwA)*s*0.6;const rwy=y-s*0.3+Math.sin(_rwA)*s*0.4;
    ctx.globalAlpha=0.6+Math.sin(frame*0.15)*0.2;
    ctx.strokeStyle='#cc2244';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(rwx,rwy-8);ctx.lineTo(rwx,rwy+8);ctx.stroke();
    ctx.fillStyle='#ff4466';ctx.beginPath();ctx.arc(rwx,rwy-8,2,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // remorseless winter aura
  if(u.remorselessWinterTimer>0){
    ctx.save();
    ctx.strokeStyle='#88ddff';ctx.lineWidth=1.5;ctx.globalAlpha=0.4+Math.sin(frame*0.1)*0.2;
    ctx.beginPath();ctx.arc(x,y,s*1.5+Math.sin(frame*0.08)*5,0,Math.PI*2);ctx.stroke();
    if(frame%4===0)addP(x+rnd(-s,s),y+rnd(-s,s),'#aaeeff',1,2);
    ctx.restore();
  }
  // dark transformation glow (Plague Lord)
  if(u.darkTransformation&&u.darkTransformation.active){
    ctx.save();ctx.globalAlpha=0.3+Math.sin(frame*0.15)*0.15;
    ctx.fillStyle='#6622aa';ctx.beginPath();ctx.arc(x,y,s+4,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
};
drawFns.drawBatata=function(x,y,u){
  const s=u.size;const f=u.facing||1;
  const _isBranchA=u.branch==='a';const _isBranchB=u.branch==='b';
  const _batataFrames=_isBranchA?_batataFlyingBlueFrames:(_isBranchB?_batataFlyingRedFrames:_batataFlyingFrames);
  const _batataReady=_isBranchA?_batataFlyingBlueReady:(_isBranchB?_batataFlyingRedReady:_batataFlyingReady);
  const _batataSprite=arena_pickAnimFrame(_batataFrames,_batataReady,8);
  const _batataGlow=_isBranchA?'#6fbf5a':(_isBranchB?'#b0793a':'#6b8e23');
  if(arena_drawUnitSprite(_batataSprite,x,y,u,{buildScale:4.0,waveScale:6.4,anchor:0.50,glow:_batataGlow,glowAlpha:u.incarnationActive?0.22:0.13})){
    if(frame%8===0)addP(x+rnd(-s*0.65,s*0.65),y+rnd(-s*0.45,s*0.85),_batataGlow,1,2.5);
    return;
  }
  // shadow
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.8,s*0.18,0,0,Math.PI*2);ctx.fill();
  // Branch-specific ground VFX
  if(_isBranchA&&frame%12===0)addP(x+rnd(-s*0.4,s*0.4),y+s*0.8,'#6b8e23',1,2);
  if(_isBranchB&&frame%10===0)addP(x+rnd(-s*0.5,s*0.5),y-s*0.5,'#8ab4f8',1,2);
  // Incarnation glow
  if(u.incarnationActive){
    ctx.save();ctx.globalAlpha=0.3+Math.sin(frame*0.1)*0.15;
    ctx.fillStyle='#c8a050';ctx.beginPath();ctx.ellipse(x,y,s*1.4,s*1.5,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Earthwarden shield glow
  if(u.earthwardenShield>0){
    ctx.save();ctx.globalAlpha=0.15+Math.sin(frame*0.08)*0.08;ctx.fillStyle='#6b8e23';
    ctx.beginPath();ctx.ellipse(x,y,s*1.2,s*1.3,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.6;ctx.strokeStyle='#88ff44';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(x,y,s*1.15,s*1.25,0,0,Math.PI*2);ctx.stroke();
    ctx.restore();
    if(frame%6===0)addP(x+rnd(-s,s),y+rnd(-s,s),'#88ff44',1,2);
  }
  // Bear body Ã¢â‚¬â€ broad-shouldered bear silhouette
  ctx.fillStyle=u.color;
  ctx.beginPath();
  ctx.moveTo(x-s*0.8,y+s*0.7);
  ctx.bezierCurveTo(x-s*1.1,y+s*0.2, x-s*1.0,y-s*0.5, x-s*0.5,y-s*0.8);
  ctx.bezierCurveTo(x-s*0.2,y-s*1.0, x+s*0.2,y-s*1.0, x+s*0.5,y-s*0.8);
  ctx.bezierCurveTo(x+s*1.0,y-s*0.5, x+s*1.1,y+s*0.2, x+s*0.8,y+s*0.7);
  ctx.bezierCurveTo(x+s*0.4,y+s*1.0, x-s*0.4,y+s*1.0, x-s*0.8,y+s*0.7);
  ctx.closePath();ctx.fill();
  // Bark/leather armor chest plate
  ctx.fillStyle=u.accent;
  ctx.beginPath();
  ctx.moveTo(x-s*0.55,y-s*0.3);
  ctx.bezierCurveTo(x-s*0.6,y+s*0.1, x-s*0.5,y+s*0.5, x-s*0.3,y+s*0.65);
  ctx.lineTo(x+s*0.3,y+s*0.65);
  ctx.bezierCurveTo(x+s*0.5,y+s*0.5, x+s*0.6,y+s*0.1, x+s*0.55,y-s*0.3);
  ctx.lineTo(x,y-s*0.45);ctx.closePath();ctx.fill();
  // Armor plate edge
  ctx.strokeStyle='#4a3a20';ctx.lineWidth=1;ctx.stroke();
  // Nature rune markings on armor
  ctx.save();
  const _rGlow=0.4+Math.sin(frame*0.06)*0.3;
  ctx.strokeStyle=_isBranchA?`rgba(200,160,80,${_rGlow})`
    :_isBranchB?`rgba(138,180,248,${_rGlow})`:`rgba(107,142,35,${_rGlow})`;
  ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(x-s*0.15,y-s*0.1);ctx.lineTo(x,y+s*0.2);ctx.lineTo(x+s*0.15,y-s*0.1);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y-s*0.15);ctx.lineTo(x,y+s*0.3);ctx.stroke();
  ctx.restore();
  // Shoulder pauldrons (bark plates)
  ctx.fillStyle='#5a4a30';
  ctx.beginPath();ctx.ellipse(x-s*0.7,y-s*0.4,s*0.25,s*0.18,-0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.7,y-s*0.4,s*0.25,s*0.18,0.3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#3a2a18';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.ellipse(x-s*0.7,y-s*0.4,s*0.25,s*0.18,-0.3,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(x+s*0.7,y-s*0.4,s*0.25,s*0.18,0.3,0,Math.PI*2);ctx.stroke();
  // Leaf mane Ã¢â‚¬â€ ring of small leaves around neck
  ctx.fillStyle='#4a7a2a';
  for(let i=0;i<7;i++){
    const _la=-Math.PI*0.8+i*Math.PI*0.22;
    const _lx=x+Math.cos(_la)*s*0.55,_ly=y-s*0.55+Math.sin(_la)*s*0.2;
    ctx.beginPath();ctx.ellipse(_lx,_ly,s*0.12,s*0.06,_la,0,Math.PI*2);ctx.fill();
  }
  // Bear head Ã¢â‚¬â€ proper muzzle
  ctx.fillStyle=u.color;
  ctx.beginPath();ctx.ellipse(x,y-s*0.7,s*0.4,s*0.35,0,0,Math.PI*2);ctx.fill();
  // Bear ears
  ctx.fillStyle=u.accent;
  ctx.beginPath();ctx.arc(x-s*0.35,y-s*1.0,s*0.15,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.35,y-s*1.0,s*0.15,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=u.color;
  ctx.beginPath();ctx.arc(x-s*0.35,y-s*1.0,s*0.08,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.35,y-s*1.0,s*0.08,0,Math.PI*2);ctx.fill();
  // Muzzle/snout
  ctx.fillStyle='#c8a878';
  ctx.beginPath();ctx.ellipse(x,y-s*0.55,s*0.2,s*0.15,0,0,Math.PI*2);ctx.fill();
  // Nose
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(x,y-s*0.62,s*0.08,s*0.05,0,0,Math.PI*2);ctx.fill();
  // Glowing eyes Ã¢â‚¬â€ green/amber
  const _eyeCol=_isBranchB?'#ff4444':'#88cc44';
  ctx.fillStyle=_eyeCol;
  ctx.beginPath();ctx.ellipse(x-s*0.18,y-s*0.78,s*0.07,s*0.05,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.18,y-s*0.78,s*0.07,s*0.05,0,0,Math.PI*2);ctx.fill();
  // Eye glow
  ctx.save();ctx.globalAlpha=0.4;ctx.fillStyle=_eyeCol;
  ctx.beginPath();ctx.ellipse(x-s*0.18,y-s*0.78,s*0.12,s*0.08,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.18,y-s*0.78,s*0.12,s*0.08,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Fangs
  ctx.fillStyle='#eee';
  ctx.beginPath();ctx.moveTo(x-s*0.1,y-s*0.48);ctx.lineTo(x-s*0.07,y-s*0.38);ctx.lineTo(x-s*0.13,y-s*0.42);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.1,y-s*0.48);ctx.lineTo(x+s*0.07,y-s*0.38);ctx.lineTo(x+s*0.13,y-s*0.42);ctx.fill();
  // Potato sprout on top of head (veggie identity)
  ctx.strokeStyle='#4a8a2a';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x,y-s*1.05);ctx.bezierCurveTo(x-s*0.1,y-s*1.3,x+s*0.1,y-s*1.35,x+s*0.05,y-s*1.45);ctx.stroke();
  ctx.fillStyle='#5aa830';
  ctx.beginPath();ctx.ellipse(x+s*0.05,y-s*1.45,s*0.08,s*0.05,-0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x-s*0.05,y-s*1.35,s*0.06,s*0.04,0.4,0,Math.PI*2);ctx.fill();
  // Glowing claws (right paw weapon)
  const _clawCol=_isBranchA?'#c8a050':_isBranchB?'#8ab4f8':'#6b8e23';
  ctx.fillStyle=_clawCol;
  ctx.beginPath();ctx.moveTo(x+s*0.7*f,y+s*0.1);ctx.lineTo(x+s*1.1*f,y-s*0.25);ctx.lineTo(x+s*1.05*f,y-s*0.05);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.7*f,y+s*0.2);ctx.lineTo(x+s*1.15*f,y);ctx.lineTo(x+s*1.05*f,y+s*0.15);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.7*f,y+s*0.35);ctx.lineTo(x+s*1.1*f,y+s*0.2);ctx.lineTo(x+s*1.05*f,y+s*0.35);ctx.fill();
  // Claw glow
  ctx.save();ctx.globalAlpha=0.3;ctx.fillStyle=_clawCol;
  ctx.beginPath();ctx.ellipse(x+s*0.95*f,y+s*0.05,s*0.2,s*0.3,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Berserk aura
  if(u.berserkActive){
    ctx.save();ctx.globalAlpha=0.2+Math.sin(frame*0.15)*0.1;
    ctx.strokeStyle='#8fbc3a';ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(x,y,s*1.2,s*1.3,0,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Ironfur stack indicator Ã¢â‚¬â€ golden bark armor plates
  if(u.ironfur&&u.ironfur.stacks>0){
    const _ifs=u.ironfur.stacks;
    ctx.save();ctx.globalAlpha=0.3+_ifs*0.15;
    ctx.strokeStyle='#c8a050';ctx.lineWidth=2+_ifs*0.5;
    ctx.beginPath();ctx.ellipse(x,y,s*(0.9+_ifs*0.08),s*(1.0+_ifs*0.08),0,0,Math.PI*2);ctx.stroke();
    ctx.restore();
    ctx.fillStyle='#c8a050';
    for(let i=0;i<_ifs;i++){
      const _ia=(-0.8+i*0.8);ctx.beginPath();ctx.arc(x+Math.cos(_ia)*s*0.9,y-s*0.6+i*s*0.35,3.5,0,Math.PI*2);ctx.fill();
    }
    if(frame%8===0&&_ifs>=2)addP(x+rnd(-s*0.5,s*0.5),y+rnd(-s*0.5,s*0.5),'#c8a050',1,2);
  }
  // Frenzied Regen active VFX Ã¢â‚¬â€ pulsing green aura with rising leaves
  if(u.frenziedRegen&&u.frenziedRegen.active){
    const _frP=0.25+Math.sin(frame*0.12)*0.12;
    ctx.save();ctx.globalAlpha=_frP;ctx.fillStyle='#44ff44';
    ctx.beginPath();ctx.ellipse(x,y,s*1.15,s*1.25,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=_frP+0.2;ctx.strokeStyle='#88ff88';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(x,y,s*1.1,s*1.2,0,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Rejuvenation Aura passive glow (Batata Halwa)
  if(u.rejuvAura){
    ctx.save();ctx.globalAlpha=0.12+Math.sin(frame*0.06)*0.06;
    ctx.fillStyle='#33cc33';ctx.beginPath();ctx.arc(x,y,u.rejuvAura.radius,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.3;ctx.strokeStyle='#44ff44';ctx.lineWidth=1;ctx.setLineDash([4,6]);ctx.lineDashOffset=-frame*0.3;
    ctx.beginPath();ctx.arc(x,y,u.rejuvAura.radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
    if(frame%10===0)addP(x+rnd(-20,20),y+rnd(-20,20),'#44ff44',1,2);
  }
  // Tree of Life active VFX (Batata Halwa A5)
  if(u.incarnTreeActive){
    ctx.save();ctx.globalAlpha=0.2+Math.sin(frame*0.1)*0.1;
    ctx.fillStyle='#22aa22';ctx.beginPath();ctx.arc(x,y,160,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.5;ctx.strokeStyle='#33ff33';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(x,y,160,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
};
drawFns.drawZayton=function(x,y,u){
  const s=u.size,f=u.facing||1;
  const _isAW=u.avengingWrathTimer>0;
  const _isProt=u.branch==='a';
  const _isHoly=u.branch==='b';
  const _useProtSprite=_isProt&&_kingProtReady;
  const _kingSprite=arena_pickAnimFrame(_useProtSprite?_kingProtFrames:_kingFrames,_useProtSprite||_kingReady,10);
  const _kingGlow=_isProt?'#8ab4f8':(_isHoly?'#ffe066':'#ffd700');
  if(arena_drawUnitSprite(_kingSprite,x,y,u,{buildScale:ARENA_SPRITE_BUILD_SCALE,waveScale:ARENA_SPRITE_WAVE_SCALE,anchor:_useProtSprite?0.49:0.45,glow:_kingGlow,glowAlpha:_isProt?0.14:0.10})){
    return;
  }
  // Ground shadow
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.6,s*0.15,0,0,Math.PI*2);ctx.fill();
  // Holy ground glow
  ctx.save();
  ctx.fillStyle=_isAW?'rgba(255,215,0,0.30)':'rgba(255,224,102,0.15)';
  ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.85,s*0.22,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Wings Ã¢â‚¬â€ ONLY during Avenging Wrath
  if(_isAW){
    const _wp=0.85+Math.sin(frame*0.15)*0.12;
    ctx.save();ctx.globalAlpha=0.65;ctx.fillStyle='#ffd700';
    ctx.beginPath();ctx.moveTo(x-s*0.4,y-s*0.1);
    ctx.quadraticCurveTo(x-s*1.2*_wp,y-s*0.6,x-s*1.1*_wp,y+s*0.3);
    ctx.quadraticCurveTo(x-s*0.6,y+s*0.05,x-s*0.4,y-s*0.1);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(x+s*0.4,y-s*0.1);
    ctx.quadraticCurveTo(x+s*1.2*_wp,y-s*0.6,x+s*1.1*_wp,y+s*0.3);
    ctx.quadraticCurveTo(x+s*0.6,y+s*0.05,x+s*0.4,y-s*0.1);ctx.closePath();ctx.fill();
    ctx.restore();
  }
  // Plate armor body Ã¢â‚¬â€ broad-shouldered knight silhouette
  const _bodyCol=_isProt?'#a0a8c0':(_isHoly?'#e8e0c0':u.color);
  const _plateCol=_isProt?'#707888':(_isHoly?'#c8c0a0':'#b8a040');
  ctx.fillStyle=_bodyCol;
  ctx.beginPath();ctx.moveTo(x-s*0.55,y-s*0.3);ctx.lineTo(x-s*0.65,y+s*0.1);
  ctx.lineTo(x-s*0.45,y+s*0.8);ctx.lineTo(x+s*0.45,y+s*0.8);
  ctx.lineTo(x+s*0.65,y+s*0.1);ctx.lineTo(x+s*0.55,y-s*0.3);ctx.closePath();ctx.fill();
  // Chest plate
  ctx.fillStyle=_plateCol;
  ctx.beginPath();ctx.moveTo(x-s*0.4,y-s*0.2);ctx.lineTo(x-s*0.45,y+s*0.3);
  ctx.lineTo(x+s*0.45,y+s*0.3);ctx.lineTo(x+s*0.4,y-s*0.2);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1;ctx.stroke();
  // Golden tabard with holy cross
  ctx.fillStyle='#ffd700';
  ctx.fillRect(x-s*0.15,y-s*0.15,s*0.30,s*0.45);
  ctx.fillStyle='#fff';
  ctx.fillRect(x-s*0.03,y-s*0.10,s*0.06,s*0.35);
  ctx.fillRect(x-s*0.10,y+s*0.02,s*0.20,s*0.06);
  // Shoulder pauldrons
  ctx.fillStyle=_plateCol;
  ctx.beginPath();ctx.ellipse(x-s*0.55,y-s*0.2,s*0.22,s*0.14,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.55,y-s*0.2,s*0.22,s*0.14,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ffd700';ctx.lineWidth=1;
  ctx.beginPath();ctx.ellipse(x-s*0.55,y-s*0.2,s*0.22,s*0.14,0,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(x+s*0.55,y-s*0.2,s*0.22,s*0.14,0,0,Math.PI*2);ctx.stroke();
  // Helmet Ã¢â‚¬â€ visored helm with gold trim
  ctx.fillStyle=_plateCol;
  ctx.beginPath();ctx.arc(x,y-s*0.55,s*0.35,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ffd700';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y-s*0.55,s*0.35,0,Math.PI*2);ctx.stroke();
  // Visor slit Ã¢â‚¬â€ glowing eyes
  const _eyeCol=_isAW?'#ffd700':(_isHoly?'#ffe066':'#ffffff');
  ctx.fillStyle=_eyeCol;
  ctx.fillRect(x-s*0.2,y-s*0.58,s*0.4,s*0.06);
  // Olive identity Ã¢â‚¬â€ small olive leaf on left shoulder
  ctx.fillStyle='#6b8e23';
  ctx.beginPath();ctx.ellipse(x-s*0.55,y-s*0.38,s*0.08,s*0.14,0.3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#4a6a14';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(x-s*0.55,y-s*0.50);ctx.lineTo(x-s*0.55,y-s*0.26);ctx.stroke();
  // Olive-green skin peeking at neck
  ctx.fillStyle='#8aaa44';
  ctx.beginPath();ctx.ellipse(x,y-s*0.32,s*0.18,s*0.08,0,0,Math.PI*2);ctx.fill();
  // Weapon Ã¢â‚¬â€ sword for Ret/Prot, staff for Holy
  if(_isHoly){
    ctx.strokeStyle='#ffd700';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+s*0.5,y-s*0.5);ctx.lineTo(x+s*0.7,y+s*0.7);ctx.stroke();
    ctx.fillStyle='#ffe066';ctx.beginPath();ctx.arc(x+s*0.5,y-s*0.5,s*0.1,0,Math.PI*2);ctx.fill();
  } else {
    // Sword blade
    ctx.fillStyle='#ddd';ctx.beginPath();ctx.moveTo(x+s*0.6,y-s*0.5);ctx.lineTo(x+s*0.9,y-s*0.15);
    ctx.lineTo(x+s*0.85,y-s*0.1);ctx.lineTo(x+s*0.55,y-s*0.4);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffd700';ctx.fillRect(x+s*0.5,y-s*0.15,s*0.15,s*0.06);
    ctx.fillStyle='#5a3a1a';ctx.fillRect(x+s*0.52,y-s*0.08,s*0.12,s*0.2);
  }
  // Shield (Prot only)
  if(_isProt){
    ctx.fillStyle='#88aaff';
    ctx.beginPath();ctx.moveTo(x-s*0.7,y-s*0.2);ctx.lineTo(x-s*0.9,y);ctx.lineTo(x-s*0.7,y+s*0.3);
    ctx.lineTo(x-s*0.5,y);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#ffd700';ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(x-s*0.7,y+s*0.05,s*0.06,0,Math.PI*2);ctx.fill();
  }
  // Halo Ã¢â‚¬â€ rotating gold ring
  ctx.save();
  const _hY=y-s*1.0;const _hSpin=frame*0.04;
  ctx.strokeStyle=_isAW?'#ffffff':'#ffd700';ctx.lineWidth=_isAW?2.5:1.8;ctx.globalAlpha=0.85;
  ctx.beginPath();ctx.ellipse(x,_hY,s*0.38,s*0.12,0,_hSpin,_hSpin+Math.PI*2);ctx.stroke();
  ctx.fillStyle='rgba(255,215,0,0.15)';ctx.beginPath();ctx.ellipse(x,_hY,s*0.42,s*0.14,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Branch-specific VFX
  if(_isAW&&frame%3===0){addP(x+rnd(-s*0.5,s*0.5),y-s*0.6,'#ffd700',1,3)}
  if(_isProt&&u.avengersShield&&frame%12===0){
    const _a=frame*0.1;addP(x+Math.cos(_a)*s*0.8,y+Math.sin(_a)*s*0.8,'#88aaff',1,2);
  }
  if(_isHoly&&frame%8===0){addP(x+rnd(-s*0.3,s*0.3),y-rnd(0,s*0.8),'#ffe066',1,2)}
  // Shield of Vengeance active glow
  if(u.shieldOfVengeance&&u.shieldOfVengeance.active&&u.shieldOfVengeanceHp>0){
    ctx.save();ctx.globalAlpha=0.3+Math.sin(frame*0.15)*0.1;
    ctx.strokeStyle='#ffd700';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,s*0.9,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Ardent Defender invuln glow
  if(u.ardentDefenderTimer>0){
    ctx.save();ctx.globalAlpha=0.4+Math.sin(frame*0.2)*0.2;
    ctx.strokeStyle='#ffd700';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,s*1.1,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
};
drawFns.drawFelfel=function(x,y,u){
  const s=u.size,f=u.facing||1;
  const isStealth=u.stealth&&u.stealthHits===0;
  const alpha=isStealth?0.45:1.0;
  const _ffFrames=u.branch==='b'?(_felfelPoisonGreenReady?_felfelPoisonGreenFrames:_felfelPoisonFrames):(u.branch==='a'?_felfelShadowFrames:_felfelBaseFrames);
  const _ffReady=u.branch==='b'?(_felfelPoisonGreenReady||_felfelPoisonReady):(u.branch==='a'?_felfelShadowReady:_felfelBaseReady);
  const _ffSprite=arena_pickAnimFrame(_ffFrames,_ffReady,7);
  if(_ffSprite){
    const _ffGlow=u.branch==='b'?'#55ff55':(u.branch==='a'?'#aa44ff':'#ff4455');
    ctx.save();
    ctx.globalAlpha=alpha;
    const _drawn=arena_drawUnitSprite(_ffSprite,x,y,u,{
      buildScale:ARENA_SPRITE_BUILD_SCALE*0.95,
      waveScale:ARENA_SPRITE_WAVE_SCALE*0.86,
      anchor:0.56,
      glow:_ffGlow,
      glowAlpha:isStealth?0.07:0.13
    });
    ctx.restore();
    if(_drawn){
      if(u.branch==='a'&&frame%8===0)addP(x+rnd(-s*0.3,s*0.3),y+rnd(-s*0.3,s*0.3),'#7733aa',1,2);
      if(u.branch==='b'&&frame%10===0)addP(x+rnd(-s*0.2,s*0.2),y+s*0.6,'#55aa33',1,2);
      if(u.killingSpree){ctx.fillStyle='rgba(255,34,68,0.3)';ctx.beginPath();ctx.arc(x,y,s*0.8,0,Math.PI*2);ctx.fill();}
      if(u.dfaTimer>0){
        if(u.dfaPhase==='rising'){ctx.fillStyle='rgba(255,68,102,0.2)';ctx.beginPath();ctx.arc(x,y,s+10,0,Math.PI*2);ctx.fill();}
        ctx.fillStyle='rgba(255,68,102,0.3)';ctx.beginPath();ctx.ellipse(u.dfaX,u.dfaY+s,s*0.8,s*0.2,0,0,Math.PI*2);ctx.fill();
      }
      if(u.cheatDeathTimer>0){
        const _cdCol=u.branch==='b'?'#55aa33':'#880044';
        ctx.strokeStyle=_cdCol;ctx.lineWidth=2;ctx.shadowColor=_cdCol;ctx.shadowBlur=8;
        ctx.beginPath();ctx.arc(x,y,s+4,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
      }
      if(u.cloakOfShadows&&u.cloakOfShadows.active){
        ctx.strokeStyle='#7733aa';ctx.lineWidth=2;ctx.shadowColor='#7733aa';ctx.shadowBlur=10;
        ctx.beginPath();ctx.arc(x,y,s+6,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
      }
      if(u.crimsonVial&&u.crimsonVial.active&&frame%6===0)addP(x+rnd(-s*0.3,s*0.3),y+rnd(-s*0.5,0),'#cc3344',1,2);
      if(u.sliceAndDice&&u.sliceAndDice.timer>0){
        ctx.strokeStyle='rgba(255,204,0,0.4)';ctx.lineWidth=1;
        for(let i=0;i<3;i++){const a=frame*0.15+i*2.1;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*s*0.6,y+Math.sin(a)*s*0.6);ctx.lineTo(x+Math.cos(a)*s*1.0,y+Math.sin(a)*s*1.0);ctx.stroke();}
      }
      if(u._shadowBladesActive&&u._shadowBladesActive.hits>0){
        ctx.save();
        ctx.globalAlpha=0.15;ctx.fillStyle='#3a1a3a';ctx.beginPath();ctx.arc(x,y,s*1.6,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=0.7;ctx.strokeStyle='#aa44ff';ctx.lineWidth=2;
        for(let _sd=0;_sd<u._shadowBladesActive.hits;_sd++){
          const _da=frame*0.12+_sd*Math.PI/2;
          const _dx=x+Math.cos(_da)*s*1.2,_dy=y+Math.sin(_da)*s*1.2;
          const _dAng=_da+Math.PI/4;
          ctx.beginPath();ctx.moveTo(_dx-Math.cos(_dAng)*6,_dy-Math.sin(_dAng)*6);ctx.lineTo(_dx+Math.cos(_dAng)*6,_dy+Math.sin(_dAng)*6);ctx.stroke();
          ctx.fillStyle='#aa44ff';ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(_dx,_dy,2,0,Math.PI*2);ctx.fill();
        }
        ctx.restore();
      }
      ctx.globalAlpha=1.0;
      return;
    }
  }
  ctx.globalAlpha=alpha;
  // Shadow
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.55,s*0.13,0,0,Math.PI*2);ctx.fill();
  // Body Ã¢â‚¬â€ lean rogue silhouette (dark leather)
  const _bodyC=u.color||'#a6262e';
  ctx.fillStyle=_bodyC;
  ctx.beginPath();
  ctx.moveTo(x-s*0.35,y-s*0.5);ctx.lineTo(x+s*0.35,y-s*0.5);
  ctx.lineTo(x+s*0.4,y+s*0.8);ctx.lineTo(x-s*0.4,y+s*0.8);ctx.closePath();ctx.fill();
  // Leather vest with darker stitching
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.fillRect(x-s*0.25,y-s*0.3,s*0.5,s*0.7);
  ctx.strokeStyle='#3a1a0a';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(x,y-s*0.3);ctx.lineTo(x,y+s*0.4);ctx.stroke();
  // Belt with buckle
  ctx.fillStyle='#4a3a2a';ctx.fillRect(x-s*0.35,y+s*0.15,s*0.7,s*0.08);
  ctx.fillStyle='#ffd700';ctx.fillRect(x-s*0.05,y+s*0.15,s*0.1,s*0.08);
  // Hood Ã¢â‚¬â€ deep shadow, peaked top
  ctx.fillStyle='#1a0a0e';
  ctx.beginPath();
  ctx.moveTo(x,y-s*1.05);
  ctx.bezierCurveTo(x-s*0.6,y-s*0.8, x-s*0.55,y-s*0.2, x-s*0.35,y-s*0.1);
  ctx.lineTo(x+s*0.35,y-s*0.1);
  ctx.bezierCurveTo(x+s*0.55,y-s*0.2, x+s*0.6,y-s*0.8, x,y-s*1.05);
  ctx.closePath();ctx.fill();
  // Hood edge highlight
  ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(x-s*0.35,y-s*0.1);
  ctx.bezierCurveTo(x-s*0.55,y-s*0.2, x-s*0.6,y-s*0.8, x,y-s*1.05);
  ctx.bezierCurveTo(x+s*0.6,y-s*0.8, x+s*0.55,y-s*0.2, x+s*0.35,y-s*0.1);
  ctx.stroke();
  // Glowing eyes under hood (branch-colored)
  const _eyeC=u.branch==='a'?'#aa44ff':u.branch==='b'?'#55ff55':'#ffeb3b';
  ctx.fillStyle=_eyeC;
  ctx.fillRect(x-s*0.18,y-s*0.45,3,2.5);ctx.fillRect(x+s*0.08,y-s*0.45,3,2.5);
  ctx.shadowColor=_eyeC;ctx.shadowBlur=4;
  ctx.fillRect(x-s*0.18,y-s*0.45,3,2.5);ctx.fillRect(x+s*0.08,y-s*0.45,3,2.5);
  ctx.shadowBlur=0;
  // Chili pepper stem on hood (veggie identity)
  ctx.fillStyle='#3a8e3a';
  ctx.beginPath();ctx.moveTo(x-2,y-s*1.05);ctx.lineTo(x,y-s*1.25);ctx.lineTo(x+2,y-s*1.05);ctx.closePath();ctx.fill();
  // Dual daggers
  const swinging=u.cd>0&&u.cd<u.atkSpd-6;
  const sw=swinging?Math.sin((u.atkSpd-u.cd)*0.5)*0.4:0;
  // Right dagger
  const _dC=u.branch==='b'?'#55ff55':'#ccccdd';
  ctx.save();ctx.translate(x+s*0.35,y+s*0.1);ctx.rotate(f*(0.4+sw));
  ctx.fillStyle=_dC;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s*0.7,-s*0.15);ctx.lineTo(s*0.65,s*0.05);ctx.closePath();ctx.fill();
  ctx.fillStyle='#4a3a2a';ctx.fillRect(-2,-1,5,3);
  ctx.restore();
  // Left dagger
  ctx.save();ctx.translate(x-s*0.35,y+s*0.1);ctx.rotate(-f*(0.4-sw*0.5));
  ctx.fillStyle=_dC;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-s*0.7,-s*0.15);ctx.lineTo(-s*0.65,s*0.05);ctx.closePath();ctx.fill();
  ctx.fillStyle='#4a3a2a';ctx.fillRect(-3,-1,5,3);
  ctx.restore();
  // Branch-specific VFX
  if(u.branch==='a'){
    // Shadow Dancer: purple shadow wisps
    if(frame%8===0)addP(x+rnd(-s*0.3,s*0.3),y+rnd(-s*0.3,s*0.3),'#7733aa',1,2);
  }
  if(u.branch==='b'){
    // Poison Assassin: green poison drip particles
    if(frame%10===0)addP(x+rnd(-s*0.2,s*0.2),y+s*0.6,'#55aa33',1,2);
  }
  // Killing Spree: afterimage trail
  if(u.killingSpree){
    ctx.fillStyle='rgba(255,34,68,0.3)';ctx.beginPath();ctx.arc(x,y,s*0.8,0,Math.PI*2);ctx.fill();
  }
  // DFA: unit rising/falling
  if(u.dfaTimer>0){
    if(u.dfaPhase==='rising'){
      ctx.fillStyle='rgba(255,68,102,0.2)';ctx.beginPath();ctx.arc(x,y,s+10,0,Math.PI*2);ctx.fill();
    }
    // Shadow on ground
    ctx.fillStyle='rgba(255,68,102,0.3)';ctx.beginPath();ctx.ellipse(u.dfaX,u.dfaY+s,s*0.8,s*0.2,0,0,Math.PI*2);ctx.fill();
  }
  // Cheat Death DR glow
  if(u.cheatDeathTimer>0){
    const _cdCol=u.branch==='b'?'#55aa33':'#880044';
    ctx.strokeStyle=_cdCol;ctx.lineWidth=2;ctx.shadowColor=_cdCol;ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(x,y,s+4,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  }
  // Cloak of Shadows active
  if(u.cloakOfShadows&&u.cloakOfShadows.active){
    ctx.strokeStyle='#7733aa';ctx.lineWidth=2;ctx.shadowColor='#7733aa';ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(x,y,s+6,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  }
  // Crimson Vial active
  if(u.crimsonVial&&u.crimsonVial.active){
    if(frame%6===0)addP(x+rnd(-s*0.3,s*0.3),y+rnd(-s*0.5,0),'#cc3344',1,2);
  }
  // Slice and Dice active: speed lines
  if(u.sliceAndDice&&u.sliceAndDice.timer>0){
    ctx.strokeStyle='rgba(255,204,0,0.4)';ctx.lineWidth=1;
    for(let i=0;i<3;i++){
      const a=frame*0.15+i*2.1;
      ctx.beginPath();ctx.moveTo(x+Math.cos(a)*s*0.6,y+Math.sin(a)*s*0.6);
      ctx.lineTo(x+Math.cos(a)*s*1.0,y+Math.sin(a)*s*1.0);ctx.stroke();
    }
  }
  // Shadow Blades active: purple shadow daggers orbiting + dark aura
  if(u._shadowBladesActive&&u._shadowBladesActive.hits>0){
    ctx.save();
    // Dark shadow aura
    ctx.globalAlpha=0.15;ctx.fillStyle='#3a1a3a';
    ctx.beginPath();ctx.arc(x,y,s*1.6,0,Math.PI*2);ctx.fill();
    // Orbiting shadow daggers
    ctx.globalAlpha=0.7;ctx.strokeStyle='#aa44ff';ctx.lineWidth=2;
    for(let _sd=0;_sd<u._shadowBladesActive.hits;_sd++){
      const _da=frame*0.12+_sd*Math.PI/2;
      const _dx=x+Math.cos(_da)*s*1.2,_dy=y+Math.sin(_da)*s*1.2;
      const _dAng=_da+Math.PI/4;
      ctx.beginPath();
      ctx.moveTo(_dx-Math.cos(_dAng)*6,_dy-Math.sin(_dAng)*6);
      ctx.lineTo(_dx+Math.cos(_dAng)*6,_dy+Math.sin(_dAng)*6);
      ctx.stroke();
      ctx.fillStyle='#aa44ff';ctx.globalAlpha=0.5;
      ctx.beginPath();ctx.arc(_dx,_dy,2,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha=1.0;
};
drawFns.drawJazar=function(x,y,u){
  const s=u.size,f=u.facing||1;
  // Enrage red glow
  if(u._enraged){
    ctx.save();ctx.globalAlpha=0.25+Math.sin(frame*0.15)*0.1;
    ctx.fillStyle='#ff2200';ctx.beginPath();ctx.arc(x,y,s*1.4,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  if(u._omnislashActive){
    ctx.save();
    ctx.translate(x,y);
    ctx.globalAlpha=0.45+Math.sin(frame*0.25)*0.12;
    ctx.strokeStyle='#ffcc00';ctx.lineWidth=3;ctx.shadowColor='#ffcc00';ctx.shadowBlur=14;
    ctx.beginPath();ctx.arc(0,0,s*1.45,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.rotate(frame*0.08);
    for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3+frame*0.12;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*s*0.9,Math.sin(a)*s*0.9);
      ctx.lineTo(Math.cos(a)*s*1.9,Math.sin(a)*s*1.9);ctx.stroke();
    }
    ctx.shadowBlur=0;ctx.restore();
  }
  if(u.bladeGuardTimer>0){
    ctx.save();
    ctx.globalAlpha=0.35+Math.sin(frame*0.18)*0.08;
    ctx.strokeStyle=u.branch==='b'?'#44ccff':'#ffaa44';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(x,y,s*1.25,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Blade Storm spin ring
  if(u._bladeStormTimer>0){
    ctx.save();ctx.translate(x,y);ctx.rotate(frame*0.3);
    ctx.globalAlpha=0.7;ctx.strokeStyle='#ff8800';ctx.lineWidth=4;ctx.shadowColor='#ffaa00';ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(0,0,s*1.5,0,Math.PI*1.5);ctx.stroke();
    ctx.strokeStyle='#ffcc00';ctx.lineWidth=2;ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(0,0,s*1.3,0.5,Math.PI*1.8);ctx.stroke();
    ctx.restore();
  }
  // Thousand Cuts speed lines
  if(u._thousandCutsTimer>0){
    ctx.save();ctx.globalAlpha=0.5;ctx.strokeStyle=u.branch==='b'?'#44ccff':'#ffdd00';ctx.lineWidth=1.5;
    for(let i=0;i<4;i++){
      const a=frame*0.08+i*Math.PI/2;
      ctx.beginPath();ctx.moveTo(x+Math.cos(a)*s*0.6,y+Math.sin(a)*s*0.6);
      ctx.lineTo(x+Math.cos(a)*s*2,y+Math.sin(a)*s*2);ctx.stroke();
    }
    ctx.restore();
  }
  // Clone afterimage effect
  if(u._isClone){
    ctx.save();ctx.globalAlpha=0.3;
    ctx.fillStyle='#ff8c00';ctx.beginPath();ctx.arc(x-f*3,y,s*0.9,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  const _jazarFramesForBranch=u.branch==='b'?_jazarBlueFrames:(u.branch==='a'?_jazarYellowFrames:_jazarFrames);
  const _jazarReadyForBranch=u.branch==='b'?_jazarBlueReady:(u.branch==='a'?_jazarYellowReady:_jazarReady);
  const _jazarSprite=arena_pickAnimFrame(_jazarFramesForBranch,_jazarReadyForBranch,7);
  if(_jazarSprite){
    const _jazarGlow=u.branch==='b'?'#33ccff':(u.branch==='a'?'#ffd34a':'#ff9a22');
    ctx.save();
    if(u._isClone)ctx.globalAlpha=0.62;
    const _drawn=arena_drawUnitSprite(_jazarSprite,x,y,u,{
      buildScale:3.85,
      waveScale:6.05,
      anchor:0.56,
      glow:_jazarGlow,
      glowAlpha:u._enraged?0.22:0.12
    });
    ctx.restore();
    if(_drawn){
      if(frame%8===0)addP(x+rnd(-s*0.55,s*0.55),y+rnd(-s*0.35,s*0.75),_jazarGlow,1,2.5);
      if(u.killingSpree){
        ctx.fillStyle='rgba(255,100,34,0.3)';ctx.beginPath();ctx.arc(x,y,s*0.8,0,Math.PI*2);ctx.fill();
      }
      if(u.cheatDeathTimer>0){
        ctx.strokeStyle='#880044';ctx.lineWidth=2;ctx.shadowColor='#880044';ctx.shadowBlur=8;
        ctx.beginPath();ctx.arc(x,y,s+4,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
      }
      return;
    }
  }
  if(u._isClone){ctx.save();ctx.globalAlpha=0.6}
  // Shadow
  ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.7,s*0.16,0,0,Math.PI*2);ctx.fill();
  // Carrot body Ã¢â‚¬â€ teardrop, wide top tapering to root tip at bottom
  ctx.fillStyle=u.color||'#e07a1f';ctx.beginPath();
  ctx.moveTo(x,y-s*0.95);
  ctx.bezierCurveTo(x+s*0.65,y-s*0.8,x+s*0.55,y+s*0.4,x,y+s*0.95);
  ctx.bezierCurveTo(x-s*0.55,y+s*0.4,x-s*0.65,y-s*0.8,x,y-s*0.95);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='#b85a10';ctx.lineWidth=1.2;ctx.stroke();
  // Carrot groove lines
  ctx.strokeStyle='#c06818';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(x-s*0.45,y-s*0.25);ctx.lineTo(x+s*0.45,y-s*0.25);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-s*0.40,y+s*0.1);ctx.lineTo(x+s*0.40,y+s*0.1);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-s*0.28,y+s*0.45);ctx.lineTo(x+s*0.28,y+s*0.45);ctx.stroke();
  // Iron chest plate Ã¢â‚¬â€ dark steel on carrot body
  ctx.fillStyle='#5e4a3a';
  ctx.beginPath();ctx.moveTo(x-s*0.38,y-s*0.45);ctx.lineTo(x+s*0.38,y-s*0.45);
  ctx.lineTo(x+s*0.32,y+s*0.2);ctx.lineTo(x-s*0.32,y+s*0.2);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#3a2a1a';ctx.lineWidth=1;ctx.stroke();
  // Chest plate highlight
  ctx.fillStyle='rgba(255,255,255,0.1)';
  ctx.fillRect(x-s*0.15,y-s*0.4,s*0.3,s*0.15);
  // Rivets on chest plate
  ctx.fillStyle='#aa8844';
  for(const p of [[-0.28,-0.38],[0.28,-0.38],[-0.25,0.12],[0.25,0.12]]){ctx.beginPath();ctx.arc(x+s*p[0],y+s*p[1],1.5,0,Math.PI*2);ctx.fill()}
  // Shoulder pauldrons Ã¢â‚¬â€ iron plates on body sides
  ctx.fillStyle='#5e4e3e';
  ctx.beginPath();ctx.ellipse(x-s*0.6,y-s*0.35,s*0.28,s*0.18,0.2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.6,y-s*0.35,s*0.28,s*0.18,-0.2,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#3a2a1a';ctx.lineWidth=1;
  ctx.beginPath();ctx.ellipse(x-s*0.6,y-s*0.35,s*0.28,s*0.18,0.2,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(x+s*0.6,y-s*0.35,s*0.28,s*0.18,-0.2,0,Math.PI*2);ctx.stroke();
  // Pauldron spikes
  ctx.fillStyle='#6e5e4e';
  ctx.beginPath();ctx.moveTo(x-s*0.75,y-s*0.48);ctx.lineTo(x-s*0.6,y-s*0.65);ctx.lineTo(x-s*0.45,y-s*0.48);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.45,y-s*0.48);ctx.lineTo(x+s*0.6,y-s*0.65);ctx.lineTo(x+s*0.75,y-s*0.48);ctx.closePath();ctx.fill();
  // Belt Ã¢â‚¬â€ crimson sash
  ctx.fillStyle='#8b1a1a';
  ctx.beginPath();ctx.moveTo(x-s*0.35,y+s*0.15);ctx.lineTo(x+s*0.35,y+s*0.15);
  ctx.lineTo(x+s*0.30,y+s*0.25);ctx.lineTo(x-s*0.30,y+s*0.25);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(x,y+s*0.2,s*0.04,0,Math.PI*2);ctx.fill();
  // Green carrot leaves on top (veggie identity)
  ctx.fillStyle='#3a8a2a';
  ctx.beginPath();ctx.moveTo(x-s*0.08,y-s*0.9);ctx.quadraticCurveTo(x-s*0.22,y-s*1.4,x-s*0.06,y-s*1.25);ctx.quadraticCurveTo(x-s*0.02,y-s*0.95,x,y-s*0.9);ctx.fill();
  ctx.beginPath();ctx.moveTo(x,y-s*0.93);ctx.quadraticCurveTo(x+s*0.05,y-s*1.5,x+s*0.02,y-s*1.3);ctx.quadraticCurveTo(x,y-s*0.97,x,y-s*0.93);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.06,y-s*0.88);ctx.quadraticCurveTo(x+s*0.25,y-s*1.35,x+s*0.10,y-s*1.2);ctx.quadraticCurveTo(x+s*0.06,y-s*0.92,x+s*0.06,y-s*0.88);ctx.fill();
  ctx.fillStyle='#2a7a1a';
  ctx.beginPath();ctx.moveTo(x-s*0.03,y-s*0.92);ctx.quadraticCurveTo(x-s*0.16,y-s*1.45,x-s*0.02,y-s*1.3);ctx.quadraticCurveTo(x+s*0.01,y-s*0.96,x,y-s*0.92);ctx.fill();
  // Face Ã¢â‚¬â€ directly on carrot body
  // Eyes Ã¢â‚¬â€ fierce with glow
  const _eyeC=u._enraged?'#ff4400':'#fff';
  ctx.fillStyle=_eyeC;ctx.beginPath();ctx.ellipse(x-s*0.15,y-s*0.55,s*0.09,s*0.07,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.15,y-s*0.55,s*0.09,s*0.07,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(x-s*0.13,y-s*0.55,s*0.045,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.17,y-s*0.55,s*0.045,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-s*0.12,y-s*0.56,s*0.018,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.18,y-s*0.56,s*0.018,0,Math.PI*2);ctx.fill();
  // Angry eyebrows
  ctx.strokeStyle='#8b4a10';ctx.lineWidth=1.8;
  ctx.beginPath();ctx.moveTo(x-s*0.24,y-s*0.60);ctx.lineTo(x-s*0.08,y-s*0.66);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.08,y-s*0.66);ctx.lineTo(x+s*0.24,y-s*0.60);ctx.stroke();
  // Mouth Ã¢â‚¬â€ battle grin
  ctx.strokeStyle='#7a3a08';ctx.lineWidth=1.2;ctx.beginPath();
  ctx.moveTo(x-s*0.10,y-s*0.38);ctx.quadraticCurveTo(x,y-s*0.32,x+s*0.10,y-s*0.38);ctx.stroke();
  // === ASHKANDI GREATSWORD Ã¢â‚¬â€ right side, large and prominent ===
  // Handle (angled, bottom to top-right)
  ctx.strokeStyle='#3a1a08';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x+s*0.55,y+s*0.45);ctx.lineTo(x+s*0.75,y-s*0.55);ctx.stroke();
  // Grip wrap
  ctx.strokeStyle='#5a3018';ctx.lineWidth=1;
  for(let i=0;i<5;i++){const t=0.2+i*0.15;const gx=x+s*(0.55+(0.75-0.55)*t);const gy=y+s*(0.45+((-0.55)-0.45)*t);ctx.beginPath();ctx.moveTo(gx-3,gy-1);ctx.lineTo(gx+3,gy+1);ctx.stroke()}
  // Crossguard Ã¢â‚¬â€ ornate gold
  ctx.fillStyle='#ffd700';
  ctx.beginPath();ctx.moveTo(x+s*0.55,y-s*0.55);ctx.lineTo(x+s*0.95,y-s*0.55);
  ctx.lineTo(x+s*0.92,y-s*0.47);ctx.lineTo(x+s*0.58,y-s*0.47);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#b8860b';ctx.lineWidth=1;ctx.stroke();
  // Red gems on crossguard
  ctx.fillStyle='#ff2200';ctx.beginPath();ctx.arc(x+s*0.60,y-s*0.51,s*0.025,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.90,y-s*0.51,s*0.025,0,Math.PI*2);ctx.fill();
  // Blade Ã¢â‚¬â€ dark crimson, extends upward from crossguard
  ctx.fillStyle='#8b1a1a';ctx.beginPath();
  ctx.moveTo(x+s*0.63,y-s*0.55);ctx.lineTo(x+s*0.87,y-s*0.55);
  ctx.lineTo(x+s*0.85,y-s*1.4);ctx.lineTo(x+s*0.75,y-s*1.6);
  ctx.lineTo(x+s*0.65,y-s*1.4);ctx.closePath();ctx.fill();
  // Blade edge outlines
  ctx.strokeStyle='#5a0808';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x+s*0.63,y-s*0.55);ctx.lineTo(x+s*0.65,y-s*1.4);ctx.lineTo(x+s*0.75,y-s*1.6);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.87,y-s*0.55);ctx.lineTo(x+s*0.85,y-s*1.4);ctx.lineTo(x+s*0.75,y-s*1.6);ctx.stroke();
  // Fuller groove
  ctx.strokeStyle='#aa3333';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+s*0.75,y-s*0.6);ctx.lineTo(x+s*0.75,y-s*1.35);ctx.stroke();
  // Blade shine
  ctx.strokeStyle='rgba(255,200,200,0.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+s*0.66,y-s*0.6);ctx.lineTo(x+s*0.67,y-s*1.3);ctx.stroke();
  // Gold rune diamonds on blade
  ctx.fillStyle='#ffd700';ctx.globalAlpha=0.7;
  for(let i=0;i<3;i++){const ry=y-s*(0.7+i*0.25);ctx.save();ctx.translate(x+s*0.75,ry);ctx.rotate(Math.PI/4);ctx.fillRect(-s*0.03,-s*0.03,s*0.06,s*0.06);ctx.restore()}
  ctx.globalAlpha=1;
  // Pommel
  ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(x+s*0.53,y+s*0.48,s*0.05,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cc2200';ctx.beginPath();ctx.arc(x+s*0.53,y+s*0.48,s*0.025,0,Math.PI*2);ctx.fill();
  // Killing Spree afterimage
  if(u.killingSpree){
    ctx.fillStyle='rgba(255,100,34,0.3)';ctx.beginPath();ctx.arc(x,y,s*0.8,0,Math.PI*2);ctx.fill();
  }
  // Cheat Death glow
  if(u.cheatDeathTimer>0){
    ctx.strokeStyle='#880044';ctx.lineWidth=2;ctx.shadowColor='#880044';ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(x,y,s+4,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  }
  if(u._isClone)ctx.restore();
};
drawFns.drawFilfilHar=function(x,y,u){
  const s=u.size;
  // Storm Mage Ã¢â‚¬â€ crackling aura
  if(u.branch==='b'&&u.overload){
    ctx.save();ctx.globalAlpha=0.15+Math.sin(frame*0.12)*0.05;
    ctx.strokeStyle='#aa88ff';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(x,y,s*1.5,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  if(_alibabaReady){
    const frameIdx=Math.floor(frame/12)%3;
    const img=_alibabaFrames[frameIdx];
    const sprH=s*(arena&&arena.phase==='wave'?ARENA_SPRITE_WAVE_SCALE:ARENA_SPRITE_BUILD_SCALE);const sprW=sprH*(img.naturalWidth/img.naturalHeight);
    const drawW=Math.round(sprW),drawH=Math.round(sprH);
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    if((u.facing||1)<0)ctx.scale(-1,1);
    ctx.drawImage(img,Math.round(-drawW/2),Math.round(-drawH*0.45),drawW,drawH);
    ctx.restore();
    if(frame%8===0)addP(x+rnd(-s*0.4,s*0.4),y+s*0.6,'#ff88ff',1,2);
  }else{
    ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.5,s*0.12,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=u.color;ctx.beginPath();
    ctx.moveTo(x,y-s*0.8);ctx.bezierCurveTo(x+s*0.8,y-s*0.5,x+s*0.7,y+s*0.7,x,y+s*0.95);
    ctx.bezierCurveTo(x-s*0.7,y+s*0.7,x-s*0.8,y-s*0.5,x,y-s*0.8);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,200,0,0.35)';ctx.beginPath();ctx.arc(x,y,s*1.2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3a8e3a';ctx.beginPath();ctx.ellipse(x,y-s*0.85,s*0.32,s*0.18,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff6600';ctx.beginPath();ctx.arc(x+s*0.65,y-s*0.4,3,0,Math.PI*2);ctx.fill();
  }
  // Flame Circle VFX
  if(u._flameCircle){
    const fc=u._flameCircle;
    ctx.save();
    ctx.globalAlpha=0.18+Math.sin(frame*0.16)*0.05;
    ctx.fillStyle='#ff4400';
    ctx.beginPath();ctx.arc(fc.x,fc.y,fc.r,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.58;
    ctx.strokeStyle='#ffaa00';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(fc.x,fc.y,fc.r,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#ff6600';ctx.lineWidth=1.5;ctx.globalAlpha=0.42;
    ctx.beginPath();ctx.arc(fc.x,fc.y,fc.r*(0.55+0.08*Math.sin(frame*0.12)),0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Inferno Orb VFX
  if(u._infernoOrb){
    const orb=u._infernoOrb;
    ctx.save();ctx.translate(orb.x,orb.y);ctx.rotate(frame*0.18);
    const pulse=1+Math.sin(frame*0.22)*0.08;
    ctx.globalAlpha=0.25;ctx.fillStyle='#ff4400';
    ctx.beginPath();ctx.arc(0,0,orb.radius*pulse,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.82;ctx.fillStyle='#ff6600';
    ctx.beginPath();ctx.arc(0,0,22*pulse,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.9;ctx.strokeStyle='#ffcc00';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(0,0,30*pulse,0,Math.PI*1.55);ctx.stroke();
    ctx.globalAlpha=0.72;ctx.fillStyle='#fff2aa';
    ctx.beginPath();ctx.arc(0,0,9*pulse,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Blizzard zone VFX
  if(u._blizzardTimer>0&&u._blizzardX!=null){
    const _bzR=u._blizzardRadius||70;
    ctx.save();ctx.globalAlpha=0.2;ctx.fillStyle='#88ddff';
    ctx.beginPath();ctx.arc(u._blizzardX,u._blizzardY,_bzR,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#aaeeff';ctx.lineWidth=1.5;ctx.globalAlpha=0.5;
    ctx.beginPath();ctx.arc(u._blizzardX,u._blizzardY,_bzR,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Icy Veins frost aura
  if(u._icyVeinsTimer>0){
    ctx.save();ctx.globalAlpha=0.15+Math.sin(frame*0.15)*0.08;
    ctx.fillStyle='#88ddff';
    ctx.beginPath();ctx.arc(x,y,s*1.4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#aaeeff';ctx.lineWidth=1.5;ctx.globalAlpha=0.4;
    ctx.beginPath();ctx.arc(x,y,s*1.5,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Ascendance storm aura
  if(u._ascendanceTimer>0){
    ctx.save();ctx.globalAlpha=0.2+Math.sin(frame*0.2)*0.1;
    ctx.strokeStyle='#aa88ff';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(x,y,s*1.6,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#aa88ff';ctx.globalAlpha=0.08;
    ctx.beginPath();ctx.arc(x,y,s*1.6,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Frozen Orb VFX
  if(u._frozenOrb){
    const orb=u._frozenOrb;
    ctx.save();ctx.translate(orb.x,orb.y);ctx.rotate(frame*0.15);
    ctx.fillStyle='#66ccff';ctx.globalAlpha=0.20;
    ctx.beginPath();ctx.arc(0,0,orb.radius,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#66ccff';ctx.globalAlpha=0.72;
    ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#aaeeff';ctx.lineWidth=2.5;ctx.globalAlpha=0.9;
    ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*1.5);ctx.stroke();
    ctx.fillStyle='#ffffff';ctx.globalAlpha=0.6;ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
};
drawFns.drawFoul=function(x,y,u){
  const s=u.size;
  const _jfFrames=u.branch==='a'?_jafaarDemonFrames:(u.branch==='b'?_jafaarDestructionFrames:_jafaarFrames);
  const _jfReady=u.branch==='a'?_jafaarDemonReady:(u.branch==='b'?_jafaarDestructionReady:_jafaarReady);
  const _jfGlow=u.branch==='a'?'#5a3a8a':(u.branch==='b'?'#ff6600':'#9b59b6');
  const _jfSprite=arena_pickAnimFrame(_jfFrames,_jfReady,10)||arena_pickAnimFrame(_jafaarFrames,_jafaarReady,10);
  if(_jfSprite&&arena_drawUnitSprite(_jfSprite,x,y,u,{buildScale:ARENA_SPRITE_BUILD_SCALE,waveScale:ARENA_SPRITE_WAVE_SCALE,anchor:0.50,glow:_jfGlow,glowAlpha:0.13})){
    if(frame%12===0)addP(x+rnd(-s*0.3,s*0.3),y+s*0.8,_jfGlow,1,2);
  }else{
    ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.5,s*0.12,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=u.color;ctx.beginPath();
    ctx.moveTo(x-s*0.7,y-s*0.5);ctx.bezierCurveTo(x-s*0.8,y,x-s*0.5,y+s*0.7,x+s*0.6,y+s*0.5);
    ctx.bezierCurveTo(x+s*0.85,y+s*0.2,x+s*0.6,y-s*0.4,x-s*0.1,y-s*0.6);ctx.closePath();ctx.fill();
    ctx.fillStyle=u.accent;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x-s*0.4+i*s*0.4,y-s*0.05,s*0.2,0,Math.PI*2);ctx.fill()}
    ctx.fillStyle=u.branch==='b'?'#ffcc66':'#cc88ff';ctx.fillRect(x-3,y-s*0.25,3,2);ctx.fillRect(x+1,y-s*0.25,3,2);
  }
  // Dark Soul: Misery aura (Affliction)
  if(u._darkSoulTimer>0){
    ctx.save();ctx.globalAlpha=0.2+Math.sin(frame*0.15)*0.1;
    ctx.fillStyle='#9b59b6';
    ctx.beginPath();ctx.arc(x,y,s*1.4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#cc88ff';ctx.lineWidth=1.5;ctx.globalAlpha=0.4;
    ctx.beginPath();ctx.arc(x,y,s*1.5,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Nether Portal aura (Demonology)
  if(u._netherPortalTimer>0){
    u._netherPortalTimer--;
    ctx.save();ctx.globalAlpha=0.15+Math.sin(frame*0.12)*0.08;
    ctx.fillStyle='#33ff66';
    ctx.beginPath();ctx.arc(x,y,s*1.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#5a3a8a';ctx.lineWidth=2;ctx.globalAlpha=0.35;
    ctx.beginPath();ctx.arc(x,y,s*1.6,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Dark Soul: Instability aura (Destruction)
  if(u._darkSoulInstTimer>0){
    ctx.save();ctx.globalAlpha=0.2+Math.sin(frame*0.18)*0.1;
    ctx.fillStyle='#ff4400';
    ctx.beginPath();ctx.arc(x,y,s*1.4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#ffaa00';ctx.lineWidth=1.5;ctx.globalAlpha=0.4;
    ctx.beginPath();ctx.arc(x,y,s*1.5,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
};
drawFns.drawSabbar=function(x,y,u){
  const s=u.size;
  if(_zataarReady){
    const frameIdx=Math.floor(frame/10)%4;
    const img=_zataarFrames[frameIdx];
    const sprH=s*(arena&&arena.phase==='wave'?ARENA_SPRITE_WAVE_SCALE:ARENA_SPRITE_BUILD_SCALE);const sprW=sprH*(img.naturalWidth/img.naturalHeight);
    const drawW=Math.round(sprW),drawH=Math.round(sprH);
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    if(u.facing<0)ctx.scale(-1,1);
    ctx.drawImage(img,Math.round(-drawW/2),Math.round(-drawH*0.45),drawW,drawH);
    ctx.restore();
  }else{
    ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.6,s*0.12,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=u.color;ctx.beginPath();ctx.roundRect(x-s*0.4,y-s*0.95,s*0.8,s*1.85,s*0.4);ctx.fill();
    ctx.beginPath();ctx.roundRect(x-s*0.85,y-s*0.2,s*0.4,s*0.7,s*0.2);ctx.fill();
    ctx.strokeStyle=u.accent;ctx.lineWidth=1.5;
    for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(x+i*s*0.18,y-s*0.85);ctx.lineTo(x+i*s*0.18,y+s*0.85);ctx.stroke()}
    ctx.strokeStyle='#774422';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+s*0.6,y,s*0.5,-Math.PI/3,Math.PI/3);ctx.stroke();
    ctx.fillStyle='#fff';ctx.fillRect(x-3,y-s*0.4,2,2);ctx.fillRect(x+1,y-s*0.4,2,2);
    ctx.fillStyle='#ff66cc';ctx.beginPath();ctx.arc(x,y-s*1.0,s*0.18,0,Math.PI*2);ctx.fill();
  }
  // Trueshot Aura VFX Ã¢â‚¬â€ golden pulsing fill + ring
  if(u._trueshotAuraTimer>0){
    ctx.save();ctx.globalAlpha=0.15+0.08*Math.sin(frame*0.12);
    ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(x,y,s*1.4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#ffaa00';ctx.lineWidth=2;ctx.globalAlpha=0.5+0.2*Math.sin(frame*0.15);
    ctx.beginPath();ctx.arc(x,y,s*1.6,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Wildfire Zone rendering Ã¢â‚¬â€ burning ground circle
  if(u._wildfireZone){
    const _wz=u._wildfireZone;
    ctx.save();ctx.globalAlpha=0.3+0.1*Math.sin(frame*0.1);
    ctx.fillStyle='#ff4400';ctx.beginPath();ctx.arc(_wz.x,_wz.y,_wz.r,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.7;ctx.strokeStyle='#ff6600';ctx.lineWidth=2;ctx.setLineDash([6,4]);
    ctx.beginPath();ctx.arc(_wz.x,_wz.y,_wz.r,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);ctx.restore();
  }
  // Frenzy BM VFX Ã¢â‚¬â€ red pulsing fill on hunter when active
  if(u._frenzyProc){
    let _hasFrenzy=false;
    for(const _m of units){if(_m.isMinion&&_m.parent===u&&_m._frenzyBMTimer>0){_hasFrenzy=true;break}}
    if(_hasFrenzy){
      ctx.save();ctx.globalAlpha=0.12+0.06*Math.sin(frame*0.14);
      ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(x,y,s*1.3,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ff8800';ctx.lineWidth=1.5;ctx.globalAlpha=0.4+0.2*Math.sin(frame*0.18);
      ctx.beginPath();ctx.arc(x,y,s*1.5,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
  }
};
drawFns.drawRumman=function(x,y,u){
  const s=u.size,f=u.facing||1;
  const isMech=u.mechSuit&&u.mechSuit.active;
  if(_rommanaReady){
    const frameIdx=Math.floor(frame/10)%4;
    const img=_rommanaFrames[frameIdx];
    const sprH=s*(arena&&arena.phase==='wave'?ARENA_SPRITE_WAVE_SCALE:ARENA_SPRITE_BUILD_SCALE);const sprW=sprH*(img.naturalWidth/img.naturalHeight);
    const drawW=Math.round(sprW),drawH=Math.round(sprH);
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    if(f<0)ctx.scale(-1,1);
    ctx.drawImage(img,Math.round(-drawW/2),Math.round(-drawH*0.45),drawW,drawH);
    ctx.restore();
    ctx.save();ctx.translate(x,y);if(f<0)ctx.scale(-1,1);
    const _modeCol=u.branch==='a'?'#ffcc66':(isMech?'#ff5ca8':'#44ccff');
    ctx.strokeStyle=_modeCol;ctx.lineWidth=2;ctx.globalAlpha=0.72;
    ctx.beginPath();ctx.ellipse(0,s*0.64,s*0.95,s*0.18,0,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;
    if(isMech){
      ctx.fillStyle='#ffd36a';ctx.fillRect(s*0.28,-s*0.16,s*0.86,s*0.22);
      ctx.fillStyle='#7a4a10';ctx.fillRect(s*0.46,-s*0.10,s*0.48,s*0.10);
      ctx.fillStyle='#ff5ca8';ctx.beginPath();ctx.arc(s*1.16,-s*0.05,s*0.14+Math.sin(frame*0.18)*s*0.025,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,179,209,0.35)';ctx.beginPath();ctx.arc(s*1.16,-s*0.05,s*0.28,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff1c8';
      ctx.beginPath();ctx.arc(-s*0.48,s*0.18,s*0.10,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(-s*0.64,s*0.08,s*0.09,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffb3d1';ctx.beginPath();ctx.arc(-s*0.35,s*0.72,s*0.16+Math.sin(frame*0.2)*s*0.04,0,Math.PI*2);ctx.fill();
    }else if(u.branch==='a'){
      ctx.fillStyle='#d9a52a';ctx.fillRect(s*0.20,-s*0.34,s*0.72,s*0.18);
      ctx.fillStyle='#7a4a10';ctx.fillRect(s*0.36,-s*0.29,s*0.38,s*0.08);
      ctx.fillStyle='#ffcc66';ctx.beginPath();ctx.arc(s*0.94,-s*0.25,s*0.11,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffcc66';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,s*0.10,s*1.12,frame*0.04,frame*0.04+Math.PI*1.25);ctx.stroke();
    }else{
      ctx.fillStyle='#d9a52a';ctx.fillRect(s*0.30,-s*0.08,s*0.62,s*0.16);
      ctx.fillStyle='#44ccff';ctx.beginPath();ctx.arc(s*0.95,0,s*0.10+Math.sin(frame*0.15)*s*0.02,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(68,204,255,0.30)';ctx.beginPath();ctx.arc(s*0.95,0,s*0.22,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
    if(frame%5===0&&isMech)addP(x-f*s*0.35,y+s*0.68,'#ffb3d1',1,3);
  }else{
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*(isMech?0.8:0.6),s*0.12,0,0,Math.PI*2);ctx.fill();
  if(isMech){
    ctx.fillStyle='#d84f87';
    ctx.fillRect(x-s*0.55,y-s*0.3,s*1.1,s*1.3);
    ctx.fillStyle='#a02255';
    ctx.fillRect(x-s*0.7,y+s*0.5,s*0.35,s*0.55);
    ctx.fillRect(x+s*0.35,y+s*0.5,s*0.35,s*0.55);
    ctx.fillStyle='#ffd36a';
    ctx.fillRect(x-s*0.85,y-s*0.1,s*0.35,s*0.5);
    ctx.fillRect(x+s*0.5,y-s*0.1,s*0.35,s*0.5);
    ctx.fillStyle='#7a4a10';
    ctx.fillRect(x-s*0.85,y+s*0.3,s*0.2,s*0.15);
    ctx.fillRect(x+s*0.65,y+s*0.3,s*0.2,s*0.15);
    ctx.fillStyle='#ffd36a';ctx.fillRect(x+f*s*0.18,y-s*0.16,f*s*0.90,s*0.24);
    ctx.fillStyle='#ffb3d1';ctx.beginPath();ctx.arc(x+f*s*1.10,y-s*0.04,s*0.15,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffd36a';ctx.beginPath();ctx.arc(x,y-s*0.1,s*0.35,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=u._mechRebuilding?'#cc9aa8':'#ff5ca8';ctx.beginPath();ctx.arc(x,y-s*0.1,s*0.28,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.3)';ctx.beginPath();ctx.arc(x-s*0.08,y-s*0.18,s*0.1,0,Math.PI*2);ctx.fill();
    if(frame%6===0&&!u._mechRebuilding)addP(x-s*0.5+rnd(-3,3),y+s*0.3,'#ffb3d1',1,2);
    if(frame%6===3&&!u._mechRebuilding)addP(x+s*0.5+rnd(-3,3),y+s*0.3,'#ffb3d1',1,2);
  }else{
    ctx.fillStyle=u.color;ctx.beginPath();ctx.arc(x,y,s*0.85,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=u.accent;
    ctx.beginPath();ctx.moveTo(x-s*0.3,y-s*0.78);ctx.lineTo(x-s*0.35,y-s*1.0);ctx.lineTo(x-s*0.1,y-s*0.88);
    ctx.lineTo(x,y-s*1.05);ctx.lineTo(x+s*0.1,y-s*0.88);ctx.lineTo(x+s*0.35,y-s*1.0);
    ctx.lineTo(x+s*0.3,y-s*0.78);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.25)';ctx.beginPath();ctx.arc(x-s*0.3,y-s*0.3,s*0.22,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#44ccff';
    ctx.beginPath();ctx.arc(x-s*0.25,y-s*0.45,s*0.18,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+s*0.25,y-s*0.45,s*0.18,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#88eeff';
    ctx.beginPath();ctx.arc(x-s*0.25,y-s*0.45,s*0.08,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+s*0.25,y-s*0.45,s*0.08,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#665544';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(x-s*0.25,y-s*0.45,s*0.2,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(x+s*0.25,y-s*0.45,s*0.2,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#665544';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(x-s*0.25,y-s*0.25);ctx.lineTo(x+s*0.25,y-s*0.25);ctx.stroke();
    ctx.strokeStyle='#888';ctx.lineWidth=1.5;
    const _wa=Math.sin(frame*0.05)*0.3;
    ctx.beginPath();ctx.moveTo(x+s*0.6,y+s*0.1);ctx.lineTo(x+s*0.9,y-s*0.1+Math.sin(_wa)*5);ctx.stroke();
    ctx.fillStyle='#aaa';ctx.fillRect(x+s*0.82,y-s*0.2+Math.sin(_wa)*5,s*0.15,s*0.15);
    const _ga=frame*0.02;
    ctx.strokeStyle='#99773388';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(x+s*0.5,y+s*0.5,s*0.2,_ga,_ga+Math.PI*1.5);ctx.stroke();
    ctx.fillStyle='#997733';ctx.beginPath();ctx.arc(x+s*0.5,y+s*0.5,s*0.06,0,Math.PI*2);ctx.fill();
  }
  }
  // Turret Overdrive VFX Ã¢â‚¬â€ cyan pulsing aura
  if(u._turretODTimer>0){
    ctx.save();ctx.globalAlpha=0.15+0.08*Math.sin(frame*0.12);
    ctx.fillStyle='#44ccff';ctx.beginPath();ctx.arc(x,y,s*1.4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#88eeff';ctx.lineWidth=2;ctx.globalAlpha=0.5+0.2*Math.sin(frame*0.15);
    ctx.beginPath();ctx.arc(x,y,s*1.6,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Napalm Zone rendering Ã¢â‚¬â€ burning ground
  if(u._napalmZone){
    const _nz=u._napalmZone;
    ctx.save();ctx.globalAlpha=0.25+0.1*Math.sin(frame*0.1);
    ctx.fillStyle='#ff4400';ctx.beginPath();ctx.arc(_nz.x,_nz.y,_nz.r,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.7;ctx.strokeStyle='#ff8800';ctx.lineWidth=2;ctx.setLineDash([6,4]);
    ctx.beginPath();ctx.arc(_nz.x,_nz.y,_nz.r,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);ctx.restore();
  }
  // Siege Mode VFX Ã¢â‚¬â€ olive/military pulsing aura
  if(u._siegeModeTimer>0){
    ctx.save();ctx.globalAlpha=0.12+0.06*Math.sin(frame*0.1);
    ctx.fillStyle='#ffcc66';ctx.beginPath();ctx.arc(x,y,s*1.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#d9a52a';ctx.lineWidth=2.5;ctx.globalAlpha=0.5+0.2*Math.sin(frame*0.12);
    ctx.beginPath();ctx.arc(x,y,s*1.8,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  // Cannon Overdrive VFX Ã¢â‚¬â€ pink/gold danger aura
  if(u._mechOLTimer>0){
    ctx.save();ctx.globalAlpha=0.15+0.08*Math.sin(frame*0.15);
    ctx.fillStyle='#ff4400';ctx.beginPath();ctx.arc(x,y,s*1.4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#ff8800';ctx.lineWidth=2;ctx.globalAlpha=0.5+0.2*Math.sin(frame*0.18);
    ctx.beginPath();ctx.arc(x,y,s*1.6,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
};
drawFns.drawNaana=function(x,y,u){
  const s=u.size;
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.5,s*0.12,0,0,Math.PI*2);ctx.fill();
  // mint leaf cluster body
  ctx.fillStyle=u.color;
  ctx.beginPath();ctx.ellipse(x,y+s*0.2,s*0.65,s*0.85,0,0,Math.PI*2);ctx.fill();
  // leaf veins
  ctx.strokeStyle=u.accent;ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(x,y-s*0.5);ctx.lineTo(x,y+s*0.9);ctx.stroke();
  for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x,y+i*s*0.2);ctx.lineTo(x+s*0.4*Math.sign(i||1),y+i*s*0.18+s*0.3);ctx.stroke()}
  // upper leaves (head)
  ctx.fillStyle=u.color;
  ctx.beginPath();ctx.ellipse(x-s*0.3,y-s*0.6,s*0.25,s*0.4,-0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.3,y-s*0.6,s*0.25,s*0.4,0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x,y-s*0.7,s*0.3,s*0.45,0,0,Math.PI*2);ctx.fill();
  // halo (paladin)
  ctx.strokeStyle='#ffd700';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y-s*0.9,s*0.5,s*0.12,0,0,Math.PI*2);ctx.stroke();
  // hammer (paladin weapon)
  ctx.fillStyle='#aaa';ctx.fillRect(x+s*0.55,y-s*0.4,s*0.3,s*0.25);
  ctx.strokeStyle='#774422';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+s*0.6,y-s*0.15);ctx.lineTo(x+s*0.85,y+s*0.5);ctx.stroke();
};
// NAANA PRIEST V2 Ã¢â‚¬â€ override with proper priest visual
drawFns.drawNaana=function(x,y,u){
  const s=u.size,f=u.facing||1;
  const isShadow=u.branch==='b';
  const isDisc=u.branch==='a';
  const _spriteGlow=isShadow?'#7b3cff':isDisc?'#ffaadd':'#ffe066';
  const _frames=u.branch?_nanaaBaseFrames:_nanaaHealerFrames;
  const _ready=u.branch?_nanaaBaseReady:_nanaaHealerReady;
  const _sprite=arena_pickAnimFrame(_frames,_ready,9)||_frames[0];
  if(arena_drawUnitSprite(_sprite,x,y,u,{buildScale:4.15,waveScale:6.3,anchor:0.50,glow:_spriteGlow,glowAlpha:isShadow?0.18:0.12})){
    if(frame%7===0)addP(x+rnd(-s*0.55,s*0.55),y+rnd(-s*0.45,s*0.7),_spriteGlow,1,3);
    return;
  }
  const _bc=isShadow?'#2a0a3a':isDisc?'#e0c0d8':u.color;
  const _ac=isShadow?'#6622aa':isDisc?'#a06070':u.accent;
  // Shadow
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.55,s*0.14,0,0,Math.PI*2);ctx.fill();
  // Holy ground glow
  const _ga=0.12+Math.sin(frame*0.06)*0.06;
  ctx.save();ctx.globalAlpha=_ga;
  ctx.fillStyle=isShadow?'#6622aa':isDisc?'#ffaadd':'#ffe8a0';
  ctx.beginPath();ctx.ellipse(x,y+s*0.8,s*0.9,s*0.2,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Flowing priestly robe (bell shape)
  ctx.fillStyle=isShadow?'#1a0a2a':isDisc?'#c8a0b8':'#e8f5e0';
  ctx.beginPath();
  ctx.moveTo(x-s*0.2,y-s*0.1);
  ctx.quadraticCurveTo(x-s*0.65,y+s*0.7,x-s*0.5,y+s);
  ctx.lineTo(x+s*0.5,y+s);
  ctx.quadraticCurveTo(x+s*0.65,y+s*0.7,x+s*0.2,y-s*0.1);
  ctx.closePath();ctx.fill();
  // Robe trim
  ctx.strokeStyle=isShadow?'#4a1a6a':'#ffd700';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x-s*0.5,y+s);ctx.lineTo(x+s*0.5,y+s);ctx.stroke();
  // Robe center stripe
  ctx.strokeStyle=isShadow?'#4a1a6a':isDisc?'#ffaadd':'#ffd700';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+s*0.9);ctx.stroke();
  // Mint leaf body (torso)
  ctx.fillStyle=_bc;
  ctx.beginPath();ctx.ellipse(x,y-s*0.15,s*0.4,s*0.45,0,0,Math.PI*2);ctx.fill();
  // Leaf vein on torso
  ctx.strokeStyle=_ac;ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(x,y-s*0.5);ctx.lineTo(x,y+s*0.2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y-s*0.2);ctx.lineTo(x+s*0.2*f,y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y-s*0.05);ctx.lineTo(x-s*0.18*f,y+s*0.1);ctx.stroke();
  // Head Ã¢â‚¬â€ rounded mint leaf
  ctx.fillStyle=_bc;
  ctx.beginPath();ctx.arc(x,y-s*0.55,s*0.32,0,Math.PI*2);ctx.fill();
  // Head leaf vein
  ctx.strokeStyle=_ac;ctx.lineWidth=0.6;
  ctx.beginPath();ctx.moveTo(x,y-s*0.8);ctx.lineTo(x,y-s*0.35);ctx.stroke();
  // Eyes
  if(isShadow){
    ctx.fillStyle='#aa66ff';
    ctx.beginPath();ctx.arc(x-s*0.12,y-s*0.58,1.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+s*0.12,y-s*0.58,1.5,0,Math.PI*2);ctx.fill();
  }else{
    ctx.strokeStyle='#1a5a1a';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(x-s*0.12,y-s*0.55,s*0.06,0,Math.PI);ctx.stroke();
    ctx.beginPath();ctx.arc(x+s*0.12,y-s*0.55,s*0.06,0,Math.PI);ctx.stroke();
  }
  // Leaf sprouts on head
  ctx.fillStyle=isShadow?'#3a1a5a':u.color;
  ctx.beginPath();ctx.ellipse(x-s*0.15,y-s*0.85,s*0.08,s*0.18,-0.4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.15,y-s*0.85,s*0.08,s*0.18,0.4,0,Math.PI*2);ctx.fill();
  // Pulsing halo
  const _hr=s*0.4+Math.sin(frame*0.08)*s*0.03;
  ctx.save();ctx.globalAlpha=0.7+Math.sin(frame*0.1)*0.15;
  ctx.strokeStyle=isShadow?'#7744bb':isDisc?'#ffaadd':'#ffd700';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.ellipse(x,y-s*0.92,_hr,s*0.1,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
  // Staff/crosier
  const _sx=x+f*s*0.5;
  ctx.strokeStyle=isShadow?'#3a1a5a':'#8B6914';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(_sx,y-s*0.7);ctx.lineTo(_sx+f*s*0.1,y+s*0.7);ctx.stroke();
  // Staff head Ã¢â‚¬â€ curved crosier top
  ctx.strokeStyle=isShadow?'#6622aa':'#8B6914';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(_sx-f*s*0.1,y-s*0.75,s*0.12,Math.PI*1.5,Math.PI*0.5,f<0);ctx.stroke();
  // Gem on staff
  ctx.fillStyle=isShadow?'#aa66ff':isDisc?'#ff88cc':'#66ffaa';
  ctx.beginPath();ctx.arc(_sx-f*s*0.1,y-s*0.87,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.fillStyle='#ffffff';ctx.globalAlpha=0.6;ctx.beginPath();ctx.arc(_sx-f*s*0.1-1,y-s*0.89,s*0.02,0,Math.PI*2);ctx.fill();ctx.restore();
  // Holy particles
  if(frame%6===0){
    const _pc=isShadow?'#aa66ff':isDisc?'#ffaadd':'#ffe066';
    addP(x+rnd(-s*0.5,s*0.5),y+rnd(-s*0.3,s*0.8),_pc,1,3);
  }
  // Prayer book (off-hand)
  const _bx=x-f*s*0.35;
  ctx.fillStyle=isShadow?'#2a0a3a':'#8B4513';
  ctx.fillRect(_bx-s*0.12,y-s*0.1,s*0.24,s*0.3);
  ctx.fillStyle=isShadow?'#6622aa':isDisc?'#ffaadd':'#ffd700';
  ctx.fillRect(_bx-s*0.1,y-s*0.08,s*0.2,s*0.26);
  ctx.fillStyle=isShadow?'#aa66ff':'#ffffff';
  ctx.fillRect(_bx-1,y+s*0.01,2,s*0.1);
  ctx.fillRect(_bx-s*0.04,y+s*0.04,s*0.08,2);
};
function arena_drawMoonkinSpriteOverlay(x,y,s,u,phase){
  return unitSpriteOverlays.drawMoonkinSpriteOverlay(x,y,s,u,phase);
}
function arena_drawToxinSpriteOverlay(x,y,s,u){
  return unitSpriteOverlays.drawToxinSpriteOverlay(x,y,s,u);
}
drawFns.drawBakdounes=function(x,y,u){
  const s=u.size,f=u.facing||1;
  const _isMoonkin=u.branch==='a';
  const _isGrove=u.branch==='b';
  const _isTree=!!u._incarnation;
  const _eclipsePhase=u._eclipse?u._eclipse.phase:'solar';
  const _baseCol=_isMoonkin?'#2a3a8e':(_isGrove?'#2a6a1a':u.color);
  const _robeCol=_isMoonkin?'#0a1a3a':(_isGrove?'#0a2a08':'#1a3a1a');
  const _glowCol=_isMoonkin?(_eclipsePhase==='solar'?'#ffd700':'#aaccff'):(_isGrove?'#33cc33':'#44ff88');
  const _sprite=arena_pickAnimFrame(_bakdounesFlyingFrames,_bakdounesFlyingReady,8)||_v8UnitSprites.bakdounesDruid;
  if(arena_drawUnitSprite(_sprite,x,y,u,{buildScale:ARENA_SPRITE_BUILD_SCALE,waveScale:ARENA_SPRITE_WAVE_SCALE,anchor:0.53,glow:_glowCol,glowAlpha:_isTree?0.22:0.13})){
    if(_isMoonkin)arena_drawMoonkinSpriteOverlay(x,y,s,u,_eclipsePhase);
    if(frame%8===0)addP(x+rnd(-s*0.7,s*0.7),y+rnd(-s*0.5,s*0.8),_glowCol,1,2.5);
    return;
  }
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.55,s*0.14,0,0,Math.PI*2);ctx.fill();
  // Incarnation: Tree of Life glow aura
  if(_isTree){
    ctx.save();const _ta=0.15+Math.sin(frame*0.04)*0.08;
    ctx.globalAlpha=_ta;ctx.fillStyle='#44ff66';ctx.beginPath();ctx.arc(x,y,s*1.2,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=_ta*0.6;ctx.fillStyle='#88ffaa';ctx.beginPath();ctx.arc(x,y,s*0.9,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  ctx.save();ctx.translate(x,y);if(f<0)ctx.scale(-1,1);
  // Druidic robe Ã¢â‚¬â€ flowing nature robe
  ctx.fillStyle=_isTree?'#1a4a0a':_robeCol;
  ctx.beginPath();ctx.moveTo(-s*0.45,s*0.9);ctx.lineTo(-s*0.5,0);ctx.quadraticCurveTo(-s*0.3,-s*0.4,0,-s*0.45);
  ctx.quadraticCurveTo(s*0.3,-s*0.4,s*0.5,0);ctx.lineTo(s*0.45,s*0.9);ctx.closePath();ctx.fill();
  // Vine trim on robe
  ctx.strokeStyle=_isTree?'#44ff66':_glowCol;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(-s*0.45,s*0.9);ctx.lineTo(-s*0.5,0);ctx.quadraticCurveTo(-s*0.3,-s*0.4,0,-s*0.45);
  ctx.quadraticCurveTo(s*0.3,-s*0.4,s*0.5,0);ctx.lineTo(s*0.45,s*0.9);ctx.stroke();
  // Vine pattern on robe
  ctx.strokeStyle=_baseCol;ctx.lineWidth=0.8;ctx.globalAlpha=0.5;
  ctx.beginPath();ctx.moveTo(-s*0.2,s*0.1);ctx.quadraticCurveTo(0,s*0.3,s*0.15,s*0.6);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.15,s*0.0);ctx.quadraticCurveTo(0,s*0.4,-s*0.1,s*0.7);ctx.stroke();
  ctx.globalAlpha=1;
  // Small leaf details on vine
  ctx.fillStyle=_baseCol;ctx.globalAlpha=0.6;
  ctx.beginPath();ctx.ellipse(-s*0.05,s*0.25,s*0.04,s*0.07,0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(s*0.08,s*0.4,s*0.04,s*0.06,-0.4,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  // Belt Ã¢â‚¬â€ bark rope with seed pouches
  ctx.fillStyle='#5a3a1a';ctx.fillRect(-s*0.4,s*0.15,s*0.8,s*0.1);
  ctx.fillStyle='#3a8a2a';
  ctx.beginPath();ctx.arc(-s*0.22,s*0.2,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.22,s*0.2,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffcc44';ctx.beginPath();ctx.arc(0,s*0.2,s*0.05,0,Math.PI*2);ctx.fill();
  // Parsley leaf head Ã¢â‚¬â€ lush druidic crown
  ctx.fillStyle=_isTree?'#33bb33':_baseCol;
  for(let i=0;i<12;i++){
    const a=-Math.PI*0.85+i*Math.PI*1.7/11;
    const lx=Math.cos(a)*s*0.42;const ly=-s*0.55+Math.sin(a)*s*0.28;
    ctx.beginPath();ctx.ellipse(lx,ly,s*0.14,s*0.26,a*0.5,0,Math.PI*2);ctx.fill();
  }
  // Inner leaf glow
  ctx.fillStyle=_isMoonkin?(_eclipsePhase==='solar'?'#aa8822':'#445588'):(_isGrove?'#44aa22':(_isTree?'#55dd44':'#2a8a3a'));
  for(let i=0;i<7;i++){
    const a=-Math.PI*0.65+i*Math.PI*1.3/6;
    ctx.beginPath();ctx.arc(Math.cos(a)*s*0.3,-s*0.55+Math.sin(a)*s*0.17,s*0.09,0,Math.PI*2);ctx.fill();
  }
  // Leaf vein highlights
  ctx.fillStyle='#88ff88';ctx.globalAlpha=0.4;
  ctx.beginPath();ctx.arc(-s*0.1,-s*0.65,s*0.04,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.15,-s*0.6,s*0.035,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(0,-s*0.72,s*0.03,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  // Eyes Ã¢â‚¬â€ nature glow
  const _eyeCol=_isMoonkin?(_eclipsePhase==='solar'?'#ffd700':'#aaccff'):(_isTree?'#88ff88':'#ffffff');
  ctx.fillStyle=_eyeCol;
  ctx.beginPath();ctx.arc(-s*0.12,-s*0.35,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.12,-s*0.35,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=_isTree?'#115511':'#000';
  ctx.beginPath();ctx.arc(-s*0.12,-s*0.35,s*0.03,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.12,-s*0.35,s*0.03,0,Math.PI*2);ctx.fill();
  // Living staff Ã¢â‚¬â€ wooden with sprouting vines
  const _sx=s*0.52;
  ctx.strokeStyle='#6a4a2a';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(_sx,-s*0.65);ctx.lineTo(_sx+s*0.08,s*0.75);ctx.stroke();
  // Vine wrapping staff
  ctx.strokeStyle=_isTree?'#44ff66':'#33aa33';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(_sx,-s*0.4);ctx.quadraticCurveTo(_sx+s*0.1,-s*0.2,_sx,-s*0.0);
  ctx.quadraticCurveTo(_sx-s*0.08,s*0.15,_sx+s*0.05,s*0.3);ctx.stroke();
  // Staff top Ã¢â‚¬â€ blooming flower/seed pod
  ctx.fillStyle=_isTree?'#66ff88':_glowCol;
  ctx.beginPath();ctx.arc(_sx,-s*0.7,s*0.1,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffee88';ctx.beginPath();ctx.arc(_sx,-s*0.7,s*0.05,0,Math.PI*2);ctx.fill();
  // Small leaves sprouting from staff top
  ctx.fillStyle=_isTree?'#44dd44':'#33aa33';
  ctx.beginPath();ctx.ellipse(_sx-s*0.1,-s*0.75,s*0.06,s*0.03,-0.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(_sx+s*0.1,-s*0.72,s*0.05,s*0.03,0.6,0,Math.PI*2);ctx.fill();
  // Staff glow pulse
  if(_isTree||frame%8<4){
    ctx.save();ctx.globalAlpha=0.3+Math.sin(frame*0.08)*0.15;
    ctx.fillStyle=_glowCol;ctx.beginPath();ctx.arc(_sx,-s*0.7,s*0.15,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Moonkin: orbiting sun + moon
  if(_isMoonkin){
    const _orbitA=frame*0.04;
    const _celestialActive=!!u._celestialAlignment;
    // Sun orb
    const _sunA=_orbitA;
    const _sunX=Math.cos(_sunA)*s*0.55,_sunY=-s*0.35+Math.sin(_sunA)*s*0.25;
    const _sunAlpha=(_eclipsePhase==='solar'||_celestialActive)?0.9:0.3;
    ctx.globalAlpha=_sunAlpha;ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(_sunX,_sunY,s*0.09,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffee88';ctx.beginPath();ctx.arc(_sunX,_sunY,s*0.05,0,Math.PI*2);ctx.fill();
    // Sun rays
    if(_eclipsePhase==='solar'||_celestialActive){
      ctx.strokeStyle='#ffd70066';ctx.lineWidth=0.8;
      for(let i=0;i<6;i++){const ra=i*Math.PI/3+frame*0.02;
        ctx.beginPath();ctx.moveTo(_sunX+Math.cos(ra)*s*0.10,_sunY+Math.sin(ra)*s*0.10);
        ctx.lineTo(_sunX+Math.cos(ra)*s*0.16,_sunY+Math.sin(ra)*s*0.16);ctx.stroke();
      }
    }
    // Moon orb (opposite side)
    const _moonA=_orbitA+Math.PI;
    const _moonX=Math.cos(_moonA)*s*0.55,_moonY=-s*0.35+Math.sin(_moonA)*s*0.25;
    const _moonAlpha=(_eclipsePhase==='lunar'||_celestialActive)?0.9:0.3;
    ctx.globalAlpha=_moonAlpha;ctx.fillStyle='#aaccff';ctx.beginPath();ctx.arc(_moonX,_moonY,s*0.08,0,Math.PI*2);ctx.fill();
    // Crescent shadow on moon
    ctx.fillStyle=_robeCol;ctx.beginPath();ctx.arc(_moonX+s*0.03,_moonY-s*0.01,s*0.06,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    // Astral Power indicator Ã¢â‚¬â€ small stars around character
    if(u._astralPower&&u._astralPower.stacks>0){
      for(let i=0;i<u._astralPower.stacks;i++){
        const _sa=frame*0.05+i*Math.PI*2/3;
        const _sx2=Math.cos(_sa)*s*0.35,_sy2=-s*0.7+Math.sin(_sa)*s*0.12;
        ctx.fillStyle='#ccaaff';ctx.globalAlpha=0.7;ctx.beginPath();ctx.arc(_sx2,_sy2,s*0.03,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
    }
  }
  // Grove Keeper: orbiting nature orbs
  if(_isGrove){
    for(let i=0;i<3;i++){
      const _oa=frame*0.03+i*Math.PI*2/3;
      const _ox=Math.cos(_oa)*s*0.5,_oy=-s*0.3+Math.sin(_oa)*s*0.2;
      ctx.fillStyle='#44ff66';ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(_ox,_oy,s*0.04,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    }
  }
  // Nature particles
  if(frame%8===0){
    const _pc=_isMoonkin?(_eclipsePhase==='solar'?'#ffd70044':'#aaccff44'):(_isTree?'#44ff66':'#66ff88');
    addP(x+rnd(-s*0.4,s*0.4),y+rnd(-s*0.5,s*0.6),_pc,1,3);
    if(_isTree)addP(x+rnd(-s*0.6,s*0.6),y+rnd(-s*0.8,s*0.3),'#88ffaa',1,2);
  }
  ctx.restore();
};
drawFns.drawZaatar=function(x,y,u){
  const s=u.size;
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.5,s*0.12,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3c5c22';ctx.beginPath();ctx.ellipse(x,y+s*0.4,s*0.55,s*0.7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x-s*0.55,y+s*0.4);ctx.lineTo(x,y);ctx.lineTo(x+s*0.55,y+s*0.4);ctx.closePath();ctx.fill();
  ctx.strokeStyle=u.accent;ctx.lineWidth=1.5;
  for(let i=-2;i<=2;i++){const ang=-Math.PI/2+i*0.3;ctx.beginPath();ctx.moveTo(x,y-s*0.3);ctx.lineTo(x+Math.cos(ang)*s*0.65,y-s*0.3+Math.sin(ang)*s*0.55);ctx.stroke()}
  ctx.fillStyle=u.color;for(let i=-2;i<=2;i++){const ang=-Math.PI/2+i*0.3;for(let j=1;j<=3;j++){const lx=x+Math.cos(ang)*s*0.65*(j/4),ly=y-s*0.3+Math.sin(ang)*s*0.55*(j/4);ctx.beginPath();ctx.arc(lx,ly,2,0,Math.PI*2);ctx.fill()}}
  ctx.fillStyle='#fff';ctx.fillRect(x+s*0.4,y+s*0.05,s*0.4,s*0.4);
  ctx.fillStyle='#ffd700';ctx.fillRect(x+s*0.55,y+s*0.1,2,s*0.3);
  ctx.fillStyle='#ffd700';ctx.fillRect(x-s*0.2,y-s*0.05,3,2);ctx.fillRect(x+s*0.05,y-s*0.05,3,2);
};
// Habaq Ã¢â‚¬â€ Basil Aromancer. Layered basil leaf-cluster body with mortar + orbiting leaves.
drawFns.drawHabaq=function(x,y,u){
  const s=u.size;
  const bp=u.bobPhase||0;
  const col=u.color||'#5e8a3a';
  const acc=u.accent||'#3c5c22';
  if(u.unitIdx===13&&arena_drawUnitSprite(_v8UnitSprites.habaqMonk,x,y,u,{buildScale:ARENA_SPRITE_BUILD_SCALE,waveScale:ARENA_SPRITE_WAVE_SCALE,anchor:0.51,glow:'#ffb24a',glowAlpha:0.16})){
    if(frame%7===0)addP(x+rnd(-s*0.45,s*0.45),y+rnd(-s*0.35,s*0.45),'#ffb24a',1,2.5);
    return;
  }
  const glow=u.branch==='b'?'#ff6644':(u.branch==='a'?'#44ccff':'#ffb24a');
  const _hbFrames=u.branch==='a'?_habaqBlueFrames:(u.branch==='b'?_habaqRedFrames:_habaqBaseFrames);
  const _hbReady=u.branch==='a'?_habaqBlueReady:(u.branch==='b'?_habaqRedReady:_habaqBaseReady);
  const _hbSprite=arena_pickAnimFrame(_hbFrames,_hbReady,9);
  if(_hbSprite&&arena_drawUnitSprite(_hbSprite,x,y,u,{buildScale:ARENA_SPRITE_BUILD_SCALE,waveScale:ARENA_SPRITE_WAVE_SCALE,anchor:0.51,glow,glowAlpha:0.13})){
    if(u.branch==='b')arena_drawToxinSpriteOverlay(x,y,s,u);
    if(frame%8===0)addP(x+rnd(-s*0.6,s*0.6),y+rnd(-s*0.4,s*0.75),glow,1,2.5);
    return;
  }
  // shadow
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.5,s*0.12,0,0,Math.PI*2);ctx.fill();
  // body: layered basil leaf cluster
  ctx.fillStyle=acc;ctx.beginPath();ctx.ellipse(x,y+s*0.35,s*0.6,s*0.65,0,0,Math.PI*2);ctx.fill();
  // leaf layers (3 overlapping leaves forming the body)
  ctx.fillStyle=col;
  for(let i=-1;i<=1;i++){
    ctx.beginPath();
    ctx.ellipse(x+i*s*0.18,y+s*0.1+Math.abs(i)*s*0.08,s*0.35,s*0.5,i*0.15,0,Math.PI*2);
    ctx.fill();
  }
  // leaf vein lines
  ctx.strokeStyle=acc;ctx.lineWidth=1;ctx.globalAlpha=0.5;
  ctx.beginPath();ctx.moveTo(x,y-s*0.3);ctx.lineTo(x,y+s*0.55);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y+s*0.05);ctx.lineTo(x-s*0.25,y+s*0.25);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y+s*0.05);ctx.lineTo(x+s*0.25,y+s*0.25);ctx.stroke();
  ctx.globalAlpha=1;
  // crown leaves (top Ã¢â‚¬â€ head shape)
  ctx.fillStyle=col;
  ctx.beginPath();ctx.ellipse(x,y-s*0.35,s*0.3,s*0.28,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x,y-s*0.75);ctx.lineTo(x-s*0.15,y-s*0.35);ctx.lineTo(x+s*0.15,y-s*0.35);
  ctx.closePath();ctx.fill();
  // side leaf-arms
  ctx.fillStyle=acc;
  ctx.beginPath();ctx.ellipse(x-s*0.5,y+s*0.15,s*0.18,s*0.08,0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.5,y+s*0.15,s*0.18,s*0.08,-0.3,0,Math.PI*2);ctx.fill();
  // glowing eyes
  const eyePulse=0.7+Math.sin(bp*4)*0.3;
  ctx.fillStyle='#aaffaa';ctx.globalAlpha=eyePulse;
  ctx.beginPath();ctx.arc(x-s*0.1,y-s*0.3,2.2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.1,y-s*0.3,2.2,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  // mortar bowl (held at right side)
  ctx.fillStyle='#8a7a6a';
  ctx.beginPath();ctx.arc(x+s*0.42,y+s*0.2,s*0.14,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#6a5a4a';
  ctx.beginPath();ctx.arc(x+s*0.42,y+s*0.2,s*0.09,0,Math.PI*2);ctx.fill();
  // aromatic mist rising from mortar
  const mistCol=u.branch==='b'?'#aa55dd':u.branch==='a'?'#ffd700':'#88cc66';
  ctx.fillStyle=mistCol;ctx.globalAlpha=0.35+Math.sin(bp*3)*0.15;
  for(let i=0;i<3;i++){
    const my=y+s*0.1-i*s*0.15;
    const mx=x+s*0.42+Math.sin(bp*2+i*1.2)*s*0.08;
    ctx.beginPath();ctx.arc(mx,my,2-i*0.3,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  // orbiting mini basil leaves (4)
  ctx.fillStyle=col;ctx.globalAlpha=0.6;
  for(let i=0;i<4;i++){
    const a=bp*0.5+i*Math.PI/2;
    const lx=x+Math.cos(a)*s*0.75;
    const ly=y-s*0.1+Math.sin(a)*s*0.3;
    ctx.beginPath();ctx.ellipse(lx,ly,3,1.8,a,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
};

// Vodka Ã¢â‚¬â€ VERTICAL flying speeder facing UP toward enemy castle.
// In top-down arena, "up" = -y direction, so the bike's nose (creature head)
// points up, exhaust trails downward, Vodka leans forward (toward the top).
function drawVodka(x,y,u){
  drawVodkaSprite(ctx,{x,y,unit:u,frame,randomRange:rnd,emitParticle:addP});
}
function drawBear(x,y,u){
  return companionSprites.drawBear(x,y,u);
}
function drawMinionFava(x,y,u){
  return companionSprites.drawMinionFava(x,y,u);
}
function drawSheep(x,y,s){
  return companionSprites.drawSheep(x,y,s);
}
function drawTurtle(x,y,s){
  return companionSprites.drawTurtle(x,y,s);
}
function drawPig(x,y,s){
  return companionSprites.drawPig(x,y,s);
}
function drawCritter(x,y,s,critterType){
  return companionSprites.drawCritter(x,y,s,critterType);
}
// =====================================================================
// ARCHETYPE-SPECIFIC ENEMY RENDERERS Ã¢â‚¬â€ distinct silhouette per type
// =====================================================================
function _drawEnemyBody(e,x,y,s){
  if(e.isBoss)return _drawBossBody(e,x,y,s);
  if(e.isElite){
    ctx.save();ctx.strokeStyle='#ffd700';ctx.lineWidth=2.5;ctx.globalAlpha=0.55+0.3*Math.sin(frame*0.1);
    ctx.beginPath();ctx.arc(x,y,s+4,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  if(e.enemyArt==='classic')return enemySprites.drawClassicEnemyBody(e,x,y,s);
  return enemySprites.drawGerbanBroodVehicle(e,x,y,s);
}
function arena_drawEnemyVfxUnder(e,x,y,s){
  renderDrawEnemyVfxUnder(ctx,{enemy:e,x,y,size:s,frame});
}
function arena_drawEnemyVfxOver(e,x,y,s){
  renderDrawEnemyVfxOver(ctx,{enemy:e,x,y,size:s,frame,emitParticle:addP,randomRange:rnd});
}
const enemySprites=createEnemySpriteRenderer({
  ctx,
  view:()=>({frame})
});
// ===== BOSS-SPECIFIC RENDERERS =====
const bossSprites=createBossSpriteRenderer({
  ctx,
  view:()=>({frame}),
  randomRange:rnd,
  emitParticle:addP,
  drawFallbackEnemyBody:enemySprites.drawDpsBody
});
function _drawBossBody(e,x,y,s){return bossSprites.drawBossBody(e,x,y,s)}
function drawDummy(e){
  if(!e||e.hp<=0)return;
  arena_drawWithClashCamera(e.x,e.y,()=>drawDummyRaw(e));
}
function drawDummyRaw(e){
  if(e.hp<=0)return;
  // S7 Wall Boss Ã¢â‚¬â€ purification barrier renders as a glowing oval halo around
  // the boss. Pulsing magic ring + corruption motes fading to green as heals
  // purify it. Heal-progress bar sits below the boss area.
  if(e.isBarrier){
    const r=e.rx||70;                       // perfect circle now (rx==ry)
    const pct=Math.max(0,Math.min(1,(e.healHp||0)/(e.healHpMax||1)));
    // Color blend: purple corruption Ã¢â€ â€™ emerald purification
    const cr=Math.round(0xa8+(0x3a-0xa8)*pct),cg=Math.round(0x55+(0xff-0x55)*pct),cb=Math.round(0xf7+(0x66-0xf7)*pct);
    const ringCol='rgb('+cr+','+cg+','+cb+')';
    ctx.save();
    // Outer pulsing aura Ã¢â‚¬â€ wider, softer, stronger pulse
    const _pulse=0.65+0.30*Math.sin(frame*0.08);
    ctx.strokeStyle=ringCol;ctx.globalAlpha=0.20*_pulse;ctx.lineWidth=16;
    ctx.beginPath();ctx.arc(e.x,e.y,r+10,0,Math.PI*2);ctx.stroke();
    // Mid translucent fill Ã¢â‚¬â€ slightly more opaque so the boss reads as INSIDE
    ctx.fillStyle=ringCol;ctx.globalAlpha=0.13;
    ctx.beginPath();ctx.arc(e.x,e.y,r,0,Math.PI*2);ctx.fill();
    // Hex-shield chord lines Ã¢â‚¬â€ 6 lines connecting points around the perimeter,
    // rotating slowly. Reads as a sci-fi force field, not a fog cloud.
    if(pct<0.97){
      ctx.globalAlpha=0.32*(1-pct*0.5);
      ctx.strokeStyle=ringCol;ctx.lineWidth=1;
      const _rot=frame*0.004;
      for(let i=0;i<6;i++){
        const a1=_rot+i*Math.PI/3,a2=a1+Math.PI*2/3;
        ctx.beginPath();
        ctx.moveTo(e.x+Math.cos(a1)*r,e.y+Math.sin(a1)*r);
        ctx.lineTo(e.x+Math.cos(a2)*r,e.y+Math.sin(a2)*r);
        ctx.stroke();
      }
      ctx.globalAlpha=1;
    }
    // Sharp inner edge ring
    ctx.globalAlpha=0.95;ctx.strokeStyle=ringCol;ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(e.x,e.y,r,0,Math.PI*2);ctx.stroke();
    // Apple-style hairline highlight just inside the edge
    ctx.globalAlpha=0.55;ctx.strokeStyle='#fff';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(e.x,e.y,r-2,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;
    // Corruption motes orbiting the perimeter (fade as purified)
    if(pct<0.95){
      const moteN=10;
      for(let i=0;i<moteN;i++){
        const ang=(frame*0.022+i*Math.PI*2/moteN)%(Math.PI*2);
        const mx=e.x+Math.cos(ang)*r,my=e.y+Math.sin(ang)*r;
        ctx.fillStyle='#a855f7';ctx.globalAlpha=0.55*(1-pct);
        ctx.beginPath();ctx.arc(mx,my,3,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
    }
    ctx.restore();
    ctx.textAlign='left';
    // (Cinematic purify bar is drawn from arena_drawHud so it layers ABOVE the
    // top HUD pills instead of getting clipped underneath them.)
    return;
  }
  // Burrowed: render only a small mound + dust, no sprite. Untargetable phase.
  if(e.burrowing){
    const bx=e.x,by=e.y;
    ctx.fillStyle='#7a5028';ctx.globalAlpha=0.8;
    ctx.beginPath();ctx.ellipse(bx,by+4,e.size*0.5,e.size*0.18,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.24+0.10*Math.sin(frame*0.12);
    ctx.strokeStyle='#d0a060';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(bx,by+7,e.size*0.85,e.size*0.28,0,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=0.18;
    ctx.fillStyle='#a07050';
    ctx.beginPath();ctx.ellipse(bx,by+2,e.size*0.24,e.size*0.10,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    if(frame%8===0)addP(bx+rnd(-6,6),by+6,'#a07050',1,3);
    return;
  }
  const flying=!!e.flying;
  // Flying enemies float higher with stronger bob; render a larger ground shadow
  // detached below to telegraph "this thing is in the air."
  const s=e.size,x=e.x,y=e.y+Math.sin(e.bobPhase)*(flying?5:1.5)-(flying?14:0);
  if(e.polymorphTimer>0){
    drawCritter(x,y,s,e._critterType||0);
    if(frame%8===0)addP(x+rnd(-s/2,s/2),y-s,'#fff0bb',1,2);
    drawHpBar(e.x,Math.max(ARENA_TOP+18,e.y-(flying?14:0)-s-8),e.hp,e.maxHp,s+8,e.isBoss?'boss':(e.isElite?'elite':'enemy'));
    return;
  }
  if(flying){
    // Detached ground shadow on the arena floor (matches enemy x, fixed y at e.y+8).
    ctx.fillStyle='#0008';
    ctx.beginPath();ctx.ellipse(e.x,e.y+12,s*0.5,s*0.14,0,0,Math.PI*2);ctx.fill();
    // Wing flap sparkles.
    if(frame%4===0){
      addP(x-s*0.6,y-s*0.1,e.accent||'#fff',1,2);
      addP(x+s*0.6,y-s*0.1,e.accent||'#fff',1,2);
    }
  }
  arena_drawEnemyVfxUnder(e,x,y,s);
  _drawEnemyBody(e,x,y,s);
  arena_drawEnemyVfxOver(e,x,y,s);
  // poison/curse hue overlay
  if(e.poisonTimer>0&&frame%6===0)addP(x+rnd(-s/2,s/2),y-s,'#88ff44',1,2);
  if(e.livingBombTimer>0)addP(x+rnd(-s/2,s/2),y-s,'#ff8800',1,3);
  if(e._livingBombTimer>0&&frame%6===0)addP(x+rnd(-s/2,s/2),y-s,'#ff4400',1,3);
  if(e._igniteStacks&&e._igniteStacks.length>0&&frame%8===0)addP(x+rnd(-s/3,s/3),y+s*0.3,'#ff4400',1,2);
  if(e.doomTimer>0)addP(x+rnd(-s/2,s/2),y-s,'#aa66cc',1,3);
  // Hit flash overlay Ã¢â‚¬â€ bright white ellipse fades over ~6 frames.
  if(e.hitFlash>0){
    ctx.save();
    ctx.fillStyle='#ffffff';ctx.globalAlpha=Math.min(0.7,e.hitFlash*0.12);
    ctx.beginPath();ctx.ellipse(x,y,s*0.85,s*0.95,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Hive Shield visual Ã¢â‚¬â€ pulsing golden ring around boss
  if(e.hiveShield&&e.hiveShield.hp>0){
    ctx.save();
    const shPct=e.hiveShield.hp/e.hiveShield.maxHp;
    const pulse=0.7+0.3*Math.sin(frame*0.1);
    ctx.strokeStyle='#ffdd44';ctx.globalAlpha=0.6*pulse*shPct;ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(x,y,s+8,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=0.15*pulse*shPct;ctx.fillStyle='#ffdd44';
    ctx.beginPath();ctx.arc(x,y,s+6,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  if(e.royalCarapaceTimer>0){
    ctx.save();
    const pct=1-(e.royalCarapaceTimer/(e.royalCarapaceMax||1));
    const bw=Math.min(170,Math.max(92,s*3.2));
    const bh=10;
    const bx=x-bw/2;
    const by=Math.max(ARENA_TOP+2,y-s-28);
    ctx.fillStyle='rgba(20,8,6,0.86)';ctx.beginPath();ctx.roundRect(bx,by,bw,bh,4);ctx.fill();
    ctx.fillStyle='#ff5533';ctx.beginPath();ctx.roundRect(bx,by,Math.max(3,bw*pct),bh,4);ctx.fill();
    ctx.strokeStyle='#ffdd44';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(bx+0.5,by+0.5,bw-1,bh-1,4);ctx.stroke();
    ctx.font='bold 8px Segoe UI';ctx.textAlign='center';ctx.fillStyle='#fff';
    ctx.fillText('HIVE BURST',x,by-2);
    ctx.restore();
  }
  const _enemyHudMinY=ARENA_TOP+18;
  const _enemyBarBaseY=e.y-(flying?14:0);
  const _enemyHpY=Math.max(_enemyHudMinY,_enemyBarBaseY-s-8);
  const _enemyHudY=_enemyHpY;
  drawHpBar(e.x,_enemyHudY,e.hp,e.maxHp,s+8,e.isBoss?'boss':(e.isElite?'elite':'enemy'));
  drawStatusIcons(e,e.x,_enemyHudY-8);
}


  const exportedDrawFns = {};
  for (const key of Object.keys(drawFns)) {
    exportedDrawFns[key] = (...args) => { sync(); return drawFns[key](...args); };
  }

  const wrap = fn => (...args) => { sync(); return fn(...args); };
  return {
    drawFns: exportedDrawFns,
    unitSprites: _v8UnitSprites,
    drawUnitSprite: wrap(arena_drawUnitSprite),
    projColor: wrap(projColor),
    playerVfxColor: wrap(arena_playerVfxColor),
    drawPlayerAuraUnder: wrap(arena_drawPlayerAuraUnder),
    drawPlayerAuraOver: wrap(arena_drawPlayerAuraOver),
    drawUnit: wrap(drawUnit),
    drawUnitRaw: wrap(drawUnitRaw),
    drawStatusIcons: wrap(drawStatusIcons),
    drawHpBar: wrap(drawHpBar),
    drawVodka: wrap(drawVodka),
    drawBear: wrap(drawBear),
    drawMinionFava: wrap(drawMinionFava),
    drawSheep: wrap(drawSheep),
    drawTurtle: wrap(drawTurtle),
    drawPig: wrap(drawPig),
    drawCritter: wrap(drawCritter),
    drawDummy: wrap(drawDummy),
    drawDummyRaw: wrap(drawDummyRaw),
  };
}

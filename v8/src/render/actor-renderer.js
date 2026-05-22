import { GAME_TICK_HZ } from '../core/constants.js';
import { PLAYER_UNITS } from '../data/units.js';
import { drawVodkaSprite } from './vodka.js';
import { createActorOverlayRenderer } from './actor-overlays.js?v=20260522-storm-vizier';
import { createActorSpriteHelpers } from './actor-sprite-helpers.js';
import { createActorEnemyRenderer } from './actor-enemy-renderer.js?v=20260522-storm-vizier';
import { createActorUnitSpriteAssets } from './actor-unit-sprite-assets.js';
import { createActorPlayerRenderer } from './actor-player-renderer.js';
import { createCompanionSpriteRenderer } from './companion-sprites.js';
import { createUnitSpriteOverlayRenderer } from './unit-sprite-overlays.js';

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

const unitSpriteAssets=createActorUnitSpriteAssets({getFrame:()=>frame});
const _v8UnitSprites=unitSpriteAssets.unitSprites;
const companionSprites=createCompanionSpriteRenderer(ctx);
const unitSpriteOverlays=createUnitSpriteOverlayRenderer({
  ctx,
  view:()=>({frame}),
  randomRange:rnd,
  emitParticle:addP
});

const actorSprites=createActorSpriteHelpers({
  ctx,
  unitSprites:_v8UnitSprites,
  getFrame:()=>frame,
  getArena:()=>arena,
  randomRange:rnd,
  emitParticle:addP
});
const actorOverlays=createActorOverlayRenderer({
  ctx,
  tickHz:GAME_TICK_HZ,
  getFrame:()=>frame,
  getState:()=>state,
  getArenaTop:()=>ARENA_TOP
});
const arena_drawUnitSprite=actorSprites.drawUnitSprite;
// Canvas adapts to device portrait ratio (clamped 4:3 Ã¢â€ â€ 19.5:9):
//   iPad / 4:3 portrait                Ã¢â€ â€™  500Ãƒâ€”667  (1.33:1)
//   iPhone 7 (16:9)                    Ã¢â€ â€™  500Ãƒâ€”890  (1.78:1)
//   modern iPhones (X..17 Pro Max)     Ã¢â€ â€™  500Ãƒâ€”1085 (2.17:1)
// Every supported device fills the screen exactly with no letterboxing.
const arena_drawSummonSprite=actorSprites.drawSummonSprite;

const projColor=actorSprites.projColor;
const arena_playerVfxColor=actorSprites.playerVfxColor;
const arena_drawPlayerAuraUnder=actorSprites.drawPlayerAuraUnder;
const arena_drawPlayerAuraOver=actorSprites.drawPlayerAuraOver;
const arena_drawEnemyVfxUnder=actorSprites.drawEnemyVfxUnder;
const arena_drawEnemyVfxOver=actorSprites.drawEnemyVfxOver;
const drawStatusIcons=actorOverlays.drawStatusIcons;
const drawHpBar=actorOverlays.drawHpBar;

// =====================
// DRAWING Ã¢â‚¬â€ UNITS
// =====================
function drawUnit(u){
  if(!u||u.hp<=0)return;
  arena_drawWithClashCamera(u.x,u.y,()=>drawUnitRaw(u));
}
function drawUnitHud(u){
  if(!u||u.hp<=0||!u.isPlayer||u.isMinion||u.isGhost||u.isMirror)return;
  if(!Number.isFinite(u.x)||!Number.isFinite(u.y))return;
  const bob=Math.sin(Number.isFinite(u.bobPhase)?u.bobPhase:0)*1.2;
  const y=u.y+bob;
  const waveBoost=(arena&&arena.phase==='wave')?16:0;
  const hudInfo=playerHudInfo(u);
  const barW=playerHudBarWidth(u);
  const hudMinY=ARENA_TOP+20;
  const hpBarY=Math.max(hudMinY,y-(u.size||20)-8-waveBoost);
  const hudOffset=playerHudOffset(u,hpBarY,barW);
  const hudX=u.x+hudOffset.x;
  const hudY=hpBarY+hudOffset.y;
  drawHpBar(hudX,hudY,u.hp,u.maxHp,barW,hudInfo&&hudInfo.tank?'playerTank':'player');
  drawStatusIcons(u,hudX,hudY-16);
}
function playerHudInfo(u){
  if(!u||!u.isPlayer||u.isMinion||u.isGhost||u.isMirror)return null;
  return {tank:u.arch==='tank'||u.taunt};
}
function playerHudBarWidth(u){
  const info=playerHudInfo(u);
  if(!info)return (u&&u.size?u.size:20)+14;
  return info.tank?Math.max(50,(u.size||20)+24):(u.size||20)+14;
}
function naturalPlayerHudY(u,waveBoost){
  if(!u)return 0;
  const bob=Math.sin(Number.isFinite(u.bobPhase)?u.bobPhase:0)*1.2;
  return Math.max(ARENA_TOP+20,(u.y||0)+bob-(u.size||20)-8-waveBoost);
}
function playerHudOffset(u,baseY,barW){
  const info=playerHudInfo(u);
  if(!(arena&&arena.phase==='wave')||!info)return {x:0,y:0};
  const waveBoost=16;
  const close=(units||[]).filter(other=>{
    if(!other||other.hp<=0||!playerHudInfo(other))return false;
    const otherY=naturalPlayerHudY(other,waveBoost);
    const otherW=playerHudBarWidth(other);
    const overlapX=Math.abs((other.x||0)-(u.x||0))<(barW+otherW)/2+10;
    return overlapX&&Math.abs(otherY-baseY)<20;
  }).sort((a,b)=>((a.y||0)-(b.y||0))||((a.x||0)-(b.x||0))||((a.unitIdx||a.id||0)-(b.unitIdx||b.id||0)));
  const idx=close.indexOf(u);
  if(close.length<2||idx<0)return {x:0,y:0};
  const spacing=Math.max(34,Math.min(54,barW+14));
  const slot=idx-(close.length-1)/2;
  const x=slot*spacing;
  const y=(idx%2===0?-5:6)+(info.tank?-4:0);
  return {x,y};
}
function drawUnitRaw(u){
  if(u.hp<=0)return;
  if(!Number.isFinite(u.x)||!Number.isFinite(u.y))return;
  if(!Number.isFinite(u.bobPhase))u.bobPhase=0;
  if(!Number.isFinite(u.size)||u.size<=0)u.size=16;
  const bob=Math.sin(u.bobPhase)*1.2;
  const y=u.y+bob;
  const _prevX=u._vfxPrevX,_prevY=u._vfxPrevY;
  if(Number.isFinite(_prevX)&&Number.isFinite(_prevY)&&arena&&arena.phase==='wave'){
    const _dx=u.x-_prevX,_dy=u.y-_prevY;
    const _travel=Math.hypot(_dx,_dy);
    if(_travel>18){
      const _cap=Math.min(_travel,46);
      const _ux=_dx/(_travel||1),_uy=_dy/(_travel||1);
      u._shortBurstTrail={fromX:u.x-_ux*_cap,fromY:u.y-_uy*_cap,toX:u.x,toY:u.y,timer:10,maxTimer:10,color:u.accent||u.color||'#ffffff'};
      if(_travel>70&&frame!==(u._lastBurstLandingFrame||-999)){
        u._lastBurstLandingFrame=frame;
        groundFx.push({x:u.x,y:u.y,r:0,maxR:u.size+20,life:0.28,color:u.accent||'#ffffff',flatten:true});
        addP(u.x,u.y,u.accent||u.color||'#ffffff',8,3);
      }
    }
  }
  u._vfxPrevX=u.x;u._vfxPrevY=u.y;
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
  if(u._shortBurstTrail&&u._shortBurstTrail.timer>0){
    const _tr=u._shortBurstTrail;
    const _p=_tr.timer/(_tr.maxTimer||10);
    ctx.save();
    ctx.globalAlpha=0.24*_p;
    ctx.strokeStyle=_tr.color;
    ctx.lineWidth=Math.max(2,u.size*0.16);
    ctx.beginPath();ctx.moveTo(_tr.fromX,_tr.fromY);ctx.lineTo(_tr.toX,_tr.toY);ctx.stroke();
    ctx.globalAlpha=0.12*_p;
    ctx.fillStyle=_tr.color;
    ctx.beginPath();ctx.ellipse(_tr.fromX,_tr.fromY,u.size*0.72,u.size*0.30,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
    _tr.timer--;
    if(_tr.timer<=0)u._shortBurstTrail=null;
  }
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
    if(frame%10===0)addP(u.x+rnd(-u.size,u.size),y+rnd(-u.size/2,u.size/2),'#cc8844',1,2);
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
    if(frame%6===0)addP(u.x+rnd(-u.size,u.size),y-u.size,'#ff6600',1,3);
  }
  if(u.armorBuff>0){
    ctx.strokeStyle='#ffd700';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(u.x,y,u.size+3,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  }
  if(u.hotTimer>0){
    if(frame%12===0)addP(u.x+rnd(-u.size/2,u.size/2),y-u.size,'#3aa84e',1,2);
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
    if(frame%12===0){const ang=Math.random()*Math.PI*2;addP(u.x+Math.cos(ang)*(u.size+2),y+Math.sin(ang)*(u.size+2),'#aaffaa',1,3)}
    if(frame%16===0)addP(u.x+rnd(-4,4),y-u.size-rnd(2,10),'#88cc66',1,2);
    u._essenceHot.timer--;
    if(u._essenceHot.timer<=0)u._essenceHot=null;
  }
  // Golden Shield (Prescient Barrier) Ã¢â‚¬â€ pulsing golden dome + timer
  if(u._goldShield){
    u._goldShield.timer--;
    if(frame%20===0)addP(u.x+rnd(-u.size,u.size),y-u.size-rnd(2,8),'#ffd700',1,2);
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
  const _hudInfo=playerHudInfo(u);
  const _barW=playerHudBarWidth(u);
  const _hudMinY=ARENA_TOP+20;
  const _hpBarY=Math.max(_hudMinY,y-u.size-8-_waveBoost);
  const _hudOffset=playerHudOffset(u,_hpBarY,_barW);
  const _hudX=u.x+_hudOffset.x;
  const _hudY=_hpBarY+_hudOffset.y;
  drawHpBar(_hudX,_hudY,u.hp,u.maxHp,_barW,_hudInfo&&_hudInfo.tank?'playerTank':'player');
  drawStatusIcons(u,_hudX,_hudY-16);
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
      let _px=_hudX-_pipW/2;
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

const actorPlayers=createActorPlayerRenderer({
  ctx,
  getFrame:()=>frame,
  getArena:()=>arena,
  getUnits:()=>units,
  randomRange:rnd,
  emitParticle:addP,
  unitSpriteAssets,
  unitSprites:_v8UnitSprites,
  drawUnitSprite:arena_drawUnitSprite,
  unitSpriteOverlays
});
const drawFns=actorPlayers.drawFns;

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
const actorEnemies=createActorEnemyRenderer({
  ctx,
  getFrame:()=>frame,
  getArenaTop:()=>ARENA_TOP,
  randomRange:rnd,
  emitParticle:addP,
  drawWithClashCamera:arena_drawWithClashCamera,
  drawEnemyVfxUnder:arena_drawEnemyVfxUnder,
  drawEnemyVfxOver:arena_drawEnemyVfxOver,
  drawHpBar,
  drawStatusIcons,
  drawCritter
});
const drawDummy=actorEnemies.drawDummy;
const drawDummyRaw=actorEnemies.drawDummyRaw;

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
    drawUnitHud: wrap(drawUnitHud),
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

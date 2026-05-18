import { ARENA_SPRITE_BUILD_SCALE, ARENA_SPRITE_WAVE_SCALE } from './sprites.js';

export function createActorPlayerSupportRenderer({
  ctx,
  getFrame,
  getArena,
  getUnits,
  randomRange,
  emitParticle,
  unitSpriteAssets,
  unitSprites,
  drawUnitSprite,
  unitSpriteOverlays = {},
} = {}) {
  let frame = 0, arena = null, units = [];
  const rnd = typeof randomRange === 'function' ? randomRange : ((min, max) => min + Math.random() * (max - min));
  const addP = typeof emitParticle === 'function' ? emitParticle : () => {};
  const _v8UnitSprites = unitSprites || {};
  const arena_drawUnitSprite = typeof drawUnitSprite === 'function' ? drawUnitSprite : () => false;

  function sync() {
    frame = getFrame ? getFrame() : frame;
    arena = getArena ? getArena() : arena;
    const nextUnits = getUnits ? getUnits() : units;
    units = Array.isArray(nextUnits) ? nextUnits : units;
  }

  const drawFns = {};

drawFns.drawFoul=function(x,y,u){
  const s=u.size;
  const _jfGlow=u.branch==='a'?'#5a3a8a':(u.branch==='b'?'#ff6600':'#9b59b6');
  const _jfSprite=unitSpriteAssets.pick(u.branch==='a'?'jafaarDemon':(u.branch==='b'?'jafaarDestruction':'jafaar'),10)||unitSpriteAssets.pick('jafaar',10);
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
  const img=unitSpriteAssets.pick('zataar',10);
  if(img){
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
  const img=unitSpriteAssets.pick('rommana',10);
  if(img){
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
  const _nanaaKey=u.branch?'nanaaBase':'nanaaHealer';
  const _sprite=unitSpriteAssets.pick(_nanaaKey,9)||unitSpriteAssets.frames(_nanaaKey)[0];
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
  const _sprite=unitSpriteAssets.pick('bakdounesFlying',8)||_v8UnitSprites.bakdounesDruid;
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
  const _hbSprite=unitSpriteAssets.pick(u.branch==='a'?'habaqBlue':(u.branch==='b'?'habaqRed':'habaqBase'),9);
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


  const exportedDrawFns = {};
  for (const key of Object.keys(drawFns)) {
    exportedDrawFns[key] = (...args) => { sync(); return drawFns[key](...args); };
  }

  return exportedDrawFns;
}

import { ARENA_SPRITE_BUILD_SCALE, ARENA_SPRITE_WAVE_SCALE } from './sprites.js';

export function createActorPlayerTankRenderer({
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

drawFns.drawMalfof=function(x,y,u){
  const s=u.size;
  const _zavsSprite=unitSpriteAssets.pick('zavs',10);
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
  const img=unitSpriteAssets.pick(u.branch==='a'?'taoon':u.branch==='b'?'taoonGreen':'taoonBlue',10);
  if(img){
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
    if(frame%8===0)addP(x+rnd(-s,s),y+rnd(-s,s),'#aaeeff',1,2);
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
  const _batataSprite=unitSpriteAssets.pick(_isBranchA?'batataFlyingBlue':(_isBranchB?'batataFlyingRed':'batataFlying'),8);
  const _batataGlow=_isBranchA?'#6fbf5a':(_isBranchB?'#b0793a':'#6b8e23');
  if(arena_drawUnitSprite(_batataSprite,x,y,u,{buildScale:4.0,waveScale:6.4,anchor:0.50,glow:_batataGlow,glowAlpha:u.incarnationActive?0.22:0.13})){
    if(frame%18===0)addP(x+rnd(-s*0.65,s*0.65),y+rnd(-s*0.45,s*0.85),_batataGlow,1,2.5);
    return;
  }
  // shadow
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.8,s*0.18,0,0,Math.PI*2);ctx.fill();
  // Branch-specific ground VFX
  if(_isBranchA&&frame%24===0)addP(x+rnd(-s*0.4,s*0.4),y+s*0.8,'#6b8e23',1,2);
  if(_isBranchB&&frame%24===0)addP(x+rnd(-s*0.5,s*0.5),y-s*0.5,'#8ab4f8',1,2);
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
    if(frame%12===0)addP(x+rnd(-s,s),y+rnd(-s,s),'#88ff44',1,2);
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
    if(frame%18===0&&_ifs>=2)addP(x+rnd(-s*0.5,s*0.5),y+rnd(-s*0.5,s*0.5),'#c8a050',1,2);
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
    ctx.save();ctx.globalAlpha=0.05+Math.sin(frame*0.06)*0.03;
    ctx.fillStyle='#33cc33';ctx.beginPath();ctx.arc(x,y,u.rejuvAura.radius,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.16;ctx.strokeStyle='#44ff44';ctx.lineWidth=1;ctx.setLineDash([4,6]);ctx.lineDashOffset=-frame*0.3;
    ctx.beginPath();ctx.arc(x,y,u.rejuvAura.radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
    if(frame%30===0)addP(x+rnd(-20,20),y+rnd(-20,20),'#44ff44',1,2);
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
  const _useProtSprite=_isProt&&unitSpriteAssets.isReady('kingProt');
  const _kingSprite=unitSpriteAssets.pick(_useProtSprite?'kingProt':'king',10);
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
  if(_isAW&&frame%7===0){addP(x+rnd(-s*0.5,s*0.5),y-s*0.6,'#ffd700',1,3)}
  if(_isProt&&u.avengersShield&&frame%20===0){
    const _a=frame*0.1;addP(x+Math.cos(_a)*s*0.8,y+Math.sin(_a)*s*0.8,'#88aaff',1,2);
  }
  if(_isHoly&&frame%18===0){addP(x+rnd(-s*0.3,s*0.3),y-rnd(0,s*0.8),'#ffe066',1,2)}
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

  const exportedDrawFns = {};
  for (const key of Object.keys(drawFns)) {
    exportedDrawFns[key] = (...args) => { sync(); return drawFns[key](...args); };
  }

  return exportedDrawFns;
}

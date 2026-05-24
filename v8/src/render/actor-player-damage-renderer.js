import { ARENA_SPRITE_BUILD_SCALE, ARENA_SPRITE_WAVE_SCALE } from './sprites.js';

export function createActorPlayerDamageRenderer({
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

drawFns.drawRoninDragoon=function(x,y,u){
  const s=u.size,f=u.facing||1;
  const sen=u.azureSenStacks||0;
  const life=u.lifeOfDragonTimer>0;
  const guard=u.thirdEyeTimer>0;
  ctx.save();
  ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.66,s*0.14,0,0,Math.PI*2);ctx.fill();
  if(life||sen>=3){
    ctx.globalAlpha=life?0.28:0.18;
    const grad=ctx.createRadialGradient(x,y,0,x,y,s*2.0);
    grad.addColorStop(0,life?'#48c7ff':'#ff4f5e');
    grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,s*2.0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  }
  if(guard){
    ctx.strokeStyle='#7fd7ff';ctx.lineWidth=2;ctx.globalAlpha=0.55+Math.sin(frame*0.2)*0.15;
    ctx.beginPath();ctx.arc(x,y,s*1.25,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;
  }
  // Slim root-warrior body with samurai armor plates.
  ctx.fillStyle='#d9eef8';
  ctx.beginPath();
  ctx.moveTo(x,y-s*1.02);
  ctx.bezierCurveTo(x+s*0.42,y-s*0.86,x+s*0.48,y+s*0.36,x,y+s*0.96);
  ctx.bezierCurveTo(x-s*0.48,y+s*0.36,x-s*0.42,y-s*0.86,x,y-s*1.02);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='#4b6c82';ctx.lineWidth=1.1;ctx.stroke();
  ctx.fillStyle='#1b2940';
  ctx.beginPath();ctx.moveTo(x-s*0.42,y-s*0.42);ctx.lineTo(x+s*0.42,y-s*0.42);ctx.lineTo(x+s*0.34,y+s*0.32);ctx.lineTo(x-s*0.34,y+s*0.32);ctx.closePath();ctx.fill();
  ctx.fillStyle='#2f6fc7';ctx.fillRect(x-s*0.34,y-s*0.28,s*0.68,s*0.13);
  ctx.fillStyle='#ff4f5e';ctx.fillRect(x-s*0.30,y+s*0.04,s*0.60,s*0.12);
  ctx.fillStyle='#0f1a2d';
  ctx.beginPath();ctx.ellipse(x-s*0.48,y-s*0.24,s*0.22,s*0.16,0.25,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.48,y-s*0.24,s*0.22,s*0.16,-0.25,0,Math.PI*2);ctx.fill();
  // Kabuto helm with crescent/dragoon horns.
  ctx.fillStyle='#122038';
  ctx.beginPath();ctx.ellipse(x,y-s*0.72,s*0.42,s*0.30,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ffd166';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x-s*0.22,y-s*0.92);ctx.quadraticCurveTo(x-s*0.50,y-s*1.24,x-s*0.05,y-s*1.05);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.22,y-s*0.92);ctx.quadraticCurveTo(x+s*0.50,y-s*1.24,x+s*0.05,y-s*1.05);ctx.stroke();
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x-s*0.12,y-s*0.74,s*0.045,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.12,y-s*0.74,s*0.045,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#48c7ff';ctx.beginPath();ctx.arc(x-s*0.12,y-s*0.74,s*0.022,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff4f5e';ctx.beginPath();ctx.arc(x+s*0.12,y-s*0.74,s*0.022,0,Math.PI*2);ctx.fill();
  // Katana sweep behind body.
  ctx.strokeStyle='#1a2030';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x-f*s*0.52,y+s*0.58);ctx.lineTo(x+f*s*0.72,y-s*0.58);ctx.stroke();
  ctx.strokeStyle='#e8fbff';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x-f*s*0.48,y+s*0.50);ctx.lineTo(x+f*s*0.84,y-s*0.82);ctx.stroke();
  ctx.strokeStyle='#48c7ff';ctx.lineWidth=1;ctx.globalAlpha=0.8;
  ctx.beginPath();ctx.moveTo(x+f*s*0.18,y-s*0.12);ctx.lineTo(x+f*s*0.84,y-s*0.82);ctx.stroke();
  ctx.globalAlpha=1;
  // Dragoon lance on front side.
  ctx.strokeStyle='#5b1b2a';ctx.lineWidth=2.6;
  ctx.beginPath();ctx.moveTo(x+f*s*0.48,y+s*0.68);ctx.lineTo(x+f*s*0.88,y-s*1.15);ctx.stroke();
  ctx.fillStyle='#ff4f5e';
  ctx.beginPath();ctx.moveTo(x+f*s*0.88,y-s*1.15);ctx.lineTo(x+f*s*1.02,y-s*0.86);ctx.lineTo(x+f*s*0.72,y-s*0.92);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(x+f*s*0.55,y+s*0.28,s*0.055,0,Math.PI*2);ctx.fill();
  // Sen gems under the sprite.
  for(let i=0;i<3;i++){
    const lit=i<sen;
    const gx=x+(i-1)*s*0.22,gy=y+s*1.08;
    ctx.fillStyle=lit?(['#ffd166','#48c7ff','#ff4f5e'][i]):'#111827';
    ctx.beginPath();ctx.arc(gx,gy,s*0.045,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#0008';ctx.lineWidth=0.8;ctx.stroke();
  }
  if(frame%12===0){
    const col=life?(frame%24===0?'#ff4f5e':'#48c7ff'):(sen>=2?'#ffd166':'#48c7ff');
    addP(x+rnd(-s*0.6,s*0.6),y+rnd(-s*0.9,s*0.55),col,1,2.5);
  }
  ctx.restore();
};

drawFns.drawFelfel=function(x,y,u){
  const s=u.size,f=u.facing||1;
  const isStealth=u.stealth&&u.stealthHits===0;
  const alpha=isStealth?0.45:1.0;
  const _ffSprite=unitSpriteAssets.pickFelfel(u.branch,7);
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
      if(u.branch==='a'&&frame%18===0)addP(x+rnd(-s*0.3,s*0.3),y+rnd(-s*0.3,s*0.3),'#7733aa',1,2);
      if(u.branch==='b'&&frame%20===0)addP(x+rnd(-s*0.2,s*0.2),y+s*0.6,'#55aa33',1,2);
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
      if(u.crimsonVial&&u.crimsonVial.active&&frame%10===0)addP(x+rnd(-s*0.3,s*0.3),y+rnd(-s*0.5,0),'#cc3344',1,2);
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
    if(frame%18===0)addP(x+rnd(-s*0.3,s*0.3),y+rnd(-s*0.3,s*0.3),'#7733aa',1,2);
  }
  if(u.branch==='b'){
    // Poison Assassin: green poison drip particles
    if(frame%20===0)addP(x+rnd(-s*0.2,s*0.2),y+s*0.6,'#55aa33',1,2);
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
    if(frame%10===0)addP(x+rnd(-s*0.3,s*0.3),y+rnd(-s*0.5,0),'#cc3344',1,2);
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
  const _jazarSprite=unitSpriteAssets.pick(u.branch==='b'?'jazarBlue':(u.branch==='a'?'jazarYellow':'jazar'),7);
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
      if(frame%18===0)addP(x+rnd(-s*0.55,s*0.55),y+rnd(-s*0.35,s*0.75),_jazarGlow,1,2.5);
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
  const img=unitSpriteAssets.pick('alibaba',12);
  if(img){
    const sprH=s*(arena&&arena.phase==='wave'?ARENA_SPRITE_WAVE_SCALE:ARENA_SPRITE_BUILD_SCALE);const sprW=sprH*(img.naturalWidth/img.naturalHeight);
    const drawW=Math.round(sprW),drawH=Math.round(sprH);
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    if((u.facing||1)<0)ctx.scale(-1,1);
    ctx.drawImage(img,Math.round(-drawW/2),Math.round(-drawH*0.45),drawW,drawH);
    ctx.restore();
    if(frame%18===0)addP(x+rnd(-s*0.4,s*0.4),y+s*0.6,'#ff88ff',1,2);
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

  const exportedDrawFns = {};
  for (const key of Object.keys(drawFns)) {
    exportedDrawFns[key] = (...args) => { sync(); return drawFns[key](...args); };
  }

  return exportedDrawFns;
}

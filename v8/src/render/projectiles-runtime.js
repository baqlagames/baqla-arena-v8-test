export function createProjectilesRuntime(deps) {
  function drawProjectiles(){
    const ctx=deps.ctx;
    const {projectiles,frame}=deps.view();
    const addP=deps.emitParticle;
    const rnd=deps.randomRange;
    const _v8UnitSprites=deps.unitSprites();
    const arena_drawUnitSprite=deps.drawUnitSprite;
    const projColor=deps.projectileColor;
    const arena_camPoint=deps.camPoint;
    const arena_camDepthScaleAt=deps.camDepthScaleAt;

  for(const p of projectiles){
    const _camPoint=typeof arena_camPoint==='function'?arena_camPoint(p.x,p.y):null;
    if(_camPoint){
      const _camScale=typeof arena_camDepthScaleAt==='function'?arena_camDepthScaleAt(p.y):1;
      ctx.save();
      ctx.translate(_camPoint.x,_camPoint.y);
      ctx.scale(_camScale,_camScale);
      ctx.translate(-p.x,-p.y);
    }
    try{
    if(p.aimed){
      // Aimed Shot Ã¢â‚¬â€ bigger gold projectile with a glow halo + tracer dust.
      ctx.fillStyle='#ffd700';
      ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,215,0,0.35)';
      ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.fill();
      if(frame%2===0)addP(p.x,p.y,'#ffd700',1,3);
    }else if(p.projType==='avengersShield'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(frame*0.15);
      ctx.fillStyle='#4488cc';
      ctx.beginPath();
      ctx.moveTo(0,-22);ctx.lineTo(18,0);ctx.lineTo(0,22);ctx.lineTo(-18,0);ctx.closePath();
      ctx.fill();
      ctx.strokeStyle='#ffd700';ctx.lineWidth=3;
      ctx.beginPath();
      ctx.moveTo(0,-22);ctx.lineTo(18,0);ctx.lineTo(0,22);ctx.lineTo(-18,0);ctx.closePath();
      ctx.stroke();
      ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();
      ctx.restore();
      ctx.fillStyle='rgba(136,170,255,0.4)';
      ctx.beginPath();ctx.arc(p.x,p.y,28,0,Math.PI*2);ctx.fill();
      addP(p.x+rnd(-8,8),p.y+rnd(-8,8),'#88aaff',2,4);
      addP(p.x+rnd(-5,5),p.y+rnd(-5,5),'#ffd700',1,3);
    }else if(p.pierce){
      // Pierce Ã¢â‚¬â€ slightly larger blue-tinted with trail
      ctx.fillStyle='#88ddff';
      ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(136,221,255,0.3)';
      ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.fill();
    }else if(p.projType==='holy'){
      // Holy bolt (Zayt) Ã¢â‚¬â€ bright gold with white core + soft outer glow + cross sparkle.
      // Distinctively paladin: looks like a tiny radiant orb with a halo, not a dot.
      ctx.fillStyle='rgba(255,224,102,0.30)';
      ctx.beginPath();ctx.arc(p.x,p.y,11,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,224,102,0.55)';
      ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffffff';
      ctx.beginPath();ctx.arc(p.x,p.y,3.2,0,Math.PI*2);ctx.fill();
      // Cross sparkle Ã¢â‚¬â€ 4 short gold rays for a "holy" feel
      ctx.strokeStyle='#ffe066';ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(p.x-9,p.y);ctx.lineTo(p.x+9,p.y);
      ctx.moveTo(p.x,p.y-9);ctx.lineTo(p.x,p.y+9);
      ctx.stroke();
      // Trail particle every 2nd frame
      if(frame%2===0)addP(p.x,p.y,'#ffe066',1,2);
    }else if(p.blackArrow){
      const _bsz=p.size||12;
      const _dx=p.target?p.target.x-p.x:1,_dy=p.target?p.target.y-p.y:0;
      const _ang=Math.atan2(_dy,_dx);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(_ang);
      ctx.fillStyle='rgba(102,51,170,0.20)';ctx.beginPath();ctx.arc(0,0,_bsz+6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=p.color||'#6633aa';
      ctx.beginPath();ctx.moveTo(_bsz*1.2,0);ctx.lineTo(-_bsz*0.6,-_bsz*0.4);ctx.lineTo(-_bsz*0.6,_bsz*0.4);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ddbbff';ctx.beginPath();ctx.arc(_bsz*0.3,0,_bsz*0.2,0,Math.PI*2);ctx.fill();
      if(p._baMain){ctx.strokeStyle='#9966cc';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-_bsz*0.6,-_bsz*0.5);ctx.lineTo(-_bsz*1.2,-_bsz*0.3);ctx.moveTo(-_bsz*0.6,_bsz*0.5);ctx.lineTo(-_bsz*1.2,_bsz*0.3);ctx.stroke();}
      ctx.restore();
    }else if(p.chaosBolt){
      // Chaos Bolt Ã¢â‚¬â€ large slow green felfire orb with swirling glow
      const _sz=p.size||14;
      ctx.fillStyle='rgba(51,255,102,0.18)';ctx.beginPath();ctx.arc(p.x,p.y,_sz+10,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(80,255,130,0.35)';ctx.beginPath();ctx.arc(p.x,p.y,_sz+4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=p.color||'#33ff66';ctx.beginPath();ctx.arc(p.x,p.y,_sz*0.6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ccffcc';ctx.beginPath();ctx.arc(p.x,p.y,_sz*0.25,0,Math.PI*2);ctx.fill();
      // Swirl sparks
      for(let _ci=0;_ci<3;_ci++){const _ca=frame*0.12+_ci*2.1;addP(p.x+Math.cos(_ca)*_sz*0.7,p.y+Math.sin(_ca)*_sz*0.7,p.color||'#33ff66',2,3)}
      if(frame%2===0)addP(p.x+rnd(-_sz*0.4,_sz*0.4),p.y+rnd(-_sz*0.4,_sz*0.4),'#88ffaa',1,3);
    }else if(p.stampedeBeast){
      // Stampede beast Ã¢â‚¬â€ running animal silhouette
      const _bs=p.size||16;
      const _sbStrong=p._beastKind==='spiritBeast'||p._beastKind==='direBeast'||p._beastKind==='bear';
      const _sbImg=_sbStrong?_v8UnitSprites.zaatarMinionStrong:_v8UnitSprites.zaatarMinionWeak;
      const _sbGlow=_sbStrong?'#44ff88':'#ffb22e';
      if(arena_drawUnitSprite(_sbImg,p.x,p.y,{size:_bs,facing:1},{buildScale:1.55,waveScale:2.05,anchor:0.58,glow:_sbGlow,glowAlpha:0.12})){
        if(frame%3===0)addP(p.x-_bs+rnd(-3,3),p.y+rnd(-2,2),'#aa8833',1,2);
        continue;
      }
      ctx.save();ctx.fillStyle=p.color;
      ctx.beginPath();ctx.ellipse(p.x,p.y,_bs*0.7,_bs*0.45,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(p.x+_bs*0.5,p.y-_bs*0.2,_bs*0.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x+_bs*0.6,p.y-_bs*0.25,2,0,Math.PI*2);ctx.fill();
      // Running legs
      const _legOff=Math.sin(frame*0.3+p._beastIdx*1.5)*_bs*0.2;
      ctx.strokeStyle=p.color;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(p.x-_bs*0.3,p.y+_bs*0.3);ctx.lineTo(p.x-_bs*0.3,p.y+_bs*0.6+_legOff);ctx.stroke();
      ctx.beginPath();ctx.moveTo(p.x+_bs*0.2,p.y+_bs*0.3);ctx.lineTo(p.x+_bs*0.2,p.y+_bs*0.6-_legOff);ctx.stroke();
      ctx.restore();
      // Dust trail
      if(frame%3===0)addP(p.x-_bs+rnd(-3,3),p.y+rnd(-2,2),'#aa8833',1,2);
    }else if(p.projType==='pomOrb'){
      const _os=10;
      ctx.save();ctx.fillStyle=p.color||'#66ffaa';
      ctx.globalAlpha=0.2;ctx.beginPath();ctx.arc(p.x,p.y,_os+4,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(p.x,p.y,_os,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.globalAlpha=0.8;ctx.beginPath();ctx.arc(p.x,p.y,_os*0.35,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.7;const _oa=frame*0.18;
      ctx.beginPath();ctx.arc(p.x+Math.cos(_oa)*_os*0.7,p.y+Math.sin(_oa)*_os*0.7,2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(p.x+Math.cos(_oa+Math.PI)*_os*0.7,p.y+Math.sin(_oa+Math.PI)*_os*0.7,1.5,0,Math.PI*2);ctx.fill();
      ctx.restore();if(frame%3===0)addP(p.x,p.y,p.color||'#66ffaa',1,2);
    }else if(p.projType==='penanceBolt'){
      ctx.save();ctx.fillStyle=p.color||'#ffaadd';
      ctx.globalAlpha=0.25;ctx.beginPath();ctx.arc(p.x,p.y,11,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.7;ctx.beginPath();ctx.arc(p.x,p.y,6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,204,238,0.6)';ctx.lineWidth=1.5;ctx.globalAlpha=0.6;
      ctx.beginPath();ctx.moveTo(p.x-8,p.y);ctx.lineTo(p.x+8,p.y);ctx.moveTo(p.x,p.y-8);ctx.lineTo(p.x,p.y+8);ctx.stroke();
      ctx.restore();if(frame%2===0)addP(p.x,p.y,p.color||'#ffaadd',1,2);
    }else if(p.projType==='serenityOrb'){
      const _ss=14;
      ctx.save();ctx.fillStyle=p.color||'#66ffaa';
      ctx.globalAlpha=0.15;ctx.beginPath();ctx.arc(p.x,p.y,_ss+6,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(p.x,p.y,_ss,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.globalAlpha=0.7;ctx.beginPath();ctx.arc(p.x,p.y,_ss*0.35,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=p.color||'#66ffaa';ctx.lineWidth=1;ctx.globalAlpha=0.4;
      for(let i=0;i<4;i++){const a=frame*0.1+i*Math.PI/2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(a)*_ss*1.2,p.y+Math.sin(a)*_ss*1.2);ctx.stroke()}
      ctx.restore();if(frame%2===0)addP(p.x+rnd(-4,4),p.y+rnd(-4,4),p.color||'#66ffaa',1,3);
    }else if(p.projType==='wogFlame'){
      const _ws=12;
      ctx.save();
      ctx.fillStyle='#ff440033';ctx.beginPath();ctx.arc(p.x,p.y,_ws+8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ff6600';ctx.globalAlpha=0.6;ctx.beginPath();ctx.arc(p.x,p.y,_ws,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffaa00';ctx.globalAlpha=0.8;ctx.beginPath();ctx.arc(p.x,p.y,_ws*0.6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffee88';ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(p.x,p.y,_ws*0.25,0,Math.PI*2);ctx.fill();
      ctx.restore();
      if(frame%2===0){addP(p.x+rnd(-5,5),p.y+rnd(-3,5),'#ff6600',1,3);addP(p.x+rnd(-3,3),p.y+rnd(0,4),'#ffaa00',1,2)}
    }else if(p.projType==='voidShard'){
      ctx.save();
      const _vsA=frame*0.15;
      ctx.translate(p.x,p.y);ctx.rotate(_vsA);
      ctx.fillStyle='#1a0a2a';ctx.globalAlpha=0.3;ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#3a0a5a';ctx.globalAlpha=0.8;
      ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,0);ctx.lineTo(1,7);ctx.lineTo(-2,3);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();
      ctx.fillStyle='#aa66ff';ctx.globalAlpha=0.9;
      ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(2,0);ctx.lineTo(0,4);ctx.lineTo(-2,0);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ddbbff';ctx.globalAlpha=1;ctx.beginPath();ctx.arc(0,0,1.5,0,Math.PI*2);ctx.fill();
      ctx.restore();
      if(frame%2===0)addP(p.x+rnd(-3,3),p.y+rnd(-3,3),'#6622aa',1,2);
    }else if(p.projType==='voidOrb'){
      ctx.save();
      ctx.fillStyle='#1a0a2a';ctx.globalAlpha=0.2;ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#aa66ff';ctx.lineWidth=1.5;ctx.globalAlpha=0.6;ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#3a0a5a';ctx.globalAlpha=0.7;ctx.beginPath();ctx.arc(p.x,p.y,6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a0020';ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();
      const _voR=frame*0.1;
      ctx.strokeStyle='#aa66ff';ctx.lineWidth=1;ctx.globalAlpha=0.4;
      ctx.beginPath();ctx.ellipse(p.x,p.y,8,4,_voR,0,Math.PI*2);ctx.stroke();
      ctx.restore();
      if(frame%2===0)addP(p.x+rnd(-4,4),p.y+rnd(-4,4),'#aa66ff',1,2);
    }else if(p.projType==='voidBolt'){
      ctx.save();ctx.fillStyle='#6622aa';
      ctx.globalAlpha=0.25;ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#aa66ff';ctx.globalAlpha=0.7;ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ddbbff';ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill();
      ctx.restore();if(frame%2===0)addP(p.x,p.y,'#6622aa',1,2);
    }else if(p.projType==='bolt'&&p.attacker&&(p.attacker.unitIdx===9||(p.attacker.parent&&p.attacker.parent.unitIdx===9))){
      const _src=p.attacker;
      const _heavy=_src._turretArtillery||_src.kind==='turret';
      const _escort=_src.kind==='mechTurret'||(_src.mechSuit&&_src.mechSuit.active);
      const _col=_heavy?'#ffcc66':(_escort?'#ff5ca8':'#44ccff');
      const _tx=p.target?p.target.x:p.tx,_ty=p.target?p.target.y:p.ty;
      const _ang=Math.atan2(_ty-p.y,_tx-p.x);
      const _len=_heavy?16:12;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(_ang);
      ctx.fillStyle='rgba(255,179,209,0.22)';ctx.beginPath();ctx.ellipse(0,0,_len*0.8,6,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#d9a52a';ctx.beginPath();ctx.roundRect(-_len*0.45,-3,_len,6,3);ctx.fill();
      ctx.fillStyle=_col;ctx.beginPath();ctx.arc(_len*0.55,0,_heavy?5:4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(_len*0.62,-1,1.6,0,Math.PI*2);ctx.fill();
      ctx.restore();
      if(frame%2===0)addP(p.x-Math.cos(_ang)*6,p.y-Math.sin(_ang)*6,_col,1,3);
    }else{
      ctx.fillStyle=projColor(p.projType);
      ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();
    }
    }finally{
      if(_camPoint)ctx.restore();
    }
  }

  }
  return {drawProjectiles};
}

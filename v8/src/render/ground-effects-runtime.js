export function createGroundEffectsRuntime(deps) {
  function drawGroundFx(){
    const ctx=deps.ctx;
    const {groundFx,frame}=deps.view();
    const rnd=deps.randomRange;
    const addP=deps.emitParticle;
    const clamp=deps.clampValue;

  for(const g of groundFx){
    if(g.unitDown){
      const t=Math.max(0,Math.min(1,g.life/2.8));
      const c=g.color||'#ff6666';
      ctx.save();
      ctx.globalAlpha=0.75*t;
      ctx.fillStyle='rgba(30,8,8,0.42)';
      ctx.beginPath();ctx.ellipse(g.x,g.y,26,9,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=c;ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(g.x,g.y,Math.max(12,g.r),Math.max(4,g.r*0.34),0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='rgba(30,8,8,0.78)';
      ctx.beginPath();ctx.roundRect(g.x-16,g.y-29,32,16,7);ctx.fill();
      ctx.strokeStyle=c;ctx.lineWidth=1;
      ctx.beginPath();ctx.roundRect(g.x-15.5,g.y-28.5,31,15,7);ctx.stroke();
      ctx.fillStyle='#ffe3e3';ctx.font='bold 10px Arial';ctx.textAlign='center';
      ctx.fillText('KO',g.x,g.y-17);
      ctx.textAlign='left';
      ctx.restore();
    }else if(g.banner){
      ctx.strokeStyle=g.color;ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.stroke();
      // banner pole
      ctx.fillStyle='#774422';ctx.fillRect(g.x-2,g.y-30,4,30);
      ctx.fillStyle=g.color;ctx.fillRect(g.x+2,g.y-30,12,10);
    }else if(g.wildGrowth&&g.wgFollow&&g.wgFollow.hp>0){
      g.x=g.wgFollow.x;g.y=g.wgFollow.y;
      ctx.fillStyle='rgba(58,168,78,0.25)';ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#3aa84e';ctx.lineWidth=1;ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.stroke();
    }else if(g.volley){
      ctx.fillStyle='rgba(136,255,68,0.2)';ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
      // arrow particles raining
      if(frame%3===0){addP(g.x+rnd(-g.r,g.r),g.y-50,'#aaffaa',1,3)}
    }else if(g.vineLash){
      ctx.strokeStyle=g.color;ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(g.vineFromX,g.vineFromY);ctx.lineTo(g.vineToX,g.vineToY);ctx.stroke();
    }else if(g.solarFlareFx){
      const t=Math.min(1,g.life*2.2),pulse=0.65+Math.sin(frame*0.24)*0.14;
      ctx.save();
      ctx.globalAlpha=t;
      ctx.fillStyle='rgba(255,190,40,'+(0.16*pulse)+')';
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,235,120,0.95)';ctx.lineWidth=3;ctx.shadowColor='#ffb000';ctx.shadowBlur=18;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.globalAlpha=t*0.65;
      for(let i=0;i<8;i++){const a=i*Math.PI/4+frame*0.025;ctx.beginPath();ctx.moveTo(g.x+Math.cos(a)*g.r*0.28,g.y+Math.sin(a)*g.r*0.28);ctx.lineTo(g.x+Math.cos(a)*g.r,g.y+Math.sin(a)*g.r);ctx.stroke()}
      ctx.restore();
      if(frame%2===0)addP(g.x+rnd(-g.r*0.6,g.r*0.6),g.y+rnd(-g.r*0.35,g.r*0.35),'#ffd700',1.5,3);
    }else if(g.lunarStrikeFx){
      const t=Math.min(1,g.life*2.1),pulse=0.65+Math.sin(frame*0.22)*0.12;
      ctx.save();
      ctx.globalAlpha=t;
      ctx.fillStyle='rgba(120,170,255,'+(0.14*pulse)+')';
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(190,220,255,0.95)';ctx.lineWidth=3;ctx.shadowColor='#88aaff';ctx.shadowBlur=18;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,0.75)';ctx.lineWidth=3;ctx.globalAlpha=t*0.8;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r*0.72,-1.1,1.1);ctx.stroke();
      ctx.restore();
      if(frame%2===0)addP(g.x+rnd(-g.r*0.55,g.r*0.55),g.y+rnd(-g.r*0.35,g.r*0.35),'#aaccff',1.4,3);
    }else if(g.celestialAuraFx){
      const t=Math.min(1,g.life*1.8),spin=frame*0.035;
      ctx.save();ctx.globalAlpha=t*0.85;
      ctx.fillStyle='rgba(255,215,0,0.10)';ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(120,170,255,0.10)';ctx.beginPath();ctx.arc(g.x,g.y,g.r*0.78,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffd700';ctx.lineWidth=2;ctx.setLineDash([10,6]);ctx.lineDashOffset=-frame*0.8;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#aaccff';ctx.lineDashOffset=frame*0.7;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r*0.72,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);
      for(let i=0;i<10;i++){
        const a=spin+i*Math.PI*2/10,rr=g.r*(0.35+(i%2)*0.35);
        ctx.fillStyle=i%2?'#aaccff':'#ffd700';ctx.beginPath();ctx.arc(g.x+Math.cos(a)*rr,g.y+Math.sin(a)*rr,2.2,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }else if(g.infernalCrater){
      const t=Math.max(0,Math.min(1,g.life));
      ctx.save();ctx.globalAlpha=t;
      ctx.fillStyle='rgba(45,12,4,0.42)';ctx.beginPath();ctx.ellipse(g.x,g.y,g.r,g.r*0.55,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,88,20,0.75)';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.lineDashOffset=-frame*0.6;
      ctx.beginPath();ctx.ellipse(g.x,g.y,g.r,g.r*0.55,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='rgba(255,170,68,0.12)';ctx.beginPath();ctx.ellipse(g.x,g.y,g.r*0.55,g.r*0.30,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }else if(g.curseBloom){
      const t=Math.max(0,Math.min(1,g.life*1.8));
      const c1=g.color||'#9b59b6',c2=g.altColor||'#55ff77';
      ctx.save();ctx.globalAlpha=t;
      ctx.fillStyle=g.poisonBloom?'rgba(40,80,30,0.18)':'rgba(90,25,110,0.18)';
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=g.poisonBloom?'rgba(170,255,80,0.11)':'rgba(160,85,221,0.10)';
      ctx.beginPath();ctx.arc(g.x,g.y,g.r*0.66,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=c1;ctx.lineWidth=g.felPool?3:2.4;ctx.setLineDash([8,5]);ctx.lineDashOffset=-frame*0.75;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=c2;ctx.lineDashOffset=frame*0.55;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r*(0.50+0.08*Math.sin(frame*0.14)),0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);
      for(let i=0;i<6;i++){
        const a=frame*0.05+i*Math.PI*2/6;
        ctx.fillStyle=i%2?c1:c2;
        ctx.beginPath();ctx.arc(g.x+Math.cos(a)*g.r*0.55,g.y+Math.sin(a)*g.r*0.34,2.2,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
      if(frame%4===0){addP(g.x+rnd(-g.r*0.6,g.r*0.6),g.y+rnd(-g.r*0.4,g.r*0.4),g.poisonBloom?'#55ff77':'#cc88ff',1,2.5)}
    }else if(g.toxicStackFx){
      const stacks=g.stacks||1,maxStacks=g.maxStacks||6,t=Math.min(1,g.life*2.5);
      const prim=stacks>=maxStacks?'#55ff77':(stacks>=3?'#66cc44':'#aa55dd');
      ctx.save();ctx.globalAlpha=t;
      ctx.fillStyle=stacks>=3?'rgba(85,255,119,0.14)':'rgba(170,85,221,0.13)';
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=prim;ctx.lineWidth=stacks>=maxStacks?3:2;ctx.setLineDash(stacks>=maxStacks?[4,3]:[]);
      ctx.lineDashOffset=-frame*0.5;ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      for(let i=0;i<Math.min(stacks,6);i++){const a=frame*0.05+i*Math.PI*2/Math.min(stacks,6);ctx.fillStyle=i%2?'#55ff77':'#aa55dd';ctx.beginPath();ctx.arc(g.x+Math.cos(a)*g.r*0.55,g.y+Math.sin(a)*g.r*0.35,2.2,0,Math.PI*2);ctx.fill()}
      ctx.restore();
    }else if(g.pandemicCloudFx){
      const t=Math.min(1,g.life*1.7),c1=g.color||'#aa55dd',c2=g.altColor||'#55aa33';
      ctx.save();ctx.globalAlpha=t;
      ctx.fillStyle='rgba(125,40,150,0.18)';ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(85,170,60,0.12)';ctx.beginPath();ctx.arc(g.x,g.y,g.r*0.75,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=c1;ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.lineDashOffset=-frame*0.7;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=c2;ctx.lineDashOffset=frame*0.5;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r*0.62,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);ctx.restore();
      if(frame%2===0){addP(g.x+rnd(-g.r*0.65,g.r*0.65),g.y+rnd(-g.r*0.45,g.r*0.45),'#aa55dd',1.8,3);addP(g.x+rnd(-g.r*0.55,g.r*0.55),g.y+rnd(-g.r*0.35,g.r*0.35),'#55ff77',1.4,3)}
    }else if(g.safeZone){
      const t=Math.max(0,Math.min(1,g.life*2.3));
      const active=!!g.active;
      const c=active?(g.color||'#d8f8ff'):'#8fb8c8';
      ctx.save();
      ctx.globalAlpha=active?(0.55+0.18*Math.sin(frame*0.18))*t:0.28*t;
      ctx.fillStyle=active?'rgba(216,248,255,0.18)':'rgba(120,160,180,0.10)';
      ctx.beginPath();ctx.ellipse(g.x,g.y,g.maxR,g.maxR*0.36,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=c;ctx.lineWidth=active?3:2;ctx.setLineDash(active?[12,5]:[5,6]);ctx.lineDashOffset=-frame*(active?0.9:0.35);
      ctx.beginPath();ctx.ellipse(g.x,g.y,g.maxR,g.maxR*0.36,0,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);
      if(active){
        ctx.strokeStyle='#ffffff';ctx.globalAlpha=0.72*t;ctx.lineWidth=1.2;
        ctx.beginPath();ctx.ellipse(g.x,g.y,g.maxR*0.62,g.maxR*0.21,0,0,Math.PI*2);ctx.stroke();
      }
      ctx.fillStyle=active?'#eef8ff':'#d8f8ff';ctx.font='bold 11px Arial';ctx.textAlign='center';
      ctx.fillText(g.label||(active?'SAFE ICE':'SAFE ICE'),g.x,g.y+4);
      ctx.textAlign='left';
      ctx.restore();
    }else if(g.iceCometFall){
      const p=Math.max(0,Math.min(1,g.progress||0));
      const c=g.color||'#d8f8ff';
      const y=g.y-(1-p)*(g.height||150);
      ctx.save();
      ctx.globalAlpha=0.22+0.58*p;
      ctx.fillStyle='rgba(6,20,45,0.35)';
      ctx.beginPath();ctx.ellipse(g.x,g.y,Math.max(10,g.maxR*0.42),Math.max(4,g.maxR*0.14),0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=c;ctx.lineWidth=4;ctx.shadowColor=c;ctx.shadowBlur=10;
      ctx.beginPath();ctx.moveTo(g.x-9,y-18);ctx.lineTo(g.x+8,y-6);ctx.lineTo(g.x+2,y+17);ctx.lineTo(g.x-10,y+4);ctx.closePath();ctx.stroke();
      ctx.fillStyle='rgba(238,248,255,0.42)';ctx.fill();
      ctx.shadowBlur=0;ctx.strokeStyle='rgba(216,248,255,0.65)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(g.x-2,y-24);ctx.lineTo(g.x-18,y-58);ctx.stroke();
      ctx.restore();
    }else if(g.bossTel){
      // Boss AoE telegraph Ã¢â‚¬â€ pulsing red ring that fills before detonation
      const fillT=clamp(1-(g.telTimer/(g.telMax||30)),0,1);
      const c=g.color||'#ff4444';
      // base fill (warning glow)
      ctx.fillStyle=c+'33';
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.fill();
      // expanding inner pulse
      ctx.fillStyle=c+'66';
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR*fillT,0,Math.PI*2);ctx.fill();
      // outer ring (dashed)
      ctx.strokeStyle=c;ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.lineDashOffset=-frame*0.5;
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);ctx.lineDashOffset=0;
      // countdown text
      if(g.telTimer>5){
        const label=g.label||'!';
        ctx.fillStyle='#fff';ctx.font=label.length>2?'bold 10px Arial':'bold 14px Arial';ctx.textAlign='center';
        ctx.fillText(label,g.x,g.y+4);
        ctx.textAlign='left';
      }
    }else if(g.holyBladeWarn){
      const p=clamp(1-(g.warnTimer/Math.max(1,g.warnMax||36)),0,1);
      const c=g.color||'#ff3d8b';
      ctx.save();
      ctx.lineCap='round';
      if(g.warnKind==='line'){
        const x2=Number.isFinite(g.x2)?g.x2:g.x,y2=Number.isFinite(g.y2)?g.y2:g.y;
        const dx=x2-g.x,dy=y2-g.y,len=Math.hypot(dx,dy)||1;
        const angle=Math.atan2(dy,dx);
        const width=Math.max(34,(g.width||44)*1.0);
        ctx.globalAlpha=0.10+0.10*p;
        ctx.strokeStyle='#1f0f28';ctx.lineWidth=width+5;
        ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(x2,y2);ctx.stroke();
        ctx.globalAlpha=Math.max(0.18,Math.min(0.46,(g.life||0.45)));
        ctx.strokeStyle=c;ctx.lineWidth=width;
        ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(x2,y2);ctx.stroke();
        ctx.globalAlpha=0.34+0.10*Math.sin(frame*0.28);
        ctx.strokeStyle='#fff4cc';ctx.lineWidth=2.0;
        ctx.setLineDash([16,9]);ctx.lineDashOffset=-frame*1.4;
        ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
        ctx.globalAlpha=0.46;
        for(let i=1;i<=2;i++){
          const t=i/3;
          const sx=g.x+dx*t,sy=g.y+dy*t;
          ctx.save();ctx.translate(sx,sy);ctx.rotate(angle);
          ctx.fillStyle=i%2?c:'#ffd166';
          ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-7,-5);ctx.lineTo(-13,0);ctx.lineTo(-7,5);ctx.closePath();ctx.fill();
          ctx.restore();
        }
        if(g.label){
          ctx.globalAlpha=0.68;
          ctx.fillStyle='#fff4cc';ctx.font='bold 9px Arial';ctx.textAlign='center';
          ctx.fillText(g.label,g.x+dx*0.52,g.y+dy*0.52-10);
          ctx.textAlign='left';
        }
      }else{
        ctx.globalAlpha=Math.max(0.18,Math.min(0.50,g.life||0.55));
        ctx.fillStyle=c;
        ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=0.62;
        ctx.strokeStyle=c;ctx.lineWidth=2.4;ctx.setLineDash([14,7]);ctx.lineDashOffset=-frame*1.2;
        ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle='#fff4cc';ctx.lineWidth=1.3;ctx.setLineDash([]);
        ctx.beginPath();ctx.arc(g.x,g.y,Math.max(6,g.maxR*(0.28+0.72*p)),0,Math.PI*2);ctx.stroke();
        if(g.label){
          ctx.fillStyle='#fff4cc';ctx.font='bold 10px Arial';ctx.textAlign='center';
          ctx.fillText(g.label,g.x,g.y+4);
          ctx.textAlign='left';
        }
      }
      ctx.restore();
    }else if(g.enemyWarn){
      const p=clamp(1-(g.warnTimer/Math.max(1,g.warnMax||24)),0,1);
      const c=g.color||'#ff8c00';
      ctx.save();
      ctx.globalAlpha=Math.max(0.15,g.life||0.35);
      if(g.warnKind==='cleave'&&Number.isFinite(g.warnAngle)){
        const a=g.warnAngle,spread=g.warnSpread||0.95;
        ctx.translate(g.x,g.y);
        ctx.rotate(a);
        ctx.fillStyle=c+'24';
        ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,g.maxR,-spread*0.5,spread*0.5);ctx.closePath();ctx.fill();
        ctx.strokeStyle=c;ctx.lineWidth=2.4;ctx.setLineDash([7,4]);ctx.lineDashOffset=-frame*0.9;
        ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,g.maxR,-spread*0.5,spread*0.5);ctx.closePath();ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha=0.45+0.25*Math.sin(frame*0.35);
        ctx.strokeStyle='#ffffff';ctx.lineWidth=1.2;
        ctx.beginPath();ctx.arc(0,0,Math.max(6,g.maxR*p),-spread*0.42,spread*0.42);ctx.stroke();
        ctx.rotate(-a);ctx.translate(-g.x,-g.y);
      }else if(g.warnKind==='line'){
        const x2=Number.isFinite(g.x2)?g.x2:g.x,y2=Number.isFinite(g.y2)?g.y2:g.y;
        ctx.strokeStyle=c;ctx.lineWidth=Math.max(5,g.width||8);ctx.globalAlpha=0.18+0.22*p;
        ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(x2,y2);ctx.stroke();
        ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.globalAlpha=0.45+0.25*Math.sin(frame*0.35);
        ctx.setLineDash([9,5]);ctx.lineDashOffset=-frame;
        ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
      }else{
        ctx.fillStyle=c+'24';
        ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=c;ctx.lineWidth=g.warnKind==='meteor'?3:2.2;
        ctx.setLineDash(g.warnKind==='meteor'?[10,5]:[6,4]);ctx.lineDashOffset=-frame*0.9;
        ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha=0.45+0.25*Math.sin(frame*0.35);
        ctx.strokeStyle='#ffffff';ctx.lineWidth=1.2;
        ctx.beginPath();ctx.arc(g.x,g.y,Math.max(4,g.maxR*p),0,Math.PI*2);ctx.stroke();
      }
      ctx.fillStyle='#fff';ctx.font='bold 12px Arial';ctx.textAlign='center';
      ctx.fillText(g.label||(g.warnKind==='meteor'?'METEOR':(g.warnKind==='line'?'LINE':'!')),g.x,g.y+4);
      ctx.textAlign='left';
      ctx.restore();
    }else if(g.enemyDeathFx){
      const t=Math.max(0,Math.min(1,g.life*2.8));
      const c=g.color||'#ffffff';
      ctx.save();
      ctx.globalAlpha=t;
      if(g.deathKind==='frost'){
        ctx.strokeStyle='#d8f8ff';ctx.lineWidth=2;ctx.shadowColor='#88ddff';ctx.shadowBlur=10;
        for(let i=0;i<6;i++){const a=i*Math.PI/3+frame*0.01;ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(g.x+Math.cos(a)*g.r,g.y+Math.sin(a)*g.r*0.65);ctx.stroke()}
      }else if(g.deathKind==='poison'){
        ctx.fillStyle='rgba(80,180,60,0.18)';ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#bbff55';ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.lineDashOffset=-frame*0.5;ctx.beginPath();ctx.arc(g.x,g.y,g.r*0.86,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        if(frame%3===0)addP(g.x+rnd(-g.r*0.55,g.r*0.55),g.y+rnd(-g.r*0.35,g.r*0.35),'#88ff44',1,2.5);
      }else if(g.deathKind==='shadow'||g.deathKind==='rift'||g.deathKind==='support'){
        const fill=g.deathKind==='rift'?'rgba(120,60,220,0.20)':(g.deathKind==='support'?'rgba(255,170,68,0.16)':'rgba(70,10,90,0.22)');
        ctx.fillStyle=fill;ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(g.x,g.y,g.r*(0.72+0.12*Math.sin(frame*0.1)),0,Math.PI*2);ctx.stroke();
      }else if(g.deathKind==='shield'){
        ctx.strokeStyle='#88ddff';ctx.lineWidth=2;ctx.shadowColor='#44aaff';ctx.shadowBlur=8;
        for(let i=0;i<8;i++){const a=i*Math.PI/4+frame*0.015,rr=g.r*(0.52+(i%2)*0.22);ctx.beginPath();ctx.moveTo(g.x+Math.cos(a)*rr*0.65,g.y+Math.sin(a)*rr*0.40);ctx.lineTo(g.x+Math.cos(a)*rr,g.y+Math.sin(a)*rr*0.62);ctx.stroke()}
      }else if(g.deathKind==='sand'){
        ctx.fillStyle='rgba(200,160,90,0.22)';ctx.beginPath();ctx.ellipse(g.x,g.y,g.r,g.r*0.45,0,0,Math.PI*2);ctx.fill();
        if(frame%3===0)addP(g.x+rnd(-g.r*0.6,g.r*0.6),g.y+rnd(-g.r*0.25,g.r*0.25),'#c8a05a',1,2.5);
      }else{
        ctx.fillStyle=c+'22';ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.stroke();
      }
      ctx.shadowBlur=0;
      ctx.restore();
    }else if(g.poisonCloud){
      ctx.fillStyle='rgba(140,200,80,'+(0.25+Math.sin(frame*0.1)*0.08)+')';
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(140,220,80,0.6)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.stroke();
      if(frame%3===0)addP(g.x+rnd(-g.maxR*0.7,g.maxR*0.7),g.y+rnd(-g.maxR*0.5,g.maxR*0.5),'#88aa44',1,3);
    }else if(g.mistZone){
      const ma=Math.min(1,g.life*2);
      ctx.fillStyle=`rgba(136,204,102,${0.18*ma})`;ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=`rgba(136,204,102,${0.4*ma})`;ctx.lineWidth=1;ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    }else if(g.blizzard){
      ctx.fillStyle='rgba(140,220,255,0.28)';
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(140,220,255,0.7)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.stroke();
      if(frame%2===0)addP(g.x+rnd(-g.maxR*0.7,g.maxR*0.7),g.y+rnd(-g.maxR*0.6,g.maxR*0.6),'#aaeeff',1,2);
    }else if(g.jazarAnchor){
      const pulse=0.45+Math.sin(frame*0.18)*0.12;
      ctx.save();
      ctx.fillStyle=`rgba(68,204,255,${0.16+pulse*0.12})`;
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(136,238,255,0.9)';ctx.lineWidth=2;ctx.setLineDash([8,5]);ctx.lineDashOffset=-frame*0.7;
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle='rgba(255,255,255,0.85)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR*0.45,0,Math.PI*2);ctx.stroke();
      ctx.translate(g.x,g.y);ctx.rotate(frame*0.08);
      ctx.fillStyle='#88eeff';ctx.fillRect(-3,-22,6,44);
      ctx.fillStyle='#ffffff';ctx.fillRect(-1,-16,2,32);
      ctx.restore();
    }else if(g.finalStrikeCircle){
      const t=Math.min(1,g.life*1.8);
      const pulse=0.55+Math.sin(frame*0.22)*0.12;
      ctx.save();
      ctx.globalAlpha=t;
      ctx.fillStyle=`rgba(255,80,20,${0.12*pulse})`;
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,220,80,0.95)';ctx.lineWidth=3;ctx.setLineDash([10,5]);ctx.lineDashOffset=-frame*0.9;
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR*0.72,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }else if(g.finalStrikeWave){
      const t=Math.min(1,g.life*1.6);
      const a=g.waveAngle||0;
      ctx.save();ctx.translate(g.x,g.y);ctx.rotate(a);
      ctx.globalAlpha=t;
      ctx.strokeStyle=g.color||'#ffcc00';ctx.lineWidth=10;ctx.shadowColor='#ff4400';ctx.shadowBlur=16;
      ctx.beginPath();ctx.arc(0,0,g.r,-1.2,1.2);ctx.stroke();
      ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.shadowBlur=0;ctx.globalAlpha=t*0.7;
      ctx.beginPath();ctx.arc(0,0,g.r*0.92,-1.0,1.0);ctx.stroke();
      ctx.restore();
      if(frame%2===0){
        const _a=(g.waveAngle||0)+rnd(-0.9,0.9);
        addP(g.x+Math.cos(_a)*g.r,g.y+Math.sin(_a)*g.r,'#ffcc00',1.5,3);
      }
    }else if(g.stormTile){
      const t=g.stormTimer/30;
      ctx.fillStyle=`rgba(102,0,102,${0.5*t})`;
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR*(1-t),0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#aa00aa';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR,0,Math.PI*2);ctx.stroke();
    }else if(g.bombTrap){
      // Solid pulsing trigger disc + faint outer ring showing the AoE blast.
      const trig=g.btRadius*0.55;  // matches trigger radius below
      const p=0.4+Math.sin(frame*0.18)*0.2;
      // outer AoE blast hint
      ctx.fillStyle=`rgba(255,136,40,${p*0.10})`;
      ctx.beginPath();ctx.arc(g.x,g.y,g.btRadius,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,136,40,0.35)';ctx.lineWidth=1;
      ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(g.x,g.y,g.btRadius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      // trigger zone (solid disc Ã¢â‚¬â€ step in here = boom)
      ctx.fillStyle=`rgba(255,136,40,${p*0.45})`;
      ctx.beginPath();ctx.arc(g.x,g.y,trig,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,136,40,0.95)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(g.x,g.y,trig,0,Math.PI*2);ctx.stroke();
      // bomb icon at center
      ctx.fillStyle='#3a1a1a';ctx.beginPath();ctx.arc(g.x,g.y,5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ff8800';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(g.x,g.y-5);ctx.lineTo(g.x+3,g.y-9);ctx.stroke();
    }else if(g.moonfire){
      const t=g.life;
      const boltW=6+Math.random()*4;
      ctx.save();
      ctx.globalAlpha=Math.min(1,t*2.5);
      ctx.strokeStyle='#bb66ff';ctx.lineWidth=boltW;ctx.shadowColor='#9933ff';ctx.shadowBlur=18;
      ctx.beginPath();
      let bx=g.x,by=g.y-300;
      ctx.moveTo(bx,by);
      for(let s=0;s<6;s++){
        by+=(300/6);bx=g.x+(Math.random()-0.5)*28;
        ctx.lineTo(bx,by);
      }
      ctx.lineTo(g.x,g.y);ctx.stroke();
      ctx.strokeStyle='#ddaaff';ctx.lineWidth=boltW*0.4;ctx.shadowBlur=0;
      ctx.beginPath();bx=g.x;by=g.y-300;ctx.moveTo(bx,by);
      for(let s=0;s<6;s++){by+=(300/6);bx=g.x+(Math.random()-0.5)*16;ctx.lineTo(bx,by)}
      ctx.lineTo(g.x,g.y);ctx.stroke();
      ctx.restore();
      ctx.fillStyle=`rgba(160,80,255,${t*0.5})`;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=`rgba(187,102,255,${t*0.8})`;ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(g.x,g.y,g.maxR*0.8,0,Math.PI*2);ctx.stroke();
      if(frame%2===0){addP(g.x+rnd(-20,20),g.y+rnd(-20,20),'#bb66ff',2,4);addP(g.x+rnd(-12,12),g.y+rnd(-8,8),'#ddaaff',1,2)}
    }else if(g.rootVine){
      const _rt=g.rootTarget;
      if(_rt&&_rt.hp>0&&_rt.rootTimer>0){
        const _rx=_rt.rootX||g.x,_ry=_rt.rootY||g.y,_rs=_rt.size||16;
        ctx.save();ctx.globalAlpha=0.7;
        ctx.strokeStyle='#228822';ctx.lineWidth=3;
        for(let v=0;v<4;v++){
          const va=v*1.57+frame*0.03;
          ctx.beginPath();
          ctx.moveTo(_rx,_ry+_rs*0.6);
          ctx.quadraticCurveTo(_rx+Math.cos(va)*_rs*0.8,_ry+Math.sin(va)*_rs*0.4,_rx+Math.cos(va+0.5)*_rs*0.5,_ry-_rs*0.3);
          ctx.stroke();
        }
        ctx.fillStyle='rgba(40,140,40,0.3)';ctx.beginPath();ctx.arc(_rx,_ry+_rs*0.4,_rs*0.8,0,Math.PI*2);ctx.fill();
        ctx.restore();
        g.life=1;
      }else{g.life=0}
    }else if(g.roarWave){
      const t=g.life;
      ctx.save();ctx.globalAlpha=t*0.7;
      ctx.strokeStyle=g.color||'#ffaa33';ctx.lineWidth=4;ctx.shadowColor='#ff6600';ctx.shadowBlur=8;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.globalAlpha=t*0.4;
      ctx.beginPath();ctx.arc(g.x,g.y,g.r*0.9,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }else if(g.swipeSlam){
      const t=g.life;
      ctx.save();ctx.translate(g.x,g.y);
      ctx.globalAlpha=t*0.8;
      ctx.fillStyle='rgba(200,40,40,'+t*0.25+')';
      ctx.beginPath();ctx.arc(0,0,g.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=g.color||'#cc3333';ctx.lineWidth=4;ctx.shadowColor='#ff4444';ctx.shadowBlur=12;
      ctx.beginPath();ctx.arc(0,0,g.r,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#ff8866';ctx.lineWidth=2;ctx.shadowBlur=0;
      ctx.beginPath();ctx.arc(0,0,g.r*0.85,0,Math.PI*2);ctx.stroke();
      for(let c=0;c<3;c++){
        const ca=c*2.1+frame*0.05;
        ctx.strokeStyle='#ff4444';ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(Math.cos(ca)*g.r*0.3,Math.sin(ca)*g.r*0.3);ctx.lineTo(Math.cos(ca)*g.r*0.9,Math.sin(ca)*g.r*0.9);ctx.stroke();
      }
      ctx.restore();
      if(frame%2===0)addP(g.x+rnd(-g.r,g.r),g.y+rnd(-g.r*0.5,g.r*0.5),'#ff4444',1,3);
    }else if(g.swipeArc){
      const t=g.life;
      const _sc=g.color||'#aaffaa';
      ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.swipeAngle||0);
      ctx.globalAlpha=Math.min(1,t*1.5);
      ctx.strokeStyle=_sc;ctx.lineWidth=8;ctx.shadowColor=_sc;ctx.shadowBlur=14;
      ctx.beginPath();ctx.arc(0,0,g.r,-1.4,1.4);ctx.stroke();
      ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.shadowBlur=0;
      ctx.beginPath();ctx.arc(0,0,g.r*0.92,-1.1,1.1);ctx.stroke();
      ctx.restore();
    }else if(g.bladeVortex){
      ctx.save();ctx.translate(g.x,g.y);
      const spin=frame*0.12;
      ctx.globalAlpha=0.3;ctx.fillStyle='#ff880044';ctx.beginPath();ctx.arc(0,0,g.maxR,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.9;ctx.strokeStyle='#ffaa00';ctx.lineWidth=3;ctx.shadowColor='#ff6600';ctx.shadowBlur=10;
      ctx.beginPath();ctx.arc(0,0,g.maxR,0,Math.PI*2);ctx.stroke();
      for(let b=0;b<6;b++){
        const ba=spin+b*Math.PI/3;
        const bx=Math.cos(ba)*g.maxR*0.7,by=Math.sin(ba)*g.maxR*0.7;
        ctx.strokeStyle='#ffcc00';ctx.lineWidth=4;ctx.shadowBlur=6;
        ctx.beginPath();ctx.moveTo(bx-8,by-3);ctx.lineTo(bx+8,by+3);ctx.stroke();
      }
      ctx.strokeStyle='#ff6600';ctx.lineWidth=2;ctx.shadowBlur=0;
      ctx.beginPath();ctx.arc(0,0,g.maxR*0.5,spin,spin+Math.PI*1.2);ctx.stroke();
      ctx.beginPath();ctx.arc(0,0,g.maxR*0.5,spin+Math.PI,spin+Math.PI*2.2);ctx.stroke();
      ctx.restore();
    }else if(g.slowTrap){
      const trig=g.stRadius*0.55;
      const p=0.4+Math.sin(frame*0.18)*0.2;
      // outer slow-zone hint
      ctx.fillStyle=`rgba(120,200,255,${p*0.10})`;
      ctx.beginPath();ctx.arc(g.x,g.y,g.stRadius,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(120,200,255,0.35)';ctx.lineWidth=1;
      ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(g.x,g.y,g.stRadius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      // trigger zone
      ctx.fillStyle=`rgba(120,200,255,${p*0.45})`;
      ctx.beginPath();ctx.arc(g.x,g.y,trig,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(120,200,255,0.95)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(g.x,g.y,trig,0,Math.PI*2);ctx.stroke();
      // tripwire cross
      ctx.strokeStyle='#aaccee';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(g.x-6,g.y);ctx.lineTo(g.x+6,g.y);ctx.moveTo(g.x,g.y-6);ctx.lineTo(g.x,g.y+6);ctx.stroke();
    }else if(g.lightningBolt){
      const _lc=g.color||'#ffee66';
      ctx.save();ctx.strokeStyle=_lc;ctx.lineWidth=g.width||3;ctx.globalAlpha=Math.min(1,g.life*3);
      ctx.shadowColor=_lc;ctx.shadowBlur=12;
      ctx.beginPath();ctx.moveTo(g.x,g.y);
      const dx=g.lbX2-g.x,dy=g.lbY2-g.y;const segs=g.segments||5;
      for(let i=1;i<segs;i++){
        const t=i/segs;ctx.lineTo(g.x+dx*t+rnd(-8,8),g.y+dy*t+rnd(-6,6));
      }
      ctx.lineTo(g.lbX2,g.lbY2);ctx.stroke();
      ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.globalAlpha*=0.7;
      ctx.beginPath();ctx.moveTo(g.x,g.y);
      for(let i=1;i<segs;i++){const t=i/segs;ctx.lineTo(g.x+dx*t+rnd(-4,4),g.y+dy*t+rnd(-3,3))}
      ctx.lineTo(g.lbX2,g.lbY2);ctx.stroke();
      ctx.shadowBlur=0;ctx.restore();
    }else if(g.iceShard){
      ctx.save();ctx.translate(g.x,g.y);
      ctx.rotate(g.x*0.1+g.y*0.07);
      ctx.globalAlpha=Math.min(1,g.life*2.5);
      const _isz=g.maxR||15;
      ctx.fillStyle='#ccebff';ctx.strokeStyle='#88ccff';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,-_isz);ctx.lineTo(_isz*0.3,0);ctx.lineTo(0,_isz*0.6);ctx.lineTo(-_isz*0.3,0);ctx.closePath();
      ctx.fill();ctx.stroke();
      ctx.fillStyle='#ffffff88';
      ctx.beginPath();ctx.moveTo(0,-_isz*0.8);ctx.lineTo(_isz*0.15,-_isz*0.2);ctx.lineTo(-_isz*0.1,-_isz*0.3);ctx.closePath();ctx.fill();
      ctx.restore();
    }else if(g._lodCone){
      ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g._lodAng);
      ctx.globalAlpha=g.life*0.6;
      const _grad=ctx.createRadialGradient(0,0,0,0,0,g.r);
      _grad.addColorStop(0,'rgba(255,215,0,0.5)');_grad.addColorStop(0.6,'rgba(255,224,102,0.25)');_grad.addColorStop(1,'rgba(255,224,102,0)');
      ctx.fillStyle=_grad;
      ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,g.r,-g._lodArc/2,g._lodArc/2);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#ffd700';ctx.lineWidth=2;ctx.globalAlpha=g.life*0.4;
      ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,g.r,-g._lodArc/2,g._lodArc/2);ctx.closePath();ctx.stroke();
      ctx.restore();
    }else{
      // Generic ground-FX renderer Ã¢â‚¬â€ used by paladin sigs (Ashen Hallow,
      // Divine Storm, etc.) and many other one-shot rings. Now honors
      // g.color (was hardcoded brown-orange) and supports g.flatten:true
      // for top-down ground projection (squashed ellipse) so AoE zones
      // read as ground circles instead of mid-air spheres.
      const _gc=g.color||'#a07a44';
      let _gFill=_gc;
      if(typeof _gc==='string'&&_gc[0]==='#'){
        const _hex=_gc.length===4?('#'+_gc[1]+_gc[1]+_gc[2]+_gc[2]+_gc[3]+_gc[3]):_gc;
        const _r=parseInt(_hex.slice(1,3),16);
        const _gn=parseInt(_hex.slice(3,5),16);
        const _b=parseInt(_hex.slice(5,7),16);
        _gFill=`rgba(${_r},${_gn},${_b},${(g.life||1)*0.5})`;
      }
      ctx.fillStyle=_gFill;
      if(g.flatten){
        // Top-down ground projection Ã¢â‚¬â€ squash vertically so the ring sits
        // on the ground plane instead of floating at the FX center.
        ctx.beginPath();ctx.ellipse(g.x,g.y,g.r,g.r*0.42,0,0,Math.PI*2);ctx.fill();
      }else{
        ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
      }
    }
  }

  }
  return {drawGroundFx};
}

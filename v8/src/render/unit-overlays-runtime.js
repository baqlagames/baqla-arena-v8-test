export function createUnitOverlaysRuntime(deps) {
  function drawUnitOverlays(){
    const ctx=deps.ctx;
    const {units,frame}=deps.view();
    const dist=deps.dist;
    const rnd=deps.randomRange;
    const addP=deps.emitParticle;

  for(const u of units){
    if(u.hp<=0&&!u._angelForm)continue;
    const bob=Math.sin(u.bobPhase)*1.2;const y=u.y+bob;const s=u.size;
    if(u._guardianSpirit){
      ctx.save();ctx.globalAlpha=0.35+Math.sin(frame*0.08)*0.15;ctx.fillStyle='#ffd700';
      ctx.beginPath();ctx.moveTo(u.x-s*0.3,y-s*0.5);ctx.quadraticCurveTo(u.x-s*1.8,y-s*1.2,u.x-s*1.6,y+s*0.2);ctx.quadraticCurveTo(u.x-s*0.8,y-s*0.3,u.x-s*0.3,y-s*0.3);ctx.fill();
      ctx.beginPath();ctx.moveTo(u.x+s*0.3,y-s*0.5);ctx.quadraticCurveTo(u.x+s*1.8,y-s*1.2,u.x+s*1.6,y+s*0.2);ctx.quadraticCurveTo(u.x+s*0.8,y-s*0.3,u.x+s*0.3,y-s*0.3);ctx.fill();
      ctx.strokeStyle='#ffd700';ctx.lineWidth=2;ctx.globalAlpha=0.5;
      ctx.beginPath();ctx.ellipse(u.x,y-s*1.1,s*0.5,s*0.15,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    if(u._voidform){
      ctx.save();ctx.strokeStyle='#aa66ff';ctx.lineWidth=1.5;ctx.globalAlpha=0.45;
      for(let i=0;i<3;i++){
        const a=frame*0.06+i*Math.PI*2/3;const r1=s*0.6,r2=s*1.4;
        ctx.beginPath();ctx.moveTo(u.x+Math.cos(a)*r1,y+Math.sin(a)*r1);
        ctx.quadraticCurveTo(u.x+Math.cos(a+0.5)*r2,y+Math.sin(a+0.5)*r2,u.x+Math.cos(a+1)*r1,y+Math.sin(a+1)*r1);ctx.stroke();
      }
      ctx.globalAlpha=0.15;ctx.fillStyle='#3a0a5a';ctx.beginPath();ctx.arc(u.x,y,s*1.5,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.3+Math.sin(frame*0.1)*0.1;ctx.fillStyle='#aa66ff';
      ctx.beginPath();ctx.arc(u.x,y-s*0.8,s*0.15,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    if(u._voidTorrent&&u._voidTorrent.targets&&u._voidTorrent.targets.length>0){
      ctx.save();
      const vt=u._voidTorrent;
      const pulse=Math.sin(frame*0.15)*0.15;
      for(const tgt of vt.targets){
        if(tgt.hp<=0)continue;
        ctx.strokeStyle='#aa66ff';ctx.lineWidth=3;ctx.globalAlpha=0.6+pulse;
        ctx.beginPath();ctx.moveTo(u.x,y);ctx.lineTo(tgt.x,tgt.y);ctx.stroke();
        ctx.strokeStyle='#6622aa';ctx.lineWidth=6;ctx.globalAlpha=0.2;
        ctx.beginPath();ctx.moveTo(u.x,y);ctx.lineTo(tgt.x,tgt.y);ctx.stroke();
        ctx.globalAlpha=0.1+pulse*0.3;ctx.fillStyle='#3a0a5a';
        ctx.beginPath();ctx.arc(tgt.x,tgt.y,vt.splashRadius,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#aa66ff';ctx.lineWidth=2;ctx.globalAlpha=0.4+pulse;
        ctx.beginPath();ctx.arc(tgt.x,tgt.y,vt.splashRadius,0,Math.PI*2);ctx.stroke();
        const ringR=((frame%40)/40)*vt.splashRadius;
        ctx.strokeStyle='#6622aa';ctx.lineWidth=1.5;ctx.globalAlpha=0.3*(1-ringR/vt.splashRadius);
        ctx.beginPath();ctx.arc(tgt.x,tgt.y,ringR,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();
    }
    if(u._madness){
      ctx.save();ctx.strokeStyle='#6622aa';ctx.lineWidth=2;ctx.globalAlpha=0.4;
      for(let i=0;i<5;i++){
        const a=frame*0.04+i*Math.PI*2/5;
        ctx.beginPath();ctx.moveTo(u.x,y);
        ctx.quadraticCurveTo(u.x+Math.cos(a)*s*1.5,y+Math.sin(a)*s*1.5,u.x+Math.cos(a+0.3)*s*2.2,y+Math.sin(a+0.3)*s*2.2);ctx.stroke();
      }
      ctx.globalAlpha=0.12;ctx.fillStyle='#3a0a5a';ctx.beginPath();ctx.arc(u.x,y,s*2,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    if(u._madnessStun>0){
      ctx.save();ctx.globalAlpha=0.6;ctx.fillStyle='#aa66ff';
      for(let i=0;i<3;i++){const a=frame*0.12+i*Math.PI*2/3;ctx.beginPath();ctx.arc(u.x+Math.cos(a)*s*0.6,y-s*1.2+Math.sin(a)*3,2,0,Math.PI*2);ctx.fill()}
      ctx.restore();
    }
    if(u._angelForm){
      ctx.save();ctx.globalAlpha=0.45+Math.sin(frame*0.1)*0.2;ctx.fillStyle='#66ffaa';
      ctx.beginPath();ctx.moveTo(u.x-s*0.3,y-s*0.5);ctx.quadraticCurveTo(u.x-s*2,y-s*1.5,u.x-s*1.8,y+s*0.3);ctx.quadraticCurveTo(u.x-s*0.8,y-s*0.2,u.x-s*0.3,y-s*0.2);ctx.fill();
      ctx.beginPath();ctx.moveTo(u.x+s*0.3,y-s*0.5);ctx.quadraticCurveTo(u.x+s*2,y-s*1.5,u.x+s*1.8,y+s*0.3);ctx.quadraticCurveTo(u.x+s*0.8,y-s*0.2,u.x+s*0.3,y-s*0.2);ctx.fill();
      ctx.globalAlpha=0.1;ctx.fillStyle='#66ffaa';ctx.beginPath();ctx.arc(u.x,y,s*2,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    if(u._divineHymn){
      ctx.save();ctx.globalAlpha=0.25+Math.sin(frame*0.1)*0.1;
      const _ringR=(frame%30)/30*u._divineHymn.radius;
      ctx.strokeStyle='#66ffaa';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(u.x,y,_ringR,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='rgba(102,255,170,0.3)';ctx.lineWidth=2;
      for(const a of units){
        if(!a.isPlayer||a.hp<=0||a===u||a.isGhost)continue;
        if(dist(u,a)>u._divineHymn.radius)continue;
        const ay=a.y+Math.sin(a.bobPhase)*1.2;
        ctx.beginPath();ctx.moveTo(u.x,y);ctx.lineTo(a.x,ay);ctx.stroke();
        ctx.fillStyle='rgba(102,255,170,0.35)';ctx.beginPath();ctx.arc(a.x,ay,4,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=0.08;ctx.fillStyle='#66ffaa';ctx.fillRect(u.x-6,y-s*3,12,s*3);
      ctx.restore();
    }
    if(u._pom&&u._pom.bounces>0&&u.hp>0){
      const _oa=frame*0.12;const _or=s*0.7;
      ctx.save();ctx.fillStyle='rgba(102,255,170,0.3)';
      ctx.beginPath();ctx.arc(u.x+Math.cos(_oa)*_or,y+Math.sin(_oa)*_or*0.4,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#aaffcc';ctx.beginPath();ctx.arc(u.x+Math.cos(_oa)*_or,y+Math.sin(_oa)*_or*0.4,2.5,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    // Beacon of Virtue Ã¢â‚¬â€ golden orbiting light + soft holy glow on each marked ally
    if(u._beaconMark&&u._beaconMark>0){
      u._beaconMark--;
      ctx.save();
      const _ba1=frame*0.08;const _ba2=frame*0.08+Math.PI;
      const _br=s*0.9;
      ctx.globalAlpha=0.5+Math.sin(frame*0.06)*0.15;
      ctx.fillStyle='#ffd700';
      ctx.beginPath();ctx.arc(u.x+Math.cos(_ba1)*_br,y+Math.sin(_ba1)*_br*0.5,3.5,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(u.x+Math.cos(_ba2)*_br,y+Math.sin(_ba2)*_br*0.5,3.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffffff';
      ctx.beginPath();ctx.arc(u.x+Math.cos(_ba1)*_br,y+Math.sin(_ba1)*_br*0.5,1.5,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(u.x+Math.cos(_ba2)*_br,y+Math.sin(_ba2)*_br*0.5,1.5,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.1;ctx.fillStyle='#ffd700';
      ctx.beginPath();ctx.arc(u.x,y,s*1.4,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.25;ctx.strokeStyle='#ffd700';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(u.x,y,s*1.2,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    // Eternal Flame HoT Ã¢â‚¬â€ warm orange glow around healed unit
    if(u._eternalFlame&&u._eternalFlame>0){
      u._eternalFlame--;
      ctx.save();ctx.globalAlpha=0.12+Math.sin(frame*0.1)*0.06;
      ctx.fillStyle='#ff8800';ctx.beginPath();ctx.arc(u.x,y,s*1.3,0,Math.PI*2);ctx.fill();
      if(frame%20===0)addP(u.x+rnd(-s*0.5,s*0.5),y+rnd(-s*0.3,s*0.3),'#ff8800',1,2);
      ctx.restore();
    }
  }
  // Beacon of Virtue Ã¢â‚¬â€ persistent golden connection lines between all marked allies
  const _beaconUnits=[];
  for(const u of units){if(u.hp>0&&u.isPlayer&&u._beaconMark&&u._beaconMark>0)_beaconUnits.push(u)}
  if(_beaconUnits.length>=2){
    ctx.save();
    const _pulse=0.11+Math.sin(frame*0.06)*0.05;
    ctx.strokeStyle='#ffd700';ctx.lineWidth=1.15;ctx.globalAlpha=_pulse;
    for(let i=0;i<_beaconUnits.length;i++){
      for(let j=i+1;j<_beaconUnits.length;j++){
        const a=_beaconUnits[i],b=_beaconUnits[j];
        const ay=a.y+Math.sin(a.bobPhase)*1.2,by=b.y+Math.sin(b.bobPhase)*1.2;
        ctx.beginPath();ctx.moveTo(a.x,ay);ctx.lineTo(b.x,by);ctx.stroke();
      }
    }
    ctx.restore();
  }

  }
  return {drawUnitOverlays};
}

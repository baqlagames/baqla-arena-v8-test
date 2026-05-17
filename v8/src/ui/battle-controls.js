// Live battle bottom controls: resources, castle HP, start wave, and active skills.

import { drawHudIcon, drawHudMeter, drawHudPanel, fitCanvasText, shadeHudColor } from '../render/primitives.js';

export function drawBattleResourceHud(ctx,view){
  const {x,y,w,h,label,value}=view;
  drawHudPanel(ctx,x,y,w,h,{accent:'#ffd54a',top:'rgba(72,48,15,0.98)',mid:'rgba(43,31,12,0.98)',bottom:'rgba(17,14,10,0.98)',radius:12});
  drawHudIcon(ctx,'coin',x+21,y+h/2,12,'#ffd54a');
  ctx.fillStyle='rgba(232,206,134,0.72)';ctx.font='800 8px Segoe UI, Arial';ctx.textAlign='left';
  ctx.fillText(label,x+39,y+15);
  fitCanvasText(ctx,Math.floor(value),x+39,y+33,w-47,19,11,'900','#ffe26b','left');
}

export function drawBattleCastleHud(ctx,view){
  const {x,y,w,h,label}=view;
  const hp=view.hp||0,maxHp=view.maxHp||1;
  const pct=Math.max(0,Math.min(1,hp/maxHp));
  const hpA=pct>0.5?'#31df67':pct>0.25?'#ffb23f':'#ff4f45';
  const hpB=pct>0.5?'#afff8a':pct>0.25?'#ffe174':'#ff8a76';
  drawHudPanel(ctx,x,y,w,h,{accent:hpA,top:'rgba(32,35,58,0.98)',mid:'rgba(21,24,43,0.98)',bottom:'rgba(10,12,24,0.98)',radius:12});
  drawHudIcon(ctx,'crown',x+22,y+18,12,'#ffd54a');
  ctx.fillStyle='rgba(185,193,212,0.75)';ctx.font='800 8px Segoe UI, Arial';ctx.textAlign='left';
  ctx.fillText(label,x+41,y+15);
  fitCanvasText(ctx,Math.ceil(hp)+' / '+maxHp,x+41,y+28,w-49,12,8,'900','#ffffff','left');
  drawHudMeter(ctx,x+10,y+h-10,w-20,6,pct,hpA,hpB);
}

export function drawBattleStartWaveHud(ctx,view){
  const {x,y,w,h}=view;
  const accent='#33e071';
  drawHudPanel(ctx,x,y,w,h,{
    accent,
    top:'rgba(55,183,88,0.98)',
    mid:'rgba(31,123,52,0.98)',
    bottom:'rgba(16,75,33,0.98)',
    radius:12,
    stroke:'rgba(190,255,203,0.35)'
  });
  if(w>86)drawHudIcon(ctx,'play',x+20,y+h/2,11,'#2dd66f');
  ctx.textAlign='center';
  fitCanvasText(ctx,'START WAVE',x+w/2,y+20,w-12,13,9,'900','#ffffff','center');
  ctx.fillStyle='rgba(227,255,230,0.72)';
  ctx.font='800 8px Segoe UI, Arial';
  ctx.fillText('TAP TO BEGIN',x+w/2,y+33);
}

export function drawBattleEnemyChip(ctx,view){
  const {x,y,label}=view;
  const w=Math.max(70,ctx.measureText(label).width+34),h=18;
  drawHudPanel(ctx,x-w,y,w,h,{accent:'#ff6b3d',top:'rgba(86,30,24,0.95)',mid:'rgba(58,24,22,0.95)',bottom:'rgba(28,13,16,0.95)',radius:9,shadowBlur:5,shadowY:1});
  drawHudIcon(ctx,'enemy',x-w+13,y+h/2,8,'#ff6b3d');
  ctx.fillStyle='#ffd0c0';ctx.font='900 9px Segoe UI, Arial';ctx.textAlign='left';
  ctx.fillText(label,x-w+26,y+12);
}

export function drawBattleMobileSkillButton(ctx,view){
  const {label,x,y,w,h,color,used,timer,cost,gold,frame,tickHz,targeting}=view;
  const affordable=gold>=cost,usedOut=used&&timer<=0,active=timer>0;
  const accent=usedOut?'#5f6678':(!affordable?'#a75a42':color);
  const pulse=active?0.18+Math.sin(frame*0.18)*0.08:0;
  drawHudPanel(ctx,x,y,w,h,{
    accent,
    top:active?'rgba(92,37,28,'+(0.96+pulse)+')':(usedOut?'rgba(48,50,66,0.95)':(!affordable?'rgba(71,43,35,0.95)':shadeHudColor(color,1.05))),
    mid:active?'rgba(61,24,21,0.98)':(usedOut?'rgba(31,34,49,0.96)':(!affordable?'rgba(45,29,28,0.96)':shadeHudColor(color,0.78))),
    bottom:active?'rgba(25,13,17,0.98)':(usedOut?'rgba(18,20,32,0.96)':(!affordable?'rgba(23,16,21,0.96)':shadeHudColor(color,0.48))),
    radius:10,
    stroke:targeting?'rgba(255,215,0,0.90)':(active?'rgba(255,255,255,0.38)':(affordable?'rgba(255,255,255,0.18)':'rgba(255,130,90,0.20)'))
  });
  if(w>44)drawHudIcon(ctx,view.icon||'sword',x+15,y+16,9,accent);
  const title=w<64?label.split(/\s+/)[0]:label;
  fitCanvasText(ctx,title,x+w/2,y+16,w-8,10,7,'900',usedOut?'#848a98':'#ffffff','center');
  if(targeting){
    ctx.fillStyle='#ffe26b';ctx.font='900 8px Segoe UI, Arial';ctx.textAlign='center';
    ctx.fillText('TARGET',x+w/2,y+31);
  }else if(active){
    const sec=Math.ceil(timer/tickHz);
    ctx.fillStyle='#fff';ctx.font='900 10px Segoe UI, Arial';ctx.textAlign='center';
    ctx.fillText(sec+'s',x+w/2,y+30);
    const dur=(label==='BLOODLUST'?8:6)*tickHz;
    drawHudMeter(ctx,x+6,y+h-9,w-12,5,Math.max(0,timer/dur),accent,'#fff0a8');
  }else if(used){
    ctx.fillStyle='#8a8f9d';ctx.font='900 9px Segoe UI, Arial';ctx.textAlign='center';
    ctx.fillText('USED',x+w/2,y+31);
  }else{
    ctx.fillStyle=affordable?'#ffe26b':'#c27754';ctx.font='900 12px Segoe UI, Arial';ctx.textAlign='center';
    ctx.fillText(cost+'g',x+w/2,y+31);
  }
  ctx.textAlign='left';
  return {x,y,w,h};
}

export function drawBattleDesktopSkillButton(ctx,view){
  const {label,x,y,w,h,color,used,timer,cost,gold,frame,tickHz,targeting}=view;
  const labels={activeSeparator:' - ',...view.labels};
  ctx.save();
  const affordable=gold>=cost;
  const usedOut=used&&timer<=0;
  const bg=ctx.createLinearGradient(0,y,0,y+h);
  if(usedOut){
    bg.addColorStop(0,'rgba(40,40,52,0.85)');bg.addColorStop(1,'rgba(20,20,28,0.85)');
  }else if(timer>0){
    const p=0.65+Math.sin(frame*0.18)*0.25;
    bg.addColorStop(0,'rgba('+(parseInt(color.slice(1,3),16))+','+(parseInt(color.slice(3,5),16))+','+(parseInt(color.slice(5,7),16))+','+p+')');
    bg.addColorStop(1,color);
  }else if(!affordable){
    bg.addColorStop(0,'rgba(60,40,40,0.7)');bg.addColorStop(1,'rgba(28,18,18,0.7)');
  }else{
    bg.addColorStop(0,color);
    const r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16);
    bg.addColorStop(1,'rgb('+Math.floor(r*0.55)+','+Math.floor(g*0.55)+','+Math.floor(b*0.55)+')');
  }
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(x,y,w,h,8);ctx.fill();
  if(!usedOut){
    const shine=ctx.createLinearGradient(0,y,0,y+6);
    shine.addColorStop(0,'rgba(255,255,255,0.20)');shine.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=shine;ctx.beginPath();ctx.roundRect(x,y,w,6,8);ctx.fill();
  }
  ctx.strokeStyle=targeting?'rgba(255,215,0,0.95)':(usedOut?'rgba(80,80,100,0.4)':(timer>0?'rgba(255,255,255,0.6)':(affordable?'rgba(255,255,255,0.3)':'rgba(140,80,80,0.5)')));
  ctx.lineWidth=targeting?2:1;
  ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,w-1,h-1,8);ctx.stroke();
  ctx.fillStyle=usedOut?'#666':'#fff';
  ctx.textAlign='center';
  const maxLabelW=w-12;
  let fs=12;
  ctx.font='bold '+fs+'px Arial';
  while(fs>9&&ctx.measureText(label).width>maxLabelW){fs--;ctx.font='bold '+fs+'px Arial'}
  ctx.fillText(label,x+w/2,y+Math.round(h*0.38));
  if(targeting){
    ctx.fillStyle='#ffd700';ctx.font='bold 9px Arial';
    ctx.fillText('TAP TARGET',x+w/2,y+Math.round(h*0.72));
  }else if(timer>0){
    const sec=Math.ceil(timer/tickHz);
    ctx.fillStyle='#fff';ctx.font='bold 11px Arial';
    ctx.fillText('ACTIVE'+labels.activeSeparator+sec+'s',x+w/2,y+Math.round(h*0.72));
  }else if(used){
    ctx.fillStyle='#888';ctx.font='bold 9px Arial';
    ctx.fillText('USED',x+w/2,y+Math.round(h*0.72));
  }else{
    ctx.fillStyle=affordable?'#ffd700':'#aa6633';
    ctx.font='bold 13px Arial';
    ctx.fillText(cost+'g',x+w/2,y+Math.round(h*0.76));
  }
  ctx.textAlign='left';
  ctx.restore();
  return {x,y,w,h};
}

export function drawDesktopBattleControls(ctx,view){
  const W=view.width,H=view.height;
  const labels={startWaveSub:'TAP TO BEGIN',activeSeparator:' - ',...view.labels};
  const bY=H-58,bH=42;
  const rects={startWave:null,bloodlust:null,tranquility:null,spells:[]};

  const goldW=Math.round(W*0.32),goldX=8;
  const goldBg=ctx.createLinearGradient(0,bY,0,bY+bH);
  goldBg.addColorStop(0,'rgba(58,40,12,0.95)');
  goldBg.addColorStop(1,'rgba(30,22,8,0.95)');
  ctx.fillStyle=goldBg;ctx.beginPath();ctx.roundRect(goldX,bY,goldW,bH,10);ctx.fill();
  ctx.fillStyle='#ffd700';ctx.beginPath();ctx.roundRect(goldX,bY,3,bH,2);ctx.fill();
  ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(goldX+18,bY+bH/2,8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#aa8a20';ctx.beginPath();ctx.arc(goldX+18,bY+bH/2,6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffd700';ctx.font='bold 7px Arial';ctx.textAlign='center';
  ctx.fillText('G',goldX+18,bY+bH/2+3);
  ctx.fillStyle='#888';ctx.font='8px Arial';ctx.textAlign='left';
  ctx.fillText('GOLD',goldX+32,bY+14);
  ctx.fillStyle='#ffd700';ctx.font='bold 17px Arial';
  ctx.fillText(view.gold,goldX+32,bY+32);

  const kingW=Math.round(W*0.36),kingX=goldX+goldW+6;
  const kingBg=ctx.createLinearGradient(0,bY,0,bY+bH);
  kingBg.addColorStop(0,'rgba(28,28,46,0.95)');
  kingBg.addColorStop(1,'rgba(15,15,28,0.95)');
  ctx.fillStyle=kingBg;ctx.beginPath();ctx.roundRect(kingX,bY,kingW,bH,10);ctx.fill();
  const castle=view.castle;
  if(castle){
    const ratio=Math.max(0,castle.hp/castle.maxHp);
    const hpColor=ratio>0.5?'#3aa84e':(ratio>0.25?'#ffaa44':'#aa3333');
    ctx.fillStyle=hpColor;ctx.beginPath();ctx.roundRect(kingX,bY,3,bH,2);ctx.fill();
    ctx.fillStyle='#ffd700';
    ctx.beginPath();
    ctx.moveTo(kingX+10,bY+17);ctx.lineTo(kingX+16,bY+8);ctx.lineTo(kingX+22,bY+17);
    ctx.lineTo(kingX+28,bY+8);ctx.lineTo(kingX+34,bY+17);ctx.lineTo(kingX+34,bY+23);
    ctx.lineTo(kingX+10,bY+23);ctx.closePath();ctx.fill();
    ctx.fillStyle='#888';ctx.font='8px Arial';ctx.textAlign='left';
    ctx.fillText('KING',kingX+40,bY+14);
    ctx.fillStyle='#fff';ctx.font='bold 11px Arial';
    ctx.fillText(Math.ceil(castle.hp)+' / '+castle.maxHp,kingX+40,bY+27);
    const hpW=kingW-10*2,hpX=kingX+10,hpY=bY+bH-9;
    ctx.fillStyle='rgba(40,15,15,0.95)';ctx.beginPath();ctx.roundRect(hpX,hpY,hpW,5,3);ctx.fill();
    const filled=Math.max(2,hpW*ratio);
    ctx.fillStyle=hpColor;ctx.beginPath();ctx.roundRect(hpX,hpY,filled,5,3);ctx.fill();
  }

  const slotW=W-kingX-kingW-16,slotX=kingX+kingW+6;
  if(view.phase==='build'){
    const startBg=ctx.createLinearGradient(0,bY,0,bY+bH);
    startBg.addColorStop(0,'#3aa84e');startBg.addColorStop(1,'#1f6928');
    ctx.fillStyle=startBg;ctx.beginPath();ctx.roundRect(slotX,bY,slotW,bH,10);ctx.fill();
    const shine=ctx.createLinearGradient(0,bY,0,bY+10);
    shine.addColorStop(0,'rgba(255,255,255,0.20)');shine.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=shine;ctx.beginPath();ctx.roundRect(slotX,bY,slotW,10,10);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 12px Arial';ctx.textAlign='center';
    ctx.fillText('START WAVE',slotX+slotW/2,bY+bH/2);
    ctx.fillStyle='rgba(255,255,255,0.6)';ctx.font='8px Arial';
    ctx.fillText(labels.startWaveSub,slotX+slotW/2,bY+bH/2+12);
    rects.startWave={x:slotX,y:bY,w:slotW,h:bH};
  }else if(view.phase==='wave'){
    const gap=4;
    const skills=(view.activeSkills||[]).slice(0,2);
    const count=Math.max(1,skills.length);
    const skillW=Math.floor((slotW-gap*(count-1))/count);
    for(let i=0;i<skills.length;i++){
      const skill=skills[i];
      const rect=drawBattleDesktopSkillButton(ctx,{...skill,x:slotX+i*(skillW+gap),y:bY,w:skillW,h:bH,gold:view.gold,frame:view.frame,tickHz:view.tickHz,labels:{activeSeparator:labels.activeSeparator}});
      rects.spells.push({...rect,idx:skill.idx});
    }
    if(view.enemyCount>0){
      ctx.font='bold 9px Arial';
      const enemyLabel=view.enemyCount+' ENEMIES';
      const enemyW=ctx.measureText(enemyLabel).width+12;
      ctx.fillStyle='rgba(170,50,30,0.85)';
      ctx.beginPath();ctx.roundRect(kingX+kingW-enemyW-8,bY-12,enemyW,16,8);ctx.fill();
      ctx.fillStyle='#ffd0c0';ctx.textAlign='center';
      ctx.fillText(enemyLabel,kingX+kingW-enemyW/2-8,bY-1);
    }
  }
  ctx.textAlign='left';
  return rects;
}

export function drawMobileBattleControls(ctx,view){
  const W=view.width,H=view.height;
  const bY=H-62,bH=46,padX=8,gap=6;
  let gW=Math.round(W*0.30),kW=Math.round(W*0.36);
  let swW=W-padX*2-gap*2-gW-kW;
  if(swW<82){
    const need=82-swW;
    gW=Math.max(82,gW-Math.ceil(need*0.44));
    kW=Math.max(108,kW-Math.floor(need*0.56));
    swW=W-padX*2-gap*2-gW-kW;
  }
  swW=Math.max(60,swW);
  const gX=padX,kX=gX+gW+gap,swX=kX+kW+gap;
  const rects={startWave:null,bloodlust:null,tranquility:null,spells:[]};
  ctx.fillStyle='rgba(10,10,26,0.98)';
  ctx.fillRect(0,Math.max(0,bY-24),W,H-(bY-24));
  drawBattleResourceHud(ctx,{x:gX,y:bY,w:gW,h:bH,label:'GOLD',value:view.gold});
  const castle=view.castle||{hp:0,maxHp:1};
  drawBattleCastleHud(ctx,{x:kX,y:bY,w:kW,h:bH,label:'KING',hp:castle.hp,maxHp:castle.maxHp});
  if(view.phase==='build'){
    drawBattleStartWaveHud(ctx,{x:swX,y:bY,w:swW,h:bH});
    rects.startWave={x:swX,y:bY,w:swW,h:bH};
  }else if(view.phase==='wave'){
    const ugap=5;
    const skills=(view.activeSkills||[]).slice(0,2);
    const count=Math.max(1,skills.length);
    const uW=Math.floor((swW-ugap*(count-1))/count);
    for(let i=0;i<skills.length;i++){
      const skill=skills[i];
      const rect=drawBattleMobileSkillButton(ctx,{...skill,x:swX+i*(uW+ugap),y:bY,w:uW,h:bH,gold:view.gold,frame:view.frame,tickHz:view.tickHz});
      rects.spells.push({...rect,idx:skill.idx});
    }
    if(view.enemyCount>0){
      ctx.font='900 9px Segoe UI, Arial';
      drawBattleEnemyChip(ctx,{x:kX+kW-8,y:bY-20,label:view.enemyCount+' ENEMIES'});
    }
  }
  ctx.textAlign='left';
  return rects;
}

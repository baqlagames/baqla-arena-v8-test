// Encounter-specific battle HUD bars for bosses and special objectives.

export function drawPurifyBar(ctx,view){
  const W=view.width,pct=view.pct,frame=view.frame;
  const cardX=10,cardW=W-20;
  const cardY=32,cardH=42;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.45)';ctx.shadowBlur=10;ctx.shadowOffsetY=3;
  const bg=ctx.createLinearGradient(0,cardY,0,cardY+cardH);
  bg.addColorStop(0,'rgba(34,30,52,0.96)');bg.addColorStop(1,'rgba(18,16,32,0.96)');
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(cardX,cardY,cardW,cardH,14);ctx.fill();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.strokeStyle='rgba(255,255,255,0.10)';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(cardX+0.5,cardY+0.5,cardW-1,cardH-1,14);ctx.stroke();
  const stripeAlpha=0.85+0.15*Math.sin(frame*0.08);
  ctx.fillStyle='rgba(168,85,247,'+stripeAlpha+')';
  ctx.beginPath();ctx.roundRect(cardX,cardY,3,cardH,2);ctx.fill();
  const titleY=cardY+15;
  ctx.fillStyle='rgba(190,180,210,0.85)';ctx.font='600 9px Segoe UI';ctx.textAlign='left';
  ctx.fillText('PURIFY THE BARRIER',cardX+12,titleY);
  ctx.fillStyle='#ffd966';ctx.font='800 14px Segoe UI';ctx.textAlign='right';
  ctx.fillText(Math.round(pct*100)+'%',cardX+cardW-12,titleY+1);
  const barX=cardX+12,barW=cardW-24,barY=cardY+26,barH=12;
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.beginPath();ctx.roundRect(barX,barY,barW,barH,6);ctx.fill();
  const fg=ctx.createLinearGradient(barX,0,barX+barW,0);
  fg.addColorStop(0,'#3aff7a');fg.addColorStop(1,'#a8ff8c');
  ctx.fillStyle=fg;ctx.beginPath();ctx.roundRect(barX,barY,Math.max(3,barW*pct),barH,6);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.22)';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(barX+0.5,barY+0.5,barW-1,barH-1,6);ctx.stroke();
  if(pct>0.02&&pct<0.98){
    const sx=barX+barW*pct-2;
    const shine=ctx.createLinearGradient(sx-12,0,sx,0);
    shine.addColorStop(0,'rgba(255,255,255,0)');shine.addColorStop(1,'rgba(255,255,255,0.45)');
    ctx.fillStyle=shine;ctx.beginPath();ctx.roundRect(barX+Math.max(0,barW*pct-12),barY+1,Math.min(12,barW*pct),barH-2,4);ctx.fill();
  }
  ctx.restore();
  ctx.textAlign='left';
}

export function drawLieutenantsBar(ctx,view){
  const W=view.width,frame=view.frame,alive=view.alive,total=view.total;
  const cardX=10,cardW=W-20;
  const cardY=32,cardH=42;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.45)';ctx.shadowBlur=10;ctx.shadowOffsetY=3;
  const bg=ctx.createLinearGradient(0,cardY,0,cardY+cardH);
  bg.addColorStop(0,'rgba(46,38,22,0.96)');bg.addColorStop(1,'rgba(24,18,10,0.96)');
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(cardX,cardY,cardW,cardH,14);ctx.fill();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.strokeStyle='rgba(255,255,255,0.10)';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(cardX+0.5,cardY+0.5,cardW-1,cardH-1,14);ctx.stroke();
  const stripeAlpha=0.85+0.15*Math.sin(frame*0.08);
  ctx.fillStyle='rgba(251,191,36,'+stripeAlpha+')';
  ctx.beginPath();ctx.roundRect(cardX,cardY,3,cardH,2);ctx.fill();
  const titleY=cardY+15;
  ctx.fillStyle='rgba(220,200,150,0.85)';ctx.font='600 9px Segoe UI';ctx.textAlign='left';
  ctx.fillText('DEFEAT THE LIEUTENANTS',cardX+12,titleY);
  ctx.fillStyle='#ffd966';ctx.font='800 14px Segoe UI';ctx.textAlign='right';
  ctx.fillText(alive+' / '+total,cardX+cardW-12,titleY+1);
  const dotY=cardY+32,dotR=7,dotGap=18;
  const dotsX=cardX+12;
  for(let i=0;i<total;i++){
    const cx=dotsX+i*dotGap+dotR;
    const isAlive=i<alive;
    if(isAlive){
      ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(cx,dotY,dotR,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.arc(cx-1,dotY-1,dotR-3,0,Math.PI*2);ctx.fill();
    }else{
      ctx.strokeStyle='rgba(150,140,120,0.55)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(cx,dotY,dotR,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='rgba(180,170,150,0.7)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(cx-3,dotY-3);ctx.lineTo(cx+3,dotY+3);
      ctx.moveTo(cx+3,dotY-3);ctx.lineTo(cx-3,dotY+3);ctx.stroke();
    }
  }
  ctx.fillStyle='rgba(190,170,130,0.75)';ctx.font='9px Segoe UI';ctx.textAlign='right';
  ctx.fillText('BOSS LANDS AT 0',cardX+cardW-12,dotY+3);
  ctx.restore();
  ctx.textAlign='left';
}

function bossSkillPills(boss){
  const cd=boss.mechCD||{};
  const skills=[];
  if(boss.aoeCD)skills.push({name:'AOE',col:'#ff8800',cd:cd.aoe||0,max:boss.aoeCD});
  if(boss.lungeCD)skills.push({name:'LUNGE',col:'#ff4444',cd:cd.lunge||0,max:boss.lungeCD});
  if(boss.debuffCD)skills.push({name:'DEBUFF',col:'#aa66cc',cd:cd.debuff||0,max:boss.debuffCD});
  if(boss.spawnCD)skills.push({name:'SPAWN',col:'#44aa44',cd:cd.spawn||0,max:boss.spawnCD});
  if(boss.meteorCD)skills.push({name:'METEOR',col:'#ff4400',cd:cd.meteor||0,max:boss.meteorCD});
  if(boss.burrowCD)skills.push({name:'BURROW',col:'#8b6f3d',cd:cd.burrow||0,max:boss.burrowCD});
  if(boss.poisonCloudCD)skills.push({name:'CLOUD',col:'#88aa44',cd:cd.pcloud||0,max:boss.poisonCloudCD});
  if(boss.magicBoltCD)skills.push({name:'BOLT',col:'#aa88ff',cd:cd.magicBolt||0,max:boss.magicBoltCD});
  if(boss.emberVolleyCD)skills.push({name:'EMBER',col:'#ff8c22',cd:cd.emberVolley||0,max:boss.emberVolleyCD});
  if(boss.emberDecreeCD)skills.push({name:'DECREE',col:'#ffb238',cd:cd.emberDecree||0,max:boss.emberDecreeCD});
  if(boss.royalDiveCD)skills.push({name:'DIVE',col:'#ff5a3a',cd:cd.royalDive||0,max:boss.royalDiveCD});
  if(boss.blizzardCD)skills.push({name:'BLIZ',col:'#88ddff',cd:cd.bliz||0,max:boss.blizzardCD});
  if(boss.stompCD)skills.push({name:'STOMP',col:'#7a8a9a',cd:cd.stomp||0,max:boss.stompCD});
  if(boss.vanishCD)skills.push({name:'VANISH',col:'#aa66cc',cd:cd.vanish||0,max:boss.vanishCD});
  if(boss.iceBlockCD)skills.push({name:'ICE',col:'#88ddff',cd:cd.iceblock||0,max:boss.iceBlockCD});
  return skills;
}

export function drawBossHpBar(ctx,view){
  const W=view.width,frame=view.frame,b=view.boss;
  if(!b)return;
  const cardX=10,cardW=W-20;
  const cardY=32,cardH=42;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.45)';ctx.shadowBlur=8;ctx.shadowOffsetY=2;
  const bg=ctx.createLinearGradient(0,cardY,0,cardY+cardH);
  bg.addColorStop(0,'rgba(38,22,22,0.96)');bg.addColorStop(1,'rgba(20,12,12,0.96)');
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(cardX,cardY,cardW,cardH,10);ctx.fill();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(cardX+0.5,cardY+0.5,cardW-1,cardH-1,10);ctx.stroke();
  const hasShield=b.hiveShield&&b.hiveShield.hp>0;
  const accentCol=hasShield?'#fbbf24':(b.color||'#ff4444');
  const stripeAlpha=0.85+0.15*Math.sin(frame*0.06);
  ctx.fillStyle=accentCol;ctx.globalAlpha=stripeAlpha;
  ctx.beginPath();ctx.roundRect(cardX,cardY,3,cardH,2);ctx.fill();
  ctx.globalAlpha=1;
  const titleY=cardY+13;
  ctx.fillStyle='rgba(220,200,200,0.85)';ctx.font='600 8px Segoe UI';ctx.textAlign='left';
  const tier=b.tier==='vs'?'BOSS':b.tier==='strong'?'BOSS':'MINI-BOSS';
  ctx.fillText(tier,cardX+10,titleY);
  ctx.fillStyle='#fff';ctx.font='bold 10px Segoe UI';
  ctx.fillText(b.name||'Boss',cardX+10+(tier.length*5)+6,titleY);
  const hpPct=Math.max(0,b.hp/b.maxHp);
  ctx.fillStyle='rgba(180,160,160,0.75)';ctx.font='bold 10px Segoe UI';ctx.textAlign='right';
  ctx.fillText(Math.ceil(b.hp)+' / '+b.maxHp,cardX+cardW-10,titleY);
  const barX=cardX+10,barW=cardW-20,barY=cardY+19,barH=8;
  ctx.fillStyle='rgba(0,0,0,0.6)';ctx.beginPath();ctx.roundRect(barX,barY,barW,barH,4);ctx.fill();
  const hpCol=hasShield?'#fbbf24':(hpPct>0.5?'#ef4444':(hpPct>0.25?'#ff6b35':'#dc2626'));
  const fg=ctx.createLinearGradient(barX,0,barX+barW*hpPct,0);
  fg.addColorStop(0,hpCol);fg.addColorStop(1,hasShield?'#ffdd44':'#ff8888');
  ctx.fillStyle=fg;ctx.beginPath();ctx.roundRect(barX,barY,Math.max(3,barW*hpPct),barH,4);ctx.fill();
  if(hasShield){
    const shPct=b.hiveShield.hp/b.hiveShield.maxHp;
    const shW=Math.max(2,barW*hpPct*shPct);
    ctx.fillStyle='rgba(251,191,36,0.4)';ctx.beginPath();ctx.roundRect(barX,barY,shW,barH,4);ctx.fill();
    ctx.strokeStyle='#fbbf24';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(barX,barY,Math.max(3,barW*hpPct),barH,4);ctx.stroke();
  }
  ctx.strokeStyle='rgba(255,255,255,0.12)';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(barX+0.5,barY+0.5,barW-1,barH-1,4);ctx.stroke();
  if(hpPct>0.02&&hpPct<0.98){
    const sx=barX+barW*hpPct-2;
    const shine=ctx.createLinearGradient(sx-10,0,sx,0);
    shine.addColorStop(0,'rgba(255,255,255,0)');shine.addColorStop(1,'rgba(255,255,255,0.35)');
    ctx.fillStyle=shine;ctx.beginPath();ctx.roundRect(barX+Math.max(0,barW*hpPct-10),barY+1,Math.min(10,barW*hpPct),barH-2,3);ctx.fill();
  }
  const skillY=barY+barH+3;
  const skills=bossSkillPills(b);
  if(skills.length){
    ctx.font='bold 5.5px Segoe UI';ctx.textAlign='center';
    const pillH=10,pillGap=2;
    const pillW=Math.min(36,Math.floor((cardW-20-(skills.length-1)*pillGap)/Math.min(skills.length,7)));
    let sx=barX;
    for(let i=0;i<Math.min(skills.length,7);i++){
      const sk=skills[i];
      const readyPct=1-(sk.cd/sk.max);
      const px=sx,py=skillY;
      ctx.fillStyle='rgba(0,0,0,0.5)';ctx.beginPath();ctx.roundRect(px,py,pillW,pillH,3);ctx.fill();
      const fillW=Math.max(0,pillW*readyPct);
      if(fillW>0){
        ctx.globalAlpha=readyPct>0.95?0.9:0.5;
        ctx.fillStyle=sk.col;ctx.beginPath();ctx.roundRect(px,py,fillW,pillH,3);ctx.fill();
        ctx.globalAlpha=1;
      }
      if(readyPct>0.95){
        const pulse=0.6+0.4*Math.sin(frame*0.15);
        ctx.strokeStyle=sk.col;ctx.globalAlpha=pulse;ctx.lineWidth=1;
        ctx.beginPath();ctx.roundRect(px,py,pillW,pillH,3);ctx.stroke();
        ctx.globalAlpha=1;
      }
      ctx.fillStyle=readyPct>0.95?'#fff':'rgba(200,200,200,0.75)';
      ctx.fillText(sk.name,px+pillW/2,py+pillH-3);
      sx+=pillW+pillGap;
    }
  }
  ctx.restore();
  ctx.textAlign='left';
}

export function drawBossCastBar(ctx,view){
  const W=view.width,frame=view.frame,tickHz=view.tickHz,b=view.boss;
  if(!b||!(b.royalCarapaceTimer>0))return;
  const cardX=20,cardW=W-40,cardY=78,cardH=50;
  const castPct=1-(b.royalCarapaceTimer/(b.royalCarapaceMax||1));
  const seconds=Math.max(0,Math.ceil(b.royalCarapaceTimer/tickHz));
  const shPct=b.hiveShield&&b.hiveShield.maxHp?Math.max(0,b.hiveShield.hp/b.hiveShield.maxHp):0;
  const danger=b.royalCarapaceTimer<=2*tickHz;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.55)';ctx.shadowBlur=14;ctx.shadowOffsetY=4;
  const bg=ctx.createLinearGradient(0,cardY,0,cardY+cardH);
  bg.addColorStop(0,danger?'rgba(84,16,10,0.98)':'rgba(58,34,12,0.98)');
  bg.addColorStop(1,'rgba(18,10,8,0.98)');
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(cardX,cardY,cardW,cardH,12);ctx.fill();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  const pulse=0.65+0.35*Math.sin(frame*0.22);
  ctx.strokeStyle=danger?'rgba(255,80,48,'+pulse+')':'rgba(255,221,68,0.55)';
  ctx.lineWidth=danger?2:1;
  ctx.beginPath();ctx.roundRect(cardX+0.5,cardY+0.5,cardW-1,cardH-1,12);ctx.stroke();
  ctx.fillStyle=danger?'#ff5533':'#ffdd44';
  ctx.beginPath();ctx.roundRect(cardX,cardY,4,cardH,3);ctx.fill();
  ctx.textAlign='left';
  ctx.fillStyle='#fff';ctx.font='900 15px Segoe UI';
  ctx.fillText('HIVE BURST CASTING',cardX+14,cardY+19);
  ctx.fillStyle='rgba(255,235,190,0.88)';ctx.font='700 9px Segoe UI';
  ctx.fillText('BREAK ROYAL CARAPACE BEFORE THE BAR FILLS',cardX+14,cardY+34);
  ctx.textAlign='right';
  ctx.fillStyle=danger?'#ffb4a0':'#ffd966';ctx.font='900 20px Segoe UI';
  ctx.fillText(seconds+'s',cardX+cardW-14,cardY+25);
  const barX=cardX+14,barW=cardW-28,castY=cardY+38,barH=7;
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.beginPath();ctx.roundRect(barX,castY,barW,barH,4);ctx.fill();
  const fg=ctx.createLinearGradient(barX,0,barX+barW,0);
  fg.addColorStop(0,'#ffdd44');fg.addColorStop(0.55,'#ff8c22');fg.addColorStop(1,'#ff3333');
  ctx.fillStyle=fg;ctx.beginPath();ctx.roundRect(barX,castY,Math.max(3,barW*castPct),barH,4);ctx.fill();
  const shieldY=cardY+47;
  ctx.fillStyle='rgba(255,221,68,0.22)';ctx.fillRect(barX,shieldY,barW,2);
  ctx.fillStyle='#ffdd44';ctx.fillRect(barX,shieldY,barW*shPct,2);
  ctx.restore();
  ctx.textAlign='left';
}

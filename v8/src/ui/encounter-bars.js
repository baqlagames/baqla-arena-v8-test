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

const BOSS_SKILL_LABELS={
  2:{aoe:'TOXIC',debuff:'DISEASE',pcloud:'CLOUD'},
  3:{aoe:'SMOKE',debuff:'MARK',vanish:'AMBUSH'},
  4:{aoe:'INFERNO',debuff:'BURN',spawn:'IMP',meteor:'METEOR'},
  5:{aoe:'QUAKE',burrow:'BURROW',debuff:'SLOW',magicBolt:'SAND'},
  6:{aoe:'SUN',debuff:'DEATH',spawn:'MUMMY',magicBolt:'BOLT'},
  10:{aoe:'SMOKE',debuff:'MARK',vanish:'AMBUSH'},
  11:{aoe:'CURSE',debuff:'HEX',spawn:'CULTIST',magicBolt:'BOLT'},
  12:{bombDrop:'BOMB',skyStrafe:'STRAFE',sandStorm:'STORM',aoe:'SAND',lunge:'DIVE',magicBolt:'BOLT'},
  13:{magicBolt:'BOLT',emberVolley:'VOLLEY',emberDecree:'DECREE'},
  14:{aoe:'SUN',debuff:'DEATH',meteor:'METEOR',magicBolt:'BOLT'}
};

const DEFAULT_SKILL_LABELS={
  aoe:'AOE',
  lunge:'LUNGE',
  debuff:'DEBUFF',
  spawn:'SPAWN',
  meteor:'METEOR',
  burrow:'BURROW',
  pcloud:'CLOUD',
  magicBolt:'BOLT',
  emberVolley:'EMBER',
  emberDecree:'DECREE',
  royalDive:'DIVE',
  bliz:'BLIZ',
  stomp:'STOMP',
  vanish:'VANISH',
  iceblock:'ICE',
  bombDrop:'BOMB',
  skyStrafe:'STRAFE',
  sandStorm:'STORM'
};

const BOSS_SKILL_HINTS={
  3:{aoe:'MOVE OUT',debuff:'MARKED TARGET',vanish:'BACKLINE AMBUSH'},
  4:{aoe:'WIDE FIRE',debuff:'BURNING TARGET',spawn:'ADDS',meteor:'DODGE RING'},
  5:{aoe:'GROUND SLAM',burrow:'MOVE AWAY',debuff:'SLOW TARGET',magicBolt:'RANGED HIT'},
  6:{aoe:'WIDE SUN',debuff:'DEATH MARK',spawn:'ADDS',magicBolt:'RANGED HIT'},
  10:{aoe:'MOVE OUT',debuff:'MARKED TARGET',vanish:'BACKLINE AMBUSH'},
  12:{bombDrop:'DODGE BOMBS',skyStrafe:'LANE STRAFE',sandStorm:'WIDE STORM',aoe:'SAND RING',lunge:'DIVE TARGET',magicBolt:'RANGED HIT'},
  13:{magicBolt:'RANGED HIT',emberVolley:'SPREAD SHOTS',emberDecree:'STACK/DODGE'},
  14:{aoe:'WIDE SUN',debuff:'DEATH MARK',meteor:'DODGE RING',magicBolt:'RANGED HIT'}
};

const DEFAULT_SKILL_HINTS={
  aoe:'DODGE AREA',
  lunge:'TANK HIT',
  debuff:'STATUS',
  spawn:'ADDS',
  meteor:'DODGE RING',
  burrow:'MOVE AWAY',
  pcloud:'MOVE OUT',
  magicBolt:'RANGED HIT',
  emberVolley:'SPREAD',
  emberDecree:'WATCH TARGETS',
  royalDive:'BACKLINE',
  bliz:'MOVE OUT',
  stomp:'STUN RING',
  vanish:'AMBUSH',
  iceblock:'HEALING',
  bombDrop:'DODGE',
  skyStrafe:'LANES',
  sandStorm:'WIDE AOE'
};

const READABILITY_BOSS_IDS=new Set([3,4,5,6,10,11,12,13,14]);

export function bossReadableSkillLabel(boss,key){
  if(!boss||!key)return DEFAULT_SKILL_LABELS[key]||key.toUpperCase();
  const byId=BOSS_SKILL_LABELS[boss.id]||{};
  return byId[key]||DEFAULT_SKILL_LABELS[key]||key.toUpperCase();
}

export function bossReadableSkillHint(boss,key){
  if(!boss||!key)return DEFAULT_SKILL_HINTS[key]||'WATCH';
  const byId=BOSS_SKILL_HINTS[boss.id]||{};
  return byId[key]||DEFAULT_SKILL_HINTS[key]||'WATCH';
}

function bossMechanicLookahead(boss,tickHz){
  return (boss&&READABILITY_BOSS_IDS.has(boss.id)?4:2.5)*tickHz;
}

export function bossReadableSkillPills(boss){
  const cd=boss.mechCD||{};
  const skills=[];
  const add=(key,cdProp,col,cdKey=key)=>{
    if(!boss[cdProp])return;
    skills.push({key,name:bossReadableSkillLabel(boss,key),hint:bossReadableSkillHint(boss,key),col,cd:cd[cdKey]||0,max:boss[cdProp]});
  };
  add('aoe','aoeCD','#ff8800');
  add('lunge','lungeCD','#ff4444');
  add('debuff','debuffCD','#aa66cc');
  add('spawn','spawnCD','#44aa44');
  add('meteor','meteorCD','#ff4400');
  add('burrow','burrowCD','#8b6f3d');
  add('pcloud','poisonCloudCD','#88aa44');
  add('magicBolt','magicBoltCD','#aa88ff');
  add('emberVolley','emberVolleyCD','#ff8c22');
  add('emberDecree','emberDecreeCD','#ffb238');
  add('royalDive','royalDiveCD','#ff5a3a');
  add('bliz','blizzardCD','#88ddff');
  add('stomp','stompCD','#7a8a9a');
  add('vanish','vanishCD','#aa66cc');
  add('iceblock','iceBlockCD','#88ddff');
  add('bombDrop','bombDropCD','#ff8844');
  add('skyStrafe','skyStrafeCD','#ffaa44');
  add('sandStorm','sandStormCD','#c8a05a');
  return skills;
}

export function bossUrgentSkillHudState(boss,tickHz=60){
  if(!boss||boss.royalCarapaceTimer>0)return null;
  const soon=bossMechanicLookahead(boss,tickHz);
  const skills=bossReadableSkillPills(boss)
    .filter(skill=>skill.cd>0&&skill.cd<=soon&&skill.max>soon)
    .sort((a,b)=>a.cd-b.cd);
  const skill=skills[0];
  if(!skill)return null;
  return {
    label:skill.name,
    hint:skill.hint,
    key:skill.key,
    color:skill.col,
    seconds:Math.max(1,Math.ceil(skill.cd/tickHz)),
    pct:Math.max(0,Math.min(1,1-(skill.cd/skill.max))),
    danger:skill.cd<=tickHz,
    soonWindow:soon
  };
}

export function bossEnrageHudState(boss,frame,tickHz=60){
  if(!boss||!Number.isFinite(boss.timeEnrageAt)||boss.timeEnrageAt<=0)return null;
  if(boss.timeEnrageAt>tickHz*60*20)return null;
  const spawnFrame=Number.isFinite(boss.spawnFrame)?boss.spawnFrame:frame;
  const elapsed=Math.max(0,frame-spawnFrame);
  const remaining=Math.max(0,boss.timeEnrageAt-elapsed);
  const pct=boss.timeEnraged?1:Math.max(0,Math.min(1,elapsed/boss.timeEnrageAt));
  return {
    pct,
    remaining,
    seconds:Math.max(0,Math.ceil(remaining/tickHz)),
    warning:!boss.timeEnraged&&remaining<=tickHz*10,
    enraged:!!boss.timeEnraged
  };
}

export function bossCarapaceHudState(boss,tickHz=60){
  if(!boss||!(boss.royalCarapaceTimer>0))return null;
  const shield=boss.hiveShield||{};
  const shieldHp=Math.max(0,Math.ceil(shield.hp||0));
  const shieldMax=Math.max(1,Math.ceil(shield.maxHp||shieldHp||1));
  return {
    castPct:1-(boss.royalCarapaceTimer/(boss.royalCarapaceMax||1)),
    seconds:Math.max(0,Math.ceil(boss.royalCarapaceTimer/tickHz)),
    shieldHp,
    shieldMax,
    shieldPct:Math.max(0,Math.min(1,shieldHp/shieldMax)),
    danger:boss.royalCarapaceTimer<=2*tickHz
  };
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
  const tier=b.timeEnraged?'ENRAGED':(b.tier==='vs'?'BOSS':b.tier==='strong'?'BOSS':'MINI-BOSS');
  if(b.timeEnraged)ctx.fillStyle='#ff5533';
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
  const skills=bossReadableSkillPills(b);
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

function drawBossEnrageCountdownBar(ctx,{width:W,frame,tickHz,boss}){
  const state=bossEnrageHudState(boss,frame,tickHz);
  if(!state)return;
  const cardX=20,cardW=W-40,cardY=78,cardH=28;
  const danger=state.warning||state.enraged;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.48)';ctx.shadowBlur=10;ctx.shadowOffsetY=3;
  const bg=ctx.createLinearGradient(0,cardY,0,cardY+cardH);
  bg.addColorStop(0,danger?'rgba(74,12,12,0.96)':'rgba(44,24,16,0.94)');
  bg.addColorStop(1,'rgba(16,8,8,0.94)');
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(cardX,cardY,cardW,cardH,9);ctx.fill();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  const pulse=0.62+0.38*Math.sin(frame*0.18);
  ctx.strokeStyle=danger?'rgba(255,85,51,'+pulse+')':'rgba(255,140,34,0.45)';
  ctx.lineWidth=danger?1.5:1;
  ctx.beginPath();ctx.roundRect(cardX+0.5,cardY+0.5,cardW-1,cardH-1,9);ctx.stroke();
  ctx.fillStyle=danger?'#ff5533':'#ff8c22';
  ctx.beginPath();ctx.roundRect(cardX,cardY,4,cardH,3);ctx.fill();
  ctx.textAlign='left';
  ctx.fillStyle='#fff';ctx.font='900 11px Segoe UI';
  ctx.fillText(state.enraged?'BOSS ENRAGED':'ENRAGE COUNTDOWN',cardX+12,cardY+16);
  ctx.textAlign='right';
  ctx.fillStyle=state.enraged?'#ffb4a0':'#ffd966';ctx.font='900 14px Segoe UI';
  ctx.fillText(state.enraged?'ACTIVE':state.seconds+'s',cardX+cardW-12,cardY+17);
  const barX=cardX+12,barW=cardW-24,barY=cardY+21,barH=4;
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.beginPath();ctx.roundRect(barX,barY,barW,barH,3);ctx.fill();
  const fg=ctx.createLinearGradient(barX,0,barX+barW,0);
  fg.addColorStop(0,'#ff8c22');fg.addColorStop(0.7,'#ff5533');fg.addColorStop(1,'#ff1111');
  ctx.fillStyle=fg;ctx.beginPath();ctx.roundRect(barX,barY,Math.max(3,barW*state.pct),barH,3);ctx.fill();
  ctx.restore();
  ctx.textAlign='left';
}

function fitCanvasText(ctx,text,maxWidth){
  const raw=String(text||'');
  if(!ctx.measureText)return raw;
  if(ctx.measureText(raw).width<=maxWidth)return raw;
  let out=raw;
  while(out.length>4&&ctx.measureText(out+'...').width>maxWidth)out=out.slice(0,-1);
  return out.length>4?out+'...':raw.slice(0,4);
}

function drawBossUrgentSkillBar(ctx,{width:W,frame,boss,tickHz}){
  const state=bossUrgentSkillHudState(boss,tickHz);
  if(!state)return false;
  const cardX=20,cardW=W-40,cardY=78,cardH=34;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.48)';ctx.shadowBlur=10;ctx.shadowOffsetY=3;
  const bg=ctx.createLinearGradient(0,cardY,0,cardY+cardH);
  bg.addColorStop(0,state.danger?'rgba(78,20,12,0.96)':'rgba(42,28,22,0.94)');
  bg.addColorStop(1,'rgba(16,10,8,0.94)');
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(cardX,cardY,cardW,cardH,9);ctx.fill();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  const pulse=0.62+0.38*Math.sin(frame*0.18);
  ctx.strokeStyle=state.danger?'rgba(255,96,56,'+pulse+')':state.color;
  ctx.lineWidth=state.danger?1.5:1;
  ctx.beginPath();ctx.roundRect(cardX+0.5,cardY+0.5,cardW-1,cardH-1,9);ctx.stroke();
  ctx.fillStyle=state.color;
  ctx.beginPath();ctx.roundRect(cardX,cardY,4,cardH,3);ctx.fill();
  ctx.textAlign='left';
  ctx.fillStyle='rgba(255,235,220,0.78)';ctx.font='800 8px Segoe UI';
  ctx.fillText('NEXT MECHANIC - '+(state.hint||'WATCH'),cardX+12,cardY+11);
  ctx.fillStyle='#fff';ctx.font='900 12px Segoe UI';
  const mechanicText=(boss.name||'Boss').toUpperCase()+': '+state.label;
  ctx.fillText(fitCanvasText(ctx,mechanicText,cardW-92),cardX+12,cardY+24);
  ctx.textAlign='right';
  ctx.fillStyle=state.danger?'#ffb4a0':'#ffd966';ctx.font='900 16px Segoe UI';
  ctx.fillText(state.seconds+'s',cardX+cardW-12,cardY+22);
  const barX=cardX+12,barW=cardW-24,barY=cardY+30,barH=3;
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.beginPath();ctx.roundRect(barX,barY,barW,barH,3);ctx.fill();
  const fg=ctx.createLinearGradient(barX,0,barX+barW,0);
  fg.addColorStop(0,state.color);fg.addColorStop(1,state.danger?'#ff3333':'#ffe066');
  ctx.fillStyle=fg;ctx.beginPath();ctx.roundRect(barX,barY,Math.max(3,barW*state.pct),barH,3);ctx.fill();
  ctx.restore();
  ctx.textAlign='left';
  return true;
}

export function drawBossCastBar(ctx,view){
  const W=view.width,frame=view.frame,tickHz=view.tickHz,b=view.boss;
  if(!b)return;
  const carapace=bossCarapaceHudState(b,tickHz);
  if(!carapace){
    const enrage=bossEnrageHudState(b,frame,tickHz);
    if(enrage&&(enrage.warning||enrage.enraged)){
      drawBossEnrageCountdownBar(ctx,{width:W,frame,tickHz,boss:b});
      return;
    }
    if(drawBossUrgentSkillBar(ctx,{width:W,frame,tickHz,boss:b}))return;
    drawBossEnrageCountdownBar(ctx,{width:W,frame,tickHz,boss:b});
    return;
  }
  const cardX=20,cardW=W-40,cardY=78,cardH=58;
  const castPct=carapace.castPct;
  const seconds=carapace.seconds;
  const danger=carapace.danger;
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
  ctx.fillText('BREAK SHIELD',cardX+14,cardY+34);
  ctx.textAlign='right';
  ctx.fillStyle=danger?'#ffb4a0':'#ffd966';ctx.font='900 20px Segoe UI';
  ctx.fillText(seconds+'s',cardX+cardW-14,cardY+25);
  ctx.fillStyle='#ffdd44';ctx.font='800 10px Segoe UI';
  ctx.fillText('SHIELD '+carapace.shieldHp+' / '+carapace.shieldMax,cardX+cardW-14,cardY+34);
  const barX=cardX+14,barW=cardW-28,castY=cardY+40,barH=7;
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.beginPath();ctx.roundRect(barX,castY,barW,barH,4);ctx.fill();
  const fg=ctx.createLinearGradient(barX,0,barX+barW,0);
  fg.addColorStop(0,'#ffdd44');fg.addColorStop(0.55,'#ff8c22');fg.addColorStop(1,'#ff3333');
  ctx.fillStyle=fg;ctx.beginPath();ctx.roundRect(barX,castY,Math.max(3,barW*castPct),barH,4);ctx.fill();
  const shieldY=cardY+51;
  ctx.fillStyle='rgba(255,221,68,0.22)';ctx.beginPath();ctx.roundRect(barX,shieldY,barW,3,2);ctx.fill();
  ctx.fillStyle='#ffdd44';ctx.beginPath();ctx.roundRect(barX,shieldY,Math.max(3,barW*carapace.shieldPct),3,2);ctx.fill();
  ctx.restore();
  ctx.textAlign='left';
}

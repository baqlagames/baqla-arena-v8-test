// Victory/defeat and combat report screen composition.

import { drawStatsColumn } from './stats-column.js';
import { fitCanvasText } from '../render/primitives.js';

export function resultButtonRects(width,height){
  const by=Math.max(500,height-128);
  return {
    ad:{x:width/2-110,y:by-48,w:220,h:38},
    primary:{x:width/2-110,y:by,w:220,h:50},
    secondary:{x:width/2-110,y:by+60,w:220,h:40}
  };
}

export function drawCombatReportPanel(ctx,view){
  const damageList=view.damageList||[];
  const healList=view.healList||[];
  const damageTakenList=view.damageTakenList||[];
  const shieldList=view.shieldList||[];
  const hasRows=damageList.length||healList.length||damageTakenList.length||shieldList.length;
  if(!hasRows)return false;

  const { title, subtitle, x, y, w, h } = view;
  const g=ctx.createLinearGradient(0,y,0,y+h);
  g.addColorStop(0,'rgba(30,32,48,0.96)');
  g.addColorStop(1,'rgba(12,14,25,0.96)');
  ctx.save();
  ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.12)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,w-1,h-1,14);ctx.stroke();
  ctx.fillStyle=view.accent||'#60a5fa';ctx.beginPath();ctx.roundRect(x,y,4,h,2);ctx.fill();
  ctx.textAlign='left';
  ctx.fillStyle='#ffffff';ctx.font='900 12px Segoe UI, Arial';ctx.fillText(title,x+14,y+19);
  ctx.fillStyle='rgba(200,206,220,0.72)';ctx.font='800 7.5px Segoe UI, Arial';
  ctx.fillText(subtitle,x+14,y+31);
  if(view.enemyRoleDamageList&&view.enemyRoleDamageList.length){
    const roles=view.enemyRoleDamageList.slice(0,3).map(r=>String(r.name||'role').toUpperCase()+': '+(view.formatValue?view.formatValue(r.amount||0):Math.round(r.amount||0))).join('   ');
    ctx.fillStyle='rgba(255,184,107,0.78)';ctx.font='800 7px Segoe UI, Arial';
    ctx.fillText(roles,x+14,y+41);
  }
  const rowH=11;
  const rows=Math.max(2,Math.min(6,Math.floor((h-72)/rowH)));
  const colGap=12,colW=(w-34-colGap)/2,hy=y+50;
  drawStatsColumn(ctx,{title:'DAMAGE',list:damageList,x:x+14,y:hy,w:colW,rowH,maxRows:rows,color:'#ff6b6b',field:'damageDone',formatValue:view.formatValue});
  drawStatsColumn(ctx,{title:'HEALING',list:healList,x:x+14+colW+colGap,y:hy,w:colW,rowH,maxRows:rows,color:'#66ffaa',field:'healingDone',formatValue:view.formatValue});
  drawReportFooter(ctx,{x:x+14,y:y+h-18,w:w-28,taken:damageTakenList[0],shield:shieldList[0],formatValue:view.formatValue});
  ctx.restore();
  return true;
}

function drawReportFooter(ctx,{x,y,w,taken,shield,formatValue}){
  const fmt=typeof formatValue==='function'?formatValue:(v=>String(Math.max(0,Math.round(v||0))));
  const chips=[];
  if(taken)chips.push({label:'TAKEN',text:(taken.name||'Unit')+' '+fmt(taken.amount||0),color:'#ffb86b'});
  if(shield)chips.push({label:'SHIELD',text:(shield.name||'Unit')+' '+fmt(shield.amount||0),color:'#8bdfff'});
  if(!chips.length)return;
  const gap=8,cw=(w-gap*(chips.length-1))/chips.length;
  for(let i=0;i<chips.length;i++){
    const c=chips[i],cx=x+i*(cw+gap);
    ctx.fillStyle='rgba(255,255,255,0.045)';
    ctx.beginPath();ctx.roundRect(cx,y-10,cw,14,5);ctx.fill();
    ctx.fillStyle=c.color;ctx.font='900 7px Segoe UI, Arial';ctx.textAlign='left';
    ctx.fillText(c.label,cx+6,y);
    fitCanvasText(ctx,c.text,cx+42,y,cw-48,7,5,'800','rgba(245,248,255,0.86)','left');
  }
}

export function drawWinResultScreen(ctx,view){
  const W=view.width,H=view.height;
  const rr=view.resultButtonRects();
  const stage=view.stage;
  const arena=view.arena||{};

  ctx.fillStyle='rgba(8,32,8,0.98)';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#ffd700';ctx.font='bold 36px Arial';ctx.textAlign='center';ctx.fillText('VICTORY',W/2,H*0.17);
  if(stage){
    ctx.fillStyle='#fff';ctx.font='bold 15px Arial';ctx.fillText(stage.name,W/2,H*0.235);
    ctx.font='11px Arial';ctx.fillStyle='#aaa';ctx.fillText('Stage '+stage.n+' cleared',W/2,H*0.27);
  }

  if(arena.resultView==='stars'){
    const starY=Math.round(H*0.34);
    const starH=Math.max(304,Math.min(420,rr.primary.y-starY-18));
    view.drawAnimatedStarResult(view.starResult,18,starY,W-36,starH);
    view.drawBigBtn(rr.primary.x,rr.primary.y,rr.primary.w,rr.primary.h,'NEXT STAGE','#3a8e3a');
  }else{
    ctx.fillStyle='rgba(220,225,238,0.74)';ctx.font='10px Arial';ctx.textAlign='center';
    ctx.fillText('Unit performance reports',W/2,H*0.305);
    const reportY=Math.round(H*0.335);
    const avail=Math.max(230,rr.primary.y-reportY-18);
    const gap=8;
    const roundH=Math.max(96,Math.min(142,Math.round((avail-gap)*0.34)));
    const stageH=Math.max(118,Math.min(210,avail-gap-roundH));
    view.drawRoundCombatReport(18,reportY,W-36,roundH);
    view.drawStageCombatReport(18,reportY+roundH+gap,W-36,stageH);
    view.drawBigBtn(rr.primary.x,rr.primary.y,rr.primary.w,rr.primary.h,'SHOW STARS','#3a8e3a');
  }
  if(arena.beansRewardBase){
    ctx.fillStyle='#ffd166';ctx.font='bold 12px Arial';ctx.textAlign='center';
    const doubled=!!arena.beansRewardDoubled;
    ctx.fillText('Beans earned: '+arena.beansRewardBase+(doubled?' + '+arena.beansRewardBase+' bonus':''),W/2,rr.ad.y-10);
    if(!doubled)view.drawBigBtn(rr.ad.x,rr.ad.y,rr.ad.w,rr.ad.h,'WATCH AD: DOUBLE BEANS','#8a6a20');
  }
  view.drawBigBtn(rr.secondary.x,rr.secondary.y,rr.secondary.w,rr.secondary.h,'BACK TO MAP','#3a3a5e');
}

export function drawLoseResultScreen(ctx,view){
  const W=view.width,H=view.height;
  const rr=view.resultButtonRects();
  const stage=view.stage;
  const labels={loseAdvice:'Try again - adjust your deck or upgrade units',...view.labels};

  ctx.fillStyle='rgba(32,8,8,0.94)';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#aa3333';ctx.font='bold 42px Arial';ctx.textAlign='center';ctx.fillText('DEFEAT',W/2,H*0.22);
  if(stage){
    ctx.fillStyle='#fff';ctx.font='bold 16px Arial';ctx.fillText(stage.name,W/2,H*0.29);
    ctx.font='12px Arial';ctx.fillStyle='#aaa';ctx.fillText(labels.loseAdvice,W/2,H*0.33);
  }
  view.drawStageCombatReport(18,Math.min(H*0.38,rr.primary.y-210),W-36,190);
  if(view.canSecondChance) view.drawBigBtn(rr.ad.x,rr.ad.y,rr.ad.w,rr.ad.h,'WATCH AD: RETRY WAVE','#6b4a1f');
  view.drawBigBtn(rr.primary.x,rr.primary.y,rr.primary.w,rr.primary.h,'RETRY','#aa6622');
  view.drawBigBtn(rr.secondary.x,rr.secondary.y,rr.secondary.w,rr.secondary.h,'BACK TO MAP','#3a3a5e');
}

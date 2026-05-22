// In-battle round report chip shown during the next build phase.

import { drawStatsColumn } from './stats-column.js';

export function drawCombatRoundChip(ctx,view){
  const combatStats=view.combatStats;
  if(!combatStats||!combatStats.lastRound||view.phase!=='build')return false;
  const r=combatStats.lastRound;
  const dmg=r.damageList||(r.topDps?[r.topDps]:[]);
  const heals=r.healList||(r.topHeal?[r.topHeal]:[]);
  let rows=Math.max(1,Math.min(10,Math.max(dmg.length,heals.length)));
  const rowH=12;
  let h=46+rows*rowH+10;
  const threatH=view.hasThreat?view.threatPanelHeight:20;
  const x=8,y=(view.hasThreat?4+threatH+5:29),w=Math.min(view.width-16,484);
  const maxH=Math.max(82,view.arenaBot-y-90);
  if(h>maxH){
    rows=Math.max(3,Math.floor((maxH-56)/rowH));
    h=46+rows*rowH+10;
  }
  if(y+h>view.arenaBot-6)return false;
  const g=ctx.createLinearGradient(0,y,0,y+h);
  g.addColorStop(0,'rgba(28,30,46,0.96)');
  g.addColorStop(1,'rgba(10,12,22,0.96)');
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.30)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;
  ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.fill();
  ctx.shadowColor='transparent';
  ctx.strokeStyle='rgba(255,255,255,0.10)';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,w-1,h-1,10);ctx.stroke();
  ctx.fillStyle='#60a5fa';ctx.beginPath();ctx.roundRect(x,y,3,h,2);ctx.fill();
  ctx.textAlign='left';
  ctx.fillStyle='#ffffff';ctx.font='900 11px Segoe UI, Arial';
  ctx.fillText('ROUND '+r.round+' REPORT',x+12,y+17);
  ctx.fillStyle='rgba(200,206,220,0.72)';ctx.font='800 7.5px Segoe UI, Arial';
  ctx.fillText('Damage and healing by unit - no tank damage taken column',x+12,y+30);
  const colGap=10,colW=(w-34-colGap)/2,cy=y+46;
  drawStatsColumn(ctx,{title:'DAMAGE',list:dmg,x:x+12,y:cy,w:colW,rowH,maxRows:rows,color:'#ff6b6b',field:'damageDone',formatValue:view.formatValue});
  drawStatsColumn(ctx,{title:'HEALING',list:heals,x:x+12+colW+colGap,y:cy,w:colW,rowH,maxRows:rows,color:'#66ffaa',field:'healingDone',formatValue:view.formatValue});
  ctx.restore();
  return true;
}

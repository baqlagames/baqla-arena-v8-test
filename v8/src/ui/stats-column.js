// Compact ranked stat columns used by battle reports.

import { fitCanvasText } from '../render/primitives.js';

function statValueText(item,field,formatValue){
  const fmt=typeof formatValue==='function'?formatValue:(v=>String(Math.max(0,Math.round(v||0))));
  if(!item)return '0';
  if(field==='damageDone')return fmt(item.amount||0)+'  '+fmt(item.dps||0)+'/s';
  if(field==='healingDone'){
    const over=item.overheal>0?'  oH '+fmt(item.overheal):'';
    return fmt(item.amount||0)+'  '+fmt(item.hps||0)+'/s'+over;
  }
  if(field==='damageTaken')return fmt(item.amount||0);
  if(field==='shieldPrevented')return fmt(item.amount||0);
  return fmt(item.amount||0);
}

export function drawStatsColumn(ctx,view){
  const list=view.list||[];
  const {title,x,y,w,rowH,maxRows,color,field}=view;
  ctx.fillStyle=color;ctx.font='900 8px Segoe UI, Arial';ctx.textAlign='left';
  ctx.fillText(title,x,y);
  ctx.fillStyle='rgba(200,206,220,0.68)';ctx.font='800 7px Segoe UI, Arial';ctx.textAlign='right';
  ctx.fillText('TOP '+maxRows,x+w,y);
  const rows=Math.min(maxRows,list.length);
  if(!rows){
    ctx.fillStyle='rgba(230,235,246,0.70)';ctx.font='800 8px Segoe UI, Arial';ctx.textAlign='left';
    ctx.fillText('--',x,y+rowH+1);
    return;
  }
  const valueW=field==='damageDone'?66:(field==='healingDone'?74:(field==='damageTaken'||field==='shieldPrevented'?50:48));
  for(let i=0;i<rows;i++){
    const e=list[i],ry=y+rowH*(i+1)+1;
    if(i%2===0){
      ctx.fillStyle='rgba(255,255,255,0.035)';
      ctx.fillRect(x-2,ry-rowH+3,w+4,rowH);
    }
    ctx.fillStyle='rgba(200,206,220,0.58)';ctx.font='900 7px Segoe UI, Arial';ctx.textAlign='left';
    ctx.fillText((i+1)+'.',x,ry);
    fitCanvasText(ctx,e.name,x+16,ry,w-valueW-20,8,6,'800','rgba(245,248,255,0.88)','left');
    fitCanvasText(ctx,statValueText(e,field,view.formatValue),x+w,ry,valueW,8,6,'900',color,'right');
  }
}

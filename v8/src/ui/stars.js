// Stage objective stars and animated victory star result drawing.

export function drawStarCriteriaRows(ctx,view){
  const rows=view.rows||[];
  const labels={
    pending:'*',
    met:'OK',
    failed:'X',
    ...view.labels
  };
  const {x,y,w}=view;
  for(let i=0;i<rows.length;i++){
    const r=rows[i],ry=y+i*44;
    const met=r.met;
    const col=met==null?'#ffd700':(met?'#44ff88':'#ff6666');
    ctx.fillStyle='rgba(255,255,255,0.055)';
    ctx.beginPath();ctx.roundRect(x,ry,w,36,9);ctx.fill();
    ctx.fillStyle=col;ctx.font='bold 16px Arial';ctx.textAlign='center';
    ctx.fillText(met==null?labels.pending:(met?labels.met:labels.failed),x+18,ry+24);
    ctx.fillStyle='#fff';ctx.font='bold 12px Arial';ctx.textAlign='left';
    ctx.fillText(r.star+' STAR - '+r.title.toUpperCase(),x+38,ry+14);
    ctx.fillStyle='rgba(220,225,238,0.76)';ctx.font='10px Arial';
    ctx.fillText(r.requirement,x+38,ry+29);
  }
  ctx.textAlign='left';
}

export function drawStageStarPanel(ctx,view){
  const {x,y,w,h}=view;
  const stageStars=view.result?view.result.stars:(view.bestStars||0);
  const g=ctx.createLinearGradient(0,y,0,y+h);
  g.addColorStop(0,'rgba(42,34,16,0.96)');
  g.addColorStop(1,'rgba(18,18,28,0.96)');
  ctx.save();
  ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.fill();
  ctx.strokeStyle='rgba(255,215,0,0.24)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,w-1,h-1,14);ctx.stroke();
  ctx.fillStyle='#ffd700';ctx.font='bold 18px Arial';ctx.textAlign='center';
  ctx.fillText(view.starText(stageStars),x+w/2,y+27);
  drawStarCriteriaRows(ctx,{rows:view.criteriaRows,x:x+10,y:y+40,w:w-20,labels:view.labels});
  ctx.restore();
}

function starRevealCount(result,frame,starRevealStart){
  const earned=Math.max(0,Math.min(3,(result&&result.stars)||0));
  if(!starRevealStart)return earned;
  const elapsed=Math.max(0,frame-starRevealStart);
  return Math.max(0,Math.min(earned,Math.floor(elapsed/42)+1));
}

export function drawStarBurst(ctx,cx,cy,age,col){
  if(age<0||age>36)return;
  const t=1-age/36;
  ctx.save();
  ctx.globalAlpha=Math.max(0,t);
  ctx.strokeStyle=col;ctx.lineWidth=2;
  for(let i=0;i<14;i++){
    const a=i*Math.PI*2/14+age*0.04;
    const r1=24+age*1.6,r2=r1+14*t;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);
    ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);
    ctx.stroke();
  }
  for(let i=0;i<18;i++){
    const a=i*Math.PI*2/18+age*0.08;
    const r=18+age*(0.9+(i%3)*0.18);
    ctx.fillStyle=i%2?'#ffffff':col;
    ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,Math.max(1.5,4*t),0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=0.22*t;
  ctx.fillStyle=col;ctx.beginPath();ctx.arc(cx,cy,58-age*0.6,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

export function drawAnimatedStarResult(ctx,view){
  const {result,x,y,w,h}=view;
  const frame=view.frame||0;
  const earned=Math.max(0,Math.min(3,(result&&result.stars)||0));
  const shown=starRevealCount(result,frame,view.starRevealStart);
  const start=view.starRevealStart||frame;
  const elapsed=Math.max(0,frame-start);
  const revealedStars=[];
  ctx.save();
  const g=ctx.createLinearGradient(0,y,0,y+h);
  g.addColorStop(0,'rgba(48,38,14,0.96)');
  g.addColorStop(1,'rgba(18,18,30,0.96)');
  ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,w,h,16);ctx.fill();
  ctx.strokeStyle='rgba(255,215,0,0.26)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,w-1,h-1,16);ctx.stroke();
  const gap=74,baseX=x+w/2-gap,starY=y+74;
  for(let i=0;i<3;i++){
    const sx=baseX+i*gap;
    const revealAt=i*42;
    const visible=i<earned&&elapsed>=revealAt;
    const age=elapsed-revealAt;
    if(visible&&view.starBurstDone&&!view.starBurstDone[i])revealedStars.push(i);
    if(visible)drawStarBurst(ctx,sx,starY,age,'#ffd700');
    const pop=visible?Math.max(0,1-age/22):0;
    const scale=visible?1+pop*0.35:1;
    ctx.save();ctx.translate(sx,starY);ctx.scale(scale,scale);
    ctx.fillStyle=visible?'#ffd700':'rgba(255,255,255,0.16)';
    ctx.shadowColor=visible?'#ffd700':'transparent';
    ctx.shadowBlur=visible?18:0;
    ctx.font='bold 54px Arial';ctx.textAlign='center';
    ctx.fillText(view.labels&&view.labels.star?view.labels.star:'*',0,18);
    ctx.restore();
  }
  ctx.shadowBlur=0;
  ctx.fillStyle='#fff';ctx.font='bold 15px Arial';ctx.textAlign='center';
  const done=shown>=earned&&elapsed>earned*42+24;
  ctx.fillText(done?'STAGE RESULT':'COUNTING STARS...',x+w/2,y+130);
  ctx.fillStyle='rgba(220,225,238,0.74)';ctx.font='10px Arial';
  ctx.fillText('Earned '+earned+' / 3 stars',x+w/2,y+148);
  drawStarCriteriaRows(ctx,{rows:view.criteriaRows,x:x+12,y:y+166,w:w-24,labels:view.labels});
  ctx.restore();
  return {revealedStars};
}

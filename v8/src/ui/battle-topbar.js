// Battle top chrome: stage/round pill and pause button.

export function drawBattleTopChrome(ctx,view){
  const W=view.width;
  const stage=view.stage||{n:'',name:''};
  if(view.phase==='build'&&!view.waveThreats){
    const topY=4,topH=20,pad=6;
    const leftX=14,leftW=W-56;
    const bg=ctx.createLinearGradient(0,topY,0,topY+topH);
    bg.addColorStop(0,'rgba(28,28,46,0.92)');
    bg.addColorStop(1,'rgba(17,17,30,0.92)');
    ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(leftX,topY,leftW,topH,6);ctx.fill();
    ctx.fillStyle='#9b59b6';ctx.beginPath();ctx.roundRect(leftX,topY,3,topH,2);ctx.fill();
    ctx.textAlign='left';
    ctx.fillStyle='#fff';ctx.font='bold 10px Segoe UI';
    const stageStr='Stage '+stage.n;
    ctx.fillText(stageStr,leftX+pad,topY+14);
    ctx.fillStyle='#9aa0b0';ctx.font='8px Segoe UI';
    const stageName=stage.name||'';
    ctx.fillText(stageName,leftX+pad+ctx.measureText(stageStr).width+6,topY+14);
    ctx.fillStyle='#ffd54a';ctx.font='bold 10px Segoe UI';ctx.textAlign='right';
    ctx.fillText('Round '+view.round+'/'+view.totalRounds,leftX+leftW-pad,topY+14);
  }

  const size=34,x=W-size-4,y=2;
  const bg=ctx.createLinearGradient(0,y,0,y+size);
  bg.addColorStop(0,'rgba(38,38,56,0.95)');
  bg.addColorStop(1,'rgba(22,22,36,0.95)');
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(x,y,size,size,7);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,size-1,size-1,7);ctx.stroke();
  const cx=x+size/2,cy=y+size/2;
  ctx.fillStyle='rgba(255,255,255,0.9)';
  for(let i=-1;i<=1;i++){
    ctx.beginPath();ctx.roundRect(cx-6,cy+i*5-1,12,2,1);ctx.fill();
  }
  ctx.textAlign='left';
  return {pause:{x,y,w:size,h:size}};
}

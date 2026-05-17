// Stage brief screen drawing. Runtime supplies stage data and action buttons.

export function drawStageBriefScreen(ctx,view){
  const W=view.width,H=view.height;
  const s=view.stage;
  const backLabel=view.backLabel||'BACK';
  const stageMetaSeparator=view.stageMetaSeparator||' - ';

  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#1a0e2a');bg.addColorStop(1,'#06060f');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  const hY=14,hH=58;
  const hg=ctx.createLinearGradient(0,hY,0,hY+hH);
  hg.addColorStop(0,'rgba(40,30,68,0.95)');hg.addColorStop(1,'rgba(20,15,40,0.95)');
  ctx.fillStyle=hg;ctx.beginPath();ctx.roundRect(10,hY,W-20,hH,16);ctx.fill();
  ctx.fillStyle='#9b59b6';ctx.beginPath();ctx.roundRect(10,hY,4,hH,2);ctx.fill();
  view.drawPillBtn(20,29,72,28,backLabel,'#3a3a5e','#fff');

  ctx.textAlign='center';
  ctx.fillStyle='#888';ctx.font='9px Arial';ctx.fillText('STAGE '+s.n,W/2,hY+18);
  ctx.fillStyle='#fff';ctx.font='bold 20px Arial';ctx.fillText(s.name.toUpperCase(),W/2,hY+42);
  ctx.fillStyle=view.bestStars?'#ffd700':'rgba(255,255,255,0.38)';ctx.font='bold 13px Arial';ctx.textAlign='right';
  ctx.fillText(view.starText(view.bestStars),W-24,hY+38);

  const cardX=18,cardY=92,cardW=W-36;
  ctx.fillStyle='rgba(18,18,34,0.92)';ctx.beginPath();ctx.roundRect(cardX,cardY,cardW,92,14);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.10)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(cardX+0.5,cardY+0.5,cardW-1,91,14);ctx.stroke();
  ctx.fillStyle='#ffd700';ctx.font='bold 10px Arial';ctx.textAlign='left';ctx.fillText('FULL STAR OBJECTIVES',cardX+14,cardY+20);
  ctx.fillStyle='rgba(225,230,240,0.78)';ctx.font='11px Arial';
  ctx.fillText('The third star is a stage challenge. If it says do not use a type, placing it at any time breaks that star.',cardX+14,cardY+40);
  ctx.fillText('The no-base-damage star fails the moment the King/base loses HP.',cardX+14,cardY+58);
  ctx.fillStyle='rgba(255,255,255,0.12)';ctx.beginPath();ctx.roundRect(cardX+14,cardY+68,cardW-28,12,6);ctx.fill();
  ctx.fillStyle='#aab0c0';ctx.font='bold 9px Arial';ctx.textAlign='center';
  ctx.fillText((s.weather||'clear').toUpperCase()+stageMetaSeparator+'ACT '+(s.act||1),W/2,cardY+78);

  view.drawStageStarPanel(18,204,W-36,184,null);
  view.drawBigBtn(W/2-120,H-118,240,50,view.startLabel||'START STAGE','#3a8e3a');
  ctx.fillStyle='rgba(255,255,255,0.52)';ctx.font='10px Arial';ctx.textAlign='center';
  ctx.fillText('Unit performance report appears after the run.',W/2,H-50);
  ctx.textAlign='left';
}

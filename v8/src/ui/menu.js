// Main menu screen drawing. Runtime passes callbacks for game-specific art.

import { fitCanvasText } from '../render/primitives.js';

export function drawMenuScreen(ctx,view){
  const W=view.width,H=view.height;
  const maxStage=view.maxStage||1;
  const frame=view.frame||0;
  const beans=view.beans||0;
  const versionLabel=view.versionLabel||'LEGION TD - v8';
  const progressSeparator=view.progressSeparator||'-';
  const campaignSubtitle=view.campaignSubtitle||('Continue Stage '+maxStage);

  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#1a0e2a');bg.addColorStop(0.5,'#0e0a1a');bg.addColorStop(1,'#06060f');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  const aur=ctx.createRadialGradient(W/2,H*0.18,0,W/2,H*0.18,W*0.7);
  aur.addColorStop(0,'rgba(155,89,182,0.30)');aur.addColorStop(1,'rgba(155,89,182,0)');
  ctx.fillStyle=aur;ctx.fillRect(0,0,W,H*0.6);

  fitCanvasText(ctx,'BAQLA ARENA',W/2,150,W-44,44,34,'bold','#ffd700','center');

  ctx.font='bold 11px Arial';
  const versionW=ctx.measureText(versionLabel).width+18;
  ctx.fillStyle='rgba(155,89,182,0.25)';
  ctx.beginPath();ctx.roundRect(W/2-versionW/2,168,versionW,22,11);ctx.fill();
  ctx.fillStyle='#cc99ff';ctx.fillText(versionLabel,W/2,184);

  view.drawVodka(W/2,H*0.45,{size:80,color:'#d2691e',accent:'#8b4513',leafColor:'#3a8e3a',facing:1,bobPhase:frame*0.05,furyTimer:0});

  const btnY=Math.max(H*0.62,H-230);
  view.drawBigBtn(W/2-130,btnY,260,56,'CAMPAIGN','#9b59b6',campaignSubtitle);
  view.drawBigBtn(W/2-130,btnY+70,260,46,'CODEX','#3a3a5e','Browse all units & abilities');

  const pgY=H-46;
  const pct=Math.round((maxStage-1)/25*100);
  ctx.fillStyle='rgba(28,28,46,0.95)';
  ctx.beginPath();ctx.roundRect(20,pgY,W-40,28,14);ctx.fill();
  ctx.fillStyle='#ffd700';ctx.font='bold 11px Arial';ctx.textAlign='left';
  ctx.fillText('PROGRESS',32,pgY+18);
  fitCanvasText(ctx,(maxStage-1)+' / 25  '+progressSeparator+'  '+pct+'%',W-32,pgY+18,128,12,9,'bold','#fff','right');
  ctx.fillStyle='#ffd166';ctx.font='bold 10px Arial';ctx.textAlign='center';
  fitCanvasText(ctx,'BEANS '+beans,W/2,pgY+18,112,10,8,'bold','#ffd166','center');

  const pbw=W-64,pbx=32,pby=pgY+24;
  ctx.fillStyle='rgba(40,40,56,0.9)';ctx.beginPath();ctx.roundRect(pbx,pby,pbw,2,1);ctx.fill();
  ctx.fillStyle='#ffd700';ctx.beginPath();ctx.roundRect(pbx,pby,pbw*((maxStage-1)/25),2,1);ctx.fill();
  ctx.textAlign='left';
}

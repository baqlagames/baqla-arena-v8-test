// Pause overlay composition and button hit rectangles.

function normalizeHexColor(color){
  if(color&&color.length===4)return '#'+color[1]+color[1]+color[2]+color[2]+color[3]+color[3];
  return color||'#666666';
}

export function drawPauseButton(ctx,x,y,w,h,label,color,subtitle){
  const col=normalizeHexColor(color);
  const r=parseInt(col.slice(1,3),16),g=parseInt(col.slice(3,5),16),b=parseInt(col.slice(5,7),16);
  const bg=ctx.createLinearGradient(0,y,0,y+h);
  bg.addColorStop(0,`rgba(${r},${g},${b},0.35)`);
  bg.addColorStop(1,`rgba(${Math.floor(r*0.6)},${Math.floor(g*0.6)},${Math.floor(b*0.6)},0.35)`);
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.fill();
  ctx.strokeStyle=`rgba(${r},${g},${b},0.5)`;ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,w-1,h-1,14);ctx.stroke();
  const shine=ctx.createLinearGradient(0,y,0,y+8);
  shine.addColorStop(0,'rgba(255,255,255,0.06)');
  shine.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=shine;ctx.beginPath();ctx.roundRect(x,y,w,8,14);ctx.fill();
  ctx.textAlign='center';
  ctx.fillStyle='#fff';ctx.font='600 15px -apple-system,Segoe UI,Arial';
  ctx.fillText(label,x+w/2,y+h/2-(subtitle?2:0)+5);
  if(subtitle){
    ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='10px -apple-system,Segoe UI,Arial';
    ctx.fillText(subtitle,x+w/2,y+h-8);
  }
}

export function drawPauseMenu(ctx,view){
  const W=view.width,H=view.height;
  const arenaMode=view.arenaViewMode||'25d';
  const arenaModeLabel=arenaMode==='flat'?'Flat':(arenaMode==='draw25d'?'Draw 2.5D':'BG 2.5D');
  const labels={
    title:'PAUSED',
    stageSeparator:' - ',
    resume:'Resume',
    resumeSub:'Continue playing',
    arenaView:'Arena: '+arenaModeLabel,
    arenaViewSub:'Tap to switch arena view',
    restart:'Restart Stage',
    restartSub:'Try this stage from round 1',
    quit:'Back to Map',
    quitSub:'Return to stage select',
    soundOn:'Sound: ON',
    soundOff:'Sound: OFF',
    soundOnSub:'Tap to mute sound effects',
    soundOffSub:'Tap to enable sound effects',
    ...view.labels
  };
  ctx.fillStyle='rgba(0,0,0,0.72)';ctx.fillRect(0,0,W,H);
  const pw=Math.min(320,W-40),ph=Math.min(410,H-44),px=(W-pw)/2,py=(H-ph)/2-12;
  const cg=ctx.createLinearGradient(0,py,0,py+ph);
  cg.addColorStop(0,'rgba(32,32,48,0.97)');cg.addColorStop(1,'rgba(18,18,28,0.97)');
  ctx.fillStyle=cg;ctx.beginPath();ctx.roundRect(px,py,pw,ph,20);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.10)';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(px+0.5,py+0.5,pw-1,ph-1,20);ctx.stroke();
  const shG=ctx.createLinearGradient(0,py,0,py+14);
  shG.addColorStop(0,'rgba(255,255,255,0.08)');shG.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=shG;ctx.beginPath();ctx.roundRect(px,py,pw,14,20);ctx.fill();
  ctx.textAlign='center';
  ctx.fillStyle='#fff';ctx.font='600 20px -apple-system,Segoe UI,Arial';
  ctx.fillText(labels.title,W/2,py+44);
  ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='11px -apple-system,Segoe UI,Arial';
  if(view.stage)ctx.fillText('Stage '+view.stage.n+labels.stageSeparator+view.stage.name,W/2,py+64);
  const bw=pw-48,bh=48,bx=px+24;
  let by=py+86;
  const rects={};
  rects.resume={x:bx,y:by,w:bw,h:bh};
  drawPauseButton(ctx,bx,by,bw,bh,labels.resume,'#3aa84e',labels.resumeSub);
  by+=bh+12;
  rects.arenaView={x:bx,y:by,w:bw,h:bh};
  drawPauseButton(
    ctx,
    bx,
    by,
    bw,
    bh,
    labels.arenaView,
    arenaMode==='flat'?'#8a6940':(arenaMode==='draw25d'?'#6649a8':'#32709a'),
    labels.arenaViewSub
  );
  by+=bh+12;
  rects.restart={x:bx,y:by,w:bw,h:bh};
  drawPauseButton(ctx,bx,by,bw,bh,labels.restart,'#c08a30',labels.restartSub);
  by+=bh+12;
  rects.quit={x:bx,y:by,w:bw,h:bh};
  drawPauseButton(ctx,bx,by,bw,bh,labels.quit,'#666',labels.quitSub);
  by+=bh+12;
  rects.sound={x:bx,y:by,w:bw,h:bh};
  drawPauseButton(
    ctx,
    bx,
    by,
    bw,
    bh,
    view.soundMuted?labels.soundOff:labels.soundOn,
    view.soundMuted?'#884444':'#448844',
    view.soundMuted?labels.soundOffSub:labels.soundOnSub
  );
  ctx.textAlign='left';
  return rects;
}

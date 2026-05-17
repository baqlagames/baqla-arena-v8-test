function rgba(hex,a){
  if(!hex||hex[0]!=='#')return 'rgba(255,255,255,'+a+')';
  if(hex.length===4)hex='#'+hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
  const r=parseInt(hex.slice(1,3),16)||0;
  const g=parseInt(hex.slice(3,5),16)||0;
  const b=parseInt(hex.slice(5,7),16)||0;
  return 'rgba('+r+','+g+','+b+','+a+')';
}

export function createArenaDecor(view){
  const {arenaL,arenaR,arenaTop,arenaBot,randomRange}=view;
  const rnd=randomRange||((a,b)=>a+Math.random()*(b-a));
  const decor={grass:[],dirt:[],pebbles:[],dust:[]};
  for(let i=0;i<28;i++){
    decor.grass.push({
      x:arenaL+10+Math.random()*(arenaR-arenaL-20),
      y:(arenaTop+arenaBot)/2+20+Math.random()*((arenaBot-arenaTop)/2-30),
      sz:2+Math.random()*3,
      col:Math.random()<0.4?'#3a5c1f':'#2a4a14'
    });
  }
  for(let i=0;i<22;i++){
    decor.dirt.push({
      x:arenaL+10+Math.random()*(arenaR-arenaL-20),
      y:arenaTop+10+Math.random()*((arenaBot-arenaTop)/2-20),
      sz:8+Math.random()*14,
      col:'#3a2a14'
    });
  }
  for(let i=0;i<20;i++){
    decor.pebbles.push({
      x:arenaL+10+Math.random()*(arenaR-arenaL-20),
      y:arenaTop+10+Math.random()*(arenaBot-arenaTop-20),
      sz:1+Math.random()*1.5,
      col:Math.random()<0.5?'#5a5a5a':'#4a4438'
    });
  }
  for(let i=0;i<12;i++){
    decor.dust.push({
      x:Math.random()*(arenaR-arenaL)+arenaL,
      y:Math.random()*(arenaBot-arenaTop)+arenaTop,
      vx:rnd(-0.2,0.2),
      vy:rnd(-0.15,0.05),
      a:0.15+Math.random()*0.2,
      sz:1+Math.random()*1.8
    });
  }
  return decor;
}

function drawBossCornerObject(ctx,view,x,y,sx,sy,idx){
  const {theme,frame}=view;
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(sx,sy);
  const pulse=0.55+0.25*Math.sin(frame*0.06+idx);
  ctx.fillStyle='rgba(0,0,0,0.32)';
  ctx.beginPath();ctx.ellipse(0,16,25,8,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=rgba(theme.color,0.55);
  ctx.strokeStyle=rgba(theme.trim,0.75);
  ctx.lineWidth=1.4;
  ctx.beginPath();ctx.roundRect(-18,-2,36,18,5);ctx.fill();ctx.stroke();
  ctx.fillStyle=rgba(theme.accent,0.35);
  ctx.beginPath();ctx.roundRect(-13,2,26,8,4);ctx.fill();
  if(theme.sig==='aerial'){
    ctx.strokeStyle=rgba(theme.trim,0.85);
    ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-18,-8);ctx.quadraticCurveTo(0,-22,18,-8);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-12,-10);ctx.lineTo(0,-24);ctx.lineTo(12,-10);ctx.stroke();
    ctx.fillStyle=rgba(theme.trim,0.20+0.16*pulse);
    ctx.beginPath();ctx.ellipse(0,-11,24,8,0,0,Math.PI*2);ctx.fill();
  }else if(theme.sig==='barrier'){
    ctx.strokeStyle=rgba(theme.trim,0.78);
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,-12,15,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.42)';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-11,-12);ctx.lineTo(11,-12);ctx.moveTo(0,-23);ctx.lineTo(0,-1);ctx.stroke();
  }else if(theme.sig==='final'){
    ctx.fillStyle=rgba(theme.trim,0.86);
    ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(9,-9);ctx.lineTo(0,-13);ctx.lineTo(-9,-9);ctx.closePath();ctx.fill();
    ctx.fillStyle=rgba(theme.color,0.28+0.16*pulse);
    ctx.beginPath();ctx.arc(0,-16,18,0,Math.PI*2);ctx.fill();
  }else{
    ctx.fillStyle=rgba(theme.trim,0.90);
    ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(14,-7);ctx.lineTo(5,-7);ctx.lineTo(5,0);ctx.lineTo(-5,0);ctx.lineTo(-5,-7);ctx.lineTo(-14,-7);ctx.closePath();ctx.fill();
    ctx.fillStyle=rgba(theme.color,0.30+0.18*pulse);
    ctx.beginPath();ctx.arc(0,-10,18,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function drawBossArenaCorners(ctx,view){
  const {state,bossTheme,frame,arenaL,arenaR,arenaTop,arenaBot}=view;
  if(state!=='battle'||!bossTheme)return;
  ctx.save();
  ctx.fillStyle=rgba(bossTheme.color,0.075);
  ctx.fillRect(arenaL,arenaTop,arenaR-arenaL,arenaBot-arenaTop);
  ctx.strokeStyle=rgba(bossTheme.trim,0.24);
  ctx.lineWidth=1;
  ctx.setLineDash([8,8]);
  ctx.lineDashOffset=-frame*0.25;
  ctx.beginPath();
  ctx.rect(arenaL+13,arenaTop+13,arenaR-arenaL-26,arenaBot-arenaTop-26);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  const padX=36,padY=38;
  const pts=[
    {x:arenaL+padX,y:arenaTop+padY,sx:1,sy:1},
    {x:arenaR-padX,y:arenaTop+padY,sx:-1,sy:1},
    {x:arenaL+padX,y:arenaBot-padY,sx:1,sy:-1},
    {x:arenaR-padX,y:arenaBot-padY,sx:-1,sy:-1}
  ];
  for(let i=0;i<pts.length;i++){
    drawBossCornerObject(ctx,{theme:bossTheme,frame},pts[i].x,pts[i].y,pts[i].sx,pts[i].sy,i);
  }
}

export function drawClassicArena(ctx,view){
  const {
    width,
    height,
    frame,
    arenaL,
    arenaR,
    arenaTop,
    arenaBot,
    deployTop,
    selectedCard,
    state,
    arenaDecor,
    bossTheme
  }=view;
  const decor=arenaDecor||{grass:[],dirt:[],pebbles:[],dust:[]};
  ctx.fillStyle='#0a0a1a';
  ctx.fillRect(0,0,width,height);

  const midY=(arenaTop+arenaBot)/2;
  const ag=ctx.createLinearGradient(0,arenaTop,0,arenaBot);
  ag.addColorStop(0,'#221a10');
  ag.addColorStop(0.45,'#3a3220');
  ag.addColorStop(0.55,'#2c3a1c');
  ag.addColorStop(1,'#3a5024');
  ctx.fillStyle=ag;
  ctx.fillRect(arenaL,arenaTop,arenaR-arenaL,arenaBot-arenaTop);

  const rg=ctx.createRadialGradient(width/2,midY,80,width/2,midY,400);
  rg.addColorStop(0,'rgba(0,0,0,0)');
  rg.addColorStop(1,'rgba(0,0,0,0.35)');
  ctx.fillStyle=rg;
  ctx.fillRect(arenaL,arenaTop,arenaR-arenaL,arenaBot-arenaTop);

  for(const d of decor.dirt){
    ctx.fillStyle='rgba(58,42,20,0.55)';
    ctx.beginPath();ctx.ellipse(d.x,d.y,d.sz,d.sz*0.4,0,0,Math.PI*2);ctx.fill();
  }
  for(const p of decor.pebbles){
    ctx.fillStyle=p.col;
    ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();
  }
  for(const g of decor.grass){
    ctx.strokeStyle=g.col;
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(g.x-g.sz,g.y);ctx.lineTo(g.x-g.sz/2,g.y-g.sz*1.4);
    ctx.moveTo(g.x,g.y);ctx.lineTo(g.x,g.y-g.sz*1.6);
    ctx.moveTo(g.x+g.sz,g.y);ctx.lineTo(g.x+g.sz/2,g.y-g.sz*1.4);
    ctx.stroke();
  }
  for(const m of decor.dust){
    m.x+=m.vx;
    m.y+=m.vy;
    if(m.x<arenaL)m.x=arenaR;
    else if(m.x>arenaR)m.x=arenaL;
    if(m.y<arenaTop)m.y=arenaBot;
    else if(m.y>arenaBot)m.y=arenaTop;
    ctx.fillStyle='rgba(255,235,180,'+(m.a*(0.5+Math.sin(frame*0.05+m.x*0.01)*0.3))+')';
    ctx.beginPath();ctx.arc(m.x,m.y,m.sz,0,Math.PI*2);ctx.fill();
  }

  drawBossArenaCorners(ctx,{state,bossTheme,frame,arenaL,arenaR,arenaTop,arenaBot});

  ctx.strokeStyle='rgba(155,89,182,0.12)';
  ctx.lineWidth=1;
  ctx.setLineDash([6,8]);
  ctx.beginPath();ctx.moveTo(arenaL+20,midY);ctx.lineTo(arenaR-20,midY);ctx.stroke();
  ctx.setLineDash([]);

  const eg=ctx.createLinearGradient(0,arenaTop,0,arenaTop+90);
  eg.addColorStop(0,'rgba(220,60,60,0.18)');
  eg.addColorStop(1,'rgba(220,60,60,0)');
  ctx.fillStyle=eg;
  ctx.fillRect(arenaL,arenaTop,arenaR-arenaL,90);

  if(selectedCard>=0){
    const pulse=0.22+Math.sin(frame*0.18)*0.1;
    const dz=ctx.createLinearGradient(0,deployTop,0,arenaBot);
    dz.addColorStop(0,'rgba(80,255,120,'+(pulse*0.5)+')');
    dz.addColorStop(1,'rgba(80,200,80,'+pulse+')');
    ctx.fillStyle=dz;
    ctx.fillRect(arenaL,deployTop,arenaR-arenaL,arenaBot-deployTop);
    ctx.strokeStyle='rgba(120,255,140,0.95)';
    ctx.lineWidth=2;
    ctx.setLineDash([10,5]);
    ctx.lineDashOffset=-frame*0.4;
    ctx.strokeRect(arenaL+1,deployTop+1,arenaR-arenaL-2,arenaBot-deployTop-2);
    ctx.setLineDash([]);
    ctx.lineDashOffset=0;
    ctx.fillStyle='rgba(220,255,200,0.95)';
    ctx.font='bold 12px Arial';
    ctx.textAlign='center';
    ctx.fillText('TAP TO DEPLOY',width/2,deployTop+20);
    ctx.textAlign='left';
  }

  const topShadow=ctx.createLinearGradient(0,arenaTop,0,arenaTop+18);
  topShadow.addColorStop(0,'rgba(0,0,0,0.55)');
  topShadow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=topShadow;
  ctx.fillRect(arenaL,arenaTop,arenaR-arenaL,18);

  const botShadow=ctx.createLinearGradient(0,arenaBot-18,0,arenaBot);
  botShadow.addColorStop(0,'rgba(0,0,0,0)');
  botShadow.addColorStop(1,'rgba(0,0,0,0.55)');
  ctx.fillStyle=botShadow;
  ctx.fillRect(arenaL,arenaBot-18,arenaR-arenaL,18);

  const leftShadow=ctx.createLinearGradient(arenaL,0,arenaL+12,0);
  leftShadow.addColorStop(0,'rgba(0,0,0,0.45)');
  leftShadow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=leftShadow;
  ctx.fillRect(arenaL,arenaTop,12,arenaBot-arenaTop);

  const rightShadow=ctx.createLinearGradient(arenaR-12,0,arenaR,0);
  rightShadow.addColorStop(0,'rgba(0,0,0,0)');
  rightShadow.addColorStop(1,'rgba(0,0,0,0.45)');
  ctx.fillStyle=rightShadow;
  ctx.fillRect(arenaR-12,arenaTop,12,arenaBot-arenaTop);

  ctx.save();
  ctx.beginPath();
  if(ctx.roundRect)ctx.roundRect(arenaL,arenaTop,arenaR-arenaL,arenaBot-arenaTop,10);
  else ctx.rect(arenaL,arenaTop,arenaR-arenaL,arenaBot-arenaTop);
  ctx.strokeStyle='rgba(180,140,80,0.55)';
  ctx.lineWidth=1.5;
  ctx.stroke();
  ctx.beginPath();
  if(ctx.roundRect)ctx.roundRect(arenaL+2,arenaTop+2,arenaR-arenaL-4,arenaBot-arenaTop-4,8);
  else ctx.rect(arenaL+2,arenaTop+2,arenaR-arenaL-4,arenaBot-arenaTop-4);
  ctx.strokeStyle='rgba(255,225,180,0.10)';
  ctx.lineWidth=1;
  ctx.stroke();
  ctx.restore();
}

export function drawPlayerKeep(ctx, view){
  const {
    x,
    y,
    size,
    dmgRatio,
    frame,
    randomRange,
    addParticle
  }=view;
  const s=size;
  const rnd=randomRange||((a,b)=>a+Math.random()*(b-a));
  const addP=addParticle||(()=>{});

  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.44)';
  ctx.beginPath();ctx.ellipse(x,y+s*0.86,s*1.28,s*0.18,0,0,Math.PI*2);ctx.fill();
  const base=ctx.createLinearGradient(0,y-s*0.42,0,y+s*0.76);
  base.addColorStop(0,'#d8ba79');base.addColorStop(0.48,'#b88c55');base.addColorStop(1,'#6d4a2b');
  ctx.fillStyle=base;ctx.strokeStyle='#3f2816';ctx.lineWidth=2.4;
  ctx.beginPath();ctx.roundRect(x-s*0.92,y-s*0.34,s*1.84,s*1.04,8);ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,239,180,0.18)';
  ctx.beginPath();ctx.roundRect(x-s*0.78,y-s*0.23,s*1.56,s*0.22,6);ctx.fill();
  ctx.strokeStyle='rgba(70,38,18,0.28)';ctx.lineWidth=1;
  for(let i=0;i<3;i++){const ly=y-s*0.16+i*s*0.23;ctx.beginPath();ctx.moveTo(x-s*0.82,ly);ctx.lineTo(x+s*0.82,ly);ctx.stroke();}
  for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x+i*s*0.36,y-s*0.18);ctx.lineTo(x+i*s*0.36,y+s*0.56);ctx.stroke();}
  for(const dx of [-0.78,0.78]){
    const tx=x+dx*s;
    const tg=ctx.createLinearGradient(0,y-s*0.70,0,y+s*0.62);
    tg.addColorStop(0,'#caa066');tg.addColorStop(1,'#6b4526');
    ctx.fillStyle=tg;ctx.strokeStyle='#3f2816';ctx.lineWidth=2.2;
    ctx.beginPath();ctx.roundRect(tx-s*0.23,y-s*0.58,s*0.46,s*1.20,8);ctx.fill();ctx.stroke();
    ctx.fillStyle='#3f8f45';ctx.beginPath();ctx.arc(tx,y-s*0.58,s*0.23,Math.PI,0);ctx.lineTo(tx+s*0.23,y-s*0.58);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#2a5c2d';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(tx,y-s*0.58,s*0.23,Math.PI,0);ctx.stroke();
  }
  ctx.fillStyle='#3f8f45';ctx.strokeStyle='#2a5c2d';ctx.lineWidth=1.6;
  ctx.beginPath();ctx.arc(x,y-s*0.40,s*0.34,Math.PI,0);ctx.lineTo(x+s*0.34,y-s*0.34);ctx.lineTo(x-s*0.34,y-s*0.34);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#8fd56d';
  ctx.beginPath();ctx.ellipse(x-s*0.08,y-s*0.53,s*0.10,s*0.05,-0.45,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.08,y-s*0.53,s*0.10,s*0.05,0.45,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#2b1308';
  ctx.beginPath();ctx.moveTo(x-s*0.22,y+s*0.62);ctx.lineTo(x-s*0.22,y+s*0.16);
  ctx.quadraticCurveTo(x,y-s*0.02,x+s*0.22,y+s*0.16);ctx.lineTo(x+s*0.22,y+s*0.62);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#7a4a24';ctx.lineWidth=1.2;
  for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x+i*s*0.055,y+s*0.60);ctx.lineTo(x+i*s*0.055,y+s*0.14);ctx.stroke();}
  for(const wx of [-0.48,0.48]){
    ctx.fillStyle='#231107';ctx.beginPath();ctx.roundRect(x+wx*s-5,y+s*0.02,10,17,4);ctx.fill();
    ctx.fillStyle='#ffd75e';ctx.globalAlpha=0.85;ctx.beginPath();ctx.roundRect(x+wx*s-3,y+s*0.05,6,11,3);ctx.fill();ctx.globalAlpha=1;
  }
  ctx.fillStyle='#e0b95f';ctx.strokeStyle='#4f3214';ctx.lineWidth=1.2;
  for(let i=-3;i<=3;i++){ctx.beginPath();ctx.roundRect(x+i*s*0.28-s*0.08,y-s*0.52,s*0.16,s*0.18,4);ctx.fill();ctx.stroke();}
  ctx.fillStyle='#2d6f37';ctx.fillRect(x-s*0.94,y-s*0.98,3,s*0.44);
  const wave=Math.sin(frame*0.12)*3;
  ctx.fillStyle='#58c767';ctx.beginPath();
  ctx.moveTo(x-s*0.94+3,y-s*0.98);ctx.lineTo(x-s*0.62+wave,y-s*0.90);ctx.lineTo(x-s*0.62+wave,y-s*0.70);ctx.lineTo(x-s*0.94+3,y-s*0.66);ctx.closePath();ctx.fill();
  if(dmgRatio>0.25){ctx.strokeStyle='#3a1a0a';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x-s*0.54,y-s*0.10);ctx.lineTo(x-s*0.42,y+s*0.08);ctx.lineTo(x-s*0.56,y+s*0.24);ctx.stroke();}
  if(dmgRatio>0.55){ctx.strokeStyle='#1a0a05';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+s*0.48,y-s*0.18);ctx.lineTo(x+s*0.32,y+s*0.08);ctx.lineTo(x+s*0.52,y+s*0.38);ctx.stroke();}
  if(dmgRatio>0.72&&frame%4===0)addP(x+rnd(-s*0.6,s*0.6),y-s*0.58,'#ff8c22',1,3);
  ctx.restore();
}

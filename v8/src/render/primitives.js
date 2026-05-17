// Shared low-level canvas helpers for v8 HUD rendering.

export function parseHudColor(col){
  if(!col||col[0]!=='#')return {r:255,g:255,b:255};
  if(col.length===4)col='#'+col[1]+col[1]+col[2]+col[2]+col[3]+col[3];
  return {
    r:parseInt(col.slice(1,3),16)||0,
    g:parseInt(col.slice(3,5),16)||0,
    b:parseInt(col.slice(5,7),16)||0
  };
}

export function shadeHudColor(col,mul){
  const c=parseHudColor(col);
  return 'rgb('+Math.max(0,Math.min(255,Math.floor(c.r*mul)))+','+Math.max(0,Math.min(255,Math.floor(c.g*mul)))+','+Math.max(0,Math.min(255,Math.floor(c.b*mul)))+')';
}

export function drawHudPanel(ctx,x,y,w,h,opt){
  opt=opt||{};
  const r=opt.radius||12;
  ctx.save();
  ctx.shadowColor=opt.shadow||'rgba(0,0,0,0.48)';
  ctx.shadowBlur=opt.shadowBlur==null?10:opt.shadowBlur;
  ctx.shadowOffsetY=opt.shadowY==null?3:opt.shadowY;
  const bg=ctx.createLinearGradient(0,y,0,y+h);
  bg.addColorStop(0,opt.top||'rgba(35,39,61,0.97)');
  bg.addColorStop(0.52,opt.mid||opt.top||'rgba(24,27,44,0.97)');
  bg.addColorStop(1,opt.bottom||'rgba(11,13,25,0.97)');
  ctx.fillStyle=bg;
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  if(opt.accent){
    ctx.fillStyle=opt.accent;
    ctx.beginPath();ctx.roundRect(x,y+5,4,Math.max(6,h-10),3);ctx.fill();
  }
  const shine=ctx.createLinearGradient(0,y,0,y+Math.min(16,h*0.5));
  shine.addColorStop(0,'rgba(255,255,255,0.18)');
  shine.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=shine;
  ctx.beginPath();ctx.roundRect(x+1,y+1,w-2,Math.max(6,Math.min(16,h*0.45)),r-1);ctx.fill();
  ctx.strokeStyle=opt.stroke||'rgba(255,255,255,0.14)';
  ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,w-1,h-1,r);ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,0.34)';
  ctx.beginPath();ctx.roundRect(x+1.5,y+1.5,w-3,h-3,Math.max(2,r-1));ctx.stroke();
  ctx.restore();
}

export function fitCanvasText(ctx,text,x,y,maxW,size,minSize,weight,color,align){
  let fs=size;
  ctx.textAlign=align||'left';
  ctx.fillStyle=color||'#fff';
  ctx.font=(weight||'800')+' '+fs+'px Segoe UI, Arial';
  while(fs>(minSize||7)&&ctx.measureText(String(text)).width>maxW){
    fs--;
    ctx.font=(weight||'800')+' '+fs+'px Segoe UI, Arial';
  }
  ctx.fillText(String(text),x,y);
}

export function drawHudMeter(ctx,x,y,w,h,pct,colA,colB){
  pct=Math.max(0,Math.min(1,pct||0));
  ctx.fillStyle='rgba(3,5,12,0.72)';
  ctx.beginPath();ctx.roundRect(x,y,w,h,h/2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.07)';
  ctx.beginPath();ctx.roundRect(x+1,y+1,w-2,Math.max(1,h*0.34),h/2);ctx.fill();
  if(pct>0){
    const fw=Math.max(3,w*pct);
    const fg=ctx.createLinearGradient(x,0,x+w,0);
    fg.addColorStop(0,colA);
    fg.addColorStop(1,colB||colA);
    ctx.fillStyle=fg;
    ctx.beginPath();ctx.roundRect(x,y,fw,h,h/2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.25)';
    ctx.beginPath();ctx.roundRect(x+1,y+1,Math.max(1,fw-2),Math.max(1,h*0.35),h/2);ctx.fill();
    if(pct<0.98){
      ctx.fillStyle='rgba(255,255,255,0.5)';
      ctx.beginPath();ctx.roundRect(x+fw-2,y+1,2,h-2,1);ctx.fill();
    }
  }
  ctx.strokeStyle='rgba(255,255,255,0.22)';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,w-1,h-1,h/2);ctx.stroke();
}

export function drawHudIcon(ctx,kind,cx,cy,r,col){
  ctx.save();
  ctx.translate(cx,cy);
  const edge=shadeHudColor(col||'#ffd54a',0.55);
  const g=ctx.createRadialGradient(-r*0.25,-r*0.35,1,0,0,r);
  g.addColorStop(0,'rgba(255,255,255,0.85)');
  g.addColorStop(0.22,col||'#ffd54a');
  g.addColorStop(1,edge);
  ctx.fillStyle='rgba(0,0,0,0.32)';
  ctx.beginPath();ctx.ellipse(1,r*0.18,r*0.9,r*0.36,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=g;
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.42)';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(0,0,r-0.5,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='rgba(20,12,6,0.72)';
  ctx.strokeStyle='rgba(20,12,6,0.72)';
  ctx.lineWidth=2;
  if(kind==='coin'){
    ctx.font='900 '+Math.round(r*0.92)+'px Segoe UI, Arial';ctx.textAlign='center';
    ctx.fillText('G',0,r*0.36);
  }else if(kind==='crown'){
    ctx.beginPath();
    ctx.moveTo(-r*0.7,r*0.28);ctx.lineTo(-r*0.55,-r*0.22);ctx.lineTo(-r*0.18,r*0.05);
    ctx.lineTo(0,-r*0.48);ctx.lineTo(r*0.18,r*0.05);ctx.lineTo(r*0.55,-r*0.22);
    ctx.lineTo(r*0.7,r*0.28);ctx.closePath();ctx.fill();
    ctx.fillRect(-r*0.58,r*0.2,r*1.16,r*0.22);
  }else if(kind==='play'){
    ctx.fillStyle='rgba(255,255,255,0.92)';
    ctx.beginPath();ctx.moveTo(-r*0.25,-r*0.48);ctx.lineTo(r*0.55,0);ctx.lineTo(-r*0.25,r*0.48);ctx.closePath();ctx.fill();
  }else if(kind==='sword'){
    ctx.strokeStyle='rgba(255,255,255,0.88)';ctx.lineWidth=2.2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-r*0.38,r*0.4);ctx.lineTo(r*0.42,-r*0.42);ctx.stroke();
    ctx.strokeStyle='rgba(30,12,12,0.75)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-r*0.44,r*0.08);ctx.lineTo(-r*0.08,r*0.44);ctx.stroke();
  }else if(kind==='leaf'){
    ctx.fillStyle='rgba(255,255,255,0.88)';
    ctx.beginPath();ctx.ellipse(-r*0.18,0,r*0.25,r*0.52,-0.65,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(r*0.2,0,r*0.25,r*0.52,0.65,0,Math.PI*2);ctx.fill();
  }else if(kind==='enemy'){
    ctx.fillStyle='rgba(35,8,8,0.82)';
    ctx.beginPath();ctx.arc(-r*0.28,-r*0.08,r*0.16,0,Math.PI*2);ctx.arc(r*0.28,-r*0.08,r*0.16,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(35,8,8,0.82)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-r*0.42,r*0.34);ctx.lineTo(-r*0.16,r*0.18);ctx.lineTo(0,r*0.34);ctx.lineTo(r*0.16,r*0.18);ctx.lineTo(r*0.42,r*0.34);ctx.stroke();
  }
  ctx.restore();
}

import { drawHudMeter } from './primitives.js';

function healthBarPalette(kind,pct){
  if(kind==='boss')return {
    shell:'rgba(42,8,14,0.92)',
    track:'rgba(52,10,18,0.96)',
    start:pct>0.25?'#ff365e':'#ff1744',
    end:pct>0.25?'#ffd166':'#ff7a8a',
    stroke:'rgba(255,209,102,0.88)',
    shine:'rgba(255,244,205,0.34)',
    glow:'rgba(255,70,86,0.34)'
  };
  if(kind==='elite')return {
    shell:'rgba(34,18,5,0.92)',
    track:'rgba(44,22,8,0.96)',
    start:pct>0.25?'#ff7a1a':'#ff3d1f',
    end:pct>0.25?'#ffe066':'#ff9a66',
    stroke:'rgba(255,168,38,0.70)',
    shine:'rgba(255,234,180,0.28)',
    glow:'rgba(255,138,40,0.22)'
  };
  if(kind==='enemy')return {
    shell:'rgba(28,7,8,0.92)',
    track:'rgba(37,9,10,0.96)',
    start:pct>0.25?'#ff3535':'#d71920',
    end:pct>0.25?'#ff9a3b':'#ff665f',
    stroke:'rgba(255,92,72,0.58)',
    shine:'rgba(255,210,180,0.24)',
    glow:'rgba(255,56,56,0.18)'
  };
  if(kind==='playerTank')return {
    shell:'rgba(3,10,22,0.90)',
    track:'rgba(8,24,32,0.96)',
    start:pct>0.25?'#22e6ff':'#d6f25a',
    end:pct>0.25?'#b9ff8a':'#69e873',
    stroke:'rgba(92,200,255,0.78)',
    shine:'rgba(255,255,255,0.30)',
    glow:'rgba(92,200,255,0.24)'
  };
  return {
    shell:'rgba(4,7,14,0.86)',
    track:'rgba(12,22,18,0.96)',
    start:pct>0.25?'#34e86f':'#d6f25a',
    end:pct>0.25?'#b9ff8a':'#69e873',
    stroke:'rgba(210,255,222,0.34)',
    shine:'rgba(255,255,255,0.24)',
    glow:'rgba(58,240,114,0.16)'
  };
}

export function drawHealthBar(ctx, view){
  let {x,y,hp,maxHp,width,kind='player'}=view;
  const h=kind==='boss'?8:kind==='playerTank'?10:7;
  if(!Number.isFinite(x)||!Number.isFinite(y))return;
  width=Math.round(Number.isFinite(width)?Math.max(18,width):44);
  hp=Number.isFinite(hp)?hp:0;
  maxHp=Number.isFinite(maxHp)&&maxHp>0?maxHp:1;
  ctx.save();
  const pct=Math.max(0,Math.min(1,hp/maxHp));
  const pal=healthBarPalette(kind,pct);
  const low=pct<=0.28;
  const bx=Math.round(x-width/2),by=Math.round(y);
  ctx.shadowColor=low?'rgba(255,56,56,0.20)':'rgba(0,0,0,0.45)';
  ctx.shadowBlur=low?6:3;ctx.shadowOffsetY=1;
  ctx.fillStyle=pal.shell;
  ctx.beginPath();ctx.roundRect(bx-3,by-2,width+6,h+4,6);ctx.fill();
  if(kind==='boss'||kind==='playerTank'){
    ctx.shadowColor=pal.glow;ctx.shadowBlur=kind==='playerTank'?4:7;ctx.shadowOffsetY=0;
    ctx.strokeStyle=pal.stroke;ctx.lineWidth=kind==='playerTank'?1.25:1.25;
    ctx.beginPath();ctx.roundRect(bx-2.5,by-1.5,width+5,h+3,5.5);ctx.stroke();
  }
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.fillStyle=pal.track;
  ctx.beginPath();ctx.roundRect(bx,by,width,h,4);ctx.fill();
  if(pct>0){
    const fg=ctx.createLinearGradient(bx,0,bx+width,0);
    fg.addColorStop(0,pal.start);
    fg.addColorStop(1,pal.end);
    ctx.fillStyle=fg;
    ctx.beginPath();ctx.roundRect(bx,by,Math.max(2,width*pct),h,4);ctx.fill();
    ctx.fillStyle=pal.shine;
    ctx.beginPath();ctx.roundRect(bx+1,by+1,Math.max(1,width*pct-2),2,2);ctx.fill();
    if(kind==='boss'){
      ctx.fillStyle='rgba(255,255,255,0.18)';
      ctx.fillRect(bx+Math.max(0,width*pct)-1,by,1,h);
    }
  }
  if(low&&kind!=='player'){
    ctx.fillStyle='rgba(255,255,255,0.30)';
    ctx.fillRect(bx+2,by+2,Math.min(8,width-4),1);
  }
  ctx.strokeStyle=pal.stroke;ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(bx+0.5,by+0.5,width-1,h-1,3.5);ctx.stroke();
  ctx.restore();
}

export function drawBigHealthBar(ctx, view){
  const {
    x,
    y,
    width,
    height,
    hp,
    maxHp,
    color,
    dark
  }=view;
  const safeMax=Number.isFinite(maxHp)&&maxHp>0?maxHp:1;
  const safeHp=Number.isFinite(hp)?hp:0;
  const pct=Math.max(0,Math.min(1,safeHp/safeMax));

  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.45)';
  ctx.shadowBlur=5;
  ctx.shadowOffsetY=1;
  ctx.fillStyle=dark||'rgba(8,10,18,0.92)';
  ctx.beginPath();
  ctx.roundRect(x-2,y-2,width+4,height+4,6);
  ctx.fill();
  ctx.shadowColor='transparent';
  ctx.shadowBlur=0;
  ctx.shadowOffsetY=0;
  const colB=pct>0.5?'#b7ff8d':pct>0.25?'#ffd36a':'#ff8c78';
  drawHudMeter(ctx,x,y,width,height,pct,color||'#4caf50',colB);
  ctx.fillStyle='#fff';
  ctx.font='900 9px Segoe UI, Arial';
  ctx.textAlign='center';
  ctx.fillText(Math.ceil(safeHp)+' / '+safeMax,x+width/2,y+height-3);
  ctx.restore();
  ctx.textAlign='left';
}

// Shared canvas button primitives for menus and overlays.

export function drawPillButton(ctx,x,y,w,h,label,bg,fg){
  const r=parseInt(bg.slice(1,3),16),g=parseInt(bg.slice(3,5),16),b=parseInt(bg.slice(5,7),16);
  const grad=ctx.createLinearGradient(0,y,0,y+h);
  grad.addColorStop(0,bg);
  grad.addColorStop(1,'rgb('+Math.floor(r*0.55)+','+Math.floor(g*0.55)+','+Math.floor(b*0.55)+')');
  ctx.fillStyle=grad;ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(12,h/2));ctx.fill();
  if(h>=20){
    const shine=ctx.createLinearGradient(0,y,0,y+Math.min(8,h*0.4));
    shine.addColorStop(0,'rgba(255,255,255,0.20)');shine.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=shine;ctx.beginPath();ctx.roundRect(x,y,w,Math.min(8,h*0.4),Math.min(12,h/2));ctx.fill();
  }
  ctx.strokeStyle='rgba(255,255,255,0.22)';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,w-1,h-1,Math.min(12,h/2));ctx.stroke();
  ctx.fillStyle=fg;ctx.font='bold 11px Arial';ctx.textAlign='center';
  ctx.fillText(label,x+w/2,y+h/2+4);
  ctx.textAlign='left';
}

export function drawSmallButton(ctx,x,y,w,h,label,color){
  ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='#fff7';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
  ctx.fillStyle='#fff';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(label,x+w/2,y+h-5);
  ctx.textAlign='left';
}

export function drawBigButton(ctx,x,y,w,h,label,bg,subtitle){
  const r=parseInt(bg.slice(1,3),16),g=parseInt(bg.slice(3,5),16),b=parseInt(bg.slice(5,7),16);
  const grad=ctx.createLinearGradient(0,y,0,y+h);
  grad.addColorStop(0,bg);
  grad.addColorStop(1,'rgb('+Math.floor(r*0.55)+','+Math.floor(g*0.55)+','+Math.floor(b*0.55)+')');
  ctx.fillStyle=grad;ctx.beginPath();ctx.roundRect(x,y,w,h,h/2);ctx.fill();
  const shine=ctx.createLinearGradient(0,y,0,y+12);
  shine.addColorStop(0,'rgba(255,255,255,0.22)');shine.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=shine;ctx.beginPath();ctx.roundRect(x,y,w,12,h/2);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.18)';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,w-1,h-1,h/2);ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='bold 16px Arial';ctx.textAlign='center';
  ctx.fillText(label,x+w/2,y+(subtitle?h/2-2:h/2+6));
  if(subtitle){
    ctx.font='10px Arial';ctx.fillStyle='rgba(255,255,255,0.7)';
    ctx.fillText(subtitle,x+w/2,y+h/2+14);
  }
  ctx.textAlign='left';
}

export function createButtonDrawers(ctx){
  return {
    drawPillBtn(x,y,w,h,label,bg,fg){drawPillButton(ctx,x,y,w,h,label,bg,fg)},
    drawSmallBtn(x,y,w,h,label,color){drawSmallButton(ctx,x,y,w,h,label,color)},
    drawBigBtn(x,y,w,h,label,bg,subtitle){drawBigButton(ctx,x,y,w,h,label,bg,subtitle)}
  };
}

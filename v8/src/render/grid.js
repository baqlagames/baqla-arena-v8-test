export function drawBuildGrid(ctx, view){
  const {
    cols,
    rows,
    gridX,
    gridY,
    cellW,
    cellH,
    cells,
    units,
    vodka,
    isCapstoneLevel
  }=view;

  ctx.save();
  const rowTints=[
    'rgba(84,126,74,0.055)',
    'rgba(84,126,74,0.050)',
    'rgba(100,122,74,0.045)',
    'rgba(136,124,68,0.050)',
    'rgba(156,135,70,0.055)'
  ];

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const x=gridX+c*cellW,y=gridY+r*cellH;
      const occupied=cells[c+','+r];
      if(!occupied){
        ctx.fillStyle=rowTints[r]||'rgba(255,255,255,0.03)';
        ctx.beginPath();
        if(ctx.roundRect)ctx.roundRect(x+7,y+6,cellW-14,cellH-12,10);
        else ctx.rect(x+7,y+6,cellW-14,cellH-12);
        ctx.fill();
      }

      ctx.strokeStyle='rgba(255,238,166,0.14)';
      ctx.lineWidth=1;
      ctx.setLineDash([]);
      ctx.beginPath();
      if(ctx.roundRect)ctx.roundRect(x+7.5,y+6.5,cellW-15,cellH-13,10);
      else ctx.rect(x+7.5,y+6.5,cellW-15,cellH-13);
      ctx.stroke();
      ctx.setLineDash([]);

      if(!occupied){
        const cx=x+cellW/2,cy=y+cellH/2;
        ctx.fillStyle='rgba(255,238,166,0.16)';
        ctx.beginPath();ctx.arc(cx,cy,2.2,0,Math.PI*2);ctx.fill();
      }
    }
  }

  for(const k in cells){
    const cell=cells[k];if(!cell)continue;
    const def=cell.unitIdx===99?vodka:units[cell.unitIdx];if(!def)continue;
    const x=gridX+cell.col*cellW,y=gridY+cell.row*cellH;
    const glow=ctx.createRadialGradient(x+cellW/2,y+cellH/2,4,x+cellW/2,y+cellH/2,Math.max(cellW,cellH)/2);
    glow.addColorStop(0,def.color+'33');
    glow.addColorStop(1,def.color+'00');
    ctx.fillStyle=glow;
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(x+3,y+3,cellW-6,cellH-6,6);
    else ctx.rect(x+3,y+3,cellW-6,cellH-6);
    ctx.fill();

    ctx.strokeStyle=def.color;ctx.lineWidth=1.5;ctx.globalAlpha=0.55;
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(x+2.5,y+2.5,cellW-5,cellH-5,6);
    else ctx.rect(x+2.5,y+2.5,cellW-5,cellH-5);
    ctx.stroke();
    ctx.globalAlpha=1;

    const level=cell.level||1;
    const levelLabel='L'+level;
    ctx.font='bold 9px Arial';
    const levelW=ctx.measureText(levelLabel).width+8;
    ctx.fillStyle='rgba(40,28,8,0.85)';
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(x+cellW-levelW-5,y+5,levelW,13,6);
    else ctx.rect(x+cellW-levelW-5,y+5,levelW,13);
    ctx.fill();
    ctx.fillStyle=isCapstoneLevel(level)?'#ffe066':'#ffd700';ctx.textAlign='center';
    ctx.fillText(levelLabel,x+cellW-levelW/2-5,y+15);
    ctx.textAlign='left';
  }

  ctx.restore();
}

export function drawProjectedBuildGrid(ctx, view){
  const {
    cols,
    rows,
    gridX,
    gridY,
    cellW,
    cellH,
    cells,
    units,
    vodka,
    pathCamQuad,
    camPoint,
    camDepthScaleAt,
    cellScreenQuad,
    cellScreenPoint,
    isCapstoneLevel
  }=view;

  ctx.save();
  const rowTints=[
    'rgba(84,126,74,0.050)',
    'rgba(84,126,74,0.045)',
    'rgba(100,122,74,0.040)',
    'rgba(136,124,68,0.045)',
    'rgba(156,135,70,0.050)'
  ];
  const pathQuad=q=>{
    ctx.beginPath();
    ctx.moveTo(q[0].x,q[0].y);
    ctx.lineTo(q[1].x,q[1].y);
    ctx.lineTo(q[2].x,q[2].y);
    ctx.lineTo(q[3].x,q[3].y);
    ctx.closePath();
  };
  const quadCenter=q=>({
    x:(q[0].x+q[1].x+q[2].x+q[3].x)/4,
    y:(q[0].y+q[1].y+q[2].y+q[3].y)/4
  });

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const x=gridX+c*cellW,y=gridY+r*cellH;
      const occupied=cells[c+','+r];
      const q=typeof cellScreenQuad==='function'?cellScreenQuad(c,r):null;
      if(!occupied){
        ctx.fillStyle=q?'rgba(255,230,154,0.055)':(rowTints[r]||'rgba(255,255,255,0.03)');
        if(q)pathQuad(q);else pathCamQuad(x+7,y+6,cellW-14,cellH-12);
        ctx.fill();
      }
      ctx.strokeStyle=q?'rgba(255,238,166,0.28)':'rgba(255,238,166,0.14)';
      ctx.lineWidth=1;
      if(q)pathQuad(q);else pathCamQuad(x+7.5,y+6.5,cellW-15,cellH-13);
      ctx.stroke();
      if(!occupied){
        const screenPoint=typeof cellScreenPoint==='function'?cellScreenPoint(c,r):null;
        const p=screenPoint||(q?quadCenter(q):camPoint(x+cellW/2,y+cellH/2));
        const sc=q?1:camDepthScaleAt(y+cellH/2);
        ctx.fillStyle='rgba(255,238,166,0.14)';
        ctx.beginPath();ctx.arc(p.x,p.y,2.2*sc,0,Math.PI*2);ctx.fill();
      }
    }
  }

  for(const k in cells){
    const cell=cells[k];if(!cell)continue;
    const def=cell.unitIdx===99?vodka:units[cell.unitIdx];if(!def)continue;
    const x=gridX+cell.col*cellW,y=gridY+cell.row*cellH;
    const q=typeof cellScreenQuad==='function'?cellScreenQuad(cell.col,cell.row):null;
    ctx.fillStyle=def.color+'22';
    if(q)pathQuad(q);else pathCamQuad(x+3,y+3,cellW-6,cellH-6);
    ctx.fill();
    ctx.strokeStyle=def.color;ctx.lineWidth=1.4;ctx.globalAlpha=0.62;
    if(q)pathQuad(q);else pathCamQuad(x+2.5,y+2.5,cellW-5,cellH-5);
    ctx.stroke();
    ctx.globalAlpha=1;
    const level=cell.level||1,levelLabel='L'+level;
    const p=q?{x:(q[1].x+q[2].x)/2-10,y:(q[1].y+q[2].y)/2-14}:camPoint(x+cellW-13,y+13);
    const sc=q?1:camDepthScaleAt(y+cellH/2);
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(sc,sc);
    ctx.font='bold 9px Arial';
    const levelW=ctx.measureText(levelLabel).width+8;
    ctx.fillStyle='rgba(40,28,8,0.88)';
    ctx.beginPath();ctx.roundRect(-levelW/2,-8,levelW,13,6);ctx.fill();
    ctx.fillStyle=isCapstoneLevel(level)?'#ffe066':'#ffd700';ctx.textAlign='center';
    ctx.fillText(levelLabel,0,2);
    ctx.restore();ctx.textAlign='left';
  }

  ctx.restore();
}

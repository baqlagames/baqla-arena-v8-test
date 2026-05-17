// In-battle unit placement picker drawing and hit rectangles.

export function unitPickerLayout(width,height,cardCount){
  const cols=2,gap=8,startX=14;
  const cw=(width-startX*2-gap)/cols,ch=78;
  const rows=Math.ceil(cardCount/cols);
  const headerY=10,footerH=24;
  const visibleH=height-headerY-footerH;
  const totalH=rows*(ch+gap);
  return {cols,gap,startX,cw,ch,rows,headerY,footerH,visibleH,totalH};
}

export function unitPickerMaxScroll(width,height,cardCount){
  const layout=unitPickerLayout(width,height,cardCount);
  return Math.max(0,layout.totalH-layout.visibleH+10);
}

export function drawUnitPlacementPicker(ctx,view){
  const W=view.width,H=view.height;
  const entries=view.entries||[];
  const labels={
    scrollDown:'v  scroll for more  v',
    scrollUp:'^',
    ...view.labels
  };
  const layout=unitPickerLayout(W,H,entries.length);
  const {cols,gap,startX,cw,ch}=layout;
  const maxScroll=unitPickerMaxScroll(W,H,entries.length);
  const scroll=Math.max(0,Math.min(view.scroll||0,maxScroll));
  const rects=[];

  ctx.fillStyle='rgba(8,6,18,0.82)';
  ctx.fillRect(0,0,W,H);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0,layout.headerY,W,layout.visibleH);
  ctx.clip();

  for(let i=0;i<entries.length;i++){
    const entry=entries[i];
    const def=entry.def||{};
    const col=i%cols,row=Math.floor(i/cols);
    const x=startX+col*(cw+gap),y=layout.headerY+row*(ch+gap)-scroll;
    const canPlace=!!entry.canPlace;
    rects.push({x,y,w:cw,h:ch,pick:entry.pick,unitIdx:entry.unitIdx,label:entry.label||def.name});

    const cardGradient=ctx.createLinearGradient(0,y,0,y+ch);
    if(canPlace){
      cardGradient.addColorStop(0,'rgba(28,28,46,0.95)');
      cardGradient.addColorStop(1,'rgba(15,15,28,0.95)');
    }else{
      cardGradient.addColorStop(0,'rgba(20,20,30,0.85)');
      cardGradient.addColorStop(1,'rgba(8,8,16,0.85)');
    }
    ctx.fillStyle=cardGradient;
    ctx.beginPath();
    ctx.roundRect(x,y,cw,ch,12);
    ctx.fill();

    if(canPlace){
      const shine=ctx.createLinearGradient(0,y,0,y+10);
      shine.addColorStop(0,'rgba(255,255,255,0.06)');
      shine.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=shine;
      ctx.beginPath();
      ctx.roundRect(x,y,cw,10,12);
      ctx.fill();
    }

    ctx.fillStyle=canPlace?def.color:'#333';
    ctx.beginPath();
    ctx.roundRect(x,y,3,ch,2);
    ctx.fill();

    const px=x+34,py=y+ch/2;
    const portraitGradient=ctx.createRadialGradient(px-6,py-6,4,px,py,28);
    portraitGradient.addColorStop(0,def.color||'#666');
    portraitGradient.addColorStop(1,def.accent||'#000');
    ctx.fillStyle=portraitGradient;
    ctx.globalAlpha=canPlace?1:0.4;
    ctx.beginPath();
    ctx.arc(px,py,26,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(255,255,255,0.2)';
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.arc(px,py,26,0,Math.PI*2);
    ctx.stroke();

    try{
      if(view.drawUnitPortrait)view.drawUnitPortrait(entry,px,py);
    }catch(_){}

    ctx.textAlign='left';
    ctx.fillStyle=canPlace?'#fff':'#666';
    ctx.font='bold 13px Arial';
    ctx.fillText(def.name||entry.label||'',x+70,y+20);

    const roleText=(def.role||def.arch||'unit').toUpperCase();
    const roleColor=def.color||'#666';
    ctx.font='9px Arial';
    const roleW=ctx.measureText(roleText).width+10;
    ctx.fillStyle=roleColor;
    ctx.globalAlpha=canPlace?0.22:0.10;
    ctx.beginPath();
    ctx.roundRect(x+70,y+26,roleW,12,6);
    ctx.fill();
    ctx.globalAlpha=1;
    ctx.fillStyle=canPlace?roleColor:'#666';
    ctx.font='bold 8px Arial';
    ctx.textAlign='center';
    ctx.fillText(roleText,x+70+roleW/2,y+34);

    const attackType=entry.attackType||'physical';
    const attackLetter={physical:'P',pierce:'R',magic:'M'}[attackType]||'P';
    const attackColor={physical:'#cccccc',pierce:'#ffd700',magic:'#aa66ff'}[attackType]||'#cccccc';
    ctx.font='bold 10px Arial';
    const attackX=x+70+roleW+5;
    ctx.fillStyle=attackColor;
    ctx.globalAlpha=canPlace?0.85:0.30;
    ctx.beginPath();
    ctx.arc(attackX+5,y+32,7,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=1;
    ctx.fillStyle='#0a0a14';
    ctx.textAlign='center';
    ctx.fillText(attackLetter,attackX+5,y+35);
    ctx.textAlign='left';

    const stats=entry.baseStats||{};
    ctx.font='10px Arial';
    ctx.fillStyle=canPlace?'#aab0c0':'#555';
    ctx.fillText('HP '+stats.hp+'  DMG '+stats.dmg,x+70,y+ch-10);

    ctx.font='bold 14px Arial';
    const costText=(entry.cost||0)+'g';
    const costW=ctx.measureText(costText).width+12;
    ctx.fillStyle=canPlace?'rgba(58,40,12,0.95)':'rgba(40,30,30,0.85)';
    ctx.beginPath();
    ctx.roundRect(x+cw-costW-8,y+8,costW,20,10);
    ctx.fill();
    ctx.fillStyle=canPlace?'#ffd700':'#aa6633';
    ctx.textAlign='center';
    ctx.fillText(costText,x+cw-costW/2-8,y+22);
    ctx.textAlign='left';
  }

  ctx.restore();

  if(maxScroll>0){
    ctx.save();
    ctx.textAlign='center';
    ctx.font='bold 12px Arial';
    if(scroll<maxScroll-1){
      ctx.fillStyle='#9b59b6';
      ctx.globalAlpha=0.6+Math.sin((view.frame||0)*0.12)*0.3;
      ctx.fillText(labels.scrollDown,W/2,H-12);
    }
    if(scroll>1){
      ctx.fillStyle='#9b59b6';
      ctx.globalAlpha=0.6+Math.sin((view.frame||0)*0.12)*0.3;
      ctx.fillText(labels.scrollUp,W/2,layout.headerY-4);
    }
    ctx.restore();
  }
  ctx.globalAlpha=1;
  ctx.textAlign='left';
  return {rects,scroll,maxScroll,layout};
}

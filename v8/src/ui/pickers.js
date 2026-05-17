// Deck and spell picker screen drawing. Selection and navigation stay in runtime.

export function drawDeckPickerScreen(ctx,view){
  const W=view.width,H=view.height;
  const units=view.units||[];
  const selected=view.selectedDeck||[];
  const labels={
    back:'BACK',
    next:'NEXT ->',
    costPrefix:'C ',
    scrollHint:'v scroll v',
    ...view.labels
  };

  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#1a1030';ctx.fillRect(0,0,W,60);
  ctx.fillStyle='#9b59b6';ctx.fillRect(0,58,W,2);
  ctx.fillStyle='#fff';ctx.font='bold 20px Arial';ctx.textAlign='center';ctx.fillText('CHOOSE YOUR DECK',W/2,28);
  ctx.font='12px Arial';ctx.fillStyle=selected.length===6?'#ffd700':'#aaa';ctx.fillText('Selected: '+selected.length+' / 6',W/2,48);
  view.drawPillBtn(14,18,80,28,labels.back,'#3a3a5e','#fff');
  if(selected.length===6)view.drawPillBtn(W-104,18,94,28,labels.next,'#3a8e3a','#fff');

  const archColors={tank:'#3a8e3a',melee:'#a6262e',ranged:'#3d8a3d',healer:'#4cd97a'};
  const cols=3,cw=148,ch=160;
  const totalW=cols*cw+(cols-1)*8;
  const startX=(W-totalW)/2;

  ctx.save();
  ctx.beginPath();ctx.rect(0,60,W,H-60);ctx.clip();
  let y=72-(view.scroll||0);
  for(let i=0;i<units.length;i++){
    const u=units[i];
    const c=i%cols,r=Math.floor(i/cols);
    const cx=startX+c*(cw+8),cy=y+r*(ch+8);
    const sel=selected.includes(i);
    if(sel){
      ctx.shadowColor='#ffd700';ctx.shadowBlur=10;
      ctx.fillStyle='#ffd700';
      ctx.beginPath();ctx.roundRect(cx-2,cy-2,cw+4,ch+4,9);ctx.fill();
      ctx.shadowBlur=0;
    }
    ctx.fillStyle=u.accent;
    ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,8);ctx.fill();
    ctx.fillStyle=archColors[u.arch]||'#666';
    ctx.beginPath();ctx.roundRect(cx,cy,cw,8,4);ctx.fill();
    ctx.fillStyle=u.color;
    ctx.fillRect(cx+4,cy+12,cw-8,ch*0.46);
    ctx.fillStyle=u.accent;ctx.beginPath();ctx.arc(cx+cw/2,cy+12+ch*0.23,28,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 14px Arial';ctx.textAlign='center';ctx.fillText(u.name,cx+cw/2,cy+12+ch*0.27);
    ctx.fillStyle='#fff';ctx.font='bold 11px Arial';ctx.fillText(u.role,cx+cw/2,cy+ch*0.66);
    const stats=view.getUnitStats(i);
    ctx.font='9px Arial';ctx.fillStyle='#ccc';
    ctx.fillText('HP '+stats.hp+'  ATK '+stats.dmg,cx+cw/2,cy+ch*0.88);
    ctx.fillStyle='#7239a0';
    ctx.beginPath();ctx.roundRect(cx+cw/2-22,cy+ch-22,44,18,5);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.fillText(labels.costPrefix+stats.cost,cx+cw/2,cy+ch-9);
    if(sel){
      ctx.fillStyle='#4caf50';ctx.beginPath();ctx.arc(cx+cw-14,cy+18,11,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx+cw-19,cy+18);ctx.lineTo(cx+cw-15,cy+22);ctx.lineTo(cx+cw-9,cy+14);ctx.stroke();
    }
  }
  ctx.restore();
  const totalH=Math.ceil(units.length/3)*(160+8);
  if(totalH>H-150){
    ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='bold 14px Arial';ctx.textAlign='center';
    ctx.fillText(labels.scrollHint,W/2,H-12);
  }
  ctx.textAlign='left';
}

export function drawSpellPickerScreen(ctx,view){
  const W=view.width,H=view.height;
  const abilities=view.abilities||[];
  const selected=view.selectedSpells||[];
  const need=view.need||1;
  const labels={
    back:'BACK',
    battle:'BATTLE ->',
    star:'*',
    scrollHint:'v scroll v',
    ...view.labels
  };

  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#1a1030';ctx.fillRect(0,0,W,60);
  ctx.fillStyle='#9b59b6';ctx.fillRect(0,58,W,2);
  ctx.fillStyle='#fff';ctx.font='bold 20px Arial';ctx.textAlign='center';ctx.fillText(need===1?'PICK 1 SPELL':'PICK 2 SPELLS',W/2,28);
  ctx.font='12px Arial';ctx.fillStyle=selected.length===need?'#ffd700':'#aaa';ctx.fillText('Selected: '+selected.length+' / '+need,W/2,48);
  view.drawPillBtn(14,18,80,28,labels.back,'#3a3a5e','#fff');
  if(selected.length===need)view.drawPillBtn(W-104,18,94,28,labels.battle,'#aa3322','#fff');

  const cw=W-32,ch=120;
  const startX=16;
  ctx.save();
  ctx.beginPath();ctx.rect(0,60,W,H-60);ctx.clip();
  let y=72-(view.scroll||0);
  for(let i=0;i<abilities.length;i++){
    const ab=abilities[i];
    const cx=startX,cy=y+i*(ch+8);
    const sel=selected.includes(i);
    if(sel){
      ctx.shadowColor='#ffd700';ctx.shadowBlur=10;
      ctx.fillStyle='#ffd700';
      ctx.beginPath();ctx.roundRect(cx-2,cy-2,cw+4,ch+4,10);ctx.fill();
      ctx.shadowBlur=0;
    }
    ctx.fillStyle='#1a1a2e';
    ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,8);ctx.fill();
    ctx.fillStyle=ab.color;
    ctx.beginPath();ctx.roundRect(cx,cy,8,ch,3);ctx.fill();
    ctx.fillStyle=ab.color;ctx.beginPath();ctx.arc(cx+50,cy+ch/2,32,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#000a';ctx.beginPath();ctx.arc(cx+50,cy+ch/2,32,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 18px Arial';ctx.textAlign='center';ctx.fillText(labels.star,cx+50,cy+ch/2+6);
    ctx.fillStyle='#fff';ctx.font='bold 18px Arial';ctx.textAlign='left';ctx.fillText(ab.name,cx+92,cy+30);
    ctx.font='13px Arial';ctx.fillStyle='#ddd';view.wrapText(ab.desc,cx+92,cy+52,cw-110,16);
    ctx.fillStyle='#7239a0';
    ctx.beginPath();ctx.roundRect(cx+92,cy+ch-30,90,22,4);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 12px Arial';ctx.textAlign='center';
    ctx.fillText((ab.cost||0)+'g',cx+92+45,cy+ch-14);
    if(sel){
      ctx.fillStyle='#4caf50';ctx.beginPath();ctx.arc(cx+cw-22,cy+22,12,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx+cw-28,cy+22);ctx.lineTo(cx+cw-23,cy+27);ctx.lineTo(cx+cw-15,cy+17);ctx.stroke();
    }
    ctx.textAlign='left';
  }
  ctx.restore();
  const totalH=abilities.length*(120+8);
  if(totalH>H-150){
    ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='bold 14px Arial';ctx.textAlign='center';
    ctx.fillText(labels.scrollHint,W/2,H-12);
  }
}

export function createCardRowRuntime(deps) {
  function cardRowLayout(){
    const {width:W,height:H,state}=deps.view();
    const HAND_SIZE=deps.handSize;

  const battleMode=state==='battle';
  const rowY=H-82;
  if(battleMode){
    const spellSlotW=52;
    const heroSlotW=86;
    const cardCount=HAND_SIZE;
    const avail=W-spellSlotW-heroSlotW-12;
    const gap=4;
    const cw=Math.floor((avail-(cardCount-1)*gap)/cardCount);
    const ch=84;
    const startX=spellSlotW;
    return{cw,ch,gap,startX,cardCount,rowY};
  }
  const cw=32,ch=72,gap=2;
  const cardCount=13;
  return{cw,ch,gap,startX:10,cardCount,rowY};

  }
  function drawCardRow(){
    const ctx=deps.ctx;
    const {width:W,height:H,state,crystal,maxCrystal,gold,cardHand,selectedCard,unitLevels}=deps.view();
    const PLAYER_UNITS=deps.playerUnits;
    const getUnitStats=deps.getUnitStats;
    const arena_isCapstoneLevel=deps.isCapstoneLevel;

  const rowH=82,rowY=H-rowH;
  // Crystal bar + gold counter Ã¢â‚¬â€ always visible above card row
  if(state==='battle'){
    // Crystal bar (left ~70%)
    const cbW=Math.floor((W-28)*0.62);
    const cb={x:14,y:rowY-22,w:cbW,h:18};
    ctx.fillStyle='#0a0a30';
    ctx.beginPath();ctx.roundRect(cb.x,cb.y,cb.w,cb.h,4);ctx.fill();
    const fillW=cb.w*Math.min(1,crystal/maxCrystal);
    const cg=ctx.createLinearGradient(cb.x,cb.y,cb.x,cb.y+cb.h);
    cg.addColorStop(0,'#c389e6');cg.addColorStop(1,'#7239a0');
    ctx.fillStyle=cg;
    ctx.beginPath();ctx.roundRect(cb.x,cb.y,fillW,cb.h,4);ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=1;
    for(let i=1;i<maxCrystal;i++){
      const sx=cb.x+(cb.w*i/maxCrystal);
      ctx.beginPath();ctx.moveTo(sx,cb.y+2);ctx.lineTo(sx,cb.y+cb.h-2);ctx.stroke();
    }
    ctx.fillStyle='rgba(255,255,255,0.18)';
    ctx.beginPath();ctx.roundRect(cb.x,cb.y,fillW,cb.h*0.45,4);ctx.fill();
    ctx.strokeStyle='#fff7';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(cb.x,cb.y,cb.w,cb.h,4);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='bold 12px Arial';ctx.textAlign='center';
    ctx.fillText(Math.floor(crystal)+'/'+maxCrystal,cb.x+cb.w/2,cb.y+13);
    // Gold counter (right ~32%)
    const gx=cb.x+cb.w+8,gy=cb.y,gw=W-28-cb.w-8,gh=18;
    const gg=ctx.createLinearGradient(gx,gy,gx,gy+gh);
    gg.addColorStop(0,'#f3d47a');gg.addColorStop(1,'#a87a14');
    ctx.fillStyle='#3a2a08';
    ctx.beginPath();ctx.roundRect(gx,gy,gw,gh,4);ctx.fill();
    ctx.fillStyle=gg;
    ctx.beginPath();ctx.roundRect(gx,gy,gw,gh,4);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.25)';
    ctx.beginPath();ctx.roundRect(gx,gy,gw,gh*0.45,4);ctx.fill();
    ctx.strokeStyle='#fff7';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(gx,gy,gw,gh,4);ctx.stroke();
    ctx.fillStyle='#000';ctx.font='bold 12px Arial';ctx.textAlign='center';
    ctx.fillText('GOLD '+Math.floor(gold),gx+gw/2,gy+13);
    ctx.textAlign='left';
  }
  // background
  const g=ctx.createLinearGradient(0,rowY,0,H);
  g.addColorStop(0,'#0a0a1a');g.addColorStop(1,'#000');
  ctx.fillStyle=g;ctx.fillRect(0,rowY,W,rowH);
  ctx.fillStyle='#9b59b6';ctx.fillRect(0,rowY,W,2);
  // archetype color stripes (top of row, just above cards)
  const archColors={tank:'#3a8e3a',melee:'#a6262e',ranged:'#3d8a3d',healer:'#4cd97a'};
  // Card layout Ã¢â‚¬â€ single source of truth via cardRowLayout()
  const battleMode=state==='battle';
  const L=cardRowLayout();
  const cw=L.cw,ch=L.ch,gap=L.gap,cardCount=L.cardCount,startX=L.startX;
  // archetype label
  ctx.font='bold 9px Arial';ctx.textAlign='left';
  ctx.fillStyle='#aaa';ctx.fillText(battleMode?'HAND':'UNITS',startX,rowY+12);
  ctx.fillText('HERO',W-78,rowY+12);
  for(let i=0;i<cardCount;i++){
    const unitIdx=battleMode?cardHand[i]:i;
    if(unitIdx==null)continue;
    const u=PLAYER_UNITS[unitIdx];
    const cx=startX+i*(cw+gap);
    const cy=rowY+18;
    const stats=getUnitStats(unitIdx);
    const canAfford=crystal>=stats.cost;
    const sel=selectedCard===unitIdx;
    // Selection glow Ã¢â‚¬â€ drawn as a stroke + shadow on the SAME card boundary,
    // so the visible card size doesn't jump (was: opaque rect 3 px larger).
    if(sel){
      ctx.save();
      ctx.shadowColor='#ffd700';ctx.shadowBlur=14;
      ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
      ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,5);ctx.stroke();
      ctx.shadowBlur=8;
      ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,5);ctx.stroke();
      ctx.restore();
    }
    // card background Ã¢â‚¬â€ archetype color stripe at top
    ctx.fillStyle=archColors[u.arch]||'#444';
    ctx.beginPath();ctx.roundRect(cx,cy,cw,6,3);ctx.fill();
    // card body
    ctx.fillStyle=canAfford?u.accent:'#1a1a1a';
    ctx.beginPath();ctx.roundRect(cx,cy+5,cw,ch-5,4);ctx.fill();
    // portrait area
    const portH=Math.floor(ch*0.55);
    ctx.fillStyle=canAfford?u.color:'#333';
    ctx.fillRect(cx+2,cy+9,cw-4,portH);
    // tiny portrait blob
    const portR=Math.min(cw,portH)*0.32;
    ctx.fillStyle=canAfford?u.accent:'#222';ctx.beginPath();ctx.arc(cx+cw/2,cy+9+portH*0.5,portR,0,Math.PI*2);ctx.fill();
    // unit name (full, with auto-sizing)
    ctx.fillStyle=canAfford?'#fff':'#777';
    const nameSize=battleMode?10:8;
    ctx.font='bold '+nameSize+'px Arial';ctx.textAlign='center';
    ctx.fillText(u.name,cx+cw/2,cy+9+portH-6);
    // role/archetype small label
    if(battleMode){
      ctx.fillStyle=canAfford?'#ddd':'#555';ctx.font='8px Arial';
      ctx.fillText(u.role.split(' ')[0],cx+cw/2,cy+9+portH+8);
    }
    // cost badge (bottom)
    ctx.fillStyle=canAfford?'#7239a0':'#1a1a1a';
    ctx.beginPath();ctx.roundRect(cx+2,cy+ch-(battleMode?22:16),cw-4,battleMode?18:12,3);ctx.fill();
    ctx.fillStyle=canAfford?'#fff':'#666';ctx.font='bold '+(battleMode?12:9)+'px Arial';ctx.textAlign='center';
    ctx.fillText(stats.cost+'g',cx+cw/2,cy+ch-(battleMode?9:7));
    // level chip top-right
    const lv=unitLevels[unitIdx]||1;
    const lvC=arena_isCapstoneLevel(lv)?'#ffd700':lv>=3?'#ff8c00':'#3a3a5e';
    const chipW=battleMode?18:12,chipH=battleMode?13:9;
    ctx.fillStyle=lvC;
    ctx.beginPath();ctx.roundRect(cx+cw-chipW-1,cy+1,chipW,chipH,3);ctx.fill();
    ctx.fillStyle=lv>=3?'#000':'#fff';ctx.font='bold '+(battleMode?10:7)+'px Arial';ctx.fillText('L'+lv,cx+cw-chipW/2-1,cy+chipH-2);
  }
  ctx.textAlign='left';
  // Upgrade panel above selected card
  drawUpgradePanel();
  drawHeroButton();

  }
  function drawUpgradePanel(){
    const ctx=deps.ctx;
    const {state,currentStage,gold,selectedCard,unitLevels}=deps.view();
    const PLAYER_UNITS=deps.playerUnits;
    const ARENA_MAX_UNIT_LEVEL=deps.maxUnitLevel;
    const upgradeBtnRect=deps.upgradeBtnRect;
    const getStageMaxLevel=deps.getStageMaxLevel;
    const upgradeCost=deps.upgradeCost;

  if(selectedCard<0)return;
  const r=upgradeBtnRect(selectedCard);
  if(!r)return;
  const u=PLAYER_UNITS[selectedCard];
  const cur=unitLevels[selectedCard];
  const cap=state==='battle'&&currentStage?getStageMaxLevel(currentStage.n):5;
  const cost=Math.max(1,Math.round(upgradeCost(cur)));
  const maxed=cur>=cap;
  const canAfford=gold>=cost;
  // Tooltip header Ã¢â‚¬â€ name + current level + next-level preview
  const headerW=r.w+60;
  ctx.fillStyle='rgba(8,8,20,0.95)';
  ctx.beginPath();ctx.roundRect(r.x-30,r.y-26,headerW,24,5);ctx.fill();
  ctx.strokeStyle=u.accent;ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(r.x-30,r.y-26,headerW,24,5);ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='bold 12px Arial';ctx.textAlign='center';
  ctx.fillText(u.name+'  L'+cur+(maxed?'':' -> L'+(cur+1)),r.x+r.w/2,r.y-10);
  ctx.textAlign='left';
  // Upgrade button
  const btnC=maxed?'#3a3a3a':canAfford?'#ffd700':'#7a6a1a';
  ctx.fillStyle=btnC;
  ctx.beginPath();ctx.roundRect(r.x,r.y,r.w,r.h,6);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(r.x,r.y,r.w,r.h,6);ctx.stroke();
  ctx.fillStyle=maxed?'#aaa':canAfford?'#000':'#ddd';
  ctx.font='bold 11px Arial';ctx.textAlign='center';
  if(maxed){
    ctx.fillText(cur>=ARENA_MAX_UNIT_LEVEL?'MAX':'CAPPED',r.x+r.w/2,r.y+15);
    ctx.font='9px Arial';ctx.fillText(cur>=ARENA_MAX_UNIT_LEVEL?'L4':'L'+cap+' MAX HERE',r.x+r.w/2,r.y+28);
  }else{
    ctx.fillText('UPGRADE',r.x+r.w/2,r.y+15);
    ctx.font='bold 13px Arial';ctx.fillText(cost+'g',r.x+r.w/2,r.y+30);
  }
  ctx.textAlign='left';
  // Arrow pointing down to the selected card
  ctx.fillStyle=btnC;
  ctx.beginPath();ctx.moveTo(r.x+r.w/2-6,r.y+r.h);ctx.lineTo(r.x+r.w/2,r.y+r.h+6);ctx.lineTo(r.x+r.w/2+6,r.y+r.h);ctx.closePath();ctx.fill();

  }
  function drawHeroButton(){
    const ctx=deps.ctx;
    const {vodkaUnit,vodkaDead,vodkaDeployCD,vodkaLevel}=deps.view();
    const HERO_BTN=deps.heroButton;
    const RESPAWN_FRAMES=deps.respawnFrames;

  const hbx=HERO_BTN.x,hby=HERO_BTN.y,hbr=HERO_BTN.r;
  // outer glow when ready
  const ready=!vodkaUnit&&!vodkaDead&&vodkaDeployCD<=0;
  if(ready){
    ctx.shadowColor='#ff8c00';ctx.shadowBlur=10;
  }
  // body
  ctx.fillStyle=vodkaDead?'#1a1a1a':vodkaUnit?'#3a2a1a':'#aa6622';
  ctx.beginPath();ctx.arc(hbx,hby,hbr,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  // green melon body
  ctx.fillStyle=vodkaDead?'#1a2e1a':'#3a8e3a';ctx.beginPath();ctx.arc(hbx,hby,hbr*0.72,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=vodkaDead?'#0f1a0f':'#1f5c1f';ctx.lineWidth=1.2;
  for(let i=-1;i<=1;i++){ctx.beginPath();ctx.ellipse(hbx+i*hbr*0.2,hby,hbr*0.1,hbr*0.7,0,0,Math.PI*2);ctx.stroke()}
  // orange bead crown ring (top arc)
  for(let i=0;i<7;i++){
    const a=-Math.PI*0.85+(i/6)*Math.PI*0.85;
    const bx=hbx+Math.cos(a)*hbr*0.7,by=hby+Math.sin(a)*hbr*0.7;
    ctx.fillStyle=vodkaDead?'#5a3a1a':'#ee8a2a';ctx.beginPath();ctx.arc(bx,by,hbr*0.13,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=vodkaDead?'#3a2a14':'#a85318';ctx.beginPath();ctx.arc(bx+1,by+1,hbr*0.07,0,Math.PI*2);ctx.fill();
  }
  // tied stem leaf bow
  ctx.fillStyle='#3a8e3a';
  ctx.beginPath();ctx.ellipse(hbx-hbr*0.1,hby-hbr*0.78,hbr*0.1,hbr*0.05,-0.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(hbx+hbr*0.1,hby-hbr*0.78,hbr*0.1,hbr*0.05,0.5,0,Math.PI*2);ctx.fill();
  // jagged mouth
  ctx.fillStyle='#000';
  const moW=hbr*0.55;
  ctx.beginPath();ctx.moveTo(hbx-moW/2,hby+hbr*0.1);
  for(let i=0;i<4;i++){const tx=hbx-moW/2+(i+0.5)*moW/4;ctx.lineTo(tx,hby+hbr*0.18+(i%2?-2:2))}
  ctx.lineTo(hbx+moW/2,hby+hbr*0.1);ctx.lineTo(hbx+moW/2,hby+hbr*0.26);
  for(let i=3;i>=0;i--){const tx=hbx-moW/2+(i+0.5)*moW/4;ctx.lineTo(tx,hby+hbr*0.32+(i%2?-2:2))}
  ctx.lineTo(hbx-moW/2,hby+hbr*0.26);ctx.closePath();ctx.fill();
  // squint eye marks
  ctx.strokeStyle=vodkaDead?'#0a1a0a':'#0f3a14';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(hbx-hbr*0.3,hby-hbr*0.08);ctx.lineTo(hbx-hbr*0.18,hby-hbr*0.04);ctx.stroke();
  ctx.beginPath();ctx.moveTo(hbx+hbr*0.18,hby-hbr*0.04);ctx.lineTo(hbx+hbr*0.3,hby-hbr*0.08);ctx.stroke();
  // outer ring
  ctx.strokeStyle=vodkaDead?'#444':ready?'#ffd700':'#fff';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(hbx,hby,hbr,0,Math.PI*2);ctx.stroke();
  // CD ring
  if(vodkaDeployCD>0){
    ctx.strokeStyle='#fff';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(hbx,hby,hbr+3,-Math.PI/2,-Math.PI/2+(1-vodkaDeployCD/RESPAWN_FRAMES)*Math.PI*2);ctx.stroke();
  }
  // KO overlay
  if(vodkaDead){
    ctx.fillStyle='rgba(220,40,40,0.45)';ctx.beginPath();ctx.arc(hbx,hby,hbr,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.fillText('KO',hbx,hby+5);
  }
  // labels below button
  ctx.fillStyle='#fff';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText('VODKA',hbx,hby+hbr+13);
  ctx.font='9px Arial';ctx.fillStyle=vodkaLevel>=5?'#ffd700':vodkaLevel>=3?'#ff8c00':'#aaa';ctx.fillText('L'+vodkaLevel+'  HERO',hbx,hby+hbr+24);
  ctx.textAlign='left';

  }
  return {cardRowLayout,drawCardRow,drawUpgradePanel,drawHeroButton};
}

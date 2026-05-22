import { drawUnitShieldVfx } from './shield-vfx.js?v=20260522-winterglass-deep-enrage';

function unitRoleColor(unit){
  if(!unit)return '#d8f4ff';
  if(unit.arch==='tank'||unit.taunt)return '#5cc8ff';
  if(unit.arch==='melee'||unit.prefersMelee)return '#ffd166';
  if(unit.arch==='healer')return '#66ffaa';
  if(unit.arch==='caster'||unit.arch==='magic')return '#aa88ff';
  return '#ffcc66';
}

function playerUnitsUnderBoss(boss,units){
  if(!boss||boss.hp<=0||!Array.isArray(units))return [];
  const radius=Math.max(44,(boss.size||42)*1.05);
  return units.filter(unit=>{
    if(!unit||unit.hp<=0||!unit.isPlayer||unit.isMinion||unit.isGhost||unit.isMirror)return false;
    return Math.hypot((unit.x||0)-(boss.x||0),(unit.y||0)-(boss.y||0))<=radius;
  });
}

function drawUnderBossUnitBackplates(ctx,boss,units,frame){
  const under=playerUnitsUnderBoss(boss,units);
  if(!under.length)return;
  for(const unit of under){
    const s=unit.size||20,col=unitRoleColor(unit);
    ctx.save();
    ctx.fillStyle='rgba(2,6,14,0.56)';
    ctx.beginPath();ctx.ellipse(unit.x,unit.y+s*0.35,s*1.10,s*0.46,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=col;ctx.globalAlpha=0.38+0.12*Math.sin((frame||0)*0.16+(unit.id||0));
    ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(unit.x,unit.y+s*0.35,s*1.20,s*0.52,0,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
}

function drawUnderBossUnitOutlines(ctx,boss,units,frame){
  const under=playerUnitsUnderBoss(boss,units);
  if(!under.length)return;
  for(const unit of under){
    const s=unit.size||20,col=unitRoleColor(unit);
    ctx.save();
    ctx.globalCompositeOperation='source-over';
    ctx.strokeStyle='rgba(3,7,16,0.96)';
    ctx.lineWidth=5;
    ctx.beginPath();ctx.ellipse(unit.x,unit.y-s*0.05,s*0.72,s*1.08,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=col;
    ctx.lineWidth=2.6;
    ctx.globalAlpha=0.92;
    ctx.beginPath();ctx.ellipse(unit.x,unit.y-s*0.05,s*0.72,s*1.08,0,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=0.52+0.18*Math.sin((frame||0)*0.12+(unit.id||0));
    ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(unit.x,unit.y-s*1.45);ctx.lineTo(unit.x,unit.y-s*0.86);ctx.stroke();
    ctx.restore();
  }
}

function drawAstralWardenForeground(ctx,boss,frame){
  if(!boss||boss.hp<=0||boss.id!==10)return;
  const x=boss.x||0,y=boss.y||0,s=boss.size||58;
  const pulse=0.72+0.28*Math.sin((frame||0)*0.09);
  const ward=!!(boss.hiveShield&&boss.hiveShield.hp>0&&boss.hiveShield.astralWard);
  ctx.save();
  ctx.translate(x,y);
  ctx.globalCompositeOperation='screen';
  ctx.globalAlpha=0.36+0.16*pulse;
  ctx.fillStyle=ward?'#ffd166':'#8bdfff';
  ctx.beginPath();ctx.ellipse(0,-s*1.26,s*0.78,s*0.22,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.72;
  ctx.strokeStyle=ward?'#ffd166':'#d8f4ff';
  ctx.lineWidth=ward?4:3;
  ctx.beginPath();ctx.ellipse(0,-s*1.26,s*0.88,s*0.26,0,0,Math.PI*2);ctx.stroke();
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(-s*0.46,-s*1.02);
  ctx.lineTo(-s*0.22,-s*1.48);
  ctx.lineTo(0,-s*1.12);
  ctx.lineTo(s*0.22,-s*1.48);
  ctx.lineTo(s*0.46,-s*1.02);
  ctx.stroke();
  ctx.globalAlpha=0.50;
  ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(0,-s*1.55);ctx.lineTo(0,-s*0.62);ctx.stroke();
  const motes=ward?5:3;
  for(let i=0;i<motes;i++){
    const a=(frame||0)*0.052+i*Math.PI*2/motes;
    const rx=Math.cos(a)*s*0.98,ry=-s*0.74+Math.sin(a)*s*0.34;
    ctx.globalAlpha=0.55+0.25*Math.sin((frame||0)*0.12+i);
    ctx.fillStyle=i%2?'#ffd166':'#8bdfff';
    ctx.beginPath();ctx.arc(rx,ry,ward?s*0.07:s*0.055,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

export function createBattleSceneRuntime(deps) {
  function render(){
    const view=deps.view();
    let {state,codexOpen,arena,bossRef,screenShake,arenaTop:ARENA_TOP,arenaTopBase:ARENA_TOP_BASE,arenaBot:ARENA_BOT,width:W,height:H,playerCastle,frame,enemies,units,tickHz:GAME_TICK_HZ}=view;
    const ctx=deps.ctx;
    const rnd=deps.randomRange;
    const addP=deps.emitParticle;
    const dist=deps.dist;
    const {
      applyRenderQuality:arena_applyRenderQuality,
      recomputeGrid,
      drawMenu,drawFlash,drawCodex,drawStageSelect,drawStageBrief,drawDeckPick,drawSpellPick,drawPerkPick,
      drawArena,drawWeather,drawWeatherForeground,drawGroundFx,arena_drawGrid,drawCastle,drawDummy,arena_specHalo,arena_isCapstoneLevel,
      drawUnit,drawUnitHud,drawUnitOverlays,drawBeamFx,drawProjectiles,drawBombs,drawParticles,drawDmgNums,arena_drawHud,
      drawSigBanner,drawWinScreen,drawLoseScreen
    }=deps;

  arena_applyRenderQuality();
  if(state==='menu'){drawMenu();drawFlash();if(codexOpen)drawCodex();return}
  if(state==='stageSelect'){drawStageSelect();drawFlash();return}
  if(state==='stageBrief'){drawStageBrief();drawFlash();return}
  if(state==='deckPick'){drawDeckPick();drawFlash();return}
  if(state==='spellPick'){drawSpellPick();drawFlash();return}
  if(state==='perkPick'){drawPerkPick();drawFlash();return}
  // Dynamic ARENA_TOP: push arena down when boss bar needs space
  const _hasPurify=arena&&arena.activeBarrier;
  const _hasLieus=arena&&arena.lieutenants&&arena.lieutenants.some(l=>l.hp>0);
  const _hasBoss=bossRef&&bossRef.hp>0&&!bossRef.untargetable;
  const _needEncounterBar=state==='battle'&&(_hasPurify||_hasLieus||_hasBoss);
  const _newTop=_needEncounterBar?ARENA_TOP_BASE+46:ARENA_TOP_BASE;
  if(ARENA_TOP!==_newTop){deps.setArenaTop(_newTop);ARENA_TOP=_newTop;recomputeGrid()}
  ctx.save();
  if(screenShake>0){ctx.translate(rnd(-screenShake,screenShake),rnd(-screenShake,screenShake))}
  drawArena();
  drawWeather();
  drawGroundFx();
  // arena Magical Rift atmosphere: while a rift is telegraphing, dim the entire
  // arena to a slight purple tint. Drawn AFTER weather/groundFx so it
  // doesn't get overwritten and before units/grid so units stay legible.
  if(state==='battle'&&arena&&arena.rift){
    const r=arena.rift;
    const t=1-(r.telegraphTimer/r.totalTime); // 0 Ã¢â€ â€™ 1 across telegraph window
    ctx.save();
    ctx.fillStyle='rgba(60,20,90,'+(0.12+0.18*t).toFixed(3)+')';
    ctx.fillRect(0,ARENA_TOP,W,ARENA_BOT-ARENA_TOP);
    ctx.restore();
  }
  // arena: render the placement grid below the units.
  if(state==='battle')arena_drawGrid();
  // arena Magical Rift telegraph circle Ã¢â‚¬â€ drawn after grid, before units, so
  // it sits on the playfield like a portal opening.
  if(state==='battle'&&arena&&arena.rift){
    const r=arena.rift;
    const t=1-(r.telegraphTimer/r.totalTime); // 0 Ã¢â€ â€™ 1 progress
    ctx.save();
    // Outer rim Ã¢â‚¬â€ slow counter-clockwise rotation, deep purple Ã¢â€ â€™ bright gold.
    const rimCol=t<0.5?'#aa66ff':'#ffd700';
    const rimR=46+12*t;
    const rimRot=-frame*0.018;
    ctx.translate(r.x,r.y);
    ctx.rotate(rimRot);
    ctx.strokeStyle=rimCol;ctx.lineWidth=3;
    ctx.globalAlpha=0.55+0.30*t+Math.sin(frame*0.18)*0.10;
    ctx.setLineDash([10,6]);
    ctx.beginPath();ctx.arc(0,0,rimR,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);
    ctx.rotate(-rimRot);
    // Middle ring Ã¢â‚¬â€ fast clockwise rotation, complementary color.
    const midRot=frame*0.035;
    ctx.rotate(midRot);
    ctx.strokeStyle=t<0.5?'#ffd700':'#aa66ff';ctx.lineWidth=2;
    ctx.globalAlpha=0.70+0.20*t;
    ctx.setLineDash([6,4]);
    ctx.beginPath();ctx.arc(0,0,rimR-12,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);
    ctx.rotate(-midRot);
    // Inner glyphs Ã¢â‚¬â€ 6 short radial bars pulsing.
    const glyphCount=6;
    for(let i=0;i<glyphCount;i++){
      const a=i*Math.PI*2/glyphCount+frame*0.012;
      const x1=Math.cos(a)*(rimR-22),y1=Math.sin(a)*(rimR-22);
      const x2=Math.cos(a)*(rimR-32),y2=Math.sin(a)*(rimR-32);
      ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
      ctx.globalAlpha=0.45+0.40*t+Math.sin(frame*0.20+i)*0.15;
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    }
    // Filled disc Ã¢â‚¬â€ translucent purple, brightens as the spawn approaches.
    ctx.fillStyle='#5a2a7a';ctx.globalAlpha=0.10+0.25*t;
    ctx.beginPath();ctx.arc(0,0,rimR-8,0,Math.PI*2);ctx.fill();
    ctx.restore();
    // Floating countdown above the rift (last 4s only).
    if(r.telegraphTimer<=4*GAME_TICK_HZ){
      const sec=Math.ceil(r.telegraphTimer/GAME_TICK_HZ);
      ctx.save();
      ctx.fillStyle='#ffd700';ctx.font='bold 18px Arial';ctx.textAlign='center';
      ctx.fillText(sec+'s',r.x,r.y-rimR-10);
      ctx.textAlign='left';
      ctx.restore();
    }
    // Wisps drifting up from the rift.
    if(frame%3===0){
      addP(r.x+rnd(-rimR*0.7,rimR*0.7),r.y+rnd(-rimR*0.3,rimR*0.3),'#aa66ff',1,2);
    }
  }
  // Castles render on/at arena edges (king is the only castle in arena)
  if(state==='battle')drawCastle(playerCastle);
  for(const e of enemies)drawDummy(e);
  drawUnderBossUnitBackplates(ctx,bossRef,units,frame);
  // arena: render level ring + aura indicators under each squad unit.
  if(state==='battle'){
    const ringColor={2:'#ffd54a',3:'#3aa0ff',4:'#a855f7',5:'#ffb000'};
    for(const u of units){
      if(!u.isPlayer||u.isMinion||u.hp<=0)continue;
      // Phase 3 Ã¢â‚¬â€ per-spec halo tint (faint colored ground ring under WoW-class
      // units so each spec reads visually distinct at a glance). Drawn before
      // the level ring + aura rings so they layer on top.
      const _specHalo=arena_specHalo(u);
      if(_specHalo){
        ctx.save();
        ctx.fillStyle=_specHalo;
        ctx.globalAlpha=0.10+Math.sin(frame*0.06)*0.04;
        ctx.beginPath();ctx.ellipse(u.x,u.y+u.size*0.5,u.size*0.95,u.size*0.32,0,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=0.20;
        ctx.strokeStyle=_specHalo;ctx.lineWidth=1;
        ctx.beginPath();ctx.ellipse(u.x,u.y+u.size*0.5,u.size*0.95,u.size*0.32,0,0,Math.PI*2);ctx.stroke();
        ctx.restore();
      }
      const auraCol=u.healAura?'#3aff66':u.slowAura?'#66ccff':u.champion?'#ffd700':null;
      const auraR=u.healAura?u.healAura.radius:u.slowAura?u.slowAura.radius:u.champion?180:0;
      if(auraCol&&auraR){
        // Slow aura was already extra-low. All other auras now share the same
        // light fill (was 0.18+0.07 Ã¢â€ â€™ 0.07+0.03) and softer stroke (0.4 Ã¢â€ â€™ 0.25).
        const isSlow=!!u.slowAura;
        const pulseFill=isSlow?(0.04+Math.sin(frame*0.08)*0.02):(0.07+Math.sin(frame*0.08)*0.03);
        const pulseStroke=isSlow?0.14:0.25;
        ctx.save();
        ctx.fillStyle=auraCol;ctx.globalAlpha=pulseFill;
        ctx.beginPath();ctx.arc(u.x,u.y,auraR,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=auraCol;ctx.globalAlpha=pulseStroke;ctx.lineWidth=1;ctx.setLineDash([6,5]);
        ctx.beginPath();ctx.arc(u.x,u.y,auraR,0,Math.PI*2);ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      if(u.champion&&frame%18===0){
        const ar=180;
        const col='#ffd700';
        for(const a of units){
          if(a===u||!a.isPlayer||a.hp<=0||a.isMinion)continue;
          if(dist(u,a)<=ar){addP(a.x,a.y-a.size*0.5,col,1,3)}
        }
      }
      // Heal Aura sparkles on healing targets
      if(u.healAura&&frame%24===0){
        for(const a of units){
          if(a===u||!a.isPlayer||a.hp<=0||a.isMinion)continue;
          if(a.hp<a.maxHp&&dist(u,a)<=u.healAura.radius){addP(a.x,a.y-a.size*0.5,'#3aff66',1,2)}
        }
      }
      // Level ring (yellow L2, blue L3, purple L4, gold L5).
      const lv=u.cellLevel||1;if(lv<2)continue;
      const col=ringColor[lv]||'#fff';
      const r=u.size+8;
      const pulse2=lv===5?(0.55+Math.sin(frame*0.12)*0.18):0.55;
      ctx.save();
      ctx.fillStyle=col+'33';
      ctx.beginPath();ctx.ellipse(u.x,u.y+u.size*0.85,r*1.05,r*0.36,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=col;ctx.globalAlpha=pulse2;ctx.lineWidth=arena_isCapstoneLevel(lv)?3:2;
      ctx.beginPath();ctx.ellipse(u.x,u.y+u.size*0.85,r,r*0.32,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    // Cursed enemies Ã¢â‚¬â€ small purple cross over them
    for(const e of enemies){
      if(e.hp<=0||!e.cursedTimer||e.cursedTimer<=0)continue;
      ctx.save();
      ctx.strokeStyle='#9b59b6';ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(e.x-5,e.y-e.size-6);ctx.lineTo(e.x+5,e.y-e.size+4);
      ctx.moveTo(e.x+5,e.y-e.size-6);ctx.lineTo(e.x-5,e.y-e.size+4);
      ctx.stroke();
      ctx.restore();
    }
    // Final Reckoning mark Ã¢â‚¬â€ golden sword icon above marked enemies
    for(const e of enemies){
      if(e.hp<=0||!e._finalReckoning||e._finalReckoning<=0)continue;
      ctx.save();
      const _fry=e.y-e.size-14;
      ctx.globalAlpha=0.6+Math.sin(frame*0.15)*0.2;
      ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(e.x,_fry-8);ctx.lineTo(e.x,_fry+8);ctx.stroke();
      ctx.beginPath();ctx.moveTo(e.x-5,_fry-3);ctx.lineTo(e.x+5,_fry-3);ctx.stroke();
      ctx.globalAlpha=0.15;ctx.fillStyle='#ffd700';
      ctx.beginPath();ctx.arc(e.x,e.y,e.size+4,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    // Marked for Death (Felfel) Ã¢â‚¬â€ red crosshair + skull above marked enemy
    for(const e of enemies){
      if(e.hp<=0||!e._deathMark||e._deathMark.timer<=0)continue;
      ctx.save();
      const _my=e.y-e.size-16;
      const _dmCol=e._deathMark.color||'#ff2266';
      const _dmAlt=e._deathMark.altColor||'#aa0033';
      ctx.globalAlpha=0.7+Math.sin(frame*0.2)*0.2;
      // Red crosshair
      ctx.strokeStyle=_dmCol;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(e.x-8,_my);ctx.lineTo(e.x+8,_my);ctx.stroke();
      ctx.beginPath();ctx.moveTo(e.x,_my-8);ctx.lineTo(e.x,_my+8);ctx.stroke();
      ctx.beginPath();ctx.arc(e.x,_my,6,0,Math.PI*2);ctx.stroke();
      // Red glow around enemy
      ctx.globalAlpha=0.12;ctx.fillStyle=_dmCol;
      ctx.beginPath();ctx.arc(e.x,e.y,e.size+5,0,Math.PI*2);ctx.fill();
      // Pulsing red ring
      ctx.globalAlpha=0.25+Math.sin(frame*0.15)*0.1;ctx.strokeStyle=_dmAlt;ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(e.x,e.y,e.size+5,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    // Bombed enemies (Rumman P1) Ã¢â‚¬â€ pulsing red dot above with timer ring.
    for(const e of enemies){
      if(e.hp<=0||!e.bomb)continue;
      ctx.save();
      const t=e.bomb.timer/(3*GAME_TICK_HZ);
      const r=4+Math.sin(frame*0.4)*1.5;
      ctx.fillStyle='#ff2222';
      ctx.beginPath();ctx.arc(e.x,e.y-e.size-10,r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffaa66';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(e.x,e.y-e.size-10,7,-Math.PI/2,-Math.PI/2+(1-t)*Math.PI*2);ctx.stroke();
      // Tiny fuse spark
      ctx.fillStyle='#ffd700';
      ctx.beginPath();ctx.arc(e.x+Math.cos(frame*0.5)*3,e.y-e.size-13,1.5,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    // Toxic Brew stacks (Habaq Barri) Ã¢â‚¬â€ purple bubbles above poisoned enemies
    for(const e of enemies){
      if(e.hp<=0||!e.toxicBrewStacks||e.toxicBrewStacks<=0)continue;
      ctx.save();
      const _sc=e.toxicBrewStacks;
      ctx.fillStyle='#9a55cc';ctx.globalAlpha=0.5+_sc*0.08;
      for(let i=0;i<_sc;i++){
        const _ba=frame*0.06+i*Math.PI*2/_sc;
        const _bx=e.x+Math.cos(_ba)*(e.size*0.5+4);
        const _by=e.y-e.size*0.3+Math.sin(_ba)*3;
        ctx.beginPath();ctx.arc(_bx,_by,2+_sc*0.3,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }
    // Essence Bond thread (Habaq Dhahabi) Ã¢â‚¬â€ golden line from Habaq to bonded ally
    for(const u of units){
      if(!u.essenceBond||!u.essenceBond.target||u.hp<=0)continue;
      const bt=u.essenceBond.target;if(bt.hp<=0)continue;
      ctx.save();
      ctx.strokeStyle='#ffd700';ctx.lineWidth=1.5;ctx.globalAlpha=0.45+Math.sin(frame*0.06)*0.15;
      ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(bt.x,bt.y);ctx.stroke();
      if(frame%8===0){
        const f=Math.random();
        addP(u.x+(bt.x-u.x)*f,u.y+(bt.y-u.y)*f,'#ffd700',1,2);
      }
      ctx.restore();
    }
    // Aroma Statues (Habaq) Ã¢â‚¬â€ basil plant shapes with timer rings + healing bolts
    for(const u of units){
      if(!u._aromaStatues||u.hp<=0)continue;
      for(const st of u._aromaStatues){
        ctx.save();
        const age=(frame-st.born);
        const timerPct=st.timer/st.maxTimer;
        const bob=Math.sin(age*0.08)*2;
        const cx=st.x,cy=st.y+bob;
        const specColor=u.branch==='a'?'#d4a842':(u.branch==='b'?'#7a3a9a':'#5e8a3a');
        const leafG='#5e8a3a';
        ctx.globalAlpha=Math.min(1,timerPct*3);
        ctx.fillStyle='#8b7355';ctx.beginPath();
        ctx.ellipse(cx,cy+6,5,3,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=leafG;
        ctx.beginPath();ctx.ellipse(cx-4,cy-2,4,9,-.3,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(cx+4,cy-2,4,9,.3,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(cx,cy-5,3,10,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#3d6b2e';ctx.lineWidth=0.5;ctx.globalAlpha*=0.5;
        ctx.beginPath();ctx.moveTo(cx,cy-14);ctx.lineTo(cx,cy+2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(cx-3,cy-8);ctx.lineTo(cx-1,cy-2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(cx+3,cy-8);ctx.lineTo(cx+1,cy-2);ctx.stroke();
        ctx.globalAlpha=Math.min(1,timerPct*3);
        ctx.fillStyle=specColor;ctx.globalAlpha*=0.35+Math.sin(age*0.12)*0.15;
        ctx.beginPath();ctx.arc(cx,cy-4,8,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=Math.min(1,timerPct*3)*0.8;
        ctx.strokeStyle=specColor;ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(cx,cy-2,14,-Math.PI/2,-Math.PI/2+Math.PI*2*timerPct);ctx.stroke();
        ctx.globalAlpha=Math.min(1,timerPct*3)*0.2;
        ctx.strokeStyle='#555';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(cx,cy-2,14,0,Math.PI*2);ctx.stroke();
        ctx.restore();
      }
    }
    // Arrow Rain zone (Zaatar) Ã¢â‚¬â€ empty target circle, arrows only when hunter hits inside
    for(const u of units){
      if(!u._arrowRainZone||u.hp<=0)continue;
      const az=u._arrowRainZone;
      const pct=az.timer/az.maxTimer;
      const _isActive=az._active>0;
      ctx.save();
      // Circle fill Ã¢â‚¬â€ brighter when active
      ctx.fillStyle=_isActive?`rgba(255,100,50,${0.18*pct})`:`rgba(255,100,50,${0.05*pct})`;
      ctx.beginPath();ctx.arc(az.x,az.y,az.r,0,Math.PI*2);ctx.fill();
      // Dashed outer ring
      ctx.strokeStyle=`rgba(255,136,68,${(_isActive?0.8:0.35)*pct})`;ctx.lineWidth=2;ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.arc(az.x,az.y,az.r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      // Inner ring
      ctx.strokeStyle=`rgba(255,200,100,${0.2*pct})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(az.x,az.y,az.r*0.5,0,Math.PI*2);ctx.stroke();
      // Crosshair lines
      ctx.strokeStyle=`rgba(255,136,68,${0.2*pct})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(az.x-az.r*0.3,az.y);ctx.lineTo(az.x+az.r*0.3,az.y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(az.x,az.y-az.r*0.3);ctx.lineTo(az.x,az.y+az.r*0.3);ctx.stroke();
      // Arrows only when hunter hits a target inside the zone
      if(_isActive){
        const arrowCount=Math.ceil(5*pct);
        for(let i=0;i<arrowCount;i++){
          const ax=az.x+rnd(-az.r*0.7,az.r*0.7);
          const ay=az.y+rnd(-az.r*0.5,az.r*0.5);
          const aLen=rnd(10,18);
          ctx.strokeStyle=`rgba(180,120,60,${0.5+Math.random()*0.3})`;ctx.lineWidth=2;
          ctx.beginPath();ctx.moveTo(ax,ay-aLen);ctx.lineTo(ax,ay);ctx.stroke();
          ctx.fillStyle=`rgba(220,160,80,${0.6+Math.random()*0.2})`;
          ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax-3,ay-6);ctx.lineTo(ax+3,ay-6);ctx.closePath();ctx.fill();
          ctx.strokeStyle=`rgba(200,140,60,0.4)`;ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(ax-2,ay-aLen);ctx.lineTo(ax,ay-aLen+4);ctx.lineTo(ax+2,ay-aLen);ctx.stroke();
        }
        if(frame%2===0)addP(az.x+rnd(-az.r*0.6,az.r*0.6),az.y+rnd(-az.r*0.4,az.r*0.4),'#ff8844',1,2);
      }
      ctx.restore();
    }
    // Aromatic Rain zone (Habaq sig) Ã¢â‚¬â€ green ground circle + falling rain drops
    for(const u of units){
      if(!u._aromaBurstZone||u.hp<=0)continue;
      const z=u._aromaBurstZone;
      const pct=z.timer/z.maxTimer;
      ctx.save();
      ctx.fillStyle=`rgba(100,180,80,${0.12*pct})`;
      ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=`rgba(136,204,102,${0.5*pct})`;ctx.lineWidth=2;ctx.setLineDash([6,4]);
      ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=`rgba(170,255,170,${0.3*pct})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(z.x,z.y,z.r*0.6,0,Math.PI*2);ctx.stroke();
      const rainCount=Math.ceil(6*pct);
      for(let i=0;i<rainCount;i++){
        const rx=z.x+rnd(-z.r*0.8,z.r*0.8);
        const ry=z.y+rnd(-z.r*0.5,z.r*0.5);
        const rLen=rnd(6,14);
        ctx.strokeStyle=`rgba(136,220,102,${0.3+Math.random()*0.3})`;ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx+rnd(-1,1),ry+rLen);ctx.stroke();
      }
      if(frame%2===0){
        const px=z.x+rnd(-z.r*0.7,z.r*0.7),py=z.y+rnd(-z.r*0.4,z.r*0.4);
        addP(px,py,'#88cc66',1,2);
        addP(px+rnd(-4,4),py+rnd(3,8),'#aaffaa',1,1);
      }
      ctx.restore();
    }
    // Boss aura rings (Hornet Sovereign hornetAura) Ã¢â‚¬â€ yellow dashed ring + buff icons.
    // Hidden mechanic only: Hornet aura buffs adds but no longer draws a ring.
    // Frenzied bosses (Hornet Sovereign post-50%) Ã¢â‚¬â€ pulsing red glow.
    for(const e of enemies){
      if(e.hp<=0||!e.frenzyApplied)continue;
      ctx.save();
      ctx.fillStyle='#ff4040';ctx.globalAlpha=0.20+Math.sin(frame*0.32)*0.12;
      ctx.beginPath();ctx.arc(e.x,e.y,e.size+10,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    // Vanished bosses show a faint shadow at their position.
    for(const e of enemies){
      if(e.hp<=0||!e.stealth||!e.isBoss)continue;
      ctx.save();
      ctx.fillStyle='#440044';ctx.globalAlpha=0.25+Math.sin(frame*0.18)*0.15;
      ctx.beginPath();ctx.ellipse(e.x,e.y,e.size*0.6,e.size*0.25,0,0,Math.PI*2);ctx.fill();
      // 3 swirling smoke particles
      ctx.fillStyle='#aa66cc';
      for(let i=0;i<3;i++){
        const a=frame*0.05+i*Math.PI*2/3;
        ctx.globalAlpha=0.3+Math.sin(frame*0.1+i)*0.2;
        ctx.beginPath();ctx.arc(e.x+Math.cos(a)*e.size*0.7,e.y+Math.sin(a)*e.size*0.4-6,2.4,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }
    // Felfel mirror Ã¢â‚¬â€ distinguish from original with a faint purple-red tint.
    for(const u of units){
      if(!u.isMirror||u.hp<=0)continue;
      ctx.save();
      ctx.fillStyle='#aa3366';ctx.globalAlpha=0.18+Math.sin(frame*0.12)*0.08;
      ctx.beginPath();ctx.arc(u.x,u.y,u.size+5,0,Math.PI*2);ctx.fill();
      // tiny "mirror" indicator above
      ctx.fillStyle='#aa3366';ctx.globalAlpha=0.65;
      ctx.font='bold 9px Arial';ctx.textAlign='center';
      ctx.fillText('M',u.x,u.y-u.size-4);
      ctx.restore();
    }
    // Arena unit-state visual indicators. Player shield absorbs use status icons
    // plus hit/break flashes; persistent bubbles were too noisy in boss piles.
    for(const u of units){
      if(!u.isPlayer||u.hp<=0)continue;
      drawUnitShieldVfx(ctx,{unit:u,x:u.x,y:u.y,size:u.size,frame});
      // Last Stand active aura (Batata)
      if(u.lastStandV6Timer>0){
        ctx.save();
        const r=u.size+14;
        ctx.strokeStyle='#ffaa00';ctx.lineWidth=3;
        ctx.globalAlpha=0.4+Math.sin(frame*0.25)*0.3;
        ctx.beginPath();ctx.arc(u.x,u.y,r,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='#ffaa0033';
        ctx.beginPath();ctx.arc(u.x,u.y,r,0,Math.PI*2);ctx.fill();
        ctx.restore();
      }
      // Aimed Shot charge-up (Sabbar) Ã¢â‚¬â€ when counter is high, glow building
      if(u.aimedShot&&u.aimedShot.counter>=u.aimedShot.every-1){
        ctx.save();
        ctx.fillStyle='#ffd700';ctx.globalAlpha=0.5+Math.sin(frame*0.3)*0.3;
        ctx.beginPath();ctx.arc(u.x,u.y-u.size*0.3,u.size*0.4,0,Math.PI*2);ctx.fill();
        ctx.restore();
      }
      // Aimed Shot Mark charge-up (Zaatar Marksmanship) Ã¢â‚¬â€ glow when next hit is Aimed
      if(u.aimedShotMark&&u.aimedShotMark.counter>=u.aimedShotMark.every-1){
        ctx.save();
        ctx.fillStyle='#ffd700';ctx.globalAlpha=0.5+Math.sin(frame*0.3)*0.3;
        ctx.beginPath();ctx.arc(u.x,u.y-u.size*0.3,u.size*0.4,0,Math.PI*2);ctx.fill();
        ctx.restore();
      }
      // Bloodlust active Ã¢â‚¬â€ pulsing red halo + ember sparks above the unit.
      if(arena.bloodlustTimer>0){
        ctx.save();
        ctx.fillStyle='#ff2222';ctx.globalAlpha=0.22+Math.sin(frame*0.32)*0.12;
        ctx.beginPath();ctx.arc(u.x,u.y,u.size+5,0,Math.PI*2);ctx.fill();
        if(frame%5===0)addP(u.x+rnd(-u.size*0.5,u.size*0.5),u.y-u.size,'#ffaa00',1,3);
        ctx.restore();
      }
      // Tranquility active Ã¢â‚¬â€ gentle green halo + falling rain particles.
      if(arena.tranquilityTimer>0){
        ctx.save();
        ctx.fillStyle='#3aff66';ctx.globalAlpha=0.18+Math.sin(frame*0.18)*0.10;
        ctx.beginPath();ctx.arc(u.x,u.y,u.size+6,0,Math.PI*2);ctx.fill();
        ctx.restore();
      }
      // Frenzy active glow (low HP)
      if(u.frenzy&&u.hp<u.maxHp*0.5){
        ctx.save();
        ctx.fillStyle='#ff4444';ctx.globalAlpha=0.25+Math.sin(frame*0.4)*0.15;
        ctx.beginPath();ctx.arc(u.x,u.y,u.size+4,0,Math.PI*2);ctx.fill();
        ctx.restore();
      }
    }
  }
  // Draw Traps on ground Ã¢â‚¬â€ 3 types with distinct visuals
  for(const u of units){
    if(!u.isPlayer||u.hp<=0||!u._traps)continue;
    for(const _tr of u._traps){
      const _armed=_tr.armTimer>=(_tr.armed||GAME_TICK_HZ);
      const _t=_tr.type||'explosive';
      const _cols={explosive:['#ff6600','rgba(255,102,0,0.25)','#ffaa00'],
                   frost:['#44ccff','rgba(68,204,255,0.25)','#aaeeff'],
                   root:['#44aa22','rgba(68,170,34,0.25)','#88dd44']};
      const _c=_cols[_t]||_cols.explosive;
      ctx.save();ctx.globalAlpha=_armed?0.80+Math.sin(frame*0.15)*0.15:0.35;
      // Outer ring
      ctx.strokeStyle=_armed?_c[0]:'#666';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(_tr.x,_tr.y,11,0,Math.PI*2);ctx.stroke();
      // Inner fill
      ctx.fillStyle=_armed?_c[1]:'rgba(100,100,100,0.15)';
      ctx.beginPath();ctx.arc(_tr.x,_tr.y,11,0,Math.PI*2);ctx.fill();
      if(_t==='explosive'){
        // Fire teeth
        for(let _i=0;_i<6;_i++){const _a=Math.PI*2*_i/6;ctx.fillStyle=_c[0];ctx.beginPath();ctx.arc(_tr.x+Math.cos(_a)*11,_tr.y+Math.sin(_a)*11,2.5,0,Math.PI*2);ctx.fill()}
      }else if(_t==='frost'){
        // Ice crystals (diamond shapes)
        ctx.fillStyle=_c[0];
        for(let _i=0;_i<4;_i++){const _a=Math.PI*2*_i/4;const _cx=_tr.x+Math.cos(_a)*11,_cy=_tr.y+Math.sin(_a)*11;
          ctx.beginPath();ctx.moveTo(_cx,_cy-3);ctx.lineTo(_cx+2,_cy);ctx.lineTo(_cx,_cy+3);ctx.lineTo(_cx-2,_cy);ctx.fill()}
      }else{
        // Root vines (short lines radiating out)
        ctx.strokeStyle=_c[0];ctx.lineWidth=2;
        for(let _i=0;_i<5;_i++){const _a=Math.PI*2*_i/5;
          ctx.beginPath();ctx.moveTo(_tr.x+Math.cos(_a)*7,_tr.y+Math.sin(_a)*7);ctx.lineTo(_tr.x+Math.cos(_a)*14,_tr.y+Math.sin(_a)*14);ctx.stroke()}
      }
      // Center icon
      ctx.fillStyle=_armed?_c[2]:'#555';
      ctx.beginPath();ctx.arc(_tr.x,_tr.y,3.5,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  }
  // Shadow Crash Ã¢â‚¬â€ fixed ground circle + falling void orb
  if(arena&&arena.shadowCrashes){
    for(const sc of arena.shadowCrashes){
      const prog=1-sc.delay/sc.maxDelay;
      const orbY=sc.startY+(sc.y-sc.startY)*prog;
      const orbSize=8+4*prog;
      ctx.save();
      // Ground impact zone Ã¢â‚¬â€ fixed, fully visible from start, pulsing
      ctx.fillStyle='#1a0020';ctx.globalAlpha=0.15;
      ctx.beginPath();ctx.arc(sc.x,sc.y,sc.radius,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#aa66ff';ctx.lineWidth=2;ctx.globalAlpha=0.5+Math.sin(frame*0.25)*0.2;
      ctx.beginPath();ctx.arc(sc.x,sc.y,sc.radius,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#6622aa';ctx.lineWidth=1;ctx.globalAlpha=0.3;
      ctx.beginPath();ctx.arc(sc.x,sc.y,sc.radius*0.6,0,Math.PI*2);ctx.stroke();
      // Crosshair lines inside circle
      ctx.strokeStyle='#6622aa';ctx.lineWidth=1;ctx.globalAlpha=0.25;
      ctx.beginPath();ctx.moveTo(sc.x-sc.radius*0.4,sc.y);ctx.lineTo(sc.x+sc.radius*0.4,sc.y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(sc.x,sc.y-sc.radius*0.4);ctx.lineTo(sc.x,sc.y+sc.radius*0.4);ctx.stroke();
      // Falling void orb / blackhole
      ctx.fillStyle='#1a0020';ctx.globalAlpha=0.4;
      ctx.beginPath();ctx.arc(sc.x,orbY,orbSize+6,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#aa66ff';ctx.lineWidth=2;ctx.globalAlpha=0.6+0.3*prog;
      ctx.beginPath();ctx.arc(sc.x,orbY,orbSize,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#3a0a5a';ctx.globalAlpha=0.8;
      ctx.beginPath();ctx.arc(sc.x,orbY,orbSize*0.7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a0020';ctx.globalAlpha=0.9;
      ctx.beginPath();ctx.arc(sc.x,orbY,orbSize*0.35,0,Math.PI*2);ctx.fill();
      // Swirl ring on the orb
      const swA=frame*0.2;
      ctx.strokeStyle='#cc88ff';ctx.lineWidth=1;ctx.globalAlpha=0.4;
      ctx.beginPath();ctx.ellipse(sc.x,orbY,orbSize,orbSize*0.4,swA,0,Math.PI*2);ctx.stroke();
      // Trail particles from orb
      if(frame%2===0){
        addP(sc.x+rnd(-4,4),orbY+rnd(2,8),'#6622aa',1,2);
        addP(sc.x+rnd(-3,3),orbY+rnd(0,5),'#aa66ff',1,1.5);
      }
      ctx.restore();
    }
  }
  // Wake of Ashes cone wave rendering (Retri Paladin) Ã¢â‚¬â€ angle-based
  if(arena&&arena.wakeOfAshesWaves){
    for(const w of arena.wakeOfAshesWaves){
      const prog=1-w.life/w.maxLife;
      const waveDist=prog*w.len;
      ctx.save();
      // Filled light golden cone toward target angle
      ctx.globalAlpha=0.06*(1-prog);
      ctx.fillStyle='#ffe88a';
      ctx.beginPath();ctx.moveTo(w.x,w.y);
      ctx.arc(w.x,w.y,waveDist,w.ang-w.cone,w.ang+w.cone);
      ctx.closePath();ctx.fill();
      // Leading arc edge
      ctx.strokeStyle='#fff7c4';ctx.lineWidth=1.5;ctx.globalAlpha=0.2*(1-prog);
      ctx.beginPath();ctx.arc(w.x,w.y,waveDist,w.ang-w.cone,w.ang+w.cone);ctx.stroke();
      // Inner arc
      ctx.strokeStyle='#ffe88a';ctx.lineWidth=1;ctx.globalAlpha=0.12*(1-prog);
      ctx.beginPath();ctx.arc(w.x,w.y,waveDist*0.85,w.ang-w.cone*0.8,w.ang+w.cone*0.8);ctx.stroke();
      ctx.restore();
    }
  }
  // Hammer of Light Ã¢â‚¬â€ unit raises big hammer overhead, slams it down on target (Retri Paladin)
  if(arena&&arena.hammerOfLight){
    for(const hl of arena.hammerOfLight){
      const prog=1-hl.delay/hl.maxDelay;
      const _ux=hl.unit&&hl.unit.hp>0?hl.unit.x:hl.ux;
      const _uy=hl.unit&&hl.unit.hp>0?hl.unit.y:hl.uy;
      ctx.save();
      // Hammer head position: starts above unit, ends at target
      const _startX=_ux,_startY=_uy-80;
      const _eased=prog<0.3?prog*prog*11:1-(1-prog)*(1-prog)*1.4;
      const _hx=_startX+(_eased)*(hl.x-_startX);
      const _hy=_startY+(_eased)*(hl.y-_startY);
      // Angle: handle points back toward unit
      const _ang=Math.atan2(_hy-_uy,_hx-_ux);
      const headW=48,headH=22,hLen=55,hW=8;
      ctx.save();
      ctx.translate(_hx,_hy);
      ctx.rotate(_ang);
      // Holy glow behind hammer
      ctx.globalAlpha=0.25+0.2*prog;ctx.fillStyle='#ffd700';
      ctx.beginPath();ctx.arc(0,0,headW*1.2,0,Math.PI*2);ctx.fill();
      // Handle extending backward from head
      ctx.globalAlpha=0.9;ctx.fillStyle='#8B6914';
      ctx.fillRect(-hLen-headW/2,-hW/2,hLen,hW);
      ctx.strokeStyle='#6a4a0a';ctx.lineWidth=1;
      ctx.strokeRect(-hLen-headW/2,-hW/2,hLen,hW);
      // Golden hammer head (perpendicular to handle)
      ctx.fillStyle='#ffd700';
      ctx.fillRect(-headH/2,-headW/2,headH,headW);
      // Shine highlight
      ctx.fillStyle='#ffe066';ctx.globalAlpha=0.6;
      ctx.fillRect(-headH/2+2,-headW/2+2,headH-4,headW/3);
      // Border
      ctx.strokeStyle='#cc9900';ctx.lineWidth=2;ctx.globalAlpha=0.9;
      ctx.strokeRect(-headH/2,-headW/2,headH,headW);
      // White glow on hammer face
      ctx.globalAlpha=0.3+0.25*prog;ctx.fillStyle='#ffffff';
      ctx.beginPath();ctx.arc(0,0,headW*0.5,0,Math.PI*2);ctx.fill();
      ctx.restore();
      // Golden trail from unit to hammer
      ctx.strokeStyle='#ffd700';ctx.lineWidth=3;ctx.globalAlpha=0.15+0.1*prog;
      ctx.beginPath();ctx.moveTo(_ux,_uy);ctx.lineTo(_hx,_hy);ctx.stroke();
      // Trail particles
      if(frame%2===0){
        addP(_hx+rnd(-8,8),_hy+rnd(-8,8),'#ffd700',2,3);
        addP(_hx+rnd(-5,5),_hy+rnd(-5,5),'#fff7c4',1,2);
      }
      ctx.restore();
    }
  }
  // Void Tentacles rendering
  if(arena&&arena.voidTentacles){
    for(const vtn of arena.voidTentacles){
      const _vtAlpha=Math.min(1,vtn.timer/(GAME_TICK_HZ*1.5));
      const _vwv=Math.sin(frame*0.08+vtn.phase)*3;
      ctx.save();ctx.globalAlpha=_vtAlpha*0.7;
      ctx.fillStyle='#3a0a5a';ctx.beginPath();ctx.ellipse(vtn.x,vtn.y+2,12,5,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#6622aa';ctx.lineWidth=3;ctx.globalAlpha=_vtAlpha*0.8;
      ctx.beginPath();ctx.moveTo(vtn.x,vtn.y+2);
      ctx.quadraticCurveTo(vtn.x+_vwv,vtn.y-12,vtn.x+_vwv*0.5,vtn.y-28);ctx.stroke();
      ctx.strokeStyle='#aa66ff';ctx.lineWidth=2;ctx.globalAlpha=_vtAlpha*0.6;
      ctx.beginPath();ctx.moveTo(vtn.x+2,vtn.y+2);
      ctx.quadraticCurveTo(vtn.x-_vwv*0.7,vtn.y-8,vtn.x-_vwv,vtn.y-22);ctx.stroke();
      ctx.fillStyle='#aa66ff';ctx.globalAlpha=_vtAlpha*0.5;
      ctx.beginPath();ctx.arc(vtn.x+_vwv*0.5,vtn.y-28,2,0,Math.PI*2);ctx.fill();
      ctx.restore();
      if(frame%8===0)addP(vtn.x+rnd(-5,5),vtn.y-rnd(5,20),'#6622aa',1,2);
    }
  }
  // Shadow Apparitions rendering
  if(arena&&arena.shadowApparitions){
    for(let i=arena.shadowApparitions.length-1;i>=0;i--){
      const ap=arena.shadowApparitions[i];
      ctx.save();
      // Dark aura behind ghost
      ctx.fillStyle='#1a0020';ctx.globalAlpha=0.25;
      ctx.beginPath();ctx.ellipse(ap.x,ap.y,14,16,0,0,Math.PI*2);ctx.fill();
      // Ghost body
      ctx.fillStyle='#3a0a5a';ctx.globalAlpha=0.7+Math.sin(frame*0.15)*0.15;
      ctx.beginPath();ctx.ellipse(ap.x,ap.y,10,14,0,0,Math.PI*2);ctx.fill();
      // Inner glow
      ctx.fillStyle='#6622aa';ctx.globalAlpha=0.5;
      ctx.beginPath();ctx.ellipse(ap.x,ap.y,6,9,0,0,Math.PI*2);ctx.fill();
      // Glowing eyes
      ctx.fillStyle='#cc88ff';ctx.globalAlpha=0.9;
      ctx.beginPath();ctx.arc(ap.x-3,ap.y-4,2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(ap.x+3,ap.y-4,2,0,Math.PI*2);ctx.fill();
      // Wispy tail
      ctx.strokeStyle='#6622aa';ctx.lineWidth=2;ctx.globalAlpha=0.4;
      const _tw=Math.sin(frame*0.1+i)*4;
      ctx.beginPath();ctx.moveTo(ap.x,ap.y+10);ctx.quadraticCurveTo(ap.x+_tw,ap.y+20,ap.x+_tw*1.5,ap.y+28);ctx.stroke();
      ctx.restore();
    }
  }
  for(const u of units)drawUnit(u);
  drawUnitOverlays();
  drawUnderBossUnitOutlines(ctx,bossRef,units,frame);
  drawAstralWardenForeground(ctx,bossRef,frame);
  drawBeamFx();
  drawProjectiles();
  drawBombs();
  drawParticles();
  if(state==='battle'&&typeof drawWeatherForeground==='function')drawWeatherForeground();
  if(typeof drawUnitHud==='function')for(const u of units)drawUnitHud(u);
  drawDmgNums();
  ctx.restore();
  // HUD
  if(state==='battle'){
    arena_drawHud();
  }
  drawFlash();
  drawSigBanner();
  if(state==='win')drawWinScreen();
  else if(state==='lose')drawLoseScreen();
  if(codexOpen)drawCodex();

  }
  return {render};
}

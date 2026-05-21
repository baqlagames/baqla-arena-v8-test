export function createCombatTransientsRuntime(deps) {
  let frame = 0, screenShake = 0;
  let units = [], enemies = [], projectiles = [], bombs = [], particles = [], dmgNums = [], healFx = [], groundFx = [], beamFx = [];
  const GAME_TICK_HZ = deps.tickHz;
  const dist = (...args) => deps.dist(...args);
  const rnd = (...args) => deps.randomRange(...args);
  const dealDamage = (...args) => deps.dealDamage(...args);
  const addP = (...args) => deps.emitParticle(...args);
  const addHealFx = (...args) => deps.addHealEffect(...args);
  const addDmg = (...args) => deps.addDamageText(...args);
  const replaceBattleArray = (...args) => deps.replaceBattleArray(...args);
  const updateProjectile = (...args) => deps.updateProjectile(...args);
  const updateBomb = (...args) => deps.updateBomb(...args);
  const arena_emberDecreeDamage = (...args) => deps.emberDecreeDamage(...args);
  const clampToArena = (...args) => deps.clampToArena(...args);
  const arena_applyFelfelDeadlyPoison = (...args) => deps.applyFelfelDeadlyPoison(...args);
  const arena_applyJafaarAgony = (...args) => deps.applyJafaarAgony(...args);

  function sync() {
    const v = typeof deps.view === 'function' ? deps.view() : {};
    frame = v.frame || 0;
    screenShake = v.screenShake || 0;
    units = v.units || units;
    enemies = v.enemies || enemies;
    projectiles = v.projectiles || projectiles;
    bombs = v.bombs || bombs;
    particles = v.particles || particles;
    dmgNums = v.damageNumbers || dmgNums;
    healFx = v.healFx || healFx;
    groundFx = v.groundFx || groundFx;
    beamFx = v.beamFx || beamFx;
  }

  function tickCombatTransients() {
    sync();
  // Particles + decay
  for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vx*=0.94;p.vy*=0.94;p.life-=0.025}
  for(const d of dmgNums){d.x+=(d.vx||0);d.y+=(d.vy||-0.45);d.vy*=0.92;d.life-=(d.decay||0.026)}
  for(const h of healFx){h.x+=(h.vx||0);h.y+=(h.vy||-0.32);h.vy*=0.94;h.life-=0.026}
  for(const g of groundFx){
    const _gfSpeed=(g.solarFlareFx||g.lunarStrikeFx||g.celestialAuraFx||g.pandemicCloudFx)?10:(g.toxicStackFx?5:((g.swipeArc||g.swipeSlam)?5:2));
    g.r=Math.min(g.maxR||60,g.r+_gfSpeed);
    if(g.banner){g.bannerTimer--;if(g.bannerTimer<=0)g.life=0}
    else if(g.wildGrowth){g.wgTimer--;g.wgTick++;if(g.wgTick%30===0&&g.wgFollow&&g.wgFollow.hp>0){g.wgFollow.hp=Math.min(g.wgFollow.maxHp,g.wgFollow.hp+g.wgHeal);addHealFx(g.wgFollow.x,g.wgFollow.y,g.wgHeal)}if(g.wgTimer<=0)g.life=0}
    else if(g.volley){g.volleyTimer--;g.volleyTick++;if(g.volleyTick%15===0){for(const e of enemies){if(e.hp>0&&dist(g,e)<g.maxR)dealDamage(e,g.volleyDmg,g.volleyFrom,'normal')}}if(g.volleyTimer<=0)g.life=0}
    else if(g.wildfirePatch){g.wfT++;if(frame%GAME_TICK_HZ===0){for(const e of enemies){if(e.hp>0&&dist(g,e)<=g.wfRadius){dealDamage(e,g.wfDmg,g.wfFrom,'physical');addP(e.x,e.y,'#ff6600',3,2)}}}if(g.wfT>=g.wfDur)g.life=0;if(frame%6===0)addP(g.x+rnd(-g.wfRadius*0.5,g.wfRadius*0.5),g.y+rnd(-g.wfRadius*0.3,g.wfRadius*0.3),'#ff6600',1,3)}
    else if(g.vineLash){g.vineTimer--;if(g.vineTimer<=0)g.life=0}
    else if(g.stormTile){g.stormTimer--;if(g.stormTimer===15){for(const u of units)if(u.hp>0&&dist(g,u)<g.maxR)dealDamage(u,g.stormDmg,g.stormFrom,'magic','stormTile',{sourceLabel:g.stormLabel||'STORM',sourceColor:g.stormColor||g.color})}if(g.stormTimer<=0)g.life=0}
    else if(g.enemyWarn){g.warnTimer--;g.life=Math.max(0,g.warnTimer/Math.max(1,g.warnMax||1));if(g.warnTimer<=0)g.life=0}
    else if(g.bossTel){g.telTimer--;
      if(g.telTimer===5){
        // Detonate
        if(g.telSlowAll){for(const u of units){if(u.hp>0){u.slowTimer=g.telSlowAll;u.slowMult=0.3}}}
        else{
          for(const u of units){if(u.hp>0&&dist(g,u)<g.maxR){
            if(g.emberDecree&&g.emberDecreeCast){
              if(u._emberDecreeLastHit===g.emberDecreeCast)continue;
              u._emberDecreeLastHit=g.emberDecreeCast;
            }
            if(g.telDmg>0){
              const _telDmg=g.emberDecree?arena_emberDecreeDamage(g.telDmg,u,!!g.emberDecreeTank):g.telDmg;
              dealDamage(u,_telDmg,g.telFrom,g.telDmgType||'normal',g.label||'bossTel',{sourceLabel:g.label||'BOSS AOE',sourceColor:g.color});
            }
            if(g.telKnock){const dx=u.x-g.x,dy=u.y-g.y,d=Math.sqrt(dx*dx+dy*dy)||1;u.x+=(dx/d)*40;u.y+=(dy/d)*40;clampToArena(u)}
            if(g.telStun)u.stunned=g.telStun;
            if(g.telFreeze)u.stunned=g.telFreeze;
          }}
        }
        if(!g.telIsFog&&!g.telIsWind)addP(g.x,g.y,g.color,32,6);
        screenShake=Math.max(screenShake,8);
      }
      if(g.telTimer<=0)g.life=0;
    }
    else if(g.poisonCloud){g.pcTimer--;
      if(g.pcTimer%30===0){for(const u of units)if(u.hp>0&&dist(g,u)<g.maxR){dealDamage(u,g.pcDmg,g.pcFrom,'magic','poisonCloud',{sourceLabel:g.pcLabel||'CLOUD',sourceColor:g.pcColor||g.color});if(!u.debuffImmune){u.slowTimer=60;u.slowMult=0.7}}}
      if(g.pcTimer<=0)g.life=0;
    }
    else if(g.bombTrap){
      g.btTimer--;
      if(g.btArmed){
        for(const e of enemies){
          if(e.hp<=0)continue;
          // Trigger radius matches the visible solid disc (0.55Ãƒâ€” ring).
          if(dist(g,e)<g.btRadius*0.55){
            // Detonate: AoE damage to all enemies inside the full radius.
            for(const e2 of enemies)if(e2.hp>0&&dist(g,e2)<g.btRadius)dealDamage(e2,g.btDmg,g.btFrom,'normal');
            addP(g.x,g.y,'#ff8800',24,5);screenShake=Math.max(screenShake,6);
            g.btArmed=false;g.life=0;
            break;
          }
        }
      }
      if(g.btTimer<=0)g.life=0;
    }
    else if(g.slowTrap){
      g.stTimer--;
      if(g.stArmed){
        for(const e of enemies){
          if(e.hp<=0)continue;
          if(dist(g,e)<g.stRadius*0.55){
            for(const e2 of enemies)if(e2.hp>0&&dist(g,e2)<g.stRadius){e2.slowTimer=Math.max(e2.slowTimer||0,g.stDur);e2.slowMult=g.stMult}
            addP(g.x,g.y,'#aaeeff',16,4);
            g.stArmed=false;g.life=0;
            break;
          }
        }
      }
      if(g.stTimer<=0)g.life=0;
    }
    else if(g.blizzard){g.blizTimer--;
      if(g.blizTimer%30===0){for(const u of units)if(u.hp>0&&dist(g,u)<g.maxR){dealDamage(u,g.blizDmg,g.blizFrom,'magic','blizzard',{sourceLabel:g.blizLabel||'BLIZZARD',sourceColor:g.blizColor||g.color});u.slowTimer=90;u.slowMult=0.5}}
      if(g.blizTimer<=0)g.life=0;
    }
    else if(g.jazarAnchor){
      g.anchorTimer--;g.anchorTick++;
      const _jaR=g.anchorRadius||g.maxR||125;
      for(const e of enemies){
        if(e.hp<=0||dist(g,e)>_jaR)continue;
        const dx=g.x-e.x,dy=g.y-e.y,d=Math.hypot(dx,dy)||1;
        if(!e.isBoss&&!e.isBarrier&&!e.lockedAtTop&&!e.aerial){
          const pull=Math.min(g.anchorPull||2.4,Math.max(0,d-8)*0.20);
          e.x+=dx/d*pull;e.y+=dy/d*pull;
          clampToArena(e);
          e.stunned=Math.max(e.stunned||0,4);
          e.slowTimer=Math.max(e.slowTimer||0,12);e.slowMult=Math.min(e.slowMult||1,0.30);
        }else if(e.isBoss){
          e.slowTimer=Math.max(e.slowTimer||0,12);e.slowMult=Math.min(e.slowMult||1,0.80);
        }
        if(g.anchorTick%12===0){
          beamFx.push({x1:e.x,y1:e.y,x2:g.x,y2:g.y,color:'#44ccff66',width:e.isBoss?1.5:2.5,life:0.16,maxLife:0.16,straight:true});
        }
      }
      if(g.anchorTick%30===0){
        for(const e of enemies){
          if(e.hp>0&&dist(g,e)<=_jaR){
            dealDamage(e,g.anchorDmg||5,g.anchorFrom,'normal');
            addP(e.x,e.y,'#44ccff',4,2);addP(e.x,e.y,'#ffffff',2,1.5);
          }
        }
        groundFx.push({x:g.x,y:g.y,r:0,maxR:_jaR*0.72,life:0.22,color:'#88eeff'});
        groundFx.push({x:g.x,y:g.y,r:0,maxR:0,life:0.25,lightningBolt:true,lbX2:g.x+rnd(-_jaR,_jaR),lbY2:g.y+rnd(-_jaR*0.7,_jaR*0.7),color:'#88eeff'});
      }
      if(g.anchorTick%8===0){
        const a=frame*0.12;
        addP(g.x+Math.cos(a)*_jaR*0.65,g.y+Math.sin(a)*_jaR*0.65,'#88eeff',2,3);
        addP(g.x+Math.cos(a+Math.PI)*_jaR*0.45,g.y+Math.sin(a+Math.PI)*_jaR*0.45,'#44ccff',1.5,3);
      }
      if(g.anchorTimer<=0)g.life=0;
    }
    else if(g.infernalCrater){
      g.craterTimer--;g.life=Math.max(0,g.craterTimer/Math.max(1,g.craterMax||1));
      if(frame%18===0)addP(g.x+rnd(-g.maxR*0.45,g.maxR*0.45),g.y+rnd(-g.maxR*0.25,g.maxR*0.25),'#ff6600',1,3);
      if(g.craterTimer<=0)g.life=0;
    }
    else if(g.curseBloom){
      g.cbTimer--;g.cbTick++;
      g.life=Math.max(0,g.cbTimer/Math.max(1,g.cbMax||1));
      if(g.cbTick%(g.cbTickEvery||Math.round(0.5*GAME_TICK_HZ))===0){
        for(const e of enemies){
          if(e.hp<=0||dist(g,e)>g.maxR)continue;
          dealDamage(e,g.cbDmg||1,g.cbFrom||null,'magic');
          if(g.poisonBloom&&g.cbFrom&&g.cbFrom.hp>0&&g.cbFrom.deadlyPoison)arena_applyFelfelDeadlyPoison(g.cbFrom,e,1,true,false);
          else if(g.cbFrom&&g.cbFrom.hp>0&&g.cbFrom.agony)arena_applyJafaarAgony(g.cbFrom,e,true,false);
          addP(e.x,e.y,g.poisonBloom?'#55ff77':'#cc88ff',3,2);
        }
        groundFx.push({x:g.x,y:g.y,r:0,maxR:g.maxR*0.72,life:0.16,color:g.poisonBloom?'#55aa33':'#9b59b6'});
      }
      if(g.cbTick%10===0){
        const a=frame*0.11;
        addP(g.x+Math.cos(a)*g.maxR*0.65,g.y+Math.sin(a)*g.maxR*0.38,g.poisonBloom?'#55ff77':'#cc88ff',1.5,2.5);
        addP(g.x+Math.cos(a+Math.PI)*g.maxR*0.52,g.y+Math.sin(a+Math.PI)*g.maxR*0.30,g.poisonBloom?'#bbff55':'#9b59b6',1,2.5);
      }
      if(g.cbTimer<=0)g.life=0;
    }
    else if(g.bladeVortex){g.bvTimer--;g.bvTick++;
      if(g.bvTick%20===0){for(const e of enemies){if(e.hp>0&&dist(g,e)<g.maxR){dealDamage(e,g.bvDmg,g.bvFrom,'normal');addP(e.x,e.y,'#ffaa00',4,2)}}}
      if(g.bvTick%8===0){const a=frame*0.15;addP(g.x+Math.cos(a)*g.maxR*0.7,g.y+Math.sin(a)*g.maxR*0.7,'#ff8800',2,3)}
      if(g.bvTimer<=0)g.life=0;
    }
    else if(g.mistZone){g.life-=0.014;
      if(frame%GAME_TICK_HZ===0){for(const a of units){if(a.isPlayer&&a.hp>0&&!a.isGhost&&dist(g,a)<g.maxR){a.hp=Math.min(a.maxHp,a.hp+g.mistHeal);addHealFx(a.x,a.y,g.mistHeal)}}}
      if(frame%8===0)addP(g.x+rnd(-g.maxR*0.5,g.maxR*0.5),g.y+rnd(-g.maxR*0.3,g.maxR*0.3),'#88cc66',1,2);
    }
    else g.life-=0.04;
  }
  // Filter
  for(const u of units){
    if(!u)continue;
    if(!Number.isFinite(u.hp)){
      if(u.isPlayer&&!u.isMinion){
        if(!Number.isFinite(u.maxHp)||u.maxHp<=0)u.maxHp=1;
        const fallbackHp=Number.isFinite(u._lastFiniteHp)?u._lastFiniteHp:u.maxHp;
        u.hp=Math.max(1,Math.min(u.maxHp,Math.round(fallbackHp)));
      }else{
        u.hp=0;
      }
    }else if(u.hp>0){
      u._lastFiniteHp=u.hp;
    }
  }
  replaceBattleArray('units',units.filter(u=>u.hp>0));
  for(const e of enemies){if(e.hp<=0&&!e._deathFxDone){
    e._deathFxDone=true;const nc=e.isBoss?30:8;
    for(let i=0;i<nc;i++)addP(e.x+rnd(-e.size*0.5,e.size*0.5),e.y+rnd(-e.size*0.5,e.size*0.5),e.color,1,e.isBoss?5:3);
    if(e.isBoss){screenShake=Math.max(screenShake,14);for(let i=0;i<6;i++)addP(e.x+rnd(-10,10),e.y+rnd(-10,10),'#ffd700',1,4);}
  }}
  replaceBattleArray('enemies',enemies.filter(e=>e.hp>0));
  replaceBattleArray('projectiles',projectiles.filter(p=>updateProjectile(p)));
  replaceBattleArray('bombs',bombs.filter(b=>updateBomb(b)));
  replaceBattleArray('particles',particles.filter(p=>p.life>0));
  replaceBattleArray('damageNumbers',dmgNums.filter(d=>d.life>0));
  replaceBattleArray('healFx',healFx.filter(h=>h.life>0));
  replaceBattleArray('groundFx',groundFx.filter(g=>g.life>0));

    deps.setScreenShake(screenShake);
  }

  return { tickCombatTransients };
}

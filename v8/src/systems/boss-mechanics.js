import { dist, rnd } from '../core/math.js';
import { ARENA_L, ARENA_R } from '../data/tuning.js';
import { ENEMIES } from '../data/enemies.js';
import { clampActorToSpawnArea, clampSpawnValue, spawnAreaFromView } from './arena-spawn-bounds.js';
import { bossPhase, fireBossAbility as fireBossAbil, pickBossTarget } from './boss-mechanics-helpers.js';
import { tryRoyalCarapace, updateRoyalCarapace } from './boss-royal-carapace.js';

export { bossPhase };

const NOOP = () => {};

function normalizeBossContext(ctx = {}) {
  ctx.arena = ctx.arena && typeof ctx.arena === 'object' ? ctx.arena : {};
  ctx.units = Array.isArray(ctx.units) ? ctx.units : [];
  ctx.enemies = Array.isArray(ctx.enemies) ? ctx.enemies : [];
  ctx.bombs = Array.isArray(ctx.bombs) ? ctx.bombs : [];
  ctx.groundFx = Array.isArray(ctx.groundFx) ? ctx.groundFx : [];
  ctx.beamFx = Array.isArray(ctx.beamFx) ? ctx.beamFx : [];
  ctx.frame = Number.isFinite(ctx.frame) ? ctx.frame : 0;
  ctx.width = Number.isFinite(ctx.width) ? ctx.width : 500;
  ctx.arenaTop = Number.isFinite(ctx.arenaTop) ? ctx.arenaTop : 88;
  ctx.arenaBottom = Number.isFinite(ctx.arenaBottom) ? ctx.arenaBottom : 820;
  ctx.dealDamage = typeof ctx.dealDamage === 'function' ? ctx.dealDamage : NOOP;
  ctx.addParticle = typeof ctx.addParticle === 'function' ? ctx.addParticle : NOOP;
  ctx.addDamageText = typeof ctx.addDamageText === 'function' ? ctx.addDamageText : NOOP;
  ctx.showFlash = typeof ctx.showFlash === 'function' ? ctx.showFlash : NOOP;
  ctx.fireProjectile = typeof ctx.fireProjectile === 'function' ? ctx.fireProjectile : NOOP;
  ctx.spawnEnemyByIndex = typeof ctx.spawnEnemyByIndex === 'function' ? ctx.spawnEnemyByIndex : NOOP;
  ctx.tuneBossSupportMinion = typeof ctx.tuneBossSupportMinion === 'function' ? ctx.tuneBossSupportMinion : NOOP;
  ctx.clampToArena = typeof ctx.clampToArena === 'function' ? ctx.clampToArena : NOOP;
  ctx.shake = typeof ctx.shake === 'function' ? ctx.shake : NOOP;
  ctx.SFX = ctx.SFX || {};
  ctx.SFX.bossSlam = typeof ctx.SFX.bossSlam === 'function' ? ctx.SFX.bossSlam : NOOP;
  return ctx;
}

function bossSpawnArea(ctx) {
  return spawnAreaFromView({
    arenaLeft: ARENA_L,
    arenaRight: ARENA_R,
    arenaTop: ctx && ctx.arenaTop,
    arenaBottom: ctx && ctx.arenaBottom,
    spawnLeft: ctx && ctx.spawnLeft,
    spawnRight: ctx && ctx.spawnRight,
    fallbackWidth: ctx && ctx.width,
  });
}

function clampBossActor(actor, ctx, opts = {}) {
  return clampActorToSpawnArea(actor, {
    ...bossSpawnArea(ctx),
    ...opts,
  });
}

function clampBossPoint(x, y, ctx, opts = {}) {
  const area = bossSpawnArea(ctx);
  const sideMargin = Number.isFinite(opts.sideMargin) ? opts.sideMargin : 42;
  const topMargin = Number.isFinite(opts.topMargin) ? opts.topMargin : 44;
  const bottomMargin = Number.isFinite(opts.bottomMargin) ? opts.bottomMargin : 54;
  return {
    x: clampSpawnValue(x, area.left + sideMargin, area.right - sideMargin),
    y: clampSpawnValue(y, area.top + topMargin, area.bottom - bottomMargin),
  };
}

function normalizeBossActor(b, ctx) {
  if (!b || b.hp <= 0) return false;
  ctx = normalizeBossContext(ctx);
  if (!Number.isFinite(b.maxHp) || b.maxHp <= 0) b.maxHp = Math.max(1, b.hp || 1);
  if (!Number.isFinite(b.hp)) b.hp = b.maxHp;
  if (!Number.isFinite(b.x)) b.x = ctx.width / 2;
  if (!Number.isFinite(b.y)) b.y = ctx.arenaTop + 90;
  if (!Number.isFinite(b.size) || b.size <= 0) b.size = b.isLieutenant ? 34 : 42;
  if (!Number.isFinite(b.dmg)) b.dmg = 0;
  if (!Number.isFinite(b.atkSpd) || b.atkSpd <= 0) b.atkSpd = 60;
  if (!Number.isFinite(b.bobPhase)) b.bobPhase = 0;
  if (!b.mechCD || typeof b.mechCD !== 'object') b.mechCD = {};
  if (!b.debuffs || typeof b.debuffs !== 'object') b.debuffs = {};
  if (ctx.arena) {
    if (ctx.arena.lieutenants && !Array.isArray(ctx.arena.lieutenants)) ctx.arena.lieutenants = [];
    if (ctx.arena.activeBarrier && ctx.arena.activeBarrier.bossRef && ctx.arena.activeBarrier.bossRef.hp <= 0) ctx.arena.activeBarrier = null;
  }
  return true;
}

function safeBossAbility(b, key, cdKey, phase, handler, ctx) {
  try {
    return fireBossAbil(b, key, cdKey, phase, handler, ctx);
  } catch (err) {
    b._lastBossAbilityError = {
      key,
      message: err && err.message ? err.message : String(err),
      frame: ctx && Number.isFinite(ctx.frame) ? ctx.frame : 0,
    };
    if (ctx && typeof ctx.addDamageText === 'function' && Number.isFinite(b.x) && Number.isFinite(b.y)) {
      ctx.addDamageText(b.x, b.y - (b.size || 32), 'ABILITY SKIPPED', '#ffaa44');
    }
    return false;
  }
}

export function tickAerialBombs(ctx) {
  ctx = normalizeBossContext(ctx);
  const { arena, units, groundFx, dealDamage, addParticle: addP, shake } = ctx;
  if (!arena || !arena.aerialBombs || !arena.aerialBombs.length) return;
  for (let i = arena.aerialBombs.length - 1; i >= 0; i--) {
    const bomb = arena.aerialBombs[i];
    if (!bomb || !Number.isFinite(bomb.x) || !Number.isFinite(bomb.y)) {
      arena.aerialBombs.splice(i, 1);
      continue;
    }
    const radius = Math.max(1, Number.isFinite(bomb.radius) ? bomb.radius : 60);
    const dmg = Math.max(0, Number.isFinite(bomb.dmg) ? bomb.dmg : 0);
    bomb.t = Number.isFinite(bomb.t) ? bomb.t - 1 : 0;
    if (bomb.t > 0) continue;
    for (const unit of units) {
      if (unit.hp <= 0 || !unit.isPlayer || unit.isGhost || unit.untargetable) continue;
      const distance = Math.hypot(unit.x - bomb.x, unit.y - bomb.y);
      if (distance <= radius) {
        dealDamage(unit, dmg, bomb.from, 'normal');
        addP(unit.x, unit.y, '#ff8844', 6, 4);
      }
    }
    for (let j = 0; j < 24; j++) {
      addP(
        bomb.x + rnd(-radius * 0.6, radius * 0.6),
        bomb.y + rnd(-radius * 0.6, radius * 0.6),
        bomb.strafe ? '#ffaa44' : '#ff8844',
        1,
        4
      );
    }
    groundFx.push({ x: bomb.x, y: bomb.y, r: 0, maxR: radius, life: 0.4, color: '#ff8844' });
    if (!bomb.strafe) shake(10);
    arena.aerialBombs.splice(i, 1);
  }
}

// === BOSS ABILITY HANDLERS ===
function bossAoEPulse(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  // Telegraph circle + delayed damage
  const r=b.aoeRadius||90,dmg=b.aoeDmg||50;
  groundFx.push({x:b.x,y:b.y,r:0,maxR:r,life:1,color:b.aoeColor||'#ff6600',bossTel:true,telTimer:30,telDmg:dmg,telKnock:b.aoeKnockback,telFrom:b,telFreeze:b.aoeFreeze,telSlowAll:b.aoeSlowAll,telIsFog:b.aoeIsFog,telIsWind:b.aoeIsWind});
  showFlash(b.aoeIsWind?'FREEZING WIND!':'INCOMING AOE!',b.aoeColor||'#ff6600',30);
  for(let i=0;i<16;i++)addP(b.x,b.y,b.aoeColor||'#ff6600',1,3);
}
function bossDebuff(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const t=pickBossTarget(b,'random',ctx);if(!t)return;
  if(t.debuffImmune>0||t.ccImmune){addDmg(t.x,t.y-t.size,'IMMUNE','#88ffdd');return;}
  const type=b.debuffType||'poison';
  const dur=b.debuffDur||240;
  if(type==='poison'){if(!t.ccImmune){t.poisonTimer=dur;t.poisonDmgVal=b.debuffDmg||6}}
  else if(type==='slow'){if(!t.ccImmune){t.slowTimer=dur;t.slowMult=0.5;} if(b.debuffDmg)dealDamage(t,b.debuffDmg,b,'normal')}
  else if(type==='freeze'){if(!t.ccImmune){t.stunned=dur;} if(b.debuffDmg)dealDamage(t,b.debuffDmg,b,'magic')}
  else if(type==='amp'){t.ampTimer=dur;t.ampMult=1.3}  // takes +30% damage
  else if(type==='mark'){t.markTimer=dur;t.markMult=1.5}
  else if(type==='deathMark'){t.deathMarkTimer=dur;t.deathMarkDmg=b.debuffDmg||200;t.deathMarkFrom=b}
  else if(type==='livingBomb'){t.livingBomb=true;t.livingBombTimer=300;t.livingBombDmg=b.dmg*2;t.livingBombFrom=b}
  // Visual
  for(let i=0;i<10;i++)addP(t.x,t.y,'#aa00aa',1,3);
  showFlash(type.toUpperCase()+'!','#aa00aa',24);
}
// Generic ranged-magic boss attack Ã¢â‚¬â€ fires a magic projectile at a random
// =====================================================================
// S7 WALL BOSS Ã¢â‚¬â€ barrier purification & shatter
// =====================================================================
// Healer abilities call this with the heal amount + source unit. 50% of the
// heal is drained into the active barrier (within 250 px). When healHp
// reaches healHpMax, the barrier shatters and reveals the boss.
export function drainHealToBarrier(amount,srcUnit,ctx){
  ctx = normalizeBossContext(ctx);
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  if(!arena||!arena.activeBarrier||!Number.isFinite(amount)||amount<=0)return;
  const bar=arena.activeBarrier;
  if(!Number.isFinite(bar.x)||!Number.isFinite(bar.y))return;
  bar.healHpMax=Math.max(1,Number.isFinite(bar.healHpMax)?bar.healHpMax:1);
  bar.healHp=Math.max(0,Number.isFinite(bar.healHp)?bar.healHp:0);
  // Proximity gate is generous Ã¢â‚¬â€ barrier sits up near the boss now, so any
  // healer in the squad zone (grid) is within range.
  if(srcUnit){
    const _d=Math.hypot((srcUnit.x||0)-bar.x,(srcUnit.y||0)-bar.y);
    if(_d>340)return;
  }
  const drain=Math.max(1,Math.round(amount*0.65));   // 0.50Ã¢â€ â€™0.65 Ã¢â‚¬â€ break ~30% faster
  bar.healHp=Math.min(bar.healHpMax,bar.healHp+drain);
  // Drip particle on the barrier Ã¢â‚¬â€ orbit around the oval
  if(frame%3===0){
    const ang=rnd(0,Math.PI*2);
    addP(bar.x+Math.cos(ang)*(bar.rx||100),bar.y+Math.sin(ang)*(bar.ry||50),'#3aff66',1,3);
  }
  if(bar.healHp>=bar.healHpMax)arena_breakBarrier(ctx);
}
function arena_breakBarrier(ctx){
  ctx = normalizeBossContext(ctx);
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const bar=arena&&arena.activeBarrier;
  if(!bar)return;
  arena.activeBarrier=null;
  // Shatter VFX
  const rx=Math.max(24,bar.rx||bar.w||70);
  const ry=Math.max(24,bar.ry||bar.h||70);
  for(let i=0;i<60;i++)addP(bar.x+rnd(-rx,rx),bar.y+rnd(-ry*1.2,ry*1.2),'#a855f7',2,5);
  for(let i=0;i<30;i++)addP(bar.x+rnd(-rx,rx),bar.y+rnd(-ry,ry),'#ffffff',1,3);
  groundFx.push({x:bar.x,y:bar.y,r:0,maxR:220,life:0.7,color:'#a855f7'});
  shake(18);
  showFlash('BARRIER PURIFIED Ã¢â‚¬â€ THE GATE OPENS','#a855f7',150);
  // Mark barrier object dead so it gets filtered from enemies on next sweep
  bar.hp=0;
  // Reveal the boss
  const b=bar.bossRef;
  if(b&&b.hp>0){
    b.untargetable=false;
    b.lockedAtTop=false;
    // Vengeance burst Ã¢â‚¬â€ small magic AoE on all player units
    const dmg=Math.round((b.dmg||50)*0.7);
    for(const u of units){
      if(u.hp<=0||!u.isPlayer||u.isGhost)continue;
      dealDamage(u,dmg,b,'magic');
    }
    addDmg(b.x,b.y-b.size-6,'VENGEANCE!','#ff4444');
  }
}
// =====================================================================
// S12 SKY TYRANT Ã¢â‚¬â€ landing trigger after lieutenants defeated
// =====================================================================
function arena_landSkyTyrant(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  b._landed=true;
  b.aerial=false;
  b.untargetable=false;
  // Drop to mid-arena with a dust cloud + screenshake
  const drop=clampBossPoint(W/2,ARENA_TOP+220,ctx,{sideMargin:60,topMargin:90,bottomMargin:120});
  const tx=drop.x,ty=drop.y;
  b.x=tx;b.y=ty;
  clampBossActor(b,ctx,{topMargin:58,bottomMargin:82});
  for(let i=0;i<40;i++)addP(tx+rnd(-60,60),ty+rnd(-20,20),'#a08a5a',2,5);
  groundFx.push({x:tx,y:ty,r:0,maxR:240,life:0.6,color:'#a08a5a'});
  shake(22);
  showFlash('THE TYRANT LANDS!','#ffaa44',150);
  // HP cap on landing
  if(b.landingHpCap){
    const cap=Math.round(b.maxHp*b.landingHpCap);
    if(b.hp>cap)b.hp=cap;
  }
  // Vengeance burst Ã¢â‚¬â€ physical AoE on all player units
  const dmg=Math.round((b.dmg||60)*0.6);
  for(const u of units){
    if(u.hp<=0||!u.isPlayer||u.isGhost)continue;
    dealDamage(u,dmg,b,'normal');
  }
}
// =====================================================================
// S12 SKY TYRANT Ã¢â‚¬â€ aerial ability handlers
// =====================================================================
function bossBombDrop(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  // Drop a bomb at a random spot near a player unit; 1.5s telegraph then explode.
  const t=pickBossTarget(b,'random',ctx);
  const target=clampBossPoint(
    t?t.x+rnd(-30,30):rnd(ARENA_L+40,ARENA_R-40),
    t?t.y+rnd(-20,20):rnd(ARENA_TOP+200,ARENA_BOT-100),
    ctx,
    {sideMargin:50,topMargin:70,bottomMargin:80}
  );
  const tx=target.x,ty=target.y;
  // Telegraph ring (groundFx pre-warns the player)
  groundFx.push({x:tx,y:ty,r:0,maxR:b.bombDropRadius||80,life:1.5,color:'rgba(200,80,40,0.55)'});
  // Schedule explosion
  arena.aerialBombs=arena.aerialBombs||[];
  arena.aerialBombs.push({x:tx,y:ty,t:90,dmg:b.bombDropDmg||80,radius:b.bombDropRadius||80,from:b});
  addDmg(tx,ty-12,'BOMB!','#ff8844');
}
function bossSkyStrafe(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  // 3 falling projectiles in a vertical line on a random arena column.
  const column=clampBossPoint(rnd(ARENA_L+60,ARENA_R-60),ARENA_TOP+220,ctx,{sideMargin:60,topMargin:80,bottomMargin:80});
  const cx=column.x;
  const dmg=b.skyStrafeDmg||60;
  for(let i=0;i<3;i++){
    const point=clampBossPoint(cx,ARENA_TOP+220+i*70,ctx,{sideMargin:60,topMargin:80,bottomMargin:80});
    const ty=point.y;
    // Schedule frame-delay strikes via the aerialBombs list (faster fuse than bomb drop)
    arena.aerialBombs=arena.aerialBombs||[];
    arena.aerialBombs.push({x:cx,y:ty,t:30+i*18,dmg:dmg,radius:55,from:b,strafe:true});
    groundFx.push({x:cx,y:ty,r:0,maxR:55,life:0.5+i*0.3,color:'rgba(200,140,40,0.4)'});
  }
  showFlash('SKY STRAFE!','#ffaa44',40);
}
function bossSandStorm(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  // Wide curtain Ã¢â‚¬â€ pushes from one side, slows + ticks dmg over 2s on units it crosses.
  const dmg=b.sandStormDmg||50;
  for(const u of units){
    if(u.hp<=0||!u.isPlayer||u.isGhost)continue;
    dealDamage(u,dmg,b,'magic');
    // Slow effect via debuffs
    if(!u.debuffs)u.debuffs={};
    u.debuffs.slow=Math.max(u.debuffs.slow||0,180);
    addP(u.x,u.y,'#c8a05a',6,3);
  }
  // Visual sand sweep Ã¢â‚¬â€ sand particles streaming across arena
  for(let i=0;i<30;i++){
    const point=clampBossPoint(ARENA_L+rnd(0,ARENA_R-ARENA_L),ARENA_TOP+rnd(120,ARENA_BOT-ARENA_TOP-120),ctx,{sideMargin:24,topMargin:40,bottomMargin:40});
    addP(point.x,point.y,'#c8a05a',1,3);
  }
  const center=clampBossPoint(W/2,ARENA_TOP+(ARENA_BOT-ARENA_TOP)/2,ctx,{sideMargin:24,topMargin:40,bottomMargin:40});
  groundFx.push({x:center.x,y:center.y,r:0,maxR:380,life:0.6,color:'rgba(200,160,80,0.35)'});
  showFlash('SAND STORM!','#c8a05a',80);
  shake(8);
}
// player unit (across the arena, ignoring boss range). Used by mid bosses
// to add steady pressure on back-line healers/casters that would otherwise
// stay safe behind tanks. Tunable via b.magicBoltCD/Dmg/Color/Phase.
function bossMagicBolt(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  let t=null;
  if(b.magicBoltBackline){
    const cands=units.filter(u=>u.hp>0&&u.isPlayer&&!u.isGhost&&!u.untargetable&&!u.divineShield&&u.arch!=='tank'&&!u.taunt&&!u.isMinion);
    if(cands.length)t=cands[Math.floor(Math.random()*cands.length)];
  }
  if(!t)t=pickBossTarget(b,'random',ctx);
  if(!t)return;
  const _dmg=b.magicBoltDmg||Math.round(b.dmg*1.5);
  const _col=b.magicBoltColor||'#aa66ff';
  // Telegraph + projectile: short trail of color from boss to target, then
  // dealDamage as magic so target.magicRes / matrix kicks in correctly.
  for(let i=1;i<=8;i++){
    const _f=i/8;
    addP(b.x+(t.x-b.x)*_f,b.y+(t.y-b.y)*_f,_col,1,3);
  }
  addP(t.x,t.y,_col,12,4);
  addP(t.x,t.y,'#ffffff',6,3);
  addDmg(t.x,t.y-t.size-6,'BOLT!',_col);
  dealDamage(t,_dmg,b,'magic');
  showFlash('MAGIC BOLT','#aa66ff',24);
}
function bossBuzzShots(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const backline=units.filter(u=>u&&u.hp>0&&u.isPlayer&&!u.isMinion&&!u.isGhost&&!u.untargetable&&(u.arch==='ranged'||u.arch==='caster'||u.arch==='healer'));
  const fallback=units.filter(u=>u&&u.hp>0&&u.isPlayer&&!u.isGhost&&!u.untargetable);
  const pool=(backline.length?backline:fallback).slice();
  const count=Math.min(b.buzzShotCount||3,pool.length);
  const dmg=b.buzzShotDmg||Math.round((b.dmg||100)*0.32);
  for(let i=0;i<count;i++){
    const idx=Math.floor(Math.random()*pool.length);
    const t=pool.splice(idx,1)[0];
    if(!t)continue;
    fireProjectile(b,t,dmg,{projType:'normal',speed:7,color:'#ffd54a'});
    beamFx.push({x1:b.x,y1:b.y-(b.size||32)*0.35,x2:t.x,y2:t.y-(t.size||18)*0.25,life:0.14,maxLife:0.14,color:'#ffd54a',width:1.5,straight:true});
    addP(b.x,b.y,'#ffd54a',3,2);
    addP(t.x,t.y,'#ffd54a',2,2);
  }
  if(count>0)addDmg(b.x,b.y-(b.size||32)-8,'BUZZ SHOTS','#ffd54a',{sz:11,bold:true});
}
function bossLunge(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  // Prefer nearest TANK (taunt arch) over other classes. Tanks should bait
  // the lunge Ã¢â‚¬â€ without this, lunge picks raw nearest and easily snaps onto
  // a DPS standing slightly closer than the tank.
  let t=null,bd=Infinity;
  for(const u of units){
    if(u.hp<=0||!u.isPlayer)continue;
    const isTank=(u.arch==='tank'||u.taunt);
    let s=dist(b,u);
    if(!isTank)s+=140; // strong bias toward tanks within ~140 px advantage
    if(s<bd){bd=s;t=u}
  }
  if(!t)t=pickBossTarget(b,'nearest',ctx);
  if(!t)return;
  const dx=t.x-b.x,dy=t.y-b.y,d=Math.sqrt(dx*dx+dy*dy)||1;
  const dist_=b.lungeDist||140;
  // Don't overshoot the target Ã¢â‚¬â€ cap reach so the boss lands AT the target,
  // not past it into the back row. Old behavior: a 120 px lunge with a tank
  // at distance 100 would slingshot 20 px PAST the tank, landing on the DPS
  // and catching the healer in the 70 px AoE. Cap reach at d-target.size so
  // the boss ends up next to the target, not on top of whoever's behind.
  const stopAt=Math.max(0,d-(t.size||16));
  const reach=Math.min(dist_,stopAt);
  b.x+=(dx/d)*reach;b.y+=(dy/d)*reach;
  clampToArena(b);
  addP(b.x,b.y,'#ffaa00',24,5);shake(10);
  for(const u of units){if(u.hp>0&&dist(b,u)<70)dealDamage(u,b.lungeDmg||80,b,'normal')}
  showFlash('AERIAL DIVE!','#ffaa00',40);
}
function bossSpawn(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  // P3 escalation Ã¢â‚¬â€ bosses can opt in via b.spawnCountP3 to summon more adds
  // in their final phase (e.g. Pharaoh Ka jumps from 2 mummies Ã¢â€ â€™ 3 below 33% HP).
  const _phase=bossPhase(b);
  const cnt=(_phase>=3&&b.spawnCountP3)?b.spawnCountP3:(b.spawnCount||2);
  for(let i=0;i<cnt;i++){
    spawnEnemyByIdx(b.spawnEnemy||0);
    const spawned=enemies[enemies.length-1];
    arena_tuneBossSupportMinion(spawned,b,ENEMIES[b.spawnEnemy||0],i,cnt);
    // For barrier bosses (S7) Ã¢â‚¬â€ relocate the spawn to the "summoning zone"
    // BELOW the orb but ABOVE the squad grid. Player units engage them in
    // their natural attack range without crossing the barrier line.
    if(b.hasBarrier&&arena&&arena.activeBarrier){
      if(spawned){
        const bar=arena.activeBarrier;
        const summonY=bar.y+(bar.ry||70)+30;   // ~30 px below the orb's bottom edge
        spawned.x=W/2+rnd(-70,70);
        spawned.y=summonY+rnd(-8,8);
        clampBossActor(spawned,ctx,{topMargin:52,bottomMargin:64});
        // Summoning swirl + ground glyph so the appearance reads as "emerged
        // from the gate" not "fell from the sky"
        addP(spawned.x,spawned.y,'#a855f7',16,4);
        addP(spawned.x,spawned.y,'#ffffff',8,3);
        groundFx.push({x:spawned.x,y:spawned.y,r:0,maxR:38,life:0.45,color:'#a855f7'});
      }
    }
    clampBossActor(spawned,ctx,{topMargin:52,bottomMargin:64});
  }
  addP(b.x,b.y,'#aa3333',16,4);
  showFlash('REINFORCEMENTS!','#aa3333',30);
}
function bossMeteor(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const t=pickBossTarget(b,'random',ctx);
  const target=clampBossPoint(t?t.x:W/2,t?t.y:ARENA_BOT-100,ctx,{sideMargin:50,topMargin:70,bottomMargin:80});
  const tx=target.x,ty=target.y;
  bombs.push({x:tx,y:ARENA_TOP-60,fromX:tx,fromY:ARENA_TOP-60,tx,ty,t:0,dur:55,
    dmg:b.meteorDmg||120,radius:b.meteorRadius||80,attacker:b,isPlayer:false,color:'#ff4400',meteor:true});
  showFlash('METEOR!','#ff4400',30);
}
function bossBurrow(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const t=pickBossTarget(b,'random',ctx);if(!t)return;
  addP(b.x,b.y,'#8b6f3d',24,5);
  b.x=t.x;b.y=t.y+10;
  clampToArena(b);
  addP(b.x,b.y,'#8b6f3d',24,5);
  shake(10);
  for(const u of units){if(u.hp>0&&dist(b,u)<70)dealDamage(u,b.burrowDmg||100,b,'normal')}
  showFlash('BURROW!','#8b6f3d',30);
}
function bossVanish(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  b.stealth=true;b.stealthHits=0;b.firstHitDone=false;
  b.vanishStrikeMult=b.vanishMult||3.0;
  addP(b.x,b.y,'#440044',24,5);
  showFlash('VANISH!','#aa66cc',30);
}
function bossPoisonCloud(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const t=pickBossTarget(b,'nearest',ctx);
  const target=clampBossPoint(t?t.x:b.x,t?t.y:b.y+60,ctx,{sideMargin:46,topMargin:58,bottomMargin:70});
  const tx=target.x,ty=target.y;
  groundFx.push({x:tx,y:ty,r:0,maxR:80,life:1,color:'#88aa44',poisonCloud:true,pcTimer:300,pcDmg:8,pcFrom:b});
  showFlash('POISON CLOUD!','#88aa44',30);
}
function bossBlizzard(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const t=pickBossTarget(b,'random',ctx);
  const target=clampBossPoint(t?t.x:b.x,t?t.y:b.y+60,ctx,{sideMargin:46,topMargin:58,bottomMargin:70});
  const tx=target.x,ty=target.y;
  groundFx.push({x:tx,y:ty,r:0,maxR:60,life:1,color:'#88ddff',blizzard:true,blizTimer:300,blizDmg:5,blizFrom:b});
  showFlash('BLIZZARD ZONE!','#88ddff',30);
}
function bossStomp(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  groundFx.push({x:b.x,y:b.y,r:0,maxR:b.stompRadius||120,life:1,color:'#ccc',bossTel:true,telTimer:30,telDmg:b.stompDmg||90,telStun:b.stompStun||60,telFrom:b});
  addP(b.x,b.y,'#7a8a9a',32,5);shake(12);
  showFlash('MOUNTAIN STOMP!','#88ddff',30);
}
function bossIceBlock(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  b.iceBlock=true;b.iceBlockTimer=b.iceBlockDur||180;
  b.hp=Math.min(b.maxHp,b.hp+b.maxHp*0.05);
  addP(b.x,b.y,'#88ddff',32,5);
  showFlash('ICE BLOCK!','#88ddff',60);
}
// Crow Gerban specific
function bossCaw(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const t=pickBossTarget(b,'lowest',ctx);
  if(t)fireProjectile(b,t,b.cawDmg||200,{projType:'curse',speed:6});
  addP(b.x,b.y,'#aa3333',12,4);
  showFlash('CAW OF DOOM!','#aa3333',30);
}
function bossDive(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const target=clampBossPoint(W/2,ARENA_BOT-100,ctx,{sideMargin:60,topMargin:70,bottomMargin:80});
  bombs.push({x:b.x,y:ARENA_TOP-60,fromX:b.x,fromY:ARENA_TOP-60,tx:target.x,ty:target.y,t:0,dur:55,
    dmg:b.diveDmg||250,radius:130,attacker:b,isPlayer:false,color:'#440044',meteor:true});
  showFlash('AERIAL DIVE!','#aa66cc',60);
}
function bossFeatherVolley(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  for(let i=0;i<(b.featherCount||8);i++){
    const ang=Math.PI/2+(i-(b.featherCount-1)/2)*0.18;
    const fakeT={x:b.x+Math.cos(ang)*400,y:b.y+Math.sin(ang)*400,hp:1};
    fireProjectile(b,fakeT,b.dmg*0.7,{projType:'curse',speed:5});
  }
  showFlash('FEATHER VOLLEY!','#aa66cc',30);
}
function bossEmberVolley(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const alive=units.filter(u=>u.hp>0&&u.isPlayer&&!u.isGhost&&!u.untargetable);
  if(!alive.length)return;
  const count=b.emberVolleyCount||5;
  const mult=b.emberVolleyDmgMult||0.45;
  for(let i=0;i<count;i++){
    const t=alive[Math.floor(Math.random()*alive.length)];
    fireProjectile(b,t,Math.round(b.dmg*mult),{projType:'fire',speed:5.5});
  }
  for(let i=0;i<24;i++)addP(b.x,b.y,'#ff8c22',1,4);
  showFlash('EMBER VOLLEY!','#ff8c22',40);
}
function bossEmberDecree(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const radius=b.emberDecreeRadius||62;
  const backline=units.filter(u=>u.hp>0&&u.isPlayer&&!u.isGhost&&!u.untargetable&&!u.divineShield&&u.arch!=='tank'&&!u.taunt&&!u.isMinion);
  const tanks=units.filter(u=>u.hp>0&&u.isPlayer&&!u.isGhost&&!u.untargetable&&!u.divineShield&&(u.arch==='tank'||u.taunt));
  const chosen=[];
  const castId='ember-decree-'+((b._emberDecreeCastId=(b._emberDecreeCastId||0)+1));
  const count=Math.min(b.emberDecreeCount||2,backline.length);
  for(let i=0;i<count;i++){
    backline.sort((a,b)=>((a.hp/a.maxHp)-(b.hp/b.maxHp))+rnd(-0.25,0.25));
    const t=backline.find(u=>!chosen.includes(u));
    if(t)chosen.push(t);
  }
  if(!chosen.length){
    const fallback=pickBossTarget(b,'random',ctx);
    if(fallback)chosen.push(fallback);
  }
  for(const t of chosen){
    groundFx.push({x:t.x,y:t.y,r:0,maxR:radius,life:1.2,color:'#ff7a22',bossTel:true,emberDecree:true,emberDecreeCast:castId,telTimer:45,telMax:45,telDmg:b.emberDecreeDmg||120,telFrom:b,telDmgType:'magic'});
    beamFx.push({x1:b.x,y1:b.y,x2:t.x,y2:t.y,life:0.28,maxLife:0.28,color:'#ffb238',width:3,straight:false});
    addDmg(t.x,t.y-(t.size||20)-10,'CINDER!','#ffb238',{sz:13,bold:true});
  }
  if(tanks.length){
    tanks.sort((ta,tb)=>dist(b,ta)-dist(b,tb));
    const tank=tanks[0];
    groundFx.push({x:tank.x,y:tank.y,r:0,maxR:Math.max(34,radius*0.8),life:1.2,color:'#ff3a22',bossTel:true,emberDecree:true,emberDecreeCast:castId,emberDecreeTank:true,telTimer:45,telMax:45,telDmg:b.emberDecreeTankDmg||80,telFrom:b,telDmgType:'magic'});
    addDmg(tank.x,tank.y-(tank.size||20)-10,'TANK BRAND','#ff6a22',{sz:12,bold:true});
  }
  for(let i=0;i<30;i++)addP(b.x+rnd(-18,18),b.y+rnd(-18,18),'#ff8c22',1,5);
  showFlash('CINDER DECREE!','#ff8c22',75);
  shake(7);
}
function bossRoyalDive(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const candidates=[];
  for(const u of units){
    if(u.hp<=0||!u.isPlayer||u.isGhost||u.untargetable||u.divineShield)continue;
    if(u.arch==='ranged'||u.arch==='caster'||u.arch==='healer'||u.prefersRanged)candidates.push(u);
  }
  const t=candidates.length?candidates[Math.floor(Math.random()*candidates.length)]:pickBossTarget(b,'random',ctx);
  if(!t)return;
  const ox=b.x,oy=b.y;
  b.x=t.x+rnd(-18,18);
  b.y=Math.max(ARENA_TOP+40,t.y-22);
  clampBossActor(b,ctx,{topMargin:58,bottomMargin:82});
  const radius=b.royalDiveRadius||58;
  const dmg=b.royalDiveDmg||120;
  const stun=b.royalDiveStun||36;
  for(const u of units){
    if(u.hp>0&&u.isPlayer&&dist(b,u)<=radius){
      dealDamage(u,dmg,b,'magic');
      if(!u.ccImmune)u.stunned=Math.max(u.stunned||0,stun);
      addP(u.x,u.y,'#ff8c22',12,4);
    }
  }
  groundFx.push({x:b.x,y:b.y,r:0,maxR:radius,life:0.45,color:'#ff8c22'});
  beamFx.push({x1:ox,y1:oy,x2:b.x,y2:b.y,life:0.35,maxLife:0.35,color:'#ffb238',width:6,straight:false});
  addDmg(b.x,b.y-b.size,'ROYAL DIVE!','#ff8c22',{sz:16,bold:true});
  showFlash('ROYAL DIVE!','#ff8c22',55);
  shake(12);
}
function bossPlagueStorm(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const target=clampBossPoint(
    ARENA_L+Math.random()*(ARENA_R-ARENA_L),
    ARENA_TOP+Math.random()*(ARENA_BOT-ARENA_TOP),
    ctx,
    {sideMargin:50,topMargin:60,bottomMargin:70}
  );
  const tx=target.x,ty=target.y;
  groundFx.push({x:tx,y:ty,r:0,maxR:55,life:1,color:'#660066',stormTile:true,stormTimer:30,stormDmg:b.dmg*0.5,stormFrom:b});
  addP(tx,ty,'#660066',8,3);
}
function bossDarkWind(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  for(const u of units){if(u.hp>0){
    const dx=b.x-u.x,dy=b.y-u.y,d=Math.sqrt(dx*dx+dy*dy)||1;
    u.x+=(dx/d)*60;u.y+=(dy/d)*60;
    clampToArena(u);
    dealDamage(u,b.dmg*0.4,b,'magic');
  }}
  showFlash('DARK WIND!','#440044',60);shake(10);
}
// === MAIN BOSS UPDATE ===
export function updateBoss(b,ctx){
  ctx=normalizeBossContext(ctx);
  if(!normalizeBossActor(b,ctx))return;
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  if(!b.mechCD)b.mechCD={};
  // Ice block grants invulnerability
  if(b.iceBlock){b.iceBlockTimer--;if(b.iceBlockTimer<=0)b.iceBlock=false;return}
  // S7 WALL BOSS Ã¢â‚¬â€ barrier purified? lockedAtTop is cleared by arena_breakBarrier;
  // while it's true, freeze boss position so it stays behind the wall.
  // Also drag the barrier to match the boss position each frame (it had been
  // drifting away because barrier x/y were only set at spawn).
  if(b.lockedAtTop){
    b.x=W/2;b.y=ARENA_TOP+90;     // boss sits below the purify bar with clean spacing
    if(arena.activeBarrier){arena.activeBarrier.x=b.x;arena.activeBarrier.y=b.y}
  }
  // S12 SKY TYRANT Ã¢â‚¬â€ aerial patrol while lieutenants alive. Slow horizontal sway,
  // locked to upper band. Drops to mid-arena when last lieutenant dies.
  if(b.aerial){
    b.aerialPatrolT=(b.aerialPatrolT||0)+1;
    const _t=b.aerialPatrolT/120; // ~2s phase
    b.x=W/2+Math.sin(_t)*(W*0.32);
    b.y=ARENA_TOP+65+Math.cos(_t*0.6)*22;
    clampBossActor(b,ctx,{topMargin:46,bottomMargin:120});
    // Shadow on the ground beneath
    if(frame%6===0)groundFx.push({x:b.x,y:ARENA_BOT-90,r:0,maxR:b.size*0.8,life:0.2,color:'rgba(0,0,0,0.35)',flatten:true});
    // Check lieutenant alive count Ã¢â‚¬â€ land when zero remain.
    const lieutenantList=Array.isArray(arena.lieutenants)?arena.lieutenants.filter(Boolean):[];
    if(lieutenantList.length!==(arena.lieutenants&&arena.lieutenants.length))arena.lieutenants=lieutenantList;
    if(lieutenantList.length){
      const aliveLt=lieutenantList.filter(l=>l.hp>0).length;
      if(aliveLt!==b._lastLtCount){
        b._lastLtCount=aliveLt;
        if(aliveLt>0)showFlash('LIEUTENANTS REMAINING: '+aliveLt,'#ffaa44',60);
      }
      if(aliveLt===0&&!b._landed){arena_landSkyTyrant(b,ctx)}
    } else if(b.lieutenantsTotal&&!b._landed){
      arena_landSkyTyrant(b,ctx);
    }
  }
  // Lieutenant deaths flow up to the main boss. Lieutenant uses standard updateBoss
  // (it's flagged isBoss:true) Ã¢â‚¬â€ no special branch needed.
  // arena: Escort spawn (one-shot on boss arrival) Ã¢â‚¬â€ Hornet Sovereign etc.
  if(b.escortSpawn&&!b.escortsSpawned){
    b.escortsSpawned=true;
    for(let i=0;i<b.escortSpawn;i++){
      spawnEnemyByIdx(b.escortEnemy||0);
      const escort=enemies[enemies.length-1];
      arena_tuneBossSupportMinion(escort,b,ENEMIES[b.escortEnemy||0],i,b.escortSpawn);
      clampBossActor(escort,ctx,{topMargin:52,bottomMargin:64});
    }
    addP(b.x,b.y,'#ffaa00',32,6);
    showFlash('ESCORTS!','#ffaa00',60);
  }
  if(!b.isLieutenant){
    if(!b._raidAoeCD)b._raidAoeCD=0;
    b._raidAoeCD++;
    if(b._raidAoeCD>=480){
      b._raidAoeCD=0;
      const _aeDmg=b.raidAoeDmg||Math.round(b.dmg*0.30);
      for(const u of units){if(u.isPlayer&&u.hp>0){dealDamage(u,_aeDmg,b,'magic');addP(u.x,u.y,'#ff2244',4,2)}}
      groundFx.push({x:b.x,y:b.y,r:0,maxR:400,life:0.4,color:'rgba(255,34,68,0.3)'});
      if(frame%960<480)addDmg(b.x,b.y-b.size-8,'BOSS PULSE','#ff2244');
    }
    // Boss backline slam Ã¢â‚¬â€ every ~10s, boss targets a random non-tank unit
    if(!b._backSlamCD)b._backSlamCD=0;
    b._backSlamCD++;
    if(b._backSlamCD>=600){
      b._backSlamCD=0;
      const _blCands=[];
      for(const u of units){
        if(u.hp<=0||!u.isPlayer||u.isGhost||u.untargetable||u.divineShield)continue;
        if(u.arch!=='tank'&&!u.taunt)_blCands.push(u);
      }
      if(_blCands.length){
        const _bt=_blCands[Math.floor(Math.random()*_blCands.length)];
        const _bsDmg=Math.round(b.dmg*0.40);
        dealDamage(_bt,_bsDmg,b,'magic');
        beamFx.push({x1:b.x,y1:b.y,x2:_bt.x,y2:_bt.y,life:0.6,maxLife:0.6,color:'#ff2244',width:6,straight:true});
        beamFx.push({x1:b.x,y1:b.y,x2:_bt.x,y2:_bt.y,life:0.4,maxLife:0.4,color:'#ff8866',width:3,straight:false});
        addP(_bt.x,_bt.y,'#ff4466',10,4);addP(_bt.x,_bt.y,'#ff8844',6,5);
        groundFx.push({x:_bt.x,y:_bt.y,r:0,maxR:40,life:0.4,color:'#ff224488'});
        addDmg(_bt.x,_bt.y-_bt.size-6,'BOSS SLAM!','#ff4466',{sz:16,bold:true});
        shake(5);
        SFX.bossSlam();
      }
    }
  }
  if(b.hornetAura){
    for(const e of enemies){
      if(e===b||e.hp<=0||e.ignoreHornetAura)continue;
      if(dist(b,e)>b.hornetAura)continue;
      const mult=b.hornetAuraMult||1.20;
      // Restore previous atkSpd before applying new buff (so buff is sticky-but-clean)
      if(e._auraSrc!==b||e._auraMult!==mult){
        if(e._auraOrigAtkSpd)e.atkSpd=e._auraOrigAtkSpd;
        e._auraOrigAtkSpd=e.atkSpd;
        e.atkSpd=Math.max(18,Math.round(e.atkSpd/mult));
        e._auraSrc=b;e._auraMult=mult;
      }
      e._auraTouchFrame=frame;
    }
    // Stale-buff sweep: any enemy still tagged by THIS boss but not touched
    // this frame (walked out of range, knocked back, etc.) gets restored.
    // Without this the +20% atkSpd persists forever on enemies that exited.
    for(const e of enemies){
      if(e._auraSrc===b&&e._auraTouchFrame!==frame&&e._auraOrigAtkSpd){
        e.atkSpd=e._auraOrigAtkSpd;
        e._auraSrc=null;e._auraMult=null;e._auraOrigAtkSpd=null;
      }
    }
  }
  // arena: Frenzy at HP threshold (Hornet Sovereign 50% HP) Ã¢â‚¬â€ permanent atkSpd buff.
  if(b.frenzyAt&&!b.frenzyApplied&&b.hp<b.maxHp*b.frenzyAt){
    b.frenzyApplied=true;
    const m=b.frenzyAtkSpdMult||0.83;
    b.atkSpd=Math.max(18,Math.round(b.atkSpd*m));
    showFlash('FRENZY!','#ff0040',100);
    addP(b.x,b.y,'#ff0040',48,7);
    shake(12);
  }
  // Phase transitions Ã¢â‚¬â€ banner notifications when entering 2 / 3
  const phase=bossPhase(b);
  if(phase>(b.lastPhase||0)){
    b.lastPhase=phase;
    if(phase>1){
      const phaseNames=['','','PHASE 2','PHASE 3'];
      const phaseColors=['','','#ff8c00','#ff0040'];
      const phaseIdx=Math.max(2,Math.min(phase,phaseNames.length-1));
      b._phaseFlashTimer=60;
      showFlash(phaseNames[phaseIdx]+'!  NEW ABILITIES UNLOCKED',phaseColors[phaseIdx],100);
      shake(16);
      for(let i=0;i<60;i++)addP(b.x,b.y,phaseColors[phaseIdx],1,6);
      groundFx.push({x:b.x,y:b.y,r:0,maxR:b.size+48,life:0.55,color:phaseColors[phaseIdx]});
      groundFx.push({x:b.x,y:b.y,r:0,maxR:b.size+88,life:0.36,color:'#ffffff'});
    }
  }
  // Time-based enrage Ã¢â‚¬â€ measured from when THIS boss spawned, not from stage start.
  // Otherwise a stage with long wave preamble would enrage the boss almost immediately.
  const bossLifeFrames=frame-(b.spawnFrame||frame);
  if(!b.timeEnraged && bossLifeFrames>(b.timeEnrageAt||5400)){
    b.timeEnraged=true;
    b.dmg=Math.round(b.dmg*1.25);
    b.atkSpd=Math.max(20,Math.round(b.atkSpd*0.7));
    showFlash('BOSS ENRAGED!  +25% DMG, +30% SPEED','#ff0040',150);
    shake(20);
    for(let i=0;i<80;i++)addP(b.x,b.y,'#ff0040',1,6);
  }
  // 20% HP desperation Ã¢â‚¬â€ small final boost
  if(!b.desperate && b.hp/b.maxHp<0.2){
    b.desperate=true;
    b._phaseFlashTimer=60;
    b.dmg=Math.round(b.dmg*1.10);
    b.atkSpd=Math.max(18,Math.round(b.atkSpd*0.9));
    showFlash('FINAL STAND!','#ff8c00',100);
    for(let i=0;i<40;i++)addP(b.x,b.y,'#ff8c00',1,5);
  }
  if(updateRoyalCarapace(b,ctx))return;
  if(tryRoyalCarapace(b,ctx))return;
  // === Run all phase-gated abilities ===
  // Aerial bosses (Storm Roc) skip ground abilities while flying Ã¢â‚¬â€ they fire
  // bombDrop / skyStrafe / sandStorm instead. Once landed, ground abilities
  // (lunge, aoe, magicBolt) resume.
  if(!b.aerial){
    safeBossAbility(b,'aoe','aoeCD',b.aoePhase||1,bossAoEPulse,ctx);
    safeBossAbility(b,'buzzShot','buzzShotCD',b.buzzShotPhase||1,bossBuzzShots,ctx);
    safeBossAbility(b,'lunge','lungeCD',b.lungePhase||1,bossLunge,ctx);
    safeBossAbility(b,'magicBolt','magicBoltCD',b.magicBoltPhase||1,bossMagicBolt,ctx);
    safeBossAbility(b,'emberVolley','emberVolleyCD',b.emberVolleyPhase||1,bossEmberVolley,ctx);
    safeBossAbility(b,'emberDecree','emberDecreeCD',b.emberDecreePhase||1,bossEmberDecree,ctx);
    safeBossAbility(b,'royalDive','royalDiveCD',b.royalDivePhase||1,bossRoyalDive,ctx);
  }
  safeBossAbility(b,'debuff','debuffCD',b.debuffPhase||2,bossDebuff,ctx);
  safeBossAbility(b,'spawn','spawnCD',b.spawnPhase||1,bossSpawn,ctx);
  safeBossAbility(b,'meteor','meteorCD',b.meteorPhase||1,bossMeteor,ctx);
  // S12 Sky Tyrant aerial abilities Ã¢â‚¬â€ only fire while aerial.
  if(b.aerial){
    safeBossAbility(b,'bombDrop','bombDropCD',b.bombDropPhase||1,bossBombDrop,ctx);
    safeBossAbility(b,'skyStrafe','skyStrafeCD',b.skyStrafePhase||1,bossSkyStrafe,ctx);
    safeBossAbility(b,'sandStorm','sandStormCD',b.sandStormPhase||1,bossSandStorm,ctx);
  }
  safeBossAbility(b,'burrow','burrowCD',b.burrowPhase||1,bossBurrow,ctx);
  safeBossAbility(b,'vanish','vanishCD',b.vanishPhase||1,bossVanish,ctx);
  safeBossAbility(b,'pcloud','poisonCloudCD',b.poisonCloudPhase||1,bossPoisonCloud,ctx);
  safeBossAbility(b,'bliz','blizzardCD',b.blizzardPhase||1,bossBlizzard,ctx);
  safeBossAbility(b,'stomp','stompCD',b.stompPhase||1,bossStomp,ctx);
  safeBossAbility(b,'iceblock','iceBlockCD',b.iceBlockPhase||1,bossIceBlock,ctx);
  // Crow Gerban abilities
  safeBossAbility(b,'caw','cawCD',b.cawPhase||1,bossCaw,ctx);
  safeBossAbility(b,'dive','diveCD',b.divePhase||1,bossDive,ctx);
  safeBossAbility(b,'feather','featherCD',b.featherPhase||1,bossFeatherVolley,ctx);
  safeBossAbility(b,'storm','stormCD',b.stormPhase||1,bossPlagueStorm,ctx);
  safeBossAbility(b,'wind','windCD',b.windPhase||1,bossDarkWind,ctx);
  // === One-shot mechanics ===
  // Ember Crow Prince: at low HP, calls two weak fire-crow chicks as a distraction.
  // Chick damage is authored separately so boss buffs do not secretly buff them.
  if(b.chicksAt&&!b.chicksSummoned&&b.hp<b.maxHp*b.chicksAt){
    b.chicksSummoned=true;
    const count=b.chicksCount||2;
    for(let i=0;i<count;i++){
      const chickHp=Math.max(220,Math.round(b.maxHp*(b.chickHpPct||0.05)));
      const chick={
        name:'Ember Chick',
        act:2,arch:'ranged',
        x:b.x+(i-(count-1)/2)*42,y:b.y+34+rnd(-8,8),
        color:'#ff8c22',accent:'#ffcf66',
        maxHp:chickHp,hp:chickHp,
        dmg:Math.max(8,Math.round(b.chickDmg||b.dmg*(b.chickDmgMult||0.24))),
        speed:0.46,atkSpd:b.chickAtkSpd||104,range:b.chickRange||120,size:Math.max(14,b.size*0.40),
        armor:0,magicRes:2,armorType:'unarmored',
        flying:true,projType:'fire',prefersBackline:true,points:80,
        ignoreHornetAura:true,
        isEnemy:true,cd:0,facing:-1,bobPhase:Math.random()*Math.PI*2,debuffs:{},spawnFrame:frame,
        entryHold:b.chickEntryHold||45
      };
      clampBossActor(chick,ctx,{topMargin:52,bottomMargin:64});
      enemies.push(chick);
      addP(chick.x,chick.y,'#ff8c22',18,4);
    }
    groundFx.push({x:b.x,y:b.y,r:0,maxR:90,life:0.5,color:'#ff8c22'});
    showFlash('EMBER CHICKS!','#ff8c22',90);
    shake(10);
  }
  // Sultan: Sons of Embers at 25%. Explicit construction (NOT spread of BOSSES[4])
  // so each son gets ONE ability (meteor) Ã¢â‚¬â€ without this, sons inherit Sultan's
  // sonsAt/spawnCD/aoeCD and cascade their own sons + Inferno Pulses + Cinder Pact.
  if(b.sonsAt&&!b.sonsSummoned&&b.hp<b.maxHp*b.sonsAt){
    b.sonsSummoned=true;
    for(let i=0;i<(b.sonsCount||3);i++){
      const s={
        name:'Son of Embers',
        x:b.x+(i-1)*60,y:b.y+30,
        color:'#ff6020',accent:'#7a3008',
        maxHp:Math.round(b.maxHp*0.15),hp:Math.round(b.maxHp*0.15),
        dmg:Math.round(b.dmg*0.5),
        size:b.size*0.55,
        armor:3,magicRes:4,
        speed:0.30,atkSpd:60,range:60,
        points:200,
        meteorCD:480,meteorPhase:1,meteorDmg:Math.round(b.dmg*0.8),meteorRadius:60,
        projType:'fire',
        isEnemy:true,isBoss:true,cd:0,facing:-1,bobPhase:0,debuffs:{},mechCD:{},
        spawnFrame:frame,
        timeEnrageAt:9999999, // sons are short-lived Ã¢â‚¬â€ no time-enrage
      };
      clampBossActor(s,ctx,{topMargin:58,bottomMargin:82});
      enemies.push(s);
    }
    showFlash('SONS OF EMBERS!','#ff4400',120);shake(16);
  }
  // Pharaoh Ka: Resurrect once
  if(b.resurrectOnce&&!b.kaResUsed&&b.hp<=1){
    b.kaResUsed=true;
    b.hp=b.maxHp*0.5;
    b.mechCD={};
    addP(b.x,b.y,'#d4a857',60,8);
    showFlash('RESURRECTION!  ALL ABILITIES REFRESH','#d4a857',150);
    shake(18);
  }
  // Frost Titan: Avalanche at 25%
  if(b.avalancheAt&&!b.avalancheUsed&&b.hp<b.maxHp*b.avalancheAt){
    b.avalancheUsed=true;
    for(const u of units){if(u.hp>0){
      dealDamage(u,b.dmg*1.5,b,'normal');
      const dx=u.x-b.x,dy=u.y-b.y,d=Math.sqrt(dx*dx+dy*dy)||1;
      u.x+=(dx/d)*80;u.y+=(dy/d)*80;clampToArena(u);
    }}
    addP(b.x,b.y,'#fff',60,8);shake(22);
    showFlash('AVALANCHE!  ALL UNITS PUSHED','#88ddff',120);
  }
  // Spice Lord: Frenzy on enrage
  if(b.frenzyOnEnrage&&b.timeEnraged&&!b.frenzyApplied){
    b.frenzyApplied=true;
    b.atkSpd=Math.round(b.atkSpd*0.5);
  }
  // Crow Gerban: Lieutenants in P3. Explicit construction so they don't
  // inherit Frost Titan's Avalanche / Freezing Wind / debuff via spread.
  if(b.lieutenantPhase&&phase>=b.lieutenantPhase&&!b.lieutenantSpawned){
    b.lieutenantSpawned=true;
    for(let i=-1;i<=1;i+=2){
      const lt={
        name:'Plague Raven',
        x:b.x+i*100,y:b.y+30,
        color:'#3a1a3a',accent:'#1a0a1a',
        maxHp:Math.round(b.maxHp*0.18),hp:Math.round(b.maxHp*0.18),
        dmg:Math.round(b.dmg*0.55),
        size:46,
        armor:5,magicRes:4,
        speed:0.34,atkSpd:66,range:50,
        points:300,
        stompCD:540,stompRadius:90,stompDmg:Math.round(b.dmg*0.6),stompStun:60,stompPhase:1,
        isEnemy:true,isBoss:true,cd:0,facing:-1,bobPhase:0,debuffs:{},mechCD:{},
        spawnFrame:frame,
        timeEnrageAt:9999999,
      };
      clampBossActor(lt,ctx,{topMargin:58,bottomMargin:82});
      enemies.push(lt);
    }
    showFlash('PLAGUE LIEUTENANTS!','#660066',120);
  }
  // Visual aura
  if(b.timeEnraged&&frame%5===0)addP(b.x+rnd(-b.size*0.6,b.size*0.6),b.y-b.size*0.4,'#ff0040',1,5);
  if(b.desperate&&frame%8===0)addP(b.x+rnd(-b.size*0.5,b.size*0.5),b.y-b.size*0.4,'#ff8c00',1,4);
  // Status icon for enrage phase
}

import { dist, rnd } from '../core/math.js';
import { GAME_TICK_HZ } from '../core/constants.js';
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

function bossAoeReadability(b) {
  if (!b) return { label: 'AOE', text: 'DANGER AOE', color: '#ff8800' };
  if (b.id === 4 || b.name === 'Sultan of Embers') return { label: 'INFERNO', text: 'INFERNO PULSE', color: '#ff6600' };
  if (b.id === 6 || b.name === 'Pharaoh Ka') return { label: 'SUN', text: 'SUN PULSE', color: '#d4a857' };
  if (b.id === 3) return { label: 'SMOKE', text: 'SMOKE BURST', color: '#aa66cc' };
  if (b.id === 14 || b.name === 'Sphinx Judicator') return { label: 'SUN', text: 'SOLAR PULSE', color: '#d8a84a' };
  if (b.id === 5 || b.name === 'Dune Worm') return { label: 'QUAKE', text: 'SAND QUAKE', color: '#a07a44' };
  return { label: 'AOE', text: 'DANGER AOE', color: b.aoeColor || '#ff8800' };
}

function bossDebuffReadability(type, b) {
  if (type === 'deathMark') return { label: 'DEATH MARK', color: '#660066', flash: 'DEATH MARK!' };
  if (type === 'mark') return { label: 'MARKED', color: '#aa00aa', flash: 'MARKED!' };
  if (type === 'amp') return { label: 'HEXED', color: '#aa66cc', flash: 'HEX!' };
  if (type === 'poison' && (b && (b.id === 4 || b.name === 'Sultan of Embers'))) return { label: 'BURNING DOT', color: '#ff6a22', flash: 'BURNING DOT!' };
  if (type === 'poison') return { label: 'POISON', color: '#55aa33', flash: 'POISON!' };
  if (type === 'slow') return { label: 'SLOWED', color: '#88ddff', flash: 'SLOW!' };
  if (type === 'freeze') return { label: 'FROZEN', color: '#88ddff', flash: 'FREEZE!' };
  return { label: type.toUpperCase(), color: '#aa00aa', flash: type.toUpperCase() + '!' };
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
        dealDamage(unit, dmg, bomb.from, 'normal', 'bomb', { sourceLabel: bomb.strafe ? 'STRAFE' : 'BOMB', sourceColor: bomb.strafe ? '#ffaa44' : '#ff8844' });
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
  const read=bossAoeReadability(b);
  groundFx.push({x:b.x,y:b.y,r:0,maxR:r,life:1,color:b.aoeColor||read.color,bossTel:true,telTimer:30,telDmg:dmg,telKnock:b.aoeKnockback,telFrom:b,telFreeze:b.aoeFreeze,telSlowAll:b.aoeSlowAll,telIsFog:b.aoeIsFog,telIsWind:b.aoeIsWind,label:read.label});
  addDmg(b.x,b.y-(b.size||32)-8,read.text,read.color,{sz:12,bold:true,outline:'#2a0800'});
  showFlash(b.aoeIsWind?'FREEZING WIND!':read.text,b.aoeColor||read.color,30);
  for(let i=0;i<16;i++)addP(b.x,b.y,b.aoeColor||'#ff6600',1,3);
}
function bossDebuff(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const t=pickBossTarget(b,'random',ctx);if(!t)return;
  if(t.debuffImmune>0||t.ccImmune){addDmg(t.x,t.y-t.size,'IMMUNE','#88ffdd');return;}
  const type=b.debuffType||'poison';
  const dur=b.debuffDur||240;
  const read=bossDebuffReadability(type,b);
  if(type==='poison'){if(!t.ccImmune){t.poisonTimer=dur;t.poisonDmgVal=b.debuffDmg||6}}
  else if(type==='slow'){if(!t.ccImmune){t.slowTimer=dur;t.slowMult=0.5;} if(b.debuffDmg)dealDamage(t,b.debuffDmg,b,'normal','slow',{ sourceLabel: read.label, sourceColor: read.color })}
  else if(type==='freeze'){if(!t.ccImmune){t.stunned=dur;} if(b.debuffDmg)dealDamage(t,b.debuffDmg,b,'magic','freeze',{ sourceLabel: read.label, sourceColor: read.color })}
  else if(type==='amp'){t.ampTimer=dur;t.ampMult=1.3}  // takes +30% damage
  else if(type==='mark'){t.markTimer=dur;t.markMult=1.5}
  else if(type==='deathMark'){t.deathMarkTimer=dur;t.deathMarkDmg=b.debuffDmg||200;t.deathMarkFrom=b}
  else if(type==='livingBomb'){t.livingBomb=true;t.livingBombTimer=300;t.livingBombDmg=b.dmg*2;t.livingBombFrom=b}
  // Visual
  for(let i=0;i<10;i++)addP(t.x,t.y,'#aa00aa',1,3);
  groundFx.push({x:t.x,y:t.y,r:0,maxR:Math.max(34,(t.size||20)*1.7),life:0.42,color:read.color,flatten:true});
  addDmg(t.x,t.y-(t.size||20)-10,read.label,read.color,{sz:12,bold:true,outline:'#1d071f'});
  showFlash(read.flash,read.color,28);
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
      dealDamage(u,dmg,b,'magic','vengeance',{ sourceLabel: 'VENGEANCE', sourceColor: '#ff4444' });
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
    dealDamage(u,dmg,b,'normal','landing',{ sourceLabel: 'LANDING', sourceColor: '#ffaa44' });
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
  arena.aerialBombs.push({x:tx,y:ty,t:90,dmg:b.bombDropDmg||80,radius:b.bombDropRadius||80,from:b,sourceLabel:'BOMB',sourceColor:'#ff8844'});
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
    arena.aerialBombs.push({x:cx,y:ty,t:30+i*18,dmg:dmg,radius:55,from:b,strafe:true,sourceLabel:'STRAFE',sourceColor:'#ffaa44'});
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
    dealDamage(u,dmg,b,'magic','storm',{ sourceLabel: 'SAND STORM', sourceColor: '#c8a05a' });
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
  dealDamage(t,_dmg,b,'magic','magicBolt',{ sourceLabel: 'BOLT', sourceColor: _col });
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
    fireProjectile(b,t,dmg,{projType:'normal',speed:7,color:'#ffd54a',sourceLabel:'BUZZ',sourceColor:'#ffd54a'});
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
  for(const u of units){if(u.hp>0&&dist(b,u)<70)dealDamage(u,b.lungeDmg||80,b,'normal','lunge',{ sourceLabel: 'LUNGE', sourceColor: '#ffaa00' })}
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
  const radius=b.meteorRadius||80,duration=55;
  groundFx.push({x:tx,y:ty,r:0,maxR:radius,life:0.95,color:'#ff4400',enemyWarn:true,warnTimer:duration,warnMax:duration,warnKind:'meteor',label:'METEOR'});
  addDmg(tx,ty-18,'METEOR TARGET','#ff8844',{sz:12,bold:true,outline:'#3a0800'});
  bombs.push({x:tx,y:ARENA_TOP-60,fromX:tx,fromY:ARENA_TOP-60,tx,ty,t:0,dur:55,
    dmg:b.meteorDmg||120,radius,attacker:b,isPlayer:false,color:'#ff4400',meteor:true,sourceLabel:'METEOR',sourceColor:'#ff4400'});
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
  for(const u of units){if(u.hp>0&&dist(b,u)<70)dealDamage(u,b.burrowDmg||100,b,'normal','burrow',{ sourceLabel: 'BURROW', sourceColor: '#8b6f3d' })}
  showFlash('BURROW!','#8b6f3d',30);
}
function bossVanish(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  b.stealth=true;b.stealthHits=0;b.firstHitDone=false;
  b.stealthMult=b.vanishMult||3.0;
  b._ambushPrimedTimer=180;
  addP(b.x,b.y,'#440044',24,5);
  addDmg(b.x,b.y-(b.size||32)-10,'AMBUSH PRIMED','#aa66cc',{sz:13,bold:true,outline:'#160420'});
  showFlash('VANISH!','#aa66cc',30);
}
function bossPoisonCloud(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const t=pickBossTarget(b,'nearest',ctx);
  const target=clampBossPoint(t?t.x:b.x,t?t.y:b.y+60,ctx,{sideMargin:46,topMargin:58,bottomMargin:70});
  const tx=target.x,ty=target.y;
  groundFx.push({x:tx,y:ty,r:0,maxR:80,life:1,color:'#88aa44',poisonCloud:true,pcTimer:300,pcDmg:8,pcFrom:b,pcLabel:'CLOUD',pcColor:'#88aa44'});
  showFlash('POISON CLOUD!','#88aa44',30);
}
function bossBlizzard(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const t=pickBossTarget(b,'random',ctx);
  const target=clampBossPoint(t?t.x:b.x,t?t.y:b.y+60,ctx,{sideMargin:46,topMargin:58,bottomMargin:70});
  const tx=target.x,ty=target.y;
  groundFx.push({x:tx,y:ty,r:0,maxR:60,life:1,color:'#88ddff',blizzard:true,blizTimer:300,blizDmg:5,blizFrom:b,blizLabel:'BLIZZARD',blizColor:'#88ddff'});
  showFlash('BLIZZARD ZONE!','#88ddff',30);
}
function bossStomp(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  groundFx.push({x:b.x,y:b.y,r:0,maxR:b.stompRadius||120,life:1,color:'#ccc',bossTel:true,telTimer:30,telDmg:b.stompDmg||90,telStun:b.stompStun||60,telFrom:b,label:'STOMP'});
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
  if(t)fireProjectile(b,t,b.cawDmg||200,{projType:'curse',speed:6,sourceLabel:'CAW',sourceColor:'#aa3333'});
  addP(b.x,b.y,'#aa3333',12,4);
  showFlash('CAW OF DOOM!','#aa3333',30);
}
function bossDive(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  const target=clampBossPoint(W/2,ARENA_BOT-100,ctx,{sideMargin:60,topMargin:70,bottomMargin:80});
  bombs.push({x:b.x,y:ARENA_TOP-60,fromX:b.x,fromY:ARENA_TOP-60,tx:target.x,ty:target.y,t:0,dur:55,
    dmg:b.diveDmg||250,radius:130,attacker:b,isPlayer:false,color:'#440044',meteor:true,sourceLabel:'DIVE',sourceColor:'#aa66cc'});
  showFlash('AERIAL DIVE!','#aa66cc',60);
}
function bossFeatherVolley(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  for(let i=0;i<(b.featherCount||8);i++){
    const ang=Math.PI/2+(i-(b.featherCount-1)/2)*0.18;
    const fakeT={x:b.x+Math.cos(ang)*400,y:b.y+Math.sin(ang)*400,hp:1};
    fireProjectile(b,fakeT,b.dmg*0.7,{projType:'curse',speed:5,sourceLabel:'FEATHER',sourceColor:'#aa66cc'});
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
    fireProjectile(b,t,Math.round(b.dmg*mult),{projType:'fire',speed:5.5,sourceLabel:'EMBER',sourceColor:'#ff8c22'});
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
    groundFx.push({x:t.x,y:t.y,r:0,maxR:radius,life:1.2,color:'#ff7a22',bossTel:true,emberDecree:true,emberDecreeCast:castId,telTimer:45,telMax:45,telDmg:b.emberDecreeDmg||120,telFrom:b,telDmgType:'magic',label:'DECREE'});
    beamFx.push({x1:b.x,y1:b.y,x2:t.x,y2:t.y,life:0.28,maxLife:0.28,color:'#ffb238',width:3,straight:false});
    addDmg(t.x,t.y-(t.size||20)-10,'CINDER!','#ffb238',{sz:13,bold:true});
  }
  if(tanks.length){
    tanks.sort((ta,tb)=>dist(b,ta)-dist(b,tb));
    const tank=tanks[0];
    groundFx.push({x:tank.x,y:tank.y,r:0,maxR:Math.max(34,radius*0.8),life:1.2,color:'#ff3a22',bossTel:true,emberDecree:true,emberDecreeCast:castId,emberDecreeTank:true,telTimer:45,telMax:45,telDmg:b.emberDecreeTankDmg||80,telFrom:b,telDmgType:'magic',label:'TANK HIT'});
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
      dealDamage(u,dmg,b,'magic','royalDive',{ sourceLabel: 'ROYAL DIVE', sourceColor: '#ff8c22' });
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
  groundFx.push({x:tx,y:ty,r:0,maxR:55,life:1,color:'#660066',stormTile:true,stormTimer:30,stormDmg:b.dmg*0.5,stormFrom:b,stormLabel:'PLAGUE',stormColor:'#660066'});
  addP(tx,ty,'#660066',8,3);
}
function bossDarkWind(b,ctx){
  const { arena, units, enemies, bombs, groundFx, beamFx, frame, width: W, arenaTop: ARENA_TOP, arenaBottom: ARENA_BOT, dealDamage, addParticle: addP, addDamageText: addDmg, showFlash, fireProjectile, spawnEnemyByIndex: spawnEnemyByIdx, tuneBossSupportMinion: arena_tuneBossSupportMinion, clampToArena, SFX, shake } = ctx;
  for(const u of units){if(u.hp>0){
    const dx=b.x-u.x,dy=b.y-u.y,d=Math.sqrt(dx*dx+dy*dy)||1;
    u.x+=(dx/d)*60;u.y+=(dy/d)*60;
    clampToArena(u);
    dealDamage(u,b.dmg*0.4,b,'magic','darkWind',{ sourceLabel: 'DARK WIND', sourceColor: '#440044' });
  }}
  showFlash('DARK WIND!','#440044',60);shake(10);
}

function stormPlayerUnits(units){
  return (units||[]).filter(u=>u&&u.hp>0&&u.isPlayer&&!u.isMinion&&!u.isGhost&&!u.untargetable&&!u.divineShield);
}
function stormBacklineUnits(units){
  return stormPlayerUnits(units).filter(u=>u.arch==='ranged'||u.arch==='caster'||u.arch==='healer'||u.prefersRanged);
}
function stormPickTargets(units,count){
  const picked=[];
  const pools=[stormBacklineUnits(units),stormPlayerUnits(units)];
  for(const pool of pools){
    for(const u of pool.sort((a,b)=>{
      const ap=(a.maxHp>0)?a.hp/a.maxHp:1,bp=(b.maxHp>0)?b.hp/b.maxHp:1;
      return ap-bp;
    })){
      if(picked.includes(u))continue;
      picked.push(u);
      if(picked.length>=count)return picked;
    }
  }
  return picked;
}
function activeStormWards(b,enemies){
  const refs=Array.isArray(b._stormWardRefs)?b._stormWardRefs:[];
  return refs.filter(w=>w&&w.hp>0&&(enemies||[]).includes(w));
}
function stormHasPriorityAdds(b,enemies){return activeStormWards(b,enemies).length>0}
function stormIsTank(u){return !!(u&&(u.arch==='tank'||u.taunt))}
function stormIsMelee(u){return !!(u&&(u.arch==='melee'||u.prefersMelee||u.arch==='paladin'))}
function stormBossOnlyWindow(b,ctx){
  return b&&b._stormCycleState==='boss'&&!stormHasPriorityAdds(b,ctx.enemies||[]);
}
function stormSkillDamageMult(b){
  return b&&b.timeEnraged?(b.stormEnrageSkillMult||1.18):1;
}
function stormScaleAt(list,index,fallback){
  const arr=Array.isArray(list)?list:[];
  if(Number.isFinite(arr[index]))return arr[index];
  if(arr.length&&Number.isFinite(arr[arr.length-1]))return arr[arr.length-1];
  return fallback;
}
function stormWardOverchargeStage(ward,b,ctx){
  const frame=ctx&&Number.isFinite(ctx.frame)?ctx.frame:0;
  const spawn=Number.isFinite(ward&&ward._stormWardSpawnFrame)?ward._stormWardSpawnFrame:(Number.isFinite(ward&&ward.spawnFrame)?ward.spawnFrame:frame);
  const age=Math.max(0,frame-spawn);
  if(age>=(b.stormWardOverchargeSecond||40*GAME_TICK_HZ))return 2;
  if(age>=(b.stormWardOverchargeFirst||20*GAME_TICK_HZ))return 1;
  return 0;
}
function stormWardOverchargeMult(ward,b){
  const stage=Math.max(0,Math.min(2,ward&&ward._stormWardOverchargeStage||0));
  return stormScaleAt(b&&b.stormWardOverchargeMults,stage,stage>=2?1.30:stage>=1?1.15:1);
}
function updateStormWardOvercharge(ward,b,ctx){
  const nextStage=stormWardOverchargeStage(ward,b,ctx);
  const prevStage=ward._stormWardOverchargeStage||0;
  if(nextStage<=prevStage)return;
  const { groundFx, addParticle:addP, addDamageText:addDmg }=ctx;
  ward._stormWardOverchargeStage=nextStage;
  const second=nextStage>=2;
  const color=second?'#ff5533':'#ffd166';
  const text=second?'OVERCHARGED':'WARD OVERCHARGE';
  groundFx.push({x:ward.x,y:ward.y,r:0,maxR:Math.max(82,ward.size*3.4),life:0.58,color,enemyWarn:true,warnTimer:24,warnMax:24,label:'OVERCHARGE'});
  addDmg(ward.x,ward.y-ward.size-16,text,color,{sz:11,bold:true,outline:second?'#3a0500':'#302000'});
  for(let i=0;i<(second?18:12);i++)addP(ward.x+rnd(-ward.size,ward.size),ward.y+rnd(-ward.size*0.6,ward.size*0.5),color,1,3);
}
function nextStormWardThreshold(b){
  const thresholds=Array.isArray(b.stormWardThresholds)&&b.stormWardThresholds.length?b.stormWardThresholds:[1,0.75,0.5,0.25];
  const done=Array.isArray(b._stormWardThresholdDone)?b._stormWardThresholdDone:[];
  for(let i=0;i<thresholds.length;i++){
    if(!done[i])return {index:i,pct:thresholds[i]};
  }
  return null;
}
function stormSilenceCooldown(b){
  const min=b.silencingDecreeCDMin||600;
  const max=b.silencingDecreeCDMax||840;
  return Math.round(rnd(min,max));
}
function initStormboundVizier(b,ctx){
  if(b._stormVizierInit)return;
  b._stormVizierInit=true;
  if(!b.mechCD)b.mechCD={};
  b._stormCycleState='boss';
  b._stormCycleTimer=0;
  b._stormChainCd=b.chainDecreeFirst||210;
  b._stormGroundingCd=b.groundingPulseFirst||300;
  b._stormCourtPulseCd=b.courtPulseFirst||120;
  b._stormSilenceCd=b.silencingDecreeFirst||stormSilenceCooldown(b);
  b._stormTankCurseCd=b.tankCurseFirst||420;
  b._stormWardRefs=[];
  b._stormWardThresholdDone=[];
  b._stormShieldActive=false;
  syncStormVizierCooldowns(b,ctx);
}
function syncStormVizierCooldowns(b,ctx){
  const cd=b.mechCD||(b.mechCD={});
  const hidden=9999;
  const active=activeStormWards(b,ctx.enemies||[]);
  cd.twinWards=active.length?0:hidden;
  cd.stormMotes=hidden;
  const bossWindow=stormBossOnlyWindow(b,ctx);
  cd.chainDecree=bossWindow?Math.max(0,Math.round(b._stormChainCd||0)):hidden;
  cd.groundingPulse=bossWindow?Math.max(0,Math.round(b._stormGroundingCd||0)):hidden;
  cd.courtPulse=bossWindow?Math.max(0,Math.round(b._stormCourtPulseCd||0)):hidden;
  cd.silencingDecree=Math.max(0,Math.round(b._stormSilenceCd||0));
  cd.tankCurse=Math.max(0,Math.round(b._stormTankCurseCd||0));
}
function tickStormBossCooldowns(b){
  if(Number.isFinite(b._stormChainCd)&&b._stormChainCd>0)b._stormChainCd--;
  if(Number.isFinite(b._stormGroundingCd)&&b._stormGroundingCd>0)b._stormGroundingCd--;
  if(Number.isFinite(b._stormCourtPulseCd)&&b._stormCourtPulseCd>0)b._stormCourtPulseCd--;
  if(Number.isFinite(b._stormSilenceCd)&&b._stormSilenceCd>0)b._stormSilenceCd--;
  if(Number.isFinite(b._stormTankCurseCd)&&b._stormTankCurseCd>0)b._stormTankCurseCd--;
}
function stormExposeVizier(b,ctx){
  const { groundFx, addParticle:addP, addDamageText:addDmg, showFlash, shake }=ctx;
  b._stormExposedTimer=Math.max(b._stormExposedTimer||0,b.stormExposeDur||240);
  b._stormExposedDamageMult=b.stormExposeMult||1.35;
  addDmg(b.x,b.y-(b.size||40)-16,'VIZIER EXPOSED','#ffd166',{sz:13,bold:true,outline:'#302000'});
  groundFx.push({x:b.x,y:b.y,r:0,maxR:Math.max(160,(b.size||42)*3.2),life:0.65,color:'#ffd166',celestialAuraFx:true});
  for(let i=0;i<28;i++)addP(b.x+rnd(-b.size,b.size),b.y+rnd(-b.size,b.size),'#ffd166',1,4);
  showFlash('JUDGMENT WINDOW!','#ffd166',55);
  shake(5);
}
function applyStormVenom(b,ctx){
  const { units, beamFx, groundFx, addParticle:addP, addDamageText:addDmg }=ctx;
  const targets=stormPlayerUnits(units);
  if(!targets.length)return false;
  const dur=b.stormVenomDur||5*GAME_TICK_HZ;
  const pct=b.stormVenomHpPct||0.012;
  const minDmg=b.stormVenomMinDmg||8;
  groundFx.push({x:b.x,y:b.y,r:0,maxR:Math.max(170,(b.size||42)*3.4),life:0.55,color:'#58d68d',celestialAuraFx:true,label:'VENOM'});
  for(const u of targets){
    u._stormVenomTimer=Math.max(u._stormVenomTimer||0,dur);
    u._stormVenomTick=GAME_TICK_HZ;
    u._stormVenomHpPct=pct;
    u._stormVenomMinDmg=minDmg;
    u._stormVenomFrom=b;
    beamFx.push({x1:b.x,y1:b.y-(b.size||40)*0.35,x2:u.x,y2:u.y-u.size*0.25,life:20,maxLife:20,color:'#58d68d',width:3.5,straight:false});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:Math.max(36,(u.size||20)*2.0),life:0.42,color:'#58d68d',enemyWarn:true,warnTimer:18,warnMax:18,label:'VENOM'});
    addDmg(u.x,u.y-(u.size||20)-12,'STORM VENOM','#58d68d',{sz:10,bold:true,outline:'#07351f'});
    addP(u.x,u.y,'#58d68d',8,3);
  }
  b._stormVenomCasts=(b._stormVenomCasts||0)+1;
  return true;
}
function resolveStormWards(b,ctx){
  const { enemies, groundFx, addParticle:addP, addDamageText:addDmg, showFlash, shake }=ctx;
  if(b._stormWardResolved)return;
  b._stormWardResolved=true;
  b._stormWardWaveActive=false;
  b._stormShieldActive=false;
  b._stormShieldWave=0;
  groundFx.push({x:b.x,y:b.y,r:0,maxR:Math.max(150,(b.size||42)*3.1),life:0.58,color:'#ffd166',celestialAuraFx:true});
  addDmg(b.x,b.y-(b.size||40)-30,'STORM SHIELD BROKEN','#ffd166',{sz:11,bold:true,outline:'#302000'});
  for(let i=0;i<24;i++)addP(b.x+rnd(-b.size,b.size),b.y+rnd(-b.size,b.size),'#ffd166',1,4);
  showFlash('STORM SHIELD BROKEN!','#ffd166',45);
  shake(4);
  stormExposeVizier(b,ctx);
  applyStormVenom(b,ctx);
  b._stormCycleState='boss';
  b._stormCourtPulseCd=b.courtPulseFirst||120;
  syncStormVizierCooldowns(b,ctx);
}
function castStormTwinWards(b,ctx,thresholdIndex=0){
  const { enemies, groundFx, addParticle:addP, addDamageText:addDmg, showFlash, shake }=ctx;
  if(stormHasPriorityAdds(b,enemies))return false;
  const wave=thresholdIndex+1;
  const hpScale=stormScaleAt(b.stormWardScales,thresholdIndex,1);
  const sizeScale=stormScaleAt(b.stormWardSizeScales,thresholdIndex,1);
  const wardHp=Math.max(1,Math.round((b.stormWardHp||3000)*hpScale));
  const wardSize=Math.round(26*sizeScale);
  const defs=[
    {kind:'iron',name:'Iron Ward',x:-96,color:'#7fc7ff',accent:'#d8f4ff',armor:16,magicRes:1,armorType:'heavy',preferredBy:'magic',label:'MAGIC',first:b.ironSurgeFirst||90,every:b.ironSurgeEvery||180},
    {kind:'mirror',name:'Mirror Ward',x:96,color:'#ffd166',accent:'#fff0a8',armor:1,magicRes:18,armorType:'warded',preferredBy:'physical',label:'PHYSICAL',first:b.mirrorCleaveFirst||72,every:b.mirrorCleaveEvery||144},
  ];
  const refs=[];
  for(const def of defs){
    const ward={
      name:def.name,
      stormWard:true,stormWardKind:def.kind,_stormBoss:b,
      priorityTarget:true,preferredBy:def.preferredBy,
      act:2,arch:'ward',
      x:b.x+def.x,y:b.y+18+rnd(-4,4),
      color:def.color,accent:def.accent,
      maxHp:wardHp,hp:wardHp,
      dmg:Math.round(18*hpScale),speed:0.08,atkSpd:96,range:84,size:wardSize,
      armor:def.armor,magicRes:def.magicRes,armorType:def.armorType,projType:'lightning',
      points:15,fixedGoldReward:15,isEnemy:true,bossSupport:true,bossSupportColor:def.color,
      cd:0,facing:-1,bobPhase:Math.random()*Math.PI*2,debuffs:{},
      spawnFrame:ctx.frame||0,entryHold:30,
      _stormWardWave:wave,_stormWardDamageScale:hpScale,_stormWardSpawnFrame:ctx.frame||0,_stormWardOverchargeStage:0,
      _stormWardCastT:def.first,_stormWardCastEvery:def.every
    };
    clampBossActor(ward,ctx,{topMargin:62,bottomMargin:82});
    ward._stormHoldX=ward.x;
    ward._stormHoldY=ward.y;
    enemies.push(ward);
    refs.push(ward);
    groundFx.push({x:ward.x,y:ward.y,r:0,maxR:62*sizeScale,life:0.7,color:def.color,enemyWarn:true,warnTimer:40,warnMax:40,label:def.label});
    addDmg(ward.x,ward.y-34,def.name.toUpperCase()+' '+wave,def.color,{sz:11,bold:true,outline:'#061433'});
    addP(ward.x,ward.y,def.color,20+wave*4,4);
  }
  b._stormWardRefs=refs;
  b._stormWardWaveActive=true;
  b._stormWardResolved=false;
  b._stormCycleState='wards';
  b._stormCycleStartedFrame=ctx.frame||0;
  b._stormShieldActive=true;
  b._stormShieldWave=wave;
  b._stormShieldDamageMult=b.stormShieldDamageMult||0.24;
  b._stormWardCasts=(b._stormWardCasts||0)+1;
  b._stormLastWardWave=wave;
  addDmg(b.x,b.y-(b.size||40)-10,'TWIN WARDS','#8bdfff',{sz:13,bold:true,outline:'#061433'});
  addDmg(b.x,b.y-(b.size||40)-26,'STORM SHIELD','#ffd166',{sz:11,bold:true,outline:'#302000'});
  groundFx.push({x:b.x,y:b.y,r:0,maxR:Math.max(150,(b.size||42)*3.0),life:0.72,color:'#ffd166',celestialAuraFx:true,label:'SHIELD'});
  showFlash('TWIN WARDS!','#8bdfff',55);
  shake(5);
  syncStormVizierCooldowns(b,ctx);
  return true;
}
function castStormIronSurge(ward,b,ctx){
  const { units, beamFx, groundFx, dealDamage, addParticle:addP, addDamageText:addDmg, shake }=ctx;
  const targets=stormPlayerUnits(units);
  if(!targets.length)return false;
  const dmg=Math.round((b.ironSurgeDmg||58)*(ward._stormWardDamageScale||1)*stormWardOverchargeMult(ward,b));
  groundFx.push({x:ward.x,y:ward.y,r:0,maxR:210,life:0.52,color:'#7fc7ff',celestialAuraFx:true,label:'IRON'});
  for(const u of targets){
    beamFx.push({x1:ward.x,y1:ward.y-ward.size*0.3,x2:u.x,y2:u.y-u.size*0.2,life:20,maxLife:20,color:'#8bdfff',width:4,straight:false});
    dealDamage(u,dmg,ward,'magic','ironSurge',{sourceLabel:'IRON SURGE',sourceColor:'#8bdfff'});
    addDmg(u.x,u.y-(u.size||20)-8,'IRON SURGE','#8bdfff',{sz:10,bold:true,outline:'#061433'});
    addP(u.x,u.y,'#8bdfff',7,3);
  }
  addDmg(ward.x,ward.y-ward.size-8,'IRON SURGE','#8bdfff',{sz:12,bold:true,outline:'#061433'});
  ward._stormIronSurges=(ward._stormIronSurges||0)+1;
  shake(3);
  return true;
}
function castStormMirrorCleave(ward,b,ctx){
  const { units, beamFx, groundFx, dealDamage, addParticle:addP, addDamageText:addDmg, shake }=ctx;
  const radius=b.mirrorCleaveRadius||138;
  const players=stormPlayerUnits(units);
  const tanks=players.filter(stormIsTank);
  const melee=players.filter(u=>stormIsMelee(u)&&!stormIsTank(u)&&Math.min(Math.hypot(u.x-ward.x,u.y-ward.y),Math.hypot(u.x-b.x,u.y-b.y))<=radius);
  const targets=[...tanks,...melee].filter((u,i,arr)=>arr.indexOf(u)===i);
  if(!targets.length)return false;
  const dmg=Math.round((b.mirrorCleaveDmg||100)*(ward._stormWardDamageScale||1)*stormWardOverchargeMult(ward,b));
  groundFx.push({x:ward.x,y:ward.y,r:0,maxR:radius,life:0.46,color:'#ffd166',enemyWarn:true,warnTimer:22,warnMax:22,label:'MIRROR'});
  for(const u of targets){
    const mult=stormIsTank(u)?1:0.84;
    beamFx.push({x1:ward.x,y1:ward.y-ward.size*0.15,x2:u.x,y2:u.y-u.size*0.05,life:18,maxLife:18,color:'#ffd166',width:5,straight:true});
    dealDamage(u,Math.round(dmg*mult),ward,'normal','mirrorCleave',{sourceLabel:'MIRROR CLEAVE',sourceColor:'#ffd166'});
    addDmg(u.x,u.y-(u.size||20)-8,'MIRROR CLEAVE','#ffd166',{sz:10,bold:true,outline:'#302000'});
    addP(u.x,u.y,'#ffd166',8,3);
  }
  addDmg(ward.x,ward.y-ward.size-8,'MIRROR CLEAVE','#ffd166',{sz:12,bold:true,outline:'#302000'});
  ward._stormMirrorCleaves=(ward._stormMirrorCleaves||0)+1;
  shake(4);
  return true;
}
function tickStormWards(b,ctx){
  const { enemies, groundFx }=ctx;
  if(b._stormCycleState!=='wards')return;
  const active=activeStormWards(b,enemies);
  if(b._stormWardWaveActive&&!b._stormWardResolved&&b._stormWardRefs&&b._stormWardRefs.length&&active.length===0){
    resolveStormWards(b,ctx);
    return;
  }
  for(const ward of active){
    updateStormWardOvercharge(ward,b,ctx);
    ward._stormWardCastT=(ward._stormWardCastT||1)-1;
    if(ward._stormWardCastT>0)continue;
    ward._stormWardCastT=ward._stormWardCastEvery||150;
    if(ward.stormWardKind==='iron')castStormIronSurge(ward,b,ctx);
    else castStormMirrorCleave(ward,b,ctx);
    if((ctx.frame||0)%2===0){
      groundFx.push({x:ward.x,y:ward.y,r:0,maxR:Math.max(72,ward.size*3.2),life:0.28,color:ward.color||'#8bdfff',celestialAuraFx:true});
    }
  }
  syncStormVizierCooldowns(b,ctx);
}
function tryStormWardThreshold(b,ctx){
  if(stormHasPriorityAdds(b,ctx.enemies||[]))return false;
  if((b._stormExposedTimer||0)>0)return false;
  const next=nextStormWardThreshold(b);
  if(!next)return false;
  const pct=(b.maxHp>0)?b.hp/b.maxHp:1;
  if(pct>next.pct+0.002)return false;
  const done=Array.isArray(b._stormWardThresholdDone)?b._stormWardThresholdDone:(b._stormWardThresholdDone=[]);
  if(castStormTwinWards(b,ctx,next.index)){
    done[next.index]=true;
    return true;
  }
  return false;
}
function castStormSilencingDecree(b,ctx){
  const { units, beamFx, groundFx, addParticle:addP, addDamageText:addDmg, showFlash, shake }=ctx;
  const healers=stormPlayerUnits(units).filter(u=>u.arch==='healer');
  if(!healers.length)return false;
  const target=healers.sort((a,bb)=>(a.hp/a.maxHp)-(bb.hp/bb.maxHp))[0];
  if(!target)return false;
  const dur=b.silencingDecreeDur||150;
  target.silenceTimer=Math.max(target.silenceTimer||0,dur);
  target._stormSilenceTimer=Math.max(target._stormSilenceTimer||0,dur);
  beamFx.push({x1:b.x,y1:b.y-(b.size||40)*0.45,x2:target.x,y2:target.y-target.size*0.35,life:22,maxLife:22,color:'#9bb8ff',width:5,straight:false});
  beamFx.push({x1:b.x,y1:b.y-(b.size||40)*0.65,x2:target.x,y2:target.y-target.size*0.7,life:14,maxLife:14,color:'#ffffff',width:2,straight:true});
  groundFx.push({x:target.x,y:target.y,r:0,maxR:58,life:0.44,color:'#9bb8ff',enemyWarn:true,warnTimer:18,warnMax:18,label:'SILENCE'});
  addDmg(target.x,target.y-(target.size||20)-10,'SILENCED','#9bb8ff',{sz:12,bold:true,outline:'#061433'});
  addDmg(b.x,b.y-(b.size||40)-12,'SILENCING DECREE','#9bb8ff',{sz:13,bold:true,outline:'#061433'});
  addP(target.x,target.y,'#9bb8ff',14,3);
  showFlash('SILENCING DECREE!','#9bb8ff',42);
  b._stormSilenceCasts=(b._stormSilenceCasts||0)+1;
  shake(4);
  return true;
}
function castStormTankCurse(b,ctx){
  const { units, beamFx, groundFx, dealDamage, addParticle:addP, addDamageText:addDmg, showFlash, shake }=ctx;
  const tanks=stormPlayerUnits(units).filter(stormIsTank);
  const target=tanks[0]||stormPlayerUnits(units)[0];
  if(!target)return false;
  const skillMult=stormSkillDamageMult(b);
  const pct=(b.tankCurseHpPct||0.01)*skillMult;
  const dmg=Math.max(8,Math.round((target.maxHp||target.hp||1)*pct));
  dealDamage(target,dmg,b,'magic','stormCurse',{sourceLabel:'STORM CURSE',sourceColor:'#7c5cff'});
  target._stormCurseTimer=Math.max(target._stormCurseTimer||0,b.tankCurseDur||240);
  target._stormCurseTick=60;
  target._stormCurseHpPct=pct;
  target._stormCurseHealCut=b.tankCurseHealCut||0.12;
  target._stormCurseFrom=b;
  beamFx.push({x1:b.x,y1:b.y-(b.size||40)*0.35,x2:target.x,y2:target.y-target.size*0.2,life:20,maxLife:20,color:'#7c5cff',width:5,straight:false});
  groundFx.push({x:target.x,y:target.y,r:0,maxR:62,life:0.5,color:'#7c5cff',enemyWarn:true,warnTimer:20,warnMax:20,label:'CURSE'});
  addDmg(target.x,target.y-(target.size||20)-10,'STORM CURSE','#9b7cff',{sz:12,bold:true,outline:'#17082d'});
  addDmg(b.x,b.y-(b.size||40)-12,'TANK CURSE','#9b7cff',{sz:13,bold:true,outline:'#17082d'});
  addP(target.x,target.y,'#9b7cff',14,3);
  showFlash('TANK CURSE!','#9b7cff',42);
  b._stormTankCurseCasts=(b._stormTankCurseCasts||0)+1;
  shake(4);
  return true;
}
function castStormChainDecree(b,ctx){
  const { units, beamFx, groundFx, dealDamage, addParticle:addP, addDamageText:addDmg, showFlash, shake }=ctx;
  const targets=stormPickTargets(units,b.chainDecreeCount||3);
  if(!targets.length)return false;
  let from={x:b.x,y:b.y-(b.size||40)*0.45};
  targets.forEach((t,i)=>{
    const mult=i===0?1:0.84;
    beamFx.push({x1:from.x,y1:from.y,x2:t.x,y2:t.y,life:18,maxLife:18,color:i%2?'#ffd166':'#8bdfff',width:4,straight:false});
    dealDamage(t,Math.round((b.chainDecreeDmg||76)*mult*stormSkillDamageMult(b)),b,'magic','chainDecree',{sourceLabel:'CHAIN',sourceColor:'#8bdfff'});
    addDmg(t.x,t.y-(t.size||20)-8,'CHAIN','#8bdfff',{sz:11,bold:true,outline:'#061433'});
    addP(t.x,t.y,'#8bdfff',8,3);
    from=t;
  });
  groundFx.push({x:b.x,y:b.y,r:0,maxR:150,life:0.45,color:'#8bdfff',flatten:true});
  b._stormChainCasts=(b._stormChainCasts||0)+1;
  addDmg(b.x,b.y-(b.size||40)-10,'CHAIN DECREE','#8bdfff',{sz:13,bold:true,outline:'#061433'});
  showFlash('CHAIN DECREE!','#8bdfff',45);
  shake(5);
  return true;
}
function castStormGroundingPulse(b,ctx){
  const { units, groundFx, dealDamage, addParticle:addP, addDamageText:addDmg, showFlash, shake }=ctx;
  const radius=b.groundingPulseRadius||128;
  const shockRadius=b.groundingStormShockRadius||Math.max(360,radius*3.2);
  const skillMult=stormSkillDamageMult(b);
  const players=stormPlayerUnits(units);
  const frontTargets=players.filter(u=>(stormIsTank(u)||stormIsMelee(u))&&Math.hypot((u.x||0)-(b.x||0),(u.y||0)-(b.y||0))<=radius);
  const shockTargets=stormBacklineUnits(units).filter(u=>Math.hypot((u.x||0)-(b.x||0),(u.y||0)-(b.y||0))<=shockRadius);
  if(!frontTargets.length&&!shockTargets.length)return false;
  groundFx.push({x:b.x,y:b.y,r:0,maxR:radius,life:0.62,color:'#8bdfff',enemyWarn:true,warnTimer:26,warnMax:26,label:'GROUNDING'});
  if(shockTargets.length)groundFx.push({x:b.x,y:b.y,r:0,maxR:shockRadius,life:0.46,color:'#58d8ff',enemyWarn:true,warnTimer:22,warnMax:22,label:'SHOCK'});
  for(const u of frontTargets){
    const tankish=stormIsTank(u);
    const melee=stormIsMelee(u)&&!tankish;
    const mult=tankish?(b.groundingPulseTankMult||1):(melee?(b.groundingPulseMeleeMult||0.72):0.85);
    dealDamage(u,Math.round((b.groundingPulseDmg||88)*mult*skillMult),b,'magic','groundingPulse',{sourceLabel:'GROUNDING',sourceColor:'#8bdfff'});
    addDmg(u.x,u.y-(u.size||20)-8,'GROUNDING','#8bdfff',{sz:11,bold:true,outline:'#061433'});
    addP(u.x,u.y,'#8bdfff',7,3);
    if(tankish||melee){
      u._groundingBrandTimer=Math.max(u._groundingBrandTimer||0,b.groundingBrandDur||240);
      u._groundingBrandHealCut=b.groundingBrandHealCut||0.10;
      addDmg(u.x,u.y-(u.size||20)-20,'GROUNDING BRAND','#9bb8ff',{sz:10,bold:true,outline:'#061433'});
    }
  }
  for(const u of shockTargets){
    const dmg=Math.round((b.groundingPulseDmg||88)*(b.groundingStormShockMult||0.42)*skillMult);
    dealDamage(u,dmg,b,'magic','stormShock',{sourceLabel:'STORM SHOCK',sourceColor:'#58d8ff'});
    addDmg(u.x,u.y-(u.size||20)-8,'STORM SHOCK','#58d8ff',{sz:11,bold:true,outline:'#061433'});
    addP(u.x,u.y,'#58d8ff',6,3);
  }
  b._stormGroundingCasts=(b._stormGroundingCasts||0)+1;
  addDmg(b.x,b.y-(b.size||40)-10,'GROUNDING PULSE','#8bdfff',{sz:13,bold:true,outline:'#061433'});
  showFlash('GROUNDING PULSE!','#8bdfff',42);
  shake(5);
  return true;
}
function castStormCourtPulse(b,ctx){
  const { units, beamFx, groundFx, dealDamage, addParticle:addP, addDamageText:addDmg, showFlash, shake }=ctx;
  const targets=stormPlayerUnits(units);
  if(!targets.length)return false;
  const radius=Math.max(220,(b.size||42)*4.5);
  const base=(b.courtPulseDmg||72)*stormSkillDamageMult(b);
  groundFx.push({x:b.x,y:b.y,r:0,maxR:radius,life:0.58,color:'#5cc8ff',enemyWarn:true,warnTimer:24,warnMax:24,label:'COURT'});
  groundFx.push({x:b.x,y:b.y,r:0,maxR:Math.max(88,(b.size||42)*1.9),life:0.5,color:'#ffd166',celestialAuraFx:true});
  for(const u of targets){
    const tankish=stormIsTank(u);
    const melee=stormIsMelee(u)&&!tankish;
    const mult=tankish?(b.courtPulseTankMult||1.25):(melee?(b.courtPulseMeleeMult||0.95):(b.courtPulseBacklineMult||0.82));
    const dmg=Math.max(1,Math.round(base*mult));
    beamFx.push({x1:b.x,y1:b.y-(b.size||40)*0.55,x2:u.x,y2:u.y-u.size*0.25,life:20,maxLife:20,color:tankish?'#ffd166':'#5cc8ff',width:tankish?5:3.5,straight:false});
    dealDamage(u,dmg,b,'magic','courtPulse',{sourceLabel:'COURT PULSE',sourceColor:'#5cc8ff'});
    addDmg(u.x,u.y-(u.size||20)-8,'COURT PULSE','#5cc8ff',{sz:11,bold:true,outline:'#061433'});
    addP(u.x,u.y,tankish?'#ffd166':'#5cc8ff',7,3);
  }
  b._stormCourtPulseCasts=(b._stormCourtPulseCasts||0)+1;
  addDmg(b.x,b.y-(b.size||40)-10,'COURT PULSE','#5cc8ff',{sz:13,bold:true,outline:'#061433'});
  showFlash('COURT PULSE!','#5cc8ff',45);
  shake(5);
  return true;
}
function updateStormboundVizier(b,ctx){
  initStormboundVizier(b,ctx);
  if(b._stormExposedTimer>0){
    b._stormExposedTimer--;
    if(b._stormExposedTimer<=0)b._stormExposedDamageMult=0;
  }
  tickStormWards(b,ctx);
  tickStormBossCooldowns(b);
  if(tryStormWardThreshold(b,ctx))return;
  if(!activeStormWards(b,ctx.enemies||[]).length&&b._stormShieldActive)b._stormShieldActive=false;
  syncStormVizierCooldowns(b,ctx);
  b._stormCastLock=Math.max(0,(b._stormCastLock||0)-1);
  if(b._stormCastLock>0)return;
  const tryAnyCast=(timerProp,nextCd,lock,fn)=>{
    if(Number.isFinite(b[timerProp])&&b[timerProp]>0)return false;
    if(!fn(b,ctx))return false;
    b[timerProp]=typeof nextCd==='function'?nextCd(b):Math.round((nextCd||600)*(b.timeEnraged?0.75:1));
    b._stormCastLock=lock;
    syncStormVizierCooldowns(b,ctx);
    return true;
  };
  if(tryAnyCast('_stormSilenceCd',stormSilenceCooldown,54,castStormSilencingDecree))return;
  if(tryAnyCast('_stormTankCurseCd',b.tankCurseCD||720,54,castStormTankCurse))return;
  if(!stormBossOnlyWindow(b,ctx))return;
  const tryBossCast=(timerProp,cdProp,lock,fn)=>{
    if(Number.isFinite(b[timerProp])&&b[timerProp]>0)return false;
    if(!fn(b,ctx))return false;
    b[timerProp]=Math.round((b[cdProp]||600)*(b.timeEnraged?0.75:1));
    b._stormCastLock=lock;
    syncStormVizierCooldowns(b,ctx);
    return true;
  };
  if(tryBossCast('_stormCourtPulseCd','courtPulseCD',60,castStormCourtPulse))return;
  if(tryBossCast('_stormGroundingCd','groundingPulseCD',54,castStormGroundingPulse))return;
  tryBossCast('_stormChainCd','chainDecreeCD',72,castStormChainDecree);
}

function astralPlayerUnits(units){
  return (units||[]).filter(u=>u&&u.hp>0&&u.isPlayer&&!u.isGhost&&!u.untargetable&&!u.divineShield);
}
function astralIsTank(u){return !!(u&&(u.arch==='tank'||u.taunt))}
function astralIsMelee(u){return !!(u&&(u.arch==='melee'||u.range<=75||u.prefersMelee))}
function astralIsBackline(u){return !!(u&&(u.arch==='ranged'||u.arch==='caster'||u.arch==='healer'||u.prefersRanged))}
function astralFrontlineUnits(units){
  return astralPlayerUnits(units).filter(u=>astralIsTank(u)||astralIsMelee(u));
}
function astralRoleDamageMult(b,u){
  if(astralIsTank(u))return b.gravityTollTankMult||0.70;
  if(astralIsMelee(u))return b.gravityTollMeleeMult||0.82;
  return 1;
}
function astralSpellDamage(b,u,amount){
  const mult=astralIsBackline(u)?(b.astralBacklineSpellMult||1):1;
  return Math.max(1,Math.round((amount||0)*mult));
}
function astralPickFrontlinePressureTarget(units,excluded){
  const skip=excluded instanceof Set?excluded:new Set(excluded||[]);
  const front=astralFrontlineUnits(units).filter(u=>!skip.has(u));
  const melee=front.filter(u=>astralIsMelee(u)&&!astralIsTank(u));
  const pool=melee.length?melee:front;
  return pool.sort((a,b)=>{
    const ap=(a.maxHp>0)?a.hp/a.maxHp:1,bp=(b.maxHp>0)?b.hp/b.maxHp:1;
    return ap-bp;
  })[0]||null;
}
function astralTargetScore(u){
  const hpPct=(u&&u.maxHp>0)?u.hp/u.maxHp:1;
  const backline=(u.arch==='ranged'||u.arch==='caster'||u.arch==='healer'||u.prefersRanged)?1:0;
  return (1-hpPct)*2+backline+(astralIsTank(u)?-1.5:0)+rnd(-0.2,0.2);
}
function astralPickTargets(units,count){
  return astralPlayerUnits(units).sort((a,b)=>astralTargetScore(b)-astralTargetScore(a)).slice(0,Math.max(1,count||1));
}
function astralLineDistance(px,py,x1,y1,x2,y2){
  const dx=x2-x1,dy=y2-y1,lenSq=dx*dx+dy*dy;
  if(lenSq<=0)return Math.hypot(px-x1,py-y1);
  const t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/lenSq));
  const x=x1+dx*t,y=y1+dy*t;
  return Math.hypot(px-x,py-y);
}
function ensureAstralStorm(b,ctx){
  const arena=ctx&&ctx.arena;
  if(!arena||!b.astralStorm)return;
  if(arena.astralStorm&&arena.astralStorm.active)return;
  arena.astralStorm={
    active:true,
    bossId:b.id,
    startedFrame:ctx.frame||0,
    arrivalTimer:120,
    nextThunderFrame:(ctx.frame||0)+60+Math.round(Math.random()*60),
    flashTimer:14,
    flashMax:14,
    forks:[]
  };
}
function applyAstralBlight(b,ctx){
  const { units, groundFx, addParticle:addP, addDamageText:addDmg, showFlash, shake }=ctx;
  let applied=0;
  for(const u of astralPlayerUnits(units)){
    u._astralBlightTimer=Math.max(u._astralBlightTimer||0,b.astralBlightDur||300);
    u._astralBlightTick=60;
    u._astralBlightHpPct=b.astralBlightHpPct||0.008;
    u._astralBlightFrom=b;
    applied++;
    addP(u.x,u.y-u.size*0.4,'#8bdfff',6,2);
  }
  if(applied>0){
    addDmg(b.x,b.y-b.size-16,'ASTRAL BLIGHT','#8bdfff',{sz:13,bold:true,outline:'#061433'});
    groundFx.push({x:b.x,y:b.y,r:0,maxR:Math.max(170,b.size*3.1),life:0.55,color:'#8bdfff',flatten:true});
    showFlash('ASTRAL BLIGHT!','#8bdfff',42);
    shake(6);
  }
}
function breakAstralWard(b,ctx){
  if(!b._astralWardActive)return;
  const { groundFx, addParticle:addP, addDamageText:addDmg, showFlash, shake }=ctx;
  b._astralWardBreaks=(b._astralWardBreaks||0)+1;
  b._astralWardActive=null;
  b._astralWardBreakLock=54;
  b.hiveShield=null;
  addDmg(b.x,b.y-b.size-14,'LANTERN WARD BROKEN','#ffd166',{sz:13,bold:true,outline:'#3a2500'});
  for(let i=0;i<30;i++)addP(b.x+rnd(-b.size,b.size),b.y+rnd(-b.size,b.size),'#ffd166',1,4);
  groundFx.push({x:b.x,y:b.y,r:0,maxR:Math.max(180,b.size*3.2),life:0.55,color:'#ffd166',celestialAuraFx:true});
  showFlash('WARD BROKEN!','#ffd166',36);
  b._astralCastLock=Math.max(b._astralCastLock||0,54);
  shake(7);
  applyAstralBlight(b,ctx);
  return true;
}
function tryAstralWard(b,ctx){
  const thresholds=Array.isArray(b.lanternWardAt)?b.lanternWardAt:[];
  if(!thresholds.length||b._astralWardBreakLock>0||b.hiveShield&&b.hiveShield.hp>0)return false;
  b._astralWardTriggered=b._astralWardTriggered||{};
  const hpPct=(b.maxHp>0)?b.hp/b.maxHp:1;
  for(const threshold of thresholds){
    const key=String(threshold);
    if(b._astralWardTriggered[key]||hpPct>threshold)continue;
    b._astralWardTriggered[key]=true;
    const shieldMax=Math.max(1,Math.round((b.maxHp||b.hp||1)*(b.lanternWardShieldPct||0.07)));
    b.hiveShield={hp:shieldMax,maxHp:shieldMax,astralWard:true,color:'#8bdfff'};
    b._astralWardActive=key;
    b._astralWardCasts=(b._astralWardCasts||0)+1;
    b._astralCastLock=Math.max(b._astralCastLock||0,72);
    ctx.addDamageText(b.x,b.y-b.size-14,'LANTERN WARD','#ffd166',{sz:13,bold:true,outline:'#3a2500'});
    ctx.showFlash('LANTERN WARD!','#ffd166',45);
    ctx.groundFx.push({x:b.x,y:b.y,r:0,maxR:Math.max(170,b.size*2.8),life:0.85,color:'#ffd166',celestialAuraFx:true});
    for(let i=0;i<24;i++)ctx.addParticle(b.x+rnd(-b.size,b.size),b.y+rnd(-b.size,b.size),'#ffd166',1,4);
    ctx.shake(5);
    return true;
  }
  return false;
}
function initAstralWarden(b,ctx){
  ensureAstralStorm(b,ctx);
  if(b._astralWardenInit)return;
  b._astralWardenInit=true;
  b._astralPending=[];
  if(!b.mechCD)b.mechCD={};
  if(b.mechCD.starfall==null)b.mechCD.starfall=b.starfallFirst||150;
  if(b.mechCD.eclipseBeam==null)b.mechCD.eclipseBeam=b.eclipseBeamFirst||330;
}
function tickAstralCooldowns(b){
  const cd=b.mechCD||(b.mechCD={});
  for(const key of ['starfall','eclipseBeam','gravityToll','lanternOrbit']){
    if(Number.isFinite(cd[key])&&cd[key]>0)cd[key]--;
  }
}
function tickAstralPending(b,ctx){
  const { units, groundFx, beamFx, dealDamage, addParticle:addP, addDamageText:addDmg, clampToArena, shake }=ctx;
  const pending=Array.isArray(b._astralPending)?b._astralPending:[];
  b._astralPending=pending;
  for(let i=pending.length-1;i>=0;i--){
    const p=pending[i];
    p.t--;
    if(p.kind==='starfall'&&p.t>0&&p.t%10===0){
      beamFx.push({x1:p.x+rnd(-12,12),y1:p.y-220,x2:p.x,y2:p.y,life:8,maxLife:8,color:'#8bdfff',width:2.5,straight:true});
      addP(p.x+rnd(-p.r,p.r),p.y-rnd(30,120),'#ffd166',1,2);
    }
    if(p.t>0)continue;
    if(p.kind==='starfall'){
      const hit=new Set();
      for(const u of astralPlayerUnits(units)){
        if(dist(p,u)<=p.r){
          dealDamage(u,astralSpellDamage(b,u,p.dmg),b,'magic','starfall',{sourceLabel:'STARFALL',sourceColor:'#8bdfff'});
          hit.add(u);
        }
      }
      if(p.target&&p.target.hp>0&&!hit.has(p.target)){
        dealDamage(p.target,astralSpellDamage(b,p.target,Math.round(p.dmg*(b.starfallTargetLockMult||0.90))),b,'magic','starfall',{sourceLabel:'STARFALL',sourceColor:'#8bdfff'});
        hit.add(p.target);
      }
      if(p.frontlineSplash){
        const splashR=b.starfallFrontlineRadius||96;
        const splashDmg=Math.round(p.dmg*(b.starfallFrontlineMult||0.55));
        for(const u of astralFrontlineUnits(units)){
          if(hit.has(u)||dist(b,u)>splashR)continue;
          dealDamage(u,splashDmg,b,'magic','starfall',{sourceLabel:'STARFALL',sourceColor:'#8bdfff'});
          hit.add(u);
        }
      }
      beamFx.push({x1:p.x,y1:p.y-260,x2:p.x,y2:p.y,life:16,maxLife:16,color:'#d8f4ff',width:7,straight:true});
      groundFx.push({x:p.x,y:p.y,r:0,maxR:p.r+18,life:0.45,color:'#8bdfff'});
      addDmg(p.x,p.y-18,'STARFALL','#8bdfff',{sz:13,bold:true,outline:'#061433'});
      for(let n=0;n<22;n++)addP(p.x+rnd(-p.r,p.r),p.y+rnd(-p.r*0.5,p.r*0.5),'#ffd166',1,4);
      shake(5);
    }else if(p.kind==='eclipseBeam'){
      const hit=new Set();
      for(const u of astralPlayerUnits(units)){
        if(astralLineDistance(u.x,u.y,p.x1,p.y1,p.x2,p.y2)<=p.width){
          dealDamage(u,astralSpellDamage(b,u,p.dmg),b,'magic','eclipseBeam',{sourceLabel:'ECLIPSE',sourceColor:'#5cc8ff'});
          hit.add(u);
        }
      }
      if(p.target&&p.target.hp>0&&!hit.has(p.target)){
        dealDamage(p.target,astralSpellDamage(b,p.target,Math.round(p.dmg*(b.eclipseTargetLockMult||0.90))),b,'magic','eclipseBeam',{sourceLabel:'ECLIPSE',sourceColor:'#5cc8ff'});
        hit.add(p.target);
      }
      const wakeR=b.eclipseFrontlineRadius||104;
      const wakeDmg=Math.round(p.dmg*(b.eclipseFrontlineMult||0.55));
      let wakeHits=0;
      for(const u of astralFrontlineUnits(units)){
        if(hit.has(u)||dist(b,u)>wakeR)continue;
        dealDamage(u,wakeDmg,b,'magic','eclipseBeam',{sourceLabel:'ECLIPSE',sourceColor:'#5cc8ff'});
        hit.add(u);wakeHits++;
      }
      if(wakeHits===0){
        const wakeTarget=astralPickFrontlinePressureTarget(units,hit);
        if(wakeTarget){
          dealDamage(wakeTarget,wakeDmg,b,'magic','eclipseBeam',{sourceLabel:'ECLIPSE',sourceColor:'#5cc8ff'});
          addDmg(wakeTarget.x,wakeTarget.y-(wakeTarget.size||20)-8,'ECLIPSE WAKE','#5cc8ff',{sz:10,bold:true,outline:'#061433'});
          hit.add(wakeTarget);wakeHits++;
        }
      }
      beamFx.push({x1:p.x1,y1:p.y1,x2:p.x2,y2:p.y2,life:22,maxLife:22,color:'#d8f4ff',width:10,straight:true});
      beamFx.push({x1:p.x1,y1:p.y1,x2:p.x2,y2:p.y2,life:16,maxLife:16,color:'#ffd166',width:4,straight:true});
      addDmg((p.x1+p.x2)/2,(p.y1+p.y2)/2-20,'ECLIPSE','#5cc8ff',{sz:14,bold:true,outline:'#061433'});
      if(wakeHits>0)addDmg(b.x,b.y+b.size*0.42,'ECLIPSE WAKE','#5cc8ff',{sz:11,bold:true,outline:'#061433'});
      shake(7);
    }else if(p.kind==='gravityToll'){
      for(const u of astralPlayerUnits(units)){
        const frontliner=astralIsTank(u)||astralIsMelee(u);
        if(frontliner){
          const dx=b.x-u.x,dy=b.y-u.y,d=Math.sqrt(dx*dx+dy*dy)||1;
          const pull=astralIsTank(u)?18:24;
          u.x+=(dx/d)*pull;u.y+=(dy/d)*pull;
          clampToArena(u);
        }
        dealDamage(u,astralSpellDamage(b,u,Math.round(p.dmg*astralRoleDamageMult(b,u))),b,'magic','gravityToll',{sourceLabel:'GRAVITY',sourceColor:'#9bb8ff'});
        if(frontliner){
          u._gravityBrandTimer=Math.max(u._gravityBrandTimer||0,b.gravityBrandDur||240);
          u._gravityBrandHealCut=b.gravityBrandHealCut||0.12;
          addDmg(u.x,u.y-(u.size||20)-10,'GRAVITY BRAND','#9bb8ff',{sz:10,bold:true,outline:'#061433'});
          const tollPct=b.gravityTollFrontlineHpPct||0;
          if(tollPct>0){
            const tollDmg=Math.max(6,Math.round((u.maxHp||u.hp||1)*tollPct));
            dealDamage(u,tollDmg,b,'magic','gravityToll',{sourceLabel:'ASTRAL TOLL',sourceColor:'#8bdfff'});
            addDmg(u.x,u.y+(u.size||20)*0.15,'ASTRAL TOLL','#8bdfff',{sz:10,bold:true,outline:'#061433'});
          }
        }
        addP(u.x,u.y,'#9bb8ff',6,3);
      }
      groundFx.push({x:b.x,y:b.y,r:0,maxR:220,life:0.75,color:'#9bb8ff',celestialAuraFx:true});
      addDmg(b.x,b.y-b.size-8,'GRAVITY TOLL','#9bb8ff',{sz:14,bold:true,outline:'#061433'});
      shake(9);
    }
    pending.splice(i,1);
  }
}
function tickAstralOrbit(b,ctx){
  const { units, beamFx, groundFx, dealDamage, addParticle:addP, addDamageText:addDmg, showFlash, shake }=ctx;
  const orbit=b._astralOrbit;
  if(!orbit)return;
  orbit.timer--;
  orbit.tick++;
  if(orbit.tick>=orbit.every&&orbit.shots>0){
    orbit.tick=0;
    orbit.shots--;
    const target=astralPickTargets(units,1)[0];
    if(target){
      const a=(orbit.shots%3)*Math.PI*2/3+(ctx.frame||0)*0.05;
      const sx=b.x+Math.cos(a)*(b.size+24),sy=b.y+Math.sin(a)*(b.size*0.55+14);
      beamFx.push({x1:sx,y1:sy,x2:target.x,y2:target.y,life:14,maxLife:14,color:'#ffd166',width:4,straight:false});
      dealDamage(target,astralSpellDamage(b,target,orbit.dmg),b,'magic','lanternOrbit',{sourceLabel:'ORBIT',sourceColor:'#ffd166'});
      addP(target.x,target.y,'#ffd166',8,3);
      addDmg(target.x,target.y-(target.size||20)-8,'ORBIT','#ffd166',{sz:11,bold:true,outline:'#3a2500'});
    }
  }
  if(orbit.timer%12===0)groundFx.push({x:b.x,y:b.y,r:0,maxR:b.size+40,life:0.25,color:'#ffd166',flatten:true});
  if(orbit.timer<=0||orbit.shots<=0){
    b._astralOrbit=null;
    showFlash('ORBIT ENDS','#ffd166',25);
    shake(4);
  }
}
function castAstralStarfall(b,ctx){
  const { units, groundFx, addDamageText:addDmg, showFlash, addParticle:addP, shake }=ctx;
  const targets=astralPickTargets(units,b.starfallCount||3);
  if(!targets.length)return false;
  const frontlineTarget=astralPickFrontlinePressureTarget(units,new Set(targets));
  if(frontlineTarget&&!targets.includes(frontlineTarget)){
    if(targets.length>=Math.max(1,b.starfallCount||3))targets[targets.length-1]=frontlineTarget;
    else targets.push(frontlineTarget);
  }
  b._astralPending=b._astralPending||[];
  for(const t of targets){
    const p=clampBossPoint(t.x+rnd(-18,18),t.y+rnd(-10,10),ctx,{sideMargin:54,topMargin:80,bottomMargin:70});
    const r=b.starfallRadius||54;
    groundFx.push({x:p.x,y:p.y,r:0,maxR:r,life:0.95,color:'#8bdfff',enemyWarn:true,warnTimer:54,warnMax:54,warnKind:'meteor',label:'STAR'});
    b._astralPending.push({kind:'starfall',t:54,x:p.x,y:p.y,r,dmg:b.starfallDmg||74,target:t,frontlineSplash:t===frontlineTarget});
  }
  addDmg(b.x,b.y-b.size-10,'STARFALL LANTERNS','#8bdfff',{sz:13,bold:true,outline:'#061433'});
  showFlash('STARFALL!','#8bdfff',45);
  for(let i=0;i<18;i++)addP(b.x+rnd(-b.size,b.size),b.y+rnd(-b.size,b.size),'#8bdfff',1,3);
  shake(5);
  return true;
}
function castAstralEclipseBeam(b,ctx){
  const { units, groundFx, beamFx, addDamageText:addDmg, showFlash, addParticle:addP, shake }=ctx;
  const target=astralPickTargets(units,1)[0];
  if(!target)return false;
  const dx=target.x-b.x,dy=target.y-b.y,d=Math.sqrt(dx*dx+dy*dy)||1;
  const x1=b.x,y1=b.y;
  const p2=clampBossPoint(b.x+(dx/d)*520,b.y+(dy/d)*520,ctx,{sideMargin:20,topMargin:36,bottomMargin:42});
  const width=b.eclipseBeamWidth||46;
  groundFx.push({x:x1,y:y1,x2:p2.x,y2:p2.y,r:0,maxR:32,life:0.95,color:'#5cc8ff',enemyWarn:true,warnTimer:54,warnMax:54,warnKind:'line',width,label:'ECLIPSE'});
  beamFx.push({x1,y1,x2:p2.x,y2:p2.y,life:14,maxLife:14,color:'#5cc8ff',width:3,straight:true});
  b._astralPending=b._astralPending||[];
  b._astralPending.push({kind:'eclipseBeam',t:54,x1,y1,x2:p2.x,y2:p2.y,width,dmg:b.eclipseBeamDmg||96,target});
  addDmg(b.x,b.y-b.size-10,'ECLIPSE BEAM','#5cc8ff',{sz:13,bold:true,outline:'#061433'});
  showFlash('ECLIPSE BEAM!','#5cc8ff',45);
  for(let i=0;i<16;i++)addP(b.x+rnd(-b.size*0.7,b.size*0.7),b.y+rnd(-b.size*0.7,b.size*0.7),'#ffd166',1,3);
  shake(5);
  return true;
}
function castAstralGravityToll(b,ctx){
  const { groundFx, addDamageText:addDmg, showFlash, addParticle:addP, shake }=ctx;
  b._astralPending=b._astralPending||[];
  groundFx.push({x:b.x,y:b.y,r:0,maxR:210,life:0.85,color:'#9bb8ff',enemyWarn:true,warnTimer:48,warnMax:48,warnKind:'gravity',label:'GRAVITY'});
  b._astralPending.push({kind:'gravityToll',t:48,dmg:b.gravityTollDmg||78});
  addDmg(b.x,b.y-b.size-10,'GRAVITY TOLL','#9bb8ff',{sz:13,bold:true,outline:'#061433'});
  showFlash('GRAVITY TOLL!','#9bb8ff',50);
  for(let i=0;i<24;i++)addP(b.x+rnd(-b.size,b.size),b.y+rnd(-b.size,b.size),'#9bb8ff',1,4);
  shake(6);
  return true;
}
function castAstralLanternOrbit(b,ctx){
  const { groundFx, addDamageText:addDmg, showFlash, addParticle:addP, shake }=ctx;
  b._astralOrbit={timer:126,tick:0,every:18,shots:b.lanternOrbitShots||5,dmg:b.lanternOrbitDmg||42};
  groundFx.push({x:b.x,y:b.y,r:0,maxR:b.size+70,life:0.75,color:'#ffd166',celestialAuraFx:true});
  addDmg(b.x,b.y-b.size-10,'LANTERN ORBIT','#ffd166',{sz:13,bold:true,outline:'#3a2500'});
  showFlash('LANTERN ORBIT!','#ffd166',55);
  for(let i=0;i<30;i++)addP(b.x+rnd(-b.size,b.size),b.y+rnd(-b.size,b.size),'#ffd166',1,4);
  shake(7);
  return true;
}
function updateAstralWarden(b,ctx){
  initAstralWarden(b,ctx);
  b._astralWardBreakLock=Math.max(0,(b._astralWardBreakLock||0)-1);
  if(b._astralWardActive&&(!b.hiveShield||b.hiveShield.hp<=0)){
    breakAstralWard(b,ctx);
    return;
  }
  tickAstralPending(b,ctx);
  tickAstralOrbit(b,ctx);
  tickAstralCooldowns(b);
  if(tryAstralWard(b,ctx))return;
  const phase=bossPhase(b);
  if(phase>=2&&!b._astralGravityUnlocked){
    b._astralGravityUnlocked=true;
    b.mechCD.gravityToll=b.gravityTollFirst||210;
  }
  if(phase>=3&&!b._astralOrbitUnlocked){
    b._astralOrbitUnlocked=true;
    b.mechCD.lanternOrbit=b.lanternOrbitFirst||240;
  }
  b._astralCastLock=Math.max(0,(b._astralCastLock||0)-1);
  if(b._astralCastLock>0)return;
  const ready=(key)=>!Number.isFinite(b.mechCD[key])||b.mechCD[key]<=0;
  const tryCast=(key,cdProp,lock,fn)=>{
    if(!ready(key))return false;
    if(!fn(b,ctx))return false;
    b.mechCD[key]=Math.round((b[cdProp]||360)*(b.timeEnraged?0.7:1));
    b._astralCastLock=lock;
    return true;
  };
  if(phase>=3&&tryCast('lanternOrbit','lanternOrbitCD',150,castAstralLanternOrbit))return;
  if(phase>=2&&tryCast('gravityToll','gravityTollCD',88,castAstralGravityToll))return;
  if(tryCast('eclipseBeam','eclipseBeamCD',88,castAstralEclipseBeam))return;
  tryCast('starfall','starfallCD',84,castAstralStarfall);
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
  if(!b.isLieutenant&&!b.disableGenericBossPressure){
    if(!b._raidAoeCD)b._raidAoeCD=0;
    b._raidAoeCD++;
    if(b._raidAoeCD>=480){
      b._raidAoeCD=0;
      const _aeDmg=b.raidAoeDmg||Math.round(b.dmg*0.30);
      for(const u of units){if(u.isPlayer&&u.hp>0){dealDamage(u,_aeDmg,b,'magic','bossPulse',{ sourceLabel: 'BOSS PULSE', sourceColor: '#ff2244' });addP(u.x,u.y,'#ff2244',4,2)}}
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
        dealDamage(_bt,_bsDmg,b,'magic','bossSlam',{ sourceLabel: 'BOSS SLAM', sourceColor: '#ff4466' });
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
  const bossSpawnFrame=Number.isFinite(b.spawnFrame)?b.spawnFrame:frame;
  const bossLifeFrames=frame-bossSpawnFrame;
  const bossEnrageAt=b.timeEnrageAt||5400;
  const bossEnrageRemaining=bossEnrageAt-bossLifeFrames;
  b._enrageRemaining=Math.max(0,bossEnrageRemaining);
  b._enrageProgress=Math.max(0,Math.min(1,bossLifeFrames/bossEnrageAt));
  if(!b.timeEnraged&&bossEnrageRemaining>0&&bossEnrageRemaining<=10*GAME_TICK_HZ&&!b._enrageWarned){
    b._enrageWarned=true;
    showFlash('ENRAGE SOON!','#ff5533',110);
    addDmg(b.x,b.y-b.size-16,'ENRAGE SOON','#ff5533',{sz:14,bold:true,outline:'#3a0500'});
    for(let i=0;i<34;i++)addP(b.x+rnd(-b.size*0.6,b.size*0.6),b.y+rnd(-b.size*0.4,b.size*0.4),'#ff5533',1,5);
    groundFx.push({x:b.x,y:b.y,r:0,maxR:b.size+64,life:0.55,color:'#ff5533'});
  }
  if(!b.timeEnraged && bossLifeFrames>bossEnrageAt){
    b.timeEnraged=true;
    b._enrageRemaining=0;
    b._enrageProgress=1;
    b.dmg=Math.round(b.dmg*1.25);
    b.atkSpd=Math.max(20,Math.round(b.atkSpd*0.7));
    if(b.stormVizier||b.id===13){
      showFlash('VIZIER ENRAGED!  STORM SKILLS EMPOWERED','#ff0040',150);
      addDmg(b.x,b.y-b.size-26,'VIZIER ENRAGED','#ff5533',{sz:15,bold:true,outline:'#3a0500'});
      groundFx.push({x:b.x,y:b.y,r:0,maxR:b.size+96,life:0.72,color:'#ff5533',enemyWarn:true,warnTimer:32,warnMax:32,label:'ENRAGE'});
      groundFx.push({x:b.x,y:b.y,r:0,maxR:b.size+132,life:0.42,color:'#ffd166',celestialAuraFx:true});
    }else{
      showFlash('BOSS ENRAGED!  +25% DMG, +30% SPEED','#ff0040',150);
    }
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
  if(b.astralWarden||b.id===10){
    updateAstralWarden(b,ctx);
    return;
  }
  if(b.stormVizier||b.id===13){
    updateStormboundVizier(b,ctx);
    return;
  }
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
      dealDamage(u,b.dmg*1.5,b,'normal','avalanche',{ sourceLabel: 'AVALANCHE', sourceColor: '#88ddff' });
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

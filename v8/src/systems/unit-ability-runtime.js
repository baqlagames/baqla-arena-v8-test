import { limitBurstLanding } from './combat-targeting.js';
import { isValidPlayerOffensiveTarget } from './player-target-validity.js';

export function createUnitAbilityRuntime(deps = {}) {
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});
  const GAME_TICK_HZ = deps.gameTickHz || 60;
  const SFX = deps.sound || {};
  const rnd = typeof deps.randomRange === 'function' ? deps.randomRange : ((min, max) => min + Math.random() * (max - min));
  const dist = typeof deps.distance === 'function' ? deps.distance : ((a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)));
  const dealDamage = typeof deps.dealDamage === 'function' ? deps.dealDamage : () => 0;
  const addP = typeof deps.emitParticle === 'function' ? deps.emitParticle : () => {};
  const addDmg = typeof deps.addDamageText === 'function' ? deps.addDamageText : () => {};
  const showFlash = typeof deps.showFlash === 'function' ? deps.showFlash : () => {};
  const arena_spawnPlayerAbilityCastVfx = typeof deps.spawnPlayerAbilityCastVfx === 'function' ? deps.spawnPlayerAbilityCastVfx : () => {};
  const arena_clampToLeash = typeof deps.clampToLeash === 'function' ? deps.clampToLeash : () => {};
  const clampToArena = typeof deps.clampToArena === 'function' ? deps.clampToArena : () => {};
  const arena_applyFelfelDeadlyPoison = typeof deps.applyFelfelDeadlyPoison === 'function' ? deps.applyFelfelDeadlyPoison : () => {};
  const findEnemyForUnit = typeof deps.findEnemyForUnit === 'function' ? deps.findEnemyForUnit : () => null;
  const arena_findJafaarDrainTarget = typeof deps.findJafaarDrainTarget === 'function' ? deps.findJafaarDrainTarget : () => null;
  const fireProjectile = typeof deps.fireProjectile === 'function' ? deps.fireProjectile : () => {};
  const arena_beaconSplash = typeof deps.beaconSplash === 'function' ? deps.beaconSplash : () => {};
  const arena_addGoldShield = typeof deps.addGoldShield === 'function' ? deps.addGoldShield : () => 0;
  const arena_applyTrackedHeal = typeof deps.applyTrackedHeal === 'function' ? deps.applyTrackedHeal : (target, amount) => {
    if (!target || target.hp <= 0 || !target.maxHp) return 0;
    const actual = Math.max(0, Math.min(target.maxHp, target.hp + Math.round(amount || 0)) - target.hp);
    target.hp += actual;
    return actual;
  };
  const arena_spawnTreant = typeof deps.spawnTreant === 'function' ? deps.spawnTreant : () => {};
  const spawnMinion = typeof deps.spawnMinion === 'function' ? deps.spawnMinion : () => {};
  const spawnPetBear = typeof deps.spawnPetBear === 'function' ? deps.spawnPetBear : () => null;
  const spawnDireBeast = typeof deps.spawnDireBeast === 'function' ? deps.spawnDireBeast : () => null;
  const spawnRepairBot = typeof deps.spawnRepairBot === 'function' ? deps.spawnRepairBot : () => null;
  const lobBomb = typeof deps.lobBomb === 'function' ? deps.lobBomb : () => {};

  let arena = {}, units = [], enemies = [], projectiles = [], bombs = [], groundFx = [], beamFx = [];
  let frame = 0, ARENA_TOP = 0, ARENA_BOT = 0, ARENA_L = 0, ARENA_R = 500, W = 500, H = 1000, screenShake = 0;

  function syncView() {
    const v = view();
    arena = v.arena || {};
    units = v.units || [];
    enemies = (v.enemies || []).filter(isValidPlayerOffensiveTarget);
    projectiles = v.projectiles || [];
    bombs = v.bombs || [];
    groundFx = v.groundFx || [];
    beamFx = v.beamFx || [];
    frame = v.frame || 0;
    ARENA_TOP = Number.isFinite(v.arenaTop) ? v.arenaTop : 0;
    ARENA_BOT = Number.isFinite(v.arenaBottom) ? v.arenaBottom : 0;
    ARENA_L = Number.isFinite(v.arenaLeft) ? v.arenaLeft : 0;
    ARENA_R = Number.isFinite(v.arenaRight) ? v.arenaRight : W;
    W = Number.isFinite(v.width) ? v.width : 500;
    H = Number.isFinite(v.height) ? v.height : 1000;
    screenShake = Number.isFinite(v.screenShake) ? v.screenShake : 0;
  }

  function flushScreenShake(before) {
    if (screenShake !== before && typeof deps.setScreenShake === 'function') deps.setScreenShake(screenShake);
  }

function tryAbility(u,abilName,cdKey,cdFrames){
  if(!u.hasL3&&(abilName===u.a3))return false;
  if(u.abilCD[cdKey]>0)return false;
  u.abilCD[cdKey]=cdFrames;
  arena_spawnPlayerAbilityCastVfx(u,abilName);
  return true;
}
function arena_jazarGuard(u,dur,dr){
  if(!u||u.unitIdx!==5||u.hp<=0)return;
  const cfg=u.bladeGuard||{};
  const guardDur=dur||cfg.dur||Math.round(3*GAME_TICK_HZ);
  const guardDr=dr||cfg.dr||0.30;
  u.bladeGuardTimer=Math.max(u.bladeGuardTimer||0,guardDur);
  u.bladeGuardDR=Math.max(u.bladeGuardDR||0,guardDr);
}
function arena_jazarSignatureSurge(u,durSec,opts){
  if(!u||u.unitIdx!==5||u.hp<=0)return;
  const o=opts||{};
  const dur=Math.round((durSec||5)*GAME_TICK_HZ);
  u._jazarSigHasteTimer=Math.max(u._jazarSigHasteTimer||0,dur);
  u._jazarSigHasteMult=o.hasteMult||0.70;
  if(o.aoe){
    const aoeDur=Math.round((o.aoeDur||durSec||4)*GAME_TICK_HZ);
    u._jazarSigAoeTimer=Math.max(u._jazarSigAoeTimer||0,aoeDur);
    u._jazarSigAoeRadius=o.aoeRadius||90;
    u._jazarSigAoeMult=o.aoeMult||0.60;
    u._jazarSigAoeColor=o.color||'#ffcc00';
  }
  const col=o.color||'#ffcc00';
  addP(u.x,u.y,col,24,5);addP(u.x,u.y,'#ffffff',8,3);
  groundFx.push({x:u.x,y:u.y,r:0,maxR:(o.aoe?u._jazarSigAoeRadius:55),life:0.45,color:col});
  addDmg(u.x,u.y-u.size-10,o.label||'BLADE HASTE!','#ffdd66',{sz:13,bold:true});
}
function arena_roninSenStacks(u){
  return Math.min(3,u.azureSenStacks||0);
}
function arena_roninDamageMult(u){
  const cfg=u.roninDragoonCombo||{};
  return 1+arena_roninSenStacks(u)*(cfg.senDmgPerStack||0.03);
}
function arena_roninThirdEye(u){
  if(!u||u.unitIdx!==13)return;
  const cfg=u.thirdEye||u.roninDragoonCombo||{};
  u.thirdEyeTimer=Math.max(u.thirdEyeTimer||0,cfg.dur||cfg.thirdEyeDur||Math.round(1.5*GAME_TICK_HZ));
  u.thirdEyeDR=Math.max(u.thirdEyeDR||0,cfg.dr||cfg.thirdEyeDr||0.20);
}
function arena_findRoninPriorityTarget(u,maxRange){
  let best=null,bestScore=Infinity;
  for(const e of enemies){
    if(!isValidPlayerOffensiveTarget(e))continue;
    const d=dist(u,e);
    if(d>maxRange)continue;
    let score=d;
    if(e.isBoss)score-=120;
    if(e.elite||e.isElite)score-=70;
    if(e.range>80)score-=20;
    if(score<bestScore){bestScore=score;best=e}
  }
  return best;
}
function arena_findBestEnemyClusterPoint(origin,maxRange,clusterRadius){
  let best=null,bestScore=-Infinity;
  const maxR=maxRange==null?99999:maxRange;
  const cr=clusterRadius||90;
  for(const e of enemies){
    if(!isValidPlayerOffensiveTarget(e))continue;
    const od=origin?dist(origin,e):0;
    if(od>maxR)continue;
    let count=0,elite=0,hpScore=0;
    for(const f of enemies){
      if(!isValidPlayerOffensiveTarget(f))continue;
      if(dist(e,f)>cr)continue;
      count++;
      if(f.isBoss||f.elite)elite++;
      hpScore+=Math.min(f.hp||0,600);
    }
    const score=count*100+elite*80+hpScore*0.03-od*0.02;
    if(score>bestScore){bestScore=score;best=e}
  }
  return best?{x:best.x,y:best.y,target:best,score:bestScore}:null;
}
function arena_kingHolySwordConfig(u){
  return u&&u.unitIdx===3&&!u.branch?(u.holySwordSaintCombo||null):null;
}
function arena_kingSealStacks(u,target){
  if(!u||!target||target.judgmentSealSource!==u||!(target.judgmentSealTimer>0))return 0;
  return Math.min(3,target.judgmentSealStacks||0);
}
function arena_applyKingJudgmentSeal(u,target){
  const cfg=arena_kingHolySwordConfig(u);
  if(!cfg||!u.judgmentSeals||!target||target.hp<=0)return 0;
  if(target.judgmentSealSource!==u||!(target.judgmentSealTimer>0))target.judgmentSealStacks=0;
  target.judgmentSealSource=u;
  target.judgmentSealStacks=Math.min(cfg.sealMax||3,(target.judgmentSealStacks||0)+1);
  target.judgmentSealTimer=cfg.sealDur||7*GAME_TICK_HZ;
  addP(target.x,target.y,'#ffd966',9,3);
  addP(target.x,target.y,'#dff5ff',4,2);
  return target.judgmentSealStacks;
}
function arena_kingGrantCrystalGuard(u,dr,dur){
  if(!u||u.unitIdx!==3||u.branch)return;
  u.crystalGuardDR=Math.max(u.crystalGuardDR||0,dr||0.08);
  u.crystalGuardTimer=Math.max(u.crystalGuardTimer||0,dur||3*GAME_TICK_HZ);
}
function arena_findKingHolySwordTarget(u,maxRange){
  let best=null,bestScore=-Infinity;
  for(const e of enemies){
    if(!isValidPlayerOffensiveTarget(e))continue;
    const d=dist(u,e);
    if(d>maxRange)continue;
    let count=0,hpScore=0;
    for(const f of enemies){
      if(!isValidPlayerOffensiveTarget(f)||dist(e,f)>90)continue;
      count++;
      hpScore+=Math.min(f.hp||0,900);
    }
    let score=count*80+hpScore*0.02-d*0.03;
    if(e.isBoss)score+=160;
    if(e.elite||e.isElite)score+=90;
    if(score>bestScore){bestScore=score;best=e}
  }
  return best;
}
const ABILITIES={
  // ----- TANKS -----
  cleaveSlam(u){ // Malfof L3 (legacy Ã¢â‚¬â€ kept for compat)
    if(!tryAbility(u,'cleaveSlam','cleaveSlam',960))return;
    addP(u.x,u.y,'#88ff88',16,4);
    for(const e of enemies){if(e.hp>0&&dist(u,e)<70){const dx=e.x-u.x;if(dx*u.facing>=-15)dealDamage(e,u.dmg*1.8,u,'normal')}}
    showFlash('CLEAVE!','#88ff88',30);
  },
  shieldSlam(u){ // Malfof L3 Ã¢â‚¬â€ single-target heavy hit + stun + armor break
    if(!tryAbility(u,'shieldSlam','shieldSlam',720))return;
    const t=u.target;
    if(!t||t.hp<=0)return;
    dealDamage(t,Math.round(u.dmg*2.5),u,'normal');
    if(!t.isBoss)t.stunned=Math.max(t.stunned||0,120);
    t.armorBreak=(t.armorBreak||0)+2;t.armorBreakTimer=600;
    addP(t.x,t.y,'#8899cc',12,4);addP(t.x,t.y,'#ffffff',6,3);
    addP(u.x,u.y,'#aabbdd',8,3);
    beamFx.push({x1:u.x,y1:u.y,x2:t.x,y2:t.y,color:'#aabbdd',width:5,life:0.2,maxLife:0.2,straight:true});
    groundFx.push({x:t.x,y:t.y,r:0,maxR:55,life:0.5,color:'#6677aa'});
    groundFx.push({x:t.x,y:t.y,r:0,maxR:30,life:0.3,color:'#ffffff44'});
    addDmg(t.x,t.y-t.size,'SHIELD SLAM!','#aabbee',{sz:15,bold:true});
    screenShake=Math.max(screenShake,6);
    SFX.shieldBash();
  },
  avatar(u){ // Malfof L5 Ã¢â‚¬â€ grow big, +50% HP/DMG, CC immune for 8s
    if(!tryAbility(u,'avatar','avatar',4200))return;
    u.avatarTimer=10*GAME_TICK_HZ;
    u.avatarOrigSize=u.size;
    u.avatarOrigDmg=u.dmg;
    u.avatarOrigMaxHp=u.maxHp;
    u.size=Math.round(u.size*1.2);
    u.dmg=Math.round(u.dmg*1.5);
    u.maxHp=Math.round(u.maxHp*1.5);
    u.hp=Math.min(u.hp+Math.round(u.avatarOrigMaxHp*0.5),u.maxHp);
    u.ccImmune=true;
    for(let i=0;i<20;i++){const a=Math.PI*2*i/20;addP(u.x+Math.cos(a)*30,u.y+Math.sin(a)*30,'#44ff44',2,4)}
    addP(u.x,u.y,'#ffffff',12,3);addP(u.x,u.y,'#88ff88',8,5);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:90,life:1.0,color:'#33cc33'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:50,life:0.6,color:'#ffffff44'});
    addDmg(u.x,u.y-u.size,'AVATAR!','#44ff44',{sz:18,bold:true});
    showFlash('AVATAR','#44ff44',60);
    screenShake=Math.max(screenShake,12);
    SFX.buff();SFX.taunt();
  },
  lastStand(u){}, // passive triggered in dealDamage
  deathGripCleave(u){}, // legacy stub
  antiMagicShell(u){}, // legacy stub
  heartStrike(u){ // Taoon L3 Ã¢â‚¬â€ cleave 3 enemies + heal 15% of damage dealt
    if(!tryAbility(u,'heartStrike','heartStrike',720))return;
    const targets=[];
    for(const e of enemies){if(e.hp>0&&dist(u,e)<80)targets.push(e)}
    targets.sort((a,b)=>dist(u,a)-dist(u,b));
    let totalDmg=0;
    for(let i=0;i<Math.min(3,targets.length);i++){
      const d=Math.round(u.dmg*2.0);
      dealDamage(targets[i],d,u,'normal');totalDmg+=d;
      addP(targets[i].x,targets[i].y,'#cc2244',6,3);
      beamFx.push({x1:u.x,y1:u.y,x2:targets[i].x,y2:targets[i].y,color:'#cc2244',width:3,life:0.2,maxLife:0.2,straight:true});
    }
    if(totalDmg>0){
      const heal=Math.round(totalDmg*0.15);
      arena_applyTrackedHeal(u,heal,u,false);
      addP(u.x,u.y,'#ff3355',10,4);addP(u.x,u.y,'#881122',6,3);
      groundFx.push({x:u.x,y:u.y,r:0,maxR:80,life:0.35,color:'#881122'});
      addDmg(u.x,u.y-u.size,'HEART STRIKE!','#ff3355',{sz:14,bold:true});
      SFX.heavySlash();
    }
  },
  frostwyrmsFury(u){ // Taoon L5 Ã¢â‚¬â€ frost dragon breath line, freeze 3s
    if(!tryAbility(u,'frostwyrmsFury','frostwyrmsFury',5400))return;
    const dir=u.facing||1;
    const lineLen=280,lineW=60;
    let hit=0;
    for(const e of enemies){
      if(e.hp<=0)continue;
      const dx=e.x-u.x,dy=e.y-u.y;
      if(dx*dir<0)continue;
      if(Math.abs(dx)>lineLen)continue;
      if(Math.abs(dy)>lineW)continue;
      dealDamage(e,Math.round(u.dmg*3.5),u,'magic');
      e.stunned=Math.max(e.stunned||0,e.isBoss?90:360);
      e.slowTimer=Math.max(e.slowTimer||0,480);e.slowMult=0.3;
      addP(e.x,e.y,'#88ddff',14,4);hit++;
    }
    if(hit>0||enemies.length>0){
      for(let i=0;i<18;i++){
        const px=u.x+dir*(20+Math.random()*lineLen);
        const py=u.y+(Math.random()-0.5)*lineW;
        const iceCol=['#aaeeff','#ccf0ff','#88ddff','#ddeeff','#ffffff'][Math.floor(Math.random()*5)];
        addP(px,py,iceCol,3,2+Math.random()*4);
      }
      for(let i=0;i<6;i++){
        const sx=u.x+dir*(40+Math.random()*200);
        const sy=u.y+(Math.random()-0.5)*lineW*0.6;
        groundFx.push({x:sx,y:sy,r:0,maxR:12+Math.random()*18,life:0.6+Math.random()*0.4,color:'#bbddff',iceShard:true});
      }
      beamFx.push({x1:u.x,y1:u.y,x2:u.x+dir*lineLen,y2:u.y,color:'#88ddff',width:8,life:0.6,maxLife:0.6,straight:true});
      beamFx.push({x1:u.x,y1:u.y-15,x2:u.x+dir*lineLen*0.8,y2:u.y-20,color:'#aaeeff',width:3,life:0.5,maxLife:0.5,straight:false});
      beamFx.push({x1:u.x,y1:u.y+15,x2:u.x+dir*lineLen*0.8,y2:u.y+20,color:'#aaeeff',width:3,life:0.5,maxLife:0.5,straight:false});
      groundFx.push({x:u.x+dir*140,y:u.y,r:0,maxR:lineLen/2,life:0.8,color:'#66bbdd'});
      addDmg(u.x+dir*60,u.y-u.size-4,"FROSTWYRM'S FURY!",'#88ddff',{sz:16,bold:true});
      showFlash("FROSTWYRM'S FURY!",'#88ddff',60);
      screenShake=Math.max(screenShake,10);
      SFX.frostBolt();
    }
  },
  incapacitatingRoar(u){ // Batata L3
    if(!tryAbility(u,'incapacitatingRoar','roar',16*GAME_TICK_HZ))return;
    let _hit=0;
    for(const e of enemies){
      if(e.hp>0&&dist(u,e)<100){
        e.stunned=Math.max(e.stunned||0,2*GAME_TICK_HZ);
        e.roarWeaken=true;e.roarWeakenTimer=4*GAME_TICK_HZ;
        addP(e.x,e.y,'#ffaa33',10,4);_hit++;
      }
    }
    if(_hit){
      for(let i=0;i<3;i++)groundFx.push({x:u.x,y:u.y,r:0,maxR:60+i*30,life:0.5+i*0.15,roarWave:true,color:'#ffaa33'});
      screenShake=Math.max(screenShake,10);
      SFX.roar();
    }
    if(u.earthwardenShield!==undefined){
      const _shieldAmt=Math.round(_hit*u.dmg*0.20);
      u.earthwardenShield=(u.earthwardenShield||0)+_shieldAmt;
      u.earthwardenTimer=5*GAME_TICK_HZ;
      if(_shieldAmt>0){addDmg(u.x,u.y-u.size*0.5,'+'+_shieldAmt+' SHIELD','#88ff44');addP(u.x,u.y,'#88ff44',10,3)}
    }
    addP(u.x,u.y,'#ffaa33',32,6);addP(u.x,u.y,'#ff6600',16,4);
    addDmg(u.x,u.y-u.size*1.5,'ROAR!!!','#ffaa33');
    showFlash('ROAR!','#ffaa33',40);
  },
  berserkDruid(u){ // Batata L5
    if(!tryAbility(u,'berserkDruid','berserk',35*GAME_TICK_HZ))return;
    u._berserkOrigAtkSpd=u._berserkOrigAtkSpd||u.atkSpd;
    u._berserkOrigDmg=u._berserkOrigDmg||u.dmg;
    u.atkSpd=Math.max(8,Math.round(u.atkSpd*0.5));
    u.dmg=Math.round(u.dmg*1.3);
    u.berserkActive=true;u.berserkTimer=8*GAME_TICK_HZ;
    u.berserkCleave360=true;
    addP(u.x,u.y,'#8fbc3a',32,6);
    showFlash('BERSERK!','#8fbc3a',40);
  },
  natureStomp(u){ // Batata Halwa A3 Ã¢â‚¬â€ ground slam roots + damages nearby enemies
    if(!tryAbility(u,'natureStomp','natureStomp',14*GAME_TICK_HZ))return;
    let _hit=0;
    for(const e of enemies){
      if(e.hp>0&&!e.isBoss&&dist(u,e)<110){
        dealDamage(e,Math.round(u.dmg*1.2),u,'normal');
        e.rooted=true;e.rootTimer=2.5*GAME_TICK_HZ;e.rootX=e.x;e.rootY=e.y;
        groundFx.push({x:e.x,y:e.y,r:0,maxR:e.size*1.5,life:0.8,rootVine:true,rootTarget:e,rootDur:2.5*GAME_TICK_HZ});
        addP(e.x,e.y,'#33aa33',12,4);_hit++;
      }
    }
    if(_hit){
      for(let i=0;i<3;i++)groundFx.push({x:u.x,y:u.y,r:0,maxR:70+i*25,life:0.5+i*0.12,roarWave:true,color:'#33aa33'});
      screenShake=Math.max(screenShake,8);
    }
    addP(u.x,u.y,'#33aa33',28,5);addDmg(u.x,u.y-u.size,'NATURE STOMP!','#33cc33');
    showFlash("NATURE'S STOMP",'#33cc33',35);
  },
  incarnationTree(u){ // Batata Halwa A5 Ã¢â‚¬â€ become Tree of Life: AoE heal aura + thorns
    if(!tryAbility(u,'incarnationTree','incarnTree',40*GAME_TICK_HZ))return;
    u.incarnTreeActive=true;u.incarnTreeTimer=10*GAME_TICK_HZ;
    u._preTreeMaxHp=u.maxHp;
    u.maxHp=Math.round(u.maxHp*1.4);u.hp=Math.min(u.maxHp,u.hp+Math.round(u._preTreeMaxHp*0.4));
    u._preTreeArmor=u.armor;u.armor=Math.round(u.armor*1.5);
    addP(u.x,u.y,'#33cc33',48,8);groundFx.push({x:u.x,y:u.y,r:0,maxR:160,life:1.0,color:'#33aa33'});
    addDmg(u.x,u.y-u.size-4,'TREE OF LIFE!','#33cc33');showFlash('INCARNATION: TREE OF LIFE!','#33cc33',75);screenShake=Math.max(screenShake,12);
  },
  // ----- ZAYT (Retribution Paladin) -----
  crushJudgment(u){ // King Holy Sword Saint A3 - priority dash strike
    const cfg=arena_kingHolySwordConfig(u);
    if(!cfg)return;
    const target=arena_findKingHolySwordTarget(u,cfg.crushRange||210);
    if(!target)return;
    if(!tryAbility(u,'crushJudgment','crushJudgment',12*GAME_TICK_HZ))return;
    const fromX=u.x,fromY=u.y;
    const angle=Math.atan2(target.y-u.y,target.x-u.x);
    const land=limitBurstLanding(u,target.x-Math.cos(angle)*18,target.y-Math.sin(angle)*18,160);
    u.x=land.x;u.y=land.y;
    arena_clampToLeash(u);
    const sealStacks=arena_kingSealStacks(u,target);
    const damage=Math.round(u.dmg*(cfg.crushMult||2.10)*(1+sealStacks*(cfg.crushPerSealBonus||0.10)));
    dealDamage(target,damage,u,'magic');
    arena_applyKingJudgmentSeal(u,target);
    if(!target.isBoss)target.stunned=Math.max(target.stunned||0,cfg.crushStunDur||GAME_TICK_HZ);
    beamFx.push({x1:fromX,y1:fromY,x2:u.x,y2:u.y,color:'#fff2a8cc',width:5,life:0.24,maxLife:0.24,straight:true});
    beamFx.push({x1:target.x,y1:target.y-50,x2:target.x,y2:target.y+10,color:'#ffd966cc',width:6,life:0.25,maxLife:0.25,straight:true});
    groundFx.push({x:target.x,y:target.y,r:0,maxR:56,life:0.45,swipeSlam:true,color:'#ffd966'});
    groundFx.push({x:target.x,y:target.y,r:0,maxR:78,life:0.32,color:'#dff5ff'});
    addP(target.x,target.y,'#ffd966',24,5);
    addP(target.x,target.y,'#ffffff',10,3);
    addDmg(target.x,target.y-target.size-8,'CRUSH JUDGMENT','#fff2a8',{sz:13,bold:true,outline:'#5a4a10'});
    screenShake=Math.max(screenShake,6);
    if(SFX.heavySlash)SFX.heavySlash();
  },
  hallowedBladefall(u){ // King Holy Sword Saint A5 - leap into boss/elite/cluster
    const cfg=arena_kingHolySwordConfig(u);
    if(!cfg)return;
    let best=arena_findBestEnemyClusterPoint(u,cfg.bladefallRange||260,cfg.bladefallRadius||90);
    const priority=arena_findKingHolySwordTarget(u,cfg.bladefallRange||260);
    if(priority&&(priority.isBoss||priority.elite||priority.isElite))best={x:priority.x,y:priority.y,target:priority};
    if(!best||!best.target)return;
    if(!tryAbility(u,'hallowedBladefall','hallowedBladefall',24*GAME_TICK_HZ))return;
    const fromX=u.x,fromY=u.y;
    const angle=Math.atan2(best.y-u.y,best.x-u.x);
    const land=limitBurstLanding(u,best.x-Math.cos(angle)*14,best.y-Math.sin(angle)*14,220);
    u.x=land.x;u.y=land.y;
    arena_clampToLeash(u);
    const radius=cfg.bladefallRadius||90;
    const main=best.target;
    const mainDamage=Math.round(u.dmg*(cfg.bladefallMainMult||3.0));
    const splashDamage=Math.round(u.dmg*(cfg.bladefallSplashMult||1.35));
    dealDamage(main,mainDamage,u,'magic');
    arena_applyKingJudgmentSeal(u,main);
    let splashHits=0;
    for(const e of enemies){
      if(e===main||!isValidPlayerOffensiveTarget(e)||dist({x:best.x,y:best.y},e)>radius)continue;
      dealDamage(e,splashDamage,u,'magic');
      addP(e.x,e.y,'#ffd966',12,4);
      addP(e.x,e.y,'#dff5ff',6,3);
      splashHits++;
    }
    arena_kingGrantCrystalGuard(u,cfg.bladefallGuardDr||0.12,cfg.bladefallGuardDur||Math.round(2.5*GAME_TICK_HZ));
    beamFx.push({x1:fromX,y1:fromY-55,x2:u.x,y2:u.y,color:'#fff2a8cc',width:7,life:0.30,maxLife:0.30,straight:true});
    for(let i=0;i<5;i++){
      const ox=(i-2)*18;
      beamFx.push({x1:best.x+ox,y1:best.y-95,x2:best.x+ox*0.35,y2:best.y+8,color:i%2?'#dff5ffcc':'#ffd966cc',width:3,life:0.34,maxLife:0.34,straight:true});
    }
    groundFx.push({x:best.x,y:best.y,r:0,maxR:radius,life:0.70,color:'#ffd966',warningRing:true});
    groundFx.push({x:best.x,y:best.y,r:0,maxR:radius+38,life:0.44,color:'#dff5ff'});
    addP(best.x,best.y,'#ffd966',42,7);
    addP(best.x,best.y,'#ffffff',18,4);
    addDmg(best.x,best.y-(main.size||24)-10,'HALLOWED BLADEFALL','#fff2a8',{sz:14,bold:true,outline:'#5a4a10'});
    if(splashHits)addDmg(best.x,best.y+20,'SPLASH x'+splashHits,'#fff2a8',{sz:11,bold:true});
    showFlash('HALLOWED BLADEFALL','#fff2a8',45);
    screenShake=Math.max(screenShake,9);
    if(SFX.heavySlash)SFX.heavySlash();
  },
  divineJudgment(u){ // Zayt base L3 Ã¢â‚¬â€ holy burst on target + nearby enemies take splash
    if(!tryAbility(u,'divineJudgment','divineJudgment',8*GAME_TICK_HZ))return;
    const t=u.target;
    if(!t||t.hp<=0)return;
    const _mainDmg=Math.round(u.dmg*3.0);
    dealDamage(t,_mainDmg,u,'magic');
    addP(t.x,t.y,'#ffd700',20,5);addP(t.x,t.y,'#ffffff',10,3);
    groundFx.push({x:t.x,y:t.y,r:0,maxR:80,life:0.45,color:'#ffd700'});
    let _splashHit=0;
    for(const e of enemies){if(e!==t&&e.hp>0&&dist(t,e)<70){
      dealDamage(e,Math.round(_mainDmg*0.4),u,'magic');addP(e.x,e.y,'#ffe066',6,3);_splashHit++;
    }}
    addDmg(t.x,t.y-t.size,'JUDGMENT!','#ffd700');
    showFlash('DIVINE JUDGMENT','#ffd700',35);screenShake=Math.max(screenShake,6);
  },
  bladeOfWrath(u){ // Zayt Prot L3 Ã¢â‚¬â€ leap + 2.5Ãƒâ€” holy + 2s stun + 4s dmg buff
    if(!tryAbility(u,'bladeOfWrath','bladeOfWrath',12*GAME_TICK_HZ))return;
    let target=null,bestD=0;
    for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d<100&&d>bestD){bestD=d;target=e}}}
    if(!target){for(const e of enemies){if(e.hp>0&&dist(u,e)<100){target=e;break}}}
    if(!target)return;
    const _fromX=u.x,_fromY=u.y;
    u.x=target.x-(u.facing||1)*30;u.y=target.y;
    arena_clampToLeash(u);
    const _dmg=Math.round(u.dmg*2.5);
    dealDamage(target,_dmg,u,'magic');
    if(!target.isBoss)target.stunned=Math.max(target.stunned||0,2*GAME_TICK_HZ);
    u.bladeOfWrathBuff=4*GAME_TICK_HZ;
    u._bowOrigDmg=u._bowOrigDmg||u.dmg;
    u.dmg=Math.round(u.dmg*1.20);
    for(let i=0;i<8;i++){const f=i/8;addP(_fromX+(u.x-_fromX)*f,_fromY+(u.y-_fromY)*f,'#ffd700',2,4)}
    addP(_fromX,_fromY,'#ffe066',12,3);
    addP(target.x,target.y,'#ffd700',24,5);addP(u.x,u.y,'#ffe066',16,4);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:70,life:0.5,color:'#ffd700'});
    groundFx.push({x:target.x,y:target.y,r:0,maxR:50,life:0.3,color:'#ffe066'});
    addDmg(target.x,target.y-target.size,'BLADE OF WRATH!','#ffd700');
    showFlash('BLADE OF WRATH','#ffd700',40);
    screenShake=Math.max(screenShake,8);
  },
  wakeOfAshes(u){ // Zayt L5 Ã¢â‚¬â€ frontal cone 200px: 3Ãƒâ€” holy + 3s stun
    if(!tryAbility(u,'wakeOfAshes','wakeOfAshes',22*GAME_TICK_HZ))return;
    const dir=u.facing||1;
    const coneLen=200,coneHalf=70;
    let _hit=0;
    for(const e of enemies){
      if(e.hp<=0)continue;
      const dx=e.x-u.x,dy=e.y-u.y;
      if(dx*dir<0)continue;
      if(Math.abs(dx)>coneLen)continue;
      if(Math.abs(dy)>coneHalf)continue;
      dealDamage(e,Math.round(u.dmg*3.0),u,'magic');
      e.stunned=Math.max(e.stunned||0,e.isBoss?Math.round(1.5*GAME_TICK_HZ):3*GAME_TICK_HZ);
      addP(e.x,e.y,'#ffd700',14,4);_hit++;
    }
    if(_hit>0||enemies.length>0){
      for(let i=0;i<10;i++){
        const px=u.x+dir*(20+Math.random()*coneLen);
        const py=u.y+(Math.random()-0.5)*coneHalf*2;
        addP(px,py,'#ffe066',4+Math.random()*6,3);
      }
      groundFx.push({x:u.x+dir*100,y:u.y,r:0,maxR:coneLen/2,life:0.7,color:'#ffd700'});
      addDmg(u.x+dir*60,u.y-u.size-4,'WAKE OF ASHES!','#ffd700');
      showFlash('WAKE OF ASHES','#ffd700',60);
      screenShake=Math.max(screenShake,10);
    }
  },
  finalReckoning(u){ // Zayt Retri a5 Ã¢â‚¬â€ mark all enemies in range, +20% dmg taken, detonates after 6s
    if(!tryAbility(u,'finalReckoning','finalReckoning',22*GAME_TICK_HZ))return;
    const _frRange=100;
    let _marked=0;
    const _burstDmg=Math.round(u.dmg*3.0);
    for(const e of enemies){
      if(e.hp<=0||dist(u,e)>_frRange)continue;
      dealDamage(e,_burstDmg,u,'magic');
      e._finalReckoning=6*GAME_TICK_HZ;
      addP(e.x,e.y,'#ffd700',16,4);addP(e.x,e.y-e.size,'#ffffff',8,3);
      _marked++;
    }
    if(_marked>0){
      groundFx.push({x:u.x,y:u.y,r:0,maxR:_frRange,life:0.6,color:'#ffd700'});
      groundFx.push({x:u.x,y:u.y,r:0,maxR:_frRange*0.6,life:0.35,color:'#ffffff'});
      for(let i=0;i<20;i++){const a=Math.PI*2*i/20;addP(u.x+Math.cos(a)*_frRange*0.8,u.y+Math.sin(a)*_frRange*0.8,'#ffe066',2,4)}
      addDmg(u.x,u.y-u.size-6,'FINAL RECKONING!','#ffd700');
      showFlash('FINAL RECKONING','#ffd700',50);
      screenShake=Math.max(screenShake,8);
    }
  },
  holyPrism(u){ // Zayt Mubarak (Holy) a3 Ã¢â‚¬â€ ranged holy damage + heal nearest ally
    if(!tryAbility(u,'holyPrism','holyPrism',10*GAME_TICK_HZ))return;
    let target=null,bestD=Infinity;
    for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d<220&&d<bestD){bestD=d;target=e}}}
    if(!target)return;
    const _dmg=Math.round(u.dmg*2.5);
    dealDamage(target,_dmg,u,'magic');
    addP(target.x,target.y,'#ffe066',16,5);
    groundFx.push({x:target.x,y:target.y,r:0,maxR:50,life:0.3,color:'#ffe066'});
    // Heal 5 lowest HP allies (splash heal)
    const _hpAllies=[];
    for(const a of units){
      if(a.hp<=0||!a.isPlayer||a.isGhost||a.hp>=a.maxHp)continue;
      _hpAllies.push(a);
    }
    _hpAllies.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp));
    const _hpCount=Math.min(5,_hpAllies.length);
    for(let pi=0;pi<_hpCount;pi++){
      const healTarget=_hpAllies[pi];
      let _heal=Math.round(healTarget.maxHp*0.10);
      if(u.infusionOfLightTimer>0)_heal=Math.round(_heal*1.30);
      _heal=Math.min(80,_heal);
      const _actualHeal=arena_applyTrackedHeal(healTarget,_heal,u,true);
      if(_actualHeal>0)arena_beaconSplash(u,healTarget,_actualHeal);
    }
    // Prismatic rainbow beam VFX
    const _prismColors=['#ff4466','#ffaa00','#ffee44','#44ff66','#44aaff','#aa66ff'];
    for(let _pi=0;_pi<_prismColors.length;_pi++){
      beamFx.push({x1:u.x,y1:u.y+_pi*2-5,x2:target.x,y2:target.y+_pi*2-5,life:25,maxLife:25,color:_prismColors[_pi],width:1.5,straight:true});
    }
    projectiles.push({x:u.x,y:u.y,target,tx:target.x,ty:target.y,speed:3,projType:'pomOrb',visualOnly:true,color:'#ffaaff',_arrN:12,_arrSz:3,isPlayer:true,dmg:0});
    for(let _pi=0;_pi<6;_pi++)addP(target.x+rnd(-10,10),target.y+rnd(-8,4),_prismColors[_pi],1,3);
    addDmg(target.x,target.y-target.size,'HOLY PRISM!','#ffaaff',{sz:13,bold:true,outline:'#440044'});
  },
  barrierOfFaith(u){ // Zayt Mubarak (Holy) a5 Ã¢â‚¬â€ absorb shield on 2 lowest HP allies
    if(!tryAbility(u,'barrierOfFaith','barrierOfFaith',25*GAME_TICK_HZ))return;
    const allies=[];
    for(const a of units){
      if(a.hp<=0||!a.isPlayer||a.isGhost)continue;
      allies.push(a);
    }
    if(allies.length===0)return;
    allies.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp));
    const count=Math.min(2,allies.length);
    for(let i=0;i<count;i++){
      const a=allies[i];
      const shield=Math.round(a.maxHp*0.30);
      a.shieldHp=(a.shieldHp||0)+shield;
      a.barrierOfFaithTimer=480;
      addP(a.x,a.y,'#66aaff',20,5);addP(a.x,a.y,'#ffffff',10,3);
      groundFx.push({x:a.x,y:a.y,r:0,maxR:40,life:0.5,color:'#4488cc'});
      projectiles.push({x:u.x,y:u.y,target:a,tx:a.x,ty:a.y,speed:2.5,projType:'pomOrb',visualOnly:true,color:'#66aaff',_arrN:8,_arrSz:3,isPlayer:true,dmg:0});
      beamFx.push({x1:u.x,y1:u.y,x2:a.x,y2:a.y,life:25,maxLife:25,color:'#66aaff',width:2,straight:true});
      addDmg(a.x,a.y-a.size,'BARRIER!','#66aaff',{sz:13,bold:true,outline:'#002244'});
    }
    showFlash('BARRIER OF FAITH','#ffd700',45);
    screenShake=Math.max(screenShake,4);
  },
  guardianOfAncientKings(u){ // Zayt Muqaddas (Prot) a5 Ã¢â‚¬â€ 10s defensive buff
    if(!tryAbility(u,'guardianOfAncientKings','guardianOfAncientKings',45*GAME_TICK_HZ))return;
    u.goakTimer=12*GAME_TICK_HZ;
    u._goakOrigArmor=u.armor;
    u.armor=Math.round(u.armor*1.50);
    u.goakDR=0.25;
    u.goakHealPerTick=Math.round(u.maxHp*0.011);
    addP(u.x,u.y,'#ffd700',28,6);addP(u.x,u.y,'#ffffff',14,4);
    for(let i=0;i<12;i++){const a=Math.PI*2*i/12;addP(u.x+Math.cos(a)*u.size*1.3,u.y+Math.sin(a)*u.size*1.3,'#ffd700',2,4)}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:70,life:0.5,color:'#ffd700',flatten:true});
    addDmg(u.x,u.y-u.size-6,'GUARDIAN!','#ffd700');
    showFlash('GUARDIAN OF ANCIENT KINGS','#ffd700',50);
    screenShake=Math.max(screenShake,5);
  },
  // ----- MELEE -----
  bloodthirst(u){ // legacy Zayt L3 (kept for compat)
    if(!tryAbility(u,'bloodthirst','bloodthirst',1080))return;
    u.btActive=true;u.btTimer=240;
    addP(u.x,u.y,'#ff4444',16,4);
    showFlash('BLOODTHIRST!','#ff4444',30);
  },
  whirlwind(u){ // legacy Zayt L5 (kept for compat)
    if(!tryAbility(u,'whirlwind','whirlwind',1500))return;
    u.wwActive=true;u.wwTimer=90;u.wwTick=0;
    addP(u.x,u.y,'#ffaa00',18,4);
    showFlash('WHIRLWIND!','#ffaa00',40);
  },
  shadowstep(u){ // Felfel L3
    if(!tryAbility(u,'shadowstep','shadowstep',840))return; // 7s CD
    let far=null,farD=0;
    for(const e of enemies){if(e.hp>0&&e.range>50){const d=dist(u,e);if(d>farD&&d<300){farD=d;far=e}}}
    if(!far){for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d>farD){farD=d;far=e}}}}
    if(far){
      addP(u.x,u.y,'#660066',16,4);
      u.x=far.x+u.facing*-22;u.y=far.y;
      addP(u.x,u.y,'#660066',16,4);
      u.stealthHits=0;u.firstHitDone=false;
      dealDamage(far,u.dmg*3,u,'normal');
      showFlash('SHADOWSTEP!','#aa66cc',30);
    }
  },
  fanOfKnives(u){ // Felfel L5
    if(!tryAbility(u,'fanOfKnives','fanOfKnives',720))return; // 6s CD
    let _hit=0;
    for(const e of enemies){
      if(e.hp<=0)continue;
      if(dist(u,e)>120)continue;
      dealDamage(e,Math.round(u.dmg*1.5),u,'normal');
      // Apply Deadly Poison to all hit
      if(u.deadlyPoison){
        arena_applyFelfelDeadlyPoison(u,e,1,true,false);
      }
      addP(e.x,e.y,'#aa44cc',4,2);
      addP(e.x+rnd(-8,8),e.y+rnd(-8,8),'#ff4466',2,3);
      _hit++;
    }
    if(_hit>0){
      for(let i=0;i<8;i++){
        const a=Math.PI*2*i/8;
        const kx=u.x+Math.cos(a)*60,ky=u.y+Math.sin(a)*60;
        addP(kx,ky,'#ddddee',2,2);
        beamFx.push({x1:u.x,y1:u.y,x2:kx,y2:ky,color:'#ccccdd',width:1.5,life:0.25,maxLife:0.25,straight:true});
      }
      groundFx.push({x:u.x,y:u.y,r:0,maxR:120,life:0.4,color:'#8844aa'});
      addDmg(u.x,u.y-u.size,'FAN OF KNIVES!','#cc88ee',{sz:14,bold:true});
      showFlash('FAN OF KNIVES','#cc88ee',30);screenShake=Math.max(screenShake,3);
      SFX.fanOfKnives();
    }
  },
  bladeStorm(u){ // Jazar A3 Ã¢â‚¬â€ spin AoE for 2s
    if(!tryAbility(u,'bladeStorm','storm',720))return;
    u._bladeStormTimer=120;u._bladeStormTick=0;
    arena_jazarGuard(u,Math.round(3*GAME_TICK_HZ),0.32);
    showFlash('BLADE STORM!','#ff8800',40);
    for(let i=0;i<12;i++){
      const a=Math.PI*2*i/12;
      addP(u.x+Math.cos(a)*20,u.y+Math.sin(a)*20,'#ffaa44',2,3);
    }
    groundFx.push({x:u.x,y:u.y,r:0,maxR:90,life:0.5,color:'#ff880044'});
    SFX.bladeStorm();
  },
  shadowClones(u){ // Jazar A5 Ã¢â‚¬â€ summon 2 mirror images
    if(!tryAbility(u,'shadowClones','clones',1500))return;
    arena_jazarGuard(u,Math.round(3*GAME_TICK_HZ),0.30);
    for(let i=0;i<2;i++){
      const cx=u.x+rnd(-30,30),cy=u.y+rnd(-20,20);
      const clone={x:cx,y:cy,hp:Math.round(u.maxHp*0.3),maxHp:Math.round(u.maxHp*0.3),
        dmg:Math.round(u.dmg*0.4),armor:0,magicRes:0,speed:u.speed,atkSpd:u.atkSpd,range:u.range,
        size:u.size*0.85,color:'#ff8c00',accent:'#cc6600',facing:u.facing,cd:0,
        isPlayer:true,isMinion:true,parent:u,kind:'clone',unitIdx:5,drawFn:'drawJazar',
        bobPhase:Math.random()*Math.PI*2,_cloneTimer:300,_isClone:true,debuffs:{}};
      units.push(clone);addP(cx,cy,'#ffaa44',16,4);
    }
    showFlash('SHADOW CLONES!','#ff8800',50);screenShake=Math.max(screenShake,4);
  },
  hissatsuGyoten(u){ // Ronin Dragoon A3 - dash strike
    const cfg=u.roninDragoonCombo||{};
    const target=arena_findRoninPriorityTarget(u,cfg.gyotenRange||220);
    if(!target)return;
    if(!tryAbility(u,'hissatsuGyoten','hissatsuGyoten',12*GAME_TICK_HZ))return;
    const fromX=u.x,fromY=u.y;
    const angle=Math.atan2(target.y-u.y,target.x-u.x);
    const land=limitBurstLanding(u,target.x-Math.cos(angle)*18,target.y-Math.sin(angle)*18,170);
    u.x=land.x;u.y=land.y;
    arena_clampToLeash(u);
    const damage=Math.round(u.dmg*(cfg.gyotenMult||2.0)*arena_roninDamageMult(u));
    dealDamage(target,damage,u,'normal');
    arena_roninThirdEye(u);
    beamFx.push({x1:fromX,y1:fromY,x2:u.x,y2:u.y,color:'#ffd166cc',width:4.5,life:0.22,maxLife:0.22,straight:true});
    beamFx.push({x1:fromX,y1:fromY-10,x2:u.x,y2:u.y-4,color:'#48c7ffaa',width:2,life:0.18,maxLife:0.18,straight:true});
    for(let i=0;i<9;i++){const f=i/9;addP(fromX+(u.x-fromX)*f+rnd(-3,3),fromY+(u.y-fromY)*f+rnd(-3,3),'#ffd166',1.5,3)}
    groundFx.push({x:target.x,y:target.y,r:0,maxR:50,life:0.38,swipeArc:true,swipeAngle:angle,color:'#ffd166'});
    addP(target.x,target.y,'#ffd166',20,4);
    addDmg(target.x,target.y-target.size-8,'HISSATSU: GYOTEN','#ffd166',{sz:13,bold:true});
    screenShake=Math.max(screenShake,5);
  },
  geirskogulDive(u){ // Ronin Dragoon A5 - cluster leap
    const cfg=u.roninDragoonCombo||{};
    let best=arena_findBestEnemyClusterPoint(u,cfg.geirskogulRange||260,cfg.geirskogulRadius||95);
    if(!best){
      const target=arena_findRoninPriorityTarget(u,cfg.geirskogulRange||260);
      if(target)best={x:target.x,y:target.y,target};
    }
    if(!best)return;
    if(!tryAbility(u,'geirskogulDive','geirskogulDive',24*GAME_TICK_HZ))return;
    const fromX=u.x,fromY=u.y;
    const angle=Math.atan2(best.y-u.y,best.x-u.x);
    const land=limitBurstLanding(u,best.x-Math.cos(angle)*12,best.y-Math.sin(angle)*12,220);
    u.x=land.x;u.y=land.y;
    arena_clampToLeash(u);
    const radius=cfg.geirskogulRadius||95;
    const damage=Math.round(u.dmg*(cfg.geirskogulMult||2.7)*arena_roninDamageMult(u));
    let hits=0;
    for(const e of enemies){
      if(!isValidPlayerOffensiveTarget(e)||dist({x:best.x,y:best.y},e)>radius)continue;
      dealDamage(e,damage,u,'normal');
      addP(e.x,e.y,'#ff4f5e',12,4);
      addP(e.x,e.y,'#48c7ff',8,3);
      hits++;
    }
    arena_roninThirdEye(u);
    u.lifeOfDragonTimer=Math.max(u.lifeOfDragonTimer||0,cfg.lifeOfDragonDur||5*GAME_TICK_HZ);
    u.lifeOfDragonAtkMult=cfg.lifeOfDragonAtkMult||0.85;
    beamFx.push({x1:fromX,y1:fromY-40,x2:u.x,y2:u.y,color:'#48c7ffcc',width:5.5,life:0.28,maxLife:0.28,straight:true});
    beamFx.push({x1:fromX,y1:fromY-24,x2:u.x,y2:u.y,color:'#ff4f5ecc',width:3,life:0.24,maxLife:0.24,straight:true});
    groundFx.push({x:best.x,y:best.y,r:0,maxR:radius,life:0.65,color:'#ff4f5e'});
    groundFx.push({x:best.x,y:best.y,r:0,maxR:radius*0.62,life:0.45,color:'#48c7ff'});
    addP(best.x,best.y,'#ff4f5e',34,6);
    addP(best.x,best.y,'#48c7ff',24,5);
    addDmg(best.x,best.y-28,'GEIRSKOGUL DIVE','#48c7ff',{sz:14,bold:true});
    if(hits)addDmg(best.x,best.y+18,'LIFE OF DRAGON','#ff4f5e',{sz:12,bold:true});
    showFlash('GEIRSKOGUL DIVE','#48c7ff',45);
    screenShake=Math.max(screenShake,9);
  },
  colossusSmash(u){ // Jazar Sword Saint A3 Ã¢â‚¬â€ AoE armor shred
    if(!tryAbility(u,'colossusSmash','smash',900))return;
    arena_jazarGuard(u,Math.round(3*GAME_TICK_HZ),0.35);
    let _hit=0;
    for(const e of enemies){if(e.hp>0&&dist(u,e)<85){
      dealDamage(e,Math.round(u.dmg*2.0),u,'normal');
      e._armorShred=(e._armorShred||0)+1;e._armorShredTimer=300;
      addP(e.x,e.y,'#ff6600',12,4);_hit++;
    }}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:85,life:0.6,swipeSlam:true,color:'#ff6600'});
    if(_hit)addDmg(u.x,u.y-u.size,'COLOSSUS SMASH!','#ff8800');
    screenShake=Math.max(screenShake,10);
  },
  windSlash(u){ // Jazar Wind Dancer A3 Ã¢â‚¬â€ dash toward nearest enemy slashing
    if(!tryAbility(u,'windSlash','slash',12*GAME_TICK_HZ))return;
    let _wsTarget=null,_wsDist=Infinity;
    for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d<165&&d<_wsDist){_wsDist=d;_wsTarget=e}}}
    if(!_wsTarget)return;
    const startX=u.x,startY=u.y;
    const ang=Math.atan2(_wsTarget.y-u.y,_wsTarget.x-u.x);
    const dashLen=Math.min(_wsDist+20,135);
    let _hit=0;
    for(const e of enemies){if(e.hp>0){
      const ex=e.x-startX,ey=e.y-startY;
      const lx=Math.cos(ang)*dashLen,ly=Math.sin(ang)*dashLen,ll=dashLen||1;
      const t=Math.max(0,Math.min(1,(ex*lx+ey*ly)/(ll*ll)));
      const px=startX+lx*t,py=startY+ly*t;
      if(Math.hypot(e.x-px,e.y-py)<=40){
        dealDamage(e,Math.round(u.dmg*1.8),u,'normal');addP(e.x,e.y,'#44ccff',10,4);_hit++;
      }
    }}
    const _land=limitBurstLanding(u,_wsTarget.x,_wsTarget.y+10,135);
    u.x=_land.x;u.y=_land.y;
    arena_clampToLeash(u);
    arena_jazarGuard(u,Math.round(3*GAME_TICK_HZ),0.35);
    for(let i=0;i<8;i++){const px=startX+(u.x-startX)*(i/8),py=startY+(u.y-startY)*(i/8);addP(px,py,'#44ccff',2,3);addP(px+rnd(-8,8),py+rnd(-8,8),'#88eeff',1,2)}
    groundFx.push({x:(startX+u.x)/2,y:(startY+u.y)/2,r:0,maxR:Math.max(30,dist({x:startX,y:startY},u)/2),life:0.4,swipeArc:true,swipeAngle:ang,color:'#44ccff'});
    if(_hit){addDmg(u.x,u.y-u.size,'WIND SLASH!','#44ccff');screenShake=Math.max(screenShake,6)}
  },
  thousandCuts(u){ // Jazar Wind Dancer A5 Ã¢â‚¬â€ hyper mode
    if(!tryAbility(u,'thousandCuts','cuts',1080))return;
    u._thousandCutsTimer=300;
    arena_jazarGuard(u,Math.round(4*GAME_TICK_HZ),0.30);
    u._origAtkSpd=u._origAtkSpd||u.atkSpd;
    u.atkSpd=Math.max(12,Math.round(u.atkSpd*0.70));
    showFlash('THOUSAND CUTS!','#44ccff',50);addP(u.x,u.y,'#44ccff',24,5);
  },
  enrageBlade(u){ // Jazar Sword Saint A5 Ã¢â‚¬â€ passive trigger, ability is a no-op (handled in tick)
    if(u.enrageBlade&&u.enrageBlade.active)return;
  },
  // ----- RANGED -----
  flameCircle(u){ // Alibaba base A3 Ã¢â‚¬â€ reliable burning circle on the best enemy cluster
    const best=arena_findBestEnemyClusterPoint(u,(u.range||180)+180,90);
    if(!best)return;
    if(!tryAbility(u,'flameCircle','flameCircle',12*GAME_TICK_HZ))return;
    u._flameCircle={
      x:best.x,y:best.y,r:90,timer:4*GAME_TICK_HZ,tick:0,
      dmg:Math.max(1,Math.round(u.dmg*0.25)),from:u
    };
    addP(best.x,best.y,'#ff6600',26,5);
    addP(best.x,best.y,'#ffcc00',12,4);
    groundFx.push({x:best.x,y:best.y,r:0,maxR:90,life:0.6,color:'#ff4400'});
    groundFx.push({x:best.x,y:best.y,r:0,maxR:55,life:0.35,color:'#ffaa00'});
    addDmg(best.x,best.y-24,'FLAME CIRCLE!','#ff6600',{sz:14,bold:true});
    showFlash('FLAME CIRCLE','#ff6600',35);
    screenShake=Math.max(screenShake,5);
  },
  flamestrike(u){ // Alibaba base A3 Ã¢â‚¬â€ AoE fire column on enemy cluster
    if(!tryAbility(u,'flamestrike','flamestrike',12*GAME_TICK_HZ))return;
    let best=null,bestCount=0;
    for(const e of enemies){if(e.hp<=0)continue;let c=0;for(const f of enemies){if(f.hp>0&&dist(e,f)<80)c++}if(c>bestCount){bestCount=c;best=e}}
    if(!best)return;
    const dmg=Math.round(u.dmg*2.0);
    for(const e of enemies){if(e.hp>0&&dist(best,e)<=80)dealDamage(e,dmg,u,'magic')}
    groundFx.push({x:best.x,y:best.y,r:0,maxR:80,life:0.6,color:'#ff4400'});
    addP(best.x,best.y,'#ff6600',24,5);addDmg(best.x,best.y-20,'FLAMESTRIKE!','#ff4400');
    screenShake=Math.max(screenShake,6);
  },
  fireElemental(u){ // Alibaba base A5 Ã¢â‚¬â€ passive, elemental spawned at wave start
  },
  waterElemental(u){ // Alibaba Frost A5 Ã¢â‚¬â€ passive, water elemental spawned at wave start
  },
  stormElemental(u){ // Alibaba Storm A5 Ã¢â‚¬â€ passive, storm elemental spawned at wave start
  },
  chainLightning(u){ // Alibaba Storm A3 Ã¢â‚¬â€ hit target + chain to 4 nearby
    if(!tryAbility(u,'chainLightning','chainLightning',10*GAME_TICK_HZ))return;
    const t=findEnemyForUnit(u);if(!t)return;
    const baseDmg=Math.round(u.dmg*2.0);
    dealDamage(t,baseDmg,u,'magic');
    addP(t.x,t.y,'#aa88ff',16,5);addDmg(t.x,t.y-t.size,'CHAIN LIGHTNING!','#aa88ff');
    let prev=t;const chainDmg=Math.round(u.dmg*1.2);const hit=[t];
    for(let c=0;c<4;c++){
      let best=null,bestD=Infinity;
      for(const e of enemies){if(e.hp<=0||hit.includes(e))continue;const d=dist(prev,e);if(d<120&&d<bestD){bestD=d;best=e}}
      if(!best)break;
      dealDamage(best,chainDmg,u,'magic');hit.push(best);
      groundFx.push({x:prev.x,y:prev.y,r:0,maxR:0,life:0.3,lightningBolt:true,lbX2:best.x,lbY2:best.y,color:'#aa88ff'});
      addP(best.x,best.y,'#ccaaff',8,3);prev=best;
    }
    screenShake=Math.max(screenShake,5);showFlash('CHAIN LIGHTNING!','#aa88ff',40);
    SFX.chainLightning();
  },
  blizzard(u){ // Alibaba Barid A3 Ã¢â‚¬â€ 5s channeled AoE zone
    if(!tryAbility(u,'blizzard','blizzard',15*GAME_TICK_HZ))return;
    const t=findEnemyForUnit(u);if(!t)return;
    u._blizzardX=t.x;u._blizzardY=t.y;u._blizzardTimer=5*GAME_TICK_HZ;u._blizzardDmg=Math.round(u.dmg*0.45);u._blizzardRadius=70;
    addDmg(u.x,u.y-u.size,'BLIZZARD!','#66ccff');
    showFlash('BLIZZARD!','#88ddff',40);
    screenShake=Math.max(screenShake,4);
  },
  iceBarrier(u){ // Alibaba Barid A5 Ã¢â‚¬â€ shield absorbing 40% HP, breaksÃ¢â€ â€™freeze nearby
    if(!tryAbility(u,'iceBarrier','iceBarrier',18*GAME_TICK_HZ))return;
    u._iceBarrier={hp:Math.round(u.maxHp*0.40),maxHp:Math.round(u.maxHp*0.40),dur:8*GAME_TICK_HZ};
    addDmg(u.x,u.y-u.size,'ICE BARRIER!','#66ccff');
    addP(u.x,u.y,'#88ddff',16,4);
    for(let i=0;i<10;i++){const a=Math.PI*2*i/10;addP(u.x+Math.cos(a)*u.size*1.2,u.y+Math.sin(a)*u.size*1.2,'#aaeeff',1,3)}
  },
  massSummon(u){ // LEGACY Ã¢â‚¬â€ kept for backwards compatibility
    if(!tryAbility(u,'massSummon','massSummon',60))return;
    const myMinions=units.filter(m=>m.isMinion&&m.parent===u&&m.hp>0).length;
    if(myMinions>0){u.abilCD.massSummon=30;return}
    if((u.summonCDt||0)>0){u.abilCD.massSummon=30;return}
    spawnMinion(u,'foul',3);
    addP(u.x,u.y,'#7b8a3a',20,4);
    screenShake=Math.max(screenShake,4);
    showFlash('MASS SUMMON!','#7b8a3a',30);
  },
  curseOfDoom(u){ // LEGACY
    if(!tryAbility(u,'curseOfDoom','doom',2100))return;
    const t=findEnemyForUnit(u);
    if(t){
      t.doomTimer=300;t.doomDmg=u.dmg*8;t.doomFrom=u;
      addP(t.x,t.y,'#660066',12,4);
      showFlash('CURSE OF DOOM!','#aa66cc',40);
    }
  },
  drainLife(u){ // Jafaar L3 Ã¢â‚¬â€ channel 4s on current target
    if(!tryAbility(u,'drainLife','drainLife',14*GAME_TICK_HZ))return;
    const t=arena_findJafaarDrainTarget(u)||findEnemyForUnit(u);
    if(!t)return;
    u._drainLife={target:t,dur:4*GAME_TICK_HZ,t:0,dps:Math.round(u.dmg*0.80)};
    u._drainChanneling=true;
    addDmg(u.x,u.y-u.size,'DRAIN LIFE!','#33ff66',{sz:13,bold:true});
    addP(u.x,u.y,'#33ff66',22,5);addP(t.x,t.y,'#55ff88',12,4);
    beamFx.push({x1:u.x,y1:u.y-u.size*0.25,x2:t.x,y2:t.y-t.size*0.2,life:0.35,maxLife:0.35,color:'#33ff66',width:4,straight:false});
  },
  summonFelhound(u){ // Jafaar L5 Ã¢â‚¬â€ passive, spawned in arena_spawnSquadMinions
  },
  petBear(u){ // Zaatar L3 Ã¢â‚¬â€ cooldown 10s after pet dies
    if(!tryAbility(u,'petBear','petBear',60))return;
    if(spawnPetBear(u))screenShake=Math.max(screenShake,4);
  },
  volley(u){ // Zaatar L5 (legacy)
    if(!tryAbility(u,'volley','volley',1680))return;
    let tx=W/2,ty=ARENA_TOP+150;
    if(enemies.length){const e=enemies[0];tx=e.x;ty=e.y}
    groundFx.push({x:tx,y:ty,r:0,maxR:60,life:1,color:'#88ff44',volley:true,volleyTimer:240,volleyDmg:u.dmg*0.6,volleyTick:0,volleyFrom:u});
    showFlash('VOLLEY!','#88ff44',40);
  },
  rapidFire(u){ // Zaatar L3 Ã¢â‚¬â€ channel 8 rapid shots on target (14s CD)
    if(!tryAbility(u,'rapidFire','rapidFire',14*GAME_TICK_HZ))return;
    const t=findEnemyForUnit(u);
    if(!t)return;
    u._rapidFire={target:t,shots:8,shotTimer:0,shotInterval:Math.round(GAME_TICK_HZ*3/8),dmgMult:0.60};
    u._rapidChanneling=true;
    addDmg(u.x,u.y-u.size,'RAPID FIRE!','#ffd700');
    addP(u.x,u.y,'#ffd700',16,4);
  },
  callWolf(u){ // Zaatar L5 Ã¢â‚¬â€ passive, spawned in arena_spawnSquadMinions
  },
  explosiveShot(u){ // Zaatar Trapper A3 Ã¢â‚¬â€ charged shot that explodes on impact
    if(!tryAbility(u,'explosiveShot','explosiveShot',12*GAME_TICK_HZ))return;
    const t=findEnemyForUnit(u);
    if(!t)return;
    const _esDmg=Math.round(u.dmg*2.5);
    dealDamage(t,_esDmg,u,'physical');
    const _aoeR=60;
    for(const e of enemies){if(e!==t&&e.hp>0&&dist(t,e)<=_aoeR){dealDamage(e,Math.round(_esDmg*0.5),u,'physical');addP(e.x,e.y,'#ff6600',8,3)}}
    addP(t.x,t.y,'#ff8800',24,5);
    groundFx.push({x:t.x,y:t.y,r:0,maxR:_aoeR,life:0.4,color:'#ff6600'});
    addDmg(u.x,u.y-u.size,'EXPLOSIVE SHOT!','#ff6600');screenShake=Math.max(screenShake,5);
  },
  direBeast(u){ // Zaatar Beast Mastery A3 Ã¢â‚¬â€ summon a temp wild beast
    if(!tryAbility(u,'direBeast','direBeast',18*GAME_TICK_HZ))return;
    if(!enemies.some(e=>e.hp>0))return;
    spawnDireBeast(u);
  },
  empGrenade(u){ // Rumman L3 Ã¢â‚¬â€ EMP: AoE silence + slow
    if(!tryAbility(u,'empGrenade','empGrenade',14*GAME_TICK_HZ))return;
    const t=findEnemyForUnit(u);
    if(!t)return;
    const _empR=80;
    const _empDmg=Math.round(u.dmg*1.65);
    for(const e of enemies){if(e.hp>0&&dist(t,e)<=_empR){
      dealDamage(e,_empDmg,u,'magic');
      if(e.range>60)e.silenced=Math.max(e.silenced||0,2*GAME_TICK_HZ);
      e.slowTimer=Math.max(e.slowTimer||0,3*GAME_TICK_HZ);e.slowMult=Math.min(e.slowMult||1,0.70);
      e._rommanaMarkedTimer=4*GAME_TICK_HZ;e._rommanaMarkedAmp=0.10;e._rommanaMarkedSource=u;
      addP(e.x,e.y,'#44ccff',8,3);
    }}
    groundFx.push({x:t.x,y:t.y,r:0,maxR:_empR,life:0.5,color:'#44ccff'});
    groundFx.push({x:t.x,y:t.y,r:0,maxR:_empR*0.55,life:0.35,color:'#ffffff'});
    addDmg(u.x,u.y-u.size,'EMP MARK!','#44ccff');screenShake=Math.max(screenShake,6);
  },
  repairBot(u){ // Rumman L5 Ã¢â‚¬â€ heal drone on lowest HP ally
    if(!tryAbility(u,'repairBot','repairBot',20*GAME_TICK_HZ))return;
    spawnRepairBot(u);
  },
  rocketBarrage(u){ // Rumman Siege A3 - 8 rockets prioritizing enemy clusters
    if(!tryAbility(u,'rocketBarrage','rocketBarrage',12*GAME_TICK_HZ))return;
    const alive=enemies.filter(e=>e.hp>0&&dist(u,e)<(u.range||180)+60);
    if(!alive.length)return;
    const scored=alive.map(e=>{
      let count=0;
      for(const f of alive){if(dist(e,f)<=85)count++}
      return {e,score:count*100+(e.isBoss?35:0)-dist(u,e)*0.1};
    }).sort((a,b)=>b.score-a.score);
    for(let i=0;i<8;i++){
      const t=scored[i%Math.min(4,scored.length)].e;
      fireProjectile(u,t,Math.round(u.dmg*1.05),{projType:'bolt',color:'#ff6600'});
    }
    addDmg(u.x,u.y-u.size,'ROCKET BARRAGE!','#ff6600');screenShake=Math.max(screenShake,6);
  },
  napalmGrid(u){ // Rumman Siege A5 - three burning denial zones
    if(!tryAbility(u,'napalmGrid','napalmGrid',22*GAME_TICK_HZ))return;
    const alive=enemies.filter(e=>e.hp>0&&dist(u,e)<(u.range||180)+110);
    if(!alive.length)return;
    const scored=alive.map(e=>{
      let count=0;
      for(const f of alive){if(dist(e,f)<=95)count++}
      return {e,score:count*100+(e.isBoss?45:0)-dist(u,e)*0.1};
    }).sort((a,b)=>b.score-a.score);
    u._napalmGridZones=[];
    for(let i=0;i<3;i++){
      const base=scored[i%scored.length].e;
      const x=Math.max(ARENA_L+35,Math.min(ARENA_R-35,base.x+rnd(-45,45)));
      const y=Math.max(ARENA_TOP+35,Math.min(ARENA_BOT-35,base.y+rnd(-35,35)));
      const r=78;
      u._napalmGridZones.push({x,y,r,dur:4*GAME_TICK_HZ,tickRate:24,tickCD:i*6,dmgPerTick:Math.round(u.dmg*0.34),from:u});
      beamFx.push({x1:x,y1:y-110,x2:x,y2:y,life:0.55,maxLife:0.55,color:'#ff4400',width:10,straight:true});
      beamFx.push({x1:x,y1:y-110,x2:x,y2:y,life:0.35,maxLife:0.35,color:'#ffcc00',width:4,straight:true});
      groundFx.push({x,y,r:0,maxR:r,life:0.8,color:'#ff4400'});
      addP(x,y,'#ff6600',24,6);addP(x,y,'#ffcc00',12,4);
    }
    addDmg(u.x,u.y-u.size,'NAPALM GRID!','#ff4400');
    showFlash('NAPALM GRID!','#ff4400',55);
    screenShake=Math.max(screenShake,10);
  },
  shieldGenerator(u){ // Rumman Mech A3 Ã¢â‚¬â€ absorb shield on self + nearest ally
    if(!tryAbility(u,'shieldGenerator','shieldGenerator',15*GAME_TICK_HZ))return;
    const _lv=u.level||1;
    const _shieldAmt=300+_lv*40;
    u._engShield={hp:_shieldAmt,max:_shieldAmt,dur:5*GAME_TICK_HZ,t:0};
    let nearest=null,nd=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&a!==u&&!a.isMinion){const d=dist(u,a);if(d<nd){nd=d;nearest=a}}}
    if(nearest)nearest._engShield={hp:Math.round(_shieldAmt*0.5),max:Math.round(_shieldAmt*0.5),dur:5*GAME_TICK_HZ,t:0};
    addP(u.x,u.y,'#44aaff',20,5);
    addDmg(u.x,u.y-u.size,'SHIELD!','#44aaff');
  },
  // ----- HEALERS -----
  holyWordSerenity(u){ // Naana A3 Ã¢â‚¬â€ massive single heal + cleanse
    if(!tryAbility(u,'holyWordSerenity','serenity',14*GAME_TICK_HZ))return;
    let lowest=null,lowPct=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&a!==u){const p=a.hp/a.maxHp;if(p<lowPct){lowPct=p;lowest=a}}}
    if(!lowest)return;
    const healPct=(u.unitIdx===10&&!u.branch)?0.55:0.45;
    const heal=arena_applyTrackedHeal(lowest,Math.round(lowest.maxHp*healPct),u,true);
    // Cleanse debuffs
    if(lowest.bleedTimer>0){lowest.bleedTimer=0;lowest.bleedDmg=0}
    if(lowest.slowTimer>0){lowest.slowTimer=0;lowest.slowMult=1}
    if(lowest.stunned>0)lowest.stunned=0;
    projectiles.push({x:u.x,y:u.y,target:lowest,tx:lowest.x,ty:lowest.y,speed:3,projType:'serenityOrb',visualOnly:true,color:'#66ffaa',_arrN:24,_arrSz:5,_arrGnd:50,isPlayer:true,dmg:0});
    beamFx.push({x1:u.x,y1:u.y,x2:lowest.x,y2:lowest.y,life:25,maxLife:25,color:'#66ffaa',width:3,straight:true});
    if(u.unitIdx===10&&!u.branch){
      lowest._holyRenew={timer:7*GAME_TICK_HZ,healPct:0.03,from:u,tick:0};
      const allies=units.filter(a=>a.isPlayer&&a.hp>0&&!a.isGhost&&a!==lowest).sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp)).slice(0,2);
      for(const a of allies){
        const splash=arena_applyTrackedHeal(a,Math.round(a.maxHp*0.10),u,false);
        if(splash>0){
          projectiles.push({x:u.x,y:u.y,target:a,tx:a.x,ty:a.y,speed:3,projType:'serenityOrb',visualOnly:true,color:'#fff5b0',_arrN:8,_arrSz:3,isPlayer:true,dmg:0});
          beamFx.push({x1:lowest.x,y1:lowest.y,x2:a.x,y2:a.y,life:18,maxLife:18,color:'#fff5b0',width:2,straight:true});
        }
      }
    }
    addP(lowest.x,lowest.y,'#66ffaa',20,5);
    groundFx.push({x:lowest.x,y:lowest.y,r:0,maxR:50,life:0.5,color:'#66ffaa'});
    u._healCast=20;
    addDmg(lowest.x,lowest.y-lowest.size,'SERENITY!','#66ffaa');showFlash('HOLY WORD: SERENITY','#66ffaa',40);
  },
  guardianSpirit(u){ // Naana A5 Ã¢â‚¬â€ prevent death on lowest ally
    if(!tryAbility(u,'guardianSpirit','guardian',24*GAME_TICK_HZ))return;
    let lowest=null,lowPct=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&a!==u&&!a.isMinion&&!a.isGhost){const p=a.hp/a.maxHp;if(p<lowPct){lowPct=p;lowest=a}}}
    if(!lowest)return;
    lowest._guardianSpirit={timer:10*GAME_TICK_HZ,healPct:(u.unitIdx===10&&!u.branch)?0.55:0.45,from:u};
    if(u.unitIdx===10&&!u.branch)lowest._holyRenew={timer:7*GAME_TICK_HZ,healPct:0.03,from:u,tick:0};
    projectiles.push({x:u.x,y:u.y,target:lowest,tx:lowest.x,ty:lowest.y,speed:3,projType:'serenityOrb',visualOnly:true,color:'#ffd700',_arrN:20,_arrSz:5,_arrGnd:40,isPlayer:true,dmg:0});
    beamFx.push({x1:u.x,y1:u.y,x2:lowest.x,y2:lowest.y,life:30,maxLife:30,color:'#ffd700',width:3,straight:true});
    addDmg(lowest.x,lowest.y-lowest.size,'GUARDIAN SPIRIT!','#ffd700');showFlash('GUARDIAN SPIRIT','#ffd700',45);
  },
  voidEruption(u){ // Naana Shadow A3 Ã¢â‚¬â€ AoE burst + enter Voidform
    if(!tryAbility(u,'voidEruption','void',10*GAME_TICK_HZ))return;
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<200))return;
    const _vDmg=Math.round(u.dmg*2.0);
    for(const e of enemies){if(e.hp>0&&dist(u,e)<=80){
      dealDamage(e,_vDmg,u,'magic');
      addP(e.x,e.y,'#6622aa',14,4);
    }}
    const _vfDur=u.hasL5?7*GAME_TICK_HZ:5*GAME_TICK_HZ;
    u._voidform={timer:_vfDur,splashRadius:35,atkSpdBoost:true,dotDoubleTick:true};
    if(!u._vfOrigAtkSpd){u._vfOrigAtkSpd=u.atkSpd;u.atkSpd=Math.max(8,Math.round(u.atkSpd*0.80))}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:80,life:0.6,color:'#3a0a5a'});
    for(let i=0;i<24;i++){const a=Math.PI*2*i/24;addP(u.x+Math.cos(a)*50,u.y+Math.sin(a)*50,'#6622aa',1,4)}
    for(let i=0;i<16;i++)addP(u.x+rnd(-30,30),u.y+rnd(-30,30),'#aa66ff',1,5);
    addDmg(u.x,u.y-u.size,'VOID ERUPTION!','#aa66ff');showFlash('VOID ERUPTION','#aa66ff',50);
    screenShake=Math.max(screenShake,10);
  },
  surrenderToMadness(u){ // Naana Shadow A3 (L3) Ã¢â‚¬â€ Ãƒâ€”3 dmg for 5s, chains to 2
    if(!tryAbility(u,'surrenderToMadness','stm',20*GAME_TICK_HZ))return;
    if(!enemies.some(e=>e.hp>0))return;
    u._madness={timer:5*GAME_TICK_HZ,dmgMult:3.0,chainTargets:2};
    u._madnessOrigDmg=u.dmg;
    u.dmg=Math.round(u.dmg*3.0);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:80,life:0.6,color:'#3a0a5a'});
    for(let i=0;i<20;i++)addP(u.x+rnd(-25,25),u.y+rnd(-25,25),'#aa66ff',1,5);
    for(let i=0;i<12;i++){const a=Math.PI*2*i/12;addP(u.x+Math.cos(a)*50,u.y+Math.sin(a)*50,'#6622aa',1,4)}
    addDmg(u.x,u.y-u.size-4,'MADNESS!','#aa66ff');showFlash('SURRENDER TO MADNESS','#aa66ff',60);
    screenShake=Math.max(screenShake,10);
  },
  shadowWordDeath(u){ // Naana Shadow A5 Ã¢â‚¬â€ execute: 500% to low HP, CD reset on kill, self-damage on fail
    if(!tryAbility(u,'shadowWordDeath','swd',10*GAME_TICK_HZ))return;
    let target=null,lowestPct=1;
    for(const e of enemies){if(e.hp>0&&e.hp/e.maxHp<0.35){const p=e.hp/e.maxHp;if(p<lowestPct){lowestPct=p;target=e}}}
    if(!target)return;
    const _swdDmg=Math.round(u.dmg*5.0);
    dealDamage(target,_swdDmg,u,'magic');
    // Void orb projectile for visual
    projectiles.push({x:u.x,y:u.y,target:target,tx:target.x,ty:target.y,speed:6,projType:'voidOrb',visualOnly:true,color:'#aa66ff',_arrN:12,_arrSz:4,isPlayer:true,dmg:0});
    // Death skull VFX at target
    addP(target.x,target.y,'#1a0020',24,6);
    addP(target.x,target.y,'#aa66ff',16,4);
    for(let i=0;i<8;i++)addP(target.x+rnd(-15,15),target.y+rnd(-15,15),'#6622aa',1,3);
    groundFx.push({x:target.x,y:target.y,r:0,maxR:40,life:0.4,color:'#3a0a5a'});
    if(target.hp<=0){
      // Kill Ã¢â‚¬â€ reset cooldown + spawn 2 shadow apparitions
      u.abilCD['swd']=0;
      addDmg(target.x,target.y-target.size,'SW:DEATH KILL!','#cc88ff');
      showFlash('EXECUTE!','#cc88ff',50);
      screenShake=Math.max(screenShake,8);
      if(u.shadowApparitions){
        if(!arena.shadowApparitions)arena.shadowApparitions=[];
        for(let i=0;i<2;i++){
          const _re=enemies.filter(e=>e.hp>0);
          if(_re.length===0)break;
          const _at=_re[Math.floor(Math.random()*_re.length)];
          arena.shadowApparitions.push({x:target.x+rnd(-10,10),y:target.y+rnd(-10,10),tx:_at.x,ty:_at.y,target:_at,
            dmg:Math.round(u.dmg*u.shadowApparitions.dmgPct),from:u,speed:4,life:240});
        }
      }
    }else{
      // Didn't kill Ã¢â‚¬â€ self-damage backlash
      const selfDmg=Math.round(u.maxHp*0.15);
      u.hp=Math.max(1,u.hp-selfDmg);
      addDmg(u.x,u.y-u.size,'BACKLASH -'+selfDmg,'#ff4444');
      addP(u.x,u.y,'#ff4444',12,3);
      addDmg(target.x,target.y-target.size,'SW:DEATH','#aa66ff');
      screenShake=Math.max(screenShake,5);
    }
  },
  layOnHands(u){ // legacy Ã¢â‚¬â€ kept for King/Zayt compat
    if(!tryAbility(u,'layOnHands','loh',1800))return;
    let lowest=null,lowPct=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&a!==u){const p=a.hp/a.maxHp;if(p<lowPct){lowPct=p;lowest=a}}}
    if(lowest){
      arena_applyTrackedHeal(lowest,lowest.maxHp,u,true);
      lowest.armorBuff=12;lowest.armorBuffTimer=300;
      for(let i=1;i<=10;i++){const _f=i/10;addP(u.x+(lowest.x-u.x)*_f,u.y+(lowest.y-u.y)*_f,'#ffd700',2,4)}
      addP(lowest.x,lowest.y,'#ffd700',32,6);
      showFlash('LAY ON HANDS!','#ffd700',40);
    }
  },
  divineShield(u){ // legacy Ã¢â‚¬â€ kept for King/Zayt compat
    if(!tryAbility(u,'divineShield','dshield',3600))return;
    let lowest=null,lowPct=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&a!==u){const p=a.hp/a.maxHp;if(p<lowPct){lowPct=p;lowest=a}}}
    if(lowest){
      lowest.divineShield=true;lowest.divineShieldTimer=180;
      addP(lowest.x,lowest.y,'#ffeeaa',32,5);
      showFlash('DIVINE SHIELD!','#ffeeaa',40);
    }
  },
  swiftmend(u){ // Bakdounes A3 Ã¢â‚¬â€ instant 40% heal + spawn treant healer
    if(!tryAbility(u,'swiftmend','swm',14*GAME_TICK_HZ))return;
    let lowest=null,lowPct=Infinity;
    for(const a of units){if(a.isPlayer&&a.hp>0&&!a.isMinion){const p=a.hp/a.maxHp;if(p<lowPct){lowPct=p;lowest=a}}}
    if(!lowest)lowest=u;
    const _hm=u._incarnation?1.5:1.0;
    const _h=arena_applyTrackedHeal(lowest,Math.round(lowest.maxHp*0.35*_hm),u,true);
    addP(lowest.x,lowest.y,'#44ff66',20,5);addP(lowest.x,lowest.y,'#88ffaa',12,4);addP(lowest.x,lowest.y,'#ffffff',6,3);
    groundFx.push({x:lowest.x,y:lowest.y,r:0,maxR:55,life:0.6,color:'#44ff88'});
    groundFx.push({x:lowest.x,y:lowest.y,r:0,maxR:30,life:0.35,color:'#88ffcc'});
    beamFx.push({x1:u.x,y1:u.y,x2:lowest.x,y2:lowest.y,life:0.3,maxLife:0.3,color:'#44ff88',width:4,straight:false});
    for(let i=0;i<6;i++){const a=Math.PI*2*i/6;addP(lowest.x+Math.cos(a)*25,lowest.y+Math.sin(a)*25,'#66ff88',2,3)}
    arena_spawnTreant(u,lowest.x+rnd(-30,30),lowest.y+rnd(-15,15),12*GAME_TICK_HZ);
    addDmg(lowest.x,lowest.y-lowest.size-6,'SWIFTMEND!','#44ff88',{sz:14,bold:true});showFlash('SWIFTMEND','#44ff88',50);screenShake=Math.max(screenShake,3);
  },
  tranquility(u){ // Bakdounes A5 Ã¢â‚¬â€ channel 5s, heal lowest 5 allies 6%/tick
    if(!tryAbility(u,'tranquility','tranq',28*GAME_TICK_HZ))return;
    u._tranquility={timer:5*GAME_TICK_HZ,tickRate:Math.floor(GAME_TICK_HZ*0.5),tick:0,healPct:0.06};
    addDmg(u.x,u.y-u.size-8,'TRANQUILITY!','#33ff77',{sz:16,bold:true});
    for(let i=0;i<24;i++){const a=Math.PI*2*i/24;addP(u.x+Math.cos(a)*40,u.y+Math.sin(a)*40,'#44ff88',2,5)}
    for(let i=0;i<8;i++){const a=Math.PI*2*i/8;beamFx.push({x1:u.x,y1:u.y,x2:u.x+Math.cos(a)*80,y2:u.y+Math.sin(a)*80,life:0.4,maxLife:0.4,color:'#44ff88',width:2,straight:true})}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:120,life:0.7,color:'#33ff77'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:60,life:0.4,color:'#88ffcc'});
    showFlash('TRANQUILITY','#33ff77',70);screenShake=Math.max(screenShake,6);
  },
  aromaticBurst(u){ // Habaq A3 Ã¢â‚¬â€ green rain healing zone
    if(!tryAbility(u,'aromaticBurst','aburst',24*GAME_TICK_HZ))return;
    u._aromaBurstZone={x:u.x,y:u.y,r:140,timer:12*GAME_TICK_HZ,maxTimer:12*GAME_TICK_HZ,
      healAmt:Math.round((u.healAmt||60)*0.42),owner:u};
    groundFx.push({x:u.x,y:u.y,r:0,maxR:150,life:0.7,color:'#88cc66'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:95,life:0.4,color:'#aaffaa'});
    for(let i=0;i<8;i++){const a=Math.PI*2*i/8;beamFx.push({x1:u.x,y1:u.y,x2:u.x+Math.cos(a)*120,y2:u.y+Math.sin(a)*120,life:0.3,maxLife:0.3,color:'#88cc66',width:2,straight:true})}
    for(let i=0;i<30;i++){const ang=Math.PI*2*i/30,r=rnd(15,80);addP(u.x+Math.cos(ang)*r,u.y+Math.sin(ang)*r,'#88cc66',2,5)}
    for(let i=0;i<12;i++)addP(u.x+rnd(-40,40),u.y+rnd(-30,30),'#aaffaa',1,4);
    addDmg(u.x,u.y-u.size-8,'AROMATIC RAIN!','#88cc66',{sz:14,bold:true});
    showFlash('AROMATIC RAIN!','#88cc66',60);screenShake=Math.max(screenShake,6);
  },
  transcendence(u){ // Habaq A5 Ã¢â‚¬â€ statues heal 2x faster + spawn mist zones
    if(!tryAbility(u,'transcendence','transc',50*GAME_TICK_HZ))return;
    u._transcendenceTimer=8*GAME_TICK_HZ;
    addDmg(u.x,u.y-u.size-8,'TRANSCENDENCE!','#aaffaa',{sz:15,bold:true});
    for(let i=0;i<40;i++){const ang=Math.PI*2*i/40,r=rnd(10,60);addP(u.x+Math.cos(ang)*r,u.y+Math.sin(ang)*r,'#88cc66',2,6)}
    for(let i=0;i<20;i++)addP(u.x+rnd(-15,15),u.y-rnd(10,50),'#aaffaa',1.5,4);
    for(let i=0;i<6;i++){const a=Math.PI*2*i/6;beamFx.push({x1:u.x,y1:u.y,x2:u.x+Math.cos(a)*90,y2:u.y+Math.sin(a)*90,life:0.4,maxLife:0.4,color:'#aaffaa',width:3,straight:true})}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:130,life:0.8,color:'#88cc66'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:80,life:0.5,color:'#aaffaa'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:40,life:0.3,color:'#ffffff'});
    if(u._aromaStatues){for(const st of u._aromaStatues){beamFx.push({x1:u.x,y1:u.y,x2:st.x,y2:st.y,life:0.3,maxLife:0.3,color:'#ffd700',width:2,straight:false});addP(st.x,st.y,'#ffd700',12,4)}}
    showFlash('TRANSCENDENCE','#aaffaa',70);screenShake=Math.max(screenShake,7);
  },
  goldenCascade(u){ // Habaq Dhahabi A3 Ã¢â‚¬â€ golden chain heal bolts to allies, bonded ally heals double
    if(!tryAbility(u,'goldenCascade','gcasc',20*GAME_TICK_HZ))return;
    const bondTarget=u.essenceBond?u.essenceBond.target:null;
    const _allies=[];
    for(const a of units){if(a.isPlayer&&a.hp>0&&!a.isGhost&&!a.isMinion)_allies.push(a)}
    _allies.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp));
    const baseHeal=Math.round((u.healAmt||60)*0.55);
    for(const a of _allies){
      const h=(bondTarget&&a===bondTarget)?baseHeal*2:baseHeal;
      projectiles.push({x:u.x,y:u.y,target:a,tx:a.x,ty:a.y,speed:4,projType:'pomOrb',visualOnly:true,
        color:'#ffd700',_arrN:10,_arrSz:4,_arrGnd:25,isPlayer:true,dmg:0,
        _aromaHeal:h,_aromaOwner:u});
    }
    groundFx.push({x:u.x,y:u.y,r:0,maxR:160,life:0.6,color:'#ffd700'});
    addDmg(u.x,u.y-u.size-8,'GOLDEN CASCADE!','#ffd700');showFlash('GOLDEN CASCADE','#ffd700',60);screenShake=Math.max(screenShake,4);
  },
  prescientBarrier(u){ // Habaq Dhahabi A5 Ã¢â‚¬â€ golden shields on all allies for 6s
    if(!tryAbility(u,'prescientBarrier','pbarr',45*GAME_TICK_HZ))return;
    for(const a of units){
      if(!a.isPlayer||a.hp<=0||a.isGhost||a.isMinion)continue;
      a._goldShield={amt:Math.round(a.maxHp*0.22),timer:6*GAME_TICK_HZ,maxTimer:6*GAME_TICK_HZ};
      addP(a.x,a.y,'#ffd700',10,4);addP(a.x,a.y,'#ffe066',6,3);
    }
    for(let i=0;i<36;i++){const ang=Math.PI*2*i/36,r=rnd(10,60);addP(u.x+Math.cos(ang)*r,u.y+Math.sin(ang)*r,'#ffd700',1,5)}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:180,life:0.7,color:'#ffd700'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:120,life:0.5,color:'#ffe066'});
    addDmg(u.x,u.y-u.size-8,'PRESCIENT BARRIER!','#ffd700');showFlash('PRESCIENT BARRIER','#ffd700',70);screenShake=Math.max(screenShake,5);
  },
  // ----- VODKA HERO -----
  vineLash(u){ // Vodka L3
    if(!tryAbility(u,'vineLash','vineLash',1080))return;
    let far=null,farD=0;
    for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d>farD&&d<300){farD=d;far=e}}}
    if(far){
      groundFx.push({x:u.x,y:u.y,r:0,maxR:0,life:1,color:'#3a8e3a',vineLash:true,vineFromX:u.x,vineFromY:u.y,vineToX:far.x,vineToY:far.y,vineTimer:30});
      far.x=u.x+u.facing*40;far.y=u.y;
      dealDamage(far,u.dmg*1.5,u,'normal');
      showFlash('VINE LASH!','#3a8e3a',30);
    }
  },
  harvestFury(u){ // Vodka L5
    if(!tryAbility(u,'harvestFury','fury',3600))return;
    u.furyTimer=480;
    addP(u.x,u.y,'#ff8c00',40,6);
    screenShake=Math.max(screenShake,12);
    showFlash('HARVEST FURY!','#ff8c00',60);
  }
};

  const abilities = {};
  for (const key of Object.keys(ABILITIES)) {
    const ability = ABILITIES[key];
    abilities[key] = function runUnitAbility(...args) {
      syncView();
      const beforeShake = screenShake;
      const result = ability.apply(this, args);
      flushScreenShake(beforeShake);
      return result;
    };
  }

  function runTryAbility(...args) {
    syncView();
    const beforeShake = screenShake;
    const result = tryAbility(...args);
    flushScreenShake(beforeShake);
    return result;
  }

  function runWithView(fn, args) {
    syncView();
    const beforeShake = screenShake;
    const result = fn(...args);
    flushScreenShake(beforeShake);
    return result;
  }

  return {
    abilities,
    tryAbility: runTryAbility,
    jazarGuard: (...args) => runWithView(arena_jazarGuard, args),
    jazarSignatureSurge: (...args) => runWithView(arena_jazarSignatureSurge, args),
    findBestEnemyClusterPoint: (...args) => runWithView(arena_findBestEnemyClusterPoint, args),
  };
}

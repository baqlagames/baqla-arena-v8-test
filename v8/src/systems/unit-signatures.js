import { limitBurstLanding } from './combat-targeting.js';

export function createArenaSignatures(deps = {}) {
  const {
    gameTickHz: GAME_TICK_HZ,
    arena = {},
    SFX = {},
    getBattleArray = () => [],
    getFrame = () => 0,
    getArenaBounds = () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    addDamageText: addDmg = () => {},
    addHealFx = () => {},
    emitParticle: addP = () => {},
    showFlash = () => {},
    dealDamage = () => {},
    randomRange: rnd = () => 0,
    distance: dist = () => 0,
    applyTrackedHeal: arena_applyTrackedHeal = () => {},
    findLowestAlly: arena_findLowestAlly = () => null,
    beaconSplash: arena_beaconSplash = () => {},
    addBatataShield: arena_addBatataShield = () => {},
    addGoldShield: arena_addGoldShield = () => {},
    addTaoonBloodShield: arena_addTaoonBloodShield = () => {},
    addZavsLineShield: arena_addZavsLineShield = () => {},
    applyHealingReceived: arena_applyHealingReceived = value => value,
    applyMuddied: arena_applyMuddied = () => {},
    clampToLeash: arena_clampToLeash = () => {},
    findBestEnemyClusterPoint: arena_findBestEnemyClusterPoint = () => null,
    fireDivineStorm: arena_fireDivineStorm = () => {},
    jazarGuard: arena_jazarGuard = () => {},
    jazarSignatureSurge: arena_jazarSignatureSurge = () => {},
    moonkinControlBurst: arena_moonkinControlBurst = () => {},
    spawnTreant: arena_spawnTreant = () => {},
    nerfMinion = () => {},
    unitVisualScale = 1,
    updateUnit: arena_updateUnit = () => {},
    shake: shakeScreen = () => {},
  } = deps;
  const liveArray = key => new Proxy([], {
    get(_target, prop) {
      const arr = getBattleArray(key) || [];
      const value = arr[prop];
      return typeof value === 'function' ? value.bind(arr) : value;
    },
    set(_target, prop, value) {
      const arr = getBattleArray(key) || [];
      arr[prop] = value;
      return true;
    },
    has(_target, prop) {
      return prop in (getBattleArray(key) || []);
    },
    ownKeys() {
      return Reflect.ownKeys(getBattleArray(key) || []);
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Object.getOwnPropertyDescriptor(getBattleArray(key) || [], prop) || { configurable: true };
    },
  });
  const enemies = liveArray('enemies');
  const units = liveArray('units');
  const projectiles = liveArray('projectiles');
  const bombs = liveArray('bombs');
  const groundFx = liveArray('groundFx');
  const beamFx = liveArray('beamFx');
  const shake = amount => shakeScreen(amount);
return {
  // ----- BASE TANK SIGNATURES -----
  taunt_wave:{name:'Taunt Wave',cd:15,fire(u){
    let _hit=0;
    for(const e of enemies){if(e.hp>0&&!e.isBoss&&dist(u,e)<=200){e.stunned=Math.max(e.stunned||0,30);_hit++;addP(e.x,e.y,'#cc6633',6,3)}}
    if(_hit){groundFx.push({x:u.x,y:u.y,r:0,maxR:200,life:0.5,color:'#cc6633'});addDmg(u.x,u.y-u.size-4,'TAUNT WAVE!','#cc6633');shake(6)}
  }},
  soul_drain:{name:'Soul Drain',cd:20,fire(u){
    let _hit=0;
    for(const e of enemies){
      if(e.hp<=0||e.isBoss)continue;
      if(dist(u,e)>150)continue;
      const dx=u.x-e.x,dy=u.y-e.y,dd=Math.hypot(dx,dy)||1;
      e.x+=dx/dd*40;e.y+=dy/dd*40;
      e.stunned=Math.max(e.stunned||0,60);e.slowTimer=120;e.slowMult=0.4;
      addP(e.x,e.y,'#7a3a8e',12,4);_hit++;
    }
    if(_hit){groundFx.push({x:u.x,y:u.y,r:0,maxR:150,life:0.5,color:'#7a3a8e'});addDmg(u.x,u.y-u.size-4,'SOUL DRAIN!','#cc99ff');shake(8)}
  }},
  incarnation_ursoc:{name:'Incarnation: Guardian of Ursoc',cd:45,fire(u){
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<(u.range||60)+40))return false;
    u._preIncarnMaxHp=u.maxHp;u._preIncarnArmor=u.armor;u._preIncarnSize=u.size;
    u.maxHp=Math.round(u.maxHp*1.5);u.hp=Math.min(u.maxHp,u.hp+Math.round(u._preIncarnMaxHp*0.5));
    u.armor=Math.round(u.armor*1.5);u.size=Math.round(u.size*1.2);
    u.incarnationActive=true;u.incarnationTimer=600;u.incarnationCleave360=true;u.incarnationCCImmune=true;
    addP(u.x,u.y,'#c8a050',48,8);groundFx.push({x:u.x,y:u.y,r:0,maxR:150,life:1.0,color:'#c8a050'});
    addDmg(u.x,u.y-u.size-4,'INCARNATION!','#c8a050');showFlash('GUARDIAN OF URSOC!','#c8a050',75);shake(12)
  }},
  // ----- BASE DPS SIGNATURES -----
  exec_shot:{name:'Execution Shot',cd:15,fire(u){
    let best=null,bestHp=Infinity;
    for(const e of enemies){if(e.hp<=0||e.isBoss)continue;if(dist(u,e)>(u.range||40)+50)continue;if(e.hp<bestHp){bestHp=e.hp;best=e}}
    if(best){dealDamage(best,Math.round(u.dmg*4),u,'normal');addP(best.x,best.y,'#ff2222',24,5);addDmg(best.x,best.y-20,'EXECUTION!','#ff5555');shake(6)}
  }},
  // ===== ZAYT (Retribution Paladin) SIGNATURE =====
  // Divine Storm: 4 holy waves radiate from the caster in cardinal directions.
  // Each wave damages enemies in its path AND splash-heals allies along it.
  // Tier 3 (cd:30) Ã¢â€ â€™ real CD 35s, first cast 5s.
  // ===== AVENGING WRATH (Zayt Ã¢â‚¬â€ base sig, replaces Divine Storm at sig slot) =====
  // Iconic Retribution Paladin ult: 8-second buff window. While active,
  // the paladin gets +30% damage and +30% crit chance, with bright wings glow.
  // Tier 2 (cd:25 Ã¢â€ â€™ 30s real CD, 4s first cast). Stat buffs revert when timer
  // expires (handled in arena_updateUnit per-tick block).
  avenging_wrath:{name:'Avenging Wrath',cd:25,fire(u){
    if(u.avengingWrathTimer>0)return false;
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<(u.range||60)+40))return false;
    u.avengingWrathTimer=8*GAME_TICK_HZ;
    u._awOrigDmg=u.dmg;u._awOrigCritChance=u.crit?u.crit.chance:null;
    u._awOrigLifesteal=u.lifesteal||0;
    u.dmg=Math.round(u.dmg*1.30);
    if(u.crit){u.crit.chance=Math.min(0.85,u.crit.chance+0.30)}
    else{u.crit={chance:0.30,mult:2.0}}
    u.lifesteal=(u.lifesteal||0)+0.15;
    showFlash('AVENGING WRATH','#ffd700',60);
    addDmg(u.x,u.y-u.size-6,'AVENGING WRATH!','#ffd700');
    groundFx.push({x:u.x,y:u.y,r:0,maxR:80,life:0.6,color:'#ffd700',flatten:true});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:110,life:0.35,color:'#ffffff',flatten:true});
    // Wing-burst particles + 3 vertical light pillars
    for(let _i=0;_i<28;_i++){
      const _a=Math.PI*2*_i/28;
      addP(u.x+Math.cos(_a)*u.size,u.y+Math.sin(_a)*u.size,'#ffd700',2,5);
    }
    for(let _i=0;_i<10;_i++){
      addP(u.x+rnd(-3,3),u.y-_i*4,'#fff7c4',1,3);
    }
    shake(8);
  }},
  // Divine Storm sig kept for legacy/back-compat but no longer referenced by
  // ARENA_BASE_SIGNATURES (moved to per-4th-hit passive on every paladin). Calling
  // arena_fireDivineStorm() directly from the on-hit proc reuses this body.
  divine_storm:{name:'Divine Storm',cd:10,fire(u){
    const _waveLen=180,_waveWidth=40;
    // Useful-target gate: only fire if at least one enemy is within reach of
    // the wave corridors. Otherwise the ult wastes the cooldown firing into
    // empty space. Returns false to skip the cast (signature.t resets normally).
    let _hasReachable=false;
    for(const _e of enemies){
      if(_e.hp<=0)continue;
      if(Math.hypot(_e.x-u.x,_e.y-u.y)<=_waveLen+_waveWidth){_hasReachable=true;break}
    }
    if(!_hasReachable)return false;
    const _dmg=Math.round(u.dmg*1.8);
    const _heal=Math.round(u.maxHp*0.10);
    const _angles=[0,Math.PI/2,Math.PI,3*Math.PI/2];
    for(const ang of _angles){
      // Damage enemies inside the wave corridor
      for(const e of enemies){
        if(e.hp<=0)continue;
        const ex=e.x-u.x,ey=e.y-u.y;
        const proj=ex*Math.cos(ang)+ey*Math.sin(ang);
        if(proj<0||proj>_waveLen)continue;
        const perp=Math.abs(ex*-Math.sin(ang)+ey*Math.cos(ang));
        if(perp>_waveWidth)continue;
        dealDamage(e,_dmg,u,'magic');
        addP(e.x,e.y,'#ffe066',12,5);
      }
      // Heal allies inside the wave corridor
      for(const a of units){
        if(a.hp<=0||!a.isPlayer||a.isGhost)continue;
        const ax=a.x-u.x,ay=a.y-u.y;
        const proj=ax*Math.cos(ang)+ay*Math.sin(ang);
        if(proj<0||proj>_waveLen)continue;
        const perp=Math.abs(ax*-Math.sin(ang)+ay*Math.cos(ang));
      if(perp>_waveWidth)continue;
      if(a.hp<a.maxHp){
          arena_applyTrackedHeal(a,_heal,u,false);
        }
      }
      // Crescent shockwave VFX along each corridor Ã¢â‚¬â€ gold+white twin sweeps
      // staggered in radius so the visual reads as a 'storm wave', not a line.
      const _midR=_waveLen*0.55;
      groundFx.push({x:u.x+Math.cos(ang)*_midR,y:u.y+Math.sin(ang)*_midR,r:0,maxR:_waveWidth+12,life:0.40,color:'#ffe066',flatten:true});
      groundFx.push({x:u.x+Math.cos(ang)*_midR,y:u.y+Math.sin(ang)*_midR,r:0,maxR:_waveWidth+22,life:0.20,color:'#ffffff',flatten:true});
      // Particle trail along corridor
      for(let i=1;i<=12;i++){
        const px=u.x+Math.cos(ang)*_waveLen*(i/12);
        const py=u.y+Math.sin(ang)*_waveLen*(i/12);
        addP(px,py,'#ffe066',2,4);
        if(i%2===0)addP(px+rnd(-3,3),py+rnd(-3,3),'#ffffff',1,3);
      }
    }
    // Central expanding gold ring + bright white core flash (storm eye) Ã¢â‚¬â€ flatten
    // so they project on the ground plane rather than ballooning at unit center.
    groundFx.push({x:u.x,y:u.y,r:0,maxR:_waveLen,life:0.7,color:'#ffd700',flatten:true});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:_waveLen+30,life:0.35,color:'#ffffff',flatten:true});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:60,life:0.4,color:'#ffe066',flatten:true});
    addDmg(u.x,u.y-u.size-6,'DIVINE STORM!','#ffe066');
    showFlash('DIVINE STORM','#ffe066',60);
    shake(10);
  }},
  // ===== ZAYT MUQADDAS (Holy Protector) SIGNATURE =====
  // Ashen Hallow (WoW Shadowlands Venthyr COVENANT Ã¢â‚¬â€ strong long-CD ult):
  // 12-second hallowed ground, huge radius (240 px). Visualised as a deep RED
  // crimson circle on the ground (per WoW). Enemies inside take heavy ticking
  // AoE damage. Every friendly inside gets a steady HoT. Tier 5 (cd:55).
  ashen_hallow:{name:'Ashen Hallow',cd:40,fire(u){
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<240))return false;
    u.consecrationField={
      x:u.x,y:u.y,r:240,t:6*GAME_TICK_HZ,
      dmg:Math.round(u.dmg*0.40),heal:Math.round(u.maxHp*0.04),
      hallow:true
    };
    u.ashenGuardianTimer=6*GAME_TICK_HZ;
    arena_addGoldShield(u,Math.round(u.maxHp*0.25),6*GAME_TICK_HZ,Math.round(u.maxHp*0.30),true);
    if(u.hp<u.maxHp*0.45){
      const _ahHeal=arena_applyTrackedHeal(u,Math.round(u.maxHp*0.10),u,true);
      if(_ahHeal>0)addDmg(u.x,u.y-u.size-24,'HALLOW MEND','#ff8844',{sz:12,bold:true});
    }
    for(const e of enemies){
      if(e.hp>0&&!e.isBoss&&dist(u,e)<=240){
        e.forcedTarget=u;e.forcedTargetTimer=Math.max(e.forcedTargetTimer||0,Math.round(3*GAME_TICK_HZ));
      }
    }
    addDmg(u.x,u.y-u.size-6,'ASHEN HALLOW!','#ff3344',{sz:16,bold:true});
    showFlash('ASHEN HALLOW','#cc2222',75);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:240,life:1.4,color:'#cc2222',flatten:true});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:200,life:1.2,color:'#aa1818',flatten:true});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:270,life:0.5,color:'#ffffff',flatten:true});
    for(let i=0;i<40;i++){
      const _a=Math.PI*2*i/40;
      addP(u.x+Math.cos(_a)*40,u.y+Math.sin(_a)*40,'#cc2222',2,5);
      addP(u.x+Math.cos(_a)*80,u.y+Math.sin(_a)*80,'#ff5544',1.5,4);
    }
    for(let i=0;i<8;i++){
      const _a=Math.PI*2*i/8;
      const _pr=100+Math.random()*100;
      beamFx.push({x1:u.x,y1:u.y,x2:u.x+Math.cos(_a)*_pr,y2:u.y+Math.sin(_a)*_pr,color:'#ff334488',width:3,life:0.3,maxLife:0.3,straight:true});
      addP(u.x+Math.cos(_a)*_pr,u.y+Math.sin(_a)*_pr-rnd(8,25),'#ff8844',2,4);
    }
    for(let i=0;i<20;i++){
      addP(u.x+rnd(-120,120),u.y+rnd(-120,120)-rnd(10,30),'#ff884488',1.5,3);
    }
    shake(14);
    SFX.explosion();
  }},
  beacon_of_virtue:{name:'Beacon of Virtue',cd:35,fire(u){
    if(!units.some(a=>a.isPlayer&&a.hp>0&&a!==u))return false;
    // Phase 1: Activate Beacon of Virtue Ã¢â‚¬â€ all heals splash to all allies for 10s
    u._beaconOfVirtue={timer:10*GAME_TICK_HZ,mult:1.0};
    for(const a of units){
      if(!a.isPlayer||a.hp<=0||a.isGhost)continue;
      a._beaconMark=10*GAME_TICK_HZ;
      addP(a.x,a.y,'#ffd700',12,4);
    }
    for(let i=0;i<30;i++){
      const _a=Math.PI*2*i/30;
      addP(u.x+Math.cos(_a)*30,u.y+Math.sin(_a)*30,'#ffd700',2,5);
      addP(u.x+Math.cos(_a)*50,u.y+Math.sin(_a)*50,'#ffe066',1,4);
    }
    for(let i=0;i<12;i++)addP(u.x+rnd(-4,4),u.y-i*4,'#fff7c4',1,3);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:120,life:1.2,color:'#ffd700',flatten:true});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:80,life:0.8,color:'#ffffff',flatten:true});
    addDmg(u.x,u.y-u.size-16,'BEACON OF VIRTUE','#ffd700',{sz:14,bold:true,outline:'#553300'});
    // Phase 2: Divine Toll Ã¢â‚¬â€ 5 holy shocks on lowest allies (including self)
    const allies=[];
    for(const a of units){
      if(a.hp<=0||!a.isPlayer||a.isGhost)continue;
      allies.push(a);
    }
    allies.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp));
    const count=Math.min(5,allies.length);
    for(let i=0;i<count;i++){
      const a=allies[i];
      const _heal=arena_applyHealingReceived(a,Math.round(a.maxHp*0.25));
      a.hp=Math.min(a.maxHp,a.hp+_heal);
      addHealFx(a.x,a.y,_heal,true);
      groundFx.push({x:a.x,y:a.y,r:0,maxR:50,life:0.7,color:'#ffd700'});
      addP(a.x,a.y,'#ffffff',20,6);addP(a.x,a.y,'#ffd700',12,4);addP(a.x,a.y,'#ffe066',8,3);
      projectiles.push({x:u.x,y:u.y,target:a,tx:a.x,ty:a.y,speed:1.5+i*0.2,projType:'serenityOrb',visualOnly:true,color:'#ffffff',_arrN:14,_arrSz:5,isPlayer:true,dmg:0});
      beamFx.push({x1:u.x,y1:u.y,x2:a.x,y2:a.y,life:40,maxLife:40,color:'#ffd700',width:4,straight:true});
      beamFx.push({x1:u.x,y1:u.y,x2:a.x,y2:a.y,life:35,maxLife:35,color:'#ffffff',width:2,straight:true});
      // Beacon splash: each divine toll heal also heals all other allies
      arena_beaconSplash(u,a,_heal);
    }
    addDmg(u.x,u.y-u.size-6,'DIVINE TOLL Ãƒâ€”'+count,'#ffe066',{sz:13,bold:true,outline:'#553300'});
    showFlash('DIVINE TOLL','#ffe066',60);
    shake(8);
  }},
  // ===== NAANA HOLY SIGNATURE =====
  divine_hymn:{name:'Divine Hymn',cd:30,fire(u){
    if(!units.some(a=>a.isPlayer&&a.hp>0&&a!==u))return false;
    u._divineHymn={timer:6*GAME_TICK_HZ,healPct:0.08,slowPct:0.30,radius:200};
    // Holy light pillar VFX
    groundFx.push({x:u.x,y:u.y,r:0,maxR:200,life:1.2,color:'#66ffaa',flatten:true});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:160,life:1.0,color:'#ffffff',flatten:true});
    for(let i=0;i<24;i++){const a=Math.PI*2*i/24;addP(u.x+Math.cos(a)*80,u.y+Math.sin(a)*80,'#66ffaa',1,5)}
    for(let i=0;i<16;i++)addP(u.x+rnd(-30,30),u.y+rnd(-40,10),'#ffffff',1,4);
    addDmg(u.x,u.y-u.size-4,'DIVINE HYMN!','#66ffaa');showFlash('DIVINE HYMN','#66ffaa',60);
    shake(6);
  }},
  // ===== NAANA DISCIPLINE SIGNATURE =====
  rapture:{name:'Rapture',cd:35,fire(u){
    if(!units.some(a=>a.isPlayer&&a.hp>0&&a!==u))return false;
    u._rapture={timer:8*GAME_TICK_HZ,shieldPct:0.30,refreshEvery:2*GAME_TICK_HZ,t:0};
    // Shield burst on lowest 5 allies
    const _rpAll=[];for(const a of units){if(a.isPlayer&&a.hp>0&&!a.isGhost)_rpAll.push(a)}
    _rpAll.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp));
    const _rpTargets=_rpAll.slice(0,5);
    for(const a of _rpTargets){
      const _sh=Math.round(a.maxHp*0.30);
      a._raptureShield={hp:_sh,max:_sh};
      addP(a.x,a.y,'#ffaadd',18,5);
      addP(a.x,a.y,'#ffffff',10,3);
      beamFx.push({x1:u.x,y1:u.y,x2:a.x,y2:a.y,life:0.3,maxLife:0.3,color:'#ffaadd',width:3,straight:true});
      groundFx.push({x:a.x,y:a.y,r:0,maxR:a.size*1.5,life:0.3,color:'#ffaadd'});
    }
    groundFx.push({x:u.x,y:u.y,r:0,maxR:250,life:0.6,color:'#ffaadd'});
    addDmg(u.x,u.y-u.size-4,'RAPTURE!','#ffaadd');showFlash('RAPTURE','#ffaadd',60);
    shake(8);
  }},
  // ===== NAANA SHADOW SIGNATURE Ã¢â‚¬â€ VOID TORRENT =====
  void_torrent:{name:'Void Torrent',cd:15,fire(u){
    const _vtTargets=[];
    const _sorted=[...enemies].filter(e=>e.hp>0).sort((a,b)=>dist(u,a)-dist(u,b));
    for(let i=0;i<Math.min(3,_sorted.length);i++)_vtTargets.push(_sorted[i]);
    if(_vtTargets.length===0)return false;
    u._voidTorrent={timer:4*GAME_TICK_HZ,maxTimer:4*GAME_TICK_HZ,targets:_vtTargets,pulseCD:0,pulseEvery:Math.round(0.8*GAME_TICK_HZ),
      dmgPerPulse:Math.round(u.dmg*1.40),splashDmg:Math.round(u.dmg*0.95),splashRadius:70};
    u._channeling=true;
    for(const t of _vtTargets){groundFx.push({x:t.x,y:t.y,r:0,maxR:70,life:0.8,color:'#3a0a5a'})}
    for(let i=0;i<16;i++)addP(u.x+rnd(-15,15),u.y+rnd(-15,15),'#aa66ff',1,4);
    addDmg(u.x,u.y-u.size-4,'VOID TORRENT!','#aa66ff');showFlash('VOID TORRENT','#aa66ff',60);
    shake(8);
  }},
  // ===== NAANA LEGACY SIGNATURES (kept for compat) =====
  beacon_of_light:{name:'Beacon of Light',cd:25,fire(u){
    let target=null,bestPct=Infinity;
    for(const a of units){if(a===u||a.hp<=0||!a.isPlayer||a.isGhost)continue;const p=a.hp/a.maxHp;if(p<bestPct){bestPct=p;target=a}}
    if(!target)return false;
    const bx=target.x,by=target.y,_radius=140,_dur=6*GAME_TICK_HZ,_hpsPerTick=Math.round(u.dmg*0.40);
    groundFx.push({x:bx,y:by,r:0,maxR:_radius,life:1.4,color:'#ffffaa',flatten:true});
    if(!arena.beacons)arena.beacons=[];
    arena.beacons.push({x:bx,y:by,r:_radius,t:_dur,hps:_hpsPerTick,from:u});
    addDmg(bx,by-30,'BEACON OF LIGHT','#ffe066');showFlash('BEACON OF LIGHT','#ffe066',45);
  }},
  mind_blast_storm:{name:'Mind Blast Storm',cd:25,fire(u){
    const _maxBolts=5;
    const _baseDmg=Math.round(u.dmg*3.0);
    const hit=new Set();
    let _fired=0;
    // Dark void implosion VFX at caster
    groundFx.push({x:u.x,y:u.y,r:0,maxR:60,life:0.5,color:'#3a0a5a'});
    for(let i=0;i<12;i++)addP(u.x+rnd(-20,20),u.y+rnd(-20,20),'#6622aa',1,4);
    for(let i=0;i<_maxBolts;i++){
      let cur=null,curD=Infinity;
      for(const e of enemies){
        if(e.hp<=0||hit.has(e))continue;
        const _d=dist(u,e);
        if(_d<curD&&_d<280){curD=_d;cur=e}
      }
      if(!cur)break;
      hit.add(cur);
      dealDamage(cur,_baseDmg,u,'magic');
      // Shadow bolt trail with void particles
      for(let s=1;s<=8;s++){
        const _f=s/8;
        const px=u.x+(cur.x-u.x)*_f,py=u.y+(cur.y-u.y)*_f;
        addP(px+rnd(-4,4),py+rnd(-4,4),'#7744bb',1,3);
        addP(px+rnd(-6,6),py+rnd(-6,6),'#3a0a5a',1,2);
      }
      // Impact explosion at target
      addP(cur.x,cur.y,'#aa66ff',20,6);
      addP(cur.x,cur.y,'#1a0a2a',12,4);
      groundFx.push({x:cur.x,y:cur.y,r:0,maxR:35,life:0.3,color:'#6622aa'});
      if(!cur.stunned&&!cur.isBoss){cur.stunned=30;cur.stunnedTimer=30}
      _fired++;
    }
    if(_fired===0)return false;
    addDmg(u.x,u.y-u.size,'MIND BLAST STORM','#aa66ff');
    showFlash('MIND BLAST STORM','#aa66ff',45);
    shake(8);
  }},
  // ===== BAKDOUNES BALANCE (Phase 2.6) SIGNATURE =====
  // Starfall Ã¢â‚¬â€ rains 16 stars across a 200 px radius around the most distant
  // enemy cluster. Each star deals magic damage on landing. Tier 3 (cd:30 Ã¢â€ â€™ 35s).
  starfall:{name:'Starfall',cd:30,fire(u){
    // Pick center-of-mass for enemies in range
    let cx=0,cy=0,n=0;
    for(const e of enemies){if(e.hp>0&&dist(u,e)<350){cx+=e.x;cy+=e.y;n++}}
    if(n===0)return false;
    cx/=n;cy/=n;
    const _starCount=16;
    const _radius=200;
    const _starDmg=Math.round(u.dmg*1.4);
    for(let i=0;i<_starCount;i++){
      const _ang=Math.random()*Math.PI*2;
      const _r=Math.random()*_radius;
      const _sx=cx+Math.cos(_ang)*_r,_sy=cy+Math.sin(_ang)*_r;
      // Ground impact mark + AoE damage at the star's landing point
      groundFx.push({x:_sx,y:_sy,r:0,maxR:30,life:0.4,color:'#88aaff',flatten:true});
      addP(_sx,_sy,'#aaccff',8,4);
      for(const e of enemies){
        if(e.hp<=0)continue;
        if(Math.hypot(e.x-_sx,e.y-_sy)<=30){
          dealDamage(e,_starDmg,u,'magic');
        }
      }
    }
    groundFx.push({x:cx,y:cy,r:0,maxR:_radius,life:0.6,color:'#5a40b8',flatten:true});
    addDmg(cx,cy-30,'STARFALL!','#aaccff');
    showFlash('STARFALL','#aaccff',60);
    shake(8);
  }},
  // ===== BAKDOUNES FERAL (Phase 2.6) SIGNATURE =====
  // Berserk Ã¢â‚¬â€ 8s self-buff: +60% atkSpd + +30% damage. Reuses bloodlust-style
  // self timers. Tier 3 (cd:30 Ã¢â€ â€™ 35s). Solo melee buff, doesn't affect squad.
  berserk_druid:{name:'Berserk',cd:30,fire(u){
    u.berserkTimer=8*GAME_TICK_HZ;
    u._origAtkSpdBerserk=u._origAtkSpdBerserk||u.atkSpd;
    u._origDmgBerserk=u._origDmgBerserk||u.dmg;
    u.atkSpd=Math.max(8,Math.round(u._origAtkSpdBerserk*0.625)); // +60% faster
    u.dmg=Math.round(u._origDmgBerserk*1.30);
    addP(u.x,u.y,'#ff8866',24,5);
    addP(u.x,u.y,'#cc4422',12,4);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:50,life:0.5,color:'#cc4422'});
    addDmg(u.x,u.y-u.size,'BERSERK!','#ff8866');
    showFlash('BERSERK','#ff8866',45);
    shake(4);
  }},
  death_from_above:{name:'Death from Above',cd:25,fire(u){
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<155))return false;
    u.dfaTimer=60;u.dfaX=u.x;u.dfaY=u.y;u.untargetable=true;u.dfaPhase='rising';
    u._dfaOrigY=u.y;
    addP(u.x,u.y,'#440044',24,5);addDmg(u.x,u.y-u.size-4,'DEATH FROM ABOVE!','#ff4466');
    showFlash('DEATH FROM ABOVE','#ff4466',60);
  }},
  omnislash:{name:'Omnislash',cd:20,fire(u){
    const _meleeR=(u.range||36)+30;
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<=_meleeR))return false;
    const targets=[];
    for(const e of enemies){if(e.hp>0&&dist(u,e)<135)targets.push(e)}
    targets.sort((a,b)=>dist(u,a)-dist(u,b));
    const hits=Math.min(6,targets.length);
    if(!hits)return false;
    u._omnislashTargets=targets.slice(0,hits);u._omnislashIdx=0;u._omnislashTimer=0;
    u._omnislashDur=6;u._omnislashActive=true;u.untargetable=true;
    u._omnislashImmune=true;
    u._omnislashMaxStep=135;
    u._omniFromX=u.x;u._omniFromY=u.y;
    for(let i=0;i<3;i++)groundFx.push({x:u.x,y:u.y,r:0,maxR:55+i*18,life:0.35+i*0.12,color:i===1?'#ffffff':'#ffcc00'});
    arena_jazarGuard(u,Math.round(3*GAME_TICK_HZ),0.35);
    showFlash('OMNISLASH!','#ff8800',60);shake(6);
  }},
  // ----- BASE RANGED/CASTER SIGNATURES -----
  fireball:{name:'Fireball',cd:15,fire(u){
    let best=null,bestHp=0;
    for(const e of enemies){if(e.hp<=0)continue;if(dist(u,e)>250)continue;if(e.hp>bestHp){bestHp=e.hp;best=e}}
    if(best){bombs.push({x:u.x,y:u.y,fromX:u.x,fromY:u.y,tx:best.x,ty:best.y,t:0,dur:30,dmg:Math.round(u.dmg*3),radius:60,attacker:u,isPlayer:true,color:'#ff6600'});addDmg(u.x,u.y-u.size-4,'FIREBALL!','#ff6600');addP(u.x,u.y,'#ff6600',16,4)}
  }},
  curse_nova:{name:'Curse Nova',cd:20,fire(u){
    let _hit=0;
    for(const e of enemies){if(e.hp<=0)continue;if(dist(u,e)>150)continue;e.cursedTimer=240;e.cursedMult=1.5;_hit++;addP(e.x,e.y,'#9b59b6',8,3)}
    if(_hit){groundFx.push({x:u.x,y:u.y,r:0,maxR:150,life:0.5,color:'#9b59b6'});addDmg(u.x,u.y-u.size-4,'CURSE NOVA!','#cc99ff');shake(5)}
  }},
  barrage:{name:'Barrage',cd:20,fire(u){
    u._barrageQueue=5;u._barrageTimer=0;
    addDmg(u.x,u.y-u.size-4,'BARRAGE!','#ffd700');
  }},
  omega_cannon:{name:'Omega Cannon',cd:30,fire(u){
    let best=null,bestHp=0;
    for(const e of enemies){if(e.hp>0){if(e.hp>bestHp){bestHp=e.hp;best=e}}}
    if(!best)return false;
    const _ocDmg=Math.round(u.dmg*6.0);
    dealDamage(best,_ocDmg,u,'magic');
    if(!best.isBoss)best.silenced=Math.max(best.silenced||0,3*GAME_TICK_HZ);
    let _ocSplash=0;
    for(const e of enemies){
      if(e===best||e.hp<=0)continue;
      if(dist(best,e)<=70){
        dealDamage(e,Math.round(u.dmg*1.6),u,'magic');
        e.slowTimer=Math.max(e.slowTimer||0,2*GAME_TICK_HZ);e.slowMult=Math.min(e.slowMult||1,0.55);
        if(e.range>60&&!e.isBoss)e.silenced=Math.max(e.silenced||0,1*GAME_TICK_HZ);
        e._rommanaMarkedTimer=Math.max(e._rommanaMarkedTimer||0,3*GAME_TICK_HZ);e._rommanaMarkedAmp=0.10;e._rommanaMarkedSource=u;
        addP(e.x,e.y,'#44ccff',8,3);_ocSplash++;
      }
    }
    for(let i=0;i<20;i++){const f=i/20;addP(u.x+(best.x-u.x)*f+rnd(-3,3),u.y+(best.y-u.y)*f+rnd(-3,3),'#44ccff',2,4)}
    addP(best.x,best.y,'#44ccff',32,6);
    groundFx.push({x:best.x,y:best.y,r:0,maxR:70,life:0.55,color:'#44ccff'});
    groundFx.push({x:best.x,y:best.y,r:0,maxR:38,life:0.35,color:'#ffffff'});
    if(_ocSplash)addDmg(best.x,best.y+18,'FIELD x'+_ocSplash,'#44ccff',{sz:11,bold:true});
    addDmg(u.x,u.y-u.size-4,'OMEGA CANNON!','#44ccff');showFlash('OMEGA CANNON!','#44ccff',70);
    shake(10);
  }},
  // ----- BASE HEALER SIGNATURES -----
  mass_heal:{name:'Mass Heal',cd:20,fire(u){
    let _hit=0;
    for(const a of units){
      if(!a.isPlayer||a.hp<=0||a.isGhost)continue;
      if(dist(u,a)>200)continue;
      const heal=arena_applyTrackedHeal(a,Math.round(a.maxHp*0.30),u,false);_hit++;
      addP(a.x,a.y,'#3aff66',8,3);
    }
    if(_hit){groundFx.push({x:u.x,y:u.y,r:0,maxR:200,life:0.5,color:'#3aff66'});addDmg(u.x,u.y-u.size-4,'MASS HEAL!','#3aff66');showFlash('MASS HEAL','#3aff66',45)}
  }},
  healing_wave:{name:'Healing Wave',cd:15,fire(u){
    const a=arena_findLowestAlly(u,300,null);
    if(a){
      const heal=arena_applyTrackedHeal(a,Math.round(a.maxHp*0.50),u,false);
      a.poisonTimer=0;a.bleedTimer=0;a.burnTimer=0;a.slowTimer=0;a.slowMult=1;
      addP(a.x,a.y,'#88ffaa',24,5);addDmg(a.x,a.y-a.size,'HEALING WAVE!','#88ffaa');
    }
  }},
  // ----- HABAQ AROMANCER SIGNATURES -----
  herbal_tempest:{name:'Herbal Tempest',cd:40,fire(u){
    let _needHeal=0;
    for(const a of units){if(a.isPlayer&&a.hp>0&&!a.isGhost&&!a.isMinion&&a.hp<a.maxHp*0.70)_needHeal++}
    if(_needHeal===0)return false;
    if(!u._aromaStatues)u._aromaStatues=[];
    const _burstHeal=Math.round((u.healAmt||60)*0.85);
    for(const st of u._aromaStatues){
      for(const a of units){
        if(!a.isPlayer||a.hp<=0||a.isGhost)continue;
        if(dist({x:st.x,y:st.y},a)<=100)arena_applyTrackedHeal(a,_burstHeal,u,false);
      }
      for(let i=0;i<16;i++)addP(st.x+rnd(-14,14),st.y+rnd(-14,6),'#88cc66',1,5);
      groundFx.push({x:st.x,y:st.y,r:0,maxR:100,life:0.5,color:'#88cc66'});
    }
    u._aromaStatues=[];
    const _empHeal=Math.round((u.healAmt||60)*0.50);
    const _empDur=8*GAME_TICK_HZ;
    const _empBolt=Math.round(0.65*GAME_TICK_HZ);
    for(let i=0;i<4;i++){
      const ang=Math.PI*2*i/4,r=rnd(30,55);
      const sx=u.x+Math.cos(ang)*r,sy=u.y+Math.sin(ang)*r;
      u._aromaStatues.push({x:sx,y:sy,timer:_empDur,maxTimer:_empDur,boltCD:0,boltEvery:_empBolt,healAmt:_empHeal,born:getFrame()});
      addP(sx,sy-8,'#aaffaa',8,4);
    }
    for(let w=0;w<3;w++)groundFx.push({x:u.x,y:u.y,r:0,maxR:80+w*50,life:0.5+w*0.2,color:w%2===0?'#88cc66':'#aaffaa'});
    for(let i=0;i<40;i++){const ang=Math.random()*Math.PI*2,r=rnd(5,70);addP(u.x+Math.cos(ang)*r,u.y+Math.sin(ang)*r,'#88cc66',1,6)}
    addDmg(u.x,u.y-u.size-8,'HERBAL TEMPEST!','#88cc66');showFlash('HERBAL TEMPEST','#88cc66',80);shake(7);
  }},
  elixir_of_life:{name:'Elixir of Life',cd:50,fire(u){
    let _needHeal=0;
    for(const a of units){if(a.isPlayer&&a.hp>0&&!a.isGhost&&!a.isMinion&&a.hp<a.maxHp*0.65)_needHeal++}
    if(_needHeal===0)return false;
    u._elixirTimer=10*GAME_TICK_HZ;u._elixirHeal=Math.round((u.healAmt||60)*0.6);
    for(let i=0;i<48;i++){const ang=Math.PI*2*i/48,r=rnd(5,30);addP(u.x+Math.cos(ang)*r,u.y+Math.sin(ang)*r,'#ffd700',1,6)}
    for(let i=0;i<24;i++)addP(u.x+rnd(-15,15),u.y-rnd(10,50),'#ffe066',1,5);
    for(let w=0;w<4;w++)groundFx.push({x:u.x,y:u.y,r:0,maxR:60+w*40,life:0.6+w*0.15,color:w%2===0?'#ffd700':'#ffe066'});
    addDmg(u.x,u.y-u.size-8,'ELIXIR OF LIFE!','#ffd700');showFlash('ELIXIR OF LIFE','#ffd700',100);shake(8);
  }},
  pandemic:{name:'Pandemic',cd:35,fire(u){
    let _hasPoisoned=false;
    for(const e of enemies){if(e.hp>0&&e.toxicBrewStacks>0){_hasPoisoned=true;break}}
    if(!_hasPoisoned)return false;
    let _hit=0;
    for(const e of enemies){
      if(e.hp<=0||!e.toxicBrewStacks||e.toxicBrewStacks<=0)continue;
      e.toxicBrewStacks=Math.min(12,e.toxicBrewStacks*2);
      const _burst=Math.round(u.dmg*2.6);
      dealDamage(e,_burst,u,'magic');
      addP(e.x,e.y,'#aa55dd',16,5);
      groundFx.push({x:e.x,y:e.y,r:0,maxR:95,life:0.65,pandemicCloudFx:true,color:'#aa55dd',altColor:'#55aa33'});
      for(const e2 of enemies){
        if(e2===e||e2.hp<=0)continue;
        if(dist(e,e2)<=95){
          e2.toxicBrewStacks=Math.min(12,(e2.toxicBrewStacks||0)+Math.ceil(e.toxicBrewStacks/2));
          e2.toxicBrewTimer=4*GAME_TICK_HZ;e2.toxicBrewDmg=e.toxicBrewDmg||Math.round(u.dmg*0.15);e2.toxicBrewSource=u;
          addP(e2.x,e2.y,'#9a55cc',8,3);
          beamFx.push({x1:e.x,y1:e.y,x2:e2.x,y2:e2.y,life:0.45,maxLife:0.45,color:'#66ff66',width:3,straight:false});
        }
      }
      _hit++;
    }
    if(_hit){
      groundFx.push({x:u.x,y:u.y,r:0,maxR:230,life:0.85,pandemicCloudFx:true,color:'#7a3a9a',altColor:'#55aa33'});
      addDmg(u.x,u.y-u.size-4,'PANDEMIC!','#aa55dd');showFlash('PANDEMIC','#aa55dd',75);shake(10);
    }
  }},
  heros_charge:{name:"Hero's Charge",cd:20,fire(u){
    // Bug fix: was teleporting Vodka to FARTHEST enemy which broke his leash
    // hard. Now leap to NEAREST enemy within 250 px (cap), bounded by leash.
    let best=null,bestD=Infinity;
    for(const e of enemies){if(e.hp<=0)continue;const d=dist(u,e);if(d<=160&&d<bestD){bestD=d;best=e}}
    if(!best)return;
    const fromX=u.x,fromY=u.y;
    // Leap to target Ã¢â‚¬â€ arena_clampToLeash keeps the unit inside its leash box
    // on BOTH axes so it can't get stranded sideways past LEASH_SIDE.
    const land=limitBurstLanding(u,best.x,best.y,140);
    u.x=land.x;u.y=land.y;arena_clampToLeash(u);
    for(const e of enemies){if(e.hp<=0)continue;if(dist(u,e)<=120)dealDamage(e,Math.round(u.dmg*2),u,'normal')}
    if(u.champion){u._origChampionMult=u._origChampionMult||u.champion.mult;u.champion.mult=u._origChampionMult*1.5;u.championBoostTimer=240}
    addP(fromX,fromY,'#ffd700',16,4);addP(u.x,u.y,'#ffd700',32,6);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:120,life:0.5,color:'#ffd700'});
    addDmg(u.x,u.y-u.size-4,"HERO'S CHARGE!",'#ffd700');showFlash("HERO'S CHARGE",'#ffd700',60);shake(12);
  }},
  // ===== BRANCH SIGNATURES =====
  aegis_wall:{name:'Aegis Wall',cd:40,fire(u){
    u.aegisShieldTimer=240;u.aegisReflect=true;
    showFlash('AEGIS WALL','#ffd700',60);addDmg(u.x,u.y-u.size-4,'AEGIS WALL!','#ffd700');shake(8);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:60,life:1.0,color:'#ffd700'});
  }},
  bloodfury_smash:{name:'Bloodfury Smash',cd:25,fire(u){
    // Gate: only leap if there's an enemy within reasonable leap distance.
    // Otherwise the unit jumps to wherever and gets stuck (leash breaks).
    // Also: leap target must be IN FRONT (toward enemies, not behind).
    let best=null,bestD=Infinity;
    for(const e of enemies){if(e.hp<=0)continue;const d=dist(u,e);if(d>165||d<bestD)continue;if(d<bestD){bestD=d;best=e}}
    // Re-find: scan within 200 px only
    best=null;bestD=Infinity;
    for(const e of enemies){if(e.hp<=0)continue;const d=dist(u,e);if(d<=165&&d<bestD){bestD=d;best=e}}
    if(!best)return false;
    const fromX=u.x,fromY=u.y;
    // Leap to target Ã¢â‚¬â€ arena_clampToLeash keeps both axes inside the leash box.
    // (Previous bespoke clamp had an X-axis bug Ã¢â‚¬â€ used homeY for the X cap Ã¢â‚¬â€
    // which let Malfof teleport sideways outside leash and freeze.)
    const land=limitBurstLanding(u,best.x,best.y+12,140);
    u.x=land.x;u.y=land.y;arena_clampToLeash(u);
    for(const e of enemies){if(e.hp<=0)continue;if(dist(u,e)<=100){dealDamage(e,Math.round(u.dmg*2.5),u,'normal');if(!e.isBoss)e.stunned=Math.max(e.stunned||0,30)}}
    if(u.frenzy){u.frenzyForceActiveTimer=300}
    addP(fromX,fromY,'#ff3a3a',16,4);addP(u.x,u.y,'#ff3a3a',32,6);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:100,life:0.5,color:'#ff3a3a'});
    addDmg(u.x,u.y-u.size-4,'BLOODFURY!','#ff3a3a');shake(10);
  }},
  citadel_wall:{name:'Citadel Wall',cd:45,fire(u){
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<=230))return false;
    u.citadelWallTimer=4*GAME_TICK_HZ;
    arena_addZavsLineShield(u,Math.round(u.maxHp*0.20),4*GAME_TICK_HZ);
    if(u.hp<u.maxHp*0.45){
      const _ch=arena_applyTrackedHeal(u,Math.round(u.maxHp*0.08),u,false);
      if(_ch>0)addDmg(u.x,u.y-u.size-24,'CITADEL HEAL','#d6b45f',{sz:11,bold:true});
    }
    for(const e of enemies){
      if(e.hp>0&&!e.isBoss&&dist(u,e)<=200){
        e.forcedTarget=u;e.forcedTargetTimer=3*GAME_TICK_HZ;
      }
    }
    addP(u.x,u.y,'#d6b45f',36,6);addP(u.x,u.y,'#ffffff',18,4);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:160,life:0.8,color:'#d6b45f'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:95,life:0.6,color:'#cfd6df'});
    for(let i=0;i<9;i++){
      const a=-Math.PI*0.9+(i/8)*Math.PI*0.8;
      beamFx.push({x1:u.x+Math.cos(a)*24,y1:u.y+Math.sin(a)*14,x2:u.x+Math.cos(a)*112,y2:u.y+Math.sin(a)*55,color:'#d6b45f',width:3,life:0.45,maxLife:0.45,straight:true});
    }
    addDmg(u.x,u.y-u.size-8,'CITADEL WALL!','#d6b45f',{sz:16,bold:true});
    showFlash('CITADEL WALL','#d6b45f',60);shake(10);SFX.shieldBlock();
  }},
  bannerfall_crash:{name:'Bannerfall Crash',cd:45,fire(u){
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<220))return false;
    let bestX=u.x,bestY=u.y,bestScore=-1;
    for(const e of enemies){
      if(e.hp<=0)continue;
      let cnt=0,hpScore=0;
      for(const e2 of enemies){if(e2.hp>0&&dist(e,e2)<=130){cnt++;hpScore+=e2.hp/e2.maxHp}}
      const score=cnt*100+hpScore*20-(dist(u,e)*0.05);
      if(score>bestScore){bestScore=score;bestX=e.x;bestY=e.y}
    }
    u.bannerfallCrashActive=true;
    u.bannerfallCrashPhase='ascend';
    u.bannerfallCrashT=0;
    u.bannerfallFromX=u.x;u.bannerfallFromY=u.y;
    u.bannerfallTargetX=bestX;u.bannerfallTargetY=bestY;
    u.untargetable=true;
    addP(u.x,u.y,'#ffe066',24,5);
    addDmg(u.x,u.y-u.size-6,'BANNERFALL!','#ffe066',{sz:15,bold:true});
    showFlash('BANNERFALL CRASH','#ffe066',55);
  }},
  living_bulwark:{name:'Living Bulwark',cd:45,fire(u){
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<=240))return false;
    u.livingBulwarkTimer=5*GAME_TICK_HZ;
    arena_addBatataShield(u,Math.round(u.maxHp*0.22),5*GAME_TICK_HZ);
    for(const e of enemies){
      if(e.hp>0&&!e.isBoss&&dist(u,e)<=160)arena_applyMuddied(e,u,Math.round(1.5*GAME_TICK_HZ),0.70,0.88);
    }
    addP(u.x,u.y,'#6fbf5a',34,6);addP(u.x,u.y,'#8a6a32',24,5);
    for(let i=0;i<10;i++){
      const a=Math.PI*2*i/10;
      beamFx.push({x1:u.x+Math.cos(a)*22,y1:u.y+Math.sin(a)*12,x2:u.x+Math.cos(a)*145,y2:u.y+Math.sin(a)*90,color:'#8a6a32',width:3,life:0.45,maxLife:0.45,straight:true});
    }
    groundFx.push({x:u.x,y:u.y,r:0,maxR:160,life:0.8,color:'#6fbf5a'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:105,life:0.55,color:'#8a6a32'});
    addDmg(u.x,u.y-u.size-8,'LIVING BULWARK!','#6fbf5a',{sz:15,bold:true});
    showFlash('LIVING BULWARK','#6fbf5a',60);shake(8);SFX.shieldBlock();
  }},
  quakebreak_rampart:{name:'Quakebreak Rampart',cd:45,fire(u){
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<=240))return false;
    u.quakebreakRampartTimer=5*GAME_TICK_HZ;
    arena_addBatataShield(u,Math.round(u.maxHp*0.20),5*GAME_TICK_HZ);
    for(const e of enemies){
      if(e.hp>0&&!e.isBoss&&dist(u,e)<=150){
        arena_applyMuddied(e,u,Math.round(2*GAME_TICK_HZ),0.65,0.86);
        e.mudbreakerRoarTimer=Math.max(e.mudbreakerRoarTimer||0,Math.round(2*GAME_TICK_HZ));
        e.mudbreakerRoarMult=Math.min(e.mudbreakerRoarMult||1,0.88);
      }
    }
    addP(u.x,u.y,'#b0793a',42,7);addP(u.x,u.y,'#5a3c1a',24,5);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:150,life:0.8,color:'#b0793a'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:85,life:0.5,color:'#6fbf5a'});
    for(let i=0;i<16;i++){const a=Math.PI*2*i/16;addP(u.x+Math.cos(a)*80,u.y+Math.sin(a)*50,'#8a6a32',2,4)}
    addDmg(u.x,u.y-u.size-8,'QUAKEBREAK!','#b0793a',{sz:15,bold:true});
    showFlash('QUAKEBREAK RAMPART','#b0793a',60);shake(10);SFX.bossSlam();
  }},
  last_stand_sig:{name:'Last Stand',cd:50,fire(u){
    // Passive-triggered: hooks into dealDamage Ã¢â‚¬â€ on lethal hit, revive at 50% HP + 3s invuln + AoE taunt
    // This fire() is a manual activation as a panic button
    if(u.hp>u.maxHp*0.35)return false; // only fires when low
    u.hp=Math.round(u.maxHp*0.50);
    u.lastStandSigTimer=3*GAME_TICK_HZ;
    u.lastStandSigUsed=true;
    // AoE taunt Ã¢â‚¬â€ force nearby enemies to target this unit
    for(const e of enemies){if(e.hp>0&&dist(u,e)<200){e.forcedTarget=u;e.forcedTargetTimer=3*GAME_TICK_HZ;}}
    addP(u.x,u.y,'#ff4444',32,6);addP(u.x,u.y,'#ffd700',24,5);addP(u.x,u.y,'#ffffff',16,4);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:100,life:0.8,color:'#ff4444'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:200,life:0.5,color:'#ffd700'});
    addDmg(u.x,u.y-u.size-6,'LAST STAND!','#ff4444');
    showFlash('LAST STAND!','#ff4444',60);
    shake(12);
  }},
  meteor_slam:{name:'Meteor Slam',cd:45,fire(u){
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<200))return false;
    u.meteorSlamActive=true;
    u.meteorSlamPhase='ascend';
    u.meteorSlamT=0;
    u.meteorSlamFromX=u.x;u.meteorSlamFromY=u.y;
    u.untargetable=true;
    // Find best crash target Ã¢â‚¬â€ cluster of enemies
    let bestX=u.x,bestY=u.y,bestCount=0;
    for(const e of enemies){
      if(e.hp<=0)continue;
      let cnt=0;
      for(const e2 of enemies){if(e2.hp>0&&dist(e,e2)<120)cnt++;}
      if(cnt>bestCount){bestCount=cnt;bestX=e.x;bestY=e.y;}
    }
    u.meteorSlamTargetX=bestX;u.meteorSlamTargetY=bestY;
    addP(u.x,u.y,'#ffaa44',24,5);
    addDmg(u.x,u.y-u.size-6,'METEOR SLAM!','#ffaa44');
    showFlash('METEOR SLAM!','#ffaa44',60);
  }},
  mage_ward:{name:'Mage Ward',cd:35,fire(u){
    u.mageWardZone={x:u.x,y:u.y,r:200,t:360};
    addP(u.x,u.y,'#5a8aff',24,5);groundFx.push({x:u.x,y:u.y,r:0,maxR:200,life:0.6,color:'#5a8aff'});
    addDmg(u.x,u.y-u.size-4,'MAGE WARD!','#5a8aff');showFlash('MAGE WARD','#5a8aff',45);
  }},
  death_coil:{name:'Death Coil',cd:25,fire(u){
    const cands=[];
    for(const e of enemies){if(e.hp>0&&!e.isBoss)cands.push({e,d:dist(u,e)})}
    cands.sort((a,b)=>b.d-a.d);
    for(let i=0;i<Math.min(3,cands.length);i++){
      const e=cands[i].e;
      const dx=u.x-e.x,dy=u.y-e.y,dd=Math.hypot(dx,dy)||1;
      e.x=u.x-dx/dd*40;e.y=u.y-dy/dd*40;clampToArena(e);
      e.bleedTimer=300;e.bleedDmg=80;e.bleedFrom=u;
      e.stunned=Math.max(e.stunned||0,30);
      addP(e.x,e.y,'#aa2222',12,4);
    }
    addDmg(u.x,u.y-u.size-4,'DEATH COIL!','#aa2222');shake(8);
  }},
  // ===== TAOON (Death Knight) SIGNATURES =====
  crimson_covenant:{name:'Crimson Covenant',cd:45,fire(u){
    const near=enemies.filter(e=>e.hp>0&&dist(u,e)<=190).sort((a,b)=>dist(u,a)-dist(u,b));
    if(!near.length)return false;
    u.crimsonCovenantTimer=5*GAME_TICK_HZ;
    u.crimsonCovenantTick=0;
    u.crimsonCovenantTargets=near.slice(0,5);
    u.crimsonCovenantDmg=Math.max(1,Math.round(u.dmg*0.30));
    arena_addTaoonBloodShield(u,Math.round(u.maxHp*0.20),5*GAME_TICK_HZ,0);
    if(u.hp<u.maxHp*0.50){
      const _bh=arena_applyTrackedHeal(u,Math.round(u.maxHp*0.09),u,false);
      if(_bh>0)addDmg(u.x,u.y-u.size-24,'BLOOD MEND','#ff6688',{sz:11,bold:true});
    }
    addP(u.x,u.y,'#cc2244',34,6);addP(u.x,u.y,'#111111',16,4);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:165,life:0.75,color:'#cc2244'});
    addDmg(u.x,u.y-u.size-4,'CRIMSON COVENANT!','#ff4466',{sz:15,bold:true});
    showFlash('CRIMSON COVENANT','#cc2244',60);
    shake(10);
  }},
  maw_of_the_grave:{name:'Maw of the Grave',cd:45,fire(u){
    const p=arena_findBestEnemyClusterPoint(u,420,135);
    if(!p)return false;
    u.mawOfGrave={x:p.x,y:p.y,r:135,t:Math.round(4.5*GAME_TICK_HZ),tick:0,from:u,dmg:Math.max(1,Math.round(u.dmg*0.18))};
    arena_addTaoonBloodShield(u,Math.round(u.maxHp*0.16),Math.round(4.5*GAME_TICK_HZ),0);
    addP(p.x,p.y,'#8a66ff',30,6);addP(p.x,p.y,'#44c7ff',14,4);
    groundFx.push({x:p.x,y:p.y,r:0,maxR:135,life:0.8,color:'#7b3fd1'});
    groundFx.push({x:p.x,y:p.y,r:0,maxR:72,life:0.55,color:'#44c7ff'});
    addDmg(p.x,p.y-26,'MAW OF THE GRAVE!','#bb99ff',{sz:15,bold:true});
    showFlash('MAW OF THE GRAVE','#7b3fd1',60);
    shake(10);
  }},
  heart_of_earth:{name:'Heart of Earth',cd:45,fire(u){
    if(u.hp>u.maxHp*0.40)return false;
    u.heartOfEarthTimer=300;u.heartOfEarthHealEvery=30;
    showFlash('HEART OF EARTH','#a06030',75);addDmg(u.x,u.y-u.size-4,'HEART OF EARTH!','#cc8855');
    groundFx.push({x:u.x,y:u.y,r:0,maxR:200,life:1.0,color:'#a06030'});
  }},
  force_of_nature:{name:'Force of Nature',cd:35,fire(u){
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<200))return false;
    const _treeCount=3;
    for(let i=0;i<_treeCount;i++){
      const _tx=u.x+rnd(-60,60),_ty=u.y+rnd(-40,40);
      const _treant={
        x:_tx,y:_ty,hp:Math.round(u.maxHp*0.3),maxHp:Math.round(u.maxHp*0.3),
        dmg:Math.round(u.dmg*0.6),atkSpd:50,range:45,speed:0.2,
        size:14,color:'#2a6e2a',accent:'#1a4a1a',armor:Math.round(u.armor*0.5),magicRes:0,
        isPlayer:true,isMinion:true,parent:u,cd:0,facing:1,bobPhase:Math.random()*Math.PI*2,
        treant:true,lifeTicks:12*GAME_TICK_HZ,
        drawFn:'drawTreant',debuffs:{},spawnFrame:getFrame()
      };
      units.push(_treant);
      addP(_tx,_ty,'#33cc33',16,5);addP(_tx,_ty+10,'#228822',8,3);
      groundFx.push({x:_tx,y:_ty,r:0,maxR:30,life:0.5,color:'#33aa33'});
    }
    addDmg(u.x,u.y-u.size-4,'FORCE OF NATURE!','#33cc33');
    showFlash('FORCE OF NATURE!','#33cc33',60);shake(8);
  }},
  primal_wrath:{name:'Primal Wrath',cd:25,fire(u){
    let _hasNear=false;
    for(const e of enemies){if(e.hp>0&&dist(u,e)<=120){_hasNear=true;break}}
    if(!_hasNear)return false;
    let _hit=0;
    for(const e of enemies){
      if(e.hp<=0)continue;
      if(dist(u,e)<=120){
        e.primalWrathBleed={timer:300,dmg:Math.round(u.dmg*1.5),source:u};
        addP(e.x,e.y,'#6b8e23',12,4);_hit++;
      }
    }
    if(_hit){groundFx.push({x:u.x,y:u.y,r:0,maxR:120,life:0.6,color:'#6b8e23'});addDmg(u.x,u.y-u.size-4,'PRIMAL WRATH!','#6b8e23');shake(10)}
  }},
  shadow_reaping:{name:'Shadow Reaping',cd:35,fire(u){
    // Bug fix: previously teleported Zayton to enemy's position which often
    // stranded him outside leash. New design: NO teleport Ã¢â‚¬â€ fire a shadow
    // bolt at the highest-HP enemy from current position. Visual: dark
    // crescent slash at target + blood splash + back-stab number.
    let best=null,bestHp=0;
    for(const e of enemies){if(e.hp<=0)continue;if(e.hp>bestHp){bestHp=e.hp;best=e}}
    if(!best)return;
    const dmg=Math.round((best.maxHp||100)*0.15);
    dealDamage(best,dmg,u,'normal');
    // Shadow trail particles caster Ã¢â€ â€™ target
    for(let i=1;i<=8;i++){
      const px=u.x+(best.x-u.x)*(i/8),py=u.y+(best.y-u.y)*(i/8);
      addP(px,py,'#aa4adc',1,3);
    }
    addP(best.x,best.y,'#aa4adc',24,5);
    addP(best.x,best.y,'#000000',16,4);
    addDmg(best.x,best.y-20,'SHADOW REAPING!','#aa4adc');shake(8);
  }},
  blade_storm:{name:'Blade Storm',cd:30,fire(u){
    // Strict gate: enemy must be within ACTUAL spin radius (90 px). Tighter
    // than before (was 110 px) so Zayton walks closer first instead of
    // spinning in empty space chasing a ranged enemy.
    let _near=false;
    for(const e of enemies){if(e.hp>0&&dist(u,e)<=90){_near=true;break}}
    if(!_near)return false;
    u.bladeStormTimer=150;u.whirlwindFx=150;u.whirlwindFxR=90;u.whirlwindFxColor='#ffe066';
    addDmg(u.x,u.y-u.size-4,'BLADE STORM!','#ffe066');showFlash('BLADE STORM','#ffe066',60);shake(6);
  }},
  killing_spree:{name:'Killing Spree',cd:30,fire(u){
    const _targets=[];
    for(const e of enemies){if(e.hp>0&&dist(u,e)<160)_targets.push(e)}
    if(_targets.length===0)return false;
    _targets.sort(()=>Math.random()-0.5);
    u.killingSpree={targets:_targets.slice(0,5),idx:0,timer:0,interval:18,origX:u.x,origY:u.y,maxStep:140};
    u.untargetable=true;
    addDmg(u.x,u.y-u.size-4,'KILLING SPREE!','#ff2244');showFlash('KILLING SPREE','#ff2244',60);shake(6);
  }},
  deathmark:{name:'Deathmark',cd:35,fire(u){
    let best=null,bestHp=0;
    for(const e of enemies){if(e.hp>0&&dist(u,e)<200){if(e.hp>bestHp){bestHp=e.hp;best=e}}}
    if(best){
      best.deathmarkTimer=10*GAME_TICK_HZ;best.deathmarkDmg=0;best.deathmarkSource=u;
      addDmg(best.x,best.y-best.size,'DEATHMARK!','#55ff77');showFlash('DEATHMARK','#55aa33',60);
      addP(best.x,best.y,'#55aa33',24,5);shake(5);
    }else return false;
  }},
  final_strike:{name:'Final Strike',cd:25,fire(u){
    let best=null,bestD=Infinity;
    for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d<165&&d<bestD){bestD=d;best=e}}}
    if(!best)return false;
    const fromX=u.x,fromY=u.y;
    const ang=Math.atan2(best.y-u.y,best.x-u.x);
    if(bestD>(u.range||40)+18){
      const land=limitBurstLanding(u,best.x-Math.cos(ang)*18,best.y-Math.sin(ang)*18,140);
      u.x=land.x;
      u.y=land.y;
      clampToArena(u);
      beamFx.push({x1:fromX,y1:fromY,x2:u.x,y2:u.y,color:'#ff6600cc',width:6,life:0.24,maxLife:0.24,straight:true});
      beamFx.push({x1:fromX,y1:fromY,x2:u.x,y2:u.y,color:'#ffdd66aa',width:2.5,life:0.20,maxLife:0.20,straight:true});
      for(let i=0;i<16;i++){const f=i/16;addP(fromX+(u.x-fromX)*f+rnd(-3,3),fromY+(u.y-fromY)*f+rnd(-3,3),'#ff8800',1.8,4)}
    }
    arena_jazarGuard(u,Math.round(4*GAME_TICK_HZ),0.40);
    const bigDmg=Math.round(u.dmg*6.5*((best.isBoss||best.elite)?1.15:1));
    const impactX=best.x,impactY=best.y;
    dealDamage(best,bigDmg,u,'normal');
    best.armorBreak=(best.armorBreak||0)+4;best.armorBreakTimer=6*GAME_TICK_HZ;
    const splashR=132,splashDmg=Math.round(u.dmg*3.0);
    let splashHits=0;
    for(const e of enemies){
      if(e.hp<=0||e===best)continue;
      if(Math.hypot(e.x-impactX,e.y-impactY)<=splashR){
        dealDamage(e,splashDmg,u,'normal');
        e.armorBreak=(e.armorBreak||0)+2;e.armorBreakTimer=5*GAME_TICK_HZ;
        addP(e.x,e.y,'#ff8844',14,5);addP(e.x,e.y,'#ffdd66',6,3);splashHits++;
      }
    }
    addP(impactX,impactY,'#ff2200',52,8);addP(impactX,impactY,'#ffcc00',40,6);addP(impactX,impactY,'#ffffff',18,4);
    groundFx.push({x:impactX,y:impactY,r:0,maxR:62,life:0.78,swipeSlam:true,color:'#ff2200'});
    groundFx.push({x:impactX,y:impactY,r:0,maxR:splashR,life:0.72,color:'#ffcc00',finalStrikeCircle:true});
    groundFx.push({x:impactX,y:impactY,r:0,maxR:splashR+50,life:0.52,color:'#ffcc00',finalStrikeWave:true,waveAngle:ang});
    groundFx.push({x:impactX,y:impactY,r:0,maxR:splashR+34,life:0.42,color:'#ff6600',finalStrikeWave:true,waveAngle:ang+Math.PI});
    groundFx.push({x:impactX,y:impactY,r:0,maxR:splashR,life:0.62,color:'#ff8844'});
    groundFx.push({x:impactX,y:impactY,r:0,maxR:splashR+35,life:0.36,color:'#ffffff'});
    groundFx.push({x:impactX,y:impactY,r:0,maxR:54,life:0.56,swipeArc:true,swipeAngle:ang+0.4,color:'#ff6600'});
    groundFx.push({x:impactX,y:impactY,r:0,maxR:54,life:0.56,swipeArc:true,swipeAngle:ang-0.4,color:'#ff6600'});
    for(let i=0;i<14;i++){
      const a=Math.PI*2*i/14;
      beamFx.push({x1:impactX,y1:impactY,x2:impactX+Math.cos(a)*splashR,y2:impactY+Math.sin(a)*splashR,color:i%2?'#ffcc00aa':'#ff3300aa',width:2.4,life:0.22,maxLife:0.22,straight:true});
    }
    addDmg(impactX,impactY-(best.size||24),'FINAL STRIKE!','#ff4400');
    addDmg(impactX,impactY-(best.size||24)-16,'-'+bigDmg,'#ffdd66',{sz:13,bold:true});
    if(splashHits)addDmg(impactX,impactY+18,'SPLASH x'+splashHits,'#ffcc00',{sz:12,bold:true});
    arena_jazarSignatureSurge(u,4,{color:'#ffcc00',label:'SWORD SAINT FURY!',aoe:true,aoeDur:4,aoeRadius:92,aoeMult:0.65});
    showFlash('FINAL STRIKE','#ff4400',90);
    shake(22);
    SFX.heavySlash();
    if(best.hp<=0){u._sigCdOverride=Math.round((u._sigCdOverride||0)*0.5);addDmg(u.x,u.y-u.size,'CD HALVED!','#ffcc00')}
  }},
  storm_of_blades:{name:'Storm of Blades',cd:30,fire(u){
    groundFx.push({x:u.x,y:u.y,r:0,maxR:110,life:1,color:'#ffaa00',bladeVortex:true,bvTimer:360,bvTick:0,bvDmg:Math.round(u.dmg*0.8),bvFrom:u});
    addP(u.x,u.y,'#ffaa00',28,6);addP(u.x,u.y,'#ff6600',20,5);
    addDmg(u.x,u.y-u.size,'STORM OF BLADES!','#ffaa00');showFlash('STORM OF BLADES','#ffaa00',60);shake(8);
  }},
  storm_anchor:{name:'Storm Anchor',cd:30,fire(u){
    let best=null,bestScore=-1;
    for(const e of enemies){
      if(e.hp<=0)continue;
      const d=dist(u,e);
      if(d>420)continue;
      let count=0,elite=0;
      for(const f of enemies){
        if(f.hp<=0)continue;
        const fd=dist(e,f);
        if(fd<=125){count++;if(f.isBoss||f.elite)elite++}
      }
      const score=count*90+elite*35+d*0.20;
      if(score>bestScore){bestScore=score;best=e}
    }
    if(!best)return false;
    const tx=best.x,ty=best.y;
    const radius=125;
    const dur=Math.round(3*GAME_TICK_HZ);
    groundFx.push({x:tx,y:ty,r:0,maxR:radius,life:1,color:'#44ccff',jazarAnchor:true,anchorTimer:dur,anchorTick:0,anchorRadius:radius,anchorPull:2.9,anchorDmg:Math.max(8,Math.round(u.dmg*0.36)),anchorFrom:u});
    beamFx.push({x1:u.x,y1:u.y,x2:tx,y2:ty,color:'#44ccffcc',width:7,life:0.42,maxLife:0.42,straight:true});
    beamFx.push({x1:u.x,y1:u.y,x2:tx,y2:ty,color:'#ffffff88',width:2,life:0.25,maxLife:0.25,straight:true});
    for(let i=0;i<4;i++)groundFx.push({x:tx,y:ty,r:0,maxR:radius+i*18,life:0.35+i*0.08,color:i%2?'#ffffff':'#44ccff'});
    for(let i=0;i<22;i++){
      const a=Math.PI*2*i/22,r=radius*(0.25+Math.random()*0.65);
      addP(tx+Math.cos(a)*r,ty+Math.sin(a)*r,'#44ccff',1.5,4);
    }
    for(let i=0;i<8;i++){
      const a=Math.PI*2*i/8;
      beamFx.push({x1:tx+Math.cos(a)*radius,y1:ty+Math.sin(a)*radius,x2:tx,y2:ty,color:'#88eeff88',width:2,life:0.30,maxLife:0.30,straight:true});
    }
    addP(tx,ty,'#88eeff',28,6);addP(u.x,u.y,'#44ccff',18,5);
    addDmg(tx,ty-24,'STORM ANCHOR!','#44ccff',{sz:15,bold:true});
    showFlash('STORM ANCHOR','#44ccff',60);
    arena_jazarGuard(u,Math.round(3*GAME_TICK_HZ),0.35);
    arena_jazarSignatureSurge(u,5,{color:'#44ccff',label:'ANCHOR HASTE!'});
    shake(8);
  }},
  pyroblast:{name:'Pyroblast',cd:28,fire(u){
    let best=null,bestHp=0;
    for(const e of enemies){if(e.hp>0&&dist(u,e)<250){if(e.hp>bestHp){bestHp=e.hp;best=e}}}
    if(!best)return false;
    const dmg=Math.round(u.dmg*3.5);
    bombs.push({x:u.x,y:u.y,fromX:u.x,fromY:u.y,tx:best.x,ty:best.y,t:0,dur:30,dmg:dmg,radius:45,attacker:u,isPlayer:true,color:'#ff4400',
      pyroblast:true,size:18});
    addDmg(u.x,u.y-u.size-10,'PYROBLAST!','#ff2200');showFlash('PYROBLAST!','#ff4400',70);
    for(let i=0;i<20;i++){const a=Math.PI*2*i/20;const r=u.size*(1.0+Math.random()*0.5);addP(u.x+Math.cos(a)*r,u.y+Math.sin(a)*r,'#ff6600',2+Math.random()*2,5)}
    for(let i=0;i<10;i++){addP(u.x+rnd(-8,8),u.y+rnd(-8,8),'#ffcc00',3,4)}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:50,life:0.4,color:'#ff4400'});
    shake(12);
  }},
  inferno_orb:{name:'Inferno Orb',cd:28,fire(u){
    const best=arena_findBestEnemyClusterPoint(u,340,110);
    if(!best)return false;
    const ang=Math.atan2(best.y-u.y,best.x-u.x);
    u._infernoOrb={
      x:u.x,y:u.y,ang,speed:2.0,timer:Math.round(3.5*GAME_TICK_HZ),
      radius:85,tickCD:0,tickEvery:12,dmg:Math.max(1,Math.round(u.dmg*0.53)),from:u
    };
    addP(u.x,u.y,'#ff4400',28,6);
    addP(u.x,u.y,'#ffcc00',18,5);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:70,life:0.55,color:'#ff4400'});
    addDmg(u.x,u.y-u.size-10,'INFERNO ORB!','#ff6600',{sz:15,bold:true});
    showFlash('INFERNO ORB','#ff6600',65);
    shake(9);
  }},
  living_bomb:{name:'Living Bomb',cd:30,fire(u){
    const targets=[];
    for(const e of enemies){if(e.hp>0&&dist(u,e)<250)targets.push(e)}
    targets.sort((a,b)=>b.hp-a.hp);
    const picks=targets.slice(0,3);
    if(!picks.length)return false;
    for(const t of picks){
      t._livingBomb=true;t._livingBombTimer=4*GAME_TICK_HZ;t._livingBombDmg=Math.round(u.dmg*4);t._livingBombRadius=80;t._livingBombFrom=u;
      addP(t.x,t.y,'#ff6600',12,4);addDmg(t.x,t.y-t.size,'BOMB!','#ff4400');
    }
    showFlash('LIVING BOMB!','#ff4400',50);shake(6);
  }},
  frozen_orb:{name:'Frozen Orb',cd:30,fire(u){
    let best=null,bestD=Infinity;
    for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d<300&&d<bestD){bestD=d;best=e}}}
    if(!best)return false;
    const ang=Math.atan2(best.y-u.y,best.x-u.x);
    u._frozenOrb={x:u.x,y:u.y,ang:ang,speed:1.45,timer:Math.round(3.5*GAME_TICK_HZ),dmg:Math.round(u.dmg*0.80),radius:90,from:u,tickCD:0,tickEvery:12,homing:0.08};
    addDmg(u.x,u.y-u.size,'FROZEN ORB!','#66ccff');showFlash('FROZEN ORB!','#88ddff',60);
    for(let i=0;i<14;i++){const a=Math.PI*2*i/14;addP(u.x+Math.cos(a)*u.size*1.2,u.y+Math.sin(a)*u.size*1.2,'#88ddff',2,4)}
    shake(6);
  }},
  thunderstorm:{name:'Thunderstorm',cd:30,fire(u){
    const targets=[];
    for(const e of enemies){if(e.hp>0&&dist(u,e)<340)targets.push(e)}
    if(!targets.length)return false;
    const duration=Math.round(2.5*GAME_TICK_HZ);
    u._thunderstorm={
      timer:duration,maxTimer:duration,
      tickCD:0,tickEvery:Math.max(6,Math.round(0.25*GAME_TICK_HZ)),
      dmg:Math.max(1,Math.round(u.dmg*0.62)),
      radius:360,maxTargets:Math.min(10,Math.max(6,targets.length)),
      stun:Math.round(0.5*GAME_TICK_HZ),
      from:u
    };
    groundFx.push({x:u.x,y:u.y,r:0,maxR:310,life:0.8,color:'#ffee66'});
    groundFx.push({x:u.x,y:u.y,r:0,maxR:190,life:0.55,color:'#ff9f2e'});
    addDmg(u.x,u.y-u.size-10,'THUNDERSTORM!','#ffee66',{sz:15,bold:true});showFlash('THUNDERSTORM!','#ffee66',70);
    shake(10);
  }},
  soul_harvest:{name:'Soul Harvest',cd:28,fire(u){
    const best=arena_findBestEnemyClusterPoint(u,340,120);
    if(!best)return false;
    const dur=4*GAME_TICK_HZ;
    u._soulHarvest={
      x:best.x,y:best.y,r:90,timer:dur,maxTimer:dur,
      tickCD:0,tickEvery:Math.round(0.5*GAME_TICK_HZ),
      dmg:Math.max(1,Math.round(u.dmg*0.18)),
      finalDmg:Math.max(1,Math.round(u.dmg*0.70)),
      maxTargets:6,textCD:0,
      from:u
    };
    addDmg(u.x,u.y-u.size-8,'SOUL HARVEST!','#cc88ff',{sz:15,bold:true});
    showFlash('SOUL HARVEST','#9b59b6',70);
    addP(u.x,u.y,'#9b59b6',28,6);addP(best.x,best.y,'#cc88ff',30,6);
    groundFx.push({x:best.x,y:best.y,r:0,maxR:100,life:0.9,color:'#7b3a9a'});
    groundFx.push({x:best.x,y:best.y,r:0,maxR:58,life:0.55,color:'#cc88ff'});
    beamFx.push({x1:u.x,y1:u.y-u.size*0.3,x2:best.x,y2:best.y,life:0.45,maxLife:0.45,color:'#cc88ff',width:4,straight:false});
    shake(8);
  }},
  dark_pact:{name:'Dark Pact',cd:25,fire(u){
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<(u.range||60)+200))return false;
    const sacrifice=Math.round(u.hp*0.25);
    u.hp=Math.max(1,u.hp-sacrifice);
    const shieldAmt=Math.round(sacrifice*2);
    u._darkPactShield={hp:shieldAmt,maxHp:shieldAmt};
    u._darkPactDoTSpeed={dur:8*GAME_TICK_HZ,t:0,mult:3};
    addDmg(u.x,u.y-u.size,'DARK PACT!','#9b59b6');
    showFlash('DARK PACT!','#9b59b6',60);
    addP(u.x,u.y,'#660066',32,6);
    for(let i=0;i<16;i++){const a=Math.PI*2*i/16;addP(u.x+Math.cos(a)*u.size*1.3,u.y+Math.sin(a)*u.size*1.3,'#9b59b6',2,4)}
    groundFx.push({x:u.x,y:u.y,r:0,maxR:u.size+30,life:0.6,color:'#5a1a5a'});
    shake(6);
  }},
  summon_infernal:{name:'Summon Infernal',cd:40,fire(u){
    let tx=u.x,ty=u.y-80;
    if(enemies.length){let best=null,bd=Infinity;for(const e of enemies){if(e.hp>0){const d=dist(u,e);if(d<bd){bd=d;best=e}}}if(best){tx=best.x;ty=best.y}}
    for(const e of enemies){if(e.hp>0&&dist({x:tx,y:ty},e)<=100){if(!e.isBoss)e.stunned=Math.max(e.stunned||0,2*GAME_TICK_HZ);dealDamage(e,Math.round(u.dmg*2),u,'magic')}}
    addP(tx,ty,'#ff6600',64,9);addP(tx,ty,'#ffaa44',34,6);addP(tx,ty,'#33ff66',18,4);
    groundFx.push({x:tx,y:ty,r:0,maxR:130,life:0.9,color:'#ff6600'});
    groundFx.push({x:tx,y:ty,r:0,maxR:82,life:0.55,color:'#33ff66'});
    groundFx.push({x:tx,y:ty,r:0,maxR:110,life:1,infernalCrater:true,craterTimer:4*GAME_TICK_HZ,craterMax:4*GAME_TICK_HZ,color:'#ff6600'});
    const hp=Math.round(600+(u.level||1)*80);
    const inf={x:tx,y:ty,maxHp:hp,hp:hp,dmg:Math.round(u.dmg*0.8),speed:0.25,atkSpd:72,range:36,size:26*unitVisualScale,armor:4,magicRes:3,
      isPlayer:true,isMinion:true,parent:u,kind:'infernal',cd:0,color:'#ff4400',accent:'#881100',facing:1,arch:'tank',
      bobPhase:Math.random()*Math.PI*2,lifeTicks:15*GAME_TICK_HZ,
      _fireStompCD:0,_fireStompEvery:5*GAME_TICK_HZ,_fireStompDmg:Math.round(u.dmg*1.5),_fireStompRadius:80};
    nerfMinion(inf);
    units.push(inf);
    addDmg(u.x,u.y-u.size-4,'SUMMON INFERNAL!','#ff6600',{sz:15,bold:true});showFlash('INFERNAL IMPACT!','#ff6600',85);
    shake(18);
  }},
  chaos_bolt:{name:'Chaos Bolt',cd:30,fire(u){
    const alive=enemies.filter(e=>e.hp>0);
    if(!alive.length)return false;
    alive.sort((a,b)=>b.hp-a.hp);
    const main=alive[0];
    const splitPlan=[
      {count:5,mult:0.75,size:12,color:'#88ffaa',aoe:38,aoeMult:0.12},
      {count:3,mult:0.45,size:10,color:'#66ddaa',aoe:32,aoeMult:0.10},
      {count:2,mult:0.30,size:8,color:'#55bb99',aoe:28,aoeMult:0.08},
      {count:1,mult:0.20,size:7,color:'#449977',aoe:24,aoeMult:0.06}
    ];
    projectiles.push({x:u.x,y:u.y,tx:main.x,ty:main.y,target:main,
      speed:2.05,dmg:Math.round(u.dmg*3.8),projType:'chaosBolt',attackType:'ignoreDefense',
      isPlayer:true,attacker:u,chaosBolt:true,color:'#33ff66',size:21,
      aoeRadius:68,_cbAoeMult:0.16,_chaosSplitPlan:splitPlan,_chaosBaseDmg:u.dmg,_hitTargets:[main]});
    addDmg(u.x,u.y-u.size-4,'CHAOS BOLT!','#33ff66',{sz:15,bold:true});
    showFlash('CHAOS BOLT!','#33ff66',85);
    addP(u.x,u.y,'#33ff66',30,7);addP(u.x,u.y,'#111111',18,5);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:70,life:0.45,color:'#33ff66'});
    shake(12);
  }},
  headshot:{name:'Headshot',cd:30,fire(u){
    let best=null,bestHp=0;
    for(const e of enemies){if(e.hp<=0)continue;if(e.hp>bestHp){bestHp=e.hp;best=e}}
    if(best){
      const dmg=Math.round((best.maxHp||100)*0.30);
      dealDamage(best,dmg,u,'magic');
      for(let i=1;i<=10;i++){const px=u.x+(best.x-u.x)*(i/10),py=u.y+(best.y-u.y)*(i/10);addP(px,py,'#ffd700',1,3)}
      addP(best.x,best.y,'#ffd700',32,5);addDmg(best.x,best.y-20,'HEADSHOT!','#ffd700');shake(8);
    }
  }},
  thorn_hail:{name:'Thorn Hail',cd:20,fire(u){ // legacy
    for(let i=0;i<16;i++){
      const ang=(i/16)*Math.PI*2;
      const fakeT={x:u.x+Math.cos(ang)*200,y:u.y+Math.sin(ang)*200,size:10};
      fireProjectile(u,fakeT,Math.round(u.dmg*0.7),{projType:'normal',pierce:true});
    }
    addDmg(u.x,u.y-u.size-4,'THORN HAIL!','#5a8a40');shake(5);
  }},
  trueshot:{name:'Trueshot',cd:30,fire(u){
    if(!enemies.some(e=>e.hp>0&&dist(u,e)<(u.range||198)+100))return false;
    u._trueshot={dur:8*GAME_TICK_HZ,t:0,dmgMult:2.0,rangeBonus:Math.round((u.range||198)*0.5),aimedEveryHit:true};
    u._trueshotOrigRange=u.range;
    u.range=u.range+u._trueshot.rangeBonus;
    addDmg(u.x,u.y-u.size-4,'TRUESHOT!','#ffd700');
    showFlash('TRUESHOT!','#ffd700',75);
    addP(u.x,u.y,'#ffd700',32,6);
    for(let i=0;i<20;i++){const a=Math.PI*2*i/20;addP(u.x+Math.cos(a)*u.size*1.5,u.y+Math.sin(a)*u.size*1.5,'#ffee88',2,4)}
    shake(8);
  }},
  black_arrow:{name:'Black Arrow',cd:28,fire(u){
    const _baRange=(u.range||198)+100;
    const alive=enemies.filter(e=>e.hp>0&&dist(u,e)<_baRange);
    if(!alive.length)return false;
    alive.sort((a,b)=>b.hp-a.hp);
    const main=alive[0];
    const others=alive.filter(e=>e!==main).sort((a,b)=>dist(u,a)-dist(u,b));
    const arrows=[
      {target:main,mult:4.0,sz:16,isMain:true},
      {target:others[0]||main,mult:1.5,sz:10,isMain:false},
      {target:others[1]||others[0]||main,mult:1.5,sz:10,isMain:false},
      {target:others[2]||others[1]||others[0]||main,mult:1.5,sz:10,isMain:false},
      {target:others[3]||others[2]||others[1]||others[0]||main,mult:1.5,sz:10,isMain:false}
    ];
    for(let i=0;i<5;i++){
      const a=arrows[i];
      projectiles.push({x:u.x,y:u.y+(i-2)*8,target:a.target,tx:a.target.x,ty:a.target.y,
        speed:3.5,dmg:Math.round(u.dmg*a.mult),projType:'blackArrow',
        isPlayer:true,attacker:u,blackArrow:true,_baMain:a.isMain,
        color:a.isMain?'#6633aa':'#9966cc',size:a.sz});
    }
    addDmg(u.x,u.y-u.size-4,'BLACK ARROW!','#6633aa');
    showFlash('BLACK ARROW!','#6633aa',75);
    shake(8);
  }},
  stampede:{name:'Stampede',cd:35,fire(u){
    const alive=enemies.filter(e=>e.hp>0);
    if(!alive.length)return false;
    const _colors=['#888888','#aa6633','#3aa84e','#c8a05a','#6a4a2a'];
    const _kinds=['wolf','raptor','spiritBeast','wolf','raptor'];
    alive.sort((a,b)=>a.y-b.y);
    let _ySlots=[];
    for(let i=0;i<5;i++)_ySlots.push(alive[i%alive.length].y);
    _ySlots.sort((a,b)=>a-b);
    const _minGap=20;
    for(let i=1;i<_ySlots.length;i++){if(_ySlots[i]-_ySlots[i-1]<_minGap)_ySlots[i]=_ySlots[i-1]+_minGap}
    for(let i=0;i<5;i++){
      const _spd=2.5+Math.random()*0.5;
      projectiles.push({x:getArenaBounds().left-10,y:_ySlots[i],vx:_spd,vy:0,
        life:Math.ceil((getArenaBounds().right-getArenaBounds().left+40)/_spd),
        dmg:Math.round(u.dmg*1.8),projType:'stampedeBeast',
        isPlayer:true,attacker:u,size:18,color:_colors[i],
        _hitTargets:[],_beastKind:_kinds[i],_beastIdx:i,
        stampedeBeast:true});
    }
    addDmg(u.x,u.y-u.size-4,'STAMPEDE!','#ffd700');
    showFlash('STAMPEDE!','#ffd700',80);
    shake(14);
  }},
  siege_dropship:{name:'Siege Dropship',cd:40,fire(u){
    const alive=enemies.filter(e=>e.hp>0);
    if(!alive.length)return false;
    let cx=0,cy=0;
    for(const e of alive){cx+=e.x;cy+=e.y}
    cx/=alive.length;cy/=alive.length;
    const _lv=u.level||1;
    const _offsets=[[-42,-18],[42,-18]];
    for(let i=0;i<2;i++){
      const tx=Math.max(getArenaBounds().left+30,Math.min(getArenaBounds().right-30,cx+_offsets[i][0]));
      const ty=Math.max(getArenaBounds().top+30,cy+_offsets[i][1]);
      const _hp=340+_lv*60;
      const _t={x:tx,y:ty,maxHp:_hp,hp:_hp,dmg:Math.round(u.dmg*1.35),
        speed:0,atkSpd:68,range:330,size:16,armor:3,magicRes:1,
        isPlayer:true,isMinion:true,parent:u,kind:'turret',cd:0,projType:'bolt',
        _turretArtillery:true,_turretAoe:72,
        color:'#8a7a3a',accent:'#5a4a1a',facing:1,bobPhase:0,
        lifeTicks:12*GAME_TICK_HZ};
      units.push(_t);
      addP(tx,ty,'#ffa500',20,5);
    }
    const bx=Math.max(getArenaBounds().left+35,Math.min(getArenaBounds().right-35,cx));
    const by=Math.max(getArenaBounds().top+35,Math.min(getArenaBounds().bottom-35,cy+24));
    u._siegeCommandBeacon={x:bx,y:by,r:175,timer:12*GAME_TICK_HZ,maxTimer:12*GAME_TICK_HZ,dmgMult:1.25,atkSpdMult:0.75};
    addP(bx,by,'#ffcc66',28,6);
    groundFx.push({x:bx,y:by,r:0,maxR:175,life:0.8,color:'#ffcc66'});
    addDmg(u.x,u.y-u.size-4,'SIEGE DROPSHIP!','#ffa500');showFlash('SIEGE DROPSHIP!','#ffa500',80);
    shake(12);
  }},
  mech_overdrive:{name:'Overdrive',cd:35,fire(u){
    if(!enemies.some(e=>e.hp>0))return false;
    u._overdriveTimer=6*GAME_TICK_HZ;
    u._odOrigDmg=u.dmg;u._odOrigAtkSpd=u.atkSpd;
    u._odVentDmg=Math.round(u.dmg*2.4);u._odVentRadius=95;
    u.dmg=Math.round(u.dmg*1.75);
    u.atkSpd=Math.max(20,Math.round(u.atkSpd*0.5));
    u._overdriveAoe=48;
    for(const _m of units){
      if(!_m.isMinion||_m.parent!==u||_m.kind!=='mechTurret'||_m.hp<=0)continue;
      if(!_m._odDroneOrigDmg){_m._odDroneOrigDmg=_m.dmg;_m._odDroneOrigAtkSpd=_m.atkSpd}
      _m.dmg=Math.round(_m._odDroneOrigDmg*1.20);
      _m.atkSpd=Math.max(8,Math.round(_m._odDroneOrigAtkSpd*0.75));
      addP(_m.x,_m.y,'#ff8844',12,4);
    }
    addP(u.x,u.y,'#ff4400',32,6);addP(u.x,u.y,'#44aaff',24,5);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:80,life:0.6,color:'#ff4400'});
    addDmg(u.x,u.y-u.size-4,'OVERDRIVE!','#ff4400');showFlash('OVERDRIVE!','#ff4400',80);
    shake(12);
  }},
  holy_wrath:{name:'Holy Wrath',cd:35,fire(u){
    let best=null,bestHp=0;
    for(const e of enemies){if(e.hp<=0)continue;if(e.hp>bestHp){bestHp=e.hp;best=e}}
    if(!best)return false;
    // Holy nova burst at caster
    groundFx.push({x:u.x,y:u.y,r:0,maxR:80,life:0.6,color:'#ffd700'});
    for(let i=0;i<16;i++)addP(u.x+rnd(-15,15),u.y+rnd(-15,15),'#ffe8a0',1,5);
    // Beam of light to highest HP target
    for(let i=1;i<=14;i++){
      const _f=i/14;
      const px=u.x+(best.x-u.x)*_f,py=u.y+(best.y-u.y)*_f;
      addP(px+rnd(-3,3),py+rnd(-3,3),'#ffd700',2,4);
      addP(px+rnd(-5,5),py+rnd(-5,5),'#ffffff',1,3);
    }
    for(const e of enemies){
      if(e.hp<=0)continue;
      const lx=best.x-u.x,ly=best.y-u.y;
      const llen2=lx*lx+ly*ly||1;
      const ex=e.x-u.x,ey=e.y-u.y;
      const t=(ex*lx+ey*ly)/llen2;
      if(t<0||t>1.5)continue;
      const px=u.x+lx*t,py=u.y+ly*t;
      const cd=Math.hypot(e.x-px,e.y-py);
      if(cd<=40){
        dealDamage(e,Math.round(u.dmg*4),u,'magic');
        if(e._auraSrc){e.atkSpd=e._auraOrigAtkSpd||e.atkSpd;e._auraSrc=null;e._auraOrigAtkSpd=null}
        addP(e.x,e.y,'#ffd700',16,5);
        addP(e.x,e.y,'#ffffff',8,3);
        groundFx.push({x:e.x,y:e.y,r:0,maxR:30,life:0.35,color:'#ffe8a0'});
      }
    }
    // Heal all allies for 15% maxHP
    for(const a of units){
      if(!a.isPlayer||a.hp<=0||a.isGhost||a===u)continue;
      if(dist(u,a)>250)continue;
      const heal=arena_applyHealingReceived(a,Math.round(a.maxHp*0.15));
      a.hp=Math.min(a.maxHp,a.hp+heal);
      addHealFx(a.x,a.y,heal);
    }
    addDmg(u.x,u.y-u.size-4,'HOLY WRATH!','#ffd700');showFlash('HOLY WRATH','#ffd700',60);shake(10);
  }},
  divine_shield:{name:'Divine Shield',cd:30,fire(u){
    for(const a of units){
      if(!a.isPlayer||a.hp<=0||a.isGhost)continue;
      if(dist(u,a)>250)continue;
      a.divineShieldTimer=300;a.divineShieldDR=0.5;
      addP(a.x,a.y,'#ffeeaa',6,3);
    }
    groundFx.push({x:u.x,y:u.y,r:0,maxR:250,life:0.6,color:'#ffeeaa'});
    addDmg(u.x,u.y-u.size-4,'DIVINE SHIELD!','#ffeeaa');showFlash('DIVINE SHIELD','#ffeeaa',60);
  }},
  tree_of_life:{name:'Tree of Life',cd:50,fire(u){
    u.treeOfLifeZone={x:u.x,y:u.y,r:200,t:480,heal:Math.max(8,Math.round(u.maxHp*0.06))};
    addP(u.x,u.y,'#3aa84e',32,6);groundFx.push({x:u.x,y:u.y,r:0,maxR:200,life:0.8,color:'#3aa84e'});
    addDmg(u.x,u.y-u.size-4,'TREE OF LIFE!','#3aa84e');showFlash('TREE OF LIFE','#3aa84e',75);
  }},
  incarnation_tree:{name:'Incarnation: Tree of Life',cd:40,fire(u){
    u._incarnation={timer:12*GAME_TICK_HZ};
    for(let i=0;i<3;i++){
      const _ang=(i/3)*Math.PI*2+Math.random()*0.5;
      const _tx=u.x+Math.cos(_ang)*40,_ty=u.y+Math.sin(_ang)*25;
      arena_spawnTreant(u,_tx,_ty,15*GAME_TICK_HZ);
    }
    for(let i=0;i<40;i++)addP(u.x+rnd(-30,30),u.y+rnd(-20,20),'#44ff66',1,5);
    for(let i=0;i<20;i++)addP(u.x+rnd(-40,40),u.y+rnd(-30,30),'#88ffaa',1,4);
    for(let i=0;i<12;i++)addP(u.x+rnd(-20,20),u.y+rnd(-15,15),'#ffee88',1,3);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:120,life:0.8,color:'#44ff88'});
    addDmg(u.x,u.y-u.size-6,'TREE OF LIFE!','#33ff66',{sz:15,bold:true});showFlash('INCARNATION: TREE OF LIFE','#33ff66',80);
    shake(8);
  }},
  celestial_alignment:{name:'Astral Typhoon',cd:40,fire(u){
    const t=arena_findBestEnemyClusterPoint(u,360,130)||findEnemyForUnit(u);if(!t)return false;
    u._celestialAlignment={timer:10*GAME_TICK_HZ,maxTimer:10*GAME_TICK_HZ};
    if(!u._eclipse)u._eclipse={phase:'solar',count:0};
    const _burstDmg=Math.round(u.dmg*3.1);
    arena_moonkinControlBurst(t.x,t.y,165,u,_burstDmg,'push',42,'ASTRAL TYPHOON!','#ccaaff');
    groundFx.push({x:t.x,y:t.y,r:0,maxR:210,life:0.95,celestialAuraFx:true,color:'#ffd700',altColor:'#aaccff'});
    groundFx.push({x:t.x,y:t.y,r:0,maxR:135,life:0.65,lunarStrikeFx:true,color:'#aaccff'});
    groundFx.push({x:t.x,y:t.y,r:0,maxR:95,life:0.50,solarFlareFx:true,color:'#ffd700'});
    beamFx.push({x1:u.x,y1:u.y-u.size*0.4,x2:t.x,y2:t.y,life:0.45,maxLife:0.45,color:'#ffd700',width:5,straight:false});
    beamFx.push({x1:u.x,y1:u.y-u.size*0.1,x2:t.x,y2:t.y,life:0.45,maxLife:0.45,color:'#aaccff',width:5,straight:false});
    for(let i=0;i<34;i++){const ang=Math.PI*2*i/34,r=rnd(20,100);addP(t.x+Math.cos(ang)*r,t.y+Math.sin(ang)*r,i%2?'#ffd700':'#aaccff',1,5)}
    addDmg(u.x,u.y-u.size-8,'ASTRAL TYPHOON!','#ccaaff',{sz:15,bold:true});showFlash('ASTRAL TYPHOON','#ccaaff',80);
    shake(14);
  }},
  flourish:{name:'Flourish',cd:40,fire(u){
    const _hm=u._incarnation?1.5:1.0;
    const _flAll=[];for(const a of units){if(a.isPlayer&&a.hp>0&&!a.isMinion)_flAll.push(a)}
    _flAll.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp));
    const _flTargets=_flAll.slice(0,5);
    for(const a of _flTargets){
      const _h=arena_applyHealingReceived(a,Math.round(a.maxHp*0.30*_hm));a.hp=Math.min(a.maxHp,a.hp+_h);addHealFx(a.x,a.y,_h,true);
      a._wgHot={timer:6*GAME_TICK_HZ,tick:0,healPct:0.05,from:u};
      addP(a.x,a.y,'#44ff66',12,4);addP(a.x,a.y,'#88ffaa',6,3);
    }
    const _rings=units.filter(m=>m.isMinion&&m.parent===u&&m.kind==='mushroom'&&m.hp>0);
    for(const mr of _rings){
      for(const a of units){if(a.isPlayer&&a.hp>0&&dist(mr,a)<=mr.range){
        const _h=arena_applyHealingReceived(a,Math.round(a.maxHp*0.25*_hm));a.hp=Math.min(a.maxHp,a.hp+_h);addHealFx(a.x,a.y,_h,true);
      }}
      addP(mr.x,mr.y,'#44ff88',24,6);groundFx.push({x:mr.x,y:mr.y,r:0,maxR:mr.range,life:0.6,color:'#44ff88'});
      addDmg(mr.x,mr.y-12,'BLOOM!','#44ff88',{sz:14,bold:true});
      mr.hp=0;
    }
    for(let i=0;i<3;i++){
      const _ang=(i/3)*Math.PI*2+Math.random()*0.5;
      arena_spawnTreant(u,u.x+Math.cos(_ang)*45,u.y+Math.sin(_ang)*28,12*GAME_TICK_HZ);
    }
    for(let i=0;i<36;i++)addP(u.x+rnd(-40,40),u.y+rnd(-30,30),'#44ff66',1,5);
    groundFx.push({x:u.x,y:u.y,r:0,maxR:140,life:0.7,color:'#44ff88'});
    addDmg(u.x,u.y-u.size-6,'FLOURISH!','#33ff66',{sz:15,bold:true});showFlash('FLOURISH','#33ff66',75);
    shake(8);
  }},
  field_renewal:{name:'Field of Renewal',cd:35,fire(u){
    u.renewalFieldZone={x:u.x,y:u.y,r:200,t:360};
    addP(u.x,u.y,'#88ffaa',24,5);groundFx.push({x:u.x,y:u.y,r:0,maxR:200,life:0.6,color:'#88ffaa'});
    addDmg(u.x,u.y-u.size-4,'FIELD OF RENEWAL!','#88ffaa');
  }},
  // (anthem_of_war, mass_charm, army_of_dead, death_pact, corpse_explosion removed Ã¢â‚¬â€ old Habaq/Kharoob sigs)
  champions_wrath:{name:"Champion's Wrath",cd:30,fire(u){
    for(let i=0;i<3;i++)groundFx.push({x:u.x,y:u.y,r:0,maxR:80+i*60,life:0.5+i*0.1,color:i===0?'#88ddff':i===1?'#ffd700':'#9b59b6'});
    for(const e of enemies){
      if(e.hp<=0)continue;
      const d=dist(u,e);
      if(d<=80){dealDamage(e,Math.round(u.dmg*2),u,'normal');e.slowTimer=180;e.slowMult=0.4}
      else if(d<=140){dealDamage(e,Math.round(u.dmg*1.5),u,'normal');if(!e.isBoss)e.stunned=Math.max(e.stunned||0,60)}
      else if(d<=200){dealDamage(e,Math.round(u.dmg*1.0),u,'normal');e.cursedTimer=240;e.cursedMult=1.5}
    }
    for(const a of units){
      if(!a.isPlayer||a.hp<=0||a.isGhost)continue;
      a._origDmgCW=a._origDmgCW||a.dmg;
      a.dmg=Math.round(a._origDmgCW*1.5);a.championWrathTimer=360;
    }
    addDmg(u.x,u.y-u.size-4,"CHAMPION'S WRATH!",'#ffd700');showFlash("CHAMPION'S WRATH",'#ffd700',75);shake(15);
  }},
  last_stand:{name:'Last Stand',cd:50,fire(u){
    for(const a of units){
      if(!a.isPlayer||a.hp<=0||a.isGhost)continue;
      a.invulnerableTimer=180;
      a.hp=Math.max(a.hp,Math.round(a.maxHp*0.5));
      addHealFx(a.x,a.y,Math.round(a.maxHp*0.5));
      addP(a.x,a.y,'#ffeeaa',16,4);
    }
    addDmg(u.x,u.y-u.size-4,'LAST STAND!','#ffeeaa');showFlash('LAST STAND','#ffeeaa',90);shake(12);
  }}
};

}

import { ARENA_UNIT_PASSIVES, ARENA_UNIT_BRANCHES, ARENA_BASE_SIGNATURES, ARENA_BRANCH_SIGNATURES } from '../data/passives.js';
import { arena_isCapstoneLevel } from './squad-economy.js';

export function signatureDisplayCooldown(srcCd, level) {
  let cooldownSeconds;
  if (srcCd <= 15) cooldownSeconds = 25;
  else if (srcCd <= 25) cooldownSeconds = 30;
  else if (srcCd <= 35) cooldownSeconds = 35;
  else if (srcCd <= 45) cooldownSeconds = 40;
  else cooldownSeconds = 50;
  return Math.round(cooldownSeconds * (arena_isCapstoneLevel(level) ? 0.78 : 1.0));
}

export function signatureDisplayFirstCast(srcCd) {
  if (srcCd <= 15) return 3;
  if (srcCd <= 25) return 4;
  if (srcCd <= 35) return 5;
  if (srcCd <= 45) return 5;
  return 6;
}

export function currentUnitPassives(unitIdx, branch) {
  const base = ARENA_UNIT_PASSIVES[unitIdx];
  if (!base) return { p1: null, p2: null };
  if (branch && ARENA_UNIT_BRANCHES[unitIdx] && ARENA_UNIT_BRANCHES[unitIdx][branch]) {
    const branchDef = ARENA_UNIT_BRANCHES[unitIdx][branch];
    return { p1: branchDef.p1, p2: branchDef.p2 };
  }
  return { p1: base.p1, p2: base.p2 };
}

export function signatureIdForUnit(unitIdx, branch) {
  return branch ? ARENA_BRANCH_SIGNATURES[unitIdx + '_' + branch] : ARENA_BASE_SIGNATURES[unitIdx];
}

export function applyBranchAwareRoleTuning(u,unitIdx,lv){
  if(!u||u._roleDamageTuned)return;
  const levelLift=Math.min(0.08,0.02*((lv||1)-1));
  let mult=1;
  if(u.arch==='tank')mult=1.20+levelLift;
  else if(u.arch==='melee'||(u.arch==='paladin'&&u.paladinHybrid!==false))mult=1.10+levelLift*0.5;
  if(mult>1){
    u.dmg=Math.max(1,Math.round(u.dmg*mult));
    u._roleDamageTuned=true;
  }
}
export function applyUnitPassives(u,unitIdx,lv,{gameTickHz,signatures}){
  const GAME_TICK_HZ=gameTickHz;
  const arena_setPassive=(target,id,scaling,capBoost)=>applyPassiveToUnit(target,id,scaling,capBoost,{gameTickHz});
  let def=ARENA_UNIT_PASSIVES[unitIdx];if(!def)return;
  // Branch override at L3+ Ã¢â‚¬â€ swap to chosen variant's p1/p2 and apply statMod
  // multipliers. Branch is locked once chosen and lives on cell.branch (mirrored
  // onto u.branch in arena_respawnSquad). At L1-L2 we still run base passives.
  if(u.branch&&lv>=3){
    const _bd=ARENA_UNIT_BRANCHES[unitIdx]&&ARENA_UNIT_BRANCHES[unitIdx][u.branch];
    if(_bd){
      def={p1:_bd.p1,p2:_bd.p2};
      if(_bd.statMod){
        for(const k in _bd.statMod){
          const _v=_bd.statMod[k];
          if(typeof u[k]==='number'){
            u[k]=u[k]*_v;
            if(k==='maxHp'){u.maxHp=Math.round(u.maxHp);u.hp=u.maxHp}
            if(k==='dmg')u.dmg=Math.round(u.dmg);
          }
        }
      }
    }
  }
  applyBranchAwareRoleTuning(u,unitIdx,lv);
  const boost=arena_isCapstoneLevel(lv)?1.5:1.0;
  const linear=1+0.10*(lv-1);
  // Inherent Tank Taunt Aura: every tank-arch unit pulls aggro by default.
  // Malfof's old 'taunt' P1 was retired Ã¢â‚¬â€ he now charges instead. All tanks
  // share the same taunt baseline; Malfof keeps the range as everyone else.
  if(u.arch==='tank')u.taunt={range:120*linear*boost};
  if(u.arch==='tank'&&unitIdx<=2&&lv>=3){
    u.tankResolve={threshold:0.45,shieldPct:0.14,dr:0.20,dur:Math.round(4*GAME_TICK_HZ),cd:Math.round(30*GAME_TICK_HZ)};
    u.tankResolveDR=u.tankResolveDR||0;
    u.tankResolveDRTimer=u.tankResolveDRTimer||0;
    u.tankResolveCDTimer=u.tankResolveCDTimer||0;
  }
  // Melee Resilience: melee DPS get passive DR + bonus armor/MRes since they
  // must stand in boss AoE zones to deal damage. Scales with level.
  if(u.arch==='melee'||u.arch==='paladin'){
    u.meleeResilience=0.15;
    u.armor=(u.armor||0)+Math.round(2*linear);
    u.magicRes=(u.magicRes||0)+Math.round(1.5*linear);
  }
  if(unitIdx===5&&!u._jazarResolveApplied){
    u.bladeGuard={dur:Math.round(3*GAME_TICK_HZ),dr:0.30};
    u.rampageHealPct=0.035;
    u.lifesteal=(u.lifesteal||0)+0.06;
    u._jazarResolveApplied=true;
  }
  if(unitIdx===5&&lv>=3&&!u.branch&&!u._jazarBasePathApplied){
    u.maxHp=Math.round(u.maxHp*1.12);
    u.hp=Math.min(u.maxHp,Math.round(u.hp*1.12));
    u.dmg=Math.round(u.dmg*1.08);
    u.bladeGuard={dur:Math.round(3*GAME_TICK_HZ),dr:0.35};
    u.rampageHealPct=0.04;
    u._jazarBasePathApplied=true;
  }
  if(lv>=1)arena_setPassive(u,def.p1,linear,boost);
  if(lv>=3)arena_setPassive(u,def.p2,linear,boost);
  if(unitIdx===3&&u.branch==='a'&&lv>=3){
    u.hallowedLeap={cd:12*GAME_TICK_HZ,first:4*GAME_TICK_HZ,range:200,radius:90,dmgMult:0.45,tauntDur:2*GAME_TICK_HZ,shieldPct:0.10};
    if(u._hallowedLeapT==null)u._hallowedLeapT=u.hallowedLeap.cd-u.hallowedLeap.first;
  }
  // Bakdounes L5: Purify Ã¢â‚¬â€ cleanse grants 4s debuff immunity (base path only)
  if(unitIdx===11&&arena_isCapstoneLevel(lv)&&!u.branch)arena_setPassive(u,'purify',linear,boost);
  // Divine Storm Ã¢â‚¬â€ class passive shared by ALL paladin builds (base + Muqaddas
  // + Mubarak). Every 4th basic attack triggers a 4-wave holy AoE. Attached
  // here AFTER branch passives so it stacks on whichever P1/P2 the build has.
  if(u.paladinHybrid)arena_setPassive(u,'divineStorm',linear,boost);
  // ===== SHARED ON-HIT COUNTER (3/5/10 system) =====
  // All units with 3rd/5th/10th hit procs share one counter that resets at max.
  // Level gating: L2=3rd-hit, L3=5th-hit, L4=10th-hit.
  const _hasOnHit=[0,1,2,3,4,5,6,7,8,9,10].includes(unitIdx);
  if(_hasOnHit){
    u._onHitMax=boost>=1.5?8:10;
    u._hit3=boost>=1.5?2:3;
    u._hit5=boost>=1.5?4:5;
    u._hit10=boost>=1.5?8:10;
    u._onHitCount=0;
  }
  // Built-in AoE from level 1 Ã¢â‚¬â€ independent 3rd-hit cleave/pierce
  if(unitIdx===5){u._cleaveCounter=0;u._cleaveType='blade'}    // Jazar Ã¢â‚¬â€ Blade Cleave
  if(unitIdx===7){u._cleaveCounter=0;u._cleaveType='shadow'}   // Jafaar Ã¢â‚¬â€ Shadow Burst
  if(unitIdx===8){u._cleaveCounter=0;u._cleaveType='pierce'}   // Zaatar Ã¢â‚¬â€ Piercing Shot
  if(unitIdx===0){ // Zavs Ã¢â‚¬â€ Iron Brute on-hit procs
    u._zavsShieldBash=true;
  }
  if(unitIdx===2){
    u.batataMudClap=true;
  }
  // L3+ unit-specific extras (alongside the P2 unlock).
  if(lv>=3){
    // ===== SIGNATURE ABILITY - unlocks at L3 when the role path/spec is chosen =====
    const _sigKey=u.branch?(unitIdx+'_'+u.branch):null;
    const _sigId=u.branch?ARENA_BRANCH_SIGNATURES[_sigKey]:ARENA_BASE_SIGNATURES[unitIdx];
    if(lv>=3&&_sigId&&signatures[_sigId]){
      const _sig=signatures[_sigId];
      const _cdMult=arena_isCapstoneLevel(lv)?0.78:1.0;
      // ===== TIER-BASED CD + FIRST-CAST REMAP =====
      // User-tuned: first cast is fast (2-6s based on skill strength) so the
      // player sees the ult work immediately. Then a meaningful 20-50s CD
      // between subsequent casts. Stronger skills wait longer first AND
      // recharge slower.
      // Source-CD bucket Ã¢â€ â€™ (real CD, first-cast time)
      //   Ã¢â€°Â¤10s  Ã¢â€ â€™ 20s CD, 2s first cast (TIER 0 Ã¢â‚¬â€ fast/spammy)
      //   Ã¢â€°Â¤15s  Ã¢â€ â€™ 25s CD, 3s first cast (TIER 1 Ã¢â‚¬â€ quick utility)
      //   Ã¢â€°Â¤25s  Ã¢â€ â€™ 30s CD, 4s first cast (TIER 2 Ã¢â‚¬â€ standard)
      //   Ã¢â€°Â¤35s  Ã¢â€ â€™ 35s CD, 5s first cast (TIER 3 Ã¢â‚¬â€ strong)
      //   Ã¢â€°Â¤45s  Ã¢â€ â€™ 40s CD, 5s first cast (TIER 4 Ã¢â‚¬â€ heavy)
      //   else  Ã¢â€ â€™ 50s CD, 6s first cast (TIER 5 Ã¢â‚¬â€ ultimate)
      const _src=_sig.cd;
      let _realCdSec, _fcSec;
      if(_src<=10){_realCdSec=20;_fcSec=2}
      else if(_src<=15){_realCdSec=25;_fcSec=3}
      else if(_src<=25){_realCdSec=30;_fcSec=4}
      else if(_src<=35){_realCdSec=35;_fcSec=5}
      else if(_src<=45){_realCdSec=40;_fcSec=5}
      else{_realCdSec=50;_fcSec=6}
      const _cd=Math.round(_realCdSec*GAME_TICK_HZ*_cdMult);
      const _firstCast=_fcSec*GAME_TICK_HZ;
      u.signature={
        id:_sigId,name:_sig.name,cd:_cd,t:Math.max(0,_cd-_firstCast),fire:_sig.fire,
        // Stash for codex/upgrade-panel display
        cdSec:Math.round(_realCdSec*_cdMult),fcSec:_fcSec
      };
    }
    // Filfil Aswad (Inferno branch) Ã¢â‚¬â€ METEOR every 8s on a high-priority enemy.
    // Drops a flaming rock from the sky onto bosses/elites/clusters. Reuses
    // the existing bombs[meteor:true] render path.
    // Standalone Filfil Aswad meteor REMOVED Ã¢â‚¬â€ was firing simultaneously with the
    // inferno_storm signature ult, causing 4 meteors in 6s ("twice in a few seconds"
    // bug). The signature now provides Aswad's sky-drop ability cleanly.
    if(unitIdx===4){ // Felfel Ã¢â‚¬â€ Rogue built-ins (always active, all branches)
      u.shadowStep={range:130,landOffset:25};
      // Garrote + Sap + Slice and Dice are part of the BASE KIT and must persist
      // across branches (Shadow Dance explicitly "resets Garrote opener").
      arena_setPassive(u,'garrote',linear,boost);
      if(lv>=3)arena_setPassive(u,'sliceAndDice',linear,boost);
      if(u.branch==='a'){
        u.cloakOfShadows={cd:0,cooldown:15*GAME_TICK_HZ,dur:3*GAME_TICK_HZ,active:false};
      }
      if(u.branch==='b'){
        u.sepsis=true;
      }
    }
    if(unitIdx===1){ // Taoon - Death Knight branch built-ins
      arena_setPassive(u,'runeWound',linear,boost);
      if(u.branch==='a'){
        arena_setPassive(u,'bloodTithe',linear,boost);
      }
      if(u.branch==='b'){
        arena_setPassive(u,'graveMagnet',linear,boost);
        if(arena_isCapstoneLevel(lv)&&u.deathGrip)u.deathGrip.count=2;
      }
    }
  }
  // L5-only additions per unit (these layer on top of P1+P2 at max level).
  if(arena_isCapstoneLevel(lv)){
    if(unitIdx===11&&u.branch==='a'){ // Bakdounes Moonkin L5: Eclipse shifts at 4 hits, +1 max astral stack
      if(u._eclipse)u._eclipse.maxCount=4;
      if(u._astralPower){u._astralPower.maxStacks=4;u._astralPower.dmgPerStack=0.10}
    }
    if(unitIdx===10&&u.branch==='b'){ // Naana Shadow L5: +1 SW:P stack, 3 tentacles, 7s Voidform (proc thresholds via shared counter)
      if(u.shadowWordPain)u.shadowWordPain.maxStacks=4;
      if(u._voidTentacles)u._voidTentacles.count=3;
    }
    if(unitIdx===10&&u.branch!=='b'){ // Naana non-Shadow L5: Prayer bounces +2, Spirit of Redemption duration +3s
      if(u.prayerOfMending)u.prayerOfMending.maxBounces=6;
      if(u.angelOfMercy)u.angelOfMercy.dur=10*GAME_TICK_HZ;
    }
    // Alibaba L5 proc thresholds now handled by shared on-hit counter (boost>=1.5 Ã¢â€ â€™ 2/4/8)
    // Jafaar L5 proc thresholds now handled by shared on-hit counter (boost>=1.5 Ã¢â€ â€™ 2/4/8)
    // Zaatar L5 proc thresholds now handled by shared on-hit counter (boost>=1.5 Ã¢â€ â€™ 2/4/8)
    // Rumman L5 proc thresholds now handled by shared on-hit counter (boost>=1.5 Ã¢â€ â€™ 2/4/8)
    if(unitIdx===12){ // Habaq Ã¢â‚¬â€ Aromancer L5: Essence Mastery (+1 statue, stronger infusions)
      if(u.soothingAroma){u.soothingAroma.maxStatues=3;u.soothingAroma.healPct=Math.max(u.soothingAroma.healPct||0,0.36);u.soothingAroma.boltEvery=Math.min(u.soothingAroma.boltEvery||GAME_TICK_HZ,Math.round(1.00*GAME_TICK_HZ));}
      if(u.essenceInfusion){u.essenceInfusion.healMult=0.20;u.essenceInfusion.every=4;}
      if(u.essenceBond){u.essenceBond.echoPct=0.32;u.essenceBond.scanEvery=Math.round(1.2*GAME_TICK_HZ);}
      if(u.prescientMist){u.prescientMist.threshold=0.48;u.prescientMist.healMult=2.2;u.prescientMist.icdMax=10*GAME_TICK_HZ;}
      if(u.toxicBrew){u.toxicBrew.maxStacks=8;u.toxicBrew.dmgPct=Math.max(u.toxicBrew.dmgPct||0,0.22);}
    }
  }
}
export function applyPassiveToUnit(u,id,sc,boost,{gameTickHz}){
  const GAME_TICK_HZ=gameTickHz;
  switch(id){
    case 'taunt':     u.taunt={range:110*sc*boost}; break;
    case 'block':     u.block={chance:Math.min(0.5,0.12*sc*boost)}; break;
    // shieldBlock Ã¢â‚¬â€ Protection Zayt P1. Stronger block chance than base block
    // since Prot relies on damage mitigation as identity. L1=20%, L5=42% chance.
    case 'shieldBlock': u.block={chance:Math.min(0.55,0.20*sc*boost)}; break;
    // layOnHands Ã¢â‚¬â€ Holy Zayt P2 (proc-style version). Every 6s scans for an
    // ally below 35% HP and full-heals them. Reuses the L5 Naana mechanic.
    case 'layOnHands': u.layOnHandsProc={every:45*GAME_TICK_HZ,counter:0,threshold:0.35}; break;
    // ===== PHASE 2 Ã¢â‚¬â€ WC3 spec passives =====
    // === NAANA PRIEST PASSIVES ===
    case 'prayerOfMending': u.prayerOfMending={cd:0,every:Math.round(7.5*GAME_TICK_HZ),maxBounces:4,healPct:0.22*boost}; break;
    case 'angelOfMercy': u.angelOfMercy={used:false,dur:8*GAME_TICK_HZ}; break;
    case 'penance': u.penance={every:5,counter:0,bolts:5,dmgMult:0.80*boost}; break;
    case 'powerWordBarrier': u.powerWordBarrier={cd:0,every:12*GAME_TICK_HZ,radius:100,absorb:Math.round((230+46*(u.level||1))*boost)}; break;
    case 'shadowWordPain': u.shadowWordPain={dmgPct:0.36*boost,dur:5*GAME_TICK_HZ,maxStacks:3,weavingMult:0.07};
      u._shadowCrash={every:5,counter:0};
      u._voidTentacles={every:10,counter:0,count:2,dur:6*GAME_TICK_HZ,atkEvery:Math.round(0.6*GAME_TICK_HZ),dmgPct:1.2};
      u._voidEruption={cd:10*GAME_TICK_HZ,timer:3*GAME_TICK_HZ,range:80,dmgMult:2.0};
      break;
    case 'shadowApparitions': u.shadowApparitions={dmgPct:1.05*boost}; break;
    case 'vampiricEmbrace': u.vampiricEmbrace={healPct:0.25*boost}; break;
    case 'ironSkin':  u.ironSkin=4*sc*boost; break;
    case 'thorns':    u.thorns=0.20*sc*boost; break;
    case 'lastStand': u.lastStand={threshold:0.30,dr:0.50,used:false,timer:0}; break;
    case 'cleave':    u.cleave={arc:80,mult:0.50*sc*boost}; break;
    case 'crit':      u.crit={chance:Math.min(0.6,0.18*sc*boost),mult:2.0}; break;
    case 'execute':   u.execute={threshold:0.30,mult:3.0*boost}; break;
    case 'lifesteal': u.lifesteal=0.18*sc*boost; break;
    case 'bleed':     u.bleed={dmg:Math.round(4*sc*boost),dur:180}; break;
    case 'bash':      u.bash={chance:Math.min(0.4,0.12*sc*boost),dur:30}; break;
    case 'charge':    u.charge={radius:65,dmgMult:1.6*boost,stunDur:60,used:false}; break;
    case 'shadowStrike':
      // Stealth on spawn Ã¢â‚¬â€ enemies skip Felfel as a target until she attacks.
      // First attack out of stealth deals 2.0Ãƒâ€” (was 2.5Ãƒâ€” Ã¢â‚¬â€ Felfel was overtuned
      // when the multipliers stacked with vs-ranged crit). Re-stealth after 4s
      // of idle (no attack, no damage taken).
      u.stealth=true;u.stealthHits=0;u.firstHitDone=false;u.idleT=0;
      u.firstHitMult=2.0*boost;
      u.prefersRanged=true;
      break;
    case 'splash':    u.splash={radius:48,mult:0.40*sc*boost}; break;
    case 'slowAura':  u.slowAura={radius:120,mult:Math.max(0.85,0.92-0.015*sc*boost)}; break; // 8-15% slow (was 20-42%)
    case 'hotStreak':  u.hotStreak={every:5,counter:0,mult:1.75*boost}; u._scorch={every:3,counter:0}; u._combustionProc={every:10,counter:0}; break;
    case 'ignite':     u.ignite={pct:0.18*sc*boost,dur:3*GAME_TICK_HZ,maxStacks:2}; break;
    case 'pyromaniac': u.pyromaniac={mult:1.20}; break;
    case 'firestarter':u.firestarter={mult:1.5*sc*boost,radius:70}; break;
    case 'overload':   u.overload={chance:0.20,chainCount:2,chainMult:0.40}; u._lightningBolt={every:3,counter:0}; u._chainThunder={every:5,counter:0}; u._ascendanceProc={every:10,counter:0}; break;
    case 'stormkeeper':u.stormkeeper={every:8,counter:0,mult:2.5,stunDur:Math.round(0.7*GAME_TICK_HZ)}; break;
    case 'frostbolt':  u.frostboltPassive={slowMult:0.65,dur:2*GAME_TICK_HZ}; u._iceLance={every:3,counter:0}; u._flurry={every:5,counter:0}; u._icyVeinsProc={every:10,counter:0}; break;
    case 'shatter':    u.shatter={mult:1.20}; break;
    case 'curse':     u.curse={mult:1.0+0.03*sc*boost,dur:240}; break;
    case 'drain':     u.drain=0.22*sc*boost; break;
    case 'agony':     u.agony={tickMult:0.40*boost,maxStacks:4,dur:6*GAME_TICK_HZ}; u._maleficRapture={every:3,counter:0}; u._soulRot={every:5,counter:0}; u._darkSoulProc={every:10,counter:0}; break;
    case 'unstableAffliction': u.unstableAffliction={radius:68,burstMult:0.30,maxTargets:3}; break;
    case 'aimedShot': u.aimedShot={every:5,mult:2.2*boost,counter:0,dazeDur:60}; break; // 5th shot dazes for 0.5s, mult 2.2Ãƒâ€” (was 2.5Ãƒâ€”) to balance the new stun
    case 'pierce':    u.pierce=true; break;
    case 'knockback': u.knockback=10*sc*boost; break;
    case 'deathBoom': u.deathBoom={radius:65,mult:3.0*sc*boost}; break;
    case 'smiteHeal': u.smiteHeal=Math.round(35*sc*sc*boost); break; // L1=35, L3=50, L5=103
    case 'shield':    u.shieldEvery={every:5,amount:Math.round(60*sc*sc*boost),counter:0}; break; // L1=60, L3=86, L5=176
    case 'healAura':  u.healAura={radius:135,hps:Math.round(13*sc*sc*boost),tick:0}; break;
    case 'cleanse':   u.cleanse={every:360,counter:0}; break;
    case 'lifebloom': u.lifebloom={bloomAt:3,hotPct:0.025*boost,bloomPct:0.15*boost,bloomR:100}; break;
    case 'efflorescence': u.efflorescence={cd:0,every:16*GAME_TICK_HZ,maxRings:2,healPct:0.025*boost,ringR:100,ringDur:16*GAME_TICK_HZ}; break;
    case 'toxicFlask': u.toxicFlask={dmgPct:0.15*boost,dur:5*GAME_TICK_HZ,maxStacks:3}; break;
    case 'corrosiveBrew': u.corrosiveBrew={ampPct:0.20}; break;
    case 'eclipseCycle': u._eclipse={phase:'solar',count:0,maxCount:4,solarDmgMult:1.0,lunarSlowPct:0.20*boost}; u._solarGust={counter:0,every:3}; break;
    case 'astralPower': u._astralPower={stacks:0,maxStacks:3,dmgPerStack:0.10*boost,decayCD:0,decayEvery:10*GAME_TICK_HZ}; break;
    case 'wildGrowth': u.wildGrowth={cd:0,every:10*GAME_TICK_HZ,targets:3,hotPct:0.04*boost,hotDur:6*GAME_TICK_HZ}; break;
    case 'naturesBlessing': u.naturesBlessing={cd:0,every:10*GAME_TICK_HZ,dmgBuff:0.25,dur:5*GAME_TICK_HZ}; break;
    // groupHeal + inspire removed (old Habaq bard passives Ã¢â‚¬â€ replaced by Aromancer)
    case 'champion':  u.champion={mult:1.0+0.05*sc*boost}; break; // L1 +5%, L5 +10.5% (premium hero aura)
    case 'devour':    u.devour={heal:0.30*boost,instakillHp:60*boost}; break;
    case 'autoTurret': {const _atEvery=(boost>=1.5?8:10)*GAME_TICK_HZ;u.autoTurret={cd:_atEvery-2*GAME_TICK_HZ,every:_atEvery,maxTurrets:2,dmgMult:0.34*boost,utility:true};} u._taserShock={every:3,counter:0}; u._grenadeToss={every:5,counter:0}; u._turretOverdrive={every:10,counter:0}; break;
    case 'overclock': u.overclock={counter:0,every:7,dur:3*GAME_TICK_HZ,spdMult:1.30,active:0}; break;
    case 'tankCharge':u.tankCharge={range:80,radius:50,dmgMult:1.4*boost,stunDur:36,used:false}; break;
    case 'shieldBash': u._zavsShieldBash=true; break;
    case 'bodyguardLine': u.zavsCitadel={radius:170,dr:0.12}; break;
    case 'guardPulse': u.zavsGuardPulseReady=true; break;
    case 'forwardStandard': u.zavsVanguard={radius:170,dmgMult:1.05,pierceAtkSpd:0.04}; break;
    case 'armorCrack': u.zavsArmorCrackReady=true; break;
    case 'mudClap': u.batataMudClap=true; break;
    case 'batataRoleChoice': break;
    case 'backlineGarden': u.backlineGarden={radius:170,dr:0.10,healMult:1.08};u.batataMudClap=true; break;
    case 'mirebreaker': u.batataMauler={radius:120,dr:0.10};u.batataMudClap=true; break;
    case 'deathGrip': {
      u.deathGrip={cd:0,every:6*GAME_TICK_HZ,range:210,stunDur:Math.round(0.35*GAME_TICK_HZ),count:1};
      break;
    }
    // ===== HABAQ (Aromancer) PASSIVES =====
    case 'soothingAroma': u.soothingAroma={spawnCD:3*GAME_TICK_HZ,spawnEvery:5*GAME_TICK_HZ,maxStatues:2,healPct:0.32,statueDur:7*GAME_TICK_HZ,boltEvery:Math.round(1.15*GAME_TICK_HZ)};u._aromaStatues=[]; break;
    case 'essenceInfusion': u.essenceInfusion={counter:0,every:5,healMult:0.16,dur:4*GAME_TICK_HZ}; break;
    case 'essenceBond': u.essenceBond={target:null,echoPct:0.25,scanEvery:Math.round(1.8*GAME_TICK_HZ),scanT:0}; break;
    case 'prescientMist': u.prescientMist={threshold:0.44,healMult:2.0,icd:0,icdMax:12*GAME_TICK_HZ}; break;
    case 'toxicBrew': u.toxicBrew={maxStacks:6,dmgPct:0.24,dur:6*GAME_TICK_HZ}; break;
    case 'volatileMixture': u.volatileMixture={counter:0,every:4,dmgMult:4.0,radius:82}; break;
    case 'mirror':    u.mirror={hpPct:0.60,dmgPct:1.0}; break; // spawn handled in arena_respawnSquad
    // ===== arena BRANCH PASSIVES (Part 2 of class-branch system) =====
    // Tank branches
    case 'reflect':   u.reflect={pct:0.25*boost}; break;
    case 'frenzy':    u.frenzy={threshold:0.40,atkSpdMult:0.77,dmgMult:1.30,active:false}; break;
    case 'spellReflect': u.hasSpellReflect=true;u.spellReflectCD=8*GAME_TICK_HZ;u.spellReflectReady=false; break;
    case 'demoralizingShout': u.hasDemoShout=true;u.demoShoutCD=3*GAME_TICK_HZ;u.demoShoutActive=0; break;
    case 'rallyCry':  u.hasRallyCry=true;u.rallyCryCD=8*GAME_TICK_HZ;u.rallyCryActive=0; break;
    case 'magicWard': u.magicWard={cd:8*GAME_TICK_HZ,t:0,ready:true}; break;
    case 'gripBleed': {
      const _lv=Math.round((sc-1)/0.10)+1;
      const _count=arena_isCapstoneLevel(_lv)?3:1;
      u.deathGrip={cd:0,every:5*GAME_TICK_HZ,range:160,stunDur:30,count:_count};
      u.gripBleed={dmg:Math.round(50*sc*boost),dur:4*GAME_TICK_HZ};
      break;
    }
    // ===== TAOON (Death Knight) branch passives =====
    case 'runeWound': u.runeWound=true;u.necropolisGuard={threshold:0.40,dr:0.25,dur:4*GAME_TICK_HZ,cd:14*GAME_TICK_HZ,timer:0,cdTimer:0}; break;
    case 'bloodTithe': u.bloodTithe={radius:190,shieldPct:0.25,capPct:0.07}; break;
    case 'graveMagnet': u.graveMagnet=true; break;
    case 'soulChains': u.soulChains={radius:80,slowDur:Math.round(2.5*GAME_TICK_HZ),slowMult:0.75,interruptDur:Math.round(0.35*GAME_TICK_HZ)}; break;
    case 'soulReaper': u.soulReaper={maxStacks:3,stackDur:5*GAME_TICK_HZ,burstMult:2.5*boost}; break;
    case 'deathStrike': u.deathStrike={healPct:0.08,lowHealPct:0.12,lowThreshold:0.45,dmgMult:0.60};u.bloodTithe={radius:190,shieldPct:0.25,capPct:0.07}; break;
    case 'boneShield': u.boneShield={charges:6,maxCharges:6,rechargeEvery:8*GAME_TICK_HZ,rechargeT:0,dr:0.10}; break;
    case 'plagueStrike': u.plagueStrike={dotDmg:Math.round(8*sc*boost),dotDur:4*GAME_TICK_HZ,spreadRadius:60}; break;
    case 'raiseGhoulPassive': {
      const _lv=Math.round((sc-1)/0.10)+1;
      u.raiseGhoul={chance:0.30,maxGhouls:arena_isCapstoneLevel(_lv)?3:2,active:0};
      break;
    }
    case 'armorRegen': u.armorRegen={every:60,t:0,amount:2}; break;
    case 'reviveOnce': u.reviveOnce={used:false,pct:0.40,cleaveBonus:true}; break;
    // ===== BATATA (Primal Guardian) passives =====
    case 'ironfur': u.ironfur={stacks:0,maxStacks:3,perStack:3,timer:0,dur:360,hitCount:0,every:3}; break;
    case 'thrashBleed': u.thrashBleedPassive=true; break;
    case 'earthwarden': u.earthwardenShield=0;u.earthwardenTimer=0; break;
    case 'frenziedRegen': u.frenziedRegen={active:false,timer:0,cd:0,threshold:0.60,healPct:0.03,dur:300,cooldown:1200}; break;
    case 'entanglingRoots': u.entanglingRoots={cd:0,every:8*GAME_TICK_HZ,radius:120,rootDur:3*GAME_TICK_HZ,maxTargets:3}; break;
    case 'rejuvAura': u.rejuvAura={radius:120,healPct:0.015,every:GAME_TICK_HZ}; break;
    case 'galacticGuardian': u.galacticGuardian={cd:0,cooldown:180,chance:0.10,radius:100,mult:1.5}; break;
    case 'swipePassive': u.swipePassive={radius:100,bleedExtend:120}; break;
    // DPS branches
    case 'backstab':
      u.stealth=true;u.stealthHits=0;u.firstHitDone=false;u.idleT=0;
      u.firstHitMult=3.0*boost;u.prefersRanged=false;
      u.firstHitBleed={dmg:Math.round(30*sc*boost),dur:4*GAME_TICK_HZ};
      break;
    case 'whirlwind': u.whirlwind={every:5,counter:0,radius:80,mult:0.70*boost}; break;
    // ===== FELFEL (Rogue) PASSIVES =====
    case 'garrote':
      u.stealth=true;u.stealthHits=0;u.firstHitDone=false;u.idleT=0;
      u.firstHitMult=2.0*boost;u.prefersRanged=true;
      u.garrote={silenceDur:3*GAME_TICK_HZ,bleedDmg:Math.round(u.dmg*0.20),bleedDur:4*GAME_TICK_HZ};
      u.sap={dur:4*GAME_TICK_HZ};
      u._cheapShot={every:3,counter:0};
      u._markedForDeath={every:10,counter:0};
      break;
    case 'sliceAndDice': u.sliceAndDice={every:5,counter:0,dur:5*GAME_TICK_HZ,spdMult:1.40,timer:0}; break;
    case 'shadowDance':
      u.shadowDance={every:12*GAME_TICK_HZ,dur:3*GAME_TICK_HZ,t:0};
      u._cheapShot={every:3,counter:0};
      u._shadowBlades={every:10,counter:0};
      break;
    case 'eviscerate': u.eviscerate={every:5,counter:0,mult:2.7*boost}; break;
    case 'bladeFlurry':
      u.bladeFlurry={mult:0.80};
      u._mutilate={every:3,counter:0};
      u._markedForDeath={every:10,counter:0};
      break;
    case 'crimsonVial': u.crimsonVial={threshold:0.40,healPct:0.04,dur:4*GAME_TICK_HZ,cd:15*GAME_TICK_HZ,timer:0,active:false,activeTimer:0}; break;
    case 'bladeRush':
      u.bladeRush={cd:6*GAME_TICK_HZ,every:8*GAME_TICK_HZ,radius:155,maxDash:135,dmgMult:1.5*boost,width:35};
      u.bladeGuard={dur:Math.round(3*GAME_TICK_HZ),dr:0.32};
      u.rampageHealPct=0.035;
      u._ragingBlow={every:3,counter:0};
      u._rampage={every:5,counter:0};
      u._warbreaker={every:10,counter:0};
      break;
    case 'risingSlash': u.risingSlash={every:4,counter:0,mult:1.6*boost,stunDur:30}; break;
    case 'mortalStrike':
      u.mortalStrike={every:3,counter:0,mult:1.6*boost};
      u.bladeGuard={dur:Math.round(3*GAME_TICK_HZ),dr:0.35};
      u.rampageHealPct=0.045;
      u.lifesteal=(u.lifesteal||0)+0.04;
      u._rampage={every:5,counter:0};
      u._warbreaker={every:10,counter:0};
      break;
    case 'executeBlade': u.executeBlade={threshold:0.25,mult:2.0*boost}; break;
    case 'windStep':
      u.windStep={active:true,iframeDur:15};
      u.bladeGuard={dur:Math.round(3*GAME_TICK_HZ),dr:0.35};
      u.rampageHealPct=0.035;
      u._ragingBlow={every:3,counter:0};
      u._rampage={every:5,counter:0};
      u._warbreaker={every:10,counter:0};
      break;
    case 'bladeDance': u.bladeDance={cd:0,every:5*GAME_TICK_HZ,radius:80,mult:1.2*boost}; break;
    case 'enrageBlade': u.enrageBlade={threshold:0.50,spdMult:1.25,dmgMult:1.20,active:false,dur:8*120}; break;
    // Ranged / caster branches
    case 'strongSlow': u.slowAura={radius:100,mult:0.50}; break;
    case 'frostBolt':  u.frostBolt={every:4,counter:0,freezeDur:90}; break;
    case 'burnDot':    u.burnDot={dmg:Math.round(8*sc*boost),dur:240,maxStacks:3}; break;
    case 'plagueCloud':u.plagueCloud={radius:80,mult:1.0+0.03*sc*boost,dur:240}; break;
    case 'minionExplode': u.minionExplodeSrc={dmg:Math.round(30*sc*boost),radius:50}; u.curse={mult:1.0+0.03*sc*boost,dur:240}; break;
    case 'demonicEmpowerment': u.demonicEmpowerment={cd:0,every:20*GAME_TICK_HZ,dur:6*GAME_TICK_HZ,dmgMult:1.50,atkSpdMult:0.70}; u._demonbolt={every:3,counter:0}; u._handOfGuldan={every:5,counter:0}; u._netherPortalProc={every:10,counter:0}; break;
    case 'soulLink': u.soulLink={pct:0.20}; break;
    case 'immolate': u.immolate={radius:62,dur:3*GAME_TICK_HZ,dmgPct:0.34*boost,maxPatches:4,patches:[]}; u._conflagrate={every:3,counter:0}; u._rainOfFire={every:5,counter:0}; u._darkSoulInstability={every:10,counter:0}; break;
    case 'havoc': u.havoc={remarkEvery:4*GAME_TICK_HZ,remarkT:0,mirrorPct:0.65,target:null}; break;
    // Sniper branches
    case 'aimedSniper': u.aimedShot={every:4,mult:3.0*boost,counter:0,dazeDur:75}; break; // every 4 (was 3), mult 3.0 (was 4.0), daze 1.25s (was 1.5s)
    case 'tripleShot':  u.tripleShot={count:3,spread:0.35,mult:0.80}; break;
    // ===== ZAATAR (Hunter Ã¢â‚¬â€ WoW Marksmanship/Survival/Beast Mastery) PASSIVES =====
    case 'aimedShotMark': u.aimedShotMark={every:3,mult:2.5*boost,counter:0,markDur:4*GAME_TICK_HZ,markAmp:0.20}; u._arcaneShot={every:3,counter:0}; u._multiShot={every:5,counter:0}; u._trueshotProc={every:10,counter:0}; break;
    case 'steadyFocus': u.steadyFocus={threshold:2*GAME_TICK_HZ,speedBonus:0.75,timer:0,active:false}; break;
    case 'explosiveTrap': u.explosiveTrap={cd:0,every:7*GAME_TICK_HZ,radius:70,dmgMult:2.5*boost,maxTraps:3,triggerDist:40,nextType:0,
      slowPct:0.40,slowDur:3*GAME_TICK_HZ,rootDur:2*GAME_TICK_HZ}; u._traps=[]; u._serpentSting={every:3,counter:0}; u._steelTrap={every:5,counter:0}; u._wildfireBomb={every:10,counter:0}; break;
    case 'lockAndLoad': u.lockAndLoad={charges:0,maxCharges:3,dmgMult:0.40*boost}; break;
    case 'killCommand': u.killCommand={every:6,counter:0,dmgMult:3.0*boost}; u._cobraShot={every:3,counter:0}; u._barbedShot={every:5,counter:0}; u._frenzyProc={every:10,counter:0}; break;
    case 'bestialWrath': u.bestialWrath={cd:0,every:18*GAME_TICK_HZ,dur:6*GAME_TICK_HZ,dmgMult:1.50,atkSpdMult:0.70}; break;
    // Bomb branches
    case 'artilleryTurret': {const _atEvery=(boost>=1.5?11:14)*GAME_TICK_HZ;u.autoTurret={cd:_atEvery-3*GAME_TICK_HZ,every:_atEvery,maxTurrets:3,dmgMult:0.55*boost,artillery:true,artilleryRange:340,aoeRadius:72};} u._clusterMunition={every:3,counter:0}; u._napalmStrike={every:5,counter:0}; u._siegeMode={every:10,counter:0}; break;
    case 'munitionsCache': u.munitionsCache={stacksPerKill:0.15,maxStacks:1.0}; break;
    case 'mechSuit': u.mechSuit={active:true,bonusDmg:0.35*boost,escortSpawned:false,maxEscorts:2}; if(u._mechSuitBaseDmg==null){u._mechSuitBaseDmg=u.dmg;u.dmg=Math.round(u.dmg*(1+u.mechSuit.bonusDmg));} u._gatlingBurst={every:3,counter:0}; u._missileSalvo={every:5,counter:0}; u._mechOverload={every:10,counter:0}; break;
    case 'rocketPunch': u.rocketPunch={counter:0,every:4,dmgMult:3.0*boost,knockback:30,aoeRadius:60}; break;
    // Healer branches
    case 'holyStrike': u.holyStrike={every:4,counter:0,bossMult:2.0,purge:true}; break;
    case 'renewAura':  u.renewAura={radius:150,hps:Math.round(7*sc*boost),tick:0}; break;
    case 'resurrection': u.resurrection={used:false,pct:0.50,cd:0,scanEvery:30,t:0}; break;
    case 'bigHealAura': u.healAura={radius:200,hps:Math.round(22*sc*sc*boost),tick:0}; break; // restored to 22 Ã¢â‚¬â€ Lay on Hands CD nerf to 25s addresses Holy Zayt's overall power instead
    case 'wildGrowth':  u.wildGrowth={cd:0,every:20*GAME_TICK_HZ,pct:1.0}; break;
    case 'purify': u.purify=true; break; // upgrades base cleanse: also grants 4s debuff immunity
    case 'antidoteField': u.antidoteField={cd:0,every:10*GAME_TICK_HZ,dur:4*GAME_TICK_HZ,radius:80,hps:Math.round(30*sc*boost),active:null}; break;
    // bardicInspiration + mindControlEarly removed (old Habaq branch passives)
    // Hero branches (Vodka)
    case 'personalWhirlwind': u.personalWhirlwind={cd:0,every:6*GAME_TICK_HZ,radius:100,mult:0.80*boost}; break;
    case 'bloodfury': u.atkSpd=Math.max(8,Math.round(u.atkSpd*0.77)); u.bloodfury=true; break;
    case 'battleStandard': u.battleStandard={placed:false,x:0,y:0,radius:200,mult:1.08}; break; // zone +8% dmg (was +25%)
    // raiseSwarm / raiseElite removed (old Kharroob branch passives)
    // ===== ZAYT (Retribution Paladin) PASSIVES =====
    // Wings of Light Ã¢â‚¬â€ always-on +20% damage + 20% crit chance
    case 'wingsOfLight':
      u.paladinWings=true;
      u.dmg=Math.round(u.dmg*1.20*boost);
      if(u.crit){u.crit.chance=Math.min(0.6,(u.crit.chance||0)+0.20*boost)}
      else{u.crit={chance:Math.min(0.6,0.20*boost),mult:2.0}}
      u._bladeOfJustice={every:3,counter:0};
      u._hammerOfLight={every:5,counter:0};
      u._wakeOfAshesProc={every:10,counter:0};
      break;
    // Shield of Vengeance Ã¢â‚¬â€ absorb 20% max HP, then burst AoE holy (15s CD)
    case 'shieldOfVengeance':
      u.shieldOfVengeance={cd:0,every:15*GAME_TICK_HZ,shieldPct:0.20*boost,radius:80,absorbed:0,active:false};
      break;
    // Avenger's Shield (Prot branch) - every 6s throw bouncing shield, 3 targets
    case 'avengersShield':
      u.avengersShield={cd:2*GAME_TICK_HZ,every:6*GAME_TICK_HZ,bounces:3,l4Bounces:5,mult:1.5,l4Mult:1.65,shieldCapPct:0.12,l4ShieldCapPct:0.16,silenceDur:180};
      u._judgmentGuard={every:3,counter:0};
      u._sacredBulwark={every:5,counter:0};
      u._guardianOath={every:10,counter:0};
      break;
    // Ardent Defender (Prot branch) Ã¢â‚¬â€ cheat death, revive at 30% + 4s invuln
    case 'ardentDefender':
      u.ardentDefender={used:false,revivePct:0.40,invulnDur:1*GAME_TICK_HZ,resetCD:45*GAME_TICK_HZ,resetT:0};
      break;
    case 'lightOfDawn':
      u.lightOfDawn={counter:0,every:4,healPct:0.08*boost,range:140,arc:Math.PI*0.6};
      break;
    case 'wordOfGlory':
      u.wordOfGlory={counter:0,every:5,healPct:0.18*boost,hotPct:0.03*boost,hotDur:4*GAME_TICK_HZ};
      break;
    // Legacy passives kept for compat
    case 'paladinWings':
      u.paladinWings=true;
      u.dmg=Math.round(u.dmg*1.20*boost);
      if(u.crit){u.crit.chance=Math.min(0.6,(u.crit.chance||0)+0.20*boost)}
      else{u.crit={chance:Math.min(0.6,0.20*boost),mult:2.0}}
      break;
    case 'freedom':
      u.freedom={cd:0,every:6*GAME_TICK_HZ,dur:4*GAME_TICK_HZ,mult:1.50*boost};
      break;
    case 'magicShield':
      u.magicShieldGiver={cd:0,every:7*GAME_TICK_HZ,amount:Math.round(80*sc*boost),radius:200};
      break;
    case 'vengeanceStrike':
      u.vengeanceStrike={every:4,counter:0,mult:2.0*boost,radius:60};
      break;
    case 'divineStorm':
      u.divineStorm={every:4,counter:0};
      break;
    case 'holyPower':
      u._origDmgHolyPower=u._origDmgHolyPower||u.dmg;
      u.dmg=Math.round(u._origDmgHolyPower*1.20);
      u.lifesteal=(u.lifesteal||0)+0.15;
      break;
  }
}

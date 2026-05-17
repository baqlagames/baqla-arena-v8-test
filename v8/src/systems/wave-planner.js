import { ENEMIES } from '../data/enemies.js';
import { ARENA_WAVE_MECHANIC_LABELS, ARENA_WAVE_THEMES } from '../data/waves.js';

// Pure wave-planning helpers extracted from arena-runtime.

export function arena_waveEnemyCap(stageNum,round){
  stageNum=stageNum||1;round=round||1;
  const base=stageNum<=5?15:stageNum<=10?18:stageNum<=15?20:stageNum<=20?22:24;
  return Math.max(9,base+Math.max(0,Math.min(2,round-4)));
}
export function arena_spreadCapWaveQueue(queue,cap){
  if(!queue||queue.length<=cap)return queue;
  const out=[];
  for(let i=0;i<cap;i++)out.push(queue[Math.floor(i*queue.length/cap)]);
  return out;
}

export function arena_pickWaveMechanic(stageNum,round,isBoss){
  if(isBoss)return null;
  stageNum=stageNum||1;round=round||1;
  if(stageNum<=2)return null;
  if(stageNum<=5&&round!==3&&round!==5)return null;
  if(stageNum<=10&&round!==2&&round!==4&&round!==5)return null;
  if(stageNum>=11&&round===1)return null;
  const pool=stageNum<=5?['shield','medic','banner']
    :stageNum<=10?['shield','banner','medic','sniper']
    :['medic','shield','banner','ritual','medic','shield','sniper','exploding'];
  const type=pool[(stageNum*7+round*3)%pool.length];
  return{type,label:ARENA_WAVE_MECHANIC_LABELS[type]||'Special Enemy'};
}
export function arena_waveMechanicLimit(stageN,round,type){
  if(stageN>=11&&round>=4&&(type==='medic'||type==='shield'||type==='banner'||type==='ritual'))return 2;
  return 1;
}

export function arena_themedWaveQueue(round,stageNum,act){
  const actEnemies=ENEMIES.filter(e=>e.act===act);
  if(!actEnemies.length)return{theme:'WAVE',queue:[],previewName:''};
  const findAll=arch=>actEnemies.filter(e=>e.arch===arch);
  const find=arch=>{const arr=findAll(arch);return arr.length?arr[(round-1)%arr.length]:null};
  const findFlag=(flag)=>{const arr=actEnemies.filter(e=>e[flag]);return arr.length?arr[(round-1)%arr.length]:null};
  const tank=find('tank');
  const dps=find('dps');
  const ranged=find('ranged');
  const caster=find('caster');
  const swarmReal=find('swarm');           // true swarm only (low-dmg, low-hp)
  const assassin=find('assassin');         // separated Ã¢â‚¬â€ assassins hit HARD
  const aoe=find('aoe');
  const infiltrator=findFlag('prefersBackline');
  // Resistance / movement archetypes (added 2026-05-03 with armor-type matrix).
  const findArmor=(arm)=>{const arr=actEnemies.filter(e=>e.armorType===arm);return arr.length?arr[(round-1)%arr.length]:null};
  const heavyEnemy=findArmor('heavy');
  const wardedEnemy=findArmor('warded');
  const flyingEnemy=(()=>{const arr=actEnemies.filter(e=>e.flying);return arr.length?arr[(round-1)%arr.length]:null})();
  const burrowEnemy=(()=>{const arr=actEnemies.filter(e=>e.burrow);return arr.length?arr[(round-1)%arr.length]:null})();
  // Fallbacks so every act has a usable enemy in every slot.
  const dpsLike=dps||caster||actEnemies[0];
  const rangedLike=ranged||caster||dpsLike;
  // swarmLike: prefer real swarm > dps > caster > assassin (assassin is
  // last-resort because they hit very hard Ã¢â‚¬â€ falling back to assassin in a
  // SWARM_RUSH multiplied 6+ enemies of high-dmg assassins, which trivially
  // wipes a fresh-build squad. Use dps before assassin to keep the wave
  // survivable in acts 2/3 that lack a real swarm enemy.
  const swarmLike=swarmReal||dps||caster||assassin||actEnemies[0];
  const swarmIsAssassin=!swarmReal&&!dps&&!caster; // we fell all the way to assassin
  const tankLike=tank||actEnemies[0];
  const aoeLike=aoe||dpsLike;
  const infiltratorLike=infiltrator||assassin||swarmLike;
  const casterLike=caster||rangedLike;
  // Six-round pacing: fewer total waves, so stage scaling is gentler and
  // round pressure climbs inside the five setup waves instead of relying on
  // very long late-stage enemy counts.
  const stageBonus=1+Math.floor(stageNum/4);
  const roundBonus=Math.floor(Math.max(0,round-1)*0.75);
  let queue=[];
  const _push=(e,n)=>{for(let i=0;i<n;i++)queue.push(e.id)};
  const _shortName=e=>(e.name.split(' ').pop());
  // R1 rotates based on stage Ã¢â‚¬â€ gives variety from the start.
  // Stage 1 is always SWARM_RUSH (forgiving opener for first stage only).
  // R2+ continues rotating from there.
  const _r1Themes=[0,3,1,4,2,5,0,6,1,7,3,8,0,9,2,10,4,11,0,3,1,5,2,6,0,4];
  const themeIdx=(round===1)
    ? _r1Themes[(stageNum-1)%_r1Themes.length]
    : ((stageNum-1)+(round-2))%ARENA_WAVE_THEMES.length;
  const themeKey=ARENA_WAVE_THEMES[themeIdx];
  let theme='WAVE',preview='';
  // Every theme guarantees Ã¢â€°Â¥5 enemies per wave (enforced by base counts below).
  // Stage bonus adds more on top so stage 25 R1 has roughly 2Ãƒâ€” stage 1 R1.
  switch(themeKey){
    case 'SWARM_RUSH':{
      theme='SWARM RUSH';
      // When swarmLike falls back to a high-damage assassin (acts 2/3 don't
      // have a real swarm enemy), cap the count tightly Ã¢â‚¬â€ 6+ assassins on R1
      // of a fresh stage is unwinnable. Real swarm scales fine.
      let swCount=8+stageBonus+roundBonus;
      if(swarmIsAssassin){swCount=Math.min(swCount,4)} // cap at 4 assassins
      _push(swarmLike,swCount);
      _push(dpsLike,1);
      // Armor mix: at S5+ add 1 heavy enemy so single-attack-type comps need a
      // counter even on swarm waves. Pure swarm at low stages stays simple.
      const _swMixHeavy=stageNum>=5&&heavyEnemy;
      if(_swMixHeavy)_push(heavyEnemy,1);
      preview=swCount+'Ãƒâ€” '+_shortName(swarmLike)+'  +  1Ãƒâ€” '+_shortName(dpsLike)+(_swMixHeavy?('  +  1Ãƒâ€” '+_shortName(heavyEnemy)+' (HEAVY)'):'');
      break;
    }
    case 'TANK_WALL':{
      theme='TANK WALL';
      const tCount=1+Math.floor(stageNum/8);  // S1=1, S8=2, S16=3, S24=4
      const esc=6+Math.floor(stageNum/4)+roundBonus;
      _push(tankLike,tCount);
      _push(dpsLike,esc);
      preview=tCount+'Ãƒâ€” '+_shortName(tankLike)+'  +  '+esc+'Ãƒâ€” '+_shortName(dpsLike);
      break;
    }
    case 'RANGED_KITE':{
      theme='RANGED KITE';
      // Early rounds (R1-R2) get fewer ranged Ã¢â‚¬â€ player lacks gold for counters.
      const _earlyReduce=round<=2?2:0;
      const rCount=Math.max(3,6+Math.floor(stageNum/4)+roundBonus-_earlyReduce);
      _push(rangedLike,rCount);
      let _hasC=false;
      if(caster&&caster.id!==rangedLike.id){_push(caster,1);_hasC=true}
      const escort=tank&&tank.id!==rangedLike.id?tank:(dps&&dps.id!==rangedLike.id?dps:null);
      if(escort){_push(escort,1)}
      const _parts=[rCount+'Ãƒâ€” '+_shortName(rangedLike)];
      if(_hasC)_parts.push('1Ãƒâ€” '+_shortName(caster));
      if(escort)_parts.push('1Ãƒâ€” '+_shortName(escort));
      preview=_parts.join('  +  ');
      break;
    }
    case 'MIXED_PUSH':{
      theme='MIXED PUSH';
      const mix=[tankLike,dpsLike,rangedLike];
      if(caster&&!mix.find(e=>e.id===caster.id))mix.push(caster);
      const seen=new Set();
      for(const e of mix)if(!seen.has(e.id)){_push(e,1);seen.add(e.id)}
      const extras=5+Math.floor(stageNum/4)+roundBonus;
      for(let i=0;i<extras;i++)_push(mix[i%mix.length],1);
      preview=mix.map(_shortName).join(' + ')+' (Ãƒâ€”'+(mix.length+extras)+')';
      break;
    }
    case 'AOE_BARRAGE':{
      theme='AOE BARRAGE';
      const aoeCount=5+Math.floor(stageNum/4)+roundBonus; // S1R1=5, S1R5=7
      const dpsC=3+Math.floor(stageNum/7)+Math.floor(roundBonus/2);
      _push(aoeLike,aoeCount);
      _push(dpsLike,dpsC);
      // Armor mix: include 1 warded caster from S3+ so the AoE barrage demands
      // physical/pierce damage in addition to ranged AoE clear.
      const _aoeMixWard=stageNum>=3&&wardedEnemy;
      if(_aoeMixWard)_push(wardedEnemy,1);
      preview=aoeCount+'Ãƒâ€” '+_shortName(aoeLike)+'  +  '+dpsC+'Ãƒâ€” '+_shortName(dpsLike)+(_aoeMixWard?('  +  1Ãƒâ€” '+_shortName(wardedEnemy)+' (WARD)'):'');
      break;
    }
    case 'BACKLINE_STRIKE':{
      theme='BACKLINE STRIKE';
      // Infiltrator count stays low (design intent: scary if reaches backline).
      // Big escort wave so the player can't just camp 1 healer behind tanks.
      const infCount=1+Math.floor(stageNum/6)+Math.floor(roundBonus/3); // infiltrators ramp slowly
      const escCount=6+Math.floor(stageNum/5)+roundBonus;
      _push(infiltratorLike,infCount);
      _push(dpsLike,escCount);
      // Armor mix: 1 heavy tank as escort anchor so physical comps can't ignore
      // the front while focusing on infiltrators with magic.
      const _bsMixHeavy=stageNum>=4&&heavyEnemy;
      if(_bsMixHeavy)_push(heavyEnemy,1);
      preview=infCount+'Ãƒâ€” '+_shortName(infiltratorLike)+'  +  '+escCount+'Ãƒâ€” '+_shortName(dpsLike)+(_bsMixHeavy?('  +  1Ãƒâ€” '+_shortName(heavyEnemy)+' (HEAVY)'):'');
      break;
    }
    case 'CASTER_COVEN':{
      theme='CASTER COVEN';
      const cCount=Math.max(3,5+Math.floor(stageNum/5)+roundBonus-(round<=2?2:0));
      _push(casterLike,cCount);
      _push(rangedLike,1);
      if(tank){_push(tank,1)}
      _push(dpsLike,1+Math.floor(roundBonus/2));
      preview=cCount+'Ãƒâ€” '+_shortName(casterLike)+'  +  1Ãƒâ€” '+_shortName(rangedLike)+(tank?('  +  1Ãƒâ€” '+_shortName(tank)):'')+'  +  1Ãƒâ€” '+_shortName(dpsLike);
      break;
    }
    case 'ELITE_PAIR':{
      theme='ELITE PAIR';
      _push(tankLike,2);
      const dCount=5+Math.floor(stageNum/5)+roundBonus;
      _push(dpsLike,dCount);
      preview='2Ãƒâ€” '+_shortName(tankLike)+'  +  '+dCount+'Ãƒâ€” '+_shortName(dpsLike);
      break;
    }
    case 'HEAVY_WALL':{
      // Heavy-favored: magic shines (140%), physical struggles (60%). BUT we
      // also seed 1 warded caster from S3+ so a pure-magic answer isn't free Ã¢â‚¬â€
      // player still needs physical/pierce for the warded ranged threat.
      theme='HEAVY WALL';
      const heavy=heavyEnemy||tankLike;
      const hCount=3+Math.floor(stageNum/8)+Math.floor(roundBonus/2);
      _push(heavy,hCount);
      _push(dpsLike,5+Math.floor(stageNum/5)+roundBonus);
      const _hwMixWard=stageNum>=3&&wardedEnemy;
      if(_hwMixWard)_push(wardedEnemy,1);
      preview=hCount+'Ãƒâ€” '+_shortName(heavy)+' (HEAVY)  +  '+(5+Math.floor(stageNum/5)+roundBonus)+'Ãƒâ€” '+_shortName(dpsLike)+(_hwMixWard?('  +  1Ãƒâ€” '+_shortName(wardedEnemy)+' (WARD)'):'');
      break;
    }
    case 'WARDED_COVEN':{
      // Warded-favored: physical/pierce shines, magic halved. Escort is now
      // explicitly the heavy enemy if available so player needs BOTH magic
      // (for heavy escort) AND physical (for warded casters). Forces dual comp.
      theme='WARDED COVEN';
      const warded=wardedEnemy||casterLike;
      const wCount=Math.max(3,5+Math.floor(stageNum/5)+roundBonus-(round<=2?2:0));
      _push(warded,wCount);
      // Prefer heavy escort so the wave demands magic AND physical. Falls back
      // to act tank if no heavy enemy in the act, then to dps.
      const escort=heavyEnemy||(tank&&tank.id!==warded.id?tank:dpsLike);
      _push(escort,2);
      const _esLabel=(escort===heavyEnemy)?(' (HEAVY)'):'';
      preview=wCount+'Ãƒâ€” '+_shortName(warded)+' (WARD)  +  2Ãƒâ€” '+_shortName(escort)+_esLabel;
      break;
    }
    case 'AERIAL_RAID':{
      // Flying-favored: ranged/magic units shine, melee physical can't engage.
      // Add 1 heavy ground anchor from S4+ so a pure-magic/pierce squad still
      // has to deal with armor on the ground.
      theme='AERIAL RAID';
      const fly=flyingEnemy||rangedLike;
      const fCount=Math.max(3,5+Math.floor(stageNum/5)+roundBonus-(round<=2?2:0));
      _push(fly,fCount);
      _push(dpsLike,4+Math.floor(stageNum/6)+Math.floor(roundBonus/2));
      const _arMixHeavy=stageNum>=4&&heavyEnemy;
      if(_arMixHeavy)_push(heavyEnemy,1);
      preview=fCount+'Ãƒâ€” '+_shortName(fly)+' (FLY)  +  '+(4+Math.floor(stageNum/6))+'Ãƒâ€” '+_shortName(dpsLike)+(_arMixHeavy?('  +  1Ãƒâ€” '+_shortName(heavyEnemy)+' (HEAVY)'):'');
      break;
    }
    case 'BURROW_AMBUSH':{
      // Burrow-favored: forces back-line defenders to handle surfacing burrowers.
      // Add 1 warded caster from S3+ so player can't just camp magic AoE in
      // the back-line and call it done Ã¢â‚¬â€ physical/pierce needed too.
      theme='BURROW AMBUSH';
      const bur=burrowEnemy||infiltratorLike;
      const bCount=3+Math.floor(stageNum/8)+Math.floor(roundBonus/2);
      _push(bur,bCount);
      _push(dpsLike,5+Math.floor(stageNum/5)+roundBonus);
      const _baMixWard=stageNum>=3&&wardedEnemy;
      if(_baMixWard)_push(wardedEnemy,1);
      preview=bCount+'Ãƒâ€” '+_shortName(bur)+' (BURROW)  +  '+(5+Math.floor(stageNum/5)+roundBonus)+'Ãƒâ€” '+_shortName(dpsLike)+(_baMixWard?('  +  1Ãƒâ€” '+_shortName(wardedEnemy)+' (WARD)'):'');
      break;
    }
  }
  // Enforce a compact count floor. Later stages get stronger enemies and more
  // mechanics, not huge waves that drag out the shorter stage loop.
  const _origLen=queue.length;
  const _stageFloor=stageNum<=5?9:stageNum<=10?10:stageNum<=15?11:stageNum<=20?12:13;
  const _roundStep=stageNum<=5?1.0:stageNum<=10?1.35:stageNum<=15?1.55:1.75;
  const _minCount=_stageFloor+Math.floor(Math.max(0,round-1)*_roundStep);
  while(queue.length<_minCount){
    const _padPool=[dpsLike,rangedLike,swarmLike,aoeLike];
    const _pick=_padPool[queue.length%_padPool.length];
    queue.push(_pick.id);
  }
  queue=arena_spreadCapWaveQueue(queue,arena_waveEnemyCap(stageNum,round));
  // Gold multiplier: maintain roughly same total gold despite more enemies
  const _goldMult=_origLen>0?Math.max(0.35,_origLen/queue.length):1;
  return{theme,queue,previewName:preview,goldMult:_goldMult};
}
export function arena_stageOpenerQueue(stage){
  if(!stage||(stage.n||0)>25)return null;
  const first=Array.isArray(stage.waves)&&stage.waves.length?stage.waves[0]:null;
  if(!first)return null;
  const anchor=ENEMIES[first[2]];
  if(!anchor)return null;
  const stageNum=stage.n||1;
  const actEnemies=ENEMIES.filter(e=>e.act===(stage.act||anchor.act));
  const pick=arch=>actEnemies.find(e=>e.arch===arch);
  const dps=pick('dps')||pick('swarm')||pick('ranged')||pick('caster')||anchor;
  const ranged=pick('ranged')||pick('caster')||dps||anchor;
  const caster=pick('caster')||ranged||anchor;
  const tank=pick('tank')||dps||anchor;
  const swarm=pick('swarm')||dps||anchor;
  const assassin=pick('assassin')||dps||anchor;
  const byId=id=>actEnemies.find(e=>e.id===id)||ENEMIES[id]||null;
  let queue=[];
  const push=(e,n)=>{if(!e)return;for(let i=0;i<n;i++)queue.push(e.id)};
  const baseCount=Math.max(1,first[1]||2);
  if(anchor.arch==='swarm'){
    push(anchor,Math.max(8,baseCount*4+Math.floor(stageNum/6)));
    if(dps.id!==anchor.id)push(dps,1);
  }else if(anchor.arch==='tank'){
    push(anchor,Math.min(3,baseCount));
    if(dps.id!==anchor.id)push(dps,5+Math.floor(stageNum/5));
    if(ranged.id!==anchor.id&&ranged.id!==dps.id)push(ranged,1);
  }else if(anchor.arch==='caster'){
    // Round 1 is a teaching wave. Caster openers are dangerous because they
    // stack ranged pressure/status effects before the player can counter-build.
    // Crow Cultist is especially punishing, so cap it hard and fill with softer
    // melee/swarm enemies instead of opening with 6-7 cultists.
    const isCrowCultist=anchor.id===4||anchor.name==='Crow Cultist';
    if(isCrowCultist){
      const locust=byId(30)||swarm;
      const bandit=byId(5)||assassin;
      const falcon=byId(7)||ranged;
      const camel=byId(6)||tank;
      const mortar=byId(21);
      const act2Openers={
        6:[[anchor,2],[locust,5],[bandit,2],[falcon,1]],
        7:[[anchor,2],[locust,4],[falcon,2],[bandit,1],[mortar,1]],
        10:[[anchor,2],[locust,3],[falcon,2],[bandit,2],[camel,1]],
      };
      const preset=act2Openers[stageNum];
      if(preset){
        for(const [enemy,count] of preset)push(enemy,count);
      }else{
        push(anchor,2);
        if(swarm.id!==anchor.id)push(swarm,6);
        if(assassin.id!==anchor.id&&assassin.id!==swarm.id)push(assassin,1);
      }
    }else{
      push(anchor,Math.min(4,Math.max(2,baseCount+Math.floor(stageNum/12))));
      if(dps.id!==anchor.id)push(dps,4+Math.floor(stageNum/10));
      if(swarm.id!==anchor.id&&swarm.id!==dps.id)push(swarm,2+Math.floor(stageNum/15));
      if(stageNum>=16&&tank.id!==anchor.id&&tank.id!==dps.id&&tank.id!==swarm.id)push(tank,1);
    }
  }else if(anchor.arch==='ranged'){
    push(anchor,Math.max(5,baseCount*3+Math.floor(stageNum/7)));
    if(dps.id!==anchor.id)push(dps,3+Math.floor(stageNum/8));
    if(tank.id!==anchor.id&&tank.id!==dps.id)push(tank,1);
  }else if(anchor.arch==='assassin'){
    push(anchor,Math.min(3,baseCount));
    if(dps.id!==anchor.id)push(dps,5+Math.floor(stageNum/5));
    if(tank.id!==anchor.id&&tank.id!==dps.id)push(tank,1);
  }else if(anchor.arch==='aoe'){
    push(anchor,Math.max(4,baseCount*2));
    if(dps.id!==anchor.id)push(dps,4+Math.floor(stageNum/6));
    if(tank.id!==anchor.id&&tank.id!==dps.id)push(tank,1);
  }else{
    push(anchor,Math.max(6,baseCount*3));
    if(dps.id!==anchor.id)push(dps,3);
  }
  const padPool=[dps,ranged,swarm,caster,tank,anchor].filter((e,i,a)=>e&&a.findIndex(x=>x.id===e.id)===i);
  for(let i=0;queue.length<10&&padPool.length;i++)queue.push(padPool[i%padPool.length].id);
  queue=arena_spreadCapWaveQueue(queue,arena_waveEnemyCap(stageNum,1));
  const counts={};
  for(const id of queue)counts[id]=(counts[id]||0)+1;
  const order=[anchor.id,...Object.keys(counts).map(Number).filter(id=>id!==anchor.id)];
  const short=e=>e.name.split(' ').pop();
  const parts=order.slice(0,3).map(id=>counts[id]+'x '+short(ENEMIES[id]));
  if(order.length>3)parts.push('+'+(order.length-3)+' types');
  return{theme:'STAGE OPENER',queue,previewName:parts.join('  +  '),goldMult:1};
}

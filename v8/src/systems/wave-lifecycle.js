import { BOSSES } from '../data/bosses.js?v=20260522-round-bonus';
import { ENEMIES } from '../data/enemies.js';
import { arena_pickWaveMechanic, arena_themedWaveQueue } from './wave-planner.js';

export function prepareWaveStartState(arena, units){
  arena.phase='wave';
  arena.pickerOpen=false;
  arena.pickerCell=null;
  arena.managePanelCell=null;
  arena._mgrSelectedSpec=null;
  arena.waveElapsed=0;
  arena._waveStartKingHp=arena.king?arena.king.hp:0;
  arena.riftFiredThisRound=false;
  arena.rift=null;
  arena.waveMechanic=null;
  arena.waveMechanicAssigned=false;
  arena.waveMechanicAssignedCount=0;
  for(const u of units){
    if(u.paladinHybrid&&u.hp>0)u.mountTimer=0;
    if(u.chargeRepeatCD){
      u.chargePending=true;
      u.chargeFirstUsed=false;
      u._chargeRepeatT=0;
    }
    if(u.bullCharge){
      u._bullCharged=false;
      u._bullChargeCheck=false;
      u._bullCharging=0;
    }
    if(u.deathGrip){
      u._dgCharged=false;
      u._dgCharging=0;
      u._deathGripT=0;
    }
    if(u.maulLeap)u._maulLeapT=660;
    if(u.hallowedLeap){
      u._hallowedLeapT=Math.max(0,u.hallowedLeap.cd-u.hallowedLeap.first);
      u._hallowedLeapAnim=null;
      u.hallowedLeapShieldTimer=0;
    }
    if(u.cheatDeath)u._cheatDeathUsed=false;
  }
}

export function capMiniBossEscortWave(queue,maxCount){
  if(!queue||queue.length<=maxCount)return queue;
  const src=[...queue],out=[];
  for(let i=0;i<maxCount;i++){
    out.push(src[Math.floor(i*src.length/maxCount)]);
  }
  return out;
}

export function buildWaveSpawnPlan(arena,stage,totalRounds){
  const s=stage||{};
  const round=arena.round||1;
  const stageN=s.n||1;
  const isBoss=round>=totalRounds;
  const plan={
    queue:[],
    waveMechanic:arena_pickWaveMechanic(stageN,round,isBoss),
    flash:null,
  };
  if(isBoss){
    if(s.bossId!=null){
      plan.queue.push('BOSS');
      plan.flash={text:'BOSS WAVE - '+(BOSSES[s.bossId]?.name||'').toUpperCase(),color:'#ff4444',duration:120};
    }else if(s.eliteEnemyId!=null){
      const wave=arena_themedWaveQueue(round,stageN,s.act||1);
      if(wave&&wave.queue&&wave.queue.length)plan.queue.push(...wave.queue);
      plan.queue.push({elite:s.eliteEnemyId});
      plan.flash={text:'FINAL WAVE - '+(ENEMIES[s.eliteEnemyId]?.name||'').toUpperCase(),color:'#ff8c00',duration:120};
    }else{
      const idx=arena._nextWaveEnemyIdx??0;
      const count=(arena._nextWaveCount??5)*2;
      for(let i=0;i<count;i++)plan.queue.push(idx);
      plan.flash={text:'FINAL WAVE',color:'#ff4444',duration:90};
    }
  }else if(arena._nextWaveQueue&&arena._nextWaveQueue.length){
    plan.queue=[...arena._nextWaveQueue];
    const theme=arena._nextWaveTheme||'WAVE';
    plan.flash={text:theme+' - WAVE '+round+'/'+totalRounds,color:'#ff8c00',duration:90};
  }else{
    const idx=arena._nextWaveEnemyIdx??0;
    const count=arena._nextWaveCount??5;
    for(let i=0;i<count;i++)plan.queue.push(idx);
    plan.flash={text:'WAVE '+round+' / '+totalRounds,color:'#ff8c00',duration:90};
  }

  if(stageN===10&&round===4){
    plan.queue=[{boss:13,label:'MINI BOSS - STORMBOUND VIZIER',color:'#3f8cff'}];
    plan.waveMechanic=null;
    plan.flash={text:'MINI BOSS - STORMBOUND VIZIER',color:'#3f8cff',duration:120};
  }
  return plan;
}

export function applyWaveSpawnPlan(arena,plan){
  arena.waveSpawnQueue=plan.queue||[];
  arena.waveMechanic=plan.waveMechanic||null;
  arena.waveMechanicAssigned=false;
  arena.waveMechanicAssignedCount=0;
}

export function configureWaveSpawning(arena,stage){
  const stageNum=stage&&stage.n?stage.n:1;
  const earlyRound=(arena.round||1)<=2;
  if(stageNum===10&&(arena.round||1)===4){
    arena.waveSpawnAllAtOnce=false;
    arena.waveSpawnBatchMode=false;
    arena.waveSpawnBatchIndex=0;
    arena.waveSpawnTimer=20;
    return;
  }
  arena.waveSpawnAllAtOnce=stageNum>=6&&!earlyRound;
  arena.waveSpawnBatchMode=!arena.waveSpawnAllAtOnce&&stageNum>=6&&arena.waveSpawnQueue.length>6;
  arena.waveSpawnBatchIndex=0;
  arena.waveSpawnTimer=(arena.waveSpawnBatchMode||arena.waveSpawnAllAtOnce)?20:180;
}

export function spawnNextEnemyBatch(arena,spawnQueuedEnemy){
  const pattern=[6,4,4];
  const idx=arena.waveSpawnBatchIndex||0;
  const size=Math.min(pattern[Math.min(idx,pattern.length-1)],arena.waveSpawnQueue.length);
  for(let i=0;i<size;i++)spawnQueuedEnemy(arena.waveSpawnQueue.shift());
  arena.waveSpawnBatchIndex=idx+1;
  arena.waveSpawnTimer=arena.waveSpawnQueue.length?150:0;
}

export function calculateWaveRewards(view){
  const {
    arena,
    gold,
    stageN,
    stageIncome,
    roundGoldMult,
    roundBonusCap,
  }=view;
  const mult=roundGoldMult(arena.round||1,stageN);
  const income=Math.max(1,Math.round(stageIncome(stageN)*mult));
  const roundBonus=Math.min(roundBonusCap,Math.round(income*0.35));
  const perfectWave=arena.king&&arena.king.hp>=arena._waveStartKingHp;
  const perfectBonus=perfectWave?Math.round(income*0.15):0;
  return {
    income,
    roundBonus,
    perfectWave,
    perfectBonus,
    gold:gold+income+roundBonus+perfectBonus,
  };
}

export function nextBuildDuration(round,totalRounds,buildNext,buildBoss){
  return round===totalRounds?buildBoss:buildNext;
}

export function startBuildPhase({
  arena,
  seconds,
  tickHz,
  enemies,
  setBossRef,
  setBossSpawned,
  respawnSquad,
}) {
  arena.phase = 'build';
  arena.buildTimer = seconds * tickHz;
  arena.buildTimerMax = arena.buildTimer;
  enemies.length = 0;
  setBossRef(null);
  setBossSpawned(false);
  if (arena.king && arena.king.hp > 0 && arena.king.hp < arena.king.maxHp) {
    const regen = Math.round(arena.king.maxHp * 0.03);
    arena.king.hp = Math.min(arena.king.maxHp, arena.king.hp + regen);
  }
  respawnSquad();
}

export function startWavePhase({
  arena,
  units,
  stage,
  totalRounds,
  startRoundStats,
  spawnSquadMinions,
  configureWaveSpawning,
  showFlash,
  playWaveStart,
}) {
  startRoundStats();
  prepareWaveStartState(arena, units);
  spawnSquadMinions(true);

  const plan = buildWaveSpawnPlan(arena, stage, totalRounds);
  applyWaveSpawnPlan(arena, plan);
  if (plan.flash) showFlash(plan.flash.text, plan.flash.color, plan.flash.duration);
  configureWaveSpawning();
  playWaveStart();
  return plan;
}

export function completeWavePhase({
  arena,
  won,
  gold,
  stageN,
  totalRounds,
  stageIncome,
  roundGoldMult,
  roundBonusCap,
  buildNext,
  buildBoss,
  finishRoundStats,
  setGold,
  showFlash,
  endStage,
  buildWavePreview,
  startBuild,
}) {
  finishRoundStats(won ? 'clear' : 'lost');
  if (!won) {
    endStage(false);
    return { endedStage: true, reward: null };
  }

  const reward = calculateWaveRewards({
    arena,
    gold,
    stageN,
    stageIncome,
    roundGoldMult,
    roundBonusCap,
  });
  setGold(reward.gold);
  if (reward.perfectWave) showFlash('PERFECT WAVE!  +' + reward.perfectBonus + 'g bonus', '#44ff88', 100);
  showFlash('+' + reward.income + 'g income  +' + reward.roundBonus + 'g round bonus', '#ffd700', 80);
  if (arena.round >= totalRounds) {
    endStage(true);
    return { endedStage: true, reward };
  }

  arena.round++;
  buildWavePreview();
  startBuild(nextBuildDuration(arena.round, totalRounds, buildNext, buildBoss));
  return { endedStage: false, reward };
}

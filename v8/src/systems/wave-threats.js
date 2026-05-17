import { BOSSES } from '../data/bosses.js';
import { ENEMIES } from '../data/enemies.js';

function defaultEnemyAttackType(e){
  if(e.projType==='curse'||e.projType==='frost'||e.projType==='fire'||e.projType==='lightning')return 'magic';
  if(e.projType==='normal'||e.arch==='ranged')return 'pierce';
  return 'physical';
}

export function buildWaveThreats(view){
  const {
    round,
    total,
    isBoss,
    stage,
    queue,
    theme,
    miniBossId,
    enemyAttackType=defaultEnemyAttackType
  }=view;
  const out={
    round,
    total,
    isBoss:!!isBoss,
    isBarrier:false,
    isAerial:false,
    bossName:null,
    bossColor:null,
    theme:'',
    enemies:[],
  };
  const s=stage||{};
  if(isBoss){
    if(s.bossId!=null){
      const boss=BOSSES[s.bossId];
      out.bossName=boss?.name||'?';
      out.bossColor=boss?.color||'#ff4444';
      out.isBarrier=!!boss?.hasBarrier;
      out.isAerial=!!boss?.isAerial;
    }else if(s.eliteEnemyId!=null){
      const enemy=ENEMIES[s.eliteEnemyId];
      out.bossName=(enemy?.name||'?')+' (ELITE)';
      out.bossColor=enemy?.color||'#ff8c00';
    }
    return out;
  }

  const counts={};
  for(const id of queue||[]){
    if(typeof id==='number')counts[id]=(counts[id]||0)+1;
  }
  out.theme=(theme||'').toUpperCase();
  for(const k of Object.keys(counts)){
    const enemy=ENEMIES[+k];
    if(!enemy)continue;
    out.enemies.push({
      id:+k,
      name:enemy.name,
      count:counts[k],
      arch:(enemy.arch||'').toUpperCase(),
      attack:enemyAttackType(enemy).toUpperCase(),
      armor:enemy.armorType?enemy.armorType.toUpperCase():null,
      flying:!!enemy.flying,
      burrow:!!enemy.burrow,
      backline:!!enemy.prefersBackline,
      stealth:!!enemy.stealth,
      color:enemy.color||'#aaaaaa',
    });
  }
  if(miniBossId!=null){
    const boss=BOSSES[miniBossId];
    if(boss)out.enemies.unshift({
      id:'boss'+boss.id,
      name:boss.name,
      count:1,
      arch:'BOSS',
      attack:'MAGIC',
      armor:(boss.armorType||'boss').toUpperCase(),
      flying:!!boss.flying,
      burrow:false,
      backline:!!boss.prefersBackline,
      stealth:false,
      color:boss.color||'#ff4444',
    });
  }
  out.enemies.sort((a,b)=>{
    const ab=String(a.id).startsWith('boss');
    const bb=String(b.id).startsWith('boss');
    if(ab!==bb)return ab?-1:1;
    return (b.count-a.count)||(a.name.length-b.name.length);
  });
  return out;
}

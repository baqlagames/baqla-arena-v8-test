import { BOSSES } from '../data/bosses.js?v=20260522-winterglass-magistrate';
import { ENEMIES } from '../data/enemies.js';

function defaultEnemyAttackType(e){
  if(e.projType==='curse'||e.projType==='frost'||e.projType==='fire'||e.projType==='lightning')return 'magic';
  if(e.projType==='normal'||e.arch==='ranged')return 'pierce';
  return 'physical';
}

function pushThreatTag(tags,key,hint){
  if(tags.some(tag=>tag.key===key))return;
  tags.push({key,label:key,hint:hint||''});
}

function enemyHasBurst(enemy){
  if(!enemy)return false;
  if(enemy.arch==='assassin'||enemy.stealth||enemy.prefersBackline)return true;
  if(enemy.meteorCD||enemy.splashOnHit||enemy.chainBoltCD)return true;
  const dmg=enemy.dmg||0, hp=enemy.hp||enemy.maxHp||1;
  return dmg>=70&&dmg/Math.max(1,hp)>0.16;
}

function enemyHasPoison(enemy){
  return !!(enemy&&(enemy.poisonOnHit||enemy.poisonDmg||enemy.debuffType==='poison'));
}

function enemyHasArmor(enemy){
  return !!(enemy&&(enemy.armorType==='heavy'||enemy.armorType==='warded'||(enemy.armor||0)>=5||(enemy.magicRes||0)>=6));
}

function deriveEnemyTags(enemies){
  const tags=[];
  for(const enemy of enemies||[]){
    if(!enemy)continue;
    if(enemy.projType==='frost'||enemy.projType==='ice'||enemy.slowOnHit)pushThreatTag(tags,'FROST','Chill magic');
    if(enemy.flying)pushThreatTag(tags,'FLYERS','Air targets');
    if(enemyHasArmor(enemy))pushThreatTag(tags,'ARMOR','Heavy or warded');
    if(enemyHasBurst(enemy))pushThreatTag(tags,'BURST','Spike damage');
    if(enemyHasPoison(enemy))pushThreatTag(tags,'POISON','Damage over time');
    if(enemy.arch==='caster'||enemy.chainBoltCD)pushThreatTag(tags,'CASTER','Magic pressure');
    if(enemy.prefersBackline)pushThreatTag(tags,'BACKLINE THREAT','Hunters bypass tanks');
  }
  return tags.slice(0,6);
}

function bossHasArmor(boss){
  return !!(boss&&(boss.armorType==='heavy'||boss.armorType==='warded'||(boss.armor||0)>=5||(boss.magicRes||0)>=6));
}

function bossHasBurst(boss){
  return !!(boss&&(boss.vanishCD||boss.meteorCD||boss.lungeCD||boss.burrowCD||boss.stompCD||boss.diveCD||boss.starfallCD||boss.eclipseBeamCD||boss.gravityTollCD||boss.chainDecreeCD||boss.courtRebukeDmg||boss.debuffType==='deathMark'));
}

function bossHasCasterPressure(boss){
  return !!(boss&&(boss.magicBoltCD||boss.aoeCD||boss.stormCD||boss.cawCD||boss.starfallCD||boss.eclipseBeamCD||boss.twinWardsCD||boss.stormMotesCD||boss.chainDecreeCD||boss.projType==='curse'||boss.projType==='fire'||boss.projType==='frost'||boss.projType==='lightning'));
}

function deriveBossTags(boss){
  const tags=[];
  if(!boss)return tags;
  if(boss.frostBoss||boss.projType==='frost'||boss.projType==='ice'||boss.blizzardCD)pushThreatTag(tags,'FROST','Frost pressure');
  if(boss.isAerial||boss.flying)pushThreatTag(tags,'FLYERS','Air phase');
  if(bossHasArmor(boss))pushThreatTag(tags,'ARMOR','Durable boss');
  if(bossHasBurst(boss))pushThreatTag(tags,'BURST','Spike mechanic');
  if(boss.poisonOnHit||boss.poisonDmg||boss.debuffType==='poison'||boss.royalStingPoisonDmg)pushThreatTag(tags,'POISON','Damage over time');
  if(bossHasCasterPressure(boss))pushThreatTag(tags,'CASTER','Spell pressure');
  if(boss.stormMotesCD||boss.stormMoteCount)pushThreatTag(tags,'FLYERS','Priority air adds');
  if(boss.royalCarapaceAt||boss.hasBarrier||boss.iceBlockCD||boss.lanternWardAt||boss.twinWardsCD||boss.stormWardHp)pushThreatTag(tags,'BOSS SHIELD','Break or reveal');
  if(boss.prefersBackline||boss.magicBoltBackline||boss.diveCD||boss.skyStrafeCD||boss.starfallCD||boss.lanternOrbitCD||boss.stormMotesCD||boss.chainDecreeCD)pushThreatTag(tags,'BACKLINE THREAT','Back row pressure');
  return tags.slice(0,6);
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
    tags:[],
  };
  const s=stage||{};
  if(isBoss){
    if(s.bossId!=null){
      const boss=BOSSES[s.bossId];
      out.bossName=boss?.name||'?';
      out.bossColor=boss?.color||'#ff4444';
      out.isBarrier=!!boss?.hasBarrier;
      out.isAerial=!!boss?.isAerial;
      out.tags=deriveBossTags(boss);
    }else if(s.eliteEnemyId!=null){
      const enemy=ENEMIES[s.eliteEnemyId];
      out.bossName=(enemy?.name||'?')+' (ELITE)';
      out.bossColor=enemy?.color||'#ff8c00';
      out.tags=deriveEnemyTags([enemy]);
    }
    return out;
  }

  const counts={};
  const sourceEnemies=[];
  for(const id of queue||[]){
    if(typeof id==='number')counts[id]=(counts[id]||0)+1;
  }
  out.theme=(theme||'').toUpperCase();
  for(const k of Object.keys(counts)){
    const enemy=ENEMIES[+k];
    if(!enemy)continue;
    sourceEnemies.push(enemy);
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
    if(boss)out.tags.push(...deriveBossTags(boss));
  }
  out.enemies.sort((a,b)=>{
    const ab=String(a.id).startsWith('boss');
    const bb=String(b.id).startsWith('boss');
    if(ab!==bb)return ab?-1:1;
    return (b.count-a.count)||(a.name.length-b.name.length);
  });
  const enemyTags=deriveEnemyTags(sourceEnemies);
  for(const tag of enemyTags)pushThreatTag(out.tags,tag.key,tag.hint);
  out.tags=out.tags.slice(0,6);
  return out;
}

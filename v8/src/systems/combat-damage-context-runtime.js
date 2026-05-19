export function createCombatDamageContextRuntime(deps) {
  function combatDamageContext(){
    const {state,arena,units,enemies,projectiles,currentStage,frame,groundFx}=deps.view();
    const ARENA_RIFT_BONUS_GOLD=deps.riftBonusGold();
    const addP=deps.emitParticle;
    const addDmg=deps.addDamageText;
    const addHealFx=deps.addHealEffect;
    const rnd=deps.randomRange;
    const SFX=deps.sound;
    const {
      showFlash,arena_spawnPlayerImpactVfx,arena_statsRecordDamage,arena_applyHealingReceived,
      arena_statsRecordPrevented,arena_addGoldShield,arena_spawnGhost,arena_applyFelfelDeadlyPoison,arena_spawnGhoul,
      setVodkaDead,setVodkaRespawn,setVodkaUnit,addGold,addStageGold
    }=deps;

  return {
    state,
    arena,
    units,
    enemies,
    projectiles,
    currentStage,
    frame,
    riftBonusGold:ARENA_RIFT_BONUS_GOLD,
    emitParticle:addP,
    addDamageText:addDmg,
    addHealEffect:addHealFx,
    showFlash,
    randomRange:rnd,
    randomFloat:Math.random,
    groundEffects:groundFx,
    spawnImpactVfx:arena_spawnPlayerImpactVfx,
    recordDamage:arena_statsRecordDamage,
    recordPrevented:arena_statsRecordPrevented,
    applyHealingReceived:arena_applyHealingReceived,
    addGoldShield:arena_addGoldShield,
    spawnGhost:arena_spawnGhost,
    applyDeadlyPoison:arena_applyFelfelDeadlyPoison,
    spawnGhoul:arena_spawnGhoul,
    shake:value=>{deps.shake(value);},
    playCheatDeathSfx:()=>SFX.cheatDeath(),
    setHeroKoState:deathResult=>{
      setVodkaDead(deathResult.vodkaDead);
      setVodkaRespawn(deathResult.vodkaRespawn);
      setVodkaUnit(deathResult.vodkaUnit);
    },
    addKillReward:rewardEvent=>{
      addGold(rewardEvent.reward);addStageGold(rewardEvent.reward);
    }
  };

  }
  function dealDamage(target,raw,attacker,dmgType,attackTypeOverride,opts){
    return deps.dealDamageRuntime(combatDamageContext(),target,raw,attacker,dmgType,attackTypeOverride,opts);
  }
  function onDeath(t,killer){
    return deps.handleCombatDeath(combatDamageContext(),t,killer);
  }
  return {combatDamageContext,dealDamage,onDeath};
}

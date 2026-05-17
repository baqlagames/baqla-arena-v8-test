export function createCombatEnemyRuntime(deps) {
  function updateEnemy(e){
    const {frame,width:W,height:H,arenaLeft:ARENA_L,arenaRight:ARENA_R,arenaTop:ARENA_TOP,arenaBottom:ARENA_BOT,state,arena,units,enemies,towers,playerCastle,groundFx,beamFx}=deps.view();
    const SFX=deps.sound;
    const rnd=deps.randomRange;
    const addP=deps.emitParticle;
    const addDmg=deps.addDamageText;
    const {
      updateArenaEnemyAi,moveToward,arena_updateEnemyMechanics,arena_enemyAttackCd,
      arena_applySearingBrandOnBasic,arena_applyRoyalStingOnBasic,dealDamage,fireProjectile,showFlash
    }=deps;

  updateArenaEnemyAi(e,{
    frame,
    width:W,
    height:H,
    arenaLeft:ARENA_L,
    arenaRight:ARENA_R,
    arenaTop:ARENA_TOP,
    arenaBottom:ARENA_BOT,
    arenaPhase:state==='battle'&&arena&&arena.phase,
    units,
    enemies,
    towers,
    playerCastle,
    groundEffects:groundFx,
    beamFx,
    randomRange:rnd,
    moveToward,
    updateEnemyMechanics:arena_updateEnemyMechanics,
    enemyAttackCooldown:arena_enemyAttackCd,
    applySearingBrandOnBasic:arena_applySearingBrandOnBasic,
    applyRoyalStingOnBasic:arena_applyRoyalStingOnBasic,
    dealDamage,
    fireProjectile,
    emitParticle:addP,
    addDamageText:addDmg,
    showFlash,
    shake:value=>{deps.shake(value);},
    sound:SFX
  });

  }
  return {updateEnemy};
}

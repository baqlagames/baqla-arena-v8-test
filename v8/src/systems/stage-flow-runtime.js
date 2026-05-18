import { clampActorToSpawnArea, spawnAreaFromView } from './arena-spawn-bounds.js';

export function createStageFlowRuntime(ctx) {
  function spawnEnemyByIdx(typeIdx) {
    const v = ctx.view();
    return ctx.spawnEnemyByIndex({
      typeIdx,
      state: v.state,
      arenaState: v.arena,
      stageTime: v.stageTime,
      currentStageIdx: v.currentStageIdx,
      currentStage: v.currentStage,
      waveIdx: v.waveIdx,
      frame: v.frame,
      arenaTop: v.arenaTop,
      arenaBottom: v.arenaBottom,
      spawnY: v.spawnY,
      spawnLeft: v.spawnLeft,
      spawnRight: v.spawnRight,
      enemies: v.enemies,
      randomFloat: Math.random,
      randomRange: ctx.randomRange,
      isCampaignBossRound: ctx.isCampaignBossRound,
      applyWaveMechanic: ctx.applyWaveMechanic,
      lateRoundEnemyMult: ctx.lateRoundEnemyMult,
      lateStageRoleHpMult: ctx.lateStageRoleHpMult,
      lateStageNormalDurabilityMult: ctx.lateStageNormalDurabilityMult,
      lateStageNormalDamageMult: ctx.lateStageNormalDamageMult
    });
  }

  function spawnBossById(bossId, opts) {
    const v = ctx.view();
    const b = ctx.spawnBossByIdFromData({
      bossId,
      opts: opts || {},
      state: v.state,
      arenaState: v.arena,
      frame: v.frame,
      width: v.width,
      arenaTop: v.arenaTop,
      arenaBottom: v.arenaBottom,
      spawnY: v.spawnY,
      spawnLeft: v.spawnLeft,
      spawnRight: v.spawnRight,
      enemies: v.enemies,
      randomFloat: Math.random,
      clampValue: ctx.clampValue,
      showFlash: ctx.showFlash,
      emitParticle: ctx.emitParticle,
      shake: ctx.shake
    });
    if (b) {
      ctx.setBossRef(b);
      ctx.setBossSpawned(true);
    }
    return b;
  }

  function spawnBossForStage() {
    const s = ctx.view().currentStage;
    if (!s || s.bossId == null) return;
    return spawnBossById(s.bossId);
  }

  function spawnEliteEnemy(idx) {
    const v = ctx.view();
    const tmpl = ctx.enemyTemplates[idx];
    if (!tmpl) return;
    const stageHpM = (ctx.stageHpMult[v.currentStageIdx] || 1) * ctx.enemyHpMultiplier;
    const stageDmgM = ctx.stageDmgMult[v.currentStageIdx] || 1;
    const inArena = v.state === 'battle' && v.arena && v.arena.phase;
    const sizeScale = inArena ? ctx.arenaUnitSizeScale : ctx.unitVisualScale;
    const isRangedChampion = tmpl.arch === 'ranged' || tmpl.arch === 'caster' || (tmpl.range || 0) > 90;
    const isTankChampion = tmpl.arch === 'tank' || tmpl.taunt || tmpl.armorType === 'heavy';
    const championHpMult = isTankChampion ? 3.15 : 3.35;
    const championDmgMult = isRangedChampion ? 1.85 : 1.78;
    const e = {
      ...tmpl,
      name: 'Champion ' + tmpl.name,
      x: v.width / 2,
      y: Number.isFinite(v.spawnY) ? v.spawnY + 28 : v.arenaTop + 30,
      maxHp: Math.round(tmpl.hp * stageHpM * championHpMult),
      hp: Math.round(tmpl.hp * stageHpM * championHpMult),
      dmg: Math.round(tmpl.dmg * stageDmgM * championDmgMult),
      size: Math.round((tmpl.size || 22) * 1.4 * sizeScale),
      armor: (tmpl.armor || 0) + 2,
      magicRes: (tmpl.magicRes || 0) + 1,
      range: Math.max(tmpl.range || 40, 180),
      projType: tmpl.projType || 'fire',
      splashOnHit: true,
      splashRadius: isRangedChampion ? 72 : 58,
      aoeRadius: isRangedChampion ? 62 : 0,
      aoeMult: isRangedChampion ? 0.32 : 0,
      meteorCD: isRangedChampion ? 6 * ctx.tickHz : 0,
      meteorDmgMult: isRangedChampion ? 0.48 : 0,
      meteorRadius: isRangedChampion ? 64 : 0,
      chainBoltCD: tmpl.arch === 'caster' ? 7 * ctx.tickHz : tmpl.chainBoltCD,
      chainBoltDmgMult: tmpl.arch === 'caster' ? 0.45 : tmpl.chainBoltDmgMult,
      spawnFrame: v.frame,
      isEnemy: true,
      isElite: true,
      eliteChargeT: 7 * ctx.tickHz,
      cd: 0,
      facing: -1,
      bobPhase: 0,
      debuffs: {},
      points: Math.round((tmpl.points || 25) * 5)
    };
    clampActorToSpawnArea(e, {
      ...spawnAreaFromView({
        arenaTop: v.arenaTop,
        arenaBottom: v.arenaBottom,
        spawnLeft: v.spawnLeft,
        spawnRight: v.spawnRight,
        fallbackWidth: v.width
      }),
      topMargin: 50,
      bottomMargin: 58
    });
    v.enemies.push(e);
    ctx.showFlash('CHAMPION INCOMING!', '#ff8c00', 100);
    ctx.shake(12);
    for (let i = 0; i < 40; i++) ctx.emitParticle(e.x, e.y, '#ff8c00', 1, 5);
  }

  function updateWaves() {
    const v = ctx.view();
    const arena = v.arena;
    if (v.stageOver) return;
    if (v.playerCastle && v.playerCastle.hp <= 0) {
      endStage(false);
      return;
    }
    if (arena.phase === 'build') {
      if (arena.buildTimer > 0 && !arena.pauseMenu) arena.buildTimer--;
      if (arena.buildTimer <= 0) ctx.startWave();
      return;
    }
    if (arena.phase !== 'wave') return;

    arena.waveElapsed++;
    ctx.tickBossAerialBombs(ctx.bossMechanicsContext());
    ctx.tickTimedFieldEffects(ctx.timedFieldEffectsContext());
    if (arena.waveSpawnQueue.length) {
      arena.waveSpawnTimer--;
      if (arena.waveSpawnTimer <= 0) {
        if (arena.waveSpawnAllAtOnce) {
          while (arena.waveSpawnQueue.length) ctx.spawnQueuedEnemy(arena.waveSpawnQueue.shift());
          arena.waveSpawnTimer = 0;
        } else if (arena.waveSpawnBatchMode) {
          ctx.spawnNextEnemyBatch();
        } else {
          const next = arena.waveSpawnQueue.shift();
          if (typeof next === 'object' && next.delay != null) {
            arena.waveSpawnTimer = Math.max(1, next.delay);
          } else {
            ctx.spawnQueuedEnemy(next);
            arena.waveSpawnTimer = 48;
          }
        }
      }
    }
    ctx.tryTriggerRift();
    if (arena.rift) {
      arena.rift.telegraphTimer--;
      if (arena.rift.telegraphTimer <= 0) ctx.spawnRiftMinions();
    }
    const noEnemiesLeft = v.enemies.filter(e => e.hp > 0 && !e.isBarrier).length === 0;
    if (!arena.waveSpawnQueue.length && noEnemiesLeft && !arena.rift) ctx.endWave(true);
  }

  function endStage(won) {
    const v = ctx.view();
    const arena = v.arena;
    ctx.finishRoundStats(won ? 'stage-clear' : 'stage-lost');
    ctx.setStageOver(true);
    ctx.setStageWon(won);
    ctx.completeCombatStats(won);
    ctx.setScreen(won ? 'win' : 'lose');
    if (arena) {
      arena.resultView = won ? 'report' : null;
      arena.resultStartFrame = v.frame;
      arena.starRevealStart = 0;
      arena.starBurstDone = {};
    }
    if (won) {
      const result = ctx.computeStageStars(true);
      arena.lastStars = result;
      const sn = v.currentStage.n || 1;
      ctx.setStageStar(sn, Math.max(ctx.stageStar(sn) || 0, result.stars || 1));
      const firstClear = v.currentStage.n >= v.maxStage;
      const beanReward = ctx.stageBeansReward({
        stage: v.currentStage,
        stars: result.stars || 1,
        firstClear,
        selectedPerks: v.selectedPerks
      });
      arena.beansRewardBase = beanReward;
      arena.beansRewardDoubled = false;
      ctx.addBeans(beanReward);
      if (firstClear) ctx.setMaxStage(Math.min(25, v.currentStage.n + 1));
      ctx.save();
    }
    ctx.showFlash(won ? 'VICTORY' : 'DEFEAT', won ? '#ffd700' : '#aa3333', 140);
    if (won) ctx.sound.victory();
    else ctx.sound.defeat();
  }

  return {
    spawnEnemyByIdx,
    spawnBossById,
    spawnBossForStage,
    spawnEliteEnemy,
    updateWaves,
    endStage
  };
}

import { GAME_TICK_HZ } from '../core/constants.js';
import { ARENA_CAMPAIGN_KILL_BOUNTY_MULT, RESPAWN_FRAMES } from '../data/tuning.js';
import { absorbEnemyShield, absorbEarthwardenShield, absorbGoldShield, absorbHiveShield, absorbObjectShield, absorbShieldHp, absorbShieldOfVengeance, absorbTimedNumericShield, stopInvalidDamageTarget } from './combat-absorbs.js';
import { createEnemyKillRewardEvent, resolveDeathPresentation, startSummonerCooldownForDeadMinion } from './combat-death.js';
import { applyArenaDeathReactionHooks, applyDeathBoom, tryAngelOfMercySave, tryArdentDefenderSave, tryArenaDeathBranchHooks, tryCheatDeathSave, tryGhostOnDeath } from './combat-death-hooks.js';
import { applyPlayerSpecialDefenses, applyPreShieldPlayerReactions, applySoulLinkRedirect, triggerGalacticGuardian, triggerPrayerOfMending, tryGuardianSpiritSave } from './combat-defense-reactions.js';
import { applyIronSkinReduction, applyPlayerProtectionReductions, stopPlayerDefenseGates } from './combat-defense-procs.js';
import { applyAttackerOpeningDamageModifiers, applyBossAndRecordModifiers, applyDamageHit, applyJudgmentOfLightHit, applyLegacyPostDamageHooks, applyLegacyPreDamageHooks, showDamageHitFeedback } from './combat-hit-resolution.js?v=8cc7d77-combat-readability';
import { applyArenaIncomingScalarModifiers, applyPostDefenseDamageModifiers } from './combat-modifiers.js';
import { WARMUP_GOLD_BONUS } from './enemy-spawn.js';
import { arena_campaignKillBountyStageMult, arena_lateStageNormalGoldMult, arena_roundGoldMult } from './stage-economy.js';

function recordPrevented(ctx, target, attacker, before, after, kind) {
  const prevented = Math.max(0, Math.round((before || 0) - (after || 0)));
  if (prevented <= 0 || typeof ctx.recordPrevented !== 'function') return;
  ctx.recordPrevented(target, attacker, prevented, { kind });
  if (target && target.isPlayer) {
    target._tankBlockFx = Math.max(target._tankBlockFx || 0, target.arch === 'tank' || target.taunt ? 18 : 12);
  }
}

function applyEarlyOneShotCap(ctx, target, attacker, dmg) {
  if (!target || !target.isPlayer || !Number.isFinite(dmg) || dmg <= 0) return dmg;
  const stageN = (ctx.currentStage && ctx.currentStage.n) || 1;
  if (stageN >= 10 || target.isKing || target.isMinion || target.isMirror || target.isGhost) return dmg;
  const maxHp = Math.max(1, target.maxHp || target.hp || 1);
  const bossHit = !!(attacker && attacker.isBoss);
  const capPct = stageN <= 4 ? (bossHit ? 0.38 : 0.28) : (bossHit ? 0.45 : 0.34);
  const cap = Math.max(8, Math.round(maxHp * capPct));
  if (dmg <= cap) return dmg;
  recordPrevented(ctx, target, attacker, dmg, cap, 'safety');
  target._burstHitFx = Math.max(target._burstHitFx || 0, 16);
  return cap;
}

function markDamageTakenReaction(target, dmg) {
  if (!target || !target.isPlayer || !Number.isFinite(dmg) || dmg <= 0 || target.maxHp <= 0) return;
  const pct = dmg / target.maxHp;
  if (pct >= 0.20) target._burstHitFx = Math.max(target._burstHitFx || 0, 22);
  if (target.hp > 0 && target.hp / target.maxHp <= 0.28) target._lowHealthWarnFx = Math.max(target._lowHealthWarnFx || 0, 36);
}

export function dealDamageRuntime(ctx, target, raw, attacker, dmgType, attackTypeOverride, opts) {
  const dealDamage = (...args) => dealDamageRuntime(ctx, ...args);
  if (stopInvalidDamageTarget(target, { frame: ctx.frame, emitParticle: ctx.emitParticle, addDamageText: ctx.addDamageText })) return;
  raw = Number(raw);
  if (!Number.isFinite(raw) || raw <= 0) return;
  const startingRaw = raw;
  {
    const before = raw;
    const absorb = absorbHiveShield(target, raw, attacker, {
      emitParticle: ctx.emitParticle,
      addDamageText: ctx.addDamageText,
      showFlash: ctx.showFlash,
      groundEffects: ctx.groundEffects,
      frame: ctx.frame,
    });
    raw = absorb.raw;
    recordPrevented(ctx, target, attacker, before, raw, 'hive');
    if (absorb.blocked) return;
  }
  {
    const before = raw;
    const absorb = absorbEnemyShield(target, raw, {
      emitParticle: ctx.emitParticle,
      addDamageText: ctx.addDamageText,
      groundEffects: ctx.groundEffects,
      frame: ctx.frame,
    });
    raw = absorb.raw;
    recordPrevented(ctx, target, attacker, before, raw, 'enemy');
    if (absorb.blocked) return;
  }

  let dmg = raw;
  const inArena = ctx.state === 'battle' && ctx.arena && ctx.arena.phase;
  if (inArena) {
    dmg = applyArenaIncomingScalarModifiers(dmg, { target, attacker, dmgType, attackTypeOverride });
    if (target.isPlayer) {
      if (stopPlayerDefenseGates(target, {
        frame: ctx.frame,
        randomFloat: ctx.randomFloat,
        emitParticle: ctx.emitParticle,
        groundEffects: ctx.groundEffects,
        addDamageText: ctx.addDamageText,
      })) return;

      {
        const before = dmg;
        const absorb = absorbGoldShield(target, dmg, {
          emitParticle: ctx.emitParticle,
          addDamageText: ctx.addDamageText,
          groundEffects: ctx.groundEffects,
          frame: ctx.frame,
        });
        dmg = absorb.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'gold');
        if (absorb.blocked) return;
      }
      const beforeIron = dmg;
      dmg = applyIronSkinReduction(target, dmg, {
        frame: ctx.frame,
        emitParticle: ctx.emitParticle,
        addDamageText: ctx.addDamageText,
      });
      recordPrevented(ctx, target, attacker, beforeIron, dmg, 'armor');
      const beforeProtection = dmg;
      dmg = applyPlayerProtectionReductions(dmg, {
        target,
        attacker,
        units: ctx.units,
        enemies: ctx.enemies,
        frame: ctx.frame,
        emitParticle: ctx.emitParticle,
        groundEffects: ctx.groundEffects,
        addDamageText: ctx.addDamageText,
      });
      recordPrevented(ctx, target, attacker, beforeProtection, dmg, 'guard');
      {
        const before = dmg;
        const absorb = absorbEarthwardenShield(target, dmg, {
          emitParticle: ctx.emitParticle,
          addDamageText: ctx.addDamageText,
          groundEffects: ctx.groundEffects,
          frame: ctx.frame,
        });
        dmg = absorb.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'earthwarden');
        if (absorb.blocked) return;
      }
      triggerGalacticGuardian(target, {
        enemies: ctx.enemies,
        randomFloat: ctx.randomFloat,
        dealDamage,
        emitParticle: ctx.emitParticle,
        groundEffects: ctx.groundEffects,
        addDamageText: ctx.addDamageText,
        shake: ctx.shake,
      });
      dmg = applyPreShieldPlayerReactions(dmg, {
        target,
        dmgType,
        attackTypeOverride,
        tickHz: GAME_TICK_HZ,
        emitParticle: ctx.emitParticle,
        addDamageText: ctx.addDamageText,
        showFlash: ctx.showFlash,
      });
      {
        const before = dmg;
        const absorb = absorbTimedNumericShield(target, dmg, {
          amountKey: '_zavsLineShield',
          timerKey: '_zavsLineShieldTimer',
          color: '#cfd6df',
          label: 'GUARD',
          frame: ctx.frame,
          emitParticle: ctx.emitParticle,
          addDamageText: ctx.addDamageText,
          groundEffects: ctx.groundEffects,
        });
        dmg = absorb.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'guard');
        if (absorb.blocked) return;
      }
      {
        const before = dmg;
        const absorb = absorbTimedNumericShield(target, dmg, {
          amountKey: '_batataMudShield',
          timerKey: '_batataMudShieldTimer',
          color: '#8a6a32',
          label: 'MUD',
          frame: ctx.frame,
          emitParticle: ctx.emitParticle,
          addDamageText: ctx.addDamageText,
          groundEffects: ctx.groundEffects,
        });
        dmg = absorb.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'mud');
        if (absorb.blocked) return;
      }
      {
        const before = dmg;
        const absorb = absorbTimedNumericShield(target, dmg, {
          amountKey: '_taoonBloodShield',
          timerKey: '_taoonBloodShieldTimer',
          color: '#cc2244',
          label: 'BLOOD',
          frame: ctx.frame,
          emitParticle: ctx.emitParticle,
          addDamageText: ctx.addDamageText,
          textColor: '#ff6688',
          groundEffects: ctx.groundEffects,
        });
        dmg = absorb.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'blood');
        if (absorb.blocked) return;
      }
      {
        const before = dmg;
        const absorb = absorbShieldHp(target, dmg, {
          emitParticle: ctx.emitParticle,
          addDamageText: ctx.addDamageText,
          groundEffects: ctx.groundEffects,
          frame: ctx.frame,
        });
        dmg = absorb.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'shield');
        if (absorb.blocked) return;
      }
      {
        const before = dmg;
        const absorb = absorbShieldOfVengeance(target, dmg, {
          emitParticle: ctx.emitParticle,
          addDamageText: ctx.addDamageText,
          groundEffects: ctx.groundEffects,
          frame: ctx.frame,
        });
        dmg = absorb.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'vengeance');
        if (absorb.blocked) return;
      }
      {
        const before = dmg;
        const absorb = absorbObjectShield(target, dmg, {
          shieldKey: '_iceBarrier',
          color: '#88ddff',
          emitParticle: ctx.emitParticle,
          addDamageText: ctx.addDamageText,
          groundEffects: ctx.groundEffects,
          frame: ctx.frame,
          type: 'ice',
          particleCount: 4,
          particleSize: 2,
        });
        dmg = absorb.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'ice');
        if (absorb.blocked) return;
      }
      {
        const before = dmg;
        const defense = applyPlayerSpecialDefenses(dmg, {
          target,
          attacker,
          units: ctx.units,
          dmgType,
          attackTypeOverride,
          frame: ctx.frame,
          tickHz: GAME_TICK_HZ,
          dealDamage,
          emitParticle: ctx.emitParticle,
          groundEffects: ctx.groundEffects,
          addDamageText: ctx.addDamageText,
        });
        dmg = defense.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'defense');
        if (defense.blocked) return;
      }
      {
        const before = dmg;
        const absorb = absorbObjectShield(target, dmg, {
          shieldKey: '_darkPactShield',
          color: '#9b59b6',
          emitParticle: ctx.emitParticle,
          addDamageText: ctx.addDamageText,
          groundEffects: ctx.groundEffects,
          frame: ctx.frame,
          type: 'pact',
          text: 'PACT',
        });
        dmg = absorb.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'pact');
        if (absorb.blocked) return;
      }
      {
        const before = dmg;
        const absorb = absorbObjectShield(target, dmg, {
          shieldKey: '_engShield',
          color: '#44aaff',
          emitParticle: ctx.emitParticle,
          addDamageText: ctx.addDamageText,
          groundEffects: ctx.groundEffects,
          frame: ctx.frame,
          type: 'engineer',
        });
        dmg = absorb.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'engineer');
        if (absorb.blocked) return;
      }
      {
        const before = dmg;
        const absorb = absorbObjectShield(target, dmg, {
          shieldKey: '_pwBarrier',
          color: '#ffaadd',
          emitParticle: ctx.emitParticle,
          addDamageText: ctx.addDamageText,
          groundEffects: ctx.groundEffects,
          frame: ctx.frame,
          type: 'priest',
          particleCount: 6,
          particleSize: 3,
        });
        dmg = absorb.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'priest');
        if (absorb.blocked) return;
      }
      {
        const before = dmg;
        const absorb = absorbObjectShield(target, dmg, {
          shieldKey: '_raptureShield',
          color: '#ffaadd',
          emitParticle: ctx.emitParticle,
          addDamageText: ctx.addDamageText,
          groundEffects: ctx.groundEffects,
          frame: ctx.frame,
          type: 'rapture',
          particleCount: 4,
          particleSize: 2,
        });
        dmg = absorb.dmg;
        recordPrevented(ctx, target, attacker, before, dmg, 'rapture');
        if (absorb.blocked) return;
      }
      triggerPrayerOfMending(target, dmg, {
        units: ctx.units,
        projectiles: ctx.projectiles,
        applyHealingReceived: ctx.applyHealingReceived,
        addHealEffect: ctx.addHealEffect,
        emitParticle: ctx.emitParticle,
      });
      if (tryGuardianSpiritSave(target, dmg, {
        randomRange: ctx.randomRange,
        addHealEffect: ctx.addHealEffect,
        emitParticle: ctx.emitParticle,
        groundEffects: ctx.groundEffects,
        addDamageText: ctx.addDamageText,
        showFlash: ctx.showFlash,
        shake: ctx.shake,
      })) return;
      dmg = applySoulLinkRedirect(target, dmg, {
        units: ctx.units,
        frame: ctx.frame,
        emitParticle: ctx.emitParticle,
      });
      if (target.stealth && dmg > 0) target.idleT = 0;
    }
  }

  dmg = applyAttackerOpeningDamageModifiers(dmg, {
    target,
    attacker,
    emitParticle: ctx.emitParticle,
    addDamageText: ctx.addDamageText,
  });
  dmg = applyPostDefenseDamageModifiers(dmg, {
    inArena,
    target,
    attacker,
    dmgType,
    attackTypeOverride,
    emitParticle: ctx.emitParticle,
    addDamageText: ctx.addDamageText,
  });
  {
    const legacy = applyLegacyPreDamageHooks(dmg, {
      inArena,
      target,
      attacker,
      dmgType,
      dealDamage,
      addHealEffect: ctx.addHealEffect,
      emitParticle: ctx.emitParticle,
    });
    dmg = legacy.dmg;
    if (legacy.blocked) return;
  }
  dmg = applyBossAndRecordModifiers(dmg, { target });
  dmg = applyEarlyOneShotCap(ctx, target, attacker, dmg);
  const combatRatio = startingRaw > 0 ? dmg / startingRaw : 1;
  applyDamageHit(target, dmg, {
    inArena,
    arenaState: ctx.arena,
    attacker,
    dmgType,
    attackTypeOverride,
    opts,
    spawnImpactVfx: ctx.spawnImpactVfx,
    recordDamage: ctx.recordDamage,
    emitParticle: ctx.emitParticle,
    addDamageText: ctx.addDamageText,
  });
  applyJudgmentOfLightHit(target, attacker, {
    inArena,
    frame: ctx.frame,
    emitParticle: ctx.emitParticle,
  });
  showDamageHitFeedback(target, dmg, {
    opts,
    dmgType,
    attacker,
    attackTypeOverride,
    frame: ctx.frame,
    combatRatio,
    addDamageText: ctx.addDamageText,
  });
  markDamageTakenReaction(target, dmg);
  applyLegacyPostDamageHooks(dmg, {
    inArena,
    target,
    attacker,
    frame: ctx.frame,
    tickHz: GAME_TICK_HZ,
    showFlash: ctx.showFlash,
    emitParticle: ctx.emitParticle,
  });
  if (!Number.isFinite(dmg) || dmg <= 0) return;
  if (tryAngelOfMercySave(target, {
    randomRange: ctx.randomRange,
    emitParticle: ctx.emitParticle,
    groundEffects: ctx.groundEffects,
    addDamageText: ctx.addDamageText,
    showFlash: ctx.showFlash,
    shake: ctx.shake,
  })) return;
  if (tryArdentDefenderSave(target, {
    tickHz: GAME_TICK_HZ,
    addGoldShield: ctx.addGoldShield,
    emitParticle: ctx.emitParticle,
    groundEffects: ctx.groundEffects,
    addDamageText: ctx.addDamageText,
    showFlash: ctx.showFlash,
    shake: ctx.shake,
    playCheatDeathSfx: ctx.playCheatDeathSfx,
  })) return;
  if (tryCheatDeathSave(target, {
    tickHz: GAME_TICK_HZ,
    emitParticle: ctx.emitParticle,
    groundEffects: ctx.groundEffects,
    addDamageText: ctx.addDamageText,
    showFlash: ctx.showFlash,
    shake: ctx.shake,
    playCheatDeathSfx: ctx.playCheatDeathSfx,
  })) return;
  if (target.hp <= 0) {
    applyDeathBoom(target, {
      inArena,
      enemies: ctx.enemies,
      dealDamage,
      emitParticle: ctx.emitParticle,
      groundEffects: ctx.groundEffects,
      addDamageText: ctx.addDamageText,
      showFlash: ctx.showFlash,
      shake: ctx.shake,
    });
    tryGhostOnDeath(target, { inArena, spawnGhost: ctx.spawnGhost });
    handleCombatDeath(ctx, target, attacker);
  }
}

export function handleCombatDeath(ctx, target, killer) {
  target.hp = 0;
  const inArena = ctx.state === 'battle' && ctx.arena && ctx.arena.phase;
  const dealDamage = (...args) => dealDamageRuntime(ctx, ...args);
  applyArenaDeathReactionHooks(target, killer, {
    inArena,
    units: ctx.units,
    enemies: ctx.enemies,
    dealDamage,
    frame: ctx.frame,
    tickHz: GAME_TICK_HZ,
    applyDeadlyPoison: ctx.applyDeadlyPoison,
    spawnGhoul: ctx.spawnGhoul,
    emitParticle: ctx.emitParticle,
    groundEffects: ctx.groundEffects,
    addDamageText: ctx.addDamageText,
    shake: ctx.shake,
  });
  if (tryArenaDeathBranchHooks(target, {
    inArena,
    units: ctx.units,
    enemies: ctx.enemies,
    tickHz: GAME_TICK_HZ,
    dealDamage,
    emitParticle: ctx.emitParticle,
    groundEffects: ctx.groundEffects,
    addDamageText: ctx.addDamageText,
    showFlash: ctx.showFlash,
    shake: ctx.shake,
  })) return;
  const deathResult = resolveDeathPresentation(target, {
    respawnFrames: RESPAWN_FRAMES,
    emitParticle: ctx.emitParticle,
    groundEffects: ctx.groundEffects,
    addDamageText: ctx.addDamageText,
    showFlash: ctx.showFlash,
    shake: ctx.shake,
  });
  if (deathResult.heroKo) ctx.setHeroKoState(deathResult);
  const rewardEvent = createEnemyKillRewardEvent(target, killer, {
    inArena,
    currentStage: ctx.currentStage,
    arenaState: ctx.arena,
    campaignKillBountyMult: ARENA_CAMPAIGN_KILL_BOUNTY_MULT,
    warmupGoldBonus: WARMUP_GOLD_BONUS,
    riftBonusGold: ctx.riftBonusGold,
    campaignStageMult: arena_campaignKillBountyStageMult,
    roundGoldMult: arena_roundGoldMult,
    lateStageNormalGoldMult: arena_lateStageNormalGoldMult,
  });
  if (rewardEvent) ctx.addKillReward(rewardEvent);
  startSummonerCooldownForDeadMinion(target, ctx.units);
}

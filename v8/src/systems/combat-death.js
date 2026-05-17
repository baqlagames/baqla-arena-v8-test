export function emitUnitDeathBurst(unit, {
  emitParticle,
  groundEffects,
  shake,
}) {
  if (unit.isEnemy) {
    if (unit.isBoss) {
      emitParticle(unit.x, unit.y, unit.color || '#fff', 60, 9);
      emitParticle(unit.x, unit.y, '#ffffff', 28, 7);
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 90, life: 0.7, color: unit.color || '#fff' });
      shake(18);
    } else if (unit.isElite) {
      emitParticle(unit.x, unit.y, unit.color || '#fff', 32, 6);
      emitParticle(unit.x, unit.y, '#ffffff', 12, 4);
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 50, life: 0.45, color: unit.color || '#fff' });
      shake(8);
    } else {
      emitParticle(unit.x, unit.y, unit.color || '#fff', 16, 4);
      emitParticle(unit.x, unit.y, '#ffffff', 5, 3);
    }
  } else {
    emitParticle(unit.x, unit.y, unit.color || '#fff', 12, 3);
  }
}

export function calculateEnemyKillReward(unit, killer, {
  inArena,
  currentStage,
  arenaState,
  campaignKillBountyMult,
  warmupGoldBonus,
  riftBonusGold,
  campaignStageMult,
  roundGoldMult,
  lateStageNormalGoldMult,
}) {
  if (!unit.isEnemy || !killer || !killer.isPlayer) return 0;

  const goldMult = inArena ? campaignKillBountyMult : 0.35;
  let reward = (unit.points || 10) * goldMult;
  if (unit.fromWarmup) reward *= warmupGoldBonus;

  if (currentStage) {
    const stageNum = currentStage.n;
    reward *= inArena ? campaignStageMult(stageNum) : (stageNum <= 5 ? 1.0 : (0.85 + Math.max(0, stageNum - 6) * 0.015));
  }
  if (arenaState && arenaState._waveGoldMult) reward *= arenaState._waveGoldMult;
  if (inArena) reward *= roundGoldMult((arenaState && arenaState.round) || 1, (currentStage && currentStage.n) || 1);
  if (inArena && currentStage && !unit.isBoss && !unit.isElite && !unit.bossSupport && !unit.fromRift) {
    reward *= lateStageNormalGoldMult(currentStage.n || 1, (arenaState && arenaState.round) || 1);
  }

  reward = Math.max(1, Math.round(reward));
  if (unit.fromRift) reward += riftBonusGold;
  if (unit.halfGold) reward = Math.max(1, Math.round(reward * 0.5));
  return reward;
}

export function killRewardTextColor(unit) {
  if (unit.halfGold) return '#ff8800';
  if (unit.fromRift) return '#c08aff';
  if (unit.fromWarmup) return '#ffec70';
  return '#ffd700';
}

export function resolveDeathPresentation(unit, {
  respawnFrames,
  emitParticle,
  groundEffects,
  addDamageText,
  showFlash,
  shake,
}) {
  if (unit.isHero) {
    showFlash('VODKA KO\'d', '#aa3333', 80);
    emitParticle(unit.x, unit.y, '#ff8c00', 30, 5);
    return {
      heroKo: true,
      vodkaDead: true,
      vodkaRespawn: respawnFrames,
      vodkaUnit: null,
    };
  }

  if (unit.isPlayer && !unit.isMinion) {
    groundEffects.push({
      x: unit.x,
      y: unit.y + Math.max(8, (unit.size || 20) * 0.42),
      r: 0,
      maxR: 34,
      life: 2.8,
      color: unit.color || '#ff6666',
      unitDown: true,
    });
    if (addDamageText) {
      addDamageText(unit.x, unit.y - (unit.size || 20) - 8, 'KO', '#ff6b6b', {
        sz: 12,
        bold: true,
        outline: '#2a0606',
        vy: -0.18,
      });
    }
  }

  emitUnitDeathBurst(unit, { emitParticle, groundEffects, shake });
  return { heroKo: false };
}

export function createEnemyKillRewardEvent(unit, killer, {
  inArena,
  currentStage,
  arenaState,
  campaignKillBountyMult,
  warmupGoldBonus,
  riftBonusGold,
  campaignStageMult,
  roundGoldMult,
  lateStageNormalGoldMult,
}) {
  const reward = calculateEnemyKillReward(unit, killer, {
    inArena,
    currentStage,
    arenaState,
    campaignKillBountyMult,
    warmupGoldBonus,
    riftBonusGold,
    campaignStageMult,
    roundGoldMult,
    lateStageNormalGoldMult,
  });
  if (reward <= 0) return null;
  return {
    reward,
    text: `+${reward}g`,
    color: killRewardTextColor(unit),
    x: unit.x,
    y: unit.y - 10,
  };
}

export function startSummonerCooldownForDeadMinion(unit, units) {
  if (!unit.isMinion || !unit.parent || unit.parent.hp <= 0) return;
  const remaining = units.filter(minion => minion.isMinion && minion.parent === unit.parent && minion !== unit && minion.hp > 0).length;
  if (remaining !== 0) return;
  unit.parent.summonCDt = (unit.kind === 'bear' || unit.kind === 'wolf' || unit.kind === 'raptor' || unit.kind === 'spiritBeast' || unit.kind === 'flameSprite') ? 600 : 720;
}

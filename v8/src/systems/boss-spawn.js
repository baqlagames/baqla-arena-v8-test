import { BOSSES } from '../data/bosses.js?v=20260522-warden-backline-soften';
import { UNIT_VISUAL_SCALE, ARENA_L, ARENA_R, ARENA_TOP_BASE, ARENA_UNIT_SIZE_SCALE } from '../data/tuning.js';
import { clampActorToSpawnArea, clampSpawnValue, spawnAreaFromView } from './arena-spawn-bounds.js';

const ARENA_BOSS_SIZE_MULT = 1.20;
const ARENA_BOSS_BASE_DAMAGE_MULT = 1.06;
const ARENA_BOSS_SKILL_DAMAGE_MULT = 1.07;
const ARENA_BOSS_LIEUTENANT_DAMAGE_MULT = 1.06;
const ARENA_BOSS_LIEUTENANT_SIZE_MULT = 1.08;

function scaleDamageValue(value, mult) {
  if (!Number.isFinite(value)) return value;
  return Math.max(1, Math.round(value * mult));
}

function tuneBossDamageFields(boss) {
  if (!boss || boss._arenaBossPressureTuned) return boss;
  boss.dmg = scaleDamageValue(boss.dmg || 0, ARENA_BOSS_BASE_DAMAGE_MULT);
  for (const key of Object.keys(boss)) {
    if (key === 'dmg' || !Number.isFinite(boss[key])) continue;
    if (/(?:Dmg|Damage)$/.test(key)) {
      boss[key] = scaleDamageValue(boss[key], ARENA_BOSS_SKILL_DAMAGE_MULT);
    } else if (/DmgMult$/.test(key)) {
      boss[key] = Math.max(0.01, Number((boss[key] * ARENA_BOSS_SKILL_DAMAGE_MULT).toFixed(3)));
    }
  }
  boss._arenaBossPressureTuned = true;
  return boss;
}

export function bossVisibleTop({ state, arenaState, arenaTop }) {
  return (state === 'battle' && arenaState && arenaState.phase) ? ARENA_TOP_BASE + 46 : arenaTop;
}

export function clampTopSpawnBossToVisibleArena(boss, {
  state,
  arenaState,
  arenaTop,
  arenaBottom,
  spawnLeft,
  spawnRight,
  clampValue,
}) {
  if (!boss) return;
  const clampFn = typeof clampValue === 'function'
    ? clampValue
    : ((value, min, max) => Math.max(min, Math.min(max, value)));
  const top = bossVisibleTop({ state, arenaState, arenaTop });
  const margin = Math.max(42, (boss.size || 32) * 1.35);
  const left = Number.isFinite(spawnLeft) ? spawnLeft : ARENA_L;
  const right = Number.isFinite(spawnRight) ? spawnRight : ARENA_R;
  boss.x = clampFn(boss.x, left + margin * 0.55, right - margin * 0.55);
  boss.y = clampFn(boss.y, top + margin, arenaBottom - Math.max(72, boss.size || 32));
}

export function buildLieutenantsFor(template, stageHpM, stageDmgM, mainBoss, {
  width,
  arenaTop,
  arenaBottom,
  spawnY,
  frame,
  spawnLeft,
  spawnRight,
}) {
  const lieutenantHpPct = Number.isFinite(template.lieutenantHpPct) ? template.lieutenantHpPct : 0.28;
  const lieutenantDmgPct = Number.isFinite(template.lieutenantDmgPct) ? template.lieutenantDmgPct : 0.60;
  const baseHp = Math.round(template.hp * lieutenantHpPct * stageHpM);
  const baseDmg = Math.round(template.dmg * lieutenantDmgPct * stageDmgM * ARENA_BOSS_LIEUTENANT_DAMAGE_MULT);
  const left = Number.isFinite(spawnLeft) ? spawnLeft : width * 0.18;
  const right = Number.isFinite(spawnRight) ? spawnRight : width * 0.82;
  const spawnArea = spawnAreaFromView({
    arenaTop,
    arenaBottom,
    spawnLeft: left,
    spawnRight: right,
    fallbackWidth: width,
  });
  const xs = [left + (right - left) * 0.22, left + (right - left) * 0.5, left + (right - left) * 0.78];
  const signatures = [
    {
      name: 'Sand Lord',
      color: '#c8a05a',
      accent: '#7a5028',
      poisonCloudCD: 600,
      poisonCloudPhase: 1,
      aoeCD: 540,
      aoeRadius: 80,
      aoeDmg: 55,
      aoePhase: 1,
      aoeColor: '#a07a44',
      projType: 'curse',
    },
    {
      name: 'Tomb Marshal',
      color: '#9a8a4a',
      accent: '#5a4a18',
      stompCD: 540,
      stompRadius: 90,
      stompDmg: 75,
      stompStun: 60,
      stompPhase: 1,
      armorType: 'heavy',
      projType: 'normal',
    },
    {
      name: 'Sun Vanguard',
      color: '#e08a30',
      accent: '#7a4a08',
      debuffCD: 540,
      debuffType: 'poison',
      debuffDmg: 9,
      debuffDur: 240,
      debuffPhase: 1,
      magicBoltCD: 480,
      magicBoltPhase: 1,
      magicBoltDmg: Math.round(baseDmg * 1.4),
      magicBoltColor: '#ffaa44',
      projType: 'fire',
    },
  ];

  const lieutenants = [];
  for (let i = 0; i < 3; i++) {
    const signature = signatures[i];
    const lieutenant = {
      ...signature,
      x: xs[i],
      y: Number.isFinite(spawnY) ? spawnY + 58 : arenaTop + 90,
      maxHp: baseHp,
      hp: baseHp,
      dmg: baseDmg,
      size: Math.round(42 * ARENA_BOSS_LIEUTENANT_SIZE_MULT),
      armor: signature.armorType === 'heavy' ? 6 : 3,
      magicRes: 3,
      speed: 0.30,
      atkSpd: 60,
      range: 50,
      points: Math.round((template.points || 500) * 0.4),
      isEnemy: true,
      isBoss: true,
      isLieutenant: true,
      bossSupportColor: signature.color || template.color || '#ffaa44',
      bossSupportIndex: i,
      bossSupportTotal: 3,
      cd: 0,
      facing: -1,
      bobPhase: 0,
      debuffs: {},
      mechCD: {},
      spawnFrame: frame,
      timeEnrageAt: 14000,
      mainBossRef: mainBoss,
    };
    tuneBossDamageFields(lieutenant);
    clampActorToSpawnArea(lieutenant, {
      ...spawnArea,
      topMargin: 58,
      bottomMargin: 82,
    });
    lieutenants.push(lieutenant);
  }
  return lieutenants;
}

export function spawnBossById({
  bossId,
  opts = {},
  state,
  arenaState,
  frame,
  width,
  arenaTop,
  arenaBottom,
  spawnY,
  spawnLeft,
  spawnRight,
  enemies,
  randomFloat = Math.random,
  clampValue,
  showFlash,
  emitParticle,
  shake,
}) {
  const template = BOSSES[bossId];
  if (!template) return null;

  // Boss stats are authored directly in BOSSES[]. Do not inherit campaign
  // stage/round multipliers here; tune the boss data when power needs to move.
  const stageHpM = 1;
  const stageDmgM = 1;
  const inArena = state === 'battle' && arenaState && arenaState.phase;
  const sizeScale = (inArena ? ARENA_UNIT_SIZE_SCALE : UNIT_VISUAL_SCALE) * (inArena ? ARENA_BOSS_SIZE_MULT : 1);
  const laneLeft = Number.isFinite(spawnLeft) ? spawnLeft : ARENA_L;
  const laneRight = Number.isFinite(spawnRight) ? spawnRight : ARENA_R;
  const spawnArea = spawnAreaFromView({
    arenaTop,
    arenaBottom,
    spawnLeft: laneLeft,
    spawnRight: laneRight,
    fallbackWidth: width,
  });
  const spawnMin = laneLeft + 55;
  const spawnMax = Math.max(spawnMin + 1, laneRight - 55);
  const spawnX = template.fixedSpawnCenter
    ? (laneLeft + laneRight) / 2
    : template.spawnFromTop
    ? spawnMin + randomFloat() * (spawnMax - spawnMin)
    : width / 2;
  const paintedSpawnY = Number.isFinite(spawnY) && inArena ? spawnY : null;
  const spawnTop = paintedSpawnY != null
    ? paintedSpawnY
    : template.spawnFromTop
    ? bossVisibleTop({ state, arenaState, arenaTop })
    : arenaTop;
  const boss = {
    ...template,
    x: spawnX,
    y: spawnTop + (template.spawnYOffset || 100),
    size: (template.size || 32) * sizeScale,
    maxHp: Math.round(template.hp * stageHpM),
    hp: Math.round(template.hp * stageHpM),
    dmg: Math.round(template.dmg * stageDmgM),
    armorType: template.armorType || 'boss',
    spawnFrame: frame,
    isEnemy: true,
    isBoss: true,
    cd: 0,
    facing: -1,
    bobPhase: 0,
    debuffs: {},
    mechCD: {},
    entryHold: template.entryHold || 0,
  };
  tuneBossDamageFields(boss);

  if (template.spawnFromTop) {
    clampTopSpawnBossToVisibleArena(boss, {
      state,
      arenaState,
      arenaTop,
      arenaBottom,
      spawnLeft,
      spawnRight,
      clampValue,
    });
  } else {
    clampActorToSpawnArea(boss, {
      ...spawnArea,
      topMargin: 58,
      bottomMargin: 82,
    });
  }

  if (template.stormVizier || template.fixedSpawnCenter) {
    boss._stormHoldX = boss.x;
    boss._stormHoldY = boss.y;
  }

  if (template.hasBarrier) {
    boss.untargetable = true;
    boss.lockedAtTop = true;
    boss.y = paintedSpawnY != null ? paintedSpawnY + 58 : arenaTop + 90;
    clampActorToSpawnArea(boss, {
      ...spawnArea,
      topMargin: 58,
      bottomMargin: 82,
    });
    const barrier = {
      isBarrier: true,
      name: 'Cursed Barrier',
      x: boss.x,
      y: boss.y,
      rx: 45,
      ry: 45,
      size: 45,
      healHp: 0,
      healHpMax: Math.round((template.barrierHealMax || 600) * stageHpM),
      hp: 1,
      maxHp: 1,
      color: '#5a2a8e',
      accent: '#9a5acc',
      bossRef: boss,
      untargetable: true,
      isEnemy: false,
    };
    enemies.push(barrier);
    if (arenaState) arenaState.activeBarrier = barrier;
  }

  enemies.push(boss);

  if (template.astralStorm && arenaState) {
    arenaState.astralStorm = {
      active: true,
      bossId: template.id,
      startedFrame: frame,
      arrivalTimer: 120,
      nextThunderFrame: frame + 60 + Math.round(randomFloat() * 60),
      flashTimer: 14,
      flashMax: 14,
      forks: [],
    };
  }

  if (template.isAerial) {
    boss.untargetable = true;
    boss.aerial = true;
    boss.aerialPatrolT = 0;
    boss.aerialAnchor = {
      x: clampSpawnValue(width / 2, spawnArea.left + 45, spawnArea.right - 45),
      y: clampSpawnValue(paintedSpawnY != null ? paintedSpawnY + 40 : arenaTop + 65, spawnArea.top + 58, spawnArea.bottom - 82),
    };
  }

  if (template.lieutenantSpawn) {
    if (arenaState) arenaState.lieutenants = [];
    const lieutenants = buildLieutenantsFor(template, stageHpM, stageDmgM, boss, {
      width,
      arenaTop,
      arenaBottom,
      spawnY,
      frame,
      spawnLeft,
      spawnRight,
    });
    for (const lieutenant of lieutenants) {
      enemies.push(lieutenant);
      if (arenaState) arenaState.lieutenants.push(lieutenant);
    }
    boss.lieutenantsTotal = lieutenants.length;
    if (typeof showFlash === 'function') {
      showFlash('LIEUTENANTS - DEFEAT ALL ' + lieutenants.length, '#ffaa44', 150);
    }
  }

  if (typeof showFlash === 'function') {
    if (template.hasBarrier) {
      showFlash('PURIFY THE BARRIER!', '#a855f7', 150);
    } else if (template.isAerial) {
      showFlash(template.name.toUpperCase() + ' - AERIAL', '#ffaa44', 150);
    } else {
      showFlash(opts.label || template.name.toUpperCase(), opts.color || '#ff4444', 120);
    }
  }
  if (typeof shake === 'function') shake(18);
  if (typeof emitParticle === 'function') {
    for (let i = 0; i < 40; i++) emitParticle(boss.x, boss.y, '#ff4444', 1, 5);
  }
  return boss;
}

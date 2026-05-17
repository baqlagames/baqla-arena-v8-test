import { BOSSES } from '../data/bosses.js';
import { UNIT_VISUAL_SCALE, ARENA_L, ARENA_R, ARENA_TOP_BASE, ARENA_UNIT_SIZE_SCALE } from '../data/tuning.js';

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
  frame,
  spawnLeft,
  spawnRight,
}) {
  const baseHp = Math.round(template.hp * 0.30 * stageHpM);
  const baseDmg = Math.round(template.dmg * 0.65 * stageDmgM);
  const left = Number.isFinite(spawnLeft) ? spawnLeft : width * 0.18;
  const right = Number.isFinite(spawnRight) ? spawnRight : width * 0.82;
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
    lieutenants.push({
      ...signature,
      x: xs[i],
      y: arenaTop + 90,
      maxHp: baseHp,
      hp: baseHp,
      dmg: baseDmg,
      size: 42,
      armor: signature.armorType === 'heavy' ? 6 : 3,
      magicRes: 3,
      speed: 0.30,
      atkSpd: 60,
      range: 50,
      points: Math.round((template.points || 500) * 0.4),
      isEnemy: true,
      isBoss: true,
      isLieutenant: true,
      cd: 0,
      facing: -1,
      bobPhase: 0,
      debuffs: {},
      mechCD: {},
      spawnFrame: frame,
      timeEnrageAt: 14000,
      mainBossRef: mainBoss,
    });
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
  const sizeScale = inArena ? ARENA_UNIT_SIZE_SCALE : UNIT_VISUAL_SCALE;
  const laneLeft = Number.isFinite(spawnLeft) ? spawnLeft : ARENA_L;
  const laneRight = Number.isFinite(spawnRight) ? spawnRight : ARENA_R;
  const spawnMin = laneLeft + 55;
  const spawnMax = Math.max(spawnMin + 1, laneRight - 55);
  const spawnX = template.spawnFromTop
    ? spawnMin + randomFloat() * (spawnMax - spawnMin)
    : width / 2;
  const spawnTop = template.spawnFromTop
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
  }

  if (template.hasBarrier) {
    boss.untargetable = true;
    boss.lockedAtTop = true;
    boss.y = arenaTop + 90;
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

  if (template.isAerial) {
    boss.untargetable = true;
    boss.aerial = true;
    boss.aerialPatrolT = 0;
    boss.aerialAnchor = { x: width / 2, y: arenaTop + 65 };
  }

  if (template.lieutenantSpawn) {
    if (arenaState) arenaState.lieutenants = [];
    const lieutenants = buildLieutenantsFor(template, stageHpM, stageDmgM, boss, {
      width,
      arenaTop,
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

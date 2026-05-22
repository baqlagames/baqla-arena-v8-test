import { clamp } from '../core/math.js';
import { ARENA_L, ARENA_R } from '../data/tuning.js';
import {
  drainHealToBarrier,
  tickAerialBombs,
  updateBoss,
} from './boss-mechanics.js?v=20260522-vizier-status-icons';

export function createArenaBossRuntime(deps) {
  const randomRange = typeof deps.randomRange === 'function'
    ? deps.randomRange
    : ((min, max) => min + Math.random() * (max - min));
  const emitParticle = typeof deps.emitParticle === 'function' ? deps.emitParticle : () => {};

  function view() {
    return typeof deps.view === 'function' ? deps.view() : {};
  }

  function shake(value) {
    if (typeof deps.shake === 'function') deps.shake(value);
  }

  function isCampaignBossRound() {
    const v = view();
    const stageRounds = typeof deps.currentStageRounds === 'function' ? deps.currentStageRounds() : 1;
    return v.state === 'battle' && v.arena && v.arena.phase === 'wave' && v.currentStage &&
      v.currentStage.bossId != null && (v.arena.round || 1) >= stageRounds;
  }

  function bossSupportName(boss, template) {
    if (boss && boss.bossMinionName) return boss.bossMinionName;
    const root = (boss && boss.name ? boss.name.split(' ')[0] : 'Boss') || 'Boss';
    const role = (template && template.arch === 'swarm') ? 'Spawn' : (template && template.arch === 'ranged') ? 'Stinger' : 'Minion';
    return root + ' ' + role;
  }

  function tuneBossSupportMinion(enemy, boss, template, index, count) {
    if (!enemy || !boss || !isCampaignBossRound()) return;
    const v = view();
    const stageN = (v.currentStage && v.currentStage.n) || 1;
    const lateHpRelief = stageN >= 21 ? 0.88 : stageN >= 15 ? 0.94 : 1;
    const lateDmgRelief = stageN >= 21 ? 0.86 : stageN >= 15 ? 0.92 : 1;
    const hpMult = (boss.bossMinionHpMult || 0.42) * lateHpRelief;
    const dmgMult = (boss.bossMinionDmgMult || 0.48) * lateDmgRelief;
    const pointsMult = boss.bossMinionPointsMult || 0.45;
    enemy.bossSupport = true;
    enemy.bossSupportColor = boss.color || template.color || '#ffaa00';
    enemy.bossSupportIndex = index || 0;
    enemy.bossSupportTotal = count || 1;
    enemy._bossSupportBossName = boss.name || 'Boss';
    enemy.name = bossSupportName(boss, template);
    enemy.maxHp = Math.max(40, Math.round((enemy.maxHp || enemy.hp || 80) * hpMult));
    enemy.hp = enemy.maxHp;
    enemy.dmg = Math.max(4, Math.round((enemy.dmg || 8) * dmgMult));
    enemy.points = Math.max(1, Math.round((enemy.points || (template && template.points) || 10) * pointsMult));
    enemy.size = Math.max(12, Math.round((enemy.size || 18) * 0.88));
    enemy.entryHold = Math.max(enemy.entryHold || 0, 24);

    const n = Math.max(1, count || 1);
    const offset = (index - (n - 1) / 2) * 38 + randomRange(-10, 10);
    const width = Number.isFinite(v.width) ? v.width : 500;
    const arenaTop = Number.isFinite(v.arenaTop) ? v.arenaTop : 88;
    const arenaBottom = Number.isFinite(v.arenaBottom) ? v.arenaBottom : 820;
    const left = Number.isFinite(v.spawnLeft) ? v.spawnLeft : ARENA_L;
    const right = Number.isFinite(v.spawnRight) ? v.spawnRight : ARENA_R;
    enemy.x = clamp((boss.x || width / 2) + offset, left + enemy.size, right - enemy.size);
    enemy.y = clamp((boss.y || arenaTop + 110) + 42 + randomRange(-8, 12), arenaTop + 50, arenaBottom - 90);

    emitParticle(enemy.x, enemy.y, boss.color || '#ffaa00', 12, 3);
    const beamFx = Array.isArray(v.beamFx) ? v.beamFx : [];
    beamFx.push({ x1: boss.x, y1: boss.y, x2: enemy.x, y2: enemy.y, life: 0.18, maxLife: 0.18, color: boss.color || '#ffaa00', width: 2, straight: false });
  }

  function bossMechanicsContext() {
    const v = view();
    return {
      arena: v.arena,
      units: v.units,
      enemies: v.enemies,
      bombs: v.bombs,
      groundFx: v.groundFx,
      beamFx: v.beamFx,
      frame: v.frame,
      width: v.width,
      arenaTop: v.arenaTop,
      arenaBottom: v.arenaBottom,
      spawnLeft: v.spawnLeft,
      spawnRight: v.spawnRight,
      dealDamage: deps.dealDamage,
      addParticle: emitParticle,
      addDamageText: deps.addDamageText,
      showFlash: deps.showFlash,
      fireProjectile: deps.fireProjectile,
      spawnEnemyByIndex: deps.spawnEnemyByIndex,
      tuneBossSupportMinion,
      clampToArena: deps.clampToArena,
      SFX: deps.sound,
      shake,
    };
  }

  return {
    isCampaignBossRound,
    tuneBossSupportMinion,
    context: bossMechanicsContext,
    tickAerialBombs: ctx => tickAerialBombs(ctx || bossMechanicsContext()),
    drainHealToBarrier: (amount, sourceUnit) => drainHealToBarrier(amount, sourceUnit, bossMechanicsContext()),
    updateBoss: boss => updateBoss(boss, bossMechanicsContext()),
  };
}

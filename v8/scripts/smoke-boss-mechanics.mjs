import { BOSSES } from '../src/data/bosses.js';
import { ENEMIES } from '../src/data/enemies.js';
import { ARENA_L, ARENA_R } from '../src/data/tuning.js';
import { spawnBossById } from '../src/systems/boss-spawn.js';
import { drainHealToBarrier, tickAerialBombs, updateBoss } from '../src/systems/boss-mechanics.js';

const WIDTH = 500;
const ARENA_TOP = 42;
const ARENA_BOT = 932;
const SPAWN_LEFT = ARENA_L + 40;
const SPAWN_RIGHT = ARENA_R - 40;

function makeUnit(id, arch, x, y, opts = {}) {
  return {
    id,
    name: arch + ' test unit',
    arch,
    x,
    y,
    size: opts.size || 20,
    maxHp: opts.maxHp || 20000,
    hp: opts.hp || opts.maxHp || 20000,
    isPlayer: true,
    isGhost: false,
    untargetable: false,
    divineShield: false,
    taunt: arch === 'tank',
    debuffs: {},
    ...opts
  };
}

function makeContext() {
  const arena = { phase: 'wave', activeBarrier: null, lieutenants: [], aerialBombs: [] };
  const units = [
    makeUnit(0, 'tank', 235, 660, { maxHp: 32000, size: 26 }),
    makeUnit(1, 'melee', 205, 700, { maxHp: 22000 }),
    makeUnit(2, 'ranged', 292, 735, { maxHp: 18000, prefersRanged: true }),
    makeUnit(3, 'healer', 260, 775, { maxHp: 17000 }),
  ];
  const enemies = [];
  const bombs = [];
  const groundFx = [];
  const beamFx = [];
  const particles = [];
  const damageText = [];
  const projectiles = [];
  const flashes = [];
  let shakes = 0;

  const ctx = {
    arena,
    units,
    enemies,
    bombs,
    groundFx,
    beamFx,
    damageText,
    frame: 0,
    width: WIDTH,
    arenaTop: ARENA_TOP,
    arenaBottom: ARENA_BOT,
    spawnLeft: SPAWN_LEFT,
    spawnRight: SPAWN_RIGHT,
    dealDamage(target, amount) {
      if (!target || !Number.isFinite(target.hp)) return;
      target.hp = Math.max(0, target.hp - Math.max(0, Math.round(amount || 0)));
    },
    addParticle(x, y, color, count = 1, size = 1) {
      particles.push({ x, y, color, count, size });
    },
    addDamageText(x, y, text, color) {
      damageText.push({ x, y, text, color });
    },
    showFlash(text, color, timer) {
      flashes.push({ text, color, timer });
    },
    fireProjectile(from, target, damage, opts = {}) {
      projectiles.push({ from: from && from.name, target: target && target.name, damage, opts });
    },
    spawnEnemyByIndex(enemyIdx) {
      const tmpl = ENEMIES[enemyIdx] || ENEMIES.find(enemy => enemy && enemy.id === enemyIdx) || ENEMIES[0];
      if (!tmpl) throw new Error('missing enemy template ' + enemyIdx);
      enemies.push({
        ...tmpl,
        x: WIDTH / 2,
        y: ARENA_TOP + 160,
        maxHp: tmpl.hp || 100,
        hp: tmpl.hp || 100,
        isEnemy: true,
        cd: 0,
        facing: -1,
        bobPhase: 0,
        debuffs: {},
      });
    },
    tuneBossSupportMinion(enemy) {
      if (!enemy) return;
      enemy.bossSupport = true;
      enemy.hp = Math.max(1, Math.round(enemy.hp || enemy.maxHp || 1));
      enemy.maxHp = Math.max(enemy.hp, Math.round(enemy.maxHp || enemy.hp));
    },
    clampToArena(actor) {
      if (!actor) return;
      actor.x = Math.max(ARENA_L + 10, Math.min(ARENA_R - 10, actor.x || WIDTH / 2));
      actor.y = Math.max(ARENA_TOP + 40, Math.min(ARENA_BOT - 40, actor.y || ARENA_TOP + 120));
    },
    SFX: { bossSlam() {} },
    shake(value) {
      shakes = Math.max(shakes, value || 0);
    },
    summary() {
      return { particles: particles.length, damageText: damageText.length, projectiles: projectiles.length, flashes: flashes.length, shakes };
    },
    flashes,
  };
  return ctx;
}

function spawnBossForSmoke(bossId, ctx) {
  return spawnBossById({
    bossId,
    state: 'battle',
    arenaState: ctx.arena,
    frame: ctx.frame,
    width: WIDTH,
    arenaTop: ARENA_TOP,
    arenaBottom: ARENA_BOT,
    spawnLeft: SPAWN_LEFT,
    spawnRight: SPAWN_RIGHT,
    enemies: ctx.enemies,
    randomFloat: () => 0.5,
    clampValue: (value, min, max) => Math.max(min, Math.min(max, value)),
    showFlash: ctx.showFlash,
    emitParticle: ctx.addParticle,
    shake: ctx.shake,
  });
}

function assertInsideArenaPoint(x, y, label) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`${label} became non-finite`);
  if (x < SPAWN_LEFT || x > SPAWN_RIGHT || y < ARENA_TOP || y > ARENA_BOT) {
    throw new Error(`${label} outside arena at ${x},${y}`);
  }
}

function assertBossMechanicBounds(ctx, boss) {
  assertInsideArenaPoint(boss.x, boss.y, `${boss.name} boss`);
  for (const enemy of ctx.enemies) {
    if (!enemy || enemy.isBarrier || enemy.hp <= 0) continue;
    assertInsideArenaPoint(enemy.x, enemy.y, `${boss.name} spawned ${enemy.name || enemy.id || 'enemy'}`);
  }
  for (const bomb of ctx.bombs) {
    if (!bomb) continue;
    if (Number.isFinite(bomb.tx) || Number.isFinite(bomb.ty)) assertInsideArenaPoint(bomb.tx, bomb.ty, `${boss.name} bomb target`);
  }
  for (const fx of ctx.groundFx) {
    if (!fx || !Number.isFinite(fx.x) || !Number.isFinite(fx.y)) continue;
    assertInsideArenaPoint(fx.x, fx.y, `${boss.name} ground effect`);
  }
  for (const bomb of ctx.arena.aerialBombs || []) {
    if (!bomb) continue;
    assertInsideArenaPoint(bomb.x, bomb.y, `${boss.name} aerial bomb`);
  }
}

function tickBoss(ctx, boss, frames = 1) {
  for (let i = 0; i < frames; i++) {
    ctx.frame++;
    updateBoss(boss, ctx);
  }
}

function forcePhase(ctx, boss, hpPct) {
  boss.hp = Math.max(1, Math.round(boss.maxHp * hpPct));
  boss.mechCD = {};
  tickBoss(ctx, boss, 2);
}

function tickAerialBombsToCompletion(ctx, frames = 140) {
  for (let i = 0; i < frames; i++) {
    ctx.frame++;
    tickAerialBombs(ctx);
  }
}

function smokeBarrierBoss(ctx, boss) {
  if (!boss.hasBarrier) return null;
  if (!ctx.arena.activeBarrier) throw new Error('barrier boss spawned without activeBarrier');
  drainHealToBarrier(ctx.arena.activeBarrier.healHpMax * 2, null, ctx);
  if (ctx.arena.activeBarrier) throw new Error('barrier purification did not clear activeBarrier');
  if (boss.untargetable || boss.lockedAtTop) throw new Error('barrier purification did not reveal boss');
  tickBoss(ctx, boss, 2);
  return 'barrier-purified';
}

function smokeAerialBoss(ctx, boss) {
  if (!boss.aerial && !boss.isAerial) return null;
  tickBoss(ctx, boss, 3);
  if (!ctx.arena.aerialBombs || !ctx.arena.aerialBombs.length) throw new Error('aerial boss did not schedule aerial bombs');
  for (const bomb of ctx.arena.aerialBombs) assertInsideArenaPoint(bomb.x, bomb.y, `${boss.name} aerial bomb`);
  tickAerialBombsToCompletion(ctx);
  for (const lieutenant of ctx.arena.lieutenants || []) lieutenant.hp = 0;
  tickBoss(ctx, boss, 2);
  if (boss.aerial || boss.untargetable) throw new Error('aerial boss did not land after lieutenants died');
  return 'aerial-landed';
}

function smokeRoyalCarapace(ctx, boss) {
  if (!boss.royalCarapaceAt) return null;
  const thresholds = Array.isArray(boss.royalCarapaceAt) ? boss.royalCarapaceAt : [boss.royalCarapaceAt];
  boss.hp = Math.max(1, Math.round(boss.maxHp * Math.min(...thresholds) * 0.92));
  boss.mechCD = {};
  tickBoss(ctx, boss, 1);
  if (!boss.hiveShield || !(boss.royalCarapaceTimer > 0)) throw new Error('royal carapace did not start');
  boss.hiveShield.hp = 0;
  tickBoss(ctx, boss, 1);
  if (boss.hiveShield || boss.royalCarapaceTimer) throw new Error('royal carapace did not resolve when shield broke');
  return 'carapace-broken';
}

function smokeAstralWarden(ctx, boss) {
  if (boss.id !== 10) return null;
  const casts = [
    { hpPct: 0.90, key: 'starfall', cds: { starfall: 0, eclipseBeam: 999, gravityToll: 999, lanternOrbit: 999 } },
    { hpPct: 0.90, key: 'eclipseBeam', cds: { starfall: 999, eclipseBeam: 0, gravityToll: 999, lanternOrbit: 999 } },
    { hpPct: 0.50, key: 'gravityToll', cds: { starfall: 999, eclipseBeam: 999, gravityToll: 0, lanternOrbit: 999 } },
    { hpPct: 0.25, key: 'lanternOrbit', cds: { starfall: 999, eclipseBeam: 999, gravityToll: 999, lanternOrbit: 0 } },
  ];
  for (const cast of casts) {
    boss.hp = Math.max(1, Math.round(boss.maxHp * cast.hpPct));
    boss.mechCD = { ...cast.cds };
    boss._astralCastLock = 0;
    if (cast.key === 'gravityToll') boss._astralGravityUnlocked = true;
    if (cast.key === 'lanternOrbit') {
      boss._astralGravityUnlocked = true;
      boss._astralOrbitUnlocked = true;
    }
    tickBoss(ctx, boss, 3);
  }
  if (!ctx.arena.astralStorm || !ctx.arena.astralStorm.active) throw new Error('Astral Warden did not activate astral storm atmosphere');
  return 'astral-warden';
}

function assertBossReadability(ctx, boss) {
  const texts = (ctx.damageText || []).map(item => item.text);
  const labels = (ctx.groundFx || []).map(item => item && item.label).filter(Boolean);
  const warnLabels = (ctx.groundFx || []).filter(item => item && item.enemyWarn).map(item => item.label);
  if (boss.id === 4) {
    if (!labels.includes('INFERNO')) throw new Error('Sultan missing Inferno danger-ring label');
    if (!warnLabels.includes('METEOR')) throw new Error('Sultan missing Meteor warning ring label');
    if (!texts.includes('BURNING DOT')) throw new Error('Sultan missing target debuff hit callout');
    if (!texts.includes('METEOR TARGET')) throw new Error('Sultan missing meteor target callout');
  }
  if (boss.id === 10) {
    for (const text of ['STARFALL LANTERNS', 'ECLIPSE BEAM', 'GRAVITY TOLL', 'LANTERN ORBIT']) {
      if (!texts.includes(text)) throw new Error(`Astral Lantern Warden missing ${text} callout`);
    }
    for (const label of ['STAR', 'ECLIPSE', 'GRAVITY']) {
      if (!labels.includes(label)) throw new Error(`Astral Lantern Warden missing ${label} warning label`);
    }
    if (texts.includes('AMBUSH PRIMED')) throw new Error('Astral Lantern Warden should not use old ambush callout');
    if (labels.includes('SMOKE')) throw new Error('Astral Lantern Warden should not use old smoke label');
  }
  if (boss.id === 6) {
    if (!labels.includes('SUN')) throw new Error('Pharaoh missing Sun danger-ring label');
    if (!texts.includes('DEATH MARK')) throw new Error('Pharaoh missing Death Mark target callout');
  }
}

function smokeBossEnrageSpawnFrame() {
  const ctx = makeContext();
  const boss = {
    id: 'enrage-smoke',
    name: 'Frame Zero Enrage Boss',
    x: WIDTH / 2,
    y: ARENA_TOP + 160,
    size: 42,
    maxHp: 5000,
    hp: 5000,
    dmg: 100,
    atkSpd: 60,
    speed: 0.3,
    range: 50,
    isEnemy: true,
    isBoss: true,
    spawnFrame: 0,
    timeEnrageAt: 12 * 60,
    cd: 0,
    facing: -1,
    bobPhase: 0,
    debuffs: {},
    mechCD: {},
  };
  ctx.frame = 2 * 60;
  updateBoss(boss, ctx);
  if (!ctx.flashes.some(flash => flash.text === 'ENRAGE SOON!')) {
    throw new Error('boss spawned at frame 0 did not warn before enrage');
  }
  ctx.flashes.length = 0;
  ctx.frame = 11 * 60;
  updateBoss(boss, ctx);
  if (ctx.flashes.some(flash => flash.text === 'ENRAGE SOON!')) {
    throw new Error('boss enrage warning repeated after first warning');
  }
  ctx.frame = 12 * 60 + 1;
  updateBoss(boss, ctx);
  if (!boss.timeEnraged) throw new Error('boss spawned at frame 0 did not enrage after its authored window');

  const delayedBoss = { ...boss, timeEnraged: false, _enrageWarned: false, spawnFrame: 10, timeEnrageAt: 3, dmg: 100, atkSpd: 60, mechCD: {}, debuffs: {} };
  ctx.frame = 12;
  updateBoss(delayedBoss, ctx);
  if (delayedBoss.timeEnraged) throw new Error('boss enraged before its nonzero spawn frame window elapsed');
  ctx.frame = 14;
  updateBoss(delayedBoss, ctx);
  if (!delayedBoss.timeEnraged) throw new Error('boss with nonzero spawn frame did not enrage after its window elapsed');
}

function smokeBoss(bossTemplate) {
  const ctx = makeContext();
  const boss = spawnBossForSmoke(bossTemplate.id, ctx);
  if (!boss) throw new Error(`spawnBossById returned null for ${bossTemplate.name}`);
  const notes = [];

  const barrierNote = smokeBarrierBoss(ctx, boss);
  if (barrierNote) notes.push(barrierNote);

  const aerialNote = smokeAerialBoss(ctx, boss);
  if (aerialNote) notes.push(aerialNote);

  for (const hpPct of [0.9, 0.5, 0.25]) forcePhase(ctx, boss, hpPct);
  const astralNote = smokeAstralWarden(ctx, boss);
  if (astralNote) notes.push(astralNote);
  assertBossReadability(ctx, boss);

  const carapaceNote = smokeRoyalCarapace(ctx, boss);
  if (carapaceNote) notes.push(carapaceNote);

  if (!Number.isFinite(boss.x) || !Number.isFinite(boss.y)) throw new Error(`${boss.name} position became non-finite`);
  if (!Array.isArray(ctx.enemies) || !Array.isArray(ctx.groundFx) || !Array.isArray(ctx.bombs)) throw new Error('context arrays corrupted');
  assertBossMechanicBounds(ctx, boss);

  return {
    id: boss.id,
    name: boss.name,
    notes,
    enemies: ctx.enemies.length,
    bombs: ctx.bombs.length,
    groundFx: ctx.groundFx.length,
    ...ctx.summary()
  };
}

const results = [];
for (const boss of BOSSES) {
  try {
    results.push(smokeBoss(boss));
  } catch (error) {
    throw new Error(`${boss.name} boss smoke failed: ${error.message}`, { cause: error });
  }
}
smokeBossEnrageSpawnFrame();

console.log(`Smoke-tested ${results.length} bosses through spawn, phase gates, and special mechanics.`);
for (const result of results) {
  const note = result.notes.length ? ` (${result.notes.join(', ')})` : '';
  console.log(`- ${result.id}: ${result.name}${note}`);
}

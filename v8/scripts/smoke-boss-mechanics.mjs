import { BOSSES } from '../src/data/bosses.js';
import { ENEMIES } from '../src/data/enemies.js';
import { ARENA_L, ARENA_R } from '../src/data/tuning.js';
import { spawnBossById } from '../src/systems/boss-spawn.js';
import { drainHealToBarrier, tickAerialBombs, updateBoss } from '../src/systems/boss-mechanics.js';
import { calculateEnemyKillReward } from '../src/systems/combat-death.js';

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
  const damageHits = [];
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
    dealDamage(target, amount, source, type, attackType, opts = {}) {
      if (!target || !Number.isFinite(target.hp)) return;
      const damage = Math.max(0, Math.round(amount || 0));
      damageHits.push({ target, source, type, attackType, label: opts.sourceLabel || '', amount: damage });
      target.hp = Math.max(0, target.hp - damage);
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
    damageHits,
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
  const wardenTemplate = BOSSES.find(row => row.id === 10);
  if (wardenTemplate.starfallDmg !== 86) throw new Error('Astral Warden Starfall tuning drifted from 86');
  if (wardenTemplate.starfallRadius !== 46) throw new Error('Astral Warden Starfall radius should be 46');
  if (Math.abs((wardenTemplate.starfallFrontlineMult || 0) - 0.55) > 0.0001) throw new Error('Astral Warden Starfall frontline splash tuning drifted from 55%');
  if (Math.abs((wardenTemplate.astralBacklineSpellMult || 0) - 0.88) > 0.0001) throw new Error('Astral Warden backline spell multiplier should be 88%');
  if (Math.abs((boss.astralBacklineSpellMult || 0) - 0.88) > 0.0001) throw new Error('Astral Warden spawned backline spell multiplier should remain unscaled at 88%');
  if (wardenTemplate.lanternOrbitDmg !== 56) throw new Error('Astral Warden Lantern Orbit tuning drifted from 56');
  if (Math.abs((wardenTemplate.astralBlightHpPct || 0) - 0.0105) > 0.0001) throw new Error('Astral Warden Astral Blight tuning drifted from 1.05%');
  if (wardenTemplate.gravityTollDmg !== 98) throw new Error('Astral Warden Gravity Toll tuning drifted from 98');
  if (Math.abs((wardenTemplate.gravityTollFrontlineHpPct || 0) - 0.075) > 0.0001) throw new Error('Astral Warden frontline toll tuning drifted from 7.5%');
  if (wardenTemplate.timeEnrageAt !== 11400) throw new Error('Astral Warden enrage timer should be 11400 frames');
  boss._astralWardTriggered = {};
  boss._astralWardActive = null;
  boss._astralWardBreakLock = 0;
  boss.hiveShield = null;
  boss.hp = Math.max(1, Math.round(boss.maxHp * 0.69));
  boss.mechCD = { starfall: 999, eclipseBeam: 999, gravityToll: 999, lanternOrbit: 999 };
  boss._astralCastLock = 0;
  tickBoss(ctx, boss, 2);
  if (!boss.hiveShield || !boss.hiveShield.astralWard) throw new Error('Astral Warden did not cast Lantern Ward at 70%');
  boss.hiveShield.hp = 0;
  tickBoss(ctx, boss, 2);
  if (boss.hiveShield) throw new Error('Astral Warden Lantern Ward did not break cleanly');
  if (!ctx.units.every(unit => unit._astralBlightTimer > 0)) throw new Error('Astral Warden shield break did not apply Astral Blight to the team');
  boss._astralWardBreakLock = 0;
  boss.hp = Math.max(1, Math.round(boss.maxHp * 0.34));
  tickBoss(ctx, boss, 2);
  if (!boss.hiveShield || !boss.hiveShield.astralWard) throw new Error('Astral Warden did not cast Lantern Ward at 35%');
  boss.hiveShield.hp = 0;
  tickBoss(ctx, boss, 2);
  if ((boss._astralWardBreaks || 0) < 2) throw new Error('Astral Warden did not break both Lantern Wards');

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
    boss.hiveShield = null;
    boss._astralWardActive = null;
    if (cast.key === 'gravityToll') boss._astralGravityUnlocked = true;
    if (cast.key === 'lanternOrbit') {
      boss._astralGravityUnlocked = true;
      boss._astralOrbitUnlocked = true;
    }
    const beforeGravity = cast.key === 'gravityToll'
      ? ctx.units.map(unit => ({ unit, x: unit.x, y: unit.y }))
      : null;
    tickBoss(ctx, boss, 3);
    if (cast.key === 'gravityToll') {
      tickBoss(ctx, boss, 55);
      const frontlinersMoved = beforeGravity
        .filter(row => row.unit.arch === 'tank' || row.unit.arch === 'melee')
        .every(row => Math.hypot(row.unit.x - row.x, row.unit.y - row.y) > 1);
      const backlineHeld = beforeGravity
        .filter(row => row.unit.arch !== 'tank' && row.unit.arch !== 'melee')
        .every(row => Math.hypot(row.unit.x - row.x, row.unit.y - row.y) < 0.1);
      if (!frontlinersMoved) throw new Error('Astral Warden Gravity Toll did not pull tank/melee frontliners');
      if (!backlineHeld) throw new Error('Astral Warden Gravity Toll should not pull ranged/healer backline units');
    }
  }
  if (!ctx.arena.astralStorm || !ctx.arena.astralStorm.active) throw new Error('Astral Warden did not activate astral storm atmosphere');
  if (!ctx.units.some(unit => unit._gravityBrandTimer > 0)) throw new Error('Astral Warden Gravity Toll did not apply Gravity Brand');
  return 'astral-warden';
}

function smokeStormboundVizier(ctx, boss) {
  if (boss.id !== 13) return null;

  boss.hp = boss.maxHp;
  boss.stormWardThresholds = [1, 0.75, 0.5, 0.25];
  boss.stormExposeDur = 4;
  boss.ironSurgeFirst = 1;
  boss.ironSurgeEvery = 8;
  boss.mirrorCleaveFirst = 1;
  boss.mirrorCleaveEvery = 8;
  boss.chainDecreeFirst = 1;
  boss.groundingPulseFirst = 1;
  boss.courtPulseFirst = 1;
  boss._stormVizierInit = false;
  boss._stormCycleState = null;
  boss._stormWardRefs = [];
  boss._stormWardThresholdDone = [];
  boss._stormWardCasts = 0;
  boss._stormCastLock = 0;
  for (const enemy of ctx.enemies) if (enemy && enemy._stormBoss === boss) enemy.hp = 0;
  ctx.units[0].x = boss.x;
  ctx.units[0].y = boss.y + 54;
  ctx.units[1].x = boss.x + 58;
  ctx.units[1].y = boss.y + 66;

  tickBoss(ctx, boss, 2);
  let iron = (boss._stormWardRefs || []).find(enemy => enemy.name === 'Frostglass Prism' && enemy.hp > 0);
  let mirror = (boss._stormWardRefs || []).find(enemy => enemy.name === 'Mirrorice Bulwark' && enemy.hp > 0);
  if (!iron || !mirror) throw new Error('Winterglass Magistrate did not summon both Winterglass Crystals');
  if (!ctx.flashes.some(flash => flash.text === 'WINTERGLASS ARRIVAL!')) throw new Error('Winterglass Magistrate did not play its frost arrival cue');
  if (!ctx.groundFx.some(fx => fx && fx.label === 'FROST') || !ctx.groundFx.some(fx => fx && fx.label === 'WINTER')) throw new Error('Winterglass Magistrate arrival did not seed frost warning visuals');
  if (!Number.isFinite(boss._stormHoldX) || !Number.isFinite(boss._stormHoldY)) throw new Error('Winterglass Magistrate did not anchor its spawn position');
  if (Math.abs(iron.y - boss.y) > 42 || Math.abs(mirror.y - boss.y) > 42) throw new Error('Winterglass Magistrate wards should spawn in side slots near the boss, not below the frontline');
  if (iron.x >= boss.x || mirror.x <= boss.x || Math.abs(iron.x - boss.x) < 70 || Math.abs(mirror.x - boss.x) < 70) throw new Error('Winterglass Magistrate wards should occupy clear left/right side slots');
  if (!iron.priorityTarget || iron.preferredBy !== 'magic') throw new Error('Frostglass Prism missing magic priority target metadata');
  if (!mirror.priorityTarget || mirror.preferredBy !== 'physical') throw new Error('Mirrorice Bulwark missing physical priority target metadata');
  if (!boss._stormShieldActive) throw new Error('Winterglass Magistrate did not shield while wards were active');
  if (ctx.enemies.some(enemy => enemy.name === 'Storm Mote')) throw new Error('Winterglass Magistrate should not spawn Storm Motes');
  if (boss.fixedGoldReward !== 200) throw new Error('Winterglass Magistrate should award 200g when defeated');
  const vizierDef = BOSSES[13];
  if (vizierDef.dmg !== 134 || vizierDef.raidAoeDmg !== 27) throw new Error('Winterglass Magistrate base damage tuning drifted');
  if (vizierDef.ironSurgeDmg !== 66 || vizierDef.mirrorCleaveDmg !== 120 || vizierDef.chainDecreeDmg !== 80 || vizierDef.groundingPulseDmg !== 170 || vizierDef.courtPulseDmg !== 52) {
    throw new Error('Winterglass Magistrate role damage tuning drifted');
  }
  if (Math.abs((vizierDef.groundingPulseTankMult || 0) - 1.10) > 0.0001) throw new Error('Winterglass Magistrate tank Grounding pressure tuning drifted');
  if (vizierDef.courtPulseCD !== 420 || vizierDef.courtPulseFirst !== 120) throw new Error('Winterglass Magistrate Whiteout Pulse cadence drifted');
  if (Math.abs((vizierDef.courtPulseTankMult || 0) - 1.18) > 0.0001 || Math.abs((vizierDef.courtPulseMeleeMult || 0) - 0.82) > 0.0001 || Math.abs((vizierDef.courtPulseBacklineMult || 0) - 0.64) > 0.0001) {
    throw new Error('Winterglass Magistrate Whiteout Pulse role tuning drifted');
  }
  if (vizierDef.stormWardOverchargeFirst !== 1200 || vizierDef.stormWardOverchargeSecond !== 2400) throw new Error('Winterglass Magistrate ward overcharge timing drifted');
  if (JSON.stringify(vizierDef.stormWardOverchargeMults) !== JSON.stringify([1, 1.15, 1.30])) throw new Error('Winterglass Magistrate ward overcharge scaling drifted');
  if (Math.abs((vizierDef.groundingStormShockMult || 0) - 0.34) > 0.0001) throw new Error('Winterglass Magistrate Frost Shock damage tuning drifted');
  if (Math.abs((vizierDef.stormVenomHpPct || 0) - 0.0075) > 0.0001 || vizierDef.stormVenomDur !== 300 || vizierDef.stormVenomMinDmg !== 5) throw new Error('Winterglass Magistrate Frostburn tuning drifted');
  if (Math.abs((vizierDef.tankCurseHpPct || 0) - 0.014) > 0.0001) throw new Error('Winterglass Magistrate tank curse damage tuning drifted');
  if (Math.abs((vizierDef.stormEnrageSkillMult || 0) - 1.18) > 0.0001) throw new Error('Winterglass Magistrate enrage skill multiplier drifted');
  if (vizierDef.timeEnrageAt !== 17250) throw new Error('Winterglass Magistrate enrage timer should be 17250 frames');
  if (vizierDef.stormDeepEnrageDelay !== 3600 || Math.abs((vizierDef.stormDeepEnrageSkillMult || 0) - 1.35) > 0.0001) throw new Error('Winterglass Magistrate deep enrage tuning drifted');
  if (Math.abs((vizierDef.stormNoTankSkillMult || 0) - 1.18) > 0.0001 || Math.abs((vizierDef.stormAttritionSkillMult || 0) - 1.22) > 0.0001) throw new Error('Winterglass Magistrate stall-breaker tuning drifted');
  if (iron.fixedGoldReward !== 15 || mirror.fixedGoldReward !== 15) throw new Error('Winterglass Magistrate wards should award 15 gold each');
  const expectedHpScales = [1, 1.05, 1.10, 1.15];
  const expectedSizeScales = [1, 1.12, 1.22, 1.32];
  const expectedBaseHp = Math.round((boss.stormWardHp || 3000) * expectedHpScales[0]);
  if (iron.maxHp !== expectedBaseHp || mirror.maxHp !== expectedBaseHp) throw new Error('Winterglass Magistrate first ward wave should use base HP scaling');
  if (Math.abs((iron._stormWardDamageScale || 0) - expectedHpScales[0]) > 0.001 || Math.abs((mirror._stormWardDamageScale || 0) - expectedHpScales[0]) > 0.001) {
    throw new Error('Winterglass Magistrate first ward wave should use base damage scaling');
  }
  const wardReward = calculateEnemyKillReward(iron, ctx.units[2], {
    inArena: true,
    currentStage: { n: 10 },
    arenaState: { round: 4 },
    campaignKillBountyMult: 0.8,
    warmupGoldBonus: 1,
    riftBonusGold: 0,
    campaignStageMult: () => 1,
    roundGoldMult: () => 1,
    lateStageNormalGoldMult: () => 1,
  });
  if (wardReward !== 15) throw new Error('Winterglass Magistrate ward fixed gold reward should resolve to exactly 15g');
  const bossReward = calculateEnemyKillReward(boss, ctx.units[2], {
    inArena: true,
    currentStage: { n: 10 },
    arenaState: { round: 4 },
    campaignKillBountyMult: 0.2,
    warmupGoldBonus: 1,
    riftBonusGold: 0,
    campaignStageMult: () => 1,
    roundGoldMult: () => 1,
    lateStageNormalGoldMult: () => 1,
  });
  if (bossReward !== 200) throw new Error('Winterglass Magistrate fixed boss reward should resolve to exactly 200g');

  boss._stormChainCd = 0;
  boss._stormGroundingCd = 0;
  boss._stormCourtPulseCd = 0;
  iron._stormWardCastT = 1;
  mirror._stormWardCastT = 1;
  const hitStart = ctx.damageHits.length;
  tickBoss(ctx, boss, 2);
  const wardHits = ctx.damageHits.slice(hitStart);
  if (ctx.damageText.some(item => item.text === 'ICE CHAIN' || item.text === 'PERMAFROST' || item.text === 'WHITEOUT PULSE')) {
    throw new Error('Winterglass Magistrate should not use boss-only casts while wards are active');
  }
  if (!ctx.damageText.some(item => item.text === 'RIME SURGE')) throw new Error('Frostglass Prism did not show Rime Surge hits');
  if (!ctx.damageText.some(item => item.text === 'GLACIAL CLEAVE')) throw new Error('Mirrorice Bulwark did not show Glacial Cleave hits');
  if (ctx.damageText.filter(item => item.text === 'RIME SURGE').length < 5) throw new Error('Frostglass Prism did not show visible hits on the full squad');
  if (!wardHits.some(hit => hit.attackType === 'rimeSurge' && hit.target.arch === 'ranged') || !wardHits.some(hit => hit.attackType === 'rimeSurge' && hit.target.arch === 'healer')) {
    throw new Error('Frostglass Prism did not damage ranged and healer backline');
  }
  if (!wardHits.some(hit => hit.attackType === 'glacialCleave' && hit.target.arch === 'tank') || !wardHits.some(hit => hit.attackType === 'glacialCleave' && hit.target.arch === 'melee')) {
    throw new Error('Mirrorice Bulwark did not pressure tank and non-tank melee');
  }
  const baseIronHit = wardHits.find(hit => hit.attackType === 'rimeSurge' && hit.target.arch === 'tank');
  const baseMirrorHit = wardHits.find(hit => hit.attackType === 'glacialCleave' && hit.target.arch === 'tank');
  const forceWardAgeCast = (ageFrames, resetStage = 0) => {
    iron._stormWardSpawnFrame = ctx.frame - ageFrames;
    mirror._stormWardSpawnFrame = ctx.frame - ageFrames;
    iron._stormWardOverchargeStage = resetStage;
    mirror._stormWardOverchargeStage = resetStage;
    iron._stormWardCastT = 1;
    mirror._stormWardCastT = 1;
    const textStart = ctx.damageText.length;
    const hitStartAtAge = ctx.damageHits.length;
    tickBoss(ctx, boss, 2);
    return {
      texts: ctx.damageText.slice(textStart).map(item => item.text),
      hits: ctx.damageHits.slice(hitStartAtAge),
    };
  };
  const stage1 = forceWardAgeCast(20 * 60, 0);
  if (!stage1.texts.includes('CRYSTAL OVERCHARGE')) throw new Error('Winterglass Magistrate wards did not show 20s Crystal Overcharge');
  const stage1Iron = stage1.hits.find(hit => hit.attackType === 'rimeSurge' && hit.target.arch === 'tank');
  const stage1Mirror = stage1.hits.find(hit => hit.attackType === 'glacialCleave' && hit.target.arch === 'tank');
  if (!(stage1Iron.amount > baseIronHit.amount * 1.10 && stage1Mirror.amount > baseMirrorHit.amount * 1.10)) {
    throw new Error('Winterglass Magistrate 20s Crystal Overcharge did not increase Iron/Mirror damage');
  }
  const stage2 = forceWardAgeCast(40 * 60, 0);
  if (!stage2.texts.includes('DEEP FREEZE')) throw new Error('Winterglass Magistrate wards did not show 40s Deep Freeze callout');
  const stage2Iron = stage2.hits.find(hit => hit.attackType === 'rimeSurge' && hit.target.arch === 'tank');
  const stage2Mirror = stage2.hits.find(hit => hit.attackType === 'glacialCleave' && hit.target.arch === 'tank');
  if (!(stage2Iron.amount > stage1Iron.amount * 1.08 && stage2Mirror.amount > stage1Mirror.amount * 1.08)) {
    throw new Error('Winterglass Magistrate 40s Deep Freeze did not further increase Iron/Mirror damage');
  }

  boss._stormChainCd = 0;
  boss._stormGroundingCd = 0;
  boss._stormCourtPulseCd = 0;
  boss._stormSilenceCd = 999;
  boss._stormTankCurseCd = 999;
  boss._stormCastLock = 0;
  iron.hp = 0;
  mirror.hp = 0;
  const bossWindowStart = ctx.damageHits.length;
  tickBoss(ctx, boss, 2);
  if (boss._stormShieldActive) throw new Error('Winterglass Magistrate shield stayed active after both wards died');
  if (!(boss._stormExposedTimer > 0)) throw new Error('Winterglass Magistrate did not expose after wards broke');
  if (!ctx.damageText.some(item => item.text === 'WINTERGLASS BARRIER BROKEN')) throw new Error('Winterglass Magistrate missing shield-break callout');
  if (!ctx.damageText.some(item => item.text === 'MAGISTRATE EXPOSED')) throw new Error('Winterglass Magistrate missing Judgment Window callout');
  if (!ctx.damageText.some(item => item.text === 'FROSTBURN')) throw new Error('Winterglass Magistrate missing Frostburn callout');
  if (!ctx.units.every(unit => unit._stormVenomTimer > 0)) throw new Error('Winterglass Magistrate did not apply Frostburn to the full squad');
  if (!ctx.damageText.some(item => item.text === 'WHITEOUT PULSE')) throw new Error('Winterglass Magistrate did not use Whiteout Pulse in the boss-only window');
  const courtHits = ctx.damageHits.slice(bossWindowStart).filter(hit => hit.attackType === 'whiteoutPulse');
  if (!courtHits.some(hit => hit.target.arch === 'tank') || !courtHits.some(hit => hit.target.arch === 'melee') || !courtHits.some(hit => hit.target.arch === 'ranged') || !courtHits.some(hit => hit.target.arch === 'healer')) {
    throw new Error('Winterglass Magistrate Whiteout Pulse did not hit tank, melee, ranged, and healer units');
  }
  const courtTank = courtHits.filter(hit => hit.target.arch === 'tank').reduce((sum, hit) => sum + hit.amount, 0);
  const courtBacklineMax = Math.max(...courtHits.filter(hit => hit.target.arch === 'ranged' || hit.target.arch === 'healer').map(hit => hit.amount));
  if (!(courtTank > courtBacklineMax)) throw new Error('Winterglass Magistrate Whiteout Pulse should pressure tank more than backline units');
  boss._stormCastLock = 0;
  boss._stormCourtPulseCd = 999;
  boss._stormGroundingCd = 0;
  boss._stormChainCd = 999;
  const groundingStart = ctx.damageHits.length;
  tickBoss(ctx, boss, 3);
  if (!ctx.damageText.some(item => item.text === 'PERMAFROST')) throw new Error('Winterglass Magistrate did not pressure tank/melee with Permafrost Ring');
  if (!ctx.damageText.some(item => item.text === 'FROST SHOCK')) throw new Error('Winterglass Magistrate did not show Frost Shock backline pressure');
  if (!ctx.units[0]._groundingBrandTimer || !ctx.units[1]._groundingBrandTimer) throw new Error('Winterglass Magistrate Permafrost Ring did not brand tank and melee');
  const groundingHits = ctx.damageHits.slice(groundingStart);
  if (!groundingHits.some(hit => hit.attackType === 'frostShock' && hit.target.arch === 'ranged') || !groundingHits.some(hit => hit.attackType === 'frostShock' && hit.target.arch === 'healer')) {
    throw new Error('Winterglass Magistrate Frost Shock did not damage ranged and healer backline');
  }
  boss._stormCastLock = 0;
  boss._stormCourtPulseCd = 999;
  boss._stormGroundingCd = 999;
  boss._stormChainCd = 0;
  tickBoss(ctx, boss, 3);
  if (!ctx.damageText.some(item => item.text === 'ICE CHAIN')) throw new Error('Winterglass Magistrate did not cast Ice Chain');
  boss._stormCastLock = 0;
  boss._stormSilenceCd = 0;
  tickBoss(ctx, boss, 3);
  if (!ctx.units[3]._stormSilenceTimer || !ctx.damageText.some(item => item.text === 'FROZEN VOICE')) throw new Error('Winterglass Magistrate did not silence healer with visible feedback');
  boss._stormCastLock = 0;
  boss._stormTankCurseCd = 0;
  boss._stormSilenceCd = 999;
  tickBoss(ctx, boss, 3);
  if (!ctx.units[0]._stormCurseTimer || !ctx.damageText.some(item => item.text === 'RIME CURSE')) throw new Error('Winterglass Magistrate did not curse tank with visible feedback');

  const forceVizierBossWindow = () => {
    boss._stormCycleState = 'boss';
    boss._stormShieldActive = false;
    boss._stormWardWaveActive = false;
    boss._stormWardResolved = true;
    boss._stormWardRefs = [];
    boss._stormCastLock = 0;
    boss._stormSilenceCd = 999;
    boss._stormTankCurseCd = 999;
    boss._stormCourtPulseCd = 999;
    boss._stormGroundingCd = 999;
    boss._stormChainCd = 999;
    boss._stormExposedTimer = 0;
    boss._stormDeepEnraged = false;
    boss._winterglassNoTankPursuit = false;
    boss._winterglassAttritionPressure = false;
    boss._winterglassPursuitAnnounced = false;
    boss._winterglassAttritionAnnounced = false;
    boss.spawnFrame = ctx.frame;
  };
  const castTotal = (attackType, enraged, setup, deepEnraged = false) => {
    forceVizierBossWindow();
    boss.timeEnraged = enraged;
    boss._stormDeepEnraged = deepEnraged;
    setup();
    const start = ctx.damageHits.length;
    tickBoss(ctx, boss, 3);
    return ctx.damageHits.slice(start).filter(hit => hit.attackType === attackType).reduce((sum, hit) => sum + hit.amount, 0);
  };
  const assertEnrageSkillBoost = (attackType, setup) => {
    const normal = castTotal(attackType, false, setup);
    const enraged = castTotal(attackType, true, setup);
    if (!(normal > 0 && enraged > normal * 1.15)) throw new Error(`Winterglass Magistrate enrage did not boost ${attackType} skill damage`);
  };
  assertEnrageSkillBoost('whiteoutPulse', () => { boss._stormCourtPulseCd = 0; });
  assertEnrageSkillBoost('permafrost', () => { boss._stormGroundingCd = 0; });
  assertEnrageSkillBoost('iceChain', () => { boss._stormChainCd = 0; });
  assertEnrageSkillBoost('rimeCurse', () => { boss._stormTankCurseCd = 0; });
  const normalWhiteout = castTotal('whiteoutPulse', true, () => { boss._stormCourtPulseCd = 0; });
  const deepWhiteout = castTotal('whiteoutPulse', true, () => { boss._stormCourtPulseCd = 0; }, true);
  if (!(deepWhiteout > normalWhiteout * 1.10)) throw new Error('Winterglass Magistrate deep enrage did not further boost Whiteout damage');
  forceVizierBossWindow();
  boss.timeEnraged = true;
  boss._stormDeepEnraged = false;
  boss.spawnFrame = ctx.frame - (boss.timeEnrageAt + boss.stormDeepEnrageDelay + 2);
  tickBoss(ctx, boss, 2);
  if (!boss._stormDeepEnraged || !ctx.damageText.some(item => item.text === 'DEEP ENRAGE')) throw new Error('Winterglass Magistrate did not trigger deep enrage 30s after normal enrage');
  boss.spawnFrame = ctx.frame;
  boss._stormDeepEnraged = false;
  const mixedUnits = ctx.units;
  const normalCurse = castTotal('rimeCurse', true, () => { boss._stormTankCurseCd = 0; });
  ctx.units = [
    makeUnit(20, 'tank', 235, 660, { maxHp: 32000, size: 26 }),
    makeUnit(21, 'healer', 260, 740, { maxHp: 17000 }),
    makeUnit(22, 'healer', 292, 760, { maxHp: 17000 }),
  ];
  const attritionCurse = castTotal('rimeCurse', true, () => { boss._stormTankCurseCd = 0; });
  if (!boss._winterglassAttritionPressure || !ctx.damageText.some(item => item.text === 'FROST PRESSURE')) throw new Error('Winterglass Magistrate did not detect tank/healer attrition stall');
  if (!(attritionCurse > normalCurse * 1.02)) throw new Error('Winterglass Magistrate attrition pressure did not boost stalled tank curse');
  ctx.units = [
    makeUnit(23, 'tank', 235, 660, { maxHp: 32000, size: 26 }),
    makeUnit(24, 'tank', 270, 690, { maxHp: 32000, size: 26, taunt: true }),
  ];
  castTotal('rimeCurse', true, () => { boss._stormTankCurseCd = 0; });
  if (!boss._winterglassAttritionPressure) throw new Error('Winterglass Magistrate did not detect two-tank attrition stall');
  ctx.units = [
    makeUnit(25, 'healer', 260, 740, { maxHp: 17000 }),
    makeUnit(26, 'ranged', 292, 760, { maxHp: 18000, prefersRanged: true }),
  ];
  castTotal('iceChain', false, () => { boss._stormChainCd = 0; });
  if (!boss._winterglassNoTankPursuit || !ctx.damageText.some(item => item.text === 'NO TANK - PURSUIT')) throw new Error('Winterglass Magistrate did not detect no-tank pursuit state');
  ctx.units = mixedUnits;
  boss.timeEnraged = false;

  const expectedSizes = [26, 29, 32, 34];
  for (const [waveIndex, hpPct] of [[1, 0.74], [2, 0.49], [3, 0.24]]) {
    boss.hp = Math.round(boss.maxHp * hpPct);
    boss._stormExposedTimer = 0;
    boss._stormExposedDamageMult = 0;
    boss._stormCastLock = 0;
    tickBoss(ctx, boss, 2);
    iron = (boss._stormWardRefs || []).find(enemy => enemy.name === 'Frostglass Prism' && enemy.hp > 0);
    mirror = (boss._stormWardRefs || []).find(enemy => enemy.name === 'Mirrorice Bulwark' && enemy.hp > 0);
    if (!iron || !mirror) throw new Error(`Winterglass Magistrate did not spawn ward wave ${waveIndex + 1}`);
    if (iron.size < expectedSizes[waveIndex] || mirror.size < expectedSizes[waveIndex]) throw new Error(`Winterglass Magistrate ward wave ${waveIndex + 1} did not grow in size`);
    const expectedHp = Math.round((boss.stormWardHp || 3000) * expectedHpScales[waveIndex]);
    if (iron.maxHp !== expectedHp || mirror.maxHp !== expectedHp) throw new Error(`Winterglass Magistrate ward wave ${waveIndex + 1} used wrong HP scaling`);
    if (Math.abs((iron._stormWardDamageScale || 0) - expectedHpScales[waveIndex]) > 0.001 || Math.abs((mirror._stormWardDamageScale || 0) - expectedHpScales[waveIndex]) > 0.001) {
      throw new Error(`Winterglass Magistrate ward wave ${waveIndex + 1} used wrong damage scaling`);
    }
    const expectedMinSize = Math.round(26 * expectedSizeScales[waveIndex]);
    if (iron.size !== expectedMinSize || mirror.size !== expectedMinSize) throw new Error(`Winterglass Magistrate ward wave ${waveIndex + 1} changed size scaling`);
    if (iron.fixedGoldReward !== 15 || mirror.fixedGoldReward !== 15) throw new Error(`Winterglass Magistrate ward wave ${waveIndex + 1} did not keep 15g ward rewards`);
    if (waveIndex < 3) {
      iron.hp = 0;
      mirror.hp = 0;
      tickBoss(ctx, boss, 2);
    }
  }
  if (boss._stormWardCasts < 4) throw new Error('Winterglass Magistrate did not spawn all four HP-threshold ward waves');
  tickBoss(ctx, boss, 80);
  if (!ctx.enemies.some(enemy => enemy.stormWard && enemy.hp > 0)) throw new Error('Winterglass Magistrate wards should not despawn by timer in the smoke');

  const texts = ctx.damageText.map(item => item.text);
  const flashes = ctx.flashes.map(item => item.text);
  if (texts.includes('COURT REBUKE') || flashes.includes('COURT REBUKE!')) throw new Error('Winterglass Magistrate should not use Court Rebuke in the ward-focused version');
  if (texts.includes('STORM MOTE') || texts.includes('STORM MOTES') || flashes.includes('STORM MOTES!')) throw new Error('Winterglass Magistrate should not use Storm Motes in the ward-focused version');
  if (texts.some(text => String(text).includes('EMBER')) || flashes.includes('EMBER CHICKS!')) {
    throw new Error('Winterglass Magistrate should not use old Ember mechanics');
  }
  return 'winterglass-magistrate';
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
    for (const text of ['LANTERN WARD', 'LANTERN WARD BROKEN', 'ASTRAL BLIGHT', 'GRAVITY BRAND', 'ASTRAL TOLL', 'STARFALL LANTERNS', 'ECLIPSE BEAM', 'GRAVITY TOLL', 'LANTERN ORBIT']) {
      if (!texts.includes(text)) throw new Error(`Astral Lantern Warden missing ${text} callout`);
    }
    for (const label of ['STAR', 'ECLIPSE', 'GRAVITY']) {
      if (!labels.includes(label)) throw new Error(`Astral Lantern Warden missing ${label} warning label`);
    }
    if (texts.includes('AMBUSH PRIMED')) throw new Error('Astral Lantern Warden should not use old ambush callout');
    if (labels.includes('SMOKE')) throw new Error('Astral Lantern Warden should not use old smoke label');
  }
  if (boss.id === 13) {
    for (const text of ['WINTERGLASS CRYSTALS', 'WINTERGLASS BARRIER', 'WINTERGLASS BARRIER BROKEN', 'MAGISTRATE EXPOSED', 'FROSTBURN', 'RIME SURGE', 'GLACIAL CLEAVE', 'CRYSTAL OVERCHARGE', 'DEEP FREEZE', 'WHITEOUT PULSE', 'WHITEOUT', 'PERMAFROST RING', 'PERMAFROST', 'FROST SHOCK', 'FROSTBITE BRAND', 'FROZEN VOICE', 'RIME CURSE', 'ICE CHAIN']) {
      if (!texts.includes(text)) throw new Error(`Winterglass Magistrate missing ${text} callout`);
    }
    for (const label of ['MAGIC', 'PHYSICAL', 'RIME', 'GLACIAL', 'CRYSTAL', 'DEEP', 'BARRIER', 'VOICE', 'CURSE', 'RING', 'SHOCK', 'FROSTBURN', 'WHITEOUT']) {
      if (!labels.includes(label)) throw new Error(`Winterglass Magistrate missing ${label} ward warning label`);
    }
    if (texts.some(text => String(text).includes('EMBER'))) throw new Error('Winterglass Magistrate should not use old Ember damage text');
    if (ctx.flashes.some(flash => String(flash.text).includes('EMBER'))) throw new Error('Winterglass Magistrate should not use old Ember flash text');
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
  const stormNote = smokeStormboundVizier(ctx, boss);
  if (stormNote) notes.push(stormNote);
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

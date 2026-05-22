import { createWeatherParticles, drawWeatherForegroundOverlay, drawWeatherOverlay } from '../render/weather.js?v=20260522-warden-backline-soften';
import { createBattleStructuresRenderer } from '../render/battle-structures.js';

export function createBattleObjectiveRuntime(deps = {}) {
  const tickHz = deps.tickHz || 60;
  const ctx = deps.ctx;
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});
  const dist = typeof deps.distance === 'function'
    ? deps.distance
    : ((a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)));
  const rnd = typeof deps.randomRange === 'function'
    ? deps.randomRange
    : ((min, max) => min + Math.random() * (max - min));
  const fireProjectile = typeof deps.fireProjectile === 'function' ? deps.fireProjectile : () => {};
  const showFlash = typeof deps.showFlash === 'function' ? deps.showFlash : () => {};
  const emitParticle = typeof deps.emitParticle === 'function' ? deps.emitParticle : () => {};

  const structuresRenderer = createBattleStructuresRenderer({
    ctx,
    view: () => {
      const v = view();
      return {
        width: v.width,
        frame: v.frame,
        currentStage: v.currentStage,
        playerCastle: v.playerCastle,
        enemyCastle: v.enemyCastle,
        bossRef: v.bossRef,
        units: v.units,
      };
    },
    randomRange: rnd,
    emitParticle,
    dist,
    drawWithClashCamera: deps.drawWithClashCamera,
  });

  function updateCastle(castle) {
    const v = view();
    if (!castle || castle.hp <= 0) return;
    if (!castle.isKing) return;
    if (castle.cd > 0) castle.cd--;
    let target = null;
    let bestD = Infinity;
    for (const enemy of v.enemies || []) {
      if (enemy.hp <= 0) continue;
      const d = dist(castle, enemy);
      if (d < bestD) {
        bestD = d;
        target = enemy;
      }
    }
    if (target && bestD <= (castle.range || 200) && castle.cd <= 0) {
      castle.cd = castle.atkSpd || 60;
      (v.projectiles || []).push({
        x: castle.x,
        y: castle.y - 20,
        tx: target.x,
        ty: target.y,
        target,
        dmg: castle.dmg,
        speed: 6,
        from: castle,
        projType: 'normal',
        color: '#ffd700',
      });
    }
  }

  function updateTower(tower) {
    const v = view();
    if (!tower || tower.hp <= 0) return;
    if (tower.cd > 0) tower.cd--;
    if (tower.cd > 0) return;
    let target = null;
    let bestD = Infinity;
    for (const unit of v.units || []) {
      if (unit.hp <= 0) continue;
      const d = dist(tower, unit);
      if (d < tower.range && d < bestD) {
        bestD = d;
        target = unit;
      }
    }
    if (target) {
      fireProjectile(tower, target, tower.dmg, { projType: 'normal' });
      tower.cd = tower.atkSpd;
    }
  }

  function updateCrystalNode(node) {
    const v = view();
    if (!node) return;
    if (node.owner !== 1) {
      for (const unit of v.units || []) {
        if (unit.hp <= 0) continue;
        if (dist(unit, node) < unit.range + node.size && unit.cd <= 0) {
          node.hp -= unit.dmg * 0.3;
          if (node.hp <= 0) {
            node.owner = 1;
            node.hp = 300;
            node.maxHp = 300;
            node.produceT = 0;
            showFlash('CRYSTAL NODE CAPTURED!', '#9b59b6', 60);
            emitParticle(node.x, node.y, '#9b59b6', 24, 5);
            break;
          }
        }
      }
    }

    if (node.hp > 0 && node.owner !== 2) {
      for (const enemy of v.enemies || []) {
        if (enemy.hp <= 0) continue;
        if (dist(enemy, node) < (enemy.range || 40) + node.size && enemy.cd <= 0) {
          node.hp -= enemy.dmg * 0.3;
          if (node.hp <= 0) {
            node.owner = 2;
            node.hp = 300;
            node.maxHp = 300;
            node.produceT = 0;
            showFlash('CRYSTAL NODE LOST!', '#cc4444', 60);
            emitParticle(node.x, node.y, '#cc4444', 24, 5);
            break;
          }
        }
      }
    }

    if (node.owner === 1) {
      node.produceT++;
      if (node.produceT >= 1.5 * tickHz) {
        node.produceT = 0;
        if (typeof deps.addCrystal === 'function') deps.addCrystal(1);
        emitParticle(node.x, node.y, '#9b59b6', 6, 3);
      }
    }
  }

  function timedFieldEffectsContext() {
    const v = view();
    return {
      arena: v.arena,
      units: v.units,
      enemies: v.enemies,
      groundFx: v.groundFx,
      beamFx: v.beamFx,
      frame: v.frame,
      dealDamage: deps.dealDamage,
      addParticle: emitParticle,
      addDamageText: deps.addDamageText,
      addHealFx: deps.addHealEffect,
      showFlash,
      shake: deps.shake,
    };
  }

  function initWeather(weather) {
    const v = view();
    if (typeof deps.setWeatherParticles === 'function') {
      deps.setWeatherParticles(createWeatherParticles(weather, v.width, v.height, rnd));
    }
  }

  function drawWeather() {
    const v = view();
    if (!v.currentStage) return;
    drawWeatherOverlay(ctx, {
      weather: v.currentStage.weather,
      width: v.width,
      height: v.height,
      arenaTop: v.arenaTop,
      arenaBot: v.arenaBottom,
      particles: v.weatherParticles,
      astralStorm: v.arena && v.arena.astralStorm,
      bossRef: v.bossRef,
      frame: v.frame,
    });
  }
  function drawWeatherForeground() {
    const v = view();
    if (!v.currentStage) return;
    drawWeatherForegroundOverlay(ctx, {
      weather: v.currentStage.weather,
      width: v.width,
      height: v.height,
      arenaTop: v.arenaTop,
      arenaBot: v.arenaBottom,
      particles: v.weatherParticles,
      astralStorm: v.arena && v.arena.astralStorm,
      bossRef: v.bossRef,
      frame: v.frame,
    });
  }

  return {
    updateCastle,
    updateTower,
    updateCrystalNode,
    timedFieldEffectsContext,
    initWeather,
    drawWeather,
    drawWeatherForeground,
    drawPlayerKeep: (...args) => structuresRenderer.drawPlayerKeep(...args),
    drawCastle: (...args) => structuresRenderer.drawCastle(...args),
    drawCastleRaw: (...args) => structuresRenderer.drawCastleRaw(...args),
    drawTower: (...args) => structuresRenderer.drawTower(...args),
    drawCrystalNode: (...args) => structuresRenderer.drawCrystalNode(...args),
    drawCastleBanners: (...args) => structuresRenderer.drawCastleBanners(...args),
    drawBigHpBar: (...args) => structuresRenderer.drawBigHpBar(...args),
  };
}

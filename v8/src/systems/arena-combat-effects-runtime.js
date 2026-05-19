import { createUnitOverlaysRuntime } from '../render/unit-overlays-runtime.js?v=4bdd8c4-shield-vfx';
import { createProjectilesRuntime } from '../render/projectiles-runtime.js';
import { createGroundEffectsRuntime } from '../render/ground-effects-runtime.js?v=fefecd8-combat-vfx';
import { drawBombEffects } from '../render/bombs.js';
import { drawBeamEffects, drawFloatingNumbers, drawFlashText, drawParticleEffects, drawSignatureBanner } from '../render/effects.js';
import { fireArenaProjectile, lobArenaBomb, projectileColor, updateArenaBomb, updateArenaProjectile } from './combat-projectiles.js?v=fefecd8-combat-vfx';

export function createArenaCombatEffectsRuntime(deps = {}) {
  const ctx = deps.ctx;
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});
  const rnd = (...args) => deps.randomRange(...args);
  const emitParticle = (...args) => deps.emitParticle(...args);
  const addDamageText = (...args) => deps.addDamageText(...args);
  let lastAttackSfxFrame = 0;

  function fireProjectile(from, to, dmg, opts) {
    const v = view();
    lastAttackSfxFrame = fireArenaProjectile(from, to, dmg, opts || {}, {
      frame: v.frame,
      lastAttackSfxFrame,
      sound: deps.sound,
      spawnPlayerProjectileCastVfx: deps.spawnPlayerProjectileCastVfx,
      projectiles: v.projectiles,
      beamFx: v.beamFx,
      emitParticle,
    });
  }

  function lobBomb(from, tx, ty, dmg, radius, opts) {
    lobArenaBomb(view().bombs, from, tx, ty, dmg, radius, opts || {});
  }

  function updateProjectile(projectile) {
    const v = view();
    return updateArenaProjectile(projectile, {
      arenaTop: v.arenaTop,
      arenaBot: v.arenaBottom,
      width: v.width,
      frame: v.frame,
      randomRange: rnd,
      units: v.units,
      enemies: v.enemies,
      projectiles: v.projectiles,
      beamFx: v.beamFx,
      groundEffects: v.groundFx,
      dealDamage: deps.dealDamage,
      applyTrackedHeal: deps.applyTrackedHeal,
      applyBasicSecondHit: deps.applyBasicSecondHit,
      addGoldShield: deps.addGoldShield,
      emitParticle,
      addDamageText,
      shake: deps.shake,
    });
  }

  function updateBomb(bomb) {
    const v = view();
    return updateArenaBomb(bomb, {
      bombs: v.bombs,
      units: v.units,
      enemies: v.enemies,
      groundEffects: v.groundFx,
      randomRange: rnd,
      dealDamage: deps.dealDamage,
      emitParticle,
      addDamageText,
      shake: deps.shake,
    });
  }

  const projectilesRuntime = createProjectilesRuntime({
    ctx,
    view: () => {
      const v = view();
      return { projectiles: v.projectiles, frame: v.frame };
    },
    emitParticle,
    randomRange: rnd,
    unitSprites: deps.unitSprites,
    drawUnitSprite: deps.drawUnitSprite,
    projectileColor,
    camPoint: deps.camPoint,
    camDepthScaleAt: deps.camDepthScaleAt,
  });

  const unitOverlaysRuntime = createUnitOverlaysRuntime({
    ctx,
    view: () => {
      const v = view();
      return { units: v.units, frame: v.frame };
    },
    dist: deps.distance,
    randomRange: rnd,
    emitParticle,
  });

  const groundEffectsRuntime = createGroundEffectsRuntime({
    ctx,
    view: () => {
      const v = view();
      return { groundFx: v.groundFx, frame: v.frame };
    },
    randomRange: rnd,
    emitParticle,
    clampValue: deps.clampValue,
  });

  function drawBeamFx() {
    drawBeamEffects(ctx, { beams: view().beamFx, randomRange: rnd });
  }

  function drawBombs() {
    const v = view();
    drawBombEffects(ctx, { bombs: v.bombs, frame: v.frame, randomRange: rnd, emitParticle });
  }

  function drawParticles() {
    drawParticleEffects(ctx, { particles: view().particles });
  }

  function drawDmgNums() {
    const v = view();
    drawFloatingNumbers(ctx, { damageNumbers: v.damageNumbers, healingNumbers: v.healFx });
  }

  function drawFlash() {
    const v = view();
    const anchor = (v.playerCastle ? v.playerCastle.y : v.arenaBottom - 38) - 55;
    drawFlashText(ctx, { width: v.width, text: v.flashText, timer: v.flashTimer, color: v.flashColor, anchorY: anchor });
  }

  function drawSigBanner() {
    const v = view();
    const anchor = (v.playerCastle ? v.playerCastle.y : v.arenaBottom - 38) - 55;
    deps.setSignatureBanner(drawSignatureBanner(ctx, { width: v.width, banner: v.signatureBanner, anchorY: anchor }));
  }

  return {
    fireProjectile,
    lobBomb,
    updateProjectile,
    updateBomb,
    drawProjectiles: (...args) => projectilesRuntime.drawProjectiles(...args),
    drawBeamFx,
    drawUnitOverlays: (...args) => unitOverlaysRuntime.drawUnitOverlays(...args),
    drawBombs,
    drawParticles,
    drawGroundFx: (...args) => groundEffectsRuntime.drawGroundFx(...args),
    drawDmgNums,
    drawFlash,
    drawSigBanner,
  };
}

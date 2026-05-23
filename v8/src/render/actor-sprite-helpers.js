import {
  drawUnitSprite as renderDrawUnitSprite,
  pickAnimFrame as renderPickAnimFrame,
} from './sprites.js';
import { drawSummonSprite as renderDrawSummonSprite } from './summon-sprites.js';
import {
  drawEnemyVfxOver as renderDrawEnemyVfxOver,
  drawEnemyVfxUnder as renderDrawEnemyVfxUnder,
  drawPlayerAuraOver as renderDrawPlayerAuraOver,
  drawPlayerAuraUnder as renderDrawPlayerAuraUnder,
  playerVfxColor as renderPlayerVfxColor,
} from './actor-vfx.js?v=20260523-dragon-judgment';
import { projectileColor } from '../systems/combat-projectiles.js';

export function createActorSpriteHelpers({
  ctx,
  unitSprites,
  getFrame,
  getArena,
  randomRange = () => 0,
  emitParticle = () => {},
} = {}) {
  const frame = () => getFrame ? getFrame() : 0;

  function drawUnitSprite(img, x, y, unit, options) {
    const arena = getArena ? getArena() : null;
    return renderDrawUnitSprite(ctx, {
      img,
      x,
      y,
      unit,
      isWave: arena && arena.phase === 'wave',
      options: options || {},
    });
  }

  function pickAnimFrame(frames, ready, speed) {
    return renderPickAnimFrame(frames, ready, frame(), speed);
  }

  function drawSummonSprite(x, y, unit) {
    return renderDrawSummonSprite(ctx, {
      x,
      y,
      unit,
      unitSprites,
      frame: frame(),
      drawUnitSprite,
      randomRange,
      emitParticle,
    });
  }

  function playerVfxColor(unit) {
    return renderPlayerVfxColor(unit);
  }

  function drawPlayerAuraUnder(unit, x, y, size) {
    renderDrawPlayerAuraUnder(ctx, { unit, x, y, size, frame: frame() });
  }

  function drawPlayerAuraOver(unit, x, y, size) {
    renderDrawPlayerAuraOver(ctx, {
      unit,
      x,
      y,
      size,
      frame: frame(),
      emitParticle,
      randomRange,
    });
  }

  function drawEnemyVfxUnder(enemy, x, y, size) {
    renderDrawEnemyVfxUnder(ctx, { enemy, x, y, size, frame: frame() });
  }

  function drawEnemyVfxOver(enemy, x, y, size) {
    renderDrawEnemyVfxOver(ctx, {
      enemy,
      x,
      y,
      size,
      frame: frame(),
      emitParticle,
      randomRange,
    });
  }

  return {
    drawUnitSprite,
    pickAnimFrame,
    drawSummonSprite,
    projColor: projectileColor,
    playerVfxColor,
    drawPlayerAuraUnder,
    drawPlayerAuraOver,
    drawEnemyVfxUnder,
    drawEnemyVfxOver,
  };
}

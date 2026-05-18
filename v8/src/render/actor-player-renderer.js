import { createActorPlayerTankRenderer } from './actor-player-tank-renderer.js';
import { createActorPlayerDamageRenderer } from './actor-player-damage-renderer.js';
import { createActorPlayerSupportRenderer } from './actor-player-support-renderer.js';

export function createActorPlayerRenderer({
  ctx,
  getFrame,
  getArena,
  getUnits,
  randomRange,
  emitParticle,
  unitSpriteAssets,
  unitSprites,
  drawUnitSprite,
  unitSpriteOverlays = {},
} = {}) {
  let frame = 0, arena = null, units = [];
  const rnd = typeof randomRange === 'function' ? randomRange : ((min, max) => min + Math.random() * (max - min));
  const addP = typeof emitParticle === 'function' ? emitParticle : () => {};
  const _v8UnitSprites = unitSprites || {};
  const arena_drawUnitSprite = typeof drawUnitSprite === 'function' ? drawUnitSprite : () => false;

  function sync() {
    frame = getFrame ? getFrame() : frame;
    arena = getArena ? getArena() : arena;
    const nextUnits = getUnits ? getUnits() : units;
    units = Array.isArray(nextUnits) ? nextUnits : units;
  }

// All veggie draw functions
const drawFns={};

drawFns.drawTreant=function(x,y,u){
  const s=u.size;
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.5,s*0.12,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3a2210';ctx.fillRect(x-s*0.25,y-s*0.2,s*0.5,s*1.2);
  ctx.fillStyle=u.color;
  ctx.beginPath();ctx.arc(x,y-s*0.5,s*0.7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#44aa44';
  ctx.beginPath();ctx.arc(x-s*0.4,y-s*0.6,s*0.4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.4,y-s*0.6,s*0.4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.arc(x-s*0.15,y-s*0.35,2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.15,y-s*0.35,2,0,Math.PI*2);ctx.fill();
  if(frame%8===0)addP(x+rnd(-s*0.5,s*0.5),y-s*0.8,'#33cc33',1,2);
};

Object.assign(drawFns, createActorPlayerTankRenderer({
  ctx,
  getFrame,
  getArena,
  getUnits,
  randomRange,
  emitParticle,
  unitSpriteAssets,
  unitSprites,
  drawUnitSprite,
  unitSpriteOverlays,
}));

Object.assign(drawFns, createActorPlayerDamageRenderer({
  ctx,
  getFrame,
  getArena,
  getUnits,
  randomRange,
  emitParticle,
  unitSpriteAssets,
  unitSprites,
  drawUnitSprite,
  unitSpriteOverlays,
}));

Object.assign(drawFns, createActorPlayerSupportRenderer({
  ctx,
  getFrame,
  getArena,
  getUnits,
  randomRange,
  emitParticle,
  unitSpriteAssets,
  unitSprites,
  drawUnitSprite,
  unitSpriteOverlays,
}));

  const exportedDrawFns = {};
  for (const key of Object.keys(drawFns)) {
    exportedDrawFns[key] = (...args) => { sync(); return drawFns[key](...args); };
  }

  return { drawFns: exportedDrawFns };
}

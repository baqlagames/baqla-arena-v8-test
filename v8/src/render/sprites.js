import { SPRITE_BASE } from '../assets.js';

export const ARENA_SPRITE_BUILD_SCALE = 4.5;
export const ARENA_SPRITE_WAVE_SCALE = 7.5;

export function loadSprite(file, { base = SPRITE_BASE } = {}) {
  const img = new Image();
  img.src = base + file;
  return img;
}

export function loadUnitSpriteAssets(loadSpriteFn = loadSprite) {
  return {
    habaqMonk: loadSpriteFn('Habaq_Monk.png'),
    bakdounesDruid: loadSpriteFn('Bakdounes_Druid.png'),
    alibabaMinionCutout: loadSpriteFn('Alibaba_Minion_Cutout.png'),
    alibabaMinion: loadSpriteFn('Alibaba_Minion_Transparent.png'),
    jaafarMinion: loadSpriteFn('Jaafar_Minion_Cutout.png'),
    zaatarMinionWeak: loadSpriteFn('Zaatar_Minion_Weak.png'),
    zaatarMinionStrong: loadSpriteFn('Zaatar_Minion_Strong.png'),
  };
}

export function loadSpriteFrameSet(filePrefix, count, {
  base = SPRITE_BASE,
  extension = '.png',
  onReady,
} = {}) {
  const frames = [];
  const state = { frames, loaded: 0, ready: false };
  for (let i = 1; i <= count; i++) {
    const img = new Image();
    img.src = base + filePrefix + i + extension;
    img.onload = () => {
      state.loaded++;
      if (state.loaded >= count) {
        state.ready = true;
        if (onReady) onReady(state);
      }
    };
    frames.push(img);
  }
  return state;
}

export function recolorFelfelPoisonFrame(src) {
  const w = src.naturalWidth || src.width;
  const h = src.naturalHeight || src.height;
  if (!w || !h) return src;

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(src, 0, 0);
  try {
    const im = g.getImageData(0, 0, w, h);
    const d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const gg = d[i + 1];
      const b = d[i + 2];
      const a = d[i + 3];
      if (a < 8) continue;
      const isMagentaOrPink = r > 105 && b > 65 && gg < 145 && r > gg * 1.18 && b > gg * 1.05;
      if (isMagentaOrPink) {
        const lum = 0.30 * r + 0.59 * gg + 0.11 * b;
        d[i] = Math.max(22, Math.min(95, lum * 0.32));
        d[i + 1] = Math.max(135, Math.min(255, lum * 1.22));
        d[i + 2] = Math.max(20, Math.min(115, lum * 0.42));
      }
    }
    g.putImageData(im, 0, 0);
  } catch (_) {
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(45,210,70,0.32)';
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
  }
  return c;
}

export function refreshFelfelPoisonGreenFrames(poisonFrames, greenFrames) {
  greenFrames.length = 0;
  for (const img of poisonFrames) greenFrames.push(recolorFelfelPoisonFrame(img));
  return greenFrames.length === poisonFrames.length;
}

export function drawUnitSprite(ctx, {
  img,
  x,
  y,
  unit,
  isWave,
  options = {},
}) {
  const iw = img && (img.naturalWidth || img.width);
  const ih = img && (img.naturalHeight || img.height);
  if (!img || img.complete === false || !iw || !ih) return false;

  const s = unit.size || 16;
  const facing = unit.facing || 1;
  const sprH = s * (isWave
    ? (options.waveScale || ARENA_SPRITE_WAVE_SCALE)
    : (options.buildScale || ARENA_SPRITE_BUILD_SCALE));
  const sprW = sprH * (iw / ih);
  const anchor = options.anchor == null ? 0.48 : options.anchor;

  ctx.save();
  ctx.fillStyle = options.shadow || 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y + s * (isWave ? 1.05 : 0.85), s * 1.08, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  if (options.glow) {
    ctx.globalAlpha = options.glowAlpha || 0.18;
    ctx.fillStyle = options.glow;
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.55, s * 1.5, s * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  const drawX = Math.round(x);
  const drawY = Math.round(y);
  const drawW = Math.max(1, Math.round(sprW));
  const drawH = Math.max(1, Math.round(sprH));
  ctx.translate(drawX, drawY);
  if (facing < 0) ctx.scale(-1, 1);
  ctx.drawImage(img, Math.round(-drawW / 2), Math.round(-drawH * anchor), drawW, drawH);
  ctx.restore();
  return true;
}

export function pickAnimFrame(frames, ready, frame, speed = 10) {
  if (!ready || !frames || !frames.length) return null;
  return frames[Math.floor(frame / speed) % frames.length];
}

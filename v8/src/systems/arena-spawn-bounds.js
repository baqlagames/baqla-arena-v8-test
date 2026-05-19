import { ARENA_L, ARENA_R } from '../data/tuning.js?v=9d6b186-combat-feedback';

function finite(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

export function clampSpawnValue(value, min, max) {
  if (!Number.isFinite(value)) return min + (max - min) * 0.5;
  if (max < min) return min + (max - min) * 0.5;
  return Math.max(min, Math.min(max, value));
}

export function spawnAreaFromView({
  arenaLeft,
  arenaRight,
  arenaTop,
  arenaBottom,
  spawnLeft,
  spawnRight,
  fallbackWidth = 500,
} = {}) {
  const left = finite(spawnLeft, finite(arenaLeft, ARENA_L));
  const right = finite(spawnRight, finite(arenaRight, finite(fallbackWidth, 500) - ARENA_L));
  const top = finite(arenaTop, 0);
  const bottom = finite(arenaBottom, top + 760);
  return {
    left: Math.min(left, right),
    right: Math.max(left, right),
    top: Math.min(top, bottom),
    bottom: Math.max(top, bottom),
  };
}

export function clampActorToSpawnArea(actor, {
  left,
  right,
  top,
  bottom,
  topMargin = 44,
  bottomMargin = 44,
  sideMarginScale = 0.85,
} = {}) {
  if (!actor) return actor;
  const size = Math.max(6, actor.size || actor.rx || actor.ry || 16);
  const sideMargin = Math.max(24, size * sideMarginScale);
  const minX = finite(left, ARENA_L) + sideMargin;
  const maxX = finite(right, ARENA_R) - sideMargin;
  const minY = finite(top, 0) + Math.max(topMargin, size * 0.7);
  const maxY = finite(bottom, minY + 1) - Math.max(bottomMargin, size * 0.7);
  actor.x = clampSpawnValue(actor.x, minX, maxX);
  actor.y = clampSpawnValue(actor.y, minY, maxY);
  return actor;
}

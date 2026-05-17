import { clampActorToArena, clampActorToLeash, moveActorToward } from './combat-targeting.js';

export function createCombatBounds({
  arenaLeft,
  arenaRight,
  arenaTop,
  arenaBot,
  playerCastle,
  enemyCastle,
  leashForward,
  leashBack,
  leashSide,
}) {
  return {
    arenaLeft,
    arenaRight,
    arenaTop,
    arenaBot,
    playerCastle,
    enemyCastle,
    leashForward,
    leashBack,
    leashSide,
  };
}

export function moveCombatActorToward(actor, tx, ty, speed, bounds) {
  moveActorToward(actor, tx, ty, speed, bounds);
}

export function clampCombatActorToArena(actor, bounds) {
  clampActorToArena(actor, bounds);
}

export function clampCombatActorToLeash(actor, bounds) {
  clampActorToLeash(actor, bounds);
}

export function createTargetingView({ bounds, inArena, enemies, towers }) {
  return {
    ...bounds,
    inArena,
    enemies,
    enemyCastle: bounds.enemyCastle,
    towers,
  };
}

export function resolvePlayerUnitOverlaps({ isWaveActive, units, frame, bounds }) {
  if (!isWaveActive) return;
  const actors = units.filter(unit =>
    unit &&
    unit.isPlayer &&
    unit.hp > 0 &&
    !unit.isMinion &&
    !unit.isMirror &&
    !unit.isGhost &&
    !unit.untargetable &&
    !unit.meteorSlamActive &&
    !unit.dfaTimer
  );
  if (actors.length < 2) return;

  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i];
      for (let j = i + 1; j < actors.length; j++) {
        const b = actors[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distance = Math.hypot(dx, dy);
        const minGap = Math.max(32, ((a.size || 16) + (b.size || 16)) * 0.92);
        if (distance >= minGap) continue;
        if (distance < 0.01) {
          const angle = (i * 2.399 + j * 1.137 + frame * 0.017);
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distance = 1;
        }
        const nx = dx / distance;
        const ny = dy / distance;
        const push = (minGap - distance) * 0.38;
        a.x -= nx * push;
        a.y -= ny * push * 0.72;
        b.x += nx * push;
        b.y += ny * push * 0.72;
        clampActorToLeash(a, bounds);
        clampActorToLeash(b, bounds);
      }
    }
  }
}

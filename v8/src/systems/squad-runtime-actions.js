import { PLAYER_UNITS } from '../data/units.js';
import { ARENA_UNIT_BRANCHES } from '../data/passives.js';
import {
  canPlaceSquadUnit,
  placeSquadUnit,
  sellSquadCell,
  upgradeSquadCell,
} from './squad-actions.js';

export function canPlaceArenaSquadUnit({ pick, gold, arenaState, roleRoot }) {
  return canPlaceSquadUnit({ pick, gold, arenaState, roleRoot });
}

export function placeArenaSquadUnit({
  cell,
  pick,
  gold,
  arenaState,
  roleRoot,
  onStageChallengeUsage,
  respawnSquad,
  sound,
}) {
  const result = placeSquadUnit({ cell, pick, gold, arenaState, roleRoot });
  if (!result.ok) return result;
  if (typeof onStageChallengeUsage === 'function') onStageChallengeUsage();
  if (typeof respawnSquad === 'function') respawnSquad();
  if (sound && typeof sound.purchase === 'function') sound.purchase();
  return result;
}

export function upgradeArenaSquadCell({
  cell,
  branchPick,
  pathPick,
  gold,
  arenaState,
  pathById,
  applyRolePathToCell,
  respawnSquad,
  effects,
}) {
  const result = upgradeSquadCell({
    cell,
    branchPick,
    pathPick,
    gold,
    arenaState,
    pathById,
    applyRolePathToCell,
  });
  if (!result.ok) return result;

  if (typeof respawnSquad === 'function') respawnSquad();
  const unit = arenaState.cells[cell.key] && arenaState.cells[cell.key].unitRef;
  if (unit) playSquadUpgradeEffect(unit, result.cellState, effects);
  return result;
}

export function sellArenaSquadCell({ cell, gold, arenaState, roleRoot }) {
  return sellSquadCell({ cell, gold, arenaState, roleRoot });
}

export function playSquadUpgradeEffect(unit, cellState, effects = {}) {
  const {
    particles,
    groundEffects,
    randomRange,
    emitParticle,
    addDamageText,
    addHealEffect,
    showFlash,
    sound,
    shake,
  } = effects;
  const rnd = typeof randomRange === 'function' ? randomRange : ((min, max) => min + Math.random() * (max - min));
  const addP = typeof emitParticle === 'function' ? emitParticle : (() => {});
  const addDmg = typeof addDamageText === 'function' ? addDamageText : (() => {});
  const addHealFx = typeof addHealEffect === 'function' ? addHealEffect : (() => {});
  const fxGround = groundEffects || [];
  const fxParticles = particles || [];

  for (let i = 0; i < 36; i++) addP(unit.x, unit.y, '#ffd700', 1, 5);
  for (let i = 0; i < 18; i++) addP(unit.x, unit.y, '#ffffff', 1, 4);

  for (let i = 0; i < 14; i++) {
    if (fxParticles.length < 180) {
      fxParticles.push({
        x: unit.x + rnd(-3, 3),
        y: unit.y,
        vx: rnd(-0.4, 0.4),
        vy: rnd(-3.5, -2.0),
        life: 1,
        color: '#ffd700',
        sz: rnd(2.5, 4),
      });
    }
  }
  for (let i = 0; i < 8; i++) {
    if (fxParticles.length < 180) {
      fxParticles.push({
        x: unit.x + rnd(-2, 2),
        y: unit.y - 2,
        vx: rnd(-0.3, 0.3),
        vy: rnd(-4, -2.5),
        life: 1,
        color: '#ffffff',
        sz: rnd(2, 3),
      });
    }
  }

  fxGround.push({ x: unit.x, y: unit.y, r: 0, maxR: 110, life: 0.55, color: '#ffd700' });
  fxGround.push({ x: unit.x, y: unit.y, r: 0, maxR: 140, life: 0.30, color: '#ffffff' });
  addDmg(unit.x, unit.y - unit.size - 12, 'LEVEL ' + cellState.level + '!', '#ffd700');
  if (typeof shake === 'function') shake(8);

  unit.levelUpPunch = 20;
  addHealFx(unit.x, unit.y, Math.round(unit.maxHp));
  for (let i = 0; i < 10; i++) {
    addP(unit.x + rnd(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size, '#3aff66', 1, 3);
  }

  const name = cellState.unitIdx === 99
    ? 'VODKA'
    : (cellState.branch && ARENA_UNIT_BRANCHES[cellState.unitIdx] && ARENA_UNIT_BRANCHES[cellState.unitIdx][cellState.branch]
      ? ARENA_UNIT_BRANCHES[cellState.unitIdx][cellState.branch].name
      : ((PLAYER_UNITS[cellState.unitIdx] && PLAYER_UNITS[cellState.unitIdx].name) || 'UNIT'));
  if (typeof showFlash === 'function') showFlash('LEVEL UP - ' + name.toUpperCase() + ' L' + cellState.level, '#ffd700', 60);
  if (sound && typeof sound.levelUp === 'function') sound.levelUp();
}

import {
  ARENA_GOLD_COSTS,
  ARENA_MAX_UNIT_LEVEL,
  ARENA_SELL_RATIO,
  ARENA_UPGRADE_COSTS,
  ARENA_UPGRADE_MULT_BY_BRANCH,
  ARENA_UPGRADE_MULT_BY_UNIT,
} from '../data/tuning.js?v=9d6b186-combat-feedback';

export function arena_isCapstoneLevel(level) {
  return (level || 1) >= ARENA_MAX_UNIT_LEVEL;
}

export function arena_unitGoldCost(unitIdx) {
  if (unitIdx === 99) return ARENA_GOLD_COSTS[14] || 150;
  return ARENA_GOLD_COSTS[unitIdx] || 0;
}

export function arena_upgradeMult(cell) {
  if (!cell) return 1.0;
  const key = cell.unitIdx === 99 ? 99 : cell.unitIdx;
  const unitMult = ARENA_UPGRADE_MULT_BY_UNIT[key] || 1.0;
  const branchKey = cell.branch ? (cell.unitIdx + '_' + cell.branch) : null;
  const branchMult = branchKey ? ARENA_UPGRADE_MULT_BY_BRANCH[branchKey] : null;
  return branchMult != null ? Math.max(unitMult, branchMult) : unitMult;
}

export function arena_upgradeCostFor(cell) {
  if (!cell || cell.level >= ARENA_MAX_UNIT_LEVEL) return 0;
  return Math.round(ARENA_UPGRADE_COSTS[cell.level] * arena_upgradeMult(cell));
}

export function arena_pathUpgradeCost(cell, path) {
  const tmp = path ? { ...cell, unitIdx: path.unitIdx, branch: path.branch || null, pathId: path.id } : cell;
  return Math.max(1, Math.round(arena_upgradeCostFor(tmp)));
}

export function placementCostForPick(pick, roleRoot) {
  const root = typeof pick === 'string' ? roleRoot(pick) : null;
  if (typeof pick === 'string' && !root) return null;
  const unitIdx = root ? root.unitIdx : pick;
  return {
    root,
    unitIdx,
    cost: root ? root.cost : arena_unitGoldCost(unitIdx),
  };
}

export function canPlaceSquadPick({ pick, gold, cells, roleRoot }) {
  const placement = placementCostForPick(pick, roleRoot);
  if (!placement) return false;
  if (placement.unitIdx === 99) {
    for (const k in cells) {
      if (cells[k] && cells[k].unitIdx === 99) return false;
    }
  }
  return gold >= placement.cost;
}

export function sellRefundForCell(cell, roleRoot) {
  if (!cell) return 0;
  const root = cell.roleId ? roleRoot(cell.roleId) : null;
  let invested = root ? root.cost : arena_unitGoldCost(cell.unitIdx);
  const mult = arena_upgradeMult(cell);
  for (let i = 1; i < cell.level; i++) invested += Math.round(ARENA_UPGRADE_COSTS[i] * mult);
  return Math.round(invested * ARENA_SELL_RATIO);
}

import { ARENA_MAX_UNIT_LEVEL } from '../data/tuning.js';
import { ARENA_UNIT_BRANCHES } from '../data/passives.js';
import {
  arena_upgradeCostFor,
  canPlaceSquadPick,
  placementCostForPick,
  sellRefundForCell,
} from './squad-economy.js';

export function canPlaceSquadUnit({ pick, gold, arenaState, roleRoot }) {
  return canPlaceSquadPick({ pick, gold, cells: arenaState.cells, roleRoot });
}

export function placeSquadUnit({ cell, pick, gold, arenaState, roleRoot }) {
  if (!canPlaceSquadUnit({ pick, gold, arenaState, roleRoot })) return { ok: false, gold };
  const placement = placementCostForPick(pick, roleRoot);
  if (!placement) return { ok: false, gold };

  const { root, unitIdx, cost } = placement;
  arenaState.cells[cell.key] = {
    unitIdx,
    col: cell.col,
    row: cell.row,
    level: 1,
    minionsSpawned: false,
    branch: null,
    roleId: root ? root.id : null,
    pathId: null,
    pathName: null,
  };

  return { ok: true, gold: gold - cost, cellState: arenaState.cells[cell.key] };
}

export function upgradeSquadCell({
  cell,
  branchPick,
  pathPick,
  gold,
  arenaState,
  pathById,
  applyRolePathToCell,
}) {
  const cellState = arenaState.cells[cell.key];
  if (!cellState || cellState.level >= ARENA_MAX_UNIT_LEVEL) return { ok: false, gold };

  const pathDef = pathPick && cellState.roleId ? pathById(cellState.roleId, pathPick) : null;
  const costCell = pathDef
    ? { ...cellState, unitIdx: pathDef.unitIdx, branch: pathDef.branch || null, pathId: pathDef.id }
    : (branchPick && cellState.level === 2 && !cellState.branch ? { ...cellState, branch: branchPick } : cellState);
  const cost = Math.max(1, Math.round(arena_upgradeCostFor(costCell)));
  if (gold < cost) return { ok: false, gold };

  if (pathDef && cellState.level === 2 && !cellState.pathId) {
    applyRolePathToCell(cellState, pathDef);
  }

  if (
    !pathDef &&
    branchPick &&
    cellState.level === 2 &&
    !cellState.branch &&
    ARENA_UNIT_BRANCHES[cellState.unitIdx] &&
    ARENA_UNIT_BRANCHES[cellState.unitIdx][branchPick]
  ) {
    cellState.branch = branchPick;
  }

  cellState.level++;
  return { ok: true, gold: gold - cost, cellState, pathDef, cost };
}

export function sellSquadCell({ cell, gold, arenaState, roleRoot }) {
  const cellState = arenaState.cells[cell.key];
  if (!cellState) return { ok: false, gold };

  const refund = sellRefundForCell(cellState, roleRoot);
  if (cellState.unitRef) {
    cellState.unitRef.hp = 0;
    cellState.unitRef.removed = true;
  }
  delete arenaState.cells[cell.key];
  return { ok: true, gold: gold + refund, refund };
}

import { pointInRectObject } from './input.js';

export function resolveManagePanelAction(point, rects = {}) {
  if (pointInRectObject(point, rects.upgrade)) return { type: 'upgrade' };
  if (pointInRectObject(point, rects.back)) return { type: 'back' };

  for (const specRect of rects.specs || []) {
    if (pointInRectObject(point, specRect)) {
      return { type: 'selectSpec', specId: specRect.specId, name: specRect.name };
    }
  }

  for (const pathRect of rects.paths || []) {
    if (pointInRectObject(point, pathRect)) {
      return { type: 'choosePath', pathId: pathRect.pathId, name: pathRect.name };
    }
  }

  if (pointInRectObject(point, rects.branchA)) return { type: 'chooseBranch', branch: 'a' };
  if (pointInRectObject(point, rects.branchB)) return { type: 'chooseBranch', branch: 'b' };
  if (pointInRectObject(point, rects.sell)) return { type: 'sell' };
  if (pointInRectObject(point, rects.close)) return { type: 'close' };

  return { type: 'none' };
}

export function createManagePanelInputHandler(ctx) {
  function selectedCell(arena) {
    return arena && arena.managePanelCell ? arena.managePanelCell : null;
  }

  function handleClick(point) {
    const arena = ctx.arenaState();
    const cell = selectedCell(arena);
    if (!arena || !cell) return;
    const action = resolveManagePanelAction(point, arena._mgrRects || {});

    if (action.type === 'upgrade') {
      if (ctx.upgradeCell(cell)) {
        arena._mgrSelectedSpec = null;
        ctx.showFlash('Upgraded', '#ffd700', 45);
      }
      return;
    }
    if (action.type === 'back') {
      arena._mgrSelectedSpec = null;
      arena._mgrScroll = 0;
      return;
    }
    if (action.type === 'selectSpec') {
      const c = arena.cells[cell.key];
      const spec = c && ctx.specById(c.roleId, action.specId);
      if (!spec) return;
      arena._mgrSelectedSpec = spec.id;
      arena._mgrScroll = 0;
      return;
    }
    if (action.type === 'choosePath') {
      if (ctx.upgradeCell(cell, null, action.pathId)) {
        arena._mgrSelectedSpec = null;
        ctx.showFlash('CHOSE PATH - ' + action.name.toUpperCase(), '#cc99ff', 75);
      }
      return;
    }
    if (action.type === 'chooseBranch' && action.branch === 'a') {
      const c = arena.cells[cell.key];
      const branch = c && ctx.unitBranches[c.unitIdx] && ctx.unitBranches[c.unitIdx].a;
      if (ctx.upgradeCell(cell, 'a')) {
        ctx.showFlash('CHOSE PATH - ' + (branch ? branch.name.toUpperCase() : 'BRANCH A'), '#3a8eff', 75);
      }
      return;
    }
    if (action.type === 'chooseBranch' && action.branch === 'b') {
      const c = arena.cells[cell.key];
      const branch = c && ctx.unitBranches[c.unitIdx] && ctx.unitBranches[c.unitIdx].b;
      if (ctx.upgradeCell(cell, 'b')) {
        ctx.showFlash('CHOSE PATH - ' + (branch ? branch.name.toUpperCase() : 'BRANCH B'), '#c84acc', 75);
      }
      return;
    }
    if (action.type === 'sell') {
      if (ctx.sellCell(cell)) ctx.showFlash('Sold', '#aa3322', 45);
      arena.managePanelCell = null;
      arena._mgrSelectedSpec = null;
      return;
    }
    if (action.type === 'close') {
      arena.managePanelCell = null;
      arena._mgrSelectedSpec = null;
    }
  }

  return { handleClick };
}

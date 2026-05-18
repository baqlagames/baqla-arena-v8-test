import { createPaintedArenaGrid } from './arena-painted-grid.js';

export function createArenaGridRuntime(deps = {}) {
  const layoutState = deps.layoutState || {};
  const gridCols = deps.gridCols || 1;
  const gridRows = deps.gridRows || 1;
  let gridX = Number.isFinite(layoutState.gridX) && layoutState.gridX > 0 ? layoutState.gridX : deps.gridX;
  let gridW = Number.isFinite(layoutState.gridW) && layoutState.gridW > 0 ? layoutState.gridW : deps.gridW;
  let cellW = Number.isFinite(layoutState.cellW) && layoutState.cellW > 0 ? layoutState.cellW : deps.cellW;
  let gridY = Number.isFinite(layoutState.gridY) ? layoutState.gridY : 200;
  let cellH = Number.isFinite(layoutState.cellH) && layoutState.cellH > 0 ? layoutState.cellH : 70;

  const paintedArenaGrid = createPaintedArenaGrid({
    getWidth: deps.getWidth,
    getHeight: deps.getHeight,
    getArenaTop: deps.getArenaTop,
    getArenaBot: deps.getArenaBot,
    getGridCols: () => gridCols,
    getGridRows: () => gridRows,
    isActive: deps.isPaintedActive,
  });

  function layoutValues() {
    return { gridX, gridW, cellW, gridY, cellH };
  }

  function paintedPlacementActive() {
    return paintedArenaGrid.isActive();
  }

  function enemySpawnY() {
    return paintedArenaGrid.enemySpawnY();
  }

  function recomputeGrid() {
    const metrics = paintedArenaGrid.gridMetrics();
    const { topWorld, bottomWorld, leftTop, rightTop, leftBottom, rightBottom } = metrics;
    gridY = topWorld;
    cellH = (bottomWorld - topWorld) / gridRows;
    gridX = (leftTop + leftBottom) / 2;
    gridW = ((rightTop + rightBottom) / 2) - gridX;
    cellW = gridW / gridCols;
    if (typeof deps.syncLayoutState === 'function') deps.syncLayoutState();
  }

  function cellCenterWorld(col, row) {
    if (paintedPlacementActive()) return paintedArenaGrid.cellWorldPoint(col, row);
    return { x: gridX + col * cellW + cellW / 2, y: gridY + row * cellH + cellH / 2 };
  }

  function cellCenterScreen(col, row) {
    if (paintedPlacementActive()) return paintedArenaGrid.cellScreenPoint(col, row);
    const { x, y } = cellCenterWorld(col, row);
    if (typeof deps.hasClashCamera === 'function' && deps.hasClashCamera()) return deps.camPoint(x, y);
    return { x, y };
  }

  function xyToCell(x, y) {
    if (paintedPlacementActive()) return paintedArenaGrid.xyToCell(x, y);
    const world = deps.screenToWorldPoint ? deps.screenToWorldPoint(x, y) : { x, y };
    x = world.x;
    y = world.y;
    if (x < gridX || x > gridX + gridW) return null;
    if (y < gridY || y > gridY + gridRows * cellH) return null;
    const col = Math.floor((x - gridX) / cellW);
    const row = Math.floor((y - gridY) / cellH);
    if (col < 0 || col >= gridCols || row < 0 || row >= gridRows) return null;
    return { col, row, key: row * gridCols + col };
  }

  function laneBounds() {
    const width = deps.getWidth ? deps.getWidth() : 500;
    const pad = Math.max(8, cellW * 0.18);
    const left = gridX + pad;
    const right = gridX + gridW - pad;
    if (!Number.isFinite(left) || !Number.isFinite(right) || right - left < 120) {
      return { left: deps.arenaLeft, right: deps.arenaRight };
    }
    return {
      left: Math.max(8, left),
      right: Math.min(width - 8, right),
    };
  }

  function playtestGrid() {
    return { x: gridX, y: gridY, w: gridW, cellW, cellH, cols: gridCols, rows: gridRows };
  }

  return {
    layoutValues,
    paintedPlacementActive,
    enemySpawnY,
    recomputeGrid,
    cellCenterWorld,
    cellCenterScreen,
    xyToCell,
    laneBounds,
    playtestGrid,
    cellScreenQuad: (...args) => paintedArenaGrid.cellScreenQuad(...args),
    cellScreenPoint: (...args) => paintedArenaGrid.cellScreenPoint(...args),
    gridX: () => gridX,
    gridY: () => gridY,
    gridW: () => gridW,
    cellW: () => cellW,
    cellH: () => cellH,
  };
}

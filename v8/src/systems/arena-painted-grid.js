const IMAGE_W = 1086;
const IMAGE_H = 1448;
const BUILD_TOP = 748;
const BUILD_BOTTOM = 1124;
const BUILD_LEFT_TOP = 180;
const BUILD_RIGHT_TOP = 914;
const BUILD_LEFT_BOTTOM = 149;
const BUILD_RIGHT_BOTTOM = 950;
const ENEMY_SPAWN_Y = 328;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const pi = poly[i];
    const pj = poly[j];
    if (((pi.y > y) !== (pj.y > y)) && (x < (pj.x - pi.x) * (y - pi.y) / ((pj.y - pi.y) || 1e-6) + pi.x)) inside = !inside;
  }
  return inside;
}

export function createPaintedArenaGrid({
  getWidth,
  getHeight,
  getArenaTop,
  getArenaBot,
  getGridCols,
  getGridRows,
  isActive,
} = {}) {
  const width = () => getWidth ? getWidth() : 500;
  const height = () => getHeight ? getHeight() : 1000;
  const arenaTop = () => getArenaTop ? getArenaTop() : 88;
  const arenaBot = () => getArenaBot ? getArenaBot() : 820;
  const gridCols = () => getGridCols ? getGridCols() : 6;
  const gridRows = () => getGridRows ? getGridRows() : 3;

  function active() {
    try { return !!(isActive && isActive()); } catch (_) { return false; }
  }

  function imageScale() {
    return height() / IMAGE_H;
  }

  function imageX() {
    return (width() - IMAGE_W * imageScale()) / 2;
  }

  function sourceToScreenX(x) {
    return imageX() + x * imageScale();
  }

  function sourceToScreenY(y) {
    return y * imageScale();
  }

  function projectedWorldYForScreenY(screenY) {
    const top = arenaTop() + 28;
    const bot = arenaBot() - 18;
    const t = Math.pow(Math.max(0, Math.min(1, (screenY - top) / Math.max(1, bot - top))), 1 / 1.18);
    return top + t * (bot - top);
  }

  function gridWidthScaleAt(y) {
    const top = arenaTop() + 28;
    const bot = arenaBot() - 18;
    const t = Math.max(0, Math.min(1, (y - top) / Math.max(1, bot - top)));
    return 0.76 + 0.27 * t;
  }

  function projectedWorldXForScreenX(screenX, worldY) {
    const s = gridWidthScaleAt(worldY);
    return width() / 2 + (screenX - width() / 2) / Math.max(0.01, s);
  }

  function worldYForSourceY(sourceY) {
    return projectedWorldYForScreenY(sourceToScreenY(sourceY));
  }

  function sourceToWorldPoint(x, y) {
    const worldY = worldYForSourceY(y);
    return { x: projectedWorldXForScreenX(sourceToScreenX(x), worldY), y: worldY };
  }

  function buildEdgeAt(rowT) {
    return {
      y: lerp(BUILD_TOP, BUILD_BOTTOM, rowT),
      left: lerp(BUILD_LEFT_TOP, BUILD_LEFT_BOTTOM, rowT),
      right: lerp(BUILD_RIGHT_TOP, BUILD_RIGHT_BOTTOM, rowT),
    };
  }

  function buildSourcePoint(colT, rowT) {
    const edge = buildEdgeAt(rowT);
    return { x: lerp(edge.left, edge.right, colT), y: edge.y };
  }

  function cellSourceQuad(col, row) {
    const cols = gridCols();
    const rows = gridRows();
    const c0 = col / cols;
    const c1 = (col + 1) / cols;
    const r0 = row / rows;
    const r1 = (row + 1) / rows;
    return [
      buildSourcePoint(c0, r0),
      buildSourcePoint(c1, r0),
      buildSourcePoint(c1, r1),
      buildSourcePoint(c0, r1),
    ];
  }

  function cellScreenQuad(col, row) {
    return cellSourceQuad(col, row).map(p => ({
      x: sourceToScreenX(p.x),
      y: sourceToScreenY(p.y),
    }));
  }

  function cellScreenPoint(col, row) {
    const p = buildSourcePoint((col + 0.5) / gridCols(), (row + 0.5) / gridRows());
    return { x: sourceToScreenX(p.x), y: sourceToScreenY(p.y) };
  }

  function cellWorldPoint(col, row) {
    const p = buildSourcePoint((col + 0.5) / gridCols(), (row + 0.5) / gridRows());
    return sourceToWorldPoint(p.x, p.y);
  }

  function enemySpawnY() {
    return worldYForSourceY(ENEMY_SPAWN_Y);
  }

  function gridMetrics() {
    const topWorld = worldYForSourceY(BUILD_TOP);
    const bottomWorld = worldYForSourceY(BUILD_BOTTOM);
    const leftTop = projectedWorldXForScreenX(sourceToScreenX(BUILD_LEFT_TOP), topWorld);
    const rightTop = projectedWorldXForScreenX(sourceToScreenX(BUILD_RIGHT_TOP), topWorld);
    const leftBottom = projectedWorldXForScreenX(sourceToScreenX(BUILD_LEFT_BOTTOM), bottomWorld);
    const rightBottom = projectedWorldXForScreenX(sourceToScreenX(BUILD_RIGHT_BOTTOM), bottomWorld);
    return { topWorld, bottomWorld, leftTop, rightTop, leftBottom, rightBottom };
  }

  function xyToCell(x, y) {
    const scale = imageScale();
    const sourceX = (x - imageX()) / Math.max(0.01, scale);
    const sourceY = y / Math.max(0.01, scale);
    const cols = gridCols();
    const rows = gridRows();
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (pointInPoly(sourceX, sourceY, cellSourceQuad(col, row))) {
          return { col, row, key: row * cols + col };
        }
      }
    }
    return null;
  }

  return {
    isActive: active,
    cellScreenQuad,
    cellScreenPoint,
    cellWorldPoint,
    enemySpawnY,
    gridMetrics,
    xyToCell,
  };
}

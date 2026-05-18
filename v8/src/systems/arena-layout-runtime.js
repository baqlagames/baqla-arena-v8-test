export function createArenaLayoutRuntime(deps = {}) {
  const layoutState = deps.layoutState || {};
  const arenaTopBase = deps.arenaTopBase || 0;
  const getWindow = deps.getWindow || (() => window);
  const getLayout = typeof deps.getLayout === 'function' ? deps.getLayout : () => ({});
  const setLayout = typeof deps.setLayout === 'function' ? deps.setLayout : () => {};
  const recomputeGrid = typeof deps.recomputeGrid === 'function' ? deps.recomputeGrid : () => {};
  const reanchor = typeof deps.reanchor === 'function' ? deps.reanchor : () => {};

  function sync(values = getLayout()) {
    layoutState.canvasDpr = values.canvasDpr;
    layoutState.width = values.width;
    layoutState.height = values.height;
    layoutState.arenaTop = values.arenaTop;
    layoutState.arenaBottom = values.arenaBottom;
    layoutState.deployTop = values.deployTop;
    layoutState.heroButton = values.heroButton;
    layoutState.gridX = values.gridX;
    layoutState.gridW = values.gridW;
    layoutState.cellW = values.cellW;
    layoutState.gridY = values.gridY;
    layoutState.cellH = values.cellH;
  }

  function applyRenderQuality() {
    const ctx = deps.ctx;
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if ('fontKerning' in ctx) ctx.fontKerning = 'normal';
    if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
  }

  function computeCanvasDims() {
    const win = getWindow();
    const winRatio = win.innerHeight / Math.max(win.innerWidth, 1);
    const ratio = Math.max(1.33, Math.min(2.17, winRatio));
    return { w: 500, h: Math.round(500 * ratio) };
  }

  function applyCanvasDims(renderScale) {
    const canvas = deps.canvas;
    const ctx = deps.ctx;
    const win = getWindow();
    const d = computeCanvasDims();
    const dpr = Math.max(1, Math.min(4, renderScale || win.devicePixelRatio || 1));
    const next = {
      ...getLayout(),
      canvasDpr: dpr,
      width: d.w,
      height: d.h,
      arenaBottom: d.h - 68,
      deployTop: Math.round((arenaTopBase + (d.h - 68)) / 2),
    };
    next.heroButton = next.heroButton || { x: d.w - 44, y: d.h - 46, r: 30 };
    next.heroButton.x = d.w - 44;
    next.heroButton.y = d.h - 46;
    setLayout(next);
    if (canvas && ctx) {
      canvas.width = Math.round(d.w * dpr);
      canvas.height = Math.round(d.h * dpr);
      canvas.style.width = d.w + 'px';
      canvas.style.height = d.h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      applyRenderQuality();
    }
    recomputeGrid();
    sync();
    reanchor();
  }

  function resize() {
    const canvas = deps.canvas;
    const win = getWindow();
    const d = computeCanvasDims();
    const scale = Math.min(win.innerWidth / d.w, win.innerHeight / d.h) * 0.98;
    const cssW = Math.max(1, Math.round(d.w * scale));
    const cssH = Math.max(1, Math.round(d.h * scale));
    applyCanvasDims((win.devicePixelRatio || 1) * (cssW / d.w));
    if (canvas) {
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
    }
  }

  return {
    sync,
    applyRenderQuality,
    computeCanvasDims,
    applyCanvasDims,
    resize,
  };
}

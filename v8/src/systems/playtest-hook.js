export function installArenaPlaytestHook(ctx) {
  if (typeof globalThis === 'undefined' || !globalThis.location) return;
  const params = new URLSearchParams(globalThis.location.search || '');
  if (!params.has('playtest')) return;

  const safeClone = value => {
    try { return JSON.parse(JSON.stringify(value || {})); } catch (_) { return {}; }
  };

  function cellSummary(arena) {
    const out = [];
    for (const key of Object.keys(arena.cells || {})) {
      const cell = arena.cells[key];
      out.push({
        key,
        unitIdx: cell.unitIdx,
        roleId: cell.roleId || null,
        pathId: cell.pathId || null,
        specId: cell.specId || null,
        branch: cell.branch || null,
        level: cell.level || 1
      });
    }
    return out;
  }

  function clearModalState(arena) {
    arena.pickerOpen = false;
    arena.pickerCell = null;
    arena.managePanelCell = null;
    arena._mgrSelectedSpec = null;
  }

  globalThis.__baqlaArenaV8Playtest = {
    summary() {
      const v = ctx.view();
      const arena = v.arena;
      return {
        state: v.state,
        phase: arena && arena.phase,
        width: v.width,
        height: v.height,
        gold: v.gold,
        maxUnitLevel: v.maxUnitLevel,
        pickerOpen: !!arena.pickerOpen,
        pickerCell: arena.pickerCell ? safeClone(arena.pickerCell) : null,
        pickerRects: safeClone(arena._pickerRects || []),
        managePanelCell: arena.managePanelCell ? safeClone(arena.managePanelCell) : null,
        manageRects: safeClone(arena._mgrRects || {}),
        cells: cellSummary(arena),
        grid: safeClone(ctx.grid())
      };
    },
    setGold(value) {
      ctx.setGold(Math.max(0, Math.round(value || 0)));
      return ctx.view().gold;
    },
    startStage(idx = 0) {
      const nextIdx = Math.max(0, Math.min(ctx.stageCount() - 1, idx | 0));
      const arena = ctx.view().arena;
      arena.cells = {};
      ctx.setCurrentStageIdx(nextIdx);
      ctx.setCurrentStage(nextIdx);
      ctx.startStage(nextIdx);
      arena.cells = {};
      clearModalState(arena);
      return this.summary();
    },
    cellCenter(col, row) {
      return ctx.cellCenter(col, row);
    }
  };
}

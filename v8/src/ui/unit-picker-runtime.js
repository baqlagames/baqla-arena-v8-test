import { drawUnitPlacementPicker, unitPickerMaxScroll } from './unit-picker.js';

export function createUnitPickerRuntime({
  ctx,
  playerUnits,
  vodka,
  attackTypeByUnit,
  rootOrder,
  roleRoot,
  canPlace,
  unitGoldCost,
  getStats,
  placeUnit,
  inRect,
  showFlash,
  getTouchAccumY,
  setTouchAccumY,
  view,
} = {}) {
  function currentView() {
    return typeof view === 'function' ? view() || {} : {};
  }

  function cardCount() {
    const roots = typeof rootOrder === 'function' ? rootOrder() : [];
    return roots.length + 1;
  }

  function maxScroll() {
    const v = currentView();
    return unitPickerMaxScroll(v.width || 500, v.height || 1000, cardCount());
  }

  function deck() {
    return playerUnits.map((_, idx) => idx);
  }

  function entries() {
    const roots = typeof rootOrder === 'function' ? rootOrder() : [];
    const result = roots.map(id => {
      const root = roleRoot(id);
      const def = { ...playerUnits[root.unitIdx], ...root };
      return {
        pick: id,
        unitIdx: root.unitIdx,
        label: def.name,
        def,
        cost: root.cost,
        canPlace: canPlace(id),
        attackType: attackTypeByUnit[root.unitIdx] || 'physical',
        baseStats: getStats(def, 1),
      };
    });
    result.push({
      pick: 99,
      unitIdx: 99,
      label: vodka.name,
      def: vodka,
      cost: unitGoldCost(99),
      canPlace: canPlace(99),
      attackType: attackTypeByUnit[99] || 'physical',
      baseStats: getStats(vodka, 1),
    });
    return result;
  }

  function drawPicker() {
    const v = currentView();
    const arena = v.arena;
    if (!arena) return;
    const result = drawUnitPlacementPicker(ctx, {
      width: v.width,
      height: v.height,
      entries: entries(),
      scroll: arena.pickerScroll,
      frame: v.frame,
      labels: { scrollDown: 'v  scroll for more  v', scrollUp: '^' },
      drawUnitPortrait(entry, px, py) {
        const def = entry.def;
        const drawer = def && v.drawFns && v.drawFns[def.drawFn];
        if (drawer) {
          drawer(px, py, { ...def, facing: 1, bobPhase: v.frame * 0.05, size: (def.size || 22) * 0.7, color: def.color, accent: def.accent });
        }
      },
    });
    arena.pickerScroll = result.scroll;
    arena._pickerRects = result.rects;
  }

  function handleClick(point) {
    const v = currentView();
    const arena = v.arena;
    if (!arena) return;
    if ((getTouchAccumY ? getTouchAccumY() : 0) > 8) {
      if (setTouchAccumY) setTouchAccumY(0);
      return;
    }
    for (const rect of (arena._pickerRects || [])) {
      if (inRect(point, rect.x, rect.y, rect.w, rect.h)) {
        if (placeUnit(arena.pickerCell, rect.pick)) {
          showFlash((rect.label || 'Unit') + ' placed', '#ffd700', 45);
          arena.pickerOpen = false;
          arena.pickerCell = null;
        }
        return;
      }
    }
    arena.pickerOpen = false;
    arena.pickerCell = null;
  }

  return { cardCount, maxScroll, deck, entries, drawPicker, handleClick };
}

import { drawHealthBar } from './health-bars.js?v=20260522-clean-shield-vfx';
import { collectStatusIcons, drawStatusIconChips } from './status-icons.js?v=20260522-clean-shield-vfx';

export function createActorOverlayRenderer({
  ctx,
  tickHz,
  getFrame,
  getState,
  getArenaTop,
} = {}) {
  function drawStatusIcons(target, x, topY) {
    const icons = collectStatusIcons(target, tickHz);
    drawStatusIconChips(ctx, {
      icons,
      x,
      topY,
      state: getState ? getState() : 'menu',
      arenaTop: getArenaTop ? getArenaTop() : 0,
      frame: getFrame ? getFrame() : 0,
    });
  }

  function drawHpBar(x, y, hp, maxHp, width, kind = 'player') {
    drawHealthBar(ctx, { x, y, hp, maxHp, width, kind });
  }

  return { drawStatusIcons, drawHpBar };
}

import { pointInRect } from './input.js';

export const CODEX_LIST_ROW_H = 66;
export const CODEX_LIST_GAP = 6;
export const CODEX_HEADER_Y = 14;
export const CODEX_HEADER_H = 58;
export const CODEX_LIST_MAX_SCROLL = 920;

export function resolveCodexClick(point, {
  width,
  height,
  codexUnit,
  codexScroll,
  unitCount,
  backY,
}) {
  if (pointInRect(point, width - 90, 30, 76, 26)) {
    return { type: 'close' };
  }

  if (codexUnit < 0) {
    const startY = CODEX_HEADER_Y + CODEX_HEADER_H + 12 - codexScroll;
    for (let i = 0; i < unitCount; i++) {
      const rowY = startY + i * (CODEX_LIST_ROW_H + CODEX_LIST_GAP);
      if (pointInRect(point, 12, rowY, width - 24, CODEX_LIST_ROW_H)) {
        return { type: 'open', codexUnit: i };
      }
    }

    const heroY = startY + unitCount * (CODEX_LIST_ROW_H + CODEX_LIST_GAP);
    if (pointInRect(point, 12, heroY, width - 24, CODEX_LIST_ROW_H)) {
      return { type: 'open', codexUnit: 99 };
    }

    const threatsY = startY + (unitCount + 1) * (CODEX_LIST_ROW_H + CODEX_LIST_GAP);
    if (pointInRect(point, 12, threatsY, width - 24, CODEX_LIST_ROW_H)) {
      return { type: 'open', codexUnit: 100 };
    }

    const armorY = startY + (unitCount + 2) * (CODEX_LIST_ROW_H + CODEX_LIST_GAP);
    if (pointInRect(point, 12, armorY, width - 24, CODEX_LIST_ROW_H)) {
      return { type: 'open', codexUnit: 101 };
    }

    const bossY = startY + (unitCount + 3) * (CODEX_LIST_ROW_H + CODEX_LIST_GAP);
    if (pointInRect(point, 12, bossY, width - 24, CODEX_LIST_ROW_H)) {
      return { type: 'open', codexUnit: 102 };
    }

    return { type: 'none' };
  }

  const detailBackY = backY == null ? height - 46 : backY;
  if (pointInRect(point, 14, detailBackY, width - 28, 32)) {
    return { type: 'backToList' };
  }

  return { type: 'none' };
}

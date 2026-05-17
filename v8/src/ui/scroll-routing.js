import { clampScroll } from './input.js';
import { CODEX_LIST_MAX_SCROLL } from './codex-input.js';

export function resolveScrollTarget({ codexOpen, codexUnit, arenaState, screenState }) {
  if (codexOpen && codexUnit < 0) return { type: 'codex', max: CODEX_LIST_MAX_SCROLL };
  if (arenaState && arenaState.managePanelCell) return { type: 'managePanel', max: arenaState._mgrMaxScroll || 0 };
  if (arenaState && arenaState.pickerOpen) return { type: 'unitPicker' };
  if (screenState === 'stageSelect') return { type: 'stageSelect' };
  if (screenState === 'deckPick') return { type: 'deckPick' };
  if (screenState === 'spellPick') return { type: 'spellPick' };
  if (screenState === 'perkPick') return { type: 'perkPick' };
  return { type: 'none' };
}

export function nextScrollValue(current, delta, maxScroll, factor) {
  return clampScroll((current || 0) + delta * factor, maxScroll);
}

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

export function createScrollRoutingRuntime(deps) {
  const view = () => (typeof deps.view === 'function' ? deps.view() : {});

  function deckPickMaxScroll() {
    const v = view();
    const height = Number.isFinite(v.height) ? v.height : 1000;
    return Math.max(0, Math.ceil((v.playerUnitCount || 0) / 3) * 168 - (height - 180));
  }

  function spellPickMaxScroll() {
    const v = view();
    const height = Number.isFinite(v.height) ? v.height : 1000;
    return Math.max(0, (v.abilityCount || 0) * 128 - (height - 180));
  }

  function perkPickMaxScroll() {
    const v = view();
    return deps.perkPickMaxScroll(v.perkCount || 0, v.height || 1000);
  }

  function stageSelectMaxScroll() {
    const v = view();
    const height = Number.isFinite(v.height) ? v.height : 1000;
    return Math.max(0, 86 + 5 * 180 + 56 + 56 - (height - 40));
  }

  function maxForTarget(target) {
    if (target.type === 'codex') return target.max;
    if (target.type === 'managePanel') return target.max;
    if (target.type === 'unitPicker') return deps.unitPickerMaxScroll();
    if (target.type === 'stageSelect') return stageSelectMaxScroll();
    if (target.type === 'deckPick') return deckPickMaxScroll();
    if (target.type === 'spellPick') return spellPickMaxScroll();
    if (target.type === 'perkPick') return perkPickMaxScroll();
    return 0;
  }

  function valueForTarget(target) {
    const v = view();
    const arena = v.arena || {};
    if (target.type === 'codex') return v.codexScroll || 0;
    if (target.type === 'managePanel') return arena._mgrScroll || 0;
    if (target.type === 'unitPicker') return arena.pickerScroll || 0;
    if (target.type === 'stageSelect') return v.stageSelectScroll || 0;
    if (target.type === 'deckPick') return v.deckPickScroll || 0;
    if (target.type === 'spellPick') return v.spellPickScroll || 0;
    if (target.type === 'perkPick') return v.perkPickScroll || 0;
    return 0;
  }

  function setValueForTarget(target, value) {
    const v = view();
    const arena = v.arena || {};
    if (target.type === 'codex') deps.setCodexScroll(value);
    else if (target.type === 'managePanel') arena._mgrScroll = value;
    else if (target.type === 'unitPicker') arena.pickerScroll = value;
    else if (target.type === 'stageSelect') deps.setStageSelectScroll(value);
    else if (target.type === 'deckPick') deps.setDeckPickScroll(value);
    else if (target.type === 'spellPick') deps.setSpellPickScroll(value);
    else if (target.type === 'perkPick') deps.setPerkPickScroll(value);
  }

  return {
    deckPickMaxScroll,
    spellPickMaxScroll,
    perkPickMaxScroll,
    stageSelectMaxScroll,
    maxForTarget,
    valueForTarget,
    setValueForTarget,
  };
}

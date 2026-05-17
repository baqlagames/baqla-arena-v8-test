import { pointInRectObject } from './input.js';

export function resolvePauseOverlayAction(point, arenaState) {
  if (!arenaState || !arenaState.pauseMenu) return { type: 'none' };
  if (pointInRectObject(point, arenaState._pauseResumeRect)) return { type: 'resume' };
  if (pointInRectObject(point, arenaState._pauseArenaViewRect)) return { type: 'arenaViewToggle' };
  if (pointInRectObject(point, arenaState._pauseRestartRect)) return { type: 'restart' };
  if (pointInRectObject(point, arenaState._pauseQuitRect)) return { type: 'quit' };
  if (pointInRectObject(point, arenaState._pauseSoundRect)) return { type: 'sound' };
  return { type: 'blocked' };
}

export function resolveBattleChromeAction(point, arenaState) {
  if (!arenaState) return { type: 'none' };
  if (pointInRectObject(point, arenaState._pauseBtnRect)) return { type: 'pause' };
  if (arenaState.pickerOpen) return { type: 'picker' };
  if (arenaState.managePanelCell) return { type: 'manage' };
  const spellRects = arenaState._spellBtnRects || [];
  for (let i = 0; i < spellRects.length; i++) {
    if (pointInRectObject(point, spellRects[i])) return { type: 'spell', idx: i };
  }
  if (pointInRectObject(point, arenaState._bloodlustRect)) return { type: 'bloodlust' };
  if (pointInRectObject(point, arenaState._tranquilityRect)) return { type: 'tranquility' };
  if (arenaState.phase === 'build' && pointInRectObject(point, arenaState._startWaveRect)) return { type: 'startWave' };
  return { type: 'none' };
}

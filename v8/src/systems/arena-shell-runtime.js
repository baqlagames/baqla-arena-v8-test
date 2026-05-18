import { installArenaPlaytestHook } from './playtest-hook.js';

export function createArenaShellRuntime(deps = {}) {
  const canvas = deps.canvas;
  const ctx = deps.ctx;
  const tickHz = deps.tickHz || 60;
  const requestFrame = deps.requestAnimationFrame || (fn => requestAnimationFrame(fn));
  const performanceNow = deps.performanceNow || (() => performance.now());
  const inputHandlers = deps.inputHandlers;
  let lastFrameT = 0;
  let accumMs = 0;
  const stepMs = 1000 / tickHz;

  function installInputHandlers() {
    canvas.addEventListener('click', event => {
      try {
        inputHandlers.handleClickPoint(deps.getCanvasXY(event));
      } catch (err) {
        drawClickCrash(err);
      }
    });
    canvas.addEventListener('wheel', event => inputHandlers.handleWheel(event), { passive: false });
    canvas.addEventListener('touchstart', event => inputHandlers.handleTouchStart(event), { passive: true });
    canvas.addEventListener('touchmove', event => inputHandlers.handleTouchMove(event), { passive: true });
  }

  function drawClickCrash(err) {
    const v = deps.view();
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, v.width, 80);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CLICK CRASH: ' + err.message, 10, 20);
    ctx.fillText('at: ' + ((err.stack || '').split('\n')[1] || ''), 10, 40);
    console.error('CLICK CRASH:', err);
  }

  function installPlaytest(options) {
    installArenaPlaytestHook(options);
  }

  function startLoop() {
    requestFrame(loop);
  }

  function loop(now) {
    try {
      if (!lastFrameT) lastFrameT = now || performanceNow();
      const t = now || performanceNow();
      let dt = t - lastFrameT;
      lastFrameT = t;
      if (dt > 250) dt = 250;
      accumMs += dt;
      let steps = 0;
      while (accumMs >= stepMs && steps < 8) {
        deps.update();
        accumMs -= stepMs;
        steps++;
      }
      if (steps >= 8) accumMs = 0;
      deps.render();
    } catch (err) {
      drawLoopCrash(err);
    }
    requestFrame(loop);
  }

  function drawLoopCrash(err) {
    const v = deps.view();
    const arena = v.arena;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, v.width, 80);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CRASH: ' + err.message, 10, 20);
    ctx.fillText('at: ' + ((err.stack || '').split('\n')[1] || ''), 10, 40);
    ctx.fillText('frame=' + v.frame + ' state=' + v.state + ' phase=' + (arena ? arena.phase : '?'), 10, 60);
    console.error('GAME LOOP CRASH:', err);
  }

  return {
    installInputHandlers,
    installPlaytest,
    startLoop,
  };
}

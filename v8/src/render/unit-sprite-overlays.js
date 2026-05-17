export function createUnitSpriteOverlayRenderer(deps) {
  const ctx = deps.ctx;
  const view = typeof deps.view === 'function' ? deps.view : (() => ({}));
  const rnd = typeof deps.randomRange === 'function' ? deps.randomRange : ((min, max) => min + Math.random() * (max - min));
  const emitParticle = typeof deps.emitParticle === 'function' ? deps.emitParticle : (() => {});

  function currentFrame() {
    const v = view() || {};
    return v.frame || 0;
  }

  function drawMoonkinSpriteOverlay(x, y, s, unit, phase) {
    const frame = currentFrame();
    const celestial = !!unit._celestialAlignment;
    const orbitSpeed = celestial ? 0.13 : 0.055;
    const orbitR = celestial ? s * 1.02 : s * 0.74;
    const starStacks = unit._astralPower ? unit._astralPower.stacks || 0 : 0;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.20 + (celestial ? 0.18 : 0.08);
    ctx.fillStyle = phase === 'solar' ? '#ffd700' : '#aaccff';
    ctx.beginPath(); ctx.arc(x, y - s * 0.1, s * (celestial ? 1.20 : 0.88), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 2; i++) {
      const isSun = i === 0;
      const a = frame * orbitSpeed + (isSun ? 0 : Math.PI);
      const ox = x + Math.cos(a) * orbitR;
      const oy = y - s * 0.32 + Math.sin(a) * orbitR * 0.42;
      ctx.globalAlpha = celestial ? 0.96 : ((isSun && phase === 'solar') || (!isSun && phase === 'lunar') ? 0.9 : 0.38);
      if (isSun) {
        ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(ox, oy, s * 0.16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.arc(ox, oy, s * 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5;
        for (let ray = 0; ray < 8; ray++) {
          const ra = ray * Math.PI / 4 + frame * 0.04;
          ctx.beginPath(); ctx.moveTo(ox + Math.cos(ra) * s * 0.19, oy + Math.sin(ra) * s * 0.19); ctx.lineTo(ox + Math.cos(ra) * s * 0.28, oy + Math.sin(ra) * s * 0.28); ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#b9d8ff'; ctx.beginPath(); ctx.arc(ox, oy, s * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(10,18,44,0.95)'; ctx.beginPath(); ctx.arc(ox + s * 0.06, oy - s * 0.02, s * 0.12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d8ecff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ox, oy, s * 0.18, -1.0, 1.2); ctx.stroke();
      }
    }
    for (let i = 0; i < starStacks; i++) {
      const a = frame * 0.08 + i * Math.PI * 2 / Math.max(1, starStacks);
      const rr = s * (0.62 + (i % 2) * 0.20);
      const sx = x + Math.cos(a) * rr, sy = y - s * 0.82 + Math.sin(a) * s * 0.22;
      ctx.globalAlpha = 0.75; ctx.fillStyle = i % 2 ? '#ccaaff' : '#ffffff';
      ctx.beginPath(); ctx.arc(sx, sy, s * 0.035, 0, Math.PI * 2); ctx.fill();
    }
    if (celestial) {
      ctx.globalAlpha = 0.42 + Math.sin(frame * 0.2) * 0.10;
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, s * 1.05, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#aaccff'; ctx.beginPath(); ctx.arc(x, y, s * 0.78, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  function drawToxinSpriteOverlay(x, y, s, unit) {
    const frame = currentFrame();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.55 + Math.sin(frame * 0.15) * 0.12;
    ctx.globalAlpha = 0.28 + pulse * 0.16;
    ctx.fillStyle = 'rgba(115,20,140,0.42)';
    ctx.beginPath(); ctx.arc(x, y - s * 0.05, s * 0.92, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(85,255,119,0.22)';
    ctx.beginPath(); ctx.arc(x, y + s * 0.08, s * 0.66, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.75;
    for (let i = 0; i < 6; i++) {
      const a = frame * 0.04 + i * Math.PI * 2 / 6;
      const ox = x + Math.cos(a) * s * (0.52 + (i % 2) * 0.18);
      const oy = y - s * 0.18 + Math.sin(a) * s * 0.36;
      ctx.fillStyle = i % 2 ? '#55ff77' : '#aa55dd';
      ctx.beginPath(); ctx.arc(ox, oy, s * (0.045 + (i % 3) * 0.01), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    if (frame % 10 === 0) {
      emitParticle(x + rnd(-s * 0.6, s * 0.6), y + rnd(-s * 0.45, s * 0.5), '#aa55dd', 1.5, 3);
      emitParticle(x + rnd(-s * 0.45, s * 0.45), y + rnd(-s * 0.3, s * 0.55), '#55ff77', 1, 2.5);
    }
  }

  return { drawMoonkinSpriteOverlay, drawToxinSpriteOverlay };
}

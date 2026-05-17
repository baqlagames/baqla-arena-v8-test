export function drawBombEffects(ctx, {
  bombs = [],
  frame = 0,
  randomRange = () => 0,
  emitParticle = () => {},
} = {}) {
  for (const b of bombs) {
    const t = b.t / b.dur;
    const yA = b.meteor
      ? (b.fromY + (b.ty - b.fromY) * Math.max(0, t))
      : (b.fromY + (b.ty - b.fromY) * t - Math.sin(t * Math.PI) * 60);
    if (b.playerMeteor) {
      const _r = b.radius || 60;
      const _main = b.color || (b.venomMeteor ? '#55ff33' : (b.felMeteor ? '#9b59b6' : '#aa66ff'));
      const _alt = b.altColor || (b.venomMeteor ? '#bbff55' : (b.felMeteor ? '#cc88ff' : '#cc99ff'));
      const _soft = b.venomMeteor ? 'rgba(85,255,51,' : (b.felMeteor ? 'rgba(155,89,182,' : 'rgba(170,102,255,');
      ctx.save();
      ctx.strokeStyle = _main; ctx.globalAlpha = 0.45 + Math.sin(frame * 0.3) * 0.3; ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]); ctx.lineDashOffset = -frame * 0.5;
      ctx.beginPath(); ctx.arc(b.tx, b.ty, _r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = _soft + (0.10 + t * 0.25) + ')';
      ctx.beginPath(); ctx.arc(b.tx, b.ty, _r * (0.4 + t * 0.6), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = _alt; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(b.tx - _r * 0.18, b.ty); ctx.lineTo(b.tx - _r * 0.06, b.ty);
      ctx.moveTo(b.tx + _r * 0.06, b.ty); ctx.lineTo(b.tx + _r * 0.18, b.ty);
      ctx.moveTo(b.tx, b.ty - _r * 0.18); ctx.lineTo(b.tx, b.ty - _r * 0.06);
      ctx.moveTo(b.tx, b.ty + _r * 0.06); ctx.lineTo(b.tx, b.ty + _r * 0.18);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = _soft + '0.40)';
      ctx.beginPath(); ctx.arc(b.x, yA, 14 + Math.sin(frame * 0.4) * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = b.color || '#aa66ff';
      ctx.beginPath(); ctx.arc(b.x, yA, 8 + Math.sin(frame * 0.4) * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(b.x, yA, 3, 0, Math.PI * 2); ctx.fill();
      emitParticle(b.x + randomRange(-3, 3), yA - 2, _alt, 1, 3);
      if (frame % 2 === 0) emitParticle(b.x + randomRange(-4, 4), yA + randomRange(0, 8), '#ffffff', 1, 2);
    } else if (b.pyroblast) {
      const _pr = b.size || 14; const _pulse = _pr + Math.sin(frame * 0.35) * 3;
      ctx.save();
      ctx.fillStyle = 'rgba(255,100,0,0.3)'; ctx.beginPath(); ctx.arc(b.x, yA, _pulse * 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,68,0,0.5)'; ctx.beginPath(); ctx.arc(b.x, yA, _pulse * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff4400'; ctx.beginPath(); ctx.arc(b.x, yA, _pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(b.x, yA, _pulse * 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(b.x, yA, _pulse * 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      emitParticle(b.x + randomRange(-6, 6), yA + randomRange(-3, 6), '#ff6600', 2, 4);
      if (frame % 2 === 0) emitParticle(b.x + randomRange(-10, 10), yA + randomRange(-5, 8), '#ffaa00', 1, 3);
    } else if (b.toxicPotion) {
      const _pr = 8 + Math.sin(frame * 0.3) * 1.5;
      ctx.save();
      ctx.strokeStyle = '#55ff77'; ctx.globalAlpha = 0.45 + Math.sin(frame * 0.25) * 0.12; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(b.tx, b.ty, b.radius || 60, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(85,255,119,' + (0.08 + t * 0.18) + ')';
      ctx.beginPath(); ctx.arc(b.tx, b.ty, (b.radius || 60) * (0.35 + t * 0.45), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#aa55dd'; ctx.beginPath(); ctx.arc(b.x, yA, _pr * 1.35, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#55ff77'; ctx.beginPath(); ctx.arc(b.x + 2, yA - 1, _pr * 0.75, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(b.x - 2, yA - 3, _pr * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      emitParticle(b.x + randomRange(-4, 4), yA + randomRange(-2, 4), '#aa55dd', 1.5, 3);
      if (frame % 2 === 0) emitParticle(b.x + randomRange(-5, 5), yA + randomRange(-2, 5), '#55ff77', 1, 3);
    } else {
      ctx.fillStyle = b.color || '#ff6600';
      ctx.beginPath(); ctx.arc(b.x, yA, 5, 0, Math.PI * 2); ctx.fill();
      if (b.meteor) {
        ctx.fillStyle = '#ff8800'; ctx.beginPath(); ctx.arc(b.x, yA, 8 + Math.sin(frame * 0.4) * 2, 0, Math.PI * 2); ctx.fill();
        emitParticle(b.x, yA, '#ffaa00', 1, 3);
      }
    }
    if (!b.playerMeteor) {
      ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(b.tx, b.ty, 4 + t * 4, 2 + t * 2, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

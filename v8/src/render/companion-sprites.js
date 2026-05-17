export function createCompanionSpriteRenderer(ctx) {
  function drawBear(x, y, unit) {
    const s = unit.size;
    ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(x, y + s + 1, s * 0.7, s * 0.15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = unit.color; ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = unit.accent;
    ctx.beginPath(); ctx.arc(x - s * 0.55, y - s * 0.55, s * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + s * 0.55, y - s * 0.55, s * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - s * 0.4, y - s * 0.15, 3, 2); ctx.fillRect(x + s * 0.2, y - s * 0.15, 3, 2);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y + s * 0.1, 3, 0, Math.PI * 2); ctx.fill();
  }

  function drawMinionFava(x, y, unit) {
    const s = unit.size;
    ctx.fillStyle = unit.color; ctx.beginPath(); ctx.ellipse(x, y, s * 0.7, s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = unit.accent; ctx.beginPath(); ctx.arc(x, y, s * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#88ff44'; ctx.fillRect(x - 2, y - 2, 2, 2); ctx.fillRect(x + 1, y - 2, 2, 2);
  }

  function drawSheep(x, y, s) {
    ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(x, y + s + 1, s * 0.55, s * 0.15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5f5f5';
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.5, s * 0.32, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.7, s * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#666'; ctx.beginPath(); ctx.ellipse(x + s * 0.55, y - s * 0.1, s * 0.25, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x + s * 0.62, y - s * 0.15, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#444';
    ctx.fillRect(x - s * 0.35, y + s * 0.4, 2, s * 0.3); ctx.fillRect(x + s * 0.25, y + s * 0.4, 2, s * 0.3);
  }

  function drawTurtle(x, y, s) {
    ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.6, s * 0.5, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a7a3a'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.05, s * 0.65, s * 0.5, 0, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#3a6a2a'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 0.65, s * 0.35, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = '#2a5a1a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - s * 0.3, y - s * 0.1); ctx.lineTo(x + s * 0.3, y - s * 0.1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.4); ctx.lineTo(x, y + s * 0.05); ctx.stroke();
    ctx.fillStyle = '#6a9a4a'; ctx.beginPath(); ctx.ellipse(x + s * 0.6, y - s * 0.05, s * 0.18, s * 0.14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x + s * 0.65, y - s * 0.1, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a8a3a';
    ctx.fillRect(x - s * 0.4, y + s * 0.2, 3, s * 0.25); ctx.fillRect(x + s * 0.3, y + s * 0.2, 3, s * 0.25);
  }

  function drawPig(x, y, s) {
    ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.6, s * 0.45, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0a0a0'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.6, s * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e88a8a'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 0.55, s * 0.35, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#f0a0a0'; ctx.beginPath(); ctx.arc(x + s * 0.45, y - s * 0.05, s * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e07070'; ctx.beginPath(); ctx.ellipse(x + s * 0.58, y, s * 0.12, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c06060';
    ctx.beginPath(); ctx.arc(x + s * 0.55, y - 0.5, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + s * 0.61, y - 0.5, 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x + s * 0.42, y - s * 0.12, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e07070';
    ctx.beginPath(); ctx.moveTo(x + s * 0.32, y - s * 0.25); ctx.lineTo(x + s * 0.38, y - s * 0.42); ctx.lineTo(x + s * 0.46, y - s * 0.25); ctx.fill();
    ctx.strokeStyle = '#e07070'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x - s * 0.55, y - s * 0.1, s * 0.12, 0, Math.PI * 1.5); ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = '#e08888';
    ctx.fillRect(x - s * 0.3, y + s * 0.3, 3, s * 0.22); ctx.fillRect(x + s * 0.2, y + s * 0.3, 3, s * 0.22);
  }

  function drawCritter(x, y, s, critterType) {
    if (critterType === 1) drawTurtle(x, y, s);
    else if (critterType === 2) drawPig(x, y, s);
    else drawSheep(x, y, s);
  }

  return { drawBear, drawMinionFava, drawSheep, drawTurtle, drawPig, drawCritter };
}

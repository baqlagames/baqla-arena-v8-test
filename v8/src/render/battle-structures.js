import { drawPlayerKeep } from './castle.js';
import { drawBigHealthBar, drawHealthBar } from './health-bars.js';

export function createBattleStructuresRenderer(deps) {
  const ctx = deps.ctx;
  let W = 500, frame = 0, currentStage = null, playerCastle = null, enemyCastle = null, bossRef = null;
  let units = [];
  const rnd = typeof deps.randomRange === 'function' ? deps.randomRange : ((min, max) => min + Math.random() * (max - min));
  const emitParticle = typeof deps.emitParticle === 'function' ? deps.emitParticle : (() => {});
  const dist = typeof deps.dist === 'function' ? deps.dist : ((a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)));
  const drawWithClashCamera = typeof deps.drawWithClashCamera === 'function' ? deps.drawWithClashCamera : ((x, y, fn) => fn());

  function sync() {
    const v = typeof deps.view === 'function' ? deps.view() : {};
    W = v.width || W;
    frame = v.frame || 0;
    currentStage = v.currentStage || null;
    playerCastle = v.playerCastle || null;
    enemyCastle = v.enemyCastle || null;
    bossRef = v.bossRef || null;
    units = v.units || units;
  }

  function drawPlayerKeepRuntime(x, y, size, dmgRatio) {
    drawPlayerKeep(ctx, { x, y, size, dmgRatio, frame, randomRange: rnd, addParticle: emitParticle });
  }

  function drawCastle(c) {
    sync();
    if (!c) return;
    drawWithClashCamera(c.x, c.y, () => drawCastleRaw(c));
  }

  function drawCastleRaw(c) {
    if (!c) return;
    const x = c.x, y = c.y, s = c.size;
    const dmgRatio = 1 - c.hp / c.maxHp;
    if (c.isPlayer) {
      drawPlayerKeepRuntime(x, y, s, dmgRatio);
      return;
    }

    ctx.fillStyle = '#0008'; ctx.beginPath(); ctx.ellipse(x, y + s + 6, s * 1.4, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    const act = currentStage ? currentStage.act : 1;
    const cols = [null, '#5e3a1a', '#7a4a8e', '#c08820', '#5e7a9a', '#3a1a3a'];
    const accent = [null, '#3a2010', '#4a2a5e', '#7a4a0a', '#3a4f6a', '#1a0a1a'];
    const flagC = [null, '#3a1a0a', '#660066', '#a83a1a', '#3a3a78', '#aa0000'];

    ctx.fillStyle = '#1a0a05';
    ctx.fillRect(x - s - 4, y + s * 0.55, s * 2 + 8, s * 0.45);
    const wallGradient = ctx.createLinearGradient(0, y - s * 0.5, 0, y + s * 0.7);
    wallGradient.addColorStop(0, cols[act]);
    wallGradient.addColorStop(0.5, accent[act]);
    wallGradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = wallGradient;
    ctx.fillRect(x - s, y - s * 0.5, s * 2, s * 1.15);

    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const ly = y - s * 0.5 + i * s * 0.38;
      ctx.beginPath(); ctx.moveTo(x - s, ly); ctx.lineTo(x + s, ly); ctx.stroke();
    }

    ctx.fillStyle = accent[act];
    for (let i = -2; i <= 2; i++) {
      const bx = x + i * s * 0.4;
      ctx.beginPath();
      ctx.moveTo(bx - s * 0.16, y - s * 0.5);
      ctx.lineTo(bx - s * 0.12, y - s * 0.74);
      ctx.lineTo(bx, y - s * 0.6);
      ctx.lineTo(bx + s * 0.12, y - s * 0.74);
      ctx.lineTo(bx + s * 0.16, y - s * 0.5);
      ctx.closePath(); ctx.fill();
    }

    for (const dx of [-1, 1]) {
      ctx.fillStyle = cols[act];
      ctx.fillRect(x + dx * s * 1.0 - s * 0.18, y - s * 0.7, s * 0.36, s * 1.35);
      ctx.fillStyle = accent[act];
      ctx.beginPath();
      ctx.moveTo(x + dx * s * 1.0 - s * 0.22, y - s * 0.7);
      ctx.lineTo(x + dx * s * 1.0 - s * 0.15, y - s * 0.92);
      ctx.lineTo(x + dx * s * 1.0, y - s * 0.78);
      ctx.lineTo(x + dx * s * 1.0 + s * 0.15, y - s * 0.92);
      ctx.lineTo(x + dx * s * 1.0 + s * 0.22, y - s * 0.7);
      ctx.closePath(); ctx.fill();

      const flameC = act === 2 ? '#aa66cc' : act === 5 ? '#aa00aa' : '#ff4400';
      const fy = y - s * 0.95;
      ctx.fillStyle = flameC;
      ctx.beginPath(); ctx.ellipse(x + dx * s * 1.0, fy, s * 0.1 + Math.sin(frame * 0.4 + dx) * 1.5, s * 0.18 + Math.sin(frame * 0.4 + dx) * 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath(); ctx.ellipse(x + dx * s * 1.0, fy + s * 0.06, s * 0.05, s * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      if (frame % 4 === 0) emitParticle(x + dx * s * 1.0, fy - s * 0.15, flameC, 1, 2);
    }

    ctx.fillStyle = '#dadada';
    ctx.beginPath(); ctx.arc(x, y - s * 0.05, s * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - s * 0.07, y - s * 0.07, s * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + s * 0.07, y - s * 0.07, s * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - s * 0.08, y + s * 0.02, s * 0.16, s * 0.06);

    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.moveTo(x - s * 0.24, y + s * 0.6); ctx.lineTo(x - s * 0.24, y + s * 0.18);
    ctx.quadraticCurveTo(x, y + s * 0.05, x + s * 0.24, y + s * 0.18); ctx.lineTo(x + s * 0.24, y + s * 0.6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3a1a3a'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(x + i * s * 0.06, y + s * 0.6); ctx.lineTo(x + i * s * 0.06, y + s * 0.18); ctx.stroke();
    }

    const flagWave = Math.sin(frame * 0.15) * 4;
    ctx.fillStyle = '#1a0a05';
    ctx.fillRect(x - 2, y - s * 1.15, 4, s * 0.55);
    ctx.fillStyle = flagC[act];
    ctx.beginPath();
    ctx.moveTo(x + 2, y - s * 1.15);
    ctx.lineTo(x + s * 0.35 + flagWave, y - s * 1.05);
    ctx.lineTo(x + s * 0.35 + flagWave, y - s * 0.78);
    ctx.lineTo(x + 2, y - s * 0.7);
    ctx.closePath(); ctx.fill();

    if (dmgRatio > 0.4 && frame % 4 === 0) emitParticle(x + rnd(-s * 0.7, s * 0.7), y - s * 0.4, '#ff6600', 1, 3);
    if (dmgRatio > 0.7 && frame % 3 === 0) emitParticle(x + rnd(-s * 0.6, s * 0.6), y - s * 0.8, 'rgba(80,80,80,0.7)', 1, 4);
  }

  function drawTower(t) {
    sync();
    if (!t || t.hp <= 0) return;
    const x = t.x, y = t.y, s = t.size;
    ctx.fillStyle = '#0008'; ctx.beginPath(); ctx.ellipse(x, y + s + 2, s * 0.95, s * 0.18, 0, 0, Math.PI * 2); ctx.fill();

    if (units.some(u => u.hp > 0 && dist(u, t) < t.range * 1.6)) {
      ctx.strokeStyle = 'rgba(255,80,80,0.18)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(x, y, t.range, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }

    const towerGradient = ctx.createLinearGradient(x - s * 0.7, 0, x + s * 0.7, 0);
    towerGradient.addColorStop(0, '#5a5044');
    towerGradient.addColorStop(0.5, '#787060');
    towerGradient.addColorStop(1, '#403830');
    ctx.fillStyle = towerGradient;
    ctx.fillRect(x - s * 0.7, y - s, s * 1.4, s * 1.9);

    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
    for (let r = 0; r < 4; r++) {
      const ly = y - s + r * s * 0.5;
      ctx.beginPath(); ctx.moveTo(x - s * 0.7, ly); ctx.lineTo(x + s * 0.7, ly); ctx.stroke();
    }
    for (let r = 0; r < 3; r++) {
      const ly = y - s * 0.75 + r * s * 0.5;
      for (let c = -1; c <= 1; c++) {
        const lx = x + c * s * 0.45 + (r % 2 ? s * 0.22 : 0);
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + s * 0.4); ctx.stroke();
      }
    }

    ctx.fillStyle = '#3a3530';
    for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * s * 0.45 - s * 0.12, y - s - s * 0.18, s * 0.24, s * 0.18);
    ctx.fillStyle = '#5a5044';
    for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * s * 0.45 - s * 0.12, y - s - s * 0.06, s * 0.24, 4);

    const coreGradient = ctx.createRadialGradient(x, y - s * 0.4, 1, x, y - s * 0.4, s * 0.4);
    coreGradient.addColorStop(0, '#ff8800');
    coreGradient.addColorStop(0.4, 'rgba(255,80,40,0.6)');
    coreGradient.addColorStop(1, 'rgba(255,80,40,0)');
    ctx.fillStyle = coreGradient;
    ctx.beginPath(); ctx.arc(x, y - s * 0.4, s * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath(); ctx.arc(x, y - s * 0.4, 3 + Math.sin(frame * 0.25) * 1.5, 0, Math.PI * 2); ctx.fill();

    for (const dx of [-1, 1]) {
      const fy = y - s - s * 0.3;
      ctx.fillStyle = '#ff8800';
      ctx.beginPath(); ctx.ellipse(x + dx * s * 0.45, fy, 4 + Math.sin(frame * 0.4 + dx) * 1, 8 + Math.sin(frame * 0.4 + dx) * 1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath(); ctx.ellipse(x + dx * s * 0.45, fy + 2, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
      if (frame % 6 === 0) emitParticle(x + dx * s * 0.45, fy - 3, '#ff6600', 1, 2);
    }

    if (t.cd >= t.atkSpd - 3) {
      ctx.fillStyle = 'rgba(255,200,80,0.5)';
      ctx.beginPath(); ctx.arc(x, y - s * 0.4, s * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    drawHealthBar(ctx, { x, y: y - s - s * 0.4, hp: t.hp, maxHp: t.maxHp, width: s * 1.6 });
  }

  function drawCrystalNode(n) {
    sync();
    if (!n) return;
    const x = n.x, y = n.y;
    ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(x, y + n.size, n.size * 0.9, n.size * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    const ownerColor = n.owner === 1 ? '#9b59b6' : n.owner === 2 ? '#cc4444' : '#888';
    ctx.fillStyle = ownerColor;
    ctx.beginPath(); ctx.moveTo(x, y - n.size); ctx.lineTo(x + n.size * 0.6, y); ctx.lineTo(x, y + n.size * 0.4); ctx.lineTo(x - n.size * 0.6, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.moveTo(x, y - n.size); ctx.lineTo(x + n.size * 0.3, y - n.size * 0.3); ctx.lineTo(x - n.size * 0.1, y); ctx.closePath(); ctx.fill();
    if (n.owner !== 0 && frame % 6 === 0) emitParticle(x, y - n.size, ownerColor, 1, 3);
    drawHealthBar(ctx, { x, y: y - n.size - 6, hp: n.hp, maxHp: n.maxHp, width: n.size + 4 });
  }

  function drawCastleBanners() {
    sync();
    if (!currentStage) return;
    const portR = 22, topY = 8;
    const pc = playerCastle, ec = enemyCastle;
    if (pc) {
      const ax = 8 + portR, ay = topY + portR;
      ctx.fillStyle = '#1a1a2e'; ctx.beginPath(); ctx.arc(ax, ay, portR + 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ax, ay, portR + 1, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#3a8e3a'; ctx.beginPath(); ctx.arc(ax, ay, portR - 2, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * 0.85 + (i / 4) * Math.PI * 0.85;
        const bx = ax + Math.cos(a) * (portR - 4), by = ay + Math.sin(a) * (portR - 4);
        ctx.fillStyle = '#ee8a2a'; ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.moveTo(ax - portR * 0.55, ay + portR * 0.15);
      for (let i = 0; i < 5; i++) {
        const tx = ax - portR * 0.55 + (i + 0.5) * portR * 1.1 / 5;
        ctx.lineTo(tx, ay + portR * 0.18 + (i % 2 ? -2 : 2));
      }
      ctx.lineTo(ax + portR * 0.55, ay + portR * 0.15);
      ctx.lineTo(ax + portR * 0.55, ay + portR * 0.4);
      for (let i = 4; i >= 0; i--) {
        const tx = ax - portR * 0.55 + (i + 0.5) * portR * 1.1 / 5;
        ctx.lineTo(tx, ay + portR * 0.43 + (i % 2 ? -2 : 2));
      }
      ctx.closePath(); ctx.fill();

      const bx = ax + portR + 8, by = ay - 7, bw = W / 2 - portR - 30, bh = 14;
      drawBigHpBar(bx, by, bw, bh, pc.hp, pc.maxHp, '#4caf50', '#1f3a1f');
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'left';
      ctx.fillText(pc.name, bx, by - 2);
    }

    const enemyTarget = ec || (bossRef && bossRef.hp > 0 ? bossRef : null);
    if (enemyTarget) {
      const ax = W - 8 - portR, ay = topY + portR;
      ctx.fillStyle = '#1a0a14'; ctx.beginPath(); ctx.arc(ax, ay, portR + 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#aa3333'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ax, ay, portR + 1, 0, Math.PI * 2); ctx.stroke();
      const act = currentStage.act || 1;
      const cols = [null, '#5e3a1a', '#7a4a8e', '#c08820', '#5e7a9a', '#3a1a3a'];
      ctx.fillStyle = enemyTarget === bossRef ? (enemyTarget.color || cols[act]) : cols[act];
      ctx.beginPath(); ctx.arc(ax, ay, portR - 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff4444'; ctx.beginPath(); ctx.arc(ax - 7, ay - 2, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(ax + 7, ay - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax - 8, ay + 12); ctx.lineTo(ax - 3, ay + 8); ctx.lineTo(ax, ay + 12); ctx.lineTo(ax + 3, ay + 8); ctx.lineTo(ax + 8, ay + 12); ctx.stroke();
      const bw = W / 2 - portR - 30, bh = 14, bx = ax - portR - 8 - bw, by = ay - 7;
      drawBigHpBar(bx, by, bw, bh, enemyTarget.hp, enemyTarget.maxHp, '#dc2626', '#5e1010');
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'right';
      ctx.fillText(enemyTarget.name || 'BOSS', bx + bw, by - 2);
      ctx.textAlign = 'left';
    }
  }

  function drawBigHpBar(x, y, w, h, hp, maxHp, color, dark) {
    drawBigHealthBar(ctx, { x, y, width: w, height: h, hp, maxHp, color, dark });
  }

  return {
    drawPlayerKeep: (...args) => { sync(); return drawPlayerKeepRuntime(...args); },
    drawCastle,
    drawCastleRaw: (...args) => { sync(); return drawCastleRaw(...args); },
    drawTower,
    drawCrystalNode,
    drawCastleBanners,
    drawBigHpBar
  };
}

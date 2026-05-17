function rgba(hex, a) {
  if (!hex || hex[0] !== '#') return 'rgba(255,255,255,' + a + ')';
  if (hex.length === 4) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

function pathPoints(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
}

function strokeProjectedLine(ctx, camPoint, x1, y1, x2, y2) {
  const a = camPoint(x1, y1);
  const b = camPoint(x2, y2);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function pathProjectedRect(ctx, pathCamQuad, x, y, w, h) {
  pathCamQuad(x, y, w, h);
}

function drawProjectedTile(ctx, view, x, y, w, h, fill, stroke) {
  const { pathCamQuad } = view;
  ctx.fillStyle = fill;
  pathProjectedRect(ctx, pathCamQuad, x, y, w, h);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

function drawWallBricks(ctx, view, floor) {
  const { camPoint, frame } = view;
  ctx.save();
  ctx.strokeStyle = 'rgba(214,223,255,0.13)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 7; i++) {
    const t = i / 7;
    const y = floor.top + (floor.bottom - floor.top) * t;
    strokeProjectedLine(ctx, camPoint, floor.left - 12, y, floor.left - 54, y - 20 - 4 * Math.sin(frame * 0.01 + i));
    strokeProjectedLine(ctx, camPoint, floor.right + 12, y, floor.right + 54, y - 20 - 4 * Math.sin(frame * 0.01 + i));
  }
  for (let i = 0; i <= 9; i++) {
    const x = floor.left + (floor.right - floor.left) * i / 9;
    strokeProjectedLine(ctx, camPoint, x, floor.top - 4, x, floor.top - 58);
  }
  ctx.restore();
}

function drawCrenellations(ctx, view, floor) {
  const { camPoint } = view;
  const count = 10;
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = floor.left + (floor.right - floor.left) * (i + 0.5) / count;
    const p = camPoint(x, floor.top - 64);
    const s = 7 + i % 2;
    ctx.fillStyle = '#586084';
    ctx.strokeStyle = '#2a2f48';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(p.x - s, p.y - 9, s * 2, 12);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackGate(ctx, view, floor) {
  const { camPoint, frame, bossTheme } = view;
  const midX = (floor.left + floor.right) / 2;
  const gateW = Math.max(46, (floor.right - floor.left) * 0.18);
  const p = camPoint(midX, floor.top - 34);
  const depth = Math.max(0.78, Math.min(1.05, view.camDepthScaleAt ? view.camDepthScaleAt(floor.top) : 0.85));
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(depth, depth);
  ctx.fillStyle = '#171621';
  ctx.strokeStyle = bossTheme ? rgba(bossTheme.trim, 0.75) : '#6f6a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-gateW / 2, -20, gateW, 44, 9);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(222,206,146,0.35)';
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gateW / 6, -18);
    ctx.lineTo(i * gateW / 6, 23);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.28 + 0.08 * Math.sin(frame * 0.05);
  ctx.fillStyle = bossTheme ? bossTheme.trim : '#ffd166';
  ctx.beginPath();
  ctx.arc(0, 5, gateW * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRails(ctx, view, floor) {
  const { camPoint, frame } = view;
  ctx.save();
  ctx.strokeStyle = 'rgba(42,31,18,0.86)';
  ctx.lineWidth = 3;
  strokeProjectedLine(ctx, camPoint, floor.left + 14, floor.top + 8, floor.left + 14, floor.bottom - 22);
  strokeProjectedLine(ctx, camPoint, floor.right - 14, floor.top + 8, floor.right - 14, floor.bottom - 22);
  ctx.fillStyle = '#6a5430';
  ctx.strokeStyle = '#1b1309';
  for (let i = 0; i <= 8; i++) {
    const y = floor.top + (floor.bottom - floor.top) * i / 8;
    for (const x of [floor.left + 14, floor.right - 14]) {
      const p = camPoint(x, y);
      const sc = view.camDepthScaleAt ? view.camDepthScaleAt(y) : 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.2 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  const frontA = camPoint(floor.left + 16, floor.bottom - 8);
  const frontB = camPoint(floor.right - 16, floor.bottom - 8);
  ctx.strokeStyle = 'rgba(42,31,18,0.88)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(frontA.x, frontA.y);
  ctx.quadraticCurveTo((frontA.x + frontB.x) / 2, frontA.y - 12 - 3 * Math.sin(frame * 0.04), frontB.x, frontB.y);
  ctx.stroke();
  ctx.restore();
}

function drawDeployGlow(ctx, view, floor) {
  const { selectedCard, deployTop, pathCamQuad, frame } = view;
  if (selectedCard < 0) return;
  const y = Math.max(deployTop, floor.top);
  const h = Math.max(1, floor.bottom - y);
  ctx.save();
  const pulse = 0.20 + Math.sin(frame * 0.18) * 0.06;
  ctx.fillStyle = 'rgba(78,255,132,' + pulse.toFixed(3) + ')';
  pathCamQuad(floor.left + 6, y, floor.right - floor.left - 12, h);
  ctx.fill();
  ctx.strokeStyle = 'rgba(143,255,160,0.85)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 7]);
  ctx.lineDashOffset = -frame * 0.4;
  pathCamQuad(floor.left + 8, y + 4, floor.right - floor.left - 16, h - 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawFloor(ctx, view, floor) {
  const { pathCamQuad, camPoint, gridCols, gridRows, cellW, cellH, gridX, gridY, frame } = view;
  ctx.save();
  const baseGrad = ctx.createLinearGradient(0, floor.top, 0, floor.bottom);
  baseGrad.addColorStop(0, '#514334');
  baseGrad.addColorStop(0.48, '#7a654c');
  baseGrad.addColorStop(1, '#342419');
  ctx.fillStyle = baseGrad;
  pathCamQuad(floor.left, floor.top, floor.right - floor.left, floor.bottom - floor.top);
  ctx.fill();

  const cols = Math.max(7, gridCols + 2);
  const rows = Math.max(9, Math.ceil((floor.bottom - floor.top) / Math.max(24, cellH * 0.72)));
  const tileW = (floor.right - floor.left) / cols;
  const tileH = (floor.bottom - floor.top) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shade = (r + c) % 2 === 0 ? 'rgba(154,132,103,0.34)' : 'rgba(75,61,48,0.27)';
      drawProjectedTile(ctx, view, floor.left + c * tileW + 1.5, floor.top + r * tileH + 1.5, tileW - 3, tileH - 3, shade, 'rgba(38,29,22,0.28)');
    }
  }

  ctx.strokeStyle = 'rgba(255,230,178,0.18)';
  ctx.lineWidth = 1.4;
  for (let c = 0; c <= gridCols; c++) {
    const x = gridX + c * cellW;
    strokeProjectedLine(ctx, camPoint, x, gridY, x, gridY + gridRows * cellH);
  }
  for (let r = 0; r <= gridRows; r++) {
    const y = gridY + r * cellH;
    strokeProjectedLine(ctx, camPoint, gridX, y, gridX + gridCols * cellW, y);
  }

  const sheen = ctx.createLinearGradient(0, floor.top, 0, floor.bottom);
  sheen.addColorStop(0, 'rgba(255,255,255,0.12)');
  sheen.addColorStop(0.45, 'rgba(255,255,255,0.03)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.20)');
  ctx.fillStyle = sheen;
  pathCamQuad(floor.left, floor.top, floor.right - floor.left, floor.bottom - floor.top);
  ctx.fill();

  ctx.globalAlpha = 0.18 + 0.05 * Math.sin(frame * 0.025);
  ctx.fillStyle = '#ffd166';
  const gl = camPoint((floor.left + floor.right) / 2, floor.top + (floor.bottom - floor.top) * 0.38);
  ctx.beginPath();
  ctx.ellipse(gl.x, gl.y, (floor.right - floor.left) * 0.24, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawArena25D(ctx, view) {
  const {
    width,
    height,
    frame,
    arenaL,
    arenaR,
    arenaTop,
    arenaBot,
    gridX,
    gridY,
    gridW,
    cellW,
    cellH,
    gridCols,
    gridRows,
    bossTheme
  } = view;

  const floorPadX = Math.max(44, cellW * 0.95);
  const floor = {
    left: Math.max(arenaL + 10, gridX - floorPadX),
    right: Math.min(arenaR - 10, gridX + gridW + floorPadX),
    top: Math.max(arenaTop + 42, gridY - cellH * 4.15),
    bottom: Math.min(arenaBot - 34, gridY + cellH * (gridRows + 1.35))
  };

  ctx.save();
  const bg = ctx.createLinearGradient(0, arenaTop, 0, arenaBot);
  bg.addColorStop(0, '#12182a');
  bg.addColorStop(0.52, '#182116');
  bg.addColorStop(1, '#251311');
  ctx.fillStyle = '#070913';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, arenaTop, width, arenaBot - arenaTop);

  const voidGlow = ctx.createRadialGradient(width / 2, arenaTop + 120, 40, width / 2, arenaTop + 170, width * 0.72);
  voidGlow.addColorStop(0, bossTheme ? rgba(bossTheme.color, 0.22) : 'rgba(84,105,160,0.22)');
  voidGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = voidGlow;
  ctx.fillRect(0, arenaTop, width, arenaBot - arenaTop);

  const leftTop = view.camPoint(floor.left, floor.top);
  const leftBot = view.camPoint(floor.left, floor.bottom);
  const rightTop = view.camPoint(floor.right, floor.top);
  const rightBot = view.camPoint(floor.right, floor.bottom);

  ctx.fillStyle = '#343a58';
  pathPoints(ctx, [leftTop, rightTop, { x: rightTop.x, y: rightTop.y - 64 }, { x: leftTop.x, y: leftTop.y - 64 }]);
  ctx.fill();
  ctx.fillStyle = '#2b304c';
  pathPoints(ctx, [leftTop, leftBot, { x: leftBot.x - 78, y: leftBot.y - 30 }, { x: leftTop.x - 42, y: leftTop.y - 58 }]);
  ctx.fill();
  ctx.fillStyle = '#2b304c';
  pathPoints(ctx, [rightTop, rightBot, { x: rightBot.x + 78, y: rightBot.y - 30 }, { x: rightTop.x + 42, y: rightTop.y - 58 }]);
  ctx.fill();

  drawWallBricks(ctx, view, floor);
  drawCrenellations(ctx, view, floor);
  drawBackGate(ctx, view, floor);
  drawFloor(ctx, view, floor);
  drawRails(ctx, view, floor);
  drawDeployGlow(ctx, view, floor);

  if (bossTheme && view.state === 'battle') {
    ctx.fillStyle = rgba(bossTheme.color, 0.08);
    view.pathCamQuad(floor.left, floor.top, floor.right - floor.left, floor.bottom - floor.top);
    ctx.fill();
  }

  const vignette = ctx.createRadialGradient(width / 2, (arenaTop + arenaBot) / 2, width * 0.18, width / 2, (arenaTop + arenaBot) / 2, width * 0.85);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.48)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, arenaTop, width, arenaBot - arenaTop);
  ctx.restore();
}

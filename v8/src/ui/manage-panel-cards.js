export function drawManageBranchCard(ctx, opts) {
  const {
    x, y, w, h,
    bgColor, stripeColor, title, subtitle, headline, sigLine, price, affordableColor,
    detailLines = null,
    gold,
    wrapTextClamped
  } = opts;
  const afford = gold >= price;
  ctx.fillStyle = afford ? bgColor : '#2a2a3a';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
  ctx.fillStyle = stripeColor; ctx.beginPath(); ctx.roundRect(x, y, 4, h, 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'left';

  const titleMaxW = w - 130;
  let titleStr = title;
  if (ctx.measureText(titleStr).width > titleMaxW) {
    while (titleStr.length > 4 && ctx.measureText(titleStr + '...').width > titleMaxW) {
      titleStr = titleStr.slice(0, -1);
    }
    titleStr += '...';
  }
  ctx.fillText(titleStr, x + 14, y + 18);
  ctx.fillStyle = '#cfd5e0'; ctx.font = '10px Arial';
  ctx.fillText(subtitle, x + 14, y + 32);

  if (sigLine) {
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'right';
    ctx.fillText((sigLine.label || 'SIG') + ' ' + sigLine.name, x + w - 14, y + 18);
    ctx.fillStyle = '#888'; ctx.font = '9px Arial';
    ctx.fillText(sigLine.fc + 's/' + sigLine.cd + 's', x + w - 14, y + 32);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = stripeColor; ctx.font = 'bold 10px Arial';
  ctx.fillText('*', x + 14, y + 52);
  ctx.fillStyle = '#dde3ee'; ctx.font = '10px Arial';
  const hasDetails = detailLines && detailLines.length;
  const maxLines = hasDetails ? 2 : Math.max(1, Math.floor((h - 58) / 12));
  wrapTextClamped(headline, x + 26, y + 52, w - 44, 12, maxLines);
  if (hasDetails) {
    ctx.fillStyle = '#9fb2c9'; ctx.font = 'bold 9px Arial';
    const detailY = y + 80;
    const maxDetails = Math.min(3, detailLines.length);
    for (let i = 0; i < maxDetails; i++) ctx.fillText(detailLines[i], x + 26, detailY + i * 12);
  }

  ctx.fillStyle = afford ? affordableColor : '#aa6633'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'right';
  ctx.fillText(price + 'g', x + w - 14, y + h - 10);
}

export function drawManageSpecCard(ctx, opts) {
  const {
    x, y, w, h, spec, cell, gold, frame, drawFns,
    playerUnits, vodka, unitBranches, pathUpgradeCost, wrapTextClamped
  } = opts;
  const firstPath = spec.pathDefs && spec.pathDefs[0];
  const def = spec.unitIdx === 99 ? vodka : playerUnits[spec.unitIdx];
  const specBranch = firstPath && firstPath.branch && unitBranches[firstPath.unitIdx]
    ? unitBranches[firstPath.unitIdx][firstPath.branch]
    : null;
  const stripeColor = (specBranch && specBranch.color) || (def && def.color) || '#5a8aff';
  const pathCount = spec.pathDefs.length;
  const prices = spec.pathDefs.map(path => pathUpgradeCost(cell, path));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceText = minPrice === maxPrice ? minPrice + 'g' : 'from ' + minPrice + 'g';
  const afford = gold >= minPrice;

  ctx.fillStyle = afford ? '#16192c' : '#252636';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
  const shine = ctx.createLinearGradient(0, y, 0, y + 12);
  shine.addColorStop(0, 'rgba(255,255,255,0.06)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine; ctx.beginPath(); ctx.roundRect(x, y, w, 12, 12); ctx.fill();
  ctx.fillStyle = stripeColor; ctx.beginPath(); ctx.roundRect(x, y, 4, h, 2); ctx.fill();

  const px = x + 38, py = y + h / 2;
  const grad = ctx.createRadialGradient(px - 6, py - 6, 4, px, py, 30);
  grad.addColorStop(0, (def && def.color) || stripeColor);
  grad.addColorStop(1, (def && def.accent) || '#111');
  ctx.fillStyle = grad; ctx.globalAlpha = afford ? 1 : 0.45;
  ctx.beginPath(); ctx.arc(px, py, 27, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(px, py, 27, 0, Math.PI * 2); ctx.stroke();

  try {
    const drawer = def && drawFns[def.drawFn];
    if (drawer) {
      drawer(px, py, {
        ...def,
        branch: firstPath ? firstPath.branch : null,
        facing: 1,
        bobPhase: frame * 0.05,
        size: (def.size || 22) * 0.68,
        color: def.color,
        accent: def.accent
      });
    }
  } catch (_) {}

  ctx.textAlign = 'left';
  ctx.fillStyle = afford ? '#fff' : '#777'; ctx.font = 'bold 13px Arial';
  ctx.fillText(spec.name, x + 78, y + 22);
  ctx.fillStyle = stripeColor; ctx.font = 'bold 9px Arial';
  ctx.fillText((spec.role || 'SPEC').toUpperCase(), x + 78, y + 37);
  ctx.fillStyle = afford ? '#bfc7d8' : '#777'; ctx.font = '10px Arial';
  wrapTextClamped(spec.identity || '', x + 78, y + 53, w - 154, 12, 2);
  ctx.textAlign = 'right';
  ctx.fillStyle = pathCount > 1 ? '#cc99ff' : '#4cd97a'; ctx.font = 'bold 10px Arial';
  ctx.fillText(pathCount > 1 ? (pathCount + ' PATHS') : 'ONE PATH', x + w - 14, y + 22);
  ctx.fillStyle = afford ? '#ffd700' : '#aa6633'; ctx.font = 'bold 12px Arial';
  ctx.fillText(priceText, x + w - 14, y + h - 12);
  ctx.textAlign = 'left';
}

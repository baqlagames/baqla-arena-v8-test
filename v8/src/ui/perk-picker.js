export function drawPerkPickerScreen(ctx, view) {
  const W = view.width, H = view.height;
  const perks = view.perks || [];
  const unlocked = new Set(view.unlockedPerks || []);
  const selected = view.selectedPerks || [];
  const slots = view.slots || 1;
  const beans = view.beans || 0;
  const maxStage = view.maxStage || 1;
  const labels = {
    back: 'BACK',
    battle: 'BATTLE ->',
    unlock: 'UNLOCK',
    selected: 'SELECTED',
    locked: 'LOCKED',
    scrollHint: 'v scroll v',
    ...view.labels,
  };

  ctx.fillStyle = '#081414';
  ctx.fillRect(0, 0, W, H);
  const hg = ctx.createLinearGradient(0, 0, 0, 62);
  hg.addColorStop(0, '#18342b');
  hg.addColorStop(1, '#0b1c18');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, W, 62);
  ctx.fillStyle = '#6ee7b7';
  ctx.fillRect(0, 60, W, 2);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(slots === 1 ? 'PICK 1 PERK' : 'PICK UP TO ' + slots + ' PERKS', W / 2, 27);
  ctx.font = '12px Arial';
  ctx.fillStyle = selected.length > 0 ? '#ffd166' : '#aab0c0';
  ctx.fillText('Selected: ' + selected.length + ' / ' + slots + '    Beans: ' + beans, W / 2, 48);
  view.drawPillBtn(14, 18, 80, 28, labels.back, '#2f3b55', '#fff');
  if (selected.length > 0) view.drawPillBtn(W - 104, 18, 94, 28, labels.battle, '#2e9f6d', '#fff');

  const cardW = W - 32, cardH = 112, startX = 16;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 62, W, H - 62);
  ctx.clip();
  let y = 76 - (view.scroll || 0);
  for (const perk of perks) {
    const visible = perk.unlockStage <= maxStage;
    const isUnlocked = unlocked.has(perk.id);
    const isSelected = selected.includes(perk.id);
    const canAfford = beans >= (perk.cost || 0);
    const cy = y;
    if (cy + cardH < 62 || cy > H) {
      y += cardH + 10;
      continue;
    }
    if (isSelected) {
      ctx.shadowColor = perk.color || '#ffd166';
      ctx.shadowBlur = 10;
      ctx.fillStyle = perk.color || '#ffd166';
      ctx.beginPath();
      ctx.roundRect(startX - 2, cy - 2, cardW + 4, cardH + 4, 12);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = visible ? '#13241f' : '#151923';
    ctx.beginPath();
    ctx.roundRect(startX, cy, cardW, cardH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(startX + 0.5, cy + 0.5, cardW - 1, cardH - 1, 10);
    ctx.stroke();
    ctx.fillStyle = visible ? (perk.color || '#6ee7b7') : '#4b5563';
    ctx.beginPath();
    ctx.roundRect(startX, cy, 6, cardH, 3);
    ctx.fill();

    ctx.fillStyle = visible ? (perk.color || '#6ee7b7') : '#4b5563';
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(startX + 48, cy + 48, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = visible ? (perk.color || '#6ee7b7') : '#6b7280';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText((perk.tag || 'PERK').toUpperCase(), startX + 48, cy + 52);

    ctx.textAlign = 'left';
    ctx.fillStyle = visible ? '#fff' : '#8a8f99';
    ctx.font = 'bold 17px Arial';
    ctx.fillText(perk.name, startX + 88, cy + 28);
    ctx.fillStyle = visible ? '#cbd5df' : '#6b7280';
    ctx.font = '12px Arial';
    view.wrapText(perk.desc, startX + 88, cy + 50, cardW - 126, 15);

    let badgeText;
    let badgeBg;
    let badgeFg = '#fff';
    if (!visible) {
      badgeText = 'STAGE ' + perk.unlockStage;
      badgeBg = '#384152';
    } else if (isSelected) {
      badgeText = labels.selected;
      badgeBg = '#2e9f6d';
    } else if (isUnlocked) {
      badgeText = 'TAP TO SELECT';
      badgeBg = '#2f6f55';
    } else if (canAfford) {
      badgeText = labels.unlock + ' ' + perk.cost;
      badgeBg = '#8a6a20';
    } else {
      badgeText = labels.locked + ' ' + perk.cost;
      badgeBg = '#4b2f2f';
      badgeFg = '#ffb0a6';
    }
    const bw = Math.max(86, ctx.measureText(badgeText).width + 18);
    ctx.fillStyle = badgeBg;
    ctx.beginPath();
    ctx.roundRect(startX + cardW - bw - 14, cy + cardH - 30, bw, 20, 7);
    ctx.fill();
    ctx.fillStyle = badgeFg;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, startX + cardW - bw / 2 - 14, cy + cardH - 16);
    y += cardH + 10;
  }
  ctx.restore();
  if (perks.length * (cardH + 10) > H - 130) {
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(labels.scrollHint, W / 2, H - 12);
  }
  ctx.textAlign = 'left';
}

export function perkPickMaxScroll(perkCount, height) {
  return Math.max(0, perkCount * 122 - (height - 130));
}

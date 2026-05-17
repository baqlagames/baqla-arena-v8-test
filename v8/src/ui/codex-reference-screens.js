export function createCodexReferenceScreens(deps) {
  const ctx = deps.ctx;
  const PLAYER_UNITS = deps.playerUnits;
  const VODKA = deps.vodka;
  const ARENA_ARMOR_MATRIX = deps.armorMatrix;
  const ARENA_DEFENSE_MATRIX = deps.defenseMatrix;
  const ARENA_PLAYER_ARMOR_TYPE = deps.playerArmorType;
  let W = 500, H = 1000, arena = null;

  const arena_threatTagColor = (...args) => deps.threatTagColor(...args);
  const arena_rgba = (...args) => deps.rgba(...args);

  function sync() {
    const v = typeof deps.view === 'function' ? deps.view() : {};
    W = v.width || W;
    H = v.height || H;
    arena = v.arena || arena;
  }

  function drawBackButton(y) {
    if (!arena) return;
    arena._codexBackY = Math.min(H - 46, y + 8);
    const by = arena._codexBackY;
    ctx.fillStyle = 'rgba(80,40,40,0.85)';
    ctx.beginPath(); ctx.roundRect(14, by, W - 28, 32, 12); ctx.fill();
    ctx.fillStyle = '#ffaaaa'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
    ctx.fillText('BACK TO LIST', W / 2, by + 20);
    ctx.textAlign = 'left';
  }

  function drawHeroCard(y, tone) {
    const heroH = 68;
    const gradient = ctx.createLinearGradient(0, y, 0, y + heroH);
    gradient.addColorStop(0, tone.bg0);
    gradient.addColorStop(1, tone.bg1);
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.roundRect(14, y, W - 28, heroH, 14); ctx.fill();
    ctx.fillStyle = tone.color;
    ctx.beginPath(); ctx.roundRect(14, y, 4, heroH, 2); ctx.fill();
    ctx.fillStyle = '#888'; ctx.font = '9px Arial'; ctx.textAlign = 'left';
    ctx.fillText('REFERENCE', 26, y + 18);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Arial';
    ctx.fillText(tone.title, 26, y + 42);
    ctx.fillStyle = tone.subColor; ctx.font = '10px Arial';
    ctx.fillText(tone.subtitle, 26, y + 58);
    return y + heroH + tone.after;
  }

  function drawThreatsLegend() {
    sync();
    let y = drawHeroCard(80, {
      title: 'Threat Types',
      subtitle: 'Tags shown on next-wave panel - match damage type to armor.',
      color: '#5ac8ec',
      subColor: '#9bdaef',
      bg0: 'rgba(20,40,60,0.95)',
      bg1: 'rgba(8,18,32,0.95)',
      after: 10
    });

    const drawTagRow = (tag, desc, counter) => {
      const rowH = 26;
      const bg = ctx.createLinearGradient(0, y, 0, y + rowH);
      bg.addColorStop(0, 'rgba(28,28,46,0.55)');
      bg.addColorStop(1, 'rgba(15,15,28,0.55)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.roundRect(14, y, W - 28, rowH, 8); ctx.fill();

      const color = arena_threatTagColor(tag);
      ctx.font = '700 9px Segoe UI';
      const chipW = Math.max(56, ctx.measureText(tag).width + 18);
      ctx.fillStyle = arena_rgba(color, 0.20);
      ctx.beginPath(); ctx.roundRect(20, y + 5, chipW, 16, 8); ctx.fill();
      ctx.strokeStyle = arena_rgba(color, 0.55); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(20.5, y + 5.5, chipW - 1, 15, 8); ctx.stroke();
      ctx.fillStyle = color; ctx.textAlign = 'center';
      ctx.fillText(tag, 20 + chipW / 2, y + 16);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#e5e7eb'; ctx.font = '10px Segoe UI';
      ctx.fillText(desc, 28 + chipW, y + 12);
      if (counter) {
        ctx.fillStyle = '#888'; ctx.font = '9px Segoe UI';
        ctx.fillText('> ' + counter, 28 + chipW, y + 22);
      }
      y += rowH + 4;
    };

    const drawSection = label => {
      ctx.fillStyle = '#5ac8ec'; ctx.font = '600 9px Segoe UI'; ctx.textAlign = 'left';
      ctx.fillText(label, 20, y + 12);
      ctx.strokeStyle = 'rgba(90,200,236,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(20 + ctx.measureText(label).width + 8, y + 9); ctx.lineTo(W - 20, y + 9); ctx.stroke();
      y += 18;
    };

    drawSection('ARMOR TYPES');
    drawTagRow('HEAVY', 'Heavy armor - physical and pierce are reduced', 'Bring MAGIC');
    drawTagRow('WARDED', 'Magic-warded - magic is heavily reduced', 'Bring PHYSICAL or PIERCE');
    drawTagRow('UNARMORED', 'No armor - pierce shines', 'PIERCE preferred');
    drawSection('MOVEMENT / SPECIAL');
    drawTagRow('FLYING', 'Airborne - melee physical cannot hit', 'Zaatar / Casters / Holy Bolt');
    drawTagRow('BURROW', 'Untargetable until it surfaces', 'Place a back-line defender');
    drawTagRow('BACKLINE', 'Bypasses tanks and hunts your back row', 'Body-block or burst quickly');
    drawTagRow('STEALTH', 'Invisible until first hit', 'First-strike units bait it out');
    drawSection('ROLE');
    drawTagRow('SWARM', 'Many low-HP units in one wave', 'AoE / cleave clears');
    drawTagRow('TANK', 'High HP front-liner that soaks taunts', 'Burst through with magic / pierce');
    drawTagRow('DPS', 'High-damage melee threat', 'Tank wall + focus fire');
    drawTagRow('AOE', 'Splash on basic attacks', 'Spread squad to avoid double hits');
    drawTagRow('RANGED', 'Back-line shooter', 'Close gap or counter-snipe');
    drawTagRow('CASTER', 'Magic projectile + chain bolt', 'Healer + magic resistance');
    drawTagRow('ASSASSIN', 'High burst, fast, picks targets', 'Tank line + sustain back row');
    drawSection('BOSS / SPECIAL');
    drawTagRow('BOSS', 'Stage-final boss with slower ability rotation', 'Read kit before engaging');
    drawTagRow('BARRIER', 'Heal-the-wall encounter (S7)', 'Bring a HEALER');
    drawTagRow('AERIAL', 'Boss flies until lieutenants die (S12)', 'Defeat 3 lieutenants');
    drawTagRow('ELITE', 'Stronger version of an act enemy', 'Treat as mini-boss');
    drawBackButton(y);
  }

  function drawMatrixTable(state, title, subtitle, matrix, colLabels, rowLabels, colColors, rowColors) {
    let { y } = state;
    ctx.fillStyle = '#ffaa44'; ctx.font = '600 10px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillText(title, 20, y + 12);
    ctx.fillStyle = '#888'; ctx.font = '9px Segoe UI';
    ctx.fillText(subtitle, 20 + ctx.measureText(title).width + 8, y + 12);
    ctx.strokeStyle = 'rgba(255,170,68,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, y + 16); ctx.lineTo(W - 20, y + 16); ctx.stroke();
    y += 24;

    const pad = 14, cellW = Math.floor((W - pad * 2 - 70) / colLabels.length), cellH = 28, headH = 32;
    const sx = pad + 70;
    for (let c = 0; c < colLabels.length; c++) {
      const cx = sx + c * cellW;
      ctx.fillStyle = colColors[c] || '#888'; ctx.globalAlpha = 0.15;
      ctx.beginPath(); ctx.roundRect(cx + 2, y, cellW - 4, headH - 4, 6); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = colColors[c] || '#aaa'; ctx.font = 'bold 9px Segoe UI'; ctx.textAlign = 'center';
      ctx.fillText(colLabels[c], cx + cellW / 2, y + headH / 2 + 3);
    }
    y += headH;

    for (let r = 0; r < rowLabels.length; r++) {
      const ry = y + r * (cellH + 2);
      ctx.fillStyle = rowColors[r] || '#888'; ctx.globalAlpha = 0.15;
      ctx.beginPath(); ctx.roundRect(pad, ry, 66, cellH - 2, 6); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = rowColors[r] || '#aaa'; ctx.font = 'bold 9px Segoe UI'; ctx.textAlign = 'center';
      ctx.fillText(rowLabels[r], pad + 33, ry + cellH / 2 + 2);
      const row = matrix[rowLabels[r].toLowerCase()] || matrix[rowLabels[r]];
      for (let c = 0; c < colLabels.length; c++) {
        const cx = sx + c * cellW;
        const val = row ? row[colLabels[c].toLowerCase()] : 1.0;
        let bg, fg;
        if (val < 0.80) { bg = 'rgba(60,180,60,0.18)'; fg = '#55dd55'; }
        else if (val < 0.95) { bg = 'rgba(60,140,60,0.12)'; fg = '#88cc88'; }
        else if (val > 1.10) { bg = 'rgba(200,50,50,0.18)'; fg = '#ff6666'; }
        else if (val > 1.02) { bg = 'rgba(180,80,40,0.12)'; fg = '#dd9966'; }
        else { bg = 'rgba(100,100,100,0.10)'; fg = '#999'; }
        ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(cx + 2, ry, cellW - 4, cellH - 2, 6); ctx.fill();
        ctx.fillStyle = fg; ctx.font = 'bold 10px Segoe UI'; ctx.textAlign = 'center';
        ctx.fillText((val * 100).toFixed(0) + '%', cx + cellW / 2, ry + cellH / 2 + 3);
      }
    }
    state.y = y + rowLabels.length * (cellH + 2) + 10;
  }

  function drawUnitArmorTypes(state) {
    let { y } = state;
    ctx.fillStyle = '#ffaa44'; ctx.font = '600 10px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillText('YOUR UNIT ARMOR TYPES', 20, y + 12);
    ctx.strokeStyle = 'rgba(255,170,68,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, y + 16); ctx.lineTo(W - 20, y + 16); ctx.stroke();
    y += 24;

    const armorNames = { plate: 'PLATE', mail: 'MAIL', leather: 'LEATHER', cloth: 'CLOTH' };
    const armorColors = { plate: '#6688bb', mail: '#88aa66', leather: '#bb8844', cloth: '#aa66cc' };
    const groups = { plate: [], mail: [], leather: [], cloth: [] };
    for (const key in ARENA_PLAYER_ARMOR_TYPE) {
      const armorType = ARENA_PLAYER_ARMOR_TYPE[key];
      const unit = key === '99' ? VODKA : PLAYER_UNITS[parseInt(key, 10)];
      if (unit && groups[armorType]) groups[armorType].push(unit.name);
    }
    for (const armorType of ['plate', 'mail', 'leather', 'cloth']) {
      if (!groups[armorType].length) continue;
      const rowH = 22;
      ctx.fillStyle = armorColors[armorType]; ctx.globalAlpha = 0.18;
      ctx.beginPath(); ctx.roundRect(20, y, W - 40, rowH, 6); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = armorColors[armorType]; ctx.font = 'bold 9px Segoe UI'; ctx.textAlign = 'left';
      ctx.fillText(armorNames[armorType], 28, y + 14);
      ctx.fillStyle = '#ccc'; ctx.font = '9px Segoe UI';
      ctx.fillText(groups[armorType].join(', '), 80, y + 14);
      y += rowH + 4;
    }
    state.y = y + 6;
  }

  function drawArmorMatrix() {
    sync();
    const state = { y: drawHeroCard(80, {
      title: 'Armor Matrix',
      subtitle: 'Damage multipliers - how attack types interact with armor.',
      color: '#ffaa44',
      subColor: '#ffcc88',
      bg0: 'rgba(40,20,20,0.95)',
      bg1: 'rgba(18,8,12,0.95)',
      after: 14
    }) };

    drawMatrixTable(state, 'OFFENSE', 'Your attacks vs enemy armor',
      ARENA_ARMOR_MATRIX,
      ['Unarmored', 'Heavy', 'Warded', 'Boss'],
      ['Physical', 'Pierce', 'Magic'],
      ['#cccccc', '#6688bb', '#bb66ee', '#cc4444'],
      ['#ccaa88', '#88cc88', '#aa88ff']);

    drawUnitArmorTypes(state);

    drawMatrixTable(state, 'DEFENSE', 'Enemy attacks vs your armor',
      ARENA_DEFENSE_MATRIX,
      ['Plate', 'Mail', 'Leather', 'Cloth'],
      ['Physical', 'Pierce', 'Magic'],
      ['#6688bb', '#88aa66', '#bb8844', '#aa66cc'],
      ['#ccaa88', '#88cc88', '#aa88ff']);

    ctx.fillStyle = '#666'; ctx.font = '9px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillText('Green = reduced damage (good)   Red = extra damage (bad)', 20, state.y + 8);
    drawBackButton(state.y + 20);
  }

  return { drawThreatsLegend, drawArmorMatrix };
}

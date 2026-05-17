export function drawCodexScreen(ctx, view) {
  const {
    width: W,
    height: H,
    codexUnit,
    codexScroll,
    playerUnits: PLAYER_UNITS,
    vodka: VODKA,
    unitBranches: ARENA_UNIT_BRANCHES,
    drawPillButton: drawPillBtn,
    drawThreatsLegend: drawCodexThreatsLegend,
    drawArmorMatrix: drawCodexArmorMatrix,
    drawDetail: drawCodexDetail,
  } = view;
  // Backdrop with gradient
  const _bg=ctx.createLinearGradient(0,0,0,H);
  _bg.addColorStop(0,'#1a0e2a');_bg.addColorStop(1,'#06060f');
  ctx.fillStyle=_bg;ctx.fillRect(0,0,W,H);
  // ===== HEADER CARD =====
  const _hY=14,_hH=58;
  const _hg=ctx.createLinearGradient(0,_hY,0,_hY+_hH);
  _hg.addColorStop(0,'rgba(40,30,68,0.95)');_hg.addColorStop(1,'rgba(20,15,40,0.95)');
  ctx.fillStyle=_hg;ctx.beginPath();ctx.roundRect(10,_hY,W-20,_hH,16);ctx.fill();
  ctx.fillStyle='#9b59b6';ctx.beginPath();ctx.roundRect(10,_hY,4,_hH,2);ctx.fill();
  ctx.fillStyle='#888';ctx.font='9px Arial';ctx.textAlign='left';
  ctx.fillText('REFERENCE',24,_hY+18);
  ctx.fillStyle='#fff';ctx.font='bold 22px Arial';
  ctx.fillText('CODEX',24,_hY+44);
  // Subtitle on the right side of header
  ctx.fillStyle='#aab0c0';ctx.font='10px Arial';ctx.textAlign='right';
  ctx.fillText('Tap a unit for L1-L4 details',W-104,_hY+30);
  ctx.fillText(codexUnit<0?(PLAYER_UNITS.length+1)+' units':' ',W-104,_hY+44);
  // Close button Ã¢â‚¬â€ pill (still drawn via drawPillBtn for hit-test)
  drawPillBtn(W-90,_hY+_hH/2-13,76,26,'CLOSE','#7a3a3a','#fff');
  if(codexUnit<0){
    let yo=_hY+_hH+12-codexScroll;
    ctx.textAlign='left';
    const archColors={tank:'#3aa84e',melee:'#cc4040',ranged:'#5a8aff',healer:'#4cd97a'};
    const _rowH=66;
    for(let i=0;i<PLAYER_UNITS.length;i++){
      const u=PLAYER_UNITS[i];
      const ry=yo+i*(_rowH+6);
      if(ry+_rowH<_hY+_hH||ry>H-30)continue;
      // Card row Ã¢â‚¬â€ gradient + soft border
      const _cg=ctx.createLinearGradient(0,ry,0,ry+_rowH);
      _cg.addColorStop(0,'rgba(28,28,46,0.95)');_cg.addColorStop(1,'rgba(15,15,28,0.95)');
      ctx.fillStyle=_cg;ctx.beginPath();ctx.roundRect(12,ry,W-24,_rowH,14);ctx.fill();
      // Top shine
      const _shG=ctx.createLinearGradient(0,ry,0,ry+12);
      _shG.addColorStop(0,'rgba(255,255,255,0.06)');_shG.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=_shG;ctx.beginPath();ctx.roundRect(12,ry,W-24,12,14);ctx.fill();
      // Archetype stripe
      ctx.fillStyle=archColors[u.arch]||'#666';
      ctx.beginPath();ctx.roundRect(12,ry,4,_rowH,2);ctx.fill();
      // Icon Ã¢â‚¬â€ bigger, more polish
      ctx.fillStyle=u.color;
      ctx.beginPath();ctx.roundRect(22,ry+10,52,46,10);ctx.fill();
      ctx.fillStyle=u.accent;ctx.beginPath();ctx.arc(48,ry+33,18,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 9px Arial';ctx.textAlign='center';
      ctx.fillText(u.name.substring(0,7),48,ry+36);
      ctx.textAlign='left';
      // Text content
      ctx.fillStyle='#fff';ctx.font='bold 14px Arial';ctx.fillText(u.name,84,ry+22);
      // Role pill (left-aligned, archetype color)
      const _roleC=archColors[u.arch]||'#666';
      ctx.font='9px Arial';
      const _rw=ctx.measureText(u.role).width+12;
      ctx.fillStyle=_roleC;ctx.globalAlpha=0.22;
      ctx.beginPath();ctx.roundRect(84,ry+30,_rw,14,7);ctx.fill();
      ctx.globalAlpha=1;
      ctx.fillStyle=_roleC;ctx.font='bold 9px Arial';ctx.textAlign='center';
      ctx.fillText(u.role.toUpperCase(),84+_rw/2,ry+40);
      ctx.textAlign='left';
      // Arabic subtitle
      ctx.fillStyle='#888';ctx.font='10px Arial';ctx.fillText(String(u.arch||'unit').toUpperCase(),84,ry+56);
      // Branch availability pill (right side)
      if(ARENA_UNIT_BRANCHES&&ARENA_UNIT_BRANCHES[i]){
        const _bw=78;
        ctx.fillStyle='#9b59b6';ctx.globalAlpha=0.22;
        ctx.beginPath();ctx.roundRect(W-_bw-44,ry+30,_bw,14,7);ctx.fill();
        ctx.globalAlpha=1;
        ctx.fillStyle='#cc99ff';ctx.font='bold 9px Arial';ctx.textAlign='center';
        ctx.fillText('L3 - 2 PATHS',W-_bw-44+_bw/2,ry+40);
        ctx.textAlign='left';
      }
      // Chevron
      ctx.fillStyle='#9b59b6';ctx.font='bold 18px Arial';ctx.textAlign='right';
      ctx.fillText('>',W-22,ry+_rowH/2+6);
      ctx.textAlign='left';
    }
    // Vodka entry Ã¢â‚¬â€ same style with gold hero theme
    const ry=yo+PLAYER_UNITS.length*(_rowH+6);
    if(ry+_rowH>=_hY+_hH&&ry<=H-30){
      const _vg=ctx.createLinearGradient(0,ry,0,ry+_rowH);
      _vg.addColorStop(0,'rgba(60,40,18,0.95)');_vg.addColorStop(1,'rgba(28,18,8,0.95)');
      ctx.fillStyle=_vg;ctx.beginPath();ctx.roundRect(12,ry,W-24,_rowH,14);ctx.fill();
      const _shG=ctx.createLinearGradient(0,ry,0,ry+12);
      _shG.addColorStop(0,'rgba(255,210,100,0.10)');_shG.addColorStop(1,'rgba(255,210,100,0)');
      ctx.fillStyle=_shG;ctx.beginPath();ctx.roundRect(12,ry,W-24,12,14);ctx.fill();
      ctx.fillStyle='#ff8c00';ctx.beginPath();ctx.roundRect(12,ry,4,_rowH,2);ctx.fill();
      // Hero icon Ã¢â‚¬â€ Vodka
      ctx.fillStyle='#d2691e';ctx.beginPath();ctx.roundRect(22,ry+10,52,46,10);ctx.fill();
      ctx.fillStyle='#3a8e3a';ctx.fillRect(46,ry+15,6,5);
      ctx.fillStyle='#ffeb3b';ctx.fillRect(40,ry+30,3,2);ctx.fillRect(54,ry+30,3,2);
      ctx.fillStyle='#fff';ctx.font='bold 14px Arial';ctx.textAlign='left';ctx.fillText(VODKA.name,84,ry+22);
      // HERO badge pill
      ctx.font='9px Arial';
      const _hw=ctx.measureText('HERO').width+12;
      ctx.fillStyle='#ff8c00';ctx.globalAlpha=0.30;
      ctx.beginPath();ctx.roundRect(84,ry+30,_hw,14,7);ctx.fill();
      ctx.globalAlpha=1;
      ctx.fillStyle='#ffb060';ctx.font='bold 9px Arial';ctx.textAlign='center';
      ctx.fillText('HERO',84+_hw/2,ry+40);
      // Role pill next to HERO
      ctx.font='9px Arial';
      const _rw2=ctx.measureText(VODKA.role).width+12;
      ctx.fillStyle='#ff8c00';ctx.globalAlpha=0.18;
      ctx.beginPath();ctx.roundRect(84+_hw+4,ry+30,_rw2,14,7);ctx.fill();
      ctx.globalAlpha=1;
      ctx.fillStyle='#ffb060';ctx.font='bold 9px Arial';ctx.textAlign='center';
      ctx.fillText(VODKA.role.toUpperCase(),84+_hw+4+_rw2/2,ry+40);
      ctx.textAlign='left';
      ctx.fillStyle='#888';ctx.font='10px Arial';ctx.fillText('HERO',84,ry+56);
      // Branch pill
      if(ARENA_UNIT_BRANCHES&&ARENA_UNIT_BRANCHES[99]){
        const _bw=78;
        ctx.fillStyle='#ff8c00';ctx.globalAlpha=0.22;
        ctx.beginPath();ctx.roundRect(W-_bw-44,ry+30,_bw,14,7);ctx.fill();
        ctx.globalAlpha=1;
        ctx.fillStyle='#ffb060';ctx.font='bold 9px Arial';ctx.textAlign='center';
        ctx.fillText('L3 - 2 PATHS',W-_bw-44+_bw/2,ry+40);
        ctx.textAlign='left';
      }
      ctx.fillStyle='#ff8c00';ctx.font='bold 18px Arial';ctx.textAlign='right';
      ctx.fillText('>',W-22,ry+_rowH/2+6);
      ctx.textAlign='left';
    }
    // ===== THREAT TYPES tile (codexUnit=100) Ã¢â‚¬â€ counter-comp legend =====
    const tRy=yo+(PLAYER_UNITS.length+1)*(_rowH+6);
    if(tRy+_rowH>=_hY+_hH&&tRy<=H-30){
      const _tg=ctx.createLinearGradient(0,tRy,0,tRy+_rowH);
      _tg.addColorStop(0,'rgba(20,40,60,0.95)');_tg.addColorStop(1,'rgba(8,18,32,0.95)');
      ctx.fillStyle=_tg;ctx.beginPath();ctx.roundRect(12,tRy,W-24,_rowH,14);ctx.fill();
      const _shG=ctx.createLinearGradient(0,tRy,0,tRy+12);
      _shG.addColorStop(0,'rgba(120,200,255,0.10)');_shG.addColorStop(1,'rgba(120,200,255,0)');
      ctx.fillStyle=_shG;ctx.beginPath();ctx.roundRect(12,tRy,W-24,12,14);ctx.fill();
      // Cyan accent stripe (matches threats panel WARDED color)
      ctx.fillStyle='#5ac8ec';ctx.beginPath();ctx.roundRect(12,tRy,4,_rowH,2);ctx.fill();
      // Icon Ã¢â‚¬â€ color-grid mosaic (3Ãƒâ€”3 of tag colors)
      ctx.fillStyle='#5ac8ec';ctx.beginPath();ctx.roundRect(22,tRy+10,52,46,10);ctx.fill();
      const _miniColors=['#ff5a4a','#5ac8ec','#fbbf24','#7dd3fc','#c08a4a','#c084fc','#fb923c','#e879f9','#a855f7'];
      for(let i=0;i<9;i++){const cx=28+(i%3)*15,cy=tRy+16+Math.floor(i/3)*13;ctx.fillStyle=_miniColors[i];ctx.beginPath();ctx.roundRect(cx,cy,11,9,2);ctx.fill();}
      // Title + role pill
      ctx.fillStyle='#fff';ctx.font='bold 14px Arial';ctx.textAlign='left';
      ctx.fillText('Threat Types',84,tRy+22);
      ctx.font='9px Arial';
      const _twTag=ctx.measureText('REFERENCE').width+12;
      ctx.fillStyle='#5ac8ec';ctx.globalAlpha=0.22;
      ctx.beginPath();ctx.roundRect(84,tRy+30,_twTag,14,7);ctx.fill();
      ctx.globalAlpha=1;
      ctx.fillStyle='#9bdaef';ctx.font='bold 9px Arial';ctx.textAlign='center';
      ctx.fillText('REFERENCE',84+_twTag/2,tRy+40);
      ctx.textAlign='left';
      ctx.fillStyle='#888';ctx.font='10px Arial';
      ctx.fillText('Counter-comp guide for armor / movement / role',84,tRy+56);
      ctx.fillStyle='#5ac8ec';ctx.font='bold 18px Arial';ctx.textAlign='right';
      ctx.fillText('>',W-22,tRy+_rowH/2+6);
      ctx.textAlign='left';
    }
    // ===== ARMOR MATRIX tile (codexUnit=101) =====
    const amRy=yo+(PLAYER_UNITS.length+2)*(_rowH+6);
    if(amRy+_rowH>=_hY+_hH&&amRy<=H-30){
      const _ag=ctx.createLinearGradient(0,amRy,0,amRy+_rowH);
      _ag.addColorStop(0,'rgba(40,20,20,0.95)');_ag.addColorStop(1,'rgba(18,8,12,0.95)');
      ctx.fillStyle=_ag;ctx.beginPath();ctx.roundRect(12,amRy,W-24,_rowH,14);ctx.fill();
      const _shA=ctx.createLinearGradient(0,amRy,0,amRy+12);
      _shA.addColorStop(0,'rgba(255,180,100,0.10)');_shA.addColorStop(1,'rgba(255,180,100,0)');
      ctx.fillStyle=_shA;ctx.beginPath();ctx.roundRect(12,amRy,W-24,12,14);ctx.fill();
      ctx.fillStyle='#ffaa44';ctx.beginPath();ctx.roundRect(12,amRy,4,_rowH,2);ctx.fill();
      ctx.fillStyle='#ffaa44';ctx.beginPath();ctx.roundRect(22,amRy+10,52,46,10);ctx.fill();
      ctx.fillStyle='#332211';ctx.font='bold 20px Arial';ctx.textAlign='center';
      ctx.fillText('ATK',48,amRy+40);
      ctx.fillStyle='#fff';ctx.font='bold 14px Arial';ctx.textAlign='left';
      ctx.fillText('Armor Matrix',84,amRy+22);
      ctx.font='9px Arial';
      const _amTag=ctx.measureText('REFERENCE').width+12;
      ctx.fillStyle='#ffaa44';ctx.globalAlpha=0.22;
      ctx.beginPath();ctx.roundRect(84,amRy+30,_amTag,14,7);ctx.fill();
      ctx.globalAlpha=1;
      ctx.fillStyle='#ffcc88';ctx.font='bold 9px Arial';ctx.textAlign='center';
      ctx.fillText('REFERENCE',84+_amTag/2,amRy+40);
      ctx.textAlign='left';
      ctx.fillStyle='#888';ctx.font='10px Arial';
      ctx.fillText('Attack vs Defense type damage multipliers',84,amRy+56);
      ctx.fillStyle='#ffaa44';ctx.font='bold 18px Arial';ctx.textAlign='right';
      ctx.fillText('>',W-22,amRy+_rowH/2+6);
      ctx.textAlign='left';
    }
  }else if(codexUnit===100){
    drawCodexThreatsLegend();
  }else if(codexUnit===101){
    drawCodexArmorMatrix();
  }else{
    drawCodexDetail();
  }
}

import { drawManageBranchCard, drawManageSpecCard } from './manage-panel-cards.js';

export function createManagePanelRenderer(deps) {
  const ctx = deps.ctx;
  const PLAYER_UNITS = deps.playerUnits;
  const VODKA = deps.vodka;
  const ARENA_UNIT_BRANCHES = deps.unitBranches;
  const ARENA_MAX_UNIT_LEVEL = deps.maxUnitLevel;
  const ARENA_BASE_SIGNATURES = deps.baseSignatures;
  const ARENA_BRANCH_SIGNATURES = deps.branchSignatures;
  const sellRefundForCell = deps.sellRefundForCell;
  let W = 500, H = 1000, arena = null, gold = 0, frame = 0, drawFns = {}, ARENA_SIGNATURES = {};

  const arena_isRoleRootCell = (...args) => deps.isRoleRootCell(...args);
  const arena_roleSpecs = (...args) => deps.roleSpecs(...args);
  const arena_specById = (...args) => deps.specById(...args);
  const arena_cellPathMeta = (...args) => deps.cellPathMeta(...args);
  const arena_roleRoot = (...args) => deps.roleRoot(...args);
  const arena_drawSkillSlots = (...args) => deps.drawSkillSlots(...args);
  const getStats = (...args) => deps.getStats(...args);
  const arena_upgradeCostFor = (...args) => deps.upgradeCostFor(...args);
  const arena_pathUpgradeCost = (...args) => deps.pathUpgradeCost(...args);
  const arena_pathDetails = (...args) => deps.pathDetails(...args);
  const arena_baseSpec = (...args) => deps.baseSpec(...args);
  const arena_sigDisplayFc = (...args) => deps.sigDisplayFc(...args);
  const arena_sigDisplayCd = (...args) => deps.sigDisplayCd(...args);
  const arena_baseHeadline = (...args) => deps.baseHeadline(...args);
  const arena_branchHeadline = (...args) => deps.branchHeadline(...args);
  const arena_nextUnlockBrief = (...args) => deps.nextUnlockBrief(...args);
  const arena_wrapTextClamped = (...args) => deps.wrapTextClamped(...args);

  function sync() {
    const v = typeof deps.view === 'function' ? deps.view() : {};
    W = v.width || W;
    H = v.height || H;
    arena = v.arena || arena;
    gold = v.gold || 0;
    frame = v.frame || 0;
    drawFns = v.drawFns || drawFns;
    ARENA_SIGNATURES = v.signatures || ARENA_SIGNATURES;
  }

function arena_drawManagePanel(){
  sync();
  const c=arena.cells[arena.managePanelCell.key];if(!c){arena.managePanelCell=null;arena._mgrSelectedSpec=null;return}
  const roleSpecsPreview=arena_isRoleRootCell(c)?arena_roleSpecs(c.roleId):null;
  let selectedRoleSpecPreview=roleSpecsPreview&&arena._mgrSelectedSpec?arena_specById(c.roleId,arena._mgrSelectedSpec):null;
  if(roleSpecsPreview&&arena._mgrSelectedSpec&&!selectedRoleSpecPreview){arena._mgrSelectedSpec=null;selectedRoleSpecPreview=null}
  const previewPath=(selectedRoleSpecPreview&&selectedRoleSpecPreview.pathDefs.length===1)?selectedRoleSpecPreview.pathDefs[0]:null;
  const previewUnitIdx=previewPath?previewPath.unitIdx:(selectedRoleSpecPreview?selectedRoleSpecPreview.unitIdx:c.unitIdx);
  const previewBranch=previewPath?(previewPath.branch||null):c.branch;
  const previewLevel=previewPath?3:c.level;
  const baseDef=previewUnitIdx===99?VODKA:PLAYER_UNITS[previewUnitIdx];
  const branchDef=previewBranch&&ARENA_UNIT_BRANCHES[previewUnitIdx]?ARENA_UNIT_BRANCHES[previewUnitIdx][previewBranch]:null;
  const pathMeta=previewPath||arena_cellPathMeta(c);
  const rootMeta=c.roleId&&!c.pathId&&!selectedRoleSpecPreview?arena_roleRoot(c.roleId):null;
  const headerName=selectedRoleSpecPreview&&!previewPath?selectedRoleSpecPreview.name:(pathMeta?pathMeta.name:(rootMeta?rootMeta.name:(branchDef?branchDef.name:baseDef.name)));
  const headerRole=selectedRoleSpecPreview&&!previewPath?selectedRoleSpecPreview.role:(pathMeta?pathMeta.role:(rootMeta?rootMeta.role:(branchDef?branchDef.role:(baseDef.role||baseDef.arch))));
  const headerColor=rootMeta?rootMeta.color:(branchDef?branchDef.color:baseDef.color);
  // Backdrop + soft overlay (Apple-style modal sheet)
  ctx.fillStyle='rgba(6,8,18,0.86)';ctx.fillRect(0,0,W,H);
  const _mgrS=arena._mgrScroll||0;
  // ===== HEADER CARD (unit identity) =====
  const hCardX=16,hCardY=18-_mgrS,hCardW=W-32,hCardH=78;
  // Subtle gradient background
  const hg=ctx.createLinearGradient(0,hCardY,0,hCardY+hCardH);
  hg.addColorStop(0,'#1c1c2e');hg.addColorStop(1,'#11111e');
  ctx.fillStyle=hg;ctx.beginPath();ctx.roundRect(hCardX,hCardY,hCardW,hCardH,14);ctx.fill();
  // Color stripe
  ctx.fillStyle=headerColor;ctx.beginPath();ctx.roundRect(hCardX,hCardY,4,hCardH,2);ctx.fill();
  // Unit icon (color square + accent dot, same shape as codex list)
  ctx.fillStyle=headerColor;ctx.beginPath();ctx.roundRect(hCardX+14,hCardY+13,52,52,8);ctx.fill();
  ctx.fillStyle=branchDef?branchDef.accent:(baseDef.accent||'#666');
  ctx.beginPath();ctx.arc(hCardX+40,hCardY+39,18,0,Math.PI*2);ctx.fill();
  // Title row
  // BUG FIX: measure headerName with the SAME font (18px) it was rendered
  // with Ã¢â‚¬â€ previous code measured at 11px after changing fonts, which
  // positioned the level pill far too close to (or overlapping) the unit name.
  ctx.fillStyle='#fff';ctx.font='bold 18px Arial';ctx.textAlign='left';
  ctx.fillText(headerName,hCardX+78,hCardY+26);
  const _nameW=ctx.measureText(headerName).width;  // measure at 18px (rendered font)
  // Level pill (gold) Ã¢â‚¬â€ fills inline
  const _lvLabel='L'+c.level;
  ctx.font='bold 11px Arial';
  const _lvW=ctx.measureText(_lvLabel).width+14;
  const _pillX=hCardX+78+_nameW+10;
  ctx.fillStyle='#3a2f10';ctx.beginPath();ctx.roundRect(_pillX,hCardY+12,_lvW,18,9);ctx.fill();
  ctx.fillStyle='#ffd700';ctx.fillText(_lvLabel,_pillX+_lvW/2-ctx.measureText(_lvLabel).width/2,hCardY+25);
  // Role
  ctx.font='12px Arial';ctx.fillStyle=headerColor;ctx.fillText(headerRole.toUpperCase(),hCardX+78,hCardY+44);
  // Gold counter (top-right of header card)
  ctx.font='bold 12px Arial';
  ctx.fillStyle='#ffd700';ctx.textAlign='right';
  ctx.fillText(gold+'g',hCardX+hCardW-14,hCardY+26);
  ctx.fillStyle='#888';ctx.font='9px Arial';ctx.fillText('GOLD',hCardX+hCardW-14,hCardY+39);
  ctx.textAlign='left';
  // ===== STATS CARD (compact two-column) =====
  const sCardX=16,sCardY=hCardY+hCardH+10,sCardW=W-32,sCardH=64;
  ctx.fillStyle='#13132a';ctx.beginPath();ctx.roundRect(sCardX,sCardY,sCardW,sCardH,12);ctx.fill();
  const stats=getStats(baseDef,previewLevel);
  // Apply branch statMod multipliers to the displayed stats
  const _viewStats={hp:stats.hp,dmg:stats.dmg,speed:stats.speed,range:stats.range||0,armor:stats.armor||0,magicRes:stats.magicRes||0,atkSpd:stats.atkSpd||60};
  if(branchDef&&branchDef.statMod){
    for(const k in branchDef.statMod){
      if(typeof _viewStats[k]==='number')_viewStats[k]=Math.round(_viewStats[k]*branchDef.statMod[k]*100)/100;
    }
  }
  const _statRow=(label,val,x,y,col)=>{
    ctx.fillStyle='#888';ctx.font='9px Arial';ctx.textAlign='left';
    ctx.fillText(label,x,y);
    ctx.fillStyle=col||'#fff';ctx.font='bold 13px Arial';
    ctx.fillText(val,x,y+15);
  };
  const _col1=sCardX+18,_col2=sCardX+sCardW/3+8,_col3=sCardX+(sCardW/3)*2+4;
  _statRow('HP',_viewStats.hp,_col1,sCardY+18,'#ff8a8a');
  _statRow('DMG',_viewStats.dmg,_col2,sCardY+18,'#ffb060');
  _statRow('SPD',_viewStats.speed.toFixed(2),_col3,sCardY+18);
  _statRow('RANGE',_viewStats.range,_col1,sCardY+44);
  _statRow('ARMOR',_viewStats.armor,_col2,sCardY+44,'#aaccff');
  _statRow('MR',_viewStats.magicRes,_col3,sCardY+44,'#cc99ff');
  arena._mgrRects={};
  let _curY=sCardY+sCardH+12;
  // ===== SKILLS BREAKDOWN =====
  const _skillsH=arena_drawSkillSlots(hCardX,_curY,hCardW,previewUnitIdx,previewLevel,previewBranch);
  _curY+=_skillsH+10;
  // ===== BRANCH FORK or NEXT UNLOCK preview + UPGRADE BUTTON =====
  const roleSpecs=roleSpecsPreview;
  let selectedRoleSpec=selectedRoleSpecPreview;
  if(roleSpecs&&arena._mgrSelectedSpec&&!selectedRoleSpec)arena._mgrSelectedSpec=null;
  const rolePathOptions=selectedRoleSpec?selectedRoleSpec.pathDefs:null;
  const branchOptions=roleSpecs?null:ARENA_UNIT_BRANCHES[c.unitIdx];
  const showRoleSpecPicker=!!(roleSpecs&&roleSpecs.length&&!selectedRoleSpec);
  const showRolePathFork=!!(selectedRoleSpec&&rolePathOptions&&rolePathOptions.length);
  const showBranchFork=!showRolePathFork&&c.level===2&&!c.branch&&branchOptions;
  if(c.level<ARENA_MAX_UNIT_LEVEL){
    // Per-pick price: base path uses the unit's mult; branch picks layer the
    // branch surcharge (via max() in arena_upgradeMult). Bug fix Ã¢â‚¬â€ previously all
    // three fork cards displayed the same cost (the unit-base mult), so a
    // surcharged branch like Foul Mudammas (1.40) would still show the base
    // 125g instead of 140g. Now each card prices itself.
    const _costForBranch=(branchKey)=>{
      const _tmpC=branchKey?{...c,branch:branchKey}:c;
      return Math.max(1,Math.round(arena_upgradeCostFor(_tmpC)));
    };
    const cost=_costForBranch(null);  // base / non-fork path
    const costA=showBranchFork?_costForBranch('a'):cost;
    const costB=showBranchFork?_costForBranch('b'):cost;
    const can=gold>=cost;
    const _drawBranchCard=(x,y,w,h,bgColor,stripeColor,title,subtitle,headline,sigLine,price,affordableColor,detailLines)=>{
      drawManageBranchCard(ctx,{x,y,w,h,bgColor,stripeColor,title,subtitle,headline,sigLine,price,affordableColor,detailLines,gold,wrapTextClamped:arena_wrapTextClamped});
    };
    const _rootLabel=(rootMeta?rootMeta.name.replace(/\s*Root$/,''):'Role');
    const _sigInfoForPath=(path)=>{
      const _sigId=path.branch?ARENA_BRANCH_SIGNATURES[path.unitIdx+'_'+path.branch]:ARENA_BASE_SIGNATURES[path.unitIdx];
      const _s=_sigId&&ARENA_SIGNATURES[_sigId];
      if(!_s)return null;
      return {name:_s.name,fc:arena_sigDisplayFc(_s.cd),cd:arena_sigDisplayCd(_s.cd,3),label:'SIG'};
    };
    const _drawSpecCard=(x,y,w,h,spec)=>{
      drawManageSpecCard(ctx,{x,y,w,h,spec,cell:c,gold,frame,drawFns,playerUnits:PLAYER_UNITS,vodka:VODKA,unitBranches:ARENA_UNIT_BRANCHES,pathUpgradeCost:arena_pathUpgradeCost,wrapTextClamped:arena_wrapTextClamped});
    };
    if(showRoleSpecPicker){
      ctx.fillStyle='#cc99ff';ctx.font='bold 11px Arial';ctx.textAlign='left';
      ctx.fillText('CHOOSE '+_rootLabel.toUpperCase()+' UNIT',hCardX,_curY+10);
      _curY+=22;
      const _bw=hCardW,_bh=84,_bgap=7;
      arena._mgrRects.specs=[];
      for(let si=0;si<roleSpecs.length;si++){
        const spec=roleSpecs[si];
        _drawSpecCard(hCardX,_curY,_bw,_bh,spec);
        arena._mgrRects.specs.push({x:hCardX,y:_curY,w:_bw,h:_bh,specId:spec.id,name:spec.name});
        _curY+=_bh+_bgap;
      }
      _curY+=4;
    }else if(showRolePathFork){
      ctx.fillStyle='#cc99ff';ctx.font='bold 11px Arial';ctx.textAlign='left';
      const _pathTitle=rolePathOptions.length>1
        ? 'CHOOSE '+(selectedRoleSpec?selectedRoleSpec.name.toUpperCase():_rootLabel.toUpperCase())+' PATH'
        : 'CONFIRM '+rolePathOptions[0].name.toUpperCase();
      ctx.fillText(_pathTitle,hCardX,_curY+10);
      const _backW=62,_backH=22,_backX=hCardX+hCardW-_backW,_backY=_curY-4;
      ctx.fillStyle='#1a1a2a';ctx.beginPath();ctx.roundRect(_backX,_backY,_backW,_backH,10);ctx.fill();
      ctx.strokeStyle='#55556a';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(_backX+0.5,_backY+0.5,_backW-1,_backH-1,10);ctx.stroke();
      ctx.fillStyle='#cfd5e0';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText('BACK',_backX+_backW/2,_backY+14);
      arena._mgrRects.back={x:_backX,y:_backY,w:_backW,h:_backH};
      ctx.textAlign='left';
      _curY+=22;
      const _bw=hCardW,_bh=132,_bgap=6;
      arena._mgrRects.paths=[];
      for(let pi=0;pi<rolePathOptions.length;pi++){
        const path=rolePathOptions[pi];
        const pathBranch=path.branch&&ARENA_UNIT_BRANCHES[path.unitIdx]?ARENA_UNIT_BRANCHES[path.unitIdx][path.branch]:null;
        const pathBase=path.unitIdx===99?VODKA:PLAYER_UNITS[path.unitIdx];
        const stripeColor=(pathBranch&&pathBranch.color)||path.color||(pathBase&&pathBase.color)||'#5a8aff';
        const bgColor=pi%2?'#1a223a':'#1c2c1c';
        const price=arena_pathUpgradeCost(c,path);
        const _sub=path.role.toUpperCase()+(rolePathOptions.length>1?' - final path':' - tap to confirm');
        _drawBranchCard(hCardX,_curY,_bw,_bh,bgColor,stripeColor,path.name+' L3',_sub,path.headline,_sigInfoForPath(path),price,'#cfe0ff',arena_pathDetails(path));
        arena._mgrRects.paths.push({x:hCardX,y:_curY,w:_bw,h:_bh,pathId:path.id,name:path.name});
        _curY+=_bh+_bgap;
      }
      _curY+=4;
    }else if(showBranchFork){
      // ===== BRANCH FORK =====
      // Section header
      ctx.fillStyle='#cc99ff';ctx.font='bold 11px Arial';ctx.textAlign='left';
      ctx.fillText('CHOOSE YOUR PATH - locked once chosen',hCardX,_curY+10);
      _curY+=22;
      const _drawBranchCard=(x,y,w,h,bgColor,stripeColor,title,subtitle,headline,sigLine,price,affordableColor)=>{
        drawManageBranchCard(ctx,{x,y,w,h,bgColor,stripeColor,title,subtitle,headline,sigLine,price,affordableColor,gold,wrapTextClamped:arena_wrapTextClamped});
      };
      // Card height bumped 96 Ã¢â€ â€™ 116 to fit longer spec descriptions (Protection
      // tank, Holy healer, etc.) without overlapping sig info. With the new
      // layout (sig moved to top-right) the body has 116-58 = 58 px = ~4 lines.
      const _bw=hCardW,_bh=116,_bgap=6;
      // Each card now shows passives headline + signature suffix (cooldown visible).
      // Each card has structured rows: title/price, subtitle, Ã¢Ëœâ€¦ passives,
      // Ã¢Å¡Â¡ signature (auto-fired ult). Signature info is now its own visual block.
      const _sigInfo=(branchKey)=>{
        const _sigId=branchKey?ARENA_BRANCH_SIGNATURES[c.unitIdx+'_'+branchKey]:ARENA_BASE_SIGNATURES[c.unitIdx];
        const _s=_sigId&&ARENA_SIGNATURES[_sigId];
        if(!_s)return null;
        return {name:_s.name,fc:arena_sigDisplayFc(_s.cd),cd:arena_sigDisplayCd(_s.cd,3),label:'SIG'};
      };
      // Continue base Ã¢â‚¬â€ for WoW-class units, label as the real Spec 1 name
      // (e.g. "Affliction" for Foul, "Retribution" for Zayt). For standalones
      // (tanks, Felfel, Jazar, Rumman, Vodka, Zaatar), fall back to "Continue".
      const _baseSpec=arena_baseSpec(c.unitIdx);
      const _baseTitle=_baseSpec
        ? (baseDef.name+': '+_baseSpec.name+' L3')
        : ('Continue: '+baseDef.name+' L3');
      const _baseSubtitle=_baseSpec
        ? (_baseSpec.role+' - locks spec at L3')
        : 'Stay on the base path';
      _drawBranchCard(hCardX,_curY,_bw,_bh,'#1c2c1c','#3aa84e',_baseTitle,_baseSubtitle,arena_baseHeadline(c.unitIdx),_sigInfo(null),cost,'#aaff90');
      arena._mgrRects.upgrade={x:hCardX,y:_curY,w:_bw,h:_bh};
      _curY+=_bh+_bgap;
      // Branch A Ã¢â‚¬â€ uses costA so a surcharged branch (e.g. Bakdounes Akhdar
      // Ãƒâ€”1.30) shows its real upgrade price, not the base mult.
      const _ba=branchOptions.a;
      _drawBranchCard(hCardX,_curY,_bw,_bh,'#1a223a','#5a8aff',_ba.name+' L3',_ba.role.toUpperCase()+' - locks branch at L3',arena_branchHeadline(c.unitIdx,'a'),_sigInfo('a'),costA,'#cfe0ff');
      arena._mgrRects.branchA={x:hCardX,y:_curY,w:_bw,h:_bh};
      _curY+=_bh+_bgap;
      // Branch B Ã¢â‚¬â€ same fix.
      const _bb=branchOptions.b;
      _drawBranchCard(hCardX,_curY,_bw,_bh,'#2a1a3a','#c87aff',_bb.name+' L3',_bb.role.toUpperCase()+' - locks branch at L3',arena_branchHeadline(c.unitIdx,'b'),_sigInfo('b'),costB,'#f0d0ff');
      arena._mgrRects.branchB={x:hCardX,y:_curY,w:_bw,h:_bh};
      _curY+=_bh+_bgap+4;
    }else{
      // ===== SINGLE UPGRADE Ã¢â‚¬â€ show NEXT UNLOCK preview above the button =====
      const nextU=arena_nextUnlockBrief(c.unitIdx,c.level,c.branch);
      if(nextU){
        const _toneColor={unlock:'#3aa84e',gold:'#ffd700',stat:'#5a8aff'}[nextU.tone]||'#888';
        ctx.fillStyle='#13132a';ctx.beginPath();ctx.roundRect(hCardX,_curY,hCardW,58,12);ctx.fill();
        ctx.fillStyle=_toneColor;ctx.beginPath();ctx.roundRect(hCardX,_curY,4,58,2);ctx.fill();
        // Tone badge (top-right corner)
        ctx.fillStyle=_toneColor;ctx.font='bold 9px Arial';ctx.textAlign='right';
        ctx.fillText('NEXT - L'+(c.level+1),hCardX+hCardW-14,_curY+16);
        // Title + desc
        ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.textAlign='left';
        ctx.fillText(nextU.label,hCardX+14,_curY+22);
        ctx.fillStyle='#aab0c0';ctx.font='10px Arial';
        ctx.fillText(nextU.desc,hCardX+14,_curY+40);
        _curY+=58+10;
      }
      // Upgrade button (full-width, big)
      const _ux=hCardX,_uw=hCardW,_uh=54;
      ctx.fillStyle=can?'#3aa84e':'#3a3a4a';
      ctx.beginPath();ctx.roundRect(_ux,_curY,_uw,_uh,12);ctx.fill();
      // Button shine
      const _bg=ctx.createLinearGradient(0,_curY,0,_curY+_uh);
      _bg.addColorStop(0,'rgba(255,255,255,0.10)');_bg.addColorStop(1,'rgba(0,0,0,0.10)');
      ctx.fillStyle=_bg;ctx.beginPath();ctx.roundRect(_ux,_curY,_uw,_uh,12);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 15px Arial';ctx.textAlign='center';
      ctx.fillText('UPGRADE > L'+(c.level+1),W/2,_curY+22);
      ctx.font='bold 12px Arial';ctx.fillStyle=can?'#ffe066':'#aa6633';
      ctx.fillText(cost+'g',W/2,_curY+42);
      arena._mgrRects.upgrade={x:_ux,y:_curY,w:_uw,h:_uh};
      _curY+=_uh+10;
    }
  }else{
    // Max level reached
    ctx.fillStyle='#3a2f10';ctx.beginPath();ctx.roundRect(hCardX,_curY,hCardW,38,12);ctx.fill();
    ctx.fillStyle='#ffd700';ctx.font='bold 13px Arial';ctx.textAlign='center';
    ctx.fillText('MAX LEVEL - L'+ARENA_MAX_UNIT_LEVEL,W/2,_curY+24);
    _curY+=48;
  }
  // ===== SELL + CLOSE Ã¢â‚¬â€ SIDE-BY-SIDE in one row (no more overlap risk) =====
  // Each takes ~half the panel width. Sell: red outline. Close: gray pill.
  const refund=sellRefundForCell(c,arena_roleRoot);
  const _btnH=40,_btnGap=8;
  const _btnW=Math.floor((hCardW-_btnGap)/2);
  // SELL on left
  const _sellX=hCardX;
  ctx.fillStyle='#3a1a18';ctx.beginPath();ctx.roundRect(_sellX,_curY,_btnW,_btnH,12);ctx.fill();
  ctx.strokeStyle='#aa3322';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(_sellX+0.5,_curY+0.5,_btnW-1,_btnH-1,12);ctx.stroke();
  ctx.fillStyle='#ff8866';ctx.font='bold 13px Arial';ctx.textAlign='center';
  ctx.fillText('SELL',_sellX+_btnW/2-22,_curY+24);
  ctx.fillStyle='#ffd700';ctx.font='bold 12px Arial';
  ctx.fillText('+'+refund+'g',_sellX+_btnW/2+22,_curY+24);
  arena._mgrRects.sell={x:_sellX,y:_curY,w:_btnW,h:_btnH};
  // CLOSE on right
  const _closeX=hCardX+_btnW+_btnGap;
  ctx.fillStyle='#1a1a2a';ctx.beginPath();ctx.roundRect(_closeX,_curY,_btnW,_btnH,12);ctx.fill();
  ctx.strokeStyle='#3a3a4e';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(_closeX+0.5,_curY+0.5,_btnW-1,_btnH-1,12);ctx.stroke();
  ctx.fillStyle='#cfd5e0';ctx.font='bold 13px Arial';ctx.textAlign='center';
  ctx.fillText('CLOSE',_closeX+_btnW/2,_curY+25);
  arena._mgrRects.close={x:_closeX,y:_curY,w:_btnW,h:_btnH};
  ctx.textAlign='left';
  arena._mgrMaxScroll=Math.max(0,(_curY+_btnH+20+_mgrS)-H);
}

  return { drawManagePanel: arena_drawManagePanel };
}

import { createCodexReferenceScreens } from './codex-reference-screens.js?v=20260523-dragon-judgment-hud';

export function createCodexDetailRuntime(deps) {
  const ctx = deps.ctx;
  const PLAYER_UNITS = deps.playerUnits;
  const VODKA = deps.vodka;
  const ARENA_UNIT_BRANCHES = deps.unitBranches;
  const ARENA_ATTACK_TYPE_BY_UNIT = deps.attackTypeByUnit;
  const ARENA_ARMOR_MATRIX = deps.armorMatrix;
  const ARENA_DEFENSE_MATRIX = deps.defenseMatrix;
  const ARENA_PLAYER_ARMOR_TYPE = deps.playerArmorType;
  const ARENA_BASE_SIGNATURES = deps.baseSignatures;
  const ARENA_BRANCH_SIGNATURES = deps.branchSignatures;
  const ARENA_SPEC_HALO_COLORS = deps.specHaloColors;
  const ARENA_MAX_UNIT_LEVEL = deps.maxUnitLevel;
  let W = 500, H = 1000, arena = null, codexUnit = -1, codexScroll = 0, drawFns = {};
  let unitLevels = [], vodkaLevel = 1, frame = 0, ARENA_SIGNATURES = {};
  let foughtBosses = [];

  const arena_threatTagColor = (...args) => deps.threatTagColor(...args);
  const arena_rgba = (...args) => deps.rgba(...args);
  const getStats = (...args) => deps.getStats(...args);
  const arena_baseSpec = (...args) => deps.baseSpec(...args);
  const arena_isCapstoneLevel = (...args) => deps.isCapstoneLevel(...args);
  const drawPillBtn = (...args) => deps.drawPillBtn(...args);
  const drawVodka = (...args) => deps.drawVodka(...args);
  const getCurrentUnitPassives = (...args) => deps.currentUnitPassives(...args);
  const getSignatureDisplayCooldown = (...args) => deps.signatureDisplayCooldown(...args);
  const getSignatureDisplayFirstCast = (...args) => deps.signatureDisplayFirstCast(...args);
  const getSignatureIdForUnit = (...args) => deps.signatureIdForUnit(...args);
  const codexReferenceScreens = createCodexReferenceScreens({
    ctx,
    playerUnits: PLAYER_UNITS,
    vodka: VODKA,
    armorMatrix: ARENA_ARMOR_MATRIX,
    defenseMatrix: ARENA_DEFENSE_MATRIX,
    playerArmorType: ARENA_PLAYER_ARMOR_TYPE,
    view: () => ({ width: W, height: H, arena, foughtBosses }),
    threatTagColor: arena_threatTagColor,
    rgba: arena_rgba
  });

  function sync() {
    const v = typeof deps.view === 'function' ? deps.view() : {};
    W = v.width || W;
    H = v.height || H;
    arena = v.arena || arena;
    codexUnit = v.codexUnit == null ? codexUnit : v.codexUnit;
    codexScroll = v.codexScroll || 0;
    unitLevels = v.unitLevels || unitLevels;
    vodkaLevel = v.vodkaLevel || vodkaLevel;
    frame = v.frame || 0;
    ARENA_SIGNATURES = v.signatures || ARENA_SIGNATURES;
    drawFns = v.drawFns || drawFns;
    foughtBosses = Array.isArray(v.foughtBosses) ? v.foughtBosses : foughtBosses;
  }

function drawCodexThreatsLegend(){return codexReferenceScreens.drawThreatsLegend()}
function drawCodexArmorMatrix(){return codexReferenceScreens.drawArmorMatrix()}
function drawCodexBossMechanics(){return codexReferenceScreens.drawBossMechanics()}
function drawCodexDetail(){
  const u=codexUnit===99?VODKA:PLAYER_UNITS[codexUnit];
  // ===== HERO CARD with REAL UNIT SPRITE Ã¢â‚¬â€ compressed to 76 px =====
  let y=80;
  const _heroH=76;
  const _hg=ctx.createLinearGradient(0,y,0,y+_heroH);
  _hg.addColorStop(0,'rgba(28,28,46,0.95)');_hg.addColorStop(1,'rgba(15,15,28,0.95)');
  ctx.fillStyle=_hg;ctx.beginPath();ctx.roundRect(14,y,W-28,_heroH,14);ctx.fill();
  const _shG=ctx.createLinearGradient(0,y,0,y+12);
  _shG.addColorStop(0,'rgba(255,255,255,0.08)');_shG.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=_shG;ctx.beginPath();ctx.roundRect(14,y,W-28,12,14);ctx.fill();
  ctx.fillStyle=u.color;ctx.beginPath();ctx.roundRect(14,y,4,_heroH,2);ctx.fill();
  const _spX=58,_spY=y+_heroH/2,_spR=28;
  // Pedestal background (subtle radial)
  const _pg=ctx.createRadialGradient(_spX,_spY,0,_spX,_spY,_spR+8);
  _pg.addColorStop(0,'rgba(255,255,255,0.10)');_pg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=_pg;ctx.beginPath();ctx.arc(_spX,_spY,_spR+8,0,Math.PI*2);ctx.fill();
  // Tinted disc behind sprite
  ctx.fillStyle=u.color;ctx.globalAlpha=0.15;
  ctx.beginPath();ctx.arc(_spX,_spY,_spR,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  if(u===VODKA){
    drawVodka(_spX,_spY,{size:22,color:u.color,accent:u.accent,leafColor:'#3a8e3a',facing:1,bobPhase:frame*0.05,furyTimer:0});
  }else if(drawFns[u.drawFn]){
    drawFns[u.drawFn](_spX,_spY,{size:20,color:u.color,accent:u.accent,facing:1,bobPhase:frame*0.05,
      hp:1,maxHp:1,stunned:0,furyTimer:0,armorBuff:0,bleedTimer:0,divineShield:false});
  }else{
    ctx.fillStyle=u.color;ctx.beginPath();ctx.roundRect(_spX-22,_spY-22,44,44,10);ctx.fill();
    ctx.fillStyle=u.accent;ctx.beginPath();ctx.arc(_spX,_spY,15,0,Math.PI*2);ctx.fill();
  }
  // Right side: name, role pill, Arabic Ã¢â‚¬â€ compressed
  ctx.fillStyle='#fff';ctx.font='bold 18px Arial';ctx.textAlign='left';
  ctx.fillText(u.name,100,y+24);
  ctx.font='9px Arial';
  const _rw=ctx.measureText(u.role.toUpperCase()).width+12;
  ctx.fillStyle=u.color;ctx.globalAlpha=0.25;
  ctx.beginPath();ctx.roundRect(100,y+32,_rw,14,7);ctx.fill();
  ctx.globalAlpha=1;
  ctx.fillStyle=u.color;ctx.font='bold 9px Arial';ctx.textAlign='center';
  ctx.fillText(u.role.toUpperCase(),100+_rw/2,y+42);
  // ATTACK TYPE chip Ã¢â‚¬â€ color-coded so the player learns the matrix at a glance.
  const _atkT=ARENA_ATTACK_TYPE_BY_UNIT[codexUnit]||'physical';
  const _atkLabel={physical:'PHYSICAL',pierce:'PIERCE',magic:'MAGIC'}[_atkT]||'PHYSICAL';
  const _atkCol={physical:'#cccccc',pierce:'#ffd700',magic:'#aa66ff'}[_atkT]||'#cccccc';
  ctx.font='9px Arial';
  const _aw=ctx.measureText(_atkLabel).width+12;
  const _ax=100+_rw+6;
  ctx.fillStyle=_atkCol;ctx.globalAlpha=0.22;
  ctx.beginPath();ctx.roundRect(_ax,y+32,_aw,14,7);ctx.fill();
  ctx.globalAlpha=1;
  ctx.strokeStyle=_atkCol;ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(_ax,y+32,_aw,14,7);ctx.stroke();
  ctx.fillStyle=_atkCol;ctx.font='bold 9px Arial';ctx.textAlign='center';
  ctx.fillText(_atkLabel,_ax+_aw/2,y+42);
  ctx.textAlign='left';
  y+=_heroH+8;
  // ===== SKILLS BREAKDOWN (base path) =====
  const _skillsH=arena_drawSkillSlots(14,y,W-28,codexUnit,5,null);
  y+=_skillsH+8;
  // ===== Branch / Spec options preview (L2Ã¢â€ â€™L3 fork) =====
  const _idx=codexUnit;
  const _branchSet=ARENA_UNIT_BRANCHES&&ARENA_UNIT_BRANCHES[_idx];
  const _baseSpecCx=arena_baseSpec(_idx);
  // WoW-class units (entries in ARENA_BASE_SPECS) get the 3-spec stacked layout;
  // standalones keep the legacy 2-branch side-by-side layout.
  if(_baseSpecCx && _branchSet){
    // ===== 3-SPEC STACKED LAYOUT (WoW-class units) =====
    const _cardH=72;
    const _sectionH=24+3*(_cardH+6)+2;
    ctx.fillStyle='#1a1a2a';
    ctx.beginPath();ctx.roundRect(14,y,W-28,_sectionH,8);ctx.fill();
    ctx.fillStyle='#aa66cc';ctx.beginPath();ctx.roundRect(14,y,4,_sectionH,2);ctx.fill();
    ctx.fillStyle='#cc99ff';ctx.font='bold 12px Arial';ctx.textAlign='left';
    ctx.fillText('CHOOSE YOUR SPEC - locks at L2->L3',24,y+16);
    // Helper: draw one spec card stacked horizontally.
    // key: 'base'|'a'|'b' ; def: spec data ; sigId: signature id
    const _drawSpecRow=(_key,_specName,_specRole,_specColor,_atkType,_sigId,_blurb,_rowY)=>{
      const _rx=20,_rw=W-40,_rh=_cardH;
      ctx.fillStyle='#0e0e1c';
      ctx.beginPath();ctx.roundRect(_rx,_rowY,_rw,_rh,6);ctx.fill();
      ctx.fillStyle=_specColor;
      ctx.beginPath();ctx.roundRect(_rx,_rowY,4,_rh,2);ctx.fill();
      // Title row: spec name LEFT, sig name RIGHT
      ctx.fillStyle='#fff';ctx.font='bold 12px Arial';ctx.textAlign='left';
      ctx.fillText(_specName,_rx+12,_rowY+14);
      const _sig=_sigId&&ARENA_SIGNATURES[_sigId];
      if(_sig){
        ctx.fillStyle='#ffd700';ctx.font='bold 10px Arial';ctx.textAlign='right';
        ctx.fillText('SIG '+_sig.name,_rx+_rw-10,_rowY+14);
        // Shortened CD format ("3s/30s") to free horizontal space Ã¢â‚¬â€ keeps the
        // right-aligned text from colliding with role+chip on the left.
        ctx.fillStyle='#888';ctx.font='8px Arial';
        ctx.fillText(arena_sigDisplayFc(_sig.cd)+'s/'+arena_sigDisplayCd(_sig.cd,3)+'s',_rx+_rw-10,_rowY+26);
      }
      // Sub-row: role LEFT + attackType chip immediately after role.
      // BUG FIX: previously measured role width AFTER changing font from 9px
      // to 8px Ã¢â‚¬â€ the smaller measurement positioned the chip OVER the role
      // text. Now we measure with the same font that rendered the role text.
      ctx.textAlign='left';
      ctx.fillStyle=_specColor;ctx.font='bold 9px Arial';
      const _roleLabel=_specRole.toUpperCase();
      const _roleW=ctx.measureText(_roleLabel).width;  // measure at 9px (rendered font)
      ctx.fillText(_roleLabel,_rx+12,_rowY+27);
      // attackType chip Ã¢â‚¬â€ color matches matrix legend (PHYS grey, PIERCE gold, MAGIC purple)
      if(_atkType){
        const _atkLabel={physical:'PHYS',pierce:'PIERCE',magic:'MAGIC'}[_atkType]||'PHYS';
        const _atkCol={physical:'#cccccc',pierce:'#ffd700',magic:'#aa66ff'}[_atkType]||'#cccccc';
        ctx.font='bold 8px Arial';
        const _ar=ctx.measureText(_atkLabel).width+10;
        const _ax=_rx+12+_roleW+8;  // use the 9px-measured role width
        ctx.fillStyle=_atkCol;ctx.globalAlpha=0.22;
        ctx.beginPath();ctx.roundRect(_ax,_rowY+19,_ar,12,6);ctx.fill();
        ctx.globalAlpha=1;
        ctx.strokeStyle=_atkCol;ctx.lineWidth=0.7;
        ctx.beginPath();ctx.roundRect(_ax,_rowY+19,_ar,12,6);ctx.stroke();
        ctx.fillStyle=_atkCol;ctx.textAlign='center';
        ctx.fillText(_atkLabel,_ax+_ar/2,_rowY+28);
        ctx.textAlign='left';
      }
      // Body Ã¢â‚¬â€ wrapped blurb describing key passives
      ctx.fillStyle='#dde3ee';ctx.font='9px Arial';
      wrapText(_blurb,_rx+12,_rowY+44,_rw-22,11);
    };
    // Spec 1: base path
    const _baseSig=ARENA_BASE_SIGNATURES[_idx];
    const _baseHaloCol=ARENA_SPEC_HALO_COLORS[_idx+'_base']||'#cc99ff';
    const _baseAtk=ARENA_ATTACK_TYPE_BY_UNIT[_idx];
    _drawSpecRow('base',u.name+': '+_baseSpecCx.name,_baseSpecCx.role,_baseHaloCol,_baseAtk,_baseSig,arena_baseHeadline(_idx),y+24);
    // Spec 2: branch a
    const _ba=_branchSet.a;
    if(_ba){
      const _aHaloCol=ARENA_SPEC_HALO_COLORS[_idx+'_a']||_ba.color;
      const _aAtk=_ba.branchAttackType||_baseAtk;
      _drawSpecRow('a',_ba.name,_ba.role,_aHaloCol,_aAtk,ARENA_BRANCH_SIGNATURES[_idx+'_a'],arena_branchHeadline(_idx,'a'),y+24+_cardH+6);
    }
    // Spec 3: branch b
    const _bb=_branchSet.b;
    if(_bb){
      const _bHaloCol=ARENA_SPEC_HALO_COLORS[_idx+'_b']||_bb.color;
      const _bAtk=_bb.branchAttackType||_baseAtk;
      _drawSpecRow('b',_bb.name,_bb.role,_bHaloCol,_bAtk,ARENA_BRANCH_SIGNATURES[_idx+'_b'],arena_branchHeadline(_idx,'b'),y+24+2*(_cardH+6));
    }
    y+=_sectionH+10;
    // Note: NO separate base-signature card needed since Spec 1's row already
    // shows the base sig with name + CD. Skip the legacy base-sig card below.
  } else if(_branchSet){
    // ===== LEGACY 2-BRANCH SIDE-BY-SIDE LAYOUT (standalones) =====
    const _bh=110;
    ctx.fillStyle='#1a1a2a';
    ctx.beginPath();ctx.roundRect(14,y,W-28,_bh,8);ctx.fill();
    ctx.fillStyle='#aa66cc';ctx.beginPath();ctx.roundRect(14,y,4,_bh,2);ctx.fill();
    ctx.fillStyle='#cc99ff';ctx.font='bold 12px Arial';ctx.textAlign='left';
    ctx.fillText('CLASS BRANCHES - choose at L2->L3',24,y+18);
    const _cw=(W-28-24)/2;
    for(let _bi=0;_bi<2;_bi++){
      const _key=_bi===0?'a':'b';
      const _bd=_branchSet[_key];
      if(!_bd)continue;
      const _bx=20+_bi*(_cw+8);
      const _by=y+28;
      const _ch=_bh-36;
      ctx.fillStyle='#0e0e1c';
      ctx.beginPath();ctx.roundRect(_bx,_by,_cw,_ch,6);ctx.fill();
      ctx.fillStyle=_bd.color;
      ctx.beginPath();ctx.roundRect(_bx,_by,4,_ch,2);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 11px Arial';ctx.textAlign='left';
      ctx.fillText(_bd.name,_bx+10,_by+14);
      const _sigId=ARENA_BRANCH_SIGNATURES[_idx+'_'+_key];
      const _sig=_sigId&&ARENA_SIGNATURES[_sigId];
      if(_sig){
        ctx.fillStyle='#ffd700';ctx.font='bold 9px Arial';ctx.textAlign='right';
        ctx.fillText('SIG '+_sig.name,_bx+_cw-8,_by+14);
        ctx.fillStyle='#888';ctx.font='8px Arial';
        ctx.fillText(arena_sigDisplayFc(_sig.cd)+'s/'+arena_sigDisplayCd(_sig.cd,3)+'s',_bx+_cw-8,_by+26);
      }
      ctx.fillStyle=_bd.color;ctx.font='bold 9px Arial';ctx.textAlign='left';
      ctx.fillText(_bd.role.toUpperCase(),_bx+10,_by+26);
      ctx.fillStyle='#dde3ee';ctx.font='9px Arial';
      wrapText(arena_branchHeadline(_idx,_key),_bx+10,_by+42,_cw-16,11);
    }
    y+=_bh+10;
  }
  // Base signature card Ã¢â‚¬â€ only shown for standalone units (WoW-class units
  // already display their base sig inside Spec 1's row above).
  if(!_baseSpecCx){
    const _basesigId=ARENA_BASE_SIGNATURES[_idx];
    if(_basesigId&&ARENA_SIGNATURES[_basesigId]){
      const _bs=ARENA_SIGNATURES[_basesigId];
      const _sh=38;
      ctx.fillStyle='rgba(60,40,12,0.95)';
      ctx.beginPath();ctx.roundRect(14,y,W-28,_sh,10);ctx.fill();
      ctx.fillStyle='#ffd700';ctx.beginPath();ctx.roundRect(14,y,4,_sh,2);ctx.fill();
      ctx.fillStyle='#ffd700';ctx.font='bold 14px Arial';ctx.textAlign='left';
      ctx.fillText('SIG',24,y+24);
      ctx.fillStyle='#ffd700';ctx.font='bold 12px Arial';
      ctx.fillText(_bs.name,42,y+16);
      ctx.fillStyle='#888';ctx.font='9px Arial';
      ctx.fillText('BASE SIGNATURE - '+arena_sigDisplayFc(_bs.cd)+'s first - '+arena_sigDisplayCd(_bs.cd,3)+'s CD',42,y+30);
      ctx.textAlign='left';
      y+=_sh+8;
    }
  }
  // Stat table Ã¢â‚¬â€ compressed: header 26px, 5 rows Ãƒâ€” 18px = 90, total 116 (was 150)
  const _stH=26+5*18;
  ctx.fillStyle='#13132a';
  ctx.beginPath();ctx.roundRect(14,y,W-28,_stH,8);ctx.fill();
  ctx.fillStyle='#aaa';ctx.font='9px Arial';
  ctx.fillText('LV',24,y+18);ctx.fillText('HP',60,y+18);ctx.fillText('ATK',100,y+18);
  ctx.fillText('SPD',140,y+18);ctx.fillText('RNG',180,y+18);ctx.fillText('AR/MR',220,y+18);
  ctx.fillStyle='#88cc66';ctx.fillText('PASSIVES',280,y+18);
  for(let lv=1;lv<=5;lv++){
    const s=getStats(u,lv);
    const ry=y+26+(lv-1)*18;
    ctx.fillStyle=lv===1?'#88cc66':lv===3?'#ff8c00':lv===5?'#ffd700':'#888';
    ctx.font='bold 10px Arial';
    ctx.fillText('L'+lv,24,ry+11);
    ctx.fillStyle='#fff';ctx.font='9px Arial';
    ctx.fillText(s.hp+'',60,ry+11);
    ctx.fillText(s.dmg+'',100,ry+11);
    ctx.fillText(s.speed.toFixed(2),140,ry+11);
    ctx.fillText((s.range||0)+'',180,ry+11);
    ctx.fillText((s.armor||0)+'/'+(s.magicRes||0),220,ry+11);
    let pTxt='';
    if(lv===1)pTxt='P1';
    else if(lv===2)pTxt='P1';
    else if(lv===3)pTxt='P1+P2';
    else if(lv===4)pTxt='P1+P2';
    else if(lv===5)pTxt='P1+P2 (max)';
    ctx.fillStyle='#aaffaa';
    ctx.fillText(pTxt,280,ry+11);
  }
  // BACK TO LIST flows below stat table Ã¢â‚¬â€ NO clamp (was clamping to H-46
  // and overlapping L4/L5 rows on shorter screens). If layout exceeds H,
  // user needs a taller canvas Ã¢â‚¬â€ but the new compressed layout fits 600+.
  const _backY=y+_stH+10;
  drawPillBtn(14,_backY,W-28,32,'BACK TO LIST','#3a3a5e','#fff');
  arena._codexBackY=_backY;
}
function prettyAbil(s){return s.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase()).trim()}
function wrapText(text,x,y,maxW,lh){
  const words=text.split(' ');let line='',ly=y;
  for(let i=0;i<words.length;i++){
    const test=line?line+' '+words[i]:words[i];
    if(ctx.measureText(test).width>maxW&&line){
      ctx.fillText(line,x,ly);ly+=lh;line=words[i];
    }else{line=test}
  }
  if(line)ctx.fillText(line,x,ly);
}
// Like wrapText but caps at maxLines Ã¢â‚¬â€ appends "Ã¢â‚¬Â¦" to the last line if more
// text would have wrapped beyond. Prevents body overlapping sig info in the
// branch fork cards when a spec description is too long.
function arena_wrapTextClamped(text,x,y,maxW,lh,maxLines){
  const words=text.split(' ');let line='',ly=y,lineN=0;
  for(let i=0;i<words.length;i++){
    const test=line?line+' '+words[i]:words[i];
    if(ctx.measureText(test).width>maxW&&line){
      lineN++;
      if(lineN>=maxLines){
        // Last allowed line Ã¢â‚¬â€ append ellipsis if any words remain
        let _last=line;
        const _restWords=words.slice(i);
        if(_restWords.length>0){
          while(_last.length>3 && ctx.measureText(_last+'Ã¢â‚¬Â¦').width>maxW){
            _last=_last.slice(0,-1);
          }
          _last+='Ã¢â‚¬Â¦';
        }
        ctx.fillText(_last,x,ly);
        return;
      }
      ctx.fillText(line,x,ly);ly+=lh;line=words[i];
    }else{line=test}
  }
  if(line)ctx.fillText(line,x,ly);
}
// Passive id Ã¢â€ â€™ 2-3 word display title + 6-10 word "what it does" line.
// Used by the manage panel "NEXT UNLOCK" preview and branch cards so players
// can see the key effect of an upgrade choice without opening the codex.
function arena_passiveTitle(id){
  const m={
    tankCharge:'Shield Charge', shieldBash:'Shield Bash', bodyguardLine:'Bodyguard Line', guardPulse:'Guard Pulse',
    forwardStandard:'Forward Standard', armorCrack:'Armor Crack',
    block:'Block', ironSkin:'Iron Skin', deathGrip:'Death Grip', runeWound:'Rune Wound', soulReaper:'Soul Reaper',
    deathStrike:'Death Strike', bloodTithe:'Blood Tithe', soulChains:'Soul Chains', graveMagnet:'Grave Magnet',
    boneShield:'Bone Shield', plagueStrike:'Plague Strike', raiseGhoulPassive:'Raise Ghoul',
    lastStand:'Last Stand', cleave:'Cleave', crit:'Critical Strike', execute:'Execute',
    shadowStrike:'Shadow Strike', mirror:'Mirror Clone', garrote:'Garrote', sliceAndDice:'Slice and Dice',
    shadowDance:'Shadow Dance', eviscerate:'Eviscerate', bladeFlurry:'Blade Flurry', crimsonVial:'Crimson Vial',
    charge:'Charge', bash:'Bash',
    splash:'Splash', slowAura:'Slow Aura', curse:'Curse on Hit', drain:'Drain Life',
    agony:'Agony', unstableAffliction:'Unstable Affliction',
    demonicEmpowerment:'Demonic Empowerment', soulLink:'Soul Link',
    immolate:'Immolate', havoc:'Havoc',
    aimedShot:'Aimed Shot', pierce:'Pierce', autoTurret:'Auto-Turret', overclock:'Overclock',
    aimedShotMark:'Aimed Shot Mark', steadyFocus:'Steady Focus',
    explosiveTrap:'Trap Mastery', lockAndLoad:'Lock and Load',
    explosiveShot:'Explosive Shot', direBeast:'Dire Beast',
    killCommand:'Kill Command', bestialWrath:'Bestial Wrath',
    smiteHeal:'Smite + Heal', shield:'Shield Buff', healAura:'Heal Aura', cleanse:'Cleanse',
    lifebloom:'Lifebloom', efflorescence:'Efflorescence',
    toxicFlask:'Toxic Flask', corrosiveBrew:'Corrosive Brew',
    eclipseCycle:'Eclipse Cycle', astralPower:'Astral Power',
    wildGrowth:'Wild Growth', naturesBlessing:"Nature's Blessing",
    swiftmend:'Swiftmend', tranquility:'Tranquility',
    prayerOfMending:'Prayer of Mending', angelOfMercy:'Angel of Mercy',
    penance:'Penance', powerWordBarrier:'Power Word: Barrier',
    shadowWordPain:'Shadow Word: Pain', shadowApparitions:'Shadow Apparitions', vampiricEmbrace:'Vampiric Embrace',
    champion:"Champion's Aura", devour:'Devour',
    soothingAroma:'Soothing Aroma', essenceInfusion:'Essence Infusion',
    // Branch passives
    reflect:'Magic Reflect', frenzy:'Frenzy', magicWard:'Magic Ward', gripBleed:'Grip Bleed',
    armorRegen:'Armor Regen', reviveOnce:'Revive Once', backstab:'Backstab',
    whirlwind:'Whirlwind', vanish:'Vanish', twinSync:'Twin Sync',
    bladeRush:'Blade Rush', risingSlash:'Rising Slash',
    azureSen:'Azure Sen', thirdEye:'Third Eye',
    mortalStrike:'Mortal Strike', executeBlade:'Execute',
    windStep:'Wind Step', bladeDance:'Blade Dance', enrageBlade:'Enrage',
    hotStreak:'Hot Streak', ignite:'Ignite',
    pyromaniac:'Pyromaniac', firestarter:'Firestarter',
    frostbolt:'Frostbolt', shatter:'Shatter',
    overload:'Overload', stormkeeper:'Stormkeeper',
    strongSlow:'Heavy Slow Aura', frostBolt:'Frost Bolt', burnDot:'Burn DoT',
    plagueCloud:'Plague Cloud', minionExplode:'Exploding Minions',
    aimedSniper:'Sniper Shot', tripleShot:'Triple Shot',
    artilleryTurret:'Artillery Turret', munitionsCache:'Munitions Cache',
    mechSuit:'Flying Cannon', rocketPunch:'Rocket Punch',
    holyStrike:'Holy Strike', renewAura:'Renew Aura', resurrection:'Resurrection',
    bigHealAura:'Big Heal Aura', wildGrowth:'Wild Growth', purify:'Purify',
    antidoteField:'Antidote Field',
    personalWhirlwind:'Personal Whirlwind', bloodfury:'Bloodfury',
    battleStandard:'Battle Standard', essenceBond:'Essence Bond', prescientMist:'Prescient Mist', toxicBrew:'Toxic Brew', volatileMixture:'Volatile Mixture',
    meteor:'Meteor', flameCircle:'Flame Circle', flamestrike:'Flamestrike', fireElemental:'Fire Elemental',
    chainLightning:'Chain Lightning', waterElemental:'Water Elemental', stormElemental:'Storm Elemental',
    blizzard:'Blizzard',
    swordSaintCycle:'Sword Saint Cycle', judgmentSeals:'Judgment Seals',
    wingsOfLight:'Wings of Light', shieldOfVengeance:'Shield of Vengeance',
    avengersShield:"Avenger's Shield", ardentDefender:'Ardent Defender',
    lightOfDawn:'Light of Dawn', wordOfGlory:'Word of Glory',
    paladinWings:'Wings of Light', freedom:'Hand of Freedom',
    magicShield:'Magic Shield', vengeanceStrike:'Vengeance Strike',
    divineStorm:'Divine Storm', holyPower:'Holy Power',
    spellReflect:'Spell Reflect', demoralizingShout:'Demoralizing Shout',
    rallyCry:'Rally Cry',
    mudClap:'Mud Clap', batataRoleChoice:'Choose Batata Path',
    backlineGarden:'Backline Garden', mirebreaker:'Mirebreaker',
    ironfur:'Ironfur', thrashBleed:'Thrash Bleed',
    earthwarden:'Earthwarden', frenziedRegen:'Frenzied Regeneration',
    entanglingRoots:'Entangling Roots', rejuvAura:'Rejuvenation Aura',
    galacticGuardian:'Galactic Guardian', swipePassive:'Swipe'
  };
  return m[id]||id;
}
function arena_passiveShort(id){
  const m={
    tankCharge:'Leap onto a nearby enemy and stun', shieldBash:'Every 3rd hit dents enemy damage',
    bodyguardLine:'Nearby melee allies behind Zavs take less damage',
    guardPulse:'5th hit protects melee allies and taunts enemies',
    forwardStandard:'Nearby physical/pierce allies gain damage and speed',
    armorCrack:'5th hit makes enemies weaker to physical/pierce',
    block:'Chance to fully negate incoming hits',
    ironSkin:'Flat damage reduction on every hit', deathGrip:'Every 6s pulls a priority non-boss enemy and interrupts', runeWound:'3rd hit weakens non-boss enemy damage',
    soulReaper:'3 hits mark an enemy, then burst for massive damage',
    deathStrike:'5th hit heals Taoon and shields a low ally', bloodTithe:'Self-healing grants nearby low ally a shield',
    soulChains:'5th hit chains, slows, and interrupts grouped non-bosses', graveMagnet:'Death Grip prioritizes ranged/caster/support enemies',
    boneShield:'6 bone charges absorb hits, recharge over time',
    plagueStrike:'Attacks infect enemies with spreading plague DoT', raiseGhoulPassive:'30% chance on kill to raise a ghoul minion',
    lastStand:'Heavy damage reduction at low HP, once per wave', cleave:'Front-arc AoE on basic attack',
    crit:'Random heavy-damage hits', execute:'Bonus damage vs low-HP enemies',
    shadowStrike:'Stealth opener Ã¢â‚¬â€ huge first hit, prefers ranged', mirror:'Spawns a stealthed clone',
    garrote:'Stealth opener: Sap one enemy + Garrote (silence + bleed) main target',
    sliceAndDice:'Every 5th hit grants +40% attack speed for 5s',
    shadowDance:'Every 12s re-enter stealth (resets Garrote opener)',
    eviscerate:'Every 5th hit deals 3.5Ãƒâ€” bonus damage',
    bladeFlurry:'Attacks hit a second nearby target for 80% damage',
    crimsonVial:'Below 40% HP: heal 4% max HP/sec for 4s (15s CD)',
    charge:'Leap to backline, AoE + stun, one per round', bash:'Stun chance on hit',
    splash:'AoE around projectile impact', slowAura:'Slows enemies in range',
    curse:'Targets take more damage from all sources', drain:'Heal a portion of damage dealt',
    agony:'Attacks apply stacking Agony. At L3, 3 stacks trigger Curse Bloom and 5 curse applications call Fel Meteor.',
    unstableAffliction:'Enemies dying with Jafaar Agony burst and seed Agony to up to 3 nearby enemies',
    demonicEmpowerment:'Every 20s all minions gain +50% dmg and +30% atk speed for 6s',
    soulLink:'20% of damage taken by Jafaar is redirected to his strongest minion',
    immolate:'Attacks leave visible fire ground patches that burn enemies',
    havoc:'Mirrors damage from the primary target to a second enemy with a clear link beam',
    aimedShot:'Every few attacks: heavy shot + daze', pierce:'Arrows pass through to a second enemy',
    aimedShotMark:'Every 4th attack: 250% shot + Hunter\'s Mark (+20% dmg from all sources, 4s). Every 10th hit: Arrow Rain zone (5s) Ã¢â‚¬â€ attacks on targets inside splash to all enemies in the zone.',
    steadyFocus:'Standing still 2s: +25% attack speed while stationary',
    explosiveTrap:'Every 10s: place a trap (max 3). Cycles: Fire (250% AoE) Ã¢â€ â€™ Frost (40% slow 3s) Ã¢â€ â€™ Root (2s immobilize)',
    lockAndLoad:'Any trap detonation grants 3 bonus shots at +40% damage',
    killCommand:'Every 6th attack: pet lunges for 300% of Zaatar\'s damage',
    bestialWrath:'Every 18s: all pets enrage +50% dmg, +30% atk speed for 6s',
    autoTurret:'Every 10s: deploys a lighter utility turret (max 2)', overclock:'Every 7th attack: +30% attack speed for 3s',
    smiteHeal:'Each attack heals the lowest-HP ally', shield:'Shield bubble every few attacks',
    prayerOfMending:'Every 6s: attach a bouncing heal to a low ally (18% HP on damage, 5 jumps; 7 at L5)',
    angelOfMercy:'On first death: become an invulnerable healing spirit for 8s; 10s at L5',
    penance:'Every 5th attack: fires 5 rapid holy bolts + heals lowest ally',
    powerWordBarrier:'Every 14s: absorb shield on lowest ally (200+40/lvl)',
    shadowWordPain:'Attacks apply stronger shadow DoT (36%/s, 5s, stacks to 3). At 3 stacks: +7% dmg taken. Shadow Crash every 5th hit. Void Tentacles every 10th hit. Void Eruption auto-casts every 10s (200% AoE + Voidform)',
    shadowApparitions:'Every 3rd DoT tick spawns a shadow ghost (105% dmg) that seeks a random enemy',
    vampiricEmbrace:'All DoT damage heals self + lowest ally for 25%',
    healAura:'Passive HoT to allies in range', cleanse:'Periodically clears slow/poison',
    lifebloom:'Attacks apply HoT stack (3%/s). At 3 stacks: BLOOM Ã¢â‚¬â€ 20% AoE heal explosion',
    efflorescence:'Every 15s: plant mushroom healing circle (3%/s to allies inside, max 2)',
    toxicFlask:'Attacks apply poison DoT (15%/s, 5s, stacks to 3)',
    corrosiveBrew:'Poisoned enemies take +20% damage from all sources',
    eclipseCycle:'Shifts between Solar and Lunar. Solar Gust pushes enemies; Solar Flare knocks outward; Lunar Strike pulls inward and slows.',
    astralPower:'Each eclipse shift grants Astral Power (+10% dmg/stack, max 3). At 3 stacks: next culmination is empowered with bigger AoE and stronger damage.',
    wildGrowth:'Every 10s: HoT on 3 lowest allies (4%/s for 6s)',
    naturesBlessing:'Every 10s: buff lowest ally +25% damage for 5s',
    swiftmend:'Instant 40% heal on lowest ally + spawn treant healer (14s CD)',
    tranquility:'Channel 5s: heal ALL allies 8%/s. Green rain (28s CD)',
    essenceBond:'Golden thread to lowest-HP ally, echoes 25% of healing', prescientMist:'Auto-burst heal when bonded ally drops below 44% HP', toxicBrew:'Attacks apply stacking poison (max 6), ticking magic damage', volatileMixture:'Every 4th attack lobs an explosive potion for AoE damage',
    champion:'All allies deal extra damage', devour:'Heal % damage + chance to insta-kill weak',
    soothingAroma:'Every 5s plants a healing basil statue (max 2). Statues send healing bolts to injured allies.', essenceInfusion:'Every 5th heal gives target a healing-over-time buff',
    reflect:'Returns magic damage to the caster',
    frenzy:'Faster attacks & extra damage when low HP',
    magicWard:'Periodically negates an incoming magic hit',
    gripBleed:'Yanked enemies bleed for several seconds',
    armorRegen:'Slowly regenerates armor over time',
    reviveOnce:'Revives once at low HP with doubled cleave',
    ironfur:'Every 3rd hit gains +3 armor for 6s, stacks 3Ãƒâ€”',
    thrashBleed:'Melee attacks apply stacking bleed DoT (max 3)',
    earthwarden:'AoE damage generates a damage-absorbing shield',
    frenziedRegen:'Below 60% HP: heal 3% max HP/sec for 5s (20s CD)',
    entanglingRoots:'Every 8s root up to 3 enemies for 3s (vines from ground)',
    rejuvAura:'Passively heals nearby allies 1.5% max HP/sec',
    galacticGuardian:'10% on taking damage: Moonfire AoE burst',
    swipePassive:'Attacks hit all enemies in 100px + extend bleeds',
    backstab:'Massive stealth opener + bleed',
    whirlwind:'Every few attacks, hit all enemies around you',
    vanish:'Periodically untargetable, exit hit empowered',
    twinSync:'Three Mirror clones; siblings get speed buff on clone death',
    bladeRush:'Dashes through enemies every 8s and gains short Blade Guard',
    risingSlash:'Every 4th hit: uppercut for 160% + mini stun',
    azureSen:'3/5/10 attacks grant Setsu, Getsu, Ka Sen; each Sen gives +5% damage',
    thirdEye:'5th/10th procs and CD moves grant 20% damage reduction for 1.5s',
    mortalStrike:'Every 3rd hit: 160% damage + heal reduction',
    executeBlade:'2.5Ãƒâ€” damage to enemies below 25% HP',
    windStep:'On kill, teleport to nearest enemy and gain Blade Guard',
    bladeDance:'AoE blade spin every 5s hitting all nearby',
    enrageBlade:'Below 50% HP: +50% speed, +30% damage',
    hotStreak:'Every 5th hit crits for 175% + instant bonus fireball',
    ignite:'Attacks apply burn DoT (18% hit dmg/s, 3s, stacks 2Ãƒâ€”)',
    pyromaniac:'Burning enemies take +20% damage from Alibaba',
    firestarter:'Kill explosions deal 150% AoE in 70px',
    frostbolt:'Attacks slow enemies by 35% for 2s',
    shatter:'Slowed enemies take +20% damage from all sources',
    overload:'20% chance: attacks chain to 2 nearby enemies (40% dmg)',
    stormkeeper:'Every 8th attack: 250% dmg + 0.7s stun',
    flameCircle:'4s burning circle on best enemy cluster (12s CD)',
    flamestrike:'Legacy AoE fire column',
    flameSprite:'Summons a small flame sprite companion (max 1)',
    fireElemental:'Summons a fire elemental minion (max 1)',
    waterElemental:'Summons a water elemental minion (max 1)',
    stormElemental:'Summons a storm elemental minion (max 1)',
    chainLightning:'Hit + chain to 4 nearby (120% each, 10s CD)',
    dragonsBreath:'Cone 120px Ã¢â‚¬â€ 250% dmg + 1.5s stun (12s CD)',
    combustion:'6s buff: spread ignite + double crit (20s CD)',
    blizzard:'5s AoE zone Ã¢â‚¬â€ 45%/tick + slow (15s CD)',
    iceBarrier:'Shield 40% max HP Ã¢â‚¬â€ breaksÃ¢â€ â€™freeze nearby (18s CD)',
    strongSlow:'Strong slow aura on enemies in range',
    frostBolt:'Every few attacks freezes the target briefly',
    burnDot:'Hits apply a stacking Burn DoT',
    plagueCloud:'Each hit spreads Curse to all nearby enemies',
    minionExplode:'Your minions burst for AoE damage on death',
    aimedSniper:'Every 3rd attack: massive shot + daze, longer range',
    tripleShot:'Each attack fires 3 thorns in a spread cone',
    artilleryTurret:'Slower long-range artillery turrets (max 3, wide splash)',
    munitionsCache:'Turrets gain +15% damage per kill (up to +100%)',
    mechSuit:'Flying pomegranate cannon form: pearl escorts, +DMG, +HP, +armor',
    rocketPunch:'Every 4th attack: heavy 60px AoE + knockback',
    holyStrike:'Every few attacks: purge buffs + huge boss damage',
    renewAura:'Passive HoT to all nearby allies',
    resurrection:'Revive one dead unit per stage',
    bigHealAura:'Bigger Heal Aura, doubled hps',
    wildGrowth:'Periodically full-heals the lowest-HP ally',
    purify:'Cleanse also grants 4s debuff immunity',
    antidoteField:'Drops a static heal zone periodically',
    // (bardicInspiration + mindControlEarly descriptions removed)
    personalWhirlwind:'AoE blast on cooldown + permanent attack speed boost',
    bloodfury:'Permanent attack speed boost',
    battleStandard:'Drops a static buff zone for allies',
    // (raiseSwarm + raiseElite descriptions removed)
    meteor:'Sky-drops a meteor on the strongest enemy every 8s',
    swordSaintCycle:'3/5/10 cycles Stasis, Lightning, and Holy blade arts with short guard/speed/boss-burst windows',
    judgmentSeals:'Combo and cooldown moves apply self-only seals; King deals +8% damage per seal and Divine Ruination consumes them',
    wingsOfLight:'Always-on +20% damage and +20% crit chance',
    shieldOfVengeance:'Absorb 20% max HP, then burst all absorbed damage as holy AoE (15s CD)',
    avengersShield:'Every 6s throw bouncing shield hitting 3 enemies; at L4 hits 5 for 1.65x and 16% shield cap.',
    ardentDefender:'Cheat death: revive at 32% HP + 1s invulnerability (once per wave). After used, grants 15% DR for 4s every 45s',
    lightOfDawn:'Every 3rd attack: cone heal (12% max HP) to all allies in front. Slow golden wave VFX',
    wordOfGlory:'Every 5th attack: heal lowest ally 25% max HP + Eternal Flame HoT (5%/s for 4s)',
    paladinWings:'Always-on +20% damage and +20% crit chance',
    freedom:'Periodically grants an ally a speed buff and cleanses slows',
    magicShield:'Periodically gives the nearest tank a magic absorb shield',
    vengeanceStrike:'Every 4th attack is a 2Ãƒâ€” holy strike with splash damage',
    divineStorm:'CLASS PASSIVE Ã¢â‚¬â€ every 4th attack unleashes 4 holy waves (damage enemies + heal allies)',
    holyPower:'+20% damage and 15% lifesteal Ã¢â‚¬â€ pure DPS variant',
    spellReflect:'Every 8s, reflects next magic attack back at 150% damage',
    demoralizingShout:'Every 10s, nearby enemies deal 20% less damage for 5s',
    rallyCry:'Every 40s, nearby allies gain +20% damage and +15% attack speed for 5s'
    ,mudClap:'3rd hit splashes mud, slowing and weakening non-boss enemies'
    ,batataRoleChoice:'Choose Mudroot Warden or Stonehide Mauler at L3'
    ,backlineGarden:'Healers and ranged behind Batata take less damage and receive more healing'
    ,mirebreaker:'Batata takes less damage while surrounded; muddied swarms hit backline softer'
  };
  return m[id]||'';
}
// Helper Ã¢â‚¬â€ returns the unit's CURRENT P1 + P2 (branch-aware).
function arena_currentPassives(unitIdx,branch){
  return getCurrentUnitPassives(unitIdx,branch);
}
// Per-unit L5 bonus blurb Ã¢â‚¬â€ used by the L4Ã¢â€ â€™L5 preview to tell the player
// what makes max level special for THIS unit (not just generic +50%).
function arena_l5BonusBrief(unitIdx){
  const m={
    1:'Taoon: Bloodwarden strengthens ally shields; Gravebinder pulls 2 enemies and strengthens cluster control',
    2:'Batata: Mudroot strengthens shelter/shields; Stonehide strengthens mud disruption and self-shields',
    3:"King Protection: Avenger's Shield hits 5 targets, deals 1.65x damage, and shield cap rises to 16%",
    4:'Felfel: Fan of Knives AoE + all passives at max potency',
    7:'Jafaar: Summon Felhound (melee + spell-lock) + Agony/UA at max potency',
    10:'Naana: Prayer of Mending, Renew, and Sanctify sustain the team. Angel of Mercy becomes a healing spirit on death. A3: Holy Word Serenity. A5: Guardian Spirit.',
    11:'Bakdounes: Purify (base), Moonkin: Eclipse at 4 hits + Astral Power 4 stacks (+40% dmg), Grove Keeper: +50% potency',
    12:'Habaq: Essence Mastery (+1 statue, stronger infusions, +2 poison stacks)',
    // Kharroob L5 bonus removed
    99:'Vodka: max aura strength & devour potency'
  };
  return m[unitIdx]||'+50% potency to both passives';
}
// Returns "what changes at L+1" for the manage panel preview block.
function arena_nextUnlockBrief(unitIdx,curLv,branch){
  if(curLv>=ARENA_MAX_UNIT_LEVEL)return null;
  const next=curLv+1;
  const cur=arena_currentPassives(unitIdx,branch);
  if(unitIdx===0&&!branch&&next===2){
    return{
      label:'UNLOCKS 3RD HIT - Shield Bash',
      desc:'Every 3rd hit dents the target, lowering its damage for 3s.',
      tone:'unlock'
    };
  }
  // L3 = P2 unlock (branch-aware). Note: this only fires for UNITS WITHOUT
  // branches (none right now since all 15 have branches), or for L2Ã¢â€ â€™L3 when
  // a branch has somehow already been locked (shouldn't happen). Most L2Ã¢â€ â€™L3
  // taps go to the 3-card branch fork instead.
  if(next===3&&cur.p2){
    return{
      label:'UNLOCKS P2 Ã¢â‚¬â€ '+arena_passiveTitle(cur.p2),
      desc:arena_passiveShort(cur.p2),
      tone:'unlock'
    };
  }
  // L4 = passives stronger (scaling up). Show current passive names so the
  // player knows WHICH abilities are leveling.
  if(next===4){
    const _names=[cur.p1?arena_passiveTitle(cur.p1):null,cur.p2?arena_passiveTitle(cur.p2):null].filter(Boolean).join(' + ');
    return{
      label:'L4 - CAPSTONE',
      desc:arena_l5BonusBrief(unitIdx),
      tone:'stat'
    };
  }
  // L5 = max potency + unit-specific bonus.
  if(next===5){
    return{
      label:'L5 Ã¢â‚¬â€ MAX POTENCY',
      desc:arena_l5BonusBrief(unitIdx),
      tone:'gold'
    };
  }
  // L2 = stat bump (no passive change, P2 still locked until L3)
  return{
    label:'STAT BUMP',
    desc:'HP, damage, and attack speed all increase.',
    tone:'stat'
  };
}
// Detailed 2-line summary per branch Ã¢â‚¬â€ combines P1 + P2 + statMod into a
// scannable description for the upgrade panel branch cards. The 1-line
// branchBlurb below is used by the codex; this one is more granular so the
// player can compare picks at the moment of choice.
// Computes the actual displayed CD using the same tier-remap as arena_attachSignature.
function arena_sigDisplayCd(srcCd,lv){
  return getSignatureDisplayCooldown(srcCd,lv);
}
function arena_sigDisplayFc(srcCd){
  return getSignatureDisplayFirstCast(srcCd);
}
// Returns a "Ã‚Â· Ã¢Å¡Â¡ SIGNATURE Ã¢â‚¬â€ Name (Xs)" suffix to append to a path's headline.
// Uses the REAL post-tier CD, not the source value baked into ARENA_SIGNATURES.
function arena_sigSuffix(unitIdx,branch){
  const _sigId=getSignatureIdForUnit(unitIdx,branch);
  const _s=_sigId&&ARENA_SIGNATURES[_sigId];
  if(!_s)return '';
  const _cd=arena_sigDisplayCd(_s.cd,3);
  const _fc=arena_sigDisplayFc(_s.cd);
  return ' - SIG '+_s.name+' ('+_fc+'s first, '+_cd+'s CD)';
}
function arena_branchHeadline(unitIdx,key){
  const _bhKey=unitIdx+'_'+key;
  if(_bhKey==='2_a')return 'MUDROOT WARDEN - protects healers/ranged with Backline Garden, Shelter Pulse, Root Shelter shields, and Living Bulwark tank-save.';
  if(_bhKey==='2_b')return 'STONEHIDE MAULER - anti-swarm disruptor with Muddied slows, Quake Snare, Mudbreaker Roar, and Quakebreak tank-save.';
  // Concept-first headlines for the branch fork cards. Mention each ability
  // by name + what it DOES; skip exact ranges, frame counts, scaling brackets.
  const m={
    '0_a':'CITADEL - melee protector. Keeps Shield Bash. +18% HP, +10% Armor. Bodyguard Line protects Felfel/Jazar/Monk/Retri. Sig: Citadel Wall shield/DR.',
    '0_b':'VANGUARD - physical/pierce enabler. Keeps Shield Bash. +10% HP, +8% DMG, faster attacks. Cracks armor, lands with guard, and raises a banner zone.',
    '1_a':'BLOODWARDEN - anti-burst tank. +18% HP, +12% Armor, +15% MR, -5% DMG. Death Strike self-heals and Blood Tithe shields low allies. Sig: Crimson Covenant shield/DR.',
    '1_b':'GRAVEBINDER - control tank. +10% HP, +8% MR, +6% DMG, faster attacks. Soul Chains groups enemies; Maw gives shield/DR and magic/curse/poison setup.',
    '2_a':'Entangling Roots + Rejuvenation Aura Ã‚Â· nature support tank',
    '2_b':'Galactic Guardian moonfire procs + Swipe AoE bleed extender Ã‚Â· offensive hybrid',
    '3_a':"HALLOWED GUARDIAN - safest pure tank. +120% HP/armor, +65% MR, -15% DMG. Hallowed Leap jumps toward ranged/caster threats, shields King, and forces nearby non-boss enemies to target him. Avenger's Shield every 6s bounces to 3; at L4 it hits 5 for 1.65x damage and 16% shield cap. Sig: Ashen Hallow shield/DR.",
    '3_b':'HOLY Ã¢â‚¬â€ HEALER. Holy Shock (heals 3 allies every 6s, crit bonus) + Judgment of Light (marks heal allies, 10 charges). Aura Mastery (5% DR to nearby). Magic caster, range 170. Sig: Divine Toll (5 holy shocks on lowest HP allies)',
    '4_a':'SHADOW DANCER Ã¢â‚¬â€ Shadow Dance (re-stealth every 12s) + Eviscerate (3.5Ãƒâ€” finisher). Built-in: Cloak of Shadows (magic immunity). +10% DMG. Sig: Killing Spree (5 rapid teleport-strikes)',
    '4_b':'POISON ASSASSIN Ã¢â‚¬â€ Blade Flurry + Crimson Vial. Poison payoff: 3 stacks create Toxic Bloom, 5 stacks call Venom Meteor. Sepsis seeds poison to nearby enemies on kills. Sig: Deathmark.',
    '5_a':'SWORD SAINT - duelist path. Mortal Strike + Execute, +10% HP, +12% DMG, stronger Blade Guard. Sig: Final Strike (huge dash nuke + larger AoE circle/wave, then 4s AoE attacks +30% speed)',
    '5_b':'STORM BINDER - blue control path. Wind Step + Blade Dance, +5% HP, 10% faster. Sig: Storm Anchor (throw blade, pull enemies together for 3s, medium AoE, then +30% speed)',
    '6_a':'FROST MAGE Ã¢â‚¬â€ Frostbolt (35% slow on hit) + Shatter (+20% dmg to slowed). A3 Blizzard (channeled AoE slow zone, 45%/tick). A5 Water Elemental. -10% dmg, 10% faster. Sig: Frozen Orb (3.5s orb slows and roots normal enemies for 0.5s per hit)',
    '6_b':'STORM MAGE Ã¢â‚¬â€ Overload (20% chain attacks to 2 nearby, 40% dmg) + Stormkeeper (every 8th hit: 250% + 0.7s stun). A3 Chain Lightning (hits + chains to 4). A5 Storm Elemental. +10% DMG. Chain Thunder adds 0.5s micro-stun. Sig: Thunderstorm (6 bolts, 250% each)',
    '7_a':'DEMONOLOGY: Demonic Empowerment + Soul Link. +10% HP. Sig: Summon Infernal (big crash, non-boss stun, crater, fire tank minion with stomp pulses)',
    '7_b':'DESTRUCTION: Immolate fire patches + Havoc link beams. +20% DMG, -10% HP. Sig: Chaos Bolt (heavy main bolt, then split cascade 5 -> 3 -> 2 -> 1 with reduced damage)',
    '8_a':'TRAPPER (RANGED PHYSICAL): Trap Mastery (3 trap types: fire/frost/root) + Lock and Load (trap = bonus shots). A3 Explosive Shot. +10% HP. Raptor pet. Sig: Black Arrow (400% + shadow DoT + death explosion)',
    '8_b':'BEAST MASTERY (PIERCE): Kill Command (pet lunge every 6th hit) + Bestial Wrath (enrage pets). A3 Dire Beast (summon temp beast). -10% DMG. Spirit Beast pet. Sig: Stampede (5 beasts charge)',
    '9_a':'Siege Engineer: team value wave clear + zone control. Long-range artillery turrets (max 3), Munitions Cache, Rocket Barrage, Napalm Grid. Sig: Dropship (2 heavy turrets + command beacon)',
    '9_b':'Flying Cannon: ranged pomegranate cannon pod, 2 pearl escort cannons, Rocket Punch, Shield Generator. Team value: boss pressure and burst windows. Sig: Overdrive boosts drones and ends with vent blast.',
    '10_a':'DISCIPLINE: Penance (5 bolts every 5th atk + heals) + Power Word: Barrier (absorb shield). Sig: Rapture Ã¢â‚¬â€ all allies gain 30% HP shields for 8s',
    '10_b':'SHADOW (DPS): SW:Pain (DoTs + Shadow Weaving + Void Eruption auto-cast) + Shadow Apparitions. Shadow Crash every 5th. Void Tentacles every 10th. A3: Surrender to Madness (Ãƒâ€”3 dmg). A5: Shadow Word: Death (execute). Sig: Void Torrent (channel beam)',
    '11_a':'MOONKIN: Eclipse Cycle adds Solar Gust pushes, Solar Flare knockback, Lunar Strike pull/slow + Astral Power. +100% DMG, -15% HP. Sig: Astral Typhoon',
    '11_b':'WITCH DOCTOR: Spirit Totem (heal totems, max 2) + Nature\'s Blessing (+25% dmg buff). +15% HP. Sig: Ancestral Awakening Ã¢â‚¬â€ 3 spirit minions + 30% HP heal all',
    '12_a':'ESSENCE ORACLE: Essence Bond echoes healing to the weakest ally + Prescient Mist emergency burst heal. A3 Golden Cascade. Sig: Elixir of Life',
    '12_b':'TOXIN BREWER: Toxic Brew stacking poison + Volatile Mixture AoE potion every 5th attack. Sig: Pandemic poison burst',
    '13_a':'FROST DK: Raise SWARM (4-14 undead) + Frost Bolt freeze every 4th attack. Sig: Corpse Explosion (cone)',
    // Kharroob branch headline removed
    '99_a':'Personal Whirlwind (AoE blast on cooldown) + Bloodfury: permanent atk speed boost Ã‚Â· double damage',
    '99_b':"Champion's Aura (boosts all ally stats) + Battle Standard: drops a buff zone"
  };
  return m[unitIdx+'_'+key]||'';
}
// Same shape for the BASE path at L3 Ã¢â‚¬â€ what continuing without branching grants.
function arena_baseHeadline(unitIdx){
  if(unitIdx===2)return 'Mud Clap anti-swarm tank root - at L3 choose Mudroot Warden for healer/ranged protection or Stonehide Mauler for swarm disruption';
  const m={
    0:'Shield Charge + Shield Bash - tank root that branches into melee protection or physical/pierce support',
    1:'Death Grip priority pull + Rune Wound damage weaken - Death Knight tank that branches into ally protection or cluster control',
    2:'Ironfur armor stacking + Thrash Bleed DoT Ã¢â‚¬â€ armored primal guardian',
    3:'Wings of Light (+20% dmg/crit) + Shield of Vengeance (absorb Ã¢â€ â€™ burst) Ã¢â‚¬â€ Retribution Paladin. Blade of Justice (3rd), Hammer of Light (5th), Wake of Ashes (10th). A5: Final Reckoning (mark +20% dmg)',
    4:'Garrote (Sap + silence + bleed) + Slice and Dice (+40% atk speed) Ã¢â‚¬â€ stealth assassin with Deadly Poison',
    5:'BASE VANGUARD - +12% HP, +8% DMG at L3+. Blade Rush dash + Rising Slash uppercut. Sig: Omnislash immune dash chain, then +30% attack speed for 5s',
    6:'Fire splash, Ignite, Flame Circle, Inferno Orb + Flame Curse Ã¢â‚¬â€ area burn/control mage',
    7:'Soul Harvest rift + Agony stacking. At L3: Curse Bloom at 3 stacks, Fel Meteor after 5 curse applications Ã¢â‚¬â€ Affliction Warlock',
    8:'Aimed Shot Mark (every 4th: 250% + Hunter\'s Mark +20% dmg amp) + Steady Focus (stand still 2s = +25% atk speed) Ã¢â‚¬â€ Marksmanship Hunter. Wolf pet.',
    9:'FIELD ENGINEER - team value: control, repair shields, turret damage mark, Omega Cannon pick-off',
    10:'HOLY: Smite+Heal + Shield-on-attack + L5 Beacon/Lay on Hands Ã¢â‚¬â€ Priest healer',
    11:'APOTHECARY: Healing Tonic + Purifying Brew. Sig: Garden of Renewal Ã¢â‚¬â€ herbalist alchemist',
    12:'AROMANCER: Soothing Aroma + Essence Infusion. Sig: Aromatic Burst Ã¢â‚¬â€ herb-essence healer',
    99:"Champion's Aura + Devour Ã¢â‚¬â€ hero buffer & finisher"
  };
  m[3]='HOLY SWORD SAINT: 3/5/10 Stasis Sword, Lightning Stab, Holy Explosion. Judgment Seals add self-only bonus damage, A3/A5 apply more seals, and Divine Ruination consumes seals for a boss-burst payoff.';
  return m[unitIdx]||'';
}
// One-line summary per branch variant Ã¢â‚¬â€ used by the codex detail page so
// players can preview their L3 fork choice before committing in-game.
function arena_branchBlurb(unitIdx,key){
  const _bbKey=unitIdx+'_'+key;
  if(_bbKey==='2_a')return '+22% HP, +10% MR, -5% DMG. Mud Clap slows/weakens non-boss swarms. Backline Garden gives healer/ranged allies -10% damage taken and +8% healing received. Shelter Pulse creates a 3.5s shelter zone; Root Shelter shields Batata and up to 3 backline allies. Sig: Living Bulwark gives Batata shield and -30% damage.';
  if(_bbKey==='2_b')return '+14% HP, +12% armor, +6% DMG, 4% faster attacks. Mud Clap and Quake Snare apply stronger Muddied to non-boss swarms. Mirebreaker gives Batata -10% damage while surrounded. Mudbreaker Roar shields Batata and weakens nearby non-boss enemies. Sig: Quakebreak gives shield and -25% damage.';
  const m={
    '0_a':'Keeps Shield Bash. +18% HP, +10% Armor. Bodyguard Line reduces damage taken by nearby melee/paladin allies. Guard Pulse protects allies and taunts. Unbreakable Line shields Zavs and nearby melee. Sig: Citadel Wall.',
    '0_b':'Keeps Shield Bash. +10% HP, +8% DMG, 8% faster attacks. Forward Standard buffs nearby physical/pierce allies. Armor Crack and Focus Mark boost physical/pierce damage only. Sig: Bannerfall Crash.',
    '1_a':'+18% HP, +12% armor, +15% MR, -5% DMG. Death Grip pulls priority enemies. Rune Wound lowers enemy damage. Death Strike heals Taoon on 5th hits and Blood Tithe shields a low ally. Blood Oath shields two allies. Sig: Crimson Covenant gives shield, -35% damage, and emergency heal if low.',
    '1_b':'+10% HP, +8% MR, +6% DMG, 6% faster attacks. Death Grip prioritizes ranged/caster/support enemies and pulls 2 at L4. Soul Chains slows/interrupts non-boss groups. Marked for Ruin makes non-boss enemies take +8% magic/curse/poison damage only. Sig: Maw gives shield and -25% damage while active.',
    '2_a':'+25% HP. Entangling Roots: every 8s root up to 3 enemies (vines from ground, 3s). Rejuvenation Aura: heals nearby allies 1.5%/sec. A3 Nature Stomp (AoE root+dmg). A5 Tree of Life (10s: +40% HP, +50% armor, 3%/sec AoE heal). Sig: Force of Nature Ã¢â‚¬â€ summon 3 treants.',
    '2_b':'+15% DMG. Galactic Guardian: taking damage procs Moonfire AoE burst. Swipe: attacks hit all nearby enemies + extend bleeds. Sig: Primal Wrath Ã¢â‚¬â€ AoE bleed, dying bleeders explode.',
    '3_a':"HALLOWED GUARDIAN (TANK). +120% HP/armor, +65% MR, -15% dmg. Hallowed Leap jumps toward ranged/caster threats every 12s, shields King for 10% max HP, deals 0.45x holy in 90px, applies Avenged, and forces nearby non-boss enemies to target King for 2s. Avenger's Shield every 6s bounces to 3; at L4 it hits 5 for 1.65x damage and 16% shield cap. 3/5/10 hits add Judgment Guard, Sacred Bulwark, and Guardian Oath. Guardian of Ancient Kings: 12s, +50% armor, 25% DR, 1.1% max HP/sec heal. Sig: Ashen Hallow gives King 20% shield, 30% DR, low-HP heal, and ally DR inside.",
    '3_b':'HOLY (HEALER). -10% HP, -50% dmg. Becomes back-line ranged caster (range 170, magic). Light of Dawn (every 3rd atk: cone heal 12% maxHP to allies in front) + Word of Glory (every 5th atk: 25% maxHP heal + Eternal Flame HoT 5%/s 4s). Built-in: Holy Shock (6s: heals 3 lowest allies 15% maxHP, crits +50% next) + Light of Martyr (atks heal lowest ally) + Infusion of Light + Aura Mastery (5% DR). a3 Holy Prism. a5 Barrier of Faith. Sig: Beacon of Virtue + Divine Toll Ã¢â‚¬â€ activate beacon (10s: ALL heals splash 100% to all allies) then 5 holy shocks (25% maxHP each, all splash via beacon).',
    '4_a':'+10% DMG. Shadow Dance: every 12s re-enter stealth in combat (resets Garrote Ã¢â‚¬â€ new Sap + silence + bleed). Eviscerate: every 5th hit deals 3.5Ãƒâ€” bonus damage. Built-in: Cloak of Shadows (immune to magic for 3s after taking magic hit, 15s CD). Sig: Killing Spree Ã¢â‚¬â€ teleport-strike 5 random enemies for 2.5Ãƒâ€” damage each.',
    '4_b':'+15% DMG. Blade Flurry: attacks hit a second nearby target for 80% damage. Crimson Vial: below 40% HP, heal 4% max HP/sec for 4s. Poison payoff: 3 Deadly Poison stacks create Toxic Bloom; 5 stacks call Venom Meteor and reset the target back to 2 stacks. Sepsis seeds limited poison on poisoned kills. Sig: Deathmark.',
    '5_a':'+10% HP, +12% DMG. Mortal Strike: every 3rd hit cuts healing. Execute: stronger low-HP finish. A3 Colossus Smash grants Blade Guard. A5 Enrage adds a heal + guard at low HP. Signature dashes in for a huge Final Strike with a larger AoE circle, blade wave, stronger splash, armor break, then 4s Sword Saint Fury: +30% attack speed and AoE normal attacks.',
    '5_b':'+5% HP, 10% faster. Wind Step: kill -> teleport to next enemy with Blade Guard. Blade Dance: AoE spin every 5s. A3 Wind Slash dash line. A5 Thousand Cuts hyper mode. Signature pulls enemies together, deals medium AoE damage, then grants +30% attack speed for 5s.',
    '6_a':'-10% DMG, 10% faster atk. Frostbolt: 35% slow on hit. Shatter: +20% dmg to slowed. A3 Blizzard (5s AoE, 45%/tick). A5 Water Elemental. Sig: Frozen Orb slows and roots normal enemies for 0.5s per hit.',
    '6_b':'+10% DMG. Overload: 20% chain to 2 nearby (40% dmg). Stormkeeper: every 8th hit 250% + 0.7s stun. Chain Thunder adds 0.5s micro-stun. A3 Chain Lightning. A5 Storm Elemental. Sig: Thunderstorm.',
    '7_a':'+10% HP. Demonic Empowerment: every 20s all minions gain +50% dmg & +30% atk speed for 6s. Soul Link redirects damage to the strongest minion. Sig: Summon Infernal Ã¢â‚¬â€ larger crash, non-boss stun, 4s crater, and a fire tank that keeps pulsing stomp damage.',
    '7_b':'+20% DMG, -10% HP. Immolate: attacks leave readable fire patches. Havoc: primary hits link to a second target. Sig: Chaos Bolt Ã¢â‚¬â€ one heavy felfire bolt hits highest HP, then cascades 5 -> 3 -> 2 -> 1 smaller bolts with reduced damage. All ignore armor/MR.',
    '8_a':'+10% HP. Ranged physical. Trap Mastery: every 10s place a trap (max 3), cycling Fire (250% AoE) Ã¢â€ â€™ Frost (40% slow 3s) Ã¢â€ â€™ Root (2s immobilize). Lock and Load: trap detonation grants 3 shots +40% dmg. A3 Explosive Shot (250% + splash, 12s CD). Pet: Raptor. Sig: Black Arrow Ã¢â‚¬â€ 400% magic + 6s DoT + death explosion.',
    '8_b':'-10% DMG. Pierce attacks. Kill Command: every 6th attack, pet lunges for 300% dmg. Bestial Wrath: every 18s all pets +50% dmg/+30% atk speed for 6s. A3 Dire Beast: summon a wild beast for 8s (18s CD). Pet: Spirit Beast (tanky, heals 5%/8s). Sig: Stampede Ã¢â‚¬â€ 5 beasts charge across arena.',
    '9_a':'Siege Engineer - team value: best wave clear and zone control. Slower long-range artillery turrets with wider splash, max 3. Munitions Cache stacks turret damage on turret kills. Rocket Barrage A3 fires 8 cluster-priority rockets. Napalm Grid A5 creates 3 burning zones. Sig: Siege Dropship drops 2 heavy artillery turrets plus a 12s command beacon that boosts owned turrets.',
    '9_b':'Flying Cannon - keeps the old ranged cannon feel: pearl escort cannons, Rocket Punch splash/knockback, Shield Generator, and steady boss pressure without replacing tanks. Sig: Overdrive keeps the old 2x damage/speed burst, boosts escort cannons, and ends with a vent blast. Self-Destruct remains the comeback passive.',
    '10_a':'Discipline: +20% DMG. Penance (5 rapid bolts every 5th attack, heals lowest ally). PW:Barrier (absorb shield every 14s). Sig: Rapture Ã¢â‚¬â€ all allies gain 30% maxHP shields for 8s, refreshed every 2s.',
    '10_b':'Shadow: +120% DMG, -25% HP, fast attacks. Pure void DPS. SW:Pain (36%/s DoTs, 3 stacks, +7% dmg taken at max). Shadow Apparitions (ghosts from DoT ticks, 105% dmg). Shadow Crash every 5th hit (falling void orb, 250% AoE). Void Tentacles every 10th (2 tentacles, 6s, fast). Void Eruption auto-casts every 10s (200% AoE + Voidform: splash/fast atk/2x DoT). A3: Surrender to Madness (x3 dmg 5s, chains to 2, kills extend, 20s CD). A5: Shadow Word: Death (500% execute on <35% HP, CD resets on kill, 15% self-dmg on fail, 10s CD). Sig: Void Torrent - 4s channel beam, stronger void conduit pulses.',
    '11_a':'Moonkin: +100% DMG, -15% HP. Eclipse Cycle: Solar Gust every few hits pushes normal enemies. Solar Flare knocks enemies outward; Lunar Strike pulls them inward and slows. Astral Power empowers the next finisher. Sig: Astral Typhoon Ã¢â‚¬â€ cluster burst + push wave, then both eclipses active for 10s.',
    '11_b':'Witch Doctor: +15% HP. Spirit Totem: plant heal totem every 15s (max 2). Nature\'s Blessing: buff lowest ally +25% dmg every 10s. Sig: Ancestral Awakening (3 spirits + 30% HP heal all).',
    '12_a':'+10% HP. Essence Bond echoes 30% healing to bonded ally; Prescient Mist heals at 50% HP. L5 upgrades echo to 40% and mist to 55% trigger.',
    '12_b':'Toxin DPS branch. Toxic Brew stacks stronger poison to 6; Volatile Mixture throws a heavy AoE potion every 4th attack. L5 increases poison stack cap and damage.',
    '13_a':'-15% DMG. Raise count [4,6,8,10,14] Ã¢â‚¬â€ swarm path. Minions weaker (50% HP / 60% dmg).',
    '13_b':'+20% DMG. Raise count [1,2,2,3,4] Ã¢â‚¬â€ quality path. Minions ELITE (200% HP, 150% dmg).',
    '99_a':'+100% DMG, faster atk. Personal Whirlwind every 6s (80% dmg in 100 px) + permanent +30% own atk speed.',
    '99_b':'+30% HP. Champion Aura kept. Battle Standard: drops a static buff zone (+25% all stats for allies in 200 px).'
  };
  return m[unitIdx+'_'+key]||'';
}
function passiveLabel(u){
  if(u&&u.name==='Batata')return 'Anti-swarm sustain tank. Shared 3rd hit: Mud Clap splashes mud, slowing non-boss enemies by 20% and reducing their damage by 8%. Mudroot Warden protects healers/ranged with damage reduction, healing received, and shields. Stonehide Mauler disrupts swarms with stronger mud debuffs and self-shields. Bosses are not stunned, rooted, or amplified.';
  // arena passives Ã¢â‚¬â€ P1 from L1, P2 unlocks at L3, both stronger at L5.
  // Concept-first descriptions: name the ability and what it DOES, skip
  // the implementation noise (px ranges, exact frame counts, scaling tables).
  const m={
    Zavs:'Shield Charge: short leap with stun and AoE. Shield Bash dents enemy damage. Citadel protects melee teams; Vanguard boosts physical/pierce teams.',
    Taoon:'Death Knight tank. Death Grip pulls priority non-boss enemies every 6s. Rune Wound weakens enemy damage. Necropolis Guard gives visible DR at low HP. Bloodwarden saves allies with shields; Gravebinder controls clusters and enables magic/curse/poison teams.',
    Batata:'Built-in Thick Hide: permanent 15% DR. Built-in Tooth and Claw: every 4th hit debuffs target (-20% damage). P1 Ironfur: every 3rd hit +3 armor (stacks 3Ãƒâ€”). P2 (L3) Thrash Bleed: attacks apply stacking bleed DoT.',
    King:"Crusader knight paladin. Built-in: Crusader Aura (mount charge), Divine Storm (every 4th hit holy AoE), Art of War (crits reset Blade of Wrath CD), Hammer of Wrath (2Ãƒâ€” damage to enemies below 35% HP). P1 Wings of Light: +20% damage + 20% crit. P2 (L3) Shield of Vengeance: absorb 20% max HP shield Ã¢â€ â€™ burst AoE holy. SIGNATURE Avenging Wrath (8s: +30% dmg, +30% crit, 15% lifesteal).",
    Felfel:'Built-in: Deadly Poison (melee hits stack poison DoT, max 5), Cheat Death, and Stealth. P1 Garrote: stealth opener Ã¢â‚¬â€ Sap nearby enemy + silence+bleed main target. P2 (L3) Slice and Dice: every 5th hit grants +40% attack speed for 5s. Poison branch at L3 adds Toxic Bloom at 3 poison stacks and Venom Meteor at 5 stacks. SIGNATURE Death from Above.',
    Jazar:'Base path gains +12% HP and +8% DMG at L3+. P1 Blade Rush: dashes through enemies every 8s, dealing 150% path damage and gaining Blade Guard. P2 Rising Slash: every 4th basic attack deals 160% + brief stun. SIGNATURE Omnislash: Jazar becomes damage-immune and dashes to 6 enemies in rapid succession, 200% each, then gains +30% attack speed for 5s.',
    Alibaba:'POLYMORPH: turns a nearby enemy into a critter (sheep/turtle/pig) for 6s Ã¢â‚¬â€ damage breaks it. P1 Hot Streak adds fire burst. P2 Ignite burns enemies. A3 Flame Circle burns clusters. SIGNATURE Inferno Orb applies Flame Curse: small burn + 5% enemy damage reduction. Spawns elemental minion at L3+.',
    Jafaar:'Built-in: Split Curse basic attacks hit a second enemy and spread Agony, Soul Siphon heals from DoT damage, and Imp Familiar joins each wave. P1 Agony: attacks apply stacking DoT. P2 (L3) unlocks curse payoffs: 3 Agony stacks create Curse Bloom, and 5 curse applications call Fel Meteor. Unstable Affliction makes enemies dying with Jafaar Agony burst and seed Agony to a few nearby enemies. SIGNATURE Soul Harvest opens a curse rift that ticks, refreshes Agony, then bursts cursed enemies.',
    Zaatar:'Built-in: Twin Shot basic attacks hit a second enemy, plus Wolf companion per wave. P1 Aimed Shot Mark: every 3rd attack deals 250% damage and applies Hunter\'s Mark (+20% damage from all sources, 4s). P2 (L3) Steady Focus: standing still for 2s grants +25% attack speed. A3 Rapid Fire: channel 8 fast shots (14s CD). SIGNATURE Trueshot (8s: +100% dmg, +50% range, Aimed Shots every hit).',
    Rommana:'Base Field Engineer. Team value: flexible control, emergency repair shields, and a turret damage mark. P1 Utility Turret: fast setup, max 2, lighter damage. P2 Overclock: every 7th attack gains +30% attack speed for 3s. A3 EMP Grenade: 80px AoE, silence/slow, marks enemies to take +10% Rommana/turret damage. A5 Repair Bot: healing drone with emergency shield. Sig: Omega Cannon burst plus control splash.',
    Naana:'Holy priest raid healer. Prayer of Mending jumps between damaged allies, Renew covers two wounded allies, Flash Heal catches the lowest ally, Sanctify bursts healing on hit cadence, and Divine Hymn is the emergency AoE.',
    Bakdounes:'P1 Healing Tonic: throws heal potion to lowest ally every 8s (25% HP + HoT). P2 (L3) Purifying Brew: cleansing potion every 12s (removes debuffs + 3s immunity).',
    Habaq:'P1 Soothing Aroma: plants healing basil statues that send slow bolts to injured allies. P2 (L3) Essence Infusion: every 5th heal buffs target with a healing-over-time effect. A3 Aromatic Burst: 12s green rain zone healing allies inside. A5 Transcendence: statues heal faster + mist zones. SIGNATURE Herbal Tempest: explodes all statues + spawns 4 empowered statues with rapid bolts. Branch A (Dhahabi): Essence Bond + Prescient Mist healer, Golden Cascade chain heal, Prescient Barrier golden shields. Branch B (Barri): Toxic Brew DPS, Volatile Mixture AoE, Pandemic poison spread.',
    // Kharroob codex entry removed
    Vodka:"P1 Champion's Aura: passive damage bonus to all allies. P2 (L3) Devour: heal a portion of damage dealt + chance to insta-kill weak enemies."
  };
  m.King='Holy Sword Saint. Built-in: Crusader Aura mount charge. P1 Sword Saint Cycle: 3/5/10 Stasis Sword, Lightning Stab, Holy Explosion. P2 Judgment Seals: combo and CD moves apply self-only seals for +8% damage per seal. A3 Crush Judgment. A5 Hallowed Bladefall. Signature Divine Ruination consumes seals for burst and a 3-seal echo hit.';
  return m[u.name]||'';
}
function abilityLabel(name){
  const labels={
    cleaveSlam:'Front-arc AoE swing (1.8x dmg, 8s CD)',
    shieldSlam:'Heavy hit (2.5x dmg) + stun + armor break (6s CD)',
    avatar:'Grow 40% bigger Ã¢â‚¬â€ +50% HP/DMG, CC immune for 8s (35s CD)',
    zavsPathSkill:'L3 path skill depends on Citadel or Vanguard',
    zavsCapstoneSkill:'L4 capstone depends on Citadel or Vanguard',
    guardPulse:'5th hit: 95px steel pulse protects melee allies and taunts non-boss enemies',
    unbreakableLine:'10th hit: shields Zavs and nearby melee allies for 4s',
    armorCrack:'5th hit: AoE hit applies Cracked Armor for physical/pierce damage',
    focusMark:'10th hit: marks target for physical/pierce focus fire',
    batataPathSkill:'L3 path skill: Mudroot shelters backline, Stonehide disrupts swarms',
    batataCapstoneSkill:'L4 capstone: Root Shelter or Mudbreaker Roar',
    shelterPulse:'5th hit: 120px shelter zone, backline DR/healing, non-boss slow',
    rootShelter:'10th hit: shields Batata and up to 3 healer/ranged allies',
    quakeSnare:'5th hit: 85px mud quake applies stronger Muddied to non-bosses',
    mudbreakerRoar:'10th hit: shields Batata and weakens nearby non-boss enemies',
    lastStand:'Below 25% HP: 50% DR + 25% bonus DMG for 5s, once/match',
    deathGripCleave:'Pull farthest enemy to feet + AoE swing (14s CD)',
    antiMagicShell:'4s magic immune + 50% reflect (30s CD)',
    runeWound:'3rd hit: 0.35x damage and non-boss enemy damage reduced for 3s',
    bloodOath:'10th hit: shields 2 low allies and grants 10% damage reduction',
    markedForRuin:'10th hit: non-bosses take +8% magic/curse/poison damage for 4s',
    taoonCapstoneSkill:'L4 capstone depends on Bloodwarden or Gravebinder',
    heartStrike:'Cleave 3 enemies (2Ãƒâ€” dmg) + heal 15% dealt (6s CD)',
    frostwyrmsFury:'Frost dragon breath line Ã¢â‚¬â€ 3.5Ãƒâ€” magic dmg + 3s freeze (45s CD)',
    earthquakeStomp:'AoE 120-radius slam, 1.4x dmg (16s CD)',
    survivalInstincts:'80% DR for 4s + heal nearby allies (35s CD)',
    incapacitatingRoar:'AoE stun 100px + enemies deal 20% less for 4s (16s CD)',
    berserkDruid:'8s: doubled attack speed, 360Ã‚Â° cleave, +30% dmg (35s CD)',
    natureStomp:'AoE root + damage 110px, roots enemies 2.5s (14s CD)',
    incarnationTree:'10s: become Tree of Life Ã¢â‚¬â€ +40% HP, +50% armor, heals all allies 3%/sec in 160px (40s CD)',
    divineJudgment:'Holy burst (3Ãƒâ€” dmg) + 40% splash to nearby enemies (8s CD)',
    crushJudgment:'Dash to a priority enemy within 230px, 3x holy damage, applies a Judgment Seal, stuns non-bosses (12s CD)',
    hallowedLeap:'Jump toward ranged/caster threats, shield King, and force non-boss targeting (12s CD)',
    hallowedBladefall:'Leap to a boss/elite/cluster, 4.4x main and 2.05x splash damage, applies a seal and stronger Crystal Guard (24s CD)',
    bladeOfWrath:'Leap + 2.5Ãƒâ€” holy damage + 2s stun + 4s dmg buff (12s CD, Prot only)',
    wakeOfAshes:'Frontal cone 200px: 3Ãƒâ€” holy damage + 3s stun (22s CD)',
    finalReckoning:'Marks all enemies in 100px Ã¢â‚¬â€ 300% holy burst + marked take 20% more dmg for 6s (22s CD)',
    holyPrism:'Ranged holy bolt: 2.5Ãƒâ€” damage + heal 5 lowest allies 10% max HP (cap 80) (10s CD)',
    barrierOfFaith:'Absorb shield (30% max HP) on 2 lowest HP allies for 8s (25s CD)',
    guardianOfAncientKings:'12s: +50% armor, 25% DR, heal 1.1% max HP/sec (45s CD)',
    bloodthirst:'+60% atk speed +30% crit chance for 4s (18s CD)',
    whirlwind:'1.5s spin x3 hits surrounding enemies (25s CD)',
    shadowstep:'TP behind farthest ranged enemy + 3Ãƒâ€” damage (7s CD, reduced spam)',
    fanOfKnives:'Hit all enemies within 120px + apply Deadly Poison (6s CD)',
    bladeStorm:'Spin AoE: hit all nearby enemies for 2s (12s CD)',
    shadowClones:'Summon 2 shadow clones that attack for 5s (25s CD)',
    hissatsuGyoten:'Dash to a priority enemy within 245px, 2.8x damage, grants Third Eye (12s CD)',
    geirskogulDive:'Leap to a nearby cluster, 4x AoE damage, grants 5s Life of Dragon (24s CD)',
    colossusSmash:'AoE slam: 200% damage + armor shred (15s CD)',
    windSlash:'Dash forward slashing all enemies in line (12s CD)',
    thousandCuts:'5s hyper mode: double attack speed + phantom slashes (18s CD)',
    meteor:'Overhead AoE strike 4x damage 80 radius (22s CD)',
    livingBomb:'DoT spreads to 3 nearby on death (18s CD)',
    massSummon:'Spawn 3 extra minions (locked until current dies)',
    soulHarvest:'4s curse rift: ticks damage, refreshes Agony, then bursts cursed enemies (28s CD)',
    curseOfDoom:'Legacy: detonates after 5s for 8x damage',
    drainLife:'Channel 4s: 80% DMG/s magic + heal 100% dealt (14s CD)',
    summonFelhound:'Passive: spawns felhound per wave (melee, spell-lock)',
    petBear:'Summons tank pet (locked until pet dies)',
    volley:'4s arrow rain on targeted area (28s CD)',
    rapidFire:'Channel 8 rapid shots at target, 60% dmg each (14s CD)',
    explosiveShot:'Charged shot explodes on impact Ã¢â‚¬â€ 250% + 50% AoE splash (12s CD)',
    direBeast:'Summon a wild beast for 8s Ã¢â‚¬â€ fast melee attacker (18s CD)',
    callWolf:'Passive: wolf/raptor/spirit beast companion spawns each wave',
    clusterBomb:'Bomb splits into 4 smaller bombs (14s CD)',
    carpetBomb:'Drops 6 bombs in a row over 3s (30s CD)',
    layOnHands:'Every 45s: full heal lowest ally below 35% HP (prefers tanks, includes self)',
    divineShield:'Target ally invulnerable for 3s (60s CD)',
    holyWordSerenity:'Full HP heal + cleanse on lowest ally below 50% (16s CD)',
    guardianSpirit:'Protect ally from death for 10s: lethal blow heals to 50% (24s CD)',
    voidEruption:'200% AoE burst + 5s Voidform (splash + 20% atk speed + 2x DoT tick). 10s CD',
    surrenderToMadness:'Ãƒâ€”3 damage for 5s, chains to 2 targets. Kills extend +2s. 2s stun after. 20s CD',
    shadowWordDeath:'Execute: 500% dmg to enemy below 35% HP. Kill = CD reset + 2 apparitions. No kill = 15% self-damage. 10s CD',
    wildGrowth:'5s ground heal circle on tank (30s CD)',
    tranquility:'Channel 4s, heal all allies on screen (60s CD)',
    aromaticBurst:'Creates a green rain zone (140px) for 12s. Allies inside heal 42% heal power/s (24s CD)',
    transcendence:'For 8s, statues heal faster and spawn healing mist zones (50s CD)',
    goldenCascade:'Chain golden heal to all allies (55% heal power, bonded ally heals double). 20s CD',
    prescientBarrier:'Golden shields on all allies (absorb 22% max HP for 6s, remaining converts to heal). 45s CD',
    vineLash:'Vine pull farthest enemy + 1.5x damage (18s CD)',
    harvestFury:'8s rage: +100% atk speed, +50% dmg, AoE bites (60s CD)'
  };
  return labels[name]||name;
}
// Short ability description for skill-slot cards (strips CD suffix from abilityLabel).
function arena_abilDesc(name){
  const full=abilityLabel(name);
  if(full===name)return prettyAbil(name);
  // Strip trailing " (XXs CD)" or "(... Xs CD)" if present so the slot card stays compact.
  return full.replace(/\s*\([^)]*\d+s\s+CD\)\s*$/,'');
}
// ===== SKILL SLOTS Ã¢â‚¬â€ Apple-style compact 5-row card =====
// Draws P1, P2, A3, A5, Signature as labelled rows inside a rounded card.
// Returns the total height consumed so the caller can flow subsequent content.
function arena_drawSkillSlots(x,y,w,unitIdx,level,branch){
  const u=unitIdx===99?VODKA:PLAYER_UNITS[unitIdx];
  const pass=arena_currentPassives(unitIdx,branch);
  const branchDef=branch&&ARENA_UNIT_BRANCHES[unitIdx]?ARENA_UNIT_BRANCHES[unitIdx][branch]:null;
  // Resolve A3/A5 Ã¢â‚¬â€ branch can override via branchProps
  const baseA3=u.a3, baseA5=u.a5;
  const effA3=(branchDef&&branchDef.branchProps&&branchDef.branchProps._branchA3)||baseA3;
  const effA5=(branchDef&&branchDef.branchProps&&branchDef.branchProps._branchA5)||baseA5;
  // Signature
  const sigId=branch?ARENA_BRANCH_SIGNATURES[unitIdx+'_'+branch]:ARENA_BASE_SIGNATURES[unitIdx];
  const sig=sigId&&ARENA_SIGNATURES[sigId];
  const p2Min=(unitIdx===0&&!branch&&pass.p2==='shieldBash')?2:3;
  // Build slot list
  const slots=[
    {badge:'P1',badgeBg:'#3aa84e',badgeFg:'#fff',name:arena_passiveTitle(pass.p1),desc:arena_passiveShort(pass.p1),status:'PASSIVE',minLv:1},
    {badge:'P2',badgeBg:'#3aa84e',badgeFg:'#fff',name:arena_passiveTitle(pass.p2),desc:arena_passiveShort(pass.p2),status:'PASSIVE',minLv:p2Min},
    {badge:'A3',badgeBg:'#5a8aff',badgeFg:'#fff',name:prettyAbil(effA3),desc:arena_abilDesc(effA3),status:effA3?arena_abilCdText(effA3):'-',minLv:3},
    {badge:'A4',badgeBg:'#5a8aff',badgeFg:'#fff',name:prettyAbil(effA5),desc:arena_abilDesc(effA5),status:effA5?arena_abilCdText(effA5):'-',minLv:ARENA_MAX_UNIT_LEVEL},
    {badge:'SIG',badgeBg:'#ffd700',badgeFg:'#000',name:sig?sig.name:'-',desc:sig?arena_sigDisplayFc(sig.cd)+'s first, then '+arena_sigDisplayCd(sig.cd,level)+'s CD':'No signature',status:sig?(arena_sigDisplayCd(sig.cd,level)+'s CD'):'-',minLv:3}
  ];
  const rowH=30, padY=8, padX=8, headerH=14;
  const cardH=slots.length*rowH+padY*2+headerH;
  const unitColor=(branchDef?branchDef.color:u.color)||'#666';
  // Card background
  const bg=ctx.createLinearGradient(x,y,x,y+cardH);
  bg.addColorStop(0,'#13132a');bg.addColorStop(1,'#0e0e1c');
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(x,y,w,cardH,12);ctx.fill();
  // Left color stripe
  ctx.fillStyle=unitColor;ctx.beginPath();ctx.roundRect(x,y,4,cardH,2);ctx.fill();
  // Section header
  ctx.fillStyle='#888';ctx.font='bold 8px Arial';ctx.textAlign='left';
  ctx.fillText('SKILLS',x+padX+6,y+padY+9);
  // Draw rows
  for(let i=0;i<slots.length;i++){
    const s=slots[i];
    const ry=y+padY+headerH+i*rowH;
    const locked=level<s.minLv;
    const prevAlpha=ctx.globalAlpha;
    if(locked)ctx.globalAlpha=0.35;
    // Badge
    const bx=x+padX+4, by=ry, bw=s.badge==='SIG'?30:22, bh=16;
    ctx.fillStyle=s.badgeBg;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,6);ctx.fill();
    ctx.fillStyle=s.badgeFg;ctx.font='bold 8px Arial';ctx.textAlign='center';
    ctx.fillText(s.badge,bx+bw/2,by+11);
    ctx.textAlign='left';
    // Skill name
    ctx.fillStyle='#fff';ctx.font='bold 11px Arial';
    ctx.fillText(s.name,bx+bw+8,ry+11);
    // CD / Status Ã¢â‚¬â€ right aligned
    ctx.textAlign='right';
    if(locked){
      ctx.fillStyle='#888';ctx.font='9px Arial';
      ctx.fillText('LOCK L'+s.minLv,x+w-padX-4,ry+11);
    }else{
      ctx.fillStyle='#888';ctx.font='9px Arial';
      ctx.fillText(s.status,x+w-padX-4,ry+11);
    }
    ctx.textAlign='left';
    // Description line
    ctx.fillStyle='#aab0c0';ctx.font='9px Arial';
    const maxDescW=w-padX*2-bw-16-4;
    let descText=s.desc||'';
    // Truncate with ... if too long
    if(ctx.measureText(descText).width>maxDescW){
      while(descText.length>3&&ctx.measureText(descText+'...').width>maxDescW)descText=descText.slice(0,-1);
      descText+='...';
    }
    ctx.fillText(descText,bx+bw+8,ry+22);
    if(locked)ctx.globalAlpha=prevAlpha;
  }
  return cardH;
}
// Helper: extract CD text from abilityLabel for the skill slot status column.
function arena_abilCdText(name){
  if(name==='guardPulse'||name==='armorCrack')return '5TH HIT';
  if(name==='unbreakableLine'||name==='focusMark')return '10TH HIT';
  if(name==='zavsPathSkill')return 'L3 PATH';
  if(name==='zavsCapstoneSkill')return 'L4 CAP';
  if(name==='shelterPulse'||name==='quakeSnare')return '5TH HIT';
  if(name==='rootShelter'||name==='mudbreakerRoar')return '10TH HIT';
  if(name==='batataPathSkill')return 'L3 PATH';
  if(name==='batataCapstoneSkill')return 'L4 CAP';
  if(name==='runeWound')return '3RD HIT';
  if(name==='bloodOath'||name==='markedForRuin')return '10TH HIT';
  if(name==='taoonCapstoneSkill')return 'L4 CAP';
  const full=abilityLabel(name);
  const m=full.match(/(\d+)s\s+CD/);
  return m?m[1]+'s CD':'ACTIVE';
}

// =====================
// LEVEL EDITOR OVERLAY
// =====================
function drawLevelEditor(){
  ctx.fillStyle='rgba(8,8,20,0.96)';ctx.fillRect(0,0,W,H);
  // header
  const hg=ctx.createLinearGradient(0,0,0,50);hg.addColorStop(0,'#1a1a2e');hg.addColorStop(1,'#0a0a1a');
  ctx.fillStyle=hg;ctx.fillRect(0,0,W,50);
  ctx.fillStyle='#9b59b6';ctx.fillRect(0,48,W,2);
  ctx.fillStyle='#fff';ctx.font='bold 20px Arial';ctx.textAlign='center';ctx.fillText('UNIT LEVELS',W/2,28);
  ctx.font='10px Arial';ctx.fillStyle='#aaa';ctx.fillText('L3 chooses path + signature. L4 unlocks capstone.',W/2,42);
  drawPillBtn(W-86,12,76,26,'CLOSE','#7a3a3a','#fff');
  ctx.textAlign='left';
  const archColors={tank:'#3a8e3a',melee:'#a6262e',ranged:'#3d8a3d',healer:'#4cd97a'};
  let y=58;
  for(let i=0;i<PLAYER_UNITS.length;i++){
    const u=PLAYER_UNITS[i];
    const lv=unitLevels[i];
    ctx.fillStyle='#13132a';
    ctx.beginPath();ctx.roundRect(10,y,W-20,40,5);ctx.fill();
    ctx.fillStyle=archColors[u.arch]||'#666';
    ctx.beginPath();ctx.roundRect(10,y,4,40,2);ctx.fill();
    ctx.fillStyle=u.color;
    ctx.beginPath();ctx.roundRect(20,y+4,32,32,4);ctx.fill();
    ctx.fillStyle=u.accent;ctx.beginPath();ctx.arc(36,y+20,11,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.fillText(u.name,60,y+18);
    ctx.font='9px Arial';ctx.fillStyle='#aaa';ctx.fillText(u.role,60,y+32);
    // L pill
    const lvC=arena_isCapstoneLevel(lv)?'#ffd700':lv>=3?'#ff8c00':'#3a3a5e';
    ctx.fillStyle=lvC;
    ctx.beginPath();ctx.roundRect(W-86,y+8,30,24,4);ctx.fill();
    ctx.fillStyle=lv>=3?'#000':'#fff';ctx.font='bold 14px Arial';ctx.textAlign='center';ctx.fillText('L'+lv,W-71,y+25);
    ctx.textAlign='left';
    drawPillBtn(W-118,y+8,28,24,'-','#3a3a5e','#fff');
    drawPillBtn(W-50,y+8,28,24,'+','#3a3a5e','#fff');
    y+=46;
  }
  // Vodka row
  ctx.fillStyle='#3a2614';
  ctx.beginPath();ctx.roundRect(10,y,W-20,40,5);ctx.fill();
  ctx.fillStyle='#ff8c00';
  ctx.beginPath();ctx.roundRect(10,y,4,40,2);ctx.fill();
  ctx.fillStyle='#d2691e';
  ctx.beginPath();ctx.roundRect(20,y+4,32,32,4);ctx.fill();
  ctx.fillStyle='#3a8e3a';ctx.fillRect(31,y+8,10,5);
  ctx.fillStyle='#ffeb3b';ctx.fillRect(28,y+18,3,2);ctx.fillRect(40,y+18,3,2);
  ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.textAlign='left';ctx.fillText('Vodka (Hero)',60,y+18);
  ctx.font='9px Arial';ctx.fillStyle='#ff8c00';ctx.fillText('Devourer-Tyrant',60,y+32);
  const vlvC=vodkaLevel>=5?'#ffd700':vodkaLevel>=3?'#ff8c00':'#3a3a5e';
  ctx.fillStyle=vlvC;
  ctx.beginPath();ctx.roundRect(W-86,y+8,30,24,4);ctx.fill();
  ctx.fillStyle=vodkaLevel>=3?'#000':'#fff';ctx.font='bold 14px Arial';ctx.textAlign='center';ctx.fillText('L'+vodkaLevel,W-71,y+25);
  ctx.textAlign='left';
  drawPillBtn(W-118,y+8,28,24,'-','#3a3a5e','#fff');
  drawPillBtn(W-50,y+8,28,24,'+','#3a3a5e','#fff');
}

// =====================
// CLICK HANDLING
// =====================

  const api = {
    drawCodexThreatsLegend,
    drawCodexArmorMatrix,
    drawCodexBossMechanics,
    drawCodexDetail,
    prettyAbil,
    wrapText,
    arena_wrapTextClamped,
    arena_passiveTitle,
    arena_passiveShort,
    arena_currentPassives,
    arena_l5BonusBrief,
    arena_nextUnlockBrief,
    arena_sigDisplayCd,
    arena_sigDisplayFc,
    arena_sigSuffix,
    arena_branchHeadline,
    arena_baseHeadline,
    arena_branchBlurb,
    passiveLabel,
    abilityLabel,
    arena_abilDesc,
    arena_drawSkillSlots,
    arena_abilCdText,
    drawLevelEditor,
  };
  for (const key of Object.keys(api)) {
    const fn = api[key];
    api[key] = (...args) => { sync(); return fn(...args); };
  }
  return api;
}

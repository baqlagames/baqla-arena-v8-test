function imminentBossSkillIcon(t,tickHz){
  if(!t||!t.isBoss||!t.mechCD)return null;
  const soon=4*tickHz;
  const cd=t.mechCD;
  const defs=[
    ['meteor','meteorCD','#ff4400','M','Meteor Soon'],
    ['vanish','vanishCD','#aa66cc','A','Ambush Soon'],
    ['emberDecree','emberDecreeCD','#ffb238','D','Decree Soon'],
    ['skyStrafe','skyStrafeCD','#ffaa44','S','Strafe Soon'],
    ['bombDrop','bombDropCD','#ff8844','B','Bomb Soon'],
    ['sandStorm','sandStormCD','#c8a05a','S','Sand Storm Soon'],
    ['starfall','starfallCD','#8bdfff','S','Starfall Soon'],
    ['eclipseBeam','eclipseBeamCD','#5cc8ff','E','Eclipse Soon'],
    ['gravityToll','gravityTollCD','#9bb8ff','G','Gravity Soon'],
    ['lanternOrbit','lanternOrbitCD','#ffd166','O','Orbit Soon'],
    ['twinWards','twinWardsCD','#8bdfff','W','Twin Wards Soon'],
    ['stormMotes','stormMotesCD','#8bdfff','M','Storm Motes Soon'],
    ['chainDecree','chainDecreeCD','#ffd166','C','Chain Decree Soon'],
    ['burrow','burrowCD','#8b6f3d','B','Burrow Soon'],
    ['lunge','lungeCD','#ff4444','L','Lunge Soon'],
    ['royalDive','royalDiveCD','#ff5a3a','D','Dive Soon'],
    ['stomp','stompCD','#7a8a9a','S','Stomp Soon'],
    ['pcloud','poisonCloudCD','#88aa44','C','Cloud Soon'],
    ['bliz','blizzardCD','#88ddff','B','Blizzard Soon'],
    ['spawn','spawnCD','#44aa44','+','Adds Soon'],
    ['magicBolt','magicBoltCD','#aa88ff','B','Bolt Soon'],
    ['debuff','debuffCD','#aa66cc','!','Debuff Soon'],
    ['aoe','aoeCD','#ff8800','!','AoE Soon'],
  ];
  let best=null;
  for(const [key,prop,c,g,title] of defs){
    const value=cd[key]||0;
    if(!t[prop]||!(value>0)||value>soon)continue;
    if(!best||value<best.value)best={value,c,g,title};
  }
  return best?{c:best.c,g:best.g,title:best.title,pulse:true}:null;
}

export function collectStatusIcons(t,tickHz=120){
  const icons=[];
  // DOTS (red-ish) ----------------
  if(t.poisonTimer>0)icons.push({c:'#3a8e3a',g:'P',title:'Poison'});
  if(t.livingBombTimer>0)icons.push({c:'#ff6600',g:'B',title:'Living Bomb',pulse:true});
  if(t.doomTimer>0)icons.push({c:'#660066',g:'D',title:'Doom',pulse:true});
  if(t.stunned>0)icons.push({c:'#ffd700',g:'!',title:'Stun'});
  if(t.slowTimer>0)icons.push({c:'#88ddff',g:'S',title:'Slow'});
  if(t._flameCurseTimer>0)icons.push({c:'#ff6633',g:'F',title:'Flame Curse'});
  if(t.ampTimer>0)icons.push({c:'#aa66cc',g:'A',title:'Disease (+30% dmg taken)'});
  if(t.markTimer>0)icons.push({c:'#aa00aa',g:'M',title:'Marked (+50% dmg taken)',pulse:true});
  if(t.deathMarkTimer>0)icons.push({c:'#660066',g:'M',title:'Death Mark',pulse:true});
  if(t.plagueTimer>0)icons.push({c:'#55aa33',g:'Ã¢ËœÂ£',title:'Plague'});
  if(t.rooted&&t.rootTimer>0)icons.push({c:'#33aa33',g:'Ã¢Å’â€¡',title:'Rooted'});
  if(t._soulReaperStacks>0)icons.push({c:'#ff2266',g:t._soulReaperStacks,title:'Soul Reaper Stacks',pulse:true});
  if(t.thrashBleed&&t.thrashBleed.stacks>0)icons.push({c:'#cc3333',g:t.thrashBleed.stacks,title:'Thrash Bleed'});
  if(t.toothAndClawDebuff)icons.push({c:'#a07a44',g:'W',title:'Weakened'});
  if(t.dentedTimer>0)icons.push({c:'#9ca3af',g:'D',title:'Dented'});
  if(t.runeWoundTimer>0)icons.push({c:'#8a66ff',g:'R',title:'Rune Wound'});
  if(t.soulChainsTimer>0)icons.push({c:'#44c7ff',g:'C',title:'Soul Chains'});
  if(t.markedForRuinTimer>0)icons.push({c:'#bb99ff',g:'M',title:'Marked for Ruin',pulse:true});
  if(t.avengedTimer>0)icons.push({c:'#ffd700',g:'A',title:'Avenged'});
  if(t.muddiedTimer>0)icons.push({c:'#8a6a32',g:'M',title:'Muddied'});
  if(t.mudbreakerRoarTimer>0)icons.push({c:'#b0793a',g:'R',title:'Mudbreaker Roar'});
  if(t.crackedArmorTimer>0)icons.push({c:'#d6b45f',g:'C',title:'Cracked Armor'});
  if(t.focusMarkTimer>0)icons.push({c:'#ffe066',g:'F',title:'Focus Mark',pulse:true});
  if(t.roarWeakenTimer>0)icons.push({c:'#8fbc3a',g:'R',title:'Roar Weaken'});
  if(t.primalWrathBleed&&t.primalWrathBleed.timer>0)icons.push({c:'#6b8e23',g:'P',title:'Primal Wrath',pulse:true});
  if(t.judgmentMark&&t.judgmentMarkTimer>0)icons.push({c:'#ffe066',g:'J',title:'Judgment of Light'});
  if(t.deadlyPoisonStacks>0&&t.deadlyPoisonTimer>0)icons.push({c:'#55aa33',g:t.deadlyPoisonStacks,title:'Deadly Poison'});
  if(t.garroteBleeding&&t.garroteBleedTimer>0)icons.push({c:'#cc2244',g:'G',title:'Garrote'});
  if(t.deathmarkTimer>0)icons.push({c:'#55aa33',g:'D',title:'Deathmark',pulse:true});
  if(t.silenceTimer>0)icons.push({c:'#ffaa00',g:'X',title:'Silence'});
  if(t._agonyStacks>0&&t._agonyTimer>0)icons.push({c:'#9b59b6',g:t._agonyStacks,title:'Agony x'+t._agonyStacks,pulse:true});
  // BUFFS (green/gold) ----------------
  if(t.hotTimer>0)icons.push({c:'#3aa84e',g:'+',title:'HoT'});
  if(t.armorBuff>0)icons.push({c:'#aaa',g:'A',title:'Armor'});
  if(t.atkSpdBuff&&t.atkSpdBuff>1)icons.push({c:'#ff8800',g:'Ã‚Â»',title:'Atk Spd'});
  if(t.btActive)icons.push({c:'#ff4444',g:'X',title:'Bloodthirst'});
  if(t.lastStandActive)icons.push({c:'#ffaa00',g:'!',title:'Last Stand'});
  if(t.amsActive)icons.push({c:'#aa66ff',g:'M',title:'Anti-Magic'});
  if(t.remorselessWinterTimer>0)icons.push({c:'#88ddff',g:'Ã¢Ââ€ž',title:'Remorseless Winter'});
  if(t.dancingRuneWeaponTimer>0)icons.push({c:'#cc2244',g:'Ã¢Å¡â€',title:'Rune Weapon'});
  if(t.darkTransformation&&t.darkTransformation.active)icons.push({c:'#6622aa',g:'D',title:'Dark Transformation',pulse:true});
  if(t.boneShield&&t.boneShield.charges>0)icons.push({c:'#ccddcc',g:t.boneShield.charges,title:'Bone Shield'});
  if(t.siActive)icons.push({c:'#88ff88',g:'S',title:'Survival'});
  if(t.berserkActive)icons.push({c:'#8fbc3a',g:'B',title:'Berserk',pulse:true});
  if(t.incarnationActive)icons.push({c:'#c8a050',g:'Ã¢Ëœâ€¦',title:'Incarnation',pulse:true});
  if(t.ironfur&&t.ironfur.stacks>0)icons.push({c:'#c8a050',g:t.ironfur.stacks,title:'Ironfur'});
  if(t.earthwardenShield>0)icons.push({c:'#6b8e23',g:'E',title:'Earthwarden'});
  if(t._batataMudShield>0&&t._batataMudShieldTimer>0)icons.push({c:'#8a6a32',g:'S',title:'Mud Shield'});
  if(t._taoonBloodShield>0&&t._taoonBloodShieldTimer>0)icons.push({c:'#cc2244',g:'S',title:'Blood Shield'});
  if(t._gapInvulnerableTimer>0)icons.push({c:t._gapInvulnerableColor||'#ffffff',g:'I',title:t._gapInvulnerableLabel||'Invulnerable',pulse:true});
  if(t.bloodOathTimer>0)icons.push({c:'#ff6688',g:'O',title:'Blood Oath'});
  if(t.necropolisGuardTimer>0)icons.push({c:'#6622aa',g:'N',title:'Necropolis Guard',pulse:true});
  if(t.crimsonCovenantTimer>0)icons.push({c:'#cc2244',g:'C',title:'Crimson Covenant',pulse:true});
  if(t.mawOfGrave&&t.mawOfGrave.t>0)icons.push({c:'#44c7ff',g:'M',title:'Maw of the Grave',pulse:true});
  if(t.shelterPulseTimer>0)icons.push({c:'#6fbf5a',g:'G',title:'Shelter Pulse'});
  if(t.livingBulwarkTimer>0)icons.push({c:'#6fbf5a',g:'B',title:'Living Bulwark',pulse:true});
  if(t.quakebreakRampartTimer>0)icons.push({c:'#b0793a',g:'Q',title:'Quakebreak Rampart',pulse:true});
  if(t.frenziedRegen&&t.frenziedRegen.active)icons.push({c:'#88ff88',g:'+',title:'Frenzied Regen',pulse:true});
  if(t.heartOfEarthTimer>0)icons.push({c:'#cc8855',g:'Ã¢â„¢Â¥',title:'Heart of Earth',pulse:true});
  if(t.incarnTreeActive)icons.push({c:'#33cc33',g:'Ã°Å¸Å’Â³',title:'Tree of Life',pulse:true});
  if(t.entanglingRoots)icons.push({c:'#33aa33',g:'R',title:'Roots Ready'});
  if(t.rejuvAura)icons.push({c:'#44ff44',g:'Ã¢â„¢Â»',title:'Rejuv Aura'});
  if(t.avengingWrathTimer>0)icons.push({c:'#ffd700',g:'Ã¢Å¡â€',title:'Avenging Wrath',pulse:true});
  if(t.shieldOfVengeance&&t.shieldOfVengeance.active)icons.push({c:'#ffd700',g:'S',title:'Shield of Vengeance'});
  if(t.bladeOfWrathBuff>0)icons.push({c:'#ffd700',g:'B',title:'Blade of Wrath'});
  if(t.ardentDefenderTimer>0)icons.push({c:'#ffd700',g:'Ã¢Ëœâ€¦',title:'Ardent Defender',pulse:true});
  if(t.goakTimer>0)icons.push({c:'#ffd700',g:'G',title:'Guardian of Ancient Kings',pulse:true});
  if(t.sacredBulwarkTimer>0)icons.push({c:'#ffd700',g:'S',title:'Sacred Bulwark'});
  if(t.guardianOathTimer>0)icons.push({c:'#ffd700',g:'O',title:'Guardian Oath'});
  if(t.ashenGuardianTimer>0)icons.push({c:'#ff3344',g:'H',title:'Ashen Guardian',pulse:true});
  if(t.hallowedLeapShieldTimer>0)icons.push({c:'#ffd700',g:'L',title:'Hallowed Leap',pulse:true});
  if(t.infusionOfLightTimer>0)icons.push({c:'#ffe066',g:'I',title:'Infusion of Light',pulse:true});
  if(t.barrierOfFaithTimer>0)icons.push({c:'#ffd700',g:'Ã¢â€ºÅ ',title:'Barrier of Faith'});
  if(t._beaconMark&&t._beaconMark>0)icons.push({c:'#ffd700',g:'Ã¢Ëœâ‚¬',title:'Beacon of Virtue',pulse:true});
  if(t._eternalFlame&&t._eternalFlame>0)icons.push({c:'#ff8800',g:'Ã°Å¸â€Â¥',title:'Eternal Flame'});
  if(t.pwsBlocks>0)icons.push({c:'#ffd700',g:t.pwsBlocks,title:'Shield'});
  if(t.divineShield)icons.push({c:'#ffeeaa',g:'Ã¢Ëœâ€¦',title:'Divine'});
  if(t._pom&&t._pom.bounces>0)icons.push({c:'#66ffaa',g:t._pom.bounces,title:'Prayer of Mending ('+t._pom.bounces+' bounces)'});
  if(t._guardianSpirit)icons.push({c:'#ffd700',g:'Ã¢ËœÂ¥',title:'Guardian Spirit',pulse:true});
  if(t._angelForm)icons.push({c:'#66ffaa',g:'Ã¢Å“Â¦',title:'Angel of Mercy',pulse:true});
  if(t._pwBarrier)icons.push({c:'#ffaadd',g:'B',title:'PW:Barrier ('+t._pwBarrier.hp+')'});
  if(t._raptureShield)icons.push({c:'#ffaadd',g:'R',title:'Rapture ('+t._raptureShield.hp+')'});
  if(t._divineHymn)icons.push({c:'#66ffaa',g:'Ã¢â„¢Â«',title:'Divine Hymn',pulse:true});
  if(t._voidform)icons.push({c:'#aa66ff',g:'V',title:'Voidform',pulse:true});
  if(t._voidTorrent)icons.push({c:'#aa66ff',g:'T',title:'Void Torrent',pulse:true});
  if(t._madness)icons.push({c:'#aa66ff',g:'!',title:'Surrender to Madness',pulse:true});
  if(t._madnessStun>0)icons.push({c:'#666',g:'Ã¢â‚¬Â¦',title:'Exhausted'});
  if(t.furyTimer>0)icons.push({c:'#ff8c00',g:'F',title:'Fury'});
  if(t.bladeGuardTimer>0)icons.push({c:'#44ccff',g:'G',title:'Blade Guard',pulse:true});
  if(t._bladeStormTimer>0)icons.push({c:'#ff8800',g:'Ã¢Å¡â€',title:'Blade Storm',pulse:true});
  if(t._enraged)icons.push({c:'#ff2200',g:'!',title:'Enraged',pulse:true});
  if(t._thousandCutsTimer>0)icons.push({c:'#ffdd00',g:'Ã‚Â»',title:'Thousand Cuts',pulse:true});
  if(t._omnislashActive)icons.push({c:'#ffcc00',g:'Ã¢Å¡â€',title:'Omnislash',pulse:true});
  // Alibaba status icons
  if(t.polymorphCD)icons.push({c:'#ff88cc',g:'P',title:'Polymorph ('+(Math.ceil((t.polymorphCDt||0)/tickHz))+'s)'});
  if(t._blizzardTimer>0)icons.push({c:'#88ddff',g:'B',title:'Blizzard',pulse:true});
  if(t._frozenOrb)icons.push({c:'#66ccff',g:'O',title:'Frozen Orb',pulse:true});
  if(t.stormkeeper)icons.push({c:'#aa88ff',g:t.stormkeeper.counter+'/'+t.stormkeeper.every,title:'Stormkeeper'});
  if(t._igniteStacks&&t._igniteStacks.length>0)icons.push({c:'#ff4400',g:t._igniteStacks.length+'',title:'Ignite x'+t._igniteStacks.length});
  if(t._armorShred>0)icons.push({c:'#ff6600',g:'Ã¢â€ â€œ',title:'Armor Shred'});
  if(t._healReductionTimer>0)icons.push({c:'#ff4400',g:'Ã¢Ë†â€™',title:'Heal Reduction'});
  if(t._searingBrandTimer>0)icons.push({c:'#ff6a22',g:'B',title:'Searing Brand'});
  if(t._gravityBrandTimer>0)icons.push({c:'#9bb8ff',g:'G',title:'Gravity Brand',pulse:true});
  if(t._astralBlightTimer>0)icons.push({c:'#8bdfff',g:'A',title:'Astral Blight',pulse:true});
  if(t.priorityTarget)icons.push({c:t.color||'#8bdfff',g:'!',title:t.preferredBy?('Priority: '+t.preferredBy):'Priority Target',pulse:true});
  if(t.stormWard)icons.push({c:t.color||'#8bdfff',g:t.stormWardKind==='iron'?'I':'M',title:t.name||'Storm Ward',pulse:true});
  if(t.stormMote)icons.push({c:'#8bdfff',g:'M',title:'Storm Mote',pulse:true});
  if(t._stormExposedTimer>0)icons.push({c:'#ffd166',g:'E',title:'Judgment Window',pulse:true});
  if(t._royalStingTimer>0)icons.push({c:'#ffdd44',g:'S',title:'Royal Sting'});
  if(t.timeEnraged)icons.push({c:'#ff2200',g:'!',title:'Boss Enraged',pulse:true});
  if(t.royalCarapaceTimer>0)icons.push({c:'#ffdd44',g:'C',title:'Carapace Casting',pulse:true});
  if(t.hiveShield&&t.hiveShield.hp>0)icons.push({c:t.hiveShield.color||'#ffdd44',g:t.hiveShield.astralWard?'W':'S',title:t.hiveShield.astralWard?'Lantern Ward':'Boss Shield',pulse:true});
  if(t.stealth&&t.vanishCD&&!(t.stealthHits>0))icons.push({c:'#aa66cc',g:'A',title:'Ambush Ready',pulse:true});
  const bossSoon=imminentBossSkillIcon(t,tickHz);
  if(bossSoon)icons.push(bossSoon);
  if(t.vanishActive)icons.push({c:'#440044',g:'V',title:'Vanish'});
  if(t.sliceAndDice&&t.sliceAndDice.timer>0)icons.push({c:'#ffcc00',g:'S',title:'Slice & Dice'});
  if(t.shadowDance&&t.shadowDance.t>t.shadowDance.every-t.shadowDance.dur)icons.push({c:'#aa44ff',g:'D',title:'Shadow Dance',pulse:true});
  if(t.cheatDeathTimer>0)icons.push({c:t.branch==='b'?'#55aa33':'#880044',g:'C',title:'Cheat Death',pulse:true});
  if(t.cloakOfShadows&&t.cloakOfShadows.active)icons.push({c:'#440066',g:'C',title:'Cloak of Shadows',pulse:true});
  if(t.crimsonVial&&t.crimsonVial.active)icons.push({c:'#cc3344',g:'+',title:'Crimson Vial',pulse:true});
  if(t.killingSpree)icons.push({c:'#ff2244',g:'K',title:'Killing Spree',pulse:true});
  if(t.dfaTimer>0)icons.push({c:t.branch==='b'?'#55aa33':'#ff4466',g:'D',title:'Death from Above',pulse:true});
  if(t.avatarTimer>0)icons.push({c:'#ffd700',g:'A',title:'Avatar',pulse:true});
  if(t.spellReflectReady)icons.push({c:'#5588ff',g:'R',title:'Spell Reflect Ready'});
  if(t.demoShoutActive>0)icons.push({c:'#ff8800',g:'D',title:'Demoralizing Shout'});
  if(t.rallied)icons.push({c:'#ffd700',g:'R',title:'Rally Cry'});
  if(t.zavsGuardPulseTimer>0)icons.push({c:'#cfd6df',g:'G',title:'Guard Pulse'});
  if(t.citadelWallTimer>0)icons.push({c:'#d6b45f',g:'W',title:'Citadel Wall',pulse:true});
  if(t._zavsLineShield>0&&t._zavsLineShieldTimer>0)icons.push({c:'#cfd6df',g:'L',title:'Unbreakable Line'});
  if(t.bannerfallTimer>0)icons.push({c:'#ffe066',g:'B',title:'Bannerfall Standard',pulse:true});
  if(t.bannerfallGuardTimer>0)icons.push({c:'#ffe066',g:'G',title:'Bannerfall Guard',pulse:true});
  if(t.lastStandSigTimer>0)icons.push({c:'#ffd700',g:'!',title:'Last Stand',pulse:true});
  if(t.meteorSlamActive)icons.push({c:'#ff4400',g:'M',title:'Meteor Slam',pulse:true});
  if(t._drainChanneling)icons.push({c:'#33ff66',g:'D',title:'Drain Life',pulse:true});
  if(t._rapidChanneling)icons.push({c:'#ffd700',g:'R',title:'Rapid Fire',pulse:true});
  if(t._trueshot)icons.push({c:'#ffd700',g:'T',title:'Trueshot',pulse:true});
  if(t._trueshotAuraTimer>0)icons.push({c:'#ffd700',g:'TA',title:'Trueshot Aura',pulse:true});
  if(t.steadyFocus&&t.steadyFocus.active)icons.push({c:'#88ccff',g:'S',title:'Steady Focus'});
  if(t.lockAndLoad&&t.lockAndLoad.charges>0)icons.push({c:'#ff8844',g:t.lockAndLoad.charges,title:'Lock & Load',pulse:true});
  if(t._blackArrow)icons.push({c:'#6633aa',g:'BA',title:'Black Arrow DoT'});
  if(t._darkPactShield&&t._darkPactShield.hp>0)icons.push({c:'#9b59b6',g:'P',title:'Dark Pact ('+t._darkPactShield.hp+')',pulse:true});
  if(t.overclock&&t.overclock.active>0)icons.push({c:'#44ccff',g:'Ã¢Å¡Â¡',title:'Overclock',pulse:true});
  if(t._engShield&&t._engShield.hp>0)icons.push({c:'#44aaff',g:'S',title:'Shield ('+t._engShield.hp+')',pulse:true});
  if(t._mechRebuilding)icons.push({c:'#ff4400',g:'!',title:'Rebuilding Mech'});
  if(t._overdriveTimer>0)icons.push({c:'#ff4400',g:'OD',title:'Overdrive',pulse:true});
  if(t._turretODTimer>0)icons.push({c:'#44ccff',g:'TO',title:'Turret Overdrive',pulse:true});
  if(t._siegeModeTimer>0)icons.push({c:'#ffcc66',g:'SM',title:'Siege Mode',pulse:true});
  if(t._mechOLTimer>0)icons.push({c:'#ff5ca8',g:'CO',title:'Cannon Overdrive',pulse:true});
  if(t._elixirDR>0)icons.push({c:'#44ffaa',g:'E',title:'Elixir (50% DR)',pulse:true});
  if(t._gardenZone)icons.push({c:'#44ff88',g:'Ã°Å¸Å’Â¿',title:'Garden of Renewal',pulse:true});
  if(t._plagueCloud)icons.push({c:'#aa44ff',g:'Ã¢ËœÂ',title:'Plague Cloud',pulse:true});
  if(t._eclipse){const _ep=t._eclipse.phase;icons.push({c:_ep==='solar'?'#ffd700':'#aaccff',g:_ep==='solar'?'Ã¢Ëœâ‚¬':'Ã¢ËœÂ½',title:'Eclipse: '+_ep+' ('+t._eclipse.count+'/'+t._eclipse.maxCount+')'})}
  if(t._celestialAlignment)icons.push({c:'#ffd700',g:'Ã¢Å“Â¦',title:'Celestial Alignment',pulse:true});
  if(t._astralPower&&t._astralPower.stacks>0)icons.push({c:'#ccaaff',g:''+t._astralPower.stacks,title:'Astral Power Ãƒâ€”'+t._astralPower.stacks});
  if(t._nbBuff>0)icons.push({c:'#ffaa33',g:'B',title:"Nature's Blessing"});
  if(t._darkPactDoTSpeed)icons.push({c:'#5a1a5a',g:'Ãƒâ€”3',title:'DoTs 3Ãƒâ€” Speed',pulse:true});
  if(t._demoEmpTimer>0)icons.push({c:'#aa66ff',g:'E',title:'Empowered',pulse:true});
  return icons;
}

export function drawStatusIconChips(ctx,view){
  const icons=view.icons||[];
  if(!icons.length)return;
  const state=view.state;
  const arenaTop=view.arenaTop||0;
  const frame=view.frame||0;
  const x=view.x||0;
  let topY=view.topY||0;
  if(state==='battle')topY=Math.max(arenaTop+4,topY);
  const sz=10,gap=1;
  const maxShow=6;
  const shown=icons.length>maxShow?icons.slice(0,maxShow):icons;
  const total=shown.length*sz+(shown.length-1)*gap;
  let ix=x-total/2;
  for(const ic of shown){
    const py=state==='battle'?Math.max(arenaTop+4,ic.pulse?topY+Math.sin(frame*0.2)*1:topY):(ic.pulse?topY+Math.sin(frame*0.2)*1:topY);
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.beginPath();ctx.roundRect(ix-0.5,py-0.5,sz+1,sz+1,2);ctx.fill();
    ctx.fillStyle=ic.c;
    ctx.beginPath();ctx.roundRect(ix,py,sz,sz,2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 7px Arial';ctx.textAlign='center';
    ctx.fillText(ic.g,ix+sz/2,py+sz-2);
    ctx.restore();
    ix+=sz+gap;
  }
}

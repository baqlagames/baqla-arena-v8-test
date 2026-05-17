import { ARENA_SPEC_HALO_COLORS } from '../data/roles.js';

export function createSpecAccessoryRenderer({ ctx, view, emitParticle, randomRange } = {}) {
  let frame = 0;
  const rnd = typeof randomRange === 'function' ? randomRange : ((min, max) => min + Math.random() * (max - min));
  const addP = typeof emitParticle === 'function' ? emitParticle : (() => {});

  function sync() {
    const v = typeof view === 'function' ? view() : {};
    frame = v.frame || 0;
  }

function arena_specHalo(u){
  if(!u||!u.specId)return null;
  return ARENA_SPEC_HALO_COLORS[u.specId]||null;
}
// =====================================================================
// ARENA_SPEC_ACCESSORIES Ã¢â‚¬â€ per-spec sprite overlays drawn on top of each
// WoW-class unit. Each entry is a fn(x, y, s, u) that renders extra
// visual elements (wings/shield/book/wings/claws/etc.) so each spec is
// instantly identifiable. Drawn in drawUnit just before the HP bar.
// =====================================================================
const ARENA_SPEC_ACCESSORIES={
  // ===== TAOON (Death Knight) =====
  '1_base':function(x,y,s,u){ // Frost DK base Ã¢â‚¬â€ icy aura particles
    ctx.save();
    if(frame%6===0){
      const px=x+rnd(-s*0.8,s*0.8),py=y+rnd(-s*0.5,s*0.5);
      addP(px,py,'#aaeeff',1,2);
    }
    ctx.restore();
  },
  '1_a':function(x,y,s,u){ // Bloodwarden - crimson shield glow
    ctx.save();
    // Blood drip particles
    if(frame%8===0)addP(x+rnd(-s*0.3,s*0.3),y+s*0.4+rnd(0,4),'#cc2244',1,2);
    if(u.crimsonCovenantTimer>0||u.necropolisGuardTimer>0){
      ctx.globalAlpha=0.22+Math.sin(frame*0.1)*0.08;
      ctx.strokeStyle='#ff4466';ctx.lineWidth=1.8;
      ctx.beginPath();ctx.arc(x,y,s+3,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  },
  '1_b':function(x,y,s,u){ // Gravebinder - purple/cyan spectral chains
    ctx.save();
    if(frame%6===0){
      const px=x+rnd(-s*0.6,s*0.6),py=y+rnd(-s*0.3,s*0.6);
      addP(px,py,(frame%12===0)?'#44c7ff':'#8a66ff',1,2);
    }
    // Ghoul count indicator
    if(u.raiseGhoul&&u.raiseGhoul.active>0){
      ctx.fillStyle='#44ff44';ctx.globalAlpha=0.8;
      ctx.font='bold 7px sans-serif';ctx.textAlign='center';
      ctx.fillText('Ã¢ËœÂ '+u.raiseGhoul.active,x,y+s+12);
    }
    ctx.restore();
  },
  // ===== ZAYT (paladin) =====
  '3_base':function(x,y,s,u){ // Retribution Ã¢â‚¬â€ gold wings + sword glow
    const _f=u.facing||1;
    ctx.save();
    // Two arched wings either side
    ctx.fillStyle='#ffe066';ctx.globalAlpha=0.85;
    ctx.beginPath();ctx.ellipse(x-s*0.7,y-s*0.2,s*0.45,s*0.18,-0.4,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(x+s*0.7,y-s*0.2,s*0.45,s*0.18,0.4,0,Math.PI*2);ctx.fill();
    // Inner wing detail
    ctx.fillStyle='#ffffff';ctx.globalAlpha=0.55;
    ctx.beginPath();ctx.ellipse(x-s*0.5,y-s*0.15,s*0.22,s*0.10,-0.4,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(x+s*0.5,y-s*0.15,s*0.22,s*0.10,0.4,0,Math.PI*2);ctx.fill();
    // Sword glow tracing
    ctx.globalAlpha=0.6+Math.sin(frame*0.15)*0.2;
    ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x+_f*s*0.3,y-s*0.1);ctx.lineTo(x+_f*s*0.7,y-s*0.55);ctx.stroke();
    ctx.restore();
  },
  '3_a':function(x,y,s,u){ // Protection Ã¢â‚¬â€ large round shield + raised sword
    const _f=u.facing||1;
    ctx.save();
    // Shield body Ã¢â‚¬â€ circular silver-blue
    ctx.fillStyle='#88aaff';ctx.globalAlpha=0.95;
    ctx.beginPath();ctx.arc(x-_f*s*0.55,y+s*0.05,s*0.45,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5a6088';
    ctx.beginPath();ctx.arc(x-_f*s*0.55,y+s*0.05,s*0.36,0,Math.PI*2);ctx.fill();
    // Cross emblem on shield
    ctx.fillStyle='#ffd700';
    ctx.fillRect(x-_f*s*0.55-1.5,y-s*0.18,3,s*0.4);
    ctx.fillRect(x-_f*s*0.55-s*0.18,y+s*0.05-1.5,s*0.36,3);
    // Raised sword on the other side
    ctx.strokeStyle='#cccccc';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(x+_f*s*0.4,y-s*0.05);ctx.lineTo(x+_f*s*0.5,y-s*0.7);ctx.stroke();
    ctx.fillStyle='#ffd700';
    ctx.fillRect(x+_f*s*0.32,y-s*0.05-1,s*0.20,2);
    ctx.restore();
  },
  '3_b':function(x,y,s,u){ // Holy Ã¢â‚¬â€ open book in hand + halo above
    ctx.save();
    // Halo ring above head
    ctx.strokeStyle='#ffffff';ctx.lineWidth=2.5;ctx.globalAlpha=0.85;
    ctx.beginPath();ctx.ellipse(x,y-s*0.95,s*0.35,s*0.10,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#ffe066';ctx.lineWidth=1;ctx.globalAlpha=0.6+Math.sin(frame*0.1)*0.2;
    ctx.beginPath();ctx.ellipse(x,y-s*0.95,s*0.40,s*0.13,0,0,Math.PI*2);ctx.stroke();
    // Open book in front of unit
    const _f=u.facing||1;
    ctx.globalAlpha=0.95;
    ctx.fillStyle='#fffaea';
    ctx.fillRect(x+_f*s*0.25,y+s*0.05,s*0.30,s*0.22);
    ctx.fillStyle='#a08a2a';
    ctx.fillRect(x+_f*s*0.25,y+s*0.05,s*0.04,s*0.22);
    ctx.fillRect(x+_f*s*0.40,y+s*0.05,s*0.02,s*0.22);
    // Page lines
    ctx.strokeStyle='#a08a2a';ctx.lineWidth=0.7;ctx.globalAlpha=0.6;
    for(let i=0;i<3;i++){
      ctx.beginPath();ctx.moveTo(x+_f*s*0.27,y+s*0.10+i*0.04*s);ctx.lineTo(x+_f*s*0.38,y+s*0.10+i*0.04*s);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+_f*s*0.43,y+s*0.10+i*0.04*s);ctx.lineTo(x+_f*s*0.53,y+s*0.10+i*0.04*s);ctx.stroke();
    }
    ctx.restore();
  },
  // ===== FILFIL HAR (mage) =====
  '6_base':function(x,y,s,u){ // Pyromancer Ã¢â‚¬â€ 3 orbiting flame motes
    ctx.save();
    for(let i=0;i<3;i++){
      const _a=frame*0.06+i*Math.PI*2/3;
      const _ox=x+Math.cos(_a)*s*0.85;
      const _oy=y-s*0.3+Math.sin(_a)*s*0.30;
      ctx.fillStyle='#ff6600';ctx.globalAlpha=0.85;
      ctx.beginPath();ctx.arc(_ox,_oy,2.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffcc00';ctx.globalAlpha=0.6;
      ctx.beginPath();ctx.arc(_ox,_oy,1.2,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  },
  '6_a':function(x,y,s,u){ // Frost Ã¢â‚¬â€ ice crystal spikes on shoulders + frost wisp
    ctx.save();
    ctx.fillStyle='#66ccff';ctx.globalAlpha=0.85;
    ctx.beginPath();ctx.moveTo(x-s*0.4,y-s*0.1);ctx.lineTo(x-s*0.55,y-s*0.55);ctx.lineTo(x-s*0.28,y-s*0.22);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(x+s*0.4,y-s*0.1);ctx.lineTo(x+s*0.55,y-s*0.55);ctx.lineTo(x+s*0.28,y-s*0.22);ctx.closePath();ctx.fill();
    ctx.fillStyle='#aaeeff';ctx.globalAlpha=0.5;
    ctx.beginPath();ctx.moveTo(x,y-s*0.5);ctx.lineTo(x-s*0.08,y-s*0.75);ctx.lineTo(x+s*0.08,y-s*0.75);ctx.closePath();ctx.fill();
    if(frame%5===0)addP(x+rnd(-4,4),y-s*0.6,'#ddeeff',1,2);
    ctx.restore();
  },
  '6_b':function(x,y,s,u){ // Storm Ã¢â‚¬â€ crackling lightning arcs + static sparks
    ctx.save();
    ctx.strokeStyle='#aa88ff';ctx.lineWidth=1.5;ctx.globalAlpha=0.8;
    for(let i=0;i<3;i++){
      const _a=frame*0.08+i*Math.PI*2/3;
      const _ox=x+Math.cos(_a)*s*0.7;const _oy=y-s*0.4+Math.sin(_a)*s*0.25;
      ctx.beginPath();ctx.moveTo(x,y-s*0.3);
      ctx.lineTo(x+rnd(-3,3),y-s*0.5+rnd(-2,2));ctx.lineTo(_ox,_oy);ctx.stroke();
    }
    ctx.fillStyle='#ffee66';ctx.globalAlpha=0.7;
    const _sa=frame*0.12;
    ctx.beginPath();ctx.arc(x+Math.cos(_sa)*s*0.5,y-s*0.6+Math.sin(_sa)*3,2,0,Math.PI*2);ctx.fill();
    if(frame%4===0)addP(x+rnd(-s*0.3,s*0.3),y-s*0.5,'#aa88ff',1,2);
    ctx.restore();
  },
  // ===== FOUL (warlock) =====
  '7_base':function(x,y,s,u){ // Affliction Ã¢â‚¬â€ green skull mote orbiting
    ctx.save();
    const _a=frame*0.04;
    const _ox=x+Math.cos(_a)*s*0.9;
    const _oy=y-s*0.3+Math.sin(_a)*s*0.20;
    // Skull-shaped mote
    ctx.fillStyle='#cc88ff';ctx.globalAlpha=0.85;
    ctx.beginPath();ctx.arc(_ox,_oy,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#000000';ctx.globalAlpha=0.6;
    ctx.beginPath();ctx.arc(_ox-1,_oy-0.5,0.7,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(_ox+1,_oy-0.5,0.7,0,Math.PI*2);ctx.fill();
    // Sickly wisps trailing
    if(frame%5===0)addP(x+rnd(-s*0.3,s*0.3),y-s*0.4,'#9b59b6',1,3);
    ctx.restore();
  },
  '7_a':function(x,y,s,u){ // Demonology Ã¢â‚¬â€ dark purple aura + demon circle
    const _f=u.facing||1;
    ctx.save();
    ctx.strokeStyle='#aa66ff';ctx.lineWidth=1;ctx.globalAlpha=0.5+Math.sin(frame*0.1)*0.2;
    ctx.beginPath();ctx.ellipse(x,y+s*0.7,s*0.5,s*0.18,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#5a2a7a';ctx.globalAlpha=0.85;
    ctx.beginPath();ctx.arc(x+_f*s*0.7,y+s*0.1,s*0.18,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff4444';ctx.globalAlpha=1;
    ctx.beginPath();ctx.arc(x+_f*s*0.65,y+s*0.05,1,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+_f*s*0.75,y+s*0.05,1,0,Math.PI*2);ctx.fill();
    ctx.restore();
  },
  '7_b':function(x,y,s,u){ // Destruction Ã¢â‚¬â€ green felfire aura + flame motes
    ctx.save();
    const _pulse=0.4+Math.sin(frame*0.12)*0.15;
    ctx.fillStyle='#33ff66';ctx.globalAlpha=_pulse*0.35;
    ctx.beginPath();ctx.arc(x,y,s*0.85,0,Math.PI*2);ctx.fill();
    for(let i=0;i<4;i++){
      const _a=frame*0.06+i*Math.PI/2;
      const _mx=x+Math.cos(_a)*s*0.75;
      const _my=y+Math.sin(_a)*s*0.30;
      ctx.fillStyle='#33cc44';ctx.globalAlpha=0.9;
      ctx.beginPath();ctx.arc(_mx,_my,2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#88ff66';ctx.globalAlpha=0.6;
      ctx.beginPath();ctx.arc(_mx,_my,1.1,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  },
  // ===== SABBAR (hunter) =====
  '8_base':function(x,y,s,u){ // Marksmanship Ã¢â‚¬â€ long bow + scope glint
    const _f=u.facing||1;
    ctx.save();
    // Long bow drawn on facing side
    ctx.strokeStyle='#7a5028';ctx.lineWidth=1.5;ctx.globalAlpha=0.95;
    ctx.beginPath();ctx.arc(x+_f*s*0.55,y,s*0.5,-Math.PI/2.5,Math.PI/2.5);ctx.stroke();
    // Bowstring
    ctx.strokeStyle='#ddddaa';ctx.lineWidth=0.7;
    ctx.beginPath();
    ctx.moveTo(x+_f*s*0.55+_f*Math.cos(-Math.PI/2.5)*s*0.5,y+Math.sin(-Math.PI/2.5)*s*0.5);
    ctx.lineTo(x+_f*s*0.55+_f*Math.cos(Math.PI/2.5)*s*0.5,y+Math.sin(Math.PI/2.5)*s*0.5);
    ctx.stroke();
    // Gold scope glint
    ctx.fillStyle='#ffd700';ctx.globalAlpha=0.8+Math.sin(frame*0.2)*0.2;
    ctx.beginPath();ctx.arc(x+_f*s*0.55,y,1.5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  },
  '8_a':function(x,y,s,u){ // Trapper Ã¢â‚¬â€ bear trap glyph + quiver arrows
    const _f=u.facing||1;
    ctx.save();
    // Ground trap glyph (circle with teeth, pulsing)
    ctx.strokeStyle='#aa6633';ctx.lineWidth=1.5;ctx.globalAlpha=0.7+Math.sin(frame*0.1)*0.2;
    ctx.beginPath();ctx.arc(x,y+s*0.7,s*0.2,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<6;i++){const a=Math.PI*2*i/6;ctx.fillStyle='#aa6633';ctx.beginPath();ctx.arc(x+Math.cos(a)*s*0.2,y+s*0.7+Math.sin(a)*s*0.2,1.5,0,Math.PI*2);ctx.fill()}
    // Quiver on back
    ctx.fillStyle='#5a3a18';ctx.fillRect(x-_f*s*0.35,y-s*0.4,4,s*0.55);
    ctx.strokeStyle='#cccccc';ctx.lineWidth=1;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-_f*s*0.33,y-s*0.35+i*5);ctx.lineTo(x-_f*s*0.33,y-s*0.55+i*3);ctx.stroke()}
    ctx.restore();
  },
  '8_b':function(x,y,s,u){ // Beast Mastery Ã¢â‚¬â€ small beast cub at side
    const _f=u.facing||1;
    ctx.save();
    // Small spirit beast cub
    ctx.fillStyle='#3aa84e';ctx.globalAlpha=0.8+Math.sin(frame*0.1)*0.1;
    ctx.beginPath();ctx.arc(x+_f*s*0.7,y+s*0.3,s*0.18,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+_f*s*0.75,y+s*0.18,s*0.12,0,Math.PI*2);ctx.fill();
    // Tiny ears
    ctx.fillStyle='#2a6a2a';
    ctx.beginPath();ctx.arc(x+_f*s*0.69,y+s*0.09,s*0.05,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+_f*s*0.81,y+s*0.09,s*0.05,0,Math.PI*2);ctx.fill();
    // Glowing eyes
    ctx.fillStyle='#aaffaa';
    ctx.beginPath();ctx.arc(x+_f*s*0.72,y+s*0.17,1,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+_f*s*0.78,y+s*0.17,1,0,Math.PI*2);ctx.fill();
    ctx.restore();
  },
  // ===== NAANA (priest) =====
  '10_base':function(x,y,s,u){ // Holy Ã¢â‚¬â€ halo above + prayer hands glow
    ctx.save();
    // Holy halo (white-gold) above head
    ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.globalAlpha=0.9;
    ctx.beginPath();ctx.ellipse(x,y-s*0.95,s*0.35,s*0.10,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#ffe066';ctx.lineWidth=1;ctx.globalAlpha=0.6+Math.sin(frame*0.1)*0.2;
    ctx.beginPath();ctx.ellipse(x,y-s*0.95,s*0.45,s*0.13,0,0,Math.PI*2);ctx.stroke();
    // Soft glow around chest (clasped prayer)
    ctx.fillStyle='#ffffaa';ctx.globalAlpha=0.4+Math.sin(frame*0.12)*0.2;
    ctx.beginPath();ctx.arc(x,y+s*0.15,s*0.18,0,Math.PI*2);ctx.fill();
    ctx.restore();
  },
  '10_a':function(x,y,s,u){ // Discipline Ã¢â‚¬â€ pink shield bubble + atonement glyph
    ctx.save();
    // Pink-white shield bubble around unit
    ctx.strokeStyle='#ffaadd';ctx.lineWidth=1.5;ctx.globalAlpha=0.55+Math.sin(frame*0.1)*0.2;
    ctx.beginPath();ctx.arc(x,y,s*1.05,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#ffffff';ctx.lineWidth=0.7;ctx.globalAlpha=0.4;
    ctx.beginPath();ctx.arc(x,y,s*1.0,0,Math.PI*2);ctx.stroke();
    // Atonement glyph above (small cross)
    ctx.fillStyle='#ffaadd';ctx.globalAlpha=0.85;
    ctx.fillRect(x-1,y-s*1.0-2,2,8);
    ctx.fillRect(x-3,y-s*1.0+1,8,2);
    ctx.restore();
  },
  '10_b':function(x,y,s,u){ // Shadow Ã¢â‚¬â€ dark hood + void cracks + void portal at feet
    ctx.save();
    // Dark hood overlay
    ctx.fillStyle='#1a0a2a';ctx.globalAlpha=0.9;
    ctx.beginPath();
    ctx.moveTo(x-s*0.55,y-s*0.6);
    ctx.quadraticCurveTo(x,y-s*1.1,x+s*0.55,y-s*0.6);
    ctx.lineTo(x+s*0.45,y-s*0.25);
    ctx.lineTo(x-s*0.45,y-s*0.25);
    ctx.closePath();ctx.fill();
    // Glowing purple eyes with trails
    ctx.fillStyle='#cc88ff';ctx.globalAlpha=0.95;
    ctx.beginPath();ctx.arc(x-s*0.18,y-s*0.42,1.8,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+s*0.18,y-s*0.42,1.8,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#aa66ff';ctx.lineWidth=1;ctx.globalAlpha=0.4;
    ctx.beginPath();ctx.moveTo(x-s*0.18,y-s*0.42);ctx.lineTo(x-s*0.3,y-s*0.55);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+s*0.18,y-s*0.42);ctx.lineTo(x+s*0.3,y-s*0.55);ctx.stroke();
    // Void crack lines on robes
    ctx.strokeStyle='#aa66ff';ctx.lineWidth=0.8;ctx.globalAlpha=0.35+Math.sin(frame*0.06)*0.1;
    ctx.beginPath();ctx.moveTo(x-s*0.2,y-s*0.1);ctx.lineTo(x-s*0.35,y+s*0.2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+s*0.15,y);ctx.lineTo(x+s*0.3,y+s*0.25);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,y-s*0.15);ctx.lineTo(x-s*0.1,y+s*0.1);ctx.stroke();
    // Small void portal at feet
    ctx.strokeStyle='#6622aa';ctx.lineWidth=1.2;ctx.globalAlpha=0.3+Math.sin(frame*0.05)*0.1;
    ctx.beginPath();ctx.ellipse(x,y+s*0.4,s*0.4,s*0.15,frame*0.02,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#1a0020';ctx.globalAlpha=0.15;
    ctx.beginPath();ctx.ellipse(x,y+s*0.4,s*0.3,s*0.1,0,0,Math.PI*2);ctx.fill();
    // Drifting void particles
    if(frame%4===0)addP(x+rnd(-s*0.3,s*0.3),y+s*0.3+rnd(0,5),'#6622aa',1,2);
    if(frame%7===0)addP(x+rnd(-s*0.2,s*0.2),y-rnd(0,s*0.6),'#aa66ff',1,1.5);
    ctx.restore();
  },
  // ===== BAKDOUNES (herbalist) =====
  '11_base':function(x,y,s,u){ // Restoration Ã¢â‚¬â€ leaf crown + green wisps
    ctx.save();
    // 3 leaf shapes forming a crown
    ctx.fillStyle='#3aa84e';ctx.globalAlpha=0.92;
    for(let i=-1;i<=1;i++){
      const _lx=x+i*s*0.30;
      const _ly=y-s*0.85;
      ctx.beginPath();
      ctx.ellipse(_lx,_ly,s*0.13,s*0.06,0,0,Math.PI*2);ctx.fill();
    }
    if(frame%5===0)addP(x+rnd(-s*0.4,s*0.4),y-s*0.7,'#3aff66',1,2);
    ctx.restore();
  },
  '11_a':function(x,y,s,u){ // Moonkin Ã¢â‚¬â€ eclipse glow halo
    ctx.save();
    const _ep=u._eclipse?u._eclipse.phase:'solar';
    const _haloCol=_ep==='solar'?'#ffd700':'#aaccff';
    ctx.globalAlpha=0.25+Math.sin(frame*0.06)*0.12;
    ctx.fillStyle=_haloCol;ctx.beginPath();ctx.arc(x,y-s*0.4,s*0.6,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.5;ctx.fillStyle=_ep==='solar'?'#ffee88':'#ccddff';
    ctx.font='bold '+Math.round(s*0.25)+'px Arial';ctx.textAlign='center';
    ctx.fillText(_ep==='solar'?'Ã¢Ëœâ‚¬':'Ã¢ËœÂ½',x,y-s*0.82);
    ctx.restore();
  },
  '11_b':function(x,y,s,u){ // Witch Doctor Ã¢â‚¬â€ floating spirit orbs + mask marks
    ctx.save();
    const _t=frame*0.06;
    ctx.fillStyle='#ffcc33';ctx.globalAlpha=0.6;
    ctx.beginPath();ctx.arc(x+Math.cos(_t)*s*0.5,y-s*0.7+Math.sin(_t)*s*0.15,s*0.08,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+Math.cos(_t+Math.PI)*s*0.5,y-s*0.7+Math.sin(_t+Math.PI)*s*0.15,s*0.08,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#ffaa33';ctx.lineWidth=1.5;ctx.globalAlpha=0.7;
    ctx.beginPath();ctx.moveTo(x-s*0.2,y-s*0.25);ctx.lineTo(x-s*0.35,y-s*0.15);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+s*0.2,y-s*0.25);ctx.lineTo(x+s*0.35,y-s*0.15);ctx.stroke();
    ctx.restore();
  },
  // ===== HABAQ (Aromancer) =====
  '12_base':function(x,y,s,u){ // Aromancer Ã¢â‚¬â€ green aromatic mist wisps
    ctx.save();
    ctx.fillStyle='#5e8a3a';ctx.globalAlpha=0.15+Math.sin(frame*0.08)*0.08;
    ctx.beginPath();ctx.arc(x,y,s*0.7,0,Math.PI*2);ctx.fill();
    if(frame%6===0)addP(x+rnd(-s*0.5,s*0.5),y+rnd(-s*0.3,s*0.3),'#88cc66',1,2);
    ctx.restore();
  },
  '12_a':function(x,y,s,u){ // Essence Oracle Ã¢â‚¬â€ golden thread particles + petal glow
    ctx.save();
    ctx.fillStyle='#d4a842';ctx.globalAlpha=0.20+Math.sin(frame*0.07)*0.10;
    ctx.beginPath();ctx.arc(x,y,s*0.65,0,Math.PI*2);ctx.fill();
    for(let i=0;i<3;i++){
      const _ra=frame*0.025+i*Math.PI*2/3;
      const _rx=x+Math.cos(_ra)*s*0.6;
      const _ry=y-s*0.4+Math.sin(_ra)*s*0.15;
      ctx.fillStyle='#ffd700';ctx.globalAlpha=0.8;
      ctx.beginPath();ctx.arc(_rx,_ry,2,0,Math.PI*2);ctx.fill();
    }
    if(frame%7===0)addP(x+rnd(-s*0.4,s*0.4),y-s*0.3,'#ffe066',1,2);
    ctx.restore();
  },
  '12_b':function(x,y,s,u){ // Toxin Brewer Ã¢â‚¬â€ purple toxic bubbles + poison mist
    ctx.save();
    ctx.fillStyle='#7a3a9a';ctx.globalAlpha=0.18+Math.sin(frame*0.09)*0.08;
    ctx.beginPath();ctx.arc(x,y,s*0.7,0,Math.PI*2);ctx.fill();
    for(let i=0;i<2;i++){
      const _bi=(frame+i*30)%50;
      const _bf=_bi/50;
      const _bx=x+(i-0.5)*s*0.4;
      const _by=y+s*0.2-_bf*s*0.6;
      ctx.fillStyle='#aa55dd';ctx.globalAlpha=0.7*(1-_bf);
      ctx.beginPath();ctx.arc(_bx,_by,2+_bf*1.5,0,Math.PI*2);ctx.fill();
    }
    if(frame%5===0)addP(x+rnd(-s*0.4,s*0.4),y+s*0.3,'#9a55cc',1,2);
    ctx.restore();
  }
};
function drawSpecAccessory(u){
  sync();
  if(!u||!u.specId||u.isMinion||u.isGhost||u.isMirror)return;
  const fn=ARENA_SPEC_ACCESSORIES[u.specId]; if(!fn)return;
  const _y=u.y+Math.sin(u.bobPhase)*1.2;
  fn(u.x,_y,u.size||16,u);
}

  return {
    specHalo: arena_specHalo,
    drawSpecAccessory,
  };
}

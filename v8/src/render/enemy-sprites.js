export function createEnemySpriteRenderer(deps = {}) {
  const ctx = deps.ctx;
  let frame = 0;

  function sync() {
    const v = typeof deps.view === 'function' ? deps.view() : {};
    frame = v.frame || 0;
  }

function _drawClassicEnemyBody(e,x,y,s){
  if(e.enemyArt==='waspV2'||e.id===3||e.id===42)return _drawWaspEnemyV2(e,x,y,s);
  switch(e.arch){
    case 'swarm':_drawSwarmBody(e,x,y,s);break;
    case 'tank':_drawTankBody(e,x,y,s);break;
    case 'ranged':_drawRangedBody(e,x,y,s);break;
    case 'caster':_drawCasterBody(e,x,y,s);break;
    case 'assassin':_drawAssassinBody(e,x,y,s);break;
    case 'aoe':_drawAoeBody(e,x,y,s);break;
    default:_drawDpsBody(e,x,y,s);break;
  }
}
function _crowBroodVehicleFor(e){
  if(e.vehicleType)return e.vehicleType;
  if(e.burrow)return 'drill';
  if(e.flying)return e.arch==='caster'?'airship':'glider';
  if(e.arch==='swarm')return 'skate';
  if(e.arch==='tank')return e.act>=4?'throne':'mech';
  if(e.arch==='ranged')return 'balloon';
  if(e.arch==='caster')return 'book';
  if(e.arch==='assassin')return 'skate';
  if(e.arch==='aoe')return 'mech';
  return e.act>=5?'throne':'cart';
}
function _crowBroodPalette(e){
  const act=e.act||1;
  const actAccent={1:'#7da43a',2:'#a855f7',3:'#d4a857',4:'#88d8ff',5:'#aa33cc'}[act]||'#8b5cf6';
  const actMetal={1:'#4b3a24',2:'#5a365f',3:'#7a5a28',4:'#40566a',5:'#28102f'}[act]||'#3a1a3a';
  return {
    body:e.act>=5?'#130712':'#1d1720',
    belly:e.color||actMetal,
    accent:e.accent||actAccent,
    act:actAccent,
    metal:actMetal,
    gold:'#d8a938',
    bone:'#e6d5aa',
    eye:e.act>=4?'#ff44cc':'#ff3b30',
    shadow:'rgba(0,0,0,0.55)'
  };
}
function _drawGerbanBroodVehicle(e,x,y,s){
  const p=_crowBroodPalette(e);
  const v=_crowBroodVehicleFor(e);
  const hover=(v==='balloon'||v==='airship'||v==='glider'||e.flying);
  const tier=e.isElite?'heir':(e.act>=5?'prince':(e.act>=3?'soldier':'child'));
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle=p.shadow;
  ctx.beginPath();ctx.ellipse(0,s*(hover?1.12:0.92),s*(hover?0.68:0.78),s*(hover?0.13:0.18),0,0,Math.PI*2);ctx.fill();
  if(hover){
    ctx.globalAlpha=0.16+0.08*Math.sin(frame*0.08+(e.bobPhase||0));
    ctx.fillStyle=p.act;
    ctx.beginPath();ctx.ellipse(0,s*0.35,s*0.85,s*0.32,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  }
  switch(v){
    case 'skate':_drawCrowVehicleSkate(p,s);break;
    case 'balloon':_drawCrowVehicleBalloon(p,s);break;
    case 'airship':_drawCrowVehicleAirship(p,s);break;
    case 'glider':_drawCrowVehicleGlider(p,s);break;
    case 'mech':_drawCrowVehicleMech(p,s,e.arch==='aoe');break;
    case 'drill':_drawCrowVehicleDrill(p,s);break;
    case 'book':_drawCrowVehicleBook(p,s);break;
    case 'throne':_drawCrowVehicleThrone(p,s);break;
    default:_drawCrowVehicleCart(p,s);break;
  }
  _drawCrowBroodPilot(p,s,tier,v);
  _drawCrowRoleMark(e,p,s,v);
  ctx.restore();
}
function _drawCrowVehicleSkate(p,s){
  const lean=Math.sin(frame*0.16)*s*0.04;
  ctx.save();ctx.translate(lean,s*0.36);
  const g=ctx.createLinearGradient(-s*0.75,0,s*0.75,0);
  g.addColorStop(0,p.bone);g.addColorStop(0.45,p.metal);g.addColorStop(1,p.accent);
  ctx.fillStyle=g;ctx.strokeStyle='#120812';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-s*0.92,0);ctx.quadraticCurveTo(-s*0.15,s*0.34,s*0.92,0);
  ctx.quadraticCurveTo(s*0.22,s*0.16,-s*0.86,s*0.10);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffffff55';ctx.beginPath();ctx.ellipse(-s*0.35,s*0.03,s*0.20,s*0.04,0,0,Math.PI*2);ctx.fill();
  for(let i=0;i<3;i++){
    ctx.strokeStyle='rgba(170,80,255,0.30)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-s*(0.90+i*0.10),s*(0.03+i*0.04));ctx.lineTo(-s*(1.25+i*0.18),s*(0.00+i*0.09));ctx.stroke();
  }
  ctx.restore();
}
function _drawCrowVehicleBalloon(p,s){
  const wob=Math.sin(frame*0.08)*s*0.03;
  const bg=ctx.createLinearGradient(0,-s*1.45,0,-s*0.25);
  bg.addColorStop(0,'#8ee7ff');bg.addColorStop(0.42,p.act);bg.addColorStop(1,p.accent);
  ctx.fillStyle=bg;ctx.strokeStyle='#1a0a1a';ctx.lineWidth=2.2;
  ctx.beginPath();ctx.ellipse(wob,-s*0.82,s*0.74,s*0.56,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle=p.gold;ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(wob-s*0.46,-s*0.42);ctx.lineTo(-s*0.33,s*0.18);ctx.stroke();
  ctx.beginPath();ctx.moveTo(wob+s*0.46,-s*0.42);ctx.lineTo(s*0.33,s*0.18);ctx.stroke();
  ctx.fillStyle=p.metal;ctx.strokeStyle='#160a16';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(-s*0.48,s*0.06,s*0.96,s*0.44,6);ctx.fill();ctx.stroke();
  ctx.fillStyle=p.gold;ctx.fillRect(-s*0.38,s*0.10,s*0.76,s*0.08);
}
function _drawCrowVehicleAirship(p,s){
  const wingPulse=Math.sin(frame*0.12)*s*0.05;
  ctx.fillStyle=p.accent;ctx.globalAlpha=0.42;
  ctx.beginPath();ctx.ellipse(0,-s*0.88,s*0.82,s*0.32,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle=p.gold;ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(-s*0.42,-s*0.60);ctx.lineTo(-s*0.34,s*0.05);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.42,-s*0.60);ctx.lineTo(s*0.34,s*0.05);ctx.stroke();
  const hg=ctx.createLinearGradient(-s,0,s,0);
  hg.addColorStop(0,p.metal);hg.addColorStop(0.5,p.belly);hg.addColorStop(1,p.accent);
  ctx.fillStyle=hg;ctx.strokeStyle='#120812';ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(-s*0.92,s*0.12);ctx.quadraticCurveTo(-s*0.22,s*0.58,s*0.94,s*0.08);
  ctx.quadraticCurveTo(s*0.28,-s*0.14,-s*0.92,s*0.12);ctx.fill();ctx.stroke();
  ctx.fillStyle=p.bone;ctx.beginPath();ctx.moveTo(s*0.58,-s*0.02);ctx.lineTo(s*1.05,-s*0.24-wingPulse);ctx.lineTo(s*0.82,s*0.18);ctx.fill();
  ctx.strokeStyle=p.gold;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(-s*0.65,s*0.16,s*0.12,0,Math.PI*2);ctx.stroke();
}
function _drawCrowVehicleGlider(p,s){
  const flap=Math.sin(frame*0.22)*s*0.08;
  ctx.fillStyle='#0d0710';ctx.strokeStyle=p.accent;ctx.lineWidth=1.8;
  ctx.beginPath();ctx.moveTo(-s*0.20,-s*0.08);ctx.lineTo(-s*1.15,-s*0.62-flap);ctx.lineTo(-s*0.76,s*0.16);ctx.lineTo(-s*0.16,s*0.12);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.20,-s*0.08);ctx.lineTo(s*1.15,-s*0.62-flap);ctx.lineTo(s*0.76,s*0.16);ctx.lineTo(s*0.16,s*0.12);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle=p.bone;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-s*0.18,-s*0.05);ctx.lineTo(-s*0.86,-s*0.45-flap);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.18,-s*0.05);ctx.lineTo(s*0.86,-s*0.45-flap);ctx.stroke();
  ctx.fillStyle=p.metal;ctx.strokeStyle='#120812';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,s*0.22,s*0.48,s*0.30,0,0,Math.PI*2);ctx.fill();ctx.stroke();
}
function _drawCrowVehicleMech(p,s,withCannon){
  ctx.fillStyle=p.metal;ctx.strokeStyle='#120812';ctx.lineWidth=2.2;
  ctx.beginPath();ctx.ellipse(0,s*0.22,s*0.76,s*0.48,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=p.accent;ctx.beginPath();ctx.ellipse(0,s*0.12,s*0.45,s*0.25,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=p.bone;ctx.lineWidth=2.3;ctx.lineCap='round';
  for(const side of [-1,1]){
    ctx.beginPath();ctx.moveTo(side*s*0.42,s*0.28);ctx.lineTo(side*s*0.82,s*0.48);ctx.lineTo(side*s*0.68,s*0.72);ctx.stroke();
    ctx.beginPath();ctx.moveTo(side*s*0.32,s*0.04);ctx.lineTo(side*s*0.78,-s*0.05);ctx.lineTo(side*s*0.92,s*0.13);ctx.stroke();
  }
  ctx.lineCap='butt';
  if(withCannon){
    ctx.fillStyle='#222';ctx.strokeStyle=p.gold;ctx.lineWidth=1.2;
    ctx.beginPath();ctx.roundRect(s*0.30,-s*0.05,s*0.62,s*0.20,5);ctx.fill();ctx.stroke();
    ctx.fillStyle='#090909';ctx.beginPath();ctx.arc(s*0.94,s*0.05,s*0.11,0,Math.PI*2);ctx.fill();
  }
}
function _drawCrowVehicleDrill(p,s){
  ctx.fillStyle='rgba(130,80,35,0.45)';
  ctx.beginPath();ctx.ellipse(0,s*0.48,s*0.86,s*0.20,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=p.metal;ctx.strokeStyle='#120812';ctx.lineWidth=2.1;
  ctx.beginPath();ctx.ellipse(-s*0.12,s*0.08,s*0.55,s*0.38,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=p.bone;ctx.beginPath();ctx.moveTo(s*0.34,-s*0.20);ctx.lineTo(s*0.96,s*0.06);ctx.lineTo(s*0.34,s*0.30);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle=p.gold;ctx.lineWidth=1.2;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(s*(0.42+i*0.12),-s*(0.12-i*0.10));ctx.lineTo(s*(0.64+i*0.12),s*(0.18-i*0.05));ctx.stroke();}
}
function _drawCrowVehicleBook(p,s){
  const open=Math.sin(frame*0.07)*s*0.03;
  ctx.fillStyle=p.bone;ctx.strokeStyle='#180818';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-s*0.82,s*0.22);ctx.quadraticCurveTo(-s*0.35,s*0.02,0,s*0.24+open);ctx.lineTo(0,s*0.60);ctx.quadraticCurveTo(-s*0.45,s*0.44,-s*0.86,s*0.58);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.82,s*0.22);ctx.quadraticCurveTo(s*0.35,s*0.02,0,s*0.24+open);ctx.lineTo(0,s*0.60);ctx.quadraticCurveTo(s*0.45,s*0.44,s*0.86,s*0.58);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle=p.accent;ctx.lineWidth=1;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-s*0.65,s*(0.32+i*0.07));ctx.lineTo(-s*0.16,s*(0.25+i*0.07));ctx.stroke();
    ctx.beginPath();ctx.moveTo(s*0.16,s*(0.25+i*0.07));ctx.lineTo(s*0.65,s*(0.32+i*0.07));ctx.stroke();}
  ctx.fillStyle=p.accent;ctx.globalAlpha=0.22+0.08*Math.sin(frame*0.1);
  ctx.beginPath();ctx.arc(0,s*0.26,s*0.58,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
}
function _drawCrowVehicleThrone(p,s){
  ctx.fillStyle=p.metal;ctx.strokeStyle='#120812';ctx.lineWidth=2.4;
  ctx.beginPath();ctx.roundRect(-s*0.68,-s*0.12,s*1.36,s*0.88,8);ctx.fill();ctx.stroke();
  ctx.fillStyle=p.accent;ctx.fillRect(-s*0.54,-s*0.02,s*1.08,s*0.38);
  ctx.fillStyle=p.gold;
  for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*s*0.24,-s*0.12);ctx.lineTo(i*s*0.24+s*0.10,-s*0.40);ctx.lineTo(i*s*0.24+s*0.20,-s*0.12);ctx.fill();}
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(-s*0.42,s*0.78,s*0.16,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.42,s*0.78,s*0.16,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=p.gold;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(-s*0.42,s*0.78,s*0.10,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(s*0.42,s*0.78,s*0.10,0,Math.PI*2);ctx.stroke();
}
function _drawCrowVehicleCart(p,s){
  ctx.fillStyle=p.metal;ctx.strokeStyle='#120812';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(-s*0.68,s*0.04,s*1.36,s*0.50,7);ctx.fill();ctx.stroke();
  ctx.fillStyle=p.belly;ctx.beginPath();ctx.ellipse(0,s*0.08,s*0.56,s*0.34,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#141018';ctx.beginPath();ctx.arc(-s*0.45,s*0.58,s*0.14,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.45,s*0.58,s*0.14,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=p.gold;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-s*0.74,s*0.10);ctx.lineTo(-s*1.0,-s*0.08);ctx.stroke();
}
function _drawCrowBroodPilot(p,s,tier,v){
  const py=(v==='balloon'||v==='airship')?s*0.02:(v==='book'?-s*0.18:(v==='skate'?-s*0.18:-s*0.25));
  const ps=s*(tier==='heir'?0.62:(tier==='prince'?0.56:0.48));
  ctx.save();ctx.translate(0,py);
  ctx.fillStyle='#050308';ctx.beginPath();ctx.ellipse(0,0,ps*0.58,ps*0.72,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=p.belly;ctx.globalAlpha=0.78;ctx.beginPath();ctx.ellipse(0,ps*0.16,ps*0.38,ps*0.34,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='#08040a';ctx.beginPath();ctx.ellipse(0,-ps*0.46,ps*0.48,ps*0.34,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=p.bone;ctx.beginPath();ctx.moveTo(ps*0.36,-ps*0.46);ctx.lineTo(ps*0.78,-ps*0.36);ctx.lineTo(ps*0.36,-ps*0.26);ctx.closePath();ctx.fill();
  ctx.fillStyle=p.eye;ctx.beginPath();ctx.arc(-ps*0.15,-ps*0.48,ps*0.055,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(ps*0.14,-ps*0.47,ps*0.055,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffffff99';ctx.beginPath();ctx.arc(-ps*0.16,-ps*0.50,ps*0.018,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(ps*0.13,-ps*0.49,ps*0.018,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#090509';
  for(let i=-2;i<=2;i++){
    ctx.beginPath();ctx.moveTo(i*ps*0.10,-ps*0.70);ctx.lineTo(i*ps*0.16,-ps*(0.98+0.08*Math.sin(frame*0.08+i)));ctx.lineTo(i*ps*0.04,-ps*0.72);ctx.fill();
  }
  ctx.strokeStyle='#0b050b';ctx.lineWidth=2;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-ps*0.40,-ps*0.10);ctx.quadraticCurveTo(-ps*0.82,-ps*0.20,-ps*0.70,ps*0.20);ctx.stroke();
  ctx.beginPath();ctx.moveTo(ps*0.40,-ps*0.10);ctx.quadraticCurveTo(ps*0.82,-ps*0.20,ps*0.70,ps*0.20);ctx.stroke();
  if(tier==='prince'||tier==='heir'){
    ctx.fillStyle=p.gold;ctx.strokeStyle='#2a1800';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-ps*0.32,-ps*0.72);ctx.lineTo(-ps*0.18,-ps*0.96);ctx.lineTo(0,-ps*0.76);ctx.lineTo(ps*0.18,-ps*0.96);ctx.lineTo(ps*0.32,-ps*0.72);ctx.closePath();ctx.fill();ctx.stroke();
  }
  if(tier==='heir'){
    ctx.strokeStyle=p.act;ctx.lineWidth=1.4;ctx.globalAlpha=0.85;
    ctx.beginPath();ctx.arc(0,0,ps*0.90,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  }
  ctx.restore();
}
function _drawCrowRoleMark(e,p,s,v){
  ctx.save();
  if(e.arch==='caster'){
    ctx.strokeStyle=p.act;ctx.lineWidth=1.4;ctx.globalAlpha=0.7+0.2*Math.sin(frame*0.11);
    ctx.beginPath();ctx.arc(0,-s*0.58,s*0.22,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=p.act;ctx.beginPath();ctx.arc(0,-s*0.58,s*0.07,0,Math.PI*2);ctx.fill();
  }else if(e.arch==='ranged'){
    ctx.fillStyle='#1a111a';ctx.strokeStyle=p.gold;ctx.lineWidth=1.2;
    ctx.beginPath();ctx.roundRect(s*0.34,-s*0.10,s*0.52,s*0.16,4);ctx.fill();ctx.stroke();
  }else if(e.arch==='assassin'){
    ctx.strokeStyle=p.bone;ctx.lineWidth=1.7;
    ctx.beginPath();ctx.moveTo(s*0.22,-s*0.02);ctx.lineTo(s*0.70,-s*0.34);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-s*0.22,-s*0.02);ctx.lineTo(-s*0.70,-s*0.34);ctx.stroke();
  }else if(e.arch==='tank'){
    ctx.fillStyle='rgba(220,190,120,0.28)';
    ctx.beginPath();ctx.roundRect(-s*0.48,-s*0.04,s*0.96,s*0.44,7);ctx.fill();
  }else if(e.arch==='aoe'){
    const fuse=0.7+0.3*Math.sin(frame*0.35);
    ctx.fillStyle='#ff8c00';ctx.globalAlpha=fuse;
    ctx.beginPath();ctx.arc(s*0.52,-s*0.22,s*0.09,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function _drawWaspEnemyV2(e,x,y,s){
  const wingBeat=Math.sin(frame*0.42+(e.bobPhase||0))*0.10;
  const glow=0.45+0.25*Math.sin(frame*0.11+(e.bobPhase||0));
  ctx.save();
  ctx.translate(x,y);

  // Match the new player sprites: chunky readable token, soft 3D shadow,
  // dark contour, saturated body, and gold highlights.
  ctx.fillStyle='#0008';
  ctx.beginPath();ctx.ellipse(0,s*0.92,s*0.72,s*0.18,0,0,Math.PI*2);ctx.fill();

  // Subtle glow behind the sprite, like Alibaba's magic platform.
  ctx.globalAlpha=0.12+glow*0.12;
  ctx.fillStyle='#ffca3a';
  ctx.beginPath();ctx.ellipse(0,s*0.12,s*1.05,s*0.68,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;

  // Large rounded wings. Broad simple shapes read better than insect anatomy.
  ctx.save();
  ctx.globalAlpha=0.55;
  ctx.fillStyle='#fff1a8';
  ctx.strokeStyle='#6a4a12';
  ctx.lineWidth=1.8;
  ctx.beginPath();ctx.ellipse(-s*0.48,-s*0.28,s*0.42,s*(0.26+wingBeat),-0.58,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.ellipse(s*0.48,-s*0.28,s*0.42,s*(0.26+wingBeat),0.58,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.globalAlpha=0.9;
  ctx.strokeStyle='#fff7cf';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-s*0.22,-s*0.24);ctx.lineTo(-s*0.62,-s*0.48);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.22,-s*0.24);ctx.lineTo(s*0.62,-s*0.48);ctx.stroke();
  ctx.restore();

  // Abdomen: fat jewel-like body with painted stripes and black outline.
  const bodyGrad=ctx.createLinearGradient(0,-s*0.55,0,s*0.6);
  bodyGrad.addColorStop(0,'#ffe76a');
  bodyGrad.addColorStop(0.45,e.color||'#d4a417');
  bodyGrad.addColorStop(1,'#9a6410');
  ctx.strokeStyle='#2a1906';ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(0,s*0.04,s*0.48,s*0.74,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=bodyGrad;
  ctx.beginPath();ctx.ellipse(0,s*0.04,s*0.44,s*0.72,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=e.accent||'#7a5e0d';ctx.lineWidth=2.2;
  for(let i=-2;i<=2;i++){
    ctx.beginPath();
    ctx.moveTo(-s*0.37,i*s*0.17);
    ctx.quadraticCurveTo(0,i*s*0.17+s*0.08,s*0.37,i*s*0.17);
    ctx.stroke();
  }
  ctx.fillStyle='rgba(255,255,255,0.22)';
  ctx.beginPath();ctx.ellipse(-s*0.14,-s*0.25,s*0.12,s*0.30,-0.35,0,Math.PI*2);ctx.fill();

  // Chest + royal head, with gold trim similar to King/Zavs.
  ctx.fillStyle='#2a1906';
  ctx.beginPath();ctx.ellipse(0,-s*0.50,s*0.43,s*0.34,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.accent||'#7a5e0d';
  ctx.beginPath();ctx.ellipse(0,-s*0.50,s*0.38,s*0.30,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#2a1906';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(0,-s*0.74,s*0.35,s*0.29,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=e.color||'#d4a417';
  ctx.beginPath();ctx.ellipse(0,-s*0.74,s*0.32,s*0.26,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.20)';
  ctx.beginPath();ctx.ellipse(-s*0.10,-s*0.84,s*0.08,s*0.05,-0.4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffd84a';ctx.strokeStyle='#5a3308';ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(-s*0.22,-s*0.92);ctx.lineTo(-s*0.10,-s*1.10);ctx.lineTo(0,-s*0.94);ctx.lineTo(s*0.11,-s*1.11);ctx.lineTo(s*0.23,-s*0.92);ctx.closePath();ctx.fill();ctx.stroke();

  // Antennae.
  ctx.strokeStyle=e.accent||'#7a5e0d';ctx.lineWidth=1.4;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-s*0.12,-s*0.88);ctx.quadraticCurveTo(-s*0.34,-s*1.08,-s*0.48,-s*1.02);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.12,-s*0.88);ctx.quadraticCurveTo(s*0.34,-s*1.08,s*0.48,-s*1.02);ctx.stroke();

  // Stubby legs, kept chunky so the silhouette matches the unit sprites.
  ctx.strokeStyle='#3a2406';ctx.lineWidth=2.2;
  for(let side=-1;side<=1;side+=2){
    ctx.beginPath();ctx.moveTo(side*s*0.25,-s*0.10);ctx.lineTo(side*s*0.56,s*0.14);ctx.lineTo(side*s*0.44,s*0.34);ctx.stroke();
    ctx.beginPath();ctx.moveTo(side*s*0.26,s*0.15);ctx.lineTo(side*s*0.56,s*0.38);ctx.lineTo(side*s*0.42,s*0.58);ctx.stroke();
  }
  ctx.fillStyle='#2a1604';
  ctx.beginPath();ctx.moveTo(-s*0.10,s*0.68);ctx.lineTo(0,s*1.04);ctx.lineTo(s*0.10,s*0.68);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffcf3d';
  ctx.beginPath();ctx.moveTo(-s*0.045,s*0.71);ctx.lineTo(0,s*0.91);ctx.lineTo(s*0.045,s*0.71);ctx.closePath();ctx.fill();

  // Eyes.
  ctx.fillStyle='#ff3333';
  ctx.beginPath();ctx.arc(-s*0.10,-s*0.75,2.4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.10,-s*0.75,2.4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff8';
  ctx.beginPath();ctx.arc(-s*0.11,-s*0.77,0.8,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(s*0.09,-s*0.77,0.8,0,Math.PI*2);ctx.fill();

  ctx.restore();
}
function _drawSwarmBody(e,x,y,s){
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s*0.7,s*0.45,s*0.1,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(x+s*0.2,y-s*0.05,s*0.35,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.accent;ctx.beginPath();ctx.ellipse(x-s*0.2,y+s*0.05,s*0.45,s*0.38,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.ellipse(x-s*0.2,y+s*0.05,s*0.38,s*0.3,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=e.accent;ctx.lineWidth=1;
  const lp=Math.sin(frame*0.3)*0.1;
  ctx.beginPath();ctx.moveTo(x-s*0.15,y+s*0.15);ctx.lineTo(x-s*0.55,y+s*(0.45+lp));ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.1,y+s*0.1);ctx.lineTo(x+s*0.45,y+s*(0.45-lp));ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-s*0.3,y+s*0.15);ctx.lineTo(x-s*0.65,y+s*(0.25+lp));ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.25,y+s*0.1);ctx.lineTo(x+s*0.55,y+s*(0.2-lp));ctx.stroke();
  ctx.strokeStyle=e.accent;ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(x+s*0.45,y-s*0.1);ctx.lineTo(x+s*0.65,y-s*0.25);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.45,y+s*0.05);ctx.lineTo(x+s*0.65,y+s*0.12);ctx.stroke();
  ctx.fillStyle='#ff4444';
  ctx.beginPath();ctx.arc(x+s*0.3,y-s*0.15,1.2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.3,y+s*0.05,1.2,0,Math.PI*2);ctx.fill();
}
function _drawTankBody(e,x,y,s){
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.7,s*0.18,0,0,Math.PI*2);ctx.fill();
  const hw=s*0.7,hh=s*0.65;
  ctx.fillStyle=e.color;
  ctx.beginPath();ctx.moveTo(x-hw,y-hh);ctx.lineTo(x+hw,y-hh);ctx.lineTo(x+hw,y+hh);ctx.lineTo(x-hw,y+hh);ctx.closePath();ctx.fill();
  ctx.strokeStyle=e.accent;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x-hw+3,y-hh*0.3);ctx.lineTo(x+hw-3,y-hh*0.3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-hw+3,y+hh*0.3);ctx.lineTo(x+hw-3,y+hh*0.3);ctx.stroke();
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x-hw,y-hh*0.6);ctx.lineTo(x-hw-s*0.18,y-hh*0.9);ctx.lineTo(x-hw,y-hh);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+hw,y-hh*0.6);ctx.lineTo(x+hw+s*0.18,y-hh*0.9);ctx.lineTo(x+hw,y-hh);ctx.fill();
  ctx.fillStyle=e.accent;ctx.globalAlpha=0.7;
  ctx.fillRect(x+hw-2,y-hh*0.35,5,hh*0.7);ctx.globalAlpha=1;
  ctx.fillStyle=e.accent;
  ctx.fillRect(x-s*0.3,y+hh,s*0.12,s*0.25);ctx.fillRect(x+s*0.18,y+hh,s*0.12,s*0.25);
  ctx.fillStyle='#ff4444';
  ctx.fillRect(x-s*0.25,y-s*0.18,s*0.12,2.5);ctx.fillRect(x+s*0.13,y-s*0.18,s*0.12,2.5);
}
function _drawDpsBody(e,x,y,s){
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.55,s*0.14,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;
  ctx.beginPath();ctx.moveTo(x,y-s*0.8);ctx.lineTo(x+s*0.65,y);ctx.lineTo(x,y+s*0.7);ctx.lineTo(x-s*0.65,y);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x,y-s*0.45);ctx.lineTo(x+s*0.35,y);ctx.lineTo(x,y+s*0.35);ctx.lineTo(x-s*0.35,y);ctx.closePath();ctx.fill();
  ctx.strokeStyle=e.color;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x+s*0.45,y-s*0.25);ctx.quadraticCurveTo(x+s*0.85,y-s*0.4,x+s*0.65,y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.45,y+s*0.25);ctx.quadraticCurveTo(x+s*0.85,y+s*0.4,x+s*0.65,y);ctx.stroke();
  ctx.strokeStyle=e.accent;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x-s*0.45,y-s*0.15);ctx.lineTo(x-s*0.8,y-s*0.45);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-s*0.45,y+s*0.15);ctx.lineTo(x-s*0.8,y+s*0.45);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.25,y+s*0.4);ctx.lineTo(x+s*0.5,y+s*0.65);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-s*0.25,y+s*0.4);ctx.lineTo(x-s*0.5,y+s*0.65);ctx.stroke();
  ctx.fillStyle='#ff4444';
  ctx.beginPath();ctx.arc(x+s*0.12,y-s*0.2,1.8,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x-s*0.12,y-s*0.2,1.8,0,Math.PI*2);ctx.fill();
}
function _drawRangedBody(e,x,y,s){
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.45,s*0.12,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.ellipse(x,y,s*0.35,s*0.85,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.fillStyle=e.accent;ctx.globalAlpha=0.8;
  const wf=Math.sin(frame*0.2)*0.08;
  ctx.beginPath();ctx.moveTo(x-s*0.25,y-s*0.15);ctx.lineTo(x-s*(0.85+wf),y-s*0.65);ctx.lineTo(x-s*0.65,y-s*0.05);ctx.lineTo(x-s*0.25,y+s*0.1);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.25,y-s*0.15);ctx.lineTo(x+s*(0.85+wf),y-s*0.65);ctx.lineTo(x+s*0.65,y-s*0.05);ctx.lineTo(x+s*0.25,y+s*0.1);ctx.closePath();ctx.fill();
  ctx.restore();
  ctx.strokeStyle=e.accent;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x,y+s*0.65);ctx.lineTo(x,y+s*1.05);ctx.stroke();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(x,y+s*1.05,2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(x,y-s*0.65,s*0.22,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff4444';
  ctx.beginPath();ctx.arc(x-s*0.08,y-s*0.7,1.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.08,y-s*0.7,1.5,0,Math.PI*2);ctx.fill();
}
function _drawCasterBody(e,x,y,s){
  ctx.save();ctx.strokeStyle=e.accent;ctx.lineWidth=1;ctx.globalAlpha=0.35+0.15*Math.sin(frame*0.08);
  ctx.beginPath();ctx.ellipse(x,y+s*0.45,s*0.55,s*0.16,frame*0.015,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<4;i++){const a=frame*0.015+i*Math.PI/2;ctx.fillStyle=e.accent;ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(x+Math.cos(a)*s*0.55,y+s*0.45+Math.sin(a)*s*0.16,1.5,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  ctx.fillStyle=e.color;
  ctx.beginPath();ctx.moveTo(x-s*0.2,y-s*0.55);ctx.lineTo(x+s*0.2,y-s*0.55);ctx.lineTo(x+s*0.45,y+s*0.55);ctx.lineTo(x-s*0.45,y+s*0.55);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x-s*0.22,y-s*0.4);ctx.quadraticCurveTo(x,y-s*0.9,x+s*0.22,y-s*0.4);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#8a6a3a';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x-s*0.35,y+s*0.45);ctx.lineTo(x-s*0.25,y-s*0.75);ctx.stroke();
  ctx.fillStyle=e.accent;ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(x-s*0.25,y-s*0.8,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(x-s*0.25,y-s*0.8,1.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='#ff4444';
  ctx.beginPath();ctx.arc(x-s*0.08,y-s*0.48,1.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.08,y-s*0.48,1.5,0,Math.PI*2);ctx.fill();
}
function _drawAssassinBody(e,x,y,s){
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s*0.55,s*0.35,s*0.09,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.strokeStyle=e.accent;ctx.lineWidth=1;ctx.globalAlpha=0.25;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-s*0.7-i*3,y-s*0.25+i*s*0.15);ctx.lineTo(x-s*0.35-i*2,y-s*0.15+i*s*0.1);ctx.stroke();}
  ctx.restore();
  ctx.fillStyle=e.color;
  ctx.beginPath();ctx.moveTo(x-s*0.25,y-s*0.45);ctx.lineTo(x+s*0.35,y-s*0.25);ctx.lineTo(x+s*0.25,y+s*0.35);ctx.lineTo(x-s*0.35,y+s*0.25);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x-s*0.05,y-s*0.35);ctx.lineTo(x+s*0.25,y-s*0.65);ctx.lineTo(x+s*0.3,y-s*0.2);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#cccccc';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x+s*0.25,y-s*0.05);ctx.lineTo(x+s*0.6,y-s*0.3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.25,y+s*0.1);ctx.lineTo(x+s*0.55,y+s*0.28);ctx.stroke();
  ctx.fillStyle='#ff4444';
  ctx.fillRect(x+s*0.05,y-s*0.3,s*0.15,1.8);ctx.fillRect(x+s*0.05,y-s*0.17,s*0.15,1.8);
}
function _drawAoeBody(e,x,y,s){
  ctx.save();ctx.strokeStyle='#ff6600';ctx.lineWidth=1.5;ctx.globalAlpha=0.25+0.15*Math.sin(frame*0.12);
  ctx.beginPath();ctx.arc(x,y+s*0.15,s*0.75,0,Math.PI*2);ctx.stroke();ctx.restore();
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s+1,s*0.55,s*0.14,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(x,y,s*0.75,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=e.accent;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x-s*0.15,y-s*0.25);ctx.lineTo(x+s*0.1,y+s*0.1);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.25,y-s*0.1);ctx.lineTo(x,y+s*0.25);ctx.stroke();
  ctx.strokeStyle=e.accent;ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(x,y,s*0.75,s*0.12,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#8a6a3a';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x,y-s*0.65);ctx.quadraticCurveTo(x+s*0.12,y-s*0.85,x+s*0.08,y-s*0.95);ctx.stroke();
  if(frame%3<2){
    ctx.fillStyle='#ffaa00';ctx.beginPath();ctx.arc(x+s*0.08,y-s*0.95,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff4400';ctx.beginPath();ctx.arc(x+s*0.08,y-s*0.95,1.2,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle=e.accent;
  ctx.fillRect(x-s*0.25,y+s*0.55,s*0.1,s*0.22);ctx.fillRect(x+s*0.15,y+s*0.55,s*0.1,s*0.22);
  ctx.fillStyle='#ff4444';
  ctx.beginPath();ctx.arc(x-s*0.18,y-s*0.12,1.8,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.18,y-s*0.12,1.8,0,Math.PI*2);ctx.fill();
}

  const wrap = fn => (...args) => {
    sync();
    return fn(...args);
  };

  return {
    drawClassicEnemyBody: wrap(_drawClassicEnemyBody),
    drawGerbanBroodVehicle: wrap(_drawGerbanBroodVehicle),
    drawDpsBody: wrap(_drawDpsBody),
  };
}

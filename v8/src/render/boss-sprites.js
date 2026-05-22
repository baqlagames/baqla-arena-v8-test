export function createBossSpriteRenderer(deps = {}) {
  const ctx = deps.ctx;
  let frame = 0;
  const rnd = typeof deps.randomRange === 'function' ? deps.randomRange : ((min, max) => min + Math.random() * (max - min));
  const addP = typeof deps.emitParticle === 'function' ? deps.emitParticle : (() => {});
  const drawFallbackEnemyBody = typeof deps.drawFallbackEnemyBody === 'function' ? deps.drawFallbackEnemyBody : (() => {});

  function sync() {
    const v = typeof deps.view === 'function' ? deps.view() : {};
    frame = v.frame || 0;
  }

  function _drawDpsBody(e, x, y, s) {
    return drawFallbackEnemyBody(e, x, y, s);
  }
// ===== BOSS-SPECIFIC RENDERERS =====
function _drawBossBody(e,x,y,s){
  ctx.save();ctx.strokeStyle='#ff2222';ctx.lineWidth=2;ctx.globalAlpha=0.4+0.2*Math.sin(frame*0.08);
  ctx.beginPath();ctx.arc(x,y,s+6,0,Math.PI*2);ctx.stroke();ctx.restore();
  switch(e.id){
    case 0:_drawBoss_BroodMother(e,x,y,s);break;
    case 1:_drawBoss_Hornet(e,x,y,s);break;
    case 2:_drawBoss_SpiceLord(e,x,y,s);break;
    case 3:_drawBoss_VeiledAssassin(e,x,y,s);break;
    case 4:_drawBoss_Sultan(e,x,y,s);break;
    case 5:_drawBoss_DuneWorm(e,x,y,s);break;
    case 6:_drawBoss_Pharaoh(e,x,y,s);break;
    case 7:_drawBoss_IceWraith(e,x,y,s);break;
    case 8:_drawBoss_FrostTitan(e,x,y,s);break;
    case 9:_drawBoss_CrowGerban(e,x,y,s);break;
    case 10:_drawBoss_AstralLanternWarden(e,x,y,s);break;
    case 11:_drawBoss_BazaarGate(e,x,y,s);break;
    case 12:_drawBoss_StormRoc(e,x,y,s);break;
    case 13:_drawBoss_StormboundVizier(e,x,y,s);break;
    case 14:_drawBoss_SphinxJudicator(e,x,y,s);break;
    default:_drawDpsBody(e,x,y,s);break;
  }
}
function _drawBoss_SphinxJudicator(e,x,y,s){
  const p={gold:e.color||'#d8a84a',deep:e.accent||'#6f4a18',stone:'#8a7150',eye:'#ffe680',shadow:'rgba(0,0,0,0.55)'};
  const pulse=0.85+0.15*Math.sin(frame*0.07);
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle=p.shadow;ctx.beginPath();ctx.ellipse(0,s*0.82,s*0.95,s*0.24,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=p.stone;ctx.strokeStyle='#3a2710';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-s*0.78,s*0.28);ctx.lineTo(-s*0.35,-s*0.36);ctx.lineTo(s*0.35,-s*0.36);ctx.lineTo(s*0.78,s*0.28);ctx.quadraticCurveTo(0,s*0.62,-s*0.78,s*0.28);ctx.fill();ctx.stroke();
  ctx.fillStyle=p.gold;ctx.beginPath();ctx.arc(0,-s*0.25,s*0.48,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=p.deep;ctx.beginPath();ctx.moveTo(-s*0.62,-s*0.36);ctx.lineTo(-s*0.96,-s*0.92);ctx.lineTo(-s*0.22,-s*0.58);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.62,-s*0.36);ctx.lineTo(s*0.96,-s*0.92);ctx.lineTo(s*0.22,-s*0.58);ctx.fill();ctx.stroke();
  ctx.fillStyle=p.eye;ctx.beginPath();ctx.arc(-s*0.16,-s*0.30,s*0.055*pulse,0,Math.PI*2);ctx.arc(s*0.16,-s*0.30,s*0.055*pulse,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=p.eye;ctx.lineWidth=2;ctx.globalAlpha=0.45;ctx.beginPath();ctx.arc(0,-s*0.25,s*0.68,Math.PI*0.12,Math.PI*0.88);ctx.stroke();
  ctx.restore();
}function _drawBoss_BroodMotherV2(e,x,y,s){
  const p={shell:'#dfe6b5',pod:e.color||'#4a7a2f',vine:e.accent||'#7bbf4b',dark:'#070807',gold:'#e7c65a',eye:'#ff493f'};
  const pulse=0.78+0.22*Math.sin(frame*0.08);
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.beginPath();ctx.ellipse(0,s*0.88,s*0.95,s*0.24,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.18*pulse;ctx.fillStyle=p.vine;ctx.beginPath();ctx.ellipse(-s*0.10,s*0.12,s*1.02,s*0.74,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle=p.vine;ctx.lineWidth=2.4;ctx.lineCap='round';
  for(let i=-2;i<=2;i++){
    const side=i<0?-1:1;
    ctx.beginPath();ctx.moveTo(side*s*0.24,s*0.28+Math.abs(i)*s*0.06);ctx.quadraticCurveTo(side*s*(0.70+Math.abs(i)*0.08),s*(0.46+Math.sin(frame*0.05+i)*0.05),side*s*(0.92+Math.abs(i)*0.08),s*0.72);ctx.stroke();
  }
  const pod=ctx.createLinearGradient(0,-s*0.55,0,s*0.72);
  pod.addColorStop(0,'#86b957');pod.addColorStop(0.5,p.pod);pod.addColorStop(1,'#1f3118');
  ctx.fillStyle=pod;ctx.strokeStyle='#10140b';ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(-s*0.16,s*0.08,s*0.70,s*0.76,-0.10,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=p.shell;ctx.strokeStyle='#5d6740';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(-s*0.34,-s*0.03,s*0.43,s*0.55,-0.35,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#78845a';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(-s*0.60,-s*0.28);ctx.lineTo(-s*0.36,-s*0.10);ctx.lineTo(-s*0.56,s*0.10);ctx.lineTo(-s*0.24,s*0.28);ctx.stroke();
  ctx.fillStyle=p.dark;ctx.beginPath();ctx.ellipse(s*0.30,-s*0.18,s*0.34,s*0.31,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=p.shell;ctx.beginPath();ctx.moveTo(s*0.54,-s*0.19);ctx.lineTo(s*0.90,-s*0.08);ctx.lineTo(s*0.54,s*0.02);ctx.closePath();ctx.fill();
  ctx.fillStyle=p.eye;ctx.beginPath();ctx.arc(s*0.18,-s*0.24,s*0.045,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(s*0.38,-s*0.24,s*0.045,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=p.gold;ctx.strokeStyle='#3a2600';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(s*0.02,-s*0.48);ctx.lineTo(s*0.16,-s*0.72);ctx.lineTo(s*0.30,-s*0.48);ctx.lineTo(s*0.46,-s*0.72);ctx.lineTo(s*0.58,-s*0.48);ctx.closePath();ctx.fill();ctx.stroke();
  for(let i=0;i<4;i++){
    const ex=-s*0.72+i*s*0.28,ey=s*(0.56+0.03*Math.sin(frame*0.07+i));
    ctx.fillStyle=i%2?p.shell:'#b8d48b';ctx.strokeStyle='#42512d';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.ellipse(ex,ey,s*0.13,s*0.18,-0.2,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle=p.vine;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ex-s*0.06,ey-s*0.02);ctx.lineTo(ex+s*0.04,ey+s*0.04);ctx.stroke();
  }
  if(frame%5===0)addP(x+rnd(-s*0.55,s*0.55),y+rnd(-s*0.55,s*0.45),'#aaff88',1,3);
  ctx.restore();
}
function _drawBoss_HornetV2(e,x,y,s){
  const wing=Math.sin(frame*0.38)*s*0.12;
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,0.45)';ctx.beginPath();ctx.ellipse(0,s*0.98,s*0.82,s*0.20,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.34;ctx.fillStyle='#fff4b6';ctx.strokeStyle='#714b10';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(-s*0.58,-s*0.28,s*0.50,s*0.34+wing*0.25,-0.58,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.ellipse(s*0.58,-s*0.28,s*0.50,s*0.34+wing*0.25,0.58,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.globalAlpha=0.18;ctx.beginPath();ctx.ellipse(-s*0.42,-s*0.02,s*0.44,s*0.28,-0.42,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(s*0.42,-s*0.02,s*0.44,s*0.28,0.42,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  const body=ctx.createLinearGradient(0,-s*0.72,0,s*0.78);
  body.addColorStop(0,'#ffe36b');body.addColorStop(0.5,e.color||'#d4a417');body.addColorStop(1,'#6b3b06');
  ctx.fillStyle=body;ctx.strokeStyle='#2a1906';ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(0,s*0.10,s*0.48,s*0.78,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle=e.accent||'#7a5e0d';ctx.lineWidth=2.4;
  for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(-s*0.40,i*s*0.16);ctx.quadraticCurveTo(0,i*s*0.16+s*0.08,s*0.40,i*s*0.16);ctx.stroke();}
  ctx.fillStyle='#221304';ctx.beginPath();ctx.ellipse(0,-s*0.63,s*0.38,s*0.30,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color||'#d4a417';ctx.beginPath();ctx.ellipse(0,-s*0.73,s*0.30,s*0.25,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#332000';ctx.beginPath();ctx.moveTo(-s*0.07,s*0.78);ctx.lineTo(0,s*1.18);ctx.lineTo(s*0.07,s*0.78);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffd84a';ctx.strokeStyle='#5a3308';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(-s*0.24,-s*0.90);ctx.lineTo(-s*0.11,-s*1.12);ctx.lineTo(0,-s*0.92);ctx.lineTo(s*0.12,-s*1.14);ctx.lineTo(s*0.25,-s*0.90);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#5a3308';ctx.lineWidth=1.5;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-s*0.13,-s*0.84);ctx.quadraticCurveTo(-s*0.34,-s*1.06,-s*0.50,-s*0.98);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.13,-s*0.84);ctx.quadraticCurveTo(s*0.34,-s*1.06,s*0.50,-s*0.98);ctx.stroke();
  ctx.fillStyle='#ff3333';ctx.beginPath();ctx.arc(-s*0.10,-s*0.73,2.8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(s*0.10,-s*0.73,2.8,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,216,74,0.50)';ctx.lineWidth=1.4;ctx.setLineDash([5,5]);ctx.beginPath();ctx.ellipse(0,-s*0.02,s*0.78,s*0.44,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  if(frame%4===0)addP(x+rnd(-s*0.6,s*0.6),y+rnd(-s*0.7,s*0.2),'#ffdc5c',1,2);
  ctx.restore();
}
function _drawBoss_SultanV2(e,x,y,s){
  const pulse=0.65+0.35*Math.sin(frame*0.10);
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,0.58)';ctx.beginPath();ctx.ellipse(0,s*0.96,s*0.92,s*0.22,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.18*pulse;ctx.fillStyle='#ff6a22';ctx.beginPath();ctx.ellipse(0,-s*0.04,s*1.05,s*0.82,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  const throne=ctx.createLinearGradient(0,-s*0.55,0,s*0.78);
  throne.addColorStop(0,'#b55a22');throne.addColorStop(0.45,e.color||'#8b2f1f');throne.addColorStop(1,'#2a0e08');
  ctx.fillStyle=throne;ctx.strokeStyle='#1b0905';ctx.lineWidth=3;
  ctx.beginPath();ctx.roundRect(-s*0.68,-s*0.30,s*1.36,s*1.04,10);ctx.fill();ctx.stroke();
  ctx.fillStyle=e.accent||'#ff6b35';ctx.beginPath();ctx.roundRect(-s*0.50,-s*0.16,s*1.00,s*0.48,8);ctx.fill();
  ctx.fillStyle='#ffd25a';ctx.strokeStyle='#402400';ctx.lineWidth=1.2;
  for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*s*0.25,-s*0.30);ctx.lineTo(i*s*0.25+s*0.11,-s*0.62);ctx.lineTo(i*s*0.25+s*0.22,-s*0.30);ctx.closePath();ctx.fill();ctx.stroke();}
  ctx.fillStyle='#12080a';ctx.beginPath();ctx.arc(-s*0.43,s*0.76,s*0.17,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(s*0.43,s*0.76,s*0.17,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ffd25a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(-s*0.43,s*0.76,s*0.10,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(s*0.43,s*0.76,s*0.10,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#1a0807';ctx.strokeStyle='#ffd25a';ctx.lineWidth=1.3;
  ctx.beginPath();ctx.roundRect(s*0.35,-s*0.08,s*0.58,s*0.20,5);ctx.fill();ctx.stroke();
  ctx.fillStyle='#050303';ctx.beginPath();ctx.arc(s*0.94,s*0.02,s*0.12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#050407';ctx.beginPath();ctx.ellipse(0,-s*0.42,s*0.36,s*0.32,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f4e2b2';ctx.beginPath();ctx.moveTo(s*0.28,-s*0.43);ctx.lineTo(s*0.62,-s*0.32);ctx.lineTo(s*0.28,-s*0.20);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffdd78';ctx.strokeStyle='#4a2600';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.arc(0,-s*0.64,s*0.22,Math.PI,0);ctx.lineTo(s*0.18,-s*0.48);ctx.lineTo(-s*0.18,-s*0.48);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffbb38';ctx.beginPath();ctx.moveTo(0,-s*0.92);ctx.lineTo(-s*0.07,-s*0.70);ctx.lineTo(s*0.07,-s*0.70);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ff3f2d';ctx.beginPath();ctx.arc(-s*0.11,-s*0.42,2.8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(s*0.10,-s*0.42,2.8,0,Math.PI*2);ctx.fill();
  for(let i=0;i<5;i++){
    const a=frame*0.045+i*Math.PI*2/5,fx=Math.cos(a)*s*0.42,fy=-s*0.08+Math.sin(a)*s*0.20;
    ctx.fillStyle=i%2?'#ff7a1d':'#ffd25a';ctx.globalAlpha=0.55;
    ctx.beginPath();ctx.moveTo(fx,fy-s*0.14);ctx.lineTo(fx-s*0.06,fy+s*0.08);ctx.lineTo(fx+s*0.06,fy+s*0.08);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  }
  if(frame%3===0)addP(x+rnd(-s*0.5,s*0.5),y+rnd(-s*0.55,s*0.2),'#ff6a22',1,3);
  ctx.restore();
}
function _drawBoss_AstralLanternWardenV2(e,x,y,s){
  const pulse=0.72+0.28*Math.sin(frame*0.08);
  const spin=frame*0.035;
  const blue=e.color||'#3f6fff',gold=e.accent||'#ffd166';
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,0.52)';ctx.beginPath();ctx.ellipse(0,s*0.88,s*0.88,s*0.22,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=0.24*pulse;ctx.fillStyle=blue;ctx.beginPath();ctx.ellipse(0,-s*0.18,s*1.15,s*0.98,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle='rgba(139,223,255,0.62)';ctx.lineWidth=2;ctx.setLineDash([8,5]);ctx.lineDashOffset=-frame*0.5;
  ctx.beginPath();ctx.arc(0,-s*0.28,s*0.92,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#10204f';ctx.strokeStyle='#061433';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-s*0.46,-s*0.46);ctx.quadraticCurveTo(0,-s*0.92,s*0.46,-s*0.46);ctx.lineTo(s*0.36,s*0.60);ctx.quadraticCurveTo(0,s*0.82,-s*0.36,s*0.60);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=blue;ctx.globalAlpha=0.76;ctx.beginPath();ctx.ellipse(0,-s*0.10,s*0.38,s*0.66,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle=gold;ctx.beginPath();ctx.arc(0,-s*0.50,s*0.19*pulse,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f8fbff';ctx.beginPath();ctx.arc(0,-s*0.50,s*0.075,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=gold;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-s*0.38,-s*0.72);ctx.lineTo(-s*0.20,-s*1.08);ctx.lineTo(0,-s*0.78);ctx.lineTo(s*0.20,-s*1.08);ctx.lineTo(s*0.38,-s*0.72);ctx.stroke();
  ctx.strokeStyle='rgba(216,244,255,0.85)';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(0,-s*1.12);ctx.lineTo(0,-s*0.80);ctx.stroke();
  ctx.strokeStyle='#d8f4ff';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(s*0.48,-s*0.32);ctx.lineTo(s*0.70,s*0.62);ctx.stroke();
  ctx.fillStyle=gold;ctx.beginPath();ctx.roundRect(s*0.59,s*0.05,s*0.20,s*0.30,4);ctx.fill();
  ctx.fillStyle='rgba(255,209,102,'+(0.30+0.25*pulse)+')';ctx.beginPath();ctx.arc(s*0.69,s*0.22,s*0.23,0,Math.PI*2);ctx.fill();
  const moteCount=e._astralOrbit?4:3;
  for(let i=0;i<moteCount;i++){
    const a=spin+i*Math.PI*2/moteCount;
    const rr=s*(0.74+(i%2)*0.10);
    const mx=Math.cos(a)*rr,my=-s*0.16+Math.sin(a)*rr*0.42;
    ctx.fillStyle=i%2?gold:'#8bdfff';
    ctx.globalAlpha=0.75+0.25*Math.sin(frame*0.12+i);
    ctx.beginPath();ctx.arc(mx,my,s*(e._astralOrbit?0.075:0.055),0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  if(frame%4===0)addP(x+rnd(-s*0.55,s*0.55),y+rnd(-s*0.88,s*0.20),rnd(0,1)<0.5?'#8bdfff':'#ffd166',1,3);
  ctx.restore();
}
function _drawBoss_StormboundVizier(e,x,y,s){
  const pulse=0.72+0.28*Math.sin(frame*0.10);
  const spin=frame*0.045;
  const blue=e.color||'#3f8cff',gold=e.accent||'#ffd166',deep='#071b48';
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,0.48)';ctx.beginPath();ctx.ellipse(0,s*0.88,s*0.86,s*0.22,0,0,Math.PI*2);ctx.fill();

  ctx.globalAlpha=0.18+0.08*pulse;
  ctx.fillStyle=blue;ctx.beginPath();ctx.ellipse(0,-s*0.10,s*1.00,s*0.88,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;

  ctx.strokeStyle='rgba(139,223,255,0.64)';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.lineDashOffset=-frame*0.55;
  ctx.beginPath();ctx.ellipse(0,-s*0.10,s*0.92,s*0.50,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);

  const body=ctx.createLinearGradient(0,-s*0.78,0,s*0.66);
  body.addColorStop(0,'#8bdfff');body.addColorStop(0.35,blue);body.addColorStop(1,deep);
  ctx.fillStyle=body;ctx.strokeStyle='#061433';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(-s*0.42,-s*0.38);ctx.quadraticCurveTo(0,-s*0.84,s*0.42,-s*0.38);ctx.lineTo(s*0.34,s*0.36);ctx.quadraticCurveTo(s*0.12,s*0.76,0,s*0.88);ctx.quadraticCurveTo(-s*0.12,s*0.76,-s*0.34,s*0.36);ctx.closePath();ctx.fill();ctx.stroke();

  ctx.fillStyle='rgba(216,244,255,0.72)';
  ctx.beginPath();ctx.ellipse(0,-s*0.14,s*0.28,s*0.46,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=deep;ctx.beginPath();ctx.ellipse(0,-s*0.48,s*0.28,s*0.24,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=gold;ctx.strokeStyle='#3a2600';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(-s*0.42,-s*0.62);ctx.quadraticCurveTo(0,-s*0.98,s*0.42,-s*0.62);ctx.lineTo(s*0.30,-s*0.42);ctx.quadraticCurveTo(0,-s*0.56,-s*0.30,-s*0.42);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff8c8';ctx.beginPath();ctx.arc(0,-s*0.66,s*0.08*pulse,0,Math.PI*2);ctx.fill();

  ctx.strokeStyle=gold;ctx.lineWidth=2.2;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-s*0.35,-s*0.22);ctx.quadraticCurveTo(-s*0.76,-s*0.06,-s*0.64,s*0.34);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.35,-s*0.22);ctx.quadraticCurveTo(s*0.76,-s*0.06,s*0.64,s*0.34);ctx.stroke();
  ctx.strokeStyle='#8bdfff';ctx.lineWidth=1.8;
  ctx.beginPath();ctx.moveTo(-s*0.64,s*0.34);ctx.lineTo(-s*0.76,s*0.20);ctx.lineTo(-s*0.58,s*0.12);ctx.stroke();
  ctx.beginPath();ctx.moveTo(s*0.64,s*0.34);ctx.lineTo(s*0.76,s*0.20);ctx.lineTo(s*0.58,s*0.12);ctx.stroke();

  for(let i=0;i<4;i++){
    const a=spin+i*Math.PI*0.5;
    const rr=s*(0.62+(i%2)*0.08);
    const mx=Math.cos(a)*rr,my=-s*0.12+Math.sin(a)*rr*0.38;
    ctx.globalAlpha=0.72+0.22*Math.sin(frame*0.12+i);
    ctx.fillStyle=i%2?gold:'#8bdfff';
    ctx.beginPath();ctx.roundRect(mx-s*0.055,my-s*0.055,s*0.11,s*0.11,2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.65)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(mx,my,s*0.11,0,Math.PI*2);ctx.stroke();
  }
  ctx.globalAlpha=1;

  ctx.strokeStyle='rgba(139,223,255,'+(0.50+0.25*pulse)+')';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-s*0.20,s*0.70);ctx.quadraticCurveTo(-s*0.06,s*1.00,0,s*1.08);ctx.quadraticCurveTo(s*0.06,s*1.00,s*0.20,s*0.70);ctx.stroke();
  if(frame%4===0)addP(x+rnd(-s*0.55,s*0.55),y+rnd(-s*0.72,s*0.35),rnd(0,1)<0.55?'#8bdfff':'#ffd166',1,3);
  ctx.restore();
}
function _drawBoss_BroodMother(e,x,y,s){
  return _drawBoss_BroodMotherV2(e,x,y,s);
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.8,s*0.2,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(x+s*0.3,y-s*0.1,s*0.45,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.accent;ctx.beginPath();ctx.ellipse(x-s*0.15,y+s*0.1,s*0.6,s*0.5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.ellipse(x-s*0.15,y+s*0.1,s*0.5,s*0.4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.accent;ctx.globalAlpha=0.6+0.2*Math.sin(frame*0.06);
  ctx.beginPath();ctx.ellipse(x-s*0.6,y+s*0.25,s*0.35,s*0.28,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  for(let i=0;i<4;i++){const a=frame*0.03+i*Math.PI/2;ctx.fillStyle='#aaff88';ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(x-s*0.6+Math.cos(a)*s*0.2,y+s*0.25+Math.sin(a)*s*0.15,2,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
  ctx.strokeStyle=e.accent;ctx.lineWidth=2;
  for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(x-s*0.1,y+s*0.35+i*s*0.15);ctx.lineTo(x-s*0.5,y+s*0.55+i*s*0.12);ctx.stroke();ctx.beginPath();ctx.moveTo(x+s*0.5,y+s*0.2+i*s*0.15);ctx.lineTo(x+s*0.8,y+s*0.4+i*s*0.1);ctx.stroke();}
  ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(x+s*0.4,y-s*0.25,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+s*0.2,y-s*0.25,2.5,0,Math.PI*2);ctx.fill();
}
function _drawBoss_Hornet(e,x,y,s){
  return _drawBoss_HornetV2(e,x,y,s);
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.7,s*0.18,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.ellipse(x,y,s*0.5,s*0.7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x,y-s*0.55);ctx.lineTo(x-s*0.15,y-s*0.85);ctx.lineTo(x+s*0.15,y-s*0.85);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(x,y-s*0.88,s*0.12,0,Math.PI*2);ctx.fill();
  const wt=Math.sin(frame*0.4)*0.15;
  ctx.save();ctx.fillStyle=e.accent;ctx.globalAlpha=0.5;
  ctx.beginPath();ctx.moveTo(x-s*0.3,y-s*0.3);ctx.lineTo(x-s*(0.9+wt),y-s*0.8);ctx.lineTo(x-s*0.7,y-s*0.15);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.3,y-s*0.3);ctx.lineTo(x+s*(0.9+wt),y-s*0.8);ctx.lineTo(x+s*0.7,y-s*0.15);ctx.closePath();ctx.fill();
  ctx.globalAlpha=0.35;
  ctx.beginPath();ctx.moveTo(x-s*0.25,y-s*0.1);ctx.lineTo(x-s*(0.75+wt),y-s*0.55);ctx.lineTo(x-s*0.6,y);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.25,y-s*0.1);ctx.lineTo(x+s*(0.75+wt),y-s*0.55);ctx.lineTo(x+s*0.6,y);ctx.closePath();ctx.fill();
  ctx.restore();
  ctx.strokeStyle=e.accent;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x,y+s*0.5);ctx.lineTo(x,y+s*1.0);ctx.stroke();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.moveTo(x-s*0.06,y+s*0.9);ctx.lineTo(x,y+s*1.15);ctx.lineTo(x+s*0.06,y+s*0.9);ctx.fill();
  ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(x-s*0.15,y-s*0.2,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+s*0.15,y-s*0.2,2.5,0,Math.PI*2);ctx.fill();
}
function _drawBoss_SpiceLord(e,x,y,s){
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+s*0.7,s*0.5,s*0.15,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;
  ctx.beginPath();ctx.moveTo(x-s*0.25,y-s*0.55);ctx.lineTo(x+s*0.25,y-s*0.55);ctx.lineTo(x+s*0.5,y+s*0.6);ctx.lineTo(x-s*0.5,y+s*0.6);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x-s*0.28,y-s*0.4);ctx.quadraticCurveTo(x,y-s*1.0,x+s*0.28,y-s*0.4);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#6a3a2a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x+s*0.45,y+s*0.5);ctx.lineTo(x+s*0.35,y-s*0.8);ctx.stroke();
  ctx.fillStyle='#aa66cc';ctx.beginPath();ctx.arc(x+s*0.35,y-s*0.85,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(x+s*0.35,y-s*0.85,2,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  if(frame%4===0)addP(x+rnd(-s*0.3,s*0.3),y+rnd(-s*0.2,s*0.3),'#aa66cc',1,2);
  ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(x-s*0.1,y-s*0.5,2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+s*0.1,y-s*0.5,2,0,Math.PI*2);ctx.fill();
}
function _drawBoss_VeiledAssassin(e,x,y,s){
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+s*0.6,s*0.4,s*0.12,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;
  ctx.beginPath();ctx.moveTo(x-s*0.3,y-s*0.3);ctx.lineTo(x+s*0.35,y-s*0.15);ctx.lineTo(x+s*0.3,y+s*0.45);ctx.lineTo(x-s*0.4,y+s*0.35);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x-s*0.15,y-s*0.2);ctx.lineTo(x+s*0.3,y-s*0.7);ctx.lineTo(x+s*0.4,y-s*0.1);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.color;ctx.globalAlpha=0.4;
  ctx.beginPath();ctx.moveTo(x-s*0.3,y+s*0.1);ctx.lineTo(x-s*0.7,y+s*0.5);ctx.lineTo(x-s*0.2,y+s*0.35);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle='#cccccc';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x+s*0.3,y-s*0.1);ctx.lineTo(x+s*0.7,y-s*0.5);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.25,y+s*0.15);ctx.lineTo(x+s*0.65,y+s*0.35);ctx.stroke();
  if(frame%3===0)addP(x-s*0.4+rnd(-3,3),y+s*0.2+rnd(-3,3),'#2a1a2a',1,2);
  ctx.fillStyle='#ff4444';ctx.fillRect(x+s*0.1,y-s*0.3,s*0.2,2);ctx.fillRect(x+s*0.1,y-s*0.15,s*0.2,2);
}
function _drawBoss_Sultan(e,x,y,s){
  return _drawBoss_SultanV2(e,x,y,s);
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.7,s*0.2,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;
  ctx.beginPath();ctx.moveTo(x-s*0.35,y-s*0.5);ctx.lineTo(x+s*0.35,y-s*0.5);ctx.lineTo(x+s*0.55,y+s*0.65);ctx.lineTo(x-s*0.55,y+s*0.65);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.accent;ctx.beginPath();ctx.ellipse(x,y-s*0.1,s*0.45,s*0.35,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff6600';ctx.globalAlpha=0.5+0.2*Math.sin(frame*0.1);
  ctx.beginPath();ctx.arc(x,y-s*0.1,s*0.55,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  for(let i=0;i<5;i++){const a=frame*0.05+i*Math.PI*2/5;
    ctx.fillStyle='#ff4400';ctx.globalAlpha=0.7;
    ctx.beginPath();ctx.moveTo(x+Math.cos(a)*s*0.3,y-s*0.65);ctx.lineTo(x+Math.cos(a)*s*0.15,y-s*0.95);ctx.lineTo(x+Math.cos(a+0.2)*s*0.3,y-s*0.65);ctx.fill();}
  ctx.globalAlpha=1;
  if(frame%2===0)addP(x+rnd(-s*0.3,s*0.3),y-s*0.3+rnd(-s*0.2,0),'#ff6600',1,3);
  ctx.fillStyle='#ffaa00';ctx.beginPath();ctx.arc(x-s*0.12,y-s*0.2,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+s*0.12,y-s*0.2,2.5,0,Math.PI*2);ctx.fill();
}
function _drawBoss_DuneWorm(e,x,y,s){
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.8,s*0.2,0,0,Math.PI*2);ctx.fill();
  const segC=[e.color,e.accent,e.color,e.accent];
  for(let i=3;i>=0;i--){
    const sy=y+s*0.3-i*s*0.35,sx=x+Math.sin(frame*0.04+i*0.5)*s*0.1;
    ctx.fillStyle=segC[i];ctx.beginPath();ctx.ellipse(sx,sy,s*0.45-i*s*0.03,s*0.22,0,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(x,y-s*0.85,s*0.35,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.arc(x,y-s*0.75,s*0.3,0,Math.PI,false);ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=1.5;
  for(let i=0;i<6;i++){const a=-Math.PI+i*Math.PI/5;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*s*0.2,y-s*0.75+Math.sin(a)*s*0.15);ctx.lineTo(x+Math.cos(a)*s*0.1,y-s*0.85);ctx.stroke();}
  ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(x-s*0.12,y-s*0.95,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+s*0.12,y-s*0.95,2.5,0,Math.PI*2);ctx.fill();
}
function _drawBoss_Pharaoh(e,x,y,s){
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.6,s*0.18,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;
  ctx.beginPath();ctx.moveTo(x-s*0.4,y-s*0.4);ctx.lineTo(x+s*0.4,y-s*0.4);ctx.lineTo(x+s*0.35,y+s*0.7);ctx.lineTo(x-s*0.35,y+s*0.7);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x-s*0.5,y-s*0.4);ctx.lineTo(x,y-s*1.0);ctx.lineTo(x+s*0.5,y-s*0.4);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x-s*0.5,y-s*0.4);ctx.lineTo(x-s*0.55,y-s*0.15);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.5,y-s*0.4);ctx.lineTo(x+s*0.55,y-s*0.15);ctx.stroke();
  ctx.fillStyle='#ffd700';
  ctx.beginPath();ctx.arc(x,y-s*1.0,3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ffd700';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x-s*0.35,y-s*0.15);ctx.lineTo(x+s*0.35,y-s*0.15);ctx.stroke();
  ctx.strokeStyle=e.accent;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x+s*0.35,y+s*0.5);ctx.lineTo(x+s*0.55,y-s*0.55);ctx.stroke();
  ctx.strokeStyle='#ffd700';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x+s*0.5,y-s*0.55);ctx.lineTo(x+s*0.6,y-s*0.7);ctx.moveTo(x+s*0.5,y-s*0.55);ctx.lineTo(x+s*0.65,y-s*0.5);ctx.stroke();
  ctx.fillStyle='#22ccff';ctx.beginPath();ctx.arc(x-s*0.12,y-s*0.25,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+s*0.12,y-s*0.25,2.5,0,Math.PI*2);ctx.fill();
}
function _drawBoss_IceWraith(e,x,y,s){
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+s*0.8,s*0.5,s*0.15,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.fillStyle=e.color;ctx.globalAlpha=0.5;
  ctx.beginPath();ctx.ellipse(x,y,s*0.5,s*0.8,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#aaeeff';ctx.lineWidth=1.5;ctx.globalAlpha=0.6;
  ctx.beginPath();ctx.ellipse(x,y,s*0.5,s*0.8,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  ctx.fillStyle='#aaeeff';ctx.globalAlpha=0.6;
  const iceY=y-s*0.65;
  ctx.beginPath();ctx.moveTo(x-s*0.2,iceY);ctx.lineTo(x-s*0.08,iceY-s*0.35);ctx.lineTo(x+s*0.05,iceY);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.05,iceY);ctx.lineTo(x+s*0.15,iceY-s*0.28);ctx.lineTo(x+s*0.25,iceY);ctx.fill();
  ctx.beginPath();ctx.moveTo(x-s*0.1,iceY+s*0.05);ctx.lineTo(x,iceY-s*0.4);ctx.lineTo(x+s*0.1,iceY+s*0.05);ctx.fill();
  ctx.globalAlpha=1;
  ctx.fillStyle=e.color;ctx.globalAlpha=0.3;
  ctx.beginPath();ctx.moveTo(x-s*0.3,y+s*0.3);ctx.lineTo(x-s*0.6,y+s*0.7);ctx.lineTo(x-s*0.1,y+s*0.5);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.3,y+s*0.3);ctx.lineTo(x+s*0.6,y+s*0.7);ctx.lineTo(x+s*0.1,y+s*0.5);ctx.fill();ctx.globalAlpha=1;
  if(frame%3===0)addP(x+rnd(-s*0.3,s*0.3),y+rnd(-s*0.4,s*0.2),'#ddeeff',1,2);
  ctx.fillStyle='#88ddff';ctx.beginPath();ctx.arc(x-s*0.12,y-s*0.2,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+s*0.12,y-s*0.2,2.5,0,Math.PI*2);ctx.fill();
}
function _drawBoss_FrostTitan(e,x,y,s){
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.7,s*0.2,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;
  ctx.beginPath();ctx.moveTo(x-s*0.4,y-s*0.6);ctx.lineTo(x+s*0.4,y-s*0.6);ctx.lineTo(x+s*0.5,y+s*0.7);ctx.lineTo(x-s*0.5,y+s*0.7);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x-s*0.5,y-s*0.55);ctx.lineTo(x-s*0.7,y-s*0.2);ctx.lineTo(x-s*0.5,y+s*0.1);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.5,y-s*0.55);ctx.lineTo(x+s*0.7,y-s*0.2);ctx.lineTo(x+s*0.5,y+s*0.1);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(x,y-s*0.55,s*0.32,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=e.accent;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x-s*0.38,y-s*0.55);ctx.lineTo(x-s*0.35,y-s*0.85);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.38,y-s*0.55);ctx.lineTo(x+s*0.35,y-s*0.85);ctx.stroke();
  ctx.strokeStyle='#aaccee';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x+s*0.55,y+s*0.1);ctx.lineTo(x+s*0.7,y-s*0.4);ctx.lineTo(x+s*0.85,y-s*0.55);ctx.stroke();
  ctx.fillStyle='#88ddff';ctx.beginPath();ctx.moveTo(x+s*0.75,y-s*0.55);ctx.lineTo(x+s*0.85,y-s*0.75);ctx.lineTo(x+s*0.95,y-s*0.55);ctx.lineTo(x+s*0.85,y-s*0.45);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.accent;
  ctx.fillRect(x-s*0.35,y+s*0.65,s*0.15,s*0.25);ctx.fillRect(x+s*0.2,y+s*0.65,s*0.15,s*0.25);
  ctx.fillStyle='#88ddff';ctx.beginPath();ctx.arc(x-s*0.12,y-s*0.6,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+s*0.12,y-s*0.6,2.5,0,Math.PI*2);ctx.fill();
}
function _drawBoss_CrowGerban(e,x,y,s){
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.7,s*0.2,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;
  ctx.beginPath();ctx.moveTo(x-s*0.3,y-s*0.5);ctx.lineTo(x+s*0.3,y-s*0.5);ctx.lineTo(x+s*0.5,y+s*0.7);ctx.lineTo(x-s*0.5,y+s*0.7);ctx.closePath();ctx.fill();
  const wb=Math.sin(frame*0.06)*0.12;
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x-s*0.3,y-s*0.3);ctx.lineTo(x-s*(0.95+wb),y-s*0.8);ctx.lineTo(x-s*0.8,y-s*0.1);ctx.lineTo(x-s*0.3,y+s*0.1);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.3,y-s*0.3);ctx.lineTo(x+s*(0.95+wb),y-s*0.8);ctx.lineTo(x+s*0.8,y-s*0.1);ctx.lineTo(x+s*0.3,y+s*0.1);ctx.closePath();ctx.fill();
  ctx.fillStyle='#1a0010';
  ctx.beginPath();ctx.moveTo(x-s*0.25,y-s*0.4);ctx.quadraticCurveTo(x,y-s*1.05,x+s*0.25,y-s*0.4);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x,y-s*0.55);ctx.lineTo(x+s*0.08,y-s*0.75);ctx.lineTo(x+s*0.12,y-s*0.55);ctx.closePath();ctx.fill();
  ctx.fillStyle='#aa00aa';ctx.globalAlpha=0.7+0.3*Math.sin(frame*0.12);
  ctx.beginPath();ctx.arc(x-s*0.08,y-s*0.55,3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.08,y-s*0.55,3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  if(frame%2===0)addP(x+rnd(-s*0.5,s*0.5),y+rnd(-s*0.3,s*0.3),'#3a0a3a',1,3);
}
function _drawBoss_AstralLanternWarden(e,x,y,s){
  return _drawBoss_AstralLanternWardenV2(e,x,y,s);
}
function _drawBoss_BazaarGate(e,x,y,s){
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+s+2,s*0.6,s*0.18,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;
  ctx.fillRect(x-s*0.5,y-s*0.7,s*0.2,s*1.4);ctx.fillRect(x+s*0.3,y-s*0.7,s*0.2,s*1.4);
  ctx.beginPath();ctx.moveTo(x-s*0.5,y-s*0.7);ctx.quadraticCurveTo(x,y-s*1.1,x+s*0.5,y-s*0.7);ctx.lineTo(x+s*0.3,y-s*0.7);ctx.quadraticCurveTo(x,y-s*0.85,x-s*0.3,y-s*0.7);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.accent;ctx.globalAlpha=0.4+0.2*Math.sin(frame*0.1);
  ctx.fillRect(x-s*0.3,y-s*0.5,s*0.6,s*1.0);ctx.globalAlpha=1;
  ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(x-s*0.15,y-s*0.2,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+s*0.15,y-s*0.2,3,0,Math.PI*2);ctx.fill();
  if(frame%4===0)addP(x+rnd(-s*0.2,s*0.2),y+rnd(-s*0.3,s*0.3),'#a855f7',1,2);
}
function _drawBoss_StormRoc(e,x,y,s){
  ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+s+4,s*0.8,s*0.2,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.ellipse(x,y,s*0.4,s*0.6,0,0,Math.PI*2);ctx.fill();
  const wf=Math.sin(frame*0.15)*0.1;
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x-s*0.3,y-s*0.2);ctx.lineTo(x-s*(1.0+wf),y-s*0.7);ctx.lineTo(x-s*0.85,y-s*0.15);ctx.lineTo(x-s*0.3,y+s*0.15);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x+s*0.3,y-s*0.2);ctx.lineTo(x+s*(1.0+wf),y-s*0.7);ctx.lineTo(x+s*0.85,y-s*0.15);ctx.lineTo(x+s*0.3,y+s*0.15);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(x,y-s*0.45,s*0.25,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.accent;
  ctx.beginPath();ctx.moveTo(x+s*0.15,y-s*0.45);ctx.lineTo(x+s*0.35,y-s*0.4);ctx.lineTo(x+s*0.15,y-s*0.35);ctx.closePath();ctx.fill();
  ctx.fillStyle=e.color;
  ctx.beginPath();ctx.moveTo(x-s*0.08,y+s*0.4);ctx.lineTo(x,y+s*0.8);ctx.lineTo(x+s*0.08,y+s*0.4);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x-s*0.15,y+s*0.35);ctx.lineTo(x-s*0.1,y+s*0.7);ctx.lineTo(x,y+s*0.35);ctx.closePath();ctx.fill();
  if(frame%3===0){ctx.strokeStyle='#ffee44';ctx.lineWidth=1;ctx.globalAlpha=0.6;
    const lx=x+rnd(-s*0.5,s*0.5);ctx.beginPath();ctx.moveTo(lx,y-s*0.3);ctx.lineTo(lx+rnd(-3,3),y-s*0.1);ctx.lineTo(lx+rnd(-3,3),y+s*0.1);ctx.stroke();ctx.globalAlpha=1;}
  ctx.fillStyle='#ffaa00';ctx.beginPath();ctx.arc(x-s*0.08,y-s*0.5,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+s*0.08,y-s*0.5,2.5,0,Math.PI*2);ctx.fill();
}

  return {
    drawBossBody(e, x, y, s) {
      sync();
      return _drawBossBody(e, x, y, s);
    }
  };
}

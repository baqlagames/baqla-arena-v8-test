export function drawVodkaSprite(ctx, {
  x,
  y,
  unit,
  frame = 0,
  randomRange = () => 0,
  emitParticle = () => {},
} = {}) {
  const u = unit;
  const rnd = randomRange;
  const addP = emitParticle;
  const s=u.size;
  const fury=u.furyTimer>0;
  const bodyC='#3a8e3a',bodyAccent='#1f5c1f',bodyDark='#0f3a14';
  const beadC='#ee8a2a',beadShade='#a85318';
  const vineC='#3a8e3a',vineAccent='#1f5c1f';
  const exhaustC=fury?'#ff2200':'#ff8c00';
  // ===== HOVER SHADOW (under speeder, on ground) =====
  ctx.fillStyle='#0009';ctx.beginPath();ctx.ellipse(x,y+s*1.6,s*0.7,s*0.2,0,0,Math.PI*2);ctx.fill();
  // ===== EXHAUST TRAIL (long, behind = below the unit, since front = up) =====
  for(let i=0;i<7;i++){
    const t=i/6;
    const ey=y+s*1.0+i*9;
    const ex=x+Math.sin(frame*0.3+i)*1.5;
    ctx.fillStyle=exhaustC;ctx.globalAlpha=0.9-t*0.85;
    ctx.beginPath();ctx.ellipse(ex,ey,3+i*0.6,5+i*1.4,0,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  // motion streaks (vertical, trailing down)
  ctx.strokeStyle=`rgba(255,200,120,${0.45+Math.sin(frame*0.2)*0.1})`;ctx.lineWidth=1.5;
  for(let i=0;i<3;i++){
    const lx=x-s*0.3+i*s*0.3;
    ctx.beginPath();ctx.moveTo(lx,y+s*0.85);ctx.lineTo(lx,y+s*1.4+i*4);ctx.stroke();
  }
  if(frame%2===0){addP(x,y+s*1.5,exhaustC,1,3);addP(x+rnd(-s*0.2,s*0.2),y+s*1.2,'#ffaa00',1,2)}
  // ===== SPEEDER BIKE BODY (vertical torpedo, long axis = vertical) =====
  // Hull is a tall ellipse centered slightly below Vodka so he sits on top
  ctx.fillStyle='#1a1a2a';
  ctx.beginPath();ctx.ellipse(x,y+s*0.55,s*0.42,s*0.95,0,0,Math.PI*2);ctx.fill();
  // hull side highlight
  ctx.fillStyle='rgba(255,255,255,0.12)';
  ctx.beginPath();ctx.ellipse(x-s*0.18,y+s*0.55,s*0.08,s*0.85,0,0,Math.PI*2);ctx.fill();
  // brass trim (down the center)
  ctx.fillStyle='#a0703a';
  ctx.fillRect(x-2,y-s*0.3,4,s*1.7);
  // ===== CREATURE-HEAD FRONT (dragon beak pointing UP) =====
  ctx.fillStyle='#26263a';
  // beak triangle pointing up
  ctx.beginPath();
  ctx.moveTo(x,y-s*0.85);
  ctx.lineTo(x-s*0.28,y-s*0.35);
  ctx.lineTo(x+s*0.28,y-s*0.35);
  ctx.closePath();ctx.fill();
  // head accent eye on the beak (looking forward/up)
  ctx.fillStyle=fury?'#ff2200':'#cc4400';
  ctx.beginPath();ctx.arc(x,y-s*0.55,s*0.07,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffeb3b';ctx.beginPath();ctx.arc(x,y-s*0.55,s*0.03,0,Math.PI*2);ctx.fill();
  // ===== TAIL FINS (back of bike, splayed out at bottom) =====
  ctx.fillStyle='#26263a';
  ctx.beginPath();
  ctx.moveTo(x-s*0.35,y+s*1.3);ctx.lineTo(x-s*0.6,y+s*1.55);ctx.lineTo(x-s*0.18,y+s*1.45);ctx.closePath();ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x+s*0.35,y+s*1.3);ctx.lineTo(x+s*0.6,y+s*1.55);ctx.lineTo(x+s*0.18,y+s*1.45);ctx.closePath();ctx.fill();
  // ===== TWIN HOVER THRUSTERS (left/right of bike) =====
  const wobble=Math.sin(frame*0.4)*1.5;
  for(const dx of [-s*0.5,s*0.5]){
    ctx.fillStyle='#222';ctx.beginPath();ctx.arc(x+dx,y+s*0.85+wobble,s*0.18,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=exhaustC;ctx.beginPath();ctx.arc(x+dx,y+s*0.85+wobble,s*0.13,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffeb3b';ctx.beginPath();ctx.arc(x+dx,y+s*0.85+wobble,s*0.06,0,Math.PI*2);ctx.fill();
  }
  // ===== UNDERGLOW (heat ring under bike) =====
  ctx.fillStyle=fury?'rgba(255,30,0,0.5)':'rgba(255,140,0,0.36)';
  ctx.beginPath();ctx.ellipse(x,y+s*1.25,s*0.55,s*0.16,0,0,Math.PI*2);ctx.fill();
  // ===== HANDLEBARS (extending up & sideways from front, where Vodka grips) =====
  ctx.strokeStyle='#444';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x-s*0.18,y-s*0.05);ctx.lineTo(x-s*0.42,y-s*0.18);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+s*0.18,y-s*0.05);ctx.lineTo(x+s*0.42,y-s*0.18);ctx.stroke();
  ctx.fillStyle='#1a1a2a';
  ctx.beginPath();ctx.arc(x-s*0.42,y-s*0.18,s*0.06,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+s*0.42,y-s*0.18,s*0.06,0,Math.PI*2);ctx.fill();
  // ===== VODKA BODY (sits on top of bike, looking UP toward enemy) =====
  // Body center slightly forward (up) since he leans into the ride
  const cy=y+s*0.05;
  // Body underside shadow
  ctx.fillStyle=bodyDark;ctx.beginPath();ctx.ellipse(x,cy+s*0.5,s*0.78,s*0.3,0,0,Math.PI*2);ctx.fill();
  // Main green body
  ctx.fillStyle=bodyC;ctx.beginPath();ctx.ellipse(x,cy,s*0.85,s*0.85,0,0,Math.PI*2);ctx.fill();
  // Watermelon stripe shading
  ctx.strokeStyle=bodyAccent;ctx.lineWidth=1.5;
  for(let i=-2;i<=2;i++){
    if(i===0)continue;
    ctx.beginPath();ctx.ellipse(x+i*s*0.22,cy,s*0.05,s*0.78,0,0,Math.PI*2);ctx.stroke();
  }
  // Top sheen
  ctx.fillStyle='rgba(255,255,255,0.18)';ctx.beginPath();ctx.ellipse(x-s*0.25,cy-s*0.4,s*0.28,s*0.14,-0.3,0,Math.PI*2);ctx.fill();
  // ===== ORANGE BEAD-RING CROWN (top hemisphere) =====
  // Bead ring rotates around the top half of the head
  const crownR=s*0.85;
  for(let i=0;i<11;i++){
    const a=-Math.PI*0.95+(i/10)*Math.PI*1.05; // top arc
    const bx=x+Math.cos(a)*crownR;
    const by=cy+Math.sin(a)*crownR;
    ctx.fillStyle=beadC;ctx.beginPath();ctx.arc(bx,by,s*0.16,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=beadShade;ctx.beginPath();ctx.arc(bx+s*0.04,by+s*0.05,s*0.09,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,235,180,0.55)';ctx.beginPath();ctx.arc(bx-s*0.04,by-s*0.05,s*0.045,0,Math.PI*2);ctx.fill();
  }
  // ===== TIED-STEM with LEAF BOW (top Ã¢â‚¬â€ pointing up, toward enemy) =====
  const stemX=x,stemY=cy-s*0.95;
  ctx.fillStyle='#5d3017';
  ctx.beginPath();ctx.roundRect(stemX-3,stemY-s*0.05,6,s*0.16,2);ctx.fill();
  ctx.fillStyle='#3a1e0a';
  for(let i=0;i<3;i++)ctx.fillRect(stemX-4,stemY+i*4,8,2);
  // leaf bow (two leaves splayed)
  ctx.fillStyle=vineC;
  ctx.beginPath();ctx.ellipse(stemX-s*0.13,stemY-s*0.06,s*0.13,s*0.07,-0.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(stemX+s*0.13,stemY-s*0.06,s*0.13,s*0.07,0.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=vineAccent;
  ctx.beginPath();ctx.arc(stemX,stemY-s*0.05,s*0.05,0,Math.PI*2);ctx.fill();
  // ===== JAGGED MOUTH (horizontal across body) =====
  const moY=cy+s*0.16;
  const moW=s*1.2;
  ctx.fillStyle='#000';
  ctx.beginPath();ctx.moveTo(x-moW/2,moY);
  for(let i=0;i<8;i++){const tx=x-moW/2+(i+0.5)*moW/8;ctx.lineTo(tx,moY+(i%2?-5:5))}
  ctx.lineTo(x+moW/2,moY);ctx.lineTo(x+moW/2,moY+s*0.16);
  for(let i=7;i>=0;i--){const tx=x-moW/2+(i+0.5)*moW/8;ctx.lineTo(tx,moY+s*0.16+(i%2?-5:5))}
  ctx.lineTo(x-moW/2,moY+s*0.16);ctx.closePath();ctx.fill();
  // ===== RED BOW (on chest below mouth) =====
  ctx.fillStyle='#cc1a2a';
  ctx.beginPath();ctx.moveTo(x,moY+s*0.3);ctx.lineTo(x-s*0.16,moY+s*0.4);ctx.lineTo(x-s*0.16,moY+s*0.5);ctx.lineTo(x,moY+s*0.36);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x,moY+s*0.3);ctx.lineTo(x+s*0.16,moY+s*0.4);ctx.lineTo(x+s*0.16,moY+s*0.5);ctx.lineTo(x,moY+s*0.36);ctx.closePath();ctx.fill();
  ctx.fillStyle='#9a0c1a';ctx.beginPath();ctx.arc(x,moY+s*0.36,s*0.05,0,Math.PI*2);ctx.fill();
  // ===== EYES (looking up toward enemy) =====
  if(fury){
    ctx.fillStyle='#ff0000';
    ctx.beginPath();ctx.arc(x-s*0.26,cy-s*0.1,s*0.09,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+s*0.26,cy-s*0.1,s*0.09,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(x-s*0.26,cy-s*0.12,s*0.04,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+s*0.26,cy-s*0.12,s*0.04,0,Math.PI*2);ctx.fill();
  }else{
    // squint marks looking forward (up)
    ctx.strokeStyle=bodyDark;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x-s*0.32,cy-s*0.08);ctx.lineTo(x-s*0.20,cy-s*0.12);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+s*0.20,cy-s*0.12);ctx.lineTo(x+s*0.32,cy-s*0.08);ctx.stroke();
  }
  // ===== VINE ARMS Ã¢â‚¬â€ both reach forward (down/sideways) to grip handlebars =====
  ctx.strokeStyle=vineC;ctx.lineWidth=5;ctx.lineCap='round';
  // Left vine Ã¢â‚¬â€ reaches down-left to grip left handlebar
  ctx.beginPath();
  ctx.moveTo(x-s*0.55,cy+s*0.15);
  ctx.bezierCurveTo(x-s*0.55,cy+s*0.05,x-s*0.5,y-s*0.1,x-s*0.42,y-s*0.18);
  ctx.stroke();
  // Right vine Ã¢â‚¬â€ reaches down-right to grip right handlebar
  ctx.beginPath();
  ctx.moveTo(x+s*0.55,cy+s*0.15);
  ctx.bezierCurveTo(x+s*0.55,cy+s*0.05,x+s*0.5,y-s*0.1,x+s*0.42,y-s*0.18);
  ctx.stroke();
  ctx.lineCap='butt';
  // Small leaves at vine joints
  ctx.fillStyle=vineAccent;
  ctx.beginPath();ctx.ellipse(x-s*0.55,cy+s*0.05,s*0.08,s*0.14,-0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+s*0.55,cy+s*0.05,s*0.08,s*0.14,0.3,0,Math.PI*2);ctx.fill();
}

import { SPRITE_BASE } from '../assets.js';
import { BOSSES } from '../data/bosses.js';
import { drawArena25D } from './arena-25d.js';
import { createArenaDecor, drawClassicArena } from './arena.js';

export function createArenaSceneRenderer({ ctx, view, randomRange } = {}) {
  let W = 500, H = 1000, frame = 0, state = 'menu', selectedCard = -1;
  let currentStage = null, bossRef = null;
  let ARENA_L = 0, ARENA_R = 0, ARENA_TOP = 0, ARENA_BOT = 0, DEPLOY_TOP = 0;
  let gridX = 80, gridY = 250, gridW = 340, cellW = 64, cellH = 64, gridCols = 5, gridRows = 5;
  const rnd = typeof randomRange === 'function' ? randomRange : ((min, max) => min + Math.random() * (max - min));
  let paintedArenaImage = null;
  let paintedArenaReady = false;
  let paintedArenaFailed = false;
  let paintedArenaSrcIndex = 0;
  const paintedArenaSources = [
    SPRITE_BASE + 'Baqla_Arena%201.png',
    '/BaqlaGames/BaqlaArena/Baqla_Arena%201.png',
  ];
  let paintedArena25DImage = null;
  let paintedArena25DReady = false;
  let paintedArena25DFailed = false;
  let paintedArena25DSrcIndex = 0;
  const paintedArena25DSources = [
    SPRITE_BASE + 'BG%202.5D.png',
    '/BaqlaGames/BaqlaArena/BG%202.5D.png',
  ];

  function getPaintedArenaImage() {
    if (paintedArenaImage || paintedArenaFailed || typeof Image === 'undefined') {
      if (paintedArenaImage && paintedArenaImage.complete && paintedArenaImage.naturalWidth > 0) paintedArenaReady = true;
      return paintedArenaImage;
    }
    const img = new Image();
    img.onload = () => { paintedArenaReady = true; };
    img.onerror = () => {
      paintedArenaSrcIndex++;
      if (paintedArenaSrcIndex < paintedArenaSources.length) {
        img.src = paintedArenaSources[paintedArenaSrcIndex];
        return;
      }
      paintedArenaFailed = true;
    };
    img.src = paintedArenaSources[paintedArenaSrcIndex];
    paintedArenaImage = img;
    return paintedArenaImage;
  }

  function getPaintedArena25DImage() {
    if (paintedArena25DImage || paintedArena25DFailed || typeof Image === 'undefined') {
      if (paintedArena25DImage && paintedArena25DImage.complete && paintedArena25DImage.naturalWidth > 0) paintedArena25DReady = true;
      return paintedArena25DImage;
    }
    const img = new Image();
    img.onload = () => { paintedArena25DReady = true; };
    img.onerror = () => {
      paintedArena25DSrcIndex++;
      if (paintedArena25DSrcIndex < paintedArena25DSources.length) {
        img.src = paintedArena25DSources[paintedArena25DSrcIndex];
        return;
      }
      paintedArena25DFailed = true;
    };
    img.src = paintedArena25DSources[paintedArena25DSrcIndex];
    paintedArena25DImage = img;
    return paintedArena25DImage;
  }

  function drawCoverImage(img, x, y, w, h) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return false;
    const scale = Math.max(w / iw, h / ih);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (iw - sw) / 2;
    const sy = (ih - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    return true;
  }

  function drawFullHeightImage(img, x, y, w, h) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return false;
    const scale = h / ih;
    const dw = iw * scale;
    const dx = x + (w - dw) / 2;
    ctx.drawImage(img, 0, 0, iw, ih, dx, y, dw, h);
    return true;
  }

  function drawPaintedArena() {
    const img = getPaintedArenaImage();
    if (img && img.complete && img.naturalWidth > 0) paintedArenaReady = true;
    if (!img || !paintedArenaReady) return false;

    ctx.save();
    drawCoverImage(img, 0, 0, W, H);

    const topFade = ctx.createLinearGradient(0, 0, 0, Math.max(180, H * 0.22));
    topFade.addColorStop(0, 'rgba(5,8,20,0.36)');
    topFade.addColorStop(1, 'rgba(5,8,20,0.00)');
    ctx.fillStyle = topFade;
    ctx.fillRect(0, 0, W, Math.max(180, H * 0.22));

    const bottomFade = ctx.createLinearGradient(0, Math.max(0, H - 220), 0, H);
    bottomFade.addColorStop(0, 'rgba(5,8,20,0.00)');
    bottomFade.addColorStop(1, 'rgba(5,8,20,0.42)');
    ctx.fillStyle = bottomFade;
    ctx.fillRect(0, Math.max(0, H - 220), W, 220);

    const theme = arena_bossArenaTheme();
    if (theme && state === 'battle') {
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = theme.color || theme.accent || '#ffd166';
      ctx.fillRect(0, ARENA_TOP, W, ARENA_BOT - ARENA_TOP);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
    return true;
  }

  function arena25DPath(points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
  }

  function arena25DStrokeLine(x1, y1, x2, y2) {
    const a = arena_camPoint(x1, y1);
    const b = arena_camPoint(x2, y2);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function drawPainted25DTorch(x, y, scale) {
    const p = arena_camPoint(x, y);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#2a1a0d';
    ctx.fillRect(-3, -16, 6, 18);
    ctx.fillStyle = '#5b3516';
    ctx.fillRect(-7, -18, 14, 5);
    ctx.fillStyle = 'rgba(255,170,42,0.28)';
    ctx.beginPath();
    ctx.arc(0, -23, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffcf45';
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.quadraticCurveTo(9, -24, 0, -14);
    ctx.quadraticCurveTo(-8, -24, 0, -36);
    ctx.fill();
    ctx.fillStyle = '#ff6b2c';
    ctx.beginPath();
    ctx.moveTo(1, -30);
    ctx.quadraticCurveTo(5, -23, 0, -17);
    ctx.quadraticCurveTo(-4, -23, 1, -30);
    ctx.fill();
    ctx.restore();
  }

  function drawPainted25DGate(floor) {
    const midX = (floor.left + floor.right) / 2;
    const p = arena_camPoint(midX, floor.top - 36);
    const gateW = Math.max(58, (floor.right - floor.left) * 0.20);
    const scale = arena_camDepthScaleAt(floor.top);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#263023';
    ctx.strokeStyle = '#7d6744';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-gateW / 2, -30, gateW, 58, 10);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(237,213,134,0.45)';
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gateW / 6, -28);
      ctx.lineTo(i * gateW / 6, 26);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPaintedArena25D() {
    const theme = arena_bossArenaTheme();
    const floorPad = Math.max(cellW * 1.65, 92);
    const minWide = Math.min(ARENA_R - ARENA_L - 18, Math.max(gridW + floorPad * 2, (ARENA_R - ARENA_L) * 0.94));
    const centerX = gridX + gridW / 2;
    let left = centerX - minWide / 2;
    let right = centerX + minWide / 2;
    if (left < ARENA_L + 9) {
      right += ARENA_L + 9 - left;
      left = ARENA_L + 9;
    }
    if (right > ARENA_R - 9) {
      left -= right - (ARENA_R - 9);
      right = ARENA_R - 9;
    }
    const floor = {
      left: Math.max(ARENA_L + 9, left),
      right: Math.min(ARENA_R - 9, right),
      top: Math.max(ARENA_TOP + 36, gridY - cellH * 4.45),
      bottom: Math.min(ARENA_BOT - 22, gridY + cellH * (gridRows + 1.82))
    };

    ctx.save();
    ctx.fillStyle = '#071019';
    ctx.fillRect(0, 0, W, H);

    const sky = ctx.createLinearGradient(0, ARENA_TOP, 0, ARENA_BOT);
    sky.addColorStop(0, '#314a58');
    sky.addColorStop(0.42, '#5d7c5a');
    sky.addColorStop(1, '#33231c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, ARENA_TOP, W, ARENA_BOT - ARENA_TOP);

    const glow = ctx.createRadialGradient(W / 2, ARENA_TOP + 120, 30, W / 2, ARENA_TOP + 150, W * 0.78);
    glow.addColorStop(0, theme ? (theme.color + '33') : 'rgba(255,214,102,0.18)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, ARENA_TOP, W, ARENA_BOT - ARENA_TOP);

    const lt = arena_camPoint(floor.left, floor.top);
    const rt = arena_camPoint(floor.right, floor.top);
    const lb = arena_camPoint(floor.left, floor.bottom);
    const rb = arena_camPoint(floor.right, floor.bottom);

    ctx.fillStyle = '#59627f';
    arena25DPath([lt, rt, { x: rt.x, y: rt.y - 74 }, { x: lt.x, y: lt.y - 74 }]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 9; i++) {
      const x = floor.left + (floor.right - floor.left) * i / 9;
      arena25DStrokeLine(x, floor.top - 58, x, floor.top);
    }

    ctx.fillStyle = '#3f4665';
    arena25DPath([lt, lb, { x: lb.x - 64, y: lb.y - 24 }, { x: lt.x - 42, y: lt.y - 60 }]);
    ctx.fill();
    arena25DPath([rt, rb, { x: rb.x + 64, y: rb.y - 24 }, { x: rt.x + 42, y: rt.y - 60 }]);
    ctx.fill();

    drawPainted25DGate(floor);

    const floorGrad = ctx.createLinearGradient(0, floor.top, 0, floor.bottom);
    floorGrad.addColorStop(0, '#8fc357');
    floorGrad.addColorStop(0.48, '#b7c96a');
    floorGrad.addColorStop(1, '#5e4b32');
    ctx.fillStyle = floorGrad;
    arena_pathCamQuad(floor.left, floor.top, floor.right - floor.left, floor.bottom - floor.top);
    ctx.fill();

    const cols = Math.max(9, gridCols + 4);
    const rows = Math.max(11, gridRows + 7);
    const tileW = (floor.right - floor.left) / cols;
    const tileH = (floor.bottom - floor.top) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isSand = (r + c) % 2 === 0;
        ctx.fillStyle = isSand ? 'rgba(232,211,148,0.74)' : 'rgba(103,173,62,0.68)';
        arena_pathCamQuad(floor.left + c * tileW + 1.2, floor.top + r * tileH + 1.2, tileW - 2.4, tileH - 2.4);
        ctx.fill();
      }
    }

    ctx.strokeStyle = 'rgba(255,248,205,0.26)';
    ctx.lineWidth = 1.2;
    for (let c = 0; c <= gridCols; c++) {
      const x = gridX + c * cellW;
      arena25DStrokeLine(x, gridY, x, gridY + gridRows * cellH);
    }
    for (let r = 0; r <= gridRows; r++) {
      const y = gridY + r * cellH;
      arena25DStrokeLine(gridX, y, gridX + gridCols * cellW, y);
    }

    const edgeAlpha = 0.60;
    ctx.strokeStyle = 'rgba(43,29,18,' + edgeAlpha + ')';
    ctx.lineWidth = 4;
    arena25DStrokeLine(floor.left + 15, floor.top + 8, floor.left + 15, floor.bottom - 18);
    arena25DStrokeLine(floor.right - 15, floor.top + 8, floor.right - 15, floor.bottom - 18);
    ctx.lineWidth = 5;
    arena25DStrokeLine(floor.left + 18, floor.bottom - 6, floor.right - 18, floor.bottom - 6);

    ctx.fillStyle = 'rgba(16,32,25,0.48)';
    arena25DPath([
      arena_camPoint(ARENA_L - 30, floor.top + 30),
      arena_camPoint(floor.left - 8, floor.top + 12),
      arena_camPoint(floor.left - 8, floor.bottom),
      arena_camPoint(ARENA_L - 30, floor.bottom + 42)
    ]);
    ctx.fill();
    arena25DPath([
      arena_camPoint(floor.right + 8, floor.top + 12),
      arena_camPoint(ARENA_R + 30, floor.top + 30),
      arena_camPoint(ARENA_R + 30, floor.bottom + 42),
      arena_camPoint(floor.right + 8, floor.bottom)
    ]);
    ctx.fill();

    drawPainted25DTorch(floor.left + 24, floor.top + 24, 0.72);
    drawPainted25DTorch(floor.right - 24, floor.top + 24, 0.72);
    drawPainted25DTorch(floor.left + 24, floor.bottom - 42, 1.00);
    drawPainted25DTorch(floor.right - 24, floor.bottom - 42, 1.00);

    const sheen = ctx.createLinearGradient(0, ARENA_TOP, 0, ARENA_BOT);
    sheen.addColorStop(0, 'rgba(255,255,255,0.12)');
    sheen.addColorStop(0.42, 'rgba(255,255,255,0.02)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, ARENA_TOP, W, ARENA_BOT - ARENA_TOP);

    if (theme && state === 'battle') {
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = theme.color || theme.accent || '#ffd166';
      ctx.fillRect(0, ARENA_TOP, W, ARENA_BOT - ARENA_TOP);
      ctx.globalAlpha = 1;
    }

    const vignette = ctx.createRadialGradient(W / 2, (ARENA_TOP + ARENA_BOT) / 2, W * 0.20, W / 2, (ARENA_TOP + ARENA_BOT) / 2, W * 0.92);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, ARENA_TOP, W, ARENA_BOT - ARENA_TOP);

    ctx.restore();
    return true;
  }

  function sync() {
    const v = typeof view === 'function' ? view() : {};
    W = v.width || W;
    H = v.height || H;
    frame = v.frame || 0;
    state = v.state || state;
    selectedCard = v.selectedCard == null ? selectedCard : v.selectedCard;
    currentStage = v.currentStage || null;
    bossRef = v.bossRef || null;
    ARENA_L = v.arenaL == null ? ARENA_L : v.arenaL;
    ARENA_R = v.arenaR == null ? ARENA_R : v.arenaR;
    ARENA_TOP = v.arenaTop == null ? ARENA_TOP : v.arenaTop;
    ARENA_BOT = v.arenaBot == null ? ARENA_BOT : v.arenaBot;
    DEPLOY_TOP = v.deployTop == null ? DEPLOY_TOP : v.deployTop;
    gridX = v.gridX == null ? gridX : v.gridX;
    gridY = v.gridY == null ? gridY : v.gridY;
    gridW = v.gridW == null ? gridW : v.gridW;
    cellW = v.cellW == null ? cellW : v.cellW;
    cellH = v.cellH == null ? cellH : v.cellH;
    gridCols = v.gridCols == null ? gridCols : v.gridCols;
    gridRows = v.gridRows == null ? gridRows : v.gridRows;
  }

let arenaDecor=null;
function regenArenaDecor(){
  arenaDecor=createArenaDecor({
    arenaL:ARENA_L,
    arenaR:ARENA_R,
    arenaTop:ARENA_TOP,
    arenaBot:ARENA_BOT,
    randomRange:rnd
  });
}
let arenaViewMode='25d';
function normalizeArenaViewMode(mode) {
  const value = String(mode || '25d').toLowerCase();
  if (value === 'flat') return 'flat';
  if (value === 'draw' || value === 'draw25d' || value === 'procedural' || value === 'procedural25d') return 'draw25d';
  return '25d';
}
try{
  const params=typeof globalThis!=='undefined'&&globalThis.location?new URLSearchParams(globalThis.location.search||''):null;
  const requested=params&&(params.get('arena')||params.get('view'));
  const saved=typeof globalThis!=='undefined'&&globalThis.localStorage?globalThis.localStorage.getItem('baqlaArenaV8ArenaView'):null;
  arenaViewMode=normalizeArenaViewMode(requested||saved||'25d');
}catch(_){arenaViewMode='25d'}
function arena_is25D(){return arenaViewMode!=='flat'}
function arena_isPainted25D(){return arenaViewMode==='25d'}
function arena_nextViewMode(){return arenaViewMode==='25d'?'draw25d':(arenaViewMode==='draw25d'?'flat':'25d')}
function arena_clashCamera(){return arena_is25D()}
function arena_camT(y){
  const top=ARENA_TOP+28,bot=ARENA_BOT-18;
  return Math.max(0,Math.min(1,(y-top)/Math.max(1,bot-top)));
}
function arena_camY(y){
  const top=ARENA_TOP+28,bot=ARENA_BOT-18;
  return top+Math.pow(arena_camT(y),1.18)*(bot-top);
}
function arena_camWidthScaleAt(y){return 0.53+0.50*arena_camT(y)}
function arena_camDepthScaleAt(y){return 0.72+0.42*arena_camT(y)}
function arena_camPoint(x,y){
  const s=arena_camWidthScaleAt(y);
  return{x:W/2+(x-W/2)*s,y:arena_camY(y)};
}
function arena_screenToWorldPoint(x,y){
  if(!arena_clashCamera()||state!=='battle')return{x,y};
  const top=ARENA_TOP+28,bot=ARENA_BOT-18;
  const sy=Math.max(top,Math.min(bot,y));
  const t=Math.pow(Math.max(0,Math.min(1,(sy-top)/Math.max(1,bot-top))),1/1.18);
  const wy=top+t*(bot-top);
  const s=arena_camWidthScaleAt(wy);
  return{x:W/2+(x-W/2)/Math.max(0.01,s),y:wy};
}
function arena_pathCamQuad(x,y,w,h){
  const p1=arena_camPoint(x,y),p2=arena_camPoint(x+w,y),p3=arena_camPoint(x+w,y+h),p4=arena_camPoint(x,y+h);
  ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.lineTo(p3.x,p3.y);ctx.lineTo(p4.x,p4.y);ctx.closePath();
}
function arena_drawWithClashCamera(x,y,fn){
  if(!arena_clashCamera()||state!=='battle'){fn();return}
  const p=arena_camPoint(x,y),s=arena_camDepthScaleAt(y);
  ctx.save();
  ctx.translate(p.x,p.y);
  ctx.scale(s,s);
  ctx.translate(-x,-y);
  try{fn()}finally{ctx.restore()}
}
let arena_overlayFrame=-1;
let arena_overlayRects=[];
function arena_overlayOffsetFor(anchor,x,y,w,h,minY){
  if(state!=='battle'||!anchor)return 0;
  if(arena_overlayFrame!==frame){arena_overlayFrame=frame;arena_overlayRects=[]}
  const ax=anchor.x==null?x:anchor.x,ay=anchor.y==null?y:anchor.y;
  const ap=arena_clashCamera()?arena_camPoint(ax,ay):{x:ax,y:ay},sc=arena_clashCamera()?arena_camDepthScaleAt(ay):1;
  const sx=ap.x+(x-ax)*sc;
  const localStep=11;
  const minLocalY=minY==null?-Infinity:minY;
  const sw=Math.max(50,(w+26)*sc,68*sc);
  const sh=Math.max(20,(h||30)*sc);
  const overlaps=(a,b)=>a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t;
  for(let lane=0;lane<8;lane++){
    const localY=Math.max(minLocalY,y-lane*localStep);
    const sy=ap.y+(localY-ay)*sc;
    const rect={l:sx-sw/2,t:sy-sh,r:sx+sw/2,b:sy+7*sc};
    if(!arena_overlayRects.some(r=>overlaps(rect,r))){
      arena_overlayRects.push(rect);
      return y-localY;
    }
  }
  const fallbackY=Math.max(minLocalY,y-7*localStep);
  const sy=ap.y+(fallbackY-ay)*sc;
  arena_overlayRects.push({l:sx-sw/2,t:sy-sh,r:sx+sw/2,b:sy+7*sc});
  return y-fallbackY;
}
function arena_bossArenaTheme(){
  const b=(bossRef&&bossRef.hp>0)?bossRef:((currentStage&&currentStage.bossId!=null)?BOSSES[currentStage.bossId]:null);
  if(!b)return null;
  const actCol={1:'#8bd450',2:'#a855f7',3:'#d4a857',4:'#8bdfff',5:'#ff3b8d'}[b.act||((currentStage&&currentStage.act)||1)]||'#a855f7';
  return{color:b.color||actCol,accent:b.accent||actCol,
    trim:b.hasBarrier?'#a855f7':(b.isAerial?'#8bdfff':(b.tier==='final'?'#ff3b8d':'#ffd166')),
    sig:b.hasBarrier?'barrier':(b.isAerial?'aerial':(b.tier==='final'?'final':(b.tier==='vs'?'titan':'boss')))};
}
function drawArena(){
  if(arena_is25D()&&state==='battle'){
    if(arena_isPainted25D()&&drawPaintedArena25D())return;
    drawArena25D(ctx,{
      width:W,
      height:H,
      frame,
      state,
      selectedCard,
      bossTheme:arena_bossArenaTheme(),
      arenaL:ARENA_L,
      arenaR:ARENA_R,
      arenaTop:ARENA_TOP,
      arenaBot:ARENA_BOT,
      deployTop:DEPLOY_TOP,
      gridX,
      gridY,
      gridW,
      cellW,
      cellH,
      gridCols,
      gridRows,
      camPoint:arena_camPoint,
      camDepthScaleAt:arena_camDepthScaleAt,
      pathCamQuad:arena_pathCamQuad
    });
    return;
  }
  if(drawPaintedArena())return;
  if(!arenaDecor)regenArenaDecor();
  drawClassicArena(ctx,{
    width:W,
    height:H,
    frame,
    state,
    selectedCard,
    arenaDecor,
    bossTheme:arena_bossArenaTheme(),
    arenaL:ARENA_L,
    arenaR:ARENA_R,
    arenaTop:ARENA_TOP,
    arenaBot:ARENA_BOT,
    deployTop:DEPLOY_TOP
  });
}

  return {
    get clashCamera() { return arena_clashCamera(); },
    get arenaViewMode() { return arenaViewMode; },
    setArenaViewMode(mode) {
      arenaViewMode=normalizeArenaViewMode(mode);
      try{if(typeof globalThis!=='undefined'&&globalThis.localStorage)globalThis.localStorage.setItem('baqlaArenaV8ArenaView',arenaViewMode)}catch(_){}
      return arenaViewMode;
    },
    toggleArenaViewMode() {
      return this.setArenaViewMode(arena_nextViewMode());
    },
    resetArenaDecor() { arenaDecor = null; },
    regenArenaDecor() { sync(); return regenArenaDecor(); },
    camT(y) { sync(); return arena_camT(y); },
    camY(y) { sync(); return arena_camY(y); },
    camWidthScaleAt(y) { sync(); return arena_camWidthScaleAt(y); },
    camDepthScaleAt(y) { sync(); return arena_camDepthScaleAt(y); },
    camPoint(x, y) { sync(); return arena_camPoint(x, y); },
    screenToWorldPoint(x, y) { sync(); return arena_screenToWorldPoint(x, y); },
    pathCamQuad(x, y, w, h) { sync(); return arena_pathCamQuad(x, y, w, h); },
    drawWithClashCamera(x, y, fn) { sync(); return arena_drawWithClashCamera(x, y, fn); },
    overlayOffsetFor(anchor, x, y, w, h, minY) { sync(); return arena_overlayOffsetFor(anchor, x, y, w, h, minY); },
    bossArenaTheme() { sync(); return arena_bossArenaTheme(); },
    drawArena() { sync(); return drawArena(); },
  };
}

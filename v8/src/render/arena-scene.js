import { SPRITE_BASE } from '../assets.js';
import { BOSSES } from '../data/bosses.js?v=20260523-dragon-judgment-fix';
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
    SPRITE_BASE + 'BG%202.5D%20No%20Grid.png',
    '/BaqlaGames/BaqlaArena/BG%202.5D%20No%20Grid.png',
    SPRITE_BASE + 'BG%202.5D%20New%20Building.png',
    '/BaqlaGames/BaqlaArena/BG%202.5D%20New%20Building.png',
    SPRITE_BASE + 'BG%202.5D%20Wide.png',
    '/BaqlaGames/BaqlaArena/BG%202.5D%20Wide.png',
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

  getPaintedArenaImage();
  getPaintedArena25DImage();

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

  function drawPaintedArena25D() {
    const img = getPaintedArena25DImage();
    if (img && img.complete && img.naturalWidth > 0) paintedArena25DReady = true;
    if (!img || !paintedArena25DReady) return false;

    ctx.save();
    ctx.fillStyle = '#070913';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.28;
    drawCoverImage(img, 0, 0, W, H);
    ctx.restore();
    ctx.fillStyle = 'rgba(5,8,20,0.24)';
    ctx.fillRect(0, 0, W, H);
    drawFullHeightImage(img, 0, 0, W, H);

    const topFade = ctx.createLinearGradient(0, 0, 0, Math.max(150, H * 0.16));
    topFade.addColorStop(0, 'rgba(5,8,20,0.13)');
    topFade.addColorStop(1, 'rgba(5,8,20,0.00)');
    ctx.fillStyle = topFade;
    ctx.fillRect(0, 0, W, Math.max(150, H * 0.16));

    const bottomFade = ctx.createLinearGradient(0, Math.max(0, H - 170), 0, H);
    bottomFade.addColorStop(0, 'rgba(5,8,20,0.00)');
    bottomFade.addColorStop(1, 'rgba(5,8,20,0.18)');
    ctx.fillStyle = bottomFade;
    ctx.fillRect(0, Math.max(0, H - 170), W, 170);

    const theme = arena_bossArenaTheme();
    if (theme && state === 'battle') {
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = theme.color || theme.accent || '#ffd166';
      ctx.fillRect(0, ARENA_TOP, W, ARENA_BOT - ARENA_TOP);
      ctx.globalAlpha = 1;
    }

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
function arena_camWidthScaleAt(y){
  const t=arena_camT(y);
  return arena_isPainted25D()?0.76+0.27*t:0.53+0.50*t;
}
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

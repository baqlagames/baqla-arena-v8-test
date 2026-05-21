// Next-wave threat preview panel shown during build phase.

import { fitCanvasText } from '../render/primitives.js';

function rgba(hex,a){
  if(!hex)return 'rgba(154,163,178,'+a+')';
  if(hex.startsWith('rgba'))return hex;
  let h=hex.replace('#','');
  if(h.length===3)h=h.split('').map(c=>c+c).join('');
  const r=parseInt(h.substring(0,2),16),g=parseInt(h.substring(2,4),16),b=parseInt(h.substring(4,6),16);
  return 'rgba('+r+','+g+','+b+','+a+')';
}

function threatTagColor(tag,colors){
  return (colors&&colors[tag])||'#9aa3b2';
}

function visibleThreatTags(threat){
  return Array.isArray(threat&&threat.tags)?threat.tags.slice(0,5):[];
}

export function threatPanelHeight(threat){
  const shown=threat&&threat.isBoss?0:Math.min(3,(threat&&threat.enemies&&threat.enemies.length)||0);
  const tagRows=visibleThreatTags(threat).length?1:0;
  return threat&&threat.isBoss?Math.max(66,66+tagRows*18):Math.max(78,46+tagRows*18+shown*16+8);
}

function bossThreatCardStyle(threat){
  const barrier=!!(threat&&threat.isBarrier),aerial=!!(threat&&threat.isAerial);
  const accent=barrier?'#b56bff':(aerial?'#ffd166':'#ff4d4d');
  return {
    accent,
    edge:barrier?'rgba(190,120,255,':(aerial?'rgba(255,209,102,':'rgba(255,77,77,'),
    top:barrier?'rgba(49,21,72,0.99)':(aerial?'rgba(72,42,13,0.99)':'rgba(74,18,25,0.99)'),
    mid:barrier?'rgba(31,17,51,0.99)':(aerial?'rgba(48,29,13,0.99)':'rgba(46,15,20,0.99)'),
    bottom:'rgba(12,8,15,0.99)',
    title:barrier?'#f3ddff':(aerial?'#fff1b8':'#ffe7dc'),
    tag:barrier?'BARRIER FIGHT':(aerial?'AERIAL BOSS':'BOSS WAVE')
  };
}

export function drawThreatsPanel(ctx,view){
  if(view.phase!=='build')return false;
  const threat=view.threat;
  if(!threat)return false;
  const W=view.width,colors=view.tagColors||{};
  const shownCount=threat.isBoss?0:Math.min(3,threat.enemies.length);
  const threatTags=visibleThreatTags(threat);
  const x=8,w=Math.min(W-58,368),y=4,h=threatPanelHeight(threat);
  const metaW=68;
  const bossStyle=threat.isBoss?bossThreatCardStyle(threat):null;
  const accent=bossStyle?bossStyle.accent:'#ffb000';
  const bg=ctx.createLinearGradient(0,y,0,y+h);
  if(bossStyle){
    bg.addColorStop(0,bossStyle.top);
    bg.addColorStop(0.56,bossStyle.mid);
    bg.addColorStop(1,bossStyle.bottom);
  }else{
    bg.addColorStop(0,'rgba(32,34,52,0.97)');
    bg.addColorStop(1,'rgba(11,12,22,0.97)');
  }
  ctx.save();
  ctx.shadowColor=threat.isBoss?rgba(accent,0.28):'rgba(0,0,0,0.42)';
  ctx.shadowBlur=threat.isBoss?14:8;ctx.shadowOffsetY=2;
  ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.fill();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  if(threat.isBoss){
    const pulse=0.36+0.18*Math.sin(view.frame*0.12);
    ctx.strokeStyle=(bossStyle.edge+pulse+')');ctx.lineWidth=1.5;
  }else{
    ctx.strokeStyle='rgba(255,255,255,0.10)';ctx.lineWidth=1;
  }
  ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,w-1,h-1,10);ctx.stroke();
  const shine=ctx.createLinearGradient(0,y,0,y+14);
  shine.addColorStop(0,threat.isBoss?'rgba(255,237,200,0.16)':'rgba(255,255,255,0.12)');
  shine.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=shine;ctx.beginPath();ctx.roundRect(x+1,y+1,w-2,14,9);ctx.fill();
  ctx.fillStyle=accent;ctx.beginPath();ctx.roundRect(x,y,threat.isBoss?5:3,h,2);ctx.fill();
  if(threat.isBoss){
    ctx.fillStyle=rgba(accent,0.13);
    ctx.beginPath();ctx.moveTo(x+5,y);ctx.lineTo(x+44,y);ctx.lineTo(x+16,y+h);ctx.lineTo(x+5,y+h);ctx.closePath();ctx.fill();
    ctx.strokeStyle=rgba(accent,0.34);ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x+18,y+9);ctx.lineTo(x+28,y+17);ctx.lineTo(x+18,y+25);ctx.stroke();
  }
  const label=threat.isBoss?bossStyle.tag:'NEXT WAVE';
  ctx.fillStyle=threat.isBoss?rgba(accent,0.95):'rgba(218,224,238,0.86)';
  ctx.font='900 8.5px Segoe UI, Arial';ctx.textAlign='left';
  ctx.fillText(label,x+10,y+13);
  const title=threat.isBoss?(threat.bossName||'?'):(threat.theme||'WAVE');
  ctx.font='900 '+(threat.isBoss?14.5:13)+'px Segoe UI, Arial';ctx.fillStyle=threat.isBoss?bossStyle.title:'#fff';
  let titleText=title,titleMax=w-metaW-24;
  while(titleText.length>4&&ctx.measureText(titleText).width>titleMax)titleText=titleText.slice(0,-1);
  if(titleText!==title)titleText+='...';
  ctx.fillText(titleText,x+10,y+(threat.isBoss?32:30));
  const metaRight=x+w-9;
  ctx.textAlign='right';ctx.font='900 12px Segoe UI, Arial';ctx.fillStyle=threat.isBoss?'#ffe87a':'#ffd54a';
  fitCanvasText(ctx,view.gold+'g',metaRight,y+15,metaW-4,12,8,'900','#ffd54a','right');
  const roundText='R'+threat.round+'/'+threat.total;
  ctx.font='900 8px Segoe UI, Arial';
  const roundW=Math.max(30,Math.min(metaW-4,ctx.measureText(roundText).width+10));
  ctx.fillStyle=threat.isBoss?rgba(accent,0.20):'rgba(255,255,255,0.10)';
  ctx.beginPath();ctx.roundRect(metaRight-roundW,y+19,roundW,12,6);ctx.fill();
  ctx.strokeStyle=threat.isBoss?rgba(accent,0.60):'rgba(255,255,255,0.13)';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(metaRight-roundW+0.5,y+19.5,roundW-1,11,6);ctx.stroke();
  ctx.fillStyle='rgba(230,235,246,0.92)';ctx.textAlign='center';ctx.font='900 8px Segoe UI, Arial';
  ctx.fillText(roundText,metaRight-roundW/2,y+28);
  ctx.textAlign='left';
  if(!threat.isBoss&&threat.enemies.length>shownCount){
    ctx.fillStyle='rgba(198,205,220,0.76)';ctx.font='900 7px Segoe UI, Arial';ctx.textAlign='right';
    ctx.fillText('+'+(threat.enemies.length-shownCount)+' TYPES',x+w-metaW-8,y+13);ctx.textAlign='left';
  }
  const drawTagChips=(tags,baseY)=>{
    let cx=x+10;
    ctx.font='800 7px Segoe UI';
    for(const tag of tags){
      const label=typeof tag==='string'?tag:(tag.label||tag.key||'TAG');
      const key=typeof tag==='string'?tag:(tag.key||label);
      const cw=Math.max(34,Math.min(92,ctx.measureText(label).width+12)),c=threatTagColor(key,colors);
      ctx.fillStyle=rgba(c,0.24);ctx.beginPath();ctx.roundRect(cx,baseY,cw,14,7);ctx.fill();
      ctx.strokeStyle=rgba(c,0.62);ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(cx+0.5,baseY+0.5,cw-1,13,7);ctx.stroke();
      ctx.fillStyle=c;ctx.textAlign='center';ctx.fillText(label,cx+cw/2,baseY+10);ctx.textAlign='left';
      cx+=cw+4;
      if(cx>x+w-metaW-8)break;
    }
  };
  if(threat.isBoss){
    const tags=threatTags.length?threatTags:(threat.isBarrier?[{key:'BARRIER',label:'BARRIER'}]:threat.isAerial?[{key:'AERIAL',label:'AERIAL'}]:[{key:'BOSS',label:'BOSS'}]);
    drawTagChips(tags,y+38);
  }else{
    if(threatTags.length)drawTagChips(threatTags,y+38);
  }
  if(!threat.isBoss&&threat.enemies.length){
    const shown=threat.enemies.slice(0,shownCount);
    ctx.font='900 9.5px Segoe UI, Arial';
    for(let i=0;i<shown.length;i++){
      const en=shown[i],cellX=x+10,baseY=y+(threatTags.length?66:48)+i*16;
      const tag=en.attack||'PHYSICAL',tagColor=threatTagColor(tag,colors);
      ctx.font='900 7.5px Segoe UI, Arial';
      const tagW=Math.max(48,ctx.measureText(tag).width+14);
      ctx.font='900 9.5px Segoe UI, Arial';
      ctx.fillStyle=en.color;ctx.beginPath();ctx.arc(cellX+4,baseY-4,3.5,0,Math.PI*2);ctx.fill();
      let line=en.count+'x '+en.name;
      const maxNameW=Math.max(120,w-tagW-50);
      while(line.length>4&&ctx.measureText(line).width>maxNameW)line=line.slice(0,-1);
      if(line!==en.count+'x '+en.name)line+='...';
      ctx.fillStyle='rgba(246,248,252,0.94)';ctx.textAlign='left';
      ctx.fillText(line,cellX+11,baseY);
      const chipX=x+w-tagW-9;
      ctx.fillStyle=rgba(tagColor,0.22);ctx.beginPath();ctx.roundRect(chipX,baseY-12,tagW,13,7);ctx.fill();
      ctx.strokeStyle=rgba(tagColor,0.58);ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(chipX+0.5,baseY-11.5,tagW-1,12,7);ctx.stroke();
      ctx.fillStyle=tagColor;ctx.textAlign='center';ctx.font='900 7.5px Segoe UI, Arial';
      ctx.fillText(tag,chipX+tagW/2,baseY-3);
      ctx.font='900 9.5px Segoe UI, Arial';ctx.textAlign='left';
    }
  }
  if(view.buildTimerMax>0){
    const ratio=view.buildTimer/view.buildTimerMax;
    const bx=x+8,bw=w-16,by=y+h-4,bh=3;
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.beginPath();ctx.roundRect(bx,by,bw,bh,2);ctx.fill();
    const timerColor=ratio>0.5?'#ffd54a':(ratio>0.25?'#ff9933':'#ff5544');
    if(threat.isBoss){
      const timerG=ctx.createLinearGradient(bx,0,bx+bw,0);
      timerG.addColorStop(0,accent);timerG.addColorStop(0.55,'#ff9f1c');timerG.addColorStop(1,'#ffe66d');
      ctx.fillStyle=timerG;
    }else ctx.fillStyle=timerColor;
    ctx.beginPath();ctx.roundRect(bx,by,Math.max(3,bw*ratio),bh,2);ctx.fill();
  }
  ctx.restore();
  return true;
}

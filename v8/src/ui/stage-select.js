// Campaign stage select screen drawing.

import { fitCanvasText } from '../render/primitives.js';

export function drawStageSelectScreen(ctx,view){
  const W=view.width,H=view.height;
  const maxStage=view.maxStage||1;
  const stageStars=view.stageStars||{};
  const stages=view.stages||[];
  const frame=view.frame||0;
  const scroll=view.scroll||0;
  const labels={
    back:'BACK',
    ellipsis:'...',
    finalBadge:'FINAL *5',
    titanBadge:'TITAN *4',
    majorBadge:'MAJOR *3',
    miniBadge:'BOSS *2',
    ...view.labels
  };

  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#1a0e2a');bg.addColorStop(1,'#06060f');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  const hY=14,hH=58;
  const hg=ctx.createLinearGradient(0,hY,0,hY+hH);
  hg.addColorStop(0,'rgba(40,30,68,0.95)');hg.addColorStop(1,'rgba(20,15,40,0.95)');
  ctx.fillStyle=hg;ctx.beginPath();ctx.roundRect(10,hY,W-20,hH,16);ctx.fill();
  ctx.fillStyle='#9b59b6';ctx.beginPath();ctx.roundRect(10,hY,4,hH,2);ctx.fill();

  view.drawPillBtn(20,hY+hH/2-14,72,28,labels.back,'#3a3a5e','#fff');

  ctx.fillStyle='#888';ctx.font='9px Arial';ctx.textAlign='center';
  ctx.fillText('GAME MODE',W/2,hY+18);
  fitCanvasText(ctx,'CAMPAIGN',W/2,hY+42,Math.max(80,W-210),20,14,'bold','#fff','center');

  ctx.fillStyle='#888';ctx.font='9px Arial';ctx.textAlign='right';
  ctx.fillText('CLEARED',W-24,hY+18);
  ctx.fillStyle='#ffd700';ctx.font='bold 16px Arial';
  ctx.fillText((maxStage-1)+' / 25',W-24,hY+42);

  ctx.textAlign='center';
  let y=hY+hH+14-scroll;
  const actNames=['','THE GARDEN PATH','THE SPICE BAZAAR','THE DESERT CROSSING','THE FROSTBOUND MTNS','THE UNDERWORLD GAUNTLET'];
  const actColors=['','#3aa84e','#cc7a22','#d4a857','#5a8eb8','#9933cc'];
  const stageW=92,stageH=130,stageGap=6;
  const totalW=5*stageW+4*stageGap;
  const startX=(W-totalW)/2;

  for(let act=1;act<=5;act++){
    if(y>40&&y<H-30){
      const ahG=ctx.createLinearGradient(0,y,0,y+30);
      const ar=parseInt(actColors[act].slice(1,3),16),ag=parseInt(actColors[act].slice(3,5),16),ab=parseInt(actColors[act].slice(5,7),16);
      ahG.addColorStop(0,'rgba('+ar+','+ag+','+ab+',0.30)');
      ahG.addColorStop(1,'rgba('+ar+','+ag+','+ab+',0.10)');
      ctx.fillStyle=ahG;
      ctx.beginPath();ctx.roundRect(startX,y,totalW,32,12);ctx.fill();
      ctx.fillStyle=actColors[act];ctx.beginPath();ctx.roundRect(startX,y,4,32,2);ctx.fill();
      ctx.fillStyle=actColors[act];ctx.font='bold 9px Arial';ctx.textAlign='left';
      ctx.fillText('ACT '+act,startX+14,y+13);
      fitCanvasText(ctx,actNames[act],startX+14,y+26,totalW-70,12,9,'bold','#fff','left');
      let actCleared=0;
      for(let i=0;i<5;i++){if((act-1)*5+i+1<maxStage)actCleared++}
      ctx.fillStyle='#aaa';ctx.font='10px Arial';ctx.textAlign='right';
      ctx.fillText(actCleared+'/5',startX+totalW-12,y+20);
    }
    y+=38;
    for(let i=0;i<5;i++){
      const sIdx=(act-1)*5+i;
      const s=stages[sIdx];
      if(!s)continue;
      const sx=startX+i*(stageW+stageGap),sy=y;
      const unlocked=(sIdx+1)<=maxStage;
      const completed=(sIdx+1)<maxStage;
      const isCurrent=(sIdx+1)===maxStage;
      if(sy<40||sy>H-30)continue;

      const tbgG=ctx.createLinearGradient(0,sy,0,sy+stageH);
      if(unlocked){
        if(s.type==='final'){tbgG.addColorStop(0,'#3a0a3a');tbgG.addColorStop(1,'#1a041a')}
        else if(s.type==='vs'){tbgG.addColorStop(0,'#aa3322');tbgG.addColorStop(1,'#5a1a10')}
        else if(s.type==='strong'){tbgG.addColorStop(0,'#aa6622');tbgG.addColorStop(1,'#5a3010')}
        else if(s.type==='mini'){tbgG.addColorStop(0,'#5a3a7a');tbgG.addColorStop(1,'#2a1a3a')}
        else{tbgG.addColorStop(0,'#1c1c2e');tbgG.addColorStop(1,'#0e0e1a')}
      }else{
        tbgG.addColorStop(0,'#0e0e1a');tbgG.addColorStop(1,'#06060f');
      }
      ctx.fillStyle=tbgG;
      ctx.beginPath();ctx.roundRect(sx,sy,stageW,stageH,12);ctx.fill();
      ctx.fillStyle=actColors[act];
      ctx.beginPath();ctx.roundRect(sx,sy,stageW,4,2);ctx.fill();
      if(unlocked){
        const shG=ctx.createLinearGradient(0,sy,0,sy+14);
        shG.addColorStop(0,'rgba(255,255,255,0.10)');shG.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=shG;ctx.beginPath();ctx.roundRect(sx,sy,stageW,14,12);ctx.fill();
      }
      if(isCurrent){
        ctx.shadowColor='#ffd700';ctx.shadowBlur=12+Math.sin(frame*0.08)*4;
        ctx.strokeStyle='#ffd700';ctx.lineWidth=2;
        ctx.beginPath();ctx.roundRect(sx,sy,stageW,stageH,12);ctx.stroke();
        ctx.shadowBlur=0;
      }

      ctx.fillStyle=unlocked?'rgba(255,255,255,0.10)':'rgba(255,255,255,0.04)';
      ctx.beginPath();ctx.arc(sx+stageW/2,sy+38,22,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=unlocked?'#fff':'#444';
      ctx.font='bold 26px Arial';ctx.textAlign='center';
      ctx.fillText(s.n,sx+stageW/2,sy+47);
      const stars=stageStars[s.n]||0;
      ctx.fillStyle=unlocked?(stars>0?'#ffd700':'rgba(255,255,255,0.24)'):'#333';
      ctx.font='bold 10px Arial';
      ctx.fillText(view.starText(stars),sx+stageW/2,sy+63);

      ctx.font='bold 10px Arial';
      ctx.fillStyle=unlocked?'#fff':'#444';
      const maxChars=12;
      const name=s.name||'';
      if(name.length>maxChars){
        const split=name.lastIndexOf(' ',maxChars);
        if(split>0){
          fitCanvasText(ctx,name.substring(0,split),sx+stageW/2,sy+74,stageW-10,10,8,'bold',unlocked?'#fff':'#444','center');
          fitCanvasText(ctx,name.substring(split+1),sx+stageW/2,sy+86,stageW-10,10,8,'bold',unlocked?'#fff':'#444','center');
        }else{
          fitCanvasText(ctx,name.substring(0,maxChars-1)+labels.ellipsis,sx+stageW/2,sy+80,stageW-10,10,8,'bold',unlocked?'#fff':'#444','center');
        }
      }else{
        fitCanvasText(ctx,name,sx+stageW/2,sy+80,stageW-10,10,8,'bold',unlocked?'#fff':'#444','center');
      }

      const wText=s.weather||'clear';
      ctx.font='9px Arial';
      const wW=ctx.measureText(wText).width+10;
      ctx.fillStyle=unlocked?'rgba(255,255,255,0.10)':'rgba(255,255,255,0.04)';
      ctx.beginPath();ctx.roundRect(sx+stageW/2-wW/2,sy+91,wW,11,5);ctx.fill();
      ctx.fillStyle=unlocked?'#aab0c0':'#444';
      ctx.fillText(wText,sx+stageW/2,sy+99);

      let badge='',badgeBorder='#888',badgeText='#888';
      if(s.type==='final'){badge=labels.finalBadge;badgeBorder='#ff0040';badgeText='#ff6080'}
      else if(s.type==='vs'){badge=labels.titanBadge;badgeBorder='#ff4400';badgeText='#ff7a55'}
      else if(s.type==='strong'){badge=labels.majorBadge;badgeBorder='#ff8800';badgeText='#ffaa55'}
      else if(s.type==='mini'){badge=labels.miniBadge;badgeBorder='#aa66cc';badgeText='#cc99ff'}
      if(badge&&unlocked){
        const bdW=stageW-10,bdX=sx+5,bdY=sy+stageH-18;
        ctx.fillStyle='rgba(0,0,0,0.55)';
        ctx.beginPath();ctx.roundRect(bdX,bdY,bdW,14,7);ctx.fill();
        ctx.strokeStyle=badgeBorder;ctx.lineWidth=1;
        ctx.beginPath();ctx.roundRect(bdX+0.5,bdY+0.5,bdW-1,13,7);ctx.stroke();
        ctx.fillStyle=badgeText;ctx.font='bold 8px Arial';
        ctx.fillText(badge,sx+stageW/2,bdY+10);
      }else if(badge){
        const bdW=stageW-10,bdX=sx+5,bdY=sy+stageH-18;
        ctx.strokeStyle='rgba(80,80,90,0.5)';ctx.lineWidth=1;
        ctx.beginPath();ctx.roundRect(bdX+0.5,bdY+0.5,bdW-1,13,7);ctx.stroke();
        ctx.fillStyle='#555';ctx.font='bold 8px Arial';
        ctx.fillText(badge,sx+stageW/2,bdY+10);
      }

      if(completed){
        ctx.fillStyle='#3aa84e';ctx.beginPath();ctx.arc(sx+stageW-13,sy+15,9,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(sx+stageW-13,sy+15,9,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(sx+stageW-17,sy+15);ctx.lineTo(sx+stageW-14,sy+18);ctx.lineTo(sx+stageW-9,sy+12);ctx.stroke();
        ctx.lineCap='butt';
      }
      if(!unlocked){
        ctx.fillStyle='rgba(6,6,15,0.65)';
        ctx.beginPath();ctx.roundRect(sx,sy,stageW,stageH,12);ctx.fill();
        const lcX=sx+stageW/2,lcY=sy+stageH/2-4;
        ctx.fillStyle='#666';
        ctx.beginPath();ctx.roundRect(lcX-10,lcY,20,16,3);ctx.fill();
        ctx.strokeStyle='#666';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(lcX,lcY,7,Math.PI,2*Math.PI);ctx.stroke();
        ctx.fillStyle='#888';ctx.font='bold 9px Arial';
        ctx.fillText('LOCKED',sx+stageW/2,sy+stageH/2+22);
      }
    }
    y+=stageH+12;
  }
  ctx.textAlign='left';
}

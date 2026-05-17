// Shared transient visual effect renderers for v8.

export function drawBeamEffects(ctx,view){
  const beams=view.beams||[];
  const randomRange=view.randomRange||((a,b)=>a+Math.random()*(b-a));
  for(let i=beams.length-1;i>=0;i--){
    const b=beams[i];b.life--;
    if(b.life<=0){beams.splice(i,1);continue}
    const alpha=b.life/b.maxLife;
    ctx.save();ctx.strokeStyle=b.color;ctx.lineWidth=b.width||2;
    if(b.straight){
      ctx.globalAlpha=alpha*0.7;ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.lineTo(b.x2,b.y2);ctx.stroke();
      ctx.globalAlpha=alpha*0.2;ctx.lineWidth=(b.width||2)+6;ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.lineTo(b.x2,b.y2);ctx.stroke();
    }else{
      ctx.globalAlpha=alpha*0.6;ctx.beginPath();ctx.moveTo(b.x1,b.y1);
      const segs=5;
      for(let j=1;j<segs;j++){const f=j/segs;const mx=b.x1+(b.x2-b.x1)*f;const my=b.y1+(b.y2-b.y1)*f;const off=(j%2===0?1:-1)*randomRange(3,8)*alpha;ctx.lineTo(mx+off,my+off)}
      ctx.lineTo(b.x2,b.y2);ctx.stroke();
      ctx.globalAlpha=alpha*0.2;ctx.lineWidth=(b.width||2)+4;ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawParticleEffects(ctx,view){
  const particles=view.particles||[];
  for(const p of particles){
    ctx.globalAlpha=p.life;
    ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
}

export function drawFloatingNumbers(ctx,view){
  const damageNumbers=view.damageNumbers||[];
  const healingNumbers=view.healingNumbers||[];
  ctx.save();
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  for(const d of damageNumbers){
    const item=formatFloatingLabel(d.val);
    drawFloatingBadge(ctx,{
      x:d.x,y:d.y,text:item.text,color:d.color||item.color||'#ffffff',
      alpha:d.life,size:d.sz||item.size||12,bold:d.bold||item.bold,
      numeric:item.numeric,outline:d.outline
    });
  }
  for(const h of healingNumbers){
    const healVal=Math.round(Number(h.val)||0);
    if(!Number.isFinite(healVal)||healVal<=2)continue;
    drawFloatingBadge(ctx,{
      x:h.x,y:h.y,text:'+'+compactNumber(healVal),color:h.big?'#5dff91':'#9effb8',
      alpha:h.life,size:h.big?14:12,bold:h.big,numeric:true,heal:true
    });
  }
  ctx.restore();
}

function drawFloatingBadge(ctx,view){
  const alpha=Math.max(0,Math.min(1,view.alpha==null?1:view.alpha));
  if(alpha<=0)return;
  const size=Math.max(10,Math.min(view.size||12,view.numeric?15:13));
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.font=(view.bold?'900':'800')+' '+size+'px Arial';
  const text=String(view.text||'');
  if(!text){ctx.restore();return}
  const pad=view.numeric?7:8;
  const w=Math.min(118,Math.max(22,ctx.measureText(text).width+pad*2));
  const h=size+8;
  const x=view.x,y=view.y;
  ctx.shadowColor=view.color;
  ctx.shadowBlur=view.bold?8:4;
  ctx.fillStyle=view.heal?'rgba(5,35,18,0.78)':'rgba(8,10,18,0.78)';
  ctx.beginPath();ctx.roundRect(x-w/2,y-h/2,w,h,7);ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle=view.outline||view.color;
  ctx.lineWidth=view.bold?1.4:1;
  ctx.globalAlpha=alpha*(view.bold?0.86:0.62);
  ctx.beginPath();ctx.roundRect(x-w/2+0.5,y-h/2+0.5,w-1,h-1,7);ctx.stroke();
  ctx.globalAlpha=alpha;
  ctx.fillStyle=view.color;
  ctx.fillText(text,x,y+0.5);
  ctx.restore();
}

function formatFloatingLabel(value){
  if(typeof value==='number'){
    if(!Number.isFinite(value)||Math.round(value)<=2)return {text:'',numeric:true,size:12};
    return {text:'-'+compactNumber(value),numeric:true,size:12};
  }
  let text=String(value==null?'':value).trim();
  text=text.replace(/[!]+/g,'').replace(/\s+/g,' ');
  if(!text)return {text:'',numeric:false,size:11};
  if(/\bNaN\b/i.test(text))return {text:'',numeric:false,size:11};
  if(/^[-+]?\d+\s+(GUARD|BLOOD|ABSORBED|PACT|MUD|SHIELD)$/i.test(text))return {text:'',numeric:false,size:11};
  const gold=text.match(/^\+?(\d+)g$/i);
  if(gold)return {text:'+'+compactNumber(gold[1])+'g',numeric:true,color:'#ffd76a',size:12};
  const signed=text.match(/^([+-]?\d+)/);
  if(signed){
    const n=Math.abs(parseInt(signed[1],10)||0);
    if(n<=2)return {text:'',numeric:true,size:12};
    const sign=signed[1][0]==='+'?'+':'-';
    return {text:sign+compactNumber(n),numeric:true,size:12};
  }
  const upper=text.toUpperCase();
  const short=statusShortLabel(upper);
  if(short)return {text:short,numeric:false,bold:true,size:11};
  return {text:toTitleLabel(text),numeric:false,bold:false,size:11};
}

function statusShortLabel(upper){
  if(upper.includes('SHIELD BREAK')||upper.includes('CARAPACE BROKEN'))return 'Break';
  if(upper.includes('INVUL')||upper.includes('IMMUNE'))return 'Immune';
  if(upper.includes('BLOCK'))return 'Block';
  if(upper.includes('RESIST')||upper.includes('WARDED'))return 'Resist';
  if(upper.includes('ABSORB')||upper.includes('GUARD')||upper.includes('BLOOD'))return null;
  if(upper.includes('CRIT'))return 'Crit';
  if(upper.includes('STUN'))return 'Stun';
  if(upper.includes('SAVED')||upper.includes('CHEAT DEATH'))return 'Saved';
  if(upper.includes('SHIELD'))return 'Shield';
  return null;
}

function toTitleLabel(text){
  const cleaned=text
    .replace(/\b(OF|THE|AND|TO|YOUR)\b/gi,'')
    .replace(/\s+/g,' ')
    .trim();
  const words=cleaned.split(' ').slice(0,2).join(' ');
  const label=words||cleaned||text;
  return label.toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase()).slice(0,14);
}

function compactNumber(value){
  const n=Math.max(0,Math.round(Number(value)||0));
  if(n>=1000)return (n/1000).toFixed(n>=10000?0:1).replace(/\.0$/,'')+'k';
  return String(n);
}

export function drawFlashText(ctx,view){
  const timer=view.timer||0;
  if(timer<=0)return;
  const alpha=Math.min(1,timer/20);
  const flashY=view.anchorY;
  const width=view.width;
  ctx.save();
  ctx.globalAlpha=alpha*0.7;
  ctx.fillStyle='rgba(0,0,0,0.55)';
  const rw=Math.min(width-20,280);
  ctx.beginPath();ctx.roundRect(width/2-rw/2,flashY-14,rw,28,8);ctx.fill();
  ctx.globalAlpha=alpha;
  ctx.fillStyle=view.color;ctx.font='bold 15px Arial';ctx.textAlign='center';
  ctx.fillText(view.text,width/2,flashY+5);
  ctx.restore();
}

export function drawSignatureBanner(ctx,view){
  const banner=view.banner;
  if(!banner||banner.life<=0)return banner||null;
  banner.life--;
  const t=banner.life/banner.maxLife;
  const fadeIn=Math.min(1,(1-t)*5);
  const fadeOut=Math.min(1,t*4);
  const alpha=Math.min(fadeIn,fadeOut);
  const banY=view.anchorY;
  const width=view.width;
  ctx.save();ctx.globalAlpha=alpha*0.7;
  ctx.fillStyle='rgba(0,0,0,0.75)';
  const bw=280,bh=44;
  ctx.beginPath();
  ctx.roundRect(width/2-bw/2,banY-bh/2,bw,bh,8);
  ctx.fill();
  ctx.strokeStyle=banner.color;ctx.lineWidth=2;ctx.globalAlpha=alpha*0.9;
  ctx.beginPath();ctx.roundRect(width/2-bw/2,banY-bh/2,bw,bh,8);ctx.stroke();
  ctx.globalAlpha=alpha;
  ctx.fillStyle=banner.color;ctx.font='bold 16px Arial';ctx.textAlign='center';
  ctx.shadowColor=banner.color;ctx.shadowBlur=8;
  ctx.fillText(banner.text,width/2,banY+2);
  ctx.shadowBlur=0;
  ctx.fillStyle='#cccccc';ctx.font='9px Arial';
  ctx.fillText(banner.unit,width/2,banY+16);
  ctx.restore();ctx.textAlign='left';
  return banner.life<=0?null:banner;
}

export function drawEffects(ctx,view){
  if(view.beams)drawBeamEffects(ctx,{beams:view.beams,randomRange:view.randomRange});
  if(view.particles)drawParticleEffects(ctx,{particles:view.particles});
  if(view.damageNumbers||view.healingNumbers)drawFloatingNumbers(ctx,{damageNumbers:view.damageNumbers,healingNumbers:view.healingNumbers});
  if(view.flash)drawFlashText(ctx,view.flash);
  return view.signatureBanner?drawSignatureBanner(ctx,view.signatureBanner):view.signatureBanner;
}

// Weather particle setup and overlay drawing.

export function createWeatherParticles(weather,width,height,randomRange){
  const particles={raindrops:[],snowflakes:[],fogParticles:[],sandParticles:[]};
  const rnd=typeof randomRange==='function'?randomRange:((a,b)=>a+Math.random()*(b-a));
  if(weather==='rain'||weather==='storm'){
    for(let i=0;i<60;i++){
      particles.raindrops.push({x:Math.random()*width,y:Math.random()*height,vy:8+Math.random()*4});
    }
  }
  if(weather==='snow'||weather==='blizzard'){
    for(let i=0;i<50;i++){
      particles.snowflakes.push({x:Math.random()*width,y:Math.random()*height,vx:rnd(-1,1),vy:1+Math.random()*1.5,sz:2+Math.random()*2});
    }
  }
  return particles;
}

function ensureAstralRain(particles,width,height){
  if(!particles)return;
  if(!Array.isArray(particles.raindrops))particles.raindrops=[];
  while(particles.raindrops.length<36){
    particles.raindrops.push({x:Math.random()*width,y:Math.random()*height,vy:5+Math.random()*3,astral:true});
  }
}

function makeLightningForks(width,arenaTop,arenaBot){
  const forks=[];
  const count=1+Math.floor(Math.random()*2);
  for(let i=0;i<count;i++){
    const x=width*(0.18+Math.random()*0.64);
    const top=arenaTop+12+Math.random()*42;
    const len=90+Math.random()*120;
    const pts=[];
    let px=x,py=top;
    pts.push({x:px,y:py});
    for(let s=0;s<5;s++){
      px+=-22+Math.random()*44;
      py+=len/5;
      pts.push({x:px,y:Math.min(arenaBot-80,py)});
    }
    forks.push(pts);
  }
  return forks;
}

function drawAstralStorm(ctx,view){
  const storm=view.astralStorm;
  if(!storm||!storm.active)return;
  const boss=view.bossRef;
  if(storm.bossId!=null&&(!boss||boss.hp<=0||boss.id!==storm.bossId)){
    storm.active=false;
    return;
  }
  const {width,height,arenaTop,arenaBot,frame}=view;
  const particles=view.particles||{};
  ensureAstralRain(particles,width,height);

  ctx.save();
  ctx.fillStyle='rgba(5,10,38,0.16)';
  ctx.fillRect(0,arenaTop,width,arenaBot-arenaTop);
  ctx.strokeStyle='rgba(155,205,255,0.33)';
  ctx.lineWidth=1;
  for(const r of particles.raindrops||[]){
    if(!r.astral)continue;
    ctx.beginPath();
    ctx.moveTo(r.x,r.y);
    ctx.lineTo(r.x-2,r.y+10);
    ctx.stroke();
    r.y+=r.vy;
    if(r.y>height){
      r.y=arenaTop-10;
      r.x=Math.random()*width;
    }
  }

  if(Number.isFinite(frame)&&frame>=(storm.nextThunderFrame||0)){
    storm.flashTimer=10;
    storm.flashMax=10;
    storm.nextThunderFrame=frame+600+Math.round(Math.random()*120);
    storm.forks=makeLightningForks(width,arenaTop,arenaBot);
  }
  if(storm.flashTimer>0){
    const t=storm.flashTimer/Math.max(1,storm.flashMax||10);
    const flicker=(storm.flashTimer>6||storm.flashTimer<4)?1:0.35;
    ctx.fillStyle='rgba(160,205,255,'+(0.12*t*flicker).toFixed(3)+')';
    ctx.fillRect(0,arenaTop,width,arenaBot-arenaTop);
    ctx.strokeStyle='rgba(210,235,255,'+(0.75*t).toFixed(3)+')';
    ctx.lineWidth=2;
    for(const fork of storm.forks||[]){
      ctx.beginPath();
      for(let i=0;i<fork.length;i++){
        const p=fork[i];
        if(i===0)ctx.moveTo(p.x,p.y);
        else ctx.lineTo(p.x,p.y);
      }
      ctx.stroke();
    }
    storm.flashTimer--;
  }
  ctx.restore();
}

export function drawWeatherOverlay(ctx,view){
  const weather=view.weather;
  if(!weather)return;
  const {width,height,arenaTop,arenaBot}=view;
  const particles=view.particles||{};

  if(weather==='night'){
    ctx.fillStyle='rgba(8,12,40,0.55)';
    ctx.fillRect(0,arenaTop,width,arenaBot-arenaTop);
  }
  if(weather==='sunset'){
    ctx.fillStyle='rgba(220,80,40,0.18)';
    ctx.fillRect(0,arenaTop,width,arenaBot-arenaTop);
  }
  if(weather==='morning'){
    ctx.fillStyle='rgba(255,200,120,0.12)';
    ctx.fillRect(0,arenaTop,width,arenaBot-arenaTop);
  }
  if(weather==='magma'){
    ctx.fillStyle='rgba(180,40,20,0.18)';
    ctx.fillRect(0,arenaTop,width,arenaBot-arenaTop);
  }

  if(weather==='rain'||weather==='storm'){
    ctx.strokeStyle='rgba(160,200,255,0.5)';
    ctx.lineWidth=1;
    for(const r of (particles.raindrops||[])){
      ctx.beginPath();
      ctx.moveTo(r.x,r.y);
      ctx.lineTo(r.x-2,r.y+12);
      ctx.stroke();
      r.y+=r.vy;
      if(r.y>height){
        r.y=-10;
        r.x=Math.random()*width;
      }
    }
  }

  if(weather==='blizzard'){
    ctx.fillStyle='rgba(200,220,255,0.06)';
    ctx.fillRect(0,arenaTop,width,arenaBot-arenaTop);
  }
  if(weather==='sandstorm'){
    ctx.fillStyle='rgba(212,168,87,0.06)';
    ctx.fillRect(0,arenaTop,width,arenaBot-arenaTop);
  }
  drawAstralStorm(ctx,view);
}

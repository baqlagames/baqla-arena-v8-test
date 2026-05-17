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
}

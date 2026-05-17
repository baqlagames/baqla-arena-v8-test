// Battle HUD overlay composition and spell button hit rectangles.

export function drawBattleHudOverlay(ctx,view){
  const W=view.width,H=view.height;
  const stage=view.stage||{n:'',name:''};
  const selectedSpells=view.selectedSpells||[];
  const abilities=view.abilities||[];
  const cooldowns=view.abilityCooldowns||[];
  const used=view.abilityUsed||[];
  const gold=view.gold||0;
  const abilityTargeting=view.abilityTargeting??-1;
  const labels={
    spellIcon:'*',
    stageSeparator:' - ',
    bossWarning:'BOSS APPROACHING',
    crystalRegen:'CRYSTALS REGEN x2',
    ...view.labels
  };
  const tickHz=view.tickHz||60;
  const cooldownTickHz=view.cooldownTickHz||60;
  let nextBossWarning=view.bossWarning||0;
  const spellBtnRects=[];

  if(view.showStageLabel){
    ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(W/2-90,56,180,14);
    ctx.fillStyle='#fff';ctx.font='bold 9px Arial';ctx.textAlign='center';
    ctx.fillText('STAGE '+stage.n+labels.stageSeparator+String(stage.name||'').toUpperCase(),W/2,67);
    ctx.textAlign='left';
  }

  if(view.showSpellButtons!==false){
    const bottomHudTop=H-86;
    const slotCount=Math.max(1,selectedSpells.length);
    const gap=4;
    const sh=slotCount===1?54:42;
    const sw=54;
    const rowY=bottomHudTop-(slotCount*sh+(slotCount-1)*gap)-8;
    for(let i=0;i<slotCount;i++){
      if(selectedSpells[i]==null)continue;
      const ab=abilities[selectedSpells[i]];
      if(!ab)continue;
      const sx=8,sy=rowY+i*(sh+gap);
      const cooldown=cooldowns[i]||0;
      const isUsed=!!used[i];
      const cost=ab.cost||0;
      const canAfford=gold>=cost;
      spellBtnRects.push({x:sx,y:sy,w:sw,h:sh});
      ctx.fillStyle=isUsed?'#232332':(!canAfford?'#3a2630':(cooldown>0?'#1a1a2e':ab.color));
      ctx.beginPath();ctx.roundRect(sx,sy,sw,sh,7);ctx.fill();
      ctx.strokeStyle=abilityTargeting===i?'#ffd700':'rgba(255,255,255,0.4)';
      ctx.lineWidth=abilityTargeting===i?3:1.5;
      ctx.beginPath();ctx.roundRect(sx,sy,sw,sh,7);ctx.stroke();
      ctx.fillStyle=isUsed?'#9aa0aa':'#fff';ctx.font='bold 16px Arial';ctx.textAlign='center';
      ctx.fillText(labels.spellIcon,sx+sw/2,sy+22);
      ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(sx,sy+sh-11,sw,11);
      ctx.fillStyle=isUsed?'#c3c6cf':(canAfford?'#fff':'#ffb0a6');ctx.font='bold 7px Arial';
      ctx.fillText(isUsed?'USED':(cost+'g'),sx+sw/2,sy+sh-3);
      if(isUsed){
        ctx.fillStyle='rgba(0,0,0,0.68)';ctx.beginPath();ctx.roundRect(sx,sy,sw,sh,7);ctx.fill();
        ctx.fillStyle='#c3c6cf';ctx.font='bold 10px Arial';ctx.textAlign='center';
        ctx.fillText('USED',sx+sw/2,sy+sh/2+4);
      }else if(cooldown>0){
        ctx.fillStyle='rgba(0,0,0,0.7)';ctx.beginPath();ctx.roundRect(sx,sy,sw,sh,7);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.18)';
        ctx.beginPath();ctx.moveTo(sx+sw/2,sy+sh/2);
        ctx.arc(sx+sw/2,sy+sh/2,sw/2,-Math.PI/2,-Math.PI/2+(cooldown/(ab.cooldown||1))*Math.PI*2);
        ctx.closePath();ctx.fill();
        ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.textAlign='center';
        ctx.fillText(Math.ceil(cooldown/cooldownTickHz)+'s',sx+sw/2,sy+sh/2+5);
      }
      ctx.textAlign='left';
    }
  }

  if(nextBossWarning>0){
    ctx.fillStyle='rgba(170,40,40,0.5)';ctx.fillRect(0,H/2-30,W,60);
    ctx.fillStyle='#fff';ctx.font='bold 20px Arial';ctx.textAlign='center';
    ctx.fillText(labels.bossWarning,W/2,H/2+8);
    nextBossWarning--;
  }

  if(view.stageStartTimer>0){
    const sec=Math.ceil(view.stageStartTimer/tickHz);
    ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(W/2-60,H/2-40,120,80);
    ctx.fillStyle='#ffd700';ctx.font='bold 64px Arial';ctx.textAlign='center';
    ctx.fillText(sec,W/2,H/2+22);
    ctx.font='bold 11px Arial';ctx.fillStyle='#aaffaa';
    ctx.fillText(labels.crystalRegen,W/2,H/2+40);
  }
  ctx.textAlign='left';
  return {spellBtnRects,bossWarning:Math.max(0,nextBossWarning)};
}

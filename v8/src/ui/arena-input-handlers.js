import { resolveBattleChromeAction, resolvePauseOverlayAction } from './battle-input.js';
import { resolveCodexClick } from './codex-input.js';
import { nextScrollValue, resolveScrollTarget } from './scroll-routing.js';

export function createArenaInputHandlers(deps){
  function onMenuClick(p){
    const v=deps.view();
    const btnY=Math.max(v.H*0.62,v.H-230);
    if(deps.inRect(p,v.W/2-130,btnY,260,56)){deps.setScreen('stageSelect');deps.setStageSelectScroll(0);return}
    if(deps.inRect(p,v.W/2-130,btnY+70,260,46)){deps.setCodexOpen(true);deps.setCodexUnit(-1);deps.setCodexScroll(0);return}
  }
  function onStageSelectClick(p){
    const v=deps.view();
    if(deps.inRect(p,20,29,72,28)){deps.setScreen('menu');return}
    const stageW=92,stageH=130,stageGap=6;
    const totalW=5*stageW+4*stageGap;
    const startX=(v.W-totalW)/2;
    let y=14+58+14-v.stageSelectScroll;
    for(let act=1;act<=5;act++){
      y+=38;
      for(let i=0;i<5;i++){
        const sIdx=(act-1)*5+i;
        const sx=startX+i*(stageW+stageGap),sy=y;
        const unlocked=(sIdx+1)<=v.maxStage;
        if(unlocked&&deps.inRect(p,sx,sy,stageW,stageH)){
          deps.setCurrentStageIdx(sIdx);deps.setCurrentStage(deps.stages[sIdx]);
          deps.setScreen('stageBrief');
          return;
        }
      }
      y+=stageH+12;
    }
  }
  function onStageBriefClick(p){
    const v=deps.view();
    if(deps.inRect(p,20,29,72,28)){deps.setScreen('stageSelect');return}
    if(deps.inRect(p,v.W/2-120,v.H-118,240,50)){
      const need=v.currentStage&&v.currentStage.n<=10?1:2;
      deps.setSpellPickStage([...v.selectedSpells].slice(0,need));
      deps.setSpellPickScroll(0);
      deps.setScreen('spellPick');
      deps.saveSave();
      return;
    }
  }
  function onDeckPickClick(p){
    const v=deps.view();
    if(deps.inRect(p,14,18,80,28)){deps.setScreen('stageSelect');return}
    if(v.deckPickStage.length===6&&deps.inRect(p,v.W-104,18,94,28)){
      deps.setSelectedDeck([...v.deckPickStage]);
      const need=v.currentStage&&v.currentStage.n<=10?1:2;
      deps.setSpellPickStage([...v.selectedSpells].slice(0,need));
      deps.setScreen('spellPick');deps.setSpellPickScroll(0);deps.saveSave();return;
    }
    const cols=3,cw=148,ch=160;
    const totalW=cols*cw+(cols-1)*8;
    const startX=(v.W-totalW)/2;
    let y=72-v.deckPickScroll;
    for(let i=0;i<deps.playerUnits.length;i++){
      const c=i%cols,r=Math.floor(i/cols);
      const cx=startX+c*(cw+8),cy=y+r*(ch+8);
      if(deps.inRect(p,cx,cy,cw,ch)){
        const idx=v.deckPickStage.indexOf(i);
        if(idx>=0)v.deckPickStage.splice(idx,1);
        else if(v.deckPickStage.length<6)v.deckPickStage.push(i);
        return;
      }
    }
  }
  function onSpellPickClick(p){
    const v=deps.view();
    if(deps.inRect(p,14,18,80,28)){deps.setScreen('stageBrief');return}
    const need=v.currentStage&&v.currentStage.n<=10?1:2;
    if(v.spellPickStage.length===need&&deps.inRect(p,v.W-104,18,94,28)){
      deps.setSelectedSpells([...v.spellPickStage]);
      deps.setPerkPickScroll(0);
      deps.setScreen('perkPick');
      deps.saveSave();
      return
    }
    const cw=v.W-32,ch=120,startX=16;
    let y=72-v.spellPickScroll;
    for(let i=0;i<deps.abilities.length;i++){
      const cx=startX,cy=y+i*(ch+8);
      if(deps.inRect(p,cx,cy,cw,ch)){
        const idx=v.spellPickStage.indexOf(i);
        if(idx>=0)v.spellPickStage.splice(idx,1);
        else if(v.spellPickStage.length<need)v.spellPickStage.push(i);
        return;
      }
    }
  }
  function onPerkPickClick(p){
    const v=deps.view();
    if(deps.inRect(p,14,18,80,28)){deps.setScreen('spellPick');return}
    if(v.selectedPerks.length>0&&deps.inRect(p,v.W-104,18,94,28)){
      deps.saveSave();
      deps.startStage(v.currentStageIdx);
      return;
    }
    const cardW=v.W-32,cardH=112,startX=16;
    let y=76-v.perkPickScroll;
    for(const perk of deps.perks){
      if(deps.inRect(p,startX,y,cardW,cardH)){
        if(!v.unlockedPerks.includes(perk.id))deps.unlockPerk(perk.id);
        else deps.togglePerk(perk.id);
        return;
      }
      y+=cardH+10;
    }
  }
  function onResultClick(p){
    const v=deps.view();
    const rects=deps.resultButtonRects();
    if(rects.ad&&deps.inRect(p,rects.ad.x,rects.ad.y,rects.ad.w,rects.ad.h)){
      if(v.state==='win')deps.claimDoubleBeansReward();
      else deps.claimSecondChanceRetry();
      return;
    }
    if(deps.inRect(p,rects.primary.x,rects.primary.y,rects.primary.w,rects.primary.h)){
      if(v.state==='win'){
        if(v.arena.resultView!=='stars'){
          v.arena.resultView='stars';
          v.arena.starRevealStart=v.frame;
          v.arena.starBurstDone={};
          deps.levelUpSound();
          return;
        }
        if(v.currentStageIdx<24){
          const nextIdx=v.currentStageIdx+1;
          deps.setCurrentStageIdx(nextIdx);deps.setCurrentStage(deps.stages[nextIdx]);deps.setScreen('stageBrief');
        }else deps.setScreen('stageSelect');
      }else{
        v.arena.cells={};
        deps.startStage(v.currentStageIdx);
      }
      return;
    }
    if(deps.inRect(p,rects.secondary.x,rects.secondary.y,rects.secondary.w,rects.secondary.h)){
      deps.setScreen('stageSelect');return;
    }
  }
  function onArenaClick(p){
    const v=deps.view();
    if(v.state==='battle'){
      const pauseAction=resolvePauseOverlayAction(p,v.arena);
      if(pauseAction.type==='resume'){v.arena.pauseMenu=false;return}
      if(pauseAction.type==='restart'){v.arena.pauseMenu=false;deps.startStage(v.currentStageIdx);return}
      if(pauseAction.type==='quit'){v.arena.pauseMenu=false;deps.setScreen('stageSelect');deps.setStageSelectScroll(0);return}
      if(pauseAction.type==='sound'){deps.toggleSound();return}
      if(pauseAction.type==='blocked')return;

      const chromeAction=resolveBattleChromeAction(p,v.arena);
      if(chromeAction.type==='arenaViewToggle'){if(deps.toggleArenaViewMode)deps.toggleArenaViewMode();return}
      if(chromeAction.type==='pause'){v.arena.pauseMenu=true;return}
      if(chromeAction.type==='picker')return deps.handlePickerClick(p);
      if(chromeAction.type==='manage')return deps.handleManagePanelClick(p);
      if(chromeAction.type==='spell'){deps.handleSpellButton(chromeAction.idx);return}
      if(chromeAction.type==='bloodlust'){deps.activateBloodlust();return}
      if(chromeAction.type==='tranquility'){deps.activateTranquility();return}
      if(chromeAction.type==='startWave'){
        const bonus=Math.floor(v.arena.buildTimer/deps.tickHz);
        if(bonus>0){deps.addGold(bonus);deps.showFlash('+'+bonus+'g  early start','#ffd700',60)}
        v.arena.buildTimer=0;
        return;
      }
      if(v.abilityTargeting>=0){
        const targetPoint=deps.screenToWorldPoint?deps.screenToWorldPoint(p):p;
        deps.castAbilityAt(v.abilityTargeting,targetPoint.x,targetPoint.y);
        return;
      }
      if(v.arena.phase==='build'){
        const cell=deps.xyToCell(p.x,p.y);
        if(cell){
          const existing=v.arena.cells[cell.key];
          if(existing){v.arena.managePanelCell=cell;v.arena._mgrScroll=0;v.arena._mgrSelectedSpec=null}
          else{v.arena.pickerOpen=true;v.arena.pickerCell=cell;v.arena.pickerScroll=0}
          return;
        }
      }
    }
    if(deps.dist(p,v.heroButton)<v.heroButton.r){
      if(!v.vodkaUnit&&!v.vodkaDead&&v.vodkaDeployCD<=0)deps.deployVodka();
      return;
    }
    if(v.selectedCard>=0){
      const upBtn=deps.upgradeBtnRect(v.selectedCard);
      if(upBtn&&deps.inRect(p,upBtn.x,upBtn.y,upBtn.w,upBtn.h)){deps.tryUpgradeUnit(v.selectedCard);return}
    }
    const layout=deps.cardRowLayout();
    for(let i=0;i<layout.cardCount;i++){
      const cx=layout.startX+i*(layout.cw+layout.gap),cy=layout.rowY+18;
      if(deps.inRect(p,cx,cy,layout.cw,layout.ch)){
        const cardIdx=v.state==='battle'?v.cardHand[i]:i;
        if(cardIdx==null)return;
        deps.setSelectedCard(v.selectedCard===cardIdx?-1:cardIdx);
        return;
      }
    }
    if(v.selectedCard>=0&&p.x>=deps.arenaBounds.left&&p.x<=deps.arenaBounds.right&&p.y>=deps.arenaBounds.deployTop&&p.y<=deps.arenaBounds.bottom){
      const deployPoint=deps.screenToWorldPoint?deps.screenToWorldPoint(p):p;
      if(deps.deployUnit(v.selectedCard,deployPoint.x,deployPoint.y))deps.setSelectedCard(-1);
    }
  }
  function onCodexClick(p){
    const v=deps.view();
    const action=resolveCodexClick(p,{
      width:v.W,
      height:v.H,
      codexUnit:v.codexUnit,
      codexScroll:v.codexScroll,
      unitCount:deps.playerUnits.length,
      backY:v.arena._codexBackY
    });
    if(action.type==='close'){deps.setCodexOpen(false);deps.setCodexUnit(-1);return}
    if(action.type==='open'){deps.setCodexUnit(action.codexUnit);return}
    if(action.type==='backToList'){deps.setCodexUnit(-1);return}
  }
  function handleClickPoint(p){
    const v=deps.view();
    if(v.codexOpen){onCodexClick(p);return}
    if(v.state==='menu'){onMenuClick(p);return}
    if(v.state==='stageSelect'){onStageSelectClick(p);return}
    if(v.state==='stageBrief'){onStageBriefClick(p);return}
    if(v.state==='deckPick'){onDeckPickClick(p);return}
    if(v.state==='spellPick'){onSpellPickClick(p);return}
    if(v.state==='perkPick'){onPerkPickClick(p);return}
    if(v.state==='win'||v.state==='lose'){onResultClick(p);return}
    if(v.state==='battle'){onArenaClick(p)}
  }
  function handleWheel(e){
    const v=deps.view();
    const target=resolveScrollTarget({codexOpen:v.codexOpen,codexUnit:v.codexUnit,arenaState:v.arena,screenState:v.state});
    if(target.type==='none')return;
    deps.setScrollValueForTarget(target,nextScrollValue(deps.scrollValueForTarget(target),e.deltaY,deps.scrollMaxForTarget(target),0.5));
    e.preventDefault();
  }
  function handleTouchStart(e){
    if(e.touches.length){deps.setTouchStartY(e.touches[0].clientY);deps.setTouchAccumY(0)}
  }
  function handleTouchMove(e){
    if(!e.touches.length)return;
    const v=deps.view();
    const dy=deps.touchStartY()-e.touches[0].clientY;
    const target=resolveScrollTarget({codexOpen:v.codexOpen,codexUnit:v.codexUnit,arenaState:v.arena,screenState:v.state});
    if(target.type!=='none'){
      deps.setScrollValueForTarget(target,nextScrollValue(deps.scrollValueForTarget(target),dy,deps.scrollMaxForTarget(target),0.8));
      if(target.type==='managePanel'||target.type==='unitPicker')deps.setTouchAccumY(deps.touchAccumY()+Math.abs(dy));
    }
    deps.setTouchStartY(e.touches[0].clientY);
  }
  return {handleClickPoint,handleWheel,handleTouchStart,handleTouchMove};
}

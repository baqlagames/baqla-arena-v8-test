import { readSave, writeSave } from '../core/save.js';
import { STAGES } from '../data/stages.js';
import { normalizeSelectedPerks, normalizeUnlockedPerks } from './perks.js';

export function normalizeFoughtBosses(raw, view = {}) {
  const ids = new Set();
  const add = value => {
    const id = Number(value);
    if (Number.isFinite(id) && id >= 0) ids.add(Math.floor(id));
  };
  if (Array.isArray(raw)) for (const id of raw) add(id);
  if (Array.isArray(view.defeatedBosses)) for (const id of view.defeatedBosses) add(id);
  const stageStars = view.stageStars && typeof view.stageStars === 'object' ? view.stageStars : {};
  const maxStage = Number.isFinite(view.maxStage) ? view.maxStage : 1;
  for (const stage of STAGES) {
    if (!stage || stage.bossId == null) continue;
    const clearedByStars = Number(stageStars[stage.n]) > 0;
    const clearedByUnlock = maxStage > (stage.n || 0);
    if (clearedByStars || clearedByUnlock) add(stage.bossId);
  }
  return [...ids].sort((a, b) => a - b);
}

export const normalizeDefeatedBosses = normalizeFoughtBosses;

export function normalizeProgress(raw, options){
  const opts=options||{};
  const progress={
    maxStage: opts.maxStage==null?1:opts.maxStage,
    stageStars: opts.stageStars||{},
    selectedDeck: Array.isArray(opts.selectedDeck)?[...opts.selectedDeck]:[0,1,2,3,4,5],
    selectedSpells: Array.isArray(opts.selectedSpells)?[...opts.selectedSpells]:[0,1],
    beans: Math.max(0, Math.floor(opts.beans || 0)),
    unlockedPerks: normalizeUnlockedPerks(opts.unlockedPerks),
    selectedPerks: normalizeSelectedPerks(opts.selectedPerks, opts.unlockedPerks, opts.maxStage || 1),
    foughtBosses: normalizeFoughtBosses(opts.foughtBosses, {
      defeatedBosses: opts.defeatedBosses,
      stageStars: opts.stageStars,
      maxStage: opts.maxStage || 1
    })
  };
  const unitCount=opts.unitCount||0;
  const s=raw||{};
  if(s.maxStage)progress.maxStage=s.maxStage;
  if(s.stageStars&&typeof s.stageStars==='object')progress.stageStars=s.stageStars;
  if(Number.isFinite(s.beans))progress.beans=Math.max(0,Math.floor(s.beans));
  if(Array.isArray(s.unlockedPerks))progress.unlockedPerks=normalizeUnlockedPerks(s.unlockedPerks);
  if(Array.isArray(s.selectedDeck)){
    progress.selectedDeck=s.selectedDeck.filter(i=>i!==13);
    if(progress.selectedDeck.length<6){
      for(let i=0;progress.selectedDeck.length<6&&i<unitCount;i++){
        if(!progress.selectedDeck.includes(i))progress.selectedDeck.push(i);
      }
    }
  }
  if(Array.isArray(s.selectedSpells))progress.selectedSpells=s.selectedSpells;
  if(Array.isArray(s.selectedPerks))progress.selectedPerks=normalizeSelectedPerks(s.selectedPerks,progress.unlockedPerks,progress.maxStage);
  else progress.selectedPerks=normalizeSelectedPerks(progress.selectedPerks,progress.unlockedPerks,progress.maxStage);
  progress.foughtBosses=normalizeFoughtBosses(s.foughtBosses||progress.foughtBosses,{
    defeatedBosses:s.defeatedBosses,
    stageStars:progress.stageStars,
    maxStage:progress.maxStage
  });
  return progress;
}

export function loadProgress(options){
  return normalizeProgress(readSave(options&&options.storage),options);
}

export function saveProgress(progress, storage){
  const meta={
    maxStage: progress.maxStage,
    stageStars: progress.stageStars,
    selectedDeck: progress.selectedDeck,
    selectedSpells: progress.selectedSpells,
    beans: Math.max(0, Math.floor(progress.beans || 0)),
    unlockedPerks: normalizeUnlockedPerks(progress.unlockedPerks),
    selectedPerks: normalizeSelectedPerks(progress.selectedPerks,progress.unlockedPerks,progress.maxStage),
    foughtBosses: normalizeFoughtBosses(progress.foughtBosses,{stageStars:progress.stageStars,maxStage:progress.maxStage})
  };
  writeSave(meta,storage);
  return meta;
}

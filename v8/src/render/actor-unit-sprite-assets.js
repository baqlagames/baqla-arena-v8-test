import {
  loadSpriteFrameSet,
  loadUnitSpriteAssets,
  pickAnimFrame,
  refreshFelfelPoisonGreenFrames,
} from './sprites.js';

export function createActorUnitSpriteAssets({ getFrame } = {}) {
  const entries = {};
  const frame = () => getFrame ? getFrame() : 0;

  function addFrameSet(key, filePrefix, count) {
    const entry = { frames: [], ready: false };
    entry.frames = loadSpriteFrameSet(filePrefix, count, {
      onReady: () => {
        entry.ready = true;
      },
    }).frames;
    entries[key] = entry;
    return entry;
  }

  addFrameSet('zataar', 'Zataar_Walking ', 4);
  addFrameSet('alibaba', 'Alibaba_Flying ', 3);
  addFrameSet('jafaar', 'Jafaar_Flying ', 5);
  entries.jafaarDemon = { frames: [], ready: false };
  entries.jafaarDestruction = { frames: [], ready: false };
  addFrameSet('zavs', 'Zavs_Walking ', 6);
  addFrameSet('king', 'King_Walking ', 5);
  addFrameSet('kingProt', 'King_Walking_Prot ', 5);
  addFrameSet('batataFlying', 'Batata_Flying ', 6);
  addFrameSet('batataFlyingBlue', 'Batata_Flying_Blue ', 6);
  addFrameSet('batataFlyingRed', 'Batata_Flying_Red ', 6);
  addFrameSet('rommana', 'Rommana_Walking ', 4);
  addFrameSet('taoon', 'Taoon_Walking ', 3);
  addFrameSet('taoonBlue', 'Taoon_Walking_Blue ', 3);
  addFrameSet('taoonGreen', 'Taoon_Walking_Green ', 3);
  addFrameSet('felfelBase', 'Felfel_Flying_Red ', 4);
  addFrameSet('felfelShadow', 'Felfel_Flying ', 4);
  const felfelPoisonGreen = { frames: [], ready: false };
  entries.felfelPoisonGreen = felfelPoisonGreen;
  const felfelPoison = { frames: [], ready: false };
  felfelPoison.frames = loadSpriteFrameSet('Felfel_Flying_Poison ', 4, {
    onReady: () => {
      felfelPoison.ready = true;
      felfelPoisonGreen.ready = refreshFelfelPoisonGreenFrames(
        felfelPoison.frames,
        felfelPoisonGreen.frames
      );
    },
  }).frames;
  entries.felfelPoison = felfelPoison;
  addFrameSet('jazar', 'Jazara_Flying ', 5);
  addFrameSet('jazarYellow', 'Jazara_Flying_Yellow ', 5);
  addFrameSet('jazarBlue', 'Jazara_Flying_Blue ', 5);
  addFrameSet('habaqBase', 'Habaq_Flying ', 3);
  addFrameSet('habaqBlue', 'Habaq_Flying_Blue ', 3);
  addFrameSet('habaqRed', 'Habaq_Flying_Red ', 3);
  addFrameSet('bakdounesFlying', 'Druid_Flying ', 5);
  const unitSprites = loadUnitSpriteAssets();
  addFrameSet('nanaaBase', 'Nanaa_Flying ', 5);
  addFrameSet('nanaaHealer', 'Nanaa_Flying_Healer ', 5);

  function pick(key, speed) {
    const entry = entries[key];
    return entry ? pickAnimFrame(entry.frames, entry.ready, frame(), speed) : null;
  }

  function frames(key) {
    const entry = entries[key];
    return entry ? entry.frames : [];
  }

  function isReady(key) {
    const entry = entries[key];
    return !!(entry && entry.ready);
  }

  function pickFelfel(branch, speed) {
    if (branch === 'b') {
      return pick(isReady('felfelPoisonGreen') ? 'felfelPoisonGreen' : 'felfelPoison', speed);
    }
    return pick(branch === 'a' ? 'felfelShadow' : 'felfelBase', speed);
  }

  return {
    unitSprites,
    pick,
    pickFelfel,
    frames,
    isReady,
  };
}

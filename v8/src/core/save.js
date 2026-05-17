// Persistent meta-save helpers for the v8 app.
export const SAVE_KEY = 'baqlaArenaV8';

export function readSave(storage = globalThis.localStorage){
  try{
    return JSON.parse(storage.getItem(SAVE_KEY)||'{}')||{};
  }catch(e){
    return {};
  }
}

export function writeSave(data, storage = globalThis.localStorage){
  try{
    storage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  }catch(e){
    return false;
  }
}

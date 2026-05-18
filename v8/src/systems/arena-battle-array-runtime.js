export function createArenaBattleArrayRuntime(battleState) {
  function replace(key, next) {
    battleState[key] = next;
    return next;
  }

  function clear(key) {
    return replace(key, []);
  }

  function clearMany(keys) {
    for (const key of keys) clear(key);
  }

  return { replace, clear, clearMany };
}

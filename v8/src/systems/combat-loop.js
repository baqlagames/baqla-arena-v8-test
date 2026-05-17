export function compactRemovedCombatUnits(units) {
  return units.some(unit => unit.removed) ? units.filter(unit => !unit.removed) : units;
}

export function tickPlayerCombatUnits({
  units,
  isArenaBattle,
  updateArenaUnit,
  updateLegacyUnit,
  resolvePlayerOverlaps,
}) {
  for (const unit of units) {
    if (isArenaBattle) updateArenaUnit(unit);
    else updateLegacyUnit(unit);
    if (unit.hitFlash > 0) unit.hitFlash--;
  }
  if (isArenaBattle) resolvePlayerOverlaps();
}

export function tickEnemyCombatUnits({
  enemies,
  updateCharmedEnemy,
  updateEnemy,
  updateBoss,
  tickEnemyPostUpdateStatusEffects,
  postEnemyStatusContext,
}) {
  for (const enemy of enemies) {
    if (enemy.charmed) updateCharmedEnemy(enemy);
    else {
      updateEnemy(enemy);
      if (enemy.isBoss && enemy.hp > 0 && !(enemy.stunned > 0) && !enemy.iceBlock && !(enemy.entryHold > 0)) {
        updateBoss(enemy);
      }
    }
    tickEnemyPostUpdateStatusEffects(enemy, postEnemyStatusContext);
  }
}

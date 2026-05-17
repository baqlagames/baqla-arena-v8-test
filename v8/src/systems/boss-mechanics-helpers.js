import { dist } from '../core/math.js';

export function bossPhase(boss) {
  const pct = boss.hp / boss.maxHp;
  if (pct > 0.66) return 1;
  if (pct > 0.33) return 2;
  return 3;
}

export function pickBossTarget(boss, mode, ctx) {
  const alive = (ctx.units || []).filter(unit => unit.hp > 0);
  if (!alive.length) return null;
  if (mode === 'lowest') return alive.reduce((best, unit) => (unit.hp / unit.maxHp < best.hp / best.maxHp) ? unit : best);
  if (mode === 'random') return alive[Math.floor(Math.random() * alive.length)];
  let best = null, bestDist = Infinity;
  for (const unit of alive) {
    const distance = dist(boss, unit);
    if (distance < bestDist) { bestDist = distance; best = unit; }
  }
  return best;
}

export function bossCDScale(boss) {
  let scale = 1;
  if (boss.timeEnraged) scale *= 0.7;
  if (boss.desperate) scale *= 0.9;
  return scale;
}

export function fireBossAbility(boss, key, cdProp, phaseMin, handler, ctx) {
  if (!boss[cdProp]) return;
  if (bossPhase(boss) < (phaseMin || 1)) return;
  if (!boss.mechCD) boss.mechCD = {};
  if (boss.mechCD[key] > 0) { boss.mechCD[key]--; return; }
  handler(boss, ctx);
  boss.mechCD[key] = Math.round(boss[cdProp] * bossCDScale(boss));
}

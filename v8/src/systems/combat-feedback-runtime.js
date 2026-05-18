import {
  createCombatStats,
  finishCombatRound,
  formatCombatStatValue,
  recordCombatDamage,
  recordCombatHeal,
  startCombatRound,
} from './combat-stats.js';
import { applyTrackedHeal } from './combat-healing.js';

export function createCombatFeedbackRuntime(deps) {
  let combatStats = deps.initialCombatStats || null;
  let lastHealSfxFrame = 0;

  const randomRange = typeof deps.randomRange === 'function'
    ? deps.randomRange
    : ((min, max) => min + Math.random() * (max - min));

  function frame() {
    return typeof deps.frame === 'function' ? deps.frame() : 0;
  }

  function setStats(value) {
    combatStats = value;
    if (typeof deps.setCombatStats === 'function') deps.setCombatStats(value);
    return combatStats;
  }

  function addParticle(x, y, color, count, size) {
    const particles = deps.particles();
    if (particles.length > 180) return;
    const sz = size || 3;
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        vx: randomRange(-2, 2),
        vy: randomRange(-2, 2),
        life: 1,
        color,
        sz: sz * randomRange(0.6, 1.2),
      });
    }
  }

  function addDamageText(x, y, value, color, opts) {
    const damageNumbers = deps.damageNumbers();
    if (damageNumbers.length > 32) return;
    let display = value;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return;
      display = Math.round(value);
      if (display <= 2) return;
    } else {
      const text = String(value == null ? '' : value).trim();
      if (/^[+-]?[0-2](?:\.0+)?$/i.test(text)) return;
      display = value;
    }
    const isNumber = typeof display === 'number';
    damageNumbers.push({
      x: x + (opts && opts.dx != null ? opts.dx : randomRange(-3, 3)),
      y: y + (opts && opts.dy != null ? opts.dy : 0),
      val: display,
      color: color || '#fff',
      life: 1,
      vy: opts && opts.vy != null ? opts.vy : -0.45,
      vx: opts && opts.vx != null ? opts.vx : randomRange(-0.08, 0.08),
      sz: opts && opts.sz || (isNumber ? 12 : 11),
      bold: opts && opts.bold || false,
      outline: opts && opts.outline || null,
    });
  }

  function addHealFx(x, y, value, big, source, target, meta = {}) {
    const heal = Math.round(Number(value) || 0);
    if (source) recordHeal(source, target, heal, meta.overheal || 0);
    if (!Number.isFinite(heal) || heal <= 0) return;
    if (heal <= 2) return;
    const healingNumbers = deps.healingNumbers();
    if (healingNumbers.length > 20) return;
    const currentFrame = frame();
    const sound = deps.sound || {};
    if (big && currentFrame - lastHealSfxFrame >= 30) {
      lastHealSfxFrame = currentFrame;
      if (typeof sound.bigHeal === 'function') sound.bigHeal();
    } else if (currentFrame - lastHealSfxFrame >= 60) {
      lastHealSfxFrame = currentFrame;
      if (typeof sound.heal === 'function') sound.heal();
    }
    healingNumbers.push({
      x: x + randomRange(-3, 3),
      y: y - 10,
      val: heal,
      life: 1,
      big: !!big,
      vy: big ? -0.45 : -0.32,
      vx: randomRange(-0.06, 0.06),
      overheal: Math.max(0, Math.round(meta.overheal || 0)),
    });
  }

  function resetStage(stage) {
    return setStats(createCombatStats(stage, frame()));
  }

  function startRound({ stage, round, tickHz }) {
    return setStats(startCombatRound(combatStats, {
      stage,
      frame: frame(),
      round,
      tickHz,
    }));
  }

  function recordDamage(target, attacker, amount) {
    recordCombatDamage(combatStats, target, attacker, amount);
  }

  function recordHeal(source, target, amount, overheal = 0) {
    recordCombatHeal(combatStats, source, target, amount, overheal);
  }

  function trackedHeal(target, amount, {
    source,
    big,
    alreadyAdjusted,
    adjustHealingReceived,
  } = {}) {
    return applyTrackedHeal(target, amount, {
      source,
      big,
      alreadyAdjusted,
      adjustHealingReceived,
      emitHealFx: addHealFx,
    });
  }

  function finishRound(result, tickHz) {
    finishCombatRound(combatStats, {
      frame: frame(),
      result,
      tickHz,
    });
  }

  return {
    addParticle,
    addDamageText,
    addHealFx,
    resetStage,
    startRound,
    recordDamage,
    recordHeal,
    trackedHeal,
    finishRound,
    format: formatCombatStatValue,
    stats: () => combatStats,
    setStats,
  };
}

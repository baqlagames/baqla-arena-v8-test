import {
  createCombatStats,
  finishCombatRound,
  formatCombatStatValue,
  recordCombatDamage,
  recordCombatHeal,
  recordCombatPrevented,
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
    const isTaggedHit = !!(opts && opts.tag);
    if (damageNumbers.length > (isTaggedHit ? 24 : 32)) return;
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
    if (isTaggedHit && isNumber && !(opts && opts.crit)) {
      const group = opts && opts.group;
      for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const d = damageNumbers[i];
        if (!d || d.crit || d.tag !== opts.tag) continue;
        const sameGroup = group ? d.group === group : (Math.abs(d.x - x) < 28 && Math.abs(d.y - y) < 26);
        if (!sameGroup) continue;
        d.val = Math.round((Number(d.val) || 0) + display);
        d.life = Math.max(d.life || 0, opts.life != null ? opts.life : 0.92);
        d.decay = Math.min(d.decay || 0.03, opts.decay || 0.024);
        d.x = d.x * 0.78 + x * 0.22;
        d.y = Math.min(d.y, y);
        d.color = color || d.color || '#fff';
        d.tagColor = opts.tagColor || d.tagColor || null;
        return;
      }
    }
    damageNumbers.push({
      x: x + (opts && opts.dx != null ? opts.dx : randomRange(-3, 3)),
      y: y + (opts && opts.dy != null ? opts.dy : 0),
      val: display,
      color: color || '#fff',
      life: opts && opts.life != null ? opts.life : (isTaggedHit ? 0.92 : 1),
      vy: opts && opts.vy != null ? opts.vy : -0.45,
      vx: opts && opts.vx != null ? opts.vx : randomRange(-0.08, 0.08),
      sz: opts && opts.sz || (isTaggedHit ? 11 : (isNumber ? 12 : 11)),
      decay: opts && opts.decay || (isTaggedHit ? 0.024 : 0.026),
      bold: opts && opts.bold || false,
      outline: opts && opts.outline || null,
      tag: opts && opts.tag || null,
      tagColor: opts && opts.tagColor || null,
      crit: opts && opts.crit || false,
      hint: opts && opts.hint || null,
      compact: opts && opts.compact || false,
      group: opts && opts.group || null,
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

  function recordDamage(target, attacker, amount, meta) {
    recordCombatDamage(combatStats, target, attacker, amount, meta);
  }

  function recordPrevented(target, source, amount, meta) {
    recordCombatPrevented(combatStats, target, source, amount, meta);
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
    recordPrevented,
    recordHeal,
    trackedHeal,
    finishRound,
    format: formatCombatStatValue,
    stats: () => combatStats,
    setStats,
  };
}

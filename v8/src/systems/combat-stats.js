const DEFAULT_TICK_HZ = 120;

export function createCombatStats(stage, frame) {
  return {
    stageN: (stage && stage.n) || 0,
    stageName: (stage && stage.name) || '',
    startFrame: frame,
    combatFrames: 0,
    roundActive: false,
    round: null,
    entries: {},
    roundSummaries: [],
    lastRound: null,
    completed: false,
    actorSeq: 0,
  };
}

export function startCombatRound(stats, { stage, frame, round, tickHz = DEFAULT_TICK_HZ } = {}) {
  const tracker = stats || createCombatStats(stage, frame);
  if (tracker.roundActive) finishCombatRound(tracker, { frame, result: 'ended', tickHz });
  tracker.roundActive = true;
  tracker.round = { round: round || 1, startFrame: frame, entries: {} };
  return tracker;
}

export function actorStatsRoot(actor) {
  let a = actor;
  let guard = 0;
  while (
    a &&
    a.parent &&
    (a.isMinion || a.isMirror || a.isGhost || a.kind === 'turret' || a.kind === 'treant' || a.kind === 'mushroom' || a.familiar) &&
    guard++ < 5
  ) {
    a = a.parent;
  }
  return a;
}

export function actorStatsKey(stats, actor) {
  const a = actorStatsRoot(actor);
  if (!a || !a.isPlayer || a.isKing) return null;
  if (a.cellKey != null) return 'cell:' + a.cellKey;
  stats.actorSeq = stats.actorSeq || 0;
  if (a.unitIdx != null) return 'unit:' + a.unitIdx + ':' + (a.branch || 'base') + ':' + (a._statsId || (a._statsId = ++stats.actorSeq));
  return 'actor:' + (a._statsId || (a._statsId = ++stats.actorSeq));
}

export function actorStatsName(actor) {
  const a = actorStatsRoot(actor);
  if (!a) return 'Unit';
  const name = a.name || a.role || 'Unit';
  const lvl = a.cellLevel || a.level || a.levelTier || 1;
  return name + ' L' + lvl;
}

export function combatStatsEntry(stats, bucket, actor) {
  const key = actorStatsKey(stats, actor);
  if (!key) return null;
  const a = actorStatsRoot(actor);
  if (!bucket[key]) {
    bucket[key] = {
      key,
      name: actorStatsName(a),
      role: a.arch || a.role || 'unit',
      unitIdx: a.unitIdx,
      branch: a.branch || 'base',
      color: a.color || '#ffd54a',
      accent: a.accent || '#ffffff',
      damageDone: 0,
      healingDone: 0,
      healingWasted: 0,
      damageTaken: 0,
    };
  } else {
    bucket[key].name = actorStatsName(a);
    bucket[key].role = a.arch || bucket[key].role;
    bucket[key].color = a.color || bucket[key].color;
    bucket[key].accent = a.accent || bucket[key].accent;
  }
  return bucket[key];
}

export function addCombatStat(stats, actor, field, amount) {
  if (!stats || amount <= 0) return;
  const st = combatStatsEntry(stats, stats.entries, actor);
  if (st) st[field] = (st[field] || 0) + amount;
  if (stats.roundActive && stats.round) {
    const rt = combatStatsEntry(stats, stats.round.entries, actor);
    if (rt) rt[field] = (rt[field] || 0) + amount;
  }
}

export function addCombatStatBundle(stats, actor, values) {
  if (!stats || !actor || !values) return;
  const fields = Object.entries(values).filter(([, amount]) => amount > 0);
  if (!fields.length) return;
  const st = combatStatsEntry(stats, stats.entries, actor);
  if (st) {
    for (const [field, amount] of fields) st[field] = (st[field] || 0) + amount;
  }
  if (stats.roundActive && stats.round) {
    const rt = combatStatsEntry(stats, stats.round.entries, actor);
    if (rt) {
      for (const [field, amount] of fields) rt[field] = (rt[field] || 0) + amount;
    }
  }
}

export function recordCombatDamage(stats, target, attacker, amount) {
  amount = Math.max(0, Math.round(amount || 0));
  if (amount <= 0 || !stats) return;
  if (attacker && attacker.isPlayer && !attacker.isKing && target && !target.isPlayer) {
    addCombatStat(stats, attacker, 'damageDone', amount);
  }
  if (target && target.isPlayer && !target.isKing && !target.isMinion && !target.isMirror && !target.isGhost && attacker && !attacker.isPlayer) {
    addCombatStat(stats, target, 'damageTaken', amount);
  }
}

export function recordCombatHeal(stats, source, target, amount, overheal = 0) {
  amount = Math.max(0, Math.round(amount || 0));
  overheal = Math.max(0, Math.round(overheal || 0));
  if ((amount <= 0 && overheal <= 0) || !stats || !source) return;
  const root = actorStatsRoot(source);
  if (!root || !root.isPlayer || root.isKing) return;
  if (target && (!target.isPlayer || target.isKing)) return;
  addCombatStatBundle(stats, root, {
    healingDone: amount,
    healingWasted: overheal,
  });
}

export function combatStatsMini(entry, field, durSec) {
  if (!entry) return null;
  const out = {
    name: entry.name,
    role: entry.role,
    color: entry.color,
    accent: entry.accent,
    amount: Math.round(entry[field] || 0),
  };
  if (field === 'damageDone') out.dps = Math.round(out.amount / Math.max(1, durSec || 1));
  if (field === 'healingDone') {
    out.hps = Math.round(out.amount / Math.max(1, durSec || 1));
    out.overheal = Math.round(entry.healingWasted || 0);
  }
  return out;
}

export function combatStatsList(entries, field, durSec, limit) {
  const list = Object.values(entries || {}).filter(entry => (entry[field] || 0) > 0);
  if (field === 'damageDone') {
    list.sort((a, b) => ((b.damageDone || 0) / Math.max(1, durSec || 1)) - ((a.damageDone || 0) / Math.max(1, durSec || 1)));
  } else {
    list.sort((a, b) => (b[field] || 0) - (a[field] || 0));
  }
  return list.slice(0, limit || 10).map(entry => combatStatsMini(entry, field, durSec));
}

export function combatStatsTop(entries, field, durSec) {
  const list = combatStatsList(entries, field, durSec, 1);
  return list[0] || null;
}

export function finishCombatRound(stats, { frame, result, tickHz = DEFAULT_TICK_HZ } = {}) {
  if (!stats || !stats.roundActive || !stats.round) return;
  const r = stats.round;
  const frames = Math.max(1, frame - r.startFrame);
  const durSec = frames / tickHz;
  const summary = {
    round: r.round,
    result: result || 'clear',
    frames,
    durSec,
    damageList: combatStatsList(r.entries, 'damageDone', durSec, 10),
    healList: combatStatsList(r.entries, 'healingDone', durSec, 10),
    topDps: combatStatsTop(r.entries, 'damageDone', durSec),
    topHeal: combatStatsTop(r.entries, 'healingDone', durSec),
  };
  stats.combatFrames += frames;
  stats.roundSummaries.push(summary);
  stats.lastRound = summary;
  stats.roundActive = false;
  stats.round = null;
}

export function completeCombatStats(stats, won) {
  if (stats) stats.completed = !!won;
}

export function formatCombatStatValue(value) {
  const v = Math.max(0, Math.round(value || 0));
  if (v >= 1000000) return (v / 1000000).toFixed(v >= 10000000 ? 0 : 1) + 'm';
  if (v >= 1000) return (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k';
  return String(v);
}

export function getRoundCombatReport(stats) {
  if (!stats || !stats.lastRound) return null;
  const r = stats.lastRound;
  return {
    title: 'CURRENT ROUND REPORT',
    subtitle: 'Round ' + r.round + ' results - ' + formatCombatStatValue(Math.round(r.durSec || 0)) + 's combat',
    damageList: r.damageList || (r.topDps ? [r.topDps] : []),
    healList: r.healList || (r.topHeal ? [r.topHeal] : []),
    accent: '#fbbf24',
  };
}

export function getStageCombatReport(stats, tickHz = DEFAULT_TICK_HZ) {
  if (!stats) return null;
  const entries = Object.values(stats.entries || {}).filter(entry => (entry.damageDone || entry.healingDone) > 0);
  if (!entries.length) return null;
  const durSec = Math.max(1, (stats.combatFrames || 1) / tickHz);
  return {
    title: 'STAGE TOTAL REPORT',
    subtitle: 'Total damage and healing - ' + formatCombatStatValue(Math.round(durSec)) + 's combat',
    damageList: combatStatsList(stats.entries, 'damageDone', durSec, 10),
    healList: combatStatsList(stats.entries, 'healingDone', durSec, 10),
    accent: '#60a5fa',
  };
}

import { ARENA_ABILITIES } from '../data/abilities.js';
import { ARENA_BLOODLUST_COST, ARENA_TRANQUILITY_COST, activateBloodlust as activateBloodlustCore, activateTranquility as activateTranquilityCore, tickActiveSkills as tickActiveSkillsCore } from './active-skills.js';

export { ARENA_BLOODLUST_COST, ARENA_TRANQUILITY_COST };

export function createArenaSpellRuntime(deps = {}) {
  const tickHz = deps.tickHz || 60;
  const dist = typeof deps.distance === 'function'
    ? deps.distance
    : ((a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)));
  const rnd = typeof deps.randomRange === 'function'
    ? deps.randomRange
    : ((min, max) => min + Math.random() * (max - min));
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});
  const showFlash = typeof deps.showFlash === 'function' ? deps.showFlash : () => {};
  const addParticle = typeof deps.emitParticle === 'function' ? deps.emitParticle : () => {};
  const dealDamage = typeof deps.dealDamage === 'function' ? deps.dealDamage : () => 0;
  const applyTrackedHeal = typeof deps.applyTrackedHeal === 'function' ? deps.applyTrackedHeal : () => 0;
  const addGoldShield = typeof deps.addGoldShield === 'function'
    ? deps.addGoldShield
    : ((unit, amount, duration, cap, noExpireHeal, visual = {}) => {
      const current = unit._goldShield && unit._goldShield.amt > 0 ? unit._goldShield.amt : 0;
      unit._goldShield = { amt: Math.min(cap || amount, current + amount), timer: duration, maxTimer: duration, noExpireHeal: true, color: visual.color, type: visual.type };
    });

  const spellStatSources = {};

  function spellStatSource(ability) {
    const key = String(ability && ability.id != null ? ability.id : (ability && ability.name) || 'spell');
    if (!spellStatSources[key]) {
      spellStatSources[key] = {
        isPlayer: true,
        name: (ability && ability.name) || 'Spell',
        arch: 'spell',
        color: (ability && ability.color) || '#ffd700',
        accent: '#ffffff',
        _statsId: 'spell:' + key,
      };
    }
    return spellStatSources[key];
  }

  function selectedAbility(index) {
    const v = view();
    const selectedSpells = v.selectedSpells || [];
    return ARENA_ABILITIES[selectedSpells[index]];
  }

  function castAbility(index, tx, ty) {
    const v = view();
    const arena = v.arena || {};
    const units = v.units || [];
    const enemies = v.enemies || [];
    const bombs = v.bombs || [];
    const abilityUsed = v.abilityUsed || [];
    const ability = selectedAbility(index);
    if (!ability) return false;
    const spellSource = spellStatSource(ability);
    const cost = ability.cost || 0;

    if (abilityUsed[index] || (arena.spellUsed && arena.spellUsed[index])) {
      showFlash('SPELL ALREADY USED', '#ffb0a6', 70);
      if (typeof deps.setAbilityTargeting === 'function') deps.setAbilityTargeting(-1);
      return false;
    }
    if ((v.gold || 0) < cost) {
      showFlash('NEED ' + cost + 'g', '#ffb0a6', 70);
      return false;
    }

    let autoTarget = null;
    if (ability.target === 'auto') {
      let bestD = Infinity;
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const d = dist({ x: (v.width || 500) / 2, y: (v.arenaTop || 0) + 200 }, enemy);
        if (d < bestD) {
          bestD = d;
          autoTarget = enemy;
        }
      }
      if (!autoTarget) {
        showFlash('NO TARGET', '#ffb0a6', 60);
        return false;
      }
    }

    if (typeof deps.setGold === 'function') deps.setGold((v.gold || 0) - cost);
    abilityUsed[index] = true;
    if (!arena.spellUsed) arena.spellUsed = [];
    arena.spellUsed[index] = true;
    if (typeof deps.setAbilityTargeting === 'function') deps.setAbilityTargeting(-1);

    if (ability.target === 'pos') {
      bombs.push({
        x: tx,
        y: (v.arenaTop || 0) - 60,
        fromX: tx,
        fromY: (v.arenaTop || 0) - 60,
        tx,
        ty,
        t: 0,
        dur: 50,
        dmg: ability.damage,
        radius: ability.radius,
        attacker: spellSource,
        isPlayer: true,
        color: ability.color,
        meteor: true,
      });
    } else if (ability.target === 'auto') {
      const best = autoTarget;
      if (best) {
        dealDamage(best, ability.damage, spellSource, 'normal');
        const around = enemies.filter(enemy => enemy.hp > 0 && enemy !== best && dist(best, enemy) < 120).slice(0, ability.chainCount);
        for (const enemy of around) dealDamage(enemy, ability.chainDmg, spellSource, 'normal');
        addParticle(best.x, best.y, ability.color, 24, 5);
        if (typeof deps.shake === 'function') deps.shake(6);
      }
    } else if (ability.target === 'self') {
      if (ability.healPct) {
        for (const unit of units) {
          if (unit.hp > 0) applyTrackedHeal(unit, Math.round(unit.maxHp * ability.healPct), spellSource, true);
        }
      }
      if (ability.slowMult) {
        for (const enemy of enemies) {
          enemy.slowTimer = ability.slowDur;
          enemy.slowMult = ability.slowMult;
        }
      }
      if (ability.atkSpdBoost) {
        for (const unit of units) {
          if (unit.hp > 0) {
            unit.atkSpdBuff = ability.atkSpdBoost;
            unit.atkSpdBuffTimer = ability.duration;
          }
        }
      }
      if (ability.stunDur) {
        for (const enemy of enemies) {
          if (enemy.hp <= 0 || enemy.isBoss) continue;
          enemy.stunned = Math.max(enemy.stunned || 0, ability.stunDur);
          addParticle(enemy.x, enemy.y, ability.color, 8, 3);
        }
      }
      if (ability.signatureReducePct) {
        const pct = Math.max(0, Math.min(0.75, ability.signatureReducePct));
        for (const unit of units) {
          if (unit.hp <= 0 || !unit.signature) continue;
          const remaining = Math.max(0, unit.signature.cd - unit.signature.t);
          unit.signature.t = Math.min(unit.signature.cd - 1, unit.signature.t + Math.round(remaining * pct));
          addParticle(unit.x, unit.y, ability.color, 6, 3);
        }
      }
      if (ability.shieldPct) {
        const duration = ability.shieldDur || Math.round(6 * tickHz);
        for (const unit of units) {
          if (unit.hp <= 0) continue;
          const shield = Math.max(1, Math.round((unit.maxHp || unit.hp || 1) * ability.shieldPct));
          const cap = Math.max(shield, Math.round((unit.maxHp || unit.hp || 1) * 0.28));
          addGoldShield(unit, shield, duration, cap, true, { color: ability.color, type: 'spell' });
          addParticle(unit.x, unit.y, ability.color, 8, 3);
        }
      }
    }

    showFlash(ability.name.toUpperCase() + '!', ability.color, 40);
    return true;
  }

  function abilityNeedsTarget(index) {
    const ability = selectedAbility(index);
    return ability && ability.target === 'pos';
  }

  function canCastAbility(index) {
    const v = view();
    const arena = v.arena || {};
    const abilityUsed = v.abilityUsed || [];
    const ability = selectedAbility(index);
    if (!ability) return false;
    if (abilityUsed[index] || (arena.spellUsed && arena.spellUsed[index])) {
      showFlash('SPELL ALREADY USED', '#ffb0a6', 70);
      return false;
    }
    const cost = ability.cost || 0;
    if ((v.gold || 0) < cost) {
      showFlash('NEED ' + cost + 'g', '#ffb0a6', 70);
      return false;
    }
    return true;
  }

  function handleSpellButton(index) {
    const v = view();
    if (!canCastAbility(index)) return false;
    if (abilityNeedsTarget(index)) {
      const currentTargeting = v.abilityTargeting;
      if (typeof deps.setAbilityTargeting === 'function') deps.setAbilityTargeting(currentTargeting === index ? -1 : index);
      showFlash(currentTargeting === index ? 'TARGETING CANCELLED' : 'TAP TARGET SQUARE', '#ffd700', 45);
      return true;
    }
    return castAbility(index, (v.width || 500) / 2, (v.arenaTop || 0) + 220);
  }

  function applyActiveSkillResult(result) {
    if (!result) return;
    if (typeof deps.setGold === 'function') deps.setGold(result.gold);
    if (result.flash) showFlash(result.flash.text, result.flash.color, result.flash.timer);
    if (result.screenShake && typeof deps.shake === 'function') deps.shake(result.screenShake);
  }

  function activateBloodlust() {
    const v = view();
    applyActiveSkillResult(activateBloodlustCore({
      arena: v.arena || {},
      gold: v.gold || 0,
      units: v.units || [],
      gameTickHz: tickHz,
      emitParticle: addParticle,
    }));
  }

  function activateTranquility() {
    const v = view();
    applyActiveSkillResult(activateTranquilityCore({
      arena: v.arena || {},
      gold: v.gold || 0,
      units: v.units || [],
      gameTickHz: tickHz,
      emitParticle: addParticle,
    }));
  }

  function activeSkillsContext() {
    const v = view();
    return {
      arena: v.arena || {},
      units: v.units || [],
      emitHeal: typeof deps.addHealEffect === 'function' ? deps.addHealEffect : () => {},
      emitParticle: addParticle,
      random: rnd,
      applyHeal: applyTrackedHeal,
      source: spellStatSource({ id: 'active-tranquility', name: 'Tranquility', color: '#3aff66' }),
    };
  }

  function tickActiveSkills(context) {
    tickActiveSkillsCore(context || activeSkillsContext());
  }

  return {
    spellStatSource,
    castAbility,
    abilityNeedsTarget,
    canCastAbility,
    handleSpellButton,
    activateBloodlust,
    activateTranquility,
    activeSkillsContext,
    tickActiveSkills,
  };
}

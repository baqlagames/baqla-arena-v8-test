import {
  ARENA_BASE_SPECS,
  ARENA_PATH_DETAIL_LINES,
  ARENA_ROLE_PATHS,
  ARENA_ROLE_ROOT_ORDER,
  ARENA_ROLE_ROOTS,
  ARENA_ROLE_SPECS
} from '../data/roles.js';

export function createRoleProgressionRuntime(deps = {}) {
  const unitBranches = deps.unitBranches || {};
  const baseSignatures = deps.baseSignatures || {};
  const branchSignatures = deps.branchSignatures || {};
  const getSignatures = typeof deps.getSignatures === 'function' ? deps.getSignatures : (() => ({}));
  const sigDisplayFc = typeof deps.sigDisplayFc === 'function' ? deps.sigDisplayFc : defaultSigDisplayFc;
  const sigDisplayCd = typeof deps.sigDisplayCd === 'function' ? deps.sigDisplayCd : defaultSigDisplayCd;

  function baseSpec(unitIdx) {
    return ARENA_BASE_SPECS[unitIdx] || null;
  }

  function roleRoot(id) {
    return ARENA_ROLE_ROOTS[id] || null;
  }

  function rolePaths(id) {
    return ARENA_ROLE_PATHS[id] || [];
  }

  function pathById(roleId, pathId) {
    return rolePaths(roleId).find(path => path.id === pathId) || null;
  }

  function roleSpecs(id) {
    return (ARENA_ROLE_SPECS[id] || []).map(spec => {
      const pathDefs = (spec.paths || []).map(pid => pathById(id, pid)).filter(Boolean);
      return { ...spec, pathDefs };
    }).filter(spec => spec.pathDefs.length);
  }

  function specById(roleId, specId) {
    return roleSpecs(roleId).find(spec => spec.id === specId) || null;
  }

  function specForPathId(roleId, pathId) {
    return roleSpecs(roleId).find(spec => spec.pathDefs.some(path => path.id === pathId)) || null;
  }

  function isRoleRootCell(cell) {
    return !!(cell && cell.roleId && !cell.pathId && cell.level === 2);
  }

  function applyRolePathToCell(cell, path) {
    if (!cell || !path) return;
    const spec = cell.roleId ? specForPathId(cell.roleId, path.id) : null;
    cell.unitIdx = path.unitIdx;
    cell.branch = path.branch || null;
    cell.pathId = path.id;
    cell.pathName = path.name;
    cell.pathRole = path.role;
    cell.specId = spec ? spec.id : null;
    cell.specName = spec ? spec.name : null;
  }

  function cellPathMeta(cell) {
    if (!cell) return null;
    if (cell.pathId && cell.roleId) return pathById(cell.roleId, cell.pathId);
    return null;
  }

  function statModDetail(path) {
    if (!path || !path.branch || !unitBranches[path.unitIdx] || !unitBranches[path.unitIdx][path.branch]) return null;
    const mod = unitBranches[path.unitIdx][path.branch].statMod;
    if (!mod) return null;
    const labels = { maxHp: 'HP', dmg: 'DMG', armor: 'Armor', magicRes: 'MR', atkSpd: 'Atk speed' };
    const parts = [];
    for (const key of Object.keys(mod)) {
      const value = mod[key];
      if (key === 'atkSpd') parts.push((value < 1 ? '+' : '-') + Math.round(Math.abs(1 - value) * 100) + '% ' + labels[key]);
      else parts.push((value >= 1 ? '+' : '-') + Math.round(Math.abs(value - 1) * 100) + '% ' + (labels[key] || key));
    }
    return parts.length ? 'Stats: ' + parts.join(', ') : null;
  }

  function pathDetails(path) {
    if (!path) return [];
    const out = [];
    const custom = ARENA_PATH_DETAIL_LINES[path.id] || [];
    if (!custom.length) {
      const stat = statModDetail(path);
      if (stat) out.push(stat);
    }
    for (const line of custom) out.push(line);
    const sigId = path.branch ? branchSignatures[path.unitIdx + '_' + path.branch] : baseSignatures[path.unitIdx];
    const signatures = getSignatures() || {};
    const sig = sigId && signatures[sigId];
    if (sig) out.push('Signature: ' + sig.name + ' - ' + sigDisplayFc(sig.cd) + 's first / ' + sigDisplayCd(sig.cd, 3) + 's CD');
    return out.slice(0, 4);
  }

  return {
    rootOrder: ARENA_ROLE_ROOT_ORDER,
    baseSpec,
    roleRoot,
    rolePaths,
    pathById,
    roleSpecs,
    specById,
    specForPathId,
    isRoleRootCell,
    applyRolePathToCell,
    cellPathMeta,
    statModDetail,
    pathDetails
  };
}

function defaultSigDisplayFc(cd) {
  return Math.max(1, Math.round((cd || 1) * 0.35));
}

function defaultSigDisplayCd(cd, level) {
  return level >= 5 ? Math.max(1, Math.round((cd || 1) * 0.78)) : (cd || 1);
}

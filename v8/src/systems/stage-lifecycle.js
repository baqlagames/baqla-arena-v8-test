import { STAGE_DMG_MULT } from '../data/stages.js';
import { arena_stageStartGold } from './stage-economy.js';

export const PLAYER_CASTLE_ATTACK_RANGE = 140;

export function createStagePlayerCastle({ stage, stageIndex, width, arenaBottom }) {
  const stageN = (stage && stage.n) || 1;
  const kingHp = 600 + 100 * stageN;
  return {
    kingHp,
    playerCastle: {
      x: width / 2,
      y: arenaBottom - 38,
      hp: kingHp,
      maxHp: kingHp,
      isPlayer: true,
      isKing: true,
      size: 30,
      name: 'King',
      cd: 0,
      range: PLAYER_CASTLE_ATTACK_RANGE,
      dmg: 25 * (STAGE_DMG_MULT[stageIndex] || 1),
      atkSpd: 60,
    },
  };
}

export function createStageArenaReset({ kingHp, starRule }) {
  return {
    cells: {},
    beacons: [],
    voidTentacles: [],
    shadowApparitions: [],
    shadowCrashes: [],
    hammerOfLight: [],
    wakeOfAshesWaves: [],
    activeBarrier: null,
    lieutenants: null,
    aerialBombs: [],
    astralStorm: null,
    _stageStartKingHp: kingHp,
    _stageBaseDamaged: false,
    _stageMaxSquadCounts: { total: 0, tanks: 0, healers: 0, meleeDps: 0 },
    _stageEverHealer: false,
    _stageEverMeleeDps: false,
    lastStars: null,
    _stageRule: starRule,
    bloodlustUsed: false,
    tranquilityUsed: false,
    bloodlustTimer: 0,
    tranquilityTimer: 0,
    tranquilityTickAcc: 0,
    spellUsed: [],
    rift: null,
    riftFiredThisRound: false,
    waveElapsed: 0,
    round: 1,
  };
}

export function createStageRunSetup({ stage, stageIndex, width, arenaBottom, starRule }) {
  const stageN = (stage && stage.n) || 1;
  const castleSetup = createStagePlayerCastle({ stage, stageIndex, width, arenaBottom });
  return {
    stageN,
    gold: arena_stageStartGold(stageN),
    stageGold: 0,
    stageOver: false,
    stageWon: false,
    playerCastle: castleSetup.playerCastle,
    arenaReset: createStageArenaReset({
      kingHp: castleSetup.kingHp,
      starRule,
    }),
  };
}

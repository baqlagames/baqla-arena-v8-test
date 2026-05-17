const ALIBABA_MINION_KINDS = new Set(['flameSprite', 'fireElemental', 'waterElemental', 'stormElemental']);
const JAAFAR_MINION_KINDS = new Set(['foul', 'foulRanged', 'foulTank', 'imp', 'felhound']);
const ZAATAR_WEAK_MINION_KINDS = new Set(['wolf', 'raptor']);
const ZAATAR_STRONG_MINION_KINDS = new Set(['bear', 'spiritBeast', 'direBeast']);

export function drawSummonSprite(ctx, {
  x,
  y,
  unit,
  unitSprites,
  frame = 0,
  drawUnitSprite,
  randomRange = () => 0,
  emitParticle = () => {},
} = {}) {
  const u = unit;
  if (!u) return false;
  const isAlibaba = ALIBABA_MINION_KINDS.has(u.kind);
  const isJaafar = JAAFAR_MINION_KINDS.has(u.kind);
  const isZaatarWeak = ZAATAR_WEAK_MINION_KINDS.has(u.kind);
  const isZaatarStrong = ZAATAR_STRONG_MINION_KINDS.has(u.kind);
  if (!isAlibaba && !isJaafar && !isZaatarWeak && !isZaatarStrong) return false;

  const img = isAlibaba
    ? (u.kind === 'flameSprite' ? unitSprites.alibabaMinionCutout : unitSprites.alibabaMinion)
    : (isJaafar ? unitSprites.jaafarMinion : (isZaatarStrong ? unitSprites.zaatarMinionStrong : unitSprites.zaatarMinionWeak));
  const isTank = u.kind === 'foulTank' || u.kind === 'felhound';
  const isSmall = u.kind === 'flameSprite' || u.kind === 'imp';
  let buildScale = isAlibaba ? 3.10 : (isJaafar ? 2.70 : (isZaatarStrong ? 1.35 : 1.45));
  let waveScale = isAlibaba ? 4.20 : (isJaafar ? 3.85 : (isZaatarStrong ? 1.85 : 1.90));
  if (isSmall) { buildScale *= 0.92; waveScale *= 0.92; }
  if (isTank) { buildScale *= 0.82; waveScale *= 0.82; }
  const glow = isAlibaba ? '#bd5cff' : (isJaafar ? '#33e6d0' : '#ffb22e');
  const anchor = isAlibaba ? 0.58 : (isJaafar ? 0.64 : 0.58);
  if (!drawUnitSprite(img, x, y, u, { buildScale, waveScale, anchor, glow, glowAlpha: 0.14 })) return false;
  if (frame % 6 === 0) emitParticle(x + randomRange(-u.size * 0.35, u.size * 0.35), y - u.size * 0.55, glow, 1, 2.2);
  return true;
}

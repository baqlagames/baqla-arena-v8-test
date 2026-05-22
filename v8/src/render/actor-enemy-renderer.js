import { createBossSpriteRenderer } from './boss-sprites.js?v=20260522-vizier-gold';
import { createEnemySpriteRenderer } from './enemy-sprites.js';

export function createActorEnemyRenderer({
  ctx,
  getFrame,
  getArenaTop,
  randomRange = () => 0,
  emitParticle = () => {},
  drawWithClashCamera = (_x, _y, fn) => fn(),
  drawEnemyVfxUnder = () => {},
  drawEnemyVfxOver = () => {},
  drawHpBar = () => {},
  drawStatusIcons = () => {},
  drawCritter = () => {},
} = {}) {
  const frame = () => getFrame ? getFrame() : 0;
  const arenaTop = () => getArenaTop ? getArenaTop() : 0;

  const enemySprites = createEnemySpriteRenderer({
    ctx,
    view: () => ({ frame: frame() }),
  });
  const bossSprites = createBossSpriteRenderer({
    ctx,
    view: () => ({ frame: frame() }),
    randomRange,
    emitParticle,
    drawFallbackEnemyBody: enemySprites.drawDpsBody,
  });

  function drawBossBody(enemy, x, y, size) {
    return bossSprites.drawBossBody(enemy, x, y, size);
  }

  function drawStormWard(enemy, x, y, size) {
    const f = frame();
    const col = enemy.color || '#8bdfff';
    const acc = enemy.accent || '#ffd166';
    const pulse = 0.72 + 0.28 * Math.sin(f * 0.12 + (enemy.bobPhase || 0));
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(0, size * 0.74, size * 0.62, size * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.55 + 0.25 * pulse;
    ctx.beginPath(); ctx.arc(0, -size * 0.04, size * 0.68, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = enemy.stormWardKind === 'iron' ? '#102a44' : '#3a2c08';
    ctx.strokeStyle = '#061433';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.72);
    ctx.lineTo(size * 0.46, -size * 0.12);
    ctx.lineTo(size * 0.28, size * 0.58);
    ctx.lineTo(-size * 0.28, size * 0.58);
    ctx.lineTo(-size * 0.46, -size * 0.12);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.86;
    ctx.beginPath(); ctx.ellipse(0, -size * 0.08, size * 0.20, size * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = acc;
    ctx.beginPath(); ctx.arc(0, -size * 0.52, size * 0.09 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = acc;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-size * 0.36, -size * 0.18); ctx.lineTo(size * 0.36, -size * 0.18); ctx.stroke();
    ctx.restore();
  }

  function drawStormMote(enemy, x, y, size) {
    const f = frame();
    const pulse = 0.68 + 0.32 * Math.sin(f * 0.18 + (enemy.bobPhase || 0));
    ctx.save();
    ctx.translate(x, y - Math.sin(f * 0.10 + (enemy.bobPhase || 0)) * 4);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.beginPath(); ctx.ellipse(0, size * 0.84, size * 0.48, size * 0.14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(139,223,255,' + (0.22 + 0.15 * pulse) + ')';
    ctx.beginPath(); ctx.arc(0, 0, size * 0.82, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8bdfff';
    ctx.strokeStyle = '#061433';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, size * 0.34 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = f * 0.06 + i * Math.PI * 2 / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * size * 0.22, Math.sin(a) * size * 0.18);
      ctx.lineTo(Math.cos(a + 0.40) * size * 0.78, Math.sin(a + 0.40) * size * 0.44);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnemyBody(enemy, x, y, size) {
    const f = frame();
    if (enemy.isBoss) return drawBossBody(enemy, x, y, size);
    if (enemy.stormWard) return drawStormWard(enemy, x, y, size);
    if (enemy.stormMote) return drawStormMote(enemy, x, y, size);
    if (enemy.isElite) {
      ctx.save();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.55 + 0.3 * Math.sin(f * 0.1);
      ctx.beginPath();
      ctx.arc(x, y, size + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (enemy.enemyArt === 'classic') return enemySprites.drawClassicEnemyBody(enemy, x, y, size);
    return enemySprites.drawGerbanBroodVehicle(enemy, x, y, size);
  }

  function normalizeEnemy(enemy) {
    if (!enemy || enemy.hp <= 0) return false;
    if (!Number.isFinite(enemy.x) || !Number.isFinite(enemy.y)) return false;
    if (!Number.isFinite(enemy.size) || enemy.size <= 0) enemy.size = enemy.isBoss ? 34 : 16;
    if (!Number.isFinite(enemy.bobPhase)) enemy.bobPhase = 0;
    return true;
  }

  function drawBarrier(enemy) {
    const f = frame();
    const r = Math.max(8, enemy.rx || enemy.ry || 70);
    const pct = Math.max(0, Math.min(1, (enemy.healHp || 0) / (enemy.healHpMax || 1)));
    const cr = Math.round(0xa8 + (0x3a - 0xa8) * pct);
    const cg = Math.round(0x55 + (0xff - 0x55) * pct);
    const cb = Math.round(0xf7 + (0x66 - 0xf7) * pct);
    const ringCol = 'rgb(' + cr + ',' + cg + ',' + cb + ')';

    ctx.save();
    const pulse = 0.65 + 0.30 * Math.sin(f * 0.08);
    ctx.strokeStyle = ringCol;
    ctx.globalAlpha = 0.20 * pulse;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r + 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = ringCol;
    ctx.globalAlpha = 0.13;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r, 0, Math.PI * 2);
    ctx.fill();

    if (pct < 0.97) {
      ctx.globalAlpha = 0.32 * (1 - pct * 0.5);
      ctx.strokeStyle = ringCol;
      ctx.lineWidth = 1;
      const rot = f * 0.004;
      for (let i = 0; i < 6; i++) {
        const a1 = rot + i * Math.PI / 3;
        const a2 = a1 + Math.PI * 2 / 3;
        ctx.beginPath();
        ctx.moveTo(enemy.x + Math.cos(a1) * r, enemy.y + Math.sin(a1) * r);
        ctx.lineTo(enemy.x + Math.cos(a2) * r, enemy.y + Math.sin(a2) * r);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = ringCol;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r - 2, 0, Math.PI * 2);
    ctx.stroke();

    if (pct < 0.95) {
      const moteN = 10;
      for (let i = 0; i < moteN; i++) {
        const ang = (f * 0.022 + i * Math.PI * 2 / moteN) % (Math.PI * 2);
        const mx = enemy.x + Math.cos(ang) * r;
        const my = enemy.y + Math.sin(ang) * r;
        ctx.fillStyle = '#a855f7';
        ctx.globalAlpha = 0.55 * (1 - pct);
        ctx.beginPath();
        ctx.arc(mx, my, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.textAlign = 'left';
  }

  function drawBurrowed(enemy) {
    const f = frame();
    const bx = enemy.x;
    const by = enemy.y;
    const s = enemy.size;
    const wake = Math.max(0, Math.min(1, (enemy.burrowT || 0) / Math.max(1, enemy.burrowTimer || 240)));
    ctx.fillStyle = '#7a5028';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(bx, by + 4, s * 0.5, s * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.24 + 0.10 * Math.sin(f * 0.12);
    ctx.strokeStyle = '#d0a060';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(bx, by + 7, s * 0.85, s * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#a07050';
    ctx.beginPath();
    ctx.ellipse(bx, by + 2, s * 0.24, s * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.38 + 0.18 * Math.sin(f * 0.18);
    ctx.strokeStyle = wake < 0.35 ? '#ffcc66' : '#d0a060';
    ctx.lineWidth = wake < 0.35 ? 2 : 1.4;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -f * 0.7;
    ctx.beginPath();
    ctx.ellipse(bx, by + 7, s * (1.05 + (1 - wake) * 0.22), s * (0.34 + (1 - wake) * 0.10), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 4; i++) {
      const a = f * 0.05 + i * Math.PI / 2;
      ctx.globalAlpha = 0.20;
      ctx.strokeStyle = '#f0c080';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + Math.cos(a) * s * 0.35, by + 7 + Math.sin(a) * s * 0.10);
      ctx.lineTo(bx + Math.cos(a) * s * 0.92, by + 7 + Math.sin(a) * s * 0.28);
      ctx.stroke();
    }
    if (wake < 0.35) {
      ctx.globalAlpha = 0.58 + 0.20 * Math.sin(f * 0.28);
      ctx.strokeStyle = '#fff2bd';
      ctx.lineWidth = 1.4;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(bx + i * s * 0.22 - 4, by - s * 0.28);
        ctx.lineTo(bx + i * s * 0.22, by - s * 0.42);
        ctx.lineTo(bx + i * s * 0.22 + 4, by - s * 0.28);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (f % 8 === 0) emitParticle(bx + randomRange(-6, 6), by + 6, '#a07050', 1, 3);
  }

  function drawDummy(enemy) {
    if (!normalizeEnemy(enemy)) return;
    drawWithClashCamera(enemy.x, enemy.y, () => drawDummyRaw(enemy));
  }

  function drawDummyRaw(enemy) {
    if (!normalizeEnemy(enemy)) return;
    const f = frame();
    const top = arenaTop();

    if (enemy.isBarrier) {
      drawBarrier(enemy);
      return;
    }
    if (enemy.burrowing) {
      drawBurrowed(enemy);
      return;
    }

    const flying = !!enemy.flying;
    const size = enemy.size;
    const x = enemy.x;
    const y = enemy.y + Math.sin(enemy.bobPhase) * (flying ? 5 : 1.5) - (flying ? 14 : 0);

    if (enemy.polymorphTimer > 0) {
      drawCritter(x, y, size, enemy._critterType || 0);
      if (f % 8 === 0) emitParticle(x + randomRange(-size / 2, size / 2), y - size, '#fff0bb', 1, 2);
      drawHpBar(
        enemy.x,
        Math.max(top + 18, enemy.y - (flying ? 14 : 0) - size - 8),
        enemy.hp,
        enemy.maxHp,
        size + 8,
        enemy.isBoss ? 'boss' : (enemy.isElite ? 'elite' : 'enemy')
      );
      return;
    }

    if (flying) {
      ctx.fillStyle = '#0008';
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y + 12, size * 0.5, size * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      if (f % 4 === 0) {
        emitParticle(x - size * 0.6, y - size * 0.1, enemy.accent || '#fff', 1, 2);
        emitParticle(x + size * 0.6, y - size * 0.1, enemy.accent || '#fff', 1, 2);
      }
    }

    drawEnemyVfxUnder(enemy, x, y, size);
    drawEnemyBody(enemy, x, y, size);
    drawEnemyVfxOver(enemy, x, y, size);

    if (enemy.poisonTimer > 0 && f % 6 === 0) emitParticle(x + randomRange(-size / 2, size / 2), y - size, '#88ff44', 1, 2);
    if (enemy.livingBombTimer > 0) emitParticle(x + randomRange(-size / 2, size / 2), y - size, '#ff8800', 1, 3);
    if (enemy._livingBombTimer > 0 && f % 6 === 0) emitParticle(x + randomRange(-size / 2, size / 2), y - size, '#ff4400', 1, 3);
    if (enemy._igniteStacks && enemy._igniteStacks.length > 0 && f % 8 === 0) emitParticle(x + randomRange(-size / 3, size / 3), y + size * 0.3, '#ff4400', 1, 2);
    if (enemy.doomTimer > 0) emitParticle(x + randomRange(-size / 2, size / 2), y - size, '#aa66cc', 1, 3);

    if (enemy.hitFlash > 0) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = Math.min(0.7, enemy.hitFlash * 0.12);
      ctx.beginPath();
      ctx.ellipse(x, y, size * 0.85, size * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (enemy.hiveShield && enemy.hiveShield.hp > 0) {
      ctx.save();
      const shPct = enemy.hiveShield.hp / enemy.hiveShield.maxHp;
      const pulse = 0.7 + 0.3 * Math.sin(f * 0.1);
      const shieldColor = enemy.hiveShield.color || '#ffdd44';
      const astralWard = !!enemy.hiveShield.astralWard;
      ctx.strokeStyle = shieldColor;
      ctx.globalAlpha = (astralWard ? 0.46 : 0.6) * pulse * Math.max(0.35, shPct);
      ctx.lineWidth = astralWard ? 3 : 4;
      ctx.beginPath();
      ctx.arc(x, y, size + (astralWard ? 8 : 8), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = (astralWard ? 0.055 : 0.15) * pulse * shPct;
      ctx.fillStyle = shieldColor;
      ctx.beginPath();
      ctx.arc(x, y, size + (astralWard ? 6 : 6), 0, Math.PI * 2);
      ctx.fill();
      if (astralWard) {
        ctx.globalAlpha = 0.9;
        ctx.font = 'bold 8px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d8f4ff';
        ctx.fillText('WARD ' + Math.ceil(enemy.hiveShield.hp), x, Math.max(top + 6, y - size - 28));
      }
      ctx.restore();
    }

    if (enemy._stormShieldActive) {
      ctx.save();
      const pulse = 0.68 + 0.32 * Math.sin(f * 0.12);
      const r = size + 12 + Math.sin(f * 0.08) * 2;
      ctx.strokeStyle = '#ffd166';
      ctx.globalAlpha = 0.58 * pulse;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.16 * pulse;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(x, y, r - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.82;
      ctx.font = 'bold 8px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff0a8';
      ctx.fillText('STORM SHIELD', x, Math.max(top + 6, y - size - 30));
      ctx.restore();
    }

    if (enemy.royalCarapaceTimer > 0) {
      ctx.save();
      const pct = 1 - (enemy.royalCarapaceTimer / (enemy.royalCarapaceMax || 1));
      const bw = Math.min(170, Math.max(92, size * 3.2));
      const bh = 10;
      const bx = x - bw / 2;
      const by = Math.max(top + 2, y - size - 28);
      ctx.fillStyle = 'rgba(20,8,6,0.86)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 4);
      ctx.fill();
      ctx.fillStyle = '#ff5533';
      ctx.beginPath();
      ctx.roundRect(bx, by, Math.max(3, bw * pct), bh, 4);
      ctx.fill();
      ctx.strokeStyle = '#ffdd44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx + 0.5, by + 0.5, bw - 1, bh - 1, 4);
      ctx.stroke();
      ctx.font = 'bold 8px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText('HIVE BURST', x, by - 2);
      ctx.restore();
    }

    const enemyHpY = Math.max(top + 18, enemy.y - (flying ? 14 : 0) - size - 8);
    drawHpBar(enemy.x, enemyHpY, enemy.hp, enemy.maxHp, size + 8, enemy.isBoss ? 'boss' : (enemy.isElite ? 'elite' : 'enemy'));
    drawStatusIcons(enemy, enemy.x, enemyHpY - 8);
  }

  return {
    drawBossBody,
    drawEnemyBody,
    drawDummy,
    drawDummyRaw,
  };
}

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { createServer as createNetServer } from 'node:net';

const repoV8Root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const edgePath = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const playtestCases = [
  { name: 'Hunter Trapper', root: 'pierce', spec: 'zaatar', path: 'zaatar_trapper' },
  { name: 'Hunter Beast Mastery', root: 'pierce', spec: 'zaatar', path: 'zaatar_beast' },
  { name: 'Rumman Siege Engineer', root: 'pierce', spec: 'rommana', path: 'rommana_siege' },
  { name: 'Rumman Flying Cannon', root: 'pierce', spec: 'rommana', path: 'rommana_cannon' },
  { name: 'Naana Holy', root: 'healer', spec: 'naana', path: 'naana_holy' },
  { name: 'Naana Discipline', root: 'healer', spec: 'naana', path: 'naana_discipline' },
  { name: 'Bakdounes Resto', root: 'healer', spec: 'bakdounes', path: 'bakdounes_base' },
  { name: 'Habaq Aromancer', root: 'healer', spec: 'habaq', path: 'habaq_base' }
];

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

function createStaticServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      const rawPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const target = resolve(join(repoV8Root, rawPath));
      if (!target.startsWith(repoV8Root)) {
        res.writeHead(403); res.end('Forbidden'); return;
      }
      const body = await readFile(target);
      res.writeHead(200, { 'content-type': mimeTypes[extname(target).toLowerCase()] || 'application/octet-stream' });
      res.end(body);
    } catch (error) {
      res.writeHead(error && error.code === 'ENOENT' ? 404 : 500);
      res.end(String(error && error.message || error));
    }
  });
  return server;
}

class CdpSession {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();
    ws.addEventListener('message', event => this.handleMessage(event.data));
  }

  handleMessage(raw) {
    const msg = JSON.parse(raw);
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve: done, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      else done(msg.result || {});
      return;
    }
    if (msg.method) {
      const listeners = this.events.get(msg.method) || [];
      for (const listener of listeners) listener(msg.params || {});
    }
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolvePromise, rejectPromise) => {
      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise });
    });
  }

  on(method, listener) {
    const listeners = this.events.get(method) || [];
    listeners.push(listener);
    this.events.set(method, listeners);
  }

  close() {
    this.ws.close();
  }
}

async function waitForHttp(url, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch (_) {}
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function connectToPage(port, url) {
  await waitForHttp(`http://127.0.0.1:${port}/json/version`);
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const target = await response.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await once(ws, 'open');
  const cdp = new CdpSession(ws);
  const errors = [];
  cdp.on('Runtime.exceptionThrown', params => {
    errors.push(`Exception: ${params.exceptionDetails?.exception?.description || params.exceptionDetails?.text || JSON.stringify(params.exceptionDetails || {})}`);
  });
  cdp.on('Runtime.consoleAPICalled', params => {
    if (params.type !== 'error') return;
    const text = (params.args || []).map(arg => arg.value || arg.description || '').join(' ');
    errors.push(`Console error: ${text}`);
  });
  cdp.on('Log.entryAdded', params => {
    const text = params.entry?.text || '';
    if (params.entry?.level === 'error' && !text.includes('Failed to load resource')) errors.push(`Log error: ${text}`);
  });
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Log.enable');
  try {
    await waitForPlaytestHook(cdp);
  } catch (error) {
    if (errors.length) console.error(errors.join('\n'));
    throw error;
  }
  return { cdp, errors };
}

async function waitForPlaytestHook(cdp) {
  await waitForCondition(async () => {
    const result = await evaluate(cdp, '!!window.__baqlaArenaV8Playtest');
    return result === true;
  }, 'playtest hook');
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || result.exceptionDetails.exception?.description || 'Runtime.evaluate failed');
  }
  return result.result?.value;
}

async function summary(cdp) {
  return evaluate(cdp, 'window.__baqlaArenaV8Playtest.summary()');
}

async function clickLogical(cdp, x, y) {
  const target = await evaluate(cdp, `(() => {
    const s = window.__baqlaArenaV8Playtest.summary();
    const rect = document.getElementById('game').getBoundingClientRect();
    return { x: rect.left + (${x} / s.width) * rect.width, y: rect.top + (${y} / s.height) * rect.height };
  })()`);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: target.x, y: target.y, button: 'left', buttons: 1, clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: target.x, y: target.y, button: 'left', buttons: 0, clickCount: 1 });
  await delay(90);
}

async function clickRect(cdp, rect) {
  await clickLogical(cdp, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

async function clickCell(cdp, col, row) {
  const point = await evaluate(cdp, `window.__baqlaArenaV8Playtest.cellCenter(${col}, ${row})`);
  await clickLogical(cdp, point.x, point.y);
}

async function waitForCondition(predicate, label, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      if (await predicate()) return;
    } catch (error) {
      lastError = error;
    }
    await delay(80);
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ''}`);
}

async function clickThroughStageStart(cdp) {
  await waitForCondition(async () => (await summary(cdp)).state === 'menu', 'main menu');
  const menuSummary = await summary(cdp);
  await clickLogical(cdp, menuSummary.width / 2, Math.max(menuSummary.height * 0.62, menuSummary.height - 230) + 28);
  await waitForCondition(async () => (await summary(cdp)).state === 'stageSelect', 'stage select');
  await clickLogical(cdp, 54, 189);
  await waitForCondition(async () => (await summary(cdp)).state === 'stageBrief', 'stage brief');
  const h = (await summary(cdp)).height;
  await clickLogical(cdp, 250, h - 93);
  await waitForCondition(async () => (await summary(cdp)).state === 'spellPick', 'spell picker');
  await clickLogical(cdp, 443, 32);
  if ((await summary(cdp)).state !== 'perkPick') {
    await clickLogical(cdp, 250, 132);
    await clickLogical(cdp, 443, 32);
  }
  await waitForCondition(async () => (await summary(cdp)).state === 'perkPick', 'perk picker');
  await clickLogical(cdp, 443, 32);
  if ((await summary(cdp)).state !== 'battle') {
    await clickLogical(cdp, 250, 130);
    await clickLogical(cdp, 443, 32);
  }
  await waitForCondition(async () => {
    const s = await summary(cdp);
    return s.state === 'battle' && s.phase === 'build';
  }, 'battle build phase');
}

async function resetStage(cdp) {
  await evaluate(cdp, 'window.__baqlaArenaV8Playtest.startStage(0)');
  await evaluate(cdp, 'window.__baqlaArenaV8Playtest.setGold(9999)');
  await waitForCondition(async () => {
    const s = await summary(cdp);
    return s.state === 'battle' && s.phase === 'build' && s.gold >= 9999;
  }, 'fresh build stage');
}

async function runUpgradeCase(cdp, testCase, index) {
  await resetStage(cdp);
  const col = 1 + (index % 3);
  const row = 1 + Math.floor((index % 6) / 3);
  await clickCell(cdp, col, row);
  await waitForCondition(async () => (await summary(cdp)).pickerOpen, `${testCase.name} unit picker`);
  const pickerSummary = await summary(cdp);
  const rootRect = pickerSummary.pickerRects.find(rect => rect.pick === testCase.root);
  if (!rootRect) throw new Error(`${testCase.name}: root ${testCase.root} not found in picker`);
  await clickRect(cdp, rootRect);
  await waitForCondition(async () => {
    const s = await summary(cdp);
    return !s.pickerOpen && s.cells.length === 1;
  }, `${testCase.name} placed`);

  await clickCell(cdp, col, row);
  await waitForCondition(async () => (await summary(cdp)).managePanelCell, `${testCase.name} manage panel`);
  await evaluate(cdp, 'window.__baqlaArenaV8Playtest.setGold(9999)');
  await clickUpgrade(cdp, testCase.name, 2);

  await waitForCondition(async () => {
    const rects = (await summary(cdp)).manageRects;
    return Array.isArray(rects.specs) && rects.specs.length > 0;
  }, `${testCase.name} spec cards`);
  const specRect = (await summary(cdp)).manageRects.specs.find(rect => rect.specId === testCase.spec);
  if (!specRect) throw new Error(`${testCase.name}: spec ${testCase.spec} not found`);
  await clickRect(cdp, specRect);

  await waitForCondition(async () => {
    const rects = (await summary(cdp)).manageRects;
    return Array.isArray(rects.paths) && rects.paths.length > 0;
  }, `${testCase.name} path cards`);
  const pathRect = (await summary(cdp)).manageRects.paths.find(rect => rect.pathId === testCase.path);
  if (!pathRect) throw new Error(`${testCase.name}: path ${testCase.path} not found`);
  await clickRect(cdp, pathRect);
  await waitForCondition(async () => {
    const cell = (await summary(cdp)).cells[0];
    return cell && cell.level >= 3 && cell.pathId === testCase.path;
  }, `${testCase.name} L3 path lock`);

  let s = await summary(cdp);
  while (s.cells[0].level < s.maxUnitLevel) {
    await clickUpgrade(cdp, testCase.name, s.cells[0].level + 1);
    s = await summary(cdp);
  }
  await delay(240);
  const finalCell = (await summary(cdp)).cells[0];
  if (!finalCell || finalCell.pathId !== testCase.path || finalCell.level !== (await summary(cdp)).maxUnitLevel) {
    throw new Error(`${testCase.name}: final cell mismatch ${JSON.stringify(finalCell)}`);
  }
  return { name: testCase.name, level: finalCell.level, pathId: finalCell.pathId, specId: finalCell.specId };
}

async function clickUpgrade(cdp, label, targetLevel) {
  await waitForCondition(async () => {
    const rects = (await summary(cdp)).manageRects;
    return !!rects.upgrade;
  }, `${label} upgrade to L${targetLevel}`);
  await clickRect(cdp, (await summary(cdp)).manageRects.upgrade);
  await waitForCondition(async () => {
    const cell = (await summary(cdp)).cells[0];
    return cell && cell.level >= targetLevel;
  }, `${label} reached L${targetLevel}`);
}

function delay(ms) {
  return new Promise(resolvePromise => setTimeout(resolvePromise, ms));
}

async function getFreePort() {
  const server = createNetServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  server.close();
  return port;
}

async function main() {
  if (!existsSync(edgePath)) throw new Error(`Edge not found at ${edgePath}. Set EDGE_PATH to another Chromium executable.`);
  const server = createStaticServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  const debugPort = await getFreePort();
  const profileDir = join(tmpdir(), `baqla-arena-v8-playtest-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });
  const browser = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  let cdp;
  const errors = [];
  try {
    const url = `http://127.0.0.1:${port}/index.html?playtest=1`;
    const page = await connectToPage(debugPort, url);
    cdp = page.cdp;
    errors.push(...page.errors);
    await clickThroughStageStart(cdp);
    const results = [];
    for (let i = 0; i < playtestCases.length; i++) {
      results.push(await runUpgradeCase(cdp, playtestCases[i], i));
      if (page.errors.length) throw new Error(page.errors.join('\n'));
    }
    if (page.errors.length) throw new Error(page.errors.join('\n'));
    console.log(`Real-click upgrade playtest passed for ${results.length} paths:`);
    for (const result of results) {
      console.log(`- ${result.name}: ${result.specId || 'spec'} / ${result.pathId} reached L${result.level}`);
    }
  } finally {
    if (cdp) cdp.close();
    browser.kill();
    server.close();
    try { rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});

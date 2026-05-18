import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARENA_PUBLIC_TEST_BASE_URL, ARENA_VERSION_LABEL } from '../src/data/version.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

const root = process.cwd();
const v8Root = join(root, 'v8');
assert(existsSync(join(v8Root, 'index.html')), 'missing v8/index.html');
assert(existsSync(join(v8Root, 'src', 'main.js')), 'missing v8/src/main.js');
assert(existsSync(join(v8Root, 'src', 'systems', 'arena-runtime.js')), 'missing arena runtime');

const versionSource = readFileSync(join(v8Root, 'src', 'data', 'version.js'), 'utf8');
assert(versionSource.includes(ARENA_VERSION_LABEL), 'version label export is inconsistent');
assert(ARENA_VERSION_LABEL === 'LEGION TD - v8', `unexpected version label ${ARENA_VERSION_LABEL}`);

const mainSource = readFileSync(join(v8Root, 'src', 'main.js'), 'utf8');
assert(mainSource.includes('./systems/arena-runtime.js'), 'main entry no longer imports arena runtime');

const currentCommit = git(['rev-parse', '--short', 'HEAD']);
const privateCommit = process.env.BAQLA_PRIVATE_COMMIT || currentCommit;
assert(/^[0-9a-f]{7,40}$/i.test(privateCommit), `invalid private commit for friend-test link: ${privateCommit}`);

if (process.env.BAQLA_REQUIRE_CLEAN === '1') {
  const status = git(['status', '--short']);
  assert(status.length === 0, `working tree is not clean:\n${status}`);
}

const url = `${ARENA_PUBLIC_TEST_BASE_URL}?arena=25d&v=${privateCommit}`;
console.log(`Friend-test release check passed for ${ARENA_VERSION_LABEL}.`);
console.log(`Current repo commit: ${currentCommit}`);
console.log(`Friend-test link: ${url}`);

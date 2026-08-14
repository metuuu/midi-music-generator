/**
 * The whole suite, run at once.
 *
 *   npm run verify
 *
 * Every step below is a separate process that reads the catalogue and writes
 * nothing, so they have no order between them and no reason to queue. Run in a
 * chain of `&&` they took the sum of their times — eleven and a half minutes,
 * of which one core was busy and eleven were not. Run together they take the
 * longest single step, and `genre-check` is that step by a wide margin.
 *
 * **Output is held and printed whole.** Nine processes writing to one terminal
 * interleave line by line and the result is unreadable, so each step's output is
 * buffered and flushed in one piece when it finishes — headed by its name, and
 * in the order they finish rather than the order they are listed, so a short
 * step is not held behind a long one. The summary at the end is in list order.
 *
 * **Slowest first.** `spawn` starts all of them immediately, but the machine
 * does not have a core per step to give: on a 12-core laptop the last four in
 * the list share whatever is left. Starting the long poles first keeps them off
 * the efficiency cores for the stretch where it costs the most.
 *
 * A step fails if it exits non-zero, and this exits 1 if any of them did — the
 * checks themselves decide what failure means, and none of that is repeated
 * here.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TSX = fileURLToPath(new URL('../node_modules/.bin/tsx', import.meta.url));
const TSC = fileURLToPath(new URL('../node_modules/.bin/tsc', import.meta.url));

interface Step {
  name: string;
  cmd: string;
  args: string[];
}

const STEPS: Step[] = [
  { name: 'genres', cmd: TSX, args: ['src/genre-check.ts'] },
  { name: 'concert', cmd: TSX, args: ['src/concert-check.ts'] },
  { name: 'chaos', cmd: TSX, args: ['src/chaos-check.ts'] },
  { name: 'stage', cmd: TSX, args: ['src/stage-check.ts'] },
  { name: 'notation', cmd: TSX, args: ['src/check-notation.ts'] },
  { name: 'typecheck', cmd: TSC, args: ['--noEmit'] },
  { name: 'rules', cmd: TSX, args: ['src/rules-doc.ts', '--check'] },
  { name: 'audit', cmd: TSX, args: ['src/audit.ts', '40'] },
  { name: 'ensemble', cmd: TSX, args: ['src/ensemble-report.ts', '40'] },
];

interface Result {
  step: Step;
  code: number;
  seconds: number;
}

const run = (step: Step): Promise<Result> => new Promise((resolve) => {
  const started = Date.now();
  const child = spawn(step.cmd, step.args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  const chunks: Buffer[] = [];
  child.stdout.on('data', (c: Buffer) => chunks.push(c));
  child.stderr.on('data', (c: Buffer) => chunks.push(c));
  const done = (code: number) => {
    const seconds = (Date.now() - started) / 1000;
    const body = Buffer.concat(chunks).toString().trimEnd();
    console.log(`\n${'='.repeat(72)}\n== ${step.name}  ${code === 0 ? 'ok' : `FAILED (exit ${code})`}`
      + `  ${seconds.toFixed(1)}s\n${'='.repeat(72)}`);
    if (body) console.log(body);
    resolve({ step, code, seconds });
  };
  // A step that cannot be started at all is a failure of this file, not of the
  // suite, and it has to be as loud as one — a missing binary reported as a
  // failed check would send somebody looking in the wrong place entirely.
  child.on('error', (e) => { chunks.push(Buffer.from(`could not start ${step.cmd}: ${e.message}\n`)); done(127); });
  child.on('close', (code) => done(code ?? 0));
});

const started = Date.now();
console.log(`Running ${STEPS.length} checks in parallel: ${STEPS.map((s) => s.name).join(', ')}`);

const results = await Promise.all(STEPS.map(run));
const wall = (Date.now() - started) / 1000;
const failed = results.filter((r) => r.code !== 0);
const byName = new Map(results.map((r) => [r.step.name, r]));

console.log(`\n${'='.repeat(72)}\n== summary\n${'='.repeat(72)}`);
for (const step of STEPS) {
  const r = byName.get(step.name)!;
  console.log(`  ${r.code === 0 ? 'ok  ' : 'FAIL'}  ${step.name.padEnd(12)} ${r.seconds.toFixed(1)}s`);
}
const serial = results.reduce((a, r) => a + r.seconds, 0);
console.log(`\n  ${wall.toFixed(1)}s wall, ${serial.toFixed(1)}s of work`);
if (failed.length) {
  console.log(`\n  ${failed.length} of ${STEPS.length} failed: ${failed.map((r) => r.step.name).join(', ')}`);
  process.exit(1);
}

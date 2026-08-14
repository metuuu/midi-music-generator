/**
 * How much evidence a check run is allowed to gather.
 *
 *   npm run verify          the quick pass — seconds
 *   npm run verify:full     the whole sweep — minutes
 *
 * The quick pass is the default because the full one is six minutes of writing
 * music nobody listens to, and a check that is too slow to run is a check that
 * does not run. What it must never be is the same suite with the numbers turned
 * down: most assertions in this project are thresholds — "56% stepwise against
 * 23% thirds", "0.24% of 195,163 postures" — measured over a corpus large enough
 * to make the figure steady, and a great many of them end in a clause like
 * `rolled > 0` that holds only because sixty seeds is enough to turn up a draw
 * the catalogue makes rarely. Run those on a tenth of the evidence and they fail
 * for reasons that have nothing to do with the change in front of you, which is
 * worse than slow: it teaches everybody to ignore red.
 *
 * So the split is by what a check *is*, and there are three kinds:
 *
 *  - **Coverage.** The breadth is the catalogue and the seeds are only depth —
 *    "every style in every mode generates". Thin the seeds and every style is
 *    still visited, so it still catches the thing it is for, which is a change
 *    that makes some corner of the catalogue throw. Use `seeds`.
 *  - **Property.** Something that must hold of *every* song, not of the average
 *    one — a spread of zero is byte-identical, a box never changes voices
 *    between sections. One counter-example is the whole result, so a smaller
 *    corpus is a weaker search and never a wrong answer. Use `seeds`.
 *  - **Distribution.** A percentage against a threshold, or a liveness clause
 *    that needs a rare draw to appear at all. There is no honest thin version of
 *    these, so the quick pass declines to run them and says so. Use `deep`.
 *
 * A quick run therefore prints `skip` lines and a closing count, and neither the
 * word `ok` nor the exit status is ever produced by evidence that was not
 * gathered — the same rule `off()` follows for a subject that is switched off.
 */

/** The whole sweep was asked for, on the command line or by the runner. */
export const FULL = process.argv.includes('--full');

/**
 * Seeds for a coverage or property loop: `full` of them in the full sweep, and
 * `quick` — one, unless the loop needs a couple to mean anything — otherwise.
 */
export const seeds = (full: number, quick = 1): number => (FULL ? full : Math.min(quick, full));

/**
 * A reporter for the distribution checks a quick run declines to make.
 *
 * Returns whether to run the block, so the call site is `if (deep('...')) { … }`
 * around the corpus *and* the assertion — a skipped check must not write its
 * songs either, or the quick pass costs what the full one does and reports less.
 */
export const skipped: string[] = [];
export const deep = (label: string): boolean => {
  if (FULL) return true;
  skipped.push(label);
  console.log(`  skip  ${label.padEnd(42)} needs the full sweep`);
  return false;
};

/** The closing line of a quick run, so nobody reads one as the whole sweep. */
export const depthSummary = (): string => {
  if (FULL) return '';
  const what = skipped.length
    ? `${skipped.length} checks skipped and the corpora thinned`
    : 'the corpora thinned';
  return `\nThis was the quick pass — ${what}. Run npm run verify:full before you call it done.`;
};

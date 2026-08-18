/**
 * How much evidence a check run is allowed to gather.
 *
 *   npm run verify              a sample of the catalogue — seconds (the default)
 *   npm run verify -- --standard  every style, one seed each — half a minute
 *   npm run verify:full         the whole sweep — minutes
 *
 * The full sweep is six minutes of writing music nobody listens to, and a check
 * that is too slow to run is a check that does not run. What a cheaper pass must
 * never be is the same suite with the numbers turned down: most assertions in
 * this project are thresholds — "56% stepwise against 23% thirds", "0.24% of
 * 195,163 postures" — measured over a corpus large enough to make the figure
 * steady, and a great many of them end in a clause like `rolled > 0` that holds
 * only because sixty seeds is enough to turn up a draw the catalogue makes
 * rarely. Run those on a tenth of the evidence and they fail for reasons that
 * have nothing to do with the change in front of you, which is worse than slow:
 * it teaches everybody to ignore red.
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
 *    these, so anything short of the full sweep declines to run them and says
 *    so. Use `deep`.
 *
 * ## Why the third tier cuts breadth, and what it stops asking
 *
 * `standard` already runs the coverage sweeps at one seed, so there is no depth
 * left to take. The only way further down is to look at less, and the quick tier
 * does it twice over: `sample` takes every fourth style or venue, in table order
 * so two runs of the same code look at the same quarter, and `deep(…,
 * 'standard')` puts down everything that costs a corpus without being a smoke
 * test. What is left is the question the inner loop actually asks — does this
 * still build, and does the catalogue still generate — answered in the time it
 * takes to read the answer.
 *
 * It is the one tier where a check can be green because it never looked, which
 * is why it says which fraction it took, and is not the sweep. `--standard`
 * and `--full` are the opt-in. Every suite honours the same flags.
 *
 * A pass under the full sweep therefore prints `skip` lines and a closing count,
 * and neither the word `ok` nor the exit status is ever produced by evidence
 * that was not gathered — the same rule `off()` follows for a subject that is
 * switched off.
 */

export type Depth = 'quick' | 'standard' | 'full';

export const DEPTH: Depth = process.argv.includes('--full')
  ? 'full'
  : process.argv.includes('--standard') ? 'standard' : 'quick';

/** The whole sweep was asked for, on the command line or by the runner. */
export const FULL = DEPTH === 'full';

/** One in how many of a catalogue the quick tier looks at. */
export const SAMPLE = 4;

/**
 * Seeds for a coverage or property loop, one count per tier. `standard` is one
 * unless the loop needs a couple to mean anything, and `quick` defaults to it —
 * a loop already down to a single seed has nothing left to give, and the quick
 * tier takes its saving out of `sample` instead.
 */
export const seeds = (full: number, standard = 1, quick = standard): number => (
  DEPTH === 'full' ? full : Math.min(DEPTH === 'quick' ? quick : standard, full)
);

/**
 * A slice of a catalogue for the quick tier, and the whole of it otherwise.
 *
 * Table order rather than a draw, so the quarter a quick run looks at is the
 * same quarter every time: a check that passes here and fails in `verify` should
 * be a difference in the code, never in which styles came up.
 */
export const sample = <T>(xs: readonly T[]): readonly T[] => (
  DEPTH === 'quick' ? xs.filter((_, i) => i % SAMPLE === 0) : xs
);

/**
 * A reporter for the distribution checks a short run declines to make.
 *
 * Returns whether to run the block, so the call site is `if (deep('...')) { … }`
 * around the corpus *and* the assertion — a skipped check must not write its
 * songs either, or the short pass costs what the full one does and reports less.
 *
 * `from` is the cheapest tier that runs it. The default is `full`, for the
 * distributions above; `standard` is for a block that is honest at one seed but
 * still costs a corpus, which is everything the quick tier leaves out.
 */
export const skipped: string[] = [];
export const deep = (label: string, from: 'full' | 'standard' = 'full'): boolean => {
  if (FULL || (from === 'standard' && DEPTH === 'standard')) return true;
  skipped.push(label);
  console.log(`  skip  ${label.padEnd(42)} needs the ${from === 'full' ? 'full sweep' : 'standard pass'}`);
  return false;
};

/** The closing line of a short run, so nobody reads one as the whole sweep. */
export const depthSummary = (): string => {
  if (FULL) return '';
  const what = skipped.length
    ? `${skipped.length} checks skipped and the corpora thinned`
    : 'the corpora thinned';
  const tier = DEPTH === 'quick'
    ? `This was the quick pass — one style in ${SAMPLE}, ${what}.`
    : `This was the standard pass — ${what}.`;
  return `\n${tier} Run npm run verify:full before you call it done.`;
};

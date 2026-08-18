## Git
Don't create git branches. Develop in main.
No git stashing! There can be multiple AIs working so staging unexpectedly causes issues.

## Development
Don't care about backwards compatibility in code and in music generation. We are still developing the app.

## Comments
Don't refer to earlier or redundant code in comments.
Max three sentences comments for really complex things.
Max one sentence for simple things.
No comments about trivial things.

## Tests/verification
Don't run a check unless the change needs it.
- `npm run typecheck` — TypeScript, or a new instrument / room / prop
- `npm run genres` — music: generator, styles, or a genre
- `npm run notation` — Strudel, the grid, or drum tokens
- `npm run concert` — concert hands, cast, or gestures
- `npm run chaos` — chimera mixing
- `npm run stage` — rooms, props, or venues
- `npm run rules:check` — the rule table or docs/rules.md
- `npm run audit` — melody line or range (prints numbers, never fails)
- `npm run ensemble` — voicings or register (prints numbers, never fails)
If you need all, run `npm run verify --quick`.

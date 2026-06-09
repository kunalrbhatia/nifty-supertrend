# ST-ETF Algo — AI Assistant Instructions

## README Update Rule (MANDATORY)
Before finalising any commit, check if changes affect strategy, env, commands, or setup. Update README.md first.

## Project Conventions
- Language: TypeScript strict, ES modules.
- Verification: Code must pass `pnpm verify` (typecheck, lint, test, build).
- Testing: 100% coverage enforced for all modules.
- Timezone: All timestamps must use Asia/Kolkata.
- Config: No process.env outside `src/config/env.ts`.
- State: Holdings in `data/holdings.json`, investment amount in `data/config.json`, paper mode via `.paper` file.
- Commits: Always use `pnpm commit` (git cz) for conventional commits. No emojis.
- Branches: Branch names must follow `type/description` format (e.g., `feat/add-logging`). Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.

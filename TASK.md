# Task: Build opencode-agent-context

## What you're building
An OpenCode plugin that gives the coding agent **incremental, persistent, language-specific memory**. As you work, you can tell the agent "use pattern X because Y" and it writes that rule to a persistent context file tagged by language/framework. On the next session, those rules are automatically injected into the system prompt — so you never have to repeat yourself.

## Core behaviour
- User says something like: `"always use the repository pattern for DB access because it keeps business logic clean"` or `"in Go, prefer table-driven tests"` → plugin detects an explained decision (heuristic: contains "because", "always", "never", "prefer", "use X for Y") and saves it
- Rules are stored in `.opencode/context/` as language/framework-tagged markdown files:
  - `.opencode/context/typescript.md`
  - `.opencode/context/go.md`
  - `.opencode/context/general.md`
  - `.opencode/context/nextjs.md`  
  - etc.
- On every session start, the plugin detects the current project's languages (via file extensions) and injects the relevant context files into the session via `experimental.session.compacting`
- User can also explicitly save a rule with `/remember <rule>` slash command
- User can view current rules with `/context` slash command

## Technical approach
- OpenCode plugin (TypeScript) 
- Detect "remember-worthy" messages using a lightweight heuristic (pattern matching, not LLM call)
- Detect project language from file extensions in the working directory
- Inject rules using `experimental.session.compacting` so they survive compaction
- Use `tool.execute.after` on file reads to detect what language is being worked on
- Store rules as human-readable/editable markdown (not a database)

## Reference materials
See `.context/` directory:
- `opencode-plugin-guide.md` — full plugin API reference
- `opencode-events-reference.md` — all subscribable events
- `typescript-rules.md` — TypeScript coding standards to follow
- `memory-management.md` — patterns for persistent agent memory

## Project structure to create
```
opencode-agent-context/
  src/
    index.ts           # Main plugin export
    detector.ts        # Language detection from file extensions
    rule-extractor.ts  # Heuristic for detecting remember-worthy messages
    context-store.ts   # Read/write rules to .opencode/context/*.md files
    injector.ts        # Build context injection string for compaction hook
  .opencode/
    plugins/
      agent-context.ts # Local plugin file
    context/
      general.md       # Sample general rules (pre-seeded with 2-3 good examples)
      typescript.md    # Sample TypeScript rules (pre-seeded from typescript-rules.md)
  package.json         # npm-publishable as opencode-agent-context
  tsconfig.json
  README.md            # Written as if product is finished and published
  CHANGELOG.md
  .context/            # (already present — reference only, don't ship)
```

## README requirements
Write the README as if the plugin is **already published and popular**. Include:
- Tagline: something like "Your coding agent that actually remembers"
- 1-paragraph description of the problem (agents forget between sessions, you re-explain the same patterns every time)
- Install + quick start
- How rules get saved (automatic detection + `/remember` command)
- How to view/edit rules (they're just markdown files)
- Language detection: which languages are supported out of the box
- Example: show a conversation where the user says something and the rule gets saved, then show how it's injected next session
- Badge placeholders

## Pre-seed the context files
In `.opencode/context/general.md` include sample rules like:
- Prefer explicit error handling over silent failures
- Always explain WHY when making architectural decisions

In `.opencode/context/typescript.md` distill the best rules from `.context/typescript-rules.md` into 5-7 concise rules.

## Self-verification (MANDATORY)
After implementation:
1. `npm run build` / `bun build` passes with 0 errors  
2. `tsc --noEmit` passes
3. Write unit tests for:
   - `rule-extractor.ts`: given sample messages, correctly identifies remember-worthy ones
   - `detector.ts`: given a list of file paths, correctly identifies languages
4. Run the tests and make sure they pass
5. Verify plugin structure matches OpenCode plugin spec (named export, returns hooks object)

## Git & delivery
- Work on `main` branch, trunk-based
- Commit often with clear messages
- At the end: `git push origin main`
- Then notify: `openclaw system event --text "Done: opencode-agent-context built and pushed to main — ready to review" --mode now`

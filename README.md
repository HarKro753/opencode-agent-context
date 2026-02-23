# opencode-agent-context

**Your coding agent that actually remembers.**

[![npm version](https://img.shields.io/npm/v/opencode-agent-context)](https://www.npmjs.com/package/opencode-agent-context)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

You explain a pattern to your coding agent. It nods. Next session, it's gone — you're repeating yourself like it's day one. **opencode-agent-context** fixes that. It gives your OpenCode agent persistent, language-aware memory that survives across sessions, compactions, and restarts. Say it once, and your agent remembers it forever.

## Install

```bash
npm install opencode-agent-context
```

Then register it in your `.opencode/config.json`:

```json
{
  "plugins": {
    "agent-context": {
      "module": "opencode-agent-context"
    }
  }
}
```

## How It Works

### Automatic Rule Detection

Just talk to your agent normally. When you express a preference, convention, or architectural decision, the plugin detects it and saves it automatically.

Trigger phrases like **"always"**, **"never"**, **"prefer"**, **"because"**, **"avoid"**, and **"use X for Y"** are picked up by a lightweight heuristic — no LLM calls, no latency.

### Slash Commands

| Command | Description |
| --- | --- |
| `/remember <rule>` | Explicitly save a rule to persistent context |
| `/context` | View all saved rules, organized by language |

### Persistent Storage

Rules are stored as plain Markdown files in `.opencode/context/`:

```
.opencode/context/
  general.md
  typescript.md
  go.md
  python.md
  nextjs.md
```

Human-readable. Version-controllable. Editable by hand whenever you want.

### Session Injection

On every session start and compaction, the plugin detects your project's languages from file extensions and injects the relevant rules back into the agent's context. Rules tagged `general` are always included.

## Example

**Session 1** — you're working on a TypeScript project:

```
You:   Always use named exports because default exports
       make refactoring harder.

Agent: [continues working]

       ✓ Rule saved to typescript context
```

Behind the scenes, `.opencode/context/typescript.md` now contains:

```markdown
# TypeScript Rules

- Always use named exports because default exports make refactoring harder.
```

**Session 2** — you open the same project:

```
Agent: [automatically has your TypeScript rules in context]

You:   Refactor the auth module.

Agent: [uses named exports, exactly as you specified]
```

No reminders needed.

## Explicit Save

```
You:   /remember in Go, prefer table-driven tests

       ✓ Rule saved to go context
```

## Supported Languages

Detected automatically from file extensions in your project:

| Language | Extensions |
| --- | --- |
| TypeScript | `.ts` `.tsx` `.mts` `.cts` |
| JavaScript | `.js` `.jsx` `.mjs` `.cjs` |
| Go | `.go` |
| Python | `.py` `.pyw` |
| Rust | `.rs` |
| Ruby | `.rb` |
| Java | `.java` |
| Kotlin | `.kt` `.kts` |
| Swift | `.swift` |
| C# | `.cs` |
| C++ | `.cpp` `.cc` `.cxx` `.hpp` `.h` |
| C | `.c` |
| PHP | `.php` |
| Dart | `.dart` |
| Elixir | `.ex` `.exs` |
| Erlang | `.erl` `.hrl` |
| Zig | `.zig` |
| Lua | `.lua` |
| Scala | `.scala` `.sc` |
| Clojure | `.clj` `.cljs` `.cljc` |
| Haskell | `.hs` |

**Frameworks** are also detected: Next.js, React, Vue, Svelte, Astro, Tailwind, Prisma, and Drizzle.

## Editing Rules

Rules are just Markdown. Open any file in `.opencode/context/` and edit directly:

```bash
vim .opencode/context/typescript.md
```

Add, remove, or reword rules however you like. Changes take effect on the next session.

## API

The plugin also exports its internals for programmatic use:

```typescript
import {
  detectLanguagesFromFiles,
  detectLanguageFromFilePath,
  isRememberWorthy,
  extractRule,
  addRule,
  getAllRules,
  buildContextInjection,
} from "opencode-agent-context";
```

## License

MIT

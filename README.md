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

Then register it in your `opencode.json`:

```json
{
  "plugin": ["opencode-agent-context"]
}
```

## How It Works

### The agent reasons about what to remember

After each conversation turn, when the session goes idle, the plugin spins up a **separate LLM session** to analyze what you said. It reasons about your messages and decides which preferences, conventions, or architectural decisions are worth persisting — then saves them automatically.

No keyword matching. No regex heuristics. The LLM decides.

This means natural conversation works:

```
You:   We should probably stop using default exports in this codebase.
       They make refactoring way harder and the DX with auto-imports
       is just worse.

Agent: [works on your request]

       ✓ 1 rule saved to typescript context
```

The plugin understood that was a preference worth remembering — not because you said "always" or "never", but because an LLM reasoned about it.

### Slash Commands

For explicit control, two tools are available:

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `/remember <rule>` | Explicitly save a rule to persistent context |
| `/context`         | View all saved rules, organized by language  |

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

On every compaction, the plugin detects your project's languages from file extensions and injects the relevant rules back into the agent's context. Rules tagged `general` are always included.

## Example

**Session 1** — you're working on a TypeScript project:

```
You:   We use Drizzle for the database layer in this project, not Prisma.
       And always handle errors explicitly — no silent catches.

Agent: Got it, I'll use Drizzle for all DB operations.

       ✓ 2 rules saved to typescript, general context
```

Behind the scenes, the plugin:

1. Waited for the session to go idle
2. Spun up a throwaway LLM session
3. Asked it: "Analyze these user messages. What rules should be persisted?"
4. Got back: `[{"rule": "Use Drizzle for the database layer, not Prisma.", "language": "typescript"}, {"rule": "Always handle errors explicitly — no silent catches.", "language": "general"}]`
5. Saved both rules and cleaned up the extraction session

`.opencode/context/typescript.md` now contains:

```markdown
# Typescript Rules

- Use Drizzle for the database layer, not Prisma.
```

**Session 2** — you open the same project:

```
Agent: [automatically has your rules injected into context]

You:   Add a new users table with email and name fields.

Agent: [uses Drizzle, handles errors explicitly — exactly as you specified]
```

No reminders needed.

## Explicit Save

```
You:   /remember in Go, prefer table-driven tests

       ✓ Rule saved to go context
```

## Architecture

```
┌──────────────────────────────────────────────────┐
│  User's conversation session                      │
│                                                   │
│  You: "prefer named exports because..."           │
│  Agent: [works on your request]                   │
│  ...session goes idle...                          │
└───────────────────┬──────────────────────────────┘
                    │ session.idle event
                    ▼
┌──────────────────────────────────────────────────┐
│  Plugin: rule extraction                          │
│                                                   │
│  1. Collect user messages from this session        │
│  2. Create throwaway LLM session                  │
│  3. Prompt: "Extract rules from these messages"   │
│  4. Parse JSON response                           │
│  5. Save rules to .opencode/context/*.md          │
│  6. Delete throwaway session                      │
└──────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│  Next session / compaction                        │
│                                                   │
│  experimental.session.compacting hook injects     │
│  saved rules back into the agent's context        │
└──────────────────────────────────────────────────┘
```

## Supported Languages

Detected automatically from file extensions in your project:

| Language   | Extensions                      |
| ---------- | ------------------------------- |
| TypeScript | `.ts` `.tsx` `.mts` `.cts`      |
| JavaScript | `.js` `.jsx` `.mjs` `.cjs`      |
| Go         | `.go`                           |
| Python     | `.py` `.pyw`                    |
| Rust       | `.rs`                           |
| Ruby       | `.rb`                           |
| Java       | `.java`                         |
| Kotlin     | `.kt` `.kts`                    |
| Swift      | `.swift`                        |
| C#         | `.cs`                           |
| C++        | `.cpp` `.cc` `.cxx` `.hpp` `.h` |
| C          | `.c`                            |
| PHP        | `.php`                          |
| Dart       | `.dart`                         |
| Elixir     | `.ex` `.exs`                    |
| Erlang     | `.erl` `.hrl`                   |
| Zig        | `.zig`                          |
| Lua        | `.lua`                          |
| Scala      | `.scala` `.sc`                  |
| Clojure    | `.clj` `.cljs` `.cljc`          |
| Haskell    | `.hs`                           |

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
  extractRule,
  addRule,
  getAllRules,
  buildContextInjection,
  buildExtractionPrompt,
  parseExtractionResponse,
} from "opencode-agent-context";
```

## License

MIT

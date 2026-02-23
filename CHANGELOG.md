# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-23

### Added

- Automatic detection of remember-worthy messages using lightweight heuristic pattern matching.
- Persistent rule storage as Markdown files in `.opencode/context/`.
- Language detection from file extensions (21 languages supported).
- Framework detection for Next.js, React, Vue, Svelte, Astro, Tailwind, Prisma, and Drizzle.
- Language-from-message detection (e.g., "in TypeScript, prefer...").
- `/remember <rule>` slash command for explicit rule saving.
- `/context` slash command for viewing all saved rules.
- Session compaction injection via `experimental.session.compacting` hook.
- Active language tracking via `tool.execute.after` on file reads.
- Duplicate rule prevention.
- Pre-seeded context files for general and TypeScript rules.
- Full TypeScript type declarations and source maps.

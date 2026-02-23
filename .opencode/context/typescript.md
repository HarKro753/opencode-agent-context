# TypeScript Rules

- Write strongly typed code and avoid the `any` type — use `unknown` with type narrowing instead.
- Use `import type { ... }` when importing symbols only as types, and `export type` when re-exporting types.
- Prefer named exports over default exports for better refactoring support and tree-shaking.
- Use `const` by default, `let` only when reassignment is necessary, never `var`.
- Prefer explicit `if/else` blocks over inline ternary operators for complex conditional logic.
- Write pure functions where possible — avoid side effects and mutations.
- Colocate tests with source files (e.g., `Component.tsx` and `Component.test.tsx` in the same directory).

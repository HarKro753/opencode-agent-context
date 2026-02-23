import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ContextStore } from "./context-store.js";

const TEST_ROOT = join(tmpdir(), `oac-test-${Date.now()}`);
const CONTEXT_DIR = join(TEST_ROOT, ".opencode", "context");

beforeEach(() => {
  mkdirSync(TEST_ROOT, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_ROOT, { recursive: true, force: true });
});

describe("readRules", () => {
  it("returns empty array when no context file exists", () => {
    const rules = ContextStore.readRules(TEST_ROOT, "typescript");
    expect(rules).toEqual([]);
  });

  it("reads rules from an existing markdown file", () => {
    mkdirSync(CONTEXT_DIR, { recursive: true });
    writeFileSync(
      join(CONTEXT_DIR, "typescript.md"),
      "# TypeScript Rules\n\n- Always use named exports.\n- Prefer const over let.\n",
      "utf-8",
    );

    const rules = ContextStore.readRules(TEST_ROOT, "typescript");
    expect(rules).toEqual([
      "Always use named exports.",
      "Prefer const over let.",
    ]);
  });

  it("ignores non-list lines in markdown", () => {
    mkdirSync(CONTEXT_DIR, { recursive: true });
    writeFileSync(
      join(CONTEXT_DIR, "general.md"),
      "# General Rules\n\nSome intro text.\n\n- Rule one.\n\nMore text.\n\n- Rule two.\n",
      "utf-8",
    );

    const rules = ContextStore.readRules(TEST_ROOT, "general");
    expect(rules).toEqual(["Rule one.", "Rule two."]);
  });

  it("handles asterisk-style list items", () => {
    mkdirSync(CONTEXT_DIR, { recursive: true });
    writeFileSync(
      join(CONTEXT_DIR, "go.md"),
      "# Go Rules\n\n* Prefer table-driven tests.\n* Use error wrapping.\n",
      "utf-8",
    );

    const rules = ContextStore.readRules(TEST_ROOT, "go");
    expect(rules).toEqual(["Prefer table-driven tests.", "Use error wrapping."]);
  });

  it("skips empty list items", () => {
    mkdirSync(CONTEXT_DIR, { recursive: true });
    writeFileSync(
      join(CONTEXT_DIR, "python.md"),
      "# Python Rules\n\n- \n- Valid rule.\n-  \n",
      "utf-8",
    );

    const rules = ContextStore.readRules(TEST_ROOT, "python");
    expect(rules).toEqual(["Valid rule."]);
  });
});

describe("addRule", () => {
  it("creates context dir and file when they do not exist", () => {
    ContextStore.addRule(TEST_ROOT, "typescript", "Use strict mode.");

    expect(existsSync(CONTEXT_DIR)).toBe(true);
    expect(existsSync(join(CONTEXT_DIR, "typescript.md"))).toBe(true);

    const content = readFileSync(join(CONTEXT_DIR, "typescript.md"), "utf-8");
    expect(content).toContain("# Typescript Rules");
    expect(content).toContain("- Use strict mode.");
  });

  it("appends rule to existing file", () => {
    mkdirSync(CONTEXT_DIR, { recursive: true });
    writeFileSync(
      join(CONTEXT_DIR, "go.md"),
      "# Go Rules\n\n- Existing rule.\n",
      "utf-8",
    );

    ContextStore.addRule(TEST_ROOT, "go", "New rule here.");

    const content = readFileSync(join(CONTEXT_DIR, "go.md"), "utf-8");
    expect(content).toContain("- Existing rule.");
    expect(content).toContain("- New rule here.");
  });

  it("prevents duplicate rules (case-insensitive)", () => {
    ContextStore.addRule(TEST_ROOT, "general", "Handle errors explicitly.");
    ContextStore.addRule(TEST_ROOT, "general", "handle errors explicitly.");
    ContextStore.addRule(TEST_ROOT, "general", "HANDLE ERRORS EXPLICITLY.");

    const rules = ContextStore.readRules(TEST_ROOT, "general");
    expect(rules).toHaveLength(1);
  });

  it("sanitizes language names to safe filenames", () => {
    ContextStore.addRule(TEST_ROOT, "C++", "Use smart pointers.");

    expect(existsSync(join(CONTEXT_DIR, "c.md"))).toBe(true);
  });

  it("handles multiple languages independently", () => {
    ContextStore.addRule(TEST_ROOT, "typescript", "TS rule.");
    ContextStore.addRule(TEST_ROOT, "go", "Go rule.");
    ContextStore.addRule(TEST_ROOT, "python", "Python rule.");

    expect(ContextStore.readRules(TEST_ROOT, "typescript")).toEqual(["TS rule."]);
    expect(ContextStore.readRules(TEST_ROOT, "go")).toEqual(["Go rule."]);
    expect(ContextStore.readRules(TEST_ROOT, "python")).toEqual(["Python rule."]);
  });
});

describe("getAllRules", () => {
  it("returns empty object when no context dir exists", () => {
    expect(ContextStore.getAllRules(TEST_ROOT)).toEqual({});
  });

  it("returns all rules grouped by language", () => {
    ContextStore.addRule(TEST_ROOT, "typescript", "Use named exports.");
    ContextStore.addRule(TEST_ROOT, "go", "Prefer table-driven tests.");
    ContextStore.addRule(TEST_ROOT, "general", "Handle errors explicitly.");

    const allRules = ContextStore.getAllRules(TEST_ROOT);
    expect(Object.keys(allRules).sort()).toEqual(["general", "go", "typescript"]);
    expect(allRules["typescript"]).toEqual(["Use named exports."]);
    expect(allRules["go"]).toEqual(["Prefer table-driven tests."]);
    expect(allRules["general"]).toEqual(["Handle errors explicitly."]);
  });

  it("omits languages with no rules", () => {
    mkdirSync(CONTEXT_DIR, { recursive: true });
    writeFileSync(join(CONTEXT_DIR, "empty.md"), "# Empty Rules\n\n", "utf-8");
    ContextStore.addRule(TEST_ROOT, "typescript", "A real rule.");

    const allRules = ContextStore.getAllRules(TEST_ROOT);
    expect(allRules).not.toHaveProperty("empty");
    expect(allRules).toHaveProperty("typescript");
  });
});

describe("getContextFileContent", () => {
  it("returns undefined when file does not exist", () => {
    expect(ContextStore.getContextFileContent(TEST_ROOT, "nonexistent")).toBeUndefined();
  });

  it("returns full file content", () => {
    const expected = "# TypeScript Rules\n\n- A rule.\n";
    mkdirSync(CONTEXT_DIR, { recursive: true });
    writeFileSync(join(CONTEXT_DIR, "typescript.md"), expected, "utf-8");

    const content = ContextStore.getContextFileContent(TEST_ROOT, "typescript");
    expect(content).toBe(expected);
  });
});

describe("listContextFiles", () => {
  it("returns empty array when dir does not exist", () => {
    expect(ContextStore.listContextFiles(TEST_ROOT)).toEqual([]);
  });

  it("lists languages from existing files", () => {
    ContextStore.addRule(TEST_ROOT, "typescript", "Rule.");
    ContextStore.addRule(TEST_ROOT, "go", "Rule.");
    ContextStore.addRule(TEST_ROOT, "python", "Rule.");

    const files = ContextStore.listContextFiles(TEST_ROOT);
    expect(files.sort()).toEqual(["go", "python", "typescript"]);
  });

  it("only lists .md files", () => {
    mkdirSync(CONTEXT_DIR, { recursive: true });
    writeFileSync(join(CONTEXT_DIR, "typescript.md"), "# TS\n", "utf-8");
    writeFileSync(join(CONTEXT_DIR, "notes.txt"), "not a rule\n", "utf-8");

    const files = ContextStore.listContextFiles(TEST_ROOT);
    expect(files).toEqual(["typescript"]);
  });
});

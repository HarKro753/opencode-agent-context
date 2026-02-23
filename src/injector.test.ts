import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Injector } from "./injector.js";
import { ContextStore } from "./context-store.js";

const TEST_ROOT = join(tmpdir(), `oac-injector-test-${Date.now()}`);
const CONTEXT_DIR = join(TEST_ROOT, ".opencode", "context");

beforeEach(() => {
  mkdirSync(TEST_ROOT, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_ROOT, { recursive: true, force: true });
});

describe("buildContextInjection", () => {
  it("returns empty string when no context files exist", () => {
    const result = Injector.buildContextInjection(TEST_ROOT, ["typescript"]);
    expect(result).toBe("");
  });

  it("always includes general rules", () => {
    ContextStore.addRule(TEST_ROOT, "general", "Handle errors explicitly.");
    ContextStore.addRule(TEST_ROOT, "typescript", "Use named exports.");

    const result = Injector.buildContextInjection(TEST_ROOT, []);
    expect(result).toContain("Handle errors explicitly.");
    expect(result).not.toContain("Use named exports.");
  });

  it("includes rules for active languages", () => {
    ContextStore.addRule(TEST_ROOT, "typescript", "Use named exports.");
    ContextStore.addRule(TEST_ROOT, "go", "Prefer table-driven tests.");
    ContextStore.addRule(TEST_ROOT, "python", "Use type hints.");

    const result = Injector.buildContextInjection(TEST_ROOT, ["typescript", "go"]);
    expect(result).toContain("Use named exports.");
    expect(result).toContain("Prefer table-driven tests.");
    expect(result).not.toContain("Use type hints.");
  });

  it("includes header with instructions", () => {
    ContextStore.addRule(TEST_ROOT, "general", "A rule.");

    const result = Injector.buildContextInjection(TEST_ROOT, []);
    expect(result).toContain("Agent Context");
    expect(result).toContain("Remembered Rules");
    expect(result).toContain("Follow these rules");
  });

  it("includes both general and language-specific rules", () => {
    ContextStore.addRule(TEST_ROOT, "general", "Explain decisions.");
    ContextStore.addRule(TEST_ROOT, "typescript", "Use strict mode.");

    const result = Injector.buildContextInjection(TEST_ROOT, ["typescript"]);
    expect(result).toContain("Explain decisions.");
    expect(result).toContain("Use strict mode.");
  });

  it("skips empty context files", () => {
    mkdirSync(CONTEXT_DIR, { recursive: true });
    writeFileSync(join(CONTEXT_DIR, "empty.md"), "", "utf-8");
    writeFileSync(join(CONTEXT_DIR, "whitespace.md"), "   \n  \n", "utf-8");
    ContextStore.addRule(TEST_ROOT, "general", "Real rule.");

    const result = Injector.buildContextInjection(TEST_ROOT, ["empty", "whitespace"]);
    expect(result).toContain("Real rule.");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("buildCompactContextString", () => {
  it("returns empty array when no context exists", () => {
    const result = Injector.buildCompactContextString(TEST_ROOT, ["typescript"]);
    expect(result).toEqual([]);
  });

  it("returns array with single injection string", () => {
    ContextStore.addRule(TEST_ROOT, "general", "A rule.");

    const result = Injector.buildCompactContextString(TEST_ROOT, []);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("A rule.");
  });

  it("contains all relevant rules in a single string", () => {
    ContextStore.addRule(TEST_ROOT, "general", "General rule.");
    ContextStore.addRule(TEST_ROOT, "typescript", "TS rule.");

    const result = Injector.buildCompactContextString(TEST_ROOT, ["typescript"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("General rule.");
    expect(result[0]).toContain("TS rule.");
  });
});

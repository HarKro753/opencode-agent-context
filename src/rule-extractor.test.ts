import { describe, it, expect } from "vitest";
import {
  isRememberWorthy,
  extractRule,
  extractRuleWithLanguage,
} from "./rule-extractor.js";
import { detectLanguageFromMessage } from "./detector.js";

describe("isRememberWorthy", () => {
  it("detects messages with 'because'", () => {
    expect(
      isRememberWorthy(
        "use the repository pattern because it keeps business logic clean",
      ),
    ).toBe(true);
  });

  it("detects messages with 'always'", () => {
    expect(isRememberWorthy("always use named exports in TypeScript")).toBe(
      true,
    );
  });

  it("detects messages with 'never'", () => {
    expect(
      isRememberWorthy("never use var in TypeScript, prefer const or let"),
    ).toBe(true);
  });

  it("detects messages with 'prefer'", () => {
    expect(isRememberWorthy("prefer table-driven tests in Go code")).toBe(true);
  });

  it("detects messages with 'avoid'", () => {
    expect(isRememberWorthy("avoid using the any type in TypeScript")).toBe(
      true,
    );
  });

  it("detects 'use X for Y' pattern", () => {
    expect(
      isRememberWorthy("use zod for runtime validation of API inputs"),
    ).toBe(true);
  });

  it("detects 'don't use' pattern", () => {
    expect(
      isRememberWorthy(
        "don't use default exports because they make refactoring harder",
      ),
    ).toBe(true);
  });

  it("detects 'instead of' pattern", () => {
    expect(
      isRememberWorthy(
        "use explicit error handling instead of try/catch everywhere",
      ),
    ).toBe(true);
  });

  it("detects 'make sure to' pattern", () => {
    expect(
      isRememberWorthy("make sure to run tests before committing any changes"),
    ).toBe(true);
  });

  it("detects 'rule:' pattern", () => {
    expect(
      isRememberWorthy("rule: all API responses must include a timestamp"),
    ).toBe(true);
  });

  it("rejects short messages", () => {
    expect(isRememberWorthy("use const")).toBe(false);
  });

  it("rejects empty messages", () => {
    expect(isRememberWorthy("")).toBe(false);
    expect(isRememberWorthy("   ")).toBe(false);
  });

  it("rejects simple acknowledgements", () => {
    expect(isRememberWorthy("ok")).toBe(false);
    expect(isRememberWorthy("thanks")).toBe(false);
    expect(isRememberWorthy("got it")).toBe(false);
    expect(isRememberWorthy("yes")).toBe(false);
  });

  it("rejects questions", () => {
    expect(
      isRememberWorthy("what is the best pattern for error handling?"),
    ).toBe(false);
    expect(isRememberWorthy("how do I use the repository pattern?")).toBe(
      false,
    );
  });

  it("rejects command-like messages", () => {
    expect(isRememberWorthy("fix the type error in user.ts")).toBe(false);
    expect(isRememberWorthy("run the test suite")).toBe(false);
    expect(isRememberWorthy("build the project")).toBe(false);
  });

  it("rejects help requests even with trigger words", () => {
    expect(isRememberWorthy("can you always check for null?")).toBe(false);
  });

  it("rejects messages that are too long", () => {
    const longMessage = "always " + "x".repeat(500);
    expect(isRememberWorthy(longMessage)).toBe(false);
  });

  it("handles a realistic conversation flow", () => {
    expect(isRememberWorthy("hey can you help me with this?")).toBe(false);
    expect(
      isRememberWorthy(
        "always use the repository pattern for DB access because it keeps business logic clean",
      ),
    ).toBe(true);
    expect(isRememberWorthy("in Go, prefer table-driven tests")).toBe(true);
    expect(isRememberWorthy("looks good, ship it")).toBe(false);
  });
});

describe("extractRule", () => {
  it("capitalizes the first letter", () => {
    expect(extractRule("use const by default")).toBe("Use const by default.");
  });

  it("adds trailing period if missing", () => {
    expect(extractRule("Use const by default")).toBe("Use const by default.");
  });

  it("preserves existing trailing period", () => {
    expect(extractRule("Use const by default.")).toBe("Use const by default.");
  });

  it("preserves existing trailing exclamation", () => {
    expect(extractRule("Never use var!")).toBe("Never use var!");
  });

  it("strips 'remember that' prefix", () => {
    expect(extractRule("remember that we use named exports")).toBe(
      "We use named exports.",
    );
  });

  it("strips 'from now on' prefix", () => {
    expect(extractRule("from now on, use strict mode")).toBe(
      "Use strict mode.",
    );
  });

  it("strips 'going forward' prefix", () => {
    expect(extractRule("going forward, prefer async/await")).toBe(
      "Prefer async/await.",
    );
  });

  it("strips 'note that' prefix", () => {
    expect(extractRule("note that we always validate inputs")).toBe(
      "We always validate inputs.",
    );
  });

  it("strips 'in this project' prefix", () => {
    expect(extractRule("in this project, use ESM imports")).toBe(
      "Use ESM imports.",
    );
  });
});

describe("extractRuleWithLanguage", () => {
  it("detects language from message mentioning TypeScript", () => {
    const result = extractRuleWithLanguage(
      "in TypeScript, always use strict mode",
      detectLanguageFromMessage,
    );
    expect(result.language).toBe("typescript");
    expect(result.text).toBe("In TypeScript, always use strict mode.");
  });

  it("detects language from message mentioning Go", () => {
    const result = extractRuleWithLanguage(
      "in Go, prefer table-driven tests",
      detectLanguageFromMessage,
    );
    expect(result.language).toBe("go");
    expect(result.text).toBe("In Go, prefer table-driven tests.");
  });

  it("returns undefined language for generic messages", () => {
    const result = extractRuleWithLanguage(
      "always explain architectural decisions",
      detectLanguageFromMessage,
    );
    expect(result.language).toBeUndefined();
    expect(result.text).toBe("Always explain architectural decisions.");
  });
});

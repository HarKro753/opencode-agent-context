import { describe, it, expect } from "vitest";
import { RuleReasoner } from "./rule-reasoner.js";

describe("getSystemPrompt", () => {
  it("returns a non-empty string", () => {
    const prompt = RuleReasoner.getSystemPrompt();
    expect(prompt.length).toBeGreaterThan(100);
  });

  it("instructs the LLM to respond with JSON", () => {
    const prompt = RuleReasoner.getSystemPrompt();
    expect(prompt).toContain("JSON");
  });

  it("tells the LLM NOT to extract transient instructions", () => {
    const prompt = RuleReasoner.getSystemPrompt();
    expect(prompt).toContain("Do NOT extract");
    expect(prompt).toContain("fix this bug");
  });

  it("mentions the expected response shape", () => {
    const prompt = RuleReasoner.getSystemPrompt();
    expect(prompt).toContain('"rule"');
    expect(prompt).toContain('"language"');
  });
});

describe("buildExtractionPrompt", () => {
  it("includes user messages", () => {
    const prompt = RuleReasoner.buildExtractionPrompt(
      ["always use named exports", "prefer const over let"],
      [],
    );
    expect(prompt).toContain("always use named exports");
    expect(prompt).toContain("prefer const over let");
  });

  it("numbers messages sequentially", () => {
    const prompt = RuleReasoner.buildExtractionPrompt(
      ["first message", "second message"],
      [],
    );
    expect(prompt).toContain("[1] first message");
    expect(prompt).toContain("[2] second message");
  });

  it("includes existing rules when provided", () => {
    const prompt = RuleReasoner.buildExtractionPrompt(
      ["some message"],
      ["Existing rule one.", "Existing rule two."],
    );
    expect(prompt).toContain("Already saved rules");
    expect(prompt).toContain("Existing rule one.");
    expect(prompt).toContain("Existing rule two.");
  });

  it("omits existing rules section when empty", () => {
    const prompt = RuleReasoner.buildExtractionPrompt(["some message"], []);
    expect(prompt).not.toContain("Already saved rules");
  });

  it("ends with extraction instruction", () => {
    const prompt = RuleReasoner.buildExtractionPrompt(["msg"], []);
    expect(prompt).toContain("JSON array");
  });
});

describe("parseExtractionResponse", () => {
  it("parses a clean JSON array", () => {
    const response = `[{"rule": "Always use named exports.", "language": "typescript"}]`;
    const result = RuleReasoner.parseExtractionResponse(response);
    expect(result).toEqual([
      { rule: "Always use named exports.", language: "typescript" },
    ]);
  });

  it("parses multiple rules", () => {
    const response = `[
      {"rule": "Use named exports.", "language": "typescript"},
      {"rule": "Prefer table-driven tests.", "language": "go"},
      {"rule": "Handle errors explicitly.", "language": "general"}
    ]`;
    const result = RuleReasoner.parseExtractionResponse(response);
    expect(result).toHaveLength(3);
    expect(result[0]!.language).toBe("typescript");
    expect(result[1]!.language).toBe("go");
    expect(result[2]!.language).toBe("general");
  });

  it("returns empty array for '[]'", () => {
    expect(RuleReasoner.parseExtractionResponse("[]")).toEqual([]);
  });

  it("handles markdown code fences", () => {
    const response = '```json\n[{"rule": "Use strict mode.", "language": "typescript"}]\n```';
    const result = RuleReasoner.parseExtractionResponse(response);
    expect(result).toHaveLength(1);
    expect(result[0]!.rule).toBe("Use strict mode.");
  });

  it("handles code fence without json tag", () => {
    const response = '```\n[{"rule": "Use strict mode.", "language": "typescript"}]\n```';
    const result = RuleReasoner.parseExtractionResponse(response);
    expect(result).toHaveLength(1);
  });

  it("handles surrounding text around JSON", () => {
    const response =
      'Here are the rules I found:\n[{"rule": "Use named exports.", "language": "typescript"}]\nThat is all.';
    const result = RuleReasoner.parseExtractionResponse(response);
    expect(result).toHaveLength(1);
    expect(result[0]!.rule).toBe("Use named exports.");
  });

  it("defaults language to 'general' when missing", () => {
    const response = '[{"rule": "Handle errors."}]';
    const result = RuleReasoner.parseExtractionResponse(response);
    expect(result).toHaveLength(1);
    expect(result[0]!.language).toBe("general");
  });

  it("lowercases language", () => {
    const response = '[{"rule": "Use strict.", "language": "TypeScript"}]';
    const result = RuleReasoner.parseExtractionResponse(response);
    expect(result[0]!.language).toBe("typescript");
  });

  it("skips items with empty rule", () => {
    const response = '[{"rule": "", "language": "typescript"}, {"rule": "Valid.", "language": "go"}]';
    const result = RuleReasoner.parseExtractionResponse(response);
    expect(result).toHaveLength(1);
    expect(result[0]!.rule).toBe("Valid.");
  });

  it("skips items without rule field", () => {
    const response = '[{"text": "not a rule"}, {"rule": "Valid.", "language": "go"}]';
    const result = RuleReasoner.parseExtractionResponse(response);
    expect(result).toHaveLength(1);
  });

  it("returns empty array for completely invalid JSON", () => {
    expect(RuleReasoner.parseExtractionResponse("this is not json at all")).toEqual([]);
  });

  it("returns empty array for a JSON object (not array)", () => {
    expect(RuleReasoner.parseExtractionResponse('{"rule": "test"}')).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(RuleReasoner.parseExtractionResponse("")).toEqual([]);
  });

  it("trims whitespace from rules", () => {
    const response = '[{"rule": "  Use named exports.  ", "language": "typescript"}]';
    const result = RuleReasoner.parseExtractionResponse(response);
    expect(result[0]!.rule).toBe("Use named exports.");
  });

  it("handles real-world LLM response format", () => {
    const response = `Based on the conversation, I identified the following rules:

\`\`\`json
[
  {
    "rule": "Always use named exports because default exports make refactoring harder.",
    "language": "typescript"
  },
  {
    "rule": "Prefer explicit error handling over try/catch blocks.",
    "language": "general"
  }
]
\`\`\`

These rules capture the user's stated preferences.`;

    const result = RuleReasoner.parseExtractionResponse(response);
    expect(result).toHaveLength(2);
    expect(result[0]!.rule).toContain("named exports");
    expect(result[1]!.rule).toContain("error handling");
  });
});

describe("normalizeRule", () => {
  it("capitalizes the first letter", () => {
    expect(RuleReasoner.normalizeRule("use const by default")).toBe("Use const by default.");
  });

  it("adds trailing period if missing", () => {
    expect(RuleReasoner.normalizeRule("Use const by default")).toBe("Use const by default.");
  });

  it("preserves existing trailing period", () => {
    expect(RuleReasoner.normalizeRule("Use const by default.")).toBe("Use const by default.");
  });

  it("preserves existing trailing exclamation", () => {
    expect(RuleReasoner.normalizeRule("Never use var!")).toBe("Never use var!");
  });

  it("strips 'remember that' prefix", () => {
    expect(RuleReasoner.normalizeRule("remember that we use named exports")).toBe(
      "We use named exports.",
    );
  });

  it("strips 'from now on' prefix", () => {
    expect(RuleReasoner.normalizeRule("from now on, use strict mode")).toBe(
      "Use strict mode.",
    );
  });

  it("strips 'going forward' prefix", () => {
    expect(RuleReasoner.normalizeRule("going forward, prefer async/await")).toBe(
      "Prefer async/await.",
    );
  });

  it("strips 'note that' prefix", () => {
    expect(RuleReasoner.normalizeRule("note that we always validate inputs")).toBe(
      "We always validate inputs.",
    );
  });

  it("strips 'in this project' prefix", () => {
    expect(RuleReasoner.normalizeRule("in this project, use ESM imports")).toBe(
      "Use ESM imports.",
    );
  });

  it("handles 'remember:' with colon", () => {
    expect(RuleReasoner.normalizeRule("remember: always handle errors")).toBe(
      "Always handle errors.",
    );
  });

  it("trims whitespace", () => {
    expect(RuleReasoner.normalizeRule("  use strict mode  ")).toBe("Use strict mode.");
  });

  it("handles already-clean rules", () => {
    expect(RuleReasoner.normalizeRule("Always use named exports.")).toBe(
      "Always use named exports.",
    );
  });

  it("handles rules with multiple sentences", () => {
    expect(RuleReasoner.normalizeRule("Use named exports. They are easier to refactor.")).toBe(
      "Use named exports. They are easier to refactor.",
    );
  });
});

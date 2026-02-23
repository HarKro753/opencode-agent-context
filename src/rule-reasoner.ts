import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtractedRuleFromLLM, RawRuleItem } from "./models.js";

export namespace RuleReasoner {
  const PREAMBLE_PATTERNS: readonly RegExp[] = [
    /^(?:remember\s*(?:that\s*)?:?\s*)/i,
    /^(?:note\s*(?:that\s*)?:?\s*)/i,
    /^(?:from\s+now\s+on\s*,?\s*)/i,
    /^(?:going\s+forward\s*,?\s*)/i,
    /^(?:in\s+this\s+project\s*,?\s*)/i,
  ];

  let cachedSystemPrompt: string | undefined;

  function loadSystemPrompt(): string {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    return readFileSync(join(currentDir, "system-prompt.txt"), "utf-8").trim();
  }

  function extractJsonString(text: string): string {
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
      return fenceMatch[1]!.trim();
    }

    const arrayStart = text.indexOf("[");
    const arrayEnd = text.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      return text.slice(arrayStart, arrayEnd + 1);
    }

    return text;
  }

  function isValidRuleItem(item: unknown): item is RawRuleItem {
    return (
      typeof item === "object" &&
      item !== null &&
      "rule" in item &&
      typeof (item as RawRuleItem).rule === "string"
    );
  }

  function toExtractedRule(item: RawRuleItem): ExtractedRuleFromLLM {
    const rule = (item.rule as string).trim();
    const language = typeof item.language === "string"
      ? item.language.toLowerCase()
      : "general";

    return { rule, language };
  }

  function stripPreamble(text: string): string {
    let result = text;
    for (const pattern of PREAMBLE_PATTERNS) {
      result = result.replace(pattern, "");
    }
    return result;
  }

  function capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function ensureTrailingPunctuation(text: string): string {
    if (/[.!]$/.test(text)) {
      return text;
    }
    return text + ".";
  }

  export function getSystemPrompt(): string {
    if (!cachedSystemPrompt) {
      cachedSystemPrompt = loadSystemPrompt();
    }
    return cachedSystemPrompt;
  }

  export function buildExtractionPrompt(
    userMessages: readonly string[],
    existingRules: readonly string[],
  ): string {
    const parts: string[] = [];

    if (existingRules.length > 0) {
      parts.push(
        "## Already saved rules (do NOT re-extract these)\n" +
          existingRules.map((r) => `- ${r}`).join("\n"),
      );
    }

    parts.push(
      "## User messages from this session\n" +
        userMessages.map((msg, i) => `[${i + 1}] ${msg}`).join("\n"),
    );

    parts.push(
      "Analyze the messages above. Extract any new rules the user expressed. Respond with ONLY a JSON array.",
    );

    return parts.join("\n\n");
  }

  export function parseExtractionResponse(
    response: string,
  ): ExtractedRuleFromLLM[] {
    const jsonStr = extractJsonString(response.trim());

    try {
      const parsed: unknown = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter(isValidRuleItem)
        .map(toExtractedRule)
        .filter((rule) => rule.rule.length > 0);
    } catch {
      return [];
    }
  }

  export function normalizeRule(message: string): string {
    const stripped = stripPreamble(message.trim());
    const capitalized = capitalizeFirst(stripped);
    return ensureTrailingPunctuation(capitalized);
  }

  function findTextInParts(parts: unknown[]): string | undefined {
    for (const part of parts) {
      if (typeof part === "string") {
        return part;
      }

      if (
        typeof part === "object" &&
        part !== null &&
        typeof (part as Record<string, unknown>)["text"] === "string"
      ) {
        return (part as Record<string, unknown>)["text"] as string;
      }
    }

    return undefined;
  }

  function extractJsonArrayFallback(result: unknown): string | undefined {
    const stringified = JSON.stringify(result);
    const MAX_FALLBACK_LENGTH = 10000;

    if (stringified.length <= 2 || stringified.length >= MAX_FALLBACK_LENGTH) {
      return undefined;
    }

    const arrayMatch = stringified.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
      return arrayMatch[0];
    }

    return undefined;
  }

  export function extractTextFromResult(result: unknown): string | undefined {
    if (!result || typeof result !== "object") {
      return undefined;
    }

    const r = result as Record<string, unknown>;

    if (typeof r["text"] === "string") {
      return r["text"] as string;
    }

    if (Array.isArray(r["parts"])) {
      const textPart = findTextInParts(r["parts"]);
      if (textPart) {
        return textPart;
      }
    }

    if (typeof r["message"] === "object" && r["message"] !== null) {
      return extractTextFromResult(r["message"]);
    }

    if (Array.isArray(r["content"])) {
      const textContent = findTextInParts(r["content"]);
      if (textContent) {
        return textContent;
      }
    }

    return extractJsonArrayFallback(result);
  }
}

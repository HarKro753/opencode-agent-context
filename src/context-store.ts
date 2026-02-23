import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";

export namespace ContextStore {
  const CONTEXT_DIR = ".opencode/context";

  function getContextDir(projectRoot: string): string {
    return join(projectRoot, CONTEXT_DIR);
  }

  function sanitizeLanguage(language: string): string {
    return language.toLowerCase().replace(/[^a-z0-9-]/g, "");
  }

  function getContextFilePath(projectRoot: string, language: string): string {
    return join(getContextDir(projectRoot), `${sanitizeLanguage(language)}.md`);
  }

  function ensureContextDir(projectRoot: string): void {
    const dir = getContextDir(projectRoot);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  function parseRulesFromMarkdown(content: string): string[] {
    const rules: string[] = [];

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      const isListItem = trimmed.startsWith("- ") || trimmed.startsWith("* ");
      if (!isListItem) {
        continue;
      }

      const rule = trimmed.slice(2).trim();
      if (rule.length > 0) {
        rules.push(rule);
      }
    }

    return rules;
  }

  function isDuplicateRule(existing: readonly string[], newRule: string): boolean {
    const normalized = newRule.toLowerCase();
    return existing.some((r) => r.toLowerCase() === normalized);
  }

  function capitalizeFirst(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  export function readRules(projectRoot: string, language: string): string[] {
    const filePath = getContextFilePath(projectRoot, language);

    if (!existsSync(filePath)) {
      return [];
    }

    const content = readFileSync(filePath, "utf-8");
    return parseRulesFromMarkdown(content);
  }

  export function addRule(
    projectRoot: string,
    language: string,
    rule: string,
  ): void {
    ensureContextDir(projectRoot);

    const filePath = getContextFilePath(projectRoot, language);
    const existing = readRules(projectRoot, language);
    const normalizedRule = rule.trim();

    if (isDuplicateRule(existing, normalizedRule)) {
      return;
    }

    if (!existsSync(filePath)) {
      const title = capitalizeFirst(language);
      const content = `# ${title} Rules\n\n- ${normalizedRule}\n`;
      writeFileSync(filePath, content, "utf-8");
      return;
    }

    const currentContent = readFileSync(filePath, "utf-8");
    const updatedContent = currentContent.trimEnd() + `\n- ${normalizedRule}\n`;
    writeFileSync(filePath, updatedContent, "utf-8");
  }

  export function getAllRules(projectRoot: string): Record<string, string[]> {
    const dir = getContextDir(projectRoot);

    if (!existsSync(dir)) {
      return {};
    }

    const result: Record<string, string[]> = {};
    const files = readdirSync(dir).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const language = file.replace(/\.md$/, "");
      const rules = readRules(projectRoot, language);
      if (rules.length > 0) {
        result[language] = rules;
      }
    }

    return result;
  }

  export function getContextFileContent(
    projectRoot: string,
    language: string,
  ): string | undefined {
    const filePath = getContextFilePath(projectRoot, language);

    if (!existsSync(filePath)) {
      return undefined;
    }

    return readFileSync(filePath, "utf-8");
  }

  export function listContextFiles(projectRoot: string): string[] {
    const dir = getContextDir(projectRoot);

    if (!existsSync(dir)) {
      return [];
    }

    return readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));
  }
}

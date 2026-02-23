import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";

const CONTEXT_DIR = ".opencode/context";

function getContextDir(projectRoot: string): string {
  return join(projectRoot, CONTEXT_DIR);
}

function getContextFilePath(projectRoot: string, language: string): string {
  const sanitized = language.toLowerCase().replace(/[^a-z0-9-]/g, "");
  return join(getContextDir(projectRoot), `${sanitized}.md`);
}

function ensureContextDir(projectRoot: string): void {
  const dir = getContextDir(projectRoot);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function readRules(projectRoot: string, language: string): string[] {
  const filePath = getContextFilePath(projectRoot, language);

  if (!existsSync(filePath)) return [];

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
  const isDuplicate = existing.some(
    (r) => r.toLowerCase() === normalizedRule.toLowerCase(),
  );

  if (isDuplicate) return;

  if (!existsSync(filePath)) {
    const title = language.charAt(0).toUpperCase() + language.slice(1);
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

  if (!existsSync(dir)) return {};

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

  if (!existsSync(filePath)) return undefined;

  return readFileSync(filePath, "utf-8");
}

export function listContextFiles(projectRoot: string): string[] {
  const dir = getContextDir(projectRoot);

  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function parseRulesFromMarkdown(content: string): string[] {
  const rules: string[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const rule = trimmed.slice(2).trim();
      if (rule.length > 0) {
        rules.push(rule);
      }
    }
  }

  return rules;
}

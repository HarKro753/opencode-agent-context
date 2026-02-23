import { getContextFileContent, listContextFiles } from "./context-store.js";

export function buildContextInjection(
  projectRoot: string,
  activeLanguages: readonly string[]
): string {
  const languagesToInject = new Set<string>(activeLanguages);

  languagesToInject.add("general");

  const available = listContextFiles(projectRoot);
  const sections: string[] = [];

  for (const language of available) {
    if (!languagesToInject.has(language)) continue;

    const content = getContextFileContent(projectRoot, language);
    if (!content || content.trim().length === 0) continue;

    sections.push(content.trim());
  }

  if (sections.length === 0) return "";

  const header =
    "## Agent Context — Remembered Rules\n" +
    "The following rules were explicitly saved by the user across previous sessions.\n" +
    "Follow these rules unless the user explicitly overrides them.\n";

  return header + "\n" + sections.join("\n\n") + "\n";
}

export function buildCompactContextString(
  projectRoot: string,
  activeLanguages: readonly string[]
): string[] {
  const injection = buildContextInjection(projectRoot, activeLanguages);
  if (!injection) return [];
  return [injection];
}

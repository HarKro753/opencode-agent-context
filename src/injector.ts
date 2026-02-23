import { ContextStore } from "./context-store.js";

export namespace Injector {
  const INJECTION_HEADER =
    "## Agent Context — Remembered Rules\n" +
    "The following rules were explicitly saved by the user across previous sessions.\n" +
    "Follow these rules unless the user explicitly overrides them.\n";

  function isNonEmptyContent(content: string | undefined): content is string {
    return !!content && content.trim().length > 0;
  }

  export function buildContextInjection(
    projectRoot: string,
    activeLanguages: readonly string[],
  ): string {
    const languagesToInject = new Set<string>(activeLanguages);
    languagesToInject.add("general");

    const available = ContextStore.listContextFiles(projectRoot);
    const sections: string[] = [];

    for (const language of available) {
      if (!languagesToInject.has(language)) {
        continue;
      }

      const content = ContextStore.getContextFileContent(projectRoot, language);
      if (isNonEmptyContent(content)) {
        sections.push(content.trim());
      }
    }

    if (sections.length === 0) {
      return "";
    }

    return INJECTION_HEADER + "\n" + sections.join("\n\n") + "\n";
  }

  export function buildCompactContextString(
    projectRoot: string,
    activeLanguages: readonly string[],
  ): string[] {
    const injection = buildContextInjection(projectRoot, activeLanguages);
    if (!injection) {
      return [];
    }
    return [injection];
  }
}

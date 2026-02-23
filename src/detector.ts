export interface LanguageMapping {
  readonly extensions: readonly string[];
  readonly language: string;
}

const LANGUAGE_MAP: readonly LanguageMapping[] = [
  { extensions: [".ts", ".tsx", ".mts", ".cts"], language: "typescript" },
  { extensions: [".js", ".jsx", ".mjs", ".cjs"], language: "javascript" },
  { extensions: [".go"], language: "go" },
  { extensions: [".py", ".pyw"], language: "python" },
  { extensions: [".rs"], language: "rust" },
  { extensions: [".rb"], language: "ruby" },
  { extensions: [".java"], language: "java" },
  { extensions: [".kt", ".kts"], language: "kotlin" },
  { extensions: [".swift"], language: "swift" },
  { extensions: [".cs"], language: "csharp" },
  { extensions: [".cpp", ".cc", ".cxx", ".hpp", ".h"], language: "cpp" },
  { extensions: [".c"], language: "c" },
  { extensions: [".php"], language: "php" },
  { extensions: [".dart"], language: "dart" },
  { extensions: [".ex", ".exs"], language: "elixir" },
  { extensions: [".erl", ".hrl"], language: "erlang" },
  { extensions: [".zig"], language: "zig" },
  { extensions: [".lua"], language: "lua" },
  { extensions: [".scala", ".sc"], language: "scala" },
  { extensions: [".clj", ".cljs", ".cljc"], language: "clojure" },
  { extensions: [".hs"], language: "haskell" },
  { extensions: [".vue"], language: "vue" },
  { extensions: [".svelte"], language: "svelte" },
  { extensions: [".astro"], language: "astro" },
] as const;

const FRAMEWORK_INDICATORS: Record<string, readonly string[]> = {
  nextjs: ["next.config.js", "next.config.mjs", "next.config.ts"],
  react: ["react", "react-dom"],
  vue: [".vue"],
  svelte: [".svelte"],
  astro: ["astro.config.mjs", "astro.config.ts"],
  tailwind: ["tailwind.config.js", "tailwind.config.ts"],
  prisma: ["prisma/schema.prisma"],
  drizzle: ["drizzle.config.ts"],
};

function getExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filePath.slice(lastDot).toLowerCase();
}

export function detectLanguagesFromFiles(
  filePaths: readonly string[],
): string[] {
  const detected = new Set<string>();

  for (const filePath of filePaths) {
    const ext = getExtension(filePath);
    if (!ext) continue;

    for (const mapping of LANGUAGE_MAP) {
      if (mapping.extensions.includes(ext)) {
        detected.add(mapping.language);
        break;
      }
    }
  }

  return Array.from(detected);
}

export function detectFrameworksFromFiles(
  filePaths: readonly string[],
): string[] {
  const detected = new Set<string>();
  const fileNames = filePaths.map((p) => {
    const parts = p.split("/");
    return parts[parts.length - 1] ?? "";
  });

  for (const [framework, indicators] of Object.entries(FRAMEWORK_INDICATORS)) {
    for (const indicator of indicators) {
      if (fileNames.some((name) => name === indicator)) {
        detected.add(framework);
      }
      if (filePaths.some((p) => p.endsWith(indicator))) {
        detected.add(framework);
      }
    }
  }

  return Array.from(detected);
}

export function detectLanguageFromFilePath(
  filePath: string,
): string | undefined {
  const ext = getExtension(filePath);
  if (!ext) return undefined;

  for (const mapping of LANGUAGE_MAP) {
    if (mapping.extensions.includes(ext)) {
      return mapping.language;
    }
  }

  return undefined;
}

export function detectLanguageFromMessage(message: string): string | undefined {
  const lower = message.toLowerCase();

  const languagePatterns: Array<{ pattern: RegExp; language: string }> = [
    { pattern: /\bin\s+typescript\b/, language: "typescript" },
    { pattern: /\bin\s+javascript\b/, language: "javascript" },
    { pattern: /\bin\s+go\b/, language: "go" },
    { pattern: /\bin\s+golang\b/, language: "go" },
    { pattern: /\bin\s+python\b/, language: "python" },
    { pattern: /\bin\s+rust\b/, language: "rust" },
    { pattern: /\bin\s+ruby\b/, language: "ruby" },
    { pattern: /\bin\s+java\b/, language: "java" },
    { pattern: /\bin\s+kotlin\b/, language: "kotlin" },
    { pattern: /\bin\s+swift\b/, language: "swift" },
    { pattern: /\bin\s+c#\b/, language: "csharp" },
    { pattern: /\bin\s+c\+\+\b/, language: "cpp" },
    { pattern: /\bin\s+php\b/, language: "php" },
    { pattern: /\bin\s+dart\b/, language: "dart" },
    { pattern: /\bin\s+elixir\b/, language: "elixir" },
    { pattern: /\bin\s+react\b/, language: "react" },
    { pattern: /\bin\s+next\.?js\b/, language: "nextjs" },
    { pattern: /\bin\s+vue\b/, language: "vue" },
    { pattern: /\bin\s+svelte\b/, language: "svelte" },
  ];

  for (const { pattern, language } of languagePatterns) {
    if (pattern.test(lower)) {
      return language;
    }
  }

  return undefined;
}

export function getAllSupportedLanguages(): string[] {
  return LANGUAGE_MAP.map((m) => m.language);
}

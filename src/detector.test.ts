import { describe, it, expect } from "vitest";
import {
  detectLanguagesFromFiles,
  detectLanguageFromFilePath,
  detectLanguageFromMessage,
  detectFrameworksFromFiles,
  getAllSupportedLanguages,
} from "./detector.js";

describe("detectLanguagesFromFiles", () => {
  it("detects TypeScript from .ts files", () => {
    const result = detectLanguagesFromFiles(["src/index.ts", "src/utils.ts"]);
    expect(result).toContain("typescript");
  });

  it("detects TypeScript from .tsx files", () => {
    const result = detectLanguagesFromFiles(["src/App.tsx"]);
    expect(result).toContain("typescript");
  });

  it("detects JavaScript from .js files", () => {
    const result = detectLanguagesFromFiles(["server.js", "config.mjs"]);
    expect(result).toContain("javascript");
  });

  it("detects Go from .go files", () => {
    const result = detectLanguagesFromFiles(["main.go", "handlers/user.go"]);
    expect(result).toContain("go");
  });

  it("detects Python from .py files", () => {
    const result = detectLanguagesFromFiles(["app.py", "tests/test_main.py"]);
    expect(result).toContain("python");
  });

  it("detects Rust from .rs files", () => {
    const result = detectLanguagesFromFiles(["src/main.rs", "src/lib.rs"]);
    expect(result).toContain("rust");
  });

  it("detects multiple languages", () => {
    const result = detectLanguagesFromFiles([
      "src/index.ts",
      "backend/main.go",
      "scripts/deploy.py",
    ]);
    expect(result).toContain("typescript");
    expect(result).toContain("go");
    expect(result).toContain("python");
    expect(result.length).toBe(3);
  });

  it("deduplicates languages", () => {
    const result = detectLanguagesFromFiles([
      "src/index.ts",
      "src/utils.ts",
      "src/types.ts",
    ]);
    expect(result).toEqual(["typescript"]);
  });

  it("returns empty for unknown extensions", () => {
    const result = detectLanguagesFromFiles(["README.md", "Dockerfile", ".gitignore"]);
    expect(result).toEqual([]);
  });

  it("handles empty input", () => {
    const result = detectLanguagesFromFiles([]);
    expect(result).toEqual([]);
  });

  it("detects Ruby from .rb files", () => {
    const result = detectLanguagesFromFiles(["app.rb", "Gemfile"]);
    expect(result).toContain("ruby");
  });

  it("detects Java from .java files", () => {
    const result = detectLanguagesFromFiles(["src/Main.java"]);
    expect(result).toContain("java");
  });

  it("detects C# from .cs files", () => {
    const result = detectLanguagesFromFiles(["Program.cs"]);
    expect(result).toContain("csharp");
  });

  it("detects PHP from .php files", () => {
    const result = detectLanguagesFromFiles(["index.php"]);
    expect(result).toContain("php");
  });

  it("detects Elixir from .ex and .exs files", () => {
    const result = detectLanguagesFromFiles(["lib/app.ex", "test/app_test.exs"]);
    expect(result).toContain("elixir");
  });

  it("detects Vue from .vue files", () => {
    const result = detectLanguagesFromFiles(["src/App.vue"]);
    expect(result).toContain("vue");
  });

  it("detects Svelte from .svelte files", () => {
    const result = detectLanguagesFromFiles(["src/App.svelte"]);
    expect(result).toContain("svelte");
  });
});

describe("detectLanguageFromFilePath", () => {
  it("returns typescript for .ts file", () => {
    expect(detectLanguageFromFilePath("src/index.ts")).toBe("typescript");
  });

  it("returns typescript for .tsx file", () => {
    expect(detectLanguageFromFilePath("components/Button.tsx")).toBe("typescript");
  });

  it("returns go for .go file", () => {
    expect(detectLanguageFromFilePath("main.go")).toBe("go");
  });

  it("returns python for .py file", () => {
    expect(detectLanguageFromFilePath("app.py")).toBe("python");
  });

  it("returns undefined for unknown extension", () => {
    expect(detectLanguageFromFilePath("README.md")).toBeUndefined();
  });

  it("returns undefined for files without extension", () => {
    expect(detectLanguageFromFilePath("Makefile")).toBeUndefined();
  });

  it("handles case-insensitive extensions", () => {
    expect(detectLanguageFromFilePath("App.TS")).toBe("typescript");
    expect(detectLanguageFromFilePath("main.GO")).toBe("go");
  });
});

describe("detectLanguageFromMessage", () => {
  it("detects TypeScript mentions", () => {
    expect(detectLanguageFromMessage("in TypeScript, use strict types")).toBe("typescript");
  });

  it("detects Go mentions", () => {
    expect(detectLanguageFromMessage("in Go, prefer interfaces")).toBe("go");
  });

  it("detects Golang mentions", () => {
    expect(detectLanguageFromMessage("in golang, use table tests")).toBe("go");
  });

  it("detects Python mentions", () => {
    expect(detectLanguageFromMessage("in Python, use type hints")).toBe("python");
  });

  it("detects React mentions", () => {
    expect(detectLanguageFromMessage("in React, use functional components")).toBe("react");
  });

  it("detects Next.js mentions", () => {
    expect(detectLanguageFromMessage("in NextJS, use server components")).toBe("nextjs");
  });

  it("returns undefined for generic messages", () => {
    expect(detectLanguageFromMessage("always handle errors explicitly")).toBeUndefined();
  });

  it("is case-insensitive", () => {
    expect(detectLanguageFromMessage("in TYPESCRIPT, prefer const")).toBe("typescript");
  });
});

describe("detectFrameworksFromFiles", () => {
  it("detects Next.js from config file", () => {
    const result = detectFrameworksFromFiles(["next.config.js", "src/index.ts"]);
    expect(result).toContain("nextjs");
  });

  it("detects Next.js from .mjs config", () => {
    const result = detectFrameworksFromFiles(["next.config.mjs"]);
    expect(result).toContain("nextjs");
  });

  it("detects Prisma from schema", () => {
    const result = detectFrameworksFromFiles(["prisma/schema.prisma"]);
    expect(result).toContain("prisma");
  });

  it("returns empty for no framework indicators", () => {
    const result = detectFrameworksFromFiles(["src/index.ts", "src/utils.ts"]);
    expect(result).toEqual([]);
  });
});

describe("getAllSupportedLanguages", () => {
  it("returns a non-empty list", () => {
    const languages = getAllSupportedLanguages();
    expect(languages.length).toBeGreaterThan(0);
  });

  it("includes common languages", () => {
    const languages = getAllSupportedLanguages();
    expect(languages).toContain("typescript");
    expect(languages).toContain("javascript");
    expect(languages).toContain("go");
    expect(languages).toContain("python");
    expect(languages).toContain("rust");
  });
});

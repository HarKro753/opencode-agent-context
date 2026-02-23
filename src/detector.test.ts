import { describe, it, expect } from "vitest";
import { Detector } from "./detector.js";

describe("detectLanguagesFromFiles", () => {
  it("detects TypeScript from .ts files", () => {
    const result = Detector.detectLanguagesFromFiles(["src/index.ts", "src/utils.ts"]);
    expect(result).toContain("typescript");
  });

  it("detects TypeScript from .tsx files", () => {
    const result = Detector.detectLanguagesFromFiles(["src/App.tsx"]);
    expect(result).toContain("typescript");
  });

  it("detects JavaScript from .js files", () => {
    const result = Detector.detectLanguagesFromFiles(["server.js", "config.mjs"]);
    expect(result).toContain("javascript");
  });

  it("detects Go from .go files", () => {
    const result = Detector.detectLanguagesFromFiles(["main.go", "handlers/user.go"]);
    expect(result).toContain("go");
  });

  it("detects Python from .py files", () => {
    const result = Detector.detectLanguagesFromFiles(["app.py", "tests/test_main.py"]);
    expect(result).toContain("python");
  });

  it("detects Rust from .rs files", () => {
    const result = Detector.detectLanguagesFromFiles(["src/main.rs", "src/lib.rs"]);
    expect(result).toContain("rust");
  });

  it("detects multiple languages", () => {
    const result = Detector.detectLanguagesFromFiles([
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
    const result = Detector.detectLanguagesFromFiles([
      "src/index.ts",
      "src/utils.ts",
      "src/types.ts",
    ]);
    expect(result).toEqual(["typescript"]);
  });

  it("returns empty for unknown extensions", () => {
    const result = Detector.detectLanguagesFromFiles([
      "README.md",
      "Dockerfile",
      ".gitignore",
    ]);
    expect(result).toEqual([]);
  });

  it("handles empty input", () => {
    const result = Detector.detectLanguagesFromFiles([]);
    expect(result).toEqual([]);
  });

  it("detects Ruby from .rb files", () => {
    const result = Detector.detectLanguagesFromFiles(["app.rb", "Gemfile"]);
    expect(result).toContain("ruby");
  });

  it("detects Java from .java files", () => {
    const result = Detector.detectLanguagesFromFiles(["src/Main.java"]);
    expect(result).toContain("java");
  });

  it("detects C# from .cs files", () => {
    const result = Detector.detectLanguagesFromFiles(["Program.cs"]);
    expect(result).toContain("csharp");
  });

  it("detects PHP from .php files", () => {
    const result = Detector.detectLanguagesFromFiles(["index.php"]);
    expect(result).toContain("php");
  });

  it("detects Elixir from .ex and .exs files", () => {
    const result = Detector.detectLanguagesFromFiles([
      "lib/app.ex",
      "test/app_test.exs",
    ]);
    expect(result).toContain("elixir");
  });

  it("detects Vue from .vue files", () => {
    const result = Detector.detectLanguagesFromFiles(["src/App.vue"]);
    expect(result).toContain("vue");
  });

  it("detects Svelte from .svelte files", () => {
    const result = Detector.detectLanguagesFromFiles(["src/App.svelte"]);
    expect(result).toContain("svelte");
  });
});

describe("detectLanguageFromFilePath", () => {
  it("returns typescript for .ts file", () => {
    expect(Detector.detectLanguageFromFilePath("src/index.ts")).toBe("typescript");
  });

  it("returns typescript for .tsx file", () => {
    expect(Detector.detectLanguageFromFilePath("components/Button.tsx")).toBe(
      "typescript",
    );
  });

  it("returns go for .go file", () => {
    expect(Detector.detectLanguageFromFilePath("main.go")).toBe("go");
  });

  it("returns python for .py file", () => {
    expect(Detector.detectLanguageFromFilePath("app.py")).toBe("python");
  });

  it("returns undefined for unknown extension", () => {
    expect(Detector.detectLanguageFromFilePath("README.md")).toBeUndefined();
  });

  it("returns undefined for files without extension", () => {
    expect(Detector.detectLanguageFromFilePath("Makefile")).toBeUndefined();
  });

  it("handles case-insensitive extensions", () => {
    expect(Detector.detectLanguageFromFilePath("App.TS")).toBe("typescript");
    expect(Detector.detectLanguageFromFilePath("main.GO")).toBe("go");
  });
});

describe("detectLanguageFromMessage", () => {
  it("detects TypeScript mentions", () => {
    expect(Detector.detectLanguageFromMessage("in TypeScript, use strict types")).toBe(
      "typescript",
    );
  });

  it("detects Go mentions", () => {
    expect(Detector.detectLanguageFromMessage("in Go, prefer interfaces")).toBe("go");
  });

  it("detects Golang mentions", () => {
    expect(Detector.detectLanguageFromMessage("in golang, use table tests")).toBe("go");
  });

  it("detects Python mentions", () => {
    expect(Detector.detectLanguageFromMessage("in Python, use type hints")).toBe(
      "python",
    );
  });

  it("detects React mentions", () => {
    expect(
      Detector.detectLanguageFromMessage("in React, use functional components"),
    ).toBe("react");
  });

  it("detects Next.js mentions", () => {
    expect(Detector.detectLanguageFromMessage("in NextJS, use server components")).toBe(
      "nextjs",
    );
  });

  it("returns undefined for generic messages", () => {
    expect(
      Detector.detectLanguageFromMessage("always handle errors explicitly"),
    ).toBeUndefined();
  });

  it("is case-insensitive", () => {
    expect(Detector.detectLanguageFromMessage("in TYPESCRIPT, prefer const")).toBe(
      "typescript",
    );
  });
});

describe("detectFrameworksFromFiles", () => {
  it("detects Next.js from config file", () => {
    const result = Detector.detectFrameworksFromFiles([
      "next.config.js",
      "src/index.ts",
    ]);
    expect(result).toContain("nextjs");
  });

  it("detects Next.js from .mjs config", () => {
    const result = Detector.detectFrameworksFromFiles(["next.config.mjs"]);
    expect(result).toContain("nextjs");
  });

  it("detects Prisma from schema", () => {
    const result = Detector.detectFrameworksFromFiles(["prisma/schema.prisma"]);
    expect(result).toContain("prisma");
  });

  it("returns empty for no framework indicators", () => {
    const result = Detector.detectFrameworksFromFiles(["src/index.ts", "src/utils.ts"]);
    expect(result).toEqual([]);
  });
});

describe("getAllSupportedLanguages", () => {
  it("returns a non-empty list", () => {
    const languages = Detector.getAllSupportedLanguages();
    expect(languages.length).toBeGreaterThan(0);
  });

  it("includes common languages", () => {
    const languages = Detector.getAllSupportedLanguages();
    expect(languages).toContain("typescript");
    expect(languages).toContain("javascript");
    expect(languages).toContain("go");
    expect(languages).toContain("python");
    expect(languages).toContain("rust");
  });
});

import { tool } from "@opencode-ai/plugin";
import type { Plugin } from "@opencode-ai/plugin";
import {
  detectLanguagesFromFiles,
  detectLanguageFromFilePath,
  detectFrameworksFromFiles,
} from "./detector.js";
import { isRememberWorthy, extractRule } from "./rule-extractor.js";
import { addRule, getAllRules, listContextFiles } from "./context-store.js";
import { buildCompactContextString } from "./injector.js";
import { detectLanguageFromMessage } from "./detector.js";

export const AgentContextPlugin: Plugin = async (ctx) => {
  const projectRoot = ctx.directory;
  const activeLanguages = new Set<string>();

  async function log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    extra?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await ctx.client.app.log({
        body: { service: "agent-context", level, message, extra },
      });
    } catch {
      // Fail silently — logging should never break the plugin
    }
  }

  async function detectProjectLanguages(): Promise<void> {
    try {
      const files = await ctx.client.find.files({
        query: { query: "*" },
      });

      if (Array.isArray(files)) {
        const languages = detectLanguagesFromFiles(files);
        const frameworks = detectFrameworksFromFiles(files);

        for (const lang of languages) activeLanguages.add(lang);
        for (const fw of frameworks) activeLanguages.add(fw);
      }
    } catch {
      await log("debug", "Could not auto-detect project languages");
    }
  }

  async function handleUserMessage(text: string): Promise<void> {
    if (!isRememberWorthy(text)) return;

    const language = detectLanguageFromMessage(text) ?? "general";
    const rule = extractRule(text);

    addRule(projectRoot, language, rule);
    activeLanguages.add(language);

    await log("info", `Saved rule to ${language}: ${rule}`);

    try {
      await ctx.client.tui.showToast({
        body: {
          message: `Rule saved to ${language} context`,
          variant: "success",
        },
      });
    } catch {
      // Toast is best-effort
    }
  }

  // Defer language detection to first hook call — calling client.* during
  // plugin init blocks OpenCode startup because the SDK isn't ready yet.
  let initialized = false;
  async function ensureInitialized(): Promise<void> {
    if (initialized) return;
    initialized = true;
    await detectProjectLanguages();
    await log("info", "Agent context plugin initialized", {
      languages: Array.from(activeLanguages),
      contextFiles: listContextFiles(projectRoot),
    });
  }

  return {
    event: async ({ event }) => {
      await ensureInitialized();
      if (event.type === "message.updated" && event.properties) {
        const props = event.properties as Record<string, unknown>;
        if (props["role"] === "user" && typeof props["text"] === "string") {
          await handleUserMessage(props["text"] as string);
        }
      }
    },

    "tool.execute.after": async (input, _output) => {
      if (
        input.tool === "read" &&
        input.args &&
        typeof input.args["filePath"] === "string"
      ) {
        const filePath = input.args["filePath"] as string;
        const lang = detectLanguageFromFilePath(filePath);
        if (lang) {
          activeLanguages.add(lang);
        }
      }
    },

    "experimental.session.compacting": async (_input, output) => {
      const contextStrings = buildCompactContextString(
        projectRoot,
        Array.from(activeLanguages),
      );

      for (const ctx of contextStrings) {
        output.context.push(ctx);
      }

      await log("debug", "Injected context into compaction", {
        languages: Array.from(activeLanguages),
        contextCount: contextStrings.length,
      });
    },

    tool: {
      remember: tool({
        description:
          "Save a coding rule or convention to persistent context. " +
          "Use this when the user says /remember followed by a rule. " +
          "The rule will be remembered across sessions.",
        args: {
          rule: tool.schema
            .string()
            .describe("The rule or convention to remember"),
          language: tool.schema
            .string()
            .describe(
              "The language/framework this rule applies to (e.g. typescript, go, general). Defaults to general.",
            )
            .optional(),
        },
        async execute(args, context) {
          const rule = args.rule;
          const language = args.language ?? "general";

          if (!rule || rule.trim().length === 0) {
            return "No rule provided. Usage: /remember <rule>";
          }

          const cleaned = extractRule(rule);
          addRule(context.directory, language, cleaned);
          activeLanguages.add(language);

          return `Rule saved to ${language} context:\n> ${cleaned}`;
        },
      }),
      context: tool({
        description:
          "View all saved coding rules and conventions. " +
          "Shows rules organized by language/framework.",
        args: {},
        async execute(_args, context) {
          const allRules = getAllRules(context.directory);
          const entries = Object.entries(allRules);

          if (entries.length === 0) {
            return "No rules saved yet. Use /remember to save a rule, or just explain a preference and it will be auto-detected.";
          }

          const sections = entries.map(([lang, rules]) => {
            const header = `### ${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
            const list = rules.map((r) => `- ${r}`).join("\n");
            return `${header}\n${list}`;
          });

          return `## Saved Context Rules\n\n${sections.join("\n\n")}`;
        },
      }),
    },
  };
};

export {
  detectLanguagesFromFiles,
  detectLanguageFromFilePath,
  detectLanguageFromMessage,
  detectFrameworksFromFiles,
} from "./detector.js";
export {
  isRememberWorthy,
  extractRule,
  extractRuleWithLanguage,
} from "./rule-extractor.js";
export {
  readRules,
  addRule,
  getAllRules,
  getContextFileContent,
  listContextFiles,
} from "./context-store.js";
export {
  buildContextInjection,
  buildCompactContextString,
} from "./injector.js";

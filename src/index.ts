import { tool } from "@opencode-ai/plugin";
import type { Plugin, PluginContext } from "@opencode-ai/plugin";
import type { LogLevel } from "./models.js";
import { Detector } from "./detector.js";
import { ContextStore } from "./context-store.js";
import { Injector } from "./injector.js";
import { RuleReasoner } from "./rule-reasoner.js";

function logToService(
  client: PluginContext["client"],
  level: LogLevel,
  message: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  return client.app
    .log({ body: { service: "agent-context", level, message, extra } })
    .catch(() => {});
}

export const AgentContextPlugin: Plugin = async (ctx) => {
  const projectRoot = ctx.directory;
  const activeLanguages = new Set<string>();
  const userMessages: string[] = [];
  let lastExtractedAt = 0;
  let initialized = false;

  async function ensureInitialized(): Promise<void> {
    if (initialized) {
      return;
    }
    initialized = true;

    try {
      const files = await ctx.client.find.files({ query: { query: "*" } });

      if (Array.isArray(files)) {
        for (const lang of Detector.detectLanguagesFromFiles(files)) {
          activeLanguages.add(lang);
        }
        for (const fw of Detector.detectFrameworksFromFiles(files)) {
          activeLanguages.add(fw);
        }
      }
    } catch {
      await logToService(ctx.client, "debug", "Could not auto-detect project languages");
    }

    await logToService(ctx.client, "info", "Agent context plugin initialized", {
      languages: Array.from(activeLanguages),
      contextFiles: ContextStore.listContextFiles(projectRoot),
    });
  }

  async function extractRulesFromConversation(): Promise<void> {
    if (userMessages.length === 0) {
      return;
    }

    const currentMessageCount = userMessages.length;
    if (currentMessageCount === lastExtractedAt) {
      return;
    }

    const existingRules = Object.values(ContextStore.getAllRules(projectRoot)).flat();
    const prompt = RuleReasoner.buildExtractionPrompt(userMessages, existingRules);
    let session: { id: string } | undefined;

    try {
      session = await ctx.client.session.create({
        body: { title: "[agent-context] rule extraction" },
      });

      const result = await ctx.client.session.prompt({
        path: { id: session.id },
        body: {
          parts: [{ type: "text", text: RuleReasoner.getSystemPrompt() + "\n\n" + prompt }],
        },
      });

      const responseText = RuleReasoner.extractTextFromResult(result);
      if (!responseText) {
        await logToService(ctx.client, "debug", "No response from extraction session");
        return;
      }

      const extracted = RuleReasoner.parseExtractionResponse(responseText);
      if (extracted.length === 0) {
        await logToService(ctx.client, "debug", "LLM found no new rules to extract");
        lastExtractedAt = currentMessageCount;
        return;
      }

      for (const { rule, language } of extracted) {
        ContextStore.addRule(projectRoot, language, RuleReasoner.normalizeRule(rule));
        activeLanguages.add(language);
      }

      lastExtractedAt = currentMessageCount;

      await logToService(ctx.client, "info", `Extracted ${extracted.length} rules from conversation`, {
        rules: extracted,
      });

      const uniqueLanguages = [...new Set(extracted.map((r) => r.language))];
      const plural = extracted.length > 1 ? "s" : "";
      await ctx.client.tui
        .showToast({
          body: {
            message: `${extracted.length} rule${plural} saved to ${uniqueLanguages.join(", ")} context`,
            variant: "success",
          },
        })
        .catch(() => {});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await logToService(ctx.client, "warn", "Rule extraction failed", { error: errorMessage });
    } finally {
      if (session) {
        await ctx.client.session.delete({ path: { id: session.id } }).catch(() => {});
      }
    }
  }

  return {
    event: async ({ event }) => {
      await ensureInitialized();

      if (
        event.type === "message.updated" &&
        event.properties &&
        (event.properties as Record<string, unknown>)["role"] === "user" &&
        typeof (event.properties as Record<string, unknown>)["text"] === "string"
      ) {
        userMessages.push((event.properties as Record<string, unknown>)["text"] as string);
      }

      if (event.type === "session.idle") {
        await extractRulesFromConversation();
      }
    },

    "tool.execute.after": async (input, _output) => {
      await ensureInitialized();

      const isFileRead = input.tool === "read"
        && input.args
        && typeof input.args["filePath"] === "string";

      if (!isFileRead) {
        return;
      }

      const lang = Detector.detectLanguageFromFilePath(input.args!["filePath"] as string);
      if (lang) {
        activeLanguages.add(lang);
      }
    },

    "experimental.session.compacting": async (_input, output) => {
      await ensureInitialized();

      const contextStrings = Injector.buildCompactContextString(
        projectRoot,
        Array.from(activeLanguages),
      );

      for (const entry of contextStrings) {
        output.context.push(entry);
      }

      await logToService(ctx.client, "debug", "Injected context into compaction", {
        languages: Array.from(activeLanguages),
        contextCount: contextStrings.length,
      });
    },

    tool: {
      remember: tool({
        description:
          "Explicitly save a coding rule or convention to persistent memory. " +
          "The rule will be remembered across sessions, compactions, and restarts. " +
          "Use this when the user explicitly asks to remember something with /remember.",
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

          const cleaned = RuleReasoner.normalizeRule(rule);
          ContextStore.addRule(context.directory, language, cleaned);
          activeLanguages.add(language);

          await logToService(ctx.client, "info", `Rule explicitly saved to ${language}: ${cleaned}`);

          return `Rule saved to ${language} context:\n> ${cleaned}`;
        },
      }),

      context: tool({
        description:
          "View all saved coding rules and conventions. " +
          "Shows rules organized by language/framework.",
        args: {},
        async execute(_args, context) {
          const allRules = ContextStore.getAllRules(context.directory);
          const entries = Object.entries(allRules);

          if (entries.length === 0) {
            return "No rules saved yet. Just express preferences naturally — they'll be saved automatically after each turn. Or use /remember to save one explicitly.";
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

export { Detector } from "./detector.js";
export { ContextStore } from "./context-store.js";
export { Injector } from "./injector.js";
export { RuleReasoner } from "./rule-reasoner.js";
export type {
  ExtractedRuleFromLLM,
  LanguageMapping,
  LanguagePattern,
  LogLevel,
} from "./models.js";

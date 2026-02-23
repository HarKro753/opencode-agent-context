/**
 * Type declarations for @opencode-ai/plugin peer dependency.
 * These are minimal stubs that allow the package to typecheck
 * without requiring the peer dependency to be installed.
 */
declare module "@opencode-ai/plugin" {
  export interface PluginContext {
    directory: string;
    client: {
      app: {
        log(params: {
          body: {
            service: string;
            level: string;
            message: string;
            extra?: Record<string, unknown>;
          };
        }): Promise<void>;
      };
      find: {
        files(params: { query: { query: string } }): Promise<string[]>;
      };
      tui: {
        showToast(params: {
          body: { message: string; variant: string };
        }): Promise<void>;
      };
    };
  }

  export type Plugin = (ctx: PluginContext) => Promise<{
    event?: (input: { event: { type: string; properties?: unknown } }) => Promise<void>;
    "tool.execute.after"?: (
      input: { tool: string; args?: Record<string, unknown> },
      output: unknown,
    ) => Promise<void>;
    "experimental.session.compacting"?: (
      input: unknown,
      output: { context: string[] },
    ) => Promise<void>;
    tool?: Record<string, unknown>;
  }>;

  interface SchemaChain {
    describe(desc: string): SchemaChain;
    optional(): SchemaChain;
  }

  interface SchemaBuilder {
    string(): SchemaChain;
  }

  interface ToolOptions {
    description: string;
    args: Record<string, unknown>;
    execute: (args: Record<string, string>, context: { directory: string }) => Promise<string>;
  }

  interface ToolFunction {
    (options: ToolOptions): unknown;
    schema: SchemaBuilder;
  }

  export const tool: ToolFunction;
}

declare module "@opencode-ai/plugin" {
  export interface SessionInfo {
    id: string;
    title?: string;
  }

  export interface MessagePart {
    type: "text";
    text: string;
  }

  export interface PromptBody {
    model?: { providerID: string; modelID: string };
    parts: MessagePart[];
    noReply?: boolean;
  }

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
      session: {
        create(params: { body: { title?: string } }): Promise<SessionInfo>;
        prompt(params: {
          path: { id: string };
          body: PromptBody;
        }): Promise<unknown>;
        delete(params: { path: { id: string } }): Promise<void>;
        abort(params: { path: { id: string } }): Promise<void>;
        list(): Promise<SessionInfo[]>;
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
    event?: (input: {
      event: { type: string; properties?: unknown };
    }) => Promise<void>;
    "tool.execute.after"?: (
      input: { tool: string; args?: Record<string, unknown> },
      output: unknown,
    ) => Promise<void>;
    "experimental.session.compacting"?: (
      input: unknown,
      output: { context: string[]; prompt?: string },
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

  interface ToolContext {
    agent: string;
    sessionID: string;
    messageID: string;
    directory: string;
    worktree: string;
  }

  interface ToolOptions {
    description: string;
    args: Record<string, unknown>;
    execute: (args: Record<string, string>, context: ToolContext) => Promise<string>;
  }

  interface ToolFunction {
    (options: ToolOptions): unknown;
    schema: SchemaBuilder;
  }

  export const tool: ToolFunction;
}

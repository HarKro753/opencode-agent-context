export interface ExtractedRuleFromLLM {
  readonly rule: string;
  readonly language: string;
}

export interface RawRuleItem {
  rule?: unknown;
  language?: unknown;
}

export interface LanguageMapping {
  readonly extensions: readonly string[];
  readonly language: string;
}

export interface LanguagePattern {
  readonly pattern: RegExp;
  readonly language: string;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

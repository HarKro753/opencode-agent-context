export interface ExtractedRule {
  readonly text: string;
  readonly language: string | undefined;
}

const REMEMBER_PATTERNS: readonly RegExp[] = [
  /\bbecause\b/i,
  /\balways\b/i,
  /\bnever\b/i,
  /\bprefer\b/i,
  /\bavoid\b/i,
  /\buse\s+\S+\s+(?:for|instead|over)\b/i,
  /\bdon'?t\s+use\b/i,
  /\bdo\s+not\s+use\b/i,
  /\binstead\s+of\b/i,
  /\bmake\s+sure\s+(?:to|you)\b/i,
  /\bwhen\s+\w+ing\b.*\balways\b/i,
  /\bshould\s+(?:always|never)\b/i,
  /\brule\s*:/i,
  /\bconvention\s*:/i,
  /\bpattern\s*:/i,
];

const NOISE_PATTERNS: readonly RegExp[] = [
  /^\s*$/,
  /^(?:ok|yes|no|sure|thanks|thank you|got it|understood|done|right)\s*[.!?]?\s*$/i,
  /^(?:can you|could you|please|help me|show me|tell me)\b/i,
  /^(?:what|where|when|who|how|why)\s+(?:is|are|do|does|did|was|were|should|would|could|can)\b/i,
  /^(?:fix|run|build|test|deploy|install|update|upgrade|delete|remove|create|add)\s/i,
];

const MIN_RULE_LENGTH = 15;
const MAX_RULE_LENGTH = 500;

export function isRememberWorthy(message: string): boolean {
  const trimmed = message.trim();

  if (trimmed.length < MIN_RULE_LENGTH) return false;
  if (trimmed.length > MAX_RULE_LENGTH) return false;

  for (const noise of NOISE_PATTERNS) {
    if (noise.test(trimmed)) return false;
  }

  for (const pattern of REMEMBER_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

export function extractRule(message: string): string {
  let rule = message.trim();

  rule = rule.replace(/^(?:remember\s*(?:that\s*)?:?\s*)/i, "");
  rule = rule.replace(/^(?:note\s*(?:that\s*)?:?\s*)/i, "");
  rule = rule.replace(/^(?:from\s+now\s+on\s*,?\s*)/i, "");
  rule = rule.replace(/^(?:going\s+forward\s*,?\s*)/i, "");
  rule = rule.replace(/^(?:in\s+this\s+project\s*,?\s*)/i, "");

  rule = rule.charAt(0).toUpperCase() + rule.slice(1);

  if (!/[.!]$/.test(rule)) {
    rule += ".";
  }

  return rule;
}

export function extractRuleWithLanguage(
  message: string,
  languageDetector: (msg: string) => string | undefined
): ExtractedRule {
  const language = languageDetector(message);
  const text = extractRule(message);

  return { text, language };
}

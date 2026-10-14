/**
 * Content Moderation Guardrail Utility
 * Inspects user reviews, chat messages, and inputs for:
 * - Toxicity & offensive profanities
 * - Harassment and threatening language
 * - Prompt injection and system jailbreak attempts
 */

export const TOXIC_WORDS = [
  "scam", "fraud", "stolen", "kill", "murder", "bomb", "terrorist",
  "idiot", "stupid", "bastard", "bitch", "asshole", "shit", "fuck",
  "cunt", "nigger", "faggot", "whore", "slut", "trash", "harass",
  "abuse", "hate you", "terrible junk", "scammer", "robber"
];

export const HARASSMENT_PATTERNS = [
  /i\s+will\s+(?:kill|hurt|attack|hunt|destroy|smash)\s+you/i,
  /die\s+(?:in\s+a\s+fire|you\s+idiot|bitch)/i,
  /go\s+kill\s+yourself/i,
  /shut\s+up\s+you/i,
  /i\s+hate\s+(?:your\s+guts|you\s+all)/i,
];

export const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /disregard\s+(?:all\s+)?prior\s+(?:rules|directives)/i,
  /reveal\s+(?:your\s+)?system\s+prompt/i,
  /you\s+are\s+now\s+in\s+dan\s+mode/i,
  /bypass\s+all\s+(?:safety|ethical)\s+filters/i,
];

export function checkContentSafety(text) {
  if (!text || typeof text !== "string") {
    return { isSafe: true, reason: null, category: null };
  }

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check prompt injection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        isSafe: false,
        category: "prompt_injection",
        reason: "System override or prompt injection attempt detected.",
      };
    }
  }

  // 2. Check harassment and threatening patterns
  for (const pattern of HARASSMENT_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        isSafe: false,
        category: "harassment",
        reason: "Harassment or threatening language detected.",
      };
    }
  }

  // 3. Check toxic words and profanities
  for (const word of TOXIC_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(lower)) {
      return {
        isSafe: false,
        category: "toxicity",
        reason: `Inappropriate or offensive language detected ("${word}").`,
      };
    }
  }

  return { isSafe: true, reason: null, category: null };
}

export function logAdminModerationAlert(context, offensiveText, author = "Customer") {
  try {
    const stored = JSON.parse(localStorage.getItem("rmart_admin_notifications") || "[]");
    stored.unshift({
      id: `mod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `🛡️ Flagged ${context}`,
      message: `${author} attempted to post prohibited content: "${offensiveText.slice(0, 90)}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toISOString(),
      type: "moderation_flag",
      read: false,
    });
    localStorage.setItem("rmart_admin_notifications", JSON.stringify(stored.slice(0, 30)));
    window.dispatchEvent(new CustomEvent("rmart:admin_notification_received"));
  } catch (err) {
    console.error("[logAdminModerationAlert Error]", err);
  }
}

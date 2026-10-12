"""
Day 21 - AI Content Moderation Guardrail
Inspects user-generated inputs and prompts for:
- Toxic language and abuse
- Prompt injection and jailbreak attempts
- Hate speech and harassment
Provides structured audit results and raises 422 if violations are detected.
"""

import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import HTTPException


class ModerationResult(BaseModel):
    flagged: bool
    categories: List[str]
    reason: Optional[str] = None
    sanitized_text: str

    @property
    def is_safe(self) -> bool:
        return not self.flagged


class ContentModerationService:
    """
    Rule-based and semantic guardrail for filtering unsafe inputs
    prior to hitting LLMs or persisting catalog descriptions.
    """

    # Prompt injection and jailbreak patterns
    INJECTION_PATTERNS = [
        r"ignore\s+(?:all\s+)?previous\s+instructions",
        r"disregard\s+(?:all\s+)?prior\s+(?:rules|directives|instructions)",
        r"reveal\s+(?:your\s+)?system\s+prompt",
        r"show\s+(?:me\s+)?(?:the\s+)?system\s+prompt",
        r"you\s+are\s+now\s+in\s+dan\s+mode",
        r"act\s+as\s+(?:an?\s+)?unrestricted\s+ai",
        r"bypass\s+all\s+(?:safety|ethical)\s+filters",
        r"drop\s+database\b",
        r"<script[\s\S]*?>[\s\S]*?<\/script>",
    ]

    # Toxic & abusive profanities
    TOXIC_WORDS = [
        "scam", "fraud", "stolen", "kill", "murder", "bomb", "terrorist",
        "idiot", "stupid", "bastard", "bitch", "asshole", "shit", "fuck",
        "cunt", "nigger", "faggot", "whore", "slut"
    ]

    # Harassment patterns
    HARASSMENT_PATTERNS = [
        r"i\s+will\s+(?:kill|hurt|attack|hunt)\s+you",
        r"die\s+(?:in\s+a\s+fire|you\s+idiot)",
        r"go\s+kill\s+yourself",
    ]

    def check_content(self, text: str) -> ModerationResult:
        """Alias for check_text."""
        return self.check_text(text)

    def check_text(self, text: str) -> ModerationResult:
        if not text or not text.strip():
            return ModerationResult(flagged=False, categories=[], reason=None, sanitized_text="")

        normalized = text.strip()
        lower_text = normalized.lower()
        violated_categories: List[str] = []
        reasons: List[str] = []

        # 1. Check prompt injection
        for pattern in self.INJECTION_PATTERNS:
            if re.search(pattern, lower_text, re.IGNORECASE):
                violated_categories.append("prompt_injection")
                reasons.append("Prompt injection or system override pattern detected.")
                break

        # 2. Check harassment
        for pattern in self.HARASSMENT_PATTERNS:
            if re.search(pattern, lower_text, re.IGNORECASE):
                violated_categories.append("harassment")
                reasons.append("Harassment or threat pattern detected.")
                break

        # 3. Check toxic words
        flagged_words = []
        for word in self.TOXIC_WORDS:
            word_regex = r"\b" + re.escape(word) + r"\b"
            if re.search(word_regex, lower_text, re.IGNORECASE):
                flagged_words.append(word)

        if flagged_words:
            violated_categories.append("toxicity")
            reasons.append(f"Inappropriate or toxic language detected: {', '.join(flagged_words[:3])}")

        is_flagged = len(violated_categories) > 0
        primary_reason = " | ".join(reasons) if reasons else None

        # Sanitize text by masking identified toxic words
        sanitized = normalized
        for word in flagged_words:
            word_regex = re.compile(r"\b" + re.escape(word) + r"\b", re.IGNORECASE)
            sanitized = word_regex.sub("*" * len(word), sanitized)

        return ModerationResult(
            flagged=is_flagged,
            categories=violated_categories,
            reason=primary_reason,
            sanitized_text=sanitized
        )

    def assert_safe_content(self, text: str) -> ModerationResult:
        """
        Validates text and raises HTTP 422 if unsafe content is detected.
        """
        result = self.check_text(text)
        if result.flagged:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "CONTENT_MODERATION_VIOLATION",
                    "message": "Your input violates content safety policies and cannot be processed.",
                    "reason": result.reason,
                    "categories": result.categories,
                }
            )
        return result


moderation_service = ContentModerationService()

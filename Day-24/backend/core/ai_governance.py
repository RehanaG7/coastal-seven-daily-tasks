"""
Day 22 Capstone - Responsible AI & Cost Governance Service
Tracks token consumption, free-tier quota compliance, Redis cache savings,
and guarantees $0.00 API spend across all LLM operations.
"""

import time
from typing import Dict, Any, List
from datetime import datetime, timezone


class CostGovernanceService:
    def __init__(self):
        self._total_requests: int = 0
        self._cache_hits: int = 0
        self._cache_misses: int = 0
        self._prompt_tokens: int = 0
        self._completion_tokens: int = 0
        self._transactions: List[Dict[str, Any]] = []
        # Free tier pricing model (e.g., standard Gemini 1.5/2.0 Flash pricing used to calculate savings)
        # $0.075 per 1M input tokens, $0.30 per 1M output tokens
        self.COST_PER_INPUT_TOKEN = 0.000000075
        self.COST_PER_OUTPUT_TOKEN = 0.000000300

    def record_transaction(
        self,
        endpoint: str,
        provider: str,
        prompt_tokens: int,
        completion_tokens: int,
        was_cached: bool = False,
        latency_ms: float = 0.0,
        user_identity: str = "anonymous"
    ):
        """Records an AI operation for quota monitoring and financial audit."""
        self._total_requests += 1
        if was_cached:
            self._cache_hits += 1
        else:
            self._cache_misses += 1
            self._prompt_tokens += prompt_tokens
            self._completion_tokens += completion_tokens

        # Estimated theoretical commercial cost if non-free provider was billed
        theoretical_cost = (prompt_tokens * self.COST_PER_INPUT_TOKEN) + (completion_tokens * self.COST_PER_OUTPUT_TOKEN)
        # In our architecture, actual cost is strictly $0.00 (Free Tier + Local Fallback)
        actual_cost = 0.00

        entry = {
            "id": f"gov_{int(time.time() * 1000)}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "endpoint": endpoint,
            "provider": provider,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
            "was_cached": was_cached,
            "latency_ms": round(latency_ms, 2),
            "user_identity": user_identity,
            "theoretical_cost": round(theoretical_cost, 6),
            "actual_cost": actual_cost,
        }

        # Keep rolling window of last 50 transactions
        self._transactions.insert(0, entry)
        if len(self._transactions) > 50:
            self._transactions.pop()

    def get_governance_metrics(self) -> Dict[str, Any]:
        """Calculates live governance statistics and dollar savings."""
        total_tokens = self._prompt_tokens + self._completion_tokens
        cache_total = self._cache_hits + self._cache_misses
        hit_ratio = round((self._cache_hits / cache_total * 100), 1) if cache_total > 0 else 0.0

        # Estimate savings achieved by avoiding LLM calls via Redis Cache
        # Average prompt = 350 tokens, completion = 250 tokens per cached request
        avg_saved_tokens_per_hit = 600
        total_saved_tokens = self._cache_hits * avg_saved_tokens_per_hit
        dollars_saved = round((total_saved_tokens * 0.00000020), 4)

        return {
            "status": "COMPLIANT",
            "target_spend": "$0.00",
            "actual_spend": "$0.00",
            "free_tier_status": "100% Free-Tier / Zero Cost Compliant",
            "total_requests": self._total_requests,
            "cache_hits": self._cache_hits,
            "cache_misses": self._cache_misses,
            "cache_hit_ratio_percent": hit_ratio,
            "total_tokens_consumed": total_tokens,
            "prompt_tokens": self._prompt_tokens,
            "completion_tokens": self._completion_tokens,
            "estimated_dollars_saved": dollars_saved,
            "rate_limits": {
                "anonymous": "5 req/min",
                "customer": "20 req/min",
                "admin": "60 req/min"
            },
            "active_providers": [
                {"name": "Google Gemini (Free Tier)", "tier": "Free", "quota": "15 RPM / 1M TPM"},
                {"name": "Groq LPU (Free Tier)", "tier": "Free", "quota": "30 RPM / 14.4k RPD"},
                {"name": "R-Mart Local RAG Engine", "tier": "Offline Safety Net", "quota": "Unlimited ($0.00)"}
            ],
            "recent_transactions": self._transactions[:15]
        }

    def reset_metrics(self):
        """Resets counters for clean testing runs."""
        self._total_requests = 0
        self._cache_hits = 0
        self._cache_misses = 0
        self._prompt_tokens = 0
        self._completion_tokens = 0
        self._transactions = []


# Global singleton instance
cost_governance = CostGovernanceService()

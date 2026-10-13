"""
Day 21 - AI Tools & Agent Router
Endpoints:
1. POST /api/v1/ai/generate-description - AI Product Copywriter
2. GET  /api/v1/ai/semantic-search     - Dense Vector Product Retrieval with Fallback
3. POST /api/v1/ai/moderate            - Content Moderation Guardrail Inspection
4. POST /api/v1/ai/agent/chat          - Autonomous Agent with Tool Calling
5. POST /api/v1/ai/cache/invalidate    - Redis AI Cache Invalidation
"""

import time
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from core.redis_ai_cache import ai_cache
from core.ai_rate_limiter import ai_rate_limit_dep, resolve_request_identity
from core.moderation_service import moderation_service
from core.ai_copywriter import ai_copywriter
from core.vector_store import vector_store
from core.ai_agent import ai_agent


router = APIRouter()


class DescriptionRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=150, description="Product title")
    category: Optional[str] = Field("General", description="Product category")
    features: Optional[List[str]] = Field(default=[], description="Bullet features or specifications")
    tone: Optional[str] = Field("professional", description="Tone: professional, persuasive, minimalist, enthusiastic")
    target_audience: Optional[str] = Field(None, description="Optional target shopper audience")
    force_refresh: Optional[bool] = Field(False, description="Bypass Redis cache if True")


class ModerationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Text to inspect for policy compliance")


class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User instruction or question")
    history: Optional[List[Dict[str, str]]] = Field(default=[], description="Conversation history")


def inject_rate_limit_headers(response: Response, request: Request):
    """Utility to inject X-RateLimit headers from request state."""
    rl = getattr(request.state, "ai_rate_limit", None)
    if rl:
        response.headers["X-RateLimit-Limit"] = str(rl.get("limit", 60))
        response.headers["X-RateLimit-Remaining"] = str(rl.get("remaining", 59))
        response.headers["X-RateLimit-Reset"] = str(rl.get("reset", 60))
        response.headers["X-RateLimit-Identity"] = str(rl.get("identity", "anonymous"))


@router.post(
    "/generate-description",
    summary="Generate high-converting product description with AI",
    dependencies=[Depends(ai_rate_limit_dep)]
)
def generate_product_description_endpoint(
    req: DescriptionRequest,
    request: Request,
    response: Response
):
    """
    AI Product Copywriter:
    - Passes input through content moderation
    - Checks Redis AI cache (TTL: 3600s)
    - Generates copy via Groq -> Gemini -> Local Fallback
    - Injects X-AI-Cache (HIT/MISS) and rate limit headers
    """
    start_time = time.time()

    # Generate or retrieve from cache
    result = ai_copywriter.generate_product_description(
        title=req.title,
        category=req.category or "General",
        features=req.features or [],
        tone=req.tone or "professional",
        target_audience=req.target_audience,
        force_refresh=bool(req.force_refresh)
    )

    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    was_cached = bool(result.get("cached", False))

    response.headers["X-AI-Cache"] = "HIT" if was_cached else "MISS"
    response.headers["X-AI-Latency-Ms"] = str(elapsed_ms)
    inject_rate_limit_headers(response, request)

    return {
        "success": True,
        "cached": was_cached,
        "latency_ms": elapsed_ms,
        "data": result
    }


@router.get(
    "/semantic-search",
    summary="Semantic vector search for products using ChromaDB dense embeddings"
)
def semantic_search_endpoint(
    request: Request,
    response: Response,
    q: str = Query(..., min_length=1, description="Natural language search query"),
    limit: int = Query(6, ge=1, le=20, description="Max results to return"),
    min_score: float = Query(0.2, ge=0.0, le=1.0, description="Minimum relevance score"),
    db: Session = Depends(get_db)
):
    """
    Semantic Search:
    - Translates user intent (e.g. 'headphones for sleeping') to nearest catalog vectors
    - Checks Redis cache (TTL: 300s)
    - Gracefully degrades to SQL keyword matching if vector similarity yields 0 hits
    """
    # 1. Moderation check
    moderation_service.assert_safe_content(q)

    # 2. Redis Cache check
    cache_payload = {"q": q.strip().lower(), "limit": limit, "min_score": min_score}
    cached_hits = ai_cache.get("semantic_search", cache_payload)
    if cached_hits is not None:
        response.headers["X-AI-Cache"] = "HIT"
        inject_rate_limit_headers(response, request)
        return {
            "query": q,
            "cached": True,
            "total_matches": len(cached_hits.get("items", [])),
            "search_mode": cached_hits.get("search_mode", "vector_semantic"),
            "items": cached_hits.get("items", [])
        }

    # 3. ChromaDB Search
    start_time = time.time()
    raw_hits = vector_store.search_similar_products(query=q, top_k=limit, db=db)

    # Filter by score
    filtered_hits = [
        h for h in raw_hits if h.get("relevance_score", 0.0) >= min_score
    ]

    search_mode = "vector_semantic"
    if not filtered_hits and raw_hits:
        filtered_hits = raw_hits
        search_mode = "vector_semantic_low_confidence"
    elif not filtered_hits:
        # Graceful fallback to keyword search
        filtered_hits = vector_store._keyword_search_fallback(query=q, db=db, top_k=limit)
        search_mode = "fallback_keyword"

    payload_to_cache = {
        "items": filtered_hits,
        "search_mode": search_mode
    }
    ai_cache.set("semantic_search", cache_payload, payload_to_cache, ttl_seconds=300)

    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    response.headers["X-AI-Cache"] = "MISS"
    response.headers["X-AI-Latency-Ms"] = str(elapsed_ms)
    inject_rate_limit_headers(response, request)

    return {
        "query": q,
        "cached": False,
        "latency_ms": elapsed_ms,
        "total_matches": len(filtered_hits),
        "search_mode": search_mode,
        "items": filtered_hits
    }


@router.post(
    "/moderate",
    summary="Content moderation guardrail evaluation"
)
def content_moderation_endpoint(
    req: ModerationRequest
):
    """
    Checks text for toxicity, harassment, and prompt injection attempts.
    """
    result = moderation_service.check_text(req.text)
    return {
        "flagged": result.flagged,
        "categories": result.categories,
        "reason": result.reason,
        "sanitized_text": result.sanitized_text
    }


@router.post(
    "/agent/chat",
    summary="AI Agent conversational endpoint with autonomous tool calling",
    dependencies=[Depends(ai_rate_limit_dep)]
)
def agent_chat_endpoint(
    req: AgentChatRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Autonomous AI Agent with tool calling:
    - Resolves user identity
    - Checks moderation
    - Autonomously invokes tools: stock check, order tracking, coupon validation, support tickets
    - Emits execution trace with steps
    """
    # 1. Moderation
    moderation_service.assert_safe_content(req.message)

    # 2. Extract user ID if authenticated
    identity, _ = resolve_request_identity(request)
    user_id = int(identity.split(":")[1]) if identity.startswith("user:") and identity.split(":")[1].isdigit() else None

    # 3. Agent execution
    agent_output = ai_agent.run(
        message=req.message,
        db=db,
        user_id=user_id
    )

    inject_rate_limit_headers(response, request)

    return {
        "success": True,
        "message": req.message,
        "answer": agent_output["answer"],
        "has_tool_call": agent_output["has_tool_call"],
        "tool_name": agent_output["tool_name"],
        "tool_result": agent_output["tool_result"],
        "trace": agent_output["trace"]
    }


@router.post(
    "/cache/invalidate",
    summary="Flush cached AI responses in Redis"
)
def invalidate_ai_cache_endpoint(
    namespace: Optional[str] = Query(None, description="Cache namespace to flush (e.g., 'product_description', 'semantic_search')")
):
    """
    Evicts cached AI responses from Redis.
    """
    deleted_count = ai_cache.invalidate(namespace)
    return {
        "success": True,
        "namespace": namespace or "all",
        "keys_evicted": deleted_count,
        "message": f"Successfully flushed {deleted_count} cached entries."
    }

"""
Day 20 - AI Chat Router with Server-Sent Events (SSE) Streaming,
ChromaDB Vector Indexing, and Provider Status Health Check.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from core.ai_service import ai_service
from core.vector_store import vector_store


router = APIRouter()


class ChatMessagePayload(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message text content")


class ChatStreamRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User prompt or question")
    history: Optional[List[ChatMessagePayload]] = Field(default=[], description="Recent conversation turns")


@router.post("/chat/stream", summary="Stream RAG-grounded AI shopping assistant responses via SSE")
async def stream_ai_chat_endpoint(
    req: ChatStreamRequest,
    db: Session = Depends(get_db)
):
    """
    Server-Sent Events (SSE) streaming endpoint:
    - Performs ChromaDB semantic vector search against store catalog.
    - Grounded prompt injection with stock enforcement and jokes.
    - Multi-provider fallback: Groq -> Gemini -> Local RAG Engine.
    - Yields SSE tokens with source citations metadata.
    """
    history_dicts = [h.model_dump() for h in (req.history or [])]
    return StreamingResponse(
        ai_service.stream_chat(query=req.message, history=history_dicts, db=db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream; charset=utf-8",
        }
    )


@router.post("/index-catalog", summary="Index or re-index product catalog into ChromaDB")
def index_catalog_endpoint(db: Session = Depends(get_db)):
    """
    Manually triggers product catalog chunking and embedding into ChromaDB vector store.
    """
    try:
        count = vector_store.index_products(db)
        return {
            "status": "success",
            "message": f"Successfully indexed {count} products into ChromaDB vector store.",
            "total_indexed": count,
            "collection": "product_catalog"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")


@router.get("/health", summary="Check status of AI providers and ChromaDB vector store")
def ai_health_status(db: Session = Depends(get_db)):
    """
    Returns health status of AI providers and vector collection count.
    """
    collection_count = 0
    try:
        collection_count = vector_store.collection.count()
    except Exception:
        pass

    return {
        "status": "online",
        "service": "R-Mart AI RAG Shopping Assistant",
        "vector_store": {
            "engine": "ChromaDB",
            "collection": "product_catalog",
            "indexed_documents": collection_count,
        },
        "providers": {
            "primary": {
                "name": "Groq",
                "model": "llama-3.3-70b-versatile",
                "configured": bool(ai_service.groq_api_key and ai_service.groq_api_key != "your_groq_api_key_here")
            },
            "secondary": {
                "name": "Google Gemini",
                "model": "gemini-2.0-flash",
                "configured": bool(ai_service.gemini_api_key and ai_service.gemini_api_key != "your_gemini_api_key_here")
            },
            "tertiary": {
                "name": "Local RAG Intelligence",
                "model": "Zero-Downtime Rule-Grounded Generator",
                "configured": True,
            }
        }
    }

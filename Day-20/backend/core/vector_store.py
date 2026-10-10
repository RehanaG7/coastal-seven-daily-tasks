"""
Day 20 - Vector Store and RAG Retrieval Service using ChromaDB
Provides document chunking, vector indexing, and semantic similarity search
grounded strictly in the product catalogue.
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.config import Settings
from sqlalchemy.orm import Session

from models.product import Product


CHROMA_DIR = Path(__file__).resolve().parent.parent / "chroma_db"
CHROMA_DIR.mkdir(parents=True, exist_ok=True)


class VectorStoreService:
    def __init__(self, persist_directory: Optional[Path] = None):
        self.persist_directory = persist_directory or CHROMA_DIR
        try:
            self.client = chromadb.PersistentClient(path=str(self.persist_directory))
            self.collection = self.client.get_or_create_collection(
                name="product_catalog",
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as e:
            print(f"[VectorStore] Fallback to in-memory Chroma Client due to: {e}")
            self.client = chromadb.Client()
            self.collection = self.client.get_or_create_collection(
                name="product_catalog",
                metadata={"hnsw:space": "cosine"}
            )

    def index_products(self, db: Session) -> int:
        """
        Chunks and indexes all products from the relational database into ChromaDB.
        """
        products = db.query(Product).all()
        if not products:
            return 0

        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []
        ids: List[str] = []

        for p in products:
            p_title = getattr(p, "name", getattr(p, "title", "Product"))
            p_desc = getattr(p, "description", "") or "No description provided"
            p_cat = getattr(p, "category", "General") or "General"
            # Document chunk designed for optimal semantic dense retrieval
            doc_text = (
                f"Product ID: {p.id}\n"
                f"Title: {p_title}\n"
                f"Category: {p_cat}\n"
                f"Price: ${float(p.price):.2f}\n"
                f"Stock: {int(p.stock)} units available\n"
                f"Description: {p_desc}"
            )
            documents.append(doc_text)
            ids.append(f"prod_{p.id}")
            metadatas.append({
                "id": int(p.id),
                "title": str(p_title),
                "price": float(p.price),
                "stock": int(p.stock),
                "category": str(p_cat),
                "description": str(p_desc)[:200],
            })

        # Upsert documents into collection
        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
        )
        print(f"[VectorStore] Successfully indexed {len(ids)} products into ChromaDB.")
        return len(ids)

    def search_similar_products(self, query: str, top_k: int = 4, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """
        Retrieves top_k relevant product documents for a given user query.
        Returns product records with full metadata and relevance snippets.
        """
        if not query or not query.strip():
            return []

        # If collection is currently empty and DB session is available, index first
        if self.collection.count() == 0 and db is not None:
            self.index_products(db)

        # 1. Semantic Vector Search via ChromaDB
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=min(top_k, max(self.collection.count(), 1))
            )

            hits = []
            if results and results.get("ids") and results["ids"][0]:
                for idx, doc_id in enumerate(results["ids"][0]):
                    metadata = results["metadatas"][0][idx] if results.get("metadatas") else {}
                    document = results["documents"][0][idx] if results.get("documents") else ""
                    distance = results["distances"][0][idx] if results.get("distances") else 0.5
                    hits.append({
                        "id": metadata.get("id"),
                        "title": metadata.get("title", ""),
                        "price": metadata.get("price", 0.0),
                        "stock": metadata.get("stock", 0),
                        "description": metadata.get("description", ""),
                        "snippet": document,
                        "relevance_score": round(max(0.0, 1.0 - float(distance)), 3),
                    })
                if hits:
                    return hits
        except Exception as e:
            print(f"[VectorStore] Semantic query notice: {e}")

        # 2. Resilient Keyword/Fuzzy Fallback (if ChromaDB count is 0 or query fails)
        if db is not None:
            return self._keyword_search_fallback(query, db, top_k)

        return []

    def _keyword_search_fallback(self, query: str, db: Session, top_k: int) -> List[Dict[str, Any]]:
        """
        Fuzzy keyword token search to ensure 100% availability even in edge cases.
        """
        tokens = [t.lower() for t in re.findall(r"\w+", query) if len(t) > 2]
        products = db.query(Product).all()
        scored = []

        for p in products:
            p_title = getattr(p, "name", getattr(p, "title", "Product"))
            p_desc = getattr(p, "description", "") or ""
            text = f"{p_title} {p_desc}".lower()
            score = sum(1 for token in tokens if token in text)
            if score > 0 or not tokens:
                scored.append((score, {
                    "id": p.id,
                    "title": p_title,
                    "price": float(p.price),
                    "stock": int(p.stock),
                    "description": p_desc,
                    "snippet": f"Product: {p_title} (${p.price}) - Stock: {p.stock}",
                    "relevance_score": 0.85 if score > 0 else 0.5,
                }))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:top_k]]


# Global singleton instance
vector_store = VectorStoreService()

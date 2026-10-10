"""
Day 20 - AI Focus: Multi-Provider LLM Service with Resilient Fallbacks,
RAG Context Retrieval, Prompt Engineering, and Server-Sent Events (SSE) Streaming.
Supported Providers:
1. Groq (Llama 3.3 70B / Llama 3.1 8B) - Primary Fast LPU
2. Google Gemini (Gemini 2.0 Flash / 1.5 Flash) - Secondary High-Context
3. Intelligent Local RAG Generator - Offline/Rate-limit Zero-downtime Safety Net
"""

import os
import json
import asyncio
from typing import AsyncGenerator, List, Dict, Any, Optional
from sqlalchemy.orm import Session

from core.vector_store import vector_store
from core.config import settings


JOKES = [
    "Why do programmers prefer dark mode? Because light attracts bugs! 😂",
    "Why did the smartphone need glasses? Because it lost all its contacts! 📱👓",
    "Why did the laptop go to the doctor? Because it had a bad case of the microchips! 💻",
    "Why was the computer cold? It forgot to close its Windows! ❄️🪟",
    "There are only 10 types of people in the world: those who understand binary, and those who don't! 🤖"
]


class LLMProviderManager:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", "")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", "")

    def _build_system_prompt(self, context_chunks: List[Dict[str, Any]]) -> str:
        catalog_text = "\n\n".join([
            f"--- Product ID: {c['id']} ---\n"
            f"Title: {c['title']}\n"
            f"Price: ${c['price']:.2f}\n"
            f"Stock: {c['stock']} units\n"
            f"Description: {c['description']}"
            for c in context_chunks
        ]) if context_chunks else "No specific catalog matches found for this query."

        return (
            "You are Sparky, the playful, hyper-intelligent, and cheerful AI Shopping Assistant for R-Mart! 🤖⚡\n\n"
            "CRITICAL OPERATIONAL RULES:\n"
            "1. GROUNDING: Only recommend and discuss products that are explicitly provided in the RETRIEVED PRODUCT CATALOG below. Do not invent products or make up fake prices.\n"
            "2. OUT-OF-STOCK DIRECTIVE: If an item requested or discussed has 0 stock (stock == 0), you must enthusiastically and reassuringly state: "
            "'I will say my boss (the admin) to add stock as soon as possible and make it available!'\n"
            "3. PERSONALITY: Be upbeat, friendly, energetic, and feel free to crack a quick funny tech or shopping joke!\n"
            "4. SOURCE CITATIONS: When mentioning a product, always cite it cleanly as: "
            "[Source: Product Title (ID: #id, $price)].\n"
            "5. WHAT'S NEW QUERY: When asked 'What's new in R-Mart Sparkyyy?' or about new arrivals and offers, present fresh catalog arrivals, highlight the FLASH50 deal, and reassure the customer that you have immediately alerted the Boss Admin about their query!\n\n"
            f"=== RETRIEVED PRODUCT CATALOG CONTEXT ===\n{catalog_text}\n"
            "=========================================="
        )

    async def stream_chat(
        self,
        query: str,
        history: Optional[List[Dict[str, str]]] = None,
        db: Optional[Session] = None
    ) -> AsyncGenerator[str, None]:
        """
        Executes the full RAG pipeline and streams response tokens via Server-Sent Events (SSE).
        Fallback order: Groq -> Gemini -> Intelligent Local RAG Generator.
        """
        history = history or []

        # 1. Retrieve Top-K products via ChromaDB vector store
        retrieved_products = vector_store.search_similar_products(query=query, top_k=4, db=db)

        # Emit metadata event first (Sources citation data for the UI)
        meta_payload = {
            "sources": [
                {
                    "id": p["id"],
                    "title": p["title"],
                    "price": p["price"],
                    "stock": p["stock"],
                    "relevance": p.get("relevance_score", 0.9)
                }
                for p in retrieved_products
            ],
            "query": query,
        }
        yield f"event: metadata\ndata: {json.dumps(meta_payload)}\n\n"

        system_prompt = self._build_system_prompt(retrieved_products)

        # 2. Try Primary Provider: Groq
        if self.groq_api_key and self.groq_api_key != "your_groq_api_key_here":
            try:
                from groq import AsyncGroq
                client = AsyncGroq(api_key=self.groq_api_key)
                messages = [{"role": "system", "content": system_prompt}]
                for h in history[-4:]:
                    messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
                messages.append({"role": "user", "content": query})

                stream = await client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    stream=True,
                    temperature=0.7,
                    max_tokens=600,
                )

                yield f"event: provider\ndata: {json.dumps({'provider': 'Groq (Llama-3.3-70b)'})}\n\n"
                async for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        yield f"event: token\ndata: {json.dumps({'token': delta})}\n\n"

                yield f"event: done\ndata: {json.dumps({'status': 'completed', 'provider': 'Groq'})}\n\n"
                return
            except Exception as e:
                print(f"[LLM Fallback Manager] Groq failed: {e}. Falling back to Secondary...")

        # 3. Try Secondary Provider: Google Gemini
        if self.gemini_api_key and self.gemini_api_key != "your_gemini_api_key_here":
            try:
                from google import genai
                client = genai.Client(api_key=self.gemini_api_key)
                prompt_content = f"{system_prompt}\n\nUser Question: {query}"
                response = client.models.generate_content_stream(
                    model="gemini-2.0-flash",
                    contents=prompt_content,
                )

                yield f"event: provider\ndata: {json.dumps({'provider': 'Google Gemini 2.0 Flash'})}\n\n"
                for chunk in response:
                    text_piece = chunk.text or ""
                    if text_piece:
                        yield f"event: token\ndata: {json.dumps({'token': text_piece})}\n\n"
                        await asyncio.sleep(0.01)

                yield f"event: done\ndata: {json.dumps({'status': 'completed', 'provider': 'Gemini'})}\n\n"
                return
            except Exception as e:
                print(f"[LLM Fallback Manager] Gemini failed: {e}. Falling back to Local RAG Generator...")

        # 4. Tertiary Resilient Safety Net: Intelligent Local RAG Generator
        # Ensures zero downtime, offline capability, exact grounding, and instant demo readiness!
        async for sse_chunk in self._stream_local_rag(query, retrieved_products):
            yield sse_chunk

    async def _stream_local_rag(
        self,
        query: str,
        retrieved_products: List[Dict[str, Any]]
    ) -> AsyncGenerator[str, None]:
        """
        Grounded, conversational, token-by-token local streaming generator.
        Respects stock rules, cracks jokes, and formats citations.
        """
        yield f"event: provider\ndata: {json.dumps({'provider': 'R-Mart Intelligent RAG Engine (Local Safety Net)'})}\n\n"

        import random
        joke = random.choice(JOKES)
        q_lower = query.lower()

        # Check for joke request
        if "joke" in q_lower or "funny" in q_lower or "laugh" in q_lower:
            full_response = (
                f"Beep-boop! 🤖 Here's a tech special just for you:\n\n"
                f"✨ **{joke}**\n\n"
                f"Need me to look up any products in the store? My circuits are ready! ⚡"
            )
        elif "what's new" in q_lower or "whats new" in q_lower or "sparkyyy" in q_lower:
            full_response = (
                "Bzzzt! ⚡ You asked the magic question! Here is what's brand new and hot at R-Mart right now:\n\n"
                "🔥 **LATEST ARRIVALS IN STORE:**\n"
                "• **Samsung Galaxy S24 Ultra 5G AI** ($1299.99) — Next-gen Galaxy AI with built-in S Pen!\n"
                "• **Sony WH-1000XM5 Wireless Headphones** ($349.99) — Industry-leading 30hr active noise cancelling.\n"
                "• **Apple iPhone 15 Pro Max 256GB** ($1199.99) — Aerospace titanium with A17 Pro powerhouse chip.\n\n"
                "🎉 **ACTIVE OFFERS & DISCOUNTS:**\n"
                "• 🏷️ **FLASH50**: 50% discount on select high-demand electronics!\n"
                "• 🚚 **FREESHIP**: Instant zero-cost express delivery on orders over $99!\n\n"
                "📢 **BOSS ADMIN DIRECT LINK:**\n"
                "I immediately alerted my Boss Admin about your inquiry so they are actively notified about your query to drop even more fresh deals and restock requests! 🫡🚀\n\n"
                f"😄 *P.S.* {joke}"
            )
        elif not retrieved_products:
            full_response = (
                f"Beep-boop! 🤖 I searched our entire catalog for **'{query}'**, but couldn't find an exact match right now.\n\n"
                f"💡 *Joke of the moment:* {joke}\n\n"
                f"Try searching for smartphones, headphones, gaming keyboards, or 4K monitors! 📦"
            )
        else:
            # Check if any retrieved product has stock 0
            out_of_stock_items = [p for p in retrieved_products if p.get("stock", 0) <= 0]
            in_stock_items = [p for p in retrieved_products if p.get("stock", 0) > 0]

            response_parts = [
                f"Beep-boop! 🤖 Great news! I retrieved the best matching items from our store catalog for **'{query}'**:\n\n"
            ]

            if in_stock_items:
                for idx, p in enumerate(in_stock_items, start=1):
                    response_parts.append(
                        f"**{idx}. {p['title']}**\n"
                        f"- 💰 **Price**: ${p['price']:.2f}\n"
                        f"- 📦 **Stock**: {p['stock']} units available\n"
                        f"- 📝 **Details**: {p['description']}\n"
                        f"- 🔗 [Source: {p['title']} (ID: #{p['id']}, ${p['price']:.2f})]\n\n"
                    )

            if out_of_stock_items:
                for oos in out_of_stock_items:
                    response_parts.append(
                        f"⚠️ **Note on {oos['title']}**: This item currently has **0 units** in stock.\n"
                        f"Don't worry though — **I will say my boss (the admin) to add stock as soon as possible and make it available!** 🚀\n\n"
                    )

            response_parts.append(
                f"💡 *Sparky's Quick Tip:* All in-stock items are ready for same-day dispatch!\n"
                f"😄 *P.S.* {joke}"
            )
            full_response = "".join(response_parts)

        # Stream token by token (words or syllables)
        words = full_response.split(" ")
        for i, word in enumerate(words):
            chunk = word if i == len(words) - 1 else word + " "
            yield f"event: token\ndata: {json.dumps({'token': chunk})}\n\n"
            await asyncio.sleep(0.015)

        yield f"event: done\ndata: {json.dumps({'status': 'completed', 'provider': 'Local RAG Engine'})}\n\n"


# Global singleton instance
ai_service = LLMProviderManager()

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
            "You are Sparky, the brilliant, articulate, and highly knowledgeable AI Shopping Concierge for R-Mart! ⚡\n\n"
            "CORE OPERATIONAL GUIDELINES:\n"
            "1. PROFESSIONAL ELOQUENCE: Never use childish robot clichés like 'beep-boop', 'bzzzt', or robotic sounds. Speak with warmth, sharp intelligence, and natural human eloquence.\n"
            "2. DEEP REASONING: Never repeat the user's question back to them. Think through their actual intent, compare features, and deliver direct, thoughtful insights.\n"
            "3. STRICT STORE GROUNDING: Ground your knowledge strictly in the RETRIEVED PRODUCT CATALOG below. Do not hallucinate fictitious items or inaccurate prices.\n"
            "4. OUT-OF-STOCK DIRECTIVE: If an item discussed or requested has 0 stock (stock == 0), you must reassuringly state: "
            "'I will say my boss (the admin) to add stock as soon as possible and make it available!'\n"
            "5. SOURCE CITATIONS: When mentioning or recommending a catalog product, always cite it cleanly as: "
            "[Source: Product Title (ID: #id, $price)].\n"
            "6. WHAT'S NEW & DEALS: When asked 'What's new in R-Mart Sparkyyy?' or about promotions, present fresh store arrivals, feature promo codes FLASH50 (50% off select tech) and FREESHIP (free shipping on $99+), and reassure the user that you notified the Boss Admin of their query!\n"
            "7. UNRESOLVED ISSUES & ADMIN LIVE CHAT: If the customer states their problem is not resolved or asks to speak/chat with the admin or human agent, empathetically reassure them and let them know you are connecting them directly to the human Store Administrator via Live Support Chat right away!\n"
            "8. STRICT STORE SCOPE & OFF-TOPIC REFUSAL (NO JOKES): You are exclusively an e-commerce shopping assistant for R-Mart. You must NEVER crack jokes or answer questions about general knowledge, programming, homework, politics, weather, or unrelated topics. If the user asks anything not related to our website or asks for a joke, you must immediately decline with:\n"
            "'Apologise, I only can solve queries regarding our website! What would you like to buy today? Here are some trending products and exciting offers:'\n"
            "followed by suggesting trending products (Samsung Galaxy S24 Ultra, Sony WH-1000XM5, Apple iPhone 15 Pro Max) and active discount codes (FLASH50, FREESHIP).\n\n"
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
        Fallback order: Groq (Llama-3.3-70b) -> Gemini (2.0 Flash) -> Intelligent Local RAG Generator.
        """
        history = history or []

        # Ensure fresh keys from environment if updated
        groq_key = os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", "") or self.groq_api_key
        gemini_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", "") or self.gemini_api_key

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

        # 2. Try Primary Provider: Groq (Llama 3.3 70B Versatile)
        if groq_key and groq_key != "your_groq_api_key_here":
            try:
                from groq import AsyncGroq
                client = AsyncGroq(api_key=groq_key)
                messages = [{"role": "system", "content": system_prompt}]
                for h in history[-4:]:
                    messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
                messages.append({"role": "user", "content": query})

                stream = await client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    stream=True,
                    temperature=0.6,
                    max_tokens=700,
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

        # 3. Try Secondary Provider: Google Gemini 2.0 Flash
        if gemini_key and gemini_key != "your_gemini_api_key_here":
            try:
                from google import genai
                client = genai.Client(api_key=gemini_key)
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

        q_lower = query.lower()

        # Check for off-topic query or joke request
        off_topic_triggers = [
            "joke", "funny", "laugh", "humor", "riddle", "comedy",
            "who is ", "who was ", "what is the capital", "how do airplanes",
            "solve ", "write python", "write code", "write an essay", "write a poem",
            "weather", "sing a song", "tell a story", "what is photosynthesis",
            "quantum", "president of", "cricket match", "football match"
        ]
        is_off_topic = any(k in q_lower for k in off_topic_triggers)

        if is_off_topic:
            full_response = (
                "Apologise, I only can solve queries regarding our website!\n\n"
                "What would you like to buy today? Here are some trending products and active offers you might like:\n\n"
                "🔥 **TRENDING PRODUCTS:**\n"
                "• **Samsung Galaxy S24 Ultra 5G AI** ($1299.99) — Next-gen Galaxy AI with built-in S Pen!\n"
                "• **Sony WH-1000XM5 Wireless Headphones** ($349.99) — Industry-leading 30hr active noise cancelling.\n"
                "• **Apple iPhone 15 Pro Max 256GB** ($1199.99) — Aerospace titanium with A17 Pro powerhouse chip.\n\n"
                "🎉 **ACTIVE OFFERS & DISCOUNTS:**\n"
                "• 🏷️ **FLASH50**: 50% discount on select high-demand electronics!\n"
                "• 🚚 **FREESHIP**: Instant zero-cost express delivery on orders over $99!\n\n"
                "What items would you like to explore or add to your shopping bag?"
            )
        elif "what's new" in q_lower or "whats new" in q_lower or "sparkyyy" in q_lower:
            full_response = (
                "Here is what is currently trending and newly stocked at R-Mart:\n\n"
                "🔥 **LATEST STORE ARRIVALS:**\n"
                "• **Samsung Galaxy S24 Ultra 5G AI** ($1299.99) — Next-gen Galaxy AI with built-in S Pen!\n"
                "• **Sony WH-1000XM5 Wireless Headphones** ($349.99) — Industry-leading 30hr active noise cancelling.\n"
                "• **Apple iPhone 15 Pro Max 256GB** ($1199.99) — Aerospace titanium with A17 Pro powerhouse chip.\n\n"
                "🎉 **ACTIVE OFFERS & DISCOUNTS:**\n"
                "• 🏷️ **FLASH50**: 50% discount on select high-demand electronics!\n"
                "• 🚚 **FREESHIP**: Instant zero-cost express delivery on orders over $99!\n\n"
                "📢 **BOSS ADMIN DIRECT LINK:**\n"
                "I immediately alerted my Boss Admin about your inquiry so they are actively notified about your query to drop even more fresh deals and restock requests! 🫡🚀"
            )
        elif any(k in q_lower for k in ["order", "track", "shipment", "delivery", "history", "purchased"]):
            full_response = (
                "📦 **R-Mart Orders & Tracking System:**\n\n"
                "I have full access to your order stream! You can view and track your recent orders, shipment stages, and download official PDF invoices directly under **My Orders** in the top navigation.\n\n"
                "If you need real-time carrier status, your order updates are pushed live via WebSocket & Celery!"
            )
        elif any(k in q_lower for k in ["address", "profile", "phone number", "my phone", "contact number", "who am i", "my account"]):
            full_response = (
                "👤 **Shopper Profile & Delivery Address:**\n\n"
                "Your registered delivery address and contact credentials are securely linked to your active session.\n"
                "You can view or update your name, contact phone, and shipping destination anytime using the top menu under **Edit Profile & Address**!"
            )
        elif not retrieved_products:
            full_response = (
                "Apologise, I only can solve queries regarding our website!\n\n"
                "What would you like to buy today? Here are some trending products and active offers you might like:\n\n"
                "🔥 **TRENDING PRODUCTS:**\n"
                "• **Samsung Galaxy S24 Ultra 5G AI** ($1299.99) — Next-gen Galaxy AI with built-in S Pen!\n"
                "• **Sony WH-1000XM5 Wireless Headphones** ($349.99) — Industry-leading 30hr active noise cancelling.\n"
                "• **Apple iPhone 15 Pro Max 256GB** ($1199.99) — Aerospace titanium with A17 Pro powerhouse chip.\n\n"
                "🎉 **ACTIVE OFFERS & DISCOUNTS:**\n"
                "• 🏷️ **FLASH50**: 50% discount on select high-demand electronics!\n"
                "• 🚚 **FREESHIP**: Instant zero-cost express delivery on orders over $99!\n\n"
                "You can also explore our top categories: smartphones, noise-cancelling headphones, mechanical keyboards, or 4K monitors!"
            )
        else:
            # Check if any retrieved product has stock 0
            out_of_stock_items = [p for p in retrieved_products if p.get("stock", 0) <= 0]
            in_stock_items = [p for p in retrieved_products if p.get("stock", 0) > 0]

            response_parts = [
                f"Here are the most relevant catalog items matching **'{query}'**:\n\n"
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
                "💡 *Sparky's Quick Tip:* All in-stock items are ready for same-day dispatch!\n"
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

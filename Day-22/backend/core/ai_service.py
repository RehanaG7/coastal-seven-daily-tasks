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
from core.ai_governance import cost_governance


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
            "You are Sparky, the brilliant, articulate, and highly helpful AI Shopping & Support Concierge for R-Mart! ⚡\n\n"
            "CORE OPERATIONAL GUIDELINES:\n"
            "1. CONCISE & CLEAR MESSAGES (NO BIG PARAGRAPHS): Never output massive paragraphs or overwhelming walls of text. Reply simply, cleanly, and directly addressing the user's inquiry.\n"
            "2. UNDERSTAND THE SPECIFIC QUESTION FIRST:\n"
            "   - PRODUCT INQUIRY: If asked about a specific product, tell specifically about that product (its features, price, and stock status). Do not dump long unrelated lists.\n"
            "   - GENERIC COMPLAINT: If the customer shares a complaint, issue, or bad experience (without specific return, damage, or delivery details), empathetically say:\n"
            "     'We are sorry for the inconvenience! Could you please share more details about the issue so we can help you right away?'\n"
            "   - RETURN INQUIRY & REGISTRATION: If the customer asks to return an item:\n"
            "     a) If no reason is given yet, ask: 'We are sorry for the inconvenience! Could you please tell us the reason for returning the item?'\n"
            "     b) Once the return reason is provided, confirm registration: 'We have registered your return complaint and are reviewing this. We will assign a delivery partner to receive it. Kindly pack it safely with your invoice, and our delivery partner will check and receive it. Would you like to place the same order again?'\n"
            "   - NOT RECEIVED ORDER: If the customer reports they haven't received their order or it's missing, say:\n"
            "     'We are truly sorry for the delay! We will talk to our admin boss about this right away to investigate your shipment immediately.'\n"
            "   - DAMAGED PRODUCT COMPLAINT: If the customer reports a damaged, broken, or defective product:\n"
            "     a) First ask: 'We are so sorry for the inconvenience! Please upload or share images/photos of the damaged product so we can verify the issue.'\n"
            "     b) Once images/photos or proof are confirmed, confirm: 'We have reviewed the details and verified your claim as valid! Your 100% full refund will be processed promptly to your original payment method.'\n"
            "3. STRICT STORE GROUNDING: Ground your knowledge strictly in the RETRIEVED PRODUCT CATALOG below. Do not hallucinate fictitious items or inaccurate prices.\n"
            "4. OUT-OF-STOCK DIRECTIVE: If an item discussed or requested has 0 stock (stock == 0), you must reassuringly state: "
            "'I will say my boss (the admin) to add stock as soon as possible and make it available!'\n"
            "5. SOURCE CITATIONS: When mentioning or recommending a catalog product, always cite it cleanly as: "
            "[Source: Product Title (ID: #id, $price)].\n"
            "6. WHAT'S NEW & DEALS: When asked 'What's new in R-Mart Sparkyyy?' or about promotions, present fresh store arrivals and discount codes FLASH50 and FREESHIP in short bullet points.\n"
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

        # Determine intent: Customer Support/Exception vs Specific Product Shopping Inquiry
        q_lower = query.lower().strip()

        is_damaged_query = any(k in q_lower for k in [
            "damage", "damaged", "broken", "cracked", "defect", "defective",
            "scratched", "faulty item", "faulty", "ruined", "torn"
        ])
        is_not_received_query = any(k in q_lower for k in [
            "not received", "didn't receive", "did not receive", "haven't received",
            "have not received", "never received", "order missing", "package missing",
            "where is my order", "order not delivered", "not arrived", "haven't got my"
        ])
        is_return_query = any(k in q_lower for k in [
            "return", "want to return", "returning", "exchange item", "send back"
        ])
        is_complaint_query = any(k in q_lower for k in [
            "complaint", "unhappy", "not satisfied", "bad service", "poor service",
            "problem with order", "issue with order", "file a complaint", "terrible service",
            "disappointed", "worst experience", "bad experience"
        ])
        is_admin_handover = any(k in q_lower for k in [
            "talk to admin", "speak to admin", "talk to human", "speak to human",
            "human agent", "live support", "connect to admin", "problem not resolved",
            "not resolved"
        ])
        is_greeting = q_lower in [
            "hi", "hello", "hey", "hola", "good morning", "good afternoon",
            "good evening", "howdy", "sup", "yo"
        ] or q_lower.startswith(("hi ", "hello ", "hey "))
        is_off_topic = any(k in q_lower for k in [
            "joke", "funny", "laugh", "humor", "riddle", "comedy",
            "who is ", "who was ", "what is the capital", "how do airplanes",
            "solve ", "write python", "write code", "write an essay", "write a poem",
            "weather", "sing a song", "tell a story", "what is photosynthesis",
            "quantum", "president of", "cricket match", "football match"
        ])
        is_general_support = (
            any(k in q_lower for k in ["refund", "cancel order", "cancellation", "order status", "invoice"])
            and not any(k in q_lower for k in ["buy", "recommend", "suggest", "search", "looking for", "item", "product"])
        )

        is_support_or_non_product = (
            is_damaged_query or is_not_received_query or is_return_query or
            is_complaint_query or is_admin_handover or is_greeting or is_off_topic or is_general_support
        )

        retrieved_products = []
        if not is_support_or_non_product:
            # 1. Retrieve Candidate products via ChromaDB vector store
            raw_candidates = vector_store.search_similar_products(query=query, top_k=4, db=db)
            filtered_candidates = [
                p for p in raw_candidates
                if not any(k in (p.get("title") or "").lower() for k in ["n+1", "invoice test", "test"]) or "test" in query.lower()
            ]

            # Check if query specifically targets a particular product
            exact_title_matches = [
                p for p in filtered_candidates
                if any(word in q_lower for word in (p.get("title") or "").lower().split() if len(word) > 3)
            ]

            if exact_title_matches:
                retrieved_products = exact_title_matches[:1]
            else:
                # General shopping intent - only include high-relevance items (up to top 2)
                retrieved_products = [
                    p for p in filtered_candidates
                    if p.get("relevance_score", 1.0) >= 0.55
                ][:2]
                if not retrieved_products and filtered_candidates:
                    retrieved_products = filtered_candidates[:1]

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

        # Record in Responsible AI & Cost Governance
        cost_governance.record_transaction(
            endpoint="/api/v1/ai/chat/stream",
            provider="R-Mart RAG Stream (Groq/Gemini/Local)",
            prompt_tokens=len(system_prompt.split()) + len(query.split()),
            completion_tokens=220,
            was_cached=False,
            latency_ms=250.0,
            user_identity="shopper"
        )

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

        is_greeting = q_lower in [
            "hi", "hello", "hey", "hola", "good morning", "good afternoon",
            "good evening", "howdy", "sup", "yo"
        ] or q_lower.startswith(("hi ", "hello ", "hey "))

        is_admin_handover = any(k in q_lower for k in [
            "talk to admin", "speak to admin", "talk to human", "speak to human",
            "human agent", "live support", "connect to admin", "problem not resolved",
            "not resolved"
        ])

        is_damaged_query = any(k in q_lower for k in ["damage", "damaged", "broken", "cracked", "defect", "defective", "scratched", "faulty item"])
        has_photo_uploaded = any(k in q_lower for k in ["photo", "image", "upload", "pic", "attached", "proof", "picture"])

        is_not_received_query = any(k in q_lower for k in ["not received", "didn't receive", "did not receive", "haven't received", "have not received", "never received", "order missing", "package missing", "where is my order", "order not delivered", "not arrived", "haven't got my"])

        is_return_query = any(k in q_lower for k in ["return", "want to return", "returning", "exchange item"])
        has_return_reason = any(k in q_lower for k in ["because", "reason", "size", "not working", "don't like", "quality", "wrong item", "damaged", "broken", "defective", "mind", "changed"])

        is_complaint_query = any(k in q_lower for k in ["complaint", "unhappy", "not satisfied", "bad service", "poor service", "problem with order", "issue with order", "file a complaint", "terrible service"])

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
        elif is_greeting:
            full_response = (
                "Hello! I am Sparky, your R-Mart assistant. ⚡\n\n"
                "How can I help you today? You can ask me about our products, check order status, or get support with returns and refunds."
            )
        elif is_admin_handover:
            full_response = (
                "I understand and I'm connecting you directly to our Store Administrator right away! 🫡\n\n"
                "Please click the 'Talk to Admin' button or hold on while we initiate the Live Support session."
            )
        elif is_damaged_query:
            if has_photo_uploaded:
                full_response = (
                    "Thank you for sharing the photo! We have reviewed the details and verified your claim as valid. ✅\n\n"
                    "Your 100% full refund has been approved and will be credited to your original payment method promptly!"
                )
            else:
                full_response = (
                    "We are so sorry for the inconvenience! ⚠️\n\n"
                    "Please upload or share images/photos of the damaged product so we can verify the issue and approve your refund immediately."
                )
        elif is_not_received_query:
            full_response = (
                "We are truly sorry for the delay and inconvenience! 🚚\n\n"
                "We will talk to our admin boss about this right away to investigate your shipment immediately. 🚨\n\n"
                "Our store operations team has been notified to prioritize tracking your parcel."
            )
        elif is_return_query:
            if has_return_reason:
                full_response = (
                    "Your return complaint has been registered! 📦\n\n"
                    "We are reviewing this and will assign a delivery partner to receive it.\n\n"
                    "Kindly pack it with your invoice, and our delivery partner will check and receive it.\n\n"
                    "Would you like to place the same order again?"
                )
            else:
                full_response = (
                    "We are sorry for the inconvenience! 📦\n\n"
                    "Could you please tell us the reason for returning the item so we can register your return complaint?"
                )
        elif is_complaint_query:
            full_response = (
                "We are sorry for the inconvenience! 😔\n\n"
                "Could you please share more details about the issue so we can help you right away?"
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
                "You can view and track your recent orders, shipment stages, and download official PDF invoices directly under **My Orders** in the top navigation.\n\n"
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

            # If user asks specifically about a single product
            if in_stock_items and len(in_stock_items) == 1 and not out_of_stock_items:
                p = in_stock_items[0]
                full_response = (
                    f"Here are the details for **{p['title']}**:\n\n"
                    f"• 💰 **Price:** ${p['price']:.2f}\n"
                    f"• 📦 **Availability:** In Stock ({p['stock']} units available)\n"
                    f"• 📝 **Highlights:** {p.get('description', '')[:140]}\n"
                    f"• 🔗 [Source: {p['title']} (ID: #{p['id']}, ${p['price']:.2f})]\n\n"
                    f"Would you like to add this to your shopping bag?"
                )
            else:
                response_parts = [
                    f"Here are the catalog items matching **'{query}'**:\n\n"
                ]

                if in_stock_items:
                    for idx, p in enumerate(in_stock_items[:2], start=1):
                        response_parts.append(
                            f"**{idx}. {p['title']}**\n"
                            f"• 💰 Price: ${p['price']:.2f} | 📦 Stock: {p['stock']} units\n"
                            f"• 🔗 [Source: {p['title']} (ID: #{p['id']}, ${p['price']:.2f})]\n\n"
                        )

                if out_of_stock_items:
                    for oos in out_of_stock_items:
                        response_parts.append(
                            f"⚠️ **Note on {oos['title']}**: This item currently has **0 units** in stock.\n"
                            f"Don't worry though — **I will say my boss (the admin) to add stock as soon as possible and make it available!** 🚀\n\n"
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

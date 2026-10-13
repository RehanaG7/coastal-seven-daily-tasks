"""
Day 21 - AI Product Description Generator (Copywriter)
Generates engaging, context-aware, tone-adapted e-commerce copy
using multi-provider LLMs with offline rule-based copywriter fallback.
Integrated with Content Moderation and Redis AI Response Caching.
"""

import os
import json
import time
from typing import List, Dict, Any, Optional

from core.config import settings
from core.redis_ai_cache import ai_cache
from core.moderation_service import moderation_service


TONE_PROFILES = {
    "professional": {
        "style": "authoritative, precise, and sophisticated",
        "intro": "Engineered for excellence and peak performance.",
        "badge": "Enterprise & Premium Grade"
    },
    "persuasive": {
        "style": "compelling, benefit-driven, and high-converting",
        "intro": "Upgrade your daily lifestyle with unmatched quality and comfort.",
        "badge": "Customer Top Pick"
    },
    "minimalist": {
        "style": "concise, direct, and distraction-free",
        "intro": "Pure functionality meets timeless essential design.",
        "badge": "Modern Minimalist"
    },
    "enthusiastic": {
        "style": "energetic, thrilling, and vibrant",
        "intro": "Get ready for a whole new level of excitement and innovation!",
        "badge": "Trending Now 🚀"
    }
}


class AICopywriterService:
    """
    Automated copywriter service with tone adaptation, caching, and fallback.
    """

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", "")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", "")

    def _generate_local_copy(
        self,
        title: str,
        category: str,
        features: List[str],
        tone: str,
        target_audience: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        High-fidelity local deterministic generator when external LLM APIs
        are offline or credentials are not configured.
        """
        profile = TONE_PROFILES.get(tone.lower(), TONE_PROFILES["professional"])
        clean_features = [f.strip() for f in features if f.strip()]

        t_low = title.lower().strip()
        cat_low = (category or "").lower().strip()
        combined = f"{t_low} {cat_low}"

        if not clean_features:
            if any(k in combined for k in ["tv", "television", "oled", "qled", "screen", "display", "bravia", "smart tv"]):
                features_list = [
                    "Breathtaking 4K Ultra HD resolution with HDR10+ vibrant contrast",
                    "Seamless Smart TV streaming platform (Netflix, Prime Video, YouTube)",
                    "Immersive Dolby Audio surround sound with crystal-clear dialogue",
                    "Ultra-slim bezel-less design with multiple high-speed HDMI and USB ports",
                    "Energy Star certified eco-efficient display technology"
                ]
                narrative_default = (
                    f"Transform your home entertainment with the {title}. "
                    f"Engineered with stunning 4K HDR clarity, deep cinematic contrast, and dynamic surround sound, "
                    f"it brings movies, live sports, and next-gen gaming to life with breathtaking detail."
                )
            elif any(k in combined for k in ["headphone", "earphone", "audio", "airpod", "buds", "soundbar", "speaker", "anc"]):
                features_list = [
                    "Industry-leading Active Noise Cancellation (ANC) with Ambient Sound mode",
                    "Up to 30 hours of continuous battery life with fast USB-C quick charge",
                    "High-fidelity acoustic drivers delivering deep punchy bass and crystalline trebles",
                    "Ergonomic memory-foam ear cushions engineered for all-day comfort",
                    "Built-in multi-microphone array for studio-grade hands-free calls"
                ]
                narrative_default = (
                    f"Immerse yourself in rich, studio-grade sound with the {title}. "
                    f"Designed to isolate ambient distractions and elevate every beat, it pairs cutting-edge acoustic engineering "
                    f"with supreme wireless convenience for audiophiles on the move."
                )
            elif any(k in combined for k in ["phone", "iphone", "samsung", "galaxy", "smartphone", "mobile", "pixel", "5g"]):
                features_list = [
                    "Blazing-fast next-gen 5G processor with ultra-responsive multitasking",
                    "Pro-grade multi-lens camera system with AI night photography and 4K video",
                    "Vibrant 120Hz AMOLED display with true-to-life color reproduction",
                    "All-day intelligent battery life with rapid quick-charge technology",
                    "Aerospace-grade durable build with IP68 water and dust resistance"
                ]
                narrative_default = (
                    f"Experience the pinnacle of mobile innovation with the {title}. "
                    f"Whether capturing life's finest moments, streaming in ultra-high definition, or managing a busy workday, "
                    f"it delivers blistering speed, extraordinary battery endurance, and flawless reliability."
                )
            elif any(k in combined for k in ["laptop", "macbook", "computer", "notebook", "pc", "desktop"]):
                features_list = [
                    "High-performance multi-core processor for demanding workflows and gaming",
                    "Ultra-fast solid-state NVMe SSD storage and high-bandwidth RAM",
                    "Stunning anti-glare high-resolution display with ultra-wide viewing angles",
                    "All-day battery endurance in an ultra-slim, lightweight portable chassis",
                    "Comprehensive connectivity suite with Thunderbolt, USB-C, and Wi-Fi 6E"
                ]
                narrative_default = (
                    f"Power through your biggest projects and entertainment with the {title}. "
                    f"Built for modern creators, professionals, and students, it delivers blazing performance, "
                    f"whisper-quiet cooling, and exceptional battery life wherever inspiration strikes."
                )
            elif any(k in combined for k in ["shoe", "sneaker", "running", "boot", "footwear"]):
                features_list = [
                    "Breathable engineered mesh upper providing maximum ventilation",
                    "High-rebound shock-absorbing cushioned midsole for cloud-like comfort",
                    "Durable multi-surface traction rubber outsole for non-slip grip",
                    "Ergonomic arch support designed for fatigue-free all-day wear",
                    "Lightweight feather-flex construction ideal for training and lifestyle"
                ]
                narrative_default = (
                    f"Step up your daily comfort and performance with the {title}. "
                    f"Designed to combine responsive athletic cushioning with a stylish, modern silhouette, "
                    f"it keeps your feet energised from morning workouts to evening strolls."
                )
            elif any(k in combined for k in ["coffee", "espresso", "maker", "brewer", "blender", "kitchen"]):
                features_list = [
                    "Rapid precision thermoblock heating system ready in seconds",
                    "Intuitive one-touch brewing controls with customizable cup volumes",
                    "Easy-to-clean food-grade stainless steel parts and removable water reservoir",
                    "Compact modern countertop footprint with auto-shutoff safety"
                ]
                narrative_default = (
                    f"Brew cafe-quality perfection right from home with the {title}. "
                    f"Combining effortless one-touch simplicity with rapid heating and rich extraction, "
                    f"it turns your morning routine into a luxurious coffee ritual."
                )
            else:
                features_list = [
                    "Premium materials engineered for long-lasting durability and reliability",
                    "Refined ergonomic design crafted for everyday convenience",
                    "Backed by full manufacturer warranty, fast shipping, and 24/7 customer care"
                ]
                narrative_default = (
                    f"Discover the {title}, curated within our {category} selection. "
                    f"{profile['intro']} Crafted to deliver an exceptional user experience without compromise."
                )
        else:
            features_list = clean_features
            narrative_default = (
                f"Discover the {title}, curated within our {category} selection. "
                f"{profile['intro']} Crafted to deliver an exceptional user experience without compromise."
            )

        headline = f"{title} — {profile['badge']}"
        audience_text = f" Tailored specifically for {target_audience}." if target_audience else ""
        narrative = f"{narrative_default}{audience_text}"

        bullet_points = [f"• {feat}" for feat in features_list]
        bullet_str = "\n".join(bullet_points)

        full_text = f"{headline}\n\n{narrative}\n\nKey Highlights:\n{bullet_str}\n\nAuthentic quality guaranteed by R-Mart."

        return {
            "headline": headline,
            "narrative": narrative,
            "bullet_points": features_list,
            "full_text": full_text,
            "tone": tone,
            "provider": "Local Intelligent Copywriter",
            "model": "Deterministic Rule-Engine v1",
            "generated_at": time.time()
        }

    def generate_product_description(
        self,
        title: str,
        category: str = "General",
        features: Optional[List[str]] = None,
        tone: str = "professional",
        target_audience: Optional[str] = None,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Main copy generation pipeline:
        1. Guardrail: assert content safety
        2. Cache Check: retrieve from Redis if available
        3. LLM Generation with multi-provider fallback
        4. Cache Store: persist to Redis (TTL 3600s)
        """
        features = features or []
        combined_text = f"{title} {category} {' '.join(features)} {target_audience or ''}"

        # 1. Content Moderation
        moderation_service.assert_safe_content(combined_text)

        # 2. Redis Cache Lookup
        cache_payload = {
            "title": title.strip().lower(),
            "category": category.strip().lower(),
            "features": sorted([f.strip().lower() for f in features]),
            "tone": tone.lower(),
            "target_audience": (target_audience or "").strip().lower()
        }

        if not force_refresh:
            cached = ai_cache.get("product_description", cache_payload)
            if cached:
                cached["cached"] = True
                return cached

        # 3. Multi-Provider Generation
        groq_key = os.getenv("GROQ_API_KEY") or self.groq_api_key
        gemini_key = os.getenv("GEMINI_API_KEY") or self.gemini_api_key

        result = None

        # Attempt Groq LLM if configured
        if groq_key and groq_key != "your_groq_api_key_here":
            try:
                from groq import Groq
                client = Groq(api_key=groq_key)
                prompt = (
                    f"Write a compelling product description for '{title}' (Category: {category}).\n"
                    f"Tone: {tone} ({TONE_PROFILES.get(tone, {}).get('style', 'professional')}).\n"
                    f"Features: {', '.join(features)}.\n"
                    f"Target Audience: {target_audience or 'General shoppers'}.\n"
                    "Return a JSON object with keys: headline, narrative, bullet_points (array of strings), full_text."
                )
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are an expert e-commerce copywriter. Return ONLY valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    response_format={"type": "json_object"}
                )
                parsed = json.loads(response.choices[0].message.content)
                result = {
                    "headline": parsed.get("headline", f"{title} - Premium Edition"),
                    "narrative": parsed.get("narrative", ""),
                    "bullet_points": parsed.get("bullet_points", features),
                    "full_text": parsed.get("full_text", ""),
                    "tone": tone,
                    "provider": "Groq",
                    "model": "llama-3.3-70b-versatile",
                    "generated_at": time.time()
                }
            except Exception as e:
                print(f"[AICopywriter] Groq generation failed: {e}")

        # Attempt Gemini if Groq failed or not configured
        if not result and gemini_key and gemini_key != "your_gemini_api_key_here":
            try:
                from google import genai
                client = genai.Client(api_key=gemini_key)
                prompt = (
                    f"Write a {tone} e-commerce product description for '{title}' ({category}). "
                    f"Highlights: {', '.join(features)}. Target: {target_audience or 'General'}. "
                    "Output JSON with keys headline, narrative, bullet_points, full_text."
                )
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt
                )
                parsed_json = json.loads(response.text.strip().removeprefix("```json").removesuffix("```").strip())
                result = {
                    "headline": parsed_json.get("headline", title),
                    "narrative": parsed_json.get("narrative", ""),
                    "bullet_points": parsed_json.get("bullet_points", features),
                    "full_text": parsed_json.get("full_text", ""),
                    "tone": tone,
                    "provider": "Google Gemini",
                    "model": "gemini-2.0-flash",
                    "generated_at": time.time()
                }
            except Exception as e:
                print(f"[AICopywriter] Gemini generation failed: {e}")

        # Fallback to Local Copywriter Engine
        if not result:
            result = self._generate_local_copy(
                title=title,
                category=category,
                features=features,
                tone=tone,
                target_audience=target_audience
            )

        # 4. Save to Redis Cache (1 hour TTL)
        result["description"] = result.get("full_text") or result.get("narrative", "")
        result["cached"] = False
        ai_cache.set("product_description", cache_payload, result, ttl_seconds=3600)

        return result


ai_copywriter = AICopywriterService()

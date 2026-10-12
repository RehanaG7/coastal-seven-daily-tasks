import React, { useState } from "react";

export default function AiDescriptionGenerator({
  productTitle = "",
  productCategory = "General",
  onApplyDescription,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tone, setTone] = useState("professional");
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState(["Ultra-durable build", "Fast delivery guaranteed"]);
  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddFeature = (e) => {
    e.preventDefault();
    if (featureInput.trim() && !features.includes(featureInput.trim())) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (idx) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleGenerate = async () => {
    if (!productTitle || productTitle.trim().length < 2) {
      setErrorMessage("Please enter a valid product title first.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setGeneratedResult(null);

    try {
      const token = localStorage.getItem("rmart_token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/v1/ai/generate-description", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: productTitle,
          category: productCategory || "General",
          features: features,
          tone: tone,
          target_audience: "Online Shoppers",
        }),
      });

      if (res.status === 422) {
        const errJson = await res.json();
        setErrorMessage(
          errJson.detail?.message || "Content violates safety policy. Please adjust title or features."
        );
        return;
      }

      if (res.status === 429) {
        setErrorMessage("AI Rate limit reached. Please wait a moment before trying again.");
        return;
      }

      if (!res.ok) {
        throw new Error(`Generation failed (${res.status})`);
      }

      const data = await res.json();
      setGeneratedResult(data);
    } catch (err) {
      console.error("[AiDescriptionGenerator] Error:", err);
      setErrorMessage("Failed to generate AI description. Operating in fallback mode.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedResult?.data?.full_text && onApplyDescription) {
      onApplyDescription(generatedResult.data.full_text);
      setIsOpen(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-slate-950/60 p-3.5 my-3 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black">
            ✨
          </span>
          <div>
            <h4 className="text-xs font-bold text-white">AI Copywriter Generator</h4>
            <p className="text-[10px] text-slate-400">
              Redis cached & grounded product copy in 1 click
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-amber-500/50 hover:text-amber-400 transition-all"
        >
          {isOpen ? "Close AI Studio ▲" : "✨ Generate with AI ▼"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-3.5 animate-fadeIn">
          {/* Tone Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Copywriting Tone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: "professional", label: "Professional", icon: "👔" },
                { id: "persuasive", label: "Persuasive", icon: "🎯" },
                { id: "minimalist", label: "Minimalist", icon: "✨" },
                { id: "enthusiastic", label: "Enthusiastic", icon: "🚀" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold text-left transition-all ${
                    tone === t.id
                      ? "border-amber-500 bg-amber-500/20 text-amber-300"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="mr-1">{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Key Features Chips */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Highlights & Specifications
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {features.map((feat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-800/90 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200"
                >
                  {feat}
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-slate-400 hover:text-red-400 ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature(e);
                  }
                }}
                placeholder="Add bullet highlight (e.g. 30h battery life)..."
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                + Add
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-2.5 text-[11px] text-red-300 font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-black text-slate-950 hover:from-amber-400 hover:to-orange-400 transition-all shadow-md active:scale-98 disabled:opacity-50"
          >
            {loading ? "✨ Synthesizing Description with AI..." : "🚀 Generate Description Now"}
          </button>

          {/* Generated Result Preview & Apply */}
          {generatedResult && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                  ✅ Copy Generated
                </span>
                <div className="flex items-center gap-2">
                  {generatedResult.cached && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      ⚡ Redis Cache Hit
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {generatedResult.latency_ms ? `${generatedResult.latency_ms}ms` : ""}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800/80 text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                {generatedResult.data?.full_text}
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="w-full rounded-lg bg-emerald-500 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400 transition-all shadow-md active:scale-98"
              >
                📥 Apply Description to Form
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDropzone } from "react-dropzone";
import { useStore } from "../context/StoreContext";
import { Button } from "./ui/Button";
import AiDescriptionGenerator from "./AiDescriptionGenerator";
import AiErrorBoundary from "./AiErrorBoundary";

// Strict Zod Validation Schema
const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(60, "Title cannot exceed 60 characters"),
  price: z.coerce.number().min(0.01, "Price must be greater than $0.00"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  category: z.string().min(1, "Please select a category"),
  description: z.string().min(10, "Please provide at least 10 characters of detailed description"),
  imageUrl: z.string().min(1, "An image is required (upload via dropzone or enter URL)")
});

export default function ProductFormStudio() {
  const { addProduct, showPopup } = useStore();
  const [imagePreview, setImagePreview] = useState("");
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [magicPencilRateLimit, setMagicPencilRateLimit] = useState(false);
  const [magicPencilModeration, setMagicPencilModeration] = useState(false);
  const [aiDescStatus, setAiDescStatus] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      price: "",
      stock: 15,
      category: "Electronics",
      description: "",
      imageUrl: ""
    }
  });

  const formValues = watch();

  const handleMagicPencil = async () => {
    const currentTitle = formValues.title;
    const currentCategory = formValues.category;
    if (!currentTitle || currentTitle.trim().length < 2) {
      alert("Please enter a product title first so the Magic Pencil can craft a description!");
      return;
    }

    setIsGeneratingDesc(true);
    setMagicPencilRateLimit(false);
    setMagicPencilModeration(false);
    setAiDescStatus("⏳ Generating eye-catching description with AI...");

    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      let res;
      const payload = {
        title: currentTitle.trim(),
        category: currentCategory || "General",
        tone: "persuasive",
        features: ["Premium quality", "E-commerce bestseller", "Fast express delivery"],
        target_audience: "Online Shoppers",
      };

      try {
        res = await fetch("https://e-commerce-backend-texz.onrender.com/api/v1/ai/generate-description", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      } catch (err) {
        res = await fetch("/api/v1/ai/generate-description", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (res.status === 429) {
        setMagicPencilRateLimit(true);
        setAiDescStatus("🛑 Rate Limit Exceeded (HTTP 429)");
        return;
      }

      if (res.status === 422) {
        setMagicPencilModeration(true);
        setAiDescStatus("🛡️ Flagged by Safety Policy (HTTP 422)");
        return;
      }

      if (res.ok) {
        const json = await res.json();
        const fullText = json?.data?.full_text || json?.data?.description || "";
        if (fullText) {
          setValue("description", fullText, { shouldValidate: true, shouldDirty: true });
          setAiDescStatus(json.cached ? "⚡ AI Generated (Redis Cache <3ms)" : "✨ AI Generated & Applied");
          setTimeout(() => setAiDescStatus(""), 4000);
        }
      }
    } catch (e) {
      console.error("[Magic Pencil Error]", e);
      setAiDescStatus("⚠️ Generation error. Type manually.");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  // react-dropzone implementation
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setValue("imageUrl", reader.result, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    multiple: false
  });

  const onSubmit = async (data) => {
    const newProd = {
      id: `p-${Date.now()}`,
      title: data.title,
      price: data.price,
      stock: data.stock,
      category: data.category,
      description: data.description,
      image_url: data.imageUrl
    };

    await addProduct(newProd);
    showPopup("Catalog Created", `"${data.title}" validated & published!`, "📦");
    reset();
    setImagePreview("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Accessible React Hook Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl backdrop-blur-xl"
        aria-label="Add New Product Form"
      >
        <div className="border-b border-slate-800 pb-4">
          <span className="text-amber-500 font-extrabold text-[10px] tracking-widest uppercase">Zod Validated • Accessible</span>
          <h3 className="text-lg font-black text-white mt-1">Publish New Product Studio</h3>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="product-title" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Product Title <span className="text-amber-500">*</span>
          </label>
          <input
            id="product-title"
            {...register("title")}
            aria-invalid={errors.title ? "true" : "false"}
            aria-describedby={errors.title ? "title-error" : undefined}
            placeholder="e.g. Pro Mechanical Keyboard"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {errors.title && (
            <p id="title-error" className="mt-1 text-[11px] font-semibold text-red-400" role="alert">
              ⚠️ {errors.title.message}
            </p>
          )}
        </div>

        {/* Price & Stock Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="product-price" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Price ($) <span className="text-amber-500">*</span>
            </label>
            <input
              id="product-price"
              type="number"
              step="0.01"
              {...register("price")}
              aria-invalid={errors.price ? "true" : "false"}
              aria-describedby={errors.price ? "price-error" : undefined}
              placeholder="79.99"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {errors.price && (
              <p id="price-error" className="mt-1 text-[11px] font-semibold text-red-400" role="alert">
                ⚠️ {errors.price.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="product-stock" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Initial Stock <span className="text-amber-500">*</span>
            </label>
            <input
              id="product-stock"
              type="number"
              {...register("stock")}
              aria-invalid={errors.stock ? "true" : "false"}
              aria-describedby={errors.stock ? "stock-error" : undefined}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {errors.stock && (
              <p id="stock-error" className="mt-1 text-[11px] font-semibold text-red-400" role="alert">
                ⚠️ {errors.stock.message}
              </p>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="product-category" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Category
          </label>
          <select
            id="product-category"
            {...register("category")}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="Electronics">Electronics</option>
            <option value="Peripherals">Peripherals</option>
            <option value="Accessories">Accessories</option>
            <option value="General">General Essentials</option>
          </select>
        </div>

        {/* react-dropzone Image Upload */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Product Media <span className="text-amber-500">*</span>
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragActive ? "border-amber-500 bg-amber-500/10" : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
            }`}
            tabIndex={0}
            role="button"
            aria-label="Dropzone for product image upload"
          >
            <input {...getInputProps()} />
            <div className="text-3xl mb-1">📁</div>
            <p className="text-xs font-bold text-slate-300">
              {isDragActive ? "Drop image here..." : "Drag & drop image file here, or click to browse"}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Supports PNG, JPG, JPEG, WEBP up to 5MB</span>
          </div>

          <div className="mt-2 text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">OR VIA URL</div>
          <input
            {...register("imageUrl")}
            placeholder="Paste external image link URL..."
            className="w-full mt-2 rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
          />
          {errors.imageUrl && (
            <p className="mt-1 text-[11px] font-semibold text-red-400" role="alert">
              ⚠️ {errors.imageUrl.message}
            </p>
          )}
        </div>

        {/* Description & Magic Pencil */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="product-desc" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Description <span className="text-amber-500">*</span>
            </label>
            {aiDescStatus && (
              <span className={`text-[11px] font-bold ${aiDescStatus.includes("Error") || aiDescStatus.includes("429") ? "text-red-400" : "text-emerald-400"}`}>
                {aiDescStatus}
              </span>
            )}
          </div>

          <div className="relative">
            <textarea
              id="product-desc"
              rows="4"
              {...register("description")}
              aria-invalid={errors.description ? "true" : "false"}
              aria-describedby={errors.description ? "desc-error" : undefined}
              placeholder="Enter product description or click ✏️ Magic Pencil at bottom-right to auto-generate..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 pr-28 text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />

            {/* Magic Pencil Button at bottom-right */}
            <button
              type="button"
              data-testid="magic-pencil-btn"
              title="Auto-generate professional, eye-catching description with AI"
              onClick={handleMagicPencil}
              disabled={isGeneratingDesc}
              className="absolute right-2.5 bottom-3.5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-black text-white shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
              <span>{isGeneratingDesc ? "⏳" : "✏️✨"}</span>
              <span>{isGeneratingDesc ? "Writing..." : "Magic Pencil"}</span>
            </button>
          </div>

          {magicPencilRateLimit && (
            <div
              data-testid="magic-pencil-rate-limit-banner"
              className="mt-2 flex items-center justify-between rounded-lg border border-red-500 bg-red-500/10 p-2.5 text-xs font-bold text-red-400"
            >
              <span>🛑 Too Many Requests (HTTP 429): You have exceeded your AI request limit. Please wait a moment before trying again.</span>
              <button type="button" onClick={() => setMagicPencilRateLimit(false)} className="font-black">✕</button>
            </div>
          )}

          {magicPencilModeration && (
            <div className="mt-2 flex items-center justify-between rounded-lg border border-amber-500 bg-amber-500/10 p-2.5 text-xs font-bold text-amber-400">
              <span>🛡️ Content Moderation Guardrail: Product title or details violated safety policy.</span>
              <button type="button" onClick={() => setMagicPencilModeration(false)} className="font-black">✕</button>
            </div>
          )}

          {errors.description && (
            <p id="desc-error" className="mt-1 text-[11px] font-semibold text-red-400" role="alert">
              ⚠️ {errors.description.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full py-3.5">
          {isSubmitting ? "Validating & Publishing..." : "Publish Product with Zod Validation"}
        </Button>
      </form>

      {/* Live Preview Card */}
      <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl sticky top-24">
        <span className="text-slate-400 font-extrabold text-[10px] tracking-widest uppercase">Live Shopper Card Preview</span>
        <div className="h-48 rounded-xl bg-slate-950 border border-slate-800 my-4 flex items-center justify-center overflow-hidden">
          {imagePreview || formValues.imageUrl ? (
            <img src={imagePreview || formValues.imageUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-slate-600 text-xs font-bold">Image Preview Area</span>
          )}
        </div>
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-sm font-black text-white">{formValues.title || "Product Title"}</h4>
          <span className="text-amber-500 font-black text-sm">${formValues.price || "0.00"}</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
          {formValues.description || "Product specifications and features will render here for customers."}
        </p>
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px]">
          <span className="text-slate-500 font-bold uppercase">{formValues.category}</span>
          <span className={Number(formValues.stock) < 5 ? "text-red-500 font-extrabold" : "text-emerald-400 font-bold"}>
            {Number(formValues.stock) < 5 ? `🔴 Stockout (${formValues.stock})` : `In Stock (${formValues.stock})`}
          </span>
        </div>
      </div>
    </div>
  );
}

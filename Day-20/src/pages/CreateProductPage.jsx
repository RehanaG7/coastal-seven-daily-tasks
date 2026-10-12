import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, ChevronLeft, ArrowRight, Package, DollarSign, Image as ImageIcon, FileCheck2 } from "lucide-react";
import { productSchema } from "../schemas/productSchema";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { FileUploadDropzone } from "../components/forms/FileUploadDropzone";
import { DynamicSpecFields } from "../components/forms/DynamicSpecFields";
import { createProduct } from "../api/productService";

const STEPS = [
  { id: 1, name: "General Info", icon: Package, fields: ["title", "category", "description"] },
  { id: 2, name: "Pricing & Specs", icon: DollarSign, fields: ["price", "stock", "specifications"] },
  { id: 3, name: "Media Upload", icon: ImageIcon, fields: ["image"] },
  { id: 4, name: "Review", icon: FileCheck2, fields: [] },
];

export default function CreateProductPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      category: "",
      description: "",
      price: "",
      stock: 10,
      specifications: [],
      image: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "specifications",
  });

  const formValues = watch();

  const handleNext = async () => {
    const fieldsToValidate = STEPS[currentStep - 1].fields;
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError("");

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("price", data.price.toString());
      formData.append("category", data.category);
      formData.append("stock", data.stock.toString());

      if (data.image instanceof File) {
        formData.append("image", data.image);
      }

      await createProduct(formData);
      navigate("/products");
    } catch (err) {
      setServerError(
        err.response?.data?.detail || "Failed to create product. Check backend status."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create New Product</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete the four structured steps below to publish a product to the catalog.
        </p>
      </div>

      {/* Step Tracker Indicator */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center justify-between border border-gray-200 bg-white rounded-xl p-4 shadow-sm">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <li key={step.id} className="flex-1 flex items-center">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border font-semibold text-xs transition-colors ${
                      isCompleted
                        ? "border-blue-600 bg-blue-600 text-white"
                        : isCurrent
                        ? "border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-500/20"
                        : "border-gray-200 bg-gray-50 text-gray-400"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-semibold ${isCurrent ? "text-blue-600" : "text-gray-600"}`}>
                      {step.name}
                    </p>
                    <p className="text-[10px] text-gray-400">Step {step.id} of 4</p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 mx-3 h-0.5 bg-gray-200 hidden sm:block" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Form Content Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
        {serverError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* STEP 1: General Info */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="title">
                  Product Title *
                </label>
                <Input
                  id="title"
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  {...register("title")}
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="category">
                  Category *
                </label>
                <select
                  id="category"
                  {...register("category")}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Audio">Audio</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Home & Living">Home & Living</option>
                </select>
                {errors.category && (
                  <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="description">
                  Product Description *
                </label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Detailed description of features, materials, and warranty..."
                  {...register("description")}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Pricing & Specs */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="price">
                    Price (USD) *
                  </label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="49.99"
                    {...register("price")}
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && (
                    <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="stock">
                    Available Inventory *
                  </label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="25"
                    {...register("stock")}
                    className={errors.stock ? "border-red-500" : ""}
                  />
                  {errors.stock && (
                    <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <DynamicSpecFields
                  fields={fields}
                  append={append}
                  remove={remove}
                  register={register}
                  errors={errors}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Media Upload */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Upload Product Image</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Drag and drop a primary image. FastAPI and Pillow will generate thumbnails automatically.
                </p>
                <Controller
                  control={control}
                  name="image"
                  render={({ field: { value, onChange } }) => (
                    <FileUploadDropzone
                      value={value}
                      onChange={onChange}
                      error={errors.image}
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Review Step */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border border-gray-100 bg-gray-50/70 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{formValues.title}</h3>
                    <Badge variant="default" className="mt-1">{formValues.category}</Badge>
                  </div>
                  <p className="text-2xl font-black text-gray-900">${Number(formValues.price).toFixed(2)}</p>
                </div>

                <p className="text-sm text-gray-600">{formValues.description}</p>

                <div className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">Stock Count: </span>
                  {formValues.stock} units
                </div>

                {formValues.specifications?.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Specifications:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {formValues.specifications.map((spec, i) => (
                        <div key={i} className="bg-white p-2 rounded border border-gray-200">
                          <span className="font-semibold text-gray-600">{spec.key}: </span>
                          <span className="text-gray-900">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formValues.image && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Attached Image File:</p>
                    <p className="text-xs text-blue-600 font-medium">
                      {formValues.image.name} ({(formValues.image.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-100">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Creating Product..." : "Confirm & Publish Product"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Image as ImageIcon, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";

export function FileUploadDropzone({ value, onChange, error }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    if (typeof value === "string") {
      setPreview(value);
      return;
    }
    // Create object URL for File instance
    const objectUrl = URL.createObjectURL(value);
    setPreview(objectUrl);

    // Free memory when component unmounts or file changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [value]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles?.length > 0) {
        onChange(acceptedFiles[0]);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const removeImage = (e) => {
    e.stopPropagation();
    onChange(null);
    setPreview(null);
  };

  return (
    <div className="w-full space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
          isDragActive ? "border-blue-500 bg-blue-50/50" : "border-gray-300 hover:border-gray-400 bg-gray-50/40",
          isDragReject ? "border-red-500 bg-red-50" : "",
          error ? "border-red-500" : ""
        )}
      >
        <input {...getInputProps()} aria-label="Drop product image here" />

        {preview ? (
          <div className="relative group w-full flex flex-col items-center">
            <img
              src={preview}
              alt="Uploaded Preview"
              className="h-48 w-full max-w-xs object-cover rounded-lg shadow-sm border border-gray-200"
            />
            <button
              type="button"
              onClick={removeImage}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Remove image
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 mb-3">
              <UploadCloud className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              {isDragActive ? "Drop the file right here..." : "Drag & drop your product image here, or click to browse"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports PNG, JPG, or WEBP up to 5MB
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-500">{error.message}</p>}
    </div>
  );
}
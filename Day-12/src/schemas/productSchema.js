import { z } from "zod";

// Accepted image configurations
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const productSchema = z.object({
  // Step 1: General Information
  title: z
    .string()
    .min(3, { message: "Product title must be at least 3 characters" })
    .max(100, { message: "Product title cannot exceed 100 characters" }),
  category: z
    .string()
    .min(1, { message: "Please select a category" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .max(500, { message: "Description cannot exceed 500 characters" }),

  // Step 2: Pricing, Stock & Dynamic Specifications
  price: z
    .coerce
    .number({ invalid_type_error: "Price must be a valid number" })
    .positive({ message: "Price must be greater than 0" }),
  stock: z
    .coerce
    .number({ invalid_type_error: "Stock must be a whole number" })
    .int({ message: "Stock must be an integer" })
    .nonnegative({ message: "Stock cannot be negative" }),
  specifications: z
    .array(
      z.object({
        key: z.string().min(1, { message: "Key required (e.g. Color)" }),
        value: z.string().min(1, { message: "Value required (e.g. Matte Black)" }),
      })
    )
    .optional(),

  // Step 3: Media Upload
  image: z
    .any()
    .refine((file) => file !== null && file !== undefined, "Product image is required")
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      "Max file size is 5MB"
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported"
    ),
});
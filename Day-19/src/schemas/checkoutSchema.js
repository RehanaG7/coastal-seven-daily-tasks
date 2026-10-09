import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Delivery address is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().regex(/^[0-9]{5,6}$/, "Postal code must be 5-6 digits"),
  paymentMethod: z.enum(["card", "cod", "upi"], {
    errorMap: () => ({ message: "Select a valid payment method" }),
  }),
});

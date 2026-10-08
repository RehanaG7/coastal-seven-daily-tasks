import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  role: z.enum(["user", "admin"]).optional(),
  adminPasscode: z.string().optional(),
}).refine(
  (data) => {
    if (data.role === "admin") {
      return (data.adminPasscode || "").trim() === "ADMIN-2026";
    }
    return true;
  },
  {
    message: "Invalid Admin Passcode! Passcode must be 'ADMIN-2026' to access the Admin portal.",
    path: ["adminPasscode"],
  }
);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "admin"]).default("user"),
  adminPasscode: z.string().optional(),
}).refine(
  (data) => {
    if (data.role === "admin") {
      return (data.adminPasscode || "").trim() === "ADMIN-2026";
    }
    return true;
  },
  {
    message: "Invalid Admin Passcode! Passcode must be 'ADMIN-2026' to register as Admin.",
    path: ["adminPasscode"],
  }
);

import { describe, it, expect } from "vitest";
import { checkoutSchema } from "../schemas/checkoutSchema";

describe("Day 16: Checkout Zod Schema Validation Suite", () => {
  const validData = {
    fullName: "Shaik Rehana",
    email: "rehana@example.com",
    address: "Plot 42 Hi-Tech City",
    city: "Hyderabad",
    postalCode: "500081",
    paymentMethod: "card",
  };

  it("7. successfully parses valid checkout payload", () => {
    const result = checkoutSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("8. rejects full name shorter than 3 characters", () => {
    const invalid = { ...validData, fullName: "Al" };
    const result = checkoutSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain("at least 3 characters");
  });

  it("9. rejects invalid email formats", () => {
    const invalid = { ...validData, email: "rehana-at-example" };
    const result = checkoutSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain("Invalid email");
  });

  it("10. rejects postal codes with invalid digit count", () => {
    const invalid = { ...validData, postalCode: "123" };
    const result = checkoutSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain("5-6 digits");
  });

  it("11. rejects unsupported payment methods", () => {
    const invalid = { ...validData, paymentMethod: "bitcoin" };
    const result = checkoutSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

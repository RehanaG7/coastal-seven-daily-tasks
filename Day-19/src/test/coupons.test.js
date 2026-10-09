import { describe, it, expect } from "vitest";
import { AVAILABLE_COUPONS } from "../pages/CheckoutPage";
import { checkoutSchema } from "../schemas/checkoutSchema";

describe("Coupons and Payment Offers Suite", () => {
  it("contains all specified promotional coupons", () => {
    const codes = AVAILABLE_COUPONS.map((c) => c.code);
    expect(codes).toContain("CARD10");
    expect(codes).toContain("CASHBACK15");
    expect(codes).toContain("UPI5");
    expect(codes).toContain("RMART2026");
    expect(codes).toContain("WELCOME10");
  });

  it("calculates 10% CARD10 discount and targets card payment", () => {
    const cardCoupon = AVAILABLE_COUPONS.find((c) => c.code === "CARD10");
    expect(cardCoupon).toBeDefined();
    expect(cardCoupon.targetPayment).toBe("card");
    expect(cardCoupon.calculate(100)).toBe(10);
    expect(cardCoupon.calculate(250)).toBe(25);
    // capped at 50
    expect(cardCoupon.calculate(800)).toBe(50);
  });

  it("calculates 15% CASHBACK15 discount and has no payment restriction", () => {
    const cbCoupon = AVAILABLE_COUPONS.find((c) => c.code === "CASHBACK15");
    expect(cbCoupon).toBeDefined();
    expect(cbCoupon.targetPayment).toBeNull();
    expect(cbCoupon.calculate(100)).toBe(15);
    expect(cbCoupon.calculate(200)).toBe(30);
  });

  it("calculates flat $5 UPI5 discount on qualifying subtotals", () => {
    const upiCoupon = AVAILABLE_COUPONS.find((c) => c.code === "UPI5");
    expect(upiCoupon).toBeDefined();
    expect(upiCoupon.targetPayment).toBe("upi");
    expect(upiCoupon.calculate(50)).toBe(5.0);
    expect(upiCoupon.calculate(5)).toBe(0);
  });

  it("calculates RMART2026 mega discount on orders >= 80", () => {
    const rmartCoupon = AVAILABLE_COUPONS.find((c) => c.code === "RMART2026");
    expect(rmartCoupon).toBeDefined();
    expect(rmartCoupon.calculate(120)).toBe(20.0);
    expect(rmartCoupon.calculate(50)).toBe(5.0);
  });

  it("validates checkout payload containing coupon metadata", () => {
    const payload = {
      fullName: "Shaik Rehana",
      email: "rehana@example.com",
      address: "Plot 42 Hi-Tech City",
      city: "Hyderabad",
      postalCode: "500081",
      paymentMethod: "card",
    };
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

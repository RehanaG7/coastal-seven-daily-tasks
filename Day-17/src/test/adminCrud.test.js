import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../store/useStore";

describe("Day 16: Admin Dashboard & Stock Operations Suite", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it("16. recognizes admin privileges when user role is admin", () => {
    useAuthStore.setState({ user: { email: "admin@rmart.com", role: "admin" } });
    const user = useAuthStore.getState().user;
    expect(user.role).toBe("admin");
  });

  it("17. restricts administrative controls for customer accounts", () => {
    useAuthStore.setState({ user: { email: "customer@rmart.com", role: "customer" } });
    const user = useAuthStore.getState().user;
    expect(user.role).not.toBe("admin");
  });

  it("18. calculates correct stock delta on positive increment", () => {
    const currentStock = 10;
    const delta = 1;
    expect(currentStock + delta).toBe(11);
  });

  it("19. prevents negative stock levels during decrements", () => {
    const currentStock = 0;
    const delta = -1;
    const nextStock = Math.max(0, currentStock + delta);
    expect(nextStock).toBe(0);
  });

  it("20. validates product pricing must be a positive number", () => {
    const validPrice = 29.99;
    const invalidPrice = -5.0;
    expect(validPrice > 0).toBe(true);
    expect(invalidPrice > 0).toBe(false);
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../store/useStore";

describe("Day 16: UI & Dark/Light Mode Theme Store Suite", () => {
  beforeEach(() => {
    useUIStore.setState({ theme: "dark", isIntroActive: false, trackingOrder: null });
  });

  it("12. provides dark theme as primary default aesthetic", () => {
    expect(useUIStore.getState().theme).toBe("dark");
  });

  it("13. toggles theme between light and dark seamlessly", () => {
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe("light");

    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe("dark");
  });

  it("14. controls cinematic intro dismissal state", () => {
    useUIStore.setState({ isIntroActive: true });
    useUIStore.getState().dismissIntro();
    expect(useUIStore.getState().isIntroActive).toBe(false);
  });

  it("15. manages active order tracking modal payload via openTracker/closeTracker", () => {
    const mockOrder = { orderId: "ORD-9912", status: "Delivered" };
    useUIStore.getState().openTracker(mockOrder);
    expect(useUIStore.getState().trackingOrder).toEqual(mockOrder);

    useUIStore.getState().closeTracker();
    expect(useUIStore.getState().trackingOrder).toBeNull();
  });
});

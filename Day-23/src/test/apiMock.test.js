import { describe, it, expect } from "vitest";

describe("MSW API Mocking Layer", () => {
  it("intercepts product fetch requests and returns mocked payloads", async () => {
    const res = await fetch("https://e-commerce-backend-texz.onrender.com/api/v1/products");
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].name).toBe("MSW Mocked Mechanical Keyboard");
    expect(data.items[0].stock).toBe(4);
  });
});

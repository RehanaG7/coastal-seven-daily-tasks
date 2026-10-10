import "@testing-library/jest-dom";
import { server } from "../mocks/server";

class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window !== "undefined") {
  window.IntersectionObserver = MockIntersectionObserver;
}
if (typeof globalThis !== "undefined") {
  globalThis.IntersectionObserver = MockIntersectionObserver;
}

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("http://127.0.0.1:8000/api/v1/products", () => {
    return HttpResponse.json({
      items: [
        {
          id: 101,
          name: "MSW Mocked Mechanical Keyboard",
          price: 99.99,
          stock: 4,
          category: "Hardware",
          image: "https://example.com/msw-keyboard.jpg",
          description: "Isolated API mock response via MSW."
        }
      ],
      total: 1,
      page: 0,
      limit: 10,
      hasMore: false
    });
  }),

  http.get("http://127.0.0.1:8000/products", () => {
    return HttpResponse.json({
      items: [
        {
          id: 102,
          name: "MSW Mocked Fallback Item",
          price: 49.99,
          stock: 10,
          category: "Electronics",
          image: "https://example.com/fallback.jpg",
          description: "MSW secondary route mock."
        }
      ],
      total: 1,
      page: 0,
      limit: 10,
      hasMore: false
    });
  })
];

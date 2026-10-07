import React from "react";
import { Product } from "../types";

export interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isOutOfStock = product.stock <= 0;

  return (
    <div data-testid={`product-card-${product.id}`} className="border rounded-xl p-4 shadow-sm bg-white flex flex-col justify-between">
      <img src={product.image} alt={product.name} className="h-44 w-full object-cover rounded-lg mb-3" />
      <div>
        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-600">{product.category}</span>
        <h3 className="font-bold text-lg mt-2 text-slate-800">{product.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mt-1">{product.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xl font-black text-indigo-600">${product.price.toFixed(2)}</span>
        <button
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          aria-label={`Add ${product.name} to cart`}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            isOutOfStock ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
          }`}
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

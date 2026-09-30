import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import MultiStepCheckoutModal from "./MultiStepCheckoutModal";
import { Button } from "./ui/Button";

export default function CartDrawer({ onOpenOrders }) {
  const { cart, updateQuantity, cartTotal, isCartOpen, setIsCartOpen, lastPlacedOrder, setLastPlacedOrder } = useStore();
  const [showMultiStep, setShowMultiStep] = useState(false);

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md h-full bg-slate-950 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <h3 className="font-black text-white text-base">Your Shopping Cart</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white font-bold p-1">✕</button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-xs">Your cart is currently empty.</div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{item.title || item.name}</h4>
                      <span className="text-amber-500 font-black text-xs">${Number(item.price).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="h-6 w-6 rounded bg-slate-800 text-white font-bold">-</button>
                      <span className="font-black text-xs text-white min-w-[16px] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="h-6 w-6 rounded bg-slate-800 text-white font-bold">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Multi-Step Trigger */}
            {cart.length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm font-black text-white">
                  <span>Subtotal:</span>
                  <span className="text-amber-500 text-base">${cartTotal.toFixed(2)}</span>
                </div>
                <Button
                  onClick={() => setShowMultiStep(true)}
                  className="w-full py-3"
                >
                  Proceed to Multi-Step Checkout (Zod) →
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Multi-Step Checkout Modal */}
      <MultiStepCheckoutModal
        isOpen={showMultiStep}
        onClose={() => {
          setShowMultiStep(false);
          setIsCartOpen(false);
        }}
      />
    </>
  );
}

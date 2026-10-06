import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { checkoutSchema } from "../schemas/checkoutSchema";
import { useCartStore, useUIStore } from "../store/useStore";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCartStore((s) => s.cart || []);
  const clearCart = useCartStore((s) => s.clearCart || (() => {}));
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";

  const totalAmount = cart.reduce(
    (sum, item) => sum + (item.product?.price || 0) * (item.quantity || 1),
    0
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
      paymentMethod: "card",
    },
  });

  const onSubmit = async (data) => {
    const orderPayload = {
      ...data,
      items: cart,
      totalAmount,
      orderDate: new Date().toISOString(),
      orderId: "ORD-" + Math.floor(100000 + Math.random() * 900000),
      status: "Confirmed",
    };

    const existingOrders = JSON.parse(localStorage.getItem("rmart_orders") || "[]");
    localStorage.setItem("rmart_orders", JSON.stringify([orderPayload, ...existingOrders]));

    if (typeof clearCart === "function") clearCart();
    navigate("/orders");
  };

  return (
    <div className={`min-h-screen py-10 px-4 ${isDark ? "bg-[#0B0F19] text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-3xl mx-auto border rounded-2xl p-8 shadow-xl bg-opacity-50">
        <h1 className="text-2xl font-black mb-4">Complete Your Checkout</h1>
        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">Your cart is currently empty.</p>
            <button
              onClick={() => navigate("/catalog")}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Full Name</label>
              <input
                {...register("fullName")}
                placeholder="John Doe"
                className="w-full p-3 rounded-lg border bg-transparent"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Email Address</label>
              <input
                {...register("email")}
                placeholder="john@example.com"
                className="w-full p-3 rounded-lg border bg-transparent"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Street Address</label>
              <input
                {...register("address")}
                placeholder="123 Coastal Way"
                className="w-full p-3 rounded-lg border bg-transparent"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">City</label>
                <input
                  {...register("city")}
                  placeholder="Hyderabad"
                  className="w-full p-3 rounded-lg border bg-transparent"
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Postal Code</label>
                <input
                  {...register("postalCode")}
                  placeholder="500081"
                  className="w-full p-3 rounded-lg border bg-transparent"
                />
                {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Payment Method</label>
              <select {...register("paymentMethod")} className="w-full p-3 rounded-lg border bg-transparent">
                <option value="card" className="text-black">Credit / Debit Card</option>
                <option value="upi" className="text-black">UPI / Instant Transfer</option>
                <option value="cod" className="text-black">Cash On Delivery (COD)</option>
              </select>
              {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>}
            </div>

            <div className="pt-4 border-t flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Total Due:</span>
                <span className="text-2xl font-black text-emerald-500">${totalAmount.toFixed(2)}</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm tracking-wide transition shadow-lg"
              >
                {isSubmitting ? "Processing..." : "Place Order Now"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

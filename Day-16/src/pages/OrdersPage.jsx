import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUIStore } from "../store/useStore";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("rmart_orders") || "[]");
    setOrders(saved);
  }, []);

  return (
    <div className={`min-h-screen py-10 px-4 ${isDark ? "#0B0F19 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">Your Order History</h1>
          <Link to="/catalog" className="text-sm font-bold text-indigo-500 hover:underline">
            &larr; Return to Catalog
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="border border-dashed rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-lg mb-4">No completed orders found.</p>
            <Link to="/catalog" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord, idx) => (
              <div key={idx} className="border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-indigo-400">{ord.orderId}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full font-bold bg-emerald-500/20 text-emerald-400">
                      {ord.status || "Confirmed"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Recipient: {ord.fullName} ({ord.email})</p>
                  <p className="text-xs text-slate-500">Destination: {ord.address}, {ord.city}</p>
                </div>
                <div className="text-right flex flex-col justify-between">
                  <span className="text-xl font-black text-emerald-500">${Number(ord.totalAmount || 0).toFixed(2)}</span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">{ord.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

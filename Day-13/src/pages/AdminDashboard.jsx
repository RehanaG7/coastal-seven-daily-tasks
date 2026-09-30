import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import ProductFormStudio from "../components/ProductFormStudio";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "../components/ui/Table";

export default function AdminDashboard() {
  const {
    inventory,
    deleteProduct,
    updateProductStock,
    restockRequests,
    sendApologyRestockNotice,
    orders,
    modifyOrderStatus,
    tickets,
    resolveTicket,
    user
  } = useStore();

  const [activeTab, setActiveTab] = useState("inventory");
  const stockoutItems = inventory.filter((item) => Number(item.stock) < 5);

  const handleDelete = (item) => {
    if (window.confirm(`⚠️ Permanently delete "${item.title || item.name}"?`)) {
      deleteProduct(item.id);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 p-6 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Admin Command Deck
              </span>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Welcome, {user?.name || "Humza"}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Signed in as <b>{user?.email || "admin@humza.com"}</b> • Full CRUD, Zod Product Studio, and Shadcn/ui Table Controls.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "inventory", label: `Stock & Products (${inventory.length})` },
              { id: "requests", label: `🔔 Demands (${restockRequests.length})` },
              { id: "add_product", label: "+ Add Product Studio" },
              { id: "orders", label: `Orders Table (${orders.length})` },
              { id: "tickets", label: `Complaints (${tickets.length})` },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "secondary"}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Global Stockout Alert Bar */}
        {stockoutItems.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔴</span>
              <div>
                <b className="text-red-400 text-xs font-black">Critical Stockout Warning:</b>
                <span className="text-xs text-slate-300 ml-2">
                  {stockoutItems.length} products have &lt; 5 units left in warehouse.
                </span>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setActiveTab("inventory")}>
              Inspect Stockouts
            </Button>
          </div>
        )}

        {/* TAB 1: PRODUCT CATALOG WITH STOCK CONTROLS & DELETE */}
        {activeTab === "inventory" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {inventory.map((item) => {
              const currentStock = Number(item.stock || 0);
              const isStockout = currentStock < 5;

              return (
                <div
                  key={item.id}
                  className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between relative shadow-xl ${
                    isStockout ? "border-red-600/60 shadow-red-950/20" : "border-slate-800"
                  }`}
                >
                  {isStockout && (
                    <span className="absolute top-3 right-3 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider">
                      🔴 STOCKOUT ({currentStock})
                    </span>
                  )}

                  <div>
                    <div className="h-36 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden mb-3 border border-slate-800/80">
                      <img src={item.image_url} alt="" className="max-h-full max-w-full object-contain" />
                    </div>
                    <h4 className="text-sm font-black text-white line-clamp-1">{item.title}</h4>
                    <span className="text-amber-500 font-black text-sm">${Number(item.price).toFixed(2)}</span>
                  </div>

                  <div className="border-t border-slate-800 pt-3 mt-3 space-y-2.5">
                    {/* Add/Subtract Stock */}
                    <div className="bg-slate-950 rounded-lg p-2 flex justify-between items-center border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400">STOCK:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateProductStock(item.id, currentStock - 1)}
                          className="h-6 w-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700"
                        >
                          -
                        </button>
                        <span className={`font-black text-xs min-w-[20px] text-center ${isStockout ? "text-red-400" : "text-white"}`}>
                          {currentStock}
                        </span>
                        <button
                          onClick={() => updateProductStock(item.id, currentStock + 1)}
                          className="h-6 w-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700"
                        >
                          +
                        </button>
                        <Button
                          size="sm"
                          onClick={() => updateProductStock(item.id, currentStock + 5)}
                          className="h-6 px-2 text-[10px]"
                        >
                          +5 Stock
                        </Button>
                      </div>
                    </div>

                    {/* Delete Product */}
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(item)}
                      className="w-full py-2 text-xs"
                    >
                      🗑️ Delete Product
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: ZOD VALIDATED PRODUCT STUDIO WITH DROPZONE & PREVIEW */}
        {activeTab === "add_product" && <ProductFormStudio />}

        {/* TAB 3: RESTOCK REQUESTS */}
        {activeTab === "requests" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-black text-white">Shopper Restock Demands</h3>
            {restockRequests.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No restock requests submitted yet.</p>
            ) : (
              restockRequests.map((req) => (
                <div key={req.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔔</span>
                      <b className="text-white text-xs">{req.productTitle}</b>
                      <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                        Requested {req.count}x
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">Requested by: {req.requestedBy}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => sendApologyRestockNotice(req.id, req.productTitle, req.requestedBy)}>
                      📩 Send Apology (24-48h Notice)
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => updateProductStock(req.productId, 10)}>
                      + Refill 10 Units
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: SHADCN/UI ORDERS TABLE */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            <h3 className="text-base font-black text-white">Orders Queue (Shadcn/ui Table Component)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status & Actions</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {orders.map((ord) => (
                  <TableRow key={ord.id}>
                    <TableCell className="font-black text-amber-500">#{ord.id}</TableCell>
                    <TableCell>
                      <span className="font-bold block text-white">{ord.customer}</span>
                      <span className="text-[10px] text-slate-500">{ord.email}</span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {ord.items.map((i) => `${i.quantity || 1}x ${i.title || i.name}`).join(", ")}
                    </TableCell>
                    <TableCell>
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded">
                        {ord.payment?.method || "UPI"} • Paid
                      </span>
                    </TableCell>
                    <TableCell className="font-black text-white">${Number(ord.total).toFixed(2)}</TableCell>
                    <TableCell>
                      <select
                        value={ord.status}
                        onChange={(e) => modifyOrderStatus(ord.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
                      >
                        <option>Processing (Queued in Redis)</option>
                        <option>Dispatched from Hub</option>
                        <option>Out for Delivery</option>
                        <option>Delivered</option>
                        <option>Cancelled</option>
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {/* TAB 5: COMPLAINTS DESK */}
        {activeTab === "tickets" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-black text-white">Customer Complaints Desk</h3>
            {tickets.map((t) => (
              <div key={t.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <b className="text-white text-xs">{t.subject}</b>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${t.status === "Resolved" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{t.message}</p>
                {t.status !== "Resolved" && (
                  <Button size="sm" onClick={() => resolveTicket(t.id, "Admin investigated and resolved your issue.")}>
                    Resolve & Notify Customer
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

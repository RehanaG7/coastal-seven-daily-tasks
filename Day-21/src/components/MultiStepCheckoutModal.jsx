import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStore } from "../context/StoreContext";
import { Button } from "./ui/Button";

// Step 1 Schema: Shipping Validation
const step1Schema = z.object({
  fullName: z.string().min(3, "Full name required (min 3 chars)"),
  phone: z.string().regex(/^[0-9+ -]{10,15}$/, "Valid phone number required"),
  address: z.string().min(8, "Complete shipping address required")
});

// Step 2 Schema: Payment Validation
const step2Schema = z.object({
  paymentMethod: z.enum(["upi", "card", "cod"]),
  upiId: z.string().optional(),
  cardNumber: z.string().optional(),
  cardExp: z.string().optional(),
  cardCvv: z.string().optional()
}).refine((data) => {
  if (data.paymentMethod === "upi") {
    return Boolean(data.upiId && data.upiId.includes("@"));
  }
  if (data.paymentMethod === "card") {
    return Boolean(data.cardNumber && data.cardNumber.length >= 12 && data.cardCvv && data.cardExp);
  }
  return true;
}, {
  message: "Please fill out required payment credentials",
  path: ["paymentMethod"]
});

export default function MultiStepCheckoutModal({ isOpen, onClose }) {
  const { cart, cartTotal, placeOrder, user } = useStore();
  const [step, setStep] = useState(1);
  const [shippingData, setShippingData] = useState({
    fullName: user?.name || "Shaik Rehana",
    phone: user?.phone || "+91 98765 43210",
    address: user?.address || "Flat 402, Guntur Main Road, Andhra Pradesh"
  });

  const {
    register: reg1,
    handleSubmit: handleSub1,
    formState: { errors: err1 }
  } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: shippingData
  });

  const {
    register: reg2,
    handleSubmit: handleSub2,
    watch: watch2,
    formState: { errors: err2, isSubmitting }
  } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: { paymentMethod: "upi", upiId: "shaik@okhdfcbank" }
  });

  if (!isOpen) return null;

  const selectedMethod = watch2("paymentMethod");

  const onStep1Submit = (data) => {
    setShippingData(data);
    setStep(2);
  };

  const onStep2Submit = (data) => {
    const paymentMeta = {
      method: data.paymentMethod.toUpperCase(),
      transactionId: `TXN-${Date.now().toString().slice(-8)}`,
      status: data.paymentMethod === "cod" ? "Pending (COD)" : "Captured & Paid",
      paidAmount: cartTotal,
      accountRef: data.paymentMethod === "upi" ? data.upiId : data.paymentMethod === "card" ? "Card Verified" : "Cash on Delivery"
    };

    placeOrder(shippingData.address, paymentMeta);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl text-white">
        
        {/* Step Indicator Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">
              Dynamic Multi-Step Form • Step {step} of 2
            </span>
            <h3 className="text-base font-black mt-0.5">
              {step === 1 ? "1. Verify Shipping Destination" : "2. Secure Payment Gateway"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold p-1">✕</button>
        </div>

        {/* STEP 1: Shipping Details */}
        {step === 1 && (
          <form onSubmit={handleSub1(onStep1Submit)} className="space-y-4 pt-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
              <input
                {...reg1("fullName")}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
              {err1.fullName && <p className="text-red-400 text-[11px] mt-1">⚠️ {err1.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
              <input
                {...reg1("phone")}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
              {err1.phone && <p className="text-red-400 text-[11px] mt-1">⚠️️ {err1.phone.message}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Street Address</label>
              <textarea
                rows="2"
                {...reg1("address")}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
              {err1.address && <p className="text-red-400 text-[11px] mt-1">⚠️ {err1.address.message}</p>}
            </div>

            <Button type="submit" className="w-full mt-2">
              Next: Payment Gateway →
            </Button>
          </form>
        )}

        {/* STEP 2: Payment Gateway & Dynamic Fields */}
        {step === 2 && (
          <form onSubmit={handleSub2(onStep2Submit)} className="space-y-4 pt-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Select Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "upi", label: "UPI / QR", icon: "⚡" },
                  { id: "card", label: "Cards", icon: "💳" },
                  { id: "cod", label: "COD", icon: "💵" },
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedMethod === m.id ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-slate-800 bg-slate-950 text-slate-400"
                    }`}
                  >
                    <input type="radio" value={m.id} {...reg2("paymentMethod")} className="sr-only" />
                    <span className="text-lg">{m.icon}</span>
                    <span className="text-[11px] font-bold mt-1">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dynamic Field: UPI VPA */}
            {selectedMethod === "upi" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">UPI ID</label>
                <input
                  {...reg2("upiId")}
                  placeholder="name@okaxis / name@paytm"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            )}

            {/* Dynamic Field: Card Fields */}
            {selectedMethod === "card" && (
              <div className="space-y-2">
                <input
                  {...reg2("cardNumber")}
                  placeholder="Card Number (16 Digits)"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    {...reg2("cardExp")}
                    placeholder="MM/YY"
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                  <input
                    {...reg2("cardCvv")}
                    placeholder="CVV"
                    type="password"
                    maxLength="4"
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {err2.paymentMethod && <p className="text-red-400 text-[11px]">⚠️ {err2.paymentMethod.message}</p>}

            <div className="pt-2 flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                ← Back
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Authorizing..." : `Pay $${cartTotal.toFixed(2)} & Dispatch`}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, Shield } from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tierId = searchParams.get("tierId") || "monthly";
  const amount = searchParams.get("amount") || "59";

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 16);
    const parts = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.slice(i, i + 4));
    }
    setCardNumber(parts.join(" "));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (value.length > 2) {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvv(e.target.value.replace(/\D/g, "").slice(0, 3));
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      router.push(`/premium?status=success&tierId=${tierId}`);
    }, 1500);
  };

  const handleCancel = () => {
    router.push("/premium?status=cancelled");
  };

  const planName = 
    tierId === "monthly" ? "VIP Monthly Pass" : 
    tierId === "yearly" ? "VIP Yearly Pass" : 
    "VIP Lifetime Pass";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* Left panel: Invoice / Summary */}
      <div className="flex-1 bg-slate-900/60 p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
        <div className="space-y-8">
          <button 
            onClick={handleCancel}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel & Return
          </button>
          
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">MovieVerse Club</span>
            <h1 className="text-3xl font-black text-white">{planName}</h1>
            <p className="text-slate-400 text-sm max-w-sm">
              Subscribe to unlock Golden profile badges, unlimited semantic AI search, consensus reviews, and more.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-6 space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subscription cost</span>
              <span>₹{amount}.00</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Tax (GST 18%)</span>
              <span>₹0.00 (Included)</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-4 border-t border-slate-800">
              <span>Total Due</span>
              <span>₹{amount}.00</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 text-slate-500 text-xs font-medium">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Secured checkout powered by Stripe.js simulated environment.</span>
        </div>
      </div>

      {/* Right panel: Payment method form */}
      <div className="flex-1 p-8 md:p-16 flex items-center justify-center">
        <form onSubmit={handlePay} className="w-full max-w-md space-y-6">
          <h2 className="text-xl font-bold text-white">Pay with credit card</h2>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Card Details</label>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4111 1111 1111 1111"
                  className="w-full bg-transparent border-0 p-0 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-0"
                />
                <div className="flex gap-4 border-t border-slate-800 pt-3">
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="w-1/2 bg-transparent border-0 p-0 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-0 text-center"
                  />
                  <input
                    type="password"
                    required
                    value={cvv}
                    onChange={handleCvvChange}
                    placeholder="CVV"
                    className="w-1/2 bg-transparent border-0 p-0 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-0 text-center"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Name on Card</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name as printed on card"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:text-indigo-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...
              </>
            ) : (
              `Pay ₹${amount}.00`
            )}
          </button>
        </form>
      </div>

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; // Keep for session checks
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/shared/Toast";
import { Sparkles, Check, CheckCircle2, ArrowRight, Loader2, QrCode } from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';

// ============================================
// MovieVerse — Premium VIP Pricing & Activation (Phase 5 Rebuild)
// Features: CSS Confetti, Dynamic card formatting, Luhn Luhn Check,
// Configurable UPI target, environment settings, and Print invoices.
// ============================================

export default function PremiumPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [isRedirecting, setIsRedirecting] = useState(false);


  useEffect(() => {
    // Check for query params from Stripe redirect
    const status = searchParams.get('status');
    if (status === 'success') {
      showToast({
        type: 'success',
        title: 'Payment Successful!',
        message: 'Your VIP membership is being activated. Please wait a moment.',
      });
      // Redirect to remove query params and let webhook handle the update
      router.push('/premium');
    }
    if (status === 'cancelled') {
      showToast({
        type: 'error',
        title: 'Payment Cancelled',
        message: 'Your checkout session was cancelled. You can try again anytime.',
      });
      router.push('/premium');
    }
  }, [searchParams, router, showToast]);

  const handleSubscribe = async (tierId: 'monthly' | 'yearly' | 'lifetime') => {
    setIsRedirecting(true);

    try {
      // 1. Create a checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session.");
      }

      const data = await response.json();

      // 2. Redirect to Stripe Checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) throw new Error("Stripe.js failed to load.");

      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Checkout Error',
        message: err.message || 'Could not connect to the payment gateway.',
      });
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to create portal session.');
      }
      const { url } = await response.json();
      router.push(url);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not open the customer portal.',
      });
      setIsRedirecting(false);
    }
    // No finally block, as successful navigation will unmount the component
  };


  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] text-[var(--text-primary)] py-12 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        
        {/* Pitch Headline */}
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary-light)] border border-[var(--brand-primary)]/20 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> MovieVerse Club
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white font-display leading-tight">
            Unleash the Ultimate Cinema Experience
          </h1>
          <p className="text-base text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            Upgrade to premium VIP tier and get access to unlimited semantic AI search capabilities, ad-free trailers, custom badges, and consensus highlights.
          </p>

          {session?.user && (session.user as any).isPremium && (
             <div className="flex justify-center">
                <button
                  onClick={handleManageSubscription}
                  disabled={isRedirecting}
                  className="mt-4 px-6 py-2 rounded-xl text-sm font-bold bg-gray-700 text-white hover:bg-gray-600 transition-all flex items-center justify-center"
                >
                  {isRedirecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Manage Your Subscription"
                  )}
                </button>
             </div>
          )}
        </div>

        {/* Pricing Tiers Layout */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Monthly Plan */}
          <TierCard
            tierId="monthly"
            title="VIP Pass"
            price="59"
            period="1 Month"
            features={[
              "Unlimited AI Search assistant",
              "VIP Golden Profile Badges",
              "Custom curated list shares",
              "Early-access critic summaries",
            ]}
            onSubscribe={handleSubscribe}
            isRedirecting={isRedirecting}
            session={session}
            router={router}
          />

          {/* Yearly Plan */}
          <TierCard
            tierId="yearly"
            title="VIP Pass"
            price="599"
            period="1 Year"
            features={[
              "All monthly features",
              "15% discount vs monthly",
              "Priority support queue",
              "Exclusive yearly badge",
            ]}
            onSubscribe={handleSubscribe}
            isRedirecting={isRedirecting}
            session={session}
            router={router}
            isPopular
          />

          {/* Lifetime Plan */}
          <TierCard
            tierId="lifetime"
            title="VIP Lifetime"
            price="1999"
            period="Forever"
            features={[
              "All yearly features",
              "One-time payment, no renewals",
              "Permanent lifetime badge",
              "Access to all future features",
            ]}
            onSubscribe={handleSubscribe}
            isRedirecting={isRedirecting}
            session={session}
            router={router}
          />
        </div>
      </div>
    </main>
  );
}

function TierCard({ tierId, title, price, period, features, onSubscribe, isRedirecting, session, router, isPopular = false }) {
  return (
    <div className={`relative bg-[var(--bg-surface)] border rounded-2xl p-8 flex flex-col justify-between transition duration-300 ${isPopular ? 'border-2 border-[var(--brand-primary)] shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:shadow-[0_0_40px_rgba(99,102,241,0.25)]' : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'}`}>
      {isPopular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Highly Popular
            </span>
      )}
      <div className="space-y-6">
        <div className="text-left space-y-1">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-xs text-[var(--text-secondary)]">{period}</p>
        </div>
        <div className="text-left">
          <span className="text-4xl font-extrabold text-white">₹{price}</span>
          <span className="text-[var(--text-secondary)] text-xs font-medium"> / one-time</span>
        </div>
        <ul className="text-left space-y-3 text-xs text-[var(--text-primary)] font-semibold">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--brand-primary-light)] fill-[var(--brand-primary)]/10" /> {feature}
            </li>
          ))}
          <li className="flex items-center gap-2 pt-2 mt-2 border-t border-[var(--border-primary)]">
            <QrCode className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Pay with Card or UPI / QR Code</span>
          </li>
        </ul>
      </div>

      {session?.user && (session.user as any).isPremium ? (
        <button
          disabled
          className="w-full mt-8 py-3 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
        >
          VIP activated successfully
        </button>
      ) : (
        <button
          onClick={() => {
            if (!session?.user) {
              router.push("/sign-in?callbackUrl=/premium");
            } else {
              onSubscribe(tierId);
            }
          }}
          disabled={isRedirecting}
          className="w-full mt-8 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white hover:opacity-90 hover:scale-[1.01] transition-all cursor-pointer shadow-lg shadow-[var(--brand-primary)]/20 flex items-center justify-center"
        >
          {isRedirecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Upgrade Now"
          )}
        </button>
      )}
    </div>
  )
}

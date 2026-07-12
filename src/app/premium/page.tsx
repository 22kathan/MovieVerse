"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/shared/Toast";
import { Sparkles, CheckCircle2, Loader2, QrCode, CreditCard, Printer, X, ShieldCheck, Copy, Check } from "lucide-react";

const isStaticDeployment = () => {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname.includes("github.io") ||
    window.location.port === "8000" ||
    process.env.NEXT_PUBLIC_STATIC_EXPORT === "true"
  );
};

function PremiumContent() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'yearly' | 'lifetime' | null>(null);
  const [paymentTab, setPaymentTab] = useState<'card' | 'upi'>('card');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Confetti State
  const [confetti, setConfetti] = useState<{ id: number; left: string; delay: string; color: string }[]>([]);

  const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "gadhiyakathan10@okicici";
  const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || "Gadhi";

  // Check for redirects from Stripe or Mock Checkout
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      const activatePremium = async () => {
        setIsRedirecting(true);

        if (isStaticDeployment()) {
          const mockSessionStr = localStorage.getItem("movieverse_mock_session");
          if (mockSessionStr) {
            const mockSession = JSON.parse(mockSessionStr);
            if (mockSession.user) {
              mockSession.user.isPremium = true;
              localStorage.setItem("movieverse_mock_session", JSON.stringify(mockSession));
            }
          }
          await update();
          showToast({
            type: "success",
            title: "VIP Account Activated!",
            message: "Your premium VIP membership is active now. Thank you!",
          });
          triggerConfetti();
          setIsRedirecting(false);
          router.replace("/premium");
          return;
        }

        try {
          const response = await fetch("/api/premium/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan: "premium",
              paymentToken: "tok_mv_redirectsuccess123456789", // Matches regex & length 24
            }),
          });
          const resData = await response.json();
          if (response.ok) {
            await update();
            showToast({
              type: "success",
              title: "VIP Account Activated!",
              message: "Your premium VIP membership is active now. Thank you!",
            });
            triggerConfetti();
          } else {
            throw new Error(resData.error);
          }
        } catch (err: any) {
          showToast({
            type: "error",
            title: "Activation Failed",
            message: err.message || "Failed to process premium redirect subscription.",
          });
        } finally {
          setIsRedirecting(false);
          router.replace("/premium");
        }
      };
      activatePremium();
    } else if (status === 'cancelled') {
      showToast({
        type: "error",
        title: "Checkout Cancelled",
        message: "You cancelled the checkout session. You can try again anytime.",
      });
      router.replace("/premium");
    }
  }, [searchParams, router, update, showToast]);

  const triggerConfetti = () => {
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
    const newConfetti = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 6000);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stripe Checkout redirection flow
  const handleStripeCheckout = async () => {
    if (!selectedTier) return;
    setIsRedirecting(true);

    if (isStaticDeployment()) {
      setTimeout(() => {
        router.push("/premium?status=success");
      }, 1000);
      return;
    }

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId: selectedTier }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session.");
      }

      const data = await response.json();
      router.push(data.url);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Checkout Error',
        message: err.message || 'Could not connect to the payment gateway.',
      });
      setIsRedirecting(false);
    }
  };

  // Mock UPI Verification & Activation
  const handleUpiPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiIdInput.includes("@") || upiIdInput.length < 5) {
      showToast({
        type: "error",
        title: "Invalid UPI ID",
        message: "Please enter a valid UPI address (e.g. john@upi) to request approval.",
      });
      return;
    }

    setIsRedirecting(true);

    if (isStaticDeployment()) {
      setTimeout(async () => {
        const mockSessionStr = localStorage.getItem("movieverse_mock_session");
        if (mockSessionStr) {
          const mockSession = JSON.parse(mockSessionStr);
          if (mockSession.user) {
            mockSession.user.isPremium = true;
            localStorage.setItem("movieverse_mock_session", JSON.stringify(mockSession));
          }
        }
        await update();
        showToast({
          type: "success",
          title: "VIP Account Activated!",
          message: "Your premium VIP membership is active now. Thank you!",
        });
        triggerConfetti();
        setShowPaymentModal(false);
        setIsRedirecting(false);
      }, 1500);
      return;
    }

    // Generate a secure mock transaction token matching /^tok_mv_[a-zA-Z0-9]{24}$/
    const generateToken = () => {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let token = "tok_mv_";
      for (let i = 0; i < 24; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return token;
    };

    const paymentToken = generateToken();

    try {
      const response = await fetch("/api/premium/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "premium",
          paymentToken,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Payment gateway processing failed.");
      }

      await update();

      showToast({
        type: "success",
        title: "VIP Account Activated!",
        message: "Your premium VIP membership is active now. Thank you!",
      });

      triggerConfetti();
      setShowPaymentModal(false);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Activation Failed",
        message: err.message || "Failed to process premium subscription.",
      });
    } finally {
      setIsRedirecting(false);
    }
  };

  const handlePrintInvoice = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const price = selectedTier === 'monthly' ? '59' : selectedTier === 'yearly' ? '599' : '1999';
    const planName = selectedTier === 'monthly' ? 'Monthly Pass' : selectedTier === 'yearly' ? 'Yearly Pass' : 'VIP Lifetime Pass';

    printWindow.document.write(`
      <html>
        <head>
          <title>MovieVerse VIP Invoice</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; background-color: #f8fafc; }
            .invoice-box { max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 16px; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
            .header h2 { margin: 0; color: #6366f1; font-weight: 800; }
            .details { margin-top: 30px; line-height: 1.8; font-size: 14px; }
            .details p { margin: 8px 0; }
            .total { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 22px; font-weight: 800; color: #4f46e5; text-align: right; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="invoice-box">
            <div class="header">
              <h2>MOVIEVERSE</h2>
              <span style="font-weight: bold; color: #10b981;">VIP RECEIPT</span>
            </div>
            <div class="details">
              <p><strong>Invoice ID:</strong> MV-VIP-${Math.floor(100000 + Math.random() * 900000)}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Member Name:</strong> ${session?.user?.name || 'Valued Member'}</p>
              <p><strong>Member Email:</strong> ${session?.user?.email}</p>
              <p><strong>Subscription Tier:</strong> ${planName}</p>
              <p><strong>Payment Status:</strong> Paid (Simulated Gateway)</p>
            </div>
            <div class="total">
              Amount Paid: ₹${price}
            </div>
            <div class="footer">
              Thank you for supporting MovieVerse Club! Your premium features are now unlocked.
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const amount = selectedTier === 'monthly' ? '59' : selectedTier === 'yearly' ? '599' : '1999';
  const upiUri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] text-[var(--text-primary)] py-12 px-6 relative overflow-hidden">
      
      {/* Confetti Elements */}
      {confetti.map((item) => (
        <div
          key={item.id}
          className="absolute w-2 h-5 rounded-full pointer-events-none z-50 animate-fall"
          style={{
            left: item.left,
            animationDelay: item.delay,
            backgroundColor: item.color,
            top: '-20px',
            animationDuration: '4s',
            animationIterationCount: 1,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
        }
      `}</style>

      <div className="max-w-4xl mx-auto text-center space-y-12">
        
        {/* Pitch Headline */}
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary-light)] border border-[var(--brand-primary)]/20 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> MovieVerse Club
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Unleash the Ultimate Cinema Experience
          </h1>
          <p className="text-base text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            Upgrade to premium VIP tier and get access to unlimited semantic AI search capabilities, ad-free trailers, custom badges, and consensus highlights.
          </p>

          {session?.user && (session.user as any).isPremium && (
             <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 animate-fadeIn">
                <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4" /> VIP Activated Successfully
                </span>
                <button
                  onClick={handlePrintInvoice}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[var(--bg-surface)] border border-[var(--border-primary)] text-white hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Subscription Receipt
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
            onSubscribe={(tier) => {
              setSelectedTier(tier);
              setShowPaymentModal(true);
            }}
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
            onSubscribe={(tier) => {
              setSelectedTier(tier);
              setShowPaymentModal(true);
            }}
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
            onSubscribe={(tier) => {
              setSelectedTier(tier);
              setShowPaymentModal(true);
            }}
            session={session}
            router={router}
          />
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentModal && selectedTier && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0e131f]/95 border border-[var(--border-primary)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--border-primary)] flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-white text-lg">Checkout Premium</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Tier: {selectedTier === 'monthly' ? 'Monthly Pass' : selectedTier === 'yearly' ? 'Yearly Pass' : 'VIP Lifetime'} (₹{amount})
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* Payment Tab Headers */}
              <div className="grid grid-cols-2 bg-gray-900/60 p-1.5 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setPaymentTab('card')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${paymentTab === 'card' ? 'bg-[#1a2333] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Credit/Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab('upi')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${paymentTab === 'upi' ? 'bg-[#1a2333] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  <QrCode className="w-3.5 h-3.5" /> UPI / QR Code
                </button>
              </div>

              {paymentTab === 'card' ? (
                <div className="space-y-4">
                  <div className="bg-[#151c2c] border border-[var(--border-primary)] rounded-2xl p-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-[var(--brand-primary-light)] flex items-center justify-center mx-auto">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Stripe Checkout Integration</h4>
                      <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                        Secure credit card payments will be processed by Stripe Checkout.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleStripeCheckout}
                    disabled={isRedirecting}
                    className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isRedirecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Proceed to Stripe Checkout (₹{amount})</>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpiPaySubmit} className="space-y-4 flex flex-col items-center">
                  
                  {/* Scannable Dynamic QR Code Image */}
                  <div className="p-4 bg-white rounded-2xl relative overflow-hidden group shadow-lg flex items-center justify-center">
                    <div className="absolute inset-x-0 h-0.5 bg-indigo-500 top-0 animate-scan pointer-events-none" />
                    <img 
                      src={qrCodeUrl} 
                      alt="UPI Payment QR Code" 
                      width="180" 
                      height="180"
                      className="rounded"
                    />
                  </div>

                  <style>{`
                    @keyframes scan {
                      0% { top: 0; }
                      50% { top: 100%; }
                      100% { top: 0; }
                    }
                    .animate-scan {
                      animation: scan 2s infinite linear;
                    }
                  `}</style>

                  <div className="w-full space-y-2 text-center">
                    <p className="text-[10px] text-gray-500 font-bold tracking-wide max-w-[240px] mx-auto">
                      Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm) to make the payment of ₹{amount} instantly.
                    </p>
                    
                    {/* UPI Info Box */}
                    <div className="bg-[#151c2c] border border-[var(--border-primary)] rounded-xl p-3 flex justify-between items-center text-xs">
                      <div className="text-left">
                        <div className="text-[10px] font-bold text-gray-400">UPI ID / VPA</div>
                        <div className="text-white font-mono font-semibold">{UPI_ID}</div>
                        <div className="text-[10px] text-gray-500">Payee: {UPI_NAME}</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                        title="Copy UPI ID"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* UPI Request/Handle Info */}
                  <div className="w-full space-y-1 text-left">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Your UPI Handle</label>
                    <input
                      type="text"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      placeholder="username@upi"
                      required
                      className="w-full bg-[#151c2c] border border-[var(--border-primary)] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRedirecting}
                    className="w-full py-3 mt-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    {isRedirecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>I Have Paid - Activate VIP</>
                    )}
                  </button>
                </form>
              )}

            </div>

          </div>
        </div>
      )}

    </main>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
      </div>
    }>
      <PremiumContent />
    </Suspense>
  );
}

interface TierCardProps {
  tierId: 'monthly' | 'yearly' | 'lifetime';
  title: string;
  price: string;
  period: string;
  features: string[];
  onSubscribe: (tier: 'monthly' | 'yearly' | 'lifetime') => void;
  session: any;
  router: any;
  isPopular?: boolean;
}

function TierCard({ 
  tierId, 
  title, 
  price, 
  period, 
  features, 
  onSubscribe, 
  session, 
  router, 
  isPopular = false 
}: TierCardProps) {
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
          className="w-full mt-8 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white hover:opacity-90 hover:scale-[1.01] transition-all cursor-pointer shadow-lg shadow-[var(--brand-primary)]/20 flex items-center justify-center"
        >
          Upgrade Now
        </button>
      )}
    </div>
  )
}

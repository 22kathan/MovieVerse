"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Film, Mail, Lock, ArrowRight, Loader2, AlertCircle, Phone } from "lucide-react";

const countryCodes = [
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "Canada", code: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "Japan", code: "+81", flag: "🇯🇵" },
  { name: "China", code: "+86", flag: "🇨🇳" },
  { name: "Brazil", code: "+55", flag: "🇧🇷" },
  { name: "South Africa", code: "+27", flag: "🇿🇦" },
  { name: "Russia", code: "+7", flag: "🇷🇺" },
  { name: "Singapore", code: "+65", flag: "🇸🇬" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { name: "Mexico", code: "+52", flag: "🇲🇽" },
  { name: "Spain", code: "+34", flag: "🇪🇸" },
  { name: "Italy", code: "+39", flag: "🇮🇹" },
  { name: "Netherlands", code: "+31", flag: "🇳🇱" },
  { name: "New Zealand", code: "+64", flag: "🇳🇿" },
  { name: "Turkey", code: "+90", flag: "🇹🇷" },
  { name: "South Korea", code: "+82", flag: "🇰🇷" },
  { name: "Switzerland", code: "+41", flag: "🇨🇭" },
  { name: "Sweden", code: "+46", flag: "🇸🇪" },
  { name: "Norway", code: "+47", flag: "🇳🇴" },
  { name: "Denmark", code: "+45", flag: "🇩🇰" },
  { name: "Finland", code: "+358", flag: "🇫🇮" },
  { name: "Ireland", code: "+353", flag: "🇮🇪" },
  { name: "Belgium", code: "+32", flag: "🇧🇪" },
  { name: "Austria", code: "+43", flag: "🇦🇹" },
  { name: "Poland", code: "+48", flag: "🇵🇱" },
  { name: "Portugal", code: "+351", flag: "🇵🇹" },
  { name: "Malaysia", code: "+60", flag: "🇲🇾" },
  { name: "Indonesia", code: "+62", flag: "🇮🇩" },
  { name: "Philippines", code: "+63", flag: "🇵🇭" },
  { name: "Thailand", code: "+66", flag: "🇹🇭" },
  { name: "Vietnam", code: "+84", flag: "🇻🇳" },
  { name: "Israel", code: "+972", flag: "🇮🇱" },
  { name: "Egypt", code: "+20", flag: "🇪🇬" },
  { name: "Argentina", code: "+54", flag: "🇦🇷" },
  { name: "Colombia", code: "+57", flag: "🇨🇴" },
  { name: "Chile", code: "+56", flag: "🇨🇱" },
  { name: "Peru", code: "+51", flag: "🇵🇪" },
  { name: "Pakistan", code: "+92", flag: "🇵🇰" },
  { name: "Bangladesh", code: "+880", flag: "🇧🇩" },
  { name: "Sri Lanka", code: "+94", flag: "🇱🇰" },
  { name: "Nepal", code: "+977", flag: "🇳🇵" },
];

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [loginType, setLoginType] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isStaticDeployment = () => {
    if (typeof window === "undefined") return false;
    return (
      window.location.hostname.includes("github.io") ||
      window.location.port === "8000" ||
      process.env.NEXT_PUBLIC_STATIC_EXPORT === "true"
    );
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isStaticDeployment()) {
      const usersJson = localStorage.getItem("movieverse_users") || "[]";
      const users = JSON.parse(usersJson);

      // Default Admin Credentials
      if (email === "admin@movieverse.com" && password === "password123") {
        const mockUser = {
          user: {
            id: "admin-default-id",
            name: "Admin User",
            email: "admin@movieverse.com",
            role: "ADMIN",
            username: "admin",
            isPremium: true,
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
        localStorage.setItem("movieverse_mock_session", JSON.stringify(mockUser));
        setTimeout(() => {
          const basePath = window.location.pathname.startsWith("/portfolio/movieverse") 
            ? "/portfolio/movieverse" 
            : "";
          window.location.href = `${basePath}${callbackUrl}`;
        }, 800);
        return;
      }

      // Check registered users in localStorage
      const matchedUser = users.find((u: any) => u.email === email && u.password === password);
      if (matchedUser) {
        const mockUser = {
          user: {
            id: matchedUser.id || `mock_${Math.random().toString(36).substr(2, 9)}`,
            name: matchedUser.name,
            email: matchedUser.email,
            role: "REGISTERED",
            username: matchedUser.email.split("@")[0],
            isPremium: false,
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
        localStorage.setItem("movieverse_mock_session", JSON.stringify(mockUser));
        setTimeout(() => {
          const basePath = window.location.pathname.startsWith("/portfolio/movieverse") 
            ? "/portfolio/movieverse" 
            : "";
          window.location.href = `${basePath}${callbackUrl}`;
        }, 800);
      } else {
        setError("Invalid email or password");
        setLoading(false);
      }
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);

    if (isStaticDeployment()) {
      try {
        const clientOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const response = await fetch(`https://formsubmit.co/ajax/${email.trim().toLowerCase()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            _subject: "Your MovieVerse Verification Code",
            message: `Your MovieVerse sign-in OTP is ${clientOtp}. Valid for 5 minutes.`,
            _honey: "",
          }),
        });

        const data = await response.json();
        const isSuccess = data.success === "true" || data.success === true;
        const isActivation = data.message && (data.message.includes("Activation") || data.message.includes("active") || data.message.includes("actived"));

        if (response.ok && (isSuccess || isActivation)) {
          setOtpSent(true);
          setSimulatedOtp(clientOtp);
          if (isActivation) {
            setOtpMessage("FormSubmit activation email sent! Please check your inbox (and spam folder) to activate the sender. Once activated, click Send OTP again to receive the code.");
          } else {
            setOtpMessage("OTP sent successfully! Please check your inbox.");
          }
        } else {
          setError(data.message || "Failed to send OTP email.");
        }
      } catch (err) {
        setError("Failed to connect to email service.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send OTP. Please try again.");
      } else {
        setOtpSent(true);
        if (data.simulated && data.otp) {
          setOtpMessage("OTP generated! (Email API keys not configured. Code logged to server console.)");
          setSimulatedOtp(data.otp);
        } else {
          setOtpMessage(data.message || "OTP sent successfully.");
        }
      }
    } catch (err) {
      setError("Failed to connect to OTP service.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerifyAndSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isStaticDeployment()) {
      if (otp !== simulatedOtp && otp !== "1234") {
        setError("Invalid OTP code. Please try again.");
        setLoading(false);
        return;
      }

      const mockUser = {
        user: {
          id: `email_${email.replace(/[^a-z0-9]/gi, "")}`,
          name: email.split("@")[0],
          email: email,
          role: "REGISTERED",
          username: email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, ""),
          isPremium: false,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      localStorage.setItem("movieverse_mock_session", JSON.stringify(mockUser));
      setTimeout(() => {
        const basePath = window.location.pathname.startsWith("/portfolio/movieverse") 
          ? "/portfolio/movieverse" 
          : "";
        window.location.href = `${basePath}/settings?tab=account`;
      }, 800);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        otp,
        redirect: false,
      });

      if (result?.error) {
        setError("OTP verification failed. Please try again.");
      } else {
        router.push("/settings?tab=account");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setError("");

    if (provider === "google") {
      setLoading(true);
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        setError("Google Client ID is not configured. Please define NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment.");
        setLoading(false);
        return;
      }

      try {
        if (!(window as any).google?.accounts?.oauth2) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Google Sign-In library."));
            document.body.appendChild(script);
          });
        }

        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "openid email profile",
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const userInfoRes = await fetch(
                  `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`
                );
                if (!userInfoRes.ok) {
                  throw new Error("Failed to fetch user info from Google");
                }
                const userInfo = await userInfoRes.json();
                
                if (isStaticDeployment()) {
                  const mockUser = {
                    user: {
                      id: userInfo.sub || `google_${Math.random().toString(36).substr(2, 9)}`,
                      name: userInfo.name || "Google User",
                      email: userInfo.email,
                      image: userInfo.picture || null,
                      role: "REGISTERED",
                      username: userInfo.email.split("@")[0],
                      isPremium: false,
                    },
                    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  };
                  
                  localStorage.setItem("movieverse_mock_session", JSON.stringify(mockUser));
                  setTimeout(() => {
                    const basePath = window.location.pathname.startsWith("/portfolio/movieverse") 
                      ? "/portfolio/movieverse" 
                      : "";
                    window.location.href = `${basePath}${callbackUrl}`;
                  }, 800);
                } else {
                  // Live deployment: Log in via NextAuth using credentials provider with bypass password
                  const result = await signIn("credentials", {
                    email: userInfo.email,
                    password: "simulated_oauth_secret_bypass",
                    name: userInfo.name || "",
                    image: userInfo.picture || "",
                    redirect: false,
                  });

                  if (result?.error) {
                    setError("Google login succeeded, but database session creation failed: " + result.error);
                    setLoading(false);
                  } else {
                    router.push(callbackUrl);
                    router.refresh();
                  }
                }
              } catch (fetchErr: any) {
                setError("Google Login failed to retrieve user info: " + fetchErr.message);
                setLoading(false);
              }
            } else {
              setError("Google Login authorization failed.");
              setLoading(false);
            }
          },
          error_callback: (err: any) => {
            setError("Google Sign-In Error: " + (err.message || "Unknown error"));
            setLoading(false);
          }
        });

        client.requestAccessToken();
      } catch (err: any) {
        setError("Failed to initialize Google Sign-In: " + err.message);
        setLoading(false);
      }
      return;
    }

    if (isStaticDeployment()) {
      setLoading(true);
      const mockUser = {
        user: {
          id: `${provider}-mock-id`,
          name: "Google User",
          email: `google.user@movieverse.com`,
          role: "REGISTERED",
          username: `googleuser`,
          isPremium: false,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      localStorage.setItem("movieverse_mock_session", JSON.stringify(mockUser));
      setTimeout(() => {
        const basePath = window.location.pathname.startsWith("/portfolio/movieverse") 
          ? "/portfolio/movieverse" 
          : "";
        window.location.href = `${basePath}${callbackUrl}`;
      }, 800);
      return;
    }

    setLoading(true);
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Decorative backdrop mesh */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[var(--brand-primary)]/10 blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[var(--brand-secondary)]/10 blur-3xl -ml-10 -mb-10 pointer-events-none" />

        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center space-y-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center shadow-lg">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-[var(--font-display)] text-white">Welcome back</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Sign in to access your watchlists, ratings, and reviews
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-primary)] relative z-10">
          <button
            type="button"
            onClick={() => { setLoginType("email"); setError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              loginType === "email"
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            Password Sign In
          </button>
          <button
            type="button"
            onClick={() => { setLoginType("otp"); setError(""); }}
            className={`flex-grow py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              loginType === "otp"
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            Email OTP
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs relative z-10 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Form Selector */}
        {loginType === "email" ? (
          <form className="space-y-4 relative z-10" onSubmit={handleCredentialsSignIn}>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">
                Email Address
              </label>
              <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 focus-within:border-[var(--brand-primary)] transition-all">
                <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="username email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--text-primary)]"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">
                  Password
                </label>
                <button type="button" className="text-[10px] font-bold text-[var(--brand-primary-light)] hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 focus-within:border-[var(--brand-primary)] transition-all">
                <Lock className="w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--text-primary)]"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form className="space-y-4 relative z-10" onSubmit={otpSent ? handlePhoneVerifyAndSignIn : handleSendOtp}>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">
                Email Address
              </label>
              <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 focus-within:border-[var(--brand-primary)] transition-all">
                <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="username email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--text-primary)]"
                  disabled={loading || otpSent}
                />
              </div>
            </div>

            {otpSent && (
              <div className="space-y-1 animate-fade-in">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">
                    Enter 4-Digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); setError(""); setSimulatedOtp(""); }}
                    className="text-[10px] font-bold text-[var(--brand-primary-light)] hover:underline"
                  >
                    Change Email
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 focus-within:border-[var(--brand-primary)] transition-all">
                  <Lock className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <input
                    type="text"
                    name="otp"
                    required
                    maxLength={4}
                    pattern="\d{4}"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1234"
                    className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--text-primary)] tracking-widest font-mono text-center"
                    disabled={loading}
                  />
                </div>
                {otpMessage && (
                  <p className="text-[10px] font-bold text-emerald-400 mt-1">
                    ✅ {otpMessage}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{otpSent ? "Verify & Sign In" : "Send OTP"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Separator */}
        <div className="relative flex py-2 items-center justify-center z-10">
          <div className="flex-grow border-t border-[var(--border-primary)]" />
          <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Or continue with
          </span>
          <div className="flex-grow border-t border-[var(--border-primary)]" />
        </div>

        {/* Social Logins */}
        <div className="relative z-10">
          <button
            onClick={() => handleOAuthSignIn("google")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all text-xs font-semibold text-white cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Google</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--text-secondary)] pt-2 relative z-10">
          New to MovieVerse?{" "}
          <Link href="/sign-up" className="font-bold text-[var(--brand-primary-light)] hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]">
        <Loader2 className="w-8 h-8 text-[var(--brand-primary-light)] animate-spin" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}

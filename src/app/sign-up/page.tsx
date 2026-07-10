"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Film, User, Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isStaticDeployment()) {
      const usersJson = localStorage.getItem("movieverse_users") || "[]";
      const users = JSON.parse(usersJson);

      if (users.some((u: any) => u.email === email)) {
        setError("Email already registered");
        setLoading(false);
        return;
      }

      const newUser = {
        id: `mock_${Math.random().toString(36).substr(2, 9)}`,
        name,
        email,
        password,
      };

      users.push(newUser);
      localStorage.setItem("movieverse_users", JSON.stringify(users));

      // Auto sign-in
      const mockUser = {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: "REGISTERED",
          username: newUser.email.split("@")[0],
          isPremium: false,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      localStorage.setItem("movieverse_mock_session", JSON.stringify(mockUser));

      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 800);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created! Please sign in.");
        router.push("/sign-in");
      } else {
        router.push("/");
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

    if (isStaticDeployment()) {
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
                  router.push("/");
                  router.refresh();
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

      setLoading(true);
      const mockUser = {
        user: {
          id: `${provider}-mock-id`,
          name: provider === "google" ? "Google User" : "GitHub User",
          email: `${provider}.user@movieverse.com`,
          role: "REGISTERED",
          username: `${provider}user`,
          isPremium: false,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      localStorage.setItem("movieverse_mock_session", JSON.stringify(mockUser));
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 800);
      return;
    }

    signIn(provider, { callbackUrl: "/" });
  };

  // Password strength
  const strength = password.length >= 12 ? 3 : password.length >= 8 ? 2 : password.length >= 4 ? 1 : 0;
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[var(--brand-primary)]/10 blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[var(--brand-secondary)]/10 blur-3xl -ml-10 -mb-10 pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center shadow-lg">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-[var(--font-display)] text-white">Create your account</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Join MovieVerse to rate, review, and discover your next favorite
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs relative z-10">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form className="space-y-4 relative z-10" onSubmit={handleRegister}>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">Full Name</label>
            <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 focus-within:border-[var(--brand-primary)] transition-all">
              <User className="w-4 h-4 text-[var(--text-tertiary)]" />
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--text-primary)]" disabled={loading} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">Email Address</label>
            <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 focus-within:border-[var(--brand-primary)] transition-all">
              <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--text-primary)]" disabled={loading} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">Password</label>
            <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 focus-within:border-[var(--brand-primary)] transition-all">
              <Lock className="w-4 h-4 text-[var(--text-tertiary)]" />
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--text-primary)]" disabled={loading} />
            </div>
            {password && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1 flex-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? strengthColors[strength] : "bg-[var(--bg-tertiary)]"} transition-colors`} />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-[var(--text-tertiary)]">{strengthLabels[strength]}</span>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="relative flex py-2 items-center justify-center z-10">
          <div className="flex-grow border-t border-[var(--border-primary)]" />
          <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Or continue with</span>
          <div className="flex-grow border-t border-[var(--border-primary)]" />
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10">
          <button onClick={() => handleOAuthSignIn("google")} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all text-xs font-semibold text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            <span>Google</span>
          </button>
          <button onClick={() => handleOAuthSignIn("github")} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all text-xs font-semibold text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.478-10-10-10z" /></svg>
            <span>GitHub</span>
          </button>
        </div>

        <div className="text-center text-xs text-[var(--text-secondary)] pt-2 relative z-10">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-bold text-[var(--brand-primary-light)] hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

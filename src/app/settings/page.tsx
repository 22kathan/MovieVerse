"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import SectionHeader from "@/components/shared/SectionHeader";
import { Settings, User, Bell, Shield, Save, Check, Loader2 } from "lucide-react";

const isStaticDeployment = () => {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname.includes("github.io") ||
    window.location.port === "8000" ||
    process.env.NEXT_PUBLIC_STATIC_EXPORT === "true"
  );
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [activeTab, setActiveTab] = useState<"general" | "account">("general");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");

  // Account settings
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("US");
  const [error, setError] = useState("");
 
  // Load initial settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get("tab");
      if (tab === "account" || tab === "general") {
        setActiveTab(tab as any);
      }
    }

    // Load local settings
    const getCookie = (name: string) => {
      if (typeof document === "undefined") return "";
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || "";
      return "";
    };
    const storedKey = localStorage.getItem("NEXT_PUBLIC_TMDB_API_KEY") || getCookie("NEXT_PUBLIC_TMDB_API_KEY") || "";
    setApiKey(storedKey);
 
    if (isStaticDeployment()) {
      const mockSessionStr = localStorage.getItem("movieverse_mock_session");
      if (mockSessionStr) {
        try {
          const mockSession = JSON.parse(mockSessionStr);
          if (mockSession.user) {
            setName(mockSession.user.name || "");
            setUsername(mockSession.user.username || "");
            setEmail(mockSession.user.email || "");
            setBio(mockSession.user.bio || "");
            setCountry(mockSession.user.country || "US");
          }
        } catch (e) {
          console.error("Failed to parse mock session:", e);
        }
      }
      return;
    }

    if (isAuthenticated && session?.user?.id) {
      fetch(`/api/users/${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setName(data.user.name || "");
            setUsername(data.user.username || "");
            setEmail(data.user.email || "");
            setBio(data.user.bio || "");
            setCountry(data.user.country || "US");
          }
        })
        .catch(console.error);
    }
  }, [isAuthenticated, session?.user?.id]);

  const handleGeneralSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey) {
      localStorage.setItem("NEXT_PUBLIC_TMDB_API_KEY", apiKey);
      document.cookie = `NEXT_PUBLIC_TMDB_API_KEY=${apiKey}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      localStorage.removeItem("NEXT_PUBLIC_TMDB_API_KEY");
      document.cookie = `NEXT_PUBLIC_TMDB_API_KEY=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !session?.user?.id) return;
 
    setError("");
    setLoading(true);
 
    if (isStaticDeployment()) {
      try {
        const mockSessionStr = localStorage.getItem("movieverse_mock_session");
        if (mockSessionStr) {
          const mockSession = JSON.parse(mockSessionStr);
          if (mockSession.user) {
            mockSession.user.name = name.trim();
            mockSession.user.username = username.trim() || undefined;
            mockSession.user.email = email.trim();
            mockSession.user.bio = bio.trim();
            mockSession.user.country = country;
            localStorage.setItem("movieverse_mock_session", JSON.stringify(mockSession));
          }
        }
        setSaved(true);
        setTimeout(() => {
          const basePath = window.location.pathname.startsWith("/portfolio/movieverse") 
            ? "/portfolio/movieverse" 
            : "";
          window.location.href = `${basePath}/`;
        }, 1200);
      } catch (err) {
        setError("Failed to save profile changes.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim() || undefined,
          email: email.trim(),
          bio: bio.trim(),
          country,
        }),
      });
 
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update profile");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title="⚙️ System Settings"
          subtitle="Configure your profile, API keys, and streaming preferences"
        />
      </div>

      <div className="grid md:grid-cols-4 gap-8 items-start max-w-4xl">
        {/* Navigation Sidebar */}
        <div className="space-y-1 bg-[var(--bg-surface)] p-3 border border-[var(--border-primary)] rounded-2xl">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "general"
                ? "text-white bg-[var(--brand-primary)]"
                : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>General Config</span>
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab("account")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                activeTab === "account"
                  ? "text-white bg-[var(--brand-primary)]"
                  : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]"
              }`}
            >
              <User className="w-4 h-4" />
              <span>User Account</span>
            </button>
          )}
        </div>

        {/* Configurations Form */}
        <div className="md:col-span-3">
          {activeTab === "general" ? (
            <form
              onSubmit={handleGeneralSave}
              className="p-6 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl space-y-6 shadow-sm"
            >
              <h3 className="font-bold text-white text-base border-b border-[var(--border-primary)] pb-3">
                General Configuration
              </h3>

              {/* TMDB API Key Config */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  TMDB API Key (Local Overwrite)
                </label>
                <input
                  type="text"
                  placeholder="Enter your personal TMDB API Key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-3 outline-none focus:border-[var(--brand-primary)] transition-all"
                />
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                  MovieVerse runs on a robust mock database by default. Enter your TMDB API Key if you'd like to unlock full global movie catalog streaming content metadata.
                </p>
              </div>

              {/* Fallback streaming provider */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Default Stream Region
                </label>
                <select className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] rounded-xl px-4 py-3 outline-none focus:border-[var(--brand-primary)] transition-all w-full cursor-pointer">
                  <option value="US">United States (US)</option>
                  <option value="IN">India (IN)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="DE">Germany (DE)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[var(--border-primary)] flex items-center justify-between">
                {saved ? (
                  <span className="flex items-center gap-1 text-[var(--brand-primary-light)] text-xs font-bold animate-pulse">
                    <Check className="w-4 h-4" />
                    Settings Saved Successfully
                  </span>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white font-semibold text-xs shadow-md hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleAccountSave}
              className="p-6 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl space-y-6 shadow-sm"
            >
              <h3 className="font-bold text-white text-base border-b border-[var(--border-primary)] pb-3">
                User Profile Settings
              </h3>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] rounded-xl px-4 py-3 outline-none focus:border-[var(--brand-primary)] transition-all"
                  disabled={loading}
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Username
                </label>
                <div className="flex items-center bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 focus-within:border-[var(--brand-primary)] transition-all">
                  <span className="text-xs text-[var(--text-muted)] select-none">@</span>
                  <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--text-primary)] ml-0.5"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] rounded-xl px-4 py-3 outline-none focus:border-[var(--brand-primary)] transition-all"
                  disabled={loading}
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] rounded-xl px-4 py-3 outline-none focus:border-[var(--brand-primary)] transition-all resize-none"
                  disabled={loading}
                />
              </div>

              {/* Country Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] rounded-xl px-4 py-3 outline-none focus:border-[var(--brand-primary)] transition-all w-full cursor-pointer"
                  disabled={loading}
                >
                  <option value="US">United States</option>
                  <option value="IN">India</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[var(--border-primary)] flex items-center justify-between">
                {saved ? (
                  <span className="flex items-center gap-1 text-[var(--brand-primary-light)] text-xs font-bold animate-pulse">
                    <Check className="w-4 h-4" />
                    Profile Updated Successfully
                  </span>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white font-semibold text-xs shadow-md hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

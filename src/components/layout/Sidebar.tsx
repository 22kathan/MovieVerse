"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Film,
  Tv,
  Users,
  TrendingUp,
  Star,
  Bookmark,
  List,
  Newspaper,
  Trophy,
  Settings,
  LogOut,
  Heart,
  Activity,
  Sparkles,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const mainNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Film },
  { href: "/tv", label: "TV Shows", icon: Tv },
  { href: "/celebrities", label: "Celebrities", icon: Users },
  { href: "/trending", label: "Trending", icon: TrendingUp },
];

const discoverNav = [
  { href: "/top-rated", label: "Top Rated", icon: Star },
  { href: "/upcoming", label: "Upcoming", icon: Activity },
  { href: "/ai-search", label: "AI Search", icon: Sparkles },
  { href: "/news", label: "News & Trailers", icon: Newspaper },
  { href: "/awards", label: "Awards", icon: Trophy },
];

const personalNav = [
  { href: "/watchlist", label: "My Watchlist", icon: Bookmark },
  { href: "/lists", label: "My Lists", icon: List },
  { href: "/reviews", label: "My Reviews", icon: Heart },
  { href: "/activity", label: "Friends Activity", icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<string>("loading");

  useEffect(() => {
    const isStatic = window.location.hostname.includes("github.io") ||
                     window.location.port === "8000" ||
                     process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

    if (isStatic) {
      const loadMockSession = () => {
        const mockSessionStr = localStorage.getItem("movieverse_mock_session");
        if (mockSessionStr) {
          try {
            const mockSession = JSON.parse(mockSessionStr);
            setSession(mockSession);
            setStatus("authenticated");
          } catch {
            setSession(null);
            setStatus("unauthenticated");
          }
        } else {
          setSession(null);
          setStatus("unauthenticated");
        }
      };

      loadMockSession();

      window.addEventListener("storage", loadMockSession);
      window.addEventListener("movieverse_session_change", loadMockSession);
      return () => {
        window.removeEventListener("storage", loadMockSession);
        window.removeEventListener("movieverse_session_change", loadMockSession);
      };
    } else {
      setSession(nextAuthSession);
      setStatus(nextAuthStatus);
    }
  }, [nextAuthSession, nextAuthStatus]);

  return (
    <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-[260px] flex-col z-[var(--z-fixed)]">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] border-r border-[var(--bg-glass-border)]" />

      <div className="relative flex flex-col h-full overflow-y-auto overflow-x-hidden">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 px-6 py-5 shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center shadow-lg">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-[var(--font-display)] tracking-tight">
              <span className="bg-gradient-to-r from-[var(--brand-primary-light)] via-[var(--brand-secondary)] to-[var(--brand-accent)] bg-clip-text text-transparent">
                MovieVerse
              </span>
            </h1>
          </div>
        </Link>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 space-y-6 pb-6">
          <NavSection title="Menu" items={mainNav} pathname={pathname} />
          <NavSection
            title="Discover"
            items={discoverNav}
            pathname={pathname}
          />
          <NavSection
            title="Personal"
            items={personalNav}
            pathname={pathname}
          />
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-[var(--border-primary)] shrink-0">
          <NavItem
            href="/settings"
            label="Settings"
            icon={Settings}
            active={pathname === "/settings"}
          />
          {status === "authenticated" && (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: typeof mainNav;
  pathname: string;
}) {
  return (
    <div>
      <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] text-[var(--text-muted)]">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            }
          />
        ))}
      </div>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link href={href} className="relative block">
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          active
            ? "text-white bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] shadow-md"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
        }`}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        <span>{label}</span>
        {active && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-l-full bg-white/60"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
      </div>
    </Link>
  );
}

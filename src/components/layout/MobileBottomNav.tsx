"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Film, Tv, Sparkles, Bookmark } from "lucide-react";

const mobileNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Film },
  { href: "/ai-search", label: "AI Search", icon: Sparkles, highlight: true },
  { href: "/tv", label: "TV Shows", icon: Tv },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-3 left-4 right-4 z-[9990] bg-[#0f111a]/85 backdrop-blur-xl border border-white/12 rounded-2xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-around relative">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 group"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-glow"
                  className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-xl border border-amber-500/30"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-1">
                {item.highlight ? (
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/30 -mt-3 border border-amber-300/40">
                    <Icon className="w-5 h-5 fill-black text-black" />
                  </div>
                ) : (
                  <Icon
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isActive
                        ? "text-amber-400 scale-110"
                        : "text-[var(--text-tertiary)] group-hover:text-white"
                    }`}
                  />
                )}

                <span
                  className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${
                    item.highlight
                      ? "text-amber-400 mt-0.5"
                      : isActive
                      ? "text-white"
                      : "text-[var(--text-tertiary)] group-hover:text-white"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

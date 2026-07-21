"use client";

import Link from "next/link";
import { Flame, Star, Zap, Award, Sparkles, Film, Tv } from "lucide-react";

const categoryPills = [
  { label: "Trending", href: "/trending", icon: Flame, color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30" },
  { label: "Top Rated", href: "/top-rated", icon: Star, color: "from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30" },
  { label: "AI Search", href: "/ai-search", icon: Sparkles, color: "from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/30" },
  { label: "Upcoming", href: "/upcoming", icon: Zap, color: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30" },
  { label: "Awards", href: "/awards", icon: Award, color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30" },
  { label: "Movies", href: "/movies", icon: Film, color: "from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30" },
  { label: "TV Shows", href: "/tv", icon: Tv, color: "from-indigo-500/20 to-sky-500/20 text-indigo-300 border-indigo-500/30" },
];

export default function MobileCategoryBar() {
  return (
    <div className="md:hidden w-full overflow-x-auto no-scrollbar py-2.5 px-4 scroll-smooth">
      <div className="flex items-center gap-2.5 w-max">
        {categoryPills.map((pill) => {
          const Icon = pill.icon;
          return (
            <Link
              key={pill.label}
              href={pill.href}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r ${pill.color} border backdrop-blur-md shadow-sm active:scale-95 transition-transform`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{pill.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

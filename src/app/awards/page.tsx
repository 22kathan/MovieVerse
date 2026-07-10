"use client";

import { useState } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import { Search, Calendar, Award, Star, SearchSlash } from "lucide-react";

const CEREMONIES = ["All", "Oscars", "Golden Globes", "Cannes", "BAFTA"];

const AWARD_CATEGORIES = [
  {
    id: 1,
    ceremony: "Oscars",
    year: "2026",
    category: "Best Picture",
    winner: "Oppenheimer",
    nominees: ["Anatomy of a Fall", "Barbie", "The Holdovers", "Past Lives", "Poor Things"],
    icon: "🏆",
    trivia: "Oppenheimer won a total of 7 Academy Awards, including Best Director for Christopher Nolan.",
  },
  {
    id: 2,
    ceremony: "Oscars",
    year: "2026",
    category: "Best Director",
    winner: "Christopher Nolan (Oppenheimer)",
    nominees: ["Justine Triet (Anatomy of a Fall)", "Martin Scorsese (Killers of the Flower Moon)", "Yorgos Lanthimos (Poor Things)", "Jonathan Glazer (The Zone of Interest)"],
    icon: "🎬",
    trivia: "This marked Christopher Nolan's first Academy Award win for Directing.",
  },
  {
    id: 3,
    ceremony: "Golden Globes",
    year: "2026",
    category: "Best Drama Series",
    winner: "Succession",
    nominees: ["The Crown", "The Last of Us", "1923", "The Diplomat"],
    icon: "🎭",
    trivia: "Succession completed its fourth and final season with major wins across acting and drama categories.",
  },
  {
    id: 4,
    ceremony: "Cannes",
    year: "2026",
    category: "Palme d'Or",
    winner: "Anatomy of a Fall",
    nominees: ["The Zone of Interest", "Monster", "Fallen Leaves", "La Chimera"],
    icon: "🌴",
    trivia: "Justine Triet became the third female director to win the prestigious Palme d'Or in Cannes history.",
  },
  {
    id: 5,
    ceremony: "BAFTA",
    year: "2026",
    category: "Best Film",
    winner: "Oppenheimer",
    nominees: ["Anatomy of a Fall", "The Holdovers", "Poor Things", "Killers of the Flower Moon"],
    icon: "🇬🇧",
    trivia: "Oppenheimer dominated the BAFTA awards matching its Oscar success with 7 wins overall.",
  },
];

export default function AwardsPage() {
  const [selectedCeremony, setSelectedCeremony] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredAwards = AWARD_CATEGORIES.filter((aw) => {
    const matchesCeremony = selectedCeremony === "All" || aw.ceremony === selectedCeremony;
    const matchesSearch =
      aw.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aw.winner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aw.nominees.some((n) => n.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCeremony && matchesSearch;
  });

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen pb-24" style={{ maxWidth: "var(--container-max)" }}>
      {/* Page Header */}
      <div>
        <SectionHeader
          title="🏆 Awards & Festivals"
          subtitle="Track winners, nominees, and historical trivia of major ceremonies across the entertainment industry"
        />
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pt-4 border-t border-[var(--border-primary)]/50">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CEREMONIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCeremony(c)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedCeremony === c
                  ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-[var(--shadow-glow-brand)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full md:w-80 flex items-center gap-2 bg-[var(--bg-surface)] rounded-xl px-4 py-2 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] focus-within:border-[var(--brand-primary)] transition-all">
          <Search className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
          <input
            type="text"
            placeholder="Search movie, actor, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Awards Listings */}
      {filteredAwards.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAwards.map((aw) => (
            <div
              key={aw.id}
              className="group flex flex-col justify-between p-6 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl shadow-sm hover:border-[var(--border-secondary)] transition-all duration-300 relative overflow-hidden"
            >
              {/* Decorative side accent */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[var(--brand-primary)] to-[var(--brand-secondary)]" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center text-xl shadow-inner">
                    {aw.icon}
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-medium bg-[var(--bg-tertiary)] border border-[var(--border-primary)]/50 px-2 py-1 rounded-lg">
                    <Calendar className="w-3 h-3 text-[var(--brand-primary-light)]" />
                    {aw.ceremony} • {aw.year}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-wider">
                    {aw.category}
                  </h4>
                  <h3 className="font-extrabold text-white text-base leading-snug group-hover:text-[var(--brand-primary-light)] transition-colors">
                    {aw.winner}
                  </h3>
                </div>

                {/* Best winner display */}
                <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-primary)]/50 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 fill-amber-500/20" />
                    Winner
                  </span>
                  <p className="text-sm font-bold text-white">{aw.winner}</p>
                </div>

                {/* Nominees Toggle details */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => toggleExpand(aw.id)}
                    className="w-full py-1.5 bg-[var(--bg-tertiary)]/40 hover:bg-[var(--bg-tertiary)] rounded-lg text-[10px] font-bold text-[var(--text-secondary)] hover:text-white transition-colors border border-[var(--border-primary)]/30 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{expandedId === aw.id ? "Hide Nominees" : "Show Nominees"}</span>
                  </button>

                  {expandedId === aw.id && (
                    <div className="p-3 bg-[var(--bg-tertiary)]/70 rounded-xl border border-[var(--border-primary)]/50 space-y-2 animate-fade-in">
                      <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-widest block border-b border-[var(--border-primary)]/30 pb-1">
                        Other Nominees:
                      </span>
                      <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                        {aw.nominees.map((nom, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] shrink-0" />
                            <span>{nom}</span>
                          </li>
                        ))}
                      </ul>
                      {aw.trivia && (
                        <div className="pt-2 mt-2 border-t border-[var(--border-primary)]/30 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500/20" /> Did You Know?
                          </span>
                          <p className="text-[11px] text-[var(--text-secondary)] italic leading-relaxed">
                            {aw.trivia}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl">
          <SearchSlash className="w-12 h-12 text-[var(--text-muted)]" />
          <h3 className="text-base font-bold text-white">No awards found</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm">
            Try adjusting your search query or switching categories to find other award nominees.
          </p>
        </div>
      )}
    </div>
  );
}

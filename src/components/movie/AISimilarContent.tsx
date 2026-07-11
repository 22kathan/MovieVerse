"use client";

import { useState, useEffect } from "react";
import { Sparkles, Brain, ArrowRight, Loader2 } from "lucide-react";

interface AISimilarityItem {
  title: string;
  theme: string;
  reason: string;
}

interface AISimilarityData {
  connections: AISimilarityItem[];
  summary: string;
}

interface AISimilarContentProps {
  movieId: number;
  movieTitle: string;
  genres: string[];
  similarMovies: string[];
}

export default function AISimilarContent({
  movieId,
  movieTitle,
  genres,
  similarMovies,
}: AISimilarContentProps) {
  const [data, setData] = useState<AISimilarityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieTitle || similarMovies.length === 0) return;

    let active = true;
    async function fetchInsights() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/similar-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieTitle,
            genres,
            similarMovies,
          }),
        });

        if (!res.ok) throw new Error("Failed to load insights");
        const json = await res.json();
        if (active) {
          setData(json);
        }
      } catch (err) {
        console.error("AI Similar Insights fetch error:", err);
        if (active) {
          setError("Failed to fetch similarity insights.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchInsights();
    return () => {
      active = false;
    };
  }, [movieId, movieTitle, similarMovies, genres]);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm space-y-4 animate-pulse">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[var(--brand-primary-light)] animate-pulse" />
          <div className="h-5 w-40 bg-[var(--bg-tertiary)] rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-[var(--bg-tertiary)] rounded-md" />
          <div className="h-4 w-5/6 bg-[var(--bg-tertiary)] rounded-md" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null; // Fallback silently
  }

  return (
    <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-surface)]/90 border border-purple-500/20 shadow-md space-y-5 group">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -z-10 group-hover:bg-purple-500/10 transition-colors duration-500" />
      
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] pb-3">
        <div className="flex items-center gap-2.5">
          <Brain className="w-5 h-5 text-purple-400" />
          <h4 className="font-extrabold text-white text-base" style={{ fontFamily: "var(--font-display)" }}>
            AI Similar Content Connections
          </h4>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-extrabold bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20 uppercase tracking-wider">
          <Sparkles className="w-2.5 h-2.5" /> AI Engine
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic border-l-2 border-purple-500/30 pl-3">
        &ldquo;{data.summary}&rdquo;
      </p>

      {/* Connection items list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {data.connections.slice(0, 4).map((conn, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-purple-500/30 hover:bg-[var(--bg-elevated)] transition-all flex flex-col justify-between space-y-2"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-white text-sm truncate">{conn.title}</span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                  {conn.theme}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {conn.reason}
              </p>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] font-bold text-purple-400/80 group-hover:text-purple-400 pt-1">
              <span>Why they connect</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

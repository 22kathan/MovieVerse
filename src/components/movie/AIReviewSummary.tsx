"use client";

import { useState, useEffect } from "react";
import { Sparkles, Smile, Frown, Meh, Loader2 } from "lucide-react";

interface AIReviewSummaryProps {
  movieId: number;
}

interface SummaryData {
  summary: string;
  sentiment: "positive" | "mixed" | "negative";
  keyThemes: string[];
  basedOn: number;
}

export default function AIReviewSummary({ movieId }: AIReviewSummaryProps) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/review-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId: movieId }),
      });

      if (!res.ok) {
        throw new Error("Failed to load review summary");
      }

      const summaryData = await res.json();
      if (summaryData.basedOn === 0) {
        setData(null);
      } else {
        setData(summaryData);
      }
    } catch (err: any) {
      console.error(err);
      setError("Unable to generate AI summary at this time.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [movieId]);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm space-y-4 animate-pulse">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--brand-primary-light)] animate-spin" />
          <div className="h-5 w-32 bg-[var(--bg-tertiary)] rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-[var(--bg-tertiary)] rounded-md" />
          <div className="h-4 w-5/6 bg-[var(--bg-tertiary)] rounded-md" />
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Fail silently or display simple fallback if preferred
  }

  if (!data || data.basedOn === 0) {
    return null; // Don't show if no reviews exist to summarize
  }

  const sentimentConfigs = {
    positive: {
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: Smile,
      label: "Positive Audience Sentiment",
    },
    mixed: {
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: Meh,
      label: "Mixed Audience Sentiment",
    },
    negative: {
      color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      icon: Frown,
      label: "Negative Audience Sentiment",
    },
  };

  const sentiment = data.sentiment || "mixed";
  const config = sentimentConfigs[sentiment];
  const SentimentIcon = config.icon;

  return (
    <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-surface)]/90 border border-[var(--brand-primary)]/20 shadow-md space-y-4 group">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-primary)]/5 rounded-full blur-3xl -z-10 group-hover:bg-[var(--brand-primary)]/10 transition-colors duration-500" />
      
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--brand-primary-light)]" />
          <h4 className="font-extrabold text-white text-base" style={{ fontFamily: "var(--font-display)" }}>
            AI Review Consensus
          </h4>
        </div>

        {/* Sentiment Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${config.color}`}>
          <SentimentIcon className="w-3.5 h-3.5" />
          <span>{config.label}</span>
        </div>
      </div>

      {/* Summary Text */}
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {data.summary}
      </p>

      {/* Key Themes & Info Footer */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
        {/* Themes list */}
        <div className="flex flex-wrap gap-2">
          {data.keyThemes.map((theme, idx) => (
            <span
              key={idx}
              className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)]"
            >
              🔑 {theme}
            </span>
          ))}
        </div>

        {/* Based on reviews count */}
        <span className="text-[10px] font-medium text-[var(--text-muted)]">
          Based on {data.basedOn} audience {data.basedOn === 1 ? "review" : "reviews"}
        </span>
      </div>
    </div>
  );
}

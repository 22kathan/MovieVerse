"use client";

import { useState, useRef, useEffect } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import MovieCard from "@/components/movie/MovieCard";
import { useToast } from "@/components/shared/Toast";
import {
  Sparkles, Search, Loader2, Calendar, Star, Tag, Sliders,
  Lock, Clock, ArrowRight, Trash2, Globe, Film, Tv, RotateCcw,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { parseSearchQuery } from "@/lib/ai";
import { discoverMovies, discoverTVShows, searchMovies, searchTVShows } from "@/lib/tmdb";

// ============================================
// MovieVerse — AI Search Assistant (Phase 4 Rebuild)
// Conversational UI, streaming animation, query history,
// parsed filter chips, and industry toggle
// ============================================

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
}

interface ParsedFilters {
  searchQuery?: string;
  mediaType: "movie" | "tv" | "all";
  year?: number;
  genreName?: string;
  genreId?: number;
  minRating?: number;
  sortBy?: string;
  industry?: "bollywood" | "hollywood" | "both";
}

export default function AISearchPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [parsedFilters, setParsedFilters] = useState<ParsedFilters | null>(null);
  const [searched, setSearched] = useState(false);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const isPremium = session?.user && ((session.user as any).isPremium || (session.user as any).role === "ADMIN");

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("movieverse_ai_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Streaming "thinking" phases
  const thinkingPhases = [
    "Parsing your natural language query...",
    "Identifying genres, years, and ratings...",
    "Searching TMDB with AI-optimized filters...",
    "Ranking and deduplicating results...",
    "Preparing your personalized results...",
  ];

  const isStaticDeployment = () => {
    if (typeof window === "undefined") return false;
    return (
      window.location.hostname.includes("github.io") ||
      window.location.port === "8000" ||
      process.env.NEXT_PUBLIC_STATIC_EXPORT === "true"
    );
  };

  const handleSearch = async (searchQueryInput?: string) => {
    const q = (searchQueryInput || query).trim();
    if (!q) return;

    if (!isPremium) {
      const currentCount = parseInt(localStorage.getItem("movieverse_ai_searches") || "0");
      if (currentCount >= 5) {
        setShowUpgradeBanner(true);
        return;
      }
      localStorage.setItem("movieverse_ai_searches", (currentCount + 1).toString());
    }

    setLoading(true);
    setSearched(true);
    setResults([]);
    setParsedFilters(null);
    setQuery(q);

    // Start thinking animation
    let phaseIdx = 0;
    setThinkingPhase(thinkingPhases[0]);
    const phaseInterval = setInterval(() => {
      phaseIdx = Math.min(phaseIdx + 1, thinkingPhases.length - 1);
      setThinkingPhase(thinkingPhases[phaseIdx]);
    }, 800);

    try {
      if (isStaticDeployment()) {
        // Run AI query parsing client-side
        const parsed = await parseSearchQuery(q);

        // Apply robust searchQuery cleaning (identical to backend)
        if (parsed.searchQuery) {
          const words = parsed.searchQuery.toLowerCase().split(/[\s\-_,./]+/);
          const fillers = new Set([
            'top', 'best', 'latest', 'recent', 'newest', 'highly', 'good', 'great', 'popular', 'trending',
            'rated', 'scores', 'score', 'movie', 'movies', 'show', 'shows', 'tv', 'series', 'film', 'films',
            'recommend', 'recommendations', 'suggest', 'suggestions', 'find', 'search', 'lookup', 'please',
            'me', 'want', 'watch', 'of', 'from', 'in', 'at', 'with', 'and', 'or', 'the', 'a', 'an', 'to', 'for',
            'about', 'starred', 'starring', 'directed', 'by', 'director', 'actor', 'actress', 'cast', 'list',
            'like', 'similar'
          ]);

          const genres = new Set([
            'action', 'adventure', 'animation', 'comedy', 'crime', 'documentary', 'drama', 'family', 'fantasy',
            'history', 'horror', 'music', 'mystery', 'romance', 'sci-fi', 'scifi', 'science', 'fiction',
            'thriller', 'war', 'western'
          ]);

          const cleanedWords = words.filter(word => {
            if (!word) return false;
            if (fillers.has(word)) return false;
            if (genres.has(word)) return false;
            if (parsed.year && word === String(parsed.year)) return false;
            if (parsed.genreName && word === parsed.genreName.toLowerCase()) return false;
            if (/^\d+(\.\d+)?$/.test(word)) return false;
            return true;
          });

          if (cleanedWords.length === 0) {
            parsed.searchQuery = undefined;
          } else {
            const cleanedStr = cleanedWords.join(' ').trim();
            parsed.searchQuery = cleanedStr.length > 1 ? cleanedStr : undefined;
          }
        }

        // Execute TMDB client calls directly
        const mediaType = parsed.mediaType || 'all';
        const industry = parsed.industry || 'both';
        const indianLanguages = ['hi', 'te', 'ta', 'ml', 'kn', 'bn', 'pa', 'mr', 'gu', 'or', 'as'];

        let resultsList: any[] = [];

        const runDiscoverClient = async (params: any) => {
          let discoverResults: any[] = [];
          if (mediaType === 'tv') {
            const response = await discoverTVShows(params);
            discoverResults = (response?.results || []).map((item: any) => ({ ...item, media_type: 'tv' }));
          } else if (mediaType === 'movie') {
            const response = await discoverMovies(params);
            discoverResults = (response?.results || []).map((item: any) => ({ ...item, media_type: 'movie' }));
          } else {
            const [movieRes, tvRes] = await Promise.all([
              discoverMovies(params),
              discoverTVShows(params),
            ]);
            const movieItems = (movieRes?.results || []).map((item: any) => ({ ...item, media_type: 'movie' }));
            const tvItems = (tvRes?.results || []).map((item: any) => ({ ...item, media_type: 'tv' }));
            
            const combined: any[] = [];
            const maxLen = Math.max(movieItems.length, tvItems.length);
            for (let i = 0; i < maxLen; i++) {
              if (movieItems[i]) combined.push(movieItems[i]);
              if (tvItems[i]) combined.push(tvItems[i]);
            }
            discoverResults = combined;
          }
          return discoverResults;
        };

        if (parsed.searchQuery) {
          let combinedResults: any[] = [];
          if (mediaType === 'tv') {
            const response = await searchTVShows(parsed.searchQuery);
            combinedResults = response?.results || [];
          } else if (mediaType === 'movie') {
            const response = await searchMovies(parsed.searchQuery);
            combinedResults = response?.results || [];
          } else {
            const [movieRes, tvRes] = await Promise.all([
              searchMovies(parsed.searchQuery),
              searchTVShows(parsed.searchQuery),
            ]);
            const movieItems = (movieRes?.results || []).map((item: any) => ({ ...item, media_type: 'movie' }));
            const tvItems = (tvRes?.results || []).map((item: any) => ({ ...item, media_type: 'tv' }));
            
            const maxLen = Math.max(movieItems.length, tvItems.length);
            for (let i = 0; i < maxLen; i++) {
              if (movieItems[i]) combinedResults.push(movieItems[i]);
              if (tvItems[i]) combinedResults.push(tvItems[i]);
            }
          }

          resultsList = combinedResults;
          if (parsed.genreId || parsed.year || parsed.minRating || industry !== 'both') {
            resultsList = combinedResults.filter((item: any) => {
              if (industry === 'bollywood') {
                if (!indianLanguages.includes(item.original_language)) return false;
              } else if (industry === 'hollywood') {
                if (item.original_language !== 'en') return false;
              }
              if (parsed.genreId) {
                const genres = item.genre_ids || [];
                if (!genres.includes(parsed.genreId)) return false;
              }
              if (parsed.year) {
                const dateStr = item.release_date || item.first_air_date || '';
                const itemYear = dateStr ? new Date(dateStr).getFullYear() : null;
                if (itemYear !== parsed.year) return false;
              }
              if (parsed.minRating) {
                const rating = item.vote_average || 0;
                if (rating < parsed.minRating) return false;
              }
              return true;
            });
          }
        } else {
          const discoverParams: any = {
            page: 1,
            sortBy: parsed.sortBy || 'popularity.desc',
          };
          if (parsed.genreId) {
            discoverParams.withGenres = String(parsed.genreId);
          }
          if (parsed.year) {
            discoverParams.primaryReleaseDateGte = `${parsed.year}-01-01`;
            discoverParams.primaryReleaseDateLte = `${parsed.year}-12-31`;
          }
          if (parsed.minRating) {
            discoverParams.voteAverageGte = parsed.minRating;
          }

          if (industry === 'bollywood') {
            resultsList = await runDiscoverClient({ ...discoverParams, withOriginalLanguage: 'hi|te|ta|ml|kn|bn' });
          } else if (industry === 'hollywood') {
            resultsList = await runDiscoverClient({ ...discoverParams, withOriginalLanguage: 'en' });
          } else {
            const [bollyRes, hollyRes] = await Promise.all([
              runDiscoverClient({ ...discoverParams, withOriginalLanguage: 'hi|te|ta|ml|kn|bn' }),
              runDiscoverClient({ ...discoverParams, withOriginalLanguage: 'en' }),
            ]);
            const interleaved: any[] = [];
            const maxLen = Math.max(bollyRes.length, hollyRes.length);
            for (let i = 0; i < maxLen; i++) {
              if (bollyRes[i]) interleaved.push(bollyRes[i]);
              if (hollyRes[i]) interleaved.push(hollyRes[i]);
            }
            resultsList = interleaved;
          }

          // Apply in-memory filtering to discover results to ensure they match parsed filters (important for mock fallback database)
          if (parsed.genreId || parsed.year || parsed.minRating) {
            resultsList = resultsList.filter((item: any) => {
              if (parsed.genreId) {
                const genres = item.genre_ids || [];
                if (!genres.includes(parsed.genreId)) return false;
              }
              if (parsed.year) {
                const dateStr = item.release_date || item.first_air_date || '';
                const itemYear = dateStr ? new Date(dateStr).getFullYear() : null;
                if (itemYear !== parsed.year) return false;
              }
              if (parsed.minRating) {
                const rating = item.vote_average || 0;
                if (rating < parsed.minRating) return false;
              }
              return true;
            });
          }
        }

        const normalized = resultsList.map((item: any) => ({
          id: item.id,
          title: item.title || item.name || 'Untitled',
          poster_path: item.poster_path || null,
          backdrop_path: item.backdrop_path || null,
          vote_average: item.vote_average || 0,
          release_date: item.release_date || item.first_air_date || '',
          genre_ids: item.genre_ids || [],
          overview: item.overview || '',
          media_type: mediaType === 'all' ? (item.title ? 'movie' : 'tv') : mediaType,
        }));

        const seen = new Set<string>();
        const deduplicated = normalized.filter((item: any) => {
          const key = `${item.mediaType || item.media_type}-${item.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        clearInterval(phaseInterval);
        const finalResults = deduplicated.slice(0, 18);
        setResults(finalResults);
        setParsedFilters(parsed as any);

        const newItem: SearchHistoryItem = {
          query: q,
          timestamp: Date.now(),
          resultCount: finalResults.length,
        };
        const updated = [newItem, ...searchHistory.filter((h) => h.query !== q)].slice(0, 10);
        setSearchHistory(updated);
        localStorage.setItem("movieverse_ai_history", JSON.stringify(updated));

        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        setLoading(false);
        setThinkingPhase("");
        return;
      }

      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      clearInterval(phaseInterval);

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setParsedFilters(data.parsed || null);

        // Save to history
        const newItem: SearchHistoryItem = {
          query: q,
          timestamp: Date.now(),
          resultCount: (data.results || []).length,
        };
        const updated = [newItem, ...searchHistory.filter((h) => h.query !== q)].slice(0, 10);
        setSearchHistory(updated);
        localStorage.setItem("movieverse_ai_history", JSON.stringify(updated));

        // Scroll to results
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      } else {
        showToast({ type: "error", title: "Search Failed", message: "Could not process your AI search query." });
      }
    } catch (error) {
      clearInterval(phaseInterval);
      console.error(error);
      showToast({ type: "error", title: "Network Error", message: "Please check your connection and try again." });
    } finally {
      setLoading(false);
      setThinkingPhase("");
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("movieverse_ai_history");
    showToast({ type: "info", title: "History Cleared", message: "Your AI search history has been removed." });
  };

  const sampleQueries = [
    { text: "Top rated sci-fi movies from 2014", emoji: "🚀" },
    { text: "Best Bollywood comedy series rated above 8", emoji: "🎭" },
    { text: "Christopher Nolan action films", emoji: "🎬" },
    { text: "Highly rated horror movies from 2020", emoji: "👻" },
    { text: "Latest Korean thriller TV shows", emoji: "🔪" },
    { text: "Animated family movies with rating above 7", emoji: "🎨" },
  ];

  const mediaTypeIcons = {
    movie: <Film className="w-3.5 h-3.5" />,
    tv: <Tv className="w-3.5 h-3.5" />,
    all: <Globe className="w-3.5 h-3.5" />,
  };

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      {/* Page Header */}
      <div>
        <SectionHeader
          title="✨ AI Search Assistant"
          subtitle="Describe what you're in the mood for — our AI parses your intent and finds the perfect match."
        />
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        className="max-w-2xl mx-auto space-y-5"
      >
        <div className={`flex items-center gap-3 bg-[var(--bg-surface)] border rounded-2xl px-5 py-4 transition-all duration-300 ${
          loading ? "border-[var(--brand-primary)] animate-pulse-glow" : "border-[var(--brand-primary)]/30 hover:border-[var(--brand-primary)]/70 focus-within:border-[var(--brand-primary)]"
        }`}>
          <Sparkles className="w-5 h-5 text-[var(--brand-primary-light)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={showUpgradeBanner ? "Limit reached — Upgrade to VIP for unlimited searches" : "Try: 'highly rated sci-fi movies from 2014' or 'action series'"}
            value={query}
            disabled={showUpgradeBanner}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || showUpgradeBanner || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Search</span>
          </button>
        </div>

        {/* Suggestion Tags */}
        {!searched && !showUpgradeBanner && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 justify-center text-xs">
              <span className="text-[var(--text-muted)] font-medium">Try:</span>
              {sampleQueries.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setQuery(sample.text); handleSearch(sample.text); }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--brand-primary)]/40 transition-all duration-200 cursor-pointer flex items-center gap-1.5 hover:scale-[1.02]"
                >
                  <span>{sample.emoji}</span>
                  <span>{sample.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Search History */}
      {!searched && !showUpgradeBanner && searchHistory.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Recent Searches
            </h4>
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item, idx) => (
              <button
                key={idx}
                onClick={() => { setQuery(item.query); handleSearch(item.query); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[var(--brand-primary)]/30 transition-all cursor-pointer group text-left"
              >
                <RotateCcw className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--brand-primary-light)]" />
                <span className="text-xs text-[var(--text-secondary)] group-hover:text-white truncate max-w-[200px]">{item.query}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">{item.resultCount}↗</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Banner */}
      {showUpgradeBanner && (
        <div className="max-w-2xl mx-auto backdrop-blur-md bg-amber-500/10 border border-amber-500/30 rounded-2xl p-8 text-center space-y-5 shadow-[0_0_40px_rgba(245,158,11,0.08)]">
          <div className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white">Daily AI Search Limit Reached</h3>
            <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
              Free accounts get 5 AI searches per day. Upgrade to MovieVerse VIP for <strong className="text-amber-400">unlimited</strong> AI-powered searches, ad-free browsing, and exclusive features.
            </p>
          </div>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 py-3 px-8 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 transition-all duration-300 hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" /> Upgrade to VIP
          </Link>
        </div>
      )}

      {/* Streaming Thinking Animation */}
      {loading && thinkingPhase && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--brand-primary)]/20 animate-pulse-glow">
            <div className="relative w-8 h-8 shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] animate-spin" style={{ animationDuration: "3s" }} />
              <div className="absolute inset-[3px] rounded-full bg-[var(--bg-surface)] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary-light)]" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-[var(--brand-primary-light)] uppercase tracking-wider">AI Thinking</p>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5 transition-all duration-300">{thinkingPhase}</p>
            </div>
          </div>
        </div>
      )}

      {/* Parsed Filters Display */}
      {parsedFilters && !loading && (
        <div className="max-w-2xl mx-auto p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--brand-primary-light)] uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>AI-Parsed Filters</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {parsedFilters.mediaType && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] font-medium">
                {mediaTypeIcons[parsedFilters.mediaType]}
                Type: <strong className="text-white capitalize">{parsedFilters.mediaType}</strong>
              </span>
            )}
            {parsedFilters.genreName && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] font-medium">
                <Tag className="w-3.5 h-3.5" /> Genre: <strong className="text-white">{parsedFilters.genreName}</strong>
              </span>
            )}
            {parsedFilters.year && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] font-medium">
                <Calendar className="w-3.5 h-3.5" /> Year: <strong className="text-white">{parsedFilters.year}</strong>
              </span>
            )}
            {parsedFilters.minRating && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] font-medium">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> Rating: <strong className="text-white">≥{parsedFilters.minRating}</strong>
              </span>
            )}
            {parsedFilters.industry && parsedFilters.industry !== "both" && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] font-medium">
                <Globe className="w-3.5 h-3.5" /> Industry: <strong className="text-white capitalize">{parsedFilters.industry}</strong>
              </span>
            )}
            {parsedFilters.searchQuery && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] font-medium">
                <Search className="w-3.5 h-3.5" /> Keywords: <strong className="text-white">&quot;{parsedFilters.searchQuery}&quot;</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searched && !showUpgradeBanner && (
        <div ref={resultsRef} className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-primary-light)]" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Results</span>
                  <span className="text-sm font-mono text-[var(--text-secondary)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-lg border border-[var(--border-primary)]">{results.length}</span>
                </>
              )}
            </h3>
            {!loading && results.length > 0 && (
              <button
                onClick={() => { setSearched(false); setResults([]); setParsedFilters(null); setQuery(""); inputRef.current?.focus(); }}
                className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> New Search
              </button>
            )}
          </div>

          {!loading && results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {results.map((item: any, idx: number) => (
                <div key={`${item.media_type}-${item.id}`} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                  <MovieCard movie={item} index={idx} />
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <span className="text-6xl">🔭</span>
              <h4 className="text-xl font-extrabold text-white">No Results Found</h4>
              <p className="text-sm text-[var(--text-muted)] max-w-md leading-relaxed">
                Try broader terms like genre names (action, sci-fi), or different phrasing. The AI works best with descriptive queries.
              </p>
              <button
                onClick={() => { setSearched(false); setQuery(""); inputRef.current?.focus(); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" /> Try Another Search
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

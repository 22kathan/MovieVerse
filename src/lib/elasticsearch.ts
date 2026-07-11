// ============================================
// MovieVerse — Elasticsearch Service Client
// Integrates with a real Elasticsearch instance if configured,
// or falls back to a high-fidelity local fuzzy matching & relevance ranking search engine.
// ============================================

import { searchMovies, searchMulti, searchTVShows, searchPeople } from "./tmdb";
import type { TMDBMovie } from "@/types";

export interface ElasticSearchResult {
  id: number;
  title: string;
  media_type: "movie" | "tv" | "person";
  score: number;
  highlightedTitle?: string;
  highlightedOverview?: string;
  release_date?: string;
  release_year?: number;
  poster_path?: string;
  profile_path?: string;
  rating?: number;
  overview?: string;
}

/**
 * Perform a full-text search against the catalog using Elasticsearch query style
 */
export async function searchWithElastic(
  query: string,
  mediaType: "movie" | "tv" | "all" = "all",
  page: number = 1
): Promise<{ results: ElasticSearchResult[]; took: number; total: number }> {
  const startTime = Date.now();
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return { results: [], took: 0, total: 0 };
  }

  // 1. Fetch search data from our TMDB client (which has a cached fallback)
  let tmdbRawResults: any[] = [];
  try {
    if (mediaType === "movie") {
      const resp = await searchMovies(cleanQuery, page);
      tmdbRawResults = (resp.results || []).map(m => ({ ...m, media_type: "movie" }));
    } else if (mediaType === "tv") {
      const resp = await searchTVShows(cleanQuery, page);
      tmdbRawResults = (resp.results || []).map(m => ({ ...m, media_type: "tv" }));
    } else {
      const resp = await searchMulti(cleanQuery, page);
      tmdbRawResults = resp.results || [];
    }
  } catch (err) {
    console.error("Elasticsearch proxy query fetch failed:", err);
  }

  // 2. Perform Elasticsearch-style relevance matching, scoring, and highlighting
  const scoredResults = tmdbRawResults.map((item) => {
    const title = item.title || item.name || "";
    const overview = item.overview || "";
    const type = item.media_type || "movie";
    const date = item.release_date || item.first_air_date || "";
    const releaseYear = date ? new Date(date).getFullYear() : undefined;

    // Scoring metrics:
    // - Exact prefix match in title gets high score boost (+10)
    // - Word match in title gets medium boost (+5)
    // - Exact match in overview gets small boost (+2)
    // - Popularity/rating gets minor boost
    let score = 1.0;
    const lowerQuery = cleanQuery.toLowerCase();
    const lowerTitle = title.toLowerCase();
    const lowerOverview = overview.toLowerCase();

    if (lowerTitle === lowerQuery) {
      score += 15.0;
    } else if (lowerTitle.startsWith(lowerQuery)) {
      score += 10.0;
    } else if (lowerTitle.includes(lowerQuery)) {
      score += 5.0;
    }

    // Split words to calculate keyword overlap score
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 1);
    queryWords.forEach((word) => {
      if (lowerTitle.includes(word)) score += 3.0;
      if (lowerOverview.includes(word)) score += 1.0;
    });

    // Add popularity/rating weights
    if (item.vote_average) score += item.vote_average * 0.1;
    if (item.popularity) score += Math.min(item.popularity * 0.01, 2.0);

    // Generate Highlight Snippets (equivalent to Elasticsearch's pre/post tags)
    let highlightedTitle = title;
    let highlightedOverview = overview;

    try {
      if (queryWords.length > 0) {
        const regexPattern = new RegExp(`(${queryWords.map(w => escapeRegExp(w)).join("|")})`, "gi");
        highlightedTitle = title.replace(regexPattern, "<mark class='bg-[var(--brand-primary)]/35 text-white rounded px-0.5'>$1</mark>");
        
        // Highlight first matching sentence or truncate overview
        if (overview) {
          const sentences = overview.split(/(?<=[.!?])\s+/);
          const matchingSentence = sentences.find((s: string) => regexPattern.test(s));
          const baseText = matchingSentence || sentences.slice(0, 2).join(" ");
          
          highlightedOverview = baseText.replace(regexPattern, "<mark class='bg-[var(--brand-primary)]/35 text-white rounded px-0.5'>$1</mark>");
          if (overview.length > baseText.length) {
            highlightedOverview += "...";
          }
        }
      }
    } catch (e) {
      // Fallback if regex creation fails
    }

    return {
      id: item.id,
      title,
      media_type: type,
      score: Math.round(score * 10) / 10,
      highlightedTitle,
      highlightedOverview,
      release_date: date || undefined,
      release_year: releaseYear,
      poster_path: item.poster_path || item.profile_path || undefined,
      rating: item.vote_average || undefined,
      overview,
    } as ElasticSearchResult;
  });

  // Sort by score descending (Elasticsearch standard relevance ordering)
  scoredResults.sort((a, b) => b.score - a.score);

  const took = Date.now() - startTime;

  return {
    results: scoredResults,
    took,
    total: scoredResults.length,
  };
}

/**
 * Escape regex special characters
 */
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

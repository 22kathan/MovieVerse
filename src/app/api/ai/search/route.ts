// ============================================
// MovieVerse — AI Search API
// POST /api/ai/search
// ============================================

import { NextResponse } from 'next/server';
import { parseSearchQuery } from '@/lib/ai';
import { discoverMovies, discoverTVShows, searchMovies, searchTVShows } from '@/lib/tmdb';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1. Parse natural language search query using AI helper
    const parsed = await parseSearchQuery(query);

    // Clean parsed searchQuery to route structured queries (e.g. sci-fi, year) to discovery
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

    let results: any[] = [];
    let totalResults = 0;

    // Helper function to run discover queries
    async function runDiscover(params: any) {
      let discoverResults: any[] = [];
      let discoverTotal = 0;
      if (mediaType === 'tv') {
        const response = await discoverTVShows(params);
        discoverResults = (response?.results || []).map((item: any) => ({ ...item, media_type: 'tv' }));
        discoverTotal = response?.total_results || 0;
      } else if (mediaType === 'movie') {
        const response = await discoverMovies(params);
        discoverResults = (response?.results || []).map((item: any) => ({ ...item, media_type: 'movie' }));
        discoverTotal = response?.total_results || 0;
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
        discoverTotal = (movieRes?.total_results || 0) + (tvRes?.total_results || 0);
      }
      return { results: discoverResults, totalResults: discoverTotal };
    }

    // 2. Execute appropriate TMDB calls based on parsed parameters
    const mediaType = parsed.mediaType || 'all';
    const industry = parsed.industry || 'both';
    const indianLanguages = ['hi', 'te', 'ta', 'ml', 'kn', 'bn', 'pa', 'mr', 'gu', 'or', 'as'];

    if (parsed.searchQuery) {
      // If we have search keywords, prioritize the TMDB Search API and filter results in-memory
      let combinedResults: any[] = [];
      if (mediaType === 'tv') {
        const response = await searchTVShows(parsed.searchQuery);
        combinedResults = response?.results || [];
      } else if (mediaType === 'movie') {
        const response = await searchMovies(parsed.searchQuery);
        combinedResults = response?.results || [];
      } else {
        // Search both movies and TV shows and interleave them
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

      // Filter in-memory if additional structured parameters or industry filters were parsed
      results = combinedResults;
      if (parsed.genreId || parsed.year || parsed.minRating || industry !== 'both') {
        results = combinedResults.filter((item: any) => {
          // Industry filter
          if (industry === 'bollywood') {
            if (!indianLanguages.includes(item.original_language)) return false;
          } else if (industry === 'hollywood') {
            if (item.original_language !== 'en') return false;
          }

          // Genre filter
          if (parsed.genreId) {
            const genres = item.genre_ids || [];
            if (!genres.includes(parsed.genreId)) return false;
          }
          // Year filter
          if (parsed.year) {
            const dateStr = item.release_date || item.first_air_date || '';
            const itemYear = dateStr ? new Date(dateStr).getFullYear() : null;
            if (itemYear !== parsed.year) return false;
          }
          // Rating filter
          if (parsed.minRating) {
            const rating = item.vote_average || 0;
            if (rating < parsed.minRating) return false;
          }
          return true;
        });
      }
      totalResults = results.length;
    } else {
      // We only have structured filters (genre, year, minRating, etc.) — run TMDB discover
      const discoverParams: any = {
        page: 1,
        sortBy: parsed.sortBy || 'popularity.desc',
      };

      if (parsed.genreId) {
        discoverParams.withGenres = String(parsed.genreId);
      }

      if (parsed.year) {
        // Build year bounds or specific release year
        discoverParams.primaryReleaseDateGte = `${parsed.year}-01-01`;
        discoverParams.primaryReleaseDateLte = `${parsed.year}-12-31`;
      }

      if (parsed.minRating) {
        discoverParams.voteAverageGte = parsed.minRating;
      }

      if (industry === 'bollywood') {
        const discoverRes = await runDiscover({ ...discoverParams, withOriginalLanguage: 'hi|te|ta|ml|kn|bn' });
        results = discoverRes.results;
        totalResults = discoverRes.totalResults;
      } else if (industry === 'hollywood') {
        const discoverRes = await runDiscover({ ...discoverParams, withOriginalLanguage: 'en' });
        results = discoverRes.results;
        totalResults = discoverRes.totalResults;
      } else {
        // For 'both', discover both industries and interleave results to ensure balanced recommendations
        const [bollyRes, hollyRes] = await Promise.all([
          runDiscover({ ...discoverParams, withOriginalLanguage: 'hi|te|ta|ml|kn|bn' }),
          runDiscover({ ...discoverParams, withOriginalLanguage: 'en' }),
        ]);

        const interleaved: any[] = [];
        const maxLen = Math.max(bollyRes.results.length, hollyRes.results.length);
        for (let i = 0; i < maxLen; i++) {
          if (bollyRes.results[i]) interleaved.push(bollyRes.results[i]);
          if (hollyRes.results[i]) interleaved.push(hollyRes.results[i]);
        }
        results = interleaved;
        totalResults = bollyRes.totalResults + hollyRes.totalResults;
      }

      // Apply in-memory filtering to discover results to ensure they match parsed filters (important for mock fallback database)
      if (parsed.genreId || parsed.year || parsed.minRating) {
        results = results.filter((item: any) => {
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
        totalResults = results.length;
      }
    }

    // Normalize result cards to fit the standard MovieCard interface
    const normalized = results.map((item: any) => ({
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

    // Deduplicate normalized results to prevent duplicate items (e.g. from mock database fallback)
    const seen = new Set<string>();
    const deduplicated = normalized.filter((item: any) => {
      const key = `${item.mediaType || item.media_type}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      query,
      parsed,
      results: deduplicated.slice(0, 18),
      totalResults: Math.min(totalResults, deduplicated.length || totalResults),
    });
  } catch (error) {
    console.error('AI Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI search query' },
      { status: 500 }
    );
  }
}

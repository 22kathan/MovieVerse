// ============================================
// MovieVerse — TMDB API Client
// Handles all communication with The Movie Database API
// ============================================

if (typeof window === "undefined") {
  try {
    const dns = require("node:dns");
    if (dns && typeof dns.setDefaultResultOrder === "function") {
      dns.setDefaultResultOrder("ipv4first");
    }
  } catch {
    // fallback for runtimes without setDefaultResultOrder
  }
}

import type {
  TMDBMovie,
  TMDBCredits,
  TMDBPerson,
  TMDBVideo,
  TMDBResponse,
} from '@/types';

// ============================================
// CONFIGURATION
// ============================================

const TMDB_BASE_URL = 'https://api.tmdb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/** TMDB image size presets */
export const IMAGE_SIZES = {
  poster: {
    sm: `${TMDB_IMAGE_BASE}/w185`,
    md: `${TMDB_IMAGE_BASE}/w342`,
    lg: `${TMDB_IMAGE_BASE}/w500`,
    xl: `${TMDB_IMAGE_BASE}/w780`,
    original: `${TMDB_IMAGE_BASE}/original`,
  },
  backdrop: {
    sm: `${TMDB_IMAGE_BASE}/w300`,
    md: `${TMDB_IMAGE_BASE}/w780`,
    lg: `${TMDB_IMAGE_BASE}/w1280`,
    original: `${TMDB_IMAGE_BASE}/original`,
  },
  profile: {
    sm: `${TMDB_IMAGE_BASE}/w45`,
    md: `${TMDB_IMAGE_BASE}/w185`,
    lg: `${TMDB_IMAGE_BASE}/h632`,
    original: `${TMDB_IMAGE_BASE}/original`,
  },
  logo: {
    sm: `${TMDB_IMAGE_BASE}/w45`,
    md: `${TMDB_IMAGE_BASE}/w154`,
    lg: `${TMDB_IMAGE_BASE}/w500`,
    original: `${TMDB_IMAGE_BASE}/original`,
  },
} as const;

// ============================================
// API CLIENT & MEMORY CACHES FOR OFFLINE FALLBACKS
// ============================================

declare global {
  var tmdbMovieCache: Map<number, any> | undefined;
  var tmdbTVCache: Map<number, any> | undefined;
}

const movieCache = global.tmdbMovieCache || new Map<number, any>();
const tvCache = global.tmdbTVCache || new Map<number, any>();

if (process.env.NODE_ENV !== 'production') {
  global.tmdbMovieCache = movieCache;
  global.tmdbTVCache = tvCache;
}

const TMDB_TO_MOCK_MOVIE_MAP: Record<number, number> = {
  1084244: 113, // Toy Story 5
  1132644: 114, // The Batman: Part II
  1115623: 115, // Avatar: Fire and Ash
  822119: 101,  // Project Hail Mary
  1022789: 111, // Spider-Man: Beyond the Spider-Verse
  1003596: 112, // Avengers: Secret Wars
};

function getGenreName(id: number, isTv: boolean): string {
  const genres = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Sci-Fi" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
    { id: 10759, name: "Action & Adventure" },
    { id: 10762, name: "Kids" },
    { id: 10763, name: "News" },
    { id: 10764, name: "Reality" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 10766, name: "Soap" },
    { id: 10767, name: "Talk" },
    { id: 10768, name: "War & Politics" }
  ];
  return genres.find(g => g.id === id)?.name || "Drama";
}

function cacheTMDBData(endpoint: string, data: any) {
  if (!data) return;
  const cleanEndpoint = endpoint.split('?')[0];

  const addMovie = (m: any) => {
    if (m && m.id) {
      movieCache.set(m.id, {
        id: m.id,
        title: m.title || m.original_title,
        overview: m.overview,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        vote_average: m.vote_average,
        vote_count: m.vote_count,
        release_date: m.release_date,
        genres: m.genres || m.genre_ids?.map((id: number) => ({ id, name: getGenreName(id, false) })),
        runtime: m.runtime,
        tagline: m.tagline,
        budget: m.budget,
        revenue: m.revenue,
      });
    }
  };

  const addTV = (t: any) => {
    if (t && t.id) {
      tvCache.set(t.id, {
        id: t.id,
        name: t.name || t.original_name,
        overview: t.overview,
        poster_path: t.poster_path,
        backdrop_path: t.backdrop_path,
        vote_average: t.vote_average,
        vote_count: t.vote_count,
        first_air_date: t.first_air_date,
        genres: t.genres || t.genre_ids?.map((id: number) => ({ id, name: getGenreName(id, true) })),
        episode_run_time: t.episode_run_time,
        number_of_seasons: t.number_of_seasons,
        number_of_episodes: t.number_of_episodes,
        tagline: t.tagline,
      });
    }
  };

  if (data.results && Array.isArray(data.results)) {
    const isTvEndpoint = cleanEndpoint.includes('/tv/') || cleanEndpoint.endsWith('/tv');
    const isMovieEndpoint = cleanEndpoint.includes('/movie/') || cleanEndpoint.endsWith('/movie');
    
    data.results.forEach((item: any) => {
      if (item.media_type === 'tv') {
        addTV(item);
      } else if (item.media_type === 'movie') {
        addMovie(item);
      } else if (isTvEndpoint) {
        addTV(item);
      } else if (isMovieEndpoint) {
        addMovie(item);
      }
    });
  }

  if (cleanEndpoint.startsWith('/movie/') && !cleanEndpoint.endsWith('/credits') && !cleanEndpoint.endsWith('/videos') && !cleanEndpoint.endsWith('/images') && !cleanEndpoint.endsWith('/watch/providers') && !cleanEndpoint.endsWith('/similar') && !cleanEndpoint.endsWith('/recommendations')) {
    addMovie(data);
  } else if (cleanEndpoint.startsWith('/tv/') && !cleanEndpoint.endsWith('/credits') && !cleanEndpoint.endsWith('/videos') && !cleanEndpoint.endsWith('/images') && !cleanEndpoint.endsWith('/watch/providers') && !cleanEndpoint.endsWith('/similar') && !cleanEndpoint.endsWith('/recommendations')) {
    addTV(data);
  }
}


async function getApiKey(): Promise<string> {
  // 1. Client-side localStorage check
  if (typeof window !== "undefined") {
    const localKey = localStorage.getItem("NEXT_PUBLIC_TMDB_API_KEY");
    if (localKey) return localKey;
  }
  
  // 2. Server-side cookie check
  if (typeof window === "undefined" && process.env.STATIC_EXPORT !== "true") {
    try {
      const { cookies } = require("next/headers");
      const cookieStore = await cookies();
      const cookieKey = cookieStore.get("NEXT_PUBLIC_TMDB_API_KEY")?.value;
      if (cookieKey) return cookieKey;
    } catch {
      // Fallback if cookies() is called outside request context
    }
  }

  // 3. Environment variables check
  const key = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;
  return key || '';
}

async function tmdbFetch<T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {}
): Promise<T> {
  const cleanEndpoint = endpoint.split('?')[0];
  
  // Route details pages of mock database movies/TV shows (IDs 1-115) to mock data
  // to avoid 404s and mismatches during static builds and runtime.
  if (cleanEndpoint.startsWith('/movie/') || cleanEndpoint.startsWith('/tv/')) {
    const parts = cleanEndpoint.split('/');
    if (parts.length >= 3) {
      const id = parseInt(parts[2]);
      const movieListEndpoints = ['upcoming', 'now_playing', 'popular', 'top_rated', 'latest'];
      const isListEndpoint = parts[2] && movieListEndpoints.includes(parts[2]);
      
      if (!isListEndpoint && !isNaN(id) && id >= 1 && id <= 115) {
        return getMockDataForEndpoint(endpoint) as T;
      }
    }
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    return getMockDataForEndpoint(endpoint) as T;
  }

  const cacheKey = `tmdb:fetch:${endpoint}:${JSON.stringify(params)}`;

  if (typeof window === "undefined") {
    try {
      const { getCachedData } = require("./redis");
      return await getCachedData(
        cacheKey,
        async () => {
          return await fetchDirectTMDB<T>(endpoint, params, apiKey);
        },
        3600 // 1 hour cache
      );
    } catch (cacheErr) {
      console.warn("Redis client cache bypass, fetching directly:", cacheErr);
    }
  }

  return await fetchDirectTMDB<T>(endpoint, params, apiKey);
}

async function fetchDirectTMDB<T>(
  endpoint: string,
  params: Record<string, string | number | boolean>,
  apiKey: string
): Promise<T> {
  try {
    const searchParams = new URLSearchParams({
      api_key: apiKey,
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ),
    });

    const url = `${TMDB_BASE_URL}${endpoint}?${searchParams}`;

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn(`TMDB API returned non-OK status: ${response.status}. Using mock data fallback.`);
      return getMockDataForEndpoint(endpoint) as T;
    }

    const data = await response.json();
    try {
      cacheTMDBData(endpoint, data);
    } catch (cacheErr) {
      console.warn("Failed to cache TMDB data:", cacheErr);
    }
    return data;
  } catch (error) {
    console.error("TMDB Fetch error, using mock data fallback:", error);
    return getMockDataForEndpoint(endpoint) as T;
  }
}

function getMockDataForEndpoint(endpoint: string): unknown {
  const cleanEndpoint = endpoint.split('?')[0];
  
  // Movie list endpoints that should NOT be treated as movie details
  const movieListEndpoints = ['/movie/upcoming', '/movie/now_playing', '/movie/popular', '/movie/top_rated', '/movie/latest'];
  const isMovieListEndpoint = movieListEndpoints.some(e => cleanEndpoint === e || cleanEndpoint.endsWith(e));

  // Movie details
  if (cleanEndpoint.startsWith('/movie/') && !isMovieListEndpoint && !cleanEndpoint.endsWith('/credits') && !cleanEndpoint.endsWith('/videos') && !cleanEndpoint.endsWith('/images') && !cleanEndpoint.endsWith('/watch/providers') && !cleanEndpoint.endsWith('/similar') && !cleanEndpoint.endsWith('/recommendations')) {
    let id = parseInt(cleanEndpoint.split('/')[2]) || 1;
    
    // Map TMDB ID to Mock Movie ID if applicable
    if (TMDB_TO_MOCK_MOVIE_MAP[id]) {
      id = TMDB_TO_MOCK_MOVIE_MAP[id];
    }
    
    if (movieCache.has(id)) {
      const cached = movieCache.get(id);
      return {
        id: cached.id,
        title: cached.title,
        overview: cached.overview,
        poster_path: cached.poster_path,
        backdrop_path: cached.backdrop_path,
        vote_average: cached.vote_average,
        vote_count: cached.vote_count || 1420,
        release_date: cached.release_date,
        runtime: cached.runtime || 120,
        genres: cached.genres || [{ id: 28, name: "Action" }],
        tagline: cached.tagline || "Discover the truth.",
        budget: cached.budget || 100000000,
        revenue: cached.revenue || 350000000,
        status: "Released",
        production_companies: [{ id: 1, name: "Warner Bros. Pictures", logo_path: null, origin_country: "US" }],
        spoken_languages: [{ english_name: "English", iso_639_1: "en", name: "English" }],
      };
    }

    const mockMovie = MOCK_MOVIES_DB[id] || MOCK_MOVIES_DB[1];
    return {
      id: mockMovie.id,
      title: mockMovie.title,
      overview: mockMovie.overview,
      poster_path: mockMovie.poster_path,
      backdrop_path: mockMovie.backdrop_path,
      vote_average: mockMovie.vote_average,
      vote_count: 1420,
      release_date: mockMovie.release_date,
      runtime: mockMovie.runtime || 120,
      genres: mockMovie.genres || [{ id: 28, name: "Action" }],
      tagline: mockMovie.tagline || "Discover the truth.",
      budget: mockMovie.budget || 100000000,
      revenue: mockMovie.revenue || 350000000,
      status: "Released",
      production_companies: [{ id: 1, name: "Warner Bros. Pictures", logo_path: null, origin_country: "US" }],
      spoken_languages: [{ english_name: "English", iso_639_1: "en", name: "English" }],
    };
  }

  // TV Details
  if (cleanEndpoint.startsWith('/tv/') && !cleanEndpoint.endsWith('/credits') && !cleanEndpoint.endsWith('/videos') && !cleanEndpoint.endsWith('/images') && !cleanEndpoint.endsWith('/watch/providers') && !cleanEndpoint.endsWith('/similar') && !cleanEndpoint.endsWith('/recommendations')) {
    const id = parseInt(cleanEndpoint.split('/')[2]) || 1;
    
    if (tvCache.has(id)) {
      const cached = tvCache.get(id);
      return {
        id: cached.id,
        name: cached.name,
        overview: cached.overview,
        poster_path: cached.poster_path,
        backdrop_path: cached.backdrop_path,
        vote_average: cached.vote_average,
        vote_count: cached.vote_count || 8500,
        first_air_date: cached.first_air_date,
        episode_run_time: cached.episode_run_time || [45],
        genres: cached.genres || [{ id: 18, name: "Drama" }],
        number_of_seasons: cached.number_of_seasons || 3,
        number_of_episodes: cached.number_of_episodes || 30,
        status: "Released",
        tagline: cached.tagline || "Must-watch TV series.",
      };
    }

    const mockShow = MOCK_TV_SHOWS_DB[id] || MOCK_TV_SHOWS_DB[1];
    return {
      id: mockShow.id,
      name: mockShow.name,
      overview: mockShow.overview,
      poster_path: mockShow.poster_path,
      backdrop_path: mockShow.backdrop_path,
      vote_average: mockShow.vote_average,
      vote_count: 8500,
      first_air_date: mockShow.first_air_date,
      episode_run_time: mockShow.episode_run_time || [45],
      genres: mockShow.genres,
      number_of_seasons: mockShow.number_of_seasons || 3,
      number_of_episodes: mockShow.number_of_episodes || 30,
      status: "Released",
      tagline: mockShow.tagline || "Must-watch TV series.",
    };
  }

  // Credits (Cast & Crew)
  if (cleanEndpoint.endsWith('/credits')) {
    const parts = cleanEndpoint.split('/');
    const isTv = parts[1] === 'tv';
    const id = parseInt(parts[2]) || 1;

    let cast: any[] = [
      { id: 101, name: "Leonardo DiCaprio", character: "Dom Cobb", profile_path: "/wo2hJv0ktj4B5oWoT39c42AdRYS.jpg", order: 0 },
      { id: 102, name: "Joseph Gordon-Levitt", character: "Arthur", profile_path: "/dhV9227Z772L4t9c576yB44R3s.jpg", order: 1 },
      { id: 104, name: "Tom Hardy", character: "Eames", profile_path: "/4zbVvA64Wo242sD7z75yB44R3s.jpg", order: 2 },
      { id: 105, name: "Ken Watanabe", character: "Saito", profile_path: "/w51a4aZi4ghIY31w276Je4eHES.jpg", order: 3 },
      { id: 106, name: "Cillian Murphy", character: "Robert Fischer", profile_path: "/w61a4aZi4ghIY31w276Je4eHES.jpg", order: 4 },
    ];
    let crew: any[] = [
      { id: 201, name: "Christopher Nolan", department: "Directing", job: "Director", profile_path: "/3zbVvA64Wo242sD7z75yB44R3s.jpg" },
      { id: 202, name: "Emma Thomas", department: "Production", job: "Producer", profile_path: null },
    ];

    if (!isTv) {
      if (id === 12) { // Parasite
        cast = [
          { id: 1201, name: "Song Kang-ho", character: "Kim Ki-taek", profile_path: "/71BsvGVjwPZbL91PzL7x9tG1G2c6.jpg", order: 0 },
          { id: 1202, name: "Lee Sun-kyun", character: "Mr. Park", profile_path: "/71BsvGVjwPZbL91PzL7x9tG1G2c6.jpg", order: 1 },
          { id: 1203, name: "Cho Yeo-jeong", character: "Mrs. Park", profile_path: "/71BsvGVjwPZbL91PzL7x9tG1G2c6.jpg", order: 2 },
        ];
        crew = [
          { id: 1211, name: "Bong Joon-ho", department: "Directing", job: "Director", profile_path: "/71BsvGVjwPZbL91PzL7x9tG1G2c6.jpg" }
        ];
      } else if (id === 15) { // Joker
        cast = [
          { id: 1501, name: "Joaquin Phoenix", character: "Arthur Fleck / Joker", profile_path: "/udDclJoHjfjb8Ekgsd4FDte21p.jpg", order: 0 },
          { id: 1502, name: "Robert De Niro", character: "Murray Franklin", profile_path: "/udDclJoHjfjb8Ekgsd4FDte21p.jpg", order: 1 },
        ];
        crew = [
          { id: 1511, name: "Todd Phillips", department: "Directing", job: "Director", profile_path: "/udDclJoHjfjb8Ekgsd4FDte21p.jpg" }
        ];
      } else if (id === 53) { // Spider-Man: Across the Spider-Verse
        cast = [
          { id: 5301, name: "Shameik Moore", character: "Miles Morales", profile_path: "/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg", order: 0 },
          { id: 5302, name: "Hailee Steinfeld", character: "Gwen Stacy", profile_path: "/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg", order: 1 },
        ];
        crew = [
          { id: 5311, name: "Joaquim Dos Santos", department: "Directing", job: "Director", profile_path: null },
          { id: 5312, name: "Kemp Powers", department: "Directing", job: "Director", profile_path: null },
          { id: 5313, name: "Justin K. Thompson", department: "Directing", job: "Director", profile_path: null }
        ];
      } else if (id === 91) { // Moana (Live-Action)
        cast = [
          { id: 9101, name: "Catherine Laga'aia", character: "Moana", profile_path: null, order: 0 },
          { id: 9102, name: "Dwayne Johnson", character: "Maui", profile_path: "/cgoy7t5Ve075naBPcewZrc08qGw.jpg", order: 1 },
        ];
        crew = [
          { id: 9111, name: "Thomas Kail", department: "Directing", job: "Director", profile_path: null }
        ];
      } else if (id === 93) { // Alpha
        cast = [
          { id: 9301, name: "Alia Bhatt", character: "Alpha", profile_path: null, order: 0 },
          { id: 9302, name: "Sharvari", character: "Agent Zara", profile_path: null, order: 1 },
        ];
        crew = [
          { id: 9311, name: "Shiv Rawail", department: "Directing", job: "Director", profile_path: null }
        ];
      } else if (id === 95) { // Toy Story 5
        cast = [
          { id: 9501, name: "Tom Hanks", character: "Woody (voice)", profile_path: "/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg", order: 0 },
          { id: 9502, name: "Tim Allen", character: "Buzz Lightyear (voice)", profile_path: null, order: 1 },
        ];
        crew = [
          { id: 9511, name: "Andrew Stanton", department: "Directing", job: "Director", profile_path: null }
        ];
      } else if (id === 97) { // The Mandalorian & Grogu
        cast = [
          { id: 9701, name: "Pedro Pascal", character: "Din Djarin / The Mandalorian", profile_path: "/9VYK7oxcqhjd5LAH6ZFJ3HbkPhQ.jpg", order: 0 },
        ];
        crew = [
          { id: 9711, name: "Jon Favreau", department: "Directing", job: "Director", profile_path: null }
        ];
      } else if (id === 101) { // Project Hail Mary
        cast = [
          { id: 10101, name: "Ryan Gosling", character: "Ryland Grace", profile_path: "/lyUyVARDRMc0bB0aFkFvOQqSQil.jpg", order: 0 },
        ];
        crew = [
          { id: 10111, name: "Phil Lord", department: "Directing", job: "Director", profile_path: null },
          { id: 10112, name: "Christopher Miller", department: "Directing", job: "Director", profile_path: null }
        ];
      } else if (id >= 102 && id <= 115) {
        const upcomingCreditsMap: Record<number, { cast: any[], crew: any[] }> = {
          102: {
            cast: [
              { id: 10201, name: "NTR Jr.", character: "Achyuta", profile_path: null, order: 0 },
              { id: 10202, name: "Ram Charan", character: "Avataar", profile_path: null, order: 1 },
              { id: 10203, name: "Pooja Hegde", character: "Mythili", profile_path: null, order: 2 },
            ],
            crew: [
              { id: 10211, name: "Prashanth Neel", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          103: {
            cast: [
              { id: 10301, name: "Venkatesh", character: "Madhav", profile_path: null, order: 0 },
              { id: 10302, name: "Nani", character: "Arjun", profile_path: null, order: 1 },
              { id: 10303, name: "Sreeleela", character: "Divya", profile_path: null, order: 2 },
            ],
            crew: [
              { id: 10311, name: "Trivikram Srinivas", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          104: {
            cast: [
              { id: 10401, name: "Ravi Teja", character: "Shankar", profile_path: null, order: 0 },
              { id: 10402, name: "Malvika Sharma", character: "Priya", profile_path: null, order: 1 },
            ],
            crew: [
              { id: 10411, name: "Puri Jagannadh", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          105: {
            cast: [
              { id: 10501, name: "Sid Sriram", character: "Vivek", profile_path: null, order: 0 },
              { id: 10502, name: "Rashmika Mandanna", character: "Sukumari", profile_path: null, order: 1 },
            ],
            crew: [
              { id: 10511, name: "Gautham Vasudev Menon", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          106: {
            cast: [
              { id: 10601, name: "Suriya", character: "Advocate Chandru", profile_path: null, order: 0 },
              { id: 10602, name: "Keerthy Suresh", character: "Kavitha", profile_path: null, order: 1 },
            ],
            crew: [
              { id: 10611, name: "Vetrimaaran", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          107: {
            cast: [
              { id: 10701, name: "Fahadh Faasil", character: "Antappan", profile_path: null, order: 0 },
              { id: 10702, name: "Joju George", character: "Mathai", profile_path: null, order: 1 },
            ],
            crew: [
              { id: 10711, name: "Lijo Jose Pellissery", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          108: {
            cast: [
              { id: 10801, name: "Kalyan Ram", character: "Shiva", profile_path: null, order: 0 },
              { id: 10802, name: "Mehreen Pirzada", character: "Madhavi", profile_path: null, order: 1 },
            ],
            crew: [
              { id: 10811, name: "Parasuram", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          109: {
            cast: [
              { id: 10901, name: "Mohanlal", character: "Georgekutty", profile_path: null, order: 0 },
              { id: 10902, name: "Meena", character: "Rani", profile_path: null, order: 1 },
            ],
            crew: [
              { id: 10911, name: "Jeethu Joseph", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          110: {
            cast: [
              { id: 11001, name: "Vijay", character: "Vetri", profile_path: null, order: 0 },
              { id: 11002, name: "Samantha Ruth Prabhu", character: "Mithra", profile_path: null, order: 1 },
            ],
            crew: [
              { id: 11011, name: "Atlee", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          111: {
            cast: [
              { id: 11101, name: "Shameik Moore", character: "Miles Morales (voice)", profile_path: null, order: 0 },
              { id: 11102, name: "Hailee Steinfeld", character: "Gwen Stacy (voice)", profile_path: null, order: 1 }
            ],
            crew: [
              { id: 11111, name: "Joaquim Dos Santos", department: "Directing", job: "Director", profile_path: null },
              { id: 11112, name: "Kemp Powers", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          112: {
            cast: [
              { id: 11201, name: "Robert Downey Jr.", character: "Victor von Doom / Doctor Doom", profile_path: null, order: 0 },
              { id: 11202, name: "Tom Holland", character: "Peter Parker / Spider-Man", profile_path: null, order: 1 }
            ],
            crew: [
              { id: 11211, name: "Anthony Russo", department: "Directing", job: "Director", profile_path: null },
              { id: 11212, name: "Joe Russo", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          113: {
            cast: [
              { id: 11301, name: "Tom Hanks", character: "Woody (voice)", profile_path: null, order: 0 },
              { id: 11302, name: "Tim Allen", character: "Buzz Lightyear (voice)", profile_path: null, order: 1 }
            ],
            crew: [
              { id: 11311, name: "Andrew Stanton", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          114: {
            cast: [
              { id: 11401, name: "Robert Pattinson", character: "Bruce Wayne / The Batman", profile_path: null, order: 0 },
              { id: 11402, name: "Zoë Kravitz", character: "Selina Kyle / Catwoman", profile_path: null, order: 1 }
            ],
            crew: [
              { id: 11411, name: "Matt Reeves", department: "Directing", job: "Director", profile_path: null }
            ]
          },
          115: {
            cast: [
              { id: 11501, name: "Sam Worthington", character: "Jake Sully", profile_path: null, order: 0 },
              { id: 11502, name: "Zoe Saldaña", character: "Neytiri", profile_path: null, order: 1 }
            ],
            crew: [
              { id: 11511, name: "James Cameron", department: "Directing", job: "Director", profile_path: null }
            ]
          }
        };
        const creds = upcomingCreditsMap[id];
        cast = creds.cast;
        crew = creds.crew;
      }
    }

    return {
      id,
      cast,
      crew
    };
  }

  // Genres List
  if (cleanEndpoint.endsWith('/genre/movie/list') || cleanEndpoint.endsWith('/genre/tv/list')) {
    return {
      genres: [
        { id: 28, name: "Action" },
        { id: 12, name: "Adventure" },
        { id: 16, name: "Animation" },
        { id: 35, name: "Comedy" },
        { id: 80, name: "Crime" },
        { id: 99, name: "Documentary" },
        { id: 18, name: "Drama" },
        { id: 10751, name: "Family" },
        { id: 14, name: "Fantasy" },
        { id: 36, name: "History" },
        { id: 27, name: "Horror" },
        { id: 10402, name: "Music" },
        { id: 9648, name: "Mystery" },
        { id: 10749, name: "Romance" },
        { id: 878, name: "Sci-Fi" },
        { id: 10770, name: "TV Movie" },
        { id: 53, name: "Thriller" },
        { id: 10752, name: "War" },
        { id: 37, name: "Western" }
      ]
    };
  }

  // Watch Providers (OTT)
  if (cleanEndpoint.endsWith('/watch/providers')) {
    const parts = cleanEndpoint.split('/');
    const id = parseInt(parts[2]) || 1;
    if (id >= 102 && id <= 115) {
      return {
        id,
        results: {}
      };
    }
    return {
      id,
      results: {
        US: {
          link: "https://www.themoviedb.org",
          flatrate: [
            { provider_id: 8, provider_name: "Netflix", logo_path: null },
            { provider_id: 15, provider_name: "Hulu", logo_path: null },
            { provider_id: 9, provider_name: "Amazon Prime Video", logo_path: null }
          ],
          rent: [
            { provider_id: 3, provider_name: "Google Play Movies", logo_path: null },
            { provider_id: 2, provider_name: "Apple TV", logo_path: null }
          ]
        },
        IN: {
          link: "https://www.themoviedb.org",
          flatrate: [
            { provider_id: 8, provider_name: "Netflix", logo_path: null },
            { provider_id: 122, provider_name: "Hotstar", logo_path: null }
          ],
          rent: [
            { provider_id: 3, provider_name: "Google Play Movies", logo_path: null },
            { provider_id: 2, provider_name: "Apple TV", logo_path: null }
          ]
        }
      }
    };
  }

  // Videos (Trailers)
  if (cleanEndpoint.endsWith('/videos')) {
    const parts = cleanEndpoint.split('/');
    const id = parseInt(parts[2]) || 1;

    const MOVIE_TRAILER_MAP: Record<number, string> = {
      1: "CPTIgILtna8",  // Inception
      2: "EXeTwQWrcwY",  // The Dark Knight
      3: "zSWdZVtXT7E",  // Interstellar
      4: "uYPbbksJxIg",  // Oppenheimer
      5: "Way9Dexny3w",  // Dune: Part Two
      6: "73_1biulkYk",  // Deadpool & Wolverine
      7: "4mgUU1d916U",  // Gladiator II
      8: "hDZ7y8RP5HE",  // Moana 2
      9: "6COmYeLsz4c",  // Wicked
      10: "x0XDEhP4MQs", // Alien: Romulus
      11: "qSu6i2iFMO0", // Sonic the Hedgehog 3
      12: "5xH0HfJHsaY", // Parasite
      13: "rze8QYwWGSc", // Kraven the Hunter
      14: "lFzVJEksoDY", // Mufasa: The Lion King
      15: "zAGVQLHvwOY", // Joker
      16: "CoZqL9GK6HM", // Beetlejuice Beetlejuice
      17: "u2NuUWb7T0k", // Transformers One
      18: "J4X70qLq1n4", // Twisters
      19: "XJMuhwVwcaU", // Furiosa: A Mad Max Saga
      20: "t06RUxPsn2A", // Kingdom of the Planet of the Apes
      21: "hRFY_Fling0", // Bad Boys: Ride or Die
      22: "LEjhY15eCx0", // Inside Out 2
      23: "qQlr9-rF32E", // Despicable Me 4
      24: "aWzlQ2N6vxI", // Welcome to the Jungle
      25: "__2bjWbesA0", // Venom: The Last Dance
      26: "_OKAwz2MsJs", // Joker: Folie à Deux
      27: "YPY7J-lPnRI", // A Quiet Place: Day One
      28: "qqrpMRDuTEo", // Godzilla x Kong: The New Empire
      29: "n9xhJrPXop4", // Dune
      30: "wxN1T1uxQ2g", // Everything Everywhere All at Once
      31: "d9MyW72ELq0", // Avatar: The Way of Water
      32: "qSqVVswa420", // Top Gun: Maverick
      33: "mqqft2x_Aa4", // The Batman
      34: "TcMBFSGVi1c", // Avengers: Endgame
      35: "6ZfuNTqbHE8", // Avengers: Infinity War
      36: "JfVOs4VSpmA", // Spider-Man: No Way Home
      37: "vKQi3bBA1y8", // The Matrix
      38: "qtRKDV93s2s", // Fight Club
      39: "s7EdQ4FqbhY", // Pulp Fiction
      40: "bLvqoHBptjg", // Forrest Gump
      41: "PLl99DfYKbM", // The Shawshank Redemption
      42: "UaVTIH8mujA", // The Godfather
      43: "2ilzidi_J8Q", // Goodfellas
      44: "znmZoVkCopi", // Se7en
      45: "W6Mm8Sbe__E", // Silence of the Lambs
      46: "9CiW_DskKhU", // Saving Private Ryan
      47: "kVrqfYjkTdQ", // Titanic
      48: "lc0UehYemQA", // Jurassic Park
      49: "vZ734NWnJdM", // Star Wars: A New Hope
      50: "qvsgGtivCgs", // Back to the Future
      51: "owK1qxDselE", // Gladiator
      52: "1NJO0jxBtMo", // Braveheart
      53: "cqGjhVJWtEg", // Spider-Man: Across the Spider-Verse
      54: "7d_jQycdQGo", // Whiplash
      55: "0pdqf4P9MB8", // La La Land
      56: "pBk4NYhWNMM", // Barbie
      57: "g4Hbz2jLXvQ", // Spider-Man: Into the Spider-Verse
      58: "d96cjJhvlMA", // Guardians of the Galaxy
      59: "8ugaeA-nMTc", // Iron Man
      60: "ue80QwXMRHg", // Thor: Ragnarok
      61: "xjDjIWPwcPU", // Black Panther
      62: "eOrNlmLiSJg", // The Avengers
      63: "HhesaQXLuRY", // Breaking Bad
      64: "b9EkMc79ZSU", // Stranger Things
      65: "KPLWWIOCOOQ", // Game of Thrones
      66: "uLtkt8BonwM", // The Last of Us
      67: "DotnJ7tTA34", // House of the Dragon
      68: "aOC8E8z_ifw", // The Mandalorian
      69: "ozY44h1Rj68", // Succession
      70: "Q73Vgqq36d0", // Wednesday
      71: "oqxAJKy0ii4", // Squid Game
      72: "06rueu_fh30", // The Boys
      91: "LKFuXETZ40E", // Moana
      101: "uYPbbksJxIg", // Project Hail Mary
      102: "_G12zP4s_eM", // The Death of Robin Hood
      103: "mduR2H7eE6Q", // The Odyssey
      104: "K2k2y043jSg", // Disclosure Day
      105: "H4g2g4x4mH8", // Backrooms
      106: "73_1biulkYk", // Deadpool & Wolverine
      107: "4mgUU1d916U", // Gladiator II
      108: "hDZ7y8RP5HE", // Moana 2
      109: "6COmYeLsz4c", // Wicked
      110: "x0XDEhP4MQs", // Alien: Romulus
      111: "qSu6i2iFMO0", // Spider-Man Beyond
      112: "6ZfuNTqbHE8", // Avengers Secret Wars
      113: "u2NuUWb7T0k", // Toy Story 5
      114: "mqqft2x_Aa4", // The Batman Part 2
      115: "d9MyW72ELq0", // Avatar Fire and Ash
    };

    const trailerKey = getTrailerKeyForMovie(id);

    return {
      id,
      results: [
        { id: `v_${id}`, key: trailerKey, name: "Official Trailer", site: "YouTube", size: 1080, type: "Trailer", official: true }
      ]
    };
  }

  // Images
  if (cleanEndpoint.endsWith('/images')) {
    return {
      id: 1,
      backdrops: [],
      posters: []
    };
  }

  // Popular People
  if (cleanEndpoint === '/person/popular') {
    return {
      page: 1,
      results: Object.values(MOCK_PEOPLE_DB).map(p => ({
        id: p.id,
        name: p.name,
        known_for_department: p.known_for_department,
        profile_path: p.profile_path,
        known_for: p.known_for
      })),
      total_pages: 1,
      total_results: Object.keys(MOCK_PEOPLE_DB).length
    };
  }

  // Person Details
  if (cleanEndpoint.startsWith('/person/') && !cleanEndpoint.endsWith('/combined_credits')) {
    const id = parseInt(cleanEndpoint.split('/')[2]) || 101;
    const person = MOCK_PEOPLE_DB[id] || MOCK_PEOPLE_DB[101];
    return {
      id: person.id,
      name: person.name,
      known_for_department: person.known_for_department,
      profile_path: person.profile_path,
      biography: person.biography,
      birthday: person.birthday,
      place_of_birth: person.place_of_birth,
      popularity: 98.4,
    };
  }

  // Person combined credits
  if (cleanEndpoint.startsWith('/person/') && cleanEndpoint.endsWith('/combined_credits')) {
    const id = parseInt(cleanEndpoint.split('/')[2]) || 101;
    const person = MOCK_PEOPLE_DB[id] || MOCK_PEOPLE_DB[101];
    return {
      id: person.id,
      cast: person.known_for.map(kf => ({
        id: kf.id,
        title: kf.title,
        poster_path: kf.poster_path,
        media_type: kf.media_type,
        vote_average: kf.vote_average,
        character: "Self / Featured Role"
      })),
      crew: []
    };
  }

  // Similar Media
  const similarMatch = cleanEndpoint.match(/^\/(movie|tv)\/(\d+)\/similar/);
  if (similarMatch) {
    const currentId = parseInt(similarMatch[2]);
    const isTv = similarMatch[1] === 'tv';
    const database = isTv ? MOCK_TV_SHOWS_DB : MOCK_MOVIES_DB;
    const items = Object.values(database).filter((m: any) => m.id !== currentId);
    const mapped = items.map((m: any) => ({
      id: m.id,
      title: m.title || m.name || "",
      name: m.name || m.title || "",
      overview: m.overview,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      vote_average: m.vote_average,
      release_date: m.release_date || m.first_air_date || "",
      first_air_date: m.first_air_date || m.release_date || "",
      genre_ids: m.genres ? m.genres.map((g: any) => g.id) : [],
      media_type: isTv ? "tv" : "movie",
    }));
    return {
      page: 1,
      results: mapped,
      total_pages: 1,
      total_results: mapped.length
    };
  }

  // Default List Responses (Trending, Search, etc.)
  const isMulti = cleanEndpoint.includes('/multi');
  const isTv = cleanEndpoint.includes('/tv/') || cleanEndpoint.endsWith('/tv');
  
  let defaultResults: any[];
  if (isMulti) {
    // Combine both movies and TV shows
    const movies = Object.values(MOCK_MOVIES_DB).map((m: any) => ({
      id: m.id,
      title: m.title,
      name: m.title,
      overview: m.overview,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      vote_average: m.vote_average,
      release_date: m.release_date,
      first_air_date: m.release_date,
      genre_ids: m.genres ? m.genres.map((g: any) => g.id) : [],
      media_type: "movie",
    }));
    const tvShows = Object.values(MOCK_TV_SHOWS_DB).map((m: any) => ({
      id: m.id,
      title: m.name,
      name: m.name,
      overview: m.overview,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      vote_average: m.vote_average,
      release_date: m.first_air_date,
      first_air_date: m.first_air_date,
      genre_ids: m.genres ? m.genres.map((g: any) => g.id) : [],
      media_type: "tv",
    }));
    defaultResults = [...movies, ...tvShows];
  } else {
    const database = isTv ? MOCK_TV_SHOWS_DB : MOCK_MOVIES_DB;
    let items = Object.values(database);

    // Apply endpoint specific filtering and sorting for cleaner mock data
    if (!isTv && cleanEndpoint.endsWith('/movie/upcoming')) {
      const now = Date.now();
      items = items.filter((m: any) => m.release_date && new Date(m.release_date).getTime() > now);
      items.sort((a: any, b: any) => {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return dateA - dateB;
      });
    } else if (!isTv && cleanEndpoint.endsWith('/movie/now_playing')) {
      const now = Date.now();
      // "Now Playing" = released within the last 90 days (currently in theaters)
      const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
      items = items.filter((m: any) => {
        if (!m.release_date) return false;
        const releaseTime = new Date(m.release_date).getTime();
        return releaseTime <= now && releaseTime >= ninetyDaysAgo;
      });
      items.sort((a: any, b: any) => {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return dateB - dateA;
      });
    } else if (!isTv && (cleanEndpoint.endsWith('/movie/popular') || cleanEndpoint.endsWith('/movie/top_rated'))) {
      items.sort((a: any, b: any) => b.vote_average - a.vote_average);
    }

    defaultResults = items.map((m: any) => ({
      id: m.id,
      title: m.title || m.name || "",
      name: m.name || m.title || "",
      overview: m.overview,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      vote_average: m.vote_average,
      release_date: m.release_date || m.first_air_date || "",
      first_air_date: m.first_air_date || m.release_date || "",
      genre_ids: m.genres ? m.genres.map((g: any) => g.id) : [],
      media_type: isTv ? "tv" : "movie",
    }));
  }

  return {
    page: 1,
    results: defaultResults,
    total_pages: 1,
    total_results: defaultResults.length
  };
}

export function getTrailerKeyForMovie(id: number): string {
  const MOVIE_TRAILER_MAP: Record<number, string> = {
    1: "CPTIgILtna8", 2: "EXeTwQWrcwY", 3: "zSWdZVtXT7E", 4: "uYPbbksJxIg", 5: "Way9Dexny3w",
    6: "73_1biulkYk", 7: "4mgUU1d916U", 8: "hDZ7y8RP5HE", 9: "6COmYeLsz4c", 10: "x0XDEhP4MQs",
    11: "qSu6i2iFMO0", 12: "5xH0HfJHsaY", 13: "rze8QYwWGSc", 14: "lFzVJEksoDY", 15: "zAGVQLHvwOY",
    16: "CoZqL9GK6HM", 17: "u2NuUWb7T0k", 18: "J4X70qLq1n4", 19: "XJMuhwVwcaU", 20: "t06RUxPsn2A",
    21: "hRFY_Fling0", 22: "LEjhY15eCx0", 23: "qQlr9-rF32E", 24: "aWzlQ2N6vxI", 25: "__2bjWbesA0",
    26: "_OKAwz2MsJs", 27: "YPY7J-lPnRI", 28: "qqrpMRDuTEo", 29: "n9xhJrPXop4", 30: "wxN1T1uxQ2g",
    31: "d9MyW72ELq0", 32: "qSqVVswa420", 33: "mqqft2x_Aa4", 34: "TcMBFSGVi1c", 35: "6ZfuNTqbHE8",
    36: "JfVOs4VSpmA", 37: "vKQi3bBA1y8", 38: "qtRKDV93s2s", 39: "s7EdQ4FqbhY", 40: "bLvqoHBptjg",
    41: "PLl99DfYKbM", 42: "UaVTIH8mujA", 43: "2ilzidi_J8Q", 44: "znmZoVkCopi", 45: "W6Mm8Sbe__E",
    46: "9CiW_DskKhU", 47: "kVrqfYjkTdQ", 48: "lc0UehYemQA", 49: "vZ734NWnJdM", 50: "qvsgGtivCgs",
    51: "owK1qxDselE", 52: "1NJO0jxBtMo", 53: "cqGjhVJWtEg", 54: "7d_jQycdQGo", 55: "0pdqf4P9MB8",
    56: "pBk4NYhWNMM", 57: "g4Hbz2jLXvQ", 58: "d96cjJhvlMA", 59: "8ugaeA-nMTc", 60: "ue80QwXMRHg",
    61: "xjDjIWPwcPU", 62: "eOrNlmLiSJg", 63: "HhesaQXLuRY", 64: "b9EkMc79ZSU", 65: "KPLWWIOCOOQ",
    66: "uLtkt8BonwM", 67: "DotnJ7tTA34", 68: "aOC8E8z_ifw", 69: "ozY44h1Rj68", 70: "Q73Vgqq36d0",
    71: "oqxAJKy0ii4", 72: "06rueu_fh30", 91: "LKFuXETZ40E",
    101: "uYPbbksJxIg", 102: "_G12zP4s_eM", 103: "mduR2H7eE6Q", 104: "K2k2y043jSg", 105: "H4g2g4x4mH8",
    106: "73_1biulkYk", 107: "4mgUU1d916U", 108: "hDZ7y8RP5HE", 109: "6COmYeLsz4c", 110: "x0XDEhP4MQs",
    111: "qSu6i2iFMO0", 112: "6ZfuNTqbHE8", 113: "u2NuUWb7T0k", 114: "mqqft2x_Aa4", 115: "d9MyW72ELq0"
  };

  const FALLBACK_TRAILERS = [
    "CPTIgILtna8", "EXeTwQWrcwY", "zSWdZVtXT7E", "uYPbbksJxIg", "Way9Dexny3w",
    "73_1biulkYk", "4mgUU1d916U", "hDZ7y8RP5HE", "6COmYeLsz4c", "x0XDEhP4MQs",
    "5xH0HfJHsaY", "zAGVQLHvwOY", "aWzlQ2N6vxI", "cqGjhVJWtEg", "pBk4NYhWNMM"
  ];

  return MOVIE_TRAILER_MAP[id] || FALLBACK_TRAILERS[Math.abs(id) % FALLBACK_TRAILERS.length];
}

const MOCK_PEOPLE_DB: Record<number, {
  id: number;
  name: string;
  known_for_department: string;
  profile_path: string | null;
  biography?: string;
  birthday?: string;
  place_of_birth?: string;
  known_for: Array<{ id: number; title: string; poster_path: string | null; media_type: string; vote_average: number }>;
}> = {
  101: {
    id: 101,
    name: "Leonardo DiCaprio",
    known_for_department: "Acting",
    profile_path: "/wo2hJv0ktj4B5oWoT39c42AdRYS.jpg",
    biography: "Leonardo Wilhelm DiCaprio is an American actor and film producer. Known for his work in biopics and period films, DiCaprio has received numerous accolades, including an Academy Award, a British Academy Film Award, and three Golden Globe Awards.",
    birthday: "1974-11-11",
    place_of_birth: "Los Angeles, California, USA",
    known_for: [
      { id: 1, title: "Inception", poster_path: "/o0fg76aZi4ghIY31w276Je4eHES.jpg", media_type: "movie", vote_average: 8.8 },
      { id: 4, title: "Titanic", poster_path: "/9cqOm0w7876rG0J56qrlznqd5p5.jpg", media_type: "movie", vote_average: 7.9 }
    ]
  },
  102: {
    id: 102,
    name: "Joseph Gordon-Levitt",
    known_for_department: "Acting",
    profile_path: "/dhV9227Z772L4t9c576yB44R3s.jpg",
    biography: "Joseph Leonard Gordon-Levitt is an American actor, filmmaker, and singer. As a child actor, he appeared in the films A River Runs Through It, Angels in the Outfield, and 10 Things I Hate About You.",
    birthday: "1981-02-17",
    place_of_birth: "Los Angeles, California, USA",
    known_for: [
      { id: 1, title: "Inception", poster_path: "/o0fg76aZi4ghIY31w276Je4eHES.jpg", media_type: "movie", vote_average: 8.8 },
      { id: 2, title: "The Dark Knight", poster_path: "/qJ2tWzXo7ppF7hcwQO4gR24tb53.jpg", media_type: "movie", vote_average: 9.0 }
    ]
  },
  104: {
    id: 104,
    name: "Tom Hardy",
    known_for_department: "Acting",
    profile_path: "/4zbVvA64Wo242sD7z75yB44R3s.jpg",
    biography: "Edward Thomas 'Tom' Hardy is an English actor and producer. After studying acting at the Drama Centre London, he made his film debut in Ridley Scott's Black Hawk Down (2001).",
    birthday: "1977-09-15",
    place_of_birth: "Hammersmith, London, UK",
    known_for: [
      { id: 1, title: "Inception", poster_path: "/o0fg76aZi4ghIY31w276Je4eHES.jpg", media_type: "movie", vote_average: 8.8 },
      { id: 2, title: "The Dark Knight", poster_path: "/qJ2tWzXo7ppF7hcwQO4gR24tb53.jpg", media_type: "movie", vote_average: 9.0 }
    ]
  },
  201: {
    id: 201,
    name: "Christopher Nolan",
    known_for_department: "Directing",
    profile_path: "/3zbVvA64Wo242sD7z75yB44R3s.jpg",
    biography: "Christopher Edward Nolan is a British-American film director, screenwriter, and producer. Best known for his cerebral, often non-linear films, Nolan is one of the most successful and acclaimed directors of the 21st century.",
    birthday: "1970-07-30",
    place_of_birth: "Westminster, London, UK",
    known_for: [
      { id: 1, title: "Inception", poster_path: "/o0fg76aZi4ghIY31w276Je4eHES.jpg", media_type: "movie", vote_average: 8.8 },
      { id: 2, title: "The Dark Knight", poster_path: "/qJ2tWzXo7ppF7hcwQO4gR24tb53.jpg", media_type: "movie", vote_average: 9.0 },
      { id: 3, title: "Interstellar", poster_path: "/gEU2QvJWzIF7efg2tzkNf44m2vw.jpg", media_type: "movie", vote_average: 8.7 }
    ]
  }
};

const MOCK_MOVIES_DB: Record<number, {
  id: number;
  title: string;
  vote_average: number;
  release_date: string;
  overview: string;
  genres: Array<{ id: number; name: string }>;
  runtime?: number;
  tagline?: string;
  budget?: number;
  revenue?: number;
  poster_path: string | null;
  backdrop_path: string | null;
}> = {
  1: {
    id: 1,
    title: "Inception",
    vote_average: 8.8,
    release_date: "2010-07-16",
    overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    genres: [{ id: 28, name: "Action" }, { id: 878, name: "Sci-Fi" }, { id: 53, name: "Thriller" }],
    runtime: 148,
    tagline: "Your mind is the scene of the crime.",
    budget: 160000000,
    revenue: 828322032,
    poster_path: "/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
    backdrop_path: "/s3TBrRGB1K7G5ehgTH36UIjHjKq.jpg"
  },
  2: {
    id: 2,
    title: "The Dark Knight",
    vote_average: 9.0,
    release_date: "2008-07-18",
    overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 18, name: "Drama" }],
    runtime: 152,
    tagline: "Why So Serious?",
    budget: 185000000,
    revenue: 1004558444,
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_path: "/o86u02GDg46g70rFS7G6237g55s.jpg"
  },
  3: {
    id: 3,
    title: "Interstellar",
    vote_average: 8.7,
    release_date: "2014-11-07",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    genres: [{ id: 12, name: "Adventure" }, { id: 18, name: "Drama" }, { id: 878, name: "Sci-Fi" }],
    runtime: 169,
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    budget: 165000000,
    revenue: 677463813,
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop_path: "/xJHaxuoQn55Z45w6uIf8C265yex.jpg"
  },
  4: {
    id: 4,
    title: "The Shawshank Redemption",
    vote_average: 9.3,
    release_date: "1994-09-23",
    overview: "Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.",
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
    runtime: 142,
    tagline: "Fear can hold you prisoner. Hope can set you free.",
    budget: 25000000,
    revenue: 28817291,
    poster_path: "/9cqNxx0GIM0bflTVxOTQuY7pZ2p.jpg",
    backdrop_path: "/kXfq73Arxtsn4r6PbYwHzpfK07H.jpg"
  },
  5: {
    id: 5,
    title: "Pulp Fiction",
    vote_average: 8.9,
    release_date: "1994-10-14",
    overview: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    genres: [{ id: 53, name: "Thriller" }, { id: 80, name: "Crime" }],
    runtime: 154,
    tagline: "Just because you are a character doesn't mean that you have character.",
    budget: 8000000,
    revenue: 213928762,
    poster_path: "/d5iVF7j37452d3j9W8pQW7d7y3K.jpg",
    backdrop_path: "/sua5wJZi4fC645k3q6j9g2n86qc.jpg"
  },
  6: {
    id: 6,
    title: "The Matrix",
    vote_average: 8.7,
    release_date: "1999-03-31",
    overview: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.",
    genres: [{ id: 28, name: "Action" }, { id: 878, name: "Sci-Fi" }],
    runtime: 136,
    tagline: "Believe the unbelievable.",
    budget: 63000000,
    revenue: 463517383,
    poster_path: "/oMsxZEvz9a708d49b6UdZK1KAo5.jpg",
    backdrop_path: "/7uRb6xNCWx8g1o6fsEDZ5t5GY6t.jpg"
  },
  7: {
    id: 7,
    title: "Forrest Gump",
    vote_average: 8.8,
    release_date: "1994-07-06",
    overview: "The history of the United States from the 1950s to the '70s unfolds from the perspective of an Alabama man with an IQ of 75, who yearns to be reunited with his childhood sweetheart.",
    genres: [{ id: 18, name: "Drama" }, { id: 35, name: "Comedy" }],
    runtime: 142,
    tagline: "The world will never be the same once you've seen it through the eyes of Forrest Gump.",
    budget: 55000000,
    revenue: 677945399,
    poster_path: "/arw2vcJzHfh6fbqPMgjo6YmZf0c.jpg",
    backdrop_path: "/qd01xCr2xZ8Nn5fsE3az7hz5tuz.jpg"
  },
  8: {
    id: 8,
    title: "Fight Club",
    vote_average: 8.8,
    release_date: "1999-10-15",
    overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.",
    genres: [{ id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
    runtime: 139,
    tagline: "Mischief. Mayhem. Soap.",
    budget: 63000000,
    revenue: 100853753,
    poster_path: "/bptf4GE26qjBh5adzxhJtr6Vil6.jpg",
    backdrop_path: "/hZup7Qxtcc49257g4dJe4tO1756.jpg"
  },
  9: {
    id: 9,
    title: "The Lord of the Rings: The Fellowship of the Ring",
    vote_average: 8.9,
    release_date: "2001-12-19",
    overview: "An ancient Ring thought lost for centuries has been found, and by a strange twist of fate has been given to a small Hobbit named Frodo.",
    genres: [{ id: 12, name: "Adventure" }, { id: 14, name: "Fantasy" }, { id: 28, name: "Action" }],
    runtime: 178,
    tagline: "One Ring to rule them all.",
    budget: 93000000,
    revenue: 897690072,
    poster_path: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    backdrop_path: "/dUVbWINfRMGojGZRcO6GF1Z2nV8.jpg"
  },
  10: {
    id: 10,
    title: "Goodfellas",
    vote_average: 8.7,
    release_date: "1990-09-19",
    overview: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners Jimmy Conway and Tommy DeVito in the Italian-American crime syndicate.",
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
    runtime: 145,
    tagline: "Three Decades of Life in the Mafia.",
    budget: 25000000,
    revenue: 46836214,
    poster_path: "/aKuFiZ82hs5OIxD512vJ7tKeLOd.jpg",
    backdrop_path: "/sw7mordTX1n4k072usrdf6A2GsI.jpg"
  },
  11: {
    id: 11,
    title: "The Godfather",
    vote_average: 9.2,
    release_date: "1972-03-24",
    overview: "The aging patriarch of an organized crime dynasty in postwar New York City transfers control of his clandestine empire to his reluctant youngest son.",
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
    runtime: 175,
    tagline: "An offer you can't refuse.",
    budget: 6000000,
    revenue: 245066411,
    poster_path: "/3bhkrj6PjOqZEjjxpoGJA4AO06m.jpg",
    backdrop_path: "/tmU7GeKVZ2uOD5QpqSE3rS7I65C.jpg"
  },
  12: {
    id: 12,
    title: "Parasite",
    vote_average: 8.5,
    release_date: "2019-05-30",
    overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
    genres: [{ id: 35, name: "Comedy" }, { id: 53, name: "Thriller" }, { id: 18, name: "Drama" }],
    runtime: 132,
    tagline: "Act like you own the place.",
    budget: 11400000,
    revenue: 263138861,
    poster_path: "/7BsvGVjwPZbL91PzL7x9tG1G2c6.jpg",
    backdrop_path: "/z8267z87f5A6xZ9g5W3y4t85A.jpg"
  },
  13: {
    id: 13,
    title: "Spirited Away",
    vote_average: 8.5,
    release_date: "2001-07-20",
    overview: "A young girl, Chihiro, becomes trapped in a mysterious spirit world. After her parents are transformed into pigs, she must work in a bathhouse to find a way to free them and return to the human world.",
    genres: [{ id: 16, name: "Animation" }, { id: 14, name: "Fantasy" }, { id: 10751, name: "Family" }],
    runtime: 125,
    tagline: "Nothing that happens is ever forgotten, even if you can't remember it.",
    budget: 19000000,
    revenue: 395800000,
    poster_path: "/39wmItIWsg5sclgU4ywZydlgmgq.jpg",
    backdrop_path: "/b9589fe565551ba3ca98c2d829.jpg"
  },
  14: {
    id: 14,
    title: "Gladiator",
    vote_average: 8.2,
    release_date: "2000-05-01",
    overview: "In the final years of Marcus Aurelius' reign, Maximus is a powerful Roman general, loved by the people and the aging Emperor. Before his death, the Emperor chooses Maximus to be his heir over his own son, Commodus, and a power struggle leaves Maximus and his family condemned to death.",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 18, name: "Drama" }],
    runtime: 155,
    tagline: "What we do in life echoes in eternity.",
    budget: 103000000,
    revenue: 465400000,
    poster_path: "/ty8ikj24UNxticv6yq2n86qc.jpg",
    backdrop_path: "/gladiator_backdrop.jpg"
  },
  15: {
    id: 15,
    title: "Joker",
    vote_average: 8.2,
    release_date: "2019-10-02",
    overview: "During the 1980s, a failed stand-up comedian is driven insane and turns to a life of crime and chaos in Gotham City while becoming an infamous psychopathic crime figure.",
    genres: [{ id: 80, name: "Crime" }, { id: 53, name: "Thriller" }, { id: 18, name: "Drama" }],
    runtime: 122,
    tagline: "Put on a happy face.",
    budget: 55000000,
    revenue: 1074000000,
    poster_path: "/udDclJoHjfjb8Ekgsd4FDte21p.jpg",
    backdrop_path: "/joker_backdrop.jpg"
  },
  16: {
    id: 16,
    title: "Whiplash",
    vote_average: 8.4,
    release_date: "2014-10-10",
    overview: "Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, even his humanity.",
    genres: [{ id: 18, name: "Drama" }, { id: 10402, name: "Music" }],
    runtime: 106,
    tagline: "Not quite my tempo.",
    budget: 3300000,
    revenue: 49000000,
    poster_path: "/71t2wNt2rJ7f8C7A5Q5Z4y8n0A.jpg",
    backdrop_path: "/whiplash_backdrop.jpg"
  },
  17: {
    id: 17,
    title: "Django Unchained",
    vote_average: 8.1,
    release_date: "2012-12-25",
    overview: "With the help of a German bounty hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.",
    genres: [{ id: 18, name: "Drama" }, { id: 37, name: "Western" }, { id: 28, name: "Action" }],
    runtime: 165,
    tagline: "Life, liberty and the pursuit of vengeance.",
    budget: 100000000,
    revenue: 425400000,
    poster_path: "/django_poster.jpg",
    backdrop_path: "/django_backdrop.jpg"
  },
  18: {
    id: 18,
    title: "The Lion King",
    vote_average: 8.3,
    release_date: "1994-06-23",
    overview: "A young lion prince is cast out of his pride by his cruel uncle, who claims he killed his father. While the uncle rules with an iron paw, the prince grows up beyond the Savannah, living by a philosophy: No worries.",
    genres: [{ id: 16, name: "Animation" }, { id: 10751, name: "Family" }, { id: 18, name: "Drama" }],
    runtime: 89,
    tagline: "Life's greatest adventure is finding your place in the Circle of Life.",
    budget: 45000000,
    revenue: 968500000,
    poster_path: "/lion_king_poster.jpg",
    backdrop_path: "/lion_king_backdrop.jpg"
  },
  19: {
    id: 19,
    title: "Avengers: Endgame",
    vote_average: 8.3,
    release_date: "2019-04-24",
    overview: "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 878, name: "Sci-Fi" }],
    runtime: 181,
    tagline: "Part of the journey is the end.",
    budget: 356000000,
    revenue: 2798000000,
    poster_path: "/avengers_endgame_poster.jpg",
    backdrop_path: "/avengers_endgame_backdrop.jpg"
  },
  20: {
    id: 20,
    title: "Star Wars: A New Hope",
    vote_average: 8.2,
    release_date: "1977-05-25",
    overview: "Princess Leia is held hostage by the evil Imperial forces in their effort to take over the galactic Empire. Luke Skywalker, a young farm boy, and Han Solo, a rogue pilot, team up to rescue the princess and save the galaxy.",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 878, name: "Sci-Fi" }],
    runtime: 121,
    tagline: "A long time ago in a galaxy far, far away...",
    budget: 11000000,
    revenue: 775000000,
    poster_path: "/star_wars_poster.jpg",
    backdrop_path: "/star_wars_backdrop.jpg"
  },
  21: {
    id: 21,
    title: "Se7en",
    vote_average: 8.3,
    release_date: "1995-09-22",
    overview: "Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives.",
    genres: [{ id: 80, name: "Crime" }, { id: 9648, name: "Mystery" }, { id: 53, name: "Thriller" }],
    runtime: 127,
    tagline: "Seven deadly sins. Seven deadly ways to die.",
    budget: 33000000,
    revenue: 327000000,
    poster_path: "/se7en_poster.jpg",
    backdrop_path: "/se7en_backdrop.jpg"
  },
  22: {
    id: 22,
    title: "The Silence of the Lambs",
    vote_average: 8.3,
    release_date: "1991-02-14",
    overview: "A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal killer to help catch another serial killer, a madman who skins his victims.",
    genres: [{ id: 80, name: "Crime" }, { id: 27, name: "Horror" }, { id: 53, name: "Thriller" }],
    runtime: 118,
    tagline: "To enter the mind of a killer she must challenge the mind of a madman.",
    budget: 19000000,
    revenue: 272700000,
    poster_path: "/silence_lambs_poster.jpg",
    backdrop_path: "/silence_lambs_backdrop.jpg"
  },
  23: {
    id: 23,
    title: "Inglourious Basterds",
    vote_average: 8.2,
    release_date: "2009-08-19",
    overview: "In Nazi-occupied France during World War II, a plan to assassinate Nazi leaders by a group of Jewish U.S. soldiers coincides with a theatre owner's vengeful plans for the same.",
    genres: [{ id: 28, name: "Action" }, { id: 18, name: "Drama" }, { id: 10752, name: "War" }],
    runtime: 153,
    tagline: "Once upon a time in Nazi-occupied France...",
    budget: 70000000,
    revenue: 321400000,
    poster_path: "/basterds_poster.jpg",
    backdrop_path: "/basterds_backdrop.jpg"
  },
  24: {
    id: 24,
    title: "Saving Private Ryan",
    vote_average: 8.4,
    release_date: "1998-07-24",
    overview: "Following the Normandy Landings, a group of U.S. soldiers go behind enemy lines to retrieve a paratrooper whose brothers have been killed in action.",
    genres: [{ id: 18, name: "Drama" }, { id: 36, name: "History" }, { id: 10752, name: "War" }],
    runtime: 169,
    tagline: "The mission is a man.",
    budget: 70000000,
    revenue: 481800000,
    poster_path: "/saving_ryan_poster.jpg",
    backdrop_path: "/saving_ryan_backdrop.jpg"
  },
  25: {
    id: 25,
    title: "The Prestige",
    vote_average: 8.4,
    release_date: "2006-10-19",
    overview: "After a tragic accident, two stage magicians in 1890s London engage in a battle to create the ultimate illusion while sacrificing everything they have to outwit each other.",
    genres: [{ id: 18, name: "Drama" }, { id: 9648, name: "Mystery" }, { id: 878, name: "Sci-Fi" }],
    runtime: 130,
    tagline: "Are you watching closely?",
    budget: 40000000,
    revenue: 109700000,
    poster_path: "/prestige_poster.jpg",
    backdrop_path: "/prestige_backdrop.jpg"
  },
  26: {
    id: 26,
    title: "The Departed",
    vote_average: 8.2,
    release_date: "2006-10-05",
    overview: "An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in South Boston.",
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }, { id: 53, name: "Thriller" }],
    runtime: 151,
    tagline: "Lies. Betrayal. Sacrifice. How far will you take it?",
    budget: 90000000,
    revenue: 291500000,
    poster_path: "/departed_poster.jpg",
    backdrop_path: "/departed_backdrop.jpg"
  },
  27: {
    id: 27,
    title: "Memento",
    vote_average: 8.2,
    release_date: "2000-10-11",
    overview: "A man with short-term memory loss attempts to track down his wife's murderer.",
    genres: [{ id: 9648, name: "Mystery" }, { id: 53, name: "Thriller" }],
    runtime: 113,
    tagline: "Some memories are best forgotten.",
    budget: 9000000,
    revenue: 39700000,
    poster_path: "/memento_poster.jpg",
    backdrop_path: "/memento_backdrop.jpg"
  },
  28: {
    id: 28,
    title: "WALL·E",
    vote_average: 8.1,
    release_date: "2008-06-23",
    overview: "In the distant future, a small waste-collecting robot inadvertently embarks on a space journey that will ultimately decide the fate of mankind.",
    genres: [{ id: 16, name: "Animation" }, { id: 10751, name: "Family" }, { id: 878, name: "Sci-Fi" }],
    runtime: 98,
    tagline: "In Space, No One Can Hear You Clean.",
    budget: 180000000,
    revenue: 533300000,
    poster_path: "/walle_poster.jpg",
    backdrop_path: "/walle_backdrop.jpg"
  },
  29: {
    id: 29,
    title: "Ratatouille",
    vote_average: 7.8,
    release_date: "2007-06-22",
    overview: "A rat who can cook makes an unusual alliance with a young kitchen worker at a famous Paris restaurant.",
    genres: [{ id: 16, name: "Animation" }, { id: 35, name: "Comedy" }, { id: 10751, name: "Family" }],
    runtime: 111,
    tagline: "He's dying to become a chef.",
    budget: 150000000,
    revenue: 620700000,
    poster_path: "/ratatouille_poster.jpg",
    backdrop_path: "/ratatouille_backdrop.jpg"
  },
  30: {
    id: 30,
    title: "Spider-Man: Into the Spider-Verse",
    vote_average: 8.4,
    release_date: "2018-12-06",
    overview: "Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.",
    genres: [{ id: 16, name: "Animation" }, { id: 28, name: "Action" }, { id: 12, name: "Adventure" }],
    runtime: 117,
    tagline: "More than one wears the mask.",
    budget: 90000000,
    revenue: 375500000,
    poster_path: "/spider_verse_poster.jpg",
    backdrop_path: "/spider_verse_backdrop.jpg"
  },
  31: {
    id: 31,
    title: "The Lord of the Rings: The Return of the King",
    vote_average: 9.0,
    release_date: "2003-12-17",
    overview: "Aragorn is revealed as the heir to the ancient kings as he, Gandalf and the other members of the broken fellowship struggle to save Gondor from Sauron's forces.",
    genres: [{ id: 12, name: "Adventure" }, { id: 14, name: "Fantasy" }, { id: 28, name: "Action" }],
    runtime: 201,
    tagline: "The Eye of the Enemy is moving.",
    budget: 94000000,
    revenue: 1146030912,
    poster_path: "/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
    backdrop_path: "/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg"
  },
  32: {
    id: 32,
    title: "Schindler's List",
    vote_average: 9.0,
    release_date: "1993-12-15",
    overview: "The true story of enigmatic businessman Oskar Schindler, who saved the lives of more than 1,100 Jews during the Holocaust.",
    genres: [{ id: 18, name: "Drama" }, { id: 36, name: "History" }, { id: 10752, name: "War" }],
    runtime: 195,
    tagline: "Whoever saves one life, saves the world entire.",
    budget: 22000000,
    revenue: 321306305,
    poster_path: "/sF1avSdh7laycrD6SCX1euFb.jpg",
    backdrop_path: "/schindler_backdrop.jpg"
  },
  33: {
    id: 33,
    title: "12 Angry Men",
    vote_average: 9.0,
    release_date: "1957-04-10",
    overview: "The defense and the prosecution have rested and the jury is filing into the jury room to decide if a young Spanish-American associate is guilty of murdering his father.",
    genres: [{ id: 18, name: "Drama" }],
    runtime: 96,
    tagline: "Life is in their hands. Death is on their minds.",
    budget: 350000,
    revenue: 4360000,
    poster_path: "/pp8ikj24UNxticv6yq2n86qc.jpg",
    backdrop_path: "/12_angry_men_backdrop.jpg"
  },
  34: {
    id: 34,
    title: "The Godfather Part II",
    vote_average: 9.0,
    release_date: "1974-12-20",
    overview: "The continuing saga of the Corleone crime family is told as a young Vito Corleone grows up in Sicily and in 1910s New York.",
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
    runtime: 202,
    tagline: "I don't feel I have to wipe everybody out, Tom. Just my enemies.",
    budget: 13000000,
    revenue: 47542841,
    poster_path: "/godfather2_poster.jpg",
    backdrop_path: "/godfather2_backdrop.jpg"
  },
  35: {
    id: 35,
    title: "The Lord of the Rings: The Two Towers",
    vote_average: 8.9,
    release_date: "2002-12-18",
    overview: "Frodo and Sam discover they are being followed by the mysterious Gollum, while Aragorn, Legolas and Gimli face the besieged kingdom of Rohan.",
    genres: [{ id: 12, name: "Adventure" }, { id: 14, name: "Fantasy" }, { id: 28, name: "Action" }],
    runtime: 179,
    tagline: "A New Evil Awakens.",
    budget: 94000000,
    revenue: 947897272,
    poster_path: "/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg",
    backdrop_path: "/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg"
  },
  36: {
    id: 36,
    title: "Star Wars: The Empire Strikes Back",
    vote_average: 8.8,
    release_date: "1980-05-21",
    overview: "The epic adventure continues as Luke Skywalker, Han Solo, and Princess Leia face Imperial forces on the ice planet Hoth.",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 878, name: "Sci-Fi" }],
    runtime: 124,
    tagline: "The Adventure Continues...",
    budget: 18000000,
    revenue: 538400000,
    poster_path: "/empire_strikes_back_poster.jpg",
    backdrop_path: "/empire_strikes_back_backdrop.jpg"
  },
  37: {
    id: 37,
    title: "The Green Mile",
    vote_average: 8.8,
    release_date: "1999-12-10",
    overview: "A supernatural tale set on death row in a Southern prison, where gentle giant John Coffey possesses the mysterious power to heal people's ailments.",
    genres: [{ id: 18, name: "Drama" }, { id: 14, name: "Fantasy" }, { id: 80, name: "Crime" }],
    runtime: 189,
    tagline: "Miracles happen in the most unexpected places.",
    budget: 60000000,
    revenue: 286800000,
    poster_path: "/green_mile_poster.jpg",
    backdrop_path: "/green_mile_backdrop.jpg"
  },
  38: {
    id: 38,
    title: "Titanic",
    vote_average: 7.9,
    release_date: "1997-12-19",
    overview: "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.",
    genres: [{ id: 18, name: "Drama" }, { id: 10749, name: "Romance" }],
    runtime: 194,
    tagline: "Nothing on Earth could come between them.",
    budget: 200000000,
    revenue: 2264162353,
    poster_path: "/titanic_poster.jpg",
    backdrop_path: "/titanic_backdrop.jpg"
  },
  39: {
    id: 39,
    title: "The Usual Suspects",
    vote_average: 8.4,
    release_date: "1995-08-16",
    overview: "A sole survivor tells of the twisty events leading up to a horrific gun battle on a boat, which began when five criminals met at a police lineup.",
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }, { id: 9648, name: "Mystery" }],
    runtime: 106,
    tagline: "The greatest trick the devil ever pulled was convincing the world he didn't exist.",
    budget: 6000000,
    revenue: 34300000,
    poster_path: "/usual_suspects_poster.jpg",
    backdrop_path: "/usual_suspects_backdrop.jpg"
  },
  40: {
    id: 40,
    title: "Psycho",
    vote_average: 8.4,
    release_date: "1960-06-16",
    overview: "A Phoenix secretary embezzles $40,000 from her employer's client, goes on the run, and checks into a remote motel run by a young man under the domination of his mother.",
    genres: [{ id: 27, name: "Horror" }, { id: 53, name: "Thriller" }, { id: 9648, name: "Mystery" }],
    runtime: 109,
    tagline: "The master of suspense moves you to a new peak of excitement!",
    budget: 800000,
    revenue: 32000000,
    poster_path: "/psycho_poster.jpg",
    backdrop_path: "/psycho_backdrop.jpg"
  },
  41: {
    id: 41,
    title: "Leon: The Professional",
    vote_average: 8.5,
    release_date: "1994-09-14",
    overview: "A professional assassin takes in a twelve-year-old girl after her family is murdered by corrupt DEA agents.",
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 18, name: "Drama" }],
    runtime: 110,
    tagline: "If you want a job done well, hire a professional.",
    budget: 16000000,
    revenue: 46100000,
    poster_path: "/leon_poster.jpg",
    backdrop_path: "/leon_backdrop.jpg"
  },
  42: {
    id: 42,
    title: "American History X",
    vote_average: 8.5,
    release_date: "1998-10-30",
    overview: "A former neo-nazi skinhead tries to prevent his younger brother from going down the same wrong path that he did.",
    genres: [{ id: 18, name: "Drama" }],
    runtime: 119,
    tagline: "Some Legacies Must End.",
    budget: 20000000,
    revenue: 23900000,
    poster_path: "/american_history_x_poster.jpg",
    backdrop_path: "/american_history_x_backdrop.jpg"
  },
  43: {
    id: 43,
    title: "Casablanca",
    vote_average: 8.5,
    release_date: "1942-11-26",
    overview: "In December 1941, a cynical American expatriate encounters a former lover in Casablanca, Morocco, with complications.",
    genres: [{ id: 18, name: "Drama" }, { id: 10749, name: "Romance" }],
    runtime: 102,
    tagline: "They have a date with fate in Casablanca!",
    budget: 950000,
    revenue: 10400000,
    poster_path: "/casablanca_poster.jpg",
    backdrop_path: "/casablanca_backdrop.jpg"
  },
  44: {
    id: 44,
    title: "City of God",
    vote_average: 8.4,
    release_date: "2002-08-30",
    overview: "In the slums of Rio, two kids choose different paths: one becomes a photographer, the other a drug dealer.",
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
    runtime: 130,
    tagline: "If you run, the beast catches you; if you stay, the beast eats you.",
    budget: 3300000,
    revenue: 30600000,
    poster_path: "/city_of_god_poster.jpg",
    backdrop_path: "/city_of_god_backdrop.jpg"
  },
  45: {
    id: 45,
    title: "Once Upon a Time in America",
    vote_average: 8.4,
    release_date: "1984-06-01",
    overview: "A former Prohibition-era Jewish gangster returns to the Lower East Side of Manhattan, where he must confront the ghosts and regrets of his past.",
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
    runtime: 229,
    tagline: "Crime, passion and lust for power.",
    budget: 30000000,
    revenue: 5300000,
    poster_path: "/once_upon_america_poster.jpg",
    backdrop_path: "/once_upon_america_backdrop.jpg"
  },
  46: {
    id: 46,
    title: "The Pianist",
    vote_average: 8.4,
    release_date: "2002-09-24",
    overview: "A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto during World War II.",
    genres: [{ id: 18, name: "Drama" }, { id: 36, name: "History" }, { id: 10752, name: "War" }],
    runtime: 150,
    tagline: "Music was his passion. Survival was his masterpiece.",
    budget: 35000000,
    revenue: 120100000,
    poster_path: "/pianist_poster.jpg",
    backdrop_path: "/pianist_backdrop.jpg"
  },
  47: {
    id: 47,
    title: "Sunset Boulevard",
    vote_average: 8.4,
    release_date: "1950-08-10",
    overview: "A screenwriter develops a dangerous relationship with a faded silent movie star who is determined to make a comeback.",
    genres: [{ id: 18, name: "Drama" }],
    runtime: 110,
    tagline: "A Hollywood Story.",
    budget: 1750000,
    revenue: 5000000,
    poster_path: "/sunset_boulevard_poster.jpg",
    backdrop_path: "/sunset_boulevard_backdrop.jpg"
  },
  48: {
    id: 48,
    title: "Back to the Future",
    vote_average: 8.3,
    release_date: "1985-07-03",
    overview: "Marty McFly, a 17-year-old high school student, is accidentally sent thirty years into the past in a time-traveling DeLorean invented by his close friend, the eccentric scientist Doc Brown.",
    genres: [{ id: 12, name: "Adventure" }, { id: 35, name: "Comedy" }, { id: 878, name: "Sci-Fi" }],
    runtime: 116,
    tagline: "He was never in time for his classes... He wasn't in time for his dinner... Then one day... he wasn't in his century at all.",
    budget: 19000000,
    revenue: 381109762,
    poster_path: "/back_to_future_poster.jpg",
    backdrop_path: "/back_to_future_backdrop.jpg"
  },
  49: {
    id: 49,
    title: "Apocalypse Now",
    vote_average: 8.3,
    release_date: "1979-08-15",
    overview: "A U.S. Army officer serving in Vietnam is tasked with assassinating a renegade Special Forces Colonel who sees himself as a god.",
    genres: [{ id: 18, name: "Drama" }, { id: 10752, name: "War" }],
    runtime: 147,
    tagline: "This is the end.",
    budget: 31000000,
    revenue: 150000000,
    poster_path: "/apocalypse_now_poster.jpg",
    backdrop_path: "/apocalypse_now_backdrop.jpg"
  },
  50: {
    id: 50,
    title: "Raiders of the Lost Ark",
    vote_average: 8.4,
    release_date: "1981-06-12",
    overview: "In 1936, archaeologist and adventurer Indiana Jones is hired by the U.S. government to find the Ark of the Covenant before Adolf Hitler's Nazis can obtain its awesome powers.",
    genres: [{ id: 12, name: "Adventure" }, { id: 28, name: "Action" }],
    runtime: 115,
    tagline: "Indiana Jones - the new hero from the creators of JAWS and STAR WARS.",
    budget: 18000000,
    revenue: 390133212,
    poster_path: "/raiders_lost_ark_poster.jpg",
    backdrop_path: "/raiders_lost_ark_backdrop.jpg"
  },
  51: {
    id: 51,
    title: "Alien",
    vote_average: 8.1,
    release_date: "1979-05-25",
    overview: "After a space merchant vessel receives an unknown transmission as a distress call, one of the crew is attacked by a mysterious life form and they soon realize that its life cycle has only just begun.",
    genres: [{ id: 27, name: "Horror" }, { id: 878, name: "Sci-Fi" }],
    runtime: 117,
    tagline: "In space, no one can hear you scream.",
    budget: 11000000,
    revenue: 106285522,
    poster_path: "/alien_poster.jpg",
    backdrop_path: "/alien_backdrop.jpg"
  },
  52: {
    id: 52,
    title: "Coco",
    vote_average: 8.2,
    release_date: "2017-10-27",
    overview: "Aspiring musician Miguel, confronted with his family's ancestral ban on music, enters the Land of the Dead to find his great-great-grandfather, a legendary singer.",
    genres: [{ id: 16, name: "Animation" }, { id: 10751, name: "Family" }, { id: 14, name: "Fantasy" }],
    runtime: 105,
    tagline: "The celebration of a lifetime.",
    budget: 175000000,
    revenue: 807800000,
    poster_path: "/coco_poster.jpg",
    backdrop_path: "/coco_backdrop.jpg"
  },
  53: {
    id: 53,
    title: "Spider-Man: Across the Spider-Verse",
    vote_average: 8.5,
    release_date: "2023-05-31",
    overview: "After reuniting with Gwen Stacy, Brooklyn's full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
    genres: [{ id: 16, name: "Animation" }, { id: 28, name: "Action" }, { id: 12, name: "Adventure" }],
    runtime: 140,
    tagline: "It's how you wear the mask.",
    budget: 100000000,
    revenue: 690516673,
    poster_path: "/across_spider_verse_poster.jpg",
    backdrop_path: "/across_spider_verse_backdrop.jpg"
  },
  54: {
    id: 54,
    title: "The Dark Knight Rises",
    vote_average: 7.8,
    release_date: "2012-07-16",
    overview: "Eight years after the Joker's reign of anarchy, Batman, with the help of the enigmatic Selina Kyle, is forced from his exile to save Gotham City, now threatened by the brutal guerrilla terrorist Bane.",
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
    runtime: 165,
    tagline: "The Legend Ends.",
    budget: 250000000,
    revenue: 1081169825,
    poster_path: "/dark_knight_rises_poster.jpg",
    backdrop_path: "/dark_knight_rises_backdrop.jpg"
  },
  55: {
    id: 55,
    title: "Avengers: Infinity War",
    vote_average: 8.3,
    release_date: "2018-04-25",
    overview: "As the Avengers and their allies have continued to protect the world from threats too large for any one hero to handle, a new danger has emerged from the cosmic shadows: Thanos.",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 878, name: "Sci-Fi" }],
    runtime: 149,
    tagline: "An entire universe. Once and for all.",
    budget: 321000000,
    revenue: 2048000000,
    poster_path: "/infinity_war_poster.jpg",
    backdrop_path: "/infinity_war_backdrop.jpg"
  },
  56: {
    id: 56,
    title: "The Shining",
    vote_average: 8.2,
    release_date: "1980-05-23",
    overview: "A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence, while his psychic son sees horrific forebodings from both past and future.",
    genres: [{ id: 27, name: "Horror" }, { id: 53, name: "Thriller" }],
    runtime: 146,
    tagline: "He came as the caretaker, but this hotel had its own ideas.",
    budget: 19000000,
    revenue: 47000000,
    poster_path: "/shining_poster.jpg",
    backdrop_path: "/shining_backdrop.jpg"
  },
  57: {
    id: 57,
    title: "Reservoir Dogs",
    vote_average: 8.2,
    release_date: "1992-09-02",
    overview: "When a simple jewelry heist goes horribly wrong, the surviving criminals begin to suspect that one of them is a police informant.",
    genres: [{ id: 80, name: "Crime" }, { id: 53, name: "Thriller" }],
    runtime: 99,
    tagline: "Let's Get To Work.",
    budget: 1200000,
    revenue: 2800000,
    poster_path: "/reservoir_dogs_poster.jpg",
    backdrop_path: "/reservoir_dogs_backdrop.jpg"
  },
  58: {
    id: 58,
    title: "Braveheart",
    vote_average: 8.3,
    release_date: "1995-05-24",
    overview: "William Wallace begins a revolt against King Edward I of England after the love of his life is killed.",
    genres: [{ id: 28, name: "Action" }, { id: 18, name: "Drama" }, { id: 36, name: "History" }, { id: 10752, name: "War" }],
    runtime: 178,
    tagline: "Every man dies. Not every man really lives.",
    budget: 72000000,
    revenue: 210400000,
    poster_path: "/braveheart_poster.jpg",
    backdrop_path: "/braveheart_backdrop.jpg"
  },
  59: {
    id: 59,
    title: "Toy Story",
    vote_average: 8.0,
    release_date: "1995-10-30",
    overview: "Led by Woody, Andy's toys live happily in his room until Andy's birthday brings Buzz Lightyear onto the scene.",
    genres: [{ id: 16, name: "Animation" }, { id: 35, name: "Comedy" }, { id: 10751, name: "Family" }],
    runtime: 81,
    tagline: "The toy story that changed everything.",
    budget: 30000000,
    revenue: 373000000,
    poster_path: "/toy_story_poster.jpg",
    backdrop_path: "/toy_story_backdrop.jpg"
  },
  60: {
    id: 60,
    title: "Amadeus",
    vote_average: 8.4,
    release_date: "1984-09-19",
    overview: "The life, success and troubles of Wolfgang Amadeus Mozart, as told by Antonio Salieri, the contemporary composer who was insanely jealous of Mozart's talent and claimed to have murdered him.",
    genres: [{ id: 18, name: "Drama" }, { id: 36, name: "History" }, { id: 10402, name: "Music" }],
    runtime: 160,
    tagline: "Everything you've heard is true.",
    budget: 18000000,
    revenue: 90000000,
    poster_path: "/amadeus_poster.jpg",
    backdrop_path: "/amadeus_backdrop.jpg"
  },
  61: {
    id: 61,
    title: "Star Wars: Return of the Jedi",
    vote_average: 8.3,
    release_date: "1983-05-25",
    overview: "After a daring mission to rescue Han Solo from Jabba the Hutt, the Rebels dispatch to Endor to destroy the second Death Star.",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 878, name: "Sci-Fi" }],
    runtime: 131,
    tagline: "The Saga Continues...",
    budget: 32500000,
    revenue: 475000000,
    poster_path: "/return_of_the_jedi_poster.jpg",
    backdrop_path: "/return_of_the_jedi_backdrop.jpg"
  },
  62: {
    id: 62,
    title: "Heat",
    vote_average: 8.3,
    release_date: "1995-12-15",
    overview: "A group of high-end professional thieves start to feel the heat from the LAPD when they unknowingly leave a clue at their latest heist.",
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 53, name: "Thriller" }],
    runtime: 170,
    tagline: "A Los Angeles Crime Saga.",
    budget: 60000000,
    revenue: 187000000,
    poster_path: "/heat_poster.jpg",
    backdrop_path: "/heat_backdrop.jpg"
  },
  63: {
    id: 63,
    title: "Up",
    vote_average: 8.0,
    release_date: "2009-05-28",
    overview: "78-year-old Carl Fredricksen travels to Paradise Falls in his house equipped with balloons, inadvertently taking a young stowaway.",
    genres: [{ id: 16, name: "Animation" }, { id: 35, name: "Comedy" }, { id: 10751, name: "Family" }, { id: 12, name: "Adventure" }],
    runtime: 96,
    tagline: "Fly away to adventure.",
    budget: 175000000,
    revenue: 735100000,
    poster_path: "/up_poster.jpg",
    backdrop_path: "/up_backdrop.jpg"
  },
  64: {
    id: 64,
    title: "Inside Out",
    vote_average: 7.9,
    release_date: "2015-06-17",
    overview: "After young Riley is uprooted from her Midwest life and moved to San Francisco, her emotions - Joy, Fear, Anger, Disgust and Sadness - conflict on how best to navigate a new city, house and school.",
    genres: [{ id: 16, name: "Animation" }, { id: 35, name: "Comedy" }, { id: 10751, name: "Family" }],
    runtime: 95,
    tagline: "Meet the little voices inside your head.",
    budget: 175000000,
    revenue: 858800000,
    poster_path: "/inside_out_poster.jpg",
    backdrop_path: "/inside_out_backdrop.jpg"
  },
  65: {
    id: 65,
    title: "Jurassic Park",
    vote_average: 8.1,
    release_date: "1993-06-11",
    overview: "A pragmatic paleontologist touring an almost complete theme park on an island in Central America is tasked with protecting a couple of kids after a power failure causes the park's cloned dinosaurs to run loose.",
    genres: [{ id: 12, name: "Adventure" }, { id: 878, name: "Sci-Fi" }],
    runtime: 127,
    tagline: "An Adventure 65 Million Years In The Making.",
    budget: 63000000,
    revenue: 1029000000,
    poster_path: "/jurassic_park_poster.jpg",
    backdrop_path: "/jurassic_park_backdrop.jpg"
  },
  66: {
    id: 66,
    title: "Princess Mononoke",
    vote_average: 8.3,
    release_date: "1997-07-12",
    overview: "On a journey to find the cure for a Tatarigami's curse, Ashitaka finds himself in the middle of a war between the forest gods and Tatara, a mining colony. In this quest he also meets San, the Mononoke Hime.",
    genres: [{ id: 16, name: "Animation" }, { id: 12, name: "Adventure" }, { id: 14, name: "Fantasy" }],
    runtime: 134,
    tagline: "The Fate of the World Rests on His Shoulders.",
    budget: 20000000,
    revenue: 169700000,
    poster_path: "/mononoke_poster.jpg",
    backdrop_path: "/mononoke_backdrop.jpg"
  },
  67: {
    id: 67,
    title: "Your Name.",
    vote_average: 8.5,
    release_date: "2016-08-26",
    overview: "Two strangers find themselves linked in a bizarre way. When a connection is formed, will distance be the only thing to keep them apart?",
    genres: [{ id: 16, name: "Animation" }, { id: 18, name: "Drama" }, { id: 10749, name: "Romance" }, { id: 14, name: "Fantasy" }],
    runtime: 106,
    tagline: "Searching for each other.",
    budget: 3000000,
    revenue: 382000000,
    poster_path: "/your_name_poster.jpg",
    backdrop_path: "/your_name_backdrop.jpg"
  },
  68: {
    id: 68,
    title: "Finding Nemo",
    vote_average: 7.8,
    release_date: "2003-05-30",
    overview: "After his son is captured in the Great Barrier Reef and taken to Sydney, a timid clownfish embarks on a journey to bring him home.",
    genres: [{ id: 16, name: "Animation" }, { id: 10751, name: "Family" }],
    runtime: 100,
    tagline: "There are 3.7 trillion fish in the ocean. They're looking for one.",
    budget: 94000000,
    revenue: 940300000,
    poster_path: "/finding_nemo_poster.jpg",
    backdrop_path: "/finding_nemo_backdrop.jpg"
  },
  69: {
    id: 69,
    title: "Monsters, Inc.",
    vote_average: 8.0,
    release_date: "2001-11-02",
    overview: "In order to power the city, monsters have to scare children so that they scream. However, the children are toxic to the monsters, and after a child gets through, 2 monsters realize things may not be what they seem.",
    genres: [{ id: 16, name: "Animation" }, { id: 10751, name: "Family" }, { id: 35, name: "Comedy" }],
    runtime: 92,
    tagline: "We Scare Because We Care.",
    budget: 115000000,
    revenue: 577400000,
    poster_path: "/monsters_inc_poster.jpg",
    backdrop_path: "/monsters_inc_backdrop.jpg"
  },
  70: {
    id: 70,
    title: "Howl's Moving Castle",
    vote_average: 8.4,
    release_date: "2004-11-20",
    overview: "When an unconfident young woman is cursed with an old body by a spiteful witch, her only chance of breaking the spell lies to a self-indulgent yet insecure young wizard and his companions in his leg, walking castle.",
    genres: [{ id: 16, name: "Animation" }, { id: 14, name: "Fantasy" }, { id: 10751, name: "Family" }],
    runtime: 119,
    tagline: "The Two Lived There.",
    budget: 24000000,
    revenue: 236000000,
    poster_path: "/howls_castle_poster.jpg",
    backdrop_path: "/howls_castle_backdrop.jpg"
  },
  71: {
    id: 71,
    title: "The Wolf of Wall Street",
    vote_average: 8.0,
    release_date: "2013-12-25",
    overview: "Based on the true story of Jordan Belfort, from his rise to a wealthy stock-broker living the high life to his fall involving crime, corruption and the federal government.",
    genres: [{ id: 35, name: "Comedy" }, { id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
    runtime: 180,
    tagline: "ENTERTAINING. WILD. SPECTACULAR.",
    budget: 100000000,
    revenue: 406900000,
    poster_path: "/wolf_wall_street_poster.jpg",
    backdrop_path: "/wolf_wall_street_backdrop.jpg"
  },
  72: {
    id: 72,
    title: "No Country for Old Men",
    vote_average: 8.1,
    release_date: "2007-11-09",
    overview: "Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash near the Rio Grande.",
    genres: [{ id: 80, name: "Crime" }, { id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
    runtime: 122,
    tagline: "There Are No Clean Getaways.",
    budget: 25000000,
    revenue: 171600000,
    poster_path: "/no_country_poster.jpg",
    backdrop_path: "/no_country_backdrop.jpg"
  },
  73: {
    id: 73,
    title: "A Beautiful Mind",
    vote_average: 8.1,
    release_date: "2001-12-14",
    overview: "After John Nash, a brilliant but asocial mathematician, accepts secret work in cryptography, his life takes a turn for the nightmarish.",
    genres: [{ id: 18, name: "Drama" }, { id: 10749, name: "Romance" }],
    runtime: 135,
    tagline: "He saw the world in a way no one could have imagined.",
    budget: 58000000,
    revenue: 313500000,
    poster_path: "/beautiful_mind_poster.jpg",
    backdrop_path: "/beautiful_mind_backdrop.jpg"
  },
  74: {
    id: 74,
    title: "Catch Me If You Can",
    vote_average: 8.0,
    release_date: "2002-12-16",
    overview: "Barely 21 yet, Frank Abagnale Jr. has worked as a doctor, a lawyer, and as a co-pilot for a major airline - all before his 18th birthday.",
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }, { id: 35, name: "Comedy" }],
    runtime: 141,
    tagline: "The true story of a real fake.",
    budget: 52000000,
    revenue: 352100000,
    poster_path: "/catch_me_poster.jpg",
    backdrop_path: "/catch_me_backdrop.jpg"
  },
  75: {
    id: 75,
    title: "Shutter Island",
    vote_average: 8.2,
    release_date: "2010-02-14",
    overview: "In 1954, a U.S. Marshal investigates the disappearance of a murderer who escaped from a hospital for the criminally insane on Shutter Island.",
    genres: [{ id: 9648, name: "Mystery" }, { id: 53, name: "Thriller" }, { id: 18, name: "Drama" }],
    runtime: 138,
    tagline: "Someone is missing.",
    budget: 80000000,
    revenue: 294800000,
    poster_path: "/shutter_island_poster.jpg",
    backdrop_path: "/shutter_island_backdrop.jpg"
  },
  76: {
    id: 76,
    title: "Oldboy",
    vote_average: 8.3,
    release_date: "2003-11-21",
    overview: "After being kidnapped and imprisoned for fifteen years, Oh Dae-Su is released, only to find that he must find his captor in five days.",
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 9648, name: "Mystery" }],
    runtime: 120,
    tagline: "15 years of imprisonment, 5 days of vengeance.",
    budget: 3000000,
    revenue: 15000000,
    poster_path: "/oldboy_poster.jpg",
    backdrop_path: "/oldboy_backdrop.jpg"
  },
  77: {
    id: 77,
    title: "The Truman Show",
    vote_average: 8.1,
    release_date: "1998-06-04",
    overview: "An insurance salesman discovers his whole life is actually a reality TV show.",
    genres: [{ id: 35, name: "Comedy" }, { id: 18, name: "Drama" }],
    runtime: 103,
    tagline: "On the air. Unaware.",
    budget: 60000000,
    revenue: 264100000,
    poster_path: "/truman_show_poster.jpg",
    backdrop_path: "/truman_show_backdrop.jpg"
  },
  78: {
    id: 78,
    title: "Eternal Sunshine of the Spotless Mind",
    vote_average: 8.1,
    release_date: "2004-03-19",
    overview: "When their relationship turns sour, a couple undergoes a medical procedure to have each other erased from their memories.",
    genres: [{ id: 18, name: "Drama" }, { id: 878, name: "Sci-Fi" }, { id: 10749, name: "Romance" }],
    runtime: 108,
    tagline: "You can erase someone from your mind. Getting them out of your heart is another story.",
    budget: 20000000,
    revenue: 74000000,
    poster_path: "/eternal_sunshine_poster.jpg",
    backdrop_path: "/eternal_sunshine_backdrop.jpg"
  },
  79: {
    id: 79,
    title: "V for Vendetta",
    vote_average: 8.1,
    release_date: "2005-12-11",
    overview: "In a future British tyranny, a shadowy freedom fighter, known only by the alias of \"V\", plots to overthrow it with the help of a young woman.",
    genres: [{ id: 28, name: "Action" }, { id: 53, name: "Thriller" }, { id: 18, name: "Drama" }],
    runtime: 132,
    tagline: "Remember, remember, the 5th of November.",
    budget: 54000000,
    revenue: 132500000,
    poster_path: "/v_for_vendetta_poster.jpg",
    backdrop_path: "/v_for_vendetta_backdrop.jpg"
  },
  80: {
    id: 80,
    title: "12 Years a Slave",
    vote_average: 8.2,
    release_date: "2013-08-30",
    overview: "In the antebellum United States, Solomon Northup, a free black man from upstate New York, is abducted and sold into slavery.",
    genres: [{ id: 18, name: "Drama" }, { id: 36, name: "History" }],
    runtime: 134,
    tagline: "The extraordinary true story of one man's struggle for survival and freedom.",
    budget: 22000000,
    revenue: 187700000,
    poster_path: "/12_years_slave_poster.jpg",
    backdrop_path: "/12_years_slave_backdrop.jpg"
  },
  81: {
    id: 81,
    title: "3 Idiots",
    vote_average: 8.4,
    release_date: "2009-12-25",
    overview: "Two friends are searching for their long lost companion. They revisit their college days and recall the memories of their friend who inspired them to think differently, even as the rest of the world called them idiots.",
    genres: [{ id: 35, name: "Comedy" }, { id: 18, name: "Drama" }],
    runtime: 170,
    tagline: "All is Well.",
    budget: 11000000,
    revenue: 90000000,
    poster_path: "/3_idiots_poster.jpg",
    backdrop_path: "/3_idiots_backdrop.jpg"
  },
  82: {
    id: 82,
    title: "Dangal",
    vote_average: 8.4,
    release_date: "2016-12-23",
    overview: "Mahavir Singh Phogat, a former wrestler, decides to fulfill his dream of winning a gold medal for his country by training his daughters for the Commonwealth Games.",
    genres: [{ id: 28, name: "Action" }, { id: 18, name: "Drama" }, { id: 10751, name: "Family" }],
    runtime: 161,
    tagline: "Are my girls any less than boys?",
    budget: 10000000,
    revenue: 340000000,
    poster_path: "/dangal_poster.jpg",
    backdrop_path: "/dangal_backdrop.jpg"
  },
  83: {
    id: 83,
    title: "Sholay",
    vote_average: 8.2,
    release_date: "1975-08-15",
    overview: "After his family is murdered by a notorious and ruthless bandit, a retired police officer enlists the help of two outlaws to capture him.",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 18, name: "Drama" }],
    runtime: 204,
    tagline: "The greatest story ever told.",
    budget: 4000000,
    revenue: 50000000,
    poster_path: "/sholay_poster.jpg",
    backdrop_path: "/sholay_backdrop.jpg"
  },
  84: {
    id: 84,
    title: "Dilwale Dulhania Le Jayenge",
    vote_average: 8.3,
    release_date: "1995-10-20",
    overview: "Raj and Simran meet during a trip to Europe and fall in love, but Raj must win over Simran's traditional father to marry her.",
    genres: [{ id: 18, name: "Drama" }, { id: 10749, name: "Romance" }],
    runtime: 189,
    tagline: "Come fall in love.",
    budget: 4000000,
    revenue: 60000000,
    poster_path: "/ddlj_poster.jpg",
    backdrop_path: "/ddlj_backdrop.jpg"
  },
  85: {
    id: 85,
    title: "Gangs of Wasseypur",
    vote_average: 8.2,
    release_date: "2012-06-22",
    overview: "A clash between Sultan and Shahid Khan leads to Shahid's expulsion from Wasseypur, igniting a deadly three-generation coal mafia feud.",
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 18, name: "Drama" }],
    runtime: 321,
    tagline: "The search for vengeance.",
    budget: 3000000,
    revenue: 10000000,
    poster_path: "/wasseypur_poster.jpg",
    backdrop_path: "/wasseypur_backdrop.jpg"
  },
  86: {
    id: 86,
    title: "Lagaan",
    vote_average: 8.1,
    release_date: "2001-06-15",
    overview: "In Victorian India, a resilient group of villagers stake their future on a game of cricket against their ruthless British rulers.",
    genres: [{ id: 18, name: "Drama" }, { id: 36, name: "History" }],
    runtime: 224,
    tagline: "Once upon a time in India.",
    budget: 6000000,
    revenue: 30000000,
    poster_path: "/lagaan_poster.jpg",
    backdrop_path: "/lagaan_backdrop.jpg"
  },
  87: {
    id: 87,
    title: "Zindagi Na Milegi Dobara",
    vote_average: 8.1,
    release_date: "2011-06-24",
    overview: "Three friends decide to turn their fantasy bachelor road trip into a reality after one of them gets engaged.",
    genres: [{ id: 35, name: "Comedy" }, { id: 18, name: "Drama" }, { id: 10749, name: "Romance" }],
    runtime: 155,
    tagline: "You only live once.",
    budget: 8000000,
    revenue: 25000000,
    poster_path: "/znmd_poster.jpg",
    backdrop_path: "/znmd_backdrop.jpg"
  },
  88: {
    id: 88,
    title: "Andhadhun",
    vote_average: 8.2,
    release_date: "2018-10-05",
    overview: "A series of mysterious events changes the life of a blind pianist, who now must report a crime that he should not have seen.",
    genres: [{ id: 80, name: "Crime" }, { id: 35, name: "Comedy" }, { id: 53, name: "Thriller" }],
    runtime: 139,
    tagline: "What you can't see will hurt you.",
    budget: 4000000,
    revenue: 64000000,
    poster_path: "/andhadhun_poster.jpg",
    backdrop_path: "/andhadhun_backdrop.jpg"
  },
  89: {
    id: 89,
    title: "Baahubali: The Beginning",
    vote_average: 8.0,
    release_date: "2015-07-10",
    overview: "In ancient India, an adventurous man helps his love rescue her former queen from a tyrannical ruler.",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 14, name: "Fantasy" }],
    runtime: 159,
    tagline: "The beginning of a legend.",
    budget: 18000000,
    revenue: 100000000,
    poster_path: "/baahubali_poster.jpg",
    backdrop_path: "/baahubali_backdrop.jpg"
  },
  90: {
    id: 90,
    title: "Kahaani",
    vote_average: 8.1,
    release_date: "2012-03-09",
    overview: "A pregnant woman's search for her missing husband takes her from London to Kolkata, but everyone she questions denies having ever met him.",
    genres: [{ id: 9648, name: "Mystery" }, { id: 53, name: "Thriller" }, { id: 18, name: "Drama" }],
    runtime: 122,
    tagline: "A mother's quest.",
    budget: 2000000,
    revenue: 15000000,
    poster_path: "/kahaani_poster.jpg",
    backdrop_path: "/kahaani_backdrop.jpg"
  },
  // ===== 2026 NOW PLAYING (Released movies — newest first) =====
  91: {
    id: 91,
    title: "Moana",
    vote_average: 7.4,
    release_date: "2026-07-10",
    overview: "In this live-action reimagining, Moana, a spirited teenager from a Polynesian village, sets sail on a daring mission to save her people, discovering the one thing she always sought: her own identity.",
    genres: [{ id: 12, name: "Adventure" }, { id: 10751, name: "Family" }, { id: 14, name: "Fantasy" }],
    runtime: 120,
    tagline: "The ocean is calling.",
    poster_path: "/zKVgiv5qHCvCLT4A2ymJi5QeXDH.jpg",
    backdrop_path: "/c6U1Te0p0FK0BOB43hiwGlBKiVY.jpg"
  },
  92: {
    id: 92,
    title: "Evil Dead Burn",
    vote_average: 7.1,
    release_date: "2026-07-09",
    overview: "A group of friends discover the Necronomicon in a remote cabin, unleashing an ancient evil that possesses them one by one in this terrifying new installment of the Evil Dead franchise.",
    genres: [{ id: 27, name: "Horror" }, { id: 53, name: "Thriller" }],
    runtime: 98,
    tagline: "Evil never dies. It burns.",
    poster_path: "/ztadKzIIR0ERYqpHteaPFtk7inP.jpg",
    backdrop_path: "/A5Tz6ogGt4VV8NESG9oWVct5bo1.jpg"
  },
  93: {
    id: 93,
    title: "Alpha",
    vote_average: 7.6,
    release_date: "2026-07-03",
    overview: "A super-spy faces her most dangerous mission yet when a rogue agent from her own agency threatens global security in this action-packed entry from the YRF Spy Universe.",
    genres: [{ id: 28, name: "Action" }, { id: 53, name: "Thriller" }, { id: 878, name: "Sci-Fi" }],
    runtime: 145,
    tagline: "Fear meets its match.",
    poster_path: "/bPtRt3ajQ0EkyeQ1O6iJwAIi9Py.jpg",
    backdrop_path: "/b4WXm5ahmtubYXy3wqHUG2nUKoM.jpg"
  },
  94: {
    id: 94,
    title: "Minions & Monsters",
    vote_average: 7.3,
    release_date: "2026-07-01",
    overview: "The Minions embark on their wildest adventure yet, accidentally awakening ancient creatures and racing to save the world from a monstrous threat — with plenty of banana-fueled chaos along the way.",
    genres: [{ id: 16, name: "Animation" }, { id: 35, name: "Comedy" }, { id: 10751, name: "Family" }],
    runtime: 94,
    tagline: "Banana-powered chaos!",
    poster_path: "/vrTlRYPhnf107vbTiDf6DRrdV3r.jpg",
    backdrop_path: "/kkcwhgSFd81QDlXo8ytrpHPQjhy.jpg"
  },
  95: {
    id: 95,
    title: "Toy Story 5",
    vote_average: 8.0,
    release_date: "2026-06-19",
    overview: "When a tech-savvy new toy arrives and threatens to make the old toys obsolete, Woody, Buzz, and the gang must prove that classic toys will always have a place in a child's heart.",
    genres: [{ id: 16, name: "Animation" }, { id: 12, name: "Adventure" }, { id: 35, name: "Comedy" }, { id: 10751, name: "Family" }],
    runtime: 105,
    tagline: "Some things never go out of play.",
    poster_path: "/sfQtVlIHljToOwYjhe21KPGzZWK.jpg",
    backdrop_path: "/qjTqY5coNiz6sVtPng40IzltsoN.jpg"
  },
  96: {
    id: 96,
    title: "Backrooms",
    vote_average: 7.5,
    release_date: "2026-05-27",
    overview: "A group of strangers find themselves trapped in an endless labyrinth of empty rooms and fluorescent lights, where reality bends and something lurks behind the walls.",
    genres: [{ id: 27, name: "Horror" }, { id: 53, name: "Thriller" }, { id: 878, name: "Sci-Fi" }],
    runtime: 110,
    tagline: "If you're not careful, you'll end up here.",
    poster_path: "/rhGx6E3qRNMgj3i5su2oukNHwIQ.jpg",
    backdrop_path: "/mCpwRayjXMFzKHbjbzc5JRKfq1O.jpg"
  },
  97: {
    id: 97,
    title: "The Mandalorian & Grogu",
    vote_average: 7.8,
    release_date: "2026-05-22",
    overview: "Din Djarin and Grogu face their greatest challenge yet as an ancient Mandalorian threat emerges, forcing them to unite old allies and confront their shared destiny.",
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 28, name: "Action" }, { id: 12, name: "Adventure" }],
    runtime: 135,
    tagline: "This is the way.",
    poster_path: "/5Vi8dSauVwH1HOsiZceDMbRr1Ca.jpg",
    backdrop_path: "/6zg7A9ICOthNR2TSXlT51KvXrsA.jpg"
  },
  98: {
    id: 98,
    title: "Drishyam 3",
    vote_average: 8.1,
    release_date: "2026-05-21",
    overview: "Vijay Salgaonkar's carefully constructed web of lies is tested once more when a new investigation reopens old wounds and threatens to shatter everything he built to protect his family.",
    genres: [{ id: 53, name: "Thriller" }, { id: 80, name: "Crime" }, { id: 18, name: "Drama" }],
    runtime: 148,
    tagline: "The final chapter of deception.",
    poster_path: "/456FlpiU1iOBnaOxSd783QhZKWw.jpg",
    backdrop_path: "/enwc2Acl38mvX33QffmTzDSV89D.jpg"
  },
  99: {
    id: 99,
    title: "The Devil Wears Prada 2",
    vote_average: 7.2,
    release_date: "2026-05-01",
    overview: "Andy Sachs is now a successful journalist, but when she crosses paths with Miranda Priestly again, she is pulled back into the high-stakes world of fashion and power.",
    genres: [{ id: 35, name: "Comedy" }, { id: 18, name: "Drama" }],
    runtime: 115,
    tagline: "Fashion never sleeps.",
    poster_path: "/fCAURTUx3YfsJ8k9I0UamjSILiR.jpg",
    backdrop_path: "/Af907x5h9W1wVis8XrSd7ynTWuy.jpg"
  },
  100: {
    id: 100,
    title: "Michael",
    vote_average: 7.6,
    release_date: "2026-04-22",
    overview: "The authorized biopic chronicles the extraordinary life and career of Michael Jackson, from his childhood in Gary, Indiana to becoming the undisputed King of Pop.",
    genres: [{ id: 18, name: "Drama" }, { id: 10402, name: "Music" }, { id: 36, name: "History" }],
    runtime: 155,
    tagline: "Before the legend, there was a boy with a dream.",
    poster_path: "/zm0KAbOjlt9eR5y7vDiL2dEOwMl.jpg",
    backdrop_path: "/xBT0oNq6rsTFv4SxG5uGRIEOrq6.jpg"
  },
  101: {
    id: 101,
    title: "Project Hail Mary",
    vote_average: 8.3,
    release_date: "2026-12-20",
    overview: "A lone astronaut wakes up on a spaceship with no memory, only to discover he's humanity's last hope to solve an extinction-level threat to Earth — with the help of an unlikely alien friend.",
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 12, name: "Adventure" }, { id: 18, name: "Drama" }],
    runtime: 142,
    tagline: "Save the world. Remember how.",
    poster_path: "/yihdXomYb5kTeSivtFndMy5iDmf.jpg",
    backdrop_path: "/8Tfys3mDZVp4tNoH2ktm06a0Tau.jpg"
  },
  // ===== 2026 COMING SOON (Upcoming releases) =====
  102: {
    id: 102,
    title: "Achyuta Avataaram",
    vote_average: 8.2,
    release_date: "2026-07-17",
    overview: "A grand Telugu mythological drama that explores destiny, divine justice, and the power of faith as a local temple custodian uncovers an ancient prophecy.",
    genres: [{ id: 18, name: "Drama" }, { id: 14, name: "Fantasy" }],
    runtime: 135,
    tagline: "The divine prophecy unfolds.",
    poster_path: "/jt8pfSIdi47YpFMMWVRr8w5u2S0.jpg",
    backdrop_path: "/yD924S1XvS6cM9w6t2g68P940z2.jpg"
  },
  103: {
    id: 103,
    title: "Father's Day",
    vote_average: 7.8,
    release_date: "2026-07-17",
    overview: "A heartwarming and emotional comedy-drama about the complex yet loving relationship between a single father and his three eccentric children who plan a surprise celebration.",
    genres: [{ id: 35, name: "Comedy" }, { id: 18, name: "Drama" }, { id: 10751, name: "Family" }],
    runtime: 122,
    tagline: "The greatest dad deserves the best surprise.",
    poster_path: "/cFLVe7dfz7m3AT3egd97As3oC0Y.jpg",
    backdrop_path: "/8Tfys3mDZVp4tNoH2ktm06a0Tau.jpg"
  },
  104: {
    id: 104,
    title: "MRP (Neekentha Naakentha)",
    vote_average: 7.5,
    release_date: "2026-07-17",
    overview: "An action-packed thriller confronting the underground retail cartels and pricing scams, following an honest auditor who turns vigilante to protect middle-class consumer rights.",
    genres: [{ id: 28, name: "Action" }, { id: 53, name: "Thriller" }],
    runtime: 145,
    tagline: "Fighting the price of greed.",
    poster_path: "/jbmZPjSfCdIHo269QZK203WZSm.jpg",
    backdrop_path: "/fjaR5w0LoRb20LN6DaYxmolWE4p.jpg"
  },
  105: {
    id: 105,
    title: "Oh..! Sukumari",
    vote_average: 8.0,
    release_date: "2026-07-17",
    overview: "A sparkling musical romance and thriller about a small-town musician and a free-spirited girl whose chance encounter leads to a high-speed adventure across the country.",
    genres: [{ id: 10749, name: "Romance" }, { id: 35, name: "Comedy" }, { id: 53, name: "Thriller" }],
    runtime: 130,
    tagline: "Love, music, and a wild ride.",
    poster_path: "/9FdB3kXZbQnZVLoOv37by69VS1K.jpg",
    backdrop_path: "/w4NLVXJxiLZjknrzRsukAwk5Fr.jpg"
  },
  106: {
    id: 106,
    title: "Oka Court Case",
    vote_average: 7.9,
    release_date: "2026-07-17",
    overview: "A gripping courtroom drama about a land-grabbing scandal where an idealistic rookie lawyer challenges a formidable corporate conglomerate to seek justice for an elderly community.",
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
    runtime: 140,
    tagline: "Justice is a battle of truth.",
    poster_path: "/zWgm7OZv8B4XUKEhU8BWB4pW3z0.jpg",
    backdrop_path: "/xBT0oNq6rsTFv4SxG5uGRIEOrq6.jpg"
  },
  107: {
    id: 107,
    title: "Antappante Athbudha Pravarthikal",
    vote_average: 8.1,
    release_date: "2026-07-17",
    overview: "A whimsical Malayalam fantasy comedy tracking the magical, chaotic, and hilarious consequences when a simple villager named Antappan accidentally acquires the ability to grant wishes.",
    genres: [{ id: 35, name: "Comedy" }, { id: 14, name: "Fantasy" }],
    runtime: 128,
    tagline: "Be careful what you wish for.",
    poster_path: "/pPxsw4KnZbsklyHUCTKSCHKaC8F.jpg",
    backdrop_path: "/v3lNH2gCojWYXVuXcT9FZLBxcSq.jpg"
  },
  108: {
    id: 108,
    title: "Mister Middle Class",
    vote_average: 7.6,
    release_date: "2026-07-17",
    overview: "A realistic family drama focusing on the values, struggles, and quiet triumphs of a hard-working software engineer navigating corporate politics, family expectations, and new-found love.",
    genres: [{ id: 18, name: "Drama" }, { id: 10751, name: "Family" }],
    runtime: 138,
    tagline: "Extraordinary dreams of an ordinary man.",
    poster_path: "/7ru6YpK7U4QH8cO3OKMKo5ZXgXj.jpg",
    backdrop_path: "/m3Pom6pbD51bBv3syz8NMHda3fz.jpg"
  },
  109: {
    id: 109,
    title: "Vadala",
    vote_average: 8.3,
    release_date: "2026-07-17",
    overview: "A suspenseful psychological thriller tracking a series of unexplained disappearances in a secluded mountain village, leading a determined detective to uncover a dark family secret.",
    genres: [{ id: 9648, name: "Mystery" }, { id: 53, name: "Thriller" }],
    runtime: 132,
    tagline: "Every secret leaves a trail.",
    poster_path: "/dxjbpaEkwm81FU9m4jCtXtnjmax.jpg",
    backdrop_path: "/ddfXMkaPViSrg0P5aoYGFMc58x2.jpg"
  },
  110: {
    id: 110,
    title: "Jana Nayagan",
    vote_average: 8.5,
    release_date: "2026-07-23",
    overview: "A high-octane political action saga where a dynamic local activist rises to power to shield his community from corporate exploitation and government apathy, redefining true leadership.",
    genres: [{ id: 28, name: "Action" }, { id: 18, name: "Drama" }],
    runtime: 152,
    tagline: "The voice of the people.",
    poster_path: "/p6140P43S8lM4RzE61W1h27jFwM.jpg",
    backdrop_path: "/v3lNH2gCojWYXVuXcT9FZLBxcSq.jpg"
  },
  111: {
    id: 111,
    title: "Spider-Man: Beyond the Spider-Verse",
    vote_average: 8.5,
    release_date: "2027-06-17",
    overview: "Hunted by Miguel O'Hara's Spider Society and betrayed by his friends, Miles finds himself in the darkest corners of the Spider-Verse in search of a way home. Knowing that his family has been not only fractured but endangered by his calling, it's a race against the clock for Miles to travel across the wildest reaches of time and space to fight for and reunite everything he holds most dear.",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 16, name: "Animation" }, { id: 878, name: "Sci-Fi" }],
    runtime: 140,
    tagline: "The final chapter of the Spider-Verse.",
    poster_path: "/9PIhQqqI6Q4a5YjwMjxvzZcPJhf.jpg",
    backdrop_path: "/6yZgfrPJGhXEHD2jH7hzmRt9KpQ.jpg"
  },
  112: {
    id: 112,
    title: "Avengers: Secret Wars",
    vote_average: 8.7,
    release_date: "2027-12-16",
    overview: "An upcoming film in Phase Six of the Marvel Cinematic Universe (MCU) and the finale of The Multiverse Saga. The remaining Avengers and heroes must unite across time and dimensions to stop a threat to all existence.",
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 28, name: "Action" }, { id: 12, name: "Adventure" }],
    runtime: 180,
    tagline: "The Multiverse Saga reaches its epic climax.",
    poster_path: "/f0YBuh4hyiAheXhh4JnJWoKi9g5.jpg",
    backdrop_path: "/rytc6Lf4447C0CDncwFa4gxe0vY.jpg"
  },
  113: {
    id: 113,
    title: "Toy Story 5",
    vote_average: 7.4,
    release_date: "2026-06-17",
    overview: "When Bonnie receives a Lilypad tablet as a gift and becomes obsessed, Buzz, Woody, Jessie and the rest of the gang's jobs become exponentially harder when they have to go head to head with the all-new threat to playtime.",
    genres: [{ id: 16, name: "Animation" }, { id: 10751, name: "Family" }, { id: 35, name: "Comedy" }, { id: 12, name: "Adventure" }],
    runtime: 100,
    tagline: "It's on.",
    poster_path: "/sfQtVlIHljToOwYjhe21KPGzZWK.jpg",
    backdrop_path: "/qjTqY5coNiz6sVtPng40IzltsoN.jpg"
  },
  114: {
    id: 114,
    title: "The Batman: Part II",
    vote_average: 8.3,
    release_date: "2026-10-02",
    overview: "Sequel to the 2022 film The Batman. Bruce Wayne continues his crusade in the dark underworld of Gotham City.",
    genres: [{ id: 9648, name: "Mystery" }, { id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
    runtime: 165,
    tagline: "Uncover the darkness.",
    poster_path: "/caeBJHLNld1h14uvcLvzyHf3Rlk.jpg",
    backdrop_path: "/naZFeXyIBdqIZo1JjSrrhbcTB4P.jpg"
  },
  115: {
    id: 115,
    title: "Avatar: Fire and Ash",
    vote_average: 7.6,
    release_date: "2026-12-18",
    overview: "In the wake of the devastating war against the RDA and the loss of their eldest son, Jake Sully and Neytiri face a new threat on Pandora: the Ash People, a violent and power-hungry Na'vi tribe led by the ruthless Varang.",
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 12, name: "Adventure" }, { id: 14, name: "Fantasy" }],
    runtime: 160,
    tagline: "The world of Pandora will change forever.",
    poster_path: "/bRBeSHfGHwkEpImlhxPmOcUsaeg.jpg",
    backdrop_path: "/u8DU5fkLoM5tTRukzPC31oGPxaQ.jpg"
  },
  116: {
    id: 116,
    title: "War 2",
    vote_average: 8.4,
    release_date: "2026-08-14",
    overview: "Major Kabir Dhaliwal and Agent Vikram take on an international espionage syndicate in a globe-trotting action thriller that redefines Indian spy cinema.",
    genres: [{ id: 28, name: "Action" }, { id: 53, name: "Thriller" }],
    runtime: 155,
    tagline: "Clash of the Titans.",
    poster_path: "/zWgm7OZv8B4XUKEhU8BWB4pW3z0.jpg",
    backdrop_path: "/ddfXMkaPViSrg0P5aoYGFMc58x2.jpg"
  },
  117: {
    id: 117,
    title: "K.G.F: Chapter 3",
    vote_average: 8.8,
    release_date: "2026-10-15",
    overview: "The international saga of Rocky continues as his empire expands overseas into global trade networks and military intelligence sectors.",
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }],
    runtime: 168,
    tagline: "Monster's global reign.",
    poster_path: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    backdrop_path: "/m3Pom6pbD51bBv3syz8NMHda3fz.jpg"
  },
  118: {
    id: 118,
    title: "Toxic: A Fairy Tale for Grown-ups",
    vote_average: 8.2,
    release_date: "2026-04-10",
    overview: "A dark action thriller exploring the ruthless drug cartels and underworld empire set against a retro backdrop.",
    genres: [{ id: 28, name: "Action" }, { id: 53, name: "Thriller" }],
    runtime: 150,
    tagline: "A fairy tale for grown-ups.",
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_path: "/xBT0oNq6rsTFv4SxG5uGRIEOrq6.jpg"
  },
  119: {
    id: 119,
    title: "Kalki 2898 AD Part 2",
    vote_average: 8.6,
    release_date: "2026-09-25",
    overview: "The futuristic mythological saga reaches its next phase as Karna and Ashwatthama unite to protect the divine child from Supreme Yaskin's forces.",
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 28, name: "Action" }, { id: 14, name: "Fantasy" }],
    runtime: 175,
    tagline: "The battle for Kashi begins.",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop_path: "/yD924S1XvS6cM9w6t2g68P940z2.jpg"
  }
};

const MOCK_TV_SHOWS_DB: Record<number, {
  id: number;
  name: string;
  vote_average: number;
  first_air_date: string;
  overview: string;
  genres: Array<{ id: number; name: string }>;
  episode_run_time?: number[];
  tagline?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  poster_path: string | null;
  backdrop_path: string | null;
}> = {
  1: {
    id: 1,
    name: "Breaking Bad",
    vote_average: 9.5,
    first_air_date: "2008-01-20",
    overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.",
    genres: [{ id: 80, name: "Crime" }, { id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
    episode_run_time: [49],
    tagline: "Remember my name.",
    number_of_seasons: 5,
    number_of_episodes: 62,
    poster_path: "/breaking_bad_poster.jpg",
    backdrop_path: "/breaking_bad_backdrop.jpg"
  },
  2: {
    id: 2,
    name: "Stranger Things",
    vote_average: 8.7,
    first_air_date: "2016-07-15",
    overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
    genres: [{ id: 18, name: "Drama" }, { id: 9648, name: "Mystery" }, { id: 878, name: "Sci-Fi" }],
    episode_run_time: [50],
    tagline: "One summer can change everything.",
    number_of_seasons: 4,
    number_of_episodes: 34,
    poster_path: "/stranger_things_poster.jpg",
    backdrop_path: "/stranger_things_backdrop.jpg"
  },
  3: {
    id: 3,
    name: "Game of Thrones",
    vote_average: 9.2,
    first_air_date: "2011-04-17",
    overview: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest North.",
    genres: [{ id: 12, name: "Adventure" }, { id: 14, name: "Fantasy" }, { id: 28, name: "Action" }],
    episode_run_time: [60],
    tagline: "Winter is coming.",
    number_of_seasons: 8,
    number_of_episodes: 73,
    poster_path: "/game_of_thrones_poster.jpg",
    backdrop_path: "/game_of_thrones_backdrop.jpg"
  },
  4: {
    id: 4,
    name: "Dark",
    vote_average: 8.8,
    first_air_date: "2017-12-01",
    overview: "A missing child sets four families on a frantic hunt for answers as they unearth a mind-bending mystery that spans three generations.",
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 9648, name: "Mystery" }, { id: 53, name: "Thriller" }],
    episode_run_time: [60],
    tagline: "Everything is connected.",
    number_of_seasons: 3,
    number_of_episodes: 26,
    poster_path: "/dark_tv_poster.jpg",
    backdrop_path: "/dark_tv_backdrop.jpg"
  },
  5: {
    id: 5,
    name: "Friends",
    vote_average: 8.9,
    first_air_date: "1994-09-22",
    overview: "Follows the personal and professional lives of six twenty to thirty-something-year-old friends living in Manhattan.",
    genres: [{ id: 35, name: "Comedy" }, { id: 10749, name: "Romance" }],
    episode_run_time: [22],
    tagline: "I'll be there for you.",
    number_of_seasons: 10,
    number_of_episodes: 236,
    poster_path: "/friends_poster.jpg",
    backdrop_path: "/friends_backdrop.jpg"
  },
  6: {
    id: 6,
    name: "The Office",
    vote_average: 9.0,
    first_air_date: "2005-03-24",
    overview: "A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.",
    genres: [{ id: 35, name: "Comedy" }],
    episode_run_time: [22],
    tagline: "Our office is a family.",
    number_of_seasons: 9,
    number_of_episodes: 201,
    poster_path: "/the_office_poster.jpg",
    backdrop_path: "/the_office_backdrop.jpg"
  },
  7: {
    id: 7,
    name: "The Mandalorian",
    vote_average: 8.7,
    first_air_date: "2019-11-12",
    overview: "The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 878, name: "Sci-Fi" }],
    episode_run_time: [40],
    tagline: "This is the Way.",
    number_of_seasons: 3,
    number_of_episodes: 24,
    poster_path: "/mandalorian_poster.jpg",
    backdrop_path: "/mandalorian_backdrop.jpg"
  },
  8: {
    id: 8,
    name: "The Crown",
    vote_average: 8.6,
    first_air_date: "2016-11-04",
    overview: "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the twentieth century.",
    genres: [{ id: 18, name: "Drama" }, { id: 36, name: "History" }],
    episode_run_time: [58],
    tagline: "Times change. Duty remains.",
    number_of_seasons: 6,
    number_of_episodes: 60,
    poster_path: "/the_crown_poster.jpg",
    backdrop_path: "/the_crown_backdrop.jpg"
  },
  9: {
    id: 9,
    name: "Black Mirror",
    vote_average: 8.8,
    first_air_date: "2011-12-04",
    overview: "An anthology series exploring a twisted, high-tech multiverse where humanity's greatest innovations and darkest instincts collide.",
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
    episode_run_time: [60],
    tagline: "The future is bright.",
    number_of_seasons: 6,
    number_of_episodes: 28,
    poster_path: "/black_mirror_poster.jpg",
    backdrop_path: "/black_mirror_backdrop.jpg"
  },
  10: {
    id: 10,
    name: "Mirzapur",
    vote_average: 8.5,
    first_air_date: "2018-11-16",
    overview: "A shocking incident at a wedding procession ignites a series of events, entangling the lives of two families in the lawless city of Mirzapur.",
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 18, name: "Drama" }],
    episode_run_time: [50],
    tagline: "Bhaukal machne wala hai.",
    number_of_seasons: 3,
    number_of_episodes: 29,
    poster_path: "/mirzapur_poster.jpg",
    backdrop_path: "/mirzapur_backdrop.jpg"
  },
  11: {
    id: 11,
    name: "Sacred Games",
    vote_average: 8.6,
    first_air_date: "2018-07-06",
    overview: "A link in their pasts leads an honest cop to a fugitive gang boss, whose cryptic warning spurs the officer on a quest to save Mumbai from cataclysm.",
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
    episode_run_time: [50],
    tagline: "Apun hi bhagwan hai.",
    number_of_seasons: 2,
    number_of_episodes: 16,
    poster_path: "/sacred_games_poster.jpg",
    backdrop_path: "/sacred_games_backdrop.jpg"
  },
  12: {
    id: 12,
    name: "Succession",
    vote_average: 8.8,
    first_air_date: "2018-06-03",
    overview: "The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their father steps down.",
    genres: [{ id: 18, name: "Drama" }],
    episode_run_time: [60],
    tagline: "Control the narrative.",
    number_of_seasons: 4,
    number_of_episodes: 39,
    poster_path: "/succession_poster.jpg",
    backdrop_path: "/succession_backdrop.jpg"
  },
  13: {
    id: 13,
    name: "The Last of Us",
    vote_average: 8.8,
    first_air_date: "2023-01-15",
    overview: "After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity's last hope.",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 18, name: "Drama" }],
    episode_run_time: [50],
    tagline: "When you're lost in the darkness, look for the light.",
    number_of_seasons: 1,
    number_of_episodes: 9,
    poster_path: "/last_of_us_poster.jpg",
    backdrop_path: "/last_of_us_backdrop.jpg"
  },
  14: {
    id: 14,
    name: "Narcos",
    vote_average: 8.8,
    first_air_date: "2015-08-28",
    overview: "A chronicled look at the criminal exploits of Colombian drug lord Pablo Escobar, as well as the many other drug kingpins who plagued the country through the years.",
    genres: [{ id: 80, name: "Crime" }, { id: 18, name: "Drama" }],
    episode_run_time: [49],
    tagline: "There's no business like blow business.",
    number_of_seasons: 3,
    number_of_episodes: 30,
    poster_path: "/narcos_poster.jpg",
    backdrop_path: "/narcos_backdrop.jpg"
  },
  15: {
    id: 15,
    name: "Attack on Titan",
    vote_average: 9.0,
    first_air_date: "2013-04-07",
    overview: "After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction.",
    genres: [{ id: 16, name: "Animation" }, { id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 14, name: "Fantasy" }],
    episode_run_time: [24],
    tagline: "If you don't fight, you can't win.",
    number_of_seasons: 4,
    number_of_episodes: 87,
    poster_path: "/attack_on_titan_poster.jpg",
    backdrop_path: "/attack_on_titan_backdrop.jpg"
  },
  16: {
    id: 16,
    name: "Death Note",
    vote_average: 9.0,
    first_air_date: "2006-10-04",
    overview: "An intelligent high school student goes on a secret crusade to eliminate criminals from the world after discovering a notebook capable of killing anyone whose name is written in it.",
    genres: [{ id: 16, name: "Animation" }, { id: 80, name: "Crime" }, { id: 9648, name: "Mystery" }],
    episode_run_time: [23],
    tagline: "Justice will prevail.",
    number_of_seasons: 1,
    number_of_episodes: 37,
    poster_path: "/death_note_poster.jpg",
    backdrop_path: "/death_note_backdrop.jpg"
  },
  17: {
    id: 17,
    name: "The Witcher",
    vote_average: 8.0,
    first_air_date: "2019-12-20",
    overview: "Geralt of Rivia, a mutated monster-hunter for hire, journeys toward his destiny in a turbulent world where people often prove more wicked than beasts.",
    genres: [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 14, name: "Fantasy" }],
    episode_run_time: [60],
    tagline: "The worst monsters are the ones we create.",
    number_of_seasons: 3,
    number_of_episodes: 24,
    poster_path: "/witcher_poster.jpg",
    backdrop_path: "/witcher_backdrop.jpg"
  },
  18: {
    id: 18,
    name: "True Detective",
    vote_average: 8.9,
    first_air_date: "2014-01-12",
    overview: "Seasonal anthology series in which police investigations unearth the personal and professional secrets of those involved, both within and outside the law.",
    genres: [{ id: 80, name: "Crime" }, { id: 18, name: "Drama" }, { id: 9648, name: "Mystery" }],
    episode_run_time: [55],
    tagline: "Touch darkness and darkness touches you.",
    number_of_seasons: 4,
    number_of_episodes: 30,
    poster_path: "/true_detective_poster.jpg",
    backdrop_path: "/true_detective_backdrop.jpg"
  },
  19: {
    id: 19,
    name: "Fargo",
    vote_average: 8.9,
    first_air_date: "2014-04-15",
    overview: "Various chronicles of deception, intrigue and murder in and around frozen Minnesota. Yet all of these tales mysteriously lead back one way or another to Fargo, North Dakota.",
    genres: [{ id: 80, name: "Crime" }, { id: 18, name: "Drama" }, { id: 35, name: "Comedy" }],
    episode_run_time: [53],
    tagline: "A true crime story.",
    number_of_seasons: 5,
    number_of_episodes: 51,
    poster_path: "/fargo_tv_poster.jpg",
    backdrop_path: "/fargo_tv_backdrop.jpg"
  },
  20: {
    id: 20,
    name: "Wednesday",
    vote_average: 8.1,
    first_air_date: "2022-11-23",
    overview: "Wednesday Addams' misadventures as a student at Nevermore Academy, a very unique boarding school for outcasts.",
    genres: [{ id: 35, name: "Comedy" }, { id: 14, name: "Fantasy" }, { id: 9648, name: "Mystery" }],
    episode_run_time: [45],
    tagline: "Being an outcast has never been so chic.",
    number_of_seasons: 1,
    number_of_episodes: 8,
    poster_path: "/wednesday_poster.jpg",
    backdrop_path: "/wednesday_backdrop.jpg"
  },
  21: {
    id: 21,
    name: "The Boys",
    vote_average: 8.7,
    first_air_date: "2019-07-26",
    overview: "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.",
    genres: [{ id: 28, name: "Action" }, { id: 35, name: "Comedy" }, { id: 878, name: "Sci-Fi" }],
    episode_run_time: [60],
    tagline: "Never meet your heroes.",
    number_of_seasons: 4,
    number_of_episodes: 32,
    poster_path: "/the_boys_poster.jpg",
    backdrop_path: "/the_boys_backdrop.jpg"
  },
  22: {
    id: 22,
    name: "Severance",
    vote_average: 8.7,
    first_air_date: "2022-02-18",
    overview: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.",
    genres: [{ id: 878, name: "Sci-Fi" }, { id: 9648, name: "Mystery" }, { id: 53, name: "Thriller" }],
    episode_run_time: [48],
    tagline: "Please consent to a severance procedure.",
    number_of_seasons: 1,
    number_of_episodes: 9,
    poster_path: "/severance_poster.jpg",
    backdrop_path: "/severance_backdrop.jpg"
  },
  23: {
    id: 23,
    name: "Rick and Morty",
    vote_average: 9.1,
    first_air_date: "2013-12-02",
    overview: "An animated series that follows the exploits of a super scientist and his inherently timid grandson.",
    genres: [{ id: 16, name: "Animation" }, { id: 35, name: "Comedy" }, { id: 878, name: "Sci-Fi" }],
    episode_run_time: [22],
    tagline: "Science is more art than science.",
    number_of_seasons: 7,
    number_of_episodes: 74,
    poster_path: "/rick_morty_poster.jpg",
    backdrop_path: "/rick_morty_backdrop.jpg"
  },
  24: {
    id: 24,
    name: "Money Heist",
    vote_average: 8.2,
    first_air_date: "2017-05-02",
    overview: "To carry out the biggest heist in history, a mysterious man called The Professor recruits a band of eight robbers who have a single characteristic: none of them has anything to lose.",
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 18, name: "Drama" }],
    episode_run_time: [50],
    tagline: "Bella Ciao.",
    number_of_seasons: 5,
    number_of_episodes: 41,
    poster_path: "/money_heist_poster.jpg",
    backdrop_path: "/money_heist_backdrop.jpg"
  },
  25: {
    id: 25,
    name: "Chernobyl",
    vote_average: 9.4,
    first_air_date: "2019-05-06",
    overview: "The dramatization of the true story of one of the worst man-made catastrophes in history, the Chernobyl nuclear disaster.",
    genres: [{ id: 18, name: "Drama" }, { id: 36, name: "History" }],
    episode_run_time: [60],
    tagline: "What is the cost of lies?",
    number_of_seasons: 1,
    number_of_episodes: 5,
    poster_path: "/chernobyl_poster.jpg",
    backdrop_path: "/chernobyl_backdrop.jpg"
  }
};

// ============================================
// MOVIES
// ============================================

/** Get trending movies (day or week) */
export async function getTrending(
  mediaType: 'movie' | 'tv' | 'all' = 'movie',
  timeWindow: 'day' | 'week' = 'week',
  page: number = 1
): Promise<TMDBResponse<TMDBMovie>> {
  return tmdbFetch(`/trending/${mediaType}/${timeWindow}`, { page });
}

/** Get popular movies */
export async function getPopularMovies(
  page: number = 1
): Promise<TMDBResponse<TMDBMovie>> {
  return tmdbFetch('/movie/popular', { page, language: 'en-US' });
}

/** Get top rated movies */
export async function getTopRatedMovies(
  page: number = 1
): Promise<TMDBResponse<TMDBMovie>> {
  return tmdbFetch('/movie/top_rated', { page, language: 'en-US' });
}

export async function getUpcomingMovies(
  page: number = 1,
  region: string = 'IN'
): Promise<TMDBResponse<TMDBMovie>> {
  try {
    const tmdbRes = await tmdbFetch<TMDBResponse<TMDBMovie>>('/movie/upcoming', { 
      page, 
      language: 'en-US',
      region: 'US'
    });

    const hollywoodMovies = tmdbRes?.results || [];
    const isMock = hollywoodMovies.length > 0 && hollywoodMovies.some((m) => m.id <= 115);

    // Curated high-profile upcoming Indian & Hollywood blockbusters
    const curatedUpcomingIds = [118, 116, 110, 113, 117, 119, 111, 114, 115, 112];
    const mockUpcomingMovies = curatedUpcomingIds
      .map(id => MOCK_MOVIES_DB[id])
      .filter(Boolean)
      .map(m => ({
        id: m.id,
        title: m.title,
        vote_average: m.vote_average,
        release_date: m.release_date,
        overview: m.overview,
        genre_ids: m.genres ? m.genres.map((g: any) => g.id) : [],
        poster_path: m.poster_path || null,
        backdrop_path: m.backdrop_path || null,
        popularity: 100.0,
        video: false,
        vote_count: 5000,
        original_language: 'en',
        adult: false
      })) as unknown as TMDBMovie[];

    let combinedSorted: TMDBMovie[] = [];
    let totalResults = 0;

    if (isMock) {
      combinedSorted = [...mockUpcomingMovies];
      totalResults = combinedSorted.length;
    } else {
      const validApiMovies = hollywoodMovies.filter(m => {
        if (!m.release_date) return false;
        const year = new Date(m.release_date).getFullYear();
        return year >= 2026;
      });
      
      const existingTitles = new Set(mockUpcomingMovies.map(m => (m.title || "").toLowerCase()));
      const filteredApiMovies = validApiMovies.filter(m => !existingTitles.has((m.title || "").toLowerCase()));

      combinedSorted = [...mockUpcomingMovies, ...filteredApiMovies];
      totalResults = combinedSorted.length;
    }

    // Sort chronologically by release_date (closest date first)
    combinedSorted.sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return dateA - dateB;
    });

    const itemsPerPage = 12;
    const startIdx = (page - 1) * itemsPerPage;
    const pageResults = combinedSorted.slice(startIdx, startIdx + itemsPerPage);
    const totalPages = Math.ceil(totalResults / itemsPerPage);

    return {
      page,
      results: pageResults,
      total_pages: totalPages,
      total_results: totalResults,
    };
  } catch (error) {
    console.error("Error in getUpcomingMovies combined fetch:", error);
    const upcomingIds = [110, 116, 111, 114, 115, 112, 113, 117, 118, 119];
    const results = upcomingIds
      .map(id => MOCK_MOVIES_DB[id])
      .filter(Boolean)
      .map(m => ({
        id: m.id,
        title: m.title,
        vote_average: m.vote_average,
        release_date: m.release_date,
        overview: m.overview,
        genre_ids: m.genres ? m.genres.map((g: any) => g.id) : [],
        poster_path: m.poster_path || null,
        backdrop_path: m.backdrop_path || null,
        popularity: 10.0,
        video: false,
        vote_count: 0,
        original_language: 'en',
        adult: false
      })) as unknown as TMDBMovie[];

    return {
      page: 1,
      results,
      total_pages: 1,
      total_results: results.length,
    };
  }
}

/** Get now playing movies */
export async function getNowPlayingMovies(
  page: number = 1
): Promise<TMDBResponse<TMDBMovie>> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [nowPlayingRes, bollywoodRes] = await Promise.all([
      tmdbFetch<TMDBResponse<TMDBMovie>>('/movie/now_playing', { page, language: 'en-US', region: 'IN' }),
      tmdbFetch<TMDBResponse<TMDBMovie>>('/discover/movie', {
        page,
        language: 'en-US',
        with_original_language: 'hi|te|ta|ml|kn',
        sort_by: 'popularity.desc',
        'primary_release_date.lte': today,
        'primary_release_date.gte': ninetyDaysAgo,
      }),
    ]);

    const nowPlayingResults = nowPlayingRes?.results || [];
    const bollywoodResults = bollywoodRes?.results || [];

    let finalBollywood = bollywoodResults;
    let finalNowPlaying = nowPlayingResults;

    // Check if we are in mock mode (detecting by mock movie IDs <= 115)
    const isMock = nowPlayingResults.length > 0 && 
                   nowPlayingResults.some((m) => m.id <= 115);

    if (isMock) {
      // Hindi/Indian movie IDs in the new mock database
      const bollywoodIds = new Set([81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 93, 98]);
      finalBollywood = nowPlayingResults.filter((m) => bollywoodIds.has(m.id));
      finalNowPlaying = nowPlayingResults.filter((m) => !bollywoodIds.has(m.id));
    }

    // Interleave Bollywood movies into Now Playing movies (e.g. 1 Bollywood movie after every 2 Hollywood movies)
    const combinedResults: TMDBMovie[] = [];
    let bp = 0;
    let np = 0;

    while (np < finalNowPlaying.length || bp < finalBollywood.length) {
      for (let i = 0; i < 2 && np < finalNowPlaying.length; i++) {
        combinedResults.push(finalNowPlaying[np++]);
      }
      if (bp < finalBollywood.length) {
        combinedResults.push(finalBollywood[bp++]);
      }
    }

    return {
      page: nowPlayingRes?.page || 1,
      results: combinedResults,
      total_pages: nowPlayingRes?.total_pages || 1,
      total_results: (nowPlayingRes?.total_results || 0) + (bollywoodRes?.total_results || 0),
    };
  } catch (error) {
    console.error("Error in getNowPlayingMovies combined fetch:", error);
    return tmdbFetch('/movie/now_playing', { page, language: 'en-US' });
  }
}

/** Get movie details by TMDB ID */
export async function getMovieDetails(
  movieId: number
): Promise<TMDBMovie> {
  return tmdbFetch(`/movie/${movieId}`, {
    language: 'en-US',
    append_to_response: 'videos,images,keywords,release_dates',
  });
}

/** Get movie credits (cast & crew) */
export async function getMovieCredits(
  movieId: number
): Promise<TMDBCredits> {
  return tmdbFetch(`/movie/${movieId}/credits`, { language: 'en-US' });
}

/** Get similar movies */
export async function getSimilarMovies(
  movieId: number,
  page: number = 1
): Promise<TMDBResponse<TMDBMovie>> {
  return tmdbFetch(`/movie/${movieId}/similar`, { page, language: 'en-US' });
}

/** Get movie recommendations */
export async function getMovieRecommendations(
  movieId: number,
  page: number = 1
): Promise<TMDBResponse<TMDBMovie>> {
  return tmdbFetch(`/movie/${movieId}/recommendations`, { page, language: 'en-US' });
}

/** Get movie videos (trailers, teasers, etc.) */
export async function getMovieVideos(
  movieId: number
): Promise<{ id: number; results: TMDBVideo[] }> {
  return tmdbFetch(`/movie/${movieId}/videos`, { language: 'en-US' });
}

/** Get TV show videos (trailers, teasers, etc.) */
export async function getTVShowVideos(
  tvId: number
): Promise<{ id: number; results: TMDBVideo[] }> {
  return tmdbFetch(`/tv/${tvId}/videos`, { language: 'en-US' });
}

/** Get movie images (posters, backdrops) */
export async function getMovieImages(
  movieId: number
): Promise<{
  id: number;
  backdrops: Array<{ file_path: string; width: number; height: number }>;
  posters: Array<{ file_path: string; width: number; height: number }>;
}> {
  return tmdbFetch(`/movie/${movieId}/images`);
}

/** Get movie watch providers (OTT availability) */
export async function getWatchProviders(
  movieId: number
): Promise<{
  id: number;
  results: Record<
    string,
    {
      link: string;
      flatrate?: Array<{ provider_id: number; provider_name: string; logo_path: string }>;
      rent?: Array<{ provider_id: number; provider_name: string; logo_path: string }>;
      buy?: Array<{ provider_id: number; provider_name: string; logo_path: string }>;
    }
  >;
}> {
  return tmdbFetch(`/movie/${movieId}/watch/providers`);
}

/** Get TV show watch providers (OTT availability) */
export async function getTVWatchProviders(
  tvId: number
): Promise<{
  id: number;
  results: Record<
    string,
    {
      link: string;
      flatrate?: Array<{ provider_id: number; provider_name: string; logo_path: string }>;
      rent?: Array<{ provider_id: number; provider_name: string; logo_path: string }>;
      buy?: Array<{ provider_id: number; provider_name: string; logo_path: string }>;
    }
  >;
}> {
  return tmdbFetch(`/tv/${tvId}/watch/providers`);
}

// ============================================
// TV SHOWS
// ============================================

/** Get popular TV shows */
export async function getPopularTVShows(
  page: number = 1
): Promise<TMDBResponse<TMDBMovie>> {
  return tmdbFetch('/tv/popular', { page, language: 'en-US' });
}

/** Get top rated TV shows */
export async function getTopRatedTVShows(
  page: number = 1
): Promise<TMDBResponse<TMDBMovie>> {
  return tmdbFetch('/tv/top_rated', { page, language: 'en-US' });
}

/** Get TV show details */
export async function getTVShowDetails(
  tvId: number
): Promise<TMDBMovie> {
  return tmdbFetch(`/tv/${tvId}`, {
    language: 'en-US',
    append_to_response: 'videos,images,keywords',
  });
}

/** Get TV show credits */
export async function getTVShowCredits(
  tvId: number
): Promise<TMDBCredits> {
  return tmdbFetch(`/tv/${tvId}/credits`, { language: 'en-US' });
}

/** Get similar TV shows */
export async function getSimilarTVShows(
  tvId: number,
  page: number = 1
): Promise<TMDBResponse<TMDBMovie>> {
  return tmdbFetch(`/tv/${tvId}/similar`, { page, language: 'en-US' });
}

// ============================================

// PEOPLE (CELEBRITIES)
// ============================================

/** Get person details */
export async function getPersonDetails(
  personId: number
): Promise<TMDBPerson> {
  return tmdbFetch(`/person/${personId}`, {
    language: 'en-US',
    append_to_response: 'images,external_ids',
  });
}

/** Get person's movie/TV credits */
export async function getPersonCredits(
  personId: number
): Promise<{
  id: number;
  cast: Array<TMDBMovie & { character: string }>;
  crew: Array<TMDBMovie & { department: string; job: string }>;
}> {
  return tmdbFetch(`/person/${personId}/combined_credits`, { language: 'en-US' });
}

/** Get popular people */
export async function getPopularPeople(
  page: number = 1
): Promise<TMDBResponse<TMDBPerson & { known_for: TMDBMovie[] }>> {
  return tmdbFetch('/person/popular', { page, language: 'en-US' });
}

// ============================================
// SEARCH
// ============================================

/** Multi-search (movies, TV, people) */
export async function searchMulti(
  query: string,
  page: number = 1
): Promise<TMDBResponse<TMDBMovie & { media_type: string }>> {
  return tmdbFetch('/search/multi', {
    query,
    page,
    include_adult: false,
    language: 'en-US',
  });
}

/** Search movies only */
export async function searchMovies(
  query: string,
  page: number = 1,
  year?: number
): Promise<TMDBResponse<TMDBMovie>> {
  const params: Record<string, string | number | boolean> = {
    query,
    page,
    include_adult: false,
    language: 'en-US',
  };
  if (year) params.primary_release_year = year;
  return tmdbFetch('/search/movie', params);
}

/** Search TV shows only */
export async function searchTVShows(
  query: string,
  page: number = 1
): Promise<TMDBResponse<TMDBMovie>> {
  return tmdbFetch('/search/tv', {
    query,
    page,
    include_adult: false,
    language: 'en-US',
  });
}

/** Search people only */
export async function searchPeople(
  query: string,
  page: number = 1
): Promise<TMDBResponse<TMDBPerson & { known_for: TMDBMovie[] }>> {
  return tmdbFetch('/search/person', {
    query,
    page,
    include_adult: false,
    language: 'en-US',
  });
}

// ============================================
// DISCOVER (Advanced Filtering)
// ============================================

export interface DiscoverParams {
  page?: number;
  sortBy?: string;
  withGenres?: string;        // comma-separated genre IDs
  withoutGenres?: string;
  primaryReleaseDateGte?: string; // YYYY-MM-DD
  primaryReleaseDateLte?: string;
  voteAverageGte?: number;
  voteAverageLte?: number;
  voteCountGte?: number;
  withOriginalLanguage?: string;
  withWatchProviders?: string;
  watchRegion?: string;
}

/** Discover movies with advanced filters */
export async function discoverMovies(
  params: DiscoverParams = {}
): Promise<TMDBResponse<TMDBMovie>> {
  const apiParams: Record<string, string | number | boolean> = {
    language: 'en-US',
    page: params.page || 1,
    sort_by: params.sortBy || 'popularity.desc',
    include_adult: false,
  };

  if (params.withGenres) apiParams.with_genres = params.withGenres;
  if (params.withoutGenres) apiParams.without_genres = params.withoutGenres;
  if (params.primaryReleaseDateGte) apiParams['primary_release_date.gte'] = params.primaryReleaseDateGte;
  if (params.primaryReleaseDateLte) apiParams['primary_release_date.lte'] = params.primaryReleaseDateLte;
  if (params.voteAverageGte) apiParams['vote_average.gte'] = params.voteAverageGte;
  if (params.voteAverageLte) apiParams['vote_average.lte'] = params.voteAverageLte;
  if (params.voteCountGte) apiParams['vote_count.gte'] = params.voteCountGte;
  if (params.withOriginalLanguage) apiParams.with_original_language = params.withOriginalLanguage;
  if (params.withWatchProviders) apiParams.with_watch_providers = params.withWatchProviders;
  if (params.watchRegion) apiParams.watch_region = params.watchRegion;

  return tmdbFetch('/discover/movie', apiParams);
}

/** Discover TV shows with advanced filters */
export async function discoverTVShows(
  params: DiscoverParams = {}
): Promise<TMDBResponse<TMDBMovie>> {
  const apiParams: Record<string, string | number | boolean> = {
    language: 'en-US',
    page: params.page || 1,
    sort_by: params.sortBy || 'popularity.desc',
    include_adult: false,
  };

  if (params.withGenres) apiParams.with_genres = params.withGenres;
  if (params.voteAverageGte) apiParams['vote_average.gte'] = params.voteAverageGte;
  if (params.voteCountGte) apiParams['vote_count.gte'] = params.voteCountGte;
  if (params.withOriginalLanguage) apiParams.with_original_language = params.withOriginalLanguage;

  return tmdbFetch('/discover/tv', apiParams);
}

// ============================================
// GENRES
// ============================================

/** Get all movie genres */
export async function getMovieGenres(): Promise<{
  genres: Array<{ id: number; name: string }>;
}> {
  return tmdbFetch('/genre/movie/list', { language: 'en-US' });
}

/** Get all TV genres */
export async function getTVGenres(): Promise<{
  genres: Array<{ id: number; name: string }>;
}> {
  return tmdbFetch('/genre/tv/list', { language: 'en-US' });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Build full image URL from TMDB path */
const POSTER_PRESETS = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop", // Cinema projector
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop", // Theater seats
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&auto=format&fit=crop", // Film reel
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop", // Cinema screen
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop", // Stage lights
];

const BACKDROP_PRESETS = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop",
];

function getDeterministicImage(path: string, type: 'poster' | 'backdrop'): string {
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    hash = path.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash);
  if (type === 'poster') {
    return POSTER_PRESETS[index % POSTER_PRESETS.length];
  } else {
    return BACKDROP_PRESETS[index % BACKDROP_PRESETS.length];
  }
}

/** Build full image URL from TMDB path */
export function getImageUrl(
  path: string | null | undefined,
  type: keyof typeof IMAGE_SIZES = 'poster',
  size: 'sm' | 'md' | 'lg' | 'xl' | 'original' = 'md'
): string | null {
  if (!path || path.trim() === '') return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  
  // Real TMDB image paths start with '/'
  const isRealTmdbPath = path.startsWith('/') && !path.includes('_poster') && !path.includes('_backdrop');
  if (isRealTmdbPath) {
    const sizeMap = IMAGE_SIZES[type] as Record<string, string>;
    const baseUrl = sizeMap[size] || sizeMap['md'];
    return `${baseUrl}${path}`;
  }

  return getDeterministicImage(path, type === 'backdrop' ? 'backdrop' : 'poster');
}

/** Get YouTube embed URL from video key */
export function getYouTubeEmbedUrl(key: string): string {
  return `https://www.youtube.com/embed/${key}`;
}

/** Get YouTube thumbnail URL from video key */
export function getYouTubeThumbnail(key: string): string {
  return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
}

/** Format runtime to "2h 28m" */
export function formatRuntime(minutes: number): string {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** Format release date to "2024" or "Jul 15, 2024" */
export function formatReleaseDate(
  dateStr: string | undefined,
  format: 'year' | 'short' | 'full' = 'year'
): string {
  if (!dateStr) return 'TBA';
  const date = new Date(dateStr);
  if (format === 'year') return date.getFullYear().toString();
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/** Get rating color based on score (1-10) */
export function getRatingColor(score: number): string {
  if (score >= 8) return 'var(--rating-excellent)';
  if (score >= 7) return 'var(--rating-good)';
  if (score >= 5) return 'var(--rating-average)';
  return 'var(--rating-poor)';
}

/** Format large numbers: 1200000 → "1.2M" */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/** Format currency: 150000000 → "$150M" */
export function formatCurrency(amount: number): string {
  if (!amount) return 'N/A';
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

/** Get official trailer from video results */
export function getOfficialTrailer(
  videos: TMDBVideo[]
): TMDBVideo | undefined {
  return (
    videos.find((v) => v.type === 'Trailer' && v.official && v.site === 'YouTube') ||
    videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
    videos.find((v) => v.site === 'YouTube')
  );
}

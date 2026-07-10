// ============================================
// MovieVerse — TypeScript Type Definitions
// All data models, API responses, and component props
// ============================================

// ============================================
// ENUMS
// ============================================

export enum UserRole {
  GUEST = 'GUEST',
  REGISTERED = 'REGISTERED',
  PREMIUM = 'PREMIUM',
  ADMIN = 'ADMIN',
}

export enum MediaType {
  MOVIE = 'MOVIE',
  TV_SHOW = 'TV_SHOW',
}

export enum OTTType {
  STREAM = 'STREAM',
  RENT = 'RENT',
  BUY = 'BUY',
  FREE = 'FREE',
}

export enum AwardResult {
  WON = 'WON',
  NOMINATED = 'NOMINATED',
}

export enum ActivityType {
  RATED = 'RATED',
  REVIEWED = 'REVIEWED',
  WATCHLISTED = 'WATCHLISTED',
  LISTED = 'LISTED',
  FOLLOWED = 'FOLLOWED',
  COMMENTED = 'COMMENTED',
}

export enum VideoType {
  TRAILER = 'TRAILER',
  TEASER = 'TEASER',
  CLIP = 'CLIP',
  BEHIND_THE_SCENES = 'BEHIND_THE_SCENES',
  FEATURETTE = 'FEATURETTE',
}

// ============================================
// CORE MODELS
// ============================================

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  country?: string;
  language: string;
  darkMode: boolean;
  isPremium: boolean;
  premiumUntil?: string;
  createdAt: string;
  updatedAt: string;

  // Computed / joined
  reviewCount?: number;
  ratingCount?: number;
  watchlistCount?: number;
  listCount?: number;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface UserPreference {
  id: string;
  userId: string;
  favoriteGenres: number[];
  dislikedGenres: number[];
  preferredLanguages: string[];
  adultContent: boolean;
  emailNotifications: boolean;
}

export interface Movie {
  id: string;
  tmdbId: number;
  imdbId?: string;
  title: string;
  originalTitle?: string;
  tagline?: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  mediaType: MediaType;
  releaseDate?: string;
  runtime?: number;
  budget?: number;
  revenue?: number;
  status?: string;
  originalLang?: string;
  popularity: number;
  voteAverage: number;
  voteCount: number;
  adult: boolean;
  homepage?: string;
  trailerKey?: string;

  // TV-specific
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  firstAirDate?: string;
  lastAirDate?: string;
  inProduction?: boolean;

  // Platform aggregated scores
  avgUserRating?: number;
  criticScore?: number;
  audienceScore?: number;
  totalReviews: number;
  totalRatings: number;

  // Relations (populated on detail page)
  genres?: Genre[];
  cast?: CastMember[];
  crew?: CrewMember[];
  reviews?: Review[];
  ottPlatforms?: MovieOTTPlatform[];
  awards?: Award[];
  videos?: VideoAsset[];
  photos?: MediaAsset[];
  similar?: MovieCard[];
  recommendations?: MovieCard[];

  // User-specific state
  userRating?: number;
  isInWatchlist?: boolean;
  userReview?: Review;
}

/** Lightweight movie data for cards/grids */
export interface MovieCard {
  id: string;
  tmdbId: number;
  title: string;
  posterPath?: string;
  backdropPath?: string;
  mediaType: MediaType;
  releaseDate?: string;
  voteAverage: number;
  avgUserRating?: number;
  genres?: Genre[];
  overview?: string;
}

export interface Genre {
  id: string;
  tmdbId: number;
  name: string;
  slug: string;
}

// ============================================
// CAST & CREW (CELEBRITIES)
// ============================================

export interface Person {
  id: string;
  tmdbId: number;
  imdbId?: string;
  name: string;
  originalName?: string;
  biography?: string;
  birthday?: string;
  deathday?: string;
  placeOfBirth?: string;
  gender?: number;
  profilePath?: string;
  homepage?: string;
  popularity: number;
  knownForDept?: string;
  country?: string;

  // Relations
  filmography?: FilmographyEntry[];
  awards?: Award[];
  photos?: MediaAsset[];
  knownFor?: MovieCard[];
}

export interface CastMember {
  id: string;
  personId: string;
  character?: string;
  castOrder: number;
  person: {
    id: string;
    tmdbId: number;
    name: string;
    profilePath?: string;
  };
}

export interface CrewMember {
  id: string;
  personId: string;
  department?: string;
  job?: string;
  person: {
    id: string;
    tmdbId: number;
    name: string;
    profilePath?: string;
  };
}

export interface FilmographyEntry {
  movie: MovieCard;
  character?: string;
  department?: string;
  job?: string;
}

// ============================================
// REVIEWS & RATINGS
// ============================================

export interface Review {
  id: string;
  userId: string;
  movieId: string;
  title?: string;
  content: string;
  rating: number;
  spoiler: boolean;
  helpful: number;
  unhelpful: number;
  reported: boolean;
  approved: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  movie?: {
    id: string;
    title: string;
    posterPath?: string;
  };
  comments?: Comment[];
  commentCount?: number;
  userVote?: boolean | null; // true=helpful, false=unhelpful, null=no vote
}

export interface Rating {
  id: string;
  userId: string;
  movieId: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  reviewId: string;
  parentId?: string;
  content: string;
  likes: number;
  reported: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  replies?: Comment[];
}

export interface RatingDistribution {
  score: number; // 1-10
  count: number;
  percentage: number;
}

// ============================================
// WATCHLIST & LISTS
// ============================================

export interface WatchlistItem {
  id: string;
  userId: string;
  movieId: string;
  addedAt: string;
  watched: boolean;
  watchedAt?: string;
  notes?: string;
  movie: MovieCard;
}

export interface UserList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  coverImage?: string;
  slug: string;
  likes: number;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  items?: ListItem[];
}

export interface ListItem {
  id: string;
  listId: string;
  movieId: string;
  sortOrder: number;
  note?: string;
  addedAt: string;
  movie: MovieCard;
}

// ============================================
// OTT PLATFORMS
// ============================================

export interface OTTPlatform {
  id: string;
  name: string;
  slug: string;
  logoPath?: string;
  baseUrl?: string;
  country: string;
}

export interface MovieOTTPlatform {
  id: string;
  movieId: string;
  platformId: string;
  type: OTTType;
  price?: number;
  deepLink?: string;
  addedAt: string;
  expiresAt?: string;
  platform: OTTPlatform;
}

// ============================================
// AWARDS
// ============================================

export interface Award {
  id: string;
  name: string;
  ceremony: string;
  year: number;
  category: string;
  result: AwardResult;
  movieId?: string;
  personId?: string;
  movie?: MovieCard;
  person?: {
    id: string;
    name: string;
    profilePath?: string;
  };
}

// ============================================
// MEDIA ASSETS
// ============================================

export interface MediaAsset {
  id: string;
  movieId?: string;
  personId?: string;
  type: 'POSTER' | 'BACKDROP' | 'STILL' | 'PROFILE' | 'LOGO';
  filePath: string;
  width?: number;
  height?: number;
  cdnUrl?: string;
}

export interface VideoAsset {
  id: string;
  movieId: string;
  type: VideoType;
  name?: string;
  key: string; // YouTube key
  site: string;
  size?: number;
  official: boolean;
}

// ============================================
// NEWS
// ============================================

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  authorName?: string;
  source?: string;
  sourceUrl?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  tags?: NewsTag[];
  relatedMovies?: MovieCard[];
}

export interface NewsTag {
  id: string;
  name: string;
  slug: string;
}

// ============================================
// ACTIVITY & NOTIFICATIONS
// ============================================

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// ============================================
// AI FEATURES
// ============================================

export interface AIRecommendation {
  movieId: string;
  movie: MovieCard;
  score: number;
  reason: string; // "Because you watched Interstellar"
  algorithm: 'collaborative' | 'content-based' | 'hybrid';
}

export interface AIRecommendationGroup {
  title: string; // "Because you watched Interstellar"
  type: 'watched' | 'similar' | 'genre' | 'trending';
  movies: AIRecommendation[];
}

export interface AIReviewSummary {
  id: string;
  movieId: string;
  summary: string;
  sentiment: 'positive' | 'mixed' | 'negative';
  keyThemes: string[];
  basedOn: number;
  model?: string;
  createdAt: string;
}

export interface AISearchResult {
  query: string;
  interpretation: string; // "Showing sci-fi movies from 2020 with rating above 8"
  movies: MovieCard[];
  totalResults: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, string[]>;
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

export interface SearchFilters {
  query?: string;
  mediaType?: MediaType;
  genres?: number[];
  yearFrom?: number;
  yearTo?: number;
  ratingMin?: number;
  ratingMax?: number;
  language?: string;
  sortBy?: 'popularity' | 'rating' | 'release_date' | 'title' | 'vote_count';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  type: 'movie' | 'tv' | 'person';
  posterPath?: string;
  year?: string;
  rating?: number;
}

// ============================================
// ADMIN DASHBOARD TYPES
// ============================================

export interface DashboardStats {
  totalMovies: number;
  totalUsers: number;
  totalReviews: number;
  activeSessions: number;
  newUsersToday: number;
  newReviewsToday: number;
  premiumUsers: number;
  reportedReviews: number;
}

export interface TrafficData {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  activeUsers: number;
}

export interface GenreDistribution {
  genre: string;
  count: number;
  percentage: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  createdAt: string;
  admin?: {
    name: string;
    avatar?: string;
  };
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface MovieCardProps {
  movie: MovieCard;
  variant?: 'default' | 'compact' | 'horizontal' | 'hero';
  showRating?: boolean;
  showGenres?: boolean;
  showOverview?: boolean;
  onClick?: () => void;
}

export interface RatingBadgeProps {
  score: number;
  type: 'imdb' | 'critic' | 'audience' | 'user';
  size?: 'sm' | 'md' | 'lg';
}

export interface CarouselProps {
  title: string;
  viewAllLink?: string;
  children: React.ReactNode;
}

// ============================================
// TMDB API TYPES (External)
// ============================================

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string; // For TV shows
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  budget?: number;
  revenue?: number;
  status?: string;
  tagline?: string;
  original_language: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
  adult: boolean;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  homepage?: string;
  imdb_id?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  last_air_date?: string;
  in_production?: boolean;
}

export interface TMDBCredits {
  id: number;
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBCastMember {
  id: number;
  name: string;
  original_name: string;
  character: string;
  profile_path: string | null;
  order: number;
  gender: number;
  known_for_department: string;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  original_name: string;
  department: string;
  job: string;
  profile_path: string | null;
  gender: number;
}

export interface TMDBPerson {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  gender: number;
  known_for_department: string;
  popularity: number;
  homepage: string | null;
  imdb_id: string | null;
  also_known_as: string[];
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

"use client";

export interface WatchlistItem {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  media_type: "movie" | "tv";
  addedAt: string;
}

export interface RatingItem {
  id: number;
  score: number;
  ratedAt: string;
}

export interface ReviewItem {
  id: string;
  mediaId: number;
  mediaTitle: string;
  mediaPoster: string | null;
  mediaType: "movie" | "tv";
  title: string;
  content: string;
  rating: number;
  createdAt: string;
}

const STORAGE_KEYS = {
  WATCHLIST: "movieverse_watchlist",
  RATINGS: "movieverse_ratings",
  REVIEWS: "movieverse_reviews",
};

// Safe access helper
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading key "${key}" from localStorage:`, error);
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing key "${key}" to localStorage:`, error);
  }
};

// ============================================
// WATCHLIST ACTIONS
// ============================================

export function getWatchlist(): WatchlistItem[] {
  return getStorageItem<WatchlistItem[]>(STORAGE_KEYS.WATCHLIST, []);
}

export function addToWatchlist(item: Omit<WatchlistItem, "addedAt">): void {
  const watchlist = getWatchlist();
  if (watchlist.some((w) => w.id === item.id)) return;
  
  const newItem: WatchlistItem = {
    ...item,
    addedAt: new Date().toISOString(),
  };
  setStorageItem(STORAGE_KEYS.WATCHLIST, [...watchlist, newItem]);
  window.dispatchEvent(new Event("watchlist-updated"));
}

export function removeFromWatchlist(id: number): void {
  const watchlist = getWatchlist();
  setStorageItem(
    STORAGE_KEYS.WATCHLIST,
    watchlist.filter((w) => w.id !== id)
  );
  window.dispatchEvent(new Event("watchlist-updated"));
}

export function inWatchlist(id: number): boolean {
  const watchlist = getWatchlist();
  return watchlist.some((w) => w.id === id);
}

// ============================================
// RATINGS ACTIONS
// ============================================

export function getRatings(): RatingItem[] {
  return getStorageItem<RatingItem[]>(STORAGE_KEYS.RATINGS, []);
}

export function addRating(id: number, score: number): void {
  const ratings = getRatings();
  const filtered = ratings.filter((r) => r.id !== id);
  const newItem: RatingItem = {
    id,
    score,
    ratedAt: new Date().toISOString(),
  };
  setStorageItem(STORAGE_KEYS.RATINGS, [...filtered, newItem]);
  window.dispatchEvent(new Event("ratings-updated"));
}

export function getMediaRating(id: number): number | null {
  const ratings = getRatings();
  const found = ratings.find((r) => r.id === id);
  return found ? found.score : null;
}

// ============================================
// REVIEWS ACTIONS
// ============================================

export function getReviews(): ReviewItem[] {
  return getStorageItem<ReviewItem[]>(STORAGE_KEYS.REVIEWS, []);
}

export function addReview(
  review: Omit<ReviewItem, "id" | "createdAt">
): void {
  const reviews = getReviews();
  const newReview: ReviewItem = {
    ...review,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
  };
  setStorageItem(STORAGE_KEYS.REVIEWS, [newReview, ...reviews]);
  window.dispatchEvent(new Event("reviews-updated"));
}

export function deleteReview(id: string): void {
  const reviews = getReviews();
  setStorageItem(
    STORAGE_KEYS.REVIEWS,
    reviews.filter((r) => r.id !== id)
  );
  window.dispatchEvent(new Event("reviews-updated"));
}

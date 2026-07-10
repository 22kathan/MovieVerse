// ============================================
// MovieVerse — Utility Functions
// Shared helpers used across the application
// ============================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 * Prevents conflicting utility classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to relative time: "2 hours ago", "3 days ago"
 */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

/**
 * Generate a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

/**
 * Debounce a function call (for search input, etc.)
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate initials from a name: "Leonardo DiCaprio" → "LD"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(dateStr: string): boolean {
  return new Date(dateStr) > new Date();
}

/**
 * Calculate age from birthday
 */
export function calculateAge(birthday: string, deathday?: string): number {
  const birth = new Date(birthday);
  const end = deathday ? new Date(deathday) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get a greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Generate rating text based on score (1-10)
 */
export function getRatingText(score: number): string {
  if (score >= 9) return 'Masterpiece';
  if (score >= 8) return 'Excellent';
  if (score >= 7) return 'Great';
  if (score >= 6) return 'Good';
  if (score >= 5) return 'Average';
  if (score >= 4) return 'Below Average';
  if (score >= 3) return 'Poor';
  return 'Terrible';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Get certification/rating badge color
 */
export function getCertificationColor(cert: string): string {
  const colors: Record<string, string> = {
    'G': '#22c55e',
    'PG': '#84cc16',
    'PG-13': '#f59e0b',
    'R': '#ef4444',
    'NC-17': '#dc2626',
    'U': '#22c55e',
    'UA': '#84cc16',
    'A': '#ef4444',
  };
  return colors[cert] || '#64748b';
}

/**
 * Create an array of numbers for star rating display
 */
export function getStarArray(rating: number, maxStars: number = 5): ('full' | 'half' | 'empty')[] {
  const normalizedRating = (rating / 10) * maxStars; // Convert 1-10 to 1-5
  return Array.from({ length: maxStars }, (_, i) => {
    if (i + 1 <= Math.floor(normalizedRating)) return 'full';
    if (i + 0.5 <= normalizedRating) return 'half';
    return 'empty';
  });
}

/**
 * Format vote count for display: 15234 → "15.2K votes"
 */
export function formatVoteCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M votes`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K votes`;
  return `${count} votes`;
}

/**
 * Get language name from ISO 639-1 code
 */
export function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic',
    ta: 'Tamil',
    te: 'Telugu',
    ml: 'Malayalam',
    kn: 'Kannada',
    bn: 'Bengali',
    mr: 'Marathi',
  };
  return languages[code] || code.toUpperCase();
}

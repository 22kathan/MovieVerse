'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search as SearchIcon, Film, Tv, User } from 'lucide-react';

// Using the TMDB types from your types file for the search results
import { TMDBMovie, TMDBPerson } from '@/types';
import { searchWithElastic, searchWithElasticSync } from '@/lib/elasticsearch';
import { getImageUrl } from '@/lib/tmdb';
import SafeImage from '@/components/shared/SafeImage';

type SearchResultItem = (TMDBMovie | TMDBPerson) & { media_type: 'movie' | 'tv' | 'person' };

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Instant 0ms response on every keystroke
  useEffect(() => {
    if (query.trim().length > 0) {
      // 1. Instant 0ms Sync Local Result
      const instantData = searchWithElasticSync(query.trim());
      const instantNormalized = (instantData.results || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        name: item.title,
        media_type: item.media_type,
        poster_path: item.poster_path || null,
        profile_path: item.poster_path || null,
        vote_average: item.rating || 0,
        release_date: item.release_date || '',
        overview: item.overview || '',
        score: item.score,
        highlightedTitle: item.highlightedTitle,
        highlightedOverview: item.highlightedOverview
      })) as unknown as SearchResultItem[];

      setResults(instantNormalized);
      setIsOpen(true);

      // 2. Asynchronous background network supplement
      let active = true;
      async function fetchNetworkResults() {
        try {
          const response = await fetch(`/api/search?query=${encodeURIComponent(query.trim())}`);
          if (response.ok) {
            const data = await response.json();
            if (active && data.results && data.results.length > 0) {
              const combinedMap = new Map<number, any>();
              instantNormalized.forEach(item => combinedMap.set(item.id, item));
              data.results.forEach((item: any) => combinedMap.set(item.id, item));
              setResults(Array.from(combinedMap.values()));
            }
          }
        } catch {
          // Keep instant sync results
        }
      }

      fetchNetworkResults();

      return () => {
        active = false;
      };
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
  };

  const getResultLink = (item: SearchResultItem) => {
    if (item.media_type === 'movie') return `/movies/${item.id}`;
    if (item.media_type === 'tv') return `/tv/${item.id}`;
    if (item.media_type === 'person') return `/person/${item.id}`;
    return '/';
  };

  const getResultTitle = (item: SearchResultItem) => {
    if (item.media_type === 'movie') return (item as TMDBMovie).title;
    if (item.media_type === 'tv') return (item as TMDBMovie).name;
    if (item.media_type === 'person') return (item as TMDBPerson).name;
    return 'Unknown';
  };

  const getResultIcon = (mediaType: string) => {
    if (mediaType === 'movie') return <Film className="h-4 w-4 text-gray-400" />;
    if (mediaType === 'tv') return <Tv className="h-4 w-4 text-gray-400" />;
    if (mediaType === 'person') return <User className="h-4 w-4 text-gray-400" />;
    return null;
  };

  return (
    <div className="relative w-full max-w-md" ref={searchContainerRef}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder="Search for movies, TV shows, people..."
          className="w-full pl-10 pr-4 py-2 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>
      {isOpen && results.length > 0 && (
        <ul className="absolute z-10 w-full mt-2 bg-[var(--bg-secondary)] rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.slice(0, 10).map((item) => (
            <li key={item.id} className="border-b border-gray-700 last:border-b-0">
              <Link href={getResultLink(item)} onClick={handleResultClick} className="flex items-center p-3 hover:bg-gray-700 transition-colors duration-150">
                <div className="w-10 h-14 bg-gray-700 rounded-md flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                  <SafeImage
                    src={getImageUrl(
                      (item as any).poster_path || (item as any).profile_path,
                      item.media_type === "person" ? "profile" : "poster",
                      "sm"
                    )}
                    alt={getResultTitle(item) || 'Movie Poster'}
                    fallbackType={item.media_type === "person" ? "profile" : "poster"}
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{getResultTitle(item)}</p>
                  <p className="text-xs text-gray-400 capitalize">{item.media_type.replace('_', ' ')}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
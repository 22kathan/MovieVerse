"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { searchWithElastic } from "@/lib/elasticsearch";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  LogIn,
  LogOut,
  Settings,
  Bookmark,
  Star,
  Loader2,
  Shield,
  Crown,
  List,
  Home,
  Film,
  Tv,
  Users,
  TrendingUp,
  Sparkles,
  Newspaper,
  Trophy,
  Heart,
  Activity,
} from "lucide-react";
import NotificationBell from "@/components/shared/NotificationBell";

interface SearchSuggestion {
  id: number;
  title: string;
  highlightedTitle?: string;
  media_type: string;
  release_year: number | null;
  image_path: string | null;
  rating: number | null;
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<string>("loading");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const isStatic = window.location.hostname.includes("github.io") ||
                     window.location.port === "8000" ||
                     process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

    if (isStatic) {
      const loadMockSession = () => {
        const mockSessionStr = localStorage.getItem("movieverse_mock_session");
        if (mockSessionStr) {
          try {
            const mockSession = JSON.parse(mockSessionStr);
            setSession(mockSession);
            setStatus("authenticated");
          } catch {
            setSession(null);
            setStatus("unauthenticated");
          }
        } else {
          setSession(null);
          setStatus("unauthenticated");
        }
      };

      loadMockSession();

      // Listen for session and storage changes
      window.addEventListener("storage", loadMockSession);
      window.addEventListener("movieverse_session_change", loadMockSession);
      return () => {
        window.removeEventListener("storage", loadMockSession);
        window.removeEventListener("movieverse_session_change", loadMockSession);
      };
    } else {
      setSession(nextAuthSession);
      setStatus(nextAuthStatus);
    }
  }, [nextAuthSession, nextAuthStatus]);

  const isPremium = session?.user && ((session.user as any).isPremium || (session.user as any).role === "PREMIUM" || (session.user as any).role === "ADMIN");
  const isAdmin = session?.user && (session.user as any).role === "ADMIN";

  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileMenuOpen(false);
      setSearchFocused(false);
      setSearchQuery("");
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Debounce search query to fetch suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const isStatic = window.location.hostname.includes("github.io") ||
                         window.location.port === "8000" ||
                         process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

        if (isStatic) {
          const response = await searchWithElastic(searchQuery.trim(), "all", 1);
          const mappedSuggestions = (response.results || [])
            .slice(0, 6)
            .map((item: any) => {
              return {
                id: item.id,
                title: item.title,
                highlightedTitle: item.highlightedTitle || item.title,
                media_type: item.media_type,
                release_year: item.release_year || null,
                image_path: item.poster_path || null,
                rating: item.rating || null,
                score: item.score
              };
            });
          setSuggestions(mappedSuggestions);
        } else {
          const res = await fetch(
            `/api/search/suggestions?q=${encodeURIComponent(searchQuery.trim())}`
          );
          const data = await res.json();
          if (data.suggestions) {
            setSuggestions(data.suggestions);
          }
        }
      } catch (err) {
        console.error("Error fetching suggestions", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 150);

    return () => {
      clearTimeout(delayDebounce);
    };
  }, [searchQuery]);

  // Click outside suggestions dropdown detector
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard listeners: Escape and Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchFocused(false);
        searchRef.current?.blur();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "light" : "dark"
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
      searchRef.current?.blur();
    }
  };

  const handleSuggestionClick = (mediaType: string, id: number) => {
    let url = "";
    if (mediaType === "movie") url = `/movies/${id}`;
    else if (mediaType === "tv") url = `/tv/${id}`;
    else if (mediaType === "person") url = `/celebrities/${id}`;

    if (url) {
      router.push(url);
      setSearchQuery("");
      setSearchFocused(false);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-[260px] z-[var(--z-sticky)] h-[var(--header-height)]">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-[var(--bg-glass)] backdrop-blur-xl border-b border-[var(--bg-glass-border)]" />

      <div className="relative flex items-center justify-between h-full px-4 md:px-6 gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Search Bar Container */}
        <div ref={containerRef} className="flex-1 max-w-xl relative">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div
              className={`flex items-center gap-2 bg-[var(--bg-surface)] rounded-xl px-4 py-2.5 transition-all duration-300 border ${
                searchFocused
                  ? "border-[var(--brand-primary)] shadow-[var(--shadow-glow-brand)]"
                  : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
              }`}
            >
              <Search className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search movies, shows, actors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
              {loadingSuggestions && (
                <Loader2 className="w-3.5 h-3.5 text-[var(--text-tertiary)] animate-spin shrink-0" />
              )}
              {searchQuery && !loadingSuggestions && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchRef.current?.focus();
                  }}
                  className="p-0.5 rounded hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded border border-[var(--border-primary)]">
                ⌘K
              </kbd>
            </div>
          </form>

          {/* Search Suggestions Dropdown */}
          <AnimatePresence>
            {searchFocused && searchQuery.trim().length >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl shadow-[var(--shadow-xl)] overflow-hidden z-50 divide-y divide-[var(--border-primary)]/50"
              >
                {suggestions.length > 0 ? (
                  <div className="py-1">
                    {suggestions.map((item) => (
                      <button
                        key={`${item.media_type}-${item.id}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(item.media_type, item.id);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--bg-elevated)] transition-colors group cursor-pointer"
                      >
                        {/* Thumbnail */}
                        <div className="w-9 h-12 bg-[var(--bg-tertiary)] rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center border border-[var(--border-primary)]/50 text-base shadow-sm">
                          {item.image_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${item.image_path}`}
                              alt={item.title}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          ) : (
                            <span>
                              {item.media_type === "movie"
                                ? "🎬"
                                : item.media_type === "tv"
                                ? "📺"
                                : "👤"}
                            </span>
                          )}
                        </div>

                        {/* Title and details */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          {item.highlightedTitle ? (
                            <h4 
                              className="text-sm font-semibold text-white group-hover:text-[var(--brand-primary-light)] transition-colors truncate"
                              dangerouslySetInnerHTML={{ __html: item.highlightedTitle }}
                            />
                          ) : (
                            <h4 className="text-sm font-semibold text-white group-hover:text-[var(--brand-primary-light)] transition-colors truncate">
                              {item.title}
                            </h4>
                          )}
                          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                            <span className="capitalize px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[10px] font-bold tracking-wider text-[var(--text-tertiary)]">
                              {item.media_type === "movie"
                                ? "Movie"
                                : item.media_type === "tv"
                                ? "TV Show"
                                : "Actor"}
                            </span>
                            {item.release_year && (
                              <span>• {item.release_year}</span>
                            )}
                            {item.rating && (
                              <span className="flex items-center gap-0.5 text-amber-500 font-medium ml-auto">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                {item.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  !loadingSuggestions && (
                    <div className="p-4 text-center text-sm text-[var(--text-tertiary)]">
                      No matches found for &quot;{searchQuery}&quot;
                    </div>
                  )
                )}
                
                {/* Search all link */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSearchSubmit(e);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--brand-primary-light)] hover:text-white transition-all text-left"
                >
                  <span>Search all results for &quot;{searchQuery}&quot;</span>
                  <span>🔍</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-[var(--bg-surface)] transition-all duration-200 group"
            aria-label="Toggle theme"
          >
            <motion.div
              key={isDark ? "moon" : "sun"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {isDark ? (
                <Moon className="w-[18px] h-[18px] text-[var(--text-secondary)] group-hover:text-[var(--brand-accent)]" />
              ) : (
                <Sun className="w-[18px] h-[18px] text-[var(--text-secondary)] group-hover:text-[var(--brand-accent)]" />
              )}
            </motion.div>
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* User Avatar / Sign In */}
          {status === "authenticated" && session?.user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 pr-3 rounded-xl hover:bg-[var(--bg-surface)] transition-all duration-200 ml-1"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white text-sm font-bold">
                    {(session.user.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-medium text-[var(--text-primary)] max-w-[100px] truncate">
                  {session.user.name || "User"}
                </span>
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl shadow-[var(--shadow-xl)] overflow-hidden z-50"
                  >
                     <div className="p-3 border-b border-[var(--border-primary)]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{session.user.name}</p>
                        {isPremium && (
                          <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-0.5 shrink-0">
                            <Crown className="w-2.5 h-2.5 fill-amber-400" /> VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">{session.user.email}</p>
                    </div>
                    <div className="p-1">
                      <Link href="/watchlist" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <Bookmark className="w-4 h-4" /> My Watchlist
                      </Link>
                      <Link href="/reviews" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <Star className="w-4 h-4" /> My Reviews
                      </Link>
                      <Link href="/settings" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors font-medium border-t border-[var(--border-primary)]/40 mt-1 pt-2" onClick={() => setUserMenuOpen(false)}>
                          <Shield className="w-4 h-4" /> Admin Center
                        </Link>
                      )}
                      {!isPremium && !isAdmin && (
                        <Link href="/premium" className="flex items-center gap-2.5 px-3 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors font-medium border-t border-[var(--border-primary)]/40 mt-1 pt-2" onClick={() => setUserMenuOpen(false)}>
                          <Crown className="w-4 h-4" /> Go Premium VIP
                        </Link>
                      )}
                    </div>
                    <div className="p-1 border-t border-[var(--border-primary)]">
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut(); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white text-sm font-medium hover:opacity-90 transition-opacity ml-1"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
            />

            {/* Sidebar drawer container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] border-r border-[var(--bg-glass-border)] z-[100] flex flex-col md:hidden overflow-y-auto"
            >
              {/* Logo / Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-primary)]/40">
                <Link
                  href="/"
                  className="flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center shadow-lg">
                    <Film className="w-4.5 h-4.5 text-white" />
                  </div>
                  <h1 className="text-base font-bold font-[var(--font-display)] tracking-tight">
                    <span className="bg-gradient-to-r from-[var(--brand-primary-light)] via-[var(--brand-secondary)] to-[var(--brand-accent)] bg-clip-text text-transparent">
                      MovieVerse
                    </span>
                  </h1>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>

              {/* User profile section if logged in */}
              {status === "authenticated" && session?.user && (
                <div className="p-4 border-b border-[var(--border-primary)]/40 bg-[var(--bg-surface)]/30">
                  <div className="flex items-center gap-3">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={36}
                        height={36}
                        className="rounded-lg object-cover border border-[var(--border-primary)]/50"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold">
                        {(session.user.name || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate flex items-center gap-1">
                        {session.user.name}
                        {isPremium && (
                          <span className="text-[8px] font-extrabold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30">
                            VIP
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">{session.user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="flex-1 px-4 py-6 space-y-6">
                <div className="space-y-1.5">
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Menu
                  </p>
                  <MobileNavItem href="/" label="Home" icon={Home} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                  <MobileNavItem href="/movies" label="Movies" icon={Film} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                  <MobileNavItem href="/tv" label="TV Shows" icon={Tv} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                  <MobileNavItem href="/celebrities" label="Celebrities" icon={Users} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                  <MobileNavItem href="/trending" label="Trending" icon={TrendingUp} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                </div>

                <div className="space-y-1.5">
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Discover
                  </p>
                  <MobileNavItem href="/top-rated" label="Top Rated" icon={Star} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                  <MobileNavItem href="/upcoming" label="Upcoming" icon={Activity} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                  <MobileNavItem href="/ai-search" label="AI Search" icon={Sparkles} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                  <MobileNavItem href="/news" label="News & Trailers" icon={Newspaper} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                  <MobileNavItem href="/awards" label="Awards" icon={Trophy} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                </div>

                {status === "authenticated" && (
                  <div className="space-y-1.5">
                    <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Personal
                    </p>
                    <MobileNavItem href="/watchlist" label="My Watchlist" icon={Bookmark} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                    <MobileNavItem href="/lists" label="My Lists" icon={List} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                    <MobileNavItem href="/reviews" label="My Reviews" icon={Heart} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                  </div>
                )}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-[var(--border-primary)]/40 space-y-2">
                {status === "authenticated" ? (
                  <>
                    <MobileNavItem href="/settings" label="Settings" icon={Settings} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} />
                    {!isPremium && !isAdmin && (
                      <MobileNavItem href="/premium" label="Go Premium VIP" icon={Crown} pathname={pathname} setMobileMenuOpen={setMobileMenuOpen} highlight />
                    )}
                    <button
                      onClick={() => { setMobileMenuOpen(false); signOut(); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white text-xs font-semibold hover:opacity-95 transition-opacity"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

interface MobileNavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
  setMobileMenuOpen: (open: boolean) => void;
  highlight?: boolean;
}

function MobileNavItem({
  href,
  label,
  icon: Icon,
  pathname,
  setMobileMenuOpen,
  highlight = false,
}: MobileNavItemProps) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link href={href} onClick={() => setMobileMenuOpen(false)}>
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
          active
            ? "text-white bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] shadow-md"
            : highlight
            ? "text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20"
            : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-surface)]"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </div>
    </Link>
  );
}

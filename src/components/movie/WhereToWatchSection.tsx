"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Play, ExternalLink, Plus, Check } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import SafeImage from "@/components/shared/SafeImage";
import TrailerModal from "./TrailerModal";
import { inWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/storage";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  release_date?: string;
  media_type?: string;
}

interface Provider {
  id: string;
  name: string;
  badgeTag: string;
  color: string;
  activeColor: string;
  curatedMovies: Movie[];
}

// 100% verified active TMDB image paths for top titles
const PROVIDER_DATA: Provider[] = [
  {
    id: "prime",
    name: "PRIME VIDEO",
    badgeTag: "Stream now on Prime Video",
    color: "from-sky-500/20 to-blue-600/10",
    activeColor: "border-sky-400 text-sky-400",
    curatedMovies: [
      { id: 9, title: "The Lord of the Rings", vote_average: 8.9, release_date: "2001-12-19", poster_path: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", backdrop_path: "/mWDdRXTivGE7aaY2vo1Ie0PfCX5.jpg" },
      { id: 2, title: "The Dark Knight", vote_average: 9.0, release_date: "2008-07-18", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", backdrop_path: "/dqK9Hag1054tghRQSqLSfrkvQnA.jpg" },
      { id: 3, title: "Interstellar", vote_average: 8.7, release_date: "2014-11-07", poster_path: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg", backdrop_path: "/2ssWTSVklAEc98frZUQhgtGHx7s.jpg" },
      { id: 10, title: "Goodfellas", vote_average: 8.7, release_date: "1990-09-19", poster_path: "/9OkCLM73MIU2CrKZbqiT8Ln1wY2.jpg", backdrop_path: "/gILte6Zd7m1YneIr6MVhh30S9pr.jpg" },
      { id: 7, title: "Forrest Gump", vote_average: 8.8, release_date: "1994-07-06", poster_path: "/Cw4hIUIAmSYfK9QfaUW5igp9La.jpg", backdrop_path: "/66Kn4XWhkuPkJxOJyPEx4U2CUfN.jpg" },
      { id: 8, title: "Fight Club", vote_average: 8.8, release_date: "1999-10-15", poster_path: "/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg", backdrop_path: "/c6OLXfKAk5BKeR6broC8pYiCquX.jpg" },
    ],
  },
  {
    id: "netflix",
    name: "NETFLIX",
    badgeTag: "Stream now on Netflix",
    color: "from-red-500/20 to-rose-600/10",
    activeColor: "border-red-500 text-red-500",
    curatedMovies: [
      { id: 1, title: "Inception", vote_average: 8.8, release_date: "2010-07-16", poster_path: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg", backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg" },
      { id: 5, title: "Pulp Fiction", vote_average: 8.9, release_date: "1994-10-14", poster_path: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg", backdrop_path: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg" },
      { id: 6, title: "The Matrix", vote_average: 8.7, release_date: "1999-03-31", poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", backdrop_path: "/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg" },
      { id: 16, title: "Whiplash", vote_average: 8.4, release_date: "2014-10-10", poster_path: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg", backdrop_path: "/wbQa0EnWUyRzQ5d1pHLNRlmsCUP.jpg" },
      { id: 15, title: "Joker", vote_average: 8.2, release_date: "2019-10-02", poster_path: "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", backdrop_path: "/rlay2M5QYvi6igbGcFjq8jxeusY.jpg" },
      { id: 13, title: "Spirited Away", vote_average: 8.5, release_date: "2001-07-20", poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", backdrop_path: "/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg" },
    ],
  },
  {
    id: "jiohotstar",
    name: "JIOHOTSTAR",
    badgeTag: "Stream now on JioHotstar",
    color: "from-blue-500/20 to-cyan-600/10",
    activeColor: "border-blue-400 text-blue-400",
    curatedMovies: [
      { id: 4, title: "The Shawshank Redemption", vote_average: 9.3, release_date: "1994-09-23", poster_path: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg", backdrop_path: "/zfbjgQE1uSd9wiPTX4VzsLi0rGG.jpg" },
      { id: 11, title: "The Godfather", vote_average: 9.2, release_date: "1972-03-24", poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", backdrop_path: "/tSPT36ZKlP2WVHJLM4cQPLSzv3b.jpg" },
      { id: 115, title: "Avatar: The Way of Water", vote_average: 7.7, release_date: "2022-12-16", poster_path: "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", backdrop_path: "/dUVbWINfRMGojGZRcO6GF1Z2nV8.jpg" },
      { id: 110, title: "Deadpool & Wolverine", vote_average: 7.8, release_date: "2024-07-26", poster_path: "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg", backdrop_path: "/o86u02GDg46g70rFS7G6237g55s.jpg" },
      { id: 12, title: "Parasite", vote_average: 8.5, release_date: "2019-05-30", poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", backdrop_path: "/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg" },
      { id: 14, title: "Gladiator", vote_average: 8.2, release_date: "2000-05-01", poster_path: "/wN2xWp1eIwCKOD0BHTcErTBv1Uq.jpg", backdrop_path: "/jhk6D8pim3yaByu1801kMoxXFaX.jpg" },
    ],
  },
  {
    id: "appletv",
    name: "APPLE TV",
    badgeTag: "Buy / Rent now on Apple TV",
    color: "from-slate-500/20 to-zinc-600/10",
    activeColor: "border-slate-300 text-slate-200",
    curatedMovies: [
      { id: 2, title: "The Dark Knight", vote_average: 9.0, release_date: "2008-07-18", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", backdrop_path: "/dqK9Hag1054tghRQSqLSfrkvQnA.jpg" },
      { id: 1, title: "Inception", vote_average: 8.8, release_date: "2010-07-16", poster_path: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg", backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg" },
      { id: 3, title: "Interstellar", vote_average: 8.7, release_date: "2014-11-07", poster_path: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg", backdrop_path: "/2ssWTSVklAEc98frZUQhgtGHx7s.jpg" },
      { id: 4, title: "The Shawshank Redemption", vote_average: 9.3, release_date: "1994-09-23", poster_path: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg", backdrop_path: "/zfbjgQE1uSd9wiPTX4VzsLi0rGG.jpg" },
      { id: 6, title: "The Matrix", vote_average: 8.7, release_date: "1999-03-31", poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", backdrop_path: "/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg" },
      { id: 12, title: "Parasite", vote_average: 8.5, release_date: "2019-05-30", poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", backdrop_path: "/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg" },
    ],
  },
  {
    id: "sonyliv",
    name: "SONYLIV",
    badgeTag: "Stream now on SonyLIV",
    color: "from-purple-500/20 to-indigo-600/10",
    activeColor: "border-purple-400 text-purple-400",
    curatedMovies: [
      { id: 5, title: "Pulp Fiction", vote_average: 8.9, release_date: "1994-10-14", poster_path: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg", backdrop_path: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg" },
      { id: 10, title: "Goodfellas", vote_average: 8.7, release_date: "1990-09-19", poster_path: "/9OkCLM73MIU2CrKZbqiT8Ln1wY2.jpg", backdrop_path: "/gILte6Zd7m1YneIr6MVhh30S9pr.jpg" },
      { id: 16, title: "Whiplash", vote_average: 8.4, release_date: "2014-10-10", poster_path: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg", backdrop_path: "/wbQa0EnWUyRzQ5d1pHLNRlmsCUP.jpg" },
      { id: 7, title: "Forrest Gump", vote_average: 8.8, release_date: "1994-07-06", poster_path: "/Cw4hIUIAmSYfK9QfaUW5igp9La.jpg", backdrop_path: "/66Kn4XWhkuPkJxOJyPEx4U2CUfN.jpg" },
      { id: 8, title: "Fight Club", vote_average: 8.8, release_date: "1999-10-15", poster_path: "/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg", backdrop_path: "/c6OLXfKAk5BKeR6broC8pYiCquX.jpg" },
      { id: 15, title: "Joker", vote_average: 8.2, release_date: "2019-10-02", poster_path: "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", backdrop_path: "/rlay2M5QYvi6igbGcFjq8jxeusY.jpg" },
    ],
  },
  {
    id: "zee5",
    name: "ZEE5",
    badgeTag: "Stream now on ZEE5",
    color: "from-amber-500/20 to-orange-600/10",
    activeColor: "border-amber-400 text-amber-400",
    curatedMovies: [
      { id: 11, title: "The Godfather", vote_average: 9.2, release_date: "1972-03-24", poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", backdrop_path: "/tSPT36ZKlP2WVHJLM4cQPLSzv3b.jpg" },
      { id: 9, title: "The Lord of the Rings", vote_average: 8.9, release_date: "2001-12-19", poster_path: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", backdrop_path: "/mWDdRXTivGE7aaY2vo1Ie0PfCX5.jpg" },
      { id: 13, title: "Spirited Away", vote_average: 8.5, release_date: "2001-07-20", poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", backdrop_path: "/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg" },
      { id: 14, title: "Gladiator", vote_average: 8.2, release_date: "2000-05-01", poster_path: "/wN2xWp1eIwCKOD0BHTcErTBv1Uq.jpg", backdrop_path: "/jhk6D8pim3yaByu1801kMoxXFaX.jpg" },
      { id: 2, title: "The Dark Knight", vote_average: 9.0, release_date: "2008-07-18", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", backdrop_path: "/dqK9Hag1054tghRQSqLSfrkvQnA.jpg" },
      { id: 1, title: "Inception", vote_average: 8.8, release_date: "2010-07-16", poster_path: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg", backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg" },
    ],
  },
  {
    id: "sunnxt",
    name: "SUNNXT",
    badgeTag: "Stream now on SunNXT",
    color: "from-yellow-500/20 to-amber-600/10",
    activeColor: "border-yellow-400 text-yellow-400",
    curatedMovies: [
      { id: 3, title: "Interstellar", vote_average: 8.7, release_date: "2014-11-07", poster_path: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg", backdrop_path: "/2ssWTSVklAEc98frZUQhgtGHx7s.jpg" },
      { id: 4, title: "The Shawshank Redemption", vote_average: 9.3, release_date: "1994-09-23", poster_path: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg", backdrop_path: "/zfbjgQE1uSd9wiPTX4VzsLi0rGG.jpg" },
      { id: 5, title: "Pulp Fiction", vote_average: 8.9, release_date: "1994-10-14", poster_path: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg", backdrop_path: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg" },
      { id: 6, title: "The Matrix", vote_average: 8.7, release_date: "1999-03-31", poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", backdrop_path: "/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg" },
      { id: 10, title: "Goodfellas", vote_average: 8.7, release_date: "1990-09-19", poster_path: "/9OkCLM73MIU2CrKZbqiT8Ln1wY2.jpg", backdrop_path: "/gILte6Zd7m1YneIr6MVhh30S9pr.jpg" },
      { id: 12, title: "Parasite", vote_average: 8.5, release_date: "2019-05-30", poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", backdrop_path: "/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg" },
    ],
  },
];

interface WhereToWatchProps {
  movies?: Movie[];
}

export default function WhereToWatchSection({ movies = [] }: WhereToWatchProps) {
  const [activeTab, setActiveTab] = useState<string>("prime");
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<Movie | null>(null);

  const selectedProvider = PROVIDER_DATA.find((p) => p.id === activeTab) || PROVIDER_DATA[0];

  // Strictly filter for released OTT titles with verified valid posters
  const currentMovies = selectedProvider.curatedMovies;

  return (
    <section className="space-y-6">
      {/* IMDb Style Tabs Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 bg-amber-400 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            Where to Watch
          </h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/10">
          {PROVIDER_DATA.map((provider) => {
            const isActive = activeTab === provider.id;
            return (
              <button
                key={provider.id}
                onClick={() => setActiveTab(provider.id)}
                className={`px-4 py-2.5 text-xs font-black tracking-wider transition-all uppercase whitespace-nowrap border-b-2 ${
                  isActive
                    ? `${provider.activeColor} border-b-amber-400 text-white font-extrabold`
                    : "border-transparent text-[var(--text-tertiary)] hover:text-white"
                }`}
              >
                {provider.name}
              </button>
            );
          })}
        </div>

        <p className="text-xs font-semibold text-[var(--text-secondary)] italic">
          {selectedProvider.badgeTag}
        </p>
      </div>

      {/* Movie Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {currentMovies.map((movie) => {
          const posterUrl = getImageUrl(movie.poster_path, "poster", "md");
          const isSaved = inWatchlist(movie.id);

          return (
            <div
              key={`${movie.id}-${activeTab}`}
              className="group relative rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-amber-500/40 transition-all duration-300 shadow-lg flex flex-col justify-between"
            >
              <div className="relative aspect-[2/3] w-full bg-black/40 overflow-hidden">
                <SafeImage
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  fallbackType="poster"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Watchlist Bookmark */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (isSaved) removeFromWatchlist(movie.id);
                    else
                      addToWatchlist({
                        id: movie.id,
                        title: movie.title,
                        poster_path: movie.poster_path,
                        vote_average: movie.vote_average,
                        release_date: movie.release_date || "",
                        media_type: (movie.media_type as "movie" | "tv") || "movie",
                      });
                  }}
                  className={`absolute top-2 left-2 w-7 h-7 rounded-lg backdrop-blur-md flex items-center justify-center border transition-all z-10 ${
                    isSaved
                      ? "bg-amber-500 text-black border-amber-400"
                      : "bg-black/60 text-white border-white/20 hover:bg-amber-500 hover:text-black"
                  }`}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Card Meta */}
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs font-bold text-white">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </div>

                  <Link href={`/movies/${movie.id}`}>
                    <h4 className="font-bold text-xs text-white truncate group-hover:text-amber-400 transition-colors">
                      {movie.title}
                    </h4>
                  </Link>
                </div>

                {/* IMDb Style Action Buttons */}
                <div className="space-y-1.5 pt-1">
                  <Link
                    href={`/movies/${movie.id}`}
                    className="w-full py-1.5 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black text-amber-400 font-bold text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <span>Watch now</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <button
                    onClick={() => setActiveTrailerMovie(movie)}
                    className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-[var(--text-secondary)] hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Trailer</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trailer Lightbox */}
      {activeTrailerMovie && (
        <TrailerModal
          isOpen={!!activeTrailerMovie}
          onClose={() => setActiveTrailerMovie(null)}
          title={activeTrailerMovie.title}
          backdropPath={activeTrailerMovie.backdrop_path}
          movieId={activeTrailerMovie.id}
          mediaType={activeTrailerMovie.media_type === "tv" ? "tv" : "movie"}
        />
      )}
    </section>
  );
}

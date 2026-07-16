"use client";

import { useState } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import { Calendar, ArrowUpRight, X, Play, Clock, Eye, Share2, Film } from "lucide-react";
import Image from "next/image";

const TRENDING_TRAILERS = [
  {
    id: 1,
    title: "Gladiator II",
    movieTitle: "Gladiator II",
    thumbnail: "https://img.youtube.com/vi/1Vngh9R14hs/hqdefault.jpg",
    youtubeId: "1Vngh9R14hs",
    duration: "2:30",
    views: "12M views",
  },
  {
    id: 2,
    title: "Captain America: Brave New World",
    movieTitle: "Captain America: Brave New World",
    thumbnail: "https://img.youtube.com/vi/1p3ocURpLdg/hqdefault.jpg",
    youtubeId: "1p3ocURpLdg",
    duration: "2:45",
    views: "9M views",
  },
  {
    id: 3,
    title: "Thunderbolts* - Official Teaser",
    movieTitle: "Thunderbolts*",
    thumbnail: "https://img.youtube.com/vi/v5g_N0O-tB0/hqdefault.jpg",
    youtubeId: "v5g_N0O-tB0",
    duration: "3:10",
    views: "15M views",
  },
];

const NEWS_ARTICLES = [
  {
    id: 1,
    title: "Christopher Nolan Announces Next Film with Universal Pictures",
    summary: "The Oscar-winning director has officially scheduled his next epic thriller for a Summer release. Production will begin early next year.",
    content: `Christopher Nolan, fresh off his sweeping Oscar victories for Oppenheimer, has officially locked in his next cinematic event. The acclaimed director is returning to Universal Pictures for his next feature film, which has been scheduled for an IMAX release in July 2027.

Details regarding the plot, genre, and title are being kept under lock and key in typical Syncopy fashion. However, industry insiders suggest the project is a high-concept thriller with a significant sci-fi edge, returning to the mind-bending narrative scale of Inception and Interstellar.

Casting calls are already underway, with rumors circulating that Matt Damon and Tom Holland are in negotiations for key roles. Universal Studios Chairman Donna Langley expressed immense excitement about the partnership, noting that Nolan's storytelling boundaries continue to push the medium forward.`,
    source: "Variety",
    date: "July 6, 2026",
    tag: "Hollywood",
    category: "Hollywood",
    image: "🎬",
    readTime: "3 min read",
    youtubeId: "YoHD9OB-YLM",
  },
  {
    id: 2,
    title: "Marvel Studios Unveils Phase 6 Multiverse Roadmap at SDCC",
    summary: "New details have emerged regarding the next Avengers chapters, featuring surprise casting additions and teaser logo reveals.",
    content: `San Diego Comic-Con’s Hall H erupted in applause as Marvel Studios President Kevin Feige took the stage to announce the revamped Phase 6 timeline. The highlights of the panel centered around the upcoming Avengers films: Doomsday and Secret Wars.

Feige confirmed that the Russo Brothers will return to direct both titles, marking their first collaboration with Marvel since Avengers: Endgame. In a stunning reveal, Robert Downey Jr. walked onto the stage in a Doctor Doom mask, confirming he will play Victor Von Doom in the upcoming sagas.

Additionally, Feige shared updates on Captain America: Brave New World and Thunderbolts*, promising a return to grounded, gritty espionage and character-focused narratives that define the best of the MCU.`,
    source: "The Hollywood Reporter",
    date: "July 5, 2026",
    tag: "Marvel",
    category: "Marvel",
    image: "🦸‍♂️",
    readTime: "4 min read",
    youtubeId: "1p3ocURpLdg",
  },
  {
    id: 3,
    title: "How Independent Cinema is Dominating the Streaming Market",
    summary: "An in-depth look at how boutique distribution labels are successfully bypassing theatrical runs to reach record global audiences.",
    content: `The landscape of distribution is shifting rapidly. While big-budget franchise blockbusters continue to dominate multiplex screens, independent films are finding unprecedented success through innovative digital-first distribution strategies.

Boutique labels like A24, Neon, and MUBI have reported record-breaking revenue surges by utilizing hybrid theatrical-digital releases and strategic streaming partnerships. By bypassing traditional theatrical exclusivity windows, indie filmmakers are connecting with niche communities on a global scale.

"The moviegoer has evolved," says film analyst Sarah Vance. "Audiences are craving original, risk-taking stories, and they are willing to stream them at home if they cannot find them in local theaters. This is democratizing cinema in ways we have never seen."`,
    source: "IndieWire",
    date: "July 3, 2026",
    tag: "Indie",
    category: "Indie",
    image: "🍿",
    readTime: "5 min read",
  },
];

const CATEGORIES = ["All", "Hollywood", "Marvel", "Indie"];

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeArticle, setActiveArticle] = useState<typeof NEWS_ARTICLES[0] | null>(null);
  const [activeTrailerId, setActiveTrailerId] = useState<string | null>(null);

  const filteredArticles = selectedCategory === "All" 
    ? NEWS_ARTICLES 
    : NEWS_ARTICLES.filter(art => art.category === selectedCategory);

  return (
    <div className="px-6 py-8 space-y-12 mx-auto min-h-screen pb-24" style={{ maxWidth: "var(--container-max)" }}>
      {/* Page Header */}
      <div>
        <SectionHeader
          title="📰 News & Trailers"
          subtitle="Stay updated with the latest headlines, movie trailers, and industry insights"
        />
      </div>

      {/* Trending Trailers Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-[var(--brand-primary-light)]" />
          <span>Trending Trailers</span>
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {TRENDING_TRAILERS.map((trailer) => (
            <div 
              key={trailer.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl overflow-hidden group hover:border-[var(--border-secondary)] transition-all shadow-md flex flex-col justify-between"
            >
              <div className="relative aspect-video bg-black cursor-pointer overflow-hidden" onClick={() => setActiveTrailerId(trailer.youtubeId)}>
                <Image 
                  src={trailer.thumbnail} 
                  alt={trailer.title} 
                  fill 
                  className="object-cover group-hover:scale-102 transition-transform duration-300 opacity-85 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white/90">
                  {trailer.duration}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <span className="text-[10px] font-bold text-[var(--brand-primary-light)] uppercase tracking-wider">
                  {trailer.movieTitle}
                </span>
                <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-[var(--brand-primary-light)] transition-colors">
                  {trailer.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-primary)]/40">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {trailer.views}</span>
                  <button className="hover:text-white transition-colors" onClick={() => setActiveTrailerId(trailer.youtubeId)}>Watch Now</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Navigation */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border-primary)]/50">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-[var(--shadow-glow-brand)]"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News Articles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            className="group flex flex-col justify-between p-6 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl shadow-sm hover:border-[var(--border-secondary)] transition-all duration-300"
          >
            <div className="space-y-4">
              {/* Image Card Placeholder */}
              <div className="h-40 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center text-5xl">
                {art.image}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-lg bg-[var(--brand-primary-light)]/10 text-[var(--brand-primary-light)] border border-[var(--brand-primary-light)]/20 text-[10px] uppercase font-bold tracking-wider">
                    {art.tag}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">{art.source}</span>
                </div>
                <h3 className="font-bold text-white text-base group-hover:text-[var(--brand-primary-light)] transition-colors leading-snug">
                  {art.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                  {art.summary}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-6 border-t border-[var(--border-primary)]/50 text-[10px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {art.date}
              </span>
              <button 
                onClick={() => setActiveArticle(art)}
                className="flex items-center gap-1 text-[var(--brand-primary-light)] hover:text-white transition-colors font-bold cursor-pointer"
              >
                <span>Read Full</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Article Detail Drawer/Modal */}
      {activeArticle && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveArticle(null)}
        >
          <div 
            className="bg-[var(--bg-surface)] border border-[var(--border-primary)] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded bg-[var(--brand-primary-light)]/10 text-[var(--brand-primary-light)] text-[10px] font-bold uppercase">
                  {activeArticle.tag}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{activeArticle.source}</span>
              </div>
              <button 
                onClick={() => setActiveArticle(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-secondary)] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                {activeArticle.title}
              </h2>

              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] pb-4 border-b border-[var(--border-primary)]/40">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {activeArticle.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {activeArticle.readTime}</span>
              </div>

              {/* YouTube video option inside article */}
              {activeArticle.youtubeId && (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/5 relative">
                  <iframe 
                    src={`https://www.youtube.com/embed/${activeArticle.youtubeId}`}
                    title={activeArticle.title}
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
              )}

              {/* Full Text */}
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {activeArticle.content}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[var(--bg-tertiary)] border-t border-[var(--border-primary)] flex items-center justify-between">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }}
                className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Article</span>
              </button>
              <button 
                onClick={() => setActiveArticle(null)}
                className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--border-primary)] border border-[var(--border-primary)] rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trailer Video Player Overlay */}
      {activeTrailerId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setActiveTrailerId(null)}>
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setActiveTrailerId(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe 
              src={`https://www.youtube.com/embed/${activeTrailerId}?autoplay=1`}
              title="YouTube video player"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}

import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FollowButton from "@/components/social/FollowButton";
import ProfileTabs from "@/components/social/ProfileTabs";
import { Calendar, MapPin, Award, Users, BookOpen } from "lucide-react";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return ["admin-default-id", "1"].map((id) => ({ id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      select: { name: true, username: true },
    });
  } catch {
    try {
      const { findUserById } = require("@/lib/dbFallback");
      user = findUserById(resolvedParams.id);
    } catch {
      user = null;
    }
  }

  return {
    title: user ? `${user.name || `@${user.username}`} Profile | MovieVerse` : "User Profile | MovieVerse",
    description: "View movie reviews, watchlist, lists, and social activity on MovieVerse.",
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const session = await auth();
  const currentUserId = session?.user?.id;

  let user;
  let isFollowing = false;
  let reviews: any[] = [];
  let watchlist: any[] = [];
  let lists: any[] = [];

  try {
    user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            reviews: true,
            watchlist: true,
            lists: true,
          },
        },
      },
    });

    if (user) {
      isFollowing = currentUserId
        ? (await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: id,
              },
            },
          })) !== null
        : false;

      reviews = await prisma.review.findMany({
        where: { userId: id },
        include: {
          movie: {
            select: { id: true, title: true, tmdbId: true, posterPath: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      watchlist = await prisma.watchlistItem.findMany({
        where: { userId: id },
        include: {
          movie: true,
        },
        orderBy: { addedAt: "desc" },
      });

      lists = await prisma.userList.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (dbError) {
    console.warn("Postgres offline during profile fetch, using local fallback:", dbError);
    try {
      const { findUserById } = require("@/lib/dbFallback");
      const fallbackUser = findUserById(id);
      if (fallbackUser) {
        user = {
          ...fallbackUser,
          _count: {
            followers: 0,
            following: 0,
            reviews: 0,
            watchlist: 0,
            lists: 0,
          },
        } as any;
      }
    } catch {
      user = null;
    }
  }

  if (!user) {
    notFound();
  }

  const formattedWatchlist = watchlist.map((item) => ({
    id: item.movie.tmdbId,
    title: item.movie.title,
    poster_path: item.movie.posterPath,
    backdrop_path: null,
    vote_average: item.movie.voteAverage || 0,
    release_date: "",
    genre_ids: [],
    overview: "",
    media_type: item.movie.mediaType === "TV_SHOW" ? "tv" : "movie",
  }));

  const isOwnProfile = currentUserId === id;

  return (
    <div className="min-h-screen pb-16 space-y-10">
      {/* Header Banner Section */}
      <section className="relative h-[20vh] md:h-[25vh] bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--brand-primary)]/10 to-[var(--bg-primary)] border-b border-[var(--border-primary)] flex items-end">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
      </section>

      {/* Profile Overview Container */}
      <div className="px-6 mx-auto -mt-20 md:-mt-24 relative z-10 space-y-8" style={{ maxWidth: "var(--container-max)" }}>
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-end text-center sm:text-left">
            {/* Avatar */}
            {user.image ? (
              <div className="w-28 h-28 md:w-32 md:h-32 relative rounded-2xl overflow-hidden border-4 border-[var(--bg-primary)] shadow-2xl bg-[#121824] shrink-0">
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] border-4 border-[var(--bg-primary)] shadow-2xl flex items-center justify-center text-white text-3xl font-extrabold shrink-0">
                {(user.name || user.username || "U")[0].toUpperCase()}
              </div>
            )}

            {/* Profile Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                  {user.name || "Anonymous User"}
                </h1>
                {user.isPremium && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                    <Award className="w-3 h-3" /> VIP Club
                  </span>
                )}
              </div>

              <p className="text-sm text-[var(--text-secondary)] font-medium">@{user.username || "user"}</p>

              {user.bio && (
                <p className="text-sm text-[var(--text-secondary)] max-w-lg leading-relaxed pt-1">{user.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[var(--text-muted)] justify-center sm:justify-start">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </span>
                {user.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {user.country}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Social Stats & Follow Button */}
          <div className="flex flex-wrap items-center gap-4 self-center md:self-end">
            <div className="flex gap-4 text-center text-xs px-2">
              <div>
                <p className="font-extrabold text-white text-base">{user._count.followers}</p>
                <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">Followers</p>
              </div>
              <div className="w-px h-8 bg-[var(--border-primary)] self-center" />
              <div>
                <p className="font-extrabold text-white text-base">{user._count.following}</p>
                <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">Following</p>
              </div>
            </div>

            {!isOwnProfile ? (
              <FollowButton targetUserId={user.id} initialIsFollowing={isFollowing} />
            ) : (
              <Link
                href="/settings"
                className="px-4 py-2 text-xs font-bold rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Profiles Section Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 border-t border-[var(--border-primary)]">
          {/* Left Column: Quick Stats info card */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <BookOpen className="w-4.5 h-4.5 text-[var(--brand-primary-light)]" />
                <span>Quick Stats</span>
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-[var(--text-secondary)]">
                <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)]/50 rounded-xl space-y-1">
                  <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider block">Reviews</span>
                  <strong className="text-white text-base font-extrabold">{reviews.length}</strong>
                </div>
                <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)]/50 rounded-xl space-y-1">
                  <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider block">Watchlist</span>
                  <strong className="text-white text-base font-extrabold">{formattedWatchlist.length}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Columns: Tabbed Contents (Reviews and Watchlist) via Client Tabs component */}
          <div className="lg:col-span-2 space-y-8">
            <ProfileTabs
              reviews={reviews}
              watchlist={formattedWatchlist}
              lists={lists}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

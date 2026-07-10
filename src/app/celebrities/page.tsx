import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPopularPeople, getImageUrl } from "@/lib/tmdb";
import SectionHeader from "@/components/shared/SectionHeader";
import { ChevronLeft, ChevronRight, User } from "lucide-react";

interface CelebritiesPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Celebrities | MovieVerse",
  description: "Discover the most popular actors, directors, and creators in the entertainment industry.",
};

export default async function CelebritiesPage({ searchParams }: CelebritiesPageProps) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1");

  let response;
  try {
    response = await getPopularPeople(page);
  } catch (error) {
    console.error("Error fetching popular people:", error);
  }

  const people = response?.results || [];
  const totalPages = response?.total_pages || 1;

  const buildPageUrl = (pageNumber: number) => {
    return `/celebrities?page=${pageNumber}`;
  };

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title="🎭 Popular Celebrities"
          subtitle="Meet the talented actors and creators trending today"
        />
      </div>

      {people.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {people.map((person) => {
            const profileUrl = getImageUrl(person.profile_path, "profile", "md");
            const knownForTitles = person.known_for
              ?.slice(0, 2)
              .map((item) => item.title || item.name || "")
              .filter(Boolean)
              .join(", ");

            return (
              <Link
                key={person.id}
                href={`/celebrities/${person.id}`}
                className="group flex flex-col bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-sm hover:border-[var(--border-secondary)] hover:shadow-md transition-all duration-300"
              >
                {/* Photo container */}
                <div className="aspect-[3/4] relative w-full bg-[#121824] overflow-hidden">
                  {profileUrl ? (
                    <Image
                      src={profileUrl}
                      alt={person.name || "Celebrity"}
                      fill
                      sizes="(max-width: 640px) 180px, (max-width: 1024px) 240px, 300px"
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-muted)] bg-[var(--bg-tertiary)]">
                      <User className="w-12 h-12 stroke-[1.5]" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">No Photo</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-[var(--brand-primary-light)] transition-colors line-clamp-1">
                      {person.name}
                    </h3>
                    <p className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mt-1">
                      {person.known_for_department || "Entertainment"}
                    </p>
                  </div>
                  {knownForTitles && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-2 italic">
                      {knownForTitles}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="text-5xl">🤷‍♂️</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Celebrities Found</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md">
            There was an issue loading the celebrity listings. Please try again later.
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          {page > 1 ? (
            <Link
              href={buildPageUrl(page - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-primary)]/50 text-[var(--text-muted)] cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
          )}

          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Page {page} of {Math.min(totalPages, 500)}
          </span>

          {page < totalPages && page < 500 ? (
            <Link
              href={buildPageUrl(page + 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-primary)]/50 text-[var(--text-muted)] cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

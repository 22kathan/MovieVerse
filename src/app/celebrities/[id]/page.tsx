import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPersonDetails, getPersonCredits, getImageUrl, formatReleaseDate } from "@/lib/tmdb";
import { ArrowLeft, User, Calendar, MapPin, Award, Film } from "lucide-react";
import MovieCard from "@/components/movie/MovieCard";

interface CelebrityPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return ["101", "102", "104", "105", "106", "201", "202"].map((id) => ({ id }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: CelebrityPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const personId = parseInt(resolvedParams.id);
  try {
    const person = await getPersonDetails(personId);
    return {
      title: `${person.name || "Celebrity Details"} | MovieVerse`,
      description: person.biography ? person.biography.slice(0, 160) : "View celebrity biography and filmography.",
    };
  } catch {
    return {
      title: "Celebrity Details | MovieVerse",
    };
  }
}

export default async function CelebrityDetailPage({ params }: CelebrityPageProps) {
  const resolvedParams = await params;
  const personId = parseInt(resolvedParams.id);

  let person;
  let credits;

  try {
    [person, credits] = await Promise.all([
      getPersonDetails(personId),
      getPersonCredits(personId),
    ]);
  } catch (error) {
    console.error("Error fetching celebrity data:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="text-5xl">😭</div>
        <h3 className="text-xl font-bold">Failed to load celebrity profile</h3>
        <p className="text-[var(--text-secondary)] max-w-md">
          There was an error loading the profile details. Please try again later.
        </p>
        <Link href="/celebrities" className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] transition-colors">
          Back to Celebrities
        </Link>
      </div>
    );
  }

  const profileUrl = getImageUrl(person.profile_path, "profile", "lg");
  
  // Sort credits by popularity/vote average to show the most popular works first
  const knownFor = credits?.cast
    ? [...credits.cast]
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 12)
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": person.name,
    "image": profileUrl,
    "birthDate": person.birthday,
    "deathDate": person.deathday,
    "birthPlace": person.place_of_birth,
    "description": person.biography,
    "jobTitle": person.known_for_department,
  };

  return (
    <div className="min-h-screen pb-16 px-6 py-8 space-y-12 mx-auto" style={{ maxWidth: "var(--container-max)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Back navigation */}
      <div className="flex items-center">
        <Link
          href="/celebrities"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white text-xs font-semibold border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Celebrities
        </Link>
      </div>

      {/* Profile Header section */}
      <section className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile Image */}
        <div className="w-48 sm:w-60 shrink-0 aspect-[3/4] relative rounded-2xl overflow-hidden border border-[var(--border-primary)] shadow-md bg-[#121824]">
          {profileUrl ? (
            <Image
              src={profileUrl}
              alt={person.name || "Celebrity"}
              fill
              priority
              sizes="(max-width: 768px) 240px, 300px"
              className="object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-muted)] bg-[var(--bg-surface)]">
              <User className="w-16 h-16 stroke-[1.5]" />
              <span className="text-xs uppercase font-bold tracking-wider">No Photo</span>
            </div>
          )}
        </div>

        {/* Info Detail */}
        <div className="flex-1 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary-light)]">
              {person.known_for_department || "Celebrity"}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight"
              style={{ fontFamily: "var(--font-display)" }}>
              {person.name}
            </h1>
          </div>

          {/* Quick Meta Stats */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[var(--text-secondary)]">
            {person.birthday && (
              <span className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] px-3 py-1.5 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-[var(--brand-primary-light)]" />
                Born: {formatReleaseDate(person.birthday, "short")}
                {person.deathday && ` - Died: ${formatReleaseDate(person.deathday, "short")}`}
              </span>
            )}
            {person.place_of_birth && (
              <span className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] px-3 py-1.5 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-[var(--brand-primary-light)]" />
                {person.place_of_birth}
              </span>
            )}
            {person.popularity && (
              <span className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] px-3 py-1.5 rounded-lg">
                <Award className="w-3.5 h-3.5 text-[var(--brand-primary-light)]" />
                Popularity: {person.popularity.toFixed(1)}
              </span>
            )}
          </div>

          {/* Biography */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Biography</h3>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-4xl whitespace-pre-line">
              {person.biography || `${person.name} is a known professional in the entertainment industry, specializing in ${person.known_for_department || "acting"}.`}
            </p>
          </div>
        </div>
      </section>

      {/* Filmography Section */}
      {knownFor.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-[var(--border-primary)]">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-[var(--brand-primary-light)]" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Famous Works</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
            {knownFor.map((item, index) => (
              <MovieCard
                key={`${item.id}-${index}`}
                movie={{
                  id: item.id,
                  title: item.title || item.name || "Untitled",
                  poster_path: item.poster_path,
                  vote_average: item.vote_average,
                  release_date: item.release_date || item.first_air_date,
                  media_type: item.media_type || "movie",
                }}
                index={index}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

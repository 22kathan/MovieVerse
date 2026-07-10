import { Metadata } from "next";
import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search | MovieVerse",
  description: "Browse movies, TV shows, and actors on MovieVerse.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--brand-primary)]"></div>
      </div>
    }>
      <SearchClient />
    </Suspense>
  );
}

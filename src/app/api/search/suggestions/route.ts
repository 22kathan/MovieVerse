import { NextResponse } from "next/server";
import { searchMulti } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const response = await searchMulti(query.trim(), 1);
    
    interface TMDBMultiSearchItem {
      id: number;
      title?: string;
      name?: string;
      media_type: string;
      release_date?: string;
      first_air_date?: string;
      poster_path?: string;
      profile_path?: string;
      vote_average?: number;
    }

    // Process and clean results
    const suggestions = ((response.results || []) as TMDBMultiSearchItem[])
      .slice(0, 6)
      .map((item) => {
        const title = item.title || item.name || "Untitled";
        const date = item.release_date || item.first_air_date || "";
        const releaseYear = date ? new Date(date).getFullYear() : null;
        
        return {
          id: item.id,
          title,
          media_type: item.media_type,
          release_year: releaseYear,
          image_path: item.poster_path || item.profile_path || null,
          rating: item.vote_average || null,
        };
      });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggestions API error:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}

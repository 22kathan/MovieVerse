export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { searchWithElastic } from "@/lib/elasticsearch";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.trim().length < 1) {
      return NextResponse.json({ suggestions: [] });
    }

    const response = await searchWithElastic(query.trim(), "all", 1);
    
    // Process and clean results from elasticsearch rankings
    const suggestions = response.results
      .slice(0, 6)
      .map((item) => {
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

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggestions API error:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}

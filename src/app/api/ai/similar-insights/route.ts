export const dynamic = "force-static";
import { NextResponse } from "next/server";
import { getAISimilarityInsights } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const { movieTitle, genres, similarMovies } = await request.json();

    if (!movieTitle || !Array.isArray(similarMovies)) {
      return NextResponse.json(
        { error: "movieTitle and similarMovies are required fields." },
        { status: 400 }
      );
    }

    const insights = await getAISimilarityInsights(
      movieTitle,
      genres || [],
      similarMovies
    );

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error("AI Similar Insights Route Error:", error);
    return NextResponse.json(
      { error: "Failed to generate similarity insights" },
      { status: 500 }
    );
  }
}

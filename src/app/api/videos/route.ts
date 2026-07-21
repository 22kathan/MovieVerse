import { NextResponse } from "next/server";
import { getMovieVideos, getTVShowVideos, getOfficialTrailer } from "@/lib/tmdb";
import type { TMDBVideo } from "@/types";

/**
 * Scrape YouTube search results to find the first video ID for a query.
 * This is a fallback when TMDB has no trailer for a movie.
 */
async function searchYouTubeForTrailer(movieTitle: string): Promise<string | null> {
  try {
    const searchQuery = `${movieTitle} official trailer`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract video IDs from YouTube search results page
    // YouTube embeds video IDs in the format "videoId":"XXXXXXXXXXX" in its JSON data
    const videoIdMatches = html.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/g);
    if (videoIdMatches && videoIdMatches.length > 0) {
      // Extract the actual ID from the first match
      const firstMatch = videoIdMatches[0].match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
      if (firstMatch && firstMatch[1]) {
        return firstMatch[1];
      }
    }

    // Fallback: try /watch?v= pattern
    const watchMatches = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/g);
    if (watchMatches && watchMatches.length > 0) {
      const match = watchMatches[0].match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error("YouTube search fallback failed:", error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") || "movie";
  const title = searchParams.get("title") || "";

  if (!id) {
    return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
  }

  const movieId = parseInt(id, 10);
  if (isNaN(movieId)) {
    return NextResponse.json({ error: "Invalid ID parameter" }, { status: 400 });
  }

  try {
    let videos: TMDBVideo[] = [];

    if (type === "tv") {
      const data = await getTVShowVideos(movieId);
      videos = data?.results || [];
    } else {
      const data = await getMovieVideos(movieId);
      videos = data?.results || [];
    }

    const trailer = getOfficialTrailer(videos);

    if (trailer?.key) {
      return NextResponse.json({
        key: trailer.key,
        name: trailer.name || "Official Trailer",
        site: trailer.site || "YouTube",
        source: "tmdb",
      });
    }

    // TMDB has no trailer — search YouTube directly for the correct trailer
    if (title) {
      const youtubeKey = await searchYouTubeForTrailer(title);
      if (youtubeKey) {
        return NextResponse.json({
          key: youtubeKey,
          name: `${title} — Official Trailer`,
          site: "YouTube",
          source: "youtube-search",
        });
      }
    }

    // Nothing found anywhere
    return NextResponse.json({
      key: null,
      name: "Official Trailer",
      site: "YouTube",
      source: "none",
    });
  } catch (error) {
    console.error("Failed to fetch trailer video:", error);
    return NextResponse.json({ key: null, source: "error" }, { status: 500 });
  }
}

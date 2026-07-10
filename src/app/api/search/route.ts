import { NextResponse } from 'next/server';

/**
 * Handles multi-search queries against The Movie Database (TMDB) API.
 * This route handler acts as a server-side proxy to search for movies,
 * TV shows, and people based on a user's query.
 *
 * @param {Request} request - The incoming request object, expected to have a `query` search parameter.
 * @returns {Promise<NextResponse>} A promise that resolves to the search results or an error response.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const tmdbApiKey = process.env.TMDB_API_KEY;

  // Validate that the TMDB API key is configured
  if (!tmdbApiKey) {
    console.error('TMDB_API_KEY is not set in environment variables.');
    return NextResponse.json(
      { error: 'API key for TMDB is not configured.' },
      { status: 500 },
    );
  }

  // Validate that a search query was provided
  if (!query) {
    return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
  }

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&language=en-US&query=${encodeURIComponent(
    query,
  )}&page=1&include_adult=false`;

  try {
    const tmdbResponse = await fetch(url);
    if (!tmdbResponse.ok) {
      const errorData = await tmdbResponse.json();
      return NextResponse.json({ error: errorData.status_message || 'Failed to fetch search results from TMDB' }, { status: tmdbResponse.status });
    }
    const data = await tmdbResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { searchWithElastic } from '@/lib/elasticsearch';

/**
 * Handles multi-search queries using the Elasticsearch-like helper.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || searchParams.get('q');
  const mediaType = (searchParams.get('type') || 'all') as 'movie' | 'tv' | 'all';
  const page = parseInt(searchParams.get('page') || '1');

  if (!query) {
    return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
  }

  try {
    const elasticResults = await searchWithElastic(query, mediaType, page);
    return NextResponse.json({
      results: elasticResults.results.map(item => ({
        id: item.id,
        title: item.title,
        media_type: item.media_type,
        poster_path: item.poster_path || null,
        vote_average: item.rating || 0,
        release_date: item.release_date || '',
        overview: item.overview || '',
        score: item.score,
        highlightedTitle: item.highlightedTitle,
        highlightedOverview: item.highlightedOverview
      })),
      took: elasticResults.took,
      total: elasticResults.total
    });
  } catch (error: any) {
    console.error("Elasticsearch API error:", error);
    return NextResponse.json({ error: 'An error occurred while fetching Elasticsearch results.' }, { status: 500 });
  }
}
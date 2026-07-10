// ============================================
// MovieVerse — AI Review Summary API
// POST /api/ai/review-summary
// ============================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { summarizeReviews } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { movieId, tmdbId } = await request.json();

    if (!movieId && !tmdbId) {
      return NextResponse.json(
        { error: 'movieId or tmdbId is required' },
        { status: 400 }
      );
    }

    // Find the Movie record first to get its DB ID and title
    let movie = null;
    if (movieId) {
      movie = await prisma.movie.findUnique({
        where: { id: movieId },
      });
    } else if (tmdbId) {
      movie = await prisma.movie.findUnique({
        where: { tmdbId: parseInt(tmdbId) },
      });
    }

    if (!movie) {
      return NextResponse.json(
        { error: 'Movie not found in MovieVerse database' },
        { status: 404 }
      );
    }

    // Check if we already have a recent summary (cached in DB)
    const existingSummary = await prisma.aIReviewSummary.findUnique({
      where: { movieId: movie.id },
    });

    // If summary exists and is less than 1 hour old, return cached one
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (existingSummary && existingSummary.updatedAt > oneHourAgo) {
      return NextResponse.json({
        summary: existingSummary.summary,
        sentiment: existingSummary.sentiment,
        keyThemes: existingSummary.keyThemes,
        basedOn: existingSummary.basedOn,
        source: 'cache',
      });
    }

    // Fetch reviews for this movie
    const reviews = await prisma.review.findMany({
      where: { movieId: movie.id },
      select: { content: true, rating: true },
    });

    if (reviews.length === 0) {
      return NextResponse.json({
        summary: 'No audience reviews have been written for this title yet.',
        sentiment: 'mixed',
        keyThemes: ['No Reviews'],
        basedOn: 0,
        source: 'none',
      });
    }

    // Generate AI Summary
    const result = await summarizeReviews(movie.title, reviews);

    // Upsert database record
    const summary = await prisma.aIReviewSummary.upsert({
      where: { movieId: movie.id },
      update: {
        summary: result.summary,
        sentiment: result.sentiment,
        keyThemes: result.keyThemes,
        basedOn: result.basedOn,
        model: process.env.GOOGLE_AI_API_KEY ? 'Gemini 2.5 Flash' : 'Mock Summarizer',
      },
      create: {
        movieId: movie.id,
        summary: result.summary,
        sentiment: result.sentiment,
        keyThemes: result.keyThemes,
        basedOn: result.basedOn,
        model: process.env.GOOGLE_AI_API_KEY ? 'Gemini 2.5 Flash' : 'Mock Summarizer',
      },
    });

    return NextResponse.json({
      summary: summary.summary,
      sentiment: summary.sentiment,
      keyThemes: summary.keyThemes,
      basedOn: summary.basedOn,
      source: 'generated',
    });
  } catch (error) {
    console.error('AI Review Summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate review summary' },
      { status: 500 }
    );
  }
}

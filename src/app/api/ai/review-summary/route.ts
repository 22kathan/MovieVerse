// ============================================
// MovieVerse — AI Review Summary API
// POST /api/ai/review-summary
// ============================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { summarizeReviews } from '@/lib/ai';
import { getMovieDetails } from '@/lib/tmdb';

export async function POST(request: Request) {
  let tmdbIdNum = 0;
  let movieIdStr = '';
  try {
    const { movieId, tmdbId } = await request.json();
    tmdbIdNum = tmdbId ? parseInt(tmdbId) : 0;
    movieIdStr = movieId ? String(movieId) : '';

    if (!movieIdStr && !tmdbIdNum) {
      return NextResponse.json(
        { error: 'movieId or tmdbId is required' },
        { status: 400 }
      );
    }
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 });
  }

  const lookupId = tmdbIdNum || parseInt(movieIdStr) || 0;

  try {
    // 1. Try to query database
    let movie = null;
    if (movieIdStr) {
      movie = await prisma.movie.findUnique({
        where: { id: movieIdStr },
      });
    } else if (tmdbIdNum) {
      movie = await prisma.movie.findUnique({
        where: { tmdbId: tmdbIdNum },
      });
    }

    if (movie) {
      // Check cached summary
      const existingSummary = await prisma.aIReviewSummary.findUnique({
        where: { movieId: movie.id },
      });

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

      // Fetch reviews
      const reviews = await prisma.review.findMany({
        where: { movieId: movie.id },
        select: { content: true, rating: true },
      });

      if (reviews.length > 0) {
        const result = await summarizeReviews(movie.title, reviews);
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
      }
    }
  } catch (dbError) {
    console.warn("Database is unavailable. Falling back to mock summary generator.", dbError);
  }

  // 2. Fallback to mock data lookup using tmdb mock database
  try {
    const movieDetails = await getMovieDetails(lookupId);
    if (movieDetails) {
      const defaultThemes = ["Cinematography", "Performances", "Storytelling"];
      let summaryText = `Audiences and critics generally express positive sentiments for ${movieDetails.title || 'this title'}, highlighting the narrative depth, character motives, and strong cinematography.`;
      
      const mockConsensusMap: Record<number, { summary: string; sentiment: 'positive' | 'mixed'; keyThemes: string[]; basedOn: number }> = {
        1: {
          summary: "Critics and audiences overwhelmingly praise Inception for its highly original concept, stunning visual effects, and Christopher Nolan's masterful direction, describing it as a cerebral thriller that demands repeat viewings.",
          sentiment: "positive",
          keyThemes: ["Mind-Bending", "Visual Spectacle", "Masterful Score"],
          basedOn: 852
        },
        2: {
          summary: "The Dark Knight is widely regarded as one of the greatest superhero films ever made. Heath Ledger's legendary performance as the Joker receives universal acclaim alongside praise for the film's dark, realistic tone and gripping screenplay.",
          sentiment: "positive",
          keyThemes: ["Heath Ledger", "Joker", "Masterpiece"],
          basedOn: 1240
        },
        3: {
          summary: "Interstellar is celebrated for its emotional depth, breathtaking space visuals, and Hans Zimmer's organ-heavy score. Audiences appreciate the scientific realism balanced with a heart-wrenching father-daughter story.",
          sentiment: "positive",
          keyThemes: ["Wormholes", "Emotional Journey", "Hans Zimmer"],
          basedOn: 780
        },
        102: {
          summary: "Audiences are highly anticipating Achyuta Avataaram, praising the grand mythological visuals and the power-packed casting of NTR Jr. and Ram Charan.",
          sentiment: "positive",
          keyThemes: ["Mythology", "Action Epic", "NTR Jr. & Ram Charan"],
          basedOn: 245
        },
        103: {
          summary: "Trivikram Srinivas' family drama Father's Day is highly anticipated, with viewers eager to see the comedic timing and emotional chemistry of Venkatesh and Nani.",
          sentiment: "positive",
          keyThemes: ["Family Comedy", "Star Cast", "Trivikram Style"],
          basedOn: 180
        },
        104: {
          summary: "Audiences are looking forward to this action-packed thriller MRP, addressing consumer cartels and pricing scams, starring Ravi Teja in a vigilante avatar.",
          sentiment: "positive",
          keyThemes: ["Social Message", "Mass Action", "Ravi Teja"],
          basedOn: 135
        },
        105: {
          summary: "The musical romance Oh..! Sukumari has generated positive buzz for its tracks sung by Sid Sriram and the lead chemistry with Rashmika Mandanna.",
          sentiment: "positive",
          keyThemes: ["Romantic Musical", "Sid Sriram Tracks", "Cross-Country Journey"],
          basedOn: 95
        },
        106: {
          summary: "Oka Court Case is a courtroom drama generating strong curiosity for its plot about land scams, starring Suriya and directed by Vetrimaaran.",
          sentiment: "positive",
          keyThemes: ["Legal Drama", "Vetrimaaran Directing", "Suriya"],
          basedOn: 210
        },
        107: {
          summary: "Fans are excited for Lijo Jose Pellissery's fantasy comedy Antappante Athbudha Pravarthikal, anticipating Fahadh Faasil's performance and magical realist themes.",
          sentiment: "positive",
          keyThemes: ["Fantasy Comedy", "Wish Granting", "Fahadh Faasil"],
          basedOn: 155
        },
        108: {
          summary: "Mister Middle Class is a family drama showcasing the daily struggles of a software engineer, with viewers relating heavily to its middle-class themes.",
          sentiment: "positive",
          keyThemes: ["Relatable Drama", "Corporate Politics", "Family Values"],
          basedOn: 120
        },
        109: {
          summary: "Vadala is a highly anticipated psychological thriller by Jeethu Joseph, with audiences eager to see Mohanlal solve a mountain mystery.",
          sentiment: "positive",
          keyThemes: ["Mystery Thriller", "Jeethu Joseph", "Mohanlal"],
          basedOn: 340
        },
        110: {
          summary: "Atlee's political action drama Jana Nayagan starring Vijay is one of the most anticipated movies, with fans hyped for the mass elements.",
          sentiment: "positive",
          keyThemes: ["Political Action", "Atlee Mass", "Thalapathy Vijay"],
          basedOn: 520
        }
      };

      const matched = mockConsensusMap[lookupId];
      return NextResponse.json({
        summary: matched ? matched.summary : summaryText,
        sentiment: matched ? matched.sentiment : 'positive',
        keyThemes: matched ? matched.keyThemes : defaultThemes,
        basedOn: matched ? matched.basedOn : 45,
        source: 'mock',
      });
    }
  } catch (mockError) {
    console.error("Mock details load failed:", mockError);
  }

  return NextResponse.json({
    summary: 'No audience reviews are currently available for this title.',
    sentiment: 'mixed',
    keyThemes: ['No Reviews'],
    basedOn: 0,
    source: 'none',
  });
}

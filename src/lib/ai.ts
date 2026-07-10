// ============================================
// MovieVerse — AI Service Helper
// Integrates with Gemini or OpenAI for AI-driven summaries and searches
// ============================================

export interface AIReviewSummaryResult {
  summary: string;
  sentiment: 'positive' | 'mixed' | 'negative';
  keyThemes: string[];
  basedOn: number;
}

export interface AISearchResult {
  searchQuery?: string;
  mediaType: 'movie' | 'tv' | 'all';
  year?: number;
  genreId?: number;
  genreName?: string;
  minRating?: number;
  sortBy?: string;
  industry?: 'bollywood' | 'hollywood' | 'both';
}

const GENRE_MAP: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'sci-fi': 878,
  scifi: 878,
  science_fiction: 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

/**
 * Clean and parse JSON returned from LLMs
 */
function cleanAndParseJSON<T>(text: string): T | null {
  try {
    // Strip markdown formatting if any
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error("Failed to parse JSON from AI response:", e, text);
    return null;
  }
}

/**
 * Summarize movie reviews using Gemini / OpenAI or Mock fallback
 */
export async function summarizeReviews(
  movieTitle: string,
  reviews: Array<{ content: string; rating: number }>
): Promise<AIReviewSummaryResult> {
  const count = reviews.length;
  if (count === 0) {
    return {
      summary: `No audience reviews are currently available for ${movieTitle}.`,
      sentiment: 'mixed',
      keyThemes: ['no reviews'],
      basedOn: 0,
    };
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const reviewsText = reviews
    .map((r, i) => `Review #${i + 1} (Rating: ${r.rating}/10): "${r.content}"`)
    .join('\n\n');

  const prompt = `You are a professional film critic and data analyst. Analyze these ${count} audience reviews for the movie "${movieTitle}".
Provide a concise, 2-3 sentence consensus summary of what audiences thought. Identify the overall sentiment ('positive', 'mixed', or 'negative').
Extract exactly 3-4 key themes or highlights mentioned frequently (e.g. "spectacular visuals", "slow pacing", "stellar performance").

Your output MUST be a valid JSON object matching this schema:
{
  "summary": "2-3 sentences aggregating the reviews.",
  "sentiment": "positive" | "mixed" | "negative",
  "keyThemes": ["theme 1", "theme 2", "theme 3"]
}

Reviews:
${reviewsText}`;

  // 1. Try Gemini
  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
          const parsed = cleanAndParseJSON<Omit<AIReviewSummaryResult, 'basedOn'>>(responseText);
          if (parsed && parsed.summary) {
            return {
              ...parsed,
              basedOn: count,
            };
          }
        }
      }
    } catch (err) {
      console.error("Gemini summarizeReviews API error:", err);
    }
  }

  // 2. Try OpenAI
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You output JSON objects.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content;
        if (responseText) {
          const parsed = cleanAndParseJSON<Omit<AIReviewSummaryResult, 'basedOn'>>(responseText);
          if (parsed && parsed.summary) {
            return {
              ...parsed,
              basedOn: count,
            };
          }
        }
      }
    } catch (err) {
      console.error("OpenAI summarizeReviews API error:", err);
    }
  }

  // 3. Fallback Mock Generator
  console.log("Using rule-based mock reviews summarizer for", movieTitle);
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / count;
  
  let sentiment: 'positive' | 'mixed' | 'negative' = 'mixed';
  let summary = `Audiences have mixed feelings about ${movieTitle}, praising certain aspects while finding flaws in others.`;
  let keyThemes = ['Stunning visuals', 'Uneven pacing', 'Good cast chemistry'];

  if (avgRating >= 7.5) {
    sentiment = 'positive';
    summary = `Audiences highly recommend ${movieTitle}, praising its captivating storytelling and strong emotional core. It stands out as an exceptional watch.`;
    keyThemes = ['Captivating narrative', 'Masterful performances', 'Excellent directing'];
  } else if (avgRating < 5) {
    sentiment = 'negative';
    summary = `Audiences generally disliked ${movieTitle}, criticising the writing, character development, and general execution of the premise.`;
    keyThemes = ['Weak script', 'Poor pacing', 'Forgettable characters'];
  }

  return {
    summary,
    sentiment,
    keyThemes,
    basedOn: count,
  };
}

/**
 * Natural language query parsing for AI search assistant
 */
export async function parseSearchQuery(query: string): Promise<AISearchResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const prompt = `You are a smart search parsing engine for MovieVerse.
Your task is to take a natural language query from a user looking for movies or TV shows and extract search components.
Parse details such as genre name, release year, minimum rating, sorting preference, media type ('movie' or 'tv'), and any basic keywords.
Determine the target film industry based on keywords:
- "bollywood", "hindi", "indian", "desi", "tollywood", "kollywood" etc. -> "bollywood"
- "hollywood", "english", "american", "western" -> "hollywood"
- If the user asks for both or does not specify, default to "both".

Available genres: Action, Adventure, Animation, Comedy, Crime, Documentary, Drama, Family, Fantasy, History, Horror, Music, Mystery, Romance, Sci-Fi, Thriller, War, Western.

Your output MUST be a valid JSON object matching this schema:
{
  "searchQuery": "text keyword like actor name, director name, or specific topic, if any",
  "mediaType": "movie" | "tv" | "all",
  "year": 2020 (null if not specified),
  "genreName": "Action" (or any genre name from list, null if none),
  "minRating": 8.0 (null if none, scale 0-10),
  "sortBy": "popularity.desc" | "vote_average.desc" | "release_date.desc" (null if none),
  "industry": "bollywood" | "hollywood" | "both"
}

Query: "${query}"`;

  // 1. Try Gemini
  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
          const parsed = cleanAndParseJSON<AISearchResult>(responseText);
          if (parsed) {
            if (parsed.genreName) {
              parsed.genreId = GENRE_MAP[parsed.genreName.toLowerCase()];
            }
            return parsed;
          }
        }
      }
    } catch (err) {
      console.error("Gemini parseSearchQuery API error:", err);
    }
  }

  // 2. Try OpenAI
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You output JSON objects.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content;
        if (responseText) {
          const parsed = cleanAndParseJSON<AISearchResult>(responseText);
          if (parsed) {
            if (parsed.genreName) {
              parsed.genreId = GENRE_MAP[parsed.genreName.toLowerCase()];
            }
            return parsed;
          }
        }
      }
    } catch (err) {
      console.error("OpenAI parseSearchQuery API error:", err);
    }
  }

  // 3. Rule-based Parse Fallback
  console.log("Using rule-based mock parser for query:", query);
  const q = query.toLowerCase();
  
  let mediaType: 'movie' | 'tv' | 'all' = 'all';
  if (q.includes('show') || q.includes('tv') || q.includes('series')) {
    mediaType = 'tv';
  } else if (q.includes('movie') || q.includes('film')) {
    mediaType = 'movie';
  }

  // Year parsing (look for 4 digit numbers starting with 19 or 20)
  const yearMatch = q.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

  // Rating parsing (e.g. "rating above 8", "rating > 7", "above 8.5")
  let minRating: number | undefined;
  const ratingMatch = q.match(/(?:rating|score|above|>|over)\s*(\d+(?:\.\d+)?)/);
  if (ratingMatch) {
    minRating = parseFloat(ratingMatch[1]);
  }

  // Genre detection
  let detectedGenre: string | undefined;
  let genreId: number | undefined;
  for (const genre of Object.keys(GENRE_MAP)) {
    if (q.includes(genre)) {
      detectedGenre = genre.charAt(0).toUpperCase() + genre.slice(1);
      genreId = GENRE_MAP[genre];
      break;
    }
  }

  // Sorting
  let sortBy = 'popularity.desc';
  if (q.includes('latest') || q.includes('recent') || q.includes('newest')) {
    sortBy = 'release_date.desc';
  } else if (q.includes('best') || q.includes('top rated') || q.includes('highly rated')) {
    sortBy = 'vote_average.desc';
  }

  // Industry parsing
  let industry: 'bollywood' | 'hollywood' | 'both' = 'both';
  if (q.includes('bollywood') || q.includes('hindi') || q.includes('indian') || q.includes('desi') || q.includes('tollywood') || q.includes('kollywood')) {
    industry = 'bollywood';
  } else if (q.includes('hollywood') || q.includes('english') || q.includes('american')) {
    industry = 'hollywood';
  }

  // Extract keywords
  let searchQuery: string | undefined;
  const words = q.split(' ').filter(w => 
    !['movie', 'movies', 'show', 'shows', 'tv', 'series', 'film', 'films', 'with', 'above', 'rating', 'rated', 'from', 'in', 'released', 'starring', 'by', 'directed', 'direct', 'actor', 'about', 'bollywood', 'hollywood', 'indian', 'hindi', 'english'].includes(w) &&
    w !== String(year) &&
    w !== String(minRating) &&
    !Object.keys(GENRE_MAP).includes(w)
  );
  if (words.length > 0) {
    searchQuery = words.join(' ');
  }

  return {
    searchQuery,
    mediaType,
    year,
    genreName: detectedGenre,
    genreId,
    minRating,
    sortBy,
    industry,
  };
}

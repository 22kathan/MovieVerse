// ============================================
// MovieVerse — Elasticsearch Zero-Latency Engine
// Instant in-memory indexer + fuzzy full-text relevance search
// Supports typo tolerance via Levenshtein distance
// ============================================

import { searchMovies, searchMulti, searchTVShows } from "./tmdb";

export interface ElasticSearchResult {
  id: number;
  title: string;
  media_type: "movie" | "tv" | "person";
  score: number;
  highlightedTitle?: string;
  highlightedOverview?: string;
  release_date?: string;
  release_year?: number;
  poster_path?: string;
  profile_path?: string;
  rating?: number;
  overview?: string;
}

// ─── Levenshtein Edit Distance (typo tolerance engine) ──────────────
// Returns the minimum number of single-character edits (insertions,
// deletions, substitutions) needed to transform string a into string b.
function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Optimization: if lengths differ by more than max tolerance, skip
  if (Math.abs(la - lb) > 3) return Math.abs(la - lb);

  const row: number[] = Array.from({ length: lb + 1 }, (_, i) => i);

  for (let i = 1; i <= la; i++) {
    let prev = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(
        row[j] + 1,       // deletion
        prev + 1,          // insertion
        row[j - 1] + cost  // substitution
      );
      row[j - 1] = prev;
      prev = val;
    }
    row[lb] = prev;
  }
  return row[lb];
}

// Returns true if queryWord is "close enough" to targetWord
// Tolerance scales with word length:
//   len <= 3: exact match only
//   len 4-5:  allow 1 edit
//   len 6+:   allow 2 edits
function fuzzyMatch(queryWord: string, targetWord: string): boolean {
  if (targetWord.startsWith(queryWord) || targetWord.includes(queryWord)) {
    return true; // exact prefix/substring — always match
  }

  const qLen = queryWord.length;
  if (qLen <= 2) return false; // too short for fuzzy

  const maxDist = qLen <= 3 ? 0 : qLen <= 5 ? 1 : 2;

  // For prefix-style fuzzy: compare query against same-length prefix of target
  if (targetWord.length >= qLen) {
    const prefix = targetWord.slice(0, qLen);
    if (levenshtein(queryWord, prefix) <= maxDist) return true;
  }

  // Full word fuzzy
  if (levenshtein(queryWord, targetWord) <= maxDist) return true;

  return false;
}


// ─── Expanded Seeded Catalog ────────────────────────────────────────
// High-priority instant search catalog for 0ms keystroke responses.
// Includes Bollywood blockbusters, Hollywood classics, and popular persons.

const INITIAL_ELASTIC_CATALOG: ElasticSearchResult[] = [
  // ── Bollywood ──
  { id: 116, title: "Dhamaal 4", media_type: "movie", score: 9.0, release_date: "2025-06-15", release_year: 2025, poster_path: "/d5iVF7j37452d3j9W8pQW7d7y3K.jpg", rating: 8.5, overview: "The legendary comedy ensemble returns for a wild hilarious treasure chase across chaotic landscapes and unexpected plot twists." },
  { id: 117, title: "Dhamaal", media_type: "movie", score: 9.1, release_date: "2007-09-07", release_year: 2007, poster_path: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg", rating: 8.6, overview: "Four lazy friends learn about a hidden fortune of 10 crore rupees under a big W in Goa and set out on a hilarious race." },
  { id: 118, title: "Double Dhamaal", media_type: "movie", score: 8.5, release_date: "2011-06-24", release_year: 2011, poster_path: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg", rating: 6.8, overview: "The four friends are back with another scheme to get rich quick, this time by cheating a gangster." },
  { id: 119, title: "Total Dhamaal", media_type: "movie", score: 8.6, release_date: "2019-02-22", release_year: 2019, poster_path: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg", rating: 6.5, overview: "A group of people rush to find hidden treasure in a series of madcap misadventures across the country." },
  { id: 120, title: "Animal", media_type: "movie", score: 9.2, release_date: "2023-12-01", release_year: 2023, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 7.8, overview: "A son undergoes a remarkable transformation as he spirals down into violence, his sole purpose being to protect his father at all costs." },
  { id: 121, title: "Pathaan", media_type: "movie", score: 9.1, release_date: "2023-01-25", release_year: 2023, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 7.4, overview: "An Indian spy takes on the world's deadliest mercenary group and its leader who is plotting to destroy India." },
  { id: 122, title: "Pushpa: The Rise", media_type: "movie", score: 9.0, release_date: "2021-12-17", release_year: 2021, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 7.6, overview: "A laborer rises through the ranks of a red sandalwood smuggling syndicate, facing danger at every turn." },
  { id: 123, title: "Pushpa 2: The Rule", media_type: "movie", score: 9.3, release_date: "2024-12-05", release_year: 2024, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 7.9, overview: "Pushpa Raj returns, more powerful and ruthless, as he battles new enemies and protects his territory." },
  { id: 124, title: "Stree 2", media_type: "movie", score: 8.9, release_date: "2024-08-15", release_year: 2024, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 7.5, overview: "The ghost returns to haunt the town of Chanderi, and the group must once again face the supernatural threat." },
  { id: 125, title: "Kalki 2898 AD", media_type: "movie", score: 9.0, release_date: "2024-06-27", release_year: 2024, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 7.3, overview: "A futuristic dystopian thriller inspired by Hindu mythology, where a warrior must save the last fertile woman." },
  { id: 126, title: "Jawan", media_type: "movie", score: 9.1, release_date: "2023-09-07", release_year: 2023, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 7.6, overview: "A man driven by a personal vendetta goes up against a powerful politician, uncovering dark secrets along the way." },
  { id: 127, title: "3 Idiots", media_type: "movie", score: 9.5, release_date: "2009-12-25", release_year: 2009, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 8.4, overview: "Two friends embark on a quest to find their long-lost college companion, recounting their days at engineering school." },
  { id: 128, title: "Dangal", media_type: "movie", score: 9.4, release_date: "2016-12-23", release_year: 2016, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 8.4, overview: "Former wrestler Mahavir Singh Phogat trains his daughters to become world-class wrestlers against societal expectations." },
  { id: 129, title: "RRR", media_type: "movie", score: 9.2, release_date: "2022-03-25", release_year: 2022, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 7.8, overview: "A fictitious tale about two legendary Indian revolutionaries and their journey far away from home." },
  { id: 130, title: "KGF: Chapter 2", media_type: "movie", score: 9.1, release_date: "2022-04-14", release_year: 2022, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 7.5, overview: "Rocky's dominance over the Kolar Gold Fields is challenged by new adversaries." },
  { id: 131, title: "Baahubali 2: The Conclusion", media_type: "movie", score: 9.3, release_date: "2017-04-28", release_year: 2017, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 7.6, overview: "Baahubali returns to reclaim his kingdom and uncover the truth behind his father's betrayal." },
  { id: 132, title: "War", media_type: "movie", score: 8.7, release_date: "2019-10-02", release_year: 2019, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 7.0, overview: "An Indian soldier is assigned to eliminate his former mentor who has gone rogue." },
  { id: 133, title: "Tiger Zinda Hai", media_type: "movie", score: 8.6, release_date: "2017-12-22", release_year: 2017, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 6.6, overview: "Indian spy Tiger and Pakistani spy Zoya team up to rescue nurses trapped in an Iraq hostage crisis." },
  { id: 134, title: "Bajrangi Bhaijaan", media_type: "movie", score: 9.0, release_date: "2015-07-17", release_year: 2015, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 8.0, overview: "An ardently devoted man undertakes a perilous journey to reunite a mute Pakistani girl with her family." },
  { id: 135, title: "PK", media_type: "movie", score: 9.2, release_date: "2014-12-19", release_year: 2014, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 8.1, overview: "An alien visiting Earth questions religious dogmas and superstitions with childlike innocence." },
  { id: 136, title: "Bhool Bhulaiyaa 3", media_type: "movie", score: 8.5, release_date: "2024-11-01", release_year: 2024, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 6.8, overview: "The haunted haveli returns with more twists, scares, and Rooh Baba's unique brand of comedy horror." },
  { id: 137, title: "Singham Again", media_type: "movie", score: 8.7, release_date: "2024-11-01", release_year: 2024, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 7.0, overview: "Bajirao Singham returns on an epic mission inspired by the Ramayana to rescue Lady Singham." },
  { id: 138, title: "Gadar 2", media_type: "movie", score: 8.8, release_date: "2023-08-11", release_year: 2023, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 6.5, overview: "Tara Singh crosses the border into Pakistan once again, this time to bring his son back." },
  { id: 139, title: "Dhoom 3", media_type: "movie", score: 8.4, release_date: "2013-12-20", release_year: 2013, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 6.2, overview: "A circus performer plans a series of heists to save his father's bank from a corrupt system." },

  // ── Hollywood Classics ──
  { id: 1, title: "Inception", media_type: "movie", score: 9.5, release_date: "2010-07-16", release_year: 2010, poster_path: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg", rating: 8.8, overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life." },
  { id: 2, title: "The Dark Knight", media_type: "movie", score: 9.8, release_date: "2008-07-18", release_year: 2008, poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", rating: 9.0, overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent to defeat the Joker." },
  { id: 3, title: "Interstellar", media_type: "movie", score: 9.4, release_date: "2014-11-07", release_year: 2014, poster_path: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg", rating: 8.7, overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel." },
  { id: 4, title: "The Shawshank Redemption", media_type: "movie", score: 9.9, release_date: "1994-09-23", release_year: 1994, poster_path: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg", rating: 9.3, overview: "Imprisoned in the 1940s for a double murder he didn't commit, upstanding banker Andy Dufresne begins a new life at the Shawshank prison." },
  { id: 5, title: "Pulp Fiction", media_type: "movie", score: 9.6, release_date: "1994-10-14", release_year: 1994, poster_path: "/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg", rating: 8.9, overview: "A burger-loving hitman, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer intersect in four tales of violence." },
  { id: 6, title: "The Matrix", media_type: "movie", score: 9.3, release_date: "1999-03-31", release_year: 1999, poster_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", rating: 8.7, overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the shadow system." },
  { id: 7, title: "Forrest Gump", media_type: "movie", score: 9.2, release_date: "1994-07-06", release_year: 1994, poster_path: "/Cw4hIUIAmSYfK9QfaUW5igp9La.jpg", rating: 8.8, overview: "A man with a low IQ has accomplished great things in his life and been present during significant historic events." },
  { id: 8, title: "Fight Club", media_type: "movie", score: 9.3, release_date: "1999-10-15", release_year: 1999, poster_path: "/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg", rating: 8.8, overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy." },
  { id: 9, title: "The Lord of the Rings: The Fellowship of the Ring", media_type: "movie", score: 9.7, release_date: "2001-12-19", release_year: 2001, poster_path: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", rating: 8.9, overview: "Young hobbit Frodo Baggins, after inheriting a mysterious ring, must journey to the fires of Mount Doom to destroy it." },
  { id: 10, title: "Goodfellas", media_type: "movie", score: 9.3, release_date: "1990-09-19", release_year: 1990, poster_path: "/9OkCLM73MIU2CrKZbqiT8Ln1wY2.jpg", rating: 8.7, overview: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners." },
  { id: 11, title: "The Godfather", media_type: "movie", score: 9.8, release_date: "1972-03-24", release_year: 1972, poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", rating: 9.2, overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family." },
  { id: 12, title: "Parasite", media_type: "movie", score: 9.1, release_date: "2019-05-30", release_year: 2019, poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", rating: 8.5, overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled." },
  { id: 13, title: "Spirited Away", media_type: "movie", score: 9.0, release_date: "2001-07-20", release_year: 2001, poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", rating: 8.5, overview: "A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation." },
  { id: 14, title: "Gladiator", media_type: "movie", score: 8.9, release_date: "2000-05-01", release_year: 2000, poster_path: "/wN2xWp1eIwCKOD0BHTcErTBv1Uq.jpg", rating: 8.2, overview: "In the year 180, the death of Emperor Marcus Aurelius throws the Roman Empire into chaos." },
  { id: 15, title: "Joker", media_type: "movie", score: 8.8, release_date: "2019-10-02", release_year: 2019, poster_path: "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", rating: 8.2, overview: "During the 1980s, a failed stand-up comedian is driven insane and turns to a life of crime and chaos in Gotham City." },
  { id: 16, title: "Whiplash", media_type: "movie", score: 8.9, release_date: "2014-10-10", release_year: 2014, poster_path: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg", rating: 8.4, overview: "Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost." },
  { id: 110, title: "Deadpool & Wolverine", media_type: "movie", score: 9.0, release_date: "2024-07-26", release_year: 2024, poster_path: "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg", rating: 7.8, overview: "Wolverine is recovering from his injuries when he crosses paths with the loudmouth Deadpool." },
  { id: 115, title: "Avatar: The Way of Water", media_type: "movie", score: 8.8, release_date: "2022-12-16", release_year: 2022, poster_path: "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", rating: 7.7, overview: "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora." },
  { id: 53, title: "Spider-Man: Across the Spider-Verse", media_type: "movie", score: 9.3, release_date: "2023-06-02", release_year: 2023, poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj7sfs8.jpg", rating: 8.4, overview: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People." },
  { id: 872585, title: "Oppenheimer", media_type: "movie", score: 9.6, release_date: "2023-07-21", release_year: 2023, poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", rating: 8.1, overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II." },
  { id: 140, title: "Avengers: Endgame", media_type: "movie", score: 9.7, release_date: "2019-04-26", release_year: 2019, poster_path: "/or06FN3Dka5tukK1e9ITRH1iqPY.jpg", rating: 8.3, overview: "The surviving heroes band together to reverse Thanos' actions and restore balance to the universe." },
  { id: 141, title: "Avengers: Infinity War", media_type: "movie", score: 9.5, release_date: "2018-04-27", release_year: 2018, poster_path: "/7WsyChQLEftFiDhRkzUCOIFnHBe.jpg", rating: 8.3, overview: "The Avengers and allies fight to stop Thanos from assembling all six Infinity Stones." },
  { id: 142, title: "Titanic", media_type: "movie", score: 9.4, release_date: "1997-12-19", release_year: 1997, poster_path: "/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg", rating: 7.9, overview: "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious Titanic." },
  { id: 143, title: "The Wolf of Wall Street", media_type: "movie", score: 9.1, release_date: "2013-12-25", release_year: 2013, poster_path: "/34m2tygAYBGqA9MXKhRDtzYd4MR.jpg", rating: 8.0, overview: "Based on the true story of Jordan Belfort, from his rise to a wealthy stock-broker to his fall involving crime and corruption." },
  { id: 144, title: "Django Unchained", media_type: "movie", score: 9.0, release_date: "2012-12-25", release_year: 2012, poster_path: "/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg", rating: 8.2, overview: "With the help of a German bounty hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner." },
  { id: 145, title: "The Prestige", media_type: "movie", score: 9.0, release_date: "2006-10-20", release_year: 2006, poster_path: "/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg", rating: 8.5, overview: "Two rival stage magicians engage in a ruthless battle of one-upmanship to create the ultimate illusion." },
  { id: 146, title: "Shutter Island", media_type: "movie", score: 8.8, release_date: "2010-02-19", release_year: 2010, poster_path: "/kve20tXMHZp4x6mo1kc1Ags5FG.jpg", rating: 8.2, overview: "Two U.S. Marshals are sent to investigate a psychiatric facility on Shutter Island after a patient goes missing." },
  { id: 147, title: "John Wick: Chapter 4", media_type: "movie", score: 8.9, release_date: "2023-03-24", release_year: 2023, poster_path: "/vZloFAK7NmvMGKE7LsyF7pomcur.jpg", rating: 7.7, overview: "John Wick uncovers a path to defeating The High Table, but must face new enemies with powerful alliances." },
  { id: 148, title: "Dune: Part Two", media_type: "movie", score: 9.2, release_date: "2024-03-01", release_year: 2024, poster_path: "/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg", rating: 8.2, overview: "Paul Atreides unites with Chani and the Fremen to seek revenge against the conspirators who destroyed his family." },
  { id: 149, title: "Inside Out 2", media_type: "movie", score: 8.7, release_date: "2024-06-14", release_year: 2024, poster_path: "/vpnVM9B6NMmQpWeZvs5x7QgbON.jpg", rating: 7.6, overview: "As Riley enters puberty, new emotions join Joy, Sadness, Anger, Fear, and Disgust inside her mind." },

  // ── TV Shows ──
  { id: 1399, title: "Game of Thrones", media_type: "tv", score: 9.5, release_date: "2011-04-17", release_year: 2011, poster_path: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg", rating: 8.4, overview: "Seven noble families fight for control of the mythical land of Westeros." },
  { id: 1396, title: "Breaking Bad", media_type: "tv", score: 9.8, release_date: "2008-01-20", release_year: 2008, poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", rating: 8.9, overview: "A high school chemistry teacher turned meth maker partners with a former student." },
  { id: 60735, title: "The Flash", media_type: "tv", score: 8.5, release_date: "2014-10-07", release_year: 2014, poster_path: "/lJA2RCMfsWoskqlQhXPSLFQGXEJ.jpg", rating: 7.8, overview: "Barry Allen wakes up from a coma to discover he's been given the power of super speed." },
  { id: 94997, title: "House of the Dragon", media_type: "tv", score: 9.0, release_date: "2022-08-21", release_year: 2022, poster_path: "/z2yahl2uefxDCl0nogcRBstwruJ.jpg", rating: 8.4, overview: "The Targaryen civil war, the Dance of the Dragons, 200 years before Game of Thrones." },
  { id: 76479, title: "The Boys", media_type: "tv", score: 9.1, release_date: "2019-07-26", release_year: 2019, poster_path: "/stTEycfG9Eh8YNwBecMBt9557Hn.jpg", rating: 8.5, overview: "A group of vigilantes fight back against corrupt superheroes who abuse their powers." },
  { id: 71912, title: "The Witcher", media_type: "tv", score: 8.7, release_date: "2019-12-20", release_year: 2019, poster_path: "/7vjaCdMw15FEbXyLQTVa04URsPm.jpg", rating: 8.0, overview: "Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world of humans." },
  { id: 93405, title: "Squid Game", media_type: "tv", score: 9.3, release_date: "2021-09-17", release_year: 2021, poster_path: "/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg", rating: 7.8, overview: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games for a large cash prize." },

  // ── Popular Persons ──
  { id: 101, title: "Leonardo DiCaprio", media_type: "person", score: 9.5, profile_path: "/wo2hJv0ktj4B5oWoT39c42AdRYS.jpg", overview: "Actor known for Inception, Titanic, The Wolf of Wall Street, The Revenant." },
  { id: 106, title: "Cillian Murphy", media_type: "person", score: 9.3, profile_path: "/w61a4aZi4ghIY31w276Je4eHES.jpg", overview: "Actor known for Oppenheimer, Peaky Blinders, Inception, 28 Days Later." },
  { id: 201, title: "Christopher Nolan", media_type: "person", score: 9.9, profile_path: "/3zbVvA64Wo242sD7z75yB44R3s.jpg", overview: "Visionary Director of Inception, The Dark Knight, Interstellar, Oppenheimer." },
  { id: 202, title: "Shah Rukh Khan", media_type: "person", score: 9.6, profile_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", overview: "Bollywood superstar known as King Khan. Actor in Pathaan, Jawan, Dilwale Dulhania Le Jayenge." },
  { id: 203, title: "Aamir Khan", media_type: "person", score: 9.4, profile_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", overview: "Bollywood actor and filmmaker known for 3 Idiots, Dangal, PK, Lagaan." },
  { id: 204, title: "Salman Khan", media_type: "person", score: 9.3, profile_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", overview: "Bollywood actor known for Tiger Zinda Hai, Bajrangi Bhaijaan, Dabangg." },
  { id: 205, title: "Ranbir Kapoor", media_type: "person", score: 9.0, profile_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", overview: "Bollywood actor known for Animal, Barfi!, Rockstar, Ae Dil Hai Mushkil." },
  { id: 206, title: "Allu Arjun", media_type: "person", score: 9.1, profile_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", overview: "Telugu superstar known for Pushpa: The Rise, Pushpa 2: The Rule, Ala Vaikunthapurramuloo." },
  { id: 207, title: "Prabhas", media_type: "person", score: 9.0, profile_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", overview: "Telugu superstar known for Baahubali, Kalki 2898 AD, Saaho." },
  { id: 208, title: "Margot Robbie", media_type: "person", score: 9.0, profile_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", overview: "Actress known for Barbie, The Wolf of Wall Street, Once Upon a Time in Hollywood." },
  { id: 209, title: "Timothée Chalamet", media_type: "person", score: 9.1, profile_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", overview: "Actor known for Dune, Call Me by Your Name, Wonka, Little Women." },
  { id: 210, title: "Keanu Reeves", media_type: "person", score: 9.2, profile_path: "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", overview: "Actor known for The Matrix, John Wick, Speed, Point Break." },
];


// ─── Common Alternate Spellings / Aliases ───────────────────────────
// Maps common misspellings to canonical titles for instant correction.
// These are checked BEFORE fuzzy matching for maximum speed.
const SPELLING_ALIASES: Record<string, string[]> = {
  "dhamaal":    ["dhammal", "dhamal", "dhaamal", "dhamall", "dhamahl", "dhamal", "dhmal"],
  "dhamaal 4":  ["dhammal 4", "dhamal 4", "dhaamal 4", "dhamall 4"],
  "pathaan":    ["pathan", "pataan", "pathan", "pathaan", "pathn"],
  "pushpa":     ["pushpaa", "puspaa", "puashpa", "pushp"],
  "baahubali":  ["bahubali", "baahuballi", "bahuballi", "baahubli"],
  "jawan":      ["jawaan", "jwan", "javaan"],
  "dangal":     ["dangel", "dangle", "dangall"],
  "stree":      ["stri", "stre", "streee"],
  "kalki":      ["kalke", "kalkii", "kalky"],
  "inception":  ["incepton", "incption", "inseption", "insepton"],
  "interstellar": ["intersteller", "interstelar", "intersteller", "interstelller"],
  "oppenheimer": ["openheimer", "openhimer", "oppenhiemer", "oppnheimer"],
  "avengers":   ["avengrs", "avengerss", "avangers", "avengeres"],
  "spider-man": ["spiderman", "spider man", "spyder man", "spiderman"],
  "deadpool":   ["dedpool", "deadpol", "deadpoll", "dedpol"],
  "avatar":     ["avtar", "avataar", "avatr"],
  "wolverine":  ["wolwerine", "wolvereen", "wolvorine"],
  "gladiator":  ["gladiater", "gladietor", "gladitor"],
  "godfather":  ["godfater", "godfahter", "godfathre"],
  "whiplash":   ["whiplach", "wiplash", "whiplsh"],
  "titanic":    ["titanik", "titnic", "taitanic", "titenic"],
  "joker":      ["jokr", "jokker", "jokeer"],
  "squid game": ["squd game", "squid gme", "squidgame", "sqiud game"],
  "breaking bad": ["braking bad", "breakingbad", "breaking baad"],
};

// Build a reverse alias lookup: misspelling → canonical form
const aliasReverseLookup = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(SPELLING_ALIASES)) {
  for (const alias of aliases) {
    aliasReverseLookup.set(alias.toLowerCase(), canonical.toLowerCase());
  }
}


// In-memory runtime index map
const dynamicIndexMap = new Map<string, ElasticSearchResult>();

// Populate initial catalog into runtime index map
INITIAL_ELASTIC_CATALOG.forEach(item => {
  dynamicIndexMap.set(`${item.media_type}-${item.id}`, item);
});

/**
 * Correct a query using known spelling aliases.
 * Returns the corrected query if a known misspelling is found.
 */
function correctSpelling(query: string): string {
  const lower = query.toLowerCase().trim();

  // Direct full-query alias match
  if (aliasReverseLookup.has(lower)) {
    return aliasReverseLookup.get(lower)!;
  }

  // Per-word correction
  const words = lower.split(/\s+/);
  let corrected = false;
  const fixedWords = words.map(w => {
    if (aliasReverseLookup.has(w)) {
      corrected = true;
      return aliasReverseLookup.get(w)!;
    }
    return w;
  });

  // Try multi-word alias (e.g., "dhammal 4" → "dhamaal 4")
  if (!corrected) {
    for (let len = Math.min(words.length, 4); len >= 2; len--) {
      for (let start = 0; start <= words.length - len; start++) {
        const phrase = words.slice(start, start + len).join(" ");
        if (aliasReverseLookup.has(phrase)) {
          const fixed = aliasReverseLookup.get(phrase)!;
          const before = words.slice(0, start).join(" ");
          const after = words.slice(start + len).join(" ");
          return [before, fixed, after].filter(Boolean).join(" ");
        }
      }
    }
  }

  return corrected ? fixedWords.join(" ") : query;
}


/**
 * Synchronous Zero-Latency Search Function (< 1ms response time)
 * Evaluates fuzzy full-text token matching, typo correction,
 * relevance scoring, and snippet highlighting synchronously.
 */
export function searchWithElasticSync(
  query: string,
  mediaType: "movie" | "tv" | "all" = "all"
): { results: ElasticSearchResult[]; took: number; total: number; correctedQuery?: string } {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return { results: [], took: 0, total: 0 };
  }

  // Step 1: Try spelling correction
  const correctedQuery = correctSpelling(cleanQuery);
  const useQuery = correctedQuery !== cleanQuery.toLowerCase().trim() ? correctedQuery : cleanQuery;
  const didCorrect = useQuery.toLowerCase() !== cleanQuery.toLowerCase();

  const queryWords = useQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const lowerQuery = useQuery.toLowerCase();

  const matchedItems: ElasticSearchResult[] = [];

  dynamicIndexMap.forEach((item) => {
    if (mediaType !== "all" && item.media_type !== mediaType) {
      return;
    }

    const title = item.title || "";
    const overview = item.overview || "";
    const lowerTitle = title.toLowerCase();
    const lowerOverview = overview.toLowerCase();

    const titleWords = lowerTitle.split(/[\s:,\-–—&.]+/).filter(w => w.length > 0);
    const overviewWords = lowerOverview.split(/[\s:,\-–—&.]+/).filter(w => w.length > 0);

    // ── Token matching with fuzzy tolerance ──
    // Each query word must match at least one title/overview word via:
    //   1. Exact prefix (startsWith)
    //   2. Substring (includes)
    //   3. Fuzzy match (Levenshtein distance within tolerance)
    let totalFuzzyPenalty = 0;
    const matchesAllTokens = queryWords.every(qWord => {
      // Exact matches first (fast path)
      if (titleWords.some(tWord => tWord.startsWith(qWord) || tWord.includes(qWord))) return true;
      if (lowerTitle.includes(qWord)) return true;
      if (overviewWords.some(oWord => oWord.startsWith(qWord) || oWord.includes(qWord))) return true;

      // Fuzzy match against title words
      for (const tWord of titleWords) {
        if (fuzzyMatch(qWord, tWord)) {
          totalFuzzyPenalty += 3; // penalty for fuzzy vs exact
          return true;
        }
      }

      // Fuzzy match against overview words
      for (const oWord of overviewWords) {
        if (fuzzyMatch(qWord, oWord)) {
          totalFuzzyPenalty += 5;
          return true;
        }
      }

      return false;
    });

    if (!matchesAllTokens) return;

    // ── Relevance Scoring ──
    let score = item.rating ? item.rating * 0.2 : 1.0;

    if (lowerTitle === lowerQuery) {
      score += 25.0; // Exact full title match
    } else if (lowerTitle.startsWith(lowerQuery)) {
      score += 18.0; // Title starts with query
    } else if (lowerTitle.includes(lowerQuery)) {
      score += 12.0; // Substring title match
    }

    queryWords.forEach(qWord => {
      if (titleWords.some(w => w === qWord)) score += 8.0;        // Exact word match in title
      else if (titleWords.some(w => w.startsWith(qWord))) score += 6.0; // Prefix match in title
      else if (lowerTitle.includes(qWord)) score += 3.0;          // Substring in title
      if (lowerOverview.includes(qWord)) score += 1.0;            // Substring in overview
    });

    // Apply fuzzy penalty
    score -= totalFuzzyPenalty;

    // ── Generate highlighted text HTML ──
    let highlightedTitle = title;
    let highlightedOverview = overview;

    try {
      if (queryWords.length > 0) {
        const regexPattern = new RegExp(`(${queryWords.map(w => escapeRegExp(w)).join("|")})`, "gi");
        highlightedTitle = title.replace(regexPattern, "<mark class='bg-amber-500/35 text-amber-300 font-bold rounded px-0.5'>$1</mark>");

        if (overview) {
          const sentences = overview.split(/(?<=[.!?])\s+/);
          const matchingSentence = sentences.find((s: string) => regexPattern.test(s));
          const baseText = matchingSentence || sentences.slice(0, 2).join(" ");

          highlightedOverview = baseText.replace(regexPattern, "<mark class='bg-amber-500/35 text-amber-300 font-bold rounded px-0.5'>$1</mark>");
          if (overview.length > baseText.length) {
            highlightedOverview += "...";
          }
        }
      }
    } catch {
      // Fallback if regex creation fails
    }

    matchedItems.push({
      ...item,
      score: Math.round(score * 10) / 10,
      highlightedTitle,
      highlightedOverview,
    });
  });

  // Sort by score descending
  matchedItems.sort((a, b) => b.score - a.score);

  const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const took = Math.max(0, Math.round((endTime - startTime) * 100) / 100);

  return {
    results: matchedItems,
    took,
    total: matchedItems.length,
    correctedQuery: didCorrect ? useQuery : undefined,
  };
}

/**
 * Async Search Wrapper combining instant zero-latency local results with optional TMDB network results
 */
export async function searchWithElastic(
  query: string,
  mediaType: "movie" | "tv" | "all" = "all",
  page: number = 1
): Promise<{ results: ElasticSearchResult[]; took: number; total: number; correctedQuery?: string }> {
  const startTime = Date.now();
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return { results: [], took: 0, total: 0 };
  }

  // 1. Instant local indexed search (0ms) with fuzzy matching
  const syncResponse = searchWithElasticSync(cleanQuery, mediaType);
  let aggregatedResults = [...syncResponse.results];

  // Use the corrected query for TMDB search if spelling was fixed
  const tmdbQuery = syncResponse.correctedQuery || cleanQuery;

  // 2. Fetch supplementary data from TMDB API
  try {
    let tmdbRawResults: any[] = [];
    if (mediaType === "movie") {
      const resp = await searchMovies(tmdbQuery, page);
      tmdbRawResults = (resp.results || []).map(m => ({ ...m, media_type: "movie" }));
    } else if (mediaType === "tv") {
      const resp = await searchTVShows(tmdbQuery, page);
      tmdbRawResults = (resp.results || []).map(m => ({ ...m, media_type: "tv" }));
    } else {
      const resp = await searchMulti(tmdbQuery, page);
      tmdbRawResults = resp.results || [];
    }

    // Index & merge fetched items
    tmdbRawResults.forEach((item) => {
      const title = item.title || item.name || "";
      const overview = item.overview || "";
      const type = item.media_type || "movie";
      const date = item.release_date || item.first_air_date || "";
      const releaseYear = date ? new Date(date).getFullYear() : undefined;

      const elasticItem: ElasticSearchResult = {
        id: item.id,
        title,
        media_type: type,
        score: 5.0 + (item.vote_average ? item.vote_average * 0.2 : 0),
        release_date: date || undefined,
        release_year: releaseYear,
        poster_path: item.poster_path || item.profile_path || undefined,
        profile_path: item.profile_path || undefined,
        rating: item.vote_average || undefined,
        overview,
      };

      // Add to dynamic index
      dynamicIndexMap.set(`${type}-${item.id}`, elasticItem);
    });

    // Re-evaluate synchronous search over updated index
    const updatedSync = searchWithElasticSync(cleanQuery, mediaType);
    aggregatedResults = updatedSync.results;
  } catch (err) {
    console.error("Elasticsearch proxy network fetch notice:", err);
  }

  const took = Date.now() - startTime;

  return {
    results: aggregatedResults,
    took,
    total: aggregatedResults.length,
    correctedQuery: syncResponse.correctedQuery,
  };
}

/**
 * Escape regex special characters
 */
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

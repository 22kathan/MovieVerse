const fs = require('fs');

async function testPosters() {
  const apiKey = process.env.TMDB_API_KEY || "832962ff60b64d046e7f8a7e30d663fb";
  const titles = [
    "Pulp Fiction",
    "Goodfellas",
    "Whiplash",
    "Forrest Gump",
    "Fight Club",
    "Joker",
    "The Shawshank Redemption",
    "The Godfather",
    "The Dark Knight",
    "Inception",
    "The Matrix",
    "Interstellar",
    "Parasite",
    "Spirited Away",
    "Gladiator",
    "The Lord of the Rings: The Fellowship of the Ring",
    "Deadpool & Wolverine",
    "Avatar: The Way of Water"
  ];

  const results = {};

  for (const title of titles) {
    try {
      const url = `https://api.tmdb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const first = data.results[0];
        results[title] = {
          id: first.id,
          title: first.title,
          poster_path: first.poster_path,
          backdrop_path: first.backdrop_path,
          vote_average: first.vote_average,
          release_date: first.release_date
        };
      }
    } catch (e) {
      console.error("Error fetching", title, e);
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

testPosters();

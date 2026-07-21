const dns = require('node:dns');
if (dns && typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const API_KEY = "6a5be4999abf74eba1f9a8311294c267";

async function fetchRealPosters() {
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
    "The Lord of the Rings: The Fellowship of the Ring"
  ];

  for (const title of titles) {
    const url = `https://api.tmdb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results[0]) {
        console.log(`TITLE: "${title}" -> poster: "${data.results[0].poster_path}", backdrop: "${data.results[0].backdrop_path}"`);
      }
    } catch (e) {
      console.error("Error fetching", title, e);
    }
  }
}

fetchRealPosters();

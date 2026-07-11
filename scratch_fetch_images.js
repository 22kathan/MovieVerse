const fs = require('fs');
const path = require('path');
const dns = require('node:dns');

// Prioritize IPv4 to prevent connection timeout issues in Node.js fetch
if (dns && typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const API_KEY = "6a5be4999abf74eba1f9a8311294c267";
const FILE_PATH = path.join(__dirname, 'src', 'lib', 'tmdb.ts');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchTMDB(query, type = 'movie') {
  const url = `https://api.tmdb.org/3/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  -> Request failed with status: ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data.results && data.results[0] ? data.results[0] : null;
  } catch (err) {
    console.error(`Error searching for ${query}:`, err);
    return null;
  }
}

async function run() {
  console.log("Reading tmdb.ts...");
  let content = fs.readFileSync(FILE_PATH, 'utf8');

  // Find start and end indices of databases
  const moviesStart = content.indexOf('const MOCK_MOVIES_DB:');
  const tvStart = content.indexOf('const MOCK_TV_SHOWS_DB:');
  
  if (moviesStart === -1 || tvStart === -1) {
    console.error("Could not find database declarations!");
    return;
  }

  // Helper to process a specific block of code
  async function processBlock(startIndex, endIndex, isTv = false) {
    const block = content.slice(startIndex, endIndex);
    
    // Regex to match each entry like "id: 1, title: 'Inception'" or similar
    const entryRegex = /(\d+):\s*\{([^}]+)\}/g;
    let match;
    let newBlock = block;

    const matches = [];
    while ((match = entryRegex.exec(block)) !== null) {
      matches.push({
        fullText: match[0],
        id: match[1],
        body: match[2]
      });
    }

    console.log(`Found ${matches.length} entries for ${isTv ? 'TV Shows' : 'Movies'}.`);

    for (const entry of matches) {
      // Find title/name
      const titleMatch = entry.body.match(/(title|name):\s*"([^"]+)"/);
      if (!titleMatch) continue;
      const title = titleMatch[2];
      
      console.log(`Searching TMDB for ${isTv ? 'TV Show' : 'Movie'}: "${title}"...`);
      const result = await searchTMDB(title, isTv ? 'tv' : 'movie');
      
      if (result) {
        const poster = result.poster_path;
        const backdrop = result.backdrop_path;
        
        if (poster || backdrop) {
          console.log(`  -> Found real images! Poster: ${poster}, Backdrop: ${backdrop}`);
          
          // Replace poster_path and backdrop_path in the entry body
          let newBody = entry.body;
          if (poster) {
            newBody = newBody.replace(/poster_path:\s*"[^"]*"/, `poster_path: "${poster}"`);
            newBody = newBody.replace(/poster_path:\s*null/, `poster_path: "${poster}"`);
          }
          if (backdrop) {
            newBody = newBody.replace(/backdrop_path:\s*"[^"]*"/, `backdrop_path: "${backdrop}"`);
            newBody = newBody.replace(/backdrop_path:\s*null/, `backdrop_path: "${backdrop}"`);
          }
          
          // Replace in newBlock
          const oldEntry = `${entry.id}: {${entry.body}}`;
          const newEntry = `${entry.id}: {${newBody}}`;
          newBlock = newBlock.replace(oldEntry, newEntry);
        } else {
          console.log(`  -> No images found for ${title}`);
        }
      } else {
        console.log(`  -> Search failed for ${title}`);
      }
      
      // Respect rate limits gently
      await sleep(100);
    }

    return newBlock;
  }

  console.log("Processing movies...");
  const newMoviesBlock = await processBlock(moviesStart, tvStart, false);
  content = content.slice(0, moviesStart) + newMoviesBlock + content.slice(tvStart);

  // Re-calculate TV start index after movies modification
  const updatedTvStart = content.indexOf('const MOCK_TV_SHOWS_DB:');
  const tvEnd = content.indexOf('// ============================================', updatedTvStart);

  console.log("Processing TV shows...");
  const newTvBlock = await processBlock(updatedTvStart, tvEnd, true);
  content = content.slice(0, updatedTvStart) + newTvBlock + content.slice(tvEnd);

  console.log("Writing back to tmdb.ts...");
  fs.writeFileSync(FILE_PATH, content, 'utf8');
  console.log("Done!");
}

run();

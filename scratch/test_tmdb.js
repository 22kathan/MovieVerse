const apiKey = "6a5be4999abf74eba1f9a8311294c267";
const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;

fetch(url)
  .then(res => {
    console.log("Status:", res.status);
    return res.json();
  })
  .then(data => {
    if (data.results) {
      console.log("Success! Found", data.results.length, "results.");
      console.log("First movie:", data.results[0].title);
    } else {
      console.log("Response:", data);
    }
  })
  .catch(err => {
    console.error("Error:", err);
  });

// ============================================
// MovieVerse — Database Seed Script
// Seeds genres and initial movies into the database
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GENRES = [
  { tmdbId: 28, name: "Action", slug: "action" },
  { tmdbId: 12, name: "Adventure", slug: "adventure" },
  { tmdbId: 16, name: "Animation", slug: "animation" },
  { tmdbId: 35, name: "Comedy", slug: "comedy" },
  { tmdbId: 80, name: "Crime", slug: "crime" },
  { tmdbId: 99, name: "Documentary", slug: "documentary" },
  { tmdbId: 18, name: "Drama", slug: "drama" },
  { tmdbId: 10751, name: "Family", slug: "family" },
  { tmdbId: 14, name: "Fantasy", slug: "fantasy" },
  { tmdbId: 36, name: "History", slug: "history" },
  { tmdbId: 27, name: "Horror", slug: "horror" },
  { tmdbId: 10402, name: "Music", slug: "music" },
  { tmdbId: 9648, name: "Mystery", slug: "mystery" },
  { tmdbId: 10749, name: "Romance", slug: "romance" },
  { tmdbId: 878, name: "Sci-Fi", slug: "sci-fi" },
  { tmdbId: 10770, name: "TV Movie", slug: "tv-movie" },
  { tmdbId: 53, name: "Thriller", slug: "thriller" },
  { tmdbId: 10752, name: "War", slug: "war" },
  { tmdbId: 37, name: "Western", slug: "western" }
];

const MOVIES = [
  {
    tmdbId: 27205,
    title: "Inception",
    originalTitle: "Inception",
    overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    popularity: 88.5,
    voteAverage: 8.8,
    voteCount: 34000,
    releaseDate: new Date("2010-07-16"),
    mediaType: "MOVIE",
    genres: [28, 878, 53]
  },
  {
    tmdbId: 155,
    title: "The Dark Knight",
    originalTitle: "The Dark Knight",
    overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    popularity: 92.4,
    voteAverage: 9.0,
    voteCount: 30000,
    releaseDate: new Date("2008-07-18"),
    mediaType: "MOVIE",
    genres: [28, 80, 18]
  },
  {
    tmdbId: 157336,
    title: "Interstellar",
    originalTitle: "Interstellar",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    popularity: 87.2,
    voteAverage: 8.7,
    voteCount: 32000,
    releaseDate: new Date("2014-11-07"),
    mediaType: "MOVIE",
    genres: [12, 18, 878]
  },
  {
    tmdbId: 278,
    title: "The Shawshank Redemption",
    originalTitle: "The Shawshank Redemption",
    overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison, where he puts his accounting skills to work for an amoral warden.",
    popularity: 110.1,
    voteAverage: 9.3,
    voteCount: 26000,
    releaseDate: new Date("1994-09-23"),
    mediaType: "MOVIE",
    genres: [18, 80]
  },
  {
    tmdbId: 680,
    title: "Pulp Fiction",
    originalTitle: "Pulp Fiction",
    overview: "A burger-loving hitman, his philosophical partner, a drug-addled gangster's moll, and a washed-up boxer converge in this sprawling, comedic crime caper.",
    popularity: 76.5,
    voteAverage: 8.9,
    voteCount: 25000,
    releaseDate: new Date("1994-10-14"),
    mediaType: "MOVIE",
    genres: [53, 80]
  },
  {
    tmdbId: 603,
    title: "The Matrix",
    originalTitle: "The Matrix",
    overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents who fight the vast and powerful computers who now rule the earth.",
    popularity: 82.3,
    voteAverage: 8.7,
    voteCount: 24000,
    releaseDate: new Date("1999-03-31"),
    mediaType: "MOVIE",
    genres: [28, 878]
  },
  {
    tmdbId: 13,
    title: "Forrest Gump",
    originalTitle: "Forrest Gump",
    overview: "A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined.",
    popularity: 85.0,
    voteAverage: 8.8,
    voteCount: 22000,
    releaseDate: new Date("1994-07-06"),
    mediaType: "MOVIE",
    genres: [18, 35]
  },
  {
    tmdbId: 550,
    title: "Fight Club",
    originalTitle: "Fight Club",
    overview: "An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more.",
    popularity: 91.2,
    voteAverage: 8.8,
    voteCount: 25000,
    releaseDate: new Date("1999-10-15"),
    mediaType: "MOVIE",
    genres: [18, 53]
  },
  {
    tmdbId: 120,
    title: "The Lord of the Rings: The Fellowship of the Ring",
    originalTitle: "The Lord of the Rings: The Fellowship of the Ring",
    overview: "Young hobbit Frodo Baggins, after inheriting a mysterious ring, must leave his home and band together with nine companions to destroy the ring in the fires of Mount Doom.",
    popularity: 98.4,
    voteAverage: 8.9,
    voteCount: 21000,
    releaseDate: new Date("2001-12-19"),
    mediaType: "MOVIE",
    genres: [12, 14, 28]
  },
  {
    tmdbId: 769,
    title: "Goodfellas",
    originalTitle: "Goodfellas",
    overview: "The true story of Henry Hill, his partners, and his life in the mob, covering three decades of heist operations and betrayal.",
    popularity: 65.5,
    voteAverage: 8.7,
    voteCount: 11000,
    releaseDate: new Date("1990-09-19"),
    mediaType: "MOVIE",
    genres: [18, 80]
  },
  {
    tmdbId: 238,
    title: "The Godfather",
    originalTitle: "The Godfather",
    overview: "Spanning years, this film follows the Corleone family patriarch as he passes the empire control to his youngest son, Michael, who must secure their mafia legacy.",
    popularity: 112.5,
    voteAverage: 9.2,
    voteCount: 18000,
    releaseDate: new Date("1972-03-24"),
    mediaType: "MOVIE",
    genres: [18, 80]
  },
  {
    tmdbId: 496243,
    title: "Parasite",
    originalTitle: "Parasite",
    overview: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    popularity: 95.8,
    voteAverage: 8.5,
    voteCount: 16000,
    releaseDate: new Date("2019-05-30"),
    mediaType: "MOVIE",
    genres: [35, 53, 18]
  },
  {
    tmdbId: 129,
    title: "Spirited Away",
    originalTitle: "Spirited Away",
    overview: "A young girl, Chihiro, becomes trapped in a mysterious spirit world where she must find a way to free her transformed parents and return to the human world.",
    popularity: 78.4,
    voteAverage: 8.5,
    voteCount: 15000,
    releaseDate: new Date("2001-07-20"),
    mediaType: "MOVIE",
    genres: [16, 14, 10751]
  },
  {
    tmdbId: 98,
    title: "Gladiator",
    originalTitle: "Gladiator",
    overview: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
    popularity: 84.1,
    voteAverage: 8.2,
    voteCount: 17000,
    releaseDate: new Date("2000-05-01"),
    mediaType: "MOVIE",
    genres: [28, 12, 18]
  },
  {
    tmdbId: 475557,
    title: "Joker",
    originalTitle: "Joker",
    overview: "A mentally troubled stand-up comedian embarks on a downward spiral of revolution and bloody crime in Gotham City.",
    popularity: 99.4,
    voteAverage: 8.2,
    voteCount: 22000,
    releaseDate: new Date("2019-10-02"),
    mediaType: "MOVIE",
    genres: [80, 53, 18]
  },
  {
    tmdbId: 244786,
    title: "Whiplash",
    originalTitle: "Whiplash",
    overview: "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student's potential.",
    popularity: 72.8,
    voteAverage: 8.4,
    voteCount: 14000,
    releaseDate: new Date("2014-10-10"),
    mediaType: "MOVIE",
    genres: [18, 10402]
  },
  {
    tmdbId: 68718,
    title: "Django Unchained",
    originalTitle: "Django Unchained",
    overview: "With the help of a German bounty hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.",
    popularity: 89.2,
    voteAverage: 8.1,
    voteCount: 24000,
    releaseDate: new Date("2012-12-25"),
    mediaType: "MOVIE",
    genres: [18, 37, 28]
  },
  {
    tmdbId: 8587,
    title: "The Lion King",
    originalTitle: "The Lion King",
    overview: "A young lion prince is cast out of his pride by his cruel uncle, who claims he killed his father. He must find his own destiny.",
    popularity: 91.5,
    voteAverage: 8.3,
    voteCount: 16000,
    releaseDate: new Date("1994-06-23"),
    mediaType: "MOVIE",
    genres: [16, 10751, 18]
  },
  {
    tmdbId: 299534,
    title: "Avengers: Endgame",
    originalTitle: "Avengers: Endgame",
    overview: "After the devastating events of Infinity War, the remaining allies assemble once more to reverse Thanos' actions.",
    popularity: 140.2,
    voteAverage: 8.3,
    voteCount: 23000,
    releaseDate: new Date("2019-04-24"),
    mediaType: "MOVIE",
    genres: [28, 12, 878]
  },
  {
    tmdbId: 11,
    title: "Star Wars: A New Hope",
    originalTitle: "Star Wars: A New Hope",
    overview: "Princess Leia is held hostage by Imperial forces. Luke Skywalker and Han Solo team up to rescue her and save the galaxy.",
    popularity: 81.3,
    voteAverage: 8.2,
    voteCount: 18000,
    releaseDate: new Date("1977-05-25"),
    mediaType: "MOVIE",
    genres: [28, 12, 878]
  },
  {
    tmdbId: 807,
    title: "Se7en",
    originalTitle: "Se7en",
    overview: "Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives.",
    popularity: 82.5,
    voteAverage: 8.3,
    voteCount: 19000,
    releaseDate: new Date("1995-09-22"),
    mediaType: "MOVIE",
    genres: [80, 9648, 53]
  },
  {
    tmdbId: 274,
    title: "The Silence of the Lambs",
    originalTitle: "The Silence of the Lambs",
    overview: "A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal killer to help catch another serial killer.",
    popularity: 86.4,
    voteAverage: 8.3,
    voteCount: 14000,
    releaseDate: new Date("1991-02-14"),
    mediaType: "MOVIE",
    genres: [80, 27, 53]
  },
  {
    tmdbId: 16869,
    title: "Inglourious Basterds",
    originalTitle: "Inglourious Basterds",
    overview: "In Nazi-occupied France during World War II, a plan to assassinate Nazi leaders by Jewish U.S. soldiers coincides with a theatre owner's plans.",
    popularity: 75.9,
    voteAverage: 8.2,
    voteCount: 20000,
    releaseDate: new Date("2009-08-19"),
    mediaType: "MOVIE",
    genres: [28, 18, 10752]
  },
  {
    tmdbId: 857,
    title: "Saving Private Ryan",
    originalTitle: "Saving Private Ryan",
    overview: "Following the Normandy Landings, a group of U.S. soldiers go behind enemy lines to retrieve a paratrooper whose brothers have been killed.",
    popularity: 88.7,
    voteAverage: 8.4,
    voteCount: 14000,
    releaseDate: new Date("1998-07-24"),
    mediaType: "MOVIE",
    genres: [18, 36, 10752]
  },
  {
    tmdbId: 1124,
    title: "The Prestige",
    originalTitle: "The Prestige",
    overview: "Two stage magicians in 1890s London engage in a battle to create the ultimate illusion while sacrificing everything.",
    popularity: 71.9,
    voteAverage: 8.4,
    voteCount: 13000,
    releaseDate: new Date("2006-10-19"),
    mediaType: "MOVIE",
    genres: [18, 9648, 878]
  },
  {
    tmdbId: 1422,
    title: "The Departed",
    originalTitle: "The Departed",
    overview: "An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang.",
    popularity: 79.5,
    voteAverage: 8.2,
    voteCount: 13000,
    releaseDate: new Date("2006-10-05"),
    mediaType: "MOVIE",
    genres: [18, 80, 53]
  },
  {
    tmdbId: 77,
    title: "Memento",
    originalTitle: "Memento",
    overview: "A man with short-term memory loss attempts to track down his wife's murderer using Polaroid photos and tattoos.",
    popularity: 42.6,
    voteAverage: 8.2,
    voteCount: 12000,
    releaseDate: new Date("2000-10-11"),
    mediaType: "MOVIE",
    genres: [9648, 53]
  },
  {
    tmdbId: 10681,
    title: "WALL·E",
    originalTitle: "WALL·E",
    overview: "In the distant future, a small waste-collecting robot inadvertently embarks on a space journey that will decide the fate of mankind.",
    popularity: 80.5,
    voteAverage: 8.1,
    voteCount: 16000,
    releaseDate: new Date("2008-06-23"),
    mediaType: "MOVIE",
    genres: [16, 10751, 878]
  },
  {
    tmdbId: 2062,
    title: "Ratatouille",
    originalTitle: "Ratatouille",
    overview: "A rat who can cook makes an unusual alliance with a young kitchen worker at a famous Paris restaurant.",
    popularity: 79.2,
    voteAverage: 7.8,
    voteCount: 15000,
    releaseDate: new Date("2007-06-22"),
    mediaType: "MOVIE",
    genres: [16, 35, 10751]
  },
  {
    tmdbId: 324857,
    title: "Spider-Man: Into the Spider-Verse",
    originalTitle: "Spider-Man: Into the Spider-Verse",
    overview: "Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat.",
    popularity: 110.4,
    voteAverage: 8.4,
    voteCount: 12000,
    releaseDate: new Date("2018-12-06"),
    mediaType: "MOVIE",
    genres: [16, 28, 12]
  },
  {
    tmdbId: 122,
    title: "The Lord of the Rings: The Return of the King",
    originalTitle: "The Lord of the Rings: The Return of the King",
    overview: "Aragorn is revealed as the heir to the ancient kings as he, Gandalf and the other members of the broken fellowship struggle to save Gondor from Sauron's forces.",
    popularity: 99.4,
    voteAverage: 9.0,
    voteCount: 22000,
    releaseDate: new Date("2003-12-17"),
    mediaType: "MOVIE",
    genres: [12, 14, 28]
  },
  {
    tmdbId: 424,
    title: "Schindler's List",
    originalTitle: "Schindler's List",
    overview: "The true story of enigmatic businessman Oskar Schindler, who saved the lives of more than 1,100 Jews during the Holocaust.",
    popularity: 76.5,
    voteAverage: 9.0,
    voteCount: 15000,
    releaseDate: new Date("1993-12-15"),
    mediaType: "MOVIE",
    genres: [18, 36, 10752]
  },
  {
    tmdbId: 389,
    title: "12 Angry Men",
    originalTitle: "12 Angry Men",
    overview: "The defense and the prosecution have rested and the jury is filing into the jury room to decide if a young Spanish-American associate is guilty of murdering his father.",
    popularity: 45.8,
    voteAverage: 9.0,
    voteCount: 8000,
    releaseDate: new Date("1957-04-10"),
    mediaType: "MOVIE",
    genres: [18]
  },
  {
    tmdbId: 240,
    title: "The Godfather Part II",
    originalTitle: "The Godfather Part II",
    overview: "The continuing saga of the Corleone crime family is told as a young Vito Corleone grows up in Sicily and in 1910s New York.",
    popularity: 78.4,
    voteAverage: 9.0,
    voteCount: 12000,
    releaseDate: new Date("1974-12-20"),
    mediaType: "MOVIE",
    genres: [18, 80]
  },
  {
    tmdbId: 121,
    title: "The Lord of the Rings: The Two Towers",
    originalTitle: "The Lord of the Rings: The Two Towers",
    overview: "Frodo and Sam discover they are being followed by the mysterious Gollum, while Aragorn, Legolas and Gimli face the besieged kingdom of Rohan.",
    popularity: 91.5,
    voteAverage: 8.9,
    voteCount: 20000,
    releaseDate: new Date("2002-12-18"),
    mediaType: "MOVIE",
    genres: [12, 14, 28]
  },
  {
    tmdbId: 1891,
    title: "Star Wars: The Empire Strikes Back",
    originalTitle: "Star Wars: The Empire Strikes Back",
    overview: "The epic adventure continues as Luke Skywalker, Han Solo, and Princess Leia face Imperial forces on the ice planet Hoth.",
    popularity: 76.8,
    voteAverage: 8.8,
    voteCount: 16000,
    releaseDate: new Date("1980-05-21"),
    mediaType: "MOVIE",
    genres: [28, 12, 878]
  },
  {
    tmdbId: 497,
    title: "The Green Mile",
    originalTitle: "The Green Mile",
    overview: "A supernatural tale set on death row in a Southern prison, where gentle giant John Coffey possesses the mysterious power to heal people's ailments.",
    popularity: 68.4,
    voteAverage: 8.8,
    voteCount: 15000,
    releaseDate: new Date("1999-12-10"),
    mediaType: "MOVIE",
    genres: [18, 14, 80]
  },
  {
    tmdbId: 597,
    title: "Titanic",
    originalTitle: "Titanic",
    overview: "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.",
    popularity: 98.4,
    voteAverage: 7.9,
    voteCount: 24000,
    releaseDate: new Date("1997-12-19"),
    mediaType: "MOVIE",
    genres: [18, 10749]
  },
  {
    tmdbId: 97,
    title: "The Usual Suspects",
    originalTitle: "The Usual Suspects",
    overview: "A sole survivor tells of the twisty events leading up to a horrific gun battle on a boat, which began when five criminals met at a police lineup.",
    popularity: 38.5,
    voteAverage: 8.4,
    voteCount: 10000,
    releaseDate: new Date("1995-08-16"),
    mediaType: "MOVIE",
    genres: [18, 80, 9648]
  },
  {
    tmdbId: 539,
    title: "Psycho",
    originalTitle: "Psycho",
    overview: "A Phoenix secretary embezzles $40,000 from her employer's client, goes on the run, and checks into a remote motel run by a young man under the domination of his mother.",
    popularity: 48.9,
    voteAverage: 8.4,
    voteCount: 9500,
    releaseDate: new Date("1960-06-16"),
    mediaType: "MOVIE",
    genres: [27, 53, 9648]
  },
  {
    tmdbId: 101,
    title: "Leon: The Professional",
    originalTitle: "Léon",
    overview: "A professional assassin takes in a twelve-year-old girl after her family is murdered by corrupt DEA agents.",
    popularity: 58.5,
    voteAverage: 8.5,
    voteCount: 14000,
    releaseDate: new Date("1994-09-14"),
    mediaType: "MOVIE",
    genres: [28, 80, 18]
  },
  {
    tmdbId: 14,
    title: "American History X",
    originalTitle: "American History X",
    overview: "A former neo-nazi skinhead tries to prevent his younger brother from going down the same wrong path that he did.",
    popularity: 42.5,
    voteAverage: 8.5,
    voteCount: 11000,
    releaseDate: new Date("1998-10-30"),
    mediaType: "MOVIE",
    genres: [18]
  },
  {
    tmdbId: 289,
    title: "Casablanca",
    originalTitle: "Casablanca",
    overview: "In December 1941, a cynical American expatriate encounters a former lover in Casablanca, Morocco, with complications.",
    popularity: 32.5,
    voteAverage: 8.5,
    voteCount: 5000,
    releaseDate: new Date("1942-11-26"),
    mediaType: "MOVIE",
    genres: [18, 10749]
  },
  {
    tmdbId: 598,
    title: "City of God",
    originalTitle: "Cidade de Deus",
    overview: "In the slums of Rio, two kids choose different paths: one becomes a photographer, the other a drug dealer.",
    popularity: 45.6,
    voteAverage: 8.4,
    voteCount: 7000,
    releaseDate: new Date("2002-08-30"),
    mediaType: "MOVIE",
    genres: [18, 80]
  },
  {
    tmdbId: 311,
    title: "Once Upon a Time in America",
    originalTitle: "Once Upon a Time in America",
    overview: "A former Prohibition-era Jewish gangster returns to the Lower East Side of Manhattan, where he must confront the ghosts and regrets of his past.",
    popularity: 35.8,
    voteAverage: 8.4,
    voteCount: 5500,
    releaseDate: new Date("1984-06-01"),
    mediaType: "MOVIE",
    genres: [18, 80]
  },
  {
    tmdbId: 423,
    title: "The Pianist",
    originalTitle: "The Pianist",
    overview: "A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto during World War II.",
    popularity: 48.9,
    voteAverage: 8.4,
    voteCount: 8500,
    releaseDate: new Date("2002-09-24"),
    mediaType: "MOVIE",
    genres: [18, 36, 10752]
  },
  {
    tmdbId: 1398,
    title: "Sunset Boulevard",
    originalTitle: "Sunset Boulevard",
    overview: "A screenwriter develops a dangerous relationship with a faded silent movie star who is determined to make a comeback.",
    popularity: 28.5,
    voteAverage: 8.4,
    voteCount: 3000,
    releaseDate: new Date("1950-08-10"),
    mediaType: "MOVIE",
    genres: [18]
  },
  {
    tmdbId: 105,
    title: "Back to the Future",
    originalTitle: "Back to the Future",
    overview: "Marty McFly, a 17-year-old high school student, is accidentally sent thirty years into the past in a time-traveling DeLorean invented by his close friend, the eccentric scientist Doc Brown.",
    popularity: 88.5,
    voteAverage: 8.3,
    voteCount: 18000,
    releaseDate: new Date("1985-07-03"),
    mediaType: "MOVIE",
    genres: [12, 35, 878]
  },
  {
    tmdbId: 949,
    title: "Apocalypse Now",
    originalTitle: "Apocalypse Now",
    overview: "A U.S. Army officer serving in Vietnam is tasked with assassinating a renegade Special Forces Colonel who sees himself as a god.",
    popularity: 46.8,
    voteAverage: 8.3,
    voteCount: 7800,
    releaseDate: new Date("1979-08-15"),
    mediaType: "MOVIE",
    genres: [18, 10752]
  },
  {
    tmdbId: 85,
    title: "Raiders of the Lost Ark",
    originalTitle: "Raiders of the Lost Ark",
    overview: "In 1936, archaeologist and adventurer Indiana Jones is hired by the U.S. government to find the Ark of the Covenant before Adolf Hitler's Nazis can obtain its awesome powers.",
    popularity: 58.9,
    voteAverage: 8.4,
    voteCount: 11000,
    releaseDate: new Date("1981-06-12"),
    mediaType: "MOVIE",
    genres: [12, 28]
  },
  {
    tmdbId: 348,
    title: "Alien",
    originalTitle: "Alien",
    overview: "After a space merchant vessel receives an unknown transmission as a distress call, one of the crew is attacked by a mysterious life form and they soon realize that its life cycle has only just begun.",
    popularity: 68.9,
    voteAverage: 8.1,
    voteCount: 13000,
    releaseDate: new Date("1979-05-25"),
    mediaType: "MOVIE",
    genres: [27, 878]
  },
  {
    tmdbId: 354912,
    title: "Coco",
    originalTitle: "Coco",
    overview: "Aspiring musician Miguel, confronted with his family's ancestral ban on music, enters the Land of the Dead to find his great-great-grandfather, a legendary singer.",
    popularity: 88.5,
    voteAverage: 8.2,
    voteCount: 17000,
    releaseDate: new Date("2017-10-27"),
    mediaType: "MOVIE",
    genres: [16, 10751, 14]
  },
  {
    tmdbId: 569094,
    title: "Spider-Man: Across the Spider-Verse",
    originalTitle: "Spider-Man: Across the Spider-Verse",
    overview: "After reuniting with Gwen Stacy, Brooklyn's full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
    popularity: 145.8,
    voteAverage: 8.5,
    voteCount: 6500,
    releaseDate: new Date("2023-05-31"),
    mediaType: "MOVIE",
    genres: [16, 28, 12]
  },
  {
    tmdbId: 577922,
    title: "The Dark Knight Rises",
    originalTitle: "The Dark Knight Rises",
    overview: "Eight years after the Joker's reign of anarchy, Batman, with the help of the enigmatic Selina Kyle, is forced from his exile to save Gotham City, now threatened by the brutal guerrilla terrorist Bane.",
    popularity: 82.5,
    voteAverage: 7.8,
    voteCount: 21000,
    releaseDate: new Date("2012-07-16"),
    mediaType: "MOVIE",
    genres: [28, 80, 18, 53]
  },
  {
    tmdbId: 299536,
    title: "Avengers: Infinity War",
    originalTitle: "Avengers: Infinity War",
    overview: "As the Avengers and their allies have continued to protect the world from threats too large for any one hero to handle, a new danger has emerged from the cosmic shadows: Thanos.",
    popularity: 125.6,
    voteAverage: 8.3,
    voteCount: 27000,
    releaseDate: new Date("2018-04-25"),
    mediaType: "MOVIE",
    genres: [28, 12, 878]
  },
  {
    tmdbId: 694,
    title: "The Shining",
    originalTitle: "The Shining",
    overview: "A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence, while his psychic son sees horrific forebodings from both past and future.",
    popularity: 48.9,
    voteAverage: 8.2,
    voteCount: 16000,
    releaseDate: new Date("1980-05-23"),
    mediaType: "MOVIE",
    genres: [27, 53]
  },
  {
    tmdbId: 500,
    title: "Reservoir Dogs",
    originalTitle: "Reservoir Dogs",
    overview: "When a simple jewelry heist goes horribly wrong, the surviving criminals begin to suspect that one of them is a police informant.",
    popularity: 38.9,
    voteAverage: 8.2,
    voteCount: 9500,
    releaseDate: new Date("1992-09-02"),
    mediaType: "MOVIE",
    genres: [80, 53]
  },
  {
    tmdbId: 199,
    title: "Braveheart",
    originalTitle: "Braveheart",
    overview: "William Wallace begins a revolt against King Edward I of England after the love of his life is killed.",
    popularity: 58.5,
    voteAverage: 8.3,
    voteCount: 9800,
    releaseDate: new Date("1995-05-24"),
    mediaType: "MOVIE",
    genres: [28, 18, 36, 10752]
  },
  {
    tmdbId: 862,
    title: "Toy Story",
    originalTitle: "Toy Story",
    overview: "Led by Woody, Andy's toys live happily in his room until Andy's birthday brings Buzz Lightyear onto the scene.",
    popularity: 78.4,
    voteAverage: 8.0,
    voteCount: 17000,
    releaseDate: new Date("1995-10-30"),
    mediaType: "MOVIE",
    genres: [16, 35, 10751]
  },
  {
    tmdbId: 239,
    title: "Amadeus",
    originalTitle: "Amadeus",
    overview: "The life, success and troubles of Wolfgang Amadeus Mozart, as told by Antonio Salieri, the contemporary composer who was insanely jealous of Mozart's talent and claimed to have murdered him.",
    popularity: 31.5,
    voteAverage: 8.4,
    voteCount: 4200,
    releaseDate: new Date("1984-09-19"),
    mediaType: "MOVIE",
    genres: [18, 36, 10402]
  },
  {
    tmdbId: 1892,
    title: "Star Wars: Return of the Jedi",
    originalTitle: "Star Wars: Return of the Jedi",
    overview: "After a daring mission to rescue Han Solo from Jabba the Hutt, the Rebels dispatch to Endor to destroy the second Death Star.",
    popularity: 71.5,
    voteAverage: 8.3,
    voteCount: 15000,
    releaseDate: new Date("1983-05-25"),
    mediaType: "MOVIE",
    genres: [28, 12, 878]
  },
  {
    tmdbId: 387,
    title: "Heat",
    originalTitle: "Heat",
    overview: "A group of high-end professional thieves start to feel the heat from the LAPD when they unknowingly leave a clue at their latest heist.",
    popularity: 42.5,
    voteAverage: 8.3,
    voteCount: 7800,
    releaseDate: new Date("1995-12-15"),
    mediaType: "MOVIE",
    genres: [28, 80, 53]
  },
  {
    tmdbId: 14160,
    title: "Up",
    originalTitle: "Up",
    overview: "78-year-old Carl Fredricksen travels to Paradise Falls in his house equipped with balloons, inadvertently taking a young stowaway.",
    popularity: 68.4,
    voteAverage: 8.0,
    voteCount: 19000,
    releaseDate: new Date("2009-05-28"),
    mediaType: "MOVIE",
    genres: [16, 35, 10751, 12]
  },
  {
    tmdbId: 150540,
    title: "Inside Out",
    originalTitle: "Inside Out",
    overview: "After young Riley is uprooted from her Midwest life and moved to San Francisco, her emotions - Joy, Fear, Anger, Disgust and Sadness - conflict on how best to navigate a new city, house and school.",
    popularity: 76.5,
    voteAverage: 7.9,
    voteCount: 19500,
    releaseDate: new Date("2015-06-17"),
    mediaType: "MOVIE",
    genres: [16, 35, 10751]
  },
  {
    tmdbId: 329,
    title: "Jurassic Park",
    originalTitle: "Jurassic Park",
    overview: "A pragmatic paleontologist touring an almost complete theme park on an island in Central America is tasked with protecting a couple of kids after a power failure causes the park's cloned dinosaurs to run loose.",
    popularity: 65.8,
    voteAverage: 8.1,
    voteCount: 15000,
    releaseDate: new Date("1993-06-11"),
    mediaType: "MOVIE",
    genres: [12, 878]
  },
  {
    tmdbId: 128,
    title: "Princess Mononoke",
    originalTitle: "もののけ姫",
    overview: "On a journey to find the cure for a Tatarigami's curse, Ashitaka finds himself in the middle of a war between the forest gods and Tatara, a mining colony. In this quest he also meets San, the Mononoke Hime.",
    popularity: 38.9,
    voteAverage: 8.3,
    voteCount: 6500,
    releaseDate: new Date("1997-07-12"),
    mediaType: "MOVIE",
    genres: [16, 12, 14]
  },
  {
    tmdbId: 372058,
    title: "Your Name.",
    originalTitle: "君の名は。",
    overview: "Two strangers find themselves linked in a bizarre way. When a connection is formed, will distance be the only thing to keep them apart?",
    popularity: 58.4,
    voteAverage: 8.5,
    voteCount: 10000,
    releaseDate: new Date("2016-08-26"),
    mediaType: "MOVIE",
    genres: [16, 18, 10749, 14]
  },
  {
    tmdbId: 12,
    title: "Finding Nemo",
    originalTitle: "Finding Nemo",
    overview: "After his son is captured in the Great Barrier Reef and taken to Sydney, a timid clownfish embarks on a journey to bring him home.",
    popularity: 72.8,
    voteAverage: 7.8,
    voteCount: 18000,
    releaseDate: new Date("2003-05-30"),
    mediaType: "MOVIE",
    genres: [16, 10751]
  },
  {
    tmdbId: 585,
    title: "Monsters, Inc.",
    originalTitle: "Monsters, Inc.",
    overview: "In order to power the city, monsters have to scare children so that they scream. However, the children are toxic to the monsters, and after a child gets through, 2 monsters realize things may not be what they seem.",
    popularity: 68.4,
    voteAverage: 8.0,
    voteCount: 16500,
    releaseDate: new Date("2001-11-02"),
    mediaType: "MOVIE",
    genres: [16, 10751, 35]
  },
  {
    tmdbId: 4935,
    title: "Howl's Moving Castle",
    originalTitle: "ハウルの動く城",
    overview: "When an unconfident young woman is cursed with an old body by a spiteful witch, her only chance of breaking the spell lies to a self-indulgent yet insecure young wizard and his companions in his leg, walking castle.",
    popularity: 45.8,
    voteAverage: 8.4,
    voteCount: 8500,
    releaseDate: new Date("2004-11-20"),
    mediaType: "MOVIE",
    genres: [16, 14, 10751]
  },
  {
    tmdbId: 106646,
    title: "The Wolf of Wall Street",
    originalTitle: "The Wolf of Wall Street",
    overview: "Based on the true story of Jordan Belfort, from his rise to a wealthy stock-broker living the high life to his fall involving crime, corruption and the federal government.",
    popularity: 91.5,
    voteAverage: 8.0,
    voteCount: 22000,
    releaseDate: new Date("2013-12-25"),
    mediaType: "MOVIE",
    genres: [35, 18, 80]
  },
  {
    tmdbId: 6977,
    title: "No Country for Old Men",
    originalTitle: "No Country for Old Men",
    overview: "Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash near the Rio Grande.",
    popularity: 42.5,
    voteAverage: 8.1,
    voteCount: 10500,
    releaseDate: new Date("2007-11-09"),
    mediaType: "MOVIE",
    genres: [80, 18, 53]
  },
  {
    tmdbId: 11324,
    title: "A Beautiful Mind",
    originalTitle: "A Beautiful Mind",
    overview: "After John Nash, a brilliant but asocial mathematician, accepts secret work in cryptography, his life takes a turn for the nightmarish.",
    popularity: 45.6,
    voteAverage: 8.1,
    voteCount: 9200,
    releaseDate: new Date("2001-12-14"),
    mediaType: "MOVIE",
    genres: [18, 10749]
  },
  {
    tmdbId: 640,
    title: "Catch Me If You Can",
    originalTitle: "Catch Me If You Can",
    overview: "Barely 21 yet, Frank Abagnale Jr. has worked as a doctor, a lawyer, and as a co-pilot for a major airline - all before his 18th birthday.",
    popularity: 58.4,
    voteAverage: 8.0,
    voteCount: 14000,
    releaseDate: new Date("2002-12-16"),
    mediaType: "MOVIE",
    genres: [18, 80, 35]
  },
  {
    tmdbId: 11321,
    title: "Shutter Island",
    originalTitle: "Shutter Island",
    overview: "In 1954, a U.S. Marshal investigates the disappearance of a murderer who escaped from a hospital for the criminally insane on Shutter Island.",
    popularity: 78.4,
    voteAverage: 8.2,
    voteCount: 22000,
    releaseDate: new Date("2010-02-14"),
    mediaType: "MOVIE",
    genres: [9648, 53, 18]
  },
  {
    tmdbId: 180,
    title: "Oldboy",
    originalTitle: "올드보이",
    overview: "After being kidnapped and imprisoned for fifteen years, Oh Dae-Su is released, only to find that he must find his captor in five days.",
    popularity: 38.5,
    voteAverage: 8.3,
    voteCount: 7500,
    releaseDate: new Date("2003-11-21"),
    mediaType: "MOVIE",
    genres: [28, 80, 9648]
  },
  {
    tmdbId: 18491,
    title: "The Truman Show",
    originalTitle: "The Truman Show",
    overview: "An insurance salesman discovers his whole life is actually a reality TV show.",
    popularity: 58.4,
    voteAverage: 8.1,
    voteCount: 16000,
    releaseDate: new Date("1998-06-04"),
    mediaType: "MOVIE",
    genres: [35, 18]
  },
  {
    tmdbId: 38,
    title: "Eternal Sunshine of the Spotless Mind",
    originalTitle: "Eternal Sunshine of the Spotless Mind",
    overview: "When their relationship turns sour, a couple undergoes a medical procedure to have each other erased from their memories.",
    popularity: 48.9,
    voteAverage: 8.1,
    voteCount: 13000,
    releaseDate: new Date("2004-03-19"),
    mediaType: "MOVIE",
    genres: [18, 878, 10749]
  },
  {
    tmdbId: 752,
    title: "V for Vendetta",
    originalTitle: "V for Vendetta",
    overview: "In a future British tyranny, a shadowy freedom fighter, known only by the alias of \"V\", plots to overthrow it with the help of a young woman.",
    popularity: 54.8,
    voteAverage: 8.1,
    voteCount: 14000,
    releaseDate: new Date("2005-12-11"),
    mediaType: "MOVIE",
    genres: [28, 53, 18]
  },
  {
    tmdbId: 76203,
    title: "12 Years a Slave",
    originalTitle: "12 Years a Slave",
    overview: "In the antebellum United States, Solomon Northup, a free black man from upstate New York, is abducted and sold into slavery.",
    popularity: 42.5,
    voteAverage: 8.2,
    voteCount: 10000,
    releaseDate: new Date("2013-08-30"),
    mediaType: "MOVIE",
    genres: [18, 36]
  }
];

async function main() {
  console.log('🌱 Start seeding...');

  // 1. Seed Genres
  console.log('Seeding genres...');
  const genreIdMap = {};
  for (const g of GENRES) {
    const genre = await prisma.genre.upsert({
      where: { tmdbId: g.tmdbId },
      update: {},
      create: {
        tmdbId: g.tmdbId,
        name: g.name,
        slug: g.slug,
      }
    });
    genreIdMap[g.tmdbId] = genre.id;
  }
  console.log(`✅ Seeded ${GENRES.length} genres.`);

  // 2. Seed Movies
  console.log('Seeding movies...');
  for (const m of MOVIES) {
    const movie = await prisma.movie.upsert({
      where: { tmdbId: m.tmdbId },
      update: {
        title: m.title,
        originalTitle: m.originalTitle,
        overview: m.overview,
        popularity: m.popularity,
        voteAverage: m.voteAverage,
        voteCount: m.voteCount,
        releaseDate: m.releaseDate,
        mediaType: m.mediaType,
      },
      create: {
        tmdbId: m.tmdbId,
        title: m.title,
        originalTitle: m.originalTitle,
        overview: m.overview,
        popularity: m.popularity,
        voteAverage: m.voteAverage,
        voteCount: m.voteCount,
        releaseDate: m.releaseDate,
        mediaType: m.mediaType,
      }
    });

    // Link Movie to Genres
    for (const gId of m.genres) {
      const dbGenreId = genreIdMap[gId];
      if (dbGenreId) {
        await prisma.movieGenre.upsert({
          where: {
            movieId_genreId: {
              movieId: movie.id,
              genreId: dbGenreId
            }
          },
          update: {},
          create: {
            movieId: movie.id,
            genreId: dbGenreId
          }
        });
      }
    }
  }
  console.log(`✅ Seeded ${MOVIES.length} movies.`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

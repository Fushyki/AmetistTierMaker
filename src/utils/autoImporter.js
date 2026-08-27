/**
 * Utilitário de Importação Automática Inteligente do Ametist (Universal Engine)
 * Suporta:
 * 1. Animes & Mangás (AniList GraphQL Oficial)
 * 2. Músicas & Discografias HD (Last.fm Music API - Sem clones/karaoke)
 * 3. Séries, Filmes & Elencos (TVMaze HD Cast API)
 * 4. Jogos (League of Legends, Brawl Stars, Genshin Impact, Honkai Star Rail, Pokémon)
 * 5. Carros & Hipercarros (Coleção Oficial Wikimedia Motors)
 * 6. Busca Universal Definitiva (Wikipedia Multilíngue para qualquer assunto)
 */

export async function importAnimeCharacters(queryOrUrl) {
  let search = queryOrUrl.trim();
  let animeId = null;

  const urlMatch = search.match(/anilist\.co\/anime\/(\d+)/i);
  if (urlMatch) {
    animeId = parseInt(urlMatch[1], 10);
    search = null;
  }

  const query = `
    query ($search: String, $id: Int) {
      Media (search: $search, id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
          large
        }
        characters (page: 1, perPage: 60, sort: [ROLE, RELEVANCE]) {
          nodes {
            id
            name {
              full
              userPreferred
            }
            image {
              large
              medium
            }
          }
        }
      }
    }
  `;

  const variables = animeId ? { id: animeId } : { search };

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message || 'Anime não encontrado no banco de dados.');
  }

  const media = json.data?.Media;
  if (!media) throw new Error('Nenhum resultado de anime encontrado para esta busca.');

  const characters = media.characters?.nodes || [];
  if (characters.length === 0) {
    throw new Error('Nenhum personagem catalogado para este anime.');
  }

  const title = media.title?.english || media.title?.romaji || search;
  const cover = media.coverImage?.extraLarge || media.coverImage?.large;

  const items = characters.map((char, index) => ({
    id: 'anilist-' + char.id + '-' + Date.now(),
    src: char.image?.large || char.image?.medium,
    nome: char.name?.userPreferred || char.name?.full || `Personagem ${index + 1}`,
    tierId: null,
    colIndex: null,
    uploadIndex: Date.now() + index
  })).filter(item => Boolean(item.src));

  return {
    title,
    cover,
    items,
    category: 'animes',
    sourceLabel: `AniList Anime (${items.length} Personagens)`
  };
}

// 2. Músicas & Discografias (Last.fm HD API - Oficial, sem lixo de karaoke)
export async function importMusic(queryOrUrl) {
  let cleanQuery = queryOrUrl.trim();
  cleanQuery = cleanQuery
    .replace(/https?:\/\/(open\.spotify\.com\/(album|artist|track)\/|music\.apple\.com\/[^\/]+\/(album|artist)\/)/i, '')
    .replace(/[\?#].*$/, '')
    .trim() || cleanQuery;

  const LASTFM_KEY = 'b25b959554ed76058ac220b7b2e0a026';

  try {
    // 1. Tenta buscar os Melhores Álbuns do Artista no Last.fm
    const artistUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=${encodeURIComponent(cleanQuery)}&api_key=${LASTFM_KEY}&format=json&limit=50`;
    const res = await fetch(artistUrl);
    const data = await res.json();
    let rawAlbums = data.topalbums?.album || [];

    // 2. Se não encontrou por artista, busca por Nome de Álbum / Termo Musical
    if (!Array.isArray(rawAlbums) || rawAlbums.length < 2) {
      const albumUrl = `https://ws.audioscrobbler.com/2.0/?method=album.search&album=${encodeURIComponent(cleanQuery)}&api_key=${LASTFM_KEY}&format=json&limit=50`;
      const searchRes = await fetch(albumUrl);
      const searchData = await searchRes.json();
      rawAlbums = searchData.results?.albummatches?.album || [];
    }

    if (Array.isArray(rawAlbums) && rawAlbums.length > 0) {
      const items = rawAlbums
        .map((a, index) => {
          const imgRaw = a.image?.[a.image.length - 1]?.['#text'] || a.image?.[0]?.['#text'] || '';
          // Substitui resolução para 700x700 HD
          const imgHd = imgRaw.replace(/\/300x300\//, '/700x700/');
          const artistPrefix = a.artist?.name ? `${a.artist.name} - ` : '';
          return {
            id: `music-lastfm-${index}-${Date.now()}`,
            src: imgHd,
            nome: `${artistPrefix}${a.name}` || 'Álbum',
            tierId: null,
            colIndex: null,
            uploadIndex: Date.now() + index
          };
        })
        .filter(a => Boolean(a.src) && a.nome !== '(null)' && !a.src.includes('2a96cbd8b46e442fc41c2b86b821562f'));

      if (items.length > 0) {
        const artistName = rawAlbums[0]?.artist?.name || cleanQuery;
        return {
          title: `Discografia - ${artistName}`,
          cover: items[0]?.src || null,
          items,
          category: 'musica',
          sourceLabel: `Last.fm Music HD (${items.length} Álbuns)`
        };
      }
    }
  } catch (errLastFm) {
    console.warn('Fallback Last.fm:', errLastFm);
  }

  // Fallback seguro em caso de indisponibilidade
  const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=album&limit=40`;
  const resItunes = await fetch(itunesUrl);
  const dataItunes = await resItunes.json();
  const seen = new Set();
  const items = [];

  for (let i = 0; i < (dataItunes.results || []).length; i++) {
    const item = dataItunes.results[i];
    const name = item.collectionName;
    const rawArtwork = item.artworkUrl100 || item.artworkUrl60;
    const src = rawArtwork ? rawArtwork.replace('100x100bb', '600x600bb') : null;

    if (name && src && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      items.push({
        id: `music-itunes-${item.collectionId || i}-${Date.now()}`,
        src,
        nome: `${item.artistName} - ${name}`,
        tierId: null,
        colIndex: null,
        uploadIndex: Date.now() + i
      });
    }
  }

  if (items.length === 0) {
    throw new Error(`Nenhum álbum ou discografia encontrada para "${cleanQuery}".`);
  }

  return {
    title: `Discografia - ${cleanQuery}`,
    cover: items[0]?.src || null,
    items,
    category: 'musica',
    sourceLabel: `Music HD (${items.length} Álbuns)`
  };
}

// 3. Séries, Filmes & Elencos (TVMaze HD Cast API)
export async function importTVSeries(query) {
  const cleanQ = query.trim();
  const searchUrl = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(cleanQ)}`;
  const res = await fetch(searchUrl);
  const shows = await res.json();

  if (!shows || shows.length === 0) {
    throw new Error(`Nenhuma série encontrada para "${cleanQ}".`);
  }

  const show = shows[0].show;
  const castUrl = `https://api.tvmaze.com/shows/${show.id}/cast`;
  const castRes = await fetch(castUrl);
  const cast = await castRes.json();

  const items = cast
    .map((c, index) => {
      const src = c.character?.image?.original || c.person?.image?.original || c.person?.image?.medium;
      const charName = c.character?.name || c.person?.name || `Personagem ${index + 1}`;
      const actorName = c.person?.name ? ` (${c.person.name})` : '';
      return {
        id: `tv-cast-${c.character?.id || c.person?.id || index}-${Date.now()}`,
        src,
        nome: `${charName}${actorName}`,
        tierId: null,
        colIndex: null,
        uploadIndex: Date.now() + index
      };
    })
    .filter(it => Boolean(it.src));

  if (items.length < 3) {
    throw new Error(`Elenco insuficiente encontrado para "${show.name}".`);
  }

  return {
    title: `${show.name} - Personagens / Elenco`,
    cover: show.image?.original || show.image?.medium || items[0]?.src || null,
    items,
    category: 'filmes',
    sourceLabel: `TVMaze (${items.length} Personagens)`
  };
}

export async function importGameCharacters(query) {
  const q = query.toLowerCase().trim();

  // 1. League of Legends / LoL
  if (q.includes('lol') || q.includes('league of legends') || q.includes('league') || q.includes('champions')) {
    const versionsRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await versionsRes.json();
    const latestVersion = versions[0];

    const champsRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/pt_BR/champion.json`);
    const champsData = await champsRes.json();

    const items = Object.values(champsData.data).map((c, i) => ({
      id: `lol-${c.id}-${Date.now()}`,
      src: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${c.image.full}`,
      nome: c.name,
      tierId: null,
      colIndex: null,
      uploadIndex: Date.now() + i
    }));

    return {
      title: 'League of Legends - Campeões',
      cover: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg',
      items,
      category: 'games',
      sourceLabel: `Riot Games (${items.length} Campeões)`
    };
  }

  // 2. Brawl Stars
  if (q.includes('brawl') || q.includes('brawl stars') || q.includes('brawler')) {
    const bsRes = await fetch('https://api.brawlapi.com/v1/brawlers');
    const bsData = await bsRes.json();
    const list = bsData.list || [];

    const items = list.map((b, i) => ({
      id: `brawl-${b.id}-${Date.now()}`,
      src: b.imageUrl2 || b.imageUrl,
      nome: b.name,
      tierId: null,
      colIndex: null,
      uploadIndex: Date.now() + i
    })).filter(it => Boolean(it.src));

    return {
      title: 'Brawl Stars - Brawlers',
      cover: items[0]?.src || null,
      items,
      category: 'games',
      sourceLabel: `Brawl Stars (${items.length} Brawlers)`
    };
  }

  // 3. Genshin Impact (API Lunaris Oficial)
  if (q.includes('genshin') || q.includes('genshin impact') || q.includes('lunaris') || q.includes('amber') || q.includes('charlist.json')) {
    try {
      let charlistUrl = '';
      try {
        const htmlRes = await fetch('https://genshin.lunaris.network/');
        const html = await htmlRes.text();
        const scriptMatch = html.match(/\/assets\/index-[^"']+\.js/);
        if (scriptMatch) {
          const jsRes = await fetch(`https://genshin.lunaris.network${scriptMatch[0]}`);
          const jsText = await jsRes.text();
          const charMatch = jsText.match(/data\/charlist\.[a-f0-9]+\.json/i) || jsText.match(/"([^"]*charlist[^"]*\.json)"/i);
          if (charMatch) {
            charlistUrl = `https://genshin.lunaris.network/${charMatch[1] || charMatch[0]}`;
          }
        }
      } catch (scrapeErr) {
        console.warn('Scraper Lunaris falhou:', scrapeErr);
      }

      if (!charlistUrl) {
        charlistUrl = 'https://genshin.lunaris.network/data/charlist.6c43fa98.json';
      }

      const res = await fetch(charlistUrl);
      const data = await res.json();
      
      const charArray = Array.isArray(data) 
        ? data 
        : (data.items || data.characters || (data.data && Array.isArray(data.data) ? data.data : Object.values(data)));
        
      if (Array.isArray(charArray) && charArray.length > 0) {
        const items = charArray.map((c, index) => {
          const name = c.name || c.id || c.title || `Personagem ${index + 1}`;
          let imgPath = c.icon || c.avatar || c.img || c.image || (c.id ? `${c.id}.png` : '');
          
          let fullSrc = imgPath;
          if (imgPath && !imgPath.startsWith('http')) {
            const cleanPath = imgPath.replace(/^\/+/, '');
            fullSrc = `https://genshin.lunaris.network/assets/characters/${cleanPath.includes('/') ? cleanPath.split('/').pop() : cleanPath}`;
          }
          
          return {
            id: `genshin-${c.id || index}-${Date.now()}`,
            nome: name,
            src: fullSrc,
            tierId: null,
            colIndex: null,
            uploadIndex: Date.now() + index
          };
        }).filter(item => Boolean(item.src));

        if (items.length > 0) {
          return {
            title: 'Genshin Impact - Personagens',
            cover: items[0]?.src || 'https://genshin.lunaris.network/assets/characters/UI_AvatarIcon_Aether.png',
            items,
            category: 'games',
            sourceLabel: `Lunaris Network (${items.length} Personagens)`
          };
        }
      }
    } catch (e) {
      console.warn('Lunaris fallback para Genshin.dev:', e);
    }

    const res = await fetch('https://genshin.jmp.blue/characters');
    const characters = await res.json();
    const items = characters.map((charName, index) => ({
      id: `genshin-${charName}-${Date.now()}`,
      src: `https://genshin.jmp.blue/characters/${charName}/icon-big`,
      nome: charName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      tierId: null,
      colIndex: null,
      uploadIndex: Date.now() + index
    }));

    return {
      title: 'Genshin Impact - Personagens',
      cover: items[0]?.src || null,
      items,
      category: 'games',
      sourceLabel: `Genshin API (${items.length} Personagens)`
    };
  }

  // 4. Honkai: Star Rail (Nanoka + StarRailRes)
  if (q.includes('honkai') || q.includes('star rail') || q.includes('hsr') || q.includes('nanoka')) {
    try {
      const htmlRes = await fetch('https://hsr.nanoka.cc/');
      const html = await htmlRes.text();
      const nodeMatch = html.match(/assets\/nodes\/character-list\.[a-zA-Z0-9_-]+\.js/);
      
      if (nodeMatch) {
        const jsRes = await fetch(`https://hsr.nanoka.cc/${nodeMatch[0]}`);
        const jsText = await jsRes.text();
        const jsonMatch = jsText.match(/https:\/\/api\.nanoka\.cc\/manifest\/hsr\/v\d+\/character\.json/);
        
        if (jsonMatch) {
          const apiRes = await fetch(jsonMatch[0]);
          const apiData = await apiRes.json();
          
          const items = Object.values(apiData).map((c, i) => {
            const rawImg = c.avatar_drawcard || c.avatar_icon || '';
            const finalImg = rawImg ? `https://static.nanoka.cc${rawImg}` : '';
            return {
              id: `hsr-nanoka-${c.id || i}-${Date.now()}`,
              src: finalImg,
              nome: c.name || c.id,
              tierId: null,
              colIndex: null,
              uploadIndex: Date.now() + i
            };
          }).filter(it => Boolean(it.src));

          return {
            title: 'Honkai: Star Rail - Personagens',
            cover: 'https://static.nanoka.cc/assets/hsr/avatardrawcard/1308.webp',
            items,
            category: 'games',
            sourceLabel: `Nanoka HSR (${items.length} Personagens)`
          };
        }
      }
    } catch (errNanoka) {
      console.warn('Fallback para StarRailRes:', errNanoka);
    }

    const hsrRes = await fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/characters.json');
    const hsrData = await hsrRes.json();

    const items = Object.values(hsrData).map((c, i) => ({
      id: `hsr-${c.id}-${Date.now()}`,
      src: `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${c.icon}`,
      nome: c.name,
      tierId: null,
      colIndex: null,
      uploadIndex: Date.now() + i
    }));

    return {
      title: 'Honkai: Star Rail - Personagens',
      cover: items[0]?.src || null,
      items,
      category: 'games',
      sourceLabel: `StarRailRes (${items.length} Personagens)`
    };
  }

  // 5. Pokémon (Kanto Gen 1 a Gen 9)
  if (q.includes('pokemon') || q.includes('pokémon')) {
    let limit = 151;
    let title = 'Pokémon - 1ª Geração (Kanto)';
    if (q.includes('gen 2') || q.includes('johto')) { limit = 251; title = 'Pokémon - 1ª e 2ª Geração'; }
    else if (q.includes('gen 3') || q.includes('hoenn')) { limit = 386; title = 'Pokémon - Até 3ª Geração'; }
    else if (q.includes('all') || q.includes('todos')) { limit = 1000; title = 'Pokémon - Todos os Clássicos'; }

    const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`);
    const pokeData = await pokeRes.json();

    const items = (pokeData.results || []).map((p, i) => ({
      id: `poke-${i + 1}-${Date.now()}`,
      src: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${i + 1}.png`,
      nome: p.name.charAt(0).toUpperCase() + p.name.slice(1),
      tierId: null,
      colIndex: null,
      uploadIndex: Date.now() + i
    }));

    return {
      title,
      cover: items[0]?.src || null,
      items,
      category: 'games',
      sourceLabel: `PokeAPI (${items.length} Pokémons)`
    };
  }

  throw new Error(`Jogo específico "${query}" não possui rota dedicada. Buscando na base universal...`);
}

// 5. Carros & Hipercarros (Wikimedia HD API)
const HYPERCAR_CATALOG = [
  { title: 'Bugatti_Chiron', name: 'Bugatti Chiron' },
  { title: 'Bugatti_Veyron', name: 'Bugatti Veyron' },
  { title: 'Bugatti_Divo', name: 'Bugatti Divo' },
  { title: 'Bugatti_Bolide', name: 'Bugatti Bolide' },
  { title: 'Bugatti_Tourbillon', name: 'Bugatti Tourbillon' },
  { title: 'Bugatti_Centodieci', name: 'Bugatti Centodieci' },
  { title: 'Koenigsegg_Jesko', name: 'Koenigsegg Jesko' },
  { title: 'Koenigsegg_Agera', name: 'Koenigsegg Agera RS' },
  { title: 'Koenigsegg_Regera', name: 'Koenigsegg Regera' },
  { title: 'Koenigsegg_Gemera', name: 'Koenigsegg Gemera' },
  { title: 'Koenigsegg_CC850', name: 'Koenigsegg CC850' },
  { title: 'Pagani_Zonda', name: 'Pagani Zonda' },
  { title: 'Pagani_Huayra', name: 'Pagani Huayra' },
  { title: 'Pagani_Utopia', name: 'Pagani Utopia' },
  { title: 'LaFerrari', name: 'Ferrari LaFerrari' },
  { title: 'Ferrari_SF90_Stradale', name: 'Ferrari SF90 Stradale' },
  { title: 'Ferrari_Daytona_SP3', name: 'Ferrari Daytona SP3' },
  { title: 'Ferrari_Enzo', name: 'Ferrari Enzo' },
  { title: 'Ferrari_F40', name: 'Ferrari F40' },
  { title: 'Ferrari_F50', name: 'Ferrari F50' },
  { title: 'Ferrari_296', name: 'Ferrari 296 GTB' },
  { title: 'McLaren_P1', name: 'McLaren P1' },
  { title: 'McLaren_Senna', name: 'McLaren Senna' },
  { title: 'McLaren_Speedtail', name: 'McLaren Speedtail' },
  { title: 'McLaren_720S', name: 'McLaren 720S' },
  { title: 'McLaren_W1', name: 'McLaren W1' },
  { title: 'McLaren_Elva', name: 'McLaren Elva' },
  { title: 'Porsche_918_Spyder', name: 'Porsche 918 Spyder' },
  { title: 'Porsche_Carrera_GT', name: 'Porsche Carrera GT' },
  { title: 'Porsche_911_GT3', name: 'Porsche 911 GT3 RS' },
  { title: 'Porsche_959', name: 'Porsche 959' },
  { title: 'Lamborghini_Veneno', name: 'Lamborghini Veneno' },
  { title: 'Lamborghini_Centenario', name: 'Lamborghini Centenario' },
  { title: 'Lamborghini_Revuelto', name: 'Lamborghini Revuelto' },
  { title: 'Lamborghini_Si%C3%A1n_FKP_37', name: 'Lamborghini Sián FKP 37' },
  { title: 'Lamborghini_Aventador', name: 'Lamborghini Aventador SVJ' },
  { title: 'Lamborghini_Hurac%C3%A1n', name: 'Lamborghini Huracán STO' },
  { title: 'Aston_Martin_Valkyrie', name: 'Aston Martin Valkyrie' },
  { title: 'Aston_Martin_Valhalla', name: 'Aston Martin Valhalla' },
  { title: 'Aston_Martin_Vulcan', name: 'Aston Martin Vulcan' },
  { title: 'Aston_Martin_One-77', name: 'Aston Martin One-77' },
  { title: 'Mercedes-AMG_One', name: 'Mercedes-AMG ONE' },
  { title: 'Rimac_Nevera', name: 'Rimac Nevera' },
  { title: 'Hennessey_Venom_F5', name: 'Hennessey Venom F5' },
  { title: 'SSC_Tuatara', name: 'SSC Tuatara' },
  { title: 'De_Tomaso_P72', name: 'De Tomaso P72' },
  { title: 'Gordon_Murray_Automotive_T.50', name: 'GMA T.50' },
  { title: 'Pininfarina_Battista', name: 'Pininfarina Battista' },
  { title: 'Apollo_Intensa_Emozione', name: 'Apollo Intensa Emozione' },
  { title: 'Maserati_MC20', name: 'Maserati MC20' },
  { title: 'Ford_GT', name: 'Ford GT' },
  { title: 'Lexus_LFA', name: 'Lexus LFA' }
];

export async function importCars(queryOrUrl) {
  const q = queryOrUrl.toLowerCase().trim();
  let selectedCatalog = HYPERCAR_CATALOG;
  let title = 'Hipercarros & Supercarros Definitivos';

  if (q.includes('ferrari')) {
    selectedCatalog = HYPERCAR_CATALOG.filter(c => c.name.toLowerCase().includes('ferrari') || c.title.toLowerCase().includes('laferrari'));
    title = 'Supercarros Ferrari';
  } else if (q.includes('porsche')) {
    selectedCatalog = HYPERCAR_CATALOG.filter(c => c.name.toLowerCase().includes('porsche'));
    title = 'Supercarros Porsche';
  } else if (q.includes('lamborghini')) {
    selectedCatalog = HYPERCAR_CATALOG.filter(c => c.name.toLowerCase().includes('lamborghini'));
    title = 'Supercarros Lamborghini';
  } else if (q.includes('bugatti')) {
    selectedCatalog = HYPERCAR_CATALOG.filter(c => c.name.toLowerCase().includes('bugatti'));
    title = 'Hipercarros Bugatti';
  } else if (q.includes('mclaren')) {
    selectedCatalog = HYPERCAR_CATALOG.filter(c => c.name.toLowerCase().includes('mclaren'));
    title = 'Supercarros McLaren';
  } else if (q.includes('koenigsegg')) {
    selectedCatalog = HYPERCAR_CATALOG.filter(c => c.name.toLowerCase().includes('koenigsegg'));
    title = 'Hipercarros Koenigsegg';
  } else if (q.includes('aston')) {
    selectedCatalog = HYPERCAR_CATALOG.filter(c => c.name.toLowerCase().includes('aston'));
    title = 'Supercarros Aston Martin';
  } else if (q.includes('pagani')) {
    selectedCatalog = HYPERCAR_CATALOG.filter(c => c.name.toLowerCase().includes('pagani'));
    title = 'Hipercarros Pagani';
  }

  const titles = selectedCatalog.map(c => c.title);
  const chunks = [];
  for (let i = 0; i < titles.length; i += 40) {
    chunks.push(titles.slice(i, i + 40));
  }

  const responses = await Promise.all(chunks.map(async chunk => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${chunk.join('|')}&prop=pageimages&pithumbsize=600&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    return data.query?.pages ? Object.values(data.query.pages) : [];
  }));

  const pages = responses.flat();
  const nameMap = {};
  selectedCatalog.forEach(c => {
    nameMap[decodeURIComponent(c.title).replace(/_/g, ' ').toLowerCase()] = c.name;
  });

  const items = pages
    .filter(p => p.thumbnail && p.thumbnail.source)
    .map((p, index) => {
      const cleanTitle = p.title.toLowerCase();
      const displayName = nameMap[cleanTitle] || p.title;
      return {
        id: `car-${p.pageid || index}-${Date.now()}`,
        src: p.thumbnail.source,
        nome: displayName,
        tierId: null,
        colIndex: null,
        uploadIndex: Date.now() + index
      };
    });

  if (items.length === 0) {
    throw new Error('Nenhum veículo encontrado para esta pesquisa.');
  }

  return {
    title,
    cover: items[0]?.src || null,
    items,
    category: 'geral',
    sourceLabel: `Wikimedia Motors (${items.length} Veículos)`
  };
}

// 6. Motor Universal de Busca (Wikipedia Multilíngue - Para QUALQUER assunto)
export async function importUniversalWikipedia(query) {
  const cleanQ = query
    .replace(/^(filmes?\s+(da|de|do|dos|das|sobre)?\s*)/i, '')
    .replace(/^(séries?\s+(da|de|do|dos|das|sobre)?\s*)/i, '')
    .replace(/^(jogadores?\s+(da|de|do|dos|das|sobre)?\s*)/i, '')
    .replace(/^(personagens?\s+(da|de|do|dos|das|sobre)?\s*)/i, '')
    .replace(/^(raças?\s+(da|de|do|dos|das|sobre)?\s*)/i, '')
    .replace(/^(consoles?\s+(da|de|do|dos|das|sobre)?\s*)/i, '')
    .replace(/^(países?\s+(da|de|do|dos|das|sobre)?\s*)/i, '')
    .replace(/^(marcas?\s+(da|de|do|dos|das|sobre)?\s*)/i, '')
    .trim();

  const queries = [query, cleanQ].filter((v, i, a) => a.indexOf(v) === i);
  const isPt = /[áàâãéèêíïóôõöúçñ]/i.test(query) || 
    ['filme', 'jogo', 'personagen', 'carro', 'raca', 'raça', 'pais', 'país', 'cantor', 'ator', 'anime', 'desenho', 'serie', 'série', 'heroi', 'herói', 'vila', 'vilão', 'dinossauro', 'futebol', 'marca'].some(w => query.toLowerCase().includes(w));
  const langs = isPt ? ['pt', 'en'] : ['en', 'pt'];

  for (const q of queries) {
    for (const lang of langs) {
      try {
        const url = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=50&prop=pageimages&pithumbsize=600&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        const pages = Object.values(data.query?.pages || {})
          .filter(p => p.thumbnail?.source && !p.title.startsWith('Ficheiro:') && !p.title.startsWith('File:'));

        if (pages.length >= 3) {
          const items = pages.map((p, index) => ({
            id: `wiki-${p.pageid || index}-${Date.now()}`,
            src: p.thumbnail.source,
            nome: p.title,
            tierId: null,
            colIndex: null,
            uploadIndex: Date.now() + index
          }));

          return {
            title: query.charAt(0).toUpperCase() + query.slice(1),
            cover: items[0]?.src || null,
            items,
            category: 'geral',
            sourceLabel: `Wikipedia Universal (${items.length} Itens)`
          };
        }
      } catch (e) {
        // continua tentando outros idiomas
      }
    }
  }

  throw new Error(`Não encontramos resultados para "${query}". Tente buscar com outras palavras-chave.`);
}

// Despachante Principal de Busca Automática (Universal)
export async function autoImport(input, categoryMode = 'auto') {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Por favor, informe o termo ou link para buscar.');

  if (categoryMode === 'anime') {
    return await importAnimeCharacters(trimmed);
  }
  if (categoryMode === 'games') {
    try {
      return await importGameCharacters(trimmed);
    } catch {
      return await importUniversalWikipedia(trimmed);
    }
  }
  if (categoryMode === 'music') {
    return await importMusic(trimmed);
  }
  if (categoryMode === 'movies') {
    try {
      return await importTVSeries(trimmed);
    } catch {
      return await importUniversalWikipedia(trimmed);
    }
  }

  // MODO UNIVERSAL (AUTO-DETECTAR E CASCATA INTELIGENTE)
  const lower = trimmed.toLowerCase();

  // 1. Carros & Hipercarros
  if (lower.includes('carro') || lower.includes('car') || lower.includes('hypercar') || lower.includes('supercar') || lower.includes('hipercarro') || lower.includes('supercarro') || lower.includes('ferrari') || lower.includes('porsche') || lower.includes('lamborghini') || lower.includes('bugatti') || lower.includes('mclaren') || lower.includes('koenigsegg') || lower.includes('pagani') || lower.includes('aston martin')) {
    try {
      return await importCars(trimmed);
    } catch {}
  }

  // 2. Jogos Específicos
  if (lower.includes('lol') || lower.includes('league') || lower.includes('brawl') || lower.includes('genshin') || lower.includes('lunaris') || lower.includes('charlist') || lower.includes('pokemon') || lower.includes('pokémon') || lower.includes('honkai') || lower.includes('star rail') || lower.includes('hsr') || lower.includes('nanoka')) {
    try {
      return await importGameCharacters(trimmed);
    } catch {}
  }

  // 3. Links do AniList
  if (/anilist\.co/i.test(trimmed)) {
    return await importAnimeCharacters(trimmed);
  }

  // 4. Links de Música
  if (/spotify\.com|music\.apple\.com|last\.fm/i.test(trimmed)) {
    return await importMusic(trimmed);
  }

  // 5. Tentativa com Anime (AniList)
  try {
    const animeRes = await importAnimeCharacters(trimmed);
    if (animeRes && animeRes.items?.length > 0) return animeRes;
  } catch {}

  // 6. Tentativa com Séries & Elencos (TVMaze)
  try {
    const tvRes = await importTVSeries(trimmed);
    if (tvRes && tvRes.items?.length >= 3) return tvRes;
  } catch {}

  // 7. Tentativa com Música & Álbuns (Last.fm HD)
  try {
    const musicRes = await importMusic(trimmed);
    if (musicRes && musicRes.items?.length >= 3) return musicRes;
  } catch {}

  // 8. Tentativa com Carros
  try {
    const carRes = await importCars(trimmed);
    if (carRes && carRes.items?.length > 0) return carRes;
  } catch {}

  // 9. CASCATA FINAL: MOTOR UNIVERSAL DA WIKIPEDIA (Para qualquer outro tema)
  return await importUniversalWikipedia(trimmed);
}

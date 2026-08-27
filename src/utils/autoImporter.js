/**
 * Utilitário de Importação Automática Inteligente do Ametist
 * Suporta:
 * 1. Animes & Mangás (AniList GraphQL Oficial)
 * 2. Jogos (League of Legends, Brawl Stars, Genshin Impact, Pokémon)
 * 3. Músicas & Discografia (Apple Music / iTunes HD API)
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
    sourceLabel: 'AniList (Anime)'
  };
}

export async function importMusic(queryOrUrl, entity = 'album') {
  let cleanQuery = queryOrUrl.trim();
  cleanQuery = cleanQuery.replace(/https?:\/\/(open\.spotify\.com|music\.apple\.com)\/[^\s]+/i, '').trim() || cleanQuery;

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=${entity}&limit=50`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`Nenhum(a) ${entity === 'album' ? 'álbum' : 'música'} encontrado(a) para "${cleanQuery}".`);
  }

  const seen = new Set();
  const items = [];

  for (let i = 0; i < data.results.length; i++) {
    const item = data.results[i];
    const name = entity === 'album' ? item.collectionName : item.trackName;
    const rawArtwork = item.artworkUrl100 || item.artworkUrl60;
    const src = rawArtwork ? rawArtwork.replace('100x100bb', '600x600bb') : null;

    if (name && src && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      items.push({
        id: `music-${entity}-${item.collectionId || item.trackId || i}-${Date.now()}`,
        src,
        nome: name,
        tierId: null,
        colIndex: null,
        uploadIndex: Date.now() + i
      });
    }
  }

  const first = data.results[0];
  const title = entity === 'album' 
    ? `Discografia - ${first.artistName}` 
    : `Melhores Músicas - ${first.artistName}`;
  const cover = items[0]?.src || null;

  return {
    title,
    cover,
    items,
    category: 'musica',
    sourceLabel: 'Apple Music (Discografia)'
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
      sourceLabel: 'Riot Games (Data Dragon)'
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
      sourceLabel: 'Brawl Stars API'
    };
  }

  // 3. Genshin Impact (API Lunaris Oficial com Auto-Update Dinâmico)
  if (q.includes('genshin') || q.includes('genshin impact') || q.includes('lunaris') || q.includes('amber') || q.includes('charlist.json')) {
    try {
      let charlistUrl = '';

      // Se o usuário colou uma URL direta do Lunaris:
      if (query.includes('api.lunaris.moe/data/')) {
        charlistUrl = query.trim();
      } else {
        // Busca a versão mais recente dinamicamente (ex: 7.0.52.2) para nunca ficar desatualizado
        try {
          const versionRes = await fetch('https://api.lunaris.moe/data/version.json');
          if (versionRes.ok) {
            const { version } = await versionRes.json();
            charlistUrl = `https://api.lunaris.moe/data/${version}/charlist.json`;
          }
        } catch (verErr) {
          console.warn('Erro ao obter versão mais recente do Lunaris:', verErr);
        }
        if (!charlistUrl) {
          charlistUrl = 'https://api.lunaris.moe/data/7.0.52.2/charlist.json';
        }
      }

      const lunarisRes = await fetch(charlistUrl);
      if (lunarisRes.ok) {
        const charData = await lunarisRes.json();
        const items = Object.entries(charData)
          .filter(([id, c]) => c && c.CardImg && (c.ptName || c.enName))
          .map(([id, c], i) => ({
            id: `genshin-${id}-${Date.now()}`,
            src: `https://lunaris.moe/assets/UI/${c.CardImg}.png`,
            nome: c.ptName || c.enName,
            tierId: null,
            colIndex: null,
            uploadIndex: Date.now() + i
          }));

        if (items.length > 0) {
          return {
            title: 'Genshin Impact - Todos os Personagens',
            cover: 'https://lunaris.moe/assets/UI/UI_Gacha_AvatarImg_Furina.png',
            items,
            category: 'games',
            sourceLabel: `API Lunaris (${items.length} Personagens)`
          };
        }
      }
    } catch (errLunaris) {
      console.warn('Fallback para API secundária de Genshin:', errLunaris);
    }

    // Fallback 1: Project Amber (gi.yatta.moe)
    try {
      const yattaRes = await fetch('https://gi.yatta.moe/api/v2/pt/avatar');
      const yattaData = await yattaRes.json();
      const rawList = Object.values(yattaData?.data?.items || {});

      if (rawList.length > 0) {
        const items = rawList.map((c, i) => ({
          id: `genshin-${c.id || i}-${Date.now()}`,
          src: `https://gi.yatta.moe/assets/UI/${c.icon}.png`,
          nome: c.name,
          tierId: null,
          colIndex: null,
          uploadIndex: Date.now() + i
        })).filter(it => Boolean(it.src && it.nome));

        return {
          title: 'Genshin Impact - Todos os Personagens',
          cover: 'https://gi.yatta.moe/assets/UI/UI_Gacha_AvatarImg_Furina.png',
          items,
          category: 'games',
          sourceLabel: 'Project Amber (134+ Personagens)'
        };
      }
    } catch (e) {
      console.warn('Fallback para genshin.jmp.blue:', e);
    }

    // Fallback 2: genshin.jmp.blue
    const genshinRes = await fetch('https://genshin.jmp.blue/characters');
    const characters = await genshinRes.json();

    const items = characters.map((slug, i) => ({
      id: `genshin-${slug}-${Date.now()}`,
      src: `https://genshin.jmp.blue/characters/${slug}/icon-big`,
      nome: slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      tierId: null,
      colIndex: null,
      uploadIndex: Date.now() + i
    }));

    return {
      title: 'Genshin Impact - Personagens',
      cover: items[0]?.src || null,
      items,
      category: 'games',
      sourceLabel: 'Genshin Impact Data'
    };
  }

  // 4. Honkai: Star Rail (API Nanoka Oficial - hsr.nanoka.cc)
  if (q.includes('honkai') || q.includes('star rail') || q.includes('hsr') || q.includes('nanoka')) {
    try {
      let version = '4.4.55';
      try {
        const pageRes = await fetch('https://hsr.nanoka.cc/character', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const match = html.match(/https:\/\/static\.nanoka\.cc\/hsr\/([\d.]+)\/character\.json/);
          if (match && match[1]) version = match[1];
        }
      } catch (errVer) {
        console.warn('Erro ao consultar versão do Nanoka:', errVer);
      }

      const hsrRes = await fetch(`https://static.nanoka.cc/hsr/${version}/character.json`);
      if (hsrRes.ok) {
        const hsrData = await hsrRes.json();
        const elementMap = {
          Physical: 'Físico',
          Fire: 'Fogo',
          Ice: 'Gelo',
          Thunder: 'Raio',
          Wind: 'Vento',
          Quantum: 'Quântico',
          Imaginary: 'Imaginário'
        };

        const items = Object.entries(hsrData)
          .filter(([id, c]) => Boolean(c && (c.en || c.name)))
          .map(([id, c], i) => {
            let name = c.en || c.name || `Personagem ${id}`;
            if (name === '{NICKNAME}' || id.startsWith('800')) {
              const elem = elementMap[c.damageType] || c.damageType || 'Físico';
              const gender = id.endsWith('1') || id.endsWith('3') || id.endsWith('5') || id.endsWith('7') || id.endsWith('9') ? 'M' : 'F';
              name = `Desbravador (${elem}) [${gender}]`;
            }

            return {
              id: `hsr-${id}-${Date.now()}`,
              src: `https://static.nanoka.cc/assets/hsr/avatarshopicon/${id}.webp`,
              nome: name,
              tierId: null,
              colIndex: null,
              uploadIndex: Date.now() + i
            };
          });

        if (items.length > 0) {
          return {
            title: 'Honkai: Star Rail - Todos os Personagens',
            cover: 'https://static.nanoka.cc/assets/hsr/avatardrawcard/1308.webp', // Acheron
            items,
            category: 'games',
            sourceLabel: `Nanoka HSR (${items.length} Personagens)`
          };
        }
      }
    } catch (errNanoka) {
      console.warn('Fallback para StarRailRes:', errNanoka);
    }

    // Fallback: StarRailRes
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
      sourceLabel: 'StarRailRes'
    };
  }

  // 4. Pokémon (Kanto Gen 1 padrão ou todas)
  if (q.includes('pokemon') || q.includes('pokémon')) {
    let limit = 151;
    let title = 'Pokémon - 1ª Geração (Kanto)';
    if (q.includes('gen 2') || q.includes('johto')) { limit = 251; title = 'Pokémon - 1ª e 2ª Geração'; }
    else if (q.includes('all') || q.includes('todos')) { limit = 386; title = 'Pokémon - Clássicos'; }

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
      sourceLabel: 'PokeAPI'
    };
  }

  throw new Error(`Jogo "${query}" não possui base de dados direta. Tente: LoL, Brawl Stars, Genshin Impact ou Pokémon.`);
}

// 4. Carros & Hipercarros (Wikimedia HD API)
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
    const url = 'https://en.wikipedia.org/w/api.php?action=query&titles=' + chunk.join('|') + '&prop=pageimages&pithumbsize=600&format=json&origin=*';
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
        id: 'car-' + p.pageid + '-' + Date.now(),
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
    sourceLabel: `Wikipedia Motors (${items.length} Veículos)`
  };
}

export async function autoImport(input, categoryMode = 'auto') {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Por favor, informe o termo ou link para buscar.');

  // Modo específico de Jogos
  if (categoryMode === 'games') {
    return await importGameCharacters(trimmed);
  }

  // Modo específico de Músicas
  if (categoryMode === 'music') {
    return await importMusic(trimmed, 'album');
  }

  // Modo específico de Animes
  if (categoryMode === 'anime') {
    return await importAnimeCharacters(trimmed);
  }

  // MODO INTELIGENTE (Auto Detectar)
  const lower = trimmed.toLowerCase();

  // 1. Detecção de Carros & Hipercarros
  if (lower.includes('carro') || lower.includes('car') || lower.includes('hypercar') || lower.includes('supercar') || lower.includes('hipercarro') || lower.includes('supercarro') || lower.includes('ferrari') || lower.includes('porsche') || lower.includes('lamborghini') || lower.includes('bugatti') || lower.includes('mclaren') || lower.includes('koenigsegg') || lower.includes('pagani') || lower.includes('aston martin') || lower.includes('veiculo') || lower.includes('veículo')) {
    try {
      return await importCars(trimmed);
    } catch {
      // continua para outros
    }
  }

  // 2. Detecção direta de Jogos populares ou URLs de API
  if (lower.includes('lol') || lower.includes('league') || lower.includes('brawl') || lower.includes('genshin') || lower.includes('lunaris') || lower.includes('charlist') || lower.includes('pokemon') || lower.includes('pokémon') || lower.includes('honkai') || lower.includes('star rail') || lower.includes('hsr') || lower.includes('nanoka')) {
    try {
      return await importGameCharacters(trimmed);
    } catch {
      // continua para outros
    }
  }

  // 3. Detecção de Anime / AniList URL
  if (/anilist\.co/i.test(trimmed)) {
    return await importAnimeCharacters(trimmed);
  }

  // 4. Tenta Anime primeiro
  try {
    return await importAnimeCharacters(trimmed);
  } catch (errAnime) {
    // 5. Se falhar, tenta Música
    try {
      return await importMusic(trimmed, 'album');
    } catch (errMusic) {
      // 6. Se falhar, tenta Jogos
      try {
        return await importGameCharacters(trimmed);
      } catch {
        // 7. Se falhar, tenta Carros
        try {
          return await importCars(trimmed);
        } catch {
          throw new Error(`Não encontramos resultados para "${trimmed}". Tente o nome de um Anime (ex: Naruto), Jogo (ex: LoL, Genshin), Carros (ex: Hipercarros, Ferrari, Porsche) ou Artista (ex: The Weeknd).`);
        }
      }
    }
  }
}

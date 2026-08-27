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

  // 4. Honkai: Star Rail
  if (q.includes('honkai') || q.includes('star rail') || q.includes('hsr')) {
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

  // 1. Detecção direta de Jogos populares ou URLs de API
  if (lower.includes('lol') || lower.includes('league') || lower.includes('brawl') || lower.includes('genshin') || lower.includes('lunaris') || lower.includes('charlist') || lower.includes('pokemon') || lower.includes('pokémon') || lower.includes('star rail') || lower.includes('hsr')) {
    try {
      return await importGameCharacters(trimmed);
    } catch {
      // continua para outros
    }
  }

  // 2. Detecção de Anime / AniList URL
  if (/anilist\.co/i.test(trimmed)) {
    return await importAnimeCharacters(trimmed);
  }

  // 3. Tenta Anime primeiro
  try {
    return await importAnimeCharacters(trimmed);
  } catch (errAnime) {
    // 4. Se falhar, tenta Música
    try {
      return await importMusic(trimmed, 'album');
    } catch (errMusic) {
      // 5. Se falhar, tenta Jogos
      try {
        return await importGameCharacters(trimmed);
      } catch {
        throw new Error(`Não encontramos resultados para "${trimmed}". Tente o nome de um Anime (ex: Naruto), Jogo (ex: LoL, Genshin, Brawl Stars) ou Artista (ex: The Weeknd).`);
      }
    }
  }
}

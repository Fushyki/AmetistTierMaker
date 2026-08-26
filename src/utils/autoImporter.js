/**
 * Utilitário de Importação Automática Inteligente
 * Suporta:
 * 1. AniList (Animes, Mangás, Personagens) via GraphQL oficial gratuito
 * 2. Discografia e Músicas (Álbuns e Faixas) via Apple/iTunes Open Search API
 */

export async function importAnimeCharacters(queryOrUrl) {
  let search = queryOrUrl.trim();
  let animeId = null;

  // Se for uma URL do AniList (ex: https://anilist.co/anime/113415/...)
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
        characters (page: 1, perPage: 50, sort: [ROLE, RELEVANCE]) {
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
    throw new Error(json.errors[0].message || 'Anime não encontrado no AniList.');
  }

  const media = json.data?.Media;
  if (!media) throw new Error('Nenhum resultado encontrado para este anime.');

  const characters = media.characters?.nodes || [];
  if (characters.length === 0) {
    throw new Error('Nenhum personagem encontrado para este anime.');
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
    category: 'animes'
  };
}

export async function importMusic(queryOrUrl, entity = 'album') {
  let cleanQuery = queryOrUrl.trim();

  // Limpeza caso o usuário cole link do Spotify ou Apple Music
  cleanQuery = cleanQuery.replace(/https?:\/\/(open\.spotify\.com|music\.apple\.com)\/[^\s]+/i, '').trim() || cleanQuery;

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=${entity}&limit=50`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`Nenhum(a) ${entity === 'album' ? 'álbum' : 'música'} encontrado(a).`);
  }

  // Filtrar e padronizar
  const seen = new Set();
  const items = [];

  for (let i = 0; i < data.results.length; i++) {
    const item = data.results[i];
    const name = entity === 'album' ? item.collectionName : item.trackName;
    const rawArtwork = item.artworkUrl100 || item.artworkUrl60;
    
    // Obter arte em alta definição (600x600)
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
    category: 'musica'
  };
}

/**
 * Detector automático que identifica o melhor importador
 */
export async function autoImport(input) {
  const trimmed = input.trim();
  if (/anilist\.co|anime|manga/i.test(trimmed)) {
    return await importAnimeCharacters(trimmed);
  }
  
  // Tentar primeiro por Anime
  try {
    return await importAnimeCharacters(trimmed);
  } catch (errAnime) {
    // Se falhar, tentar música
    try {
      return await importMusic(trimmed, 'album');
    } catch {
      throw new Error(`Não conseguimos identificar nada com "${trimmed}". Tente o nome exato de um Anime ou Artista Musical.`);
    }
  }
}

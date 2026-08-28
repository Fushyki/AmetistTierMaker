import LZString from 'lz-string';

/**
 * Utilitário para geração e leitura de Links Compartilháveis de Tier Lists
 * Utiliza compressão LZString URL-safe para links universais, autossuficientes e instantâneos.
 */

// Gera o link compartilhável completo e autossuficiente com o estado da Tier List
export async function generateShareableLink({
  tierlistName,
  items,
  ranksData,
  layoutMode,
  colunas,
  columnTitles,
  theme
}) {
  const origin = window.location.origin;

  try {
    // 1. Prepara o payload enxuto e estritamente serializável
    const compactPayload = {
      n: tierlistName || 'Minha Tier List',
      r: ranksData || [],
      i: (items || []).map((item, idx) => ({
        id: item.id || `item-${idx}`,
        src: item.src || '',
        nome: item.nome || item.name || '',
        tierId: item.tierId ?? null,
        colIndex: item.colIndex ?? null
      })),
      l: layoutMode || 'classico',
      c: colunas || 1,
      ct: columnTitles || [],
      t: theme || 'ametist',
      ts: Date.now()
    };

    // 2. Comprime em string URI-Safe
    const jsonStr = JSON.stringify(compactPayload);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);

    return {
      url: `${origin}/tierlist?share=${compressed}`,
      isCloud: false
    };
  } catch (err) {
    console.error('Erro ao gerar link compartilhável comprimido:', err);
    return {
      url: window.location.href,
      isCloud: false
    };
  }
}

// Decodifica um link compartilhado que veio pela URL (?share=...)
export function decodeSharedTierlist(shareParam) {
  if (!shareParam) return null;
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(shareParam);
    if (!jsonStr) {
      // Fallback para caso tenha sido passado como JSON decodificado ou URI encoded
      try {
        const rawJson = decodeURIComponent(shareParam);
        const rawData = JSON.parse(rawJson);
        if (rawData && (rawData.r || rawData.ranksData)) {
          return normalizeSharedData(rawData);
        }
      } catch {
        return null;
      }
      return null;
    }

    const data = JSON.parse(jsonStr);
    return normalizeSharedData(data);
  } catch (err) {
    console.error('Erro ao decodificar Tier List compartilhada:', err);
    return null;
  }
}

function normalizeSharedData(data) {
  const ranks = data.r || data.ranksData || [];
  const rawItems = data.i || data.items || [];

  const items = rawItems.map((item, idx) => ({
    id: item.id || `shared-${idx}-${Date.now()}`,
    src: item.src || '',
    nome: item.nome || item.name || '',
    tierId: item.tierId ?? null,
    colIndex: item.colIndex ?? null,
    uploadIndex: Date.now() + idx
  })).filter(it => Boolean(it.src));

  return {
    tierlistName: data.n || data.tierlistName || 'Tier List Compartilhada',
    ranksData: ranks,
    items,
    layoutMode: data.l || data.layoutMode || 'classico',
    colunas: data.c || data.colunas || 1,
    columnTitles: data.ct || data.columnTitles || [],
    theme: data.t || data.theme || 'ametist'
  };
}

import LZString from 'lz-string';
import { supabase } from '../services/supabaseClient';

/**
 * Utilitário para geração e leitura de Links Compartilháveis de Tier Lists
 * Suporta Links Curtos em Nuvem (ideais para Discord/WhatsApp) e Fallback Comprimido LZ-String.
 */

// Gera o link compartilhável completo com o estado da Tier List
export async function generateShareableLink({
  tierlistName,
  items,
  ranksData,
  layoutMode,
  colunas,
  columnTitles,
  theme,
  user
}) {
  const origin = window.location.origin;

  // 1. Se o usuário estiver logado, cria um link curto público na nuvem (evita limite de 2000 chars do Discord)
  if (user && user.id) {
    try {
      const fullData = {
        type: 'shared_tierlist',
        tierlistName: tierlistName || 'Tier List Compartilhada',
        items: items || [],
        ranksData: ranksData || [],
        layoutMode: layoutMode || 'classico',
        colunas: colunas || 1,
        columnTitles: columnTitles || [],
        theme: theme || 'ametist',
        createdAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('templates')
        .insert([{
          user_id: user.id,
          name: `__SHARED__:${(tierlistName || 'Tierlist').slice(0, 35)}`,
          is_public: true,
          cover_image: items && items[0]?.src ? items[0].src : '',
          data: fullData
        }])
        .select('id')
        .single();

      if (!error && data && data.id) {
        return {
          url: `${origin}/tierlist?id=${data.id}`,
          isCloud: true
        };
      }
    } catch (e) {
      console.warn('Fallback para link comprimido local:', e);
    }
  }

  // 2. Fallback Instantâneo Comprimido (funciona sem login e offline)
  try {
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
      t: theme || 'ametist'
    };

    const jsonStr = JSON.stringify(compactPayload);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);

    return {
      url: `${origin}/tierlist?share=${compressed}`,
      isCloud: false
    };
  } catch (err) {
    console.error('Erro ao gerar link comprimido:', err);
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

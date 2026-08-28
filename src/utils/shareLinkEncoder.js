import LZString from 'lz-string';
import { supabase } from '../services/supabaseClient';

/**
 * Utilitário para geração e leitura de Links Compartilháveis de Tier Lists
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

  // 1. Prepara o payload enxuto e otimizado
  const compactPayload = {
    n: tierlistName || 'Minha Tier List',
    r: ranksData,
    i: (items || []).map(item => ({
      id: item.id,
      src: item.src,
      nome: item.nome || item.name || '',
      tierId: item.tierId,
      colIndex: item.colIndex
    })),
    l: layoutMode || 'classico',
    c: colunas || 1,
    ct: columnTitles || [],
    t: theme || 'ametist'
  };

  // 2. Se o usuário estiver logado, tenta salvar na nuvem para gerar link curto limpo
  if (user) {
    try {
      const fullData = {
        items: items || [],
        ranksData: ranksData || [],
        layoutMode: layoutMode || 'classico',
        colunas: colunas || 1,
        columnTitles: columnTitles || [],
        theme: theme || 'ametist'
      };

      const currentId = localStorage.getItem('tierlist-current-id');
      if (currentId) {
        await supabase.from('tierlists').update({ name: tierlistName || 'Minha Tier List', data: fullData, updated_at: new Date() }).eq('id', currentId);
        return {
          url: `${origin}/tierlist?id=${currentId}`,
          isCloud: true
        };
      } else {
        const { data, error } = await supabase
          .from('tierlists')
          .insert([{ user_id: user.id, name: tierlistName || 'Minha Tier List', data: fullData }])
          .select()
          .single();

        if (!error && data) {
          localStorage.setItem('tierlist-current-id', data.id);
          return {
            url: `${origin}/tierlist?id=${data.id}`,
            isCloud: true
          };
        }
      }
    } catch (e) {
      console.warn('Erro ao salvar na nuvem para link compartilhado, usando link instantâneo comprimido:', e);
    }
  }

  // 3. Fallback Instantâneo Comprimido (funciona 100% offline, para visitantes e sem login)
  try {
    const jsonStr = JSON.stringify(compactPayload);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    return {
      url: `${origin}/tierlist?share=${compressed}`,
      isCloud: false
    };
  } catch (err) {
    console.error('Erro ao comprimir tier list:', err);
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
    if (!jsonStr) return null;
    const data = JSON.parse(jsonStr);

    return {
      tierlistName: data.n || 'Tier List Compartilhada',
      ranksData: data.r || [],
      items: (data.i || []).map(item => ({
        id: item.id,
        src: item.src,
        nome: item.nome || '',
        tierId: item.tierId,
        colIndex: item.colIndex
      })),
      layoutMode: data.l || 'classico',
      colunas: data.c || 1,
      columnTitles: data.ct || [],
      theme: data.t || 'ametist'
    };
  } catch (err) {
    console.error('Erro ao decodificar Tier List compartilhada:', err);
    return null;
  }
}

import { supabase } from '../services/supabaseClient';

/**
 * Gerenciador de Curtidas e Favoritos de Modelos
 * Sincroniza estado local com Supabase
 */

// Retorna os IDs dos templates curtidos pelo usuário
export function getUserLikedTemplateIds(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`ametist_user_likes_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Verifica se um template específico está curtido
export function isTemplateLiked(templateId, userId) {
  if (!templateId || !userId) return false;
  const likes = getUserLikedTemplateIds(userId);
  return likes.includes(templateId);
}

// Alterna a curtida (curtir / descurtir)
export async function toggleTemplateLike(template, user) {
  if (!user || !user.id) {
    return { success: false, requireLogin: true };
  }

  const userId = user.id;
  const templateId = template.id;
  const currentLikes = getUserLikedTemplateIds(userId);
  const isCurrentlyLiked = currentLikes.includes(templateId);

  let newLikes;
  let newCount = template.data?.likes_count || 0;

  if (isCurrentlyLiked) {
    newLikes = currentLikes.filter(id => id !== templateId);
    newCount = Math.max(0, newCount - 1);
  } else {
    newLikes = [...currentLikes, templateId];
    newCount = newCount + 1;
  }

  // Salva localmente para resposta instantânea
  localStorage.setItem(`ametist_user_likes_${userId}`, JSON.stringify(newLikes));

  // Dispara evento para sincronizar cards na tela
  window.dispatchEvent(new CustomEvent('ametist-likes-updated', {
    detail: { templateId, isLiked: !isCurrentlyLiked, likesCount: newCount }
  }));

  // Atualiza no Supabase em segundo plano
  try {
    const updatedData = {
      ...(template.data || {}),
      likes_count: newCount
    };

    await supabase
      .from('templates')
      .update({ data: updatedData })
      .eq('id', templateId);
  } catch (err) {
    console.warn('Erro ao atualizar curtida no Supabase:', err);
  }

  return {
    success: true,
    isLiked: !isCurrentlyLiked,
    likesCount: newCount
  };
}

// Retorna o histórico de campeões de duelo salvos do usuário
export function getUserChampions(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`ametist_user_champions_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Salva um novo campeão de torneio no perfil
export function saveUserChampion(userId, championData) {
  if (!userId || !championData || !championData.champion) return;
  try {
    const list = getUserChampions(userId);
    const entry = {
      id: `champ-${Date.now()}`,
      championName: championData.champion.nome || championData.champion.name,
      championImage: championData.champion.src || championData.champion.image,
      templateName: championData.templateName || 'Torneio',
      templateId: championData.templateId || null,
      date: new Date().toISOString(),
      bracketSize: championData.bracketSize || 16
    };

    const updated = [entry, ...list.slice(0, 49)]; // Guarda até os 50 campeões mais recentes
    localStorage.setItem(`ametist_user_champions_${userId}`, JSON.stringify(updated));
    
    window.dispatchEvent(new CustomEvent('ametist-champions-updated'));
  } catch (e) {
    console.error('Erro ao salvar campeão no perfil:', e);
  }
}

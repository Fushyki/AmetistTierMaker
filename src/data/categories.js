export const TEMPLATE_CATEGORIES = [
  { id: 'todos', label: 'Todos', icon: '🌟' },
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'animes', label: 'Animes', icon: '⛩️' },
  { id: 'filmes', label: 'Filmes & Séries', icon: '🎬' },
  { id: 'musica', label: 'Música', icon: '🎵' },
  { id: 'esportes', label: 'Esportes', icon: '⚽' },
  { id: 'geral', label: 'Geral & Memes', icon: '🍔' }
];

export const getCategoryBadge = (categoryId) => {
  const cat = TEMPLATE_CATEGORIES.find(c => c.id === categoryId);
  return cat ? `${cat.icon} ${cat.label}` : '🍔 Geral';
};

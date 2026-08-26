export const TEMPLATE_CATEGORIES = [
  { id: 'todos', label: 'Todos', iconName: 'LayoutGrid', color: '#b062eb' },
  { id: 'games', label: 'Games', iconName: 'Gamepad2', color: '#38bdf8' },
  { id: 'animes', label: 'Animes', iconName: 'Flame', color: '#fb7185' },
  { id: 'filmes', label: 'Filmes & Séries', iconName: 'Film', color: '#fbbf24' },
  { id: 'musica', label: 'Música', iconName: 'Music', color: '#c084fc' },
  { id: 'esportes', label: 'Esportes', iconName: 'Trophy', color: '#34d399' },
  { id: 'geral', label: 'Geral & Variados', iconName: 'Shapes', color: '#94a3b8' }
];

export const getCategoryData = (categoryId) => {
  return TEMPLATE_CATEGORIES.find(c => c.id === categoryId) || {
    id: 'geral',
    label: 'Geral',
    iconName: 'Shapes',
    color: '#94a3b8'
  };
};

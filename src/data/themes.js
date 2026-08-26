export const BOARD_THEMES = [
  {
    id: 'ametist',
    name: 'Ametista Neon',
    accentColor: '#b062eb',
    gradient: 'linear-gradient(135deg, #b062eb, #7928ca)',
    description: 'Tema padrão com bordas e brilho roxo ametista'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    accentColor: '#00ffcc',
    gradient: 'linear-gradient(135deg, #ff0055, #00ffcc)',
    description: 'Ciano neon com toques de magenta futurista'
  },
  {
    id: 'gold',
    name: 'Gold Edition',
    accentColor: '#ffd700',
    gradient: 'linear-gradient(135deg, #ffd700, #b8860b)',
    description: 'Preto carbono com detalhes e brilho dourado'
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    accentColor: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #047857)',
    description: 'Verde esmeralda com contraste moderno'
  },
  {
    id: 'pastel',
    name: 'Anime Pastel',
    accentColor: '#f472b6',
    gradient: 'linear-gradient(135deg, #f472b6, #c084fc)',
    description: 'Tons suaves rosa e lilás'
  },
  {
    id: 'monochrome',
    name: 'Midnight Clean',
    accentColor: '#e2e8f0',
    gradient: 'linear-gradient(135deg, #64748b, #334155)',
    description: 'Minimalista preto e branco'
  }
];

export const getThemeById = (themeId) => {
  return BOARD_THEMES.find(t => t.id === themeId) || BOARD_THEMES[0];
};

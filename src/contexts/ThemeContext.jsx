import React, { createContext, useContext, useState, useEffect } from 'react';
import { BOARD_THEMES, getThemeById } from '../data/themes';
import { notify } from '../utils/notifications';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [siteTheme, setSiteThemeState] = useState(() => {
    return localStorage.getItem('ametist-site-theme') || 'ametist';
  });

  const [uiDensity, setUiDensityState] = useState(() => {
    return localStorage.getItem('ametist-ui-density') || 'compact';
  });

  const showCustomToast = (title, message, iconType = 'palette') => {
    notify.custom(title, message, iconType);
  };

  const setSiteTheme = (newTheme) => {
    setSiteThemeState(newTheme);
    localStorage.setItem('ametist-site-theme', newTheme);
    localStorage.setItem('tierlist-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.className = `theme-${newTheme}`;
    
    const themeObj = getThemeById(newTheme);
    notify.custom('Tema Atualizado', `Visual "${themeObj.name}" aplicado no site e no tabuleiro.`, 'palette');
  };

  const setUiDensity = (newDensity) => {
    setUiDensityState(newDensity);
    localStorage.setItem('ametist-ui-density', newDensity);
    document.documentElement.setAttribute('data-density', newDensity);
    
    const label = newDensity === 'compact' ? 'Compacto (100% Nativo)' : 'Confortável (Espaçado)';
    notify.custom('Escala Ajustada', `Densidade visual "${label}" ativada.`, 'sliders');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', siteTheme);
    document.body.className = `theme-${siteTheme}`;
  }, [siteTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', uiDensity);
  }, [uiDensity]);

  const activeTheme = getThemeById(siteTheme);

  return (
    <ThemeContext.Provider value={{ 
      siteTheme, 
      setSiteTheme, 
      activeTheme, 
      uiDensity, 
      setUiDensity,
      availableThemes: BOARD_THEMES,
      showCustomToast
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      siteTheme: 'ametist',
      setSiteTheme: () => {},
      activeTheme: BOARD_THEMES[0],
      uiDensity: 'compact',
      setUiDensity: () => {},
      availableThemes: BOARD_THEMES,
      showCustomToast: () => {}
    };
  }
  return context;
}

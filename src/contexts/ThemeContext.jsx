import React, { createContext, useContext, useState, useEffect } from 'react';
import { BOARD_THEMES, getThemeById } from '../data/themes';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [siteTheme, setSiteTheme] = useState(() => {
    return localStorage.getItem('ametist-site-theme') || 'ametist';
  });

  const [uiDensity, setUiDensity] = useState(() => {
    return localStorage.getItem('ametist-ui-density') || 'compact';
  });

  useEffect(() => {
    localStorage.setItem('ametist-site-theme', siteTheme);
    document.documentElement.setAttribute('data-theme', siteTheme);
    document.body.className = `theme-${siteTheme}`;
  }, [siteTheme]);

  useEffect(() => {
    localStorage.setItem('ametist-ui-density', uiDensity);
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
      availableThemes: BOARD_THEMES 
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
      availableThemes: BOARD_THEMES
    };
  }
  return context;
}

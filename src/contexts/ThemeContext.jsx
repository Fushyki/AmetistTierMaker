import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BOARD_THEMES, getThemeById } from '../data/themes';
import { Palette, Sliders, X, Check } from 'lucide-react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [siteTheme, setSiteThemeState] = useState(() => {
    return localStorage.getItem('ametist-site-theme') || 'ametist';
  });

  const [uiDensity, setUiDensityState] = useState(() => {
    return localStorage.getItem('ametist-ui-density') || 'compact';
  });

  const [toastAlert, setToastAlert] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showCustomToast = (title, message, iconType = 'palette') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastAlert({ title, message, iconType, id: Date.now() });
    toastTimeoutRef.current = setTimeout(() => {
      setToastAlert(null);
    }, 2800);
  };

  const setSiteTheme = (newTheme) => {
    setSiteThemeState(newTheme);
    localStorage.setItem('ametist-site-theme', newTheme);
    localStorage.setItem('tierlist-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.className = `theme-${newTheme}`;
    
    const themeObj = getThemeById(newTheme);
    showCustomToast('Tema Atualizado', `Visual "${themeObj.name}" aplicado no site e no tabuleiro.`, 'palette');
  };

  const setUiDensity = (newDensity) => {
    setUiDensityState(newDensity);
    localStorage.setItem('ametist-ui-density', newDensity);
    document.documentElement.setAttribute('data-density', newDensity);
    
    const label = newDensity === 'compact' ? 'Compacto (100% Nativo)' : 'Confortável (Espaçado)';
    showCustomToast('Escala Ajustada', `Densidade visual "${label}" ativada.`, 'sliders');
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

      {/* POPUP PERSONALIZADO SLEEK & GLASSMORPHIC (TOP-RIGHT, NÃO BLOQUEIA A TELA) */}
      {toastAlert && (
        <div 
          style={{
            position: 'fixed',
            top: '60px',
            right: '18px',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 18px',
            borderRadius: '12px',
            backgroundColor: 'rgba(18, 18, 22, 0.94)',
            border: `1.5px solid ${activeTheme.accentColor}`,
            boxShadow: `0 12px 35px rgba(0, 0, 0, 0.85), 0 0 25px ${activeTheme.accentColor}35`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: '#ffffff',
            maxWidth: '350px',
            animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            pointerEvents: 'auto'
          }}
        >
          <div 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: `${activeTheme.accentColor}20`,
              border: `1px solid ${activeTheme.accentColor}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: activeTheme.accentColor
            }}
          >
            {toastAlert.iconType === 'palette' ? <Palette size={20} /> : <Sliders size={20} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: '700', color: activeTheme.accentColor, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Check size={14} />
              <span>{toastAlert.title}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#c8c8d5', lineHeight: '1.3' }}>
              {toastAlert.message}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setToastAlert(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'color 0.2s'
            }}
            title="Fechar aviso"
          >
            <X size={15} />
          </button>
        </div>
      )}
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

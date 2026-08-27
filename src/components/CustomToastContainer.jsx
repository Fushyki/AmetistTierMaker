import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { subscribeNotifications } from '../utils/notifications';
import { 
  Check, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Loader2, 
  Palette, 
  Sliders, 
  X,
  Sparkles
} from 'lucide-react';

export default function CustomToastContainer() {
  const { activeTheme } = useTheme();
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeNotifications((toastItem) => {
      if (toastItem.action === 'dismiss') {
        setToasts(prev => toastItem.id ? prev.filter(t => t.id !== toastItem.id) : []);
        return;
      }

      setToasts(prev => {
        const existingIdx = prev.findIndex(t => t.id === toastItem.id);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = toastItem;
          return updated;
        }
        // Limita a no máximo 4 toasts simultâneos
        const list = [...prev, toastItem];
        return list.slice(-4);
      });

      if (toastItem.duration && toastItem.duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastItem.id));
        }, toastItem.duration);
      }
    });

    return () => unsubscribe();
  }, []);

  if (toasts.length === 0) return null;

  const getStyleProps = (type) => {
    switch (type) {
      case 'success':
        return {
          accentColor: '#22c55e',
          bgBadge: 'rgba(34, 197, 94, 0.15)',
          borderBadge: 'rgba(34, 197, 94, 0.4)',
          glow: '0 8px 30px rgba(0,0,0,0.85), 0 0 20px rgba(34, 197, 94, 0.25)',
          icon: Check
        };
      case 'error':
        return {
          accentColor: '#ef4444',
          bgBadge: 'rgba(239, 68, 68, 0.15)',
          borderBadge: 'rgba(239, 68, 68, 0.4)',
          glow: '0 8px 30px rgba(0,0,0,0.85), 0 0 20px rgba(239, 68, 68, 0.25)',
          icon: AlertCircle
        };
      case 'info':
        return {
          accentColor: '#3b82f6',
          bgBadge: 'rgba(59, 130, 246, 0.15)',
          borderBadge: 'rgba(59, 130, 246, 0.4)',
          glow: '0 8px 30px rgba(0,0,0,0.85), 0 0 20px rgba(59, 130, 246, 0.25)',
          icon: Info
        };
      case 'warning':
        return {
          accentColor: '#f59e0b',
          bgBadge: 'rgba(245, 158, 11, 0.15)',
          borderBadge: 'rgba(245, 158, 11, 0.4)',
          glow: '0 8px 30px rgba(0,0,0,0.85), 0 0 20px rgba(245, 158, 11, 0.25)',
          icon: AlertTriangle
        };
      case 'loading':
        return {
          accentColor: activeTheme?.accentColor || '#b062eb',
          bgBadge: `${activeTheme?.accentColor || '#b062eb'}20`,
          borderBadge: `${activeTheme?.accentColor || '#b062eb'}55`,
          glow: `0 8px 30px rgba(0,0,0,0.85), 0 0 20px ${activeTheme?.accentColor || '#b062eb'}35`,
          icon: Loader2,
          isLoading: true
        };
      case 'sliders':
        return {
          accentColor: activeTheme?.accentColor || '#b062eb',
          bgBadge: `${activeTheme?.accentColor || '#b062eb'}20`,
          borderBadge: `${activeTheme?.accentColor || '#b062eb'}55`,
          glow: `0 8px 30px rgba(0,0,0,0.85), 0 0 20px ${activeTheme?.accentColor || '#b062eb'}35`,
          icon: Sliders
        };
      case 'palette':
      default:
        return {
          accentColor: activeTheme?.accentColor || '#b062eb',
          bgBadge: `${activeTheme?.accentColor || '#b062eb'}20`,
          borderBadge: `${activeTheme?.accentColor || '#b062eb'}55`,
          glow: `0 8px 30px rgba(0,0,0,0.85), 0 0 20px ${activeTheme?.accentColor || '#b062eb'}35`,
          icon: Palette
        };
    }
  };

  const handleDismiss = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: '68px',
        right: '18px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '380px',
        width: 'calc(100vw - 36px)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map(toast => {
        const config = getStyleProps(toast.type);
        const IconComponent = config.icon;

        return (
          <div 
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 16, 20, 0.95)',
              border: `1.5px solid ${config.accentColor}`,
              boxShadow: config.glow,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              color: '#ffffff',
              animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              pointerEvents: 'auto'
            }}
          >
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: config.bgBadge,
                border: `1px solid ${config.borderBadge}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: config.accentColor
              }}
            >
              <IconComponent size={18} className={config.isLoading ? 'animate-spin' : ''} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: '700', color: config.accentColor, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>{toast.title}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#c8c8d5', lineHeight: '1.35', wordBreak: 'break-word' }}>
                {toast.message}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDismiss(toast.id)}
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
                transition: 'color 0.2s',
                flexShrink: 0
              }}
              title="Fechar notificação"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

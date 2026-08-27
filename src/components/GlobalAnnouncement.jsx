import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Sparkles, Star, Info, AlertTriangle, X } from 'lucide-react';

export default function GlobalAnnouncement() {
  const [announcement, setAnnouncement] = useState(() => {
    try {
      const cached = localStorage.getItem('ametist_global_announcement');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('data')
          .eq('name', '__SYSTEM_ANNOUNCEMENT__')
          .maybeSingle();

        if (data && data.data) {
          setAnnouncement(data.data);
          localStorage.setItem('ametist_global_announcement', JSON.stringify(data.data));
          
          const dismissedId = localStorage.getItem('ametist_announcement_dismissed_id');
          if (dismissedId && dismissedId === data.data.updatedAt) {
            setIsDismissed(true);
          } else {
            setIsDismissed(false);
          }
        } else if (!error && !data) {
          setAnnouncement(null);
        }
      } catch (err) {
        console.error('Erro ao carregar aviso global:', err);
      }
    };

    fetchAnnouncement();
  }, []);

  if (!announcement || !announcement.active || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (announcement.updatedAt) {
      localStorage.setItem('ametist_announcement_dismissed_id', announcement.updatedAt);
    }
  };

  const getStyleProps = () => {
    switch (announcement.type) {
      case 'gold':
        return {
          bg: 'linear-gradient(90deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
          icon: Star,
          textColor: '#ffffff'
        };
      case 'info':
        return {
          bg: 'linear-gradient(90deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
          icon: Info,
          textColor: '#ffffff'
        };
      case 'warning':
        return {
          bg: 'linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #ef4444 100%)',
          icon: AlertTriangle,
          textColor: '#ffffff'
        };
      case 'purple':
      default:
        return {
          bg: 'linear-gradient(90deg, #7928ca 0%, #9333ea 50%, #b062eb 100%)',
          icon: Sparkles,
          textColor: '#ffffff'
        };
    }
  };

  const styleConfig = getStyleProps();
  const IconComponent = styleConfig.icon;

  return (
    <div 
      style={{
        background: styleConfig.bg,
        color: styleConfig.textColor,
        padding: '8px 16px',
        fontSize: '0.86rem',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
        textAlign: 'center'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1000px', paddingRight: '28px' }}>
        <IconComponent size={16} style={{ flexShrink: 0 }} />
        <span>{announcement.message}</span>
        
        {announcement.link && (
          announcement.link.startsWith('/') ? (
            <Link 
              to={announcement.link} 
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '2px 10px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '0.78rem',
                marginLeft: '4px',
                border: '1px solid rgba(255,255,255,0.4)',
                transition: 'background 0.2s'
              }}
            >
              {announcement.linkText || 'Confira aqui'} →
            </Link>
          ) : (
            <a 
              href={announcement.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '2px 10px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '0.78rem',
                marginLeft: '4px',
                border: '1px solid rgba(255,255,255,0.4)'
              }}
            >
              {announcement.linkText || 'Acessar link'} →
            </a>
          )
        )}
      </div>

      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          right: '12px',
          background: 'none',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.85
        }}
        title="Dispensar aviso"
      >
        <X size={16} />
      </button>
    </div>
  );
}

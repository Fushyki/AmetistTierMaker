import React, { useState, useEffect, useCallback } from 'react';
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

  const fetchAnnouncement = useCallback(async () => {
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
        localStorage.removeItem('ametist_global_announcement');
      }
    } catch (err) {
      console.warn('Erro ao sincronizar aviso global:', err);
    }
  }, []);

  useEffect(() => {
    // 1. Busca inicial imediata
    fetchAnnouncement();

    // 2. Inscrição em Tempo Real (Supabase Realtime)
    const channel = supabase
      .channel('ametist-live-announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'templates',
          filter: 'name=eq.__SYSTEM_ANNOUNCEMENT__'
        },
        (payload) => {
          if (payload.new && payload.new.data) {
            const newData = payload.new.data;
            setAnnouncement(newData);
            localStorage.setItem('ametist_global_announcement', JSON.stringify(newData));
            setIsDismissed(false);
          } else if (payload.eventType === 'DELETE') {
            setAnnouncement(null);
            localStorage.removeItem('ametist_global_announcement');
          }
        }
      )
      .subscribe();

    // 3. Polling em background a cada 25 segundos para garantir entrega instantânea
    const interval = setInterval(fetchAnnouncement, 25000);

    // 4. Sincronização ao focar na janela
    const handleWindowFocus = () => {
      fetchAnnouncement();
    };
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('visibilitychange', handleWindowFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('visibilitychange', handleWindowFocus);
    };
  }, [fetchAnnouncement]);

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
      className="ametist-global-announcement"
      style={{
        background: styleConfig.bg,
        color: styleConfig.textColor,
        padding: '7px 16px',
        fontSize: '0.84rem',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 999,
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
        textAlign: 'center',
        width: '100%'
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

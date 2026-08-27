import React, { useState } from 'react';
import { X, Monitor, Smartphone, Sparkles, Download, Zap, Check } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, onExport, tierlistName }) {
  const [quality, setQuality] = useState('discord'); // 'discord' (Leve / Rápido) vs 'ultra' (4K Máxima)

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '15px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#16161a',
          border: '1px solid rgba(176, 98, 235, 0.3)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(176, 98, 235, 0.15)',
          position: 'relative',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
          onMouseOut={(e) => e.currentTarget.style.color = '#888'}
        >
          <X size={20} />
        </button>

        {/* Título do Modal */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'inline-flex', padding: '8px', background: 'rgba(176, 98, 235, 0.12)', borderRadius: '12px', marginBottom: '10px', color: '#b062eb' }}>
            <Download size={22} />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.25rem', margin: '0 0 4px 0', fontWeight: '700' }}>
            Exportar Tier List
          </h2>
          <p style={{ color: '#8e8e99', fontSize: '0.82rem', margin: 0 }}>
            Escolha o formato e a resolução ideal para compartilhar
          </p>
        </div>

        {/* Seletor de Resolução / Peso do Arquivo */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#b5b5c3', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Resolução & Peso:
          </label>
          <div style={{ background: '#111116', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid #282834' }}>
            <button
              type="button"
              onClick={() => setQuality('discord')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '9px',
                border: 'none',
                background: quality === 'discord' ? '#b062eb' : 'transparent',
                color: quality === 'discord' ? '#ffffff' : '#888899',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: quality === 'discord' ? '0 2px 10px rgba(176, 98, 235, 0.4)' : 'none'
              }}
            >
              <Zap size={14} /> Otimizado (Discord / Web)
            </button>
            <button
              type="button"
              onClick={() => setQuality('ultra')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '9px',
                border: 'none',
                background: quality === 'ultra' ? '#b062eb' : 'transparent',
                color: quality === 'ultra' ? '#ffffff' : '#888899',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: quality === 'ultra' ? '0 2px 10px rgba(176, 98, 235, 0.4)' : 'none'
              }}
            >
              <Sparkles size={14} /> Ultra HD (4K)
            </button>
          </div>
          
          <div style={{ marginTop: '6px', fontSize: '0.74rem', color: quality === 'discord' ? '#38bdf8' : '#e879f9', paddingLeft: '4px' }}>
            {quality === 'discord' 
              ? 'Arquivo leve (< 2.5 MB) perfeito para envio direto no Discord sem Nitro e WhatsApp.' 
              : 'Resolução máxima em 4K (~8-14 MB) para telas grandes, impressões e edição de vídeo.'}
          </div>
        </div>

        {/* Opções de Formato */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '6px' }}>
          {/* Opção 1: Horizontal (16:9) */}
          <button
            onClick={() => {
              onExport('landscape', quality);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              background: '#1c1c24',
              border: '1px solid #2f2f3e',
              borderRadius: '14px',
              color: '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#b062eb';
              e.currentTarget.style.background = 'rgba(176, 98, 235, 0.12)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#2f2f3e';
              e.currentTarget.style.background = '#1c1c24';
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#262633', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b062eb', flexShrink: 0 }}>
              <Monitor size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Horizontal (16:9)
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#303040', borderRadius: '4px', color: '#b5b5c3' }}>
                  {quality === 'discord' ? '1080p Leve' : '4K Ultra'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#8e8e99' }}>
                Ideal para PC, Twitter/X, Discord e YouTube
              </div>
            </div>
          </button>

          {/* Opção 2: Vertical Stories / TikTok (9:16) */}
          <button
            onClick={() => {
              onExport('story', quality);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(176, 98, 235, 0.15) 0%, rgba(131, 56, 236, 0.08) 100%)',
              border: '1px solid rgba(176, 98, 235, 0.4)',
              borderRadius: '14px',
              color: '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: '0 4px 15px rgba(176, 98, 235, 0.15)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#d946ef';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(176, 98, 235, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(176, 98, 235, 0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(176, 98, 235, 0.15)';
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #b062eb, #7928ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
              <Smartphone size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px', color: '#e9d5ff' }}>
                Stories / TikTok (9:16)
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(217, 70, 239, 0.25)', border: '1px solid rgba(217, 70, 239, 0.5)', borderRadius: '4px', color: '#f0abfc', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Sparkles size={10} /> Viral
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#c4b5fd' }}>
                Cartão vertical pronto para Instagram Stories, TikTok e Shorts
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { X, Monitor, Smartphone, Sparkles, Download, Zap, Copy, Check } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, onExport, tierlistName }) {
  const [quality, setQuality] = useState('discord'); // 'discord' (Leve / Rápido) vs 'ultra' (4K Máxima)
  const [action, setAction] = useState('copy'); // 'copy' (Área de transferência) vs 'download' (Baixar arquivo)

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
          maxWidth: '500px',
          backgroundColor: '#15151a',
          border: '1px solid rgba(176, 98, 235, 0.35)',
          borderRadius: '20px',
          padding: '22px 24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(176, 98, 235, 0.18)',
          position: 'relative',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          type="button"
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
          title="Fechar"
        >
          <X size={20} />
        </button>

        {/* Título do Modal */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'inline-flex', padding: '8px', background: 'rgba(176, 98, 235, 0.15)', borderRadius: '12px', marginBottom: '8px', color: '#b062eb' }}>
            {action === 'copy' ? <Copy size={22} /> : <Download size={22} />}
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.25rem', margin: '0 0 4px 0', fontWeight: '800' }}>
            Exportar Tier List
          </h2>
          <p style={{ color: '#8e8e99', fontSize: '0.82rem', margin: 0 }}>
            Copie direto para o Discord/WhatsApp ou baixe o arquivo em alta resolução
          </p>
        </div>

        {/* SELETOR 1: AÇÃO PRINCIPAL (COPIAR OU BAIXAR) */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: '#b5b5c3', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            O que você deseja fazer?
          </label>
          <div style={{ background: '#0e0e12', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid #282834' }}>
            <button
              type="button"
              onClick={() => setAction('copy')}
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: '9px',
                border: 'none',
                background: action === 'copy' ? '#b062eb' : 'transparent',
                color: action === 'copy' ? '#ffffff' : '#888899',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
                boxShadow: action === 'copy' ? '0 2px 12px rgba(176, 98, 235, 0.45)' : 'none'
              }}
            >
              <Copy size={14} /> Copiar Imagem (Ctrl+V)
            </button>
            <button
              type="button"
              onClick={() => setAction('download')}
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: '9px',
                border: 'none',
                background: action === 'download' ? '#b062eb' : 'transparent',
                color: action === 'download' ? '#ffffff' : '#888899',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
                boxShadow: action === 'download' ? '0 2px 12px rgba(176, 98, 235, 0.45)' : 'none'
              }}
            >
              <Download size={14} /> Baixar Arquivo .PNG
            </button>
          </div>
        </div>

        {/* SELETOR 2: RESOLUÇÃO / PESO */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', color: '#b5b5c3', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Qualidade & Resolução:
          </label>
          <div style={{ background: '#0e0e12', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid #282834' }}>
            <button
              type="button"
              onClick={() => setQuality('discord')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '9px',
                border: 'none',
                background: quality === 'discord' ? '#262633' : 'transparent',
                color: quality === 'discord' ? '#ffffff' : '#777788',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.18s ease'
              }}
            >
              <Zap size={13} color={quality === 'discord' ? '#38bdf8' : '#777'} /> Otimizado (Discord / Web)
            </button>
            <button
              type="button"
              onClick={() => setQuality('ultra')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '9px',
                border: 'none',
                background: quality === 'ultra' ? '#262633' : 'transparent',
                color: quality === 'ultra' ? '#ffffff' : '#777788',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.18s ease'
              }}
            >
              <Sparkles size={13} color={quality === 'ultra' ? '#e879f9' : '#777'} /> Ultra HD (4K)
            </button>
          </div>
        </div>

        {/* OPÇÕES DE FORMATO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '4px' }}>
          
          {/* Opção 1: Horizontal (16:9) */}
          <button
            type="button"
            onClick={() => {
              onExport('landscape', quality, action);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              background: '#191921',
              border: '1px solid #2f2f3e',
              borderRadius: '14px',
              color: '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.18s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#b062eb';
              e.currentTarget.style.background = 'rgba(176, 98, 235, 0.12)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#2f2f3e';
              e.currentTarget.style.background = '#191921';
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#242432', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b062eb', flexShrink: 0 }}>
              <Monitor size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '800', fontSize: '0.92rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {action === 'copy' ? 'Copiar Horizontal (16:9)' : 'Baixar Horizontal (16:9)'}
                <span style={{ fontSize: '0.68rem', padding: '2px 5px', background: '#282838', borderRadius: '4px', color: '#b5b5c3' }}>
                  {quality === 'discord' ? '1080p' : '4K'}
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#8e8e99' }}>
                {action === 'copy' ? 'Copia a imagem clássica para colar com Ctrl+V' : 'Baixa o arquivo .png clássico para PC/Twitter/YouTube'}
              </div>
            </div>
            <div style={{ padding: '6px', background: 'rgba(176, 98, 235, 0.15)', borderRadius: '8px', color: '#b062eb', flexShrink: 0 }}>
              {action === 'copy' ? <Copy size={16} /> : <Download size={16} />}
            </div>
          </button>

          {/* Opção 2: Vertical Stories / TikTok (9:16) */}
          <button
            type="button"
            onClick={() => {
              onExport('story', quality, action);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              background: 'linear-gradient(135deg, rgba(176, 98, 235, 0.12) 0%, rgba(131, 56, 236, 0.06) 100%)',
              border: '1px solid rgba(176, 98, 235, 0.35)',
              borderRadius: '14px',
              color: '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.18s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#d946ef';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(176, 98, 235, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(176, 98, 235, 0.35)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #b062eb, #7928ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
              <Smartphone size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '800', fontSize: '0.92rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px', color: '#f3e8ff' }}>
                {action === 'copy' ? 'Copiar Stories / TikTok (9:16)' : 'Baixar Stories / TikTok (9:16)'}
                <span style={{ fontSize: '0.68rem', padding: '2px 5px', background: 'rgba(217, 70, 239, 0.25)', border: '1px solid rgba(217, 70, 239, 0.4)', borderRadius: '4px', color: '#f0abfc', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Sparkles size={10} /> Viral
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#c4b5fd' }}>
                {action === 'copy' ? 'Copia o card vertical para colar no WhatsApp/Stories' : 'Baixa o cartão vertical pronto para Instagram, TikTok e Shorts'}
              </div>
            </div>
            <div style={{ padding: '6px', background: 'rgba(217, 70, 239, 0.2)', borderRadius: '8px', color: '#f0abfc', flexShrink: 0 }}>
              {action === 'copy' ? <Copy size={16} /> : <Download size={16} />}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

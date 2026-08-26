import React from 'react';
import { X, Monitor, Smartphone, Sparkles, Download } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, onExport, tierlistName }) {
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
          maxWidth: '460px',
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
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', padding: '8px', background: 'rgba(176, 98, 235, 0.12)', borderRadius: '12px', marginBottom: '10px', color: '#b062eb' }}>
            <Download size={22} />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.25rem', margin: '0 0 4px 0', fontWeight: '700' }}>
            Exportar Tier List
          </h2>
          <p style={{ color: '#8e8e99', fontSize: '0.85rem', margin: 0 }}>
            Escolha o formato ideal para compartilhar
          </p>
        </div>

        {/* Opções de Formato */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
          {/* Opção 1: Horizontal (16:9) */}
          <button
            onClick={() => {
              onExport('landscape');
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              background: '#1f1f26',
              border: '1px solid #2f2f3a',
              borderRadius: '14px',
              color: '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#b062eb';
              e.currentTarget.style.background = 'rgba(176, 98, 235, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#2f2f3a';
              e.currentTarget.style.background = '#1f1f26';
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#292934', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b062eb', flexShrink: 0 }}>
              <Monitor size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Horizontal (16:9)
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#333344', borderRadius: '4px', color: '#aaa' }}>Clássico</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#8e8e99' }}>
                Ideal para PC, Twitter/X, Discord e Thumbnails do YouTube
              </div>
            </div>
          </button>

          {/* Opção 2: Vertical Stories / TikTok (9:16) */}
          <button
            onClick={() => {
              onExport('story');
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

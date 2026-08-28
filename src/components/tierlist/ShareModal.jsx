import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Link2, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  FileCode, 
  MessageCircle, 
  Send
} from 'lucide-react';
import { toast } from '../../utils/notifications';

export default function ShareModal({ 
  isOpen, 
  onClose, 
  tierlistName, 
  onExportJSON, 
  onImportJSON,
  activeTheme 
}) {
  const [activeTab, setActiveTab] = useState('link'); // 'link' ou 'json'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Gerar o link de compartilhamento atual
  const shareUrl = window.location.href;
  const shareText = `Confira a minha Tier List "${tierlistName || 'Ametist Tier Maker'}" criada no Ametist: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(tierlistName || 'Minha Tier List no Ametist')}`;
    window.open(url, '_blank');
  };

  const handleCopyDiscordFormat = async () => {
    const discordFormatted = `**${tierlistName || 'Tier List'}** no Ametist Tier Maker:\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(discordFormatted);
      toast.success('Mensagem formatada para o Discord copiada!');
    } catch (e) {
      toast.error('Erro ao copiar.');
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          maxWidth: '500px',
          backgroundColor: '#16161a',
          border: `1px solid ${activeTheme?.accentBorder || 'rgba(176, 98, 235, 0.35)'}`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: `0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px ${activeTheme?.accentGlow || 'rgba(176, 98, 235, 0.15)'}`,
          position: 'relative',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Linha decorativa superior */}
        <div style={{ height: '3px', width: '100%', background: activeTheme?.gradient || 'var(--accent-gradient)' }} />

        {/* Header do Modal */}
        <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #262630' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={18} color={activeTheme?.accentColor || '#b062eb'} />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: '700' }}>
              Compartilhar & Exportar
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
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
            <X size={18} />
          </button>
        </div>

        {/* Abas do Modal */}
        <div style={{ display: 'flex', borderBottom: '1px solid #262630', padding: '6px 16px 0 16px', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'link' ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '2px solid transparent',
              color: activeTab === 'link' ? '#fff' : '#888',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <Link2 size={15} /> Gerar Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'json' ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '2px solid transparent',
              color: activeTab === 'json' ? '#fff' : '#888',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <FileCode size={15} /> Arquivo JSON
          </button>
        </div>

        {/* Conteúdo: ABA LINK */}
        {activeTab === 'link' && (
          <div style={{ padding: '22px' }}>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: '#aaa', lineHeight: '1.4' }}>
              Copie o link direto desta Tier List para enviar aos seus amigos ou compartilhar nas redes sociais:
            </p>

            {/* Input com botão Copiar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                readOnly
                value={shareUrl}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: '#121216',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>
            </div>

            {/* Botões de Compartilhamento Rápido */}
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px', fontWeight: '600' }}>
              Compartilhar diretamente:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #25d366',
                  background: 'rgba(37, 211, 102, 0.1)',
                  color: '#25d366',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.15s'
                }}
              >
                <MessageCircle size={15} /> WhatsApp
              </button>

              <button
                type="button"
                onClick={handleShareTwitter}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #1da1f2',
                  background: 'rgba(29, 161, 242, 0.1)',
                  color: '#1da1f2',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.15s'
                }}
              >
                <Send size={15} /> Twitter / X
              </button>

              <button
                type="button"
                onClick={handleShareTelegram}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #0088cc',
                  background: 'rgba(0, 136, 204, 0.1)',
                  color: '#0088cc',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.15s'
                }}
              >
                <Send size={15} /> Telegram
              </button>

              <button
                type="button"
                onClick={handleCopyDiscordFormat}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #5865f2',
                  background: 'rgba(88, 101, 242, 0.1)',
                  color: '#5865f2',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.15s'
                }}
              >
                <Share2 size={15} /> Discord (Markdown)
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo: ABA JSON */}
        {activeTab === 'json' && (
          <div style={{ padding: '22px' }}>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#aaa', lineHeight: '1.4' }}>
              Exporte toda a sua configuração atual (linhas, colunas, imagens e posições) em formato JSON para salvar no seu computador ou restaurar depois.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  onExportJSON();
                  onClose();
                }}
                className="btn-primary"
                style={{
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '700'
                }}
              >
                <Download size={16} /> Baixar Arquivo (.json)
              </button>

              <label 
                className="btn-secondary" 
                style={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  fontSize: '0.9rem'
                }}
              >
                <Upload size={16} /> Carregar / Importar Arquivo (.json)
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={(e) => {
                    onImportJSON(e);
                    onClose();
                  }} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          </div>
        )}

        {/* Rodapé do Modal */}
        <div style={{ padding: '14px 22px', background: '#121216', borderTop: '1px solid #22222a', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '7px 16px', fontSize: '0.85rem' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

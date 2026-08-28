import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Cloud, 
  Eye, 
  RotateCcw, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  Share2,
  Lock
} from 'lucide-react';

export default function TierlistControls({
  user,
  layoutMode,
  colunas,
  canUndo,
  onExportImage,
  onOpenShare,
  onSaveToCloud,
  onEnterPresentation,
  onLayoutChange,
  onColunasChange,
  onUndo,
  onReset
}) {
  const navigate = useNavigate();
  const [isCollapsedMobile, setIsCollapsedMobile] = useState(false);

  return (
    <div className="controls-container-wrapper">
      {/* Barra de alternância rápida no mobile */}
      <div className="mobile-controls-toggle">
        <button
          type="button"
          onClick={() => setIsCollapsedMobile(!isCollapsedMobile)}
          className="btn-toggle-controls"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SlidersHorizontal size={14} />
            <span>Ferramentas & Opções</span>
          </div>
          {isCollapsedMobile ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      <div className={`controls-wrapper ${isCollapsedMobile ? 'mobile-collapsed' : ''}`}>
        {/* GRUPO 1: AÇÕES PRINCIPAIS E COMPARTILHAMENTO (BLOQUEADO PARA NÃO-LOGADOS) */}
        {user ? (
          <div className="control-card">
            <h3>Salvar & Compartilhar</h3>
            <div className="btn-grid">
              <button onClick={onExportImage} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Download size={14} /> Salvar Imagem
              </button>
              <button onClick={onOpenShare} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Share2 size={14} /> Compartilhar
              </button>
              <button onClick={onSaveToCloud} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Cloud size={14} /> Salvar na Nuvem
              </button>
            </div>
          </div>
        ) : (
          <div className="control-card" style={{ border: '1px solid rgba(255, 215, 0, 0.3)', background: 'linear-gradient(180deg, #16161c 0%, #121216 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                Salvar & Compartilhar
              </h3>
              <span style={{ fontSize: '0.68rem', color: '#ffd700', background: 'rgba(255, 215, 0, 0.15)', border: '1px solid rgba(255, 215, 0, 0.4)', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Lock size={10} /> BLOQUEADO
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', padding: '4px 0' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#aaa', lineHeight: '1.4' }}>
                Faça login para salvar na nuvem, exportar imagens em alta qualidade e gerar links compartilháveis.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn-primary"
                style={{
                  marginTop: '2px',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Lock size={13} /> Entrar para Liberar
              </button>
            </div>
          </div>
        )}

        {/* GRUPO 2: CONFIGURAÇÃO DO TABULEIRO */}
        <div className="control-card">
          <h3>Configuração</h3>
          <div className="btn-grid">
            <button onClick={onEnterPresentation} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Eye size={14} /> Modo Apresentação
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={() => onLayoutChange('classico')}
                className={layoutMode === 'classico' ? 'btn-active' : 'btn-secondary'}
                style={{ flex: 1 }}
              >
                Clássico
              </button>
              <button 
                onClick={() => onLayoutChange('avancado')}
                className={layoutMode === 'avancado' ? 'btn-active' : 'btn-secondary'}
                style={{ flex: 1 }}
              >
                Avançado
              </button>
            </div>
            {layoutMode === 'avancado' && (
              <div className="col-selector">
                <span style={{ fontSize: '0.78rem' }}>Colunas:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4].map(num => (
                    <button 
                      key={num} 
                      onClick={() => onColunasChange(num)} 
                      className={colunas === num ? 'col-btn active' : 'col-btn'}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GRUPO 3: EDIÇÃO E ZONA DE PERIGO */}
        <div className="control-card">
          <h3>Edição</h3>
          <div className="btn-grid">
            <button 
              onClick={onUndo} 
              className="btn-secondary"
              disabled={!canUndo}
              style={{ opacity: canUndo ? 1 : 0.4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} /> Desfazer
            </button>
            <button onClick={onReset} className="btn-danger outline" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <RefreshCw size={14} /> Resetar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { toast } from '../../utils/notifications';

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

  const handleGuestAction = (actionName) => {
    toast.info(`Faça login ou crie sua conta para ${actionName}!`);
    navigate('/login');
  };

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
        {/* GRUPO 1: AÇÕES PRINCIPAIS E COMPARTILHAMENTO */}
        <div className="control-card">
          <h3 style={{ margin: '0 0 8px 0', textAlign: 'center', width: '100%' }}>
            Salvar & Compartilhar
          </h3>

          {user ? (
            <div className="btn-grid">
              <button 
                type="button" 
                onClick={onExportImage} 
                className="btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Download size={14} /> Salvar Imagem
              </button>
              <button 
                type="button" 
                onClick={onOpenShare} 
                className="btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Share2 size={14} /> Compartilhar
              </button>
              <button 
                type="button" 
                onClick={onSaveToCloud} 
                className="btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Cloud size={14} /> Salvar na Nuvem
              </button>
            </div>
          ) : (
            <div className="btn-grid">
              <button 
                type="button"
                onClick={() => handleGuestAction('salvar imagem')} 
                className="btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.85 }}
                title="Faça login para salvar imagem"
              >
                <Download size={14} /> Salvar Imagem <Lock size={11} style={{ opacity: 0.6 }} />
              </button>
              <button 
                type="button"
                onClick={() => handleGuestAction('compartilhar')} 
                className="btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.85 }}
                title="Faça login para compartilhar"
              >
                <Share2 size={14} /> Compartilhar <Lock size={11} style={{ opacity: 0.6 }} />
              </button>
              <button 
                type="button"
                onClick={() => handleGuestAction('salvar na nuvem')} 
                className="btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                title="Faça login para salvar na nuvem"
              >
                <Cloud size={14} /> Salvar na Nuvem <Lock size={11} style={{ opacity: 0.7 }} />
              </button>
            </div>
          )}
        </div>

        {/* GRUPO 2: CONFIGURAÇÃO DO TABULEIRO */}
        <div className="control-card">
          <h3 style={{ margin: '0 0 8px 0', textAlign: 'center' }}>Configuração</h3>
          <div className="btn-grid">
            <button 
              type="button" 
              onClick={onEnterPresentation} 
              className="btn-secondary" 
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Eye size={14} /> Modo Apresentação
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                type="button"
                onClick={() => onLayoutChange('classico')}
                className={layoutMode === 'classico' ? 'btn-active' : 'btn-secondary'}
                style={{ flex: 1 }}
              >
                Clássico
              </button>
              <button 
                type="button"
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
                      type="button"
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
          <h3 style={{ margin: '0 0 8px 0', textAlign: 'center' }}>Edição</h3>
          <div className="btn-grid">
            <button 
              type="button"
              onClick={onUndo} 
              className="btn-secondary"
              disabled={!canUndo}
              style={{ opacity: canUndo ? 1 : 0.4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} /> Desfazer
            </button>
            <button 
              type="button"
              onClick={onReset} 
              className="btn-danger outline" 
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} /> Resetar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

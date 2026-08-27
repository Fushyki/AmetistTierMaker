import React, { useState } from 'react';
import { 
  Download, 
  Cloud, 
  Upload, 
  Eye, 
  RotateCcw, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  FileCode
} from 'lucide-react';

export default function TierlistControls({
  user,
  layoutMode,
  colunas,
  canUndo,
  onExportImage,
  onExportJSON,
  onImportJSON,
  onSaveToCloud,
  onEnterPresentation,
  onLayoutChange,
  onColunasChange,
  onUndo,
  onReset
}) {
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
        {/* GRUPO 1: AÇÕES PRINCIPAIS E NUVEM */}
        <div className="control-card">
          <h3>Salvar & Nuvem</h3>
          <div className="btn-grid">
            <button onClick={onExportImage} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Download size={14} /> Salvar Imagem
            </button>
            <button onClick={onExportJSON} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <FileCode size={14} /> Salvar (JSON)
            </button>
            {user ? (
              <button onClick={onSaveToCloud} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Cloud size={14} /> Salvar na Nuvem
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <button disabled className="btn-primary" style={{ opacity: 0.5, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Cloud size={14} /> Salvar na Nuvem
                </button>
                <span style={{ fontSize: '0.68rem', color: 'var(--accent-color)', textAlign: 'center' }}>Faça login para salvar!</span>
              </div>
            )}
            <label className="btn-secondary" style={{ cursor: 'pointer', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Upload size={14} /> Carregar (JSON)
              <input type="file" accept=".json" onChange={onImportJSON} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

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

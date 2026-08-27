import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';

export default function TierlistControls({
  user,
  layoutMode,
  colunas,
  canUndo,
  activeTemplateId,
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
  return (
    <div className="controls-wrapper">
      {/* GRUPO 1: AÇÕES PRINCIPAIS E NUVEM */}
      <div className="control-card">
        <h3>Salvar & Nuvem</h3>
        <div className="btn-grid">
          <button onClick={onExportImage} className="btn-primary">
            Salvar Imagem
          </button>
          <button onClick={onExportJSON} className="btn-primary">
            Salvar (JSON)
          </button>
          {user ? (
            <button onClick={onSaveToCloud} className="btn-primary">
              Salvar na Nuvem
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <button disabled className="btn-primary" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                Salvar na Nuvem
              </button>
              <span style={{ fontSize: '0.68rem', color: 'var(--accent-color)', textAlign: 'center' }}>Faça login para salvar!</span>
            </div>
          )}
          <label className="btn-secondary" style={{ cursor: 'pointer', textAlign: 'center' }}>
            Carregar (JSON)
            <input type="file" accept=".json" onChange={onImportJSON} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* GRUPO 2: CONFIGURAÇÃO DO TABULEIRO */}
      <div className="control-card">
        <h3>Configuração</h3>
        <div className="btn-grid">
          {activeTemplateId && (
            <Link 
              to={`/template-maker?editTemplateId=${activeTemplateId}`} 
              className="btn-secondary"
              style={{
                textDecoration: 'none',
                textAlign: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: '1.5px solid var(--accent-border)',
                color: 'var(--accent-color)',
                fontWeight: '600'
              }}
              title="Editar título, capa, imagens e configurações do modelo base"
            >
              <Pencil size={13} /> Editar Configurações do Modelo
            </Link>
          )}
          <button onClick={onEnterPresentation} className="btn-secondary">
            Modo Apresentação
          </button>
          <button 
            onClick={() => onLayoutChange('avancado')}
            className={layoutMode === 'avancado' ? 'btn-active' : 'btn-secondary'}
          >
            Modo Avançado
          </button>
          <button 
            onClick={() => onLayoutChange('classico')}
            className={layoutMode === 'classico' ? 'btn-active' : 'btn-secondary'}
          >
            Modo Clássico
          </button>
          {layoutMode === 'avancado' && (
            <div className="col-selector">
              <span>Colunas:</span>
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
            style={{ opacity: canUndo ? 1 : 0.4 }}
          >
            Desfazer (Ctrl+Z)
          </button>
          <button onClick={onReset} className="btn-danger outline">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Palette } from 'lucide-react';
import { BOARD_THEMES } from '../../data/themes';

export default function TierlistControls({
  user,
  layoutMode,
  colunas,
  theme = 'ametist',
  canUndo,
  onExportImage,
  onExportJSON,
  onImportJSON,
  onSaveToCloud,
  onEnterPresentation,
  onLayoutChange,
  onColunasChange,
  onThemeChange,
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
              <span style={{ fontSize: '0.68rem', color: '#b062eb', textAlign: 'center' }}>Faça login para salvar!</span>
            </div>
          )}
          <label className="btn-secondary" style={{ cursor: 'pointer', textAlign: 'center' }}>
            Carregar (JSON)
            <input type="file" accept=".json" onChange={onImportJSON} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* GRUPO 2: CONFIGURAÇÃO & TEMAS */}
      <div className="control-card">
        <h3>Configuração & Tema</h3>
        <div className="btn-grid">
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

        {/* SELETOR DE TEMAS */}
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #282830' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.78rem', color: '#aaa', fontWeight: '600' }}>
            <Palette size={14} color="#b062eb" />
            <span>Tema do Quadro:</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {BOARD_THEMES.map(t => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onThemeChange && onThemeChange(t.id)}
                  title={t.description}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 9px',
                    borderRadius: '7px',
                    border: isSelected ? `1.5px solid ${t.accentColor}` : '1px solid #2e2e38',
                    backgroundColor: isSelected ? `${t.accentColor}22` : '#16161a',
                    color: isSelected ? '#ffffff' : '#9999a5',
                    fontSize: '0.74rem',
                    fontWeight: isSelected ? '700' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? `0 0 10px ${t.accentColor}30` : 'none'
                  }}
                >
                  <span 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: t.accentColor,
                      display: 'inline-block',
                      boxShadow: `0 0 5px ${t.accentColor}`
                    }} 
                  />
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>
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

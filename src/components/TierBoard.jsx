import React from 'react';
import { Settings } from 'lucide-react';
import TierRow from './TierRow';

export default function TierBoard({ ranksData, items, colunas, columnTitles, layoutMode, onRemoveRow, selectedItem, setSelectedItem, onAreaClick, onDoubleClickItem, onMoveRow, onAddRow, onUpdateRow, onUpdateGroupTitle, onUpdateColumnTitle, isPresentationMode }) {
  return (
    <div id="board" className={layoutMode === 'avancado' ? 'avancado-board' : 'classico-board'}>
      {ranksData.map((grupo, groupIndex) => (
        <div key={grupo.id} className="tier-section-group">
          {layoutMode === 'avancado' && (
            <div className="group-header">
              {isPresentationMode ? (
                <span>{grupo.titulo}</span>
              ) : (
                <input 
                  type="text"
                  value={grupo.titulo || ''}
                  onChange={(e) => onUpdateGroupTitle && onUpdateGroupTitle(grupo.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.target.blur();
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed rgba(255,255,255,0.25)',
                    outline: 'none',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    letterSpacing: 'inherit',
                    textTransform: 'inherit',
                    textAlign: 'center',
                    cursor: 'text',
                    padding: '2px 6px',
                    width: 'auto',
                    minWidth: '140px',
                    maxWidth: '300px'
                  }}
                  title="Clique para editar o título do grupo"
                />
              )}
            </div>
          )}
          
          {layoutMode === 'avancado' && groupIndex === 0 && (
            <div className="tier-row" style={{ marginBottom: '5px' }}>
              <div className="tier-label" style={{ background: 'transparent', minHeight: 'auto', height: 'auto', opacity: 0 }}></div>
              <div className={`tier-drop-area grid-${colunas}`}>
                {Array.from({ length: colunas }).map((_, i) => (
                  <div key={i} className="col-title-box">
                    {isPresentationMode ? (
                      <span>{columnTitles && columnTitles[i] ? columnTitles[i] : `Coluna ${i+1}`}</span>
                    ) : (
                      <input 
                        type="text"
                        value={columnTitles && columnTitles[i] !== undefined ? columnTitles[i] : ''}
                        placeholder={i === 0 ? 'On-field DPS' : i === 1 ? 'Damage Support' : i === 2 ? 'Pure Support/Sustain' : 'Niche'}
                        onChange={(e) => onUpdateColumnTitle && onUpdateColumnTitle(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.target.blur();
                        }}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: 'inherit',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                          fontWeight: 'inherit',
                          letterSpacing: 'inherit',
                          textTransform: 'inherit',
                          textAlign: 'center',
                          cursor: 'text',
                          padding: '0 2px'
                        }}
                        title="Clique para editar o título da coluna"
                      />
                    )}
                  </div>
                ))}
              </div>
              {!isPresentationMode && (
                <div className="tier-settings" style={{ visibility: 'hidden', padding: '5px', display: 'flex', flexDirection: 'column' }}>
                  <button style={{ color: '#aaa', padding: '5px', background: 'none', border: 'none', display: 'flex', alignItems: 'center' }}><Settings size={16} /></button>
                </div>
              )}
            </div>
          )}

          <div className="section-grid">
            {grupo.ranks.map((rank) => (
              <TierRow 
                key={rank.id} 
                rank={rank} 
                colunas={colunas} 
                items={items.filter(item => item.tierId === rank.id)}
                onRemoveRow={onRemoveRow}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                onAreaClick={onAreaClick}
                onDoubleClickItem={onDoubleClickItem}
                onMoveRow={onMoveRow}
                onUpdateRow={onUpdateRow}
                isPresentationMode={isPresentationMode}
              />
            ))}
          </div>
          {!isPresentationMode && (
            <button 
              className="btn-secondary add-tier-row-btn" 
              onClick={() => onAddRow(grupo.id)}
              style={{ width: '100%', marginTop: '5px', padding: '10px', display: 'flex', justifyContent: 'center', opacity: 0.8 }}
            >
              + Adicionar Nova Linha
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

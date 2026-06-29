import React from 'react';
import { Settings } from 'lucide-react';
import TierRow from './TierRow';

export default function TierBoard({ ranksData, items, colunas, layoutMode, onRemoveRow, selectedItem, setSelectedItem, onAreaClick, onDoubleClickItem, onMoveRow, onAddRow, onUpdateRow, isPresentationMode }) {
  return (
    <div id="board">
      {ranksData.map((grupo, groupIndex) => (
        <div key={grupo.id} className="tier-section-group">
          {layoutMode === 'avancado' && (
            <div className="group-header" contentEditable={!isPresentationMode} suppressContentEditableWarning>
              {grupo.titulo}
            </div>
          )}
          
          {layoutMode === 'avancado' && groupIndex === 0 && (
            <div className="tier-row" style={{ marginBottom: '5px' }}>
              <div className="tier-label" style={{ background: 'transparent', minHeight: 'auto', height: 'auto', opacity: 0 }}></div>
              <div className={`tier-drop-area grid-${colunas}`}>
                {Array.from({ length: colunas }).map((_, i) => (
                  <div key={i} className="col-title-box" contentEditable={!isPresentationMode} suppressContentEditableWarning>
                    {i === 0 ? 'DPS' : i === 1 ? 'SUPPORT' : 'SUSTAIN'}
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

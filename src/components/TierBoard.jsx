import React from 'react';
import TierRow from './TierRow';

export default function TierBoard({ ranksData, items, colunas, layoutMode, onRemoveRow, selectedItem, setSelectedItem, onAreaClick, onDoubleClickItem }) {
  return (
    <div id="board">
      {ranksData.map((grupo, groupIndex) => (
        <div key={grupo.id} className="tier-section-group">
          {layoutMode === 'avancado' && (
            <div className="group-header" contentEditable suppressContentEditableWarning>
              {grupo.titulo}
            </div>
          )}
          
          {layoutMode === 'avancado' && groupIndex === 0 && (
            <div className="tier-row" style={{ marginBottom: '5px' }}>
              <div className="tier-label" style={{ background: 'transparent', minHeight: 'auto', height: 'auto', opacity: 0 }}></div>
              <div className={`tier-drop-area grid-${colunas}`}>
                {Array.from({ length: colunas }).map((_, i) => (
                  <div key={i} className="col-title-box" contentEditable suppressContentEditableWarning>
                    {i === 0 ? 'DPS' : i === 1 ? 'SUPPORT' : 'SUSTAIN'}
                  </div>
                ))}
              </div>
              <div className="tier-settings" style={{ visibility: 'hidden', padding: '5px', display: 'flex', flexDirection: 'column' }}>
                <button style={{ fontSize: '1.2rem', padding: '5px' }}>⚙️</button>
              </div>
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
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

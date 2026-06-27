import React, { useRef } from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import DroppableArea from './DroppableArea';
import SortableItem from './SortableItem';

export default function TierRow({ rank, items, colunas, onRemoveRow, selectedItem, setSelectedItem, onAreaClick }) {
  const isCustomTier = rank.id.startsWith('tier-') && rank.id.length > 10; 
  const colorInputRef = useRef(null);

  const handleRightClick = (e) => {
    e.preventDefault();
    colorInputRef.current.click();
  };

  const handleColorChange = (e) => {
    e.target.parentElement.style.backgroundColor = e.target.value;
  };

  return (
    <div className="tier-row" id={rank.id}>
      <div 
        className={`tier-label ${rank.c || 'f-rank'}`} 
        contentEditable 
        suppressContentEditableWarning
        onContextMenu={handleRightClick}
      >
        {rank.l || 'F'}
        <input 
          type="color" 
          ref={colorInputRef} 
          style={{ display: 'none' }} 
          onChange={handleColorChange} 
        />
      </div>
      
      <div className={`tier-drop-area grid-${colunas}`}>
        {Array.from({ length: colunas }).map((_, colIndex) => {
          const colItems = items.filter(item => item.colIndex === colIndex);
          const dropId = `tier-${rank.id}-col-${colIndex}`;
          
          return (
            <SortableContext key={dropId} items={colItems.map(it => it.id)} strategy={rectSortingStrategy}>
              <DroppableArea 
                id={dropId} 
                className="tier-items"
                onClick={() => onAreaClick(rank.id, colIndex)}
              >
                {colItems.map(item => (
                  <SortableItem 
                    key={item.id} 
                    id={item.id} 
                    item={item}
                    isSelected={selectedItem && selectedItem.id === item.id}
                    onClick={(clickedItem) => setSelectedItem(clickedItem)}
                  />
                ))}
              </DroppableArea>
            </SortableContext>
          );
        })}
      </div>
      
      <div className="tier-settings" style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '5px' }}>
        {isCustomTier && (
          <button className="remove-row-btn" onClick={() => onRemoveRow(rank.id)} title="Excluir Linha" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
            🗑️
          </button>
        )}
        <button className="config-btn" title="Configurar Cor" onClick={handleRightClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>⚙️</button>
      </div>
    </div>
  );
}

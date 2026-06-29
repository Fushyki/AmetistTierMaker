import React, { useRef } from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Settings, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import DroppableArea from './DroppableArea';
import SortableItem from './SortableItem';

export default function TierRow({ rank, items, colunas, onRemoveRow, selectedItem, setSelectedItem, onAreaClick, onDoubleClickItem, onMoveRow, onUpdateRow, isPresentationMode }) {
  const isCustomTier = rank.id.startsWith('tier-') && rank.id.length > 10; 
  const colorInputRef = useRef(null);

  const handleRightClick = (e) => {
    e.preventDefault();
    colorInputRef.current.click();
  };

  const handleColorChange = (e) => {
    e.target.parentElement.style.backgroundColor = e.target.value;
    onUpdateRow(rank.id, { bgColor: e.target.value });
  };

  return (
    <div className="tier-row" id={rank.id}>
      <div 
        className={`tier-label ${rank.c || 'f-rank'}`} 
        style={rank.bgColor ? { backgroundColor: rank.bgColor } : {}}
        contentEditable={!isPresentationMode}
        suppressContentEditableWarning
        onContextMenu={isPresentationMode ? undefined : handleRightClick}
        onBlur={(e) => {
          if (isPresentationMode) return;
          const newText = e.currentTarget.textContent.trim();
          if (newText !== rank.l) onUpdateRow(rank.id, { l: newText });
        }}
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
                    onDoubleClick={onDoubleClickItem}
                  />
                ))}
              </DroppableArea>
            </SortableContext>
          );
        })}
      </div>
      
      {!isPresentationMode && (
        <div className="tier-settings" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '5px' }}>
          <button onClick={() => onMoveRow(rank.id, 'up')} title="Mover para Cima" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}><ArrowUp size={16} /></button>
          <button onClick={() => onMoveRow(rank.id, 'down')} title="Mover para Baixo" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}><ArrowDown size={16} /></button>
          {isCustomTier && (
            <button className="remove-row-btn" onClick={() => onRemoveRow(rank.id)} title="Excluir Linha" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4444', display: 'flex', alignItems: 'center' }}>
              <Trash2 size={16} />
            </button>
          )}
          <button className="config-btn" title="Configurar Cor" onClick={handleRightClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center' }}><Settings size={16} /></button>
        </div>
      )}
    </div>
  );
}

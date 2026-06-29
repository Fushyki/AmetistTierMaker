import React, { useRef, useState } from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Settings, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import DroppableArea from './DroppableArea';
import SortableItem from './SortableItem';

export default function TierRow({ rank, items, colunas, onRemoveRow, selectedItem, setSelectedItem, onAreaClick, onDoubleClickItem, onMoveRow, onUpdateRow, isPresentationMode }) {
  const isCustomTier = rank.id.startsWith('tier-') && rank.id.length > 10; 
  const colorInputRef = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const presetColors = ['#ff7f7f', '#ffbf7f', '#ffdf7f', '#ffff7f', '#bfff7f', '#7fff7f', '#7ffff', '#7fbfff', '#7f7fff', '#ff7fff', '#bf7fbf', '#333333'];

  const handleRightClick = (e) => {
    e.preventDefault();
    if (!isPresentationMode) {
      setShowColorPicker(!showColorPicker);
    }
  };

  const handleColorSelect = (color) => {
    onUpdateRow(rank.id, { bgColor: color });
    setShowColorPicker(false);
  };

  const handleCustomColorChange = (e) => {
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
        {showColorPicker && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '100%', 
              left: '0', 
              marginTop: '5px',
              backgroundColor: '#1a1a1c', 
              border: '1px solid #333', 
              borderRadius: '8px', 
              padding: '10px', 
              zIndex: 100,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minWidth: '150px'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {presetColors.map(c => (
                <div 
                  key={c}
                  onClick={() => handleColorSelect(c)}
                  style={{ width: '24px', height: '24px', backgroundColor: c, borderRadius: '50%', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', borderTop: '1px solid #333', paddingTop: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Custom:</span>
              <input 
                type="color" 
                value={rank.bgColor || '#ff7f7f'}
                onChange={handleCustomColorChange} 
                style={{ width: '100%', height: '24px', border: 'none', cursor: 'pointer', background: 'none' }}
              />
            </div>
          </div>
        )}
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

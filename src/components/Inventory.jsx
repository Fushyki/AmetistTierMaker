import React, { useRef } from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import DroppableArea from './DroppableArea';
import SortableItem from './SortableItem';

export default function Inventory({ items, onUpload, onClear, selectedItem, setSelectedItem, onSort, onAreaClick }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const newItems = files.map((file, index) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          resolve({
            id: 'img-' + Date.now() + '-' + index,
            src: ev.target.result,
            nome: file.name,
            tierId: null,
            colIndex: null,
            uploadIndex: Date.now()
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newItems).then(results => {
      onUpload(results);
    });
    
    e.target.value = '';
  };

  return (
    <div className="inventory-section">
      <div className="inventory-header">
        <label htmlFor="image-input" className="custom-upload-btn">
          ＋ Adicionar Imagens
        </label>
        <input
          type="file"
          id="image-input"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        <div className="sort-controls">
          <span className="sort-label">Ordenar:</span>
          <button className="sort-btn" onClick={() => onSort('az')}>Nome A→Z</button>
          <button className="sort-btn" onClick={() => onSort('za')}>Nome Z→A</button>
          <button className="sort-btn" onClick={() => onSort('upload')}>Upload</button>
        </div>

        <div className="inventory-actions">
          <span className="contador-texto">
            {items.length} imagens no inventário
          </span>
          <button className="clear-inventory-btn" title="Remover todas as imagens do inventário" onClick={onClear}>
            🗑️ Limpar
          </button>
        </div>
      </div>

      <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
        <DroppableArea id="inventory" className="storage-box" onClick={onAreaClick}>
          {items.map(item => (
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
    </div>
  );
}

import React, { useRef, useState } from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Search, X } from 'lucide-react';
import DroppableArea from './DroppableArea';
import SortableItem from './SortableItem';

export default function Inventory({ items, onUpload, onClear, selectedItem, setSelectedItem, onSort, onAreaClick, onDuplicate, onUpdateApi, onDeleteSelected }) {
  const fileInputRef = useRef(null);
  
  // States para ordenação e filtro de nomes
  const [sortNameAsc, setSortNameAsc] = useState(true);
  const [sortDateAsc, setSortDateAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filtragem em tempo real pelo nome do personagem/item
  const displayItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase().trim();
    return (item.nome || item.name || '').toLowerCase().includes(term);
  });

  return (
    <div className="inventory-section">
      <div className="inventory-header">
        <label htmlFor="image-input" className="custom-upload-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Adicionar Imagens
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

        {/* Barra de Filtro de Nomes */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} color="#888" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 28px 6px 30px',
              borderRadius: '20px',
              border: '1px solid #333',
              background: '#16161c',
              color: '#fff',
              fontSize: '0.8rem',
              width: '160px',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-color)'; e.currentTarget.style.width = '200px'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#333'; if (!searchQuery) e.currentTarget.style.width = '160px'; }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Limpar filtro"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="sort-controls">
          <span className="sort-label">Ordenar:</span>
          <button 
            className="sort-btn" 
            onClick={() => {
              onSort(sortNameAsc ? 'az' : 'za');
              setSortNameAsc(!sortNameAsc);
            }}
          >
            Nome ({sortNameAsc ? 'A→Z' : 'Z→A'})
          </button>
          
          <button 
            className="sort-btn" 
            onClick={() => {
              onSort('upload');
              setSortDateAsc(!sortDateAsc);
            }}
          >
            Data ({sortDateAsc ? 'Antigos' : 'Novos'})
          </button>
        </div>

        <div className="inventory-actions">
          <span className="contador-texto" style={{ marginRight: '10px' }}>
            {displayItems.length} {searchQuery ? `de ${items.length}` : ''} imagens
          </span>
          <div className="btn-group-mini">
            <button className="clear-inventory-btn" title="Excluir o personagem selecionado" onClick={onDeleteSelected}>
              Excluir Sel.
            </button>
            <button className="clear-inventory-btn" title="Duplicar o personagem selecionado" onClick={onDuplicate}>
              Duplicar Sel.
            </button>
            <button className="clear-inventory-btn" title="restaura/atualiza as imagens" onClick={onUpdateApi}>
              Restaurar
            </button>
            <button className="clear-inventory-btn" title="Remover todas as imagens do inventário" onClick={onClear}>
              Limpar
            </button>
          </div>
        </div>
      </div>

      <SortableContext items={displayItems.map(i => i.id)} strategy={rectSortingStrategy}>
        <DroppableArea id="inventory" className="storage-box" onClick={onAreaClick}>
          {displayItems.length === 0 && searchQuery && (
            <div style={{ color: '#888', fontSize: '0.85rem', padding: '12px', textAlign: 'center', width: '100%' }}>
              Nenhuma imagem encontrada para "{searchQuery}".
            </div>
          )}
          {displayItems.map(item => (
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

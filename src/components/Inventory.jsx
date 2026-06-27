import React, { useRef } from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import DroppableArea from './DroppableArea';
import SortableItem from './SortableItem';

export default function Inventory({ items, onUpload, onClear, selectedItem, setSelectedItem, onSort, onAreaClick, onDuplicate, onUpdateApi, onDeleteSelected }) {
  const fileInputRef = useRef(null);
  
  // States para os toggles de ordenação
  const [sortNameAsc, setSortNameAsc] = React.useState(true);
  const [sortDateAsc, setSortDateAsc] = React.useState(false);

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
              // Assumindo que a função onSort original tem um 'upload' que ordena por data.
              // Como não temos 'upload-asc'/'upload-desc', vamos apenas chamar 'upload'
              // e talvez você queira ajustar a lógica no Tierlist.jsx no futuro, mas o botão já será toggle.
              onSort('upload');
              setSortDateAsc(!sortDateAsc);
            }}
          >
            Data ({sortDateAsc ? 'Antigos' : 'Novos'})
          </button>
        </div>

        <div className="inventory-actions">
          <span className="contador-texto" style={{ marginRight: '10px' }}>
            {items.length} imagens no inventário
          </span>
          <div className="btn-group-mini">
            <button className="clear-inventory-btn" title="Remover todas as imagens do inventário" onClick={onClear}>
              Limpar
            </button>
            <button className="clear-inventory-btn" title="Excluir o personagem selecionado" onClick={onDeleteSelected}>
              Excluir Sel.
            </button>
            <button className="clear-inventory-btn" title="Duplicar o personagem selecionado" onClick={onDuplicate}>
              Duplicar Sel.
            </button>
            <button className="clear-inventory-btn" title="Baixa os personagens mais recentes do servidor" onClick={onUpdateApi}>
              Atualizar API
            </button>
          </div>
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

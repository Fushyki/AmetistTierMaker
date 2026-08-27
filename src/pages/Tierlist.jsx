import React, { useState, useEffect } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTierlistState } from '../hooks/useTierlistState';
import { exportBoardAsImage } from '../utils/imageExporter';

import TierBoard from '../components/TierBoard';
import Inventory from '../components/Inventory';
import TierlistControls from '../components/tierlist/TierlistControls';
import PresentationOverlay from '../components/tierlist/PresentationOverlay';
import ExportModal from '../components/tierlist/ExportModal';
import '../styles/index.css';

export default function Tierlist() {
  const { user } = useAuth();
  const { siteTheme } = useTheme();
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const {
    layoutMode,
    colunas,
    setColunas,
    columnTitles,
    ranksData,
    items,
    setItems,
    tierlistName,
    setTierlistName,
    theme,
    setTheme,
    activeTemplateId,
    selectedItem,
    setSelectedItem,
    canUndo,
    undo,
    saveHistoryState,
    handleUpload,
    handleClearInventory,
    handleLayoutChange,
    resetarTierList,
    handleAddRow,
    handleUpdateRow,
    handleUpdateGroupTitle,
    handleUpdateColumnTitle,
    handleMoveRow,
    handleRemoveRow,
    moveItem,
    sortInventory,
    loadFromApiAgain,
    handleSaveToCloud,
    handleExportJSON,
    handleImportJSON,
    handleDuplicateSelected,
    handleDeleteSelected
  } = useTierlistState(user);

  // Configuração dos Sensores de Arrastar (Pointer & Touch)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  // Deselecionar ao clicar fora de áreas ativas
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (
        selectedItem &&
        !e.target.closest('.personagem-item') &&
        !e.target.closest('.storage-box') &&
        !e.target.closest('.tier-row') &&
        !e.target.closest('.section-grid') &&
        !e.target.closest('.control-card')
      ) {
        setSelectedItem(null);
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [selectedItem, setSelectedItem]);

  // Auxiliares de DnD
  const findContainer = (id) => {
    if (!id) return null;
    if (id === 'inventory') return 'inventory';
    if (typeof id === 'string' && id.startsWith('tier-') && id.includes('-col-')) {
      if (!items.find(i => i.id === id)) return id;
    }
    const item = items.find(i => i.id === id);
    if (item) {
      if (item.tierId === null) return 'inventory';
      return `tier-${item.tierId}-col-${item.colIndex}`;
    }
    return id;
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }
    
    saveHistoryState(items, ranksData);
    setItems((prev) => {
      const activeIndex = prev.findIndex(i => i.id === activeId);
      const overIndex = prev.findIndex(i => i.id === overId);
      
      let newTierId = null;
      let newColIndex = null;
      if (overContainer !== 'inventory') {
        const match = overContainer.match(/tier-(.+)-col-(\d+)/);
        if (match) {
          newTierId = match[1];
          newColIndex = parseInt(match[2], 10);
        }
      }

      const newItems = [...prev];
      newItems[activeIndex] = {
        ...newItems[activeIndex],
        tierId: newTierId,
        colIndex: newColIndex
      };

      if (overIndex !== -1) {
        return arrayMove(newItems, activeIndex, overIndex);
      }
      return newItems;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (activeContainer && activeContainer === overContainer && activeId !== overId) {
      setItems((prev) => {
        const activeIndex = prev.findIndex(i => i.id === activeId);
        const overIndex = prev.findIndex(i => i.id === overId);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
    setSelectedItem(null);
  };

  const handleDoubleClickItem = (item) => {
    if (item.tierId !== null) {
      moveItem(item.id, null, null);
    }
  };

  const handleAreaClick = (tierId, colIndex) => {
    if (selectedItem) {
      moveItem(selectedItem.id, tierId, colIndex);
      setSelectedItem(null);
    }
  };

  return (
    <DndContext sensors={sensors} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className={`tierlist-container ${isPresentationMode ? 'presentation-mode' : ''}`}>
        
        {isPresentationMode && (
          <PresentationOverlay onExit={() => setIsPresentationMode(false)} />
        )}

        {!isPresentationMode && <h1>{tierlistName}</h1>}

        {!isPresentationMode && (
          <TierlistControls 
            user={user}
            layoutMode={layoutMode}
            colunas={colunas}
            canUndo={canUndo}
            onExportImage={() => setIsExportModalOpen(true)}
            onExportJSON={handleExportJSON}
            onImportJSON={handleImportJSON}
            onSaveToCloud={handleSaveToCloud}
            onEnterPresentation={() => setIsPresentationMode(true)}
            onLayoutChange={handleLayoutChange}
            onColunasChange={setColunas}
            onUndo={undo}
            onReset={resetarTierList}
          />
        )}

        <ExportModal 
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          tierlistName={tierlistName}
          onExport={(format) => exportBoardAsImage(`${tierlistName || 'minha-tierlist'}.png`, 'board', format, { title: tierlistName, theme: siteTheme || theme || 'ametist' })}
        />

        <div className="dica-texto" style={{ marginBottom: '14px', textAlign: 'center' }}>
          Dica: No celular, clique na imagem e depois clique na área de tier desejada para mover.
        </div>

        <TierBoard 
          ranksData={ranksData} 
          items={items.filter(item => item.tierId !== null)} 
          colunas={colunas}
          columnTitles={columnTitles}
          layoutMode={layoutMode}
          theme={siteTheme || theme || 'ametist'}
          onRemoveRow={handleRemoveRow}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          onAreaClick={handleAreaClick}
          onDoubleClickItem={handleDoubleClickItem}
          onMoveRow={handleMoveRow}
          onAddRow={handleAddRow}
          onUpdateRow={handleUpdateRow}
          onUpdateGroupTitle={handleUpdateGroupTitle}
          onUpdateColumnTitle={handleUpdateColumnTitle}
          isPresentationMode={isPresentationMode}
        />

        {!isPresentationMode && (
          <Inventory 
            items={items.filter(item => item.tierId === null)} 
            onUpload={handleUpload}
            onClear={handleClearInventory}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            onSort={sortInventory}
            onAreaClick={() => handleAreaClick(null, null)}
            onDuplicate={handleDuplicateSelected}
            onUpdateApi={loadFromApiAgain}
            onDeleteSelected={handleDeleteSelected}
          />
        )}
      </div>
    </DndContext>
  );
}

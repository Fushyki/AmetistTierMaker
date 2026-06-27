import { useState, useEffect, useRef } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import TierBoard from '../components/TierBoard';
import Inventory from '../components/Inventory';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import '../index.css';

const initialRanksAvancado = [
  { id: 'group-1', titulo: "APEX CHARACTERS", ranks: [{ id: 'tier-1', l: "T0", c: "s-rank" }, { id: 'tier-2', l: "T0,5", c: "a-rank" }] },
  { id: 'group-2', titulo: "META CHARACTERS", ranks: [{ id: 'tier-3', l: "T1", c: "b-rank" }, { id: 'tier-4', l: "T1,5", c: "c-rank" }] },
  { id: 'group-3', titulo: "OFF-META CHARACTERS", ranks: [{ id: 'tier-5', l: "T2", c: "d-rank" }, { id: 'tier-6', l: "T3", c: "f-rank" }] }
];

const initialRanksClassico = [
  { id: 'group-1', titulo: "TIER LIST", ranks: [
    { id: 'tier-1', l: "S", c: "s-rank" }, 
    { id: 'tier-2', l: "A", c: "a-rank" },
    { id: 'tier-3', l: "B", c: "b-rank" },
    { id: 'tier-4', l: "C", c: "c-rank" },
    { id: 'tier-5', l: "D", c: "d-rank" }
  ]}
];

function Tierlist() {
  const [layoutMode, setLayoutMode] = useState(() => {
    return localStorage.getItem('tierlist-layout') || 'avancado';
  });
  const [colunas, setColunas] = useState(1);
  const [ranksData, setRanksData] = useState(() => {
    const saved = localStorage.getItem('tierlist-ranks');
    if (saved) return JSON.parse(saved);
    return localStorage.getItem('tierlist-layout') === 'classico' ? initialRanksClassico : initialRanksAvancado;
  });
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('tierlist-items');
    return saved ? JSON.parse(saved) : [];
  });
  
  const { user } = useAuth();

  const [selectedItem, setSelectedItem] = useState(null);
  const isInitialMount = useRef(true);

  // Deselecionar ao clicar fora
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Se clicou em algo que NÃO é um personagem nem uma área de drop, limpa a seleção
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
  }, [selectedItem]);

  useEffect(() => {
    const currentId = localStorage.getItem('tierlist-current-id');
    if (currentId) {
      const loadCloudData = async () => {
        const { data, error } = await supabase.from('tierlists').select('data').eq('id', currentId).single();
        if (data) {
          setItems(data.data.items || []);
          setRanksData(data.data.ranksData || []);
          if (data.data.layoutMode) setLayoutMode(data.data.layoutMode);
          if (data.data.colunas) setColunas(data.data.colunas);
        }
      };
      loadCloudData();
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  useEffect(() => {
    localStorage.setItem('tierlist-ranks', JSON.stringify(ranksData));
  }, [ranksData]);

  useEffect(() => {
    localStorage.setItem('tierlist-items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    // Carregamento inicial da API
    const hasLoadedApi = localStorage.getItem('tierlist-api-loaded');
    if (!hasLoadedApi && items.length === 0) {
      const fetchCharacters = async () => {
        try {
          const apiUrl = localStorage.getItem('tierlist-api-url') || 'https://api.lunaris.moe/data/6.6.54.3/charlist.json';
          const res = await fetch(apiUrl);
          const data = await res.json();
          
          const newItems = Object.entries(data).map(([id, char], index) => {
            const iconName = char.CardImg ? char.CardImg.replace('UI_Gacha_', 'UI_') : '';
            return {
              id: 'genshin-' + id,
              src: `https://api.lunaris.moe/data/assets/avataricon/${iconName}.webp`,
              nome: char.ptName || char.enName || id,
              tierId: null,
              colIndex: null,
              uploadIndex: index
            };
          });

          setItems(newItems);
          localStorage.setItem('tierlist-api-loaded', 'true');
        } catch (err) {
          console.error("Erro ao carregar API:", err);
        }
      };

      fetchCharacters();
    }
  }, [items.length]);

  const handleUpload = (newItems) => {
    setItems(prev => [...prev, ...newItems]);
  };

  const handleClearInventory = () => {
    setItems(prev => prev.filter(item => item.tierId !== null));
    setSelectedItem(null);
  };

  const loadFromApiAgain = async () => {
    const defaultUrl = localStorage.getItem('tierlist-api-url') || 'https://api.lunaris.moe/data/6.6.54.3/charlist.json';
    const newUrl = prompt('Digite a URL do charlist.json (ou confirme para usar a atual):', defaultUrl);
    
    if (newUrl) {
      localStorage.setItem('tierlist-api-url', newUrl);
      try {
        const res = await fetch(newUrl);
        const data = await res.json();
        const existingIds = new Set(items.map(i => i.id));
        
        const newItems = Object.entries(data)
          .filter(([id, _]) => !existingIds.has('genshin-' + id))
          .map(([id, char], index) => {
            const iconName = char.CardImg ? char.CardImg.replace('UI_Gacha_', 'UI_') : '';
            return {
              id: 'genshin-' + id,
              src: `https://api.lunaris.moe/data/assets/avataricon/${iconName}.webp`,
              nome: char.ptName || char.enName || id,
              tierId: null,
              colIndex: null,
              uploadIndex: Date.now() + index
            };
          });

        setItems(prev => [...prev, ...newItems]);
      } catch (err) {
        alert("Erro ao carregar da API. Verifique a URL.");
      }
    }
  };

  const handleLayoutChange = (newMode) => {
    if (layoutMode === newMode) return;
    if (confirm('Atenção: Mudar o modo de layout limpará sua montagem atual e devolverá os personagens ao inventário. Deseja continuar?')) {
      setLayoutMode(newMode);
      localStorage.setItem('tierlist-layout', newMode);
      setRanksData(newMode === 'classico' ? initialRanksClassico : initialRanksAvancado);
      setColunas(1);
      
      setItems(prev => prev.map(item => ({...item, tierId: null, colIndex: null})));
      setSelectedItem(null);
    }
  };

  const resetarTierList = () => {
    if (confirm('Tem certeza que deseja resetar tudo? Todas as imagens no quadro serão perdidas.')) {
      setItems([]);
      setRanksData(layoutMode === 'classico' ? initialRanksClassico : initialRanksAvancado);
      setColunas(1);
      setSelectedItem(null);
      localStorage.removeItem('tierlist-api-loaded');
    }
  };

  const adicionarLinha = () => {
    setRanksData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData[newData.length - 1].ranks.push({ 
        id: 'tier-' + Date.now(), 
        l: "?", 
        c: "f-rank" 
      });
      return newData;
    });
  };

  const handleRemoveRow = (rowId) => {
    setItems(prev => prev.map(item => 
      item.tierId === rowId ? { ...item, tierId: null, colIndex: null } : item
    ));
    
    setRanksData(prev => prev.map(group => ({
      ...group,
      ranks: group.ranks.filter(r => r.id !== rowId)
    })));
  };

  const findContainer = (id) => {
    if (!id) return null;
    if (id === 'inventory') return 'inventory';
    if (typeof id === 'string' && id.startsWith('tier-') && id.includes('-col-')) {
       // Se o ID for exatamente do container (DroppableArea)
       if (!items.find(i => i.id === id)) return id;
    }
    
    // Se for um item, busca em qual container ele está
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
         // Move to exactly before/after the hovered item
         const itemToMove = newItems.splice(activeIndex, 1)[0];
         // Recalculate index after splice
         const newOverIndex = newItems.findIndex(i => i.id === overId);
         newItems.splice(newOverIndex, 0, itemToMove);
         return newItems;
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
        
        const newItems = [...prev];
        const itemToMove = newItems.splice(activeIndex, 1)[0];
        const newOverIndex = newItems.findIndex(i => i.id === overId);
        // Put it after or before depending on standard array move
        newItems.splice(newOverIndex, 0, itemToMove);
        return newItems;
      });
    }
    setSelectedItem(null);
  };

  const moveItem = (itemId, targetTierId, targetColIndex) => {
    setItems(prev => {
      const activeIndex = prev.findIndex(i => i.id === itemId);
      if (activeIndex === -1) return prev;
      const newItems = [...prev];
      const itemToMove = newItems.splice(activeIndex, 1)[0];
      itemToMove.tierId = targetTierId;
      itemToMove.colIndex = targetColIndex;
      newItems.push(itemToMove);
      return newItems;
    });
  };

  const handleAreaClick = (tierId, colIndex) => {
    if (selectedItem) {
      moveItem(selectedItem.id, tierId, colIndex);
      setSelectedItem(null);
    }
  };

  const handleColunasChange = (novaQuantidade) => {
    setColunas(novaQuantidade);
    setItems(prev => prev.map(item => {
      if (item.colIndex !== null && item.colIndex >= novaQuantidade) {
        return { ...item, tierId: null, colIndex: null };
      }
      return item;
    }));
  };

  const sortInventory = (mode) => {
    setItems(prev => {
      const inventoryItems = prev.filter(i => i.tierId === null);
      const tierItems = prev.filter(i => i.tierId !== null);
      
      inventoryItems.sort((a, b) => {
        if (mode === 'az') return (a.nome || '').localeCompare(b.nome || '');
        if (mode === 'za') return (b.nome || '').localeCompare(a.nome || '');
        if (mode === 'upload') return (a.uploadIndex || 0) - (b.uploadIndex || 0);
        return 0;
      });
      
      return [...tierItems, ...inventoryItems];
    });
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ items, ranksData, layoutMode, colunas });
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'minha-tierlist.json');
    linkElement.click();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.items && data.ranksData) {
          setItems(data.items);
          setRanksData(data.ranksData);
          if (data.layoutMode) setLayoutMode(data.layoutMode);
          if (data.colunas) setColunas(data.colunas);
        } else {
          alert('Arquivo JSON inválido.');
        }
      } catch (err) {
        alert('Erro ao ler o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveToCloud = async () => {
    if (!user) return alert("Faça login para salvar na nuvem.");
    const currentId = localStorage.getItem('tierlist-current-id');
    const dataToSave = { items, ranksData, layoutMode, colunas };
    
    try {
      if (currentId) {
        await supabase.from('tierlists').update({ data: dataToSave, updated_at: new Date() }).eq('id', currentId);
      } else {
        const name = prompt('Dê um nome para a sua Tierlist:');
        if (!name) return;
        const { data, error } = await supabase.from('tierlists').insert([{ user_id: user.id, name, data: dataToSave }]).select();
        if (error) throw error;
        localStorage.setItem('tierlist-current-id', data[0].id);
      }
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const handleDuplicateSelected = () => {
    if (!selectedItem) return;
    const newItem = {
      ...selectedItem,
      id: selectedItem.id + '-copy-' + Date.now(),
      tierId: null,
      colIndex: null,
      uploadIndex: Date.now()
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleDeleteSelected = () => {
    if (!selectedItem) return;
    setItems(prev => prev.filter(item => item.id !== selectedItem.id));
    setSelectedItem(null);
  };

  const handleExportImage = async () => {
    try {
      const htmlToImage = await import('html-to-image');
      const boardElement = document.getElementById('board');
      if (!boardElement) return;
      
      const dataUrl = await htmlToImage.toPng(boardElement, { 
        backgroundColor: '#161618',
        pixelRatio: 1, // Reduzido para 1 para evitar limites de memória em celulares
        cacheBust: true, // Força o recarregamento de imagens para evitar falhas de cache
        // Removido o imagePlaceholder para forçar o carregamento real e ver se resolve o sumiço
      });
      
      const link = document.createElement('a');
      link.download = 'minha-tierlist.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      alert('Houve um erro ao gerar a imagem: ' + (error.message || error));
    }
  };

  return (
    <DndContext sensors={sensors} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="tierlist-container">
        <h1>Minha Lista de Personagens</h1>

        <div className="controls-wrapper">
          {/* GRUPO 1: AÇÕES PRINCIPAIS E NUVEM */}
          <div className="control-card">
            <h3>Salvar & Nuvem</h3>
            <div className="btn-grid">
              <button onClick={handleExportImage} className="btn-primary">
                Salvar Imagem
              </button>
              <button onClick={handleExportJSON} className="btn-primary">
                Salvar (JSON)
              </button>
              {user ? (
                <button onClick={handleSaveToCloud} className="btn-primary">
                  Salvar na Nuvem
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <button disabled className="btn-primary" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    Salvar na Nuvem
                  </button>
                  <span style={{ fontSize: '0.7rem', color: '#b062eb', textAlign: 'center' }}>Faça login para salvar!</span>
                </div>
              )}
              <label className="btn-secondary" style={{ cursor: 'pointer', textAlign: 'center' }}>
                Carregar (JSON)
                <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* GRUPO 2: CONFIGURAÇÃO DO TABULEIRO */}
          <div className="control-card">
            <h3>Configuração</h3>
            <div className="btn-grid">
              <button 
                onClick={() => handleLayoutChange('avancado')}
                className={layoutMode === 'avancado' ? 'btn-active' : 'btn-secondary'}
              >
                Modo Avançado
              </button>
              <button 
                onClick={() => handleLayoutChange('classico')}
                className={layoutMode === 'classico' ? 'btn-active' : 'btn-secondary'}
              >
                Modo Clássico
              </button>
              <div className="col-selector">
                <span>Colunas:</span>
                <button onClick={() => handleColunasChange(1)} className={colunas === 1 ? 'col-btn active' : 'col-btn'}>1</button>
                <button onClick={() => handleColunasChange(2)} className={colunas === 2 ? 'col-btn active' : 'col-btn'}>2</button>
                <button onClick={() => handleColunasChange(3)} className={colunas === 3 ? 'col-btn active' : 'col-btn'}>3</button>
              </div>
            </div>
          </div>

          {/* GRUPO 3: EDIÇÃO E ZONA DE PERIGO */}
          <div className="control-card">
            <h3>Edição</h3>
            <div className="btn-grid">
              <button onClick={adicionarLinha} className="btn-secondary">
                Adicionar Linha
              </button>
              <button onClick={resetarTierList} className="btn-danger outline">
                Reseta Tudo
              </button>
            </div>
          </div>
        </div>

        <div className="dica-texto" style={{ marginBottom: '20px', textAlign: 'center' }}>
          Dica: No celular, clique na imagem e depois clique na área de tier desejada para mover.
        </div>

        <TierBoard 
          ranksData={ranksData} 
          items={items.filter(item => item.tierId !== null)} 
          colunas={colunas}
          layoutMode={layoutMode}
          onRemoveRow={handleRemoveRow}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          onAreaClick={handleAreaClick}
        />

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
      </div>
    </DndContext>
  );
}

export default Tierlist;

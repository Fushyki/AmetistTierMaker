import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import { fetchAndParseAPI } from '../utils/apiParser';
import { confirmAction } from '../utils/alerts';
import { useHistory } from './useHistory';

export const initialRanksAvancado = [
  { id: 'group-1', titulo: "APEX CHARACTERS", ranks: [{ id: 'tier-1', l: "T0", c: "s-rank" }, { id: 'tier-2', l: "T0,5", c: "a-rank" }] },
  { id: 'group-2', titulo: "META CHARACTERS", ranks: [{ id: 'tier-3', l: "T1", c: "b-rank" }, { id: 'tier-4', l: "T1,5", c: "c-rank" }] },
  { id: 'group-3', titulo: "OFF-META CHARACTERS", ranks: [{ id: 'tier-5', l: "T2", c: "d-rank" }, { id: 'tier-6', l: "T3", c: "f-rank" }] }
];

export const initialRanksClassico = [
  { id: 'group-1', titulo: "TIER LIST", ranks: [
    { id: 'tier-1', l: "S", c: "s-rank" }, 
    { id: 'tier-2', l: "A", c: "a-rank" },
    { id: 'tier-3', l: "B", c: "b-rank" },
    { id: 'tier-4', l: "C", c: "c-rank" },
    { id: 'tier-5', l: "D", c: "d-rank" }
  ]}
];

export function useTierlistState(user) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [layoutMode, setLayoutMode] = useState(() => {
    return localStorage.getItem('tierlist-layout') || 'avancado';
  });
  const [colunas, setColunas] = useState(1);
  const [columnTitles, setColumnTitles] = useState(() => {
    const saved = localStorage.getItem('tierlist-column-titles');
    if (saved) return JSON.parse(saved);
    return ['On-field DPS', 'Damage Support', 'Pure Support/Sustain', 'Niche'];
  });
  const [ranksData, setRanksData] = useState(() => {
    const saved = localStorage.getItem('tierlist-ranks');
    if (saved) return JSON.parse(saved);
    return localStorage.getItem('tierlist-layout') === 'classico' ? initialRanksClassico : initialRanksAvancado;
  });
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('tierlist-items');
    return saved ? JSON.parse(saved) : [];
  });
  const [tierlistName, setTierlistName] = useState(() => {
    return localStorage.getItem('tierlist-name') || 'Minha Tier List';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tierlist-theme') || 'ametist';
  });
  const [activeTemplateId, setActiveTemplateId] = useState(() => {
    return localStorage.getItem('tierlist-active-template-id') || null;
  });
  const [selectedItem, setSelectedItem] = useState(null);

  // Hook de Histórico / Undo
  const { saveState, undo: executeUndo, canUndo } = useHistory();

  useEffect(() => {
    localStorage.setItem('tierlist-theme', theme);
  }, [theme]);

  const saveHistoryState = useCallback((currentItems, currentRanks) => {
    saveState({
      items: currentItems,
      ranksData: currentRanks
    });
  }, [saveState]);

  const undo = useCallback(() => {
    executeUndo((prevState) => {
      if (prevState) {
        setItems(prevState.items);
        setRanksData(prevState.ranksData);
      }
    });
  }, [executeUndo]);

  // Atalho global de teclado Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  // Persistência local contínua
  useEffect(() => {
    localStorage.setItem('tierlist-ranks', JSON.stringify(ranksData));
  }, [ranksData]);

  useEffect(() => {
    localStorage.setItem('tierlist-column-titles', JSON.stringify(columnTitles));
  }, [columnTitles]);

  useEffect(() => {
    localStorage.setItem('tierlist-items', JSON.stringify(items));
  }, [items]);

  // Inicialização de Dados / Carregamento de Templates ou Nuvem
  useEffect(() => {
    const initPage = async () => {
      const templateId = searchParams.get('templateId');
      const isNew = searchParams.get('new') === 'true';
      const currentId = localStorage.getItem('tierlist-current-id');
      const forceCloudLoad = localStorage.getItem('tierlist-force-cloud-load') === 'true';

      if (isNew) {
        localStorage.removeItem('tierlist-items');
        localStorage.removeItem('tierlist-ranks');
        localStorage.removeItem('tierlist-api-loaded');
        localStorage.removeItem('tierlist-active-template-id');
        localStorage.removeItem('tierlist-current-id');
        localStorage.removeItem('tierlist-name');
        
        setTierlistName('Minha Tier List');
        setItems([]);
        setRanksData(initialRanksClassico);
        setLayoutMode('classico');
        
        searchParams.delete('new');
        setSearchParams(searchParams);
      } else if (templateId) {
        if (templateId === localStorage.getItem('tierlist-active-template-id') && localStorage.getItem('tierlist-api-loaded') === 'true') {
          searchParams.delete('templateId');
          setSearchParams(searchParams);
          return;
        }

        try {
          const { data } = await supabase.from('templates').select('name, data').eq('id', templateId).single();
          if (data && data.data) {
            if (data.name) {
              setTierlistName(data.name);
              localStorage.setItem('tierlist-name', data.name);
            }
            saveHistoryState(items, ranksData);
            
            if (data.data.items && data.data.ranksData) {
              setRanksData(data.data.ranksData);
              setLayoutMode(data.data.layoutMode || 'classico');
              setColunas(data.data.colunas || 1);
              if (data.data.columnTitles) setColumnTitles(data.data.columnTitles);
              if (data.data.theme) setTheme(data.data.theme);

              if (data.data.apiConfig) {
                try {
                  const apiItems = await fetchAndParseAPI(data.data.apiConfig);
                  if (apiItems.length === 0) toast.error('A API não retornou nenhuma imagem.');
                  setItems(apiItems);
                } catch {
                  toast.error("Erro ao puxar imagens da API do Template.");
                }
              } else {
                setItems(data.data.items);
              }
            } else {
              setItems(data.data);
            }
            
            localStorage.setItem('tierlist-api-loaded', 'true');
            localStorage.setItem('tierlist-active-template-id', templateId);
            setActiveTemplateId(templateId);
            localStorage.removeItem('tierlist-current-id');
            
            searchParams.delete('templateId');
            setSearchParams(searchParams);
          }
        } catch (err) {
          console.error("Erro ao carregar template:", err);
        }
      } else if (currentId && forceCloudLoad) {
        try {
          const { data } = await supabase.from('tierlists').select('name, data').eq('id', currentId).single();
          if (data) {
            if (data.data && data.data.type === 'copa') {
              localStorage.setItem('copa-current-id', currentId);
              localStorage.setItem('copa-name', data.name);
              localStorage.setItem('copa-inventory-v3', JSON.stringify(data.data.inventory || []));
              localStorage.setItem('copa-matches-v3', JSON.stringify(data.data.matches || {}));
              localStorage.removeItem('tierlist-current-id');
              localStorage.removeItem('tierlist-force-cloud-load');
              window.location.href = `/copa?id=${currentId}`;
              return;
            }
            if (data.name) {
              setTierlistName(data.name);
              localStorage.setItem('tierlist-name', data.name);
            }
            setItems(data.data.items || []);
            setRanksData(data.data.ranksData || []);
            if (data.data.layoutMode) setLayoutMode(data.data.layoutMode);
            if (data.data.colunas) setColunas(data.data.colunas);
            if (data.data.columnTitles) setColumnTitles(data.data.columnTitles);
            if (data.data.theme) setTheme(data.data.theme);
            if (data.data.templateId) {
              setActiveTemplateId(data.data.templateId);
              localStorage.setItem('tierlist-active-template-id', data.data.templateId);
            }
            
            localStorage.removeItem('tierlist-force-cloud-load');
          }
        } catch (err) {
          console.error("Erro ao carregar da nuvem:", err);
        }
      } else {
        // Fallback padrão se não tiver nada
        const hasLoadedApi = localStorage.getItem('tierlist-api-loaded');
        const savedItems = localStorage.getItem('tierlist-items');
        const hasItems = savedItems ? JSON.parse(savedItems).length > 0 : false;
        
        if (!hasLoadedApi && !hasItems) {
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
            localStorage.removeItem('tierlist-active-template-id');
          } catch (err) {
            console.error("Erro ao carregar API padrão:", err);
          }
        }
      }
    };

    initPage();
  }, []);

  // Manipulação de Linhas e Tabuleiro
  const handleUpload = (newItems) => {
    saveHistoryState(items, ranksData);
    setItems(prev => [...prev, ...newItems]);
  };

  const handleClearInventory = () => {
    saveHistoryState(items, ranksData);
    setItems(prev => prev.filter(item => item.tierId !== null));
    setSelectedItem(null);
  };

  const handleLayoutChange = async (newMode) => {
    if (layoutMode === newMode) return;
    const isConfirmed = await confirmAction(
      'Mudar Layout',
      'Atenção: Mudar o modo de layout devolverá os personagens ao inventário. Deseja continuar?',
      'Sim, mudar'
    );
    if (isConfirmed) {
      saveHistoryState(items, ranksData);
      setLayoutMode(newMode);
      localStorage.setItem('tierlist-layout', newMode);
      setRanksData(newMode === 'classico' ? initialRanksClassico : initialRanksAvancado);
      setColunas(1);
      
      setItems(prev => prev.map(item => ({ ...item, tierId: null, colIndex: null })));
      setSelectedItem(null);
    }
  };

  const resetarTierList = async () => {
    const isConfirmed = await confirmAction(
      'Limpar Quadro',
      'Tem certeza que deseja limpar a tier list? Todas as imagens voltarão para o inventário.',
      'Sim, limpar'
    );
    if (isConfirmed) {
      saveHistoryState(items, ranksData);
      setItems(prev => prev.map(item => ({ ...item, tierId: null, colIndex: null })));
      setSelectedItem(null);
    }
  };

  const handleAddRow = (groupId) => {
    saveHistoryState(items, ranksData);
    setRanksData(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        ranks: [...group.ranks, { id: 'tier-' + Date.now(), l: "NEW", c: "f-rank" }]
      };
    }));
  };

  const handleUpdateRow = (rankId, updates) => {
    saveHistoryState(items, ranksData);
    setRanksData(prev => prev.map(group => ({
      ...group,
      ranks: group.ranks.map(r => r.id === rankId ? { ...r, ...updates } : r)
    })));
  };

  const handleUpdateGroupTitle = (groupId, newTitle) => {
    saveHistoryState(items, ranksData);
    setRanksData(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      return { ...group, titulo: newTitle };
    }));
  };

  const handleUpdateColumnTitle = (colIndex, newTitle) => {
    saveHistoryState(items, ranksData);
    setColumnTitles(prev => {
      const newTitles = [...prev];
      newTitles[colIndex] = newTitle;
      return newTitles;
    });
  };

  const handleMoveRow = (rankId, direction) => {
    saveHistoryState(items, ranksData);
    setRanksData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      for (const group of newData) {
        const index = group.ranks.findIndex(r => r.id === rankId);
        if (index !== -1) {
          if (direction === 'up' && index > 0) {
            const temp = group.ranks[index - 1];
            group.ranks[index - 1] = group.ranks[index];
            group.ranks[index] = temp;
          } else if (direction === 'down' && index < group.ranks.length - 1) {
            const temp = group.ranks[index + 1];
            group.ranks[index + 1] = group.ranks[index];
            group.ranks[index] = temp;
          }
          break;
        }
      }
      return newData;
    });
  };

  const handleRemoveRow = (rowId) => {
    saveHistoryState(items, ranksData);
    setItems(prev => prev.map(item => 
      item.tierId === rowId ? { ...item, tierId: null, colIndex: null } : item
    ));
    
    setRanksData(prev => prev.map(group => ({
      ...group,
      ranks: group.ranks.filter(r => r.id !== rowId)
    })));
  };

  const moveItem = (itemId, targetTierId, targetColIndex) => {
    saveHistoryState(items, ranksData);
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

  const handleSaveToCloud = async () => {
    if (!user) return toast.error("Faça login para salvar na nuvem.");
    const currentId = localStorage.getItem('tierlist-current-id');
    const dataToSave = { 
      items, 
      ranksData, 
      layoutMode, 
      colunas, 
      columnTitles, 
      theme,
      templateId: activeTemplateId 
    };
    
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
      toast.success('Tierlist salva na nuvem com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar: ' + err.message);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ items, ranksData, layoutMode, colunas, columnTitles, theme });
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
          saveHistoryState(items, ranksData);
          setItems(data.items);
          setRanksData(data.ranksData);
          if (data.layoutMode) setLayoutMode(data.layoutMode);
          if (data.colunas) setColunas(data.colunas);
          if (data.columnTitles) setColumnTitles(data.columnTitles);
          if (data.theme) setTheme(data.theme);
          toast.success('Tierlist importada com sucesso!');
        } else {
          toast.error('Arquivo JSON inválido.');
        }
      } catch {
        toast.error('Erro ao ler o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDuplicateSelected = () => {
    if (!selectedItem) return;
    saveHistoryState(items, ranksData);
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
    saveHistoryState(items, ranksData);
    setItems(prev => prev.filter(item => item.id !== selectedItem.id));
    setSelectedItem(null);
  };

  const loadFromApiAgain = async () => {
    const activeTemplateId = localStorage.getItem('tierlist-active-template-id');
    const existingIds = new Set(items.map(i => i.id));

    try {
      if (activeTemplateId) {
        const { data } = await supabase.from('templates').select('data').eq('id', activeTemplateId).single();
        if (data && data.data) {
          let templateItems = [];
          if (data.data.apiConfig) {
            templateItems = await fetchAndParseAPI(data.data.apiConfig);
          } else {
            templateItems = data.data.items || data.data;
          }

          if (templateItems.length === 0) {
            toast.error('A API não retornou nenhuma imagem.');
            return;
          }

          const missingItems = templateItems.filter(item => !existingIds.has(item.id));
          if (missingItems.length > 0) {
            const restoredItems = missingItems.map(item => ({ ...item, tierId: null, colIndex: null }));
            setItems(prev => [...prev, ...restoredItems]);
          } else {
            toast.success('Todas as imagens originais do template já estão presentes.');
          }
        }
      } else {
        const defaultUrl = localStorage.getItem('tierlist-api-url') || 'https://api.lunaris.moe/data/6.6.54.3/charlist.json';
        const res = await fetch(defaultUrl);
        const data = await res.json();
        
        const newItems = Object.entries(data)
          .filter(([id]) => !existingIds.has('genshin-' + id))
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
      }
    } catch (err) {
      console.error("Erro ao restaurar imagens:", err);
    }
  };

  return {
    layoutMode,
    setLayoutMode,
    colunas,
    setColunas,
    columnTitles,
    setColumnTitles,
    ranksData,
    setRanksData,
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
  };
}

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { confirmAction } from '../utils/alerts';
import TierBoard from '../components/TierBoard';
import { fetchAndParseAPI } from '../utils/apiParser';
import { processImage } from '../utils/imageProcessor';
import { TEMPLATE_CATEGORIES } from '../data/categories';
import { autoImport } from '../utils/autoImporter';
import { Sparkles, Zap, Flame, Music, Lock, X, Loader2, Search, Check, AlertCircle, Gamepad2 } from 'lucide-react';

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

export default function TemplateMaker() {
  const { user, loading: authLoading } = useAuth();
  const { activeTheme, showCustomToast } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const editTemplateId = searchParams.get('editTemplateId');
  
  const [name, setName] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [category, setCategory] = useState('games');
  
  const [masterDimensions, setMasterDimensions] = useState(null);
  const [items, setItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [dataSourceType, setDataSourceType] = useState('manual'); // 'manual', 'auto' ou 'api'
  const [apiConfig, setApiConfig] = useState({
    url: '',
    arrayPath: '',
    namePath: '',
    imagePath: '',
    imageBaseUrl: '',
    replaceFrom: '',
    replaceTo: '',
    imageSuffix: '',
    pagesToFetch: 1
  });
  const [autoQuery, setAutoQuery] = useState('');
  const [autoCategory, setAutoCategory] = useState('auto'); // 'auto', 'anime', 'games', 'music'
  const [autoFeedback, setAutoFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);

  const handleRunAutoImport = async (overrideQuery = null, overrideCat = null) => {
    const q = (overrideQuery !== null ? overrideQuery : autoQuery).trim();
    const cat = overrideCat !== null ? overrideCat : autoCategory;

    if (!q) {
      setAutoFeedback({ type: 'error', message: 'Digite o nome de um Anime, Jogo ou Artista para buscar.' });
      return;
    }

    if (overrideQuery) setAutoQuery(overrideQuery);
    if (overrideCat) setAutoCategory(overrideCat);

    setIsAutoLoading(true);
    setAutoFeedback(null);

    try {
      const result = await autoImport(q, cat);
      setItems(result.items);
      if (!name) setName(result.title);
      if (!coverImage && result.cover) setCoverImage(result.cover);
      if (result.category) setCategory(result.category);

      const successMsg = `${result.items.length} itens importados com sucesso (${result.sourceLabel || 'Banco de Dados'})!`;
      setAutoFeedback({ type: 'success', message: successMsg });
      if (showCustomToast) {
        showCustomToast('Importação Concluída', `${result.items.length} itens carregados para o template.`, 'palette');
      }
    } catch (err) {
      console.error(err);
      setAutoFeedback({ type: 'error', message: err.message || 'Erro ao importar automaticamente.' });
    } finally {
      setIsAutoLoading(false);
    }
  };
  
  const [layoutMode, setLayoutMode] = useState('classico');
  const [ranksData, setRanksData] = useState(initialRanksClassico);
  const colunas = layoutMode === 'classico' ? 1 : 4;
  const [columnTitles, setColumnTitles] = useState(['On-field DPS', 'Damage Support', 'Pure Support/Sustain', 'Niche']);

  useEffect(() => {
    if (editTemplateId) {
      const fetchTemplateToEdit = async () => {
        const { data, error } = await supabase.from('templates').select('*').eq('id', editTemplateId).single();
        if (data && data.data) {
          setName(data.name);
          setCoverImage(data.cover_image);
          setIsPublic(data.is_public);
          
          const tData = data.data;
          setRanksData(tData.ranksData || initialRanksClassico);
          setItems(tData.items || []);
          setLayoutMode(tData.layoutMode || 'classico');
          if (tData.columnTitles) setColumnTitles(tData.columnTitles);
          if (tData.category) setCategory(tData.category);
          
          if (tData.apiConfig) {
            setDataSourceType('api');
            setApiConfig(tData.apiConfig);
          } else {
            setDataSourceType('manual');
          }
        } else if (error) {
          console.error("Erro ao buscar template para edição:", error);
        }
      };
      fetchTemplateToEdit();
    }
  }, [editTemplateId]);

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      // 16:9 banner size standard (e.g. 600x338)
      const result = await processImage(file, 600, 338);
      setCoverImage(result.dataUrl);
    } catch {
      toast.error("Erro ao processar a capa.");
    }
  };

  const handleCoverUrl = async () => {
    const { value: url } = await Swal.fire({
      title: 'URL da Capa',
      input: 'url',
      inputPlaceholder: 'https://exemplo.com/imagem.png',
      background: '#1a1a1c',
      color: '#ffffff',
      confirmButtonColor: '#b062eb',
      showCancelButton: true,
      confirmButtonText: 'Adicionar',
      cancelButtonText: 'Cancelar'
    });
    
    if (url) {
      setCoverImage(url);
    }
  };

  const handleItemsUpload = async (e) => {
    let files = [];
    if (e.dataTransfer && e.dataTransfer.files) {
      files = Array.from(e.dataTransfer.files);
    } else if (e.target && e.target.files) {
      files = Array.from(e.target.files);
    }
    
    if (!files.length) return;
    
    setIsProcessing(true);
    try {
      let currentMaster = masterDimensions;
      
      const newProcessedItems = [];
      
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue; // skip non-images
        
        let targetW = currentMaster ? currentMaster.width : null;
        let targetH = currentMaster ? currentMaster.height : null;
        
        const result = await processImage(file, targetW, targetH);
        
        if (!currentMaster) {
          currentMaster = { width: result.width, height: result.height };
          setMasterDimensions(currentMaster);
        }
        
        newProcessedItems.push({
          id: 'custom-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
          nome: file.name.split('.')[0],
          src: result.dataUrl,
          tierId: null,
          colIndex: null,
          uploadIndex: Date.now()
        });
      }
      
      setItems(prev => [...prev, ...newProcessedItems]);
    } catch {
      toast.error("Erro ao processar as imagens.");
    } finally {
      setIsProcessing(false);
    }
    
    if (e.target && e.target.value) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleItemsUpload(e);
  };

  const handleReset = async () => {
    const isConfirmed = await confirmAction(
      'Limpar Imagens',
      'Tem certeza que deseja apagar o banco de imagens atual?',
      'Sim, apagar'
    );
    if (isConfirmed) {
      setItems([]);
      setMasterDimensions(null);
    }
  };

  const handleLayoutChange = async (newMode) => {
    if (layoutMode === newMode) return;
    const isConfirmed = await confirmAction(
      'Mudar Layout',
      'Atenção: Mudar o modo limpará a estrutura atual de Tiers. Deseja continuar?',
      'Sim, mudar'
    );
    if (isConfirmed) {
      setLayoutMode(newMode);
      setRanksData(newMode === 'classico' ? initialRanksClassico : initialRanksAvancado);
    }
  };

  const handleAddRow = (groupId) => {
    setRanksData(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        ranks: [...group.ranks, { id: 'tier-' + Date.now(), l: "NEW", c: "f-rank" }]
      };
    }));
  };

  const handleUpdateRow = (rankId, updates) => {
    setRanksData(prev => prev.map(group => ({
      ...group,
      ranks: group.ranks.map(r => r.id === rankId ? { ...r, ...updates } : r)
    })));
  };

  const handleUpdateGroupTitle = (groupId, newTitle) => {
    setRanksData(prev => prev.map(group => {
      if (group.id !== groupId) return group;
      return { ...group, titulo: newTitle };
    }));
  };

  const handleUpdateColumnTitle = (colIndex, newTitle) => {
    setColumnTitles(prev => {
      const newTitles = [...prev];
      newTitles[colIndex] = newTitle;
      return newTitles;
    });
  };

  const handleRemoveRow = (rankId) => {
    setRanksData(prev => prev.map(group => ({
      ...group,
      ranks: group.ranks.filter(r => r.id !== rankId)
    })));
  };

  const handleMoveRow = (rankId, direction) => {
    setRanksData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      for (const group of newData) {
        const index = group.ranks.findIndex(r => r.id === rankId);
        if (index !== -1) {
          if (direction === 'up' && index > 0) {
            const temp = group.ranks[index];
            group.ranks[index] = group.ranks[index - 1];
            group.ranks[index - 1] = temp;
          } else if (direction === 'down' && index < group.ranks.length - 1) {
            const temp = group.ranks[index];
            group.ranks[index] = group.ranks[index + 1];
            group.ranks[index + 1] = temp;
          }
          break;
        }
      }
      return newData;
    });
  };

  const handleTestApi = async () => {
    if (!apiConfig.url) return toast.error('Insira a URL da API primeiro.');
    setIsTestingApi(true);
    try {
      const apiItems = await fetchAndParseAPI(apiConfig);
      setItems(apiItems);
      toast.success(`Sucesso! API retornou ${apiItems.length} itens.`);
      if (apiConfig.pagesToFetch > 1) {
        setTimeout(() => {
          toast.info("Dica: Se a API não trouxe todos os itens, você poderá usar o botão 'Restaurar' na Tier List para continuar buscando.", { autoClose: 7000 });
        }, 1500);
      }
    } catch (error) {
      toast.error(`Erro ao ler API: ${error.message}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleItemUrl = async () => {
    const { value: url } = await Swal.fire({
      title: 'URL da Imagem (Item)',
      input: 'url',
      inputPlaceholder: 'https://...',
      background: '#1a1a1c',
      color: '#ffffff',
      showCancelButton: true,
      confirmButtonText: 'Adicionar',
      cancelButtonText: 'Cancelar'
    });
    
    if (url) {
      const newItem = {
        id: 'manual-' + Date.now(),
        src: url,
        nome: 'Item Customizado',
        tierId: null,
        colIndex: null,
        uploadIndex: Date.now()
      };
      setItems(prev => [...prev, newItem]);
    }
  };

  const handleSaveTemplate = async () => {
    if (!user) return toast.error("Você precisa estar logado para publicar um template!");
    if (!name.trim()) return toast.error("Dê um nome para o template.");
    if (!coverImage) return toast.error("O template precisa de uma imagem de capa.");
    if (items.length === 0 && (dataSourceType === 'manual' || dataSourceType === 'auto')) return toast.error("O template precisa de pelo menos 1 imagem.");
    if (items.length === 0 && dataSourceType === 'api') return toast.error("Teste a API primeiro para garantir que ela carrega os itens.");

    try {
      const templateDataPayload = {
        items: (dataSourceType === 'manual' || dataSourceType === 'auto') ? items : [],
        apiConfig: dataSourceType === 'api' ? apiConfig : null,
        ranksData,
        layoutMode,
        colunas,
        columnTitles,
        category
      };

      if (editTemplateId) {
        const { error } = await supabase.from('templates').update({
          name: name.trim(),
          cover_image: coverImage,
          is_public: isPublic,
          data: templateDataPayload
        }).eq('id', editTemplateId);
        
        if (error) throw error;
        toast.success("Template atualizado com sucesso!");
        navigate(`/tierlist?templateId=${editTemplateId}`);
      } else {
        const { data, error } = await supabase.from('templates').insert([{
          user_id: user.id,
          name: name.trim(),
          cover_image: coverImage,
          is_public: isPublic,
          data: templateDataPayload
        }]).select();

        if (error) throw error;
        toast.success("Template publicado com sucesso!");
        navigate(`/tierlist?templateId=${data[0].id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erro ao publicar. Verifique suas permissões (RLS) ou se a tabela existe no Supabase.");
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#b062eb', fontSize: '1rem', fontWeight: '600' }}>
        Carregando...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: '20px 15px', maxWidth: '520px', margin: '20px auto 20px', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ color: '#b062eb', marginBottom: '14px', fontSize: '1.4rem' }}>Acesso Restrito</h1>
        <div style={{ background: '#18181b', padding: '24px 20px', borderRadius: '12px', border: '1px solid #28282e' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(176,98,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b062eb' }}>
              <Lock size={28} />
            </div>
          </div>
          <h2 style={{ marginBottom: '10px', fontSize: '1.15rem' }}>Criar modelo é uma função exclusiva para membros</h2>
          <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '20px' }}>
            Crie sua conta gratuitamente para salvar suas Tier Lists e criar seus templates, além de continuar editando elas de qualquer dispositivo, a qualquer momento.
          </p>
          <button 
            onClick={() => navigate('/login')}
            style={{ padding: '10px 22px', fontSize: '0.95rem', backgroundColor: '#ffd700', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Fazer Login / Criar Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '10px 15px', maxWidth: '880px', margin: '15px auto 20px', color: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 6px 0', color: activeTheme?.accentColor || '#b062eb', fontSize: '1.45rem' }}>
          {editTemplateId ? `Editar Configurações do Modelo: ${name || ''}` : 'Criador de Modelos'}
        </h1>
        {editTemplateId && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(176,98,235,0.12)',
            border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.35)'}`,
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            color: '#ddd',
            marginTop: '8px'
          }}>
            <Sparkles size={15} color={activeTheme?.accentColor || '#b062eb'} />
            <span>Configurações internas do modelo (título, categoria, capa, banco de imagens e estrutura de tiers)</span>
          </div>
        )}
      </div>
      
      <div className="control-card" style={{ padding: '14px', marginBottom: '14px' }}>
        <h3>Informações do Template</h3>
        <input 
          type="text" 
          placeholder="Nome do Template (ex: Animes Fall 2024)" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0 14px 0', borderRadius: '5px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff' }}
        />

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '6px', fontWeight: '600' }}>
            Categoria do Modelo
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #3a3a40',
              backgroundColor: '#212124',
              color: '#fff',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            {TEMPLATE_CATEGORIES.filter(c => c.id !== 'todos').map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ marginTop: '15px' }}>
          <h4>Capa do Template</h4>
          {coverImage ? (
            <div style={{ position: 'relative', display: 'inline-block', marginTop: '10px' }}>
              <img src={coverImage} alt="Capa" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', border: '2px solid #b062eb' }} />
              <button 
                onClick={() => setCoverImage(null)}
                style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Remover Capa"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <label className="btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                Fazer Upload (16:9)
                <input type="file" accept="image/*" onChange={handleCoverUpload} ref={coverInputRef} style={{ display: 'none' }} />
              </label>
              <button className="btn-secondary" onClick={handleCoverUrl}>
                Usar URL
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="control-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>Estrutura dos Tiers</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={layoutMode === 'classico' ? 'btn-active' : 'btn-secondary'}
              onClick={() => handleLayoutChange('classico')}
            >Modo Clássico</button>
            <button 
              className={layoutMode === 'avancado' ? 'btn-active' : 'btn-secondary'}
              onClick={() => handleLayoutChange('avancado')}
            >Modo Avançado</button>
          </div>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '20px' }}>Configure as cores, textos, adicione ou remova linhas. Este esqueleto será salvo no modelo!</p>
        
        {/* TierBoard disabled DND mode by not wrapping in DndContext, just for visual config */}
        <div style={{ opacity: 0.9 }}>
          <TierBoard 
            ranksData={ranksData}
            items={[]}
            colunas={colunas}
            columnTitles={columnTitles}
            layoutMode={layoutMode}
            onRemoveRow={handleRemoveRow}
            selectedItem={null}
            setSelectedItem={() => {}}
            onAreaClick={() => {}}
            onDoubleClickItem={() => {}}
            onMoveRow={handleMoveRow}
            onAddRow={handleAddRow}
            onUpdateRow={handleUpdateRow}
            onUpdateGroupTitle={handleUpdateGroupTitle}
            onUpdateColumnTitle={handleUpdateColumnTitle}
          />
        </div>
      </div>

      <div className="control-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0 }}>Banco de Imagens</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className={dataSourceType === 'manual' ? 'btn-active' : 'btn-secondary'}
              onClick={() => setDataSourceType('manual')}
            >Upload Manual</button>
            <button 
              className={dataSourceType === 'auto' ? 'btn-active' : 'btn-secondary'}
              onClick={() => setDataSourceType('auto')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Zap size={14} color={dataSourceType === 'auto' ? '#ffffff' : '#ffd700'} /> Importar por Link / Nome
            </button>
            <button 
              className={dataSourceType === 'api' ? 'btn-active' : 'btn-secondary'}
              onClick={() => setDataSourceType('api')}
            >API Customizada</button>
          </div>
        </div>

        {dataSourceType === 'auto' ? (
          <div style={{ 
            background: '#141418', 
            padding: '20px', 
            borderRadius: '12px', 
            border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.35)'}`, 
            marginBottom: '15px',
            boxShadow: `0 4px 20px ${activeTheme?.accentGlow || 'rgba(176,98,235,0.1)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: activeTheme?.accentColor || '#b062eb' }}>
              <Sparkles size={20} />
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>Importação Automática em 1 Clique</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#aaa', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Pesquise qualquer <strong>Anime</strong> (AniList), <strong>Jogo</strong> (LoL, Brawl Stars, Genshin, Pokémon) ou <strong>Artista Musical</strong> (Apple Music). O Ametist buscará todos os personagens, imagens HD, título e capa automaticamente!
            </p>

            {/* Categorias de busca */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[
                { id: 'auto', label: 'Tudo (Auto Detectar)', icon: Zap },
                { id: 'anime', label: 'Animes & Mangás', icon: Flame },
                { id: 'games', label: 'Jogos & Personagens', icon: Gamepad2 },
                { id: 'music', label: 'Músicas & Artistas', icon: Music },
              ].map(cat => {
                const isSelected = autoCategory === cat.id;
                const IconComp = cat.icon;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      setAutoCategory(cat.id);
                      setAutoFeedback(null);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: isSelected ? `1.5px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #2f2f38',
                      backgroundColor: isSelected ? `${activeTheme?.accentColor || '#b062eb'}25` : '#18181c',
                      color: isSelected ? '#ffffff' : '#8e8e99',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? '700' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <IconComp size={14} color={isSelected ? (activeTheme?.accentColor || '#b062eb') : '#888'} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Barra de Busca Unificada com Botão Integrado */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div style={{ flex: 1, minWidth: '260px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={18} color="#777" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
                <input 
                  type="text" 
                  placeholder={
                    autoCategory === 'anime' ? "Ex: Jujutsu Kaisen, Naruto, Bleach, Attack on Titan..." :
                    autoCategory === 'games' ? "Ex: League of Legends, Brawl Stars, Genshin Impact, Pokemon..." :
                    autoCategory === 'music' ? "Ex: The Weeknd, Taylor Swift, Travis Scott, Drake..." :
                    "Digite o nome de um Anime, Jogo ou Artista musical..."
                  }
                  value={autoQuery}
                  onChange={(e) => {
                    setAutoQuery(e.target.value);
                    if (autoFeedback) setAutoFeedback(null);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRunAutoImport(); }}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    borderRadius: '8px',
                    border: '1px solid #383842',
                    backgroundColor: '#1b1b20',
                    color: '#fff',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleRunAutoImport()}
                disabled={isAutoLoading}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 22px',
                  cursor: isAutoLoading ? 'wait' : 'pointer',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {isAutoLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Buscar e Importar</span>
                  </>
                )}
              </button>
            </div>

            {/* Sugestões Rápidas em 1 Clique */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '8px', fontSize: '0.78rem', color: '#777' }}>
              <span>Sugestões rápidas:</span>
              {[
                { label: 'League of Legends', cat: 'games' },
                { label: 'Brawl Stars', cat: 'games' },
                { label: 'Genshin Impact', cat: 'games' },
                { label: 'Honkai: Star Rail', q: 'Honkai', cat: 'games' },
                { label: 'Pokémon (151)', q: 'Pokemon', cat: 'games' },
                { label: 'Jujutsu Kaisen', cat: 'anime' },
                { label: 'The Weeknd', cat: 'music' }
              ].map(sug => (
                <button
                  type="button"
                  key={sug.label}
                  onClick={() => handleRunAutoImport(sug.q || sug.label, sug.cat)}
                  disabled={isAutoLoading}
                  style={{
                    background: '#222228',
                    border: '1px solid #33333d',
                    borderRadius: '6px',
                    color: '#bbb',
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = activeTheme?.accentColor || '#b062eb'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#33333d'; e.currentTarget.style.color = '#bbb'; }}
                >
                  {sug.label}
                </button>
              ))}
            </div>

            {/* FEEDBACK INLINE (SEM BLOQUEAR A TELA) */}
            {autoFeedback && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '14px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: autoFeedback.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: autoFeedback.type === 'success' ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                  color: autoFeedback.type === 'success' ? '#4ade80' : '#f87171',
                  fontSize: '0.85rem'
                }}
              >
                {autoFeedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                <span>{autoFeedback.message}</span>
              </div>
            )}
          </div>
        ) : dataSourceType === 'manual' ? (
          <div>
            <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '15px' }}>
              Faça upload de todas as imagens que compõem este template. Elas serão salvas no banco de dados.
            </p>
            <div 
              style={{ 
                border: isDragging ? '2px dashed #4CAF50' : '2px dashed #b062eb', 
                padding: '40px 20px', 
                textAlign: 'center', 
                borderRadius: '12px', 
                cursor: 'pointer', 
                backgroundColor: isDragging ? 'rgba(76,175,80,0.1)' : 'rgba(176,98,235,0.05)', 
                marginBottom: '15px',
                transition: 'all 0.2s ease'
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isProcessing ? (
                <div style={{ color: '#b062eb', fontWeight: 'bold' }}>Processando imagens...</div>
              ) : (
                <>
                  <div style={{ color: '#ddd' }}>Clique aqui ou arraste múltiplas imagens do seu PC para cá</div>
                </>
              )}
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleItemsUpload} 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <button className="btn-secondary" onClick={handleItemUrl}>
                Ou adicionar Item por URL
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: '#161618', padding: '15px', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '15px' }}>
              Conecte a uma API JSON externa. As imagens não serão salvas no seu banco, e sim carregadas diretamente da API toda vez que a Tier List for aberta.
            </p>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="URL da API (ex: ...anime?page=[PAGE])" value={apiConfig.url} onChange={e => setApiConfig({...apiConfig, url: e.target.value})} style={{ flex: 1, minWidth: '300px', padding: '10px', borderRadius: '5px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff' }} />
                <input type="number" title="Quantas páginas buscar consecutivamente? (Use [PAGE] na URL)" placeholder="Páginas (Máx 20)" min="1" max="20" value={apiConfig.pagesToFetch || 1} onChange={e => setApiConfig({...apiConfig, pagesToFetch: parseInt(e.target.value) || 1})} style={{ width: '150px', padding: '10px', borderRadius: '5px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Caminho para a Lista (ex: data.items) [Deixe vazio se for na raiz]" value={apiConfig.arrayPath} onChange={e => setApiConfig({...apiConfig, arrayPath: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff' }} />
                <input type="text" placeholder="Campo do Nome (ex: ptName)" value={apiConfig.namePath} onChange={e => setApiConfig({...apiConfig, namePath: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff' }} />
                <input type="text" placeholder="Campo da Imagem (ex: CardImg)" value={apiConfig.imagePath} onChange={e => setApiConfig({...apiConfig, imagePath: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff' }} />
              </div>

              <div style={{ borderTop: '1px solid #333', marginTop: '10px', paddingTop: '10px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#b062eb' }}>Regras de Montagem da Imagem (Opcional)</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input type="text" placeholder="URL Base (ex: https://site.com/assets/)" value={apiConfig.imageBaseUrl} onChange={e => setApiConfig({...apiConfig, imageBaseUrl: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff' }} />
                  <input type="text" placeholder="Substituir (De) ex: UI_Gacha_" value={apiConfig.replaceFrom} onChange={e => setApiConfig({...apiConfig, replaceFrom: e.target.value})} style={{ width: '150px', padding: '10px', borderRadius: '5px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff' }} />
                  <input type="text" placeholder="Substituir (Para) ex: UI_" value={apiConfig.replaceTo} onChange={e => setApiConfig({...apiConfig, replaceTo: e.target.value})} style={{ width: '150px', padding: '10px', borderRadius: '5px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff' }} />
                  <input type="text" placeholder="Sufixo (ex: .webp)" value={apiConfig.imageSuffix} onChange={e => setApiConfig({...apiConfig, imageSuffix: e.target.value})} style={{ width: '120px', padding: '10px', borderRadius: '5px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff' }} />
                </div>
              </div>

              <button 
                onClick={handleTestApi} 
                disabled={isTestingApi}
                style={{ marginTop: '10px', padding: '10px', backgroundColor: '#ffd700', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: isTestingApi ? 'wait' : 'pointer' }}
              >
                {isTestingApi ? 'Lendo API...' : 'Testar Conexão com API'}
              </button>
            </div>
          </div>
        )}
      </div>
        
      {items.length > 0 && (
        <div className="control-card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Imagens ({items.length})</h3>
            <button onClick={handleReset} className="btn-danger outline" style={{ padding: '5px 15px' }}>Limpar Tudo</button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '400px', overflowY: 'auto', padding: '10px', backgroundColor: '#161618', borderRadius: '8px' }}>
            {items.map((item) => (
              <div key={item.id} style={{ position: 'relative' }}>
                <img src={item.src} alt={item.nome} title={item.nome} style={{ width: '80px', height: '80px', objectFit: 'contain', backgroundColor: '#2a2a2f', borderRadius: '5px' }} />
                <button 
                  onClick={() => setItems(items.filter(i => i.id !== item.id))}
                  style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  title="Remover Imagem"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="control-card" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#212124', borderRadius: '8px', textAlign: 'center', maxWidth: '400px', margin: '20px auto 0 auto' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Visibilidade do Modelo</h4>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button 
            className={isPublic ? 'btn-active' : 'btn-secondary'}
            onClick={() => setIsPublic(true)}
            style={{ padding: '8px 15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '160px' }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Público</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Vai para a Galeria</span>
          </button>
          <button 
            className={!isPublic ? 'btn-active' : 'btn-secondary'}
            onClick={() => setIsPublic(false)}
            style={{ padding: '8px 15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '160px' }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Privado</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Só no Meu Painel</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', marginBottom: '20px' }}>
        <button 
          onClick={handleSaveTemplate}
          className="btn-primary" 
          style={{ 
            padding: '14px 42px', 
            fontSize: '1.1rem', 
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: `0 4px 20px ${activeTheme?.accentGlow || 'rgba(176,98,235,0.4)'}`
          }}
        >
          <Check size={18} />
          {editTemplateId ? 'Salvar Alterações no Modelo' : 'Publicar Modelo na Galeria'}
        </button>
      </div>
    </div>
  );
}

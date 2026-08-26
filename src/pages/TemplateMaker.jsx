import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { confirmAction } from '../utils/alerts';
import TierBoard from '../components/TierBoard';
import { fetchAndParseAPI } from '../utils/apiParser';
import { processImage } from '../utils/imageProcessor';
import { TEMPLATE_CATEGORIES } from '../data/categories';
import { importAnimeCharacters, importMusic, autoImport } from '../utils/autoImporter';
import { Sparkles } from 'lucide-react';

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

  const [dataSourceType, setDataSourceType] = useState('manual'); // 'manual' ou 'api'
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
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);

  const handleRunAutoImport = async (type = 'auto') => {
    if (!autoQuery.trim()) {
      return toast.error('Digite o nome ou link do Anime/Artista primeiro!');
    }

    setIsAutoLoading(true);
    try {
      let result;
      if (type === 'anime') {
        result = await importAnimeCharacters(autoQuery);
      } else if (type === 'music') {
        result = await importMusic(autoQuery, 'album');
      } else {
        result = await autoImport(autoQuery);
      }

      setItems(result.items);
      if (!name) setName(result.title);
      if (!coverImage && result.cover) setCoverImage(result.cover);
      if (result.category) setCategory(result.category);

      toast.success(`🎉 ${result.items.length} itens importados com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Erro ao importar automaticamente.');
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
          toast.info("💡 Dica: Se a API não trouxe todos os itens, você poderá usar o botão 'Restaurar' na Tier List para continuar buscando.", { autoClose: 7000 });
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
      <div className="container" style={{ padding: '20px 15px', maxWidth: '520px', margin: '55px auto 20px', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ color: '#b062eb', marginBottom: '14px', fontSize: '1.4rem' }}>Acesso Restrito</h1>
        <div style={{ background: '#18181b', padding: '20px', borderRadius: '10px', border: '1px solid #28282e' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>🔒</div>
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
    <div className="container" style={{ padding: '10px 15px', maxWidth: '880px', margin: '55px auto 20px', color: '#fff' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '16px', color: '#b062eb', fontSize: '1.4rem' }}>Criador de Modelos</h1>
      
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
                {cat.icon} {cat.label}
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
                style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
              >✕</button>
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Sparkles size={14} /> ⚡ Importar por Link / Nome
            </button>
            <button 
              className={dataSourceType === 'api' ? 'btn-active' : 'btn-secondary'}
              onClick={() => setDataSourceType('api')}
            >API Customizada</button>
          </div>
        </div>

        {dataSourceType === 'auto' ? (
          <div style={{ background: '#161618', padding: '18px', borderRadius: '12px', border: '1px solid rgba(176,98,235,0.35)', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#b062eb' }}>
              <Sparkles size={20} />
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Importação Automática em 1 Clique</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#aaa', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Digite o nome de um <strong>Anime</strong> (ex: <em>Jujutsu Kaisen, Naruto, Bleach</em>) ou <strong>Artista/Música</strong> (ex: <em>The Weeknd, Taylor Swift, Travis Scott</em>) ou cole um link do AniList. Buscaremos todos os personagens e capas em alta definição!
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <input 
                type="text" 
                placeholder="Ex: Jujutsu Kaisen OU The Weeknd..." 
                value={autoQuery}
                onChange={(e) => setAutoQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRunAutoImport('auto'); }}
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '11px 16px',
                  borderRadius: '8px',
                  border: '1px solid #3a3a40',
                  backgroundColor: '#212124',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleRunAutoImport('anime')}
                disabled={isAutoLoading}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  cursor: isAutoLoading ? 'not-allowed' : 'pointer',
                  opacity: isAutoLoading ? 0.6 : 1
                }}
              >
                ⛩️ Importar Anime (AniList)
              </button>
              <button
                onClick={() => handleRunAutoImport('music')}
                disabled={isAutoLoading}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  cursor: isAutoLoading ? 'not-allowed' : 'pointer',
                  opacity: isAutoLoading ? 0.6 : 1
                }}
              >
                🎵 Importar Discografia (Música)
              </button>
              <button
                onClick={() => handleRunAutoImport('auto')}
                disabled={isAutoLoading}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  cursor: isAutoLoading ? 'not-allowed' : 'pointer',
                  opacity: isAutoLoading ? 0.6 : 1
                }}
              >
                ⚡ Auto Detectar
              </button>
            </div>

            {isAutoLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', color: '#b062eb', fontWeight: '600', fontSize: '0.9rem' }}>
                <span style={{ animation: 'spin 1s infinite linear' }}>⏳</span>
                <span>Consultando base de dados e baixando imagens em alta definição...</span>
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
                  style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer' }}
                >✕</button>
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

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
        <button 
          onClick={handleSaveTemplate}
          className="btn-primary" 
          style={{ padding: '15px 40px', fontSize: '1.2rem', background: 'linear-gradient(135deg, #b062eb, #7d3ba3)', boxShadow: '0 4px 15px rgba(176,98,235,0.4)' }}
        >
          {editTemplateId ? 'Atualizar Template' : 'Publicar Template'}
        </button>
      </div>
    </div>
  );
}

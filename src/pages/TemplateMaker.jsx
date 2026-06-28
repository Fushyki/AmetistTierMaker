import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TierBoard from '../components/TierBoard';
import { fetchAndParseAPI } from '../utils/apiParser';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  
  const [masterDimensions, setMasterDimensions] = useState(null);
  const [items, setItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [dataSourceType, setDataSourceType] = useState('manual'); // 'manual' ou 'api'
  const [apiConfig, setApiConfig] = useState({
    url: '',
    arrayPath: '',
    namePath: '',
    imagePath: '',
    imageBaseUrl: '',
    replaceFrom: '',
    replaceTo: '',
    imageSuffix: ''
  });
  const [isTestingApi, setIsTestingApi] = useState(false);
  
  const [layoutMode, setLayoutMode] = useState('classico');
  const [ranksData, setRanksData] = useState(initialRanksClassico);
  const colunas = layoutMode === 'classico' ? 1 : 3;

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // object-fit: cover helper via Canvas
  const processImage = (file, targetWidth, targetHeight) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const w = targetWidth || img.width;
          const h = targetHeight || img.height;
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = w;
          canvas.height = h;
          
          const scale = Math.max(w / img.width, h / img.height);
          const newW = img.width * scale;
          const newH = img.height * scale;
          const x = (w - newW) / 2;
          const y = (h - newH) / 2;
          
          ctx.drawImage(img, x, y, newW, newH);
          resolve({
            dataUrl: canvas.toDataURL('image/webp', 0.85),
            width: w,
            height: h
          });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      // 16:9 banner size standard (e.g. 600x338)
      const result = await processImage(file, 600, 338);
      setCoverImage(result.dataUrl);
    } catch (err) {
      alert("Erro ao processar a capa.");
    }
  };

  const handleItemsUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setIsProcessing(true);
    try {
      let currentMaster = masterDimensions;
      
      const newProcessedItems = [];
      
      for (const file of files) {
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
    } catch (err) {
      alert("Erro ao processar as imagens.");
    } finally {
      setIsProcessing(false);
    }
    
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm("Tem certeza que deseja apagar o banco de imagens atual?")) {
      setItems([]);
      setMasterDimensions(null);
    }
  };

  const handleLayoutChange = (newMode) => {
    if (layoutMode === newMode) return;
    if (confirm('Atenção: Mudar o modo limpará a estrutura atual de Tiers. Deseja continuar?')) {
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
    if (!apiConfig.url) return alert('Insira a URL da API primeiro.');
    setIsTestingApi(true);
    try {
      const apiItems = await fetchAndParseAPI(apiConfig);
      setItems(apiItems);
      alert(`Sucesso! API retornou ${apiItems.length} itens.`);
    } catch (error) {
      alert(`Erro ao ler API: ${error.message}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!user) return alert("Você precisa estar logado para publicar um template!");
    if (!name.trim()) return alert("Dê um nome para o template.");
    if (!coverImage) return alert("O template precisa de uma imagem de capa.");
    if (items.length === 0 && dataSourceType === 'manual') return alert("O template precisa de pelo menos 1 imagem.");
    if (items.length === 0 && dataSourceType === 'api') return alert("Teste a API primeiro para garantir que ela carrega os itens.");

    try {
      const templateDataPayload = {
        items: dataSourceType === 'manual' ? items : [], // Não salva os itens brutos no DB se for API
        apiConfig: dataSourceType === 'api' ? apiConfig : null,
        ranksData,
        layoutMode,
        colunas
      };

      const { data, error } = await supabase.from('templates').insert([{
        user_id: user.id,
        name: name.trim(),
        cover_image: coverImage,
        is_public: isPublic,
        data: templateDataPayload
      }]).select();

      if (error) throw error;
      
      alert("Template publicado com sucesso!");
      navigate(`/tierlist?templateId=${data[0].id}`);
    } catch (err) {
      console.error(err);
      alert("Erro ao publicar. Verifique se a tabela 'templates' existe no Supabase.");
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '40px 20px', maxWidth: '600px', margin: '100px auto', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ color: '#b062eb', marginBottom: '20px' }}>Acesso Restrito</h1>
        <div style={{ background: '#212124', padding: '30px', borderRadius: '12px', border: '1px solid #3a3a40' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔒</div>
          <h2 style={{ marginBottom: '15px' }}>Criar modelo é uma função exclusiva para membros</h2>
          <p style={{ color: '#aaa', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '30px' }}>
            Crie sua conta gratuitamente para salvar suas Tier Lists e criar seus templates, além de continuar editando elas de qualquer dispositivo, a qualquer momento.
          </p>
          <button 
            onClick={() => navigate('/login')}
            style={{ padding: '15px 30px', fontSize: '1.2rem', backgroundColor: '#ffd700', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Fazer Login / Criar Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#b062eb' }}>Criador de Modelos</h1>
      
      <div className="control-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3>Informações do Template</h3>
        <input 
          type="text" 
          placeholder="Nome do Template (ex: Animes Fall 2024)" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff' }}
        />
        
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
            <label className="btn-secondary" style={{ display: 'inline-block', cursor: 'pointer', marginTop: '10px' }}>
              Fazer Upload da Capa (16:9)
              <input type="file" accept="image/*" onChange={handleCoverUpload} ref={coverInputRef} style={{ display: 'none' }} />
            </label>
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
            layoutMode={layoutMode}
            onRemoveRow={handleRemoveRow}
            selectedItem={null}
            setSelectedItem={() => {}}
            onAreaClick={() => {}}
            onDoubleClickItem={() => {}}
            onMoveRow={handleMoveRow}
            onAddRow={handleAddRow}
            onUpdateRow={handleUpdateRow}
          />
        </div>
      </div>

      <div className="control-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>Banco de Imagens</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={dataSourceType === 'manual' ? 'btn-active' : 'btn-secondary'}
              onClick={() => setDataSourceType('manual')}
            >Upload Manual</button>
            <button 
              className={dataSourceType === 'api' ? 'btn-active' : 'btn-secondary'}
              onClick={() => setDataSourceType('api')}
            >API Customizada</button>
          </div>
        </div>

        {dataSourceType === 'manual' ? (
          <div>
            <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '15px' }}>
              Faça upload de todas as imagens que compõem este template. Elas serão salvas no banco de dados.
            </p>
            <div 
              style={{ border: '2px dashed #b062eb', padding: '40px 20px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer', backgroundColor: 'rgba(176,98,235,0.05)', marginBottom: '15px' }}
              onClick={() => fileInputRef.current?.click()}
            >
              {isProcessing ? (
                <div style={{ color: '#b062eb', fontWeight: 'bold' }}>Processando imagens...</div>
              ) : (
                <>
                  <div style={{ color: '#ddd' }}>Clique aqui para selecionar múltiplas imagens</div>
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
          </div>
        ) : (
          <div style={{ background: '#161618', padding: '15px', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '15px' }}>
              Conecte a uma API JSON externa. As imagens não serão salvas no seu banco, e sim carregadas diretamente da API toda vez que a Tier List for aberta.
            </p>
            <div style={{ display: 'grid', gap: '10px' }}>
              <input type="text" placeholder="URL da API (ex: https://api.exemplo.com/dados.json)" value={apiConfig.url} onChange={e => setApiConfig({...apiConfig, url: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff' }} />
              
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
            {items.map((item, index) => (
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
          Publicar Template
        </button>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TierBoard from '../components/TierBoard';

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
  
  const [layoutMode, setLayoutMode] = useState('classico');
  const [ranksData, setRanksData] = useState(initialRanksClassico);
  const colunas = layoutMode === 'classico' ? 1 : 3;

  useEffect(() => {
    if (!user) {
      alert("Faça login para criar templates!");
      navigate('/login');
    }
  }, [user, navigate]);

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

  const handleSaveTemplate = async () => {
    if (!user) return alert("Você precisa estar logado para publicar um template!");
    if (!name.trim()) return alert("Dê um nome para o template.");
    if (!coverImage) return alert("O template precisa de uma imagem de capa.");
    if (items.length === 0) return alert("O template precisa de pelo menos 1 imagem.");

    try {
      const templateDataPayload = {
        items,
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
        <h3>Banco de Imagens</h3>
        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '15px' }}>
          <strong>A Regra:</strong> A PRIMEIRA imagem que você upar ditará o tamanho exato e formato (aspect ratio) de todas as outras. Suba pacotes de imagens à vontade, elas serão padronizadas.
        </p>
        
        {masterDimensions && (
          <div style={{ padding: '10px', backgroundColor: 'rgba(176, 98, 235, 0.1)', borderRadius: '5px', marginBottom: '15px', color: '#b062eb' }}>
            Regra ativa: <strong>{masterDimensions.width}x{masterDimensions.height}px</strong>
          </div>
        )}

        <label className="btn-primary" style={{ display: 'inline-block', cursor: 'pointer', width: '100%', textAlign: 'center', padding: '15px', fontSize: '1.1rem' }}>
          {isProcessing ? 'Processando Imagens...' : '+ Adicionar Imagens aos Personagens'}
          <input type="file" accept="image/*" multiple onChange={handleItemsUpload} ref={fileInputRef} style={{ display: 'none' }} disabled={isProcessing} />
        </label>
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

      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', padding: '20px', backgroundColor: '#212124', borderRadius: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="visibility" 
              checked={isPublic} 
              onChange={() => setIsPublic(true)} 
            />
            Público (Aparece na Galeria Home)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginLeft: '20px' }}>
            <input 
              type="radio" 
              name="visibility" 
              checked={!isPublic} 
              onChange={() => setIsPublic(false)} 
            />
            Privado (Apenas no Meu Painel)
          </label>
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

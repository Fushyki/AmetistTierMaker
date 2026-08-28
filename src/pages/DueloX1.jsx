import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Swords, 
  Trophy, 
  Crown, 
  Sparkles, 
  RotateCcw, 
  ArrowLeft, 
  Layers, 
  Check, 
  Share2, 
  Search, 
  Zap, 
  ChevronRight,
  Flame
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../utils/notifications';
import '../styles/index.css';

export default function DueloX1() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeTheme } = useTheme();

  // Estados principais
  const [mode, setMode] = useState('x1'); // 'x1' (Mata-Mata Torneio) ou 'tierlist_battle' (Ranqueamento Completo)
  const [gameState, setGameState] = useState('select_template'); // 'select_template', 'playing', 'finished'
  const [loading, setLoading] = useState(false);

  // Modelos disponíveis para jogar
  const [templates, setTemplates] = useState([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [rawItems, setRawItems] = useState([]);

  // ESTADO DO MODO 1: DUELO X1 (MATA-MATA)
  const [tournamentRounds, setTournamentRounds] = useState([]); // Array de rodadas com partidas
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [nextRoundItems, setNextRoundItems] = useState([]);
  const [podium, setPodium] = useState({ champion: null, runnerUp: null, third: null });

  // ESTADO DO MODO 2: BATALHA TIER LIST (RANQUEAMENTO POR COMPARAÇÃO BINÁRIA)
  const [rankedList, setRankedList] = useState([]); // Itens já ordenados
  const [unrankedItems, setUnrankedItems] = useState([]); // Itens a inserir
  const [insertItem, setInsertItem] = useState(null); // Item sendo posicionado
  const [binaryRange, setBinaryRange] = useState({ low: 0, high: 0, mid: 0 }); // Limites da busca binária
  const [comparisonsDone, setComparisonsDone] = useState(0);
  const [estimatedComparisons, setEstimatedComparisons] = useState(1);
  const [generatedTierList, setGeneratedTierList] = useState(null);

  // Animação de seleção de carta
  const [selectedSide, setSelectedSide] = useState(null); // 'left' | 'right'

  // Carregar templates públicos do Supabase
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('id, name, cover_image, data')
          .eq('is_public', true)
          .neq('name', '__SYSTEM_ANNOUNCEMENT__')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setTemplates(data);
        }
      } catch (err) {
        console.error('Erro ao buscar templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Se veio com ?templateId= na URL, inicializa direto
  useEffect(() => {
    const templateId = searchParams.get('templateId');
    if (templateId && templates.length > 0) {
      const found = templates.find(t => t.id === templateId);
      if (found) {
        handleSelectTemplate(found);
      }
    }
  }, [searchParams, templates]);

  // Teclas de atalho para duelos rápidos (Seta Esquerda / Seta Direita / A / D)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === '1') {
        e.preventDefault();
        handlePickCard('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === '2') {
        e.preventDefault();
        handlePickCard('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, mode, tournamentRounds, currentRoundIndex, currentMatchIndex, nextRoundItems, insertItem, binaryRange, rankedList, unrankedItems]);

  // Função para inicializar o template selecionado
  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    let items = [];
    if (tpl.data) {
      if (Array.isArray(tpl.data.items)) {
        items = tpl.data.items;
      } else if (Array.isArray(tpl.data)) {
        items = tpl.data;
      }
    }
    if (!items || items.length < 3) {
      // Tenta ler do localStorage se for o template atual
      try {
        const localItems = JSON.parse(localStorage.getItem('tierlist-items') || '[]');
        if (localItems && localItems.length >= 3) {
          items = localItems;
        }
      } catch (e) {}
    }

    if (!items || items.length < 3) {
      toast.error('Este modelo possui poucas imagens para duelar.');
      return;
    }

    // Normaliza os itens
    const normalized = items.map((item, idx) => ({
      id: item.id || `duel-item-${idx}`,
      src: item.src || item.image || item.url,
      nome: item.nome || item.name || item.title || `Item ${idx + 1}`
    })).filter(i => i.src);

    setRawItems(normalized);
    startDuelSession(normalized, mode);
  };

  // Iniciar sessão de jogo
  const startDuelSession = (itemsList, selectedMode) => {
    const shuffled = [...itemsList].sort(() => Math.random() - 0.5);

    if (selectedMode === 'x1') {
      // Modo Mata-Mata Torneio
      // Ajusta para a potência de 2 mais próxima ou usa os primeiros 8, 16, 32 itens
      let count = shuffled.length;
      let power = 2;
      while (power * 2 <= count && power * 2 <= 32) {
        power *= 2;
      }
      const tournamentItems = shuffled.slice(0, power);

      const firstRoundMatches = [];
      for (let i = 0; i < tournamentItems.length; i += 2) {
        firstRoundMatches.push({
          itemA: tournamentItems[i],
          itemB: tournamentItems[i + 1] || tournamentItems[0]
        });
      }

      setTournamentRounds([firstRoundMatches]);
      setCurrentRoundIndex(0);
      setCurrentMatchIndex(0);
      setNextRoundItems([]);
      setPodium({ champion: null, runnerUp: null, third: null });
      setGameState('playing');
    } else {
      // Modo Batalha Tier List (Ranqueamento completo)
      // Algoritmo de Inserção Binária Interativa
      const first = shuffled[0];
      const rest = shuffled.slice(1);
      const nextInsert = rest[0];
      const remainingUnranked = rest.slice(1);

      setRankedList([first]);
      setUnrankedItems(remainingUnranked);
      setInsertItem(nextInsert);
      setBinaryRange({ low: 0, high: 1, mid: 0 }); // Comparar com o primeiro item
      setComparisonsDone(0);
      // Estimativa teórica de duelos: N * log2(N)
      setEstimatedComparisons(Math.round(shuffled.length * Math.log2(shuffled.length)));
      setGameState('playing');
    }
  };

  // Processar o voto no Duelo Atual
  const handlePickCard = (winnerSide) => {
    if (selectedSide !== null) return; // Evita duplo clique rápido
    setSelectedSide(winnerSide);

    setTimeout(() => {
      if (mode === 'x1') {
        processTournamentPick(winnerSide);
      } else {
        processTierListBattlePick(winnerSide);
      }
      setSelectedSide(null);
    }, 220);
  };

  // Processamento do Torneio X1
  const processTournamentPick = (winnerSide) => {
    const currentRound = tournamentRounds[currentRoundIndex];
    const currentMatch = currentRound[currentMatchIndex];
    const winner = winnerSide === 'left' ? currentMatch.itemA : currentMatch.itemB;
    const loser = winnerSide === 'left' ? currentMatch.itemB : currentMatch.itemA;

    const newNextItems = [...nextRoundItems, winner];

    // Se ainda há partidas nesta rodada
    if (currentMatchIndex + 1 < currentRound.length) {
      setNextRoundItems(newNextItems);
      setCurrentMatchIndex(prev => prev + 1);
    } else {
      // Rodada terminada!
      if (newNextItems.length === 1) {
        // FINALÍSSIMA TERMINADA -> TEMOS O CAMPEÃO!
        setPodium({
          champion: newNextItems[0],
          runnerUp: loser,
          third: currentRound.length === 2 ? loser : null
        });
        setGameState('finished');
      } else {
        // Monta a próxima rodada
        const nextRoundMatches = [];
        for (let i = 0; i < newNextItems.length; i += 2) {
          nextRoundMatches.push({
            itemA: newNextItems[i],
            itemB: newNextItems[i + 1]
          });
        }
        setTournamentRounds(prev => [...prev, nextRoundMatches]);
        setCurrentRoundIndex(prev => prev + 1);
        setCurrentMatchIndex(0);
        setNextRoundItems([]);
      }
    }
  };

  // Processamento da Batalha de Tier List
  const processTierListBattlePick = (winnerSide) => {
    setComparisonsDone(prev => prev + 1);
    const { low, high, mid } = binaryRange;
    const insertIsBetter = (winnerSide === 'left'); // Item novo está na esquerda

    let newLow = low;
    let newHigh = high;

    if (insertIsBetter) {
      newHigh = mid;
    } else {
      newLow = mid + 1;
    }

    if (newLow >= newHigh) {
      // Posição de inserção encontrada!
      const newRanked = [...rankedList];
      newRanked.splice(newLow, 0, insertItem);
      setRankedList(newRanked);

      if (unrankedItems.length > 0) {
        const next = unrankedItems[0];
        const rest = unrankedItems.slice(1);
        setInsertItem(next);
        setUnrankedItems(rest);
        setBinaryRange({
          low: 0,
          high: newRanked.length,
          mid: Math.floor(newRanked.length / 2)
        });
      } else {
        // Todos os itens foram ordenados com sucesso!
        finishTierListGeneration(newRanked);
      }
    } else {
      const nextMid = Math.floor((newLow + newHigh) / 2);
      setBinaryRange({
        low: newLow,
        high: newHigh,
        mid: nextMid
      });
    }
  };

  // Finalizar e gerar a Tier List automaticamente dividida por Tiers
  const finishTierListGeneration = (finalRanked) => {
    const total = finalRanked.length;
    // Distribuição inteligente por percentis
    const sCount = Math.max(1, Math.round(total * 0.15));
    const aCount = Math.max(1, Math.round(total * 0.25));
    const bCount = Math.max(1, Math.round(total * 0.30));
    const cCount = Math.max(1, Math.round(total * 0.20));

    const tiers = [
      { id: 'rank-s', nome: 'S', color: '#ff7f7f', items: finalRanked.slice(0, sCount) },
      { id: 'rank-a', nome: 'A', color: '#ffbf7f', items: finalRanked.slice(sCount, sCount + aCount) },
      { id: 'rank-b', nome: 'B', color: '#ffff7f', items: finalRanked.slice(sCount + aCount, sCount + aCount + bCount) },
      { id: 'rank-c', nome: 'C', color: '#7fff7f', items: finalRanked.slice(sCount + aCount + bCount, sCount + aCount + bCount + cCount) },
      { id: 'rank-d', nome: 'D', color: '#7fbfff', items: finalRanked.slice(sCount + aCount + bCount + cCount) }
    ];

    setGeneratedTierList(tiers);
    setGameState('finished');
  };

  // Abrir a Tier List gerada no tabuleiro oficial
  const handleOpenInTierlistBoard = () => {
    if (!generatedTierList) return;

    // Converte os itens para o formato do useTierlistState
    const placedItems = [];
    generatedTierList.forEach(tier => {
      tier.items.forEach(item => {
        placedItems.push({
          ...item,
          tierId: tier.id,
          colIndex: null
        });
      });
    });

    const ranksData = [
      {
        id: 'group-1',
        titulo: 'Principal',
        ranks: generatedTierList.map(t => ({
          id: t.id,
          label: t.nome,
          color: t.color
        }))
      }
    ];

    // Salva no localStorage para o Tierlist.jsx ler
    localStorage.setItem('tierlist-items', JSON.stringify(placedItems));
    localStorage.setItem('tierlist-ranks', JSON.stringify(ranksData));
    localStorage.setItem('tierlist-name', `${selectedTemplate?.name || 'Tier List'} (Ranqueada no Duelo)`);
    if (selectedTemplate?.id) {
      localStorage.setItem('tierlist-active-template-id', selectedTemplate.id);
    }
    localStorage.setItem('tierlist-force-cloud-load', 'false');

    toast.success('Tier List gerada! Abrindo tabuleiro...');
    navigate('/tierlist');
  };

  // Obter itens atuais do duelo
  let currentCardLeft = null;
  let currentCardRight = null;
  let roundTitle = '';
  let duelProgress = 0;

  if (gameState === 'playing') {
    if (mode === 'x1') {
      const round = tournamentRounds[currentRoundIndex];
      if (round && round[currentMatchIndex]) {
        currentCardLeft = round[currentMatchIndex].itemA;
        currentCardRight = round[currentMatchIndex].itemB;
      }
      const totalInRound = round ? round.length : 1;
      if (totalInRound === 1) roundTitle = 'Grande Final!';
      else if (totalInRound === 2) roundTitle = 'Semifinal';
      else if (totalInRound === 4) roundTitle = 'Quartas de Final';
      else roundTitle = `Oitavas de Final (${currentMatchIndex + 1}/${totalInRound})`;
      
      duelProgress = Math.round(((currentMatchIndex) / totalInRound) * 100);
    } else {
      currentCardLeft = insertItem;
      currentCardRight = rankedList[binaryRange.mid];
      roundTitle = `Duelo ${comparisonsDone + 1}`;
      duelProgress = Math.min(95, Math.round((comparisonsDone / Math.max(1, estimatedComparisons)) * 100));
    }
  }

  return (
    <div className="tierlist-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px 12px 60px 12px' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/" className="btn-secondary" style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Voltar
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Swords size={24} color={activeTheme?.accentColor || '#b062eb'} />
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>
              {mode === 'x1' ? 'Duelo X1: Mata-Mata' : 'Batalha Tier List'}
            </h1>
          </div>
        </div>

        {/* Alternador de Modo */}
        <div style={{ display: 'flex', background: '#16161c', padding: '4px', borderRadius: '12px', border: '1px solid #282832' }}>
          <button
            type="button"
            onClick={() => {
              setMode('x1');
              if (selectedTemplate) startDuelSession(rawItems, 'x1');
            }}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'x1' ? (activeTheme?.accentColor || '#b062eb') : 'transparent',
              color: mode === 'x1' ? '#fff' : '#888',
              fontWeight: '700',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <Trophy size={14} /> Torneio X1
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('tierlist_battle');
              if (selectedTemplate) startDuelSession(rawItems, 'tierlist_battle');
            }}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'tierlist_battle' ? (activeTheme?.accentColor || '#b062eb') : 'transparent',
              color: mode === 'tierlist_battle' ? '#fff' : '#888',
              fontWeight: '700',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <Layers size={14} /> Batalha Tier List
          </button>
        </div>
      </div>

      {/* TELA 1: SELEÇÃO DE MODELO */}
      {gameState === 'select_template' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="control-card" style={{ padding: '24px', textAlign: 'center', background: '#121216', border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.3)'}` }}>
            <Flame size={32} color={activeTheme?.accentColor || '#b062eb'} style={{ margin: '0 auto 10px auto' }} />
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', color: '#fff' }}>
              Escolha um Modelo para Iniciar os Duelos
            </h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', maxWidth: '550px', margin: '0 auto 20px auto', lineHeight: '1.4' }}>
              {mode === 'x1'
                ? 'Em cada rodada você escolhe o vencedor entre 2 cards até coroar o Grande Campeão Supremo do torneio!'
                : 'Compare itens 2 a 2 de forma rápida e divertida. O algoritmo inteligente vai calcular as notas e montar sua Tier List inteira automaticamente!'}
            </p>

            <div style={{ maxWidth: '400px', margin: '0 auto', position: 'relative' }}>
              <Search size={16} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Buscar modelo para duelar..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '24px',
                  border: '1px solid #333',
                  background: '#181820',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Grid de Modelos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
            {templates
              .filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()))
              .map(t => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  style={{
                    backgroundColor: '#16161a',
                    border: '1px solid #282832',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = activeTheme?.accentColor || '#b062eb';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#282832';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ width: '100%', height: '110px', backgroundColor: '#222', overflow: 'hidden' }}>
                    <img 
                      src={t.cover_image || 'https://via.placeholder.com/300x120?text=Ametist'} 
                      alt={t.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                  <div style={{ padding: '12px' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: activeTheme?.accentColor || '#b062eb', fontSize: '0.8rem', fontWeight: '700' }}>
                      <span>Jogar Duelo</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TELA 2: ARENA DE DUELO (JOGANDO) */}
      {gameState === 'playing' && currentCardLeft && currentCardRight && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          
          {/* Barra de Status & Progresso */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#121216', padding: '10px 18px', borderRadius: '12px', border: '1px solid #262630' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#888' }}>Modelo:</span>
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '700' }}>{selectedTemplate?.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: activeTheme?.accentColor || '#b062eb', fontWeight: '700' }}>
                {roundTitle}
              </span>
              <button 
                type="button" 
                onClick={() => setGameState('select_template')} 
                className="btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Trocar Modelo
              </button>
            </div>
          </div>

          {/* Dica de Teclado */}
          <div style={{ fontSize: '0.8rem', color: '#777', textAlign: 'center' }}>
            Clique na carta favorita ou use as teclas <span style={{ color: '#aaa', fontWeight: '700' }}>[Seta Esquerda / A]</span> e <span style={{ color: '#aaa', fontWeight: '700' }}>[Seta Direita / D]</span>
          </div>

          {/* ARENA DOS 2 CARDS (ESQUERDA VS DIREITA) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', width: '100%', flexWrap: 'wrap', margin: '10px 0' }}>
            
            {/* CARD 1 (ESQUERDA) */}
            <div
              onClick={() => handlePickCard('left')}
              style={{
                flex: '1 1 260px',
                maxWidth: '340px',
                minHeight: '380px',
                background: '#15151a',
                border: selectedSide === 'left' ? `3px solid ${activeTheme?.accentColor || '#b062eb'}` : '2px solid #282834',
                borderRadius: '18px',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: selectedSide === 'left' ? `0 0 30px ${activeTheme?.accentColor || '#b062eb'}77` : '0 10px 30px rgba(0,0,0,0.6)',
                transition: 'all 0.15s ease',
                transform: selectedSide === 'left' ? 'scale(1.03)' : 'scale(1)'
              }}
              onMouseEnter={e => {
                if (selectedSide === null) {
                  e.currentTarget.style.borderColor = activeTheme?.accentColor || '#b062eb';
                  e.currentTarget.style.transform = 'translateY(-6px)';
                }
              }}
              onMouseLeave={e => {
                if (selectedSide === null) {
                  e.currentTarget.style.borderColor = '#282834';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ width: '100%', height: '280px', backgroundColor: '#0e0e12', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={currentCardLeft.src} 
                  alt={currentCardLeft.nome} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: '10px' }}>
                  {currentCardLeft.nome}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.9rem', fontWeight: '700', borderRadius: '10px' }}
                >
                  Escolher Este
                </button>
              </div>
            </div>

            {/* SELO CENTRAL VS */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: activeTheme?.gradient || 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '900',
              fontSize: '1.1rem',
              boxShadow: `0 0 20px ${activeTheme?.accentGlow || 'rgba(176,98,235,0.4)'}`,
              flexShrink: 0,
              zIndex: 2
            }}>
              VS
            </div>

            {/* CARD 2 (DIREITA) */}
            <div
              onClick={() => handlePickCard('right')}
              style={{
                flex: '1 1 260px',
                maxWidth: '340px',
                minHeight: '380px',
                background: '#15151a',
                border: selectedSide === 'right' ? `3px solid ${activeTheme?.accentColor || '#b062eb'}` : '2px solid #282834',
                borderRadius: '18px',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: selectedSide === 'right' ? `0 0 30px ${activeTheme?.accentColor || '#b062eb'}77` : '0 10px 30px rgba(0,0,0,0.6)',
                transition: 'all 0.15s ease',
                transform: selectedSide === 'right' ? 'scale(1.03)' : 'scale(1)'
              }}
              onMouseEnter={e => {
                if (selectedSide === null) {
                  e.currentTarget.style.borderColor = activeTheme?.accentColor || '#b062eb';
                  e.currentTarget.style.transform = 'translateY(-6px)';
                }
              }}
              onMouseLeave={e => {
                if (selectedSide === null) {
                  e.currentTarget.style.borderColor = '#282834';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ width: '100%', height: '280px', backgroundColor: '#0e0e12', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={currentCardRight.src} 
                  alt={currentCardRight.nome} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: '10px' }}>
                  {currentCardRight.nome}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.9rem', fontWeight: '700', borderRadius: '10px' }}
                >
                  Escolher Este
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TELA 3: VITÓRIA / RESULTADO FINAL */}
      {gameState === 'finished' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>
          
          {/* RESULTADO DO MODO X1 (MATA-MATA) */}
          {mode === 'x1' && podium.champion && (
            <div className="control-card" style={{ width: '100%', padding: '30px', background: '#121216', border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.3)'}`, borderRadius: '20px' }}>
              <Crown size={42} color="#ffd700" style={{ margin: '0 auto 10px auto' }} />
              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', color: '#fff', fontWeight: '900' }}>
                CAMPEÃO SUPREMO!
              </h2>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '24px' }}>
                Após todas as rodadas do torneio eliminatório, este foi o grande vencedor escolhido por você:
              </p>

              {/* Card do Grande Campeão */}
              <div style={{
                maxWidth: '280px',
                margin: '0 auto 24px auto',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '3px solid #ffd700',
                boxShadow: '0 0 40px rgba(255, 215, 0, 0.4)',
                background: '#16161c'
              }}>
                <img 
                  src={podium.champion.src} 
                  alt={podium.champion.nome} 
                  style={{ width: '100%', height: '240px', objectFit: 'cover' }} 
                />
                <div style={{ padding: '14px', fontSize: '1.15rem', fontWeight: '800', color: '#fff' }}>
                  {podium.champion.nome}
                </div>
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => startDuelSession(rawItems, 'x1')}
                  className="btn-primary"
                  style={{ padding: '12px 24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <RotateCcw size={16} /> Jogar Novamente
                </button>
                <button
                  type="button"
                  onClick={() => setGameState('select_template')}
                  className="btn-secondary"
                  style={{ padding: '12px 20px', fontSize: '0.95rem' }}
                >
                  Escolher Outro Modelo
                </button>
              </div>
            </div>
          )}

          {/* RESULTADO DO MODO BATALHA TIER LIST */}
          {mode === 'tierlist_battle' && generatedTierList && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="control-card" style={{ padding: '24px', background: '#121216', textAlign: 'center', borderRadius: '16px', border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.3)'}` }}>
                <Sparkles size={32} color={activeTheme?.accentColor || '#b062eb'} style={{ margin: '0 auto 10px auto' }} />
                <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: '#fff', fontWeight: '800' }}>
                  Sua Tier List foi Gerada Automaticamente!
                </h2>
                <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0 0 20px 0' }}>
                  Com base em todas as suas escolhas, organizamos perfeitamente cada item no seu nível correspondente.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleOpenInTierlistBoard}
                    className="btn-primary"
                    style={{ padding: '12px 24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Layers size={16} /> Abrir no Tabuleiro de Tier List
                  </button>
                  <button
                    type="button"
                    onClick={() => startDuelSession(rawItems, 'tierlist_battle')}
                    className="btn-secondary"
                    style={{ padding: '12px 20px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <RotateCcw size={16} /> Refazer Duelos
                  </button>
                </div>
              </div>

              {/* Prévia da Tier List Gerada */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                {generatedTierList.map(tier => (
                  <div 
                    key={tier.id} 
                    style={{
                      display: 'flex',
                      backgroundColor: '#15151a',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #282832',
                      minHeight: '80px'
                    }}
                  >
                    {/* Header do Tier */}
                    <div style={{
                      width: '80px',
                      backgroundColor: tier.color,
                      color: '#000',
                      fontWeight: '900',
                      fontSize: '1.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {tier.nome}
                    </div>

                    {/* Itens do Tier */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', flex: 1, alignItems: 'center' }}>
                      {tier.items.map(item => (
                        <div key={item.id} style={{ width: '64px', height: '64px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#222' }} title={item.nome}>
                          <img src={item.src} alt={item.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

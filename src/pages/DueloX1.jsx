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
  Search, 
  Zap, 
  ChevronRight,
  Flame,
  GitBranch,
  XCircle,
  Clock,
  CheckCircle2,
  ListOrdered,
  Settings2,
  Sliders,
  Medal,
  Award
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../utils/notifications';
import { fetchAndParseAPI } from '../utils/apiParser';
import { autoImport } from '../utils/autoImporter';
import { saveUserChampion } from '../utils/likesManager';
import '../styles/index.css';

export default function DueloX1() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeTheme } = useTheme();

  // Estados principais
  const [mode, setMode] = useState('x1'); // 'x1' (Mata-Mata Torneio) ou 'tierlist_battle' (Ranqueamento Completo)
  const [gameState, setGameState] = useState('select_template'); // 'select_template', 'configure_tournament', 'playing', 'finished'
  const [loading, setLoading] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Modelos disponíveis para jogar
  const [templates, setTemplates] = useState([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [rawItems, setRawItems] = useState([]);
  const [selectedBracketSize, setSelectedBracketSize] = useState('all'); // '8', '16', '32', '64', '128', 'all'
  const [selectedBattleSize, setSelectedBattleSize] = useState('32'); // '16', '32', '64', '100', 'all'

  // ESTADO DO MODO 1: DUELO (MATA-MATA)
  const [tournamentRounds, setTournamentRounds] = useState([]); // Array de rodadas com partidas
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [nextRoundItems, setNextRoundItems] = useState([]);
  const [pendingByeItems, setPendingByeItems] = useState([]); // Itens que passaram direto da fase preliminar (byes)
  const [eliminatedItems, setEliminatedItems] = useState([]); // Array de itens eliminados com informações da fase
  const [semifinalLosers, setSemifinalLosers] = useState([]); // Perdedores das semifinais para definição do Top 3
  const [podium, setPodium] = useState({ champion: null, runnerUp: null, third: null });
  const [activeInspectorTab, setActiveInspectorTab] = useState('bracket'); // 'bracket', 'classified', 'eliminated'

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
  }, [gameState, mode, tournamentRounds, currentRoundIndex, currentMatchIndex, nextRoundItems, insertItem, binaryRange, rankedList, unrankedItems, selectedSide]);

  // Função para carregar o template selecionado e abrir tela de configuração de chaveamento
  const handleSelectTemplate = async (tpl) => {
    setSelectedTemplate(tpl);
    setLoadingTemplate(true);
    let items = [];

    try {
      if (tpl.data) {
        if (tpl.data.apiConfig) {
          try {
            items = await fetchAndParseAPI(tpl.data.apiConfig);
          } catch (err) {
            console.warn('Erro ao puxar da API do template:', err);
          }
        } else if (Array.isArray(tpl.data.items) && tpl.data.items.length > 0) {
          items = tpl.data.items;
        } else if (Array.isArray(tpl.data) && tpl.data.length > 0) {
          items = tpl.data;
        }
      }

      // Fallback inteligente caso não tenha retornado da API
      if (!items || items.length === 0) {
        const tplName = (tpl.name || '').toLowerCase();
        if (tplName.includes('genshin')) {
          const res = await autoImport('genshin');
          items = res?.items || [];
        } else if (tplName.includes('star rail') || tplName.includes('hsr')) {
          const res = await autoImport('hsr');
          items = res?.items || [];
        } else if (tplName.includes('brawl')) {
          const res = await autoImport('brawlstars');
          items = res?.items || [];
        } else if (tplName.includes('league') || tplName.includes('lol')) {
          const res = await autoImport('lol');
          items = res?.items || [];
        } else if (tplName.includes('pokémon') || tplName.includes('pokemon')) {
          const res = await autoImport('pokemon');
          items = res?.items || [];
        }
      }

      // Fallback local do tierlist se houver banco salvo
      if (!items || items.length < 3) {
        try {
          const localItems = JSON.parse(localStorage.getItem('tierlist-items') || '[]');
          if (localItems && localItems.length >= 3) {
            items = localItems;
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('Erro ao carregar dados do modelo:', err);
    } finally {
      setLoadingTemplate(false);
    }

    if (!items || items.length < 3) {
      toast.error('Este modelo possui poucas imagens para duelar.');
      return;
    }

    const normalized = items.map((item, idx) => ({
      id: item.id || `duel-item-${idx}`,
      src: item.src || item.image || item.url,
      nome: item.nome || item.name || item.title || `Item ${idx + 1}`
    })).filter(i => i.src);

    if (normalized.length < 3) {
      toast.error('Não foi possível carregar as imagens deste modelo.');
      return;
    }

    setRawItems(normalized);
    setSelectedBracketSize(normalized.length <= 16 ? 'all' : (normalized.length >= 32 ? '32' : '16'));
    setSelectedBattleSize(normalized.length <= 16 ? 'all' : (normalized.length >= 32 ? '32' : '16'));
    setGameState('configure_tournament');
  };

  // Nomes amigáveis para as fases do chaveamento
  const getRoundLabel = (matchesCount, isPreliminar = false) => {
    if (isPreliminar) return 'Fase Preliminar';
    if (matchesCount === 1) return 'Grande Final';
    if (matchesCount === 2) return 'Semifinais';
    if (matchesCount === 4) return 'Quartas de Final';
    if (matchesCount === 8) return 'Oitavas de Final';
    if (matchesCount === 16) return '16-avos de Final';
    if (matchesCount === 32) return '32-avos de Final';
    if (matchesCount === 64) return '64-avos de Final';
    return `Fase de ${matchesCount * 2}`;
  };

  // Iniciar sessão de jogo com o tamanho de chave escolhido
  const startDuelSession = (itemsList, selectedMode, sizeOption = (selectedMode === 'x1' ? selectedBracketSize : selectedBattleSize)) => {
    const shuffled = [...itemsList].sort(() => Math.random() - 0.5);

    if (selectedMode === 'x1') {
      let tournamentItems = [];
      let byes = [];
      let isPreliminar = false;

      if (sizeOption === 'all' || !sizeOption) {
        const total = shuffled.length;
        let p = 2;
        while (p * 2 <= total) {
          p *= 2;
        }

        if (total === p) {
          tournamentItems = shuffled;
        } else {
          const extra = total - p;
          const preliminarCount = extra * 2;
          const preliminarItems = shuffled.slice(0, preliminarCount);
          byes = shuffled.slice(preliminarCount);

          tournamentItems = preliminarItems;
          isPreliminar = true;
        }
      } else {
        const targetSize = parseInt(sizeOption, 10) || 16;
        tournamentItems = shuffled.slice(0, Math.min(targetSize, shuffled.length));
      }

      const firstRoundMatches = [];
      for (let i = 0; i < tournamentItems.length; i += 2) {
        firstRoundMatches.push({
          id: `match-0-${i / 2}`,
          itemA: tournamentItems[i],
          itemB: tournamentItems[i + 1] || tournamentItems[0],
          winner: null,
          loser: null,
          isPreliminar: isPreliminar
        });
      }

      setTournamentRounds([firstRoundMatches]);
      setCurrentRoundIndex(0);
      setCurrentMatchIndex(0);
      setNextRoundItems([]);
      setPendingByeItems(byes);
      setEliminatedItems([]);
      setSemifinalLosers([]);
      setPodium({ champion: null, runnerUp: null, third: null });
      setActiveInspectorTab('bracket');
      setGameState('playing');
    } else {
      // Modo Batalha Tier List (Ranqueamento por inserção binária)
      let battleItems = shuffled;
      if (sizeOption !== 'all' && sizeOption) {
        const targetSize = parseInt(sizeOption, 10) || 32;
        battleItems = shuffled.slice(0, Math.min(targetSize, shuffled.length));
      }

      const first = battleItems[0];
      const rest = battleItems.slice(1);
      const nextInsert = rest[0];
      const remainingUnranked = rest.slice(1);

      setRankedList([first]);
      setUnrankedItems(remainingUnranked);
      setInsertItem(nextInsert);
      setBinaryRange({ low: 0, high: 1, mid: 0 });
      setComparisonsDone(0);
      setEstimatedComparisons(Math.round(battleItems.length * Math.log2(battleItems.length)));
      setGameState('playing');
    }
  };

  // Processar o voto no Duelo Atual
  const handlePickCard = (winnerSide) => {
    if (selectedSide !== null) return;
    setSelectedSide(winnerSide);

    setTimeout(() => {
      if (mode === 'x1') {
        processTournamentPick(winnerSide);
      } else {
        processTierListBattlePick(winnerSide);
      }
      setSelectedSide(null);
    }, 280);
  };

  // Processamento do Torneio
  const processTournamentPick = (winnerSide) => {
    const currentRound = tournamentRounds[currentRoundIndex];
    const currentMatch = currentRound[currentMatchIndex];
    const winner = winnerSide === 'left' ? currentMatch.itemA : currentMatch.itemB;
    const loser = winnerSide === 'left' ? currentMatch.itemB : currentMatch.itemA;

    const roundName = getRoundLabel(currentRound.length, currentMatch.isPreliminar);

    // Registra o vencedor na partida atual
    currentMatch.winner = winner;
    currentMatch.loser = loser;

    // Registra o eliminado
    setEliminatedItems(prev => [
      ...prev,
      {
        ...loser,
        eliminatedIn: roundName,
        roundIndex: currentRoundIndex,
        lostTo: winner.nome
      }
    ]);

    // Rastreia perdedores das semifinais para definição do Top 3
    let currentSemiLosers = semifinalLosers;
    if (currentRound.length === 2 && !currentMatch.isPreliminar) {
      currentSemiLosers = [...semifinalLosers, loser];
      setSemifinalLosers(currentSemiLosers);
    }

    const newNextItems = [...nextRoundItems, winner];

    // Se ainda há partidas nesta rodada
    if (currentMatchIndex + 1 < currentRound.length) {
      setNextRoundItems(newNextItems);
      setCurrentMatchIndex(prev => prev + 1);
    } else {
      // Rodada terminada!
      // Se havia itens de "Bye" da fase preliminar, adiciona-os agora
      let combinedNextItems = [...newNextItems];
      if (pendingByeItems.length > 0) {
        combinedNextItems = [...combinedNextItems, ...pendingByeItems];
        setPendingByeItems([]);
      }

      if (combinedNextItems.length === 1) {
        // GRANDE FINAL TERMINADA -> TEMOS O CAMPEÃO E O PÓDIO TOP 3!
        const champ = combinedNextItems[0];
        const thirdPlace = currentSemiLosers.length > 0 ? currentSemiLosers[0] : null;
        
        setPodium({
          champion: champ,
          runnerUp: loser,
          third: thirdPlace,
          semifinalists: currentSemiLosers
        });

        if (user?.id) {
          saveUserChampion(user.id, {
            champion: champ,
            templateName: selectedTemplate?.name,
            templateId: selectedTemplate?.id,
            bracketSize: selectedBracketSize
          });
        }

        setGameState('finished');
      } else {
        // Monta a próxima rodada
        const nextRoundMatches = [];
        for (let i = 0; i < combinedNextItems.length; i += 2) {
          nextRoundMatches.push({
            id: `match-${currentRoundIndex + 1}-${i / 2}`,
            itemA: combinedNextItems[i],
            itemB: combinedNextItems[i + 1],
            winner: null,
            loser: null,
            isPreliminar: false
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
    const insertIsBetter = (winnerSide === 'left');

    let newLow = low;
    let newHigh = high;

    if (insertIsBetter) {
      newHigh = mid;
    } else {
      newLow = mid + 1;
    }

    if (newLow >= newHigh) {
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

  // Finalizar e gerar a Tier List automaticamente
  const finishTierListGeneration = (finalRanked) => {
    const total = finalRanked.length;
    const sCount = Math.max(1, Math.round(total * 0.15));
    const aCount = Math.max(1, Math.round(total * 0.25));
    const bCount = Math.max(1, Math.round(total * 0.30));
    const cCount = Math.max(1, Math.round(total * 0.20));

    const tiers = [
      { id: 'tier-1', l: 'S', c: 's-rank', bgColor: '#ff7f7f', items: finalRanked.slice(0, sCount) },
      { id: 'tier-2', l: 'A', c: 'a-rank', bgColor: '#ffbf7f', items: finalRanked.slice(sCount, sCount + aCount) },
      { id: 'tier-3', l: 'B', c: 'b-rank', bgColor: '#ffff7f', items: finalRanked.slice(sCount + aCount, sCount + aCount + bCount) },
      { id: 'tier-4', l: 'C', c: 'c-rank', bgColor: '#7fff7f', items: finalRanked.slice(sCount + aCount + bCount, sCount + aCount + bCount + cCount) },
      { id: 'tier-5', l: 'D', c: 'd-rank', bgColor: '#7fbfff', items: finalRanked.slice(sCount + aCount + bCount + cCount) }
    ];

    setGeneratedTierList(tiers);
    setGameState('finished');
  };

  // Abrir a Tier List gerada no tabuleiro oficial
  const handleOpenInTierlistBoard = () => {
    if (!generatedTierList) return;

    const placedItems = [];
    generatedTierList.forEach(tier => {
      tier.items.forEach(item => {
        placedItems.push({
          id: item.id || `duel-item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          src: item.src || item.image || item.url,
          nome: item.nome || item.name || 'Item',
          tierId: tier.id,
          colIndex: 0,
          uploadIndex: Date.now()
        });
      });
    });

    const ranksData = [
      {
        id: 'group-1',
        titulo: 'TIER LIST',
        ranks: generatedTierList.map(t => ({
          id: t.id,
          l: t.l,
          c: t.c,
          bgColor: t.bgColor
        }))
      }
    ];

    localStorage.setItem('tierlist-items', JSON.stringify(placedItems));
    localStorage.setItem('tierlist-ranks', JSON.stringify(ranksData));
    localStorage.setItem('tierlist-layout', 'classico');
    localStorage.setItem('tierlist-colunas', '1');
    localStorage.setItem('tierlist-name', `${selectedTemplate?.name || 'Tier List'} (Ranqueada na Batalha)`);
    localStorage.setItem('tierlist-api-loaded', 'true');
    localStorage.setItem('tierlist-force-cloud-load', 'false');
    localStorage.removeItem('tierlist-current-id');
    if (selectedTemplate?.id) {
      localStorage.setItem('tierlist-active-template-id', selectedTemplate.id);
    }

    toast.success('Tier List gerada com sucesso! Abrindo tabuleiro...');
    navigate('/tierlist?battle=true');
  };

  // Obter dados do duelo atual
  let currentCardLeft = null;
  let currentCardRight = null;
  let roundTitle = '';
  let roundMatchesTotal = 1;

  if (gameState === 'playing') {
    if (mode === 'x1') {
      const round = tournamentRounds[currentRoundIndex];
      if (round && round[currentMatchIndex]) {
        currentCardLeft = round[currentMatchIndex].itemA;
        currentCardRight = round[currentMatchIndex].itemB;
        roundTitle = getRoundLabel(round.length, round[currentMatchIndex].isPreliminar);
      }
      roundMatchesTotal = round ? round.length : 1;
    } else {
      currentCardLeft = insertItem;
      currentCardRight = rankedList[binaryRange.mid];
      roundTitle = `Comparação ${comparisonsDone + 1}`;
    }
  }

  // Gera a lista de fases estimadas para a barra de etapas do torneio
  const getTournamentStages = () => {
    if (!tournamentRounds || tournamentRounds.length === 0) return [];
    return tournamentRounds.map((rd, idx) => ({
      index: idx,
      size: rd.length,
      label: getRoundLabel(rd.length, rd[0]?.isPreliminar),
      isCompleted: idx < currentRoundIndex,
      isCurrent: idx === currentRoundIndex
    }));
  };

  const tournamentStages = getTournamentStages();

  return (
    <div className="tierlist-container" style={{ maxWidth: '1020px', margin: '0 auto', padding: '16px 12px 60px 12px' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/" className="btn-secondary" style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Início
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Swords size={24} color={activeTheme?.accentColor || '#b062eb'} />
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800', color: '#fff' }}>
              {mode === 'x1' ? 'Duelo: Mata-Mata' : 'Batalha Tier List'}
            </h1>
          </div>
        </div>

        {/* Alternador de Modo */}
        <div style={{ display: 'flex', background: '#16161c', padding: '4px', borderRadius: '12px', border: '1px solid #282832' }}>
          <button
            type="button"
            onClick={() => {
              setMode('x1');
              if (selectedTemplate && rawItems.length > 0) {
                setGameState('configure_tournament');
              }
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
            <Trophy size={14} /> Torneio Mata-Mata
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('tierlist_battle');
              if (selectedTemplate && rawItems.length > 0) {
                setGameState('configure_tournament');
              }
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
            <p style={{ color: '#aaa', fontSize: '0.88rem', maxWidth: '550px', margin: '0 auto 20px auto', lineHeight: '1.4' }}>
              {mode === 'x1'
                ? 'Em cada rodada você escolhe o vencedor entre 2 cartas. Escolha quantas chaves deseja jogar ou dispute com todas as imagens do modelo!'
                : 'Compare itens 2 a 2 de forma rápida. O algoritmo inteligente calcula as notas e monta sua Tier List inteira automaticamente!'}
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
          {loadingTemplate ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: activeTheme?.accentColor || '#b062eb', fontWeight: '800', fontSize: '1.05rem', background: '#141419', borderRadius: '16px', border: '1px solid #282834' }}>
              Carregando personagens e imagens do modelo...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {templates
                .filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()))
                .map(t => (
                  <div
                    key={t.id}
                    onClick={() => !loadingTemplate && handleSelectTemplate(t)}
                    style={{
                      backgroundColor: '#16161a',
                      border: '1px solid #282832',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: loadingTemplate ? 'wait' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                      opacity: loadingTemplate ? 0.6 : 1
                    }}
                    onMouseEnter={e => {
                      if (!loadingTemplate) {
                        e.currentTarget.style.borderColor = activeTheme?.accentColor || '#b062eb';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!loadingTemplate) {
                        e.currentTarget.style.borderColor = '#282832';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
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
                        <span>Configurar Duelo</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TELA DE CONFIGURAÇÃO DE CHAVEAMENTO (SELEÇÃO DE QUANTIDADE DE CHAVES) */}
      {gameState === 'configure_tournament' && selectedTemplate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px', margin: '0 auto' }}>
          <div className="control-card" style={{ padding: '28px', background: '#121216', borderRadius: '18px', border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.35)'}`, boxShadow: '0 12px 35px rgba(0,0,0,0.6)' }}>
            
            {/* Header do Modelo Selecionado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', borderBottom: '1px solid #252530', paddingBottom: '16px' }}>
              <img 
                src={selectedTemplate.cover_image || 'https://via.placeholder.com/100'} 
                alt="" 
                style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #333' }} 
              />
              <div>
                <span style={{ fontSize: '0.75rem', color: activeTheme?.accentColor || '#b062eb', fontWeight: '700', textTransform: 'uppercase' }}>
                  Modelo Selecionado
                </span>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', color: '#fff', fontWeight: '800' }}>
                  {selectedTemplate.name}
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#888' }}>
                  {rawItems.length} imagens disponíveis
                </span>
              </div>
            </div>

            {/* MODO TORNEIO: SELETOR DE TAMANHO DE CHAVEAMENTO */}
            {mode === 'x1' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings2 size={16} color={activeTheme?.accentColor || '#b062eb'} />
                  <span style={{ fontSize: '0.92rem', color: '#fff', fontWeight: '800' }}>
                    Escolha a Quantidade de Participantes (Chaves):
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {/* Opção: 8 Participantes */}
                  {rawItems.length >= 8 && (
                    <button
                      type="button"
                      onClick={() => setSelectedBracketSize('8')}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: selectedBracketSize === '8' ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #282834',
                        background: selectedBracketSize === '8' ? `${activeTheme?.accentColor || '#b062eb'}22` : '#16161c',
                        color: selectedBracketSize === '8' ? '#fff' : '#aaa',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', color: selectedBracketSize === '8' ? (activeTheme?.accentColor || '#b062eb') : '#fff' }}>8 Chaves</div>
                      <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>7 Duelos (Rápido)</div>
                    </button>
                  )}

                  {/* Opção: 16 Participantes */}
                  {rawItems.length >= 16 && (
                    <button
                      type="button"
                      onClick={() => setSelectedBracketSize('16')}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: selectedBracketSize === '16' ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #282834',
                        background: selectedBracketSize === '16' ? `${activeTheme?.accentColor || '#b062eb'}22` : '#16161c',
                        color: selectedBracketSize === '16' ? '#fff' : '#aaa',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', color: selectedBracketSize === '16' ? (activeTheme?.accentColor || '#b062eb') : '#fff' }}>16 Chaves</div>
                      <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>15 Duelos (Padrão)</div>
                    </button>
                  )}

                  {/* Opção: 32 Participantes */}
                  {rawItems.length >= 32 && (
                    <button
                      type="button"
                      onClick={() => setSelectedBracketSize('32')}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: selectedBracketSize === '32' ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #282834',
                        background: selectedBracketSize === '32' ? `${activeTheme?.accentColor || '#b062eb'}22` : '#16161c',
                        color: selectedBracketSize === '32' ? '#fff' : '#aaa',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', color: selectedBracketSize === '32' ? (activeTheme?.accentColor || '#b062eb') : '#fff' }}>32 Chaves</div>
                      <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>31 Duelos (Médio)</div>
                    </button>
                  )}

                  {/* Opção: 64 Participantes */}
                  {rawItems.length >= 64 && (
                    <button
                      type="button"
                      onClick={() => setSelectedBracketSize('64')}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: selectedBracketSize === '64' ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #282834',
                        background: selectedBracketSize === '64' ? `${activeTheme?.accentColor || '#b062eb'}22` : '#16161c',
                        color: selectedBracketSize === '64' ? '#fff' : '#aaa',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', color: selectedBracketSize === '64' ? (activeTheme?.accentColor || '#b062eb') : '#fff' }}>64 Chaves</div>
                      <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>63 Duelos (Grande)</div>
                    </button>
                  )}

                  {/* Opção: 128 Participantes */}
                  {rawItems.length >= 128 && (
                    <button
                      type="button"
                      onClick={() => setSelectedBracketSize('128')}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: selectedBracketSize === '128' ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #282834',
                        background: selectedBracketSize === '128' ? `${activeTheme?.accentColor || '#b062eb'}22` : '#16161c',
                        color: selectedBracketSize === '128' ? '#fff' : '#aaa',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', color: selectedBracketSize === '128' ? (activeTheme?.accentColor || '#b062eb') : '#fff' }}>128 Chaves</div>
                      <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>127 Duelos (Épico)</div>
                    </button>
                  )}

                  {/* Opção: Todas as Imagens */}
                  <button
                    type="button"
                    onClick={() => setSelectedBracketSize('all')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: selectedBracketSize === 'all' ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #282834',
                      background: selectedBracketSize === 'all' ? `${activeTheme?.accentColor || '#b062eb'}22` : '#16161c',
                      color: selectedBracketSize === 'all' ? '#fff' : '#aaa',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                      gridColumn: rawItems.length < 8 ? 'span 2' : 'auto'
                    }}
                  >
                    <div style={{ fontSize: '1.1rem', color: selectedBracketSize === 'all' ? (activeTheme?.accentColor || '#b062eb') : '#fff' }}>
                      Todas ({rawItems.length})
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>{rawItems.length - 1} Duelos</div>
                  </button>
                </div>

                <div style={{ background: '#17171f', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', color: '#aaa', border: '1px solid #24242e', lineHeight: '1.4' }}>
                  {selectedBracketSize === 'all' ? (
                    rawItems.length > 128 ? (
                      <span style={{ color: '#fca5a5' }}>
                        Atenção: Este modelo possui <strong>{rawItems.length} imagens</strong> (total de {rawItems.length - 1} duelos para chegar ao campeão). Se preferir uma partida rápida, selecione 16, 32 ou 64 chaves acima!
                      </span>
                    ) : (
                      `O torneio incluirá todas as ${rawItems.length} imagens (${rawItems.length - 1} duelos totais com fase qualificatória automática).`
                    )
                  ) : (
                    `Serão sorteadas aleatoriamente ${selectedBracketSize} imagens deste modelo para disputar o chaveamento eliminatório.`
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings2 size={16} color={activeTheme?.accentColor || '#b062eb'} />
                  <span style={{ fontSize: '0.92rem', color: '#fff', fontWeight: '800' }}>
                    Escolha a Quantidade de Itens para a Batalha:
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {/* 16 Itens */}
                  {rawItems.length >= 16 && (
                    <button
                      type="button"
                      onClick={() => setSelectedBattleSize('16')}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: selectedBattleSize === '16' ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #282834',
                        background: selectedBattleSize === '16' ? `${activeTheme?.accentColor || '#b062eb'}22` : '#16161c',
                        color: selectedBattleSize === '16' ? '#fff' : '#aaa',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', color: selectedBattleSize === '16' ? (activeTheme?.accentColor || '#b062eb') : '#fff' }}>16 Itens</div>
                      <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>~60 Duelos (Rápido)</div>
                    </button>
                  )}

                  {/* 32 Itens */}
                  {rawItems.length >= 32 && (
                    <button
                      type="button"
                      onClick={() => setSelectedBattleSize('32')}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: selectedBattleSize === '32' ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #282834',
                        background: selectedBattleSize === '32' ? `${activeTheme?.accentColor || '#b062eb'}22` : '#16161c',
                        color: selectedBattleSize === '32' ? '#fff' : '#aaa',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', color: selectedBattleSize === '32' ? (activeTheme?.accentColor || '#b062eb') : '#fff' }}>32 Itens</div>
                      <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>~150 Duelos (Ideal)</div>
                    </button>
                  )}

                  {/* 64 Itens */}
                  {rawItems.length >= 64 && (
                    <button
                      type="button"
                      onClick={() => setSelectedBattleSize('64')}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: selectedBattleSize === '64' ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #282834',
                        background: selectedBattleSize === '64' ? `${activeTheme?.accentColor || '#b062eb'}22` : '#16161c',
                        color: selectedBattleSize === '64' ? '#fff' : '#aaa',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', color: selectedBattleSize === '64' ? (activeTheme?.accentColor || '#b062eb') : '#fff' }}>64 Itens</div>
                      <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>~360 Duelos</div>
                    </button>
                  )}

                  {/* Todas as Imagens */}
                  <button
                    type="button"
                    onClick={() => setSelectedBattleSize('all')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: selectedBattleSize === 'all' ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #282834',
                      background: selectedBattleSize === 'all' ? `${activeTheme?.accentColor || '#b062eb'}22` : '#16161c',
                      color: selectedBattleSize === 'all' ? '#fff' : '#aaa',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                      gridColumn: rawItems.length < 16 ? 'span 2' : 'auto'
                    }}
                  >
                    <div style={{ fontSize: '1.1rem', color: selectedBattleSize === 'all' ? (activeTheme?.accentColor || '#b062eb') : '#fff' }}>
                      Todas ({rawItems.length})
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>
                      ~{Math.round(rawItems.length * Math.log2(rawItems.length)).toLocaleString()} Duelos
                    </div>
                  </button>
                </div>

                <div style={{ background: '#17171f', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', color: '#aaa', border: '1px solid #24242e', lineHeight: '1.4' }}>
                  {selectedBattleSize === 'all' ? (
                    rawItems.length > 80 ? (
                      <span style={{ color: '#fca5a5' }}>
                        Atenção: Ordenar 100% de {rawItems.length} imagens comparando 2 a 2 requer aproximadamente {Math.round(rawItems.length * Math.log2(rawItems.length)).toLocaleString()} duelos! Recomendamos selecionar 16 ou 32 itens para gerar a Tier List em poucos minutos.
                      </span>
                    ) : (
                      `O algoritmo binário comparará todas as ${rawItems.length} imagens para posicioná-las perfeitamente nos Tiers S, A, B, C e D.`
                    )
                  ) : (
                    `Serão sorteadas ${selectedBattleSize} imagens para você comparar e classificar diretamente nos Tiers.`
                  )}
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setGameState('select_template')}
                className="btn-secondary"
                style={{ padding: '11px 18px', fontSize: '0.9rem' }}
              >
                Trocar Modelo
              </button>
              <button
                type="button"
                onClick={() => startDuelSession(rawItems, mode, mode === 'x1' ? selectedBracketSize : selectedBattleSize)}
                className="btn-primary"
                style={{ padding: '11px 24px', fontSize: '0.95rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Swords size={16} /> Iniciar Duelos Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TELA 2: ARENA DE DUELO (JOGANDO) */}
      {gameState === 'playing' && currentCardLeft && currentCardRight && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* BARRA DE FASES & ETAPAS DO CHAVEAMENTO */}
          {mode === 'x1' && (
            <div style={{ background: '#131317', border: '1px solid #282832', borderRadius: '14px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GitBranch size={16} color={activeTheme?.accentColor || '#b062eb'} />
                  <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '800' }}>
                    Fase Atual: <span style={{ color: activeTheme?.accentColor || '#b062eb' }}>{roundTitle}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#aaa', fontWeight: '600' }}>
                    Duelo <span style={{ color: '#fff', fontWeight: '800' }}>{currentMatchIndex + 1}</span> de <span style={{ color: '#fff', fontWeight: '800' }}>{roundMatchesTotal}</span>
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setGameState('configure_tournament')} 
                    className="btn-secondary" 
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    Ajustar Chaves
                  </button>
                </div>
              </div>

              {/* Linha do Tempo / Etapas da Copa */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {tournamentStages.map((stg) => (
                  <div
                    key={stg.index}
                    style={{
                      flex: 1,
                      minWidth: '110px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: stg.isCurrent 
                        ? `${activeTheme?.accentColor || '#b062eb'}22` 
                        : stg.isCompleted 
                          ? '#182418' 
                          : '#17171c',
                      border: stg.isCurrent 
                        ? `1.5px solid ${activeTheme?.accentColor || '#b062eb'}` 
                        : stg.isCompleted 
                          ? '1px solid #22c55e44' 
                          : '1px solid #24242c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {stg.isCompleted ? (
                      <CheckCircle2 size={14} color="#22c55e" />
                    ) : stg.isCurrent ? (
                      <Flame size={14} color={activeTheme?.accentColor || '#b062eb'} />
                    ) : (
                      <Clock size={14} color="#666" />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', color: stg.isCurrent ? '#fff' : stg.isCompleted ? '#4ade80' : '#777', fontWeight: stg.isCurrent ? '800' : '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stg.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dica de Teclado */}
          <div style={{ fontSize: '0.8rem', color: '#777', textAlign: 'center' }}>
            Clique na carta que você prefere ou use as teclas <span style={{ color: '#aaa', fontWeight: '700' }}>[Seta Esquerda / A]</span> e <span style={{ color: '#aaa', fontWeight: '700' }}>[Seta Direita / D]</span>
          </div>

          {/* ARENA DOS 2 CARDS (ESQUERDA VS DIREITA) */}
          <div className="duel-arena-grid">
            
            {/* CARD 1 (ESQUERDA) */}
            <div
              className="duel-card"
              onClick={() => handlePickCard('left')}
              style={{
                borderColor: selectedSide === 'left' ? (activeTheme?.accentColor || '#b062eb') : '#282834',
                boxShadow: selectedSide === 'left' ? `0 0 35px ${activeTheme?.accentColor || '#b062eb'}88` : '0 10px 30px rgba(0,0,0,0.6)',
                transform: selectedSide === 'left' ? 'scale(1.03)' : 'scale(1)'
              }}
              onMouseEnter={e => {
                if (selectedSide === null) {
                  e.currentTarget.style.borderColor = activeTheme?.accentColor || '#b062eb';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }
              }}
              onMouseLeave={e => {
                if (selectedSide === null) {
                  e.currentTarget.style.borderColor = '#282834';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div className="duel-card-img-box">
                <img 
                  src={currentCardLeft.src} 
                  alt="" 
                  aria-hidden="true"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px)', opacity: 0.35, transform: 'scale(1.15)' }} 
                />
                <img 
                  src={currentCardLeft.src} 
                  alt={currentCardLeft.nome} 
                  style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} 
                />
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                <div style={{ fontSize: '0.98rem', fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentCardLeft.nome}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.88rem', fontWeight: '700', borderRadius: '10px' }}
                >
                  Escolher Este
                </button>
              </div>
            </div>

            {/* SELO CENTRAL VS */}
            <div className="duel-vs-badge" style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: activeTheme?.gradient || 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '900',
              fontSize: '1.1rem',
              boxShadow: `0 0 24px ${activeTheme?.accentGlow || 'rgba(176,98,235,0.45)'}`,
              flexShrink: 0,
              zIndex: 2
            }}>
              VS
            </div>

            {/* CARD 2 (DIREITA) */}
            <div
              className="duel-card"
              onClick={() => handlePickCard('right')}
              style={{
                borderColor: selectedSide === 'right' ? (activeTheme?.accentColor || '#b062eb') : '#282834',
                boxShadow: selectedSide === 'right' ? `0 0 35px ${activeTheme?.accentColor || '#b062eb'}88` : '0 10px 30px rgba(0,0,0,0.6)',
                transform: selectedSide === 'right' ? 'scale(1.03)' : 'scale(1)'
              }}
              onMouseEnter={e => {
                if (selectedSide === null) {
                  e.currentTarget.style.borderColor = activeTheme?.accentColor || '#b062eb';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }
              }}
              onMouseLeave={e => {
                if (selectedSide === null) {
                  e.currentTarget.style.borderColor = '#282834';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div className="duel-card-img-box">
                <img 
                  src={currentCardRight.src} 
                  alt="" 
                  aria-hidden="true"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px)', opacity: 0.35, transform: 'scale(1.15)' }} 
                />
                <img 
                  src={currentCardRight.src} 
                  alt={currentCardRight.nome} 
                  style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} 
                />
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                <div style={{ fontSize: '0.98rem', fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentCardRight.nome}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.88rem', fontWeight: '700', borderRadius: '10px' }}
                >
                  Escolher Este
                </button>
              </div>
            </div>
          </div>

          {/* PAINEL INFORMATIVO DO TORNEIO: CHAVEAMENTO, CLASSIFICADOS E ELIMINADOS */}
          {mode === 'x1' && (
            <div className="control-card" style={{ padding: '16px', background: '#121216', border: '1px solid #282834', borderRadius: '14px', marginTop: '8px' }}>
              
              {/* Abas do Painel */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #25252e', paddingBottom: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('bracket')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeInspectorTab === 'bracket' ? (activeTheme?.accentColor || '#b062eb') : '#181820',
                    color: activeInspectorTab === 'bracket' ? '#fff' : '#888',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <GitBranch size={14} /> Duelos da Rodada ({tournamentRounds[currentRoundIndex]?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('classified')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeInspectorTab === 'classified' ? '#22c55e' : '#181820',
                    color: activeInspectorTab === 'classified' ? '#fff' : '#888',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={14} /> Classificados para a Próxima Fase ({nextRoundItems.length + pendingByeItems.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('eliminated')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeInspectorTab === 'eliminated' ? '#ef4444' : '#181820',
                    color: activeInspectorTab === 'eliminated' ? '#fff' : '#888',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <XCircle size={14} /> Cartas Eliminadas ({eliminatedItems.length})
                </button>
              </div>

              {/* CONTEÚDO 1: DUELOS DA RODADA ATUAL */}
              {activeInspectorTab === 'bracket' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                  {tournamentRounds[currentRoundIndex]?.map((match, idx) => {
                    const isCurrent = idx === currentMatchIndex;
                    const isDone = match.winner !== null;
                    return (
                      <div
                        key={match.id || idx}
                        style={{
                          background: isCurrent ? `${activeTheme?.accentColor || '#b062eb'}18` : '#16161c',
                          border: isCurrent ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #282832',
                          borderRadius: '10px',
                          padding: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          opacity: isDone ? 0.6 : 1
                        }}
                      >
                        {/* Item A */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                          <img src={match.itemA?.src} alt="" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                          <span style={{ fontSize: '0.78rem', color: match.winner?.id === match.itemA?.id ? '#4ade80' : '#fff', fontWeight: match.winner?.id === match.itemA?.id ? '800' : '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {match.itemA?.nome}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: '800' }}>VS</span>

                        {/* Item B */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.78rem', color: match.winner?.id === match.itemB?.id ? '#4ade80' : '#fff', fontWeight: match.winner?.id === match.itemB?.id ? '800' : '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
                            {match.itemB?.nome}
                          </span>
                          <img src={match.itemB?.src} alt="" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CONTEÚDO 2: CLASSIFICADOS PARA A PRÓXIMA FASE */}
              {activeInspectorTab === 'classified' && (
                <div>
                  {nextRoundItems.length === 0 && pendingByeItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px', color: '#777', fontSize: '0.85rem' }}>
                      Nenhum personagem classificado ainda nesta rodada. Escolha o vencedor do duelo acima para classificar!
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                      {nextRoundItems.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            background: '#16161c',
                            border: '1.5px solid #22c55e',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            boxShadow: '0 0 12px rgba(34, 197, 94, 0.2)'
                          }}
                        >
                          <div style={{ width: '100%', height: '95px', backgroundColor: '#09090d', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img 
                              src={item.src} 
                              alt="" 
                              aria-hidden="true"
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(10px)', opacity: 0.25 }} 
                            />
                            <img 
                              src={item.src} 
                              alt={item.nome} 
                              style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} 
                            />
                          </div>
                          <div style={{ padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.nome}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: '700', marginTop: '2px' }}>
                              ✓ Classificado
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CONTEÚDO 3: CARTAS DESCARTADAS / ELIMINADAS */}
              {activeInspectorTab === 'eliminated' && (
                <div>
                  {eliminatedItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px', color: '#777', fontSize: '0.85rem' }}>
                      Nenhuma carta descartada ainda. O torneio está apenas começando!
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                      {eliminatedItems.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            background: '#141418',
                            border: '1px solid #332222',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            opacity: 0.75
                          }}
                        >
                          <div style={{ width: '100%', height: '95px', backgroundColor: '#09090d', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img 
                              src={item.src} 
                              alt="" 
                              aria-hidden="true"
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(10px)', opacity: 0.15 }} 
                            />
                            <img 
                              src={item.src} 
                              alt={item.nome} 
                              style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', padding: '4px', filter: 'grayscale(90%)' }} 
                            />
                          </div>
                          <div style={{ padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.nome}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: '600', marginTop: '2px' }}>
                              {item.eliminatedIn}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PAINEL INFORMATIVO DO MODO BATALHA TIER LIST */}
          {mode === 'tierlist_battle' && (
            <div className="control-card" style={{ padding: '16px', background: '#121216', border: '1px solid #282834', borderRadius: '14px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ListOrdered size={16} color={activeTheme?.accentColor || '#b062eb'} />
                  <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '800' }}>
                    Itens Já Ranqueados ({rankedList.length} de {rawItems.length})
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  Restantes na fila: <strong style={{ color: '#fff' }}>{unrankedItems.length + (insertItem ? 1 : 0)}</strong>
                </span>
              </div>

              {/* Lista dos Itens Já Ordenados */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                {rankedList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      width: '76px',
                      flexShrink: 0,
                      background: '#16161c',
                      border: '1px solid #282832',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ width: '100%', height: '62px', backgroundColor: '#09090d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={item.src} alt={item.nome} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
                    </div>
                    <div style={{ padding: '4px', fontSize: '0.7rem', color: '#fff', textAlign: 'center', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TELA 3: VITÓRIA / RESULTADO FINAL */}
      {gameState === 'finished' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>
          
          {/* RESULTADO DO MODO DUELO (MATA-MATA) */}
          {mode === 'x1' && podium.champion && (
            <div className="control-card" style={{ width: '100%', padding: '30px', background: '#121216', border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.3)'}`, borderRadius: '20px' }}>
              <Crown size={44} color="#ffd700" style={{ margin: '0 auto 10px auto' }} />
              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', color: '#fff', fontWeight: '900' }}>
                CAMPEÃO SUPREMO!
              </h2>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '24px' }}>
                Após todas as fases do chaveamento, estes foram os 3 melhores colocados no torneio:
              </p>

              {/* PÓDIO TOP 3 COMPLETO (1º Campeão / Ouro, 2º Vice / Prata, 3º Lugar / Bronze) */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                gap: '16px',
                maxWidth: '860px',
                margin: '0 auto 30px auto',
                flexWrap: 'wrap'
              }}>
                {/* 2º LUGAR (VICE-CAMPEÃO / PRATA) */}
                {podium.runnerUp && (
                  <div style={{
                    flex: '1 1 200px',
                    maxWidth: '240px',
                    background: '#15151b',
                    border: '2px solid #a8a8b2',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(168, 168, 178, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    order: 1
                  }}>
                    <div style={{ background: '#272730', padding: '7px', color: '#e2e2e8', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Medal size={16} color="#c0c0c0" /> 2º LUGAR (Prata)
                    </div>
                    <div style={{ width: '100%', height: '180px', backgroundColor: '#09090d', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={podium.runnerUp.src} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(15px)', opacity: 0.3 }} />
                      <img src={podium.runnerUp.src} alt={podium.runnerUp.nome} style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                    </div>
                    <div style={{ padding: '10px', fontSize: '0.92rem', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {podium.runnerUp.nome}
                    </div>
                  </div>
                )}

                {/* 1º LUGAR (GRANDE CAMPEÃO / OURO) */}
                <div style={{
                  flex: '1 1 240px',
                  maxWidth: '290px',
                  background: '#171722',
                  border: '3px solid #ffd700',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  boxShadow: '0 0 35px rgba(255, 215, 0, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  transform: 'translateY(-10px)',
                  order: 2,
                  zIndex: 2
                }}>
                  <div style={{ background: 'linear-gradient(90deg, #b45309 0%, #ffd700 50%, #b45309 100%)', padding: '8px', color: '#000', fontWeight: '900', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Crown size={18} /> 1º CAMPEÃO (Ouro)
                  </div>
                  <div style={{ width: '100%', height: '230px', backgroundColor: '#09090d', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src={podium.champion.src} 
                      alt="" 
                      aria-hidden="true" 
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px)', opacity: 0.4, transform: 'scale(1.15)' }} 
                    />
                    <img 
                      src={podium.champion.src} 
                      alt={podium.champion.nome} 
                      style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} 
                    />
                  </div>
                  <div style={{ padding: '12px', fontSize: '1.15rem', fontWeight: '900', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {podium.champion.nome}
                  </div>
                </div>

                {/* 3º LUGAR (BRONZE / SEMIFINALISTAS) */}
                {podium.third && (
                  <div style={{
                    flex: '1 1 200px',
                    maxWidth: '240px',
                    background: '#15151b',
                    border: '2px solid #b45309',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(180, 83, 9, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    order: 3
                  }}>
                    <div style={{ background: '#2c1810', padding: '7px', color: '#fdba74', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Award size={16} color="#cd7f32" /> 3º LUGAR (Bronze)
                    </div>
                    <div style={{ width: '100%', height: '180px', backgroundColor: '#09090d', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={podium.third.src} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(15px)', opacity: 0.3 }} />
                      <img src={podium.third.src} alt={podium.third.nome} style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                    </div>
                    <div style={{ padding: '10px', fontSize: '0.92rem', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {podium.third.nome}
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => startDuelSession(rawItems, 'x1', selectedBracketSize)}
                  className="btn-primary"
                  style={{ padding: '12px 24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <RotateCcw size={16} /> Jogar Novamente
                </button>
                <button
                  type="button"
                  onClick={() => setGameState('configure_tournament')}
                  className="btn-secondary"
                  style={{ padding: '12px 20px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Sliders size={16} /> Alterar Chaves
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
                      backgroundColor: tier.bgColor || tier.color || '#ff7f7f',
                      color: '#000',
                      fontWeight: '900',
                      fontSize: '1.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {tier.l || tier.nome}
                    </div>

                    {/* Itens do Tier */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', flex: 1, alignItems: 'center' }}>
                      {tier.items.map(item => (
                        <div key={item.id} style={{ width: '64px', height: '64px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#09090d', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={item.nome}>
                          <img src={item.src} alt={item.nome} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
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

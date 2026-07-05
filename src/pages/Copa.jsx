import React, { useState, useEffect, useRef } from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import '../styles/copa.css';

// 48 FIFA Confirmed Nations for World Cup 2026
const defaultTeams = [
  // Países-Sede
  { id: 't_ca', name: 'Canadá', src: 'https://flagcdn.com/w160/ca.png' },
  { id: 't_us', name: 'EUA', src: 'https://flagcdn.com/w160/us.png' },
  { id: 't_mx', name: 'México', src: 'https://flagcdn.com/w160/mx.png' },

  // Seleções Classificadas
  { id: 't_za', name: 'África do Sul', src: 'https://flagcdn.com/w160/za.png' },
  { id: 't_de', name: 'Alemanha', src: 'https://flagcdn.com/w160/de.png' },
  { id: 't_sa', name: 'Arábia Saudita', src: 'https://flagcdn.com/w160/sa.png' },
  { id: 't_dz', name: 'Argélia', src: 'https://flagcdn.com/w160/dz.png' },
  { id: 't_ar', name: 'Argentina', src: 'https://flagcdn.com/w160/ar.png' },
  { id: 't_au', name: 'Austrália', src: 'https://flagcdn.com/w160/au.png' },
  { id: 't_at', name: 'Áustria', src: 'https://flagcdn.com/w160/at.png' },
  { id: 't_be', name: 'Bélgica', src: 'https://flagcdn.com/w160/be.png' },
  { id: 't_ba', name: 'Bósnia e Herzegovina', src: 'https://flagcdn.com/w160/ba.png' },
  { id: 't_br', name: 'Brasil', src: 'https://flagcdn.com/w160/br.png' },
  { id: 't_cv', name: 'Cabo Verde', src: 'https://flagcdn.com/w160/cv.png' },
  { id: 't_qa', name: 'Catar', src: 'https://flagcdn.com/w160/qa.png' },
  { id: 't_co', name: 'Colômbia', src: 'https://flagcdn.com/w160/co.png' },
  { id: 't_ci', name: 'Costa do Marfim', src: 'https://flagcdn.com/w160/ci.png' },
  { id: 't_hr', name: 'Croácia', src: 'https://flagcdn.com/w160/hr.png' },
  { id: 't_cw', name: 'Curaçau', src: 'https://flagcdn.com/w160/cw.png' },
  { id: 't_eg', name: 'Egito', src: 'https://flagcdn.com/w160/eg.png' },
  { id: 't_ec', name: 'Equador', src: 'https://flagcdn.com/w160/ec.png' },
  { id: 't_gb_sct', name: 'Escócia', src: 'https://flagcdn.com/w160/gb-sct.png' },
  { id: 't_es', name: 'Espanha', src: 'https://flagcdn.com/w160/es.png' },
  { id: 't_fr', name: 'França', src: 'https://flagcdn.com/w160/fr.png' },
  { id: 't_gh', name: 'Gana', src: 'https://flagcdn.com/w160/gh.png' },
  { id: 't_ht', name: 'Haiti', src: 'https://flagcdn.com/w160/ht.png' },
  { id: 't_nl', name: 'Holanda', src: 'https://flagcdn.com/w160/nl.png' },
  { id: 't_gb_eng', name: 'Inglaterra', src: 'https://flagcdn.com/w160/gb-eng.png' },
  { id: 't_iq', name: 'Iraque', src: 'https://flagcdn.com/w160/iq.png' },
  { id: 't_jp', name: 'Japão', src: 'https://flagcdn.com/w160/jp.png' },
  { id: 't_jo', name: 'Jordânia', src: 'https://flagcdn.com/w160/jo.png' },
  { id: 't_ma', name: 'Marrocos', src: 'https://flagcdn.com/w160/ma.png' },
  { id: 't_no', name: 'Noruega', src: 'https://flagcdn.com/w160/no.png' },
  { id: 't_nz', name: 'Nova Zelândia', src: 'https://flagcdn.com/w160/nz.png' },
  { id: 't_pa', name: 'Panamá', src: 'https://flagcdn.com/w160/pa.png' },
  { id: 't_py', name: 'Paraguai', src: 'https://flagcdn.com/w160/py.png' },
  { id: 't_pt', name: 'Portugal', src: 'https://flagcdn.com/w160/pt.png' },
  { id: 't_cd', name: 'RD do Congo', src: 'https://flagcdn.com/w160/cd.png' },
  { id: 't_kr', name: 'República da Coreia', src: 'https://flagcdn.com/w160/kr.png' },
  { id: 't_ir', name: 'RI do Irã', src: 'https://flagcdn.com/w160/ir.png' },
  { id: 't_sn', name: 'Senegal', src: 'https://flagcdn.com/w160/sn.png' },
  { id: 't_se', name: 'Suécia', src: 'https://flagcdn.com/w160/se.png' },
  { id: 't_ch', name: 'Suíça', src: 'https://flagcdn.com/w160/ch.png' },
  { id: 't_cz', name: 'Tchéquia', src: 'https://flagcdn.com/w160/cz.png' },
  { id: 't_tn', name: 'Tunísia', src: 'https://flagcdn.com/w160/tn.png' },
  { id: 't_tr', name: 'Turquia', src: 'https://flagcdn.com/w160/tr.png' },
  { id: 't_uy', name: 'Uruguai', src: 'https://flagcdn.com/w160/uy.png' },
  { id: 't_uz', name: 'Uzbequistão', src: 'https://flagcdn.com/w160/uz.png' }
];

const createEmptyMatches = () => {
  const matches = {};
  
  // Helper to generate structure
  const addMatches = (prefix, count, nextPrefix) => {
    for (let i = 1; i <= count; i++) {
      matches[`${prefix}_${i}`] = {
        t1: null,
        t2: null,
        winner: null,
        nextMatch: nextPrefix ? `${nextPrefix}_${Math.ceil(i/2)}` : null,
        nextSlot: i % 2 !== 0 ? 't1' : 't2'
      };
    }
  };

  addMatches('l1', 8, 'l2');
  addMatches('l2', 4, 'l3');
  addMatches('l3', 2, 'l4');
  addMatches('l4', 1, 'final');

  addMatches('r1', 8, 'r2');
  addMatches('r2', 4, 'r3');
  addMatches('r3', 2, 'r4');
  addMatches('r4', 1, 'final');

  // Center matches
  matches['final_1'] = { t1: null, t2: null, winner: null, nextMatch: 'champion', nextSlot: 't1' };
  matches['champion'] = { t1: null, t2: null, winner: null, nextMatch: null, nextSlot: null };
  matches['third_1'] = { t1: null, t2: null, winner: null, nextMatch: 'third_winner', nextSlot: 't1' };
  matches['third_winner'] = { t1: null, t2: null, winner: null, nextMatch: null, nextSlot: null };

  // Fix right semifinal feeding into final_1 t2
  matches['r4_1'].nextSlot = 't2';

  // Note: Semi final losers go to third_1. This requires manual routing in code.
  return matches;
};

// Draggable Item Component
function DraggableTeam({ id, team, isSelected }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { team },
    disabled: team.isAutoPlaced // disable dragging if auto-placed
  });
  
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: 999,
    opacity: isDragging ? 0 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`team-flag-container ${isSelected ? 'selected' : ''}`} title={team.name} style={{ width: '100%', height: '100%', ...style }}>
      <img src={team.src} alt={team.name} className="team-flag" draggable="false" />
    </div>
  );
}

// Droppable Slot Component
function MatchSlot({ matchId, slotId, team, winner, onClickSlot }) {
  const droppableId = `${matchId}-${slotId}`;
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: { matchId, slotId }
  });

  let className = "team-slot";
  if (isOver) className += " drag-over";
  
  if (winner) {
    if (winner === slotId) {
      className += " winner";
    } else {
      className += " loser";
    }
  }

  return (
    <div ref={setNodeRef} className={className} onClick={(e) => { e.stopPropagation(); onClickSlot(matchId, slotId, team); }}>
      {team ? (
        <>
          <DraggableTeam id={`drag-${matchId}-${slotId}-${team.id}`} team={team} isSelected={false} />
          {matchId !== 'champion' && matchId !== 'third_winner' && (
             <button className="winner-btn" onClick={(e) => { e.stopPropagation(); onClickSlot(matchId, slotId, team, true); }} title="Definir Vencedor">✔️</button>
          )}
        </>
      ) : (
        <span className="team-placeholder">?</span>
      )}
    </div>
  );
}

function InventoryDroppable({ children }) {
  const { setNodeRef } = useDroppable({
    id: 'inventory-drop',
    data: { matchId: 'inventory', slotId: 'inventory' }
  });
  return <div ref={setNodeRef} className="copa-inventory-scroll">{children}</div>;
}

export default function Copa() {
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('copa-inventory-v3');
      if (saved) {
        let parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) parsed = [];
        
        let matchesParsed = {};
        try {
          const matchesSaved = localStorage.getItem('copa-matches-v3');
          if (matchesSaved) {
            matchesParsed = JSON.parse(matchesSaved);
            if (!matchesParsed || typeof matchesParsed !== 'object') matchesParsed = {};
          }
        } catch (err) {
          console.warn("Failed to parse matches for inventory merge", err);
        }
        
        // Merge missing teams from defaultTeams (if they are not in inventory AND not in matches)
        const existingTeamIds = new Set(parsed.map(t => t?.id).filter(Boolean));
        
        // Also collect team ids from matches so we don't duplicate them in inventory if they are already on the board
        Object.values(matchesParsed).forEach(m => {
          if (m?.t1?.id) existingTeamIds.add(m.t1.id);
          if (m?.t2?.id) existingTeamIds.add(m.t2.id);
        });

        const missingTeams = defaultTeams.filter(t => !existingTeamIds.has(t.id));
        return [...parsed, ...missingTeams];
      }
    } catch (e) {
      console.error("Erro ao ler copa-inventory", e);
    }
    return defaultTeams;
  });
  
  const [matches, setMatches] = useState(() => {
    try {
      const saved = localStorage.getItem('copa-matches-v3');
      if (saved) {
        let parsed = JSON.parse(saved);
        if (!parsed || typeof parsed !== 'object') return createEmptyMatches();
        if (!parsed.champion) {
          parsed.champion = { t1: null, t2: null, winner: null, nextMatch: null, nextSlot: null };
        }
        if (!parsed.third_1) {
          parsed.third_1 = { t1: null, t2: null, winner: null, nextMatch: 'third_winner', nextSlot: 't1' };
        }
        if (!parsed.third_winner) {
          parsed.third_winner = { t1: null, t2: null, winner: null, nextMatch: null, nextSlot: null };
        }
        if (parsed.final_1) {
          parsed.final_1.nextMatch = 'champion';
          parsed.final_1.nextSlot = 't1';
        }
        if (parsed.r4_1) {
          parsed.r4_1.nextSlot = 't2';
        }
        return parsed;
      }
    } catch (e) {
      console.error("Erro ao ler copa-matches", e);
    }
    return createEmptyMatches();
  });

  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentCopaId, setCurrentCopaId] = useState(() => {
    return localStorage.getItem('copa-current-id') || null;
  });

  const [copaName, setCopaName] = useState(() => {
    return localStorage.getItem('copa-name') || 'Copa do Mundo 2026';
  });

  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeTeam, setActiveTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const boardRef = useRef(null);

  // Sincroniza estado com localStorage
  useEffect(() => {
    localStorage.setItem('copa-inventory-v3', JSON.stringify(inventory));
    localStorage.setItem('copa-matches-v3', JSON.stringify(matches));
  }, [inventory, matches]);

  // Carregar dados da Nuvem com base no ID da URL (se existir)
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      const loadCopaFromCloud = async () => {
        try {
          const { data, error } = await supabase
            .from('tierlists')
            .select('name, data')
            .eq('id', idParam)
            .single();

          if (error) throw error;
          if (data && data.data && data.data.type === 'copa') {
            setCopaName(data.name);
            localStorage.setItem('copa-name', data.name);
            setInventory(data.data.inventory || []);
            setMatches(data.data.matches || {});
            setCurrentCopaId(idParam);
            localStorage.setItem('copa-current-id', idParam);
          }
        } catch (err) {
          console.error("Erro ao carregar Copa da nuvem:", err);
          toast.error("Erro ao carregar chaveamento da nuvem.");
        }
      };
      loadCopaFromCloud();
    } else {
      // Se não há parâmetro na URL, removemos o ID de controle
      setCurrentCopaId(null);
      localStorage.removeItem('copa-current-id');
    }
  }, [searchParams]);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTeam(active.data.current.team);
  };

  const handleDragCancel = () => {
    setActiveTeam(null);
  };

  const handleDragEnd = (event) => {
    setActiveTeam(null);
    const { active, over } = event;
    if (!over) return;

    const team = active.data.current.team;
    const sourceId = active.id.toString(); // format could be 'drag-inventory-tx' ou 'drag-l1_1-t1-tx'
    const targetMatchId = over.data.current.matchId;
    const targetSlotId = over.data.current.slotId;

    if (targetMatchId === 'inventory') {
      if (sourceId.startsWith('drag-') && !sourceId.includes('inventory')) {
        const parts = sourceId.split('-');
        const srcMatchId = parts[1];
        const srcSlotId = parts[2];
        setInventory(inv => [...inv.filter(t => t.id !== team.id), team]);
        setMatches(prev => {
          const newMatches = { ...prev };
          newMatches[srcMatchId] = {
            ...newMatches[srcMatchId],
            [srcSlotId]: null,
            winner: null
          };
          return newMatches;
        });
      }
      return;
    }

    setMatches(prev => {
      const newMatches = { ...prev };
      
      // Se tiver algo no target, vamos jogar de volta pro inventário
      const existingTeamInTarget = newMatches[targetMatchId][targetSlotId];
      if (existingTeamInTarget?.isAutoPlaced) {
        toast.error('Você não pode substituir um time que avançou por vitória. Desfaça a vitória na chave anterior!');
        return prev;
      }
      
      if (existingTeamInTarget && existingTeamInTarget.id !== team.id) {
        setInventory(inv => [...inv.filter(t => t.id !== existingTeamInTarget.id), existingTeamInTarget]);
      }

      // Coloca no novo local
      newMatches[targetMatchId] = {
        ...newMatches[targetMatchId],
        [targetSlotId]: team,
        winner: null // reseta vencedor se trocar o time
      };

      // Remove da fonte se veio de outro match
      if (sourceId.startsWith('drag-') && !sourceId.includes('inventory')) {
        const parts = sourceId.split('-');
        const srcMatchId = parts[1];
        const srcSlotId = parts[2];
        if (srcMatchId !== targetMatchId || srcSlotId !== targetSlotId) {
          newMatches[srcMatchId] = {
            ...newMatches[srcMatchId],
            [srcSlotId]: null,
            winner: null
          };
        }
      } else {
        // Veio do inventário, remove do inventário
        setInventory(inv => inv.filter(t => t.id !== team.id));
      }

      return newMatches;
    });
  };

  const handleSetWinner = (matchId, slotId, team, isWinnerClick = false) => {
    // Select and Place Logic se não foi clique no botão de vencedor especificamente
    if (!isWinnerClick && selectedTeam) {
      const isFromInventory = selectedTeam.sourceId === 'inventory';
      
      setMatches(prev => {
        const newMatches = { ...prev };
        const existingTeamInTarget = newMatches[matchId][slotId];
        
        if (existingTeamInTarget?.isAutoPlaced) {
          toast.error('Você não pode substituir um time que avançou por vitória. Desfaça a vitória na chave anterior!');
          return prev;
        }

        if (existingTeamInTarget) {
          setInventory(inv => [...inv.filter(t => t.id !== existingTeamInTarget.id), existingTeamInTarget]);
        }
        
        newMatches[matchId][slotId] = selectedTeam.team;
        newMatches[matchId].winner = null;
        
        if (!isFromInventory) {
          const parts = selectedTeam.sourceId.split('-');
          const srcMatchId = parts[1];
          const srcSlotId = parts[2];
          if (srcMatchId !== matchId || srcSlotId !== slotId) {
            newMatches[srcMatchId][srcSlotId] = null;
            newMatches[srcMatchId].winner = null;
          }
        } else {
          setInventory(inv => inv.filter(t => t.id !== selectedTeam.team.id));
        }
        
        return newMatches;
      });
      setSelectedTeam(null);
      return;
    }

    if (!isWinnerClick && !team) return;
    
    // Select the existing team in the slot if not placing and not clicking winner
    if (!isWinnerClick && team && !selectedTeam) {
      if (team.isAutoPlaced) {
        // Se a imagem é auto-placed, ela não pode ser movida, então um clique direto nela vai marcar/desmarcar vitória!
        isWinnerClick = true;
      } else {
        setSelectedTeam({ team, sourceId: `drag-${matchId}-${slotId}-${team.id}` });
        return;
      }
    }

    // Se foi clique no botão de vencedor (ou clique direto numa imagem auto-placed)
    if (isWinnerClick) {
      setMatches(prev => {
        const match = prev[matchId];
        if (!match.t1 || !match.t2) {
          if (matchId !== 'third_winner') toast.error('A partida precisa de 2 times para ter um vencedor!');
          return prev;
        }

        const newMatches = { ...prev };
        
        // Toggle winner
        if (match.winner === slotId) {
          newMatches[matchId].winner = null;
          if (match.nextMatch) {
            newMatches[match.nextMatch][match.nextSlot] = null;
            newMatches[match.nextMatch].winner = null; // cascade clearing winner
          }
        } else {
          newMatches[matchId].winner = slotId;
          if (match.nextMatch) {
            newMatches[match.nextMatch][match.nextSlot] = { ...team, isAutoPlaced: true, lockedFrom: matchId };
            newMatches[match.nextMatch].winner = null;
          }

          if (matchId === 'l4_1' || matchId === 'r4_1') {
            const loserSlot = slotId === 't1' ? 't2' : 't1';
            const loserTeam = match[loserSlot];
            const thirdPlaceSlot = matchId === 'l4_1' ? 't1' : 't2';
            newMatches['third_1'][thirdPlaceSlot] = { ...loserTeam, isAutoPlaced: true, lockedFrom: matchId };
            newMatches['third_1'].winner = null;
          }
        }

        return newMatches;
      });
    }
  };

  const handleExportImage = async () => {
    try {
      toast.loading('Gerando imagem...', { id: 'img-export' });
      const htmlToImage = await import('html-to-image');
      const board = boardRef.current;
      if (!board) return;

      const dataUrl = await htmlToImage.toPng(board, {
        backgroundColor: '#0b1a58',
        pixelRatio: 1
      });
      
      const link = document.createElement('a');
      link.download = 'copa-2026-chaveamento.png';
      link.href = dataUrl;
      link.click();
      toast.success('Imagem salva com sucesso!', { id: 'img-export' });
    } catch (err) {
      toast.error('Erro ao salvar imagem.', { id: 'img-export' });
    }
  };

  const handleExportJSON = () => {
    const dataToSave = { inventory, matches };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'copa-2026.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Chaveamento salvo (JSON)!');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.inventory && parsed.matches) {
          setInventory(parsed.inventory);
          setMatches(parsed.matches);
          toast.success('Chaveamento restaurado!');
        } else {
          toast.error('Arquivo JSON inválido.');
        }
      } catch (err) {
        toast.error('Erro ao ler arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reseta input
  };

  const handleSaveToCloud = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para salvar na nuvem!');
      return;
    }

    const { value: nameInput } = await Swal.fire({
      title: 'Salvar Chaveamento na Nuvem',
      input: 'text',
      inputLabel: 'Dê um nome personalizado para o seu Chaveamento:',
      inputValue: copaName,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar',
      background: '#1a1a1c',
      color: '#ffffff',
      confirmButtonColor: '#b062eb',
      inputValidator: (value) => {
        if (!value) {
          return 'Por favor, digite um nome!';
        }
      }
    });

    if (nameInput) {
      const dataToSave = {
        type: 'copa',
        inventory,
        matches
      };

      try {
        toast.loading('Salvando chaveamento...', { id: 'copa-save' });
        if (currentCopaId) {
          const { error } = await supabase
            .from('tierlists')
            .update({ name: nameInput, data: dataToSave, updated_at: new Date() })
            .eq('id', currentCopaId);

          if (error) throw error;
          setCopaName(nameInput);
          localStorage.setItem('copa-name', nameInput);
          toast.success('Chaveamento atualizado na nuvem!', { id: 'copa-save' });
        } else {
          const { data, error } = await supabase
            .from('tierlists')
            .insert([{ user_id: user.id, name: nameInput, data: dataToSave }])
            .select()
            .single();

          if (error) throw error;
          if (data) {
            setCurrentCopaId(data.id);
            localStorage.setItem('copa-current-id', data.id);
            setCopaName(nameInput);
            localStorage.setItem('copa-name', nameInput);
            setSearchParams({ id: data.id });
            toast.success('Chaveamento salvo na nuvem!', { id: 'copa-save' });
          }
        }
      } catch (err) {
        console.error("Erro ao salvar copa na nuvem:", err);
        toast.error("Erro ao salvar na nuvem. Verifique a conexão.", { id: 'copa-save' });
      }
    }
  };

  const resetBracket = () => {
    if(window.confirm('Tem certeza que deseja resetar todo o chaveamento?')) {
      setMatches(createEmptyMatches());
      setInventory(defaultTeams);
      setCurrentCopaId(null);
      localStorage.removeItem('copa-current-id');
      setCopaName('Copa do Mundo 2026');
      localStorage.setItem('copa-name', 'Copa do Mundo 2026');
      setSearchParams({});
    }
  };

  // Helper para renderizar colunas
  const renderColumn = (prefix, count, title, side) => (
    <div className={`bracket-column bracket-${side}`}>
      <div className="column-title" style={{ position: 'absolute', top: '-30px', width: '100%', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>{title}</div>
      {count > 1 ? (
        Array.from({ length: count / 2 }).map((_, pairIndex) => {
          const mId1 = `${prefix}_${pairIndex * 2 + 1}`;
          const mId2 = `${prefix}_${pairIndex * 2 + 2}`;
          const match1 = matches[mId1];
          const match2 = matches[mId2];
          return (
            <div className="match-pair" key={pairIndex}>
              <div className="match-box">
                <MatchSlot matchId={mId1} slotId="t1" team={match1?.t1} winner={match1?.winner} onClickSlot={handleSetWinner} />
                <MatchSlot matchId={mId1} slotId="t2" team={match1?.t2} winner={match1?.winner} onClickSlot={handleSetWinner} />
              </div>
              <div className="match-box">
                <MatchSlot matchId={mId2} slotId="t1" team={match2?.t1} winner={match2?.winner} onClickSlot={handleSetWinner} />
                <MatchSlot matchId={mId2} slotId="t2" team={match2?.t2} winner={match2?.winner} onClickSlot={handleSetWinner} />
              </div>
            </div>
          );
        })
      ) : (
        <div className="match-pair single-match">
          <div className="match-box">
            <MatchSlot matchId={`${prefix}_1`} slotId="t1" team={matches[`${prefix}_1`]?.t1} winner={matches[`${prefix}_1`]?.winner} onClickSlot={handleSetWinner} />
            <MatchSlot matchId={`${prefix}_1`} slotId="t2" team={matches[`${prefix}_1`]?.t2} winner={matches[`${prefix}_1`]?.winner} onClickSlot={handleSetWinner} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel} autoScroll={false}>
      <div className={`copa-container ${isPresentationMode ? 'presentation-mode' : ''}`}>
        
        <div className="rotate-screen-overlay">
          <h2 style={{ color: '#fbbf24', marginBottom: '20px' }}>⚠️ Aviso</h2>
          <p>O Modo Copa do Mundo requer muito espaço na tela.</p>
          <p>Por favor, <strong>gire o seu celular</strong> (Modo Paisagem) ou acesse pelo computador para montar o seu chaveamento.</p>
        </div>

        {!isPresentationMode && (
          <div className="copa-banner">
            <h1>Copa do Mundo 2026 - {copaName}</h1>
          </div>
        )}

        {!isPresentationMode && (
          <div style={{ display: 'flex', gap: '10px', padding: '15px', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid #333', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn-primary" onClick={handleExportImage}>Salvar Imagem</button>
            <button className="btn-primary" onClick={handleExportJSON}>Salvar (JSON)</button>
            <label className="btn-secondary" style={{ cursor: 'pointer', margin: 0, padding: '12px', borderRadius: '8px', lineHeight: '1.2' }}>
              Carregar (JSON)
              <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
            </label>
            <button className="btn-secondary" onClick={handleSaveToCloud}>
              {currentCopaId ? 'Atualizar na Nuvem' : 'Salvar na Nuvem'}
            </button>
            <button className="btn-secondary" onClick={resetBracket}>Resetar Tudo</button>
            <button className="btn-secondary" onClick={() => setIsPresentationMode(true)}>Modo Apresentação</button>
          </div>
        )}

        {isPresentationMode && (
          <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
            <button className="btn-primary" style={{ backgroundColor: '#ef4444' }} onClick={() => setIsPresentationMode(false)}>
              Sair do Modo Apresentação
            </button>
          </div>
        )}

        <div className="bracket-board" ref={boardRef}>
          <div className="bracket-wrapper">
            
            {/* Esquerda */}
            {renderColumn('l1', 8, '16-Avos', 'left')}
            {renderColumn('l2', 4, 'Oitavas', 'left')}
            {renderColumn('l3', 2, 'Quartas', 'left')}
            {renderColumn('l4', 1, 'Semi', 'left')}
            
            {/* GRANDE FINAL E TROFÉU */}
            <div className="bracket-center">
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#fbbf24', fontSize: '1.8rem', margin: '0 0 10px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>🏆 CAMPEÃO 🏆</h2>
                <div className="match-box final-match" style={{ margin: '0 auto', background: 'rgba(255, 255, 255, 0.1)', borderColor: '#fbbf24', width: '120px' }}>
                  <MatchSlot matchId="champion" slotId="t1" team={matches.champion?.t1} winner={null} onClickSlot={() => {}} />
                </div>
              </div>

              <div className="match-box final-match">
                <h3 style={{ color: '#fbbf24', textAlign: 'center', margin: '0 0 10px 0' }}>GRANDE FINAL</h3>
                <MatchSlot matchId="final_1" slotId="t1" team={matches.final_1.t1} winner={matches.final_1.winner} onClickSlot={handleSetWinner} />
                <MatchSlot matchId="final_1" slotId="t2" team={matches.final_1.t2} winner={matches.final_1.winner} onClickSlot={handleSetWinner} />
              </div>

              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <h3 style={{ color: '#cbd5e1', margin: '0 0 10px 0' }}>🥉 3º LUGAR</h3>
                <div className="match-box">
                  <MatchSlot matchId="third_1" slotId="t1" team={matches.third_1.t1} winner={matches.third_1.winner} onClickSlot={handleSetWinner} />
                  <MatchSlot matchId="third_1" slotId="t2" team={matches.third_1.t2} winner={matches.third_1.winner} onClickSlot={handleSetWinner} />
                </div>
                <div style={{ marginTop: '10px' }}>
                  <h4 style={{ color: '#94a3b8', margin: '0 0 5px 0', fontSize: '0.9rem' }}>Vencedor 3º Lugar</h4>
                  <div className="match-box" style={{ margin: '0 auto', background: 'rgba(255, 255, 255, 0.1)', borderColor: '#cbd5e1', width: '100px' }}>
                    <MatchSlot matchId="third_winner" slotId="t1" team={matches.third_winner.t1} winner={null} onClickSlot={() => {}} />
                  </div>
                </div>
              </div>
            </div>

            {/* Direita */}
            {renderColumn('r4', 1, 'Semi', 'right')}
            {renderColumn('r3', 2, 'Quartas', 'right')}
            {renderColumn('r2', 4, 'Oitavas', 'right')}
            {renderColumn('r1', 8, '16-Avos', 'right')}
            
          </div>
        </div>

        {!isPresentationMode && (
          <div className="copa-inventory-wrapper">
            <div className="copa-inventory-title">
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>
                Inventário de Seleções ({inventory.length})
                <span style={{ fontSize: '0.8rem', color: '#999', marginLeft: '10px', fontWeight: 'normal' }}>
                  Arraste para as chaves ou clique para selecionar.
                </span>
              </h3>
              <input
                type="text"
                placeholder="Filtrar país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #3b82f6',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '200px',
                  transition: 'border-color 0.2s',
                }}
                className="copa-search-input"
              />
            </div>
            <InventoryDroppable>
              {inventory
                .filter(team => team.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(team => (
                  <div 
                    key={team.id} 
                    className={`inventory-item ${selectedTeam?.team?.id === team.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTeam({ team, sourceId: 'inventory' })}
                    style={{ width: '80px', height: '60px', flexShrink: 0, padding: 0 }}
                  >
                    <DraggableTeam id={`drag-inventory-${team.id}`} team={team} isSelected={selectedTeam?.team?.id === team.id} />
                  </div>
                ))}
            </InventoryDroppable>
          </div>
        )}

        <DragOverlay zIndex={9999}>
          {activeTeam ? (
            <div style={{ width: '60px', height: '40px', overflow: 'hidden', border: '1px solid #3b82f6', borderRadius: '4px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', background: '#111' }}>
              <img src={activeTeam.src} alt={activeTeam.name} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

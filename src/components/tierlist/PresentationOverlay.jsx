import React, { useState, useEffect } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff, 
  Copy, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  Radio, 
  Tv, 
  Layers
} from 'lucide-react';
import { toast } from '../../utils/notifications';

export default function PresentationOverlay({ 
  onExit, 
  tierlistName, 
  totalItems = 0, 
  rankedItemsCount = 0,
  showInventory = true,
  onToggleInventory,
  scale = 1,
  onChangeScale,
  onQuickExport,
  activeTheme
}) {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: -100, y: -100, visible: false });

  // Escuta Fullscreen Change e tecla ESC
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onExit();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
          toggleFullscreen();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onExit]);

  // Efeito do Ponteiro Laser / Foco Dinâmico
  useEffect(() => {
    if (!isLaserActive) {
      setLaserPos(prev => ({ ...prev, visible: false }));
      return;
    }

    const handleMouseMove = (e) => {
      setLaserPos({ x: e.clientX, y: e.clientY, visible: true });
    };

    const handleMouseLeave = () => {
      setLaserPos(prev => ({ ...prev, visible: false }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isLaserActive]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Erro ao alternar tela cheia:', err);
    }
  };

  const handleZoomIn = () => {
    if (scale < 1.35) {
      onChangeScale?.(Math.min(1.35, Math.round((scale + 0.08) * 100) / 100));
    }
  };

  const handleZoomOut = () => {
    if (scale > 0.75) {
      onChangeScale?.(Math.max(0.75, Math.round((scale - 0.08) * 100) / 100));
    }
  };

  const handleResetZoom = () => {
    onChangeScale?.(1);
  };

  const accentColor = activeTheme?.accentColor || '#b062eb';
  const percentRanked = totalItems > 0 ? Math.round((rankedItemsCount / totalItems) * 100) : 0;

  return (
    <>
      {/* Ponteiro Laser / Efeito Spotlight Flutuante */}
      {isLaserActive && laserPos.visible && (
        <div 
          style={{
            position: 'fixed',
            left: `${laserPos.x}px`,
            top: `${laserPos.y}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            boxShadow: '0 0 16px #ef4444, 0 0 32px #f87171, 0 0 50px rgba(239, 68, 68, 0.8)',
            border: '2px solid #ffffff'
          }} />
          <div style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)',
            animation: 'pulse 1.2s infinite ease-in-out'
          }} />
        </div>
      )}

      {/* BARRA FLUTUANTE STREAMER HUD */}
      <div 
        style={{ 
          position: 'fixed', 
          top: isCollapsed ? '-52px' : '12px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'top 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(18, 18, 24, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1.5px solid ${accentColor}55`,
            borderRadius: '16px',
            padding: '6px 12px',
            boxShadow: `0 10px 35px rgba(0, 0, 0, 0.85), 0 0 25px ${accentColor}25`,
            maxWidth: 'calc(100vw - 24px)',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          {/* Tag de Apresentação / Nome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '8px', borderRight: '1px solid #333342' }}>
            <div style={{ display: 'inline-flex', padding: '4px 8px', background: `${accentColor}25`, border: `1px solid ${accentColor}66`, borderRadius: '8px', color: '#fff', fontSize: '0.75rem', fontWeight: '800', alignItems: 'center', gap: '5px' }}>
              <Tv size={12} color={accentColor} />
              <span>APRESENTAÇÃO</span>
            </div>
            <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '700', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tierlistName}>
              {tierlistName}
            </span>
          </div>

          {/* Contador de Progresso */}
          {totalItems > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#aaa', paddingRight: '8px', borderRight: '1px solid #333342' }}>
              <Layers size={13} color="#4ade80" />
              <span style={{ color: '#fff', fontWeight: '700' }}>{rankedItemsCount}/{totalItems}</span>
              <span style={{ fontSize: '0.7rem', color: '#888' }}>({percentRanked}%)</span>
            </div>
          )}

          {/* Grupo 1: Zoom e Enquadramento */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#121216', padding: '2px', borderRadius: '8px', border: '1px solid #282834' }}>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.75}
              style={{ background: 'none', border: 'none', color: scale <= 0.75 ? '#555' : '#ccc', padding: '5px 7px', cursor: scale <= 0.75 ? 'not-allowed' : 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
              title="Diminuir Zoom"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              style={{ background: 'none', border: 'none', color: '#fff', padding: '4px 6px', fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer', borderRadius: '6px' }}
              title="Resetar Zoom (100%)"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 1.35}
              style={{ background: 'none', border: 'none', color: scale >= 1.35 ? '#555' : '#ccc', padding: '5px 7px', cursor: scale >= 1.35 ? 'not-allowed' : 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
              title="Aumentar Zoom"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Grupo 2: Recursos de Streamer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Alternar Inventário (Clean Board) */}
            <button
              type="button"
              onClick={onToggleInventory}
              style={{
                background: showInventory ? '#1f1f2a' : `${accentColor}33`,
                border: showInventory ? '1px solid #333342' : `1px solid ${accentColor}`,
                color: showInventory ? '#bbb' : '#fff',
                padding: '6px 9px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.18s ease'
              }}
              title={showInventory ? "Ocultar Banco de Imagens (Apenas Tabuleiro)" : "Mostrar Banco de Imagens"}
            >
              {showInventory ? <EyeOff size={13} /> : <Eye size={13} color={accentColor} />}
              <span className="hide-on-mobile">{showInventory ? "Ocultar Banco" : "Mostrar Banco"}</span>
            </button>

            {/* Apontador Laser */}
            <button
              type="button"
              onClick={() => setIsLaserActive(!isLaserActive)}
              style={{
                background: isLaserActive ? 'rgba(239, 68, 68, 0.25)' : '#1f1f2a',
                border: isLaserActive ? '1px solid #ef4444' : '1px solid #333342',
                color: isLaserActive ? '#fca5a5' : '#bbb',
                padding: '6px 9px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.18s ease'
              }}
              title={isLaserActive ? "Desativar Apontador Laser" : "Ativar Apontador Laser para Stream/Gravação"}
            >
              <Radio size={13} color={isLaserActive ? '#ef4444' : '#bbb'} />
              <span className="hide-on-mobile">Laser</span>
            </button>

            {/* Tela Cheia */}
            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                background: isFullscreen ? 'rgba(56, 189, 248, 0.2)' : '#1f1f2a',
                border: isFullscreen ? '1px solid #38bdf8' : '1px solid #333342',
                color: isFullscreen ? '#7dd3fc' : '#bbb',
                padding: '6px 9px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.18s ease'
              }}
              title={isFullscreen ? "Sair da Tela Cheia (F)" : "Tela Cheia (F)"}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span className="hide-on-mobile">{isFullscreen ? "Janela" : "Full"}</span>
            </button>

            {/* Copiar Tabuleiro Instantâneo */}
            <button
              type="button"
              onClick={() => onQuickExport?.('copy')}
              style={{
                background: 'rgba(176, 98, 235, 0.15)',
                border: '1px solid rgba(176, 98, 235, 0.4)',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.18s ease'
              }}
              title="Copiar Imagem da Tier List (Ctrl+V)"
            >
              <Copy size={13} color="#d8b4fe" />
              <span>Copiar</span>
            </button>
          </div>

          {/* Botão Sair */}
          <button 
            type="button"
            onClick={onExit} 
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.78rem', 
              backgroundColor: '#ef4444', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '800', 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 10px rgba(239, 68, 68, 0.35)',
              transition: 'background 0.2s ease'
            }}
            title="Sair do Modo Apresentação (Esc)"
          >
            <X size={13} /> Sair
          </button>
        </div>

        {/* Puxador para Recolher / Expandir HUD */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'rgba(18, 18, 24, 0.85)',
            border: `1px solid ${accentColor}44`,
            borderTop: 'none',
            borderBottomLeftRadius: '10px',
            borderBottomRightRadius: '10px',
            color: '#888',
            padding: '2px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.68rem',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#888'}
          title={isCollapsed ? "Expandir Controles de Apresentação" : "Recolher Controles"}
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>
    </>
  );
}

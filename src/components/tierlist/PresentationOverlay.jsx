import React from 'react';

export default function PresentationOverlay({ onExit }) {
  return (
    <div style={{ position: 'fixed', top: '15px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
      <button 
        onClick={onExit} 
        style={{ 
          padding: '8px 18px', 
          fontSize: '0.9rem', 
          backgroundColor: '#ef4444', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: 'pointer', 
          fontWeight: 'bold', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)' 
        }}
      >
        Sair do Modo Apresentação
      </button>
    </div>
  );
}

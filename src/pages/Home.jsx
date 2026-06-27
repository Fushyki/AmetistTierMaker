import React from 'react';
import { Link } from 'react-router-dom';
import '../index.css';

export default function Home() {
  return (
    <div className="tierlist-container" style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Bem-vindo ao Ametist</h1>
      <p style={{ color: '#aaa', marginBottom: '40px' }}>
        Crie suas próprias Tier Lists de forma rápida e mobile-friendly!
      </p>
      
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <Link to="/tierlist">
          <button style={{ padding: '15px 30px', fontSize: '1.2rem', backgroundColor: '#ffd700', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Montar Tier List
          </button>
        </Link>
        <Link to="/login">
          <button style={{ padding: '15px 30px', fontSize: '1.2rem', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Fazer Login
          </button>
        </Link>
      </div>
    </div>
  );
}

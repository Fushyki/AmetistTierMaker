import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="tierlist-container" style={{ textAlign: 'center', marginTop: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>Bem-vindo ao Ametist</h1>
      <p style={{ color: '#aaa', marginBottom: '10px', fontSize: '1.1rem' }}>
        Crie suas próprias Tier Lists de forma rápida e mobile-friendly!
      </p>

      <div style={{ background: 'linear-gradient(90deg, rgba(176,98,235,0.1) 0%, rgba(255,215,0,0.1) 100%)', padding: '15px 30px', borderRadius: '12px', border: '1px solid rgba(176,98,235,0.3)', marginBottom: '40px', maxWidth: '600px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#b062eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          ☁️ Salve na Nuvem
        </h3>
        <p style={{ margin: 0, color: '#ddd', fontSize: '0.95rem', lineHeight: '1.5' }}>
          O grande diferencial do Ametist é o salvamento em nuvem! Crie sua conta gratuitamente para guardar suas Tier Lists e continuar editando elas de qualquer dispositivo, a qualquer momento.
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/tierlist">
          <button style={{ padding: '15px 30px', fontSize: '1.2rem', backgroundColor: '#ffd700', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Montar Tier List
          </button>
        </Link>
        {!user ? (
          <Link to="/login">
            <button style={{ padding: '15px 30px', fontSize: '1.2rem', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Fazer Login / Criar Conta
            </button>
          </Link>
        ) : (
          <Link to="/admin">
            <button style={{ padding: '15px 30px', fontSize: '1.2rem', backgroundColor: '#b062eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Meu Painel
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

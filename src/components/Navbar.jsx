import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="ametist-navbar">
      <div className="navbar-container">
        <div className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/ametist-logo.png" alt="Ametist Icon" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
          <img src="/ametist-text.png" alt="Ametist Logo Text" style={{ height: '22px', objectFit: 'contain' }} />
        </div>
        <div className="navbar-links">
          <Link to="/" className="nav-item">Home</Link>
          <Link to="/tierlist" className="nav-item">Criar Tierlist</Link>
          <Link to="/template-maker" className="nav-item">Criar Modelo</Link>
          {user ? (
            <Link to="/admin" className="nav-btn">Meu Painel</Link>
          ) : (
            <Link to="/login" className="nav-btn">Entrar</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

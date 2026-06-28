import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="ametist-navbar">
      <div className="navbar-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        
        {/* Left Side: Logo */}
        <div className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <img src="/ametist-logo.png" alt="Ametist Icon" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
          <img src="/ametist-text.png" alt="Ametist Logo Text" style={{ height: '22px', objectFit: 'contain' }} />
        </div>
        
        {/* Center: Links */}
        <div className="navbar-links" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flex: 1 }}>
          <Link to="/" className="nav-item">Home</Link>
          <Link to="/tierlist?new=true" className="nav-item">Criar Tierlist</Link>
          <Link to="/template-maker" className="nav-item">Criar Modelo</Link>
        </div>

        {/* Right Side: Auth */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
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

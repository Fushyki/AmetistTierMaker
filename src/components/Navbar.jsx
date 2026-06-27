import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="ametist-navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="Ametist Logo" style={{ height: '40px', objectFit: 'contain' }} />
          </Link>
        </div>
        <div className="navbar-links">
          <Link to="/tierlist" className="nav-item">Criar Tierlist</Link>
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

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="ametist-navbar">
      <div className="navbar-container">
        
        {/* Left Side: Logo */}
        <div className="navbar-logo">
          <img src="/ametist-logo.png" alt="Ametist Icon" className="navbar-icon" />
          <img src="/ametist-text.png" alt="Ametist Logo Text" className="navbar-text" />
        </div>
        
        {/* Center: Links */}
        <div className="navbar-links">
          <Link to="/" className="nav-item">Início</Link>
          <Link to="/template-maker" className="nav-item">Criar Modelo</Link>
        </div>

        {/* Right Side: Auth */}
        <div className="navbar-auth">
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

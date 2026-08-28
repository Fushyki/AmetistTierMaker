import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User } from 'lucide-react';
import '../styles/index.css';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="ametist-navbar">
      <div className="navbar-container">
        
        {/* Left Side: Logo */}
        <Link to="/" className="navbar-logo">
          <img src="/ametist-logo.png" alt="Ametist Icon" className="navbar-icon" />
          <img src="/ametist-text.png" alt="Ametist Logo Text" className="navbar-text" />
        </Link>
        
        {/* Center: Links */}
        <div className="navbar-links">
          <Link to="/" className="nav-item">Início</Link>
          <Link to="/template-maker" className="nav-item">Criar Modelo</Link>
        </div>

        {/* Right Side: Auth */}
        <div className="navbar-auth">
          {user ? (
            <Link to="/profile" className="nav-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    border: '1.5px solid var(--accent-color)',
                    boxShadow: '0 0 8px var(--accent-glow)'
                  }} 
                />
              ) : (
                <User size={14} />
              )}
              <span>Meu Perfil</span>
            </Link>
          ) : (
            <Link to="/login" className="nav-btn">Entrar</Link>
          )}
        </div>
        
      </div>
    </nav>
  );
}

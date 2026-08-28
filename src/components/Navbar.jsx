import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Swords } from 'lucide-react';
import '../styles/index.css';

export default function Navbar() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return user?.user_metadata?.avatar_url || (user?.id ? localStorage.getItem('ametist_user_avatar_' + user.id) : null);
  });

  useEffect(() => {
    const current = user?.user_metadata?.avatar_url || (user?.id ? localStorage.getItem('ametist_user_avatar_' + user.id) : null);
    setAvatarUrl(current);

    const handleAvatarUpdate = (e) => {
      if (e.detail?.userId === user?.id || !e.detail?.userId) {
        setAvatarUrl(e.detail?.avatarUrl || null);
      }
    };

    window.addEventListener('ametist-avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('ametist-avatar-updated', handleAvatarUpdate);
  }, [user]);

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
          <Link to="/duelo" className="nav-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Swords size={14} /> Duelo
          </Link>
          <Link to="/template-maker" className="nav-item">Criar Modelo</Link>
        </div>

        {/* Right Side: Auth */}
        <div className="navbar-auth">
          {user ? (
            <Link to="/profile" className="nav-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
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

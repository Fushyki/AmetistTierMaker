import React from 'react';
import '../index.css';

export default function Footer() {
  return (
    <footer className="ametist-footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} Ametist. Todos os direitos reservados.</p>
        <p className="footer-sub">A plataforma definitiva para criar e compartilhar suas Tier Lists.</p>
      </div>
    </footer>
  );
}

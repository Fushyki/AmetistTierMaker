import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { isAdmin } from '../utils/admin';
import '../index.css';

export default function Home() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('id, name, cover_image, created_at, user_id')
          .eq('is_public', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Erro ao carregar templates (a tabela existe?):", error.message);
          setTemplates([]);
        } else {
          setTemplates(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleDeleteTemplate = async (templateId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Tem certeza que deseja deletar este template para sempre?")) {
      const { error } = await supabase.from('templates').delete().eq('id', templateId);
      if (!error) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      } else {
        alert("Erro ao deletar: " + error.message);
      }
    }
  };

  const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="tierlist-container" style={{ textAlign: 'center', marginTop: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
        <img src="/ametist-logo.png" alt="Ametist Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
        <img src="/ametist-text.png" alt="Bem-vindo ao Ametist" style={{ height: '35px', objectFit: 'contain' }} />
      </div>
      <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '1.1rem' }}>
        Crie suas próprias Tier Lists de forma rápida e mobile-friendly!
      </p>

      <div style={{ background: 'linear-gradient(90deg, rgba(176,98,235,0.1) 0%, rgba(255,215,0,0.1) 100%)', padding: '15px 30px', borderRadius: '12px', border: '1px solid rgba(176,98,235,0.3)', marginBottom: '40px', maxWidth: '600px' }}>
        <p style={{ margin: 0, color: '#ddd', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {!user ? (
            "Crie sua conta gratuitamente para salvar suas Tier Lists e criar seus templates, além de continuar editando elas de qualquer dispositivo, a qualquer momento."
          ) : (
            "Bem-vindo de volta! Escolha um modelo da comunidade abaixo para começar, ou clique em 'Criar Modelo' no topo para montar a sua própria base de personagens."
          )}
        </p>
      </div>

      <div style={{ marginTop: '20px', width: '100%', maxWidth: '1000px' }}>
        <h2 style={{ color: '#fff', marginBottom: '20px' }}>Novos Templates da Comunidade</h2>
        
        <input 
          type="search" 
          placeholder="Buscar template..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '12px 20px', borderRadius: '30px', border: '1px solid #3a3a40', backgroundColor: '#1a1a1c', color: '#fff', fontSize: '1rem', marginBottom: '30px', outline: 'none' }}
        />

        {isLoading ? (
          <p style={{ color: '#aaa' }}>Carregando templates...</p>
        ) : filteredTemplates.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filteredTemplates.map(template => (
              <div key={template.id} style={{ position: 'relative' }}>
                <Link to={`/tierlist?templateId=${template.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="template-card" style={{ backgroundColor: '#212124', borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.2s', border: '1px solid #333' }}>
                    <div style={{ width: '100%', height: '160px', overflow: 'hidden', position: 'relative' }}>
                      <img 
                        src={template.cover_image} 
                        alt={template.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300x160?text=Sem+Capa' }}
                      />
                    </div>
                    <div style={{ padding: '15px' }}>
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.name}</h3>
                      <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>{new Date(template.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Link>
                {user && (user.id === template.user_id || isAdmin(user)) && (
                  <button 
                    onClick={(e) => handleDeleteTemplate(template.id, e)}
                    style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(255,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Excluir Template"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#aaa' }}>Nenhum template encontrado.</p>
        )}
      </div>
    </div>
  );
}

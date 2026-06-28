import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
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
          .select('id, name, cover_image, created_at')
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

  const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="tierlist-container" style={{ textAlign: 'center', marginTop: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>Bem-vindo ao Ametist</h1>
      <p style={{ color: '#aaa', marginBottom: '10px', fontSize: '1.1rem' }}>
        Crie suas próprias Tier Lists de forma rápida e mobile-friendly!
      </p>

      <div style={{ background: 'linear-gradient(90deg, rgba(176,98,235,0.1) 0%, rgba(255,215,0,0.1) 100%)', padding: '15px 30px', borderRadius: '12px', border: '1px solid rgba(176,98,235,0.3)', marginBottom: '40px', maxWidth: '600px' }}>
        <p style={{ margin: 0, color: '#ddd', fontSize: '0.95rem', lineHeight: '1.5' }}>
          Crie sua conta gratuitamente para salvar suas Tier Lists e continuar editando elas de qualquer dispositivo, a qualquer momento.
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

      <div style={{ marginTop: '50px', width: '100%', maxWidth: '1000px' }}>
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
              <Link to={`/tierlist?templateId=${template.id}`} key={template.id} style={{ textDecoration: 'none' }}>
                <div className="template-card" style={{ backgroundColor: '#212124', borderRadius: '12px', overflow: 'hidden', border: '1px solid #3a3a40', transition: 'transform 0.2s', cursor: 'pointer' }}
                     onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                     onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ width: '100%', aspectRatio: '16/9', backgroundImage: `url(${template.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#111' }}>
                    {!template.cover_image && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Sem Capa</div>}
                  </div>
                  <div style={{ padding: '15px', textAlign: 'left' }}>
                    <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>{template.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: '#aaa' }}>Nenhum template encontrado.</p>
        )}
      </div>
    </div>
  );
}

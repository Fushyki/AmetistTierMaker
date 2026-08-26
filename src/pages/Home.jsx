import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { isAdmin } from '../utils/admin';
import { confirmAction } from '../utils/alerts';
import { Trash2, Pencil } from 'lucide-react';
import { TEMPLATE_CATEGORIES } from '../data/categories';
import CategoryBadge, { CategoryIcon } from '../components/CategoryBadge';
import toast from 'react-hot-toast';
import '../styles/index.css';

export default function Home() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('id, name, cover_image, created_at, user_id, data')
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
    const isConfirmed = await confirmAction(
      'Deletar Template',
      'Tem certeza que deseja deletar este template para sempre?',
      'Sim, deletar'
    );
    if (isConfirmed) {
      const { error } = await supabase.from('templates').delete().eq('id', templateId);
      if (!error) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        toast.success("Template removido com sucesso!");
      } else {
        toast.error("Erro ao deletar: " + error.message);
      }
    }
  };

  const filteredTemplates = templates.filter(t => {
    const name = t.name || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const itemCat = t.data?.category || 'games';
    const matchesCat = selectedCategory === 'todos' || itemCat === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="tierlist-container" style={{ textAlign: 'center', marginTop: '55px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <img src="/ametist-logo.png" alt="Ametist Logo" className="hero-logo-icon" />
        <img src="/ametist-text.png" alt="Bem-vindo ao Ametist" className="hero-logo-text" />
      </div>
      <p style={{ color: '#8e8e99', marginBottom: '18px', fontSize: '0.95rem' }}>
        Crie suas próprias Tier Lists de forma rápida e mobile-friendly!
      </p>

      <div style={{ background: 'linear-gradient(90deg, rgba(176,98,235,0.08) 0%, rgba(255,215,0,0.06) 100%)', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(176,98,235,0.25)', marginBottom: '22px', maxWidth: '600px' }}>
        <p style={{ margin: 0, color: '#ccc', fontSize: '0.85rem', lineHeight: '1.4' }}>
          {!user ? (
            "Crie sua conta gratuitamente para salvar suas Tier Lists e criar seus templates, além de continuar editando elas de qualquer dispositivo, a qualquer momento."
          ) : (
            "Bem-vindo de volta! Escolha um modelo da comunidade abaixo para começar, ou clique em 'Criar Modelo' no topo para montar a sua própria base de personagens."
          )}
        </p>
      </div>

      <div style={{ marginTop: '5px', width: '100%', maxWidth: '1200px' }}>
        <h2 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.25rem' }}>Modelos da Comunidade</h2>
        
        {/* Barra de Busca */}
        <input 
          type="search" 
          placeholder="Buscar modelo..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '360px', padding: '9px 18px', borderRadius: '24px', border: '1px solid #33333d', backgroundColor: '#141416', color: '#fff', fontSize: '0.9rem', marginBottom: '16px', outline: 'none' }}
        />

        {/* Barra de Filtros de Categoria */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '22px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {TEMPLATE_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '7px 15px',
                  borderRadius: '20px',
                  border: isSelected ? `1px solid ${cat.color}` : '1px solid #2f2f38',
                  backgroundColor: isSelected ? `${cat.color}22` : '#18181b',
                  color: isSelected ? '#ffffff' : '#9999a5',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? '600' : '400',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px'
                }}
              >
                <CategoryIcon name={cat.iconName} size={15} color={isSelected ? cat.color : '#888899'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Carregando templates...</p>
        ) : filteredTemplates.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
            {filteredTemplates.map(template => (
              <div key={template.id} style={{ position: 'relative' }}>
                <Link to={`/tierlist?templateId=${template.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="template-card" style={{ backgroundColor: '#18181b', borderRadius: '10px', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid #28282e', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ width: '100%', height: '120px', overflow: 'hidden', position: 'relative' }}>
                      <img 
                        src={template.cover_image} 
                        alt={template.name} 
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300x160?text=Sem+Capa' }}
                      />
                    </div>
                    <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
                      <div>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                          {template.name}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <CategoryBadge categoryId={template.data?.category || 'games'} />
                        <span style={{ margin: 0, color: '#666', fontSize: '0.75rem' }}>
                          {new Date(template.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                {user && (user.id === template.user_id || isAdmin(user)) && (
                  <>
                    <button 
                      onClick={(e) => handleDeleteTemplate(template.id, e)}
                      style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(255,0,0,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Excluir Template"
                    >
                      <Trash2 size={15} />
                    </button>
                    <Link to={`/template-maker?editTemplateId=${template.id}`}>
                      <button 
                        style={{ position: 'absolute', top: '8px', right: '44px', backgroundColor: 'rgba(33, 150, 243, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Editar Template"
                      >
                        <Pencil size={15} />
                      </button>
                    </Link>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#777', fontSize: '0.9rem', marginTop: '20px' }}>Nenhum template encontrado nesta categoria.</p>
        )}
      </div>
    </div>
  );
}

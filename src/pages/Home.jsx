import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabaseClient';
import { isAdmin } from '../utils/admin';
import { confirmAction } from '../utils/alerts';
import { Trash2, Pencil, Star, Sparkles } from 'lucide-react';
import { TEMPLATE_CATEGORIES } from '../data/categories';
import CategoryBadge, { CategoryIcon } from '../components/CategoryBadge';
import toast from 'react-hot-toast';
import '../styles/index.css';

export default function Home() {
  const { user } = useAuth();
  const { showCustomToast, activeTheme } = useTheme();
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
          .neq('name', '__SYSTEM_ANNOUNCEMENT__')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Erro ao carregar templates:", error.message);
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
        if (showCustomToast) {
          showCustomToast('Template Removido', 'O template foi excluído com sucesso.', 'palette');
        } else {
          toast.success("Template removido com sucesso!");
        }
      } else {
        toast.error("Erro ao deletar: " + error.message);
      }
    }
  };

  const handleToggleFeature = async (template, e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentFeatured = Boolean(template.data?.is_featured);
    const newFeatured = !currentFeatured;
    const updatedData = { ...(template.data || {}), is_featured: newFeatured };

    try {
      const { error } = await supabase
        .from('templates')
        .update({ data: updatedData })
        .eq('id', template.id);

      if (error) throw error;

      setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, data: updatedData } : t));
      if (showCustomToast) {
        showCustomToast(
          newFeatured ? 'Template em Destaque' : 'Destaque Removido',
          `"${template.name}" ${newFeatured ? 'foi fixado nos destaques da Home!' : 'foi removido dos destaques.'}`,
          'palette'
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar destaque: ' + err.message);
    }
  };

  const validTemplates = templates.filter(t => t.name !== '__SYSTEM_ANNOUNCEMENT__');
  const featuredTemplates = validTemplates.filter(t => t.data?.is_featured);

  const filteredTemplates = validTemplates.filter(t => {
    const name = t.name || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const itemCat = t.data?.category || 'games';
    const matchesCat = selectedCategory === 'todos' || itemCat === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="tierlist-container" style={{ textAlign: 'center', margin: '15px auto 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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

      {/* SEÇÃO: DESTAQUES DO AMETIST (PINADOS PELO ADMIN) */}
      {featuredTemplates.length > 0 && !searchTerm && selectedCategory === 'todos' && (
        <div style={{ width: '100%', maxWidth: '1200px', marginBottom: '32px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Star size={18} fill="#facc15" color="#facc15" />
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: '700' }}>
              Destaques da Comunidade
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.15)', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
              Recomendados
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px' }}>
            {featuredTemplates.map(template => (
              <div 
                key={`feat-${template.id}`} 
                style={{ 
                  position: 'relative',
                  borderRadius: '10px',
                  boxShadow: '0 4px 20px rgba(250, 204, 21, 0.12)'
                }}
              >
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(250, 204, 21, 0.95)', color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px', zIndex: 5, boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                  <Star size={10} fill="#000" color="#000" /> DESTAQUE
                </div>

                <Link to={`/tierlist?templateId=${template.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="template-card" style={{ backgroundColor: '#18181b', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(250, 204, 21, 0.45)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ width: '100%', height: '125px', overflow: 'hidden', position: 'relative' }}>
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
                        <span style={{ margin: 0, color: '#facc15', fontSize: '0.75rem', fontWeight: '600' }}>
                          Montar agora →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {isAdmin(user) && (
                  <button 
                    onClick={(e) => handleToggleFeature(template, e)}
                    style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#facc15', color: '#000', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                    title="Remover Destaque"
                  >
                    <Star size={14} fill="#000" color="#000" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GALERIA GERAL DE TEMPLATES */}
      <div style={{ marginTop: '5px', width: '100%', maxWidth: '1200px' }}>
        <h2 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.25rem' }}>Todos os Modelos</h2>
        
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
                {template.data?.is_featured && (
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(250, 204, 21, 0.95)', color: '#000', padding: '2px 7px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px', zIndex: 5, boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                    <Star size={9} fill="#000" color="#000" /> DESTAQUE
                  </div>
                )}

                <Link to={`/tierlist?templateId=${template.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="template-card" style={{ backgroundColor: '#18181b', borderRadius: '10px', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', border: template.data?.is_featured ? '1px solid rgba(250, 204, 21, 0.35)' : '1px solid #28282e', height: '100%', display: 'flex', flexDirection: 'column' }}>
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

                {/* Ações de Moderação do Admin / Dono */}
                {user && (user.id === template.user_id || isAdmin(user)) && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '5px', zIndex: 10 }}>
                    {isAdmin(user) && (
                      <button 
                        onClick={(e) => handleToggleFeature(template, e)}
                        style={{ backgroundColor: template.data?.is_featured ? '#facc15' : 'rgba(0,0,0,0.7)', color: template.data?.is_featured ? '#000' : '#facc15', border: '1px solid #facc15', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
                        title={template.data?.is_featured ? "Remover Destaque" : "Fixar como Destaque"}
                      >
                        <Star size={13} fill={template.data?.is_featured ? "#000" : "none"} color={template.data?.is_featured ? "#000" : "#facc15"} />
                      </button>
                    )}
                    <Link to={`/template-maker?editTemplateId=${template.id}`}>
                      <button 
                        style={{ backgroundColor: 'rgba(33, 150, 243, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
                        title="Editar Template"
                      >
                        <Pencil size={13} />
                      </button>
                    </Link>
                    <button 
                      onClick={(e) => handleDeleteTemplate(template.id, e)}
                      style={{ backgroundColor: 'rgba(255,0,0,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
                      title="Excluir Template"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
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


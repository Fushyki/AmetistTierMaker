import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabaseClient';
import { isAdmin } from '../utils/admin';
import { confirmAction } from '../utils/alerts';
import { 
  Trash2, 
  Pencil, 
  Star, 
  Sparkles, 
  Swords, 
  Layers, 
  Plus, 
  Heart, 
  Clock, 
  Flame 
} from 'lucide-react';
import { TEMPLATE_CATEGORIES } from '../data/categories';
import CategoryBadge, { CategoryIcon } from '../components/CategoryBadge';
import { notify, toast } from '../utils/notifications';
import { getUserLikedTemplateIds, toggleTemplateLike } from '../utils/likesManager';
import '../styles/index.css';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [sortBy, setSortBy] = useState('recentes'); // 'recentes' ou 'populares'
  const [isLoading, setIsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState([]);

  // Carregar curtidas locais do usuário
  useEffect(() => {
    if (user?.id) {
      setLikedIds(getUserLikedTemplateIds(user.id));
    } else {
      setLikedIds([]);
    }
  }, [user]);

  // Listener para sincronizar curtidas
  useEffect(() => {
    const handleLikesSync = (e) => {
      const { templateId, isLiked, likesCount } = e.detail || {};
      if (user?.id) {
        setLikedIds(getUserLikedTemplateIds(user.id));
      }
      setTemplates(prev => prev.map(t => {
        if (t.id === templateId) {
          return {
            ...t,
            data: {
              ...(t.data || {}),
              likes_count: likesCount
            }
          };
        }
        return t;
      }));
    };

    window.addEventListener('ametist-likes-updated', handleLikesSync);
    return () => window.removeEventListener('ametist-likes-updated', handleLikesSync);
  }, [user]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('id, name, cover_image, created_at, user_id, data')
          .eq('is_public', true)
          .not('name', 'like', '__%')
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

  const handleLikeClick = async (template, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info('Faça login para curtir e salvar este modelo nos seus favoritos!');
      navigate('/login');
      return;
    }

    const res = await toggleTemplateLike(template, user);
    if (res.success) {
      if (res.isLiked) {
        toast.success(`"${template.name}" adicionado aos seus favoritos!`);
      } else {
        toast.info(`"${template.name}" removido dos favoritos.`);
      }
    }
  };

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
        notify.success('Template Removido', 'O template foi excluído com sucesso.');
      } else {
        notify.error('Erro ao Deletar', error.message);
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
      notify.custom(
        newFeatured ? 'Template em Destaque' : 'Destaque Removido',
        `"${template.name}" ${newFeatured ? 'foi fixado nos destaques da Home!' : 'foi removido dos destaques.'}`,
        'palette'
      );
    } catch (err) {
      console.error(err);
      notify.error('Erro ao Atualizar', err.message);
    }
  };

  const validTemplates = templates.filter(t => t.name !== '__SYSTEM_ANNOUNCEMENT__');
  const featuredTemplates = validTemplates.filter(t => t.data?.is_featured);

  // Filtragem e Ordenação
  const filteredTemplates = validTemplates
    .filter(t => {
      const name = t.name || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const itemCat = t.data?.category || 'games';
      const matchesCat = selectedCategory === 'todos' || itemCat === selectedCategory;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (sortBy === 'populares') {
        const likesA = a.data?.likes_count || 0;
        const likesB = b.data?.likes_count || 0;
        return likesB - likesA;
      }
      return new Date(b.created_at) - new Date(a.created_at);
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

      <div style={{ background: 'linear-gradient(90deg, rgba(176,98,235,0.08) 0%, rgba(255,215,0,0.06) 100%)', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(176,98,235,0.25)', marginBottom: '18px', maxWidth: '600px' }}>
        <p style={{ margin: 0, color: '#ccc', fontSize: '0.85rem', lineHeight: '1.4' }}>
          {!user ? (
            "Crie sua conta gratuitamente para salvar suas Tier Lists na nuvem, publicar modelos na comunidade e favoritar seus templates preferidos."
          ) : (
            "Bem-vindo de volta! Escolha um modelo da comunidade abaixo para começar, ou clique em 'Criar Modelo' no topo para montar a sua própria base de personagens."
          )}
        </p>
      </div>

      {/* Botões de Ação Rápida */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
        <Link to="/tierlist" className="btn-primary" style={{ padding: '10px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <Layers size={16} /> Montar Tier List
        </Link>
        <Link to="/duelo" className="btn-secondary" style={{ padding: '10px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', borderColor: activeTheme?.accentBorder || 'rgba(176,98,235,0.4)', color: '#fff' }}>
          <Swords size={16} color={activeTheme?.accentColor || '#b062eb'} /> Modo Duelo
        </Link>
        <Link to="/template-maker" className="btn-secondary" style={{ padding: '10px 18px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
          <Plus size={15} /> Criar Modelo
        </Link>
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

          <div className="template-grid-responsive">
            {featuredTemplates.map(template => {
              const isLiked = likedIds.includes(template.id);
              const likesCount = template.data?.likes_count || 0;

              return (
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

                  {/* Botão de Curtida no Card de Destaque */}
                  <button
                    type="button"
                    onClick={(e) => handleLikeClick(template, e)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(18, 18, 22, 0.85)',
                      backdropFilter: 'blur(4px)',
                      border: isLiked ? '1px solid #ef4444' : '1px solid #33333e',
                      borderRadius: '20px',
                      padding: '3px 8px',
                      color: isLiked ? '#ef4444' : '#aaa',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      zIndex: 5,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      transition: 'all 0.15s'
                    }}
                    title={isLiked ? 'Descurtir' : 'Curtir e Salvar nos Favoritos'}
                  >
                    <Heart size={12} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#aaa'} />
                    <span>{likesCount}</span>
                  </button>

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
                      style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: '#facc15', color: '#000', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                      title="Remover Destaque"
                    >
                      <Star size={13} fill="#000" color="#000" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GALERIA GERAL DE TEMPLATES */}
      <div style={{ marginTop: '5px', width: '100%', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '1.25rem' }}>Todos os Modelos</h2>
          
          {/* Alternador de Ordenação (Recentes vs Populares) */}
          <div style={{ display: 'flex', background: '#16161c', padding: '3px', borderRadius: '10px', border: '1px solid #282834' }}>
            <button
              type="button"
              onClick={() => setSortBy('recentes')}
              style={{
                padding: '5px 12px',
                borderRadius: '7px',
                border: 'none',
                background: sortBy === 'recentes' ? (activeTheme?.accentColor || '#b062eb') : 'transparent',
                color: sortBy === 'recentes' ? '#fff' : '#888',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Clock size={13} /> Recentes
            </button>
            <button
              type="button"
              onClick={() => setSortBy('populares')}
              style={{
                padding: '5px 12px',
                borderRadius: '7px',
                border: 'none',
                background: sortBy === 'populares' ? (activeTheme?.accentColor || '#b062eb') : 'transparent',
                color: sortBy === 'populares' ? '#fff' : '#888',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Flame size={13} /> Mais Curtidos
            </button>
          </div>
        </div>
        
        {/* Barra de Busca */}
        <input 
          type="search" 
          placeholder="Buscar modelo..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '360px', padding: '9px 18px', borderRadius: '24px', border: '1px solid #33333d', backgroundColor: '#141416', color: '#fff', fontSize: '0.9rem', marginBottom: '16px', outline: 'none' }}
        />

        {/* Barra de Filtros de Categoria */}
        <div className="categories-scroll-bar">
          {TEMPLATE_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: isSelected ? `1px solid ${cat.color}` : '1px solid #2f2f38',
                  backgroundColor: isSelected ? `${cat.color}22` : '#18181b',
                  color: isSelected ? '#ffffff' : '#9999a5',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? '600' : '400',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0
                }}
              >
                <CategoryIcon name={cat.iconName} size={14} color={isSelected ? cat.color : '#888899'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Carregando templates...</p>
        ) : filteredTemplates.length > 0 ? (
          <div className="template-grid-responsive">
            {filteredTemplates.map(template => {
              const isLiked = likedIds.includes(template.id);
              const likesCount = template.data?.likes_count || 0;

              return (
                <div key={template.id} style={{ position: 'relative' }}>
                  {template.data?.is_featured && (
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(250, 204, 21, 0.95)', color: '#000', padding: '2px 7px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px', zIndex: 5, boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                      <Star size={9} fill="#000" color="#000" /> DESTAQUE
                    </div>
                  )}

                  {/* Botão de Curtida / Favorito */}
                  <button
                    type="button"
                    onClick={(e) => handleLikeClick(template, e)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(18, 18, 22, 0.85)',
                      backdropFilter: 'blur(4px)',
                      border: isLiked ? '1px solid #ef4444' : '1px solid #33333e',
                      borderRadius: '20px',
                      padding: '3px 8px',
                      color: isLiked ? '#ef4444' : '#aaa',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      zIndex: 5,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      transition: 'all 0.15s'
                    }}
                    title={isLiked ? 'Descurtir' : 'Curtir e Salvar nos Favoritos'}
                  >
                    <Heart size={12} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#aaa'} />
                    <span>{likesCount}</span>
                  </button>

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
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '5px', zIndex: 10 }}>
                      {isAdmin(user) && (
                        <button 
                          onClick={(e) => handleToggleFeature(template, e)}
                          style={{ backgroundColor: template.data?.is_featured ? '#facc15' : 'rgba(0,0,0,0.7)', color: template.data?.is_featured ? '#000' : '#facc15', border: '1px solid #facc15', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
                          title={template.data?.is_featured ? "Remover Destaque" : "Fixar como Destaque"}
                        >
                          <Star size={12} fill={template.data?.is_featured ? "#000" : "none"} color={template.data?.is_featured ? "#000" : "#facc15"} />
                        </button>
                      )}
                      <Link to={`/template-maker?editTemplateId=${template.id}`}>
                        <button 
                          style={{ backgroundColor: 'rgba(33, 150, 243, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
                          title="Editar Template"
                        >
                          <Pencil size={12} />
                        </button>
                      </Link>
                      <button 
                        onClick={(e) => handleDeleteTemplate(template.id, e)}
                        style={{ backgroundColor: 'rgba(255,0,0,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
                        title="Excluir Template"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#777', fontSize: '0.9rem', marginTop: '20px' }}>Nenhum template encontrado nesta categoria.</p>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { confirmAction } from '../utils/alerts';
import { isAdmin } from '../utils/admin';
import '../index.css';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tierlists, setTierlists] = useState([]);
  const [userTemplates, setUserTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [sortDateAsc, setSortDateAsc] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTierlists();
      fetchUserTemplates();
    }
  }, [user]);

  const fetchTierlists = async () => {
    try {
      const { data, error } = await supabase
        .from('tierlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTierlists(data || []);
    } catch (err) {
      console.error('Erro ao buscar tierlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, is_public, cover_image, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserTemplates(data || []);
    } catch (err) {
      console.error('Erro ao buscar templates:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleEdit = (tierlist) => {
    localStorage.setItem('tierlist-current-id', tierlist.id);
    navigate('/tierlist');
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction(
      'Deletar Tier List',
      'Tem certeza que deseja deletar essa tierlist da nuvem?',
      'Sim, deletar'
    );
    if (isConfirmed) {
      await supabase.from('tierlists').delete().eq('id', id);
      fetchTierlists();
    }
  };

  const handleDeleteTemplate = async (id) => {
    const isConfirmed = await confirmAction(
      'Deletar Template',
      'Tem certeza que deseja deletar este TEMPLATE da nuvem? Isso afetará a Galeria se ele for público.',
      'Sim, deletar template'
    );
    if (isConfirmed) {
      await supabase.from('templates').delete().eq('id', id);
      fetchUserTemplates();
    }
  };

  if (!user) {
    return (
      <div className="tierlist-container" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>Você não está logado.</h2>
        <Link to="/login" style={{ color: '#ffd700' }}>Fazer Login</Link>
      </div>
    );
  }

  const containerBg = isAdmin(user) ? '#2a1114' : '#161618'; // Dark wine for admin, dark grey for user
  const cardBg = isAdmin(user) ? '#3b181d' : '#222';
  const templateCardBg = isAdmin(user) ? '#3b181d' : '#212124';

  return (
    <div className="tierlist-container" style={{ maxWidth: '800px', margin: '50px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
        <h1>Painel do Usuário</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ color: '#888' }}>{user.email}</span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#ff4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </div>
      
      <div style={{ background: containerBg, padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Suas Tier Lists Salvas na Nuvem</h3>
        </div>
        
        {loading ? (
          <p>Carregando...</p>
        ) : tierlists.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Nenhuma Tier List salva ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tierlists.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: cardBg, padding: '15px', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold', color: 'white' }}>{t.name}</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEdit(t)} style={{ padding: '8px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(t.id)} style={{ padding: '8px 15px', backgroundColor: 'transparent', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '4px', cursor: 'pointer' }}>
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: containerBg, padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a', marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h3>Seus Modelos Criados (Templates)</h3>
          
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Buscar seus templates..." 
              value={templateSearchTerm}
              onChange={(e) => setTemplateSearchTerm(e.target.value)}
              style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #3a3a40', backgroundColor: '#212124', color: '#fff', minWidth: '250px' }}
            />
            
            <button 
              onClick={() => setSortDateAsc(!sortDateAsc)}
              style={{ padding: '10px 15px', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: '8px', cursor: 'pointer' }}
            >
              Data ({sortDateAsc ? 'Antigos' : 'Recentes'})
            </button>
          </div>
        </div>
        
        {loading ? (
          <p>Carregando...</p>
        ) : userTemplates.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Nenhum template criado ainda.</p>
        ) : (() => {
          const filtered = userTemplates
            .filter(t => t.name.toLowerCase().includes(templateSearchTerm.toLowerCase()))
            .sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return sortDateAsc ? dateA - dateB : dateB - dateA;
            });

          if (filtered.length === 0) return <p style={{ color: '#888', fontSize: '0.9rem' }}>Nenhum template encontrado com essa busca.</p>;

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filtered.map(template => (
                <div key={template.id} style={{ position: 'relative' }}>
                  <Link to={`/tierlist?templateId=${template.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="template-card" style={{ backgroundColor: templateCardBg, borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.2s', border: template.is_public ? '2px solid #4CAF50' : '2px solid #f44336' }}>
                      <div style={{ width: '100%', height: '160px', overflow: 'hidden', position: 'relative' }}>
                        <img 
                          src={template.cover_image} 
                          alt={template.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x160?text=Sem+Capa' }}
                        />
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: template.is_public ? '#4CAF50' : '#f44336', fontWeight: 'bold' }}>
                          {template.is_public ? 'Público' : 'Privado'}
                        </div>
                      </div>
                      <div style={{ padding: '15px' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.name}</h3>
                        <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>{new Date(template.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Link>
                  <button 
                    onClick={() => handleDeleteTemplate(template.id)}
                    style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(255,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Excluir Template"
                  >
                    🗑️
                  </button>
                  <Link to={`/template-maker?editTemplateId=${template.id}`}>
                    <button 
                      style={{ position: 'absolute', top: '10px', right: '55px', backgroundColor: 'rgba(33, 150, 243, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Editar Template"
                    >
                      ✏️
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

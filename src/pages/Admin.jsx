import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import '../index.css';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tierlists, setTierlists] = useState([]);
  const [userTemplates, setUserTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

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
        .select('id, name, is_public')
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

  const handleCreateNew = () => {
    localStorage.removeItem('tierlist-current-id');
    navigate('/tierlist');
  };

  const handleEdit = (tierlist) => {
    localStorage.setItem('tierlist-current-id', tierlist.id);
    navigate('/tierlist');
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar essa tierlist da nuvem?')) {
      await supabase.from('tierlists').delete().eq('id', id);
      fetchTierlists();
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (confirm('Tem certeza que deseja deletar este TEMPLATE da nuvem? Isso afetará a Galeria se ele for público.')) {
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
      
      <div style={{ background: '#161618', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Suas Tier Lists Salvas na Nuvem</h3>
          <button onClick={handleCreateNew} style={{ padding: '10px 20px', backgroundColor: '#ffd700', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Criar Nova
          </button>
        </div>
        
        {loading ? (
          <p>Carregando...</p>
        ) : tierlists.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Nenhuma Tier List salva ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tierlists.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#222', padding: '15px', borderRadius: '8px' }}>
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

      <div style={{ background: '#161618', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a', marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Seus Modelos Criados (Templates)</h3>
          <Link to="/template-maker">
            <button style={{ padding: '10px 20px', backgroundColor: '#b062eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Criar Novo Modelo
            </button>
          </Link>
        </div>
        
        {loading ? (
          <p>Carregando...</p>
        ) : userTemplates.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Nenhum template criado ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {userTemplates.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#222', padding: '15px', borderRadius: '8px', borderLeft: t.is_public ? '4px solid #4CAF50' : '4px solid #f44336' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: 'white', display: 'block' }}>{t.name}</span>
                  <span style={{ fontSize: '0.8rem', color: t.is_public ? '#4CAF50' : '#f44336' }}>
                    {t.is_public ? 'Visível na Galeria (Público)' : 'Apenas para você (Privado)'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link to={`/tierlist?templateId=${t.id}`}>
                    <button style={{ padding: '8px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Usar
                    </button>
                  </Link>
                  <button onClick={() => handleDeleteTemplate(t.id)} style={{ padding: '8px 15px', backgroundColor: 'transparent', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '4px', cursor: 'pointer' }}>
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

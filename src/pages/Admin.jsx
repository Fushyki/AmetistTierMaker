import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import '../index.css';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tierlists, setTierlists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTierlists();
    }
  }, [user]);

  const fetchTierlists = async () => {
    try {
      const { data, error } = await supabase
        .from('tierlists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTierlists(data || []);
    } catch (err) {
      console.error('Erro ao buscar tierlists:', err);
    } finally {
      setLoading(false);
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
    </div>
  );
}

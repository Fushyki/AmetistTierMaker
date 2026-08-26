import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { confirmAction } from '../utils/alerts';
import { isAdmin } from '../utils/admin';
import { Trash2, Pencil } from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import '../styles/index.css';

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

  const handleRename = async (id, currentName) => {
    const { value: newName } = await Swal.fire({
      title: 'Renomear Tier List',
      input: 'text',
      inputValue: currentName,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar',
      background: '#1a1a1c',
      color: '#ffffff',
      confirmButtonColor: '#b062eb',
      inputValidator: (value) => {
        if (!value) return 'O nome não pode ser vazio!';
      }
    });

    if (newName && newName !== currentName) {
      const { error } = await supabase
        .from('tierlists')
        .update({ name: newName })
        .eq('id', id);

      if (error) {
        console.error('Erro ao renomear:', error);
        toast.error('Erro ao renomear a Tier List.');
      } else {
        toast.success('Tier List renomeada!');
        fetchTierlists();
      }
    }
  };

  const handleEdit = (tierlist) => {
    if (tierlist.data && tierlist.data.type === 'copa') {
      localStorage.setItem('copa-current-id', tierlist.id);
      localStorage.setItem('copa-name', tierlist.name);
      localStorage.setItem('copa-inventory-v3', JSON.stringify(tierlist.data.inventory || []));
      localStorage.setItem('copa-matches-v3', JSON.stringify(tierlist.data.matches || {}));
      navigate(`/copa?id=${tierlist.id}`);
    } else {
      localStorage.setItem('tierlist-current-id', tierlist.id);
      localStorage.setItem('tierlist-force-cloud-load', 'true');
      navigate('/tierlist');
    }
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
  const cardBg = '#222';
  const templateCardBg = '#212124';

  return (
    <div className="tierlist-container" style={{ maxWidth: '880px', margin: '55px auto 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #28282e', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Painel do Usuário</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#888', fontSize: '0.85rem', wordBreak: 'break-all' }}>{user.email}</span>
          <button onClick={handleLogout} style={{ padding: '6px 14px', backgroundColor: '#ff4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
            Sair
          </button>
        </div>
      </div>
      
      <div style={{ background: containerBg, padding: '16px', borderRadius: '10px', border: '1px solid #28282e' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Suas Tier Lists Salvas na Nuvem</h3>
        </div>
        
        {loading ? (
          <p style={{ fontSize: '0.85rem' }}>Carregando...</p>
        ) : tierlists.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>Nenhuma Tier List salva ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tierlists.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: cardBg, padding: '10px 14px', borderRadius: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem', wordBreak: 'break-word' }}>{t.name}</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button onClick={() => handleRename(t.id, t.name)} style={{ padding: '5px 10px', backgroundColor: '#3a3a40', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Renomear
                  </button>
                  <button onClick={() => handleEdit(t)} style={{ padding: '5px 12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(t.id)} style={{ padding: '5px 10px', backgroundColor: 'transparent', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: containerBg, padding: '16px', borderRadius: '10px', border: '1px solid #28282e', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Seus Modelos Criados (Templates)</h3>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Buscar seus templates..." 
              value={templateSearchTerm}
              onChange={(e) => setTemplateSearchTerm(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #33333d', backgroundColor: '#18181b', color: '#fff', fontSize: '0.85rem', minWidth: '200px' }}
            />
            
            <button 
              onClick={() => setSortDateAsc(!sortDateAsc)}
              style={{ padding: '7px 12px', backgroundColor: '#28282d', color: '#fff', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Data ({sortDateAsc ? 'Antigos' : 'Recentes'})
            </button>
          </div>
        </div>
        
        {loading ? (
          <p style={{ fontSize: '0.85rem' }}>Carregando...</p>
        ) : userTemplates.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>Nenhum template criado ainda.</p>
        ) : (() => {
          const filtered = userTemplates
            .filter(t => t.name.toLowerCase().includes(templateSearchTerm.toLowerCase()))
            .sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return sortDateAsc ? dateA - dateB : dateB - dateA;
            });

          if (filtered.length === 0) return <p style={{ color: '#888', fontSize: '0.85rem' }}>Nenhum template encontrado com essa busca.</p>;

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {filtered.map(template => (
                <div key={template.id} style={{ position: 'relative' }}>
                  <Link to={`/tierlist?templateId=${template.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="template-card" style={{ backgroundColor: templateCardBg, borderRadius: '10px', overflow: 'hidden', transition: 'transform 0.2s', border: template.is_public ? '2px solid #4CAF50' : '2px solid #f44336' }}>
                      <div style={{ width: '100%', height: '120px', overflow: 'hidden', position: 'relative' }}>
                        <img 
                          src={template.cover_image} 
                          alt={template.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x160?text=Sem+Capa' }}
                        />
                        <div style={{ position: 'absolute', bottom: '6px', left: '6px', backgroundColor: 'rgba(0,0,0,0.75)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', color: template.is_public ? '#4CAF50' : '#f44336', fontWeight: 'bold' }}>
                          {template.is_public ? 'Público' : 'Privado'}
                        </div>
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.name}</h3>
                        <p style={{ margin: 0, color: '#777', fontSize: '0.78rem' }}>{new Date(template.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Link>
                  <button 
                    onClick={() => handleDeleteTemplate(template.id)}
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
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

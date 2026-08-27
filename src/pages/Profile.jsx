import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabaseClient';
import { isAdmin } from '../utils/admin';
import { confirmAction } from '../utils/alerts';
import { 
  Palette, 
  User, 
  Layers, 
  Sparkles, 
  Trash2, 
  Pencil, 
  Check, 
  LogOut, 
  KeyRound, 
  ExternalLink,
  ShieldAlert,
  Sliders,
  FolderHeart,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import '../styles/index.css';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { siteTheme, setSiteTheme, uiDensity, setUiDensity, availableThemes, activeTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('tierlists'); // 'tierlists', 'templates', 'visual', 'account'
  const [tierlists, setTierlists] = useState([]);
  const [userTemplates, setUserTemplates] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de troca de senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoadingData(true);
      const [tierlistsRes, templatesRes] = await Promise.all([
        supabase.from('tierlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('templates').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (tierlistsRes.error) throw tierlistsRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setTierlists(tierlistsRes.data || []);
      setUserTemplates(templatesRes.data || []);
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    const isConfirmed = await confirmAction('Sair da Conta', 'Deseja realmente desconectar do Ametist?', 'Sim, sair');
    if (isConfirmed) {
      await supabase.auth.signOut();
      toast.success('Desconectado com sucesso!');
      navigate('/');
    }
  };

  const handleRenameTierlist = async (id, currentName) => {
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
      const { error } = await supabase.from('tierlists').update({ name: newName }).eq('id', id);
      if (error) {
        toast.error('Erro ao renomear: ' + error.message);
      } else {
        toast.success('Tier List renomeada com sucesso!');
        fetchUserData();
      }
    }
  };

  const handleDeleteTierlist = async (id) => {
    const isConfirmed = await confirmAction('Excluir Tier List', 'Tem certeza que deseja apagar esta lista? Esta ação não pode ser desfeita.', 'Sim, excluir');
    if (isConfirmed) {
      const { error } = await supabase.from('tierlists').delete().eq('id', id);
      if (error) {
        toast.error('Erro ao excluir: ' + error.message);
      } else {
        toast.success('Tier List excluída!');
        setTierlists(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  const handleDeleteTemplate = async (id) => {
    const isConfirmed = await confirmAction('Excluir Modelo', 'Tem certeza que deseja excluir seu template? Ele será removido da galeria.', 'Sim, excluir');
    if (isConfirmed) {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) {
        toast.error('Erro ao excluir modelo: ' + error.message);
      } else {
        toast.success('Modelo excluído!');
        setUserTemplates(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('A senha deve ter pelo menos 6 caracteres.');
    if (newPassword !== confirmPassword) return toast.error('As senhas não coincidem.');

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        let msg = error.message;
        if (msg.includes('New password should be different')) {
          msg = 'A nova senha deve ser diferente da sua senha atual.';
        } else if (msg.includes('Password should be at least')) {
          msg = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (msg.includes('Auth session missing')) {
          msg = 'Sua sessão expirou. Por favor, saia e entre novamente.';
        }
        throw new Error(msg);
      }
      toast.success('Senha atualizada com sucesso no banco de dados!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Erro ao atualizar senha.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#b062eb', fontWeight: 'bold' }}>Carregando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: '20px', maxWidth: '480px', margin: '70px auto 30px', textAlign: 'center', color: '#fff' }}>
        <div style={{ background: '#16161a', padding: '30px 20px', borderRadius: '14px', border: '1px solid #282834' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(176,98,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#b062eb' }}>
            <User size={30} />
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Perfil do Usuário</h2>
          <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: '22px', lineHeight: '1.5' }}>
            Você precisa estar conectado para acessar suas configurações de visual, gerenciar suas Tier Lists e editar seus templates.
          </p>
          <button 
            onClick={() => navigate('/login')} 
            className="btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            Fazer Login / Cadastre-se
          </button>
        </div>
      </div>
    );
  }

  const filteredTierlists = tierlists.filter(t => (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTemplates = userTemplates.filter(t => (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="tierlist-container" style={{ maxWidth: '1080px', margin: '55px auto 30px', padding: '10px 16px' }}>
      
      {/* HEADER DO PERFIL */}
      <div style={{
        backgroundColor: '#141418',
        border: '1px solid #282832',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: activeTheme?.gradient || 'linear-gradient(135deg, #b062eb 0%, #7928ca 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            fontWeight: '800',
            color: '#fff',
            boxShadow: `0 0 20px ${activeTheme?.accentColor || '#b062eb'}55`
          }}>
            {((user?.email || user?.user_metadata?.display_name || 'U')[0]).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: '700' }}>
                {user?.user_metadata?.display_name || (user?.email ? user.email.split('@')[0] : 'Usuário')}
              </h2>
              {isAdmin(user) ? (
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#f87171', borderRadius: '4px', fontWeight: 'bold' }}>
                  ADMIN
                </span>
              ) : (
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: `${activeTheme?.accentColor || '#b062eb'}22`, border: `1px solid ${activeTheme?.accentColor || '#b062eb'}66`, color: activeTheme?.accentColor || '#d8b4fe', borderRadius: '4px', fontWeight: '600' }}>
                  MEMBRO VIP
                </span>
              )}
            </div>
            <p style={{ margin: 0, color: '#8e8e99', fontSize: '0.85rem' }}>{user?.email || 'Conta Ametist'}</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
        >
          <LogOut size={15} /> Sair da Conta
        </button>
      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #282834', paddingBottom: '10px', marginBottom: '22px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('tierlists')}
          style={{
            padding: '9px 18px',
            borderRadius: '10px',
            border: activeTab === 'tierlists' ? `1.5px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid transparent',
            backgroundColor: activeTab === 'tierlists' ? `${activeTheme?.accentColor || '#b062eb'}25` : '#17171c',
            color: activeTab === 'tierlists' ? '#ffffff' : '#9999a5',
            fontWeight: activeTab === 'tierlists' ? '700' : '500',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'tierlists' ? `0 0 14px ${activeTheme?.accentColor || '#b062eb'}30` : 'none'
          }}
        >
          <Layers size={16} color={activeTab === 'tierlists' ? (activeTheme?.accentColor || '#b062eb') : '#888'} />
          Minhas Tier Lists ({tierlists.length})
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '9px 18px',
            borderRadius: '10px',
            border: activeTab === 'templates' ? `1.5px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid transparent',
            backgroundColor: activeTab === 'templates' ? `${activeTheme?.accentColor || '#b062eb'}25` : '#17171c',
            color: activeTab === 'templates' ? '#ffffff' : '#9999a5',
            fontWeight: activeTab === 'templates' ? '700' : '500',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'templates' ? `0 0 14px ${activeTheme?.accentColor || '#b062eb'}30` : 'none'
          }}
        >
          <Sparkles size={16} color={activeTab === 'templates' ? (activeTheme?.accentColor || '#b062eb') : '#888'} />
          Meus Modelos ({userTemplates.length})
        </button>

        <button
          onClick={() => setActiveTab('visual')}
          style={{
            padding: '9px 18px',
            borderRadius: '10px',
            border: activeTab === 'visual' ? `1.5px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid transparent',
            backgroundColor: activeTab === 'visual' ? `${activeTheme?.accentColor || '#b062eb'}25` : '#17171c',
            color: activeTab === 'visual' ? '#ffffff' : '#9999a5',
            fontWeight: activeTab === 'visual' ? '700' : '500',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'visual' ? `0 0 14px ${activeTheme?.accentColor || '#b062eb'}30` : 'none'
          }}
        >
          <Palette size={16} color={activeTab === 'visual' ? (activeTheme?.accentColor || '#b062eb') : '#888'} />
          Personalização & Visuais
        </button>

        <button
          onClick={() => setActiveTab('account')}
          style={{
            padding: '9px 18px',
            borderRadius: '10px',
            border: activeTab === 'account' ? `1.5px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid transparent',
            backgroundColor: activeTab === 'account' ? `${activeTheme?.accentColor || '#b062eb'}25` : '#17171c',
            color: activeTab === 'account' ? '#ffffff' : '#9999a5',
            fontWeight: activeTab === 'account' ? '700' : '500',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'account' ? `0 0 14px ${activeTheme?.accentColor || '#b062eb'}30` : 'none'
          }}
        >
          <KeyRound size={16} color={activeTab === 'account' ? (activeTheme?.accentColor || '#b062eb') : '#888'} />
          Segurança da Conta
        </button>
      </div>

      {/* CONTEÚDO DA ABA: MINHAS TIER LISTS */}
      {activeTab === 'tierlists' && (
        <div className="control-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Minhas Listas Salvas na Nuvem</h3>
            <input 
              type="search"
              placeholder="Buscar nas minhas listas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #333', background: '#16161a', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          {loadingData ? (
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Carregando suas listas...</p>
          ) : filteredTierlists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 15px', color: '#888' }}>
              <p style={{ marginBottom: '15px' }}>Você ainda não tem nenhuma Tier List salva na nuvem.</p>
              <Link to="/tierlist" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Montar Minha Primeira Tier List
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {filteredTierlists.map(item => (
                <div 
                  key={item.id}
                  style={{
                    backgroundColor: '#17171c',
                    border: '1px solid #282832',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#fff' }}>{item.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#777' }}>
                      Atualizado em: {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => {
                        localStorage.setItem('tierlist-current-id', item.id);
                        localStorage.setItem('tierlist-force-cloud-load', 'true');
                        navigate('/tierlist');
                      }}
                      className="btn-primary"
                      style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      Abrir / Editar
                    </button>
                    <button 
                      onClick={() => handleRenameTierlist(item.id, item.name)}
                      className="btn-secondary"
                      style={{ padding: '6px 10px' }}
                      title="Renomear"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTierlist(item.id)}
                      className="btn-danger outline"
                      style={{ padding: '6px 10px' }}
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA: MEUS MODELOS */}
      {activeTab === 'templates' && (
        <div className="control-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Modelos Publicados por Você</h3>
            <Link to="/template-maker" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              + Criar Novo Modelo
            </Link>
          </div>

          {loadingData ? (
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Carregando seus modelos...</p>
          ) : filteredTemplates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 15px', color: '#888' }}>
              <p style={{ marginBottom: '15px' }}>Você ainda não publicou nenhum modelo.</p>
              <Link to="/template-maker" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Criar Meu Primeiro Modelo
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
              {filteredTemplates.map(template => (
                <div 
                  key={template.id}
                  style={{
                    backgroundColor: '#17171c',
                    border: '1px solid #282832',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <img 
                    src={template.cover_image} 
                    alt={template.name} 
                    style={{ width: '100%', height: '110px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x150?text=Sem+Capa'; }}
                  />
                  <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {template.name}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: template.is_public ? '#4ade80' : '#facc15' }}>
                        {template.is_public ? '● Público na Galeria' : '● Privado'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                      <Link 
                        to={`/tierlist?templateId=${template.id}`} 
                        className="btn-primary"
                        style={{ flex: 1, textDecoration: 'none', textAlign: 'center', padding: '5px 8px', fontSize: '0.78rem' }}
                      >
                        Usar
                      </Link>
                      <Link 
                        to={`/template-maker?editTemplateId=${template.id}`} 
                        className="btn-secondary"
                        style={{ padding: '5px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                        title="Editar Modelo"
                      >
                        <Pencil size={13} />
                      </Link>
                      <button 
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="btn-danger outline"
                        style={{ padding: '5px 10px' }}
                        title="Excluir Modelo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA: VISUAL & CORES */}
      {activeTab === 'visual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="control-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Palette size={22} color="#b062eb" />
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Tema de Cores do Ametist</h3>
            </div>
            <p style={{ color: '#aaa', fontSize: '0.88rem', margin: '0 0 20px 0', lineHeight: '1.4' }}>
              Escolha a skin visual que define a estética do site e dos seus tabuleiros. Essa configuração fica gravada no seu perfil.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {availableThemes.map((themeItem) => {
                const isSelected = siteTheme === themeItem.id;
                return (
                  <div
                    key={themeItem.id}
                    onClick={() => setSiteTheme(themeItem.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? `${themeItem.accentColor}15` : '#17171c',
                      border: isSelected ? `2px solid ${themeItem.accentColor}` : '1px solid #282832',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 20px ${themeItem.accentColor}25` : 'none',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: themeItem.accentColor,
                          boxShadow: `0 0 8px ${themeItem.accentColor}`
                        }} />
                        <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{themeItem.name}</strong>
                      </div>
                      {isSelected && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: themeItem.accentColor, fontSize: '0.75rem', fontWeight: 'bold' }}>
                          <Check size={14} /> Ativo
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '0 0 12px 0', color: '#8e8e99', fontSize: '0.8rem', lineHeight: '1.3' }}>
                      {themeItem.description}
                    </p>

                    {/* Mini Preview Bar */}
                    <div style={{ height: '6px', borderRadius: '4px', background: themeItem.gradient, width: '100%' }} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="control-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Sliders size={20} color={activeTheme?.accentColor || "#b062eb"} />
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Densidade e Escala Visual</h3>
            </div>
            <p style={{ color: '#aaa', fontSize: '0.88rem', margin: '0 0 16px 0' }}>
              Ajuste o tamanho base dos elementos para a sua tela.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setUiDensity('compact')}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: uiDensity === 'compact' ? `1.5px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #2e2e38',
                  backgroundColor: uiDensity === 'compact' ? `${activeTheme?.accentColor || '#b062eb'}25` : '#17171c',
                  color: uiDensity === 'compact' ? '#fff' : '#aaa',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: uiDensity === 'compact' ? `0 0 14px ${activeTheme?.accentColor || '#b062eb'}30` : 'none'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2px' }}>Compacto (Recomendado)</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>Proporção ideal para ver todo o tabuleiro sem precisar de zoom</div>
              </button>

              <button
                type="button"
                onClick={() => setUiDensity('spacious')}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: uiDensity === 'spacious' ? `1.5px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #2e2e38',
                  backgroundColor: uiDensity === 'spacious' ? `${activeTheme?.accentColor || '#b062eb'}25` : '#17171c',
                  color: uiDensity === 'spacious' ? '#fff' : '#aaa',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: uiDensity === 'spacious' ? `0 0 14px ${activeTheme?.accentColor || '#b062eb'}30` : 'none'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2px' }}>Confortável</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>Botões e textos maiores para monitores de alta resolução</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: SEGURANÇA DA CONTA */}
      {activeTab === 'account' && (
        <div className="control-card" style={{ padding: '22px', maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <KeyRound size={20} color="#b062eb" />
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Alterar Senha de Acesso</h3>
          </div>

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '6px' }}>Nova Senha</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Mínimo de 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: '1px solid #333', background: '#16161a', color: '#fff', fontSize: '0.9rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#777', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  tabIndex="-1"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '6px' }}>Confirmar Nova Senha</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: '1px solid #333', background: '#16161a', color: '#fff', fontSize: '0.9rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#777', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#777', lineHeight: '1.4' }}>
              A nova senha é criptografada e salva instantaneamente no banco de autenticação do Supabase. Nos próximos acessos, utilize esta nova senha.
            </p>

            <button 
              type="submit" 
              disabled={isUpdatingPassword}
              className="btn-primary" 
              style={{ marginTop: '8px', padding: '11px' }}
            >
              {isUpdatingPassword ? 'Atualizando...' : 'Salvar Nova Senha'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

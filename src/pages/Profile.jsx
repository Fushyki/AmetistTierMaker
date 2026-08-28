import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabaseClient';
import { isAdmin } from '../utils/admin';
import { confirmAction } from '../utils/alerts';
import { processImage } from '../utils/imageProcessor';
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
  Shield,
  Sliders,
  FolderHeart,
  Eye,
  EyeOff,
  Lock,
  Star,
  Megaphone,
  BarChart3,
  Trophy,
  Search,
  RefreshCw,
  Bell,
  Globe,
  Camera,
  UploadCloud,
  Link2,
  Image as ImageIcon,
  X,
  Heart,
  Crown,
  Swords
} from 'lucide-react';
import Swal from 'sweetalert2';
import { toast, notify } from '../utils/notifications';
import { TEMPLATE_CATEGORIES } from '../data/categories';
import CategoryBadge, { CategoryIcon } from '../components/CategoryBadge';
import { getUserLikedTemplateIds, toggleTemplateLike, getUserChampions } from '../utils/likesManager';
import '../styles/index.css';

const AVATAR_PRESETS = [
  { id: 'ametist', name: 'Cristal Ametista', url: '/ametist-logo.png' },
  { id: 'gem', name: 'Gema Estelar', url: '/cristal.png' },
  { id: 'cyber', name: 'Cyberbot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ametist' },
  { id: 'felix', name: 'Aventureiro', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
  { id: 'aria', name: 'Feiticeira', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria' },
  { id: 'nova', name: 'Neon Gamer', url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Nova' },
  { id: 'shadow', name: 'Sombra', url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Shadow' },
  { id: 'luna', name: 'Estilo Pop', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Luna' },
  { id: 'crystal', name: 'Forma Geométrica', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Crystal' }
];

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { siteTheme, setSiteTheme, uiDensity, setUiDensity, availableThemes, activeTheme, showCustomToast } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('tierlists'); // 'tierlists', 'templates', 'favoritos', 'campeoes', 'visual', 'account', 'admin'
  const [tierlists, setTierlists] = useState([]);
  const [userTemplates, setUserTemplates] = useState([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState([]);
  const [duelChampions, setDuelChampions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de troca de foto de perfil
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarTab, setAvatarTab] = useState('upload'); // 'upload', 'presets', 'url'
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState(() => {
    return user?.user_metadata?.avatar_url || (user?.id ? localStorage.getItem('ametist_user_avatar_' + user.id) : null);
  });
  const avatarFileInputRef = useRef(null);

  useEffect(() => {
    const current = user?.user_metadata?.avatar_url || (user?.id ? localStorage.getItem('ametist_user_avatar_' + user.id) : null);
    setProfileAvatar(current);
  }, [user]);

  // Estados de troca de senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Estados do Painel de Admin
  const [adminMetrics, setAdminMetrics] = useState({
    totalTemplates: 0,
    publicTemplates: 0,
    privateTemplates: 0,
    featuredTemplates: 0,
    totalTierlists: 0,
    totalCopas: 0,
    catCounts: { games: 0, animes: 0, musica: 0, filmes: 0, geral: 0 },
    allTemplates: []
  });
  const [adminAnnouncement, setAdminAnnouncement] = useState({
    active: false,
    message: '',
    type: 'purple',
    link: '',
    linkText: ''
  });
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCatFilter, setAdminCatFilter] = useState('todos');
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
      if (isAdmin(user)) {
        fetchAdminData();
      }
    }
  }, [user]);

  // Listener para sincronizar curtidas e campeões
  useEffect(() => {
    const handleSync = () => {
      if (user) {
        fetchUserData();
      }
    };
    window.addEventListener('ametist-likes-updated', handleSync);
    window.addEventListener('ametist-champions-updated', handleSync);
    return () => {
      window.removeEventListener('ametist-likes-updated', handleSync);
      window.removeEventListener('ametist-champions-updated', handleSync);
    };
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
      setUserTemplates((templatesRes.data || []).filter(t => t.name && !t.name.startsWith('__')));

      // Busca templates favoritados
      const likedIds = getUserLikedTemplateIds(user.id);
      let favs = [];
      if (likedIds && likedIds.length > 0) {
        const favsRes = await supabase
          .from('templates')
          .select('*')
          .in('id', likedIds);
        if (!favsRes.error && favsRes.data) {
          favs = favsRes.data;
        }
      }
      setFavoriteTemplates(favs);
      setDuelChampions(getUserChampions(user.id));
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRemoveFavorite = async (template) => {
    const res = await toggleTemplateLike(template, user);
    if (res.success) {
      setFavoriteTemplates(prev => prev.filter(t => t.id !== template.id));
      toast.info(`"${template.name}" removido dos favoritos.`);
    }
  };

  const handleClearChampions = async () => {
    const isConfirmed = await confirmAction('Limpar Campeões', 'Deseja apagar o histórico de campeões salvos do seu perfil?', 'Sim, limpar');
    if (isConfirmed && user?.id) {
      localStorage.removeItem(`ametist_user_champions_${user.id}`);
      setDuelChampions([]);
      toast.success('Histórico de campeões limpo!');
    }
  };

  const fetchAdminData = async () => {
    if (!isAdmin(user)) return;
    setIsAdminLoading(true);
    try {
      const [allTemplatesRes, allTierlistsRes, announcementRes] = await Promise.all([
        supabase.from('templates').select('*').order('created_at', { ascending: false }),
        supabase.from('tierlists').select('id, data, created_at'),
        supabase.from('templates').select('data').eq('name', '__SYSTEM_ANNOUNCEMENT__').maybeSingle()
      ]);

      const templatesList = (allTemplatesRes.data || []).filter(t => t.name && !t.name.startsWith('__'));
      const tierlistsList = allTierlistsRes.data || [];

      // Métricas
      const totalTemplates = templatesList.length;
      const publicTemplates = templatesList.filter(t => t.is_public).length;
      const privateTemplates = templatesList.filter(t => !t.is_public).length;
      const featuredTemplates = templatesList.filter(t => t.data?.is_featured).length;

      const totalTierlists = tierlistsList.length;
      const totalCopas = tierlistsList.filter(t => t.data?.type === 'copa').length;

      const catCounts = { games: 0, animes: 0, musica: 0, filmes: 0, geral: 0 };
      templatesList.forEach(t => {
        const cat = t.data?.category || 'games';
        if (catCounts[cat] !== undefined) catCounts[cat]++;
        else catCounts.geral++;
      });

      setAdminMetrics({
        totalTemplates,
        publicTemplates,
        privateTemplates,
        featuredTemplates,
        totalTierlists,
        totalCopas,
        catCounts,
        allTemplates: templatesList
      });

      if (announcementRes.data?.data) {
        setAdminAnnouncement(announcementRes.data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar dados de admin:', err);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleSaveAnnouncement = async (e) => {
    if (e) e.preventDefault();
    if (!adminAnnouncement.message.trim() && adminAnnouncement.active) {
      return toast.error('Digite a mensagem do aviso antes de ativar.');
    }

    setIsSavingAnnouncement(true);
    try {
      const payload = {
        active: adminAnnouncement.active,
        message: adminAnnouncement.message.trim(),
        type: adminAnnouncement.type || 'purple',
        link: adminAnnouncement.link?.trim() || '',
        linkText: adminAnnouncement.linkText?.trim() || '',
        updatedAt: new Date().toISOString()
      };

      const { data: existing } = await supabase
        .from('templates')
        .select('id')
        .eq('name', '__SYSTEM_ANNOUNCEMENT__')
        .maybeSingle();

      if (existing) {
        await supabase.from('templates').update({ data: payload, is_public: true }).eq('id', existing.id);
      } else {
        await supabase.from('templates').insert([{
          user_id: user.id,
          name: '__SYSTEM_ANNOUNCEMENT__',
          is_public: true,
          cover_image: '',
          data: payload
        }]);
      }

      localStorage.setItem('ametist_global_announcement', JSON.stringify(payload));
      localStorage.removeItem('ametist_announcement_dismissed_id');
      
      if (showCustomToast) {
        showCustomToast(
          'Aviso Global Atualizado',
          payload.active ? 'Aviso transmitido para todos os visitantes do site.' : 'Aviso desativado com sucesso.',
          'palette'
        );
      } else {
        toast.success('Aviso global atualizado com sucesso!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar aviso global: ' + err.message);
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleAdminToggleFeature = async (templateId, currentFeatured) => {
    try {
      const template = adminMetrics.allTemplates.find(t => t.id === templateId);
      if (!template) return;
      const updatedData = { ...(template.data || {}), is_featured: !currentFeatured };
      
      const { error } = await supabase.from('templates').update({ data: updatedData }).eq('id', templateId);
      if (error) throw error;

      setAdminMetrics(prev => ({
        ...prev,
        featuredTemplates: prev.featuredTemplates + (currentFeatured ? -1 : 1),
        allTemplates: prev.allTemplates.map(t => t.id === templateId ? { ...t, data: updatedData } : t)
      }));

      if (showCustomToast) {
        showCustomToast('Destaque Atualizado', !currentFeatured ? 'Template fixado nos destaques da Home!' : 'Destaque removido.', 'palette');
      }
    } catch (err) {
      toast.error('Erro ao alternar destaque: ' + err.message);
    }
  };

  const handleAdminTogglePublic = async (templateId, currentPublic) => {
    try {
      const newPublic = !currentPublic;
      const { error } = await supabase.from('templates').update({ is_public: newPublic }).eq('id', templateId);
      if (error) throw error;

      setAdminMetrics(prev => ({
        ...prev,
        publicTemplates: prev.publicTemplates + (newPublic ? 1 : -1),
        privateTemplates: prev.privateTemplates + (newPublic ? -1 : 1),
        allTemplates: prev.allTemplates.map(t => t.id === templateId ? { ...t, is_public: newPublic } : t)
      }));

      if (showCustomToast) {
        showCustomToast('Visibilidade Alterada', newPublic ? 'Template publicado na Galeria.' : 'Template tornado privado.', 'palette');
      }
    } catch (err) {
      toast.error('Erro ao alternar visibilidade: ' + err.message);
    }
  };

  const handleAdminDeleteTemplate = async (templateId, templateName) => {
    const isConfirmed = await confirmAction(
      'Excluir Template (Admin)',
      'Tem certeza que deseja apagar permanentemente o template "' + templateName + '"?',
      'Sim, excluir'
    );
    if (isConfirmed) {
      try {
        const { error } = await supabase.from('templates').delete().eq('id', templateId);
        if (error) throw error;

        setAdminMetrics(prev => ({
          ...prev,
          totalTemplates: prev.totalTemplates - 1,
          allTemplates: prev.allTemplates.filter(t => t.id !== templateId)
        }));
        setUserTemplates(prev => prev.filter(t => t.id !== templateId));

        if (showCustomToast) {
          showCustomToast('Template Excluído', 'O modelo foi removido do banco de dados.', 'palette');
        }
      } catch (err) {
        toast.error('Erro ao excluir: ' + err.message);
      }
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

  const handleSaveAvatar = async (newUrl) => {
    try {
      setIsSavingAvatar(true);
      if (user?.id) {
        if (newUrl) {
          localStorage.setItem('ametist_user_avatar_' + user.id, newUrl);
        } else {
          localStorage.removeItem('ametist_user_avatar_' + user.id);
        }
        setProfileAvatar(newUrl || null);
        window.dispatchEvent(new CustomEvent('ametist-avatar-updated', { detail: { avatarUrl: newUrl, userId: user.id } }));
      }

      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: newUrl }
      });
      if (error) {
        console.warn('Erro ao sincronizar avatar com Supabase user_metadata:', error);
      }
      if (showCustomToast) {
        showCustomToast('Foto Atualizada', newUrl ? 'Sua foto de perfil foi alterada com sucesso!' : 'Foto de perfil removida.', 'palette');
      } else {
        toast.success(newUrl ? 'Foto de perfil alterada com sucesso!' : 'Foto de perfil removida.');
      }
      setIsAvatarModalOpen(false);
      setCustomAvatarUrl('');
    } catch (err) {
      toast.error('Erro ao atualizar foto: ' + err.message);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return toast.error('Por favor, selecione um arquivo de imagem.');
    }
    try {
      setIsSavingAvatar(true);
      const processed = await processImage(file, 256, 256, 0.88);
      await handleSaveAvatar(processed.dataUrl);
    } catch (err) {
      toast.error('Erro ao processar imagem: ' + err.message);
      setIsSavingAvatar(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('A senha deve ter pelo menos 6 caracteres.');
    if (newPassword !== confirmPassword) return toast.error('As senhas não coincidem.');

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setNewPassword('');
      setConfirmPassword('');
      if (showCustomToast) {
        showCustomToast('Senha Atualizada', 'Sua senha foi alterada com sucesso no Supabase.', 'palette');
      } else {
        toast.success('Senha atualizada com sucesso!');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#b062eb', fontSize: '1rem', fontWeight: '600' }}>
        Carregando dados do perfil...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: '20px 15px', maxWidth: '520px', margin: '20px auto 20px', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ color: '#b062eb', marginBottom: '14px', fontSize: '1.4rem' }}>Acesso ao Perfil</h1>
        <div className="control-card" style={{ padding: '24px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(176,98,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b062eb' }}>
              <Lock size={28} />
            </div>
          </div>
          <h2 style={{ marginBottom: '10px', fontSize: '1.15rem' }}>Você precisa estar conectado</h2>
          <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '20px' }}>
            Faça login para gerenciar suas Tier Lists salvas na nuvem, editar seus modelos e personalizar o visual do Ametist.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.95rem' }}
          >
            Fazer Login / Criar Conta
          </button>
        </div>
      </div>
    );
  }

  const filteredTierlists = tierlists.filter(t => (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTemplates = userTemplates.filter(t => (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredAdminTemplates = adminMetrics.allTemplates.filter(t => {
    const matchesSearch = (t.name || '').toLowerCase().includes(adminSearch.toLowerCase());
    const matchesCat = adminCatFilter === 'todos' || (t.data?.category || 'games') === adminCatFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="container" style={{ padding: '10px 15px', maxWidth: '1000px', margin: '15px auto 30px', color: '#fff' }}>
      
      {/* CABEÇALHO DO PERFIL COM LINHA DE GRADIENTE DINÂMICA */}
      <div 
        className="control-card" 
        style={{ 
          padding: 0, 
          marginBottom: '20px', 
          background: 'linear-gradient(135deg, rgba(26,26,30,0.95) 0%, rgba(20,20,24,0.98) 100%)',
          border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.35)'}`,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: `0 8px 32px ${activeTheme?.accentGlow || 'rgba(176,98,235,0.12)'}`,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        {/* Linha Decorativa Superior Reativa ao Tema */}
        <div style={{ height: '3px', width: '100%', background: activeTheme?.gradient || 'var(--accent-gradient)', boxShadow: `0 0 12px ${activeTheme?.accentGlow || 'var(--accent-glow)'}` }} />

        <div style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            
            {/* Foto de Perfil Interativa com Troca em 1 Clique */}
            <div 
              onClick={() => setIsAvatarModalOpen(true)}
              title="Clique para mudar sua foto de perfil"
              style={{
                position: 'relative',
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                cursor: 'pointer',
                border: `2.5px solid ${activeTheme?.accentColor || '#b062eb'}`,
                boxShadow: `0 0 20px ${activeTheme?.accentGlow || 'rgba(176,98,235,0.45)'}`,
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'transform 0.18s ease, box-shadow 0.18s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {profileAvatar ? (
                <img 
                  src={profileAvatar} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: activeTheme?.gradient || 'linear-gradient(135deg, #b062eb 0%, #7928ca 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.7rem',
                  fontWeight: '800',
                  color: '#fff'
                }}>
                  {((user?.email || user?.user_metadata?.display_name || 'U')[0]).toUpperCase()}
                </div>
              )}
              
              {/* Badge da Câmera */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0, 0, 0, 0.72)',
                padding: '3px 0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#fff'
              }}>
                <Camera size={12} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: '700' }}>
                  {user?.user_metadata?.display_name || (user?.email ? user.email.split('@')[0] : 'Usuário')}
                </h2>
                {isAdmin(user) ? (
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#f87171', borderRadius: '4px', fontWeight: 'bold' }}>
                    ADMIN
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: (activeTheme?.accentColor || '#b062eb') + '22', border: '1px solid ' + (activeTheme?.accentColor || '#b062eb') + '66', color: activeTheme?.accentColor || '#d8b4fe', borderRadius: '4px', fontWeight: '600' }}>
                    MEMBRO VIP
                  </span>
                )}
              </div>
              <p style={{ margin: '0 0 6px 0', color: '#8e8e99', fontSize: '0.85rem' }}>{user?.email || 'Conta Ametist'}</p>
              
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: activeTheme?.accentColor || '#b062eb',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Camera size={12} /> Alterar foto de perfil
              </button>
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
      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="profile-tabs-bar">
        <button
          type="button"
          onClick={() => setActiveTab('tierlists')}
          className={`profile-tab-btn ${activeTab === 'tierlists' ? 'active' : ''}`}
        >
          <Layers size={16} />
          <span>Minhas Tier Lists ({tierlists.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`profile-tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
        >
          <Sparkles size={16} />
          <span>Meus Modelos ({userTemplates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('favoritos')}
          className={`profile-tab-btn ${activeTab === 'favoritos' ? 'active' : ''}`}
        >
          <Heart size={16} />
          <span>Favoritos ({favoriteTemplates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('campeoes')}
          className={`profile-tab-btn ${activeTab === 'campeoes' ? 'active' : ''}`}
        >
          <Trophy size={16} />
          <span>Campeões ({duelChampions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visual')}
          className={`profile-tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
        >
          <Palette size={16} />
          <span>Personalização & Visuais</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`profile-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
        >
          <KeyRound size={16} />
          <span>Segurança da Conta</span>
        </button>

        {isAdmin(user) && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              fetchAdminData();
            }}
            className={`profile-tab-btn admin-tab ${activeTab === 'admin' ? 'active' : ''}`}
          >
            <ShieldAlert size={16} />
            <span>Painel Admin</span>
          </button>
        )}
      </div>

      {/* CONTEÚDO DA ABA: MINHAS TIER LISTS */}
      {activeTab === 'tierlists' && (
        <div className="profile-tab-content">
          <div className="control-card" style={{ padding: 0, borderRadius: '12px', border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.3)'}`, background: '#121216', boxShadow: `0 4px 20px ${activeTheme?.accentGlow || 'rgba(176,98,235,0.08)'}` }}>
            <div style={{ height: '3px', width: '100%', background: activeTheme?.gradient || 'var(--accent-gradient)', borderRadius: '12px 12px 0 0' }} />
            <div style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: '700', borderBottom: 'none', paddingBottom: 0, textAlign: 'left', textTransform: 'none' }}>
                    Minhas Listas Salvas na Nuvem
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#8e8e99' }}>
                    Acesse, renomeie ou continue editando suas tier lists salvas na nuvem.
                  </p>
                </div>
                <input 
                  type="search"
                  placeholder="Buscar nas minhas listas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '7px 14px', borderRadius: '20px', border: '1px solid #333', background: '#16161a', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              {loadingData ? (
                <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Carregando suas tier lists...</p>
              ) : filteredTierlists.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 15px', color: '#888' }}>
                  <p style={{ marginBottom: '15px' }}>Você ainda não salvou nenhuma tier list na nuvem.</p>
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
                          Abrir Tier List
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
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: MEUS MODELOS */}
      {activeTab === 'templates' && (
        <div className="profile-tab-content">
          <div className="control-card" style={{ padding: 0, borderRadius: '12px', border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.3)'}`, background: '#121216', boxShadow: `0 4px 20px ${activeTheme?.accentGlow || 'rgba(176,98,235,0.08)'}` }}>
            <div style={{ height: '3px', width: '100%', background: activeTheme?.gradient || 'var(--accent-gradient)', borderRadius: '12px 12px 0 0' }} />
            <div style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: '700', borderBottom: 'none', paddingBottom: 0, textAlign: 'left', textTransform: 'none' }}>
                    Modelos Publicados por Você
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#8e8e99' }}>
                    Gerencie as configurações internas, capas, bancos de imagens e regras dos seus templates.
                  </p>
                </div>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
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
                        style={{ width: '100%', height: '115px', objectFit: 'cover' }}
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                          <Link 
                            to={'/tierlist?templateId=' + template.id} 
                            className="btn-primary"
                            style={{ textDecoration: 'none', textAlign: 'center', padding: '7px 10px', fontSize: '0.8rem', fontWeight: '600' }}
                          >
                            Montar Tier List
                          </Link>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Link 
                              to={'/template-maker?editTemplateId=' + template.id} 
                              className="btn-secondary"
                              style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 8px', fontSize: '0.75rem', fontWeight: '600' }}
                              title="Editar título, capa, banco de imagens e regras deste modelo"
                            >
                              <Pencil size={12} /> Editar Modelo
                            </Link>
                            <button 
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="btn-danger outline"
                              style={{ padding: '6px 10px' }}
                              title="Excluir Modelo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: FAVORITOS */}
      {activeTab === 'favoritos' && (
        <div className="profile-tab-content">
          <div className="control-card" style={{ padding: '22px', background: '#121216', borderRadius: '14px', border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.25)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Heart size={20} color="#ef4444" fill="#ef4444" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: '700' }}>Modelos Favoritados</h3>
                </div>
                <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Modelos da comunidade que você curtiu e favoritou para jogar a qualquer momento.
                </p>
              </div>
            </div>

            {loadingData ? (
              <p style={{ color: '#888', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>Carregando favoritos...</p>
            ) : favoriteTemplates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#888' }}>
                <Heart size={36} color="#444" style={{ margin: '0 auto 10px auto' }} />
                <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>Você ainda não favoritou nenhum modelo.</p>
                <Link to="/" className="btn-primary" style={{ padding: '8px 16px', textDecoration: 'none', fontSize: '0.85rem' }}>
                  Explorar Modelos na Home
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {favoriteTemplates.map(template => (
                  <div 
                    key={`fav-${template.id}`}
                    style={{
                      background: '#16161a',
                      border: '1px solid #282832',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ width: '100%', height: '115px', overflow: 'hidden', position: 'relative' }}>
                      <img 
                        src={template.cover_image} 
                        alt={template.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300x150?text=Sem+Capa'; }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(template)}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          background: 'rgba(0,0,0,0.7)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#ef4444'
                        }}
                        title="Remover dos favoritos"
                      >
                        <Heart size={14} fill="#ef4444" />
                      </button>
                    </div>
                    <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {template.name}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <Link 
                          to={'/tierlist?templateId=' + template.id} 
                          className="btn-primary"
                          style={{ textDecoration: 'none', textAlign: 'center', padding: '7px 10px', fontSize: '0.8rem', fontWeight: '600' }}
                        >
                          Montar Tier List
                        </Link>
                        <Link 
                          to={'/duelo?templateId=' + template.id} 
                          className="btn-secondary"
                          style={{ textDecoration: 'none', textAlign: 'center', padding: '6px 10px', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                        >
                          <Swords size={13} color={activeTheme?.accentColor || '#b062eb'} /> Jogar Duelo
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: CAMPEÕES DE DUELO */}
      {activeTab === 'campeoes' && (
        <div className="profile-tab-content">
          <div className="control-card" style={{ padding: '22px', background: '#121216', borderRadius: '14px', border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.25)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={20} color="#ffd700" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: '700' }}>Galeria de Campeões de Duelo</h3>
                </div>
                <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Todos os personagens e cartas que conquistaram o 1º lugar nos seus Torneios Mata-Mata.
                </p>
              </div>

              {duelChampions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChampions}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                >
                  <Trash2 size={13} /> Limpar Histórico
                </button>
              )}
            </div>

            {duelChampions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#888' }}>
                <Crown size={38} color="#555" style={{ margin: '0 auto 10px auto' }} />
                <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>Você ainda não coroou nenhum campeão em torneios.</p>
                <Link to="/duelo" className="btn-primary" style={{ padding: '8px 16px', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Swords size={14} /> Iniciar um Torneio de Duelo
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                {duelChampions.map((champ, idx) => (
                  <div 
                    key={champ.id || idx}
                    style={{
                      background: '#16161c',
                      border: '1.5px solid #ffd700',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 18px rgba(255, 215, 0, 0.15)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ width: '100%', height: '140px', backgroundColor: '#09090d', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img 
                        src={champ.championImage} 
                        alt="" 
                        aria-hidden="true"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(15px)', opacity: 0.3 }}
                      />
                      <img 
                        src={champ.championImage} 
                        alt={champ.championName} 
                        style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                      />
                      <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#ffd700', color: '#000', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontWeight: '900', fontSize: '0.75rem' }}>
                        1º
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {champ.championName}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#ffd700', fontWeight: '700', marginTop: '2px' }}>
                        Campeão do Torneio
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#777', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {champ.templateName}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: '#555', marginTop: '2px' }}>
                        {new Date(champ.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: VISUAL & CORES */}
      {activeTab === 'visual' && (
        <div className="profile-tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card: Tema Global de Cores */}
          <div className="control-card" style={{ padding: 0, borderRadius: '12px', border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.3)'}`, background: '#121216', boxShadow: `0 4px 20px ${activeTheme?.accentGlow || 'rgba(176,98,235,0.08)'}` }}>
            <div style={{ height: '3px', width: '100%', background: activeTheme?.gradient || 'var(--accent-gradient)', borderRadius: '12px 12px 0 0' }} />
            <div style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Palette size={20} color={activeTheme?.accentColor || '#b062eb'} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: '700' }}>Tema Global de Cores</h3>
              </div>
              <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 18px 0', lineHeight: '1.4' }}>
                Escolha o esquema de cores que reflete sua personalidade. Todo o site, botões e linhas decorativas mudarão instantaneamente.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {availableThemes.map(t => {
                  const isSelected = siteTheme === t.id;
                  return (
                    <div 
                      key={t.id}
                      onClick={() => setSiteTheme(t.id)}
                      style={{
                        backgroundColor: '#16161a',
                        border: isSelected ? '2px solid ' + t.accentColor : '2px solid #282830',
                        borderRadius: '12px',
                        padding: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
                        boxShadow: isSelected ? '0 0 16px ' + t.accentColor + '55' : 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: t.gradient,
                        boxShadow: '0 2px 8px ' + t.accentColor + '55',
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: isSelected ? 'bold' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.name}
                        </div>
                        <div style={{ color: isSelected ? t.accentColor : '#666', fontSize: '0.75rem', fontWeight: '500' }}>
                          {isSelected ? '● Ativo' : 'Clique para usar'}
                        </div>
                      </div>
                      {isSelected && <Check size={16} color={t.accentColor} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card: Densidade e Escala Visual */}
          <div className="control-card" style={{ padding: 0, borderRadius: '12px', border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.3)'}`, background: '#121216', boxShadow: `0 4px 20px ${activeTheme?.accentGlow || 'rgba(176,98,235,0.08)'}` }}>
            <div style={{ height: '3px', width: '100%', background: activeTheme?.gradient || 'var(--accent-gradient)', borderRadius: '12px 12px 0 0' }} />
            <div style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Sliders size={20} color={activeTheme?.accentColor || '#b062eb'} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: '700' }}>Densidade e Escala Visual</h3>
              </div>
              <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 18px 0', lineHeight: '1.4' }}>
                Ajuste o tamanho dos elementos e espaçamento dos tabuleiros para melhor visualização na sua tela.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setUiDensity('compact')}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    border: uiDensity === 'compact' ? '2px solid ' + (activeTheme?.accentColor || '#b062eb') : '2px solid #2e2e38',
                    backgroundColor: uiDensity === 'compact' ? (activeTheme?.accentColor || '#b062eb') + '25' : '#17171c',
                    color: uiDensity === 'compact' ? '#fff' : '#aaa',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: uiDensity === 'compact' ? '0 0 14px ' + (activeTheme?.accentColor || '#b062eb') + '30' : 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2px' }}>Compacto (Recomendado)</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>Proporção ideal para ver todo o tabuleiro sem precisar de zoom</div>
                </button>

                <button
                  type="button"
                  onClick={() => setUiDensity('spacious')}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    border: uiDensity === 'spacious' ? '2px solid ' + (activeTheme?.accentColor || '#b062eb') : '2px solid #2e2e38',
                    backgroundColor: uiDensity === 'spacious' ? (activeTheme?.accentColor || '#b062eb') + '25' : '#17171c',
                    color: uiDensity === 'spacious' ? '#fff' : '#aaa',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: uiDensity === 'spacious' ? '0 0 14px ' + (activeTheme?.accentColor || '#b062eb') + '30' : 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2px' }}>Confortável</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>Botões e textos maiores para monitores de alta resolução</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: SEGURANÇA DA CONTA */}
      {activeTab === 'account' && (
        <div className="profile-tab-content">
          <div className="control-card" style={{ padding: '22px' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <KeyRound size={20} color={activeTheme?.accentColor || '#b062eb'} />
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
                      style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: '1px solid #333', background: '#16161a', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }}
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
                      style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: '1px solid #333', background: '#16161a', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }}
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
                  style={{ marginTop: '8px', padding: '11px', width: '100%' }}
                >
                  {isUpdatingPassword ? 'Atualizando...' : 'Salvar Nova Senha'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: PAINEL ADMIN (EXCLUSIVO) */}
      {activeTab === 'admin' && isAdmin(user) && (
        <div className="profile-tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* TOPO DO PAINEL ADMIN */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={24} color="#ef4444" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Central de Controle de Administrador</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#888' }}>
                  Acesso total de moderação, métricas globais e transmissão de avisos para todo o site.
                </p>
              </div>
            </div>

            <button
              onClick={fetchAdminData}
              disabled={isAdminLoading}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
            >
              <RefreshCw size={14} className={isAdminLoading ? 'animate-spin' : ''} />
              Atualizar Dados
            </button>
          </div>

          {/* 1. CARDS DE MÉTRICAS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
            <div className="control-card" style={{ padding: '18px', borderLeft: '4px solid #b062eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: '600', textTransform: 'uppercase' }}>Modelos Publicados</span>
                <Sparkles size={18} color="#b062eb" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff' }}>{adminMetrics.totalTemplates}</div>
              <div style={{ fontSize: '0.75rem', color: '#777', marginTop: '4px' }}>
                {adminMetrics.publicTemplates} públicos · {adminMetrics.privateTemplates} privados
              </div>
            </div>

            <div className="control-card" style={{ padding: '18px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: '600', textTransform: 'uppercase' }}>Tier Lists Salvas</span>
                <Layers size={18} color="#3b82f6" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff' }}>{adminMetrics.totalTierlists}</div>
              <div style={{ fontSize: '0.75rem', color: '#777', marginTop: '4px' }}>
                Total de montagens na nuvem
              </div>
            </div>

            <div className="control-card" style={{ padding: '18px', borderLeft: '4px solid #facc15' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: '600', textTransform: 'uppercase' }}>Em Destaque (Home)</span>
                <Star size={18} color="#facc15" fill="#facc15" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#facc15' }}>{adminMetrics.featuredTemplates}</div>
              <div style={{ fontSize: '0.75rem', color: '#777', marginTop: '4px' }}>
                Pinados no topo da galeria
              </div>
            </div>

            <div className="control-card" style={{ padding: '18px', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: '600', textTransform: 'uppercase' }}>Torneios / Copas</span>
                <Trophy size={18} color="#10b981" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff' }}>{adminMetrics.totalCopas}</div>
              <div style={{ fontSize: '0.75rem', color: '#777', marginTop: '4px' }}>
                Modo chaveamento competitivo
              </div>
            </div>
          </div>

          {/* 2. DISTRIBUIÇÃO POR CATEGORIA */}
          <div className="control-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <BarChart3 size={18} color="#b062eb" />
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Distribuição de Conteúdo por Categoria</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {[
                { id: 'games', label: 'Jogos', count: adminMetrics.catCounts.games, color: '#ef4444' },
                { id: 'animes', label: 'Animes', count: adminMetrics.catCounts.animes, color: '#ec4899' },
                { id: 'musica', label: 'Música', count: adminMetrics.catCounts.musica, color: '#a855f7' },
                { id: 'filmes', label: 'Filmes', count: adminMetrics.catCounts.filmes, color: '#3b82f6' },
                { id: 'geral', label: 'Geral', count: adminMetrics.catCounts.geral, color: '#10b981' }
              ].map(cat => {
                const percent = adminMetrics.totalTemplates > 0 
                  ? Math.round((cat.count / adminMetrics.totalTemplates) * 100) 
                  : 0;
                return (
                  <div key={cat.id} style={{ backgroundColor: '#17171c', padding: '12px', borderRadius: '8px', border: '1px solid #282830' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ccc', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600' }}>{cat.label}</span>
                      <span style={{ color: cat.color, fontWeight: '700' }}>{cat.count} ({percent}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#25252b', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: percent + '%', height: '100%', backgroundColor: cat.color, borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. GERENCIADOR DE AVISOS GLOBAIS (SITE ANNOUNCEMENT) */}
          <div className="control-card" style={{ padding: '22px', border: '1px solid rgba(176,98,235,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={20} color="#facc15" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>Banner de Avisos Globais</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#aaa' }}>
                    Exiba uma mensagem no topo de todas as páginas para todos os visitantes do site.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: adminAnnouncement.active ? '#4ade80' : '#888', fontWeight: 'bold' }}>
                  {adminAnnouncement.active ? '● AVISO ATIVADO' : '○ DESATIVADO'}
                </span>
                <button
                  type="button"
                  onClick={() => setAdminAnnouncement(prev => ({ ...prev, active: !prev.active }))}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: 'none',
                    backgroundColor: adminAnnouncement.active ? '#22c55e' : '#3f3f46',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {adminAnnouncement.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>

            {/* PREVIEW DO AVISO */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '0.78rem', color: '#888', marginBottom: '6px', fontWeight: '600' }}>PRÉ-VISUALIZAÇÃO AO VIVO:</span>
              <div style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 
                  adminAnnouncement.type === 'gold' ? 'linear-gradient(90deg, #b45309, #f59e0b)' :
                  adminAnnouncement.type === 'info' ? 'linear-gradient(90deg, #1e40af, #3b82f6)' :
                  adminAnnouncement.type === 'warning' ? 'linear-gradient(90deg, #991b1b, #ef4444)' :
                  'linear-gradient(90deg, #7928ca, #b062eb)',
                color: '#fff',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}>
                <Bell size={15} />
                <span>{adminAnnouncement.message || 'Digite sua mensagem de aviso abaixo...'}</span>
                {adminAnnouncement.link && (
                  <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {adminAnnouncement.linkText || 'Ver mais'} →
                  </span>
                )}
              </div>
            </div>

            {/* FORMULÁRIO DO AVISO */}
            <form onSubmit={handleSaveAnnouncement} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '6px', fontWeight: '600' }}>
                  Estilo Visual do Banner:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'purple', label: 'Novidade (Roxo Ametista)', color: '#b062eb' },
                    { id: 'gold', label: 'Destaque (Dourado)', color: '#facc15' },
                    { id: 'info', label: 'Informativo (Azul)', color: '#3b82f6' },
                    { id: 'warning', label: 'Alerta / Manutenção (Vermelho)', color: '#ef4444' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setAdminAnnouncement(prev => ({ ...prev, type: st.id }))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: adminAnnouncement.type === st.id ? '1.5px solid ' + st.color : '1px solid #333',
                        backgroundColor: adminAnnouncement.type === st.id ? st.color + '25' : '#17171c',
                        color: adminAnnouncement.type === st.id ? '#fff' : '#aaa',
                        fontSize: '0.8rem',
                        fontWeight: adminAnnouncement.type === st.id ? '700' : '400',
                        cursor: 'pointer'
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '6px', fontWeight: '600' }}>
                  Mensagem do Banner:
                </label>
                <input 
                  type="text"
                  placeholder="Ex: Novo modo Torneio Copa adicionado! Monte sua chave de 16 itens agora."
                  value={adminAnnouncement.message}
                  onChange={(e) => setAdminAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #383842', backgroundColor: '#18181c', color: '#fff', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '6px', fontWeight: '600' }}>
                    Link de Destino (Opcional):
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: /copa ou https://..."
                    value={adminAnnouncement.link}
                    onChange={(e) => setAdminAnnouncement(prev => ({ ...prev, link: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #383842', backgroundColor: '#18181c', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '6px', fontWeight: '600' }}>
                    Texto do Botão (Opcional):
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: Experimentar Agora"
                    value={adminAnnouncement.linkText}
                    onChange={(e) => setAdminAnnouncement(prev => ({ ...prev, linkText: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #383842', backgroundColor: '#18181c', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingAnnouncement}
                className="btn-primary"
                style={{ padding: '11px', fontWeight: '700', fontSize: '0.92rem', marginTop: '6px' }}
              >
                {isSavingAnnouncement ? 'Transmitindo...' : 'Salvar e Publicar Aviso Global'}
              </button>
            </form>
          </div>

          {/* 4. TABELA DE MODERAÇÃO DE TODOS OS TEMPLATES */}
          <div className="control-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Moderação Global de Modelos ({adminMetrics.totalTemplates})</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#aaa' }}>
                  Fixe destaques na Home, altere visibilidade ou edite/exclua qualquer modelo da plataforma.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input 
                  type="search"
                  placeholder="Buscar modelo..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  style={{ padding: '7px 14px', borderRadius: '20px', border: '1px solid #333', background: '#16161a', color: '#fff', fontSize: '0.85rem' }}
                />
                <select
                  value={adminCatFilter}
                  onChange={(e) => setAdminCatFilter(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #333', background: '#16161a', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="todos">Todas Categorias</option>
                  <option value="games">Jogos</option>
                  <option value="animes">Animes</option>
                  <option value="musica">Música</option>
                  <option value="filmes">Filmes</option>
                  <option value="geral">Geral</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #282834', color: '#888' }}>
                    <th style={{ padding: '10px 8px' }}>Capa</th>
                    <th style={{ padding: '10px 8px' }}>Nome do Modelo</th>
                    <th style={{ padding: '10px 8px' }}>Categoria</th>
                    <th style={{ padding: '10px 8px' }}>Status</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Ações de Moderação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminTemplates.map(t => {
                    const isFeat = Boolean(t.data?.is_featured);
                    const isPub = Boolean(t.is_public);
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #22222a' }}>
                        <td style={{ padding: '8px' }}>
                          <img 
                            src={t.cover_image} 
                            alt={t.name} 
                            style={{ width: '50px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #333' }}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/60x40?text=Sem+Capa'; }}
                          />
                        </td>
                        <td style={{ padding: '8px', color: '#fff', fontWeight: '600' }}>
                          <div>{t.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#666', fontWeight: 'normal' }}>ID: {t.id}</div>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <CategoryBadge categoryId={t.data?.category || 'games'} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: isPub ? 'rgba(74,222,128,0.15)' : 'rgba(250,204,21,0.15)', color: isPub ? '#4ade80' : '#facc15', fontWeight: 'bold' }}>
                              {isPub ? 'Público' : 'Privado'}
                            </span>
                            {isFeat && (
                              <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(250,204,21,0.25)', color: '#facc15', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Star size={10} fill="#facc15" /> Destaque
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleAdminToggleFeature(t.id, isFeat)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                border: '1px solid #facc15',
                                backgroundColor: isFeat ? '#facc15' : 'transparent',
                                color: isFeat ? '#000' : '#facc15',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}
                              title={isFeat ? "Remover Destaque da Home" : "Fixar como Destaque na Home"}
                            >
                              <Star size={12} fill={isFeat ? "#000" : "none"} />
                              {isFeat ? 'Destaque' : 'Fixar'}
                            </button>

                            <button
                              onClick={() => handleAdminTogglePublic(t.id, isPub)}
                              className="btn-secondary"
                              style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                              title={isPub ? "Tornar Privado" : "Tornar Público"}
                            >
                              {isPub ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>

                            <Link
                              to={'/template-maker?editTemplateId=' + t.id}
                              className="btn-secondary"
                              style={{ padding: '5px 8px', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                              title="Editar Template"
                            >
                              <Pencil size={13} />
                            </Link>

                            <button
                              onClick={() => handleAdminDeleteTemplate(t.id, t.name)}
                              className="btn-danger outline"
                              style={{ padding: '5px 8px' }}
                              title="Excluir Template Permanentemente"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL DE ALTERAR FOTO DE PERFIL */}
      {isAvatarModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#141418',
            border: `1px solid ${activeTheme?.accentBorder || 'rgba(176,98,235,0.4)'}`,
            borderRadius: '14px',
            width: '100%',
            maxWidth: '520px',
            overflow: 'hidden',
            boxShadow: `0 12px 40px ${activeTheme?.accentGlow || 'rgba(0,0,0,0.6)'}`,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Linha Decorativa Superior do Modal */}
            <div style={{ height: '3px', width: '100%', background: activeTheme?.gradient || 'var(--accent-gradient)', boxShadow: `0 0 10px ${activeTheme?.accentGlow || 'var(--accent-glow)'}` }} />

            {/* Cabeçalho do Modal */}
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #22222a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color={activeTheme?.accentColor || '#b062eb'} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '700' }}>Alterar Foto de Perfil</h3>
              </div>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div style={{ padding: '20px' }}>
              {/* Preview Atual */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '12px 16px', background: '#1a1a22', borderRadius: '10px', border: '1px solid #282834' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `2px solid ${activeTheme?.accentColor || '#b062eb'}`,
                  boxShadow: `0 0 12px ${activeTheme?.accentGlow || 'rgba(176,98,235,0.3)'}`,
                  flexShrink: 0
                }}>
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Avatar Atual" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: activeTheme?.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>
                      {((user?.email || 'U')[0]).toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#fff' }}>Foto Atual</div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>
                    {user?.user_metadata?.avatar_url ? 'Foto personalizada ativa' : 'Usando inicial estilizada padrão'}
                  </div>
                </div>
                {user?.user_metadata?.avatar_url && (
                  <button
                    onClick={() => handleSaveAvatar(null)}
                    disabled={isSavingAvatar}
                    className="btn-danger outline"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={12} /> Remover
                  </button>
                )}
              </div>

              {/* Modo de Escolha: Abas */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', borderBottom: '1px solid #252530', paddingBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setAvatarTab('upload')}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: avatarTab === 'upload' ? (activeTheme?.accentColor || '#b062eb') : 'transparent',
                    color: avatarTab === 'upload' ? '#000' : '#aaa',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <UploadCloud size={14} /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('presets')}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: avatarTab === 'presets' ? (activeTheme?.accentColor || '#b062eb') : 'transparent',
                    color: avatarTab === 'presets' ? '#000' : '#aaa',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} /> Galeria
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('url')}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: avatarTab === 'url' ? (activeTheme?.accentColor || '#b062eb') : 'transparent',
                    color: avatarTab === 'url' ? '#000' : '#aaa',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Link2 size={14} /> Link URL
                </button>
              </div>

              {/* Conteúdo Aba Upload */}
              {avatarTab === 'upload' && (
                <div style={{ textAlign: 'center', padding: '12px 10px' }}>
                  <input
                    type="file"
                    ref={avatarFileInputRef}
                    onChange={handleAvatarFileSelect}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <div
                    onClick={() => avatarFileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${activeTheme?.accentBorder || '#444'}`,
                      borderRadius: '10px',
                      padding: '24px 15px',
                      cursor: 'pointer',
                      background: '#16161d',
                      transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = activeTheme?.accentColor || '#b062eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = activeTheme?.accentBorder || '#444'; }}
                  >
                    <UploadCloud size={34} color={activeTheme?.accentColor || '#b062eb'} style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>
                      Clique para escolher uma imagem
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                      PNG, JPG, WebP ou GIF (otimização e corte automático)
                    </div>
                  </div>
                  {isSavingAvatar && (
                    <div style={{ marginTop: '12px', color: activeTheme?.accentColor || '#b062eb', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      Processando e atualizando foto...
                    </div>
                  )}
                </div>
              )}

              {/* Conteúdo Aba Presets */}
              {avatarTab === 'presets' && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>
                    Escolha um avatar estilizado da nossa galeria:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {AVATAR_PRESETS.map(preset => (
                      <div
                        key={preset.id}
                        onClick={() => handleSaveAvatar(preset.url)}
                        style={{
                          backgroundColor: '#171720',
                          border: user?.user_metadata?.avatar_url === preset.url ? `2px solid ${activeTheme?.accentColor || '#b062eb'}` : '1px solid #282834',
                          borderRadius: '10px',
                          padding: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'transform 0.15s, border-color 0.15s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <img src={preset.url} alt={preset.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontSize: '0.72rem', color: '#ccc', textAlign: 'center', fontWeight: '500' }}>{preset.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conteúdo Aba Link URL */}
              {avatarTab === 'url' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '6px', fontWeight: '600' }}>
                      URL da Imagem Direta:
                    </label>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/minha-foto.jpg"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #333', background: '#16161a', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>
                  {customAvatarUrl && (
                    <div style={{ textAlign: 'center', padding: '10px', background: '#16161d', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '6px' }}>Pré-visualização:</div>
                      <img
                        src={customAvatarUrl}
                        alt="Preview"
                        style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${activeTheme?.accentColor || '#b062eb'}`, margin: '0 auto' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!customAvatarUrl.trim() || isSavingAvatar}
                    onClick={() => handleSaveAvatar(customAvatarUrl.trim())}
                    className="btn-primary"
                    style={{ padding: '10px', fontSize: '0.85rem', fontWeight: '700' }}
                  >
                    {isSavingAvatar ? 'Salvando...' : 'Aplicar Foto de Perfil'}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', background: '#101014', borderTop: '1px solid #202028', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

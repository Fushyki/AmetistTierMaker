import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import '../styles/index.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      toast.error('Preencha o e-mail e a senha.');
      return;
    }

    if (cleanPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: cleanEmail, 
          password: cleanPassword 
        });
        
        if (error) {
          toast.error('E-mail ou senha incorretos.');
          return;
        }
        
        toast.success('Bem-vindo de volta!');
        navigate('/admin');
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email: cleanEmail, 
          password: cleanPassword 
        });
        
        if (error) {
          toast.error(error.message || 'Erro ao criar conta.');
          return;
        }
        
        // Fazer login automático logo após o cadastro
        if (data?.user) {
          toast.success('Conta criada com sucesso! Bem-vindo!');
          navigate('/admin');
        }
      }
    } catch (err) {
      toast.error('Erro na autenticação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/admin'
        }
      });
      if (error) throw error;
    } catch (err) {
      toast.error('Erro no login do Google: ' + err.message);
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  const themeColor = isLogin ? '#b062eb' : '#ffd700';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 110px)', padding: '20px' }}>
      <div 
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(22, 22, 24, 0.7)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px 30px',
          border: `1px solid ${themeColor}33`, // 33 é opacidade em hex
          boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.3), 0 0 20px ${themeColor}15`,
          transition: 'all 0.4s ease'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img src="/ametist-logo.png" alt="Ametist Logo" style={{ width: '60px', marginBottom: '15px', filter: isLogin ? 'none' : 'hue-rotate(280deg) brightness(1.5)' }} />
          <h1 style={{ color: '#fff', fontSize: '1.8rem', margin: 0, transition: 'color 0.3s' }}>
            {isLogin ? 'Acessar Conta' : 'Criar Nova Conta'}
          </h1>
          <p style={{ color: '#888', marginTop: '10px', fontSize: '0.9rem' }}>
            {isLogin ? 'Bem-vindo de volta ao Ametist Tier Maker' : 'Junte-se a nós e salve suas criações na nuvem'}
          </p>
        </div>
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left' }}>
            <label style={{ color: '#aaa', fontSize: '0.85rem', paddingLeft: '5px' }}>E-mail</label>
            <input 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ padding: '15px', borderRadius: '10px', border: '1px solid #333', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none', transition: 'border-color 0.3s', fontSize: '1rem' }}
              onFocus={(e) => e.target.style.borderColor = themeColor}
              onBlur={(e) => e.target.style.borderColor = '#333'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left' }}>
            <label style={{ color: '#aaa', fontSize: '0.85rem', paddingLeft: '5px' }}>Senha</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ padding: '15px', borderRadius: '10px', border: '1px solid #333', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none', transition: 'border-color 0.3s', fontSize: '1rem' }}
              onFocus={(e) => e.target.style.borderColor = themeColor}
              onBlur={(e) => e.target.style.borderColor = '#333'}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              padding: '16px', 
              backgroundColor: themeColor, 
              color: isLogin ? '#fff' : '#000', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: 'bold', 
              fontSize: '1.1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              transition: 'all 0.3s ease',
              boxShadow: `0 4px 15px ${themeColor}40`
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar no Sistema' : 'Cadastrar e Entrar')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '25px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }}></div>
          <span style={{ padding: '0 15px', color: '#888', fontSize: '0.85rem' }}>OU</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }}></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{ 
            width: '100%',
            padding: '16px', 
            backgroundColor: '#fff', 
            color: '#333', 
            border: 'none', 
            borderRadius: '10px', 
            fontWeight: 'bold', 
            fontSize: '1.1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#f1f1f1'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#fff'}
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{ width: '22px', height: '22px' }} />
          Continuar com Google
        </button>
        
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={toggleMode} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#888', 
              cursor: 'pointer', 
              fontSize: '0.95rem',
              transition: 'color 0.2s' 
            }}
            onMouseOver={(e) => e.target.style.color = '#fff'}
            onMouseOut={(e) => e.target.style.color = '#888'}
          >
            {isLogin ? (
              <>Não tem conta? <span style={{ color: '#ffd700', fontWeight: 'bold' }}>Cadastre-se grátis</span></>
            ) : (
              <>Já tem conta? <span style={{ color: '#b062eb', fontWeight: 'bold' }}>Faça login</span></>
            )}
          </button>
          
          <Link to="/" style={{ color: '#555', textDecoration: 'none', fontSize: '0.85rem' }}>
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}

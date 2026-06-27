import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../index.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/admin');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Cadastro realizado! Confirme no seu e-mail se necessário.');
        setIsLogin(true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tierlist-container" style={{ textAlign: 'center', marginTop: '100px', maxWidth: '400px', margin: '100px auto' }}>
      <h1>{isLogin ? 'Acessar Conta' : 'Criar Conta'}</h1>
      
      {errorMsg && <p style={{ color: '#ff4444', marginBottom: '15px' }}>{errorMsg}</p>}
      
      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="Seu E-mail Válido" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: '12px', borderRadius: '6px', border: '1px solid #333', background: '#161618', color: 'white' }}
        />
        <input 
          type="password" 
          placeholder="Sua Senha" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: '12px', borderRadius: '6px', border: '1px solid #333', background: '#161618', color: 'white' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#ffd700', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
        </button>
      </form>
      
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          style={{ background: 'none', border: 'none', color: '#ffd700', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
        </button>
        <Link to="/" style={{ color: '#888', textDecoration: 'none' }}>Voltar para a Home</Link>
      </div>
    </div>
  );
}

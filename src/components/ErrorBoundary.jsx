import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '50px', color: '#fff', marginTop: '100px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={36} color="#f59e0b" />
            </div>
          </div>
          <h2 style={{ color: '#ff5555', fontSize: '1.4rem', marginBottom: '8px' }}>Ops! Algo deu errado.</h2>
          <p style={{ color: '#aaa', marginBottom: '24px', fontSize: '0.9rem' }}>Nós encontramos um erro inesperado nesta página.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary"
              style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Tentar Novamente
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="btn-secondary"
              style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Voltar para o Início
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

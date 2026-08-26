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
          <h2 style={{ color: '#ff4444' }}>Ops! Algo deu errado.</h2>
          <p style={{ color: '#aaa', marginBottom: '30px' }}>Nós encontramos um erro inesperado nesta página.</p>
          <button 
            onClick={() => window.location.href = '/'}
            style={{ padding: '12px 24px', backgroundColor: '#b062eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Voltar para o Início
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

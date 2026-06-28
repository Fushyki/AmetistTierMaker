import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy loading das rotas (Code Splitting)
const Home = lazy(() => import('./pages/Home'));
const Tierlist = lazy(() => import('./pages/Tierlist'));
const Login = lazy(() => import('./pages/Login'));
const Admin = lazy(() => import('./pages/Admin'));
const TemplateMaker = lazy(() => import('./pages/TemplateMaker'));

// Componente de fallback (carregamento)
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <div style={{ color: '#b062eb', fontSize: '1.2rem', fontWeight: 'bold' }}>Carregando...</div>
  </div>
);

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#4CAF50',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Navbar />
        
        <main style={{ flex: 1, paddingTop: '70px', paddingBottom: '40px' }}>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tierlist" element={<Tierlist />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/template-maker" element={<TemplateMaker />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import GlobalAnnouncement from './components/GlobalAnnouncement';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

import { ThemeProvider } from './contexts/ThemeContext';
import Home from './pages/Home';

// Lazy loading das rotas secundárias (Code Splitting sob demanda)
const Tierlist = lazy(() => import('./pages/Tierlist'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const TemplateMaker = lazy(() => import('./pages/TemplateMaker'));
const Copa = lazy(() => import('./pages/Copa'));

// Componente de fallback (carregamento)
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <div style={{ color: '#b062eb', fontSize: '1rem', fontWeight: '600' }}>Carregando...</div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <header className="ametist-header-sticky">
            <Navbar />
            <GlobalAnnouncement />
          </header>
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
          
          <main style={{ flex: 1, paddingBottom: '30px' }}>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/tierlist" element={<Tierlist />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Profile />} />
                  <Route path="/template-maker" element={<TemplateMaker />} />
                  <Route path="/copa" element={<Copa />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
        
        <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;

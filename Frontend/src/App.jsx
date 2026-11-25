import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import {
  ScrollProgress,
  CookieBanner,
  BackToTop,
  FloatingContact,
  useUtmTracking,
} from './components/StandardWidgets';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import SongDetail from './pages/SongDetail';
import Playlists from './pages/Playlists';
import Analytics from './pages/Analytics';
import FAQPage from './pages/FAQPage';
import Profile from './pages/Profile';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {

  useUtmTracking();

  return (
    <div className="app-layout">
      { }
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      { }
      <ScrollProgress />

      { }
      <Header />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth initialMode="login" />} />
          <Route path="/register" element={<Auth initialMode="register" />} />

          { }
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path="/songs/:id"
            element={
              <ProtectedRoute>
                <SongDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/playlists"
            element={
              <ProtectedRoute>
                <Playlists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route path="/faq" element={<FAQPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          { }
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      { }
      <Footer />

      { }
      <CookieBanner />

      { }
      <BackToTop />

      { }
      <FloatingContact />
    </div>
  );
}

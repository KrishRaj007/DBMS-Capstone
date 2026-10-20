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

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  // 14. Initialize UTM tracking across application
  useUtmTracking();

  return (
    <div className="app-layout">
      {/* 12. Skip to Content Accessibility Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* 8. Scroll Progress Bar */}
      <ScrollProgress />

      {/* 11. Sticky Header with Site Search, Dark Mode & Mobile Menu */}
      <Header />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth initialMode="login" />} />
          <Route path="/register" element={<Auth initialMode="register" />} />

          {/* Authenticated routes */}
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* 18. Footer with Last Updated Date */}
      <Footer />

      {/* 2. Simple Cookie Consent Banner */}
      <CookieBanner />

      {/* 4. Back to Top Button */}
      <BackToTop />

      {/* 20. Floating Contact Button */}
      <FloatingContact />
    </div>
  );
}

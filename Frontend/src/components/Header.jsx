import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './StandardWidgets';

export default function Header() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/library?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="header" id="main-header">
      <div className="header-left">
        <Link to={user ? "/dashboard" : "/"} className="header-logo" onClick={closeMenu}>
          <svg viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <span>BeatPulse</span>
        </Link>

        {user && (
          <nav className="header-nav" aria-label="Main Navigation">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/library">Library</NavLink>
            <NavLink to="/playlists">Playlists</NavLink>
            <NavLink to="/analytics">Analytics</NavLink>
            <NavLink to="/faq">FAQ</NavLink>
          </nav>
        )}
      </div>

      <div className="header-right">
        {user && (
          <form onSubmit={handleSearchSubmit} className="site-search" role="search">
            <span className="site-search-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search songs, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search music catalog"
              id="site-search-input"
            />
          </form>
        )}

        <ThemeToggle />

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/profile" className="btn btn-secondary btn-sm" title="View Profile">
              {user.username}
            </Link>
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
              id="logout-btn"
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/login" className="btn btn-secondary btn-sm" id="nav-login-btn">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm" id="nav-register-btn">
              Register
            </Link>
          </div>
        )}

        {user && (
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            id="mobile-menu-toggle-btn"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        )}
      </div>

      {user && (
        <div className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
          <NavLink to="/dashboard" onClick={closeMenu}>Dashboard</NavLink>
          <NavLink to="/library" onClick={closeMenu}>Library</NavLink>
          <NavLink to="/playlists" onClick={closeMenu}>Playlists</NavLink>
          <NavLink to="/analytics" onClick={closeMenu}>Analytics</NavLink>
          <NavLink to="/faq" onClick={closeMenu}>FAQ</NavLink>
          <NavLink to="/profile" onClick={closeMenu}>Profile & Settings</NavLink>
          <button
            onClick={() => { logout(); closeMenu(); }}
            className="btn btn-danger btn-sm"
            style={{ width: '100%', marginTop: '8px' }}
          >
            Logout ({user.username})
          </button>
        </div>
      )}
    </header>
  );
}

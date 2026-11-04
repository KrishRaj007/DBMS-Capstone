import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/StandardWidgets';

export default function Auth({ initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
        setSuccessMsg('Login successful! Redirecting to dashboard...');
      } else {
        await register(username, email, password);
        setSuccessMsg('Account created successfully! Redirecting...');
      }
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLogin(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="auth-page" id="main-content">
      <div className="auth-card">
        {/* Brand & Provenance Badge */}
        <div className="auth-brand-badge">
          <div className="auth-brand-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className="auth-system-tag">DBMS Telemetry Portal</span>
        </div>

        <h1 className="auth-title">
          {isLogin ? 'Sign In to BeatPulse' : 'Create an Account'}
        </h1>
        <p className="auth-subtitle">
          {isLogin
            ? 'Enter your credentials to access personalized recommendations and listening telemetry.'
            : 'Join the music recommendation DBMS platform with 18,000+ tracks.'}
        </p>

        {/* Form Error Banner (Feature 16) */}
        {errorMsg && (
          <div className="form-error-banner" role="alert" id="auth-error-banner">
            <span>✕</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Success Banner (Feature 15) */}
        {successMsg && (
          <div className="form-success-banner" role="status" id="auth-success-banner">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-username">
                Username
              </label>
              <input
                id="auth-username"
                type="text"
                className="form-input"
                placeholder="e.g. soundtracker"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              Password {isLogin ? '' : '(min. 6 characters)'}
            </label>
            {/* Password Visibility Toggle (Feature 13) */}
            <PasswordInput
              id="auth-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={submitting}
            id="auth-submit-btn"
          >
            {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="auth-toggle-link"
                onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
              >
                Register
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                className="auth-toggle-link"
                onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
              >
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* Evaluator Demo Credentials Quick Autofill Deck */}
        <div className="auth-demo-deck">
          <div className="auth-demo-header">
            <span className="auth-demo-label">Evaluator One-Click Autofill</span>
            <span className="auth-demo-badge">Pre-Seeded Accounts</span>
          </div>
          <div className="auth-demo-grid">
            <button
              type="button"
              className={`auth-demo-chip ${email === 'john@example.com' ? 'active' : ''}`}
              onClick={() => fillDemo('john@example.com', 'password123')}
            >
              <span className="demo-chip-avatar">JD</span>
              <div className="demo-chip-info">
                <div className="demo-chip-name">john_doe</div>
                <div className="demo-chip-taste">john@example.com • Pop &amp; Rock</div>
              </div>
              <span className="demo-chip-action">Autofill →</span>
            </button>

            <button
              type="button"
              className={`auth-demo-chip ${email === 'jane@example.com' ? 'active' : ''}`}
              onClick={() => fillDemo('jane@example.com', 'password123')}
            >
              <span className="demo-chip-avatar">JS</span>
              <div className="demo-chip-info">
                <div className="demo-chip-name">jane_smith</div>
                <div className="demo-chip-taste">jane@example.com • Jazz &amp; Classical</div>
              </div>
              <span className="demo-chip-action">Autofill →</span>
            </button>

            <button
              type="button"
              className={`auth-demo-chip ${email === 'music@example.com' ? 'active' : ''}`}
              onClick={() => fillDemo('music@example.com', 'password123')}
            >
              <span className="demo-chip-avatar">ML</span>
              <div className="demo-chip-info">
                <div className="demo-chip-name">music_lover</div>
                <div className="demo-chip-taste">music@example.com • Electronic &amp; Hip-Hop</div>
              </div>
              <span className="demo-chip-action">Autofill →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

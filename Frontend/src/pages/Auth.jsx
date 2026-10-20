import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  const location = useLocation();

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
      }, 800);
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
  };

  return (
    <div className="auth-page" id="main-content">
      <div className="auth-card">
        <h1 className="auth-title">
          {isLogin ? 'Sign In to BeatPulse' : 'Create an Account'}
        </h1>
        <p className="auth-subtitle">
          {isLogin
            ? 'Access your listening analytics and personalized recommendations'
            : 'Join the music recommendation DBMS platform'}
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
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={submitting}
            id="auth-submit-btn"
          >
            {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}
              >
                Register
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}
              >
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* Demo Credentials Quick Click */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
            Quick Demo Autofill:
          </p>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('john@example.com', 'password123')}
            >
              john_doe
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('jane@example.com', 'password123')}
            >
              jane_smith
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('music@example.com', 'password123')}
            >
              music_lover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

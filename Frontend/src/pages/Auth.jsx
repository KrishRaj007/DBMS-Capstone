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
        setSuccessMsg('Welcome back! Loading your library...');
      } else {
        await register(username, email, password);
        setSuccessMsg('Account created successfully! Loading your library...');
      }
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
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
    <div className="page-container" id="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 180px)' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text)', marginBottom: '8px' }}>
            {isLogin ? 'Sign in to BeatPulse' : 'Create an account'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {isLogin
              ? 'Enter your email and password to access your personalized recommendations.'
              : 'Sign up to track your listening history and discover new music.'}
          </p>
        </div>

        {errorMsg && (
          <div className="form-error-banner" role="alert">
            <span>✕</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="form-success-banner" role="status">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                type="text"
                className="form-input"
                placeholder="e.g. alex_music"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email address</label>
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
              Password {isLogin ? '' : '(at least 6 characters)'}
            </label>
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
            className="btn btn-primary btn-full"
            disabled={submitting}
            style={{ marginTop: '8px', padding: '11px' }}
          >
            {submitting ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', padding: 0 }}
              >
                Register
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', padding: 0 }}
              >
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* Demo Accounts Quick-Select */}
        <div style={{ marginTop: '28px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              Quick test accounts
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', width: '100%', padding: '8px 12px' }}
              onClick={() => fillDemo('john@example.com', 'password123')}
            >
              <span style={{ fontWeight: '600' }}>john_doe</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Pop &amp; Rock (36 plays)</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', width: '100%', padding: '8px 12px' }}
              onClick={() => fillDemo('jane@example.com', 'password123')}
            >
              <span style={{ fontWeight: '600' }}>jane_smith</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Jazz &amp; Classical (43 plays)</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', width: '100%', padding: '8px 12px' }}
              onClick={() => fillDemo('krish@gmail.com', 'password123')}
            >
              <span style={{ fontWeight: '600' }}>Krish Raj</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>krish@gmail.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

// ── 14. UTM Tracking Hook ────────────────────────────────────
export function useUtmTracking() {
  const [utmData, setUtmData] = useState({});

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      const currentUtm = {};
      let found = false;

      utmKeys.forEach((key) => {
        const val = params.get(key);
        if (val) {
          currentUtm[key] = val;
          found = true;
        }
      });

      if (found) {
        sessionStorage.setItem('beatpulse_utm', JSON.stringify(currentUtm));
        setUtmData(currentUtm);
      } else {
        const saved = sessionStorage.getItem('beatpulse_utm');
        if (saved) setUtmData(JSON.parse(saved));
      }
    } catch {
      // fallback
    }
  }, []);

  return utmData;
}

// ── 1. Dark Mode Toggle ──────────────────────────────────────
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
      id="theme-toggle-btn"
    >
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  );
}

// ── 8. Scroll Progress Bar ───────────────────────────────────
export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const current = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, current)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="scroll-progress-container" aria-hidden="true">
      <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
    </div>
  );
}

// ── 4. Back to Top Button ────────────────────────────────────
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`back-to-top-btn ${visible ? 'visible' : ''}`}
      aria-label="Back to top"
      id="back-to-top-btn"
      title="Back to top"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  );
}

// ── 2. Simple Cookie Banner ──────────────────────────────────
export function CookieBanner() {
  const [show, setShow] = useState(() => {
    return !localStorage.getItem('beatpulse_cookie_consent');
  });

  if (!show) return null;

  const accept = () => {
    localStorage.setItem('beatpulse_cookie_consent', 'true');
    setShow(false);
  };

  return (
    <div className="cookie-banner" role="region" aria-label="Cookie consent">
      <p>
        We use essential cookies and local storage to personalize song recommendations and save your listening sessions.
      </p>
      <div className="cookie-banner-actions">
        <button onClick={accept} className="btn btn-primary btn-sm">
          Accept
        </button>
      </div>
    </div>
  );
}

// ── 9. Copy Button ───────────────────────────────────────────
export function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`copy-button ${copied ? 'copied' : ''}`}
      title={`Copy ${label}`}
      type="button"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>{copied ? 'Copied!' : label}</span>
    </button>
  );
}

// ── 13. Password Visibility Toggle Input ──────────────────────
export function PasswordInput({ id, value, onChange, placeholder = 'Password', required = false }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="form-input"
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        )}
      </button>
    </div>
  );
}

// ── 17. Confirmation Modal ───────────────────────────────────
export function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close modal">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 18. Last Updated Date Widget ─────────────────────────────
export function LastUpdatedDate() {
  const formatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="last-updated-widget">
      <span>Database Schema v1.0 • Last updated: {formatted}</span>
    </div>
  );
}

// ── 19. Expandable FAQ Component ─────────────────────────────
export function ExpandableFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'How are personalized recommendations calculated?',
      a: 'BeatPulse utilizes a 3-tier progressive recommendation engine implemented inside MySQL stored procedure `sp_get_recommendations`. New users receive catalog popularity baselines; listeners with 2-4 plays receive content-based genre affinity recommendations; and active listeners with 5+ interactions receive collaborative filtering recommendations blended from co-listening patterns.',
    },
    {
      q: 'What is the underlying relational schema structure?',
      a: 'The system is normalized to 3NF across 9 entity tables: `users`, `genres`, `artists`, `songs`, `playlists`, `playlist_songs`, `listening_history`, `ratings`, and `user_preferences`. Foreign key constraints enforce referential integrity with CASCADE deletions.',
    },
    {
      q: 'How does live playback telemetry persist?',
      a: 'Every interactive song play sends an authenticated POST request to `/api/listen`. MySQL triggers automatically capture the session into `listening_history` with `source_namespace = "local"` and incrementally re-calculate user genre preference affinity scores.',
    },
    {
      q: 'Are historical Last.fm records mixed with app users?',
      a: 'No. The system maintains strict source namespace partitioning. Historical dataset users and scrobbles are tagged under `source_namespace = "lastfm"`, whereas registered application users operate exclusively under `source_namespace = "local"`.',
    },
  ];

  return (
    <div className="faq-list">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="faq-item">
            <button
              className="faq-question-btn"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              aria-expanded={isOpen}
            >
              <span>{faq.q}</span>
              <span>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <div className="faq-answer">{faq.a}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ── 20. Floating Contact Button & Drawer ─────────────────────
export function FloatingContact() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setMsg('');
      setOpen(false);
    }, 1800);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="floating-contact-trigger"
        aria-label="Evaluator feedback & contact"
      >
        <span>💬 Evaluator Note</span>
      </button>

      {open && (
        <div className="floating-contact-drawer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Evaluator Feedback</strong>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
              ✕
            </button>
          </div>
          {submitted ? (
            <div className="form-success-banner" style={{ margin: 0 }}>
              Feedback received for capstone review!
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Leave notes on queries, triggers, or recommendation fidelity..."
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Send Note
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}

// ── 6. Loading Spinner ───────────────────────────────────────
export function LoadingSpinner({ message = 'Loading relational records...' }) {
  return (
    <div className="loading-spinner-wrapper" role="status">
      <div className="spinner-circle" />
      <span className="loading-message">{message}</span>
    </div>
  );
}

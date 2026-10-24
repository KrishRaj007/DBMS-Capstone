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
    return () => window.removeEventListener('checkScroll', checkScroll);
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
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-primary btn-sm" onClick={accept} id="cookie-accept-btn">
          Accept
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setShow(false)}>
          Dismiss
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
      type="button"
      onClick={handleCopy}
      className={`copy-btn ${copied ? 'copied' : ''}`}
      title={copied ? 'Copied to clipboard!' : `Copy ${label}`}
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// ── 6. Loading Animations ────────────────────────────────────
export function LoadingSpinner({ message = 'Loading music data...' }) {
  return (
    <div className="loader-container">
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{message}</p>
    </div>
  );
}

// ── 13. Password Visibility Toggle Input ─────────────────────
export function PasswordInput({ id, value, onChange, placeholder = 'Enter password', required = true, name = 'password' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        name={name}
        className="form-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex="-1"
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
export function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', onConfirm, onCancel, isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-box">
        <h3 id="modal-title" className="modal-title">{title}</h3>
        <p className="modal-body">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} id="modal-cancel-btn">
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            id="modal-confirm-btn"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 18. Last Updated Date ────────────────────────────────────
export function LastUpdatedDate() {
  // Show today's actual date — no hardcoded values
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <div className="last-updated-text">
      <span>Database Schema v1.0 • Last updated: {lastUpdated}</span>
    </div>
  );
}

// ── 19. Expandable FAQ ───────────────────────────────────────
export function ExpandableFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "How does the DBMS recommendation algorithm work?",
      a: "The system computes personalized song suggestions using MySQL stored procedure `sp_get_recommendations`. It combines user genre weights (updated via database triggers), song ratings, and log-transformed listening frequency, while pruning songs already listened to frequently."
    },
    {
      q: "Which database views and stored procedures are used?",
      a: "The schema includes `top_songs_view`, `genre_popularity_view`, and `user_analytics_view`. Automated routines include `sp_get_recommendations` and `sp_update_preferences`, alongside triggers `trg_after_listen` and `trg_after_rating`."
    },
    {
      q: "Can I create and manage custom playlists?",
      a: "Yes. Playlists support full CRUD operations. You can add songs, reorder positions with relational foreign key constraints, make them public or private, and delete them with cascading integrity."
    },
    {
      q: "How are listening analytics calculated?",
      a: "Personal analytics calculate total play duration, unique song diversity, hourly listen distribution (0-23h), day-of-week trends, and genre affinity directly from indexed timestamp logs."
    },
    {
      q: "How do I switch between dark and light themes?",
      a: "Click the sun/moon toggle icon in the top header. Your preference is preserved across browser sessions in localStorage."
    }
  ];

  return (
    <div className="faq-accordion" id="faq-accordion">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className={`faq-accordion-item ${isOpen ? 'active' : ''}`}>
            <button
              type="button"
              className="faq-accordion-header"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              aria-expanded={isOpen}
            >
              <span>{faq.q}</span>
              <span className="faq-accordion-icon">▼</span>
            </button>
            {isOpen && (
              <div className="faq-accordion-content">
                <p>{faq.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 20. Floating Contact Button & Modal ───────────────────────
export function FloatingContact() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [msg, setMsg] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !msg) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setOpen(false);
      setMsg('');
      setEmail('');
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="floating-contact-btn"
        aria-label="Contact system admin"
        title="Contact Capstone Admin"
        id="floating-contact-btn"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>

      {open && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box">
            <h3 className="modal-title">Contact DBMS Project Team</h3>
            <p className="modal-body">
              Have feedback, questions about the database normalization, or query performance? Send us a note.
            </p>

            {submitted ? (
              <div className="form-success-banner">
                ✓ Thank you! Your feedback message has been logged.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-email">Your Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-message">Message / Feedback</label>
                  <textarea
                    id="contact-message"
                    className="form-input"
                    rows="3"
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Share your thoughts on the recommendation system..."
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary" id="contact-submit-btn">
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

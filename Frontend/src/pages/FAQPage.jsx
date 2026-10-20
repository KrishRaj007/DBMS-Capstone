import { ExpandableFAQ, useUtmTracking, CopyButton } from '../components/StandardWidgets';

export default function FAQPage() {
  const utm = useUtmTracking();

  const schemaInfo = [
    { table: 'users', role: 'Authentication, hashed passwords, timestamps' },
    { table: 'genres', role: 'Music taxonomy lookup categories' },
    { table: 'artists', role: 'Artist biographies and catalog entities' },
    { table: 'songs', role: 'Audio catalog with foreign keys to artists and genres' },
    { table: 'playlists', role: 'User collections with public/private flags' },
    { table: 'playlist_songs', role: 'M:N bridge relation with indexed track ordering' },
    { table: 'listening_history', role: 'Time-series listen events triggering preference updates' },
    { table: 'ratings', role: '1-5 star user evaluations with unique composite constraints' },
    { table: 'user_preferences', role: 'Dynamic algorithmic weights maintained by SQL triggers' },
  ];

  return (
    <div className="page-container" id="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentation & FAQ</h1>
          <p className="page-subtitle">
            Comprehensive technical breakdown of the database schema, stored procedures, triggers, and telemetry.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px' }}>
          Frequently Asked Questions
        </h2>
        <ExpandableFAQ />
      </div>

      {/* Relational Schema Breakdown */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px' }}>
          Normalized Database Schema (3NF)
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          The system implements 9 relational tables avoiding redundancy and ensuring referential integrity via cascade delete rules.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {schemaInfo.map((s) => (
            <div
              key={s.table}
              style={{
                backgroundColor: 'var(--bg)',
                padding: '12px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary)' }}>
                {s.table}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {s.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 14. UTM Tracking Information Box */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
            Analytics Ingestion & UTM Parameter Tracker
          </h3>
          <CopyButton text={JSON.stringify(utm)} label="Copy UTM" />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Campaign attribution parameters parsed from the inbound URL are tracked and persisted in session telemetry:
        </p>

        {Object.keys(utm).length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg)', padding: '12px', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            No incoming UTM query tags detected. Try navigating with parameters like:
            <code style={{ display: 'block', color: 'var(--secondary)', marginTop: '6px' }}>
              ?utm_source=capstone_demo&utm_medium=presentation&utm_campaign=dbms2026
            </code>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(utm).map(([k, v]) => (
              <span key={k} className="song-meta-pill" style={{ color: 'var(--primary)' }}>
                {k}: {v}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

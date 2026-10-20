import { Link } from 'react-router-dom';
import { LastUpdatedDate } from './StandardWidgets';

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div>
        <strong>BeatPulse</strong> — Music Recommendation & Listening Analytics System (DBMS Capstone)
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <Link to="/library">Library</Link>
        <Link to="/playlists">Playlists</Link>
        <Link to="/analytics">Analytics</Link>
        <Link to="/faq">Documentation</Link>
      </div>

      <LastUpdatedDate />
    </footer>
  );
}

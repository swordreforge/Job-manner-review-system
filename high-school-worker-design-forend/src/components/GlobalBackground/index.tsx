import { useLocation } from 'react-router-dom';
import './GlobalBackground.css';

export default function GlobalBackground() {
  const location = useLocation();
  
  const isLandingPage = location.pathname === '/' || location.pathname === '/welcome';
  const bgClass = isLandingPage ? 'global-background dark' : 'global-background';

  return (
    <div className={bgClass}>
      {/* MD3 surface background - no extra decoration */}
    </div>
  );
}
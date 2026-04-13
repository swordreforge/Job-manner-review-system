import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './GlobalBackground.css';

export default function GlobalBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const isLandingPage = location.pathname === '/' || location.pathname === '/welcome';
  const isAuthPage = location.pathname === '/auth';
  const bgClass = isLandingPage ? 'global-background dark' : 'global-background';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createCircles = (count: number, opacity: number) => {
      for (let i = 0; i < count; i++) {
        const circle = document.createElement('div');
        circle.className = 'bg-circle';
        
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const size = 30 + Math.random() * 50;
        
        const colors = isAuthPage ? [
          `rgba(114, 46, 209, ${opacity})`,
          `rgba(22, 119, 255, ${opacity})`,
          `rgba(82, 196, 26, ${opacity * 0.5})`,
        ] : [
          'rgba(22, 119, 255, 0.08)',
          'rgba(82, 196, 26, 0.08)',
          'rgba(250, 173, 20, 0.08)',
          'rgba(114, 46, 209, 0.08)',
          'rgba(24, 144, 255, 0.06)',
          'rgba(255, 77, 79, 0.06)',
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const duration = 15 + Math.random() * 25;
        const delay = Math.random() * -20;
        
        circle.style.cssText = `
          left: ${left}%;
          top: ${top}%;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          animation: float ${duration}s ease-in-out ${delay}s infinite;
        `;
        
        container.appendChild(circle);
      }
    };

    const createTriangles = (count: number, opacity: number) => {
      for (let i = 0; i < count; i++) {
        const triangle = document.createElement('div');
        triangle.className = 'bg-triangle';
        
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const size = 20 + Math.random() * 40;
        
        const colors = isAuthPage ? [
          `rgba(114, 46, 209, ${opacity})`,
          `rgba(22, 119, 255, ${opacity})`,
        ] : [
          'rgba(22, 119, 255, 0.06)',
          'rgba(82, 196, 26, 0.06)',
          'rgba(250, 173, 20, 0.06)',
          'rgba(114, 46, 209, 0.06)',
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const duration = 20 + Math.random() * 30;
        const delay = Math.random() * -25;
        
        triangle.style.cssText = `
          left: ${left}%;
          top: ${top}%;
          width: 0;
          height: 0;
          border-left: ${size}px solid transparent;
          border-right: ${size}px solid transparent;
          border-bottom: ${size * 1.732}px solid ${color};
          animation: float ${duration}s ease-in-out ${delay}s infinite;
          transform-origin: center;
        `;
        
        container.appendChild(triangle);
      }
    };

    const createQuadrilaterals = (count: number, opacity: number) => {
      for (let i = 0; i < count; i++) {
        const quad = document.createElement('div');
        quad.className = 'bg-quadrilateral';
        
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const size = 25 + Math.random() * 35;
        
        const colors = isAuthPage ? [
          `rgba(114, 46, 209, ${opacity})`,
          `rgba(22, 119, 255, ${opacity})`,
        ] : [
          'rgba(22, 119, 255, 0.05)',
          'rgba(82, 196, 26, 0.05)',
          'rgba(250, 173, 20, 0.05)',
          'rgba(114, 46, 209, 0.05)',
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const duration = 18 + Math.random() * 28;
        const delay = Math.random() * -22;
        
        quad.style.cssText = `
          left: ${left}%;
          top: ${top}%;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          animation: float ${duration}s ease-in-out ${delay}s infinite, rotate ${duration * 2}s linear infinite;
        `;
        
        container.appendChild(quad);
      }
    };

    if (isAuthPage) {
      createCircles(4, 0.04);
      createTriangles(3, 0.03);
      createQuadrilaterals(2, 0.03);
    } else {
      createCircles(8, 0.08);
      createTriangles(6, 0.06);
      createQuadrilaterals(5, 0.05);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [isAuthPage]);

  return (
    <div ref={containerRef} className={bgClass}>
      {/* 网格背景 */}
      <div className={isLandingPage ? '' : 'global-background-grid'}></div>
    </div>
  );
}
import { useEffect, useRef } from 'react';
import './GlobalBackground.css';

export default function GlobalBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 创建小球
    const createCircles = () => {
      for (let i = 0; i < 8; i++) {
        const circle = document.createElement('div');
        circle.className = 'bg-circle';
        
        // 随机位置
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        
        // 随机大小 (30-80px)
        const size = 30 + Math.random() * 50;
        
        // 随机颜色（柔和的颜色）
        const colors = [
          'rgba(22, 119, 255, 0.08)',  // 蓝色
          'rgba(82, 196, 26, 0.08)',   // 绿色
          'rgba(250, 173, 20, 0.08)',  // 橙色
          'rgba(114, 46, 209, 0.08)',  // 紫色
          'rgba(24, 144, 255, 0.06)',  // 亮蓝
          'rgba(255, 77, 79, 0.06)',   // 红色
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // 随机动画时长
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

    // 创建三角形
    const createTriangles = () => {
      for (let i = 0; i < 6; i++) {
        const triangle = document.createElement('div');
        triangle.className = 'bg-triangle';
        
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const size = 20 + Math.random() * 40;
        
        const colors = [
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

    // 创建四边形
    const createQuadrilaterals = () => {
      for (let i = 0; i < 5; i++) {
        const quad = document.createElement('div');
        quad.className = 'bg-quadrilateral';
        
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const size = 25 + Math.random() * 35;
        
        const colors = [
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

    createCircles();
    createTriangles();
    createQuadrilaterals();

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="global-background">
      {/* 网格背景 */}
      <div className="global-background-grid"></div>
    </div>
  );
}
import { useEffect, useRef } from 'react';

const LaserRay = () => {
  const rayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 移除硬件限制，让镭射效果在所有设备上都能显示
    // 之前只在硬件并发核心数大于4时启用动画
    // 现在所有设备都能看到镭射光线效果
  }, []);

  return (
    <div className="absolute flex flex-col z-[40] w-full !max-w-full items-center justify-center bg-transparent transition-bg overflow-hidden h-[60vh] -top-16 pointer-events-none opacity-[.3] dark:opacity-[.4]">
      <div
        ref={rayRef}
        className="ray absolute opacity-60"
        style={{
          contain: 'strict',
          containIntrinsicSize: '100vw 40vh',
          height: 'inherit',
          transform: 'translateZ(0)',
          perspective: '1000',
          backfaceVisibility: 'hidden',
          filter: 'invert(100%)',
          maskImage: 'radial-gradient(ellipse at 100% 0%, black 40%, transparent 70%)',
          pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(100deg, #fff 0%, #fff 7%, transparent 10%, transparent 12%, #fff 16%), repeating-linear-gradient(100deg, #60a5fa 10%, #e879f9 16%, #5eead4 22%, #60a5fa 30%)`,
          backgroundSize: '300%, 200%',
          backgroundPosition: '50% 50%, 50% 50%',
          WebkitTransform: 'translateZ(0)',
          WebkitPerspective: '1000',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <style>{`
          @keyframes ray {
            from {
              background-position: 50% 50%, 50% 50%;
            }
            to {
              background-position: 350% 50%, 350% 50%;
            }
          }
          
          .ray::after {
            content: '';
            position: absolute;
            inset: 0;
            background-image: repeating-linear-gradient(100deg, #fff 0%, #fff 7%, transparent 10%, transparent 12%, #fff 16%), repeating-linear-gradient(100deg, #60a5fa 10%, #e879f9 16%, #5eead4 22%, #60a5fa 30%);
            background-size: 200%, 100%;
            mix-blend-mode: difference;
            animation: ray 90s linear infinite;
          }
          
          .dark .ray {
            background-image: repeating-linear-gradient(100deg, #000 0%, #000 7%, transparent 10%, transparent 12%, #000 16%), repeating-linear-gradient(100deg, #60a5fa 10%, #e879f9 16%, #5eead4 22%, #60a5fa 30%);
            filter: opacity(60%) saturate(200%);
          }
          
          .dark .ray::after {
            background-image: repeating-linear-gradient(100deg, #000 0%, #000 7%, transparent 10%, transparent 12%, #000 16%), repeating-linear-gradient(100deg, #60a5fa 10%, #e879f9 16%, #5eead4 22%, #60a5fa 30%);
          }
        `}</style>
      </div>
    </div>
  );
};

export default LaserRay;
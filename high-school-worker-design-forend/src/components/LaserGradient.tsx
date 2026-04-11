const LaserGradient = () => {
  return (
    <>
      {/* 光晕渐变背景 */}
      <div
        id="splash"
        className="pointer-events-none absolute top-[-70vh] max-w-full justify-center w-full h-screen opacity-[.2] block gradient"
        style={{
          width: '1100px',
          height: '1100px',
          background: 'radial-gradient(ellipse at center, #d7e0ff 0%, #eaecff 25%, transparent 60%)',
        }}
      />
      <style>{`
        .dark .gradient {
          background: radial-gradient(ellipse at center, #797ee199 0%, #c084fc40 30%, transparent 65%);
        }
      `}</style>

      {/* 旋转的背景图案 */}
      <div
        className="absolute -top-16 left-0 w-full flex justify-center items-center h-screen object-center animate-pulse overflow-hidden"
        style={{ animationDuration: '8s' }}
      >
        <div
          className="aspect-square h-full lg:h-auto lg:w-full !bg-right lg:!bg-center md:translate-x-0 lg:animate-spin opacity-[.5] dark:opacity-[.15]"
          style={{
            background: 'repeating-conic-gradient(from 0deg, transparent 0deg 30deg, rgba(99, 102, 241, 0.2) 30deg 60deg, transparent 60deg 90deg, rgba(236, 72, 153, 0.15) 90deg 120deg) no-repeat center/cover',
            animationDuration: '900s',
          }}
        />
      </div>
    </>
  );
};

export default LaserGradient;
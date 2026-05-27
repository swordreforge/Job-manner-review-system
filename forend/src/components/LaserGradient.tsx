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
    </>
  );
};

export default LaserGradient;
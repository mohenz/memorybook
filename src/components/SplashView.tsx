import React, { useEffect } from 'react';

interface SplashViewProps {
  onComplete: () => void;
}

export default function SplashView({ onComplete }: SplashViewProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <main className="relative w-full viewport-height flex flex-col items-center justify-center bg-white overflow-hidden select-none">
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#0D1B3D 0.55px, transparent 0.55px)',
          backgroundSize: '24px 24px' 
        }}
      />

      <div className="relative z-10 flex w-full items-center justify-center px-5 pb-12 animate-fade-in-scale">
        <img
          src="/brand/memory-splash.png"
          alt="MEMOry — 기억을 정리하고, 영감을 연결하다"
          className="block h-auto w-[min(94vw,768px)] object-contain"
          fetchPriority="high"
        />
      </div>

      <div className="absolute bottom-[max(3.5rem,env(safe-area-inset-bottom))] w-48 sm:w-56 flex flex-col items-center">
        <div className="w-full h-1 bg-[#e9edf3] rounded-full overflow-hidden shadow-inner">
          <div className="loading-bar h-full w-full" />
        </div>
      </div>

      <div className="fixed top-[-12%] left-[-10%] w-[42%] h-[42%] bg-[#0D1B3D] opacity-[0.035] rounded-full blur-[120px]" />
      <div className="fixed bottom-[-8%] right-[-6%] w-[34%] h-[34%] bg-[#FF8A00] opacity-[0.055] rounded-full blur-[110px]" />
    </main>
  );
}

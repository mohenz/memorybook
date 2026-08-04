import React, { useEffect } from 'react';

interface SplashViewProps {
  onComplete: () => void;
}

export default function SplashView({ onComplete }: SplashViewProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2400); // 2.4 seconds for smooth loading bar showcase
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <main className="relative w-full viewport-height flex flex-col items-center justify-center bg-white overflow-hidden select-none">
      {/* Subtle Paper Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#0058be 0.5px, transparent 0.5px)', 
          backgroundSize: '24px 24px' 
        }}
      />
      
      {/* Center Branding Content */}
      <div className="relative z-10 flex w-full items-center justify-center px-4 animate-fade-in-scale">
        <img
          src="/MEMOry_logo.webp"
          alt="MEMOry — 기억을 정리하고, 영감을 연결하다"
          className="block h-auto w-[min(92vw,720px)] object-contain"
          fetchPriority="high"
        />
      </div>

      {/* Bottom Loading Section */}
      <div className="absolute bottom-24 w-64 flex flex-col items-center">
        {/* Smooth Progress Track */}
        <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mb-4">
          <div className="loading-bar h-full w-full" />
        </div>
        
      </div>

      {/* Background Atmospheric Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-fixed opacity-10 rounded-full blur-[120px]" />
      <div className="fixed bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-primary opacity-5 rounded-full blur-[100px]" />
    </main>
  );
}

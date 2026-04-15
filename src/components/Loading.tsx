'use client'
import React from 'react';
import Image from 'next/image';

interface LoadingProps {
  message?: string;
  fullPage?: boolean;
}

/**
 * 🏥 Clinical Loading Component (Tailwind Center Mastery)
 * Uses high-precision Tailwind centering to ensure the logo is the absolute epicenter.
 */
export default function Loading({ fullPage = false }: LoadingProps) {
  // ── Unified Animated Content ──
  const content = (
    <div className="relative flex flex-col items-center justify-center">
      
      {/* 1. Primary Glow Aura (Perfect Center) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[80px] animate-pulse pointer-events-none" />
      
      {/* 2. Ring & Logo Core Container */}
      <div className="relative w-48 h-48 flex items-center justify-center scale-90 md:scale-100">
        
        {/* Outer Orbit Border */}
        <div className="absolute inset-0 border-[2px] border-slate-100 rounded-full" />
        
        {/* Main Spinning Clinical Ring */}
        <div className="absolute inset-0 border-[4px] border-transparent border-t-teal-600 rounded-full animate-spin" />
        
        {/* Inner Counter-spinning Secondary Ring */}
        <div className="absolute inset-6 border-[2px] border-transparent border-b-teal-500/20 rounded-full animate-spin-reverse" />
        
        {/* The Central Branding Icon */}
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-white shadow-[0_12px_45px_rgba(0,0,0,0.1)] flex items-center justify-center border border-slate-50 transition-transform">
          <Image 
            src="/logo.png" 
            alt="AKOD Logo" 
            width={75} 
            height={75} 
            style={{ width: 'auto', height: 'auto' }}
            className="object-contain animate-subtle-bounce"
            priority
          />
        </div>
        
        {/* Perimeter Satellite Indicator */}
        <div className="absolute inset-0 animate-spin-medium">
          <div className="w-3 h-3 bg-teal-600 rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-[0_0_15px_#14b8a6]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes spin-medium {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes subtle-bounce {
          0%, 100% { transform: scale(0.97); }
          50% { transform: scale(1.03); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 2.5s linear infinite;
        }
        .animate-spin-medium {
          animation: spin-medium 2s linear infinite;
        }
        .animate-subtle-bounce {
          animation: subtle-bounce 3.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );

  // ── Full Page Viewport Centering ──
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[99999] bg-white flex items-center justify-center overflow-hidden">
        {content}
      </div>
    );
  }

  // ── Container Relative Centering (Inline) ──
  return (
    <div className="w-full flex items-center justify-center min-h-[500px] relative overflow-hidden">
      {content}
    </div>
  );
}

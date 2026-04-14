'use client'
import React from 'react';
import Image from 'next/image';

/**
 * 🏥 LoadingSpinner (Vanilla CSS Version)
 * Guaranteed centering and styling using project-standard CSS variables.
 * No Tailwind dependencies required.
 */
const LoadingSpinner: React.FC = () => {
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'all 0.5s ease'
      }}
    >
      {/* 🚀 Top Indicator Bar (Teal Primary) */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '3px',
          overflow: 'hidden',
          backgroundColor: '#f1f5f9'
        }}
      >
        <div className="loading-bar-logic" 
          style={{
            height: '100%',
            width: '100%',
            background: 'linear-gradient(90deg, transparent, var(--primary), var(--primary-light), transparent)',
            animation: 'loading-bar-anim 1.5s infinite ease-in-out'
          }}
        />
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Glow Aura */}
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '400px',
            backgroundColor: 'rgba(15, 118, 110, 0.08)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            animation: 'pulse-aura 3s infinite ease-in-out'
          }}
        />
        
        {/* Ring & Logo System */}
        <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Outer Static Ring */}
            <div style={{ position: 'absolute', inset: 0, border: '2px solid #f1f5f9', borderRadius: '50%' }} />
            
            {/* Main Spinning Teal Ring */}
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              border: '4px solid transparent', 
              borderTopColor: 'var(--primary)', 
              borderRadius: '50%', 
              animation: 'spin-normal 1.2s linear infinite' 
            }} />
            
            {/* Inner Opposite Ring */}
            <div style={{ 
              position: 'absolute', 
              inset: '24px', 
              border: '1px solid transparent', 
              borderBottomColor: 'rgba(15, 118, 110, 0.2)', 
              borderRadius: '50%', 
              animation: 'spin-reverse 2s linear infinite' 
            }} />
            
            {/* Center Logo Container */}
            <div 
              style={{ 
                position: 'relative', 
                width: '110px', 
                height: '110px', 
                borderRadius: '50%', 
                overflow: 'hidden', 
                backgroundColor: 'white', 
                boxShadow: '0 12px 40px rgba(0,0,0,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: '1px solid #f8fafc',
                animation: 'bounce-logo 4s ease-in-out infinite' 
              }}
            >
                <Image 
                    src="/logo.png" 
                    alt="AKOD Logo" 
                    width={80} 
                    height={80} 
                    style={{ objectFit: 'contain' }}
                    priority
                />
            </div>

            {/* Satellite Dot */}
            <div style={{ position: 'absolute', inset: 0, animation: 'spin-normal 2.5s linear infinite' }}>
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  backgroundColor: 'var(--primary)', 
                  borderRadius: '50%', 
                  position: 'absolute', 
                  top: '-5px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  boxShadow: '0 0 15px var(--primary-light)'
                }} />
            </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes loading-bar-anim {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin-normal {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes bounce-logo {
          0%, 100% { transform: translateY(0) scale(1.02); }
          50% { transform: translateY(-8px) scale(0.98); }
        }
        @keyframes pulse-aura {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;

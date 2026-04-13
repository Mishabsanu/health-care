'use client'
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  fullPage?: boolean;
}

export default function Loading({ message = 'Synchronizing Clinical Data...', fullPage = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6 p-12">
      <div className="relative">
        {/* Outer Ring */}
        <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
        {/* Spinning Segment */}
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-teal-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
        {/* Inner Pulsing Icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Loader2 className="w-6 h-6 text-teal-600/50 animate-pulse" />
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <p className="font-bold text-slate-400 text-[0.65rem] tracking-[0.25em] uppercase">
          {message}
        </p>
        <div className="flex gap-1">
            <span className="w-1 h-1 bg-teal-600/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-teal-600/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-teal-600/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center min-h-[40vh]">
      {content}
    </div>
  );
}

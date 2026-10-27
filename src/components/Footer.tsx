import React from 'react';
import { Waves, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-[#3b1d32] bg-[#120e14] py-4 text-[#d6b8cc] text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-[#eed3ba]" />
          <span className="font-display font-bold text-white text-sm">LakeWatch Chennai</span>
          <span className="text-[#4b263f]">&bull;</span>
          <span className="font-mono text-[11px] text-[#d6b8cc]">Sentinel-2 (10m) &bull; Dynamic World</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[#eed3ba] font-mono text-[11px] bg-[#1f1321] px-3.5 py-1 rounded-full border border-[#4b263f] text-center flex items-center gap-1.5 shadow-sm">
            <Shield className="w-3.5 h-3.5 text-[#eed3ba] shrink-0" />
            <span>Indicative analysis from satellite imagery, not legal evidence.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

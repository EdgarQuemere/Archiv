import React, { useState } from 'react';
import { RotateCcw, Sliders } from 'lucide-react';

export function CanvasControls({
  camera,
  setCamera,
  gap,
  setGap,
  totalVisible
}) {
  const [showGapSlider, setShowGapSlider] = useState(false);

  const resetView = () => {
    setCamera({ x: window.innerWidth / 2 - 125, y: window.innerHeight / 2 - 177, zoom: 1.0 });
  };

  const toggleGapSlider = () => {
    setShowGapSlider(!showGapSlider);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none font-sans">
      
      {/* Gap Size Slider Controller Popover */}
      {showGapSlider && (
        <div className="pointer-events-auto bg-[#EEEEEE] p-4 rounded-none shadow-xl border-2 border-[#111111] w-64 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#111111]" />
              Taille de l'écart (Gap)
            </span>
            <span className="text-xs font-mono font-bold text-white bg-[#111111] px-2 py-0.5 rounded-none">
              {gap}px
            </span>
          </div>

          <input
            type="range"
            min="20"
            max="140"
            step="5"
            value={gap}
            onChange={(e) => setGap(Number(e.target.value))}
            className="w-full h-1.5 bg-[#111111]/20 rounded-none appearance-none cursor-pointer accent-[#111111]"
          />
        </div>
      )}

      {/* Main Floating Controls Bar */}
      <div
        className="pointer-events-auto bg-[#EEEEEE] p-0 border-2 border-[#111111] shadow-lg flex items-center rounded-none text-[#111111]"
      >
        {/* Toggle Gap Controller */}
        <button
          onClick={toggleGapSlider}
          title="Ajuster la taille du gap"
          className={`h-10 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-colors rounded-none ${
            showGapSlider ? 'bg-[#111111] text-white' : 'hover:bg-[#e0e0e0] text-[#111111]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">Gap: {gap}px</span>
        </button>

        <div className="w-[1.5px] h-10 bg-[#111111]" />

        {/* Reset Camera Position */}
        <button
          onClick={resetView}
          title="Centrer le canva"
          className="h-10 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-colors rounded-none hover:bg-[#e0e0e0] text-[#111111]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Centrer</span>
        </button>

      </div>
    </div>
  );
}

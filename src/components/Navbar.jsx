import React from 'react';
import { Search, X, List, LayoutGrid } from 'lucide-react';

export function Navbar({
  activeView,
  setActiveView,
  onOpenFilter,
  onOpenSubmit,
  activeFilterCount,
  searchQuery,
  setSearchQuery
}) {
  return (
    <header className="fixed top-3 left-3 right-3 sm:top-6 sm:left-6 sm:right-6 z-40 flex items-center justify-between gap-2 pointer-events-none font-sans">
      {/* Top Left Buttons Group */}
      <div className="flex items-center gap-1.5 sm:gap-3 pointer-events-auto">
        {/* Button 1: Advertise Here / Soumettre */}
        <button
          onClick={onOpenSubmit}
          className="h-10 sm:h-12 px-3 sm:px-7 bg-[#111111] hover:opacity-90 text-[#EEEEEE] text-xs sm:text-sm font-normal tracking-wide rounded-none flex items-center justify-center transition-colors shadow-none shrink-0"
        >
          <span className="hidden xs:inline sm:inline">Advertise Here</span>
          <span className="xs:hidden sm:hidden">Submit</span>
        </button>

        {/* Button 2: Filtres */}
        <button
          onClick={onOpenFilter}
          className="h-10 sm:h-12 px-3 sm:px-7 bg-[#111111] hover:opacity-90 text-[#EEEEEE] text-xs sm:text-sm font-normal tracking-wide rounded-none flex items-center justify-center transition-colors shadow-none relative shrink-0"
        >
          <span>Filtres</span>
          {activeFilterCount > 0 && (
            <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs font-mono bg-[#EEEEEE] text-[#111111] px-1.5 py-0.5 rounded-none font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View Switcher Segmented Block (3 Views: Canvas, Network, List) */}
        <div className="h-10 sm:h-12 border-2 border-[#111111] bg-[#EEEEEE] flex items-center rounded-none overflow-hidden p-0 shrink-0">
          {/* 1. Canvas View */}
          <button
            onClick={() => setActiveView('canvas')}
            title="Vue Canva Infini"
            className={`w-9 sm:w-12 h-full flex items-center justify-center transition-colors rounded-none ${
              activeView === 'canvas'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#dddddd]'
            }`}
          >
            <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </button>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          {/* 2. Network Graph View */}
          <button
            onClick={() => setActiveView('network')}
            title="Vue Graphe Relationnel"
            className={`w-9 sm:w-12 h-full flex items-center justify-center transition-colors rounded-none ${
              activeView === 'network'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#dddddd]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 256 256">
              <path d="M200,152a31.84,31.84,0,0,0-19.53,6.68l-23.11-18A31.65,31.65,0,0,0,160,128c0-.74,0-1.48-.08-2.21l13.23-4.41A32,32,0,1,0,168,104c0,.74,0,1.48.08,2.21l-13.23,4.41A32,32,0,0,0,128,96a32.59,32.59,0,0,0-5.27.44L115.89,81A32,32,0,1,0,96,88a32.59,32.59,0,0,0,5.27-.44l6.84,15.4a31.92,31.92,0,0,0-8.57,39.64L73.83,165.44a32.06,32.06,0,1,0,10.63,12l25.71-22.84a31.91,31.91,0,0,0,37.36-1.24l23.11,18A31.65,31.65,0,0,0,168,184a32,32,0,1,0,32-32Zm0-64a16,16,0,1,1-16,16A16,16,0,0,1,200,88ZM80,56A16,16,0,1,1,96,72,16,16,0,0,1,80,56ZM56,208a16,16,0,1,1,16-16A16,16,0,0,1,56,208Zm56-80a16,16,0,1,1,16,16A16,16,0,0,1,112,128Zm88,72a16,16,0,1,1,16-16A16,16,0,0,1,200,200Z"></path>
            </svg>
          </button>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          {/* 3. List View */}
          <button
            onClick={() => setActiveView('list')}
            title="Vue Liste"
            className={`w-9 sm:w-12 h-full flex items-center justify-center transition-colors rounded-none ${
              activeView === 'list'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#dddddd]'
            }`}
          >
            <List className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Top Right Search Bar - Solid Black #111111 Style */}
      <div className="pointer-events-auto flex items-center">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="h-10 sm:h-12 w-32 xs:w-40 sm:w-64 bg-[#111111] text-[#EEEEEE] text-xs font-normal pl-8 sm:pl-9 pr-7 sm:pr-8 rounded-none focus:outline-none focus:ring-1 focus:ring-[#EEEEEE] transition-colors placeholder:text-slate-400"
          />
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EEEEEE] absolute left-2.5 sm:left-3 pointer-events-none opacity-80" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 sm:right-3 text-[#EEEEEE] hover:opacity-60"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import { Search, X, List, LayoutGrid, Grid3X3, Share2 } from 'lucide-react';

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
    <header className="fixed top-6 left-6 right-6 z-40 flex items-center justify-between pointer-events-none font-sans">
      {/* Top Left Buttons Group */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Button 1: Advertise Here / Soumettre */}
        <button
          onClick={onOpenSubmit}
          className="h-12 px-7 bg-[#111111] hover:bg-black text-white text-sm font-normal tracking-wide rounded-none flex items-center justify-center transition-colors shadow-none"
        >
          <span>Advertise Here</span>
        </button>

        {/* Button 2: Filtres */}
        <button
          onClick={onOpenFilter}
          className="h-12 px-7 bg-[#111111] hover:bg-black text-white text-sm font-normal tracking-wide rounded-none flex items-center justify-center transition-colors shadow-none relative"
        >
          <span>Filtres</span>
          {activeFilterCount > 0 && (
            <span className="ml-2 text-xs font-mono bg-white text-[#111111] px-1.5 py-0.5 rounded-none font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View Switcher Segmented Block */}
        <div className="h-12 border-2 border-[#111111] bg-[#EEEEEE] flex items-center rounded-none overflow-hidden p-0">
          {/* 1. Canvas View */}
          <button
            onClick={() => setActiveView('canvas')}
            title="Vue Canva Infini"
            className={`w-12 h-full flex items-center justify-center transition-colors rounded-none ${
              activeView === 'canvas'
                ? 'bg-[#111111] text-white'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#e0e0e0]'
            }`}
          >
            <LayoutGrid className="w-5 h-5 stroke-[2]" />
          </button>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          {/* 2. Compact Grid View */}
          <button
            onClick={() => setActiveView('compact')}
            title="Vue Grille Compacte"
            className={`w-12 h-full flex items-center justify-center transition-colors rounded-none ${
              activeView === 'compact'
                ? 'bg-[#111111] text-white'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#e0e0e0]'
            }`}
          >
            <Grid3X3 className="w-5 h-5 stroke-[2]" />
          </button>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          {/* 3. Network Graph View */}
          <button
            onClick={() => setActiveView('network')}
            title="Vue Graphe Relationnel"
            className={`w-12 h-full flex items-center justify-center transition-colors rounded-none ${
              activeView === 'network'
                ? 'bg-[#111111] text-white'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#e0e0e0]'
            }`}
          >
            <Share2 className="w-5 h-5 stroke-[2]" />
          </button>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          {/* 4. List View */}
          <button
            onClick={() => setActiveView('list')}
            title="Vue Liste"
            className={`w-12 h-full flex items-center justify-center transition-colors rounded-none ${
              activeView === 'list'
                ? 'bg-[#111111] text-white'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#e0e0e0]'
            }`}
          >
            <List className="w-5 h-5 stroke-[2]" />
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
            className="h-12 w-48 sm:w-64 bg-[#111111] text-white text-xs font-normal pl-9 pr-8 rounded-none focus:outline-none focus:ring-1 focus:ring-white transition-colors placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-white absolute left-3 pointer-events-none opacity-80" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-white hover:opacity-60"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

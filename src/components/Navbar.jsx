import React from 'react';
import { Search, X, List, LayoutGrid, Info, User } from 'lucide-react';

export function Navbar({
  activeView,
  setActiveView,
  onOpenFilter,
  isFilterOpen,
  onOpenSubmit,
  onOpenInfo,
  onOpenLogin,
  onOpenProfile,
  isProfileOpen,
  user,
  logout,
  activeFilterCount,
  searchQuery,
  setSearchQuery
}) {
  return (
    <header className="fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-40 flex items-center justify-between gap-3 pointer-events-none font-sans">
      {/* Top Left Buttons Group */}
      <div className="flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
        {/* Logo */}
        <img
          src="/Artchiv-logo.webp"
          alt="Artchiv"
          className="h-10 sm:h-12 w-auto object-contain cursor-pointer transition-opacity hover:opacity-80 mr-0.5"
          onClick={() => setActiveView && setActiveView('canvas')}
        />

        {/* Info Button (i) */}
        <button
          onClick={onOpenInfo || onOpenSubmit}
          title="Informations / Publier un projet"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors shrink-0 shadow-sm"
        >
          <Info className="w-4 h-4 stroke-[2.25]" />
        </button>

        {/* User Profile Button (👤) - White by default, black when profile is open */}
        <button
          onClick={user ? onOpenProfile : onOpenLogin}
          title={user ? user.name || 'Profil' : 'Se connecter'}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-[1.5px] border-[#111111] flex items-center justify-center transition-colors shrink-0 shadow-sm ${
            isProfileOpen
              ? 'bg-[#111111] text-[#EEEEEE]'
              : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
          }`}
        >
          <User className="w-4 h-4 stroke-[2.25]" />
        </button>
      </div>

      {/* Top Right Controls Group */}
      <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3">
        {/* Filtres Button */}
        <button
          onClick={onOpenFilter}
          className={`h-9 sm:h-10 px-4 sm:px-6 border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium rounded-full flex items-center justify-center transition-colors shadow-sm relative shrink-0 ${
            isFilterOpen
              ? 'bg-[#111111] text-[#EEEEEE]'
              : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
          }`}
        >
          <span>Filtres</span>
          {activeFilterCount > 0 && (
            <span className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
              isFilterOpen ? 'bg-[#EEEEEE] text-[#111111]' : 'bg-[#111111] text-[#EEEEEE]'
            }`}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View Switcher Segmented Control */}
        <div className="h-9 sm:h-10 border-[1.5px] border-[#111111] bg-[#EEEEEE] flex items-center rounded-full overflow-hidden p-0 shrink-0 shadow-sm">
          {/* 1. Canvas / Grid View */}
          <button
            onClick={() => setActiveView('canvas')}
            title="Vue Canva Infini"
            className={`w-9 sm:w-10 h-full flex items-center justify-center transition-colors ${
              activeView === 'canvas'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
            }`}
          >
            <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          {/* 2. Network Graph View */}
          <button
            onClick={() => setActiveView('network')}
            title="Vue Graphe Relationnel"
            className={`w-9 sm:w-10 h-full flex items-center justify-center transition-colors ${
              activeView === 'network'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 256 256">
              <path d="M200,152a31.84,31.84,0,0,0-19.53,6.68l-23.11-18A31.65,31.65,0,0,0,160,128c0-.74,0-1.48-.08-2.21l13.23-4.41A32,32,0,1,0,168,104c0,.74,0,1.48.08,2.21l-13.23,4.41A32,32,0,0,0,128,96a32.59,32.59,0,0,0-5.27.44L115.89,81A32,32,0,1,0,96,88a32.59,32.59,0,0,0,5.27-.44l6.84,15.4a31.92,31.92,0,0,0-8.57,39.64L73.83,165.44a32.06,32.06,0,1,0,10.63,12l25.71-22.84a31.91,31.91,0,0,0,37.36-1.24l23.11,18A31.65,31.65,0,0,0,168,184a32,32,0,1,0,32-32Zm0-64a16,16,0,1,1-16,16A16,16,0,0,1,200,88ZM80,56A16,16,0,1,1,96,72,16,16,0,0,1,80,56ZM56,208a16,16,0,1,1,16-16A16,16,0,0,1,56,208Zm56-80a16,16,0,1,1,16,16A16,16,0,0,1,112,128Zm88,72a16,16,0,1,1,16-16A16,16,0,0,1,200,200Z"></path>
            </svg>
          </button>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          {/* 3. List View */}
          <button
            onClick={() => setActiveView('list')}
            title="Vue Liste"
            className={`w-9 sm:w-10 h-full flex items-center justify-center transition-colors ${
              activeView === 'list'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
            }`}
          >
            <List className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="h-9 sm:h-10 w-36 xs:w-48 sm:w-64 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full flex items-center px-3 relative shadow-sm">
          <Search className="w-4 h-4 text-[#111111] opacity-75 shrink-0 mr-2 stroke-[2.25]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-transparent text-[#111111] text-xs sm:text-sm font-normal focus:outline-none placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#111111] hover:opacity-60 shrink-0 ml-1"
            >
              <X className="w-3.5 h-3.5 stroke-[2.25]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;

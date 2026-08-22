import React from 'react';
import { Search, X, List, LayoutGrid, Info, User } from 'lucide-react';

const IconUserProfile = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z" />
  </svg>
);

export function Navbar({
  activeView,
  setActiveView,
  onOpenFilter,
  isFilterOpen,
  onOpenSubmit,
  onOpenInfo,
  isInfoOpen,
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
    <header className="fixed top-3 left-3 right-3 sm:top-6 sm:left-6 sm:right-6 z-40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3.5 pointer-events-none font-sans max-w-full">
      {/* Top Left Buttons Group */}
      <div className="flex items-center gap-1.5 xs:gap-2.5 sm:gap-3.5 pointer-events-auto shrink-0">
        {/* Logo (Condensé sur mobile, Grand sur desktop) */}
        <picture onClick={() => setActiveView && setActiveView('canvas')} className="cursor-pointer transition-opacity hover:opacity-80 mr-0.5 shrink-0 flex items-center">
          <source media="(max-width: 639px)" srcset="/Archiv_logo_condesed.webp" />
          <img
            src="/Artchiv-logo.webp"
            alt="Artchiv"
            className="h-9 xs:h-10 sm:h-13 md:h-14 w-auto object-contain block"
          />
        </picture>

        {/* Info Button (i) */}
        <button
          onClick={onOpenInfo}
          title="Informations"
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] flex items-center justify-center transition-colors shrink-0 shadow-sm ${
            isInfoOpen
              ? 'bg-[#111111] text-[#EEEEEE]'
              : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
          }`}
        >
          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
        </button>

        {/* User Profile Button (👤) */}
        <button
          onClick={onOpenProfile}
          title={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Profil' : 'Mon Profil'}
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] flex items-center justify-center transition-colors shrink-0 shadow-sm ${
            isProfileOpen
              ? 'bg-[#111111] text-[#EEEEEE]'
              : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
          }`}
        >
          <IconUserProfile className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Top Right Controls Group */}
      <div className="pointer-events-auto flex items-center gap-1.5 xs:gap-2.5 sm:gap-3.5 shrink-0 max-w-full overflow-x-auto no-scrollbar">
        {/* Filtres Button */}
        <button
          onClick={onOpenFilter}
          className={`h-9 sm:h-11 px-3.5 xs:px-5 sm:px-8 border-[1.5px] border-[#111111] text-xs sm:text-base font-medium rounded-full flex items-center justify-center transition-colors shadow-sm relative shrink-0 ${
            isFilterOpen
              ? 'bg-[#111111] text-[#EEEEEE]'
              : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
          }`}
        >
          <span>Filtres</span>
          {activeFilterCount > 0 && (
            <span className={`ml-1.5 sm:ml-2 text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${
              isFilterOpen ? 'bg-[#EEEEEE] text-[#111111]' : 'bg-[#111111] text-[#EEEEEE]'
            }`}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View Switcher Segmented Control */}
        <div className="h-9 sm:h-11 border-[1.5px] border-[#111111] bg-[#EEEEEE] flex items-center rounded-full overflow-hidden p-0 shrink-0 shadow-sm">
          {/* 1. Canvas / Grid View */}
          <button
            onClick={() => setActiveView('canvas')}
            title="Vue Canva Infini"
            className={`w-8 xs:w-9 sm:w-11 h-full flex items-center justify-center transition-colors ${
              activeView === 'canvas'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
          </button>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          {/* 2. Network Graph View */}
          <button
            onClick={() => setActiveView('network')}
            title="Vue Graphe Relationnel"
            className={`w-8 xs:w-9 sm:w-11 h-full flex items-center justify-center transition-colors ${
              activeView === 'network'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 256 256">
              <path d="M200,152a31.84,31.84,0,0,0-19.53,6.68l-23.11-18A31.65,31.65,0,0,0,160,128c0-.74,0-1.48-.08-2.21l13.23-4.41A32,32,0,1,0,168,104c0,.74,0,1.48.08,2.21l-13.23,4.41A32,32,0,0,0,128,96a32.59,32.59,0,0,0-5.27.44L115.89,81A32,32,0,1,0,96,88a32.59,32.59,0,0,0,5.27-.44l6.84,15.4a31.92,31.92,0,0,0-8.57,39.64L73.83,165.44a32.06,32.06,0,1,0,10.63,12l25.71-22.84a31.91,31.91,0,0,0,37.36-1.24l23.11,18A31.65,31.65,0,0,0,168,184a32,32,0,1,0,32-32Zm0-64a16,16,0,1,1-16,16A16,16,0,0,1,200,88ZM80,56A16,16,0,1,1,96,72,16,16,0,0,1,80,56ZM56,208a16,16,0,1,1,16-16A16,16,0,0,1,56,208Zm56-80a16,16,0,1,1,16,16A16,16,0,0,1,112,128Zm88,72a16,16,0,1,1,16-16A16,16,0,0,1,200,200Z"></path>
            </svg>
          </button>

          <div className="w-[1.5px] h-full bg-[#111111]" />

          {/* 3. List View */}
          <button
            onClick={() => setActiveView('list')}
            title="Vue Liste"
            className={`w-8 xs:w-9 sm:w-11 h-full flex items-center justify-center transition-colors ${
              activeView === 'list'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
            }`}
          >
            <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="h-9 sm:h-11 w-24 xs:w-36 sm:w-64 md:w-72 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full flex items-center px-2.5 sm:px-4 relative shadow-sm transition-all focus-within:w-44 xs:focus-within:w-52 sm:focus-within:w-72">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#111111] opacity-75 shrink-0 mr-1.5 sm:mr-2 stroke-[2.25]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-transparent text-[#111111] text-xs sm:text-base font-normal focus:outline-none placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#111111] hover:opacity-60 shrink-0 ml-1"
            >
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.25]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;

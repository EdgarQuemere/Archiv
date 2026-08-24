import React, { useState } from 'react';
import { Search, X, List, LayoutGrid, Info, User, ChevronLeft, ChevronRight } from 'lucide-react';

const IconUserProfile = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z" />
  </svg>
);

const FilterIconSVG = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M40,92H70.06a36,36,0,0,0,67.88,0H216a12,12,0,0,0,0-24H137.94a36,36,0,0,0-67.88,0H40a12,12,0,0,0,0,24Zm64-24A12,12,0,1,1,92,80,12,12,0,0,1,104,68Zm112,96H201.94a36,36,0,0,0-67.88,0H40a12,12,0,0,0,0,24h94.06a36,36,0,0,0,67.88,0H216a12,12,0,0,0,0-24Zm-48,24a12,12,0,1,1,12-12A12,12,0,0,1,168,188Z"></path>
  </svg>
);

const IconAddDocument = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M216.49,79.51l-56-56A12,12,0,0,0,152,20H56A20,20,0,0,0,36,40V216a20,20,0,0,0,20,20H200a20,20,0,0,0,20-20V88A12,12,0,0,0,216.49,79.51ZM160,57l23,23H160ZM60,212V44h76V92a12,12,0,0,0,12,12h48V212Zm104-60a12,12,0,0,1-12,12H140v12a12,12,0,0,1-24,0V164H104a12,12,0,0,1,0-24h12V128a12,12,0,0,1,24,0v12h12A12,12,0,0,1,164,152Z" />
  </svg>
);

const TrashIconSVG = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M216,48H180V36A28,28,0,0,0,152,8H104A28,28,0,0,0,76,36V48H40a12,12,0,0,0,0,24h4V208a20,20,0,0,0,20,20H192a20,20,0,0,0,20-20V72h4a12,12,0,0,0,0-24ZM100,36a4,4,0,0,1,4-4h48a4,4,0,0,1,4,4V48H100Zm88,168H68V72H188ZM116,104v64a12,12,0,0,1-24,0V104a12,12,0,0,1,24,0Zm48,0v64a12,12,0,0,1-24,0V104a12,12,0,0,1,24,0Z"></path>
  </svg>
);

export function Navbar({
  activeView,
  setActiveView,
  onOpenFilter,
  isFilterOpen,
  onOpenSubmit,
  isSubmitOpen,
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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [cellProposal, setCellProposal] = useState('P1'); // 'P1' | 'P2' | 'P3'

  const cycleView = () => {
    if (activeView === 'canvas') setActiveView('network');
    else if (activeView === 'network') setActiveView('list');
    else setActiveView('canvas');
  };

  const currentViewIcon = () => {
    if (activeView === 'network') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 stroke-[2.25]" fill="currentColor" viewBox="0 0 256 256">
          <path d="M200,152a35.77,35.77,0,0,0-16.46,4l-21.39-16.64A35.49,35.49,0,0,0,164,128.65l10.35-3.44A36,36,0,1,0,164,100c0,1.11.06,2.21.16,3.3l-7.78,2.59A36,36,0,0,0,128,92c-1,0-1.88,0-2.81.12l-4.45-10A36,36,0,1,0,96,92c1,0,1.88,0,2.81-.12l4.45,10a35.91,35.91,0,0,0-8.59,39.7L73.39,160.49a36,36,0,1,0,15.94,17.93l21.28-18.91a35.91,35.91,0,0,0,36.8-1.21L167,173.56A36,36,0,1,0,200,152Zm0-64a12,12,0,1,1-12,12A12,12,0,0,1,200,88ZM84,56A12,12,0,1,1,96,68,12,12,0,0,1,84,56ZM56,204a12,12,0,1,1,12-12A12,12,0,0,1,56,204Zm60-76a12,12,0,1,1,12,12A12,12,0,0,1,116,128Zm84,72a12,12,0,1,1,12-12A12,12,0,0,1,200,200Z"></path>
        </svg>
      );
    }
    if (activeView === 'list') {
      return <List className="w-4 h-4 stroke-[2.25]" />;
    }
    return <LayoutGrid className="w-4 h-4 stroke-[2.25]" />;
  };

  return (
    <>
      <header className="fixed top-3 left-3 right-3 sm:top-6 sm:left-6 sm:right-6 z-50 flex items-center justify-between gap-1 sm:gap-3.5 pointer-events-none font-sans max-w-full">
        {/* Top Left Buttons Group */}
        <div className="flex items-center gap-1 xs:gap-2 sm:gap-3.5 pointer-events-auto shrink-0">
          {/* Logo (Condensé sur mobile, Grand sur desktop) */}
          <picture onClick={() => setActiveView && setActiveView('canvas')} className="cursor-pointer mr-0.5 shrink-0 flex items-center">
            <source media="(max-width: 639px)" srcSet="/archiv_logo_condesed.webp" />
            <img
              src="/artchiv-logo.webp"
              alt="Artchiv"
              className="h-9 xs:h-10 sm:h-13 md:h-14 w-auto object-contain block"
            />
          </picture>

          {/* Info Button (i) */}
          <button
            onClick={onOpenInfo}
            title="Informations"
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] flex items-center justify-center transition-colors shrink-0 shadow-sm ${isInfoOpen
              ? 'bg-[#111111] text-[#EEEEEE]'
              : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
              }`}
          >
            <Info className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
          </button>

          {/* User Profile Button (👤) */}
          <button
            onClick={onOpenProfile}
            title={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Profil' : 'Mon Profil'}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] flex items-center justify-center transition-colors shrink-0 shadow-sm ${isProfileOpen
              ? 'bg-[#111111] text-[#EEEEEE]'
              : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
              }`}
          >
            <IconUserProfile className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={() => onOpenSubmit?.()}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] flex items-center justify-center transition-colors shrink-0 shadow-sm ${isSubmitOpen
              ? 'bg-[#111111] text-[#EEEEEE]'
              : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
              }`}
            title="Ajouter mon travail"
          >
            <IconAddDocument className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Top Right Controls Group */}
        <div className="pointer-events-auto flex items-center gap-1 xs:gap-1.5 sm:gap-3.5 shrink-0">
          {/* Filtres Button */}
          <button
            onClick={onOpenFilter}
            className={`h-10 sm:h-11 ${activeFilterCount > 0 ? 'w-auto px-2.5 sm:px-8' : 'w-10 sm:w-auto px-0 sm:px-8'
              } border-[1.5px] border-[#111111] text-xs sm:text-base font-medium rounded-full flex items-center justify-center transition-all shadow-sm relative shrink-0 ${isFilterOpen
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
              }`}
          >
            <span className="hidden sm:inline">Filtres</span>
            <span className="inline sm:hidden flex items-center justify-center">
              <FilterIconSVG className="w-4 h-4" />
            </span>
            {activeFilterCount > 0 && (
              <span className={`ml-1.5 sm:ml-2 text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${isFilterOpen ? 'bg-[#EEEEEE] text-[#111111]' : 'bg-[#111111] text-[#EEEEEE]'
                }`}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Search Button - Mobile (loupe alignée sur 1 seule ligne) */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="flex sm:hidden w-10 h-10 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2] items-center justify-center transition-colors shadow-sm cursor-pointer shrink-0"
            title="Rechercher"
          >
            <Search className="w-4 h-4 stroke-[2.25]" />
          </button>

          {/* Mobile View Switcher Pill (P2: Canva / Liens / Liste - Fixed width 94px) */}
          <button
            onClick={cycleView}
            className="flex sm:hidden h-10 w-[94px] px-2 rounded-full border-[1.5px] border-[#111111] bg-[#111111] text-[#EEEEEE] items-center justify-center gap-1 shadow-sm cursor-pointer shrink-0"
            title="Changer de vue"
          >
            {currentViewIcon()}
            <span className="font-sans text-[11px] font-bold tracking-tight w-[38px] text-center inline-block">
              {activeView === 'canvas' ? 'Canva' : activeView === 'network' ? 'Liens' : 'Liste'}
            </span>
            <ChevronRight className="w-3 h-3 text-[#EEEEEE]/60 stroke-[2.25] shrink-0" />
          </button>

          {/* Desktop View Switcher Segmented Control (3-Icon) */}
          <div className="hidden sm:flex h-11 border-[1.5px] border-[#111111] bg-[#EEEEEE] items-center rounded-full overflow-hidden p-0 shrink-0 shadow-sm">
            {/* 1. Canvas / Grid View */}
            <button
              onClick={() => setActiveView('canvas')}
              title="Vue Canva Infini"
              className={`w-11 h-full flex items-center justify-center transition-colors ${activeView === 'canvas'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                }`}
            >
              <LayoutGrid className="w-4 h-4 stroke-[2.25]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            {/* 2. Network Graph View */}
            <button
              onClick={() => setActiveView('network')}
              title="Vue Graphe Relationnel"
              className={`w-11 h-full flex items-center justify-center transition-colors ${activeView === 'network'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 256 256">
                <path d="M200,152a35.77,35.77,0,0,0-16.46,4l-21.39-16.64A35.49,35.49,0,0,0,164,128.65l10.35-3.44A36,36,0,1,0,164,100c0,1.11.06,2.21.16,3.3l-7.78,2.59A36,36,0,0,0,128,92c-1,0-1.88,0-2.81.12l-4.45-10A36,36,0,1,0,96,92c1,0,1.88,0,2.81-.12l4.45,10a35.91,35.91,0,0,0-8.59,39.7L73.39,160.49a36,36,0,1,0,15.94,17.93l21.28-18.91a35.91,35.91,0,0,0,36.8-1.21L167,173.56A36,36,0,1,0,200,152Zm0-64a12,12,0,1,1-12,12A12,12,0,0,1,200,88ZM84,56A12,12,0,1,1,96,68,12,12,0,0,1,84,56ZM56,204a12,12,0,1,1,12-12A12,12,0,0,1,56,204Zm60-76a12,12,0,1,1,12,12A12,12,0,0,1,116,128Zm84,72a12,12,0,1,1,12-12A12,12,0,0,1,200,200Z"></path>
              </svg>
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            {/* 3. List View */}
            <button
              onClick={() => setActiveView('list')}
              title="Vue Liste"
              className={`w-11 h-full flex items-center justify-center transition-colors ${activeView === 'list'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                }`}
            >
              <List className="w-4 h-4 stroke-[2.25]" />
            </button>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden sm:flex h-11 w-64 md:w-72 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full items-center px-4 relative shadow-sm">
            <Search className="w-4 h-4 text-[#111111] opacity-75 shrink-0 mr-2 stroke-[2.25]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-transparent text-[#111111] text-base font-normal focus:outline-none placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#111111] hover:opacity-60 shrink-0 ml-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[2.25]" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* OVERLAY RECHERCHE MOBILE (Écran grisé avec barre de recherche mid-screen) */}
      {isMobileSearchOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col items-center justify-start pt-24 px-4 font-sans pointer-events-auto animate-in fade-in duration-200"
          onClick={() => setIsMobileSearchOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full p-2 pl-4 pr-2 shadow-2xl flex items-center gap-2.5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <Search className="w-4 h-4 text-[#111111] opacity-75 shrink-0 stroke-[2.25]" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-transparent text-[#111111] text-base font-normal focus:outline-none placeholder:text-slate-500"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-[#111111] hover:opacity-60 transition-opacity shrink-0 cursor-pointer"
                title="Effacer la recherche"
              >
                <TrashIconSVG className="w-4 h-4" />
              </button>
            ) : null}
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="w-8 h-8 rounded-full bg-[#111111] text-[#EEEEEE] flex items-center justify-center shrink-0 cursor-pointer"
              title="Fermer la recherche"
            >
              <X className="w-4 h-4 stroke-[2.25]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;

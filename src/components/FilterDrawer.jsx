import React, { useEffect, useRef } from 'react';
import { X, RotateCcw, Filter, Check } from 'lucide-react';
import gsap from 'gsap';
import { SCHOOLS_LIST, TYPES_LIST, FIELDS_LIST } from '../data/coversData';

export function FilterDrawer({
  isOpen,
  onClose,
  filters,
  setFilters,
  resetFilters,
  totalResults
}) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      gsap.timeline()
        .fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        )
        .fromTo(
          panelRef.current,
          { x: '-100%' },
          { x: '0%', duration: 0.4, ease: 'power3.out' },
          '-=0.2'
        );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (panelRef.current && backdropRef.current) {
      gsap.timeline({
        onComplete: () => {
          onClose();
        }
      })
      .to(panelRef.current, { x: '-100%', duration: 0.3, ease: 'power2.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.2 }, '-=0.15');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-[#111111]/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 left-0 max-w-full flex pl-0">
        <div
          ref={panelRef}
          className="w-screen max-w-md bg-[#EEEEEE] shadow-2xl flex flex-col h-full border-r-2 border-[#111111] transform-gpu rounded-none text-[#111111]"
        >
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-[#111111] text-[#EEEEEE] flex items-center justify-between rounded-none">
            <div className="flex items-center gap-2.5">
              <Filter className="w-5 h-5 text-[#EEEEEE]" />
              <div>
                <h2 className="text-base font-bold tracking-tight">Filtres d'exploration</h2>
                <p className="text-xs text-slate-300 font-mono">
                  {totalResults} couverture{totalResults > 1 ? 's' : ''} disponible{totalResults > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-none text-[#EEEEEE] hover:opacity-75 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Type Filter */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111] block mb-2.5">
                Type de document
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TYPES_LIST.map((type) => {
                  const isActive = filters.type === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setFilters((prev) => ({ ...prev, type }))}
                      className={`px-3 py-2 text-xs font-semibold rounded-none border-2 border-[#111111] text-center transition-all ${
                        isActive
                          ? 'bg-[#111111] text-[#EEEEEE]'
                          : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#dddddd]'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* School Filter */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111] block mb-2.5">
                École / Université
              </label>
              <select
                value={filters.school}
                onChange={(e) => setFilters((prev) => ({ ...prev, school: e.target.value }))}
                className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2.5 text-xs text-[#111111] font-medium focus:outline-none"
              >
                {SCHOOLS_LIST.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </div>

            {/* Field Filter */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111] block mb-2.5">
                Domaine de recherche
              </label>
              <select
                value={filters.field}
                onChange={(e) => setFilters((prev) => ({ ...prev, field: e.target.value }))}
                className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2.5 text-xs text-[#111111] font-medium focus:outline-none"
              >
                {FIELDS_LIST.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111] block mb-2.5">
                Année de publication
              </label>
              <div className="flex flex-wrap gap-2">
                {['Toutes', '2025', '2024', '2023', '2021'].map((yr) => {
                  const isActive = filters.year === yr;
                  return (
                    <button
                      key={yr}
                      onClick={() => setFilters((prev) => ({ ...prev, year: yr }))}
                      className={`px-3 py-1.5 text-xs font-mono rounded-none border-2 border-[#111111] transition-all ${
                        isActive
                          ? 'bg-[#111111] text-[#EEEEEE] font-bold'
                          : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#dddddd]'
                      }`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-[#EEEEEE] border-t-2 border-[#111111] flex items-center gap-3">
            <button
              onClick={resetFilters}
              className="flex-1 py-2.5 border-2 border-[#111111] text-[#111111] bg-[#EEEEEE] hover:bg-[#dddddd] rounded-none text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>

            <button
              onClick={handleClose}
              className="flex-1 py-2.5 bg-[#111111] text-[#EEEEEE] hover:opacity-90 rounded-none text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Appliquer</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

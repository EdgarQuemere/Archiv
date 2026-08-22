import React, { useEffect, useRef, useState } from 'react';
import { X, RotateCcw, Search, ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import api from '../api/axios';

export function FilterDrawer({
  isOpen,
  onClose,
  filters,
  setFilters,
  resetFilters,
  totalResults,
  dynamicSchools = [],
  dynamicFields = [],
  dynamicYears = [],
  dynamicTypes = []
}) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const schoolSearchContainerRef = useRef(null);
  const fieldSearchContainerRef = useRef(null);
  const [allDomains, setAllDomains] = useState([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [fieldSearch, setFieldSearch] = useState('');
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);

  useEffect(() => {
    api.get('/domains')
      .then(res => setAllDomains(res.data.map(d => d.name)))
      .catch(err => console.error('Erreur de chargement des domaines', err));
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (schoolSearchContainerRef.current && !schoolSearchContainerRef.current.contains(e.target)) {
        setShowSchoolDropdown(false);
      }
      if (fieldSearchContainerRef.current && !fieldSearchContainerRef.current.contains(e.target)) {
        setShowFieldDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      gsap.timeline()
        .fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power2.out' }
        )
        .fromTo(
          panelRef.current,
          { opacity: 0, y: -20, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.2)' },
          '-=0.15'
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
      .to(panelRef.current, { opacity: 0, y: -15, scale: 0.96, duration: 0.2, ease: 'power2.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.15 }, '-=0.1');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Filter available types dynamically from DB/covers
  const availableTypes = dynamicTypes.length > 0 ? dynamicTypes : ['Tous', 'Mémoire', 'Book'];

  // Filter available schools dynamically from DB/covers
  const availableSchools = dynamicSchools.length > 0 ? dynamicSchools : ['Toutes les écoles'];
  const filteredSchools = availableSchools.filter(school =>
    school === 'Toutes les écoles' || school.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  // Filter available fields dynamically from DB/covers
  const availableFields = dynamicFields.length > 0 
    ? dynamicFields 
    : ['Tous les domaines', ...allDomains];
  const filteredFields = availableFields.filter(field =>
    field === 'Tous les domaines' || field.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  // Filter available years dynamically from DB/covers
  const availableYears = dynamicYears.length > 0 
    ? dynamicYears 
    : ['Toutes', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];

  return (
    <div className="fixed inset-0 z-40 overflow-hidden font-sans flex justify-center sm:justify-end items-center sm:items-start p-3 sm:p-6 pointer-events-none">
      {/* Backdrop Overlay (Behind Navbar at z-30) */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm transition-opacity pointer-events-auto"
        onClick={handleClose}
      />

      {/* Filter Modal / Card Popover */}
      <div className="relative z-50 w-full sm:w-[562px] max-w-full sm:max-w-[calc(100vw-2rem)] pointer-events-auto my-auto sm:mt-20 md:mt-22 self-center sm:self-start">
        <div
          ref={panelRef}
          className="bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[16px] sm:rounded-[10px] p-5 sm:p-7 shadow-2xl text-[#111111] space-y-5 sm:space-y-6 max-h-[82vh] overflow-y-auto"
        >
          {/* Header Count */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm xs:text-base sm:text-lg font-bold text-[#111111] tracking-tight">
              {totalResults} document{totalResults > 1 ? 's' : ''} consultable{totalResults > 1 ? 's' : ''}
            </h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full border border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.25]" />
            </button>
          </div>

          {/* Section 1: Type de documents */}
          <div>
            <label className="text-sm font-medium text-[#111111] block mb-3">
              Type de documents
            </label>
            <div className="flex flex-wrap gap-2.5">
              {availableTypes.map((type) => {
                const isActive = filters.type === type;
                return (
                  <button
                    key={type}
                    onClick={() => setFilters((prev) => ({ ...prev, type }))}
                    className={`px-5 py-2.5 text-sm font-medium rounded-full border-[1.5px] border-[#111111] transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#111111] text-[#EEEEEE]'
                        : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Écoles */}
          <div className="relative" ref={schoolSearchContainerRef}>
            <label className="text-sm font-medium text-[#111111] block mb-3">
              Écoles
            </label>
            <div className="relative flex items-center">
              <div className="w-full bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 py-2.5 flex items-center shadow-xs">
                <Search className="w-4 h-4 text-[#111111] opacity-75 shrink-0 mr-2.5 stroke-[2.25]" />
                <input
                  type="text"
                  value={schoolSearch || (filters.school !== 'Toutes les écoles' ? filters.school : '')}
                  onChange={(e) => {
                    setSchoolSearch(e.target.value);
                    setShowSchoolDropdown(true);
                    if (!e.target.value) {
                      setFilters(prev => ({ ...prev, school: 'Toutes les écoles' }));
                    }
                  }}
                  onFocus={() => setShowSchoolDropdown(true)}
                  placeholder="Rechercher une école"
                  className="w-full bg-transparent text-sm text-[#111111] font-normal focus:outline-none placeholder:text-slate-500"
                />
                {filters.school !== 'Toutes les écoles' && (
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, school: 'Toutes les écoles' }));
                      setSchoolSearch('');
                    }}
                    className="text-[#111111] hover:opacity-60 shrink-0 ml-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.25]" />
                  </button>
                )}
              </div>
            </div>

            {/* School Dropdown Suggestions */}
            {showSchoolDropdown && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-2xl p-2 shadow-xl z-20 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, school: 'Toutes les écoles' }));
                    setSchoolSearch('');
                    setShowSchoolDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                    filters.school === 'Toutes les écoles' ? 'bg-[#111111] text-[#EEEEEE]' : 'hover:bg-[#E2E2E2] text-[#111111]'
                  }`}
                >
                  Toutes les écoles
                </button>
                {filteredSchools
                  .filter(s => s !== 'Toutes les écoles')
                  .map(school => (
                    <button
                      key={school}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, school }));
                        setSchoolSearch(school);
                        setShowSchoolDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                        filters.school === school ? 'bg-[#111111] text-[#EEEEEE]' : 'hover:bg-[#E2E2E2] text-[#111111]'
                      }`}
                    >
                      {school}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Section 3: Domaines */}
          <div className="relative" ref={fieldSearchContainerRef}>
            <label className="text-sm font-medium text-[#111111] block mb-3">
              Domaines
            </label>
            <div className="relative flex items-center">
              <div className="w-full bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 py-2.5 flex items-center shadow-xs">
                <Search className="w-4 h-4 text-[#111111] opacity-75 shrink-0 mr-2.5 stroke-[2.25]" />
                <input
                  type="text"
                  value={fieldSearch || (filters.field !== 'Tous les domaines' ? filters.field : '')}
                  onChange={(e) => {
                    setFieldSearch(e.target.value);
                    setShowFieldDropdown(true);
                    if (!e.target.value) {
                      setFilters(prev => ({ ...prev, field: 'Tous les domaines' }));
                    }
                  }}
                  onFocus={() => setShowFieldDropdown(true)}
                  placeholder="Rechercher un domaine"
                  className="w-full bg-transparent text-sm text-[#111111] font-normal focus:outline-none placeholder:text-slate-500"
                />
                {filters.field !== 'Tous les domaines' && (
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, field: 'Tous les domaines' }));
                      setFieldSearch('');
                    }}
                    className="text-[#111111] hover:opacity-60 shrink-0 ml-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.25]" />
                  </button>
                )}
              </div>
            </div>

            {/* Field Dropdown Suggestions */}
            {showFieldDropdown && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-2xl p-2 shadow-xl z-20 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, field: 'Tous les domaines' }));
                    setFieldSearch('');
                    setShowFieldDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                    filters.field === 'Tous les domaines' ? 'bg-[#111111] text-[#EEEEEE]' : 'hover:bg-[#E2E2E2] text-[#111111]'
                  }`}
                >
                  Tous les domaines
                </button>
                {filteredFields
                  .filter(f => f !== 'Tous les domaines')
                  .map(field => (
                    <button
                      key={field}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, field }));
                        setFieldSearch(field);
                        setShowFieldDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                        filters.field === field ? 'bg-[#111111] text-[#EEEEEE]' : 'hover:bg-[#E2E2E2] text-[#111111]'
                      }`}
                    >
                      {field}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Section 4: Années */}
          <div>
            <label className="text-sm font-medium text-[#111111] block mb-3">
              Années
            </label>
            <div className="flex flex-wrap gap-2.5">
              {availableYears.map((yr) => {
                const isActive = filters.year === yr;
                return (
                  <button
                    key={yr}
                    onClick={() => setFilters((prev) => ({ ...prev, year: yr }))}
                    className={`px-4 py-2 text-sm font-medium rounded-full border-[1.5px] border-[#111111] transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#111111] text-[#EEEEEE]'
                        : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Reset Action */}
          <div className="pt-2">
            <button
              onClick={() => {
                resetFilters();
                setSchoolSearch('');
                setFieldSearch('');
              }}
              className="px-5 py-2.5 border-[1.5px] border-[#111111] text-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] rounded-full text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.25]" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterDrawer;

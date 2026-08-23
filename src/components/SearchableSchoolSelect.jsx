import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Check, Search, MapPin } from 'lucide-react';
import schoolsData from '../utils/schools.json';

export function SearchableSchoolSelect({
  value,
  onChange,
  placeholder = "Rechercher une école, une ville..."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fonction de normalisation (retire les accents, tirets et passe en minuscules)
  const normalize = (str) => {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-_']/g, ' ')
      .trim();
  };

  // Liste unique enrichie avec nom et ville
  const formattedSchools = useMemo(() => {
    return schoolsData.map((s, index) => {
      // Si la ville n'est pas déjà dans le nom, on la mentionne
      const hasCityInName = s.city && s.name.toLowerCase().includes(s.city.toLowerCase());
      const displayName = s.city && !hasCityInName && s.city !== 'Autre'
        ? `${s.name} (${s.city})`
        : s.name;

      return {
        id: s.id || `${s.name}-${index}`,
        displayName,
        name: s.name,
        city: s.city || '',
        category: s.category || '',
        searchTarget: normalize(`${s.name} ${s.city} ${s.category}`)
      };
    });
  }, []);

  // Recherche multi-mots (ex: "ecv bord" ou "dn made lyon")
  const filteredSchools = useMemo(() => {
    if (!searchTerm.trim()) return formattedSchools;

    const tokens = normalize(searchTerm).split(/\s+/);
    return formattedSchools.filter((school) =>
      tokens.every((token) => school.searchTarget.includes(token))
    );
  }, [searchTerm, formattedSchools]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#111111]/50 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (value || '')}
          placeholder={placeholder}
          onFocus={() => {
            setSearchTerm('');
            setIsOpen(true);
          }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full pl-9 pr-9 text-xs sm:text-sm text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
        />
        <ChevronDown
          onClick={() => {
            if (!isOpen) {
              setSearchTerm('');
              setIsOpen(true);
              inputRef.current?.focus();
            } else {
              setIsOpen(false);
            }
          }}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 stroke-[2.25] text-[#111111] cursor-pointer transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-[100] bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[14px] shadow-2xl overflow-hidden p-1.5 max-h-56 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
          {filteredSchools.length > 0 ? (
            filteredSchools.map((sch) => {
              const isSelected = value === sch.displayName || value === sch.name;
              return (
                <button
                  key={sch.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(sch.displayName);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-[8px] text-xs sm:text-sm font-medium transition-colors flex items-center justify-between cursor-pointer group ${isSelected
                      ? 'bg-[#111111] text-[#EEEEEE]'
                      : 'text-[#111111] hover:bg-[#111111]/10'
                    }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate font-semibold">{sch.displayName}</span>
                    {sch.category && (
                      <span className={`text-[10px] truncate ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                        {sch.category}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />}
                </button>
              );
            })
          ) : (
            <div className="p-3 text-xs text-center text-slate-500 font-medium">
              Aucune école trouvée pour "{searchTerm}".
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchableSchoolSelect;
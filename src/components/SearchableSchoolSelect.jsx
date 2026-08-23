import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export function SearchableSchoolSelect({ value, onChange, options, placeholder = "Rechercher ou choisir..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

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

  const normalizeText = (str) => {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const filteredOptions = options.filter(opt =>
    normalizeText(opt).includes(normalizeText(searchTerm))
  );

  const displayValue = isOpen ? searchTerm : (value || '');

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#111111]/50 pointer-events-none" />
        <input
          type="text"
          value={displayValue}
          onFocus={() => {
            setSearchTerm('');
            setIsOpen(true);
          }}
          onChange={(e) => {
            const newVal = e.target.value;
            setSearchTerm(newVal);
            onChange(newVal);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full pl-9 pr-9 text-xs sm:text-sm text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
        />
        <ChevronDown
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 stroke-[2.25] text-[#111111] pointer-events-none transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-[100] bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[14px] shadow-2xl overflow-hidden p-1.5 max-h-48 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((sch) => {
              const isSelected = sch === value;
              return (
                <button
                  key={sch}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(sch);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-[8px] text-xs sm:text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#111111] text-[#EEEEEE]'
                      : 'text-[#111111] hover:bg-[#111111]/10'
                  }`}
                >
                  <span className="truncate pr-2">{sch}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />}
                </button>
              );
            })
          ) : (
            <div className="p-3 text-xs text-center text-slate-500 font-medium">
              Aucune école prédéfinie trouvée.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchableSchoolSelect;

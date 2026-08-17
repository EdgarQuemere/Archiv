import React, { useEffect, useRef } from 'react';
import { ExternalLink, BookOpen, User, MapPin } from 'lucide-react';
import gsap from 'gsap';

export function ListView({ items, onCardClick }) {
  const gridRef = useRef(null);

  useEffect(() => {
    if (gridRef.current && items && items.length > 0) {
      const cards = gridRef.current.children;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.04,
          ease: 'power2.out'
        }
      );
    }
  }, [items]);

  if (!items || items.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#EEEEEE] text-[#111111]">
        <BookOpen className="w-12 h-12 text-[#111111] mb-3 opacity-60 animate-bounce" />
        <h3 className="text-lg font-bold text-[#111111]">Aucun résultat trouvé</h3>
        <p className="text-xs text-slate-600 max-w-sm mt-1">
          Essayez de modifier vos critères de recherche ou réinitialisez les filtres.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto pt-24 pb-16 px-6 sm:px-12 bg-[#EEEEEE] text-[#111111] transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111111] tracking-tight">
            Index des Mémoires & Portfolios
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            {items.length} travail{items.length > 1 ? 's' : ''} disponible{items.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Responsive Grid with Sharp Edges */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onCardClick(item)}
              className="bg-white rounded-none border-2 border-[#111111] shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group transform-gpu"
            >
              {/* Cover Aspect Container */}
              <div className="relative bg-[#111111] overflow-hidden flex items-center justify-center p-2 rounded-none">
                <img
                  src={item.coverUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-auto max-h-72 object-contain rounded-none"
                />
              </div>

              {/* Body Metadata */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-white text-[#111111] rounded-none">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold mb-1 text-[#111111]">
                    <MapPin className="w-3 h-3" />
                    <span>{item.school}</span>
                    <span>•</span>
                    <span>{item.year}</span>
                  </div>

                  <h2 className="text-base font-bold text-[#111111] leading-snug line-clamp-2 mb-2 group-hover:opacity-75 transition-opacity">
                    {item.title}
                  </h2>

                  <p className="text-xs text-slate-600 font-medium mb-3 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-500" />
                    <span>{item.author}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-[#111111]/20 flex items-center justify-between">
                  <span className="text-[10px] bg-[#EEEEEE] border border-[#111111] text-[#111111] px-2 py-0.5 rounded-none font-mono">
                    {item.field}
                  </span>

                  <span className="text-xs font-semibold text-[#111111] flex items-center gap-1">
                    Fiche <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

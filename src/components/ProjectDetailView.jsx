import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, ZoomIn, ZoomOut } from 'lucide-react';

export function ProjectDetailView({ item, onClose }) {
  const [showInfo, setShowInfo] = useState(true);
  const isPortrait = item?.orientation === 'portrait' || (item?.aspectRatio && item?.aspectRatio > 1.1);

  // Initial zoom: 48% for portrait so full page fits comfortably inside viewport height, 80% for landscape
  const [zoomLevel, setZoomLevel] = useState(isPortrait ? 48 : 80);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = item?.pdfPages || (isPortrait ? 12 : 14);
  const pagesDir = item?.pagesDir || (isPortrait ? '/pdf/portrait_pages' : '/pdf/landscape_pages');
  const pdfUrl = item?.pdfUrl || (isPortrait ? '/pdf/Book_Portrait.pdf' : '/pdf/Book_Landscape.pdf');

  const scrollContainerRef = useRef(null);
  const pageRefs = useRef([]);

  // Initialize refs for scroll target tracking
  if (pageRefs.current.length !== totalPages) {
    pageRefs.current = Array(totalPages).fill(0).map((_, i) => pageRefs.current[i] || React.createRef());
  }

  // Scroll listener to update page indicator dynamically
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const viewportCenter = el.scrollTop + el.clientHeight / 2;
      let closestPage = 1;
      let minDistance = Infinity;

      pageRefs.current.forEach((ref, idx) => {
        if (ref && ref.current) {
          const pageTop = ref.current.offsetTop;
          const pageCenter = pageTop + ref.current.clientHeight / 2;
          const dist = Math.abs(pageCenter - viewportCenter);
          if (dist < minDistance) {
            minDistance = dist;
            closestPage = idx + 1;
          }
        }
      });

      setCurrentPage(closestPage);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [totalPages]);

  // Page Navigation Handlers
  const scrollToPage = (pageIndex) => {
    const targetRef = pageRefs.current[pageIndex - 1];
    if (targetRef && targetRef.current && scrollContainerRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageIndex);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      scrollToPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
    }
  };

  // Zoom Handlers
  const handleZoomIn = () => {
    setZoomLevel((z) => Math.min(180, z + 15));
  };

  const handleZoomOut = () => {
    setZoomLevel((z) => Math.max(30, z - 15));
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#EEEEEE] text-[#111111] flex flex-col font-sans overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* Top Floating Close Button (DA: Solid #111111 Block, NO stroke) */}
      <div className="fixed top-6 right-6 z-50 pointer-events-auto">
        <button
          onClick={onClose}
          title="Fermer"
          className="w-12 h-12 bg-[#111111] text-[#EEEEEE] flex items-center justify-center rounded-none hover:opacity-80 transition-opacity cursor-pointer border-0 shadow-2xl"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Main Container Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex bg-[#EEEEEE]">
        
        {/* Left Floating Info Overlay Card (Solid #111111 Card, NO stroke) */}
        {showInfo && (
          <div className="fixed top-6 left-6 z-40 w-80 sm:w-96 bg-[#111111] p-6 text-[#EEEEEE] rounded-none shadow-2xl animate-in fade-in slide-in-from-left-4 duration-200 pointer-events-auto border-0">
            {/* Card Header & Close */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold leading-tight text-[#EEEEEE]">
                  {item.title}
                </h2>
                <p className="text-sm font-medium text-slate-300 mt-1">
                  par {item.author}
                </p>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {item.school} — {item.year} • {item.field || item.type}
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-white/10 text-slate-300 rounded-none">
                  Format {isPortrait ? 'Portrait' : 'Paysage'}
                </span>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="text-slate-400 hover:text-white p-1 rounded-none transition-opacity shrink-0 cursor-pointer"
                title="Masquer les infos"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Abstract Text */}
            {item.abstract && (
              <div className="pt-3 border-t border-white/20">
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {item.abstract}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Toggle Info Button (if hidden) */}
        {!showInfo && (
          <div className="fixed top-6 left-6 z-40 pointer-events-auto">
            <button
              onClick={() => setShowInfo(true)}
              className="h-12 px-5 bg-[#111111] text-[#EEEEEE] text-xs font-mono font-bold flex items-center justify-center rounded-none hover:opacity-80 transition-opacity cursor-pointer border-0 shadow-2xl"
            >
              <span>Infos</span>
            </button>
          </div>
        )}

        {/* Document Reader View Area */}
        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-y-auto overflow-x-auto bg-[#EEEEEE] flex flex-col items-center py-12 px-4 space-y-8 scroll-smooth"
        >
          {Array.from({ length: totalPages }, (_, idx) => {
            const pageNum = idx + 1;
            const imgSrc = `${pagesDir}/page_${pageNum}.jpg`;

            return (
              <div
                key={pageNum}
                ref={pageRefs.current[idx]}
                className="transition-all duration-200 ease-out shadow-2xl bg-white flex items-center justify-center shrink-0 border-0"
                style={{
                  width: isPortrait ? `${zoomLevel * 10}px` : `${zoomLevel * 14}px`,
                  maxWidth: '96vw',
                }}
              >
                <img
                  src={imgSrc}
                  alt={`${item.title} - Page ${pageNum}`}
                  className="w-full h-auto block select-none pointer-events-none"
                  loading={pageNum <= 3 ? 'eager' : 'lazy'}
                />
              </div>
            );
          })}
        </div>

        {/* Bottom Right Floating Control Bar (DA: Solid #111111 & #EEEEEE, NO stroke) */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center pointer-events-auto font-sans">
          <div className="h-12 bg-[#EEEEEE] flex items-center rounded-none overflow-hidden p-0 shadow-2xl border-0">
            {/* Zoom Out (-) */}
            <button
              onClick={handleZoomOut}
              title="Dézoomer (-)"
              className="w-12 h-full flex items-center justify-center bg-[#111111] text-[#EEEEEE] hover:opacity-85 transition-opacity rounded-none cursor-pointer border-0"
            >
              <ZoomOut className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#EEEEEE]" />

            {/* Zoom In (+) */}
            <button
              onClick={handleZoomIn}
              title="Zoomer (+)"
              className="w-12 h-full flex items-center justify-center bg-[#111111] text-[#EEEEEE] hover:opacity-85 transition-opacity rounded-none cursor-pointer border-0"
            >
              <ZoomIn className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#EEEEEE]" />

            {/* Page Up (↑) */}
            <button
              onClick={handlePrevPage}
              title="Page précédente"
              className="w-12 h-full flex items-center justify-center bg-[#111111] text-[#EEEEEE] hover:opacity-85 transition-opacity rounded-none cursor-pointer border-0"
            >
              <ChevronUp className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#EEEEEE]" />

            {/* Page Down (↓) */}
            <button
              onClick={handleNextPage}
              title="Page suivante"
              className="w-12 h-full flex items-center justify-center bg-[#111111] text-[#EEEEEE] hover:opacity-85 transition-opacity rounded-none cursor-pointer border-0"
            >
              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#EEEEEE]" />

            {/* Page Counter Display */}
            <div className="h-full px-4 flex items-center justify-center bg-[#EEEEEE] text-[#111111] text-xs font-mono font-bold select-none min-w-[95px] border-0">
              {currentPage} sur {totalPages}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default ProjectDetailView;

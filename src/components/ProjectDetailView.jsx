import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { X, ChevronUp, ChevronDown, ZoomIn, ZoomOut, Columns, Square } from 'lucide-react';

export function ProjectDetailView({ item, onClose }) {
  const [showInfo, setShowInfo] = useState(true);
  const isPortrait = item?.orientation === 'portrait' || (item?.aspectRatio && item?.aspectRatio > 1.1);

  // Initial zoom: 48% for portrait so full page fits comfortably inside viewport height, 80% for landscape
  const [zoomLevel, setZoomLevel] = useState(isPortrait ? 48 : 80);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' (1 page) or 'double' (2 pages side-by-side)

  const totalPages = item?.pdfPages || (isPortrait ? 12 : 14);
  const pagesDir = item?.pagesDir || (isPortrait ? '/pdf/portrait_pages' : '/pdf/landscape_pages');

  const scrollContainerRef = useRef(null);
  const pageRefs = useRef([]);
  const isNavigatingRef = useRef(false);
  const navTimerRef = useRef(null);
  const isInitialMount = useRef(true);

  const focalRatioRef = useRef(0.5);

  // Initialize refs for scroll target tracking
  if (pageRefs.current.length !== totalPages) {
    pageRefs.current = Array(totalPages).fill(0).map((_, i) => pageRefs.current[i] || React.createRef());
  }

  // Scroll listener to update page indicator and track exact focalRatio dynamically
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (isNavigatingRef.current) return; // Prevent overwriting during smooth scroll or zoom adjustment

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

      // Track exact focal ratio of current viewport center relative to active page
      const activeElem = pageRefs.current[closestPage - 1]?.current;
      if (activeElem && activeElem.clientHeight > 0) {
        focalRatioRef.current = (viewportCenter - activeElem.offsetTop) / activeElem.clientHeight;
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [totalPages]);

  // Synchronously lock zoom focus on exact focal spot when zoomLevel or viewMode changes
  useLayoutEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const targetRef = pageRefs.current[currentPage - 1];
    const container = scrollContainerRef.current;
    if (targetRef && targetRef.current && container) {
      isNavigatingRef.current = true;
      const targetElem = targetRef.current;

      const ratio = focalRatioRef.current || 0.5;
      const newFocalY = targetElem.offsetTop + ratio * targetElem.clientHeight;
      const newScrollTop = newFocalY - container.clientHeight / 2;

      container.scrollTop = Math.max(0, newScrollTop);

      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => {
        isNavigatingRef.current = false;
      }, 200);
    }
  }, [zoomLevel, viewMode]);

  // Page Navigation Handlers
  const scrollToPage = (pageIndex) => {
    const targetRef = pageRefs.current[pageIndex - 1];
    if (targetRef && targetRef.current && scrollContainerRef.current) {
      isNavigatingRef.current = true;
      focalRatioRef.current = 0.5; // Reset focal ratio to center for fresh page navigation
      setCurrentPage(pageIndex);
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });

      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => {
        isNavigatingRef.current = false;
      }, 450);
    }
  };

  const handleNextPage = () => {
    const step = viewMode === 'double' ? 2 : 1;
    if (currentPage < totalPages) {
      const nextPage = Math.min(totalPages, currentPage + step);
      scrollToPage(nextPage);
    }
  };

  const handlePrevPage = () => {
    const step = viewMode === 'double' ? 2 : 1;
    if (currentPage > 1) {
      const prevPage = Math.max(1, currentPage - step);
      scrollToPage(prevPage);
    }
  };

  // Zoom Handlers
  const handleZoomIn = () => {
    setZoomLevel((z) => Math.min(220, z + 15));
  };

  const handleZoomOut = () => {
    setZoomLevel((z) => Math.max(25, z - 15));
  };

  // Group pages for Double Page View Mode (spreads: [1], [2, 3], [4, 5]...)
  const getSpreads = () => {
    if (viewMode === 'single') {
      return Array.from({ length: totalPages }, (_, i) => [i + 1]);
    }
    const spreads = [[1]];
    for (let i = 2; i <= totalPages; i += 2) {
      if (i + 1 <= totalPages) {
        spreads.push([i, i + 1]);
      } else {
        spreads.push([i]);
      }
    }
    return spreads;
  };

  const spreads = getSpreads();

  // Helper for page counter display text
  const getPageCounterText = () => {
    if (viewMode === 'double' && currentPage > 1) {
      const firstPage = currentPage % 2 === 0 ? currentPage : currentPage - 1;
      const secondPage = Math.min(totalPages, firstPage + 1);
      return `${firstPage}-${secondPage} sur ${totalPages}`;
    }
    return `${currentPage} sur ${totalPages}`;
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
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-white/10 text-slate-300 rounded-none">
                    Format {isPortrait ? 'Portrait' : 'Paysage'}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-white/10 text-slate-300 rounded-none">
                    {viewMode === 'double' ? 'Double Page' : 'Page Simple'}
                  </span>
                </div>
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

        {/* Document Reader View Area (Supports Vertical & Horizontal Scrolling / Panning) */}
        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-y-auto overflow-x-auto bg-[#EEEEEE] flex flex-col items-center py-12 px-8 space-y-8 scroll-smooth"
        >
          {spreads.map((pages, spreadIdx) => {
            return (
              <div
                key={spreadIdx}
                className={`flex flex-row items-center justify-center ${viewMode === 'double' ? 'gap-0 shadow-2xl' : 'gap-4'} shrink-0`}
              >
                {pages.map((pageNum) => (
                  <div
                    key={pageNum}
                    ref={pageRefs.current[pageNum - 1]}
                    className={`${viewMode === 'double' ? 'shadow-none' : 'shadow-2xl'} bg-white flex items-center justify-center shrink-0 border-0`}
                    style={{
                      width: viewMode === 'double'
                        ? (isPortrait ? `${zoomLevel * 6.5}px` : `${zoomLevel * 8.5}px`)
                        : (isPortrait ? `${zoomLevel * 10}px` : `${zoomLevel * 14}px`),
                    }}
                  >
                    <img
                      src={`${pagesDir}/page_${pageNum}.jpg`}
                      alt={`${item.title} - Page ${pageNum}`}
                      className="w-full h-auto block select-none pointer-events-none"
                      loading={pageNum <= 4 ? 'eager' : 'lazy'}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Bottom Right Floating Control Bar (DA: Solid #111111 & #EEEEEE, NO stroke) */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center pointer-events-auto font-sans">
          <div className="h-12 bg-[#EEEEEE] flex items-center rounded-none overflow-hidden p-0 shadow-2xl border-0">
            
            {/* View Mode Toggle: 1 Page vs 2 Pages */}
            <button
              onClick={() => setViewMode((m) => (m === 'single' ? 'double' : 'single'))}
              title={viewMode === 'single' ? 'Passer en affichage Double Page' : 'Passer en affichage Page Simple'}
              className="h-full px-3.5 flex items-center gap-2 bg-[#111111] text-[#EEEEEE] text-xs font-mono font-bold hover:opacity-85 transition-opacity rounded-none cursor-pointer border-0 shrink-0"
            >
              {viewMode === 'single' ? (
                <>
                  <Columns className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">2 Pages</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">1 Page</span>
                </>
              )}
            </button>

            <div className="w-[1.5px] h-full bg-[#EEEEEE]" />

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
            <div className="h-full px-4 flex items-center justify-center bg-[#EEEEEE] text-[#111111] text-xs font-mono font-bold select-none min-w-[105px] border-0">
              {getPageCounterText()}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default ProjectDetailView;

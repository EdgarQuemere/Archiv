import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { X, ChevronUp, ChevronDown, ZoomIn, ZoomOut, Columns, Square, Download } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Initialize PDF.js worker using reliable Vite ?url import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export function ProjectDetailView({ item, onClose }) {
  const [showInfo, setShowInfo] = useState(true);
  const isPortrait = item?.orientation === 'portrait' || (item?.aspectRatio && item?.aspectRatio > 1.1);

  // Initial zoom: 48% for portrait so full page fits comfortably inside viewport height, 80% for landscape
  const [zoomLevel, setZoomLevel] = useState(isPortrait ? 48 : 80);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' (1 page) or 'double' (2 pages side-by-side)
  const [numPages, setNumPages] = useState(0);

  const scrollContainerRef = useRef(null);
  const pageRefs = useRef([]);
  const isNavigatingRef = useRef(false);
  const navTimerRef = useRef(null);
  const isInitialMount = useRef(true);

  const focalRatioRef = useRef(0.5);

  // Initialize refs for scroll target tracking dynamically
  if (pageRefs.current.length !== numPages) {
    pageRefs.current = Array(numPages).fill(0).map((_, i) => pageRefs.current[i] || React.createRef());
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
  }, [numPages]);

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
    if (currentPage < numPages) {
      const nextPage = Math.min(numPages, currentPage + step);
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
      return Array.from({ length: numPages }, (_, i) => [i + 1]);
    }
    const spreads = [[1]];
    for (let i = 2; i <= numPages; i += 2) {
      if (i + 1 <= numPages) {
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
      const secondPage = Math.min(numPages, firstPage + 1);
      return `${firstPage}-${secondPage} sur ${numPages}`;
    }
    return `${currentPage} sur ${numPages}`;
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

            {/* Download PDF Button */}
            <div className="mt-4 pt-3 border-t border-white/20">
              <a
                href={item.pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 bg-[#EEEEEE] hover:bg-white text-[#111111] text-xs font-mono font-bold flex items-center justify-center gap-2 rounded-none transition-colors cursor-pointer border-0 shadow-lg"
                title={`Télécharger le fichier PDF (${item.pdfSize})`}
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Télécharger le PDF ({item.pdfSize})</span>
              </a>
            </div>
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
        <Document
          file={item.pdfUrl}
          options={{
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
          }}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            console.log("PDF chargé avec succès, nombre de pages:", numPages);
          }}
          onLoadError={(error) => {
            console.error("Erreur de chargement du PDF:", error);
            alert("Erreur de chargement du PDF. Regarde la console (F12). C'est probablement un problème de CORS avec MinIO.");
          }}
          className="w-full h-full overflow-hidden"
          loading={
            <div className="flex items-center justify-center h-full w-full bg-[#EEEEEE]">
              <span className="text-black font-mono text-sm font-bold">Chargement du PDF...</span>
            </div>
          }
        >
          <div
            ref={scrollContainerRef}
            className="w-full h-full overflow-y-auto overflow-x-auto bg-[#EEEEEE] flex flex-col items-center py-12 px-8 space-y-8"
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
                    >
                      <Page
                        pageNumber={pageNum}
                        width={
                          viewMode === 'double'
                            ? (isPortrait ? zoomLevel * 6.5 : zoomLevel * 8.5)
                            : (isPortrait ? zoomLevel * 10 : zoomLevel * 14)
                        }
                        renderTextLayer={false}
                        renderAnnotationLayer={true}
                        devicePixelRatio={Math.max(window.devicePixelRatio || 1, 2)}
                        className="block select-none pointer-events-none"
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Document>

        {/* Bottom Floating Control Bar (Centered on mobile, Right-aligned on desktop) */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 sm:bottom-6 z-50 flex items-center pointer-events-auto font-sans max-w-[95vw] sm:max-w-none">
          <div className="h-10 sm:h-12 border-2 border-[#111111] bg-[#EEEEEE] flex items-center rounded-none overflow-hidden p-0 shadow-2xl">

            {/* View Mode Toggle: 1 Page vs 2 Pages */}
            <button
              onClick={() => setViewMode((m) => (m === 'single' ? 'double' : 'single'))}
              title={viewMode === 'single' ? 'Passer en affichage Double Page' : 'Passer en affichage Page Simple'}
              className="h-full px-2.5 sm:px-3.5 flex items-center gap-1.5 sm:gap-2 bg-[#111111] text-[#EEEEEE] text-[11px] sm:text-xs font-mono font-bold hover:opacity-85 transition-opacity rounded-none cursor-pointer border-0 shrink-0"
            >
              {viewMode === 'single' ? (
                <>
                  <Columns className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">2 Pages</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">1 Page</span>
                </>
              )}
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            {/* Zoom Out (-) */}
            <button
              onClick={handleZoomOut}
              title="Dézoomer (-)"
              className="w-9 sm:w-12 h-full flex items-center justify-center bg-[#111111] text-[#EEEEEE] hover:opacity-85 transition-opacity rounded-none cursor-pointer border-0"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            {/* Zoom In (+) */}
            <button
              onClick={handleZoomIn}
              title="Zoomer (+)"
              className="w-9 sm:w-12 h-full flex items-center justify-center bg-[#111111] text-[#EEEEEE] hover:opacity-85 transition-opacity rounded-none cursor-pointer border-0"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            {/* Page Up (↑) */}
            <button
              onClick={handlePrevPage}
              title="Page précédente"
              className="w-9 sm:w-12 h-full flex items-center justify-center bg-[#111111] text-[#EEEEEE] hover:opacity-85 transition-opacity rounded-none cursor-pointer border-0"
            >
              <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            {/* Page Down (↓) */}
            <button
              onClick={handleNextPage}
              title="Page suivante"
              className="w-9 sm:w-12 h-full flex items-center justify-center bg-[#111111] text-[#EEEEEE] hover:opacity-85 transition-opacity rounded-none cursor-pointer border-0"
            >
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            {/* Page Counter Display */}
            <div className="h-full px-2.5 sm:px-4 flex items-center justify-center bg-[#EEEEEE] text-[#111111] text-[11px] sm:text-xs font-mono font-bold select-none min-w-[85px] sm:min-w-[105px] border-0">
              {getPageCounterText()}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default ProjectDetailView;

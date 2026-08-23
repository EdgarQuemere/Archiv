import { getUserDisplayName } from '../utils/userUtils';
import React, { useState, useRef, useEffect, useLayoutEffect, useContext } from 'react';
import { X, ChevronUp, ChevronDown, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Info, User, Columns, Download, Bookmark } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import SEO from './SEO';
import api from '../api/axios';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerPort = new Worker('/pdf.worker.js', { type: 'module' });

const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`,
};

// User provided SVGs
const IconUserProfile = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z" />
  </svg>
);

const PageSingleSVG = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Z"></path>
  </svg>
);

const PageDoubleSVG = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM120,208H48V48h72Zm88,0H136V48h72Z"></path>
  </svg>
);

const DownloadSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 256 256">
    <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"></path>
  </svg>
);

const BookmarkSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 256 256">
    <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Zm0,177.57-51.77-32.35a8,8,0,0,0-8.48,0L72,209.57V48H184Z"></path>
  </svg>
);

const IconAddDocument = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M216.49,79.51l-56-56A12,12,0,0,0,152,20H56A20,20,0,0,0,36,40V216a20,20,0,0,0,20,20H200a20,20,0,0,0,20-20V88A12,12,0,0,0,216.49,79.51ZM160,57l23,23H160ZM60,212V44h76V92a12,12,0,0,0,12,12h48V212Zm104-60a12,12,0,0,1-12,12H140v12a12,12,0,0,1-24,0V164H104a12,12,0,0,1,0-24h12V128a12,12,0,0,1,24,0v12h12A12,12,0,0,1,164,152Z" />
  </svg>
);

export function ProjectDetailView({ item, onClose, onOpenProfile, onOpenLogin, onOpenInfo, onOpenSubmit, onOpenPublicProfile }) {
  const { user, setUser } = useContext(AuthContext);
  const [showInfo, setShowInfo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isPortrait = item?.orientation === 'portrait' || (item?.aspectRatio && item?.aspectRatio > 1.1);

  const isSaved = user?.savedProjects?.some(sp => sp.projectId === item?.id);

  const handleDownload = async () => {
    try {
      if (!item.allowDownload) return alert("Le téléchargement n'est pas autorisé par l'auteur.");
      const res = await api.post(`/projects/${item.id}/download`);
      if (res.data && res.data.pdfUrl) {
        window.open(res.data.pdfUrl, '_blank');
      }
    } catch (error) {
      console.error("Erreur de téléchargement", error);
      alert(error.response?.data?.error || "Erreur lors du téléchargement.");
    }
  };

  const toggleSave = async () => {
    if (!user) return alert("Vous devez être connecté pour enregistrer un projet.");
    try {
      setIsSaving(true);
      if (isSaved) {
        await api.delete(`/projects/${item.id}/save`);
        setUser(prev => ({
          ...prev,
          savedProjects: prev.savedProjects.filter(sp => sp.projectId !== item.id)
        }));
      } else {
        await api.post(`/projects/${item.id}/save`);
        setUser(prev => ({
          ...prev,
          savedProjects: [...(prev.savedProjects || []), { projectId: item.id, project: item }]
        }));
      }
    } catch (err) {
      console.error("Erreur lors de l'enregistrement", err);
      alert("Impossible de modifier l'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  }; const [zoomLevel, setZoomLevel] = useState(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isMobile) {
      return isPortrait ? 24 : 28;
    }
    return isPortrait ? 36 : 50;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'double'
  const [numPages, setNumPages] = useState(0);

  const scrollContainerRef = useRef(null);
  const pageRefs = useRef([]);
  const isNavigatingRef = useRef(false);
  const navTimerRef = useRef(null);
  const isInitialMount = useRef(true);

  const focalRatioRef = useRef(0.5);

  if (pageRefs.current.length !== numPages) {
    pageRefs.current = Array(numPages).fill(0).map((_, i) => pageRefs.current[i] || React.createRef());
  }

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (isNavigatingRef.current) return;

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

      const activeElem = pageRefs.current[closestPage - 1]?.current;
      if (activeElem && activeElem.clientHeight > 0) {
        focalRatioRef.current = (viewportCenter - activeElem.offsetTop) / activeElem.clientHeight;
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [numPages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const content = container?.firstElementChild;
    if (!container || !content) return;

    const observer = new ResizeObserver(() => {
      if (isNavigatingRef.current) return;

      const targetRef = pageRefs.current[currentPage - 1];
      if (targetRef && targetRef.current) {
        const activeElem = targetRef.current;
        const targetScrollTop = activeElem.offsetTop + focalRatioRef.current * activeElem.clientHeight - container.clientHeight / 2;
        container.scrollTop = targetScrollTop;
      }
    });

    observer.observe(content);
    return () => observer.disconnect();
  }, [currentPage]);

  const scrollToPage = (pageNumber) => {
    isNavigatingRef.current = true;
    setCurrentPage(pageNumber);

    if (navTimerRef.current) clearTimeout(navTimerRef.current);

    const targetRef = pageRefs.current[pageNumber - 1];
    const container = scrollContainerRef.current;

    if (targetRef && targetRef.current && container) {
      const pageTop = targetRef.current.offsetTop;
      const pageHeight = targetRef.current.clientHeight;
      const containerHeight = container.clientHeight;
      const targetScroll = pageTop - (containerHeight / 2 - pageHeight / 2);

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    }

    navTimerRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
    }, 600);
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

  const handleZoomIn = () => {
    setZoomLevel((z) => Math.min(220, Math.round(z * 1.25)));
  };

  const handleZoomOut = () => {
    setZoomLevel((z) => Math.max(15, Math.round(z / 1.25)));
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setZoomLevel((prev) => Math.max(25, Math.min(220, prev * factor)));
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

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

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-[#EEEEEE] text-[#111111] flex flex-col font-sans overflow-hidden animate-in fade-in duration-200">
      <SEO
        title={item.title}
        description={`Projet par ${getUserDisplayName(item.author)} - ${item.school}`}
        image={item.coverUrl}
      />

      {/* TOP LEFT BUTTONS */}
      <div className="fixed top-3 left-3 sm:top-6 sm:left-6 z-50 flex items-center gap-1.5 xs:gap-2.5 sm:gap-3.5 pointer-events-auto">
        <picture onClick={onClose} className="cursor-pointer mr-0.5 shrink-0 flex items-center">
          <source media="(max-width: 639px)" srcSet="/archiv_logo_condesed.webp" />
          <img
            src="/artchiv-logo.webp"
            alt="Artchiv"
            className="h-9 xs:h-10 sm:h-13 md:h-14 w-auto object-contain block"
          />
        </picture>
        <button
          onClick={() => {
            onClose?.();
            onOpenInfo?.();
          }}
          title="Informations"
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
        </button>

        <button
          onClick={() => {
            onClose?.();
            if (user) {
              onOpenProfile?.();
            } else {
              onOpenLogin?.();
            }
          }}
          title={user ? user.name || 'Profil' : 'Se connecter'}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
        >
          <IconUserProfile className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          onClick={() => {
            onClose?.();
            onOpenSubmit?.();
          }}
          title="Ajouter mon travail"
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
        >
          <IconAddDocument className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* TOP RIGHT CLOSE BUTTON */}
      <div className="fixed top-3 right-3 sm:top-6 sm:right-6 z-50 pointer-events-auto">
        <button
          onClick={onClose}
          title="Fermer la vue produit"
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
        </button>
      </div>

      {/* MAIN CONTAINER AREA */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex bg-[#EEEEEE]">

        {/* BOTTOM LEFT PROJECT INFORMATION PANEL */}
        <div className="fixed bottom-3 left-3 sm:bottom-6 sm:left-6 z-40 max-w-[calc(100vw-1.5rem)] sm:max-w-md pointer-events-auto font-sans text-[#111111]">
          {showInfo && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 mb-3 bg-[#EEEEEE] sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none p-4 sm:p-0 rounded-[16px] sm:rounded-none border-[1.5px] border-[#111111] sm:border-0 shadow-lg sm:shadow-none">
              <h1 className="text-base sm:text-2xl font-bold leading-tight mb-1 text-[#111111]">
                {item.title}
              </h1>

              <p className="text-xs sm:text-base font-medium mb-1 sm:mb-2 text-[#111111]">
                par <span onClick={() => { onClose?.(); onOpenPublicProfile && onOpenPublicProfile(item.userId); }} className="underline cursor-pointer hover:opacity-80 font-bold">{item.author}</span>
              </p>

              <p className="text-[11px] sm:text-base font-mono text-slate-600 mb-2 sm:mb-3">
                {item.school} — {item.year} • {item.type || item.field}
              </p>

              {(item.description || item.abstract) && (
                <p className="text-xs sm:text-base text-slate-700 leading-relaxed max-w-xs sm:max-w-md line-clamp-4 sm:line-clamp-none">
                  {item.description || item.abstract}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Toggle Info Button (< / >) */}
            <button
              onClick={() => setShowInfo((prev) => !prev)}
              title={showInfo ? 'Masquer les informations' : 'Afficher les informations'}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] flex items-center justify-center transition-colors cursor-pointer shadow-sm shrink-0"
            >
              {showInfo ? (
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
              )}
            </button>

            {/* Download Button */}
            {item.allowDownload && (
              <button
                onClick={handleDownload}
                className="h-9 sm:h-11 px-3.5 sm:px-6 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] text-xs sm:text-base font-medium flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer shadow-sm shrink-0"
                title={`Télécharger le PDF`}
              >
                <span>Télécharger {item.pdfSize ? `(${item.pdfSize})` : ''}</span>
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
              </button>
            )}

            {/* Bookmark / Save Button */}
            <button
              onClick={toggleSave}
              disabled={isSaving}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] flex items-center justify-center transition-colors cursor-pointer shadow-sm shrink-0 ${isSaved
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isSaved ? "Retirer des enregistrements" : "Enregistrer"}
            >
              <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25] ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* DOCUMENT READER VIEW AREA */}
        <Document
          file={item.pdfUrl}
          options={pdfOptions}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
          }}
          onLoadError={(error) => {
            console.error("Erreur de chargement du PDF:", error);
          }}
          className="w-full h-full overflow-hidden"
          loading={
            <div className="flex items-center justify-center h-full w-full bg-[#EEEEEE]">
              <span className="text-[#111111] font-mono text-xs sm:text-sm font-bold">Chargement du PDF...</span>
            </div>
          }
        >
          <div
            ref={scrollContainerRef}
            className="w-full h-full overflow-y-auto overflow-x-auto bg-[#EEEEEE] py-20 sm:py-28 pb-32 px-3 sm:px-8"
          >
            <div className="w-max min-w-full mx-auto flex flex-col items-center space-y-6 sm:space-y-8">
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
                              ? (isPortrait ? zoomLevel * 6.5 : zoomLevel * 7.5)
                              : (isPortrait ? zoomLevel * 9 : zoomLevel * 11)
                          }
                          renderTextLayer={false}
                          renderAnnotationLayer={true}
                          devicePixelRatio={Math.max(window.devicePixelRatio || 1, 2)}
                          className="block  pointer-events-none"
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </Document>

        {/* BOTTOM RIGHT FLOATING HUD CONTROLS BAR (3 Segmented Pill Containers stacked vertically on mobile) */}
        <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end sm:flex-row sm:items-center gap-2 sm:gap-3.5 pointer-events-auto font-sans max-w-full">

          {/* Segment 1: View Mode Switcher (Single / Double) */}
          <div className="flex h-9 sm:h-11 border-[1.5px] border-[#111111] bg-[#EEEEEE] items-center rounded-full overflow-hidden p-0 shadow-sm shrink-0">
            <button
              onClick={() => setViewMode('single')}
              title="Page Simple"
              className={`w-8 xs:w-9 sm:w-11 h-full flex items-center justify-center transition-colors cursor-pointer ${viewMode === 'single'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                }`}
            >
              <PageSingleSVG className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            <button
              onClick={() => setViewMode('double')}
              title="Double Page"
              className={`w-8 xs:w-9 sm:w-11 h-full flex items-center justify-center transition-colors cursor-pointer ${viewMode === 'double'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                }`}
            >
              <PageDoubleSVG className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Segment 2: Zoom Controls (- / +) */}
          <div className="h-9 sm:h-11 border-[1.5px] border-[#111111] bg-[#EEEEEE] flex items-center rounded-full overflow-hidden p-0 shadow-sm shrink-0">
            <button
              onClick={handleZoomOut}
              title="Dézoomer (-)"
              className="w-8 xs:w-9 sm:w-11 h-full flex items-center justify-center bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            <button
              onClick={handleZoomIn}
              title="Zoomer (+)"
              className="w-8 xs:w-9 sm:w-11 h-full flex items-center justify-center bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
            </button>
          </div>

          {/* Segment 3: Page Navigation (^ / v) & Counter (1 sur 12) */}
          <div className="h-9 sm:h-11 border-[1.5px] border-[#111111] bg-[#EEEEEE] flex items-center rounded-full overflow-hidden p-0 shadow-sm shrink-0">
            <button
              onClick={handlePrevPage}
              title="Page précédente"
              className="w-8 xs:w-9 sm:w-11 h-full flex items-center justify-center bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] transition-colors cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            <button
              onClick={handleNextPage}
              title="Page suivante"
              className="w-8 xs:w-9 sm:w-11 h-full flex items-center justify-center bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] transition-colors cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.25]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            <div className="h-full px-2.5 sm:px-4 flex items-center justify-center bg-[#111111] text-[#EEEEEE] text-xs sm:text-base font-medium  min-w-[56px] xs:min-w-[64px] sm:min-w-[80px]">
              {currentPage} sur {numPages || 1}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailView;

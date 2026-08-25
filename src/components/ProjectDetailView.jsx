import React, { useState, useRef, useEffect, useContext, useMemo } from 'react';
import { X, ChevronUp, ChevronDown, ZoomIn, ZoomOut, Info, Download, Bookmark, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import SEO from './SEO';
import api from '../api/axios';
import { decodeHTMLEntities } from '../utils/text';
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

const getDownloadUrl = (url, title) => {
  if (!url) return "";
  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  let key = url;
  if (url.startsWith("http")) {
    try {
      const urlObj = new URL(url);
      key = urlObj.pathname.split("/").slice(-2).join("/");
    } catch (e) {}
  } else if (key.startsWith("/api/files/")) {
    key = key.replace("/api/files/", "");
  } else if (key.startsWith("/api/")) {
    key = key.replace("/api/", "");
  } else if (key.startsWith("/")) {
    key = key.substring(1);
  }
  return `${backendUrl.replace(/\/+$/, "")}/files/${key}?download=${encodeURIComponent(title || "projet")}`;
};

const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const backendUrl = import.meta.env.VITE_API_URL || 'https://api.artchiv.fr/api';
  let cleanPath = url;
  if (cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.replace('/api', '');
  }
  return `${backendUrl.replace(/\/+$/, '')}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

const IconUserProfile = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z" />
  </svg>
);

const PageSingleSVG = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M208,28H48A20,20,0,0,0,28,48V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V48A20,20,0,0,0,208,28Zm-4,176H52V52H204Z"></path>
  </svg>
);

const PageDoubleSVG = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M200,36H56A20,20,0,0,0,36,56V200a20,20,0,0,0,20,20H200a20,20,0,0,0,20-20V56A20,20,0,0,0,200,36ZM60,60h56V196H60ZM196,196H140V60h56Z"></path>
  </svg>
);

const IconAddDocument = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M216.49,79.51l-56-56A12,12,0,0,0,152,20H56A20,20,0,0,0,36,40V216a20,20,0,0,0,20,20H200a20,20,0,0,0,20-20V88A12,12,0,0,0,216.49,79.51ZM160,57l23,23H160ZM60,212V44h76V92a12,12,0,0,0,12,12h48V212Zm104-60a12,12,0,0,1-12,12H140v12a12,12,0,0,1-24,0V164H104a12,12,0,0,1,0-24h12V128a12,12,0,0,1,24,0v12h12A12,12,0,0,1,164,152Z" />
  </svg>
);

const IconEye = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z" />
  </svg>
);

const IconDownload = ({ className = "w-4 h-4 text-[#111111]" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z" />
  </svg>
);

export function ProjectDetailView({ item, onClose, onOpenProfile, onOpenLogin, onOpenInfo, onOpenSubmit, onOpenPublicProfile }) {
  const { user, setUser } = useContext(AuthContext);
  const [showInfo, setShowInfo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const infoPanelRef = useRef(null);
  const isPortrait = item?.orientation === 'portrait' || (item?.aspectRatio && item?.aspectRatio > 1.1);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showInfo && infoPanelRef.current && !infoPanelRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showInfo]);

  const isSaved = user?.savedProjects?.some(sp => sp.projectId === item?.id);

  const authorDisplayName = item?.authorPseudo || item?.author?.pseudo || (typeof item?.author === 'string' && item.author.trim() !== '' ? item.author : null) || (item?.author?.firstName || item?.author?.lastName ? `${item.author?.firstName || ''} ${item.author?.lastName || ''}`.trim() : 'Auteur inconnu');

  const authorIdentifier = item?.authorPseudo || item?.author?.pseudo || item?.userId;

  const isAuthor = user && user.id === item?.userId;

  const handleDownload = async () => {
    try {
      if (!item.allowDownload && !isAuthor) return alert("Le téléchargement n'est pas autorisé par l'auteur.");
      const res = await api.post(`/projects/${item.id}/download`);
      if (res.data && res.data.pdfUrl) {
        window.open(getFileUrl(res.data.pdfUrl), '_blank');
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
  };

  const [zoomLevel, setZoomLevel] = useState(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isMobile) {
      return isPortrait ? 22 : 26;
    }
    return isPortrait ? 32 : 44;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('single');
  const [numPages, setNumPages] = useState(0);

  const scrollContainerRef = useRef(null);
  const pageRefs = useRef([]);
  const isNavigatingRef = useRef(false);
  const navTimerRef = useRef(null);
  const rafRef = useRef(null);
  const scrollStopTimerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  if (pageRefs.current.length !== numPages) {
    pageRefs.current = Array(numPages).fill(0).map((_, i) => pageRefs.current[i] || React.createRef());
  }

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (isNavigatingRef.current) return;

      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setIsScrolling(true);

        if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
        scrollStopTimerRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);

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
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
    };
  }, [numPages]);

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

    let initialPinchDistance = null;
    let initialZoomLevel = 100;

    const getDistance = (touch1, touch2) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.hypot(dx, dy);
    };

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setZoomLevel((prev) => Math.max(25, Math.min(220, Math.round(prev * factor))));
      }
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
        setZoomLevel((currentZoom) => {
          initialZoomLevel = currentZoom;
          return currentZoom;
        });
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && initialPinchDistance) {
        if (e.cancelable) e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scaleFactor = currentDistance / initialPinchDistance;
        const newZoom = Math.max(25, Math.min(220, Math.round(initialZoomLevel * scaleFactor)));
        setZoomLevel(newZoom);
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialPinchDistance = null;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const spreads = useMemo(() => {
    if (viewMode === 'single') {
      return Array.from({ length: numPages }, (_, i) => [i + 1]);
    }
    const result = [[1]];
    for (let i = 2; i <= numPages; i += 2) {
      if (i + 1 <= numPages) {
        result.push([i, i + 1]);
      } else {
        result.push([i]);
      }
    }
    return result;
  }, [numPages, viewMode]);

  if (!item) return null;

  const domainName = item.domain?.name || item.field;

  return (
    <div className="fixed inset-0 z-[70] bg-[#EEEEEE] text-[#111111] flex flex-col font-sans font-medium overflow-hidden animate-in fade-in duration-200">
      <SEO
        title={`${decodeHTMLEntities(item.title)} - ${decodeHTMLEntities(authorDisplayName)}`}
        description={`${decodeHTMLEntities(item.type || 'Projet')} par ${decodeHTMLEntities(authorDisplayName)} (${decodeHTMLEntities(item.school || '')}, ${item.year || ''})`}
        image={item.coverUrl}
        url={`/projet/${item.slug || item.id}`}
      />

      {/* TOP HEADER */}
      <header className="fixed top-3 left-3 right-3 sm:top-6 sm:left-6 sm:right-6 z-50 flex items-center justify-between gap-1 sm:gap-3.5 pointer-events-none font-sans max-w-full">
        <div className="flex items-center gap-1 xs:gap-2 sm:gap-3.5 pointer-events-auto shrink-0">
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
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <Info className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
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
            title={user ? user.name || user.pseudo || 'Profil' : 'Se connecter'}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <IconUserProfile className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={() => {
              onClose?.();
              onOpenSubmit?.();
            }}
            title="Ajouter mon travail"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <IconAddDocument className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 xs:gap-1.5 sm:gap-3.5 shrink-0">
          <button
            onClick={onClose}
            title="Fermer la vue produit"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER AREA */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex bg-[#EEEEEE]">

        {/* BOTTOM LEFT PROJECT INFORMATION PANEL */}
        <div ref={infoPanelRef} className="fixed bottom-3 left-3 sm:bottom-6 sm:left-6 z-40 max-w-[calc(100vw-6.5rem)] sm:max-w-md pointer-events-auto font-sans text-[#111111]">
          {showInfo && (
            <div className={`animate-in fade-in slide-in-from-bottom-2 duration-200 mb-3 bg-[#EEEEEE] sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none p-3.5 sm:p-0 rounded-[16px] sm:rounded-none border-[1.5px] border-[#111111] sm:border-0 shadow-lg sm:shadow-none overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isDescExpanded ? 'max-h-[75vh] sm:max-h-[70vh]' : 'max-h-[52vh] sm:max-h-none'}`}>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-mono text-slate-600 mb-1 font-semibold">
                <div className="flex items-center gap-1.5">
                  <IconEye className="w-4 h-4 text-[#111111]" />
                  <span>{item.viewsCount ?? item.views ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconDownload className="w-4 h-4 text-[#111111]" />
                  <span>{item.downloadsCount ?? 0}</span>
                </div>
              </div>

              <h1 className="text-base sm:text-2xl font-bold leading-tight mb-1 text-[#111111]">
                {decodeHTMLEntities(item.title)}
              </h1>

              <p className="text-sm sm:text-base font-medium mb-1 sm:mb-2 text-[#111111]">
                par{' '}
                <span
                  onClick={() => {
                    onClose?.();
                    if (onOpenPublicProfile && authorIdentifier) {
                      onOpenPublicProfile(authorIdentifier);
                    }
                  }}
                  className="underline cursor-pointer hover:opacity-80 font-bold"
                >
                  {decodeHTMLEntities(authorDisplayName)}
                </span>
              </p>

              <p className="text-sm sm:text-base font-mono text-slate-600 mb-0.5">
                {[
                  item.year ? String(item.year) : null,
                  item.type ? decodeHTMLEntities(item.type) : null,
                  domainName && domainName.trim() !== '' && domainName !== 'Inconnu' ? decodeHTMLEntities(domainName) : null
                ].filter(Boolean).join(' — ')}
              </p>
              {item.school && item.school.trim() !== '' && item.school !== 'Inconnu' && (
                <p className="text-sm sm:text-base font-mono text-slate-600 mb-2 sm:mb-3">
                  {decodeHTMLEntities(item.school)}
                </p>
              )}

              {item.description && (() => {
                const fullDesc = decodeHTMLEntities(item.description);
                const shouldTruncateDesktop = fullDesc.length > 500;
                const shouldTruncateMobile = fullDesc.length > 150 || fullDesc.includes('\n');
                const hasVoirPlus = shouldTruncateDesktop || shouldTruncateMobile;

                let displayedText = fullDesc;
                if (!isDescExpanded && fullDesc.length > 500) {
                  displayedText = `${fullDesc.slice(0, 500).trim()}...`;
                }

                return (
                  <div>
                    <p className={`text-sm sm:text-base text-slate-700 leading-relaxed max-w-xs sm:max-w-md ${isDescExpanded ? 'line-clamp-none max-h-[45vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full' : 'line-clamp-3 sm:line-clamp-none'}`}>
                      {displayedText}
                    </p>
                    {hasVoirPlus && (
                      <button
                        onClick={() => setIsDescExpanded(prev => !prev)}
                        className="mt-1 text-sm font-bold underline cursor-pointer text-[#111111] hover:opacity-80 inline-block"
                      >
                        {isDescExpanded ? 'voir moins' : 'voir plus'}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={() => setShowInfo((prev) => !prev)}
              title={showInfo ? 'Masquer les informations' : 'Afficher les informations'}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] flex items-center justify-center transition-colors cursor-pointer shadow-sm shrink-0"
            >
              {showInfo ? (
                <ChevronDown className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
              ) : (
                <ChevronUp className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
              )}
            </button>

            {(item.allowDownload || isAuthor) && (
              <button
                onClick={handleDownload}
                className="h-10 sm:h-11 px-3.5 sm:px-6 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] text-sm sm:text-base font-medium flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer shadow-sm shrink-0"
                title="Télécharger le PDF"
              >
                <Download className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25] sm:order-2" />
                <span className="sm:order-1">
                  <span className="hidden sm:inline">Télécharger </span>
                  {item.pdfSize ? `(${item.pdfSize})` : ''}
                </span>
              </button>
            )}

            <button
              onClick={toggleSave}
              disabled={isSaving}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] flex items-center justify-center transition-colors cursor-pointer shadow-sm shrink-0 ${isSaved
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isSaved ? "Retirer des enregistrements" : "Enregistrer"}
            >
              <Bookmark className={`w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25] ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* DOCUMENT READER VIEW AREA */}
        <Document
          file={getFileUrl(item.pdfUrl)}
          options={pdfOptions}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
          }}
          onLoadError={(error) => {
            console.error("Erreur de chargement du PDF:", error);
          }}
          className="w-full h-full"
          loading={
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EEEEEE] gap-3">
              <div className="w-6 h-6 border-2 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin" />
              <span className="text-[#111111] font-mono text-xs sm:text-sm font-semibold tracking-tight">
                Chargement du document...
              </span>
            </div>
          }
          error={
            <div className="absolute inset-0 flex items-center justify-center bg-[#EEEEEE] p-4">
              <div className="flex flex-col items-center text-center max-w-sm">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] flex items-center justify-center mb-4 shadow-sm">
                  <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-[#111111]" />
                </div>
                <h3 className="text-base sm:text-xl font-bold text-[#111111] mb-1.5 leading-tight">
                  Impossible d'afficher le document
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
                  Le fichier PDF n'a pas pu être chargé ou son format n'est pas pris en charge par le visualiseur.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={() => window.location.reload()}
                    className="h-9 sm:h-10 px-4 sm:px-5 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] text-xs sm:text-sm font-medium text-[#111111] flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5 stroke-[2.25]" />
                    <span>Réessayer</span>
                  </button>
                  {(item.allowDownload || isAuthor) && item.pdfUrl && (
                    <a
                      href={getDownloadUrl(item.pdfUrl, item.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-[#111111] hover:bg-black text-xs sm:text-sm font-medium text-white flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.25]" />
                      <span>Télécharger directement</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          }
        >
          <div
            ref={scrollContainerRef}
            className="w-full h-full overflow-y-auto overflow-x-auto bg-[#EEEEEE] py-20 sm:py-28 pb-32 px-3 sm:px-8"
            style={{ willChange: 'scroll-position' }}
          >
            <div className="w-max min-w-full mx-auto flex flex-col items-center space-y-6 sm:space-y-8">
              {spreads.map((pages, spreadIdx) => {
                return (
                  <div
                    key={`spread-${pages.join('-')}`}
                    className={`flex flex-row items-center justify-center ${viewMode === 'double' ? 'gap-0 shadow-2xl' : 'gap-4'} shrink-0`}
                  >
                    {pages.map((pageNum) => (
                      <div
                        key={`page-${pageNum}`}
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
                          renderTextLayer={!isScrolling}
                          renderAnnotationLayer={!isScrolling}
                          devicePixelRatio={Math.min(window.devicePixelRatio || 1, 1.5)}
                          loading={
                            <div className="w-[300px] h-[420px] bg-white animate-pulse flex items-center justify-center text-xs font-mono text-slate-400 border-[1.5px] border-[#111111]/10 shadow-sm">
                              Chargement page {pageNum}...
                            </div>
                          }
                          className="block pointer-events-none"
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </Document>

        {/* BOTTOM RIGHT FLOATING HUD CONTROLS BAR */}
        <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end sm:flex-row sm:items-center gap-2 sm:gap-3.5 pointer-events-auto font-sans max-w-full">
          <div className="flex h-10 sm:h-11 border-[1.5px] border-[#111111] bg-[#EEEEEE] items-center rounded-full overflow-hidden p-0 shadow-sm shrink-0">
            <button
              onClick={() => setViewMode('single')}
              title="Page Simple"
              className={`w-9 xs:w-10 sm:w-11 h-full flex items-center justify-center transition-colors cursor-pointer ${viewMode === 'single'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                }`}
            >
              <PageSingleSVG className="w-4 h-4 sm:w-4 sm:h-4" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            <button
              onClick={() => setViewMode('double')}
              title="Double Page"
              className={`w-9 xs:w-10 sm:w-11 h-full flex items-center justify-center transition-colors cursor-pointer ${viewMode === 'double'
                ? 'bg-[#111111] text-[#EEEEEE]'
                : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                }`}
            >
              <PageDoubleSVG className="w-4 h-4 sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="h-10 sm:h-11 border-[1.5px] border-[#111111] bg-[#EEEEEE] flex items-center rounded-full overflow-hidden p-0 shadow-sm shrink-0">
            <button
              onClick={handleZoomOut}
              title="Dézoomer (-)"
              className="w-9 xs:w-10 sm:w-11 h-full flex items-center justify-center bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            <button
              onClick={handleZoomIn}
              title="Zoomer (+)"
              className="w-9 xs:w-10 sm:w-11 h-full flex items-center justify-center bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
            </button>
          </div>

          <div className="h-10 sm:h-11 border-[1.5px] border-[#111111] bg-[#EEEEEE] flex items-center rounded-full overflow-hidden p-0 shadow-sm shrink-0">
            <button
              onClick={handlePrevPage}
              title="Page précédente"
              className="w-9 xs:w-10 sm:w-11 h-full flex items-center justify-center bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] transition-colors cursor-pointer"
            >
              <ChevronUp className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            <button
              onClick={handleNextPage}
              title="Page suivante"
              className="w-9 xs:w-10 sm:w-11 h-full flex items-center justify-center bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
            </button>

            <div className="w-[1.5px] h-full bg-[#111111]" />

            <div className="h-full px-2.5 sm:px-4 flex items-center justify-center bg-[#111111] text-[#EEEEEE] text-xs sm:text-base font-medium min-w-[56px] xs:min-w-[64px] sm:min-w-[80px]">
              {currentPage} sur {numPages || 1}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailView;
import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Share2, Heart, Download } from 'lucide-react';
import gsap from 'gsap';
import { getFileUrl } from '../utils/url';

export function DetailModal({ item, onClose, onOpenPublicProfile }) {
  const [liked, setLiked] = useState(false);
  const [pdfSimulated, setPdfSimulated] = useState(false);

  const backdropRef = useRef(null);
  const modalContainerRef = useRef(null);

  useEffect(() => {
    if (item) {
      const tl = gsap.timeline();
      tl.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      ).fromTo(
        modalContainerRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' },
        '-=0.15'
      );
    }
  }, [item]);

  if (!item) return null;

  const handleCloseAnimation = () => {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(modalContainerRef.current, { opacity: 0, scale: 0.95, y: 15, duration: 0.2, ease: 'power2.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.15 }, '-=0.1');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 font-sans font-medium text-[#111111] ">
      {/* Backdrop with Soft Blur */}
      <div
        ref={backdropRef}
        onClick={handleCloseAnimation}
        className="fixed inset-0 bg-[#111111]/70 backdrop-blur-xs"
      />

      {/* Modal Dialog Container */}
      <div
        ref={modalContainerRef}
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[14px] shadow-2xl overflow-hidden flex flex-col md:flex-row transform-gpu z-10"
      >
        {/* Close Button */}
        <button
          onClick={handleCloseAnimation}
          title="Fermer"
          className="absolute top-4 right-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#111111] hover:text-[#EEEEEE] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
        >
          <X className="w-4 h-4 stroke-[2.25]" />
        </button>

        {/* Left Column: Large PDF Cover Preview */}
        <div className="md:w-1/2 bg-[#E2E2E2] border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-[#111111] p-6 flex flex-col items-center justify-center relative min-h-[280px]">
          <div className="w-48 sm:w-60 aspect-[3/4] bg-white rounded-[10px] border-[1.5px] border-[#111111] shadow-md overflow-hidden relative group">
            <img
              src={getFileUrl(item.coverUrl) || getFileUrl(item.imageUrl) || '/artchiv-logo.webp'}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Column: Metadata & Details matching Screen 2 style */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-[#EEEEEE]">
          <div>
            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-[#111111] leading-tight mb-1">
              {item.title}
            </h1>

            {/* Author */}
            <p className="text-base font-medium text-[#111111] mb-2">
              par{' '}
              <span
                onClick={() => {
                  if (onOpenPublicProfile) onOpenPublicProfile(item.author);
                }}
                className="underline cursor-pointer hover:opacity-80 font-bold"
              >
                {item.author}
              </span>
            </p>

            {/* Monospace Metadata Line (School — Year • Field) */}
            <p className="text-base font-mono text-slate-600 mb-4">
              {item.school} — {item.year} • {item.field || item.type}
            </p>

            {/* Subtitle if available */}
            {item.subtitle && (
              <p className="text-base text-slate-700 font-medium mb-3 italic">
                {item.subtitle}
              </p>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-base text-slate-700 leading-relaxed mb-6">
                {item.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t-2 border-[#111111] flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setPdfSimulated(true)}
              className="flex-1 bg-[#111111] hover:opacity-90 text-[#EEEEEE] font-semibold py-2.5 px-3 sm:px-4 rounded-none text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>{pdfSimulated ? 'Ouverture PDF...' : 'Consulter le PDF'}</span>
            </button>

            <a
              href={item.pdfUrl || (item?.orientation === 'landscape' ? '/pdf/Book-2.pdf' : '/pdf/Book.pdf')}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-[#EEEEEE] hover:bg-[#dddddd] text-[#111111] font-mono font-bold text-xs rounded-none border-2 border-[#111111] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title={`Télécharger le PDF (${item.pdfSize || (item?.orientation === 'landscape' ? '12.0 Mo' : '1.2 Mo')})`}
            >
              <Download className="w-4 h-4 stroke-[2.25]" />
              <span className="hidden sm:inline">{item.pdfSize || (item?.orientation === 'landscape' ? '12.0 Mo' : '1.2 Mo')}</span>
            </a>

            <button
              onClick={() => setLiked(!liked)}
              className={`p-2.5 rounded-none border-2 border-[#111111] transition-colors ${liked
                  ? 'bg-rose-500 text-[#EEEEEE]'
                  : 'bg-[#EEEEEE] text-[#111111] hover:bg-[#dddddd]'
                }`}
              title="Ajouter aux favoris"
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-[#EEEEEE]' : ''}`} />
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Lien du mémoire copié dans le presse-papier !");
              }}
              className="p-2.5 rounded-none border-2 border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#dddddd] transition-colors"
              title="Partager"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

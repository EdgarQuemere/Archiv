import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Share2, Heart } from 'lucide-react';
import gsap from 'gsap';

export function DetailModal({ item, onClose }) {
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
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power2.out' },
        '-=0.15'
      );
    }
  }, [item]);

  const handleClose = () => {
    if (modalContainerRef.current && backdropRef.current) {
      gsap.timeline({
        onComplete: () => {
          onClose();
        }
      })
      .to(modalContainerRef.current, { opacity: 0, scale: 0.95, y: 15, duration: 0.2, ease: 'power2.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.2 }, '-=0.1');
    } else {
      onClose();
    }
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-[#111111]/75 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Card Container */}
      <div
        ref={modalContainerRef}
        className="relative bg-[#EEEEEE] rounded-none shadow-2xl max-w-4xl w-full overflow-hidden z-10 my-auto border-2 border-[#111111] flex flex-col md:flex-row max-h-[90vh] text-[#111111] transform-gpu"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-30 bg-[#111111] hover:opacity-90 text-[#EEEEEE] p-2 rounded-none transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Cover Image Display */}
        <div className="md:w-1/2 bg-[#111111] p-6 sm:p-8 flex items-center justify-center relative overflow-hidden">
          <div className="relative z-10 max-w-xs w-full shadow-2xl rounded-none overflow-hidden">
            <img
              src={item.coverUrl}
              alt={item.title}
              className="w-full h-auto object-cover max-h-[60vh] rounded-none"
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
            <p className="text-sm font-medium text-[#111111] mb-2">
              par {item.author}
            </p>

            {/* Monospace Metadata Line (School — Year • Field) */}
            <p className="text-xs font-mono text-slate-600 mb-4">
              {item.school} — {item.year} • {item.field || item.type}
            </p>

            {/* Subtitle if available */}
            {item.subtitle && (
              <p className="text-xs sm:text-sm text-slate-700 font-medium mb-3 italic">
                {item.subtitle}
              </p>
            )}

            {/* Abstract */}
            {item.abstract && (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-6">
                {item.abstract}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t-2 border-[#111111] flex items-center gap-3">
            <button
              onClick={() => setPdfSimulated(true)}
              className="flex-1 bg-[#111111] hover:opacity-90 text-[#EEEEEE] font-semibold py-2.5 px-4 rounded-none text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>{pdfSimulated ? 'Ouverture PDF...' : 'Consulter le mémoire PDF'}</span>
            </button>

            <button
              onClick={() => setLiked(!liked)}
              className={`p-2.5 rounded-none border-2 border-[#111111] transition-colors ${
                liked
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

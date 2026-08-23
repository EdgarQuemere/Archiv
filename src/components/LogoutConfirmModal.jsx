import React, { useEffect, useRef } from 'react';
import { X, LogOut } from 'lucide-react';
import gsap from 'gsap';

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  const backdropRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      gsap.timeline()
        .fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
        .fromTo(modalRef.current, { opacity: 0, scale: 0.96, y: 12 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '-=0.15');
    }
  }, [isOpen]);

  const handleClose = () => {
    if (modalRef.current && backdropRef.current) {
      gsap.timeline({ onComplete: onClose })
        .to(modalRef.current, { opacity: 0, scale: 0.96, y: 8, duration: 0.2, ease: 'power2.in' })
        .to(backdropRef.current, { opacity: 0, duration: 0.15 }, '-=0.1');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 font-sans font-medium text-[#111111] ">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleClose}
        className="fixed inset-0 bg-[#111111]/70 backdrop-blur-xs"
      />

      {/* Modal Dialog Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[480px] bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[14px] shadow-2xl p-6 sm:p-8 transform-gpu z-10"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          title="Fermer"
          className="absolute top-4 right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
        >
          <X className="w-4 h-4 stroke-[2.25]" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pr-10">
          <div className="w-10 h-10 rounded-full bg-[#111111]/5 border-[1.5px] border-[#111111] flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5 stroke-[2.25] text-[#111111]" />
          </div>
          <h2 className="text-xl font-bold text-[#111111]">Se déconnecter</h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
          Êtes-vous sûr de vouloir vous déconnecter<br />de votre compte ?
        </p>

        {/* Actions */}
        <div className="pt-4 border-t-[1.5px] border-[#111111] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="h-10 sm:h-11 px-5 bg-[#EEEEEE] text-[#111111] rounded-full border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-[#E2E2E2] transition-colors cursor-pointer shadow-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              handleClose();
            }}
            className="h-10 sm:h-11 px-6 bg-[#111111] text-[#EEEEEE] rounded-full border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-black flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4 stroke-[2.25]" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutConfirmModal;

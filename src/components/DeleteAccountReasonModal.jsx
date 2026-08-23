import React, { useState, useEffect, useRef } from 'react';
import { X, HelpCircle, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

const REASONS = [
  "Je n'utilise plus la plateforme",
  "J'ai créé un autre compte",
  "Problèmes d'ergonomie ou de bugs",
  "Inquiétudes concernant mes données",
  "Autre raison"
];

export function DeleteAccountReasonModal({ isOpen, onClose, onNext }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const backdropRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setCustomReason('');
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

  const handleContinue = (e) => {
    e.preventDefault();
    const finalReason = selectedReason === "Autre raison" ? customReason : selectedReason;
    onNext(finalReason);
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
        className="relative w-full max-w-md bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[14px] shadow-2xl p-6 sm:p-8 transform-gpu z-10"
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
        <div className="flex items-center gap-3.5 mb-4 pr-10">
          <div className="w-10 h-10 rounded-full bg-[#111111]/5 border-[1.5px] border-[#111111] flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 stroke-[2.25] text-[#111111]" />
          </div>
          <h2 className="text-xl font-bold text-[#111111]">Supprimer mon compte</h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
          Pourquoi souhaitez-vous supprimer votre compte ? Vos retours nous aident à améliorer la plateforme.
        </p>

        <form onSubmit={handleContinue} className="space-y-3">
          <div className="space-y-2">
            {REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <label
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-full border-[1.5px] cursor-pointer transition-all text-xs sm:text-sm font-medium ${isSelected
                      ? 'border-[#111111] bg-[#111111] text-[#EEEEEE]'
                      : 'border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2]'
                    }`}
                >
                  <span>{reason}</span>
                  <input
                    type="radio"
                    name="deletionReason"
                    value={reason}
                    checked={isSelected}
                    onChange={() => setSelectedReason(reason)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${isSelected ? 'border-[#EEEEEE] bg-[#EEEEEE]' : 'border-[#111111]'
                    }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#111111]" />}
                  </div>
                </label>
              );
            })}
          </div>

          {selectedReason === "Autre raison" && (
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Précisez la raison de votre départ (optionnel)..."
              className="w-full p-3 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[14px] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20 resize-none transition-all placeholder:text-slate-500"
            />
          )}

          <div className="pt-3 border-t-[1.5px] border-[#111111] flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="h-10 sm:h-11 px-5 bg-[#EEEEEE] text-[#111111] rounded-full border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-[#E2E2E2] transition-colors cursor-pointer shadow-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!selectedReason}
              className="h-10 sm:h-11 px-6 bg-[#111111] text-[#EEEEEE] rounded-full border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <span>Continuer</span>
              <ArrowRight className="w-4 h-4 stroke-[2.25]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeleteAccountReasonModal;

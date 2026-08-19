import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, CheckCircle2, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { SCHOOLS_LIST } from '../data/coversData';

export function SubmitModal({ isOpen, onClose, onAddCover }) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    author: '',
    school: SCHOOLS_LIST[1] || '',
    year: '2026',
    type: 'Mémoire',
    field: 'Design Graphique',
    abstract: '',
    coverUrl: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const backdropRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      gsap.timeline()
        .fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        )
        .fromTo(
          dialogRef.current,
          { opacity: 0, scale: 0.95, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power2.out' },
          '-=0.15'
        );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (dialogRef.current && backdropRef.current) {
      gsap.timeline({
        onComplete: () => {
          onClose();
        }
      })
      .to(dialogRef.current, { opacity: 0, scale: 0.95, y: 10, duration: 0.2, ease: 'power2.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.15 }, '-=0.1');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const newCover = {
      ...formData,
      id: Date.now(),
      coverUrl: formData.coverUrl || '/Cover-portfolio/Capture d’écran 2026-07-26 à 21.02.49 1.png',
      aspectRatio: 1.414,
      tags: ['Étudiant', formData.type, formData.field],
      readTime: '15 min read',
      pages: 120
    };

    onAddCover(newCover);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      handleClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-sans text-[#111111]">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-[#111111]/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-[#EEEEEE] rounded-none shadow-2xl max-w-lg w-full overflow-hidden z-10 my-auto border-2 border-[#111111] p-6 sm:p-8 transform-gpu"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#111111] hover:opacity-60 p-1.5 rounded-none"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-10 text-center flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-[#111111] mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-[#111111] mb-1">
              Couverture publiée !
            </h2>
            <p className="text-xs text-slate-600">
              Votre travail fait désormais partie du canva infini.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#111111]" />
              <h2 className="text-lg font-bold text-[#111111]">
                Ajouter votre mémoire ou portfolio
              </h2>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Rejoignez l'archive visuelle des étudiants en art et design.
            </p>

            <div>
              <label className="text-xs font-semibold text-[#111111] block mb-1">
                Titre du travail *
              </label>
              <input
                required
                type="text"
                placeholder="ex: L'archéologie des machines"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Auteur (Nom & Prénom) *
                </label>
                <input
                  required
                  type="text"
                  placeholder="ex: Thomas Martin"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="Mémoire">Mémoire</option>
                  <option value="Portfolio">Portfolio</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  École / Institution *
                </label>
                <select
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none"
                >
                  {SCHOOLS_LIST.filter(s => s !== "Toutes les écoles").map((sch) => (
                    <option key={sch} value={sch}>
                      {sch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Année *
                </label>
                <input
                  type="number"
                  min="2018"
                  max="2027"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#111111] block mb-1">
                Résumé succinct
              </label>
              <textarea
                rows={3}
                placeholder="Décrivez les thématiques principales abordées..."
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t-2 border-[#111111] flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border-2 border-[#111111] bg-[#EEEEEE] text-[#111111] rounded-none text-xs font-semibold hover:bg-[#dddddd] transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#111111] text-[#EEEEEE] rounded-none text-xs font-semibold hover:opacity-90 transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Publier la couverture</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

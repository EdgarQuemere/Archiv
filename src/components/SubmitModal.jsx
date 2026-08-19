import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, CheckCircle2, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { SCHOOLS_LIST } from '../data/coversData';
import api from '../api/axios'; // Import de l'instance axios avec credentials

export function SubmitModal({ isOpen, onClose, onAddCover }) {
  const [formData, setFormData] = useState({
    title: '',
    school: SCHOOLS_LIST[1] || '',
    year: '2026',
    type: 'Mémoire',
    domain: 'Design Graphique',
    description: '',
  });

  const [files, setFiles] = useState({
    pdf: null,
    cover: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('type', formData.type);
    submitData.append('school', formData.school);
    submitData.append('year', formData.year);
    submitData.append('domain', formData.domain);
    submitData.append('description', formData.description);

    if (files.pdf) {
      submitData.append('pdf', files.pdf);
    }
    if (files.cover) {
      submitData.append('cover', files.cover);
    }

    try {
      const response = await api.post('/projects', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // onAddCover(response.data.project); // Facultatif si on recharge la liste depuis la DB ensuite
      
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        handleClose();
      }, 1800);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Vous devez être connecté pour publier un projet.');
      } else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Une erreur est survenue lors de l\'envoi du projet.');
      }
    } finally {
      setLoading(false);
    }
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
              Projet publié !
            </h2>
            <p className="text-xs text-slate-600">
              Votre travail fait désormais partie de l'archive.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#111111]" />
              <h2 className="text-lg font-bold text-[#111111]">
                Ajouter un projet
              </h2>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Rejoignez l'archive visuelle des étudiants en art et design.
            </p>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

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

              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Domaine *
                </label>
                <input
                  required
                  type="text"
                  placeholder="ex: Design Graphique"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none"
                />
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
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Fichier PDF *
                </label>
                <input
                  required
                  type="file"
                  name="pdf"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-2 py-1 text-[10px] focus:outline-none file:mr-2 file:py-1 file:px-2 file:border-0 file:text-[10px] file:bg-[#111111] file:text-white cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Image de Couverture
                </label>
                <input
                  type="file"
                  name="cover"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-2 py-1 text-[10px] focus:outline-none file:mr-2 file:py-1 file:px-2 file:border-0 file:text-[10px] file:bg-[#111111] file:text-white cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t-2 border-[#111111] flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 border-2 border-[#111111] bg-[#EEEEEE] text-[#111111] rounded-none text-xs font-semibold hover:bg-[#dddddd] transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#111111] text-[#EEEEEE] rounded-none text-xs font-semibold hover:opacity-90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{loading ? 'Envoi...' : 'Publier le projet'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, CheckCircle2, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { pdfjs } from 'react-pdf';
import { SCHOOLS_LIST } from '../data/coversData';
import api from '../api/axios'; // Import de l'instance axios avec credentials

// Configure worker using CDN to avoid Vite MIME type issues
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function SubmitModal({ isOpen, onClose, onAddCover, editData, onUpdateCover }) {
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [extractingCover, setExtractingCover] = useState(false);
  const backdropRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          title: editData.title || '',
          school: editData.school || SCHOOLS_LIST[1],
          year: editData.year || '2026',
          type: editData.type || 'Mémoire',
          domain: editData.field || '',
          description: editData.description || '',
        });
      } else {
        setFormData({
          title: '',
          school: SCHOOLS_LIST[1] || '',
          year: '2026',
          type: 'Mémoire',
          domain: 'Design Graphique',
          description: '',
        });
      }
      setUploadProgress(0);
      setFiles({ pdf: null, cover: null });
      setCoverPreviewUrl(null);
      setError('');
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
  }, [isOpen, editData]);

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

  const extractCoverFromPDF = async (pdfFile) => {
    setExtractingCover(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({
        data: arrayBuffer,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
      }).promise;
      const page = await pdf.getPage(1);
      
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      canvas.toBlob((blob) => {
        if (blob) {
          const coverFile = new File([blob], "auto-cover.jpg", { type: "image/jpeg" });
          setFiles(prev => ({ ...prev, cover: coverFile }));
          setCoverPreviewUrl(URL.createObjectURL(blob));
        }
        setExtractingCover(false);
      }, 'image/jpeg', 0.85);
    } catch (error) {
      console.error("Erreur d'extraction de la couverture :", error);
      setExtractingCover(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (e.target.name === 'pdf' && file) {
      setFiles(prev => ({ ...prev, pdf: file }));
      extractCoverFromPDF(file);
    } else {
      setFiles(prev => ({ ...prev, [e.target.name]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);
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
      let response;
      if (editData) {
        response = await api.put(`/projects/${editData.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          }
        });
        if (onUpdateCover && response.data.project) {
          const p = response.data.project;
          onUpdateCover({
            ...p,
            id: p.id,
            field: p.domain,
            imageUrl: p.coverUrl
          });
        }
      } else {
        response = await api.post('/projects', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          }
        });
        if (onAddCover && response.data.project) {
          onAddCover(response.data.project);
        }
      }
      
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
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-sans text-[#111111]">
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-[#111111]/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

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
              {editData ? 'Projet mis à jour !' : 'Projet publié !'}
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
                {editData ? 'Modifier le projet' : 'Ajouter un projet'}
              </h2>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              {editData ? 'Mettez à jour les informations de votre projet.' : 'Rejoignez l\'archive visuelle des étudiants en art et design.'}
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
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-semibold text-[#111111] block">
                    Fichier PDF {editData ? '' : '*'}
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Max 30 Mo</span>
                </div>
                <input
                  required={!editData}
                  type="file"
                  name="pdf"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-2 py-1 text-[10px] focus:outline-none file:mr-2 file:py-1 file:px-2 file:border-0 file:text-[10px] file:bg-[#111111] file:text-white cursor-pointer"
                />
                {editData && <div className="text-[9px] text-slate-500 mt-1">Laissez vide pour conserver le PDF actuel.</div>}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#111111] block mb-1">
                  Aperçu de la Couverture
                </label>
                <div className="w-full h-24 bg-slate-200 border-2 border-[#111111] flex flex-col items-center justify-center overflow-hidden relative">
                  {extractingCover ? (
                    <div className="flex flex-col items-center text-slate-500">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-1" />
                      <span className="text-[9px] font-semibold">Génération...</span>
                    </div>
                  ) : coverPreviewUrl || (editData && editData.coverUrl) ? (
                    <img 
                      src={coverPreviewUrl || editData.coverUrl} 
                      alt="Aperçu couverture" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold px-4 text-center">
                      Sélectionnez un PDF pour générer la couverture.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-[#111111]">
              {loading && uploadProgress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold text-[#111111] mb-1 font-mono">
                    <span>{editData ? 'Mise à jour en cours...' : 'Envoi en cours...'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 overflow-hidden border border-[#111111]">
                    <div 
                      className="h-full bg-[#111111] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
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
                  className="px-5 py-2 bg-[#111111] text-[#EEEEEE] rounded-none text-xs font-semibold hover:opacity-90 transition-colors flex items-center gap-1.5 disabled:opacity-50 min-w-[160px] justify-center"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>{editData ? 'Mise à jour...' : 'Envoi...'}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{editData ? 'Mettre à jour' : 'Publier le projet'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, CheckCircle2, ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { pdfjs } from 'react-pdf';
import SearchableSchoolSelect from './SearchableSchoolSelect';
import api from '../api/axios';
import { getFileUrl } from '../utils/url';
import { decodeHTMLEntities } from '../utils/text';

const IconAddDocument = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M216.49,79.51l-56-56A12,12,0,0,0,152,20H56A20,20,0,0,0,36,40V216a20,20,0,0,0,20,20H200a20,20,0,0,0,20-20V88A12,12,0,0,0,216.49,79.51ZM160,57l23,23H160ZM60,212V44h76V92a12,12,0,0,0,12,12h48V212Zm104-60a12,12,0,0,1-12,12H140v12a12,12,0,0,1-24,0V164H104a12,12,0,0,1,0-24h12V128a12,12,0,0,1,24,0v12h12A12,12,0,0,1,164,152Z" />
  </svg>
);

// Configuration du worker local
pdfjs.GlobalWorkerOptions.workerPort = new Worker('/pdf.worker.js', { type: 'module' });

export function SubmitModal({ isOpen, onClose, onAddCover, editData, onUpdateCover }) {
  const [formData, setFormData] = useState({
    title: '',
    school: '',
    year: '2026',
    type: 'Mémoire',
    domain: '',
    description: '',
    allowDownload: true,
    orientation: 'portrait',
    aspectRatio: 1.414
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
  const [domains, setDomains] = useState([]);
  const backdropRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          title: decodeHTMLEntities(editData.title || ''),
          school: decodeHTMLEntities(editData.school || ''),
          year: editData.year || '2026',
          type: decodeHTMLEntities(editData.type || 'Mémoire'),
          domain: decodeHTMLEntities(editData.field || editData.domain?.name || ''),
          description: decodeHTMLEntities(editData.description || ''),
          allowDownload: editData.allowDownload !== undefined ? editData.allowDownload : true,
          orientation: editData.orientation || 'portrait',
          aspectRatio: editData.aspectRatio || 1.414
        });
      } else {
        setFormData({
          title: '',
          school: '',
          year: '2026',
          type: 'Mémoire',
          domain: '',
          description: '',
          allowDownload: true,
          orientation: 'portrait',
          aspectRatio: 1.414
        });
      }
      setUploadProgress(0);
      setFiles({ pdf: null, cover: null });
      setCoverPreviewUrl(null);
      setError('');
      setSubmitted(false);

      api.get('/domains').then((res) => {
        setDomains(res.data.map((d) => d.name));
      }).catch((err) => {
        console.error('Erreur', err);
      });

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
        wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`,
      }).promise;
      const page = await pdf.getPage(1);

      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const aspect = viewport.height / viewport.width;
      const orient = viewport.width > viewport.height ? 'landscape' : 'portrait';
      setFormData(prev => ({ ...prev, aspectRatio: aspect, orientation: orient }));

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

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

    if (formData.title && formData.title.length > 100) {
      setError("Le titre ne doit pas dépasser 100 caractères.");
      return;
    }

    // L'école est obligatoire uniquement si ce n'est pas un Book
    const isBook = formData.type === 'Book';
    if (!isBook && !formData.school.trim()) {
      setError("Veuillez sélectionner l'école où le mémoire a été soutenu.");
      return;
    }

    if (formData.description && formData.description.length > 1000) {
      setError("La description ne doit pas dépasser 1000 caractères.");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setError('');

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('type', formData.type);
    submitData.append('school', formData.school || '');
    submitData.append('year', formData.year);
    submitData.append('domain', formData.domain);
    submitData.append('description', formData.description);
    submitData.append('allowDownload', formData.allowDownload);
    submitData.append('orientation', formData.orientation);
    submitData.append('aspectRatio', formData.aspectRatio);

    if (files.pdf) {
      submitData.append('pdf', files.pdf);
      submitData.append('pdfSizeStr', (files.pdf.size / (1024 * 1024)).toFixed(1) + ' Mo');
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
            ...editData,
            title: p.title,
            slug: p.slug || editData.slug,
            school: p.school,
            year: p.year ? p.year.toString() : editData.year,
            type: p.type,
            field: formData.domain || 'Autre',
            description: p.description,
            coverUrl: p.coverUrl,
            imageUrl: p.coverUrl,
            pdfUrl: p.pdfUrl,
            pdfSize: p.pdfSize,
            orientation: p.orientation,
            aspectRatio: p.aspectRatio,
            allowDownload: formData.allowDownload,
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

  const isBook = formData.type === 'Book';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 font-sans font-medium text-[#111111] h-[100dvh] w-full">
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-[#111111]/70 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      <div
        ref={dialogRef}
        className="relative bg-[#EEEEEE] rounded-[14px] shadow-2xl max-w-lg w-full overflow-hidden z-10 my-auto border-[1.5px] border-[#111111] p-6 sm:p-8 transform-gpu max-h-[85dvh] flex flex-col"
      >
        <button
          onClick={handleClose}
          title="Fermer"
          className="absolute top-4 right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors cursor-pointer shadow-sm z-20"
        >
          <X className="w-4 h-4 stroke-[2.25]" />
        </button>

        {submitted ? (
          <div className="py-10 text-center flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-[#111111] mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-[#111111] mb-1">
              {editData ? 'Projet mis à jour !' : 'Projet publié !'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Votre travail fait désormais partie de l'archive.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="flex items-center gap-2.5 mb-1 pr-10">
              <IconAddDocument className="w-5 h-5 stroke-[2.25] text-[#111111]" />
              <h2 className="text-xl font-bold text-[#111111]">
                {editData ? 'Modifier le projet' : 'Ajouter un projet'}
              </h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              {editData ? 'Mettez à jour les informations de votre projet.' : 'Rejoignez l\'archive visuelle des étudiants en art et design.'}
            </p>

            {error && (
              <div className="p-3 bg-red-100 border-[1.5px] border-red-400 text-red-700 text-sm font-medium rounded-full text-center mb-3">
                {error}
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-[#111111] block">
                  Titre du travail *
                </label>
                <span className={`text-xs font-mono ${(formData.title?.length || 0) >= 100 ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                  {formData.title?.length || 0}/100
                </span>
              </div>
              <input
                required
                type="text"
                maxLength={100}
                placeholder={isBook ? "ex: Portfolio 2026 - Direction Artistique" : "ex: L'archéologie des machines"}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-sm font-medium text-[#111111] block mb-1">
                  Type *
                </label>
                <div className="relative">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full pl-4 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Mémoire">Mémoire</option>
                    <option value="Book">Book</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 stroke-[2.25] text-[#111111] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#111111] block mb-1">
                  Domaine <span className="text-[#999999] font-normal">(optionnel)</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full pl-4 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Autre</option>
                    {domains.map((dom) => (
                      <option key={dom} value={dom}>
                        {dom}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 stroke-[2.25] text-[#111111] pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <div>
                <label className="text-sm font-medium text-[#111111] block mb-1">
                  Année *
                </label>
                <input
                  type="number"
                  min="2018"
                  max="2027"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#111111] block mb-1">
                École / Institution {isBook ? <span className="text-[#999999] font-normal">(optionnel)</span> : '*'}
              </label>
              <SearchableSchoolSelect
                value={formData.school}
                onChange={(sch) => setFormData({ ...formData, school: sch })}
                placeholder={isBook ? "École visée par le book (optionnel)..." : "École du mémoire..."}
              />
              <span className="text-sm text-slate-500 block mt-1 leading-tight">
                {isBook
                  ? "🎯 Indiquez l'école ou le concours visé (facultatif)."
                  : "🎓 L'école dans laquelle vous avez soutenu ce mémoire."}
              </span>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-[#111111] block">
                  Résumé succinct
                </label>
                <span className={`text-xs font-mono ${(formData.description?.length || 0) >= 1000 ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                  {formData.description?.length || 0}/1000
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={1000}
                placeholder="Décrivez les thématiques principales abordées..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3.5 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[14px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500 leading-relaxed resize-none"
              />
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-sm font-medium text-[#111111] block">
                    Fichier PDF {editData ? '' : '*'}
                  </label>
                  <span className="text-xs text-slate-500 font-mono">Max 10 Mo</span>
                </div>
                <input
                  required={!editData}
                  type="file"
                  name="pdf"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-3.5 py-1.5 text-sm focus:outline-none file:mr-2 file:py-1 file:px-3 file:border-0 file:rounded-full file:text-xs file:bg-[#111111] file:text-white cursor-pointer"
                />
                {editData && <div className="text-xs text-slate-500 mt-1">Laissez vide pour conserver le PDF actuel.</div>}
              </div>

              <div>
                <label className="text-sm font-medium text-[#111111] block mb-1">
                  Aperçu de la Couverture
                </label>
                <div className="w-full min-h-[160px] max-h-[260px] bg-[#E2E2E2] border-[1.5px] border-[#111111] rounded-[14px] flex flex-col items-center justify-center overflow-hidden relative shadow-sm p-3">
                  {extractingCover ? (
                    <div className="flex flex-col items-center text-slate-500 py-6">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-2" />
                      <span className="text-sm font-medium">Génération de la couverture...</span>
                    </div>
                  ) : coverPreviewUrl || (editData && editData.coverUrl) ? (
                    <img
                      src={coverPreviewUrl || getFileUrl(editData.coverUrl)}
                      alt="Aperçu couverture complet"
                      className="w-full max-h-[230px] object-contain rounded-[8px]"
                    />
                  ) : (
                    <span className="text-sm text-slate-500 font-medium px-4 text-center py-6">
                      Sélectionnez un PDF pour générer la couverture.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="allowDownload"
                checked={formData.allowDownload}
                onChange={(e) => setFormData(prev => ({ ...prev, allowDownload: e.target.checked }))}
                className="w-4 h-4 rounded border-[#111111] text-[#111111] focus:ring-[#111111] accent-[#111111] cursor-pointer"
              />
              <label htmlFor="allowDownload" className="text-sm font-medium text-[#111111] cursor-pointer ">
                Autoriser le téléchargement du projet
              </label>
            </div>

            <div className="pt-3 border-t-[1.5px] border-[#111111] mt-4">
              {loading && uploadProgress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-medium text-[#111111] mb-1 font-mono">
                    <span>{editData ? 'Mise à jour en cours...' : 'Envoi en cours...'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 overflow-hidden border border-[#111111] rounded-full">
                    <div
                      className="h-full bg-[#111111] transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="h-10 sm:h-11 px-5 bg-[#EEEEEE] text-[#111111] rounded-full border-[1.5px] border-[#111111] text-sm font-medium hover:bg-[#E2E2E2] flex items-center justify-center transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 sm:h-11 px-6 bg-[#111111] text-[#EEEEEE] rounded-full border-[1.5px] border-[#111111] text-sm font-medium hover:bg-black flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50 min-w-[160px]"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>{editData ? 'Mise à jour...' : 'Envoi...'}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 stroke-[2.25]" />
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

export default SubmitModal;
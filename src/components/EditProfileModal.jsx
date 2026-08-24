import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Globe, Mail, Lock, ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import SearchableSchoolSelect from './SearchableSchoolSelect';
import { toast } from 'sonner';

/* Phosphor SVG Icon Components matching ProfileDrawer */
const IconBehance = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M160,80a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H168A8,8,0,0,1,160,80Zm-24,78a42,42,0,0,1-42,42H32a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H90a38,38,0,0,1,25.65,66A42,42,0,0,1,136,158ZM40,116H90a22,22,0,0,0,0-44H40Zm80,42a26,26,0,0,0-26-26H40v52H94A26,26,0,0,0,120,158Zm128-6a8,8,0,0,1-8,8H169a32,32,0,0,0,56.59,11.2,8,8,0,0,1,12.8,9.61A48,48,0,1,1,248,152Zm-17-8a32,32,0,0,0-62,0Z" />
  </svg>
);

const IconInstagram = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z" />
  </svg>
);

const IconLink = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M240,88.23a54.43,54.43,0,0,1-16,37L189.25,160a54.27,54.27,0,0,1-38.63,16h-.05A54.63,54.63,0,0,1,96,119.84a8,8,0,0,1,16,.45A38.62,38.62,0,0,0,150.58,160h0a38.39,38.39,0,0,0,27.31-11.31l34.75-34.75a38.63,38.63,0,0,0-54.63-54.63l-11,11A8,8,0,0,1,135.7,59l11-11A54.65,54.65,0,0,1,224,48,54.86,54.86,0,0,1,240,88.23ZM109,185.66l-11,11A38.41,38.41,0,0,1,70.6,208h0a38.63,38.63,0,0,1-27.29-65.94L78,107.31A38.63,38.63,0,0,1,144,135.71a8,8,0,0,0,16,.45A54.86,54.86,0,0,0,144,96a54.65,54.65,0,0,0-77.27,0L32,130.75A54.62,54.62,0,0,0,70.56,224h0a54.28,54.28,0,0,0,38.64-16l11-11A8,8,0,0,0,109,185.66Z" />
  </svg>
);

const IconEye = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M251,123.13c-.37-.81-9.13-20.26-28.48-39.61C196.63,57.67,164,44,128,44S59.37,57.67,33.51,83.52C14.16,102.87,5.4,122.32,5,123.13a12.08,12.08,0,0,0,0,9.75c.37.82,9.13,20.26,28.49,39.61C59.37,198.34,92,212,128,212s68.63-13.66,94.48-39.51c19.36-19.35,28.12-38.79,28.49-39.61A12.08,12.08,0,0,0,251,123.13Zm-46.06,33C183.47,177.27,157.59,188,128,188s-55.47-10.73-76.91-31.88A130.36,130.36,0,0,1,29.52,128,130.45,130.45,0,0,1,51.09,99.89C72.54,78.73,98.41,68,128,68s55.46,10.73,76.91,31.89A130.36,130.36,0,0,1,226.48,128,130.45,130.45,0,0,1,204.91,156.12ZM128,84a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,84Zm0,64a20,20,0,1,1,20-20A20,20,0,0,1,128,148Z" />
  </svg>
);

const IconEyeClosed = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M56.88,31.93A12,12,0,1,0,39.12,48.07l16,17.65C20.67,88.66,5.72,121.58,5,123.13a12.08,12.08,0,0,0,0,9.75c.37.82,9.13,20.26,28.49,39.61C59.37,198.34,92,212,128,212a131.34,131.34,0,0,0,51-10l20.09,22.1a12,12,0,0,0,17.76-16.14ZM128,188c-29.59,0-55.47-10.73-76.91-31.88A130.69,130.69,0,0,1,29.52,128c5.27-9.31,18.79-29.9,42-44.29l90.09,99.11A109.33,109.33,0,0,1,128,188Zm123-55.12c-.36.81-9,20-28,39.16a12,12,0,1,1-17-16.9A130.48,130.48,0,0,0,226.48,128a130.36,130.36,0,0,0-21.57-28.12C183.46,78.73,157.59,68,128,68c-3.35,0-6.7.14-10,.42a12,12,0,1,1-2-23.91c3.93-.34,8-.51,12-.51,36,0,68.63,13.67,94.49,39.52,19.35,19.35,28.11,38.8,28.48,39.61A12.08,12.08,0,0,1,251,132.88Z" />
  </svg>
);

export function EditProfileModal({ isOpen, onClose, userProfile, onSaveProfile }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    pseudo: '',
    displayPreference: 'NAME',
    role: 'Etudiant',
    currentSchool: '',
    email: '',
    newPassword: '',
    bio: '',
    behanceLink: '',
    instaLink: '',
    personalLink: ''
  });

  const backdropRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        pseudo: userProfile.pseudo || '',
        displayPreference: userProfile.displayPreference || 'NAME',
        role: userProfile.role || 'Etudiant',
        currentSchool: userProfile.currentSchool || '',
        email: userProfile.email || '',
        newPassword: '',
        bio: userProfile.bio || '',
        behanceLink: userProfile.behanceLink || '',
        instaLink: userProfile.instaLink || '',
        personalLink: userProfile.personalLink || ''
      });

      gsap.timeline()
        .fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
        .fromTo(modalRef.current, { opacity: 0, scale: 0.96, y: 12 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '-=0.15');
    }
  }, [isOpen, userProfile]);

  const handleClose = () => {
    if (modalRef.current && backdropRef.current) {
      gsap.timeline({ onComplete: onClose })
        .to(modalRef.current, { opacity: 0, scale: 0.96, y: 8, duration: 0.2, ease: 'power2.in' })
        .to(backdropRef.current, { opacity: 0, duration: 0.15 }, '-=0.1');
    } else {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Le prénom et le nom sont requis.");
      return;
    }

    if (formData.email && !formData.email.includes('@')) {
      toast.error("Veuillez saisir une adresse email valide.");
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    onSaveProfile(formData);
    toast.success("Profil mis à jour avec succès !");
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans font-medium text-[#111111] ">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleClose}
        className="fixed inset-0 bg-[#111111]/70 backdrop-blur-xs"
      />

      {/* Modal Dialog Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[14px] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] p-6 sm:p-8 transform-gpu"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          title="Fermer"
          className="absolute top-4 right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors cursor-pointer shadow-sm z-20"
        >
          <X className="w-4 h-4 stroke-[2.25]" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-1 pr-10">
          <User className="w-5 h-5 stroke-[2.25] text-[#111111]" />
          <h2 className="text-xl font-bold text-[#111111]">Modifier mon profil</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mb-4">
          Personnalise tes informations publiques et de connexion
        </p>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 flex-1 pr-1">
          {/* Identity inputs */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-[#111111] block mb-1">
                Prénom *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-[#111111] block mb-1">
                Nom *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Security / Identifiers Section */}
          <div className="pt-2">
            <div className="flex items-center my-3">
              <div className="flex-grow border-t-[1.5px] border-[#111111]"></div>
              <span className="px-3 text-xs font-bold text-[#111111] tracking-wider uppercase flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> IDENTIFIANTS & SÉCURITÉ
              </span>
              <div className="flex-grow border-t-[1.5px] border-[#111111]"></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs sm:text-sm font-medium text-slate-500 block mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Adresse e-mail (Non modifiable)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  readOnly
                  title="Vous ne pouvez pas modifier votre adresse e-mail."
                  className="w-full h-10 sm:h-11 bg-slate-100 border-[1.5px] border-slate-300 text-slate-500 rounded-full px-4 text-xs sm:text-sm font-medium focus:outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-[#111111] block mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#111111]" /> Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="•••••••• (inchangé si vide)"
                    className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full pl-4 pr-10 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#111111] hover:opacity-70 transition-opacity p-1 cursor-pointer"
                  >
                    {showPassword ? <IconEye className="w-4 h-4" /> : <IconEyeClosed className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Role & School */}

          <div>
            <label className="text-xs sm:text-sm font-medium text-[#111111] block mb-1">
              Statut / Rôle
            </label>
            <div className="relative">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full pl-4 pr-10 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all appearance-none cursor-pointer"
              >
                <option value="Etudiant">Étudiant(e)</option>
                <option value="Enseignant">Enseignant(e)</option>
                <option value="Alumni">Alumni</option>
                <option value="Autre">Autre</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 stroke-[2.25] text-[#111111] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-[#111111] block mb-1">
              Établissement / École
            </label>
            <SearchableSchoolSelect
              value={formData.currentSchool}
              onChange={(sch) => setFormData(prev => ({ ...prev, currentSchool: sch }))}
              placeholder="Rechercher une école..."
            />
          </div>


          {/* Bio / Description */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-[#111111] block mb-1">
              Biographie & Présentation
            </label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Décris tes compétences, domaines de recherche ou intentions créatives..."
              className="w-full p-3.5 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[14px] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500 leading-relaxed resize-none"
            />
          </div>

          {/* Social Links Section */}
          <div className="pt-2">
            <div className="flex items-center my-3">
              <div className="flex-grow border-t-[1.5px] border-[#111111]"></div>
              <span className="px-3 text-xs font-bold text-[#111111] tracking-wider uppercase flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> LIENS EXTERNES & RÉSEAUX
              </span>
              <div className="flex-grow border-t-[1.5px] border-[#111111]"></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#111111] block mb-1 flex items-center gap-1.5">
                  <IconBehance className="w-4 h-4 text-[#111111]" /> Lien Behance
                </label>
                <input
                  type="url"
                  name="behanceLink"
                  value={formData.behanceLink}
                  onChange={handleChange}
                  placeholder="https://behance.net/ton-profil"
                  className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#111111] block mb-1 flex items-center gap-1.5">
                  <IconInstagram className="w-4 h-4 text-[#111111]" /> Lien Instagram
                </label>
                <input
                  type="url"
                  name="instaLink"
                  value={formData.instaLink}
                  onChange={handleChange}
                  placeholder="https://instagram.com/ton-pseudo"
                  className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#111111] block mb-1 flex items-center gap-1.5">
                  <IconLink className="w-4 h-4 text-[#111111]" /> Site web personnel
                </label>
                <input
                  type="url"
                  name="personalLink"
                  value={formData.personalLink}
                  onChange={handleChange}
                  placeholder="https://ton-site.com"
                  className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t-[1.5px] border-[#111111] flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="h-10 sm:h-11 px-5 bg-[#EEEEEE] text-[#111111] rounded-full border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-[#E2E2E2] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="h-10 sm:h-11 px-6 bg-[#111111] text-[#EEEEEE] rounded-full border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-black flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4 stroke-[2.25]" />
              <span>Enregistrer les modifications</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
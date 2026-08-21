import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Globe, Instagram, ExternalLink } from 'lucide-react';
import gsap from 'gsap';
import { SCHOOLS_LIST } from '../data/coversData';
import { toast } from 'sonner';

export function EditProfileModal({ isOpen, onClose, userProfile, onSaveProfile }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'Etudiant',
    currentSchool: '',
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
        role: userProfile.role || 'Étudiant en Design',
        currentSchool: userProfile.currentSchool || SCHOOLS_LIST[1] || 'ÉNSAD Paris',
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

    onSaveProfile(formData);
    toast.success("Profil fictif mis à jour avec succès !");
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans select-none">
      {/* Backdrop */}
      <div 
        ref={backdropRef} 
        onClick={handleClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
      />

      {/* Modal Container */}
      <div 
        ref={modalRef} 
        className="relative w-full max-w-xl bg-[#EEEEEE] border-2 border-[#111111] shadow-[8px_8px_0_#111111] overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#111111] p-6 bg-[#EEEEEE]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#111111] text-[#EEEEEE] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111111]">Modifier mon profil</h2>
              <p className="text-xs text-slate-600">Personnalise tes informations publiques (mode fictif)</p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="w-8 h-8 border-2 border-[#111111] flex items-center justify-center hover:bg-[#111111] hover:text-[#EEEEEE] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Identity inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Prénom *
              </label>
              <input 
                type="text" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border-2 border-[#111111] text-sm text-[#111111] focus:outline-none focus:bg-slate-50 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Nom *
              </label>
              <input 
                type="text" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border-2 border-[#111111] text-sm text-[#111111] focus:outline-none focus:bg-slate-50 font-medium"
              />
            </div>
          </div>

          {/* Role & School */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Statut / Rôle
              </label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border-2 border-[#111111] text-sm text-[#111111] focus:outline-none font-medium cursor-pointer"
              >
                <option value="Étudiant en Design">Étudiant en Design</option>
                <option value="Étudiant en Architecture">Étudiant en Architecture</option>
                <option value="Designer Indépendant">Designer Indépendant</option>
                <option value="Enseignant / Chercheur">Enseignant / Chercheur</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Établissement / École
              </label>
              <input 
                type="text" 
                name="currentSchool" 
                value={formData.currentSchool} 
                onChange={handleChange}
                placeholder="ex: ÉNSAD Paris, École Boulle..."
                className="w-full px-3 py-2 bg-white border-2 border-[#111111] text-sm text-[#111111] focus:outline-none focus:bg-slate-50 font-medium"
              />
            </div>
          </div>

          {/* Bio / Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
              Biographie & Présentation
            </label>
            <textarea 
              name="bio" 
              rows={3} 
              value={formData.bio} 
              onChange={handleChange}
              placeholder="Décris tes compétences, domaines de recherche ou intentions créatives..."
              className="w-full px-3 py-2 bg-white border-2 border-[#111111] text-sm text-[#111111] focus:outline-none focus:bg-slate-50 font-medium leading-relaxed resize-none"
            />
          </div>

          {/* Social Links Section */}
          <div className="pt-2 border-t-2 border-[#111111]/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-3 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Liens Externes & Réseaux
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <span className="font-serif font-bold text-xs">Bē</span> Lien Behance
                </label>
                <input 
                  type="url" 
                  name="behanceLink" 
                  value={formData.behanceLink} 
                  onChange={handleChange}
                  placeholder="https://behance.net/ton-profil"
                  className="w-full px-3 py-1.5 bg-white border-2 border-[#111111] text-xs text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Instagram className="w-3 h-3 text-[#111111]" /> Lien Instagram
                </label>
                <input 
                  type="url" 
                  name="instaLink" 
                  value={formData.instaLink} 
                  onChange={handleChange}
                  placeholder="https://instagram.com/ton-pseudo"
                  className="w-full px-3 py-1.5 bg-white border-2 border-[#111111] text-xs text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3 text-[#111111]" /> Site web personnel / Portfolio
                </label>
                <input 
                  type="url" 
                  name="personalLink" 
                  value={formData.personalLink} 
                  onChange={handleChange}
                  placeholder="https://ton-site.com"
                  className="w-full px-3 py-1.5 bg-white border-2 border-[#111111] text-xs text-[#111111] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t-2 border-[#111111]">
            <button 
              type="button" 
              onClick={handleClose}
              className="px-5 py-2.5 border-2 border-[#111111] bg-white text-xs font-bold text-[#111111] hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 border-2 border-[#111111] bg-[#111111] text-[#EEEEEE] text-xs font-bold flex items-center gap-2 hover:bg-black transition-colors"
            >
              <Save className="w-4 h-4 stroke-[2.25]" />
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

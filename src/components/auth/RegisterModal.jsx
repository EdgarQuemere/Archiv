import React, { useState, useEffect, useRef, useContext } from 'react';
import { X, UserPlus } from 'lucide-react';
import gsap from 'gsap';
import { AuthContext } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { SCHOOLS_LIST } from '../../data/coversData';

export function RegisterModal({ isOpen, onClose, onOpenLogin, onSuccess }) {
  const { register, googleAuth, omniscientAuth } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Etudiant',
    currentSchool: SCHOOLS_LIST[1] || '',
    behanceLink: '',
    instaLink: '',
    personalLink: ''
  });

  const [step, setStep] = useState(1);
  const [googleToken, setGoogleToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const backdropRef = useRef(null);
  const dialogRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('omni_token');
      const partial = localStorage.getItem('omni_partial');
      if (token && partial) {
        const data = JSON.parse(partial);
        setFormData(prev => ({ ...prev, ...data }));
        setStep(2);
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          currentSchool: SCHOOLS_LIST[1] || '',
          role: 'Etudiant',
          behanceLink: '',
          instaLink: '',
          personalLink: ''
        });
        setError('');
        setStep(1);
        setGoogleToken(null);
      }
      gsap.timeline()
        .fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
        .fromTo(dialogRef.current, { opacity: 0, scale: 0.95, y: 15 }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.15');
    }
  }, [isOpen]);

  const handleClose = () => {
    if (dialogRef.current && backdropRef.current) {
      gsap.timeline({ onComplete: onClose })
        .to(dialogRef.current, { opacity: 0, scale: 0.95, y: 10, duration: 0.2, ease: 'power2.in' })
        .to(backdropRef.current, { opacity: 0, duration: 0.15 }, '-=0.1');
    } else {
      onClose();
    }
  };

  const handleSwitchToLogin = () => {
    gsap.timeline({ onComplete: () => { onClose(); onOpenLogin(); } })
      .to(dialogRef.current, { opacity: 0, scale: 0.95, duration: 0.2 })
      .to(backdropRef.current, { opacity: 0, duration: 0.15 }, '-=0.1');
  };

  if (!isOpen) return null;

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      await googleAuth(credentialResponse.credential);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.requireMoreInfo) {
        const decoded = jwtDecode(credentialResponse.credential);
        setGoogleToken(credentialResponse.credential);
        setFormData(prev => ({
          ...prev,
          firstName: decoded.given_name || '',
          lastName: decoded.family_name || '',
          email: decoded.email
        }));
        setStep(2);
      } else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Une erreur est survenue avec Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOmniscientLogin = () => {
    const omniUrl = import.meta.env.VITE_OMNISCIENT_URL || 'https://omniscientdesign.fr';
    const redirectUri = `${window.location.origin}/auth/omniscient/callback`;
    const clientId = import.meta.env.VITE_OMNISCIENT_CLIENT_ID;

    if (clientId) {
      window.location.href = `${omniUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
        setError('Veuillez remplir tous les champs obligatoires.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
      setError('');
      setStep(2);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const omniToken = localStorage.getItem('omni_token');
      if (omniToken) {
        await omniscientAuth(undefined, { omniToken, ...formData });
        localStorage.removeItem('omni_token');
        localStorage.removeItem('omni_partial');
      } else if (googleToken) {
        await googleAuth(googleToken, formData);
      } else {
        await register(formData);
      }
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Une erreur est survenue lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-sans text-[#111111]">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-[#111111]/70 backdrop-blur-xs"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div
        ref={dialogRef}
        className="relative bg-[#EEEEEE] rounded-[10px] shadow-2xl max-w-md w-full z-10 border-[1.5px] border-[#111111] p-6 sm:p-8 transform-gpu"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          title="Fermer"
          className="absolute top-4 right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
        >
          <X className="w-4 h-4 stroke-[2.25]" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-1">
            <UserPlus className="w-5 h-5 stroke-[2.25] text-[#111111]" />
            <h2 className="text-xl font-bold text-[#111111]">
              S'inscrire {step === 2 && "(Profil)"}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mb-4">
            Créez votre compte pour commencer à publier.
          </p>

          {error && (
            <div className="p-3 bg-red-100 border-[1.5px] border-red-400 text-red-700 text-xs font-medium rounded-full text-center mb-3">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="mb-4 space-y-3">
              <button
                type="button"
                onClick={handleOmniscientLogin}
                className="w-full h-[40px] bg-[#111111] text-[#EEEEEE] rounded-[4px] border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-black flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-sm"
              >
                <img src="/omniscient_logo_white.svg" alt="Omniscient Design" className="h-4 w-auto object-contain" />
                <span>Continuer avec Omniscient Design</span>
              </button>

              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("La connexion avec Google a échoué.")}
                  useOneTap
                  theme="filled_black"
                  shape="rectangular"
                  width="320"
                />
              </div>

              <div className="flex items-center my-4">
                <div className="flex-grow border-t-[1.5px] border-[#111111]"></div>
                <span className="px-3 text-xs font-bold text-[#111111] tracking-wider">OU AVEC EMAIL</span>
                <div className="flex-grow border-t-[1.5px] border-[#111111]"></div>
              </div>
            </div>
          )}

          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs sm:text-sm font-medium block mb-1">Prénom *</label>
                  <input
                    required
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium block mb-1">Nom *</label>
                  <input
                    required
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium block mb-1">Email *</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium block mb-1">Mot de passe *</label>
                <input
                  required
                  type="password"
                  name="password"
                  minLength="6"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium block mb-1">Confirmer *</label>
                <input
                  required
                  type="password"
                  name="confirmPassword"
                  minLength="6"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs sm:text-sm font-medium block mb-1">Rôle *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
                  >
                    <option value="Etudiant">Étudiant(e)</option>
                    <option value="Enseignant">Enseignant(e)</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium block mb-1">École *</label>
                  <select
                    name="currentSchool"
                    value={formData.currentSchool}
                    onChange={handleChange}
                    className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
                  >
                    {SCHOOLS_LIST.filter(s => s !== "Toutes les écoles").map((sch) => (
                      <option key={sch} value={sch}>{sch}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium block mb-1">Lien Behance (Optionnel)</label>
                <input
                  type="url"
                  name="behanceLink"
                  value={formData.behanceLink}
                  onChange={handleChange}
                  placeholder="https://behance.net/..."
                  className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium block mb-1">Lien Instagram (Optionnel)</label>
                <input
                  type="url"
                  name="instaLink"
                  value={formData.instaLink}
                  onChange={handleChange}
                  placeholder="https://instagram.com/..."
                  className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
                />
              </div>
            </>
          )}

          {/* Submit Action */}
          <div className="pt-3 border-t-[1.5px] border-[#111111] flex flex-col gap-2.5 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 sm:h-11 px-5 bg-[#111111] text-[#EEEEEE] rounded-full border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-black flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 stroke-[2.25]" />
              )}
              <span>{step === 1 ? 'Suivant' : (loading ? 'Création...' : 'Créer un compte')}</span>
            </button>
            <button
              type="button"
              onClick={handleSwitchToLogin}
              className="w-full text-xs sm:text-sm text-[#111111] font-medium underline hover:opacity-75 transition-opacity py-1 cursor-pointer"
            >
              Déjà un compte ? Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterModal;

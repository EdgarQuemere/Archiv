import React, { useState, useEffect, useRef, useContext } from 'react';
import { X, UserPlus, ChevronDown, Check, UploadCloud } from 'lucide-react';
import gsap from 'gsap';
import { AuthContext } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { SCHOOLS_LIST } from '../../utils/constants';
import api from '../../api/axios';

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

export function RegisterModal({ isOpen, onClose, onOpenLogin, onSuccess }) {
  const { register, googleAuth, omniscientAuth } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    pseudo: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Etudiant',
    currentSchool: SCHOOLS_LIST[1] || '',
    behanceLink: '',
    instaLink: '',
    personalLink: ''
  });

  // Critères du mot de passe
  const hasMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);
  const allCriteriaMet = hasMinLength && hasUppercase && hasNumber && hasSpecial;
  const showCriteria = formData.password.length > 0 && !allCriteriaMet;

  const [step, setStep] = useState(1);
  const [googleToken, setGoogleToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const backdropRef = useRef(null);
  const dialogRef = useRef(null);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.addEventListener('load', () => setAvatarPreview(reader.result?.toString() || null));
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('omni_token');
      const partial = localStorage.getItem('omni_partial');
      const storedGoogleToken = localStorage.getItem('google_token');

      if (token && partial) {
        const data = JSON.parse(partial);
        setFormData(prev => ({ ...prev, ...data }));
        setStep(2);
      } else if (storedGoogleToken) {
        try {
          const decoded = jwtDecode(storedGoogleToken);
          setGoogleToken(storedGoogleToken);
          setFormData(prev => ({
            ...prev,
            firstName: decoded.given_name || '',
            lastName: decoded.family_name || '',
            email: decoded.email
          }));
          setStep(2);
        } catch (e) {
          console.error("Invalid stored google token", e);
          setStep(1);
        }
        localStorage.removeItem('google_token');
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          pseudo: '',
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
        if (avatarFile) {
          const formDataPayload = new FormData();
          Object.keys(formData).forEach(key => {
            formDataPayload.append(key, formData[key]);
          });
          formDataPayload.append('profilePicture', avatarFile);
          await register(formDataPayload);
        } else {
          await register(formData);
        }
      }
      
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.errors && err.response.data.errors.length > 0) {
          setError(err.response.data.errors[0].msg);
        } else if (err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError("Une erreur est survenue lors de l'inscription.");
        }
      } else {
        setError("Une erreur de réseau est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 font-sans text-[#111111]">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-[#111111]/70 backdrop-blur-xs"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div
        ref={dialogRef}
        className="relative bg-[#EEEEEE] rounded-[10px] shadow-2xl max-w-md w-full z-10 border-[1.5px] border-[#111111] p-5 sm:p-8 transform-gpu max-h-[90vh] overflow-y-auto"
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
                <label className="text-xs sm:text-sm font-medium block mb-1">Pseudo (Optionnel)</label>
                <input
                  type="text"
                  name="pseudo"
                  value={formData.pseudo}
                  onChange={handleChange}
                  placeholder="Ton pseudo (min 3 caractères)"
                  className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
                />
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
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    name="password"
                    minLength="8"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full pl-4 pr-10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
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
                {/* Critères du mot de passe */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showCriteria ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
                  }`}
                >
                  <div className="flex flex-col gap-1.5 text-[10px] sm:text-xs pl-2">
                    <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600' : 'text-slate-500'}`}>
                      {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400 ml-1 mr-1" />}
                      <span>Au moins 8 caractères</span>
                    </div>
                    <div className={`flex items-center gap-2 ${hasUppercase ? 'text-green-600' : 'text-slate-500'}`}>
                      {hasUppercase ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400 ml-1 mr-1" />}
                      <span>Une majuscule minimum</span>
                    </div>
                    <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-600' : 'text-slate-500'}`}>
                      {hasNumber ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400 ml-1 mr-1" />}
                      <span>Un chiffre minimum</span>
                    </div>
                    <div className={`flex items-center gap-2 ${hasSpecial ? 'text-green-600' : 'text-slate-500'}`}>
                      {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400 ml-1 mr-1" />}
                      <span>Un caractère spécial minimum</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium block mb-1">Confirmer *</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    minLength="6"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full pl-4 pr-10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
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
            </>
          ) : (
            <>
              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-4">
                <div 
                  className="relative w-20 h-20 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[10px] overflow-hidden cursor-pointer group shadow-sm flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-[#111111] transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <span className="text-[9px] font-bold uppercase text-center leading-tight">Photo</span>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={formData.role === 'Autre' ? "col-span-2" : ""}>
                  <label className="text-xs sm:text-sm font-medium block mb-1">Rôle *</label>
                  <div className="relative">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full pl-4 pr-10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20 appearance-none cursor-pointer"
                    >
                      <option value="Etudiant">Étudiant(e)</option>
                      <option value="Enseignant">Enseignant(e)</option>
                      <option value="Alumni">Alumni</option>
                      <option value="Autre">Autre</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 stroke-[2.25] text-[#111111] pointer-events-none" />
                  </div>
                </div>
                {formData.role !== 'Autre' && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium block mb-1">École *</label>
                    <div className="relative">
                      <select
                        name="currentSchool"
                        value={formData.currentSchool}
                        onChange={handleChange}
                        className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full pl-4 pr-10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20 appearance-none cursor-pointer"
                      >
                        {SCHOOLS_LIST.filter(s => s !== "Toutes les écoles").map((sch) => (
                          <option key={sch} value={sch}>{sch}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 stroke-[2.25] text-[#111111] pointer-events-none" />
                    </div>
                  </div>
                )}
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

              <div>
                <label className="text-xs sm:text-sm font-medium block mb-1">Lien Perso / Book (Optionnel)</label>
                <input
                  type="url"
                  name="personalLink"
                  value={formData.personalLink}
                  onChange={handleChange}
                  placeholder="https://mon-site.com"
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

import React, { useState, useEffect, useRef, useContext } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { X, UserPlus, ChevronDown, Check, UploadCloud } from 'lucide-react';
import gsap from 'gsap';
import { AuthContext } from '../../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import SearchableSchoolSelect from '../SearchableSchoolSelect';
import SEO from '../SEO';

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

export function RegisterModal({ isOpen, onClose, onOpenLogin, isOAuthCompletion = false }) {
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
    currentSchool: '',
    behanceLink: '',
    instaLink: '',
    personalLink: '',
    cguAccepted: false
  });

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
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const backdropRef = useRef(null);
  const dialogRef = useRef(null);

  const handleClose = () => {
    localStorage.removeItem('omni_token');
    localStorage.removeItem('omni_partial');
    localStorage.removeItem('google_token');
    setGoogleToken(null);
    setEmailSent(false);
    setRegisteredEmail('');
    setError('');

    if (dialogRef.current && backdropRef.current) {
      gsap.timeline({ onComplete: onClose })
        .to(dialogRef.current, { opacity: 0, scale: 0.95, y: 10, duration: 0.2, ease: 'power2.in' })
        .to(backdropRef.current, { opacity: 0, duration: 0.15 }, '-=0.1');
    } else {
      onClose();
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      await googleAuth(credentialResponse.credential || credentialResponse.access_token);
      handleClose();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.requireMoreInfo) {
        if (credentialResponse.credential) {
          const decoded = jwtDecode(credentialResponse.credential);
          setGoogleToken(credentialResponse.credential);
          setFormData(prev => ({
            ...prev,
            firstName: decoded.given_name || '',
            lastName: decoded.family_name || '',
            email: decoded.email || ''
          }));
        }
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

  const handleGoogleClick = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("La connexion avec Google a échoué.")
  });

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(<span>L'image de profil ne doit pas dépasser <br /> 5 Mo.</span>);
      return;
    }
    setError('');
    setAvatarFile(file);
    const reader = new FileReader();
    reader.addEventListener('load', () => setAvatarPreview(reader.result?.toString() || null));
    reader.readAsDataURL(file);
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        setError(<span>L'image de profil ne doit pas dépasser <br /> 5 Mo.</span>);
        return;
      }
      setError('');
      setAvatarFile(file);
      const reader = new FileReader();
      reader.addEventListener('load', () => setAvatarPreview(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('omni_token');
      const partial = localStorage.getItem('omni_partial');
      const storedGoogleToken = localStorage.getItem('google_token');

      setEmailSent(false);
      setError('');

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
            email: decoded.email || ''
          }));
          setStep(2);
        } catch (e) {
          console.error("Invalid stored google token", e);
          setStep(1);
        }
        localStorage.removeItem('google_token');
      } else if (isOAuthCompletion) {
        setStep(2);
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          pseudo: '',
          email: '',
          password: '',
          confirmPassword: '',
          currentSchool: '',
          role: 'Etudiant',
          behanceLink: '',
          instaLink: '',
          personalLink: ''
        });
        setStep(1);
        setGoogleToken(null);
      }

      if (backdropRef.current && dialogRef.current) {
        gsap.timeline()
          .fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
          .fromTo(dialogRef.current, { opacity: 0, scale: 0.95, y: 15 }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.15');
      }
    }
  }, [isOpen, isOAuthCompletion]);

  const handleSwitchToLogin = () => {
    if (dialogRef.current && backdropRef.current) {
      gsap.timeline({ onComplete: () => { onClose(); onOpenLogin(); } })
        .to(dialogRef.current, { opacity: 0, scale: 0.95, duration: 0.2 })
        .to(backdropRef.current, { opacity: 0, duration: 0.15 }, '-=0.1');
    } else {
      onClose();
      onOpenLogin();
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

    if (!formData.pseudo || formData.pseudo.trim().length < 3) {
      setError('Le pseudo est obligatoire (3 caractères minimum).');
      return;
    }

    if (!formData.cguAccepted) {
      setError('Vous devez accepter les mentions légales et la politique de confidentialité pour créer un compte.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const omniToken = localStorage.getItem('omni_token');
      const isOAuth = Boolean(omniToken || googleToken || isOAuthCompletion);

      if (omniToken) {
        await omniscientAuth(undefined, { omniToken, ...formData });
        localStorage.removeItem('omni_token');
        localStorage.removeItem('omni_partial');
        handleClose();
        return;
      }

      if (googleToken) {
        await googleAuth(googleToken, formData);
        handleClose();
        return;
      }

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

      if (!isOAuth) {
        setRegisteredEmail(formData.email || '');
        setEmailSent(true);
      } else {
        handleClose();
      }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 font-sans font-medium text-[#111111]">
      <SEO
        title="Créer un compte | Artchiv'"
        description="Rejoignez la communauté Artchiv' pour partager vos portfolios, books et mémoires de fin d'études en design."
        url="/inscription"
      />
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-[#111111]/70 backdrop-blur-xs"
        onClick={handleClose}
      />

      <div
        ref={dialogRef}
        className="relative bg-[#EEEEEE] rounded-[10px] shadow-2xl max-w-md w-full z-10 border-[1.5px] border-[#111111] p-5 sm:p-8 transform-gpu max-h-[90vh] overflow-y-auto"
      >
        {emailSent ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#111111] flex items-center justify-center mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="white" className="w-7 h-7">
                <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-3 text-[#111111]">Un email de confirmation<br />vous a été envoyé</h2>
            <p className="text-sm text-[#555555] leading-relaxed mb-1">
              Nous avons envoyé un lien de vérification à :
            </p>
            <p className="text-sm font-semibold text-[#111111] mb-5">{registeredEmail}</p>
            <p className="text-xs text-[#888888] leading-relaxed mb-6">
              Cliquez sur le lien dans l'email pour activer votre compte.<br />
              Le lien est valide pendant 24 heures.
            </p>
            <button
              onClick={handleClose}
              className="w-full h-11 rounded-full bg-[#111111] text-white font-semibold text-sm hover:opacity-80 transition-opacity cursor-pointer"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleClose}
              title="Fermer"
              className="absolute top-4 right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
            >
              <X className="w-4 h-4 stroke-[2.25]" />
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="mb-4 space-y-2.5 w-full">
                  <button
                    type="button"
                    onClick={handleOmniscientLogin}
                    className="w-full h-[40px] bg-[#111111] text-[#EEEEEE] rounded-[4px] border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-black flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-sm"
                  >
                    <img src="/omniscient_logo_white.svg" alt="Omniscient Design" className="h-4 w-auto object-contain" />
                    <span>S'inscrire avec Omniscient Design</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGoogleClick()}
                    className="w-full h-[40px] bg-[#111111] text-[#EEEEEE] rounded-[4px] border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-black flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>S'inscrire avec Google</span>
                  </button>

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
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${showCriteria ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}
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
                  <div className="flex flex-col items-center mb-4">
                    <div
                      className="relative w-20 h-20 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[10px] overflow-hidden cursor-pointer group shadow-sm flex items-center justify-center"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={handleAvatarDrop}
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
                    <span className="text-[11px] font-mono text-slate-500 mt-1.5">Max 5 Mo (JPEG, PNG, WebP)</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                    />
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium block mb-1">Pseudo *</label>
                    <input
                      required
                      type="text"
                      name="pseudo"
                      value={formData.pseudo}
                      onChange={handleChange}
                      placeholder="Ton pseudo (min 3 caractères)"
                      className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
                    />
                  </div>

                  <div>
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

                  <div>
                    {formData.role !== 'Autre' && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium block mb-1">École *</label>
                        <SearchableSchoolSelect
                          value={formData.currentSchool}
                          onChange={(sch) => setFormData(prev => ({ ...prev, currentSchool: sch }))}
                          placeholder="Rechercher une école..."
                        />
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
                    <label className="text-xs sm:text-sm font-medium block mb-1">Lien Perso (Optionnel)</label>
                    <input
                      type="url"
                      name="personalLink"
                      value={formData.personalLink}
                      onChange={handleChange}
                      placeholder="https://mon-site.com"
                      className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]/20"
                    />
                  </div>

                  {/* RGPD & CGU Consent Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="cguAccepted"
                        checked={formData.cguAccepted}
                        onChange={(e) => setFormData(prev => ({ ...prev, cguAccepted: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 rounded border-[1.5px] border-[#111111] accent-[#111111] cursor-pointer shrink-0"
                      />
                      <span className="text-[11px] sm:text-xs text-slate-700 leading-snug">
                        J'accepte les{' '}
                        <a 
                          href="/mentions-legales" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="font-bold underline text-[#111111] hover:opacity-80"
                        >
                          mentions légales
                        </a>{' '}
                        et la{' '}
                        <a 
                          href="/politique-confidentialite" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="font-bold underline text-[#111111] hover:opacity-80"
                        >
                          politique de confidentialité
                        </a>.
                      </span>
                    </label>
                  </div>
                </>
              )}

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
                  <span>{step === 1 ? 'Suivant' : (loading ? 'Création...' : 'Terminer')}</span>
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
          </>
        )}
      </div>
    </div>
  );
}

export default RegisterModal;
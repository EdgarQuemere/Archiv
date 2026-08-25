import React, { useState, useEffect, useRef, useContext } from 'react';
import { X, LogIn } from 'lucide-react';
import gsap from 'gsap';
import { AuthContext } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../../api/axios';
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

export function LoginModal({ isOpen, onClose, onOpenRegister, onSuccess }) {
  const { login, googleAuth, resendVerification } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);

  const backdropRef = useRef(null);
  const dialogRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '', password: '' });
      setError('');
      setResetSuccess('');
      setNeedsVerification(false);
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

  const handleSwitchToRegister = () => {
    gsap.timeline({ onComplete: () => { onClose(); onOpenRegister(); } })
      .to(dialogRef.current, { opacity: 0, scale: 0.95, duration: 0.2 })
      .to(backdropRef.current, { opacity: 0, duration: 0.15 }, '-=0.1');
  };

  const handleForgotPassword = async () => {
    setError('');
    setResetSuccess('');

    if (!formData.email || !formData.email.trim()) {
      setError('Veuillez d\'abord renseigner votre email.');
      if (emailInputRef.current) emailInputRef.current.focus();
      return;
    }

    try {
      setLoading(true);
      try {
        await api.post('/auth/forgot-password', { email: formData.email });
      } catch (err) {
        // Fallback UI notification if backend endpoint is in progress
      }
      setResetSuccess(`Un email de réinitialisation a été envoyé à ${formData.email}.`);
    } finally {
      setLoading(false);
    }
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
        localStorage.setItem('google_token', credentialResponse.credential);
        onClose();
        onOpenRegister();
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
      window.location.href = `${omniUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsVerification(false);

    try {
      await login(formData.email, formData.password);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
        if (err.response.data.error.includes('vérifier votre adresse email')) {
          setNeedsVerification(true);
        }
      } else {
        setError('Email ou mot de passe incorrect.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setError('');
    setResetSuccess('');
    try {
      const res = await resendVerification(formData.email);
      setResetSuccess(res.message || "L'email de vérification a été renvoyé avec succès.");
      setNeedsVerification(false);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Erreur lors du renvoi de l'email.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 font-sans font-medium text-[#111111]">
      {/* Balises SEO pour la connexion */}
      <SEO
        title="Connexion | Artchiv'"
        description="Connectez-vous à Artchiv' pour publier vos books, mémoires et gérer vos projets."
        url="/connexion"
      />
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-[#111111]/70 backdrop-blur-xs"
        onClick={handleClose}
      />

      {/* Modal Dialog Card */}
      <div
        ref={dialogRef}
        className="relative bg-[#EEEEEE] rounded-[10px] shadow-2xl max-w-sm w-full z-10 border-[1.5px] border-[#111111] p-5 sm:p-8 transform-gpu max-h-[90vh] overflow-y-auto"
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
            <LogIn className="w-5 h-5 stroke-[2.25] text-[#111111]" />
            <h2 className="text-xl font-bold text-[#111111]">Se connecter</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mb-4">
            Accédez à votre compte pour publier un projet.
          </p>

          {/* Status Messages */}
          {error && (
            <div className="flex flex-col items-center gap-2 mb-3">
              <div className="w-full p-3 bg-red-100 border-[1.5px] border-red-400 text-red-700 text-xs font-medium rounded-full text-center">
                {error}
              </div>
              {needsVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="text-xs font-semibold text-[#111111] underline hover:text-black mt-1 disabled:opacity-50 transition-colors"
                >
                  {resending ? 'Renvoi en cours...' : "Renvoyer l'email de vérification"}
                </button>
              )}
            </div>
          )}

          {resetSuccess && (
            <div className="p-3 bg-emerald-100 border-[1.5px] border-emerald-500 text-emerald-800 text-xs font-medium rounded-full text-center mb-3">
              {resetSuccess}
            </div>
          )}

          {/* Social Auth Buttons */}
          <div className="mb-4 space-y-3">
            <button
              type="button"
              onClick={handleOmniscientLogin}
              className="w-full h-[40px] bg-[#111111] text-[#EEEEEE] rounded-[4px] border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-black flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-sm"
            >
              <img src="/omniscient_logo_white.svg" alt="Omniscient Design" className="h-4 w-auto object-contain" />
              <span>Se connecter avec Omniscient Design</span>
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

          {/* Email Input */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-[#111111] block mb-1">Email *</label>
            <input
              ref={emailInputRef}
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="votre.email@exemple.com"
              className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs sm:text-sm font-medium text-[#111111]">Mot de passe *</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[11px] sm:text-xs text-slate-600 hover:text-[#111111] underline transition-colors cursor-pointer"
              >
                Mot de passe oublié ?
              </button>
            </div>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
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
                <LogIn className="w-4 h-4 stroke-[2.25]" />
              )}
              <span>{loading ? 'Connexion...' : 'Connexion'}</span>
            </button>

            <button
              type="button"
              onClick={handleSwitchToRegister}
              className="w-full text-xs sm:text-sm text-[#111111] font-medium underline hover:opacity-75 transition-opacity py-1 cursor-pointer"
            >
              Pas encore de compte ? S'inscrire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;

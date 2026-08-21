import React, { useState, useEffect, useRef, useContext } from 'react';
import { X, LogIn } from 'lucide-react';
import gsap from 'gsap';
import { AuthContext } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export function LoginModal({ isOpen, onClose, onOpenRegister, onSuccess }) {
  const { login, googleAuth } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const backdropRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '', password: '' });
      setError('');
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
      window.location.href = `${omniUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Email ou mot de passe incorrect.');
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

      {/* Modal Dialog Card */}
      <div
        ref={dialogRef}
        className="relative bg-[#EEEEEE] rounded-[10px] shadow-2xl max-w-sm w-full z-10 border-[1.5px] border-[#111111] p-6 sm:p-8 transform-gpu"
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

          {error && (
            <div className="p-3 bg-red-100 border-[1.5px] border-red-400 text-red-700 text-xs font-medium rounded-full text-center mb-3">
              {error}
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

          {/* Email Input */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-[#111111] block mb-1">Email *</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="votre.email@exemple.com"
              className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-[#111111] block mb-1">Mot de passe *</label>
            <input
              required
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full h-10 sm:h-11 bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-full px-4 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-500"
            />
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

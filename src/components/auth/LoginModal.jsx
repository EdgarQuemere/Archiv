import React, { useState, useEffect, useRef, useContext } from 'react';
import { X, LogIn } from 'lucide-react';
import gsap from 'gsap';
import { AuthContext } from '../../context/AuthContext';

export function LoginModal({ isOpen, onClose, onOpenRegister, onSuccess }) {
  const { login } = useContext(AuthContext);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-[#111111]">
      <div ref={backdropRef} className="fixed inset-0 bg-[#111111]/70 backdrop-blur-sm" onClick={handleClose} />
      
      <div ref={dialogRef} className="relative bg-[#EEEEEE] rounded-none shadow-2xl max-w-sm w-full z-10 border-2 border-[#111111] p-6 sm:p-8 transform-gpu">
        <button onClick={handleClose} className="absolute top-4 right-4 text-[#111111] hover:opacity-60 p-1.5 rounded-none">
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <LogIn className="w-5 h-5 text-[#111111]" />
            <h2 className="text-lg font-bold text-[#111111]">Se connecter</h2>
          </div>
          <p className="text-xs text-slate-600 mb-4">Accédez à votre compte pour publier un projet.</p>

          {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-xs font-semibold">{error}</div>}

          <div>
            <label className="text-xs font-semibold block mb-1">Email *</label>
            <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none" />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Mot de passe *</label>
            <input required type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none" />
          </div>

          <div className="pt-3 border-t-2 border-[#111111] flex flex-col gap-3 mt-4">
            <button type="submit" disabled={loading} className="w-full px-5 py-2.5 bg-[#111111] text-[#EEEEEE] rounded-none text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
              <span>{loading ? 'Connexion...' : 'Connexion'}</span>
            </button>
            <button type="button" onClick={handleSwitchToRegister} className="w-full text-xs text-[#111111] font-semibold underline hover:text-slate-600">
              Pas encore de compte ? S'inscrire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

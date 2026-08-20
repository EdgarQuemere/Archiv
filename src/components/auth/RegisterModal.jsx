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
    const omniUrl = import.meta.env.VITE_OMNISCIENT_URL || 'https://omniscientdesign.com';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-[#111111]">
      <div ref={backdropRef} className="fixed inset-0 bg-[#111111]/70 backdrop-blur-sm" onClick={handleClose} />
      
      <div ref={dialogRef} className="relative bg-[#EEEEEE] rounded-none shadow-2xl max-w-md w-full z-10 border-2 border-[#111111] p-6 sm:p-8 transform-gpu">
        <button onClick={handleClose} className="absolute top-4 right-4 text-[#111111] hover:opacity-60 p-1.5 rounded-none">
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-[#111111]" />
            <h2 className="text-lg font-bold text-[#111111]">S'inscrire {step === 2 && "(Profil)"}</h2>
          </div>
          <p className="text-xs text-slate-600 mb-4">Créez votre compte pour commencer à publier.</p>

          {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-xs font-semibold mb-4">{error}</div>}


          {step === 1 && (
            <div className="mb-4">
              
              <button
                type="button"
                onClick={handleOmniscientLogin}
                className="w-full px-5 py-2.5 mb-3 bg-[#202020] text-white rounded-none text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-2"
              >
                <img src="/omniscient_logo_white.svg" alt="Omniscient Design" className="h-4" />
                <span>Continuer avec Omniscient Design</span>
              </button>

              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("La connexion avec Google a échoué.")}
                useOneTap
                theme="filled_black"
                shape="rectangular"
                width="100%"
              />
              <div className="flex items-center my-4">
                <div className="flex-grow border-t-2 border-[#111111]"></div>
                <span className="px-3 text-xs font-semibold text-[#111111]">OU AVEC EMAIL</span>
                <div className="flex-grow border-t-2 border-[#111111]"></div>
              </div>
            </div>
          )}

          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Prénom *</label>
                  <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Nom *</label>
                  <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Email *</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Mot de passe *</label>
                <input required type="password" name="password" minLength="6" value={formData.password} onChange={handleChange} className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Confirmer *</label>
                <input required type="password" name="confirmPassword" minLength="6" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none" />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Rôle *</label>
                  <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none">
                    <option value="Etudiant">Étudiant(e)</option>
                    <option value="Enseignant">Enseignant(e)</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">École *</label>
                  <select name="currentSchool" value={formData.currentSchool} onChange={handleChange} className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none">
                    {SCHOOLS_LIST.filter(s => s !== "Toutes les écoles").map((sch) => (
                      <option key={sch} value={sch}>{sch}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold block mb-1">Lien Behance (Optionnel)</label>
                <input type="url" name="behanceLink" value={formData.behanceLink} onChange={handleChange} placeholder="https://behance.net/..." className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none" />
              </div>
              
              <div>
                <label className="text-xs font-semibold block mb-1">Lien Instagram (Optionnel)</label>
                <input type="url" name="instaLink" value={formData.instaLink} onChange={handleChange} placeholder="https://instagram.com/..." className="w-full bg-[#EEEEEE] border-2 border-[#111111] rounded-none px-3 py-2 text-xs focus:outline-none" />
              </div>
            </>
          )}

          <div className="pt-3 border-t-2 border-[#111111] flex flex-col gap-3 mt-4">
            <button type="submit" disabled={loading} className="w-full px-5 py-2.5 bg-[#111111] text-[#EEEEEE] rounded-none text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{step === 1 ? 'Suivant' : (loading ? 'Création...' : 'Créer un compte')}</span>
            </button>
            <button type="button" onClick={handleSwitchToLogin} className="w-full text-xs text-[#111111] font-semibold underline hover:text-slate-600">
              Déjà un compte ? Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

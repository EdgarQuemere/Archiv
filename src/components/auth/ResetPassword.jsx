import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, Check } from 'lucide-react';
import axios from '../../api/axios';

export function ResetPassword({ token }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Critères du mot de passe
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const allCriteriaMet = hasMinLength && hasUppercase && hasNumber && hasSpecial;
  const showCriteria = password.length > 0 && !allCriteriaMet;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else if (err.response && err.response.data && err.response.data.errors) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError("Le lien de réinitialisation est invalide ou a expiré.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center p-4 bg-[#EEEEEE] font-sans font-medium text-[#111111]">
      <div className="relative bg-[#EEEEEE] rounded-[10px] shadow-2xl max-w-md w-full border-[1.5px] border-[#111111] p-6 sm:p-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <KeyRound className="w-6 h-6 stroke-[2.25] text-[#111111]" />
          <h2 className="text-2xl font-bold text-[#111111]">Nouveau mot de passe</h2>
        </div>
        
        {success ? (
          <div className="mt-6">
            <div className="p-4 bg-emerald-100 border-[1.5px] border-emerald-500 text-emerald-800 text-sm font-medium rounded-[8px] text-center mb-6">
              Votre mot de passe a été réinitialisé avec succès !
            </div>
            <a 
              href="/"
              className="w-full h-11 px-5 bg-[#111111] text-[#EEEEEE] rounded-full border-[1.5px] border-[#111111] text-sm font-medium hover:bg-black flex items-center justify-center transition-colors shadow-sm"
            >
              Retour à l'accueil pour se connecter
            </a>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-6">
              Veuillez définir votre nouveau mot de passe.
            </p>

            {error && (
              <div className="p-3 bg-red-100 border-[1.5px] border-red-400 text-red-700 text-xs font-medium rounded-[8px] mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-[#111111] block mb-1.5">Nouveau mot de passe *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 bg-white border-[1.5px] border-[#111111] rounded-[8px] pl-10 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#111111] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full h-11 px-5 bg-[#111111] text-[#EEEEEE] rounded-full border-[1.5px] border-[#111111] text-sm font-medium hover:bg-black flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : null}
                  <span>{loading ? 'Modification...' : 'Réinitialiser le mot de passe'}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;

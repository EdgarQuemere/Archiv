import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import axios from '../../api/axios';

export function ResetPassword({ token }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    <div className="w-screen h-screen flex items-center justify-center p-4 bg-[#EEEEEE] font-sans text-[#111111]">
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
                    className="w-full h-11 bg-white border-[1.5px] border-[#111111] rounded-[8px] pl-10 pr-10 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#111111] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Min 8 caractères, dont une majuscule et un chiffre.
                </p>
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

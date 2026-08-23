import React, { useEffect, useState, useContext } from 'react';
import { MailCheck, AlertCircle, Loader2 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

export function VerifyEmail({ token }) {
  const { verifyEmailToken } = useContext(AuthContext);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await verifyEmailToken(token);
        setFirstName(data.user?.firstName || '');
        setStatus('success');
      } catch (err) {
        const msg = err?.response?.data?.error || 'Le lien de vérification est invalide ou a expiré.';
        setMessage(msg);
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="w-screen h-screen flex items-center justify-center p-4 bg-[#EEEEEE] font-sans font-medium text-[#111111]">
      <div className="relative bg-[#EEEEEE] rounded-[10px] shadow-2xl max-w-md w-full border-[1.5px] border-[#111111] p-6 sm:p-10 text-center">

        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-[#111111]" />
            <h2 className="text-xl font-bold mb-2">Vérification en cours…</h2>
            <p className="text-sm text-[#666666]">Veuillez patienter quelques instants.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-[#111111] flex items-center justify-center mx-auto mb-5">
              <MailCheck className="w-7 h-7 text-white stroke-[2]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {firstName ? `Bienvenue, ${firstName} !` : 'Email vérifié !'}
            </h2>
            <p className="text-sm text-[#444444] mb-6 leading-relaxed">
              Votre adresse email a été confirmée avec succès.<br />
              Vous êtes maintenant connecté à votre compte Artchiv.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full h-11 rounded-full bg-[#111111] text-white font-semibold text-sm hover:opacity-80 transition-opacity cursor-pointer"
            >
              Accéder à Artchiv →
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-[#f5f5f5] border-[1.5px] border-[#111111] flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-7 h-7 text-[#111111] stroke-[2]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Lien invalide</h2>
            <p className="text-sm text-[#666666] mb-6 leading-relaxed">{message}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full h-11 rounded-full border-[1.5px] border-[#111111] text-[#111111] font-semibold text-sm hover:bg-[#E2E2E2] transition-colors cursor-pointer"
            >
              Retour à l'accueil
            </button>
          </>
        )}

      </div>
    </div>
  );
}

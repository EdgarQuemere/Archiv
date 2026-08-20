import React, { useEffect, useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';

export function OmniscientCallback() {
  const { omniscientAuth } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const called = React.useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      omniscientAuth(code)
        .then(() => {
          window.location.href = '/';
        })
        .catch(err => {
          if (err.response && err.response.data && err.response.data.requireMoreInfo) {
            // Need step 2, save token to localStorage and redirect to a completion page or open modal
            localStorage.setItem('omni_token', err.response.data.omniToken);
            localStorage.setItem('omni_partial', JSON.stringify(err.response.data.partialData));
            window.location.href = '/?complete_profile=true';
          } else {
            setError('Erreur lors de la connexion avec Omniscient Design.');
            setLoading(false);
          }
        });
    } else {
      setError('Aucun code d\'autorisation trouvé.');
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#EEEEEE] font-sans">
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin" />
          <p className="font-bold text-[#111111]">Connexion avec Omniscient Design...</p>
        </div>
      ) : (
        <div className="p-6 bg-red-100 border-2 border-red-400 max-w-md w-full">
          <h2 className="text-lg font-bold text-red-700 mb-2">Erreur</h2>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-[#111111] text-[#EEEEEE] text-sm font-bold w-full hover:opacity-90 transition-opacity">Retour à l'accueil</button>
        </div>
      )}
    </div>
  );
}

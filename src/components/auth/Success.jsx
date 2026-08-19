import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function Success() {
  const { user, logout, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return (
      <div>
        <h1>Accès refusé</h1>
        <p>Tu n'es pas connecté.</p>
        <button onClick={() => window.location.href = '/login'}>Aller au Login</button>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <div>
      <h1>Succès ! 🎉</h1>
      <p>Bienvenue sur ton espace, <strong>{user.name}</strong> !</p>
      <ul>
        <li><strong>Email:</strong> {user.email}</li>
        <li><strong>Rôle:</strong> {user.role}</li>
        <li><strong>École:</strong> {user.currentSchool || 'Non renseignée'}</li>
      </ul>
      <br />
      <button onClick={() => window.location.href = '/'}>Retourner à l'accueil</button>
      <br /><br />
      <button onClick={handleLogout}>Se déconnecter</button>
    </div>
  );
}

import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function Register({ onLoginClick }) {
  const { register } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Etudiant',
    currentSchool: '',
    behanceLink: '',
    instaLink: '',
    personalLink: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await register(formData);
      // L'utilisateur est connecté et le contexte est mis à jour !
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        setError(err.response.data.errors[0].msg);
      } else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Une erreur est survenue lors de l\'inscription.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Inscription</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nom Prénom: </label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <br />

        <div>
          <label>Email: </label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <br />

        <div>
          <label>Mot de passe: </label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <br />

        <div>
          <label>Rôle: </label>
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="Etudiant">Étudiant(e)</option>
            <option value="Enseignant">Enseignant(e)</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        <br />

        <div>
          <label>École actuelle: </label>
          <input type="text" name="currentSchool" value={formData.currentSchool} onChange={handleChange} />
        </div>
        <br />

        <div>
          <label>Behance / Dribbble: </label>
          <input type="url" name="behanceLink" value={formData.behanceLink} onChange={handleChange} />
        </div>
        <br />

        <div>
          <label>Instagram: </label>
          <input type="url" name="instaLink" value={formData.instaLink} onChange={handleChange} />
        </div>
        <br />

        <div>
          <label>Site perso: </label>
          <input type="url" name="personalLink" value={formData.personalLink} onChange={handleChange} />
        </div>
        <br />

        <button type="submit" disabled={loading}>
          {loading ? 'Chargement...' : 'Créer mon compte'}
        </button>
      </form>
      
      <br />
      <button onClick={onLoginClick}>Déjà un compte ? Se connecter</button>
    </div>
  );
}

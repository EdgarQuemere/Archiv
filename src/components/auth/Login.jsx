import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function Login({ onRegisterClick }) {
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(formData.email, formData.password);
      // Redirection après succès
      window.location.href = '/success';
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
    <div>
      <h1>Connexion</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
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

        <button type="submit" disabled={loading}>
          {loading ? 'Chargement...' : 'Se connecter'}
        </button>
      </form>
      
      <br />
      <button onClick={onRegisterClick}>Pas encore de compte ? S'inscrire</button>
    </div>
  );
}

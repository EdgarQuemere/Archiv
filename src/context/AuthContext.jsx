import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch le profil complet depuis /users/me après chaque action d'auth
  const fetchFullUser = async () => {
    const response = await api.get('/users/me');
    setUser(response.data);
    return response.data;
  };

  // Vérifier si l'utilisateur est connecté au chargement de l'application
  useEffect(() => {
    const checkUser = async () => {
      try {
        await fetchFullUser();
      } catch (error) {
        // Pas connecté ou token expiré, on met l'utilisateur à null (ce n'est pas une erreur grave)
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    // Fetch le profil complet pour avoir role, currentSchool, isOmniscient, etc.
    await fetchFullUser();
    return response.data;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    // Fetch le profil complet pour avoir role, currentSchool, isOmniscient, etc.
    await fetchFullUser();
    return response.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const resendVerification = async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  };

  const googleAuth = async (token, additionalData = {}) => {
    const response = await api.post('/auth/google', { token, ...additionalData });
    if (response.data.user) {
      // Fetch le profil complet pour avoir role, currentSchool, isOmniscient, etc.
      await fetchFullUser();
    }
    return response.data;
  };

  const omniscientAuth = async (code, additionalData = {}) => {
    const response = await api.post('/auth/omniscient', { code, ...additionalData });
    if (response.data.user) {
      // Fetch le profil complet pour avoir role, currentSchool, isOmniscient, etc.
      await fetchFullUser();
    }
    return response.data;
  };

  const deleteAccount = async (reason = '') => {
    await api.delete('/users/me', { data: { reason } });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, googleAuth, omniscientAuth, deleteAccount, resendVerification, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

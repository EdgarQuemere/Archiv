import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est connecté au chargement de l'application
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await api.get('/users/me');
        setUser(response.data);
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
    setUser(response.data.user);
    return response.data;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const googleAuth = async (token, additionalData = {}) => {
    const response = await api.post('/auth/google', { token, ...additionalData });
    if (response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
  };

  
  const omniscientAuth = async (code, additionalData = {}) => {
    const response = await api.post('/auth/omniscient', { code, ...additionalData });
    if (response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
  };

  const deleteAccount = async () => {
    await api.delete('/users/me');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, googleAuth, omniscientAuth, deleteAccount, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

import axios from 'axios';

// On utilise l'URL de production via les variables d'environnement, avec un fallback local
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Très important pour envoyer/recevoir les cookies (JWT)
});

export default api;

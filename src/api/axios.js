import axios from 'axios';

// On utilise l'URL de production Coolify directement comme demandé.
const API_URL = 'https://archiv.api.omniscientproject.com/api';
// const API_URL = 'http://localhost:3000/api';
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Très important pour envoyer/recevoir les cookies (JWT)
});

export default api;

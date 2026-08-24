export const getFileUrl = (url) => {
    if (!url) return '';

    // 1. Si c'est un blob local (utilisé pour la prévisualisation instantanée d'avatar) ou une URL absolue externe, on la retourne directement
    if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    const backendUrl = import.meta.env.VITE_API_URL || 'https://api.artchiv.fr/api';

    // 2. Si le chemin en base commence par /api/, on nettoie pour éviter les doublons
    let cleanPath = url;
    if (cleanPath.startsWith('/api/')) {
        cleanPath = cleanPath.replace('/api', '');
    }

    // 3. Assemblage propre
    return `${backendUrl.replace(/\/+$/, '')}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};
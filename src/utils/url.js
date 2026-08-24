export const getFileUrl = (url) => {
    if (!url) return '';

    // 1. Si l'URL est déjà complète (http:// ou https://), on la retourne
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    const backendUrl = import.meta.env.VITE_API_URL || 'https://api.artchiv.fr/api';

    // 2. Si le chemin en base commence par /api/files/, on enlève le premier /api pour ne pas doubler
    let cleanPath = url;
    if (cleanPath.startsWith('/api/')) {
        cleanPath = cleanPath.replace('/api', '');
    }

    // 3. Résultat final : https://api.artchiv.fr/api + /files/projects/...
    return `${backendUrl.replace(/\/+$/, '')}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};
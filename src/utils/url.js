export const getFileUrl = (url) => {
    if (!url) return '';
    // Si l'URL commence déjà par http ou https, on la laisse telle quelle
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // Si c'est un chemin relatif commençant par /api/files/
    if (url.startsWith('/files/')) {
        const backendUrl = import.meta.env.VITE_API_URL || 'https://api.artchiv.fr';
        return `${backendUrl}${url}`;
    }
    // Si le chemin commence juste par /projects/... ou /avatars/...
    const backendUrl = import.meta.env.VITE_API_URL || 'https://api.artchiv.fr';
    return `${backendUrl}/files${url.startsWith('/') ? '' : '/'}${url}`;
};
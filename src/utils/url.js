export const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/api/files/')) {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        return `${backendUrl}${url}`;
    }
    return url;
};
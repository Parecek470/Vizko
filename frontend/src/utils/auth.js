export const TOKEN_KEY = 'access_token';

export function getCurrentUsername() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
        const decoded = atob(token);
        return decoded.split(':')[0];
    } catch (e) {
        console.error('Failed to decode auth token:', e);
        return null;
    }
}
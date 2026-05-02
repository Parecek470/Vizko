// frontend/src/utils/api.js

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem('teacherToken');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Basic ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.removeItem('teacherToken');
        const path = window.location.pathname;
        const isPublic = path.startsWith('/login') || path.startsWith('/join') || path.startsWith('/respond');
        if (!isPublic) {
            window.location.href = '/login';
        }
    }

    return response;
};

// Lightweight helper for public routes (no auth needed)
export const publicFetch = (url, options = {}) =>
    fetch(`${API_BASE_URL}${url}`, options);
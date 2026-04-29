// frontend/src/utils/api.js

export const apiFetch = async (url, options = {}) => {
    // 1. Automatically grab the token
    const token = localStorage.getItem('teacherToken');

    // 2. Set up headers, preserving any custom headers passed in
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // 3. Attach the token if the user is logged in
    if (token) {
        headers['Authorization'] = `Basic ${token}`;
    }

    // 4. Do the actual fetch
    const response = await fetch(url, {
        ...options,
        headers,
    });

    // 5. Global 401 handler: If ANY request gets a 401, kick them out
    if (response.status === 401) {
        localStorage.removeItem('teacherToken');

        // Prevent kick-outs if they are already on a public page
        const path = window.location.pathname;
        const isPublic = path.startsWith('/login') || path.startsWith('/join') || path.startsWith('/respond');

        if (!isPublic) {
            window.location.href = '/login';
        }
    }

    // Return the normal fetch response so your existing code keeps working!
    return response;
};
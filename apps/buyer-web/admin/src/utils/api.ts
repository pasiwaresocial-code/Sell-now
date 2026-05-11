import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const getImageUrl = (imagePath: string | undefined | null) => {
    if (!imagePath) return '';

    // Fix for legacy data with localhost
    if (imagePath.includes('localhost')) {
        // This might need adjustment if users still have localhost links in DB
        // Ideally replace origin with current API origin
    }

    if (imagePath.startsWith('http')) return imagePath;

    // Use current API Host for relative paths
    let host = API_URL;
    if (host.endsWith('/api')) {
        host = host.slice(0, -4);
    }

    // Ensure path starts with /
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

    // If it's already an uploads path, just append to host
    if (cleanPath.startsWith('/uploads/')) {
        return `${host}${cleanPath}`;
    }

    return `${host}/uploads${cleanPath}`;
};

export default api;

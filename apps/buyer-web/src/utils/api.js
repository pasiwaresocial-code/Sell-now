import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://demobackend.pasiware.cloud/api';


const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If it's a full URL checking if it matches our "uploads" pattern
    // If it is from our server (even with old IP), force it to current API_URL
    if (imagePath.includes('/uploads/')) {
        // Extract relative path after /uploads/
        const relativePath = imagePath.split('/uploads/')[1];
        if (relativePath) {
            if (relativePath) {
                // Use the configured API URL origin or fallback
                let host = import.meta.env.VITE_API_URL || 'https://demobackend.pasiware.cloud/api';
                // Remove /api if present to get base URL
                host = host.replace(/\/api$/, '');
                return `${host}/uploads/${relativePath}`;
            }
        }
    }

    if (imagePath.startsWith('http')) return imagePath;

    const host = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://demobackend.pasiware.cloud';
    // Ensure path starts with /
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${host}${cleanPath}`;
};

export default api;

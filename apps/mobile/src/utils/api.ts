import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API URL
console.log('🔗 Seller App using API URL: https://demobackend.pasiware.cloud/api');
const api = axios.create({
    baseURL: 'https://demobackend.pasiware.cloud/api',
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

import { useAuthStore } from '../store/authStore';

// ... (API_URL check)

api.interceptors.request.use(async (config) => {
    // Read directly from the Zustand store state, which handles persistence automatically
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (!error.response) {
            console.error(`Network Error - Is backend running on Port 5500? URL: ${error.config?.baseURL || error.config?.url}`);
            console.error('Error Details:', error.message);
        }
        return Promise.reject(error);
    }
);


export const getImageUrl = (path: string | undefined | null) => {
    if (!path) return null;

    // Fix for images stored with old URLs
    if (path.includes('/uploads/')) {
        const relativePath = path.substring(path.indexOf('/uploads/'));
        return `https://demobackend.pasiware.cloud${relativePath}`;
    }

    if (path.startsWith('http')) {
        return path.replace('10.0.2.2', 'demobackend.pasiware.cloud').replace('demo.ranx24.com', 'demobackend.pasiware.cloud');
    }

    return `https://demobackend.pasiware.cloud${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;

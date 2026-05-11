import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Backend API Configuration
// IMPORTANT: Change this to your computer's IP address
// Production API URL
export const API_URL = 'https://demobackend.pasiware.cloud/api';
export const BASE_URL = 'https://demobackend.pasiware.cloud';
const CURRENT_API_URL = API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    // Read from memory (fast & sync) instead of disk (async & slow) to avoid race conditions
    const { useAuthStore } = require('../store/authStore');
    const token = useAuthStore.getState().token;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!error.response) {
            console.error(`Network Error - Is backend running on Port 6200 or Production? URL: ${error.config?.baseURL || error.config?.url}`);
            console.error('Error Details:', error.message);
        } else if (error.response.status === 401) {
            // Token expired or invalid - Log it but do NOT auto-logout
            console.log('⚠️ 401 Unauthorized - Token may be invalid/expired.');
            // Let the UI handle the 401 error
        }
        return Promise.reject(error);
    }
);


export const getImageUrl = (imagePath: string | undefined | null) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http')) return imagePath;

    // Handle relative paths
    const cleanPath = imagePath.replace(/\\/g, '/');
    return `${BASE_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};


export default api;

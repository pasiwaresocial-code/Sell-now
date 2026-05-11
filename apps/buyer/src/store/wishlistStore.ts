import { create } from 'zustand';
import api from '@/src/utils/api';

export interface WishlistItem {
    product: {
        _id: string;
        title: string;
        price: number;
        images: string[];
        stock: number;
        averageRating?: number;
        totalReviews?: number;
    };
    addedAt: Date;
}

interface WishlistState {
    items: WishlistItem[];
    loading: boolean;
    fetchWishlist: () => Promise<void>;
    addToWishlist: (productId: string, productInfo: any) => Promise<void>;
    removeFromWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    toggleWishlist: (productId: string, productInfo: any) => Promise<void>;
    clearWishlist: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
    items: [],
    loading: false,

    fetchWishlist: async () => {
        try {
            set({ loading: true });
            const { data } = await api.get('/wishlist');
            set({ items: data.items || [], loading: false });
        } catch (error) {
            console.error('Fetch Wishlist Error:', error);
            set({ loading: false, items: [] });
        }
    },

    addToWishlist: async (productId: string, productInfo: any) => {
        const { useAuthStore } = require('./authStore');
        const token = useAuthStore.getState().token;
        if (!token) {
            const { router } = require('expo-router');
            router.push('/auth/login');
            return;
        }

        try {
            const { data } = await api.post('/wishlist', { productId });
            set({ items: data.items || [] });
        } catch (error: any) {
            // If product is already in wishlist, just fetch the current wishlist
            if (error.response?.status === 400 && error.response?.data?.message?.includes('already in wishlist')) {
                console.log('Product already in wishlist, refreshing...');
                await get().fetchWishlist();
                return;
            }
            console.error('Add to Wishlist Error:', error);
            throw error;
        }
    },

    removeFromWishlist: async (productId: string) => {
        try {
            const { data } = await api.delete(`/wishlist/${productId}`);
            set({ items: data.items || [] });
        } catch (error) {
            console.error('Remove from Wishlist Error:', error);
            throw error;
        }
    },

    isInWishlist: (productId: string) => {
        const { items } = get();
        return items.some(item => item.product._id === productId);
    },

    toggleWishlist: async (productId: string, productInfo: any) => {
        const { isInWishlist, addToWishlist, removeFromWishlist } = get();
        if (isInWishlist(productId)) {
            await removeFromWishlist(productId);
        } else {
            await addToWishlist(productId, productInfo);
        }
    },

    clearWishlist: async () => {
        try {
            await api.delete('/wishlist');
            set({ items: [] });
        } catch (error) {
            console.error('Clear Wishlist Error:', error);
            throw error;
        }
    }
}));


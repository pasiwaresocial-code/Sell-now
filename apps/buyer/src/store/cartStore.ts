import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../utils/api';

export interface CartItem {
    id: string;
    title: string;
    price: number;
    image: string;
    quantity: number;
    sellerId: string;
    size?: string;
    stock?: number;
    shippingCost?: number;
}

interface CartState {
    items: CartItem[];
    deliveryAddress: any | null;
    syncing: boolean;
    setDeliveryAddress: (address: any) => void;
    addToCart: (item: CartItem) => Promise<void>;
    removeFromCart: (id: string, size?: string) => Promise<void>;
    updateQuantity: (id: string, quantity: number, size?: string) => Promise<void>;
    clearCart: () => Promise<void>;
    syncWithServer: (token?: string) => Promise<void>;
    getTotal: () => number;
    buyNowItem: CartItem | null;
    setBuyNowItem: (item: CartItem) => void;
    clearBuyNowItem: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            deliveryAddress: null,
            syncing: false,

            setDeliveryAddress: (address) => set({ deliveryAddress: address }),

            addToCart: async (item) => {
                // Update local state immediately
                set((state) => {
                    const existingItem = state.items.find(i => i.id === item.id && i.size === item.size);
                    if (existingItem) {
                        return {
                            items: state.items.map(i =>
                                (i.id === item.id && i.size === item.size)
                                    ? { ...i, quantity: i.quantity + item.quantity }
                                    : i
                            )
                        };
                    }
                    return { items: [...state.items, item] };
                });

                // Sync with backend only if logged in
                const { useAuthStore } = require('./authStore');
                const token = useAuthStore.getState().token;
                if (!token) return;

                try {
                    await api.post('/cart', {
                        productId: item.id,
                        title: item.title,
                        price: item.price,
                        image: item.image,
                        quantity: item.quantity,
                        size: item.size,
                        stock: item.stock,
                        shippingCost: item.shippingCost
                    });
                } catch (error) {
                    console.error('Add to Cart API Error:', error);
                    // Local state already updated, continue silently
                }
            },

            removeFromCart: async (id, size) => {
                // Update local state
                set((state) => ({
                    items: state.items.filter(i => !(i.id === id && (!size || i.size === size)))
                }));

                // Sync with backend
                try {
                    await api.delete(`/cart/${id}${size ? `?size=${size}` : ''}`);
                } catch (error) {
                    console.error('Remove from Cart API Error:', error);
                }
            },

            updateQuantity: async (id, quantity, size) => {
                // Update local state
                set((state) => ({
                    items: state.items.map(i =>
                        (i.id === id && (!size || i.size === size))
                            ? { ...i, quantity: Math.max(1, quantity) }
                            : i
                    )
                }));

                // Sync with backend
                try {
                    await api.put(`/cart/${id}`, { quantity, size });
                } catch (error) {
                    console.error('Update Quantity API Error:', error);
                }
            },

            clearCart: async () => {
                set({ items: [] });

                try {
                    await api.delete('/cart');
                } catch (error) {
                    console.error('Clear Cart API Error:', error);
                }
            },

            syncWithServer: async (token) => {
                try {
                    set({ syncing: true });

                    // Get local cart
                    const localItems = get().items;

                    // Sync local cart with server
                    if (localItems.length > 0) {
                        await api.post('/cart/sync', { items: localItems });
                    }

                    // Fetch server cart
                    const { data } = await api.get('/cart');

                    // Convert server cart format to local format
                    const serverItems: CartItem[] = (data.items || []).map((item: any) => ({
                        id: item.product._id || item.product,
                        title: item.title,
                        price: item.price,
                        image: item.image,
                        quantity: item.quantity,
                        sellerId: '', // Not stored in cart
                        size: item.size,
                        stock: item.stock,
                        shippingCost: item.product.shippingCost !== undefined ? item.product.shippingCost : 40
                    }));

                    set({ items: serverItems });
                } catch (error) {
                    console.error('Sync Cart Error:', error);
                } finally {
                    set({ syncing: false });
                }
            },

            getTotal: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },

            // Buy Now Logic
            buyNowItem: null,
            setBuyNowItem: (item) => set({ buyNowItem: item }),
            clearBuyNowItem: () => set({ buyNowItem: null }),
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../src/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/store/authStore';

const BASE_URL = 'https://demobackend.pasiware.cloud';

// Helper to format image URLs
const getImageUrl = (path: string) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

interface Product {
    _id: string;
    title: string;
    price: number;
    displayPrice?: number;
    images: string[];
    status: string;
    category: string;
    stock: number;
    hasVariants?: boolean;
    variants?: Array<{ stock: number; price: number }>;
}

export default function InventoryScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // all, available, sold

    const fetchListings = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/products/mylistings');
            setProducts(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch inventory');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchListings();
            }
        }, [user])
    );

    const handleDelete = (id: string) => {
        Alert.alert('Delete Product', 'Are you sure you want to remove this item from your inventory?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(`/products/${id}`);
                        setProducts(products.filter(p => p._id !== id));
                        Alert.alert('Deleted', 'Product removed successfully');
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete product');
                    }
                }
            }
        ]);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchListings();
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || p.status === filter;
        return matchesSearch && matchesFilter;
    });

    const renderItem = ({ item }: { item: Product }) => {
        // Calculate total stock - for variants, sum all variant stocks
        const totalStock = item.hasVariants && item.variants && item.variants.length > 0
            ? item.variants.reduce((sum: number, v: { stock: number; price: number }) => sum + (v.stock || 0), 0)
            : (item.stock ?? 0);

        const stockColor = totalStock === 0 ? '#FF3B30' : totalStock <= 5 ? '#FF9500' : '#34C759';
        const isOutOfStock = totalStock === 0;

        return (
            <View style={styles.card}>
                <Image source={{ uri: getImageUrl(item.images?.[0] || '') }} style={styles.image} />
                {isOutOfStock && (
                    <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                    </View>
                )}
                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.category}>{item.category}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{(item.displayPrice || item.price || 0).toLocaleString()}</Text>
                        <View style={[styles.stockBadge, { backgroundColor: stockColor + '20' }]}>
                            <Ionicons name="cube-outline" size={12} color={stockColor} />
                            <Text style={[styles.stockText, { color: stockColor }]}>
                                {isOutOfStock ? 'Out of Stock' : `${totalStock} in stock`}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <View style={[styles.badge, item.status === 'available' ? styles.badgeActive : styles.badgeInactive]}>
                            <Text style={[styles.badgeText, item.status === 'available' ? styles.textActive : styles.textInactive]}>
                                {item.status.toUpperCase()}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/edit-product/${item._id}` as any)}>
                            <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    if (!user) {
        return (
            <View style={styles.center}>
                <Text style={styles.message}>Please login to manage inventory</Text>
                <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
                    <Text style={styles.btnText}>Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Inventory</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-product')}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder="Search inventory..."
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={styles.tabs}>
                {['all', 'available', 'sold'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, filter === tab && styles.activeTab]}
                        onPress={() => setFilter(tab)}
                    >
                        <Text style={[styles.tabText, filter === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cube-outline" size={60} color="#ccc" />
                            <Text style={styles.empty}>No items found.</Text>
                            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/add-product')}>
                                <Text style={styles.emptyBtnText}>Add New Product</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        height: 45,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    tab: {
        marginRight: 10,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#eee',
    },
    activeTab: {
        backgroundColor: '#333',
    },
    tabText: {
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        marginBottom: 20,
        color: '#666',
    },
    loginBtn: {
        backgroundColor: '#FF6600',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    list: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        padding: 12,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    image: {
        width: 90,
        height: 90,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'space-between',
        height: 90,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    category: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    deleteBtn: {
        padding: 4,
    },
    price: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    badgeActive: { backgroundColor: '#E8F5E9' },
    badgeInactive: { backgroundColor: '#FFEBEE' },
    textActive: { color: '#2E7D32', fontSize: 10, fontWeight: '700' },
    textInactive: { color: '#C62828', fontSize: 10, fontWeight: '700' },
    badgeText: { fontSize: 10, fontWeight: '700' },
    editBtn: {
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#f9f9f9',
    },
    editBtnText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
    },
    empty: {
        marginTop: 15,
        color: '#999',
        fontSize: 16,
    },
    emptyBtn: {
        marginTop: 20,
        backgroundColor: '#FF6600',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    emptyBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    outOfStockBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#FF3B30',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        zIndex: 1,
    },
    outOfStockText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    stockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 4,
    },
    stockText: {
        fontSize: 11,
        fontWeight: '600',
    },
});

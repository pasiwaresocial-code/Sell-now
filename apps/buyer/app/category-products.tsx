import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { getImageUrl } from '@/src/utils/api';
import FilterModal from '@/components/FilterModal';
import { useWishlistStore } from '@/src/store/wishlistStore';

interface Product {
    _id: string;
    title: string;
    price: number;
    images: string[];
    category: string;
    subcategory?: string;
    stock: number;
    basePrice?: number;
    hasVariants?: boolean;
    variants?: { price: number; stock: number }[];
    mrp?: number;
    averageRating?: number;
    totalReviews?: number;
}

export default function CategoryProductsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const categoryId = params.categoryId as string;
    const categoryName = params.categoryName as string;
    const subcategoryName = params.subcategory as string;

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'newest'>('default');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState<any>({});

    const { isInWishlist, toggleWishlist } = useWishlistStore();

    useEffect(() => {
        fetchProducts();
    }, [sortBy, filters]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params: any = {
                sort: sortBy === 'default' ? 'newest' : sortBy
            };
            if (categoryId) params.category = categoryId;
            if (subcategoryName) params.subcategory = subcategoryName;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice && filters.maxPrice < 10000) params.maxPrice = filters.maxPrice;
            if (filters.brands && filters.brands.length > 0) params.brand = filters.brands[0];
            if (filters.condition) params.condition = filters.condition;
            if (filters.inStock) params.inStock = 'true';
            if (filters.minRating) params.minRating = filters.minRating;

            const response = await api.get('/products', { params });
            const productsData = response.data.products || response.data || [];
            console.log('Products fetched:', productsData.length);
            setProducts(Array.isArray(productsData) ? productsData : []);
        } catch (error) {
            console.error('Fetch Products Error:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleWishlistToggle = async (product: Product) => {
        try {
            await toggleWishlist(product._id, product);
        } catch (error) {
            console.error('Wishlist Error:', error);
        }
    };

    const renderProduct = ({ item }: { item: Product }) => {
        const inWishlist = isInWishlist(item._id);

        let effectivePrice = item.price;
        if (item.hasVariants && item.variants && item.variants.length > 0) {
            const variantPrices = item.variants.map(v => v.price).filter(p => p > 0);
            if (variantPrices.length > 0) {
                effectivePrice = Math.min(...variantPrices);
            }
        }
        if ((!effectivePrice || effectivePrice === 0) && item.basePrice) {
            effectivePrice = item.basePrice;
        }
        const price = effectivePrice || 0;

        let effectiveStock = item.stock || 0;
        if (item.hasVariants && item.variants && item.variants.length > 0) {
            effectiveStock = item.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
        }
        const isOutOfStock = effectiveStock <= 0;

        // Discount Calculation
        let discount = 0;
        if (item.mrp && item.mrp > effectivePrice) {
            discount = Math.floor(((item.mrp - effectivePrice) / item.mrp) * 100);
        }

        return (
            <TouchableOpacity
                style={styles.productCard}
                onPress={() => router.push(`/product/${item._id}` as any)}
                activeOpacity={0.7}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: getImageUrl(item.images[0]) || undefined }}
                        style={styles.productImage}
                    />

                    {discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{discount}% OFF</Text>
                        </View>
                    )}

                    {isOutOfStock && (
                        <View style={styles.outOfStockOverlay}>
                            <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.wishlistBtn}
                        onPress={() => handleWishlistToggle(item)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={inWishlist ? 'heart' : 'heart-outline'}
                            size={22}
                            color={inWishlist ? '#FF6600' : '#666'}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.productInfo}>
                    <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.productPrice}>₹{price.toLocaleString()}</Text>
                        {item.mrp && item.mrp > price && (
                            <Text style={styles.originalPrice}>₹{item.mrp.toLocaleString()}</Text>
                        )}
                    </View>

                    {/* Rating Stars (real data) */}
                    {(item.averageRating || 0) > 0 && (
                        <View style={styles.ratingRow}>
                            <View style={styles.ratingBadge}>
                                <Text style={styles.ratingText}>{item.averageRating?.toFixed(1)}</Text>
                                <Ionicons name="star" size={10} color="#fff" />
                            </View>
                            <Text style={styles.reviewCount}>({item.totalReviews})</Text>
                        </View>
                    )}
                    {item.stock < 10 && item.stock > 0 && (
                        <Text style={styles.lowStockText}>Only {item.stock} left!</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{subcategoryName || categoryName}</Text>
                    <Text style={styles.headerSubtitle}>{products.length} products</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => setShowFilterModal(true)} style={{ marginRight: 12 }}>
                        <Ionicons name="filter" size={24} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowSortMenu(!showSortMenu)}>
                        <Ionicons name="funnel-outline" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Sort Menu */}
            {showSortMenu && (
                <View style={styles.sortMenu}>
                    <TouchableOpacity
                        style={[styles.sortOption, sortBy === 'default' && styles.sortOptionActive]}
                        onPress={() => { setSortBy('default'); setShowSortMenu(false); }}
                    >
                        <Text style={[styles.sortText, sortBy === 'default' && styles.sortTextActive]}>Relevance</Text>
                        {sortBy === 'default' && <Ionicons name="checkmark" size={20} color="#FF6600" />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sortOption, sortBy === 'price_asc' && styles.sortOptionActive]}
                        onPress={() => { setSortBy('price_asc'); setShowSortMenu(false); }}
                    >
                        <Text style={[styles.sortText, sortBy === 'price_asc' && styles.sortTextActive]}>Price: Low to High</Text>
                        {sortBy === 'price_asc' && <Ionicons name="checkmark" size={20} color="#FF6600" />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sortOption, sortBy === 'price_desc' && styles.sortOptionActive]}
                        onPress={() => { setSortBy('price_desc'); setShowSortMenu(false); }}
                    >
                        <Text style={[styles.sortText, sortBy === 'price_desc' && styles.sortTextActive]}>Price: High to Low</Text>
                        {sortBy === 'price_desc' && <Ionicons name="checkmark" size={20} color="#FF6600" />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sortOption, sortBy === 'newest' && styles.sortOptionActive]}
                        onPress={() => { setSortBy('newest'); setShowSortMenu(false); }}
                    >
                        <Text style={[styles.sortText, sortBy === 'newest' && styles.sortTextActive]}>Newest First</Text>
                        {sortBy === 'newest' && <Ionicons name="checkmark" size={20} color="#FF6600" />}
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={item => item._id}
                    numColumns={2}
                    contentContainerStyle={styles.productList}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cube-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>No products found</Text>
                        </View>
                    }
                />
            )}

            {/* Filter Modal */}
            <FilterModal
                visible={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onApply={(newFilters) => setFilters(newFilters)}
                currentFilters={filters}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#fff',
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 15,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    productList: {
        padding: 8,
        paddingBottom: 20,
    },
    productCard: {
        flex: 1,
        margin: 6,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#f5f5f5',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        elevation: 2,
    },
    discountText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    outOfStockOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOfStockText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    wishlistBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 18,
        padding: 6,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    productInfo: {
        padding: 12,
    },
    productTitle: {
        fontSize: 13,
        color: '#333',
        marginBottom: 6,
        lineHeight: 18,
        height: 36,
        fontWeight: '500',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 8,
    },
    originalPrice: {
        fontSize: 12,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 6,
    },
    ratingText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        marginRight: 2,
    },
    reviewCount: {
        fontSize: 11,
        color: '#666',
    },
    lowStockText: {
        fontSize: 10,
        color: '#FF6600',
        fontWeight: '600',
        marginLeft: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        marginTop: 10,
    },
    sortMenu: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 8,
    },
    sortOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    sortOptionActive: {
        backgroundColor: '#fff5ec',
    },
    sortText: {
        fontSize: 15,
        color: '#333',
    },
    sortTextActive: {
        color: '#FF6600',
        fontWeight: '600',
    },
});

import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useWishlistStore } from '../src/store/wishlistStore';
import api, { BASE_URL, getImageUrl } from '../src/utils/api';

const { width } = Dimensions.get('window');

export default function WishlistScreen() {
    const router = useRouter();
    const { items, removeFromWishlist } = useWishlistStore();

    const renderItem = ({ item }: { item: any }) => {
        const product = item.product;
        if (!product) return null;

        // Price Logic
        let effectivePrice = product.price;
        if (product.displayPrice) effectivePrice = product.displayPrice;
        else if (product.basePrice) effectivePrice = product.basePrice;
        else if (product.variants && product.variants.length > 0) effectivePrice = product.variants[0].price;

        const price = effectivePrice || 0;

        // Discount Logic
        let discount = 0;
        if (product.mrp && product.mrp > price) {
            discount = Math.floor(((product.mrp - price) / product.mrp) * 100);
        }

        return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/product/${product._id}` as any)}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: getImageUrl(product.images?.[0]) || undefined }}
                        style={styles.image}
                    />
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => removeFromWishlist(product._id)}
                    >
                        <Ionicons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{product.title}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{price.toLocaleString()}</Text>
                        {product.mrp && product.mrp > price && (
                            <Text style={styles.mrp}>₹{product.mrp.toLocaleString()}</Text>
                        )}
                        {discount > 0 && <Text style={styles.discount}>{discount}% off</Text>}
                    </View>

                    {(product.averageRating || 0) > 0 && (
                        <View style={styles.ratingRow}>
                            <View style={styles.ratingPill}>
                                <Text style={styles.ratingText}>{product.averageRating?.toFixed(1)}</Text>
                                <FontAwesome name="star" size={10} color="#fff" style={{ marginLeft: 3 }} />
                            </View>
                            <Text style={styles.ratingCount}>({product.totalReviews})</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Wishlist</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyContent}>
                    <Ionicons name="heart-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>Your Wishlist is Empty</Text>
                    <Text style={styles.emptySubText}>Save items you love to buy later</Text>
                    <TouchableOpacity style={styles.shopBtn} onPress={() => router.replace('/(tabs)/' as any)}>
                        <Text style={styles.shopBtnText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Wishlist ({items.length})</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item.product._id}
                numColumns={2}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        elevation: 2
    },
    backBtn: {},
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    list: { padding: 8 },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        margin: 4,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
        maxWidth: (width / 2) - 12
    },
    imageContainer: { position: 'relative', height: 180, backgroundColor: '#f5f5f5' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    closeBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        elevation: 2
    },
    info: { padding: 10 },
    title: { fontSize: 13, color: '#444', marginBottom: 6 },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    price: { fontSize: 15, fontWeight: 'bold', color: '#333', marginRight: 6 },
    mrp: { fontSize: 11, color: '#999', textDecorationLine: 'line-through', marginRight: 6 },
    discount: { fontSize: 11, color: '#228B22', fontWeight: 'bold' },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingPill: {
        backgroundColor: '#23BB75',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 5
    },
    ratingText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    ratingCount: { fontSize: 10, color: '#999' },

    emptyContainer: { flex: 1, backgroundColor: '#fff' },
    emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 20, fontSize: 18, color: '#333', fontWeight: 'bold' },
    emptySubText: { marginTop: 8, fontSize: 14, color: '#999', marginBottom: 30 },
    shopBtn: { backgroundColor: '#FF6600', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
    shopBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

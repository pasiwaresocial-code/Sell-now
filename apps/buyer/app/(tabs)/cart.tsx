import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCartStore } from '@/src/store/cartStore';
import api, { BASE_URL, getImageUrl } from '@/src/utils/api';
import { useAuthStore } from '@/src/store/authStore';
import { useWishlistStore } from '@/src/store/wishlistStore';

export default function CartScreen() {
    const router = useRouter();
    const { items, removeFromCart, updateQuantity, getTotal, clearCart, deliveryAddress } = useCartStore();
    const { addToWishlist } = useWishlistStore();
    const { user } = useAuthStore();

    // State
    // State
    const [cashToCollect, setCashToCollect] = useState('');

    // Derived address to show
    const displayAddress = deliveryAddress || {
        city: user?.city || 'Select Address',
        zip: user?.zip || ''
    };
    const [loading, setLoading] = useState(false);

    // Derived State
    const totalSellingPrice = getTotal();
    // Simulate MRP (e.g., 20% higher than selling price)
    const totalMRP = Math.floor(totalSellingPrice * 1.25);
    const totalDiscount = totalMRP - totalSellingPrice;

    // Dynamic Delivery Charge
    const deliveryCharge = items.reduce((acc, item) => {
        const cost = item.shippingCost !== undefined ? item.shippingCost : 40;
        return acc + (cost * item.quantity);
    }, 0);

    const finalTotal = totalSellingPrice + deliveryCharge;



    const handlePlaceOrder = () => {
        if (items.length === 0) return;

        // Check for out of stock items
        const outOfStockItems = items.filter(i => (i.stock !== undefined && i.stock <= 0));
        if (outOfStockItems.length > 0) {
            Alert.alert('Out of Stock', 'Some items in your cart are out of stock. Please remove them to proceed.');
            return;
        }

        // Navigate to Review Screen
        router.push('/review' as any);
    };

    const handleMoveToWishlist = (item: any) => {
        addToWishlist(item.id, {
            _id: item.id,
            title: item.title,
            price: item.price,
            images: [item.image],
            category: item.category || 'Standard'
        });
        removeFromCart(item.id, item.size);
        Alert.alert('Moved', 'Item moved to wishlist');
    };

    if (items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={80} color="#ccc" />
                <Text style={styles.emptyText}>Your Cart is Empty</Text>
                <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/' as any)}>
                    <Text style={styles.shopBtnText}>Start Shopping</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CART</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Stepper */}
            <View style={styles.stepperContainer}>
                <View style={styles.step}>
                    <View style={[styles.stepCircle, styles.stepActive]}>
                        <Text style={styles.stepNumber}>1</Text>
                    </View>
                    <Text style={[styles.stepLabel, styles.stepLabelActive]}>Cart</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.step}>
                    <View style={styles.stepCircle}>
                        <Text style={[styles.stepNumber, { color: '#999' }]}>2</Text>
                    </View>
                    <Text style={styles.stepLabel}>Review</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.step}>
                    <View style={styles.stepCircle}>
                        <Text style={[styles.stepNumber, { color: '#999' }]}>3</Text>
                    </View>
                    <Text style={styles.stepLabel}>Payment</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Address Section */}
                {/* Address Section - Only for logged in users */}
                {user && (
                    <View style={styles.addressBar}>
                        <Ionicons name="location-sharp" size={20} color="#666" />
                        <Text style={styles.addressText} numberOfLines={1}>Delivery at {displayAddress.city} - {displayAddress.zip}</Text>
                        <TouchableOpacity style={styles.changeBtn} onPress={() => router.push({ pathname: '/address', params: { select: 'true' } } as any)}>
                            <Text style={styles.changeBtnText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Discount Bundle Banner */}
                <View style={styles.bundleBanner}>
                    <MaterialCommunityIcons name="brightness-percent" size={16} color="#038D63" />
                    <Text style={styles.bundleText}>Save ₹15 with Only wrong/defect item returns</Text>
                </View>

                {/* Items */}
                <View style={styles.itemsContainer}>
                    {items.map(item => (
                        <View key={item.id} style={styles.cartItemCard}>
                            <View style={styles.cartItemContent}>
                                <Image
                                    source={{ uri: getImageUrl(item.image) || undefined }}
                                    style={styles.itemImage}
                                />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text style={styles.sellerInfo}>₹{item.price} <Text style={styles.mrp}>₹{Math.floor(item.price * 1.25)}</Text> <Text style={styles.offText}>20% Off</Text></Text>
                                    <Text style={styles.deliveryInfo}>Size: L   Qty: {item.quantity}</Text>
                                    <View style={styles.deliveryRow}>
                                        <MaterialCommunityIcons name="truck-delivery-outline" size={16} color="#666" />
                                        <Text style={styles.estimatedDelivery}>Estimated Delivery by Thursday, 01st Jan</Text>
                                    </View>
                                    {(item.stock !== undefined && item.stock <= 0) && (
                                        <Text style={{ color: 'red', fontSize: 12, marginTop: 4, fontWeight: 'bold' }}>Out of Stock</Text>
                                    )}
                                </View>
                            </View>

                            {/* Actions Divider */}
                            <View style={styles.cardDivider} />

                            {/* Actions Row */}
                            <View style={styles.actionsRow}>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleMoveToWishlist(item)}>
                                    <Ionicons name="heart-outline" size={20} color="#666" />
                                    <Text style={styles.actionText}>Move to Wishlist</Text>
                                </TouchableOpacity>
                                <View style={styles.verticalDivider} />
                                <TouchableOpacity style={styles.actionBtn} onPress={() => removeFromCart(item.id)}>
                                    <Ionicons name="trash-outline" size={20} color="#666" />
                                    <Text style={styles.actionText}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Wishlist Link */}
                <TouchableOpacity style={styles.wishlistLink} onPress={() => router.push('/wishlist' as any)}>
                    <Ionicons name="heart-outline" size={20} color="#333" />
                    <Text style={styles.wishlistLinkText}>Wishlist</Text>
                    <Ionicons name="chevron-forward" size={20} color="#333" />
                </TouchableOpacity>

                {/* Price Details */}
                <View style={styles.priceSection}>
                    <Text style={styles.priceHeader}>Price Details ({items.length} Item)</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Total Product Price</Text>
                        <Text style={styles.priceValue}>+ ₹{totalMRP}</Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, { color: '#038D63' }]}>Total Discounts</Text>
                        <Text style={[styles.priceValue, { color: '#038D63' }]}>- ₹{totalDiscount}</Text>
                    </View>

                    <View style={styles.priceDivider} />

                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Order Total</Text>
                        <Text style={styles.totalValue}>₹{finalTotal}</Text>
                    </View>

                    <View style={styles.successBanner}>
                        <MaterialCommunityIcons name="brightness-percent" size={16} color="#038D63" />
                        <Text style={styles.successBannerText}>Yay! Your total discount is ₹{totalDiscount}</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                <View>
                    <Text style={styles.finalPrice}>₹{finalTotal}</Text>
                    <TouchableOpacity onPress={() => { }}>
                        <Text style={styles.viewPriceDetails}>VIEW PRICE DETAILS</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[styles.continueBtn, loading && { opacity: 0.7 }]}
                    onPress={handlePlaceOrder}
                    disabled={loading}
                >
                    <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f0f0' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    emptyText: { marginTop: 20, fontSize: 18, color: '#999' },
    shopBtn: { marginTop: 30, backgroundColor: '#FF6600', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
    shopBtnText: { color: '#fff', fontWeight: 'bold' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 15, marginTop: 40, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 20 },
    step: { alignItems: 'center' },
    stepCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginBottom: 4, backgroundColor: '#fff' },
    stepActive: { borderColor: '#5C6BC0' },
    stepNumber: { fontSize: 12, color: '#5C6BC0', fontWeight: 'bold' },
    stepLabel: { fontSize: 10, color: '#999' },
    stepLabelActive: { color: '#5C6BC0', fontWeight: 'bold' },
    stepLine: { flex: 1, backgroundColor: '#ccc', marginHorizontal: 5, height: 1 },

    scrollContent: { paddingBottom: 20 },

    addressBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, marginTop: 1 },
    addressText: { flex: 1, marginLeft: 10, fontSize: 14, color: '#333' },
    changeBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    changeBtnText: { fontSize: 12, color: '#333', fontWeight: 'bold' },

    bundleBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F8F5', padding: 10, marginTop: 10, justifyContent: 'center' },
    bundleText: { fontSize: 12, color: '#038D63', fontWeight: 'bold', marginLeft: 5 },

    itemsContainer: { marginTop: 10 },
    cartItemCard: { backgroundColor: '#fff', marginBottom: 10 },
    cartItemContent: { flexDirection: 'row', padding: 15 },
    itemImage: { width: 60, height: 80, resizeMode: 'cover', borderRadius: 4 },
    itemInfo: { flex: 1, marginLeft: 15 },
    itemTitle: { fontSize: 14, color: '#333', marginBottom: 4 },
    sellerInfo: { fontSize: 14, color: '#333', fontWeight: 'bold', marginBottom: 4 },
    mrp: { textDecorationLine: 'line-through', color: '#999', fontSize: 12, fontWeight: 'normal' },
    offText: { color: '#038D63', fontSize: 12, marginLeft: 5 },
    deliveryInfo: { fontSize: 13, color: '#666', marginBottom: 4 },
    deliveryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    estimatedDelivery: { fontSize: 12, color: '#666', marginLeft: 5 },

    cardDivider: { height: 1, backgroundColor: '#eee' },
    actionsRow: { flexDirection: 'row', height: 45 },
    actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
    actionText: { fontSize: 13, color: '#666', fontWeight: '600' },
    verticalDivider: { width: 1, backgroundColor: '#eee' },

    wishlistLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, marginTop: 10, marginBottom: 10 },
    wishlistLinkText: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333', fontWeight: '500' },

    priceSection: { backgroundColor: '#fff', padding: 15 },
    priceHeader: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 15 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    priceLabel: { fontSize: 14, color: '#333' },
    priceValue: { fontSize: 14, color: '#333' },
    priceDivider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F8F5', padding: 10, marginTop: 15, borderRadius: 4 },
    successBannerText: { fontSize: 13, color: '#038D63', fontWeight: 'bold', marginLeft: 8 },

    section: { backgroundColor: '#fff', marginTop: 10, padding: 15 },
    resellRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    resellLabel: { fontSize: 15, color: '#333', fontWeight: '500' },
    resellInputContainer: { marginTop: 15 },
    inputLabel: { fontSize: 12, color: '#666', marginBottom: 8 },
    resellInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 10, fontSize: 16 },
    marginText: { marginTop: 8, fontSize: 12, color: '#666' },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
    finalPrice: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    viewPriceDetails: { fontSize: 12, color: '#9F2089', fontWeight: 'bold' },
    continueBtn: { backgroundColor: '#9F2089', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 4 },
    continueBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCartStore } from '@/src/store/cartStore';
import { useAuthStore } from '@/src/store/authStore';
import { getImageUrl } from '@/src/utils/api';

const { width } = Dimensions.get('window');

export default function ReviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { items: cartItems, getTotal: getCartTotal, deliveryAddress, buyNowItem } = useCartStore();
    const { user, token } = useAuthStore();

    // Protect Route
    React.useEffect(() => {
        if (!token) {
            router.replace('/auth/login' as any);
        }
    }, [token]);

    if (!token) return null; // Prevent rendering during redirect

    const isBuyNow = params.mode === 'buy_now';
    // If buy now, use buyNowItem as single item list. Else use cartItems.
    const items = isBuyNow && buyNowItem ? [buyNowItem] : cartItems;

    const address = deliveryAddress ? {
        name: deliveryAddress.name,
        phone: deliveryAddress.phone,
        details: `${deliveryAddress.street}, ${deliveryAddress.city} - ${deliveryAddress.zip}, ${deliveryAddress.state}`
    } : {
        name: user?.name || 'User Name',
        phone: user?.phone || 'Phone Number',
        details: user?.city ? `${user.city} - ${user.zip}` : 'Please select an address'
    };

    const totalSellingPrice = isBuyNow && buyNowItem
        ? (buyNowItem.price * buyNowItem.quantity)
        : getCartTotal();

    // Dynamic Delivery Charge
    const deliveryCharge = items.reduce((acc, item) => {
        const cost = item.shippingCost !== undefined ? item.shippingCost : 40;
        return acc + (cost * item.quantity);
    }, 0);

    const finalTotal = totalSellingPrice + deliveryCharge;

    const totalProductPrice = Math.floor(finalTotal * 1.25); // Simulated MRP based on final total
    const totalDiscount = totalProductPrice - finalTotal;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>REVIEW YOUR ORDER</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Stepper */}
            <View style={styles.stepperContainer}>
                <View style={styles.step}>
                    <View style={[styles.stepCircle, styles.stepActive]}>
                        <Text style={styles.stepNumber}>1</Text>
                    </View>
                    <Text style={[styles.stepLabel, styles.stepLabelActive]}>Review</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.step}>
                    <View style={styles.stepCircle}>
                        <Text style={[styles.stepNumber, { color: '#999' }]}>2</Text>
                    </View>
                    <Text style={styles.stepLabel}>Payment</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Offer Banner */}
                <View style={styles.offerBanner}>
                    <View style={styles.wavyBackground} />
                    <Text style={styles.offerText}>₹{totalDiscount} OFF on this order</Text>
                </View>

                {/* Product Card */}
                {items.map((item, index) => (
                    <View key={index} style={styles.productCard}>
                        <View style={styles.productRow}>
                            <Image source={{ uri: getImageUrl(item.image) || undefined }} style={styles.productImage} />
                            <View style={styles.productInfo}>
                                <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.sellingPrice}>₹{item.price}</Text>
                                    <Text style={styles.mrp}>₹{Math.floor(item.price * 1.25)}</Text>
                                    <Text style={styles.discount}>20% Off</Text>
                                </View>
                                <Text style={styles.returnPolicy}>All issue easy returns</Text>
                                <Text style={styles.sizeQty}>Size: {item.size || 'Standard'}   •   Qty: {item.quantity}</Text>
                                <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                    Shipping: ₹{item.shippingCost !== undefined ? item.shippingCost : 40}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}

                <View style={styles.sellerSection}>
                    <Text style={styles.soldBy}>Sold by: Seller Name</Text>
                    <Text style={styles.freeDelivery}>{deliveryCharge === 0 ? 'Free Delivery' : `Delivery: ₹${deliveryCharge}`}</Text>
                </View>

                {/* Delivery Section */}
                <View style={styles.deliverySection}>
                    <View style={styles.deliveryHeader}>
                        <MaterialCommunityIcons name="truck-delivery" size={20} color="#3B82F6" />
                        <Text style={styles.deliveryTitle}>Estimated Delivery by Thursday, 01st Jan</Text>
                    </View>
                    <View style={styles.addressContainer}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.addressName}>{address.name}  <Text style={styles.addressPhone}>• {address.phone}</Text></Text>
                            <Text style={styles.addressDetails} numberOfLines={2}>{address.details}</Text>
                        </View>
                        <TouchableOpacity style={styles.changeBtn} onPress={() => router.push({ pathname: '/address', params: { select: 'true' } } as any)}>
                            <Text style={styles.changeBtnText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Price Details */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Price Details</Text>
                        <Ionicons name="chevron-up" size={20} color="#666" />
                    </View>

                    <View style={styles.summaryPriceRow}>
                        <Text style={styles.priceLabel}>Total Product Price</Text>
                        <Text style={styles.priceValue}>+ ₹{totalSellingPrice}</Text>
                    </View>
                    <View style={styles.summaryPriceRow}>
                        <Text style={styles.priceLabel}>Delivery Fee</Text>
                        <Text style={styles.priceValue}>+ ₹{deliveryCharge}</Text>
                    </View>
                    <View style={styles.summaryPriceRow}>
                        <Text style={[styles.priceLabel, { color: '#038D63' }]}>Total Discounts</Text>
                        <Text style={[styles.priceValue, { color: '#038D63' }]}>- ₹0</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryPriceRow}>
                        <Text style={styles.totalLabel}>Order Total</Text>
                        <Text style={styles.totalValue}>₹{finalTotal}</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                <View>
                    <Text style={styles.finalPrice}>₹{finalTotal}</Text>
                    <View style={styles.totalSavingsTag}>
                        <Text style={styles.totalSavingsText}>₹{totalDiscount} OFF</Text>
                    </View>
                    <Text style={styles.viewPriceDetails}>VIEW PRICE DETAILS</Text>
                </View>
                <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={() => router.push({ pathname: '/payment', params: { mode: isBuyNow ? 'buy_now' : 'default' } } as any)}
                >
                    <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#666' },

    stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 40, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    step: { alignItems: 'center' },
    stepCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginBottom: 4, backgroundColor: '#fff' },
    stepActive: { borderColor: '#5C6BC0' },
    stepNumber: { fontSize: 10, color: '#5C6BC0', fontWeight: 'bold' },
    stepLabel: { fontSize: 10, color: '#999' },
    stepLabelActive: { color: '#5C6BC0', fontWeight: 'bold' },
    stepLine: { flex: 1, marginHorizontal: 10, height: 1, backgroundColor: '#ccc' },

    scrollContent: { paddingBottom: 20 },

    offerBanner: { backgroundColor: '#E8F8F5', padding: 10, alignItems: 'center', position: 'relative', overflow: 'hidden', marginBottom: 10 },
    wavyBackground: { position: 'absolute', bottom: -5, left: 0, right: 0, height: 10, backgroundColor: '#fff', borderRadius: 5 }, // Simple simulation
    offerText: { color: '#038D63', fontWeight: 'bold', fontSize: 13 },

    productCard: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    productRow: { flexDirection: 'row' },
    productImage: { width: 80, height: 80, resizeMode: 'cover', borderRadius: 4, backgroundColor: '#eee' },
    productInfo: { flex: 1, marginLeft: 15 },
    productTitle: { fontSize: 14, color: '#333', marginBottom: 5 },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    sellingPrice: { fontSize: 15, fontWeight: 'bold', color: '#333', marginRight: 8 },
    mrp: { fontSize: 13, color: '#999', textDecorationLine: 'line-through', marginRight: 8 },
    discount: { fontSize: 13, color: '#038D63', fontWeight: 'bold' },
    returnPolicy: { fontSize: 12, color: '#666', marginBottom: 5 },
    sizeQty: { fontSize: 12, color: '#999' },

    sellerSection: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 15, marginTop: 1, marginBottom: 10 },
    soldBy: { fontSize: 12, color: '#666' },
    freeDelivery: { fontSize: 12, color: '#666' },

    deliverySection: { backgroundColor: '#fff', padding: 15, marginBottom: 10 },
    deliveryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    deliveryTitle: { marginLeft: 10, fontWeight: 'bold', fontSize: 13, color: '#333' },
    addressContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    addressName: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 2 },
    addressPhone: { fontWeight: 'normal', color: '#666' },
    addressDetails: { fontSize: 12, color: '#666', lineHeight: 18 },
    changeBtn: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
    changeBtnText: { fontSize: 12, color: '#333', fontWeight: 'bold' },

    section: { backgroundColor: '#fff', padding: 15, marginBottom: 10 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    summaryPriceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    priceLabel: { fontSize: 13, color: '#333' },
    priceValue: { fontSize: 13, color: '#333' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 5 },
    totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
    finalPrice: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    totalSavingsTag: { backgroundColor: '#E8F8F5', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 5 },
    totalSavingsText: { fontSize: 10, color: '#038D63', fontWeight: 'bold' },
    viewPriceDetails: { fontSize: 10, color: '#9F2089', fontWeight: 'bold', marginTop: 2 },
    continueBtn: { backgroundColor: '#9F2089', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 4 },
    continueBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

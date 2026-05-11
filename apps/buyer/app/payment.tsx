import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Pressable, Alert, Modal, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCartStore } from '@/src/store/cartStore';
import api from '@/src/utils/api';
import { useAuthStore } from '@/src/store/authStore';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';

export default function PaymentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { items: cartItems, getTotal: getCartTotal, clearCart, deliveryAddress, buyNowItem, clearBuyNowItem } = useCartStore();
    const { user } = useAuthStore();

    const isBuyNow = params.mode === 'buy_now';
    const items = isBuyNow && buyNowItem ? [buyNowItem] : cartItems;

    // Payment Method State
    // Default to 'online' as it matches screenshot showcasing discount
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('online');
    const [loading, setLoading] = useState(false);

    // Pricing Logic
    // Verify these match Cart logic
    const sellingPrice = isBuyNow && buyNowItem ? (buyNowItem.price * buyNowItem.quantity) : getCartTotal();

    const deliveryCost = items.reduce((acc, item) => {
        const cost = item.shippingCost !== undefined ? item.shippingCost : 40;
        return acc + (cost * item.quantity);
    }, 0);

    const baseTotal = sellingPrice + deliveryCost;
    const codSurcharge = 0; // Removing COD surcharge for now or keeping separate? User didn't ask, but let's keep it safe. Actually user request is about delivery charge.
    // Let's stick to delivery fee.

    const finalPayable = paymentMethod === 'cod' ? baseTotal + codSurcharge : baseTotal;
    const discountAmount = 0;



    const handlePlaceOrder = async () => {
        if (loading) return;

        // Validation
        if (!items || items.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to cart first');
            return;
        }

        const address = deliveryAddress || {
            name: user?.name || 'User Name',
            street: '123 Main St',
            city: 'Varanasi',
            zip: '221007',
            phone: '9876543210'
        };

        try {
            setLoading(true);

            // Step 1: Create order first
            const orderPayload = {
                items: items.map(i => ({ product: i.id, quantity: i.quantity, size: i.size })),
                deliveryAddress: address,
                paymentMethod: paymentMethod,
                resellerPrice: 0,
                margin: 0,
                isPaid: false, // Will be updated after payment
                deliveryCharge: deliveryCost // Send calculated delivery charge
            };

            const orderResponse = await api.post('/orders', orderPayload);
            const createdOrder = orderResponse.data;
            const orderId = createdOrder._id;

            if (paymentMethod === 'online') {
                // Step 2: Create Razorpay payment order
                const paymentResponse = await api.post('/payments/create', {
                    amount: finalPayable,
                    orderId: orderId
                });

                // Step 3: Open Razorpay
                const options = {
                    description: 'Order Payment',
                    image: 'https://i.imgur.com/3g7nmJC.png',
                    currency: 'INR',
                    key: 'rzp_test_RMXAUXty6nvaXm', // Replace with your key
                    amount: Math.round(finalPayable * 100),
                    order_id: paymentResponse.data.order.id,
                    name: 'Sell Now',
                    prefill: {
                        email: user?.email || 'test@example.com',
                        contact: user?.phone || '9876543210',
                        name: user?.name || 'User'
                    },
                    theme: { color: '#9F2089' }
                };

                RazorpayCheckout.open(options)
                    .then(async (data: any) => {
                        // Step 4: Verify payment on backend
                        try {
                            await api.post('/payments/verify', {
                                razorpay_order_id: data.razorpay_order_id,
                                razorpay_payment_id: data.razorpay_payment_id,
                                razorpay_signature: data.razorpay_signature,
                                orderId: orderId
                            });

                            if (isBuyNow) {
                                clearBuyNowItem();
                            } else {
                                clearCart();
                            }
                            setLoading(false);
                            Alert.alert('Payment Successful!', 'Your order has been placed.', [
                                { text: 'View Orders', onPress: () => router.push('/(tabs)/orders' as any) }
                            ]);
                        } catch (verifyError: any) {
                            setLoading(false);
                            Alert.alert('Verification Failed', 'Payment successful but verification failed. Contact support.');
                        }
                    })
                    .catch((error: any) => {
                        setLoading(false);
                        Alert.alert('Payment Failed', error.description || 'Payment was cancelled');
                    });
            } else {
                // COD flow
                await api.post('/payments/cod', { orderId });

                clearCart();
                setLoading(false);
                Alert.alert('Order Placed!', `Your COD order of ₹${finalPayable} has been placed successfully!`, [
                    { text: 'OK', onPress: () => router.push('/(tabs)/orders' as any) }
                ]);
            }
        } catch (error: any) {
            console.error(error);
            setLoading(false);
            Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
        }
    };

    const [showPriceDetails, setShowPriceDetails] = useState(false);

    // Calculate Price Details for Modal
    const totalProductPrice = Math.floor(baseTotal * 1.25); // Simulated MRP
    const totalDiscount = totalProductPrice - baseTotal; // This logic might need to match Review/Cart exactly if we want consistency, but for now this is consistent with what we have.
    // Wait, in ReviewScreen we simulated MRP. Let's try to be consistent.
    // In Cart: totalMRP = floor(totalSellingPrice * 1.25).
    // Here baseTotal includes delivery? No, baseTotal = sellingPrice + deliveryCost.
    // So MRP should be based on sellingPrice.
    const totalMRP = Math.floor(sellingPrice * 1.25);
    const totalSavings = totalMRP - sellingPrice;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PAYMENT METHOD</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Stepper */}
            <View style={styles.stepperContainer}>
                <View style={[styles.step]}>
                    <View style={[styles.stepCircle, { backgroundColor: '#5C6BC0', borderColor: '#5C6BC0' }]}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                    <Text style={[styles.stepLabel, { color: '#5C6BC0' }]}>Review</Text>
                </View>
                <View style={[styles.stepLine, { backgroundColor: '#5C6BC0' }]} />
                <View style={styles.step}>
                    <View style={[styles.stepCircle, styles.stepActive]}>
                        <Text style={styles.stepNumber}>2</Text>
                    </View>
                    <Text style={[styles.stepLabel, styles.stepLabelActive]}>Payment</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Select payment method</Text>

                {/* COD Option */}
                <Pressable style={styles.methodCard} onPress={() => setPaymentMethod('cod')}>
                    <View style={styles.methodInfo}>
                        <View style={styles.methodMain}>
                            <Text style={styles.methodPrice}>₹{baseTotal + codSurcharge}</Text>
                            <Text style={styles.methodName}>Cash on Delivery</Text>
                            <MaterialCommunityIcons name="cash" size={20} color="#038D63" style={{ marginLeft: 8 }} />
                        </View>
                    </View>
                    <View style={[styles.radioOuter, paymentMethod === 'cod' && { borderColor: '#9F2089' }]}>
                        {paymentMethod === 'cod' && <View style={styles.radioInner} />}
                    </View>
                </Pressable>

                {/* Pay Online Option */}
                <Pressable style={[styles.methodCard, paymentMethod === 'online' && styles.selectedMethodCard]} onPress={() => setPaymentMethod('online')}>
                    <View style={styles.methodInfo}>
                        <View style={styles.methodMain}>
                            <View>
                                <Text style={styles.strikethroughPrice}>₹{baseTotal + codSurcharge}</Text>
                                <Text style={[styles.methodPrice, { color: '#038D63' }]}>₹{baseTotal}</Text>
                            </View>
                            <Text style={[styles.methodName, { marginLeft: 15 }]}>Pay Online</Text>
                            <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/2560px-Paytm_Logo_%28standalone%29.svg.png' }} style={styles.logo} />
                        </View>
                        {codSurcharge > 0 && (
                            <View style={styles.saveTag}>
                                <Text style={styles.saveTagText}>Save ₹{codSurcharge}</Text>
                            </View>
                        )}
                    </View>
                    <View style={[styles.radioOuter, paymentMethod === 'online' && { borderColor: '#9F2089' }]}>
                        {/* Checkmark style for active */}
                        {paymentMethod === 'online' ? (
                            <View style={styles.activeRadioBg}>
                                <Ionicons name="checkmark" size={12} color="#fff" />
                            </View>
                        ) : null}
                    </View>
                </Pressable>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                <View>
                    <Text style={styles.finalPrice}>₹{finalPayable}</Text>
                    {discountAmount > 0 &&
                        <View style={styles.saveBadge}>
                            <Text style={styles.saveBadgeText}>{`₹${discountAmount} OFF`}</Text>
                        </View>
                    }
                    <TouchableOpacity onPress={() => setShowPriceDetails(true)}>
                        <Text style={styles.viewPriceDetails}>VIEW PRICE DETAILS</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[styles.placeOrderBtn, loading && { opacity: 0.7 }]}
                    onPress={handlePlaceOrder}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeOrderBtnText}>Place Order</Text>}
                </TouchableOpacity>
            </View>

            {/* Price Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showPriceDetails}
                onRequestClose={() => setShowPriceDetails(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Price Details</Text>
                            <TouchableOpacity onPress={() => setShowPriceDetails(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Total Product Price</Text>
                            <Text style={styles.priceValue}>+ ₹{totalMRP}</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Delivery Fee</Text>
                            <Text style={styles.priceValue}>+ ₹{deliveryCost}</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={[styles.priceLabel, { color: '#038D63' }]}>Total Discounts</Text>
                            <Text style={[styles.priceValue, { color: '#038D63' }]}>- ₹{totalSavings}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Order Total</Text>
                            <Text style={styles.totalValue}>₹{finalPayable}</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#666' },

    stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 40 },
    step: { alignItems: 'center' },
    stepCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginBottom: 4, backgroundColor: '#fff' },
    stepActive: { borderColor: '#5C6BC0' },
    stepNumber: { fontSize: 10, color: '#5C6BC0', fontWeight: 'bold' },
    stepLabel: { fontSize: 10, color: '#999' },
    stepLabelActive: { color: '#5C6BC0', fontWeight: 'bold' },
    stepLine: { flex: 1, marginHorizontal: 10, height: 1, backgroundColor: '#ccc' },

    scrollContent: { paddingBottom: 20 },

    offerBanner: { backgroundColor: '#E8F8F5', padding: 10, alignItems: 'center', marginBottom: 20 },
    wavyBackground: { position: 'absolute', bottom: -5, left: 0, right: 0, height: 10, backgroundColor: '#f5f5f5', borderRadius: 5 },
    offerText: { color: '#038D63', fontWeight: 'bold', fontSize: 13 },

    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginLeft: 15, marginBottom: 15 },

    methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, marginBottom: 10, borderRadius: 8, marginHorizontal: 15, borderWidth: 1, borderColor: '#eee' },
    selectedMethodCard: { borderWidth: 1, borderColor: '#9F2089' },
    methodInfo: { flex: 1 },
    methodMain: { flexDirection: 'row', alignItems: 'center' },
    methodPrice: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    strikethroughPrice: { fontSize: 10, color: '#999', textDecorationLine: 'line-through' },
    methodName: { fontSize: 14, color: '#333', marginLeft: 10 },
    logo: { width: 30, height: 10, resizeMode: 'contain', marginLeft: 10 },
    saveTag: { backgroundColor: '#E8F8F5', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 5 },
    saveTagText: { fontSize: 10, color: '#038D63', fontWeight: 'bold' },

    radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#666', justifyContent: 'center', alignItems: 'center' },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#666' },
    activeRadioBg: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#9F2089', justifyContent: 'center', alignItems: 'center' },

    bankOfferBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 10, marginHorizontal: 15, marginBottom: 15, borderRadius: 4 },
    bankOfferText: { flex: 1, fontSize: 12, color: '#666', marginLeft: 8 },
    viewOffers: { fontSize: 12, color: '#038D63', fontWeight: 'bold' },

    sectionContainer: { backgroundColor: '#fff', marginHorizontal: 15, borderRadius: 8, marginBottom: 10, paddingBottom: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
    sectionHeaderText: { fontSize: 14, fontWeight: 'bold', color: '#333', marginLeft: 10 },
    offersAvailable: { fontSize: 12, color: '#038D63', marginLeft: 5 },

    subOption: { flexDirection: 'row', alignItems: 'flex-start', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
    appIcon: { width: 30, height: 30, resizeMode: 'contain', marginRight: 15 },
    subOptionText: { fontSize: 14, color: '#333', fontWeight: '500' },
    cashbackText: { fontSize: 11, color: '#038D63', marginTop: 2, lineHeight: 16 },

    addUpiRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    addUpiText: { fontSize: 12, color: '#9F2089', fontWeight: 'bold', marginRight: 5 },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
    finalPrice: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    saveBadge: { backgroundColor: '#E8F8F5', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, marginLeft: 5 },
    saveBadgeText: { fontSize: 10, color: '#038D63' },
    viewPriceDetails: { fontSize: 10, color: '#9F2089', fontWeight: 'bold', marginTop: 2 },
    placeOrderBtn: { backgroundColor: '#9F2089', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 4 },
    placeOrderBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    priceLabel: { fontSize: 14, color: '#666' },
    priceValue: { fontSize: 14, color: '#333', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },

});

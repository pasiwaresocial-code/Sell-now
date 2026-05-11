import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import api, { getImageUrl } from '../../src/utils/api';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [returnModalVisible, setReturnModalVisible] = useState(false);
    const [returnReason, setReturnReason] = useState('');
    const [returnImages, setReturnImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [returnVideo, setReturnVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        if (returnImages.length >= 2) {
            Alert.alert('Limit Reached', 'You can only upload up to 2 photos.');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], // Use string array for newer versions, or MediaTypeOptions.Images
            quality: 0.7,
        });

        if (!result.canceled) {
            setReturnImages([...returnImages, result.assets[0]]);
        }
    };

    const pickVideo = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setReturnVideo(result.assets[0]);
        }
    };

    const uploadMedia = async () => {
        const formData = new FormData();
        const imageUrls = [];
        let videoUrl = '';

        // Upload Images
        if (returnImages.length > 0) {
            const imgFormData = new FormData();
            returnImages.forEach((img, index) => {
                // @ts-ignore
                imgFormData.append('images', {
                    uri: img.uri,
                    name: `return_img_${index}.jpg`,
                    type: 'image/jpeg',
                });
            });

            try {
                const { data } = await api.post('/upload/multiple', imgFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                imageUrls.push(...data);
            } catch (error) {
                console.error('Image Upload Failed', error);
                throw new Error('Failed to upload images');
            }
        }

        // Upload Video
        if (returnVideo) {
            const vidFormData = new FormData();
            // @ts-ignore
            vidFormData.append('video', {
                uri: returnVideo.uri,
                name: 'return_video.mp4',
                type: 'video/mp4',
            });

            try {
                const { data } = await api.post('/upload/video', vidFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                videoUrl = data.url;
            } catch (error) {
                console.error('Video Upload Failed', error);
                throw new Error('Failed to upload video');
            }
        }

        return { imageUrls, videoUrl };
    };

    const handleReturnRequest = async () => {
        if (!returnReason.trim()) {
            Alert.alert('Error', 'Please provide a reason');
            return;
        }

        // Validate evidence (Optional: require at least 1 image?)
        if (returnImages.length === 0 && !returnVideo) {
            Alert.alert('Evidence Required', 'Please attach at least one photo or video to support your return request.');
            return;
        }

        setUploading(true);
        try {
            const { imageUrls, videoUrl } = await uploadMedia();

            await api.post(`/orders/${id}/return`, {
                reason: returnReason,
                images: imageUrls,
                video: videoUrl
            });
            Alert.alert('Success', 'Return request submitted successfully');
            setReturnModalVisible(false);
            setReturnImages([]);
            setReturnVideo(null);
            setReturnReason('');
            fetchOrderDetails(); // Refresh
        } catch (error: any) {
            console.error('Return Request Error:', error);
            Alert.alert('Error', error.result?.message || error.message || 'Failed to submit return request');
        } finally {
            setUploading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copied!', 'AWB code copied to clipboard');
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const { data } = await api.get(`/orders/${id}`);
            setOrder(data);
        } catch (error) {
            // Error logged by interceptor
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF6600" />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Order not found</Text>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#FF9500';
            case 'confirmed': return '#007AFF';
            case 'shipped': return '#5856D6';
            case 'out_for_delivery': return '#FF2D55';
            case 'delivered': return '#34C759';
            case 'cancelled': return '#FF3B30';
            default: return '#8E8E93';
        }
    };

    // Mapping for Timeline
    const steps = [
        { key: 'confirmed', label: 'Order Confirmed', icon: 'clipboard-check-outline' },
        { key: 'shipped', label: 'Shipped', icon: 'truck-fast-outline' },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'moped-outline' },
        { key: 'delivered', label: 'Delivered', icon: 'home-circle-outline' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === order.orderStatus);
    // If pending, index is -1. If cancelled, handle separately.

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Order Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View>
                            <Text style={styles.orderLabel}>Order ID</Text>
                            <Text style={styles.orderValue}>#{order._id.slice(-8).toUpperCase()}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.orderStatus) + '15' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(order.orderStatus) }]}>
                                {order.orderStatus === 'out_for_delivery' ? 'OUT FOR DELIVERY' : order.orderStatus.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.dateText}>Placed on {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}</Text>
                </View>

                {/* Shiprocket Premium Tracking Card */}
                {order.shiprocket?.awbCode && (
                    <LinearGradient
                        colors={['#4facfe', '#00f2fe']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.trackingCard}
                    >
                        <View style={styles.trackingHeader}>
                            <MaterialCommunityIcons name="truck-delivery" size={28} color="#fff" />
                            <Text style={styles.courierName}>{order.shiprocket.courierName || 'Courier Partner'}</Text>
                        </View>

                        <View style={styles.awbContainer}>
                            <View>
                                <Text style={styles.awbLabel}>AWB / Tracking ID</Text>
                                <Text style={styles.awbCode}>{order.shiprocket.awbCode}</Text>
                            </View>
                            <TouchableOpacity style={styles.copyButton} onPress={() => copyToClipboard(order.shiprocket.awbCode)}>
                                <Feather name="copy" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {order.shiprocket.trackingUrl && (
                            <TouchableOpacity
                                style={styles.trackButton}
                                onPress={() => Linking.openURL(order.shiprocket.trackingUrl)}
                            >
                                <Text style={styles.trackButtonText}>Track Order Live</Text>
                                <MaterialCommunityIcons name="arrow-right-circle" size={18} color="#007AFF" />
                            </TouchableOpacity>
                        )}
                    </LinearGradient>
                )}

                {/* Vertical Timeline */}
                <View style={[styles.section, { paddingVertical: 20 }]}>
                    <Text style={styles.sectionTitle}>Delivery Timeline</Text>
                    <View style={styles.timelineContainer}>
                        {steps.map((step, index) => {
                            const isCompleted = currentStepIndex >= index || order.orderStatus === 'delivered';
                            const isCurrent = currentStepIndex === index;
                            const isLast = index === steps.length - 1;

                            // Find timestamp if available in history (mock logic for now if history is simple)
                            const historyItem = order.statusHistory?.find((h: any) => h.status === step.key);
                            const completionDate = historyItem ? format(new Date(historyItem.timestamp), 'dd MMM, hh:mm a') : null;

                            return (
                                <View key={step.key} style={styles.timelineItem}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[
                                            styles.timelineIconContainer,
                                            isCompleted ? styles.iconCompleted : styles.iconPending,
                                            isCurrent && styles.iconCurrent
                                        ]}>
                                            <MaterialCommunityIcons
                                                name={step.icon as any}
                                                size={18}
                                                color={isCompleted ? '#fff' : '#ccc'}
                                            />
                                        </View>
                                        {!isLast && (
                                            <View style={[
                                                styles.timelineLine,
                                                isCompleted && currentStepIndex > index ? styles.lineCompleted : styles.linePending
                                            ]} />
                                        )}
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <Text style={[styles.stepTitle, isCompleted && styles.textCompleted]}>{step.label}</Text>
                                        {completionDate && <Text style={styles.stepDate}>{completionDate}</Text>}
                                        {isCurrent && <Text style={styles.currentStatusLabel}>In Progress</Text>}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Items in Order</Text>
                    {order.items.map((item: any, index: number) => (
                        <View key={index} style={styles.productCard}>
                            <Image
                                source={{ uri: getImageUrl(item.image || item.product?.images?.[0]) || undefined }}
                                style={styles.productImage}
                            />
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.title || item.product?.title}</Text>
                                <Text style={styles.variantText}>Qty: {item.quantity}{item.size ? ` • Size: ${item.size}` : ''}</Text>
                                <Text style={styles.productPrice}>₹{item.price}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Payment & Address */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bill Details</Text>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Item Total</Text>
                        <Text style={styles.billValue}>₹{order.pricing.subtotal}</Text>
                    </View>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Delivery Fee</Text>
                        <Text style={styles.billValue}>{order.pricing.deliveryCharge === 0 ? 'Free' : `₹${order.pricing.deliveryCharge}`}</Text>
                    </View>
                    {order.pricing.discount > 0 && (
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Discount</Text>
                            <Text style={[styles.billValue, { color: '#34C759' }]}>-₹{order.pricing.discount}</Text>
                        </View>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.billRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>₹{order.pricing.total}</Text>
                    </View>
                    <View style={[styles.paymentMethodBadge, { alignSelf: 'flex-start', marginTop: 10 }]}>
                        <Text style={styles.paymentMethodText}>{order.paymentMethod.type === 'cod' ? 'CASH ON DELIVERY' : 'ONLINE PAID'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Shipping Address</Text>
                    <View style={styles.addressContainer}>
                        <Ionicons name="location-outline" size={24} color="#666" style={{ marginTop: 2, marginRight: 10 }} />
                        <View>
                            <Text style={styles.addressName}>{order.deliveryAddress.name}</Text>
                            <Text style={styles.addressText}>{order.deliveryAddress.addressLine1}</Text>
                            {order.deliveryAddress.addressLine2 && <Text style={styles.addressText}>{order.deliveryAddress.addressLine2}</Text>}
                            <Text style={styles.addressText}>
                                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                            </Text>
                            <Text style={[styles.addressText, { marginTop: 4, fontWeight: '500' }]}>Mobile: {order.deliveryAddress.phone}</Text>
                        </View>
                    </View>
                </View>

                {/* Return Status & Timeline */}
                {order.returnRequest?.isRequested && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Return Status</Text>

                        {/* Return Info Card */}
                        <View style={styles.returnStatusCard}>
                            <View style={styles.returnRow}>
                                <Text style={styles.returnLabel}>Current Status:</Text>
                                <Text style={[styles.returnStatus, {
                                    color: order.returnRequest.status === 'rejected' ? '#FF3B30' : '#007AFF'
                                }]}>
                                    {order.returnRequest.pickupStatus && order.returnRequest.pickupStatus !== 'pending'
                                        ? order.returnRequest.pickupStatus.replace(/_/g, ' ').toUpperCase()
                                        : order.returnRequest.status.toUpperCase()}
                                </Text>
                            </View>
                            {order.returnRequest.reason && (
                                <Text style={styles.returnReason}>Reason: {order.returnRequest.reason}</Text>
                            )}
                            {order.returnRequest.rejectionReason && (
                                <Text style={[styles.returnReason, { color: '#FF3B30' }]}>
                                    Rejection Reason: {order.returnRequest.rejectionReason}
                                </Text>
                            )}
                        </View>

                        {/* Return Timeline - Only if Approved/Processing */}
                        {order.returnRequest.status !== 'rejected' && (
                            <View style={styles.timelineContainer}>
                                {[
                                    { key: 'pending', label: 'Return Requested' },
                                    { key: 'approved', label: 'Return Approved' },
                                    { key: 'scheduled', label: 'Pickup Scheduled' },
                                    { key: 'picked_up', label: 'Picked Up' },
                                    { key: 'received_by_seller', label: 'Refund Processed' }
                                ].map((step, index) => {
                                    // Determine if this step is active/completed
                                    let isCompleted = false;
                                    const currentStatus = order.returnRequest.pickupStatus || 'pending';

                                    // Simple linear progression check
                                    const statusOrder = ['pending', 'approved', 'scheduled', 'out_for_pickup', 'picked_up', 'in_transit', 'received_by_seller'];

                                    // Map 'pending' return request to 'pending'
                                    // Map 'approved' return request to 'approved'

                                    let actualCurrentIndex = 0;
                                    if (order.returnRequest.status === 'pending') actualCurrentIndex = 0;
                                    else if (order.returnRequest.status === 'approved' && currentStatus === 'pending') actualCurrentIndex = 1;
                                    else actualCurrentIndex = statusOrder.indexOf(currentStatus);

                                    // Adjust for our display steps
                                    // Display Step 0: requested (always true if we are here)
                                    // Display Step 1: approved (true if status is approved or beyond)
                                    // Display Step 2: scheduled (true if pickupStatus is scheduled or beyond)
                                    // Display Step 3: picked_up (true if pickupStatus is picked_up or received)
                                    // Display Step 4: received (true if received)

                                    if (index === 0) isCompleted = true;
                                    if (index === 1 && (order.returnRequest.status === 'approved' || actualCurrentIndex > 0)) isCompleted = true;
                                    if (index === 2 && actualCurrentIndex >= statusOrder.indexOf('scheduled')) isCompleted = true;
                                    if (index === 3 && actualCurrentIndex >= statusOrder.indexOf('picked_up')) isCompleted = true;
                                    if (index === 4 && actualCurrentIndex >= statusOrder.indexOf('received_by_seller')) isCompleted = true;

                                    return (
                                        <View key={step.key} style={styles.timelineItem}>
                                            <View style={styles.timelineLeft}>
                                                <View style={[styles.timelineDot, isCompleted ? styles.dotCompleted : styles.dotPending]} />
                                                {index < 4 && <View style={[styles.timelineLine, isCompleted ? styles.lineCompleted : styles.linePending]} />}
                                            </View>
                                            <View style={styles.timelineContent}>
                                                <Text style={[styles.stepTitle, isCompleted && styles.textCompleted]}>{step.label}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}

                {/* Help & Support (Modified to remove old return status card) */}
                <View style={[styles.section, { marginBottom: 30 }]}>
                    <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Need Help?</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            style={[styles.supportButton, { flex: 1, backgroundColor: '#E0F2F1', borderColor: '#B2DFDB' }]}
                            onPress={() => Linking.openURL('https://wa.me/919014081760')}
                        >
                            <MaterialCommunityIcons name="whatsapp" size={20} color="#009688" />
                            <Text style={[styles.supportButtonText, { color: '#00796B' }]}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.supportButton, { flex: 1 }]}
                            onPress={() => Linking.openURL('tel:+919014081760')}
                        >
                            <MaterialCommunityIcons name="phone" size={20} color="#666" />
                            <Text style={styles.supportButtonText}>Call Us</Text>
                        </TouchableOpacity>
                    </View>

                    {order.orderStatus === 'delivered' && !order.returnRequest?.isRequested && (
                        <TouchableOpacity
                            style={[styles.supportButton, { marginTop: 10, borderColor: '#FF6600', backgroundColor: '#FFF5EC' }]}
                            onPress={() => setReturnModalVisible(true)}
                        >
                            <MaterialCommunityIcons name="keyboard-return" size={20} color="#FF6600" />
                            <Text style={[styles.supportButtonText, { color: '#FF6600' }]}>Return Order</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </ScrollView>

            {/* Return Modal */}
            <Modal
                visible={returnModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setReturnModalVisible(false)}
            >
                <View style={modalStyles.centeredView}>
                    <View style={modalStyles.modalView}>
                        <Text style={modalStyles.modalTitle}>Request Return</Text>
                        <Text style={modalStyles.modalText}>Please tell us why you want to return this item.</Text>
                        <TextInput
                            style={modalStyles.input}
                            placeholderTextColor="#999"
                            placeholder="Reason (e.g. Size issue, Defective)"
                            value={returnReason}
                            onChangeText={setReturnReason}
                            multiline

                        />

                        {/* Upload Section */}
                        <View style={{ width: '100%', marginBottom: 15 }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Evidence (Required)</Text>

                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                                <TouchableOpacity onPress={pickImage} style={modalStyles.uploadBtn}>
                                    <Ionicons name="camera" size={20} color="#666" />
                                    <Text style={modalStyles.uploadText}>Add Photo ({returnImages.length}/2)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={pickVideo} style={modalStyles.uploadBtn}>
                                    <Ionicons name="videocam" size={20} color="#666" />
                                    <Text style={modalStyles.uploadText}>{returnVideo ? 'Change Video' : 'Add Unboxing Video'}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Previews */}
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                {returnImages.map((img, index) => (
                                    <View key={index} style={{ position: 'relative' }}>
                                        <Image source={{ uri: img.uri }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                                        <TouchableOpacity
                                            onPress={() => setReturnImages(returnImages.filter((_, i) => i !== index))}
                                            style={modalStyles.removeBtn}
                                        >
                                            <Ionicons name="close-circle" size={18} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {returnVideo && (
                                    <View style={{ position: 'relative', justifyContent: 'center', alignItems: 'center', width: 60, height: 60, backgroundColor: '#000', borderRadius: 8 }}>
                                        <Ionicons name="play" size={24} color="#fff" />
                                        <TouchableOpacity
                                            onPress={() => setReturnVideo(null)}
                                            style={modalStyles.removeBtn}
                                        >
                                            <Ionicons name="close-circle" size={18} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={modalStyles.buttonRow}>
                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.buttonClose]}
                                onPress={() => setReturnModalVisible(false)}
                            >
                                <Text style={modalStyles.textStyle}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.buttonSubmit]}
                                onPress={handleReturnRequest}
                            >
                                <Text style={modalStyles.textStyle}>{uploading ? 'Uploading...' : 'Submit'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: '#666' },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 15,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
    scrollContent: { flex: 1, padding: 16 },

    // Summary Card
    summaryCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    orderLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
    orderValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    dateText: { fontSize: 12, color: '#999' },

    // Tracking Card Gradient
    trackingCard: { borderRadius: 16, padding: 20, marginBottom: 20, elevation: 4 },
    trackingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    courierName: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
    awbContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 10, marginBottom: 16 },
    awbLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
    awbCode: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    copyButton: { padding: 8 },
    trackButton: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, borderRadius: 50, justifyContent: 'center', alignItems: 'center', gap: 8 },
    trackButtonText: { color: '#007AFF', fontWeight: 'bold', fontSize: 14 },

    // Vertical Timeline
    section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    timelineContainer: { paddingLeft: 10 },
    timelineItem: { flexDirection: 'row', minHeight: 70 },
    timelineLeft: { alignItems: 'center', marginRight: 15, width: 30 },
    timelineIconContainer: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    iconCompleted: { backgroundColor: '#34C759' },
    iconCurrent: { backgroundColor: '#007AFF', borderWidth: 3, borderColor: '#D1E8FF' },
    iconPending: { backgroundColor: '#E0E0E0' },

    lineCompleted: { backgroundColor: '#34C759' },
    linePending: { backgroundColor: '#E0E0E0' },
    timelineContent: { flex: 1, paddingTop: 5, paddingBottom: 20 },
    stepTitle: { fontSize: 15, color: '#ccc', fontWeight: '500' },
    textCompleted: { color: '#333', fontWeight: 'bold' },
    stepDate: { fontSize: 12, color: '#999', marginTop: 2 },
    currentStatusLabel: { fontSize: 11, color: '#007AFF', fontWeight: 'bold', marginTop: 4, backgroundColor: '#F0F8FF', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },

    // Items
    productCard: { flexDirection: 'row', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    productImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#f0f0f0' },
    productInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    productName: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 4 },
    variantText: { fontSize: 12, color: '#666', marginBottom: 6 },
    productPrice: { fontSize: 15, fontWeight: 'bold', color: '#333' },

    // Bill
    billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    billLabel: { fontSize: 14, color: '#666' },
    billValue: { fontSize: 14, color: '#333', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 16, fontWeight: 'bold', color: '#FF6600' },
    paymentMethodBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    paymentMethodText: { fontSize: 11, fontWeight: 'bold', color: '#666' },

    // Address
    addressContainer: { flexDirection: 'row' },
    addressName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    addressText: { fontSize: 13, color: '#666', lineHeight: 18 },

    // Support
    supportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderWidth: 1, borderColor: '#eee', borderRadius: 8, gap: 8, backgroundColor: '#fff' },
    supportButtonText: { fontSize: 14, fontWeight: '500', color: '#666' },
    returnStatusCard: { marginTop: 0, padding: 15, backgroundColor: '#F8F9FA', borderRadius: 8, borderWidth: 1, borderColor: '#EEE', marginBottom: 20 },
    returnTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
    returnRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    returnLabel: { marginRight: 8, color: '#666' },
    returnStatus: { fontWeight: 'bold', fontSize: 14 },
    returnReason: { fontSize: 12, color: '#666', marginTop: 4 },
    // New Timeline Styles
    timelineDot: { width: 12, height: 12, borderRadius: 6, zIndex: 2 },
    dotCompleted: { backgroundColor: '#34C759' },
    dotPending: { backgroundColor: '#E0E0E0' },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginLeft: 5 }, // Centered under dot
});

const modalStyles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { margin: 20, backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '85%' },
    modalTitle: { marginBottom: 10, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
    modalText: { marginBottom: 20, textAlign: 'center', color: '#666' },
    input: { height: 100, width: '100%', backgroundColor: '#F5F5F5', marginBottom: 20, padding: 15, borderRadius: 12, textAlignVertical: 'top' },
    buttonRow: { flexDirection: 'row', gap: 12, width: '100%' },
    button: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
    buttonClose: { backgroundColor: '#F0F0F0' },
    buttonSubmit: { backgroundColor: '#FF6600' },
    textStyle: { color: '#333', fontWeight: 'bold' },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
    uploadText: { fontSize: 12, color: '#666' },
    removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#fff', borderRadius: 10 }
});

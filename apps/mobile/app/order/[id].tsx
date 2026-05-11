import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput, Linking, Modal } from 'react-native';
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
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const { data } = await api.get(`/orders/${id}`);
            setOrder(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        try {
            await api.put(`/orders/${id}/status`, { orderStatus: status });
            Alert.alert('Success', `Order marked as ${status}`);
            fetchOrderDetails();
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleReturnAction = async (action: 'approved' | 'rejected') => {
        if (action === 'rejected' && !rejectionReason.trim()) {
            Alert.alert('Error', 'Please provide a reason for rejection');
            return;
        }

        try {
            await api.put(`/orders/${id}/return-status`, {
                status: action,
                rejectionReason: action === 'rejected' ? rejectionReason : undefined
            });
            Alert.alert('Success', `Return ${action}`);
            setRejectionReason('');
            fetchOrderDetails();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update return status');
        }
    };

    const handleCreateShipment = async () => {
        try {
            setLoading(true);
            await api.post(`/shiprocket/create-order/${id}`, {
                length: 10, breadth: 10, height: 10, weight: 0.5
            });
            Alert.alert('Success', 'Shipment Created!');
            fetchOrderDetails();
        } catch (error: any) {
            setLoading(false);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create shipment');
        }
    };

    const handleGenerateAWB = async () => {
        try {
            setLoading(true);
            await api.post(`/shiprocket/generate-awb`, {
                shipmentId: order.shiprocket.shipmentId,
                mongoOrderId: order._id
            });
            Alert.alert('Success', 'AWB Generated! Courier Assigned.');
            fetchOrderDetails();
        } catch (error: any) {
            setLoading(false);
            Alert.alert('Error', error.response?.data?.message || 'Failed to generate AWB');
        }
    };

    const handleDownloadLabel = async () => {
        try {
            const { data } = await api.post(`/shiprocket/label`, {
                shipmentId: order.shiprocket.shipmentId
            });
            if (data.label_url) {
                Linking.openURL(data.label_url);
            } else {
                Alert.alert('Error', 'Label URL not found');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to download label');
        }
    };



    const handleCreateReturnShipment = async () => {
        try {
            setLoading(true);
            await api.post(`/shiprocket/create-return/${id}`, {});
            Alert.alert('Success', 'Return Pickup Scheduled! AWB Generated.');
            fetchOrderDetails();
        } catch (error: any) {
            setLoading(false);
            Alert.alert('Error', error.response?.data?.message || 'Failed to schedule pickup');
        }
    };

    const handleUpdatePickupStatus = async (status: string) => {
        try {
            setLoading(true);
            await api.put(`/orders/${id}/return-status`, { pickupStatus: status });
            Alert.alert('Success', `Return Status updated to ${status.replace(/_/g, ' ')}`);
            fetchOrderDetails();
        } catch (error: any) {
            setLoading(false);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update pickup status');
        }
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copied!', 'AWB code copied to clipboard');
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
        { key: 'confirmed', label: 'Accepted', icon: 'clipboard-check-outline' },
        { key: 'shipped', label: 'Shipped', icon: 'truck-fast-outline' },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'moped-outline' },
        { key: 'delivered', label: 'Delivered', icon: 'home-circle-outline' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === order.orderStatus);

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
                    <Text style={styles.date}>Ordered on {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}</Text>

                    {/* DEBUG INFO REMOVED */}

                    <View style={styles.divider} />
                </View>

                {/* Shiprocket Premium Tracking Card */}
                {order.shiprocket?.shipmentId && (
                    <LinearGradient
                        colors={['#6a11cb', '#2575fc']} // Different gradient for Seller
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
                                <Text style={styles.awbCode}>{order.shiprocket.awbCode || 'Pending Update'}</Text>
                            </View>
                            {order.shiprocket.awbCode && (
                                <TouchableOpacity style={styles.copyButton} onPress={() => copyToClipboard(order.shiprocket.awbCode)}>
                                    <Feather name="copy" size={18} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {order.shiprocket.trackingUrl && (
                            <TouchableOpacity
                                style={styles.trackButton}
                                onPress={() => Linking.openURL(order.shiprocket.trackingUrl)}
                            >
                                <Text style={styles.trackButtonText}>Track Shipment Live</Text>
                                <MaterialCommunityIcons name="arrow-right-circle" size={18} color="#007AFF" />
                            </TouchableOpacity>
                        )}

                        {order.shiprocket.awbCode ? (
                            <TouchableOpacity
                                style={[styles.trackButton, { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.2)' }]}
                                onPress={handleDownloadLabel}
                            >
                                <Text style={[styles.trackButtonText, { color: '#FFF' }]}>Download Shipping Label</Text>
                                <MaterialCommunityIcons name="file-pdf-box" size={18} color="#FFF" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.trackButton, { marginTop: 10, backgroundColor: '#FFF' }]}
                                onPress={handleGenerateAWB}
                            >
                                <Text style={[styles.trackButtonText, { color: '#007AFF' }]}>Generate AWB Now</Text>
                                <MaterialCommunityIcons name="barcode-scan" size={18} color="#007AFF" />
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
                                        {isCurrent && <Text style={styles.currentStatusLabel}>Current Status</Text>}
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
                                source={{ uri: getImageUrl(item.image) || getImageUrl(item.product?.images?.[0]) || 'https://via.placeholder.com/150' }}
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

                {/* Payment & Bill */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Summary</Text>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Item Total</Text>
                        <Text style={styles.billValue}>₹{order.pricing.subtotal}</Text>
                    </View>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Delivery Fee</Text>
                        <Text style={styles.billValue}>₹{order.pricing.deliveryCharge}</Text>
                    </View>
                    <View style={[styles.row, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total Earnings</Text>
                        <Text style={styles.totalValue}>₹{order.pricing.total}</Text>
                    </View>
                    <View style={[styles.paymentMethodBadge, { alignSelf: 'flex-start', marginTop: 10 }]}>
                        <Text style={styles.paymentMethodText}>{order.paymentMethod.type === 'cod' ? 'CASH ON DELIVERY' : 'PREPAID'}</Text>
                    </View>
                </View>

                {/* Customer Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Customer Details</Text>
                    <View style={styles.addressContainer}>
                        <Ionicons name="person-circle-outline" size={28} color="#666" style={{ marginRight: 10 }} />
                        <View>
                            <Text style={styles.addressName}>{order.deliveryAddress.name}</Text>
                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.deliveryAddress.phone}`)}>
                                <Text style={[styles.addressText, { color: '#007AFF', fontWeight: 'bold', marginTop: 2 }]}>
                                    <Ionicons name="call" size={14} /> {order.deliveryAddress.phone}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={[styles.addressContainer, { marginTop: 15 }]}>
                        <Ionicons name="location-outline" size={24} color="#666" style={{ marginRight: 10 }} />
                        <View>
                            <Text style={styles.addressText}>{order.deliveryAddress.addressLine1}</Text>
                            {order.deliveryAddress.addressLine2 && <Text style={styles.addressText}>{order.deliveryAddress.addressLine2}</Text>}
                            <Text style={styles.addressText}>
                                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Return Management */}
                {order.returnRequest?.isRequested && (
                    <View style={[styles.section, { borderColor: '#FF9500', borderWidth: 1 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#FF9500" />
                            <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8, color: '#FF9500' }]}>Return Check Required</Text>
                        </View>

                        <View style={styles.returnCard}>
                            <Text style={styles.returnLabel}>Reason:</Text>
                            <Text style={styles.returnReason}>{order.returnRequest.reason}</Text>
                            <Text style={styles.returnDate}>
                                Requested: {format(new Date(order.returnRequest.requestedAt), 'dd MMM, hh:mm a')}
                            </Text>

                            {/* Return Evidence */}
                            {(order.returnRequest.images?.length > 0 || order.returnRequest.video) && (
                                <View style={{ marginBottom: 15 }}>
                                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 8 }}>Buyer Evidence:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {order.returnRequest.images?.map((img: string, i: number) => (
                                            <TouchableOpacity key={i} onPress={() => Linking.openURL(img)}>
                                                <Image source={{ uri: img }} style={{ width: 80, height: 80, borderRadius: 8, marginRight: 10, backgroundColor: '#eee' }} />
                                            </TouchableOpacity>
                                        ))}
                                        {order.returnRequest.video && (
                                            <TouchableOpacity
                                                style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}
                                                onPress={() => Linking.openURL(order.returnRequest.video)}
                                            >
                                                <Ionicons name="play-circle" size={40} color="#fff" />
                                            </TouchableOpacity>
                                        )}
                                    </ScrollView>
                                </View>
                            )}

                            {order.returnRequest.status === 'pending' && (
                                <View style={styles.returnActions}>
                                    <TextInput
                                        style={styles.rejectionInput}
                                        placeholder="Rejection Reason (If rejecting)..."
                                        placeholderTextColor="#999"
                                        value={rejectionReason}
                                        onChangeText={setRejectionReason}
                                        multiline
                                        numberOfLines={2}
                                    />
                                    <View style={styles.returnButtons}>
                                        <TouchableOpacity
                                            style={[styles.returnButton, styles.approveButton]}
                                            onPress={() => handleReturnAction('approved')}
                                        >
                                            <Text style={styles.returnButtonText}>Approve</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.returnButton, styles.rejectButton]}
                                            onPress={() => handleReturnAction('rejected')}
                                        >
                                            <Text style={styles.returnButtonText}>Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {order.returnRequest.status !== 'pending' && (
                                <View style={[styles.statusBadge, {
                                    backgroundColor: order.returnRequest.status === 'approved' ? '#34C75920' : '#FF3B3020',
                                    marginTop: 12, alignSelf: 'flex-start', marginBottom: 10
                                }]}>
                                    <Text style={[styles.statusText, {
                                        color: order.returnRequest.status === 'approved' ? '#34C759' : '#FF3B30'
                                    }]}>
                                        RETURN {order.returnRequest.status.toUpperCase()}
                                    </Text>
                                </View>
                            )}

                            {/* Return Logistics Actions (Only if Approved) */}
                            {order.returnRequest.status === 'approved' && (
                                <View style={styles.logisticsContainer}>
                                    <View style={styles.divider} />
                                    <Text style={styles.sectionTitleSmall}>Return Logistics</Text>

                                    {/* 1. Schedule Pickup (Create Return) */}
                                    {!order.returnRequest.shiprocketReturn?.orderId ? (
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: '#FF9500', marginBottom: 10 }]}
                                            onPress={handleCreateReturnShipment}
                                        >
                                            <Text style={styles.actionButtonText}>Schedule Pickup (Shiprocket)</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.returnTrackingBox}>
                                            <Text style={styles.smallLabel}>Return AWB:</Text>
                                            <Text style={styles.awbValue}>{order.returnRequest.shiprocketReturn.awbCode || 'Generating...'}</Text>
                                            <Text style={styles.smallLabel}>Logistics Status:</Text>
                                            <Text style={styles.statusValue}>{order.returnRequest.pickupStatus?.replace(/_/g, ' ').toUpperCase() || 'SCHEDULED'}</Text>
                                        </View>
                                    )}

                                    {/* 2. Update Pickup Status (Manual overrides/progress) */}
                                    {order.returnRequest.shiprocketReturn?.orderId && order.returnRequest.pickupStatus !== 'received_by_seller' && (
                                        <View style={{ gap: 10, marginTop: 10 }}>
                                            {order.returnRequest.pickupStatus === 'scheduled' && (
                                                <TouchableOpacity
                                                    style={[styles.smallBtn, { borderColor: '#007AFF' }]}
                                                    onPress={() => handleUpdatePickupStatus('out_for_pickup')}
                                                >
                                                    <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Mark Out For Pickup</Text>
                                                </TouchableOpacity>
                                            )}
                                            {(order.returnRequest.pickupStatus === 'out_for_pickup' || order.returnRequest.pickupStatus === 'scheduled') && (
                                                <TouchableOpacity
                                                    style={[styles.smallBtn, { borderColor: '#5856D6' }]}
                                                    onPress={() => handleUpdatePickupStatus('picked_up')}
                                                >
                                                    <Text style={{ color: '#5856D6', fontWeight: 'bold' }}>Mark Picked Up</Text>
                                                </TouchableOpacity>
                                            )}

                                            <TouchableOpacity
                                                style={[styles.actionButton, { backgroundColor: '#34C759', marginTop: 5 }]}
                                                onPress={() => handleUpdatePickupStatus('received_by_seller')}
                                            >
                                                <Text style={styles.actionButtonText}>Mark Received (Restores Stock)</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.hintText}>* Mark Received only when item is back in warehouse.</Text>
                                        </View>
                                    )}

                                    {order.returnRequest.pickupStatus === 'received_by_seller' && (
                                        <View style={[styles.successBox, { marginTop: 10 }]}>
                                            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                                            <Text style={styles.successText}>Return Completed & Stock Restored</Text>
                                        </View>
                                    )}

                                </View>
                            )}

                        </View>
                    </View>
                )}

                {/* Seller Actions Footer */}
                <View style={styles.footer}>
                    {order.orderStatus === 'pending' ? (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
                            onPress={() => handleUpdateStatus('confirmed')}
                        >
                            <Text style={styles.actionButtonText}>Accept Order</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {/* Confirmed but no Shipment -> Create Shipment */}
                            {order.orderStatus === 'confirmed' && !order.shiprocket?.shipmentId && (
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: '#FF9500' }]}
                                    onPress={handleCreateShipment}
                                >
                                    <Text style={styles.actionButtonText}>Ship with Shiprocket</Text>
                                </TouchableOpacity>
                            )}

                            {/* Shipment Created but no AWB -> Generate AWB */}
                            {order.shiprocket?.shipmentId && !order.shiprocket?.awbCode && (
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: '#5856D6' }]}
                                    onPress={handleGenerateAWB}
                                >
                                    <Text style={styles.actionButtonText}>Generate AWB & Label</Text>
                                </TouchableOpacity>
                            )}

                            {/* AWB Generated OR Shipment Exists -> Show Info */}
                            {order.shiprocket?.shipmentId && (
                                <View style={{ padding: 10, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8 }}>
                                    <Text style={{ color: '#34C759', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>
                                        <Ionicons name="checkmark-circle" size={16} /> Shipment Active
                                    </Text>
                                    <Text style={{ color: '#666', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                                        Check Tracking Card above for details.
                                    </Text>
                                    <TouchableOpacity onPress={handleDownloadLabel} style={{ marginTop: 8, padding: 8, borderWidth: 1, borderColor: '#007AFF', borderRadius: 4 }}>
                                        <Text style={{ color: '#007AFF', fontSize: 12, fontWeight: 'bold' }}>
                                            <MaterialCommunityIcons name="file-pdf-box" size={16} /> Download Label
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
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
    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
    date: { fontSize: 12, color: '#999', marginTop: 4 },
    scrollContent: { flex: 1, padding: 16 },

    // Summary
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

    // Timeline
    section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    timelineContainer: { paddingLeft: 10 },
    timelineItem: { flexDirection: 'row', minHeight: 70 },
    timelineLeft: { alignItems: 'center', marginRight: 15, width: 30 },
    timelineIconContainer: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    iconCompleted: { backgroundColor: '#34C759' },
    iconCurrent: { backgroundColor: '#007AFF', borderWidth: 3, borderColor: '#D1E8FF' },
    iconPending: { backgroundColor: '#E0E0E0' },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginTop: -5, marginBottom: -5 },
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
    extraRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, marginTop: 4 },
    totalRow: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 8, paddingTop: 8 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 16, fontWeight: 'bold', color: '#2ecc71' }, // Green for earnings
    paymentMethodBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    paymentMethodText: { fontSize: 11, fontWeight: 'bold', color: '#666' },

    // Customer
    addressContainer: { flexDirection: 'row' },
    addressName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    addressText: { fontSize: 13, color: '#666', lineHeight: 18 },

    // Return
    returnCard: { backgroundColor: '#fff', padding: 0 },
    returnLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
    returnReason: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 8 },
    returnDate: { fontSize: 12, color: '#999', marginBottom: 12 },
    returnActions: { marginTop: 12 },
    rejectionInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#fff', marginBottom: 12, minHeight: 60, textAlignVertical: 'top' },
    returnButtons: { flexDirection: 'row', gap: 12 },
    returnButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    approveButton: { backgroundColor: '#34C759' },
    rejectButton: { backgroundColor: '#FF3B30' },
    returnButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    footer: { marginBottom: 20 },
    actionButton: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { fontSize: 14, color: '#666' },
    value: { fontSize: 14, color: '#333', fontWeight: '500' },


    // New Styles for Return Logistics
    logisticsContainer: { marginTop: 5 },
    sectionTitleSmall: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    returnTrackingBox: { backgroundColor: '#F0F8FF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#B3E5FC' },
    smallLabel: { fontSize: 12, color: '#666' },
    awbValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    statusValue: { fontSize: 14, fontWeight: 'bold', color: '#007AFF' },
    smallBtn: { padding: 10, borderWidth: 1, borderRadius: 8, alignItems: 'center', backgroundColor: '#fff' },
    hintText: { fontSize: 11, color: '#999', marginTop: 4, fontStyle: 'italic', textAlign: 'center' },
    successBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: '#E8F5E9', borderRadius: 8 },
    successText: { color: '#34C759', fontWeight: 'bold', fontSize: 14 }
});

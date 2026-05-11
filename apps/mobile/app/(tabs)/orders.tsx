import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import api, { getImageUrl } from '../../src/utils/api';
import { format } from 'date-fns';
import { useAuthStore } from '../../src/store/authStore';

export default function OrdersScreen() {
    const router = useRouter();
    const [filter, setFilter] = useState('all');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { logout } = useAuthStore();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders/seller');
            setOrders(data);
            setError(null);
        } catch (err: any) {
            console.error('Fetch Orders Error:', err);
            if (err.response?.status === 401) {
                setError('session_expired');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await api.put(`/orders/${id}/status`, { orderStatus: status });
            Alert.alert('Success', `Order marked as ${status}`);
            fetchOrders(); // Refresh
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleReturnAction = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await api.put(`/orders/${id}/return-status`, { status });
            Alert.alert('Success', `Return request ${status}`);
            fetchOrders();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update return status');
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#FF9500'; // Orange
            case 'confirmed': return '#007AFF'; // Blue
            case 'shipped': return '#5856D6'; // Purple
            case 'out_for_delivery': return '#FF2D55'; // Pink/Red
            case 'delivered': return '#34C759'; // Green
            case 'cancelled': return '#FF3B30'; // Red
            default: return '#8E8E93';
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.orderId}>Order #{item.orderNumber || item._id.slice(-6).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus || 'pending') + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus || 'pending') }]}>
                        {(item.orderStatus || 'PENDING').toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.productRow}>
                <Image
                    source={{ uri: getImageUrl(item.items?.[0]?.image) || getImageUrl(item.items?.[0]?.product?.images?.[0]) || 'https://via.placeholder.com/150' }}
                    style={styles.image}
                />
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>
                        {item.items?.[0]?.title || item.items?.[0]?.product?.title || 'Unknown Product'}
                        {item.items?.length > 1 && <Text style={{ fontSize: 12, color: '#999' }}> (+{item.items.length - 1} more)</Text>}
                    </Text>
                    <Text style={styles.customerName}>Buyer: {item.buyer?.name || 'Unknown'}</Text>
                    <Text style={styles.date}>{format(new Date(item.createdAt), 'dd MMM yyyy')}</Text>
                </View>
                <Text style={styles.price}>₹{item.pricing?.total?.toLocaleString() || 0}</Text>
            </View>

            {item.returnRequest?.isRequested && item.returnRequest.status === 'pending' && (
                <View style={{ flex: 1 }}>
                    <View style={{ backgroundColor: '#FFF5EC', padding: 8, borderRadius: 4, marginBottom: 8 }}>
                        <Text style={{ fontSize: 12, color: '#FF6600', fontWeight: 'bold' }}>Return Requested</Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>"{item.returnRequest.reason}"</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            style={[styles.shipBtn, { backgroundColor: '#FF3B30' }]}
                            onPress={() => handleReturnAction(item._id, 'rejected')}
                        >
                            <Text style={styles.shipBtnText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.shipBtn, { backgroundColor: '#34C759' }]}
                            onPress={() => handleReturnAction(item._id, 'approved')}
                        >
                            <Text style={styles.shipBtnText}>Approve Return</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {!item.returnRequest?.isRequested && (
                <View style={{ marginTop: 10 }}>
                    {/* Status is now managed automatically by Courier */}
                    {item.orderStatus === 'pending' && (
                        <Text style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                            Creating shipment...
                        </Text>
                    )}
                </View>
            )}

            <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => router.push(`/order/${item._id}` as any)}
            >
                <Text style={styles.detailsBtnText}>Details</Text>
            </TouchableOpacity>
        </View>
    );

    if (error === 'session_expired') {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={64} color="#FF6600" />
                <Text style={styles.errorTitle}>Invalid ID or Password</Text>
                <Text style={styles.errorText}>Please log in again to continue managing your business.</Text>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => {
                        logout();
                        router.replace('/auth/login');
                    }}
                >
                    <Text style={styles.loginButtonText}>Log In Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Orders</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabs}>
                {['all', 'pending', 'shipped', 'delivered', 'returns'].map((tab) => (
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
                    data={orders.filter(o => {
                        if (filter === 'returns') return o.returnRequest?.isRequested;
                        return filter === 'all' || o.orderStatus === filter;
                    })}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No orders found.</Text>
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
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10,
        marginTop: 10,
    },
    tab: {
        marginRight: 10,
        paddingVertical: 6,
        paddingHorizontal: 12,
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
    list: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    orderId: {
        fontWeight: '600',
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
    },
    productName: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 15,
    },
    customerName: {
        color: '#666',
        fontSize: 13,
    },
    date: {
        color: '#999',
        fontSize: 12,
        marginTop: 2,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    shipBtn: {
        flex: 1,
        backgroundColor: '#333',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    shipBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    detailsBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    detailsBtnText: {
        color: '#333',
        fontWeight: '600',
        fontSize: 13,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#999',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff'
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22
    },
    loginButton: {
        backgroundColor: '#FF6600',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        elevation: 2
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/src/utils/api';
import { useAuthStore } from '@/src/store/authStore';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const router = useRouter();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { logout } = useAuthStore();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/analytics/seller');
            setAnalytics(data);
            setError(null);
        } catch (err: any) {
            console.error('Fetch Analytics Error:', err);
            if (err.response?.status === 401) {
                setError('session_expired');
            } else {
                setError('failed');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6600" />
            </View>
        );
    }

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

    const overview = analytics?.overview || {};
    const ordersByStatus = analytics?.ordersByStatus || {};
    const topProducts = analytics?.topProducts || [];
    const recentOrders = analytics?.recentOrders || [];

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Dashboard</Text>
                    <Text style={styles.headerSubtitle}>Your business overview</Text>
                </View>
                <TouchableOpacity onPress={fetchAnalytics}>
                    <Ionicons name="refresh" size={24} color="#FF6600" />
                </TouchableOpacity>
            </View>

            {/* Overview Cards */}
            <View style={styles.cardsRow}>
                <View style={[styles.card, { backgroundColor: '#4CAF50' }]}>
                    <Ionicons name="cash-outline" size={32} color="#fff" />
                    <Text style={styles.cardValue}>₹{overview.totalRevenue?.toFixed(0) || 0}</Text>
                    <Text style={styles.cardLabel}>Total Revenue</Text>
                </View>
                <View style={[styles.card, { backgroundColor: '#2196F3' }]}>
                    <Ionicons name="cube-outline" size={32} color="#fff" />
                    <Text style={styles.cardValue}>{overview.totalProducts || 0}</Text>
                    <Text style={styles.cardLabel}>Products</Text>
                </View>
            </View>

            <View style={styles.cardsRow}>
                <View style={[styles.card, { backgroundColor: '#FF9800' }]}>
                    <Ionicons name="cart-outline" size={32} color="#fff" />
                    <Text style={styles.cardValue}>{overview.totalOrders || 0}</Text>
                    <Text style={styles.cardLabel}>Total Orders</Text>
                </View>
                <View style={[styles.card, { backgroundColor: '#9C27B0' }]}>
                    <Ionicons name="checkmark-circle-outline" size={32} color="#fff" />
                    <Text style={styles.cardValue}>{overview.activeListings || 0}</Text>
                    <Text style={styles.cardLabel}>Active Listings</Text>
                </View>
            </View>

            {/* Order Status Breakdown */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Status</Text>
                <View style={styles.statusContainer}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: '#FFC107' }]} />
                        <Text style={styles.statusLabel}>Pending</Text>
                        <Text style={styles.statusValue}>{ordersByStatus.pending || 0}</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: '#2196F3' }]} />
                        <Text style={styles.statusLabel}>Processing</Text>
                        <Text style={styles.statusValue}>{ordersByStatus.processing || 0}</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: '#9C27B0' }]} />
                        <Text style={styles.statusLabel}>Shipped</Text>
                        <Text style={styles.statusValue}>{ordersByStatus.shipped || 0}</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                        <Text style={styles.statusLabel}>Delivered</Text>
                        <Text style={styles.statusValue}>{ordersByStatus.delivered || 0}</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: '#F44336' }]} />
                        <Text style={styles.statusLabel}>Cancelled</Text>
                        <Text style={styles.statusValue}>{ordersByStatus.cancelled || 0}</Text>
                    </View>
                </View>
            </View>

            {/* Top Products */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Top Selling Products</Text>
                    <Text style={styles.seeAll}>See All</Text>
                </View>
                {topProducts.length > 0 ? (
                    topProducts.map((product: any, index: number) => (
                        <View key={index} style={styles.productRow}>
                            <View style={styles.productRank}>
                                <Text style={styles.rankText}>#{index + 1}</Text>
                            </View>
                            <View style={styles.productInfo}>
                                <Text style={styles.productTitle} numberOfLines={1}>
                                    {product.title}
                                </Text>
                                <Text style={styles.productStats}>
                                    Sold: {product.totalSold} • Revenue: ₹{product.revenue.toFixed(0)}
                                </Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No sales data yet</Text>
                )}
            </View>

            {/* Recent Orders */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Orders</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/orders' as any)}>
                        <Text style={styles.seeAll}>View All</Text>
                    </TouchableOpacity>
                </View>
                {recentOrders.length > 0 ? (
                    recentOrders.map((order: any) => (
                        <TouchableOpacity
                            key={order._id}
                            style={styles.orderCard}
                            onPress={() => router.push('/(tabs)/orders' as any)}
                        >
                            <View style={styles.orderHeader}>
                                <Text style={styles.orderId}>#{order._id.slice(-6)}</Text>
                                <View style={[
                                    styles.orderStatusBadge,
                                    { backgroundColor: getStatusColor(order.status) }
                                ]}>
                                    <Text style={styles.orderStatusText}>{order.status}</Text>
                                </View>
                            </View>
                            <View style={styles.orderFooter}>
                                <Text style={styles.orderAmount}>₹{order.totalPrice}</Text>
                                <Text style={styles.orderDate}>
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No orders yet</Text>
                )}
            </View>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending': return '#FFC107';
        case 'processing': return '#2196F3';
        case 'shipped': return '#9C27B0';
        case 'delivered': return '#4CAF50';
        case 'cancelled': return '#F44336';
        default: return '#999';
    }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 50,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    headerSubtitle: { fontSize: 14, color: '#999', marginTop: 4 },

    cardsRow: {
        flexDirection: 'row',
        padding: 8,
        paddingTop: 16
    },
    card: {
        flex: 1,
        margin: 8,
        padding: 16,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8
    },
    cardLabel: {
        fontSize: 12,
        color: '#fff',
        opacity: 0.9,
        marginTop: 4
    },

    section: {
        backgroundColor: '#fff',
        margin: 8,
        padding: 16,
        borderRadius: 12,
        marginTop: 8
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    seeAll: { fontSize: 14, color: '#FF6600', fontWeight: '600' },

    statusContainer: { marginTop: 8 },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12
    },
    statusLabel: { flex: 1, fontSize: 14, color: '#666' },
    statusValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    productRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FF6600',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    rankText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    productInfo: { flex: 1 },
    productTitle: { fontSize: 14, color: '#333', marginBottom: 4 },
    productStats: { fontSize: 12, color: '#999' },

    orderCard: {
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee'
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    orderId: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    orderStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    orderStatusText: { fontSize: 11, color: '#fff', fontWeight: '600' },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    orderAmount: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
    orderDate: { fontSize: 12, color: '#999' },

    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        paddingVertical: 20
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

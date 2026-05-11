import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { getImageUrl } from '@/src/utils/api';
import { format } from 'date-fns';
import { useAuthStore } from '../../src/store/authStore';

export default function OrdersScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [authError, setAuthError] = useState(false); // Track 401 errors explicitly

    const { token, logout } = useAuthStore();

    const fetchOrders = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            const { data } = await api.get('/orders/myorders');
            console.log('📦 Orders Response:', JSON.stringify(data, null, 2));
            if (data && data.length > 0) {
                console.log('First Order Items:', data[0].items);
                console.log('First Order Status:', data[0].orderStatus);
            }
            setOrders(data);
        } catch (error: any) {
            // Handle 401 errors manually
            if (error.response?.status === 401) {
                console.log('⚠️ Orders Screen: 401 Detected - Show Manual Login UI');
                setAuthError(true);
            } else {
                console.error('Fetch Orders Error:', error);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusText = (order: any) => {
        const date = new Date(order.createdAt);
        const dateStr = format(date, 'EEE, dd MMM');

        switch (order.orderStatus) {
            case 'delivered': return `Delivered on ${format(new Date(order.actualDelivery || date), 'dd MMM')}`;
            case 'out_for_delivery': return `Out for Delivery today`;
            case 'shipped': return `Shipped on ${format(new Date(order.updatedAt || date), 'dd MMM')}`;
            case 'confirmed': return `Accepted on ${format(new Date(order.updatedAt || date), 'dd MMM')}`;
            case 'cancelled': return `Cancelled on ${dateStr}`;
            default: return `Ordered on ${dateStr}`;
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.orderItem}
            onPress={() => router.push(`/order/${item._id}` as any)}
        >
            <Image
                source={{ uri: getImageUrl(item.items?.[0]?.image) || undefined }}
                style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
                <Text style={styles.statusTitle}>
                    {item.orderStatus === 'out_for_delivery' ? 'Out for Delivery' :
                        item.orderStatus === 'confirmed' ? 'Accepted' :
                            item.orderStatus.charAt(0).toUpperCase() + item.orderStatus.slice(1)}
                </Text>
                <Text style={styles.dateText}>{getStatusText(item)}</Text>
                {item.items?.[0] && (
                    <Text style={styles.metaText}>
                        {item.items[0].title.slice(0, 20)}... • Qty: {item.items[0].quantity}
                    </Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Orders</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput
                        placeholder="Search orders"
                        style={styles.input}
                        placeholderTextColor="#999"
                    />
                </View>
                <TouchableOpacity style={styles.filterBtn}>
                    <Ionicons name="filter" size={18} color="#9C27B0" />
                    <Text style={styles.filterText}>Filters</Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 50 }} />
            ) : authError ? (
                // Manual Re-Login UI for Invalid ID/Password
                <View style={styles.errorContainer}>
                    <Ionicons name="warning-outline" size={60} color="#FF3B30" />
                    <Text style={styles.errorTitle}>Invalid ID or Password</Text>
                    <Text style={styles.errorSubText}>Your session has expired or your credentials are invalid. Please log in again.</Text>
                    <TouchableOpacity
                        style={styles.reLoginBtn}
                        onPress={() => {
                            logout(); // Clear token manually
                            router.replace('/auth/login' as any);
                        }}
                    >
                        <Text style={styles.reLoginBtnText}>Log In Again</Text>
                    </TouchableOpacity>
                </View>
            ) : !token ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="lock-closed-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>Please login to view your orders</Text>
                    <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/auth/login' as any)}>
                        <Text style={styles.loginBtnText}>Login Now</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No orders found</Text>
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
        backgroundColor: '#fff',
    },
    // ... existing styles ...
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        backgroundColor: '#fff',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    errorSubText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    reLoginBtn: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 3,
    },
    reLoginBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10,
        alignItems: 'center',
        gap: 15,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        paddingHorizontal: 10,
        height: 40,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    filterText: {
        color: '#9C27B0',
        fontWeight: 'bold',
        fontSize: 14,
    },
    list: {

    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 4,
        backgroundColor: '#f5f5f5',
    },
    itemDetails: {
        flex: 1,
        marginLeft: 15,
    },
    statusTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    metaText: {
        fontSize: 12,
        color: '#999',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        marginBottom: 20
    },
    loginBtn: {
        backgroundColor: '#FF6600',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 25
    },
    loginBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    }
});

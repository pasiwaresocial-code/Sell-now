import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { getImageUrl } from '../src/utils/api';
import { format } from 'date-fns';

export default function OrderHistoryScreen() {
    const router = useRouter();
    const [filter, setFilter] = useState('All');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders/seller');
            setOrders(data);
        } catch (error) {
            console.error('Fetch History Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return '#34C759';
            case 'cancelled': return '#FF3B30';
            case 'shipped': return '#5856D6';
            case 'pending': return '#FF9500';
            default: return '#8E8E93';
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card} onPress={() => router.push(`/order/${item._id}` as any)}>
            <View style={styles.cardHeader}>
                <Text style={styles.orderId}>ORDER #{item._id.slice(-8).toUpperCase()}</Text>
                <Text style={[styles.status, { color: getStatusColor(item.orderStatus) }]}>{item.orderStatus.toUpperCase()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardBody}>
                <Image
                    source={{ uri: getImageUrl(item.items?.[0]?.image) || getImageUrl(item.items?.[0]?.product?.images?.[0]) || 'https://via.placeholder.com/150' }}
                    style={styles.thumb}
                />
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.items?.[0]?.title || item.items?.[0]?.product?.title || 'Unknown Product'}
                        {item.items?.length > 1 && <Text style={{ fontSize: 12, color: '#999' }}> (+{item.items.length - 1} more)</Text>}
                    </Text>
                    <Text style={styles.date}>Placed on {format(new Date(item.createdAt), 'dd MMM yyyy')}</Text>
                    <Text style={styles.price}>₹{item.pricing?.total?.toLocaleString()}</Text>
                </View>
                <View style={styles.arrowBtn}>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order History</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {['All', 'Delivered', 'Cancelled'].map(t => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.tab, filter === t && styles.activeTab]}
                        onPress={() => setFilter(t)}
                    >
                        <Text style={[styles.tabText, filter === t && styles.activeTabText]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={orders.filter(h => {
                        if (filter === 'All') return true;
                        return h.orderStatus === filter.toLowerCase();
                    })}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: '#999' }}>No orders found.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },

    tabs: { flexDirection: 'row', padding: 15, paddingBottom: 5 },
    tab: { marginRight: 10, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
    activeTab: { backgroundColor: '#333', borderColor: '#333' },
    tabText: { color: '#666', fontWeight: '500' },
    activeTabText: { color: '#fff' },

    list: { padding: 15 },
    card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, padding: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    orderId: { fontSize: 12, color: '#999', fontWeight: '600' },
    status: { fontSize: 12, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 10 },
    cardBody: { flexDirection: 'row', alignItems: 'center' },
    thumb: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee' },
    info: { flex: 1, marginLeft: 12 },
    title: { fontSize: 16, fontWeight: '600', color: '#333' },
    date: { fontSize: 12, color: '#999', marginTop: 2 },
    price: { fontSize: 14, fontWeight: 'bold', color: '#FF6600', marginTop: 4 },
    arrowBtn: { padding: 5 },
});

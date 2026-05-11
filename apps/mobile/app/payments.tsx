import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/utils/api';
import { format } from 'date-fns';

export default function PaymentsScreen() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            // In a real app, we would have a specific /payouts endpoint.
            // For now, we simulate payouts based on 'delivered' orders.
            const { data } = await api.get('/orders/seller');
            const deliveredOrders = data.filter((o: any) => o.orderStatus === 'delivered');

            // Calculate total revenue
            const total = deliveredOrders.reduce((sum: number, o: any) => sum + (o.pricing?.total || 0), 0);
            setTotalBalance(total);

            // Map orders to transaction history format
            const history = deliveredOrders.map((o: any) => ({
                id: o._id,
                date: format(new Date(o.createdAt), 'dd MMM, hh:mm a'),
                amount: `₹${o.pricing?.total?.toLocaleString()}`,
                status: 'Paid', // Assuming delivered = paid for this MVP
                type: 'Order Payout'
            }));

            setTransactions(history);
        } catch (error) {
            console.error('Fetch Payments Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPayouts();
        }, [])
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payments</Text>
                <TouchableOpacity>
                    <Ionicons name="help-circle-outline" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.balanceSection}>
                <View style={styles.balanceCard}>
                    <View>
                        <Text style={styles.balanceLabel}>Total Earnings</Text>
                        <Text style={styles.balanceAmount}>₹{totalBalance.toLocaleString()}.00</Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Withdrawable</Text>
                    </View>
                </View>
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                            <Ionicons name="download-outline" size={24} color="#007AFF" />
                        </View>
                        <Text style={styles.actionText}>Statement</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/bank-details')}>
                        <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                            <Ionicons name="card-outline" size={24} color="#FF9800" />
                        </View>
                        <Text style={styles.actionText}>Bank Info</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Recent Transactions (Delivered Orders)</Text>
                {loading ? (
                    <ActivityIndicator color="#333" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={transactions}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>No completed payouts yet.</Text>}
                        renderItem={({ item }) => (
                            <View style={styles.transactionItem}>
                                <View style={styles.iconBox}>
                                    <Ionicons
                                        name="checkmark"
                                        size={20}
                                        color="#34C759"
                                    />
                                </View>
                                <View style={styles.tInfo}>
                                    <Text style={styles.tType}>{item.type}</Text>
                                    <Text style={styles.tDate}>{item.date}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.tAmount}>{item.amount}</Text>
                                    <Text style={[styles.tStatus, { color: '#34C759' }]}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>
                        )}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
    backBtn: {},
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },

    balanceSection: { padding: 20 },
    balanceCard: { backgroundColor: '#212121', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 20 },
    balanceLabel: { color: '#bbb', fontSize: 14, marginBottom: 5 },
    balanceAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    badge: { position: 'absolute', top: 25, right: 25, backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    badgeText: { color: '#4CAF50', fontSize: 12, fontWeight: '600' },

    actionRow: { flexDirection: 'row', justifyContent: 'space-around' },
    actionBtn: { alignItems: 'center' },
    iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    actionText: { fontSize: 12, color: '#666', fontWeight: '500' },

    historySection: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: -5 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    transactionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    tInfo: { flex: 1 },
    tType: { fontSize: 16, fontWeight: '600', color: '#333' },
    tDate: { fontSize: 12, color: '#999', marginTop: 4 },
    tAmount: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    tStatus: { fontSize: 12, fontWeight: '500', marginTop: 4 },
});

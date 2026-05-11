import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function PaymentRefundScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'payments' | 'refunds'>('payments');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Dummy Data
    // Data fetched from API (Empty for now)
    const payments: any[] = [];

    const refunds: any[] = [];

    const renderPaymentItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={[styles.status, { color: item.status === 'Success' ? '#4CAF50' : '#E53935' }]}>{item.status}</Text>
            </View>
            <View style={styles.cardBody}>
                <View>
                    <Text style={styles.amount}>{item.amount}</Text>
                    <Text style={styles.orderId}>Order ID: {item.orderId}</Text>
                </View>
                <TouchableOpacity style={styles.detailsBtn} onPress={() => setSelectedItem(item)}>
                    <Text style={styles.detailsBtnText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={16} color="#5C6BC0" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderRefundItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={[styles.status, { color: item.status === 'Processed' ? '#4CAF50' : '#FF9800' }]}>{item.status}</Text>
            </View>
            <View style={styles.cardBody}>
                <View>
                    <Text style={styles.amount}>{item.amount}</Text>
                    <Text style={styles.refundReason}>Reason: {item.reason}</Text>
                    <Text style={styles.orderId}>Order ID: {item.orderId}</Text>
                </View>
                <TouchableOpacity style={styles.detailsBtn} onPress={() => setSelectedItem(item)}>
                    <Text style={styles.detailsBtnText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={16} color="#5C6BC0" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payments & Refunds</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'payments' && styles.activeTab]}
                    onPress={() => setActiveTab('payments')}
                >
                    <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>Payments</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'refunds' && styles.activeTab]}
                    onPress={() => setActiveTab('refunds')}
                >
                    <Text style={[styles.tabText, activeTab === 'refunds' && styles.activeTabText]}>Refunds</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === 'payments' ? (
                    <FlatList
                        data={payments}
                        renderItem={renderPaymentItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={<Text style={styles.emptyText}>No payments found</Text>}
                    />
                ) : (
                    <FlatList
                        data={refunds}
                        renderItem={renderRefundItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={<Text style={styles.emptyText}>No refunds found</Text>}
                    />
                )}
            </View>

            {/* Details Modal */}
            <Modal
                transparent={true}
                visible={!!selectedItem}
                animationType="slide"
                onRequestClose={() => setSelectedItem(null)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedItem(null)}>
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{activeTab === 'payments' ? 'Payment Details' : 'Refund Details'}</Text>
                            <TouchableOpacity onPress={() => setSelectedItem(null)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {selectedItem && (
                            <View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Transaction ID</Text>
                                    <Text style={styles.detailValue}>TXN-{selectedItem.id}-{selectedItem.date.replace(/ /g, '')}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Order ID</Text>
                                    <Text style={styles.detailValue}>{selectedItem.orderId}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Amount</Text>
                                    <Text style={styles.detailValue}>{selectedItem.amount}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Date</Text>
                                    <Text style={styles.detailValue}>{selectedItem.date}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Status</Text>
                                    <Text style={[styles.detailValue, { color: selectedItem.status === 'Success' || selectedItem.status === 'Processed' ? '#4CAF50' : '#E53935' }]}>{selectedItem.status}</Text>
                                </View>

                                {activeTab === 'payments' && (
                                    <>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Payment Method</Text>
                                            <Text style={styles.detailValue}>{selectedItem.method}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Reference No</Text>
                                            <Text style={styles.detailValue}>{selectedItem.ref}</Text>
                                        </View>
                                    </>
                                )}

                                {activeTab === 'refunds' && (
                                    <>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Reason</Text>
                                            <Text style={styles.detailValue}>{selectedItem.reason}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Timeline</Text>
                                            <Text style={styles.detailValue}>{selectedItem.timeline}</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        )}

                        <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 15 },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#FF6600' },
    tabText: { fontSize: 16, color: '#666', fontWeight: '500' },
    activeTabText: { color: '#FF6600', fontWeight: 'bold' },

    content: { flex: 1 },
    listContent: { padding: 15 },

    card: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    date: { fontSize: 12, color: '#999' },
    status: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },

    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amount: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    orderId: { fontSize: 12, color: '#666' },
    refundReason: { fontSize: 12, color: '#666', marginBottom: 2 },

    detailsBtn: { flexDirection: 'row', alignItems: 'center', padding: 5 },
    detailsBtnText: { color: '#5C6BC0', fontSize: 12, fontWeight: '600', marginRight: 2 },

    emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    detailLabel: { color: '#666', fontSize: 14 },
    detailValue: { color: '#333', fontWeight: 'bold', fontSize: 14 },
    closeBtn: { marginTop: 20, backgroundColor: '#5C6BC0', padding: 15, borderRadius: 8, alignItems: 'center' },
    closeBtnText: { color: '#fff', fontWeight: 'bold' }
});

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import api from '@/src/utils/api';
import { useCartStore } from '@/src/store/cartStore';

interface Address {
    _id: string;
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    type: string;
    isDefault: boolean;
}

export default function AddressListScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const isSelectionMode = params.select === 'true';

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Check if store has setAddress, otherwise we need to add it or use params
    // Assuming we'll add setDeliveryAddress to cartStore for simplicity
    const { setDeliveryAddress } = useCartStore() as any;

    const fetchAddresses = async () => {
        try {
            const { data } = await api.get('/users/address');
            setAddresses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAddresses();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAddresses();
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Address', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/users/address/${id}`);
                        fetchAddresses();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete address');
                    }
                }
            }
        ]);
    };

    const handleSelect = (address: Address) => {
        if (isSelectionMode) {
            setDeliveryAddress(address);
            router.back();
        }
    };

    const renderItem = ({ item }: { item: Address }) => (
        <TouchableOpacity
            style={[styles.card, isSelectionMode && styles.selectableCard]}
            onPress={() => isSelectionMode ? handleSelect(item) : null}
            activeOpacity={isSelectionMode ? 0.7 : 1}
        >
            <View style={styles.cardHeader}>
                <View style={styles.tagRow}>
                    <Text style={styles.typeTag}>{item.type}</Text>
                    {item.isDefault && <Text style={styles.defaultTag}>Default</Text>}
                </View>
                {!isSelectionMode && (
                    <View style={styles.actions}>
                        {/* Edit Button */}
                        <TouchableOpacity onPress={() => router.push({ pathname: '/address/add', params: { id: item._id, ...item } } as any)} style={styles.actionBtn}>
                            <Feather name="edit-2" size={18} color="#666" />
                        </TouchableOpacity>
                        {/* Delete Button */}
                        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
                            <Feather name="trash-2" size={18} color="#E53935" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.text}>{item.street}, {item.city} - {item.zip}</Text>
            <Text style={styles.text}>{item.state}</Text>
            <Text style={[styles.text, { marginTop: 5 }]}>Phone: <Text style={{ fontWeight: '600' }}>{item.phone}</Text></Text>

            {isSelectionMode && (
                <View style={styles.selectHint}>
                    <Text style={{ color: '#E91E63', fontSize: 12 }}>Tap to Select</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Addresses</Text>
                <TouchableOpacity onPress={() => router.push('/address/add' as any)} style={styles.addBtnHeader}>
                    <Text style={styles.addBtnText}>+ ADD</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#E91E63" />
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Feather name="map-pin" size={40} color="#ccc" />
                            <Text style={styles.emptyText}>No addresses found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 50, backgroundColor: '#fff', elevation: 2 },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
    addBtnHeader: { padding: 5 },
    addBtnText: { color: '#E91E63', fontWeight: 'bold' },

    listContent: { padding: 15 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    tagRow: { flexDirection: 'row', alignItems: 'center' },
    typeTag: { fontSize: 10, color: '#666', backgroundColor: '#eee', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
    defaultTag: { fontSize: 10, color: '#E91E63', fontWeight: 'bold' },
    actions: { flexDirection: 'row' },
    actionBtn: { padding: 5, marginLeft: 10 },

    name: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    text: { fontSize: 14, color: '#444', marginBottom: 2 },
    emptyText: { marginTop: 10, color: '#999' },
    selectableCard: { borderColor: '#E91E63', borderWidth: 1 },
    selectHint: { marginTop: 8, alignItems: 'center' }
});

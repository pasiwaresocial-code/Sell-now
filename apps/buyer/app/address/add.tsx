import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/utils/api';

export default function AddAddressScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const isEdit = !!params.id;

    const [form, setForm] = useState({
        name: (params.name as string) || '',
        phone: (params.phone as string) || '',
        zip: (params.zip as string) || '',
        state: (params.state as string) || '',
        city: (params.city as string) || '',
        street: (params.street as string) || '',
        addressLine2: (params.addressLine2 as string) || '',
        landmark: (params.landmark as string) || '',
        type: (params.type as string) || 'Home',
        isDefault: params.isDefault === 'true',
    });

    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!form.name || !form.phone || !form.street || !form.zip || !form.city || !form.state) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        // Phone Validation
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(form.phone)) {
            Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        console.log('Saving address:', form);
        try {
            if (isEdit) {
                await api.put(`/users/address/${params.id}`, form);
                Alert.alert('Success', 'Address updated');
            } else {
                await api.post('/users/address', form);
                Alert.alert('Success', 'Address added');
            }
            router.back();
        } catch (error: any) {
            console.error('Address Save Error:', error);
            const msg = error.response?.data?.message || 'Failed to save address';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? 'Edit Address' : 'Add New Address'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Contact Details</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    placeholderTextColor="#999"
                    value={form.name}
                    onChangeText={t => setForm({ ...form, name: t })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={form.phone}
                    onChangeText={t => setForm({ ...form, phone: t })}
                />

                <Text style={styles.label}>Address</Text>
                <TextInput
                    style={styles.input}
                    placeholder="House No., Building Name"
                    placeholderTextColor="#999"
                    value={form.street}
                    onChangeText={t => setForm({ ...form, street: t })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Area, Colony, Street 2 (Optional)"
                    placeholderTextColor="#999"
                    value={form.addressLine2}
                    onChangeText={t => setForm({ ...form, addressLine2: t })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Landmark (Optional)"
                    placeholderTextColor="#999"
                    value={form.landmark}
                    onChangeText={t => setForm({ ...form, landmark: t })}
                />
                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="Pincode"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        value={form.zip}
                        onChangeText={t => setForm({ ...form, zip: t })}
                    />
                    <TextInput
                        style={[styles.input, styles.half]}
                        placeholder="City"
                        placeholderTextColor="#999"
                        value={form.city}
                        onChangeText={t => setForm({ ...form, city: t })}
                    />
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="State"
                    placeholderTextColor="#999"
                    value={form.state}
                    onChangeText={t => setForm({ ...form, state: t })}
                />

                <Text style={styles.label}>Save Address As</Text>
                <View style={styles.typeContainer}>
                    {['Home', 'Work', 'Other'].map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.typeChip, form.type === type && styles.typeChipActive]}
                            onPress={() => setForm({ ...form, type })}
                        >
                            <Text style={[styles.typeText, form.type === type && styles.typeTextActive]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.switchRow}>
                    <Text>Make this my default address</Text>
                    <Switch
                        value={form.isDefault}
                        onValueChange={v => setForm({ ...form, isDefault: v })}
                        trackColor={{ true: '#E91E63', false: '#eee' }}
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>SAVE ADDRESS</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#eee' },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    label: { fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    half: { width: '48%' },
    typeContainer: { flexDirection: 'row', marginBottom: 20 },
    typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 10 },
    typeChipActive: { backgroundColor: '#FCE4EC', borderColor: '#E91E63' },
    typeText: { fontSize: 12, color: '#666' },
    typeTextActive: { color: '#E91E63', fontWeight: 'bold' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 30 },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
    saveBtn: { backgroundColor: '#E91E63', padding: 15, borderRadius: 8, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

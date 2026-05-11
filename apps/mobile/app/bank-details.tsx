import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import api from '../src/utils/api';

export default function BankDetailsScreen() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // Initial state from user profile or empty
    const [form, setForm] = useState({
        accountName: user?.bankDetails?.accountName || '',
        accountNumber: user?.bankDetails?.accountNumber || '',
        ifscCode: user?.bankDetails?.ifscCode || '',
        bankName: user?.bankDetails?.bankName || ''
    });

    const handleSave = async () => {
        if (!form.accountName || !form.accountNumber || !form.ifscCode || !form.bankName) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        try {
            setLoading(true);
            const { data } = await api.put('/users/profile', {
                bankDetails: form
            });
            setUser({ ...user, ...data }); // Update local store
            Alert.alert('Success', 'Bank details saved successfully');
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save bank details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bank Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
                    <Text style={styles.infoText}>
                        This account will be used for all your payouts. Please ensure details are correct.
                    </Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Account Holder Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Rahul Kumar"
                        value={form.accountName}
                        onChangeText={(t) => setForm({ ...form, accountName: t })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Account Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 1234567890"
                        keyboardType="number-pad"
                        value={form.accountNumber}
                        onChangeText={(t) => setForm({ ...form, accountNumber: t })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>IFSC Code</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. SBIN0001234"
                        autoCapitalize="characters"
                        value={form.ifscCode}
                        onChangeText={(t) => setForm({ ...form, ifscCode: t })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Bank Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. State Bank of India"
                        value={form.bankName}
                        onChangeText={(t) => setForm({ ...form, bankName: t })}
                    />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Details</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    content: { padding: 20 },
    infoBox: { flexDirection: 'row', backgroundColor: '#eef2ff', padding: 15, borderRadius: 12, marginBottom: 25 },
    infoText: { flex: 1, marginLeft: 10, color: '#444', fontSize: 13, lineHeight: 18 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
    input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 15, fontSize: 16 },
    saveBtn: { backgroundColor: '#333', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

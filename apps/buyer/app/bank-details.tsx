import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BankDetailsScreen() {
    const router = useRouter();
    const [bankAccounts, setBankAccounts] = useState([
        { id: '1', bankName: 'HDFC Bank', accNo: '**** 1234', ifsc: 'HDFC0001234', type: 'Savings' }
    ]);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form State
    const [form, setForm] = useState({ accNo: '', ifsc: '', holderName: '' });

    const handleAddBank = () => {
        if (!form.accNo || !form.ifsc || !form.holderName) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        setBankAccounts([...bankAccounts, {
            id: Date.now().toString(),
            bankName: 'New Bank',
            accNo: `**** ${form.accNo.slice(-4)}`,
            ifsc: form.ifsc,
            type: 'Savings'
        }]);
        setShowAddForm(false);
        setForm({ accNo: '', ifsc: '', holderName: '' });
        Alert.alert('Success', 'Bank Account Added');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bank & UPI Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {!showAddForm ? (
                    <>
                        <Text style={styles.sectionTitle}>Saved Bank Accounts</Text>
                        {bankAccounts.map((acc) => (
                            <View key={acc.id} style={styles.bankCard}>
                                <View style={styles.bankIcon}>
                                    <Ionicons name="business" size={24} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.bankName}>{acc.bankName}</Text>
                                    <Text style={styles.accNo}>{acc.accNo}</Text>
                                    <Text style={styles.ifsc}>IFSC: {acc.ifsc}</Text>
                                </View>
                                <TouchableOpacity onPress={() => {
                                    setBankAccounts(bankAccounts.filter(a => a.id !== acc.id));
                                }}>
                                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
                            <Ionicons name="add" size={24} color="#FF6600" />
                            <Text style={styles.addBtnText}>Add New Bank Account</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Add Bank Details</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Account Number"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            value={form.accNo}
                            onChangeText={t => setForm({ ...form, accNo: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="IFSC Code"
                            placeholderTextColor="#999"
                            autoCapitalize="characters"
                            value={form.ifsc}
                            onChangeText={t => setForm({ ...form, ifsc: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Account Holder Name"
                            placeholderTextColor="#999"
                            value={form.holderName}
                            onChangeText={t => setForm({ ...form, holderName: t })}
                        />
                        <TouchableOpacity style={styles.submitBtn} onPress={handleAddBank}>
                            <Text style={styles.submitBtnText}>Save Bank Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddForm(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: 50 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    content: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    bankCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#eee', elevation: 2 },
    bankIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#5C6BC0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    bankName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    accNo: { fontSize: 14, color: '#666', marginTop: 2 },
    ifsc: { fontSize: 12, color: '#999', marginTop: 2 },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderWidth: 1, borderColor: '#FF6600', borderRadius: 8, borderStyle: 'dashed' },
    addBtnText: { color: '#FF6600', fontWeight: 'bold', marginLeft: 10 },

    formContainer: { padding: 5 },
    formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, marginBottom: 15, fontSize: 16 },
    submitBtn: { backgroundColor: '#FF6600', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    cancelBtn: { padding: 15, alignItems: 'center' },
    cancelBtnText: { color: '#666' }
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/utils/api';
import { useAuthStore } from '../src/store/authStore';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { logout } = useAuthStore();
    const [form, setForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChangePassword = async () => {
        if (!form.newPassword || !form.confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (form.newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            await api.put('/users/profile', {
                password: form.newPassword
            });

            Alert.alert('Success', 'Password updated successfully. Please login again.', [
                {
                    text: 'OK',
                    onPress: () => {
                        logout();
                        router.replace('/auth/login');
                    }
                }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
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
                <Text style={styles.headerTitle}>Change Password</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.infoBox}>
                    <Ionicons name="lock-closed-outline" size={24} color="#FF6600" />
                    <Text style={styles.infoText}>
                        Create a strong password with at least 6 characters. You will need to login again after changing it.
                    </Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter new password"
                            placeholderTextColor="#999"
                            secureTextEntry={!showPassword}
                            value={form.newPassword}
                            onChangeText={(t) => setForm({ ...form, newPassword: t })}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm new password"
                            placeholderTextColor="#999"
                            secureTextEntry={!showPassword}
                            value={form.confirmPassword}
                            onChangeText={(t) => setForm({ ...form, confirmPassword: t })}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Update Password</Text>
                    )}
                </TouchableOpacity>

            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    content: { padding: 20 },
    infoBox: { flexDirection: 'row', backgroundColor: '#FFF3E0', padding: 15, borderRadius: 12, marginBottom: 25, alignItems: 'center' },
    infoText: { flex: 1, marginLeft: 10, color: '#E65100', fontSize: 13, lineHeight: 18 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 10 },
    input: { flex: 1, padding: 15, fontSize: 16 },
    eyeBtn: { padding: 15 },
    saveBtn: { backgroundColor: '#333', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/utils/api';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Missing Email', 'Please enter your email address');
            return;
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            // Assuming this endpoint exists or will be created
            const response = await api.post('/auth/forgot-password', { email });
            Alert.alert(
                'Success',
                response.data.message || 'Password reset link sent to your email.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Something went wrong';
            Alert.alert('Request Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FF6600', '#FF8533', '#FFAA66']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <View style={styles.backBtnCircle}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerContainer}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="lock-open" size={40} color="#FF6600" />
                        </View>
                        <Text style={styles.title}>Forgot Password?</Text>
                        <Text style={styles.subtitle}>Enter your email to reset your password</Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputWrapperFocused]}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="mail" size={20} color={focusedInput === 'email' ? '#FF6600' : '#999'} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="name@example.com"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                    onFocus={() => setFocusedInput('email')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.resetBtn, loading && styles.disabledBtn]}
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#FF6600', '#FF7A1F']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.resetBtnGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.resetBtnText}>Send Reset Link</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.btnIcon} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    gradientBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 50 },
    backBtn: { marginBottom: 20 },
    backBtnCircle: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)'
    },
    headerContainer: { alignItems: 'center', marginBottom: 30 },
    logoContainer: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 12, elevation: 8
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
    subtitle: { fontSize: 14, color: '#fff', opacity: 0.9 },
    formCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1, shadowRadius: 24, elevation: 10
    },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 10, marginLeft: 4 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa',
        borderWidth: 2, borderColor: '#e9ecef', borderRadius: 16, paddingHorizontal: 16, height: 56
    },
    inputWrapperFocused: { borderColor: '#FF6600', backgroundColor: '#fff' },
    iconContainer: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#1a1a1a', height: '100%' },
    resetBtn: { height: 56, borderRadius: 16, overflow: 'hidden', marginTop: 10 },
    resetBtnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    disabledBtn: { opacity: 0.6 },
    resetBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
    btnIcon: { marginLeft: 4 },
});

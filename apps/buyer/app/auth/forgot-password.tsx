import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/utils/api';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSendOTP = async () => {
        if (!email) {
            Alert.alert('Missing Email', 'Please enter your registered email address.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            Alert.alert('OTP Sent', data.message + (data.otp ? `\n\nDevelopment OTP: ${data.otp}` : ''));
            setStep('otp');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) {
            Alert.alert('Missing OTP', 'Please enter the OTP sent to your email.');
            return;
        }
        setStep('password');
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/reset-password', {
                email,
                otp,
                newPassword
            });
            Alert.alert(
                'Success!',
                'Password reset successful. You can now login with your new password.',
                [{ text: 'Go to Login', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to reset password');
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
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <View style={styles.backBtnCircle}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerContainer}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="lock-open" size={40} color="#FF6600" />
                        </View>
                        <Text style={styles.title}>
                            {step === 'email' ? 'Forgot Password?' : step === 'otp' ? 'Verify OTP' : 'Reset Password'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {step === 'email' ? 'Enter your email to receive OTP' :
                                step === 'otp' ? 'Enter the 6-digit OTP sent to your email' :
                                    'Set your new password'}
                        </Text>
                    </View>

                    <View style={styles.formCard}>
                        {step === 'email' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={[
                                    styles.inputWrapper,
                                    focusedInput === 'email' && styles.inputWrapperFocused
                                ]}>
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
                                        autoComplete="email"
                                        keyboardType="email-address"
                                        returnKeyType="done"
                                        onFocus={() => setFocusedInput('email')}
                                        onBlur={() => setFocusedInput(null)}
                                        onSubmitEditing={handleSendOTP}
                                        editable={step === 'email'}
                                    />
                                </View>
                            </View>
                        )}

                        {step === 'otp' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Enter OTP</Text>
                                <View style={[
                                    styles.inputWrapper,
                                    focusedInput === 'otp' && styles.inputWrapperFocused
                                ]}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="key" size={20} color={focusedInput === 'otp' ? '#FF6600' : '#999'} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="123456"
                                        placeholderTextColor="#999"
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        returnKeyType="done"
                                        onFocus={() => setFocusedInput('otp')}
                                        onBlur={() => setFocusedInput(null)}
                                        onSubmitEditing={handleVerifyOTP}
                                    />
                                </View>
                            </View>
                        )}

                        {step === 'password' && (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>New Password</Text>
                                    <View style={[
                                        styles.inputWrapper,
                                        focusedInput === 'newPassword' && styles.inputWrapperFocused
                                    ]}>
                                        <View style={styles.iconContainer}>
                                            <Ionicons name="lock-closed" size={20} color={focusedInput === 'newPassword' ? '#FF6600' : '#999'} />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter new password"
                                            placeholderTextColor="#999"
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            secureTextEntry={!showPassword}
                                            returnKeyType="next"
                                            onFocus={() => setFocusedInput('newPassword')}
                                            onBlur={() => setFocusedInput(null)}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Confirm Password</Text>
                                    <View style={[
                                        styles.inputWrapper,
                                        focusedInput === 'confirmPassword' && styles.inputWrapperFocused
                                    ]}>
                                        <View style={styles.iconContainer}>
                                            <Ionicons name="lock-closed" size={20} color={focusedInput === 'confirmPassword' ? '#FF6600' : '#999'} />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Confirm new password"
                                            placeholderTextColor="#999"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry={!showPassword}
                                            returnKeyType="done"
                                            onFocus={() => setFocusedInput('confirmPassword')}
                                            onBlur={() => setFocusedInput(null)}
                                            onSubmitEditing={handleResetPassword}
                                        />
                                    </View>
                                </View>
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.resetBtn, loading && styles.disabledBtn]}
                            onPress={step === 'email' ? handleSendOTP : step === 'otp' ? handleVerifyOTP : handleResetPassword}
                            disabled={loading}
                            activeOpacity={0.8}
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
                                        <Text style={styles.resetBtnText}>
                                            {step === 'email' ? 'Send OTP' : step === 'otp' ? 'Verify OTP' : 'Reset Password'}
                                        </Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.btnIcon} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.backToLoginText}>Back to Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    gradientBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },
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
    title: {
        fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.1)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4
    },
    subtitle: { fontSize: 15, color: '#fff', opacity: 0.9, textAlign: 'center' },
    formCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1, shadowRadius: 24, elevation: 10
    },
    inputGroup: { marginBottom: 25 },
    label: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 10, marginLeft: 4 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa',
        borderWidth: 2, borderColor: '#e9ecef', borderRadius: 16,
        paddingHorizontal: 16, height: 56
    },
    inputWrapperFocused: {
        borderColor: '#FF6600', backgroundColor: '#fff',
        shadowColor: '#FF6600', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 3
    },
    iconContainer: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#1a1a1a', height: '100%' },
    resetBtn: {
        height: 56, borderRadius: 16, overflow: 'hidden', marginBottom: 20,
        shadowColor: '#FF6600', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 8
    },
    resetBtnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    disabledBtn: { opacity: 0.6 },
    resetBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
    btnIcon: { marginLeft: 4 },
    footer: { alignItems: 'center' },
    backToLoginText: { color: '#666', fontSize: 15, fontWeight: '600' }
});

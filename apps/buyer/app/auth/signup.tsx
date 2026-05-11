import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import api from '../../src/utils/api';

export default function SignupScreen() {
    const router = useRouter();
    const { setAuth } = useAuthStore();

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'buyer',
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [isChecked, setIsChecked] = useState(false);

    const handleSignup = async () => {
        Keyboard.dismiss();

        if (!form.name || !form.email || !form.password) {
            Alert.alert('Missing Fields', 'Please fill all required fields');
            return;
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }

        // Phone Validation (Optional but checked if entered)
        if (form.phone) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(form.phone)) {
                Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number');
                return;
            }
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', form);

            if (data.token && data._id) {
                await setAuth(data, data.token);
                router.replace('/(tabs)');
            } else {
                Alert.alert('Signup Failed', 'Invalid response from server.');
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Something went wrong';
            Alert.alert('Signup Failed', msg);
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
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <View style={styles.backBtnCircle}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerContainer}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/images/logo.jpg')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join thousands of happy shoppers</Text>
                    </View>

                    <View style={styles.formCard}>
                        {/* NAME */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={[
                                styles.inputWrapper,
                                focusedInput === 'name' && styles.inputWrapperFocused,
                            ]}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="person" size={20} color={focusedInput === 'name' ? '#FF6600' : '#999'} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#999"
                                    value={form.name}
                                    onChangeText={(t) => setForm({ ...form, name: t })}
                                    autoCorrect={false}
                                    autoComplete="off"
                                    importantForAutofill="no"
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                    onFocus={() => setFocusedInput('name')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </View>

                        {/* EMAIL */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={[
                                styles.inputWrapper,
                                focusedInput === 'email' && styles.inputWrapperFocused,
                            ]}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="mail" size={20} color={focusedInput === 'email' ? '#FF6600' : '#999'} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="name@example.com"
                                    placeholderTextColor="#999"
                                    value={form.email}
                                    onChangeText={(t) => setForm({ ...form, email: t })}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="off"
                                    importantForAutofill="no"
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                    onFocus={() => setFocusedInput('email')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </View>

                        {/* PHONE */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number (Optional)</Text>
                            <View style={[
                                styles.inputWrapper,
                                focusedInput === 'phone' && styles.inputWrapperFocused,
                            ]}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="call" size={20} color={focusedInput === 'phone' ? '#FF6600' : '#999'} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="+91 99999 99999"
                                    placeholderTextColor="#999"
                                    value={form.phone}
                                    onChangeText={(t) => setForm({ ...form, phone: t })}
                                    autoCorrect={false}
                                    autoComplete="off"
                                    keyboardType="phone-pad"
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                    onFocus={() => setFocusedInput('phone')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </View>

                        {/* PASSWORD */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={[
                                styles.inputWrapper,
                                focusedInput === 'password' && styles.inputWrapperFocused,
                            ]}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="lock-closed" size={20} color={focusedInput === 'password' ? '#FF6600' : '#999'} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Create a strong password"
                                    placeholderTextColor="#999"
                                    value={form.password}
                                    onChangeText={(t) => setForm({ ...form, password: t })}
                                    secureTextEntry={!showPassword}
                                    autoCorrect={false}
                                    autoComplete="off"
                                    importantForAutofill="no"
                                    returnKeyType="done"
                                    blurOnSubmit={true}
                                    onFocus={() => setFocusedInput('password')}
                                    onBlur={() => setFocusedInput(null)}
                                    onSubmitEditing={() => { }}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#999" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Terms Checkbox */}
                        <View style={styles.termsContainer}>
                            <TouchableOpacity
                                style={styles.checkbox}
                                onPress={() => setIsChecked(!isChecked)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkboxInner, isChecked && styles.checkboxChecked]}>
                                    {isChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.termsText}>
                                By signing up, you agree to our{' '}
                                <Text style={styles.termsLink} onPress={() => router.push('/terms-of-use' as any)}>
                                    Terms of Use
                                </Text>
                                {' '}and{' '}
                                <Text style={styles.termsLink} onPress={() => router.push('/privacy-policy' as any)}>
                                    Privacy Policy
                                </Text>
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.signupBtn, loading && styles.disabledBtn]}
                            onPress={handleSignup}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#FF6600', '#FF7A1F']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.signupBtnGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.signupBtnText}>Create Account</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.btnIcon} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

/* STYLES — UNCHANGED */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    gradientBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },
    backBtn: { marginBottom: 20 },
    backBtnCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: { alignItems: 'center', marginBottom: 30 },
    logoContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 8,
    },
    logo: { width: 60, height: 60 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
    subtitle: { fontSize: 15, color: '#fff', opacity: 0.9 },
    formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 10 },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 10, marginLeft: 4 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderWidth: 2,
        borderColor: '#e9ecef',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    inputWrapperFocused: { borderColor: '#FF6600', backgroundColor: '#fff' },
    iconContainer: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, height: '100%' },
    eyeIcon: { padding: 8 },
    signupBtn: { height: 56, borderRadius: 16, overflow: 'hidden', marginTop: 10 },
    signupBtnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    disabledBtn: { opacity: 0.6 },
    signupBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
    btnIcon: { marginLeft: 4 },
    termsContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, paddingHorizontal: 4 },
    checkbox: { padding: 4, marginRight: 8, marginTop: -2 },
    checkboxInner: {
        width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#FF6600',
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'
    },
    checkboxChecked: { backgroundColor: '#FF6600' },
    termsText: { fontSize: 13, color: '#666', lineHeight: 20, flex: 1 },
    termsLink: { color: '#FF6600', fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { color: '#666', fontSize: 15 },
    loginLink: { color: '#FF6600', fontSize: 15, fontWeight: 'bold' },
});

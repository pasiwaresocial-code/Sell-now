import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    Image,
    Keyboard,
    KeyboardAvoidingView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { useCartStore } from '../../src/store/cartStore';
import api from '../../src/utils/api';

export default function LoginScreen() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const { syncWithServer } = useCartStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);

    const handleLogin = async () => {
        Keyboard.dismiss();

        if (!email || !password) {
            Alert.alert('Missing Fields', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });

            if (data.token && data._id) {
                await setAuth(data, data.token);

                // Sync cart with server after login
                await syncWithServer(data.token);

                router.replace('/(tabs)');
            } else {
                Alert.alert('Login Failed', 'Invalid server response.');
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Something went wrong';
            Alert.alert('Login Failed', msg);
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
                    <View style={styles.headerContainer}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/images/logo.jpg')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>Welcome Back!</Text>
                        <Text style={styles.subtitle}>Sign in to continue shopping</Text>
                    </View>

                    <View style={styles.formCard}>
                        {/* EMAIL */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    focusedInput === 'email' && styles.inputWrapperFocused,
                                ]}
                            >
                                <View style={styles.iconContainer}>
                                    <Ionicons
                                        name="mail"
                                        size={20}
                                        color={focusedInput === 'email' ? '#FF6600' : '#999'}
                                    />
                                </View>

                                <TextInput
                                    ref={emailRef}
                                    style={styles.input}
                                    placeholder="name@example.com"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
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

                        {/* PASSWORD */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    focusedInput === 'password' && styles.inputWrapperFocused,
                                ]}
                            >
                                <View style={styles.iconContainer}>
                                    <Ionicons
                                        name="lock-closed"
                                        size={20}
                                        color={focusedInput === 'password' ? '#FF6600' : '#999'}
                                    />
                                </View>

                                <TextInput
                                    ref={passwordRef}
                                    style={styles.input}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
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

                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color="#999"
                                    />
                                </TouchableOpacity>
                            </View>

                            <Link href="/auth/forgot-password" asChild>
                                <TouchableOpacity style={styles.forgotPassBtn}>
                                    <Text style={styles.forgotPassText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>

                        {/* LOGIN BUTTON */}
                        <TouchableOpacity
                            style={[styles.loginBtn, loading && styles.disabledBtn]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#FF6600', '#FF7A1F']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.loginBtnGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.loginBtnText}>Sign In</Text>
                                        <Ionicons
                                            name="arrow-forward"
                                            size={20}
                                            color="#fff"
                                            style={styles.btnIcon}
                                        />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <Link href="/auth/signup" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.signupText}>Sign Up</Text>
                                </TouchableOpacity>
                            </Link>
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
    gradientBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
    headerContainer: { alignItems: 'center', marginBottom: 40 },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    logo: { width: 70, height: 70 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#fff', opacity: 0.9 },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 10,
    },
    inputGroup: { marginBottom: 20 },
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
    forgotPassBtn: { alignSelf: 'flex-end', marginTop: 8 },
    forgotPassText: { color: '#FF6600', fontWeight: '600' },
    loginBtn: { height: 56, borderRadius: 16, overflow: 'hidden', marginTop: 10 },
    loginBtnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    disabledBtn: { opacity: 0.6 },
    loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
    btnIcon: { marginLeft: 4 },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { color: '#666', fontSize: 15 },
    signupText: { color: '#FF6600', fontSize: 15, fontWeight: 'bold' },
});

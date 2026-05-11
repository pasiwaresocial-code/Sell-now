import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, ScrollView, Image, Keyboard } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import api from '../../src/utils/api';

export default function LoginScreen() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
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

            if (data.token) {
                const userData = {
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role
                };
                await setAuth(userData, data.token);
                router.replace('/(tabs)');
            } else {
                Alert.alert('Login Failed', 'Invalid server response.');
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Something went wrong';
            const approvalStatus = error.response?.data?.approvalStatus;

            // Handle approval status messages
            if (approvalStatus === 'pending') {
                Alert.alert(
                    'Account Pending Approval',
                    'Your seller account is awaiting admin approval. You will be notified once your account is approved.',
                    [{ text: 'OK', style: 'default' }]
                );
            } else if (approvalStatus === 'rejected') {
                const rejectionReason = error.response?.data?.rejectionReason || 'Not specified';
                Alert.alert(
                    'Account Rejected',
                    `Your seller account has been rejected.\n\nReason: ${rejectionReason}\n\nPlease contact support for more information.`,
                    [{ text: 'OK', style: 'default' }]
                );
            } else {
                Alert.alert('Login Failed', msg);
            }
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

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                <View style={styles.headerContainer}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/images/logo.jpg')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>Seller Dashboard</Text>
                    <Text style={styles.subtitle}>Sign in to manage your shop</Text>
                </View>

                <View style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputWrapperFocused]}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="mail" size={20} color={focusedInput === 'email' ? '#FF6600' : '#999'} />
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
                                enablesReturnKeyAutomatically={false}
                                blurOnSubmit={false}
                                onFocus={() => setFocusedInput('email')}
                                onBlur={() => setFocusedInput(null)}
                                onSubmitEditing={() => passwordRef.current?.focus()}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputWrapperFocused]}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="lock-closed" size={20} color={focusedInput === 'password' ? '#FF6600' : '#999'} />
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
                                enablesReturnKeyAutomatically={false}
                                blurOnSubmit={false}
                                onFocus={() => setFocusedInput('password')}
                                onBlur={() => setFocusedInput(null)}
                                onSubmitEditing={handleLogin}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
                            </TouchableOpacity>
                        </View>
                        <Link href="/auth/forgot-password" asChild>
                            <TouchableOpacity style={styles.forgotPassBtn}>
                                <Text style={styles.forgotPassText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

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
                                    <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.btnIcon} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.signupContainer}>
                        <Text style={styles.signupText}>Don't have an account? </Text>
                        <Link href="/auth/signup" asChild>
                            <TouchableOpacity>
                                <Text style={styles.signupLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    gradientBackground: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '45%',
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
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
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    logo: {
        width: 70,
        height: 70,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 12,
    },
    inputWrapperFocused: {
        borderColor: '#FF6600',
        backgroundColor: '#FFF5EC',
    },
    iconContainer: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
    },
    eyeIcon: {
        padding: 8,
    },
    forgotPassBtn: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    forgotPassText: {
        color: '#FF6600',
        fontSize: 14,
        fontWeight: '600',
    },
    loginBtn: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    disabledBtn: {
        opacity: 0.6,
    },
    loginBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
    btnIcon: {
        marginLeft: 4,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#999',
        fontSize: 14,
        fontWeight: '600',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupText: {
        color: '#666',
        fontSize: 15,
    },
    signupLink: {
        color: '#FF6600',
        fontSize: 15,
        fontWeight: 'bold',
    },
});

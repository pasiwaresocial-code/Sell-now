import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
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
        role: 'seller',
        aadharNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    // const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [isChecked, setIsChecked] = useState(false);

    // Focus Refs
    const emailRef = React.useRef<TextInput>(null);
    const phoneRef = React.useRef<TextInput>(null);
    const aadharRef = React.useRef<TextInput>(null);
    const passwordRef = React.useRef<TextInput>(null);

    // KYC Images
    const [shopPhoto, setShopPhoto] = useState<string | null>(null);
    const [idProofFront, setIdProofFront] = useState<string | null>(null);
    const [idProofBack, setIdProofBack] = useState<string | null>(null);

    const pickImage = async (setImage: (uri: string) => void) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        const formData = new FormData();
        formData.append('images', {
            uri,
            name: 'upload.jpg',
            type: 'image/jpeg',
        } as any);

        // Let Axios/Browser set the Boundary automatically.
        // Manually setting 'multipart/form-data' without boundary often fails in React Native
        const { data } = await api.post('/upload/multiple', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            transformRequest: (data: any, headers: any) => {
                // This is critical for React Native FormData
                return data;
            },
        });
        return data[0]; // Returns array of URLs
    };

    const handleSignup = async () => {
        if (!form.name || !form.email || !form.password || !form.aadharNumber || !form.phone) {
            Alert.alert('Missing Fields', 'Please fill all required fields including Phone & Aadhar');
            return;
        }

        if (!shopPhoto || !idProofFront || !idProofBack) {
            Alert.alert('Missing Documents', 'Please upload Shop Photo and Aadhar Front/Back');
            return;
        }

        if (!isChecked) {
            Alert.alert('Terms & Conditions', 'Please agree to the Terms of Service and Privacy Policy');
            return;
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }

        // Phone Validation (Strict 10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(form.phone)) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number');
            return;
        }

        // Aadhar Validation (Strict 12 digits, no spaces stored in backend but input might have them)
        const cleanAadhar = form.aadharNumber.replace(/\s/g, '');
        if (!/^\d{12}$/.test(cleanAadhar)) {
            Alert.alert('Invalid Aadhar', 'Aadhar number must be exactly 12 digits.');
            return;
        }

        setLoading(true);
        try {
            // Upload Images First
            const shopUrl = await uploadImage(shopPhoto);
            const frontUrl = await uploadImage(idProofFront);
            const backUrl = await uploadImage(idProofBack);

            const signupData = {
                ...form,
                shopPhoto: shopUrl,
                idProofFront: frontUrl,
                idProofBack: backUrl
            };

            const { data } = await api.post('/auth/register', signupData);

            if (data.token) {
                const userData = {
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role || 'seller'
                };
                await setAuth(userData, data.token);
                router.replace('/(tabs)');
            } else {
                Alert.alert('Signup Failed', 'Invalid response from server.');
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Details/Image Upload Failed. Please try again.';
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
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="on-drag"
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
                        <Text style={styles.title}>Start Selling</Text>
                        <Text style={styles.subtitle}>Create your seller account today</Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={[styles.inputWrapper]}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="person" size={20} color={'#999'} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#999"
                                    value={form.name}
                                    onChangeText={(t) => setForm({ ...form, name: t })}
                                    autoCorrect={false}
                                    autoComplete="off"
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                    onSubmitEditing={() => emailRef.current?.focus()}
                                // onFocus={() => setFocusedInput('name')}
                                // onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={[styles.inputWrapper]}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="mail" size={20} color={'#999'} />
                                </View>
                                <TextInput
                                    ref={emailRef}
                                    style={styles.input}
                                    placeholder="name@example.com"
                                    placeholderTextColor="#999"
                                    value={form.email}
                                    onChangeText={(t) => setForm({ ...form, email: t })}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="off"
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                    onSubmitEditing={() => phoneRef.current?.focus()}
                                // onFocus={() => setFocusedInput('email')}
                                // onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <View style={[styles.inputWrapper]}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="call" size={20} color={'#999'} />
                                </View>
                                <TextInput
                                    ref={phoneRef}
                                    style={styles.input}
                                    placeholder="98765 43210"
                                    placeholderTextColor="#999"
                                    value={form.phone}
                                    onChangeText={(t) => setForm({ ...form, phone: t })}
                                    autoCorrect={false}
                                    autoComplete="off"
                                    keyboardType="phone-pad"
                                    returnKeyType="next"
                                    maxLength={10}
                                    blurOnSubmit={false}
                                    onSubmitEditing={() => aadharRef.current?.focus()}
                                // onFocus={() => setFocusedInput('phone')}
                                // onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Aadhar Number</Text>
                            <View style={[styles.inputWrapper]}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="card" size={20} color={'#999'} />
                                </View>
                                <TextInput
                                    ref={aadharRef}
                                    style={styles.input}
                                    placeholder="1234 5678 9012"
                                    placeholderTextColor="#999"
                                    value={form.aadharNumber}
                                    onChangeText={(t) => setForm({ ...form, aadharNumber: t })}
                                    autoCorrect={false}
                                    autoComplete="off"
                                    keyboardType="number-pad"
                                    returnKeyType="next"
                                    maxLength={16}
                                    blurOnSubmit={false}
                                    onSubmitEditing={() => passwordRef.current?.focus()}
                                // onFocus={() => setFocusedInput('aadhar')}
                                // onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Verification Documents</Text>

                        <View style={styles.uploadRow}>
                            <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setShopPhoto)}>
                                {shopPhoto ? (
                                    <Image source={{ uri: shopPhoto }} style={styles.uploadedImage} />
                                ) : (
                                    <>
                                        <Ionicons name="camera" size={24} color="#FF6600" />
                                        <Text style={styles.uploadText}>Shop Photo</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setIdProofFront)}>
                                {idProofFront ? (
                                    <Image source={{ uri: idProofFront }} style={styles.uploadedImage} />
                                ) : (
                                    <>
                                        <Ionicons name="document-text" size={24} color="#FF6600" />
                                        <Text style={styles.uploadText}>Aadhar Front</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.uploadRow, { justifyContent: 'flex-start' }]}>
                            <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setIdProofBack)}>
                                {idProofBack ? (
                                    <Image source={{ uri: idProofBack }} style={styles.uploadedImage} />
                                ) : (
                                    <>
                                        <Ionicons name="document-text" size={24} color="#FF6600" />
                                        <Text style={styles.uploadText}>Aadhar Back</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={[styles.inputWrapper]}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="lock-closed" size={20} color={'#999'} />
                                </View>
                                <TextInput
                                    ref={passwordRef}
                                    style={styles.input}
                                    placeholder="Create a strong password"
                                    placeholderTextColor="#999"
                                    value={form.password}
                                    onChangeText={(t) => setForm({ ...form, password: t })}
                                    secureTextEntry={!showPassword}
                                    autoCorrect={false}
                                    autoComplete="off"
                                    returnKeyType="done"
                                    blurOnSubmit={true}
                                    // onFocus={() => setFocusedInput('password')}
                                    // onBlur={() => setFocusedInput(null)}
                                    onSubmitEditing={handleSignup}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
                                </TouchableOpacity>
                            </View>
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
                                        <Text style={styles.signupBtnText}>Create Seller Account</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.btnIcon} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

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
                                <Text style={styles.termsLink} onPress={() => router.push('/seller-policy')}>
                                    Terms of Service
                                </Text>
                                {' '}and{' '}
                                <Text style={styles.termsLink} onPress={() => router.push('/customer-policy')}>
                                    Privacy Policy
                                </Text>
                            </Text>
                        </View>

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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    gradientBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 50, paddingBottom: 120 },
    backBtn: { marginBottom: 20 },
    backBtnCircle: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)'
    },
    headerContainer: { alignItems: 'center', marginBottom: 30 },
    logoContainer: {
        width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 12, elevation: 8
    },
    logo: { width: 60, height: 60 },
    title: {
        fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.1)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4
    },
    subtitle: { fontSize: 15, color: '#fff', opacity: 0.9 },
    formCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1, shadowRadius: 24, elevation: 10
    },
    inputGroup: { marginBottom: 18 },
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
    eyeIcon: { padding: 8 },
    signupBtn: {
        height: 56, borderRadius: 16, overflow: 'hidden', marginTop: 10, marginBottom: 20,
        shadowColor: '#FF6600', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 8
    },
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
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 12, marginLeft: 4 },
    uploadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    uploadBox: {
        width: '48%', height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', marginRight: '4%'
    },
    uploadText: { marginTop: 8, fontSize: 12, color: '#666' },
    uploadedImage: { width: '100%', height: '100%', borderRadius: 12 },
});

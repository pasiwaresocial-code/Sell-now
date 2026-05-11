import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../src/utils/api';
import { useAuthStore } from '../src/store/authStore';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, token, setAuth } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [addressId, setAddressId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        profile_image: '',
        street: '',
        addressLine2: '',
        city: '',
        state: '',
        zip: '',
        landmark: ''
    });

    useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                profile_image: user.profile_image || ''
            }));
            fetchAddress();
        }
    }, [user]);

    const fetchAddress = async () => {
        try {
            const { data } = await api.get('/users/address');
            if (data && data.length > 0) {
                // Use the first address found (or preferably the default one)
                const addr = data[0];
                setAddressId(addr._id);
                setForm(prev => ({
                    ...prev,
                    street: addr.street || '',
                    addressLine2: addr.addressLine2 || '',
                    city: addr.city || '',
                    state: addr.state || '',
                    zip: addr.zip || '',
                    landmark: addr.landmark || ''
                }));
            }
        } catch (error) {
            console.log('Error fetching address:', error);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setForm({ ...form, profile_image: base64Img });
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.email) {
            Alert.alert('Error', 'Name and Email are required.');
            return;
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }
        // Basic address validation if any address field is filled
        if (form.street || form.city || form.state || form.zip) {
            if (!form.street || !form.city || !form.state || !form.zip) {
                Alert.alert('Error', 'Please fill all required address fields (Street, City, State, Pincode).');
                return;
            }
            if (form.street.length < 10) {
                Alert.alert('Error', 'Address Line 1 must be at least 10 characters long.');
                return;
            }
            if (!form.phone) {
                Alert.alert('Error', 'Phone number is required for the Pickup Address.');
                return;
            }
        }

        setLoading(true);
        try {
            // 1. Update Profile
            const { data } = await api.put('/users/profile', {
                name: form.name,
                email: form.email,
                phone: form.phone,
                profile_image: form.profile_image
            });

            // 2. Update/Create Address
            // Only proceed if at least some address info is entered
            if (form.street) {
                const addressPayload = {
                    name: form.name, // Use profile name for address
                    phone: form.phone,
                    street: form.street,
                    addressLine2: form.addressLine2,
                    city: form.city,
                    state: form.state,
                    zip: form.zip,
                    landmark: form.landmark,
                    type: 'Work', // Default to work for Seller
                    isDefault: true
                };

                if (addressId) {
                    await api.put(`/users/address/${addressId}`, addressPayload);
                } else {
                    await api.post('/users/address', addressPayload);
                }
            }

            if (data) {
                const updatedToken = data.token || token;
                const updatedUser = {
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    phone: data.phone,
                    profile_image: data.profile_image
                };

                useAuthStore.getState().setAuth(updatedUser, updatedToken!);
                Alert.alert('Success', 'Profile and Address updated successfully!');
                router.back();
            }
        } catch (error: any) {
            console.error('Update Profile Error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator size="small" color="#FF6600" /> : <Text style={styles.saveBtn}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Image Picker */}
                <View style={styles.imageSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                        <Image
                            source={{ uri: form.profile_image || `https://ui-avatars.com/api/?name=${form.name}&background=FF6600&color=fff` }}
                            style={styles.avatar}
                        />
                        <View style={styles.cameraIcon}>
                            <Ionicons name="camera" size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.sectionTitle}>Personal Info</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={form.name}
                            onChangeText={(t) => setForm({ ...form, name: t })}
                            placeholder="Store Name"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            value={form.email}
                            onChangeText={(t) => setForm({ ...form, email: t })}
                            placeholder="email@example.com"
                            placeholderTextColor="#999"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={form.phone}
                            onChangeText={(t) => setForm({ ...form, phone: t })}
                            placeholder="+91 0000000000"
                            placeholderTextColor="#999"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>Pickup Address</Text>
                    <Text style={styles.subText}>This address will be used for shipping pickups.</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Street Address / Building</Text>
                        <TextInput
                            style={styles.input}
                            value={form.street}
                            onChangeText={(t) => setForm({ ...form, street: t })}
                            placeholder="Store No, Street Name"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address Line 2 (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={form.addressLine2}
                            onChangeText={(t) => setForm({ ...form, addressLine2: t })}
                            placeholder="Area, Colony, etc."
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>City</Text>
                            <TextInput
                                style={styles.input}
                                value={form.city}
                                onChangeText={(t) => setForm({ ...form, city: t })}
                                placeholder="City"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>State</Text>
                            <TextInput
                                style={styles.input}
                                value={form.state}
                                onChangeText={(t) => setForm({ ...form, state: t })}
                                placeholder="State"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Pincode</Text>
                            <TextInput
                                style={styles.input}
                                value={form.zip}
                                onChangeText={(t) => setForm({ ...form, zip: t })}
                                placeholder="000000"
                                placeholderTextColor="#999"
                                keyboardType="number-pad"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Landmark (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={form.landmark}
                                onChangeText={(t) => setForm({ ...form, landmark: t })}
                                placeholder="Near..."
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    saveBtn: { fontSize: 16, fontWeight: 'bold', color: '#FF6600' },
    content: { padding: 20 },
    imageSection: { alignItems: 'center', marginBottom: 30 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd' },
    cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF6600', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
    changePhotoText: { color: '#FF6600', marginTop: 10, fontWeight: '500' },
    form: { gap: 20 },
    inputGroup: {},
    label: { fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#eee' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 5 },
    subText: { fontSize: 13, color: '#999', marginBottom: 15 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
});

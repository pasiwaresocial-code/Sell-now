import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, SimpleLineIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Linking, Alert } from 'react-native';
import api from '../../src/utils/api';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleEarnWithUs = async () => {
        try {
            const { data } = await api.get('/settings');
            if (data && data.earnWithUsLink) {
                Linking.openURL(data.earnWithUsLink);
            } else {
                Alert.alert('Info', 'Link not available yet.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to open link.');
        }
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <View style={styles.center}>
                    <Image
                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                        style={styles.guestAvatar}
                    />
                    <Text style={styles.guestText}>Welcome to SellNow</Text>
                    <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/auth/login')}>
                        <Text style={styles.loginText}>Sign Up / Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const MenuItem = ({ icon, label, subLabel, isNew, color = '#666', onPress }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuLeft}>
                <View style={styles.iconBox}>
                    {icon}
                </View>
                <View>
                    <Text style={styles.menuLabel}>{label}</Text>
                    {subLabel && <Text style={styles.menuSubLabel}>{subLabel}</Text>}
                </View>
            </View>
            <View style={styles.menuRight}>
                {isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>New</Text></View>}
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.userSection}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }}
                            style={styles.avatar}
                        />
                        <View style={styles.cameraIcon}>
                            <Ionicons name="camera" size={12} color="#666" />
                        </View>
                    </View>
                    <Text style={styles.phoneNumber}>{user.name || 'No Phone Number'}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/edit-profile')}>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Quick Actions Grid */}
            <View style={styles.gridContainer}>
                <TouchableOpacity style={styles.gridButton} onPress={() => router.push('/help-center' as any)}>
                    <Ionicons name="call-outline" size={24} color="#5C6BC0" style={{ marginBottom: 8 }} />
                    <Text style={styles.gridText}>Help Centre</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gridButton} onPress={handleEarnWithUs}>
                    <Ionicons name="cash-outline" size={24} color="#facc15" style={{ marginBottom: 8 }} />
                    <Text style={styles.gridText}>Earn With Us</Text>
                </TouchableOpacity>
            </View>

            {/* My Payments */}
            <Text style={styles.sectionTitle}>My Payments</Text>
            <View style={styles.sectionContainer}>
                <MenuItem
                    icon={<MaterialCommunityIcons name="bank-outline" size={22} color="#5C6BC0" />}
                    label="Bank & UPI Details"
                    onPress={() => router.push('/bank-details' as any)}
                />
                <View style={styles.divider} />
                <MenuItem
                    icon={<Ionicons name="card-outline" size={22} color="#5C6BC0" />}
                    label="Payment & Refund"
                    onPress={() => router.push('/payment-refund' as any)}
                />
            </View>

            {/* My Activity */}
            <Text style={styles.sectionTitle}>My Activity</Text>
            <View style={styles.sectionContainer}>
                <MenuItem
                    icon={<Ionicons name="location-outline" size={22} color="#E91E63" />}
                    label="Saved Addresses"
                    onPress={() => router.push('/address' as any)}
                />
                <View style={styles.divider} />
                <MenuItem
                    icon={<Ionicons name="heart" size={22} color="#E91E63" />}
                    label="Wishlisted Products"
                    onPress={() => router.push('/wishlist' as any)}
                />
                <View style={styles.divider} />
            </View>

            {/* Others */}


            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        paddingTop: 50,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 100,
    },
    guestAvatar: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    guestText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    loginBtn: {
        backgroundColor: '#FF6600',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 8,
    },
    loginText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 25,
        backgroundColor: '#fff',
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFE0B2',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 4,
    },
    phoneNumber: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    gridContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 15,
        marginBottom: 25,
    },
    gridButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    gridText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 20,
        marginBottom: 10,
        marginTop: 10,
    },
    sectionContainer: {

    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 30,
        alignItems: 'center',
        marginRight: 15,
    },
    menuLabel: {
        fontSize: 15,
        color: '#333',
    },
    menuSubLabel: {
        fontSize: 12,
        color: '#23BB75',
        fontWeight: 'bold',
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    newBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    newBadgeText: {
        fontSize: 10,
        color: '#2196F3',
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#f5f5f5',
        marginLeft: 65,
    },
    logoutBtn: {
        margin: 20,
        padding: 15,
        backgroundColor: '#fafafa',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    logoutText: {
        color: '#FF3B30',
        fontWeight: '600',
    }
});

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    if (!user) {
        return (
            <View style={styles.container}>
                <View style={styles.center}>
                    <Image
                        source={{ uri: 'https://ui-avatars.com/api/?name=Guest&background=random' }}
                        style={styles.avatar}
                    />
                    <Text style={styles.guestText}>Welcome, Guest!</Text>
                    <Text style={styles.guestSubtext}>Please login to manage your business.</Text>
                    <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/auth/login')}>
                        <Text style={styles.loginText}>Login Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const menuItems = [
        { icon: 'list', label: 'My Inventory', route: '/(tabs)/listings' },
        { icon: 'cart-outline', label: 'Order History', route: '/orders-history' },
        { icon: 'card-outline', label: 'Payments & Payouts', route: '/payments' },
        { icon: 'settings-outline', label: 'Business Settings', route: '/settings' },
        { icon: 'help-circle-outline', label: 'Help & Support', route: '/support' },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={() => router.push('/edit-profile')}>
                    <Text style={styles.editBtn}>Edit</Text>
                </TouchableOpacity>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <Image
                    source={{ uri: user.profile_image || `https://ui-avatars.com/api/?name=${user.name}&background=FF6600&color=fff` }}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user.role || 'Seller'}</Text>
                    </View>
                </View>
            </View>

            {/* Menu */}
            <View style={styles.menu}>
                <Text style={styles.sectionTitle}>Business Tools</Text>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.menuItem, index === menuItems.length - 1 && styles.lastMenuItem]}
                        onPress={() => item.route && router.push(item.route as any)}
                    >
                        <View style={styles.menuLeft}>
                            <View style={styles.iconBox}>
                                <Ionicons name={item.icon as any} size={22} color="#555" />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={() => {
                logout();
                router.replace('/auth/login');
            }}>
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <Text style={styles.version}>v1.0.0 • SellNow Business</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    guestText: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
        color: '#333',
    },
    guestSubtext: {
        color: '#666',
        marginTop: 10,
        marginBottom: 30,
    },
    loginBtn: {
        backgroundColor: '#FF6600',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        shadowColor: '#FF6600',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    editBtn: {
        fontSize: 16,
        color: '#FF6600',
        fontWeight: '600',
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 20,
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    userInfo: {
        marginLeft: 15,
        flex: 1,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    roleBadge: {
        backgroundColor: '#fff5ec',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 8,
    },
    roleText: {
        color: '#FF6600',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    menu: {
        marginTop: 25,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#999',
        marginBottom: 15,
        marginLeft: 5,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    lastMenuItem: {
        marginBottom: 0,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffe5e5',
        marginHorizontal: 20,
        marginTop: 30,
        padding: 16,
        borderRadius: 16,
    },
    logoutText: {
        color: '#D32F2F',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    version: {
        textAlign: 'center',
        color: '#ccc',
        fontSize: 12,
        marginTop: 25,
    },
});

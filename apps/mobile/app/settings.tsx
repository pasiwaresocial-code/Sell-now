import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [emailAlerts, setEmailAlerts] = useState(true);

    const SettingItem = ({ icon, label, type = 'toggle', value, onToggle, color = '#333' }: any) => (
        <View style={styles.item}>
            <View style={styles.itemLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#f5f5f5' }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text style={[styles.itemLabel, { color }]}>{label}</Text>
            </View>
            {type === 'toggle' ? (
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: '#eee', true: '#FF6600' }}
                    thumbColor={'#fff'}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionHeader}>Preferences</Text>
                <View style={styles.box}>
                    <SettingItem
                        icon="notifications-outline"
                        label="Push Notifications"
                        value={notifications}
                        onToggle={setNotifications}
                        color="#FF6600"
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="mail-outline"
                        label="Email Alerts"
                        value={emailAlerts}
                        onToggle={setEmailAlerts}
                        color="#007AFF"
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="moon-outline"
                        label="Dark Mode"
                        value={darkMode}
                        onToggle={setDarkMode}
                        color="#333"
                    />
                </View>

                <Text style={styles.sectionHeader}>Account</Text>
                <View style={styles.box}>
                    <TouchableOpacity onPress={() => router.push('/change-password')}>
                        <SettingItem icon="lock-closed-outline" label="Change Password" type="link" color="#333" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity onPress={() => Alert.alert('Delete Account', 'Data will be wiped.')}>
                        <SettingItem icon="trash-outline" label="Delete Account" type="link" color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    sectionHeader: { fontSize: 14, fontWeight: '600', color: '#999', marginBottom: 10, marginLeft: 5, marginTop: 10 },
    box: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 15, marginBottom: 20 },
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
    itemLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    itemLabel: { fontSize: 16, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#f5f5f5' },
});

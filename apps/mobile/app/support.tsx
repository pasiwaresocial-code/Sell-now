import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SupportScreen() {
    const router = useRouter();

    const SupportItem = ({ icon, title, subtitle }: any) => (
        <TouchableOpacity style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: '#fff5ec' }]}>
                <Ionicons name={icon} size={24} color="#FF6600" />
            </View>
            <View style={styles.textInfo}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.hero}>
                    <Text style={styles.heroTitle}>How can we help?</Text>
                    <Text style={styles.heroSub}>Find answers or contact our team.</Text>
                </View>

                <View style={[styles.section, { paddingBottom: 30 }]}>
                    <View style={styles.contactCard}>
                        <Text style={styles.contactTitle}>Sell Now App – India</Text>
                        <View style={styles.contactRow}>
                            <Ionicons name="location-outline" size={20} color="#666" style={{ marginTop: 2 }} />
                            <Text style={styles.contactText}>
                                Registered Office: Ameenpur, Hyderabad, Telangana, India
                            </Text>
                        </View>
                        <View style={styles.contactRow}>
                            <Ionicons name="time-outline" size={20} color="#666" style={{ marginTop: 2 }} />
                            <Text style={styles.contactText}>
                                Monday – Saturday | 9:00 AM – 7:00 PM (IST)
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 10 }]}>Get in Touch</Text>

                    <TouchableOpacity style={styles.card} onPress={() => Linking.openURL('https://wa.me/919014081760')}>
                        <View style={[styles.iconCircle, { backgroundColor: '#E0F2F1' }]}>
                            <Ionicons name="logo-whatsapp" size={24} color="#009688" />
                        </View>
                        <View style={styles.textInfo}>
                            <Text style={styles.cardTitle}>WhatsApp Support</Text>
                            <Text style={styles.cardSubtitle}>+91 90140 81760</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card} onPress={() => Linking.openURL('tel:+919014081760')}>
                        <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                            <Ionicons name="call-outline" size={24} color="#2196F3" />
                        </View>
                        <View style={styles.textInfo}>
                            <Text style={styles.cardTitle}>Call Us</Text>
                            <Text style={styles.cardSubtitle}>+91 90140 81760</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card} onPress={() => Linking.openURL('mailto:sellnowhyd@gmail.com')}>
                        <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                            <Ionicons name="mail-outline" size={24} color="#FF9800" />
                        </View>
                        <View style={styles.textInfo}>
                            <Text style={styles.cardTitle}>Email Support</Text>
                            <Text style={styles.cardSubtitle}>sellnowhyd@gmail.com</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Version 1.0.1</Text>
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
    hero: { marginBottom: 30, marginTop: 10 },
    heroTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },
    heroSub: { fontSize: 16, color: '#666', marginTop: 5 },
    section: { gap: 15 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
    iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    textInfo: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    cardSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
    footer: { alignItems: 'center', marginTop: 40 },
    footerText: { color: '#ccc' },
    // Contact Styles
    contactCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 10 },
    contactTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 12 },
    contactRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    contactText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', marginLeft: 5 }
});

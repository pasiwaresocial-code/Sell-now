import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function HelpCenterScreen() {
    const router = useRouter();

    const faqs = [
        { q: 'How do I return my order?', a: 'Go to "My Orders", select the order, and click "Return".' },
        { q: 'When will I get my refund?', a: 'Refunds are processed within 5-7 business days after pickup.' },
        { q: 'How to contact customer support?', a: 'You can email us or call us (Mon-Sat, 9am-6pm).' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help Center</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                {faqs.map((item, index) => (
                    <View key={index} style={styles.faqItem}>
                        <Text style={styles.question}>{item.q}</Text>
                        <Text style={styles.answer}>{item.a}</Text>
                    </View>
                ))}

                <Text style={styles.sectionTitle}>Contact Us - Sell Now India</Text>

                <View style={styles.contactCard}>
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

                <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('https://wa.me/919014081760')}>
                    <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                    <View>
                        <Text style={styles.contactLabel}>WhatsApp Support</Text>
                        <Text style={styles.contactSub}>+91 90140 81760</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('tel:+919014081760')}>
                    <Ionicons name="call" size={24} color="#FF6600" />
                    <View>
                        <Text style={styles.contactLabel}>Call Customer Care</Text>
                        <Text style={styles.contactSub}>+91 90140 81760</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('mailto:sellnowhyd@gmail.com')}>
                    <MaterialIcons name="email" size={24} color="#FF6600" />
                    <View>
                        <Text style={styles.contactLabel}>Email Support</Text>
                        <Text style={styles.contactSub}>sellnowhyd@gmail.com</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: 50 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    content: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, marginTop: 10, color: '#333' },
    faqItem: { marginBottom: 15, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8 },
    question: { fontWeight: 'bold', marginBottom: 5, color: '#333' },
    answer: { color: '#666', lineHeight: 20 },
    contactItem: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF5EB', borderRadius: 8, marginBottom: 10, gap: 15 },
    contactLabel: { fontWeight: 'bold', color: '#333', fontSize: 16 },
    contactSub: { color: '#666', fontSize: 13 },
    // New Contact Card Styles
    contactCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
    contactRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    contactText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Section title="1. Introduction">
                        Welcome to SellNow. We value your trust and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, share, and protect your data when you use our online marketplace platform.
                    </Section>

                    <Section title="2. Information We Collect">
                        To provide our services, we collect the following types of information:
                        {'\n'}• Personal Information: Name, email, phone number.
                        {'\n'}• Delivery Information: Shipping address and contact details.
                        {'\n'}• Order & Payment Information: Details regarding orders and payments.
                        {'\n'}• Transaction History: Records of orders, cancellations, and returns.
                    </Section>

                    <Section title="3. Purpose of Collection">
                        We use your information for Order Fulfillment, Shipping & Delivery, Refunds & Returns, Customer Support, and Platform Integrity.
                    </Section>

                    <Section title="4. Data Sharing and Disclosure">
                        We may share your information with Sellers (to fulfill orders), Logistics Providers (for shipping), and for Legal Compliance.
                    </Section>

                    <Section title="5. Data Security">
                        We implement reasonable security practices to protect your data. However, no method of transmission over the internet is completely secure.
                    </Section>

                    <Section title="6. User Rights">
                        You have the right to Access and Correct your information and Withdraw Consent for data processing.
                    </Section>

                    <Section title="7. Grievance Officer">
                        Name: Compliance Officer
                        {'\n'}Email: sellnowhyd@gmail.com
                        {'\n'}Phone: +91 90140 81760
                        {'\n'}The Grievance Officer will acknowledge your complaint within 48 hours and resolve it within 1 month.
                    </Section>

                    <Section title="8. Policy Updates">
                        SellNow reserves the right to update this policy at any time. Continued use of the platform constitutes your acceptance of the updated policy.
                    </Section>

                    <Section title="9. Contact Us">
                        For any queries, please contact us through the official support channels available on the platform.
                    </Section>
                </View>
            </ScrollView>
        </View>
    );
}

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionText}>{children}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    sectionText: { fontSize: 14, color: '#666', lineHeight: 22 },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SellerPolicyScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seller / Vendor Policy</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Section title="1. Introduction">
                        SellNow is a digital marketplace platform that allows registered sellers (vendors) to list and sell their products to customers. This policy defines terms related to delivery charges, payment settlement, order cancellation, and operational practices.
                    </Section>

                    <Section title="2. Seller Registration & Responsibilities">
                        Sellers must provide accurate and up-to-date details. Sellers are responsible for product quality, pricing, legality, and compliance.
                    </Section>

                    <Section title="3. Product Listing Policy">
                        Only legally permitted products may be listed. SellNow reserves the right to remove misleading or non-compliant listings.
                    </Section>

                    <Section title="4. Delivery & Courier Charges">
                        All delivery and courier charges shall be borne by the seller and deducted from settlements.
                    </Section>

                    <Section title="5. Order Cancellation & Returns">
                        Courier charges for cancelled, returned, or failed deliveries will be borne by the seller and adjusted during settlement.
                    </Section>

                    <Section title="6. Payment Settlement">
                        Payments for successfully delivered orders will be settled within 15 days to the seller’s registered bank account.
                    </Section>

                    <Section title="7. Platform Rights">
                        SellNow reserves the right to suspend accounts, hold settlements, or update policies as required.
                    </Section>

                    <Section title="8. Limitation of Liability">
                        SellNow is not responsible for courier delays, third-party failures, or unforeseen circumstances.
                    </Section>

                    <Section title="9. Policy Updates">
                        Policies may be updated from time to time. Continued use indicates acceptance.
                    </Section>

                    <Section title="10. Contact">
                        Sellers may contact SellNow via official support channels.
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

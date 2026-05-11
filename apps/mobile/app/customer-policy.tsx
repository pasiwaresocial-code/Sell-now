import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerPolicyScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Customer Policy</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Section title="1. Introduction">
                        SellNow is an online marketplace platform that allows customers to browse, purchase, and receive products from registered sellers. This Customer Policy outlines the rights, responsibilities, and conditions applicable to users purchasing products on the SellNow platform.
                    </Section>

                    <Section title="2. Account & Usage">
                        Customers must provide accurate information while creating an account. Any misuse, fraudulent activity, or violation of platform rules may result in account suspension.
                    </Section>

                    <Section title="3. Orders & Payments">
                        All orders placed on SellNow are subject to product availability and successful payment confirmation. Prices shown on the platform are inclusive or exclusive of delivery charges as displayed during checkout.
                    </Section>

                    <Section title="4. Shipping & Delivery">
                        Delivery timelines are estimated and may vary depending on location, courier partner, or unforeseen circumstances. SellNow is not responsible for delays caused by third-party logistics providers.
                    </Section>

                    <Section title="5. Cancellation & Returns">
                        Order cancellation and return eligibility depend on the seller’s return policy and product category. Once an order is shipped, cancellation may not be possible.
                    </Section>

                    <Section title="6. Refund Policy">
                        Refunds, if applicable, will be processed after successful return verification and may take several business days to reflect in the customer’s account.
                    </Section>

                    <Section title="7. User Responsibilities">
                        Customers are responsible for providing correct delivery details. SellNow is not liable for failed deliveries due to incorrect address or unavailability of the customer.
                    </Section>

                    <Section title="8. Limitation of Liability">
                        SellNow shall not be liable for indirect losses, delays, or damages arising from seller actions, courier delays, or external factors beyond platform control.
                    </Section>

                    <Section title="9. Policy Updates">
                        SellNow reserves the right to update this policy at any time. Continued use of the platform constitutes acceptance of the updated policy.
                    </Section>

                    <Section title="10. Contact & Support">
                        For any queries, complaints, or support requests, customers may contact SellNow through official support channels available on the platform.
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

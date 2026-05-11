import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsOfUseScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Use</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Section title="1. Introduction">
                        Welcome to SellNow. By accessing or using our platform, you agree to be bound by these Terms of Use.
                    </Section>

                    <Section title="2. Eligibility & Account Creation">
                        You must be capable of entering into a legally binding contract. You must provide accurate information and may be suspended for misuse.
                    </Section>

                    <Section title="3. Orders, Pricing & Payments">
                        All orders are subject to availability and payment confirmation. Pricing includes or excludes delivery charges as displayed.
                    </Section>

                    <Section title="4. Shipping & Delivery">
                        Delivery timelines are estimated. SellNow is not responsible for courier delays. You are responsible for providing correct delivery details.
                    </Section>

                    <Section title="5. Cancellations, Returns & Refunds">
                        Eligibility depends on the seller's policy. Cancellation may not be possible once shipped. Refunds are processed after return verification.
                    </Section>

                    <Section title="6. Limitation of Liability">
                        SellNow is an intermediary and not liable for indirect losses, courier delays, or unauthorized account use.
                    </Section>

                    <Section title="7. Modifications to Terms">
                        SellNow reserves the right to update this policy at any time.
                    </Section>

                    <Section title="8. Governing Law">
                        These Terms are governed by the laws of India. Disputes are subject to the jurisdiction of courts in Hyderabad, Telangana.
                    </Section>

                    <Section title="9. Grievance Redressal">
                        Contact us through official channels.
                        {'\n'}Grievance Officer: Compliance Officer
                        {'\n'}Contact: sellnowhyd@gmail.com | +91 90140 81760
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

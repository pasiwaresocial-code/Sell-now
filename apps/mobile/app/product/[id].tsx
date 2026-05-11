import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProductDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // Mock Data (replace with API call later)
    const product = {
        id,
        title: 'iPhone 13 128GB',
        price: '45,000',
        description: 'Selling my iPhone 13. Used for 1 year. Battery health 90%. Comes with box and charger.',
        image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600',
        condition: 'Good',
        seller: 'Aman गुप्ता',
        location: 'Delhi, India',
        posted: '2 days ago'
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header Image */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <Text style={styles.price}>₹{product.price}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{product.condition}</Text>
                        </View>
                    </View>
                    <Text style={styles.title}>{product.title}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{product.description}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Seller Info</Text>
                    <View style={styles.sellerRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{product.seller[0]}</Text>
                        </View>
                        <View>
                            <Text style={styles.sellerName}>{product.seller}</Text>
                            <Text style={styles.location}>{product.location}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity style={[styles.btn, styles.chatBtn]}>
                    <Ionicons name="chatbubble-outline" size={20} color="#FF6600" />
                    <Text style={styles.chatBtnText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.buyBtn]}>
                    <Text style={styles.buyBtnText}>Make Offer</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    imageContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#f1f1f1',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    content: {
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    price: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF6600',
    },
    badge: {
        backgroundColor: '#eef',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    badgeText: {
        color: '#66d',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
    },
    sellerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#555',
    },
    sellerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    location: {
        fontSize: 14,
        color: '#777',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    btn: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    chatBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FF6600',
        marginRight: 10,
    },
    chatBtnText: {
        color: '#FF6600',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    buyBtn: {
        backgroundColor: '#FF6600',
    },
    buyBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

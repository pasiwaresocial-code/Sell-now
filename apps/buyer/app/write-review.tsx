import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/utils/api';

export default function WriteReviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const productId = params.productId as string;
    const orderId = params.orderId as string;

    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Please select a rating');
            return;
        }

        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a review title');
            return;
        }

        if (!comment.trim()) {
            Alert.alert('Error', 'Please write your review');
            return;
        }

        try {
            setLoading(true);

            await api.post('/reviews', {
                productId,
                orderId,
                rating,
                title,
                comment
            });

            Alert.alert('Success', 'Your review has been submitted!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Submit Review Error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Write Review</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Rating */}
                <View style={styles.section}>
                    <Text style={styles.label}>Your Rating *</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Ionicons
                                    name={star <= rating ? 'star' : 'star-outline'}
                                    size={40}
                                    color={star <= rating ? '#FFB800' : '#ddd'}
                                    style={{ marginRight: 8 }}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Title */}
                <View style={styles.section}>
                    <Text style={styles.label}>Review Title *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Summarize your experience"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />
                    <Text style={styles.charCount}>{title.length}/100</Text>
                </View>

                {/* Comment */}
                <View style={styles.section}>
                    <Text style={styles.label}>Your Review *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Tell us what you liked or disliked about this product"
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={6}
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{comment.length}/500</Text>
                </View>

                {/* Tips */}
                <View style={styles.tipsBox}>
                    <Ionicons name="bulb-outline" size={20} color="#FF6600" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.tipsTitle}>Review Tips</Text>
                        <Text style={styles.tipText}>• Be specific about what you liked or didn't like</Text>
                        <Text style={styles.tipText}>• Mention the product quality and value</Text>
                        <Text style={styles.tipText}>• Share how you're using the product</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitBtnText}>
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 50,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    content: { padding: 16 },

    section: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
    starsRow: { flexDirection: 'row', alignItems: 'center' },

    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#333'
    },
    textArea: {
        height: 120,
        paddingTop: 12
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        textAlign: 'right'
    },

    tipsBox: {
        flexDirection: 'row',
        backgroundColor: '#fff5ec',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#FF6600'
    },
    tipsTitle: { fontSize: 14, fontWeight: '600', color: '#FF6600', marginBottom: 4 },
    tipText: { fontSize: 13, color: '#666', marginBottom: 2 },

    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    submitBtn: {
        backgroundColor: '#FF6600',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center'
    },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

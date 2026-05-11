import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/utils/api';

interface Review {
    _id: string;
    user: { name: string };
    rating: number;
    title: string;
    comment: string;
    verified: boolean;
    helpfulCount: number;
    createdAt: string;
}

interface ReviewsListProps {
    productId: string;
}

export default function ReviewsList({ productId }: ReviewsListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ average: 0, total: 0 });

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/reviews/product/${productId}`);
            setReviews(data.reviews || []);

            // Calculate stats
            if (data.reviews && data.reviews.length > 0) {
                const avg = data.reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / data.reviews.length;
                setStats({ average: avg, total: data.reviews.length });
            }
        } catch (error) {
            console.error('Fetch Reviews Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkHelpful = async (reviewId: string) => {
        try {
            await api.post(`/reviews/${reviewId}/helpful`);
            // Update local count
            setReviews(reviews.map(r =>
                r._id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
            ));
        } catch (error) {
            console.error('Mark Helpful Error:', error);
        }
    };

    const renderRatingBar = (stars: number, count: number, total: number) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
            <View key={stars} style={styles.ratingBar}>
                <Text style={styles.ratingStars}>{stars}★</Text>
                <View style={styles.barContainer}>
                    <View style={[styles.barFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.ratingCount}>{count}</Text>
            </View>
        );
    };

    const renderReview = ({ item }: { item: Review }) => {
        const date = new Date(item.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return (
            <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{item.user.name[0]}</Text>
                        </View>
                        <View>
                            <Text style={styles.userName}>{item.user.name}</Text>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Ionicons
                                        key={star}
                                        name={star <= item.rating ? 'star' : 'star-outline'}
                                        size={14}
                                        color={star <= item.rating ? '#FFB800' : '#ddd'}
                                        style={{ marginRight: 2 }}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                    {item.verified && (
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#038D63" />
                            <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.reviewTitle}>{item.title}</Text>
                <Text style={styles.reviewComment}>{item.comment}</Text>

                <View style={styles.reviewFooter}>
                    <Text style={styles.reviewDate}>{date}</Text>
                    <TouchableOpacity
                        style={styles.helpfulBtn}
                        onPress={() => handleMarkHelpful(item._id)}
                    >
                        <Ionicons name="thumbs-up-outline" size={16} color="#666" />
                        <Text style={styles.helpfulText}>Helpful ({item.helpfulCount})</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return <ActivityIndicator size="small" color="#FF6600" style={{ marginVertical: 20 }} />;
    }

    if (reviews.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Ionicons name="star-outline" size={50} color="#ddd" />
                <Text style={styles.emptyText}>No reviews yet</Text>
                <Text style={styles.emptySubtext}>Be the first to review this product!</Text>
            </View>
        );
    }

    // Calculate rating distribution
    const distribution = [5, 4, 3, 2, 1].map(stars => ({
        stars,
        count: reviews.filter(r => r.rating === stars).length
    }));

    return (
        <View style={styles.container}>
            {/* Rating Summary */}
            <View style={styles.summaryCard}>
                <View style={styles.averageSection}>
                    <Text style={styles.averageNumber}>{stats.average.toFixed(1)}</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <Ionicons
                                key={star}
                                name={star <= Math.round(stats.average) ? 'star' : 'star-outline'}
                                size={18}
                                color="#FFB800"
                                style={{ marginRight: 2 }}
                            />
                        ))}
                    </View>
                    <Text style={styles.totalReviews}>{stats.total} reviews</Text>
                </View>

                <View style={styles.distributionSection}>
                    {distribution.map(d => renderRatingBar(d.stars, d.count, stats.total))}
                </View>
            </View>

            {/* Reviews List */}
            <FlatList
                data={reviews}
                renderItem={renderReview}
                keyExtractor={item => item._id}
                scrollEnabled={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginTop: 16 },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 16,
        borderRadius: 8
    },
    averageSection: {
        alignItems: 'center',
        marginRight: 24,
        paddingRight: 24,
        borderRightWidth: 1,
        borderRightColor: '#eee'
    },
    averageNumber: { fontSize: 36, fontWeight: 'bold', color: '#333' },
    starsRow: { flexDirection: 'row', marginVertical: 4 },
    totalReviews: { fontSize: 13, color: '#999', marginTop: 4 },

    distributionSection: { flex: 1 },
    ratingBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    ratingStars: { fontSize: 12, color: '#666', width: 30 },
    barContainer: { flex: 1, height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, marginRight: 8 },
    barFill: { height: '100%', backgroundColor: '#FFB800', borderRadius: 3 },
    ratingCount: { fontSize: 12, color: '#999', width: 30, textAlign: 'right' },

    reviewCard: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 12,
        borderRadius: 8
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FF6600',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    userName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F8F5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    verifiedText: { fontSize: 11, color: '#038D63', marginLeft: 4, fontWeight: '600' },

    reviewTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
    reviewComment: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 12 },

    reviewFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
    reviewDate: { fontSize: 12, color: '#999' },
    helpfulBtn: { flexDirection: 'row', alignItems: 'center' },
    helpfulText: { fontSize: 13, color: '#666', marginLeft: 6 },

    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 16
    },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#999', marginTop: 12 },
    emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 4 },
});

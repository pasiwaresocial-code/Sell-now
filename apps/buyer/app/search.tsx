import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { getImageUrl } from '../src/utils/api';

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState<any>(null);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
    const [showSortModal, setShowSortModal] = useState(false);

    // Popular searches
    const popularSearches = ['Mobile', 'Shirt', 'Shoes', 'Laptop', 'Watch'];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data || []);
        } catch (error) {
            console.error('Categories Error:', error);
        }
    };

    const handleSearch = (text: string) => {
        setQuery(text);
        if (typingTimeout) clearTimeout(typingTimeout);

        if (!text.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const newTimeout = setTimeout(async () => {
            try {
                const params: any = { keyword: text };
                if (selectedCategory) params.category = selectedCategory;
                if (sortBy !== 'newest') params.sort = sortBy;

                const { data } = await api.get('/products', { params });
                setResults(data.products || []);
            } catch (error) {
                console.error('Search Error:', error);
            } finally {
                setLoading(false);
            }
        }, 500);

        setTypingTimeout(newTimeout);
    };

    const handleCategorySelect = (categoryId: string | null) => {
        setSelectedCategory(categoryId);
        if (query.trim()) {
            handleSearch(query); // Re-search with new category
        }
    };

    const handleSortChange = (sort: 'newest' | 'price_asc' | 'price_desc') => {
        setSortBy(sort);
        setShowSortModal(false);
        if (query.trim()) {
            handleSearch(query); // Re-search with new sort
        }
    };

    const handlePopularSearch = (searchText: string) => {
        setQuery(searchText);
        handleSearch(searchText);
    };

    const renderItem = ({ item }: { item: any }) => {
        let effectivePrice = item.price;
        if (item.displayPrice) effectivePrice = item.displayPrice;
        else if (item.basePrice) effectivePrice = item.basePrice;
        else if (item.variants && item.variants.length > 0) effectivePrice = item.variants[0].price;

        const effectiveStock = item.stock || 0;
        const isOutOfStock = effectiveStock <= 0;

        return (
            <TouchableOpacity
                style={styles.itemContainer}
                onPress={() => router.push(`/product/${item._id}` as any)}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: getImageUrl(item.images?.[0]) || undefined }}
                        style={styles.itemImage}
                    />
                    {isOutOfStock && (
                        <View style={styles.outOfStockBadge}>
                            <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                    )}
                </View>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.itemPrice}>₹{effectivePrice}</Text>
                    {effectiveStock > 0 && <Text style={styles.stockText}>{effectiveStock} left</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.inputContainer}>
                    <Ionicons name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="Search for products..."
                        placeholderTextColor="#999"
                        value={query}
                        onChangeText={handleSearch}
                        autoFocus
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Ionicons name="close-circle" size={20} color="#ccc" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filters Row */}
            <View style={styles.filtersRow}>
                <TouchableOpacity style={styles.filterBtn} onPress={() => setShowSortModal(true)}>
                    <Ionicons name="swap-vertical" size={16} color="#FF6600" />
                    <Text style={styles.filterBtnText}>
                        {sortBy === 'newest' ? 'Newest' : sortBy === 'price_asc' ? 'Low to High' : 'High to Low'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterBtn, selectedCategory && styles.filterBtnActive]}
                    onPress={() => setSelectedCategory(null)}
                >
                    <Ionicons name="grid" size={16} color={selectedCategory ? "#fff" : "#FF6600"} />
                    <Text style={[styles.filterBtnText, selectedCategory && styles.filterBtnTextActive]}>
                        {selectedCategory ? 'Clear Filter' : 'All'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Categories Horizontal Scroll */}
            {categories.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat._id}
                                style={[styles.categoryChip, selectedCategory === cat._id && styles.categoryChipActive]}
                                onPress={() => handleCategorySelect(cat._id === selectedCategory ? null : cat._id)}
                            >
                                <View style={styles.catImageContainer}>
                                    <Image
                                        source={{ uri: getImageUrl(cat.image) || 'https://via.placeholder.com/40' }}
                                        style={styles.catImage}
                                    />
                                </View>
                                <Text style={[styles.categoryChipText, selectedCategory === cat._id && styles.categoryChipTextActive]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 50 }} />
            ) : query.trim().length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={60} color="#eee" />
                    <Text style={styles.emptyText}>Type to search products</Text>
                    <Text style={styles.popularTitle}>Popular Searches:</Text>
                    <View style={styles.popularContainer}>
                        {popularSearches.map((search, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.popularChip}
                                onPress={() => handlePopularSearch(search)}
                            >
                                <Text style={styles.popularChipText}>{search}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="sad-outline" size={60} color="#eee" />
                            <Text style={styles.emptyText}>No results found for "{query}"</Text>
                        </View>
                    }
                />
            )}

            {/* Sort Modal */}
            <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSortModal(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Sort By</Text>
                        <TouchableOpacity style={styles.sortOption} onPress={() => handleSortChange('newest')}>
                            <Text style={styles.sortText}>Newest First</Text>
                            {sortBy === 'newest' && <Ionicons name="checkmark" size={20} color="#FF6600" />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sortOption} onPress={() => handleSortChange('price_asc')}>
                            <Text style={styles.sortText}>Price: Low to High</Text>
                            {sortBy === 'price_asc' && <Ionicons name="checkmark" size={20} color="#FF6600" />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sortOption} onPress={() => handleSortChange('price_desc')}>
                            <Text style={styles.sortText}>Price: High to Low</Text>
                            {sortBy === 'price_desc' && <Ionicons name="checkmark" size={20} color="#FF6600" />}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', gap: 10, paddingTop: 50 },
    inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 10, height: 40 },
    input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
    filtersRow: { flexDirection: 'row', padding: 15, gap: 10 },
    filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#FF6600', gap: 5 },
    filterBtnActive: { backgroundColor: '#FF6600' },
    filterBtnText: { fontSize: 12, color: '#FF6600', fontWeight: '600' },
    filterBtnTextActive: { color: '#fff' },

    // Improved Category List
    categoriesScroll: { paddingHorizontal: 15 },
    categoryChip: { flexDirection: 'row', alignItems: 'center', paddingRight: 12, paddingLeft: 4, paddingVertical: 4, borderRadius: 20, backgroundColor: '#f5f5f5', marginRight: 10, borderWidth: 1, borderColor: '#eee' },
    categoryChipActive: { backgroundColor: '#FFF5EB', borderColor: '#FF6600' },
    catImageContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', marginRight: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    catImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    categoryChipText: { fontSize: 13, color: '#333', fontWeight: '500' },
    categoryChipTextActive: { color: '#FF6600', fontWeight: '700' },

    listContent: { padding: 15 },
    itemContainer: { flexDirection: 'row', marginBottom: 15, alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, padding: 8 },
    imageContainer: { position: 'relative' },
    itemImage: { width: 80, height: 80, borderRadius: 6, backgroundColor: '#f0f0f0' },
    outOfStockBadge: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
    outOfStockText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    itemInfo: { flex: 1, marginLeft: 12 },
    itemTitle: { fontSize: 14, color: '#333', marginBottom: 6, lineHeight: 20 },
    itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#038D63', marginBottom: 2 },
    stockText: { fontSize: 11, color: '#d32f2f' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    center: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#999', fontSize: 16, marginTop: 10, marginBottom: 20 },
    popularTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
    popularContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 30, justifyContent: 'center' },
    popularChip: { backgroundColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    popularChipText: { color: '#666', fontSize: 13, fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    sortText: { fontSize: 16, color: '#333' },
});

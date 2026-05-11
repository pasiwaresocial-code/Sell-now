import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput,
    FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { getImageUrl } from '@/src/utils/api';

/* ---------- Helpers ---------- */
const getCategoryImage = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('popular')) return { isStar: true };
    if (n.includes('men')) return { img: 'https://rukminim2.flixcart.com/image/612/612/xif0q/shirt/i/i/s/-original-imaghg5z5z5z5z5z.jpeg?q=70' };
    if (n.includes('women') || n.includes('kurti') || n.includes('saree'))
        return { img: 'https://rukminim2.flixcart.com/image/612/612/kzvlua80/sari/7/s/l/free-kds-215-kupinda-unstitched-original-imagbsg5z5z5z5z5.jpeg?q=70' };
    if (n.includes('kid') || n.includes('toy'))
        return { img: 'https://rukminim2.flixcart.com/image/612/612/k2z1t3k0/toy-weapon/c/v/9/guns-blaster-dart-bullets-storm-soft-bullet-gun-toy-for-boys-original-imafm5f6p736a55z.jpeg?q=70' };
    if (n.includes('mobile') || n.includes('electronic'))
        return { img: 'https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/h/d/9/-original-imagtc2qzgnnuhxh.jpeg?q=70' };

    return { img: undefined };
};

/* ---------- Types ---------- */
interface SubCategory {
    _id: string;
    name: string;
    image?: string;
}

interface Category {
    _id: string;
    name: string;
    image?: string;
    subcategories: SubCategory[];
}

/* ---------- Category Section Component ---------- */
const CategorySection = React.memo(({ category, isActive, onVisible }: { category: Category, isActive: boolean, onVisible?: () => void }) => {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const { data } = await api.get('/products', {
                    params: { category: category._id, limit: 6 } // Fetch 6 as requested
                });
                setProducts(data.products || []);
            } catch (error) {
                console.log(`Error loading products for ${category.name}`);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, [category._id]);

    const getPrice = (prod: any) => {
        if (prod.displayPrice !== undefined && prod.displayPrice !== null && prod.displayPrice > 0) return prod.displayPrice;
        if (prod.basePrice) return prod.basePrice;
        if (prod.price) return prod.price;
        if (prod.variants && prod.variants.length > 0) return prod.variants[0].price;
        return 0;
    };

    return (
        <View style={styles.categorySectionContainer}>
            {/* Header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{category.name}</Text>
                <TouchableOpacity onPress={() => router.push({
                    pathname: '/category-products',
                    params: { categoryId: category._id, categoryName: category.name }
                } as any)}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>

            {/* Subcategories (Only show for first few or if active to save space? Showing all for now) */}
            {category.subcategories.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {category.subcategories.map(sub => (
                        <TouchableOpacity
                            key={sub._id}
                            style={styles.subCardHorizontal}
                            onPress={() => router.push({
                                pathname: '/category-products',
                                params: { categoryId: category._id, categoryName: category.name, subcategory: sub.name }
                            } as any)}
                        >
                            <View style={styles.subImgContainerSmall}>
                                <Image source={{ uri: getImageUrl(sub.image) || 'https://via.placeholder.com/50' }} style={styles.subImgSmall} />
                            </View>
                            <Text style={styles.subTextSmall} numberOfLines={1}>{sub.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Products Grid */}
            {loading ? (
                <ActivityIndicator size="small" color="#FF6600" style={{ height: 100 }} />
            ) : products.length > 0 ? (
                <View style={styles.grid}>
                    {products.map((prod) => {
                        const isRefurbished = prod.condition && prod.condition.toLowerCase() !== 'new';
                        const conditionText = prod.condition ? prod.condition.charAt(0).toUpperCase() + prod.condition.slice(1) : '';

                        return (
                            <TouchableOpacity
                                key={prod._id}
                                style={styles.productCardGrid}
                                onPress={() => router.push(`/product/${prod._id}` as any)}
                            >
                                <View style={{ position: 'relative' }}>
                                    <Image source={{ uri: getImageUrl(prod.images?.[0]) || undefined }} style={styles.productThumbGrid} />
                                    {isRefurbished && (
                                        <View style={styles.refurbishedBadge}>
                                            <Text style={styles.refurbishedText}>REFURBISHED</Text>
                                            <Text style={styles.conditionText}>{conditionText}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productTitle} numberOfLines={2}>{prod.title}</Text>
                                    <Text style={styles.productPrice}>₹{getPrice(prod)}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : (
                <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No products found</Text>
            )}
            <View style={styles.divider} />
        </View>
    );
});

/* ---------- Screen ---------- */
export default function ExploreScreen() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Ref for sidebar and content synchronization
    const flatListRef = React.useRef<FlatList>(null);
    const sidebarRef = React.useRef<ScrollView>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await api.get('/categories');
            setCategories(response.data || []);
            if (response.data && response.data.length > 0) {
                setActiveId(response.data[0]._id);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSidebarClick = (id: string, index: number) => {
        setActiveId(id);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    // Viewable Items Changed for Two-way sync
    const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            // Get the first visible item
            const firstVisible = viewableItems[0];
            if (firstVisible && firstVisible.item._id !== activeId) {
                setActiveId(firstVisible.item._id);
                // Optional: Scroll sidebar to match
            }
        }
    }).current;

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 50
    }).current;


    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#FF6600" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Explore</Text>
                <TouchableOpacity style={styles.headerSearchIcon} onPress={() => router.push('/search-results' as any)}>
                    <Ionicons name="search" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <View style={styles.body}>
                {/* Sidebar */}
                <View style={styles.sidebarContainer}>
                    <ScrollView
                        ref={sidebarRef}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.sidebarContent}
                    >
                        {categories.map((cat, index) => {
                            const visual = getCategoryImage(cat.name);
                            const active = activeId === cat._id;
                            const displayImg = getImageUrl(cat.image) || visual.img;

                            return (
                                <TouchableOpacity
                                    key={cat._id}
                                    style={[styles.sideCard, active && styles.sideCardActive]}
                                    onPress={() => handleSidebarClick(cat._id, index)}
                                >
                                    <View style={[styles.sideIcon, active && styles.sideIconActive]}>
                                        {visual.isStar ? (
                                            <Ionicons name="star" size={20} color="#FFC107" />
                                        ) : (
                                            <Image
                                                source={{ uri: displayImg || 'https://via.placeholder.com/100?text=Cat' }}
                                                style={styles.sideImg}
                                            />
                                        )}
                                    </View>
                                    <Text style={[styles.sideText, active && styles.sideTextActive]} numberOfLines={2}>
                                        {cat.name}
                                    </Text>
                                    {active && <View style={styles.activeIndicator} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Main Content - Vertical List of All Categories */}
                <View style={styles.mainContent}>
                    <FlatList
                        ref={flatListRef}
                        data={categories}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <CategorySection
                                category={item}
                                isActive={activeId === item._id}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                    />
                </View>
            </View>
        </View>
    );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        elevation: 2
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', letterSpacing: 0.5 },
    headerSearchIcon: { padding: 5 },

    body: { flex: 1, flexDirection: 'row' },

    // Sidebar
    sidebarContainer: { width: 85, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#f0f0f0' },
    sidebarContent: { paddingBottom: 20 },
    sideCard: { alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'transparent', position: 'relative' },
    sideCardActive: { backgroundColor: '#fff' },
    sideIcon: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
    sideIconActive: { borderColor: '#FF6600', backgroundColor: '#FFF5EB' },
    sideImg: { width: '100%', height: '100%' },
    sideText: { fontSize: 11, color: '#666', textAlign: 'center', paddingHorizontal: 4 },
    sideTextActive: { color: '#FF6600', fontWeight: 'bold' },
    activeIndicator: { position: 'absolute', left: 0, top: 15, bottom: 15, width: 4, backgroundColor: '#FF6600', borderTopRightRadius: 4, borderBottomRightRadius: 4 },

    // Main Content
    mainContent: { flex: 1, backgroundColor: '#f8f9fa' },
    categorySectionContainer: { padding: 15, backgroundColor: '#fff', marginBottom: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    seeAll: { fontSize: 13, color: '#FF6600', fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#eee', marginTop: 15 },

    // New Subcategory Styles
    subCardHorizontal: { marginRight: 15, alignItems: 'center', width: 60 },
    subImgContainerSmall: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f9f9f9', marginBottom: 5, overflow: 'hidden' },
    subImgSmall: { width: '100%', height: '100%' },
    subTextSmall: { fontSize: 10, color: '#666', textAlign: 'center' },

    // Product Cards (Grid)
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 6 }, // Reduced gap to fit 3 columns
    productCardGrid: { width: '30%', backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, padding: 5, elevation: 2, borderWidth: 1, borderColor: '#eee' }, // 30% width
    productThumbGrid: { width: '100%', height: 90, borderRadius: 6, marginBottom: 6, resizeMode: 'cover', backgroundColor: '#f0f0f0' }, // Smaller height for 3-col
    productInfo: {},
    productTitle: { fontSize: 11, fontWeight: '500', color: '#333', marginBottom: 2, height: 28, lineHeight: 14 }, // Smaller font for dense grid
    productPrice: { fontSize: 13, fontWeight: 'bold', color: '#038D63' },


    emptyState: { alignItems: 'center', padding: 20 },
    emptyText: { color: '#999', marginTop: 10, fontSize: 14 },
    refurbishedBadge: {
        position: 'absolute',
        top: 5,
        left: 5,
        backgroundColor: 'rgba(255, 152, 0, 0.95)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 3,
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    refurbishedText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    conditionText: {
        color: '#fff',
        fontSize: 7,
        marginTop: 1,
    },
});

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Switch,
    Share,
    Linking,
    Alert,
    Dimensions, Pressable, FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import api, { BASE_URL, getImageUrl } from '@/src/utils/api';
import { useCartStore } from '@/src/store/cartStore';
import { useWishlistStore } from '@/src/store/wishlistStore';
import ReviewsList from '@/components/ReviewsList';

const { width, height } = Dimensions.get('window');

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCartStore();
    const { toggleWishlist, isInWishlist } = useWishlistStore();

    // Selection State

    const [selectedSize, setSelectedSize] = useState<string>('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Share State
    const [showShareModal, setShowShareModal] = useState(false);
    const [isResellingShare, setIsResellingShare] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await api.get(`/products/${id}`);
                setProduct(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProduct();
    }, [id]);

    // Derived State for Dynamic Pricing (Hoisted)
    const activeVariant = React.useMemo(() => {
        if (!product || !product.hasVariants || !selectedSize) return null;
        return product.variants.find((v: any) =>
            (v.attributes?.Size === selectedSize) ||
            (v.attributes?.size === selectedSize) ||
            Object.values(v.attributes || {}).includes(selectedSize)
        );
    }, [product, selectedSize]);

    const displayPrice = activeVariant ? activeVariant.price : (product?.displayPrice || product?.price || 0);


    // Calculate effective stock:
    // 1. If variant is selected, show its specific stock.
    // 2. If no variant selected but product has variants, sum all variant stocks.
    // 3. Otherwise, use base product stock.
    const displayStock = React.useMemo(() => {
        if (activeVariant) return activeVariant.stock;
        if (product?.hasVariants && product.variants) {
            return product.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
        }
        return product?.stock || 0;
    }, [product, activeVariant]);

    // Real Pricing Logic
    const mrp = product?.mrp || 0;
    const hasDiscount = mrp > displayPrice;
    const discountPercent = hasDiscount ? Math.floor(((mrp - displayPrice) / mrp) * 100) : 0;

    // Real Rating Logic
    const rating = product?.averageRating || 0;
    const ratingCount = product?.totalReviews || 0;

    // Delivery Logic
    const shippingCost = product?.shippingCost !== undefined ? product.shippingCost : 40;
    const isFreeDelivery = shippingCost === 0;

    const availableSizes = React.useMemo(() => {
        if (!product) return [];
        if (product.hasVariants && product.variants?.length > 0) {
            const sizes = new Set<string>();
            product.variants.forEach((v: any) => {
                if (v.attributes?.Size) sizes.add(v.attributes.Size);
                else if (v.attributes?.size) sizes.add(v.attributes.size);
                else if (v.attributes) {
                    const val = Object.values(v.attributes)[0] as string;
                    if (val) sizes.add(val);
                }
            });
            return Array.from(sizes);
        }
        return ['S', 'M', 'L', 'XL', 'XXL'];
    }, [product]);



    const handleBuyNow = () => {
        if (!selectedSize) {
            Alert.alert('Select Size', 'Please select a size to continue');
            return;
        }
        confirmProcess(true);
    };

    const confirmProcess = (isBuyNow: boolean) => {
        if (!product) return;

        // Use displayPrice (variant price) instead of product.price
        const finalPrice = displayPrice;

        const item = {
            id: product._id,
            title: product.title,
            price: finalPrice,
            image: product.images[0],
            quantity: 1,
            sellerId: product.seller,
            size: selectedSize,
            stock: displayStock,
            shippingCost: product.shippingCost !== undefined ? product.shippingCost : 40,
        };

        if (isBuyNow) {
            useCartStore.getState().setBuyNowItem(item);
            router.push({ pathname: '/review', params: { mode: 'buy_now' } } as any);
        } else {
            addToCart(item);
            Alert.alert('Success', 'Item added to cart successfully!');
        }
    };

    const handleShare = async (platform: 'whatsapp' | 'telegram' | 'other') => {
        try {
            const productUrl = `https://sellnow.app/product/${id}`;
            const message = `Hey! Check out this amazing product on SellNow:\n\n${product.title}\n\n💰 Price: ₹${product.price}\n\n${productUrl}`;

            switch (platform) {
                case 'whatsapp':
                    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
                    await Linking.openURL(whatsappUrl);
                    break;

                case 'telegram':
                    const telegramUrl = `tg://msg?text=${encodeURIComponent(message)}`;
                    await Linking.openURL(telegramUrl);
                    break;

                case 'other':
                    await Share.share({
                        message: message,
                        title: product.title,
                    });
                    break;

                default:
                    Alert.alert('Coming Soon', `${platform} sharing will be available soon!`);
            }

            setShowShareModal(false);
            Alert.alert('Success', 'Product shared successfully!');
        } catch (error: any) {
            console.error('Share Error:', error);
            if (error.message?.includes('Unable to open URL')) {
                Alert.alert('App Not Installed', `Please install ${platform} to share.`);
            } else {
                Alert.alert('Error', 'Could not share the product. Please try again.');
            }
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 100 }} />;
    if (!product) return <View style={styles.center}><Text>Product not found</Text></View>;
    // Rendering Product Details



    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/' as any)}><Ionicons name="search" size={24} color="#333" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/cart' as any)}><Ionicons name="cart-outline" size={24} color="#333" /></TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Image Section - Carousel */}
                <View style={styles.imageContainer}>
                    <FlatList
                        data={product.images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_: string, index: number) => index.toString()}
                        onMomentumScrollEnd={(ev: any) => {
                            const newIndex = Math.round(ev.nativeEvent.contentOffset.x / width);
                            setCurrentImageIndex(newIndex);
                        }}
                        renderItem={({ item }: { item: string }) => (
                            <Image
                                source={{ uri: getImageUrl(item) || undefined }}
                                style={{ width: width, height: 400, resizeMode: 'cover' }}
                            />
                        )}
                    />
                    <View style={styles.imageCounter}>
                        <Text style={styles.counterText}>{currentImageIndex + 1}/{product.images.length}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.wishlistBtn}
                        onPress={() => toggleWishlist(id as string, product)}
                    >
                        <Ionicons
                            name={isInWishlist(id as string) ? "heart" : "heart-outline"}
                            size={24}
                            color={isInWishlist(id as string) ? "#FF0000" : "#666"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Details Section */}
                <View style={styles.detailsContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{product.title}</Text>
                        <TouchableOpacity style={styles.shareIcon} onPress={() => setShowShareModal(true)}>
                            <Ionicons name="share-social-outline" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>₹{displayPrice}</Text>
                        {hasDiscount && (
                            <>
                                <Text style={styles.mrp}>₹{mrp}</Text>
                                <Text style={styles.discount}>{discountPercent}% off</Text>
                            </>
                        )}
                        {displayStock <= 0 && (
                            <Text style={{ color: 'red', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }}>Out of Stock</Text>
                        )}
                    </View>

                    {rating > 0 && (
                        <View style={styles.ratingBadge}>
                            <Text style={styles.ratingText}>{rating}</Text>
                            <FontAwesome name="star" size={10} color="#fff" style={{ marginLeft: 3 }} />
                            <Text style={styles.ratingCount}> ({ratingCount} Ratings)</Text>
                        </View>
                    )}

                    <View style={styles.tagContainer}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>
                                {isFreeDelivery ? 'Free Delivery' : `Delivery: ₹${shippingCost}`}
                            </Text>
                        </View>
                        <View style={[styles.tag, { marginLeft: 8, backgroundColor: '#FFF5EC' }]}>
                            <Text style={[styles.tagText, { color: '#FF6600' }]}>
                                {product.returnPolicy === 'no_return'
                                    ? 'No Returns'
                                    : `${product.returnWindow || 7} Days ${product.returnPolicy === 'replacement' ? 'Replacement' : 'Return'}`}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Size Selection (Inline) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Size</Text>
                    <View style={styles.sizeOptions}>
                        {availableSizes.map(size => (
                            <TouchableOpacity
                                key={size}
                                style={[styles.sizeOption, selectedSize === size && styles.selectedSizeOption]}
                                onPress={() => setSelectedSize(size)}
                            >
                                <Text style={[styles.sizeOptionText, selectedSize === size && styles.selectedSizeOptionText]}>{size}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {!selectedSize && <Text style={styles.selectSizePrompt}>Please select a size to continue</Text>}
                </View>

                {/* Resell Share Section */}
                <TouchableOpacity style={styles.shareBanner} onPress={() => setShowShareModal(true)}>
                    <View style={styles.shareLeft}>
                        <FontAwesome name="whatsapp" size={24} color="#fff" />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.shareTitle}>Share on WhatsApp</Text>
                            <Text style={styles.shareSubtitle}>Earn margin on every sale</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>

                {/* Product Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Product Details</Text>

                    {/* Condition Badge */}
                    <View style={styles.conditionRow}>
                        <Text style={styles.detailLabel}>Condition:</Text>
                        <View style={[styles.conditionBadge, product.condition?.includes('Refurbished') ? styles.refurbishedBadge : styles.newBadge]}>
                            <Text style={[styles.conditionText, product.condition?.includes('Refurbished') ? styles.refurbishedText : styles.newText]}>
                                {product.condition || 'New'}
                            </Text>
                        </View>
                    </View>

                    {/* Custom Attributes Grid */}
                    {product.attributes && Object.keys(product.attributes).length > 0 && (
                        <View style={styles.attributesGrid}>
                            {Object.entries(product.attributes).map(([key, value]) => (
                                <View key={key} style={styles.attributeItem}>
                                    <Text style={styles.attrLabel}>{key}</Text>
                                    <Text style={styles.attrValue}>{String(value)}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text style={styles.description}>{product.description}</Text>

                    <View style={styles.sellerRow}>
                        {product.seller?.profile_image ? (
                            <Image
                                source={{ uri: getImageUrl(product.seller.profile_image) || undefined }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {product.seller?.name ? product.seller.name.charAt(0).toUpperCase() : 'S'}
                                </Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.sellerName}>{product.seller?.name || 'Seller'}</Text>
                            <Text style={styles.location}>Verified Seller</Text>
                        </View>
                    </View>
                </View>

                {/* Reviews & Ratings */}
                <View style={styles.section}>
                    <View style={styles.reviewsHeader}>
                        <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
                        <TouchableOpacity
                            onPress={() => router.push(`/write-review?productId=${product._id}` as any)}
                        >
                            <Text style={styles.writeReviewBtn}>Write Review</Text>
                        </TouchableOpacity>
                    </View>
                    <ReviewsList productId={product._id} />
                </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.btn, styles.chatBtn, displayStock <= 0 && { backgroundColor: '#ccc', borderColor: '#ccc' }]}
                    onPress={() => {
                        if (!selectedSize) {
                            Alert.alert('Select Size', 'Please select a size to continue');
                            return;
                        }
                        confirmProcess(false);
                    }}
                    disabled={displayStock <= 0}
                >
                    <Ionicons name="cart-outline" size={20} color={displayStock <= 0 ? '#999' : '#FF6600'} />
                    <Text style={[styles.chatBtnText, displayStock <= 0 && { color: '#999' }]}>
                        {displayStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.btn, styles.buyBtn, displayStock <= 0 && { backgroundColor: '#ccc' }]}
                    onPress={handleBuyNow}
                    disabled={displayStock <= 0}
                >
                    <Text style={styles.buyBtnText}>{displayStock <= 0 ? 'Out of Stock' : 'Place Order'}</Text>
                </TouchableOpacity>
            </View>



            {/* Share Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showShareModal}
                onRequestClose={() => setShowShareModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, styles.shareModalContent]}>
                        <View style={styles.shareHeader}>
                            <TouchableOpacity onPress={() => setShowShareModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.shareHeaderTitle}>SHARE</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <View style={styles.shareProductRow}>
                            <Image source={{ uri: product.images[0] }} style={styles.shareThumb} />
                            <Text style={styles.shareProductTitle}>{product.title}</Text>
                        </View>

                        <Text style={styles.shareOptionTitle}>Choose an option to share</Text>

                        <View style={styles.socialGrid}>
                            <TouchableOpacity style={styles.socialItem} onPress={() => handleShare('whatsapp')}>
                                <View style={[styles.socialIcon, { backgroundColor: '#25D366' }]}>
                                    <FontAwesome name="whatsapp" size={24} color="#fff" />
                                </View>
                                <Text style={styles.socialLabel}>WhatsApp</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialItem} onPress={() => handleShare('telegram')}>
                                <View style={[styles.socialIcon, { backgroundColor: '#0088cc' }]}>
                                    <FontAwesome name="telegram" size={24} color="#fff" />
                                </View>
                                <Text style={styles.socialLabel}>Telegram</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialItem} onPress={() => handleShare('other')}>
                                <View style={[styles.socialIcon, { backgroundColor: '#eee' }]}>
                                    <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
                                </View>
                                <Text style={styles.socialLabel}>Others</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.downloadBtn}>
                            <Ionicons name="download-outline" size={20} color="#333" />
                            <Text style={styles.downloadText}>Download Photos</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerRight: { flexDirection: 'row', gap: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 100 },
    imageContainer: { width: '100%', height: 400, backgroundColor: '#fff', position: 'relative' },
    productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    imageCounter: { position: 'absolute', bottom: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    counterText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    wishlistBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: '#fff', padding: 10, borderRadius: 30, elevation: 5 },
    detailsContainer: { backgroundColor: '#fff', padding: 15, marginBottom: 8 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    title: { fontSize: 18, color: '#333', flex: 1, lineHeight: 24 },
    shareIcon: { marginLeft: 10 },
    priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
    price: { fontSize: 24, fontWeight: 'bold', color: '#333', marginRight: 10 },
    mrp: { fontSize: 16, color: '#999', textDecorationLine: 'line-through', marginRight: 10 },
    discount: { fontSize: 16, color: '#038D63', fontWeight: 'bold' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#038D63', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 15, alignSelf: 'flex-start', marginBottom: 12 },
    ratingText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginRight: 2 },
    ratingCount: { color: '#fff', fontSize: 12, marginLeft: 5 },
    tagContainer: { flexDirection: 'row' },
    tag: { backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    tagText: { fontSize: 12, color: '#666' },
    shareBanner: { backgroundColor: '#25D366', padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    shareLeft: { flexDirection: 'row', alignItems: 'center' },
    shareTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    shareSubtitle: { color: '#fff', fontSize: 12 },
    section: { backgroundColor: '#fff', padding: 15, marginBottom: 8 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    sizeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    selectedSizeText: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    selectSizePrompt: { fontSize: 14, color: '#FF6600', marginBottom: 5 },
    description: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 20 },
    sellerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF6600', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    sellerName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    location: { fontSize: 12, color: '#999' },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    writeReviewBtn: {
        fontSize: 14,
        color: '#FF6600',
        fontWeight: '600'
    },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
    btn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
    chatBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', marginRight: 10, flexDirection: 'row', gap: 8 },
    chatBtnText: { color: '#333', fontWeight: '600' },
    buyBtn: { backgroundColor: '#FF6600' },
    buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: height * 0.9 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    sizeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
    sizeOption: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
    selectedSizeOption: { borderColor: '#FF6600', backgroundColor: '#FFF5EB' },
    sizeOptionText: { fontSize: 14, color: '#333' },
    selectedSizeOptionText: { color: '#FF6600', fontWeight: 'bold' },
    sizeGuideText: { fontSize: 12, color: '#25D366', fontWeight: 'bold', marginBottom: 20, marginLeft: 2 },
    returnSection: { marginBottom: 25 },
    returnTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    policyOption: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 15, marginBottom: 10 },
    selectedPolicy: { borderColor: '#AFE1AF', backgroundColor: '#F0FFF4' },
    policyRow: { flexDirection: 'row', alignItems: 'flex-start' },
    radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#999', marginRight: 15, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#038D63' },
    policyInfo: { flex: 1 },
    policyName: { fontSize: 14, color: '#333', marginBottom: 4 },
    policyPrice: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    discountTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#038D63', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    discountTagText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
    modalAddBtn: { backgroundColor: '#9F2089', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
    modalAddBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Share Modal Specific
    shareModalContent: { maxHeight: height * 0.8 },
    shareHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    shareHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    shareProductRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 8 },
    shareThumb: { width: 50, height: 50, resizeMode: 'cover', borderRadius: 4, marginRight: 10 },
    shareProductTitle: { flex: 1, fontSize: 14, color: '#333' },
    resellToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    resellToggleLabel: { fontSize: 14, color: '#333', fontWeight: 'bold' },
    switchContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    switchText: { fontSize: 12, color: '#999', fontWeight: 'bold' },
    switchActiveText: { color: '#9F2089' },
    shareOptionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    socialGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 20, marginBottom: 30 },
    socialItem: { alignItems: 'center', width: '25%' },
    socialIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
    socialLabel: { fontSize: 12, color: '#333' },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#eee' },
    downloadText: { fontSize: 16, color: '#333', fontWeight: 'bold' },



    // New Styles for Attributes & Condition
    conditionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    detailLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginRight: 10 },
    conditionBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    newBadge: { backgroundColor: '#E3F2FD' },
    refurbishedBadge: { backgroundColor: '#FFF3E0' },
    conditionText: { fontSize: 12, fontWeight: 'bold' },
    newText: { color: '#1976D2' },
    refurbishedText: { color: '#FF9800' },
    attributesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 10 },
    attributeItem: { width: '48%', backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#EEE' },
    attrLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
    attrValue: { fontSize: 14, color: '#333', fontWeight: '500' },

});

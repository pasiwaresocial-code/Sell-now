import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, RefreshControl, TextInput, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

import api, { BASE_URL, getImageUrl } from '@/src/utils/api';
import { useWishlistStore } from '../../src/store/wishlistStore';
import { useCartStore } from '../../src/store/cartStore';


const { width } = Dimensions.get('window');

interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  basePrice?: number;
  hasVariants?: boolean;
  variants?: { price: number; stock: number }[];
  mrp?: number;
  averageRating?: number;
  totalReviews?: number;
  condition?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { items: cartItems } = useCartStore();

  // Filter States
  const [sortBy, setSortBy] = useState('newest'); // newest, price_asc, price_desc
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // UI States
  const [showSortModal, setShowSortModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const fetchData = async () => {
    try {
      setError('');
      // Build query params
      const params: any = {};
      if (sortBy !== 'newest') params.sort = sortBy;
      if (selectedCategory) params.category = selectedCategory;

      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products', { params }),
        api.get('/categories')
      ]);

      console.log('📦 Products Fetched:', productsRes.data.products?.length);
      console.log('📂 Categories Fetched:', categoriesRes.data?.length);
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data || []);
    } catch (error: any) {
      console.error('Fetch Data Error:', error);
      setError('Failed to load data. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    fetchData();
  }, [sortBy, selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderProduct = ({ item }: { item: Product }) => {
    // Calculate effective price (lowest variant price or base price)
    let effectivePrice = item.price;
    if (item.hasVariants && item.variants && item.variants.length > 0) {
      const variantPrices = item.variants.map(v => v.price).filter(p => p > 0);
      if (variantPrices.length > 0) {
        effectivePrice = Math.min(...variantPrices);
      }
    }
    // Fallback to basePrice if price is missing
    if ((!effectivePrice || effectivePrice === 0) && item.basePrice) {
      effectivePrice = item.basePrice;
    }
    const price = effectivePrice || 0;

    // Calculate effective stock (sum of variants or base stock)
    let effectiveStock = item.stock || 0;
    if (item.hasVariants && item.variants && item.variants.length > 0) {
      effectiveStock = item.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    }
    const isOutOfStock = effectiveStock <= 0;

    // Real Data Logic
    const mrp = item.mrp || 0;
    const discount = (mrp > price) ? Math.floor(((mrp - price) / mrp) * 100) : 0;
    const rating = item.averageRating ? item.averageRating.toFixed(1) : null;
    const ratingCount = item.totalReviews || 0;

    // Check if refurbished (condition is not 'new')
    const isRefurbished = item.condition && item.condition.toLowerCase() !== 'new';
    const conditionText = item.condition ? item.condition.charAt(0).toUpperCase() + item.condition.slice(1) : '';

    return (
      <TouchableOpacity
        style={[styles.productCard, isOutOfStock && { opacity: 0.8 }]}
        onPress={() => router.push(`/product/${item._id}` as any)}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: getImageUrl(item.images[0]) || undefined }} style={styles.productImage} />
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          {isRefurbished && (
            <View style={styles.refurbishedBadge}>
              <Text style={styles.refurbishedText}>Refurbished</Text>
              <Text style={styles.conditionText}>{conditionText}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.heartIcon} onPress={() => toggleWishlist(item._id, item)}>
            <Ionicons
              name={isInWishlist(item._id) ? "heart" : "heart-outline"}
              size={20}
              color={isInWishlist(item._id) ? "#E53935" : "#666"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₹{price.toLocaleString()}</Text>
            {discount > 0 && <Text style={styles.mrpText}>₹{mrp}</Text>}
            {discount > 0 && <Text style={styles.discountText}>{discount}% off</Text>}
          </View>

          <View style={styles.deliveryBadge}>
            <Text style={styles.deliveryText}>Free Delivery</Text>
          </View>

          {rating && (
            <View style={styles.ratingContainer}>
              <View style={styles.ratingPill}>
                <Text style={styles.ratingText}>{rating}</Text>
                <FontAwesome name="star" size={10} color="#fff" style={{ marginLeft: 3 }} />
              </View>
              <Text style={styles.ratingCount}>({ratingCount})</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header & Search */}
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Image
                source={{ uri: user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Guest'}&background=random` }}
                style={styles.avatarImg}
              />
            </View>
            <View>
              <Text style={styles.userName}>Hello{user ? ',' : ''}</Text>
              {user && <Text style={styles.userPhone}>{user.name}</Text>}
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/wishlist')}>
              <Ionicons name="heart-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/cart' as any)}>
              <View>
                <Ionicons name="cart-outline" size={24} color="#333" />
                {cartItems.length > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/search' as any)}>
          <Ionicons name="search" size={20} color="#999" />
          <Text style={styles.searchText}>Search by Keyword or Product ID</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingRight: 20 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat._id || cat.id}
              style={styles.categoryItem}
              onPress={() => router.push({
                pathname: '/category-products',
                params: { categoryId: cat._id || cat.id, categoryName: cat.name }
              } as any)}
            >
              <View style={styles.categoryCircle}>
                <Image source={{ uri: getImageUrl(cat.image) || undefined }} style={styles.catImage} />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <TouchableOpacity style={styles.filterItem} onPress={() => setShowSortModal(true)}>
            <MaterialIcons name="sort" size={16} color={sortBy !== 'newest' ? '#FF6600' : '#666'} />
            <Text style={[styles.filterText, sortBy !== 'newest' && { color: '#FF6600', fontWeight: 'bold' }]}>Sort</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterItem} onPress={() => setShowCategoryModal(true)}>
            <Text style={[styles.filterText, selectedCategory && { color: '#FF6600', fontWeight: 'bold' }]}>Category</Text>
            <Ionicons name="chevron-down" size={12} color={selectedCategory ? '#FF6600' : '#666'} />
          </TouchableOpacity>



          <TouchableOpacity style={styles.filterItem} onPress={() => {
            setSortBy('newest');
            setSelectedCategory(null);
          }}>
            <Ionicons name="filter-outline" size={16} color="#666" />
            <Text style={styles.filterText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Products Grid */}
        {error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchData} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {products.map(item => (
              <View key={item._id} style={{ width: '50%', padding: 4 }}>
                {renderProduct({ item })}
              </View>
            ))}
            {products.length === 0 && !loading && (
              <View style={styles.centerBox}>
                <Text>No products found</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>


      {/* Sort Modal */}
      {
        showSortModal && (
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSortModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sort By</Text>
              {['newest', 'price_asc', 'price_desc'].map(opt => (
                <TouchableOpacity key={opt} style={styles.modalOption} onPress={() => { setSortBy(opt); setShowSortModal(false); }}>
                  <Text style={[styles.modalOptionText, sortBy === opt && { color: '#FF6600', fontWeight: 'bold' }]}>
                    {opt === 'newest' ? 'Newest First' : opt === 'price_asc' ? 'Price: Low to High' : 'Price: High to Low'}
                  </Text>
                  {sortBy === opt && <Ionicons name="checkmark" size={20} color="#FF6600" />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        )
      }

      {/* Category Modal */}
      {
        showCategoryModal && (
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategoryModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity style={styles.modalOption} onPress={() => { setSelectedCategory(null); setShowCategoryModal(false); }}>
                <Text style={[styles.modalOptionText, !selectedCategory && { color: '#FF6600', fontWeight: 'bold' }]}>All Categories</Text>
                {!selectedCategory && <Ionicons name="checkmark" size={20} color="#FF6600" />}
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity key={cat._id} style={styles.modalOption} onPress={() => { setSelectedCategory(cat._id); setShowCategoryModal(false); }}>
                  <Text style={[styles.modalOptionText, selectedCategory === cat._id && { color: '#FF6600', fontWeight: 'bold' }]}>{cat.name}</Text>
                  {selectedCategory === cat._id && <Ionicons name="checkmark" size={20} color="#FF6600" />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        )
      }
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#FFE0B2',
    borderRadius: 20,
    marginRight: 10,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 12,
    color: '#333',
  },
  userPhone: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconBtn: {},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  searchText: {
    flex: 1, // Take remaining space
    color: '#999',
    marginLeft: 10,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categoryScroll: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingLeft: 15,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 60,
  },
  categoryCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    overflow: 'hidden',
  },
  catImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  categoryName: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 5,
  },
  filterItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    gap: 5,
  },
  filterText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    elevation: 2,
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 6,
  },
  mrpText: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  discountText: {
    fontSize: 12,
    color: '#228B22', // ForestGreen
    fontWeight: 'bold',
  },
  deliveryBadge: {
    backgroundColor: '#f5f5f5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  deliveryText: {
    fontSize: 10,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingPill: {
    backgroundColor: '#23BB75',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 5,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingCount: {
    fontSize: 11,
    color: '#999',
  },
  centerBox: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  retryBtn: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
  },
  retryText: {
    color: '#333',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  outOfStockText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    elevation: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6600',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  refurbishedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 152, 0, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  refurbishedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  conditionText: {
    color: '#fff',
    fontSize: 8,
    marginTop: 2,
  },
});

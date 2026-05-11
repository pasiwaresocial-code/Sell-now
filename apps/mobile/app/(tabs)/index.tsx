import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import api from '@/src/utils/api';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState({
    revenue: 0,
    activeListings: 0,
    pendingOrders: 0,
    totalSales: 0
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchStats = async () => {
    try {
      const { data: stats } = await api.get('/analytics/seller');
      // Correctly map the nested stats object to our state structure
      setStatsData({
        revenue: stats.overview.totalRevenue,
        activeListings: stats.overview.activeListings,
        pendingOrders: stats.ordersByStatus.pending,
        totalSales: stats.overview.totalOrders
      });

      const { data: orders } = await api.get('/orders/seller'); // Fetch all for now, ideally backend should support pagination/limit
      setRecentOrders(orders.slice(0, 5)); // Take top 5 recent
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setRefreshing(false);
    }

  };

  useFocusEffect(
    useCallback(() => {
      if (user) fetchStats();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };
  const stats = [
    { label: 'Total Revenue', value: `₹${(statsData.revenue || 0).toLocaleString()}`, icon: 'wallet', color: '#34C759' },
    { label: 'Active Listings', value: (statsData.activeListings || 0).toString(), icon: 'cube', color: '#007AFF' },
    { label: 'Pending Orders', value: (statsData.pendingOrders || 0).toString(), icon: 'time', color: '#FF9500' },
    { label: 'Total Sales', value: (statsData.totalSales || 0).toString(), icon: 'trending-up', color: '#5856D6' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.username}>{user?.name || 'Seller'}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: stat.color + '20' }]}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/add-product')}>
          <View style={[styles.actionIcon, { backgroundColor: '#FF6600' }]}>
            <Ionicons name="add" size={28} color="#fff" />
          </View>
          <Text style={styles.actionText}>Add Product</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/orders')}>
          <View style={[styles.actionIcon, { backgroundColor: '#333' }]}>
            <Ionicons name="scan-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.actionText}>Scan Order</Text>
        </TouchableOpacity>

      </View>

      {/* Recent Activity Placeholder */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentOrders.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Ionicons name="document-text-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        ) : (
          <View>
            {recentOrders.map((order) => (
              <TouchableOpacity
                key={order._id}
                style={styles.recentItem}
                onPress={() => router.push(`/order/${order._id}` as any)}
              >
                <View style={[styles.recentIcon, { backgroundColor: order.orderStatus === 'completed' ? '#E8F5E9' : '#FFF3E0' }]}>
                  <Ionicons
                    name={order.orderStatus === 'completed' ? 'checkmark-circle' : 'time'}
                    size={24}
                    color={order.orderStatus === 'completed' ? '#34C759' : '#FF9500'}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.recentTitle}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.recentSubtitle}>{new Date(order.createdAt).toDateString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.recentPrice}>₹{order.pricing.total}</Text>
                  <Text style={[styles.recentStatus, { color: order.orderStatus === 'pending' ? '#FF9500' : '#333' }]}>
                    {order.orderStatus.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  actionBtn: {
    alignItems: 'center',
    width: '30%',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  recentSection: {
    marginTop: 30,
    paddingBottom: 40,
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  recentSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  recentPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  recentStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  }
});

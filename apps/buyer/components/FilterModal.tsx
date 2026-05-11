import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface FilterProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: any) => void;
    currentFilters: any;
}

export default function FilterModal({ visible, onClose, onApply, currentFilters }: FilterProps) {
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });

    const [selectedCondition, setSelectedCondition] = useState<string>('');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [minRating, setMinRating] = useState(0);

    // Sample brands - in real app, fetch from API


    useEffect(() => {
        if (currentFilters) {
            setPriceRange({
                min: currentFilters.minPrice || 0,
                max: currentFilters.maxPrice || 10000
            });

            setSelectedCondition(currentFilters.condition || '');
            setInStockOnly(currentFilters.inStock || false);
            setMinRating(currentFilters.minRating || 0);
        }
    }, [currentFilters]);



    const handleApply = () => {
        onApply({
            minPrice: priceRange.min,
            maxPrice: priceRange.max,

            condition: selectedCondition,
            inStock: inStockOnly,
            minRating: minRating
        });
        onClose();
    };

    const handleClear = () => {
        setPriceRange({ min: 0, max: 10000 });

        setSelectedCondition('');
        setInStockOnly(false);
        setMinRating(0);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Filters</Text>
                    <TouchableOpacity onPress={handleClear}>
                        <Text style={styles.clearText}>Clear All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {/* Price Range */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Price Range</Text>
                        <View style={styles.priceInputs}>
                            <View style={styles.priceInput}>
                                <Text style={styles.inputLabel}>Min</Text>
                                <TextInput
                                    style={styles.input}
                                    value={priceRange.min.toString()}
                                    onChangeText={(text) => setPriceRange({ ...priceRange, min: Number(text) || 0 })}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                            <Text style={styles.priceSeparator}>to</Text>
                            <View style={styles.priceInput}>
                                <Text style={styles.inputLabel}>Max</Text>
                                <TextInput
                                    style={styles.input}
                                    value={priceRange.max.toString()}
                                    onChangeText={(text) => setPriceRange({ ...priceRange, max: Number(text) || 10000 })}
                                    keyboardType="numeric"
                                    placeholder="10000"
                                />
                            </View>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={10000}
                            step={100}
                            value={priceRange.max}
                            onValueChange={(value) => setPriceRange({ ...priceRange, max: value })}
                            minimumTrackTintColor="#FF6600"
                            maximumTrackTintColor="#ddd"
                            thumbTintColor="#FF6600"
                        />
                    </View>



                    {/* Condition */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Condition</Text>
                        <View style={styles.conditionRow}>
                            {['New', 'Refurbished'].map(cond => (
                                <TouchableOpacity
                                    key={cond}
                                    style={[
                                        styles.conditionBtn,
                                        selectedCondition === cond && styles.conditionBtnActive
                                    ]}
                                    onPress={() => setSelectedCondition(selectedCondition === cond ? '' : cond)}
                                >
                                    <Text style={[
                                        styles.conditionText,
                                        selectedCondition === cond && styles.conditionTextActive
                                    ]}>
                                        {cond}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Rating */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Customer Rating</Text>
                        <View style={styles.ratingRow}>
                            {[4, 3, 2, 1].map(rating => (
                                <TouchableOpacity
                                    key={rating}
                                    style={[
                                        styles.ratingBtn,
                                        minRating === rating && styles.ratingBtnActive
                                    ]}
                                    onPress={() => setMinRating(minRating === rating ? 0 : rating)}
                                >
                                    <Text style={[
                                        styles.ratingText,
                                        minRating === rating && styles.ratingTextActive
                                    ]}>
                                        {rating}★ & above
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Stock */}
                    <TouchableOpacity
                        style={styles.stockToggle}
                        onPress={() => setInStockOnly(!inStockOnly)}
                    >
                        <Text style={styles.stockText}>In Stock Only</Text>
                        <View style={[styles.checkbox, inStockOnly && styles.checkboxActive]}>
                            {inStockOnly && <Ionicons name="checkmark" size={16} color="#fff" />}
                        </View>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                        <Text style={styles.applyBtnText}>Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    clearText: { color: '#FF6600', fontSize: 14, fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#333' },

    priceInputs: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    priceInput: { flex: 1 },
    inputLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16 },
    priceSeparator: { marginHorizontal: 10, color: '#999' },
    slider: { width: '100%', height: 40 },

    brandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    brandChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f9f9f9' },
    brandChipActive: { backgroundColor: '#FF6600', borderColor: '#FF6600' },
    brandText: { fontSize: 14, color: '#333' },
    brandTextActive: { color: '#fff', fontWeight: '600' },

    conditionRow: { flexDirection: 'row', gap: 10 },
    conditionBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f9f9f9', alignItems: 'center' },
    conditionBtnActive: { backgroundColor: '#FF6600', borderColor: '#FF6600' },
    conditionText: { fontSize: 14, color: '#333' },
    conditionTextActive: { color: '#fff', fontWeight: '600' },

    ratingRow: { gap: 10 },
    ratingBtn: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f9f9f9', alignItems: 'center' },
    ratingBtnActive: { backgroundColor: '#FF6600', borderColor: '#FF6600' },
    ratingText: { fontSize: 14, color: '#333' },
    ratingTextActive: { color: '#fff', fontWeight: '600' },

    stockToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f9f9f9' },
    stockText: { fontSize: 15, color: '#333' },
    checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: '#FF6600', borderColor: '#FF6600' },

    footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
    applyBtn: { backgroundColor: '#FF6600', padding: 16, borderRadius: 8, alignItems: 'center' },
    applyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

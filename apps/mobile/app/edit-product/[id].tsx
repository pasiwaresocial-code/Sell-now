import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/utils/api';

interface Subcategory {
    _id: string;
    name: string;
}

interface Category {
    _id: string;
    name: string;
    subcategories: Subcategory[];
}

export default function EditProductScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Data Sources
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // Form State
    const [images, setImages] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [basePrice, setBasePrice] = useState('');
    const [mrp, setMrp] = useState('');
    const [stock, setStock] = useState('');
    const [shippingCost, setShippingCost] = useState('40');
    const [description, setDescription] = useState('');

    // Condition
    const [condition, setCondition] = useState<'New' | 'Refurbished'>('New');
    const [grade, setGrade] = useState('Excellent');

    // Custom Attributes
    const [customAttributes, setCustomAttributes] = useState<{ name: string; value: string }[]>([]);

    // Variants State
    const [hasVariants, setHasVariants] = useState(false);
    const [variantTypes, setVariantTypes] = useState<{ name: string; options: string[] }[]>([]);
    const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);
    const [tempOptionInputs, setTempOptionInputs] = useState<{ [key: number]: string }>({});

    // Bulk Price Tools
    const [bulkStartPrice, setBulkStartPrice] = useState('');
    const [bulkIncrement, setBulkIncrement] = useState('50');

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            // 1. Fetch Categories
            const catRes = await api.get('/categories');
            setCategories(catRes.data);

            // 2. Fetch Product Details
            const { data } = await api.get(`/products/${id}`);

            // Populate Form
            setTitle(data.title);
            setDescription(data.description || '');
            setImages(data.images || []);
            setShippingCost(data.shippingCost?.toString() || '40');

            // Prices
            setBasePrice(data.basePrice?.toString() || data.price?.toString() || '');
            setMrp(data.mrp?.toString() || '');
            setStock(data.stock?.toString() || '');

            // Category & Subcategory
            const catId = typeof data.category === 'object' ? data.category._id : data.category;
            setCategoryId(catId);
            setSubcategory(data.subcategory || '');

            // Find selected category object for subcategory logic
            if (catId) {
                const foundCat = catRes.data.find((c: Category) => c._id === catId);
                setSelectedCategory(foundCat || null);
            }

            // Condition Parsing
            if (data.condition && data.condition.startsWith('Refurbished')) {
                setCondition('Refurbished');
                const match = data.condition.match(/Refurbished - (.+)/);
                if (match) setGrade(match[1]);
            } else {
                setCondition(data.condition || 'New');
            }

            // Custom Attributes Parsing
            if (data.attributes) {
                const attrs = Object.entries(data.attributes).map(([name, value]) => ({
                    name,
                    value: value as string
                }));
                setCustomAttributes(attrs);
            }

            // Variants Parsing
            setHasVariants(!!data.hasVariants);
            if (data.hasVariants) {
                // Restore Variant Types (Configuration)
                if (data.variantConfig && data.variantConfig.attributes) {
                    setVariantTypes(data.variantConfig.attributes.map((attr: any) => ({
                        name: attr.name,
                        options: attr.values
                    })));
                }

                // Restore Generated Variants
                if (data.variants) {
                    setGeneratedVariants(data.variants.map((v: any) => ({
                        attributes: v.attributes,
                        price: v.price.toString(),
                        stock: v.stock.toString(),
                        sku: v.sku
                    })));
                }
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to load product details');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (id: string) => {
        const cat = categories.find(c => c._id === id);
        setSelectedCategory(cat || null);
        setCategoryId(id);
        setSubcategory('');
    };

    // --- Image Handling ---
    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8,
        });

        if (!result.canceled) {
            const uris = result.assets.map(a => a.uri);
            setImages([...images, ...uris]);
        }
    };

    // --- Custom Attributes Logic ---
    const addCustomAttribute = () => setCustomAttributes([...customAttributes, { name: '', value: '' }]);
    const updateCustomAttribute = (index: number, field: 'name' | 'value', value: string) => {
        const updated = [...customAttributes];
        updated[index][field] = value;
        setCustomAttributes(updated);
    };
    const removeCustomAttribute = (index: number) => setCustomAttributes(customAttributes.filter((_, i) => i !== index));

    // --- Variant Logic ---
    const addVariantType = () => setVariantTypes([...variantTypes, { name: '', options: [] }]);
    const updateVariantTypeName = (index: number, name: string) => {
        const updated = [...variantTypes];
        updated[index].name = name;
        setVariantTypes(updated);
    };
    const removeVariantType = (index: number) => setVariantTypes(variantTypes.filter((_, i) => i !== index));

    const addVariantOption = (typeIndex: number, option: string) => {
        if (!option.trim()) return;
        const updated = [...variantTypes];
        if (!updated[typeIndex].options.includes(option)) {
            updated[typeIndex].options.push(option);
            setVariantTypes(updated);
        }
    };
    const removeVariantOption = (typeIndex: number, optionIndex: number) => {
        const updated = [...variantTypes];
        updated[typeIndex].options.splice(optionIndex, 1);
        setVariantTypes(updated);
    };

    const generateVariants = () => {
        if (variantTypes.length === 0 || variantTypes.some(vt => vt.options.length === 0)) {
            Alert.alert('Error', 'Please add at least one variant type with options');
            return;
        }

        const cartesian = (...arrays: any[]): any[] => {
            return arrays.reduce((acc: any[], arr: any[]) => {
                return acc.flatMap((x: any[]) => arr.map((y: any) => [...x, y]));
            }, [[]]);
        };

        const optionArrays = variantTypes.map(vt =>
            vt.options.map(opt => ({ [vt.name]: opt }))
        );

        const combinations = cartesian(...optionArrays);
        const variants = combinations.map((combo, idx) => {
            const attrs: any = {};
            combo.forEach((item: any) => Object.assign(attrs, item));
            return {
                attributes: attrs,
                price: basePrice || '0',
                stock: '0',
                sku: `VAR-${Date.now()}-${idx}`
            };
        });

        setGeneratedVariants(variants);
        Alert.alert('Success', `${variants.length} variants generated!`);
    };

    const updateVariantField = (index: number, field: string, value: string) => {
        const updated = [...generatedVariants];
        updated[index][field] = value;
        setGeneratedVariants(updated);
    };

    const applyBulkPrices = () => {
        if (!bulkStartPrice || !bulkIncrement) {
            Alert.alert('Missing Info', 'Please enter start price and increment');
            return;
        }
        const start = Number(bulkStartPrice);
        const inc = Number(bulkIncrement);
        if (isNaN(start) || isNaN(inc)) {
            Alert.alert('Invalid', 'Please enter valid numbers');
            return;
        }
        const updated = generatedVariants.map((variant, idx) => ({
            ...variant,
            price: (start + (idx * inc)).toString()
        }));
        setGeneratedVariants(updated);
        Alert.alert('Success!', `Set prices from ₹${start} with +₹${inc} increment`);
    };

    // --- Update Handler ---
    const handleUpdate = async () => {
        if (!title || !categoryId || images.length === 0) {
            Alert.alert('Missing Info', 'Please fill: Title, Category, and add at least 1 image');
            return;
        }
        if (!hasVariants && !basePrice) {
            Alert.alert('Missing Price', 'Please enter product price');
            return;
        }
        if (hasVariants && generatedVariants.length === 0) {
            Alert.alert('Missing Variants', 'Please generate variants or switch to Simple mode');
            return;
        }
        if (!hasVariants && !stock) {
            Alert.alert('Missing Stock', 'Please enter stock quantity');
            return;
        }

        setUpdating(true);

        try {
            // 1. Upload NEW images (maintain existing URLs)
            const finalImages: string[] = [];
            const newImagesToUpload: string[] = [];

            images.forEach(img => {
                if (img.startsWith('file://')) {
                    newImagesToUpload.push(img);
                } else {
                    finalImages.push(img);
                }
            });

            if (newImagesToUpload.length > 0) {
                const formData = new FormData();
                newImagesToUpload.forEach((uri) => {
                    const filename = uri.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename || '');
                    const type = match ? `image/${match[1]}` : 'image/jpeg';
                    // @ts-ignore
                    formData.append('images', { uri, name: filename, type });
                });

                const uploadRes = await api.post('/upload/multiple', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalImages.push(...uploadRes.data);
            }

            // 2. Prepare Attributes
            const attrs: any = {};
            customAttributes.forEach(attr => {
                if (attr.name.trim() && attr.value.trim()) {
                    attrs[attr.name] = attr.value;
                }
            });

            // 3. Prepare Variants
            const variantsData = hasVariants ? generatedVariants.map(v => ({
                attributes: v.attributes,
                price: Number(v.price),
                stock: Number(v.stock),
                sku: v.sku
            })) : [];

            const variantConfig = hasVariants ? {
                enabled: true,
                attributes: variantTypes.map(vt => ({
                    name: vt.name,
                    values: vt.options
                }))
            } : { enabled: false, attributes: [] };

            // 4. Determine Condition
            let finalCondition = condition;
            if (condition === 'Refurbished') {
                finalCondition = `Refurbished - ${grade}` as any;
            }

            // 5. Send Update
            await api.put(`/products/${id}`, {
                title,
                basePrice: Number(basePrice),
                description,
                condition: finalCondition,
                category: categoryId,
                subcategory: subcategory || undefined,
                images: finalImages,
                attributes: attrs,
                hasVariants,
                variantConfig,
                variants: variantsData,
                stock: !hasVariants ? Number(stock) : undefined,
                shippingCost: Number(shippingCost) || 40,
                mrp: mrp ? Number(mrp) : undefined
            });

            Alert.alert('Success', 'Product updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error: any) {
            console.error('Update error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update product');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF6600" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Product</Text>
                <TouchableOpacity onPress={handleUpdate} disabled={updating}>
                    {updating ? (
                        <ActivityIndicator color="#FF6600" />
                    ) : (
                        <Text style={styles.saveBtn}>SAVE</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Images */}
                <Text style={styles.sectionTitle}>Photos *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                    <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                        <Ionicons name="camera" size={32} color="#FF6600" />
                        <Text style={styles.addImageText}>Add</Text>
                    </TouchableOpacity>
                    {images.map((uri, idx) => (
                        <View key={idx} style={styles.imagePreview}>
                            <Image source={{ uri }} style={styles.imageThumb} />
                            <TouchableOpacity
                                style={styles.removeImageBtn}
                                onPress={() => setImages(images.filter((_, i) => i !== idx))}
                            >
                                <Ionicons name="close-circle" size={20} color="red" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                {/* Title */}
                <Text style={styles.label}>Title *</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Product Name"
                />

                {/* Category */}
                <Text style={styles.label}>Category *</Text>
                <View style={styles.pickerBox}>
                    <Picker
                        selectedValue={categoryId}
                        onValueChange={handleCategoryChange}
                        style={{ color: categoryId ? '#333' : '#999' }}
                    >
                        <Picker.Item label="Select category" value="" color="#999" />
                        {categories.map(c => (
                            <Picker.Item key={c._id} label={c.name} value={c._id} color="#333" />
                        ))}
                    </Picker>
                </View>

                {/* Subcategory */}
                {selectedCategory && selectedCategory.subcategories.length > 0 && (
                    <>
                        <Text style={styles.label}>Subcategory</Text>
                        <View style={styles.pickerBox}>
                            <Picker
                                selectedValue={subcategory}
                                onValueChange={setSubcategory}
                                style={{ color: subcategory ? '#333' : '#999' }}
                            >
                                <Picker.Item label="Select (optional)" value="" color="#999" />
                                {selectedCategory.subcategories.map(sc => (
                                    <Picker.Item key={sc._id} label={sc.name} value={sc.name} color="#333" />
                                ))}
                            </Picker>
                        </View>
                    </>
                )}

                {/* Product Type Toggle */}
                <Text style={styles.sectionTitle}>Product Type</Text>
                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, !hasVariants && styles.toggleActive]}
                        onPress={() => {
                            // If switching to simple, we warn or just let them do it (clears variants on save)
                            setHasVariants(false);
                        }}
                    >
                        <Text style={[styles.toggleText, !hasVariants && styles.toggleTextActive]}>Simple</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, hasVariants && styles.toggleActive]}
                        onPress={() => setHasVariants(true)}
                    >
                        <Text style={[styles.toggleText, hasVariants && styles.toggleTextActive]}>Variants</Text>
                    </TouchableOpacity>
                </View>

                {/* Variants UI */}
                {hasVariants && (
                    <View style={styles.variantsSection}>
                        <Text style={styles.subTitle}>Configure Variants</Text>
                        <Text style={styles.hint}>e.g., Size: S, M, L or Color: Red, Blue</Text>

                        {variantTypes.map((vt, vtIdx) => (
                            <View key={vtIdx} style={styles.variantTypeBox}>
                                <View style={styles.variantTypeHeader}>
                                    <TextInput
                                        style={styles.variantTypeName}
                                        placeholder="Type Name"
                                        value={vt.name}
                                        onChangeText={(t) => updateVariantTypeName(vtIdx, t)}
                                    />
                                    <TouchableOpacity onPress={() => removeVariantType(vtIdx)}>
                                        <Ionicons name="trash" size={20} color="red" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.optionsWrap}>
                                    {vt.options.map((opt, optIdx) => (
                                        <View key={optIdx} style={styles.optionChip}>
                                            <Text style={styles.optionText}>{opt}</Text>
                                            <TouchableOpacity onPress={() => removeVariantOption(vtIdx, optIdx)}>
                                                <Ionicons name="close-circle" size={14} color="#666" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder={`Add value...`}
                                        value={tempOptionInputs[vtIdx] || ''}
                                        onChangeText={(t) => setTempOptionInputs({ ...tempOptionInputs, [vtIdx]: t })}
                                        onSubmitEditing={() => {
                                            const text = tempOptionInputs[vtIdx];
                                            if (text?.trim()) {
                                                addVariantOption(vtIdx, text.trim());
                                                setTempOptionInputs({ ...tempOptionInputs, [vtIdx]: '' });
                                            }
                                        }}
                                    />
                                    <TouchableOpacity
                                        style={styles.addOptionBtn}
                                        onPress={() => {
                                            const text = tempOptionInputs[vtIdx];
                                            if (text?.trim()) {
                                                addVariantOption(vtIdx, text.trim());
                                                setTempOptionInputs({ ...tempOptionInputs, [vtIdx]: '' });
                                            }
                                        }}
                                    >
                                        <Ionicons name="add-circle" size={32} color="#FF6600" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity style={styles.addBtn} onPress={addVariantType}>
                            <Ionicons name="add-circle-outline" size={20} color="#FF6600" />
                            <Text style={styles.addBtnText}>Add Variant Type</Text>
                        </TouchableOpacity>

                        {variantTypes.length > 0 && (
                            <TouchableOpacity style={styles.generateBtn} onPress={generateVariants}>
                                <Text style={styles.generateBtnText}>RE-GENERATE VARIANTS</Text>
                            </TouchableOpacity>
                        )}

                        {/* Quick Price */}
                        {generatedVariants.length > 0 && (
                            <View style={styles.quickPriceBox}>
                                <Text style={styles.subTitle}>⚡ Quick Price</Text>
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 5 }}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Start Price"
                                        keyboardType="numeric"
                                        value={bulkStartPrice}
                                        onChangeText={setBulkStartPrice}
                                    />
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Inc."
                                        keyboardType="numeric"
                                        value={bulkIncrement}
                                        onChangeText={setBulkIncrement}
                                    />
                                </View>
                                <TouchableOpacity style={styles.applyPriceBtn} onPress={applyBulkPrices}>
                                    <Text style={styles.applyPriceBtnText}>Apply</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Generated List */}
                        {generatedVariants.length > 0 && (
                            <View style={styles.generatedSection}>
                                <Text style={styles.subTitle}>Variants ({generatedVariants.length})</Text>
                                {generatedVariants.map((v, idx) => (
                                    <View key={idx} style={styles.variantCard}>
                                        <Text style={styles.variantName}>
                                            {Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(', ')}
                                        </Text>
                                        <View style={styles.variantInputs}>
                                            <TextInput
                                                style={[styles.input, { flex: 1, marginRight: 8 }]}
                                                placeholder="Price"
                                                keyboardType="numeric"
                                                value={v.price}
                                                onChangeText={(t) => updateVariantField(idx, 'price', t)}
                                            />
                                            <TextInput
                                                style={[styles.input, { flex: 1 }]}
                                                placeholder="Stock"
                                                keyboardType="numeric"
                                                value={v.stock}
                                                onChangeText={(t) => updateVariantField(idx, 'stock', t)}
                                            />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Base Price & MRP */}
                <Text style={styles.label}>
                    {hasVariants ? 'Base Price (₹) - Used as default' : 'Price (₹) *'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Selling Price"
                        keyboardType="numeric"
                        value={basePrice}
                        onChangeText={setBasePrice}
                    />
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="MRP (Optional)"
                        keyboardType="numeric"
                        value={mrp}
                        onChangeText={setMrp}
                    />
                </View>

                {/* Stock (Simple Only) */}
                {!hasVariants && (
                    <>
                        <Text style={styles.label}>Stock *</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={stock}
                            onChangeText={setStock}
                        />
                    </>
                )}

                {/* Shipping */}
                <Text style={styles.sectionTitle}>Shipping (₹)</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={shippingCost}
                    onChangeText={setShippingCost}
                />

                {/* Condition */}
                <Text style={styles.sectionTitle}>Condition</Text>
                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, condition === 'New' && styles.toggleActive]}
                        onPress={() => setCondition('New')}
                    >
                        <Text style={[styles.toggleText, condition === 'New' && styles.toggleTextActive]}>New</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, condition === 'Refurbished' && styles.toggleActive]}
                        onPress={() => setCondition('Refurbished')}
                    >
                        <Text style={[styles.toggleText, condition === 'Refurbished' && styles.toggleTextActive]}>Refurbished</Text>
                    </TouchableOpacity>
                </View>

                {condition === 'Refurbished' && (
                    <View style={styles.gradeRow}>
                        {['Like New', 'Excellent', 'Good', 'Fair'].map(g => (
                            <TouchableOpacity
                                key={g}
                                style={[styles.gradeChip, grade === g && styles.gradeChipActive]}
                                onPress={() => setGrade(g)}
                            >
                                <Text style={[styles.gradeText, grade === g && styles.gradeTextActive]}>{g}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Custom Attributes */}
                <Text style={styles.sectionTitle}>Custom Attributes</Text>
                {customAttributes.map((attr, idx) => (
                    <View key={idx} style={styles.attrRow}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                            placeholder="Name"
                            value={attr.name}
                            onChangeText={(t) => updateCustomAttribute(idx, 'name', t)}
                        />
                        <TextInput
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                            placeholder="Value"
                            value={attr.value}
                            onChangeText={(t) => updateCustomAttribute(idx, 'value', t)}
                        />
                        <TouchableOpacity onPress={() => removeCustomAttribute(idx)}>
                            <Ionicons name="trash" size={20} color="red" />
                        </TouchableOpacity>
                    </View>
                ))}
                <TouchableOpacity style={styles.addBtn} onPress={addCustomAttribute}>
                    <Ionicons name="add-circle-outline" size={20} color="#0066cc" />
                    <Text style={[styles.addBtnText, { color: '#0066cc' }]}>Add Attribute</Text>
                </TouchableOpacity>

                {/* Description */}
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                />

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    saveBtn: { color: '#FF6600', fontSize: 16, fontWeight: 'bold' },
    content: { padding: 16 },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 8, color: '#333' },
    subTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: '#333' },
    label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 6, color: '#333' },
    hint: { fontSize: 12, color: '#999', marginBottom: 10 },

    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#fff' },
    textArea: { height: 100, textAlignVertical: 'top' },
    pickerBox: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff', overflow: 'hidden' },

    imageScroll: { marginBottom: 20 },
    addImageBtn: { width: 80, height: 80, borderWidth: 2, borderColor: '#FF6600', borderStyle: 'dashed', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    addImageText: { color: '#FF6600', fontSize: 12, marginTop: 4, fontWeight: '600' },
    imagePreview: { position: 'relative', marginRight: 10 },
    imageThumb: { width: 80, height: 80, borderRadius: 8 },
    removeImageBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 10 },

    toggleRow: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 4, marginBottom: 15 },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
    toggleActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    toggleText: { fontSize: 15, color: '#666' },
    toggleTextActive: { color: '#000', fontWeight: 'bold' },

    gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    gradeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5' },
    gradeChipActive: { backgroundColor: '#FF6600' },
    gradeText: { fontSize: 13, color: '#666' },
    gradeTextActive: { color: '#fff', fontWeight: '600' },

    variantsSection: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 15 },
    variantTypeBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
    variantTypeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    variantTypeName: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, marginRight: 10, fontSize: 14 },
    optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    optionChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
    optionText: { color: '#1976d2', fontSize: 13, fontWeight: '500' },

    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, borderStyle: 'dashed', marginTop: 10 },
    addBtnText: { color: '#FF6600', fontSize: 14, fontWeight: '600', marginLeft: 6 },
    addOptionBtn: { padding: 4 },

    generateBtn: { backgroundColor: '#FF6600', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 15 },
    generateBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

    quickPriceBox: {
        backgroundColor: '#FFF5EC',
        padding: 15,
        borderRadius: 10,
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#FFD9B3',
    },
    applyPriceBtn: {
        backgroundColor: '#0066cc',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    applyPriceBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },

    generatedSection: { marginTop: 20 },
    variantCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e0e0e0' },
    variantName: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
    variantInputs: { flexDirection: 'row' },

    attrRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
});

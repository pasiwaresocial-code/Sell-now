import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderTree, FolderPlus } from 'lucide-react';
import api from '../utils/api';

interface Subcategory {
    _id: string;
    name: string;
    image?: string;
}

interface Category {
    _id: string;
    name: string;
    image?: string;
    subcategories: Subcategory[];
}

export default function Categories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [subcategoryName, setSubcategoryName] = useState('');
    const [categoryImage, setCategoryImage] = useState('');
    const [subcategoryImage, setSubCategoryImage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'category' | 'subcategory') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('images', file);

        try {
            // Note: Endpoint expects 'images' key and returns array of URLs
            const { data } = await api.post('/upload/multiple', formData);
            // data is array of urls
            if (type === 'category') setCategoryImage(data[0]);
            else setSubCategoryImage(data[0]);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Image upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateCategory = async () => {
        try {
            await api.post('/categories', { name: categoryName, image: categoryImage });
            setCategoryName('');
            setCategoryImage('');
            setShowCategoryModal(false);
            fetchCategories();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error creating category');
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory) return;
        try {
            await api.put(`/categories/${editingCategory._id}`, { name: categoryName, image: categoryImage });
            setCategoryName('');
            setCategoryImage('');
            setEditingCategory(null);
            setShowCategoryModal(false);
            fetchCategories();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error updating category');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error deleting category');
        }
    };

    const handleAddSubcategory = async () => {
        if (!selectedCategory) return;
        try {
            await api.post(`/categories/${selectedCategory._id}/subcategories`, { name: subcategoryName, image: subcategoryImage });
            setSubcategoryName('');
            setSubCategoryImage('');
            setShowSubcategoryModal(false);
            setSelectedCategory(null);
            fetchCategories();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error adding subcategory');
        }
    };

    const handleUpdateSubcategory = async () => {
        if (!selectedCategory || !editingSubcategory) return;
        try {
            await api.put(`/categories/${selectedCategory._id}/subcategories/${editingSubcategory._id}`, { name: subcategoryName, image: subcategoryImage });
            setSubcategoryName('');
            setSubCategoryImage('');
            setEditingSubcategory(null);
            setShowSubcategoryModal(false);
            setSelectedCategory(null);
            fetchCategories();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error updating subcategory');
        }
    };

    const handleDeleteSubcategory = async (categoryId: string, subId: string) => {
        if (!confirm('Are you sure you want to delete this subcategory?')) return;
        try {
            await api.delete(`/categories/${categoryId}/subcategories/${subId}`);
            fetchCategories();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error deleting subcategory');
        }
    };

    const openEditCategory = (category: any) => {
        setEditingCategory(category);
        setCategoryName(category.name);
        setCategoryImage(category.image || '');
        setShowCategoryModal(true);
    };

    const openEditSubcategory = (category: Category, subcategory: any) => {
        setSelectedCategory(category);
        setEditingSubcategory(subcategory);
        setSubcategoryName(subcategory.name);
        setSubCategoryImage(subcategory.image || '');
        setShowSubcategoryModal(true);
    };

    const openAddSubcategory = (category: Category) => {
        setSelectedCategory(category);
        setEditingSubcategory(null);
        setSubcategoryName('');
        setSubCategoryImage('');
        setShowSubcategoryModal(true);
    };

    const openAddCategory = () => {
        setEditingCategory(null);
        setCategoryName('');
        setCategoryImage('');
        setShowCategoryModal(true);
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-500 mt-1">Manage product categories and subcategories</p>
                </div>
                <button
                    onClick={openAddCategory}
                    style={{ backgroundColor: '#FF6600', color: 'white' }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={20} />
                    Add Category
                </button>
            </div>

            <div className="grid gap-6">
                {categories.map((category: any) => (
                    <div key={category._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <FolderTree className="text-primary" size={24} />
                                {category.image && (
                                    <img src={category.image} alt={category.name} className="w-8 h-8 rounded object-cover" />
                                )}
                                <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openAddSubcategory(category)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                >
                                    <FolderPlus size={16} />
                                    Add Subcategory
                                </button>
                                <button
                                    onClick={() => openEditCategory(category)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteCategory(category._id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            {category.subcategories.length === 0 ? (
                                <p className="text-gray-400 text-sm italic">No subcategories yet</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {category.subcategories.map((sub: any) => (
                                        <div
                                            key={sub._id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {sub.image && (
                                                    <img src={sub.image} alt={sub.name} className="w-6 h-6 rounded object-cover" />
                                                )}
                                                <span className="text-sm font-medium text-gray-700">{sub.name}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEditSubcategory(category, sub)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSubcategory(category._id, sub._id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">
                            {editingCategory ? 'Edit Category' : 'Add Category'}
                        </h3>
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder="Category name"
                            autoFocus
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                        />

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category Image</label>
                            {categoryImage && (
                                <img src={categoryImage} alt="Preview" className="w-full h-32 object-contain mb-2 bg-gray-50 rounded" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'category')}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                            {uploading && <p className="text-sm text-blue-500 mt-1">Uploading...</p>}
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowCategoryModal(false);
                                    setEditingCategory(null);
                                    setCategoryName('');
                                    setCategoryImage('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                                style={{ backgroundColor: '#FF6600', color: 'white' }}
                                disabled={uploading}
                                className="px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {editingCategory ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Subcategory Modal */}
            {showSubcategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">
                            {editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
                        </h3>
                        <input
                            type="text"
                            value={subcategoryName}
                            onChange={(e) => setSubcategoryName(e.target.value)}
                            placeholder="Subcategory name"
                            autoFocus
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                        />

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory Image</label>
                            {subcategoryImage && (
                                <img src={subcategoryImage} alt="Preview" className="w-full h-32 object-contain mb-2 bg-gray-50 rounded" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'subcategory')}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                            {uploading && <p className="text-sm text-blue-500 mt-1">Uploading...</p>}
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowSubcategoryModal(false);
                                    setSelectedCategory(null);
                                    setEditingSubcategory(null);
                                    setSubcategoryName('');
                                    setSubCategoryImage('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={editingSubcategory ? handleUpdateSubcategory : handleAddSubcategory}
                                style={{ backgroundColor: '#FF6600', color: 'white' }}
                                disabled={uploading}
                                className="px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {editingSubcategory ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

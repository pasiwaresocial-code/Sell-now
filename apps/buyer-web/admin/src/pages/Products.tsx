import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Check, X, Package } from 'lucide-react';

export default function Products() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    // Helper to get full image URL
    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `https://demobackend.pasiware.cloud/${path.startsWith('/') ? path.slice(1) : path}`;
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products/admin');
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            // Optimistic update
            setProducts(products.map(p => p._id === id ? { ...p, status } : p));
            await api.put(`/products/${id}/status`, { status });
        } catch (error) {
            console.error('Failed to update status', error);
            fetchProducts(); // Revert on error
        }
    };

    const handleApprove = (id: string) => updateStatus(id, 'available');
    const handleReject = (id: string) => updateStatus(id, 'rejected');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-50 text-green-700 border-green-100';
            case 'pending_approval': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Products</h1>
                    <p className="text-gray-500 mt-1">Review and manage listings from all sellers.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Seller</th>
                            <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {products.map((product) => (
                            <tr
                                key={product._id}
                                className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                onClick={() => {
                                    setSelectedProduct(product);
                                    setShowModal(true);
                                }}
                            >
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                            {product.images && product.images[0] ? (
                                                <img src={getImageUrl(product.images[0])} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 line-clamp-1">{product.title}</div>
                                            <div className="text-sm text-gray-500 line-clamp-1">{product.category}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5 font-medium text-gray-900">₹{(product.displayPrice || product.price || 0).toLocaleString()}</td>
                                <td className="p-5 text-sm text-gray-600">{product.seller?.name || 'Unknown'}</td>
                                <td className="p-5">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(product.status)}`}>
                                        {product.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {product.status !== 'available' && (
                                            <button onClick={() => handleApprove(product._id)} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-lg transition-colors" title="Approve">
                                                <Check size={16} strokeWidth={2.5} />
                                            </button>
                                        )}
                                        {product.status !== 'rejected' && (
                                            <button onClick={() => handleReject(product._id)} className="p-2 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-colors" title="Reject">
                                                <X size={16} strokeWidth={2.5} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && products.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Package size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                    </div>
                )}
            </div>

            {/* Product Detail Modal */}
            {showModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Images */}
                            {selectedProduct.images && selectedProduct.images.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Images ({selectedProduct.images.length})</h3>
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {selectedProduct.images.map((img: string, idx: number) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt="Product"
                                                className="w-32 h-32 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Title</label>
                                    <p className="text-gray-900 font-semibold">{selectedProduct.title}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Category</label>
                                    <p className="text-gray-900">{selectedProduct.category?.name || selectedProduct.category}</p>
                                </div>
                                {selectedProduct.subcategory && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Subcategory</label>
                                        <p className="text-gray-900">{selectedProduct.subcategory}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Condition</label>
                                    <p className="text-gray-900">{selectedProduct.condition}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedProduct.status)}`}>
                                        {selectedProduct.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Seller</label>
                                    <p className="text-gray-900">{selectedProduct.seller?.name || 'Unknown'}</p>
                                </div>
                            </div>

                            {/* Price & Stock */}
                            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Price</label>
                                    <p className="text-2xl font-bold text-gray-900">₹{(selectedProduct.displayPrice || selectedProduct.price || 0).toLocaleString()}</p>
                                </div>
                                {!selectedProduct.hasVariants && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Stock</label>
                                        <p className="text-2xl font-bold text-gray-900">{selectedProduct.stock || 0}</p>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {selectedProduct.description && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Description</label>
                                    <p className="text-gray-700 mt-1">{selectedProduct.description}</p>
                                </div>
                            )}

                            {/* Variants */}
                            {selectedProduct.hasVariants && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Variants ({selectedProduct.variants.length})</h3>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {selectedProduct.variants.map((variant: any, idx: number) => (
                                            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {Object.entries(variant.attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                    </p>
                                                    {variant.sku && <p className="text-xs text-gray-500">SKU: {variant.sku}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">₹{variant.price?.toLocaleString()}</p>
                                                    <p className="text-sm text-gray-600">{variant.stock} in stock</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Custom Attributes */}
                            {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Custom Attributes</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(selectedProduct.attributes).map(([key, value]: [string, any]) => (
                                            <div key={key} className="bg-gray-50 rounded-lg p-3">
                                                <label className="text-xs font-medium text-gray-500 uppercase">{key}</label>
                                                <p className="text-gray-900 font-medium">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Metadata</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <label className="text-gray-500">Product ID</label>
                                        <p className="text-gray-900 font-mono">{selectedProduct._id}</p>
                                    </div>
                                    <div>
                                        <label className="text-gray-500">Created At</label>
                                        <p className="text-gray-900">{new Date(selectedProduct.createdAt).toLocaleString()}</p>
                                    </div>
                                    {selectedProduct.updatedAt && (
                                        <div>
                                            <label className="text-gray-500">Updated At</label>
                                            <p className="text-gray-900">{new Date(selectedProduct.updatedAt).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 flex gap-3">
                            {selectedProduct.status !== 'available' && (
                                <button
                                    onClick={() => {
                                        handleApprove(selectedProduct._id);
                                        setShowModal(false);
                                    }}
                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                >
                                    Approve Product
                                </button>
                            )}
                            {selectedProduct.status !== 'rejected' && (
                                <button
                                    onClick={() => {
                                        handleReject(selectedProduct._id);
                                        setShowModal(false);
                                    }}
                                    className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                                >
                                    Reject Product
                                </button>
                            )}
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

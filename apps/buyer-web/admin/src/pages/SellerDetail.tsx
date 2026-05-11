import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Package, ShoppingCart, DollarSign, TrendingUp, Calendar, Mail, Phone } from 'lucide-react';

const BASE_URL = 'https://demobackend.pasiware.cloud';

// Helper to format image URLs
const getImageUrl = (path: string) => {
    if (!path) return 'https://via.placeholder.com/150';

    // If it's already a full URL, replace any old IP addresses with localhost
    if (path.startsWith('http')) {
        // Replace any IP-based URLs with localhost
        return path.replace(/http:\/\/\d+\.\d+\.\d+\.\d+:5500/, BASE_URL);
    }

    // For relative paths, prepend BASE_URL
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function SellerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [seller, setSeller] = useState<any>(null);
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSellerDetails();
    }, [id]);

    const fetchSellerDetails = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/sellers/${id}/details`);
            setSeller(data.seller);
            setDetails(data);
        } catch (error) {
            console.error('Error fetching seller details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Loading seller details...</div>
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="p-8">
                <div className="text-center">
                    <p className="text-gray-500">Seller not found</p>
                    <button onClick={() => navigate('/sellers')} className="mt-4 text-blue-600 hover:underline">
                        Back to Sellers
                    </button>
                </div>
            </div>
        );
    }

    // Calculate stats
    const products = details?.recentProducts || [];
    const orders = details?.recentOrders || [];
    const totalProducts = products.length;
    const activeProducts = products.filter((p: any) => p.status === 'available').length;
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o: any) => o.orderStatus === 'delivered').length;
    const totalRevenue = orders
        .filter((o: any) => o.orderStatus === 'delivered')
        .reduce((sum: number, o: any) => sum + (o.pricing?.total || 0), 0);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/sellers')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-medium"
                >
                    <ArrowLeft size={20} />
                    Back to Sellers
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{seller.name}</h1>
                            <div className="flex items-center gap-4 mt-3 text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} />
                                    <span>{seller.email}</span>
                                </div>
                                {seller.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} />
                                        <span>{seller.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <span>Joined {new Date(seller.created_at || seller.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-green-50 px-4 py-2 rounded-lg">
                            <span className="text-green-700 font-semibold">Active</span>
                        </div>
                    </div>
                </div>
            </div>


            {/* Bank Details Card */}
            {
                seller.bankDetails && (
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Bank Details</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-500">Account Holder Name</p>
                                <p className="font-medium text-gray-900">{seller.bankDetails.accountName || 'Not Set'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Account Number</p>
                                <p className="font-medium text-gray-900">{seller.bankDetails.accountNumber || 'Not Set'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">IFSC Code</p>
                                <p className="font-medium text-gray-900">{seller.bankDetails.ifscCode || 'Not Set'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Bank Name</p>
                                <p className="font-medium text-gray-900">{seller.bankDetails.bankName || 'Not Set'}</p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Verification Documents */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Verification Documents</h2>
                <div className="mb-6">
                    <p className="text-sm text-gray-500">Aadhar Number</p>
                    <p className="text-lg font-mono font-bold text-gray-900">{seller.aadharNumber || 'Not Provided'}</p>
                </div>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Shop Photo</p>
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            {seller.shopPhoto ? (
                                <img src={getImageUrl(seller.shopPhoto)} alt="Shop" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Aadhar Front</p>
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            {seller.idProofFront ? (
                                <img src={getImageUrl(seller.idProofFront)} alt="Aadhar Front" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Aadhar Back</p>
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            {seller.idProofBack ? (
                                <img src={getImageUrl(seller.idProofBack)} alt="Aadhar Back" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Products</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{totalProducts}</p>
                            <p className="text-sm text-green-600 mt-1">{activeProducts} active</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{totalOrders}</p>
                            <p className="text-sm text-gray-600 mt-1">{completedOrders} completed</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <ShoppingCart className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">₹{totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Avg Order Value</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                ₹{totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : 0}
                            </p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Products */}
            {
                products.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="px-8 py-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">Recent Products</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                {products.map((product: any) => (
                                    <div key={product._id} className="bg-gray-50 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-100 transition-colors">
                                        {product.images?.[0] && (
                                            <img src={getImageUrl(product.images[0])} alt={product.title} className="w-16 h-16 object-cover rounded-lg" />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{product.title}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(product.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">
                                                ₹{(product.displayPrice || product.price || product.basePrice || 0).toLocaleString()}
                                            </p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${product.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {product.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Recent Orders */}
            {
                orders.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/80 border-b border-gray-100">
                                    <tr>
                                        <th className="p-5 text-left text-xs font-bold text-gray-600 uppercase">Order ID</th>
                                        <th className="p-5 text-left text-xs font-bold text-gray-600 uppercase">Buyer</th>
                                        <th className="p-5 text-left text-xs font-bold text-gray-600 uppercase">Product</th>
                                        <th className="p-5 text-left text-xs font-bold text-gray-600 uppercase">Amount</th>
                                        <th className="p-5 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                                        <th className="p-5 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {orders.map((order: any) => (
                                        <tr key={order._id} className="hover:bg-gray-50/50">
                                            <td className="p-5 font-mono text-sm">#{order.orderNumber || order._id.slice(-6).toUpperCase()}</td>
                                            <td className="p-5">{order.buyer?.name || 'Unknown'}</td>
                                            <td className="p-5">
                                                {order.items?.[0]?.title || order.items?.[0]?.product?.title || 'N/A'}
                                                {order.items?.length > 1 && <span className="text-xs text-gray-500 ml-1">(+{order.items.length - 1} more)</span>}
                                            </td>
                                            <td className="p-5 font-bold">₹{order.pricing?.total?.toLocaleString() || 0}</td>
                                            <td className="p-5">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                                                    order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {order.orderStatus}
                                                </span>
                                            </td>
                                            <td className="p-5 text-sm text-gray-600">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

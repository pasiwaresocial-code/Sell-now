import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://demobackend.pasiware.cloud/api';

interface Order {
    _id: string;
    orderNumber: string;
    buyer: { name: string; email: string; phone: string };
    seller: { name: string; email: string; phone: string; businessName?: string };
    items: Array<{
        product: { title: string; images: string[]; price: number; condition: string };
        title: string;
        price: number;
        quantity: number;
        size?: string;
    }>;
    pricing: {
        subtotal: number;
        deliveryCharge: number;
        discount: number;
        total: number;
    };
    deliveryAddress: {
        name: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        landmark?: string;
        city: string;
        state: string;
        pincode: string;
    };
    paymentMethod: {
        type: string;
        status: string;
    };
    orderStatus: string;
    statusHistory: Array<{
        status: string;
        timestamp: Date;
        note?: string;
    }>;
    returnRequest?: {
        isRequested: boolean;
        reason: string;
        status: string;
        rejectionReason?: string;
        requestedAt: Date;
    };
    expectedDelivery?: Date;
    actualDelivery?: Date;
    createdAt: Date;
    shiprocket?: {
        orderId: number;
        shipmentId: number;
        awbCode: string;
        courierName: string;
        trackingUrl: string;
        pickupScheduled: boolean;
    };
}

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchOrders();
    }, [currentPage]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/admin/orders?page=${currentPage}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(data.orders);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Fetch orders error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShipWithShiprocket = async () => {
        if (!selectedOrder) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            // Create Order
            await axios.post(`${API_URL}/shiprocket/create-order/${selectedOrder._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Order created in Shiprocket!');

            // Refresh
            const { data } = await axios.get(`${API_URL}/admin/orders/search?orderNumber=${selectedOrder.orderNumber}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedOrder(data);
            fetchOrders();
        } catch (error: any) {
            alert('Failed to create Shiprocket order: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAWB = async () => {
        if (!selectedOrder?.shiprocket?.shipmentId) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/shiprocket/generate-awb`, {
                shipmentId: selectedOrder.shiprocket.shipmentId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('AWB Generated!');

            // Refresh
            const { data } = await axios.get(`${API_URL}/admin/orders/search?orderNumber=${selectedOrder.orderNumber}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedOrder(data);
            fetchOrders();
        } catch (error: any) {
            alert('Failed to generate AWB: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPickup = async () => {
        if (!selectedOrder?.shiprocket?.shipmentId) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/shiprocket/pickup`, {
                shipmentId: selectedOrder.shiprocket.shipmentId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Pickup Scheduled!');

            // Refresh
            const { data } = await axios.get(`${API_URL}/admin/orders/search?orderNumber=${selectedOrder.orderNumber}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedOrder(data);
            fetchOrders();
        } catch (error: any) {
            alert('Failed to schedule pickup: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadLabel = async () => {
        if (!selectedOrder?.shiprocket?.shipmentId) return;
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${API_URL}/shiprocket/label`, {
                shipmentId: selectedOrder.shiprocket.shipmentId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.label_url) {
                window.open(data.label_url, '_blank');
            } else {
                alert('Label URL not found');
            }
        } catch (error: any) {
            alert('Failed to download label: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            fetchOrders();
            return;
        }

        try {
            setSearching(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/admin/orders/search?orderNumber=${searchQuery}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders([data]);
            setSelectedOrder(data);
        } catch (error: any) {
            if (error.response?.status === 404) {
                setOrders([]);
                alert('Order not found');
            }
        } finally {
            setSearching(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-orange-100 text-orange-800',
            confirmed: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            out_for_delivery: 'bg-pink-100 text-pink-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            returned: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                <p className="text-gray-600 mt-1">Search and manage all orders</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by order number (e.g., ORD000001)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={searching}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                fetchOrders();
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>

            {/* Orders Table */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading orders...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 text-lg">No orders found</p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.buyer.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.seller.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₹{order.pricing.total.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                                                {order.orderStatus.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="text-blue-600 hover:text-blue-900 font-medium"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!searchQuery && totalPages > 1 && (
                        <div className="mt-4 flex justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Order Number</p>
                                    <p className="text-lg font-semibold">{selectedOrder.orderNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Order Date</p>
                                    <p className="text-lg font-semibold">{formatDate(selectedOrder.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedOrder.orderStatus)}`}>
                                        {selectedOrder.orderStatus.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Payment Method</p>
                                    <p className="text-lg font-semibold">{selectedOrder.paymentMethod.type.toUpperCase()}</p>
                                    <p className="text-sm text-gray-600">Status: {selectedOrder.paymentMethod.status}</p>
                                </div>
                            </div>

                            {/* Buyer Info */}
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold mb-3">Buyer Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-medium">{selectedOrder.buyer.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{selectedOrder.buyer.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="font-medium">{selectedOrder.buyer.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Seller Info */}
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold mb-3">Seller Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-medium">{selectedOrder.seller.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{selectedOrder.seller.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="font-medium">{selectedOrder.seller.phone}</p>
                                    </div>
                                    {selectedOrder.seller.businessName && (
                                        <div>
                                            <p className="text-sm text-gray-500">Business Name</p>
                                            <p className="font-medium">{selectedOrder.seller.businessName}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold mb-3">Delivery Address</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="font-medium">{selectedOrder.deliveryAddress.name}</p>
                                    <p className="text-gray-700">{selectedOrder.deliveryAddress.addressLine1}</p>
                                    {selectedOrder.deliveryAddress.addressLine2 && <p className="text-gray-700">{selectedOrder.deliveryAddress.addressLine2}</p>}
                                    {selectedOrder.deliveryAddress.landmark && <p className="text-gray-700">Landmark: {selectedOrder.deliveryAddress.landmark}</p>}
                                    <p className="text-gray-700">{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} - {selectedOrder.deliveryAddress.pincode}</p>
                                    <p className="text-gray-700 mt-2">Phone: {selectedOrder.deliveryAddress.phone}</p>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold mb-3">Products</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                                            {item.product?.images?.[0] && (
                                                <img src={`https://demobackend.pasiware.cloud/${item.product.images[0]}`} alt={item.title} className="w-20 h-20 object-cover rounded" />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium">{item.title}</p>
                                                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                                {item.size && <p className="text-sm text-gray-600">Size: {item.size}</p>}
                                                {item.product?.condition && <p className="text-sm text-gray-600">Condition: {item.product.condition}</p>}
                                                <p className="text-sm font-semibold mt-1">₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold mb-3">Pricing Details</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">₹{selectedOrder.pricing.subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Delivery Charge</span>
                                        <span className="font-medium">₹{selectedOrder.pricing.deliveryCharge.toLocaleString()}</span>
                                    </div>
                                    {selectedOrder.pricing.discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span className="font-medium">-₹{selectedOrder.pricing.discount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Total</span>
                                        <span>₹{selectedOrder.pricing.total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shiprocket Delivery */}
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold mb-3">Delivery Partner (Shiprocket)</h3>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    {!selectedOrder.shiprocket?.orderId ? (
                                        <button
                                            onClick={handleShipWithShiprocket}
                                            disabled={loading || selectedOrder.orderStatus === 'cancelled' || selectedOrder.orderStatus === 'delivered'}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {loading ? 'Processing...' : 'Ship via Shiprocket'}
                                        </button>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="font-medium text-blue-900">Shiprocket Order ID: {selectedOrder.shiprocket.orderId}</p>

                                            {!selectedOrder.shiprocket.awbCode ? (
                                                <button
                                                    onClick={handleGenerateAWB}
                                                    disabled={loading}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                                                >
                                                    Generate AWB & Ship
                                                </button>
                                            ) : (
                                                <>
                                                    <div className="flex gap-4">
                                                        <p className="text-sm">AWB: <span className="font-bold">{selectedOrder.shiprocket.awbCode}</span></p>
                                                        <p className="text-sm">Courier: <span className="font-bold">{selectedOrder.shiprocket.courierName}</span></p>
                                                    </div>

                                                    {!selectedOrder.shiprocket.pickupScheduled && (
                                                        <button
                                                            onClick={handleRequestPickup}
                                                            disabled={loading}
                                                            className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                                        >
                                                            Request Pickup
                                                        </button>
                                                    )}

                                                    {selectedOrder.shiprocket.pickupScheduled && (
                                                        <p className="text-green-600 font-medium">Pickup Scheduled</p>
                                                    )}
                                                </>
                                            )}

                                            {selectedOrder.shiprocket.awbCode && (
                                                <button
                                                    onClick={handleDownloadLabel}
                                                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                                                >
                                                    Download Label
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status History */}
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold mb-3">Status History</h3>
                                <div className="space-y-3">
                                    {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 ? (
                                        selectedOrder.statusHistory.map((history, index) => (
                                            <div key={index} className="flex gap-3">
                                                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-600"></div>
                                                <div>
                                                    <p className="font-medium">{history.status ? history.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}</p>
                                                    <p className="text-sm text-gray-600">{formatDate(history.timestamp)}</p>
                                                    {history.note && <p className="text-sm text-gray-700 mt-1">{history.note}</p>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No status history available</p>
                                    )}
                                </div>
                            </div>

                            {/* Return Request */}
                            {selectedOrder.returnRequest?.isRequested && (
                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-semibold mb-3">Return Request</h3>
                                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                        <p className="font-medium">Status: <span className={`${selectedOrder.returnRequest.status === 'approved' ? 'text-green-600' : selectedOrder.returnRequest.status === 'rejected' ? 'text-red-600' : 'text-orange-600'}`}>{selectedOrder.returnRequest.status.toUpperCase()}</span></p>
                                        <p className="text-sm text-gray-700 mt-2">Buyer's Reason: {selectedOrder.returnRequest.reason}</p>
                                        <p className="text-sm text-gray-600">Requested: {formatDate(selectedOrder.returnRequest.requestedAt)}</p>
                                        {selectedOrder.returnRequest.rejectionReason && (
                                            <div className="mt-3 bg-red-50 p-3 rounded">
                                                <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                                                <p className="text-sm text-red-700">{selectedOrder.returnRequest.rejectionReason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

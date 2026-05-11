import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://demobackend.pasiware.cloud/api';

interface Seller {
    _id: string;
    name: string;
    email: string;
    phone: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    approvedAt?: Date;
    approvedBy?: { name: string; email: string };
    created_at: Date;
}

export default function SellerApproval() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        fetchSellers();
    }, [activeTab, statusFilter]);

    const fetchSellers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const endpoint = activeTab === 'pending'
                ? '/admin/sellers/pending'
                : `/admin/sellers/all${statusFilter ? `?status=${statusFilter}` : ''}`;

            const { data } = await axios.get(`${API_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSellers(data);
        } catch (error) {
            console.error('Fetch sellers error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (sellerId: string) => {
        if (!confirm('Are you sure you want to approve this seller?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/admin/sellers/${sellerId}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Seller approved successfully!');
            fetchSellers();
        } catch (error) {
            console.error('Approve seller error:', error);
            alert('Failed to approve seller');
        }
    };

    const handleRejectClick = (seller: Seller) => {
        setSelectedSeller(seller);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/admin/sellers/${selectedSeller?._id}/reject`,
                { rejectionReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Seller rejected successfully!');
            setRejectModalOpen(false);
            fetchSellers();
        } catch (error) {
            console.error('Reject seller error:', error);
            alert('Failed to reject seller');
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            pending: 'bg-orange-100 text-orange-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
                <h1 className="text-3xl font-bold text-gray-900">Seller Approvals</h1>
                <p className="text-gray-600 mt-1">Manage seller account approvals</p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="flex gap-4">
                    <button
                        onClick={() => { setActiveTab('pending'); setStatusFilter(''); }}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Pending Approvals
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        All Sellers
                    </button>
                </nav>
            </div>

            {/* Filter for All Sellers tab */}
            {activeTab === 'all' && (
                <div className="mb-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            )}

            {/* Sellers Table */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading sellers...</p>
                </div>
            ) : sellers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 text-lg">No sellers found</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                {activeTab === 'pending' && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sellers.map((seller) => (
                                <tr
                                    key={seller._id}
                                    onClick={() => navigate(`/sellers/${seller._id}`)}
                                    className="hover:bg-gray-50 cursor-pointer"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{seller.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{seller.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{seller.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(seller.created_at)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(seller.approvalStatus)}`}>
                                            {seller.approvalStatus.toUpperCase()}
                                        </span>
                                        {seller.approvalStatus === 'rejected' && seller.rejectionReason && (
                                            <p className="text-xs text-red-600 mt-1">Reason: {seller.rejectionReason}</p>
                                        )}
                                        {seller.approvalStatus === 'approved' && seller.approvedAt && (
                                            <p className="text-xs text-gray-500 mt-1">Approved: {formatDate(seller.approvedAt)}</p>
                                        )}
                                    </td>
                                    {activeTab === 'pending' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleApprove(seller._id)}
                                                className="text-green-600 hover:text-green-900 font-medium"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleRejectClick(seller)}
                                                className="text-red-600 hover:text-red-900 font-medium"
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setRejectModalOpen(false)}>
                    <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Seller</h2>
                        <p className="text-gray-600 mb-4">
                            You are about to reject <strong>{selectedSeller?.name}</strong>. Please provide a reason:
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            rows={4}
                            autoFocus
                        />
                        <div className="mt-4 flex gap-2 justify-end">
                            <button
                                onClick={() => setRejectModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Reject Seller
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

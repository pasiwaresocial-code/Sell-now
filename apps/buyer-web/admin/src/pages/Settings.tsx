import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Settings = () => {
    const [earnWithUsLink, setEarnWithUsLink] = useState('');
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'https://demobackend.pasiware.cloud/api';

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/settings`);
            setEarnWithUsLink(data.earnWithUsLink);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch settings');
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            await axios.put(`${API_URL}/settings`, { earnWithUsLink }, config);
            toast.success('Settings updated successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update settings');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">App Settings</h1>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-2xl">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        "Earn With Us" App Link (Play Store)
                    </label>
                    <input
                        type="text"
                        value={earnWithUsLink}
                        onChange={(e) => setEarnWithUsLink(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="https://play.google.com/store/apps/details?id=..."
                    />
                    <p className="text-gray-500 text-xs mt-1">
                        This link will be opened when users click the "Earn With Us" button in the Buyer App.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default Settings;

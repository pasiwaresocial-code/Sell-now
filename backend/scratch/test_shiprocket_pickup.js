require('dotenv').config();
require('dns').setServers(['8.8.8.8']);
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Address = require('../models/Address');
const shiprocketController = require('../controllers/shiprocketController');

const testShiprocket = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
        console.log('Connected.');

        // Find the latest order
        const order = await Order.findOne().sort({ createdAt: -1 });
        if (!order) {
            console.log('No order found.');
            process.exit(0);
        }
        console.log('Testing with Order Seller ID:', order.seller);

        const sellerId = order.seller;
        
        // Mock request and response objects to call createShiprocketOrder directly?
        // Or just call addPickupLocation directly. Wait, addPickupLocation is not exported.
        // It's internal to the controller. I will just run the logic here.
        
        const axios = require('axios');
        const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
        
        const login = async () => {
            const response = await axios.post(`${BASE_URL}/auth/login`, {
                email: process.env.SHIPROCKET_EMAIL,
                password: process.env.SHIPROCKET_PASSWORD
            });
            return response.data.token;
        };
        
        const token = await login();
        console.log('Logged in to Shiprocket.');
        
        const sellerAddress = await Address.findOne({ user: sellerId });
        const seller = await User.findById(sellerId);
        
        if (!sellerAddress) {
            console.log('Seller has no address.');
            process.exit(0);
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        
        const nickname = `Seller_${sellerId}`;
        const payload = {
            pickup_location: nickname,
            name: sellerAddress.name,
            email: seller.email,
            phone: sellerAddress.phone,
            address: sellerAddress.street,
            address_2: sellerAddress.addressLine2 || '',
            city: sellerAddress.city,
            state: sellerAddress.state,
            country: 'India',
            pin_code: sellerAddress.zip
        };
        
        console.log('Payload:', payload);
        
        try {
            const res = await axios.post(`${BASE_URL}/settings/company/addpickup`, payload, { headers });
            console.log('Success:', res.data);
        } catch (error) {
            console.error('Shiprocket Error Data:', JSON.stringify(error.response?.data, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error.message);
        process.exit(1);
    }
};

testShiprocket();

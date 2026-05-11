const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Address = require('../models/Address');
const User = require('../models/User');
const Order = require('../models/Order');

// Shiprocket API Configuration
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let token = null;

// Helper: Authenticate and get token
const login = async () => {
    try {
        if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
            throw new Error('Shiprocket credentials not configured');
        }

        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: SHIPROCKET_EMAIL,
            password: SHIPROCKET_PASSWORD
        });

        token = response.data.token;
        return token;
    } catch (error) {
        console.error('Shiprocket Login Error:', error.response?.data || error.message);
        throw error;
    }
};

// Helper: Sanitize Phone Number (Keep last 10 digits)
const sanitizePhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, ''); // Remove non-digits
    return cleaned.slice(-10); // Return last 10 digits (handles +91 prefix)
};

// Helper: Get headers
const getHeaders = async () => {
    if (!token) await login();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

/*
 * @desc    Add Pickup Location to Shiprocket
 * Returns the pickup_location nickname
 */
const addPickupLocation = async (sellerId) => {
    try {
        const sellerAddress = await Address.findOne({ user: sellerId });
        const seller = await User.findById(sellerId);

        if (!sellerAddress) {
            throw new Error('Seller has not added an address yet.');
        }

        const headers = await getHeaders();
        const nickname = `Seller_${sellerId}`; // Unique nickname for this seller

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

        try {
            await axios.post(`${BASE_URL}/settings/company/addpickup`, payload, { headers });
            console.log(`Pickup location added: ${nickname}`);
        } catch (error) {
            let errorData = error.response?.data || {};
            let errorMessageString = JSON.stringify(errorData);

            // Check specifically for "inactive" in the error message
            // Shiprocket returns nested JSON in 'message' sometimes
            let isInactive = false;

            if (errorData.message) {
                if (typeof errorData.message === 'string' && errorData.message.includes('inactive')) {
                    isInactive = true;
                } else if (typeof errorData.message === 'object' && JSON.stringify(errorData.message).includes('inactive')) {
                    isInactive = true;
                }
                // Try to parse if it looks like JSON string
                if (typeof errorData.message === 'string' && errorData.message.startsWith('{')) {
                    try {
                        const searchData = JSON.parse(errorData.message);
                        if (JSON.stringify(searchData).includes('inactive')) isInactive = true;
                    } catch (e) { }
                }
            }

            if (isInactive) {
                console.log(`Pickup location ${nickname} is inactive. Retrying with new nickname...`);
                // Fix: Keep nickname under 36 chars.
                // Base: "S_" + last 8 chars of ID + "_" + 5 random digits = 2 + 8 + 1 + 5 = 16 chars. Safe.
                const shortId = sellerId.toString().slice(-8);
                const randomSuffix = Math.floor(10000 + Math.random() * 90000); // 5 digits
                const newNickname = `S_${shortId}_${randomSuffix}`;

                payload.pickup_location = newNickname;
                try {
                    await axios.post(`${BASE_URL}/settings/company/addpickup`, payload, { headers });
                    console.log(`Pickup location added with new nickname: ${newNickname}`);
                    return newNickname;
                } catch (retryError) {
                    console.error('Retry add pickup location failed:', retryError.response?.data);
                    throw retryError;
                }
            } else if (errorMessageString.includes('already exists') || error.response?.status === 422) {
                console.log(`Pickup location ${nickname} already exists (ignoring duplicate).`);
                // Safe to proceed as we assume the existing one is active if it didn't say "inactive"
            } else {
                throw error; // Rethrow other errors
            }
        }

        return nickname;
    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error('Add Pickup Location Error Details:', JSON.stringify(errorData));
        fs.appendFileSync(path.join(__dirname, '..', 'logs', 'debug_shiprocket.txt'), `\n[PICKUP ERROR]: ${JSON.stringify(errorData)}\n`);
        throw error;
    }
};

/*
 * @desc    Create Order in Shiprocket
 * @route   POST /api/shiprocket/create-order/:orderId
 * @access  Private (Seller/Admin)
 */
const createShiprocketOrder = async (req, res) => {
    let payload = {};
    try {
        const { orderId } = req.params;
        const { length, breadth, height, weight } = req.body; // Package dimensions

        const order = await Order.findById(orderId).populate('items.product');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.shiprocket && order.shiprocket.orderId) {
            return res.status(400).json({ message: 'Order already created in Shiprocket' });
        }

        // Prepare Order Items
        const orderItems = order.items.map(item => ({
            name: item.title,
            sku: item.product.sku || item.product._id,
            units: item.quantity,
            selling_price: item.price,
            discount: 0,
            tax: 0,
            hsn: 0
        }));

        // --- AUTOMATIC PICKUP LOCATION ---
        // 1. Get Seller ID from Order
        const sellerId = order.seller;

        // 2. Add/Verify Pickup Location in Shiprocket
        // This ensures the seller's address is registered as a pickup point.
        let pickupLocationName;
        try {
            pickupLocationName = await addPickupLocation(sellerId);
        } catch (pickupError) {
            console.error("Failed to add pickup location automatically:", pickupError.message);
            // Return clear error to user
            return res.status(400).json({
                message: `Failed to register Seller Address with Shiprocket.`,
                details: pickupError.response?.data || pickupError.message
            });
        }

        // Valid Phone Logic
        let billingPhone = sanitizePhone(order.deliveryAddress.phone);
        if (billingPhone.length !== 10) {
            console.log(`Invalid buyer phone: ${order.deliveryAddress.phone}. Using fallback.`);
            billingPhone = '9876543210'; // Standard dummy
        }

        // Valid Pincode Logic
        let billingPincode = order.deliveryAddress.pincode;
        if (!billingPincode || billingPincode.length !== 6 || isNaN(billingPincode)) {
            console.log(`Invalid pincode: ${billingPincode}. Using fallback 110001.`);
            billingPincode = 110001;
        }

        payload = {
            order_id: order.orderNumber || order._id,
            order_date: order.createdAt.toISOString().split('T')[0],
            pickup_location: pickupLocationName,
            billing_customer_name: order.deliveryAddress.name.split(' ')[0],
            billing_last_name: order.deliveryAddress.name.split(' ').slice(1).join(' ') || ' ',
            billing_address: order.deliveryAddress.addressLine1,
            billing_address_2: order.deliveryAddress.addressLine2 || '',
            billing_city: order.deliveryAddress.city,
            billing_pincode: billingPincode,
            billing_state: order.deliveryAddress.state,
            billing_country: 'India',
            billing_email: 'buyer@example.com',
            billing_phone: billingPhone,
            shipping_is_billing: true,
            order_items: orderItems,
            payment_method: order.paymentMethod.type === 'cod' ? 'COD' : 'Prepaid',
            sub_total: order.pricing.subtotal,
            length: length || 10,
            breadth: breadth || 10,
            height: height || 10,
            weight: weight || 0.5
        };

        const headers = await getHeaders();
        const response = await axios.post(`${BASE_URL}/orders/create/adhoc`, payload, { headers });

        // Update Order with Shiprocket Details
        order.shiprocket = {
            orderId: response.data.order_id,
            shipmentId: response.data.shipment_id
        };
        await order.save();

        res.json({ message: 'Order created in Shiprocket', data: response.data });
    } catch (error) {
        // Retry once on 401
        if (error.response?.status === 401) {
            token = null;
            return createShiprocketOrder(req, res);
        }

        const debugPath = path.join(__dirname, '..', 'logs', 'debug_shiprocket.txt');
        const errorLog = `\n[${new Date().toISOString()}] CREATE ORDER ERROR:\nMessage: ${error.message}\nResponse: ${JSON.stringify(error.response?.data)}\nPayload: ${JSON.stringify(payload)}\n`;
        fs.appendFileSync(debugPath, errorLog);

        console.error('Create Shiprocket Order Error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Failed to create Shiprocket order',
            details: error.response?.data || error.message
        });
    }
};

/*
 * @desc    Generate AWB
 * @route   POST /api/shiprocket/generate-awb
 * @access  Private (Seller/Admin)
 */
const generateAWB = async (req, res) => {
    try {
        const { shipmentId, courierId, mongoOrderId } = req.body;

        if (!shipmentId) return res.status(400).json({ message: 'Shipment ID is required' });

        const headers = await getHeaders();
        const payload = {
            shipment_id: shipmentId,
            courier_id: courierId || ''
        };

        const response = await axios.post(`${BASE_URL}/courier/assign/awb`, payload, { headers });

        console.log(`[Shiprocket] AWB Generated for Shipment ${shipmentId}:`, response.data);

        if (response.data.awb_assign_status === 1 && response.data.response?.data?.awb_code) {
            // Update DB - Prefer mongoOrderId if available
            let order;
            if (mongoOrderId) {
                order = await Order.findById(mongoOrderId);
            } else {
                order = await Order.findOne({ 'shiprocket.shipmentId': Number(shipmentId) });
            }

            if (order) {
                console.log(`[Shiprocket] Updating Order ${order._id} with AWB Code.`);
                order.shiprocket.awbCode = response.data.response.data.awb_code;
                order.shiprocket.courierName = response.data.response.data.courier_name;
                order.orderStatus = 'shipped'; // Auto update status
                await order.save();
                console.log(`[Shiprocket] Order updated successfully.`);
            } else {
                console.log(`[Shiprocket] Order NOT FOUND for Shipment ${shipmentId} (MongoID: ${mongoOrderId})`);
            }
        } else {
            console.error('[Shiprocket] AWB Assignment Failed:', response.data.message || response.data.awb_assign_error);
            // Do NOT update the order status if AWB failed
        }

        res.json(response.data);
    } catch (error) {
        if (error.response?.status === 401) {
            token = null;
            return generateAWB(req, res);
        }
        console.error('Generate AWB Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to generate AWB', details: error.response?.data });
    }
};

/*
 * @desc    Request Pickup
 * @route   POST /api/shiprocket/pickup
 */
const requestPickup = async (req, res) => {
    try {
        const { shipmentId } = req.body;
        const headers = await getHeaders();
        const response = await axios.post(`${BASE_URL}/courier/generate/pickup`, { shipment_id: [shipmentId] }, { headers });

        const order = await Order.findOne({ 'shiprocket.shipmentId': shipmentId });
        if (order) {
            order.shiprocket.pickupScheduled = true;
            await order.save();
        }

        res.json(response.data);
    } catch (error) {
        console.error('Pickup Request Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to schedule pickup', details: error.response?.data });
    }
};

/*
 * @desc    Get Tracking Data
 * @route   GET /api/shiprocket/track/:orderId
 */
const getTracking = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);

        if (!order || !order.shiprocket?.shipmentId) {
            return res.status(404).json({ message: 'Shipment not found for this order' });
        }

        const headers = await getHeaders();
        const response = await axios.get(`${BASE_URL}/courier/track/shipment/${order.shiprocket.shipmentId}`, { headers });

        const trackingData = response.data[order.shiprocket.shipmentId];

        // Update URL and ETD if available
        if (trackingData) {
            if (trackingData.track_url) {
                order.shiprocket.trackingUrl = trackingData.track_url;
            }
            if (trackingData.etd) {
                order.shiprocket.etd = new Date(trackingData.etd);
                // Also update the main expectedDelivery for consistency
                order.expectedDelivery = new Date(trackingData.etd);
            }
            await order.save();
        }

        res.json(trackingData);
    } catch (error) {
        console.error('Tracking Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to fetch tracking', details: error.response?.data });
    }
};

/*
 * @desc    Generate Label (AWB)
 * @route   POST /api/shiprocket/label
 */
const generateLabel = async (req, res) => {
    try {
        const { shipmentId } = req.body;
        const headers = await getHeaders();
        const response = await axios.post(`${BASE_URL}/courier/generate/label`, { shipment_id: [shipmentId] }, { headers });

        if (response.data.label_created) {
            res.json({ label_url: response.data.label_url });
        } else {
            res.status(400).json({ message: 'Label generation failed', details: response.data });
        }
    } catch (error) {
        console.error('Generate Label Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to generate label', details: error.response?.data });
    }
};

const createReturnOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).populate('items.product');

        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (!order.returnRequest?.isRequested) return res.status(400).json({ message: 'Return not requested' });

        // Check if return order already exists
        if (order.returnRequest.shiprocketReturn?.orderId) {
            return res.status(400).json({ message: 'Return order already created in Shiprocket' });
        }

        // 1. Get Seller Address (Destination for Return)
        const sellerAddress = await Address.findOne({ user: order.seller });
        if (!sellerAddress) return res.status(400).json({ message: 'Seller address not found' });

        // 2. Prepare Payload for Return Order (/orders/create/return)
        // Note: For returns, pickup_location is usually the Buyer's address, 
        // but Shiprocket Return API works differently. It usually maps valid pickup points.
        // However, generic "Quick Return" often flips the logic.
        // Let's use standard /orders/create/return API if available or create a forward order with type 'Return'.

        // Using Shiprocket '/orders/create/return' API
        // Pickup Location: Must be one of the seller's added pickup locations (Where courier will deliver TO)
        // Shiprocket logic: "pickup_location" in return order = WHERE TO DELIVER (Seller's Warehouse)

        let pickupLocationName = await addPickupLocation(order.seller);

        const orderItems = order.items.map(item => ({
            name: item.title,
            sku: item.product.sku || item.product._id,
            units: item.quantity,
            selling_price: item.price,
            discount: 0,
            tax: 0,
            hsn: 0
        }));

        // Valid Buyer Phone for Pickup
        let pickupPhone = sanitizePhone(order.deliveryAddress.phone);
        if (pickupPhone.length !== 10) {
            console.log(`Invalid buyer phone: ${order.deliveryAddress.phone}. Using fallback.`);
            pickupPhone = '9876543210';
        }

        const payload = {
            order_id: `RET_${order.orderNumber || order._id}`,
            order_date: new Date().toISOString().split('T')[0],
            channel_id: '',

            // PICKUP DETAILS (Buyer's Address)
            pickup_customer_name: order.deliveryAddress.name.split(' ')[0],
            pickup_last_name: order.deliveryAddress.name.split(' ').slice(1).join(' ') || '',
            pickup_address: order.deliveryAddress.addressLine1,
            pickup_address_2: order.deliveryAddress.addressLine2 || '',
            pickup_city: order.deliveryAddress.city,
            pickup_state: order.deliveryAddress.state,
            pickup_country: 'India',
            pickup_pincode: order.deliveryAddress.pincode,
            pickup_phone: pickupPhone,
            pickup_email: 'buyer@example.com',

            // SHIPPING DETAILS (Seller's Address / Destination)
            shipping_customer_name: sellerAddress.name,
            shipping_last_name: '',
            shipping_address: sellerAddress.street,
            shipping_address_2: sellerAddress.addressLine2 || '',
            shipping_city: sellerAddress.city,
            shipping_pincode: sellerAddress.zip,
            shipping_state: sellerAddress.state,
            shipping_country: 'India',
            shipping_phone: sanitizePhone(sellerAddress.phone),

            pickup_location: pickupLocationName, // Keep this as reference
            payment_method: 'Prepaid',
            total_amount: order.pricing.total,
            sub_total: order.pricing.subtotal,
            length: 10, breadth: 10, height: 10, weight: 0.5,
            order_items: orderItems
        };

        const headers = await getHeaders();
        const response = await axios.post(`${BASE_URL}/orders/create/return`, payload, { headers });

        // Update Order with Return Details
        order.returnRequest.shiprocketReturn = {
            orderId: response.data.order_id,
            shipmentId: response.data.shipment_id,
        };

        await order.save();
        res.json({ message: 'Return Order created', data: response.data });

    } catch (error) {
        console.error('Create Return Order Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to create return order', details: error.response?.data });
    }
};

module.exports = {
    createShiprocketOrder,
    generateAWB,
    requestPickup,
    getTracking,
    generateLabel,
    createReturnOrder
};

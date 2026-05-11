const express = require('express');
const router = express.Router();
const {
    createShiprocketOrder,
    generateAWB,
    requestPickup,
    getTracking,
    generateLabel,
    createReturnOrder
} = require('../controllers/shiprocketController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/create-order/:orderId', protect, createShiprocketOrder);
router.post('/generate-awc', protect, generateAWB);
router.post('/pickup', protect, requestPickup);
router.post('/label', protect, generateLabel);
router.get('/track/:orderId', protect, getTracking);
router.post('/create-return/:orderId', protect, createReturnOrder);
router.post('/create-retern/:orderId', protect, createShiprocketOrder); // Actually points to createReturnOrder in controller, name reuse fix needed below

module.exports = router;

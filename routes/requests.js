/**
 * مسارات طلبات الخدمة (Service Requests Routes)
 * 
 * @author عبدالرحمن صلاح الطوير
 * @description معالجة طلبات استئجار المعدات مع الموقع الجغرافي
 */

const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Equipment = require('../models/Equipment');
const { protect, isCustomer, isOwner } = require('../middleware/auth');

// @route   POST /api/requests
// @desc    Create service request
// @access  Private (Customer only)
router.post('/', protect, isCustomer, async (req, res) => {
    try {
        const { equipmentId, location, customerPhone, notes } = req.body;

        // Check if equipment exists
        const equipment = await Equipment.findById(equipmentId);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'المعدة غير موجودة'
            });
        }

        if (equipment.status === 'مشغولة') {
            return res.status(400).json({
                success: false,
                message: 'المعدة غير متاحة حالياً'
            });
        }

        // Create request
        const request = await Request.create({
            customer: req.user._id,
            equipment: equipmentId,
            location,
            customerPhone,
            notes
        });

        // Populate data for response
        await request.populate([
            { path: 'customer', select: 'name phone city' },
            { path: 'equipment', select: 'title category' }
        ]);

        res.status(201).json({
            success: true,
            message: 'تم إرسال الطلب بنجاح',
            data: request
        });
    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء إرسال الطلب',
            error: error.message
        });
    }
});

// @route   GET /api/requests/customer
// @desc    Get customer's requests
// @access  Private (Customer only)
router.get('/customer', protect, isCustomer, async (req, res) => {
    try {
        const requests = await Request.find({ customer: req.user._id })
            .populate('equipment', 'title category city images pricePerDay')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ',
            error: error.message
        });
    }
});

// @route   GET /api/requests/owner
// @desc    Get requests for owner's equipment
// @access  Private (Owner only)
router.get('/owner', protect, isOwner, async (req, res) => {
    try {
        // Find all equipment owned by this user
        const equipment = await Equipment.find({ owner: req.user._id });
        const equipmentIds = equipment.map(eq => eq._id);

        // Find all requests for this equipment
        const requests = await Request.find({
            equipment: { $in: equipmentIds }
        })
            .populate('customer', 'name phone city')
            .populate('equipment', 'title category')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Get owner requests error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ',
            error: error.message
        });
    }
});

// @route   PUT /api/requests/:id/status
// @desc    Update request status
// @access  Private (Owner can accept/complete, Customer can cancel)
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;

        const request = await Request.findById(req.params.id)
            .populate('equipment');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        // Check permissions
        const isRequestOwner = request.equipment.owner.toString() === req.user._id.toString();
        const isRequestCustomer = request.customer.toString() === req.user._id.toString();

        if (!isRequestOwner && !isRequestCustomer) {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بتعديل هذا الطلب'
            });
        }

        // Validate status transitions
        if (isRequestCustomer && status !== 'ملغي') {
            return res.status(403).json({
                success: false,
                message: 'يمكنك فقط إلغاء الطلب'
            });
        }

        if (isRequestOwner && !['مقبول', 'مكتمل'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'حالة غير صالحة'
            });
        }

        // Update request status
        request.status = status;
        await request.save();

        // Update equipment status if needed
        if (status === 'مقبول') {
            await Equipment.findByIdAndUpdate(request.equipment._id, { status: 'مشغولة' });
        } else if (status === 'مكتمل' || status === 'ملغي') {
            await Equipment.findByIdAndUpdate(request.equipment._id, { status: 'متاحة' });
        }

        await request.populate([
            { path: 'customer', select: 'name phone city' },
            { path: 'equipment', select: 'title category' }
        ]);

        res.json({
            success: true,
            message: 'تم تحديث حالة الطلب بنجاح',
            data: request
        });
    } catch (error) {
        console.error('Update request status error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تحديث حالة الطلب',
            error: error.message
        });
    }
});

module.exports = router;

/**
 * مسارات إدارة المعدات (Equipment Routes)
 * 
 * @author عبدالرحمن صلاح الطوير
 * @description عمليات CRUD للمعدات مع رفع الصور والفلترة
 */

const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const { protect, isOwner } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'equipment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('يسمح فقط بالصور (jpeg, jpg, png, webp)'));
        }
    }
});

// @route   GET /api/equipment
// @desc    Get all equipment with filters
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { city, category, search, status } = req.query;

        let query = {};

        if (city) query.city = city;
        if (category) query.category = category;
        if (status) query.status = status;

        // Text search
        if (search) {
            query.$text = { $search: search };
        }

        const equipment = await Equipment.find(query)
            .populate('owner', 'name phone city')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: equipment.length,
            data: equipment
        });
    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب المعدات',
            error: error.message
        });
    }
});

// @route   GET /api/equipment/:id
// @desc    Get single equipment
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id)
            .populate('owner', 'name phone city email');

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'المعدة غير موجودة'
            });
        }

        res.json({
            success: true,
            data: equipment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ',
            error: error.message
        });
    }
});

// @route   GET /api/equipment/owner/:ownerId
// @desc    Get equipment by owner
// @access  Public
router.get('/owner/:ownerId', async (req, res) => {
    try {
        const equipment = await Equipment.find({ owner: req.params.ownerId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: equipment.length,
            data: equipment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ',
            error: error.message
        });
    }
});

// @route   POST /api/equipment
// @desc    Create new equipment
// @access  Private (Owner only)
router.post('/', protect, isOwner, upload.array('images', 5), async (req, res) => {
    try {
        const { title, category, description, pricePerDay, pricePerHour, city, phoneNumber } = req.body;

        // Get uploaded image paths
        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        const equipment = await Equipment.create({
            owner: req.user._id,
            title,
            category,
            description,
            pricePerDay,
            pricePerHour,
            city,
            images,
            phoneNumber
        });

        res.status(201).json({
            success: true,
            message: 'تم إضافة المعدة بنجاح',
            data: equipment
        });
    } catch (error) {
        console.error('Create equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء إضافة المعدة',
            error: error.message
        });
    }
});

// @route   PUT /api/equipment/:id
// @desc    Update equipment
// @access  Private (Owner only)
router.put('/:id', protect, isOwner, upload.array('images', 5), async (req, res) => {
    try {
        let equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'المعدة غير موجودة'
            });
        }

        // Check ownership
        if (equipment.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بتعديل هذه المعدة'
            });
        }

        const { title, category, description, pricePerDay, pricePerHour, city, phoneNumber, status } = req.body;

        // Update fields
        const updateData = {
            title: title || equipment.title,
            category: category || equipment.category,
            description: description || equipment.description,
            pricePerDay: pricePerDay || equipment.pricePerDay,
            pricePerHour: pricePerHour !== undefined ? pricePerHour : equipment.pricePerHour,
            city: city || equipment.city,
            phoneNumber: phoneNumber || equipment.phoneNumber,
            status: status || equipment.status
        };

        // Add new images if uploaded
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/${file.filename}`);
            updateData.images = [...equipment.images, ...newImages];
        }

        equipment = await Equipment.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'تم تحديث المعدة بنجاح',
            data: equipment
        });
    } catch (error) {
        console.error('Update equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تحديث المعدة',
            error: error.message
        });
    }
});

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment
// @access  Private (Owner only)
router.delete('/:id', protect, isOwner, async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: 'المعدة غير موجودة'
            });
        }

        // Check ownership
        if (equipment.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بحذف هذه المعدة'
            });
        }

        // Delete images from filesystem
        equipment.images.forEach(imagePath => {
            const fullPath = path.join(__dirname, '..', 'public', imagePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        });

        await Equipment.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'تم حذف المعدة بنجاح'
        });
    } catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء حذف المعدة',
            error: error.message
        });
    }
});

module.exports = router;

/**
 * Middleware للمصادقة والترخيص
 * 
 * @author عبدالرحمن صلاح الطوير
 * @description التحقق من JWT والصلاحيات حسب الدور (owner/customer)
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح لك بالوصول إلى هذا المورد'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'رمز التحقق غير صالح'
        });
    }
};

// Check if user is owner
const isOwner = (req, res, next) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({
            success: false,
            message: 'هذا المورد متاح لأصحاب المعدات فقط'
        });
    }
    next();
};

// Check if user is customer
const isCustomer = (req, res, next) => {
    if (req.user.role !== 'customer') {
        return res.status(403).json({
            success: false,
            message: 'هذا المورد متاح للعملاء فقط'
        });
    }
    next();
};

module.exports = { protect, isOwner, isCustomer };

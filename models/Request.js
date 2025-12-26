/**
 * نموذج طلبات الخدمة (Service Request Model)
 * 
 * @author عبدالرحمن صلاح الطوير
 * @description طلبات العملاء لاستئجار المعدات مع الموقع الجغرافي
 */

const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: true
    },
    location: {
        lat: {
            type: Number,
            required: [true, 'خط العرض مطلوب']
        },
        lng: {
            type: Number,
            required: [true, 'خط الطول مطلوب']
        }
    },
    customerPhone: {
        type: String,
        required: [true, 'رقم هاتف العميل مطلوب']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'الملاحظات طويلة جداً']
    },
    status: {
        type: String,
        enum: ['قيد الانتظار', 'مقبول', 'مكتمل', 'ملغي'],
        default: 'قيد الانتظار'
    }
}, {
    timestamps: true
});

// Index for queries
requestSchema.index({ customer: 1, status: 1 });
requestSchema.index({ equipment: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema);

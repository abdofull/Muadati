/**
 * نموذج المعدات (Equipment Model)
 * 
 * @author عبدالرحمن صلاح الطوير
 * @description بيانات المعدات المتاحة للتأجير في النظام
 */

const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'عنوان المعدة مطلوب'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'فئة المعدة مطلوبة'],
        enum: [
            'منشار خشب',
            'شاحنة قمامة',
            'معدات ثقيلة',
            'حفارة',
            'رافعة',
            'جرافة',
            'خلاطة إسمنت',
            'مولد كهرباء',
            'ضاغط هواء',
            'أخرى'
        ]
    },
    description: {
        type: String,
        required: [true, 'وصف المعدة مطلوب'],
        trim: true,
        maxlength: [1000, 'الوصف طويل جداً']
    },
    pricePerDay: {
        type: Number,
        required: [true, 'سعر اليوم مطلوب'],
        min: [0, 'السعر يجب أن يكون موجباً']
    },
    pricePerHour: {
        type: Number,
        min: [0, 'السعر يجب أن يكون موجباً']
    },
    city: {
        type: String,
        required: [true, 'المدينة مطلوبة']
    },
    images: [{
        type: String
    }],
    phoneNumber: {
        type: String,
        required: [true, 'رقم الهاتف مطلوب'],
        match: [/^(091|092|093|094|095)\d{7}$/, 'رقم الهاتف غير صالح']
    },
    status: {
        type: String,
        enum: ['متاحة', 'مشغولة'],
        default: 'متاحة'
    }
}, {
    timestamps: true
});

// Index for search performance
equipmentSchema.index({ city: 1, category: 1, status: 1 });
equipmentSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Equipment', equipmentSchema);

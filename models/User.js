/**
 * نموذج المستخدم (User Model)
 * 
 * @author عبدالرحمن صلاح الطوير
 * @description يحتوي على بيانات المستخدمين في النظام (أصحاب المعدات والعملاء)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'الاسم مطلوب'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'البريد الإلكتروني مطلوب'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'البريد الإلكتروني غير صالح']
    },
    phone: {
        type: String,
        required: [true, 'رقم الهاتف مطلوب'],
        unique: true,
        trim: true,
        match: [/^(091|092|093|094|095)\d{7}$/, 'رقم الهاتف غير صالح']
    },
    password: {
        type: String,
        required: [true, 'كلمة المرور مطلوبة'],
        minlength: [6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'],
        select: false
    },
    role: {
        type: String,
        enum: ['owner', 'customer'],
        required: [true, 'الدور مطلوب']
    },
    city: {
        type: String,
        required: [true, 'المدينة مطلوبة']
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

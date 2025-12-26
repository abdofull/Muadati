/**
 * نظام معداتي - Libya Equipment Marketplace
 * ملف الخادم الرئيسي (Server Entry Point)
 * 
 * @author عبدالرحمن صلاح الطوير
 * @version 1.0.0
 * @description خادم Node.js مع Express لإدارة منصة تأجير المعدات في ليبيا
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// إعداد Middleware الأساسي
app.use(cors()); // السماح بطلبات من نطاقات مختلفة
app.use(express.json()); // قراءة JSON من الطلبات
app.use(express.urlencoded({ extended: true })); // قراءة البيانات من النماذج

// تقديم الملفات الثابتة (HTML, CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// الاتصال بقاعدة البيانات MongoDB Atlas
// ملاحظة: تأكد من إعداد ملف .env بشكل صحيح قبل التشغيل
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    })
    .catch((err) => {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
        process.exit(1); // إيقاف الخادم في حالة فشل الاتصال
    });

// استيراد مسارات API
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const requestRoutes = require('./routes/requests');

// ربط المسارات مع البادئات الخاصة بها
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/requests', requestRoutes);

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'حدث خطأ في الخادم',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// معالجة الصفحات غير الموجودة (404)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'الصفحة المطلوبة غير موجودة'
    });
});

// تشغيل الخادم على المنفذ المحدد
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`   الرابط: http://localhost:${PORT}`);
});

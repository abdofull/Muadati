import { API_BASE_URL } from './config.js';

// Create Axios-like instance
class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

    setToken(token) {
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.headers['Authorization'];
        }
    }

    async request(method, url, data = null, isFormData = false) {
        const options = {
            method,
            headers: isFormData ? { ...this.headers, 'Content-Type': undefined } : this.headers
        };

        // Remove Content-Type for FormData
        if (isFormData) {
            delete options.headers['Content-Type'];
        }

        if (data && method !== 'GET') {
            options.body = isFormData ? data : JSON.stringify(data);
        }

        const response = await fetch(`${this.baseURL}${url}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw result;
        }

        return result;
    }

    get(url) {
        return this.request('GET', url);
    }

    post(url, data, isFormData = false) {
        return this.request('POST', url, data, isFormData);
    }

    put(url, data, isFormData = false) {
        return this.request('PUT', url, data, isFormData);
    }

    delete(url) {
        return this.request('DELETE', url);
    }
}

// Create singleton instance
export const api = new ApiClient();

// Initialize token from localStorage
const token = localStorage.getItem('token');
if (token) {
    api.setToken(token);
}

// SweetAlert2 wrapper for Arabic notifications
export const showAlert = (title, text, icon = 'info') => {
    Swal.fire({
        title,
        text,
        icon,
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#f59e0b'
    });
};

export const showConfirm = async (title, text) => {
    const result = await Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#6b7280'
    });
    return result.isConfirmed;
};

export const showSuccess = (message) => {
    Swal.fire({
        icon: 'success',
        title: 'نجح!',
        text: message,
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#f59e0b',
        timer: 3000
    });
};

export const showError = (message) => {
    Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: message,
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#f59e0b'
    });
};

export const showLoading = (title = 'جاري التحميل...') => {
    Swal.fire({
        title,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
};

// LocalStorage helpers
export const setToken = (token) => {
    localStorage.setItem('token', token);
    api.setToken(token);
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const removeToken = () => {
    localStorage.removeItem('token');
    api.setToken(null);
};

export const setUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
    localStorage.removeItem('user');
};

export const logout = async () => {
    const result = await Swal.fire({
        title: 'تأكيد الخروج',
        text: 'هل أنت متأكد من تسجيل الخروج؟',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم، خروج',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#6b7280'
    });

    if (result.isConfirmed) {
        removeToken();
        removeUser();
        window.location.href = '/login.html';
    }
};

// Check authentication
export const isAuthenticated = () => {
    return !!getToken();
};

// Redirect if not authenticated
export const requireAuth = () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
};

// Redirect if authenticated
export const requireGuest = () => {
    if (isAuthenticated()) {
        const user = getUser();
        if (user && user.role === 'owner') {
            window.location.href = '/owner-dashboard.html';
        } else {
            window.location.href = '/home.html';
        }
        return false;
    }
    return true;
};

// Format date
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-LY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Format price
export const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-LY', {
        style: 'decimal',
        minimumFractionDigits: 0
    }).format(price) + ' دينار';
};

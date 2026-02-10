/* ===================================
   MONITORING PRIBADI - APP.JS
   Main JavaScript untuk koneksi dengan Google Apps Script
   =================================== */

// ===================================
// KONFIGURASI
// ===================================

const CONFIG = {
    // Ganti URL ini dengan URL Web App Google Apps Script Anda
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxXGGRMq623-oYWkjhkCUNeTzg-PMZMR3PPxvlc-EIhedc_3b4CnIXmGdPFjKC84CYrwA/exec',
    
    // Timeout untuk request (ms)
    REQUEST_TIMEOUT: 30000,
    
    // Format tanggal
    DATE_FORMAT: 'dd/MM/yyyy',
    
    // Zona waktu
    TIMEZONE: 'Asia/Jakarta'
};

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Fungsi untuk memanggil Google Apps Script
 */
async function callAppsScript(action, data = {}) {
    try {
        const requestData = {
            action: action,
            data: data,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'error') {
            throw new Error(result.message || 'Terjadi kesalahan pada server');
        }

        return result;
    } catch (error) {
        console.error('Error calling Apps Script:', error);
        showNotification('error', 'Gagal terhubung ke server: ' + error.message);
        throw error;
    }
}

/**
 * Format tanggal ke format Indonesia
 */
function formatDate(date, format = 'dd/MM/yyyy') {
    if (!date) return '-';
    
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    const formats = {
        'dd/MM/yyyy': `${day}/${month}/${year}`,
        'yyyy-MM-dd': `${year}-${month}-${day}`,
        'dd MMM yyyy': `${day} ${getMonthName(d.getMonth())} ${year}`,
        'long': d.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
    };
    
    return formats[format] || formats['dd/MM/yyyy'];
}

/**
 * Dapatkan nama bulan dalam bahasa Indonesia
 */
function getMonthName(monthIndex) {
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Oct', 'Nov', 'Des'
    ];
    return months[monthIndex];
}

/**
 * Format waktu (HH:MM)
 */
function formatTime(time) {
    if (!time) return '-';
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
}

/**
 * Tampilkan notifikasi
 */
function showNotification(type, message, duration = 3000) {
    // Hapus notifikasi yang ada
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Buat notifikasi baru
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        font-weight: 500;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Hapus setelah duration
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Toggle loading state
 */
function toggleLoading(element, isLoading) {
    if (isLoading) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

/**
 * Validasi form input
 */
function validateForm(formData, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
        if (!formData[field] || formData[field].toString().trim() === '') {
            errors.push(`${field} harus diisi`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Hitung persentase
 */
function calculatePercentage(value, total) {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Hitung selisih hari
 */
function daysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Dapatkan tanggal hari ini
 */
function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Dapatkan range tanggal (N hari terakhir)
 */
function getDateRange(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    return {
        start: formatDate(start, 'yyyy-MM-dd'),
        end: formatDate(end, 'yyyy-MM-dd')
    };
}

/**
 * Filter data berdasarkan tanggal
 */
function filterDataByDate(data, startDate, endDate) {
    return data.filter(item => {
        const itemDate = new Date(item.tanggal);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return itemDate >= start && itemDate <= end;
    });
}

/**
 * Group data berdasarkan periode
 */
function groupDataByPeriod(data, period = 'day') {
    const grouped = {};
    
    data.forEach(item => {
        const date = new Date(item.tanggal);
        let key;
        
        switch(period) {
            case 'day':
                key = formatDate(date, 'yyyy-MM-dd');
                break;
            case 'week':
                const weekNum = getWeekNumber(date);
                key = `${date.getFullYear()}-W${weekNum}`;
                break;
            case 'month':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
            case 'year':
                key = date.getFullYear().toString();
                break;
            default:
                key = formatDate(date, 'yyyy-MM-dd');
        }
        
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(item);
    });
    
    return grouped;
}

/**
 * Dapatkan nomor minggu dalam tahun
 */
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Hitung rata-rata array
 */
function calculateAverage(arr) {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return Math.round((sum / arr.length) * 100) / 100;
}

/**
 * Export data ke CSV
 */
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showNotification('warning', 'Tidak ada data untuk diekspor');
        return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => headers.map(field => {
            const value = row[field];
            return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${getToday()}.csv`;
    link.click();
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ===================================
// GLOBAL STATE
// ===================================

const AppState = {
    userData: null,
    currentPage: 'dashboard',
    isLoading: false,
    
    setUserData(data) {
        this.userData = data;
        localStorage.setItem('userData', JSON.stringify(data));
    },
    
    getUserData() {
        if (!this.userData) {
            const stored = localStorage.getItem('userData');
            this.userData = stored ? JSON.parse(stored) : null;
        }
        return this.userData;
    },
    
    clearUserData() {
        this.userData = null;
        localStorage.removeItem('userData');
    }
};

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Update current date display
    const dateDisplay = document.getElementById('currentDate');
    if (dateDisplay) {
        dateDisplay.textContent = formatDate(new Date(), 'long');
    }
    
    // Set active navigation based on current page
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (currentPath.includes(href)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Check if Apps Script URL is configured
    if (CONFIG.APPS_SCRIPT_URL === 'MASUKKAN_URL_APPS_SCRIPT_ANDA_DISINI') {
        console.warn('⚠️ Apps Script URL belum dikonfigurasi!');
        console.warn('Silakan update CONFIG.APPS_SCRIPT_URL di file app.js');
    }
});

// ===================================
// COMMON FUNCTIONS
// ===================================

/**
 * Fungsi untuk membuka pengaturan
 */
function openSettings() {
    showNotification('info', 'Fitur pengaturan akan segera tersedia');
}

/**
 * Fungsi untuk refresh data
 */
async function refreshData() {
    const btn = event.target.closest('.btn-refresh');
    toggleLoading(btn, true);
    
    try {
        // Reload halaman atau re-fetch data
        if (typeof loadDashboardData === 'function') {
            await loadDashboardData();
        } else if (typeof loadData === 'function') {
            await loadData();
        } else {
            location.reload();
        }
        
        showNotification('success', 'Data berhasil diperbarui');
    } catch (error) {
        showNotification('error', 'Gagal memperbarui data');
    } finally {
        toggleLoading(btn, false);
    }
}

/**
 * Fungsi untuk logout (clear session)
 */
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        AppState.clearUserData();
        window.location.href = 'index.html';
    }
}

// ===================================
// EXPORT FUNCTIONS
// ===================================

// Export fungsi-fungsi yang dibutuhkan
window.AppUtils = {
    callAppsScript,
    formatDate,
    formatTime,
    showNotification,
    toggleLoading,
    validateForm,
    calculatePercentage,
    daysDifference,
    getToday,
    getDateRange,
    filterDataByDate,
    groupDataByPeriod,
    calculateAverage,
    exportToCSV,
    debounce,
    deepClone
};

window.AppState = AppState;
window.CONFIG = CONFIG;

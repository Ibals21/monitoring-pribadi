/* ===================================
   DASHBOARD.JS
   JavaScript untuk Dashboard dengan Charts
   =================================== */

// ===================================
// CHART INSTANCES
// ===================================

let chartBeratBadan = null;
let chartTekananDarah = null;
let chartRataRata = null;
let chartSholat = null;

// ===================================
// DATA STORAGE
// ===================================

const DashboardData = {
    beratBadan: [],
    tekananDarah: [],
    sholat: [],
    currentFilter: {
        beratBadan: 'week',
        tekananDarah: 'week',
        sholat: 'month'
    }
};

// ===================================
// INITIALIZE DASHBOARD
// ===================================

document.addEventListener('DOMContentLoaded', async function() {
    await loadDashboardData();
    initializeCharts();
});

// ===================================
// LOAD DATA
// ===================================

async function loadDashboardData() {
    try {
        // Load data dari Google Apps Script
        const response = await AppUtils.callAppsScript('getDashboardData');
        
        if (response.status === 'success') {
            DashboardData.beratBadan = response.data.beratBadan || [];
            DashboardData.tekananDarah = response.data.tekananDarah || [];
            DashboardData.sholat = response.data.sholat || [];
            
            updateSummaryCards();
            updateAllCharts();
            updateRecentDataTable();
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Load sample data untuk development
        loadSampleData();
    }
}

/**
 * Load sample data untuk testing (hapus saat production)
 */
function loadSampleData() {
    // Sample data Berat Badan
    DashboardData.beratBadan = generateSampleBeratBadan();
    
    // Sample data Tekanan Darah
    DashboardData.tekananDarah = generateSampleTekananDarah();
    
    // Sample data Sholat
    DashboardData.sholat = generateSampleSholat();
    
    updateSummaryCards();
    updateAllCharts();
    updateRecentDataTable();
}

function generateSampleBeratBadan() {
    const data = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        data.push({
            tanggal: AppUtils.formatDate(date, 'yyyy-MM-dd'),
            pagi: 75 + Math.random() * 3,
            malam: 75.5 + Math.random() * 3
        });
    }
    
    return data;
}

function generateSampleTekananDarah() {
    const data = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        data.push({
            tanggal: AppUtils.formatDate(date, 'yyyy-MM-dd'),
            sistolik_pagi: 120 + Math.random() * 10,
            diastolik_pagi: 80 + Math.random() * 5,
            sistolik_malam: 118 + Math.random() * 12,
            diastolik_malam: 78 + Math.random() * 7
        });
    }
    
    return data;
}

function generateSampleSholat() {
    const data = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const total = Math.floor(Math.random() * 3) + 5; // 5-7 sholat
        
        data.push({
            tanggal: AppUtils.formatDate(date, 'yyyy-MM-dd'),
            subuh: Math.random() > 0.2,
            dzuhur: Math.random() > 0.15,
            ashar: Math.random() > 0.1,
            maghrib: Math.random() > 0.1,
            isya: Math.random() > 0.15,
            dhuha: Math.random() > 0.4,
            tahajud: Math.random() > 0.6,
            total: total
        });
    }
    
    return data;
}

// ===================================
// UPDATE SUMMARY CARDS
// ===================================

function updateSummaryCards() {
    // Berat Badan Card
    const latestBerat = DashboardData.beratBadan[DashboardData.beratBadan.length - 1];
    if (latestBerat) {
        const beratValue = latestBerat.malam || latestBerat.pagi || 0;
        document.getElementById('beratTerkini').textContent = `${beratValue.toFixed(1)} kg`;
        
        // Hitung perubahan
        if (DashboardData.beratBadan.length > 1) {
            const prevBerat = DashboardData.beratBadan[DashboardData.beratBadan.length - 2];
            const prevValue = prevBerat.malam || prevBerat.pagi || 0;
            const change = beratValue - prevValue;
            const changeEl = document.getElementById('beratChange');
            
            if (change > 0) {
                changeEl.textContent = `+${change.toFixed(1)} kg dari kemarin`;
                changeEl.className = 'card-change negative';
            } else if (change < 0) {
                changeEl.textContent = `${change.toFixed(1)} kg dari kemarin`;
                changeEl.className = 'card-change positive';
            } else {
                changeEl.textContent = 'Tidak ada perubahan';
                changeEl.className = 'card-change neutral';
            }
        }
    }
    
    // Tekanan Darah Card
    const latestTekanan = DashboardData.tekananDarah[DashboardData.tekananDarah.length - 1];
    if (latestTekanan) {
        const sistolik = Math.round(latestTekanan.sistolik_malam || latestTekanan.sistolik_pagi || 0);
        const diastolik = Math.round(latestTekanan.diastolik_malam || latestTekanan.diastolik_pagi || 0);
        
        document.getElementById('tekananTerkini').textContent = `${sistolik}/${diastolik} mmHg`;
        
        const changeEl = document.getElementById('tekananChange');
        if (sistolik >= 120 && sistolik < 130) {
            changeEl.textContent = 'Tekanan darah normal tinggi';
            changeEl.className = 'card-change neutral';
        } else if (sistolik < 120) {
            changeEl.textContent = 'Tekanan darah normal';
            changeEl.className = 'card-change positive';
        } else {
            changeEl.textContent = 'Perlu perhatian';
            changeEl.className = 'card-change negative';
        }
    }
    
    // Sholat Card
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const sholatBulanIni = DashboardData.sholat.filter(item => {
        const date = new Date(item.tanggal);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });
    
    if (sholatBulanIni.length > 0) {
        const totalSholat = sholatBulanIni.reduce((sum, item) => sum + item.total, 0);
        const maxSholat = sholatBulanIni.length * 7; // 7 sholat per hari
        const persentase = AppUtils.calculatePercentage(totalSholat, maxSholat);
        
        document.getElementById('sholatPersentase').textContent = `${persentase}%`;
        
        const statusEl = document.getElementById('sholatStatus');
        if (persentase >= 90) {
            statusEl.textContent = 'Sangat baik!';
            statusEl.className = 'card-change positive';
        } else if (persentase >= 70) {
            statusEl.textContent = 'Baik';
            statusEl.className = 'card-change neutral';
        } else {
            statusEl.textContent = 'Perlu ditingkatkan';
            statusEl.className = 'card-change negative';
        }
    }
}

// ===================================
// INITIALIZE CHARTS
// ===================================

function initializeCharts() {
    initChartBeratBadan();
    initChartTekananDarah();
    initChartRataRata();
    initChartSholat();
}

function initChartBeratBadan() {
    const ctx = document.getElementById('chartBeratBadan');
    if (!ctx) return;
    
    chartBeratBadan = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Pagi',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Malam',
                    data: [],
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value + ' kg';
                        }
                    }
                }
            }
        }
    });
}

function initChartTekananDarah() {
    const ctx = document.getElementById('chartTekananDarah');
    if (!ctx) return;
    
    chartTekananDarah = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Sistolik',
                    data: [],
                    borderColor: '#f5576c',
                    backgroundColor: 'rgba(245, 87, 108, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Diastolik',
                    data: [],
                    borderColor: '#f093fb',
                    backgroundColor: 'rgba(240, 147, 251, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value + ' mmHg';
                        }
                    }
                }
            }
        }
    });
}

function initChartRataRata() {
    const ctx = document.getElementById('chartRataRata');
    if (!ctx) return;
    
    chartRataRata = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Berat Badan (kg)',
                    data: [],
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    yAxisID: 'y'
                },
                {
                    label: 'Tekanan Sistolik (mmHg)',
                    data: [],
                    backgroundColor: 'rgba(245, 87, 108, 0.8)',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Berat Badan (kg)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Tekanan Darah (mmHg)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function initChartSholat() {
    const ctx = document.getElementById('chartSholat');
    if (!ctx) return;
    
    chartSholat = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya', 'Dhuha', 'Tahajud'],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f5576c',
                    '#f093fb',
                    '#4facfe',
                    '#00f2fe',
                    '#43e97b'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

// ===================================
// UPDATE CHARTS
// ===================================

function updateAllCharts() {
    updateChartBeratBadan(DashboardData.currentFilter.beratBadan);
    updateChartTekananDarah(DashboardData.currentFilter.tekananDarah);
    updateChartRataRata();
    updateChartSholat(DashboardData.currentFilter.sholat);
}

function updateChartBeratBadan(filter) {
    if (!chartBeratBadan) return;
    
    let data = [...DashboardData.beratBadan];
    const range = getFilterRange(filter);
    
    if (range) {
        data = AppUtils.filterDataByDate(data, range.start, range.end);
    }
    
    const labels = data.map(item => AppUtils.formatDate(item.tanggal, 'dd/MM'));
    const dataPagi = data.map(item => item.pagi);
    const dataMalam = data.map(item => item.malam);
    
    chartBeratBadan.data.labels = labels;
    chartBeratBadan.data.datasets[0].data = dataPagi;
    chartBeratBadan.data.datasets[1].data = dataMalam;
    chartBeratBadan.update();
}

function updateChartTekananDarah(filter) {
    if (!chartTekananDarah) return;
    
    let data = [...DashboardData.tekananDarah];
    const range = getFilterRange(filter);
    
    if (range) {
        data = AppUtils.filterDataByDate(data, range.start, range.end);
    }
    
    const labels = data.map(item => AppUtils.formatDate(item.tanggal, 'dd/MM'));
    const dataSistolik = data.map(item => (item.sistolik_pagi + item.sistolik_malam) / 2);
    const dataDiastolik = data.map(item => (item.diastolik_pagi + item.diastolik_malam) / 2);
    
    chartTekananDarah.data.labels = labels;
    chartTekananDarah.data.datasets[0].data = dataSistolik;
    chartTekananDarah.data.datasets[1].data = dataDiastolik;
    chartTekananDarah.update();
}

function updateChartRataRata() {
    if (!chartRataRata) return;
    
    // Group by month
    const grouped = {};
    
    DashboardData.beratBadan.forEach(item => {
        const date = new Date(item.tanggal);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!grouped[key]) {
            grouped[key] = { berat: [], tekanan: [] };
        }
        grouped[key].berat.push((item.pagi + item.malam) / 2);
    });
    
    DashboardData.tekananDarah.forEach(item => {
        const date = new Date(item.tanggal);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!grouped[key]) {
            grouped[key] = { berat: [], tekanan: [] };
        }
        grouped[key].tekanan.push((item.sistolik_pagi + item.sistolik_malam) / 2);
    });
    
    const labels = Object.keys(grouped).map(key => {
        const [year, month] = key.split('-');
        return `${AppUtils.getMonthName(parseInt(month) - 1)} ${year}`;
    });
    
    const dataBerat = Object.values(grouped).map(item => 
        AppUtils.calculateAverage(item.berat)
    );
    
    const dataTekanan = Object.values(grouped).map(item => 
        AppUtils.calculateAverage(item.tekanan)
    );
    
    chartRataRata.data.labels = labels;
    chartRataRata.data.datasets[0].data = dataBerat;
    chartRataRata.data.datasets[1].data = dataTekanan;
    chartRataRata.update();
}

function updateChartSholat(filter) {
    if (!chartSholat) return;
    
    let data = [...DashboardData.sholat];
    const range = filter === 'month' 
        ? getFilterRange('month')
        : getFilterRange('year');
    
    if (range) {
        data = AppUtils.filterDataByDate(data, range.start, range.end);
    }
    
    const counts = {
        subuh: 0,
        dzuhur: 0,
        ashar: 0,
        maghrib: 0,
        isya: 0,
        dhuha: 0,
        tahajud: 0
    };
    
    data.forEach(item => {
        if (item.subuh) counts.subuh++;
        if (item.dzuhur) counts.dzuhur++;
        if (item.ashar) counts.ashar++;
        if (item.maghrib) counts.maghrib++;
        if (item.isya) counts.isya++;
        if (item.dhuha) counts.dhuha++;
        if (item.tahajud) counts.tahajud++;
    });
    
    const total = data.length;
    const percentages = Object.values(counts).map(count => 
        AppUtils.calculatePercentage(count, total)
    );
    
    chartSholat.data.datasets[0].data = percentages;
    chartSholat.update();
}

// ===================================
// FILTER FUNCTIONS
// ===================================

function filterBeratBadan(period) {
    DashboardData.currentFilter.beratBadan = period;
    updateChartBeratBadan(period);
    updateFilterButtons(event.target);
}

function filterTekananDarah(period) {
    DashboardData.currentFilter.tekananDarah = period;
    updateChartTekananDarah(period);
    updateFilterButtons(event.target);
}

function filterSholat(period) {
    DashboardData.currentFilter.sholat = period;
    updateChartSholat(period);
    updateFilterButtons(event.target);
}

function updateFilterButtons(activeBtn) {
    const parent = activeBtn.parentElement;
    const buttons = parent.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

function getFilterRange(period) {
    const today = new Date();
    let start = new Date();
    
    switch(period) {
        case 'day':
            start.setDate(today.getDate() - 1);
            break;
        case 'week':
            start.setDate(today.getDate() - 7);
            break;
        case 'month':
            start.setMonth(today.getMonth() - 1);
            break;
        case 'year':
            start.setFullYear(today.getFullYear() - 1);
            break;
        default:
            return null;
    }
    
    return {
        start: AppUtils.formatDate(start, 'yyyy-MM-dd'),
        end: AppUtils.formatDate(today, 'yyyy-MM-dd')
    };
}

// ===================================
// UPDATE TABLE
// ===================================

function updateRecentDataTable() {
    const tbody = document.getElementById('recentDataBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Get last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const recentDates = [];
    for (let d = new Date(sevenDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
        recentDates.push(AppUtils.formatDate(new Date(d), 'yyyy-MM-dd'));
    }
    
    recentDates.reverse().forEach(date => {
        const beratData = DashboardData.beratBadan.find(item => item.tanggal === date);
        const tekananData = DashboardData.tekananDarah.find(item => item.tanggal === date);
        const sholatData = DashboardData.sholat.find(item => item.tanggal === date);
        
        const row = document.createElement('tr');
        
        // Tanggal
        const tdDate = document.createElement('td');
        tdDate.textContent = AppUtils.formatDate(date, 'dd MMM yyyy');
        row.appendChild(tdDate);
        
        // Berat Badan
        const tdBerat = document.createElement('td');
        if (beratData) {
            const avg = ((beratData.pagi || 0) + (beratData.malam || 0)) / 2;
            tdBerat.textContent = `${avg.toFixed(1)} kg`;
        } else {
            tdBerat.textContent = '-';
        }
        row.appendChild(tdBerat);
        
        // Tekanan Darah
        const tdTekanan = document.createElement('td');
        if (tekananData) {
            const sistolik = Math.round((tekananData.sistolik_pagi + tekananData.sistolik_malam) / 2);
            const diastolik = Math.round((tekananData.diastolik_pagi + tekananData.diastolik_malam) / 2);
            tdTekanan.textContent = `${sistolik}/${diastolik} mmHg`;
        } else {
            tdTekanan.textContent = '-';
        }
        row.appendChild(tdTekanan);
        
        // Sholat
        const tdSholat = document.createElement('td');
        if (sholatData) {
            tdSholat.textContent = `${sholatData.total}/7`;
        } else {
            tdSholat.textContent = '-';
        }
        row.appendChild(tdSholat);
        
        tbody.appendChild(row);
    });
}

// ===================================
// EXPORT FUNCTIONS
// ===================================

function exportReport() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.add('active');
        
        // Set default dates
        const today = AppUtils.getToday();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        document.getElementById('exportEndDate').value = today;
        document.getElementById('exportStartDate').value = AppUtils.formatDate(lastMonth, 'yyyy-MM-dd');
    }
}

function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function generatePDF() {
    const startDate = document.getElementById('exportStartDate').value;
    const endDate = document.getElementById('exportEndDate').value;
    
    const includeBeratBadan = document.getElementById('exportBeratBadan').checked;
    const includeTekananDarah = document.getElementById('exportTekananDarah').checked;
    const includeSholat = document.getElementById('exportSholat').checked;
    
    if (!startDate || !endDate) {
        AppUtils.showNotification('warning', 'Harap pilih tanggal mulai dan akhir');
        return;
    }
    
    try {
        const response = await AppUtils.callAppsScript('generatePDF', {
            startDate,
            endDate,
            includeBeratBadan,
            includeTekananDarah,
            includeSholat
        });
        
        if (response.status === 'success' && response.pdfUrl) {
            AppUtils.showNotification('success', 'PDF berhasil dibuat');
            window.open(response.pdfUrl, '_blank');
            closeExportModal();
        }
    } catch (error) {
        AppUtils.showNotification('error', 'Gagal membuat PDF');
    }
}

// Expose functions globally
window.filterBeratBadan = filterBeratBadan;
window.filterTekananDarah = filterTekananDarah;
window.filterSholat = filterSholat;
window.exportReport = exportReport;
window.closeExportModal = closeExportModal;
window.generatePDF = generatePDF;

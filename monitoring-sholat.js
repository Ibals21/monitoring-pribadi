let sholatHistory = [];

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('currentDate').textContent = AppUtils.formatDate(new Date(), 'long');
    document.getElementById('tanggalInput').value = AppUtils.getToday();
    loadData();
    updateChecklistUI();
});

async function loadData() {
    try {
        const response = await AppUtils.callAppsScript('getSholatHistory');
        if (response.status === 'success') {
            sholatHistory = response.data || [];
            displayHistory();
            loadTodayData();
        }
    } catch (error) {
        const saved = localStorage.getItem('history_sholat');
        if (saved) {
            sholatHistory = JSON.parse(saved);
            displayHistory();
            loadTodayData();
        }
    }
}

function loadTodayData() {
    const today = AppUtils.getToday();
    const todayData = sholatHistory.find(item => item.tanggal === today);
    
    if (todayData) {
        document.getElementById('subuh').checked = todayData.subuh;
        document.getElementById('dzuhur').checked = todayData.dzuhur;
        document.getElementById('ashar').checked = todayData.ashar;
        document.getElementById('maghrib').checked = todayData.maghrib;
        document.getElementById('isya').checked = todayData.isya;
        document.getElementById('dhuha').checked = todayData.dhuha;
        document.getElementById('tahajud').checked = todayData.tahajud;
        updateChecklistUI();
    }
}

function toggleCheckbox(id) {
    const checkbox = document.getElementById(id);
    checkbox.checked = !checkbox.checked;
    updateChecklistUI();
}

function updateChecklistUI() {
    const checkboxes = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya', 'dhuha', 'tahajud'];
    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        const parent = checkbox.closest('.checklist-item');
        if (checkbox.checked) {
            parent.classList.add('checked');
        } else {
            parent.classList.remove('checked');
        }
    });
}

async function saveSholat(event) {
    event.preventDefault();
    
    const formData = {
        tanggal: document.getElementById('tanggalInput').value,
        subuh: document.getElementById('subuh').checked,
        dzuhur: document.getElementById('dzuhur').checked,
        ashar: document.getElementById('ashar').checked,
        maghrib: document.getElementById('maghrib').checked,
        isya: document.getElementById('isya').checked,
        dhuha: document.getElementById('dhuha').checked,
        tahajud: document.getElementById('tahajud').checked
    };
    
    formData.total = [formData.subuh, formData.dzuhur, formData.ashar, formData.maghrib, formData.isya, formData.dhuha, formData.tahajud].filter(Boolean).length;
    
    try {
        const response = await AppUtils.callAppsScript('saveSholat', formData);
        if (response.status === 'success') {
            AppUtils.showNotification('success', 'Data sholat berhasil disimpan');
            
            const existingIndex = sholatHistory.findIndex(item => item.tanggal === formData.tanggal);
            if (existingIndex >= 0) {
                sholatHistory[existingIndex] = formData;
            } else {
                sholatHistory.unshift(formData);
            }
            
            localStorage.setItem('history_sholat', JSON.stringify(sholatHistory));
            displayHistory();
        }
    } catch (error) {
        const existingIndex = sholatHistory.findIndex(item => item.tanggal === formData.tanggal);
        if (existingIndex >= 0) {
            sholatHistory[existingIndex] = formData;
        } else {
            sholatHistory.unshift(formData);
        }
        
        localStorage.setItem('history_sholat', JSON.stringify(sholatHistory));
        AppUtils.showNotification('success', 'Data disimpan (offline mode)');
        displayHistory();
    }
}

function displayHistory() {
    const tbody = document.getElementById('riwayatBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (sholatHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">Belum ada data</td></tr>';
        return;
    }
    
    sholatHistory.slice(0, 30).forEach(item => {
        const lima = [item.subuh, item.dzuhur, item.ashar, item.maghrib, item.isya].filter(Boolean).length;
        const persentase = Math.round((item.total / 7) * 100);
        
        let persenClass = 'neutral';
        if (persentase >= 90) persenClass = 'positive';
        else if (persentase < 70) persenClass = 'negative';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${AppUtils.formatDate(item.tanggal, 'dd MMM yyyy')}</td>
            <td>${lima}/5</td>
            <td>${item.dhuha ? '✓' : '✗'}</td>
            <td>${item.tahajud ? '✓' : '✗'}</td>
            <td><strong>${item.total}/7</strong></td>
            <td><span class="card-change ${persenClass}">${persentase}%</span></td>
        `;
        tbody.appendChild(row);
    });
}

function resetForm() {
    document.getElementById('formSholat').reset();
    document.getElementById('tanggalInput').value = AppUtils.getToday();
    updateChecklistUI();
}

window.saveSholat = saveSholat;
window.resetForm = resetForm;
window.loadData = loadData;
window.toggleCheckbox = toggleCheckbox;

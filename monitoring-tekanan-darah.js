let tekananDarahHistory = [];

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('currentDate').textContent = AppUtils.formatDate(new Date(), 'long');
    document.getElementById('tanggalInput').value = AppUtils.getToday();
    loadData();
});

async function loadData() {
    try {
        const response = await AppUtils.callAppsScript('getTekananDarahHistory');
        if (response.status === 'success') {
            tekananDarahHistory = response.data || [];
            displayHistory();
        }
    } catch (error) {
        const saved = localStorage.getItem('history_tekananDarah');
        if (saved) {
            tekananDarahHistory = JSON.parse(saved);
            displayHistory();
        }
    }
}

async function saveTekananDarah(event) {
    event.preventDefault();
    
    const formData = {
        tanggal: document.getElementById('tanggalInput').value,
        sistolikPagi: parseInt(document.getElementById('sistolikPagi').value),
        diastolikPagi: parseInt(document.getElementById('diastolikPagi').value),
        sistolikMalam: parseInt(document.getElementById('sistolikMalam').value),
        diastolikMalam: parseInt(document.getElementById('diastolikMalam').value),
        sudahMinumObat: document.getElementById('sudahMinumObat').checked,
        makananPagi: document.getElementById('makananPagi').value,
        makananSiang: document.getElementById('makananSiang').value,
        makananMalam: document.getElementById('makananMalam').value
    };
    
    try {
        const response = await AppUtils.callAppsScript('saveTekananDarah', formData);
        if (response.status === 'success') {
            AppUtils.showNotification('success', 'Data berhasil disimpan');
            tekananDarahHistory.unshift(formData);
            localStorage.setItem('history_tekananDarah', JSON.stringify(tekananDarahHistory));
            resetForm();
            displayHistory();
        }
    } catch (error) {
        tekananDarahHistory.unshift(formData);
        localStorage.setItem('history_tekananDarah', JSON.stringify(tekananDarahHistory));
        AppUtils.showNotification('success', 'Data disimpan (offline mode)');
        resetForm();
        displayHistory();
    }
}

function displayHistory() {
    const tbody = document.getElementById('riwayatBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (tekananDarahHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">Belum ada data</td></tr>';
        return;
    }
    
    tekananDarahHistory.slice(0, 30).forEach(item => {
        const avgSistolik = Math.round((item.sistolikPagi + item.sistolikMalam) / 2);
        const avgDiastolik = Math.round((item.diastolikPagi + item.diastolikMalam) / 2);
        
        let status = 'Normal';
        let statusClass = 'positive';
        
        if (avgSistolik > 120 || avgDiastolik > 80) {
            status = 'Tinggi';
            statusClass = 'negative';
        } else if (avgSistolik < 90 || avgDiastolik < 60) {
            status = 'Rendah';
            statusClass = 'negative';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${AppUtils.formatDate(item.tanggal, 'dd MMM yyyy')}</td>
            <td>${item.sistolikPagi}/${item.diastolikPagi}</td>
            <td>${item.sistolikMalam}/${item.diastolikMalam}</td>
            <td>${item.sudahMinumObat ? '✓ Ya' : '✗ Tidak'}</td>
            <td><span class="card-change ${statusClass}">${status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function resetForm() {
    document.getElementById('formTekananDarah').reset();
    document.getElementById('tanggalInput').value = AppUtils.getToday();
}

window.saveTekananDarah = saveTekananDarah;
window.resetForm = resetForm;
window.loadData = loadData;

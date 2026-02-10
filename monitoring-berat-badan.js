/* ===================================
   MONITORING BERAT BADAN - JS
   =================================== */

let biodataExists = false;
let biodataData = null;
let beratBadanHistory = [];

// ===================================
// INITIALIZE
// ===================================

document.addEventListener('DOMContentLoaded', async function() {
    // Update tanggal
    const dateDisplay = document.getElementById('currentDate');
    if (dateDisplay) {
        dateDisplay.textContent = AppUtils.formatDate(new Date(), 'long');
    }
    
    // Set tanggal input ke hari ini
    document.getElementById('tanggalInput').value = AppUtils.getToday();
    
    // Load data
    await loadData();
});

// ===================================
// LOAD DATA
// ===================================

async function loadData() {
    try {
        // Load biodata
        const biodataResponse = await AppUtils.callAppsScript('getBiodata', {
            type: 'beratBadan'
        });
        
        if (biodataResponse.status === 'success' && biodataResponse.data) {
            biodataExists = true;
            biodataData = biodataResponse.data;
            showBiodataInfo();
            hideForm('biodataForm');
            showSection('inputHarianSection');
            showSection('riwayatSection');
            displayBeratIdeal();
        } else {
            biodataExists = false;
            showForm('biodataForm');
            hideSection('inputHarianSection');
            hideSection('riwayatSection');
            hideSection('biodataInfo');
        }
        
        // Load history
        const historyResponse = await AppUtils.callAppsScript('getBeratBadanHistory');
        
        if (historyResponse.status === 'success') {
            beratBadanHistory = historyResponse.data || [];
            displayHistory();
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        // Gunakan localStorage sebagai fallback
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    const savedBiodata = localStorage.getItem('biodata_beratBadan');
    const savedHistory = localStorage.getItem('history_beratBadan');
    
    if (savedBiodata) {
        biodataExists = true;
        biodataData = JSON.parse(savedBiodata);
        showBiodataInfo();
        hideForm('biodataForm');
        showSection('inputHarianSection');
        showSection('riwayatSection');
        displayBeratIdeal();
    }
    
    if (savedHistory) {
        beratBadanHistory = JSON.parse(savedHistory);
        displayHistory();
    }
}

// ===================================
// BIODATA FUNCTIONS
// ===================================

async function saveBiodata(event) {
    event.preventDefault();
    
    const formData = {
        namaLengkap: document.getElementById('namaLengkap').value,
        umur: parseInt(document.getElementById('umur').value),
        tempatLahir: document.getElementById('tempatLahir').value,
        tanggalLahir: document.getElementById('tanggalLahir').value,
        hobi: document.getElementById('hobi').value,
        pekerjaan: document.getElementById('pekerjaan').value,
        tinggiBadan: parseFloat(document.getElementById('tinggiBadan').value),
        beratBadanAwal: parseFloat(document.getElementById('beratBadanAwal').value)
    };
    
    try {
        const response = await AppUtils.callAppsScript('saveBiodata', {
            type: 'beratBadan',
            data: formData
        });
        
        if (response.status === 'success') {
            biodataData = formData;
            biodataExists = true;
            
            // Save to localStorage
            localStorage.setItem('biodata_beratBadan', JSON.stringify(formData));
            
            AppUtils.showNotification('success', 'Biodata berhasil disimpan');
            
            hideForm('biodataForm');
            showSection('inputHarianSection');
            showSection('riwayatSection');
            showBiodataInfo();
            displayBeratIdeal();
        }
    } catch (error) {
        // Fallback ke localStorage
        biodataData = formData;
        biodataExists = true;
        localStorage.setItem('biodata_beratBadan', JSON.stringify(formData));
        
        AppUtils.showNotification('success', 'Biodata disimpan (offline mode)');
        
        hideForm('biodataForm');
        showSection('inputHarianSection');
        showSection('riwayatSection');
        showBiodataInfo();
        displayBeratIdeal();
    }
}

function showBiodataInfo() {
    const biodataInfo = document.getElementById('biodataInfo');
    const biodataDisplay = document.getElementById('biodataDisplay');
    
    if (biodataData) {
        biodataDisplay.innerHTML = `
            <strong>${biodataData.namaLengkap}</strong><br>
            ${biodataData.umur} tahun | ${biodataData.pekerjaan}<br>
            Tinggi: ${biodataData.tinggiBadan} cm | Berat Awal: ${biodataData.beratBadanAwal} kg
        `;
        biodataInfo.style.display = 'block';
    }
}

function editBiodata() {
    // Populate form dengan data yang ada
    if (biodataData) {
        document.getElementById('namaLengkap').value = biodataData.namaLengkap;
        document.getElementById('umur').value = biodataData.umur;
        document.getElementById('tempatLahir').value = biodataData.tempatLahir;
        document.getElementById('tanggalLahir').value = biodataData.tanggalLahir;
        document.getElementById('hobi').value = biodataData.hobi || '';
        document.getElementById('pekerjaan').value = biodataData.pekerjaan;
        document.getElementById('tinggiBadan').value = biodataData.tinggiBadan;
        document.getElementById('beratBadanAwal').value = biodataData.beratBadanAwal;
    }
    
    showForm('biodataForm');
    hideSection('inputHarianSection');
    hideSection('riwayatSection');
}

function displayBeratIdeal() {
    if (!biodataData) return;
    
    const tinggi = biodataData.tinggiBadan / 100; // convert to meters
    const beratIdeal = Math.round((tinggi * tinggi * 22) * 10) / 10; // BMI 22 is ideal
    const beratMin = Math.round((tinggi * tinggi * 18.5) * 10) / 10;
    const beratMax = Math.round((tinggi * tinggi * 24.9) * 10) / 10;
    
    const beratIdealInfo = document.getElementById('beratIdealInfo');
    if (beratIdealInfo) {
        beratIdealInfo.innerHTML = `
            Berat ideal Anda: <strong>${beratIdeal} kg</strong><br>
            Range normal: ${beratMin} - ${beratMax} kg
        `;
    }
}

// ===================================
// INPUT HARIAN FUNCTIONS
// ===================================

async function saveBeratHarian(event) {
    event.preventDefault();
    
    const formData = {
        tanggal: document.getElementById('tanggalInput').value,
        beratPagi: parseFloat(document.getElementById('beratPagi').value),
        beratMalam: parseFloat(document.getElementById('beratMalam').value)
    };
    
    // Validasi
    if (!formData.tanggal || !formData.beratPagi || !formData.beratMalam) {
        AppUtils.showNotification('warning', 'Semua field harus diisi');
        return;
    }
    
    try {
        const response = await AppUtils.callAppsScript('saveBeratBadan', formData);
        
        if (response.status === 'success') {
            AppUtils.showNotification('success', 'Data berat badan berhasil disimpan');
            
            // Add to history
            beratBadanHistory.unshift({
                ...formData,
                rataRata: (formData.beratPagi + formData.beratMalam) / 2
            });
            
            // Save to localStorage
            localStorage.setItem('history_beratBadan', JSON.stringify(beratBadanHistory));
            
            // Reset form
            resetForm();
            
            // Update display
            displayHistory();
        }
    } catch (error) {
        // Fallback ke localStorage
        beratBadanHistory.unshift({
            ...formData,
            rataRata: (formData.beratPagi + formData.beratMalam) / 2
        });
        
        localStorage.setItem('history_beratBadan', JSON.stringify(beratBadanHistory));
        
        AppUtils.showNotification('success', 'Data disimpan (offline mode)');
        resetForm();
        displayHistory();
    }
}

function resetForm() {
    document.getElementById('formBeratHarian').reset();
    document.getElementById('tanggalInput').value = AppUtils.getToday();
}

// ===================================
// DISPLAY HISTORY
// ===================================

function displayHistory() {
    const tbody = document.getElementById('riwayatBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (beratBadanHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">Belum ada data</td></tr>';
        return;
    }
    
    // Show last 30 days
    const last30Days = beratBadanHistory.slice(0, 30);
    
    last30Days.forEach((item, index) => {
        const row = document.createElement('tr');
        
        const rataRata = (item.beratPagi + item.beratMalam) / 2;
        
        // Hitung perubahan
        let perubahan = '-';
        let perubahanClass = 'neutral';
        
        if (index < last30Days.length - 1) {
            const prevRataRata = (last30Days[index + 1].beratPagi + last30Days[index + 1].beratMalam) / 2;
            const diff = rataRata - prevRataRata;
            
            if (diff > 0) {
                perubahan = `+${diff.toFixed(1)} kg`;
                perubahanClass = 'negative';
            } else if (diff < 0) {
                perubahan = `${diff.toFixed(1)} kg`;
                perubahanClass = 'positive';
            } else {
                perubahan = '0 kg';
            }
        }
        
        row.innerHTML = `
            <td>${AppUtils.formatDate(item.tanggal, 'dd MMM yyyy')}</td>
            <td>${item.beratPagi.toFixed(1)}</td>
            <td>${item.beratMalam.toFixed(1)}</td>
            <td><strong>${rataRata.toFixed(1)}</strong></td>
            <td><span class="card-change ${perubahanClass}">${perubahan}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function showForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.style.display = 'block';
        form.classList.add('fade-in');
    }
}

function hideForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.style.display = 'none';
    }
}

function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        section.classList.add('fade-in');
    }
}

function hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'none';
    }
}

// Export functions
window.saveBiodata = saveBiodata;
window.editBiodata = editBiodata;
window.saveBeratHarian = saveBeratHarian;
window.resetForm = resetForm;
window.loadData = loadData;

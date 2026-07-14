/**
 * Universal POS Engine - Inventory Controller
 * CORE: IndexedDB Engine (Single Source of Truth)
 */

// 1. UI VIEW SWITCHER
function switchView(viewId) {
    document.querySelectorAll('.app-window').forEach(win => win.style.display = 'none');
    const target = document.getElementById(viewId);
    if (target) target.style.display = 'block';
}

// 2. STATE-DRIVEN UI REFRESHER
async function updateUI() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;

    try {
        // Fetch from IndexedDB exclusively
        const data = await window.localGetAll('inventory');
        tableBody.innerHTML = '';

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            const qty = parseInt(item.quantity || 0);

            if (qty < 5) row.className = 'low-stock-alert';

            row.dataset.item = JSON.stringify(item);
            row.dataset.index = index;
            row.innerHTML = `
                <td>${item.brandName || item.name || 'Unknown'}</td>
                <td>${item.batch || 'N/A'}</td>
                <td>${qty}</td>
                <td>${item.sellingPrice || 0} TZS</td>
                <td>${item.expiryDate || 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (e) {
        console.error("UI Refresh Failed:", e);
    }
}

// 3. INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for the DB to be ready
    await window.initIndexedDB();
    updateUI();

    // Event Delegation for Fixer (Double Click)
    const tableBody = document.getElementById('inventory-table-body');
    if (tableBody) {
        tableBody.addEventListener('dblclick', (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            const item = JSON.parse(row.dataset.item);
            
            document.getElementById('quick-fixer-deck').style.display = 'block';
            document.getElementById('fix-item-title').innerText = item.brandName || item.name;
            document.getElementById('fix-item-index').value = row.dataset.index;
            document.getElementById('fix-batch').value = item.batch || "";
            document.getElementById('fix-qty').value = item.quantity || 0;
            document.getElementById('fix-exp').value = item.expiryDate || "";
            document.getElementById('fix-price').value = item.sellingPrice || 0;
        });
    }
});

// 4. DATABASE CORRECTION ENGINE
async function applyDatabaseFix() {
    const updatedData = { /* ... your data ... */ };

    // 1. Save locally (Instant feedback)
    await window.localWrite('inventory', updatedData);
    
    // 2. Queue for MongoDB (Reliable sync)
    await window.addToSyncQueue('UPDATE_PRODUCT', updatedData);
    
    closeFixer();
    updateUI();
}

   
// 5. UTILITIES
function closeFixer() { 
    document.getElementById('quick-fixer-deck').style.display = 'none'; 
}

// Search Logic
const listSearch = document.getElementById('list-search');
if (listSearch) {
    listSearch.addEventListener('keyup', function() {
        let filter = this.value.toLowerCase();
        let rows = document.getElementById('inventory-table-body').getElementsByTagName('tr');
        for (let row of rows) {
            row.style.display = row.innerText.toLowerCase().includes(filter) ? '' : 'none';
        }
    });
}
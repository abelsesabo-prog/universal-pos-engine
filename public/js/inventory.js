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

    // Auto-Search Logic for Inventory Input
    const invSearch = document.getElementById('inv-search');
    if (invSearch) {
        invSearch.addEventListener('input', async function() {
            const query = this.value.toLowerCase();
            if (query.length < 2) return; 

            const allItems = await window.localGetAll('inventory');
            const match = allItems.find(p => 
                (p.brandName && p.brandName.toLowerCase().includes(query)) || 
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.genericName && p.genericName.toLowerCase().includes(query))
            );

            if (match) {
                document.getElementById('inv-generic').value = match.genericName || '';
                document.getElementById('inv-brand').value = match.brandName || '';
                document.getElementById('inv-strength-form').value = match.strengthForm || '';
                document.getElementById('inv-manufacturer').value = match.manufacturer || '';
                document.getElementById('inv-agency').value = match.regAgency || '';
                document.getElementById('inv-reg-num').value = match.regNumber || '';
            }
        });
    }
});

// 4. ADD & SYNC LOGIC
async function saveBatch() {
    const data = {
        name: document.getElementById('inv-brand').value,
        brandName: document.getElementById('inv-brand').value,
        genericName: document.getElementById('inv-generic').value,
        batch: document.getElementById('inv-batch').value,
        quantity: parseInt(document.getElementById('inv-qty').value),
        expiryDate: document.getElementById('inv-exp-date').value,
        sellingPrice: parseFloat(document.getElementById('inv-price').value),
        costPrice: parseFloat(document.getElementById('inv-cost').value)
    };

    await window.localWrite('inventory', data);
    await window.addToSyncQueue('ADD_BATCH', data);
    alert('Batch saved successfully!');
    updateUI();
}

async function saveNewItem() {
    const data = {
        name: document.getElementById('inv-brand').value,
        brandName: document.getElementById('inv-brand').value,
        genericName: document.getElementById('inv-generic').value,
        strengthForm: document.getElementById('inv-strength-form').value,
        manufacturer: document.getElementById('inv-manufacturer').value,
        regAgency: document.getElementById('inv-agency').value,
        regNumber: document.getElementById('inv-reg-num').value,
        batch: document.getElementById('inv-batch').value,
        quantity: parseInt(document.getElementById('inv-qty').value),
        expiryDate: document.getElementById('inv-exp-date').value,
        sellingPrice: parseFloat(document.getElementById('inv-price').value),
        costPrice: parseFloat(document.getElementById('inv-cost').value)
    };

    await window.localWrite('inventory', data);
    await window.addToSyncQueue('ADD_PRODUCT', data);
    alert('New item saved successfully!');
    updateUI();
}

// 5. DATABASE CORRECTION ENGINE
async function applyDatabaseFix() {
    const updatedData = { 
        batch: document.getElementById('fix-batch').value,
        quantity: parseInt(document.getElementById('fix-qty').value),
        expiryDate: document.getElementById('fix-exp').value,
        sellingPrice: parseFloat(document.getElementById('fix-price').value)
    };

    await window.localWrite('inventory', updatedData);
    await window.addToSyncQueue('UPDATE_PRODUCT', updatedData);
    
    closeFixer();
    updateUI();
}

// 6. UTILITIES
function closeFixer() { 
    document.getElementById('quick-fixer-deck').style.display = 'none'; 
}

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
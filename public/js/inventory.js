/**
 * Universal POS Engine - Inventory Controller
 * Location: /js/inventory.js
 */

// 1. UI VIEW SWITCH ENGINE
function switchView(viewId) {
    document.querySelectorAll('.app-window').forEach(window => { window.style.display = 'none'; });
    const targetWindow = document.getElementById(viewId);
    if (targetWindow) { targetWindow.style.display = 'block'; }
}

// 2. DATABASE CORRECTION DECK
document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('inventory-table-body');
    if (tableBody) {
        tableBody.addEventListener('dblclick', function(e) {
            const row = e.target.closest('tr');
            if(!row || row.classList.contains('details-row')) return;
            
            const itemName = row.cells[0].innerText.split('\n')[0];
            let targetArray = window.inventory || window.inventoryItems || window.stockItems || [];
            
            // Fallback to local storage scan
            if(targetArray.length === 0 && typeof localStorage !== 'undefined') {
                for (let key in localStorage) {
                    if (key.toLowerCase().includes('inventory') || key.toLowerCase().includes('stock')) {
                        try { targetArray = JSON.parse(localStorage.getItem(key)); break; } catch(err){}
                    }
                }
            }
            
            let idx = targetArray.findIndex(item => (item.brandName || item.brand || item.name || "").toLowerCase().trim() === itemName.toLowerCase().trim());
            if(idx === -1) idx = Array.from(row.parentNode.children).indexOf(row) / 2; 

            const activeItem = targetArray[idx] || {};

            document.getElementById('quick-fixer-deck').style.display = 'block';
            document.getElementById('fix-item-title').innerText = itemName;
            document.getElementById('fix-item-index').value = idx;
            
            document.getElementById('fix-batch').value = activeItem.batch || activeItem.batchNo || "";
            document.getElementById('fix-qty').value = activeItem.quantity || activeItem.qty || activeItem.stock || 0;
            document.getElementById('fix-exp').value = ""; 
            document.getElementById('fix-price').value = activeItem.sellingPrice || activeItem.price || 0;
        });
    }
});

function closeFixer() {
    document.getElementById('quick-fixer-deck').style.display = 'none';
}

function applyDatabaseFix() {
    const idx = parseInt(document.getElementById('fix-item-index').value);
    const cleanBatch = document.getElementById('fix-batch').value;
    const cleanQty = parseInt(document.getElementById('fix-qty').value) || 0;
    const cleanExp = document.getElementById('fix-exp').value;
    const cleanPrice = parseFloat(document.getElementById('fix-price').value) || 0;

    let storageKey = 'inventory';
    let targetArray = window.inventory || window.inventoryItems || window.stockItems || [];
    
    if(targetArray.length === 0 && typeof localStorage !== 'undefined') {
        for (let key in localStorage) {
            if (key.toLowerCase().includes('inventory') || key.toLowerCase().includes('stock')) {
                storageKey = key;
                targetArray = JSON.parse(localStorage.getItem(key)) || [];
                break;
            }
        }
    }

    if (targetArray && targetArray[idx]) {
        const item = targetArray[idx];
        if('batch' in item) item.batch = cleanBatch;
        if('batchNo' in item) item.batchNo = cleanBatch;
        if('quantity' in item) item.quantity = cleanQty;
        if('qty' in item) item.qty = cleanQty;
        if('stock' in item) item.stock = cleanQty;
        if('expiry' in item) item.expiry = cleanExp;
        if('expiryDate' in item) item.expiryDate = cleanExp;
        if('sellingPrice' in item) item.sellingPrice = cleanPrice;
        if('price' in item) item.price = cleanPrice;

        if(typeof localStorage !== 'undefined') {
            localStorage.setItem(storageKey, JSON.stringify(targetArray));
        }
        alert("Database entries successfully overwritten! Refreshing...");
        location.reload();
    } else {
        alert("Error: Could not connect to data array. Please add manually via Search.");
    }
}

// 3. POS SEARCH SYNCHRONIZER
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById('pos-barcode');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            const visibleTbody = document.getElementById('inventory-body');
            if (!visibleTbody) return;

            let database = window.inventory || window.inventoryItems || window.stockItems || window.products || [];
            
            if (!query) { visibleTbody.innerHTML = ''; return; }

            const matches = database.filter(item => {
                const brand = (item.brandName || item.brand || item.name || '').toLowerCase();
                const generic = (item.genericName || item.generic || '').toLowerCase();
                const stockCount = parseInt(item.quantity || item.qty || item.stock || 0);
                const retailPrice = parseFloat(item.sellingPrice || item.price || 0);
                return (brand.includes(query) || generic.includes(query)) && stockCount > 0 && retailPrice > 0;
            });

            visibleTbody.innerHTML = '';
            matches.forEach((item) => {
                const name = item.brandName || item.brand || item.name || 'Unknown';
                const generic = item.genericName || item.generic || '';
                const stock = item.quantity || item.qty || item.stock || 0;
                const exp = item.expiry || item.expiryDate || 'N/A';
                const price = item.sellingPrice || item.price || 0;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>${name}</strong><br><small style="color:#64748b; font-style: italic;">${generic}</small></td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${stock} pcs</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${exp}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e3a8a;">${price} TZS</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><input type="number" value="1" min="1" max="${stock}" style="width: 55px;"></td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><select><option>Retail</option><option>Wholesale</option></select></td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${price} TZS</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><button onclick="alert('${name} selected!')">Add</button></td>
                `;
                visibleTbody.appendChild(row);
            });
        });
    }
});

// 4. INVOICE IMPORT ENGINE
function processInvoiceFile() {
    const fileInput = document.getElementById('invoice-file-input');
    const file = fileInput.files[0];
    if (!file) { alert("⚠️ Please choose an invoice file!"); return; }
    if (file.name.endsWith('.pdf')) { alert("🛑 Format Error: Please use .csv or .txt!"); return; }

    const reader = new FileReader();
    reader.onload = function(e) { executeDatabaseImport(e.target.result); };
    reader.readAsText(file);
}

function executeDatabaseImport(textData) {
    // Keep your existing import logic here
    console.log("Importing:", textData);
}
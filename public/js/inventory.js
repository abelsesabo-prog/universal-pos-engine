/**
 * Universal POS Engine - Inventory & Dictionary Controller
 * CORE: IndexedDB Engine (Single Source of Truth)
 */

// 1. UI VIEW SWITCHER
function switchView(viewId) {
    document.querySelectorAll('.app-window').forEach(win => win.style.display = 'none');
    const target = document.getElementById(viewId);
    if (target) target.style.display = 'block';
}

// 📚 2. DICTIONARY LOGIC (Zero-Latency Lookup)
function openDictionary() {
    document.getElementById('dict-modal').style.display = 'block';
    setTimeout(() => document.getElementById('dict-search').focus(), 50); // Auto-focus cursor
}

function closeDictionary() {
    document.getElementById('dict-modal').style.display = 'none';
    document.getElementById('dict-search').value = '';
    document.getElementById('dict-results').innerHTML = '<p style="color: #64748b; font-size: 0.9em; text-align: center;">Start typing to pull data...</p>';
}

// 3. STATE-DRIVEN UI REFRESHER
async function updateUI() {
    // Refresh Main Inventory Dashboard
    const tableBody = document.getElementById('inventory-table-body');
    if (tableBody) {
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
                    <td style="padding: 10px;">${item.brandName || item.name || 'Unknown'}</td>
                    <td style="padding: 10px;">${item.batch || 'N/A'}</td>
                    <td style="padding: 10px;">${qty}</td>
                    <td style="padding: 10px;">${item.sellingPrice || 0} TZS</td>
                    <td style="padding: 10px;">${item.expiryDate || 'N/A'}</td>
                `;
                tableBody.appendChild(row);
            });
        } catch (e) {
            console.error("Inventory UI Refresh Failed:", e);
        }
    }

    // Refresh Financial Ledger
    const finBody = document.getElementById('fin-body');
    if(finBody) {
        const finData = await window.localGetAll('financial_ledger');
        finBody.innerHTML = finData.map(e => `<tr><td>${e.type}</td><td>${e.amount}</td><td>${e.description}</td></tr>`).join('');
    }

    // Refresh Complaints
    const compBody = document.getElementById('comp-body');
    if(compBody) {
        const compData = await window.localGetAll('customer_complaints');
        compBody.innerHTML = compData.map(c => `<tr><td>${c.customer}</td><td>${c.issue}</td><td>${new Date(c.timestamp).toLocaleDateString()}</td></tr>`).join('');
    }
}

// 4. INITIALIZATION & EVENT LISTENERS
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for the DB to be ready
    await window.initIndexedDB();
    updateUI();

    // Event Delegation for Fixer Deck (Double Click)
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

    // Auto-Search Logic for Add Inventory Input Fields
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

    // 📚 Dictionary Modal Search Logic
    const dictSearch = document.getElementById('dict-search');
    if (dictSearch) {
        dictSearch.addEventListener('input', async function() {
            const query = this.value.toLowerCase();
            const resultsContainer = document.getElementById('dict-results');
            
            if (query.length < 2) {
                resultsContainer.innerHTML = '<p style="color: #64748b; font-size: 0.9em; text-align: center;">Start typing to pull data...</p>';
                return;
            }

            const allItems = await window.localGetAll('universal_dictionary');
            const matches = allItems.filter(item => 
                (item.name && item.name.toLowerCase().includes(query)) || 
                (item.genericName && item.genericName.toLowerCase().includes(query)) ||
                (item.category && item.category.toLowerCase().includes(query))
            );

            if (matches.length > 0) {
                resultsContainer.innerHTML = matches.map(m => `
                    <div style="border: 1px solid #cbd5e1; padding: 15px; margin-bottom: 10px; border-radius: 6px; background: #ffffff;">
                        <h3 style="margin: 0 0 5px 0; color: #1e3a8a;">${m.name} <span style="font-size: 0.75em; color: #64748b; font-weight: normal; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; vertical-align: middle;">${m.category}</span></h3>
                        <div style="display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 10px;">
                            <p style="margin: 0; font-size: 0.95em;"><strong>Form:</strong> ${m.form || 'N/A'}</p>
                            <p style="margin: 0; font-size: 0.95em;"><strong>Uses/Indications:</strong> ${m.uses || 'N/A'}</p>
                            <p style="margin: 0; font-size: 0.95em;"><strong>Dosage/Instructions:</strong> ${m.dosage || 'N/A'}</p>
                            <p style="margin: 0; font-size: 0.95em; color: #b91c1c;"><strong>Warnings:</strong> ${m.warnings || 'None listed'}</p>
                        </div>
                    </div>
                `).join('');
            } else {
                resultsContainer.innerHTML = `<p style="color: #ef4444; font-size: 0.9em; text-align: center; padding: 20px;">No matching items found for "<strong>${query}</strong>" in the dictionary.</p>`;
            }
        });
    }

    // List Search Filter for Inventory Dashboard
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
});

// 5. CORE BUSINESS LOGIC (Save & Sync)
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

async function saveFinancialEntry() {
    const data = {
        type: document.getElementById('fin-type').value,
        amount: document.getElementById('fin-amount').value,
        description: document.getElementById('fin-desc').value
    };
    await window.localWrite('financial_ledger', data);
    await window.addToSyncQueue('ADD_FINANCIAL', data);
    document.getElementById('financial-form').reset();
    updateUI();
}

async function saveComplaint() {
    const data = {
        customer: document.getElementById('comp-customer').value,
        issue: document.getElementById('comp-issue').value
    };
    await window.localWrite('customer_complaints', data);
    await window.addToSyncQueue('ADD_COMPLAINT', data);
    document.getElementById('complaints-form').reset();
    updateUI();
}

// 6. DATABASE CORRECTION ENGINE (Fixer Deck)
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

function closeFixer() { 
    document.getElementById('quick-fixer-deck').style.display = 'none'; 
}

function toggleInvoiceModal() {
    const modal = document.getElementById('invoice-modal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}
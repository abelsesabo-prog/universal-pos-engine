/**
 * Universal POS Engine - Inventory & Dictionary Controller
 */

// UI VIEW SWITCHER
function switchView(viewId) {
    document.querySelectorAll('.app-window').forEach(win => win.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';
}

// 📚 DICTIONARY LOGIC (Zero-Latency Lookup)
function openDictionary() {
    document.getElementById('dict-modal').style.display = 'block';
    setTimeout(() => document.getElementById('dict-search').focus(), 50); // Auto-focus cursor
}

function closeDictionary() {
    document.getElementById('dict-modal').style.display = 'none';
    document.getElementById('dict-search').value = '';
    document.getElementById('dict-results').innerHTML = '<p style="color: #64748b; font-size: 0.9em; text-align: center;">Start typing to pull data...</p>';
}

// DATABASE OPERATIONS & UI REFRESH
async function updateUI() {
    // Refresh Inventory
    const invData = await window.localGetAll('inventory');
    const invBody = document.getElementById('inventory-table-body');
    if(invBody) {
        invBody.innerHTML = invData.map(item => `<tr><td>${item.brandName || item.name}</td><td>${item.batch}</td><td>${item.quantity}</td><td>${item.sellingPrice}</td></tr>`).join('');
    }

    // Refresh Financials
    const finData = await window.localGetAll('financial_ledger');
    const finBody = document.getElementById('fin-body');
    if(finBody) {
        finBody.innerHTML = finData.map(e => `<tr><td>${e.type}</td><td>${e.amount}</td><td>${e.description}</td></tr>`).join('');
    }

    // Refresh Complaints
    const compData = await window.localGetAll('customer_complaints');
    const compBody = document.getElementById('comp-body');
    if(compBody) {
        compBody.innerHTML = compData.map(c => `<tr><td>${c.customer}</td><td>${c.issue}</td><td>${new Date(c.timestamp).toLocaleDateString()}</td></tr>`).join('');
    }
}

// BUSINESS LOGIC
async function saveFinancialEntry() {
    const data = {
        type: document.getElementById('fin-type').value,
        amount: document.getElementById('fin-amount').value,
        description: document.getElementById('fin-desc').value
    };
    await window.localWrite('financial_ledger', data);
    await window.addToSyncQueue('ADD_FINANCIAL', data);
    updateUI();
}

async function saveComplaint() {
    const data = {
        customer: document.getElementById('comp-customer').value,
        issue: document.getElementById('comp-issue').value
    };
    await window.localWrite('customer_complaints', data);
    await window.addToSyncQueue('ADD_COMPLAINT', data);
    updateUI();
}

// INVENTORY LOGIC
async function saveNewItem() {
    const data = {
        brandName: document.getElementById('inv-brand').value,
        genericName: document.getElementById('inv-generic').value,
        quantity: parseInt(document.getElementById('inv-qty').value),
        sellingPrice: parseFloat(document.getElementById('inv-price').value)
    };
    await window.localWrite('inventory', data);
    await window.addToSyncQueue('ADD_PRODUCT', data);
    updateUI();
}

// INIT & EVENT LISTENERS
document.addEventListener('DOMContentLoaded', async () => {
    await window.initIndexedDB();
    updateUI();

    // 📚 Dictionary Search Event Listener
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
});
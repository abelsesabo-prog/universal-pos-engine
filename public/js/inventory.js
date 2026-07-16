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

// ==========================================
// 7. INVOICE PROCESSING & POS EXPENSES
// ==========================================

async function processInvoiceFile() {
    const fileInput = document.getElementById('invoice-file-input');
    if (!fileInput.files.length) {
        alert('Please select a .csv or .txt invoice file first.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        const text = e.target.result;
        const rows = text.split('\n');
        let count = 0;

        // Reads columns: Brand, Quantity, Batch, Expiry, Cost
        for (let i = 1; i < rows.length; i++) { // Skip the header row (index 0)
            if (!rows[i].trim()) continue; // Skip empty rows
            
            const cols = rows[i].split(',');
            if (cols.length >= 5) {
                const data = {
                    brandName: cols[0].trim(),
                    name: cols[0].trim(),
                    quantity: parseInt(cols[1].trim()),
                    batch: cols[2].trim(),
                    expiryDate: cols[3].trim(),
                    costPrice: parseFloat(cols[4].trim()),
                    // Automatically adds a 30% markup to the cost price for selling price
                    sellingPrice: Math.round(parseFloat(cols[4].trim()) * 1.3)
                };
                await window.localWrite('inventory', data);
                await window.addToSyncQueue('ADD_PRODUCT', data);
                count++;
            }
        }
        alert(`✅ Successfully imported ${count} items from the invoice!`);
        toggleInvoiceModal();
        updateUI(); // Instantly refresh the UI
    };
    
    reader.readAsText(file);
}

// ==========================================
// 1. THE DICTIONARY (Semantic Mapping)
// ==========================================
const headerDictionary = {
    name: ['item', 'product', 'description', 'name', 'particulars', 'brand'],
    quantity: ['amount', 'qty', 'quantity', 'pieces', 'count', 'vol'],
    batch: ['batch', 'batch no', 'lot', 'bt', 'batch number'],
    expiryDate: ['exp', 'expiry', 'valid until', 'best before', 'date'],
    price: ['price', 'cost', 'unit price', 'rate', 'amount due']
};

// ==========================================
// 2. THE VALIDATOR (Preventing Mismatches)
// ==========================================
function isQuantity(value) {
    // Checks if the value is strictly a number (e.g., 50, 100)
    return !isNaN(value) && Number.isInteger(Number(value));
}

function isBatchNumber(value) {
    // Batch numbers usually have letters, numbers, and dashes (e.g., BT-499X, 1029A)
    // If it's pure text or a pure simple number, it might not be a batch.
    const strVal = String(value).trim();
    const hasLetters = /[a-zA-Z]/.test(strVal);
    const hasNumbers = /[0-9]/.test(strVal);
    return hasLetters && hasNumbers; 
}

// ==========================================
// 3. THE SMART MAPPER
// ==========================================
function formatInvoiceData(rawData) {
    console.log("Raw Data from File:", rawData);
    const cleanedInventory = [];

    rawData.forEach(row => {
        let cleanItem = {};

        // Loop through whatever weird headers the uploaded file has
        for (let originalHeader in row) {
            let val = row[originalHeader];
            let normalizedHeader = originalHeader.toLowerCase().trim();
            let matchedKey = null;

            // 1. Search the dictionary to translate the header
            for (let standardKey in headerDictionary) {
                if (headerDictionary[standardKey].some(alias => normalizedHeader.includes(alias))) {
                    matchedKey = standardKey;
                    break;
                }
            }

            // 2. Safety Check! Did we map it right?
            if (matchedKey === 'quantity') {
                // If the header said "Amount" but the value is "Paracetamol", it's a name, not a quantity!
                if (!isQuantity(val)) {
                    matchedKey = 'name'; 
                }
            }

            if (matchedKey === 'batch') {
                // If it thinks it's a batch, but it's exactly 500, it might be quantity misread
                if (isQuantity(val) && !isBatchNumber(val)) {
                    // Let's hold off on forcing it, but we log a warning
                    console.warn(`Verify Batch: ${val} looks like a quantity.`);
                }
            }

            // Assign the translated key (or keep the original if we don't know what it is)
            if (matchedKey) {
                cleanItem[matchedKey] = val;
            } else {
                cleanItem[normalizedHeader] = val; // Keep unmapped data just in case
            }
        }
        
        // Only push if the item has at least a name or quantity
        if (cleanItem.name || cleanItem.quantity) {
            cleanedInventory.push(cleanItem);
        }
    });

    console.log("🧠 Smart Mapped Inventory:", cleanedInventory);
    return cleanedInventory;
}

// ==========================================
// 4. THE FILE INGESTOR (BUTTON CLICK VERSION)
// ==========================================
document.getElementById('processSmartInvoiceBtn').addEventListener('click', function() {
    // Grab the file from the input when the button is clicked
    const fileInput = document.getElementById('smartUploader');
    const file = fileInput.files[0];
    
    if (!file) {
        alert("Please select a file first!");
        return;
    }

    const fileType = file.name.split('.').pop().toLowerCase();
    console.log(`Processing file type: ${fileType}`);

    // Route 1: Spreadsheets and Text
    if (['xlsx', 'xls', 'csv', 'txt'].includes(fileType)) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rawJson = XLSX.utils.sheet_to_json(worksheet);
            
            const finalData = formatInvoiceData(rawJson);
            alert(`Successfully processed ${finalData.length} items! Check console.`);
        };
        
        reader.readAsArrayBuffer(file);
    } 
    // Route 2: Documents (Handed off to backend)
    else if (['pdf', 'doc', 'docx'].includes(fileType)) {
        alert("PDF/Word detected. Since this is a document, we need the backend AI parser to read it. (Backend route coming soon!)");
    } else {
        alert("Unsupported file format.");
    }
});
    
               // POS Screen Expense Handlers
function showExpenseInput() { 
    document.getElementById('expense-input-row').style.display = 'block'; 
}

function hideExpenseInput() { 
    document.getElementById('expense-input-row').style.display = 'none'; 
}

function addCheckoutExpense() {
    const name = document.getElementById('exp-name').value;
    const amt = document.getElementById('exp-amt').value;
    
    if(name && amt) {
        const display = document.getElementById('expense-list-display');
        display.innerHTML += `<div style="color: #ef4444; margin-bottom: 3px;">- ${name}: ${amt} TZS</div>`;
        
        // Reset fields and hide
        document.getElementById('exp-name').value = '';
        document.getElementById('exp-amt').value = '';
        hideExpenseInput();
    } else {
        alert('Please enter both expense name and amount.');
    }
}
/**
 * Universal POS Engine - Dashboard Controller
 * CORE: IndexedDB Engine (Single Source of Truth)
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ensure DB engine is ready
    await window.initIndexedDB();

    // 2. Refresh all dashboard widgets
    await refreshDashboard();
});

async function refreshDashboard() {
    try {
        // Fetch data
        const financials = await window.localGetAll('financial_ledger') || [];
        const quarantine = await window.localGetAll('tmda_quarantine') || [];

        // Render Financials
        const finBody = document.querySelector('#financial-table tbody');
        if (finBody) {
            finBody.innerHTML = financials.length ? '' : '<tr><td colspan="3">No financial records found.</td></tr>';
            financials.forEach(entry => {
                finBody.innerHTML += `<tr><td>${entry.type}</td><td>${entry.amount}</td><td>${entry.description}</td></tr>`;
            });
        }

        // Render TMDA Quarantine
        const tmdaBody = document.querySelector('#tmda-table tbody');
        if (tmdaBody) {
            tmdaBody.innerHTML = quarantine.length ? '' : '<tr><td colspan="4">No quarantined items.</td></tr>';
            quarantine.forEach(entry => {
                tmdaBody.innerHTML += `<tr><td>${entry.productName}</td><td>${entry.quantityIsolated}</td><td>${entry.defectCategory}</td><td>${entry.financialLoss}</td></tr>`;
            });
        }
    } catch (err) {
        console.error("Dashboard failed to load data:", err);
    }
}
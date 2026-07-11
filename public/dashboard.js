document.addEventListener('DOMContentLoaded', async () => {
    // 1. MUST open the database first
    await window.initIndexedDB();

    // 2. Now render Financial Ledger
    try {
        const financials = await window.localGetAll('financial_ledger');
        const finBody = document.querySelector('#financial-table tbody');
        if (finBody && financials) {
            financials.forEach(entry => {
                finBody.innerHTML += `<tr><td>${entry.type}</td><td>${entry.amount}</td><td>${entry.description}</td></tr>`;
            });
        }

        // 3. Render TMDA Quarantine Ledger
        const quarantine = await window.localGetAll('tmda_quarantine');
        const tmdaBody = document.querySelector('#tmda-table tbody');
        if (tmdaBody && quarantine) {
            quarantine.forEach(entry => {
                tmdaBody.innerHTML += `<tr><td>${entry.productName}</td><td>${entry.quantityIsolated}</td><td>${entry.defectCategory}</td><td>${entry.financialLoss}</td></tr>`;
            });
        }
    } catch (err) {
        console.error("Dashboard failed to load data:", err);
    }
});
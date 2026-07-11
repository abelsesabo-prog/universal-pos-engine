// ==========================================
// START OF FILE: public/app.js
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize local IndexedDB engine architecture
    try {
        await window.initIndexedDB();
    } catch (err) {
        document.getElementById('sync-status').textContent = 'Database Engine Failure';
        document.getElementById('sync-status').style.color = '#ef4444';
    }

    // 2. Form Submission Handler for Financial Bookkeeping Records
    const financialForm = document.getElementById('financial-form');
    if (financialForm) {
        financialForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const entryData = {
                type: document.getElementById('fin-type').value,
                amount: parseFloat(document.getElementById('fin-amount').value),
                description: document.getElementById('fin-desc').value,
                timestamp: Date.now()
            };
            await window.localWrite('financial_ledger', entryData);
            alert('⚡ Financial Bookkeeping record committed instantly to Single-State Local Core!');
            financialForm.reset();
        });
    }

    // 3. Form Submission Handler for Customer Complaint Records
    const complaintForm = document.getElementById('complaint-form');
    if (complaintForm) {
        complaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const complaintData = {
                customer: document.getElementById('comp-customer').value,
                area: document.getElementById('comp-area').value,
                complaintText: document.getElementById('comp-text').value,
                status: 'PENDING_REVIEW',
                timestamp: Date.now()
            };
            await window.localWrite('customer_complaints', complaintData);
            alert('🎯 Complaint logged instantly to local store for system operations refinement.');
            complaintForm.reset();
        });
    }

    // 4. POS Continuous-Focus & Zero-Latency Cart Logic
    const posBarcode = document.getElementById('pos-barcode');
    const posCheckoutBtn = document.getElementById('pos-checkout-btn');

    // Continuous Focus setup
    if (posBarcode) {
        posBarcode.focus();
        document.addEventListener('click', (e) => {
            const activeTag = e.target.tagName;
            if (activeTag !== 'INPUT' && activeTag !== 'SELECT' && activeTag !== 'TEXTAREA' && activeTag !== 'BUTTON') {
                posBarcode.focus();
            }
        });
    }

    // --- CART AND INVENTORY LOGIC ---
    let activeCart = []; 
    
    // Inject test inventory if the database is empty
    async function seedAndLoadInventory() {
        let inventory = await window.localGetAll('inventory');
        if (inventory.length === 0) {
            console.log('Injecting Dummy Pharmaceutical Inventory...');
            await window.localWrite('inventory', { name: 'amoxicillin', brand: 'Amoxil', stock: 50, price: 5000, expiry: '2027-05-01' });
            await window.localWrite('inventory', { name: 'paracetamol', brand: 'Panadol', stock: 120, price: 1000, expiry: '2028-01-10' });
            await window.localWrite('inventory', { name: 'azithromycin', brand: 'Zithromax', stock: 0, price: 8000, expiry: '2026-11-20' });
            inventory = await window.localGetAll('inventory');
        }
        
        const catalogDiv = document.getElementById('smart-catalog');
        if (catalogDiv) {
            catalogDiv.innerHTML = '<h4 style="margin: 0 0 10px 0; border-bottom: 1px solid #475569; padding-bottom: 5px;">Live Inventory (In-Stock Only)</h4>';
            inventory.forEach(item => {
                if (item.stock > 0) {
                    catalogDiv.innerHTML += `<div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9rem;">
                        <span>${item.name.toUpperCase()} (${item.brand})</span>
                        <span>TZS ${item.price} | Stock: ${item.stock}</span>
                    </div>`;
                }
            });
        }
    }

    // Fire the inventory loader
    await seedAndLoadInventory();

    // Render the right-side cart with Secure Refund Buttons
    function renderCart() {
        const cartUl = document.getElementById('pos-cart');
        if (!cartUl) return;
        
        if (activeCart.length === 0) {
            cartUl.innerHTML = '<li style="color: gray; font-size: 0.85rem;">Cart is currently empty. Scan an item.</li>';
            return;
        }

        cartUl.innerHTML = '';
        let grandTotal = 0;

        activeCart.forEach((item, index) => {
            grandTotal += item.price;
            cartUl.innerHTML += `<li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #334155; padding-bottom: 5px;">
                <span>${item.name.toUpperCase()}</span>
                <span>
                    TZS ${item.price}
                    <button class="remove-btn" data-index="${index}" style="background: var(--accent-red); color: white; border: none; padding: 4px 8px; margin-left: 10px; border-radius: 4px; cursor: pointer; width: auto; font-weight: bold;">X</button>
                </span>
            </li>`;
        });

        cartUl.innerHTML += `<li style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; color: var(--accent-green);">
            <span>GRAND TOTAL:</span>
            <span>TZS ${grandTotal}</span>
        </li>`;
    }

    // Secure Refund Control: Listen for clicks on the 'X' remove buttons
    const cartUl = document.getElementById('pos-cart');
    if (cartUl) {
        cartUl.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const itemIndex = e.target.getAttribute('data-index');
                const itemToRemove = activeCart[itemIndex];
                
                // Trigger the mandatory justification prompt
                const justification = prompt(`SECURE REFUND CONTROL:\nYou are removing [${itemToRemove.name.toUpperCase()}].\nEnter an explicit written justification for this void/refund:`);
                
                if (justification !== null && justification.trim() !== '') {
                    // Valid justification provided! Remove item and re-render.
                    console.log(`[SECURITY AUDIT] Item Removed: ${itemToRemove.name}. Reason: ${justification}`);
                    alert(`✅ Item removed. Reason logged for manager review: "${justification}"`);
                    activeCart.splice(itemIndex, 1); // Remove from array
                    renderCart(); // Update the UI instantly
                    
                    // Reset focus back to the scanner instantly
                    if (posBarcode) posBarcode.focus();
                } else {
                    // Empty or cancelled justification
                    alert('❌ REFUND BLOCKED: You must provide a valid written justification to remove an item from the cart.');
                }
            }
        });
    }

    // Barcode Scanner Listener
    if (posBarcode) {
        posBarcode.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                
                const scanValue = posBarcode.value.trim().toLowerCase();
                if (!scanValue) return;

                const inventory = await window.localGetAll('inventory');
                const foundItem = inventory.find(i => i.name === scanValue || i.brand.toLowerCase() === scanValue);

                if (!foundItem) {
                    alert(`❌ ERROR: Product [${scanValue}] not found in database.`);
                } else if (foundItem.stock <= 0) {
                    alert(`⚠️ ILLEGAL SHORT-SALE: [${foundItem.name.toUpperCase()}] is out of stock!`);
                } else {
                    activeCart.push(foundItem);
                    renderCart();
                }
                
                posBarcode.value = ''; 
                posBarcode.focus();
            }
        });
    }

    // 6. Checkout Execution & EFD Receipt Generation
    if (posCheckoutBtn) {
        posCheckoutBtn.addEventListener('click', async () => {
            if (activeCart.length === 0) {
                alert('❌ Cannot process checkout. The cart is currently empty.');
                return;
            }

            const paymentType = document.getElementById('pos-payment-type').value;
            let grandTotal = 0;

            // Phase A: Process Database Deductions
            for (const cartItem of activeCart) {
                grandTotal += cartItem.price;
                const inventory = await window.localGetAll('inventory');
                const dbItem = inventory.find(i => i.name === cartItem.name);
                
                // Deduct 1 unit for each instance of the item in the cart array
                if (dbItem && dbItem.stock > 0) {
                    dbItem.stock -= 1;
                    await window.localWrite('inventory', dbItem);
                }
            }

            // Phase B: Auto-Log Revenue to Financial Bookkeeping
            const revenueData = {
                type: 'Revenue Inflow',
                amount: grandTotal,
                description: `Automated POS Checkout (${paymentType}) - ${activeCart.length} units sold.`,
                timestamp: Date.now()
            };
            await window.localWrite('financial_ledger', revenueData);

            // Phase C: Generate EFD Virtual Receipt
            const receiptWindow = window.open('', '_blank', 'width=400,height=600');
            if (receiptWindow) {
                let receiptHTML = `
                    <html>
                    <head><title>EFD Receipt</title></head>
                    <body style="font-family: monospace; width: 100%; max-width: 300px; margin: 0 auto; text-align: center; padding: 20px;">
                        <h2 style="margin-bottom: 5px;">ABEL PHARMACY</h2>
                        <p style="margin: 0; font-size: 12px;">Moshi Town</p>
                        <p style="margin: 0; font-size: 12px;">Date: ${new Date().toLocaleString()}</p>
                        <hr style="border: 1px dashed black; margin: 10px 0;">
                        <table style="width: 100%; text-align: left; font-size: 14px; margin-bottom: 10px;">
                            <thead>
                                <tr><th>Item</th><th style="text-align: right;">Price</th></tr>
                            </thead>
                            <tbody>
                `;

                activeCart.forEach(item => {
                    receiptHTML += `<tr><td>${item.name.toUpperCase()}</td><td style="text-align: right;">${item.price}</td></tr>`;
                });

                receiptHTML += `
                            </tbody>
                        </table>
                        <hr style="border: 1px dashed black; margin: 10px 0;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
                            <span>TOTAL:</span>
                            <span>TZS ${grandTotal}</span>
                        </div>
                        <p style="margin-top: 5px; font-size: 12px; text-align: left;">Payment: ${paymentType}</p>
                        <hr style="border: 1px dashed black; margin: 10px 0;">
                        <p style="font-size: 12px;">*** TRA EFD VIRTUAL RECEIPT ***</p>
                        <p style="font-size: 12px;">Thank you for your business!</p>
                        <script>
                            // Automatically trigger the print dialog when the window loads
                            window.onload = function() { window.print(); }
                        </script>
                    </body>
                    </html>
                `;
                receiptWindow.document.write(receiptHTML);
                receiptWindow.document.close();
            } else {
                alert('⚠️ Transaction successful, but the receipt popup was blocked by your browser. Please allow popups for localhost.');
            }

            // Phase D: Clear Cart and Reset UI
            activeCart = [];
            renderCart();
            await seedAndLoadInventory(); // Instantly refresh the Smart Grid to show new stock numbers
            
            // Snap focus back to the scanner for the next customer
            if (document.getElementById('pos-barcode')) {
                document.getElementById('pos-barcode').focus();
            }
        });
    }
    
    // 5. TMDA Quarantine Logic & Active Inventory Stripping
    const tmdaForm = document.getElementById('tmda-form');
    if (tmdaForm) {
        tmdaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const rawScan = document.getElementById('tmda-product').value.trim().toLowerCase();
            const qtyToQuarantine = parseInt(document.getElementById('tmda-qty').value);
            const defectReason = document.getElementById('tmda-reason').value;

            // Find the item in the active inventory
            const inventory = await window.localGetAll('inventory');
            const targetItem = inventory.find(i => i.name === rawScan || i.brand.toLowerCase() === rawScan);

            if (!targetItem) {
                alert(`❌ TMDA ERROR: Product [${rawScan}] not found in inventory.`);
                return;
            }

            if (targetItem.stock < qtyToQuarantine) {
                alert(`❌ TMDA ERROR: Cannot quarantine ${qtyToQuarantine} units. Only ${targetItem.stock} physically recorded in stock.`);
                return;
            }

            const financialLossValue = targetItem.price * qtyToQuarantine;

            // Phase A: Strip it from the active sales floor inventory
            targetItem.stock -= qtyToQuarantine;
            await window.localWrite('inventory', targetItem); // IndexedDB instantly overrides the old stock count

            // Phase B: Lock it into the isolated Quarantine Vault
            const quarantineData = {
                productName: targetItem.name.toUpperCase(),
                brand: targetItem.brand,
                quantityIsolated: qtyToQuarantine,
                defectCategory: defectReason,
                financialLoss: financialLossValue,
                timestamp: Date.now()
            };
            await window.localWrite('tmda_quarantine', quarantineData);

            // Notify the operator
            alert(`🔒 TMDA COMPLIANCE PROTOCOL EXECUTED:\n\n${qtyToQuarantine} units of ${targetItem.name.toUpperCase()} successfully stripped from active floor.\nAsset Loss Value: TZS ${financialLossValue}\n\nItem is now locked in the virtual quarantine vault for inspector write-off.`);

            tmdaForm.reset();
            
            // Instantly re-render the Smart Catalog Grid so cashiers see the updated stock levels immediately
            await seedAndLoadInventory();
        });
    }
    });
// ==========================================
// END OF FILE: public/app.js
// ==========================================
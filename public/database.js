// ==========================================
// START OF FILE: public/database.js
// ==========================================

const DB_NAME = 'UniversalEngineLocalDB';
const DB_VERSION = 1;
let db = null;

/**
 * Initializes the Zero-Latency UI Local Database (IndexedDB Architecture)
 * Sets up individual storage nodes for zero-blocking offline manipulation.
 */
function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB Critical Error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('⚡ Local Single-State IndexedDB Storage Engine Online.');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const localDB = event.target.result;

      // 1. Core Inventory Matrix Store
      if (!localDB.objectStoreNames.contains('inventory')) {
        localDB.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
      }

      // 2. Sales / Transaction Ledger Store
      if (!localDB.objectStoreNames.contains('transactions')) {
        localDB.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }

      // 3. TMDA Compliant Quarantine Vault Store
      if (!localDB.objectStoreNames.contains('tmda_quarantine')) {
        localDB.createObjectStore('tmda_quarantine', { keyPath: 'id', autoIncrement: true });
      }

      // 4. Offline Synchronizer Event Queue
      if (!localDB.objectStoreNames.contains('sync_queue')) {
        localDB.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }

      // NEW REQUIREMENT 1: Integrated Universal Financial Bookkeeping Ledger
      if (!localDB.objectStoreNames.contains('financial_ledger')) {
        localDB.createObjectStore('financial_ledger', { keyPath: 'id', autoIncrement: true });
      }

      // NEW REQUIREMENT 2: Universal Customer Complaints Tracking Log
      if (!localDB.objectStoreNames.contains('customer_complaints')) {
        localDB.createObjectStore('customer_complaints', { keyPath: 'id', autoIncrement: true });
      }

      console.log('📦 Database Schema Schemas Provisioned successfully.');
    };
  });
}

// --- UNIVERSAL POS ENGINE - MULTI-TENANT CORE ---
const CURRENT_TENANT = 'pharmacy_branch_01'; 

// Make init function accessible globally
window.initIndexedDB = initIndexedDB;

// 1. Unified Write Logic
window.localWrite = (storeName, data) => {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error("❌ Database is not open!");
            return reject("Database not initialized");
        }
        
        const dataWithTenant = { ...data, tenantId: CURRENT_TENANT, timestamp: Date.now() };
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        store.put(dataWithTenant);
        
        transaction.oncomplete = () => {
            console.log(`[TENANT:${CURRENT_TENANT}] Successfully saved to ${storeName}`);
            resolve();
        };
        transaction.onerror = (event) => reject(event.target.error);
    });
};

// 2. Unified Read Logic
window.localGetAll = (storeName) => {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error("❌ Database is not open!");
            return reject("Database not initialized");
        }

        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            const allData = request.result || [];
            
            // Allow items matching the tenant OR legacy items with no tenantId
            const filteredData = allData.filter(item => 
                item.tenantId === CURRENT_TENANT || !item.tenantId
            );
            
            resolve(filteredData);
        };
        request.onerror = (event) => reject(event.target.error);
    });
};

// Add a record to the sync queue
window.addToSyncQueue = async (action, data) => {
    const syncItem = {
        action: action, // e.g., 'POST_PRODUCT'
        payload: data,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    await window.localWrite('sync_queue', syncItem);
    attemptSync(); // Try to push to server immediately
};

// The Bridge: Push data to MongoDB
async function attemptSync() {
    if (!navigator.onLine) return; // Don't try if offline

    const queue = await window.localGetAll('sync_queue');
    const pendingItems = queue.filter(item => item.status === 'pending');

    for (const item of pendingItems) {
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.payload)
            });

            if (response.ok) {
                // Mark as synced or remove from queue
                console.log("✅ Synced successfully:", item.action);
                await window.localDelete('sync_queue', item.id);
            }
        } catch (err) {
            console.error("❌ Sync failed, will retry later:", err);
            break; // Stop loop on error
        }
    }
}

// Auto-sync when internet returns
window.addEventListener('online', attemptSync);
// ==========================================
// END OF FILE: public/database.js
// ==========================================

